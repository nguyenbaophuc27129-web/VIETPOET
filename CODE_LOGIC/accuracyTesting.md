# 📄 accuracyTesting.ts — Hệ thống đo độ chính xác AI: test tự động so keyword với ground truth từ dữ liệu thơ
**Vị trí:** src/lib/accuracyTesting.ts | **Số dòng:** ~196 | **Được sử dụng bởi:**
- `src/app/api/test-accuracy/route.ts` (dòng 6 import; gọi `generateTestCases`/`runAllTests`/`getSummary`/`getFailedTests` ở dòng 15-23, 38, 45) — endpoint chạy benchmark on-demand
- `src/app/api/status/route.ts` (dòng 8: có import `accuracyTester` nhưng body của GET hiện không gọi hàm nào của nó — import chưa dùng)

## 1. File này làm gì? (đọc trong 30 giây)
Là **benchmark tự động cho smartAI**: tự sinh bộ test case từ chính dữ liệu bài thơ (mỗi bài → 3 test: tác giả, nghệ thuật, nội dung), bắn từng câu hỏi chuẩn vào `smartAI.analyzePoem()`, rồi chấm điểm bằng **keyword coverage** — đếm xem bao nhiêu % từ khóa "đáp án đúng" (lấy từ JSON dữ liệu thật) xuất hiện trong câu trả lời. Test đạt khi score ≥ 70%. Cung cấp tổng hợp: tổng/đạt/trượt, điểm trung bình, tỷ lệ pass, danh sách test trượt.

## 2. Đầu vào / Đầu ra
- **Đầu vào:** không cần file test ngoài — `generateTestCases()` tự quét `getAllPoems()` (dữ liệu từ dataLoader) để sinh `TestCase` (dòng 8-14): `id`, `poemId`, `question` chuẩn, `expectedKeywords[]`, `category` ('author' | 'art' | 'content').
- **Đầu ra:**
  - `runAllTests(): Promise<TestResult[]>` (dòng 16-22: testCase, response, passed, missingKeywords, score)
  - `getSummary()` (dòng 163-184): `{ total, passed, failed, averageScore, passRate }`
  - `getFailedTests()` (dòng 189-191): danh sách test trượt để debug.

## 3. Luồng xử lý chính (từng bước)
1. **Sinh bộ test** — `generateTestCases()` (dòng 31-63): với MỖI bài thơ tạo 3 test case:
   - Câu hỏi "Tác giả của bài thơ này là ai?" → keyword = tên tác giả tách bằng regex từ `author_and_work` (dòng 37-43, 68-79; regex dòng 73).
   - Câu hỏi "Phân tích nghệ thuật của bài thơ" → keywords = toàn bộ `target_words` + `art_type` trong mọi `x_ray_data` (dòng 46-52, 84-95).
   - Câu hỏi "Phân tích nội dung của bài thơ" → keywords = toàn bộ `outline.point` trong mọi section (dòng 55-61, 100-110).
2. **Chạy test** — `runAllTests()` (dòng 115-127): với từng test case, lấy bài thơ bằng `getPoemById`, gọi thẳng `smartAI.analyzePoem(poem || null, testCase.question)` (dòng 120) — cùng đường đi như chat thật khi RAG fallback.
3. **Chấm điểm** — `evaluateTest()` (dòng 132-158):
   - Đếm số keyword (lowercase) xuất hiện trong `response.content` (dòng 137-143); keyword thiếu lưu vào `missingKeywords`.
   - `score = foundCount / expectedKeywords.length × 100` (dòng 145-147; nếu không có keyword nào thì score = 0).
   - `passed = score >= 70` — ngưỡng 70% (dòng 149).
4. **Tổng hợp** — `getSummary()` (dòng 163-184): tổng số, số đạt, số trượt, `averageScore` (trung bình cộng score, làm tròn), `passRate` (% đạt).
5. Endpoint `/api/test-accuracy` gọi trọn chuỗi trên và trả về JSON gồm cả `failedTestDetails` để người vận hành xem AI trả lời sai chỗ nào (test-accuracy/route.ts dòng 15-23).

