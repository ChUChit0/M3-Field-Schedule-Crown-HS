#!/bin/bash
# Quick test workflow

echo "🔨 Building bundle..."
./build.sh

echo ""
echo "🧪 Starting test server..."
echo "📍 Opening http://localhost:8000"
echo ""
echo "⚠️  Test EVERYTHING before doing git push!"
echo "🔄 Press Ctrl+C to stop when done testing"
echo ""

# Open browser automatically
sleep 2 && open "http://localhost:8000" &

# Start server
python3 -m http.server 8000
