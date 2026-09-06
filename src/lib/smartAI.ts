/**
 * Smart AI v6.0 - Socratic Tutor (FIXED)
 *
 * Các lỗi đã sửa (từ log thử nghiệm HOI_THOAI.txt - 01/09/2026):
 * 1. Output rối, cắt cụt (ghép tên section + câu thơ thành chuỗi vô nghĩa)
 *    → Mọi câu trả lời được build từ các trường có cấu trúc (target_words,
 *      art_type, effect, original_text) và kiểm tra dữ liệu trước khi render.
 * 2. Trả lời LẶP Y NGUYÊN khi học sinh bức xúc ("ai mà biết trời ơi")
 *    → Luân chuyển khái niệm theo số lượt chat + chống lặp với tin nhắn trước.
 * 3. Trả lời "✅ Đúng!" khi học sinh nói "không biết"
 *    → Chuyển sang chế độ GIẢNG (teach mode): giải thích rõ 1 khái niệm,
 *      không bao giờ khen khi học sinh chưa trả lời gì.
 * 4. "cho bài mẫu" đôi khi bị đưa hẳn bài hướng dẫn chi tiết (mâu thuẫn Socratic)
 *    → Luôn từ chối cho bài mẫu + hướng dẫn CÁCH TỰ VIẾT (3 bước), không viết thay.
 */
import { PoemData, SectionData } from './dataLoader';


interface AIResponse {
  content: string;
  sources: string[];
  confidence: number;
}

