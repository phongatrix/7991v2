import sgk10 from './sgk/10.json';
import sgk11 from './sgk/11.json';
import sgk12 from './sgk/12.json';
import { CURRICULUM_DATA } from './curriculumData';
import { Grade } from './types';

// Nội dung bài học OCR từ SGK Tin học KNTT (khối 10/11/12), khoá theo SỐ bài
// ("Bài 7" → "7"). Dùng để bám sát văn phong/nội dung sách khi sinh câu bằng AI.
const SGK_BY_GRADE: Record<string, Record<string, string>> = {
  '10': sgk10 as Record<string, string>,
  '11': sgk11 as Record<string, string>,
  '12': sgk12 as Record<string, string>
};

/** Lấy số bài từ lessonId (vd "k10_b7" → 7) qua dữ liệu chương trình */
export function lessonNumberOf(lessonId: string): number | null {
  for (const grade of ['10', '11', '12'] as const) {
    const lesson = (CURRICULUM_DATA[grade] || []).flatMap(t => t.lessons).find(l => l.id === lessonId);
    if (lesson) return lesson.number;
  }
  return null;
}

/** Nội dung SGK của 1 bài (đã rút gọn), hoặc '' nếu chưa có dữ liệu OCR */
export function getSgkLessonText(grade: Grade, lessonId: string, maxChars = 4500): string {
  const num = lessonNumberOf(lessonId);
  if (num === null) return '';
  const text = SGK_BY_GRADE[String(grade)]?.[String(num)] || '';
  return text.slice(0, maxChars);
}
