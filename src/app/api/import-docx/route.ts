import { NextResponse } from 'next/server';
import { parseDocxBuffer } from '@/lib/wordParser';
import { addQuestion } from '@/lib/db';
import { Grade } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const grade = (formData.get('grade') as Grade) || '11';
    const lessonId = (formData.get('lessonId') as string) || 'k11_b1';

    if (!file) {
      return NextResponse.json({ error: 'Vui lòng đính kèm file Word (.docx)' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parseResult = await parseDocxBuffer(buffer, grade, lessonId);

    // Save imported questions to DB
    for (const q of parseResult.questions) {
      addQuestion(q);
    }

    return NextResponse.json({
      success: true,
      stats: parseResult.stats,
      questions: parseResult.questions
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
