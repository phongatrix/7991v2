import fs from 'fs';
import path from 'path';
import { Question, FullExamPackage, UserConfig, DEFAULT_GEMINI_MODEL } from './types';
import { INITIAL_QUESTIONS } from './initialQuestions';

// Trên serverless (Vercel) filesystem của dự án là CHỈ ĐỌC: mọi ghi dữ liệu phải
// vào /tmp (tạm thời theo từng instance function). Chạy local thì ghi thẳng data/.
// Lưu ý: dữ liệu ghi vào /tmp không bền vững giữa các lần deploy/khởi động lạnh —
// bản đóng kèm code trong READ_DIR vẫn là nguồn gốc khi /tmp trống.
const IS_SERVERLESS = Boolean(process.env.VERCEL);
const READ_DIR = path.join(process.cwd(), 'data');
const WRITE_DIR = IS_SERVERLESS ? path.join('/tmp', 'data') : READ_DIR;

const QUESTIONS_FILE = 'questions.json';
const EXAMS_FILE = 'exams.json';
const CONFIG_FILE = 'config.json';

function readDataFile(name: string): string | null {
  // Ưu tiên bản mới ghi gần nhất (WRITE_DIR), sau đó tới bản đóng kèm code
  for (const dir of [WRITE_DIR, READ_DIR]) {
    try {
      const p = path.join(dir, name);
      if (fs.existsSync(p)) return fs.readFileSync(p, 'utf-8');
    } catch (err) {
      console.error(`Error reading ${name} from ${dir}:`, err);
    }
  }
  return null;
}

function writeDataFile(name: string, content: string): void {
  fs.mkdirSync(WRITE_DIR, { recursive: true });
  fs.writeFileSync(path.join(WRITE_DIR, name), content, 'utf-8');
}

export function getQuestions(): Question[] {
  const raw = readDataFile(QUESTIONS_FILE);
  if (raw !== null) {
    try {
      return JSON.parse(raw);
    } catch (err) {
      console.error('Error parsing questions.json:', err);
      return INITIAL_QUESTIONS;
    }
  }
  // Chưa có file (lần đầu chạy) — tạo bản gốc trong thư mục ghi được
  try {
    writeDataFile(QUESTIONS_FILE, JSON.stringify(INITIAL_QUESTIONS, null, 2));
  } catch (err) {
    console.error('Error seeding questions.json:', err);
  }
  return INITIAL_QUESTIONS;
}

export function saveQuestions(questions: Question[]): void {
  writeDataFile(QUESTIONS_FILE, JSON.stringify(questions, null, 2));
}

export function addQuestion(q: Question): Question {
  const all = getQuestions();
  const existingIdx = all.findIndex(item => item.id === q.id);
  if (existingIdx >= 0) {
    all[existingIdx] = q;
  } else {
    all.unshift(q);
  }
  saveQuestions(all);
  return q;
}

export function deleteQuestion(id: string): boolean {
  const all = getQuestions();
  const filtered = all.filter(q => q.id !== id);
  if (filtered.length !== all.length) {
    saveQuestions(filtered);
    return true;
  }
  return false;
}

export function getExams(): FullExamPackage[] {
  const raw = readDataFile(EXAMS_FILE);
  if (raw === null) return [];
  try {
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

export function saveExam(exam: FullExamPackage): void {
  const all = getExams();
  const idx = all.findIndex(e => e.id === exam.id);
  if (idx >= 0) {
    all[idx] = exam;
  } else {
    all.unshift(exam);
  }
  writeDataFile(EXAMS_FILE, JSON.stringify(all, null, 2));
}

export function getExamById(id: string): FullExamPackage | null {
  const all = getExams();
  return all.find(e => e.id === id) || null;
}

export function getConfig(): UserConfig {
  const raw = readDataFile(CONFIG_FILE);
  if (raw !== null) {
    try {
      const parsed = JSON.parse(raw);
      return {
        geminiKey: parsed.geminiKey ?? (process.env.GEMINI_API_KEY || ""),
        geminiModel: parsed.geminiModel ?? (process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL)
      };
    } catch (err) {
      return {};
    }
  }
  return {
    geminiKey: process.env.GEMINI_API_KEY || "",
    geminiModel: process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL
  };
}

export function saveConfig(cfg: UserConfig): void {
  writeDataFile(CONFIG_FILE, JSON.stringify(cfg, null, 2));
}
