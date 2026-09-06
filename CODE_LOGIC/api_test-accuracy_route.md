# 📄 api/test-accuracy/route.ts — Nút chạy bộ test tự động đo độ chính xác của AI

**Vị trí:** `src/app/api/test-accuracy/route.ts` | **Số dòng:** ~53 | **Được gọi từ:** LEGACY - không còn dùng (không component nào `fetch('/api/test-accuracy')`; chuỗi `'/api/test-accuracy - Run accuracy tests'` tại status/route.ts:49 chỉ là dòng liệt kê. Endpoint được gọi thủ công bằng curl/Postman khi cần chạy QA)

## 1. Endpoint này làm gì? (30 giây)

Chạy **bộ test độ chính xác tự động** cho hệ AI: (1) nạp toàn bộ dữ liệu 16 bài thơ + 10 đề luyện tập; (2) **tự sinh test case từ chính dữ liệu ground truth** trong JSON — mỗi bài thơ sinh 3 câu hỏi chuẩn (tác giả / nghệ thuật / nội dung); (3) lần lượt hỏi `smartAI` từng câu và **chấm bằng cách khớp từ khóa mong đợi** trong câu trả lời; câu đạt ≥70% từ khóa tính là PASS; (4) tổng hợp summary (tổng số, pass/fail, điểm trung bình, tỉ lệ pass) kèm **chi tiết các test fail** để sửa. Đây là công cụ QA nội bộ, cung cấp bằng chứng định lượng cho câu "AI trả lời chính xác bao nhiêu %" khi thuyết trình.

## 2. Đầu vào (method, body/query) / Đầu ra (JSON shape)

**POST /api/test-accuracy** — không cần body (route tự sinh test case).
- Output (test-accuracy/route.ts:19-25):
```
{
  status: 'completed',
  summary: { total, passed, failed, averageScore, passRate },
  failedTests: <số test fail>,
  failedTestDetails: [ { testCase: {id, poemId, question, expectedKeywords, category}, response, passed, missingKeywords, score } ],
  timestamp
}
```
- Lỗi: 500 kèm `details` (test-accuracy/route.ts:27-33).

**GET /api/test-accuracy** — trạng thái: `{ system, version: '1.0', status: 'ready', summary, availableTests: <số test case hiện có> }` (test-accuracy/route.ts:36-52). GET chỉ đọc kết quả **lần chạy trước** (summary rỗng nếu chưa POST lần nào).

## 3. Luồng xử lý chính (từng bước)

1. `await initializeData()` — nạp song song 16 file thơ + 10 file đề (`src/lib/dataLoader.ts:219-224`) (test-accuracy/route.ts:12).
2. `accuracyTester.generateTestCases()` — xóa danh sách cũ và sinh **3 test case cho mỗi bài thơ** từ ground truth JSON (test-accuracy/route.ts:15; `accuracyTesting.ts:31-63`):
   - `author`: "Tác giả của bài thơ này là ai?" — từ khóa trích từ `general_knowledge.author_and_work` (`accuracyTesting.ts:68-79`);
   - `art`: "Phân tích nghệ thuật..." — từ khóa là mọi `target_words` + `art_type` trong `detailed_analysis` (`accuracyTesting.ts:84-95`);
   - `content`: "Phân tích nội dung..." — từ khóa trích nội dung (`accuracyTesting.ts:100+`).
   → 16 bài × 3 = **48 test case**.
3. `accuracyTester.runAllTests()` — với từng test case: lấy bài thơ theo id, gọi `smartAI.analyzePoem(poem, question)`, rồi `evaluateTest` đếm số từ khóa mong đợi xuất hiện trong `response.content` (lowercase); **score = found/expected × 100; PASS khi score ≥ 70** (`accuracyTesting.ts:115-158`) (test-accuracy/route.ts:16).
4. `accuracyTester.getSummary()` — tính `total, passed, failed, averageScore, passRate` (`accuracyTesting.ts:163-184`) (test-accuracy/route.ts:17).
5. Trả JSON gồm summary + `getFailedTests()` (danh sách test có score < 70, kèm `missingKeywords` — test-accuracy/route.ts:22-23; `accuracyTesting.ts:189-191`).
6. Exception (thường do load dữ liệu thất bại) → 500 (test-accuracy/route.ts:27-33).

