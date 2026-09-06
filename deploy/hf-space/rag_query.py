#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VIET-POET-ALYZER - RAG Query Pipeline
Retrieval-Augmented Generation for Vietnamese Poetry Analysis

This module implements:
1. Vector similarity search using ChromaDB
2. Context building from retrieved passages
3. Socratic method prompt generation
4. LLM response generation

Usage:
    from rag_query import RAGPipeline
    rag = RAGPipeline()
    response = rag.query("Phân tích biện pháp ẩn dụ trong Sóng", poem_id="Bai1_lop11_hk1")
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime

# Fix Windows console encoding
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Configuration
# CHROMA_DIR tính từ vị trí CHÍNH FILE này (giống llm_generator/eval) để chạy đúng
# ở MỌI cấu trúc thư mục — kể cả bản đóng gói USB nơi thư mục gốc không còn là
# ProjectRoot (lỗi thực tế: packaged vào USB/server/ thì path cũ trỏ ra ngoài → mất kho tri thức)
CHROMA_DIR = Path(__file__).parent / 'chroma_db'
COLLECTION_NAME = "viet_poetry_knowledge"

# Model SBERT: ưu tiên bản copy LOCAL trong python-backend/models/vietnamese-sbert
# (đóng gói sẵn để chạy 100% OFFLINE — máy vùng núi không có Internet/HF cache).
# Nếu chưa có bản local thì mới dùng tên hub 'keepitreal/vietnamese-sbert'.
MODEL_NAME = 'keepitreal/vietnamese-sbert'
_LOCAL_SBERT = Path(__file__).parent / 'models' / 'vietnamese-sbert'
if _LOCAL_SBERT.exists():
    MODEL_NAME = str(_LOCAL_SBERT)

# Tên bài thơ thân thiện (hiển thị cho học sinh thay vì poem_id dạng slug)
POEM_TITLES = {
    'bai_ca_ngat_nguong_nguyen_cong_tru': 'Bài ca ngất ngưởng (Nguyễn Công Trứ)',
    'ban_hoa_am_ngon_tu_trong_tieng_thu_luu_trong_lu_chu_van_son': 'Bạn hoa âm ngôn từ trong tiếng thu (Chu Văn Sơn)',
    'bao_kinh_canh_gioi_bai_43': 'Bảo kính cảnh giới (bài 43) - Nguyễn Trãi',
    'binh_ngo_dai_cao': 'Bình Ngô đại cáo (Nguyễn Trãi)',
    'chum_tho_hai_cu_nhat_ban': 'Chùm thơ haiku Nhật Bản',
    'con_duong_mua_dong_puskin': 'Con đường mùa đông (Pu-skin)',
    'doc_tieu_thanh_ki_nguyen_du': 'Đọc Tiểu Thanh ki (Nguyễn Du)',
    'duc_thuy_son': 'Dục Thủy sơn (Nguyễn Trãi)',
    'duong_phu_hanh_cao_ba_quat': 'Dương phụ hành (Cao Bá Quát)',
    'loi_tien_dặn_tran_tho_dan_toc_thai': 'Lời tiễn dặn (truyện thơ Thái)',
    'mua_xuan_chin_han_mac_tu': 'Mùa xuân chín (Hàn Mặc Tử)',
    'nho_dong_to_huu': 'Nhớ đồng (Tố Hữu)',
    'thu_hung_cam_xuc_mua_thu_do_phu': 'Thu hứng (Đỗ Phủ)',
    'thuyen_va_bien_xuan_quynh': 'Thuyền và biển (Xuân Quỳnh)',
    'trang_giang_huy_can': 'Tràng giang (Huy Cận)',
    'trao_duyen_trich_truyen_kieu': 'Trao duyên - Truyện Kiều (Nguyễn Du)',
}


def poem_title(poem_id: Optional[str]) -> str:
    """poem_id slug -> tên bài thơ thân thiện"""
    if not poem_id:
        return 'bài thơ'
    return POEM_TITLES.get(poem_id, poem_id)

# ==================== RAG PIPELINE ====================

