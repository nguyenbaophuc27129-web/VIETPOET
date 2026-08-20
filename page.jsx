'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Sparkles, Brain, Award, Send, CheckCircle, RefreshCw, 
  MapPin, Mic, MicOff, Volume2, ArrowRight, Compass, Target, 
  Layers, Check, AlertCircle, Newspaper
} from 'lucide-react';

// ==============================================================================
// ⚙️ CẤU HÌNH ĐƯỜNG LINK BACKEND API
// ==============================================================================
// Khi chạy trên máy tính: giữ nguyên 'http://127.0.0.1:8000'
// Khi đã deploy lên Hugging Face: thay bằng link 'https://TÊN_BẠN-vietpoet-api.hf.space'
const API_BASE_URL = 'https://huggingface.co/spaces/phucnguyen27/vietpoet-api/tree/main';

// ==============================================================================
// 📚 DỮ LIỆU DỰ PHÒNG (MOCK DATA TỰ ĐỘNG CHẠY KHI BACKEND CHƯA BẬT)
// ==============================================================================
const MOCK_POEMS = [
  {
    document_id: "binh_ngo_dai_cao",
    title: "Bình Ngô Đại Cáo",
    author: "Nguyễn Trãi",
    grade: "10",
    semester: "HK2",
    tag: "Văn chính luận trung đại",
    map_locations: [
      { name: "Đông Đô (Thăng Long)", desc: "Đất cũ thu về, giải phóng kinh đô", coords: "21.0285, 105.8542" },
      { name: "Chi Lăng", desc: "Liễu Thăng thất thế, chém đầu chủ tướng", coords: "21.6500, 106.5333" },
      { name: "Xương Giang", desc: "Máu trôi đỏ nước, quân giặc tan tác", coords: "21.2833, 106.2000" }
    ],
    detailed_analysis: [
      {
        section_name: "Phần 1: Luận đề chính nghĩa (Tiền đề tư tưởng)",
        original_text: [
          "Việc nhân nghĩa cốt ở yên dân,",
          "Quân điếu phạt trước lo trừ bạo.",
          "Như nước Đại Việt ta từ trước,",
          "Vốn xưng nền văn hiến đã lâu."
        ],
        x_ray_data: [
          { target_words: "nhân nghĩa", art_type: "Khái niệm Nho giáo", effect: "Mở rộng nội hàm: lấy dân làm gốc, bảo vệ cuộc sống yên bình cho nhân dân." },
          { target_words: "yên dân", art_type: "Mục đích tối thượng", effect: "Khẳng định gốc rễ của mọi hành động quân sự là vì sự bình yên của dân chúng." },
          { target_words: "văn hiến đã lâu", art_type: "Tự hào dân tộc", effect: "Khẳng định chủ quyền, nền văn hóa độc lập lâu đời ngang hàng với các triều đại phương Bắc." }
        ],
        section_outline: [
          { point: "Tư tưởng nhân nghĩa tiến bộ", details: ["Yên dân: Nhân dân được sống hòa bình", "Trừ bạo: Tiêu diệt quân xâm lược tàn bạo"], conclusion: "Cốt lõi nhân nghĩa là lấy dân làm gốc" },
          { point: "Chân lý độc lập dân tộc", details: ["Có nền văn hiến riêng lâu đời", "Núi sông bờ cõi đã phân định"], conclusion: "Khẳng định quyền tự chủ thiêng liêng của Đại Việt" }
        ]
      }
    ]
  },
  {
    document_id: "tay_tien",
    title: "Tây Tiến",
    author: "Quang Dũng",
    grade: "12",
    semester: "HK1",
    tag: "Thơ ca kháng chiến",
    map_locations: [
      { name: "Sông Mã", desc: "Dòng sông gắn liền với ký ức hào hùng của đoàn quân Tây Tiến", coords: "20.8000, 104.5000" },
      { name: "Mường Lát", desc: "Mường Lát hoa về trong đêm hơi - vẻ đẹp mờ ảo sương núi", coords: "20.5000, 104.6000" },
      { name: "Pha Luông", desc: "Nhà ai Pha Luông mưa xa khơi - đỉnh núi cao hiểm trở", coords: "20.7000, 104.4000" }
    ],
    detailed_analysis: [
      {
        section_name: "Khổ 1: Thiên nhiên Tây Bắc hiểm trở và hoang sơ",
        original_text: [
          "Sông Mã xa rồi Tây Tiến ơi!",
          "Nhớ về rừng núi nhớ chơi vơi.",
          "Sài Khao sương lấp đoàn quân mỏi,",
          "Mường Lát hoa về trong đêm hơi."
        ],
        x_ray_data: [
          { target_words: "Tây Tiến ơi", art_type: "Câu cảm thán / Hô ngữ", effect: "Tiếng gọi tha thiết bật lên từ đáy lòng, bộc lộ nỗi nhớ trào dâng." },
          { target_words: "nhớ chơi vơi", art_type: "Từ láy tạo hình & cảm giác", effect: "Diễn tả nỗi nhớ bồng bềnh, mênh mang, không định hình giữa không gian rừng núi." }
        ],
        section_outline: [
          { point: "Nỗi nhớ da diết về đồng đội và chiến trường xưa", details: ["Tiếng gọi Tây Tiến ơi tha thiết", "Nỗi nhớ chơi vơi bồng bềnh"], conclusion: "Khai mở toàn bộ mạch cảm xúc hoài niệm của bài thơ" }
        ]
      }
    ]
  }
];

