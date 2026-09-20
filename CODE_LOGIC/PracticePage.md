# 📄 PracticePage.tsx — Trang "VIET-POET EXAM": chọn đề theo lớp → làm bài Đọc hiểu/Viết văn → chấm điểm client-side theo từ khóa barem

**Vị trí:** src/components/pages/PracticePage.tsx | **Số dòng:** ~447 | **Được sử dụng bởi:** `src/app/page.tsx` (import line 16, render line 135 khi `activePage === 'practice'`)

## 1. File này làm gì? (đọc trong 30 giây)
- Trang luyện thi 2 bước (`step: 'selection' | 'exam'`, line 12):
  - **Bước 1:** chọn Lớp (10/11/12) → Phần thi (📖 Đọc hiểu / ✍️ Viết văn) → Đề (tối đa 5 đề JSON) → "BẮT ĐẦU LÀM BÀI".
  - **Bước 2:** hiện passage/prompt + các câu hỏi dạng textarea; nộp bài → **chấm điểm ngay trong trình duyệt** bằng so khớp `barem_keywords` (đạt khi ≥50% từ khóa xuất hiện trong câu trả lời), xuất điểm % + nhận xét từng câu.
- Đề thi là file JSON tĩnh `/practice_data/de_01..05_{L10|L11}.json` — fetch trực tiếp, không cần backend.

## 2. Đầu vào / Đầu ra
- **Đầu vào:** Props `{ poems, loading }` (line 7-10) — lưu ý `poems` KHÔNG được dùng trong body (chỉ `loading` dùng ở gate line 172). Dữ liệu thật: fetch 5 file `PracticeTest` có cấu trúc `{ test_id, test_title, reading_section: {passage, questions[]}, writing_section: {prompt, questions[]} }` (line 23-34); mỗi câu có `question_id, question_text, max_score, detailed_rubric[], barem_keywords[]` (line 15-21).
- **Đầu ra:** State `gradingResult = { score, total_questions, correct_count, feedback }` (line 153-158) hiển thị điểm %, số câu đúng và feedback text từng câu (✅/❌ + từ khóa thiếu).

## 3. Luồng xử lý chính (từng bước)
1. Đổi `selectedGrade`/`selectedSection` → useEffect (line 47-49) gọi `loadTests()`.
2. `loadTests()` (line 51-87): map lớp `'10'→'L10'`, còn lại `'L11'` (line 54); fetch tuần tự 5 file `de_01..05_{grade}.json`, chỉ nhận file có đủ `reading_section` + `writing_section` (line 69); lưu vào `tests`, chọn đề đầu tiên.
3. Bấm "BẮT ĐẦU LÀM BÀI 🚀" → `handleStartExam()` (line 89-95): vào step exam, xoá `userAnswers` + `gradingResult` cũ.
4. Gõ câu trả lời → `handleAnswerChange(questionId, answer)` (line 97-102): lưu vào `userAnswers` dạng `Record<question_id, string>`; thanh tiến độ tự cập nhật (line 355-369).
5. Nộp bài → `handleSubmitForGrading()` (line 104-170): lấy câu hỏi của section đang thi (line 111-113) → với từng câu: chuyển đáp án về chữ thường, đếm số `barem_keywords` xuất hiện (`includes`) → `keywordMatchRate ≥ 0.5` là ĐÚNG (line 123-128); gom feedback ✅/❌ kèm danh sách từ khóa thiếu (line 134); `score = round(correct/total × 100)` (line 139); thêm nhận xét tổng theo mốc 80/60 (line 145-151).
6. Có `gradingResult` → màn "🎊 KẾT QUẢ CHẤM ĐIỂM" (line 306-351): điểm %, số câu đúng, nhận xét chi tiết, 2 nút "Làm lại" / "Chọn đề khác".

