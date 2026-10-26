'use client';

import React, { useState, useEffect } from 'react';
import { Question, Grade, QuestionType, Level, LEVELS, LEVEL_LABELS } from '@/lib/types';
import { CURRICULUM_DATA, Topic, Lesson } from '@/lib/curriculumData';
import { KatexRenderer } from './KatexRenderer';
import { DraftEditor } from './DraftEditor';
import { X, Search, Plus, Trash2, Pencil, Check, CheckCircle2, XCircle, Sparkles, Loader2, ArrowLeft, AlertTriangle } from 'lucide-react';

interface QuestionBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNew: () => void;
}



export const QuestionBankModal: React.FC<QuestionBankModalProps> = ({
  isOpen,
  onClose,
  onAddNew,
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  // Panel "Thêm Bằng AI"
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiGrade, setAiGrade] = useState<Grade>('10');
  const [aiTopicId, setAiTopicId] = useState('');
  const [aiLessonId, setAiLessonId] = useState('');
  const [aiType, setAiType] = useState<QuestionType>('MCQ');
  const [aiLevel, setAiLevel] = useState<Level>('biet');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiElapsed, setAiElapsed] = useState(0);
  const [aiMsg, setAiMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [aiDraft, setAiDraft] = useState<Question | null>(null);
  const [aiSaving, setAiSaving] = useState(false);

  // Chỉnh sửa câu hỏi có sẵn trong danh sách
  const [editingDraft, setEditingDraft] = useState<Question | null>(null);
  const [editingSaving, setEditingSaving] = useState(false);

  // Đồng hồ đếm thời gian chờ AI (model Google có thể quá tải)
  useEffect(() => {
    if (!aiLoading) { setAiElapsed(0); return; }
    const t = setInterval(() => setAiElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [aiLoading]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/questions');
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchQuestions();
    }
  }, [isOpen]);

  // ====== Panel "Thêm Bằng AI" ======
  const aiTopics: Topic[] = CURRICULUM_DATA[aiGrade] || [];
  const aiTopic = aiTopics.find(t => t.id === aiTopicId) || aiTopics[0];
  const aiLessons: Lesson[] = aiTopic?.lessons || [];

  const openAIPanel = () => {
    // Mặc định lấy theo bộ lọc đang chọn trong danh sách (nếu có)
    const g: Grade = (gradeFilter === '10' || gradeFilter === '11' || gradeFilter === '12') ? gradeFilter : '10';
    setAiGrade(g);
    const topics = CURRICULUM_DATA[g] || [];
    setAiTopicId(topics[0]?.id || '');
    setAiLessonId(topics[0]?.lessons[0]?.id || '');
    setAiType(typeFilter !== 'all' ? (typeFilter as QuestionType) : 'MCQ');
    setAiLevel(levelFilter !== 'all' ? (levelFilter as Level) : 'biet');
    setAiMsg(null);
    setAiDraft(null);
    setShowAIPanel(true);
  };

  const handleAIGenerate = async () => {
    if (!aiLessonId) {
      setAiMsg({ ok: false, text: 'Vui lòng chọn bài học.' });
      return;
    }
    setAiLoading(true);
    setAiMsg(null);
    try {
      const res = await fetch('/api/ai/generate-one', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: aiGrade,
          lessonId: aiLessonId,
          type: aiType,
          level: aiLevel
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi gọi AI');
      setAiMsg({ ok: true, text: 'Đã tạo xong câu hỏi mới! Kiểm tra, chỉnh sửa (nếu cần) rồi bấm Lưu Thay Đổi bên dưới.' });
      setAiDraft(data.question as Question);
      // Làm mới danh sách và lọc sẵn về câu vừa sinh
      await fetchQuestions();
      setGradeFilter(aiGrade);
      setTypeFilter(aiType);
      setLevelFilter(aiLevel);
      setSearch('');
    } catch (err) {
      setAiMsg({ ok: false, text: (err as Error).message });
    } finally {
      setAiLoading(false);
    }
  };

  const updateDraft = (patch: Partial<Question>) => {
    setAiDraft(d => (d ? { ...d, ...patch } : d));
  };

  const startEdit = (q: Question) => {
    // Bản sao sâu để sửa không ảnh hưởng danh sách đến khi lưu
    setEditingDraft(JSON.parse(JSON.stringify(q)));
    setAiMsg(null);
  };

  const updateEditingDraft = (patch: Partial<Question>) => {
    setEditingDraft(d => (d ? { ...d, ...patch } : d));
  };

  const handleSaveEdit = async () => {
    if (!editingDraft) return;
    if (!editingDraft.q || !editingDraft.q.trim()) {
      setAiMsg({ ok: false, text: 'Nội dung câu hỏi không được để trống.' });
      return;
    }
    setEditingSaving(true);
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingDraft)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi lưu câu hỏi');
      await fetchQuestions();
      setEditingDraft(null);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setEditingSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!aiDraft) return;
    if (!aiDraft.q || !aiDraft.q.trim()) {
      setAiMsg({ ok: false, text: 'Nội dung câu hỏi không được để trống.' });
      return;
    }
    setAiSaving(true);
    setAiMsg(null);
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiDraft)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi lưu câu hỏi');
      await fetchQuestions();
      // Lưu xong: quay về danh sách ngân hàng câu hỏi (đã lọc sẵn về câu vừa tạo)
      setAiDraft(null);
      setAiMsg(null);
      setShowAIPanel(false);
    } catch (err) {
      setAiMsg({ ok: false, text: (err as Error).message });
    } finally {
      setAiSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa câu hỏi này khỏi ngân hàng?')) return;
    try {
      const res = await fetch(`/api/questions?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setQuestions(questions.filter(q => q.id !== id));
      }
    } catch (err) {
      alert((err as Error).message);
    }
  };

  if (!isOpen) return null;

  // ====== Thống kê số câu theo khối / dạng / bài ======
  const gradeCounts: Record<string, number> = { '10': 0, '11': 0, '12': 0 };
  const gradeTypeCounts: Record<string, Record<QuestionType, number>> = {
    '10': { MCQ: 0, TF: 0, SA: 0, TL: 0 },
    '11': { MCQ: 0, TF: 0, SA: 0, TL: 0 },
    '12': { MCQ: 0, TF: 0, SA: 0, TL: 0 }
  };
  for (const q of questions) {
    if (q.grade in gradeCounts) {
      gradeCounts[q.grade] += 1;
      gradeTypeCounts[q.grade][q.type] += 1;
    }
  }
  const aiLessonCount = questions.filter(q => q.lessonId === aiLessonId).length;

  const filtered = questions.filter(q => {
    if (gradeFilter !== 'all' && q.grade !== gradeFilter) return false;
    if (typeFilter !== 'all' && q.type !== typeFilter) return false;
    if (levelFilter !== 'all' && q.level !== levelFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      const matchQ = q.q.toLowerCase().includes(s);
      const matchYccd = q.yccdContent && q.yccdContent.toLowerCase().includes(s);
      return matchQ || matchYccd;
    }
    return true;
  });

  const letters = ['A', 'B', 'C', 'D'];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <span>Ngân Hàng Câu Hỏi (Q-Bank)</span>
              <span className="text-xs bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-bold">
                {questions.length} câu trong kho
              </span>
            </h3>
            <p className="text-xs text-slate-500">Quản lý và tra cứu câu hỏi chuẩn 4 dạng MCQ, TF, SA, TL</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={openAIPanel}
              className="inline-flex items-center px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
              title="AI soạn ngẫu nhiên 1 câu hỏi mới bám sát SGK KNTT"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Thêm Bằng AI
            </button>
            <button
              onClick={onAddNew}
              className="inline-flex items-center px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Thêm Thủ Công
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {showAIPanel ? (
          /* ============ PANEL THÊM BẰNG AI ============ */
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
            <button
              onClick={() => { setShowAIPanel(false); setAiMsg(null); }}
              className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 mb-4"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Quay lại danh sách
            </button>

            <div className="bg-white rounded-xl border border-slate-200 p-5 max-w-2xl mx-auto shadow-sm">
              <div className="flex items-center space-x-2 mb-1">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h4 className="text-sm font-bold text-slate-900">Thêm Bằng AI — Sinh 1 Câu Hỏi Mới</h4>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                AI soạn ngẫu nhiên đúng 1 câu hỏi theo chọn lựa của bạn: bám sát <b>Yêu cầu cần đạt</b> và kiến thức
                <b> SGK Tin học Kết nối tri thức (ICT)</b> tương ứng khối lớp, gắn <b>mã năng lực</b> (NLa–NLe) hợp lý,
                đồng thời tham khảo phong cách các câu mẫu cùng dạng đang có trong kho.
              </p>

              {/* Số lượng câu hỏi theo khối lớp được chọn */}
              <div className="mb-4 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-bold text-slate-800">Khối {aiGrade}: {gradeCounts[aiGrade]} câu trong kho</span>
                <span className="text-slate-300">|</span>
                <span>MCQ: <b>{gradeTypeCounts[aiGrade].MCQ}</b></span>
                <span>Đúng/Sai: <b>{gradeTypeCounts[aiGrade].TF}</b></span>
                <span>Trả lời ngắn: <b>{gradeTypeCounts[aiGrade].SA}</b></span>
                <span>Tự luận: <b>{gradeTypeCounts[aiGrade].TL}</b></span>
                <span className="text-slate-300">|</span>
                <span className="text-purple-700">Bài học đã chọn: <b>{aiLessonCount}</b> câu mẫu tham khảo</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Khối lớp:</label>
                  <select
                    value={aiGrade}
                    onChange={(e) => {
                      const g = e.target.value as Grade;
                      setAiGrade(g);
                      const topics = CURRICULUM_DATA[g] || [];
                      setAiTopicId(topics[0]?.id || '');
                      setAiLessonId(topics[0]?.lessons[0]?.id || '');
                    }}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-md bg-white"
                  >
                    <option value="10">Lớp 10 ({gradeCounts['10']} câu)</option>
                    <option value="11">Lớp 11 ({gradeCounts['11']} câu)</option>
                    <option value="12">Lớp 12 ({gradeCounts['12']} câu)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chủ đề:</label>
                  <select
                    value={aiTopic?.id || ''}
                    onChange={(e) => {
                      setAiTopicId(e.target.value);
                      const t = aiTopics.find(x => x.id === e.target.value);
                      setAiLessonId(t?.lessons[0]?.id || '');
                    }}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-md bg-white"
                  >
                    {aiTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Bài học:</label>
                  <select
                    value={aiLessonId}
                    onChange={(e) => setAiLessonId(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-md bg-white"
                  >
                    {aiLessons.map(l => <option key={l.id} value={l.id}>{l.fullName}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dạng câu hỏi:</label>
                  <select
                    value={aiType}
                    onChange={(e) => setAiType(e.target.value as QuestionType)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-md bg-white"
                  >
                    <option value="MCQ">Trắc nghiệm (MCQ)</option>
                    <option value="TF">Đúng / Sai (TF)</option>
                    <option value="SA">Trả lời ngắn (SA)</option>
                    <option value="TL">Tự luận (TL)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mức độ:</label>
                  <select
                    value={aiLevel}
                    onChange={(e) => setAiLevel(e.target.value as Level)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-md bg-white"
                  >
                    {LEVELS.map(lv => (
                      <option key={lv} value={lv}>
                        {LEVEL_LABELS[lv]}{lv === 'biet' ? ' (Nhận biết)' : lv === 'hieu' ? ' (Thông hiểu)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {aiMsg && (
                <div className={`mt-4 p-3 rounded-lg border text-xs flex items-start space-x-2 ${
                  aiMsg.ok
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  {aiMsg.ok
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    : <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />}
                  <span className="leading-relaxed">{aiMsg.text}</span>
                </div>
              )}

              <button
                onClick={handleAIGenerate}
                disabled={aiLoading}
                className="w-full mt-4 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white font-bold rounded-lg shadow transition flex items-center justify-center space-x-2"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      AI đang soạn câu hỏi (bám SGK KNTT)... {aiElapsed}s
                      {aiElapsed >= 60 && ' — Google đang quá tải, hệ thống đang tự thử lại, vui lòng đợi'}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Tạo Câu Hỏi Ngay</span>
                  </>
                )}
              </button>

              {aiDraft && (
                <div className="mt-5">
                  <DraftEditor
                    draft={aiDraft}
                    onChange={updateDraft}
                    onSave={handleSaveDraft}
                    saving={aiSaving}
                    title="Câu hỏi vừa tạo — kiểm tra & chỉnh sửa"
                    saveLabel="Lưu Thay Đổi Vào Kho"
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
        {/* Filter bar */}
        <div className="p-4 border-b border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="relative sm:col-span-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Tìm kiếm nội dung..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="border border-slate-300 rounded-md px-2 py-1.5 focus:ring-1 focus:ring-sky-500 bg-white"
          >
            <option value="all">Tất cả Khối Lớp ({questions.length} câu)</option>
            <option value="10">Lớp 10 ({gradeCounts['10']} câu)</option>
            <option value="11">Lớp 11 ({gradeCounts['11']} câu)</option>
            <option value="12">Lớp 12 ({gradeCounts['12']} câu)</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-slate-300 rounded-md px-2 py-1.5 focus:ring-1 focus:ring-sky-500 bg-white"
          >
            <option value="all">Tất cả Dạng câu hỏi</option>
            <option value="MCQ">Trắc nghiệm (MCQ)</option>
            <option value="TF">Đúng / Sai (TF)</option>
            <option value="SA">Trả lời ngắn (SA)</option>
            <option value="TL">Tự luận (TL)</option>
          </select>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="border border-slate-300 rounded-md px-2 py-1.5 focus:ring-1 focus:ring-sky-500 bg-white"
          >
            <option value="all">Tất cả Mức độ</option>
            <option value="biet">Biết (Nhận biết)</option>
            <option value="hieu">Hiểu (Thông hiểu)</option>
            <option value="vandung">Vận dụng</option>
            <option value="vandungcao">Vận dụng cao</option>
          </select>
        </div>

        {/* Question List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
          {editingDraft ? (
            <div className="max-w-3xl mx-auto">
              <button
                onClick={() => setEditingDraft(null)}
                className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 mb-3"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Quay lại danh sách (không lưu)
              </button>
              <DraftEditor
                draft={editingDraft}
                onChange={updateEditingDraft}
                onSave={handleSaveEdit}
                saving={editingSaving}
                title="Chỉnh sửa câu hỏi trong kho"
                saveLabel="Lưu Cập Nhật"
              />
            </div>
          ) : (
          loading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Đang tải câu hỏi...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">Không tìm thấy câu hỏi phù hợp.</div>
          ) : (
            filtered.map((q, idx) => (
              <div
                key={q.id || idx}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-sm transition"
              >
                {/* Meta Badges */}
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded">
                      Lớp {q.grade}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        q.type === 'MCQ'
                          ? 'bg-sky-100 text-sky-800'
                          : q.type === 'TF'
                          ? 'bg-emerald-100 text-emerald-800'
                          : q.type === 'SA'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {q.type}
                    </span>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                        q.level === 'biet'
                          ? 'bg-blue-50 text-blue-700'
                          : q.level === 'hieu'
                          ? 'bg-indigo-50 text-indigo-700'
                          : q.level === 'vandungcao'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-orange-50 text-orange-700'
                      }`}
                    >
                      {q.level === 'biet' ? 'Biết' : q.level === 'hieu' ? 'Hiểu' : q.level === 'vandungcao' ? 'Vận dụng cao' : 'Vận dụng'}
                    </span>
                    {q.yccd && (
                      <span className="bg-slate-100 text-slate-600 font-mono text-[11px] px-2 py-0.5 rounded">
                        {q.yccd}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => startEdit(q)}
                      className="text-slate-400 hover:text-sky-600 p-1 rounded hover:bg-sky-50 transition"
                      title="Chỉnh sửa câu hỏi này"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition"
                      title="Xóa câu hỏi này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* YCCĐ Description */}
                {q.yccdContent && (
                  <div className="text-[11px] text-slate-500 italic mb-2">
                    YCCĐ: {q.yccdContent}
                  </div>
                )}

                {/* Question Stem */}
                <div className="text-sm font-semibold text-slate-900 mb-2">
                  <KatexRenderer content={q.q} />
                </div>

                {/* Options / Items */}
                {q.type === 'MCQ' && q.a && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 ml-2 mt-2">
                    {q.a.map((opt, oIdx) => {
                      const isCorrect = oIdx === q.correct;
                      return (
                        <div
                          key={oIdx}
                          className={`text-xs px-2.5 py-1.5 rounded flex items-start space-x-1.5 ${
                            isCorrect
                              ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200'
                              : 'bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span className="font-bold flex-shrink-0">{letters[oIdx]}.</span>
                          <KatexRenderer content={opt} />
                          {isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-auto flex-shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.type === 'TF' && q.items && (
                  <div className="space-y-1 ml-2 mt-2">
                    {q.items.map((sub, sIdx) => {
                      const subLetters = ['a', 'b', 'c', 'd'];
                      return (
                        <div
                          key={sIdx}
                          className={`text-xs px-2.5 py-1 rounded flex items-center justify-between ${
                            sub.isTrue
                              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/60'
                              : 'bg-rose-50 text-rose-900 border border-rose-200/60'
                          }`}
                        >
                          <div className="flex items-start space-x-1.5">
                            <span className="font-bold">{subLetters[sIdx]})</span>
                            <KatexRenderer content={sub.text} />
                          </div>
                          <span className="font-bold font-mono ml-2">
                            {sub.isTrue ? 'ĐÚNG' : 'SAI'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.type === 'TL' && q.essayAnswer && (
                  <div className="mt-2 bg-purple-50/70 border border-purple-200 rounded p-2.5 text-xs text-purple-950">
                    <div className="font-bold text-purple-900 mb-1">Đáp án hướng dẫn:</div>
                    <KatexRenderer content={q.essayAnswer} />
                  </div>
                )}
              </div>
            ))
          ))}
        </div>
          </>
        )}
      </div>
    </div>
  );
};
