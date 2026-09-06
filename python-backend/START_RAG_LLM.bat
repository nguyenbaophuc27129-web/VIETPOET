@echo off
chcp 65001 >nul
title VIET-POET-ALYZER - RAG + LLM Server (port 5000)
cd /d "%~dp0"
set VIETPOET_LLM=true
echo ============================================
echo  VIET-POET-ALYZER - RAG + LLM (Qwen2.5-1.5B OpenVINO INT8)
echo  Kho tri thuc: 456 passages - 16 bai tho SGK
echo  API: http://localhost:5000/query
echo  Luu y: Khoi dong lau hon (load LLM ~30s),
echo  moi cau tra loi ~5-15s nhung tu nhien hon.
echo ============================================
echo.
python -m uvicorn server:app --host 0.0.0.0 --port 5000
pause
