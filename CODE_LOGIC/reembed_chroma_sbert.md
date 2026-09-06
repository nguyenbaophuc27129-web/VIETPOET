# 📄 reembed_chroma_sbert.py — Script "cứu" kho vector: re-embed toàn bộ ChromaDB bằng đúng model truy vấn + tự kiểm chứng

**Vị trí:** `python-backend/reembed_chroma_sbert.py` | **Số dòng:** ~74 | **Vai trò trong hệ thống:** Fix một bug nghiêm trọng tìm ra nhờ đánh giá khoa học — kho vector và truy vấn dùng 2 model embedding khác nhau; script này đồng bộ lại không gian vector mà không phải build lại DB từ đầu.

## 1. File này làm gì? (30 giây)
Script chạy 1 lần để sửa lỗi do `eval_retrieval_scientific.py` phát hiện ngày 4/9/2026 (reembed_chroma_sbert.py:6-9): kho passages được build bằng `distiluse-base-multilingual-cased-v2` nhưng server truy vấn bằng `keepitreal/vietnamese-sbert` → 2 không gian vector không tương thích → truy hồi ngẫu nhiên (Top-1 = 6.2% = random). Cách sửa tối ưu: **giữ nguyên documents/metadata/chunking hiện có, CHỈ thay embedding** (reembed_chroma_sbert.py:11) — đọc hết passages (reembed_chroma_sbert.py:31-37), encode lại chuẩn hóa (reembed_chroma_sbert.py:43-45), `upsert` ngược vào collection (reembed_chroma_sbert.py:52-54), rồi tự verify bằng 3 câu hỏi mẫu phải truy đúng bài (reembed_chroma_sbert.py:56-73), thoát với exit code 0/1 để CI nhận biết (reembed_chroma_sbert.py:74).

## 2. Đầu vào / Đầu ra
- **Đầu vào:**
  - ChromaDB hiện có: `chroma_db/` collection `viet_poetry_knowledge` — lấy `ids`, `documents`, `metadatas` (reembed_chroma_sbert.py:33-36).
  - Model: `keepitreal/vietnamese-sbert` (reembed_chroma_sbert.py:29) — đúng model mà `rag_query.py` dùng khi truy vấn.
- **Đầu ra:**
  - Collection được `upsert` với embedding mới (normalized) cho cùng ids/documents/metadata (reembed_chroma_sbert.py:53-54).
  - Báo cáo console: số passages, số bài thơ, shape embedding, norm trung bình, kết quả 3 câu verify; **exit code 0** nếu cả 3 câu truy đúng bài, **1** nếu có câu sai (reembed_chroma_sbert.py:74).

## 3. Luồng xử lý chính (từng bước)
1. **Chuẩn bị:** fix UTF-8 console win32 (reembed_chroma_sbert.py:18-22); các path tính từ `__file__`: `PY_DIR`, `CHROMA_DIR = PY_DIR / 'chroma_db'` (reembed_chroma_sbert.py:26-27) — cùng quy ước đóng gói USB với `rag_query.py`.
2. **Đọc kho hiện tại:** `PersistentClient` → `get_collection` → `col.get(include=['documents','metadatas'])`; in số passages và số bài thơ riêng biệt (đếm `poem_id` trong metadata) (reembed_chroma_sbert.py:31-37).
3. **Load model đúng:** `SentenceTransformer('keepitreal/vietnamese-sbert')` (reembed_chroma_sbert.py:40-41).
4. **Encode lại toàn bộ:** `model.encode(docs, batch_size=32, normalize_embeddings=True)` có progress bar, đo thời gian, in shape (reembed_chroma_sbert.py:43-46).
5. **Kiểm tra chuẩn hóa:** tính norm trung bình các vector, phải ≈ 1.0 (reembed_chroma_sbert.py:49-50) — điều kiện để công thức `cosine = 1 − L2²/2` ở runtime đúng.
6. **Upsert:** `col.upsert(ids, embeddings, documents, metadatas)` — không đụng ids/documents/metadata, chỉ thay vector (reembed_chroma_sbert.py:52-54).
7. **Verify 3 câu hỏi mẫu (reembed_chroma_sbert.py:56-71):**
   - "Chi tiết tựa vai chồng nói lên điều gì?" → kỳ vọng `duong_phu_hanh_cao_ba_quat`.
   - "Cảm xúc của nhà thơ trước cảnh hoàng hôn trên sông" → kỳ vọng `trang_giang_huy_can`.
   - "Tâm trạng nhớ làng quê của người chiến sĩ cách mạng" → kỳ vọng `nho_dong_to_huu`.
   - Mỗi câu: encode chuẩn hóa → `col.query` top-3 → lấy `poem_id` của kết quả số 1 và similarity `1 − dist/2` (reembed_chroma_sbert.py:68), in ✅/❌.
8. **Kết luận + exit code:** cả 3 đúng → "THÀNH CÔNG — restart RAG server để áp dụng!", ngược lại cảnh báo kiểm tra lại; `sys.exit` 0/1 (reembed_chroma_sbert.py:73-74).

