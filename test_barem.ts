/**
 * TEST BAREM GRADER — chấm theo ý (07/09/2026)
 * Chạy: npx tsx test_barem.ts
 * Kiểm chứng đúng yêu cầu của đội: "chỉ cần có ý đúng là được điểm,
 * không cần đúng 100% nguyên câu".
 */
import { gradeQuestion, normVN, contentTokens, applySynonyms } from './src/lib/baremGrader';

let pass = 0;
let fail = 0;

function check(name: string, cond: boolean, detail = '') {
  if (cond) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name} ${detail}`);
  }
}

console.log('== 1. Nguyên văn: viết đủ ý nguyên văn thì đạt 100% ==');
{
  const g = gradeQuestion(
    ['tinh thần vượt khó', 'vươn lên trong cuộc sống', 'thành công'],
    'Bài thơ nói về tinh thần vượt khó, ý chí vươn lên trong cuộc sống để đạt thành công.'
  );
  check('đủ 3/3 ý', g.matchedCount === 3 && g.ratio === 1, `ra ${g.matchedCount}/${g.totalCount}`);
}

console.log('== 2. Không dấu: gõ không dấu vẫn chấm như có dấu ==');
{
  const coDau = gradeQuestion(['Buổi gặt chiều', 'bức tranh thiên nhiên'], 'Bài Buổi gặt chiều mở ra bức tranh thiên nhiên đồng quê.');
  const khongDau = gradeQuestion(['Buổi gặt chiều', 'bức tranh thiên nhiên'], 'Bai Buoi gat chieu mo ra buc tranh thien nhien dong que.');
  check('có dấu đạt 2/2', coDau.matchedCount === 2, `ra ${coDau.matchedCount}`);
  check('không dấu đạt 2/2 (bằng có dấu)', khongDau.matchedCount === coDau.matchedCount, `ra ${khongDau.matchedCount}`);
}

console.log('== 3. Diễn đạt lại bằng từ khác: KHÔNG nguyên văn vẫn đạt ý ==');
{
  const g = gradeQuestion(['tinh thần vượt khó'], 'Em ấn tượng với hình ảnh con người kiên trì vượt qua mọi khó khăn, thử thách.');
  check('ý "tinh thần vượt khó" đạt khi paraphrase', g.matchedCount === 1, `ra ${g.matchedCount}`);
}
{
  const g = gradeQuestion(['vươn lên'], 'Con người luôn cố gắng vươn tới những điều tốt đẹp hơn.');
  check('từ gốc "vươn" khớp "vươn tới"', g.matchedCount === 1, `ra ${g.matchedCount}`);
}

console.log('== 4. Sai nội dung thì KHÔNG đạt ý (không điểm ảo) ==');
{
  const g = gradeQuestion(['tinh thần vượt khó'], 'Bài thơ kể chuyện thần lúa của người Việt cổ.');
  check('nội dung khác → 0 ý', g.matchedCount === 0, `ra ${g.matchedCount}`);
}
{
  const g = gradeQuestion(['nhân hóa'], 'Nhà thơ dùng lối hoá thân trong bài thơ.');
  check('chỉ "hoá" thiếu "nhân" → không đạt ý "nhân hóa"', g.matchedCount === 0, `ra ${g.matchedCount}`);
}

console.log('== 5. Từ đồng nghĩa cơ bản ==');
{
  const g = gradeQuestion(['bút pháp tả thực'], 'Thi sĩ vận dụng thủ pháp tả thực để khắc hoạ làng quê.');
  check('thủ pháp ~ bút pháp', g.matchedCount === 1, `ra ${g.matchedCount}`);
}
{
  const g = gradeQuestion(['hình tượng người mẹ'], 'Hình ảnh người mẹ hiện lên đẹp và hiền hoà.');
  check('hình ảnh ~ hình tượng', g.matchedCount === 1, `ra ${g.matchedCount}`);
}

console.log('== 6. Ý chứa số: bắt buộc đúng con số ==');
{
  const dung = gradeQuestion(['ngắt nhịp 3/5'], 'Bài thơ được ngắt nhịp 3/5 rất linh hoạt.');
  const sai = gradeQuestion(['ngắt nhịp 3/5'], 'Bài thơ được ngắt nhịp 4/4.');
  check('đúng số 3/5 → đạt', dung.matchedCount === 1, `ra ${dung.matchedCount}`);
  check('sai số 4/4 → không đạt', sai.matchedCount === 0, `ra ${sai.matchedCount}`);
}

console.log('== 7. Bài trắng / bài ngắn ==');
{
  const g = gradeQuestion(['ý một', 'ý hai', 'ý ba'], '');
  check('bài trắng → 0 ý, ratio 0', g.matchedCount === 0 && g.ratio === 0);
  const g2 = gradeQuestion(['chiều xuân', 'mưa đổ bụi', 'bến vắng', 'đò biếng lười', 'quán tranh', 'chòm xoan hoa tím'], 'Đoạn thơ tả buổi chiều xuân với mưa đổ bụi ở bến vắng.');
  check('đạt 3/6 ý → ratio 0.5', g2.matchedCount === 3 && Math.abs(g2.ratio - 0.5) < 1e-9, `ra ${g2.matchedCount}/${g2.totalCount} ratio=${g2.ratio}`);
}

console.log('== 8. Điểm câu theo max_score × tỷ lệ ý (mô phỏng cách PracticePage tính) ==');
{
  const g = gradeQuestion(['a b c d'.split(' ').join(' ')], ''); // placeholder tránh lỗi lint
  void g;
  const grade = gradeQuestion(['bức tranh thiên nhiên', 'yên ả thanh bình', 'lao động vui tươi'], 'bức tranh thiên nhiên hiện lên yên ả thanh bình');
  const maxScore = 4.0;
  const diem = Math.round(maxScore * grade.ratio * 100) / 100;
  check('2/3 ý của câu 4 điểm → được 2.67 điểm (không phải 0)', grade.matchedCount === 2 && diem === 2.67, `ra ${grade.matchedCount} ý, ${diem} điểm`);
}

console.log('== 9. Tiện ích chuẩn hoá ==');
{
  check('normVN("Bảy nổi ba chìm") = "bay noi ba chim"', normVN('Bảy nổi ba chìm') === 'bay noi ba chim');
  check('applySynonyms khử dấu hoạt động', applySynonyms(normVN('thủ pháp')) === 'but phap');
  check('contentTokens bỏ stopword "của/và"', JSON.stringify(contentTokens(normVN('bức tranh của thiên nhiên và làng quê'))) === JSON.stringify(['buc', 'tranh', 'thien', 'nhien', 'lang', 'que']));
}

console.log(`\nKET QUA: ${pass} PASS / ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
