# 📄 AITutorPage.tsx — Trang "VIET-POET AI": 2 bước (chọn bài thơ → không gian học 4 tab X-Ray / Mindmap / AI Chat / Bản đồ)

**Vị trí:** src/components/pages/AITutorPage.tsx | **Số dòng:** ~408 | **Được sử dụng bởi:** `src/app/page.tsx` (import line 15, render line 134 khi `activePage === 'ai-tutor'`)

## 1. File này làm gì? (đọc trong 30 giây)
- Trang gia sư AI, gồm 2 bước (`step: 'selection' | 'learning'`, line 19):
  - **Bước 1 (selection):** bộ lọc Lớp (10/11/12) + Học kỳ (hk1/hk2) + danh sách bài thơ tương ứng, kèm khối "HƯỚNG DẪN SỬ DỤNG SẢN PHẨM" 4 ô (line 210-272).
  - **Bước 2 (learning):** "không gian học tập" với 4 tab: 🔍 Poetry X-Ray, 🗺️ Mindmap, 🤖 AI Chat (khung chat cao 65vh), 🌏 Bản Đồ — mỗi tab render 1 component chuyên biệt.
- Tự lọc + khử trùng lặp dữ liệu thơ theo lớp/học kỳ trước khi hiển thị; đổi lớp/học kỳ sẽ reset bài thơ đang chọn.

## 2. Đầu vào / Đầu ra
- **Đầu vào:** Props `{ poems: any[], loading: boolean }` (line 14-17) — mảng toàn bộ thơ do `page.tsx` nạp từ dataLoader.
- **Đầu ra:** Render 4 component con cùng dữ liệu của phân thơ đang chọn: `PoetryXRay` (line 349-352: originalText + x_ray_data), `AccurateMindmap` (line 366-371: + title + section_outline), `VoiceChat` (line 382-385: poemId + sectionIndex), `GeospatialMap` (line 395: không props).

## 3. Luồng xử lý chính (từng bước)
1. Mặc định: `step='selection'`, `activeTab='xray'`, `selectedGrade='10'`, `selectedSemester='hk1'` (line 23-28).
2. useEffect (line 31-34): mỗi khi đổi `selectedGrade`/`selectedSemester` → xoá `selectedPoem` và đưa `selectedSection` về 0 (tránh học lệch dữ liệu cũ).
3. `filteredPoems` (line 37-47): lọc `poems` — ưu tiên metadata `grade_level` + `semester`; nếu thiếu thì fallback soi chuỗi `document_id` có chứa `lop{grade}` và `{semester}` không.
4. `uniquePoems` (line 50-57): khử trùng lặp bằng key `${document_id}-${grade_level}-${semester}` qua Map.
5. Bấm 1 bài thơ → `handleSelectPoem` (line 59-62): lưu bài, reset section về 0.
6. Bấm "VÀO KHÔNG GIAN HỌC TẬP 🚀" → `handleEnterLearningSpace` (line 64-68): chỉ vào bước 2 khi đã chọn bài.
7. Ở bước 2: dải nút "Phân 1, Phân 2..." hiện khi `detailed_analysis.length > 1` (line 291-311) → chọn `selectedSection`.
8. 4 nút tab (line 316-339) đổi `activeTab`; khối "Tab Content" (line 343-403) render đúng 1 tool, dữ liệu lấy từ `selectedPoem.detailed_analysis[selectedSection]`.
9. "← Quay lại chọn bài" → `handleBackToSelection` (line 70-73): về selection và reset tab về 'xray'.

