@echo off
title PublicScriptKR - Host Server
color 0b
cd /d "%~dp0"
cls

echo =========================================================
echo       PublicScriptKR - Server + Public Tunnel
echo =========================================================
echo.

REM 0. Obfuscate app.js -> app.obf.js
echo [0/3] Obfuscating app.js...
node obfuscate.js
if errorlevel 1 (
    echo [!] Obfuscation failed, copying original app.js as fallback...
    copy /Y app.js app.obf.js >nul
)
echo.

REM 1. Free port 3000
echo [1/3] Checking port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /f /pid %%a >nul 2>&1
)

REM 2. Start Node.js server
echo [2/3] Starting server.js...
start "PublicScriptKR Server" cmd /k "node server.js"
timeout /t 2 /nobreak >nul

echo [3/3] Waiting for Cloudflare tunnel...
echo.

REM 3. Download cloudflared if missing
if not exist "%~dp0cloudflared.exe" (
    echo [Tunnel] Downloading cloudflared...
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile '%~dp0cloudflared.exe'"
    echo [Tunnel] Done.
    echo.
)

echo =========================================================
echo [OK] Server started!
echo Local:  http://localhost:3000
echo Login:  Kerryrbq
echo =========================================================
echo.
echo [Tunnel] Starting Cloudflare Tunnel...
echo [Tunnel] Browser will open automatically when link is ready...
echo.

REM 4. Delete old log
if exist "%~dp0tunnel.log" del "%~dp0tunnel.log"

REM 5. Run cloudflared + auto-open browser when URL appears
powershell -Command ^
    "$cf = Start-Process -FilePath '%~dp0cloudflared.exe' -ArgumentList 'tunnel --url http://localhost:3000' -PassThru -NoNewWindow -RedirectStandardError '%~dp0tunnel.log';" ^
    "Write-Host '[Tunnel] Connecting...';" ^
    "$url = $null;" ^
    "while ($url -eq $null) {" ^
    "    Start-Sleep -Milliseconds 500;" ^
    "    if (Test-Path '%~dp0tunnel.log') {" ^
    "        $log = Get-Content '%~dp0tunnel.log' -Raw -ErrorAction SilentlyContinue;" ^
    "        if ($log -match 'https://[a-z0-9-]+\.trycloudflare\.com') {" ^
    "            $url = $matches[0];" ^
    "        }" ^
    "    }" ^
    "};" ^
    "Write-Host '';" ^
    "Write-Host '=========================================';" ^
    "Write-Host \"[LINK] $url\";" ^
    "Write-Host '=========================================';" ^
    "Write-Host '';" ^
    "Write-Host '[Tunnel] Waiting 8 seconds for tunnel to stabilize...';" ^
    "Start-Sleep -Seconds 8;" ^
    "Start-Process $url;" ^
    "Write-Host '[Tunnel] Browser opened!';" ^
    "$cf.WaitForExit();"

echo.
echo [!] Tunnel disconnected. Restarting...
timeout /t 3 /nobreak >nul
goto :eof
