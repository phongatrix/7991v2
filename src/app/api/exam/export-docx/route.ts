import { NextResponse } from 'next/server';
import { generateExamDocx } from '@/lib/docxExporter';
import { FullExamPackage } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { examPackage, variantCode = '001', isTeacherMode = true } = body;

    if (!examPackage || !examPackage.matrix) {
      return NextResponse.json({ error: 'Dữ liệu đề kiểm tra không hợp lệ' }, { status: 400 });
    }

    const docxBuffer = await generateExamDocx(examPackage as FullExamPackage, variantCode, isTeacherMode);

    const safeTitle = (examPackage.title || 'De_kiem_tra')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeTitle}_K${examPackage.grade}_Ma${variantCode}.docx`;

    return new Response(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
