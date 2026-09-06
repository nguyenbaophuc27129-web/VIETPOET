/**
 * Poetry X-Ray Component - Fixed Version
 * Hover over keywords to reveal artistic analysis
 */
'use client';

import React, { useState } from 'react';

interface XRayData {
  target_words: string;
  art_type: string;
  effect: string;
}

interface PoetryXRayProps {
  originalText: string[];
  xRayData: XRayData[];
}

export default function PoetryXRay({ originalText, xRayData }: PoetryXRayProps) {
  const [xRayInfo, setXRayInfo] = useState<XRayData | null>(null);

  // Process each line to highlight target words
  const processedLines = originalText.map(line => {
    let processedLine = line;
    const highlights: Array<{text: string; data: XRayData; start: number}> = [];

    // Find all xray data that appears in this line
    xRayData.forEach(xray => {
      const targetText = xray.target_words;
      const index = line.toLowerCase().indexOf(targetText.toLowerCase());

      if (index !== -1) {
        highlights.push({
          text: line.substring(index, index + targetText.length),
          data: xray,
          start: index
        });
      }
    });

    // If no highlights found, return original line
    if (highlights.length === 0) {
      return (
        <div key={line} className="text-lg leading-relaxed" style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-dark)' }}>
          {line}
        </div>
      );
    }

    // Sort highlights by start position
    highlights.sort((a, b) => a.start - b.start);

    // Build the line with highlights
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    highlights.forEach((highlight) => {
      // Add text before highlight
      if (highlight.start > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {processedLine.substring(lastIndex, highlight.start)}
          </span>
        );
      }

      // Add highlighted text
      const highlightText = processedLine.substring(highlight.start, highlight.start + highlight.text.length);
      parts.push(
        <span
          key={`highlight-${highlight.start}`}
          className="xray-target cursor-pointer transition-all duration-300"
          style={{
            borderBottom: '3px dashed #FFD700', // Vàng rơm rực rỡ
            background: 'rgba(255, 215, 0, 0.2)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontWeight: '500',
            cursor: 'help'
          }}
          onMouseEnter={() => setXRayInfo(highlight.data)}
          onMouseLeave={() => setXRayInfo(null)}
        >
          {highlightText}
        </span>
      );

      lastIndex = highlight.start + highlight.text.length;
    });

    // Add remaining text
    if (lastIndex < processedLine.length) {
      parts.push(
        <span key={`text-end-${lastIndex}`}>
          {processedLine.substring(lastIndex)}
        </span>
      );
    }

    return (
      <div key={line} className="text-xl leading-loose my-2" style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-dark)' }}>
        {parts}
      </div>
    );
  });

  return (
    <div className="poetry-xray relative p-8 rounded-xl royal-border paper-texture">
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--primary)', fontFamily: 'var(--font-serif)' }}>
          🔍 X-RAY PHÂN TÍCH NGHỆ THUẬT
        </h3>
        <p className="text-sm opacity-80 mb-4" style={{ fontFamily: 'var(--font-sans)' }}>
          Bài thơ gốc với các từ ngữ nghệ thuật được highlight
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg mb-6" style={{ border: `1px solid var(--accent)` }}>
        {processedLines}
      </div>

      {xRayInfo && (
        <div className="xray-tooltip fixed bottom-8 right-8 rounded-lg shadow-2xl p-6 max-w-md animate-fade-in z-50"
          style={{
            background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
            border: `3px solid var(--accent)`,
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }}>
          <button
            className="absolute top-3 right-3 text-gray-600 hover:text-gray-800 font-bold text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-white"
            onClick={() => setXRayInfo(null)}
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            ×
          </button>

          <h4 className="font-bold text-xl mb-3 flex items-center gap-2" style={{ color: 'var(--primary)', fontFamily: 'var(--font-serif)' }}>
            <span style={{ fontSize: '1.5rem' }}>✨</span>
            "{xRayInfo.target_words}"
          </h4>

          <div className="mb-3">
            <p className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--accent)', fontFamily: 'var(--font-sans)' }}>
              Loại nghệ thuật:
            </p>
            <p className="font-medium" style={{ color: 'var(--primary)', fontFamily: 'var(--font-sans)', fontSize: '1.1rem' }}>
              {xRayInfo.art_type}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--accent)', fontFamily: 'var(--font-sans)' }}>
              Hiệu quả:
            </p>
            <p className="text-sm" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-sans)', lineHeight: '1.6' }}>
              {xRayInfo.effect}
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 rounded-lg text-center" style={{ background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.1) 0%, rgba(158, 42, 43, 0.05) 100%)', border: `1px dashed var(--accent)` }}>
        <p className="text-sm font-medium" style={{ color: 'var(--primary)', fontFamily: 'var(--font-sans)' }}>
          💡 <strong>DI CHUỘT</strong> vào từ có gạch chân <span style={{ color: '#FFD700', fontWeight: 'bold' }}>VÀNG RỐM</span> để xem phân tích chi tiết!
        </p>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
