'use client';

import React, { useState } from 'react';
import { Grade } from '@/lib/types';
import { CURRICULUM_DATA } from '@/lib/curriculumData';
import { X, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AIModal: React.FC<AIModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [grade, setGrade] = useState<Grade>('11');
  const topics = CURRICULUM_DATA[grade] || [];

  const [selectedTopicId, setSelectedTopicId] = useState(topics[0]?.id || '');
  const currentTopic = topics.find(t => t.id === selectedTopicId) || topics[0];
  const [selectedLessonId, setSelectedLessonId] = useState(currentTopic?.lessons[0]?.id || '');

  // Distribution
  const [mcqB, setMcqB] = useState(2);
  const [mcqH, setMcqH] = useState(2);
  const [mcqVD, setMcqVD] = useState(1);
  const [mcqVDC, setMcqVDC] = useState(1);
  const [tfCount, setTfCount] = useState(1);
  const [tlCount, setTlCount] = useState(1);

  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    const currentLesson = currentTopic?.lessons.find(l => l.id === selectedLessonId);
    if (!currentLesson || !currentTopic) {
      setErrorMessage("Vui lòng chọn bài học hợp lệ.");
      return;
    }

    setLoading(true);
    setResultMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade,
          subject: 'Tin học',
          topicName: currentTopic.name,
          lessonId: currentLesson.id,
          lessonName: currentLesson.fullName,
          lessonDescription: currentLesson.description,
          mcq_b: mcqB,
          mcq_h: mcqH,
          mcq_vd: mcqVD,
          mcq_vdc: mcqVDC,
          tf_count: tfCount,
          tf_b: 2,
          tf_h: 1,
          tf_vd: 1,
          sa_b: 0,
          sa_h: 0,
          sa_vd: 0,
          tl_b: 0,
          tl_h: tlCount > 0 ? 1 : 0,
          tl_vd: 0,
          autoSave: true
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi gọi AI');
      }

      setResultMessage(`Đã sinh thành công ${data.totalGenerated} câu hỏi bám chuẩn SGK và lưu vào kho!`);
      onSuccess();
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-purple-700 to-indigo-800 text-white">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <h3 className="text-base font-bold">AI Trợ Giảng Soạn Câu Hỏi</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Grade */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Khối Lớp:</label>
            <div className="grid grid-cols-3 gap-2">
              {(['10', '11', '12'] as Grade[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    setGrade(g);
                    const newTopics = CURRICULUM_DATA[g] || [];
                    setSelectedTopicId(newTopics[0]?.id || '');
                    setSelectedLessonId(newTopics[0]?.lessons[0]?.id || '');
                  }}
                  className={`py-2 rounded-lg font-bold border text-center transition ${
                    grade === g
                      ? 'bg-purple-50 text-purple-800 border-purple-500 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Lớp {g}
                </button>
              ))}
            </div>
          </div>

          {/* Topic */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Chủ đề:</label>
            <select
              value={selectedTopicId}
              onChange={(e) => {
                setSelectedTopicId(e.target.value);
                const t = topics.find(item => item.id === e.target.value);
                if (t && t.lessons.length > 0) {
                  setSelectedLessonId(t.lessons[0].id);
                }
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-purple-500"
            >
              {topics.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Lesson */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Bài học cần soạn:</label>
            <select
              value={selectedLessonId}
              onChange={(e) => setSelectedLessonId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-purple-500"
            >
              {currentTopic?.lessons.map((l) => (
                <option key={l.id} value={l.id}>{l.fullName}</option>
              ))}
            </select>
          </div>

          {/* Quantity Controls */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="font-bold text-slate-800">Số lượng câu cần sinh:</div>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block text-slate-600 mb-1">MCQ Biết:</label>
                <input
                  type="number" min="0" max="10"
                  value={mcqB} onChange={(e) => setMcqB(Number(e.target.value))}
                  className="w-full px-2 py-1 border rounded bg-white text-center font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">MCQ Hiểu:</label>
                <input
                  type="number" min="0" max="10"
                  value={mcqH} onChange={(e) => setMcqH(Number(e.target.value))}
                  className="w-full px-2 py-1 border rounded bg-white text-center font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">MCQ Vận dụng:</label>
                <input
                  type="number" min="0" max="10"
                  value={mcqVD} onChange={(e) => setMcqVD(Number(e.target.value))}
                  className="w-full px-2 py-1 border rounded bg-white text-center font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">MCQ VD cao:</label>
                <input
                  type="number" min="0" max="10"
                  value={mcqVDC} onChange={(e) => setMcqVDC(Number(e.target.value))}
                  className="w-full px-2 py-1 border rounded bg-white text-center font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-600 mb-1">Đúng/Sai (TF 4 ý):</label>
                <input
                  type="number" min="0" max="5"
                  value={tfCount} onChange={(e) => setTfCount(Number(e.target.value))}
                  className="w-full px-2 py-1 border rounded bg-white text-center font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Tự luận (TL):</label>
                <input
                  type="number" min="0" max="5"
                  value={tlCount} onChange={(e) => setTlCount(Number(e.target.value))}
                  className="w-full px-2 py-1 border rounded bg-white text-center font-bold"
                />
              </div>
            </div>
          </div>

          {/* Feedback messages */}
          {resultMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{resultMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
              {errorMessage}
            </div>
          )}

          {/* Action button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow transition flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AI đang phân tích SGK và soạn câu hỏi...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Bắt Đầu Soạn Câu Hỏi Tự Động</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
