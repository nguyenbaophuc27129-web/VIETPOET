# 📄 AccurateMindmap.tsx — Sơ đồ tư duy "gốc giữa – nhánh trái/phải" nối bằng đường cong bezier SVG, có xuất PDF vừa 1 trang A4 ngang

**Vị trí:** src/components/AccurateMindmap.tsx | **Số dòng:** ~308 | **Được sử dụng bởi:** `src/components/pages/AITutorPage.tsx` (import line 10, render line 366-371 — tab "🗺️ Mindmap"). CSS đi kèm: `src/app/globals.css` (các class `mm-*` từ line 101, chế độ in `printing-mindmap` từ line 126)

## 1. File này làm gì? (đọc trong 30 giây)
- Hiển thị sơ đồ tư duy của một phân thơ: 1 nút gốc ở GIỮA (tên section), 2 nhánh TRÁI (📜 Bài thơ gốc, 🔍 Phân tích X-Ray), 1 nhánh PHẢI (📝 Dàn ý nội dung) — các ô là DOM/HTML thường, còn ĐƯỜNG NỐI là 3 path SVG bezier vẽ bằng JS đo vị trí thật của từng ô.
- Có nút "📄 Tải PDF": nén bố cục → đo kích thước → zoom-to-fit đúng 1 trang A4 NGANG → gọi `window.print()`; in xong tự dọn class/style tạm.
- Đây là phiên bản kế nhiệm `AutoMindmap` (bản SVG thuần cũ, đã LEGACY).

## 2. Đầu vào / Đầu ra
- **Đầu vào:** Props `{ outline: OutlinePoint[], xRayData: XRayData[], title, originalText: string[] }` (line 24-29) — do AITutorPage lấy từ `detailed_analysis[selectedSection]` (`section_outline`, `x_ray_data`, `section_name`, `original_text`).
- **Đầu ra:** DOM: thẻ card (`mindmap-print-root`, line 156-160) chứa header + vùng sơ đồ (`rowRef`, line 181) với 1 lớp SVG nền (`svgRef` + 3 `path` rỗng, line 183-196); tham số `d` của 3 path được GHI TRỰC TIẾP vào DOM; và một hộp thoại in của trình duyệt khi bấm "Tải PDF".

## 3. Luồng xử lý chính (từng bước)
**A. Vẽ đường nối (`measure`, line 51-93):**
1. Thu thập toạ độ: hàm nội bộ `posInRow(el)` (line 59-67) cộng dồn `offsetLeft/offsetTop` dọc chuỗi `offsetParent` cho tới `row` → được toạ độ px BỐ CỤC của mỗi nút trong hệ toạ độ của `row`.
2. Đặt `width/height` của SVG = `row.offsetWidth/offsetHeight` (line 70-72) để lớp path phủ đúng vùng sơ đồ.
3. Tính tâm dọc nút gốc `sy = root.y + rootNode.offsetHeight/2` và 2 điểm xuất phát: mép trái `sxLeft`, mép phải `sxRight` (line 73-76).
4. Với từng nhánh `branchRefs[i]` (line 78-92): xác định nhánh trái hay phải (`pos.x + b.offsetWidth <= root.x`, line 82) → điểm cuối là mép trong của nhánh tại chiều cao tâm `ey`; độ lồi đường cong `dx = max(36, |sx−ex|/2)` (line 86); ghi thuộc tính `d` dạng cubic bezier: `M sx sy C sx±dx sy, ex∓dx ey, ex ey` (line 88-91).

**B. Khi nào vẽ lại (useLayoutEffect, line 96-111):**
5. Ngay sau layout (useLayoutEffect), thêm 1 lần trễ 80ms, thêm lần nữa khi `document.fonts.ready` (font tải xong làm đổi kích thước ô), và mỗi khi `ResizeObserver` thấy `row` đổi cỡ hoặc window resize; deps gồm cả `outline, xRayData, originalText` (đổi dữ liệu → vẽ lại). Cleanup: ngắt observer, gỡ listener, clear timeout.

**C. In PDF (`handleDownloadPdf`, line 129-153):**
6. Thêm class `printing-mindmap` vào `document.body` (line 133) → CSS trong globals.css ép card `position:absolute; overflow:visible`, ẩn header `.no-print`, nén padding/margin/gap.
7. Chờ 2 frame (`requestAnimationFrame` lồng nhau, line 134) cho bố cục nén ổn định → khoá `el.style.width = 1064px` (= `min-w-[1040px]` của sơ đồ + 2×12px padding, line 138-139).
8. Đo `scrollWidth/scrollHeight` thực tế → `zoom = min(1, (1047/w)×0.98, (718/h)×0.98)` với 1047×718px là vùng in A4 ngang (297×210mm trừ lề 10mm, 96dpi) (line 135-143); hệ số 0.98 là biên an toàn.
9. Frame tiếp theo: gọi `measure()` VẼ LẠI ĐƯỜNG theo bố cục in NGAY TRƯỚC khi mở hộp thoại in, rồi `setTimeout(() => window.print(), 250)` (line 147-150).
10. `window` bắn sự kiện `afterprint` → useEffect (line 114-124) gỡ class `printing-mindmap` và xoá `zoom`/`width` tạm khỏi card.

