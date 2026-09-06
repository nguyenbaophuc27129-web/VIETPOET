@echo off
chcp 65001 >nul
title VIET-POET-ALYZER 2.0 - Cai dat cho Ban giam khao
cd /d "%~dp0"

echo ============================================================
echo   VIET-POET-ALYZER 2.0 — CAI DAT TREN MAY CUA BAN
echo   (Khoang 10-15 phut lan dau, chi lam 1 lan)
echo ============================================================
echo.

where python >nul 2>nul
if errorlevel 1 (
    echo [BUOC 1/4] LOI: May chua co Python 3.10+!
    echo   Tai tai: https://www.python.org/downloads/  (nho tick "Add Python to PATH")
    echo   Sau do chay lai file nay.
    pause & exit /b 1
)
python --version

where node >nul 2>nul
if errorlevel 1 (
    echo [BUOC 1/4] LOI: May chua co Node.js 18+!
    echo   Tai tai: https://nodejs.org/  (ban LTS)
    echo   Sau do chay lai file nay.
    pause & exit /b 1
)
node --version
echo [BUOC 1/4] Python + Node.js da san sang ✓

echo.
echo [BUOC 2/4] Cai thu vien Python (fastapi, chromadb, torch, openvino...)...
python -m pip install -r python-backend\requirements.txt
if errorlevel 1 goto :pip_fail

echo.
echo [BUOC 3/4] Cai thu vien web (next.js)...
call npm install
if errorlevel 1 goto :npm_fail

echo.
echo [BUOC 4/4] Tai AI models (~2GB, lan duy nhat can Internet)...
python scripts\download_models.py
if errorlevel 1 goto :model_fail

echo.
echo ============================================================
echo   CAI DAT HOAN TAT! ✓
echo   Buoc tiep theo: chay file  CHAY-SAN-PHAM.bat
echo ============================================================
pause
exit /b 0

:pip_fail
echo [LOI] Cai thu vien Python that bai — chup man hinh de bao lai.
pause & exit /b 1
:npm_fail
echo [LOI] npm install that bai — kiem tra Node.js da vao PATH chua.
pause & exit /b 1
:model_fail
echo [LOI] Tai model that bai — kiem tra Internet roi chay lai:
echo        python scripts\download_models.py
pause & exit /b 1
