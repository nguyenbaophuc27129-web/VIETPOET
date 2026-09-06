# 📄 api/grade/route.ts — Chấm bài thi thực hành bằng barem keyword (LEGACY)

**Vị trí:** `src/app/api/grade/route.ts` | **Số dòng:** ~108 | **Được gọi từ:** LEGACY - không còn dùng (không có component nào `fetch('/api/grade')`; phần thi Luyện tập đã chấm điểm 100% client-side trong `src/components/PracticeExam.tsx` — `calculateScore()` tại PracticeExam.tsx:102 so đáp án `correct_answer` trực tiếp trên máy học sinh)

## 1. Endpoint này làm gì? (30 giây)

Nhận `test_id` + mảng `answers` của học sinh, tự load đề thi JSON tương ứng, rồi **chấm từng câu bằng thuật toán khớp từ khóa (barem_keywords)**: câu trả lời được coi là đúng nếu chứa **≥ 50% từ khóa trong barem** của câu hỏi. Route tính điểm %, liệt kê câu đúng/sai kèm rubric, và sinh nhận xét tổng kết theo 3 mức (≥80 "TUYỆT VỚI", ≥60 "KHÁ TỐT", còn lại "CẦN CỐ GẮNG"). Đây là bản chấm điểm phía server đời đầu; hiện vai trò này đã được `PracticeExam.tsx` đảm nhiệm ngay trên client nên endpoint không còn được gọi.

## 2. Đầu vào (method, body/query) / Đầu ra (JSON shape)

**POST /api/grade**
- Body: `{ test_id: string, answers: Array<{ question_id: string, answer: string|string[] }> }` (grade/route.ts:9).
- Output thành công (grade/route.ts:89-96): `{ score: number (0-100), total_questions, correct_count, keyword_matches: string[], missing_keywords: string[], feedback: string }`.
- Lỗi: 500 kèm `details` (grade/route.ts:98-107).

Không có GET.

## 3. Luồng xử lý chính (từng bước)

1. Parse `{ test_id, answers }` (grade/route.ts:9).
2. Dò khối lớp từ `test_id`: bảng `gradeMap` `{ '10': 'L10', '11': 'L11' }`; nếu `test_id` chứa "L10"/"L11" thì lấy khối tương ứng, mặc định "10" (grade/route.ts:12-24).
3. Load đề từ `/practice_data/de_01_${L10|L11}.json` (grade/route.ts:26-33) — **lưu ý chỉ luôn mở de_01**, và `fetch(testFile)` dùng đường dẫn tương đối nên chỉ hợp lệ trong ngữ cảnh browser, không phải server runtime.
4. Chấm từng answer (vòng lặp grade/route.ts:41-71):
   - Lấy danh sách câu hỏi từ `testData.reading_section?.questions || testData.questions` (grade/route.ts:43), tìm câu khớp `question_id` (grade/route.ts:44); không thấy → bỏ qua.
   - Khớp từ khóa: lowercase câu trả lời, đếm số từ khóa trong `question.barem_keywords` xuất hiện dưới dạng substring (grade/route.ts:49-55).
   - **Ngưỡng đúng: `keywordMatchRate >= 0.5`** (grade/route.ts:58-59).
   - Đúng → tăng `correctCount`, push vào `keyword_matches`, nhận xét kèm `detailed_rubric[0]` (grade/route.ts:61-65); sai → push vào `missing_keywords` kèm rubric (grade/route.ts:66-70).
5. Tính điểm: `score = round(correctCount / questions.length * 100)` (grade/route.ts:74).
6. Ghép `feedback`: header + điểm + từng nhận xét câu + lời khuyên theo 3 mức điểm (grade/route.ts:77-87).
7. Trả JSON kết quả (grade/route.ts:89-96); exception → 500 (grade/route.ts:98-107).

## 4. Các phần chính & vai trò

| Phần | Dòng | Làm gì |
|---|---|---|
| Xác định khối lớp | grade/route.ts:12-24 | Map `test_id` chứa "L10"/"L11" → khối 10/11 (mặc định 10) |
| Load đề thi | grade/route.ts:26-33 | Fetch `/practice_data/de_01_L1x.json` |
| Vòng lặp chấm | grade/route.ts:41-71 | Khớp `barem_keywords`, ngưỡng đúng 50%, gom câu đúng/sai + rubric |
| Tính điểm | grade/route.ts:73-74 | % câu đúng trên tổng số câu của đề |
| Sinh nhận xét | grade/route.ts:77-87 | Feedback văn bản + động viên 3 mức (≥80 / ≥60 / <60) |
| Response | grade/route.ts:89-96 | JSON điểm số + chi tiết câu đúng/sai |

## 5. Điểm kỹ thuật đáng chú ý

- **Chấm tự do (essay) không cần LLM:** so substring từ khóa đã lowercase (grade/route.ts:53-55) — nhanh, offline, nhưng không hiểu từ đồng nghĩa/hoán vị câu.
- **Sai số tiềm ẩn:** luôn load `de_01` bất kể đề nào trong `test_id` (grade/route.ts:26); `fetch` đường dẫn tương đối sẽ ném lỗi khi chạy trong server runtime của route handler — hai lý do khiến endpoint này bị thay thế.
- **Ngưỡng 50% từ khóa** là đánh đổi giữa khoan dung chính tả/cách diễn đạt và nguy cơ chấm hời câu trả lời viết lan man.

## 6. 🎤 Giám khảo hay hỏi gì?

**H: Endpoint này còn chạy trong app không?**
Đ: Không — đây là phiên bản server-side đầu tiên. Bản chấm điểm hiện tại nằm trong `PracticeExam.tsx` (chấm ngay trên client: trắc nghiệm so `correct_answer` chính xác, tự luận vẫn dùng kịch bản barem keyword), giúp giảm một vòng request và chạy được cả khi deploy tĩnh.

**H: Chấm bằng từ khóa thì học sinh "đánh lừa" bằng cách nhồi từ khóa được không?**
Đ: Được — đó là giới hạn đã biết của barem keyword; vì vậy bản client hiện tại chỉ áp kịch bản keyword cho phần tự luận, còn trắc nghiệm chấm chính xác từng đáp án. Hướng phát triển là thay bằng LLM chấm ngữ nghĩa chạy OpenVINO.

**H: Vì sao chọn ngưỡng 50% từ khóa?**
Đ: Cân bằng: câu trả lời học sinh hiếm khi trùng nguyên văn đáp án, nhưng nếu chỉ khớp dưới nửa số ý chính thì chưa đủ hiểu bài. Ngưỡng nằm ngay tại grade/route.ts:58-59, dễ tinh chỉnh.

**H: Nhận xét AI đưa ra có cá nhân hóa không?**
Đ: Mức cơ bản: feedback nhắc đúng `question_id` học sinh sai kèm `detailed_rubric` của câu đó và lời khuyên theo dải điểm (≥80/≥60/<60, grade/route.ts:81-87) — cá nhân theo kết quả từng câu, chưa cá nhân theo thói quen học.