## 4. Các hàm chính & vai trò
| Tên hàm | Dòng | Làm gì |
|---|---|---|
| `AITutorPage` (default export) | 22 | Component chính: state 2 bước + bộ lọc + 4 tab |
| useEffect reset | 31-34 | Đổi lớp/học kỳ → bỏ bài thơ đã chọn, reset section |
| `filteredPoems` (biến tính) | 37-47 | Lọc thơ theo metadata `grade_level`/`semester`, fallback theo `document_id` |
| `uniquePoems` (biến tính) | 50-57 | Khử trùng lặp bằng Map với key tổ hợp 3 trường |
| `handleSelectPoem` | 59-62 | Chọn bài thơ + reset section về 0 |
| `handleEnterLearningSpace` | 64-68 | Chuyển selection → learning nếu đã chọn bài |
| `handleBackToSelection` | 70-73 | Quay về bước 1, reset activeTab về 'xray' |
| Gate `if (loading)` | 75-87 | Màn "Đang tải dữ liệu..." khi poems chưa nạp xong |

## 5. Điểm kỹ thuật đáng chú ý
- **Cấu trúc dữ liệu phân cấp:** 1 bài thơ có `detailed_analysis[]` (nhiều "Phân"); mỗi phân có `section_name`, `original_text[]`, `x_ray_data[]`, `section_outline[]` — 4 tab đều tiêu thụ đúng các trường này của CÙNG một phân, bảo đảm đồng bộ khi đổi "Phân".
- **Lọc 2 tầng có fallback:** metadata chuẩn (`grade_level`/`semester`) nếu có; không có thì heuristics soi `document_id` (`lop10`, `hk1`...) — dữ liệu thô không đồng nhất vẫn lọc được.
- **Khử trùng lặp bằng Map-key tổ hợp** (line 50-57) thay vì Set đơn giản: cùng document_id nhưng khác lớp/học kỳ vẫn giữ bản separate.
- **AI Chat được "phóng to"** trong khung `h-[65vh] min-h-[480px]` (line 381) — chú thích trong code: khung chat toàn màn hình để dễ hỏi & đọc, ưu tiên trải nghiệm tính năng chủ đạo.

## 6. 🎤 Giám khảo hay hỏi gì?
**Q1: Vì sao phải khử trùng lặp poems?**
→ Cùng một bài thơ có thể xuất hiện nhiều lần trong nguồn dữ liệu (nạp nhiều file JSON). Key `${document_id}-${grade_level}-${semester}` bảo đảm danh sách nút chọn không bị nút trùng, mà vẫn phân biệt đúng bài cùng tên nhưng khác lớp/học kỳ.

**Q2: Nếu metadata lớp/học kỳ thiếu trong dữ liệu thì lọc thế nào?**
→ Fallback soi chuỗi `document_id` (line 44-46): tìm `lop{grade}` và mã học kỳ trong tên file. Đây là heuristics chấp nhận được cho dữ liệu thô, nhưng nếu đặt tên file sai thì bài sẽ biến mất khỏi danh sách → hiển thị "ĐANG TIẾP TỤC PHÁT TRIỂN" (line 186-189).

**Q3: Đổi "Phân" (section) thì 4 tab có cùng dữ liệu không?**
→ Có. `selectedSection` là state dùng chung; mọi tab đọc từ `detailed_analysis[selectedSection]` nên X-Ray, Mindmap luôn phản ánh đúng phân thơ đang học; VoiceChat nhận `sectionIndex` để RAG thu hẹp phạm vi.

**Q4: Vì sao tách 2 bước selection/learning thay vì 1 trang dài?**
→ Mô hình lớp học: chọn bài 1 lần rồi mọi công cụ tập trung vào đúng bài đó, tránh phí tài nguyên (không load nhầm dữ liệu bài khác) và UX rõ ràng cho học sinh THPT; bước 1 còn là nơi đặt hướng dẫn sử dụng.

**Q5: Điều gì xảy ra nếu `detailed_analysis[selectedSection]` chưa có khi tab X-Ray render?**
→ Điều kiện render chặn sẵn: `activeTab === 'xray' && selectedPoem && detailed_analysis && detailed_analysis[selectedSection]` (line 344) — thiếu bất kỳ điều nào thì tab chỉ render khung rỗng, không crash do truy cập thuộc tính undefined.
