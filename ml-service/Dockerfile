# HeatGuard prediction microservice (FastAPI + scikit-learn).
#
# Trains one model per region on startup from the shared SQLite database (the
# web service seeds it). No persisted model is baked in, so the service always
# trains against the current seeded data (see .dockerignore).

FROM python:3.12-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

COPY requirements.txt ./
RUN pip install -r requirements.txt

COPY . .

# Read the app's SQLite database from the shared volume.
ENV HEATGUARD_DB="/data/dev.db"

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
