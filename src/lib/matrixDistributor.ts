import { Lesson, Topic, CURRICULUM_DATA } from './curriculumData';
import { Question, ExamMatrix, MatrixRow, MatrixCell, Grade, LEVELS, Level } from './types';

export interface DistributeOptions {
  grade: Grade;
  subject: string;
  title: string;
  durationMinutes: number;
  selectedLessonIds: string[];
  totalMCQ?: number; // default 12
  totalTF?: number;  // default 4 (số câu lớn, mỗi câu 4 ý)
  totalSA?: number;  // default 0
  totalTL?: number;  // default 3
  availableQuestions?: Question[];
  useSampleLayout?: boolean; // dùng bố cục cố định của mau.pdf (chỉ cho nút nạp đề mẫu)
}

// Mục tiêu tỉ lệ điểm theo mức độ (CV 7991): Biết 40% · Hiểu 30% · Vận dụng 20% · Vận dụng cao 10%
// Đơn vị điểm: 1 unit = 0.25đ → thang 10đ = 40 units.
const LEVEL_TARGET_UNITS: Record<Level, number> = {
  biet: 16,      // 4.00đ
  hieu: 12,      // 3.00đ
  vandung: 8,    // 2.00đ
  vandungcao: 4, // 1.00đ
};

export interface GradeTotals {
  totalMCQ: number;
  totalTF: number;
  totalSA: number;
  totalTL: number;
}

// Cấu hình số câu mặc định theo khối (tổng 10đ, giữ tỉ lệ mức độ 40/30/20/10):
// - Khối 12: 24 MCQ (6đ) + 4 TF (4đ) + 0 SA + 0 TL — không có tự luận
// - Khối 10 & 11: 16 MCQ (4đ) + 3 TF (3đ) + 0 SA + 3 TL (3đ)
export function gradeDefaultTotals(grade: Grade): GradeTotals {
  if (grade === '12') {
    return { totalMCQ: 24, totalTF: 4, totalSA: 0, totalTL: 0 };
  }
  return { totalMCQ: 16, totalTF: 3, totalSA: 0, totalTL: 3 };
}

// Các mẫu phân bổ 4 ý (a–d) của một câu Đúng-Sai theo mức độ, tính theo unit 0.25đ/ý.
// Thứ tự mức: [biet, hieu, vandung, vandungcao]
const TF_PATTERNS: { units: [number, number, number, number] }[] = [
  { units: [2, 1, 1, 0] }, // chuẩn mau.pdf: a,b=B; c=H; d=VD
  { units: [2, 1, 0, 1] }, // a,b=B; c=H; d=VDC
  { units: [1, 1, 1, 1] }, // trải đều 4 mức: a=B; b=H; c=VD; d=VDC
];

