# 📄 api/chat/route.ts — Chat AI đời "Smart AI 3.0" thuần smartAI (LEGACY, đã thay bằng /api/ai)

**Vị trí:** `src/app/api/chat/route.ts` | **Số dòng:** ~94 | **Được gọi từ:** LEGACY - không còn dùng (không component nào `fetch('/api/chat')`; chuỗi `'/api/chat - ...'` trong route.ts:89 và status/route.ts:47 chỉ là mô tả liệt kê. Endpoint chat thật của app hiện là **POST /api/ai**, được `VoiceChat.tsx:351` gọi)

## 1. Endpoint này làm gì? (30 giây)

Đây là endpoint chat **thế hệ trước** (version "3.0 (Smart AI)" — chat/route.ts:78): nhận câu hỏi, load dữ liệu bài thơ từ 16 file JSON trong `/data/`, rồi trả lời **hoàn toàn bằng `smartAI.analyzePoem()` rule-based** — không có tầng RAG, không có LLM, không có fallback. Nó chính là **tiền thân trực tiếp của `/api/ai`**: về sau `/api/ai` giữ nguyên ý tưởng (load JSON + smartAI) nhưng **thêm tầng RAG ưu tiên phía trước**, thêm validation đầu vào, và thêm cờ `ragEnabled`/`metadata` trong response để phân biệt nguồn trả lời.

## 2. Đầu vào (method, body/query) / Đầu ra (JSON shape)

**POST /api/chat**
- Body: `{ messages: Array<{role, content}>, poemId?: string, sectionIndex?: number }` (chat/route.ts:10).
- Output (chat/route.ts:56-63): `{ role: 'assistant', content, sources, confidence, poemId, sectionIndex }` — **không có** `ragEnabled` hay `metadata` như `/api/ai`.
- Lỗi: 500 kèm `details` (chat/route.ts:65-71). Lưu ý: route **không validate** `messages` — dòng 12 truy cập `messages[messages.length - 1].content` thẳng, body rỗng sẽ ném exception → rơi vào 500.

**GET /api/chat** — bảng trạng thái: `{ system, version: '3.0 (Smart AI)', status, features[], endpoints[] }` (chat/route.ts:75-94).

## 3. Luồng xử lý chính (từng bước)

1. Parse `{ messages, poemId, sectionIndex }` và lấy `content` của tin nhắn cuối (chat/route.ts:10-12).
2. Nếu có `poemId`: quét tuần tự **16 file JSON** `/data/Bai*_lop*_hk*.json` (chat/route.ts:19-36) qua `http://localhost:3000` (chat/route.ts:39); file nào có `data.document_id === poemId` thì lấy làm `poem` và dừng (chat/route.ts:42-44). Lỗi fetch từng file chỉ warn (chat/route.ts:48-50).
3. Gọi `smartAI.analyzePoem(poem, lastMessage)` — nhận diện ý định (xin bài mẫu → từ chối Socratic; bức xúc → đồng cảm + giảng; "không biết" → giảng 1 khái niệm...) và build câu trả lời từ trường có cấu trúc trong JSON (`target_words`, `art_type`, `effect`, `original_text` — xem `src/lib/smartAI.ts:149`).
4. Trả JSON `{role, content, sources, confidence, poemId, sectionIndex}` (chat/route.ts:56-63).
5. Exception → 500 (chat/route.ts:65-71).

## 4. Các phần chính & vai trò

| Phần | Dòng | Làm gì |
|---|---|---|
| POST handler | chat/route.ts:8-72 | Toàn bộ luồng parse → load thơ → smartAI → response |
| Load poem JSON | chat/route.ts:14-51 | Quét 16 file, khớp `document_id === poemId` |
| Gọi smartAI | chat/route.ts:54 | `smartAI.analyzePoem(poem, lastMessage)` — ruột của câu trả lời |
| GET status | chat/route.ts:75-94 | Thông báo version "3.0 (Smart AI)" + danh sách features |

## 5. Điểm kỹ thuật đáng chú ý

- **Khác biệt cốt lõi so với /api/ai:** không có tầng RAG, không có `ENABLE_RAG`/timeout, không có điều kiện `retrieved > 0 && confidence > 0`, response thiếu cờ `ragEnabled` — tức là phiên bản "chỉ có fallback" của `/api/ai`.
- **Thiếu validation:** `/api/ai` trả 400 khi `messages` rỗng hoặc tin nhắn cuối không phải user (ai/route.ts:35-42); bản chat này để exception nổ về 500 (chat/route.ts:12).
- **Logic load 16 file JSON** (chat/route.ts:19-47) được giữ nguyên trong `loadPoemData()` của `/api/ai` (ai/route.ts:135-152) — cho thấy `/api/ai` được viết bằng cách mở rộng trực tiếp từ route này.

## 6. 🎤 Giám khảo hay hỏi gì?

**H: Sao project còn giữ 2 endpoint chat (/api/chat và /api/ai)?**
Đ: `/api/chat` là bản Tuần 2 ("Smart AI" rule-based thuần), `/api/ai` là bản Tuần 3 thêm pipeline RAG phía trước và fallback thông minh. Route cũ được giữ lại làm **mốc so sánh tiến bộ** (kể lại trong thuyết trình: tuần 2 chỉ rule-based → tuần 3 có RAG zero-hallucination + fallback), còn app thực tế chỉ gọi `/api/ai`.

**H: Nếu chạy /api/chat thì chất lượng trả lời khác gì /api/ai?**
Đ: Y hệt phần fallback smartAI của `/api/ai` (cùng hàm `smartAI.analyzePoem`, cùng cơ chế load 16 file JSON) nhưng **không bao giờ** được nâng cấp lên câu trả lời RAG có trích nguồn từ 456 passages — nên chính xác hơn là luôn "chạy chế độ offline".

**H: Endpoint này có an toàn với input xấu không?**
Đ: Kém — không kiểm tra `messages` trước khi truy cập phần tử cuối (chat/route.ts:12), body rỗng gây 500. `/api/ai` đã sửa điểm này với các check 400 tường minh (ai/route.ts:35-42).

**H: Có thể xóa route này đi không?**
Đ: Về mặt vận hành được, vì không còn ai gọi; nhưng nó vô hại (không được gọi tự động) và có giá trị làm archive lịch sử phát triển + GET status vẫn trả thông tin cho ai truy cập tay.
