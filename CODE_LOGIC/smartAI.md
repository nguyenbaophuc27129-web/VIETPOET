# 📄 smartAI.ts — Trái tim AI dạy học Socratic chạy cục bộ (fallback khi RAG không trả lời)
**Vị trí:** src/lib/smartAI.ts | **Số dòng:** ~402 | **Được sử dụng bởi:**
- `src/app/api/ai/route.ts` (import dòng 13, gọi `smartAI.analyzePoem` dòng 79) — **fallback chính**: khi RAG server (localhost:5000) tắt, quá timeout, hoặc không có passage phù hợp (route.ts:54-70)
- `src/app/api/chat/route.ts` (import dòng 6, gọi dòng 54) — route chat thuần smartAI
- `src/lib/accuracyTesting.ts` (import dòng 6, gọi dòng 120) — đối tượng bị test độ chính xác

## 1. File này làm gì? (đọc trong 30 giây)
Là **Smart AI v6.0 — Socratic Tutor**: chatbot rule-based chạy hoàn toàn trong Node/browser, KHÔNG cần LLM. Đọc dữ liệu phân tích có cấu trúc của bài thơ (`x_ray_data`: từ khóa, biện pháp nghệ thuật, tác dụng) rồi sinh câu trả lời dạy học theo phương pháp Socratic — luôn gợi mở bằng câu hỏi, **tuyệt đối không đưa bài mẫu/đáp án**. Header file (dòng 1-15) ghi rõ 4 lỗi đã sửa từ log thực nghiệm HOI_THOAI.txt (01/09/2026): output cắt cụt, trả lời lặp, khen oan khi học sinh "không biết", và leak bài mẫu.

## 2. Đầu vào / Đầu ra
- **Đầu vào:** `analyzePoem(poem: PoemData | null, question: string, _history?)` (dòng 149)
  - `poem`: object `PoemData` từ dataLoader (chứa `detailed_analysis[].x_ray_data[]` với `target_words`, `art_type`, `effect`, `original_text`, `section_outline`, `general_knowledge.author_and_work`)
  - `question`: câu hỏi tự do của học sinh (teencode, không dấu vẫn OK)
- **Đầu ra:** `AIResponse { content: string; sources: string[]; confidence: number }` (dòng 19-23) — content là chuỗi Markdown hiển thị thẳng trong chat UI.

## 3. Luồng xử lý chính (từng bước)
1. Nếu `poem == null` → nhắc học sinh chọn bài thơ, confidence 0 (dòng 150-156).
2. Tăng `turnCount`, chuẩn hóa câu hỏi bằng `norm()` (bỏ dấu tiếng Việt + lowercase + đ→d) để bắt cả "ko biet", "ai ma biet" (dòng 158-160, 26-32).
3. Phân loại ý định theo **8 nhánh if/else ưu tiên từ trên xuống** (dòng 165-233):
   - **Nhánh 1 — Xin bài mẫu/đáp án** (`ESSAY_SIGNALS`, dòng 48-53) → `socraticEssayRefusal`: từ chối cho bài mẫu + hướng dẫn 3 bước tự viết + câu hỏi gợi mở (dòng 165-167, 240-254).
   - **Nhánh 2 — Bức xúc** (`FRUSTRATION_SIGNALS`: "buc qua", "kho qua"...) → mở đầu đồng cảm + giảng NGAY 1 khái niệm, có chống lặp (dòng 170-179).
   - **Nhánh 3 — "Không biết/không hiểu"** (`UNCERTAINTY_SIGNALS`, dòng 41-46) → chuyển chế độ GIẢNG (`renderConcept`), **không bao giờ khen "Đúng!"** (dòng 182-191).
   - **Nhánh 4 — "Tôi nên làm gì?"** → menu 3 lựa chọn học tập (dòng 194-196, 257-270).
   - **Nhánh 5 — Chào hỏi** → menu gợi ý chủ đề (dòng 199-205).
   - **Nhánh 6 — Hỏi trực tiếp 1 khái niệm** → `findMentionedConcept` so khớp `target_words` trong câu hỏi (dòng 208-214, 273-289).
   - **Nhánh 7 — Hỏi theo chủ đề**: "tac gia" → `analyzeAuthor`; "nghe thuat/tu tu" → `analyzeArt`; "noi dung" → `analyzeContent`; "phan tich/ca bai" → `analyzeFull` (dòng 217-228).
   - **Nhánh 8 — Mặc định** → `analyzeOverview`: tổng quan + 3 điểm nổi bật (dòng 231-233, 377-392).
4. Lưu `lastContent = result.content` để chống lặp ở lượt sau (dòng 235), trả kết quả.

