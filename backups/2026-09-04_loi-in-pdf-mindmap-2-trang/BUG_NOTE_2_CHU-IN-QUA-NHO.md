# 🐛 GHI CHÚ LỖI 2 — Mindmap in PDF ra nhưng CHỮ QUÁ NHỎ

**Ngày:** 04/09/2026 (sau khi fix lỗi "cắt 2 trang" — xem BUG_NOTE.md)
**Triệu chứng:** Sơ đồ đã vừa 1 trang A4, không còn bị cắt đôi, nhưng **chữ in ra quá nhỏ**, không tận dụng hết trang giấy.
**File liên quan:** `src/components/AccurateMindmap.tsx`, `src/app/globals.css`
**Bản lỗi được lưu tại (cùng thư mục này):**
- `AccurateMindmap.tsx.BAN-LOI-2-chu-nho`
- `globals.css.BAN-LOI-2-chu-nho`

---

## 1. PHÂN TÍCH NGUYÊN NHÂN

Zoom bị chặn bởi **chiều NGANG vô ích**:

```
Khung sơ đồ trên màn hình:  ~1232px  (max-w-7xl 1280 - padding)
Vùng in A4 ngang thực tế:    1046px  (297mm - 2×10mm lề)
→ zoom = 1046/1232 × 0.97 ≈ 0.82  ← chữ bị co còn 82% NGAY TỪ ĐẦU
```

Trong khi 3 cột mindmap chỉ cần ~1040px là đủ (min-w). Phần khung dư 190px
chẳng chứa gì thêm nhưng bắt toàn bộ sơ đồ phải co lại.

Code lỗi (v1):

```tsx
// ❌ Lỗi: đo width theo khung màn hình (rộng) → zoom bị co thêm vô ích
const w = el.scrollWidth + 1;          // ≈ 1232 (khung màn hình, không phải nội dung)
const zoom = Math.min(1, (PAGE_W / w) * 0.97, (PAGE_H / h) * 0.97);
```

Ngoài ra PAGE_H tính 744px sai — vùng in thực chỉ **718px** (210mm − 2×10mm lề),
và nén khoảng cách v1 còn lỏng (gap 12px, padding 10-12px) nên chiều cao chưa tối ưu.

---

## 2. CÁCH FIX (v2 — hiện tại)

### a) Khoá khung in đúng bề rộng tự nhiên của sơ đồ (không phụ thuộc màn hình):

```tsx
// ✅ Đặt khung = 1064px (1040 nội dung min-w + 2×8 padding) TRƯỚC khi đo
const PRINT_W = 1064;
el.style.width = `${PRINT_W}px`;
requestAnimationFrame(() => {          // đợi layout ổn theo width mới rồi mới đo
  const zoom = Math.min(1, (PAGE_W / el.scrollWidth) * 0.98, (PAGE_H / el.scrollHeight) * 0.98);
  ...
});
```

→ zoom theo chiều ngang tăng từ 0.82 lên ~0.96.

### b) Nén khoảng cách dọc mạnh hơn (chỉ ảnh hưởng bản in, không đụng màn hình):

```css
body.printing-mindmap .mindmap-print-root { line-height: 1.35; }
body.printing-mindmap .mindmap-print-root .gap-10 { gap: 8px !important; }   /* 40 → 8 */
body.printing-mindmap .mindmap-print-root .p-3 { padding: 6px !important; }  /* 12 → 6 */
body.printing-mindmap .mindmap-print-root .space-y-4 > * + * { margin-top: 6px !important; }
/* ... mb-2/mb-3/mt-1/mt-2 đều nén ... */
```

→ Chiều cao giảm 15-25% → hệ số chiều cao tăng theo → zoom tổng tăng.

### c) Sửa PAGE_H = 718px (đúng vùng in thực) — tránh lệch tính toán.

---

## 3. BÀI HỌC GHI NHỚ

1. **Zoom-to-fit phải đo theo BỀ RỘNG NỘI DUNG, không phải bề rộng khung màn hình** —
   khung dư chỉ làm chữ co thêm vô ích.
2. Đổi `width` xong phải **đợi `requestAnimationFrame`** layout mới ổn rồi mới đo `scrollHeight`,
   nếu đo ngay sẽ ra số cũ.
3. Muốn chữ in to: **nén khoảng trống (gap/padding/margin/line-height) chứ không nén chữ** —
   vì zoom phóng đại lại toàn bộ đồng nhất, khoảng trống tiết kiệm được bao nhiêu chữ được tương ứng.
4. Vùng in A4 ngang lề 10mm = **1047×718px @96dpi** (nhớ 190mm chứ không phải 197mm).

## 4. Kết quả sau fix
- Sơ đồ in chiếm **đầy trang A4 ngang**, chữ to gần bằng cỡ hiển thị thường (zoom ~0.96 với phân đoạn ngắn).
- Vẫn đảm bảo không bao giờ tràn sang trang 2.
