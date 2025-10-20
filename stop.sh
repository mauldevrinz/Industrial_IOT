#!/bin/bash

# IIoT Dashboard Stop Script
# This script stops all running servers

echo "⏹️  Stopping IIoT Dashboard services..."
echo ""

# Kill processes running on port 5173 (Vite)
echo "🔍 Checking for Vite server (port 5173)..."
VITE_PID=$(lsof -ti:5173)
if [ ! -z "$VITE_PID" ]; then
    echo "   ⏹️  Stopping Vite server (PID: $VITE_PID)"
    kill -9 $VITE_PID
    echo "   ✅ Vite server stopped"
else
    echo "   ℹ️  No Vite server running"
fi
echo ""

# Kill processes running on port 3001 (Express)
echo "🔍 Checking for Backend server (port 3001)..."
BACKEND_PID=$(lsof -ti:3001)
if [ ! -z "$BACKEND_PID" ]; then
    echo "   ⏹️  Stopping Backend server (PID: $BACKEND_PID)"
    kill -9 $BACKEND_PID
    echo "   ✅ Backend server stopped"
else
    echo "   ℹ️  No Backend server running"
fi
echo ""

# Kill any node processes related to this project
echo "🔍 Checking for other Node.js processes..."
pkill -f "vite" 2>/dev/null && echo "   ✅ Vite processes killed" || echo "   ℹ️  No Vite processes found"
pkill -f "node.*server.cjs" 2>/dev/null && echo "   ✅ Backend processes killed" || echo "   ℹ️  No backend processes found"
echo ""

echo "✅ All services stopped"
echo ""
