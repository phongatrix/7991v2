'use client';

import React, { useState } from 'react';
import { Question, Grade, QuestionType, Level, LEVEL_LABELS } from '@/lib/types';
import type { MatrixGap } from '@/lib/examGenerator';
import { CURRICULUM_DATA } from '@/lib/curriculumData';
import { KatexRenderer } from './KatexRenderer';
import { DraftEditor } from './DraftEditor';
import { X, Sparkles, Pencil, Trash2, Loader2, AlertTriangle, CheckCircle2, XCircle, FileQuestion, Plus, Save } from 'lucide-react';

interface GeneratedQuestionsModalProps {
  isOpen: boolean;
  /** Câu hỏi AI vừa sinh trong lượt "Đảm bảo ma trận" */
  questions: Question[];
  /** Lỗi của những câu không sinh được (nếu có) */
  errors: string[];
  /** Số câu còn thiếu so với ma trận (chưa sinh xong) */
  remaining: number;
  /** Các tổ hợp bài×dạng×mức vẫn còn thiếu theo ma trận — cho phép tạo bù từng câu */
  gaps: MatrixGap[];
  /** Khối lớp của ma trận (để tạo câu thủ công đúng khối) */
  grade: Grade;
  onClose: () => void;
  /** Gọi khi câu hỏi được sửa/xóa/thêm thành công để trang chính làm mới dữ liệu */
  onChanged: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  MCQ: 'Trắc nghiệm',
  TF: 'Đúng/Sai',
  SA: 'Trả lời ngắn',
  TL: 'Tự luận'
};

const letters = ['A', 'B', 'C', 'D'];
const subLetters = ['a', 'b', 'c', 'd'];

