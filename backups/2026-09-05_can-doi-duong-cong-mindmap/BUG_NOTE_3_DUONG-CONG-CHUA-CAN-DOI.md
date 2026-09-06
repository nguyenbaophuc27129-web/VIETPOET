# 🐛 GHI CHÚ LỖI 3 — Đường cong nối nhánh "chưa căn đối" (lệch khi zoom/in PDF)

**Ngày:** 05/09/2026
**Triệu chứng:** Đường cong bezier giữa nút gốc và các nhánh không chạm đúng mép ô —
đặc biệt khi bấm "📄 Tải PDF" (card bị áp CSS zoom-to-fit) đường bị co/lệch đi.
**File liên quan:** `src/components/AccurateMindmap.tsx`
**Bản lỗi được lưu tại (cùng thư mục này):** `AccurateMindmap.tsx.BAN-LOI-lech-toa-do-zoom`

---

## 1. PHÂN TÍCH NGUYÊN NHÂN

Hàm `measure()` trong bản lỗi **trộn 2 hệ toạ độ khác nhau**:

```tsx
// ❌ Lỗi: 2 phép đo khác đơn vị
svg.setAttribute('width', String(row.offsetWidth));      // px BỐ CỤC (chưa nhân zoom)
const rowRect  = row.getBoundingClientRect();            // px NHÌN THẤY (ĐÃ nhân zoom)
const rootRect = rootNode.getBoundingClientRect();
const sy = rootRect.top - rowRect.top + ...;             // toạ độ đường tính theo px đã zoom
```

- `getBoundingClientRect()` trả toạ độ **viewport** → bị ảnh hưởng bởi cả CSS `zoom`
  lẫn scroll của trang.
- `offsetWidth/offsetHeight` trả kích thước **bố cục** (không phụ thuộc zoom/scroll).
- SVG nằm trong subtree bị zoom → hệ toạ độ của nó là **px bố cục**.

→ Khi zoom ≠ 1 (chế độ in PDF), đường cong bị scale lệch so với khung SVG
→ endpoints không chạm mép ô, "chưa căn đối".

## 2. CÁCH FIX (v4 — hiện tại)

Bỏ hẳn `getBoundingClientRect`, đi chuỗi `offsetParent` để lấy toạ độ bố cục thuần:

```tsx
// ✅ Toạ độ bố cục: cộng dồn offsetLeft/offsetTop từ nút ngược về row
const posInRow = (el: HTMLElement) => {
  let x = 0, y = 0, cur: HTMLElement | null = el;
  while (cur && cur !== row) {
    x += cur.offsetLeft; y += cur.offsetTop;
    cur = cur.offsetParent as HTMLElement | null;
  }
  return { x, y };
};
```

- Mép nút gốc = `pos + offsetWidth/offsetHeight` → tính điểm bắt đầu/kết thúc đường cong.
- Toạ độ và kích thước SVG **cùng một đơn vị (px bố cục)** → luôn khớp,
  miễn nhiễm hoàn toàn với CSS zoom và scroll trang.

## 3. BÀI HỌC GHI NHỚ

1. `getBoundingClientRect()` = px viewport (ăn cả CSS zoom **và** scroll);
   `offsetLeft/Top/Width/Height` = px bố cục. Trộn lẫn 2 đơn vị → lệch tăm tắp.
2. Toạ độ SVG trong subtree bị `zoom` phải tính theo **px bố cục** (offset chain),
   không dùng rect.
3. Với sơ đồ cần in (zoom-to-fit), offset chain là cách "miễn nhiễm" triệt để —
   không phải chia/hệ số hiệu chỉnh gì thêm.