## 4. Các hàm chính & vai trò
| Tên hàm | Dòng | Làm gì |
|---|---|---|
| `measure` (useCallback) | 51-93 | Đo toạ độ px bố cục của gốc + 3 nhánh, ghi `d` bezier trực tiếp vào 3 path SVG |
| `posInRow` (hàm con) | 59-67 | Cộng dồn offsetLeft/offsetTop theo chuỗi offsetParent → toạ độ trong hệ của `row` |
| useLayoutEffect vẽ lại | 96-111 | Gọi measure lúc mount + timer 80ms + fonts.ready + ResizeObserver + resize |
| useEffect dọn sau in | 114-124 | Nghe `afterprint`: gỡ class `printing-mindmap`, xoá zoom/width tạm |
| `handleDownloadPdf` | 129-153 | Quy trình in 5 bước: nén bố cục → khoá width → đo → zoom-to-fit → measure + window.print() |

## 5. Điểm kỹ thuật đáng chú ý
- **Vì sao ghi `d` TRỰC TIẾP vào DOM chứ không qua React state?** Đường nối phụ thuộc KÍCH THƯỚC THẬT sau layout — nếu đưa vào state sẽ thừa 1 vòng render (path bị lệch/mất trong 1 frame), và đặc biệt nguy hiểm ngay trước `window.print()`: ảnh in phải có đường NGAY LẬP TỨC, không thể chờ React render (chính comment code line 44-46 nói rõ điều này).
- **Vì sao đo bằng `offset*` chứ không `getBoundingClientRect()`?** `getBoundingClientRect` trả px VIEWPORT — bị cộng dồn CSS `zoom` (chính kỹ thuật in dùng zoom!) và scroll; còn hệ toạ độ của SVG là px BỐ CỤC. Trộn 2 đơn vị → đường cong lệch đúng lúc zoom-to-fit (comment line 48-50). `offsetLeft/offsetTop` luôn theo px bố cục nên nhất quán.
- **Zoom-to-fit A4:** 1047×718px là A4 ngang (297×210mm) trừ lề 10mm ở 96dpi; khoá bề rộng 1064px trước khi đo để `scrollWidth` phản ánh đúng bố cục min-width; zoom ≤1 (chỉ thu, không phóng) ×0.98 tránh tràn 1-2px; 250ms trước print cho engine render kịp.
- **Resilience bố cục:** đường được vẽ lại sau font load (fonts.ready) và mọi resize — chống lỗi "đường cong đứt/lệch" khi chữ vừa tải xong hoặc cửa sổ đổi cỡ; `useLayoutEffect` (không phải useEffect) để vẽ trước khi browser paint, không nhấp nháy.

## 6. 🎤 Giám khảo hay hỏi gì?
**Q1: Vì sao dùng SVG bezier để nối thay vì border/đường CSS?**
→ Đường cong bezier (`C` cubic) cho dáng mềm mại kiểu XMind; SVG vẽ bất kỳ hình nào giữa 2 điểm tự do (đường CSS chỉ đứng thẳng); 3 path nằm ở lớp absolute dưới các ô (`pointer-events-none`) nên không cản tương tác, và chỉ cần cập nhật thuộc tính `d` khi bố cục đổi.

**Q2: Nếu bỏ đoạn ghi trực tiếp DOM mà đưa `d` vào React state thì lỗi gì?**
→ State phải set trong effect → cần thêm 1 lần render mới hiển thị: đường trễ hơn ô một frame (nhấp nháy/lệch khi resize), và tệ nhất là ngay trước `window.print()` đường có thể chưa kịp vẽ → PDF mất đường nối. Ghi DOM tức thì nên giờ nào measure thì giờ đó đường có.

**Q3: Vì sao dùng offset thay vì getBoundingClientRect khi in PDF?**
→ Khi in, component set `zoom` trên card — `getBoundingClientRect` trả toạ độ ĐÃ NHÂN zoom (px viewport), trong khi SVG tính theo px bố cục chưa zoom. Dùng rect + zoom → tọa độ lệch dần theo mức zoom. `offsetLeft/offsetTop/offsetWidth` là số liệu bố cục thuần, bất biến với zoom/scroll.

**Q4: Quy trình in ra đúng 1 trang A4 gồm những bước, vì sao phức tạp vậy?**
→ 5 bước (line 129-153): (1) class `printing-mindmap` nén bố cục (CSS ghi đè padding/gap, line 126-164 globals.css) để chiều cao nhỏ nhất; (2) khoá width 1064px (bề rộng tự nhiên của sơ đồ min-w 1040px + padding); (3) đo scrollWidth/Height; (4) `zoom = min(1, 1047/w, 718/h) × 0.98`; (5) measure lại đường + print sau 250ms. Phức tạp vì sơ đồ rộng 1040px trong khi vùng in A4 chỉ ~1047×718px — muốn chữ TO NHẤT có thể thì phải nén trước rồi mới tính zoom.

**Q5: Điều gì bảo đảm đường không đứt khi font tải chậm hay resize?**
→ measure được gọi lại ở 5 thời điểm (line 96-111): mount (useLayoutEffect), +80ms, `document.fonts.ready`, ResizeObserver trên `row`, và window resize — bám sát mọi thay đổi kích thước ô; cùng deps đổi dữ liệu.
