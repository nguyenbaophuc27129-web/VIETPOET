# Prompt Log — 0f28f37e-2ec3-441c-9146-a7aaa5c49120

- Dự án: `C--Users-Admin-Desktop-INTEL-D--li-u----L10----L10`
- File gốc: `C:\Users\Admin\.claude\projects\C--Users-Admin-Desktop-INTEL-D--li-u----L10----L10\0f28f37e-2ec3-441c-9146-a7aaa5c49120.jsonl` (nguyên trạng, không chỉnh sửa)
- Số chỉ đạo của đội: **3**
- Thời gian: 12:09:37 18/08/2026 → 12:56:56 18/08/2026 (giờ VN)

> ĐẶC ĐIỂM TRUNG THỰC: mỗi mục dưới đây là yêu cầu do thành viên đội gõ
> vào công cụ AI-assisted coding (Claude Code), xuất tự động từ log gốc.

## CHỈ ĐẠO #1 — [12:09:37 18/08/2026]

Bạn là Kỹ sư Dữ liệu AI và Chuyên gia Khảo thí Ngữ văn. Nhiệm vụ của bạn là chuyển đổi nguyên vẹn 100% nội dung Đề thi và Đáp án (Barem chấm) tôi cung cấp thành MỘT file JSON duy nhất.

🚨 QUY TẮC BÓC TÁCH (BẮT BUỘC TUÂN THỦ):
1. ZERO DATA LOSS: Không được tóm tắt, không được cắt bớt bất kỳ chữ nào trong phần "Nội dung/Hướng dẫn chấm". Phải bê nguyên xi từng câu, từng ý, từng dấu gạch đầu dòng của Đáp án vào trường "detailed_rubric".
2. BAREM KEYWORDS: Rút trích các từ/cụm từ "ăn điểm" cốt lõi nhất từ phần đáp án đưa vào mảng "barem_keywords".
3. TRẢ VỀ DUY NHẤT MÃ JSON: Không giải thích, không bọc markdown nếu không cần thiết.

⬇️ CẤU TRÚC JSON BẮT BUỘC:
{
  "test_id": "de_01_viet_thuong_khong_dau",
  "test_title": "Tên Đề Thi (Ví dụ: Đề số 1)",
  "reading_section": {
    "passage": "BÊ NGUYÊN VĂN BẢN ĐỌC HIỂU VÀO ĐÂY (Giữ nguyên định dạng, trích dẫn)",
    "questions": [
      {
        "question_id": "I.1",
        "question_text": "Nội dung câu hỏi số 1",
        "max_score": 0.75,
        "detailed_rubric": [
          "Bê nguyên xi ý 1 của đáp án / hướng dẫn chấm vào đây",
          "Bê nguyên xi ý 2 của đáp án / hướng dẫn chấm vào đây"
        ],
        "barem_keywords": ["từ khóa 1", "từ khóa 2"]
      }
    ]
  },
  "writing_section": {
    "questions": [
      {
        "question_id": "II.1",
        "question_type": "Nghị luận xã hội (hoặc Nghị luận văn học)",
        "question_text": "Nội dung câu lệnh phần Viết (kèm thơ/văn bản nếu có)",
        "max_score": 2.0,
        "detailed_rubric": [
          "Bê nguyên xi toàn bộ gạch đầu dòng, tiêu chí chấm (a, b, c, d, e), hệ thống ý (Giải thích, Ý nghĩa, Bài học...) từ ĐÁP ÁN vào đây. Tách mỗi ý lớn thành 1 phần tử trong mảng này. KHÔNG ĐƯỢC TÓM TẮT."
        ],
        "barem_keywords": ["cụm từ ăn điểm 1", "cụm từ ăn điểm 2", "cụm từ ăn điểm 3"]
      }
    ]
  }
}

INPUT DỮ LIỆU CỦA TÔI:
[=== DÁN TOÀN BỘ ĐỀ THI VÀ ĐÁP ÁN VÀO ĐÂY ===]

## CHỈ ĐẠO #2 — [12:09:55 18/08/2026]

dựa vào các file word do đội thi đã soạn trong thư mục đề thi Lớp 10

## CHỈ ĐẠO #3 — [12:56:56 18/08/2026]

tiếp tục với thư mục đề thi lớp 11
