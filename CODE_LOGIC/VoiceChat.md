# 📄 VoiceChat.tsx — Gia sư AI 2 chiều đa phương thức: chat văn bản + giọng nói (STT tiếng Việt) + đọc to trả lời (TTS có hàng đợi)

**Vị trí:** src/components/VoiceChat.tsx | **Số dòng:** ~570 | **Được sử dụng bởi:** `src/components/pages/AITutorPage.tsx` (import line 11, render line 382-385 — tab "🤖 AI Chat")

## 1. File này làm gì? (đọc trong 30 giây)
- Component chat chính của "VIET-POET AI": người học hỏi bằng cách GÕ hoặc NÓI (Web Speech API, `lang='vi-VN'`), AI trả lời qua API RAG `/api/ai`, và có thể ĐỌC TO câu trả lời bằng TTS.
- TTS 2 tầng: ưu tiên `/api/tts` (server, trả audio base64 mp3) → lỗi thì fallback về `speechSynthesis` của trình duyệt, chọn giọng tiếng Việt (ưu tiên Google rồi Microsoft).
- Có nút "🚀 BẮT ĐẦU" phát ngẫu nhiên 1 câu hỏi Socratic gợi mở (chỉ hiện 1 lần) — đúng tinh thần gia sư hỏi ngược, không đưa văn mẫu.
- Props: `poemId` (bài thơ đang học), `sectionIndex` (phân thơ) — gửi kèm cho API để RAG thu hẹp phạm vi tra cứu.

## 2. Đầu vào / Đầu ra
- **Đầu vào:** Props `{ poemId?: string, sectionIndex?: number }` (line 15-18); mic từ người dùng (SpeechRecognition); text từ ô input; giọng hệ thống (speechSynthesis.getVoices()).
- **Đầu ra:** Gọi `POST /api/ai` với `{ messages, poemId, sectionIndex }` (line 351-359) và `POST /api/tts` với `{ text, lang:'vi', service:'google' }` (line 89-93); UI: danh sách bubble chat, nút 🎤/⏹️, nút 🔊 nghe lại, 3 banner trạng thái (đang nghe / đang phát / trình duyệt không hỗ trợ).

## 3. Luồng xử lý chính (từng bước)
**A. Khởi tạo (3 useEffect):**
1. useEffect (line 38-51): nạp danh sách giọng TTS (`getVoices()` + sự kiện `onvoiceschanged`) → set `voicesLoaded`.
2. useEffect (line 210-272): nếu trình duyệt có `SpeechRecognition`/`webkitSpeechRecognition` → tạo instance, cấu hình tiếng Việt: `continuous=false`, `interimResults=true`, `lang='vi-VN'`, `maxAlternatives=3` (line 216-219); gắn `onresult/onend/onerror`.
3. useEffect (line 54-56): tự cuộn xuống cuối khung chat mỗi khi `messages` đổi (`scrollIntoView`).

**B. Nói để hỏi (STT):**
4. Bấm 🎤 → `startListening()` (line 274): set lang vi-VN rồi `recognition.start()`.
5. `onresult` (line 221-249): gom `finalTranscript` + `interimTranscript` → hiện tạm vào ô input; cảnh báo console nếu confidence < 0.7 (line 244-246).
6. `onerror` (line 255-267): thông báo riêng cho từng lỗi — không cho phép mic / không có tiếng / không hỗ trợ tiếng Việt / lỗi mạng.
7. `onend` → tắt cờ `isListening`.

**C. Gửi và nhận:**
8. `sendMessage()` (line 341): push tin nhắn user (kèm cờ `isVoice` nếu nói), gọi `/api/ai` (route này ưu tiên RAG backend localhost:5000, hỏng thì fallback smartAI cục bộ), nhận `data.content` → push tin nhắn assistant.
9. Nếu tin nhắn user đến từ giọng nói → sau 500ms tự `speakResponse()` đọc to câu trả lời (line 371-375).

**D. Đọc to (TTS có hàng đợi):**
10. `speakResponse()` (line 296): đẩy text vào `ttsQueueRef`; nếu chưa có worker đang chạy → gọi `processTTSQueue()`.
11. `processTTSQueue()` (line 59): lấy 1 text khỏi queue → `await speakTextInternal()` → nếu còn thì hẹn 100ms xử lý tiếp (đảm bảo phát TUẦN TỰ, không đè tiếng).
12. `speakTextInternal()` (line 82): POST `/api/tts` → nhận `data.audio` base64 → decode `atob` → `Uint8Array` → Blob mp3 → `new Audio(url).play()`; `onended` mới resolve + `revokeObjectURL`.
13. Nếu `/api/tts` lỗi/không có audio → `fallbackTTSPromise()` (line 140): `speechSynthesis` với lang vi-VN, rate 0.9; text được làm sạch markdown/emoji (line 146-154); giọng được lọc tiếng Việt và ưu tiên Google rồi Microsoft (line 163-180).

**E. Bắt đầu Socratic:**
14. Bấm "🚀 BẮT ĐẦU" → `handleStartButtonClick()` (line 390): nếu `hasStarted` đã true thì bỏ qua; ngược lại chọn ngẫu nhiên 1 trong 4 câu hỏi gợi mở (line 396-401) và thêm vào chat; nút biến mất vĩnh viễn trong phiên.

