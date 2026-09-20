# 📄 api/tts/route.ts — Đọc câu trả lời AI thành giọng nói tiếng Việt (chuỗi fallback nhiều nhà cung cấp TTS)

**Vị trí:** `src/app/api/tts/route.ts` | **Số dòng:** ~259 | **Được gọi từ:** `src/components/VoiceChat.tsx:89` (POST `/api/tts` với body `{text, lang: 'vi', service: 'google'}`)

## 1. Endpoint này làm gì? (30 giây)

Biến text trả lời của AI thành audio MP3 để VoiceChat đọc to cho học sinh nghe. Route thử lần lượt **4 dịch vụ TTS theo thứ tự ưu tiên** (`[service người dùng chọn, 'fpt', 'google', 'fallback']` — tts/route.ts:38): vbee và FPT.AI hiện là placeholder (chưa có API key, luôn trả `audio: null`), nên thực tế chạy vào **Google Translate TTS (miễn phí, unofficial)**. Với văn bản dài, Google TTS bị giới hạn độ dài URL, nên route **chia text thành các chunk ~150 ký tự theo ranh giới câu**, gọi TTS **từng chunk** (nghỉ 300ms giữa các request để né rate limit), rồi **ghép các chunk MP3 bằng `Buffer.concat`** và trả về dạng base64. Nếu mọi dịch vụ hỏng, route vẫn trả HTTP 200 kèm thông báo để **client chuyển sang Web Speech API của trình duyệt** (VoiceChat.tsx:122-124).

## 2. Đầu vào (method, body/query) / Đầu ra (JSON shape)

**POST /api/tts**
- Body `TTSRequest` (tts/route.ts:10-17): `{ text: string (bắt buộc), lang?: string (mặc định 'vi'), service?: 'vbee'|'fpt'|'google'|'fallback' (mặc định 'vbee'), voice?, rate?, pitch? }`. VoiceChat thực tế luôn gửi `{text, lang: 'vi', service: 'google'}` (VoiceChat.tsx:92).
- Output thành công: `{ audio: "<base64 MP3>", service: "<tên dịch vụ>", message: "✅ Using ... TTS service" }` (tts/route.ts:44-48).
- Output khi tất cả thất bại: HTTP **200** với `{ error: 'All TTS services unavailable', message: 'ℹ️ Using browser fallback TTS' }` (tts/route.ts:57-60) — không có trường `audio`, client hiểu là phải dùng Web Speech API.
- Lỗi parse/exception: 500 (tts/route.ts:62-68); text rỗng → 400 (tts/route.ts:33-35).

**GET /api/tts** — trả danh sách dịch vụ khả dụng + hướng dẫn cài API key cho từng dịch vụ (tts/route.ts:241-259).

## 3. Luồng xử lý chính (từng bước)

1. Parse body; text rỗng → 400 (tts/route.ts:31-35).
2. Dựng chuỗi dịch vụ: `[service, 'fpt', 'google', 'fallback']` (tts/route.ts:38) — `tryTTSService` dispatch qua switch (tts/route.ts:74-87).
3. `vbeeTTS` (tts/route.ts:93-102) và `fptTTS` (tts/route.ts:108-117): placeholder, luôn trả `{ audio: null }` → vòng lặp `continue` sang dịch vụ kế.
4. **`googleTTS`** (tts/route.ts:123-190):
   - **Làm sạch text:** bỏ `**`, `*`, `---`; `\n\n` → `'. '`, `\n` → `', '` (tts/route.ts:126-132). Text < 10 ký tự → bỏ (tts/route.ts:134-136).
   - **Chia chunk:** `splitTextIntoChunks(cleanText, 150)` (tts/route.ts:139) — tách câu bằng regex `/(?<=[.!?।॥])\s+/` (tts/route.ts:197), gom câu vào chunk cho đến khi vượt 150 ký tự thì cắt (tts/route.ts:201-208); nếu không có dấu câu nào, fallback chia cứng theo 150 ký tự (tts/route.ts:215-219).
   - **Gọi Google từng chunk:** URL `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=vi&q=<encoded>&ttsspeed=1&total=<n>&idx=<i>&rand=<random>` (tts/route.ts:152) — `rand` ngẫu nhiên để né cache, header `User-Agent` Chrome để không bị chặn (tts/route.ts:157). Chunk lỗi chỉ bị `console.warn`, không làm hỏng cả bài (tts/route.ts:169-174).
   - **Tránh rate limit:** nghỉ 300ms giữa các chunk (tts/route.ts:166-168).
   - **Ghép audio:** `Buffer.concat(audioChunks)` → `toString('base64')` (tts/route.ts:178-182). Có ít nhất 1 chunk thành công là đủ.