class RAGPipeline:
    """
    Retrieval-Augmented Generation Pipeline for VIET-POET-ALYZER

    Features:
    - Vector similarity search
    - Context building
    - Socratic method prompts
    - Source attribution
    """

    def __init__(self, model_name: str = MODEL_NAME):
        """Initialize RAG pipeline"""
        self.model_name = model_name
        self.model = None
        self.collection = None
        self._initialized = False
        self.llm = None  # SocraticLLM (tùy chọn, bật qua VIETPOET_LLM=true)

    def set_llm(self, llm) -> None:
        """Gắn LLM generator (llm_generator.SocraticLLM). None = dùng template nhanh."""
        self.llm = llm

    def initialize(self):
        """Initialize model and ChromaDB connection"""
        if self._initialized:
            return

        # Load model
        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer(self.model_name)
            print(f"✅ RAG: Loaded model {self.model_name}")
        except Exception as e:
            print(f"⚠️  RAG: Model load failed, using fallback: {e}")
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer('distiluse-base-multilingual-cased-v2')

        # Load ChromaDB
        try:
            import chromadb
            client = chromadb.PersistentClient(path=str(CHROMA_DIR))
            self.collection = client.get_collection(COLLECTION_NAME)
            count = self.collection.count()
            print(f"✅ RAG: Loaded ChromaDB ({count} passages)")
        except Exception as e:
            print(f"❌ RAG: ChromaDB load failed: {e}")
            raise

        self._initialized = True

    def query(
        self,
        question: str,
        poem_id: Optional[str] = None,
        top_k: int = 3,
        min_score: float = 0.35
    ) -> Dict[str, Any]:
        """
        Query RAG pipeline with question

        Args:
            question: User's question
            poem_id: Optional filter for specific poem
            top_k: Number of passages to retrieve
            min_score: Minimum similarity score (0-1)

        Returns:
            Dict with:
                - answer: Generated response
                - sources: List of source passages
                - confidence: Overall confidence score
                - metadata: Query metadata
        """
        if not self._initialized:
            self.initialize()

        # 1. Generate query embedding
        query_embedding = self.model.encode(
            question,
            normalize_embeddings=True,
            show_progress_bar=False
        )

        # 2. Search ChromaDB
        where_filter = {"poem_id": poem_id} if poem_id else None

        results = self.collection.query(
            query_embeddings=[query_embedding.tolist()],
            n_results=top_k * 2,  # Get more, then filter
            where=where_filter
        )

        # 3. Filter by score and build context
        passages = []
        for doc, metadata, distance in zip(
            results['documents'][0],
            results['metadatas'][0],
            results['distances'][0]
        ):
            # ChromaDB mặc định dùng L2² (khoảng cách 0→2). Với embedding chuẩn hóa:
            # L2² = 2 − 2·cos → cosine similarity = 1 − L2²/2
            similarity = max(0.0, 1 - distance / 2)
            if similarity >= min_score:
                passages.append({
                    'text': doc,
                    'metadata': metadata,
                    'score': similarity
                })

        # Keep top_k
        passages = passages[:top_k]

        if not passages:
            return {
                'answer': self._fallback_response(poem_id),
                'sources': [],
                'confidence': 0.0,
                'metadata': {
                    'poem_id': poem_id,
                    'query': question,
                    'retrieved': 0,
                    'timestamp': datetime.now().isoformat()
                }
            }

        # 4. Build context
        context = self._build_context(passages)

        # 5. Generate Socratic response
        answer = self._generate_socratic_response(question, context, passages)

        # 6. Calculate confidence
        confidence = self._calculate_confidence(passages)

        return {
            'answer': answer,
            'sources': [p['text'] for p in passages],
            'passage_metadata': [p['metadata'] for p in passages],
            'confidence': confidence,
            'metadata': {
                'poem_id': poem_id,
                'query': question,
                'retrieved': len(passages),
                'avg_score': sum(p['score'] for p in passages) / len(passages),
                'timestamp': datetime.now().isoformat()
            }
        }

    def _build_context(self, passages: List[Dict]) -> str:
        """Build context from retrieved passages"""
        context_parts = []

        for i, passage in enumerate(passages, 1):
            metadata = passage['metadata']
            poem_id = metadata.get('poem_id', 'Unknown')
            passage_type = metadata.get('type', 'passage')

            context_parts.append(
                f"[{i}] {poem_id} ({passage_type}):\n{passage['text']}"
            )

        return "\n\n---\n\n".join(context_parts)

    def _generate_socratic_response(
        self,
        question: str,
        context: str,
        passages: List[Dict]
    ) -> str:
        """
        Generate Socratic response based on retrieved context

        Key principles:
        - NEVER write essays or give direct answers
        - ALWAYS ask guiding questions
        - Encourage critical thinking
        - Reference the provided information
        """

        # Detect if user is asking for essay/direct answer
        question_lower = question.lower()
        essay_keywords = [
            'bài mẫu', 'viết bài', 'áp án', 'cho tôi',
            'giải', 'làm giúp', 'viết giúp', 'kết quả'
        ]
        is_essay_request = any(kw in question_lower for kw in essay_keywords)

        if is_essay_request:
            return self._essay_refusal_response(context, passages)

        # Ưu tiên LLM (tự nhiên hơn) nếu đã bật; lỗi → fallback template
        if self.llm is not None and getattr(self.llm, 'is_loaded', False):
            llm_answer = self.llm.generate_socratic(question, context)
            if llm_answer:
                return llm_answer

        # Build Socratic response (template nhanh ~200ms)
        poem_id = passages[0]['metadata'].get('poem_id', 'bài thơ')

        response = f"**Về {poem_title(poem_id)}:**\n\n"

        # Add key information from context (very brief)
        response += f"**Từ thông tin trong bài thơ:**\n\n"
        response += self._extract_key_points(passages)
        response += "\n\n---\n\n"

        # Socratic questions
        response += self._generate_guiding_questions(question, passages)

        return response

    def _extract_key_points(self, passages: List[Dict]) -> str:
        """Extract key points from passages (brief)"""
        points = []

        for passage in passages[:2]:  # Only top 2
            passage_type = passage['metadata'].get('type', '')
            text = passage['text']

            if passage_type == 'x_ray':
                # Extract artistic elements
                lines = text.split('\n')
                for line in lines[:3]:  # First 3 lines
                    if line.strip():
                        points.append(f"• {line.strip()}")
                        break
            else:
                # First meaningful sentence
                sentences = text.split('.')
                for sentence in sentences:
                    sentence = sentence.strip()
                    if len(sentence) > 20:
                        points.append(f"• {sentence}.")
                        break

        return '\n'.join(points[:3])  # Max 3 points

    def _generate_guiding_questions(
        self,
        question: str,
        passages: List[Dict]
    ) -> str:
        """Generate Socratic guiding questions"""
        poem_id = poem_title(passages[0]['metadata'].get('poem_id'))

        # Analyze question to determine type
        question_lower = question.lower()

        guiding_questions = []

        # Contextual questions based on passages
        if 'ẩn dụ' in question_lower or 'biện pháp' in question_lower:
            guiding_questions.append(
                "💭 **Câu hỏi gợi mở:** "
                "Bạn nghĩ hình ảnh ẩn dụ này tác giả muốn diễn tả điều gì? "
                "Hãy thử tìm trong đoạn thơ để thấy sự liên quan."
            )
        elif 'nghệ thuật' in question_lower:
            guiding_questions.append(
                "💭 **Câu hỏi gợi mở:** "
                "Trong các biện pháp nghệ thuật đã nêu, bạn thấy đặc điểm nào nổi bật nhất? "
                "Biện pháp này góp phần thể hiện cảm xúc của tác giả như thế nào?"
            )
        elif 'nội dung' in question_lower:
            guiding_questions.append(
                "💭 **Câu hỏi gợi mở:** "
                "Nội dung này gợi cho bạn suy nghĩ về điều gì? "
                "Cảm xúc của tác giả được thể hiện qua hình ảnh nào?"
            )
        else:
            # Generic guiding question
            guiding_questions.append(
                "💭 **Câu hỏi gợi mở:** "
                f"Dựa trên thông tin về {poem_id}, bạn nghĩ nên phân tích từ khía cạnh nào? "
                "(Nghệ thuật, nội dung, hay cảm xúc?)"
            )

        # Add follow-up question
        guiding_questions.append(
            "\n🤔 **Câu hỏi tiếp theo:**\n"
            "Bạn có muốn tôi giải thích sâu hơn về điểm nào không?"
        )

        return '\n'.join(guiding_questions)

    def _essay_refusal_response(self, context: str, passages: List[Dict]) -> str:
        """Response when user asks for essay/direct answer"""
        poem_id = poem_title(passages[0]['metadata'].get('poem_id'))

        response = f"**Về yêu cầu của bạn:**\n\n"
        response += f"Tôi hiểu bạn muốn tìm hiểu về {poem_id}, "
        response += "nhưng tôi không thể viết bài mẫu hay đưa đáp án trực tiếp.\n\n"

        response += "**Tôi có thể GỢI Ý để bạn tự viết:**\n\n"
        response += self._extract_key_points(passages)
        response += "\n\n---\n\n"
        response += self._generate_guiding_questions("viết bài", passages)

        return response

    def _fallback_response(self, poem_id: Optional[str]) -> str:
        """Fallback response when no passages found"""
        if poem_id:
            return f"Tôi chưa có dữ liệu chi tiết về {poem_title(poem_id)} trong cơ sở dữ liệu. "
        else:
            return "Tôi chưa tìm thấy thông tin liên quan trong cơ sở dữ liệu. "

    def _calculate_confidence(self, passages: List[Dict]) -> float:
        """Calculate overall confidence from passage scores"""
        if not passages:
            return 0.0

        # Average of top 3 scores
        scores = [p['score'] for p in passages[:3]]
        return round(sum(scores) / len(scores), 3)

