# 📄 dataLoader.ts — Nguồn dữ liệu trung tâm: load 16 bài thơ + 10 đề luyện thi từ JSON trong /public
**Vị trí:** src/lib/dataLoader.ts | **Số dòng:** ~224 | **Được sử dụng bởi:**
- `src/app/page.tsx` (dòng 19: `initializeData`, `getAllPoems`, type `PoemData`) — client chính của app
- `src/app/api/status/route.ts` (dòng 6: `getAllPoems`) — thống kê số bài theo khối lớp
- `src/app/api/test-accuracy/route.ts` (dòng 7: `initializeData`) — nạp dữ liệu trước khi chạy test
- `src/lib/smartAI.ts` (dòng 16) — import type `PoemData`, `SectionData`
- `src/lib/enhancedAI.ts` (dòng 6) — import type `PoemData`, `SectionData`, `XRayData`, `OutlinePoint`
- `src/lib/accuracyTesting.ts` (dòng 5: `getAllPoems`, `getPoemById`, type `PoemData`)

## 1. File này làm gì? (đọc trong 30 giây)
Là **lớp dữ liệu (data layer)** duy nhất của app: fetch lúc runtime toàn bộ 16 file JSON bài thơ SGK 2018 (từ `public/data/`) và 10 đề luyện thi (từ `public/practice_data/`), gắn metadata khối lớp/học kỳ suy ra từ tên file, rồi tổ chức vào cache in-memory theo module (toàn cục, theo khối 10/11 × hk1/hk2). Cung cấp bộ hàm truy vấn: lấy tất cả, lấy theo lớp/học kỳ, lấy theo ID, tìm kiếm theo từ khóa.

## 2. Đầu vào / Đầu ra
- **Đầu vào:** 16 file JSON bài thơ (dòng 77-94: `Bai1_lop10_hk1.json` … `Bai_4_lop10_hk2.json`) + 10 file đề thi (dòng 139-150: `de_01_L10.json` … `de_05_L11.json`) nằm trong thư mục `public/` — được serve tĩnh bởi Next.js.
- **Đầu ra:** các hàm truy vấn đồng bộ đọc từ cache: `getAllPoems(): PoemData[]`, `getPoemsByGrade(grade, semester)`, `getPoemById(id)`, `getTestsByGrade(grade)`, `searchPoems(keyword)`.
- **Kiểu dữ liệu chuẩn hóa:** `PoemData` (dòng 25-33) — hợp đồng dữ liệu mà smartAI/enhancedAI/accuracyTesting đều phụ thuộc.

## 3. Luồng xử lý chính (từng bước)
1. Ứng dụng gọi `initializeData()` (dòng 219-224) → chạy song song `loadPoemData()` + `loadPracticeTests()` bằng `Promise.all`.
2. **loadPoemData** (dòng 70-128):
   - Xác định chạy server hay client: `typeof window === 'undefined'` → server cần baseUrl `http://localhost:3000`, client dùng đường dẫn tương đối (dòng 73-74).
   - Lần lượt fetch từng file JSON (dòng 96-98), parse thành `PoemData` (dòng 99).
   - Regex tên file `/lop(\d+)_hk(\d+)/` để gán `data.grade_level` và `data.semester` (dòng 102-107).
   - Push vào `allPoems` và vào đúng ô `poemsByGrade[grade][semester]` (dòng 109-118).
   - **Mỗi file có try/catch riêng** (dòng 119-121): file lỗi chỉ `console.warn`, không làm sập toàn bộ lần load.
3. **loadPracticeTests** (dòng 133-170): tương tự với 10 đề; khối lớp suy ra từ tên file chứa `L10` hay `L11` (dòng 159).
4. Log số lượng đã nạp: "Loaded N poems successfully" (dòng 124, 166).
5. Sau đó mọi truy vấn (`getPoemById`, `getPoemsByGrade`, `searchPoems`...) đều là phép đọc/lookup trực tiếp trên mảng cache — không fetch lại.

