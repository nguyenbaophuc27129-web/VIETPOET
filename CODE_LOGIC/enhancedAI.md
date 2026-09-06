# 📄 enhancedAI.ts — AI thế hệ cũ (LEGACY): hiện chỉ còn supplying metrics cho trang Status
**Vị trí:** src/lib/enhancedAI.ts | **Số dòng:** ~406 | **Được sử dụng bởi:**
- `src/app/api/status/route.ts` (import dòng 7; chỉ dùng `aiSystem.getMetrics()` và `aiSystem.calculateAccuracyScore()` ở dòng 13-14)
- **LEGACY một phần:** hàm chat chính `generateResponse()` (dòng 55-91) **không được gọi ở đâu trong luồng chat thật**. Chat thật chạy: `/api/ai` (RAG → fallback `smartAI`) và `/api/chat` (thuần `smartAI`). File này vẫn được giữ vì `/api/status` đọc metrics từ nó để hiển thị dashboard.

## 1. File này làm gì? (đọc trong 30 giây)
Là hệ thống AI "Enhanced" — **thế hệ trước** của bộ Socratic tutor: phân loại câu hỏi bằng regex tiếng Việt thành 5 loại, sinh câu trả lời dạng template có ý tưởng Socratic (từ chối đáp án trực tiếp, luôn hỏi ngược lại), kèm hệ thống **metrics chất lượng AI** (socraticQuality, contextRelevance, studentEngagement) cập nhật bằng trung bình động hàm mũ (EMA). So với smartAI v6, nó KHÔNG đọc sâu dữ liệu thơ (`x_ray_data`) nên câu trả lời chung chung — đây chính là lý do bị smartAI thay thế trong luồng chat.

## 2. Đầu vào / Đầu ra
- **Đầu vào:** `generateResponse(question: string, context?: { poem?: PoemData; section?: SectionData })` (dòng 55-58) — câu hỏi tự do + ngữ cảnh bài thơ/khổ thơ tùy chọn.
- **Đầu ra:** `Promise<AIResponse>` (dòng 18-25) gồm: `content`, `isSocratic` (cờ đánh giá chất lượng), `contextSources`, `confidence`, `followUpQuestions[]`, `thinkingProcess?`.
- **Đầu ra phụ:** `getMetrics(): AIMetrics` và `calculateAccuracyScore(): number` (dòng 370-388) — phần đang được `/api/status` dùng thật.

## 3. Luồng xử lý chính (từng bước)
1. `generateResponse` tăng `totalQueries++`, merge `context` vào `currentContext` (dòng 59-62).
2. `analyzeQuestionType` phân loại bằng regex (dòng 96-120):
   - `direct_answer_request`: "viết hộ|giải đáp|đáp án|kết quả|help me write|give answer|solve" (dòng 100)
   - `analysis_request`: "phân tích|giải thích|ý nghĩa|nghệ thuật|tại sao|..." (dòng 105)
   - `comparison_request`: "so sánh|giống nhau|khác nhau|tương đồng" (dòng 110)
   - `creative_request`: "viết tiếp|sáng tác|tự viết|nghĩ thêm" (dòng 115)
   - Mặc định: `general_inquiry` (dòng 119)
3. Switch qua 5 generator tương ứng (dòng 70-85):
   - `generateSocraticRedirect` (125-139): từ chối cho đáp án, chọn ngẫu nhiên 1 trong 3 template redirect + câu hỏi follow-up.
   - `generateAnalysisResponse` (144-165): đưa 3 góc phân tích (hình ảnh/cảm xúc/thể loại...) + hỏi lại góc nào quan trọng nhất.
   - `generateComparisonResponse` (170-185): giống/khác nhau + hỏi về phong cách tác giả.
   - `generateCreativeResponse` (190-206): 3 câu hỏi hướng sáng tạo, mời học sinh viết thử.
   - `generateGeneralResponse` (211-227): trích 1 insight từ context (X-ray đầu tiên + outline đầu tiên) + câu hỏi mở.
4. `updateMetrics` (354-365): nếu `isSocratic` → tăng `accurateResponses`; cập nhật EMA `socraticQuality` (0.9 cũ + 0.1 mới) và `contextRelevance` (0.95 cũ + 0.05×confidence).
5. Trả response. `/api/status` sau đó đọc `getMetrics()` + `calculateAccuracyScore()` để báo cáo.

