# Readings API — FastAPI on uvicorn.
#
# Railway builds this and injects PORT at runtime. Binding to a fixed 8000
# makes the container start, pass its own health check, and never receive a
# request: the proxy is forwarding somewhere else entirely.

FROM python:3.12-slim

# Do not buffer stdout — otherwise logs appear only when the process exits,
# which is exactly when you cannot read them.
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Dependencies first, so a code change does not reinstall them.
COPY requirements-api.txt .
RUN pip install --no-cache-dir -r requirements-api.txt

COPY api/ ./api/
COPY src/ ./src/
COPY schema/ ./schema/
COPY setup_db.py ingest.py ./

# Run as a non-root user. The container needs no write access to anything.
RUN useradd --create-home --uid 10001 app && chown -R app:app /app
USER app

EXPOSE 8000

# PORT comes from Railway; 8000 is the local default. Shell form so the
# variable is expanded — exec form would pass the literal string "$PORT".
CMD uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8000}
