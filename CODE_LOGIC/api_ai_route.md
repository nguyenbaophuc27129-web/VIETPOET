# 📄 api/ai/route.ts — Trái tim của AI Tutor: chat RAG (ChromaDB + Qwen) tự fallback về smartAI rule-based

**Vị trí:** `src/app/api/ai/route.ts` | **Số dòng:** ~203 | **Được gọi từ:** `src/components/VoiceChat.tsx:351` (POST `/api/ai` với body `{messages, poemId, sectionIndex}`)

## 1. Endpoint này làm gì? (30 giây)

Đây là endpoint chat chính của gia sư AI. Khi học sinh hỏi một câu, route sẽ: (1) gửi câu hỏi sang RAG backend Python (FastAPI, `localhost:5000`) để retrieve từ 456 passages của 16 bài thơ SGK 2018 và sinh câu trả lời bằng LLM Qwen2.5-1.5B chạy OpenVINO → **zero hallucination**; (2) nếu RAG **không tìm thấy passage phù hợp** (retrieved=0 hoặc confidence=0) hoặc **RAG server tắt/chậm quá timeout**, route **không** trả lời "không tìm thấy" khô khan mà **tự động fallback sang `smartAI` rule-based Socratic** chạy 100% trong Next.js, không cần Python. Nhờ vậy người dùng luôn nhận được câu trả lời mang tính giảng dạy.

## 2. Đầu vào (method, body/query) / Đầu ra (JSON shape)

**POST /api/ai**
- Body: `{ messages: ChatMessage[], poemId?: string, sectionIndex?: number }` — `ChatMessage` là `{ role: 'user'|'assistant'|'system', content: string }` (route.ts:23-26). Route chỉ quan tâm **tin nhắn cuối cùng** và yêu cầu nó phải là `role: 'user'` (route.ts:39-42).
- Output thành công (RAG): `{ role, content, sources, confidence, poemId, sectionIndex, ragEnabled: true, metadata }` (route.ts:55-64).
- Output thành công (fallback smartAI): cùng shape nhưng `ragEnabled: false` và `metadata: { method: 'local_smartAI', query, timestamp }` (route.ts:81-94).
- Lỗi: 400 nếu thiếu `messages` / tin nhắn cuối không phải user (route.ts:35-42); 500 nếu exception khác (route.ts:96-105).

**GET /api/ai** — không body. Trả `{ system, version, status, pipeline: { ragEnabled, ragBackendUrl, ragStatus: 'online'|'offline', fallback }, features[] }` (route.ts:185-202) — dùng để kiểm tra RAG server có sống không.

## 3. Luồng xử lý chính (từng bước)

1. Parse body, kiểm tra `messages` có nội dung và tin nhắn cuối là của user (route.ts:33-42).
2. Nếu `ENABLE_RAG` (biến env, mặc định **BẬT** — route.ts:18): gọi `queryRAGBackend(question, poemId)` (route.ts:49).
3. `queryRAGBackend` POST đến `${RAG_BACKEND_URL}/query` (mặc định `http://localhost:5000`, route.ts:16) với `{ question, topK: 3, poemId? }`, kèm `signal: AbortSignal.timeout(RAG_TIMEOUT_MS)` — mặc định **20 giây** vì khi bật LLM câu trả lời mất ~5-16s (route.ts:111-128). Nếu HTTP status không ok → throw error kèm status + body text (route.ts:122-125).
4. **Điều kiện chấp nhận kết quả RAG:** `metadata.retrieved > 0` **và** `confidence > 0` (route.ts:53-54). Đạt → trả ngay câu trả lời RAG với `ragEnabled: true`.
5. **Fallback trigger 1 (RAG sống nhưng không có passage phù hợp):** `retrieved = 0` hoặc `confidence = 0` → `console.warn` ở route.ts:66 và **rơi xuống khối smartAI bên dưới** thay vì trả "không tìm thấy".
6. **Fallback trigger 2 (RAG chết/timeout):** `fetch` throw (connection refused hoặc `AbortSignal.timeout` fire) → catch tại route.ts:67-70, cũng rơi xuống smartAI.
7. Khối smartAI (route.ts:73-94): nếu có `poemId`, `loadPoemData()` quét tuần tự **16 file JSON** bài thơ qua `http://localhost:3000/data/*.json` cho đến khi `data.document_id === poemId` (route.ts:133-168); sau đó gọi `smartAI.analyzePoem(poem, question)` — bộ rule-based Socratic nhận diện ý định (xin bài mẫu, bức xúc, "không biết", chào hỏi...) từ `src/lib/smartAI.ts:149`. Trả kết quả với `ragEnabled: false`.
8. Mọi lỗi khác (vd. body hỏng) → 500 với `details` (route.ts:96-105).

