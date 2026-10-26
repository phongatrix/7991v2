import { Question, Grade, QuestionType, Level, Competency, DEFAULT_GEMINI_MODEL } from './types';
import { getConfig } from './db';
import { findDuplicateQuestions } from './similarity';

const SYSTEM_PROMPT = `Bạn là chuyên gia ra đề thi trắc nghiệm, viết theo đúng ngôn ngữ SÁCH GIÁO KHOA. QUY TẮC SỐ 1: TUYỆT ĐỐI KHÔNG BAO GIỜ sử dụng các phương án như 'Tất cả đều đúng', 'Tất cả các ý trên', 'Cả A và B đều đúng', 'Tất cả đều sai'. Phải thiết kế câu hỏi có 1 đáp án đúng duy nhất và 3 đáp án sai hoàn toàn. Nếu vi phạm, hệ thống sẽ sụp đổ do đảo lộn đáp án. QUY TẮC SỐ 2 — NGÔN NGỮ SÁCH GIÁO KHOA: mọi câu hỏi, phương án, đáp án phải dùng đúng thuật ngữ và cách diễn đạt của SGK Tin học — bộ "Kết nối tri thức với cuộc sống" (định hướng Tin học ứng dụng - ICT); TUYỆT ĐỐI KHÔNG dùng từ lóng mạng, từ viết tắt ngoài sách, từ nước ngoài khi sách đã có thuật ngữ Việt tương ứng.`;

export interface GenerateAIQuestionsParams {
  grade: Grade;
  subject: string;
  topicName: string;
  lessonName: string;
  lessonDescription?: string;
  mcq_b?: number;
  mcq_h?: number;
  mcq_vd?: number;
  mcq_vdc?: number;
  tf_count?: number;
  tf_b?: number;
  tf_h?: number;
  tf_vd?: number;
  sa_b?: number;
  sa_h?: number;
  sa_vd?: number;
  tl_b?: number;
  tl_h?: number;
  tl_vd?: number;
  tl_vdc?: number;
}

