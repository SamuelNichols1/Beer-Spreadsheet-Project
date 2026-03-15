@echo off
setlocal

set "ROOT=%~dp0"
set "API_DIR=%ROOT%Beer_Spreadsheet"
set "FRONTEND_DIR=%ROOT%Beer_Spreadsheet_Frontend"
set "LOG_DIR=%ROOT%logs"
set "LOG_FILE=%LOG_DIR%\app.log"

echo Starting Beer Spreadsheet dev environment...

if not exist "%API_DIR%\manage.py" (
  echo [ERROR] Could not find Django project at: %API_DIR%
  pause
  exit /b 1
)

if not exist "%FRONTEND_DIR%\package.json" (
  echo [ERROR] Could not find React project at: %FRONTEND_DIR%
  pause
  exit /b 1
)

for /f "tokens=1,2 delims=." %%a in ('node -v 2^>nul') do (
  set "NODE_MAJOR=%%a"
  set "NODE_MINOR=%%b"
)

if not defined NODE_MAJOR (
  echo [ERROR] Node.js is not installed or not available in PATH.
  echo         Install Node.js 20.19+ (or 22.12+) for this frontend.
  pause
  exit /b 1
)

set "NODE_MAJOR=%NODE_MAJOR:v=%"
if %NODE_MAJOR% LSS 20 (
  echo [ERROR] Detected Node.js %NODE_MAJOR%.%NODE_MINOR% but this project uses Vite 8.
  echo         Vite 8 requires Node.js 20.19+ (or 22.12+).
  echo         Please upgrade Node.js, then re-run start-dev.bat.
  pause
  exit /b 1
)

if %NODE_MAJOR% EQU 20 if %NODE_MINOR% LSS 19 (
  echo [ERROR] Detected Node.js %NODE_MAJOR%.%NODE_MINOR% but this project uses Vite 8.
  echo         Vite 8 requires Node.js 20.19+ (or 22.12+).
  echo         Please upgrade Node.js, then re-run start-dev.bat.
  pause
  exit /b 1
)

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
if not exist "%LOG_FILE%" type nul > "%LOG_FILE%"

where wt >nul 2>nul
if %errorlevel%==0 (
  echo Launching servers and log tail as tabs in one Windows Terminal window...
  start "" wt -w 0 new-tab --title "Django API" cmd /k "cd /d \"%API_DIR%\" && .\env\Scripts\python.exe manage.py runserver" ; new-tab --title "React Frontend" cmd /k "cd /d \"%FRONTEND_DIR%\" && if not exist node_modules npm install && npm run dev" ; new-tab --title "App Log" powershell -NoExit -Command "Get-Content -Path '%LOG_FILE%' -Wait -Tail 30"
  exit /b 0
)

echo [WARN] Windows Terminal (wt) not found. Falling back to separate cmd windows.
start "Django API" cmd /k "cd /d ""%API_DIR%"" & .\env\Scripts\python.exe manage.py runserver"
start "React Frontend" cmd /k "cd /d ""%FRONTEND_DIR%"" & if not exist node_modules npm install & npm run dev"
start "App Log" powershell -NoExit -Command "Get-Content -Path '%LOG_FILE%' -Wait -Tail 30"
