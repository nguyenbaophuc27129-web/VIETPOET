# 📜 VIET-POET-ALYZER 2.0

**Gia sư AI dạy thơ Việt Nam theo phương pháp Socratic — chạy được 100% OFFLINE**

> Sản phẩm dự thi **Sáng tạo trẻ Quốc gia AI 2026** (Bảng B — THPT)
> Dành cho học sinh THPT học Ngữ văn theo Chương trình GDPT 2018 (16 bài thơ lớp 10–11)

---

## ✨ Sản phẩm làm được gì?

| Tính năng | Mô tả |
|---|---|
| 🤖 **AI TUTOR** | Gia sư AI **hỏng bài kiểu Socratic** — hỏi dẫn dắt để học sinh tự nghĩ ra, **không viết bài hộ**. Có 4 tab: Poetry X-Ray, Sơ đồ tư duy, Trò chuyện (chat + giọng nói 2 chiều), Bản đồ |
| 🗣️ **Học bằng giọng nói** | Nói tiếng Việt trực tiếp (Web Speech API) — phù hợp học sinh nhỏ tuổi |
| 🗺️ **Sơ đồ tư duy + xuất PDF** | Sơ đồ bezier chuyên dụng, in vừa đúng 1 trang A4 ngang |
| 🧪 **Poetry X-Ray** | "X-quang" từ hay: chỉ ra biện pháp nghệ thuật + hiệu quả từng cụm từ |
| 📝 **VIET-POET EXAM** | 5 đề luyện thi, chấm theo barem từ khóa + phản hồi Socratic |
| 📡 **RAG chống "ảo giác"** | AI chỉ trả lời dựa trên 456 đoạn trích SGK trong ChromaDB — có nguồn, có confidence |

**Vì sao đặc biệt?** LLM Qwen2.5-1.5B được nén INT8 chạy trên **CPU bằng Intel OpenVINO** ngay tại máy trường → trường vùng cao **không cần Internet** vẫn dùng AI, dữ liệu học sinh không rời khỏi máy.

---

## 🚀 Cài đặt trên máy của bạn (Windows, ~15 phút)

### Yêu cầu
- Windows 10/11 (64-bit), RAM ≥ 8GB, ổ trống ≥ 6GB
- [Python 3.10+](https://www.python.org/downloads/) *(tick "Add Python to PATH")*
- [Node.js 18+](https://nodejs.org/) (bản LTS)
- Internet (chỉ lần cài đặt — để tải thư viện + AI models ~2GB)

### 3 bước

```bat
1. SETUP-BGK.bat        ← cài thư viện + tải AI models (chạy 1 lần)
2. CHAY-SAN-PHAM.bat    ← mở sản phẩm (mỗi lần dùng)
3. Trình duyệt tự mở http://localhost:3000
```

> 📘 **Tài liệu cho Ban Giám khảo:** toàn bộ logic từng file code nằm ở [`CODE_LOGIC/`](CODE_LOGIC/00-MUC-LUC.md) — mở file `00-MUC-LUC.md` để xem sơ đồ kiến trúc + giải thích từng file + các câu hỏi thường gặp.

---

## 🏫 Dùng cho cả lớp qua mạng LAN (School Edge Hub)

Máy giáo viên chạy `CHAY-SAN-PHAM.bat` → gõ `ipconfig` xem địa chỉ IPv4 →
học sinh nối cùng WiFi truy cập `http://<IP-máy-giáo-viên>:3000`. Không cần Internet.

---

## 🧠 Kiến trúc (bản rút gọn)

```
Trình duyệt (Next.js 16)  ──POST /api/ai──▶  Ưu tiên RAG, không có đoạn phù hợp thì
        │                                    fallback smartAI (Socratic rule-based)
        ▼
Máy chủ AI local (FastAPI :5000)
  ├─ rag_query.py      SBERT Việt encode câu hỏi → ChromaDB 456 đoạn trích/16 bài
  └─ llm_generator.py  Qwen2.5-1.5B INT8 (Intel OpenVINO, CPU) → trả lời tự nhiên
```

**Chống "ảo giác" 3 lớp:** (1) RAG chỉ trả lời khi retrieval có kết quả (confidence > 0); (2) LLM bị giới hạn chỉ dùng context từ kho tri thức; (3) mọi câu trả lời kèm nguồn + confidence.

**Độ chính xác đã đo** (`python-backend/eval_retrieval_scientific.py`, seed=42): TF-IDF Top-1 **84,4–92,7%** so với Random 6,25% trên bài toán nhận diện 16 bài thơ.

---

## 📂 Cấu trúc thư mục

```
├── SETUP-BGK.bat / CHAY-SAN-PHAM.bat   cài đặt & chạy (Windows)
├── src/                                ứng dụng web (Next.js 16 + TypeScript)
│   ├── app/api/ai/route.ts             API chat: RAG → fallback smartAI
│   ├── lib/smartAI.ts                  não AI Socratic phía client
│   └── components/                     giao diện (VoiceChat, AccurateMindmap, ...)
├── python-backend/                     máy chủ AI (FastAPI + ChromaDB + OpenVINO)
│   ├── chroma_db/                      kho tri thức 456 đoạn trích (đã dựng sẵn)
│   └── server.py / rag_query.py / llm_generator.py
├── scripts/download_models.py          tải 2 AI models (~2GB, lần đầu)
├── CODE_LOGIC/                         📘 giải thích logic TỪNG file code
├── public/data/                        dữ liệu 16 bài thơ SGK (JSON)
└── HUONG-DAN-DEPLOY-ONLINE.md          triển khai bản demo Internet (Vercel + HF Spaces)
```

---

## 📜 Giấy phép & nguồn

- Dữ liệu thơ: trích dẫn phục vụ mục đích giáo dục theo SGK Ngữ văn (CT GDPT 2018)
- Models: [OpenVINO/Qwen2.5-1.5B-Instruct-int8-ov](https://huggingface.co/OpenVINO/Qwen2.5-1.5B-Instruct-int8-ov) · [keepitreal/vietnamese-sbert](https://huggingface.co/keepitreal/vietnamese-sbert)
- Nhóm VIET-POET — Cuộc thi Sáng tạo trẻ Quốc gia AI 2026