const levelSuffix = (lv: Level) => lv === 'biet' ? 'b' : lv === 'hieu' ? 'h' : lv === 'vandung' ? 'vd' : 'vdc';
const ck = (prefix: 'mcq' | 'tf' | 'sa' | 'tl', lv: Level) => `${prefix}_${levelSuffix(lv)}` as keyof MatrixCell;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Chỉ số phần tử được bốc ngẫu nhiên theo trọng số */
function weightedPickIndex(weights: number[]): number {
  const total = weights.reduce((s, w) => s + w, 0);
  if (total <= 0) return Math.floor(Math.random() * weights.length);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

function emptyCells(): MatrixCell {
  return {
    mcq_b: 0, mcq_h: 0, mcq_vd: 0, mcq_vdc: 0,
    tf_b: 0, tf_h: 0, tf_vd: 0, tf_vdc: 0,
    sa_b: 0, sa_h: 0, sa_vd: 0, sa_vdc: 0,
    tl_b: 0, tl_h: 0, tl_vd: 0, tl_vdc: 0
  };
}

export function autoDistributeMatrix(options: DistributeOptions): ExamMatrix {
  const {
    grade,
    subject = "Tin học",
    title = `ĐỀ KIỂM TRA ĐỊNH KỲ MÔN TIN HỌC ${options.grade}`,
    durationMinutes = 45,
    selectedLessonIds,
    totalMCQ = 12,
    totalTF = 4,
    totalSA = 0,
    totalTL = 3,
    useSampleLayout = false
  } = options;

  const topics = CURRICULUM_DATA[grade] || [];
  const selectedLessons: { lesson: Lesson; topic: Topic }[] = [];
  for (const t of topics) {
    for (const l of t.lessons) {
      if (selectedLessonIds.includes(l.id)) selectedLessons.push({ lesson: l, topic: t });
    }
  }
  if (selectedLessons.length === 0) {
    throw new Error("Vui lòng chọn ít nhất 1 bài học.");
  }

  const rows: MatrixRow[] = selectedLessons.map(({ lesson, topic }) => ({
    topicId: topic.id,
    topicName: topic.name,
    lessonId: lesson.id,
    lessonName: lesson.fullName,
    cells: emptyCells(),
    totalBiet: 0,
    totalHieu: 0,
    totalVD: 0,
    totalVDC: 0,
    totalPoints: 0,
    percentage: 0
  }));

  // Bố cục cố định của đề mẫu mau.pdf (K11 Bài 1–5), bổ sung mức Vận dụng cao ở câu TL Bài 1.
  const isK11Sample = useSampleLayout &&
    grade === '11' &&
    selectedLessons.length === 5 &&
    selectedLessons.every(sl => ['k11_b1', 'k11_b2', 'k11_b3', 'k11_b4', 'k11_b5'].includes(sl.lesson.id)) &&
    totalMCQ === 12 && totalTF === 4 && totalSA === 0 && totalTL === 3;

  if (isK11Sample) {
    for (const row of rows) {
      if (row.lessonId === 'k11_b1') {
        row.cells.tf_b = 2; row.cells.tf_h = 1; row.cells.tf_vd = 1;
        row.cells.tl_vdc = 1;
      } else if (row.lessonId === 'k11_b2') {
        row.cells.mcq_b = 2; row.cells.mcq_h = 1; row.cells.mcq_vd = 1;
        row.cells.tf_b = 2; row.cells.tf_h = 1; row.cells.tf_vd = 1;
      } else if (row.lessonId === 'k11_b3') {
        row.cells.mcq_b = 1; row.cells.mcq_h = 2; row.cells.mcq_vd = 1;
        row.cells.tf_b = 2; row.cells.tf_h = 1; row.cells.tf_vd = 1;
      } else if (row.lessonId === 'k11_b4') {
        row.cells.tf_b = 2; row.cells.tf_h = 1; row.cells.tf_vd = 1;
        row.cells.tl_h = 1;
      } else if (row.lessonId === 'k11_b5') {
        row.cells.mcq_b = 1; row.cells.mcq_h = 1; row.cells.mcq_vd = 2;
        row.cells.tl_b = 1;
      }
    }
    return recalculateMatrixTotals({
      grade, subject, title, durationMinutes, selectedLessonIds, rows, totals: {} as any
    });
  }

  // =====================================================================
  // THUẬT TOÁN DÀN CÂU CHUNG — mỗi lần bấm cho bố cục KHÁC NHAU
  // nhưng tổng câu/ý theo từng (dạng × mức) luôn chốt đúng tỉ lệ quy định:
  // điểm theo mức 40% B · 30% H · 20% VD · 10% VDC; điểm theo dạng theo input.
  // =====================================================================

  // Bước 1: định mức (dạng × mức) theo đơn vị 0.25đ.
  const remaining: Record<Level, number> = { ...LEVEL_TARGET_UNITS };

  // TF (mỗi câu 4 units): chọn mẫu làm lệch mục tiêu ít nhất
  const tfQuota: Record<Level, number> = { biet: 0, hieu: 0, vandung: 0, vandungcao: 0 };
  const tfPatternPerQuestion: number[] = [];
  for (let i = 0; i < totalTF; i++) {
    let best = 0;
    let bestCost = Infinity;
    for (const pIdx of shuffle(TF_PATTERNS.map((_, idx) => idx))) {
      const units = TF_PATTERNS[pIdx].units;
      let cost = 0;
      LEVELS.forEach((lv, li) => {
        const after = remaining[lv] - units[li];
        cost += after >= 0 ? after * after : after * after * 4; // phạt nặng khi vượt mục tiêu
      });
      if (cost < bestCost) { bestCost = cost; best = pIdx; }
    }
    LEVELS.forEach((lv, li) => {
      remaining[lv] = Math.max(0, remaining[lv] - TF_PATTERNS[best].units[li]);
      tfQuota[lv] += TF_PATTERNS[best].units[li];
    });
    tfPatternPerQuestion.push(best);
  }

  // TL (mỗi câu 4 units dồn vào 1 mức, ưu tiên mức chưa có câu TL nào) → MCQ (1 unit) → SA (1 unit)
  const pickNeediestLevel = (): Level => {
    let best = shuffle(LEVELS)[0];
    for (const lv of LEVELS) if (remaining[lv] > remaining[best]) best = lv;
    return best;
  };

  const tlQuota: Record<Level, number> = { biet: 0, hieu: 0, vandung: 0, vandungcao: 0 };
  for (let i = 0; i < totalTL; i++) {
    const usable = LEVELS.filter(lv => remaining[lv] >= 1);
    const unused = usable.filter(lv => tlQuota[lv] === 0);
    let pool = unused.length > 0 ? unused : usable;
    if (pool.length === 0) pool = shuffle(LEVELS);
    let best = shuffle(pool)[0];
    for (const lv of pool) if (remaining[lv] > remaining[best]) best = lv;
    remaining[best] = Math.max(0, remaining[best] - 4);
    tlQuota[best] += 1;
  }

  const mcqQuota: Record<Level, number> = { biet: 0, hieu: 0, vandung: 0, vandungcao: 0 };
  for (let i = 0; i < totalMCQ; i++) {
    const lv = pickNeediestLevel();
    remaining[lv] = Math.max(0, remaining[lv] - 1);
    mcqQuota[lv] += 1;
  }

  const saQuota: Record<Level, number> = { biet: 0, hieu: 0, vandung: 0, vandungcao: 0 };
  for (let i = 0; i < totalSA; i++) {
    const lv = pickNeediestLevel();
    remaining[lv] = Math.max(0, remaining[lv] - 1);
    saQuota[lv] += 1;
  }

  // Bước 2: rải ngẫu nhiên hạn mức sang các bài học.
  // Trọng số giảm theo số đơn vị cùng dạng mà bài đã nhận → cân bằng nhưng mỗi lần bấm khác nhau.
  const unitsOfType = (r: MatrixRow, prefix: 'mcq' | 'tf' | 'sa' | 'tl'): number =>
    LEVELS.reduce((s, lv) => s + ((r.cells as any)[ck(prefix, lv)] as number), 0);

  const assignQuota = (prefix: 'mcq' | 'sa' | 'tl', quota: Record<Level, number>) => {
    for (const lv of shuffle(LEVELS)) {
      for (let i = 0; i < quota[lv]; i++) {
        const weights = rows.map(r => 1 / (1 + unitsOfType(r, prefix)));
        const rowIdx = weightedPickIndex(weights);
        (rows[rowIdx].cells as any)[ck(prefix, lv)] += 1;
      }
    }
  };

  assignQuota('mcq', mcqQuota);
  assignQuota('sa', saQuota);
  assignQuota('tl', tlQuota);

  // TF: gán trọn từng câu lớn (4 ý theo mẫu) vào một bài
  for (let i = 0; i < totalTF; i++) {
    const pattern = TF_PATTERNS[tfPatternPerQuestion[i]];
    const weights = rows.map(r => 1 / (1 + Math.round(unitsOfType(r, 'tf') / 4)));
    const rowIdx = weightedPickIndex(weights);
    LEVELS.forEach((lv, li) => {
      (rows[rowIdx].cells as any)[ck('tf', lv)] += pattern.units[li];
    });
  }

  return recalculateMatrixTotals({
    grade, subject, title, durationMinutes, selectedLessonIds, rows, totals: {} as any
  });
}

export function recalculateMatrixTotals(matrix: ExamMatrix): ExamMatrix {
  const levelSum: Record<Level, { items: number; mcq: number; tf: number; sa: number; tl: number; points: number }> = {
    biet: { items: 0, mcq: 0, tf: 0, sa: 0, tl: 0, points: 0 },
    hieu: { items: 0, mcq: 0, tf: 0, sa: 0, tl: 0, points: 0 },
    vandung: { items: 0, mcq: 0, tf: 0, sa: 0, tl: 0, points: 0 },
    vandungcao: { items: 0, mcq: 0, tf: 0, sa: 0, tl: 0, points: 0 },
  };

  const typeTotals = {
    mcq: { count: 0, points: 0 },
    tf: { items: 0, points: 0 },
    sa: { count: 0, points: 0 },
    tl: { count: 0, points: 0 },
  };

  for (const row of matrix.rows) {
    const c = row.cells;
    for (const lv of LEVELS) {
      const mcq = (c[ck('mcq', lv)] as number) || 0;
      const tf = (c[ck('tf', lv)] as number) || 0;
      const sa = (c[ck('sa', lv)] as number) || 0;
      const tl = (c[ck('tl', lv)] as number) || 0;
      levelSum[lv].mcq += mcq;
      levelSum[lv].tf += tf;
      levelSum[lv].sa += sa;
      levelSum[lv].tl += tl;
      levelSum[lv].items += mcq + tf + sa + tl;
      // MCQ/SA 0.25đ mỗi câu; mỗi ý TF = 0.25đ (1đ/câu ÷ 4 ý); TL 1đ/câu
      levelSum[lv].points += mcq * 0.25 + tf * 0.25 + sa * 0.25 + tl * 1.0;

      typeTotals.mcq.count += mcq;
      typeTotals.tf.items += tf;
      typeTotals.sa.count += sa;
      typeTotals.tl.count += tl;
    }

    row.totalBiet = (c.mcq_b || 0) + (c.tf_b || 0) + (c.sa_b || 0) + (c.tl_b || 0);
    row.totalHieu = (c.mcq_h || 0) + (c.tf_h || 0) + (c.sa_h || 0) + (c.tl_h || 0);
    row.totalVD = (c.mcq_vd || 0) + (c.tf_vd || 0) + (c.sa_vd || 0) + (c.tl_vd || 0);
    row.totalVDC = (c.mcq_vdc || 0) + (c.tf_vdc || 0) + (c.sa_vdc || 0) + (c.tl_vdc || 0);

    const rowPoints =
      ((c.mcq_b || 0) + (c.mcq_h || 0) + (c.mcq_vd || 0) + (c.mcq_vdc || 0)) * 0.25 +
      ((c.tf_b || 0) + (c.tf_h || 0) + (c.tf_vd || 0) + (c.tf_vdc || 0)) * 0.25 +
      ((c.sa_b || 0) + (c.sa_h || 0) + (c.sa_vd || 0) + (c.sa_vdc || 0)) * 0.25 +
      ((c.tl_b || 0) + (c.tl_h || 0) + (c.tl_vd || 0) + (c.tl_vdc || 0)) * 1.0;
    row.totalPoints = Number(rowPoints.toFixed(2));
    row.percentage = Math.round((row.totalPoints / 10.0) * 100);
  }

  typeTotals.mcq.points = Number((typeTotals.mcq.count * 0.25).toFixed(2));
  typeTotals.tf.points = Number((typeTotals.tf.items * 0.25).toFixed(2));
  typeTotals.sa.points = Number((typeTotals.sa.count * 0.25).toFixed(2));
  typeTotals.tl.points = Number((typeTotals.tl.count * 1.0).toFixed(2));

  const totalPoints = Number((typeTotals.mcq.points + typeTotals.tf.points + typeTotals.sa.points + typeTotals.tl.points).toFixed(2));
  const pct = (p: number) => totalPoints > 0 ? Math.round((p / totalPoints) * 100) : 0;
  const r2 = (x: number) => Number(x.toFixed(2));

  matrix.totals = {
    mcq: { b: levelSum.biet.mcq, h: levelSum.hieu.mcq, vd: levelSum.vandung.mcq, vdc: levelSum.vandungcao.mcq, total: typeTotals.mcq.count, points: typeTotals.mcq.points, percent: pct(typeTotals.mcq.points) },
    tf: { b: levelSum.biet.tf, h: levelSum.hieu.tf, vd: levelSum.vandung.tf, vdc: levelSum.vandungcao.tf, total: typeTotals.tf.items, points: typeTotals.tf.points, percent: pct(typeTotals.tf.points) },
    sa: { b: levelSum.biet.sa, h: levelSum.hieu.sa, vd: levelSum.vandung.sa, vdc: levelSum.vandungcao.sa, total: typeTotals.sa.count, points: typeTotals.sa.points, percent: pct(typeTotals.sa.points) },
    tl: { b: levelSum.biet.tl, h: levelSum.hieu.tl, vd: levelSum.vandung.tl, vdc: levelSum.vandungcao.tl, total: typeTotals.tl.count, points: typeTotals.tl.points, percent: pct(typeTotals.tl.points) },
    levels: {
      biet: { count: levelSum.biet.items, points: r2(levelSum.biet.points), percent: pct(levelSum.biet.points) },
      hieu: { count: levelSum.hieu.items, points: r2(levelSum.hieu.points), percent: pct(levelSum.hieu.points) },
      vandung: { count: levelSum.vandung.items, points: r2(levelSum.vandung.points), percent: pct(levelSum.vandung.points) },
      vandungcao: { count: levelSum.vandungcao.items, points: r2(levelSum.vandungcao.points), percent: pct(levelSum.vandungcao.points) },
    },
    overall: {
      count: levelSum.biet.items + levelSum.hieu.items + levelSum.vandung.items + levelSum.vandungcao.items,
      points: totalPoints,
      percent: 100
    }
  };

  return matrix;
}
