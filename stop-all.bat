@echo off
echo ========================================
echo  Stopping all Node processes
echo ========================================

REM Kill all node processes
taskkill /F /IM node.exe >nul 2>&1

echo.
echo All Node processes stopped!
echo Ports 3000 and 5000 are now free.
echo.

pause
