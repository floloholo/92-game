#!/bin/bash

echo "🛑 Stopping any existing server on port 3000..."

# Find and kill any process using port 3000
PID=$(lsof -ti:3000)
if [ ! -z "$PID" ]; then
    echo "Found process $PID using port 3000"
    kill -9 $PID
    echo "✅ Stopped existing server"
    sleep 1
else
    echo "✅ Port 3000 is free"
fi

echo ""
echo "🚀 Starting 92 Game Server..."
npm start