import { ExamMatrix, ExamSpec, SpecRow, Question, Competency } from './types';

export function generateSpec(matrix: ExamMatrix, pickedQuestions: Question[]): ExamSpec {
  const specRows: SpecRow[] = [];

  // Index picked questions by type, level, and lessonId
  const qMap: Record<string, Question[]> = {};
  for (const q of pickedQuestions) {
    const key = `${q.lessonId}_${q.type}_${q.level}`;
    if (!qMap[key]) qMap[key] = [];
    qMap[key].push(q);
  }

  // Also collect questions by type to know their global exam question numbers (c1, c2, ...)
  const mcqQuestions = pickedQuestions.filter(q => q.type === 'MCQ');
  const tfQuestions = pickedQuestions.filter(q => q.type === 'TF');
  const saQuestions = pickedQuestions.filter(q => q.type === 'SA');
  const tlQuestions = pickedQuestions.filter(q => q.type === 'TL');

  const getQuestionRef = (q: Question): string => {
    if (q.type === 'MCQ') {
      const idx = mcqQuestions.findIndex(x => x.id === q.id);
      return idx >= 0 ? `c${idx + 1}` : '';
    }
    if (q.type === 'TF') {
      const idx = tfQuestions.findIndex(x => x.id === q.id);
      return idx >= 0 ? `c${idx + 1}` : '';
    }
    if (q.type === 'SA') {
      const idx = saQuestions.findIndex(x => x.id === q.id);
      return idx >= 0 ? `c${idx + 1}` : '';
    }
    if (q.type === 'TL') {
      const idx = tlQuestions.findIndex(x => x.id === q.id);
      return idx >= 0 ? `c${idx + 1}` : '';
    }
    return '';
  };

  for (const row of matrix.rows) {
    const c = row.cells;
    const lessonId = row.lessonId;

    // Collect descriptions
    const bietDesc: string[] = [];
    const hieuDesc: string[] = [];
    const vdDesc: string[] = [];
    const vdcDesc: string[] = [];

    // Find all questions associated with this lesson
    const lessonQuestions = pickedQuestions.filter(q => q.lessonId === lessonId);

    // Group descriptions by level
    for (const q of lessonQuestions) {
      if (q.type === 'TF') {
        // TF description ends with (Đ/S)
        const descText = q.yccdContent.endsWith('(Đ/S)') ? q.yccdContent : `${q.yccdContent} (Đ/S)`;
        if (!vdDesc.includes(descText) && !vdcDesc.includes(descText)) {
          (q.level === 'vandungcao' ? vdcDesc : vdDesc).push(descText);
        }
      } else if (q.level === 'biet') {
        if (!bietDesc.includes(q.yccdContent)) bietDesc.push(q.yccdContent);
      } else if (q.level === 'hieu') {
        if (!hieuDesc.includes(q.yccdContent)) hieuDesc.push(q.yccdContent);
      } else if (q.level === 'vandung') {
        if (!vdDesc.includes(q.yccdContent)) vdDesc.push(q.yccdContent);
      } else if (q.level === 'vandungcao') {
        if (!vdcDesc.includes(q.yccdContent)) vdcDesc.push(q.yccdContent);
      }
    }

    // Default descriptions if none exists yet
    if (bietDesc.length === 0 && (c.mcq_b > 0 || c.tf_b > 0 || c.sa_b > 0 || c.tl_b > 0)) {
      bietDesc.push(`Nhận biết được các kiến thức cốt lõi của ${row.lessonName}.`);
    }
    if (hieuDesc.length === 0 && (c.mcq_h > 0 || c.tf_h > 0 || c.sa_h > 0 || c.tl_h > 0)) {
      hieuDesc.push(`Giải thích, phân tích được các khái niệm và nguyên lý trong ${row.lessonName}.`);
    }
    if (vdDesc.length === 0 && (c.mcq_vd > 0 || c.tf_vd > 0 || c.sa_vd > 0 || c.tl_vd > 0)) {
      vdDesc.push(`Vận dụng được các kiến thức, kỹ năng của ${row.lessonName} vào giải quyết tình huống thực tế.`);
    }
    if (vdcDesc.length === 0 && (c.mcq_vdc > 0 || c.tf_vdc > 0 || c.sa_vdc > 0 || c.tl_vdc > 0)) {
      vdcDesc.push(`Vận dụng cao: tổng hợp, đánh giá và sáng tạo giải pháp từ kiến thức ${row.lessonName} trong tình huống mới, phức tạp.`);
    }

    // Helper to build cell spec details
    const buildCellDetail = (type: string, level: string, count: number) => {
      if (count === 0) {
        return { count: 0, competency: 'NLa' as Competency, qRefs: [] };
      }
      const qs = lessonQuestions.filter(q => q.type === type && (type === 'TF' || q.level === level));
      const competency = (qs[0]?.yccd || 'NLa') as Competency;
      const qRefs = qs.map(q => getQuestionRef(q)).filter(Boolean);
      return { count, competency, qRefs };
    };

    // For TF: suy luận cách gán ý a–d theo mẫu phân bổ của ma trận
    // - cổ điển (vd>0, vdc=0): a,b=B; c=H; d=VD
    // - nâng cao (vd=0, vdc>0): a,b=B; c=H; d=VDC
    // - trải đều (vd>0, vdc>0): a=B; b=H; c=VD; d=VDC
    const tfForLesson = lessonQuestions.filter(q => q.type === 'TF');
    const tfRefsAll = tfForLesson.map(q => getQuestionRef(q)).filter(Boolean);
    const tfRef = tfRefsAll[0] || '';
    const tfCompetency = (tfForLesson[0]?.yccd || 'NLa') as Competency;
    const spreadPattern = c.tf_vd > 0 && c.tf_vdc > 0;

    specRows.push({
      topicId: row.topicId,
      topicName: row.topicName,
      lessonId: row.lessonId,
      lessonName: row.lessonName,
      yccdDescription: {
        biet: bietDesc,
        hieu: hieuDesc,
        vandung: vdDesc,
        vandungcao: vdcDesc
      },
      mcq_b: buildCellDetail('MCQ', 'biet', c.mcq_b),
      mcq_h: buildCellDetail('MCQ', 'hieu', c.mcq_h),
      mcq_vd: buildCellDetail('MCQ', 'vandung', c.mcq_vd),
      mcq_vdc: buildCellDetail('MCQ', 'vandungcao', c.mcq_vdc),
      tf_b: {
        count: c.tf_b,
        competency: tfCompetency,
        qRefs: c.tf_b > 0 && tfRef ? [spreadPattern ? `ý a ${tfRef}` : `ý a,b ${tfRef}`] : []
      },
      tf_h: {
        count: c.tf_h,
        competency: tfCompetency,
        qRefs: c.tf_h > 0 && tfRef ? [spreadPattern ? `ý b ${tfRef}` : `ý c ${tfRef}`] : []
      },
      tf_vd: {
        count: c.tf_vd,
        competency: tfCompetency,
        qRefs: c.tf_vd > 0 && tfRef ? [spreadPattern ? `ý c ${tfRef}` : `ý d ${tfRef}`] : []
      },
      tf_vdc: {
        count: c.tf_vdc,
        competency: tfCompetency,
        qRefs: c.tf_vdc > 0 && tfRef ? [`ý d ${tfRef}`] : []
      },
      sa_b: buildCellDetail('SA', 'biet', c.sa_b),
      sa_h: buildCellDetail('SA', 'hieu', c.sa_h),
      sa_vd: buildCellDetail('SA', 'vandung', c.sa_vd),
      sa_vdc: buildCellDetail('SA', 'vandungcao', c.sa_vdc),
      tl_b: buildCellDetail('TL', 'biet', c.tl_b),
      tl_h: buildCellDetail('TL', 'hieu', c.tl_h),
      tl_vd: buildCellDetail('TL', 'vandung', c.tl_vd),
      tl_vdc: buildCellDetail('TL', 'vandungcao', c.tl_vdc),
    });
  }

  return {
    rows: specRows,
    showCompetencyCodes: true
  };
}

export function formatSpecCellText(cell: { count: number; competency: Competency; qRefs: string[] }, showCompetency = true): string {
  if (!cell || cell.count === 0) return '';
  const parts: string[] = [String(cell.count)];
  if (showCompetency && cell.competency) {
    parts.push(`(${cell.competency})`);
  }
  if (cell.qRefs && cell.qRefs.length > 0) {
    parts.push(`(${cell.qRefs.join(', ')})`);
  }
  return parts.join(' ');
}
