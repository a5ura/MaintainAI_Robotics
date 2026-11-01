#!/bin/sh
set -eu
# Explicit PostgreSQL factory; no migration/seed/reset on HTTP startup.
exec python -m uvicorn backend.postgres_app:create_app --factory --host 0.0.0.0 --port "${PORT:-8000}" --workers 1 --limit-concurrency 20 --timeout-keep-alive 5 --no-access-log
