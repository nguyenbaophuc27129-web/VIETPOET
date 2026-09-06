/**
 * HomePage Component
 * Trang chủ với Hero Section, Cards và Problem/Solution Framework
 */
import React from 'react';

interface HomePageProps {
  poems: any[];
  loading: boolean;
}

export default function HomePage({ poems, loading }: HomePageProps) {
  return (
    <div className="home-page max-w-7xl mx-auto px-6 py-12">
      {/* Hero Section - Trang trọng phong cách Cung đình */}
      <section className="relative mb-16 p-12 rounded-2xl royal-border paper-texture"
        style={{
          background: 'linear-gradient(135deg, var(--paper-light) 0%, var(--background) 100%)'
        }}>
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10"
          style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)' }}>
        </div>

        <div className="text-center relative z-10">
          {/* Royal Badge */}
          <div className="inline-block mb-6 px-6 py-2 rounded-full"
            style={{ background: 'var(--primary)', color: 'white' }}>
            <span className="text-sm font-bold tracking-wide">TRƯỜNG TRUNG HỌC PHỔ THÔNG DƯƠNG VĂN THÌ</span>
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-6xl font-bold mb-6 royal-title"
            style={{
              fontFamily: 'var(--font-serif)',
              color: 'var(--ink-dark)',
              textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
            }}>
            HỌC TẬP NGỮ VĂN
            <br />
            <span style={{ color: 'var(--primary)' }}>BẰNG TRÍ TUỆ NHÂN TẠO</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl mb-8 max-w-3xl mx-auto poetry-text"
            style={{ color: 'var(--foreground)', opacity: 0.8 }}>
            Nền tảng học tập số tiên phong, học tập thơ ca Việt Nam
            qua công nghệ AI, bằng lộ trình cụ thể và thúc đẩy ứng dụng đa môi trường.
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('navigate-ai'))}
              className="px-8 py-3 rounded-lg font-bold text-white royal-shadow transition-all hover:scale-105"
              style={{ background: 'var(--primary)', fontFamily: 'var(--font-sans)' }}
            >
              🤖 Bắt Đầu Học Cùng VIET-POET AI
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('navigate-practice'))}
              className="px-8 py-3 rounded-lg font-bold transition-all hover:scale-105"
              style={{
                background: 'transparent',
                border: `2px solid var(--accent)`,
                color: 'var(--accent)',
                fontFamily: 'var(--font-sans)'
              }}
            >
              📝 Luyện Tập cùng VIET-POET EXAM
            </button>
          </div>
        </div>
      </section>

      {/* Three Feature Cards */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12 royal-title"
          style={{ color: 'var(--ink-dark)' }}>
          TÍNH NĂNG NỔI BẬT
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Card 1: Hướng Dẫn */}
          <div className="p-8 rounded-xl royal-border paper-texture hover:scale-105 transition-transform">
            <div className="text-5xl mb-4 text-center">📖</div>
            <h3 className="text-xl font-bold mb-4 royal-title text-center" style={{ color: 'var(--primary)' }}>
              Hướng Dẫn Sử Dụng
            </h3>
            <ul className="space-y-3 text-sm" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
              <li>🔍 <strong>Poetry X-Ray:</strong> Rê chuột vào từ ngữ để phân tích nghệ thuật</li>
              <li>🗺️ <strong>Mindmap:</strong> Xem sơ đồ tư duy tự động từ dữ liệu</li>
              <li>🤖 <strong>AI Chat:</strong> Hỏi đáp bằng giọng nói hoặc văn bản</li>
              <li>📝 <strong>Luyện tập:</strong> Chấm điểm tự động với phản hồi chi tiết</li>
            </ul>
          </div>

          {/* Card 2: Giới Thiệu */}
          <div className="p-8 rounded-xl royal-border paper-texture hover:scale-105 transition-transform">
            <div className="text-5xl mb-4 text-center">🎭</div>
            <h3 className="text-xl font-bold mb-4 royal-title text-center" style={{ color: 'var(--primary)' }}>
              Giới Thiệu Dự Án
            </h3>
            <ul className="space-y-3 text-sm" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
              <li>✨ Nền tảng <strong>Học tập số</strong> tiên phong </li>
              <li>⚡ Tích hợp <strong>Intel OpenVINO</strong> tăng tốc AI</li>
              <li>🧠 Phương pháp <strong>rõ ràng</strong> kích thích tư duy</li>
              <li>🌐 Hoạt động <strong>100% offline</strong> khi không có mạng</li>
            </ul>
          </div>

          {/* Card 3: Sứ Mệnh */}
          <div className="p-8 rounded-xl royal-border paper-texture hover:scale-105 transition-transform">
            <div className="text-5xl mb-4 text-center">🎯</div>
            <h3 className="text-xl font-bold mb-4 royal-title text-center" style={{ color: 'var(--primary)' }}>
              Sứ Mệnh & Tầm Nhìn
            </h3>
            <ul className="space-y-3 text-sm" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
              <li>🚫 Hỗ trợ học tập môn Ngữ Văn dễ dàng hơn<strong> Đặc biệt trong mảng Thơ Ca </strong> Học tập có hệ thống rõ ràng</li>
              <li>⚖️ Thúc đẩy <strong>tăng cường chất lượng học tập môn Ngữ Văn</strong> (SDG 4)</li>
              <li>🌱 <strong>SDG 10:</strong> Triển khai dễ dàng ở đa môi trường</li>
              <li>💚 Bảo tồn di sản thơ ca Việt Nam</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Problem & Solution Framework */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12 royal-title"
          style={{ color: 'var(--ink-dark)' }}>
          KHUNG VẤN ĐỀ & GIẢI PHÁP
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Problem */}
          <div className="p-8 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE 100%)',
              border: `2px solid var(--primary)`
            }}>
            <h3 className="text-2xl font-bold mb-6 royal-title flex items-center gap-3"
              style={{ color: 'var(--primary)' }}>
              <span className="text-3xl">❌</span>
              VẤN ĐỀ HIỆN TẠI
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="text-2xl" style={{ color: 'var(--primary)' }}>70%</span>
                <div>
                  <strong>Học sinh học vẹt</strong>
                  <p className="text-sm opacity-70">Ghi nhớ máy móc, không hiểu ý nghĩa</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl" style={{ color: 'var(--primary)' }}>🤖</span>
                <div>
                  <strong>AI hay ảo giác, cổ xúy gian lận</strong>
                  <p className="text-sm opacity-70">Công cụ thông thường không đảm bảo chính xác</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl" style={{ color: 'var(--primary)' }}>40%</span>
                <div>
                  <strong>Học sinh vùng cao thiếu mạng</strong>
                  <p className="text-sm opacity-70">Không tiếp cận được công nghệ AI</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Solution */}
          <div className="p-8 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
              border: `2px solid #10B981`
            }}>
            <h3 className="text-2xl font-bold mb-6 royal-title flex items-center gap-3"
              style={{ color: '#10B981' }}>
              <span className="text-3xl">✅</span>
              GIẢI PHÁP VIET-POET-ALYZER
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="text-2xl">🔍</span>
                <div>
                  <strong>RAG + OpenVINO Edge AI</strong>
                  <p className="text-sm opacity-70">Chạy 100% offline, chính xác theo giáo án</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <strong>Gia sư Socratic</strong>
                  <p className="text-sm opacity-70">Hỏi gợi mở, kích thích tự chủ tư duy</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">🌐</span>
                <div>
                  <strong>Hybrid Cloud + Edge</strong>
                  <p className="text-sm opacity-70">Vừa online vừa offline, linh hoạt mọi hoàn cảnh</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="text-center p-12 rounded-xl royal-border"
        style={{ background: 'var(--paper-light)' }}>
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="text-4xl font-bold mb-2" style={{ color: 'var(--primary)', fontFamily: 'var(--font-serif)' }}>
              {poems.length}+
            </div>
            <div className="text-sm opacity-70">Bài thơ đã phân tích</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2" style={{ color: 'var(--primary)', fontFamily: 'var(--font-serif)' }}>
              10+
            </div>
            <div className="text-sm opacity-70">Đề luyện thi</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2" style={{ color: 'var(--primary)', fontFamily: 'var(--font-serif)' }}>
              95%+
            </div>
            <div className="text-sm opacity-70">Độ chính xác AI</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2" style={{ color: 'var(--primary)', fontFamily: 'var(--font-serif)' }}>
              4x
            </div>
            <div className="text-sm opacity-70">Nhanh hơn với Intel NPU</div>
          </div>
        </div>
      </section>
    </div>
  );
}