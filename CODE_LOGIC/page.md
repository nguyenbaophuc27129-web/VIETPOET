# 📄 page.tsx — Bộ điều phối trung tâm: điều hướng 3 trang + khởi tạo kho dữ liệu thơ + render trang đang active

**Vị trí:** src/app/page.tsx | **Số dòng:** ~196 | **Được sử dụng bởi:** Next.js App Router (route `/` theo convention file-routing — không component nào import trực tiếp)

## 1. File này làm gì? (đọc trong 30 giây)
- Là điểm vào UI của toàn bộ ứng dụng: vẽ header phong cách "cung đình" (logo + tên + 3 nút điều hướng + badge Intel AI), footer và vùng nội dung `<main>`.
- Quản lý điều hướng 1 tầng bằng state: `activePage` nhận giá trị `'home' | 'ai-tutor' | 'practice'` (line 11) — tại một thời điểm chỉ MỘT trang được mount (conditional rendering, line 133-135), không phải đa route của Next.js.
- Khởi tạo toàn bộ kho dữ liệu thơ một lần duy nhất qua `initializeData()` rồi truyền mảng `poems` + cờ `loading` xuống cả 3 trang con.

## 2. Đầu vào / Đầu ra
- **Đầu vào:** Không có props (đây là route entry). Dữ liệu gián tiếp: JSON thơ nằm trong `public/data`, được `initializeData()` (src/lib/dataLoader.ts, line 219) fetch về memory.
- **Đầu ra:** Cây DOM hoàn chỉnh của app: header sticky (line 70-129) → `<main class="paper-texture">` chứa 1 trong 3 page (line 132-136) → footer 4 cột công nghệ/SDGs/liên hệ (line 139-194).

## 3. Luồng xử lý chính (từng bước)
1. Lần render đầu: `mounted = false` (line 25) → trả về màn hình chờ "Đang tải..." với logo pulse (line 51-65) để SSR và lần render client đầu tiên giống hệt nhau.
2. useEffect #1 (line 28-39): đăng ký 2 CustomEvent trên `window` — `'navigate-ai'` → `setActivePage('ai-tutor')`, `'navigate-practice'` → `setActivePage('practice')`; có cleanup `removeEventListener` khi unmount.
3. useEffect #2 (line 41-48): `setMounted(true)` → gọi `initializeData()` (async) → khi xong: `getAllPoems()` → `setPoems(allPoems)` → `setLoading(false)`.
4. Người dùng bấm nút điều hướng trong header (line 100-117) → `setActivePage(item.id)` → JSX ở line 133-135 render đúng 1 trang: `HomePage` / `AITutorPage` / `PracticePage`, đều nhận `{ poems, loading }`.
5. Khi đang ở HomePage, bấm nút CTA "Bắt Đầu Học..." → HomePage dispatch CustomEvent `'navigate-ai'` (HomePage.tsx line 53) → listener ở bước 2 đổi trang. Đây là cơ chế điều hướng chéo không cần prop drilling.

## 4. Các hàm chính & vai trò
| Tên hàm / khối | Dòng | Làm gì |
|---|---|---|
| `VietPoetAlyzer` (default export) | 21 | Root component: giữ state điều hướng + dữ liệu, vẽ khung app |
| useEffect (nav events) | 28-39 | Đăng ký/gỡ listener `'navigate-ai'`, `'navigate-practice'` trên window |
| useEffect (init data) | 41-48 | `mounted=true`; gọi `initializeData()` → `getAllPoems()` → `setPoems`, tắt loading |
| Gate `if (!mounted)` | 51-65 | Màn hình chờ chống lỗi hydration trước khi client mount |
| JSX nav `.map(...)` | 96-117 | Render 3 nút điều hướng, highlight nút đang active (`bg-royal-red`) |
| JSX `<main>` | 132-136 | Conditional render: chỉ mount 1 trang theo `activePage` |

## 5. Điểm kỹ thuật đáng chú ý
- **SPA 1-route trong Next.js:** toàn bộ app chạy trên duy nhất route `/`; điều hướng là React state + CustomEvent chứ không dùng `useRouter`. Điều này giúp static export/chạy offline đơn giản và việc đổi trang không reload, giữ nguyên `poems` trong memory.
- **Chống hydration mismatch:** gate `if (!mounted)` (line 51) ép lần render đầu luôn là màn hình loading tĩnh — server và client vẽ giống nhau, sau khi client mount mới fetch dữ liệu thật.
- **CustomEvent thay callback props:** HomePage đổi trang mà không cần biết ai lắng nghe; page.tsx gắn listener một lần trong useEffect — giảm prop drilling giữa các tầng component.
- Footer (line 155-162) liệt kê đúng stack thật của dự án: Intel OpenVINO GenAI, Qwen2.5 LLM, Vietnamese-SBERT, ChromaDB, RAG + Socratic Method — nhất quán với backend Python RAG.

## 6. 🎤 Giám khảo hay hỏi gì?
**Q1: Vì sao không dùng nhiều route của Next.js mà điều hướng bằng state?**
→ Sản phẩm phải chạy 100% offline trên máy học sinh: 1 route + static export là đơn giản nhất, không cần server. Đổi trang bằng state còn tức thì hơn (không reload), và dữ liệu `poems` đã nạp được giữ nguyên giữa các trang.

**Q2: `mounted` để làm gì? Bỏ được không?**
→ Chống lỗi hydration: dữ liệu được fetch phía client nên server không thể render danh sách thơ; gate này bảo đảm lần render đầu (server + client) là cùng một màn hình loading. Nếu bỏ, React có thể báo lỗi "Hydration failed" hoặc nhấp nháy UI vì DOM khác nhau.

**Q3: Dữ liệu thơ nạp khi nào, có bị nạp lại khi đổi tab không?**
→ Chỉ nạp đúng 1 lần trong useEffect #2 (dependency rỗng, line 48). Vì 3 trang cùng là con của component này và chỉ unmount/mount theo state, mảng `poems` sống trong state cha nên đổi tab không phải fetch lại.

**Q4: CustomEvent có nhược điểm gì so với callback props?**
→ Nhược: không có type-safety chặt, khó trace luồng điều hướng khi đọc code, event "bay" toàn cục. Lợi: HomePage không phụ thuộc cha, thêm nguồn điều hướng mới không sửa HomePage. Với app nhỏ này đánh đổi hợp lý.

**Q5: Nếu người dùng bấm "VIET-POET AI" trước khi dữ liệu nạp xong thì sao?**
→ `AITutorPage` nhận `loading = true` và có gate riêng (AITutorPage.tsx line 75-87) hiển thị màn "Đang tải dữ liệu..." — nên không bao giờ render sơ đồ/chat trên dữ liệu rỗng.
