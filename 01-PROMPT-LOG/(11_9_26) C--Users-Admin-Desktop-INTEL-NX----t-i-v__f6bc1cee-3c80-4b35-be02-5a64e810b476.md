# Prompt Log — f6bc1cee-3c80-4b35-be02-5a64e810b476

- Dự án: `C--Users-Admin-Desktop-INTEL-NX----t-i-viet-poet-alyzer-AIQG-CHIENTHANG`
- File gốc: `C:\Users\Admin\.claude\projects\C--Users-Admin-Desktop-INTEL-NX----t-i-viet-poet-alyzer-AIQG-CHIENTHANG\f6bc1cee-3c80-4b35-be02-5a64e810b476.jsonl` (nguyên trạng, không chỉnh sửa)
- Số chỉ đạo của đội: **2**
- Thời gian: 23:23:48 11/09/2026 → 23:23:48 11/09/2026 (giờ VN)

> ĐẶC ĐIỂM TRUNG THỰC: mỗi mục dưới đây là yêu cầu do thành viên đội gõ
> vào công cụ AI-assisted coding (Claude Code), xuất tự động từ log gốc.

## CHỈ ĐẠO #1 — [23:23:48 11/09/2026]

[Request interrupted by user for tool use]

## CHỈ ĐẠO #2 — [23:23:48 11/09/2026]

Implement the following plan:

# Kế hoạch: GV tải bài học lên (PDF/dán văn bản) → AI bóc tách → GV duyệt → bài mới cho lớp + chatbot dạy được (RAG)

## Context
SGK sẽ có thay đổi nên GV cần tự đăng bài thơ mới. Phạm vi đã chốt với user: ① AI gợi ý + GV duyệt (form sửa trước khi lưu — bóc tách heuristic client-side, KHÔNG phụ thuộc LLM đang tắt), ② bài nạp vào ChromaDB để chatbot dạy được, ③ nhận PDF (có lớp chữ) + dán văn bản. Offline 100% → lưu localStorage (app đã giả định chung máy), chatbot nạp runtime vào ChromaDB (không cần restart server). Cuối thi 30/9/2026 — giữ scope gọn.

## Kiến trúc luồng dữ liệu
- GV tải lên → `extractLessonDraft()` heuristic → form duyệt → `saveLesson()` vào `vpa_custom_poems` → POST `/api/lessons` (ghi best-effort `public/data/gv_*.json` cho smartAI fallback + proxy `/ingest` sang python) → HS cùng lớp thấy bài trong AI Tutor (lọc theo lop) → chatbot RAG truy vấn theo `poem_id` như thơ gốc.
- Xóa: localStorage + xóa file JSON + `/ingest/delete` (Chroma in-process visible ngay).

## Files

### 1. TẠO `src/lib/lessonStore.ts` (pattern progressStore: safeParse + guard `typeof window`)
- Key `vpa_custom_poems` = `CustomLesson[]`:
  ```
  CustomLesson { document_id, title, grade_level:'10'|'11', semester:'hk1'|'hk2', lops:string[],
                 general_knowledge:{author_and_work}, detailed_analysis:SectionData[],
                 createdBy, createdByDisplay, createdAt, updatedAt }
  ```
- `slugify()` (NFD bỏ dấu, đ→d, `[^a-z0-9]+`→`_`, ≤40 ký tự); id mới `gv_<Date.now().toString(36)>_<slug>`
- `listLessons()`, `listLessonsForTeacher(username)` (filter createdBy), `saveLesson(draft, session)` (upsert theo id, giữ id cũ khi sửa), `deleteLesson(id)`
- `lopMatches(lop, lops)` — trim+lowercase (chuẩn progressStore)
- `toPoemData(l)` → PoemData + `lops` + `title`

### 2. SỬA `src/lib/dataLoader.ts`
- `PoemData` thêm optional `lops?: string[]`, `title?: string`
- `loadPoemData()` idempotent: reset `allPoems`/`poemsByGrade` ở đầu (và `loadPracticeTests()` tương tự) — cần cho reload theo event, đồng thời sửa bug StrictMode double-push
- Cuối `loadPoemData()`: merge `listLessons().map(toPoemData)` (dedupe theo document_id) — KHÔNG fetch `/data/gv_*.json` từ client (prod build không phục vụ file mới)

