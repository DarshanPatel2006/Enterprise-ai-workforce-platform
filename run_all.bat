@echo off
title Enterprise AI Workforce Platform
echo Starting Enterprise AI Workforce Platform...
echo Checking tools...
if not exist "c:\project\tools\node" (
    echo Error: Node.js not found in c:\project\tools\node
    pause
    exit /b
)
if not exist "c:\project\tools\python" (
    echo Error: Python not found in c:\project\tools\python
    pause
    exit /b
)

echo Starting Backend FastAPI Server on http://localhost:8000 ...
start "Backend API Server" cmd /c "c:\project\tools\python\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

echo Starting Frontend Vite Dev Server on http://localhost:5173 ...
start "Frontend Web Client" cmd /c "set PATH=c:\project\tools\node;%PATH% && cd c:\project\frontend && npm run dev"

echo Waiting for services to initialize...
timeout /t 5 >nul

echo Opening Browser at http://localhost:5173 ...
start http://localhost:5173

echo.
echo ==========================================================
echo Platform successfully initiated!
echo Feel free to close this window when you're done.
echo ==========================================================
pause
