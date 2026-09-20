# 📄 build_vector_db.py — Script build ChromaDB v1: đọc JSON dữ liệu thơ → embed → nạp vector database

**Vị trí:** `python-backend/build_vector_db.py` | **Số dòng:** ~94 | **Vai trò trong hệ thống:** Script **khởi thuông** (bản v1) chuyển dữ liệu JSON SGK thành ChromaDB — định hình cấu trúc passage (general + detailed_analysis + x_ray + outline) mà toàn bộ hệ thống về sau dùng; các hạn chế của nó (model `distiluse`, metadata thiếu `poem_id`) chính là lý do ra đời 2 script `reembed_chroma_sbert.py` và bản DB hiện tại.

## 1. File này làm gì? (30 giây)
Đây là script ETL đầu tiên của dự án: quét toàn bộ file JSON trong `../../data` (build_vector_db.py:13, 34), với mỗi bài thơ tạo 1 passage "tác giả & tác phẩm" tổng quan (build_vector_db.py:43-46) và N passage "phân tích chi tiết" gộp Section + thơ gốc + X-Ray + Outline (build_vector_db.py:49-69); embed toàn bộ bằng `distiluse-base-multilingual-cased-v2` (build_vector_db.py:19, 75) rồi `collection.add` vào ChromaDB persistent tại `./chroma_db` (build_vector_db.py:14, 23-27, 79-84); cuối cùng chạy 1 truy vấn test với câu hỏi "thơ hai-cư Ba-sô" (build_vector_db.py:91-95).

## 2. Đầu vào / Đầu ra
- **Đầu vào:** các file JSON trong `DATA_DIR = Path("../../data")` (build_vector_db.py:13) — mỗi file 1 bài thơ với schema: `document_id`, `general_knowledge.author_and_work`, `detailed_analysis[]` (mỗi section có `section_name`, `original_text[]`, `x_ray_data[]` gồm `target_words`/`art_type`/`effect`, `section_outline[]` gồm `point`/`conclusion`).
- **Đầu ra:** ChromaDB persistent tại `CHROMA_DIR = Path("./chroma_db")` (build_vector_db.py:14), collection `viet_poetry_knowledge` (build_vector_db.py:15) chứa passages + embeddings + id dạng `{document_id}_general` / `{document_id}_{section_name}` (build_vector_db.py:46, 69).
- **Lưu ý schema metadata v1:** mỗi document chỉ có `{"source": str(i)}` (build_vector_db.py:83) — **chưa có `poem_id`**, khác với DB hiện tại mà `rag_query.py` cần để filter theo bài.

## 3. Luồng xử lý chính (từng bước)
1. **Load model:** `SentenceTransformer('distiluse-base-multilingual-cased-v2')` ngay ở mức module (build_vector_db.py:19) — model đa ngôn ngữ công khai, chạy được lúc mới bắt đầu dự án.
2. **Mở ChromaDB:** `PersistentClient(path='./chroma_db')` + `get_or_create_collection` kèm metadata mô tả (build_vector_db.py:23-27).
3. **Duyệt JSON (sorted để thứ tự ổn định, build_vector_db.py:34-35):**
   - Passage tổng quan: `general_knowledge.author_and_work` → id `{doc_id}_general` (build_vector_db.py:43-46).
   - Với mỗi section trong `detailed_analysis`: dựng text gộp `Section: {tên}\nOriginal text:\n{thơ gốc}` (build_vector_db.py:49-54); nối tiếp khối "X-Ray Analysis:" mỗi dòng `- {target_words}: {art_type} - {effect}` (build_vector_db.py:57-60); nối khối "Outline:" mỗi dòng `- {point}: {conclusion}` (build_vector_db.py:63-66); id `{doc_id}_{section_name}` (build_vector_db.py:69).
4. **Embed hàng loạt:** `model.encode(all_docs, show_progress_bar=True)` (build_vector_db.py:75).
5. **Nạp DB:** `collection.add(embeddings, documents, ids, metadatas=[{"source": i}])` (build_vector_db.py:79-84); in tổng số document (build_vector_db.py:86-87).
6. **Smoke test:** truy vấn `query_texts` "thơ hai-cư Ba-sô" lấy 2 kết quả để xác nhận DB dùng được (build_vector_db.py:91-95).