5. Vòng lặp chính nhận `result.audio` khác null → trả 200 với audio base64 + tên dịch vụ (tts/route.ts:43-49).
6. Hết chuỗi không có dịch vụ nào ra audio → trả 200 `{error, message}` để client fallback trình duyệt (tts/route.ts:57-60).
7. Client (VoiceChat.tsx:96-121): decode base64 → `Blob('audio/mp3')` → `new Audio()` → play; nếu không có `data.audio` hoặc fetch lỗi → `fallbackTTSPromise` (Web Speech API, VoiceChat.tsx:122-129).

## 4. Các phần chính & vai trò

| Phần | Dòng | Làm gì |
|---|---|---|
| POST handler + vòng lặp dịch vụ | tts/route.ts:29-69 | Thử từng dịch vụ theo thứ tự ưu tiên, trả kết quả đầu tiên có audio |
| `tryTTSService()` | tts/route.ts:74-87 | Switch dispatch tới vbee/fpt/google/fallback |
| `vbeeTTS()` / `fptTTS()` | tts/route.ts:93-102, 108-117 | Placeholder — cần API key mới chạy thật; hiện luôn trả `null` để rơi xuống google |
| `googleTTS()` | tts/route.ts:123-190 | Làm sạch text → chia chunk → gọi Google Translate TTS từng chunk → `Buffer.concat` → base64 |
| `splitTextIntoChunks()` | tts/route.ts:195-222 | Chia text theo ranh giới câu, chunk ≤ 150 ký tự; 2 tầng fallback nếu không tách được câu |
| `localVietnameseTTS()` | tts/route.ts:232-236 | Stub đặt trước cho TTS chạy OpenVINO local (VITS/Coqui) trong tương lai |
| GET | tts/route.ts:241-259 | Trạng thái dịch vụ + hướng dẫn bật API key |

## 5. Điểm kỹ thuật đáng chú ý

- **Chuỗi fallback 4 tầng (server) + 1 tầng (client):** vbee → fpt → google → "fallback" (tín hiệu null) → và phía client còn Web Speech API. App gần như không bao giờ câm lặng.
- **Ghép MP3 bằng `Buffer.concat`** (tts/route.ts:179): các chunk do cùng một endpoint Google sinh ra nên cùng codec/bitrate, nối thẳng byte vẫn phát mượt — đơn giản hơn nhiều so với ffmpeg.
- **Chống rate-limit 3 lớp:** chunk ngắn (≤150 ký tự), delay 300ms giữa 2 chunk (tts/route.ts:166-168), tham số `rand` ngẫu nhiên chống cache (tts/route.ts:151).
- **Lỗi từng chunk không hủy cả bài:** chunk fail chỉ bị warn và bị bỏ qua; audio vẫn ghép từ các chunk còn lại (tts/route.ts:169-174).

## 6. 🎤 Giám khảo hay hỏi gì?

**H: Sao phải chia chunk mà không gửi cả bài cho Google?**
Đ: Endpoint `translate_tts` unofficial giới hạn độ dài query (text quá dài sẽ bị từ chối/cắt). Chia theo **ranh giới câu** (~150 ký tự) vừa vượt qua giới hạn vừa giữ ngữ điệu tự nhiên; các chunk được đánh dấu `idx`/`total` trên URL (tts/route.ts:152) rồi nối lại bằng `Buffer.concat`.

**H: Ghép nhiều file MP3 bằng Buffer.concat có lỗi tiếng không?**
Đ: Không đáng kể vì mọi chunk sinh từ cùng engine, cùng sample rate/bitrate — nối byte MP3 frame liên tiếp vẫn phát chuẩn. Đây là trade-off cố tình chọn để khỏi kéo thêm dependency xử lý audio vào bản offline.

**H: Google Translate TTS là dịch vụ chính thức à? Có lo rủi ro không?**
Đ: Không chính thức (`client=tw-ob`), nên mình thiết kế nó chỉ là **1 nấc trong chuỗi fallback**: có API key thì vbee/FPT.AI (chất lượng cao hơn, chính thức) lên đầu; mất mạng thì client tự chuyển Web Speech API của trình duyệt. Route còn chừa sẵn `localVietnameseTTS()` (tts/route.ts:232-236) để chạy TTS local bằng OpenVINO — hướng đi offline hoàn toàn.

**H: Sao tất cả dịch vụ hỏng mà API vẫn trả HTTP 200?**
Đ: Cố ý — "không có audio" không phải lỗi hệ thống mà là tín hiệu giao thức để client kích hoạt fallback trình duyệt (VoiceChat.tsx:122-124). Trả 500 sẽ làm code client nhầm đây là lỗi mạng.

**H: Chất lượng đọc thơ tiếng Việt thế nào?**
Đ: Giọng vi-VN của Google đọc rõ ràng, đủ cho việc nghe giảng; text được làm sạch markdown (`**`, `*`, `---` → bỏ; xuống dòng → dấu câu, tts/route.ts:126-132) để AI không đọc thành "sao sao" hay ngắt nghỉ vô nghĩa.