## 4. Các phần chính & vai trò

| Phần | Dòng | Làm gì |
|---|---|---|
| `initializeData()` | test-accuracy/route.ts:12 | Đảm bảo 16 thơ + 10 đề đã vào bộ nhớ trước khi test |
| `generateTestCases()` | test-accuracy/route.ts:15 | Sinh 48 test (3 loại × 16 bài) từ ground truth JSON |
| `runAllTests()` | test-accuracy/route.ts:16 | Hỏi smartAI từng câu + chấm khớp từ khóa, ngưỡng pass 70% |
| `getSummary()` | test-accuracy/route.ts:17 | Tổng hợp total/passed/failed/averageScore/passRate |
| `failedTestDetails` | test-accuracy/route.ts:23 | Trả nguyên danh sách test fail + từ khóa bị thiếu để debug |
| GET | test-accuracy/route.ts:36-52 | Xem summary lần chạy trước + số test khả dụng (đọc private `testCases` qua `accuracyTester['testCases'].length`, dòng 45) |

## 5. Điểm kỹ thuật đáng chú ý

- **Ground truth tự sinh từ dữ liệu:** không phải viết 48 test thủ công — từ khóa mong đợi được rút trực tiếp từ các trường JSON (`author_and_work`, `target_words`, `art_type`), nên test luôn khớp với dữ liệu đang chạy.
- **Đo đúng tầng "tri thức" của AI:** test gọi thẳng `smartAI.analyzePoem` (bypass RAG) — đo độ chính xác của lớp rule-based/kho dữ liệu nội bộ, tách bạch với việc đo pipeline RAG.
- **Kết quả là biến bộ nhớ của singleton:** `accuracyTester` (`accuracyTesting.ts:195`) giữ `results` trong process; GET sau khi restart sẽ thấy `total: 0`. Muốn lưu vết dài hạn phải tự ghi kết quả POST ra file/log.
- **Chi tiết fail có hành động:** mỗi test fail trả kèm `missingKeywords` — nhìn phát biết AI thiếu ý gì, không phải đoán.

## 6. 🎤 Giám khảo hay hỏi gì?

**H: Làm sao các em chứng minh AI trả lời chính xác?**
Đ: Bằng endpoint này: 48 test case sinh tự động từ ground truth của 16 bài thơ, hỏi lại AI và chấm khớp từ khóa với ngưỡng PASS 70% (`accuracyTesting.ts:149`). Kết quả cho ra số định lượng (passRate, averageScore) + danh sách test fail kèm từ khóa thiếu — đây là bằng chứng đưa vào slide và làm baseline so sánh trước/sau khi cải thiện.

**H: Ngưỡng 70% và cách chấm từ khóa có hạn chế gì?**
Đ: Có — chấm substring không hiểu từ đồng nghĩa, nên một câu trả lời đúng mà dùng từ khác khái niệm vẫn bị trừ điểm (đo thẳng đứng, thiên "thiếu ý" hơn "sai ý"). Đó là lựa chọn công bằng: test đo mức độ **đủ ý** theo dữ liệu chuẩn.

**H: Vì sao test gọi smartAI trực tiếp mà không đi qua /api/ai (RAG)?**
Đ: Để **tách biến**: bộ test này đo chất lượng lớp tri thức rule-based + JSON; chất lượng RAG đo riêng bằng độ phủ retrieval và confidence của backend Python. Đo chung một luồng sẽ không biết lỗi nằm ở tầng nào.

**H: Sao endpoint này không có nút bấm trong UI?**
Đ: Đây là công cụ QA cho nhóm phát triển, chạy định kỳ bằng curl (`POST /api/test-accuracy`) trước mỗi bản demo; GET dùng để soát lại kết quả lần chạy trước. Không đưa vào UI để học sinh không kích hoạt nhầm bộ test nặng (48 lần gọi AI).

**H: Chạy bộ test tốn bao lâu / có tốn API nào không?**
Đ: Không tốn gì — 48 câu đều do `smartAI` rule-based trả lời tức thì trong process (không gọi LLM, không gọi mạng). Toàn bộ chạy trong vài giây, đúng tinh thần offline của dự án.
