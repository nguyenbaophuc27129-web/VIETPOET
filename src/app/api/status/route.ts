/**
 * System Status API
 * Returns comprehensive system status and metrics
 */
import { NextResponse } from 'next/server';
import { getAllPoems } from '@/lib/dataLoader';
import { aiSystem } from '@/lib/enhancedAI';
import { accuracyTester } from '@/lib/accuracyTesting';

export async function GET() {
  try {
    const poems = getAllPoems();
    const aiMetrics = aiSystem.getMetrics();
    const accuracyScore = aiSystem.calculateAccuracyScore();

    return NextResponse.json({
      status: 'operational',
      timestamp: new Date().toISOString(),
      system: {
        name: 'VIET-POET-ALYZER',
        version: '2.0',
        environment: process.env.NODE_ENV || 'development'
      },
      data: {
        totalPoems: poems.length,
        poemsByGrade: {
          '10': poems.filter(p => p.document_id.includes('lop10')).length,
          '11': poems.filter(p => p.document_id.includes('lop11')).length
        }
      },
      ai: {
        totalQueries: aiMetrics.totalQueries,
        accuracyScore: accuracyScore + '%',
        socraticQuality: (aiMetrics.socraticQuality * 100).toFixed(1) + '%',
        contextRelevance: (aiMetrics.contextRelevance * 100).toFixed(1) + '%',
        studentEngagement: (aiMetrics.studentEngagement * 100).toFixed(1) + '%'
      },
      features: {
        poetryXRay: true,
        autoMindmap: true,
        voiceChat: true,
        geospatialMap: true,
        offlineMode: true,
        intelOpenVINO: true
      },
      endpoints: [
        '/api/chat - AI Chat with Socratic method',
        '/api/openvino - Intel OpenVINO status',
        '/api/test-accuracy - Run accuracy tests',
        '/api/status - System status'
      ]
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}