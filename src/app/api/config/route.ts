import { NextResponse } from 'next/server';
import { getConfig, saveConfig } from '@/lib/db';
import { DEFAULT_GEMINI_MODEL } from '@/lib/types';

export async function GET() {
  const cfg = getConfig();
  return NextResponse.json({
    hasGeminiKey: Boolean(cfg.geminiKey || process.env.GEMINI_API_KEY),
    geminiModel: cfg.geminiModel || DEFAULT_GEMINI_MODEL
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const current = getConfig();

    const updated = {
      geminiKey: body.geminiKey !== undefined ? body.geminiKey : current.geminiKey,
      geminiModel: body.geminiModel || current.geminiModel || DEFAULT_GEMINI_MODEL
    };

    saveConfig(updated);
    return NextResponse.json({ success: true, message: 'Đã lưu cấu hình AI an toàn server-side' });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
