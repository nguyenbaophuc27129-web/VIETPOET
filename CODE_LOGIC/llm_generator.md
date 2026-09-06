# 📄 llm_generator.py — Sinh câu trả lời Socratic bằng Qwen2.5-1.5B, 2 backend OpenVINO INT8 / transformers, chạy 100% offline

**Vị trí:** `python-backend/llm_generator.py` | **Số dòng:** ~230 | **Vai trò trong hệ thống:** Class `SocraticLLM` được `server.py` gắn vào `RAGPipeline` khi bật `VIETPOET_LLM=true` — biến context RAG thành câu trả lời tự nhiên theo đúng format Socratic (giải thích ngắn + 1 câu hỏi 💭), có guard chống lệch format/lễo ngữ điệu.

## 1. File này làm gì? (30 giây)
Đây là lớp sinh ngôn ngữ của dự án: model chính **Qwen2.5-1.5B-Instruct** (llm_generator.py:32), chạy offline theo 2 backend tự chọn (llm_generator.py:7-9): (1) **`openvino`** — bản IR **INT8** tại `models/qwen2.5-1.5b-ov-int8` qua `openvino_genai.LLMPipeline` trên CPU (nhanh, tối ưu Intel, llm_generator.py:89-97); (2) **`transformers`** — PyTorch fp32 từ cache HF với `local_files_only=True` (llm_generator.py:99-123). Câu trả lời bị ép theo format Socratic bằng system prompt có ví dụ mẫu (llm_generator.py:38-50); nếu output thiếu câu hỏi gợi mở 💭 thì bị **từ chối** và pipeline quay về template (llm_generator.py:156-159).

## 2. Đầu vào / Đầu ra
- **Đầu vào:** `generate_socratic(question, context)` (llm_generator.py:143) — câu hỏi học sinh + context RAG do `rag_query._build_context` dựng (các passages đánh số nguồn).
- **Đầu ra:** chuỗi trả lời tiếng Việt gồm 2 phần — 1-2 câu giải thích (in đậm từ khóa bằng `**`), 1 câu hỏi gợi mở mở đầu bằng 💭; hoặc `None` khi lỗi/đạt chuẩn format → caller (`rag_query.py:268-271`) fallback template.
- **Env/bật chế độ:** server chạy với `VIETPOET_LLM=true` (dùng `START_RAG_LLM.bat` — llm_generator.py:11); mặc định tắt để giữ độ trễ ~200ms.

## 3. Luồng xử lý chính (từng bước)
1. **`load()` — chọn backend tự động (llm_generator.py:68-87):** nếu `backend='auto'|'openvino'` và thư mục `models/qwen2.5-1.5b-ov-int8` tồn tại (llm_generator.py:73) → `_load_openvino()`; gặp lỗi thì in cảnh báo và rơi xuống `_load_transformers()`; cả hai thất bại mới `raise RuntimeError` (llm_generator.py:87).
2. **`_load_openvino()` (llm_generator.py:89-97):** `openvino_genai.LLMPipeline(str(ov_model_dir), 'CPU')` — model INT8 đã export sẵn bằng optimum-cli, không cần Internet.
3. **`_load_transformers()` (llm_generator.py:99-123):** kiểm tra cache HF bằng `try_to_load_from_cache` — 1.5B chưa có thì hạ xuống 0.5B (llm_generator.py:104-112); load tokenizer + model với `local_files_only=True`, `dtype='float32'`, `device_map='cpu'`, rồi `eval()` (llm_generator.py:115-119).
4. **`_build_messages()` (llm_generator.py:130-141):** **cắt context còn 800 ký tự** (llm_generator.py:132 — context dài làm model bỏ qua format Socratic); user message chốt hạ "bắt buộc 100% TIẾNG VIỆT, đúng 2 phần như ví dụ" (llm_generator.py:136); trả về messages `[system, user]`.
5. **`generate_socratic()` (llm_generator.py:143-160):** chọn đường generate theo backend; bắt mọi exception → trả `None` (llm_generator.py:152-154); **guard chống lang lệch format:** output không chứa 💭 → in cảnh báo và trả `None` (llm_generator.py:156-159) để `rag_query` dùng template Socratic an toàn.
6. **Generate:**
   - OpenVINO (llm_generator.py:170-184): ưu tiên `apply_chat_template` của genai tokenizer, lỗi thì truyền thẳng messages (llm_generator.py:174-180); tương thích cả `openvino_genai >= 2025` (trả `str`) lẫn bản cũ (trả `DecodedResults.texts[0]`) (llm_generator.py:182-183).
   - Transformers (llm_generator.py:186-204): `apply_chat_template(tokenize=False)` → `model.generate` trong `torch.no_grad()` → decode **chỉ phần token mới sinh** (cắt bỏ prompt, llm_generator.py:202-203).
