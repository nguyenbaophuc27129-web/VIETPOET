# BẢNG KÊ KHAI CÔNG CỤ AI, DỮ LIỆU VÀ PHÂN ĐỊNH ĐÓNG GÓP

**Sản phẩm:** VIET-POET-ALYZER 2.0 — Trợ giảng AI dạy thơ Trung đại Việt theo phương pháp Socratic, chạy 100% offline
**Cuộc thi:** Sáng tạo trẻ Quốc gia trong lĩnh vực Trí tuệ nhân tạo năm 2026 — Bảng B (THPT)
**Đội thi:** [điền tên đội] — Trường: [điền] — Thành viên: [điền]
**Ngày kê khai:** 07/9/2026

> Kê khai này lập theo **Điều 5, khoản 4–6 Thể lệ**: sử dụng công cụ AI không bị coi là vi phạm
> nếu được **kê khai trung thực** và đội thi **chứng minh được khả năng hiểu, kiểm chứng, chỉnh sửa,
> vận hành** sản phẩm. Toàn bộ kê khai dưới đây có thể kiểm tra chéo trực tiếp trên mã nguồn
> (GitHub: https://github.com/nguyenbaophuc27129-web/VIETPOET) và thư mục `CODE_LOGIC/` (30 tài liệu
> giải thích logic từng file code — BGK hỏi file nào chúng em giải thích được file đó).

---

## PHẦN 1 — CÔNG CỤ AI SỬ DỤNG TRONG QUÁ TRÌNH PHÁT TRIỂN

| # | Công cụ | Vai trò trong dự án | Giai đoạn sử dụng |
|---|---|---|---|
| 1 | **Claude Code** (Anthropic — công cụ AI-assisted coding chạy trên máy) | Viết/sửa mã nguồn **theo chỉ đạo từng bước của đội**; gỡ lỗi; đóng gói bản offline; viết tài liệu kỹ thuật. Toàn bộ phiên làm việc được lưu nguyên vẹn và công bố trong **Prompt Log** (xem Phần 6) | Toàn bộ dự án |
| 2 | **Qwen2.5-1.5B-Instruct — OpenVINO INT8** (mã nguồn mở, Apache 2.0, tải từ HuggingFace Hub: `OpenVINO/Qwen2.5-1.5B-Instruct-int8-ov`) | Mô hình ngôn ngữ **BÊN TRONG sản phẩm** — sinh câu hỏi gợi mở / câu trả lời giảng dạy, chạy CPU bằng Intel OpenVINO. Đây là thành phần của sản phẩm, không phải công cụ hỗ trợ xây dựng | Sản phẩm chạy thực tế |
| 3 | **Google Translate TTS** (endpoint `translate.google.com/translate_tts`) | Đọc văn bản tiếng Việt thành giọng nói (chức năng Text-to-Speech). Không dùng API key dịch vụ trả phí; có **fallback đọc bằng giọng hệ điều hành** (Web Speech API) khi offline — sản phẩm không phụ thuộc dịch vụ này | Sản phẩm chạy thực tế |
| 4 | **Web Speech API** (SpeechSynthesis của trình duyệt/HĐH) | Giọng đọc dự phòng 100% offline cho chức năng TTS | Sản phẩm chạy thực tế |

> ⚠ [XÁC NHẬN] Nếu trong quá trình làm nhóm còn dùng công cụ AI khác (ChatGPT, Gemini,
> Copilot, Cursor...), bổ sung vào bảng trên kèm giai đoạn sử dụng — kê khai PHẢI đủ 100%.

---

## PHẦN 2 — THƯ VIỆN, FRAMEWORK, NỀN TẢNG MÃ NGUỒN MỞ

### 2.1. Frontend (web app — kiểm chứng trong `package.json`)

| Thư viện | Phiên bản | Vai trò |
|---|---|---|
| Next.js | 16.3.1 | Framework web (App Router, API Routes làm trung gian gọi RAG) |
| React / React DOM | 19.2.8 | Thư viện giao diện |
| TypeScript | 5.x | Ngôn ngữ lập trình (kiểm soát kiểu — bắt lỗi tại lúc biên dịch) |
| Tailwind CSS | 4.x | Hệ thống style |
| reactflow | 11.11.4 | Sơ đồ tư duy tương tác (mindmap) |
| react-simple-maps | 3.0.0 | Bản đồ địa lý văn học (SVG, chạy offline — không tải map tile từ internet) |
| next-pwa | 5.6.0 | Hỗ trợ PWA |

### 2.2. Backend AI (Python — kiểm chứng trong `python-backend/requirements.txt`, `requirements-offline.txt`)