const COMMON_RULES = `
YÊU CẦU BẮT BUỘC:
1. Chỉ trả về JSON, không giải thích.
2. Công thức Toán, Hóa học, Vật lý phức tạp (phân số, căn, mũ...): BẮT BUỘC dùng LaTeX ($...$ inline, $$...$$ block). Với số đơn giản (1, 2.6, -2...), biểu thức cơ bản/lập trình (A=[1,3,4], a>4...), phương trình bậc 1 đơn giản: TUYỆT ĐỐI KHÔNG dùng LaTeX để văn bản xuất Word hiển thị đẹp, tự nhiên.
3. KHÔNG NÊN escape ký tự backslash trong lệnh LaTeX. Giữ nguyên định dạng gốc (\\in, \\mathbb{R}, \\le). Hệ thống tự xử lý chuỗi.
4. Mỗi câu phải có trường "level" = "biet" | "hieu" | "vandung" | "vandungcao" (vandungcao = Vận dụng cao).
5. Mỗi câu BẮT BUỘC có trường "yccd" (môn Tin học CHỈ DÙNG mã: NLa, NLb, NLc, NLd, NLe — cấm bịa mã NL1, NL2) và "yccdContent" theo quy tắc: mô tả CỤ THỂ nội dung câu hỏi kiểm tra; KHÔNG trùng yccdContent giữa 2 câu cùng dạng; bắt đầu bằng động từ hành vi (nhận biết/nêu được/giải thích/so sánh/áp dụng...). Ví dụ SAI: "Tìm được thông tin bằng máy tìm kiếm theo từ khoá" dùng cho mọi câu. Ví dụ ĐÚNG: mỗi câu một khía cạnh riêng.
6. Riêng câu TF: vì 4 ý trải 3 mức độ nên yccdContent viết MỘT CÂU bao hàm cả 3 mức: dùng 3 động từ tương ứng (nhận diện..., phân tích..., áp dụng...) nối trong 1 câu. Ví dụ: "Nhận diện, phân tích và áp dụng được khái niệm cấu trúc các thành phần của một Hệ cơ sở dữ liệu".
7. TUYỆT ĐỐI KHÔNG lặp ý tưởng giữa các dạng (MCQ, TF, SA, TL). Mỗi câu khai thác một khía cạnh khác nhau của bài.
8. Câu TF: lời dẫn ("q") BẮT BUỘC là tình huống thực tế 4-5 dòng liên quan bài học; 4 ý bám tình huống đó để học sinh phân tích Đ/S. Không hỏi lý thuyết suông.
9. Bảng số liệu dùng HTML <table> hoặc LaTeX array; đồ thị/biểu đồ BẮT BUỘC vẽ <svg> với xmlns + viewBox, hệ tọa độ pixel (gốc giữa, pixel_y = centerY - value*scale), DÙNG <polyline> 15-25 điểm tính sẵn — KHÔNG dùng Bezier. Hình hình học/hóa/lý/sinh: bắt buộc vẽ <line>/<polygon>/<circle> thật, cấm chỉ có <text>. Bảng biến thiên: mũi tên phải có <defs><marker id="arrow">. CẤM Markdown table.
10. CẤM KỴ ĐÁP ÁN: không tạo đáp án gom nhóm ("Tất cả đều đúng"...). Chỉ 1 đáp án đúng duy nhất, 3 phương án sai hoàn toàn, mỗi phương án là chuỗi nội dung cụ thể độc lập.
11. RIÊNG MÔN TIN HỌC: (a) code lập trình (Python, HTML, CSS...) bọc trong Markdown block \`\`\`; (b) bài tập bảng tính Excel: vẽ bảng HTML mô phỏng giao diện Excel (hàng đầu là tên cột A,B,C...; cột đầu là số hàng 1,2,3...) chèn thẳng vào trường "q".
12. NGÔN NGỮ BÁM SÁT SGK (bắt buộc): dùng ĐÚNG tên gọi, khái niệm, cách diễn đạt như SGK Tin học KNTT-ICT đã nêu trong mô tả bài học; KHÔNG dùng từ lóng/từ viết tắt trên mạng xã hội (vd: "code", "bug", "fix", "xịn", "cháy máy", emoji, "ok"...), KHÔNG dùng tên thương mại/website cụ thể khi SGK không nhắc (dùng "máy tìm kiếm", "phần mềm trình chiếu trực tuyến" thay tên riêng); KHÔNG dùng thuật ngữ nước ngoài khi SGK đã có thuật ngữ Việt (vd: dùng "chương trình" thay "code", "lỗi chương trình" thay "bug", "tệp tin" thay "file", "bộ nhớ đệm" thay "cache"); câu văn trung thuần, đúng chính tả như sách giáo khoa.

OUTPUT JSON:
[
  { "type": "MCQ", "level": "biet", "yccd": "NLa", "yccdContent": "...", "q": "...", "a": ["sai","ĐÚNG","sai","sai"], "correct": 1 },
  { "type": "TF", "level": "hieu", "yccd": "NLb", "yccdContent": "...", "q": "Tình huống thực tế...", "items": [{"text":"...","isTrue":true,"level":"biet"},{"text":"...","isTrue":false,"level":"biet"},{"text":"...","isTrue":true,"level":"hieu"},{"text":"...","isTrue":false,"level":"vandung"}] },
  { "type": "SA", "level": "biet", "yccd": "NLc", "yccdContent": "...", "q": "...", "correctSA": "42" },
  { "type": "TL", "level": "vandung", "yccd": "NLd", "yccdContent": "...", "q": "...", "essayAnswer": "Đáp án chi tiết..." }
]`;

