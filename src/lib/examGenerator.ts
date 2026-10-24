import { ExamMatrix, ExamSpec, ExamVariant, ExamVariantQuestion, FullExamPackage, Question, QuestionType, Level } from './types';
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

function shuffleArray<T>(array: T[], seedStr?: string): T[] {
  const arr = [...array];
  // Simple deterministic or pseudo-random shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function pickQuestionsForMatrix(matrix: ExamMatrix, pool: Question[], enforcedIds: string[] = []): Question[] {
  const picked: Question[] = [];
  const usedIds = new Set<string>();

  // If specific IDs were enforced and match, use them first
  if (enforcedIds.length > 0) {
    for (const id of enforcedIds) {
      const q = pool.find(item => item.id === id);
      if (q && !usedIds.has(q.id)) {
        picked.push(q);
        usedIds.add(q.id);
      }
    }
  }

  const findQuestion = (lessonId: string, type: QuestionType, level: Level): Question | undefined => {
    // 1. Try exact match lesson + type + level not used
    let match = pool.find(q => q.lessonId === lessonId && q.type === type && q.level === level && !usedIds.has(q.id));
    if (match) return match;

    // 2. Try match lesson + type (any level)
    match = pool.find(q => q.lessonId === lessonId && q.type === type && !usedIds.has(q.id));
    if (match) return match;

    // 3. Try match type + level from any lesson
    match = pool.find(q => q.type === type && q.level === level && !usedIds.has(q.id));
    if (match) return match;

    // 4. Try any unused question of same type
    match = pool.find(q => q.type === type && !usedIds.has(q.id));
    if (match) return match;

    // 5. Fallback: reuse already used question
    return pool.find(q => q.type === type);
  };

  for (const row of matrix.rows) {
    const c = row.cells;
    const lId = row.lessonId;

    // Pick MCQ
    for (let i = 0; i < c.mcq_b; i++) {
      const q = findQuestion(lId, 'MCQ', 'biet');
      if (q) { picked.push(q); usedIds.add(q.id); }
    }
    for (let i = 0; i < c.mcq_h; i++) {
      const q = findQuestion(lId, 'MCQ', 'hieu');
      if (q) { picked.push(q); usedIds.add(q.id); }
    }
    for (let i = 0; i < c.mcq_vd; i++) {
      const q = findQuestion(lId, 'MCQ', 'vandung');
      if (q) { picked.push(q); usedIds.add(q.id); }
    }
    for (let i = 0; i < c.mcq_vdc; i++) {
      const q = findQuestion(lId, 'MCQ', 'vandungcao');
      if (q) { picked.push(q); usedIds.add(q.id); }
    }

    // Pick TF (mỗi câu TF gồm 4 ý trải theo các mức đã dàn trong ma trận)
    const tfCount = Math.round((c.tf_b + c.tf_h + c.tf_vd + c.tf_vdc) / 4);
    for (let i = 0; i < tfCount; i++) {
      const q = findQuestion(lId, 'TF', 'hieu');
      if (q) { picked.push(q); usedIds.add(q.id); }
    }

    // Pick SA
    for (let i = 0; i < c.sa_b; i++) {
      const q = findQuestion(lId, 'SA', 'biet');
      if (q) { picked.push(q); usedIds.add(q.id); }
    }
    for (let i = 0; i < c.sa_h; i++) {
      const q = findQuestion(lId, 'SA', 'hieu');
      if (q) { picked.push(q); usedIds.add(q.id); }
    }
    for (let i = 0; i < c.sa_vd; i++) {
      const q = findQuestion(lId, 'SA', 'vandung');
      if (q) { picked.push(q); usedIds.add(q.id); }
    }
    for (let i = 0; i < c.sa_vdc; i++) {
      const q = findQuestion(lId, 'SA', 'vandungcao');
      if (q) { picked.push(q); usedIds.add(q.id); }
    }

    // Pick TL
    for (let i = 0; i < c.tl_b; i++) {
      const q = findQuestion(lId, 'TL', 'biet');
      if (q) { picked.push(q); usedIds.add(q.id); }
    }
    for (let i = 0; i < c.tl_h; i++) {
      const q = findQuestion(lId, 'TL', 'hieu');
      if (q) { picked.push(q); usedIds.add(q.id); }
    }
    for (let i = 0; i < c.tl_vd; i++) {
      const q = findQuestion(lId, 'TL', 'vandung');
      if (q) { picked.push(q); usedIds.add(q.id); }
    }
    for (let i = 0; i < c.tl_vdc; i++) {
      const q = findQuestion(lId, 'TL', 'vandungcao');
      if (q) { picked.push(q); usedIds.add(q.id); }
    }
  }

  return picked;
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
