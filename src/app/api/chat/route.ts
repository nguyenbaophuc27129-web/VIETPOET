/**
 * Smart AI Chat API
 * Uses actual JSON data for accurate responses
 */
import { NextRequest, NextResponse } from 'next/server';
import { smartAI } from '@/lib/smartAI';

export async function POST(request: NextRequest) {
  try {
    const { messages, poemId, sectionIndex } = await request.json();

    const lastMessage = messages[messages.length - 1].content;

    // Load poem data directly from JSON files
    let poem = null;
    if (poemId) {
      try {
        // Try to load from all possible poem files
        const poemFiles = [
          '/data/Bai1_lop10_hk1.json',
          '/data/Bai1_lop11_hk1.json',
          '/data/Bai2_lop10_hk1.json',
          '/data/Bai2_lop11_hk1.json',
          '/data/Bai2_lop11_hk2.json',
          '/data/Bai3_lop10_hk1.json',
          '/data/Bai3_lop11_hk1.json',
          '/data/Bai3_lop11_hk2.json',
          '/data/Bai4_lop10_hk1.json',
          '/data/Bai4_lop11_hk1.json',
          '/data/Bai4_lop11_hk2.json',
          '/data/Bai5_lop11_hk1.json',
          '/data/Bai6_lop11_hk1.json',
          '/data/Bai_2_lop10_hk2.json',
          '/data/Bai_3_lop10_hk2.json',
          '/data/Bai_4_lop10_hk2.json'
        ];

        for (const file of poemFiles) {
          const response = await fetch(`http://localhost:3000${file}`);
          if (response.ok) {
            const data = await response.json();
            if (data.document_id === poemId) {
              poem = data;
              break;
            }
          }
        }
      } catch (error) {
        console.warn('Failed to load poem data:', error);
      }
    }

    // Generate smart AI response based on actual JSON data
    const response = smartAI.analyzePoem(poem, lastMessage);

    return NextResponse.json({
      role: 'assistant',
      content: response.content,
      sources: response.sources,
      confidence: response.confidence,
      poemId: poemId,
      sectionIndex: sectionIndex
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint for system status
export async function GET() {
  return NextResponse.json({
    system: 'VIET-POET-ALYZER AI',
    version: '3.0 (Smart AI)',
    status: 'active',
    features: [
      'Analysis based on actual JSON data',
      'Accurate poetry breakdown',
      'Detailed artistic element analysis',
      'Content analysis following structure',
      'Author information extraction',
      'Full poem analysis capabilities'
    ],
    endpoints: [
      'POST /api/chat - Smart AI analysis',
      'GET /api/chat - System status',
      'GET /api/status - Complete system status'
    ]
  });
}