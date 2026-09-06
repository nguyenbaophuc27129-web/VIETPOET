# 📄 TabNav.tsx — [LEGACY] Thanh tab điều hướng 2 mục (VIET-POET AI / VIET-POET EXAM) — không còn được import anywhere

**Vị trí:** src/components/TabNav.tsx | **Số dòng:** ~42 | **Được sử dụng bởi:** ❌ **LEGACY — không file nào import** (grep toàn `src/` chỉ thấy chính nó; điều hướng hiện do header trong `src/app/page.tsx` đảm nhiệm)

## 1. File này làm gì? (đọc trong 30 giây)
- Component tab nhỏ nhất của app (~42 dòng): vẽ 2 nút tab — 🤖 "VIET-POET AI" và 📝 "VIET-POET EXAM" — với gạch chân xanh dưới tab đang active.
- Là **controlled component** hoàn toàn: không giữ state nội bộ, nhận `activeTab` (chuỗi đang active) và `onTabChange` (callback báo lên cha) qua props.
- Vai trò lịch sử: từng là thanh chuyển giữa 2 khu AI/EXAM trước khi app chuyển sang mô hình header 3 nút trong page.tsx (home / ai-tutor / practice).

## 2. Đầu vào / Đầu ra
- **Đầu vào:** Props `{ activeTab: string, onTabChange: (tab: string) => void }` (line 9-12). Mảng tabs hard-code nội bộ: `[{id:'ai', label:'VIET-POET AI', icon:'🤖'}, {id:'exam', label:'VIET-POET EXAM', icon:'📝'}]` (line 15-18).
- **Đầu ra:** Sự kiện `onTabChange(tab.id)` khi bấm nút (line 26); DOM: 1 hàng nút có border-bottom chung, tab active có thanh gạch chân absolute `h-0.5 bg-blue-600` (line 35-37).

## 3. Luồng xử lý chính (từng bước)
1. Component cha truyền `activeTab` hiện tại + hàm `onTabChange`.
2. `tabs.map(...)` (line 23) render từng nút với class điều kiện: active → `text-blue-600`, không active → `text-gray-600 hover:text-gray-800` (line 27-31).
3. Người dùng bấm tab → gọi `onTabChange(tab.id)` — KHÔNG tự đổi gì; việc cập nhật state nằm ở cha.
4. Tab đang active tự vẽ thêm div gạch chân absolute ở đáy nút (line 34-37).
5. Trong app hiện tại: không ai mount component này — header của page.tsx (line 95-118) đã thay thế vai trò điều hướng.

## 4. Các hàm chính & vai trò
| Tên hàm / khối | Dòng | Làm gì |
|---|---|---|
| `TabNav` (default export) | 14 | Component duy nhất: render 2 tab từ mảng tabs hard-code |
| Mảng `tabs` | 15-18 | Danh sách tab cứng: id/label/icon của AI và EXAM |
| Nút tab (inline onClick) | 26 | Gọi `onTabChange(tab.id)` — phát sự kiện lên component cha |

*File không định nghĩa hàm xử lý nào khác — thuần UI.*

## 5. Điểm kỹ thuật đáng chú ý
- **Controlled component mẫu:** mọi trạng thái (`activeTab`) thuộc về cha — component này "nguồi" 100%, dễ tái sử dụng nếu ngày nào cần tab ở chỗ khác.
- **Kiểu dáng "mới" của giai đoạn trước:** dùng màu Tailwind mặc định (`text-blue-600`, `bg-blue-600`) chứ chưa theo bảng màu "cung đình" (`var(--primary)`, `bg-royal-red`) mà các component kế nhiệm dùng — dấu vết thời điểm tạo file sớm hơn phần còn lại của UI.
- **Điều hướng app hiện tại KHÔNG qua TabNav:** page.tsx render header 3 nút và quản lý `activePage`; TabNav chỉ có 2 mục và id khác ('ai'/'exam' vs 'home'/'ai-tutor'/'practice') — không tương thích schema, chính là lý do bị bỏ.

## 6. 🎤 Giám khảo hay hỏi gì?
**Q1: Component này còn hoạt động không? Vì sao giữ lại?**
→ Không còn được import — header 3 nút trong page.tsx thay thế. Giữ lại như mã tham khảo cho pattern controlled-component; cũng là bằng chứng tiến hoá UI của dự án (2 tab → 3 trang).

**Q2: Controlled component là gì, ưu điểm ở đây?**
→ Component không giữ state riêng, nhận giá trị hiện tại qua props và báo thay đổi qua callback. Ưu điểm: 1 nguồn sự thật ở cha, dễ đồng bộ (chỉ 1 tab active), dễ test; với TabNav cụ thể là cha quyết định tab nào active.

**Q3: Vì sao nó bị thay bằng header của page.tsx?**
→ Ba lý do: (1) cần thêm mục "TRANG CHỦ" — TabNav chỉ có 2 tab; (2) id không khớp schema điều hướng mới ('ai'/'exam' vs 'home'/'ai-tutor'/'practice'); (3) header còn chứa logo, badge Intel và là identity của app — gom điều hướng vào 1 nơi gọn hơn.

**Q4: Nếu tái sử dụng thì phải sửa gì tối thiểu?**
→ Mảng `tabs` (line 15-18) nên chuyển thành prop để nhận danh sách tab tuỳ ý (kèm màu theo theme cung đình). Logic render không cần đổi vì đã tổng quát qua `.map()`.

**Q5: Gạch chân active làm thế nào?**
→ Một div absolute `bottom-0 left-0 right-0 h-0.5` màu xanh chỉ render khi `activeTab === tab.id` (line 34-37) — nút cần class `relative` để div neo đúng vào nút.
