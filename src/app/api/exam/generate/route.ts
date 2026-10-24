import { NextResponse } from 'next/server';
import { buildExamPackage } from '@/lib/examGenerator';
import { getQuestions, saveExam } from '@/lib/db';
import { ExamMatrix } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      matrix,
      department = 'SỞ GIÁO DỤC & ĐÀO TẠO ĐỒNG THÁP',
      school = 'TRƯỜNG THPT TRƯƠNG ĐỊNH',
      title,
      variantCount = 4,
      chosenQuestionIds = []
    } = body;

    if (!matrix || !matrix.rows || matrix.rows.length === 0) {
      return NextResponse.json({ error: 'Dữ liệu ma trận không hợp lệ' }, { status: 400 });
    }

    const available = getQuestions();
    const examPackage = buildExamPackage({
      matrix: matrix as ExamMatrix,
      availableQuestions: available,
      department,
      school,
      title: title || matrix.title,
      variantCount,
      chosenQuestionIds
    });

    saveExam(examPackage);

    return NextResponse.json({ success: true, exam: examPackage });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