export function buildUserPrompt(params: GenerateAIQuestionsParams): string {
  const {
    grade,
    subject = "Tin học",
    topicName,
    lessonName,
    lessonDescription = "Sách giáo khoa Tin học Kết nối tri thức với cuộc sống",
    mcq_b = 2, mcq_h = 2, mcq_vd = 1, mcq_vdc = 1,
    tf_count = 1, tf_b = 2, tf_h = 1, tf_vd = 1,
    sa_b = 0, sa_h = 0, sa_vd = 0,
    tl_b = 0, tl_h = 1, tl_vd = 0, tl_vdc = 0
  } = params;

  const totalQuestions = (mcq_b + mcq_h + mcq_vd + mcq_vdc) + tf_count + (sa_b + sa_h + sa_vd) + (tl_b + tl_h + tl_vd + tl_vdc);

  return `Đóng vai giáo viên môn ${subject} ${grade}. Soạn câu hỏi cho bài: "${lessonName}" thuộc chủ đề "${topicName}". Tài liệu tham khảo: ${lessonDescription}.
BÁM SÁT NỘI DUNG VÀ YÊU CẦU CẦN ĐẠT TRONG SGK. TUYỆT ĐỐI KHÔNG HỎI KIỂU "THEO SGK", "THEO BÀI HỌC".

CẤU TRÚC:
TỔNG CỘNG BẠN BẮT BUỘC PHẢI TẠO CHÍNH XÁC ${totalQuestions} CÂU HỎI (mảng JSON trả về phải có đúng ${totalQuestions} phần tử, KHÔNG ĐƯỢC THIẾU BẤT KỲ CÂU NÀO).
- Trắc nghiệm (MCQ): ${mcq_b} Biết, ${mcq_h} Hiểu, ${mcq_vd} Vận dụng, ${mcq_vdc} Vận dụng cao (level "vandungcao")
- Đúng/Sai (TF): Tạo ${tf_count} câu lớn. TRONG MỖI CÂU LỚN bắt buộc có đúng 4 ý (a,b,c,d) tương ứng với các mức độ: ${tf_b} ý mức Biết, ${tf_h} ý mức Hiểu, ${tf_vd} ý mức Vận dụng.
- Trả lời ngắn (SA): ${sa_b} Biết, ${sa_h} Hiểu, ${sa_vd} VD. ĐÁP ÁN LÀ 1 CON SỐ TỐI ĐA 4 KÝ TỰ.
- Tự luận (TL): ${tl_b} Biết, ${tl_h} Hiểu, ${tl_vd} VD, ${tl_vdc} Vận dụng cao. Mỗi câu có đáp án chi tiết.

${COMMON_RULES}`;
}

/**
 * 5.3 Pipeline hậu kiểm JSON
 */
export function validateAndCleanAIResponse(rawText: string): any[] {
  // 1. Trích mảng bằng regex /\[[\s\S]*\]/
  const arrayMatch = rawText.match(/\[[\s\S]*\]/);
  if (!arrayMatch) {
    throw new Error("AI không trả về đúng định dạng JSON mảng []");
  }

  let jsonStr = arrayMatch[0];

  // 2. Làm sạch: bỏ ký tự điều khiển \x00-\x09\x0B-\x1F\x7F-\x9F, bỏ thẻ <p>
  jsonStr = jsonStr.replace(/[\x00-\x09\x0B-\x1F\x7F-\x9F]/g, '');
  jsonStr = jsonStr.replace(/<\/?p>/gi, '');

  // 3. Parse JSON; tự sửa backslash & trailing comma nếu cần
  let parsed: any[];
  try {
    parsed = JSON.parse(jsonStr);
  } catch (err1) {
    // Escape unescaped backslashes and remove trailing commas
    let repaired = jsonStr.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
    repaired = repaired.replace(/,\s*([}\]])/g, '$1');
    try {
      parsed = JSON.parse(repaired);
    } catch (err2) {
      throw new Error(`Lỗi phân tích cú pháp JSON từ AI: ${(err2 as Error).message}`);
    }
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Dữ liệu trả về không phải là mảng danh sách câu hỏi.");
  }

  // 4. Hậu kiểm nội dung: không cho phép các phương án gom nhóm
  const FORBIDDEN_WORDS = [
    'tất cả các ý trên', 'tất cả phương án trên', 'tất cả đều đúng',
    'tất cả đều sai', 'cả a và b', 'cả b và c', 'cả a và c', 'cả ba đáp án'
  ];

  const validCompetencies: Competency[] = ['NLa', 'NLb', 'NLc', 'NLd', 'NLe'];

  for (const item of parsed) {
    if (item.type === 'MCQ' && Array.isArray(item.a)) {
      for (const opt of item.a) {
        const lower = String(opt).toLowerCase();
        for (const bad of FORBIDDEN_WORDS) {
          if (lower.includes(bad)) {
            throw new Error(`Phát hiện phương án vi phạm quy tắc cấm: "${opt}". Hệ thống yêu cầu AI sinh lại.`);
          }
        }
      }
    }

    // Fix or validate competency
    if (!validCompetencies.includes(item.yccd)) {
      item.yccd = 'NLa';
    }

    if (!['biet', 'hieu', 'vandung', 'vandungcao'].includes(item.level)) {
      item.level = 'biet';
    }
  }

  return parsed;
}