## 4. Các hàm/phần chính & vai trò
| Tên | Dòng | Làm gì |
|---|---|---|
| `norm()` | 26-32 | Chuẩn hóa text: lowercase + strip dấu NFD + đ→d, bắt teencode không dấu |
| `FRUSTRATION/UNCERTAINTY/ESSAY/WHAT_TO_DO/GREETING_SIGNALS` | 35-61 | 5 nhóm từ khóa nhận diện ý định (đã bỏ dấu) |
| `TEACH_OPENERS` / `EMPATHY_OPENERS` | 64-76 | Câu mở đầu đa dạng, luân chuyển theo `turn % length` → chống lặp |
| `getConcepts` / `getConceptsFromSections` | 84-110 | Trích danh sách khái niệm có cấu trúc từ `x_ray_data`; bỏ qua mục thiếu `target_words`/`effect` (dòng 93); tìm câu thơ gốc chứa từ khóa theo từ đầu tiên (dòng 95-99) |
| `ensureNotRepeated` | 113-116 | Nếu nội dung mới trùng câu trước → render lại với offset ngẫu nhiên 1-9000 |
| `buildGuideQuestion` | 119-127 | Sinh câu hỏi Socratic TỪ DỮ LIỆU THẬT: "Bạn thấy hình ảnh X ở câu Y gợi cảm giác gì?" |
| `renderConcept` | 130-146 | Giảng 1 khái niệm: từ khóa + câu thơ + biện pháp + tác dụng + câu hỏi dễ hơn |
| `analyzePoem` | 149-237 | Luồng chính 8 nhánh (mô tả ở mục 3) |
| `socraticEssayRefusal` | 240-254 | Từ chối bài mẫu nhất quán Socratic + 3 bước tự viết (mở/thân/kết) |
| `whatToDoMenu` | 257-270 | Menu: học theo khổ / học theo biện pháp / luyện chấm barem |
| `findMentionedConcept` | 273-289 | Tìm khái niệm học sinh nhắc (target_words ≥ 3 ký tự xuất hiện trong câu hỏi) |
| `renderOneConceptDetailed` | 292-299 | Render chi tiết 1 khái niệm được hỏi trực tiếp + nêu vị trí khổ thơ |
| `analyzeAuthor/Art/Content/Full/Overview` | 302-392 | 5 chế độ phân tích, đều kết thúc bằng câu hỏi mở (dòng 311, 332, 347, 372, 389) |
| `extractAuthor` | 394-397 | Regex tách tên tác giả từ `author_and_work` |
| Export singleton `smartAI` | 401 | 1 instance toàn app → trạng thái `turnCount`/`lastContent` được giữ xuyên suốt |

## 5. Điểm kỹ thuật đáng chú ý
- **Zero hallucination theo thiết kế:** mọi câu trả lời được build từ các trường có cấu trúc (`target_words`, `art_type`, `effect`, `original_text`) và kiểm tra dữ liệu trước khi render (dòng 93, 132) — không bao giờ "sáng tạo" nội dung thơ.
- **Chống lặp 2 lớp:** (1) `turnCount` luân chuyển khái niệm + câu mở đầu theo modulo (dòng 139, 173), (2) `ensureNotRepeated` so với `lastContent` và re-render offset ngẫu nhiên (dòng 113-116).
- **Xử lý tiếng Việt không dấu:** `norm()` dùng Unicode NFD + xóa dấu combining + đ→d, nên "không biết" = "ko biet" = "k bit" đều khớp signal (dòng 26-32).
- **Trạng thái nội bộ singleton:** không cần truyền conversation history qua route — chatbot tự nhớ số lượt và câu trả lời gần nhất (dòng 79-81), nhưng cũng có nghĩa trạng thái reset khi restart server.

## 6. 🎤 Giám khảo hay hỏi gì?
**Hỏi 1: "Tại sao dùng rule-based thay vì LLM toàn bộ?"**
→ Trả lời: (1) Chạy 100% offline, không cần internet/GPU — phù hợp môi trường trường học; (2) phản hồi tức thì, không tốn chi phí API; (3) kiểm soát nội dung tuyệt đối — câu trả lời sinh từ dữ liệu phân tích có cấu trúc nên không bịa. LLM (Qwen2.5-1.5B OpenVINO) vẫn được dùng nhưng ở lớp RAG server ưu tiên cao hơn; smartAI là lưới an toàn khi RAG chết → demo không bao giờ sập.

**Hỏi 2: "AI tránh đưa đáp án (đươi đáp án) bằng cách nào?"**
→ Mọi yêu cầu "cho bài mẫu/viết hộ/đáp án/copy" bị `ESSAY_SIGNALS` bắt và chuyển tới `socraticEssayRefusal` (dòng 240-254): từ chối thẳng + giải thích lý do (thi đo tư duy, tư duy không chép được) + chỉ 3 bước cách tự viết + kết thúc bằng câu hỏi gợi mở dựa trên dữ liệu thật. Cả 5 chế độ phân tích đều kết thúc bằng câu hỏi mở, không kết thúc bằng kết luận mẫu.

**Hỏi 3: "AI phân tích câu hỏi của học sinh thế nào?"**
→ 3 tầng: (1) chuẩn hóa bỏ dấu `norm()`, (2) so khớp 5 nhóm từ khóa ý định theo thứ tự ưu tiên if/else (xin đáp án > bức xúc > không biết > cần hướng dẫn > chào hỏi), (3) fallback: so khớp `target_words` trong câu hỏi (hỏi 1 khái niệm) rồi tới từ khóa chủ đề, cuối cùng là tổng quan.

**Hỏi 4: "Sao tránh được tình trạng trả lời lặp y nguyên làm học sinh khó chịu?"**
→ Ghi nhận câu trả lời gần nhất trong `lastContent`; nếu nội dung mới trùng thì render lại khái niệm khác bằng offset ngẫu nhiên (`ensureNotRepeated`, dòng 113-116), đồng thời luân phiên câu mở đầu theo `turn % 4` — đã được kiểm chứng qua log thực nghiệm HOI_THOAI.txt ghi ngay đầu file.

**Hỏi 5: "Dữ liệu AI dùng để dạy lấy từ đâu, có bịa không?"**
→ Từ 16 file JSON bài thơ SGK 2018 load bởi dataLoader (`x_ray_data` — kết quả "chụp X-quang" từng khổ thơ, `section_outline`, thông tin tác giả). AI không sinh nội dung văn học; nó chỉ tổ chức lại dữ liệu đã được kiểm duyệt thành lời giảng + câu hỏi Socratic.
