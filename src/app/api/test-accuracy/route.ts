/**
 * AI Accuracy Testing API
 * Run automated accuracy tests on AI responses
 */
import { NextRequest, NextResponse } from 'next/server';
import { accuracyTester } from '@/lib/accuracyTesting';
import { initializeData } from '@/lib/dataLoader';

export async function POST(request: NextRequest) {
  try {
    // Initialize data first
    await initializeData();

    // Generate and run test cases
    accuracyTester.generateTestCases();
    const results = await accuracyTester.runAllTests();
    const summary = accuracyTester.getSummary();

    return NextResponse.json({
      status: 'completed',
      summary,
      failedTests: accuracyTester.getFailedTests().length,
      failedTestDetails: accuracyTester.getFailedTests(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Accuracy test error:', error);
    return NextResponse.json(
      { error: 'Failed to run accuracy tests', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const summary = accuracyTester.getSummary();

    return NextResponse.json({
      system: 'VIET-POET-ALYZER Accuracy Testing',
      version: '1.0',
      status: 'ready',
      summary,
      availableTests: accuracyTester['testCases'].length
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get test status' },
      { status: 500 }
    );
  }
}