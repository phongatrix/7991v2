import { ExamMatrix, ExamSpec, ExamVariant, ExamVariantQuestion, FullExamPackage, Question, QuestionType, Level, LEVELS } from './types';
import { generateSpec } from './specGenerator';

export interface GenerateExamOptions {
  matrix: ExamMatrix;
  availableQuestions: Question[];
  department?: string;
  school?: string;
  title?: string;
  variantCount?: number; // e.g. 1, 2, 4
  chosenQuestionIds?: string[]; // optionally enforce specific questions
}

// Báo cáo thiếu hụt: từng ô (bài × dạng × mức) trên ma trận không đủ câu trong ngân hàng
export interface MatrixGap {
  lessonId: string;
  type: QuestionType;
  level: Level;
  missing: number;
}

const cellSuffix = (lv: Level) => lv === 'biet' ? 'b' : lv === 'hieu' ? 'h' : lv === 'vandung' ? 'vd' : 'vdc';

function shuffleArray<T>(array: T[], seedStr?: string): T[] {
  const arr = [...array];
  // Simple deterministic or pseudo-random shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Bốc câu NGHIÊM NGẶT theo ma trận: mỗi câu phải đúng bài + đúng dạng + đúng mức độ
 * của ô trên ma trận (câu Đúng/Sai khớp ở tầng 4 ý theo mức đã dàn của từng dòng).
 * Không đủ thì ghi nhận vào gaps để hệ thống tự sinh bổ sung — tuyệt đối không
 * lấy lệch dạng/mức hay tái sử dụng câu đã chọn như trước đây.
 */
export function planMatrixPicks(matrix: ExamMatrix, pool: Question[], enforcedIds: string[] = []): { picked: Question[]; gaps: MatrixGap[] } {
  const picked: Question[] = [];
  const usedIds = new Set<string>();
  const gaps = new Map<string, MatrixGap>();

  const addGap = (lessonId: string, type: QuestionType, level: Level) => {
    const key = `${lessonId}|${type}|${level}`;
    const g = gaps.get(key);
    if (g) g.missing += 1;
    else gaps.set(key, { lessonId, type, level, missing: 1 });
  };

  // Câu được chỉ định thủ công (tính năng đổi câu) dùng trước
  if (enforcedIds.length > 0) {
    for (const id of enforcedIds) {
      const q = pool.find(item => item.id === id);
      if (q && !usedIds.has(q.id)) {
        picked.push(q);
        usedIds.add(q.id);
      }
    }
  }

  const takeExact = (lessonId: string, type: QuestionType, level: Level): boolean => {
    const q = pool.find(item => item.lessonId === lessonId && item.type === type && item.level === level && !usedIds.has(item.id));
    if (!q) return false;
    usedIds.add(q.id);
    picked.push(q);
    return true;
  };

  const dominantLevel = (need: Record<Level, number>): Level => {
    let best: Level = 'hieu';
    for (const lv of LEVELS) if ((need[lv] || 0) > (need[best] || 0)) best = lv;
    return best;
  };

  // Đếm số ý theo mức của một câu Đúng/Sai
  const tfItemCounts = (q: Question): Record<Level, number> => {
    const counts: Record<Level, number> = { biet: 0, hieu: 0, vandung: 0, vandungcao: 0 };
    if (Array.isArray(q.items) && q.items.length) {
      for (const it of q.items) counts[it.level] = (counts[it.level] || 0) + 1;
    } else {
      counts[q.level] += 1;
    }
    return counts;
  };

  for (const row of matrix.rows) {
    const c = row.cells;
    const lId = row.lessonId;
    const cnt = (p: 'mcq' | 'tf' | 'sa' | 'tl', lv: Level) =>
      ((c as any)[`${p}_${cellSuffix(lv)}`] as number) || 0;

    // MCQ — đúng bài, đúng mức
    for (const lv of LEVELS) {
      for (let i = 0; i < cnt('mcq', lv); i++) {
        if (!takeExact(lId, 'MCQ', lv)) addGap(lId, 'MCQ', lv);
      }
    }

    // TF — mỗi câu lớn 4 ý; chọn câu cùng bài có phân bố mức của 4 ý
    // khớp nhất với nhu cầu mức còn lại của dòng ma trận
    const tfNeed: Record<Level, number> = { biet: cnt('tf', 'biet'), hieu: cnt('tf', 'hieu'), vandung: cnt('tf', 'vandung'), vandungcao: cnt('tf', 'vandungcao') };
    const tfCount = Math.round(LEVELS.reduce((s, lv) => s + tfNeed[lv], 0) / 4);
    for (let i = 0; i < tfCount; i++) {
      const candidates = pool.filter(q => q.lessonId === lId && q.type === 'TF' && !usedIds.has(q.id));
      if (candidates.length === 0) {
        addGap(lId, 'TF', dominantLevel(tfNeed));
        continue;
      }
      let best = candidates[0];
      let bestCost = Infinity;
      for (const cand of candidates) {
        const counts = tfItemCounts(cand);
        const cost = LEVELS.reduce((s, lv) => s + Math.abs(tfNeed[lv] - counts[lv]), 0);
        if (cost < bestCost) { bestCost = cost; best = cand; }
      }
      usedIds.add(best.id);
      picked.push(best);
      const counts = tfItemCounts(best);
      for (const lv of LEVELS) if (tfNeed[lv] > 0 && counts[lv] > 0) tfNeed[lv] -= 1;
    }

    // SA + TL — đúng bài, đúng mức
    for (const lv of LEVELS) {
      for (let i = 0; i < cnt('sa', lv); i++) {
        if (!takeExact(lId, 'SA', lv)) addGap(lId, 'SA', lv);
      }
      for (let i = 0; i < cnt('tl', lv); i++) {
        if (!takeExact(lId, 'TL', lv)) addGap(lId, 'TL', lv);
      }
    }
  }

  return { picked, gaps: Array.from(gaps.values()) };
}

export function pickQuestionsForMatrix(matrix: ExamMatrix, pool: Question[], enforcedIds: string[] = []): Question[] {
  return planMatrixPicks(matrix, pool, enforcedIds).picked;
}

export function buildExamPackage(options: GenerateExamOptions): FullExamPackage {
  const {
    matrix,
    availableQuestions,
    department = "SỞ GIÁO DỤC & ĐÀO TẠO ĐỒNG THÁP",
    school = "TRƯỜNG THPT TRƯƠNG ĐỊNH",
    title = matrix.title || "ĐỀ KIỂM TRA ĐỊNH KỲ",
    variantCount = 4,
    chosenQuestionIds = []
  } = options;

  // 1. Pick questions for this exam
  const picked = pickQuestionsForMatrix(matrix, availableQuestions, chosenQuestionIds);

  // 2. Generate specification based on picked questions
  const spec = generateSpec(matrix, picked);

  // 3. Separate by types
  const mcqPool = picked.filter(q => q.type === 'MCQ');
  const tfPool = picked.filter(q => q.type === 'TF');
  const saPool = picked.filter(q => q.type === 'SA');
  const tlPool = picked.filter(q => q.type === 'TL');

  // 4. Generate variants (001, 002, 003, ...)
  const variants: ExamVariant[] = [];

  for (let v = 1; v <= Math.max(1, variantCount); v++) {
    const code = String(v).padStart(3, '0');

    let mcqList: ExamVariantQuestion[] = [];
    let tfList: ExamVariantQuestion[] = [];
    let saList: ExamVariantQuestion[] = [];
    let tlList: ExamVariantQuestion[] = [];

    if (v === 1) {
      // Variant 001: Original order, no shuffling
      mcqList = mcqPool.map((q, idx) => ({
        originalIndex: idx,
        variantNumber: idx + 1,
        question: q,
        shuffledOptions: q.a ? q.a.map((opt, oIdx) => ({ text: opt, originalIndex: oIdx })) : undefined,
        shuffledCorrectIndex: q.correct
      }));

      tfList = tfPool.map((q, idx) => ({
        originalIndex: idx,
        variantNumber: idx + 1,
        question: q
      }));

      saList = saPool.map((q, idx) => ({
        originalIndex: idx,
        variantNumber: idx + 1,
        question: q
      }));

      tlList = tlPool.map((q, idx) => ({
        originalIndex: idx,
        variantNumber: idx + 1,
        question: q
      }));
    } else {
      // Variants 002+: Scramble questions & options
      const shuffledMCQ = shuffleArray(mcqPool);
      mcqList = shuffledMCQ.map((q, idx) => {
        const origIdx = mcqPool.findIndex(x => x.id === q.id);
        if (q.a && q.a.length === 4) {
          const rawOptions = q.a.map((opt, oIdx) => ({ text: opt, originalIndex: oIdx }));
          const shuffledOpts = shuffleArray(rawOptions);
          const newCorrectIdx = shuffledOpts.findIndex(opt => opt.originalIndex === q.correct);
          return {
            originalIndex: origIdx,
            variantNumber: idx + 1,
            question: q,
            shuffledOptions: shuffledOpts,
            shuffledCorrectIndex: newCorrectIdx
          };
        }
        return {
          originalIndex: origIdx,
          variantNumber: idx + 1,
          question: q,
          shuffledCorrectIndex: q.correct
        };
      });

      const shuffledTF = shuffleArray(tfPool);
      tfList = shuffledTF.map((q, idx) => ({
        originalIndex: tfPool.findIndex(x => x.id === q.id),
        variantNumber: idx + 1,
        question: q
      }));

      const shuffledSA = shuffleArray(saPool);
      saList = shuffledSA.map((q, idx) => ({
        originalIndex: saPool.findIndex(x => x.id === q.id),
        variantNumber: idx + 1,
        question: q
      }));

      const shuffledTL = shuffleArray(tlPool);
      tlList = shuffledTL.map((q, idx) => ({
        originalIndex: tlPool.findIndex(x => x.id === q.id),
        variantNumber: idx + 1,
        question: q
      }));
    }

    variants.push({
      code,
      mcq: mcqList,
      tf: tfList,
      sa: saList,
      tl: tlList
    });
  }

  return {
    id: `exam_${Date.now()}`,
    title,
    department,
    school,
    grade: matrix.grade,
    subject: matrix.subject,
    durationMinutes: matrix.durationMinutes,
    matrix,
    spec,
    variants,
    selectedQuestionIds: picked.map(q => q.id),
    createdAt: new Date().toISOString()
  };
}
