/**
 * Real Data Loader for VIET-POET-ALYZER
 * Loads all poetry data from JSON files
 */

export interface XRayData {
  target_words: string;
  art_type: string;
  effect: string;
}

export interface OutlinePoint {
  point: string;
  details: string[];
  conclusion: string;
}

export interface SectionData {
  section_name: string;
  original_text: string[];
  x_ray_data: XRayData[];
  section_outline: OutlinePoint[];
}

export interface PoemData {
  document_id: string;
  grade_level?: string;
  semester?: string;
  general_knowledge: {
    author_and_work: string;
  };
  detailed_analysis: SectionData[];
}

export interface PracticeTest {
  test_id: string;
  grade_level: string;
  semester: string;
  questions: PracticeQuestion[];
}

export interface PracticeQuestion {
  question_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'essay' | 'analysis';
  options?: string[];
  correct_answer: string | string[];
  explanation: string;
  related_poem?: string;
}

// All poem data loaded from JSON files
let allPoems: PoemData[] = [];
let allTests: PracticeTest[] = [];

// Class level organization
const poemsByGrade = {
  '10': { 'hk1': [], 'hk2': [] },
  '11': { 'hk1': [], 'hk2': [] }
};

const testsByGrade: Record<string, PracticeTest[]> = {
  '10': [],
  '11': []
};

/**
 * Load all poem data from JSON files
 */
export async function loadPoemData(): Promise<void> {
  try {
    // Check if running on server or client
    const isServer = typeof window === 'undefined';
    const baseUrl = isServer ? 'http://localhost:3000' : '';

    // Load from both data folders
    const dataPaths = [
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

    for (const path of dataPaths) {
      try {
        const response = await fetch(baseUrl + path);
        const data: PoemData = await response.json();

        // Add metadata from file path
        const match = path.match(/lop(\d+)_hk(\d+)/i) ||
                    path.match(/lop(\d+)\/hk(\d+)/i);
        if (match) {
          data.grade_level = match[1];
          data.semester = 'hk' + match[2];
        }

        allPoems.push(data);

        // Organize by grade and semester
        if (match) {
          const grade = match[1];
          const semester = 'hk' + match[2];
          if (poemsByGrade[grade as keyof typeof poemsByGrade]) {
            (poemsByGrade[grade as keyof typeof poemsByGrade] as any)[semester].push(data);
          }
        }
      } catch (error) {
        console.warn(`Failed to load ${path}:`, error);
      }
    }

    console.log(`Loaded ${allPoems.length} poems successfully`);
  } catch (error) {
    console.error('Error loading poem data:', error);
  }
}

/**
 * Load practice test data
 */
export async function loadPracticeTests(): Promise<void> {
  try {
    // Check if running on server or client
    const isServer = typeof window === 'undefined';
    const baseUrl = isServer ? 'http://localhost:3000' : '';

    const testPaths = [
      '/practice_data/de_01_L10.json',
      '/practice_data/de_02_L10.json',
      '/practice_data/de_03_L10.json',
      '/practice_data/de_04_L10.json',
      '/practice_data/de_05_L10.json',
      '/practice_data/de_01_L11.json',
      '/practice_data/de_02_L11.json',
      '/practice_data/de_03_L11.json',
      '/practice_data/de_04_L11.json',
      '/practice_data/de_05_L11.json'
    ];

    for (const path of testPaths) {
      try {
        const response = await fetch(baseUrl + path);
        const data: PracticeTest = await response.json();
        allTests.push(data);

        // Organize by grade
        const grade = path.includes('L10') ? '10' : '11';
        testsByGrade[grade as keyof typeof testsByGrade].push(data);
      } catch (error) {
        console.warn(`Failed to load ${path}:`, error);
      }
    }

    console.log(`Loaded ${allTests.length} practice tests successfully`);
  } catch (error) {
    console.error('Error loading practice tests:', error);
  }
}

/**
 * Get all poems
 */
export function getAllPoems(): PoemData[] {
  return allPoems;
}

/**
 * Get poems by grade and semester
 */
export function getPoemsByGrade(grade: string, semester: string): PoemData[] {
  return (poemsByGrade[grade as keyof typeof poemsByGrade] as any)?.[semester] || [];
}

/**
 * Get poem by ID
 */
export function getPoemById(id: string): PoemData | undefined {
  return allPoems.find(p => p.document_id === id);
}

/**
 * Get practice tests by grade
 */
export function getTestsByGrade(grade: string): PracticeTest[] {
  return testsByGrade[grade as keyof typeof testsByGrade] || [];
}

/**
 * Search poems by keyword
 */
export function searchPoems(keyword: string): PoemData[] {
  const lowerKeyword = keyword.toLowerCase();
  return allPoems.filter(poem =>
    poem.general_knowledge.author_and_work.toLowerCase().includes(lowerKeyword) ||
    poem.detailed_analysis.some(section =>
      section.section_name.toLowerCase().includes(lowerKeyword) ||
      section.original_text.some(line =>
        line.toLowerCase().includes(lowerKeyword)
      )
    )
  );
}

/**
 * Initialize all data loading
 */
export async function initializeData(): Promise<void> {
  await Promise.all([
    loadPoemData(),
    loadPracticeTests()
  ]);
}