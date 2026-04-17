""""Trajectory prediction route."""
import uuid

from fastapi import APIRouter

from controllers.simulation import predict_trajectory
from models import TrajectoryResult

router = APIRouter(tags=[\"trajectory\"])


@router.post(\"/trajectory\", response_model=TrajectoryResult)
async def trajectory(payload: dict):
    lat = float(payload.get(\"lat\"))
    lng = float(payload.get(\"lng\"))
    detection_id = payload.get(\"detection_id\") or str(uuid.uuid4())
    return predict_trajectory(lat, lng, detection_id)
"
