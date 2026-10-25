import { NextResponse } from 'next/server';
import { planMatrixPicks } from '@/lib/examGenerator';
import { getQuestions, addQuestion, getConfig } from '@/lib/db';
import { generateSingleAIQuestion } from '@/lib/aiService';
import { CURRICULUM_DATA, Lesson, Topic } from '@/lib/curriculumData';
import { ExamMatrix, Question } from '@/lib/types';

/**
 * Đảm bảo ngân hàng đủ câu đúng dạng × mức × bài theo ma trận.
 * Thiếu bao nhiêu sinh bấy nhiêu bằng AI (lưu luôn vào ngân hàng câu hỏi).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const matrix = body.matrix as ExamMatrix;
    const maxGenerate: number = typeof body.maxGenerate === 'number' ? body.maxGenerate : 60;

    if (!matrix || !matrix.rows || matrix.rows.length === 0) {
      return NextResponse.json({ error: 'Dữ liệu ma trận không hợp lệ' }, { status: 400 });
    }

    const bank = getQuestions();
    const { gaps } = planMatrixPicks(matrix, bank);
    const totalMissing = gaps.reduce((s, g) => s + g.missing, 0);

    if (totalMissing === 0) {
      return NextResponse.json({ generated: 0, questions: [], errors: [], remaining: 0 });
    }

    const config = getConfig();
    const apiKey = config.geminiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        error: `Ngân hàng câu hỏi còn thiếu ${totalMissing} câu đúng dạng/mức độ theo ma trận, nhưng chưa cấu hình API Key Gemini để tự sinh bổ sung. Hãy bấm "Cấu hình API Key" trên thanh công cụ.`,
        gaps,
        totalMissing
      }, { status: 400 });
    }

    const lessonsById = new Map<string, { lesson: Lesson; topic: Topic }>();
    for (const t of CURRICULUM_DATA[matrix.grade] || []) {
      for (const l of t.lessons) lessonsById.set(l.id, { lesson: l, topic: t });
    }

    const generated: Question[] = [];
    const errors: string[] = [];
    const bankNow = [...bank]; // ngân hàng phình ra trong lượt sinh — dùng để tránh trùng cả câu vừa sinh

    for (const gap of gaps) {
      if (generated.length >= maxGenerate) break;
      const info = lessonsById.get(gap.lessonId);
      if (!info) {
        errors.push(`Không tìm thấy bài học "${gap.lessonId}" trong chương trình.`);
        continue;
      }
      for (let i = 0; i < gap.missing && generated.length < maxGenerate; i++) {
        try {
          const q = await generateSingleAIQuestion({
            grade: matrix.grade,
            subject: matrix.subject,
            lessonId: gap.lessonId,
            lessonName: info.lesson.fullName,
            topicName: info.topic.name,
            lessonDescription: info.lesson.description,
            type: gap.type,
            level: gap.level,
            existingQuestions: bankNow
          });
          addQuestion(q);
          bankNow.push(q);
          generated.push(q);
        } catch (e) {
          errors.push(`${info.lesson.fullName} — ${gap.type}/${gap.level}: ${(e as Error).message}`);
          break; // bỏ qua gap này, tránh treo cả lượt sinh
        }
      }
    }

    return NextResponse.json({
      generated: generated.length,
      questions: generated,
      errors,
      remaining: Math.max(0, totalMissing - generated.length),
      gaps
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
