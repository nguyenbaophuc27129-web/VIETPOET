# -*- coding: utf-8 -*-
r"""
XUAT PROMPT LOG — VIET-POET-ALYZER 2.0
======================================
Xuất toàn bộ LỊCH SỬ CHỈ ĐẠO AI (các câu người dùng gõ trong Claude Code) từ file
transcript .jsonl gốc thành các file Markdown dễ đọc, để:
  1. Nộp làm Prompt Log theo Điều 5 Thể lệ AI 2026 (kê khai trung thực).
  2. Làm minh chứng tư duy ra quyết định của đội: mỗi "CHỈ ĐẠO" là một yêu cầu
     thực tế của thành viên đội — không bịa, không sửa.

Cách chạy (từ thư mục KE_KHAI_AI):
    python xuat_prompt_log.py
Tuỳ chọn:
    --dir  "C:\Users\Admin\.claude\projects"   thư mục gốc chứa transcript
    --out  "PROMPT-LOG"                        thư mục xuất kết quả
    --all                                      xuất mọi dự án (mặc định chỉ
                                               lọc các dự án chứa 'viet-poet')
Chỉ dùng thư viện chuẩn Python. File gốc .jsonl KHÔNG bị thay đổi.
"""
import argparse
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Windows console: in được tiếng Việt
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

VN_TZ = timedelta(hours=7)  # hiển thị giờ Việt Nam (timestamp gốc là UTC)
GT_ABOVE = 12000            # quá dài thì cắt bớt phần giữa, giữ nguyên tôn chỉ


def fmt_time(ts: str) -> str:
    try:
        dt = datetime.fromisoformat(ts.replace("Z", "+00:00")) + VN_TZ
        return dt.strftime("%H:%M:%S %d/%m/%Y")
    except Exception:
        return "?"


def human_text(entry: dict) -> str:
    """Lấy văn bản người dùng thật từ 1 dòng transcript; trả '' nếu là noise."""
    if entry.get("type") != "user" or entry.get("isMeta"):
        return ""
    msg = entry.get("message") or {}
    if msg.get("role") != "user":
        return ""
    content = msg.get("content")
    if isinstance(content, str):
        text = content
    elif isinstance(content, list):
        parts = [p.get("text", "") for p in content
                 if isinstance(p, dict) and p.get("type") == "text"]
        text = "\n".join(t for t in parts if t)
    else:
        return ""
    text = text.strip()
    if not text:
        return ""
    # Bỏ kết quả lệnh hệ thống (không phải lời của người)
    if text.startswith("<local-command-stdout>") or text.startswith("Caveat:"):
        return ""
    # Bỏ tóm tắt tự động khi phiên nối dài + báo lỗi API (do hệ sinh ra)
    if text.startswith("This session is being continued") or text.startswith("API Error"):
        return ""
    # Bỏ khối system-reminder (do công cụ chèn, không phải người gõ)
    if "<system-reminder>" in text:
        cleaned = []
        i = 0
        while True:
            a = text.find("<system-reminder>", i)
            if a == -1:
                cleaned.append(text[i:])
                break
            cleaned.append(text[i:a])
            b = text.find("</system-reminder>", a)
            i = b + len("</system-reminder>") if b != -1 else len(text)
        text = "".join(cleaned).strip()
        if not text:
            return ""
    return text


def collapse(text: str) -> str:
    if len(text) <= GT_ABOVE:
        return text
    head, tail = text[:6000], text[-4000:]
    cut = len(text) - 10000
    return (f"{head}\n\n...[cắt bớt {cut:,} ký tự ở giữa — bản đầy đủ nằm trong "
            f"file .jsonl gốc chưa hề đụng tới]...\n\n{tail}")


def process_file(jsonl: Path) -> dict:
    entries = []
    with jsonl.open("r", encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
            except Exception:
                continue  # dòng hỏng bỏ qua, giữ trung thực phần còn lại
            text = human_text(entry)
            if text:
                entries.append((entry.get("timestamp", ""), text))
    return entries


def main():
    ap = argparse.ArgumentParser(description="Xuất Prompt Log từ transcript Claude Code")
    ap.add_argument("--dir", default=r"C:\Users\Admin\.claude\projects")
    ap.add_argument("--out", default="PROMPT-LOG")
    ap.add_argument("--all", action="store_true", help="lấy mọi dự án, không lọc")
    args = ap.parse_args()

    root = Path(args.dir)
    out = Path(__file__).resolve().parent / args.out
    if not root.exists():
        print(f"[!] Khong tim thay thu muc: {root}")
        sys.exit(1)

    projects = []
    for d in sorted(root.iterdir()):
        if d.is_dir() and (args.all or "viet-poet" in d.name.lower()):
            projects.append(d)
    if not projects:
        print("[!] Khong co du an nao khop bo loc. Thu lai voi --all")
        sys.exit(1)

    out.mkdir(exist_ok=True)
    summary, total = [], 0
    for proj in projects:
        for jsonl in sorted(proj.glob("*.jsonl")):
            entries = process_file(jsonl)
            if not entries:
                continue
            total += len(entries)
            name = f"{proj.name[:40]}__{jsonl.stem[:40]}.md"
            dst = out / name
            lines = [
                f"# Prompt Log — {jsonl.stem}",
                "",
                f"- Dự án: `{proj.name}`",
                f"- File gốc: `{jsonl}` (nguyên trạng, không chỉnh sửa)",
                f"- Số chỉ đạo của đội: **{len(entries)}**",
                f"- Thời gian: {fmt_time(entries[0][0])} → {fmt_time(entries[-1][0])} (giờ VN)",
                "",
                "> ĐẶC ĐIỂM TRUNG THỰC: mỗi mục dưới đây là yêu cầu do thành viên đội gõ",
                "> vào công cụ AI-assisted coding (Claude Code), xuất tự động từ log gốc.",
                "",
            ]
            for i, (ts, text) in enumerate(entries, 1):
                lines.append(f"## CHỈ ĐẠO #{i} — [{fmt_time(ts)}]")
                lines.append("")
                lines.append(collapse(text))
                lines.append("")
            dst.write_text("\n".join(lines), encoding="utf-8")
            summary.append((proj.name, jsonl.name, len(entries),
                            fmt_time(entries[0][0]), fmt_time(entries[-1][0]), dst.name))
            print(f"[ok] {len(entries):4d} chi dao  <-  {jsonl.name}")

    idx = [
        "# MỤC LỤC PROMPT LOG — VIET-POET-ALYZER 2.0",
        "",
        f"- Tổng cộng: **{total}** chỉ đạo của đội, xuất từ log gốc của Claude Code.",
        "- Log gốc (.jsonl) lưu nguyên trạng trên máy; các file .md này chỉ chuyển đổi định dạng.",
        "",
        "| # | Dự án | Phiên | Số chỉ đạo | Từ | Đến | File |",
        "|---|---|---|---|---|---|---|",
    ]
    for n, (proj, sess, cnt, t0, t1, fn) in enumerate(summary, 1):
        idx.append(f"| {n} | {proj} | {sess} | {cnt} | {t0} | {t1} | {fn} |")
    (out / "00-TONG-HOP.md").write_text("\n".join(idx) + "\n", encoding="utf-8")
    print(f"\n[done] {total} chi dao / {len(summary)} phien  ->  {out}")


if __name__ == "__main__":
    main()
