'use client';

import React, { useState } from 'react';
import { FullExamPackage, ExamVariant } from '@/lib/types';
import { KatexRenderer } from './KatexRenderer';
import { ArrowLeft, ArrowRight, Shuffle, Eye, EyeOff, Layers } from 'lucide-react';

interface Step4ExamProps {
  examPackage: FullExamPackage;
  onNext: () => void;
  onBack: () => void;
  onReshuffle: () => void;
}

export const Step4Exam: React.FC<Step4ExamProps> = ({
  examPackage,
  onNext,
  onBack,
  onReshuffle
}) => {
  const [activeCode, setActiveCode] = useState(examPackage.variants[0]?.code || '001');
  const [isTeacherMode, setIsTeacherMode] = useState(true);

  const currentVariant = examPackage.variants.find(v => v.code === activeCode) || examPackage.variants[0];

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Step Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Bước 4: Đề Kiểm Tra & Trộn Mã Đề</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Hệ thống tự động xáo trộn câu hỏi và phương án A-D độc lập cho {examPackage.variants.length} mã đề
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <button
            onClick={() => setIsTeacherMode(!isTeacherMode)}
            className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg transition border ${
              isTeacherMode
                ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {isTeacherMode ? (
              <>
                <Eye className="w-3.5 h-3.5 mr-1 text-amber-600" />
                Chế độ Giáo Viên (Có dấu *)
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 mr-1 text-slate-500" />
                Chế độ Học Sinh (Ẩn đáp án)
              </>
            )}
          </button>

          <button
            onClick={onReshuffle}
            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition"
          >
            <Shuffle className="w-3.5 h-3.5 mr-1 text-sky-600" />
            Trộn Lại Mã Đề
          </button>

          <button
            onClick={onBack}
            className="inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Quay Lại
          </button>

          <button
            onClick={onNext}
            className="inline-flex items-center px-5 py-2 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition"
          >
            <span>Tiếp Tục: Đáp Án</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </button>
        </div>
      </div>

      {/* Variant Selector Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <div className="flex items-center text-xs font-bold text-slate-500 mr-2">
          <Layers className="w-3.5 h-3.5 mr-1" />
          Mã Đề:
        </div>
        {examPackage.variants.map((v) => (
          <button
            key={v.code}
            onClick={() => setActiveCode(v.code)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeCode === v.code
                ? 'bg-sky-600 text-white shadow'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Mã đề {v.code}
          </button>
        ))}
      </div>

      {/* Exam Paper View */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-8 sm:p-12 font-serif text-slate-900 leading-relaxed">
        {/* Header Block */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex justify-between items-start text-xs sm:text-sm font-bold tracking-tight">
            <div className="text-center">
              <div>{examPackage.department.toUpperCase()}</div>
              <div>{examPackage.school.toUpperCase()}</div>
            </div>
            <div className="text-center">
              <div className="text-base font-black">{examPackage.title.toUpperCase()}</div>
              <div>MÔN: {examPackage.subject.toUpperCase()} - LỚP: {examPackage.grade}</div>
              <div className="font-normal italic">Thời gian làm bài: {examPackage.durationMinutes} phút</div>
            </div>
            <div className="border-2 border-slate-900 px-3 py-1 font-mono text-center">
              <div className="text-[10px] uppercase font-sans">Mã đề thi</div>
              <div className="text-lg font-black">{currentVariant.code}</div>
            </div>
          </div>
        </div>

        {/* Part I: MCQ */}
        {currentVariant.mcq.length > 0 && (
          <div className="mb-8">
            <div className="font-bold text-sm sm:text-base mb-3 bg-slate-100 p-2 rounded">
              PHẦN I ({(currentVariant.mcq.length * 0.25).toFixed(2).replace(/\.00$/, "")} điểm). Câu trắc nghiệm nhiều phương án lựa chọn. Thí sinh trả lời từ câu 1 đến câu {currentVariant.mcq.length}. Mỗi câu hỏi thí sinh chỉ chọn một phương án.
            </div>

            <div className="space-y-4">
              {currentVariant.mcq.map((item, qIdx) => {
                const q = item.question;
                const options = item.shuffledOptions || (q.a ? q.a.map((t, idx) => ({ text: t, originalIndex: idx })) : []);
                const letters = ['A', 'B', 'C', 'D'];

                return (
                  <div key={item.question.id || qIdx} className="text-sm">
                    <div className="font-medium text-slate-900 mb-1 flex items-start">
                      <span className="font-bold mr-1.5 flex-shrink-0">Câu {qIdx + 1}:</span>
                      <KatexRenderer content={q.q} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 ml-5 mt-1">
                      {options.map((opt, oIdx) => {
                        const isCorrect = isTeacherMode && oIdx === item.shuffledCorrectIndex;
                        return (
                          <div
                            key={oIdx}
                            className={`flex items-start text-xs sm:text-sm rounded px-1.5 py-0.5 ${
                              isCorrect ? 'bg-amber-100/70 font-semibold text-amber-900' : 'text-slate-800'
                            }`}
                          >
                            <span className="font-bold mr-1 flex-shrink-0">
                              {isCorrect ? '*' : ''}{letters[oIdx]}.
                            </span>
                            <KatexRenderer content={opt.text} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Part II: TF */}
        {currentVariant.tf.length > 0 && (
          <div className="mb-8">
            <div className="font-bold text-sm sm:text-base mb-3 bg-slate-100 p-2 rounded">
              PHẦN II ({currentVariant.tf.length} điểm). Câu trắc nghiệm đúng sai. Thí sinh trả lời từ câu 1 đến câu {currentVariant.tf.length}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.
            </div>

            <div className="space-y-5">
              {currentVariant.tf.map((item, qIdx) => {
                const q = item.question;
                const items = q.items || [];
                const letters = ['a', 'b', 'c', 'd'];

                return (
                  <div key={item.question.id || qIdx} className="text-sm">
                    <div className="font-medium text-slate-900 mb-1.5 flex items-start">
                      <span className="font-bold mr-1.5 flex-shrink-0">Câu {qIdx + 1}:</span>
                      <KatexRenderer content={q.q} />
                    </div>

                    <div className="space-y-1 ml-5">
                      {items.map((sub, sIdx) => {
                        const isTrueMark = isTeacherMode && sub.isTrue;
                        return (
                          <div
                            key={sIdx}
                            className={`flex items-start text-xs sm:text-sm rounded px-1.5 py-0.5 ${
                              isTrueMark ? 'bg-amber-100/70 font-semibold text-amber-900' : 'text-slate-800'
                            }`}
                          >
                            <span className="font-bold mr-1 flex-shrink-0">
                              {isTrueMark ? '*' : ''}{letters[sIdx]})
                            </span>
                            <KatexRenderer content={sub.text} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Part III: TL */}
        {currentVariant.tl.length > 0 && (
          <div className="mb-4">
            <div className="font-bold text-sm sm:text-base mb-3 bg-slate-100 p-2 rounded">
              PHẦN III ({currentVariant.tl.length} điểm). Tự luận. Thí sinh trả lời từ câu 1 đến câu {currentVariant.tl.length}.
            </div>

            <div className="space-y-5">
              {currentVariant.tl.map((item, qIdx) => {
                const q = item.question;
                return (
                  <div key={item.question.id || qIdx} className="text-sm">
                    <div className="font-medium text-slate-900 mb-1 flex items-start">
                      <span className="font-bold mr-1.5 flex-shrink-0">Câu {qIdx + 1}:</span>
                      <KatexRenderer content={q.q} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="text-center font-bold text-xs uppercase tracking-widest mt-8 pt-4 border-t border-slate-300">
          --- HẾT ---
        </div>
      </div>
    </div>
  );
};
