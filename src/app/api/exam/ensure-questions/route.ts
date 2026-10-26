import { NextResponse } from 'next/server';
import { planMatrixPicks } from '@/lib/examGenerator';
import { getQuestions, addQuestion, getConfig } from '@/lib/db';
import { generateSingleAIQuestion } from '@/lib/aiService';
import { CURRICULUM_DATA, Lesson, Topic } from '@/lib/curriculumData';
import { ExamMatrix, Question } from '@/lib/types';

// Vercel Hobby cho phép tối đa 60s/function (Fluid Compute). Route này sinh câu
// theo ĐỢT NHỎ: mỗi request chỉ chạy trong khung thời gian an toàn rồi trả về
// số câu còn thiếu (`remaining`) để client gọi tiếp đợt sau.
export const maxDuration = 60;

// Dừng sinh trước khi chạm ngưỡng kill của platform, chừa chỗ trả response.
const TIME_BUDGET_MS = 42_000;
// Số câu tối đa mặc định mỗi request — client có thể gửi giá trị nhỏ hơn.
const DEFAULT_MAX_GENERATE = 5;

/**
 * Đảm bảo ngân hàng đủ câu đúng dạng × mức × bài theo ma trận.
 * Thiếu bao nhiêu sinh bấy nhiêu bằng AI (lưu luôn vào ngân hàng câu hỏi).
 * extraQuestions: câu client đã sinh ở các đợt trước (serverless nhiều instance
 * có thể không thấy nhau qua /tmp) — gộp vào để tính thiếu và tránh trùng.
 */
export async function POST(request: Request) {
  const startedAt = Date.now();
  try {
    const body = await request.json();
    const matrix = body.matrix as ExamMatrix;
    const maxGenerate: number = typeof body.maxGenerate === 'number' && body.maxGenerate > 0
      ? body.maxGenerate
      : DEFAULT_MAX_GENERATE;
    const extraQuestions: Question[] = Array.isArray(body.extraQuestions) ? body.extraQuestions : [];

    if (!matrix || !matrix.rows || matrix.rows.length === 0) {
      return NextResponse.json({ error: 'Dữ liệu ma trận không hợp lệ' }, { status: 400 });
    }

    // Gộp ngân hàng trên server với câu client đã có (client là nguồn sự thật
    // khi chạy trên serverless, nơi /tmp không đồng bộ giữa các instance)
    const bank = getQuestions();
    const bankIds = new Set(bank.map(q => q.id));
    const merged = [...bank, ...extraQuestions.filter(q => !bankIds.has(q.id))];

    const { gaps } = planMatrixPicks(matrix, merged);
    const totalMissing = gaps.reduce((s, g) => s + g.missing, 0);

    if (totalMissing === 0) {
      return NextResponse.json({ generated: 0, questions: [], errors: [], remaining: 0, totalMissing: 0 });
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
    const bankNow = [...merged]; // ngân hàng phình ra trong lượt sinh — dùng để tránh trùng cả câu vừa sinh

    outer:
    for (const gap of gaps) {
      if (generated.length >= maxGenerate) break;
      const info = lessonsById.get(gap.lessonId);
      if (!info) {
        errors.push(`Không tìm thấy bài học "${gap.lessonId}" trong chương trình.`);
        continue;
      }
      for (let i = 0; i < gap.missing && generated.length < maxGenerate; i++) {
        if (Date.now() - startedAt > TIME_BUDGET_MS) {
          break outer; // sắp chạm giới hạn thời gian — trả về để client gọi đợt tiếp theo
        }
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
      totalMissing,
      gaps
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
