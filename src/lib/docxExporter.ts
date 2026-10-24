import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  Header,
  Footer,
  PageNumber
} from 'docx';
import { FullExamPackage, ExamVariant } from './types';
import { formatSpecCellText } from './specGenerator';

const FONT_FAMILY = 'Times New Roman';
const BORDER_STYLE = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: '999999'
};

const CELL_BORDERS = {
  top: BORDER_STYLE,
  bottom: BORDER_STYLE,
  left: BORDER_STYLE,
  right: BORDER_STYLE
};

export async function generateExamDocx(examPackage: FullExamPackage, variantCode = '001', isTeacherMode = true): Promise<Buffer> {
  const variant = examPackage.variants.find(v => v.code === variantCode) || examPackage.variants[0];
  const matrix = examPackage.matrix;
  const spec = examPackage.spec;

  const children: (Paragraph | Table)[] = [];

  // Helper text creators
  const createTitle = (text: string, level = 1) => {
    return new Paragraph({
      alignment: level === 1 ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { before: 200, after: 120 },
      children: [
        new TextRun({
          text,
          bold: true,
          size: level === 1 ? 28 : 24, // 14pt or 12pt
          font: FONT_FAMILY
        })
      ]
    });
  };

  const createText = (text: string, options: { bold?: boolean; italics?: boolean; size?: number; align?: any } = {}) => {
    return new Paragraph({
      alignment: options.align || AlignmentType.LEFT,
      spacing: { before: 40, after: 40 },
      children: [
        new TextRun({
          text,
          bold: options.bold || false,
          italics: options.italics || false,
          size: options.size || 24, // 12pt
          font: FONT_FAMILY
        })
      ]
    });
  };

  const createCell = (text: string, options: { bold?: boolean; italics?: boolean; align?: any; colSpan?: number; rowSpan?: number; widthPct?: number } = {}) => {
    return new TableCell({
      columnSpan: options.colSpan,
      rowSpan: options.rowSpan,
      width: options.widthPct ? { size: options.widthPct, type: WidthType.PERCENTAGE } : undefined,
      borders: CELL_BORDERS,
      children: [
        new Paragraph({
          alignment: options.align || AlignmentType.CENTER,
          children: [
            new TextRun({
              text,
              bold: options.bold || false,
              italics: options.italics || false,
              size: 20, // 10pt in tables
              font: FONT_FAMILY
            })
          ]
        })
      ]
    });
  };

  // Header of document
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 60 },
      children: [
        new TextRun({
          text: `ĐỀ KIỂM TRA`,
          bold: true,
          size: 28,
          font: FONT_FAMILY
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 60 },
      children: [
        new TextRun({
          text: `MÔN: ${examPackage.subject.toUpperCase()} - LỚP: ${examPackage.grade}`,
          bold: true,
          size: 24,
          font: FONT_FAMILY
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 200 },
      children: [
        new TextRun({
          text: `Thời gian: ${examPackage.durationMinutes} phút (không kể thời gian giao đề)`,
          italics: true,
          size: 24,
          font: FONT_FAMILY
        })
      ]
    })
  );

  // ==========================================
  // I. MA TRẬN ĐỀ KIỂM TRA
  // ==========================================
  children.push(createTitle("I. MA TRẬN ĐỀ KIỂM TRA", 2));

  const matrixHeaderRow1 = new TableRow({
    children: [
      createCell("TT", { bold: true, rowSpan: 2, widthPct: 4 }),
      createCell("Chủ đề/Chương", { bold: true, rowSpan: 2, widthPct: 16 }),
      createCell("Nội dung/Đơn vị kiến thức", { bold: true, rowSpan: 2, widthPct: 20 }),
      createCell("Mức độ đánh giá", { bold: true, colSpan: 16, widthPct: 40 }),
      createCell("Tổng", { bold: true, colSpan: 4, widthPct: 12 }),
      createCell("Tỉ lệ % điểm", { bold: true, rowSpan: 2, widthPct: 8 })
    ]
  });

  const matrixHeaderRow2 = new TableRow({
    children: [
      // Nhiều lựa chọn
      createCell("Nhiều lựa chọn", { bold: true, colSpan: 4 }),
      // Đúng-Sai
      createCell("Đúng-Sai", { bold: true, colSpan: 4 }),
      // Trả lời ngắn
      createCell("Trả lời ngắn", { bold: true, colSpan: 4 }),
      // Tự luận
      createCell("Tự luận", { bold: true, colSpan: 4 }),
      // Tổng (B, H, VD, VDC)
      createCell("Biết", { bold: true }),
      createCell("Hiểu", { bold: true }),
      createCell("V.Dụng", { bold: true }),
      createCell("V.Dụng cao", { bold: true }),
    ]
  });

  const matrixHeaderRow3 = new TableRow({
    children: [
      createCell("", { colSpan: 3 }),
      // Sub-levels
      createCell("B", { bold: true }), createCell("H", { bold: true }), createCell("VD", { bold: true }), createCell("VDC", { bold: true }),
      createCell("B", { bold: true }), createCell("H", { bold: true }), createCell("VD", { bold: true }), createCell("VDC", { bold: true }),
      createCell("B", { bold: true }), createCell("H", { bold: true }), createCell("VD", { bold: true }), createCell("VDC", { bold: true }),
      createCell("B", { bold: true }), createCell("H", { bold: true }), createCell("VD", { bold: true }), createCell("VDC", { bold: true }),
      createCell("", { colSpan: 5 })
    ]
  });

  const matrixRows: TableRow[] = [matrixHeaderRow1, matrixHeaderRow2, matrixHeaderRow3];

  matrix.rows.forEach((r, idx) => {
    const c = r.cells;
    matrixRows.push(
      new TableRow({
        children: [
          createCell(String(idx + 1)),
          createCell(r.topicName, { align: AlignmentType.LEFT }),
          createCell(r.lessonName, { align: AlignmentType.LEFT }),
          createCell(c.mcq_b ? String(c.mcq_b) : ""),
          createCell(c.mcq_h ? String(c.mcq_h) : ""),
          createCell(c.mcq_vd ? String(c.mcq_vd) : ""),
          createCell(c.mcq_vdc ? String(c.mcq_vdc) : ""),
          createCell(c.tf_b ? String(c.tf_b) : ""),
          createCell(c.tf_h ? String(c.tf_h) : ""),
          createCell(c.tf_vd ? String(c.tf_vd) : ""),
          createCell(c.tf_vdc ? String(c.tf_vdc) : ""),
          createCell(c.sa_b ? String(c.sa_b) : ""),
          createCell(c.sa_h ? String(c.sa_h) : ""),
          createCell(c.sa_vd ? String(c.sa_vd) : ""),
          createCell(c.sa_vdc ? String(c.sa_vdc) : ""),
          createCell(c.tl_b ? String(c.tl_b) : ""),
          createCell(c.tl_h ? String(c.tl_h) : ""),
          createCell(c.tl_vd ? String(c.tl_vd) : ""),
          createCell(c.tl_vdc ? String(c.tl_vdc) : ""),
          createCell(r.totalBiet ? String(r.totalBiet) : "", { bold: true }),
          createCell(r.totalHieu ? String(r.totalHieu) : "", { bold: true }),
          createCell(r.totalVD ? String(r.totalVD) : "", { bold: true }),
          createCell(r.totalVDC ? String(r.totalVDC) : "", { bold: true }),
          createCell(`${r.percentage}%`, { bold: true })
        ]
      })
    );
  });

  // Summary rows
  const totals = matrix.totals;
  matrixRows.push(
    new TableRow({
      children: [
        createCell("Tổng số câu", { bold: true, colSpan: 3 }),
        createCell(String(totals.mcq.b || 0), { bold: true }),
        createCell(String(totals.mcq.h || 0), { bold: true }),
        createCell(String(totals.mcq.vd || 0), { bold: true }),
        createCell(String(totals.mcq.vdc || 0), { bold: true }),
        createCell(String(totals.tf.b || 0), { bold: true }),
        createCell(String(totals.tf.h || 0), { bold: true }),
        createCell(String(totals.tf.vd || 0), { bold: true }),
        createCell(String(totals.tf.vdc || 0), { bold: true }),
        createCell(String(totals.sa.b || 0), { bold: true }),
        createCell(String(totals.sa.h || 0), { bold: true }),
        createCell(String(totals.sa.vd || 0), { bold: true }),
        createCell(String(totals.sa.vdc || 0), { bold: true }),
        createCell(String(totals.tl.b || 0), { bold: true }),
        createCell(String(totals.tl.h || 0), { bold: true }),
        createCell(String(totals.tl.vd || 0), { bold: true }),
        createCell(String(totals.tl.vdc || 0), { bold: true }),
        createCell(String(totals.levels.biet.count), { bold: true }),
        createCell(String(totals.levels.hieu.count), { bold: true }),
        createCell(String(totals.levels.vandung.count), { bold: true }),
        createCell(String(totals.levels.vandungcao.count), { bold: true }),
        createCell(String(totals.overall.count), { bold: true })
      ]
    }),
    new TableRow({
      children: [
        createCell("Tổng số điểm", { bold: true, colSpan: 3 }),
        createCell(totals.mcq.points.toFixed(2), { bold: true, colSpan: 4 }),
        createCell(totals.tf.points.toFixed(2), { bold: true, colSpan: 4 }),
        createCell(totals.sa.points.toFixed(2), { bold: true, colSpan: 4 }),
        createCell(totals.tl.points.toFixed(2), { bold: true, colSpan: 4 }),
        createCell(totals.levels.biet.points.toFixed(2), { bold: true }),
        createCell(totals.levels.hieu.points.toFixed(2), { bold: true }),
        createCell(totals.levels.vandung.points.toFixed(2), { bold: true }),
        createCell(totals.levels.vandungcao.points.toFixed(2), { bold: true }),
        createCell(`${totals.overall.points.toFixed(2)}đ`, { bold: true })
      ]
    }),
    new TableRow({
      children: [
        createCell("Tỉ lệ %", { bold: true, colSpan: 3 }),
        createCell(`${totals.mcq.percent}%`, { bold: true, colSpan: 4 }),
        createCell(`${totals.tf.percent}%`, { bold: true, colSpan: 4 }),
        createCell(`${totals.sa.percent}%`, { bold: true, colSpan: 4 }),
        createCell(`${totals.tl.percent}%`, { bold: true, colSpan: 4 }),
        createCell(`${totals.levels.biet.percent}%`, { bold: true }),
        createCell(`${totals.levels.hieu.percent}%`, { bold: true }),
        createCell(`${totals.levels.vandung.percent}%`, { bold: true }),
        createCell(`${totals.levels.vandungcao.percent}%`, { bold: true }),
        createCell(`${totals.overall.percent}%`, { bold: true })
      ]
    })
  );

  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: matrixRows }));

  // ==========================================
  // II. BẢN ĐẶC TẢ ĐỀ KIỂM TRA
  // ==========================================
  children.push(createTitle("II. BẢN ĐẶC TẢ ĐỀ KIỂM TRA", 2));

  const specHeaderRow1 = new TableRow({
    children: [
      createCell("TT", { bold: true, rowSpan: 2, widthPct: 4 }),
      createCell("Chủ đề/Chương", { bold: true, rowSpan: 2, widthPct: 14 }),
      createCell("Nội dung/Đơn vị kiến thức", { bold: true, rowSpan: 2, widthPct: 18 }),
      createCell("Mức độ đánh giá (Mô tả YCCĐ)", { bold: true, rowSpan: 2, widthPct: 30 }),
      createCell("Số câu hỏi theo mức độ nhận thức", { bold: true, colSpan: 16, widthPct: 34 })
    ]
  });

  const specHeaderRow2 = new TableRow({
    children: [
      createCell("Nhiều lựa chọn", { bold: true, colSpan: 4 }),
      createCell("Đúng-Sai", { bold: true, colSpan: 4 }),
      createCell("Trả lời ngắn", { bold: true, colSpan: 4 }),
      createCell("Tự luận", { bold: true, colSpan: 4 }),
    ]
  });

  const specHeaderRow3 = new TableRow({
    children: [
      createCell("", { colSpan: 4 }),
      createCell("B", { bold: true }), createCell("H", { bold: true }), createCell("VD", { bold: true }), createCell("VDC", { bold: true }),
      createCell("B", { bold: true }), createCell("H", { bold: true }), createCell("VD", { bold: true }), createCell("VDC", { bold: true }),
      createCell("B", { bold: true }), createCell("H", { bold: true }), createCell("VD", { bold: true }), createCell("VDC", { bold: true }),
      createCell("B", { bold: true }), createCell("H", { bold: true }), createCell("VD", { bold: true }), createCell("VDC", { bold: true }),
    ]
  });

  const specTableRows: TableRow[] = [specHeaderRow1, specHeaderRow2, specHeaderRow3];

  spec.rows.forEach((r, idx) => {
    // Build combined description
    const descParts: string[] = [];
    if (r.yccdDescription.biet.length > 0) {
      descParts.push("+ Nhận biết:\n" + r.yccdDescription.biet.map(x => `- ${x}`).join('\n'));
    }
    if (r.yccdDescription.hieu.length > 0) {
      descParts.push("+ Thông hiểu:\n" + r.yccdDescription.hieu.map(x => `- ${x}`).join('\n'));
    }
    if (r.yccdDescription.vandung.length > 0) {
      descParts.push("+ Vận dụng:\n" + r.yccdDescription.vandung.map(x => `- ${x}`).join('\n'));
    }
    if (r.yccdDescription.vandungcao.length > 0) {
      descParts.push("+ Vận dụng cao:\n" + r.yccdDescription.vandungcao.map(x => `- ${x}`).join('\n'));
    }
    const fullDesc = descParts.join('\n\n');

    specTableRows.push(
      new TableRow({
        children: [
          createCell(String(idx + 1)),
          createCell(r.topicName, { align: AlignmentType.LEFT }),
          createCell(r.lessonName, { align: AlignmentType.LEFT }),
          createCell(fullDesc, { align: AlignmentType.LEFT }),
          createCell(formatSpecCellText(r.mcq_b, spec.showCompetencyCodes)),
          createCell(formatSpecCellText(r.mcq_h, spec.showCompetencyCodes)),
          createCell(formatSpecCellText(r.mcq_vd, spec.showCompetencyCodes)),
          createCell(formatSpecCellText(r.mcq_vdc, spec.showCompetencyCodes)),
          createCell(formatSpecCellText(r.tf_b, spec.showCompetencyCodes)),
          createCell(formatSpecCellText(r.tf_h, spec.showCompetencyCodes)),
          createCell(formatSpecCellText(r.tf_vd, spec.showCompetencyCodes)),
          createCell(formatSpecCellText(r.tf_vdc, spec.showCompetencyCodes)),
          createCell(formatSpecCellText(r.sa_b, spec.showCompetencyCodes)),
          createCell(formatSpecCellText(r.sa_h, spec.showCompetencyCodes)),
          createCell(formatSpecCellText(r.sa_vd, spec.showCompetencyCodes)),
          createCell(formatSpecCellText(r.sa_vdc, spec.showCompetencyCodes)),
          createCell(formatSpecCellText(r.tl_b, spec.showCompetencyCodes)),
          createCell(formatSpecCellText(r.tl_h, spec.showCompetencyCodes)),
          createCell(formatSpecCellText(r.tl_vd, spec.showCompetencyCodes)),
          createCell(formatSpecCellText(r.tl_vdc, spec.showCompetencyCodes)),
        ]
      })
    );
  });

  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: specTableRows }));

  // ==========================================
  // III. ĐỀ KIỂM TRA
  // ==========================================
  children.push(createTitle("III. ĐỀ KIỂM TRA", 2));

  // Exam Sub-header
  children.push(
    createText(`${examPackage.department} - ${examPackage.school}`, { bold: true, align: AlignmentType.CENTER }),
    createText(`ĐỀ KIỂM TRA ĐỊNH KỲ MÔN: ${examPackage.subject.toUpperCase()} - LỚP: ${examPackage.grade}`, { bold: true, align: AlignmentType.CENTER }),
    createText(`Thời gian: ${examPackage.durationMinutes} phút | Mã đề: ${variant.code}`, { italics: true, align: AlignmentType.CENTER })
  );

  // Part I: MCQ
  const mcqPointsTxt = String(Number((variant.mcq.length * 0.25).toFixed(2)));
  const tfPointsTxt = String(variant.tf.length);
  const tlPointsTxt = String(variant.tl.length);

  if (variant.mcq.length > 0) {
    children.push(
      new Paragraph({
        spacing: { before: 160, after: 80 },
        children: [
          new TextRun({
            text: `PHẦN I (${mcqPointsTxt} điểm). Câu trắc nghiệm nhiều phương án lựa chọn. Thí sinh trả lời từ câu 1 đến câu ${variant.mcq.length}. Mỗi câu hỏi thí sinh chỉ chọn một phương án.`,
            bold: true,
            font: FONT_FAMILY
          })
        ]
      })
    );

    variant.mcq.forEach((item, qIdx) => {
      const q = item.question;
      children.push(
        new Paragraph({
          spacing: { before: 80, after: 40 },
          children: [
            new TextRun({ text: `Câu ${qIdx + 1}: `, bold: true, font: FONT_FAMILY }),
            new TextRun({ text: q.q, font: FONT_FAMILY })
          ]
        })
      );

      const options = item.shuffledOptions || (q.a ? q.a.map((t, idx) => ({ text: t, originalIndex: idx })) : []);
      const letters = ['A', 'B', 'C', 'D'];
      options.forEach((opt, oIdx) => {
        const isCorrect = isTeacherMode && oIdx === item.shuffledCorrectIndex;
        children.push(
          new Paragraph({
            indent: { left: 360 },
            spacing: { before: 20, after: 20 },
            children: [
              new TextRun({
                text: `${isCorrect ? '*' : ''}${letters[oIdx]}. `,
                bold: isCorrect,
                font: FONT_FAMILY
              }),
              new TextRun({
                text: opt.text,
                bold: isCorrect,
                font: FONT_FAMILY
              })
            ]
          })
        );
      });
    });
  }

  // Part II: TF
  if (variant.tf.length > 0) {
    children.push(
      new Paragraph({
        spacing: { before: 160, after: 80 },
        children: [
          new TextRun({
            text: `PHẦN II (${tfPointsTxt} điểm). Câu trắc nghiệm đúng sai. Thí sinh trả lời từ câu 1 đến câu ${variant.tf.length}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.`,
            bold: true,
            font: FONT_FAMILY
          })
        ]
      })
    );

    variant.tf.forEach((item, qIdx) => {
      const q = item.question;
      children.push(
        new Paragraph({
          spacing: { before: 80, after: 40 },
          children: [
            new TextRun({ text: `Câu ${qIdx + 1}: `, bold: true, font: FONT_FAMILY }),
            new TextRun({ text: q.q, font: FONT_FAMILY })
          ]
        })
      );

      const items = q.items || [];
      items.forEach((sub, sIdx) => {
        const letters = ['a', 'b', 'c', 'd'];
        const isTrueMark = isTeacherMode && sub.isTrue;
        children.push(
          new Paragraph({
            indent: { left: 360 },
            spacing: { before: 20, after: 20 },
            children: [
              new TextRun({
                text: `${isTrueMark ? '*' : ''}${letters[sIdx]}) `,
                bold: isTrueMark,
                font: FONT_FAMILY
              }),
              new TextRun({
                text: sub.text,
                bold: isTrueMark,
                font: FONT_FAMILY
              })
            ]
          })
        );
      });
    });
  }

  // Part III: TL
  if (variant.tl.length > 0) {
    children.push(
      new Paragraph({
        spacing: { before: 160, after: 80 },
        children: [
          new TextRun({
            text: `PHẦN III (${tlPointsTxt} điểm). Tự luận. Thí sinh trả lời từ câu 1 đến câu ${variant.tl.length}.`,
            bold: true,
            font: FONT_FAMILY
          })
        ]
      })
    );

    variant.tl.forEach((item, qIdx) => {
      const q = item.question;
      children.push(
        new Paragraph({
          spacing: { before: 80, after: 40 },
          children: [
            new TextRun({ text: `Câu ${qIdx + 1}: `, bold: true, font: FONT_FAMILY }),
            new TextRun({ text: q.q, font: FONT_FAMILY })
          ]
        })
      );
    });
  }

  // ==========================================
  // IV. HƯỚNG DẪN CHẤM
  // ==========================================
  children.push(createTitle("IV. HƯỚNG DẪN CHẤM", 2));

  // 1. Phần 1
  if (variant.mcq.length > 0) {
    children.push(
      createText("1. Phần 1. Trắc nghiệm. Mỗi câu Phần 1 đúng được 0.25 điểm.", { bold: true }),
      createText("Bảng đáp án Phần 1:", { italics: true })
    );

    const letters = ['A', 'B', 'C', 'D'];
    const mcqHeaderCells = [createCell("Câu", { bold: true })];
    const mcqAnswerCells = [createCell("Đáp án", { bold: true })];

    variant.mcq.forEach((item, qIdx) => {
      mcqHeaderCells.push(createCell(String(qIdx + 1), { bold: true }));
      const ansLetter = letters[item.shuffledCorrectIndex ?? 0] || 'A';
      mcqAnswerCells.push(createCell(ansLetter, { bold: true }));
    });

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: mcqHeaderCells }),
          new TableRow({ children: mcqAnswerCells })
        ]
      })
    );
  }

  // 2. Phần 2
  if (variant.tf.length > 0) {
    children.push(
      createText("2. Phần 2 đúng trọn vẹn được 1 điểm (đúng 1 ý 0.1đ, 2 ý 0.25đ, 3 ý 0.5đ, 4 ý 1đ).", { bold: true })
    );

    variant.tf.forEach((item, qIdx) => {
      const items = item.question.items || [];
      const tfString = items.map(x => (x.isTrue ? 'Đ' : 'S')).join('');
      children.push(
        createText(`${qIdx + 1}. ${tfString}`, { bold: true })
      );
    });
  }

  // 3. Phần 3
  if (variant.tl.length > 0) {
    children.push(
      createText("3. Phần 3. Tự luận", { bold: true })
    );

    const tlTableRows = [
      new TableRow({
        children: [
          createCell("Phần / Câu", { bold: true, widthPct: 15 }),
          createCell("Nội dung đáp án", { bold: true, widthPct: 75 }),
          createCell("Điểm", { bold: true, widthPct: 10 })
        ]
      })
    ];

    variant.tl.forEach((item, qIdx) => {
      tlTableRows.push(
        new TableRow({
          children: [
            createCell(`Câu ${qIdx + 1}`, { bold: true }),
            createCell(item.question.essayAnswer || item.question.q, { align: AlignmentType.LEFT }),
            createCell(String(item.question.points || 1.0), { bold: true })
          ]
        })
      );
    });

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tlTableRows
      })
    );
  }

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1134, // 2 cm (1 cm = 567 twips)
              bottom: 1134,
              left: 1134,
              right: 1134
            }
          }
        },
        children
      }
    ]
  });

  return await Packer.toBuffer(doc);
}
