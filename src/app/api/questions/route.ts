import { NextResponse } from 'next/server';
import { getQuestions, addQuestion, deleteQuestion } from '@/lib/db';
import { Question } from '@/lib/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const grade = searchParams.get('grade');
  const lessonId = searchParams.get('lessonId');
  const type = searchParams.get('type');
  const level = searchParams.get('level');
  const query = searchParams.get('q')?.toLowerCase();

  let questions = getQuestions();

  if (grade) {
    questions = questions.filter(q => q.grade === grade);
  }
  if (lessonId) {
    questions = questions.filter(q => q.lessonId === lessonId);
  }
  if (type) {
    questions = questions.filter(q => q.type === type);
  }
  if (level) {
    questions = questions.filter(q => q.level === level);
  }
  if (query) {
    questions = questions.filter(q =>
      q.q.toLowerCase().includes(query) ||
      (q.yccdContent && q.yccdContent.toLowerCase().includes(query))
    );
  }

  return NextResponse.json({
    total: questions.length,
    questions
  });
}

export async function POST(request: Request) {
  try {
    const body: Question = await request.json();
    if (!body.q || !body.type || !body.lessonId) {
      return NextResponse.json({ error: 'Thiếu thông tin câu hỏi bắt buộc' }, { status: 400 });
    }

    if (!body.id) {
      body.id = `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }

    const saved = addQuestion(body);
    return NextResponse.json({ success: true, question: saved });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Thiếu id câu hỏi' }, { status: 400 });
    }

    const ok = deleteQuestion(id);
    return NextResponse.json({ success: ok });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