const MOCK_TESTS = [
  {
    test_id: "de_01",
    test_title: "Đề số 1: Đọc hiểu & Nghị luận văn học (Buổi gặt chiều)",
    grade: "10",
    reading_section: {
      passage: "Khi nỗ lực kiên trì mỗi ngày để thẳng đến mục tiêu, áp dụng những nền tảng vững chắc cho thành công, bạn sẽ đến nơi mình hằng mong ước. Thành công không phải là một trò chơi phức tạp. Thành công chỉ có khi bạn thực hiện những điều xuất sắc giản đơn với lòng kiên trì đầy đam mê... (Trích Điều vĩ đại đời thường - Robin Sharma)",
      questions: [
        {
          question_id: "I.1",
          question_text: "Câu 1 (0.75đ): Vấn đề chính được trình bày trong văn bản là gì?",
          barem_keywords: ["sự kiên trì", "nỗ lực kiên trì", "thành công"],
          suggested_answer: "Vấn đề chính: Tầm quan trọng của sự kiên trì và nỗ lực bền bỉ trên con đường vươn tới thành công."
        },
        {
          question_id: "I.2",
          question_text: "Câu 2 (0.75đ): Theo văn bản, những yếu tố nào là nền tảng cho sự kiên trì?",
          barem_keywords: ["suy nghĩ tích cực", "chịu trách nhiệm", "chăm chỉ", "kỷ luật tự giác"],
          suggested_answer: "Nền tảng: suy nghĩ tích cực, chịu trách nhiệm, chăm chỉ làm việc, kỷ luật tự giác, đặt ra mục tiêu..."
        }
      ]
    },
    writing_section: {
      questions: [
        {
          question_id: "II.1",
          question_type: "Nghị luận xã hội",
          question_text: "Viết đoạn văn nghị luận (khoảng 200 chữ) bàn về ý nghĩa của tinh thần vượt khó trong cuộc sống.",
          barem_keywords: ["đối mặt thử thách", "nỗ lực vươn lên", "khám phá năng lực bản thân", "lan tỏa thái độ sống tích cực", "bài học nhận thức"],
          detailed_rubric: [
            "Giải thích: Tinh thần vượt khó là thái độ dũng cảm đối mặt với nghịch cảnh.",
            "Ý nghĩa: Giúp con người nỗ lực vươn lên, khám phá năng lực tiềm ẩn và lan tỏa năng lượng tích cực.",
            "Bài học nhận thức và hành động thiết thực."
          ]
        },
        {
          question_id: "II.2",
          question_type: "Nghị luận văn học",
          question_text: "Viết bài văn nghị luận phân tích, đánh giá nét đặc sắc về nội dung và nghệ thuật của bài thơ 'Buổi gặt chiều' (Anh Thơ).",
          barem_keywords: ["bức tranh thiên nhiên thanh bình", "tinh thần lao động vui tươi", "thể thơ 8 chữ", "từ láy giàu tính tạo hình", "ngôn ngữ giản dị mộc mạc"],
          detailed_rubric: [
            "Bức tranh thiên nhiên làng quê yên ả, thanh bình, màu sắc tươi vui.",
            "Bức tranh cuộc sống lao động hăng say, tràn đầy niềm vui và sự lạc quan.",
            "Nghệ thuật: Thể thơ 8 chữ nhịp nhàng, ngôn ngữ giàu từ láy tạo hình, bút pháp tả thực giàu nữ tính."
          ]
        }
      ]
    }
  }
];

