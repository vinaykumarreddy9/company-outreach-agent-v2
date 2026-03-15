from celery import Celery
import os
from dotenv import load_dotenv

load_dotenv()

# Default to SQLite for LOCAL development if Redis is not available
# This ensures the app works out-of-the-box on Windows without installing Redis
REDIS_URL = os.getenv("REDIS_URL")
NEON_DB_URL = os.getenv("NEON_DB_URL") or os.getenv("DATABASE_URL")

if REDIS_URL:
    BROKER_URL = REDIS_URL
    RESULT_BACKEND = REDIS_URL
    print("[SYSTEM] Using Redis as Celery Broker.")
elif NEON_DB_URL:
    # Use Postgres as broker if Redis is missing (Great for Render Free Tier)
    BROKER_URL = f"sqla+{NEON_DB_URL}"
    RESULT_BACKEND = f"db+{NEON_DB_URL}"
    print("[SYSTEM] REDIS_URL not found. Using Neon Postgres as Celery Broker.")
else:
    # Local Dev Fallback
    print("[SYSTEM] Using Local SQLite for Celery Broker.")
    BROKER_URL = "sqla+sqlite:///./celery_broker.db"
    RESULT_BACKEND = "db+sqlite:///./celery_results.db"

celery_app = Celery(
    "outreach_v3",
    broker=BROKER_URL,
    backend=RESULT_BACKEND,
    include=["app.workers"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    beat_schedule={
        "poll-inbox-every-minute": {
            "task": "app.workers.poll_inbox_task",
            "schedule": 60.0,
        },
        "check-reminders-every-15-minutes": {
            "task": "app.workers.check_upcoming_meetings_task",
            "schedule": 900.0,
        },
        "check-inactivity-every-hour": {
            "task": "app.workers.check_inactivity_reminders_task",
            "schedule": 3600.0,
        },
    },
)
