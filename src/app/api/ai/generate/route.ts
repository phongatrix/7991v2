import { NextResponse } from 'next/server';
import { generateAIQuestionsWithFailover } from '@/lib/aiService';
import { addQuestion, getQuestions } from '@/lib/db';

// Sinh cả lô câu cho 1 bài có thể kéo dài — xin ngưỡng thời gian tối đa của
// serverless (Vercel Hobby: 60s với Fluid Compute).
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      grade = '11',
      subject = 'Tin học',
      topicName,
      lessonId,
      lessonName,
      lessonDescription,
      mcq_b, mcq_h, mcq_vd, mcq_vdc, tl_vdc,
      tf_count, tf_b, tf_h, tf_vd,
      sa_b, sa_h, sa_vd,
      tl_b, tl_h, tl_vd,
      autoSave = true
    } = body;

    if (!lessonName || !topicName || !lessonId) {
      return NextResponse.json({ error: 'Thiếu thông tin bài học hoặc chủ đề' }, { status: 400 });
    }

    const questions = await generateAIQuestionsWithFailover({
      grade,
      subject,
      topicName,
      lessonName,
      lessonDescription,
      mcq_b, mcq_h, mcq_vd, mcq_vdc, tl_vdc,
      tf_count, tf_b, tf_h, tf_vd,
      sa_b, sa_h, sa_vd,
      tl_b, tl_h, tl_vd
    }, lessonId, getQuestions());

    if (autoSave) {
      for (const q of questions) {
        addQuestion(q);
      }
    }

    return NextResponse.json({
      success: true,
      totalGenerated: questions.length,
      questions
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
