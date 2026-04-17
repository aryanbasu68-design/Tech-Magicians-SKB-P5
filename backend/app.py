""""GeoPlastic Shield — FastAPI entry point."""
import logging
from pathlib import Path

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI
from starlette.middleware.cors import CORSMiddleware

load_dotenv(Path(__file__).parent / \".env\")

# Import after env is loaded so db.py can read MONGO_URL/DB_NAME
from db import close_db, db  # noqa: E402
from routes import alerts, dashboard, scans, trajectory  # noqa: E402

app = FastAPI(title=\"GeoPlastic Shield API\")

api = APIRouter(prefix=\"/api\")
api.include_router(dashboard.router)
api.include_router(scans.router)
api.include_router(alerts.router)
api.include_router(trajectory.router)
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[\"*\"],
    allow_methods=[\"*\"],
    allow_headers=[\"*\"],
)

logging.basicConfig(level=logging.INFO,
                    format=\"%(asctime)s - %(name)s - %(levelname)s - %(message)s\")
logger = logging.getLogger(__name__)


@app.on_event(\"startup\")
async def _auto_seed_on_start():
    \"\"\"Auto-seed demo data so the dashboard is never empty on first run.\"\"\"
    if await db.scans.count_documents({}) == 0:
        try:
            from routes.scans import seed_demo_data
            await seed_demo_data()
            logger.info(\"Auto-seeded demo GeoPlastic data.\")
        except Exception as e:
            logger.warning(f\"Auto-seed failed: {e}\")


@app.on_event(\"shutdown\")
async def _shutdown():
    close_db()
"
