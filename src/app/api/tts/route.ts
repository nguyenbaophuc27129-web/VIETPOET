/**
 * Vietnamese Text-to-Speech API
 * Integrates multiple Vietnamese TTS services with fallback
 */
import { NextRequest, NextResponse } from 'next/server';

// TTS Service Types
type TTSService = 'vbee' | 'fpt' | 'google' | 'fallback';

interface TTSRequest {
  text: string;
  lang?: string;
  service?: TTSService;
  voice?: string;
  rate?: number;
  pitch?: number;
}

interface TTSResponse {
  audio?: string | null; // base64 encoded audio
  error?: string;
  service?: string;
  message?: string;
}

/**
 * Main TTS handler - tries multiple services in order
 */
export async function POST(request: NextRequest) {
  try {
    const { text, lang = 'vi', service = 'vbee' }: TTSRequest = await request.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    // Try services in order of preference
    const services: TTSService[] = [service as TTSService, 'fpt', 'google', 'fallback'];

    for (const currentService of services) {
      try {
        const result = await tryTTSService(currentService, text, lang);
        if (result.audio) {
          return NextResponse.json({
            audio: result.audio,
            service: currentService,
            message: `✅ Using ${currentService} TTS service`
          });
        }
      } catch (error) {
        console.warn(`${currentService} TTS failed:`, error);
        continue;
      }
    }

    // If all services fail, return error for client-side fallback
    return NextResponse.json({
      error: 'All TTS services unavailable',
      message: 'ℹ️ Using browser fallback TTS'
    }, { status: 200 });

  } catch (error) {
    console.error('TTS API error:', error);
    return NextResponse.json(
      { error: 'Failed to process TTS request' },
      { status: 500 }
    );
  }
}

/**
 * Try different TTS services
 */
async function tryTTSService(service: TTSService, text: string, lang: string): Promise<TTSResponse> {
  switch (service) {
    case 'vbee':
      return await vbeeTTS(text, lang);
    case 'fpt':
      return await fptTTS(text, lang);
    case 'google':
      return await googleTTS(text, lang);
    case 'fallback':
      return { audio: null }; // Signal to use browser fallback
    default:
      return { audio: null };
  }
}

/**
 * Vbee Vietnamese TTS (Free tier if available)
 * Note: This is a placeholder - actual implementation requires Vbee API credentials
 */
async function vbeeTTS(text: string, lang: string): Promise<TTSResponse> {
  try {
    // Vbee API placeholder
    // In production, you would call: https://api.vbee.vn/v1/tts
    // For now, return null to trigger fallback
    return { audio: null };
  } catch (error) {
    return { audio: null };
  }
}

/**
 * FPT.AI Vietnamese TTS (Free tier available)
 * Note: This is a placeholder - actual implementation requires FPT API credentials
 */
async function fptTTS(text: string, lang: string): Promise<TTSResponse> {
  try {
    // FPT API placeholder
    // In production, you would call: https://api.fpt.ai/hmi/tts/v5
    // For now, return null to trigger fallback
    return { audio: null };
  } catch (error) {
    return { audio: null };
  }
}

/**
 * Google Translate TTS (Free, unofficial Vietnamese TTS)
 * Uses Google Translate's unofficial TTS endpoint with rate limit handling
 */
async function googleTTS(text: string, lang: string): Promise<TTSResponse> {
  try {
    // Clean text for TTS - remove markdown formatting
    const cleanText = text
      .replace(/\*\*/g, '') // Remove bold markdown
      .replace(/\*/g, '')  // Remove italic markdown
      .replace(/\n\n/g, '. ') // Replace double newlines with period
      .replace(/\n/g, ', ')  // Replace single newlines with comma
      .replace(/---/g, '')  // Remove separators
      .trim();

    if (cleanText.length < 10) {
      return { audio: null };
    }

    // Split long text into smaller chunks to avoid rate limits
    const chunks = splitTextIntoChunks(cleanText, 150);
    const audioChunks: Buffer[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (!chunk.trim()) continue;

      // Use Google Translate's unofficial TTS endpoint (free)
      const ttsLang = lang === 'vi' ? 'vi' : 'vi-VN';
      const encodedText = encodeURIComponent(chunk);

      // Add random parameter to avoid caching
      const randomParam = Math.floor(Math.random() * 1000000);
      const googleTTSUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${ttsLang}&q=${encodedText}&ttsspeed=1&total=${chunks.length}&idx=${i}&rand=${randomParam}`;

      try {
        const response = await fetch(googleTTSUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        if (response.ok) {
          const audioBuffer = await response.arrayBuffer();
          audioChunks.push(Buffer.from(audioBuffer));

          // Small delay between requests to avoid rate limiting
          if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        } else {
          console.warn(`Google TTS chunk ${i + 1} failed with status: ${response.status}`);
        }
      } catch (error) {
        console.warn(`Google TTS chunk ${i + 1} error:`, error);
      }
    }

    // Combine all audio chunks
    if (audioChunks.length > 0) {
      const combinedAudio = Buffer.concat(audioChunks);
      const base64Audio = combinedAudio.toString('base64');
      console.log(`✅ Google TTS (Vietnamese): Generated ${audioChunks.length}/${chunks.length} chunks`);
      return { audio: base64Audio, service: 'google' };
    }

    return { audio: null };
  } catch (error) {
    console.warn('Google TTS failed:', error);
    return { audio: null };
  }
}

/**
 * Split text into chunks for TTS processing
 */
function splitTextIntoChunks(text: string, maxChunkLength: number): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?।॥])\s+/);

  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkLength && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  // If text has no sentence breaks, split by character limit
  if (chunks.length === 0 && text.length > 0) {
    for (let i = 0; i < text.length; i += maxChunkLength) {
      chunks.push(text.substring(i, i + maxChunkLength));
    }
  }

  return chunks.length > 0 ? chunks : [text];
}

/**
 * Alternative: Use a free Vietnamese TTS service or local model
 * This could be integrated with:
 * - VITS Vietnamese pre-trained model
 * - Coqui TTS with Vietnamese
 * - ESPnet Vietnamese TTS
 * - Local Vietnamese TTS model via OpenVINO
 */
async function localVietnameseTTS(text: string): Promise<TTSResponse> {
  // This could integrate with a local Vietnamese TTS model
  // using Intel OpenVINO for inference optimization
  return { audio: null };
}

/**
 * GET endpoint for service status
 */
export async function GET() {
  return NextResponse.json({
    service: 'VIET-POET-ALYZER Vietnamese TTS',
    version: '1.0',
    status: 'active',
    availableServices: [
      'vbee (Vbee Vietnamese TTS - requires API key)',
      'fpt (FPT.AI TTS - requires API key)',
      'google (Google Cloud TTS - requires API key)',
      'fallback (Browser Web Speech API)'
    ],
    note: 'Currently using browser fallback. Add API keys to services for better Vietnamese voices.',
    setupInstructions: {
      vbee: 'Sign up at https://vbee.vn and add API key to .env',
      fpt: 'Sign up at https://www.fpt.ai.com/tts and add API key to .env',
      google: 'Enable Google Cloud Text-to-Speech API and add credentials'
    }
  });
}