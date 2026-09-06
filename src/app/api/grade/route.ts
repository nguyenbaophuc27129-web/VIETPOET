/**
 * AI Grading API
 * Grades student essays and provides detailed feedback
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { test_id, answers } = await request.json();

    // Load test data
    const gradeMap: Record<string, string> = {
      '10': 'L10',
      '11': 'L11'
    };

    // Extract grade from test_id
    let grade = '10';
    for (const [num, code] of Object.entries(gradeMap)) {
      if (test_id.includes(code)) {
        grade = num;
        break;
      }
    }

    const testFile = `/practice_data/de_01_${gradeMap[grade]}.json`;
    const response = await fetch(testFile);

    if (!response.ok) {
      throw new Error('Failed to load test data');
    }

    const testData = await response.json();

    // Grade each answer
    let correctCount = 0;
    const keywordMatches: string[] = [];
    const missingKeywords: string[] = [];
    const feedbackParts: string[] = [];

    for (const answer of answers) {
      // Get questions from reading_section or direct questions
      const questions = testData.reading_section?.questions || testData.questions || [];
      const question = questions.find((q: any) => q.question_id === answer.question_id);
      if (!question) continue;

      // Check using barem_keywords approach
      let isCorrect = false;
      const userAnswerText = String(answer.answer).toLowerCase();
      const keywords = question.barem_keywords || [];

      // Count how many keywords are present in the user's answer
      const matchedKeywords = keywords.filter((keyword: string) =>
        userAnswerText.includes(keyword.toLowerCase())
      );

      // Consider it correct if at least 50% of keywords are present
      const keywordMatchRate = keywords.length > 0 ? matchedKeywords.length / keywords.length : 0;
      isCorrect = keywordMatchRate >= 0.5;

      if (isCorrect) {
        correctCount++;
        keywordMatches.push(question.question_id);
        const rubric = question.detailed_rubric?.[0] || 'Đáp án tốt.';
        feedbackParts.push(`✅ Câu ${question.question_id}: Đúng. ${rubric}`);
      } else {
        missingKeywords.push(question.question_id);
        const rubric = question.detailed_rubric?.[0] || 'Cần cải thiện.';
        feedbackParts.push(`❌ Câu ${question.question_id}: Chưa đúng. ${rubric}`);
      }
    }

    const questions = testData.reading_section?.questions || testData.questions || [];
    const score = Math.round((correctCount / questions.length) * 100);

    // Generate feedback
    let feedback = `BÀI LÀM CỦA BẠN - ${testData.test_id.toUpperCase()}\n\n`;
    feedback += `Điểm số: ${score}/100 (${correctCount}/${questions.length} câu đúng)\n\n`;
    feedback += feedbackParts.join('\n\n');

    if (score >= 80) {
      feedback += `\n\n🎉 TUYỆT VỚ! Bạn đã hiểu bài rất tốt. Hãy phát huy thêm nữa!`;
    } else if (score >= 60) {
      feedback += `\n\n💪 KHÁ TỐT! Hãy xem lại các câu sai và cải thiện thêm.`;
    } else {
      feedback += `\n\n📚 CẦN CỐ GẶNG! Hãy đọc lại bài thơ và phân tích kỹ hơn.`;
    }

    return NextResponse.json({
      score,
      total_questions: questions.length,
      correct_count: correctCount,
      keyword_matches: keywordMatches,
      missing_keywords: missingKeywords,
      feedback
    });

  } catch (error) {
    console.error('Grading error:', error);
    return NextResponse.json(
      {
        error: 'Failed to grade submission',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}