/** Chuẩn hóa text: lowercase + bỏ dấu tiếng Việt để bắt cả "ko biet", "ai ma biet"... */
function norm(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

// ============ TỪ KHÓA NHẬN DIỆN Ý ĐỊNH (đã bỏ dấu) ============
const FRUSTRATION_SIGNALS = [
  'ai ma biet', 'ai biet', 'troi oi', 'troi a', 'buc minh', 'buc qua',
  'kho qua', 'kho hieu', 'met qua', 'met roi', 'chan qua', 'chan that',
  'hong biet dau', 'bo qua di', 'thoi di', 'kho chiu'
];

const UNCERTAINTY_SIGNALS = [
  'khong biet', 'ko biet', 'k biet', 'k bit', 'ko bit', 'hong biet',
  'khong hieu', 'ko hieu', 'k hieu', 'khong tim duoc', 'khong tim ra',
  'khong ro', 'chua biet', 'chua hieu', 'hoi kho', 'nghi ra', 'tuong ra',
  'nhu the nao', 'the nao a', 'y nghia gi'
];

const ESSAY_SIGNALS = [
  'bai mau', 'van mau', 'viet bai', 'viet ho', 'viet gium', 'viet giup',
  'lam bai', 'lam ho', 'lam gium bai', 'dap an', 'ket qua', 'copy',
  'sample', 'bai van', 'viet thanh bai', 'cho minh bai', 'cho toi bai',
  'cho em bai', 'cho minh ket qua', 'cho ket qua', 'tra loi ho'
];

const WHAT_TO_DO_SIGNALS = [
  'nen lam gi', 'pha lam sao', 'lam gi tiep', 'bat dau tu dau',
  'bat dau nhu the nao', 'can lam gi', 'lam gi bay gio', 'to nen lam gi',
  'minh nen lam gi', 'lam sao de hoc'
];

const GREETING_SIGNALS = ['xin chao', 'chao ban', 'chao a', 'hello', 'halo', 'hi ban'];

// Mở đầu đa dạng cho từng chế độ (chống lặp)
const TEACH_OPENERS = [
  'Không sao, mình giải thích cho bạn nghe nè:',
  'OK, để mình nói rõ cho bạn:',
  'Câu này mình giải thích luôn nhé:',
  'Đừng lo, mình sẽ nói dễ hiểu thôi:'
];

const EMPATHY_OPENERS = [
  'Bình tĩnh nha, mình giúp bạn luôn đây —',
  'Điểm này khó thật, để mình giải thích thẳng luôn:',
  'OK, thay vì gợi ý mình sẽ giải thích hẳn hoi:',
  'Mình hiểu mà! Giải thích ngay đây:'
];

class SmartAISystem {
  // Trạng thái nội bộ của chatbot (không cần route truyền history)
  private turnCount = 0;      // số lượt hỏi → dùng để luân chuyển khái niệm/câu mở đầu
  private lastContent = '';   // câu trả lời gần nhất → chống lặp

  /** Lấy toàn bộ khái niệm (biện pháp nghệ thuật) của bài thơ, có cấu trúc sạch */
  private getConcepts(poem: PoemData): { name: string; line: string; artType: string; effect: string; section: SectionData }[] {
    return this.getConceptsFromSections(poem.detailed_analysis);
  }

  private getConceptsFromSections(sections: SectionData[]): { name: string; line: string; artType: string; effect: string; section: SectionData }[] {
    const concepts: { name: string; line: string; artType: string; effect: string; section: SectionData }[] = [];

    for (const section of sections) {
      for (const xray of section.x_ray_data) {
        if (!xray.target_words || !xray.effect) continue;
        // Tìm câu thơ gốc chứa từ khóa (khớp theo từ đầu tiên, an toàn hơn substring cũ)
        const firstWord = norm(xray.target_words).split(/\s+/)[0] || '';
        const line =
          section.original_text.find(l => norm(l).includes(firstWord)) ||
          section.original_text.find(l => l.trim()) ||
          '';
        concepts.push({
          name: xray.target_words,
          line,
          artType: xray.art_type,
          effect: xray.effect,
          section
        });
      }
    }
    return concepts;
  }

  /** Chống lặp: nếu nội dung mới trùng câu trả lời trước → chuyển sang khái niệm kế tiếp */
  private ensureNotRepeated(content: string, renderFn: (offset: number) => string): string {
    if (content !== this.lastContent) return content;
    return renderFn(Math.floor(Math.random() * 9000) + 1);
  }

  /** Câu hỏi gợi mở dựa trên DỮ LIỆU THẬT của bài thơ (trước đây bị hardcode sai) */
  private buildGuideQuestion(sections: SectionData[], offset = 0): string {
    const concepts = this.getConceptsFromSections(sections);
    if (concepts.length === 0) {
      return 'Bạn thấy hình ảnh nào trong bài thơ ấn tượng nhất với mình?';
    }
    const c = concepts[offset % concepts.length];
    const linePart = c.line ? ` ở câu "${c.line}"` : '';
    return `Bạn thấy hình ảnh "${c.name}"${linePart} gợi cho bạn cảm giác gì?`;
  }

  /** Giảng 1 khái niệm cụ thể, format sạch sẽ */
  private renderConcept(poem: PoemData, offset: number, includeOpener = true): string {
    const concepts = this.getConcepts(poem);
    if (concepts.length === 0) {
      return `Bài thơ này chưa có dữ liệu phân tích chi tiết. Bạn hãy thử đọc to bài thơ và cho mình biết câu nào bạn thấy khó hiểu nhất nhé!`;
    }
    const c = concepts[offset % concepts.length];

    let content = '';
    if (includeOpener) {
      content += `${TEACH_OPENERS[offset % TEACH_OPENERS.length]}\n\n`;
    }
    content += `**${c.name}**${c.line ? `\n> ${c.line}` : ''}\n\n`;
    content += `- **Biện pháp:** ${c.artType}\n`;
    content += `- **Tác dụng:** ${c.effect}\n\n`;
    content += `Giờ thử câu này dễ hơn nè: ${this.buildGuideQuestion([c.section], offset + 1)}`;
    return content;
  }

  // ================= LUỒNG CHÍNH =================
  analyzePoem(poem: PoemData | null, question: string, _history?: any[]): AIResponse {
    if (!poem) {
      return {
        content: 'Bạn hãy chọn một bài thơ ở khung bên trên nhé, mình sẽ phân tích ngay!',
        sources: [],
        confidence: 0
      };
    }

    this.turnCount++;
    const turn = this.turnCount;
    const q = norm(question);

    let result: AIResponse;

    // ---- 1. XIN BÀI MẪU / ĐÁP ÁN → từ chối Socratic + chỉ CÁCH tự viết (lỗi #4) ----
    if (ESSAY_SIGNALS.some(s => q.includes(s))) {
      result = this.socraticEssayRefusal(poem, turn);
    }

    // ---- 2. BỰC XÚC → đồng cảm + GIẢNG NGAY, không lặp gợi ý cũ (lỗi #1, #2) ----
    else if (FRUSTRATION_SIGNALS.some(s => q.includes(s))) {
      result = {
        content: this.ensureNotRepeated(
          `${EMPATHY_OPENERS[turn % EMPATHY_OPENERS.length]}\n\n${this.renderConcept(poem, turn, false)}`,
          o => this.renderConcept(poem, o, false)
        ),
        sources: [poem.document_id],
        confidence: 0.9
      };
    }

    // ---- 3. "KHÔNG BIẾT" → giảng 1 khái niệm, TUYỆT ĐỐI KHÔNG khen "Đúng!" (lỗi #3) ----
    else if (UNCERTAINTY_SIGNALS.some(s => q.includes(s))) {
      result = {
        content: this.ensureNotRepeated(
          this.renderConcept(poem, turn),
          o => this.renderConcept(poem, o)
        ),
        sources: [poem.document_id],
        confidence: 0.9
      };
    }

    // ---- 4. "TÔI NÊN LÀM GÌ?" → đưa menu hành động cụ thể ----
    else if (WHAT_TO_DO_SIGNALS.some(s => q.includes(s))) {
      result = this.whatToDoMenu(poem);
    }

    // ---- 5. CHÀO HỎI ----
    else if (GREETING_SIGNALS.some(s => q.startsWith(s) || q === s)) {
      result = {
        content: `Chào bạn! Mình là trợ lý học thơ.\n\nVới bài này, bạn có thể hỏi mình:\n- **Tác giả** & hoàn cảnh sáng tác\n- **Biện pháp nghệ thuật** (ẩn dụ, nhân hóa, đảo ngữ...)\n- **Nội dung** từng khổ thơ\n\nBạn muốn bắt đầu từ ý nào?`,
        sources: [poem.document_id],
        confidence: 0.9
      };
    }

    // ---- 6. HỎI RÕ VỀ KHÁI NIỆM ----
    else if (this.findMentionedConcept(poem, question)) {
      result = {
        content: this.renderOneConceptDetailed(this.findMentionedConcept(poem, question)!),
        sources: [poem.document_id],
        confidence: 0.9
      };
    }

    // ---- 7. HỎI THEO CHỦ ĐỀ ----
    else if (q.includes('tac gia') || q.includes('author')) {
      result = this.analyzeAuthor(poem);
    }
    else if (q.includes('nghe thuat') || q.includes('tu tu') || q.includes('art')) {
      result = this.analyzeArt(poem);
    }
    else if (q.includes('noi dung') || q.includes('content')) {
      result = this.analyzeContent(poem);
    }
    else if (q.includes('phan tich') || q.includes('analysis') || q.includes('ca bai')) {
      result = this.analyzeFull(poem);
    }

    // ---- 8. MẶC ĐỊNH: tổng quan sạch + lựa chọn ----
    else {
      result = this.analyzeOverview(poem);
    }

    this.lastContent = result.content;
    return result;
  }

  /** Từ chối cho bài mẫu NHƯNG kèm hướng dẫn 3 bước tự viết (nhất quán Socratic) */
  private socraticEssayRefusal(poem: PoemData, offset: number): AIResponse {
    let content = `💭 **Mình không thể cho bài mẫu để bạn chép** — vì bài thi thật sẽ đo phần tư duy của bạn, mà tư duy thì không chép được.\n\n`;
    content += `Nhưng mình chỉ bạn **cách tự viết** nhé:\n\n`;
    content += `**Bước 1 — Mở bài:** Giới thiệu tác giả, tác phẩm và cảm hứng chủ đạo của bài thơ.\n`;
    content += `**Bước 2 — Thân bài:** Chọn 2-3 hình ảnh hoặc biện pháp nghệ thuật nổi bật nhất, phân tích từng cái (nêu ví dụ → tác dụng).\n`;
    content += `**Bước 3 — Kết bài:** Đánh giá giá trị nội dung và nghệ thuật.\n\n`;
    content += `Bắt đầu từ chỗ dễ nhất đây: ${this.buildGuideQuestion(poem.detailed_analysis, offset)}\n\n`;
    content += `Bạn thử trả lời trước, mình sẽ góp ý cho!`;

    return {
      content,
      sources: [poem.document_id],
      confidence: 0.95
    };
  }

  /** Menu "tôi nên làm gì" — hành động cụ thể, không cụt lủn */
  private whatToDoMenu(poem: PoemData): AIResponse {
    const sections = poem.detailed_analysis.slice(0, 3);
    let content = `Để học tốt bài này, bạn chọn 1 trong 3 cách nhé:\n\n`;
    content += `**1. Học theo khổ thơ** — hỏi mình về: ${sections.map(s => s.section_name.replace(/^\d+\.\s*/, '')).join(' / ')}\n`;
    content += `**2. Học theo biện pháp nghệ thuật** — gõ "phân tích nghệ thuật" để mình liệt kê tất cả.\n`;
    content += `**3. Luyện chấm điểm** — sang tab Luyện thi và viết bài, AI chấm theo barem Bộ GD&ĐT.\n\n`;
    content += `Hoặc trả lời câu mở đầu này: ${this.buildGuideQuestion(poem.detailed_analysis, 0)}`;

    return {
      content,
      sources: [poem.document_id],
      confidence: 0.9
    };
  }

  /** Tìm khái niệm học sinh nhắc đến trong câu hỏi */
  private findMentionedConcept(poem: PoemData, question: string) {
    const q = norm(question);
    for (const section of poem.detailed_analysis) {
      for (const xray of section.x_ray_data) {
        const target = norm(xray.target_words);
        if (target.length >= 3 && q.includes(target)) {
          const firstWord = target.split(/\s+/)[0] || '';
          const line =
            section.original_text.find(l => norm(l).includes(firstWord)) ||
            section.original_text.find(l => l.trim()) ||
            '';
          return { name: xray.target_words, line, artType: xray.art_type, effect: xray.effect, section };
        }
      }
    }
    return null;
  }

  /** Render chi tiết 1 khái niệm được hỏi trực tiếp */
  private renderOneConceptDetailed(c: { name: string; line: string; artType: string; effect: string; section: SectionData }): string {
    let content = `**${c.name}**${c.line ? `\n> ${c.line}` : ''}\n\n`;
    content += `- **Biện pháp nghệ thuật:** ${c.artType}\n`;
    content += `- **Tác dụng:** ${c.effect}\n\n`;
    content += `Khái niệm này nằm trong **${c.section.section_name}**.\n\n`;
    content += `💡 Thử áp dụng luôn: ${this.buildGuideQuestion([c.section], 0)}`;
    return content;
  }

  // ================= CÁC CHẾ ĐỘ PHÂN TÍCH (định dạng sạch) =================
  private analyzeAuthor(poem: PoemData): AIResponse {
    const authorInfo = poem.general_knowledge.author_and_work;
    const authorMatch = authorInfo.match(/(?:tác giả|author|by):\s*([A-Z][^,.;]+)/i);
    const author = authorMatch ? authorMatch[1].trim() : '';
    const firstSentence = authorInfo.split(/[.!?]/).map(s => s.trim()).find(s => s.length > 20) || authorInfo;

    return {
      content:
        `**Tác giả:** ${author || 'Xem thông tin bên dưới'}\n\n${firstSentence}.\n\n` +
        `💭 Bạn nghĩ hoàn cảnh này ảnh hưởng thế nào đến bài thơ?`,
      sources: [poem.document_id],
      confidence: 0.9
    };
  }

  private analyzeArt(poem: PoemData): AIResponse {
    const concepts = this.getConcepts(poem);
    if (concepts.length === 0) {
      return {
        content: 'Bài thơ này chưa có dữ liệu phân tích nghệ thuật chi tiết.',
        sources: [poem.document_id],
        confidence: 0.5
      };
    }

    let content = `**Các biện pháp nghệ thuật nổi bật trong bài:**\n\n`;
    concepts.slice(0, 6).forEach((c, i) => {
      content += `${i + 1}. **${c.name}** — ${c.artType}\n`;
      content += `   → ${c.effect}\n`;
    });
    content += `\nBạn muốn mình giải thích kỹ cái nào? (gõ tên hình ảnh để hỏi)`;

    return { content, sources: [poem.document_id], confidence: 0.9 };
  }

  private analyzeContent(poem: PoemData): AIResponse {
    let content = `**Nội dung chính theo từng phần:**\n\n`;
    poem.detailed_analysis.forEach(section => {
      content += `**${section.section_name}**\n`;
      section.section_outline.forEach(outline => {
        content += `- ${outline.point}\n`;
        if (outline.conclusion) content += `  → ${outline.conclusion}\n`;
      });
      content += `\n`;
    });
    content += `💭 Bạn thấy phần nào thấm nhất? Vì sao?`;

    return { content, sources: [poem.document_id], confidence: 0.9 };
  }

  private analyzeFull(poem: PoemData): AIResponse {
    let content = `**PHÂN TÍCH TOÀN BÀI THƠ**\n\n`;
    content += `**Tác giả:** ${this.extractAuthor(poem)}\n\n`;

    poem.detailed_analysis.forEach((section, index) => {
      content += `━━━━━━━━━━━━━━━━━━\n\n**${section.section_name}**\n\n`;
      const lines = section.original_text.filter(l => l.trim());
      if (lines.length > 0) {
        content += `*Nguyên văn:*\n${lines.map(l => `> ${l}`).join('\n')}\n\n`;
      }
      if (section.x_ray_data.length > 0) {
        content += `*Nghệ thuật:*\n`;
        section.x_ray_data.forEach(x => {
          content += `- **${x.target_words}** (${x.art_type}): ${x.effect}\n`;
        });
        content += `\n`;
      }
    });

    content += `━━━━━━━━━━━━━━━━━━\n\n`;
    content += `💡 Bạn muốn đi sâu phần nào, cứ hỏi mình!`;

    return { content, sources: [poem.document_id], confidence: 0.95 };
  }

  private analyzeOverview(poem: PoemData): AIResponse {
    const concepts = this.getConcepts(poem).slice(0, 3);
    let content = `**Tổng quan bài thơ** (${poem.detailed_analysis.length} phần phân tích)\n\n`;

    if (concepts.length > 0) {
      content += `**3 điểm nổi bật:**\n`;
      concepts.forEach((c, i) => {
        content += `${i + 1}. **${c.name}** (${c.artType}) — ${c.effect}\n`;
      });
      content += `\n`;
    }

    content += `Bạn muốn phân tích kỹ điểm nào, hoặc hỏi mình về **tác giả**, **nội dung**?`;

    return { content, sources: [poem.document_id], confidence: 0.85 };
  }

  private extractAuthor(poem: PoemData): string {
    const match = poem.general_knowledge.author_and_work.match(/(?:tác giả|author|by):\s*([A-Z][^,.;]+)/i);
    return match ? match[1].trim() : 'xem phần thông tin chung';
  }
}

// Singleton instance
export const smartAI = new SmartAISystem();
