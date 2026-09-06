#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VIET-POET-ALYZER - Socratic LLM Generator (Tuần 3)
Sinh câu trả lời tự nhiên bằng Qwen2.5-1.5B-Instruct, tối ưu Intel OpenVINO INT8.

Backend (tự chọn khi load):
1. 'openvino'  — model IR INT8 tại models/qwen2.5-1.5b-ov-int8 (nhanh, khuyến nghị)
2. 'transformers' — PyTorch fp32 từ cache HF (chậm hơn, dùng để so sánh)

Bật server chế độ LLM: đặt VIETPOET_LLM=true (dùng START_RAG_LLM.bat).
Tắt (mặc định): server dùng template Socratic nhanh (~200ms).

Nguyên tắc sinh câu trả lời:
1. CHỈ dùng ngữ cảnh RAG (zero hallucination)
2. KHÔNG viết bài mẫu / đáp án trọn vẹn (Socratic)
3. Luôn kết thúc bằng câu hỏi gợi mở
"""
import sys
import time
from pathlib import Path
from typing import Optional

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# Model chính: Qwen2.5-1.5B (tốt hơn hẳn 0.5B về làm theo hướng dẫn + tiếng Việt)
MODEL_NAME = 'Qwen/Qwen2.5-1.5B-Instruct'
# Model nhỏ dự phòng nếu chưa tải 1.5B
FALLBACK_MODEL_NAME = 'Qwen/Qwen2.5-0.5B-Instruct'
# Thư mục model OpenVINO IR INT8 (do optimum-cli export tạo ra)
OV_MODEL_DIR = Path(__file__).parent / 'models' / 'qwen2.5-1.5b-ov-int8'

SYSTEM_PROMPT = (
    'Bạn là trợ lý dạy học Ngữ văn THPT, trả lời CHO HỌC SINH bằng tiếng Việt.\n'
    'QUY TẮC: chỉ dùng NGỮ CẢNH đã cho, không bịa thêm. '
    'Câu trả lời gồm đúng 2 phần:\n'
    '(1) 1-2 câu giải thích dựa vào ngữ cảnh, in đậm từ khóa chính bằng ** **;\n'
    '(2) 1 câu hỏi gợi mở bắt đầu bằng "💭" để học sinh tự suy nghĩ.\n'
    'KHÔNG viết bài văn dài. KHÔNG đưa đáp án trọn vẹn.\n\n'
    'VÍ DỤ:\n'
    'Ngữ cảnh: "- Tựa vai chồng: Hành động - Sự âu yếm, gần gũi với chồng"\n'
    'Câu hỏi: "Chi tiết tựa vai chồng nói lên điều gì?"\n'
    'Trả lời: "Chi tiết **Tựa vai chồng** cho thấy sự âu yếm, gần gũi giữa nàng và chồng. '
    '💭 Theo bạn, cử chỉ này thể hiện tâm trạng của nhân vật như thế nào?"'
)


class SocraticLLM:
    """Wrapper LLM Socratic — backend OpenVINO INT8 (ưu tiên) hoặc transformers"""

    def __init__(self, backend: str = 'auto', model_name: str = MODEL_NAME,
                 ov_model_dir: Path = OV_MODEL_DIR):
        self.requested_backend = backend
        self.model_name = model_name
        self.ov_model_dir = Path(ov_model_dir)
        self.backend: Optional[str] = None  # 'openvino' | 'transformers'
        self.pipe = None          # openvino_genai.LLMPipeline
        self.tokenizer = None     # transformers tokenizer
        self.model = None         # transformers model
        self._loaded = False

    # ---------------- LOAD ----------------
    def load(self):
        if self._loaded:
            return
        last_err = None

        if self.requested_backend in ('auto', 'openvino') and self.ov_model_dir.exists():
            try:
                self._load_openvino()
                return
            except Exception as e:
                last_err = e
                print(f'⚠️ OpenVINO backend lỗi: {e} — thử transformers...')

        try:
            self._load_transformers()
            return
        except Exception as e:
            last_err = e

        raise RuntimeError(f'Không load được LLM: {last_err}')

    def _load_openvino(self):
        import openvino_genai

        print(f'🧠 Loading LLM OpenVINO INT8: {self.ov_model_dir.name} (CPU, offline)...')
        t0 = time.time()
        self.pipe = openvino_genai.LLMPipeline(str(self.ov_model_dir), 'CPU')
        self.backend = 'openvino'
        self._loaded = True
        print(f'✅ LLM OpenVINO sẵn sàng ({time.time() - t0:.1f}s)')

    def _load_transformers(self):
        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer

        # Chọn model khả dụng trong cache (ưu tiên 1.5B)
        name = self.model_name
        try:
            from huggingface_hub import try_to_load_from_cache
            ok = try_to_load_from_cache(name, 'config.json') is not None
            if not ok:
                name = FALLBACK_MODEL_NAME
                print(f"⚠️ {self.model_name} chưa tải — dùng {name}")
        except Exception:
            pass

        print(f'🧠 Loading LLM transformers: {name} (CPU fp32, offline)...')
        self.tokenizer = AutoTokenizer.from_pretrained(name, local_files_only=True)
        self.model = AutoModelForCausalLM.from_pretrained(
            name, dtype='float32', device_map='cpu', local_files_only=True
        )
        self.model.eval()
        self.model_name = name
        self.backend = 'transformers'
        self._loaded = True
        print('✅ LLM transformers sẵn sàng')

    # ---------------- GENERATE ----------------
    @property
    def is_loaded(self) -> bool:
        return self._loaded

    def _build_messages(self, question: str, context: str):
        # Cắt ngữ cảnh ngắn: context dài làm model bỏ qua format Socratic
        ctx = context[:800]
        user_content = (
            f'Ngữ cảnh: {ctx}\n'
            f'Câu hỏi: "{question}"\n'
            f'Trả lời (bắt buộc 100% TIẾNG VIỆT, đúng 2 phần như ví dụ):'
        )
        return [
            {'role': 'system', 'content': SYSTEM_PROMPT},
            {'role': 'user', 'content': user_content}
        ]

    def generate_socratic(self, question: str, context: str) -> Optional[str]:
        """Sinh câu trả lời Socratic. Trả None nếu lỗi/không đạt format (caller fallback template)."""
        if not self._loaded:
            return None
        try:
            if self.backend == 'openvino':
                text = self._generate_openvino(question, context)
            else:
                text = self._generate_transformers(question, context)
        except Exception as e:
            print(f'⚠️ LLM generate lỗi: {e}')
            return None

        # Đảm bảo Socratic: thiếu câu hỏi gợi mở 💭 → từ chối, dùng template
        if text and '💭' not in text:
            print('⚠️ LLM thiếu 💭 — fallback template')
            return None
        return text

    def _generation_config(self):
        import openvino_genai
        return openvino_genai.GenerationConfig(
            max_new_tokens=220,
            repetition_penalty=1.15,
            do_sample=False
        )

    def _generate_openvino(self, question: str, context: str):
        messages = self._build_messages(question, context)

        # Ưu tiên apply_chat_template của genai tokenizer; lỗi → gửi thẳng messages
        try:
            prompt = self.pipe.get_tokenizer().apply_chat_template(
                messages, add_generation_prompt=True
            )
            result = self.pipe.generate(prompt, self._generation_config())
        except Exception:
            result = self.pipe.generate(messages, self._generation_config())

        # openvino_genai >= 2025: generate() trả str; bản cũ trả DecodedResults(.texts)
        text = result if isinstance(result, str) else result.texts[0]
        return text.strip() or None

    def _generate_transformers(self, question: str, context: str):
        import torch

        prompt_text = self.tokenizer.apply_chat_template(
            self._build_messages(question, context),
            tokenize=False, add_generation_prompt=True
        )
        inputs = self.tokenizer(prompt_text, return_tensors='pt').to(self.model.device)
        with torch.no_grad():
            out = self.model.generate(
                **inputs,
                max_new_tokens=220,
                do_sample=False,
                repetition_penalty=1.15,
                pad_token_id=self.tokenizer.eos_token_id
            )
        new_tokens = out[0][inputs['input_ids'].shape[1]:]
        text = self.tokenizer.decode(new_tokens, skip_special_tokens=True).strip()
        return text or None


if __name__ == '__main__':
    """Test + benchmark: python llm_generator.py [--bench]"""
    llm = SocraticLLM()
    llm.load()
    print(f'Backend đang dùng: {llm.backend}')

    demo_context = (
        '[1] duong_phu_hanh_cao_ba_quat (x_ray):\n'
        '- áo trắng phau: Hình ảnh màu sắc - Áo trắng như tuyết, vẻ đẹp trắng trong\n'
        '- Tựa vai chồng: Hành động - Sự âu yếm, gần gũi với chồng'
    )

    q = 'Hình ảnh áo trắng phau gợi điều gì?'
    t0 = time.time()
    out = llm.generate_socratic(q, demo_context)
    dt = time.time() - t0
    print('--- OUTPUT ---')
    print(out)
    print(f'--- {dt:.1f}s ---')

    if '--bench' in sys.argv:
        t0 = time.time()
        llm.generate_socratic('Tác dụng của từ láy trong bài thơ là gì?', demo_context)
        print(f'Benchmark câu 2: {time.time() - t0:.1f}s')
