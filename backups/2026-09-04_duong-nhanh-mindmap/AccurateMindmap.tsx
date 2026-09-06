/**
 * Simple Accurate Mindmap Component
 * Displays poem analysis in a clean, organized layout
 * Sắp xếp chuẩn sơ đồ tư duy: 1 nút gốc ở giữa, các nhánh bên trái/phải.
 * Kiểu ô + kiểu chữ giữ nguyên như bản gốc — chỉ đổi cách bố trí.
 */
'use client';

import React, { useEffect } from 'react';

interface OutlinePoint {
  point: string;
  details: string[];
  conclusion: string;
}

interface XRayData {
  target_words: string;
  art_type: string;
  effect: string;
}

interface AccurateMindmapProps {
  outline: OutlinePoint[];
  xRayData: XRayData[];
  title: string;
  originalText: string[];
}

export default function AccurateMindmap({
  outline,
  xRayData,
  title,
  originalText
}: AccurateMindmapProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);

  // Dọn class + style tạm sau khi in xong
  useEffect(() => {
    const done = () => {
      document.body.classList.remove('printing-mindmap');
      if (rootRef.current) {
        rootRef.current.style.zoom = '';
        rootRef.current.style.width = '';
      }
    };
    window.addEventListener('afterprint', done);
    return () => window.removeEventListener('afterprint', done);
  }, []);

  // Xuất PDF vừa đúng 1 trang A4 ngang, chữ to nhất có thể:
  // 1) bật bố cục nén → 2) khoá khung in đúng bề rộng tự nhiên của sơ đồ (1064px,
  //    tránh khung màn hình rộng bị thu nhỏ vô ích) → 3) đo → 4) zoom-to-fit → 5) in
  const handleDownloadPdf = () => {
    const el = rootRef.current;
    if (!el) return;

    document.body.classList.add('printing-mindmap');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      // A4 ngang 297×210mm, lề 10mm → vùng in thực ~1047×718px (96dpi)
      const PAGE_W = 1047;
      const PAGE_H = 718;
      const PRINT_W = 1064; // 1040px nội dung mindmap (min-w) + 2×12px padding
      el.style.width = `${PRINT_W}px`;
      requestAnimationFrame(() => {
        const w = el.scrollWidth + 1;
        const h = el.scrollHeight + 1;
        const zoom = Math.min(1, (PAGE_W / w) * 0.98, (PAGE_H / h) * 0.98);
        el.style.zoom = zoom < 1 ? String(zoom) : '';
        setTimeout(() => window.print(), 100);
      });
    }));
  };

  return (
    <div
      ref={rootRef}
      className="accurate-mindmap mindmap-print-root w-full bg-white rounded-xl shadow-lg"
      style={{ maxHeight: '800px', overflowY: 'auto' }}
    >
      {/* Header */}
      <div
        className="no-print p-4 border-b sticky top-0 bg-white z-10 flex items-center justify-between gap-4"
        style={{ borderColor: 'var(--border)' }}
      >
        <h4 className="font-bold text-lg" style={{ fontFamily: 'var(--font-serif)', color: 'var(--primary)' }}>
          🗺️ SƠ ĐỒ TƯ DUY: {title}
        </h4>
        <button
          onClick={handleDownloadPdf}
          className="no-print shrink-0 px-4 py-2 rounded-lg text-white font-bold text-sm transition-opacity hover:opacity-85"
          style={{ background: 'var(--primary)' }}
          title="In hoặc lưu sơ đồ tư duy thành file PDF"
        >
          📄 Tải PDF
        </button>
      </div>

      {/* Mindmap: gốc giữa — 2 nhánh trái, 1 nhánh phải */}
      <div className="p-6 overflow-x-auto">
        <div className="flex items-center min-w-[1040px]">

          {/* ===== CÁC NHÁNH TRÁI ===== */}
          <div className="mm-side mm-left flex-1 flex flex-col gap-10">
            {/* Nhánh: Bài thơ gốc */}
            <div className="mm-branch">
              <div className="mm-branch-content p-4 rounded-lg" style={{ background: 'var(--paper-light)', border: `1px solid var(--accent)` }}>
                <h5 className="font-bold mb-3" style={{ color: 'var(--primary)' }}>📜 BÀI THƠ GỐC:</h5>
                <div className="space-y-2" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem' }}>
                  {originalText.map((line, index) => (
                    <div key={index} className="p-2 bg-white rounded">
                      {line}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mm-stub" />
            </div>

            {/* Nhánh: Phân tích nghệ thuật */}
            <div className="mm-branch">
              <div className="mm-branch-content p-4 rounded-lg" style={{ background: 'var(--paper-light)', border: `1px solid var(--accent)` }}>
                <h5 className="font-bold mb-3" style={{ color: 'var(--primary)' }}>🔍 PHÂN TÍCH NGHỆ THUẬT (X-RAY):</h5>
                <div className="space-y-3">
                  {xRayData.map((xray, index) => (
                    <div key={index} className="p-3 bg-white rounded-lg border" style={{ borderColor: 'var(--accent)' }}>
                      <div className="font-bold text-amber-700 mb-1">&quot;{xray.target_words}&quot;</div>
                      <div className="text-sm mb-1">
                        <strong>Loại nghệ thuật:</strong> {xray.art_type}
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Hiệu quả:</strong> {xray.effect}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mm-stub" />
            </div>
          </div>

          {/* ===== NÚT GỐC (giữa) ===== */}
          <div className="mm-root-wrap flex items-center flex-none">
            <div className="mm-root-line" />
            <div
              className="p-4 rounded-xl border-2 text-center max-w-[240px]"
              style={{ background: 'var(--paper-light)', borderColor: 'var(--primary)' }}
            >
              <div className="text-2xl mb-1">🗺️</div>
              <div className="font-bold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--primary)', fontSize: '1.05rem', lineHeight: 1.35 }}>
                {title}
              </div>
            </div>
            <div className="mm-root-line" />
          </div>

          {/* ===== CÁC NHÁNH PHẢI ===== */}
          <div className="mm-side mm-right flex-1 flex flex-col gap-10">
            {/* Nhánh: Dàn ý nội dung */}
            <div className="mm-branch">
              <div className="mm-stub" />
              <div className="mm-branch-content p-4 rounded-lg" style={{ background: 'var(--paper-light)', border: `1px solid var(--accent)` }}>
                <h5 className="font-bold mb-3" style={{ color: 'var(--primary)' }}>📝 DÀN Ý NỘI DUNG:</h5>
                <div className="space-y-4">
                  {outline.map((point, index) => (
                    <div key={index} className="p-3 bg-white rounded-lg">
                      <div className="font-bold mb-2" style={{ color: 'var(--primary)' }}>
                        {index + 1}. {point.point}
                      </div>
                      <div className="ml-4 space-y-1">
                        {point.details.map((detail, detailIndex) => (
                          <div key={detailIndex} className="text-sm text-gray-700">
                            • {detail}
                          </div>
                        ))}
                      </div>
                      {point.conclusion && (
                        <div className="ml-4 mt-2 text-sm italic text-blue-700">
                          → {point.conclusion}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="p-4 text-center text-sm text-gray-500 border-t" style={{ borderColor: 'var(--border)' }}>
        💡 Sơ đồ này hiển thị phân tích chi tiết theo cấu trúc dữ liệu JSON — nhấn <strong>📄 Tải PDF</strong> để lưu về học tập
      </div>
    </div>
  );
}
