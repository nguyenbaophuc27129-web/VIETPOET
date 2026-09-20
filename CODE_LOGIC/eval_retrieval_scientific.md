# 📄 eval_retrieval_scientific.py — Đánh giá khoa học retrieval: so sánh 5 phương pháp trên 2 bộ test A/B (n=96+96), xuất CSV/JSON

**Vị trí:** `python-backend/eval_retrieval_scientific.py` | **Số dòng:** ~361 | **Vai trò trong hệ thống:** Công cụ đo lường khách quan cho bài toán "Poem Identification" (cho câu hỏi → truy hồi đúng 1 trong 16 bài thơ) — nguồn số liệu thuyết trình (biểu đồ, bảng) và chính công cụ đã phát hiện bug lệch model embedding mà `reembed_chroma_sbert.py` đã sửa.

## 1. File này làm gì? (30 giây)
Script so sánh **5 phương pháp truy hồi** trên cùng bài toán 16 lớp (eval_retrieval_scientific.py:9-13): (1) **Random** — sàn so sánh; (2) **TF-IDF + Cosine** — lexical n-gram; (3) **TF-IDF + SVM (LinearSVC)** — máy học cổ điển; (4) **SBERT + ChromaDB** — hệ thống thật của dự án; (5) **Hybrid SBERT+TF-IDF (RRF — Reciprocal Rank Fusion)**. Sinh tự động 2 bộ test **deterministic (seed=42)** từ dữ liệu JSON SGK: **Bộ A "Trích dẫn"** (chứa câu thơ/từ ngữ gốc) và **Bộ B "Diễn giải"** (không chứa câu thơ gốc), mỗi bài tối đa 6 câu/bộ → **n=96 mỗi bộ** (16×6, eval_retrieval_scientific.py:52, 129-130). Đo **Top-1/Top-3 Acc, MRR, Macro-F1, độ trễ ms**; xuất CSV + `summary.json` vào `eval_results/` (eval_retrieval_scientific.py:302-338). Kết quả ghi nhận: **TF-IDF + Cosine mạnh nhất với Top-1 84.38% (bộ A) → 92.71% (bộ B)**; Random 6.25%; SBERT (sau re-embed) 47.9%/59.4%.

## 2. Đầu vào / Đầu ra
- **Đầu vào:**
  - Kho passages từ ChromaDB (documents + metadatas + embeddings): 456 passages / 16 bài (eval_retrieval_scientific.py:58-67).
  - Dữ liệu JSON SGK tại `PROJECT_ROOT/public/data` để sinh bộ test (eval_retrieval_scientific.py:45-46, 80).
  - Model `keepitreal/vietnamese-sbert` (eval_retrieval_scientific.py:50) + `POEM_TITLES` import từ `rag_query` (eval_retrieval_scientific.py:54).
- **Đầu ra** (thư mục `eval_results/`, eval_retrieval_scientific.py:48, 304):
  - `accuracy_by_method_setA.csv`, `accuracy_by_method_setB.csv` — bảng 5 phương pháp × 6 chỉ số.
  - `accuracy_per_poem_sbert.csv` — Top-1 của SBERT theo từng bài.
  - `chart_data_grouped.csv` — dạng dài (long format) để vẽ biểu đồ cột nhóm (eval_retrieval_scientific.py:316-321).
  - `summary.json` — toàn bộ số liệu + meta (seed, corpus, mô tả bộ test, ngày chạy) (eval_retrieval_scientific.py:323-338).

## 3. Luồng xử lý chính (từng bước)
1. **Cấu hình reproducible:** `SEED = 42`, seed cả `random` lẫn `numpy` (eval_retrieval_scientific.py:40-42); `MAX_Q_PER_SET_PER_POEM = 6` (eval_retrieval_scientific.py:52); đường dẫn tính từ `__file__` (eval_retrieval_scientific.py:44-49).
2. **Tải corpus từ ChromaDB:** `col.get(include=['documents','metadatas','embeddings'])` → `corpus_docs`, `corpus_poems`, `corpus_embs`; danh sách `POEMS` 16 lớp (eval_retrieval_scientific.py:58-67).
3. **`build_test_sets()` — sinh bộ test chống leakage (eval_retrieval_scientific.py:72-132):**
   - **Bộ A (trích dẫn):** lấy `target_words` trong `x_ray_data`, chống trùng (`seen_a`), độ dài ≥2, xoay vòng 3 template câu hỏi "Hình ảnh X gợi điều gì?..." (eval_retrieval_scientific.py:85-98).
   - **Bộ B (diễn giải):** dùng `effect` (≥8 ký tự) và `section_outline` (point/conclusion), **loại mọi câu còn chứa target_words** để chắc chắn không trích thơ gốc (eval_retrieval_scientific.py:100-124).
   - Shuffle per-poem bằng RNG riêng `SEED + hash(pid) % 1000`, cắt còn 6 câu/bài/bộ (eval_retrieval_scientific.py:126-130) → 96 câu/bộ.
