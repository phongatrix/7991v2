import { NextResponse } from 'next/server';
import { getConfig } from '@/lib/db';

/**
 * Truy vấn danh sách model Gemini hiện có trên tài khoản của API key
 * (GET v1beta/models) — dùng cho dropdown chọn model và nút Test API key.
 * Key server-side only; client không bao giờ thấy key.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const cfg = getConfig();
    const apiKey: string = body.apiKey || cfg.geminiKey || process.env.GEMINI_API_KEY || '';

    if (!apiKey) {
      return NextResponse.json({ error: 'Chưa nhập API key Gemini' }, { status: 400 });
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}&pageSize=1000`,
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (!res.ok) {
      const errText = await res.text();
      let reason = `Lỗi Gemini (${res.status})`;
      try {
        const j = JSON.parse(errText);
        reason = j.error?.message || reason;
      } catch { /* giữ reason mặc định */ }
      return NextResponse.json({ error: reason }, { status: res.status });
    }

    const data = await res.json();
    const models = (data.models || [])
      .filter((m: any) =>
        Array.isArray(m.supportedGenerationMethods) &&
        m.supportedGenerationMethods.includes('generateContent'))
      .map((m: any) => ({
        id: String(m.name || '').replace(/^models\//, ''),
        name: m.displayName || m.name || ''
      }))
      .filter((m: any) => /^gemini/i.test(m.id));

    return NextResponse.json({ success: true, models });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
