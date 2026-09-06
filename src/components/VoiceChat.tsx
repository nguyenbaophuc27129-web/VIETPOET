/**
 * Voice Chat Component
 * Multimodal interaction using Web Speech API
 */
'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isVoice?: boolean;
}

interface VoiceChatProps {
  poemId?: string;
  sectionIndex?: number;
}

export default function VoiceChat({ poemId, sectionIndex }: VoiceChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Xin chào! Tôi là VIET-POET-ALYZER, trợ lý AI học thơ. Hãy hỏi tôi về bài thơ, hoặc nhấn nút micro để nói!'
    }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [inputText, setInputText] = useState('');
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [hasStarted, setHasStarted] = useState(false); // Track if user has started interacting
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ttsQueueRef = useRef<string[]>([]);
  const isProcessingQueueRef = useRef(false);

  // Load voices for TTS
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = speechSynthesis.getVoices();
        setVoicesLoaded(voices.length > 0);
      };

      // Load voices
      loadVoices();

      // Handle voices changed
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Process TTS queue
  const processTTSQueue = async () => {
    if (isProcessingQueueRef.current || ttsQueueRef.current.length === 0) {
      return;
    }

    isProcessingQueueRef.current = true;
    const text = ttsQueueRef.current.shift()!;

    try {
      await speakTextInternal(text);
    } catch (error) {
      console.error('TTS queue processing error:', error);
    }

    isProcessingQueueRef.current = false;

    // Process next item in queue
    if (ttsQueueRef.current.length > 0) {
      setTimeout(() => processTTSQueue(), 100);
    }
  };

  // Internal function to speak text
  const speakTextInternal = async (text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔊 Speaking:', text.substring(0, 30) + '...');

        setIsSpeaking(true);

        fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, lang: 'vi', service: 'google' })
        })
        .then(response => response.json())
        .then(data => {
          if (data.audio) {
            const audioBinary = atob(data.audio);
            const bytes = new Uint8Array(audioBinary.length);
            for (let i = 0; i < audioBinary.length; i++) {
              bytes[i] = audioBinary.charCodeAt(i);
            }

            const audioBlob = new Blob([bytes], { type: 'audio/mp3' });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            audio.onended = () => {
              console.log('✅ Finished speaking');
              setIsSpeaking(false);
              URL.revokeObjectURL(audioUrl);
              resolve();
            };

            audio.onerror = (error) => {
              console.warn('❌ Audio error:', error);
              setIsSpeaking(false);
              URL.revokeObjectURL(audioUrl);
              reject(error);
            };

            audio.play().catch(reject);
          } else {
            // Fallback to Web Speech API
            fallbackTTSPromise(text).then(resolve).catch(reject);
          }
        })
        .catch(() => {
          // Fallback to Web Speech API
          fallbackTTSPromise(text).then(resolve).catch(reject);
        });
      } catch (error) {
        console.error('TTS error:', error);
        setIsSpeaking(false);
        reject(error);
      }
    });
  };

  // Fallback TTS with Promise - Vietnamese voices optimized
  const fallbackTTSPromise = (text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();

        // Clean text for TTS - remove markdown and special characters
        const cleanText = text
          .replace(/\*\*/g, '') // Remove bold markdown
          .replace(/\*/g, '')  // Remove italic markdown
          .replace(/\n\n/g, '. ') // Replace double newlines with period
          .replace(/\n/g, ', ')  // Replace single newlines with comma
          .replace(/---/g, '')  // Remove separators
          .replace(/💭/g, '')  // Remove emojis
          .replace(/💡/g, '')
          .trim();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'vi-VN';
        utterance.rate = 0.9; // Slightly faster for better listening
        utterance.pitch = 1.0;

        // Get Vietnamese voices - prioritize Google and Microsoft
        const voices = speechSynthesis.getVoices();
        const vietnameseVoices = voices.filter(voice =>
          voice.lang.includes('vi') || voice.lang.includes('VN')
        ).sort((a, b) => {
          // Priority order for Vietnamese voices:
          // 1. Google Vietnamese (most natural)
          // 2. Microsoft Vietnamese (good, widely available)
          // 3. Others
          const aIsGoogle = a.name.toLowerCase().includes('google');
          const bIsGoogle = b.name.toLowerCase().includes('google');
          const aIsMicrosoft = a.name.includes('Microsoft');
          const bIsMicrosoft = b.name.includes('Microsoft');

          if (aIsGoogle && !bIsGoogle) return -1;
          if (!aIsGoogle && bIsGoogle) return 1;
          if (aIsMicrosoft && !bIsMicrosoft) return -1;
          if (!aIsMicrosoft && bIsMicrosoft) return 1;
          return 0;
        });

        if (vietnameseVoices.length > 0) {
          utterance.voice = vietnameseVoices[0];
          console.log(`🔊 Using voice: ${vietnameseVoices[0].name} (${vietnameseVoices[0].lang})`);
        } else {
          console.warn('⚠️ No Vietnamese voices found, using default');
        }

        utterance.onend = () => {
          console.log('✅ Finished speaking (fallback TTS)');
          setIsSpeaking(false);
          resolve();
        };

        utterance.onerror = (e) => {
          console.error('❌ Speech synthesis error:', e);
          setIsSpeaking(false);
          reject(new Error('Speech synthesis failed'));
        };

        speechSynthesis.speak(utterance);
      } else {
        setIsSpeaking(false);
        reject(new Error('Speech synthesis not supported'));
      }
    });
  };

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      // Vietnamese-specific configuration
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'vi-VN'; // Force Vietnamese
      recognitionRef.current.maxAlternatives = 3; // Get more alternatives for better accuracy

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        let confidence = 0;

        // Get all results with highest confidence
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          const alternative = result[0];

          if (result.isFinal) {
            finalTranscript += alternative.transcript;
            confidence = alternative.confidence;
            console.log('🎤 Final result:', alternative.transcript, 'Confidence:', confidence);
          } else {
            interimTranscript += alternative.transcript;
          }
        }

        // Use final transcript if available, otherwise show interim
        const transcript = finalTranscript || interimTranscript;

        // Show confidence if available
        if (confidence > 0 && confidence < 0.7) {
          console.warn('⚠️ Low confidence recognition:', confidence);
        }

        setInputText(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('❌ Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          alert('🎤 Vui lòng cho phép truy cập micro để sử dụng tính năng giọng nói!');
        } else if (event.error === 'no-speech') {
          // Silent fail for no speech
        } else if (event.error === 'language-not-supported') {
          alert('🌐 Trình duyệt không hỗ trợ tiếng Việt. Vui lòng dùng Chrome/Edge!');
        } else if (event.error === 'network') {
          alert('📡 Lỗi kết nối mạng. Kiểm tra internet và thử lại!');
        }
      };
    }

    // Auto-scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      // Reset and ensure Vietnamese language
      recognitionRef.current.lang = 'vi-VN';
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Failed to start recognition:', error);
        setIsListening(false);
        alert('Không thể bắt đầu nhận diện giọng nói. Vui lòng reload trang!');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speakResponse = async (text: string) => {
    if (!text.trim()) return;

    console.log('📢 Adding to TTS queue:', text.substring(0, 30) + '...');
    ttsQueueRef.current.push(text);

    if (!isProcessingQueueRef.current) {
      processTTSQueue();
    }
  };

  const fallbackTTS = (text: string) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 0.85;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Get Vietnamese voices
      const voices = speechSynthesis.getVoices();
      const vietnameseVoices = voices.filter(voice =>
        voice.lang.includes('vi') || voice.lang.includes('VN')
      ).sort((a, b) => {
        // Prioritize Microsoft voices
        const aIsMicrosoft = a.name.includes('Microsoft');
        const bIsMicrosoft = b.name.includes('Microsoft');
        return aIsMicrosoft ? -1 : bIsMicrosoft ? 1 : 0;
      });

      if (vietnameseVoices.length > 0) {
        utterance.voice = vietnameseVoices[0];
      }

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      speechSynthesis.speak(utterance);
    } else {
      setIsSpeaking(false);
    }
  };

  const sendMessage = async (content: string, isVoice = false) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: Message = { role: 'user', content, isVoice };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    try {
      // Call AI API with RAG pipeline (tự fallback smartAI khi RAG server tắt)
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          poemId,
          sectionIndex
        })
      });

      const data = await response.json();

      // Add assistant response
      const responseContent = data.content || data.error || 'Xin lỗi, có lỗi xảy ra.';
      const assistantMessage: Message = {
        role: 'assistant',
        content: responseContent
      };
      setMessages(prev => {
        const updated = [...prev, assistantMessage];
        // Auto-speak if voice input
        if (isVoice && responseContent) {
          setTimeout(() => speakResponse(responseContent), 500);
        }
        return updated;
      });

    } catch (error) {
      const errorMessage = 'Xin lỗi, không thể kết nối với AI. Vui lòng thử lại.';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMessage
      }]);
    }
  };

  /**
   * Handle "BẮT DẦU" button click - Show first guiding question
   */
  const handleStartButtonClick = () => {
    if (hasStarted) return; // Already started, don't show again

    setHasStarted(true);

    // Socratic questions for different contexts
    const startQuestions = [
      "Để bắt đầu - Bạn muốn tìm hiểu điều gì về bài thơ này (nghệ thuật, nội dung hay cảm xúc)",
      "Gợi ý đầu tiên - Bạn nghĩ bài thơ này nói về điều gì, cảm hứng đầu tiên của tác giả là gì",
      "Câu hỏi gợi mở - Bạn có thể tìm ra một biện pháp nghệ thuật đặc biệt trong bài thơ này không",
      "Để phân tích - Bạn nghĩ nên bắt đầu từ hình ảnh thơ hay từ nội dung ý nghĩa"
    ];

    const randomQuestion = startQuestions[Math.floor(Math.random() * startQuestions.length)];

    const startMessage: Message = {
      role: 'assistant',
      content: randomQuestion
    };

    setMessages(prev => [...prev, startMessage]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  return (
    <div className="voice-chat flex flex-col h-full rounded-lg royal-border paper-texture relative" style={{ background: 'var(--paper-light)' }}>
      {/* Header */}
      <div className="p-4 text-white rounded-t-lg" style={{ background: 'var(--primary)' }}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-xl flex items-center gap-2" style={{ fontFamily: 'var(--font-serif)' }}>
            <span className="text-2xl">🤖</span>
            VIET-POET AI - Hỏi Đáp
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => speakResponse('Xin chào! Tôi là VIET-POET-ALYZER, trợ lý AI học thơ bằng tiếng Việt.')}
              className="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded transition-all"
              title="Test giọng tiếng Việt"
            >
              🔊 Test
            </button>
            <a
              href="/test-vietnamese-tts.html"
              target="_blank"
              className="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded transition-all"
              title="Test TTS/STT tiếng Việt riêng"
            >
              🧪 Test Tool
            </a>
          </div>
        </div>
        <p className="text-sm opacity-90">Hỏi về bài thơ, viết văn hoặc nhấn micro để nói</p>
        <div className="text-xs opacity-75 mt-2 bg-black bg-opacity-20 rounded px-2 py-1">
          🇻🇳 Chế độ: Tiếng Việt | 💡 Dùng Chrome/Edge Windows để có giọng tốt nhất
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] rounded-xl p-4 text-base leading-relaxed ${
                msg.role === 'user'
                  ? 'text-white'
                  : 'bg-white text-gray-800 border'
              }`}
              style={msg.role === 'user' ? { background: 'var(--primary)' } : { borderColor: 'var(--accent)' }}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  {msg.isVoice && <span className="text-xs mr-1">🎤</span>}
                  {msg.content}
                </div>
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => speakResponse(msg.content)}
                    className="text-xl hover:scale-110 transition-transform flex-shrink-0"
                    title="Nghe lại"
                    disabled={isSpeaking}
                  >
                    🔊
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 bg-white border-t flex gap-3" style={{ borderColor: 'var(--accent)' }}>
        {/* Nút BẮT DẦU - Chỉ hiện lần đầu */}
        {!hasStarted && (
          <button
            type="button"
            onClick={handleStartButtonClick}
            className="px-4 py-2 rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all font-bold"
            style={{ fontFamily: 'var(--font-sans)' }}
            title="Bắt đầu - Nhận câu hỏi gợi mở đầu tiên"
          >
            🚀 BẮT ĐẦU
          </button>
        )}

        <button
          type="button"
          onClick={isListening ? stopListening : startListening}
          disabled={!recognitionRef.current}
          className={`p-3 rounded-full ${
            isListening
              ? 'bg-red-500 animate-pulse'
              : recognitionRef.current
                ? 'hover:opacity-80'
                : 'bg-gray-400 cursor-not-allowed'
          } text-white transition-all`}
          style={!isListening && recognitionRef.current ? { background: 'var(--primary)' } : {}}
          title={recognitionRef.current ? "Nhấn để nói" : "Trình duyệt không hỗ trợ giọng nói"}
        >
          {isListening ? '⏹️' : '🎤'}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={hasStarted ? "Nhập câu hỏi..." : "Nhấn BẮT ĐẦU để bắt đầu..."}
          className="flex-1 px-5 py-3 rounded-lg text-base focus:outline-none focus:ring-2"
          style={{ borderColor: 'var(--accent)', fontFamily: 'var(--font-sans)' }}
        />

        <button
          type="submit"
          disabled={!inputText.trim()}
          className="px-8 py-3 rounded-lg text-base text-white disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          style={{ background: 'var(--primary)', fontFamily: 'var(--font-sans)' }}
        >
          Gửi
        </button>

        <button
          type="button"
          onClick={() => speakResponse(messages[messages.length - 1]?.content || '')}
          disabled={messages.length === 0 || isSpeaking}
          className="px-4 py-3 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          style={{ background: 'var(--accent)', fontFamily: 'var(--font-sans)' }}
          title="Nghe lại câu trả lời gần nhất"
        >
          🔊
        </button>
      </form>

      {/* Status */}
      {isListening && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-4 py-2 rounded-full text-sm">
          🎤 Đang nghe tiếng Việt... (nói câu hỏi)
        </div>
      )}

      {isSpeaking && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-4 py-2 rounded-full text-sm">
          🔊 Đang phát tiếng Việt...
        </div>
      )}

      {/* Browser compatibility warning */}
      {!recognitionRef.current && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-yellow-500 bg-opacity-90 text-white px-4 py-2 rounded-full text-sm">
          ⚠️ Trình duyệt không hỗ trợ Speech Recognition. Hãy dùng Chrome/Edge!
        </div>
      )}
    </div>
  );
}