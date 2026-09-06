#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VIET-POET-ALYZER - RAG Server (FastAPI)
Tuần 3: RAG Pipeline + LLM Integration

Server chạy tại http://localhost:5000, khớp contract của src/app/api/ai/route.ts:
  POST /query  {question, poemId?, topK?}
               -> {role, content, sources, confidence, metadata}
  GET  /health -> trạng thái server

Chạy:
  cd python-backend
  python -m uvicorn server:app --host 0.0.0.0 --port 5000
Hoặc:
  python server.py
"""
import os
import sys
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional

# Chế độ LLM (Qwen2.5-0.5B): VIETPOET_LLM=true → trả lời tự nhiên, chậm hơn (~5-15s)
# Mặc định TẮT → template Socratic nhanh (~200ms)
LLM_ENABLED = os.getenv('VIETPOET_LLM', '').lower() in ('1', 'true', 'yes')

# rag_query.py thay sys.stdout/stderr bằng TextIOWrapper mới khi import (win32).
# Wrapper mới CHIA SẺ buffer với stream gốc — nếu bỏ tự do, GC đóng wrapper
# và đóng luôn buffer gốc (ValueError: I/O operation on closed file).
# → detach() để tách wrapper khỏi buffer, rồi khôi phục stream gốc.
_orig_out, _orig_err = sys.stdout, sys.stderr
from rag_query import RAGPipeline, COLLECTION_NAME
for _orig, _name in ((_orig_out, 'stdout'), (_orig_err, 'stderr')):
    _cur = getattr(sys, _name)
    if _cur is not _orig:
        try:
            _cur.detach()
        except Exception:
            pass
        setattr(sys, _name, _orig)
# Đảm bảo in được tiếng Việt/emoji trên Windows mà không tạo wrapper mới
try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

from fastapi import FastAPI
from pydantic import BaseModel, Field

# ==================== API MODELS (khớp api/ai/route.ts) ====================

class RAGQueryRequest(BaseModel):
    question: str
    poemId: Optional[str] = None
    topK: int = Field(default=3, ge=1, le=10)


class RAGQueryMetadata(BaseModel):
    poemId: Optional[str] = None
    query: str
    retrieved: int
    avgScore: Optional[float] = None
    filteredByPoem: bool = False
    model: str
    timestamp: str


class RAGQueryResponse(BaseModel):
    role: str = 'assistant'
    content: str
    sources: list = []
    confidence: float
    ragEnabled: bool = True
    metadata: RAGQueryMetadata


# ==================== APP ====================

rag = RAGPipeline()


@asynccontextmanager
async def lifespan(application: FastAPI):
    """Load SBERT model + ChromaDB (và LLM nếu bật) một lần khi khởi động"""
    print('🚀 Đang load Vietnamese SBERT + ChromaDB...')
    rag.initialize()
    print(f'✅ Sẵn sàng: {rag.collection.count()} passages trong "{COLLECTION_NAME}"')

    if LLM_ENABLED:
        try:
            from llm_generator import SocraticLLM
            llm = SocraticLLM()
            llm.load()
            rag.set_llm(llm)
        except Exception as e:
            print(f'⚠️ Không load được LLM, dùng template: {e}')
    yield


app = FastAPI(
    title='VIET-POET-ALYZER RAG API',
    description='RAG microservice - zero hallucination trên 16 bài thơ SGK 2018',
    version='3.0',
    lifespan=lifespan
)


@app.get('/health')
def health():
    try:
        return {
            'status': 'healthy',
            'service': 'VIET-POET-ALYZER RAG API',
            'version': '3.0',
            'model': rag.model_name,
            'passages': rag.collection.count(),
            'llm': (f'qwen2.5-1.5b ({rag.llm.backend})' if (LLM_ENABLED and getattr(rag.llm, 'is_loaded', False)) else 'disabled'),
            'timestamp': datetime.now().isoformat()
        }
    except Exception as e:
        return {'status': 'starting', 'detail': str(e)}


@app.post('/query', response_model=RAGQueryResponse)
def query(req: RAGQueryRequest):
    """
    Truy vấn RAG pipeline.

    Ưu tiên lọc theo poemId; nếu poemId không có passage phù hợp
    (score thấp / không match) → tìm lại trên toàn bộ 16 bài.
    """
    question = req.question.strip()
    if not question:
        return RAGQueryResponse(
            content='Bạn chưa nhập câu hỏi. Hãy hỏi về một bài thơ nhé!',
            sources=[], confidence=0.0,
            metadata=RAGQueryMetadata(
                query=question, retrieved=0, model=rag.model_name,
                timestamp=datetime.now().isoformat()
            )
        )

    # 1. Thử có filter theo poemId
    result = rag.query(question, req.poemId, req.topK)
    filtered = req.poemId is not None and result['metadata']['retrieved'] > 0

    # 2. Fallback 1: nới lỏng ngưỡng nhưng VẪN ở trong bài thơ đang học
    if req.poemId is not None and result['metadata']['retrieved'] == 0:
        result = rag.query(question, req.poemId, req.topK, min_score=0.22)
        filtered = result['metadata']['retrieved'] > 0

    # 3. Fallback 2: tìm trên toàn bộ kho (bài thơ không có passage phù hợp)
    if result['metadata']['retrieved'] == 0:
        result = rag.query(question, None, req.topK, min_score=0.30)

    return RAGQueryResponse(
        content=result['answer'],
        sources=result['sources'],
        confidence=result['confidence'],
        metadata=RAGQueryMetadata(
            poemId=req.poemId,
            query=question,
            retrieved=result['metadata']['retrieved'],
            avgScore=result['metadata'].get('avg_score'),
            filteredByPoem=filtered,
            model=rag.model_name,
            timestamp=result['metadata']['timestamp']
        )
    )


@app.get('/statistics')
def statistics():
    """Thống kê kho tri thức (dùng cho báo cáo/demo)"""
    return {
        'collection': COLLECTION_NAME,
        'passages': rag.collection.count(),
        'model': rag.model_name,
        'poems': 16,
        'offline': True
    }


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=5000)