# ==================== FLASK API (Optional) ====================

class RAGAPI:
    """
    Flask API wrapper for RAG pipeline
    Can be used as standalone microservice
    """

    def __init__(self, port: int = 5000):
        self.port = port
        self.rag = RAGPipeline()
        self.app = None

    def create_app(self):
        """Create Flask application"""
        try:
            from flask import Flask, request, jsonify
            from flask_cors import CORS

            app = Flask(__name__)
            CORS(app)

            @app.route('/health', methods=['GET'])
            def health():
                return jsonify({
                    'status': 'healthy',
                    'service': 'VIET-POET-ALYZER RAG API',
                    'version': '2.0'
                })

            @app.route('/query', methods=['POST'])
            def query():
                """Query RAG pipeline"""
                try:
                    data = request.json
                    question = data.get('question')
                    poem_id = data.get('poemId')
                    top_k = data.get('topK', 3)

                    if not question:
                        return jsonify({'error': 'Question required'}), 400

                    result = self.rag.query(question, poem_id, top_k)

                    return jsonify({
                        'role': 'assistant',
                        'content': result['answer'],
                        'sources': result['sources'],
                        'confidence': result['confidence'],
                        'metadata': result['metadata']
                    })

                except Exception as e:
                    return jsonify({'error': str(e)}), 500

            @app.route('/statistics', methods=['GET'])
            def statistics():
                """Get database statistics"""
                return jsonify({
                    'collection': COLLECTION_NAME,
                    'count': self.rag.collection.count(),
                    'model': self.rag.model_name
                })

            self.app = app
            return app

        except ImportError:
            print("⚠️  Flask not installed. API mode disabled.")
            print("   Install with: pip install flask flask-cors")
            return None

    def run(self, debug: bool = False):
        """Run Flask server"""
        if not self.app:
            self.create_app()

        if self.app:
            self.rag.initialize()
            print(f"🚀 RAG API starting on port {self.port}...")
            self.app.run(host='0.0.0.0', port=self.port, debug=debug)

# ==================== CLI INTERFACE ====================

def main():
    """CLI interface for testing"""
    import argparse

    parser = argparse.ArgumentParser(description='VIET-POET-ALYZER RAG Query')
    parser.add_argument('question', help='Question to ask')
    parser.add_argument('--poem-id', help='Filter by poem ID')
    parser.add_argument('--top-k', type=int, default=3, help='Number of passages to retrieve')
    parser.add_argument('--api', action='store_true', help='Run as API server')
    parser.add_argument('--port', type=int, default=5000, help='API port')

    args = parser.parse_args()

    if args.api:
        # Run as API server
        api = RAGAPI(port=args.port)
        api.run(debug=True)
    else:
        # Single query
        rag = RAGPipeline()
        rag.initialize()

        print(f"\n🔍 Query: {args.question}")
        if args.poem_id:
            print(f"   Poem: {args.poem_id}")

        result = rag.query(args.question, args.poem_id, args.top_k)

        print(f"\n💬 Response:")
        print(result['answer'])
        print(f"\n📊 Confidence: {result['confidence']}")
        print(f"📚 Sources: {len(result['sources'])}")

if __name__ == '__main__':
    main()
