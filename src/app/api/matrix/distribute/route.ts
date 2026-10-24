import { NextResponse } from 'next/server';
import { autoDistributeMatrix, gradeDefaultTotals } from '@/lib/matrixDistributor';
import { getQuestions } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { grade = '11', selectedLessonIds = [], title, durationMinutes } = body;

    if (!selectedLessonIds || selectedLessonIds.length === 0) {
      return NextResponse.json({ error: 'Vui lòng chọn ít nhất một bài học' }, { status: 400 });
    }

    const defaults = gradeDefaultTotals(grade);
    const {
      totalMCQ = defaults.totalMCQ,
      totalTF = defaults.totalTF,
      totalSA = defaults.totalSA,
      totalTL = defaults.totalTL
    } = body;

    const available = getQuestions();
    const matrix = autoDistributeMatrix({
      grade,
      subject: 'Tin học',
      title: title || `ĐỀ KIỂM TRA MÔN TIN HỌC LỚP ${grade}`,
      durationMinutes: durationMinutes || 45,
      selectedLessonIds,
      totalMCQ,
      totalTF,
      totalSA,
      totalTL,
      availableQuestions: available
    });

    return NextResponse.json({ success: true, matrix });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
