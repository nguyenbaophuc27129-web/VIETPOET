# BUG NOTE #EXAM-01 — Thơ trong phần LUYỆN THI (EXAM) bị dồn một dòng

- **Ngày:** 07/09/2026
- **Phát hiện bởi:** Thành viên đội (tự QA phần VIET-POET EXAM trước khi nộp hồ sơ)
- **Yêu cầu gốc (chỉ đạo):** *"phần viết văn bài thơ phải được trình bày thành từng dòng
  đáng hoảng [đáng đọc] để đọc được; hãy điều chỉnh và kiểm tra; note lại phát hiện này
  để kê khai quá trình phát triển sản phẩm"*

## 1. Hiện tượng

Vào **LUYỆN THI → Viết Văn**, các câu hỏi có đoạn thơ (VD: "Buổi gặt chiều", "Tràng giang",
"Gửi mẹ"...) hiển thị thành **một khối chữ dàn trải liền tít** — câu thơ sau dính vào câu
thơ trước, không thể đọc như bài thơ.

## 2. Nguyên nhân gốc (điều tra được 4 lỗi, không chỉ 1)

| # | Lỗi | Nguyên nhân |
|---|---|---|
| 1 | Thơ dồn 1 dòng ở **7/10 đề** | Dữ liệu JSON dùng dấu ` / ` (chuẩn ghi dòng thơ tiếng Việt) nhưng HTML **nuốt ký tự xuống dòng**, component chưa render theo dòng |
| 2 | Riêng **de_01_L10 "Buổi gặt chiều"** | Dữ liệu bị dính liền **ngay từ trong JSON** (không cả dấu `/`) — 12 dòng 8-chữ nằm trên 1 dòng |
| 3 | Ô "✍️ ĐỀ BÀI VIẾT" **rỗng hoàn toàn ở cả 10 đề** | Component render `writing_section.prompt` nhưng **không đề nào có key `prompt`** trong dữ liệu (đề bài nằm trong từng câu hỏi) → hiện ô trắng vô nghĩa |
| 4 | Phần chấm bài: HS gõ **không dấu** thì trượt oan | So khớp barem so chuỗi có dấu; "buoi gat chieu" không khớp "Buổi gặt chiều". Kèm lỗi nhỏ: lời nhận xét kết quả mất dấu ("[TUYET VOI] Ban da hieu bai"), nút **Lớp 12** chọn được nhưng không có dữ liệu đề nào |

## 3. Cách sửa

### Dữ liệu (`public/practice_data/` — script `sua_du_lieu_de_thi.py` cùng thư mục này)
- Quy tắc an toàn: chỉ đổi `" / "` (space-**slash**-space) → xuống dòng thật `\n`.
  Đã **rà 99 dấu "/" toàn bộ 10 đề trước khi sửa**: các dấu "/" văn xuôi
  (`anh/chị`, `3/5`, `5/1978`, `thật/ giả`) không có space 2 bên → không đụng tới.
- Kết quả: **117 chỗ ngắt dòng thơ** (5 đề WQ + 3 passage thơ + câu hỏi đọc hiểu trích thơ),
  chèn 11 ngắt dòng cho "Buổi gặt chiều", sửa dấu nháy kép `''` → `"` (de_03_L10).
- Văn xuôi được kiểm chứng **0 ngắt dòng ngoài ý muốn**.

### Component (`src/components/pages/PracticePage.tsx`)
- Thêm `whiteSpace: 'pre-line'` cho **3 chỗ hiển thị**: passage đọc hiểu, đề bài viết,
  text câu hỏi → thơ hiển thị đúng từng dòng.
- `prompt` thành tùy chọn, **chỉ render ô "ĐỀ BÀI VIẾT" khi đề thực sự có prompt**.
- Chấm bài: thêm `normVN()` (viết thường + bỏ dấu + đ→d) — **gõ không dấu vẫn được chấm đúng**;
  phản hồi từng câu hiện "khớp X/Y ý barem" + liệt kê ý còn thiếu; lời nhận xét có dấu;
  bỏ nút Lớp 12 (không có dữ liệu); **gắn nhãn minh bạch phương pháp chấm** ngay bảng kết quả:
  *"so khớp barem từ khóa (khử dấu tiếng Việt) — chấm tức thì, hoạt động 100% offline"*.

