'use client';

import React, { useState } from 'react';
import { Question, LEVEL_LABELS } from '@/lib/types';
import { CURRICULUM_DATA } from '@/lib/curriculumData';
import { KatexRenderer } from './KatexRenderer';
import { DraftEditor } from './DraftEditor';
import { X, Sparkles, Pencil, Trash2, Loader2, AlertTriangle, CheckCircle2, XCircle, FileQuestion } from 'lucide-react';

interface GeneratedQuestionsModalProps {
  isOpen: boolean;
  /** Câu hỏi AI vừa sinh trong lượt "Đảm bảo ma trận" */
  questions: Question[];
  /** Lỗi của những câu không sinh được (nếu có) */
  errors: string[];
  /** Số câu còn thiếu so với ma trận (chưa sinh xong) */
  remaining: number;
  onClose: () => void;
  /** Gọi khi câu hỏi được sửa/xóa thành công để trang chính làm mới dữ liệu */
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
  onClose,
  onChanged
}) => {
  const [list, setList] = useState<Question[]>(questions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Question | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Đồng bộ danh sách mới nhất từ trang mỗi lần mở modal
  React.useEffect(() => {
    if (isOpen) {
      setList(questions);
      setEditingId(null);
      setDraft(null);
    }
  }, [isOpen, questions]);

  if (!isOpen) return null;

  const lessonNameOf = (q: Question) =>
    (CURRICULUM_DATA[q.grade] || [])
      .flatMap(t => t.lessons)
      .find(l => l.id === q.lessonId)?.fullName || q.lessonId;

  const startEdit = (q: Question) => {
    setEditingId(q.id);
    setDraft(JSON.parse(JSON.stringify(q))); // bản sao sâu — sửa không ảnh hưởng danh sách tới khi lưu
  };

  const updateDraft = (patch: Partial<Question>) => {
    setDraft(d => (d ? { ...d, ...patch } : d));
  };

  const handleSaveEdit = async () => {
    if (!draft) return;
    if (!draft.q || !draft.q.trim()) {
      alert('Nội dung câu hỏi không được để trống.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi lưu câu hỏi');
      const saved = (data.question || draft) as Question;
      setList(prev => prev.map(q => (q.id === saved.id ? saved : q)));
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
    if (!confirm('Xóa câu hỏi này khỏi ngân hàng?\n\n' + q.q.slice(0, 120) + '…')) return;
    setBusyId(q.id);
    setDeletingId(q.id);
    try {
      const res = await fetch(`/api/questions?id=${encodeURIComponent(q.id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi xóa câu hỏi');
      setList(prev => prev.filter(item => item.id !== q.id));
      onChanged();
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
              Câu hỏi AI vừa sinh vào ngân hàng
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              {list.length > 0 ? (
                <>Đã sinh <b className="text-emerald-700">{list.length} câu mới</b>. Kiểm tra nội dung, bấm <b>Sửa</b> để chỉnh hoặc <b>Xóa</b> để loại khỏi ngân hàng.</>
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

        {/* Danh sách lỗi (nếu có) */}
        {errors.length > 0 && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
            <div className="font-bold flex items-center mb-1">
              <AlertTriangle className="w-4 h-4 mr-1.5 text-amber-600" />
              Một số câu không sinh được ({errors.length}):
            </div>
            <ul className="list-disc list-inside space-y-0.5 max-h-28 overflow-y-auto">
              {errors.slice(0, 8).map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        {/* Danh sách câu hỏi */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {list.length === 0 && errors.length === 0 && (
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
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Các thay đổi (sửa/xóa) được lưu thẳng vào ngân hàng câu hỏi.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg shadow transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
