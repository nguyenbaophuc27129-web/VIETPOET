#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VIET-POET-ALYZER — Đánh giá khoa học: Truy hồi bài thơ (Poem Identification)
================================================================================
So sánh 4 phương pháp trên bài toán: cho câu hỏi của học sinh, hệ thống phải
truy hồi đúng bài thơ (16 lớp) chứa nội dung được hỏi.

Phương pháp:
  1. Random          — baseline ngẫu nhiên (sàn so sánh)
  2. TF-IDF + Cosine — truy hồi từ khóa (n-gram lexical)
  3. TF-IDF + SVM    — máy học cổ điển (LinearSVC one-vs-rest)
  4. SBERT + ChromaDB — hệ thống thật của dự án (keepitreal/vietnamese-sbert)

Hai bộ test (tách khỏi tiêu đề bài thơ để tránh lộ đáp án):
  A. "Trích dẫn"     — câu hỏi chứa câu thơ/từ ngữ gốc (HS trích dẫn)
  B. "Diễn giải"     — câu hỏi dùng ngôn ngữ phân tích, KHÔNG chứa câu thơ gốc

Chỉ số: Top-1 Acc, Top-3 Acc, MRR, Macro-F1, độ trễ (ms/câu)

Kết quả: eval_results/*.csv + eval_results/summary.json (vẽ biểu đồ trực tiếp)

Chạy:  cd python-backend && python eval_retrieval_scientific.py
"""
import csv
import json
import random
import sys
import time
from pathlib import Path

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

import numpy as np

SEED = 42
random.seed(SEED)
np.random.seed(SEED)

PY_DIR = Path(__file__).parent
PROJECT_ROOT = PY_DIR.parent
DATA_DIR = PROJECT_ROOT / 'public' / 'data'
CHROMA_DIR = PY_DIR / 'chroma_db'
OUT_DIR = PY_DIR / 'eval_results'
COLLECTION_NAME = 'viet_poetry_knowledge'
SBERT_MODEL = 'keepitreal/vietnamese-sbert'

MAX_Q_PER_SET_PER_POEM = 6  # mỗi bài tối đa 6 câu/bộ test

from rag_query import POEM_TITLES  # tên thân thiện cho báo cáo per-poem

# ==================== 1. TẢI KHO DỮ LIỆU TỪ CHROMADB ====================

print('📂 Tải kho passages từ ChromaDB...')
import chromadb
client = chromadb.PersistentClient(path=str(CHROMA_DIR))
col = client.get_collection(COLLECTION_NAME)
got = col.get(include=['documents', 'metadatas', 'embeddings'])
corpus_docs = got['documents']
corpus_poems = [m.get('poem_id', '') for m in got['metadatas']]
corpus_embs = np.array(got['embeddings'], dtype=np.float32)
POEMS = sorted(set(corpus_poems))
print(f'   {len(corpus_docs)} passages | {len(POEMS)} bài thơ')


# ==================== 2. SINH BỘ TEST (deterministic, seed=42) ====================

def build_test_sets():
    """Sinh 2 bộ câu hỏi có nhãn (poem_id) từ dữ liệu JSON SGK.

    Lưu ý khoa học: câu hỏi KHÔNG chứa tên bài thơ/tác giả (tránh leakage),
    chỉ dùng nội dung bên trong (từ ngữ trong thơ / ngôn ngữ phân tích).
    """
    set_a, set_b = [], []  # (question, poem_id)

    for f in sorted(DATA_DIR.glob('*.json')):
        data = json.loads(f.read_text(encoding='utf-8'))
        pid = data['document_id']
        author_words = set()

        # a) Bộ A — trích dẫn: dùng target_words trong x_ray (câu thơ gốc)
        seen_a = set()
        a_candidates = []
        for sec in data.get('detailed_analysis', []):
            for xr in sec.get('x_ray_data', []):
                tw = (xr.get('target_words') or '').strip()
                if tw and tw.lower() not in seen_a and len(tw) >= 2:
                    seen_a.add(tw.lower())
                    templates = [
                        f"Hình ảnh \"{tw}\" trong bài thơ gợi điều gì?",
                        f"Chi tiết \"{tw}\" nói lên điều gì?",
                        f"Tác dụng của từ ngữ \"{tw}\" trong bài thơ là gì?",
                    ]
                    a_candidates.append(templates[len(a_candidates) % 3])

        # b) Bộ B — diễn giải: dùng ngôn ngữ phân tích (effect/outline),
        #    loại bỏ mọi câu chứa target_words (đảm bảo không trích thơ gốc)
        seen_b = set()
        b_candidates = []
        target_words_lower = {tw.lower() for tw in seen_a}
        for sec in data.get('detailed_analysis', []):
            for xr in sec.get('x_ray_data', []):
                eff = (xr.get('effect') or '').strip()
                if eff and eff.lower() not in seen_b and len(eff) >= 8:
                    # bỏ effect trùng target_words (lỡ bị ghi đè trong data)
                    if any(t in eff.lower() for t in target_words_lower):
                        continue
                    seen_b.add(eff.lower())
                    b_candidates.append(
                        f"Câu thơ nào trong bài thể hiện \"{eff}\"? Nghệ thuật đó nằm ở đâu?"
                    )
            for pt in sec.get('section_outline', []):
                point = (pt.get('point') or '').strip()
                concl = (pt.get('conclusion') or '').strip()
                text = concl if len(concl) >= 8 else point
                if text and text.lower() not in seen_b and len(text) >= 8:
                    if any(t in text.lower() for t in target_words_lower):
                        continue
                    seen_b.add(text.lower())
                    b_candidates.append(f"Nội dung \"{text}\" nằm ở phần nào của bài thơ?")

        rng = random.Random(SEED + hash(pid) % 1000)
        rng.shuffle(a_candidates)
        rng.shuffle(b_candidates)
        set_a += [(q, pid) for q in a_candidates[:MAX_Q_PER_SET_PER_POEM]]
        set_b += [(q, pid) for q in b_candidates[:MAX_Q_PER_SET_PER_POEM]]

    return set_a, set_b


print('🧪 Sinh bộ test (seed=42, không chứa tên bài thơ)...')
TEST_A, TEST_B = build_test_sets()
print(f'   Bộ A (trích dẫn): {len(TEST_A)} câu | Bộ B (diễn giải): {len(TEST_B)} câu')


# ==================== 3. CÁC PHƯƠNG PHÁP ====================

def rank_metrics(ranked_poems, truth):
    """Top-1/Top-3 Acc + MRR từ danh sách bài thơ đã xếp hạng (đã khử trùng lặp)."""
    unique = list(dict.fromkeys(ranked_poems))
    top1 = int(unique[0] == truth) if unique else 0
    top3 = int(truth in unique[:3])
    mrr = 0.0
    for i, p in enumerate(unique, 1):
        if p == truth:
            mrr = 1.0 / i
            break
    return top1, top3, mrr


class Methods:
    def __init__(self):
        self.warm = {}
        self.id2poem = dict(zip(got['ids'], corpus_poems))

    # ---- 1. Random ----
    def random_predict(self, q):
        return random.Random(SEED).sample(POEMS, len(POEMS))

    # ---- 2. TF-IDF + Cosine ----
    def fit_tfidf(self):
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.preprocessing import normalize
        self.tfidf = TfidfVectorizer()
        self.tfidf_matrix = normalize(self.tfidf.fit_transform(corpus_docs))

    def tfidf_rank(self, q):
        """Trả về chỉ số corpus (passage) xếp theo sim giảm dần."""
        qv = self.tfidf.transform([q])
        sims = (self.tfidf_matrix @ qv.T).toarray().ravel()
        return list(np.argsort(-sims))

    def tfidf_cosine_predict(self, q):
        return [corpus_poems[i] for i in self.tfidf_rank(q)]

    # ---- 3. TF-IDF + Linear SVM ----
    def fit_svm(self):
        from sklearn.svm import LinearSVC
        self.svm = LinearSVC(C=1.0, random_state=SEED)
        self.svm.fit(self.tfidf_matrix, corpus_poems)

    def svm_predict(self, q):
        qv = self.tfidf.transform([q])
        scores = self.svm.decision_function(qv)[0]
        order = np.argsort(-scores)
        return [self.svm.classes_[i] for i in order]

    # ---- 4. SBERT + ChromaDB (production) ----
    def fit_sbert(self):
        from sentence_transformers import SentenceTransformer
        self.sbert = SentenceTransformer(SBERT_MODEL)
        # warm-up (biến đầu luôn chậm hơn)
        self.sbert.encode('warm up', show_progress_bar=False)

    def sbert_rank(self, q):
        """Trả về passage-id (ChromaDB) xếp theo sim giảm dần."""
        emb = self.sbert.encode(q, normalize_embeddings=True, show_progress_bar=False)
        res = col.query(query_embeddings=[emb.tolist()], n_results=len(corpus_docs))
        return list(res['ids'][0])

    def sbert_predict(self, q):
        # Kết quả trả về đã xếp theo độ tương đồng — lấy poem_id từ metadata CỦA TỪNG kết quả
        return [self.id2poem[i] for i in self.sbert_rank(q)]

    # ---- 5. Hybrid (RRF — Reciprocal Rank Fusion, chuẩn trong tài liệu RAG) ----
    def hybrid_predict(self, q):
        K = 60
        t_rank = self.tfidf_rank(q)              # chỉ số corpus
        s_rank = self.sbert_rank(q)              # chroma ids
        score = {}
        for r, idx in enumerate(t_rank):
            score[f't{idx}'] = score.get(f't{idx}', 0) + 1 / (K + r)
        for r, cid in enumerate(s_rank):
            score[f's{cid}'] = score.get(f's{cid}', 0) + 1 / (K + r)
        # gộp 2 hệ theo passage: passage = (tfidf_idx, chroma_id) cùng thứ tự corpus
        fused = []
        for idx, cid in zip(range(len(corpus_docs)), got['ids']):
            fused.append((score.get(f't{idx}', 0) + score.get(f's{cid}', 0), corpus_poems[idx]))
        fused.sort(key=lambda x: -x[0])
        return [p for _, p in fused]


M = Methods()
print('🔧 Huấn luyện TF-IDF + SVM (trên 456 passages, 16 lớp)...')
M.fit_tfidf(); M.fit_svm()
print('🔧 Load SBERT (production model)...')
M.fit_sbert()

METHODS = [
    ('Random (baseline)', M.random_predict),
    ('TF-IDF + Cosine', M.tfidf_cosine_predict),
    ('TF-IDF + SVM (LinearSVC)', M.svm_predict),
    ('SBERT + ChromaDB', M.sbert_predict),
    ('Hybrid SBERT+TF-IDF (RRF)', M.hybrid_predict),
]


# ==================== 4. CHẠY ĐÁNH GIÁ ====================

def evaluate(test_set):
    rows = []
    for name, fn in METHODS:
        t1 = t3 = 0
        mrr_sum = 0.0
        latencies = []
        preds = []
        for q, truth in test_set:
            t0 = time.perf_counter()
            ranked = fn(q)
            latencies.append((time.perf_counter() - t0) * 1000)
            a, b, m = rank_metrics(ranked, truth)
            t1 += a; t3 += b; mrr_sum += m
            preds.append(ranked[0] if ranked else '')
        n = len(test_set)
        rows.append({
            'method': name, 'n': n,
            'top1': round(t1 / n, 4), 'top3': round(t3 / n, 4),
            'mrr': round(mrr_sum / n, 4),
            'macro_f1': macro_f1(test_set, preds),
            'latency_ms': round(float(np.median(latencies)), 1),
        })
    return rows


def macro_f1(test_set, preds):
    """Macro-F1 của dự đoán Top-1 trên 16 lớp (lớp không xuất hiện → F1=0)."""
    from sklearn.metrics import f1_score
    truths = [t for _, t in test_set]
    return round(float(f1_score(truths, preds, labels=POEMS, average='macro', zero_division=0)), 4)


print('\n⏳ Đang đánh giá (mỗi phương pháp chạy trên cả 2 bộ test)...')
results_a = evaluate(TEST_A)
results_b = evaluate(TEST_B)


# ==================== 5. ĐỘ CHÍNH XÁC THEO TỪNG BÀI (SBERT) ====================

per_poem = []
for pid in POEMS:
    qs = [q for q, t in TEST_A + TEST_B if t == pid]
    if not qs:
        continue
    correct = 0
    for q in qs:
        ranked = M.sbert_predict(q)
        if rank_metrics(ranked, pid)[0]:
            correct += 1
    per_poem.append({
        'poem_id': pid,
        'poem_title': POEM_TITLES.get(pid, pid),
        'n_questions': len(qs),
        'top1_accuracy': round(correct / len(qs), 4),
    })
per_poem.sort(key=lambda r: r['top1_accuracy'])


# ==================== 6. XUẤT KẾT QUẢ (CSV + JSON cho biểu đồ) ====================

OUT_DIR.mkdir(exist_ok=True)

def write_csv(path, fieldnames, rows):
    with open(path, 'w', newline='', encoding='utf-8-sig') as f:  # utf-8-sig: Excel đọc đúng tiếng Việt
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)

write_csv(OUT_DIR / 'accuracy_by_method_setA.csv', ['method', 'n', 'top1', 'top3', 'mrr', 'macro_f1', 'latency_ms'], results_a)
write_csv(OUT_DIR / 'accuracy_by_method_setB.csv', ['method', 'n', 'top1', 'top3', 'mrr', 'macro_f1', 'latency_ms'], results_b)
write_csv(OUT_DIR / 'accuracy_per_poem_sbert.csv', ['poem_id', 'poem_title', 'n_questions', 'top1_accuracy'], per_poem)

# Dạng dài (long format) — tiện vẽ biểu đồ cột nhóm trên Excel/Python
long_rows = []
for set_name, rows in (('A - Trích dẫn', results_a), ('B - Diễn giải', results_b)):
    for r in rows:
        long_rows.append({'dataset': set_name, **r})
write_csv(OUT_DIR / 'chart_data_grouped.csv', ['dataset', 'method', 'n', 'top1', 'top3', 'mrr', 'macro_f1', 'latency_ms'], long_rows)

summary = {
    'meta': {
        'task': 'Poem Identification (16 classes)',
        'seed': SEED,
        'corpus_passages': len(corpus_docs),
        'n_poems': len(POEMS),
        'set_a': {'name': 'Trích dẫn câu thơ gốc', 'n': len(TEST_A)},
        'set_b': {'name': 'Diễn giải (không chứa câu thơ gốc)', 'n': len(TEST_B)},
        'sbert_model': SBERT_MODEL,
        'date': time.strftime('%Y-%m-%d %H:%M'),
    },
    'results_setA': results_a,
    'results_setB': results_b,
    'per_poem_sbert': per_poem,
}
(OUT_DIR / 'summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8')


# ==================== 7. IN BẢNG KẾT QUẢ ====================

def print_table(title, rows):
    print(f'\n===== {title} =====')
    print(f"{'Phương pháp':<28}{'Top-1':>8}{'Top-3':>8}{'MRR':>8}{'F1':>8}{'ms':>9}")
    for r in rows:
        print(f"{r['method']:<28}{r['top1']*100:>7.1f}%{r['top3']*100:>7.1f}%{r['mrr']:>8.3f}{r['macro_f1']:>8.3f}{r['latency_ms']:>8.1f}")

print_table(f'BỘ TEST A — TRÍCH DẪN CÂU THƠ GỐC (n={len(TEST_A)})', results_a)
print_table(f'BỘ TEST B — DIỄN GIẢI, KHÔNG CHỨA CÂU THƠ (n={len(TEST_B)})', results_b)

print('\n===== THEO TỪNG BÀI (SBERT Top-1, cả 2 bộ) =====')
for r in per_poem:
    bar = '█' * int(r['top1_accuracy'] * 20)
    print(f"{r['poem_title']:<48}{r['top1_accuracy']*100:>6.1f}% {bar}")

print(f'\n✅ Kết quả đã lưu tại: {OUT_DIR}')
print('   - accuracy_by_method_setA.csv / accuracy_by_method_setB.csv')
print('   - chart_data_grouped.csv (dạng dài, vẽ biểu đồ cột nhóm)')
print('   - accuracy_per_poem_sbert.csv (biểu đồ theo bài)')
print('   - summary.json (toàn bộ số liệu + mô tả phương pháp)')
