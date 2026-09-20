# 📄 api/openvino/route.ts — Bảng thông tin trạng thái Intel OpenVINO (tĩnh, chỉ GET)

**Vị trí:** `src/app/api/openvino/route.ts` | **Số dòng:** ~65 | **Được gọi từ:** LEGACY - không còn dùng (không có component nào `fetch('/api/openvino')`; chuỗi `'/api/openvino - Intel OpenVINO status'` tại status/route.ts:48 chỉ là dòng liệt kê endpoint. Truy cập thủ công bằng trình duyệt/curl vẫn hoạt động)

## 1. Endpoint này làm gì? (30 giây)

Trả về một JSON **tĩnh** mô tả cấu hình tăng tốc AI bằng Intel OpenVINO của dự án: phiên bản toolkit (2024.4.0), các device được hỗ trợ (CPU / GPU.INTEL / NPU), chỉ số hiệu năng quảng bá (GPU nhanh gấp 2.5x, NPU nhanh gấp 4x so với CPU baseline, tiết kiệm tới 60% điện năng), danh sách model đang dùng (Qwen2.5-0.5B/1.5B-Instruct, Vietnamese-SBERT) và các tính năng được tăng tốc (RAG vector search, guardrails, multimodal, offline). Endpoint **không thực hiện bất kỳ phép đo hay gọi model nào** — nó đóng vai trò "tấm biển giới thiệu" phục vụ demo/trình bày, phần tăng tốc thật nằm ở Python backend FastAPI (OpenVINO GenAI).

## 2. Đầu vào (method, body/query) / Đầu ra (JSON shape)

**GET /api/openvino** — không body, không query.
- Output (openvino/route.ts:35-39):
```
{
  status: 'Intel OpenVINO ready',
  message: 'AI acceleration via Intel NPU/GPU enabled',
  openvino_version: '2024.4.0',
  supported_devices: ['CPU', 'GPU.INTEL', 'NPU'],
  performance_metrics: { cpu_baseline: '1x', gpu_acceleration: '2.5x faster', npu_acceleration: '4x faster', power_saving: 'Up to 60% less power consumption' },
  models_supported: ['Qwen2.5-0.5B-Instruct', 'Qwen2.5-1.5B-Instruct', 'Vietnamese-SBERT', 'Custom LLMs via OpenVINO GenAI'],
  features: { rag_integration, prompt_armor, multimodal, offline_capability }
}
```
Không có POST; phần còn lại của file (openvino/route.ts:42-65) là **comment ghi chú** hướng dẫn cài đặt và ví dụ code Python.

## 3. Luồng xử lý chính (từng bước)

1. Request GET đến `/api/openvino`.
2. Route dựng object `intelInfo` với 4 khối dữ liệu khai báo sẵn (openvino/route.ts:8-33): version + devices (dòng 9-14), performance_metrics (dòng 15-20), models_supported (dòng 21-26), features (dòng 27-32).
3. Gộp với `status`/`message` rồi trả JSON qua `NextResponse.json` (openvino/route.ts:35-39).
4. Kết thúc — không có nhánh lỗi, không truy cập filesystem/mạng.

## 4. Các phần chính & vai trò

| Phần | Dòng | Làm gì |
|---|---|---|
| GET handler | openvino/route.ts:7-40 | Trả JSON tĩnh trạng thái OpenVINO |
| `supported_devices` | openvino/route.ts:10-14 | Liệt kê CPU, GPU.INTEL, NPU (Core Ultra) |
| `performance_metrics` | openvino/route.ts:15-20 | Con số tăng tốc: GPU 2.5x, NPU 4x, tiết kiệm 60% điện |
| `models_supported` | openvino/route.ts:21-26 | Qwen2.5-0.5B/1.5B-Instruct, Vietnamese-SBERT, custom LLM |
| `features` | openvino/route.ts:27-32 | RAG vector search, guardrails, multimodal, offline |
| Comment hướng dẫn | openvino/route.ts:42-65 | pip install openvino-genai, quy trình convert model sang IR, ví dụ `compile_model(device_name="NPU")` |

## 5. Điểm kỹ thuật đáng chú ý

- **Route tĩnh 100%:** không import thư viện OpenVINO, không đo lường thời gian thực — mọi số liệu là hằng số khai báo trong code (openvino/route.ts:8-33). Endpoint "thật" đo hiệu năng là các script benchmark Python (`gpu_benchmark_demo.py`, `openvino_simple_demo.py`...) nằm ngoài app Next.js.
- **Chính sách "CPU là sàn, NPU là trần":** dữ liệu thể hiện đúng thông điệp dự án — chạy được trên mọi PC Intel, máy có Core Ultra (NPU) thì nhanh gấp 4x và tiết kiệm điện hơn.
- **Tài liệu nhúng trong code:** 24 dòng cuối (openvino/route.ts:42-65) là hướng dẫn tái hiện pipeline Python (pip → convert IR → `core.compile_model(model, "NPU")`), tiện cho giám khảo muốn xem cách tích hợp thật.

## 6. 🎤 Giám khảo hay hỏi gì?

**H: Con số "NPU 4x nhanh hơn" lấy từ đâu, có đo thật không?**
Đ: Là con số tham chiếu khai báo trong endpoint này (openvino/route.ts:15-20); phép đo thực tế được thực hiện bằng script benchmark Python chạy trên máy (so CPU vs GPU vs NPU khi infer Qwen2.5), kết quả ghi ra `benchmark_results.json` / `openvino_demo_results.json` để đưa vào slide.

**H: Tại sao endpoint này không gọi model để đo live?**
Đ: Next.js route chạy trong Node, còn OpenVINO inference nằm ở Python backend (FastAPI port 5000) — chỗ này chỉ là bảng trạng thái tĩnh để UI/demo đọc nhanh, giữ kiến trúc "inference ở Python, Next.js chỉ điều phối".

**H: Nếu máy không có NPU thì sao?**
Đ: OpenVINO tự fallback device: `supported_devices` liệt kê CPU → GPU.INTEL → NPU (openvino/route.ts:10-14); pipeline RAG vẫn chạy trên CPU chậm hơn nhưng đầy đủ tính năng offline.

**H: Model nào thực sự đang chạy trong app?**
Đ: `Qwen2.5-1.5B-Instruct` cho sinh câu trả lời RAG và `Vietnamese-SBERT` cho embedding retrieval (openvino/route.ts:22-24); 0.5B và custom LLM là tùy chọn cấu hình cho máy yếu.

**H: Endpoint này app có dùng ở đâu không?**
Đ: Không còn component nào fetch nó — hiện chỉ là endpoint tra cứu tay/curl khi demo, và là nguồn số liệu "trích sẵn" cho phần trình bày về Intel OpenVINO.