export interface CallGeminiOptions {
  /** Thời điểm (ms epoch) phải dừng hẳn — bảo đảm cả request server trả về
   *  JSON TRƯỚC khi platform (Vercel) kill function vì quá giới hạn giờ. */
  deadline?: number;
}

export const GEMINI_DEADLINE_MSG = 'Hết thời gian của đợt sinh này (server chủ động cắt để trả kết quả kịp)';

export async function callGemini(systemPrompt: string, userPrompt: string, apiKey: string, modelName: string = DEFAULT_GEMINI_MODEL, opts: CallGeminiOptions = {}): Promise<string> {
  const makeBody = (withThinking: boolean) => ({
    system_instruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
      // Suy nghĩ ở mức thấp để phản hồi nhanh; model không hỗ trợ sẽ trả 400
      // và hệ thống tự gọi lại không kèm thinkingConfig.
      ...(withThinking ? { thinkingConfig: { thinkingLevel: 'low' } } : {})
    }
  });

  // Thời gian còn lại tới deadline (không có deadline thì coi như 45s/lệnh gọi)
  const remainingMs = () => (opts.deadline ? opts.deadline - Date.now() : 45_000);
  const outOfTime = () => remainingMs() < 3_000;

  const call = async (model: string, withThinking: boolean): Promise<Response> => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(makeBody(withThinking)),
      // Không cho một lệnh gọi treo quá thời gian còn lại của deadline
      signal: AbortSignal.timeout(Math.max(3_000, Math.min(45_000, remainingMs())))
    });
  };

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  // Chuỗi model dự phòng: model người dùng chọn → mặc định → 2 model flash mới nhất.
  // Model 2.x đã bị Google chặn với tài khoản mới nên không đưa vào.
  const chain = [modelName, DEFAULT_GEMINI_MODEL, 'gemini-flash-latest', 'gemini-flash-lite-latest']
    .filter((m, i, a): m is string => Boolean(m) && a.indexOf(m) === i);

  let lastError = 'Gọi Gemini thất bại';

  outer:
  for (const model of chain) {
    let withThinking = true;
    // Mỗi model thử tối đa 3 lượt (chủ yếu để retry 503 quá tải thoáng qua)
    for (let attempt = 1; attempt <= 3; attempt++) {
      if (outOfTime()) {
        lastError = GEMINI_DEADLINE_MSG;
        break outer; // hết ngân sách giờ → dừng cả chuỗi, trả lỗi ngay
      }
      try {
        const res = await call(model, withThinking);
        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text;
          lastError = 'Không nhận được phản hồi văn bản từ Gemini.';
          continue;
        }
        const errorText = await res.text();
        lastError = `Gemini API error (${res.status}): ${errorText.slice(0, 300)}`;
        // Key sai thì đổi model cũng không cứu được — dừng cả chuỗi ngay
        if (res.status === 400 && /API_KEY_INVALID|API key not valid/i.test(errorText)) {
          throw new Error(lastError);
        }
        if (res.status === 400 && /thinking/i.test(errorText)) {
          withThinking = false; // model không nhận thinkingConfig → gọi lại ngay không kèm
          continue;
        }
        if (res.status === 404 && /no longer available|not found|not supported/i.test(errorText)) {
          break; // model bị khai tử → sang model kế tiếp
        }
        if (res.status === 503 || res.status === 429) {
          await sleep(Math.min(3_000, Math.max(0, remainingMs()))); // quá tải: chờ trong ngân sách giờ còn lại
          continue;
        }
        break; // lỗi khác → sang model kế tiếp
      } catch (err) {
        // Timeout/abort/mạng: tính một lượt thất bại rồi thử lại
        lastError = `Lỗi kết nối Gemini: ${(err as Error).message}`;
        console.warn(`callGemini [${model}] lượt ${attempt} thất bại:`, lastError);
      }
    }
    console.warn(`callGemini: hết lượt với "${model}" → thử model kế tiếp (nếu có).`);
  }

  throw new Error(lastError);
}

export interface SingleQuestionParams {
  grade: Grade;
  subject?: string;
  lessonId: string;
  lessonName: string;
  topicName: string;
  lessonDescription?: string;
  type: QuestionType;
  level: Level;
  samples?: string;
  existingQuestions?: Question[]; // ngân hàng hiện có — để kiểm tra trùng kiến thức
  /** Thời điểm (ms epoch) phải dừng — không bắt đầu lượt sinh mới sau mốc này */
  deadline?: number;
}