export const GeneratedQuestionsModal: React.FC<GeneratedQuestionsModalProps> = ({
  isOpen,
  questions,
  errors,
  remaining,
  gaps,
  grade,
  onClose,
  onChanged
}) => {
  const [list, setList] = useState<Question[]>(questions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Question | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  // Các câu đã được lưu thẳng vào ngân hàng (bấm "Thêm vào ngân hàng" hoặc Sửa → Lưu)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingAll, setSavingAll] = useState(false);
  // Các tổ hợp còn thiếu theo ma trận — tạo bù từng câu ngay trong pop-up
  const [gapList, setGapList] = useState<MatrixGap[]>(gaps);
  const [creatingGap, setCreatingGap] = useState<string | null>(null); // key gap đang tạo bằng AI
  const [manualDraft, setManualDraft] = useState<Question | null>(null); // câu đang soạn thủ công
  const [manualSaving, setManualSaving] = useState(false);
  const [manualGapKey, setManualGapKey] = useState<string | null>(null); // gap mà câu thủ công thuộc về
  const [manualErrText, setManualErrText] = useState<string | null>(null); // dòng lỗi đang được tạo bù thủ công
  // Danh sách lỗi hiển thị — rút gọn khi đã tạo bù câu cho lỗi tương ứng
  const [errorList, setErrorList] = useState<string[]>(errors);

  // Đồng bộ danh sách mới nhất từ trang mỗi lần mở modal
  React.useEffect(() => {
    if (isOpen) {
      setList(questions);
      setEditingId(null);
      setDraft(null);
      setSavedIds(new Set());
      setSavingAll(false);
      setGapList(gaps);
      setCreatingGap(null);
      setManualDraft(null);
      setManualGapKey(null);
      setManualErrText(null);
      setErrorList(errors);
    }
  }, [isOpen, questions]);

  if (!isOpen) return null;

  const lessonNameOf = (q: Question) =>
    (CURRICULUM_DATA[q.grade] || [])
      .flatMap(t => t.lessons)
      .find(l => l.id === q.lessonId)?.fullName || q.lessonId;

  const lessonNameOfGrade = (lessonId: string) =>
    (CURRICULUM_DATA[grade] || [])
      .flatMap(t => t.lessons)
      .find(l => l.id === lessonId)?.fullName || lessonId;

  const gapKeyOf = (g: MatrixGap) => `${g.lessonId}|${g.type}|${g.level}`;

  // Khớp 1 dòng lỗi ("Bài X. Tên bài — TL/biet: AI ... trùng ...") với tổ hợp
  // còn thiếu tương ứng để gắn nút tạo bù đúng bài/dạng/mức của lỗi đó
  const gapOfError = (err: string): MatrixGap | null => {
    const m = err.match(/—\s*(MCQ|TF|SA|TL)\/([a-z]+):/);
    if (!m) return null;
    const type = m[1] as QuestionType;
    const level = m[2] as Level;
    const lessonName = err.split('—')[0].trim();
    return (
      gapList.find(g =>
        g.type === type &&
        g.level === level &&
        (lessonNameOfGrade(g.lessonId) === lessonName || lessonName.includes(lessonNameOfGrade(g.lessonId)))
      ) || null
    );
  };

  // Trừ 1 câu khỏi tổ hợp gap sau khi tạo bù thành công
  const consumeGap = (key: string) => {
    setGapList(prev => prev
      .map(g => (gapKeyOf(g) === key ? { ...g, missing: g.missing - 1 } : g))
      .filter(g => g.missing > 0));
  };

  // Thêm câu AI vừa sinh vào danh sách hiển thị (đã lưu ngân hàng ở route)
  const addSavedQuestion = (q: Question, gapKey: string | null) => {
    setList(prev => [q, ...prev]);
    markSaved(q.id);
    if (gapKey) consumeGap(gapKey);
    onChanged();
  };

  // Tạo bằng AI đúng tổ hợp bài×dạng×mức còn thiếu. Route /api/ai/generate-one
  // tự lưu vào ngân hàng sau khi vượt kiểm tra trùng kiến thức.
  const handleAIGenerateForGap = async (gap: MatrixGap, errText?: string) => {
    const key = gapKeyOf(gap);
    setCreatingGap(errText ? errText : key);
    try {
      const res = await fetch('/api/ai/generate-one', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade, lessonId: gap.lessonId, type: gap.type, level: gap.level })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi gọi AI');
      addSavedQuestion(data.question as Question, key);
      if (errText) setErrorList(prev => prev.filter(e => e !== errText));
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setCreatingGap(null);
    }
  };

  // Soạn thủ công đúng tổ hợp còn thiếu — mở khung soạn với khung câu trống
  const startManualForGap = (gap: MatrixGap, errText?: string) => {
    setManualGapKey(gapKeyOf(gap));
    setManualErrText(errText || null);
    setManualDraft({
      id: '',
      grade,
      subject: 'Tin học',
      topicId: '',
      lessonId: gap.lessonId,
      type: gap.type,
      level: gap.level,
      yccd: 'NLa',
      yccdContent: '',
      q: '',
      points: gap.type === 'MCQ' ? 0.25 : gap.type === 'TF' ? 1.0 : gap.type === 'SA' ? 0.25 : 1.0
    });
  };

  const updateManualDraft = (patch: Partial<Question>) => {
    setManualDraft(d => (d ? { ...d, ...patch } : d));
  };

  const handleSaveManual = async () => {
    if (!manualDraft) return;
    if (!manualDraft.q || !manualDraft.q.trim()) {
      alert('Nội dung câu hỏi không được để trống.');
      return;
    }
    setManualSaving(true);
    try {
      const saved = await saveToBank(manualDraft);
      setList(prev => [saved, ...prev]);
      markSaved(saved.id);
      if (manualGapKey) consumeGap(manualGapKey);
      if (manualErrText) setErrorList(prev => prev.filter(e => e !== manualErrText));
      setManualDraft(null);
      setManualGapKey(null);
      setManualErrText(null);
      onChanged();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setManualSaving(false);
    }
  };

  const startEdit = (q: Question) => {
    setEditingId(q.id);
    setDraft(JSON.parse(JSON.stringify(q))); // bản sao sâu — sửa không ảnh hưởng danh sách tới khi lưu
  };

  const updateDraft = (patch: Partial<Question>) => {
    setDraft(d => (d ? { ...d, ...patch } : d));
  };

  // Lưu 1 câu vào ngân hàng câu hỏi (POST /api/questions là upsert theo id nên
  // lưu lại câu đã có cũng vô hại)
  const saveToBank = async (q: Question): Promise<Question> => {
    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(q)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi khi lưu câu hỏi');
    return (data.question || q) as Question;
  };

  const markSaved = (id: string) => {
    setSavedIds(prev => new Set(prev).add(id));
  };

  const handleAddToBank = async (q: Question) => {
    setBusyId(q.id);
    try {
      await saveToBank(q);
      markSaved(q.id);
      onChanged();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  // Lưu tất cả các câu chưa nằm trong ngân hàng (lần lượt từng câu để tránh
  // ghi đè file kho khi chạy song song)
  const unsavedCount = list.filter(q => !savedIds.has(q.id)).length;

  const handleAddAllToBank = async () => {
    if (unsavedCount === 0) return;
    setSavingAll(true);
    let saved = 0;
    const failed: string[] = [];
    for (const q of list) {
      if (savedIds.has(q.id)) continue;
      try {
        await saveToBank(q);
        saved += 1;
      } catch {
        failed.push(q.q.slice(0, 80) + '…');
      }
    }
    setSavedIds(prev => {
      const next = new Set(prev);
      for (const q of list) next.add(q.id);
      return next;
    });
    setSavingAll(false);
    if (saved > 0) onChanged();
    if (failed.length > 0) {
      alert(`Đã lưu ${saved} câu. Không lưu được ${failed.length} câu:\n- ${failed.join('\n- ')}`);
    }
  };

  const handleSaveEdit = async () => {
    if (!draft) return;
    if (!draft.q || !draft.q.trim()) {
      alert('Nội dung câu hỏi không được để trống.');
      return;
    }
    setSaving(true);
    try {
      const saved = await saveToBank(draft);
      setList(prev => prev.map(q => (q.id === saved.id ? saved : q)));
      markSaved(saved.id);
      setEditingId(null);
      setDraft(null);
      onChanged();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (q: Question) => {
    if (!confirm('Xóa câu hỏi này khỏi danh sách?\n\n' + q.q.slice(0, 120) + '…')) return;
    setBusyId(q.id);
    setDeletingId(q.id);
    try {
      // Câu chưa lưu vào ngân hàng thì chỉ cần gỡ khỏi danh sách hiển thị
      if (savedIds.has(q.id)) {
        const res = await fetch(`/api/questions?id=${encodeURIComponent(q.id)}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Lỗi khi xóa câu hỏi');
        onChanged();
      }
      setList(prev => prev.filter(item => item.id !== q.id));
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusyId(null);
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
              Câu hỏi AI vừa sinh bổ sung cho ma trận
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              {list.length > 0 ? (
                <>Đã sinh <b className="text-emerald-700">{list.length} câu mới</b> (chưa lưu vào ngân hàng). Kiểm tra nội dung rồi bấm <b>Thêm vào ngân hàng</b> để lưu, <b>Sửa</b> để chỉnh hoặc <b>Xóa</b> để loại bỏ.</>
              ) : (
                <>Không sinh được câu hỏi nào trong lượt này.</>
              )}
              {remaining > 0 && (
                <> · Còn thiếu <b className="text-amber-700">{remaining} câu</b> so với ma trận (bấm "Tiếp Tục" ở Bước 2 để sinh tiếp).</>
              )}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Danh sách lỗi (nếu có) — mỗi lỗi gắn nút tạo bù đúng bài/dạng/mức */}
        {errorList.length > 0 && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
            <div className="font-bold flex items-center mb-1">
              <AlertTriangle className="w-4 h-4 mr-1.5 text-amber-600" />
              Một số câu không sinh được ({errorList.length}):
            </div>
            <ul className="space-y-2 max-h-40 overflow-y-auto">
              {errorList.map((e, i) => {
                const gap = gapOfError(e);
                return (
                  <li key={i} className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="flex-1 min-w-[200px]">• {e}</span>
                    {gap && (
                      <span className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleAIGenerateForGap(gap, e)}
                          disabled={creatingGap === e || Boolean(manualDraft)}
                          className="inline-flex items-center px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white rounded-lg text-[11px] font-semibold shadow-xs transition"
                          title="AI sinh 1 câu đúng bài/dạng/mức này (tự kiểm tra trùng và tự lưu vào ngân hàng)"
                        >
                          {creatingGap === e
                            ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                            : <Sparkles className="w-3.5 h-3.5 mr-1" />}
                          Thêm Bằng AI
                        </button>
                        <button
                          onClick={() => startManualForGap(gap, e)}
                          disabled={Boolean(manualDraft)}
                          className="inline-flex items-center px-3 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-[11px] font-semibold shadow-xs transition"
                          title="Tự soạn câu đúng bài/dạng/mức này rồi lưu vào ngân hàng"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Thêm Thủ Công
                        </button>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Khung soạn thủ công đúng tổ hợp còn thiếu */}
        {manualDraft && (
          <div className="mx-6 mt-4">
            <DraftEditor
              draft={manualDraft}
              onChange={updateManualDraft}
              onSave={handleSaveManual}
              saving={manualSaving}
              title={`Soạn thủ công — ${lessonNameOfGrade(manualDraft.lessonId)} (${TYPE_LABELS[manualDraft.type]} / ${LEVEL_LABELS[manualDraft.level]})`}
              saveLabel="Lưu Vào Ngân Hàng"
            />
          </div>
        )}

        {/* Các tổ hợp còn thiếu theo ma trận — tạo bù từng câu */}
        {gapList.length > 0 && (
          <div className="mx-6 mt-4 p-3 bg-sky-50 border border-sky-200 rounded-lg text-xs text-sky-900">
            <div className="font-bold flex items-center mb-2">
              <FileQuestion className="w-4 h-4 mr-1.5 text-sky-600" />
              Còn thiếu {gapList.reduce((s, g) => s + g.missing, 0)} câu theo ma trận — tạo bù từng câu ngay tại đây:
            </div>
            <ul className="space-y-1.5">
              {gapList.map(g => {
                const key = gapKeyOf(g);
                return (
                  <li key={key} className="flex items-center justify-between gap-2 flex-wrap">
                    <span>
                      <b>{lessonNameOfGrade(g.lessonId)}</b>
                      {' — '}{TYPE_LABELS[g.type] || g.type}/{LEVEL_LABELS[g.level]} — còn <b>{g.missing}</b> câu
                    </span>
                    <span className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAIGenerateForGap(g)}
                        disabled={creatingGap === key || Boolean(manualDraft)}
                        className="inline-flex items-center px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white rounded-lg text-[11px] font-semibold shadow-xs transition"
                        title="AI sinh 1 câu đúng bài/dạng/mức này (tự kiểm tra trùng và tự lưu vào ngân hàng)"
                      >
                        {creatingGap === key
                          ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                          : <Sparkles className="w-3.5 h-3.5 mr-1" />}
                        Thêm Bằng AI
                      </button>
                      <button
                        onClick={() => startManualForGap(g)}
                        disabled={Boolean(manualDraft)}
                        className="inline-flex items-center px-3 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-[11px] font-semibold shadow-xs transition"
                        title="Tự soạn câu đúng bài/dạng/mức này rồi lưu vào ngân hàng"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Thêm Thủ Công
                      </button>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Danh sách câu hỏi */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {list.length === 0 && errorList.length === 0 && (
            <div className="text-center py-10 text-sm text-slate-500 flex flex-col items-center">
              <FileQuestion className="w-10 h-10 text-slate-300 mb-2" />
              Ma trận đã đủ câu hỏi — không cần sinh bổ sung.
            </div>
          )}

          {list.map((q, idx) => (
            <div key={q.id} className="border border-slate-200 rounded-xl overflow-hidden">
              {editingId === q.id && draft ? (
                <DraftEditor
                  draft={draft}
                  onChange={updateDraft}
                  onSave={handleSaveEdit}
                  saving={saving}
                  title={`Chỉnh sửa câu ${idx + 1}`}
                  saveLabel="Lưu Thay Đổi"
                />
              ) : (
                <>
                  {/* Dòng tiêu đề card: badges + nút hành động */}
                  <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
                    <div className="flex items-center flex-wrap gap-1.5 text-[10px]">
                      <span className="font-mono text-slate-400">#{idx + 1}</span>
                      <span className="font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800">{TYPE_LABELS[q.type] || q.type}</span>
                      <span className="font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">{LEVEL_LABELS[q.level] || q.level}</span>
                      <span className="font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">{q.yccd}</span>
                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 font-medium truncate max-w-[260px]" title={lessonNameOf(q)}>
                        {lessonNameOf(q)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {savedIds.has(q.id) ? (
                        <span
                          className="inline-flex items-center px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 rounded-lg"
                          title="Câu này đã nằm trong ngân hàng câu hỏi"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Đã lưu
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAddToBank(q)}
                          disabled={busyId === q.id}
                          className="inline-flex items-center px-2.5 py-1.5 text-[11px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 disabled:bg-slate-100 disabled:text-slate-400 rounded-lg transition"
                          title="Lưu câu hỏi này vào ngân hàng câu hỏi"
                        >
                          {busyId === q.id ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                          ) : (
                            <Plus className="w-3.5 h-3.5 mr-1" />
                          )}
                          Thêm vào ngân hàng
                        </button>
                      )}
                      <button
                        onClick={() => startEdit(q)}
                        className="inline-flex items-center px-2.5 py-1.5 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition"
                        title="Sửa câu hỏi này"
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1" />
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(q)}
                        disabled={busyId === q.id}
                        className="inline-flex items-center px-2.5 py-1.5 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 disabled:bg-slate-100 disabled:text-slate-400 rounded-lg transition"
                        title="Xóa khỏi ngân hàng câu hỏi"
                      >
                        {busyId === q.id ? (
                          <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                        )}
                        Xóa
                      </button>
                    </div>
                  </div>

                  {/* Nội dung đầy đủ */}
                  <div className="p-4 text-xs space-y-2.5">
                    {q.yccdContent && (
                      <p className="text-slate-500 italic leading-relaxed">
                        <span className="font-bold not-italic text-slate-600">YCCĐ: </span>{q.yccdContent}
                      </p>
                    )}

                    <div className="text-slate-900">
                      <KatexRenderer content={q.q} />
                    </div>

                    {q.type === 'MCQ' && q.a && (
                      <ul className="space-y-1.5 mt-2">
                        {q.a.map((opt, i) => (
                          <li key={i} className={`flex items-start space-x-2 px-2.5 py-1.5 rounded-md ${
                            q.correct === i ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50'
                          }`}>
                            <span className={`font-bold ${q.correct === i ? 'text-emerald-700' : 'text-slate-500'}`}>{letters[i]}.</span>
                            <span className="flex-1"><KatexRenderer content={opt} /></span>
                            {q.correct === i && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                          </li>
                        ))}
                      </ul>
                    )}

                    {q.type === 'TF' && q.items && (
                      <ul className="space-y-1.5 mt-2">
                        {q.items.map((it, i) => (
                          <li key={i} className={`flex items-start space-x-2 px-2.5 py-1.5 rounded-md ${
                            it.isTrue ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'
                          }`}>
                            <span className="font-bold text-slate-600">{subLetters[i]})</span>
                            <span className="flex-1"><KatexRenderer content={it.text} /></span>
                            {it.isTrue
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" aria-label="ĐÚNG" />
                              : <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0" aria-label="SAI" />}
                          </li>
                        ))}
                      </ul>
                    )}

                    {q.type === 'SA' && q.correctSA && (
                      <p className="mt-2 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-md">
                        <span className="font-bold text-emerald-800">Đáp án: </span>
                        <span className="font-mono font-bold text-emerald-900">{q.correctSA}</span>
                      </p>
                    )}

                    {q.type === 'TL' && q.essayAnswer && (
                      <div className="mt-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-md">
                        <p className="font-bold text-emerald-800 mb-1">Đáp án chi tiết:</p>
                        <KatexRenderer content={q.essayAnswer} className="text-slate-800" />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500">
            {unsavedCount > 0
              ? `Còn ${unsavedCount} câu chưa được lưu vào ngân hàng câu hỏi.`
              : 'Tất cả câu hỏi đã nằm trong ngân hàng câu hỏi.'}
          </span>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleAddAllToBank}
              disabled={unsavedCount === 0 || savingAll}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold rounded-lg shadow transition"
              title="Lưu tất cả câu hỏi chưa lưu vào ngân hàng câu hỏi"
            >
              {savingAll ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-1.5" />
              )}
              {savingAll ? 'Đang lưu...' : `Thêm vào ngân hàng câu hỏi (${unsavedCount})`}
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg shadow transition"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
