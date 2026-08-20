import os
import glob
import json
import time
import re
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import chromadb
from sentence_transformers import SentenceTransformer

# ==============================================================================
# 1. KHỞI TẠO DỊCH VỤ & BẢO MẬT (CORS)
# ==============================================================================
app = FastAPI(
    title="VIET-POET-ALYZER Cloud Engine",
    description="Backend API phục vụ Phân tích Văn học & Khảo thí THPT Quốc gia",
    version="6.0-Cloud"
)

# Cho phép Frontend từ Netlify, Vercel hoặc Localhost gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================================================================
# 2. KHỞI TẠO CƠ SỞ TRI THỨC (VECTOR DATABASE & EMBEDDING)
# ==============================================================================
DATA_DIR = os.getenv("DATA_DIR", "./data")
PRACTICE_DIR = os.getenv("PRACTICE_DIR", "./practice_data")
DB_DIR = os.getenv("DB_DIR", "./poetry_db")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(PRACTICE_DIR, exist_ok=True)

# Khởi tạo Vector DB
client = chromadb.PersistentClient(path=DB_DIR)
collection = client.get_or_create_collection(name="viet_poetry")

# Mô hình Embedding tiếng Việt
embedding_model = SentenceTransformer('keepitreal/vietnamese-sbert')

# ==============================================================================
# 3. KHỞI TẠO AI INFERENCE (INTEL OPENVINO VỚI DỰ PHÒNG CHUẨN CLOUD)
# ==============================================================================
ov_pipe = None
hf_pipe = None
active_engine = "CPU Standard"

try:
    import openvino_genai as ov_genai
    model_path = os.getenv("OPENVINO_MODEL_PATH", "./qwen2_openvino_model")
    if os.path.exists(model_path):
        ov_pipe = ov_genai.LLMPipeline(model_path, "AUTO")
        ov_config = ov_genai.GenerationConfig()
        ov_config.max_new_tokens = 250
        ov_config.temperature = 0.1
        active_engine = "Intel® OpenVINO™ GenAI (Server-side)"
except Exception:
    pass

if ov_pipe is None:
    from transformers import pipeline
    # Chạy trên CPU Cloud ổn định, không chiếm dụng tài nguyên quá mức
    hf_pipe = pipeline("text-generation", model="Qwen/Qwen2.5-0.5B-Instruct", device="cpu")
    active_engine = "Qwen2.5-0.5B (PyTorch CPU)"

# ==============================================================================
# 4. THUẬT TOÁN ĐỊNH LƯỢNG & PROMPT ARMOR (HYBRID ARCHITECTURE)
# ==============================================================================
def deterministic_evaluator(student_essay: str, barem_keywords: List[str]) -> dict:
    """Đo đạc từ khóa chính xác 100% bằng thuật toán Python thuần"""
    essay_clean = student_essay.lower()
    matched = []
    missing = []
    
    for kw in barem_keywords:
        kw_clean = kw.lower().strip()
        if re.search(r'\b' + re.escape(kw_clean) + r'\b', essay_clean) or kw_clean in essay_clean:
            matched.append(kw)
        else:
            missing.append(kw)
            
    total = len(barem_keywords)
    rate = round((len(matched) / total * 100), 1) if total > 0 else 0.0
    return {"matched": matched, "missing": missing, "completion_rate": rate}

def generate_safe_ai_response(system_prompt: str, user_input: str) -> str:
    """Suy luận AI tích hợp khiên bảo vệ Prompt Armor chống văn mẫu"""
    raw_response = ""
    if ov_pipe is not None:
        full_prompt = f"{system_prompt}\n\nHọc sinh: {user_input}\nThầy:"
        raw_response = ov_pipe.generate(full_prompt, ov_config)
    else:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_input}
        ]
        outputs = hf_pipe(messages, max_new_tokens=250, temperature=0.1)
        raw_response = outputs[0]["generated_text"][-1]["content"]

    # Kiểm tra gian lận (Prompt Armor)
    cheat_indicators = ["mở bài:", "thân bài:", "kết bài:", "bài văn mẫu sau:", "bài làm mẫu:"]
    if any(trigger in raw_response.lower() for trigger in cheat_triggers):
        return (
            "Thầy nhận thấy em đang muốn tìm một bài văn mẫu viết sẵn. "
            "Tôn chỉ học tập của chúng ta là tự chủ tư duy. "
            "Thầy đã cung cấp các từ khóa gợi ý, em hãy thử đặt bút viết đoạn mở đầu theo cảm nhận của riêng mình nhé?"
        )
    return raw_response

