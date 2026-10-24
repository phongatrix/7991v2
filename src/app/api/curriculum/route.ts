import { NextResponse } from 'next/server';
import { CURRICULUM_DATA, COMPETENCIES } from '@/lib/curriculumData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const grade = searchParams.get('grade') as '10' | '11' | '12' | null;

  if (grade && CURRICULUM_DATA[grade]) {
    return NextResponse.json({
      grade,
      topics: CURRICULUM_DATA[grade],
      competencies: COMPETENCIES
    });
  }

  return NextResponse.json({
    curriculum: CURRICULUM_DATA,
    competencies: COMPETENCIES
  });
}
