"""Pydantic request / response models."""
from datetime import datetime, timezone
from typing import List, Optional
import uuid
from pydantic import BaseModel, Field


class OceanRegion(BaseModel):
    id: str
    name: str
    center_lat: float
    center_lng: float
    bounds: dict  # min_lat, max_lat, min_lng, max_lng


class Detection(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    lat: float
    lng: float
    fdi: float
    confidence: float
    biofouling: float
    area_m2: float
    severity: str
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
    severity: str
    region_name: str
    lat: float
    lng: float
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    acknowledged: bool = False
"
