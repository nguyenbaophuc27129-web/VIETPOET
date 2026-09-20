# 📄 PoetryXRay.tsx — "X-quang" nghệ thuật: highlight từ ngữ đặc sắc trong bài thơ, rê chuột hiện tooltip phân tích biện pháp tu từ

**Vị trí:** src/components/PoetryXRay.tsx | **Số dòng:** ~180 | **Được sử dụng bởi:** `src/components/pages/AITutorPage.tsx` (import line 9, render line 349-352 — tab "🔍 Poetry X-Ray")

## 1. File này làm gì? (đọc trong 30 giây)
- Render bài thơ gốc (`originalText`, từng dòng 1 div) nhưng TÌM và TO MÁU các từ ngữ được phân tích sẵn trong `xRayData` (mỗi mục: `target_words` / `art_type` / `effect`) — từ được highlight có gạch chân vàng rơm nét đứt.
- Rê chuột vào từ được highlight → state `xRayInfo` lưu mục phân tích → tooltip cố định góc dưới-phải hiện "Loại nghệ thuật" + "Hiệu quả"; rê ra hoặc bấm × → ẩn.
- Toàn bộ việc "chèn highlight vào giữa dòng chữ" là xử lý chuỗi thuần: indexOf + cắt substring thành các `<span>` — không dùng thư viện ngoài.

## 2. Đầu vào / Đầu ra
- **Đầu vào:** Props `{ originalText: string[], xRayData: XRayData[] }` (line 15-18) — lấy từ `detailed_analysis[selectedSection]` của bài thơ đang học.
- **Đầu ra:** UI: khung bài thơ với các span `.xray-target` (nền vàng 20%, border-bottom 3px dashed #FFD700, line 73-86) + tooltip `fixed bottom-8 right-8` (line 123-161) + ô hướng dẫn "DI CHUỘT vào từ vàng rơm" (line 163-167). Không gọi API nào.

## 3. Luồng xử lý chính (từng bước)
1. Mỗi lần render, `processedLines` (line 24-106) biến đổi từng dòng thơ:
2. Với từng mục `xray` trong `xRayData`: tìm vị trí xuất hiện bằng `line.toLowerCase().indexOf(targetText.toLowerCase())` — so khớp KHÔNG PHÂN BIỆT hoa/thường (line 29-40); tìm thấy thì ghi nhận `{text: đoạn gốc trong dòng, data: xray, start: index}`.
3. Nếu dòng không có từ nào được đánh dấu → render nguyên dòng (line 43-49).
4. Nếu có: sắp xếp highlights theo `start` (line 52) rồi dựng mảng `parts`: (a) đoạn chữ TRƯỚC highlight (line 60-66); (b) span highlight với handler `onMouseEnter={() => setXRayInfo(highlight.data)}` / `onMouseLeave={() => setXRayInfo(null)}` (line 68-87); (c) đoạn chữ SAU highlight (line 93-99). `lastIndex` lần lượt dịch qua hết dòng (line 89).
5. Người dùng rê chuột vào span → `xRayInfo` đổi → React render tooltip góc màn hình (line 123-161): nút × đóng (line 130-136), tên từ (line 138-141), `art_type` (line 143-150), `effect` (line 152-159).
6. Animation mở tooltip là keyframes `fade-in` viết bằng `<style jsx>` (line 169-177).

## 4. Các hàm chính & vai trò
| Tên hàm / khối | Dòng | Làm gì |
|---|---|---|
| `PoetryXRay` (default export) | 20 | Component duy nhất; giữ state `xRayInfo` (mục X-Ray đang xem) |
| `processedLines` (biến tính) | 24-106 | "Tim mạch" của file: biến mỗi dòng thơ thành mảng span thường + span highlight |
| Sắp xếp highlights | 52 | Đảm bảo các từ được chèn đúng thứ tự vị trí trong dòng |
| Tooltip JSX | 123-161 | Hiện art_type + effect của từ đang hover; nút × để đóng |

*File không định nghĩa hàm độc lập — logic nằm trong biểu thức `.map()` inline.*

## 5. Điểm kỹ thuật đáng chú ý
- **Chỉ bắt occurrence ĐẦU TIÊN:** `indexOf` (line 31) trả vị trí đầu — nếu một từ nghệ thuật xuất hiện 2 lần trong dòng, chỉ lần đầu được highlight. Cách này đơn giản (an toàn) hơn regex-global vì dữ liệu `target_words` là cụm từ tự do, không phải pattern.
- **Giữ nguyên văn bản gốc khi highlight:** khớp lowercase nhưng lấy lại đúng đoạn trong dòng gốc để cắt (`line.substring(index, ...)` — line 35): chữ hoa/thường hiển thị không bị biến dạng.
- **Key của dòng là chính text dòng** (`key={line}` — line 45, 102): nếu bài thơ có 2 dòng giống hệt nhau sẽ dính React duplicate key warning — trade-off được chấp nhận vì thơ ít trùng dòng.
- **Tooltip là 1 khối DUY NHẤT cố định góc màn hình** (`fixed`, không bám theo con trỏ): tránh tooltip giật/che chữ trong poem; chọn `state` đơn thay vì portal vì nội dung ngắn.

## 6. 🎤 Giám khảo hay hỏi gì?
**Q1: Cơ chế "X-Ray" này hoạt động theo nguyên lý nào?**
→ Pre-processing tĩnh: dữ liệu `x_ray_data` (từ khóa + loại biện pháp + hiệu quả) đã được tạo sẵn trong kho dữ liệu JSON của từng phân thơ; component chỉ làm nhiệm vụ so khớp chuỗi và hiển thị. Không gọi AI lúc hover — tức thì, offline 100%.

**Q2: So khớp từ như thế nào, nếu sai chính tả thì sao?**
→ `indexOf` không phân biệt hoa/thường (line 31). Nếu `target_words` trong dữ liệu không xuất hiện Y HỆT (kể cả dấu) trong dòng thì từ không được highlight — an toàn (không tô nhầm) nhưng đòi hỏi dữ liệu chuẩn hoá.

**Q3: Vì sao tự cắt chuỗi thành span mà không dùng dangerouslySetInnerHTML hay thư viện highlight?**
→ Bảo mật (không nhúng HTML thô), kiểm soát từng span với event riêng (mouseenter/leave), không thêm dependency — hợp mục tiêu gọn nhẹ offline. Việc sort theo `start` và dịch `lastIndex` bảo đảm các span không đè nhau.

**Q4: Từ xuất hiện 2 lần trong 1 dòng thì sao?**
→ Chỉ occurrence đầu được highlight (hạn chế của `indexOf`). Muốn đánh dấu hết phải lặp indexOf từ vị trí sau — hiện không cần vì dữ liệu X-Ray trong SGK hầu như nhắm 1 vị trí đặc trưng.

**Q5: Tương tác này giúp học sinh điều gì về mặt sư phạm?**
→ Khám phá chủ động: học sinh "mổ xẻ" bài thơ theo con trỏ của mình — thấy ngay từ đẹp → biện pháp tu từ → hiệu quả diễn đạt, gắn chữ với khái niệm Ngữ văn mà không cần đọc giải thích dài; đúng mô hình học khám phá (inquiry-based) của app.