# ==============================================================================
# 5. SCHEMAS & ENDPOINTS
# ==============================================================================
class ChatRequest(BaseModel):
    poem_id: Optional[str] = None
    question: str

class GradeRequest(BaseModel):
    student_essay: str
    detailed_rubric: List[str]
    barem_keywords: List[str]

class IngestRequest(BaseModel):
    poem_data: dict

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "VIET-POET-ALYZER Core",
        "engine": active_engine,
        "total_knowledge_chunks": collection.count()
    }

@app.get("/api/poems")
async def get_poems():
    json_files = glob.glob(os.path.join(DATA_DIR, "*.json"))
    poems = []
    for f in json_files:
        try:
            with open(f, 'r', encoding='utf-8') as file:
                d = json.load(file)
                poems.append({
                    "document_id": d.get("document_id", os.path.basename(f).replace(".json", "")),
                    "title": d.get("general_knowledge", {}).get("title") or d.get("metadata", {}).get("title", "Tác phẩm"),
                    "author": d.get("general_knowledge", {}).get("author") or d.get("metadata", {}).get("author", "Khuyết danh"),
                    "file_name": os.path.basename(f)
                })
        except Exception:
            continue
    return {"status": "success", "total": len(poems), "poems": poems}

@app.get("/api/poem/{document_id}")
async def get_poem_detail(document_id: str):
    json_files = glob.glob(os.path.join(DATA_DIR, "*.json"))
    for f in json_files:
        try:
            with open(f, 'r', encoding='utf-8') as file:
                d = json.load(file)
                if d.get("document_id") == document_id or os.path.basename(f).replace(".json", "") == document_id:
                    return {"status": "success", "data": d}
        except Exception:
            continue
    raise HTTPException(status_code=404, detail="Không tìm thấy tác phẩm.")

@app.get("/api/practice-tests")
async def get_practice_tests():
    test_files = glob.glob(os.path.join(PRACTICE_DIR, "*.json"))
    tests = []
    for f in test_files:
        try:
            with open(f, 'r', encoding='utf-8') as file:
                tests.append(json.load(file))
        except Exception:
            continue
    return {"status": "success", "total": len(tests), "tests": tests}

@app.post("/api/chat")
async def chat_socratic(request: ChatRequest):
    try:
        q_vec = embedding_model.encode([request.question]).tolist()
        if request.poem_id:
            results = collection.query(query_embeddings=q_vec, n_results=2, where={"poem_id": request.poem_id})
        else:
            results = collection.query(query_embeddings=q_vec, n_results=2)
            
        retrieved_context = "\n".join(results['documents'][0]) if results['documents'] else "Dữ liệu chuẩn Sách Giáo Viên."

        system_prompt = (
            f"⚠️ LỆNH TỐI CAO: BẠN LÀ MỘT THẦY GIÁO NGỮ VĂN NGHIÊM KHẮC VÀ UYÊN BÁC. XƯNG 'THẦY', GỌI 'EM'.\n"
            f"BẠN CHỈ ĐƯỢC PHÉP SỬ DỤNG DỮ LIỆU ĐỘC QUYỀN SAU: {retrieved_context}\n\n"
            f"NHIỆM VỤ SƯ PHẠM BẮT BUỘC:\n"
            f"1. Dựa vào dữ liệu trên, giải thích bản chất nghệ thuật cực kỳ ngắn gọn (Tối đa 2 câu).\n"
            f"2. BẮT BUỘC kết thúc câu trả lời bằng MỘT CÂU HỎI GỢI MỞ (?) để kích thích học sinh tự suy nghĩ sâu hơn.\n"
            f"3. Tuyệt đối không tự ý bịa thêm lịch sử, không dùng từ 'đạo sĩ', không viết văn mẫu nguyên bài."
        )

        answer = generate_safe_ai_response(system_prompt, request.question)
        return {"status": "success", "answer": answer, "retrieved_context": retrieved_context}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/grade")
