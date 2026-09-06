# 📄 HomePage.tsx — Trang chủ tĩnh: hero giới thiệu, 3 card tính năng, khung "Vấn đề & Giải pháp", dải số liệu

**Vị trí:** src/components/pages/HomePage.tsx | **Số dòng:** ~240 | **Được sử dụng bởi:** `src/app/page.tsx` (import line 14, render line 133 khi `activePage === 'home'`)

## 1. File này làm gì? (đọc trong 30 giây)
- Trang đón của ứng dụng, hoàn toàn PRESENTATIONAL (chỉ hiển thị, gần như không có logic): Hero Section với tên trường THPT Dương Văn Thì + tiêu đề "HỌC TẬP NGỮ VĂN BẰNG TRÍ TUỆ NHÂN TẠO" + 2 nút CTA.
- 2 nút CTA là điểm logic duy nhất: dispatch CustomEvent `'navigate-ai'` / `'navigate-practice'` để page.tsx đổi trang (cơ chế sự kiện window, không cần callback props).
- 4 section: Hero (line 16-73) → 3 card Tính năng/Giới thiệu/Sứ mệnh (line 76-125) → Vấn đề (70% học vẹt, AI ảo giác, 40% vùng cao thiếu mạng) vs Giải pháp (RAG + OpenVINO, Socratic, Hybrid Cloud + Edge) (line 128-207) → Stats (line 210-238).

## 2. Đầu vào / Đầu ra
- **Đầu vào:** Props `{ poems: any[], loading: boolean }` (line 7-10). Trong đó chỉ `poems.length` được dùng — hiển thị số "Bài thơ đã phân tích" ở Stats (line 215); `loading` nhận vào nhưng không dùng trong render.
- **Đầu ra:** 2 CustomEvent trên `window`: `new CustomEvent('navigate-ai')` (line 53) và `new CustomEvent('navigate-practice')` (line 60) — page.tsx lắng nghe để chuyển sang trang AI/Exam.

## 3. Luồng xử lý chính (từng bước)
1. App load, `activePage='home'` → page.tsx mount HomePage với `poems` (ban đầu rỗng).
2. Người dùng bấm "🤖 Bắt Đầu Học Cùng VIET-POET AI" → `window.dispatchEvent(new CustomEvent('navigate-ai'))` (line 53) → listener trong page.tsx (page.tsx line 28-39) set `activePage='ai-tutor'` → HomePage unmount, AITutorPage mount.
3. Tương tự nút "📝 Luyện Tập cùng VIET-POET EXAM" dispatch `'navigate-practice'` (line 60) → sang PracticePage.
4. Khi dữ liệu nạp xong, `poems.length` tự cập nhật con số Stats (line 213-217) mà HomePage không cần biết cơ chế nạp.
5. Các section còn lại là markup tĩnh: card có hiệu ứng `hover:scale-105`, stat "10+ đề", "95%+ chính xác", "4x NPU" là số liệu marketing hiển thị cố định trong JSX.

## 4. Các hàm chính & vai trò
| Tên hàm / khối | Dòng | Làm gì |
|---|---|---|
| `HomePage` (default export) | 12 | Component duy nhất của file — trả về toàn bộ JSX 4 section |
| Nút CTA #1 (inline onClick) | 52-58 | Dispatch `'navigate-ai'` → sang trang gia sư AI |
| Nút CTA #2 (inline onClick) | 59-70 | Dispatch `'navigate-practice'` → sang trang luyện thi |
| Khối Stats `{poems.length}+` | 213-217 | Duy nhất nơi dùng dữ liệu thật: đếm số bài thơ đã phân tích |

*File không định nghĩa hàm nội bộ nào — mọi xử lý đều là biểu thức inline trong JSX.*

## 5. Điểm kỹ thuật đáng chú ý
- **Component "nguồi" (dumb component):** không state, không useEffect, không fetch — toàn bộ dữ liệu đến từ props; trách nhiệm duy nhất là trình bày và phát sự kiện điều hướng.
- **Điều hướng qua CustomEvent:** tách HomePage khỏi page.tsx — HomePage không cần import hay biết sự tồn tại của router; thêm/bớt trang đích chỉ sửa phía listener.
- **Storytelling theo khung Problem→Solution** (line 128-207): cột "❌ VẤN ĐỀ" (3 con số: 70% học vẹt, AI ảo giác, 40% vùng cao) đối xứng cột "✅ GIẢI PHÁP" (RAG+OpenVINO Edge, Socratic, Hybrid) — cấu trúc thuyết trình trước giám khảo ngay trong UI.
- Props `loading` được khai báo ở interface (line 9) nhưng không dùng trong JSX — dấu vết của phiên bản trước/có thể bỏ.

## 6. 🎤 Giám khảo hay hỏi gì?
**Q1: Vì sao nút bấm dispatch CustomEvent mà không gọi hàm điều hướng trực tiếp?**
→ Để HomePage độc lập với cơ chế điều hướng: page.tsx giữ state `activePage` và tự đăng ký listener; HomePage chỉ "phát tín hiệu". Lợi: không prop drilling, dễ đổi cơ chế điều hướng mà không sửa HomePage.

**Q2: Dữ liệu nào trên trang này là "thật"?**
→ Chỉ `{poems.length}+` ở Stats (line 215) — đến từ dataLoader. Các con số còn lại (10+ đề, 95%+, 4x) và số liệu vấn đề (70%, 40%) là nội dung tĩnh viết sẵn trong JSX để thuyết minh.

**Q3: Nếu poems chưa nạp xong, trang chủ hiển thị gì?**
→ Vẫn render bình thường vì không phụ thuộc dữ liệu; duy nhất ô Stats tạm hiện "0+" cho tới khi `poems` được fill từ page.tsx (HomePage không có gate loading riêng).

**Q4: Vì sao nhắc "100% offline" ngay trên trang chủ?**
→ Đó là USP chính của dự án: AI chạy local (OpenVINO + Qwen2.5) + RAG ChromaDB cục bộ, phục vụ học sinh vùng cao thiếu mạng (SDG 10) — HomePage là nơi định vị thông điệp này với người xem/jury.

**Q5: Trang này có ảnh hưởng hiệu năng không?**
→ Không đáng kể: render 1 lần, không state/effect/fetch; chỉ có CSS transition hover nhẹ. Vì nằm trong conditional render của page.tsx, khi rời trang chủ component bị unmount, giải phóng DOM.
