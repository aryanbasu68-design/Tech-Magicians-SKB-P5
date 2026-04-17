""""Scan-related routes: regions, run scan, list scans, hotspots, seed."""
import random
from typing import List

from fastapi import APIRouter, HTTPException

from controllers.simulation import (
    REGIONS, REGION_MAP, simulate_detections,
)
from db import db
from models import Alert, OceanRegion, ScanRequest, ScanResult

router = APIRouter(tags=[\"scans\"])


@router.get(\"/regions\", response_model=List[OceanRegion])
async def get_regions():
    return REGIONS


@router.post(\"/scan\", response_model=ScanResult)
async def run_scan(req: ScanRequest):
    region = REGION_MAP.get(req.region_id)
    if not region:
        raise HTTPException(status_code=404, detail=\"Region not found\")

    n = random.randint(14, 32)
    detections = simulate_detections(region, n)
    avg_fdi = round(sum(d.fdi for d in detections) / len(detections), 3)
    avg_conf = round(sum(d.confidence for d in detections) / len(detections), 3)
    hotspots = sum(1 for d in detections if d.severity in (\"high\", \"critical\"))

    result = ScanResult(
        region_id=region.id,
        region_name=region.name,
        satellite=req.satellite or \"Sentinel-2\",
        pixels_analyzed=random.randint(180_000, 820_000),
        detections=detections,
        hotspot_count=hotspots,
        avg_fdi=avg_fdi,
        avg_confidence=avg_conf,
        coverage_km2=round(random.uniform(5_000, 45_000), 1),
    )

    await db.scans.insert_one(result.model_dump())

    for d in detections:
        if d.severity == \"critical\":
            alert = Alert(
                title=\"Critical plastic concentration detected\",
                message=f\"FDI {d.fdi} @ confidence {int(d.confidence * 100)}% — area ~{int(d.area_m2)} m²\",
                severity=\"critical\",
                region_name=region.name,
                lat=d.lat, lng=d.lng,
            )
            await db.alerts.insert_one(alert.model_dump())

    return result


@router.get(\"/scans\", response_model=List[ScanResult])
async def list_scans(limit: int = 20):
    cursor = db.scans.find({}, {\"_id\": 0}).sort(\"scanned_at\", -1).limit(limit)
    items = await cursor.to_list(limit)
    return [ScanResult(**x) for x in items]


@router.get(\"/hotspots\")
async def get_hotspots():
    cursor = db.scans.find({}, {\"_id\": 0, \"detections\": 1, \"region_name\": 1})\
                     .sort(\"scanned_at\", -1).limit(20)
    items = await cursor.to_list(20)
    hotspots = []
    for scan in items:
        for d in scan.get(\"detections\", []):
            if d.get(\"severity\") in (\"high\", \"critical\"):
                hotspots.append({**d, \"region_name\": scan.get(\"region_name\")})
    hotspots.sort(key=lambda x: x.get(\"fdi\", 0) * x.get(\"confidence\", 0), reverse=True)
    return hotspots[:30]


@router.post(\"/seed\")
async def seed_demo_data():
    \"\"\"Wipe + re-seed demo scans & alerts so the dashboard is never empty.\"\"\"
    await db.scans.delete_many({})
    await db.alerts.delete_many({})
    seeded = 0
    for region in REGIONS[:6]:
        detections = simulate_detections(region, random.randint(18, 28))
        avg_fdi = round(sum(d.fdi for d in detections) / len(detections), 3)
        avg_conf = round(sum(d.confidence for d in detections) / len(detections), 3)
        hotspots = sum(1 for d in detections if d.severity in (\"high\", \"critical\"))
        result = ScanResult(
            region_id=region.id,
            region_name=region.name,
            satellite=random.choice([\"Sentinel-2\", \"Landsat-9\", \"Sentinel-3\"]),
            pixels_analyzed=random.randint(180_000, 820_000),
            detections=detections,
            hotspot_count=hotspots,
            avg_fdi=avg_fdi,
            avg_confidence=avg_conf,
            coverage_km2=round(random.uniform(5_000, 45_000), 1),
        )
        await db.scans.insert_one(result.model_dump())
        seeded += 1
        for d in detections:
            if d.severity == \"critical\":
                await db.alerts.insert_one(Alert(
                    title=\"Critical plastic concentration\",
                    message=f\"FDI {d.fdi} @ {int(d.confidence * 100)}% confidence\",
                    severity=\"critical\",
                    region_name=region.name,
                    lat=d.lat, lng=d.lng,
                ).model_dump())
            elif d.severity == \"high\" and random.random() < 0.3:
                await db.alerts.insert_one(Alert(
                    title=\"High-severity plastic cluster\",
                    message=f\"FDI {d.fdi} detected — monitoring recommended\",
                    severity=\"high\",
                    region_name=region.name,
                    lat=d.lat, lng=d.lng,
                ).model_dump())
    return {\"seeded_scans\": seeded, \"status\": \"ok\"}
"
