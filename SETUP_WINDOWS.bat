@echo off
setlocal
cd /d "%~dp0"
echo ================================================
echo FlowVik - ManyChat-style Automation SaaS
echo Node.js + React + Neon PostgreSQL
echo ================================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed.
  echo Install Node.js 20 LTS or newer, then run this file again.
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm is not available.
  pause
  exit /b 1
)

if not exist .env copy .env.example .env >nul

echo [1/5] Installing packages...
call npm install --no-audit --no-fund
if errorlevel 1 goto :fail

echo.
echo [2/5] Checking backend JavaScript...
call npm run check
if errorlevel 1 goto :fail

echo.
echo [3/5] Building React frontend...
call npm run build
if errorlevel 1 goto :fail

echo.
echo [4/5] Checking Neon configuration...
findstr /B /C:"DATABASE_URL=postgresql://" .env >nul
if errorlevel 1 (
  echo.
  echo DATABASE_URL is not configured yet.
  echo Open .env and paste your Neon connection string.
  echo Then run: npm run setup
  echo See docs\NEON_SETUP.md
  goto :done
)

echo.
echo [5/5] Creating Neon tables and demo data...
call npm run setup
if errorlevel 1 goto :fail

:done
echo.
echo ================================================
echo SETUP COMPLETE
echo Run START_FLOWVIK.bat after DATABASE_URL is set.
echo ================================================
pause
exit /b 0

:fail
echo.
echo SETUP FAILED.
echo Copy the error shown above and send it for help.
pause
exit /b 1
