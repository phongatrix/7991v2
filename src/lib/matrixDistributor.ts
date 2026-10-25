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

// Tỉ lệ điểm theo mức độ (CV 7991): Biết 40% · Hiểu 30% · Vận dụng 20% · Vận dụng cao 10%
// Đơn vị điểm: 1 unit = 0.25đ → thang 10đ chuẩn = 40 units (16/12/8/4).
const CV_LEVEL_RATIOS = [0.4, 0.3, 0.2, 0.1];

// Mục tiêu units theo từng mức cho tổng U units, làm tròn bằng phương pháp
// số dư lớn nhất — với U = 40 (đề 10đ chuẩn) cho đúng 16/12/8/4 units.
export function computeLevelTargets(totalUnits: number): Record<Level, number> {
  const raw = LEVELS.map((lv, i) => ({ lv, exact: totalUnits * CV_LEVEL_RATIOS[i] }));
  const out: Record<Level, number> = { biet: 0, hieu: 0, vandung: 0, vandungcao: 0 };
  raw.forEach(({ lv, exact }) => { out[lv] = Math.floor(exact); });
  let left = totalUnits - raw.reduce((s, r) => s + Math.floor(r.exact), 0);
  const byRemainder = [...raw].sort((a, b) =>
    (b.exact - Math.floor(b.exact)) - (a.exact - Math.floor(a.exact))
  );
  for (let i = 0; i < byRemainder.length && left > 0; i++, left--) out[byRemainder[i].lv] += 1;
  return out;
}

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

interface ChunkyAllocation {
  tfPatterns: number[];  // chỉ số mẫu 4 ý cho từng câu Đúng-Sai
  tlLevels: Level[];     // mức độ dồn điểm của từng câu Tự luận
  remaining: Record<Level, number>; // units trần còn lại cho MCQ/SA
}

// Xếp các câu "khối" 4 units (Đúng-Sai theo mẫu 4 ý, Tự luận dồn 1 mức) bằng
// quay lui ngẫu nhiên: mỗi bước chọn ngẫu nhiên một phương án hợp lệ (không làm
// mức nào vượt trần units theo CV 7991), bế tắc thì lùi lại đổi phương án.
// Hoàn chỉnh nên luôn tìm được nghiệm nếu tồn tại; xen kẽ TF/TL ngẫu nhiên
// để mỗi lần bấm cho cấu trúc mức độ khác nhau.
function allocateChunkyRandom(totalTF: number, totalTL: number, targets: Record<Level, number>): ChunkyAllocation | null {
  const remaining: Record<Level, number> = { ...targets };
  const tfPatterns: number[] = [];
  const tlLevels: Level[] = [];
  const items: ('tf' | 'tl')[] = shuffle([
    ...Array.from({ length: totalTF }, () => 'tf' as const),
    ...Array.from({ length: totalTL }, () => 'tl' as const),
  ]);

  const dfs = (idx: number): boolean => {
    if (idx === items.length) return true;
    if (items[idx] === 'tf') {
      for (const pi of shuffle(TF_PATTERNS.map((_, i) => i))) {
        const units = TF_PATTERNS[pi].units;
        if (LEVELS.some((lv, li) => units[li] > remaining[lv])) continue;
        LEVELS.forEach((lv, li) => { remaining[lv] -= units[li]; });
        tfPatterns.push(pi);
        if (dfs(idx + 1)) return true;
        LEVELS.forEach((lv, li) => { remaining[lv] += units[li]; });
        tfPatterns.pop();
      }
    } else {
      for (const lv of shuffle(LEVELS)) {
        if (remaining[lv] < 4) continue;
        remaining[lv] -= 4;
        tlLevels.push(lv);
        if (dfs(idx + 1)) return true;
        remaining[lv] += 4;
        tlLevels.pop();
      }
    }
    return false;
  };

  if (!dfs(0)) return null;
  return { tfPatterns, tlLevels, remaining };
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
  // THUẬT TOÁN DÀN CÂU CHUNG — mỗi lần bấm cho bố cục KHÁC NHAU nhưng tổng
  // điểm theo từng mức luôn chốt đúng CV 7991: 40% B · 30% H · 20% VD · 10% VDC.
  //
  // Nguyên lý đảm bảo đúng tỉ lệ:
  // 1) Đặt trần units theo từng mức từ tổng đơn vị của đề (theo CV 7991).
  // 2) Câu "khối" 4 units (Đúng-Sai theo mẫu 4 ý, Tự luận dồn 1 mức) xếp trước
  //    bằng quay lui ngẫu nhiên — không phương án nào vượt trần mức nào.
  // 3) MCQ/SA (1 unit/câu) bốc ngẫu nhiên theo trọng số = trần còn thiếu của
  //    từng mức → phát hết đúng số units, mọi mức về đúng 0 ⇒ khớp mục tiêu.
  // =====================================================================

  const totalUnits = totalMCQ + totalSA + 4 * totalTF + 4 * totalTL;
  const targetUnits = computeLevelTargets(totalUnits);

  const chunky = allocateChunkyRandom(totalTF, totalTL, targetUnits);
  if (!chunky) {
    throw new Error(
      'Cấu hình số câu hiện tại không dàn được đúng tỉ lệ mức độ CV 7991 ' +
      '(40% Biết · 30% Hiểu · 20% Vận dụng · 10% Vận dụng cao). ' +
      'Vui lòng giảm số câu Đúng-Sai/Tự luận hoặc điều chỉnh lại số câu các dạng.'
    );
  }

  const tfQuota: Record<Level, number> = { biet: 0, hieu: 0, vandung: 0, vandungcao: 0 };
  chunky.tfPatterns.forEach((pi) => {
    TF_PATTERNS[pi].units.forEach((u, li) => { tfQuota[LEVELS[li]] += u; });
  });

  const tlQuota: Record<Level, number> = { biet: 0, hieu: 0, vandung: 0, vandungcao: 0 };
  chunky.tlLevels.forEach((lv) => { tlQuota[lv] += 1; });

  // MCQ/SA (1 unit/câu) lấp đúng phần trần còn lại của từng mức
  const remaining: Record<Level, number> = { ...chunky.remaining };
  const fillUnitQuota = (count: number, quota: Record<Level, number>) => {
    for (let i = 0; i < count; i++) {
      const lv = LEVELS[weightedPickIndex(LEVELS.map(l => Math.max(0, remaining[l])))];
      remaining[lv] -= 1;
      quota[lv] += 1;
    }
  };

  const mcqQuota: Record<Level, number> = { biet: 0, hieu: 0, vandung: 0, vandungcao: 0 };
  const saQuota: Record<Level, number> = { biet: 0, hieu: 0, vandung: 0, vandungcao: 0 };
  fillUnitQuota(totalMCQ, mcqQuota);
  fillUnitQuota(totalSA, saQuota);

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
    const pattern = TF_PATTERNS[chunky.tfPatterns[i]];
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
