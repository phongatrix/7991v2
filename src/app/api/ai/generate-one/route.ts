import { NextResponse } from 'next/server';
import { generateSingleAIQuestion } from '@/lib/aiService';
import { addQuestion, getQuestions } from '@/lib/db';
import { CURRICULUM_DATA } from '@/lib/curriculumData';
import { getSgkLessonText } from '@/lib/sgkContent';
import { Grade, QuestionType, Level, LEVELS } from '@/lib/types';

const VALID_TYPES: QuestionType[] = ['MCQ', 'TF', 'SA', 'TL'];

// Sinh 1 câu có thể mất >10s (nhiều lượt thử lại) — xin ngưỡng thời gian tối đa
// của serverless (Vercel Hobby: 60s với Fluid Compute).
export const maxDuration = 60;

/**
 * Sinh NGẪU NHIÊN đúng 1 câu hỏi mới theo khối lớp/bài học/dạng/mức độ đã chọn,
 * tham khảo phong cách các câu mẫu cùng loại trong kho, rồi tự lưu vào ngân hàng.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const grade: Grade = ['10', '11', '12'].includes(body.grade) ? body.grade : '11';
    const lessonId: string = body.lessonId || '';
    const type: QuestionType = VALID_TYPES.includes(body.type) ? body.type : 'MCQ';
    const level: Level = (LEVELS as string[]).includes(body.level) ? body.level : 'biet';

    if (!lessonId) {
      return NextResponse.json({ error: 'Vui lòng chọn bài học' }, { status: 400 });
    }

    const topic = (CURRICULUM_DATA[grade] || []).find(t => t.lessons.some(l => l.id === lessonId));
    const lesson = topic?.lessons.find(l => l.id === lessonId);
    if (!topic || !lesson) {
      return NextResponse.json({ error: 'Không tìm thấy bài học trong chương trình SGK' }, { status: 400 });
    }

    // Chọn tối đa 3 câu mẫu cùng dạng để AI học phong cách: ưu tiên cùng bài, sau đó cùng khối
    const all = getQuestions();
    const sameLesson = all.filter(q => q.lessonId === lessonId && q.type === type);
    const sameGradeType = all.filter(q => q.grade === grade && q.type === type && q.lessonId !== lessonId);
    const pool = [...sameLesson, ...sameGradeType].slice(0, 3);

    const samples = pool.map((q, i) => {
      const answerSummary =
        q.type === 'MCQ'
          ? `Đáp án đúng: ${q.a?.[q.correct ?? 0] ?? '?'}`
          : q.type === 'TF'
          ? `Kết quả Đ/S: ${(q.items || []).map((it, k) => `${['a', 'b', 'c', 'd'][k]})=${it.isTrue ? 'Đ' : 'S'}`).join(', ')}`
          : q.type === 'SA'
          ? `Đáp án: ${q.correctSA}`
          : `Đáp án (tóm tắt): ${(q.essayAnswer || '').slice(0, 150)}...`;
      return `Mẫu ${i + 1} (mức ${q.level}, mã ${q.yccd}): ${q.q}\n   → ${answerSummary}`;
    }).join('\n');

    // Trên Vercel phải xong trong ~50s để kịp trả JSON trước khi bị kill
    const deadline = process.env.VERCEL ? Date.now() + 50_000 : undefined;

    const question = await generateSingleAIQuestion({
      grade,
      lessonId,
      lessonName: lesson.fullName,
      topicName: topic.name,
      lessonDescription: lesson.description,
      sgkContent: getSgkLessonText(grade, lessonId),
      type,
      level,
      samples,
      existingQuestions: all,
      deadline
    });

    addQuestion(question);
    return NextResponse.json({
      success: true,
      question,
      samplesUsed: pool.length
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
