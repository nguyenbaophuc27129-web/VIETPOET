# 🌐 HƯỚNG DẪN DEPLOY VIET-POET-ALYZER 2.0 LÊN INTERNET (100%)

> Mục tiêu: BGK chỉ cần một đường link là dùng được sản phẩm ngay, không cài gì cả.
> Kiến trúc online: **Frontend trên Vercel** + **Máy chủ AI (RAG + LLM) trên HuggingFace Spaces** — cả hai đều **miễn phí**.

```
Người dùng ──▶ Vercel (web Next.js)  ──env RAG_BACKEND_URL──▶  HuggingFace Space (Docker)
              https://viet-poet-alyzer                          https://<user>-vietpoet-api.hf.space
                                                           = FastAPI + ChromaDB 456 đoạn
                                                             + SBERT Việt + Qwen2.5 OpenVINO
```

> ⚠️ Bản ONLINE là **bản demo**. Điểm mạnh "offline cho vùng cao" vẫn là bản local
> (USB_PACKAGE / repo này cài theo README) — hai bản bổ trợ nhau khi thuyết trình.

---

## PHẦN A — Đưa code lên GitHub (5 phút)

1. Vào https://github.com/new → đặt tên **`viet-poet-alyzer-2026`** → chọn **Public** → **Create repository** (KHÔNG tick tạo README vì repo đã có).
2. Mở Command Prompt trong thư mục sản phẩm, chạy (thay `<ten-ban>` bằng username GitHub của bạn):

```bat
cd /d "đường-dẫn-tới\AIQG_CHIENTHANG"
git remote add origin https://github.com/<ten-ban>/viet-poet-alyzer-2026.git
git push -u origin main
```

3. Cửa sổ đăng nhập GitHub hiện ra (Git Credential Manager) → đăng nhập bằng trình duyệt → xong.
4. Kiểm tra: mở `https://github.com/<ten-ban>/viet-poet-alyzer-2026` — thấy src, python-backend, CODE_LOGIC...

---

## PHẦN B — Máy chủ AI lên HuggingFace Spaces (15-20 phút, chủ yếu chờ build)

### B1. Tạo Space
1. Đăng nhập https://huggingface.co (tạo tài khoản miễn phí nếu chưa có).
2. **New Space** → Space name: `vietpoet-api` → SDK: **Docker** → **Blank** → Public → Create.
3. Chọn tab **Files** → **Add file → Upload files** → tải lên TOÀN BỘ nội dung thư mục `deploy/hf-space/` của repo:
   ```
   Dockerfile · README.md · requirements.txt
   server.py · rag_query.py · llm_generator.py
   chroma_db/ (cả 3 file bên trong) · scripts/download_models.py
   ```
   > Mẹo: nén `deploy/hf-space` thành ZIP rồi kéo thả cũng được; lưu ý HF không giữ cấu trúc khi upload ZIP — nên upload từng file/thư mục.
4. Space tự build: cài thư viện + **tải 2 models ~2GB → mất 10-15 phút**. Xem log tab **Logs**.

### B2. Kiểm tra máy chủ
Khi Logs hiện `Uvicorn running on http://0.0.0.0:5000`, mở tab **App** của Space, test:

- Truy cập `https://<user>-vietpoet-api.hf.space/health` → thấy JSON `"status": "healthy"` (hoặc tương tự)
- URL này chính là **RAG_BACKEND_URL** cho bước C. (VD: `https://huydev-vietpoet-api.hf.space`)

> 💡 Space miễn phí **ngủ sau ~48h không dùng** — lần truy cập đầu sau khi ngủ sẽ chậm (1-2 phút khởi động lại). Ngay trước giờ thi, vào trang Space một lần để "đánh thức".

---

## PHẦN C — Web lên Vercel (5 phút)

1. Vào https://vercel.com → **Sign up with GitHub** (dùng đúng tài khoản GitHub ở Phần A).
2. **Add New → Project** → chọn repo `viet-poet-alyzer-2026` → **Import**.
3. Ở bước cấu hình, mở mục **Environment Variables**, thêm:

   | Name | Value |
   |---|---|
   | `RAG_BACKEND_URL` | `https://<user>-vietpoet-api.hf.space` *(không có dấu `/` cuối)* |

4. Nhấn **Deploy** → chờ ~2-3 phút.
5. Lấy link dạng `https://viet-poet-alyzer-2026.vercel.app`.

---

## PHẦN D — Kiểm tra end-to-end (5 phút)

1. Mở link Vercel → chọn lớp/học kỳ → chọn bài **Tràng giang** → vào AI TUTOR → tab Trò chuyện.
2. Hỏi: *"Khổ 1 của bài thơ tả cảnh gì?"* → AI phải trả lời có nội dung bài thơ (đi qua RAG) và hiển thị nguồn.
3. Tắt thử Space (Settings → Pause) → hỏi lại → app **không sập** (tự fallback smartAI) — đây chính là điểm cộng kỹ thuật để nói với BGK.
4. Bật lại Space sau khi test xong.

---

## 🧯 Sự cố thường gặp

| Hiện tượng | Nguyên nhân & cách xử lý |
|---|---|
| Space build lỗi ở bước tải model | Build chạy lại được — nhấn **Restart Space**; kiểm tra `scripts/download_models.py` đã upload đủ |
| `/health` trả lỗi 404/502 | Space chưa build xong hoặc đang ngủ — xem tab Logs, chờ `Uvicorn running` |
| Web chạy nhưng AI trả lời kiểu rule-based (không có nguồn) | Kiểm tra env `RAG_BACKEND_URL` trên Vercel đã đúng, không thừa `/`; redeploy sau khi sửa |
| Trả lời chậm 10-20s/câu | Bình thường — LLM 1.5B chạy CPU miễn phí; nói với BGK là đánh đổi để 100% miễn phí + riêng tư |
| Vercel báo lỗi khi import | Đảm bảo repo có đủ `package.json`, `next.config.ts` ở thư mục gốc repo |

---

## 💰 Chi phí

| Thành phần | Dịch vụ | Chi phí |
|---|---|---|
| Web (Next.js) | Vercel Hobby | **0đ** |
| Máy chủ AI (RAG + LLM) | HF Spaces free (2 vCPU, 16GB) | **0đ** |
| Giọng nói TTS | Google Translate TTS | **0đ** |
| **Tổng** | | **0đ** — phù hợp triển khai trường vùng cao |
