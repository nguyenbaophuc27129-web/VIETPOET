/**
 * BAREM GRADER — Chấm bài theo Ý barem (07/09/2026)
 * =================================================
 * Triết lý chấm của đề thi thật: học sinh CHỈ CẦN ĐÚNG Ý là được điểm,
 * KHÔNG cần viết đúng nguyên văn câu chữ trong barem.
 *
 * Ý của học sinh được công nhận khi:
 *  1. Gõ có dấu hoặc không dấu đều được (normVN khử dấu + đ→d);
 *  2. Diễn đạt bằng từ khác vẫn được: chia ý thành các TỪ NỘI DUNG
 *     (bỏ stopword "của/và/các..."), đủ ~nửa số từ là tính ĐẠT ý;
 *  3. Nhận diện vài cặp từ đồng nghĩa hay gặp trong văn luận văn học
 *     (thủ pháp ~ bút pháp, hình tượng ~ hình ảnh, cảm thông ~ đồng cảm);
 *  4. Ý chứa SỐ (vd "ngắt nhịp 3/5") bắt buộc phải có đúng số đó —
 *     không thể ghi "ngắt nhịp 4/4" mà được điểm cho ý 3/5.
 *
 * Điểm mỗi câu = max_score × (số ý đạt / tổng ý) → điểm phân hoá theo ý,
 * đúng tinh thần barem (không còn "đúng 100% hoặc 0 điểm").
 * Chạy 100% client, không cần mạng — giữ nguyên triết lý offline của sản phẩm.
 */

/** Viết thường + khử dấu tiếng Việt + đ→d */
export function normVN(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

/** Các cặp từ đồng nghĩa hay gặp trong bài làm học sinh (áp trên bản đã normVN) */
const SYNONYM_PHRASES: Array<[string, string]> = [
  ['thu phap', 'but phap'],
  ['hinh tuong', 'hinh anh'],
  ['cam thong', 'dong cam'],
];

export function applySynonyms(s: string): string {
  let out = s;
  for (const [from, to] of SYNONYM_PHRASES) out = out.split(from).join(to);
  return out;
}

/** Stopword tiếng Việt thường gặp trong cụm ý barem — không tính là từ nội dung */
const STOPWORDS = new Set([
  'cua', 'va', 'cac', 'nhung', 'co', 'la', 'mot', 'voi', 'theo', 'trong',
  'cho', 've', 'duoc', 'khi', 'nay', 'do', 'ma', 'nhu', 'den', 'tren',
  'duoi', 'rang', 'noi', 'giua', 'bang', 'len', 'di',
]);

/** Tách từ nội dung: bỏ stopword; giữ từ ≥2 ký tự và chữ số */
export function contentTokens(s: string): string[] {
  return s
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .filter((t) => STOPWORDS.has(t) ? false : (t.length >= 2 || /[0-9]/.test(t)));
}

/** Một token coi như có mặt nếu trùng, hoặc cùng gốc (tiếp đầu ngữ ≥4 ký tự) */
function hasToken(answerTokens: Set<string>, token: string): boolean {
  if (answerTokens.has(token)) return true;
  for (const a of answerTokens) {
    if (token.length >= 4 && a.startsWith(token)) return true;
    if (a.length >= 4 && token.startsWith(a)) return true;
  }
  return false;
}

/**
 * Một Ý barem được tính ĐẠT khi:
 *  - đủ mọi chữ số của ý (nếu có), VÀ
 *  - đạt số từ nội dung tối thiểu: 1 từ nếu ý chỉ có 1 từ,
 *    nếu ý có ≥2 từ thì cần ≥ nửa số từ (ít nhất 2).
 */
export function yMatched(answerTokens: Set<string>, y: string): boolean {
  const tokens = contentTokens(y);
  const digits = [...new Set(tokens.filter((t) => /^[0-9]+$/.test(t)))];
  // khử từ trùng lặp trong ý ("nhớ nhà NHÓ mẹ") — tránh 1 từ khớp bị đếm 2 lần
  // thành đủ ngưỡng (bug phát hiện bởi eval_barem_scientific)
  const words = [...new Set(tokens.filter((t) => !/^[0-9]+$/.test(t)))];

  for (const d of digits) {
    if (!answerTokens.has(d)) return false;
  }
  if (words.length === 0) {
    // Ý không còn từ nội dung nào (vd chỉ stopword): CHỈ đạt nếu là ý thuần số
    // và các số đã có mặt — tránh tự động cho điểm ảo (bug phát hiện bởi test_barem)
    return digits.length > 0;
  }
  const required = words.length === 1 ? 1 : Math.max(2, Math.ceil(words.length * 0.5));
  let hit = 0;
  for (const w of words) {
    if (hasToken(answerTokens, w)) hit++;
  }
  return hit >= required;
}

export interface QuestionGrade {
  totalCount: number;
  matchedCount: number;
  ratio: number;
  matchedY: string[];
  missingY: string[];
}

/** Chấm 1 câu: trả về danh sách ý ĐẠT / THIẾU để nhận xét minh bạch từng ý */
export function gradeQuestion(baremKeywords: string[], answer: string): QuestionGrade {
  const answerNorm = applySynonyms(normVN(answer));
  const answerTokens = new Set(contentTokens(answerNorm));

  const matchedY: string[] = [];
  const missingY: string[] = [];
  for (const keyword of baremKeywords) {
    const y = applySynonyms(normVN(keyword));
    (yMatched(answerTokens, y) ? matchedY : missingY).push(keyword);
  }
  const totalCount = baremKeywords.length;
  return {
    totalCount,
    matchedCount: matchedY.length,
    ratio: totalCount > 0 ? matchedY.length / totalCount : 0,
    matchedY,
    missingY,
  };
}
