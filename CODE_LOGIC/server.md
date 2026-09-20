# 📄 server.py — API server FastAPI (cổng 5000), cổng vào duy nhất của frontend Next.js đến RAG pipeline

**Vị trí:** `python-backend/server.py` | **Số dòng:** ~188 | **Vai trò trong hệ thống:** Microservice HTTP khớp contract `src/app/api/ai/route.ts` — nhận câu hỏi của học sinh, gọi `RAGPipeline` (kèm cơ chế **fallback 2 tầng**), trả về câu trả lời Socratic + sources + confidence.

## 1. File này làm gì? (30 giây)
Đây là **entry point chính** của backend Python: chạy FastAPI/uvicorn tại `http://localhost:5000` (server.py:14, server.py:188). Khi khởi động, nó load sẵn model SBERT + ChromaDB vào RAM qua `lifespan` (server.py:84-99) để mọi request đều nhanh. Có 3 endpoint: `GET /health` (server.py:110-123), `POST /query` (server.py:126-171) và `GET /statistics` (server.py:174-183). Điểm nhấn của `/query` là **chuỗi fallback 2 tầng** giúp học sinh hầu như không bao giờ nhận câu trả lời "rỗng".

## 2. Đầu vào / Đầu ra
- **Đầu vào** — `POST /query` (Pydantic `RAGQueryRequest`, server.py:54-57):
  - `question: str` — câu hỏi của học sinh (bắt buộc).
  - `poemId: Optional[str]` — slug bài thơ đang học, ví dụ `thuyen_va_bien_xuan_quynh`.
  - `topK: int` = 3, ràng buộc `ge=1, le=10`.
- **Đầu ra** — `RAGQueryResponse` (server.py:70-76): `{role, content, sources[], confidence, ragEnabled, metadata{poemId, query, retrieved, avgScore, filteredByPoem, model, timestamp}}` — đúng format mà `api/ai/route.ts` phía Next.js đang mong đợi.
- **Env:** `VIETPOET_LLM=true|1|yes` → bật chế độ LLM (server.py:26); mặc định TẮT → template Socratic ~200ms.

## 3. Luồng xử lý chính (từng bước)
1. **Khởi động (lifespan):** tạo `RAGPipeline()` ở mức module (server.py:81); trong lifespan gọi `rag.initialize()` để load SBERT + ChromaDB 456 passages (server.py:88-89). Nếu `LLM_ENABLED`, import `SocraticLLM`, `load()` rồi `rag.set_llm(llm)` (server.py:91-98); lỗi LLM chỉ cảnh báo, server vẫn chạy bằng template.
2. **Nhận request:** strip câu hỏi; nếu rỗng → trả lời nhắc nhở với `confidence=0` (server.py:134-143).
3. **Bước 1 — truy vấn có filter:** `rag.query(question, req.poemId, req.topK)` với `min_score` mặc định **0.35** (server.py:146).
4. **FALLBACK TẦNG 1 — nới ngưỡng, VẪN ở đúng bài đang học:** nếu `retrieved == 0` → `rag.query(question, req.poemId, req.topK, min_score=0.22)` (server.py:150-152).
5. **FALLBACK TẦNG 2 — mở rộng toàn kho 16 bài:** nếu vẫn `retrieved == 0` → `rag.query(question, None, req.topK, min_score=0.30)` (server.py:155-156).
6. **Trả response:** bọc `answer/sources/confidence` vào `RAGQueryResponse` kèm metadata (`filteredByPoem` báo cho frontend biết kết quả có nằm trong bài đang học hay không) (server.py:158-171).

**Vì sao cần fallback 2 tầng?** Học sinh thường diễn đạt câu hỏi khác văn phong của kho trích dẫn (ví dụ hỏi "tâm trạng người lính" trong khi kho dùng "nỗi nhớ làng quê của người chiến sĩ"). Nếu chỉ có bước 1 với ngưỡng 0.35 + filter theo bài, hệ thống trả về "chưa có dữ liệu" → trải nghiệm gián đoạn. Tầng 1 (0.22, cùng bài) xử lý trường hợp *hỏi đúng bài nhưng diễn giải khác* — vẫn giữ nguyên bối cảnh bài thơ đang học, không dạy lan man. Tầng 2 (0.30, toàn kho) xử lý trường hợp *bài đó thật sự không có nội dung liên quan* — học sinh vẫn nhận được gợi ý từ bài liên quan thay vì bế tắc; ngưỡng 0.30 cao hơn 0.22 vì khi bỏ filter bài, kết quả dễ nhiễu nên cần chặt hơn. Toàn bộ vẫn là retrieval thật (zero hallucination), không phải bịa câu trả lời.

