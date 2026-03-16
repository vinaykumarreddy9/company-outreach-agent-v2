#!/usr/bin/env bash

# Start the Celery worker in the background
# We use --concurrency=2 to fit within Render Free Tier RAM limits (512MB)
echo "Starting Celery Worker..."
celery -A app.core.celery_app worker --loglevel=info --concurrency=1 &

# Start the Celery beat for scheduled tasks (reminders, polling)
echo "Starting Celery Beat..."
celery -A app.core.celery_app beat --loglevel=info &

# Start the FastAPI application
echo "Starting FastAPI with Uvicorn..."
uvicorn main:app --host 0.0.0.0 --port $PORT