## 4. Các hàm chính & vai trò
| Tên hàm | Dòng | Làm gì |
|---|---|---|
| `processTTSQueue` | 59-79 | Worker tuần tự: lấy từng item trong queue TTS để phát, cách nhau 100ms |
| `speakTextInternal` | 82-137 | Phát 1 đoạn qua `/api/tts` (base64 → Blob mp3 → Audio); trả Promise hoàn tất khi phát xong |
| `fallbackTTSPromise` | 140-207 | TTS dự phòng bằng speechSynthesis; làm sạch markdown; chọn giọng vi (Google > Microsoft) |
| `startListening` / `stopListening` | 274-287 / 289-294 | Bật/tắt nhận diện giọng nói, đặt lại lang vi-VN trước khi start |
| `speakResponse` | 296-305 | Đẩy text vào hàng đợi TTS và khởi động worker nếu chưa chạy |
| `fallbackTTS` | 307-339 | Bản TTS dự phòng cũ (không Promise) — ĐÃ KHÔNG còn nơi nào gọi (dead code) |
| `sendMessage` | 341-385 | Thêm tin nhắn user → POST `/api/ai` → thêm phản hồi AI; tự đọc to nếu nhập bằng giọng |
| `handleStartButtonClick` | 390-411 | Phát 1 câu hỏi Socratic ngẫu nhiên, chỉ 1 lần/phiên (`hasStarted`) |
| `handleSubmit` | 413-416 | Xử lý submit form: gọi sendMessage với text trong ô input |

## 5. Điểm kỹ thuật đáng chú ý
- **Hàng đợi TTS tự quản (`ttsQueueRef` + `isProcessingQueueRef`):** vì phát bằng phần tử `Audio` (từ API) KHÔNG có hàng đợi sẵn như speechSynthesis → phải xếp tuần tự bằng Promise + setTimeout(100ms), nếu không các câu sẽ đè tiếng/cắt lời nhau.
- **STT cấu hình riêng cho tiếng Việt:** `interimResults=true` để hiện chữ ngay khi đang nói (UX), `maxAlternatives=3` tăng cơ hội nhận đúng từ tiếng Việt nhiều thanh điệu, `continuous=false` — mỗi lần bấm mic là 1 câu hỏi.
- **Chuỗi fallback kép:** AI: RAG (Python server) → smartAI rule-based cục bộ (ở tầng `/api/ai`); TTS: server `/api/tts` → speechSynthesis trình duyệt. Mọi tầng đều còn hoạt động khi mất mạng/ mất Python server.
- **Đa lượt hội thoại:** `sendMessage` gửi cả mảng `messages` hiện có + tin nhắn mới (line 355) nên phía API giữ được ngữ cảnh câu hỏi trước.
- `fallbackTTS` (line 307) là hàm còn sót từ phiên bản cũ, không còn lời gọi nào — có thể dọn dẹp.

## 6. 🎤 Giám khảo hay hỏi gì?
**Q1: Vì sao phải tự viết hàng đợi TTS?**
→ Khi phát qua phần tử `Audio` (audio do server trả về) không có cơ chế xếp hàng như `speechSynthesis`; nếu người dùng bấm 🔊 nhiều lần hoặc AI trả lời khi đang phát thì âm bị cắt/đè. Queue + Promise bảo đảm phát đúng thứ tự, câu sau chờ câu trước phát xong (resolve tại `audio.onended`).

**Q2: Luồng giọng nói hoạt động thế nào khi OFFLINE?**
→ STT: Web Speech API của Chrome/Edge vẫn chạy (engine của trình duyệt). TTS: nếu `/api/tts` không gọi được dịch vụ ngoài, component tự fallback sang `speechSynthesis` — Windows có giọng tiếng Việt cài sẵn. AI: `/api/ai` tự fallback smartAI cục bộ nếu RAG server tắt. Nên 3 tầng đều có phương án offline.

**Q3: Web Speech API có hạn chế gì?**
→ `SpeechRecognition` không phải chuẩn ở mọi trình duyệt (Chrome/Edge mới có, cần cho phép mic); Firefox không hỗ trợ. File đã xử lý: disable nút mic + banner cảnh báo khi `recognitionRef.current` null (line 564-568), và alert riêng lỗi `language-not-supported`.

**Q4: Vì sao gửi cả mảng messages thay vì chỉ câu hỏi mới?**
→ Để API giữ ngữ cảnh hội thoại đa lượt — gia sư Socratic cần biết đã hỏi/gợi ý gì trước đó để hỏi tiếp hợp lý; `poemId` + `sectionIndex` giúp RAG chỉ retrieve đúng passages của bài thơ đang học.

**Q5: Ý nghĩa nút "BẮT ĐẦU" và 4 câu hỏi gợi mở?**
→ Thể hiện phương pháp Socratic: AI chủ động mở màn bằng câu hỏi mở (nghệ thuật/nội dung/cảm xúc...) thay vì chờ bị hỏi — học sinh lúng túng không biết hỏi gì vẫn được dẫn vào bài; `hasStarted` đảm bảo không spam lặp câu mở màn.