## 4. Sự cố trong quá trình sửa (ghi trung thực)

Lần chạy đầu, script `sua_du_lieu_de_thi.py` **trỏ nhầm đường dẫn vào thư mục backup**
(đã sửa 117 dấu `/` vào… bản sao lưu thay vì bản thật). Phát hiện ngay khi verify
(đếm `\n` = 0 ở bản thật) → khôi phục bản gốc cho thư mục backup, sửa đường dẫn trong
script, chạy lại và verify đủ: 12 dòng "Buổi gặt chiều", 117 ngắt dòng, TS compile sạch,
server trả JSON đúng. **Bài học: script sửa dữ liệu phải verify trên chính tập tin đích,
không tin Output "ok" của chính nó.**

## 5. Bằng chứng kiểm chứng (07/09/2026)

- `npx tsc --noEmit` — 0 lỗi.
- Server dev HTTP 200; `GET /practice_data/de_01_L10.json` trả thơ đủ **12 dòng**.
- Văn xuôi (de_01_L11 WQ1) — 0 xuống dòng ngoài ý muốn.
- Bản gốc trước sửa: `PracticePage.tsx.TRUOC-SUA` + `practice_data/*.json` (thư mục này).

---

## 6. Nâng cấp tiếp theo cùng ngày: chấm BAREM THEO Ý (không cần nguyên văn)

- **Chỉ đạo của đội:** *"hệ thống chấm bài đã bám sát barem chấm theo ý chưa; chỉ cần
  có ý đúng là được điểm chứ không cần đúng 100% nguyên câu"*. Kiểm tra lại: bản trước
  so chuỗi **nguyên văn** (`includes`) → HS diễn đạt ý đúng bằng từ khác vẫn bị trượt oan;
  điểm tính theo "câu đạt/không đạt", chưa chia điểm theo ý.
- **Giải pháp:** module mới `src/lib/baremGrader.ts` — chấm từng Ý barem:
  1. khử dấu tiếng Việt (`normVN`) → gõ không dấu vẫn được chấm;
  2. chia ý thành **từ nội dung** (bỏ stopword) → đủ ~nửa số từ là **ĐẠT ý** (diễn đạt lại bằng từ khác vẫn được điểm);
  3. khớp cùng gốc từ (vd "vươn" khớp "vươn tới");
  4. bảng đồng nghĩa văn luận: thủ pháp ~ bút pháp, hình tượng ~ hình ảnh, cảm thông ~ đồng cảm;
  5. ý chứa số (vd "ngắt nhịp 3/5") **bắt buộc đúng số** — không có điểm ảo;
  6. điểm câu = `max_score × (số ý đạt / tổng ý)` — đúng tinh thần barem thật.
  Nhận xét hiển thị **từng ý đạt / ý thiếu** + điểm từng câu (`3.2/4 điểm`).
- **2 bug do chính test bắt được (trung thực ghi lại):**
  1. từ hướng "lên/di" bị tính là từ nội dung → paraphrase "vươn tới" bị trượt → đã thêm stopword;
  2. ý không còn từ nội dung nào (vd "ý một") bị **tự động tính ĐẠT = điểm ảo** → đã sửa thành chỉ ý thuần số mới xét riêng.
- **Minh chứng:** `test_barem.ts` (17 tình huống: nguyên văn / không dấu / paraphrase / từ đồng nghĩa /
  sai số / bài trắng / tính điểm theo max_score) — chạy `npx tsx test_barem.ts` → **17 PASS / 0 FAIL**;
  `npx tsc --noEmit` 0 lỗi; server 200. Bản trước nâng cấp: `PracticePage.tsx.TRUOC-BAREM-THEO-Y` (thư mục này).
