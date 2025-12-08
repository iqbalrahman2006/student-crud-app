@echo off
echo Starting application with clean ports...
powershell -ExecutionPolicy Bypass -File "%~dp0start-clean.ps1"
pause