## 4. Các hàm/phần chính & vai trò
| Tên | Dòng | Làm gì |
|---|---|---|
| `AIMetrics` / `AIResponse` / `StudentInteraction` | 9-34 | Interface: metrics chất lượng, response có cờ Socratic, bản ghi tương tác học sinh |
| State: `metrics`, `conversationHistory`, `currentContext` | 37-50 | Khởi tạo socraticQuality=0.8, contextRelevance=0.85, engagement=0.75 |
| `generateResponse` | 55-91 | Luồng chính: phân loại → chọn generator → update metrics |
| `analyzeQuestionType` | 96-120 | Regex phân 5 loại câu hỏi (tiếng Việt + tiếng Anh) |
| `generateSocraticRedirect` | 125-139 | Từ chối đáp án trực tiếp — lõi phương pháp Socratic |
| `generateAnalysis/Comparison/Creative/GeneralResponse` | 144-227 | 4 generator template theo loại câu hỏi |
| `extractContextInfo` | 232-252 | Lấy chủ đề chính + document_id từ context.poem |
| `extractThemes` | 257-273 | Dò 5 nhóm chủ đề (thiên nhiên, triết lý, thiền tông, tự do, cô đơn) bằng regex |
| `buildContextResponse` | 278-299 | Ghép 1 insight X-ray + 1 điểm outline của section hiện tại |
| `generateFollowUpQuestion` / `generateInsightPrompt` / `generateAnalysisPoint` | 304-335 | Template câu hỏi gợi mở / prompt tự tìm đáp án / 5 góc phân tích xoay vòng |
| `identifySimilarities` / `identifyDifferences` | 340-349 | Chuỗi cố định (hardcode) — điểm yếu lớn nhất của thế hệ này |
| `updateMetrics` | 354-365 | EMA cập nhật điểm chất lượng sau mỗi response |
| `getMetrics` / `calculateAccuracyScore` | 370-388 | Accuracy = (accurate/total) × (0.4×socratic + 0.3×context + 0.3×engagement) × 100 |
| `setContext` / `clearContext` | 393-402 | Quản lý ngữ cảnh bài thơ hiện tại |
| Export singleton `aiSystem` | 406 | 1 instance toàn app |

## 5. Điểm kỹ thuật đáng chú ý
- **Quan hệ với smartAI (hay bị hỏi):** enhancedAI ra đời TRƯỚC, smartAI v6 ra đời SAU và thay thế hoàn toàn vai trò chat vì đọc được `x_ray_data` thật của từng khổ thơ (smartAI trả lời "Hình ảnh 'vẫn phong thiên' là ẩn dụ..." trong khi enhancedAI chỉ nói chung chung "Hãy phân tích từ góc nhìn này..."). Luồng chat hiện tại: RAG server → smartAI; enhancedAI chỉ còn là nguồn metrics cho `/api/status`.
- **`calculateAccuracyScore` tính từ hoạt động nội bộ,** không phải benchmark: nếu chưa ai gọi `generateResponse` thì `totalQueries = 0` → trả về 0 (dòng 378). Con số này phản ánh phiên chạy hiện tại của process, không phải độ chính xác từng câu.
- **EMA (exponential moving average):** điểm chất lượng là trung bình có trọng số giảm dần (hệ số 0.9 và 0.95) — phản ứng chậm, mượt với thay đổi, tránh nhảy số đột ngột.
- **Vết thời lưu của code thế hệ cũ:** dòng 262 pattern "tự do phóng khoáng" viết dạng chuỗi thay vì regex literal (JS vẫn chạy do tự ép kiểu thành RegExp) và chứa cụm rác "khang suggest"; `identifySimilarities/Differences` (340-349) trả chuỗi hardcode bất kể thơ gì; tham số `context` của `generateAnalysisPoint` (dòng 325) không được dùng — những điểm này minh chứng vì sao cần smartAI v6.

## 6. 🎤 Giám khảo hay hỏi gì?
**Hỏi 1: "enhancedAI và smartAI — cái nào đang chạy thật, quan hệ thế nào?"**
→ smartAI v6 là engine chat thật (fallback của RAG ở `/api/ai` dòng 79 và ở `/api/chat` dòng 54). enhancedAI là thế hệ trước, hàm chat `generateResponse` không còn nằm trong luồng sản phẩm; nó chỉ được `/api/status` dùng để đọc metrics. Giữ lại làm bằng chứng tiến trình lặp sản phẩm (iteration) và dashboard chất lượng.

**Hỏi 2: "Điểm accuracyScore ở /api/status tính bằng công thức gì?"**
→ Dòng 377-388: `accuracy = (accurateResponses / totalQueries) × (0.4×socraticQuality + 0.3×contextRelevance + 0.3×studentEngagement) × 100`. Response được tính là "accurate" khi cờ `isSocratic` bật — tức mọi response đều qua kiểm duyệt Socratic. Nếu chưa có query nào thì trả 0 để tránh chia 0.

**Hỏi 3: "AI này tránh đưa đáp án trực tiếp bằng cơ chế gì?"**
→ `analyzeQuestionType` bắt các mẫu "viết hộ/đáp án/solve" (dòng 100) → `generateSocraticRedirect` chọn ngẫu nhiên 1 trong 3 template từ chối + kèm `followUpQuestions` hỏi ngược lại học sinh (dòng 125-139). Mọi nhánh khác cũng luôn chốt bằng câu hỏi mở ("Theo bạn, điểm nào quan trọng nhất và tại sao?").

**Hỏi 4: "Vì sao cuối cùng các anh chọn rule-based smartAI thay vì phát triển enhancedAI?"**
→ enhancedAI sinh câu trả lời từ template chung, gần như không gắn với nội dung bài thơ cụ thể (similarities/differences hardcode, chỉ lấy 1 X-ray đầu tiên ở dòng 288). smartAI v6 đọc toàn bộ `x_ray_data` từng khổ, sinh câu hỏi từ dữ liệu thật, chống lặp, xử lý teencode tiếng Việt — chất lượng dạy học vượt trội mà vẫn cùng chi phí 0 (offline, no LLM).

**Hỏi 5: "Metrics này có phải là đánh giá khoa học không?"**
→ Không — nó là telemetry vận hành (operational metrics) dạng EMA để hiển thị tình trạng hệ thống. Đánh giá độ chính xác kiến thức thực sự được tách riêng qua `accuracyTesting.ts` (keyword coverage so với ground truth từ dữ liệu thơ) chạy ở `/api/test-accuracy`.
