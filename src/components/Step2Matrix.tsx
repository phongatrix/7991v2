'use client';

import React, { useState } from 'react';
import { Grade, ExamMatrix, MatrixRow } from '@/lib/types';
import { CURRICULUM_DATA, Topic, Lesson } from '@/lib/curriculumData';
import { autoDistributeMatrix, gradeDefaultTotals, recalculateMatrixTotals } from '@/lib/matrixDistributor';
import { Wand2, CheckCircle2, AlertTriangle, ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';

interface Step2MatrixProps {
  grade: Grade;
  matrix: ExamMatrix | null;
  setMatrix: (m: ExamMatrix) => void;
  selectedLessonIds: string[];
  setSelectedLessonIds: (ids: string[]) => void;
  onNext: () => void;
  onBack: () => void;
  isNextBusy?: boolean;
}

export const Step2Matrix: React.FC<Step2MatrixProps> = ({
  grade,
  matrix,
  setMatrix,
  selectedLessonIds,
  setSelectedLessonIds,
  onNext,
  onBack,
  isNextBusy = false
}) => {
  const topics = CURRICULUM_DATA[grade] || [];

  // Config for auto-distribution — mặc định theo khối (K12: 24/4/0/0; K10+K11: 16/3/0/3)
  const defaultTotals = gradeDefaultTotals(grade);
  const [totalMCQ, setTotalMCQ] = useState(defaultTotals.totalMCQ);
  const [totalTF, setTotalTF] = useState(defaultTotals.totalTF);
  const [totalSA, setTotalSA] = useState(defaultTotals.totalSA);
  const [totalTL, setTotalTL] = useState(defaultTotals.totalTL);
  const [configGrade, setConfigGrade] = useState(grade);

  // Đổi khối thì nạp lại số câu mặc định của khối đó
  if (configGrade !== grade) {
    setConfigGrade(grade);
    const d = gradeDefaultTotals(grade);
    setTotalMCQ(d.totalMCQ);
    setTotalTF(d.totalTF);
    setTotalSA(d.totalSA);
    setTotalTL(d.totalTL);
  }

  // Toggle selection for a single lesson
  const toggleLesson = (id: string) => {
    let next: string[];
    if (selectedLessonIds.includes(id)) {
      next = selectedLessonIds.filter(x => x !== id);
    } else {
      next = [...selectedLessonIds, id];
    }
    setSelectedLessonIds(next);
  };

  // Select all lessons in a topic
  const toggleTopic = (topic: Topic) => {
    const topicLessonIds = topic.lessons.map(l => l.id);
    const allSelected = topicLessonIds.every(id => selectedLessonIds.includes(id));
    if (allSelected) {
      setSelectedLessonIds(selectedLessonIds.filter(id => !topicLessonIds.includes(id)));
    } else {
      const merged = Array.from(new Set([...selectedLessonIds, ...topicLessonIds]));
      setSelectedLessonIds(merged);
    }
  };

  // Run auto distribution
  const handleAutoDistribute = () => {
    if (selectedLessonIds.length === 0) {
      alert("Vui lòng chọn ít nhất một bài học.");
      return;
    }
    try {
      const newMatrix = autoDistributeMatrix({
        grade,
        subject: 'Tin học',
        title: matrix?.title || `ĐỀ KIỂM TRA MÔN TIN HỌC LỚP ${grade}`,
        durationMinutes: matrix?.durationMinutes || 45,
        selectedLessonIds,
        totalMCQ,
        totalTF,
        totalSA,
        totalTL
      });
      setMatrix(newMatrix);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  // Handle cell edit
  const handleCellChange = (rowIndex: number, cellKey: keyof MatrixRow['cells'], value: number) => {
    if (!matrix) return;
    const updatedRows = [...matrix.rows];
    updatedRows[rowIndex] = {
      ...updatedRows[rowIndex],
      cells: {
        ...updatedRows[rowIndex].cells,
        [cellKey]: Math.max(0, value || 0)
      }
    };
    const updatedMatrix = recalculateMatrixTotals({
      ...matrix,
      rows: updatedRows
    });
    setMatrix(updatedMatrix);
  };

  const totals = matrix?.totals;
  const isPointsBalanced = totals && totals.overall.points === 10.0;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* Step Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Bước 2: Xây Dựng Ma Trận Đề Kiểm Tra</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Khung 16 ô mức độ: Nhiều lựa chọn, Đúng-Sai, Trả lời ngắn, Tự luận × Biết, Hiểu, Vận dụng, Vận dụng cao (CV 7991)
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
            disabled={!matrix || matrix.rows.length === 0 || isNextBusy}
            className={`inline-flex items-center px-5 py-2 text-sm font-bold text-white rounded-lg shadow-sm transition ${
              !matrix || matrix.rows.length === 0 || isNextBusy
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-sky-600 hover:bg-sky-700'
            }`}
          >
            {isNextBusy ? (
              <>
                <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                <span>Đang sinh câu hỏi bổ sung…</span>
              </>
            ) : (
              <>
                <span>Tiếp Tục: Bản Đặc Tả</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Lesson Selector Tree & Auto Distribute Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Tree of topics and lessons */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Chọn Bài Học Tham Gia Đề ({selectedLessonIds.length} bài đã chọn)
            </h3>
            <div className="flex space-x-2 text-xs">
              <button
                onClick={() => {
                  const allIds = topics.flatMap(t => t.lessons.map(l => l.id));
                  setSelectedLessonIds(allIds);
                }}
                className="text-sky-600 hover:underline font-medium"
              >
                Chọn tất cả
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={() => setSelectedLessonIds([])}
                className="text-slate-500 hover:underline font-medium"
              >
                Bỏ chọn
              </button>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-3 pr-2 divide-y divide-slate-100">
            {topics.map((t) => {
              const allTopicSelected = t.lessons.every(l => selectedLessonIds.includes(l.id));
              const someTopicSelected = t.lessons.some(l => selectedLessonIds.includes(l.id));

              return (
                <div key={t.id} className="pt-2">
                  <div className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      id={`topic_${t.id}`}
                      checked={allTopicSelected}
                      ref={input => {
                        if (input) input.indeterminate = someTopicSelected && !allTopicSelected;
                      }}
                      onChange={() => toggleTopic(t)}
                      className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                    />
                    <label htmlFor={`topic_${t.id}`} className="font-bold text-xs text-slate-800 cursor-pointer">
                      {t.name}
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 ml-6 mt-1">
                    {t.lessons.map((l) => (
                      <label
                        key={l.id}
                        className={`flex items-center space-x-2 px-2.5 py-1.5 rounded text-xs cursor-pointer transition ${
                          selectedLessonIds.includes(l.id)
                            ? 'bg-sky-50 text-sky-900 font-medium'
                            : 'hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedLessonIds.includes(l.id)}
                          onChange={() => toggleLesson(l.id)}
                          className="w-3.5 h-3.5 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                        />
                        <span className="truncate" title={l.fullName}>{l.fullName}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Auto distribute tool */}
        <div className="bg-sky-50/60 rounded-xl border border-sky-200/80 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-sky-900 font-bold text-sm mb-1">
              <Wand2 className="w-4 h-4 text-sky-600" />
              <span>Công Cụ "Tự Động Dàn Câu"</span>
            </div>
            <p className="text-xs text-slate-600 mb-2">
              {grade === '12' ? (
                <>Mặc định khối 12: <b>24 MCQ (6đ) · 4 Đúng/Sai (4đ) · không tự luận</b> — phân mức 40% Biết · 30% Hiểu · 20% VD · 10% VD cao.</>
              ) : (
                <>Mặc định khối {grade}: <b>16 MCQ (4đ) · 3 Đúng/Sai (3đ) · 3 Tự luận (3đ)</b> — phân mức 40% Biết · 30% Hiểu · 20% VD · 10% VD cao.</>
              )}
            </p>
            <p className="text-[11px] text-sky-800 bg-sky-100/70 border border-sky-200 rounded px-2 py-1.5 mb-4">
              Mỗi lần bấm sẽ <b>xáo trộn câu sang các bài khác nhau</b> nhưng tổng số câu theo từng cột luôn <b>giữ đúng tỉ lệ</b> quy định của ma trận.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tổng MCQ (0.25đ):</label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={totalMCQ}
                  onChange={(e) => setTotalMCQ(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-center font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tổng TF (1.0đ):</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={totalTF}
                  onChange={(e) => setTotalTF(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-center font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tổng SA (0.25đ):</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={totalSA}
                  onChange={(e) => setTotalSA(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-center font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tổng TL (3.0đ):</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={totalTL}
                  onChange={(e) => setTotalTL(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-center font-bold"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleAutoDistribute}
            className="w-full mt-5 inline-flex items-center justify-center py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg shadow transition"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Tự Động Dàn Câu Vào Ma Trận
          </button>
        </div>
      </div>

      {/* Validation status badge */}
      {totals && (
        <div
          className={`p-3.5 rounded-lg border flex items-center justify-between text-xs ${
            isPointsBalanced
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            {isPointsBalanced ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            )}
            <div>
              <span className="font-bold">
                {isPointsBalanced
                  ? 'Ma trận chuẩn 10.00 điểm (100%)!'
                  : `Tổng điểm hiện tại: ${totals.overall.points.toFixed(2)}đ (Cần đúng 10.00đ)`}
              </span>
              <span className="ml-2 text-slate-600">
                Phân bổ: Biết {totals.levels.biet.percent}% · Hiểu {totals.levels.hieu.percent}% · Vận dụng {totals.levels.vandung.percent}% · Vận dụng cao {totals.levels.vandungcao.percent}%
              </span>
            </div>
          </div>
          <span className="font-mono font-bold">
            MCQ: {totals.mcq.points.toFixed(2)}đ | TF: {totals.tf.points.toFixed(2)}đ | SA: {totals.sa.points.toFixed(2)}đ | TL: {totals.tl.points.toFixed(2)}đ
          </span>
        </div>
      )}

      {/* 16-Cell Interactive Matrix Table */}
      {matrix && matrix.rows.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
          <table className="w-full border-collapse text-xs text-center font-sans">
            <thead>
              <tr className="bg-slate-100 text-slate-800 border-b border-slate-300">
                <th rowSpan={2} className="border-r border-slate-300 px-2 py-2 w-10">TT</th>
                <th rowSpan={2} className="border-r border-slate-300 px-3 py-2 text-left min-w-[140px]">Chủ đề/Chương</th>
                <th rowSpan={2} className="border-r border-slate-300 px-3 py-2 text-left min-w-[180px]">Nội dung/Đơn vị kiến thức</th>
                <th colSpan={4} className="border-r border-slate-300 px-2 py-1 bg-sky-50 font-bold text-sky-900">Nhiều lựa chọn</th>
                <th colSpan={4} className="border-r border-slate-300 px-2 py-1 bg-emerald-50 font-bold text-emerald-900">Đúng-Sai</th>
                <th colSpan={4} className="border-r border-slate-300 px-2 py-1 bg-amber-50 font-bold text-amber-900">Trả lời ngắn</th>
                <th colSpan={4} className="border-r border-slate-300 px-2 py-1 bg-purple-50 font-bold text-purple-900">Tự luận</th>
                <th colSpan={4} className="border-r border-slate-300 px-2 py-1 bg-slate-200 font-bold">Tổng</th>
                <th rowSpan={2} className="px-2 py-2 w-16">Tỉ lệ %</th>
              </tr>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-300 font-bold text-[11px]">
                {['bg-sky-50/40', 'bg-emerald-50/40', 'bg-amber-50/40', 'bg-purple-50/40'].map((bg, g) =>
                  ['B', 'H', 'VD', 'VDC'].map((lv, i) => (
                    <th key={`${g}-${i}`} className={`border-r ${i === 3 ? 'border-slate-300' : 'border-slate-200'} px-1 py-1 w-9 ${bg}`}>{lv}</th>
                  ))
                )}
                {['B', 'H', 'VD', 'VDC'].map((lv, i) => (
                  <th key={`tot-${i}`} className={`border-r ${i === 3 ? 'border-slate-300' : 'border-slate-200'} px-1 py-1 w-9 bg-slate-100`}>{lv}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {matrix.rows.map((row, rIdx) => {
                const c = row.cells;
                const groups: { prefix: 'mcq' | 'tf' | 'sa' | 'tl'; ring: string }[] = [
                  { prefix: 'mcq', ring: 'focus:ring-sky-500' },
                  { prefix: 'tf', ring: 'focus:ring-emerald-500' },
                  { prefix: 'sa', ring: 'focus:ring-amber-500' },
                  { prefix: 'tl', ring: 'focus:ring-purple-500' }
                ];
                const suffixes = ['b', 'h', 'vd', 'vdc'] as const;
                return (
                  <tr key={row.lessonId} className="hover:bg-slate-50/80 transition">
                    <td className="border-r border-slate-200 px-2 py-1.5 font-bold text-slate-500">{rIdx + 1}</td>
                    <td className="border-r border-slate-200 px-3 py-1.5 text-left font-medium text-slate-800">{row.topicName}</td>
                    <td className="border-r border-slate-200 px-3 py-1.5 text-left text-slate-900">{row.lessonName}</td>

                    {groups.map(g =>
                      suffixes.map((sfx, i) => {
                        const key = `${g.prefix}_${sfx}` as keyof MatrixRow['cells'];
                        return (
                          <td key={key} className={`border-r ${i === 3 ? 'border-slate-300' : 'border-slate-200'} p-0.5`}>
                            <input
                              type="number" min="0" value={(c[key] as number) || ''}
                              onChange={(e) => handleCellChange(rIdx, key, Number(e.target.value))}
                              className={`w-full text-center py-1 bg-transparent hover:bg-white focus:bg-white focus:ring-1 ${g.ring} rounded text-slate-900 font-semibold`}
                            />
                          </td>
                        );
                      })
                    )}

                    {/* Row Totals */}
                    <td className="border-r border-slate-200 px-1 py-1 font-bold text-slate-700 bg-slate-50/50">{row.totalBiet || 0}</td>
                    <td className="border-r border-slate-200 px-1 py-1 font-bold text-slate-700 bg-slate-50/50">{row.totalHieu || 0}</td>
                    <td className="border-r border-slate-200 px-1 py-1 font-bold text-slate-700 bg-slate-50/50">{row.totalVD || 0}</td>
                    <td className="border-r border-slate-300 px-1 py-1 font-bold text-slate-700 bg-slate-50/50">{row.totalVDC || 0}</td>
                    <td className="px-2 py-1 font-bold text-sky-700 bg-slate-50">{row.percentage}%</td>
                  </tr>
                );
              })}

              {/* Bottom Summary Rows */}
              {totals && (
                <>
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                    <td colSpan={3} className="border-r border-slate-300 px-3 py-2 text-left">Tổng số câu</td>
                    {(['mcq', 'tf', 'sa', 'tl'] as const).map(t =>
                      (['b', 'h', 'vd', 'vdc'] as const).map((sfx, i) => (
                        <td key={`${t}-${sfx}`} className={`border-r ${i === 3 ? 'border-slate-300' : 'border-slate-200'} px-1 py-1`}>{(totals[t] as any)[sfx]}</td>
                      ))
                    )}
                    <td className="border-r border-slate-200 px-1 py-1">{totals.levels.biet.count}</td>
                    <td className="border-r border-slate-200 px-1 py-1">{totals.levels.hieu.count}</td>
                    <td className="border-r border-slate-200 px-1 py-1">{totals.levels.vandung.count}</td>
                    <td className="border-r border-slate-300 px-1 py-1">{totals.levels.vandungcao.count}</td>
                    <td className="px-2 py-1">{totals.overall.count}</td>
                  </tr>
                  <tr className="bg-slate-100 font-bold">
                    <td colSpan={3} className="border-r border-slate-300 px-3 py-1.5 text-left">Tổng số điểm</td>
                    <td colSpan={4} className="border-r border-slate-300 px-1 py-1 text-sky-800">{totals.mcq.points.toFixed(2)}</td>
                    <td colSpan={4} className="border-r border-slate-300 px-1 py-1 text-emerald-800">{totals.tf.points.toFixed(2)}</td>
                    <td colSpan={4} className="border-r border-slate-300 px-1 py-1 text-amber-800">{totals.sa.points.toFixed(2)}</td>
                    <td colSpan={4} className="border-r border-slate-300 px-1 py-1 text-purple-800">{totals.tl.points.toFixed(2)}</td>
                    <td className="border-r border-slate-200 px-1 py-1">{totals.levels.biet.points.toFixed(2)}</td>
                    <td className="border-r border-slate-200 px-1 py-1">{totals.levels.hieu.points.toFixed(2)}</td>
                    <td className="border-r border-slate-200 px-1 py-1">{totals.levels.vandung.points.toFixed(2)}</td>
                    <td className="border-r border-slate-300 px-1 py-1">{totals.levels.vandungcao.points.toFixed(2)}</td>
                    <td className="px-2 py-1 text-sky-900 font-black">{totals.overall.points.toFixed(2)}đ</td>
                  </tr>
                  <tr className="bg-slate-100 font-bold text-slate-700">
                    <td colSpan={3} className="border-r border-slate-300 px-3 py-1.5 text-left">Tỉ lệ %</td>
                    <td colSpan={4} className="border-r border-slate-300 px-1 py-1">{totals.mcq.percent}%</td>
                    <td colSpan={4} className="border-r border-slate-300 px-1 py-1">{totals.tf.percent}%</td>
                    <td colSpan={4} className="border-r border-slate-300 px-1 py-1">{totals.sa.percent}%</td>
                    <td colSpan={4} className="border-r border-slate-300 px-1 py-1">{totals.tl.percent}%</td>
                    <td className="border-r border-slate-200 px-1 py-1">{totals.levels.biet.percent}%</td>
                    <td className="border-r border-slate-200 px-1 py-1">{totals.levels.hieu.percent}%</td>
                    <td className="border-r border-slate-200 px-1 py-1">{totals.levels.vandung.percent}%</td>
                    <td className="border-r border-slate-300 px-1 py-1">{totals.levels.vandungcao.percent}%</td>
                    <td className="px-2 py-1 text-sky-900 font-black">{totals.overall.percent}%</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