## 4. Các hàm/class chính & vai trò
| Tên | Dòng | Làm gì |
|---|---|---|
| `LLM_ENABLED` (biến) | server.py:26 | Đọc env `VIETPOET_LLM` để bật/tắt chế độ sinh câu trả lời bằng LLM. |
| (khối fix stdout/stderr) | server.py:28-47 | Sau khi import `rag_query` (lệch wrapper TextIOWrapper trên win32), gọi `detach()` và khôi phục stream gốc rồi `reconfigure(encoding='utf-8')` — tránh `ValueError: I/O operation on closed file` khi GC dọn wrapper. |
| `RAGQueryRequest` | server.py:54-57 | Pydantic model của request: `question`, `poemId`, `topK` (1→10, mặc định 3). |
| `RAGQueryMetadata` | server.py:60-67 | Metadata phản hồi: `poemId, query, retrieved, avgScore, filteredByPoem, model, timestamp`. |
| `RAGQueryResponse` | server.py:70-76 | Pydantic model của response, khớp contract `api/ai/route.ts`. |
| `lifespan` | server.py:84-99 | Load SBERT + ChromaDB một lần khi startup; load + gắn `SocraticLLM` nếu `VIETPOET_LLM=true` (lỗi → fallback template). |
| `app = FastAPI(...)` | server.py:102-107 | App v3.0, mô tả "zero hallucination trên 16 bài thơ SGK 2018". |
| `health()` | server.py:110-123 | `GET /health`: trạng thái, tên model, số passages, backend LLM đang dùng (`qwen2.5-1.5b (openvino/transformers)` hoặc `disabled`). |
| `query(req)` | server.py:126-171 | `POST /query`: chuỗi 3 bước (bước 1 ngưỡng 0.35 → fallback 1: 0.22 cùng bài → fallback 2: 0.30 toàn kho) rồi đóng gói response. |
| `statistics()` | server.py:174-183 | `GET /statistics`: collection, số passages, model, 16 bài, `offline: True` — dùng cho demo/báo cáo. |
| `__main__` | server.py:186-188 | `uvicorn.run(app, host='0.0.0.0', port=5000)`. |

## 5. Điểm kỹ thuật đáng chú ý
- **Fallback 2 tầng là "an toàn mạng lưới" cho trải nghiệm học sinh:** giảm từ 0.35 → 0.22 trong cùng bài trước, rồi mới mở toàn kho ở 0.30 — cân bằng giữa *luôn có câu trả lời* và *không trả lời lệch bài/vô nghĩa*. Frontend còn nhận cờ `filteredByPoem` để hiển thị "mở rộng tìm kiếm sang bài khác".
- **Khớp contract 100% với Next.js:** Pydantic models (server.py:54-76) mô phỏng đúng type của `src/app/api/ai/route.ts`, nên frontend không cần sửa gì khi chuyển từ mock sang backend thật.
- **Xử lý lỗi encoding Windows một cách chủ động:** đoạn `detach()`/reconfigure (server.py:28-47) giải quyết bug thực tế: `rag_query.py` thay `sys.stdout` bằng `TextIOWrapper` mới chia sẻ buffer gốc — nếu GC đóng wrapper thì buffer gốc cũng bị đóng → crash.
- **Load-heavy một lần duy nhất:** model + DB + LLM load trong `lifespan` (không load mỗi request), nên template mode trả lời ~200ms.

## 6. 🎤 Giám khảo hay hỏi gì?
**Hỏi 1: "Nếu học sinh hỏi lệch bài, hệ thống có trả lời bậy không?"**
Trả lời: Không. Ba lớp ngưỡng 0.35 → 0.22 (cùng bài) → 0.30 (toàn kho) đều là ngưỡng tương đồng cosine thật; nếu không passage nào đạt, hệ thống trả lời trung thực "chưa có dữ liệu" thay vì bịa (server.py:189-200 của rag_query). Fallback chỉ mở rộng phạm vi tìm kiếm, không bao giờ tự sinh nội dung ngoài kho.

**Hỏi 2: "Vì sao chọn ngưỡng 0.22 và 0.30 chứ không một ngưỡng duy nhất?"**
Trả lời: Khi còn filter theo bài, không gian tìm kiếm chỉ ~28 passages/16 bài nên có thể nới xuống 0.22 để bắt cả câu hỏi diễn giải khác văn phong. Khi mở toàn kho 456 passages, xác suất nhiễu tăng nên siết lại 0.30. Hai ngưỡng = hai mức rủi ro khác nhau.

**Hỏi 3: "LLM chậm thì sao? Học sinh chờ bao lâu?"**
Trả lời: LLM là tùy chọn qua env `VIETPOET_LLM` (server.py:24-26). Mặc định dùng template Socratic ~200ms; bật LLM thì ~5-15s cho câu trả lời tự nhiên hơn, và nếu LLM lỗi/hỏng format, `rag_query` tự fallback về template — server không bao giờ chết vì LLM.

**Hỏi 4: "Frontend giao tiếp thế nào, có phải sửa code web không?"**
Trả lời: Không. Endpoint `POST /query` và `GET /health` giữ đúng contract của `src/app/api/ai/route.ts` (server.py:7-9), Next.js chỉ cần gọi localhost:5000 như một microservice.

**Hỏi 5: "Làm sao biết server còn sống khi demo?"**
Trả lời: `GET /health` trả về trạng thái, số passages (456), model và backend LLM đang chạy (server.py:110-123); `GET /statistics` cho số liệu kho tri thức phục vụ demo trực tiếp.
