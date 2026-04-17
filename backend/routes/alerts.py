""""Alert routes."""
from typing import List

from fastapi import APIRouter, HTTPException

from db import db
from models import Alert

router = APIRouter(tags=[\"alerts\"])


@router.get(\"/alerts\", response_model=List[Alert])
async def list_alerts(only_active: bool = False, limit: int = 50):
    query = {\"acknowledged\": False} if only_active else {}
    cursor = db.alerts.find(query, {\"_id\": 0}).sort(\"created_at\", -1).limit(limit)
    items = await cursor.to_list(limit)
    return [Alert(**x) for x in items]


@router.post(\"/alerts/{alert_id}/acknowledge\")
async def acknowledge_alert(alert_id: str):
    res = await db.alerts.update_one({\"id\": alert_id}, {\"$set\": {\"acknowledged\": True}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail=\"Alert not found\")
    return {\"ok\": True}
"