## 4. Các hàm/class chính & vai trò
| Tên | Dòng | Làm gì |
|---|---|---|
| (hằng số) `CHROMA_DIR` | reembed_chroma_sbert.py:27 | Đường dẫn DB tính từ `__file__` — di động theo gói USB. |
| (hằng số) `COLLECTION_NAME` | reembed_chroma_sbert.py:28 | `viet_poetry_knowledge` — cùng collection với runtime. |
| (hằng số) `SBERT_MODEL` | reembed_chroma_sbert.py:29 | `keepitreal/vietnamese-sbert` — model đồng bộ với truy vấn của `rag_query.py`. |
| (khối đọc DB) | reembed_chroma_sbert.py:31-37 | Mở ChromaDB, lấy toàn bộ ids/documents/metadatas, thống kê passages + số bài thơ. |
| (khối encode) | reembed_chroma_sbert.py:39-50 | Load SBERT, encode toàn bộ docs (batch 32, normalized), kiểm chứng norm ≈ 1.0. |
| (khối upsert) | reembed_chroma_sbert.py:52-54 | Ghi đè embedding mới vào collection, giữ nguyên mọi thứ khác; in tổng số passages sau upsert. |
| (khối verify) | reembed_chroma_sbert.py:56-71 | 3 câu hỏi đại diện 3 dạng (chi tiết hành động "tựa vai chồng", cảnh "hoàng hôn trên sông", tâm trạng "nhớ làng quê") phải truy đúng bài. |
| (kết thúc) | reembed_chroma_sbert.py:73-74 | In thông báo và exit code 0/1 cho script/CI. |

## 5. Điểm kỹ thuật đáng chú ý
- **Tận dụng tính chất thay thế được của embedding:** vector chỉ là "phép chiếu" của document — documents/metadata/chunking giữ nguyên, chỉ cần upsert embedding mới theo cùng ids là kho hợp lệ ngay, tiết kiệm so với build lại từ JSON (reembed_chroma_sbert.py:11, 53).
- **"Mô hình index phải = mô hình query"** — bài học cốt lõi của mọi hệ RAG, được viết rõ trong docstring (reembed_chroma_sbert.py:6-9): lệch model = retrieval ngẫu nhiên dù dữ liệu hoàn toàn đúng. Con số 6.2% Top-1 chính là xác suất đoán đúng 1/16 bài → bằng chứng định lượng của chẩn đoán.
- **Verify có chọn lọc theo kiểu câu hỏi khác nhau:** 1 câu trích chi tiết ("tựa vai chồng"), 1 câu cảnh/không khí ("hoàng hôn trên sông"), 1 câu tâm trạng trừu tượng ("nhớ làng quê") — phủ 3 dạng nhận biết, tránh verify "trúng tủ" một dạng câu.
- **Kỷ luật kỹ thuật:** kiểm tra norm ≈ 1.0 sau encode (reembed_chroma_sbert.py:49-50) khớp với giả định cosine của `rag_query.py:176-178`; exit code 0/1 (reembed_chroma_sbert.py:74) giúp nhúng vào quy trình tự động.

## 6. 🎤 Giám khảo hay hỏi gì?
**Hỏi 1: "Bug này phát hiện bằng cách nào?"**
Trả lời: Bằng đánh giá khoa học trong `eval_retrieval_scientific.py` — SBERT truy hồi Top-1 chỉ 6.2%, đúng bằng random 1/16 bài; đội nghiệm lại toàn pipeline và thấy model index (distiluse) khác model query (vietnamese-sbert) (reembed_chroma_sbert.py:6-9).

**Hỏi 2: "Vì sao không build lại DB từ đầu cho sạch?"**
Trả lời: Vì dữ liệu nguồn JSON có thể đã thay đổi/ổn định ở dạng khác; re-embed giữ tuyệt đối nguyên documents/metadata/ids (reembed_chroma_sbert.py:11) nên không rủi ro làm mất hay lệch dữ liệu, chỉ thay 1 thành phần: vector. Nhanh và an toàn hơn.

**Hỏi 3: "Sau khi re-embed, độ chính xác ra sao?"**
Trả lời: Đánh giá lại bằng chính bộ test khoa học: SBERT Top-1 tăng lên 47.9% (bộ A) và 59.4% (bộ B) — không còn random; script này còn có 3 câu verify built-in (reembed_chroma_sbert.py:58-62) để kiểm tra nhanh mọi lần chạy.

**Hỏi 4: "Vì sao phải `normalize_embeddings=True`?"**
Trả lời: Runtime (`rag_query.py:178`) chuyển L2² sang cosine theo công thức `1 − L2²/2` — công thức này chỉ đúng khi vector đơn vị. Script tự in norm trung bình ≈ 1.0 để chứng minh điều kiện đó được thỏa (reembed_chroma_sbert.py:49-50).

**Hỏi 5: "Làm sao tin được kho sau khi sửa?"**
Trả lời: Ba lớp: (1) verify 3 câu hỏi mẫu phải đúng bài, sai là exit code 1 (reembed_chroma_sbert.py:64-74); (2) số passages/bài in ra để đối chiếu (reembed_chroma_sbert.py:37); (3) chạy lại bộ eval đầy đủ n=192 câu cho 5 phương pháp trong `eval_retrieval_scientific.py`.
