# 📄 GeospatialMap.tsx — Bản đồ "Thi ca Việt Nam": markers địa danh thơ ca trên bản đồ react-simple-maps, zoom được, bấm marker hiện chi tiết

**Vị trí:** src/components/GeospatialMap.tsx | **Số dòng:** ~213 | **Được sử dụng bởi:** `src/components/pages/AITutorPage.tsx` (import line 12, render line 395 — tab "🌏 Bản Đồ")

## 1. File này làm gì? (đọc trong 30 giây)
- Hiển thị bản đồ Việt Nam bằng thư viện **react-simple-maps**: `ComposableMap` (phép chiếu Mercator, tâm [105°, 16°], scale 1500) + `ZoomableGroup` cho phép zoom 1x→5x bằng nút +/−.
- Trên bản đồ đặt 4 marker đỏ tròn có icon 📜 tại các địa danh thơ (Sông Mã, Sông Hương, Hồ Gươm, Biển Đông) — bấm marker → popup giữa màn hình hiện tỉnh, tác phẩm liên quan, tác giả, mô tả.
- Dữ liệu là 1 GeoJSON VIỆT LƯỢC HÓA (chỉ 1 hình chữ nhật polygon — comment line 16 nói rõ: "in production, load from proper geojson") và mảng `poetryLocations` hard-code 4 địa điểm (line 33-66).

## 2. Đầu vào / Đầu ra
- **Đầu vào:** KHÔNG có props (line 68). Dữ liệu nội bộ: `vietnamGeo` (GeoJSON thu gọn, line 17-22) và `poetryLocations: PoetryLocation[]` (name, province, coordinates [lng, lat], poems[], author, description — line 24-66).
- **Đầu ra:** State `selectedLocation` (location đang mở popup, line 69) và `zoom` (số 1→5, line 70); UI: panel tiêu đề góc trên-trái (line 77-85), cụm nút zoom góc dưới-phải (line 87-105), bản đồ (line 107-164), popup chi tiết (line 167-201).

## 3. Luồng xử lý chính (từng bước)
1. `mapData = useMemo(() => vietnamGeo, [])` (line 73): cố định tham chiếu GeoJSON qua các lần render (thư viện yêu cầu object ổn định để tránh re-render/lỗi geometry).
2. Render `ComposableMap` với `projection="geoMercator"`, `projectionConfig={{ scale: 1500, center: [105, 16] }}`, khung 800×600 (line 107-116).
3. `ZoomableGroup zoom={zoom}` (line 117) bọc Geographies + Markers → mọi thứ phóng/thu theo state zoom.
4. `Geographies geography={mapData}` render từng vùng đất với style mặc định/hover/pressed (màu xanh dương nhạt — line 118-135).
5. `poetryLocations.map(...)` → mỗi location 1 `Marker coordinates={location.coordinates}`: chấm đỏ r=12 viền trắng + chữ 📜, `onClick` → `setSelectedLocation(location)` (line 137-162).
6. Nút "−"/"+" (line 88-104): `setZoom(clamp(zoom ± 0.5, 1, 5))` — không zoom-out dưới 1x, không quá 5x.
7. Khi `selectedLocation` có giá trị → popup căn giữa màn hình hiện tên, tỉnh, danh sách bài, tác giả, mô tả; nút × → `setSelectedLocation(null)` (line 167-201).

## 4. Các hàm chính & vai trò
| Tên hàm / khối | Dòng | Làm gì |
|---|---|---|
| `GeospatialMap` (default export) | 68 | Component duy nhất: 2 state (selectedLocation, zoom), render bản đồ + popup |
| `mapData` (useMemo) | 73 | Memoize GeoJSON để tham chiếu ổn định giữa các render |
| `poetryLocations` (const module) | 33-66 | Dữ liệu 4 địa danh thơ: toạ độ [lng, lat] + bài thơ + tác giả + mô tả |
| Nút zoom (inline onClick) | 88-104 | Tăng/giảm `zoom` bước 0.5, clamp [1, 5] |

## 5. Điểm kỹ thuật đáng chú ý
- **GeoJSON là placeholder:** polygon duy nhất là hình chữ nhật (102,9)→(107,23) (line 20) — KHÔNG phải biên giới thật Việt Nam; bản đồ "đất" thực chất chỉ là hình dạng minh hoạ, markers mới là dữ liệu thật. Comment trong code thừa nhận: cần geojson chuẩn khi lên production.
- **Toạ độ marker theo [kinh độ, vĩ độ]** đúng chuẩn GeoJSON (vd Hồ Gươm [105.85, 21.03] — line 51-53); `projectionConfig` scale 1500 + tâm [105,16] căn khung nhìn vào miền Trung Việt Nam.
- **`useMemo` cho geography** (line 73): react-simple-maps nhạy với tham chiếu object — mỗi render tạo object mới sẽ làm tính toán lại hình học; memo hoá đúng chỗ cần.
- **Dữ liệu thơ hard-code và có lỗi dữ liệu** (thấy rõ từ dữ liệu gốc): 'Sáng月在Sông Mã' chứa chữ Hán lẫn (line 38), 'Sông Hượng'/'Hồ Sword' là dịch máy sai (line 48, 56), 'Biển Đông' gán tỉnh 'Đà Nẵng' (line 61) — cho thấy đây là bản demo cần chuẩn hoá dữ liệu.
- Zoom clamp [1,5] bằng `Math.max/Math.min` (line 89, 99) — chống zoom-out âm/zoom-in vô hạn.

## 6. 🎤 Giám khảo hay hỏi gì?
**Q1: Bản đồ có phải bản đồ thật của Việt Nam không?**
→ Chưa — GeoJSON hiện là hình chữ nhật đơn giản hoá (line 17-22, comment line 16). Markers thì đúng toạ độ kinh-vĩ tuyến thật. Khi lên bản chính thức cần nạp file geojson biên giới Việt Nam chuẩn (file lớn nên bản demo thu gọn để chạy offline nhanh).

**Q2: Dùng thư viện gì, nặng không, cần mạng không?**
→ react-simple-maps (bọc d3-geo + topojson): phép chiếu và marker tính toán client-side hoàn toàn; không request mạng nào vì geography được nhúng trong code. Cần mạng duy nhất nếu sau này load geojson từ URL ngoài.

**Q3: Zoom hoạt động thế nào?**
→ State `zoom` (1→5, bước 0.5) đưa vào `ZoomableGroup` — component của thư viện tự biến đổi hình học quanh tâm; nút +/− chỉ clamp giá trị. Không dùng cuộn chuột (chỉ nút bấm) — chủ động đơn giản hoá cho học sinh.

**Q4: Vì sao bọc `vietnamGeo` trong useMemo?**
→ `Geographies` so sánh tham chiếu object; nếu mỗi render tạo object GeoJSON mới, thư viện tính lại toàn bộ path hình học → lãng phí. useMemo giữ 1 tham chiếu duy nhất suốt vòng đời component.

**Q5: Ý nghĩa giáo dục của tab này là gì?**
→ Liên hệ thơ với địa lý — địa danh trong thơ (Sông Mã của Quang Dũng, Sông Hương của Hàn Mặc Tử, Hồ Gươm...) gắn với vùng miền thật, giúp học sinh hình dung không gian cảm hứng và tình yêu quê hương đất nước trong thơ ca Việt.