export function buildSingleQuestionPrompt(params: SingleQuestionParams & { avoidContents?: string[] }): string {
  const {
    grade,
    subject = 'Tin học',
    lessonName,
    topicName,
    lessonDescription = '',
    type,
    level,
    samples = '',
    avoidContents = []
  } = params;

  const typeDesc: Record<QuestionType, string> = {
    MCQ: 'MCQ — trắc nghiệm 4 phương án A-D, có đúng 1 đáp án đúng (trường "a" gồm 4 chuỗi, "correct" là chỉ số 0-3 của đáp án đúng)',
    TF: 'TF — đúng/sai: lời dẫn ("q") là tình huống thực tế 4-5 dòng bám bài học; trường "items" gồm ĐÚNG 4 ý a,b,c,d (2 ý true, 2 ý false, mỗi ý có "level" riêng trải các mức)',
    SA: 'SA — trả lời ngắn: đáp án ("correctSA") là 1 con số tối đa 4 ký tự',
    TL: 'TL — tự luận: đáp án chi tiết từng bước trong "essayAnswer"'
  };

  const levelDesc: Record<Level, string> = {
    biet: 'Biết/Nhận biết (Remember) — nhận biết, nêu được, liệt kê',
    hieu: 'Hiểu (Understand) — giải thích, phân tích, so sánh',
    vandung: 'Vận dụng (Apply/Analyze) — áp dụng vào tình huống cụ thể mới',
    vandungcao: 'Vận dụng cao (Evaluate/Create) — tình huống mới phức tạp, đòi hỏi tổng hợp, đánh giá, sáng tạo giải pháp'
  };

  return `Đóng vai giáo viên môn ${subject} lớp ${grade}. Hãy SOẠN NGẪU NHIÊN ĐÚNG 1 CÂU HỎI HOÀN TOÀN MỚI (nếu có câu mẫu, TUYỆT ĐỐI KHÔNG trùng lặp nội dung với câu mẫu).
Bài học: "${lessonName}" thuộc chủ đề "${topicName}".
Yêu cầu cần đạt của bài theo SGK: ${lessonDescription}
KIẾN THỨC BẮT BUỘC BÁM SÁT SGK Tin học ${grade} — bộ sách "Kết nối tri thức với cuộc sống", định hướng Tin học ứng dụng (ICT). TUYỆT ĐỐI KHÔNG hỏi kiểu "theo SGK", "theo bài học".
NGÔN NGỮ BẮT BUỘC THEO SÁCH GIÁO KHOA:
- Dùng ĐÚNG thuật ngữ và cách diễn đạt như SGK KNTT-ICT (ưu tiên các cụm từ xuất hiện trong "Yêu cầu cần đạt của bài" ở trên).
- CẤM từ lóng/từ viết tắt trên mạng ("code", "bug", "fix", "update"… khi sách có từ Việt tương ứng: "chương trình", "lỗi chương trình", "cập nhật"; "file" → "tệp tin", "chuột" không phải "mouse"…), cấm emoji, cấm từ nước ngoài khi SGK đã có thuật ngữ Việt.
- KHÔNG gắn tên thương mại/website cụ thể khi SGK không nhắc đến; nếu cần ví dụ thực tế thì lấy tình huống học tập, gia đình, nhà trường gần gũi như trong sách.
- Văn phong trung thuần, chính xác như sách giáo khoa: câu câu chữ chữ, không phóng đại, không màu mè.
DẠNG CÂU: ${typeDesc[type]}.
MỨC ĐỘ NHẬN THỨC: "${level}" — ${levelDesc[level]}.
MÃ NĂNG LỰC ("yccd"): chỉ chọn 1 mã PHÙ HỢP với nội dung trong bộ: NLa (sử dụng & quản lý CNTT-TT), NLb (ứng xử phù hợp môi trường số), NLc (học tập & tự học với CNTT-TT), NLd (giao tiếp & hợp tác), NLe (giải quyết vấn đề với CNTT-TT). "yccdContent" mô tả cụ thể yêu cầu của chính câu hỏi này, bắt đầu bằng động từ hành vi.
${samples ? `THAM KHẢO PHONG CÁCH một số câu mẫu đang có trong ngân hàng (chỉ học cách trình bày, KHÔNG sao chép nội dung):
${samples}
` : ''}${avoidContents.length ? `CÁC NỘI DUNG SAU ĐÃ CÓ TRONG NGÂN HÀNG CÂU HỎI — TUYỆT ĐỐI KHÔNG được lặp kiến thức, khái niệm, ví dụ, tình huống hay ý tưởng với bất kỳ nội dung nào bên dưới (phải khai thác MỘT KHÍA CẠNH KHÁC của bài học):
${avoidContents.slice(0, 15).map((s, i) => `${i + 1}. ${s.slice(0, 250)}`).join('\n')}
` : ''}
CẤU TRÍCH: mảng JSON trả về có ĐÚNG 1 phần tử duy nhất.
${COMMON_RULES}`;
}

