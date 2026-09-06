# 📄 AutoMindmap.tsx — [LEGACY] Sơ đồ tư duy SVG thuần (auto-layout ma trận) — phiên bản cũ, đã bị AccurateMindmap thay thế

**Vị trí:** src/components/AutoMindmap.tsx | **Số dòng:** ~341 | **Được sử dụng bởi:** ❌ **LEGACY — không file nào import** (grep toàn `src/` chỉ thấy chính nó; tab Mindmap hiện dùng `AccurateMindmap.tsx`)

## 1. File này làm gì? (đọc trong 30 giây)
- Vẽ toàn bộ sơ đồ tư duy bằng SVG: nút gốc (tên bài), nút điểm chính (`outline[].point`), nút chi tiết (`details[]` xếp xen kẽ trái/phải) và nút kết luận (`conclusion`) — vị trí tính bằng hàm thuần `calculatePositions()`, đường nối là path quadratic (`Q`), có tooltip khi hover các nút điểm chính.
- Comment dòng đầu (line 4-5) tự mô tả: "SVG-based interactive mindmap... More reliable than ReactFlow" — tức là phương án thay ReactFlow từng được cân nhắc. Sau này được nâng cấp thành AccurateMindmap (DOM + đường bezier đo thực tế + in PDF) nên file này ngừng sử dụng.

## 2. Đầu vào / Đầu ra
- **Đầu vào:** Props `{ outline: OutlinePoint[], title }` (line 16-19) — chỉ cần dàn ý; KHÔNG nhận `xRayData`/`originalText` như bản kế nhiệm.
- **Đầu ra:** Một `<svg viewBox="0 0 800 600">` (line 91-96) chứa pattern nền chấm bi, các path nối và các nhóm `<g>` nút; state duy nhất `hoveredNode` (line 27) điều khiển tooltip; ngoài SVG là panel chú thích màu (line 320-339).

## 3. Luồng xử lý chính (từng bước)
1. `calculatePositions()` (line 30-62) tính bảng toạ độ cố định: gốc tại `(400, 40)`; mỗi điểm chính `point-i` tại `(400, 80 + i×120)`; từng chi tiết `detail-i-j` lệch trái/phải `±200px` (chẵn trái, lẻ phải — line 47) và thấp hơn 60px; kết luận `conclusion-i` tại `(400+280, cùng hàng điểm chính)`.
2. `drawConnection(from, to, color)` (line 74-87): sinh path quadratic `M from Q (midX, midY) to`; nét đứt `5,5` cho màu hồng `#f093fb`.
3. Render 3 nhóm đường nối: root→points (line 108-115), point→details (line 118-128), point→conclusions (line 131-142).
4. Render nút: gốc (rect 200×40 gradient tím + title cắt 30 ký tự, line 146-169); điểm chính (rect 180×30, text cắt 25 ký tự, hover → tooltip trắng hiện point + detail đầu 50 ký tự + conclusion 40 ký tự, line 192-246); chi tiết (rect 140×24, cắt 20 ký tự, line 249-280); kết luận (rect 160×24, cắt 25 ký tự, line 283-316).
5. Hover vào nút → `setHoveredNode(id)` → tooltip vẽ thêm nhóm `<g>` bên trong SVG (line 222-243); rời chuột → null.
6. Panel chú thích dưới cùng giải nghĩa 3 màu gradient (line 320-339).

## 4. Các hàm chính & vai trò
| Tên hàm | Dòng | Làm gì |
|---|---|---|
| `calculatePositions` | 30-62 | Tính toạ độ mọi nút theo công thức cố định (layout ma trận dọc, xen kẽ trái/phải) |
| `getNodeColor` | 66-72 | Trả màu theo loại nút (root tím / point hồng / detail xanh / conclusion hồng-đỏ) |
| `drawConnection` | 74-87 | Sinh path quadratic nối 2 toạ độ, hỗ trợ nét đứt |
| `AutoMindmap` (default export) | 26 | Component: giữ state `hoveredNode`, render SVG + legend |

## 5. Điểm kỹ thuật đáng chú ý
- **Layout tĩnh, không đo DOM:** vị trí nút là hằng số toán học — nút chữ dài sẽ tràn ra ngoài rect (text chỉ cắt bớt `substring`), không tự co giãn như bản AccurateMindmap đo bằng offset thực.
- **Giới hạn khung cứng:** `viewBox 800×600` — nhiều điểm chính (>4) sẽ tràn dưới đáy vì `verticalSpacing=120` mà không có scroll/zoom; đây là một lý do bị thay thế.
- **Nút hiện trạng thái đơn giản:** `state` duy nhất `hoveredNode` (dạng string id) — tương tác duy nhất là hover tooltip; không có thao tác kéo/thả/zoom/in PDF.
- **4 gradient định nghĩa trong `<defs>`** (line 172-189) dùng chung cho các rect; pattern chấm bi làm nền (line 98-103).

## 6. 🎤 Giám khảo hay hỏi gì?
**Q1: Vì sao file này không còn được dùng?**
→ Ba hạn chế: layout công thức cứng (chữ dài bị cắt/tràn), khung SVG 800×600 cố định (nhiều ý tràn màn hình), và không in PDF được. AccurateMindmap giải quyết cả 3: ô HTML tự co giãn + đường bezier đo thực tế bằng offset + zoom-to-fit A4 khi in.

**Q2: Layout của nó hoạt động thế nào?**
→ `calculatePositions` là hàm thuần: gốc ở đỉnh giữa (400,40), các điểm chính xếp dọc cách 120px, chi tiết xen kẽ trái/phải ±200px, kết luận lệch phải 280px — render lại tự động khi `outline` đổi vì positions tính mỗi lần render (line 64).

**Q3: Đường nối vẽ thế nào, khác gì bản mới?**
→ Bản này dùng quadratic `Q` (1 điểm điều khiển = trung điểm) nên cong đều đặn; bản mới dùng cubic bezier với điểm điều khiển ngang `dx = max(36, |sx−ex|/2)` tạo hình chữ S ngang chuẩn sơ đồ tư duy.

**Q4: "More reliable than ReactFlow" nghĩa là gì?**
→ Comment line 4-5: dự án từng cân nhắc thư viện ReactFlow nhưng từ bỏ (bundle nặng, phụ thuộc) để tự vẽ SVG thuần — sau đó tiến hoá tiếp sang DOM+SVG lai (AccurateMindmap). Thể hiện xu hướng giảm dependency để chạy offline nhẹ.

**Q5: Nếu phải khôi phục dùng file này thì cần data gì?**
→ Chỉ cần `outline: {point, details[], conclusion}[]` và `title` (line 16-19) — nhẹ hơn bản mới (không cần xRayData/originalText), nhưng đồng nghĩa mất nội dung X-Ray và bài thơ gốc trên sơ đồ.
