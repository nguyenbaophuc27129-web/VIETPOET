#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Re-embed toàn bộ ChromaDB bằng đúng model truy vấn (keepitreal/vietnamese-sbert).

BUG đã phát hiện qua eval_retrieval_scientific.py (4/9/2026):
  Kho được build bằng 'distiluse-base-multilingual-cased-v2' nhưng truy vấn bằng
  'keepitreal/vietnamese-sbert' → 2 không gian vector khác nhau → retrieval
  ngẫu nhiên (Top-1 = 6.2% = random).

Fix: giữ nguyên documents/metadata/chunking hiện có, CHỈ thay embedding.
Chạy: cd python-backend && python reembed_chroma_sbert.py
"""
import sys
import time
from pathlib import Path

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

import numpy as np

PY_DIR = Path(__file__).parent
CHROMA_DIR = PY_DIR / 'chroma_db'
COLLECTION_NAME = 'viet_poetry_knowledge'
SBERT_MODEL = 'keepitreal/vietnamese-sbert'

print('📂 Mở ChromaDB...')
import chromadb
client = chromadb.PersistentClient(path=str(CHROMA_DIR))
col = client.get_collection(COLLECTION_NAME)
got = col.get(include=['documents', 'metadatas'])
ids, docs, metas = got['ids'], got['documents'], got['metadatas']
print(f'   {len(docs)} passages | {len(set(m["poem_id"] for m in metas))} bài thơ')

print(f'🧠 Load {SBERT_MODEL}...')
from sentence_transformers import SentenceTransformer
model = SentenceTransformer(SBERT_MODEL)

print('🔁 Encode lại toàn bộ passages (normalized)...')
t0 = time.time()
embs = model.encode(docs, batch_size=32, normalize_embeddings=True, show_progress_bar=True)
print(f'   xong {time.time() - t0:.1f}s | shape={embs.shape}')

# Kiểm tra embedding chuẩn hóa (norm ≈ 1)
norms = np.linalg.norm(np.array(embs), axis=1)
print(f'   norm trung bình: {norms.mean():.4f} (phải ≈ 1.0)')

print('⬆️  Upsert embedding mới vào collection (giữ nguyên ids/documents/metadata)...')
col.upsert(ids=ids, embeddings=embs.tolist(), documents=docs, metadatas=metas)
print(f'   ✅ {col.count()} passages đã re-embed')

# ---- Verify: 3 câu hỏi mẫu phải truy hồi đúng bài ----
print('\n🔍 Kiểm tra nhanh sau khi re-embed:')
samples = [
    ('Chi tiết tựa vai chồng nói lên điều gì?', 'duong_phu_hanh_cao_ba_quat'),
    ('Cảm xúc của nhà thơ trước cảnh hoàng hôn trên sông', 'trang_giang_huy_can'),
    ('Tâm trạng nhớ làng quê của người chiến sĩ cách mạng', 'nho_dong_to_huu'),
]
ok = 0
for q, expected in samples:
    emb = model.encode(q, normalize_embeddings=True, show_progress_bar=False)
    res = col.query(query_embeddings=[emb.tolist()], n_results=3)
    top_poem = res['metadatas'][0][0].get('poem_id')
    sim = max(0.0, 1 - res['distances'][0][0] / 2)
    hit = '✅' if top_poem == expected else '❌'
    ok += top_poem == expected
    print(f'   {hit} "{q[:45]}" -> {top_poem} (sim={sim:.3f})')

print(f'\n{"🎉 THÀNH CÔNG — restart RAG server để áp dụng!" if ok == len(samples) else "⚠️  Vẫn còn câu sai — kiểm tra lại."}')
sys.exit(0 if ok == len(samples) else 1)
