'use client';

import React, { useState } from 'react';
import { ExamMatrix, ExamSpec, Question, Competency } from '@/lib/types';
import { formatSpecCellText } from '@/lib/specGenerator';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Shuffle } from 'lucide-react';

interface Step3SpecProps {
  matrix: ExamMatrix;
  spec: ExamSpec;
  setSpec: (s: ExamSpec) => void;
  onNext: () => void;
  onBack: () => void;
  onOpenSwapModal: (lessonId: string, lessonName: string) => void;
}

export const Step3Spec: React.FC<Step3SpecProps> = ({
  matrix,
  spec,
  setSpec,
  onNext,
  onBack,
  onOpenSwapModal
}) => {
  const [showCompetency, setShowCompetency] = useState(spec?.showCompetencyCodes ?? true);

  const toggleShowCompetency = () => {
    const nextVal = !showCompetency;
    setShowCompetency(nextVal);
    setSpec({
      ...spec,
      showCompetencyCodes: nextVal
    });
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Bước 3: Bản Đặc Tả Đề Kiểm Tra</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Bản mô tả Yêu cầu cần đạt (YCCĐ) chi tiết theo 4 mức độ (Biết · Hiểu · Vận dụng · Vận dụng cao) và mã năng lực (NLa - NLe) chuẩn Công văn 7991
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <button
            onClick={toggleShowCompetency}
            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
          >
            {showCompetency ? (
              <>
                <EyeOff className="w-3.5 h-3.5 mr-1 text-slate-500" />
                Ẩn Mã Năng Lực
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
                Hiện Mã Năng Lực
              </>
            )}
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
            <span>Tiếp Tục: Sinh Đề Thi</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </button>
        </div>
      </div>

      {/* Specification Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full border-collapse text-xs text-slate-800 font-sans">
          <thead>
            <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 text-center">
              <th rowSpan={2} className="border-r border-slate-300 px-2 py-2 w-10">TT</th>
              <th rowSpan={2} className="border-r border-slate-300 px-3 py-2 text-left w-36">Chủ đề/Chương</th>
              <th rowSpan={2} className="border-r border-slate-300 px-3 py-2 text-left w-44">Nội dung/Đơn vị kiến thức</th>
              <th rowSpan={2} className="border-r border-slate-300 px-4 py-2 text-left min-w-[280px]">Mức độ đánh giá (Mô tả YCCĐ)</th>
              <th colSpan={16} className="border-r border-slate-300 px-2 py-1 font-bold">Số câu hỏi theo mức độ nhận thức</th>
              <th rowSpan={2} className="px-2 py-2 w-20">Thao tác</th>
            </tr>
            <tr className="bg-slate-50 text-slate-600 border-b border-slate-300 text-center font-bold text-[11px]">
              {/* MCQ */}
              <th className="border-r border-slate-200 px-1 py-1 w-9 bg-sky-50/50">B</th>
              <th className="border-r border-slate-200 px-1 py-1 w-9 bg-sky-50/50">H</th>
              <th className="border-r border-slate-200 px-1 py-1 w-9 bg-sky-50/50">VD</th>
              <th className="border-r border-slate-300 px-1 py-1 w-10 bg-sky-50/50">VDC</th>
              {/* TF */}
              <th className="border-r border-slate-200 px-1 py-1 w-12 bg-emerald-50/50">B</th>
              <th className="border-r border-slate-200 px-1 py-1 w-10 bg-emerald-50/50">H</th>
              <th className="border-r border-slate-200 px-1 py-1 w-10 bg-emerald-50/50">VD</th>
              <th className="border-r border-slate-300 px-1 py-1 w-11 bg-emerald-50/50">VDC</th>
              {/* SA */}
              <th className="border-r border-slate-200 px-1 py-1 w-8 bg-amber-50/50">B</th>
              <th className="border-r border-slate-200 px-1 py-1 w-8 bg-amber-50/50">H</th>
              <th className="border-r border-slate-200 px-1 py-1 w-8 bg-amber-50/50">VD</th>
              <th className="border-r border-slate-300 px-1 py-1 w-9 bg-amber-50/50">VDC</th>
              {/* TL */}
              <th className="border-r border-slate-200 px-1 py-1 w-9 bg-purple-50/50">B</th>
              <th className="border-r border-slate-200 px-1 py-1 w-9 bg-purple-50/50">H</th>
              <th className="border-r border-slate-200 px-1 py-1 w-9 bg-purple-50/50">VD</th>
              <th className="border-r border-slate-300 px-1 py-1 w-10 bg-purple-50/50">VDC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {spec.rows.map((row, rIdx) => (
              <tr key={row.lessonId} className="hover:bg-slate-50/80 transition align-top">
                <td className="border-r border-slate-200 px-2 py-2 text-center font-bold text-slate-500">{rIdx + 1}</td>
                <td className="border-r border-slate-200 px-3 py-2 font-medium text-slate-800">{row.topicName}</td>
                <td className="border-r border-slate-200 px-3 py-2 font-semibold text-slate-900">{row.lessonName}</td>

                {/* YCCĐ Description */}
                <td className="border-r border-slate-200 px-4 py-2 space-y-2 leading-relaxed">
                  {row.yccdDescription.biet.length > 0 && (
                    <div>
                      <div className="font-bold text-slate-800 text-[11px]">+ Nhận biết:</div>
                      <ul className="list-disc list-inside text-slate-700 pl-1">
                        {row.yccdDescription.biet.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {row.yccdDescription.hieu.length > 0 && (
                    <div>
                      <div className="font-bold text-slate-800 text-[11px]">+ Thông hiểu:</div>
                      <ul className="list-disc list-inside text-slate-700 pl-1">
                        {row.yccdDescription.hieu.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {row.yccdDescription.vandung.length > 0 && (
                    <div>
                      <div className="font-bold text-slate-800 text-[11px]">+ Vận dụng:</div>
                      <ul className="list-disc list-inside text-slate-700 pl-1">
                        {row.yccdDescription.vandung.map((v, i) => (
                          <li key={i}>{v}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {row.yccdDescription.vandungcao.length > 0 && (
                    <div>
                      <div className="font-bold text-slate-800 text-[11px]">+ Vận dụng cao:</div>
                      <ul className="list-disc list-inside text-slate-700 pl-1">
                        {row.yccdDescription.vandungcao.map((v, i) => (
                          <li key={i}>{v}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </td>

                {/* MCQ cells */}
                <td className="border-r border-slate-200 px-1 py-2 text-center font-semibold text-slate-900 whitespace-nowrap">
                  {formatSpecCellText(row.mcq_b, showCompetency)}
                </td>
                <td className="border-r border-slate-200 px-1 py-2 text-center font-semibold text-slate-900 whitespace-nowrap">
                  {formatSpecCellText(row.mcq_h, showCompetency)}
                </td>
                <td className="border-r border-slate-200 px-1 py-2 text-center font-semibold text-slate-900 whitespace-nowrap">
                  {formatSpecCellText(row.mcq_vd, showCompetency)}
                </td>
                <td className="border-r border-slate-300 px-1 py-2 text-center font-semibold text-slate-900 whitespace-nowrap">
                  {formatSpecCellText(row.mcq_vdc, showCompetency)}
                </td>

                {/* TF cells */}
                <td className="border-r border-slate-200 px-1 py-2 text-center font-semibold text-slate-900 whitespace-nowrap text-[11px]">
                  {formatSpecCellText(row.tf_b, showCompetency)}
                </td>
                <td className="border-r border-slate-200 px-1 py-2 text-center font-semibold text-slate-900 whitespace-nowrap text-[11px]">
                  {formatSpecCellText(row.tf_h, showCompetency)}
                </td>
                <td className="border-r border-slate-200 px-1 py-2 text-center font-semibold text-slate-900 whitespace-nowrap text-[11px]">
                  {formatSpecCellText(row.tf_vd, showCompetency)}
                </td>
                <td className="border-r border-slate-300 px-1 py-2 text-center font-semibold text-slate-900 whitespace-nowrap text-[11px]">
                  {formatSpecCellText(row.tf_vdc, showCompetency)}
                </td>

                {/* SA cells */}
                <td className="border-r border-slate-200 px-1 py-2 text-center font-semibold text-slate-900 whitespace-nowrap">
                  {formatSpecCellText(row.sa_b, showCompetency)}
                </td>
                <td className="border-r border-slate-200 px-1 py-2 text-center font-semibold text-slate-900 whitespace-nowrap">
                  {formatSpecCellText(row.sa_h, showCompetency)}
                </td>
                <td className="border-r border-slate-200 px-1 py-2 text-center font-semibold text-slate-900 whitespace-nowrap">
                  {formatSpecCellText(row.sa_vd, showCompetency)}
                </td>
                <td className="border-r border-slate-300 px-1 py-2 text-center font-semibold text-slate-900 whitespace-nowrap">
                  {formatSpecCellText(row.sa_vdc, showCompetency)}
                </td>

                {/* TL cells */}
                <td className="border-r border-slate-200 px-1 py-2 text-center font-semibold text-slate-900 whitespace-nowrap">
                  {formatSpecCellText(row.tl_b, showCompetency)}
                </td>
                <td className="border-r border-slate-200 px-1 py-2 text-center font-semibold text-slate-900 whitespace-nowrap">
                  {formatSpecCellText(row.tl_h, showCompetency)}
                </td>
                <td className="border-r border-slate-200 px-1 py-2 text-center font-semibold text-slate-900 whitespace-nowrap">
                  {formatSpecCellText(row.tl_vd, showCompetency)}
                </td>
                <td className="border-r border-slate-300 px-1 py-2 text-center font-semibold text-slate-900 whitespace-nowrap">
                  {formatSpecCellText(row.tl_vdc, showCompetency)}
                </td>

                {/* Action: swap question */}
                <td className="px-2 py-2 text-center">
                  <button
                    onClick={() => onOpenSwapModal(row.lessonId, row.lessonName)}
                    className="inline-flex items-center px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition"
                    title="Đổi câu hỏi khác từ ngân hàng"
                  >
                    <Shuffle className="w-3 h-3 mr-1 text-slate-500" />
                    Đổi câu
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
