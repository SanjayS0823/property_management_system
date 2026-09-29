#!/bin/bash
cd "$(dirname "$0")/backend"
rm -f propmanager.db
python3.13 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
PID=$!
echo $PID > /tmp/backend.pid
sleep 5
curl -s http://localhost:8000/api/health
echo ""
echo "Server running with PID: $PID"
