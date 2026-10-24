import mammoth from 'mammoth';
import { Question, Grade, QuestionType, Level, Competency } from './types';

export interface ParseResult {
  questions: Question[];
  stats: {
    totalParsed: number;
    mcq: number;
    tf: number;
    sa: number;
    tl: number;
  };
}

export async function parseDocxBuffer(buffer: Buffer, defaultGrade: Grade = '11', defaultLessonId = 'k11_b1'): Promise<ParseResult> {
  const result = await mammoth.extractRawText({ buffer });
  const rawText = result.value;
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const questions: Question[] = [];
  let currentPart = 1; // 1: MCQ, 2: TF, 3: SA, 4: TL
  let currentQ: Partial<Question> | null = null;
  let currentOptions: { text: string; isCorrect: boolean }[] = [];
  let currentTFItems: { key: string; text: string; isTrue: boolean; level: Level }[] = [];

  const finalizeCurrentQuestion = () => {
    if (!currentQ || !currentQ.q) return;

    if (currentPart === 1 || currentQ.type === 'MCQ') {
      currentQ.type = 'MCQ';
      if (currentOptions.length >= 2) {
        const a: [string, string, string, string] = [
          currentOptions[0]?.text || '',
          currentOptions[1]?.text || '',
          currentOptions[2]?.text || '',
          currentOptions[3]?.text || ''
        ];
        const correctIdx = currentOptions.findIndex(o => o.isCorrect);
        currentQ.a = a;
        currentQ.correct = correctIdx >= 0 ? correctIdx : 0;
      }
    } else if (currentPart === 2 || currentQ.type === 'TF') {
      currentQ.type = 'TF';
      if (currentTFItems.length > 0) {
        currentQ.items = currentTFItems;
      }
    } else if (currentPart === 3 || currentQ.type === 'SA') {
      currentQ.type = 'SA';
    } else if (currentPart === 4 || currentQ.type === 'TL') {
      currentQ.type = 'TL';
    }

    if (!currentQ.level) currentQ.level = 'biet';
    if (!currentQ.yccd) currentQ.yccd = 'NLa';
    if (!currentQ.yccdContent) {
      currentQ.yccdContent = `Kiểm tra kiến thức câu ${questions.length + 1}`;
    }

    questions.push(currentQ as Question);
    currentQ = null;
    currentOptions = [];
    currentTFItems = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check Part Header: [P1], PHẦN I, PHẦN 1
    const partMatch = line.match(/(?:\[P([1-4])\]|PHẦN\s+([1-4]|I|II|III|IV))/i);
    if (partMatch) {
      finalizeCurrentQuestion();
      const val = (partMatch[1] || partMatch[2]).toUpperCase();
      if (val === '1' || val === 'I') currentPart = 1;
      else if (val === '2' || val === 'II') currentPart = 2;
      else if (val === '3' || val === 'III') currentPart = 3;
      else if (val === '4' || val === 'IV') currentPart = 4;
      continue;
    }

    // Check New Question: "Câu 1:", "Bài 1:"
    const qMatch = line.match(/^(?:Câu|Bài)\s+\d+[:.]?\s*(.*)/i);
    if (qMatch) {
      finalizeCurrentQuestion();
      const stem = qMatch[1].trim();
      currentQ = {
        id: `import_${Date.now()}_${questions.length + 1}`,
        grade: defaultGrade,
        subject: 'Tin học',
        lessonId: defaultLessonId,
        topicId: '',
        q: stem,
        type: currentPart === 1 ? 'MCQ' : currentPart === 2 ? 'TF' : currentPart === 3 ? 'SA' : 'TL',
        level: 'biet',
        yccd: 'NLa',
        yccdContent: stem.slice(0, 100),
        points: currentPart === 1 ? 0.25 : currentPart === 2 ? 1.0 : currentPart === 3 ? 0.25 : 1.0
      };
      continue;
    }

    // Check MCQ Option: "*A. ..." or "A. ..."
    const mcqOptMatch = line.match(/^\s*(\*?)\s*([A-D])\s*[:.)]\s*(.*)/);
    if (mcqOptMatch && currentQ) {
      const isCorrect = mcqOptMatch[1] === '*';
      const text = mcqOptMatch[3].trim();
      currentOptions.push({ text, isCorrect });
      continue;
    }

    // Check TF Sub-item: "*a) ..." or "a) ..."
    const tfItemMatch = line.match(/^\s*(\*?)\s*([a-d])\s*[:.)]\s*(.*)/i);
    if (tfItemMatch && currentQ) {
      const isCorrect = tfItemMatch[1] === '*';
      const key = tfItemMatch[2].toLowerCase();
      const text = tfItemMatch[3].trim();
      const level: Level = (key === 'a' || key === 'b') ? 'biet' : key === 'c' ? 'hieu' : 'vandung';
      currentTFItems.push({ key, text, isTrue: isCorrect, level });
      continue;
    }

    // Append to current question stem if no option matched
    if (currentQ) {
      currentQ.q = (currentQ.q ? currentQ.q + '\n' : '') + line;
    }
  }

  finalizeCurrentQuestion();

  return {
    questions,
    stats: {
      totalParsed: questions.length,
      mcq: questions.filter(q => q.type === 'MCQ').length,
      tf: questions.filter(q => q.type === 'TF').length,
      sa: questions.filter(q => q.type === 'SA').length,
      tl: questions.filter(q => q.type === 'TL').length
    }
  };
}
