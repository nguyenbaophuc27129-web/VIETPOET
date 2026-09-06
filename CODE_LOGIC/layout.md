# 📄 layout.tsx — Root Layout Next.js: self-host 2 font Google + metadata SEO + khung `<html lang="vi">`

**Vị trí:** src/app/layout.tsx | **Số dòng:** ~34 | **Được sử dụng bởi:** Next.js App Router (root layout BẮT BUỘC — framework tự wrap mọi route, không component nào import)

## 1. File này làm gì? (đọc trong 30 giây)
- Là layout gốc duy nhất của app: mọi trang (hiện chỉ có `page.tsx`) được bọc trong `<html lang="vi">` + `<body>` do file này render.
- Tải 2 font Google bằng `next/font/google`: **Be Vietnam Pro** (font không chân, dùng cho UI) và **Playfair Display** (font chân, dùng cho tiêu đề/thơ) — expose thành 2 CSS variables: `--font-be-vietnam-pro`, `--font-playfair-display`.
- Export `metadata` (title + description tiếng Việt) cho SEO/tab trình duyệt.
- Là **Server Component** (không có `'use client'`) — chạy trên server, không dùng state/effect.

## 2. Đầu vào / Đầu ra
- **Đầu vào:** `children: React.ReactNode` (line 25) — thực tế là cây component của `src/app/page.tsx`.
- **Đầu ra:** Tài liệu HTML hoàn chỉnh: `<html lang="vi" class="...biến font...">` + `<body class="min-h-full flex flex-col">`. Font được nạp lúc build (self-host), không request tới Google khi chạy.

## 3. Luồng xử lý chính (từng bước)
1. **Lúc build:** `next/font` tải Be Vietnam Pro (weight 400/500/600/700, line 5-10) và Playfair Display (weight 400-900 + italic, line 12-18), tự host file font vào bundle, sinh tên class CSS variable.
2. **Lúc render:** `RootLayout` đặt 2 class biến font lên `<html>` (line 29) — nhờ đó mọi component con đều dùng được biến này.
3. **Mapping trong globals.css:** `--font-sans: var(--font-be-vietnam-pro), sans-serif` (globals.css line 20) và `--font-serif: var(--font-playfair-display), Georgia, serif` (globals.css line 21) — đây là lý do các component chỉ cần viết `style={{ fontFamily: 'var(--font-serif)' }}`.
4. `metadata` (line 20-23) được Next.js chèn vào `<head>`: title "VIET-POET-ALYZER | Học Thơ Ca bằng Trí tuệ nhân tạo" + mô tả sản phẩm.

## 4. Các hàm chính & vai trò
| Tên hàm / khối | Dòng | Làm gì |
|---|---|---|
| `beVietnamPro` (const) | 5-10 | Cấu hình font Be Vietnam Pro: 4 weight, subset latin, `display: "swap"` |
| `playfairDisplay` (const) | 12-18 | Cấu hình Playfair Display: 6 weight + italic, dùng cho chữ thơ/tiêu đề |
| `metadata` (export const) | 20-23 | Title + description SEO tiếng Việt cho toàn site |
| `RootLayout` (default export) | 25-34 | Render `<html lang="vi">` + `<body>`, gắn class biến font, nhận `children` |

## 5. Điểm kỹ thuật đáng chú ý
- **`next/font` thay cho `<link>` Google Fonts:** font được tải và self-host lúc build → ứng dụng KHÔNG gọi network ra ngoài khi chạy — phục vụ trực tiếp mục tiêu "100% offline" của dự án; đồng thời tự chống layout shift (CLS) và preload đúng font.
- **`display: "swap"` (line 9, 17):** chữ hiển thị ngay bằng font fallback (Georgia/sans-serif) trong khi font chính đang nạp — tránh màn hình trắng chữ (FOIT).
- **`lang="vi"` (line 28):** khai báo ngôn ngữ trang cho trình đọc màn hình, SEO và là ngữ cảnh đúng cho các tính năng tiếng Việt (Web Speech API trong VoiceChat).
- **Tách lớp font 2 bước:** layout chỉ định nghĩa biến thô (`--font-be-vietnam-pro`...), globals.css map sang biến ngữ nghĩa (`--font-serif`/`--font-sans`) — đổi font chỉ cần sửa 1 nơi.

## 6. 🎤 Giám khảo hay hỏi gì?
**Q1: Vì sao dùng next/font mà không chèn link Google Fonts vào `<head>`?**
→ `next/font` tải font lúc build và nhúng vào bundle: chạy offline không cần Internet (yêu cầu cốt lõi của sản phẩm cho vùng cao), không có request ngoài, tự động preload và chống layout shift.

**Q2: Metadata đặt ở layout hay ở page? Khác nhau thế nào?**
→ Metadata ở layout áp dụng cho mọi route bên dưới; page có thể export metadata để ghi đè/giới thiệu riêng. App này chỉ có 1 route nên đặt ở root layout là đủ.

**Q3: Vì sao `<body>` là `min-h-full flex flex-col`?**
→ Tạo "sticky footer pattern": nội dung co giãn, footer luôn nằm đáy màn hình kể cả trang ngắn; kết hợp với `min-h-screen` ở page.tsx để footer không bị hở khi nội dung thấp.

**Q4: File này là Server hay Client Component? Ảnh hưởng gì?**
→ Server Component (không `'use client'`): chỉ cấu hình tĩnh (font, metadata, khung HTML) nên được render trước trên server — nhẹ, không gửi JS xuống client; mọi tương tác nằm ở các client component bên dưới (page.tsx, các trang...).

**Q5: Nếu muốn đổi toàn bộ font chữ của app thì sửa đâu?**
→ Sửa cấu hình font trong layout.tsx (hoặc thêm font mới) và mapping 2 dòng trong globals.css (line 20-21); các component không phải sửa vì chúng chỉ tham chiếu `var(--font-serif)` / `var(--font-sans)`.
