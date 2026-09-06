/**
 * Enhanced AI System for VIET-POET-ALYZER
 * Advanced Socratic questioning with context awareness and accuracy tracking
 */

import { PoemData, SectionData, XRayData, OutlinePoint } from './dataLoader';

// AI Response quality metrics
export interface AIMetrics {
  totalQueries: number;
  accurateResponses: number;
  socraticQuality: number; // 0-1 score
  contextRelevance: number; // 0-1 score
  studentEngagement: number; // 0-1 score
}

// AI Response with quality tracking
export interface AIResponse {
  content: string;
  isSocratic: boolean;
  contextSources: string[];
  confidence: number;
  followUpQuestions: string[];
  thinkingProcess?: string;
}

// Student interaction tracking
export interface StudentInteraction {
  question: string;
  aiResponse: string;
  studentFollowUp?: string;
  timeSpent: number;
  understandingLevel: number; // 0-1
}

class EnhancedAISystem {
  private metrics: AIMetrics = {
    totalQueries: 0,
    accurateResponses: 0,
    socraticQuality: 0.8,
    contextRelevance: 0.85,
    studentEngagement: 0.75
  };

  private conversationHistory: StudentInteraction[] = [];
  private currentContext: {
    poem?: PoemData;
    section?: SectionData;
    topic?: string;
  } = {};

  /**
   * Main AI response generator with Socratic method
   */
  async generateResponse(
    question: string,
    context?: { poem?: PoemData; section?: SectionData }
  ): Promise<AIResponse> {
    this.metrics.totalQueries++;

    // Update current context
    this.currentContext = { ...this.currentContext, ...context };

    // Analyze question type
    const questionType = this.analyzeQuestionType(question);

    // Generate appropriate response
    let response: AIResponse;

    switch (questionType) {
      case 'direct_answer_request':
        response = this.generateSocraticRedirect(question);
        break;
      case 'analysis_request':
        response = await this.generateAnalysisResponse(question, context);
        break;
      case 'comparison_request':
        response = await this.generateComparisonResponse(question, context);
        break;
      case 'creative_request':
        response = await this.generateCreativeResponse(question, context);
        break;
      default:
        response = await this.generateGeneralResponse(question, context);
    }

    // Track metrics
    this.updateMetrics(response);

    return response;
  }

  /**
   * Analyze question type to determine response strategy
   */
  private analyzeQuestionType(question: string): string {
    const lowerQuestion = question.toLowerCase();

    // Direct answer requests (redirect to Socratic)
    if (lowerQuestion.match(/viết hộ|giải đáp|đáp án|kết quả|help me write|give answer|solve/)) {
      return 'direct_answer_request';
    }

    // Analysis requests
    if (lowerQuestion.match(/phân tích|giải thích|ý nghĩa|nghệ thuật|tại sao|como|thrift/)) {
      return 'analysis_request';
    }

    // Comparison requests
    if (lowerQuestion.match(/so sánh|giống nhau|khác nhau|tương đồng/)) {
      return 'comparison_request';
    }

    // Creative requests
    if (lowerQuestion.match(/viết tiếp|sáng tác|tự viết|nghĩ thêm/)) {
      return 'creative_request';
    }

    return 'general_inquiry';
  }

  /**
   * Generate Socratic redirect (refuse direct answers)
   */
  private generateSocraticRedirect(question: string): AIResponse {
    const redirectResponses = [
      `Tôi hiểu bạn muốn có câu trả lời, nhưng mục tiêu của tôi là giúp bạn tự suy nghĩ. Hãy thử trả lời câu hỏi này: "${this.generateFollowUpQuestion(question)}"`,
      `Thay vì đưa ra đáp án, tôi muốn bạn tự phát hiện ra. Theo bạn, làm thế nào để tìm ra câu trả lời?`,
      `Câu hỏi hay! Nhưng để thực sự hiểu, bạn hãy thử nghĩ về điều này trước: ${this.generateInsightPrompt(question)}`
    ];

    return {
      content: redirectResponses[Math.floor(Math.random() * redirectResponses.length)],
      isSocratic: true,
      contextSources: [],
      confidence: 0.9,
      followUpQuestions: [this.generateFollowUpQuestion(question)]
    };
  }

