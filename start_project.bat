@echo off
title AI Workspace Launcher
echo Starting AI Workspace Services...

start "AI Workspace - ML Microservice" cmd /k "python ai-workspace\ml\src\ml_service.py"
start "AI Workspace - Backend Server" cmd /k "npm --prefix ai-workspace\server run dev"
start "AI Workspace - Frontend" cmd /k "npm --prefix ai-workspace\client run dev"

echo.
echo ===============================================
echo AI Workspace services are launching in separate windows:
echo - Frontend:   http://localhost:3000
echo - Backend:    http://localhost:5000
echo - ML Service: http://127.0.0.1:5001
echo ===============================================
echo.
pause