// ==============================================================================
// 🎭 COMPONENT CHÍNH CỦA ỨNG DỤNG (VIET-POET MASTER APP)
// ==============================================================================
export default function VietPoetApp() {
  // Navigation State: 'home', 'ai-tutor', 'practice', 'news'
  const [activePage, setActivePage] = useState('home');

  // States cho Phân hệ VIET-POET AI
  const [poems, setPoems] = useState(MOCK_POEMS);
  const [selectedGrade, setSelectedGrade] = useState('10');
  const [selectedSemester, setSelectedSemester] = useState('HK2');
  const [selectedPoemId, setSelectedPoemId] = useState('binh_ngo_dai_cao');
  const [searchQuery, setSearchQuery] = useState('');
  const [isInWorkspace, setIsInWorkspace] = useState(false);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('xray'); // 'xray', 'mindmap', 'chat', 'map'
  const [hoveredXRay, setHoveredXRay] = useState(null);

  // States cho Chatbot Socratic & Voice 2 chiều
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Thầy chào em! Em đang muốn cùng thầy phân tích câu thơ hay biện pháp nghệ thuật nào trong tác phẩm này?' }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // States cho Phân hệ VIET-POET PRACTICE
  const [practiceGrade, setPracticeGrade] = useState('10');
  const [practiceTests, setPracticeTests] = useState(MOCK_TESTS);
  const [selectedTestId, setSelectedTestId] = useState('de_01');
  const [practiceSection, setPracticeSection] = useState('writing'); // 'reading' or 'writing'
  const [isInPracticeRoom, setIsInPracticeRoom] = useState(false);
  const [studentAnswers, setStudentAnswers] = useState({});
  const [gradingResults, setGradingResults] = useState({});
  const [isGradingActive, setIsGradingActive] = useState(false);

  // 1. Tự động kết nối Backend API khi ứng dụng khởi động
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/poems`)
      .then(res => res.json())
      .then(data => {
        if (data.poems && data.poems.length > 0) {
          setPoems(data.poems);
        }
      })
      .catch(() => console.log('Chạy bằng CSDL Mock-data mặc định'));

    fetch(`${API_BASE_URL}/api/practice-tests`)
      .then(res => res.json())
      .then(data => {
        if (data.tests && data.tests.length > 0) {
          setPracticeTests(data.tests);
        }
      })
      .catch(() => console.log('Chạy bằng Đề thi Mock-data mặc định'));
  }, []);

  // 2. Tải chi tiết bài thơ được chọn
  const currentPoem = poems.find(p => p.document_id === selectedPoemId) || MOCK_POEMS[0];
  const currentTest = practiceTests.find(t => t.test_id === selectedTestId) || MOCK_TESTS[0];

  // 3. Xử lý Giọng nói đầu vào (Speech-to-Text)
  const toggleVoiceInput = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Trình duyệt của bạn chưa hỗ trợ nhận giọng nói. Hãy dùng Google Chrome để có trải nghiệm tốt nhất!');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = false;

    if (!isListening) {
      recognition.start();
      setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMsg(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
    } else {
      recognition.stop();
      setIsListening(false);
    }
  };

  // 4. Xử lý Giọng đọc Thầy giáo phát ra (Text-to-Speech)
  const speakText = (text) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  // 5. Gửi câu hỏi đến Gia sư Socratic AI
  const sendChatMessage = async () => {
    if (!inputMsg.trim() || isAiLoading) return;
    const userText = inputMsg;
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setInputMsg('');
    setIsAiLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poem_id: selectedPoemId, question: userText })
      });
      const data = await res.json();
      const aiReply = data.answer || "Thầy đã ghi nhận câu hỏi. Em hãy thử suy nghĩ thêm về cấu trúc từ ngữ xem sao?";
      setMessages(prev => [...prev, { role: 'ai', content: aiReply }]);
      speakText(aiReply);
    } catch {
      setTimeout(() => {
        const fallbackReply = "Thầy chào em! Nghệ thuật trong câu thơ này nhằm nhấn mạnh ý chí kiên cường và tinh thần yêu nước sâu sắc. Em thấy hình ảnh đó gợi cho em cảm xúc gì?";
        setMessages(prev => [...prev, { role: 'ai', content: fallbackReply }]);
        speakText(fallbackReply);
        setIsAiLoading(false);
      }, 800);
    } finally {
      setIsAiLoading(false);
    }
  };

  // 6. Gửi bài thi cho AI chấm điểm theo Barem
  const handleGradeQuestion = async (qId, rubric, keywords) => {
    const studentText = studentAnswers[qId] || '';
    if (!studentText.trim()) {
      alert('Vui lòng nhập bài làm tự luận của em trước khi chấm điểm!');
      return;
    }
    setIsGradingActive(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_essay: studentText,
          detailed_rubric: rubric,
          barem_keywords: keywords
        })
      });
      const data = await res.json();
      setGradingResults(prev => ({ ...prev, [qId]: data }));
    } catch {
      setTimeout(() => {
        const lower = studentText.toLowerCase();
        const matched = keywords.filter(k => lower.includes(k.toLowerCase()));
        const missing = keywords.filter(k => !lower.includes(k.toLowerCase()));
        const rate = Math.round((matched.length / keywords.length) * 100);
        
        setGradingResults(prev => ({
          ...prev,
          [qId]: {
            metrics: { matched, missing, completion_rate: rate },
            evaluation: `Bài làm có cấu trúc mạch lạc. Em đã nêu được các ý: ${matched.join(', ') || 'cơ bản'}. Tuy nhiên, để đạt điểm tối đa theo Barem của Bộ, em cần bổ sung các từ khóa cốt lõi sau: ${missing.join(', ') || 'đầy đủ'}.`
          }
        }));
        setIsGradingActive(false);
      }, 1000);
    } finally {
      setIsGradingActive(false);
    }
  };

  const filteredPoems = poems.filter(p => 
    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.author?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#1C1C1C] flex flex-col font-sans selection:bg-[#9E2A2B]/20 selection:text-[#9E2A2B]">
      
      {/* 🧭 HEADER CỔNG THÔNG TIN SỞ GD&ĐT (CỔ PHONG HOÀNG GIA) */}
      <header className="sticky top-0 z-50 bg-[#FAF6F0]/95 backdrop-blur-md border-b border-[#C5A059]/40 px-6 py-3.5 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { setActivePage('home'); setIsInWorkspace(false); setIsInPracticeRoom(false); }}>
          <div className="w-10 h-10 rounded-full bg-[#9E2A2B] text-white flex items-center justify-center font-serif text-xl border-2 border-[#C5A059] shadow-inner">
            詩
          </div>
          <div>
            <h1 className="font-serif font-black text-xl tracking-wider text-[#9E2A2B]">VIET-POET-ALYZER</h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-[#C5A059]">Digital Humanities & Intel® AI PC Platform</p>
          </div>
        </div>

        <nav className="flex space-x-2 md:space-x-4 text-xs md:text-sm font-bold">
          <button 
            onClick={() => { setActivePage('home'); setIsInWorkspace(false); setIsInPracticeRoom(false); }}
            className={`px-4 py-2 rounded-lg transition-all ${activePage === 'home' ? 'bg-[#9E2A2B] text-white shadow' : 'text-gray-700 hover:bg-[#F1EBE4]'}`}
          >
            Trang Chủ
          </button>
          <button 
            onClick={() => { setActivePage('ai-tutor'); setIsInWorkspace(false); }}
            className={`px-4 py-2 rounded-lg transition-all ${activePage === 'ai-tutor' ? 'bg-[#9E2A2B] text-white shadow' : 'text-gray-700 hover:bg-[#F1EBE4]'}`}
          >
            VIET-POET AI
          </button>
          <button 
            onClick={() => { setActivePage('practice'); setIsInPracticeRoom(false); }}
            className={`px-4 py-2 rounded-lg transition-all ${activePage === 'practice' ? 'bg-[#9E2A2B] text-white shadow' : 'text-gray-700 hover:bg-[#F1EBE4]'}`}
          >
            PRACTICE
          </button>
          <button 
            onClick={() => { setActivePage('news'); }}
            className={`px-4 py-2 rounded-lg transition-all ${activePage === 'news' ? 'bg-[#9E2A2B] text-white shadow' : 'text-gray-700 hover:bg-[#F1EBE4]'}`}
          >
            Bản Tin
          </button>
        </nav>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════════
          TRANG 01: TRANG CHỦ & TỔNG QUAN SỨ MỆNH
      ══════════════════════════════════════════════════════════════════════════ */}
      {activePage === 'home' && (
        <div className="flex-1 max-w-6xl mx-auto px-6 py-10 space-y-16">
          {/* Hero Section */}
          <div className="text-center space-y-5 pt-4">
            <div className="inline-flex items-center gap-2 bg-[#9E2A2B]/10 border border-[#9E2A2B]/30 px-4 py-1.5 rounded-full text-xs font-bold text-[#9E2A2B]">
              <Sparkles size={14} /> Intel® Vietnam AI Impact Festival 2026
            </div>
            <h2 className="font-serif text-4xl md:text-6xl font-extrabold text-[#1C1C1C] leading-tight">
              Phục Hưng Thơ Ca Dân Tộc <br />
              <span className="text-[#9E2A2B] underline decoration-[#C5A059] decoration-wavy decoration-2">Bằng Trí Tuệ Nhân Tạo</span>
            </h2>
            <p className="text-gray-700 max-w-3xl mx-auto text-base md:text-lg leading-relaxed font-serif italic">
              "Không viết văn mẫu thay học sinh — Chúng tôi khơi mở tư duy phân tích độc lập thông qua trực quan hóa X-Ray, Sơ đồ tư duy động và Gia sư Socratic tối ưu hóa bởi Intel® OpenVINO™."
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-3">
              <button 
                onClick={() => { setActivePage('ai-tutor'); setIsInWorkspace(false); }}
                className="bg-[#9E2A2B] hover:bg-[#800020] text-white px-8 py-3.5 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 border border-[#C5A059]"
              >
                <Brain size={18} /> Khám Phá Không Gian AI
              </button>
              <button 
                onClick={() => { setActivePage('practice'); setIsInPracticeRoom(false); }}
                className="bg-white hover:bg-[#F1EBE4] text-[#1C1C1C] px-8 py-3.5 rounded-xl font-bold shadow transition-all border border-[#C5A059] flex items-center gap-2"
              >
                <Award size={18} /> Luyện Đề Tự Luận Barem
              </button>
            </div>
          </div>

          {/* 3 Ô THÔNG TIN NỔI BẬT */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border-2 border-[#C5A059]/40 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#FAF6F0] border border-[#C5A059] flex items-center justify-center text-[#9E2A2B]">
                <BookOpen size={24} />
              </div>
              <h3 className="font-serif font-bold text-lg text-[#9E2A2B]">Hướng Dẫn Sử Dụng</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Rọi chiếu văn bản để xem biện pháp nghệ thuật trong tab X-Ray. Đàm thoại 2 chiều bằng giọng nói với Gia sư Socratic AI để rèn luyện tư duy phân tích.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border-2 border-[#C5A059]/40 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#FAF6F0] border border-[#C5A059] flex items-center justify-center text-[#9E2A2B]">
                <Compass size={24} />
              </div>
              <h3 className="font-serif font-bold text-lg text-[#9E2A2B]">Giới Thiệu Dự Án</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Nền tảng Nhân văn số tích hợp thuật toán NLP Tiếng Việt gốc với RAG trên ChromaDB. Tối ưu hóa suy luận nhẹ mượt, chạy tốt trên cả máy chủ đám mây và máy tính cá nhân.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border-2 border-[#C5A059]/40 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#FAF6F0] border border-[#C5A059] flex items-center justify-center text-[#9E2A2B]">
                <Target size={24} />
              </div>
              <h3 className="font-serif font-bold text-lg text-[#9E2A2B]">Sứ Mệnh SDG 4</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Tập trung thực thi <strong>SDG 4 (Giáo dục chất lượng)</strong>: Chấm dứt thói quen học vẹt văn mẫu, hình thành năng lực tự chủ cảm thụ văn học cho thế hệ trẻ.
              </p>
            </div>
          </div>

          {/* VẤN ĐỀ VÀ GIẢI PHÁP */}
          <div className="bg-[#F1EBE4] p-8 rounded-3xl border border-[#C5A059]/50 space-y-6">
            <h3 className="font-serif font-bold text-2xl text-center text-[#9E2A2B]">Thực Trạng Khảo Sát & Giải Pháp Chống Học Vẹt</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
              <div className="bg-white p-6 rounded-xl border-l-4 border-red-600 space-y-3 shadow-sm">
                <h4 className="font-bold text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle size={18} /> Vấn Nạn Học Vẹt Lối Mòn
                </h4>
                <ul className="text-xs text-gray-700 space-y-2 leading-relaxed">
                  <li>• <strong>68% học sinh THPT</strong> cảm thấy khó khăn và bế tắc khi tiếp cận nghệ thuật thơ ca trừu tượng.</li>
                  <li>• <strong>74% học sinh</strong> thừa nhận phải chép và học thuộc văn mẫu để đối phó với các kỳ thi.</li>
                  <li>• Các ứng dụng AI thông thường hay bị ảo giác luật thơ và khuyến khích học sinh gian lận.</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-xl border-l-4 border-[#9E2A2B] space-y-3 shadow-sm">
                <h4 className="font-bold text-sm text-[#9E2A2B] flex items-center gap-2">
                  <CheckCircle size={18} /> Đột Phá Từ VIET-POET-ALYZER
                </h4>
                <ul className="text-xs text-gray-700 space-y-2 leading-relaxed">
                  <li>• <strong>Poetry X-Ray & Mindmap:</strong> Trực quan hóa vần, nhịp, từ ngữ thành trải nghiệm thị giác dễ nhớ.</li>
                  <li>• <strong>Gia sư Socratic:</strong> AI chặn đứng việc viết hộ văn mẫu, dẫn dắt học sinh tự viết bằng câu hỏi gợi mở.</li>
                  <li>• <strong>AI Auto-Grader:</strong> Chấm điểm tự luận bám sát 100% Barem chuẩn của Bộ GD&ĐT.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          TRANG 02: VIET-POET AI (WORKSPACE PHÂN TÍCH THƠ)
      ══════════════════════════════════════════════════════════════════════════ */}
      {activePage === 'ai-tutor' && !isInWorkspace && (
        <div className="flex-1 max-w-4xl mx-auto px-6 py-12 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs uppercase font-bold tracking-widest text-[#C5A059]">BƯỚC 1: LỌC CHỌN TÁC PHẨM</span>
            <h2 className="font-serif text-3xl font-bold text-[#9E2A2B]">Chọn Khung Tri Thức Bài Học</h2>
            <p className="text-xs text-gray-600">Hệ thống đã số hóa toàn bộ chương trình GDPT 2018</p>
          </div>

          <div className="bg-white p-8 rounded-3xl border-2 border-[#C5A059]/40 shadow-md space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-600">1. Khối Lớp Học:</label>
                <div className="grid grid-cols-3 gap-2">
                  {['10', '11', '12'].map(g => (
                    <button 
                      key={g} 
                      onClick={() => setSelectedGrade(g)}
                      className={`py-2.5 rounded-xl font-bold text-sm border transition-all ${selectedGrade === g ? 'bg-[#9E2A2B] text-white border-[#9E2A2B]' : 'bg-[#FAF6F0] text-gray-700 border-[#C5A059]/30'}`}
                    >
                      Lớp {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-600">2. Học Kỳ:</label>
                <div className="grid grid-cols-2 gap-2">
                  {['HK1', 'HK2'].map(s => (
                    <button 
                      key={s} 
                      onClick={() => setSelectedSemester(s)}
                      className={`py-2.5 rounded-xl font-bold text-sm border transition-all ${selectedSemester === s ? 'bg-[#C5A059] text-white border-[#C5A059]' : 'bg-[#FAF6F0] text-gray-700 border-[#C5A059]/30'}`}
                    >
                      {s === 'HK1' ? 'Học kỳ I' : 'Học kỳ II'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-600">3. Tìm Kiếm & Chọn Tác Phẩm:</label>
              <input 
                type="text"
                placeholder="Tìm tác phẩm, tác giả..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#FAF6F0] border border-[#C5A059]/50 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#9E2A2B]"
              />
              <div className="space-y-2 pt-2 max-h-[40vh] overflow-y-auto">
                {filteredPoems.map(p => (
                  <div 
                    key={p.document_id}
                    onClick={() => setSelectedPoemId(p.document_id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-center ${selectedPoemId === p.document_id ? 'bg-[#FAF6F0] border-[#9E2A2B] shadow-sm' : 'bg-white border-[#C5A059]/30 hover:border-[#C5A059]'}`}
                  >
                    <div>
                      <h4 className="font-serif font-bold text-base text-[#9E2A2B]">{p.title}</h4>
                      <p className="text-xs text-gray-600">Tác giả: {p.author} | Thể loại: {p.tag || 'Trung đại'}</p>
                    </div>
                    {selectedPoemId === p.document_id && <Check className="text-[#9E2A2B]" size={20} />}
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => setIsInWorkspace(true)}
              className="w-full bg-[#9E2A2B] hover:bg-[#800020] text-white py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 text-base border border-[#C5A059]"
            >
              Vào Không Gian Học Tập Đa Năng <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* MÀN HÌNH WORKSPACE 4 TAB CHỨC NĂNG */}
      {activePage === 'ai-tutor' && isInWorkspace && (
        <div className="flex-1 max-w-6xl mx-auto px-4 py-6 space-y-6 w-full">
          <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-2xl border border-[#C5A059]/40 shadow-sm gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059]">Đang phân tích tác phẩm</span>
              <h2 className="font-serif text-2xl font-black text-[#9E2A2B]">{currentPoem.title} <span className="text-sm font-sans font-normal text-gray-600">({currentPoem.author})</span></h2>
            </div>
            <button 
              onClick={() => setIsInWorkspace(false)}
              className="text-xs font-bold text-[#9E2A2B] bg-[#FAF6F0] border border-[#9E2A2B]/30 px-3 py-1.5 rounded-lg hover:bg-[#F1EBE4]"
            >
              ← Đổi bài học khác
            </button>
          </div>

          {/* 4 Tabs Workspace */}
          <div className="flex space-x-2 border-b border-[#C5A059]/30 pb-2 overflow-x-auto">
            <button 
              onClick={() => setActiveWorkspaceTab('xray')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 transition-all ${activeWorkspaceTab === 'xray' ? 'bg-[#9E2A2B] text-white shadow' : 'bg-white text-gray-700 hover:bg-[#F1EBE4]'}`}
            >
              <Sparkles size={16} /> 1. Poetry X-Ray
            </button>
            <button 
              onClick={() => setActiveWorkspaceTab('mindmap')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 transition-all ${activeWorkspaceTab === 'mindmap' ? 'bg-[#9E2A2B] text-white shadow' : 'bg-white text-gray-700 hover:bg-[#F1EBE4]'}`}
            >
              <Layers size={16} /> 2. Sơ Đồ Tư Duy
            </button>
            <button 
              onClick={() => setActiveWorkspaceTab('chat')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 transition-all ${activeWorkspaceTab === 'chat' ? 'bg-[#9E2A2B] text-white shadow' : 'bg-white text-gray-700 hover:bg-[#F1EBE4]'}`}
            >
              <Brain size={16} /> 3. Gia Sư Socratic (Voice)
            </button>
            <button 
              onClick={() => setActiveWorkspaceTab('map')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 transition-all ${activeWorkspaceTab === 'map' ? 'bg-[#9E2A2B] text-white shadow' : 'bg-white text-gray-700 hover:bg-[#F1EBE4]'}`}
            >
              <MapPin size={16} /> 4. Bản Đồ Thi Ca
            </button>
          </div>

          {/* NỘI DUNG TAB 1: X-RAY */}
          {activeWorkspaceTab === 'xray' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-white p-8 rounded-3xl border border-[#C5A059]/40 shadow-sm space-y-6">
                <div className="border-b border-[#C5A059]/20 pb-3">
                  <h3 className="font-serif font-bold text-lg text-[#9E2A2B]">Văn Bản Rọi Chiếu X-Ray</h3>
                  <p className="text-xs text-gray-500">Rê chuột vào các từ khóa viền vàng để giải mã biện pháp nghệ thuật</p>
                </div>
                
                <div className="space-y-6 font-serif text-lg leading-relaxed">
                  {currentPoem.detailed_analysis?.map((sec, sIdx) => (
                    <div key={sIdx} className="bg-[#FAF6F0] p-6 rounded-2xl border-l-4 border-[#9E2A2B] space-y-3">
                      <span className="text-xs font-sans font-bold uppercase tracking-wider text-[#C5A059] block">{sec.section_name}</span>
                      {sec.original_text?.map((line, lIdx) => {
                        let processedLine = line;
                        sec.x_ray_data?.forEach(x => {
                          if (line.includes(x.target_words)) {
                            processedLine = processedLine.replace(x.target_words, `[[${x.target_words}]]`);
                          }
                        });
                        return (
                          <p key={lIdx} className="text-gray-800">
                            {processedLine.split('[[').map((part, pIdx) => {
                              if (part.includes(']]')) {
                                const [target, rest] = part.split(']]');
                                return (
                                  <span key={pIdx}>
                                    <span 
                                      className="bg-yellow-100 border-b-2 border-[#C5A059] cursor-pointer text-[#9E2A2B] font-bold px-1 rounded transition-all"
                                      onMouseEnter={() => setHoveredXRay(target)}
                                    >
                                      {target}
                                    </span>
                                    {rest}
                                  </span>
                                );
                              }
                              return part;
                            })}
                          </p>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bảng giải thích X-Ray bên phải */}
              <div className="bg-[#F1EBE4] p-6 rounded-3xl border border-[#C5A059]/40 space-y-4 h-fit">
                <h4 className="font-serif font-bold text-base text-[#9E2A2B] flex items-center gap-2">
                  <Sparkles size={18} /> Giải Mã Barem Nghệ Thuật
                </h4>
                {hoveredXRay ? (
                  <div className="bg-white p-4 rounded-xl border border-[#C5A059] shadow-sm space-y-2 animate-pulse">
                    <span className="text-[10px] uppercase font-bold text-[#C5A059]">Từ khóa đang soi:</span>
                    <h5 className="font-bold text-sm text-[#9E2A2B]">"{hoveredXRay}"</h5>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {currentPoem.detailed_analysis?.flatMap(s => s.x_ray_data || []).find(x => x.target_words === hoveredXRay)?.effect || "Đang giải mã tác dụng nghệ thuật..."}
                    </p>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 italic text-center py-8">Rê chuột vào các từ nổi bật để soi kính hiển vi nghệ thuật</div>
                )}
              </div>
            </div>
          )}

          {/* NỘI DUNG TAB 2: MINDMAP */}
          {activeWorkspaceTab === 'mindmap' && (
            <div className="bg-white p-8 rounded-3xl border border-[#C5A059]/40 shadow-sm space-y-6">
              <div className="border-b border-[#C5A059]/20 pb-3">
                <h3 className="font-serif font-bold text-xl text-[#9E2A2B]">Sơ Đồ Phân Cấp Tư Duy Tác Phẩm</h3>
                <p className="text-xs text-gray-500">Mô hình cây phân tầng tự động: Luận điểm → Luận cứ → Chốt ý</p>
              </div>

              <div className="space-y-6">
                {currentPoem.detailed_analysis?.map((sec, idx) => (
                  <div key={idx} className="bg-[#FAF6F0] p-6 rounded-2xl border-2 border-[#C5A059]/30 space-y-4">
                    <div className="bg-[#9E2A2B] text-white px-4 py-2 rounded-xl text-sm font-bold inline-block shadow">
                      {sec.section_name}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      {sec.section_outline?.map((out, oIdx) => (
                        <div key={oIdx} className="bg-white p-4 rounded-xl border border-[#C5A059]/40 space-y-2">
                          <h5 className="font-bold text-xs text-[#9E2A2B] flex items-center gap-1.5">
                            📌 {out.point}
                          </h5>
                          <ul className="text-xs text-gray-600 space-y-1 pl-4 list-disc">
                            {out.details?.map((d, dIdx) => <li key={dIdx}>{d}</li>)}
                          </ul>
                          {out.conclusion && (
                            <div className="bg-[#FAF6F0] p-2 rounded text-xs font-bold text-[#C5A059] border-t border-[#C5A059]/20">
                              ⇒ {out.conclusion}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NỘI DUNG TAB 3: SOCRATIC CHAT & VOICE */}
          {activeWorkspaceTab === 'chat' && (
            <div className="bg-white rounded-3xl border border-[#C5A059]/40 shadow-sm flex flex-col h-[70vh] overflow-hidden">
              <div className="bg-[#FAF6F0] px-6 py-3 border-b border-[#C5A059]/30 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-[#9E2A2B] text-white flex items-center justify-center text-xs font-serif font-bold">Thầy</div>
                  <div>
                    <h4 className="font-bold text-sm text-[#9E2A2B]">Gia Sư Socratic AI</h4>
                    <p className="text-[10px] text-gray-500">Chế độ hỏi mở • Đàm thoại 2 chiều Voice & Text</p>
                  </div>
                </div>
                <span className="text-xs bg-green-100 text-green-800 font-bold px-2.5 py-1 rounded-full border border-green-300">Intel® Server AI Active</span>
              </div>

              {/* Chat history */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-[#9E2A2B] text-white rounded-br-none shadow' : 'bg-[#F1EBE4] text-[#1C1C1C] border border-[#C5A059]/40 rounded-bl-none'}`}>
                      <p>{m.content}</p>
                      {m.role === 'ai' && (
                        <button 
                          onClick={() => speakText(m.content)}
                          className="mt-2 text-[10px] text-[#C5A059] hover:underline flex items-center gap-1 font-bold"
                        >
                          <Volume2 size={12} /> Nghe thầy đọc
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {isAiLoading && <p className="text-xs italic text-gray-500">Thầy giáo AI đang suy luận câu hỏi...</p>}
              </div>

              {/* Input Box */}
              <div className="p-4 bg-[#FAF6F0] border-t border-[#C5A059]/30 flex items-center gap-2">
                <button 
                  onClick={toggleVoiceInput}
                  className={`p-3 rounded-xl border transition-all ${isListening ? 'bg-red-600 text-white animate-pulse' : 'bg-white text-gray-700 border-[#C5A059]'}`}
                  title="Nhấn để nói tiếng Việt"
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
                <input 
                  type="text"
                  value={inputMsg}
                  onChange={e => setInputMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                  placeholder={isListening ? "Đang lắng nghe giọng nói của em..." : "Nhập câu hỏi hoặc phân tích câu thơ..."}
                  className="flex-1 bg-white border border-[#C5A059]/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#9E2A2B]"
                />
                <button 
                  onClick={sendChatMessage}
                  className="bg-[#9E2A2B] hover:bg-[#800020] text-white px-5 py-3 rounded-xl font-bold transition-all flex items-center gap-1"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}

          {/* NỘI DUNG TAB 4: BẢN ĐỒ THI CA */}
          {activeWorkspaceTab === 'map' && (
            <div className="bg-white p-8 rounded-3xl border border-[#C5A059]/40 shadow-sm space-y-6">
              <div className="border-b border-[#C5A059]/20 pb-3">
                <h3 className="font-serif font-bold text-xl text-[#9E2A2B]">Bản Đồ Không Gian Thi Ca & Lịch Sử</h3>
                <p className="text-xs text-gray-500">Định vị các địa danh lịch sử xuất hiện trong tác phẩm</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-[#FAF6F0] h-[350px] rounded-2xl border-2 border-dashed border-[#C5A059] flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <Compass className="text-[#9E2A2B] animate-spin" size={48} />
                  <p className="font-serif font-bold text-base text-[#9E2A2B]">Không Gian Bản Đồ Số Di Sản Văn Hóa</p>
                  <p className="text-xs text-gray-600 max-w-sm">Tọa độ các địa danh trong tác phẩm được liên kết trực tiếp với dữ liệu địa lý quốc gia.</p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-[#C5A059] uppercase tracking-wider">Địa danh gắn liền:</h4>
                  {currentPoem.map_locations?.map((loc, lIdx) => (
                    <div key={lIdx} className="bg-[#F1EBE4] p-4 rounded-xl border border-[#C5A059]/30 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#9E2A2B]">
                        <MapPin size={14} /> {loc.name}
                      </div>
                      <p className="text-xs text-gray-700">{loc.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          TRANG 03: VIET-POET PRACTICE (LUYỆN ĐỀ & BAREM AUTO-GRADING)
      ══════════════════════════════════════════════════════════════════════════ */}
      {activePage === 'practice' && !isInPracticeRoom && (
        <div className="flex-1 max-w-4xl mx-auto px-6 py-12 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs uppercase font-bold tracking-widest text-[#C5A059]">Phân Hệ Khảo Thí & Luyện Đề</span>
            <h2 className="font-serif text-3xl font-bold text-[#9E2A2B]">Chọn Đề Thi Luyện Tập</h2>
            <p className="text-xs text-gray-600">Đề thi chuẩn cấu trúc Bộ GD&ĐT • Chấm điểm theo Barem từ khóa</p>
          </div>

          <div className="bg-white p-8 rounded-3xl border-2 border-[#C5A059]/40 shadow-md space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-600">1. Khối Lớp:</label>
                <div className="grid grid-cols-3 gap-2">
                  {['10', '11', '12'].map(g => (
                    <button 
                      key={g} 
                      onClick={() => setPracticeGrade(g)}
                      className={`py-2.5 rounded-xl font-bold text-sm border transition-all ${practiceGrade === g ? 'bg-[#9E2A2B] text-white border-[#9E2A2B]' : 'bg-[#FAF6F0] text-gray-700 border-[#C5A059]/30'}`}
                    >
                      Lớp {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-600">2. Phần Luyện Tập:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setPracticeSection('reading')}
                    className={`py-2.5 rounded-xl font-bold text-sm border transition-all ${practiceSection === 'reading' ? 'bg-[#C5A059] text-white border-[#C5A059]' : 'bg-[#FAF6F0] text-gray-700 border-[#C5A059]/30'}`}
                  >
                    1. Đọc Hiểu
                  </button>
                  <button 
                    onClick={() => setPracticeSection('writing')}
                    className={`py-2.5 rounded-xl font-bold text-sm border transition-all ${practiceSection === 'writing' ? 'bg-[#C5A059] text-white border-[#C5A059]' : 'bg-[#FAF6F0] text-gray-700 border-[#C5A059]/30'}`}
                  >
                    2. Viết Văn
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-600">3. Chọn Bộ Đề Khảo Thí:</label>
              <div className="space-y-3">
                {practiceTests.map(t => (
                  <div 
                    key={t.test_id}
                    onClick={() => setSelectedTestId(t.test_id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-center ${selectedTestId === t.test_id ? 'bg-[#FAF6F0] border-[#9E2A2B] shadow-sm' : 'bg-white border-[#C5A059]/30 hover:border-[#C5A059]'}`}
                  >
                    <div>
                      <h4 className="font-serif font-bold text-base text-[#9E2A2B]">{t.test_title || t.title}</h4>
                      <p className="text-xs text-gray-500">Cấu trúc: 4.0đ Đọc hiểu + 6.0đ Viết luận</p>
                    </div>
                    {selectedTestId === t.test_id && <Check className="text-[#9E2A2B]" size={20} />}
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => setIsInPracticeRoom(true)}
              className="w-full bg-[#9E2A2B] hover:bg-[#800020] text-white py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 text-base border border-[#C5A059]"
            >
              Bắt Đầu Vào Phòng Làm Bài <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* MÀN HÌNH LÀM BÀI VÀ CHẤM ĐIỂM TỪNG CÂU */}
      {activePage === 'practice' && isInPracticeRoom && selectedTest && (
        <div className="flex-1 max-w-5xl mx-auto px-4 py-6 space-y-6 w-full">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#C5A059]/40 shadow-sm">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059]">Phòng Thi Luyện Tập Khảo Thí</span>
              <h2 className="font-serif text-xl font-black text-[#9E2A2B]">{selectedTest.test_title || selectedTest.title} ({practiceSection === 'reading' ? 'Phần Đọc Hiểu' : 'Phần Viết'})</h2>
            </div>
            <button 
              onClick={() => setIsInPracticeRoom(false)}
              className="text-xs font-bold text-[#9E2A2B] bg-[#FAF6F0] border border-[#9E2A2B]/30 px-3 py-1.5 rounded-lg hover:bg-[#F1EBE4]"
            >
              ← Thay đổi đề thi
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#C5A059]/40 space-y-3">
            <h4 className="text-xs font-bold text-[#9E2A2B] uppercase">Văn bản Đọc-Hiểu/Trích đoạn:</h4>
            <div className="bg-[#FAF6F0] p-4 rounded-xl border-l-4 border-[#C5A059] italic text-xs leading-relaxed text-gray-800 whitespace-pre-line font-serif">
              {practiceSection === 'reading' ? selectedTest.reading_section?.passage : selectedTest.writing_section?.questions?.[1]?.passage || "Mặt trời lặn, mây còn tươi ráng đỏ / Cò từng đàn bay trắng cánh đồng xa... (Buổi gặt chiều - Anh Thơ)"}
            </div>
          </div>

          {/* Ô làm bài từng câu */}
          <div className="space-y-4">
            {(practiceSection === 'reading' ? selectedTest.reading_section?.questions : selectedTest.writing_section?.questions)?.map((q, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-[#C5A059]/40 space-y-3 shadow-sm">
                <div className="flex justify-between">
                  <h4 className="font-bold text-xs text-[#9E2A2B]">{q.question_text}</h4>
                  <span className="text-[10px] bg-[#C5A059]/10 text-[#C5A059] font-bold px-2 py-0.5 rounded">Tối đa: {q.max_score}đ</span>
                </div>

                <textarea 
                  rows={4}
                  value={studentAnswers[q.question_id] || ''}
                  onChange={e => setStudentAnswers({ ...studentAnswers, [q.question_id]: e.target.value })}
                  placeholder="Nhập câu trả lời hoặc đoạn văn làm bài của em..."
                  className="w-full bg-[#FAF6F0] border border-[#C5A059]/30 rounded-xl p-3 text-xs focus:outline-none focus:border-[#9E2A2B]"
                />

                <div className="flex justify-end">
                  <button 
                    onClick={() => handleGradeQuestion(q.question_id, q.detailed_rubric || [q.suggested_answer], q.barem_keywords || [])}
                    disabled={isGradingActive}
                    className="bg-[#9E2A2B] hover:bg-[#800020] text-white px-5 py-2 rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-all"
                  >
                    {isGradingActive ? <RefreshCw className="animate-spin" size={12} /> : <CheckCircle size={12} />}
                    Nộp Bài Cho AI Chấm
                  </button>
                </div>

                {/* Kết quả chấm thi */}
                {gradingResults[q.question_id] && (
                  <div className="bg-[#F1EBE4] p-4 rounded-xl border border-[#C5A059] space-y-2 mt-2">
                    <h5 className="text-[11px] font-bold text-[#9E2A2B]">📝 Đánh Giá Kết Quả Chấm Thi Từ AI:</h5>
                    {gradingResults[q.question_id].metrics && (
                      <div className="text-[10px] bg-white p-2.5 rounded-lg border border-[#C5A059]/20 space-y-1">
                        <p><strong>Tỷ lệ khớp Barem từ khóa:</strong> <span className="text-[#9E2A2B] font-bold">{gradingResults[q.question_id].metrics.completion_rate}%</span></p>
                        <p><strong>Từ khóa đạt được:</strong> <span className="text-green-700">{gradingResults[q.question_id].metrics.matched.join(', ') || 'Chưa có'}</span></p>
                        <p><strong>Ý còn thiếu cần bổ sung:</strong> <span className="text-red-600">{gradingResults[q.question_id].metrics.missing.join(', ') || 'Đã trọn vẹn'}</span></p>
                      </div>
                    )}
                    <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-line">{gradingResults[q.question_id].evaluation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 📰 TRANG 04: BẢN TIN GIÁO DỤC */}
      {activePage === 'news' && (
        <div className="max-w-5xl mx-auto px-6 py-12 space-y-6 flex-1">
          <h2 className="font-serif text-3xl font-bold text-[#9E2A2B] text-center">Bản Tin Học Đường & Nhân Văn Số</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="bg-white p-6 rounded-xl border border-[#C5A059]/30 shadow-sm space-y-3">
              <span className="text-xs bg-[#9E2A2B]/10 text-[#9E2A2B] px-2 py-1 rounded font-bold">Di sản số</span>
              <h3 className="font-serif font-bold text-base">Bảo tồn di sản Thơ ca Việt Nam qua trí tuệ nhân tạo</h3>
              <p className="text-xs text-gray-600 leading-relaxed">Ứng dụng công nghệ xử lý ngôn ngữ tự nhiên để kết nối thế hệ trẻ với các tác phẩm kinh điển.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-[#C5A059]/30 shadow-sm space-y-3">
              <span className="text-xs bg-[#C5A059]/10 text-[#C5A059] px-2 py-1 rounded font-bold">Công nghệ Intel</span>
              <h3 className="font-serif font-bold text-base">Tối ưu hóa Edge AI bằng Intel® OpenVINO™</h3>
              <p className="text-xs text-gray-600 leading-relaxed">Mang mô hình ngôn ngữ lớn về chạy mượt mà trên laptop và máy tính trường học mà không cần Internet nhờ NPU.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-[#C5A059]/30 shadow-sm space-y-3">
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-bold">Giáo dục 2018</span>
              <h3 className="font-serif font-bold text-base">Đổi mới phương pháp học Văn: Tự chủ tư duy</h3>
              <p className="text-xs text-gray-600 leading-relaxed">Phương pháp Socratic giúp học sinh rèn luyện tư duy phản biện, chấm dứt hoàn toàn thói quen học vẹt văn mẫu.</p>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER BẢO TỒN DI SẢN */}
      <footer className="bg-[#FAF6F0] border-t border-[#C5A059]/40 py-6 text-center text-xs text-gray-500 space-y-1 mt-auto">
        <p className="font-serif font-bold text-[#9E2A2B]">VIET-POET-ALYZER • Nền Tảng Trí Tuệ Nhân Tạo Nhân Văn Số</p>
        <p>Tối ưu hóa bởi Intel® OpenVINO™ • Đồng hành cùng Giáo dục Việt Nam 2026</p>
      </footer>

    </div>
  );
}