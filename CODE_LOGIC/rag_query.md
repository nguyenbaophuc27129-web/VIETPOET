# 📄 rag_query.py — Trái tim RAG pipeline: retrieval ChromaDB + prompt Socratic + sinh câu trả lời

**Vị trí:** `python-backend/rag_query.py` | **Số dòng:** ~511 | **Vai trò trong hệ thống:** Class `RAGPipeline` được `server.py` và `eval_retrieval_scientific.py` dùng chung — encode câu hỏi bằng SBERT, truy hồi passages trong ChromaDB, dựng context và sinh câu trả lời **Socratic** (không bao giờ làm hộ bài tập).

## 1. File này làm gì? (30 giây)
Đây là **module trung tâm** của hệ thống: nhận một câu hỏi Ngữ văn, chuyển thành vector embedding (chuẩn hóa, rag_query.py:154-158), tìm các đoạn trích tương đồng nhất trong ChromaDB 456 passages / 16 bài thơ SGK 2018 (rag_query.py:163-167), đổi khoảng cách L2² sang cosine similarity để lọc theo `min_score` (rag_query.py:178-179), rồi trả lời theo **phương pháp Socratic**: chỉ gợi mở, luôn kết thúc bằng câu hỏi gợi mở, và **từ chối viết bài mẫu** (rag_query.py:256-265). Hỗ trợ 2 chế độ sinh lời: LLM (nếu được gắn qua `set_llm`) hoặc template nhanh ~200ms.

## 2. Đầu vào / Đầu ra
- **Đầu vào:**
  - `query(question, poem_id?, top_k=3, min_score=0.35)` (rag_query.py:127-133) — câu hỏi tiếng Việt, slug bài thơ tùy chọn, số passages cần, ngưỡng tương đồng tối thiểu.
- **Đầu ra:** dict (rag_query.py:211-223) gồm `answer` (chuỗi trả lời Socratic), `sources` (danh sách passages), `passage_metadata`, `confidence` (TB top-3 scores, rag_query.py:384-391), `metadata` (`retrieved`, `avg_score`, `timestamp`).
- **Phụ thuộc tĩnh:** `CHROMA_DIR = Path(__file__).parent / 'chroma_db'` (rag_query.py:36), `COLLECTION_NAME = "viet_poetry_knowledge"` (rag_query.py:37), `MODEL_NAME` (rag_query.py:42-45), bảng `POEM_TITLES` 16 bài (rag_query.py:48-65).

## 3. Luồng xử lý chính (từng bước)
1. **Cấu hình khi import:** fix UTF-8 console win32 (rag_query.py:27-30); `CHROMA_DIR` tính **từ `__file__`** (rag_query.py:36) — nếu bản copy local `models/vietnamese-sbert` tồn tại thì `MODEL_NAME` trỏ vào đó để chạy **100% offline**, không thì dùng tên hub `keepitreal/vietnamese-sbert` (rag_query.py:42-45).
2. **`initialize()` (rag_query.py:99-125):** load `SentenceTransformer` (nếu model chính lỗi → fallback `distiluse-base-multilingual-cased-v2`, rag_query.py:112); mở `chromadb.PersistentClient` và `get_collection` — lỗi DB thì raise, không chạy nửa vời (rag_query.py:117-123).
3. **`query()` — 6 bước (rag_query.py:127-223):**
   1. Encode câu hỏi với `normalize_embeddings=True` (rag_query.py:154-158).
   2. Truy vấn ChromaDB với `where={"poem_id": poem_id}` nếu có, lấy dư `top_k * 2` rồi lọc (rag_query.py:161-167).
   3. Đổi điểm: ChromaDB trả khoảng cách L2², với embedding chuẩn hóa thì `cosine = 1 − L2²/2` (rag_query.py:176-178); giữ passage có `similarity >= min_score`, cắt còn `top_k` (rag_query.py:179-187).
   4. Nếu rỗng → trả `_fallback_response` với `confidence=0` (rag_query.py:189-200) — để `server.py` quyết định các tầng fallback tiếp theo.
   5. Dựng context `_build_context` (đánh số `[i] poem_id (type)`, rag_query.py:225-238) rồi `_generate_socratic_response` (rag_query.py:206).
   6. Tính `confidence` = trung bình top-3 scores (rag_query.py:209, 384-391).
