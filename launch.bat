@echo off
title Hasu Chat Server
echo Starting Hasu Chat Server...
echo.

:: Start a separate background window to wait 2 seconds, then open the browser
start /min "" cmd /c "timeout /t 2 /nobreak >nul && start "" http://127.0.0.1:3000"

:: Start the Node server in the foreground (keeps the command window open and prints logs)
node "%~dp0server.js"
