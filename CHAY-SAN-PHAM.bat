@echo off
chcp 65001 >nul
title VIET-POET-ALYZER 2.0 - Che do Offline
cd /d "%~dp0"

echo ============================================================
echo   VIET-POET-ALYZER 2.0 — GIA SU AI DAY THO VIET (OFFLINE)
echo ------------------------------------------------------------
echo   May chu AI  : http://localhost:5000  (RAG + Qwen2.5 OpenVINO)
echo   Ung dung web: http://localhost:3000
echo   LAN DAU CHAY web phai bien dich — doi 1-2 phut.
echo ============================================================
echo.

where python >nul 2>nul
if errorlevel 1 (
    echo [LOI] Chua co Python! Hay chay SETUP-BGK.bat truoc.
    pause & exit /b 1
)
where node >nul 2>nul
if errorlevel 1 (
    echo [LOI] Chua co Node.js! Hay chay SETUP-BGK.bat truoc.
    pause & exit /b 1
)

echo Dang mo may chu AI (port 5000)...
start "VIETPOET - May chu AI (DUNG dong cua so nay)" cmd /k "cd /d "%~dp0python-backend" && set VIETPOET_LLM=true&& python -m uvicorn server:app --host 0.0.0.0 --port 5000"

echo Dang mo ung dung web (port 3000)...
start "VIETPOET - Web (DUNG dong cua so nay)" cmd /k "cd /d "%~dp0" && npm run dev -- -H 0.0.0.0"

echo Cho web khoi dong (20 giay)...
timeout /t 20 /nobreak >nul
start "" http://localhost:3000

echo.
echo  Da mo trinh duyet tai http://localhost:3000
echo  De TAT: dong 2 cua so den vua mo.
pause
