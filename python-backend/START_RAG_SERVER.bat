@echo off
chcp 65001 >nul
title VIET-POET-ALYZER - RAG Server (port 5000)
cd /d "%~dp0"
echo ============================================
echo  VIET-POET-ALYZER - RAG Server
echo  Model: keepitreal/vietnamese-sbert (offline)
echo  Kho tri thuc: 456 passages - 16 bai tho SGK
echo  API: http://localhost:5000/query
echo ============================================
echo.
python -m uvicorn server:app --host 0.0.0.0 --port 5000
pause
