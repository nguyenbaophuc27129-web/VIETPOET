# GÓI KÊ KHAI AI — VIET-POET-ALYZER 2.0 (Bảng B — AI 2026)

Gói này phục vụ **Điều 5 Thể lệ** (kê khai công cụ AI + Prompt Log + minh chứng
quá trình phát triển) và các mục 3, 5, 9 của **Mẫu 2 — Hồ sơ dự án Bảng B**.

## Các file trong gói

| File | Là gì | Làm gì trước khi nộp |
|---|---|---|
| `01-KE-KHAI-CONG-CU-AI-CHI-TIET.md` | Bảng kê công cụ AI/thư viện/dữ liệu + **phân định đóng góp** (tự làm / AI hỗ trợ / nguồn mở) + quy trình kiểm chứng + cam kết | Điền chỗ `[điền]`, xử lý chỗ `[⚠ XÁC NHẬN]`; đọc kỹ Phần 4.1 — đó là phần "tư duy của đội", sửa cho đúng giọng mình |
| `02-HUONG-DAN-XUAT-PROMPT-LOG.md` | Cách xuất Prompt Log từ log gốc + cấu trúc Drive + checklist | Làm theo, rồi upload Drive, mở quyền xem |
| `xuat_prompt_log.py` | Script xuất Prompt Log tự động (đã chạy mẫu: **57 chỉ đạo / 4 phiên**) | Chạy lại mỗi khi có phiên làm việc mới: `python xuat_prompt_log.py` |
| `PROMPT-LOG/` | Kết quả xuất — lịch sử chỉ đạo AI **thật** của đội, có timestamp | Đã có sẵn; rà thông tin cá nhân trước khi công khai |

## Thông điệp chính khi bảo vệ (nói với BGK)

> "Chúng em dùng AI-assisted coding một cách có kiểm soát — như thể lệ cho phép và
> khuyến khích kê khai. AI là công cụ thực thi dưới sự chỉ đạo của đội: mọi quyết định
> kiến trúc, triết lý sư phạm, dữ liệu và tiêu chí nghiệm thu đều của chúng em. Bằng chứng
> là Prompt Log gốc 57 chỉ đạo, 30 tài liệu CODE_LOGIC giải thích từng file code, bộ
> benchmark khoa học seed=42, và văn hóa backup + BUG_NOTE qua từng phiên bản.
> BGK hỏi file nào, chúng em giải thích được file đó."

## Vì sao gói này giúp điểm cao (đối chiếu trọng tâm đánh giá Bảng B)

| Trọng tâm thể lệ | Minh chứng trong gói |
|---|---|
| "Mức độ làm chủ công cụ AI và khả năng kiểm chứng kết quả" | Phần 4.2 + Phần 5 của bảng kê: mỗi phần AI làm đều có cột "Đội kiểm chứng bằng gì" |
| "Kê khai trung thực công cụ, dữ liệu, mã nguồn, lịch sử câu lệnh" | Bảng kê 100% đối chiếu được với code (`package.json`, `requirements.txt`) + Prompt Log gốc không sửa |
| "Ý thức sử dụng AI an toàn, có trách nhiệm" | Triết lý Socratic (AI không viết bài hộ) + cam kết không thu thập dữ liệu cá nhân |
| "Tư duy phân tích, phân rã vấn đề" | Phần 4.1: 7 quyết định lớn có lý do rõ (offline-first, RAG chống bịa, fallback 3 mức, benchmark 5 phương pháp...) |