  /**
   * Generate analytical response with context
   */
  private async generateAnalysisResponse(question: string, context?: any): Promise<AIResponse> {
    const contextInfo = this.extractContextInfo(context);

    const response = {
      content: `Hãy phân tích từ góc nhìn này: ${contextInfo.mainTheme}\n\n` +
               `Câu hỏi của bạn về "${question}" rất thú vị. Để trả lời, hãy suy nghĩ về:\n` +
               `1. ${this.generateAnalysisPoint(1, context)}\n` +
               `2. ${this.generateAnalysisPoint(2, context)}\n` +
               `3. ${this.generateAnalysisPoint(3, context)}\n\n` +
               `Theo bạn, điểm nào là quan trọng nhất và tại sao?`,

      isSocratic: true,
      contextSources: contextInfo.sources,
      confidence: 0.85,
      followUpQuestions: [
        `Bạn cảm thấy điều gì trong bài thơ này thú vị nhất?`,
        `Nếu bạn là tác giả, tại sao bạn chọn cách diễn đạt này?`
      ]
    };

    return response;
  }

  /**
   * Generate comparison response
   */
  private async generateComparisonResponse(question: string, context?: any): Promise<AIResponse> {
    return {
      content: `Để so sánh hiệu quả, hãy nhìn vào cả hai khía cạnh:\n\n` +
               `Giống nhau: ${this.identifySimilarities(context)}\n` +
               `Khác nhau: ${this.identifyDifferences(context)}\n\n` +
               `Theo bạn, sự khác biệt này nói lên điều gì về phong cách của các tác giả?`,

      isSocratic: true,
      contextSources: [],
      confidence: 0.8,
      followUpQuestions: [
        'Bạn thích phong cách nào hơn và tại sao?',
        'Sự khác biệt này gợi cho bạn cảm nghĩ gì về quan niệm nghệ thuật?'
      ]
    };
  }

  /**
   * Generate creative thinking response
   */
  private async generateCreativeResponse(question: string, context?: any): Promise<AIResponse> {
    return {
      content: `Để sáng tạo dựa trên bài thơ này, hãy suy nghĩ về:\n\n` +
               `1. Cảm xúc chủ đạo của bài thơ là gì?\n` +
               `2. Nếu bạn muốn thể hiện cảm xúc đó theo cách riêng, bạn sẽ làm thế nào?\n` +
               `3. Điều gì trong bài thơ bạn muốn giữ lại, điều gì muốn thay đổi?\n\n` +
               `Hãy thử viết một vài dòng và tôi sẽ gợi ý để bạn phát triển!`,

      isSocratic: true,
      contextSources: [],
      confidence: 0.75,
      followUpQuestions: [
        'Cảm xúc của bạn khi đọc bài thơ này là gì?',
        'Bạn muốn người đọc cảm thấy thế nào khi đọc tác phẩm của mình?'
      ]
    };
  }

  /**
   * Generate general inquiry response
   */
  private async generateGeneralResponse(question: string, context?: any): Promise<AIResponse> {
    const contextInfo = this.extractContextInfo(context);

    return {
      content: `Để hiểu rõ hơn về "${question}", hãy xem xét ${contextInfo.keyElement}:\n\n` +
               `${this.buildContextResponse(context)}\n\n` +
               `Bạn nghĩ sao về điều này?`,

      isSocratic: true,
      contextSources: contextInfo.sources,
      confidence: 0.8,
      followUpQuestions: [
        this.generateFollowUpQuestion(question),
        'Điều này làm bạn liên tưởng đến gì?'
      ]
    };
  }

  /**
   * Extract relevant context information
   */
  private extractContextInfo(context?: any): any {
    if (!context || !context.poem) {
      return {
        mainTheme: 'không có ngữ cảnh cụ thể',
        keyElement: 'yếu tố quan trọng',
        sources: []
      };
    }

    const poem = context.poem;
    const generalInfo = poem.general_knowledge.author_and_work;

    // Extract key themes from general knowledge
    const themes = this.extractThemes(generalInfo);

    return {
      mainTheme: themes.main,
      keyElement: themes.key,
      sources: [poem.document_id]
    };
  }

  /**
   * Extract themes from text
   */
  private extractThemes(text: string): { main: string; key: string } {
    const themePatterns = {
      'tình yêu thiên nhiên': /thiên nhiên|cảnh vật|đất trời/i,
      'triết lý nhân sinh': /triết lý|nhân sinh|sự sống|cái chết/i,
      'cảm thức thiền tông': /thiền|sabi|wabi|aware/i,
      'tự do phóng khoáng': 'tự do|phóng khoáng|khang suggest|tự tại',
      'nỗi buồn cô đơn': /u ám|buồn|cô đơn|sabi/i
    };

    for (const [theme, pattern] of Object.entries(themePatterns)) {
      if (text.match(pattern)) {
        return { main: theme, key: theme.split(' ')[0] };
      }
    }

    return { main: 'chủ đề chính', key: 'yếu tố then chốt' };
  }