### 3. TẠO `src/lib/lessonExtractor.ts` (pure TS, "AI gợi ý" trung thực)
- `extractLessonDraft(raw, fallbackTitle?)` → `LessonDraft { title, author, general, grade_level, semester, sections, warnings[] }`
- Heuristics theo thứ tự: normalize (\r\n, \uFEFF, gộp blank) → tách title (`/^(bài thơ|tựa...)\s*[:：]/i`, hoặc dòng đầu ≤60 ký tự không kết thúc `.`), author (`/^(tác giả|tg|của)\s*/i`) → chia block theo dòng trống + marker `/^(khổ|đoạn)\s*\d+/i` hoặc `/^\d+\s*[.:)]\s*\S/` (marker line = section_name) → phân loại: thơ ≤80 ký tự & không kết thúc `.`; văn xuôi >100 ký tự (81–100 → thơ, không warn) → block văn xuôi trước thơ đầu = `general_knowledge`; block thơ không marker → `Khổ 1..N`
- Edge: đánh số hở (Khổ 1→Khổ 3) giữ tên + warn; block >30 dòng thơ giữ nguyên + warn; 0 dòng thơ → placeholder Khổ 1 + warn; `x_ray_data`/`section_outline` LUÔN rỗng (GV tự điền — không bịa nội dung)

### 4. TẠO `src/components/LessonManager.tsx` (~450 dòng, `'use client'`, props `{session, myLops}`)
State machine `view: 'list' | 'upload' | 'review'`, phong cách royal theme như TeacherDashboardPage (`royal-title`, `royal-border paper-texture`, `var(--primary)`/`var(--accent)`, cellStyle `var(--font-sans)`):
- **upload**: chọn nguồn Dán văn bản / file `.pdf|.txt`; select Khối (default `gradeFromLop(myLops[0])`), Học kỳ, checkbox Lớp phát hành từ myLops (default all). PDF: dynamic import trong handler:
  ```ts
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  ```
  (chuỗi static bắt buộc để Turbopack bundle; fallback nếu lỗi: copy worker vào `public/` + `workerSrc='/pdf.worker.min.mjs'`). Gom items thành dòng theo `transform[5]` (±2), sort -y → x; lỗi PDF → thông báo tiếng Việt "file scan không có lớp chữ". `.txt` dùng `file.text()`
- **review**: input title/author, select khối/học kỳ, checkbox lops, textarea Kiến thức chung; từng card `Khổ ${i+1}`: input section_name, textarea thơ (join `\n` ↔ split), bảng x_ray [từ khóa | biện pháp | hiệu quả] + bảng outline [ý | chi tiết (\n) | kết luận], nút thêm/xóa hàng, ↑/↓ đổi thứ tự Khổ, xóa Khổ. Validate trước Lưu: title + ≥1 Khổ có thơ + ≥1 lop
- Lưu: `saveLesson()` → `POST /api/lessons` → dispatch `window.dispatchEvent(new Event('lessons-changed'))`; `ragError` → notice vàng: "Đã lưu. Chatbot RAG chưa nạp (server tắt?) — bấm Nạp lại RAG khi server bật"
- **list**: bảng bài của GV (Tiêu đề | Khối/HK | Lớp | Số Khổ | Ngày) + [Sửa] [Xóa (confirm)] [Nạp lại RAG (re-POST)]; luôn đọc lại localStorage

### 5. SỬA `src/components/pages/TeacherDashboardPage.tsx`
- Tab state `'classes' | 'lessons'`, thanh 2 nút dưới header (active nền `var(--primary)`, inactive `var(--paper-light)` viền `var(--accent)`), label `LỚP HỌC` / `BÀI HỌC`
- Wrap nội dung hiện tại trong `{tab==='classes' && ...}`; `{tab==='lessons' && <LessonManager session={session} myLops={myLops} />}` — `myLops` có sẵn dòng 87, không đổi props/page.tsx wiring

### 6. SỬA `src/app/page.tsx`
- Rút body load poems thành `reloadPoems()`; filter khi `session.role==='user'`: `getAllPoems().filter(p => !p.lops || p.lops.some(l => l.trim().toLowerCase() === session.lop.trim().toLowerCase()))`
- Thêm effect nghe event `lessons-changed` → `reloadPoems()` (GV xem ngay bài mới mà không cần đăng nhập lại; dataLoader idempotent từ mục 2 là điều kiện)

