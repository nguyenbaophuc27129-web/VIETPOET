/** Benchmark latency cho RAG server (chạy: node benchmark_rag.js) */
const qs = [
  ['Phân tích nghệ thuật bài thơ', 'duong_phu_hanh_cao_ba_quat'],
  ['cho tôi bài mẫu', 'trang_giang_huy_can'],
  ['Cảm xúc tác giả qua hai câu thực', 'mua_xuan_chin_han_mac_tu'],
  ['Hình ảnh thiên nhiên trong thơ', null],
];

(async () => {
  // warm-up
  await fetch('http://localhost:5000/query', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: 'warm up' }) });
  const times = [];
  for (const [q, p] of qs) {
    const t0 = Date.now();
    const res = await fetch('http://localhost:5000/query', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q, poemId: p }) });
    const d = await res.json();
    const ms = Date.now() - t0;
    times.push(ms);
    console.log(ms + 'ms | conf=' + d.confidence + ' | retrieved=' + d.metadata.retrieved + ' | ' + q.slice(0, 35));
  }
  const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  console.log('---');
  console.log('AVERAGE: ' + avg + 'ms');
})();