## 4. Các hàm/phần chính & vai trò
| Tên | Dòng | Làm gì |
|---|---|---|
| `TestCase` | 8-14 | 1 ca kiểm thử: câu hỏi chuẩn + từ khóa mong đợi + phân loại |
| `TestResult` | 16-22 | Kết quả 1 lần chạy: passed, missingKeywords, score |
| `generateTestCases()` | 31-63 | Sinh 3 test/bài thơ (author, art, content) từ `getAllPoems()` |
| `extractAuthorKeywords()` | 68-79 | Regex `(?:tác giả\|author):?\s*([^,.]+)` tách tên tác giả làm ground truth |
| `extractArtKeywords()` | 84-95 | Gom mọi `target_words` + `art_type` làm từ khóa nghệ thuật |
| `extractContentKeywords()` | 100-110 | Gom mọi `outline.point` làm từ khóa nội dung |
| `runAllTests()` | 115-127 | Bắn câu hỏi vào smartAI và thu kết quả (dòng 120) |
| `evaluateTest()` | 132-158 | Chấm keyword coverage; ngưỡng pass 70% (dòng 149) |
| `getSummary()` | 163-184 | Tổng hợp: total/passed/failed/averageScore/passRate |
| `getFailedTests()` | 189-191 | Lọc test trượt để xem missingKeywords |
| Export singleton `accuracyTester` | 195 | 1 instance, giữ `testCases`/`results` giữa các lần gọi (route cũng đọc `accuracyTester['testCases'].length` ở test-accuracy/route.ts dòng 45) |

## 5. Điểm kỹ thuật đáng chú ý
- **Ground truth tự sinh từ chính dữ liệu (self-consistency):** không cần gán nhãn tay — AI trả lời đúng nghĩa là câu trả lời chứa thông tin trùng khớp với JSON dữ liệu đã kiểm duyệt. Đây là thước đo khả năng "tra đúng dữ liệu", cực khó bịa (hallucination sẽ khiến keywords miss).
- **Thước đo là lexical (so chuỗi), chưa phải ngữ nghĩa:** không dùng embedding/synonym — từ khóa "ẩn dụ" không khớp "so sánh" dù cùng nhóm biện pháp; đây là điểm yếu được chấp nhận để giữ benchmark 100% offline và chạy trong 1 request.
- **Test chính là kịch bản chat thật:** gọi trực tiếp `smartAI.analyzePoem()` với đúng câu hỏi người dùng hay gõ ("Tác giả...?", "Phân tích nghệ thuật..."), đi qua cùng 8 nhánh phân loại ý định trong smartAI.
- **Ngưỡng 70% là hằng số cứng** (dòng 149) — dễ trình bày với giám khảo: "một câu trả lời được coi là đúng khi chứa ít nhất 70% các yếu tố kiến thức bắt buộc của câu hỏi đó".

## 6. 🎤 Giám khảo hay hỏi gì?
**Hỏi 1: "Độ chính xác của AI đo bằng gì?"**
→ Bằng keyword coverage: với mỗi câu hỏi chuẩn, hệ thống biết trước tập từ khóa bắt buộc (tên tác giả, các biện pháp nghệ thuật, các ý nội dung) lấy từ JSON dữ liệu bài thơ; chấm % từ khóa xuất hiện trong câu trả lời của smartAI; pass khi ≥ 70%. Tổng hợp thành averageScore và passRate trên toàn bộ 16 bài × 3 loại = 48 test case.

**Hỏi 2: "Ground truth từ đâu ra, có gán nhãn thủ công không?"**
→ Không. Test case và đáp án đều sinh tự động từ chính dữ liệu phân tích đã kiểm duyệt (`author_and_work`, `x_ray_data`, `section_outline`) bằng 3 hàm extract (dòng 68-110). Thêm bài thơ mới là bộ test tự động nở thêm 3 case — benchmark luôn đồng bộ với dữ liệu.

**Hỏi 3: "Cách này phát hiện AI bịa (hallucination) được không?"**
→ Phát hiện được một phần: nếu AI trả lời không dựa trên dữ liệu thật thì sẽ thiếu các từ khóa bắt buộc → trượt test, và `missingKeywords` chỉ ra đúng cái thiếu. Nhưng không phát hiện được "vừa đúng vừa bịa thêm" — điểm bám tracking đó thuộc RAG (trả lời chỉ ghép passage có thật) và smartAI (chỉ render trường có cấu trúc).

**Hỏi 4: "Hạn chế của đánh giá lexical là gì, khắc phục thế nào?"**
→ Không nhận diện được từ đồng nghĩa/diễn đạt khác (ví dụ AI viết "phép nhân hóa" còn keyword là "nhân hóa" thì vẫn khớp chuỗi con, nhưng "cách nhân hóa" viết khác hoàn toàn sẽ miss). Hướng phát triển: so khớp sau khi bỏ dấu (như `norm()` của smartAI) hoặc so vector ngữ nghĩa bằng embedding của RAG server.

**Hỏi 5: "Chạy benchmark ở đâu, bao nhiêu lâu?"**
→ Gọi `GET /api/test-accuracy`: endpoint gọi `initializeData()` (nạp 16 bài), `generateTestCases()`, `runAllTests()`, `getSummary()` và trả JSON có chi tiết các test trượt. Toàn bộ chạy trong memory, không LLM, nên chỉ mất vài chục ms — có thể demo trực tiếp trước giám khảo.