| Thư viện | Vai trò |
|---|---|
| FastAPI + Uvicorn | Máy chủ API RAG (port 5000) |
| ChromaDB | Cơ sở dữ liệu vector lưu 456 đoạn kiến thức thơ |
| sentence-transformers | Mô hình embedding tiếng Việt **keepitreal/vietnamese-sbert** (tải từ HuggingFace Hub, đã xuất bản local để chạy offline) |
| PyTorch, Transformers | Hạ tầng chạy mô hình embedding |
| Intel OpenVINO + openvino-genai | Chạy LLM Qwen2.5-1.5B INT8 **trên CPU** — tối ưu cho máy cấu hình thấp của vùng cao |
| NumPy, huggingface-hub, python-dotenv | Tiện ích |

### 2.3. Nền tảng hạ tầng

| Thành phần | Vai trò |
|---|---|
| Python 3.13 / Node.js 22 | Môi trường chạy |
| Git + GitHub (repo công khai) | Lưu mã nguồn + **commit history** — minh chứng quá trình phát triển theo đúng Điều 5 |
| Bộ cài offline (wheelhouse 102 gói .whl + installer Python/Node) | Phương án triển khai USB cho trường vùng cao không có internet |

---

## PHẦN 3 — DỮ LIỆU (DATASET)

| Dữ liệu | Nguồn | Cách sử dụng | Quyền |
|---|---|---|---|
| 16 cụm bài thơ SGK Ngữ văn 10–11 (chương trình 2018): Tràng giang, Chiều chiều, Chùm thơ hai-cư Nhật Bản... | Sách giáo khoa Ngữ văn do Bộ GD&ĐT biên soạn [⚠ nhóm ghi rõ bộ sách: Kết nối tri thức / Cánh diều / Chân trời sáng tạo] | Trích văn bản thơ + kiến thức phân tích phục vụ giảng dạy học sinh; KHÔNG thu thập dữ liệu cá nhân của bất kỳ ai | Sử dụng trích dẫn phục vụ mục đích giáo dục theo Điều 25 Luật Sở hữu trí tuệ (quyền hạn chế) |
| 456 đoạn kiến thức (passages) | Nhóm **tự biên soạn, cấu trúc hóa** thành JSON đa lớp theo từng đoạn thơ: `original_text` (trích thơ) → `x_ray_data` (phân tích từ-khiện-nghệ thuật) → `section_outline` (dàn ý) → `general_knowledge` (kiến thức tác giả-tác phẩm) | Là corpus của ChromaDB, nguồn cho cơ chế RAG chống "bịa" (zero hallucination) | Sở hữu nội dung của nhóm (văn bản phân tích do nhóm biên soạn, kiểm chứng với SGK và tư liệu văn học) |
| Bộ dữ liệu đánh giá | Nhóm tự xây dựng: 2 bộ test (A — trích câu thơ, B — diễn giải), 16 lớp bài thơ, n=192 câu truy vấn, seed=42 | Đo độ chính xác truy xuất (Poem Identification Top-1) — xem Phần 5 | Sở hữu của nhóm |

**Cam kết dữ liệu (Điều 5.8–5.9):** Sản phẩm KHÔNG thu thập, xử lý hay công bố bất kỳ dữ liệu cá nhân, hình ảnh, giọng nói của người dùng; toàn bộ xử lý diễn ra trên máy cục bộ.

---

## PHẦN 4 — PHÂN ĐỊNH ĐÓNG GÓP (ĐIỀU 5.5: PHẦN TỰ LÀM / AI HỖ TRỢ / NGUỒN MỞ)

### 4.1. PHẦN NHÓM TỰ XÂY DỰNG — tư duy, quyết định, sở hữu trí tuệ của đội

Đây là phần quan trọng nhất. Mỗi dòng dưới đây là một **quyết định do con người đưa ra**:

