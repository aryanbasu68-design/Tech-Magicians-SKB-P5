""""Simulation controller — FDI, CNN confidence, biofouling, trajectory.

Everything in this module is SIMULATED. Replace with real models/feeds
to move from prototype → production.
"""
import math
import random
from typing import List

from models import Detection, OceanRegion, TrajectoryPoint, TrajectoryResult


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


def severity_for(fdi: float, confidence: float) -> str:
    score = fdi * confidence
    if score >= 0.7:
        return \"critical\"
    if score >= 0.5:
        return \"high\"
    if score >= 0.3:
        return \"moderate\"
    return \"low\"


def simulate_detections(region: OceanRegion, n: int) -> List[Detection]:
    \"\"\"Generate `n` sub-pixel CNN detections inside `region`.\"\"\"
    dets: List[Detection] = []
    b = region.bounds
    for _ in range(n):
        lat = random.uniform(b[\"min_lat\"], b[\"max_lat\"])
        lng = random.uniform(b[\"min_lng\"], b[\"max_lng\"])
        fdi = round(random.betavariate(2, 3) * 0.9 + 0.05, 3)
        confidence = round(max(0.35, min(0.99, fdi + random.uniform(-0.15, 0.15))), 3)
        biofouling = round(random.uniform(0.1, 0.6), 3)
        area_m2 = round(random.uniform(2.5, 180.0) * (1 + fdi), 2)
        dets.append(Detection(
            lat=round(lat, 4), lng=round(lng, 4),
            fdi=fdi, confidence=confidence,
            biofouling=biofouling, area_m2=area_m2,
            severity=severity_for(fdi, confidence),
        ))
    return dets


def predict_trajectory(lat: float, lng: float, detection_id: str) -> TrajectoryResult:
    \"\"\"Simulate 72-hour ocean drift.\"\"\"
    speed_knots = round(random.uniform(0.5, 2.8), 2)
    bearing = random.uniform(0, 360)
    bearing_rad = math.radians(bearing)

    cur_lat, cur_lng = lat, lng
    points: List[TrajectoryPoint] = []
    for h in range(0, 73, 6):
        distance_nm = speed_knots * 6
        dlat = (distance_nm / 60) * math.cos(bearing_rad)
        dlng = (distance_nm / 60) * math.sin(bearing_rad) / max(0.3, math.cos(math.radians(cur_lat)))
        cur_lat += dlat
        cur_lng += dlng
        bearing_rad += math.radians(random.uniform(-8, 8))
        drift_km = h * speed_knots * 1.852
        points.append(TrajectoryPoint(
            hours_ahead=h, lat=round(cur_lat, 4),
            lng=round(cur_lng, 4), drift_km=round(drift_km, 2),
        ))

    return TrajectoryResult(
        detection_id=detection_id,
        origin_lat=lat, origin_lng=lng,
        current_speed_knots=speed_knots,
        wind_bearing_deg=round(bearing, 1),
        points=points,
    )
"
