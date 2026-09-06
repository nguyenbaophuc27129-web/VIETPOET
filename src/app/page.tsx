/**
 * VIET-POET-ALYZER Main Application
 * Vietnamese Royal Court Style - Digital Heritage
 * 3-Page Navigation System
 */
'use client';

import { useState, useEffect } from 'react';

// Page Types
type PageType = 'home' | 'ai-tutor' | 'practice';

// Page Content Components
import HomePage from '@/components/pages/HomePage';
import AITutorPage from '@/components/pages/AITutorPage';
import PracticePage from '@/components/pages/PracticePage';

// Import data loaders
import { initializeData, getAllPoems, type PoemData } from '@/lib/dataLoader';

export default function VietPoetAlyzer() {
  const [activePage, setActivePage] = useState<PageType>('home');
  const [poems, setPoems] = useState<PoemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Handle custom navigation events from HomePage
  useEffect(() => {
    const handleNavigateAI = () => setActivePage('ai-tutor');
    const handleNavigatePractice = () => setActivePage('practice');

    window.addEventListener('navigate-ai', handleNavigateAI);
    window.addEventListener('navigate-practice', handleNavigatePractice);

    return () => {
      window.removeEventListener('navigate-ai', handleNavigateAI);
      window.removeEventListener('navigate-practice', handleNavigatePractice);
    };
  }, []);

  useEffect(() => {
    setMounted(true);
    initializeData().then(() => {
      const allPoems = getAllPoems();
      setPoems(allPoems);
      setLoading(false);
    });
  }, []);

  // Prevent hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <img
            src="/logo.png"
            alt="VIET-POET-ALYZER"
            className="w-20 h-20 mx-auto mb-4 rounded-lg animate-pulse royal-border"
            style={{ objectFit: 'contain', backgroundColor: 'white' }}
          />
          <p className="text-xl" style={{ fontFamily: 'var(--font-serif)' }}>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="viet-poet-alyzer min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Vietnamese Royal Court Header */}
      <header className="sticky top-0 z-50 shadow-lg royal-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Royal Logo */}
            <div className="flex items-center gap-4">
              <img
                src="/logo.png"
                alt="VIET-POET-ALYZER"
                className="w-12 h-12 rounded-lg royal-border"
                style={{ objectFit: 'contain', backgroundColor: 'white' }}
              />
              <div>
                <h1
                  className="text-2xl font-bold tracking-wide royal-title"
                  style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-dark)' }}
                >
                  VIET-POET-ALYZER
                </h1>
                <p className="text-sm" style={{ color: 'var(--accent)', fontFamily: 'var(--font-sans)' }}>
                  HỌC TẬP SỐ • THƠ CA VIỆT NAM • CÔNG NGHỆ AI
                </p>
              </div>
            </div>

            {/* Royal Navigation */}
            <nav className="flex gap-2">
              {[
                { id: 'home', label: 'TRANG CHỦ', icon: '🏛️' },
                { id: 'ai-tutor', label: 'VIET-POET AI', icon: '🤖' },
                { id: 'practice', label: 'VIET-POET EXAM', icon: '📝' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id as PageType)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    activePage === item.id
                      ? 'bg-royal-red text-white royal-shadow'
                      : 'hover:bg-opacity-80 hover:bg-royal-gold'
                  }`}
                  style={{
                    fontFamily: 'var(--font-sans)',
                    ...(activePage === item.id ? {} : { border: '1px solid var(--accent)' })
                  }}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Intel Badge */}
            <div className="flex items-center">
              <span className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: 'var(--accent)', color: 'var(--ink-dark)' }}>
                Intel® AI
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="paper-texture">
        {activePage === 'home' && <HomePage poems={poems} loading={loading} />}
        {activePage === 'ai-tutor' && <AITutorPage poems={poems} loading={loading} />}
        {activePage === 'practice' && <PracticePage poems={poems} loading={loading} />}
      </main>

      {/* Vietnamese Royal Footer */}
      <footer className="mt-16 py-12" style={{
        background: 'linear-gradient(to top, var(--ink-dark), #2D2D2D)',
        color: 'var(--paper-light)',
        borderTop: `3px solid var(--accent)`
      }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-lg font-bold mb-4 royal-title">VIET-POET-ALYZER</h4>
              <p className="text-sm opacity-80">
                Nền tảng học tập số, học tập và phát triển thơ ca Việt Nam
                thông qua công nghệ AI hiện đại.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-4 royal-title">Công Nghệ</h4>
              <ul className="text-sm space-y-2 opacity-80">
                <li>Intel® OpenVINO™ GenAI</li>
                <li>Qwen2.5 LLM</li>
                <li>Vietnamese-SBERT</li>
                <li>ChromaDB</li>
                <li>RAG + Socratic Method</li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-4 royal-title">SDGs</h4>
              <div className="flex gap-3">
                <div className="px-3 py-2 rounded text-center" style={{ background: 'var(--primary)' }}>
                  <div className="text-xl font-bold">4</div>
                  <div className="text-xs">Giáo dục</div>
                </div>
                <div className="px-3 py-2 rounded text-center" style={{ background: 'var(--primary)' }}>
                  <div className="text-xl font-bold">10</div>
                  <div className="text-xs">Bình đẳng</div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-4 royal-title">Liên Hệ</h4>
              <ul className="text-sm space-y-2 opacity-80">
                <li>📧 support@vietpoet.edu.vn</li>
                <li>🌐 vietpoet.edu.vn</li>
                <li>📱 Zalo: 1900-XXXX</li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-sm opacity-60" style={{ borderColor: 'rgba(197, 160, 89, 0.3)' }}>
            <p>© 2026 VIET-POET-ALYZER | Nền tảng học tập số</p>
            <p className="mt-2">Powered by VIET-POET TEAM • HỌC TẬP SỐ • THƠ CA VIỆT NAM</p>
          </div>
        </div>
      </footer>
    </div>
  );
}