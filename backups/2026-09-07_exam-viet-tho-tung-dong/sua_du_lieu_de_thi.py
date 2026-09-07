# -*- coding: utf-8 -*-
r"""
SỬA DỮ LIỆU ĐỀ THI — 07/09/2026 (VIET-POET-ALYZER 2.0)
=======================================================
Phát hiện của đội khi QA phần VIET-POET EXAM:
  1. Câu thơ trong đề bị dồn thành MỘT DÒNG khi hiển thị (HTML nuốt ký tự
     xuống dòng) — dấu ngắt câu thơ trong dữ liệu là " / " nhưng component
     chưa render theo dòng.
  2. Riêng đề de_01_L10 (bài "Buổi gặt chiều") thơ bị dính liền không cả dấu /.
  3. de_03_L10 câu Chiều Xuân kết thúc bằng dấu nháy kép sai `''`.

Cách sửa (CHỈ dữ liệu, giữ nguyên nội dung — không thêm bớt chữ):
  - Quy tắc chung: đổi " / " (space-slash-space, chuẩn ghi dòng thơ VN) thành
    xuống dòng thật "\n". Các dấu "/" văn xuôi (anh/chị, 3/5, 5/1978,
    "thật/ giả") KHÔNG có space hai bên nên không bị đụng tới — đã rà bằng
    script liệt kê toàn bộ 99 dấu "/" trong 10 đề trước khi sửa.
  - de_01_L10 WQ II.2: chèn xuống dòng tại 12 dòng thơ 8-chữ thật.
  - de_03_L10 WQ II.1: sửa `''` -> `"`.

File này giữ lại làm minh chứng quá trình phát triển (kèm bản gốc trong
practice_data/ cùng thư mục).
"""
import json
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

# Đích sửa là dữ liệu THẬT trong public/practice_data
# (bản sai đầu tiên của script trỏ vào thư mục backup này — đã sửa 07/09/2026;
#  bản gốc của 10 file vẫn được giữ nguyên trong practice_data/ cùng thư mục)
DATA = Path(__file__).resolve().parent.parent.parent / "public" / "practice_data"

# 12 dòng thật của đoạn thơ "Buổi gặt chiều" (Anh Thơ) trong de_01_L10
BUOI_GAT_LINES = [
    "Mặt trời lặn, mây còn tươi ráng đỏ,",
    "Cò từng đàn bay trắng cánh đồng xa.",
    "Tiếng diều sáo véo von cùng tiếng gió,",
    "Hoà nhịp nhàng giọng ả hái dâu ca.",
    "Trong đồng lúa tươi vàng bông rủ chín,",
    "Những trai tơ từng bọn gặt vui cười.",
    "Cùng trong lúc ông già che nón kín,",
    "Ngồi đầu bờ hút thuốc thổi từng hơi.",
    "Trên đê trắng, chỏm đầu phơ phất gió,",
    "Lũ cu con mê mải chạy theo diều.",
    "Bỏ mặc cả trâu bò nằm vệ cỏ,",
    "Mắt mơ màng trong gợn gió hiu hiu.",
]


def walk_fix_strings(node, stats):
    """Đổi ' / ' -> '\n' trong mọi chuỗi của JSON (đệ quy)."""
    if isinstance(node, dict):
        for k, v in node.items():
            node[k] = walk_fix_strings(v, stats)
        return node
    if isinstance(node, list):
        for i, v in enumerate(node):
            node[i] = walk_fix_strings(v, stats)
        return node
    if isinstance(node, str) and " / " in node:
        n = node.count(" / ")
        stats["slash_to_newline"] += n
        return node.replace(" / ", "\n")
    return node


def main():
    stats = {"slash_to_newline": 0, "buoi_gat_fixed": 0, "quote_fixed": 0}
    files = sorted(DATA.glob("de_*.json"))
    print(f"[i] Sua {len(files)} file trong {DATA}")

    for f in files:
        d = json.loads(f.read_text(encoding="utf-8"))
        walk_fix_strings(d, stats)

        # --- de_01_L10: ngắt dòng thơ Buổi gặt chiều ---
        if f.name == "de_01_L10.json":
            q = d["writing_section"]["questions"][1]["question_text"]
            fixed = q
            for line in BUOI_GAT_LINES[1:]:  # dòng đầu đã đúng vị trí
                fixed = fixed.replace(" " + line, "\n" + line)
            if fixed != q:
                d["writing_section"]["questions"][1]["question_text"] = fixed
                stats["buoi_gat_fixed"] = 1

        # --- de_03_L10: dấu nháy kép cuối đoạn thơ Chiều Xuân ---
        if f.name == "de_03_L10.json":
            q = d["writing_section"]["questions"][0]
            if "bời.''" in q["question_text"]:
                q["question_text"] = q["question_text"].replace("bời.''", 'bời."')
                stats["quote_fixed"] = 1

        f.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n",
                     encoding="utf-8")
        print(f"[ok] {f.name}")

    print(f"\n[ket qua] {json.dumps(stats, ensure_ascii=False)}")
    print("Kiểm tra lại: mo de_01_L10.json va de_05_L11.json xem dau \\n da dung cho.")


if __name__ == "__main__":
    main()
