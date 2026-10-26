import { NextResponse } from 'next/server';
import { planMatrixPicks } from '@/lib/examGenerator';
import { getQuestions, getConfig } from '@/lib/db';
import { generateSingleAIQuestion, GEMINI_DEADLINE_MSG } from '@/lib/aiService';
import { CURRICULUM_DATA, Lesson, Topic } from '@/lib/curriculumData';
import { ExamMatrix, Question } from '@/lib/types';

// Vercel Hobby cho phép tối đa 60s/function (Fluid Compute). Route này sinh câu
// theo ĐỢT NHỎ: mỗi request chỉ chạy trong khung thời gian an toàn rồi trả về
// số câu còn thiếu (`remaining`) để client gọi tiếp đợt sau.
export const maxDuration = 60;

// Vercel: chỉ BẮT ĐẦU câu mới trong 30s đầu, mỗi câu có deadline riêng, toàn
// request tối đa ~52s (< 60s) — đảm bảo luôn trả được JSON thay vì bị kill.
// Local không bị platform kill nên ngân sách giờ thoáng hơn.
const IS_VERCEL = Boolean(process.env.VERCEL);
const NEW_QUESTION_GATE_MS = IS_VERCEL ? 30_000 : 8 * 60_000;
const HARD_CAP_MS = IS_VERCEL ? 52_000 : 10 * 60_000;
const PER_QUESTION_SLICE_MS = IS_VERCEL ? 22_000 : 60_000;
// Số câu tối đa mặc định mỗi request — client có thể gửi giá trị nhỏ hơn.
const DEFAULT_MAX_GENERATE = 5;

/**
 * Đảm bảo ngân hàng đủ câu đúng dạng × mức × bài theo ma trận.
 * Thiếu bao nhiêu sinh bấy nhiêu bằng AI. Các câu sinh ra KHÔNG tự ghi vào
 * ngân hàng — client hiển thị pop-up xem lại, người dùng bấm
 * "Thêm vào ngân hàng câu hỏi" để lưu (hoặc Sửa → Lưu từng câu).
 * extraQuestions: câu client đã có (các đợt trước + toàn bộ kho phía client)
 * — dùng để tính thiếu và tránh trùng mà không cần server lưu trước.
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
        const elapsed = Date.now() - startedAt;
        if (elapsed > NEW_QUESTION_GATE_MS || elapsed > HARD_CAP_MS - PER_QUESTION_SLICE_MS) {
          break outer; // sắp hết ngân sách giờ — trả về để client gọi đợt tiếp theo
        }
        // Deadline cho riêng câu này: nằm gọn trong giới hạn cứng của request
        const deadline = Math.min(startedAt + HARD_CAP_MS, Date.now() + PER_QUESTION_SLICE_MS);
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
            existingQuestions: bankNow,
            deadline
          });
          // Không tự lưu — chỉ trả về cho client xem lại rồi tự quyết định lưu
          bankNow.push(q);
          generated.push(q);
        } catch (e) {
          const msg = (e as Error).message || '';
          if (msg.includes(GEMINI_DEADLINE_MSG)) {
            break outer; // hết giờ đợt này (bình thường với cơ chế chia đợt) — không tính là lỗi
          }
          errors.push(`${info.lesson.fullName} — ${gap.type}/${gap.level}: ${msg}`);
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
