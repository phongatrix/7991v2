'use client';

import React, { useState } from 'react';
import { FullExamPackage } from '@/lib/types';
import { KatexRenderer } from './KatexRenderer';
import { ArrowLeft, ArrowRight, Layers, CheckSquare } from 'lucide-react';

interface Step5AnswersProps {
  examPackage: FullExamPackage;
  onNext: () => void;
  onBack: () => void;
}

export const Step5Answers: React.FC<Step5AnswersProps> = ({
  examPackage,
  onNext,
  onBack
}) => {
  const [activeCode, setActiveCode] = useState(examPackage.variants[0]?.code || '001');
  const currentVariant = examPackage.variants.find(v => v.code === activeCode) || examPackage.variants[0];

  const letters = ['A', 'B', 'C', 'D'];

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Bước 5: Đáp Án & Hướng Dẫn Chấm</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Bảng đáp án trắc nghiệm, chuỗi Đúng/Sai và thang điểm chi tiết cho bài thi tự luận
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center space-x-3">
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
            <span>Tiếp Tục: Kết Quả Tổng Hợp</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </button>
        </div>
      </div>

      {/* Variant Selector Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <div className="flex items-center text-xs font-bold text-slate-500 mr-2">
          <Layers className="w-3.5 h-3.5 mr-1" />
          Đáp án mã đề:
        </div>
        {examPackage.variants.map((v) => (
          <button
            key={v.code}
            onClick={() => setActiveCode(v.code)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeCode === v.code
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Mã đề {v.code}
          </button>
        ))}
      </div>

      {/* Answer Key Document */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-8 sm:p-12 font-serif text-slate-900 leading-relaxed">
        <div className="text-center pb-4 mb-6 border-b border-slate-300">
          <h3 className="text-lg font-black uppercase tracking-wide">
            HƯỚNG DẪN CHẤM & BIỂU ĐIỂM
          </h3>
          <div className="text-xs italic text-slate-600">
            Môn: {examPackage.subject} {examPackage.grade} | Mã đề: {currentVariant.code}
          </div>
        </div>

        {/* 1. Phần I: Trắc nghiệm */}
        {currentVariant.mcq.length > 0 && (
          <div className="mb-8">
            <h4 className="font-bold text-sm mb-2 text-slate-900">
              1. Phần 1. Trắc nghiệm. Mỗi câu Phần 1 đúng được 0.25 điểm.
            </h4>
            <p className="text-xs italic text-slate-600 mb-2">Bảng đáp án Phần 1:</p>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-400 text-xs text-center">
                <thead>
                  <tr className="bg-slate-100 font-bold">
                    <td className="border border-slate-400 p-1.5 w-16">Câu</td>
                    {currentVariant.mcq.map((_, idx) => (
                      <td key={idx} className="border border-slate-400 p-1.5 font-bold">
                        {idx + 1}
                      </td>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="font-bold text-emerald-800 bg-emerald-50/50">
                    <td className="border border-slate-400 p-1.5 text-slate-800 font-bold">Đáp án</td>
                    {currentVariant.mcq.map((item, idx) => {
                      const ansLetter = letters[item.shuffledCorrectIndex ?? 0] || 'A';
                      return (
                        <td key={idx} className="border border-slate-400 p-1.5 text-base">
                          {ansLetter}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. Phần II: Đúng/Sai */}
        {currentVariant.tf.length > 0 && (
          <div className="mb-8">
            <h4 className="font-bold text-sm mb-2 text-slate-900">
              2. Phần 2 đúng trọn vẹn được 1 điểm (đúng 1 ý 0.1đ, 2 ý 0.25đ, 3 ý 0.5đ, 4 ý 1đ).
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
              {currentVariant.tf.map((item, idx) => {
                const items = item.question.items || [];
                const tfString = items.map(x => (x.isTrue ? 'Đ' : 'S')).join('');
                return (
                  <div key={idx} className="flex items-center space-x-2 text-sm">
                    <span className="font-bold text-slate-700">{idx + 1}.</span>
                    <span className="font-mono font-black text-emerald-700 tracking-wider text-base bg-white px-2 py-0.5 rounded border border-slate-200">
                      {tfString}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Phần III: Tự luận */}
        {currentVariant.tl.length > 0 && (
          <div className="mb-6">
            <h4 className="font-bold text-sm mb-3 text-slate-900">
              3. Phần 3. Tự luận
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-400 text-xs">
                <thead>
                  <tr className="bg-slate-100 font-bold text-center">
                    <th className="border border-slate-400 p-2 w-24">Phần / Câu</th>
                    <th className="border border-slate-400 p-2 text-left">Nội dung đáp án</th>
                    <th className="border border-slate-400 p-2 w-16">Điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {currentVariant.tl.map((item, idx) => (
                    <tr key={idx} className="align-top">
                      <td className="border border-slate-400 p-2 text-center font-bold text-slate-800">
                        Câu {idx + 1}
                      </td>
                      <td className="border border-slate-400 p-2.5 leading-relaxed">
                        <KatexRenderer content={item.question.essayAnswer || item.question.q} />
                      </td>
                      <td className="border border-slate-400 p-2 text-center font-bold text-slate-900">
                        {item.question.points || 1.0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
