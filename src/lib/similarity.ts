import { Question } from './types';

/**
 * Đo trùng lắp KIẾN THỨC giữa câu hỏi AI mới sinh với câu đã có trong ngân hàng.
 * So ở tầng nội dung: văn bản câu hỏi + phương án/4 ý (đúng/Sai), trong phạm vi
 * cùng bài học. Chấp nhận khác diễn đạt nhưng phát hiện cùng ý tưởng/ví dụ/tình huống.
 */

// Stopword tiếng Việt thường gặp — bỏ khỏi vân tay so sánh
const STOPWORDS = new Set([
  'của', 'và', 'các', 'có', 'được', 'trong', 'cho', 'là', 'một', 'những', 'khi',
  'với', 'để', 'không', 'phải', 'về', 'này', 'đó', 'câu', 'hỏi', 'nào', 'theo',
  'bao', 'giờ', 'nhau', 'từ', 'bằng', 'cách', 'điều', 'vậy', 'mà', 'các', 'hai',
  'ba', 'bốn', 'năm', 'em', 'ta', 'như', 'ra', 'vào', 'lên', 'bị', 'tại', 'do',
  'vì', 'nếu', 'mỗi', 'người', 'gì', 'ai', 'đâu', 'sao', 'nhất', 'hơn', 'cũng',
  'đã', 'sẽ', 'đang', 'bỏ', 'cho', 'lại', 'nói', 'khiến', 'thì', 'bộ', 'phần',
  'trên', 'dưới', 'sau', 'trước', 'đây', 'kia', 'ấy', 'nao', 'âu', 'lo', 'kìa'
]);

export function normalizeText(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/```[\s\S]*?```/g, ' ')      // khối code: biến/lệnh cụ thể dễ nhiễu, bỏ khỏi so kiến thức
    .replace(/\$\$?[^$]*\$\$?/g, ' ')     // công thức LaTeX
    .replace(/<[^>]+>/g, ' ')             // thẻ HTML/SVG
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')    // dấu câu
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(text: string): string[] {
  return normalizeText(text).split(' ').filter(t => t.length >= 2 && !STOPWORDS.has(t));
}

function bigrams(list: string[]): Set<string> {
  const s = new Set<string>();
  for (let i = 0; i + 1 < list.length; i++) s.add(list[i] + ' ' + list[i + 1]);
  return s;
}

/** Độ tương đồng 0..1: kết hợp Jaccard & độ chứa, tính trên tập từ và cụm 2 từ */
export function textSimilarity(a: string, b: string): number {
  const ta = tokens(a), tb = tokens(b);
  if (!ta.length || !tb.length) return 0;
  const sa = new Set(ta), sb = new Set(tb);
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter++;
  const wordJ = inter / (sa.size + sb.size - inter);
  const wordC = inter / Math.min(sa.size, sb.size);

  const ba = bigrams(ta), bb = bigrams(tb);
  let bInter = 0;
  for (const g of ba) if (bb.has(g)) bInter++;
  const bigramJ = ba.size && bb.size ? bInter / (ba.size + bb.size - bInter) : 0;
  const bigramC = ba.size && bb.size ? bInter / Math.min(ba.size, bb.size) : 0;

  return Math.max(wordJ, 0.88 * wordC, bigramJ, 0.9 * bigramC);
}

/** Văn bản đại diện kiến thức của một câu hỏi */
export function questionFingerprint(q: Question): string {
  const parts: string[] = [q.q || ''];
  if (Array.isArray(q.a)) parts.push(q.a.join(' '));
  if (Array.isArray(q.items)) parts.push(q.items.map(it => it.text).join(' '));
  return parts.join(' ');
}

// Ngưỡng mặc định: trên thực nghiệm với ngân hàng Tin học (cùng bài), cặp câu
// khác kiến thức thường < 0.6, cặp trùng ý tưởng/paraphrase thường > 0.72.
export const DUPLICATE_THRESHOLD = 0.72;

export interface DuplicateMatch {
  question: Question;
  score: number;
}

/** Tìm các câu trong ngân hàng (cùng bài) trùng kiến thức với câu ứng viên */
export function findDuplicateQuestions(candidate: Question, bank: Question[], threshold: number = DUPLICATE_THRESHOLD): DuplicateMatch[] {
  const fp = questionFingerprint(candidate);
  const matches: DuplicateMatch[] = [];
  for (const q of bank) {
    if (q.id === candidate.id) continue;
    if (q.lessonId !== candidate.lessonId) continue;
    const score = textSimilarity(fp, questionFingerprint(q));
    if (score >= threshold) matches.push({ question: q, score: Number(score.toFixed(3)) });
  }
  return matches.sort((a, b) => b.score - a.score);
}