async def grade_student_essay(request: GradeRequest):
    try:
        eval_metrics = deterministic_evaluator(request.student_essay, request.barem_keywords)
        rubric_text = "\n".join(request.detailed_rubric)
        matched_str = ", ".join(eval_metrics["matched"]) if eval_metrics["matched"] else "Chưa có"
        missing_str = ", ".join(eval_metrics["missing"]) if eval_metrics["missing"] else "Không có (Đã đủ ý)"
        
        system_prompt = (
            f"BẠN LÀ GIÁM KHẢO CHẤM THI THPT QUỐC GIA MÔN NGỮ VĂN.\n"
            f"HƯỚNG DẪN CHẤM BAREM:\n{rubric_text}\n\n"
            f"KẾT QUẢ ĐỐI SOÁT ĐỊNH LƯỢNG:\n"
            f"- Tỷ lệ hoàn thành Barem: {eval_metrics['completion_rate']}%\n"
            f"- Các từ khóa học sinh ĐÃ ĐẠT: {matched_str}\n"
            f"- Các từ khóa học sinh CÒN THIẾU: {missing_str}\n\n"
            f"NHIỆM VỤ SƯ PHẠM:\n"
            f"1. Nhận xét ưu điểm trong cách hành văn của học sinh (1 câu).\n"
            f"2. Nêu rõ các luận điểm/từ khóa em ĐÃ LÀM TỐT.\n"
            f"3. Chỉ ra CHÍNH XÁC những ý/từ khóa em CẦN BỔ SUNG để đạt điểm tối đa.\n"
            f"4. Đưa ra 1 gợi ý ngắn gọn giúp em hoàn thiện bài viết. Không viết bài văn mẫu."
        )
        
        evaluation = generate_safe_ai_response(system_prompt, f"Bài làm của học sinh:\n{request.student_essay}")
        return {"status": "success", "evaluation": evaluation, "metrics": eval_metrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/ingest")
async def dynamic_ingest(request: IngestRequest):
    try:
        data = request.poem_data
        poem_id = data.get("document_id", f"poem_{int(time.time())}")
        poem_title = data.get("general_knowledge", {}).get("title", "Tác phẩm mới")
        
        new_docs = []
        new_metas = []
        new_ids = []
        
        for section in data.get("detailed_analysis", []):
            sec_name = section.get("section_name", "")
            for essay in section.get("section_full_essay", []):
                chunk = f"Tác phẩm '{poem_title}'. Phần '{sec_name}'. Phân tích: {essay}"
                new_docs.append(chunk)
                new_metas.append({"poem_id": poem_id})
                new_ids.append(f"{poem_id}_{len(new_docs)}")
                
        if new_docs:
            new_vecs = embedding_model.encode(new_docs).tolist()
            collection.upsert(embeddings=new_vecs, documents=new_docs, metadatas=new_metas, ids=new_ids)
            
        return {"status": "success", "message": f"Đã nạp '{poem_title}' thành công!", "chunks_added": len(new_docs)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# KHỞI CHẠY MÁY CHỦ CHUẨN CLOUD ONLINE
# ==============================================================================
if __name__ == "__main__":
    import uvicorn
    # Nhận diện cổng do Cloud cấp tự động, mặc định là 8000
    port = int(os.environ.get("PORT", 8000))
    # Chuyển host sang 0.0.0.0 để mở cổng cho toàn thế giới truy cập
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=False)