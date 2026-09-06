/**
 * VIET-POET EXAM Component
 * Practice tests with AI-powered feedback
 */
'use client';

import React, { useState, useEffect } from 'react';

interface PracticeTest {
  test_id: string;
  grade_level: string;
  semester: string;
  questions: PracticeQuestion[];
}

interface PracticeQuestion {
  question_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'essay' | 'analysis';
  options?: string[];
  correct_answer: string | string[];
  explanation: string;
  related_poem?: string;
  keywords?: string[]; // Từ khóa cần có cho bài tự luận
  rubric_points?: string[]; // Tiêu chí chấm điểm
}

interface UserAnswer {
  question_id: string;
  answer: string | string[];
  isCorrect: boolean;
}

export default function PracticeExam() {
  const [tests, setTests] = useState<PracticeTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<PracticeTest | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState('10');

  useEffect(() => {
    loadTests();
  }, [selectedGrade]);

  const loadTests = async () => {
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
        const response = await fetch(file);
        if (response.ok) {
          const data = await response.json();
          loadedTests.push(data);
        }
      }

      setTests(loadedTests);
      if (loadedTests.length > 0) {
        setSelectedTest(loadedTests[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading tests:', error);
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answer: string | string[]) => {
    const question = selectedTest?.questions.find(q => q.question_id === questionId);
    if (!question) return;

    let isCorrect = false;
    if (Array.isArray(question.correct_answer)) {
      isCorrect = Array.isArray(answer) &&
        answer.length === question.correct_answer.length &&
        answer.every(a => question.correct_answer.includes(a));
    } else {
      isCorrect = answer === question.correct_answer;
    }

    setUserAnswers(prev => {
      const existing = prev.findIndex(a => a.question_id === questionId);
      if (existing >= 0) {
        const newAnswers = [...prev];
        newAnswers[existing] = { question_id: questionId, answer, isCorrect };
        return newAnswers;
      }
      return [...prev, { question_id: questionId, answer, isCorrect }];
    });
  };

  const calculateScore = () => {
    if (!selectedTest) return 0;

    let totalPoints = 0;
    let earnedPoints = 0;

    selectedTest.questions.forEach(question => {
      const answer = userAnswers.find(a => a.question_id === question.question_id);

      if (question.question_type === 'multiple_choice') {
        // Multiple choice: 1 point if correct
        totalPoints += 1;
        if (answer?.isCorrect) {
          earnedPoints += 1;
        }
      } else {
        // Essay/analysis: Score based on keywords found
        totalPoints += 1;
        if (answer?.answer && question.keywords) {
          const answerText = (answer.answer as string).toLowerCase();
          const foundKeywords = question.keywords.filter(keyword =>
            answerText.includes(keyword.toLowerCase())
          );
          // Points based on percentage of keywords found (at least 50% for passing)
          const keywordPercentage = foundKeywords.length / question.keywords.length;
          if (keywordPercentage >= 0.5) {
            earnedPoints += 1;
          }
        }
      }
    });

    return Math.round((earnedPoints / totalPoints) * 100);
  };

  const resetExam = () => {
    setUserAnswers([]);
    setCurrentQuestionIndex(0);
    setShowResults(false);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse">Đang tải đề thi...</div>
      </div>
    );
  }

  if (!selectedTest) {
    return (
      <div className="text-center py-12">
        <div className="text-xl mb-4">Không tìm thấy đề thi</div>
        <p className="text-gray-600">Vui lòng kiểm tra lại file practice_data</p>
      </div>
    );
  }

  const currentQuestion = selectedTest.questions[currentQuestionIndex];
  const userAnswer = userAnswers.find(a => a.question_id === currentQuestion.question_id);

  return (
    <div className="practice-exam">
      {/* Test Selector */}
      <div className="mb-6 p-4 rounded-lg" style={{ background: 'white', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="font-semibold">Lớp:</label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="border rounded px-3 py-2 bg-white"
            >
              <option value="10">Lớp 10</option>
              <option value="11">Lớp 11</option>
            </select>
          </div>

          <div className="flex items-center gap-2 flex-1">
            <label className="font-semibold">Đề thi:</label>
            <select
              value={selectedTest.test_id}
              onChange={(e) => {
                const test = tests.find(t => t.test_id === e.target.value);
                if (test) {
                  setSelectedTest(test);
                  resetExam();
                }
              }}
              className="border rounded px-3 py-2 flex-1 bg-white"
            >
              {tests.map((test, index) => (
                <option key={test.test_id} value={test.test_id}>
                  Đề {index + 1} - {test.grade_level === '10' ? 'Lớp 10' : 'Lớp 11'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span>Câu hỏi {currentQuestionIndex + 1}/{selectedTest.questions.length}</span>
          <span>Đã trả lời: {userAnswers.length}/{selectedTest.questions.length}</span>
        </div>
        <div className="w-full h-2 rounded-full bg-gray-200">
          <div
            className="h-full rounded-full transition-all bg-blue-600"
            style={{ width: `${((currentQuestionIndex + 1) / selectedTest.questions.length) * 100}%` }}
          />
        </div>
      </div>

      {!showResults ? (
        <>
          {/* Question */}
          <div className="mb-6 p-6 rounded-lg" style={{ background: 'white', border: '1px solid var(--border)' }}>
            <div className="mb-4">
              <span className="text-sm px-2 py-1 rounded bg-purple-100 text-purple-700">
                {currentQuestion.question_type === 'multiple_choice' ? 'Trắc nghiệm' :
                 currentQuestion.question_type === 'essay' ? 'Tự luận' : 'Phân tích'}
              </span>
            </div>
            <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-serif)' }}>
              {currentQuestion.question_text}
            </h3>

            {/* Multiple Choice Options */}
            {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <label
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      userAnswer?.answer === option
                        ? 'bg-blue-50 border-blue-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={currentQuestion.question_id}
                      value={option}
                      checked={userAnswer?.answer === option}
                      onChange={(e) => handleAnswerSelect(currentQuestion.question_id, e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Essay Input */}
            {(currentQuestion.question_type === 'essay' || currentQuestion.question_type === 'analysis') && (
              <textarea
                value={userAnswer?.answer as string || ''}
                onChange={(e) => handleAnswerSelect(currentQuestion.question_id, e.target.value)}
                placeholder="Nhập câu trả lời của bạn..."
                className="w-full p-3 border rounded-lg min-h-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              ← Câu trước
            </button>

            {currentQuestionIndex < selectedTest.questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
              >
                Câu tiếp →
              </button>
            ) : (
              <button
                onClick={() => setShowResults(true)}
                className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white"
              >
                Xem kết quả
              </button>
            )}
          </div>
        </>
      ) : (
        /* Results */
        <div>
          <div className="text-center mb-8 p-6 rounded-lg" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-serif)' }}>Kết Quả Thi Đánh Giá</h2>
            <div className="text-5xl font-bold">{calculateScore()}%</div>
            <p className="mt-2">
              Trắc nghiệm đúng: {userAnswers.filter(a => {
                const q = selectedTest?.questions.find(q => q.question_id === a.question_id);
                return q?.question_type === 'multiple_choice' && a.isCorrect;
              }).length}/{selectedTest?.questions.filter(q => q.question_type === 'multiple_choice').length || 0}
              {' | '}
              Tự luận đạt yêu cầu: {userAnswers.filter(a => {
                const q = selectedTest?.questions.find(q => q.question_id === a.question_id);
                if (q?.question_type !== 'multiple_choice' && q?.keywords && a?.answer) {
                  const answerText = (a.answer as string).toLowerCase();
                  const foundKeywords = q.keywords.filter(k => answerText.includes(k.toLowerCase()));
                  return foundKeywords.length >= q.keywords.length * 0.5;
                }
                return false;
              }).length}/{selectedTest?.questions.filter(q => q.question_type !== 'multiple_choice').length || 0}
            </p>
            <p className="text-sm opacity-75 mt-2">
              [GOI Y] Bai tu luan cham theo rubric va tu khoa, khong hien thi dap an mau
            </p>
          </div>

          {/* Detailed Results */}
          <div className="space-y-4">
            {selectedTest.questions.map((question, index) => {
              const answer = userAnswers.find(a => a.question_id === question.question_id);

              // For essay/analysis, check if keywords are present
              let hasKeywords = false;
              let foundKeywords: string[] = [];
              if ((question.question_type === 'essay' || question.question_type === 'analysis') && answer?.answer) {
                const answerText = (answer.answer as string).toLowerCase();
                foundKeywords = (question.keywords || []).filter(keyword =>
                  answerText.includes(keyword.toLowerCase())
                );
                hasKeywords = foundKeywords.length >= (question.keywords?.length || 0) * 0.5; // At least 50% of keywords
              }

              return (
                <div
                  key={question.question_id}
                  className={`p-4 rounded-lg border ${
                    question.question_type === 'multiple_choice'
                      ? (answer?.isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50')
                      : (hasKeywords ? 'border-yellow-500 bg-yellow-50' : 'border-gray-300 bg-gray-50')
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      question.question_type === 'multiple_choice'
                        ? (answer?.isCorrect ? 'bg-green-500' : 'bg-red-500')
                        : (hasKeywords ? 'bg-yellow-500' : 'bg-gray-400')
                    } text-white text-sm`}>
                      {question.question_type === 'multiple_choice'
                        ? (answer?.isCorrect ? '[DUNG]' : '[SAI]')
                        : (hasKeywords ? '[DAP YEAU CAU]' : '[CHUA DAP]')}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium mb-2">
                        Câu {index + 1}: {question.question_text}
                        <span className={`ml-2 text-xs px-2 py-1 rounded ${
                          question.question_type === 'multiple_choice' ? 'bg-purple-100 text-purple-700' :
                          question.question_type === 'essay' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {question.question_type === 'multiple_choice' ? 'Trắc nghiệm' :
                           question.question_type === 'essay' ? 'Tự luận' : 'Phân tích'}
                        </span>
                      </p>

                      <p className="text-sm text-gray-600 mb-2">
                        Bạn trả lời: {answer?.answer as string || '(chưa trả lời)'}
                      </p>

                      {/* For multiple choice: show correct answer (if wrong) */}
                      {question.question_type === 'multiple_choice' && !answer?.isCorrect && (
                        <p className="text-sm text-green-700 mb-2 p-2 bg-white rounded">
                          Đáp án đúng: {Array.isArray(question.correct_answer) ? question.correct_answer.join(', ') : question.correct_answer}
                        </p>
                      )}

                      {/* For essay/analysis: show keywords (NOT full answer) */}
                      {(question.question_type === 'essay' || question.question_type === 'analysis') && (
                        <div className="mb-2 p-2 bg-white rounded">
                          <p className="text-sm font-medium text-blue-700 mb-1">
                            [TU KHOA] Tu khoa nen co ({question.keywords?.length || 0} tu):
                          </p>
                          <p className="text-sm text-gray-700">
                            {question.keywords && question.keywords.map((keyword, i) => {
                              const isFound = foundKeywords.includes(keyword);
                              return (
                                <span
                                  key={i}
                                  className={`inline-block px-2 py-1 m-1 rounded ${
                                    isFound ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                  }`}
                                >
                                  {isFound ? '[CO] ' : '[THIEU] '}{keyword}
                                </span>
                              );
                            })}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Đã có: {foundKeywords.length}/{question.keywords?.length || 0} từ khóa
                          </p>
                        </div>
                      )}

                      {/* Rubric-based grading for essay/analysis */}
                      {question.question_type !== 'multiple_choice' && question.rubric_points && (
                        <div className="mb-2 p-2 bg-white rounded">
                          <p className="text-sm font-medium text-purple-700 mb-1">
                            [TIEU CHI] Tieu chi cham:
                          </p>
                          <ul className="text-sm text-gray-700 list-disc list-inside">
                            {question.rubric_points.map((point, i) => (
                              <li key={i}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <p className="text-sm text-gray-700 mt-2 p-2 bg-white rounded">
                        <strong>Gợi ý:</strong> {question.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={resetExam}
            className="w-full mt-6 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            Làm lại
          </button>
        </div>
      )}
    </div>
  );
}