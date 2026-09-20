# 📚 CODE LOGIC — MỤC LỤC TÀI LIỆU GIẢI THÍCH TỪNG FILE

> **Dùng để ôn trước khi bảo vệ:** mỗi file code có 1 tài liệu gồm 6 phần —
> làm gì / vào-ra / luồng xử lý / bảng hàm / điểm kỹ thuật / **🎤 giám khảo hay hỏi gì (kèm đáp án)**.
> Toàn bộ số dòng trong tài liệu dẫn từ code thật tại thời điểm 05/09/2026.

---

## 🗺️ KIẾN TRÚC TỔNG QUAN (nhìn 10 giây hiểu cả hệ thống)

```
┌─────────────────────── TRÌNH DUYỆT (http://localhost:3000) ───────────────────────┐
│  page.tsx (điều phối 3 trang: Home / AI TUTOR / EXAM)                             │
│    ├─ HomePage.md          ─ trang chủ, số liệu khảo sát                          │
│    ├─ AITutorPage.md       ─ chọn bài thơ (lớp/học kỳ) → 4 tab học:               │
│    │    ├─ PoetryXRay.md      "X-quang" từ hay + hiệu quả nghệ thuật              │
│    │    ├─ AccurateMindmap.md sơ đồ tư duy + in PDF 1 trang A4                     │
│    │    ├─ VoiceChat.md       gia sư AI: nói/chat ←→ nghe (STT/TTS)               │
│    │    └─ GeospatialMap.md   bản đồ địa danh thơ ca                               │
│    └─ PracticePage.md      ─ luyện thi 5 đề, chấm theo barem keyword              │
│  NÃO AI TRONG TRÌNH DUYỆT: smartAI.md (Socratic rule-based 8 nhánh ý định)        │
└──────────────────────────────────────┬────────────────────────────────────────────┘
                                       │ POST /api/ai  (api_ai_route.md)
                        RAG trả đoạn phù hợp? ── KHÔNG → fallback smartAI
                                       │ CÓ
┌─────────────────────── MÁY CHỦ AI LOCAL (FastAPI :5000) ──────────────────────────┐
│  server.md (API + fallback 2 tầng min_score 0.22→0.30)                            │
│    ├─ rag_query.md      RAG: SBERT encode → ChromaDB 456 đoạn/16 bài → prompt     │
│    │                    Socratic (kho tri thức: chroma_db, model: models/)        │
│    └─ llm_generator.md  Qwen2.5-1.5B INT8 bằng Intel OpenVINO (bật khi            │
│                         VIETPOET_LLM=true) — guard chống "ảo giác" 3 lớp          │
│  Scripts bảo trì: build_vector_db.md · reembed_chroma_sbert.md                   │
│  Đo lường khoa học: eval_retrieval_scientific.md (TF-IDF 84-93% > SVM > SBERT)   │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📖 THỨ TỰ ĐỌC GỢI Ý (ôn thi 30 phút)

1. **00-MUC-LUC.md** (file này) → nắm kiến trúc
2. `api_ai_route.md` + `server.md` + `rag_query.md` → trả lời được "AI hoạt động thế nào?"
3. `smartAI.md` → trả lời được "AI dạy kiểu Socratic ra sao? chống đươi đáp án thế nào?"
4. `VoiceChat.md` + `api_tts_route.md` → phần demo nói tiếng Việt
5. `AccurateMindmap.md` → phần demo sơ đồ tư duy + in PDF
6. `eval_retrieval_scientific.md` → trả lời được "độ chính xác đo bằng gì?" (số liệu thật: TF-IDF Top-1 84,38–92,71%, Random 6,25%)
7. Còn lại: đọc lướt khi cần

---

## 📁 DANH SÁCH TÀI LIỆU THEO NHÓM

### A. Khung ứng dụng
| Tài liệu | File code | Vai trò |
|---|---|---|
| [page.md](page.md) | src/app/page.tsx | Điều phối 3 trang, khởi tạo dữ liệu 16 bài thơ, chống hydration |
| [layout.md](layout.md) | src/app/layout.tsx | Root layout, font Be Vietnam Pro + Playfair, SEO tiếng Việt |
| [globals.md](globals.md) | src/app/globals.css | Design system cổ phong + style mindmap + chế độ in PDF |

### B. Trang & Component chính (đang dùng)
| Tài liệu | File code | Vai trò |
|---|---|---|
| [HomePage.md](HomePage.md) | src/components/pages/HomePage.tsx | Trang chủ: vấn đề → giải pháp |
| [AITutorPage.md](AITutorPage.md) | src/components/pages/AITutorPage.tsx | Chọn bài thơ + 4 tab học (X-Ray/Mindmap/Chat/Bản đồ) |
| [PracticePage.md](PracticePage.md) | src/components/pages/PracticePage.tsx | Luyện thi 5 đề, chấm barem ≥50% |
| [PoetryXRay.md](PoetryXRay.md) | src/components/PoetryXRay.tsx | Highlight từ hay, tooltip hiệu quả nghệ thuật |
| [AccurateMindmap.md](AccurateMindmap.md) | src/components/AccurateMindmap.tsx | Sơ đồ tư duy bezier SVG + PDF 1 trang A4 |
| [VoiceChat.md](VoiceChat.md) | src/components/VoiceChat.tsx | Chat + giọng nói 2 chiều (STT/TTS) |
| [GeospatialMap.md](GeospatialMap.md) | src/components/GeospatialMap.tsx | Bản đồ địa danh thơ ca |

### C. Não AI phía frontend (src/lib)
| Tài liệu | File code | Vai trò |
|---|---|---|
| [smartAI.md](smartAI.md) | src/lib/smartAI.ts | ⭐ Socratic tutor rule-based — fallback chính của RAG |
| [dataLoader.md](dataLoader.md) | src/lib/dataLoader.ts | Data layer: fetch/cache 16 bài thơ + 10 đề |
| [accuracyTesting.md](accuracyTesting.md) | src/lib/accuracyTesting.ts | QA tự động 48 test case, ngưỡng pass 70% |
| [enhancedAI.md](enhancedAI.md) | src/lib/enhancedAI.ts | AI thế hệ cũ — chỉ còn metrics cho /api/status |

### D. API Routes (Next.js server)
| Tài liệu | Endpoint | Vai trò |
|---|---|---|
| [api_ai_route.md](api_ai_route.md) | POST /api/ai | ⭐ Chat chính: RAG 20s → fallback smartAI |
| [api_tts_route.md](api_tts_route.md) | POST /api/tts | Đọc thành tiếng: chunk ≤150 ký tự → Google TTS → ghép MP3 |
| [api_chat_route.md](api_chat_route.md) | POST /api/chat | LEGACY — tiền thân của /api/ai |
| [api_grade_route.md](api_grade_route.md) | POST /api/grade | LEGACY — chấm điểm (giờ chấm client-side) |
| [api_status_route.md](api_status_route.md) | GET /api/status | LEGACY — health-check cũ |
| [api_openvino_route.md](api_openvino_route.md) | GET /api/openvino | LEGACY — bảng giới thiệu OpenVINO tĩnh |
| [api_test-accuracy_route.md](api_test-accuracy_route.md) | GET /api/test-accuracy | QA thủ công bằng curl |

### E. Máy chủ AI (python-backend)
| Tài liệu | File code | Vai trò |
|---|---|---|
| [server.md](server.md) | server.py | ⭐ FastAPI :5000, fallback 2 tầng 0.22→0.30 |
| [rag_query.md](rag_query.md) | rag_query.py | ⭐ Trái tim RAG: SBERT + ChromaDB + prompt Socratic |
| [llm_generator.md](llm_generator.md) | llm_generator.py | Qwen2.5 INT8 OpenVINO, guard chống "ảo giác" |
| [build_vector_db.md](build_vector_db.md) | build_vector_db.py | Script build kho tri thức (bản v1 lịch sử) |
| [reembed_chroma_sbert.md](reembed_chroma_sbert.md) | reembed_chroma_sbert.py | Script re-embed sửa bug 2 không gian vector |
| [eval_retrieval_scientific.md](eval_retrieval_scientific.md) | eval_retrieval_scientific.py | Benchmark 5 phương pháp, 2 tập A/B n=96 |

### F. LEGACY — không còn được import (biết để đỡ nhầm khi bị hỏi)
`PracticeExam.md` · `AutoMindmap.md` · `TabNav.md`
→ 3 file này từng dùng rồi bị thay thế (bảng so sánh cũ/mới nằm trong từng tài liệu).
→ Nếu giám khảo hỏi "tại sao còn giữ?" — trả lời: *lưu làm bằng chứng quá trình phát triển sản phẩm (phiên bản trước), không ảnh hưởng bản chạy thật.*

---

## 🎤 5 CÂU HỎI "CHẮC CHẮN" BỊ HỎI (đáp án 30 giây)

1. **"Sản phẩm chạy offline thế nào?"** — LLM Qwen2.5-1.5B nén INT8 chạy CPU bằng Intel OpenVINO trên chính máy trường; kho tri thức 456 đoạn trích nhúng bằng SBERT Việt nằm trong ChromaDB local; bộ cài + thư viện đóng gói sẵn trong USB_PACKAGE. Chỉ tính năng đọc to TTS là cần Internet.
2. **"AI có bịa đáp án không?"** — 3 lớp chống "ảo giác": (1) RAG chỉ trả lời khi có đoạn trích phù hợp (retrieved>0 & confidence>0), không có thì fallback rule-based; (2) LLM bị cấm bịa trong system prompt + chỉ được dùng context ≤800 ký tự từ kho; (3) có guard bắt buộc dẫn nguồn.
3. **"Vì sao là gia sư mà không đươi đáp án?"** — Toàn bộ prompt theo phương pháp Socratic: hỏi ngược dẫn dắt 3 bước (gợi mở → đặt câu hỏi → học sinh tự kết luận); xin bài mẫu bị từ chối và được hướng dẫn tự viết.
4. **"Độ chính xác đo bằng gì?"** — Benchmark 5 phương pháp × 2 tập test 96 câu (câu trích nguyên văn + câu diễn đạt lại), chỉ số Top-1/Top-3/MRR/Macro-F1, seed cố định 42: TF-IDF 84–93% Top-1 so với Random 6,25%. Chat thật còn lọc theo đúng bài thơ đang học nên chính xác hơn benchmark.
5. **"Chạy được cho cả lớp không?"** — Được: máy giáo viên làm máy chủ LAN (bind 0.0.0.0), học sinh cùng WiFi truy cập http://[IP-máy-giáo-viên]:3000, không cần Internet.
