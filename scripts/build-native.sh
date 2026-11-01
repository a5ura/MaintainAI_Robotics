#!/bin/sh
set -eu
# Run from repository root. No database connection, migration or provisioning.
python -m pip install -r backend/requirements-postgres.txt
npm --prefix frontend ci
# Same-origin API; never carry a server secret or foreign build-time API URL.
VITE_API_BASE=/api VITE_API_TIMEOUT_MS=90000 npm --prefix frontend run build