7. **`__main__` (llm_generator.py:207-230):** test standalone với context demo "Dương phụ hành" + `--bench` đo thời gian câu thứ hai.

## 4. Các hàm/class chính & vai trò
| Tên | Dòng | Làm gì |
|---|---|---|
| `MODEL_NAME` / `FALLBACK_MODEL_NAME` | llm_generator.py:32-34 | `Qwen/Qwen2.5-1.5B-Instruct` (chính — tốt hơn hẳn 0.5B về làm theo hướng dẫn + tiếng Việt) / `Qwen/Qwen2.5-0.5B-Instruct` (dự phòng nếu chưa tải). |
| `OV_MODEL_DIR` | llm_generator.py:36 | Thư mục model OpenVINO IR INT8 `models/qwen2.5-1.5b-ov-int8` (tính từ `__file__` — di động theo USB). |
| `SYSTEM_PROMPT` | llm_generator.py:38-50 | Nhân vật "trợ lý dạy học Ngữ văn THPT" + QUY TẮC: chỉ dùng ngữ cảnh đã cho (chống bịa), trả lời đúng 2 phần, KHÔNG viết bài văn dài, kèm 1 ví dụ few-shot "Tựa vai chồng". |
| `SocraticLLM.__init__` | llm_generator.py:56-65 | Nhận `backend='auto'`, lưu trạng thái `pipe/tokenizer/model`, `_loaded` guard. |
| `load()` | llm_generator.py:68-87 | Điều phối: thử OpenVINO trước (nếu có model dir), lỗi → transformers, hỏng cả hai → RuntimeError. |
| `_load_openvino()` | llm_generator.py:89-97 | Tạo `openvino_genai.LLMPipeline(model_dir, 'CPU')`, đo thời gian load. |
| `_load_transformers()` | llm_generator.py:99-123 | Kiểm tra HF cache (1.5B → 0.5B), load `local_files_only=True` fp32 CPU + `eval()`. |
| `is_loaded` (property) | llm_generator.py:126-128 | Cờ cho `rag_query`/`server` biết LLM sẵn sàng chưa. |
| `_build_messages()` | llm_generator.py:130-141 | Ghép SYSTEM_PROMPT + context (cắt 800 ký tự) + câu hỏi + mệnh lệnh 100% tiếng Việt. |
| `generate_socratic()` | llm_generator.py:143-160 | API chính: dispatch backend, bắt lỗi → None, guard thiếu 💭 → None. |
| `_generation_config()` | llm_generator.py:162-168 | `openvino_genai.GenerationConfig`: `max_new_tokens=220`, `repetition_penalty=1.15`, `do_sample=False` (deterministic — cùng câu hỏi cùng câu trả lời, phù hợp lớp học). |
| `_generate_openvino()` | llm_generator.py:170-184 | `apply_chat_template` → `pipe.generate(prompt, config)`; chuẩn hóa kết quả str/DecodedResults. |
| `_generate_transformers()` | llm_generator.py:186-204 | Cùng tham số generate (220 token, penalty 1.15, greedy) bằng PyTorch; decode phần token mới. |
| `__main__` | llm_generator.py:207-230 | Test + benchmark độc lập (`--bench`). |