4. **`rank_metrics()` (eval_retrieval_scientific.py:142-152):** khử trùng lặp bài trong ranking (`dict.fromkeys`), tính Top-1, Top-3, MRR.
5. **Class `Methods` — 5 phương pháp (eval_retrieval_scientific.py:155-224):** `fit_tfidf`/`fit_svm`/`fit_sbert` huấn luyện lần lượt (SVM `LinearSVC(C=1.0)` trên ma trận TF-IDF; SBERT có warm-up); hàm `*_predict` trả danh sách bài thơ xếp hạng giảm dần. `hybrid_predict` gộp 2 bảng xếp hạng bằng **RRF với K=60**: điểm mỗi passage = Σ 1/(K + hạng) từ cả TF-IDF lẫn SBERT (eval_retrieval_scientific.py:210-224).
6. **`evaluate(test_set)` (eval_retrieval_scientific.py:244-266):** với từng phương pháp × từng câu hỏi: đo độ trễ bằng `time.perf_counter`, cộng Top-1/Top-3/MRR, lưu dự đoán Top-1; latency in **median**; gọi `macro_f1()` dùng `sklearn.f1_score(average='macro', labels=POEMS, zero_division=0)` trên 16 lớp (eval_retrieval_scientific.py:269-273).
7. **Chạy cả 2 bộ test** (eval_retrieval_scientific.py:276-278), rồi tính **per-poem accuracy của SBERT** (cả A+B, sắp xếp tăng dần để thấy bài yếu) (eval_retrieval_scientific.py:283-299).
8. **Xuất file:** 4 CSV (utf-8-sig để Excel đọc đúng tiếng Việt — eval_retrieval_scientific.py:307) + `summary.json` (eval_retrieval_scientific.py:312-338); in bảng kết quả + thanh bar theo từng bài (eval_retrieval_scientific.py:343-361).

## 4. Các hàm/class chính & vai trò
| Tên | Dòng | Làm gì |
|---|---|---|
| `SEED` / seed toàn cục | eval_retrieval_scientific.py:40-42 | Đảm bảo chạy lại ra đúng kết quả (deterministic). |
| (khối tải corpus) | eval_retrieval_scientific.py:58-67 | Lấy 456 passages + embeddings + `poem_id` từ ChromaDB; tạo danh sách 16 lớp. |
| `build_test_sets()` | eval_retrieval_scientific.py:72-132 | Sinh bộ A (trích dẫn `target_words`) + bộ B (diễn giải `effect`/`outline`, lọc bỏ từ gốc), chống leakage tên bài/tác giả, 6 câu/bài/bộ → n=96/bộ. |
| `rank_metrics()` | eval_retrieval_scientific.py:142-152 | Khử trùng lặp ranking → Top-1, Top-3, MRR. |
| `Methods.random_predict` | eval_retrieval_scientific.py:161-162 | Baseline ngẫu nhiên có seed — sàn so sánh. |
| `Methods.fit_tfidf` / `tfidf_rank` / `tfidf_cosine_predict` | eval_retrieval_scientific.py:165-178 | Vector hóa corpus bằng `TfidfVectorizer` + normalize; xếp hạng passage theo cosine; map sang `poem_id`. |
| `Methods.fit_svm` / `svm_predict` | eval_retrieval_scientific.py:181-190 | `LinearSVC(C=1.0, random_state=42)` one-vs-rest; xếp lớp theo `decision_function`. |
| `Methods.fit_sbert` / `sbert_rank` / `sbert_predict` | eval_retrieval_scientific.py:193-207 | Load SBERT (có warm-up), query ChromaDB lấy toàn bộ corpus xếp hạng; map chroma-id → poem qua metadata **từng kết quả**. |
| `Methods.hybrid_predict` | eval_retrieval_scientific.py:210-224 | RRF K=60: cộng điểm 1/(K+rank) từ bảng xếp hạng TF-IDF và SBERT theo từng passage. |
| (khối fit + `METHODS`) | eval_retrieval_scientific.py:227-239 | Huấn luyện TF-IDF + SVM trên 456 passages/16 lớp, load SBERT; danh sách 5 (tên, hàm) để đánh giá. |
| `evaluate()` | eval_retrieval_scientific.py:244-266 | Vòng đánh giá: đo latency (median), gom Top-1/Top-3/MRR, tính Macro-F1 cho từng phương pháp trên 1 bộ test. |
| `macro_f1()` | eval_retrieval_scientific.py:269-273 | `f1_score` macro trên 16 lớp với `zero_division=0` (lớp không xuất hiện → F1=0). |
| (khối per-poem) | eval_retrieval_scientific.py:283-299 | Top-1 của SBERT cho từng bài (gộp A+B), sắp tăng dần để lộ bài yếu. |
| `write_csv()` | eval_retrieval_scientific.py:306-310 | Ghi CSV `utf-8-sig` (Excel đọc tiếng Việt đúng). |
| (khối xuất + in bảng) | eval_retrieval_scientific.py:312-361 | 4 CSV + `summary.json`; in bảng `%` + thanh bar trực quan. |