4. **Sinh câu trả lời Socratic (rag_query.py:240-286):** dò từ khóa xin bài mẫu ('bài mẫu', 'viết bài', 'áp án', 'cho tôi', 'giải', 'làm giúp', 'viết giúp', 'kết quả') → `_essay_refusal_response` (rag_query.py:257-265); nếu có LLM đã load → ưu tiên `llm.generate_socratic` (rag_query.py:268-271); không thì dựng **template nhanh**: trích điểm chính (`_extract_key_points`, tối đa 3 gạch đầu dòng từ top-2 passages, rag_query.py:288-312) + câu hỏi gợi mở theo chủ đề ẩn dụ/nghệ thuật/nội dung/generic (rag_query.py:314-360).
5. **Chạy độc lập:** `RAGAPI` (Flask, tùy chọn, rag_query.py:395-473) hoặc CLI `main()` với argparse `--poem-id --top-k --api --port` (rag_query.py:477-508).

## 4. Các hàm/class chính & vai trò
| Tên | Dòng | Làm gì |
|---|---|---|
| `CHROMA_DIR` | rag_query.py:36 | Đường dẫn ChromaDB tính từ `__file__` — chạy đúng ở mọi cấu trúc thư mục, kể cả bản đóng gói USB (comment ghi rõ bài học thực tế: packaged vào `USB/server/` thì path cũ trỏ ra ngoài → mất kho tri thức). |
| `MODEL_NAME` + `_LOCAL_SBERT` | rag_query.py:42-45 | Ưu tiên bản SBERT copy local trong `python-backend/models/vietnamese-sbert` (offline cho máy vùng núi không có Internet/HF cache); thiếu thì mới dùng hub `keepitreal/vietnamese-sbert`. |
| `POEM_TITLES` / `poem_title()` | rag_query.py:48-65 / 68-72 | Map 16 slug → tên bài thân thiện để hiển thị cho học sinh. |
| `RAGPipeline.__init__` | rag_query.py:87-93 | Khởi tạo rỗng, `llm=None`; `_initialized` guard để không load lại model. |
| `RAGPipeline.set_llm` | rag_query.py:95-97 | Gắn `SocraticLLM` từ `llm_generator`; `None` = dùng template nhanh. |
| `RAGPipeline.initialize` | rag_query.py:99-125 | Load SBERT (có fallback model dự phòng) + mở ChromaDB persistent. |
| `RAGPipeline.query` | rag_query.py:127-223 | Pipeline 6 bước: encode → search (where filter, `n_results=top_k*2`) → lọc cosine ≥ `min_score` (mặc định 0.35) → context → socratic answer → confidence. |
| `_build_context` | rag_query.py:225-238 | Ghép passages thành context đánh số `[1] poem_id (type): ...` ngăn bởi `---`. |
| `_generate_socratic_response` | rag_query.py:240-286 | Não Socratic: chặn yêu cầu bài mẫu; ưu tiên LLM; fallback template (key points + câu hỏi gợi mở). |
| `_extract_key_points` | rag_query.py:288-312 | Rút tối đa 3 điểm từ top-2 passages (x_ray → dòng đầu; thường → câu dài >20 ký tự). |
| `_generate_guiding_questions` | rag_query.py:314-360 | Chọn câu hỏi gợi mở theo từ khóa trong câu hỏi (ẩn dụ/biện pháp, nghệ thuật, nội dung, generic) + câu hỏi theo sau. |
| `_essay_refusal_response` | rag_query.py:362-375 | Từ chối viết bài mẫu một cách nhẹ nhàng, đổi thành gợi ý để học sinh tự viết. |
| `_fallback_response` | rag_query.py:377-382 | Câu trả lời trung thực khi không passage nào đạt ngưỡng. |
| `_calculate_confidence` | rag_query.py:384-391 | Confidence = TB score của top-3 passages, làm tròn 3 chữ số. |
| `RAGAPI` | rag_query.py:395-473 | Wrapper Flask+CORS tùy chọn (chạy microservice không cần FastAPI). |
| `main()` | rag_query.py:477-508 | CLI test: hỏi một câu hoặc `--api` chạy server Flask. |

