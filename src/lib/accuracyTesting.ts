/**
 * AI Accuracy Testing System
 * Tests AI responses against ground truth from JSON data
 */
import { getAllPoems, getPoemById, type PoemData } from './dataLoader';
import { smartAI } from './smartAI';

interface TestCase {
  id: string;
  poemId: string;
  question: string;
  expectedKeywords: string[];
  category: 'author' | 'art' | 'content' | 'analysis';
}

interface TestResult {
  testCase: TestCase;
  response: any;
  passed: boolean;
  missingKeywords: string[];
  score: number;
}

class AccuracyTester {
  private testCases: TestCase[] = [];
  private results: TestResult[] = [];

  /**
   * Generate test cases from available poems
   */
  generateTestCases() {
    const poems = getAllPoems();
    this.testCases = [];

    poems.forEach(poem => {
      // Test author information
      this.testCases.push({
        id: `${poem.document_id}-author`,
        poemId: poem.document_id,
        question: 'Tác giả của bài thơ này là ai?',
        expectedKeywords: this.extractAuthorKeywords(poem),
        category: 'author'
      });

      // Test artistic elements
      this.testCases.push({
        id: `${poem.document_id}-art`,
        poemId: poem.document_id,
        question: 'Phân tích nghệ thuật của bài thơ',
        expectedKeywords: this.extractArtKeywords(poem),
        category: 'art'
      });

      // Test content analysis
      this.testCases.push({
        id: `${poem.document_id}-content`,
        poemId: poem.document_id,
        question: 'Phân tích nội dung của bài thơ',
        expectedKeywords: this.extractContentKeywords(poem),
        category: 'content'
      });
    });
  }

  /**
   * Extract author keywords from poem data
   */
  private extractAuthorKeywords(poem: PoemData): string[] {
    const keywords: string[] = [];
    const authorInfo = poem.general_knowledge.author_and_work;

    // Extract author name
    const authorMatch = authorInfo.match(/(?:tác giả|author):?\s*([^,.]+)/i);
    if (authorMatch) {
      keywords.push(authorMatch[1].trim());
    }

    return keywords;
  }

  /**
   * Extract artistic keywords from poem data
   */
  private extractArtKeywords(poem: PoemData): string[] {
    const keywords: string[] = [];

    poem.detailed_analysis.forEach(section => {
      section.x_ray_data.forEach(xray => {
        keywords.push(xray.target_words);
        keywords.push(xray.art_type);
      });
    });

    return keywords;
  }

  /**
   * Extract content keywords from poem data
   */
  private extractContentKeywords(poem: PoemData): string[] {
    const keywords: string[] = [];

    poem.detailed_analysis.forEach(section => {
      section.section_outline.forEach(outline => {
        keywords.push(outline.point);
      });
    });

    return keywords;
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<TestResult[]> {
    this.results = [];

    for (const testCase of this.testCases) {
      const poem = getPoemById(testCase.poemId);
      const response = smartAI.analyzePoem(poem || null, testCase.question);

      const result = this.evaluateTest(testCase, response);
      this.results.push(result);
    }

    return this.results;
  }

  /**
   * Evaluate individual test
   */
  private evaluateTest(testCase: TestCase, response: any): TestResult {
    const responseText = response.content.toLowerCase();
    const missingKeywords: string[] = [];
    let foundCount = 0;

    for (const keyword of testCase.expectedKeywords) {
      if (responseText.includes(keyword.toLowerCase())) {
        foundCount++;
      } else {
        missingKeywords.push(keyword);
      }
    }

    const score = testCase.expectedKeywords.length > 0
      ? (foundCount / testCase.expectedKeywords.length) * 100
      : 0;

    const passed = score >= 70; // 70% threshold for passing

    return {
      testCase,
      response,
      passed,
      missingKeywords,
      score
    };
  }

  /**
   * Get summary of test results
   */
  getSummary() {
    if (this.results.length === 0) {
      return {
        total: 0,
        passed: 0,
        failed: 0,
        averageScore: 0,
        passRate: 0
      };
    }

    const passed = this.results.filter(r => r.passed).length;
    const averageScore = this.results.reduce((sum, r) => sum + r.score, 0) / this.results.length;

    return {
      total: this.results.length,
      passed,
      failed: this.results.length - passed,
      averageScore: Math.round(averageScore),
      passRate: Math.round((passed / this.results.length) * 100)
    };
  }

  /**
   * Get failed tests
   */
  getFailedTests() {
    return this.results.filter(r => !r.passed);
  }
}

// Singleton instance
export const accuracyTester = new AccuracyTester();
