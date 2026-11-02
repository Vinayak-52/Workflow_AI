#!/bin/bash
set -e

echo "=== Starting AI Workspace Microservices ==="
echo "Starting ML Microservice on 127.0.0.1:5001..."
python /app/ml/src/ml_service.py &

# Wait for ML service initialization
sleep 3

echo "Starting Unified Backend API & Web Server on port ${PORT:-5000}..."
cd /app/server
exec node dist/server.js
