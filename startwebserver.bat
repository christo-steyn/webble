@echo off
echo ============================================
echo   TSF LoRaWAN ULP Gateway - Web Server
echo ============================================
echo.

REM Check if venv exists and activate it
if exist "venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
    echo.
) else if exist "..\api\venv\Scripts\activate.bat" (
    echo Activating virtual environment from api folder...
    call ..\api\venv\Scripts\activate.bat
    echo.
) else (
    echo Note: No virtual environment found, using system Python
    echo.
)

echo Choose server type:
echo   1. HTTP  (port 8081) - Standard, works everywhere
echo   2. HTTPS (port 8443) - Secure, required by iOS/Bluefy
echo.
choice /c 12 /n /m "Enter choice (1 or 2): "

if errorlevel 2 goto https
if errorlevel 1 goto http

:http
echo.
echo Starting HTTP server on port 8081...
echo.
set "PORT=8081"
set "PROTOCOL=http"
goto showurls

:https
echo.
echo Starting HTTPS server on port 8443...
echo Note: You'll see a security warning - this is normal for self-signed certificates
echo.
set "PORT=8443"
set "PROTOCOL=https"
goto showurls

:showurls
echo Available URLs:
echo   - %PROTOCOL%://localhost:%PORT%/
echo   - %PROTOCOL%://127.0.0.1:%PORT%/

REM Display all IPv4 addresses
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4"') do (
    set "ip=%%a"
    setlocal enabledelayedexpansion
    set "ip=!ip:~1!"
    echo   - %PROTOCOL%://!ip!:%PORT%/
    endlocal
)

echo.
echo Press Ctrl+C to stop the server
echo.

if "%PROTOCOL%"=="https" (
    python3 https_server.py %PORT%
) else (
    python3 -m http.server %PORT%
)