## 4. Các phần chính & vai trò

| Phần | Dòng | Làm gì |
|---|---|---|
| Config RAG | route.ts:16-21 | `RAG_BACKEND_URL` (mặc định `http://localhost:5000`), `ENABLE_RAG` (mặc định BẬT, tắt bằng `ENABLE_RAG=false`), `RAG_TIMEOUT_MS` (mặc định 20000) |
| Validate đầu vào | route.ts:33-42 | Bắt buộc có `messages`, tin nhắn cuối phải `role: 'user'` |
| Khối RAG | route.ts:47-71 | Gọi backend /query; chỉ nhận khi `retrieved > 0 && confidence > 0`; ngược lại warn + rơi xuống fallback |
| Fallback smartAI | route.ts:73-94 | Load bài thơ JSON + `smartAI.analyzePoem()` → trả lời Socratic offline, gắn cờ `ragEnabled: false` |
| `queryRAGBackend()` | route.ts:111-128 | POST `/query` với `topK: 3`, timeout bằng `AbortSignal.timeout()`, throw nếu HTTP lỗi |
| `loadPoemData()` | route.ts:133-168 | Quét 16 file JSON (`/data/Bai*_lop*_hk*.json`) tìm `document_id` khớp `poemId` |
| GET health | route.ts:173-203 | Ping `${RAG_BACKEND_URL}/health` với timeout 1s (route.ts:178) để báo `ragStatus` online/offline |

## 5. Điểm kỹ thuật đáng chú ý

- **Graceful degradation 2 tầng:** RAG (đúng theo ngữ liệu, LLM local) → smartAI rule-based (không cần Python, không cần mạng). User không bao giờ thấy thông báo lỗi trơ trọi — đúng triết lý "gia sư luôn có câu trả lời".
- **Timeout xử lý bằng `AbortSignal.timeout(RAG_TIMEOUT_MS)`** (route.ts:119): fetch tự hủy sau 20s, exception rơi vào catch → fallback. Comment tại route.ts:19-20 giải thích vì sao phải ≥20s (LLM sinh mất ~5-16s).
- **Chống hallucination bằng điều kiện kép:** không chỉ kiểm tra HTTP 200 mà còn bắt buộc `retrieved > 0 && confidence > 0` (route.ts:53-54) — RAG trả 200 nhưng retrieve rỗng vẫn bị coi là thất bại.
- **GET /api/ai là "bảng hệ thống":** expose `ragEnabled`, `ragBackendUrl`, `ragStatus` (health check 1s) — tiện demo trước giám khảo để chứng minh pipeline đang chạy offline.

## 6. 🎤 Giám khảo hay hỏi gì?

**H: Sao không dùng GPT/Claude API mà phải tự chạy RAG + LLM local?**
Đ: 3 lý do: (1) **zero hallucination** — câu trả lời buộc phải trích từ 456 passages của 16 bài thơ SGK 2018, có `sources` + `confidence`; (2) **chạy 100% offline** trên PC Intel (OpenVINO) — phù hợp trường vùng khó mạng; (3) **chi phí = 0**, không phụ thuộc API key bên thứ ba.

**H: Nếu RAG server tắt giữa chừng thì app có chết không?**
Đ: Không. `fetch` đến `localhost:5000` fail hoặc quá timeout 20s (`AbortSignal.timeout`, route.ts:119) đều rơi vào catch (route.ts:67-70) và trả lời bằng `smartAI` rule-based ngay trong Next.js — user chỉ thấy AI vẫn trả lời bình thường, không hề biết backend đã offline.

**H: Làm sao biết câu trả lời đến từ RAG hay từ fallback?**
Đ: Nhìn trường `ragEnabled` trong JSON response (`true` = RAG, `false` = `local_smartAI`), kèm `metadata.method` và `sources`/`confidence`. Ngoài ra `GET /api/ai` báo `ragStatus` online/offline để debug nhanh.

**H: Vì sao điều kiện "RAG thành công" là retrieved > 0 và confidence > 0?**
Đ: Để tránh trả lời rỗng kiểu "không tìm thấy": nếu vector search không ra passage nào (retrieved=0) hoặc độ tin cậy bằng 0, route chủ động chuyển sang smartAI để **giảng tiếp bằng ngôn ngữ sư phạm** thay vì văng lỗi khô khan cho học sinh (route.ts:51-54, 66).

**H: Timeout 20s có làm app chậm không?**
Đ: Chỉ tồn tại trong kịch bản xấu nhất. RAG khỏe thì trả lời trong ~5-16s (template-only thì ~200ms — timeout không bao giờ chạm); timeout chỉ là **giới hạn trên** để người dùng không phải chờ vô hạn, sau đó fallback smartAI trả lời gần như tức thì.
