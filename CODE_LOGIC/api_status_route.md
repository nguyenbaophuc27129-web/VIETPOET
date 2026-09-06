# 📄 api/status/route.ts — Dashboard trạng thái hệ thống tổng hợp (LEGACY)

**Vị trí:** `src/app/api/status/route.ts` | **Số dòng:** ~63 | **Được gọi từ:** LEGACY - không còn dùng (không component nào `fetch('/api/status')`; chuỗi `'/api/status - System status'` tại status/route.ts:50 và chat/route.ts:91 chỉ là dòng liệt kê. Vẫn có thể truy cập tay bằng trình duyệt/curl)

## 1. Endpoint này làm gì? (30 giây)

Trả về một ảnh chụp tổng quan (snapshot) tình trạng hệ thống qua **một GET duy nhất**: tên/version app và môi trường chạy, số bài thơ trong kho dữ liệu (phân loại lớp 10/11), các metric AI (tổng số truy vấn, điểm accuracy, chất lượng Socratic, độ liên quan ngữ cảnh, mức tương tác học sinh), danh sách feature flags (Poetry X-Ray, mindmap, voice chat, offline, Intel OpenVINO) và danh sách endpoint. Dữ liệu ghép từ 3 module lib: `dataLoader` (kho thơ), `enhancedAI` (metrics), `accuracyTesting`. Hiện tại dashboard số liệu đã được render trực tiếp từ các lib phía client nên endpoint này chủ yếu phục vụ debug/khai thác thủ công.

## 2. Đầu vào (method, body/query) / Đầu ra (JSON shape)

**GET /api/status** — không body/query.
- Output thành công (status/route.ts:16-52):
```
{
  status: 'operational', timestamp, system: { name, version: '2.0', environment },
  data: { totalPoems, poemsByGrade: { '10': n, '11': n } },
  ai: { totalQueries, accuracyScore, socraticQuality, contextRelevance, studentEngagement },
  features: { poetryXRay, autoMindmap, voiceChat, geospatialMap, offlineMode, intelOpenVINO },
  endpoints: ['/api/chat ...', '/api/openvino ...', '/api/test-accuracy ...', '/api/status ...']
}
```
- Lỗi: 500 `{ status: 'error', error, timestamp }` (status/route.ts:53-62).

Không có POST.

## 3. Luồng xử lý chính (từng bước)

1. `getAllPoems()` — lấy toàn bộ mảng bài thơ đã nạp trong bộ nhớ từ `src/lib/dataLoader.ts:175` (status/route.ts:12).
2. `aiSystem.getMetrics()` — đọc snapshot metric nội bộ từ `src/lib/enhancedAI.ts:370` (status/route.ts:13).
3. `aiSystem.calculateAccuracyScore()` — công thức: `(accurateResponses/totalQueries) × (0.4×socraticQuality + 0.3×contextRelevance + 0.3×studentEngagement) × 100`, trả 0 khi chưa có truy vấn (`enhancedAI.ts:377-388`) (status/route.ts:14).
4. Đếm thơ theo lớp bằng `document_id.includes('lop10'/'lop11')` (status/route.ts:26-29).
5. Định dạng metric AI thành chuỗi % (status/route.ts:31-37), đóng gói features + endpoints (status/route.ts:38-51), trả JSON kèm timestamp (status/route.ts:16-18).
6. Bất kỳ lỗi nào (thường do `allPoems` rỗng vì chưa gọi `initializeData()`) → 500 kèm message (status/route.ts:53-62).

## 4. Các phần chính & vai trò

| Phần | Dòng | Làm gì |
|---|---|---|
| Imports 3 lib | status/route.ts:6-8 | `getAllPoems` (dataLoader), `aiSystem` (enhancedAI), `accuracyTester` (accuracyTesting) |
| Đọc kho dữ liệu | status/route.ts:12, 24-30 | `totalPoems` + đếm theo lớp 10/11 |
| Đọc metric AI | status/route.ts:13-14, 31-37 | totalQueries, accuracyScore, socraticQuality, contextRelevance, studentEngagement |
| Feature flags | status/route.ts:38-45 | 6 tính năng đánh dấu `true` (X-Ray, mindmap, voice chat, map, offline, OpenVINO) |
| Danh sách endpoint | status/route.ts:46-51 | Menu các API của hệ thống |
| Error handler | status/route.ts:53-62 | Bọc try/catch trả 500 |

## 5. Điểm kỹ thuật đáng chú ý

- **Gom 3 nguồn dữ liệu trong 1 request:** kho thơ (dataLoader), metrics runtime (enhancedAI), bộ test (accuracyTesting — được import nhưng chỉ dùng gián tiếp qua danh sách endpoint, status/route.ts:8).
- **Metrics là trạng thái bộ nhớ process:** `aiSystem` là singleton (`enhancedAI.ts:406`), counters reset khi restart server — số liệu mang tính "trong phiên", không bền vững.
- **Phụ thuộc init:** `getAllPoems()` trả mảng toàn cục chỉ có dữ liệu sau khi `loadPoemData()` chạy; nếu gọi `/api/status` trước đó thì `totalPoems = 0` (không lỗi, chỉ thiếu số).

## 6. 🎤 Giám khảo hay hỏi gì?

**H: Chỉ số "accuracyScore" tính thế nào?**
Đ: Theo `enhancedAI.ts:377-388`: tỉ lệ trả lời chính xác nhân với điểm chất lượng tổng hợp (40% chất lượng Socratic + 30% độ liên quan ngữ cảnh + 30% mức tương tác học sinh). Chưa có truy vấn nào thì bằng 0.

**H: Endpoint này app còn dùng không?**
Đ: Không — không component nào fetch `/api/status` nữa; nó là công cụ debug/kiểm tra thủ công. Vai trò "báo tình trạng sống" của AI đã chuyển sang `GET /api/ai`, nơi kiểm tra health của RAG backend thật (ping `/health` timeout 1s).

**H: Sao phải liệt kê endpoints trong response?**
Đ: Để endpoint này tự thành "menu khám phá API" khi demo — truy cập một URL là thấy toàn bộ hệ thống endpoint kèm mô tả, tiện cho việc trình bày và kiểm thử nhanh.

**H: Số liệu có đáng tin để đưa vào báo cáo không?**
Đ: Chỉ ở mức minh họa phiên chạy (in-memory, reset khi restart). Số liệu cho báo cáo/nghiên cứu lấy từ `POST /api/test-accuracy` (chạy bộ test có ground truth) và các script benchmark Python — có lưu kết quả ra file.

**H: Vì sao gọi là version 2.0 trong khi /api/ai là 6.0?**
Đ: `version: '2.0'` (status/route.ts:21) là version **app** VIET-POET-ALYZER; còn `6.0` trong GET /api/ai là version của **hệ AI** (smartAI Socratic) — hai thang version khác nhau, đúng như `/api/chat` từng ghi "3.0 (Smart AI)".
