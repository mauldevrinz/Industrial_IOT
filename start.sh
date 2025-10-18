#!/bin/bash

# IIoT Dashboard Startup Script
# This script starts both frontend and backend servers

echo "🚀 Starting IIoT Dashboard..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Start both servers using concurrently
echo "🌐 Starting Frontend (Vite) and Backend (Express)..."
echo ""
npm run dev:all