1. **Nhận diện vấn đề:** Học sinh vùng cao khó tiếp cận internet; bài thơ Trung đại trong SGK khó dạy, giáo viên thiếu công cụ trực quan → chọn hướng "AI giáo dục chạy 100% offline".
2. **Triết lý sư phạm Socratic:** Quyết định sản phẩm **KHÔNG viết bài văn hộ học sinh** — AI chỉ hỏi gợi mở, trả lời theo lối giảng dạy, dẫn học sinh tự lập luận. Đây là lựa chọn đạo đức AI (Điều 5: "sử dụng AI an toàn, có trách nhiệm") đặt làm nguyên tắc thiết kế từ đầu, chi phối toàn bộ prompt của LLM và `src/lib/smartAI.ts`.
3. **Phạm vi và cấu trúc dữ liệu:** Chọn 16 cụm bài SGK 2018; tự thiết kế cấu trúc JSON đa lớp (trích thơ → chụp X-quang nghệ thuật → dàn ý → kiến thức nền) — cấu trúc này do nhóm nghĩ ra và biên soạn nội dung.
4. **Kiến trúc hệ thống:** Quyết định mô hình 3 tầng (web Next.js → API trung gian → máy chủ RAG Python) với **fallback 3 mức**: RAG không tìm thấy → smartAI rule-based cục bộ; RAG server tắt → app vẫn chạy; TTS online chết → giọng HĐH. Mục tiêu: sản phẩm **không bao giờ sập**, kể cả không có internet.
5. **Phương pháp đánh giá khoa học:** Tự thiết kế bài toán Poem Identification 16 lớp, 2 bộ test, n=192, seed=42; tự quyết định SO SÁNH 5 phương pháp truy xuất (TF-IDF / SVM / SBERT / Hybrid RRF / Random). Kết quả (TF-IDF 84–93% > SBERT 48–59%) được nhóm **đọc thẳng vào điểm yếu của phương pháp mình dùng** và viết thành kết luận — trung thực khoa học thay vì chỉ khoe số đẹp.
6. **Văn hóa kỹ thuật:** Mọi sửa lỗi đều lưu bản cũ + viết BUG_NOTE; mọi file code có tài liệu logic riêng (`CODE_LOGIC/` — 30 file, gồm cả mục "Giám khảo hay hỏi gì?"); mọi phiên bản lớn có thư mục backup theo ngày.
7. **Phương án triển khai:** Tự quyết định gói USB offline (installer + wheelhouse + script 2 bước) cho bối cảnh thực tế vùng cao — giải pháp này AI không tự nghĩ ra, nó xuất phát từ việc nhóm đi tìm hiểu thực trạng trường học.

### 4.2. PHẦN AI HỖ TRỢ LẬP TRÌNH (AI-assisted coding — Claude Code, theo chỉ đạo của đội)

Nguyên tắc làm việc: **đội đưa yêu cầu + tiêu chí nghiệm thu → AI viết/sửa code → đội chạy thử, kiểm chứng, mới chấp nhận.** Mỗi mục dưới đây đều có minh chứng trong Prompt Log và lịch sử backup:

| Thành phần | Đội yêu cầu gì | AI làm gì | Đội kiểm chứng bằng gì |
|---|---|---|---|
| Máy chủ RAG (`python-backend/`: build_vector_db, rag_query, server) | "Xây pipeline RAG trên ChromaDB cho 456 đoạn thơ, trả kèm nguồn + confidence" | Viết code theo thiết kế đội vẽ sẵn | Test 12 tình huống hội thoại (`test_chatbot_fix.ts`) — 12/12 pass; đo latency thực tế |
| Cơ chế fallback 3 mức | "RAG hết kết quả thì không được trả lời khô khan; server chết thì app không được sập" | Sửa `api/ai/route.ts`, `server.py`, `smartAI` | Tắt server thật rồi hỏi lại — app vẫn trả lời đúng bài thơ |
| Đánh giá khoa học (`eval_retrieval_scientific.py`) | "So sánh các phương pháp truy xuất, seed cố định, xuất CSV/JSON mở được bằng Excel" | Viết script theo đề cương thí nghiệm của đội | Tự chạy lại, đối chiếu kết quả per-poem, phát hiện và sửa MỘT LỖI NGHIÊM TRỌNG: lỗi đánh chỉ mục theo thứ hạng làm kết quả SBERT sai bằng random — đội yêu cầu AI lần trace lại cho ra causa root rồi fix |
| Sửa lỗi mindmap SVG | "Đường cong nối không cân đối khi zoom in PDF" | Sửa cách đo toạ độ (rect → offset chain) | In thử A4 ngang, soi từng nhánh; viết BUG_NOTE lưu lại nguyên nhân |
| Đóng gói USB offline | "Đóng toàn bộ sản phẩm vào USB chạy được trên máy chưa cài gì, không có mạng" | Viết script cài đặt, sửa path cho di động, tải wheels | Cắm chạy thử trên chính gói USB — backend nạp đủ 456 đoạn, confidence 0.553 |
| Tài liệu `CODE_LOGIC/` (30 file) | "Mỗi file code một tài liệu giải thích logic để BGK hỏi là trả lời được" | Soạn thảo theo mẫu 6 mục đội duyệt | **Đội tự đọc lại, đối chiếu từng dòng với code thật** — đây chính là hành động "chứng minh hiểu sản phẩm" theo Điều 5.4 |
| Hạ tầng GitHub + deploy | "Cho BGK tải về cài 1 lệnh là chạy; làm bản demo online miễn phí" | Viết script cài, Dockerfile, hướng dẫn | Cài thử từ repo sạch theo chính README |
| Phần LUYỆN THI (EXAM) — 07/9 | "Thơ trong đề bị dồn một dòng — phải tách thành từng dòng"; "chấm bài phải bám sát barem theo ý: ý đúng là được điểm, không cần nguyên văn" | Rà 99 dấu "/" → sửa 117 ngắt dòng thơ; render theo dòng; viết module `src/lib/baremGrader.ts` chấm từng ý barem (khử dấu, chia từ nội dung, đồng nghĩa cơ bản, ý chứa số bắt buộc đúng số, điểm = max_score × tỷ lệ ý) + bộ test 17 tình huống | `npx tsx test_barem.ts` → 17 PASS / 0 FAIL (test tự bắt được 2 bug thật: điểm ảo với ý rỗng từ nội dung, trượt oan do từ hướng "lên"); tsc 0 lỗi. Chi tiết: BUG_NOTE_EXAM-01 |

