'use client';

import React, { useState, useEffect } from 'react';
import { Question } from '@/lib/types';
import { KatexRenderer } from './KatexRenderer';
import { X, Check, Search, CheckCircle2 } from 'lucide-react';

interface SwapQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string;
  lessonName: string;
  onSelectQuestion: (question: Question) => void;
}

export const SwapQuestionModal: React.FC<SwapQuestionModalProps> = ({
  isOpen,
  onClose,
  lessonId,
  lessonName,
  onSelectQuestion
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen && lessonId) {
      setLoading(true);
      fetch(`/api/questions?lessonId=${lessonId}`)
        .then(res => res.json())
        .then(data => setQuestions(data.questions || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, lessonId]);

  if (!isOpen) return null;

  const filtered = questions.filter(q =>
    !search || q.q.toLowerCase().includes(search.toLowerCase()) || (q.yccdContent && q.yccdContent.toLowerCase().includes(search.toLowerCase()))
  );

  const letters = ['A', 'B', 'C', 'D'];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Chọn Câu Hỏi Thay Thế Cho {lessonName}
            </h3>
            <p className="text-xs text-slate-500">
              Chọn câu hỏi từ ngân hàng để thay thế vào bản đặc tả và đề kiểm tra
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 border-b border-slate-200 bg-white">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Lọc câu hỏi trong bài này..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {loading ? (
            <div className="text-center py-10 text-slate-400 text-xs">Đang tìm câu hỏi trong kho...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              Chưa có câu hỏi thay thế trong ngân hàng cho bài này. Bạn có thể dùng AI Soạn Thêm!
            </div>
          ) : (
            filtered.map((q, idx) => (
              <div
                key={q.id || idx}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-sky-400 transition"
              >
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="bg-sky-100 text-sky-800 text-[11px] font-bold px-2 py-0.5 rounded">
                      {q.type}
                    </span>
                    <span className="bg-slate-100 text-slate-700 text-[11px] font-medium px-2 py-0.5 rounded">
                      {q.level === 'biet' ? 'Biết' : q.level === 'hieu' ? 'Hiểu' : 'Vận dụng'}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">
                      {q.yccd}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      onSelectQuestion(q);
                      onClose();
                    }}
                    className="inline-flex items-center px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded text-xs font-bold transition shadow-2xs"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Chọn Câu Này
                  </button>
                </div>

                <div className="text-xs text-slate-500 italic mb-1.5">
                  YCCĐ: {q.yccdContent}
                </div>

                <div className="text-xs font-medium text-slate-900 mb-2">
                  <KatexRenderer content={q.q} />
                </div>

                {q.type === 'MCQ' && q.a && (
                  <div className="grid grid-cols-2 gap-1 ml-2">
                    {q.a.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className={`text-[11px] px-2 py-1 rounded flex items-center space-x-1 ${
                          oIdx === q.correct ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200' : 'bg-slate-50 text-slate-600'
                        }`}
                      >
                        <span className="font-bold">{letters[oIdx]}.</span>
                        <KatexRenderer content={opt} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
