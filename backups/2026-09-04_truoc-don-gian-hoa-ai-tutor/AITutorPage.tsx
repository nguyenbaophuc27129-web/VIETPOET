/**
 * AITutorPage Component - Fixed Version
 * VIET-POET AI with proper state management
 */
import React, { useState, useEffect } from 'react';
import PoetryXRay from '@/components/PoetryXRay';
import AccurateMindmap from '@/components/AccurateMindmap';
import VoiceChat from '@/components/VoiceChat';
import GeospatialMap from '@/components/GeospatialMap';

interface AITutorPageProps {
  poems: any[];
  loading: boolean;
}

type StepType = 'selection' | 'learning';
type TabType = 'xray' | 'mindmap' | 'chat' | 'map';

export default function AITutorPage({ poems, loading }: AITutorPageProps) {
  const [step, setStep] = useState<StepType>('selection');
  const [activeTab, setActiveTab] = useState<TabType>('xray');
  const [selectedGrade, setSelectedGrade] = useState('10');
  const [selectedSemester, setSelectedSemester] = useState('hk1');
  const [selectedPoem, setSelectedPoem] = useState<any>(null);
  const [selectedSection, setSelectedSection] = useState(0);

  // Reset selected poem when grade or semester changes
  useEffect(() => {
    setSelectedPoem(null);
    setSelectedSection(0);
  }, [selectedGrade, selectedSemester]);

  // Filter poems by grade and semester
  const filteredPoems = poems.filter(poem => {
    // Use metadata if available
    if (poem.grade_level && poem.semester) {
      return poem.grade_level === selectedGrade && poem.semester === selectedSemester;
    }

    // Fallback: check document_id
    const hasGrade = poem.document_id?.includes(`lop${selectedGrade}`);
    const hasSemester = poem.document_id?.includes(selectedSemester);
    return hasGrade && hasSemester;
  });

  // Remove duplicates based on document_id + grade_level + semester
  const uniquePoems = Array.from(
    new Map(
      filteredPoems.map(poem => [
        `${poem.document_id}-${poem.grade_level}-${poem.semester}`,
        poem
      ])
    ).values()
  );

  const handleSelectPoem = (poem: any) => {
    setSelectedPoem(poem);
    setSelectedSection(0);
  };

  const handleEnterLearningSpace = () => {
    if (selectedPoem) {
      setStep('learning');
    }
  };

  const handleBackToSelection = () => {
    setStep('selection');
    setActiveTab('xray');
  };

  if (loading) {
    return (
      <div className="text-center py-32">
        <img
          src="/logo.png"
          alt="VIET-POET-ALYZER"
          className="w-20 h-20 mx-auto mb-4 rounded-lg animate-pulse royal-border"
          style={{ objectFit: 'contain', backgroundColor: 'white' }}
        />
        <p className="text-xl" style={{ fontFamily: 'var(--font-serif)' }}>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="ai-tutor-page max-w-7xl mx-auto px-6 py-12">
      {step === 'selection' ? (
        /* BƯỚC 1: Bộ lọc chọn bài */
        <div className="selection-step">
          <h2 className="text-4xl font-bold text-center mb-12 royal-title"
            style={{ color: 'var(--ink-dark)' }}>
            CHỌN BÀI THƠ ĐỂ HỌC TẬP
          </h2>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* Grade Selection */}
              <div className="p-6 rounded-xl royal-border paper-texture">
                <label className="block text-lg font-bold mb-4 royal-title" style={{ color: 'var(--primary)' }}>
                  📚 CHỌN LỚP HỌC:
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {['10', '11', '12'].map((grade) => (
                    <button
                      key={grade}
                      onClick={() => setSelectedGrade(grade)}
                      className={`p-4 rounded-lg font-bold transition-all ${
                        selectedGrade === grade
                          ? 'bg-royal-red text-white royal-shadow'
                          : 'hover:bg-opacity-80 hover:bg-royal-gold'
                      }`}
                      style={{
                        ...(selectedGrade !== grade ? { border: `1px solid var(--accent)` } : {}),
                        fontFamily: 'var(--font-sans)'
                      }}
                    >
                      Lớp {grade}
                    </button>
                  ))}
                </div>
              </div>

              {/* Semester Selection */}
              <div className="p-6 rounded-xl royal-border paper-texture">
                <label className="block text-lg font-bold mb-4 royal-title" style={{ color: 'var(--primary)' }}>
                  📖 CHỌN HỌC KỲ:
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {['hk1', 'hk2'].map((semester) => (
                    <button
                      key={semester}
                      onClick={() => setSelectedSemester(semester)}
                      className={`p-4 rounded-lg font-bold transition-all ${
                        selectedSemester === semester
                          ? 'bg-royal-red text-white royal-shadow'
                          : 'hover:bg-opacity-80 hover:bg-royal-gold'
                      }`}
                      style={{
                        ...(selectedSemester !== semester ? { border: `1px solid var(--accent)` } : {}),
                        fontFamily: 'var(--font-sans)'
                      }}
                    >
                      {semester === 'hk1' ? 'Học kỳ 1' : 'Học kỳ 2'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Poem Selection */}
            <div className="p-6 rounded-xl royal-border paper-texture mb-8">
              <label className="block text-lg font-bold mb-4 royal-title" style={{ color: 'var(--primary)' }}>
                📜 CHỌN BÀI THƠ ({uniquePoems.length} bài)
              </label>
              {uniquePoems.length > 0 ? (
                <div className="grid md:grid-cols-3 gap-4">
                  {uniquePoems.map((poem, index) => (
                    <button
                      key={`${poem.document_id}-${index}`}
                      onClick={() => handleSelectPoem(poem)}
                      className={`p-4 rounded-lg transition-all text-left ${
                        selectedPoem?.document_id === poem.document_id && selectedPoem?.grade_level === poem.grade_level && selectedPoem?.semester === poem.semester
                          ? 'bg-royal-red text-white royal-shadow'
                          : 'hover:bg-opacity-80 hover:bg-royal-gold'
                      }`}
                      style={{
                        ...(selectedPoem?.document_id !== poem.document_id ? { border: `1px solid var(--accent)` } : {}),
                        fontFamily: 'var(--font-sans)'
                      }}
                    >
                      <div className="font-bold text-sm">
                        {poem.document_id.replace(/_/g, ' ').toUpperCase()}
                      </div>
                      <div className="text-xs opacity-70 mt-1">
                        {poem.grade_level ? `Lớp ${poem.grade_level}` : ''}
                        {poem.semester ? ` • ${poem.semester.toUpperCase()}` : ''}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600">
                  <p className="text-lg">ĐANG TIẾP TỤC PHÁT TRIỂN</p>
                  <p className="text-sm mt-2">Vui lòng chọn lớp học và học kỳ khác</p>
                </div>
              )}
            </div>

            {/* Enter Button */}
            <div className="text-center">
              <button
                onClick={handleEnterLearningSpace}
                disabled={!selectedPoem}
                className="px-12 py-4 rounded-xl font-bold text-white royal-shadow transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, var(--primary) 0%, #B84E4E 100%)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '1.2rem'
                }}
              >
                VÀO KHÔNG GIAN HỌC TẬP 🚀
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* BƯỚC 2: Không gian học tập đa năng - 4 Tab */
        <div className="learning-step">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={handleBackToSelection}
              className="px-4 py-2 rounded-lg font-bold"
              style={{ border: `1px solid var(--accent)`, fontFamily: 'var(--font-sans)' }}
            >
              ← Quay lại chọn bài
            </button>
            <h2 className="text-2xl font-bold royal-title" style={{ color: 'var(--ink-dark)' }}>
              {selectedPoem?.document_id.replace(/_/g, ' ').toUpperCase()}
            </h2>
          </div>

          {/* Section Selector */}
          {selectedPoem?.detailed_analysis && selectedPoem.detailed_analysis.length > 1 && (
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
              {selectedPoem.detailed_analysis.map((_: any, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedSection(index)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                    selectedSection === index
                      ? 'bg-royal-red text-white royal-shadow'
                      : 'hover:bg-opacity-80 hover:bg-royal-gold'
                  }`}
                  style={{
                    ...(selectedSection !== index ? { border: `1px solid var(--accent)` } : {}),
                    fontFamily: 'var(--font-sans)'
                  }}
                >
                  Phân {index + 1}
                </button>
              ))}
            </div>
          )}

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="flex border-b-2" style={{ borderColor: 'var(--accent)' }}>
              {[
                { id: 'xray', label: '🔍 Poetry X-Ray', icon: '🔍' },
                { id: 'mindmap', label: '🗺️ Mindmap', icon: '🗺️' },
                { id: 'chat', label: '🤖 AI Chat', icon: '🤖' },
                { id: 'map', label: '🌏 Bản Đồ', icon: '🌏' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`px-6 py-3 font-bold transition-all relative ${
                    activeTab === tab.id
                      ? 'text-royal-red'
                      : 'text-gray-600 hover:text-royal-gold'
                  }`}
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-royal-red" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'xray' && selectedPoem && selectedPoem.detailed_analysis && selectedPoem.detailed_analysis[selectedSection] && (
              <div className="p-8 rounded-xl royal-border paper-texture">
                <h3 className="text-2xl font-bold mb-6 royal-title" style={{ color: 'var(--primary)' }}>
                  🔍 POETRY X-RAY - PHÂN TÍCH NGHỆ THUẬT
                </h3>
                <PoetryXRay
                  originalText={selectedPoem.detailed_analysis[selectedSection].original_text}
                  xRayData={selectedPoem.detailed_analysis[selectedSection].x_ray_data}
                />
                <div className="mt-6 p-4 rounded-lg" style={{ background: 'var(--paper-light)' }}>
                  <p className="text-sm italic opacity-70">
                    💡 <strong>Hướng dẫn:</strong> Di chuột vào từ ngữ có gạch chân vàng để xem giải thích chi tiết
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'mindmap' && selectedPoem && selectedPoem.detailed_analysis && selectedPoem.detailed_analysis[selectedSection] && (
              <div className="p-8 rounded-xl royal-border paper-texture">
                <h3 className="text-2xl font-bold mb-6 royal-title" style={{ color: 'var(--primary)' }}>
                  🗺️ SƠ ĐỒ TƯ DUY HỌC TẬP
                </h3>
                <AccurateMindmap
                  title={selectedPoem.detailed_analysis[selectedSection].section_name}
                  originalText={selectedPoem.detailed_analysis[selectedSection].original_text}
                  xRayData={selectedPoem.detailed_analysis[selectedSection].x_ray_data}
                  outline={selectedPoem.detailed_analysis[selectedSection].section_outline}
                />
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="p-8 rounded-xl royal-border paper-texture">
                    <h3 className="text-2xl font-bold mb-6 royal-title" style={{ color: 'var(--primary)' }}>
                      🤖 VIET-POET AI - GIA SƯ 2 CHIỀU
                    </h3>
                    <div className="p-6 rounded-lg mb-6" style={{ background: 'var(--paper-light)' }}>
                      <h4 className="font-bold mb-3" style={{ fontFamily: 'var(--font-serif)' }}>Phương pháp Socratic:</h4>
                      <ul className="space-y-2 text-sm">
                        <li>❌ AI sẽ <strong>KHÔNG</strong> viết văn mẫu cho bạn</li>
                        <li>❌ AI sẽ <strong>KHÔNG</strong> đưa ra đáp án trực tiếp</li>
                        <li>✅ AI sẽ đặt <strong>câu hỏi gợi mở</strong> giúp bạn tự suy nghĩ</li>
                        <li>✅ AI sẽ hướng dẫn bạn <strong>tự phát hiện</strong> vẻ đẹp thơ ca</li>
                      </ul>
                    </div>

                    <div className="p-6 rounded-lg" style={{ background: 'var(--paper-light)' }}>
                      <h4 className="font-bold mb-3" style={{ fontFamily: 'var(--font-serif)' }}>Cách sử dụng:</h4>
                      <div className="space-y-3 text-sm">
                        <div>🎤 <strong>Voice Input:</strong> Bấm Micro để nói bằng tiếng Việt</div>
                        <div>⌨️ <strong>Text Input:</strong> Gõ câu hỏi vào ô chat</div>
                        <div>🔊 <strong>Voice Output:</strong> Bấm Loa để AI đọc trả lời</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-1">
                  <div className="sticky top-4">
                    <VoiceChat
                      poemId={selectedPoem?.document_id}
                      sectionIndex={selectedSection}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'map' && (
              <div className="p-8 rounded-xl royal-border paper-texture">
                <h3 className="text-2xl font-bold mb-6 royal-title" style={{ color: 'var(--primary)' }}>
                  🌏 BẢN ĐỒ THI CA VIỆT NAM
                </h3>
                <GeospatialMap />
                <div className="mt-6 p-4 rounded-lg" style={{ background: 'var(--paper-light)' }}>
                  <p className="text-sm opacity-70">
                    💡 <strong>Hướng dẫn:</strong> Các điểm màu đỏ trên bản đồ đánh dấu địa danh xuất hiện trong thơ ca Việt Nam
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
