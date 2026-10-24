import fs from 'fs';
import path from 'path';
import { Question, FullExamPackage, UserConfig, DEFAULT_GEMINI_MODEL } from './types';
import { INITIAL_QUESTIONS } from './initialQuestions';

const DATA_DIR = path.join(process.cwd(), 'data');
const QUESTIONS_FILE = path.join(DATA_DIR, 'questions.json');
const EXAMS_FILE = path.join(DATA_DIR, 'exams.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getQuestions(): Question[] {
  ensureDataDir();
  if (!fs.existsSync(QUESTIONS_FILE)) {
    fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(INITIAL_QUESTIONS, null, 2), 'utf-8');
    return INITIAL_QUESTIONS;
  }
  try {
    const raw = fs.readFileSync(QUESTIONS_FILE, 'utf-8');
    const questions: Question[] = JSON.parse(raw);
    return questions;
  } catch (err) {
    console.error('Error reading questions.json:', err);
    return INITIAL_QUESTIONS;
  }
}

export function saveQuestions(questions: Question[]): void {
  ensureDataDir();
  fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(questions, null, 2), 'utf-8');
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
  ensureDataDir();
  if (!fs.existsSync(EXAMS_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(EXAMS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

export function saveExam(exam: FullExamPackage): void {
  ensureDataDir();
  const all = getExams();
  const idx = all.findIndex(e => e.id === exam.id);
  if (idx >= 0) {
    all[idx] = exam;
  } else {
    all.unshift(exam);
  }
  fs.writeFileSync(EXAMS_FILE, JSON.stringify(all, null, 2), 'utf-8');
}

export function getExamById(id: string): FullExamPackage | null {
  const all = getExams();
  return all.find(e => e.id === id) || null;
}

export function getConfig(): UserConfig {
  ensureDataDir();
  if (!fs.existsSync(CONFIG_FILE)) {
    return {
      geminiKey: process.env.GEMINI_API_KEY || "",
      geminiModel: process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL
    };
  }
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      geminiKey: parsed.geminiKey ?? (process.env.GEMINI_API_KEY || ""),
      geminiModel: parsed.geminiModel ?? (process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL)
    };
  } catch (err) {
    return {};
  }
}

export function saveConfig(cfg: UserConfig): void {
  ensureDataDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
}
