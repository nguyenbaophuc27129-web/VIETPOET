# HƯỚNG DẪN XUẤT & NỘP PROMPT LOG (Lịch sử câu lệnh)

> Cơ sở: Điều 5.5 Thể lệ — phải nộp **Prompt Log đầy đủ**; Điều 5.7 — **giả mạo Prompt Log bị nghiêm cấm**.
> Chiến lược của nhóm: nộp log **gốc, không chỉnh sửa** — vì log thật chính là minh chứng
> mạnh nhất cho tư duy chỉ đạo sản phẩm của đội (yêu cầu cái gì, tiêu chí ra sao, bắt sửa lỗi thế nào).

## 1. Log nằm ở đâu trên máy

Claude Code tự lưu MỌI phiên làm việc (cả câu của người dùng lẫn của AI, có timestamp từng câu):

```
C:\Users\Admin\.claude\projects\<tên-dự-án>\<mã-phiên>.jsonl
```

Các phiên liên quan tới dự án này nằm trong 2 thư mục dự án có tên chứa `viet-poet-alyzer`.

## 2. Xuất log bằng script (đã có sẵn)

```bat
cd /d "<đường-dẫn>\AIQG_CHIENTHANG\KE_KHAI_AI"
python xuat_prompt_log.py
```

Kết quả (lần chạy 07/09/2026): **57 chỉ đạo / 4 phiên** → thư mục `PROMPT-LOG/`:

- `00-TONG-HOP.md` — mục lục: phiên nào, bao nhiêu chỉ đạo, khoảng thời gian
- `<phiên>.md` — mỗi file liệt kê toàn bộ chỉ đạo của đội theo thời gian, kèm giờ VN

Lưu ý trung thực:
- Script chỉ **chuyển định dạng**, không sửa nội dung; phần quá dài (>12.000 ký tự) được rút gọn phần giữa và **ghi rõ** đã cắt — bản gốc `.jsonl` vẫn giữ nguyên trên máy (BGK cần đối chiếu thì xuất nguyên gốc được).
- Ảnh chụp màn hình file `.jsonl` gốc mở bằng Notepad/VS Code nên kèm theo 1-2 tấm để BGK thấy nguồn.

## 3. Công cụ AI khác (nếu có)

Nếu nhóm từng dùng ChatGPT / Gemini / Copilot / Cursor / v.v.:
1. Vào mục lịch sử của công cụ đó → xuất hoặc chụp toàn bộ hội thoại liên quan dự án → lưu vào `PROMPT-LOG/other-tools/`.
2. **Bổ sung vào bảng Phần 1** của `01-KE-KHAI-CONG-CU-AI-CHI-TIET.md`.

Không dùng công cụ nào ngoài Claude Code → ghi rõ "chỉ dùng Claude Code" trong bảng kê.

## 4. Cấu trúc thư mục Google Drive nộp kèm hồ sơ (Mẫu 2, mục 9)

```
📁 VIETPOET-MinhChungPhatTrien
├── 📁 PROMPT-LOG/            ← xuất từ script trên
├── 📁 CODE-LOGIC/            ← copy thư mục CODE_LOGIC/ trong repo (30 file .md)
├── 📁 MINH-CHUNG-SUA-LOI/    ← copy thư mục backups/ (BUG_NOTE, bản code cũ theo ngày)
├── 📁 DANH-GIA-KHOA-HOC/     ← copy python-backend/eval_results/ (CSV + JSON benchmark)
├── 📁 COMMIT-HISTORY/        ← chụp/EXPORT: GitHub → Commits (link repo là đủ: github.com/nguyenbaophuc27129-web/VIETPOET)
└── 📄 01-KE-KHAI-CONG-CU-AI-CHI-TIET.md  (hoặc export PDF)
```

⚠ Trước khi nộp: **mở quyền "Bất kỳ ai có đường link → Người xem"** cho thư mục Drive; rà soát
một lượt không để thông tin cá nhân nhạy cảm (SĐT, địa chỉ nhà...) trong log.

## 5. Kiểm tra trước khi nộp (checklist 60 giây)

- [ ] `PROMPT-LOG/00-TONG-HOP.md` mở được, số liệu khớp thực tế
- [ ] Bảng kê ở `01-KE-KHAI-*.md`: đã điền hết chỗ [⚠ XÁC NHẬN] / [điền] (tên đội, trường, bộ sách SGK, link Drive)
- [ ] Mọi công cụ AI từng dùng đã được liệt kê (kể cả dùng thử 1 lần)
- [ ] Link Drive mở được bằng tài khoản không có trong nhóm
- [ ] Repo GitHub công khai và commit history hiển thị