## 4. Các hàm chính & vai trò
| Tên hàm | Dòng | Làm gì |
|---|---|---|
| `loadTests` | 51-87 | Fetch 5 file đề JSON theo lớp, lọc file hợp lệ, set `tests` + chọn đề đầu |
| `handleStartExam` | 89-95 | Vào phòng thi, reset đáp án và kết quả cũ |
| `handleAnswerChange` | 97-102 | Cập nhật `userAnswers[questionId]` mỗi lần gõ |
| `handleSubmitForGrading` | 104-170 | Chấm điểm client-side: so từ khóa barem ≥50% → tính %, dựng feedback |
| Gate `if (loading \|\| isLoadingTests)` | 172-179 | Màn "Đang tải đề thi..." khi đang fetch |

## 5. Điểm kỹ thuật đáng chú ý
- **Chấm thi KHÔNG dùng AI:** so chuỗi con không dấu với danh sách `barem_keywords`, ngưỡng 50% (line 127-128) — chớp mắt ra kết quả, offline tuyệt đối, nhưng chỉ "hiểu" từ khóa, không chấm được ý diễn đạt.
- **Lỗi mapping lớp:** line 54 `selectedGrade === '10' ? 'L10' : 'L11'` — chọn Lớp 12 cũng sẽ nạp đề L11 (vì chỉ có nhánh if/else); UI vẫn hiện "Lớp 12" (line 196-212) nhưng dữ liệu là của lớp 11. Đây là hạn chế dữ liệu, không phải bug render.
- **Đề JSON được "chống hỏng":** chỉ push file có đủ `reading_section` + `writing_section` (line 69-71), file lỗi chỉ `console.warn` rồi bỏ qua (line 73-75) — 1 đề hỏng không làm sập trang.
- **Feedback nhận xét tổng viết không dấu** ("[TUYET VOI]", "[KHA TOT]"...) (line 146-150) — dấu vết trước đây dùng TTS đọc, tránh lỗi phát âm tiếng Việt có dấu.
- Props `poems` unused — giao diện chỉ cần đề thi, không cần kho thơ (chừa lại từ interface chung 3 trang).

## 6. 🎤 Giám khảo hay hỏi gì?
**Q1: Chấm điểm tự động hoạt động thế nào, có chính xác không?**
→ Mỗi câu có sẵn `barem_keywords` (danh sách từ khóa trong barem chấm). Đáp án học sinh được lowercase rồi đếm số từ khóa xuất hiện (`String.includes`); đạt ≥50% từ khóa → câu đó ĐÚNG. Nhanh, offline, công bằng theo barem; điểm yếu: không đánh giá cách diễn đạt, có thể "nhồi" từ khóa.

**Q2: Vì sao chấm ở client thay vì gọi AI/backend?**
→ Mục tiêu 100% offline + phản hồi tức thì: chấm từ khóa là phép so chuỗi thuần, không cần mạng/LLM. Phần chấm "thông minh hơn" (phản hồi Socratic) đã được tách cho AI Chat ở trang VIET-POET AI.

**Q3: Đề thi lưu ở đâu, thêm đề mới thế nào?**
→ Là file JSON tĩnh trong `public/practice_data/` theo mẫu `de_0X_L10.json`. Thêm đề = thả thêm file đúng schema (tối đa 5 đường dẫn đang khai báo ở line 55-61); code lọc file hỏng nên thiếu file không gây lỗi.

**Q4: Chọn Lớp 12 thì đề lấy từ đâu?**
→ Theo code hiện tại (line 54) mọi lớp ≠ 10 đều map sang `L11` → Lớp 12 đang dùng bộ đề của Lớp 11; muốn đúng phải bổ sung nhánh `'12' → 'L12'` và dữ liệu đề L12.

**Q5: Tiến độ làm bài tính thế nào?**
→ `Object.keys(userAnswers).length` chia tổng câu của section đang thi (line 358, 364) — mỗi câu trả lời (kể dở) đều tính; nút nộp chỉ bật khi có ít nhất 1 câu trả lời (line 430).