## 5. Điểm kỹ thuật đáng chú ý
- **`CHROMA_DIR` từ `__file__` = đóng gói USB di động:** comment tại rag_query.py:33-35 ghi nhận lỗi thực tế — khi đóng gói vào `USB/server/`, đường dẫn tính theo CWD trỏ ra ngoài project → mất kho tri thức. Tính theo vị trí file giúp app chạy đúng ở mọi nơi, chỉ cần nguyên thư mục `python-backend/`.
- **MODEL_NAME ưu tiên bản local offline (rag_query.py:39-45):** máy at trường vùng núi không có Internet; bản copy `models/vietnamese-sbert` đảm bảo khởi động không cần HuggingFace Hub. Fallback nữa ở `initialize()` sang `distiluse-base-multilingual-cased-v2` nếu model chính hỏng (rag_query.py:112).
- **Sửa đúng công thức similarity:** ChromaDB trả L2² (0→2); với embedding chuẩn hóa, `cosine = 1 − L2²/2` (rag_query.py:176-178) — chỗ nhiều bạn hay quên và lọc nhầm ngưỡng.
- **Triết lý sư phạm cài bằng code:** bộ từ khóa chặn "xin bài mẫu" (rag_query.py:258-261) + cấu trúc trả lời luôn kết thúc bằng câu hỏi gợi mở → app *dạy cách nghĩ*, không *làm hộ* — đúng thông điệp dự án "gia sư AI, không phải máy viết bài".

## 6. 🎤 Giám khảo hay hỏi gì?
**Hỏi 1: "RAG của bạn chống "ảo giác" (hallucination) bằng cách nào?"**
Trả lời: Câu trả lời chỉ được dựng từ passages đã truy hồi (context đánh số nguồn tại rag_query.py:225-238); không passage nào qua ngưỡng cosine thì trả lời "chưa có dữ liệu" (rag_query.py:189-200); LLM nếu dùng cũng bị ràng buộc "chỉ dùng NGỮ CẢNH đã cho" ở system prompt của `llm_generator.py`, và sai format là bị từ chối, quay về template.

**Hỏi 2: "Phương pháp Socratic cài vào code chỗ nào?"**
Trả lời: 3 chỗ — chặn từ khóa xin đáp án (rag_query.py:257-262), `_generate_guiding_questions` sinh câu hỏi gợi mở theo chủ đề (rag_query.py:314-360), và `_essay_refusal_response` từ chối khéo kèm gợi ý (rag_query.py:362-375). LLM mode cũng bắt buộc trả lời có ký hiệu 💭 (câu hỏi gợi mở) mới được chấp nhận.

**Hỏi 3: "Vì sao đường dẫn DB tính từ `__file__`?"**
Trả lời: Để đóng gói USB di động. Path theo CWD đã từng gây lỗi thật: khi app nằm ở `USB/server/`, path cũ trỏ ra ngoài thư mục gói → không tìm thấy ChromaDB (comment rag_query.py:33-35). `Path(__file__).parent` luôn đúng bất kể chạy từ đâu.

**Hỏi 4: "Máy không có mạng có chạy được không?"**
Trả lời: Được. `MODEL_NAME` ưu tiên bản copy local `models/vietnamese-sbert` ngay cạnh file (rag_query.py:43-45); ChromaDB là file cục bộ; LLM cũng chạy offline bằng OpenVINO INT8. Toàn hệ thống zero-cloud.

**Hỏi 5: "Điểm số confidence nghĩa là gì?"**
Trả lời: Trung bình cosine similarity của top-3 passages (rag_query.py:384-391), trả về cùng metadata (`avg_score`) — frontend dùng để hiển thị mức độ tin cậy, và `server.py` dùng `retrieved/avgScore` để quyết định fallback.