## 4. Các hàm/class chính & vai trò
| Tên | Dòng | Làm gì |
|---|---|---|
| `DATA_DIR` | build_vector_db.py:13 | Trỏ tới thư mục JSON nguồn `../../data` — **tính theo CWD**, buộc phải chạy từ đúng thư mục. |
| `CHROMA_DIR` / `COLLECTION_NAME` | build_vector_db.py:14-15 | Nơi lưu DB `./chroma_db` và tên collection `viet_poetry_knowledge` (giữ nguyên đến hôm nay, rag_query.py:37). |
| model `SentenceTransformer(...)` | build_vector_db.py:19 | Model embed v1: `distiluse-base-multilingual-cased-v2` — sau này bị phát hiện **không khớp** với model truy vấn (xem `reembed_chroma_sbert.py`). |
| `client` / `collection` | build_vector_db.py:23-27 | Tạo/kết nối ChromaDB persistent, collection có metadata mô tả. |
| (vòng lặp chính) | build_vector_db.py:37-69 | Biến 1 file JSON thành 1 passage general + N passage section (gộp thơ gốc + X-Ray + Outline). |
| `collection.add(...)` | build_vector_db.py:79-84 | Ghi embeddings/documents/ids/metadatas vào DB. |
| (test query) | build_vector_db.py:91-95 | Truy vấn mẫu kiểm tra DB hoạt động. |

## 5. Điểm kỹ thuật đáng chú ý
- **Cấu trúc passage này vẫn đang sống trong DB hiện tại:** kiểu `type = 'x_ray'` mà `rag_query._extract_key_points` xử lý (rag_query.py:296-301) và nội dung "- từ: loại biện pháp - tác dụng" chính là format được định hình ở đây (build_vector_db.py:57-60) — dữ liệu lịch sử nhưng thiết kế giữ nguyên.
- **Hạn chế v1 đã được thừa nhận và sửa:** (1) model `distiluse` khác model truy vấn `keepitreal/vietnamese-sbert` → 2 không gian vector, retrieval ngẫu nhiên Top-1 = 6.2% (được ghi lại trong docstring của `reembed_chroma_sbert.py` và phát hiện nhờ `eval_retrieval_scientific.py`); (2) path tính theo CWD (`../../data`, `./chroma_db`) → các script sau chuyển sang `Path(__file__).parent`; (3) metadata chỉ có `source` index, chưa có `poem_id` để filter theo bài như `rag_query.query` cần (rag_query.py:161).
- **Chunking gộp thông tin:** mỗi passage tự chứa ngữ cảnh đầy đủ (tên section + thơ gốc + phân tích X-Ray + outline) — giúp mỗi vector "tự mô tả" khi tìm kiếm, không phụ thuộc passage khác.
- **Kết quả cuối được in ra kiểm chứng:** tổng số documents (build_vector_db.py:71) và số document trong collection sau khi add (build_vector_db.py:86).

## 6. 🎤 Giám khảo hay hỏi gì?
**Hỏi 1: "Dữ liệu trong vector DB đến từ đâu, ai soạn?"**
Trả lời: Từ bộ JSON 16 bài thơ SGK 2018 do nhóm xây dựng trong `public/data` — mỗi bài gồm kiến thức chung, phân tích theo section, "X-Ray" (từ/câu thơ → biện pháp nghệ thuật → tác dụng) và dàn ý; script này chunking thành passages rồi embed (build_vector_db.py:37-69).

**Hỏi 2: "Vì sao script này dùng distiluse mà hệ thống lại truy vấn bằng vietnamese-sbert?"**
Trả lời: Đó là sự thật lịch sử — bản build đầu dùng model công khai distiluse (build_vector_db.py:19). Khi chạy đánh giá khoa học (4/9/2026) phát hiện Top-1 chỉ 6.2% ≈ random vì 2 model thuộc 2 không gian vector khác nhau; đã sửa triệt để bằng `reembed_chroma_sbert.py`: giữ nguyên documents, chỉ re-embed toàn bộ bằng đúng model truy vấn.

**Hỏi 3: "Chunking của bạn như thế nào?"**
Trả lời: 2 mức mỗi bài: 1 passage "author_and_work" cho bối cảnh chung (build_vector_db.py:43-46), và mỗi section phân tích 1 passage gộp thơ gốc + X-Ray + outline (build_vector_db.py:49-69). Chunk tự đủ ngữ cảnh nên khi truy hồi 1 passage, LLM/template đã có đủ thông tin trả lời.

**Hỏi 4: "Vì sao id passage dạng `{doc_id}_{section_name}`?"**
Trả lời: Để id duy nhất, dễ lần lại nguồn (ví dụ `trao_duyen_..._so_do`), và khi re-embed sau này chỉ cần `upsert` theo đúng id cũ mà không phá kho (reembed_chroma_sbert.py:52-54 dùng chính ids này).

**Hỏi 5: "Script này có chạy được trong bản USB không?"**
Trả lời: Đây là script offline tool (chạy 1 lần khi build DB), không nằm trong runtime; DB thành phẩm `chroma_db/` đi kèm USB, và các script runtime (`rag_query`, `llm_generator`, `reembed`) đều dùng path từ `__file__` để đóng gói an toàn.
