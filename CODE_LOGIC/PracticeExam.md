# 📄 PracticeExam.tsx — [LEGACY] Component luyện thi kiểu "wizard từng câu": không còn được import anywhere

**Vị trí:** src/components/PracticeExam.tsx | **Số dòng:** ~441 | **Được sử dụng bởi:** ❌ **LEGACY — không file nào import** (grep toàn `src/` chỉ thấy chính nó; đã bị `PracticePage.tsx` thay thế trong trang VIET-POET EXAM)

## 1. File này làm gì? (đọc trong 30 giây)
- Là phiên bản TRƯỚC của trang luyện thi: thi theo kiểu **wizard câu-từng-câu** (1 câu/màn hình, nút "← Câu trước / Câu tiếp →"), hỗ trợ cả **trắc nghiệm** (radio) và **tự luận/phân tích** (textarea).
- Chấm điểm: trắc nghiệm so `correct_answer` trực tiếp; tự luận chấm theo `keywords` (≥50% từ khóa) và hiển thị `rubric_points` + chip từ khóa "[CO]/[THIEU]".
- Vẫn hoạt động độc lập nếu mount, nhưng app hiện dùng `PracticePage.tsx` (chấm cả section một lần, barem_keywords) nên file này chỉ còn giá trị tham khảo/dự phòng.

## 2. Đầu vào / Đầu ra
- **Đầu vào:** KHÔNG có props (line 34) — tự fetch đề từ `/practice_data/de_01..05_{L10|L11}.json` (line 50-56); chọn lớp qua dropdown 10/11 (line 170-177).
- **Đầu ra:** `calculateScore()` trả điểm % (line 102-135); màn kết quả hiển thị % tổng, đếm riêng trắc nghiệm đúng và tự luận đạt (line 298-319), bảng chi tiết từng câu với đáp án đúng (trắc nghiệm sai) hoặc từ khóa + rubric + gợi ý (tự luận).

## 3. Luồng xử lý chính (từng bước)
1. Đổi lớp → useEffect (line 43-45) → `loadTests()` (line 47-76): fetch 5 file đề, push tất cả response ok, chọn đề đầu.
2. Dropdown "Đề thi" (line 182-198): đổi `selectedTest` + `resetExam()` (line 137-141: xoá đáp án, về câu 0, tắt kết quả).
3. Làm bài: câu hiện tại = `selectedTest.questions[currentQuestionIndex]` (line 160).
   - Trắc nghiệm: chọn radio → `handleAnswerSelect` (line 78-100) so với `correct_answer` NGAY LẬP TỨC (đơn: so chuỗi; mảng: so độ dài + mọi phần tử có mặt — line 83-89), lưu `{question_id, answer, isCorrect}`.
   - Tự luận/Phân tích: textarea gõ tự do → `handleAnswerSelect` lưu text, chưa chấm ngay.
4. Thanh tiến độ: `(currentQuestionIndex+1)/total` (line 209-214) + đếm "Đã trả lời".
5. Câu cuối → nút "Xem kết quả" → `setShowResults(true)` (line 286-291).
6. Màn kết quả: `calculateScore()` (line 102-135): mỗi câu 1 điểm; trắc nghiệm đúng = +1; tự luận có ≥50% `keywords` trong text → +1; `round(earned/total×100)`.
7. Chi tiết từng câu (line 323-429): trắc nghiệm sai hiện "Đáp án đúng" (line 375-379); tự luận hiện chips từ khóa xanh "[CO]"/xám "[THIEU]" + đếm (line 382-406), `rubric_points` (line 409-420), `explanation` (line 422-424). KHÔNG hiển thị bài văn mẫu cho tự luận (line 318).

## 4. Các hàm chính & vai trò
| Tên hàm | Dòng | Làm gì |
|---|---|---|
| `loadTests` | 47-76 | Fetch 5 file đề JSON theo lớp (L10/L11), set `tests` + `selectedTest` |
| `handleAnswerSelect` | 78-100 | Lưu/ghi đè đáp án; trắc nghiệm xác định đúng/sai ngay lúc chọn |
| `calculateScore` | 102-135 | Điểm %: mỗi câu 1 điểm; tự luận đạt khi ≥50% keywords |
| `resetExam` | 137-141 | Xoá đáp án, về câu 1, ẩn kết quả (dùng khi đổi đề) |

## 5. Điểm kỹ thuật đáng chú ý
- **Khác biệt cốt lõi với PracticePage (bản kế nhiệm):** wizard 1 câu/lần + hỗ trợ trắc nghiệm có `correct_answer` so sánh tức thì, VS PracticePage trình cả section + chấm bằng `barem_keywords` khi nộp. PracticeExam đánh `isCorrect` cho trắc nghiệm ngay khi chọn (line 82-89) — dữ liệu đáp án nằm sẵn client.
- **Chấm tự luận 2 lớp thông tin:** chỉ một dòng trạng thái `[DAP YEAU CAU]/[CHUA DAP]`, nhưng phần giải thích lộ đủ chips từ khóa (có/thiếu) + `rubric_points` + `explanation` — vẫn không in bài văn mẫu (tuân thủ triết lý chống gian lận của dự án).
- **Không có gate "đề rỗng" khi fetch từng file:** file lỗi bị bỏ qua im lặng (line 61-64 chỉ check `response.ok`), khác PracticePage có try/catch từng file + validate schema.
- Trạng thái `isCorrect` lưu kèm đáp án trong `UserAnswer` (line 28-32) nên màn kết quả không phải chấm lại — chỉ lọc/đếm.

## 6. 🎤 Giám khảo hay hỏi gì?
**Q1: File này còn dùng không? Nếu không sao không xoá?**
→ Không còn — không nơi nào import (đã bị PracticePage thay thế). Giữ lại như bản lưu tham khảo của tính năng trắc nghiệm: nếu sau này muốn thêm chế độ trắc nghiệm từng câu chỉ cần nối lại component này.

**Q2: So sánh cách chấm của PracticeExam và PracticePage?**
→ PracticeExam: chấm NGAY khi chọn (trắc nghiệm) hoặc theo `keywords` ≥50% (tự luận), mỗi câu 1 điểm. PracticePage: chấm KHI NỘP cả section bằng `barem_keywords` ≥50% + `detailed_rubric`. Cùng triết lý từ khóa, khác thời điểm và nguồn dữ liệu đề.

**Q3: Điểm số tính thế nào nếu đề trộn trắc nghiệm và tự luận?**
→ Mỗi câu 1 điểm như nhau (line 111-131): `earned/total × 100`. Không trọng số theo `max_score` — đây là điểm khác (đơn giản hóa) so với barem thật của đề thi.

**Q4: Vì sao đáp án trắc nghiệm nằm trong file JSON tải về client?**
→ Mô hình offline: mọi dữ liệu là file tĩnh; chấm trên client. Hệ quả: học sinh giỏi máy có thể peek đáp án qua DevTools — chấp nhận được vì mục tiêu là TỰ LUYỆN, không phải thi cử hệ trọng.

**Q5: Nếu đổi đề giữa chừng thì bài làm có giữ không?**
→ Không: dropdown đề gọi `resetExam()` (line 184-189) — xoá sạch đáp án, về câu 1. Thiết kế thận trọng để không chấm lệch đề.
