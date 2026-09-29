#!/bin/bash
echo "=== PropManager - Property Management Portal ==="
echo ""
echo "Starting backend server on port 8000..."
cd "$(dirname "$0")/backend"
rm -f propmanager.db
python3.13 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
sleep 3

echo "Backend running at http://localhost:8000"
echo "API docs at http://localhost:8000/docs"
echo ""

cd "$(dirname "$0")/frontend"
echo "Starting frontend on port 5173..."
npx vite --host 0.0.0.0 &
FRONTEND_PID=$!
sleep 3

echo ""
echo "Frontend running at http://localhost:5173"
echo ""
echo "=== Demo Accounts ==="
echo "Landlord:       alex@demo.com     / demo123"
echo "Property Mgr:   sarah@demo.com    / demo123"
echo "Tenant:         john@demo.com     / demo123"
echo "Tenant:         priya@demo.com    / demo123"
echo "Tenant:         mike@demo.com     / demo123"
echo ""
echo "Press Ctrl+C to stop both servers."
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM
wait
