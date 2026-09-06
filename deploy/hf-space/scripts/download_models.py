#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VIET-POET-ALYZER 2.0 — Tải AI models về máy (chạy 1 lần, cần Internet)

Tải 2 model về python-backend/models/:
1. Qwen2.5-1.5B-Instruct (Intel OpenVINO INT8) ~1.4GB — máy chủ AI trả lời tự nhiên
2. keepitreal/vietnamese-sbert ~500MB — nhúng vector cho RAG

Sau khi tải xong, toàn bộ hệ thống chạy 100% OFFLINE.
"""
import sys
from pathlib import Path

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# models/ nằm cạnh thư mục chứa script này (python-backend/ hoặc /app trong Docker)
BASE = Path(__file__).resolve().parent.parent
MODELS = BASE / 'models'
MODELS.mkdir(parents=True, exist_ok=True)

QWEN_DIR = MODELS / 'qwen2.5-1.5b-ov-int8'
SBERT_DIR = MODELS / 'vietnamese-sbert'


def download_qwen_openvino() -> None:
    if QWEN_DIR.exists() and (QWEN_DIR / 'openvino_model.xml').exists():
        print(f'[1/2] Qwen2.5 OpenVINO INT8 đã có sẵn: {QWEN_DIR.name} — bỏ qua')
        return
    print('[1/2] Đang tải Qwen2.5-1.5B-Instruct INT8 (Intel OpenVINO) ~1.4GB ...')
    from huggingface_hub import snapshot_download
    snapshot_download(
        repo_id='OpenVINO/Qwen2.5-1.5B-Instruct-int8-ov',
        local_dir=str(QWEN_DIR),
    )
    print(f'      ✅ Xong: {QWEN_DIR}')


def download_sbert() -> None:
    if SBERT_DIR.exists() and (SBERT_DIR / 'model.safetensors').exists():
        print(f'[2/2] Vietnamese SBERT đã có sẵn: {SBERT_DIR.name} — bỏ qua')
        return
    print('[2/2] Đang tải keepitreal/vietnamese-sbert ~500MB ...')
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer('keepitreal/vietnamese-sbert')
    model.save(str(SBERT_DIR))
    print(f'      ✅ Xong: {SBERT_DIR}')


if __name__ == '__main__':
    print('=' * 60)
    print(' VIET-POET-ALYZER 2.0 — TẢI AI MODELS (chỉ chạy lần đầu)')
    print('=' * 60)
    download_qwen_openvino()
    download_sbert()
    print()
    print('🎉 Hoàn tất! Từ giờ sản phẩm chạy 100% OFFLINE.')
