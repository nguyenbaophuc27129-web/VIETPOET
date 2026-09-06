# 📄 globals.css — Hồ sơ design "Cổ phong Việt Nam": biến màu cung đình, sơ đồ tư duy, chế độ in PDF
**Vị trí:** src/app/globals.css | **Số dòng:** 193 | **Được sử dụng bởi:**
- `src/app/layout.tsx` (dòng 3: `import "./globals.css"`) — nạp toàn cục cho toàn app. Biến font `--font-be-vietnam-pro` / `--font-playfair-display` được cấp bởi `next/font/google` trong chính layout.tsx (dòng 5-18) và gắn vào `<html>` (dòng 29), rồi CSS này tiêu thụ.

## 1. File này làm gì? (đọc trong 30 giây)
Định hình toàn bộ diện mạo VIET-POET-ALYZER theo phong cách **"Cổ phong Việt Nam & Digital Heritage"**: giấy dó (#FAF6F0), mực tàu (#1C1C1C), đỏ son cung đình (#9E2A2B), vàng hoàng thổ (#C5A059). Gồm 4 khối lớn: (1) biến màu + map vào token Tailwind 4 qua `@theme inline`, (2) typography + utility "royal", (3) hệ class bố cục sơ đồ tư duy `.mm-*`, (4) chế độ "chuẩn bị in" xuất sơ đồ tư duy ra PDF vừa 1 trang A4 ngang (`body.printing-mindmap`).

## 2. Đầu vào / Đầu ra
- **Đầu vào:** `@import "tailwindcss"` (dòng 1 — Tailwind 4); biến font từ layout.tsx; các class do component gắn trong JSX (`royal-border`, `mm-branch`, `mindmap-print-root`, `printing-mindmap`...).
- **Đầu ra:** theme màu/font toàn app + các utility class + hành vi in đặc biệt. Không có đầu ra JS — file thuần CSS.

## 3. Các nhóm style chính & nơi sử dụng (từng nhóm)
1. **Biến màu cổ phong `:root`** (dòng 3-12): `--background` #FAF6F0 giấy dó, `--foreground` #1C1C1C mực tàu, `--primary` #9E2A2B đỏ son, `--accent`/`--border` #C5A059 vàng hoàng thổ, `--paper-light` #F1EBE4, `--ink-dark` #0D0D0D.
   - Dùng trực tiếp qua `style={{ color: 'var(--primary)' }}` / `var(--ink-dark)` / `var(--paper-light)` ở: `AITutorPage.tsx` (dòng 103, 129, 156, 212, 222, 285...), `PracticePage.tsx` (192, 310...), `HomePage.tsx`, `VoiceChat.tsx` (419), `PoetryXRay.tsx`.
2. **`@theme inline` map token Tailwind 4** (dòng 14-22): biến CSS → token `--color-background/foreground/primary/accent/paper-light` + `--font-sans` (Be Vietnam Pro) / `--font-serif` (Playfair Display) → mọi component dùng class Tailwind như `bg-background`, `text-foreground` đều ăn theo theme.
3. **Body base + typography thơ ca** (dòng 24-38): nền giấy, chữ mực, font sans; `h1-h6`, `.poetry-text`, `.royal-title` dùng Playfair Display đậm.
   - `.royal-title`: `page.tsx` (83, 147, 155, 166, 180), `AITutorPage.tsx` (94, 103, 212, 222...), `PracticePage.tsx` (176, 185, 192...), `HomePage.tsx` (32, 77, 86...).
   - `.poetry-text`: `HomePage.tsx` (44 — đoạn giới thiệu mang hơi thơ).
4. **Utility màu "royal"** (dòng 41-59): `.text-royal-red/.text-royal-gold/.bg-royal-red/.bg-royal-gold/.border-royal-gold`.
   - Dùng ở: `page.tsx` (106-107 — tab active), `AITutorPage.tsx` (113-114, 167-168, 299-300, 327-328, 335), `PracticePage.tsx` (202-203, 231-232, 258-259).
5. **Custom scrollbar** (dòng 62-77): toàn cục — track giấy bản, thumb vàng hoàng thổ, hover đỏ son.
6. **Khung hoàng gia** (dòng 80-92): `.royal-border` (viền vàng 2px bo góc), `.royal-shadow` (bóng vàng 0 4px 20px rgba(197,160,89,.3)), `.paper-texture` (nhiễu giấy SVG fractalNoise data-URI, opacity 0.08).
   - `.royal-border`/`.royal-shadow`: `page.tsx` (58, 70, 78, 106), `AITutorPage.tsx`, `PracticePage.tsx`, `HomePage.tsx`, `PoetryXRay.tsx` (109), `VoiceChat.tsx` (419).
   - `.paper-texture`: `page.tsx` (132 — thẻ main), `PoetryXRay.tsx` (109), `VoiceChat.tsx` (419), `AITutorPage.tsx` (102, 128, 155...), `PracticePage.tsx` (191, 217, 247...), `HomePage.tsx` (16, 84, 98, 112).
7. **Sơ đồ tư duy `.mm-*`** (dòng 94-124): `.mm-side` (tạo stacking context), `.mm-branch` (flex căn giữa), `.mm-left .mm-branch` (row) / `.mm-right .mm-branch` (row-reverse), `.mm-stub` & `.mm-root-line` (đoạn line 26×2px làm "đầu nối" tạo khoảng trống).
   - Dùng duy nhất ở `AccurateMindmap.tsx`: `.mm-side.mm-left` (201), `.mm-branch` (203, 222, 266), `.mm-stub` (218, 243, 267), `.mm-root-line` (249, 260), `.mm-side.mm-right` (264).
   - Chú ý comment dòng 95-96: đường nối nhánh cong được VẼ BẰNG SVG bezier bên trong AccurateMindmap — CSS chỉ lo bố cục và chừa khoảng trống cho đường cong.
8. **Chế độ in PDF sơ đồ tư duy** (dòng 126-192): kích hoạt khi `body.printing-mindmap` (JS của AccurateMindmap add class dòng 133, remove dòng 116):
   - **Ngoài @media print** (129-166): `.mindmap-print-root` lên `position:absolute; top/left:0`, bỏ overflow/bo góc (129-139), `.overflow-x-auto` xổ hết (141-143), ẩn `.no-print` (146-148 — header chứa nút tải PDF), **nén mạnh spacing** (line-height 1.35, các `p-*` về 4-8px, `gap-10` về 8px, các `space-y-*`/`mb-*`/`mt-*` thu nhỏ — dòng 150-166) để chiều cao tối thiểu → zoom-to-fit lớn nhất → chữ in to rõ. Đặt NGOÀI @media print để component ĐO được kích thước bố cục in trước khi tính zoom (comment 127-128).
   - **`@media print`** (168-192): `@page A4 landscape, margin 10mm` (169-172); nền trắng (174-176); trick `visibility:hidden` toàn trang rồi `visible` lại đúng `.mindmap-print-root` và con cháu (179-186) — giữ nguyên layout thay vì `display:none`; `print-color-adjust: exact` giữ màu in (188-191).
   - Dùng ở: `AccurateMindmap.tsx` (class `mindmap-print-root` dòng 158; `no-print` dòng 163, 171).

## 4. Các hàm/phần chính & vai trò
| Tên | Dòng | Làm gì |
|---|---|---|
| `@import "tailwindcss"` | 1 | Nạp Tailwind 4 |
| `:root` biến màu | 3-12 | Bảng màu cổ phong: giấy dó, mực tàu, đỏ son, vàng hoàng thổ |
| `@theme inline` | 14-22 | Map biến CSS → token Tailwind (--color-*) + định nghĩa font sans/serif |
| `body` | 24-31 | Nền/chữ/font toàn cục + antialiased |
| `h1-h6, .poetry-text, .royal-title` | 34-38 | Typography tiêu đề & thơ: Playfair Display đậm |
| `.text-royal-red` … `.border-royal-gold` | 41-59 | 5 utility màu đỏ son / vàng hoàng thổ |
| `::-webkit-scrollbar*` | 62-77 | Scrollbar theo theme giấy-vàng-đỏ |
| `.royal-border`, `.royal-shadow` | 80-87 | Khung viền vàng + bóng vàng đặc trưng |
| `.paper-texture` | 90-92 | Họa tiết giấy SVG fractalNoise inline (không tải file ngoài) |
| `.mm-side/.mm-branch/.mm-left/.mm-right/.mm-stub/.mm-root-line` | 97-124 | Bố cục sơ đồ tư duy 2 bên gốc, đầu nối 26×2px |
| `body.printing-mindmap .mindmap-print-root …` | 129-166 | Chế độ "chuẩn bị in": tràn viền, ẩn nút, nén spacing tối đa |
| `@media print` + `@page` | 168-192 | A4 ngang margin 10mm; chỉ hiện card sơ đồ; giữ màu in |

## 5. Điểm kỹ thuật đáng chú ý
- **Tailwind 4 không có tailwind.config:** theme được khai báo ngay trong CSS bằng `@theme inline` (dòng 14-22) — cách làm mới của Tailwind v4, biến CSS thành token tiện dụng trong JSX.
- **Quy ước "2 trạng thái in":** các rule nén spacing nằm NGOÀI `@media print` và chỉ active qua class `printing-mindmap` do JS thêm (AccurateMindmap.tsx:133) — vì component cần đo (`offsetHeight`) bố cục IN trước khi tính zoom-to-fit; nếu đặt trong `@media print` thì đo không thấy (comment dòng 127-128).
- **Trick in 1 card duy nhất bằng visibility** (dòng 179-186): ẩn toàn trang rồi hiện lại subtree `.mindmap-print-root` — giữ nguyên vị trí layout (khác `display:none` phá bố cục), đây là kỹ thuật in lựa chọn phổ biến nhất và hay bị hỏi.
- **Nhất quán nhận diện văn hóa:** mọi màu đều bắt nguồn từ 2 biến `--primary`/`--accent` — đổi 2 dòng là đổi "bộ áo" cả app; họa tiết giấy dùng SVG data-URI nên không phụ thuộc file ảnh ngoài (offline-friendly, hợp USB demo).

## 6. 🎤 Giám khảo hay hỏi gì?
**Hỏi 1: "Sao nhóm CSS in lại đặt ngoài @media print mà phải thêm class lên body?"**
→ Vì AccurateMindmap cần ĐO kích thước bố cục in (nén spacing) trước khi in để tính zoom-to-fit vừa 1 trang A4 ngang; nếu rule nằm trong `@media print` thì lúc đo chưa thấy. Class `printing-mindmap` là "công tắc": JS thêm trước khi in (AccurateMindmap.tsx:133) và gỡ xong (dòng 116) để giao diện thường không bị ảnh hưởng.

**Hỏi 2: "Làm thế nào in đúng 1 card giữa trang đầy component?"**
→ Kết hợp 2 lớp: trước in, `.mindmap-print-root` được `position:absolute; top:0; left:0` + xổ hết overflow + nén spacing (dòng 129-166); trong `@media print`, dùng `visibility:hidden` cho `body *` rồi `visibility:visible` lại cho card và con cháu (dòng 179-186) — chỉ card chiếm mực in nhưng layout vẫn nguyên.

**Hỏi 3: "Sơ đồ tư duy vẽ đường nối bằng gì?"**
→ Đường cong bezier được vẽ bằng SVG bên trong AccurateMindmap (giống kiểu XMind); các class `.mm-*` của CSS chỉ đảm nhiệm bố cục flex trái/phải và các "đầu nối" `.mm-stub`/`.mm-root-line` 26×2px tạo khoảng trống để đường SVG cắm vào (comment dòng 95-96).

**Hỏi 4: "Vì sao chọn bảng màu này?"**
→ Xây dựng nhận diện văn hóa: nền giấy dó, chữ mực tàu, đỏ son cung đình, vàng hoàng thổ — gắn sản phẩm công nghệ với di sản thơ ca Việt Nam (điểm cộng cho chủ đề Digital Heritage); đồng thời toàn bộ màu dẫn xuất từ biến `:root` nên dễ bảo trì và in đúng màu nhờ `print-color-adjust: exact` (dòng 188-191).

**Hỏi 5: "Tailwind 4 có gì khác trong file này?"**
→ Không còn `tailwind.config.js`: theme khai báo trực tiếp bằng `@theme inline` (dòng 14-22) map biến CSS thành token (`--color-primary` → class `bg-primary`/`text-primary`), font từ `next/font` được nối vào `--font-sans`/`--font-serif` — CSS-first configuration.
