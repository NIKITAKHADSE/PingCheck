@echo off
setlocal
cd /d "%~dp0"
if not exist node_modules (
  echo Packages are missing. First run .\SETUP_WINDOWS.bat
  pause
  exit /b 1
)
if not exist .env copy .env.example .env >nul
findstr /B /C:"DATABASE_URL=postgresql://" .env >nul
if errorlevel 1 (
  echo DATABASE_URL is missing in .env.
  echo Paste the Neon connection string first.
  echo See docs\NEON_SETUP.md
  pause
  exit /b 1
)
echo ================================================
echo Starting FlowVik
echo Backend:  http://localhost:4000
echo Frontend: http://localhost:5173
echo Database: Neon PostgreSQL
echo ================================================
start "FlowVik" cmd /k "npm run dev"
timeout /t 4 >nul
start "" http://localhost:5173/login
exit /b 0
