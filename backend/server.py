"from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import math
import random
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title=\"GeoPlastic Shield API\")
api_router = APIRouter(prefix=\"/api\")


# -------------------------------
# Models
# -------------------------------
class OceanRegion(BaseModel):
    id: str
    name: str
    center_lat: float
    center_lng: float
    bounds: dict  # {min_lat, max_lat, min_lng, max_lng}


class Detection(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    lat: float
    lng: float
    fdi: float              # Floating Debris Index
    confidence: float       # CNN confidence 0..1
    biofouling: float       # biofouling correction factor 0..1
    area_m2: float
    severity: str           # \"low\" | \"moderate\" | \"high\" | \"critical\"
    detected_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ScanRequest(BaseModel):
    region_id: str
    satellite: Optional[str] = \"Sentinel-2\"
    include_biofouling: Optional[bool] = True


class ScanResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    region_id: str
    region_name: str
    satellite: str
    scanned_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    pixels_analyzed: int
    detections: List[Detection]
    hotspot_count: int
    avg_fdi: float
    avg_confidence: float
    coverage_km2: float


class TrajectoryPoint(BaseModel):
    hours_ahead: int
    lat: float
    lng: float
    drift_km: float


class TrajectoryResult(BaseModel):
    detection_id: str
    origin_lat: float
    origin_lng: float
    current_speed_knots: float
    wind_bearing_deg: float
    points: List[TrajectoryPoint]


class Alert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    message: str
    severity: str  # low|moderate|high|critical
    region_name: str
    lat: float
    lng: float
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    acknowledged: bool = False


# -------------------------------
# Static seeded regions (common plastic hotspot zones)
# -------------------------------
REGIONS: List[OceanRegion] = [
    OceanRegion(id=\"gpgp\", name=\"Great Pacific Garbage Patch\",
                center_lat=38.0, center_lng=-145.0,
                bounds={\"min_lat\": 32, \"max_lat\": 42, \"min_lng\": -155, \"max_lng\": -135}),
    OceanRegion(id=\"med\", name=\"Mediterranean Sea\",
                center_lat=38.5, center_lng=15.0,
                bounds={\"min_lat\": 32, \"max_lat\": 45, \"min_lng\": 0, \"max_lng\": 30}),
    OceanRegion(id=\"bay-bengal\", name=\"Bay of Bengal\",
                center_lat=15.0, center_lng=88.0,
                bounds={\"min_lat\": 8, \"max_lat\": 22, \"min_lng\": 80, \"max_lng\": 95}),
    OceanRegion(id=\"natl\", name=\"North Atlantic Gyre\",
                center_lat=30.0, center_lng=-45.0,
                bounds={\"min_lat\": 20, \"max_lat\": 40, \"min_lng\": -60, \"max_lng\": -30}),
    OceanRegion(id=\"satl\", name=\"South Atlantic Gyre\",
                center_lat=-30.0, center_lng=-20.0,
                bounds={\"min_lat\": -40, \"max_lat\": -20, \"min_lng\": -35, \"max_lng\": -5}),
    OceanRegion(id=\"indo\", name=\"Indonesian Archipelago\",
                center_lat=-2.0, center_lng=118.0,
                bounds={\"min_lat\": -10, \"max_lat\": 6, \"min_lng\": 95, \"max_lng\": 141}),
    OceanRegion(id=\"np\", name=\"North Pacific Gyre\",
                center_lat=25.0, center_lng=-160.0,
                bounds={\"min_lat\": 15, \"max_lat\": 35, \"min_lng\": -175, \"max_lng\": -140}),
    OceanRegion(id=\"sp\", name=\"South Pacific Gyre\",
                center_lat=-28.0, center_lng=-120.0,
                bounds={\"min_lat\": -40, \"max_lat\": -20, \"min_lng\": -140, \"max_lng\": -100}),
]

REGION_MAP = {r.id: r for r in REGIONS}


def _severity(fdi: float, confidence: float) -> str:
    score = fdi * confidence
    if score >= 0.7:
        return \"critical\"
    if score >= 0.5:
        return \"high\"
    if score >= 0.3:
        return \"moderate\"
    return \"low\"


def _simulate_detections(region: OceanRegion, n: int) -> List[Detection]:
    \"\"\"Simulate FDI-based CNN detections inside a region.\"\"\"
    dets: List[Detection] = []
    b = region.bounds
    for _ in range(n):
        lat = random.uniform(b[\"min_lat\"], b[\"max_lat\"])
        lng = random.uniform(b[\"min_lng\"], b[\"max_lng\"])
        # FDI: higher = more plastic-like signature
        fdi = round(random.betavariate(2, 3) * 0.9 + 0.05, 3)  # 0.05..0.95
        # CNN confidence correlated with FDI but noisy
        confidence = round(max(0.35, min(0.99, fdi + random.uniform(-0.15, 0.15))), 3)
        biofouling = round(random.uniform(0.1, 0.6), 3)
        area_m2 = round(random.uniform(2.5, 180.0) * (1 + fdi), 2)
        sev = _severity(fdi, confidence)
        dets.append(Detection(
            lat=round(lat, 4),
            lng=round(lng, 4),
            fdi=fdi,
            confidence=confidence,
            biofouling=biofouling,
            area_m2=area_m2,
            severity=sev,
        ))
    return dets


# -------------------------------
# Routes
# -------------------------------
@api_router.get(\"/\")
async def root():
    return {\"service\": \"GeoPlastic Shield\", \"status\": \"operational\"}


@api_router.get(\"/regions\", response_model=List[OceanRegion])
async def get_regions():
    return REGIONS


@api_router.get(\"/dashboard/stats\")
async def dashboard_stats():
    # Aggregate over stored scans; if empty, return seeded values
    total_scans = await db.scans.count_documents({})
    pipeline = [
        {\"$group\": {
            \"_id\": None,
            \"total_detections\": {\"$sum\": {\"$size\": \"$detections\"}},
            \"avg_fdi\": {\"$avg\": \"$avg_fdi\"},
            \"avg_conf\": {\"$avg\": \"$avg_confidence\"},
            \"coverage\": {\"$sum\": \"$coverage_km2\"},
        }}
    ]
    agg = await db.scans.aggregate(pipeline).to_list(1)
    if agg:
        a = agg[0]
        total_detections = int(a.get(\"total_detections\") or 0)
        avg_fdi = round(float(a.get(\"avg_fdi\") or 0), 3)
        avg_conf = round(float(a.get(\"avg_conf\") or 0), 3)
        coverage = round(float(a.get(\"coverage\") or 0), 1)
    else:
        total_detections = 0
        avg_fdi = 0.0
        avg_conf = 0.0
        coverage = 0.0

    active_alerts = await db.alerts.count_documents({\"acknowledged\": False})

    # 7-day trend — synthesize if no data, else compute from scans
    trend = []
    now = datetime.now(timezone.utc)
    for i in range(6, -1, -1):
        day = (now - timedelta(days=i)).date().isoformat()
        count = await db.scans.count_documents({
            \"scanned_at\": {
                \"$gte\": (now - timedelta(days=i+1)).isoformat(),
                \"$lt\":  (now - timedelta(days=i)).isoformat(),
            }
        })
        # seed with synthetic value if no data
        value = count * 12 if count > 0 else random.randint(20, 95)
        trend.append({\"date\": day, \"detections\": value})

    return {
        \"total_scans\": total_scans,
        \"total_detections\": total_detections or sum(t[\"detections\"] for t in trend),
        \"avg_fdi\": avg_fdi or 0.42,
        \"avg_confidence\": avg_conf or 0.81,
        \"coverage_km2\": coverage or 185420.0,
        \"active_alerts\": active_alerts,
        \"active_hotspots\": max(3, total_detections // 15 if total_detections else 7),
        \"trend_7d\": trend,
    }


@api_router.post(\"/scan\", response_model=ScanResult)
async def run_scan(req: ScanRequest):
    region = REGION_MAP.get(req.region_id)
    if not region:
        raise HTTPException(status_code=404, detail=\"Region not found\")

    n = random.randint(14, 32)
    detections = _simulate_detections(region, n)
    pixels = random.randint(180_000, 820_000)
    coverage = round(random.uniform(5_000, 45_000), 1)

    avg_fdi = round(sum(d.fdi for d in detections) / len(detections), 3)
    avg_conf = round(sum(d.confidence for d in detections) / len(detections), 3)
    hotspots = sum(1 for d in detections if d.severity in (\"high\", \"critical\"))

    result = ScanResult(
        region_id=region.id,
        region_name=region.name,
        satellite=req.satellite or \"Sentinel-2\",
        pixels_analyzed=pixels,
        detections=detections,
        hotspot_count=hotspots,
        avg_fdi=avg_fdi,
        avg_confidence=avg_conf,
        coverage_km2=coverage,
    )

    # persist
    await db.scans.insert_one(result.model_dump())

    # auto-generate alerts for critical detections
    for d in detections:
        if d.severity == \"critical\":
            alert = Alert(
                title=f\"Critical plastic concentration detected\",
                message=f\"FDI {d.fdi} @ confidence {int(d.confidence*100)}% — area ~{int(d.area_m2)} m²\",
                severity=\"critical\",
                region_name=region.name,
                lat=d.lat,
                lng=d.lng,
            )
            await db.alerts.insert_one(alert.model_dump())

    return result


@api_router.get(\"/scans\", response_model=List[ScanResult])
async def list_scans(limit: int = 20):
    cursor = db.scans.find({}, {\"_id\": 0}).sort(\"scanned_at\", -1).limit(limit)
    items = await cursor.to_list(limit)
    return [ScanResult(**x) for x in items]


@api_router.get(\"/hotspots\")
async def get_hotspots():
    \"\"\"Return top hotspot detections across all scans.\"\"\"
    cursor = db.scans.find({}, {\"_id\": 0, \"detections\": 1, \"region_name\": 1}).sort(\"scanned_at\", -1).limit(20)
    items = await cursor.to_list(20)
    hotspots = []
    for scan in items:
        for d in scan.get(\"detections\", []):
            if d.get(\"severity\") in (\"high\", \"critical\"):
                hotspots.append({**d, \"region_name\": scan.get(\"region_name\")})
    hotspots.sort(key=lambda x: x.get(\"fdi\", 0) * x.get(\"confidence\", 0), reverse=True)
    return hotspots[:30]


@api_router.post(\"/trajectory\", response_model=TrajectoryResult)
async def predict_trajectory(payload: dict):
    \"\"\"Predict drift over next 72 hours given origin lat/lng.
    Simulates ocean currents + wind influence.\"\"\"
    lat = float(payload.get(\"lat\"))
    lng = float(payload.get(\"lng\"))
    # simulate prevailing currents
    speed_knots = round(random.uniform(0.5, 2.8), 2)
    bearing = random.uniform(0, 360)
    bearing_rad = math.radians(bearing)

    points: List[TrajectoryPoint] = []
    # Add slight curvature to path for realism (wind shift)
    cur_lat, cur_lng = lat, lng
    for h in range(0, 73, 6):
        # drift per 6-hour block: knots * nm -> approx lat/lng deltas
        # 1 knot ≈ 1 nautical mile/hour; 1 nm ≈ 1/60 degree lat
        distance_nm = speed_knots * 6
        dlat = (distance_nm / 60) * math.cos(bearing_rad)
        dlng = (distance_nm / 60) * math.sin(bearing_rad) / max(0.3, math.cos(math.radians(cur_lat)))
        cur_lat += dlat
        cur_lng += dlng
        bearing_rad += math.radians(random.uniform(-8, 8))  # gentle wind shift
        drift_km = h * speed_knots * 1.852
        points.append(TrajectoryPoint(
            hours_ahead=h,
            lat=round(cur_lat, 4),
            lng=round(cur_lng, 4),
            drift_km=round(drift_km, 2),
        ))

    return TrajectoryResult(
        detection_id=payload.get(\"detection_id\", str(uuid.uuid4())),
        origin_lat=lat,
        origin_lng=lng,
        current_speed_knots=speed_knots,
        wind_bearing_deg=round(bearing, 1),
        points=points,
    )


@api_router.get(\"/alerts\", response_model=List[Alert])
async def list_alerts(only_active: bool = False, limit: int = 50):
    query = {\"acknowledged\": False} if only_active else {}
    cursor = db.alerts.find(query, {\"_id\": 0}).sort(\"created_at\", -1).limit(limit)
    items = await cursor.to_list(limit)
    return [Alert(**x) for x in items]


@api_router.post(\"/alerts/{alert_id}/acknowledge\")
async def acknowledge_alert(alert_id: str):
    res = await db.alerts.update_one({\"id\": alert_id}, {\"$set\": {\"acknowledged\": True}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail=\"Alert not found\")
    return {\"ok\": True}


@api_router.post(\"/seed\")
async def seed_demo_data():
    \"\"\"Seed several scans + alerts for instant demo experience.\"\"\"
    await db.scans.delete_many({})
    await db.alerts.delete_many({})
    seeded_scans = 0
    for region in REGIONS[:6]:
        n = random.randint(18, 28)
        detections = _simulate_detections(region, n)
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
        seeded_scans += 1
        # alerts
        for d in detections:
            if d.severity == \"critical\":
                alert = Alert(
                    title=\"Critical plastic concentration\",
                    message=f\"FDI {d.fdi} @ {int(d.confidence*100)}% confidence — ~{int(d.area_m2)} m²\",
                    severity=\"critical\",
                    region_name=region.name,
                    lat=d.lat,
                    lng=d.lng,
                )
                await db.alerts.insert_one(alert.model_dump())
            elif d.severity == \"high\" and random.random() < 0.3:
                alert = Alert(
                    title=\"High-severity plastic cluster\",
                    message=f\"FDI {d.fdi} detected — monitoring recommended\",
                    severity=\"high\",
                    region_name=region.name,
                    lat=d.lat,
                    lng=d.lng,
                )
                await db.alerts.insert_one(alert.model_dump())
    return {\"seeded_scans\": seeded_scans, \"status\": \"ok\"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[\"*\"],
    allow_methods=[\"*\"],
    allow_headers=[\"*\"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event(\"startup\")
async def _auto_seed_on_start():
    count = await db.scans.count_documents({})
    if count == 0:
        try:
            # auto-seed so dashboard is never empty
            await seed_demo_data()
            logger.info(\"Auto-seeded demo GeoPlastic data.\")
        except Exception as e:
            logger.warning(f\"Auto-seed failed: {e}\")


@app.on_event(\"shutdown\")
async def shutdown_db_client():
    client.close()
"
