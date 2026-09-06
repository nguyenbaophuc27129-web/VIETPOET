# 🐛 GHI CHÚ LỖI — Mindmap in PDF bị cắt thành 2 trang A4

**Ngày:** 04/09/2026
**Triệu chứng:** Bấm "📄 Tải PDF" ở tab Mindmap → sơ đồ tư duy dài, bị máy in **cắt đôi thành 2 trang A4** rất xấu, khó đọc.
**File liên quan:** `src/components/AccurateMindmap.tsx`, `src/app/globals.css`
**Bản lỗi được lưu tại:** `globals.css.BAN-LOI` (cùng thư mục này)

---

## 1. CODE LỖI (bản cũ)

### Handler cũ — in trực tiếp, không quan tâm kích thước nội dung:

```tsx
// ❌ BUG: chỉ thêm class rồi gọi window.print() ngay lập tức
const handleDownloadPdf = () => {
  document.body.classList.add('printing-mindmap');
  window.print();
};
```

### CSS cũ — chỉ set khổ giấy, không kiểm soát chiều cao nội dung:

```css
/* ❌ BUG: card sơ đồ cao 800-1500px trong khi trang A4 ngang chỉ ~744px in được */
@media print {
  @page { size: A4 landscape; margin: 10mm; }
  body.printing-mindmap .mindmap-print-root {
    position: absolute;
    left: 0; top: 0;
    width: 100%;
    max-height: none !important;   /* ← cho tràn vô hạn → tràn sang trang 2 */
    overflow: visible !important;
  }
}
```

**Nguyên nhân gốc:** Chiều cao sơ đồ (cột trái xếp 2 nhánh + cột phải dàn ý dài) vượt quá
chiều cao trang in (~744px @96dpi). Trình duyệt tự động cắt nội dung tràn sang trang 2 —
dây nối nhánh bị đứt, sơ đồ gãy đôi.

---

## 2. CÁCH FIX (bản mới)

### Nguyên tắc: **zoom-to-fit 1 trang** — đo trước, scale sau

```tsx
// ✅ FIX: nén khoảng cách → đo kích thước thật → tính zoom vừa trang → mới in
const handleDownloadPdf = () => {
  const el = rootRef.current;
  if (!el) return;

  document.body.classList.add('printing-mindmap');   // bật bố cục nén (CSS ngoài @media print)
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const PAGE_W = 1046, PAGE_H = 744;               // vùng in A4 ngang, lề 10mm (96dpi)
    const w = el.scrollWidth + 1;
    const h = el.scrollHeight + 1;
    const zoom = Math.min(1, (PAGE_W / w) * 0.97, (PAGE_H / h) * 0.97);
    el.style.width = `${w}px`;                       // khoá width để không bị reflow khi zoom
    el.style.zoom = zoom < 1 ? String(zoom) : '';
    setTimeout(() => window.print(), 100);
  }));
};
```

```css
/* ✅ FIX: CSS "chuẩn bị in" đặt NGOÀI @media print để đo được đúng bố cục in
   (@media print chỉ áp dụng lúc render bản in — không đo được từ JS) */
body.printing-mindmap .mindmap-print-root { position: absolute; max-height: none !important; overflow: visible !important; break-inside: avoid; }
body.printing-mindmap .mindmap-print-root .gap-10 { gap: 12px !important; }
body.printing-mindmap .mindmap-print-root .p-6 { padding: 12px !important; }
/* ... nén padding/margin/gap ... */

@media print {
  @page { size: A4 landscape; margin: 10mm; }
  /* ẩn toàn trang, chỉ hiện card sơ đồ + giữ nguyên màu ô */
  body.printing-mindmap * { visibility: hidden; }
  body.printing-mindmap .mindmap-print-root,
  body.printing-mindmap .mindmap-print-root * { visibility: visible; }
  body.printing-mindmap .mindmap-print-root { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
}
```

### Bài học ghi nhớ
1. **`@media print` không đo được bằng JS** — muốn đo bố cục in phải dùng class thường (`body.printing-mindmap`) đặt ngoài media query.
2. **`zoom` thu nhỏ toàn bộ layout** (khác `transform: scale` chỉ co hình ảnh, vẫn chiếm chỗ cũ gây trang trắng).
3. Phải **khoá `width` px** trước khi zoom để bố cục không reflow lệch so với lúc đo.
4. Header/nút bấm đánh dấu class **`.no-print`** để loại khỏi bản in, tiết kiệm chiều cao.

## 3. Kết quả sau fix
- Sơ đồ in ra **luôn vừa đúng 1 trang A4 ngang**, không bao giờ cắt đôi.
- Sơ đồ càng dài → zoom càng nhỏ (chữ nhỏ lại nhưng vẫn đọc được), hợp lý hơn việc gãy đôi.