### 7. TẠO `src/app/api/lessons/route.ts` (proxy theo style `/api/ai`, không cần CORS)
- `POST {lesson}`: validate `document_id` khớp `/^gv_[a-z0-9_-]+$/` (chặn path traversal) → build poem thuần → `fs.writeFileSync` vào `public/data/<id>.json` (best-effort, cho smartAI fallback) → `fetch(RAG_BACKEND_URL/ingest, timeout 30s)` → trả `{ok, fileWritten, ragIngested, ragError?}`
- `DELETE {document_id}`: validate id → `fs.rmSync` + proxy `/ingest/delete` → `{ok, ragError?}`

### 8. SỬA `src/app/api/ai/route.ts`
- `loadPoemData`: thay mảng 16 file hardcode bằng `fs.readdirSync(dataDir).filter(f => f.endsWith('.json'))` — smartAI fallback tìm được `gv_*.json`, hành vi 16 file gốc y nguyên (match theo id)

### 9. SỬA `python-backend/rag_query.py`
- Port từ `build_vector_db_v2.py` (thư mục cha, không import được): module-level `CHUNK_SIZE=512, CHUNK_OVERLAP=50`, `chunk_text()` (nguyên văn), `_sanitize_id()` (`\s+`→`_`), `create_passages(poem, title)` — 4 loại passage general/original_text/x_ray/outline đúng format cũ, metadata đủ `poem_id`/`type`/`section` (+`title`, `custom:True`) để `_list_poem_sections` và targeted "khổ N" chạy luôn không cần sửa gì
- `RAGPipeline.ingest_poem(poem, title)` → đăng ký `POEM_TITLES[doc_id]`, `remove_poem(doc_id)` trước (tránh chunk mồ côi khi sửa Khổ), encode `normalize_embeddings=True`, `collection.upsert(...)` (pattern reembed đã chứng minh) → `{passages, total}`
- `RAGPipeline.remove_poem(poem_id)` → `collection.get(where poem_id)` → `.delete(ids)` (in-process visible ngay, persist qua restart)

### 10. SỬA `python-backend/server.py`
- Models `IngestRequest {poem: dict, title: str = ''}` + `IngestDeleteRequest {poemId: str}`
- `POST /ingest` (validate document_id + detailed_analysis → `rag.ingest_poem`), `POST /ingest/delete` (`rag.remove_poem` + `POEM_TITLES.pop`)

### 11. Cài dependency + nhật ký
- `npm install pdfjs-dist --legacy-peer-deps` (bắt buộc --legacy-peer-deps)
- Ghi `NHAT_KY_CHINH_SUA.md` Phiên 23 + chú ý RESTART python server sau khi sửa

## Không làm
- Không đụng `smartAI.ts`, `/api/chat`, RAG query path (regression 12/12 giữ nguyên); không OCR file scan (chỉ PDF có lớp chữ); không sync đa thiết bị (localStorage chung máy — đúng kiến trúc hiện có); không cho GV tạo đề thi từ bài custom; không thêm auth cho API (đúng chuẩn `/api/ai` hiện tại); thuật ngữ "Khổ"

## Verification
1. `npm install pdfjs-dist --legacy-peer-deps` → `npx tsc --noEmit` sạch → `npx tsx test_chatbot_fix.ts` 12/12
2. Restart python server → health OK. Đăng nhập GV (mã GV-…) → Quản lý lớp → tab BÀI HỌC → dán thơ 2 khổ → thấy Khổ 1/Khổ 2 đúng dòng, title/author bóc được, x-ray/outline rỗng → điền 1 hàng x_ray → Lưu → hiện trong danh sách + file `public/data/gv_*.json` tồn tại
3. Upload PDF text-layer → giữ dòng thơ; PDF scan → thông báo lỗi sạch
4. Đăng nhập HS đúng lớp → AI Tutor hiện bài mới đúng Khối/Học kỳ → vào Khổ 1 hỏi "khổ 1" (RAG đang chạy) → trả lời targeted có thơ gốc + x-ray; tắt RAG → chatbot vẫn dạy qua smartAI (`ragEnabled:false`)
5. Xóa bài → HS không còn thấy, `public/data/gv_*.json` biến mất, số passages giảm (curl /statistics)
6. curl test `/ingest` (ASCII-safe) + `/ingest/delete`


If you need specific details from before exiting plan mode (like exact code snippets, error messages, or content you generated), read the full transcript at: C:\Users\Admin\.claude\projects\C--Users-Admin-Desktop-INTEL-NX----t-i-viet-poet-alyzer-AIQG-CHIENTHANG\87280500-331a-4219-83a3-286389db4427.jsonl
