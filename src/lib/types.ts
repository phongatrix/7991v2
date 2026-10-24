export type Grade = '10' | '11' | '12';
export type QuestionType = 'MCQ' | 'TF' | 'SA' | 'TL';
export type Level = 'biet' | 'hieu' | 'vandung' | 'vandungcao';
export type Competency = 'NLa' | 'NLb' | 'NLc' | 'NLd' | 'NLe';

export const LEVELS: Level[] = ['biet', 'hieu', 'vandung', 'vandungcao'];
export const LEVEL_LABELS: Record<Level, string> = {
  biet: 'Biết',
  hieu: 'Hiểu',
  vandung: 'Vận dụng',
  vandungcao: 'Vận dụng cao',
};

export interface TFItem {
  key?: string; // 'a' | 'b' | 'c' | 'd'
  text: string;
  isTrue: boolean;
  level: Level;
}

export interface Question {
  id: string;
  grade: Grade;
  subject: string;
  topicId: string;
  lessonId: string;
  type: QuestionType;
  level: Level;
  yccd: Competency;
  yccdContent: string;
  q: string;
  a?: [string, string, string, string]; // 4 options for MCQ
  correct?: number; // 0..3
  items?: TFItem[]; // 4 items for TF
  correctSA?: string; // numeric answer up to 4 chars
  essayAnswer?: string; // detailed answer for TL
  points?: number;
  diagramSvg?: string;
  createdAt?: string;
}

export interface MatrixCell {
  mcq_b: number;
  mcq_h: number;
  mcq_vd: number;
  mcq_vdc: number;
  tf_b: number;
  tf_h: number;
  tf_vd: number;
  tf_vdc: number;
  sa_b: number;
  sa_h: number;
  sa_vd: number;
  sa_vdc: number;
  tl_b: number;
  tl_h: number;
  tl_vd: number;
  tl_vdc: number;
}

export interface MatrixRow {
  topicId: string;
  topicName: string;
  lessonId: string;
  lessonName: string;
  cells: MatrixCell;
  totalBiet: number;
  totalHieu: number;
  totalVD: number;
  totalVDC: number;
  totalPoints: number;
  percentage: number;
}

export interface ExamMatrix {
  grade: Grade;
  subject: string;
  title: string;
  durationMinutes: number;
  selectedLessonIds: string[];
  rows: MatrixRow[];
  totals: {
    mcq: { b: number; h: number; vd: number; vdc: number; total: number; points: number; percent: number };
    tf: { b: number; h: number; vd: number; vdc: number; total: number; points: number; percent: number };
    sa: { b: number; h: number; vd: number; vdc: number; total: number; points: number; percent: number };
    tl: { b: number; h: number; vd: number; vdc: number; total: number; points: number; percent: number };
    levels: {
      biet: { count: number; points: number; percent: number };
      hieu: { count: number; points: number; percent: number };
      vandung: { count: number; points: number; percent: number };
      vandungcao: { count: number; points: number; percent: number };
    };
    overall: {
      count: number;
      points: number;
      percent: number;
    };
  };
}

export interface SpecRow {
  topicId: string;
  topicName: string;
  lessonId: string;
  lessonName: string;
  yccdDescription: {
    biet: string[];
    hieu: string[];
    vandung: string[];
    vandungcao: string[];
  };
  mcq_b: { count: number; competency: Competency; qRefs: string[] };
  mcq_h: { count: number; competency: Competency; qRefs: string[] };
  mcq_vd: { count: number; competency: Competency; qRefs: string[] };
  mcq_vdc: { count: number; competency: Competency; qRefs: string[] };
  tf_b: { count: number; competency: Competency; qRefs: string[] };
  tf_h: { count: number; competency: Competency; qRefs: string[] };
  tf_vd: { count: number; competency: Competency; qRefs: string[] };
  tf_vdc: { count: number; competency: Competency; qRefs: string[] };
  sa_b: { count: number; competency: Competency; qRefs: string[] };
  sa_h: { count: number; competency: Competency; qRefs: string[] };
  sa_vd: { count: number; competency: Competency; qRefs: string[] };
  sa_vdc: { count: number; competency: Competency; qRefs: string[] };
  tl_b: { count: number; competency: Competency; qRefs: string[] };
  tl_h: { count: number; competency: Competency; qRefs: string[] };
  tl_vd: { count: number; competency: Competency; qRefs: string[] };
  tl_vdc: { count: number; competency: Competency; qRefs: string[] };
}

export interface ExamSpec {
  rows: SpecRow[];
  showCompetencyCodes: boolean;
}

export interface ExamVariantQuestion {
  originalIndex: number;
  variantNumber: number;
  question: Question;
  shuffledOptions?: { text: string; originalIndex: number }[];
  shuffledCorrectIndex?: number;
}

export interface ExamVariant {
  code: string; // '001', '002', etc.
  mcq: ExamVariantQuestion[];
  tf: ExamVariantQuestion[];
  sa: ExamVariantQuestion[];
  tl: ExamVariantQuestion[];
}

export interface FullExamPackage {
  id: string;
  title: string;
  department: string; // 'SỞ GD&ĐT ...'
  school: string; // 'TRƯỜNG THPT ...'
  grade: Grade;
  subject: string;
  durationMinutes: number;
  matrix: ExamMatrix;
  spec: ExamSpec;
  variants: ExamVariant[];
  selectedQuestionIds: string[];
  createdAt: string;
}

export interface UserConfig {
  geminiKey?: string;
  geminiModel?: string;
}

// Model Gemini mặc định khi chưa cấu hình (Gemini 3.8 Flash)
export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';
