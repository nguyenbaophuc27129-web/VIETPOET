# 📋 NHẬT KÝ LỖI KHI ĐÓNG GÓI USB OFFLINE (05/09/2026)

**Nhiệm vụ:** Đóng gói toàn bộ sản phẩm vào `NX Đề tài\USB_PACKAGE` để triển khai offline vùng núi.
**Kết quả cuối:** Gói ~3 GB chạy độc lập 100% (đã test backend RAG từ chính thư mục package).

---

## ❌ LỖI 1 — Robocopy báo OK nhưng KHÔNG chép gì (cờ `/E` bị biến thành ổ đĩa `E:/`)

**Hiện tượng:** Toàn bộ bước dùng robocopy (src, public, chroma_db, models 1.5G, node_modules)
im lặng thất bại — chỉ các bước `cp` thành công. Script không báo lỗi vì output bị `>/dev/null`.

**Nguyên nhân:** Git-bash (MSYS) tự chuyển đổi tham số bắt đầu bằng `/` thành đường dẫn:
cờ `/E` của robocopy bị biến thành `E:/` → `ERROR: Invalid Parameter #3 : "E:/"`, exit code 16.

**Cách fix:**
```bash
export MSYS_NO_PATHCONV=1          # tắt chuyển đổi path của MSYS
# và dùng đường dẫn dạng C:/ thay vì /c/
robocopy "src" "C:/.../USB_PACKAGE/app/src" /E /MT:16 ...
```

**Bài học:** Mọi lệnh Windows nhận cờ kiểu `/X` (robocopy, xcopy, diskpart…) gọi từ git-bash
đều phải bọc `MSYS_NO_PATHCONV=1`, và KHÔNG được nuốt stderr/stdout khi chép số lượng lớn.

---

## ❌ LỖI 2 — curl tải installer xong nhưng thư mục installers/ RỖNG (path Unicode)

**Hiện tượng:** `curl -o "<path có chữ Đề tài>/python...exe"` in ra `HTTP 200 size 0`,
thư mục đích trống trơn, không có file nào được tạo.

**Nguyên nhân:** curl của git-bash ghi file qua đường dẫn Unicode không đúng — file bị ghi
vào nơi khác/thất bại âm thầm.

**Cách fix:** `cd` vào đúng thư mục đích trước rồi dùng tên file tương đối:
```bash
cd ".../USB_PACKAGE/installers" && curl -sL -o python-3.13.7-amd64.exe <URL>
```

---

## ❌ LỖI 3 — URL bộ cài Python trả 404 (đoán URL sai)

**Hiện tượng:** Tải `python.org/ftp/python/3.13.7/amd64/python-3.13.7-amd64.exe` → 404.

**Cách fix:** Xem listing thư mục trước để lấy tên thật:
`curl -s https://www.python.org/ftp/python/3.13.7/` → tên đúng KHÔNG có `/amd64/`:
`https://www.python.org/ftp/python/3.13.7/python-3.13.7-amd64.exe` (28.8 MB, HTTP 200).

**Bài học:** Không đoán URL — luôn kiểm tra listing/index trước khi tải.

---

## ❌ LỖI 4 — ChromaDB trong package báo "Collection does not exist" (NGHIÊM TRỌNG NHẤT)

**Hiện tượng:** Test chạy từ `USB_PACKAGE/server/` → SBERT local nạp OK, nhưng
`get_collection('viet_poetry_knowledge')` thất bại — mất toàn bộ kho tri thức 456 đoạn.

**Nguyên nhân:** `rag_query.py` tính path kiểu "gốc dự án":
```python
PROJECT_ROOT = Path(__file__).parent.parent
CHROMA_DIR   = PROJECT_ROOT / 'python-backend' / 'chroma_db'
```
Trong gói USB, code nằm ở `USB/server/rag_query.py` → path trỏ tới
`USB/python-backend/chroma_db` (không tồn tại!) → chromadb **lặng lẽ tạo database TRẮNG mới**.

**Cách fix (chọn thẳng vào gốc):** tính path từ chính vị trí file — trùng pattern mà
`llm_generator.py`, `eval_retrieval_scientific.py` vốn đã dùng đúng:
```python
CHROMA_DIR = Path(__file__).parent / 'chroma_db'
```
→ Đúng cho MỌI cấu trúc thư mục (nguồn lẫn package). Sau fix: **456 passages nạp OK,
confidence 0.553 với câu hỏi thử** (đúng đoạn "Khổ 1 - Cảnh sông nước" Tràng giang).

**Bài học:** Mọi path runtime trong backend phải **file-relative** (`Path(__file__).parent / ...`),
tuyệt đối không "project-root-relative" nếu muốn đóng gói di động.
Cảnh báo thêm: chromadb tạo DB trắng im lặng khi path sai — dễ tưởng là mất dữ liệu.

---

## ❌ LỖI 5 — Đổi tên thư mục `server` → `python-backend` bị khóa ("Device or resource busy")

**Hiện tượng:** Muốn đặt lại đúng cấu trúc, `mv` liên tục thất bại hơn 100 giây dù không
tiến trình nào rõ ràng đang giữ (nghi handle của shell test trước / Defender quét 2GB file mới).

**Xử lý:** Sau khi fix LỖI 4 (path tự tính từ file), việc đổi tên trở nên **không cần thiết**
→ giữ nguyên tên `server/`, các bat đã ghi đúng tên này.

**Bài học:** Khi bị chặn bởi khóa file, tìm cách **loại bỏ nhu cầu đổi tên** (sửa code cho
đa dụng) thay vì cứng đầu chống lại hệ điều hành.

---

## ⚠️ LỖI 6 (tồn tại từ trước) — `requirements.txt` gốc THIẾU `openvino-genai`

`llm_generator.py` import `openvino_genai` nhưng requirements cũ không khai báo
→ máy mới cài theo requirements sẽ KHÔNG chạy được chế độ LLM.
**Fix:** thêm `openvino-genai==2026.3.0.0` vào requirements.txt + tạo
`requirements-offline.txt` (ghim đúng phiên bản đang chạy tốt) cho wheelhouse offline.

---

## ℹ️ GHI NHỚ KHÁC

- Export SBERT local bằng `.save()`: warning `embeddings.position_ids UNEXPECTED` là vô hại
  (báo cáo load của transformers, không ảnh hưởng vector).
- `du -sh node_modules` từ git-bash cực chậm (hàng trăm nghìn file) — nên dùng robocopy /MT
  và tự tin hơn là chờ đếm file.
- Lần đầu "hoàn thành" nhanh bất thường của job nền = tín hiệu đọc lại output kiểm chứng,
  không tin trạng thái exit 0.

---

## ✅ TRẠNG THÁI GÓI CUỐI CÙNG

```
USB_PACKAGE/  (~3 GB)
├── README-DOC-DAT-LEN.md        ← thầy cô đọc file này đầu tiên
├── 01-CAI-DAT-MOT-LAN.bat       ← cài thư viện offline từ wheelhouse (1 lần)
├── 02-CHAY-SAN-PHAM.bat         ← chạy hằng ngày: AI port 5000 + web port 3000 + LAN
├── installers/  python-3.13.7-amd64.exe (28.8MB) + node-v22.23.2-x64.msi (31.7MB)
├── app/         Next.js + node_modules có sẵn (không cần npm install)
├── server/      FastAPI + chroma_db (456 đoạn) + models (Qwen INT8 1.5G + SBERT local)
└── wheelhouse/  102 wheels (332MB) — cài offline hoàn toàn
```