/** Sinh đúng 1 câu hỏi mới (dùng cho nút "Thêm Bằng AI" trong Ngân Hàng Câu Hỏi).
 * Tự kiểm tra trùng kiến thức với ngân hàng (existingQuestions): nếu trùng thì
 * đưa nội dung bị trùng vào danh sách "phải tránh" và SINH LẠI với khía cạnh khác. */
export async function generateSingleAIQuestion(params: SingleQuestionParams): Promise<Question> {
  const config = getConfig();
  const apiKey = config.geminiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Chưa cấu hình API Key Gemini. Hãy bấm "Cấu hình API Key" trên thanh công cụ để nhập key (có hướng dẫn lấy key tại đó).');
  }

  const existing = params.existingQuestions || [];
  const avoidContents: string[] = [];
  let lastError: any = null;
  let lastDupInfo = '';
  const MAX_ATTEMPTS = 4;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (params.deadline && Date.now() >= params.deadline - 1_000) break; // hết giờ đợt này
    try {
      const userPrompt = buildSingleQuestionPrompt({ ...params, avoidContents });
      const raw = await callGemini(SYSTEM_PROMPT, userPrompt, apiKey, config.geminiModel || DEFAULT_GEMINI_MODEL, { deadline: params.deadline });
      const parsed = validateAndCleanAIResponse(raw);
      const item = parsed[0];
      if (!item) throw new Error('AI trả về mảng rỗng');

      // Ép đúng dạng + mức đã chọn; kiểm tra đủ dữ liệu của từng dạng
      item.type = params.type;
      item.level = params.level;
      if (params.type === 'MCQ' && (!Array.isArray(item.a) || item.a.length !== 4 || typeof item.correct !== 'number' || item.correct < 0 || item.correct > 3)) {
        throw new Error('Câu MCQ thiếu 4 phương án hoặc đáp án đúng không hợp lệ');
      }
      if (params.type === 'TF' && (!Array.isArray(item.items) || item.items.length !== 4 || item.items.every((x: any) => x.isTrue) || !item.items.some((x: any) => x.isTrue))) {
        throw new Error('Câu Đúng/Sai phải có đủ 4 ý và phải có cả ý Đúng lẫn ý Sai');
      }
      if (params.type === 'SA' && !item.correctSA) {
        throw new Error('Câu Trả lời ngắn thiếu đáp án correctSA');
      }
      if (params.type === 'TL' && !item.essayAnswer) {
        throw new Error('Câu Tự luận thiếu đáp án chi tiết essayAnswer');
      }
      if (!item.q) throw new Error('Câu hỏi thiếu nội dung');

      const candidate: Question = {
        ...item,
        id: `ai_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        grade: params.grade,
        subject: params.subject || 'Tin học',
        topicId: '',
        lessonId: params.lessonId,
        points: params.type === 'MCQ' ? 0.25 : params.type === 'TF' ? 1.0 : params.type === 'SA' ? 0.25 : 1.0
      };

      // Hậu kiểm trùng kiến thức với ngân hàng (cùng bài)
      const dups = findDuplicateQuestions(candidate, existing);
      if (dups.length > 0) {
        lastDupInfo = dups.slice(0, 3).map(d => `- ${d.question.q.slice(0, 100)} (giống ${Math.round(d.score * 100)}%)`).join('\n');
        for (const d of dups.slice(0, 5)) {
          const content = d.question.q;
          if (!avoidContents.includes(content)) avoidContents.push(content);
        }
        console.warn(`Sinh câu AI lượt ${attempt}/${MAX_ATTEMPTS}: trùng kiến thức với ${dups.length} câu trong ngân hàng → sinh lại với khía cạnh khác.`);
        continue;
      }

      return candidate;
    } catch (err) {
      lastError = err;
      const msg = (err as Error).message || '';
      console.warn(`Sinh 1 câu hỏi — lượt ${attempt} thất bại:`, msg);
      // Key sai/hết hạn mức: thử lại cũng vô nghĩa — ném ngay để báo cho người dùng
      if (/API_KEY_INVALID|API key not valid/i.test(msg)) throw err;
    }
  }

  if (lastDupInfo && avoidContents.length > 0) {
    throw new Error(`AI liên tục tạo câu trùng kiến thức với câu đã có trong ngân hàng (đã thử ${MAX_ATTEMPTS} lượt):\n${lastDupInfo}\nHãy thử lại hoặc thêm câu ở bài/dạng khác.`);
  }
  throw new Error(`Không thể sinh câu hỏi qua AI: ${lastError ? lastError.message : 'lỗi không xác định'}`);
}

export async function generateAIQuestionsWithFailover(params: GenerateAIQuestionsParams, lessonId: string, existingQuestions: Question[] = [], deadline?: number): Promise<Question[]> {
  const config = getConfig();
  const apiKey = config.geminiKey || process.env.GEMINI_API_KEY;
  const userPrompt = buildUserPrompt(params);

  let rawOutput = '';
  let lastError: any = null;
  let batch: Question[] = [];

  // Try Gemini first (up to 3 retries)
  if (apiKey) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      if (deadline && Date.now() >= deadline - 1_000) break; // hết giờ đợt này
      try {
        rawOutput = await callGemini(SYSTEM_PROMPT, userPrompt, apiKey, config.geminiModel || DEFAULT_GEMINI_MODEL, { deadline });
        const parsed = validateAndCleanAIResponse(rawOutput);
        batch = parsed.map((item, idx) => ({
          ...item,
          id: `ai_${Date.now()}_${idx + 1}`,
          grade: params.grade,
          subject: params.subject,
          topicId: '',
          lessonId: lessonId,
          points: item.type === 'MCQ' ? 0.25 : item.type === 'TF' ? 1.0 : item.type === 'SA' ? 0.25 : 1.0
        }));
        break;
      } catch (err) {
        lastError = err;
        console.warn(`Attempt ${attempt} with Gemini failed:`, (err as Error).message);
      }
    }
  }

  if (batch.length === 0) {
    throw new Error(`Không thể sinh câu hỏi qua AI: ${lastError ? lastError.message : "Chưa cấu hình API Key trong Cài đặt hoặc file môi trường."}`);
  }

  // Hậu kiểm trùng kiến thức: câu trùng ngân hàng hoặc trùng nhau trong lô
  // được SINH LẠI riêng (có danh sách nội dung phải tránh); sinh lại vẫn trùng thì bỏ câu đó.
  const accepted: Question[] = [];
  const reference = [...existingQuestions];
  let regenerated = 0;
  let dropped = 0;

  for (const q of batch) {
    const dups = findDuplicateQuestions(q, [...reference, ...accepted]);
    if (dups.length === 0) {
      accepted.push(q);
      continue;
    }
    console.warn(`Câu sinh lô trùng kiến thức (${dups.length} câu) → sinh lại: ${q.q.slice(0, 80)}`);
    if (deadline && Date.now() >= deadline - 1_000) {
      dropped++;
      console.warn('Hết thời gian đợt sinh, bỏ qua câu trùng chưa xử lý:', q.q.slice(0, 80));
      continue;
    }
    try {
      const replacement = await generateSingleAIQuestion({
        grade: params.grade,
        subject: params.subject,
        lessonId,
        lessonName: params.lessonName,
        topicName: params.topicName,
        lessonDescription: params.lessonDescription,
        type: q.type,
        level: q.level,
        existingQuestions: [...reference, ...accepted],
        deadline
      });
      accepted.push(replacement);
      regenerated++;
    } catch (err) {
      dropped++;
      console.warn('Sinh lại thất bại, bỏ qua câu trùng:', (err as Error).message);
    }
  }

  console.log(`Sinh lô cho "${params.lessonName}": ${accepted.length} câu giữ lại, ${regenerated} sinh lại do trùng, ${dropped} bỏ do không sinh được nội dung mới.`);
  return accepted;
}
