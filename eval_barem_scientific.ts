/**
 * KIỂM ĐỊNH KHOA HỌC BỘ CHẤM BAREM THEO Ý — VIET-POET EXAM (07/09/2026)
 * =====================================================================
 * Mục đích: đo độ chính xác của bộ chấm AI bằng thang đo chuẩn
 * (Accuracy / Precision / Recall / F1 + sai số điểm MAE) trên bộ dữ liệu
 * CÓ NHÃN NGƯỜI LỆ (ground truth do đội tự chấm tay theo barem giáo viên),
 * xây từ barem THẬT của 13 câu Viết văn trong 10 đề (public/practice_data).
 *
 * So sánh 2 phương pháp trên cùng một bộ mẫu:
 *   - OLD (baseline bản cũ): so nguyên văn — answer.toLowerCase().includes(y.toLowerCase())
 *   - NEW (bản mới): src/lib/baremGrader.ts — khử dấu, từ nội dung, gốc từ,
 *     đồng nghĩa, ý thuần số bắt buộc đúng số.
 *
 * Mỗi mẫu bài làm có nhãn = danh sách CHỈ SỐ Ý mà giáo viên công nhận.
 * Mỗi cặp (mẫu, ý) là một quyết định nhị phân ĐẠT/KHÔNG ĐẠT:
 *   TP = GV công nhận + máy chấm đạt | FP = máy đạt nhưng GV không công nhận (điểm ảo)
 *   FN = GV công nhận nhưng máy trượt (điểm oan)      | TN = cả hai cùng không đạt
 *
 * Chạy:  npx tsx eval_barem_scientific.ts
 * Xuất:  python-backend/eval_results/barem_per_sample_results.csv (utf-8-sig, mở Excel)
 *        python-backend/eval_results/barem_summary.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { gradeQuestion, normVN } from './src/lib/baremGrader';

// ---------------------------------------------------------------- dữ liệu đề thật
interface LoadedQ {
  de: string;
  qIdx: number; // thứ tự câu viết trong đề (1-based, khớp giao diện EXAM)
  ys: string[];
  max: number;
}

function loadQuestions(): LoadedQ[] {
  const dir = path.join(__dirname, 'public', 'practice_data');
  const out: LoadedQ[] = [];
  const files = fs.readdirSync(dir).filter((f) => /^de_\d+_L1[01]\.json$/.test(f)).sort();
  for (const f of files) {
    const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    (d.writing_section?.questions ?? []).forEach((q: { barem_keywords?: string[]; max_score?: number }, i: number) => {
      if (Array.isArray(q.barem_keywords) && q.barem_keywords.length > 0) {
        out.push({ de: f.replace('.json', ''), qIdx: i + 1, ys: q.barem_keywords, max: q.max_score ?? 0 });
      }
    });
  }
  return out;
}

// ---------------------------------------------------------------- bộ mẫu có nhãn
// Nhãn (label) = các chỉ số ý (0-based) mà GIÁO VIÊN công nhận là ĐẠT.
// Nguyên tắc đặt nhãn bám barem thật: đúng ý là được điểm, không cần nguyên văn.
interface Sample {
  key: string;      // "de_01_L10:2"
  arch: string;     // tên kiểu mẫu (archetype)
  text: string;     // bài làm học sinh
  label: number[];  // ý GV công nhận
}

// --- bài làm chung (mù nội dung — test PRECISION: không được có điểm ảo)
const FLUFF =
  'Bài thơ đọc lên khiến em thấy thích thú và lòng rộng mở vì những điều đẹp đẽ mà tác giả mang lại. ' +
  'Em mong sẽ được đọc thêm nhiều sáng tác khác nữa của nhà thơ này.';
const WRONG_TOPIC =
  'Mùa hè năm ngoái, gia đình em có một chuyến đi biển rất vui. Chúng em tắm biển, ăn hải sản và chụp thật nhiều hình. ' +
  'Kỷ niệm ấy là điều em nhớ mãi trong đời.';
const VAGUE = 'Bài thơ này rất hay và ý nghĩa.';

const joinYs = (ys: string[]) => 'Bài thơ đề cập đến: ' + ys.join('; ') + '.';

// --- bài làm diễn đạt lại (viết tay theo từng đề — KHÔNG nguyên văn barem)
const PARAPHRASE_FULL: Record<string, string> = {
  'de_01_L10:1':
    'Qua bài thơ, em hiểu rằng tinh thần vượt khó là đức tính quý báu nhất của tuổi trẻ: dám đối mặt với thử thách thay vì né tránh. ' +
    'Người sống dũng cảm, không ngừng vươn lên sẽ gặt hái được thành công và phát huy được năng lực sở trường của bản thân, từ đó ngày càng hoàn thiện mình hơn. ' +
    'Thái độ tích cực ấy còn có sức lan tỏa mạnh mẽ đến mọi người xung quanh.',
  'de_01_L10:2':
    'Bài thơ "Buổi gặt chiều" của anh thơ Quang Huy mở ra trước mắt em bức tranh thiên nhiên đồng quê yên ả thanh bình với cảnh mặt trời lặn, ' +
    'đàn cò trắng chao nghiêng, đàn diều lưng chừng gió và những con trâu bò gặm cỏ, tất cả tô đậm hình ảnh người nông dân lao động vui tươi. ' +
    'Về nghệ thuật, bài thơ viết theo thể thơ 8 chữ với cách ngắt nhịp 3/5 linh hoạt, sử dụng nhiều từ láy giàu sức gợi, hình ảnh cánh cò được nhân hóa đáng yêu ' +
    'cùng cách vắt dòng tinh tế; bài thơ được viết theo bút pháp tả thực, mang âm hưởng chung của phong trào Thơ mới.',
  'de_01_L11:1':
    'Sống trong kỷ nguyên số, người tuổi trẻ hôm nay nếu không chịu học hỏi kiến thức mới, không rèn tư duy sáng tạo và khả năng phản biện thì rất dễ tụt hậu ' +
    'trước sự phát triển như vũ bão của công nghệ 4.0, kể cả trí tuệ nhân tạo AI. Bởi vậy thế hệ trẻ phải trau dồi kỹ năng thích ứng với mọi thay đổi, ' +
    'giữ một lối sống lành mạnh và sống có trách nhiệm với gia đình, xã hội.',
  'de_01_L11:2':
    '"Bánh trôi nước" của bà Hồ Xuân Hương — bà Chúa thơ nôm — là bài thơ thất ngôn tứ tuyệt đường luật đặt theo thể vịnh vật. ' +
    'Qua hình tượng cục bánh trôi, nhà thơ dùng phép ẩn dụ giàu sức gợi, kết hợp đối thanh đối ý chặt chẽ để nói nghĩa đen lẫn nghĩa bóng: vẻ đẹp lẫn số phận ' +
    'của người phụ nữ xưa. Đằng sau đó là nỗi cảm thông sâu sắc và giá trị nhân đạo lớn lao mà "bà Chúa thơ nôm" gửi gắm.',
  'de_02_L10:1':
    'Bài thơ dùng hình ảnh thời gian trôi qua in dấu trên mẹ: mái tóc mẹ trắng theo năm tháng, tấm lưng mẹ còng xuống, còn lời ru của mẹ năm xưa đã trở thành ' +
    'đôi cánh đưa con bay xa trong cuộc đời. Tình thương bao la và lòng bao dung vô bờ cùng sự hi sinh thầm lặng của mẹ chính là điểm tựa tinh thần vững chắc ' +
    'cho cả nhà. Về hình thức, bài viết theo thể thơ 6 chữ với giọng điệu hàm súc, giàu sức gợi.',
  'de_02_L11:1':
    '"Khói bếp chiều ba mươi" của Nguyễn Trọng Hoàn khơi dậy trong em niềm cảm xúc sâu lắng: hình ảnh khói bếp trở thành biểu tượng gắn với đêm Tết đoàn viên, ' +
    'gợi nỗi nhớ nhà nhớ mẹ của người con xa quê. Bài thơ ngợi ca tình mẹ bao la và tình quê đậm đà, mang những giá trị nhân văn lớn lao; ' +
    'giọng điệu duy mỹ khiến khung cảnh cuối năm hiện lên thật đẹp lòng người đọc.',
  'de_03_L10:1':
    '"Mùa xuân nho nhỏ" của anh thơ Thanh Hải vẽ bức tranh chiều xuân đẹp lạ: mưa đổ bụi lất phất, bến vắng đò biếng lười, quán tranh im ắng và chòm xoan ' +
    'bung nở hoa tím — một không gian tĩnh lặng, yên bình đến nao lòng. Về nghệ thuật, hình ảnh con đò, dòng nước được nhân hóa rất sống động; ' +
    'cách viết gợi hình gợi cảm, có sử dụng so sánh; giọng điệu vui tươi, tha thiết suốt bài.',
  'de_03_L11:1':
    'Đoạn trích nhắn nhủ mỗi người phải dám sống là chính mình, giữ vững bản lĩnh và không sợ thể hiện cái tôi riêng của mình. ' +
    'Chỉ khi có quyết tâm cao, chúng ta mới có thể trưởng thành và khẳng định được giá trị của bản thân trước cuộc đời.',
  'de_03_L11:2':
    '"Gửi mẹ" của Lưu Quang Vũ là lời bày tỏ tình yêu mẹ tha thiết cùng nỗi hối lỗi của người con vì chưa hiếu kính. Người mẹ hiện lên với tấm lòng hy sinh ' +
    'thầm lặng, vừa gắn bó với cách mạng, giàu lòng yêu nước. Về nghệ thuật, bài thơ viết theo thể thơ tự do với giọng điệu tâm tình; cách xưng hô "mẹ - con" ' +
    'gần gũi, ngôn ngữ giản dị mà giàu sức khơi gợi, làm bật giá trị nhân văn sâu sắc.',
  'de_04_L10:1':
    '"Quê hương" của Đỗ Trung Quân gợi nhớ về những hình ảnh thân thương: chùm khế ngọt sau vườn, con đường đi học xanh bóng tre, con diều biếc no gió, ' +
    'con đò nhỏ và chiếc cầu tre nhỏ cong cong, tất cả thoang thoảng hương hoa đồng quê. Đó là những điều bình dị mộc mạc mà thân thuộc gần gũi, ' +
    'khiến người xa xứ luôn gắn bó sâu nặng với nơi chôn rau cắt rốn của mình.',
  'de_04_L11:1':
    '"Đồng đội tôi trên đảo Thuyền Chài" của Trần Đăng Khoa xoay quanh chủ đề người lính đảo nơi đầu sóng ngọn gió: các anh kiên cường bám đảo, sẵn sàng hy sinh ' +
    'để giữ vững chủ quyền biển trời, tình yêu đất nước thì sâu nặng không phai. Về nghệ thuật, tác phẩm viết theo thể thơ tự do, hài hòa chất hiện thực với ' +
    'chất lãng mạn, tạo nên âm hưởng hào hùng khiến người đọc xúc động.',
  'de_05_L10:1':
    '"Nắng mới" của Lưu Trọng Lư dựng lên hình ảnh người mẹ tân thời trong chiếc áo đỏ, gương mặt rạng rỡ với nét cười đen nhánh đầy cuốn hút — vẻ đẹp của ' +
    'người phụ nữ Việt Nam đang bước ra khỏi khuôn khổ cũ. Về hình thức, bài viết theo thể thơ bảy chữ, ngắt nhịp linh hoạt, gieo vần chân liền cách; ' +
    'từ ngữ giản dị nhưng giàu sức gợi.',
  'de_05_L11:1':
    '"Tràng giang" của Huy Cận — ngôi sao sáng của phong trào Thơ mới — tả cảnh sông nước mênh mông với con thuyền nhỏ lẻ, cành củi khô lay động trong lòng nước, ' +
    'không gian tĩnh lặng, hiu quạnh đượm màu buồn cô đơn. Phía sau cảnh vật là ngọn lửa thiêng âm ẩn — nỗi sầu nhân thế. Về nghệ thuật, bài thơ dùng bút pháp ' +
    'tả cảnh đậm chất cổ điển mà vẫn rất hiện đại, nhiều từ láy giàu sức gợi cùng phép nghệ thuật đối chuẩn mực.',
};

// bài làm diễn đạt lại CHỈ ĐẠT MỘT PHẦN ý (kiểm điểm riêng phần + chống điểm ảo)
const PARAPHRASE_PARTIAL: Record<string, { text: string; label: number[] }> = {
  'de_01_L10:1': {
    text: 'Đọc bài thơ, em ấn tượng nhất với tấm gương vượt khó của nhân vật: dám đối mặt với trở ngại để không ngừng vươn lên. Đó là thái độ tích cực mà em cần học tập.',
    label: [0, 1, 3, 8],
  },
  'de_01_L10:2': {
    text: 'Bài "Buổi gặt chiều" gợi tả cảnh gặt lúa với đàn cò trắng và những con trâu bò thong thả trên đồng; người đọc cảm nhận được niềm vui của người lao động.',
    label: [0, 5, 7, 8],
  },
  'de_01_L11:1': {
    text: 'Bài viết nhắc nhở người trẻ phải không ngừng học hỏi kiến thức, rèn tư duy sáng tạo và tinh thần phản biện để không trở thành người tụt hậu.',
    label: [0, 1, 4, 5, 6],
  },
  'de_01_L11:2': {
    text: 'Hồ Xuân Hương viết bài "Bánh trôi nước" theo lối vịnh vật, lấy chiếc bánh làm ẩn dụ cho người phụ nữ.',
    label: [0, 1, 5, 7, 11],
  },
  'de_02_L10:1': {
    text: 'Hình ảnh tóc mẹ trắng cùng lời ru thuở nhỏ khiến em xúc động; đó là biểu tượng của tình thương và sự hi sinh lớn lao của mẹ.',
    label: [1, 3, 6, 8],
  },
  'de_02_L11:1': {
    text: 'Đọc bài, em thấm thía tình mẹ và tình quê thiêng liêng qua khoảnh khắc đêm Tết.',
    label: [6, 8, 9],
  },
  'de_03_L10:1': {
    text: 'Khổ thơ mở đầu gợi khung cảnh chiều xuân với mưa đổ bụi và bến vắng, mọi thứ tĩnh lặng yên bình đến lạ.',
    label: [0, 2, 3, 7],
  },
  'de_03_L11:1': {
    text: 'Em đồng ý rằng sống là chính mình cần bản lĩnh để khẳng định giá trị riêng.',
    label: [0, 1, 5],
  },
  'de_03_L11:2': {
    text: 'Bài thơ là nỗi hối lỗi và tình yêu mẹ được gửi gắm bằng giọng điệu tâm tình day dứt.',
    label: [2, 3, 8],
  },
  'de_04_L10:1': {
    text: 'Khổ đầu gợi cả một trời kỷ niệm: chùm khế ngọt, đường đi học rợp bóng tre và con diều biếc — tất cả chính là quê hương trong trái tim em.',
    label: [0, 1, 2, 3],
  },
  'de_04_L11:1': {
    text: 'Trần Đăng Khoa khắc họa đồng đội trên đảo Thuyền Chài — những người lính đảo kiên cường, sẵn sàng hy sinh vì Tổ quốc.',
    label: [0, 1, 4, 5, 7],
  },
  'de_05_L10:1': {
    text: 'Lưu Trọng Lư khắc họa người mẹ trong "Nắng mới" qua chiếc áo đỏ rực rỡ và dáng vẻ đầy sức sống mới.',
    label: [0, 1, 2, 3],
  },
  'de_05_L11:1': {
    text: 'Huy Cận mở đầu "Tràng giang" bằng cảnh con thuyền lẻ loi, cành củi khô nhỏ bé giữa sóng nước — một không gian tĩnh lặng sâu thẳm.',
    label: [0, 1, 6, 8, 9],
  },
};

// biên dạng số (chỉ áp cho câu có ý chứa số) — test nguyên tắc "số bắt buộc đúng"
const DIGIT_EDGE: Record<string, Sample[]> = {
  'de_01_L10:2': [
    {
      key: 'de_01_L10:2',
      arch: 'SAI-SO (5 chữ / nhịp 4/4)',
      text: 'Bài thơ viết theo thể thơ 5 chữ với cách ngắt nhịp 4/4, dùng từ láy và nhân hóa rất hiệu quả.',
      label: [11, 12],
    },
    {
      key: 'de_01_L10:2',
      arch: 'ĐÚNG-SO-diễn-giải (3 rồi 5)',
      text: 'Về hình thức, đây là thơ tám chữ, được ngắt nhịp thành 3 rồi 5 vì vậy câu thơ có nhạc điệu rất độc đáo.',
      // GV công nhận cả ý "thể thơ 8 chữ" (viết bằng chữ "tám") và ý "ngắt nhịp 3/5"
      label: [9, 10],
    },
  ],
};

function buildSamples(qs: LoadedQ[]): Sample[] {
  const samples: Sample[] = [];
  for (const q of qs) {
    const key = `${q.de}:${q.qIdx}`;
    const n = q.ys.length;
    const half = Math.ceil(n / 2);
    samples.push(
      { key, arch: 'NGUYEN-VAN-du-y', text: joinYs(q.ys), label: q.ys.map((_, i) => i) },
      { key, arch: 'KHONG-DAU-du-y', text: normVN(joinYs(q.ys)), label: q.ys.map((_, i) => i) },
      { key, arch: 'DIEN-DAT-LAI-du-y', text: PARAPHRASE_FULL[key] ?? '', label: q.ys.map((_, i) => i) },
      { key, arch: 'DIEN-DAT-LAI-mot-phan', text: PARAPHRASE_PARTIAL[key]?.text ?? '', label: PARAPHRASE_PARTIAL[key]?.label ?? [] },
      { key, arch: 'NGUYEN-VAN-nua-y', text: joinYs(q.ys.slice(0, half)), label: q.ys.slice(0, half).map((_, i) => i) },
      { key, arch: 'MAU-ME-khong-noi-dung', text: FLUFF, label: [] },
      { key, arch: 'LECH-DE-TAI', text: WRONG_TOPIC, label: [] },
      { key, arch: 'CAU-QUA-ngan', text: VAGUE, label: [] },
      ...(DIGIT_EDGE[key] ?? []),
    );
  }
  return samples.filter((s) => s.text.length > 0);
}

// ---------------------------------------------------------------- 2 phương pháp chấm
function gradeOld(ys: string[], answer: string): boolean[] {
  const a = answer.toLowerCase();
  return ys.map((y) => a.includes(y.toLowerCase()));
}
function gradeNew(ys: string[], answer: string): boolean[] {
  const g = gradeQuestion(ys, answer);
  return ys.map((y) => g.matchedY.includes(y));
}

// ---------------------------------------------------------------- đo lường
interface Confusion {
  tp: number; fp: number; fn: number; tn: number;
}
const emptyConf = (): Confusion => ({ tp: 0, fp: 0, fn: 0, tn: 0 });

function metrics(c: Confusion) {
  const prec = c.tp + c.fp > 0 ? c.tp / (c.tp + c.fp) : 0;
  const rec = c.tp + c.fn > 0 ? c.tp / (c.tp + c.fn) : 0;
  const f1 = prec + rec > 0 ? (2 * prec * rec) / (prec + rec) : 0;
  const total = c.tp + c.fp + c.fn + c.tn;
  return {
    precision: prec,
    recall: rec,
    f1,
    accuracy: total > 0 ? (c.tp + c.tn) / total : 0,
  };
}

// ---------------------------------------------------------------- CSV helpers
function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

// ---------------------------------------------------------------- main
function main() {
  const qs = loadQuestions();
  const samples = buildSamples(qs);
  const qByKey = new Map(qs.map((q) => [`${q.de}:${q.qIdx}`, q]));

  const confOld = emptyConf();
  const confNew = emptyConf();
  let maeOldSum = 0, maeNewSum = 0;
  let diemOanOld = 0, diemOanNew = 0;   // GV công nhận nhưng máy trượt → HS mất oan điểm
  let diemAoOld = 0, diemAoNew = 0;     // máy cho điểm dù GV không công nhận → điểm ảo
  const rows: string[] = [];
  const perQuestion: Record<string, { old: Confusion; new: Confusion; maeOld: number; maeNew: number; samples: number }> = {};

  for (const s of samples) {
    const q = qByKey.get(s.key)!;
    const labelSet = new Set(s.label);
    const oldRes = gradeOld(q.ys, s.text);
    const newRes = gradeNew(q.ys, s.text);

    const humanDiem = q.max * (s.label.length / q.ys.length);
    const oldDiem = q.max * (oldRes.filter(Boolean).length / q.ys.length);
    const newDiem = q.max * (newRes.filter(Boolean).length / q.ys.length);
    maeOldSum += Math.abs(oldDiem - humanDiem);
    maeNewSum += Math.abs(newDiem - humanDiem);
    if (humanDiem - oldDiem > 0.005) diemOanOld++;
    if (humanDiem - newDiem > 0.005) diemOanNew++;
    if (oldDiem - humanDiem > 0.005) diemAoOld++;
    if (newDiem - humanDiem > 0.005) diemAoNew++;

    const missing = (res: boolean[]) =>
      q.ys.filter((_, i) => labelSet.has(i) && !res[i]).map((y) => `#${i0(q.ys, y)} ${y}`);
    const extra = (res: boolean[]) =>
      q.ys.filter((_, i) => !labelSet.has(i) && res[i]).map((y) => `#${i0(q.ys, y)} ${y}`);
    const oldMissing = missing(oldRes), newMissing = missing(newRes);
    const oldExtra = extra(oldRes), newExtra = extra(newRes);

    const pq = (perQuestion[s.key] ??= { old: emptyConf(), new: emptyConf(), maeOld: 0, maeNew: 0, samples: 0 });
    pq.samples++;

    q.ys.forEach((_, i) => {
      const l = labelSet.has(i);
      const o = oldRes[i], w = newRes[i];
      if (l && o) confOld.tp++; else if (!l && o) confOld.fp++; else if (l && !o) confOld.fn++; else confOld.tn++;
      if (l && w) confNew.tp++; else if (!l && w) confNew.fp++; else if (l && !w) confNew.fn++; else confNew.tn++;
      if (l && o) pq.old.tp++; else if (!l && o) pq.old.fp++; else if (l && !o) pq.old.fn++; else pq.old.tn++;
      if (l && w) pq.new.tp++; else if (!l && w) pq.new.fp++; else if (l && !w) pq.new.fn++; else pq.new.tn++;
    });
    pq.maeOld += Math.abs(oldDiem - humanDiem);
    pq.maeNew += Math.abs(newDiem - humanDiem);

    rows.push([
      s.key, q.max, s.arch,
      s.label.length, oldRes.filter(Boolean).length, newRes.filter(Boolean).length,
      humanDiem.toFixed(2), oldDiem.toFixed(2), newDiem.toFixed(2),
      Math.abs(oldDiem - humanDiem).toFixed(2), Math.abs(newDiem - humanDiem).toFixed(2),
      oldMissing.join(' | '), newMissing.join(' | '), oldExtra.join(' | '), newExtra.join(' | '),
      s.text,
    ].map(csvCell).join(','));
  }

  const mOld = metrics(confOld), mNew = metrics(confNew);
  const maeOld = maeOldSum / samples.length, maeNew = maeNewSum / samples.length;

  // ---- in báo cáo
  const line = '='.repeat(78);
  console.log(line);
  console.log('KIỂM ĐỊNH KHOA HỌC BỘ CHẤM BAREM THEO Ý — VIET-POET EXAM (seed-free, offline)');
  console.log(line);
  console.log(`Dữ liệu: ${qs.length} câu Viết văn / ${qs.reduce((a, b) => a + b.ys.length, 0)} ý barem thật (10 đề, public/practice_data)`);
  console.log(`Bộ mẫu có nhãn người lệ: n = ${samples.length} bài làm × mọi ý = ${(confOld.tp + confOld.fp + confOld.fn + confOld.tn).toLocaleString('vi-VN')} quyết định ĐẠT/KHÔNG-ĐẠT mỗi phương pháp\n`);

  const row = (name: string, c: Confusion, m: ReturnType<typeof metrics>, mae: number, oan: number, ao: number) =>
    console.log(
      `${name.padEnd(28)} Acc=${(m.accuracy * 100).toFixed(1)}%  P=${(m.precision * 100).toFixed(1)}%  R=${(m.recall * 100).toFixed(1)}%  F1=${(m.f1 * 100).toFixed(1)}%  MAE=${mae.toFixed(3)}đ  trượt-oan=${oan}  điểm-ảo=${ao}`
    );
  console.log('--- So sánh hai phương pháp (micro-average trên từng cặp mẫu×ý) ---');
  row('BẢN CŨ (so nguyên văn)', confOld, mOld, maeOld, diemOanOld, diemAoOld);
  row('BẢN MỚI (barem theo ý)', confNew, mNew, maeNew, diemOanNew, diemAoNew);
  console.log(`\nMa trận nhầm lẫn per-ý  [TP FP; FN TN]`);
  console.log(`  bản cũ: TP=${confOld.tp} FP=${confOld.fp} FN=${confOld.fn} TN=${confOld.tn}`);
  console.log(`  bản mới: TP=${confNew.tp} FP=${confNew.fp} FN=${confNew.fn} TN=${confNew.tn}`);

  console.log('\n--- Chi tiết theo từng câu (bản mới) ---');
  for (const [key, pq] of Object.entries(perQuestion)) {
    const m = metrics(pq.new);
    const mo = metrics(pq.old);
    console.log(
      `  ${key.padEnd(14)} n=${String(pq.samples).padStart(2)}  old F1=${(mo.f1 * 100).toFixed(0)}%  new F1=${(m.f1 * 100).toFixed(0)}%  new P=${(m.precision * 100).toFixed(0)}% R=${(m.recall * 100).toFixed(0)}%  MAE ${(pq.maeOld / pq.samples).toFixed(2)}→${(pq.maeNew / pq.samples).toFixed(2)}đ`
    );
  }

  // ---- xuất file
  const outDir = path.join(__dirname, 'python-backend', 'eval_results');
  fs.mkdirSync(outDir, { recursive: true });

  const header = 'de_cau,max_score,kieu_mau,y_gv_cong_nhan,old_dat,new_dat,diem_gv,diem_old,diem_new,err_old,err_new,old_truot_y,new_truot_y,old_diem_ao_y,new_diem_ao_y,bai_lam';
  fs.writeFileSync(path.join(outDir, 'barem_per_sample_results.csv'), '\uFEFF' + header + '\n' + rows.join('\n'), 'utf8');

  const summary = {
    thoi_diem: new Date().toISOString(),
    mo_ta: 'Kiểm định khoa học bộ chấm barem theo ý — VIET-POET EXAM. Nhãn người lệ do đội chấm tay theo barem giáo viên trên barem thật 10 đề.',
    du_lieu: {
      nguon: 'public/practice_data/de_*.json (barem thật 13 câu Viết văn)',
      so_cau: qs.length,
      so_y: qs.reduce((a, b) => a + b.ys.length, 0),
      so_mau: samples.length,
      so_quyet_dinh_per_phuong_phap: confOld.tp + confOld.fp + confOld.fn + confOld.tn,
    },
    phuong_phap: {
      old_baseline: 'so nguyen van: answer.toLowerCase().includes(y.toLowerCase())',
      new: 'src/lib/baremGrader.ts: khử dấu + từ nội dung (bỏ stopword) + gốc từ + đồng nghĩa + ý thuần số bắt buộc đúng số',
    },
    ket_qua: {
      old: { ...mOld, confusion: confOld, mae_diem: maeOld, bai_truot_oan: diemOanOld, bai_diem_ao: diemAoOld },
      new: { ...mNew, confusion: confNew, mae_diem: maeNew, bai_truot_oan: diemOanNew, bai_diem_ao: diemAoNew },
    },
    per_question: Object.fromEntries(
      Object.entries(perQuestion).map(([k, v]) => [k, { samples: v.samples, old: metrics(v.old), new: metrics(v.new), mae_old: v.maeOld / v.samples, mae_new: v.maeNew / v.samples }])
    ),
  };
  fs.writeFileSync(path.join(outDir, 'barem_summary.json'), JSON.stringify(summary, null, 2), 'utf8');

  console.log(`\nĐã xuất:\n  ${path.join('python-backend', 'eval_results', 'barem_per_sample_results.csv')} (utf-8 BOM, mở Excel trực tiếp)\n  ${path.join('python-backend', 'eval_results', 'barem_summary.json')}`);
}

/** chỉ số của ý y trong danh sách (để in nhãn #k dễ đối chiếu) */
function i0(ys: string[], y: string): number {
  return ys.indexOf(y);
}

main();