## 5. Điểm kỹ thuật đáng chú ý
- **5 phương pháp, từ sàn đến trần:** Random (đoán mò, Top-1 lý thuyết 1/16 ≈ 6.25%) → TF-IDF Cosine → TF-IDF SVM → SBERT (production) → Hybrid RRF (kỹ thuật fusion chuẩn trong tài liệu RAG, K=60 — eval_retrieval_scientific.py:211). Cách thiết kế này cho phép nói có căn cứ "hệ thống tốt hơn random bao nhiêu lần".
- **2 bộ test chống leakage:** câu hỏi không chứa tên bài/tác giả (eval_retrieval_scientific.py:75-77); bộ B còn lọc bỏ mọi effect/outline còn vết của `target_words` (eval_retrieval_scientific.py:104-111, 121-122) — đánh giá trung thực khả năng hiểu "diễn giải", không phải "đối chiếu chuỗi".
- **Kết quả định lượng (từ `eval_results/summary.json`, chạy 2026-09-04 22:17):** **TF-IDF + Cosine Top-1 84.38% (A) / 92.71% (B)**, Top-3 94.79%/95.83%, MRR 0.899/0.949 — mạnh nhất; TF-IDF + SVM 70.8%/79.2%; SBERT 47.9%/59.4% (tuy nhiên semantic vẫn cần cho truy hồi passage cấp câu hỏi trừu tượng); Hybrid RRF 68.8%/72.9%; Random 6.25%. TF-IDF còn nhanh hơn ~100 lần (~0.7-0.8ms vs ~91-108ms/câu).
- **Xuất dữ liệu sẵn cho báo cáo:** long-format `chart_data_grouped.csv` vẽ biểu đồ cột nhóm trực tiếp; `utf-8-sig` để mở bằng Excel không lỗi dấu (eval_retrieval_scientific.py:307, 316-321); `summary.json` nhúng cả meta phương pháp để số liệu tự mô tả nguồn gốc.
- **Kỷ luật thực nghiệm:** seed kép (random + numpy) và per-poem RNG (eval_retrieval_scientific.py:40-42, 126); đo latency bằng `perf_counter` và lấy median (eval_retrieval_scientific.py:252-254, 264); SBERT có warm-up để số liệu độ trễ không bị suy bại bởi lần chạy đầu (eval_retrieval_scientific.py:196-197).

## 6. 🎤 Giám khảo hay hỏi gì?
**Hỏi 1: "Số 84-93% mà bạn nói là gì, đo như thế nào?"**
Trả lời: Là Top-1 accuracy của TF-IDF + Cosine trong file `eval_results/summary.json`: 84.38% trên bộ A (câu hỏi trích dẫn câu thơ gốc) và 92.71% trên bộ B (câu hỏi diễn giải, không chứa câu thơ gốc), mỗi bộ n=96 câu sinh tự động seed=42, chia đều 16 bài.

**Hỏi 2: "Vì sao TF-IDF (lexical) lại thắng SBERT (semantic) — vậy chọn model nào?"**
Trả lời: Với kho nhỏ 456 passages của 16 bài SGK, từ ngữ phân tích văn học rất đặc trưng nên TF-IDF bắt dấu hiệu phân biệt cực tốt; SBERT mạnh ở mức câu hỏi trừu tượng nhưng yếu hơn trong đo lường này. Đó là lý do hệ thống giữ SBERT làm nền tảng RAG (cần cosine ngưỡng để lọc chất lượng) và đánh giá này là bằng chứng quy trình khoa học trung thực: đo, thấy, sửa, đo lại.

**Hỏi 3: "Script này từng phát hiện bug gì?"**
Trả lời: Lần chạy đầu (4/9/2026) cho thấy SBERT Top-1 = 6.2% — đúng bằng random. Nguyên nhân: kho build bằng `distiluse` nhưng truy vấn bằng `vietnamese-sbert` (2 không gian vector). Đã fix bằng `reembed_chroma_sbert.py`, sau đó SBERT tăng lên 47.9%/59.4% — quy trình đánh giá phát hiện lỗi thật và xác nhận sửa thật.

**Hỏi 4: "Macro-F1 khác Top-1 ở điểm nào, vì sao cần?"**
Trả lời: Top-1 chỉ đo đúng/sai từng câu; Macro-F1 tính F1 của từng lớp (bài thơ) rồi lấy trung bình không trọng số (eval_retrieval_scientific.py:269-273) — phát hiện hệ thống "đổ dồn" vào vài bài phổ biến mà bỏ quên bài hiếm, vốn là bẫy của accuracy trên dữ liệu không cân bằng.

**Hỏi 5: "Hybrid RRF là gì, tại sao đưa vào?"**
Trả lời: Reciprocal Rank Fusion — gộp 2 bảng xếp hạng (TF-IDF và SBERT) bằng công thức điểm Σ 1/(K + hạng) với K=60 (eval_retrieval_scientific.py:211-224), kỹ thuật fuse kinh điển trong tài liệu RAG. Ở đây nó đạt 68.8%/72.9% — giữa 2 phương pháp thành phần, cho thấy fusion không tự động tốt hơn khi một thành phần (SBERT lúc đó) đang yếu.
