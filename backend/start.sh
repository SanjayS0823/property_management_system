#!/bin/bash
cd "$(dirname "$0")"
rm -f propmanager.db
exec python3.13 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
