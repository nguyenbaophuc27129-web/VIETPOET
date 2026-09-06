/**
 * Practice Page Component - Simple working version
 * VIET-POET TEST/PRACTICE with Reading & Writing sections
 */
import React, { useState, useEffect } from 'react';

interface PracticePageProps {
  poems: any[];
  loading: boolean;
}

type StepType = 'selection' | 'exam';
type SectionType = 'reading' | 'writing';

interface PracticeQuestion {
  question_id: string;
  question_text: string;
  max_score: number;
  detailed_rubric: string[];
  barem_keywords: string[];
}

interface PracticeTest {
  test_id: string;
  test_title: string;
  reading_section: {
    passage: string;
    questions: PracticeQuestion[];
  };
  writing_section: {
    prompt: string;
    questions: PracticeQuestion[];
  };
}

export default function PracticePage({ poems, loading }: PracticePageProps) {
  const [step, setStep] = useState<StepType>('selection');
  const [selectedGrade, setSelectedGrade] = useState('10');
  const [selectedSection, setSelectedSection] = useState<SectionType>('reading');
  const [selectedTest, setSelectedTest] = useState<number>(0);
  const [tests, setTests] = useState<PracticeTest[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [gradingResult, setGradingResult] = useState<any>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [isLoadingTests, setIsLoadingTests] = useState(false);

  useEffect(() => {
    loadTests();
  }, [selectedGrade, selectedSection]);

  const loadTests = async () => {
    setIsLoadingTests(true);
    try {
      const grade = selectedGrade === '10' ? 'L10' : 'L11';
      const testFiles = [
        `/practice_data/de_01_${grade}.json`,
        `/practice_data/de_02_${grade}.json`,
        `/practice_data/de_03_${grade}.json`,
        `/practice_data/de_04_${grade}.json`,
        `/practice_data/de_05_${grade}.json`
      ];

      const loadedTests: PracticeTest[] = [];
      for (const file of testFiles) {
        try {
          const response = await fetch(file);
          if (response.ok) {
            const data = await response.json();
            if (data.reading_section && data.writing_section) {
              loadedTests.push(data);
            }
          }
        } catch (e) {
          console.warn(`Failed to load ${file}:`, e);
        }
      }

      setTests(loadedTests);
      if (loadedTests.length > 0) {
        setSelectedTest(0);
      }
    } catch (error) {
      console.error('Error loading tests:', error);
    } finally {
      setIsLoadingTests(false);
    }
  };

  const handleStartExam = () => {
    if (tests.length > 0) {
      setStep('exam');
      setUserAnswers({});
      setGradingResult(null);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitForGrading = () => {
    setIsGrading(true);

    try {
      const test = tests[selectedTest];
      if (!test) return;

      const questions = selectedSection === 'reading'
        ? test.reading_section.questions
        : test.writing_section.questions;

      let correctCount = 0;
      const feedbackParts: string[] = [];

      for (const question of questions) {
        const userAnswer = userAnswers[question.question_id] || '';
        const userAnswerText = userAnswer.toLowerCase();
        const keywords = question.barem_keywords || [];

        const matchedKeywords = keywords.filter((keyword: string) =>
          userAnswerText.includes(keyword.toLowerCase())
        );

        const keywordMatchRate = keywords.length > 0 ? matchedKeywords.length / keywords.length : 0;
        const isCorrect = keywordMatchRate >= 0.5;

        if (isCorrect) {
          correctCount++;
          feedbackParts.push(`✅ Câu ${question.question_id}: Đúng. ${question.detailed_rubric?.[0] || ''}`);
        } else {
          const missingList = keywords.filter((k: string) => !userAnswerText.includes(k.toLowerCase())).join(', ');
          feedbackParts.push(`❌ Câu ${question.question_id}: Thiếu: ${missingList}. ${question.detailed_rubric?.[0] || ''}`);
        }
      }

      const score = Math.round((correctCount / questions.length) * 100);

      let feedback = `BÀI LÀM CỦA BẠN - ${test.test_id.toUpperCase()}\n\n`;
      feedback += `Điểm số: ${score}/100 (${correctCount}/${questions.length} câu đúng)\n\n`;
      feedback += feedbackParts.join('\n\n');

      if (score >= 80) {
        feedback += `\n\n[TUYET VOI] Ban da hieu bai rat tot.`;
      } else if (score >= 60) {
        feedback += `\n\n[KHA TOT] Hay xem lai cac cau sai.`;
      } else {
        feedback += `\n\n[CAN CO GANG] Hay doc lai bai van.`;
      }

      setGradingResult({
        score,
        total_questions: questions.length,
        correct_count: correctCount,
        feedback
      });
    } catch (error) {
      console.error('Grading error:', error);
      setGradingResult({
        score: 0,
        total_questions: 0,
        correct_count: 0,
        feedback: 'Có lỗi xảy ra khi chấm bài.'
      });
    } finally {
      setIsGrading(false);
    }
  };

  if (loading || isLoadingTests) {
    return (
      <div className="text-center py-32">
        <div className="text-6xl mb-4 animate-pulse">📝</div>
        <p className="text-xl royal-title">Đang tải đề thi...</p>
      </div>
    );
  }

  return (
    <div className="practice-page max-w-6xl mx-auto px-6 py-12">
      {step === 'selection' ? (
        <div className="selection-step">
          <h2 className="text-4xl font-bold text-center mb-12 royal-title" style={{ color: 'var(--ink-dark)' }}>
            CHỌN ĐỀ LUYỆN THI
          </h2>

          <div className="max-w-4xl mx-auto">
            {/* Grade Selection */}
            <div className="p-6 rounded-xl royal-border paper-texture mb-8">
              <label className="block text-lg font-bold mb-4 royal-title" style={{ color: 'var(--primary)' }}>
                📚 LỚP HỌC
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

            {/* Section Selection */}
            <div className="p-6 rounded-xl royal-border paper-texture mb-8">
              <label className="block text-lg font-bold mb-4 royal-title" style={{ color: 'var(--primary)' }}>
                📖 PHẦN THI
              </label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'reading', label: '📖 Đọc Hiểu Văn Bản', desc: 'Đọc và trả lời câu hỏi' },
                  { id: 'writing', label: '✍️ Viết Văn', desc: 'Làm văn theo đề bài' }
                ].map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setSelectedSection(section.id as SectionType)}
                    className={`p-6 rounded-lg transition-all text-left ${
                      selectedSection === section.id
                        ? 'bg-royal-red text-white royal-shadow'
                        : 'hover:bg-opacity-80 hover:bg-royal-gold'
                    }`}
                    style={{
                      ...(selectedSection !== section.id ? { border: `1px solid var(--accent)` } : {}),
                      fontFamily: 'var(--font-sans)'
                    }}
                  >
                    <div className="font-bold text-lg mb-2">{section.label}</div>
                    <div className="text-sm opacity-80">{section.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Test Selection */}
            <div className="p-6 rounded-xl royal-border paper-texture mb-8">
              <label className="block text-lg font-bold mb-4 royal-title" style={{ color: 'var(--primary)' }}>
                📝 CHỌN ĐỀ ({tests.length} đề)
              </label>
              <div className="grid md:grid-cols-5 gap-4">
                {tests.map((test, index) => (
                  <button
                    key={test.test_id}
                    onClick={() => setSelectedTest(index)}
                    className={`p-4 rounded-lg transition-all ${
                      selectedTest === index
                        ? 'bg-royal-red text-white royal-shadow'
                        : 'hover:bg-opacity-80 hover:bg-royal-gold'
                    }`}
                    style={{
                      ...(selectedTest !== index ? { border: `1px solid var(--accent)` } : {}),
                      fontFamily: 'var(--font-sans)'
                    }}
                  >
                    <div className="font-bold text-sm">Đề {index + 1}</div>
                    <div className="text-xs opacity-70">Lớp {selectedGrade}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <div className="text-center">
              <button
                onClick={handleStartExam}
                disabled={tests.length === 0}
                className="px-12 py-4 rounded-xl font-bold text-white royal-shadow transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, var(--primary) 0%, #B84E4E 100%)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '1.2rem'
                }}
              >
                {tests.length === 0 ? 'Không có đề thi' : 'BẮT ĐẦU LÀM BÀI 🚀'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="exam-step">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setStep('selection')}
              className="px-4 py-2 rounded-lg font-bold"
              style={{ border: `1px solid var(--accent)`, fontFamily: 'var(--font-sans)' }}
            >
              ← Quay lại
            </button>
            <h2 className="text-2xl font-bold royal-title" style={{ color: 'var(--ink-dark)' }}>
              {tests[selectedTest]?.test_id.toUpperCase()} - {selectedSection === 'reading' ? 'ĐỌC HIỂU' : 'VIẾT VĂN'}
            </h2>
          </div>

          {gradingResult ? (
            <div className="max-w-4xl mx-auto">
              <div className="p-8 rounded-xl royal-border paper-texture mb-8 text-center"
                style={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)' }}>
                <h3 className="text-3xl font-bold mb-6 royal-title" style={{ color: 'var(--primary)' }}>
                  🎊 KẾT QUẢ CHẤM ĐIỂM
                </h3>
                <div className="text-6xl font-bold mb-4" style={{ color: 'var(--primary)', fontFamily: 'var(--font-serif)' }}>
                  {gradingResult.score}%
                </div>
                <p className="text-lg mb-6">
                  Số câu đúng: {gradingResult.correct_count}/{gradingResult.total_questions}
                </p>
              </div>

              <div className="p-6 rounded-xl royal-border paper-texture">
                <h4 className="font-bold mb-4 royal-title" style={{ color: 'var(--primary)' }}>
                  📝 NHẬN XÉT CHI TIẾT:
                </h4>
                <div className="prose prose-sm max-w-none">
                  <p style={{ whiteSpace: 'pre-line', fontFamily: 'var(--font-sans)' }}>
                    {gradingResult.feedback}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 justify-center mt-8">
                <button
                  onClick={() => {
                    setGradingResult(null);
                    setUserAnswers({});
                  }}
                  className="px-8 py-3 rounded-lg font-bold"
                  style={{ background: 'transparent', border: `1px solid var(--accent)`, fontFamily: 'var(--font-sans)' }}
                >
                  Làm lại
                </button>
                <button
                  onClick={() => setStep('selection')}
                  className="px-8 py-3 rounded-lg font-bold text-white royal-shadow"
                  style={{ background: 'var(--primary)', fontFamily: 'var(--font-sans)' }}
                >
                  Chọn đề khác
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              {/* Progress */}
              <div className="mb-8 p-4 rounded-lg" style={{ background: 'var(--paper-light)', border: `1px solid var(--accent)` }}>
                <div className="flex justify-between mb-2">
                  <span>Tiến độ:</span>
                  <span>{Object.keys(userAnswers).length}/{tests[selectedTest]?.[selectedSection === 'reading' ? 'reading_section' : 'writing_section']?.questions?.length || 0} câu</span>
                </div>
                <div className="w-full h-3 rounded-full" style={{ background: '#E5E7EB' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(Object.keys(userAnswers).length / (tests[selectedTest]?.[selectedSection === 'reading' ? 'reading_section' : 'writing_section']?.questions?.length || 1)) * 100}%`,
                      background: 'var(--accent)'
                    }}
                  />
                </div>
              </div>

              {/* Reading Passage */}
              {selectedSection === 'reading' && tests[selectedTest]?.reading_section && (
                <div className="mb-8 p-6 rounded-xl royal-border paper-texture">
                  <h3 className="text-xl font-bold mb-4 royal-title" style={{ color: 'var(--primary)' }}>
                    📖 BÀI ĐỌC
                  </h3>
                  <div className="prose max-w-none" style={{ fontFamily: 'var(--font-serif)', lineHeight: '1.8' }}>
                    {tests[selectedTest].reading_section.passage}
                  </div>
                </div>
              )}

              {/* Writing Prompt */}
              {selectedSection === 'writing' && tests[selectedTest]?.writing_section && (
                <div className="mb-8 p-6 rounded-xl royal-border paper-texture">
                  <h3 className="text-xl font-bold mb-4 royal-title" style={{ color: 'var(--primary)' }}>
                    ✍️ ĐỀ BÀI VIẾT
                  </h3>
                  <div className="prose max-w-none" style={{ fontFamily: 'var(--font-serif)', lineHeight: '1.8' }}>
                    {tests[selectedTest].writing_section.prompt}
                  </div>
                </div>
              )}

              {/* Questions */}
              <div className="space-y-6 mb-8">
                {(tests[selectedTest]?.[selectedSection === 'reading' ? 'reading_section' : 'writing_section']?.questions || []).map((question, index) => (
                  <div key={question.question_id} className="p-6 rounded-xl royal-border paper-texture">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white" style={{ background: 'var(--primary)' }}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold mb-2" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem' }}>
                          {question.question_text}
                        </h4>
                        <p className="text-sm opacity-70 mb-2">{question.max_score} điểm</p>
                      </div>
                    </div>

                    <textarea
                      value={userAnswers[question.question_id] || ''}
                      onChange={(e) => handleAnswerChange(question.question_id, e.target.value)}
                      placeholder="Nhập câu trả lời của bạn vào đây..."
                      className="w-full p-4 rounded-lg min-h-[120px] focus:outline-none focus:ring-2"
                      style={{
                        borderColor: 'var(--accent)',
                        fontFamily: 'var(--font-sans)',
                        background: 'white'
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Submit Button */}
              <div className="text-center">
                <button
                  onClick={handleSubmitForGrading}
                  disabled={Object.keys(userAnswers).length === 0 || isGrading}
                  className="px-12 py-4 rounded-xl font-bold text-white royal-shadow transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '1.2rem'
                  }}
                >
                  {isGrading ? 'ĐANG CHAM...' : 'NOP BAI CHAM DIEM'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
