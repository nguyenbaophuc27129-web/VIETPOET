/**
 * Test nhanh: mô phỏng đúng các hội thoại LỖI trong HOI_THOAI.txt
 * Chatbot tự quản lý trạng thái — không cần truyền history.
 * Chạy: npx tsx test_chatbot_fix.ts
 */
import { smartAI } from './src/lib/smartAI';
import type { PoemData } from './src/lib/dataLoader';

const poem: PoemData = {
  document_id: 'test_poem',
  general_knowledge: {
    author_and_work: 'Tác giả: Hồ Xuân Hương. Bài thơ viết về người thiếu phụ Tây dương trong một đêm trăng trên biển.'
  },
  detailed_analysis: [
    {
      section_name: '1. Khổ 1 - Người thiếu phụ Tây dương',
      original_text: [
        'Thiếu phụ Tây dương áo trắng phau',
        'Tựa vai chồng dưới bóng trăng thâu'
      ],
      x_ray_data: [
        { target_words: 'áo trắng phau', art_type: 'Hình ảnh', effect: 'Gợi vẻ đẹp trắng trong, thuần khiết' },
        { target_words: 'Tựa vai chồng', art_type: 'Chi tiết nghệ thuật', effect: 'Thể hiện sự yêu thương, nũng nịu' }
      ],
      section_outline: [
        { point: 'Khung cảnh đêm trăng trên biển', details: ['Áo trắng như tuyết'], conclusion: 'Vẻ đẹp thuần khiết' }
      ]
    },
    {
      section_name: '2. Khổ 2 - Cốc sữa hững hờ',
      original_text: ['Trên tay nàng hững hờ cốc sữa biếng cầm tay'],
      x_ray_data: [
        { target_words: 'hững hờ', art_type: 'Từ láy', effect: 'Gợi thái độ thờ ơ, lười biếng đáng yêu' }
      ],
      section_outline: [
        { point: 'Cử chỉ nũng nịu', details: [], conclusion: 'Nàng đang hạnh phúc lứa đôi' }
      ]
    }
  ]
};

let pass = 0, fail = 0;
function check(name: string, cond: boolean) {
  if (cond) { pass++; console.log(`  [PASS] ${name}`); }
  else { fail++; console.log(`  [FAIL] ${name}`); }
}

console.log('=== TEST FIX CHATBOT (theo HOI_THOAI.txt) ===\n');

// Lỗi #4: xin kết quả/bài mẫu → từ chối Socratic + hướng dẫn tự viết
let r = smartAI.analyzePoem(poem, 'không biết cho tôi kết quả luôn đi');
console.log('Input: "không biết cho tôi kết quả luôn đi"\n' + r.content + '\n');
check('Từ chối rõ ràng (Socratic)', r.content.includes('không thể cho bài mẫu'));
check('Có hướng dẫn 3 bước tự viết', r.content.includes('Bước 1') && r.content.includes('Bước 3'));

// "tôi nên làm gì" → menu hành động, không phải chuỗi rối
r = smartAI.analyzePoem(poem, 'tôi nên làm gì');
console.log('Input: "tôi nên làm gì"\n' + r.content + '\n');
check('Có menu 3 lựa chọn', r.content.includes('1.') && r.content.includes('2.') && r.content.includes('3.'));
check('Không có chuỗi rối kiểu "a) Hai câu đề:"', !r.content.includes('a)'));

// Lỗi #2: bức xúc ×2 → KHÔNG lặp y nguyên
const r1 = smartAI.analyzePoem(poem, 'ai mà biết trời ơi');
console.log('Input: "ai mà biết trời ơi"\n' + r1.content + '\n');
const r2 = smartAI.analyzePoem(poem, 'ai mà biết trời ơi');
console.log('Input (lần 2): "ai mà biết trời ơi"\n' + r2.content + '\n');
check('Không lặp y nguyên lần 2', r1.content !== r2.content);
check('Chỉ 1 câu mở đầu (không chồng)', (r2.content.match(/:/g) || []).length >= 1 && !r2.content.includes('luôn:\n\nOK'));

// Lỗi #3: "không biết" → giảng, KHÔNG khen "Đúng!"
r = smartAI.analyzePoem(poem, 'không biết');
console.log('Input: "không biết"\n' + r.content + '\n');
check('Không khen "Đúng!" khi HS nói không biết', !r.content.includes('Đúng!'));
check('Có giảng khái niệm thật từ data', r.content.includes('Biện pháp:'));
check('Dữ liệu sạch (trích dẫn câu thơ gốc)', r.content.includes('> '));

// "cho bài mẫu" riêng → từ chối, KHÔNG đưa bài hướng dẫn chi tiết kiểu bài mẫu
r = smartAI.analyzePoem(poem, 'cho bài mẫu');
console.log('Input: "cho bài mẫu"\n' + r.content + '\n');
check('Từ chối + 3 bước tự viết (không viết thay)', r.content.includes('tự viết') && !r.content.includes('PHÂN TÍCH TOÀN'));

// "không tìm được" → giảng, không khen
r = smartAI.analyzePoem(poem, 'không tìm được');
console.log('Input: "không tìm được"\n' + r.content.slice(0, 150) + '...\n');
check('Không nói "Đúng!"', !r.content.includes('Đúng!'));

// Câu hỏi bình thường vẫn hoạt động
r = smartAI.analyzePoem(poem, 'cho mình biết về tác giả');
console.log('Input: "cho mình biết về tác giả"\n' + r.content.slice(0, 150) + '\n');
check('Hỏi tác giả OK', r.content.includes('Tác giả') || r.content.includes('Hồ Xuân Hương'));

console.log(`\n=== KẾT QUẢ: ${pass} PASS / ${fail} FAIL ===`);
process.exit(fail > 0 ? 1 : 0);