## 4. Các hàm/phần chính & vai trò
| Tên | Dòng | Làm gì |
|---|---|---|
| `XRayData` | 6-10 | 1 đơn vị "chụp X-quang" thơ: `target_words`, `art_type`, `effect` — nguyên liệu AI dùng để giảng |
| `OutlinePoint` | 12-16 | 1 ý dàn ý: `point`, `details[]`, `conclusion` |
| `SectionData` | 18-23 | 1 khổ/phần thơ: tên, câu thơ gốc, mảng X-ray, dàn ý |
| `PoemData` | 25-33 | Hợp đồng 1 bài thơ: `document_id`, `grade_level?`, `semester?`, `general_knowledge.author_and_work`, `detailed_analysis[]` |
| `PracticeTest` / `PracticeQuestion` | 35-50 | Đề luyện thi: trắc nghiệm/tự luận/phan tích, đáp án, giải thích, thơ liên quan |
| Cache module-level | 53-65 | `allPoems`, `allTests`, `poemsByGrade` (10/11 × hk1/hk2), `testsByGrade` — sống theo process (singleton) |
| `loadPoemData()` | 70-128 | Fetch 16 file bài thơ, gắn metadata từ tên file, tổ chức cache |
| `loadPracticeTests()` | 133-170 | Fetch 10 đề luyện thi, phân loại theo khối lớp |
| `getAllPoems()` | 175-177 | Trả toàn bộ bài thơ |
| `getPoemsByGrade(grade, semester)` | 182-184 | Lọc theo khối + học kỳ (optional chaining an toàn, trả `[]` nếu không có) |
| `getPoemById(id)` | 189-191 | Tìm 1 bài theo `document_id` — dùng bởi accuracyTesting và API routes |
| `getTestsByGrade(grade)` | 196-198 | Đề thi theo khối |
| `searchPoems(keyword)` | 203-214 | Tìm kiếm full-text: khớp tên tác giả/tác phẩm, tên section, hoặc từng câu thơ gốc |
| `initializeData()` | 219-224 | Điểm vào duy nhất: nạp song song cả 2 loại dữ liệu |

## 5. Điểm kỹ thuật đáng chú ý
- **Fetch runtime thay vì import tĩnh:** dữ liệu nằm trong `public/` nên thêm bài thơ mới = thêm 1 file JSON (không cần rebuild bundle); đồng thời API route (`/api/ai`) cũng có thể load cùng nguồn qua HTTP. Cái giá: phải gọi `initializeData()` trước khi dùng (page.tsx và `/api/test-accuracy` đều làm vậy).
- **Cache là module-level variable:** trong Node, module được cache 1 lần theo process → dữ liệu chỉ load 1 lần rồi dùng lại cho mọi request (mô hình singleton); trên client thì sống theo session trang.
- **Metadata từ tên file (convention-over-configuration):** `lop(\d+)_hk(\d+)` trong tên file quyết định khối/học kỳ (dòng 102-107) — đổi tên file là đổi phân loại, không cần sửa code.
- **Resilience per-file:** lỗi 1 file JSON (thiếu trường, sai format) không chặn các file khác — quan trọng khi demo offline với USB.

## 6. 🎤 Giám khảo hay hỏi gì?
**Hỏi 1: "Sao không import thẳng JSON vào bundle mà phải fetch runtime?"**
→ 3 lý do: (1) thêm/sửa bài thơ chỉ cần thêm file JSON vào `public/data` — không rebuild; (2) bundle nhỏ, trang tải nhanh; (3) cùng bộ dữ liệu dùng chung cho cả client (page.tsx) và API route (load theo poemId) mà không duplicate code bundle.

**Hỏi 2: "App biết bài nào thuộc khối 10 hay 11, hk1 hay hk2 bằng cách nào?"**
→ Regex trên chính tên file: `/lop(\d+)_hk(\d+)/` (dòng 102-107) gán `grade_level` và `semester` lúc load. Với đề thi thì tìm chuỗi `L10`/`L11` (dòng 159). Nguyên tắc đặt tên file chính là nguồn chân lý.

**Hỏi 3: "Nếu 1 file JSON bị hỏng thì sao?"**
→ Vòng lặp fetch có try/catch riêng từng file (dòng 119-121): file đó bị bỏ qua với `console.warn`, các file còn lại vẫn nạp bình thường — app không bao giờ trắng trang vì 1 lỗi dữ liệu.

**Hỏi 4: "PoemData quan trọng thế nào với AI?"**
→ Là hợp đồng dữ liệu cho toàn bộ AI: smartAI giảng từ `detailed_analysis[].x_ray_data` (từ khóa/biện pháp/tác dụng), dàn ý từ `section_outline`, tác giả từ `general_knowledge.author_and_work`. Đổi shape của PoemData là phải sửa smartAI + enhancedAI + accuracyTesting cùng lúc — đây là điểm ghép nối trung tâm của kiến trúc.

**Hỏi 5: "searchPoems tìm được gì?"**
→ Tìm full-text không dấu chuẩn hóa (chỉ lowercase, dòng 204) trên 3 mức: thông tin tác giả/tác phẩm → tên section → từng câu thơ gốc (dòng 205-213). Hạn chế: chưa bỏ dấu tiếng Việt như `norm()` trong smartAI, nên gõ không dấu sẽ không khớp.
