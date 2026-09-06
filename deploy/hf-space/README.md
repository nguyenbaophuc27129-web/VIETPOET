---
title: VIET-POET AI Server
emoji: 📜
colorFrom: red
colorTo: yellow
sdk: docker
app_port: 5000
pinned: false
---

# VIET-POET-ALYZER 2.0 — Máy chủ AI (RAG + LLM OpenVINO)

FastAPI server cho sản phẩm dự thi Sáng tạo trẻ Quốc gia AI 2026.

- `POST /query` — RAG trên 456 đoạn trích / 16 bài thơ SGK (SBERT Việt + ChromaDB),
  LLM Qwen2.5-1.5B INT8 (Intel OpenVINO, CPU) khi bật `VIETPOET_LLM=true`
- `GET /health` — health check

Build tự tải models lúc tạo image (~2GB, lần đầu mất 10-15 phút).

**Cách đưa lên HF Spaces:** tạo Space mới (SDK: Docker) → upload toàn bộ thư mục này → đợi build.
Frontend (Vercel) trỏ env `RAG_BACKEND_URL=https://<tên-space>.hf.space`.
