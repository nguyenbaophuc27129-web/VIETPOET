# VIET-POET-ALYZER 2.0 — Máy chủ AI (RAG + LLM) cho HuggingFace Spaces
# Space card (README.md): sdk: docker, app_port: 5000
FROM python:3.11-slim

WORKDIR /app

# libgomp1 cần cho torch/sklearn trên slim image
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Cài thư viện trước để tận dụng cache layer
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Code + kho tri thức ChromaDB (456 passages)
COPY server.py rag_query.py llm_generator.py ./
COPY chroma_db ./chroma_db
COPY scripts ./scripts

# Tải AI models lúc build (~2GB, chỉ 1 lần):
#   models/qwen2.5-1.5b-ov-int8 (Qwen2.5-1.5B OpenVINO INT8)
#   models/vietnamese-sbert     (SBERT tiếng Việt)
RUN python scripts/download_models.py

# Bật LLM OpenVINO (server.py đọc env này)
ENV VIETPOET_LLM=true

EXPOSE 5000
CMD ["python", "-m", "uvicorn", "server:app", "--host", "0.0.0.0", "--port", "5000"]