## 5. Điểm kỹ thuật đáng chú ý
- **2 backend, ưu tiên OpenVINO INT8:** `LLMPipeline` với model IR INT8 tại `models/qwen2.5-1.5b-ov-int8` (llm_generator.py:36, 94) khai thác CPU Intel — đúng chủ đề cuộc thi Intel; transformers fp32 chỉ là phương án so sánh/dự phòng. Cả hai đều **offline tuyệt đối** (`local_files_only=True`, llm_generator.py:115-117).
- **Guard chống lang nhiều lớp:** (1) system prompt cấm "bịa thêm", chỉ dùng ngữ cảnh (llm_generator.py:40-41); (2) context cắt 800 ký tự vì context dài làm model bỏ qua format (llm_generator.py:131-132); (3) sau sinh, kiểm tra bắt buộc có 💭 — thiếu là từ chối toàn bộ output, trả `None` cho `rag_query` fallback template (llm_generator.py:156-159). Nhờ vậy LLM lỗi không bao giờ làm hỏng trải nghiệm học sinh.
- **`GenerationConfig` cố định & deterministic:** `do_sample=False`, `repetition_penalty=1.15`, `max_new_tokens=220` (llm_generator.py:164-168) và y hệt ở nhánh transformers (llm_generator.py:195-200) — trả lời ổn định, tránh lặp từ (vấn đề kinh điển của model nhỏ), giới hạn độ dài để không thành "bài văn".
- **Tương thích phiên bản openvino_genai:** xử lý cả API mới (generate trả `str`) lẫn cũ (`DecodedResults.texts[0]`) (llm_generator.py:182-183), cùng cơ chế dự phòng khi `apply_chat_template` lỗi (llm_generator.py:173-180).

## 6. 🎤 Giám khảo hay hỏi gì?
**Hỏi 1: "Vì sao chọn Qwen2.5-1.5B mà không dùng model lớn hơn hay API online?"**
Trả lời: Đề bài của cuộc thi là chạy offline cho trường thiếu mạng — 1.5B là điểm cân bằng: đủ tốt để làm theo hướng dẫn và viết tiếng Việt (comment llm_generator.py:31), nhỏ đủ chạy CPU thật qua OpenVINO INT8; còn API online thì phá nguyên tắc zero-Internet và chi phí vận hành.

**Hỏi 2: "OpenVINO mang lại gì cụ thể?"**
Trả lời: Model được export sang IR INT8 (băng thông/ bộ nhớ giảm ~so với fp32) và chạy bằng `openvino_genai.LLMPipeline` trên CPU (llm_generator.py:94) — tăng tốc trên phần cứng Intel, đúng định hướng của ban tổ chức; backend transformers giữ lại làm đối chứng đo tốc độ.

**Hỏi 3: "LLM sinh sai format hoặc 'bịa' thì sao?"**
Trả lời: 3 lớp bảo vệ: prompt cấm bịa + few-shot mẫu (llm_generator.py:40-49), cắt context 800 ký tự để model không bị "choáng" (llm_generator.py:132), và guard cuối: thiếu ký hiệu câu hỏi 💭 là loại toàn bộ câu trả lời, tự động quay về template Socratic của `rag_query` (llm_generator.py:156-159) — câu trả lời xấu nhất vẫn đảm bảo sư phạm.

**Hỏi 4: "Vì sao `do_sample=False`?"**
Trả lời: Greedy decoding cho kết quả deterministic — cùng ngữ cảnh luôn ra cùng câu trả lời, dễ kiểm chứng khi demo trước giám khảo; `repetition_penalty=1.15` bù lại nhược điểm lặp từ của greedy với model nhỏ.

**Hỏi 5: "Nếu máy không có model OpenVINO thì sao?"**
Trả lời: `load()` kiểm tra `ov_model_dir.exists()` trước (llm_generator.py:73), thiếu thì chuyển ngay sang transformers với `local_files_only=True`; 1.5B không có trong cache thì tự hạ xuống 0.5B (llm_generator.py:104-112). Không có case nào cần Internet.