### 4.3. PHẦN KẾ THỪA NGUỒN MỞ (không tự phát triển, chỉ sử dụng đúng licence)

Next.js, React, Tailwind, TypeScript, reactflow, react-simple-maps, next-pwa, FastAPI, Uvicorn, ChromaDB, sentence-transformers, PyTorch, Transformers, OpenVINO, openvino-genai, NumPy; mô hình Qwen2.5-1.5B-Instruct (Apache 2.0) và keepitreal/vietnamese-sbert (nguồn mở trên HuggingFace Hub — nhóm đã kiểm tra cho phép dùng học tập/nghiên cứu). **Không có thành phần nào được sao chép từ sản phẩm dự thi khác.**

---

## PHẦN 5 — QUY TRÌNH KIỂM CHỨNG KẾT QUẢ ĐO AI TẠO RA (ĐIỀU 5.6)

1. **Kiểm thử tự động:** bộ 12 tình huống hội thoại thực tế của học sinh (`test_chatbot_fix.ts`) — 12/12 pass; đo thời gian phản hồi trung bình ~75ms cho truy vấn RAG (không LLM) và ~7s/câu khi bật LLM CPU.
2. **Đánh giá truy xuất có kiểm soát:** `eval_retrieval_scientific.py` (seed=42, n=192, 16 lớp) — kết quả đầy đủ trong `python-backend/eval_results/` (CSV mở bằng Excel), gồm cả bảng so sánh 5 phương pháp và kết quả per-poem.
3. **Kiểm chứng hỏng chủ động (fault injection):** tắt máy chủ RAG / ngắt mạng / xoá file — kiểm tra app tự fallback đúng tầng, không crash.
4. **Kiểm chứng bằng con người:** đọc đối chiếu nội dung phân tích trong JSON với SGK; tra lại nguồn gốc mỗi mô hình/thư viện trước khi dùng.
5. **Sẵn sàng đối chất:** BGK có thể mở bất kỳ file nào trong repo và hỏi "vì sao code thế này" — câu trả lời nằm trong `CODE_LOGIC/` (30 tài liệu) và Prompt Log gốc.

---

## PHẦN 6 — PROMPT LOG (LỊCH SỬ CÂU LỆNH)

- Toàn bộ lịch sử làm việc với Claude Code được lưu tự động trên máy dưới dạng file `.jsonl` (mỗi phiên một file, có timestamp từng câu). Chúng em **không chỉnh sửa, không bịa thêm** — xuất nguyên gốc thành thư mục `PROMPT-LOG/` (file `00-TONG-HOP.md` là mục lục).
- Cách đọc: trong mỗi file log, phần in đậm **"CHỈ ĐẠO"** là yêu cầu của thành viên đội (thể hiện trực tiếp tư duy ra quyết định: yêu cầu cái gì, chặt chém tiêu chí ra sao, bắt sửa lỗi thế nào); phần sau đó là AI thực hiện và đội phản hồi kiểm chứng.
- Đường dẫn công khai: [⚠ dán link Google Drive sau khi upload — mở quyền "Bất kỳ ai có đường link"]

---

## PHẦN 7 — CAM KẾT

Chúng em cam kết mọi nội dung kê khai trên là **trung thực, đầy đủ**; hiểu rõ vai trò của từng công cụ; tự chịu trách nhiệm về tính chính xác, phù hợp và an toàn của toàn bộ nội dung sản phẩm; không có hành vi vi phạm Điều 5.7 Thể lệ (không nhờ thi hộ, không sao chép, không giả mạo Prompt Log / commit history / dữ liệu thử nghiệm / video demo).

| Đại diện đội thi | Giáo viên hướng dẫn (nếu có) |
|---|---|
| (Ký, ghi rõ họ tên) | (Ký, ghi rõ họ tên) |