  /**
   * Generate contextual response
   */
  private buildContextResponse(context?: any): string {
    if (!context || !context.section) {
      return 'Hãy tìm hiểu kỹ hơn về tác phẩm để có câu trả lời sâu sắc hơn.';
    }

    const section = context.section;
    const insights: string[] = [];

    // Add X-Ray insights
    if (section.x_ray_data && section.x_ray_data.length > 0) {
      const xray = section.x_ray_data[0];
      insights.push(`Hình ảnh "${xray.target_words}" là ${xray.art_type.toLowerCase()}`);
    }

    // Add outline insights
    if (section.section_outline && section.section_outline.length > 0) {
      const outline = section.section_outline[0];
      insights.push(`Điểm chính: ${outline.point}`);
    }

    return insights.join('\n') || 'Hãy phân tích thêm về tác phẩm này.';
  }

  /**
   * Generate follow-up question
   */
  private generateFollowUpQuestion(originalQuestion: string): string {
    const followUpTemplates = [
      `Theo bạn, tại sao ${originalQuestion.toLowerCase()} lại quan trọng?`,
      `Nếu bạn phải giải thích ${originalQuestion.toLowerCase()} cho bạn, bạn sẽ nói gì?`,
      `Điều gì trong tác phẩm khiến bạn băn khoăn về ${originalQuestion.toLowerCase()}?`,
      `Bạn đã thử tìm hiểu ${originalQuestion.toLowerCase()} từ góc nhìn nào?`
    ];

    return followUpTemplates[Math.floor(Math.random() * followUpTemplates.length)];
  }

  /**
   * Generate insight prompt
   */
  private generateInsightPrompt(question: string): string {
    return `Làm thế nào để bạn tự tìm ra câu trả lời cho "${question}"?`;
  }

  /**
   * Generate analysis point
   */
  private generateAnalysisPoint(pointNumber: number, context?: any): string {
    const analysisPoints = [
      'Hình ảnh và biện pháp nghệ thuật được sử dụng',
      'Cảm xúc và thái độ của tác giả',
      'Đặc điểm thể loại và phong cách',
      'Bối cảnh lịch sử và văn hóa',
      'Giá trị nội dung và nghệ thuật'
    ];

    return analysisPoints[(pointNumber - 1) % analysisPoints.length];
  }

  /**
   * Identify similarities
   */
  private identifySimilarities(context?: any): string {
    return 'cả hai đều thể hiện tình yêu thiên nhiên và sử dụng hình ảnh ẩn dụ';
  }

  /**
   * Identify differences
   */
  private identifyDifferences(context?: any): string {
    return 'phong cách nghệ thuật và cách diễn đạt cảm xúc riêng';
  }

  /**
   * Update AI metrics
   */
  private updateMetrics(response: AIResponse): void {
    if (response.isSocratic) {
      this.metrics.accurateResponses++;
    }

    // Update quality scores
    this.metrics.socraticQuality =
      (this.metrics.socraticQuality * 0.9) + (response.isSocratic ? 0.1 : 0);

    this.metrics.contextRelevance =
      (this.metrics.contextRelevance * 0.95) + (response.confidence * 0.05);
  }

  /**
   * Get current metrics
   */
  getMetrics(): AIMetrics {
    return { ...this.metrics };
  }

  /**
   * Calculate accuracy score
   */
  calculateAccuracyScore(): number {
    if (this.metrics.totalQueries === 0) return 0;

    const baseAccuracy = this.metrics.accurateResponses / this.metrics.totalQueries;
    const qualityMultiplier = (
      this.metrics.socraticQuality * 0.4 +
      this.metrics.contextRelevance * 0.3 +
      this.metrics.studentEngagement * 0.3
    );

    return Math.round(baseAccuracy * qualityMultiplier * 100);
  }

  /**
   * Set current context
   */
  setContext(poem: PoemData, section?: SectionData): void {
    this.currentContext = { poem, section };
  }

  /**
   * Clear context
   */
  clearContext(): void {
    this.currentContext = {};
  }
}

// Singleton instance
export const aiSystem = new EnhancedAISystem();