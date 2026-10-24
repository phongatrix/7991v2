'use client';

import React, { useState } from 'react';
import { FullExamPackage } from '@/lib/types';
import { formatSpecCellText } from '@/lib/specGenerator';
import { KatexRenderer } from './KatexRenderer';
import { Download, Printer, Copy, Check, FileText, ArrowLeft, RefreshCw, Eye, EyeOff } from 'lucide-react';

interface Step6ExportProps {
  examPackage: FullExamPackage;
  onBack: () => void;
  onReset: () => void;
}

export const Step6Export: React.FC<Step6ExportProps> = ({
  examPackage,
  onBack,
  onReset
}) => {
  const [selectedCode, setSelectedCode] = useState(examPackage.variants[0]?.code || '001');
  const [isTeacherMode, setIsTeacherMode] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const variant = examPackage.variants.find(v => v.code === selectedCode) || examPackage.variants[0];
  const matrix = examPackage.matrix;
  const spec = examPackage.spec;
  const letters = ['A', 'B', 'C', 'D'];

  const handleExportDocx = async (isLatex = false) => {
    try {
      setIsExporting(true);
      const res = await fetch('/api/exam/export-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examPackage,
          variantCode: selectedCode,
          isTeacherMode,
          isLatex
        })
      });

      if (!res.ok) {
        throw new Error('Lỗi khi xuất file Word');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `De_Tin_Hoc_Lop${examPackage.grade}_Ma${selectedCode}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const docEl = document.getElementById('printable-document');
    if (!docEl) return;
    navigator.clipboard.writeText(docEl.innerText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* Top Banner exactly as in mau.pdf */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              KẾT QUẢ TỔNG HỢP ĐỀ THI
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Môn có nhiều công thức toán học thì xuất word Latex sau đó chuyển công thức, các môn còn lại xuất toàn bộ ra word.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleExportDocx(false)}
              disabled={isExporting}
              className="inline-flex items-center px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs sm:text-sm font-bold shadow transition"
            >
              <Download className="w-4 h-4 mr-1.5" />
              {isExporting ? 'Đang xuất...' : 'Xuất Toàn Bộ Ra Word'}
            </button>

            <button
              onClick={() => handleExportDocx(true)}
              className="inline-flex items-center px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs sm:text-sm font-bold transition"
            >
              <FileText className="w-4 h-4 mr-1.5 text-indigo-600" />
              Xuất Word (LaTeX)
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-bold shadow transition"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              In Đề / Xuất PDF
            </button>

            <button
              onClick={handleCopyText}
              className="inline-flex items-center px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs sm:text-sm font-medium transition"
            >
              {copied ? <Check className="w-4 h-4 mr-1 text-emerald-600" /> : <Copy className="w-4 h-4 mr-1 text-slate-500" />}
              {copied ? 'Đã chép!' : 'Sao chép'}
            </button>
          </div>
        </div>

        {/* Filters & Options bar */}
        <div className="flex flex-wrap items-center justify-between pt-4 text-xs">
          <div className="flex items-center space-x-3">
            <span className="font-bold text-slate-600">Chọn mã đề xem trước:</span>
            <div className="flex space-x-1">
              {examPackage.variants.map((v) => (
                <button
                  key={v.code}
                  onClick={() => setSelectedCode(v.code)}
                  className={`px-2.5 py-1 rounded font-bold transition ${
                    selectedCode === v.code
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Mã {v.code}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-3 mt-2 sm:mt-0">
            <button
              onClick={() => setIsTeacherMode(!isTeacherMode)}
              className="inline-flex items-center text-slate-600 hover:text-slate-900 font-medium"
            >
              {isTeacherMode ? (
                <>
                  <Eye className="w-3.5 h-3.5 mr-1 text-amber-600" />
                  Đang hiện đáp án (*)
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  Đang ẩn đáp án
                </>
              )}
            </button>

            <button
              onClick={onBack}
              className="inline-flex items-center text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Quay lại
            </button>
          </div>
        </div>
      </div>

      {/* Complete Single Document (4 Parts) Matching mau.pdf */}
      <div id="printable-document" className="document-page text-slate-900 leading-normal">
        {/* Document Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold uppercase tracking-wide">ĐỀ KIỂM TRA</h1>
          <h2 className="text-base font-bold uppercase">
            MÔN: {examPackage.subject.toUpperCase()} - LỚP: {examPackage.grade}
          </h2>
          <p className="text-sm italic">Thời gian: {examPackage.durationMinutes} phút</p>
        </div>

        {/* ======================================================== */}
        {/* I. MA TRẬN ĐỀ KIỂM TRA                                  */}
        {/* ======================================================== */}
        <div className="mb-8">
          <h3 className="text-base font-bold uppercase mb-2">I. MA TRẬN ĐỀ KIỂM TRA</h3>

          <table className="document-table text-center text-xs">
            <thead>
              <tr>
                <th rowSpan={3} className="w-8">TT</th>
                <th rowSpan={3} className="text-left w-32">Chủ đề/Chương</th>
                <th rowSpan={3} className="text-left w-40">Nội dung/Đơn vị kiến thức</th>
                <th colSpan={16}>Mức độ đánh giá</th>
                <th colSpan={4}>Tổng</th>
                <th rowSpan={3} className="w-14">Tỉ lệ % điểm</th>
              </tr>
              <tr>
                <th colSpan={4}>Nhiều lựa chọn</th>
                <th colSpan={4}>Đúng-Sai</th>
                <th colSpan={4}>Trả lời ngắn</th>
                <th colSpan={4}>Tự luận</th>
                <th rowSpan={2}>Biết</th>
                <th rowSpan={2}>Hiểu</th>
                <th rowSpan={2}>V.Dụng</th>
                <th rowSpan={2}>V.Dụng<br />cao</th>
              </tr>
              <tr>
                <th>B</th><th>H</th><th>VD</th><th>VDC</th>
                <th>B</th><th>H</th><th>VD</th><th>VDC</th>
                <th>B</th><th>H</th><th>VD</th><th>VDC</th>
                <th>B</th><th>H</th><th>VD</th><th>VDC</th>
              </tr>
            </thead>
            <tbody>
              {matrix.rows.map((r, idx) => {
                const c = r.cells;
                return (
                  <tr key={r.lessonId}>
                    <td>{idx + 1}</td>
                    <td className="text-left font-medium">{r.topicName}</td>
                    <td className="text-left">{r.lessonName}</td>
                    <td>{c.mcq_b || ''}</td>
                    <td>{c.mcq_h || ''}</td>
                    <td>{c.mcq_vd || ''}</td>
                    <td>{c.mcq_vdc || ''}</td>
                    <td>{c.tf_b || ''}</td>
                    <td>{c.tf_h || ''}</td>
                    <td>{c.tf_vd || ''}</td>
                    <td>{c.tf_vdc || ''}</td>
                    <td>{c.sa_b || ''}</td>
                    <td>{c.sa_h || ''}</td>
                    <td>{c.sa_vd || ''}</td>
                    <td>{c.sa_vdc || ''}</td>
                    <td>{c.tl_b || ''}</td>
                    <td>{c.tl_h || ''}</td>
                    <td>{c.tl_vd || ''}</td>
                    <td>{c.tl_vdc || ''}</td>
                    <td className="font-bold">{r.totalBiet || ''}</td>
                    <td className="font-bold">{r.totalHieu || ''}</td>
                    <td className="font-bold">{r.totalVD || ''}</td>
                    <td className="font-bold">{r.totalVDC || ''}</td>
                    <td className="font-bold">{r.percentage}%</td>
                  </tr>
                );
              })}

              {/* Totals */}
              <tr className="font-bold">
                <td colSpan={3} className="text-left">Tổng số câu</td>
                <td>{matrix.totals.mcq.b}</td>
                <td>{matrix.totals.mcq.h}</td>
                <td>{matrix.totals.mcq.vd}</td>
                <td>{matrix.totals.mcq.vdc}</td>
                <td>{matrix.totals.tf.b}</td>
                <td>{matrix.totals.tf.h}</td>
                <td>{matrix.totals.tf.vd}</td>
                <td>{matrix.totals.tf.vdc}</td>
                <td>{matrix.totals.sa.b}</td>
                <td>{matrix.totals.sa.h}</td>
                <td>{matrix.totals.sa.vd}</td>
                <td>{matrix.totals.sa.vdc}</td>
                <td>{matrix.totals.tl.b}</td>
                <td>{matrix.totals.tl.h}</td>
                <td>{matrix.totals.tl.vd}</td>
                <td>{matrix.totals.tl.vdc}</td>
                <td>{matrix.totals.levels.biet.count}</td>
                <td>{matrix.totals.levels.hieu.count}</td>
                <td>{matrix.totals.levels.vandung.count}</td>
                <td>{matrix.totals.levels.vandungcao.count}</td>
                <td>{matrix.totals.overall.count}</td>
              </tr>
              <tr className="font-bold">
                <td colSpan={3} className="text-left">Tổng số điểm</td>
                <td colSpan={4}>{matrix.totals.mcq.points.toFixed(2)}</td>
                <td colSpan={4}>{matrix.totals.tf.points.toFixed(2)}</td>
                <td colSpan={4}>{matrix.totals.sa.points.toFixed(2)}</td>
                <td colSpan={4}>{matrix.totals.tl.points.toFixed(2)}</td>
                <td>{matrix.totals.levels.biet.points.toFixed(2)}</td>
                <td>{matrix.totals.levels.hieu.points.toFixed(2)}</td>
                <td>{matrix.totals.levels.vandung.points.toFixed(2)}</td>
                <td>{matrix.totals.levels.vandungcao.points.toFixed(2)}</td>
                <td>{matrix.totals.overall.points.toFixed(2)}đ</td>
              </tr>
              <tr className="font-bold">
                <td colSpan={3} className="text-left">Tỉ lệ %</td>
                <td colSpan={4}>{matrix.totals.mcq.percent}%</td>
                <td colSpan={4}>{matrix.totals.tf.percent}%</td>
                <td colSpan={4}>{matrix.totals.sa.percent}%</td>
                <td colSpan={4}>{matrix.totals.tl.percent}%</td>
                <td>{matrix.totals.levels.biet.percent}%</td>
                <td>{matrix.totals.levels.hieu.percent}%</td>
                <td>{matrix.totals.levels.vandung.percent}%</td>
                <td>{matrix.totals.levels.vandungcao.percent}%</td>
                <td>{matrix.totals.overall.percent}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ======================================================== */}
        {/* II. BẢN ĐẶC TẢ ĐỀ KIỂM TRA                              */}
        {/* ======================================================== */}
        <div className="mb-8 page-break">
          <h3 className="text-base font-bold uppercase mb-2">II. BẢN ĐẶC TẢ ĐỀ KIỂM TRA</h3>

          <table className="document-table text-xs align-top">
            <thead>
              <tr className="text-center">
                <th rowSpan={3} className="w-8">TT</th>
                <th rowSpan={3} className="text-left w-28">Chủ đề/Chương</th>
                <th rowSpan={3} className="text-left w-36">Nội dung/Đơn vị kiến thức</th>
                <th rowSpan={3} className="text-left min-w-[260px]">Mức độ đánh giá (Mô tả YCCĐ)</th>
                <th colSpan={16}>Số câu hỏi theo mức độ nhận thức</th>
              </tr>
              <tr className="text-center">
                <th colSpan={4}>Nhiều lựa chọn</th>
                <th colSpan={4}>Đúng-Sai</th>
                <th colSpan={4}>Trả lời ngắn</th>
                <th colSpan={4}>Tự luận</th>
              </tr>
              <tr className="text-center">
                <th>B</th><th>H</th><th>VD</th><th>VDC</th>
                <th>B</th><th>H</th><th>VD</th><th>VDC</th>
                <th>B</th><th>H</th><th>VD</th><th>VDC</th>
                <th>B</th><th>H</th><th>VD</th><th>VDC</th>
              </tr>
            </thead>
            <tbody>
              {spec.rows.map((r, idx) => (
                <tr key={r.lessonId}>
                  <td className="text-center">{idx + 1}</td>
                  <td className="font-medium">{r.topicName}</td>
                  <td className="font-semibold">{r.lessonName}</td>
                  <td className="leading-relaxed py-2">
                    {r.yccdDescription.biet.length > 0 && (
                      <div className="mb-1.5">
                        <div className="font-bold">+ Nhận biết:</div>
                        <ul className="list-disc list-inside pl-1 text-[12px]">
                          {r.yccdDescription.biet.map((b, i) => <li key={i}>{b}</li>)}
                        </ul>
                      </div>
                    )}
                    {r.yccdDescription.hieu.length > 0 && (
                      <div className="mb-1.5">
                        <div className="font-bold">+ Thông hiểu:</div>
                        <ul className="list-disc list-inside pl-1 text-[12px]">
                          {r.yccdDescription.hieu.map((h, i) => <li key={i}>{h}</li>)}
                        </ul>
                      </div>
                    )}
                    {r.yccdDescription.vandung.length > 0 && (
                      <div className="mb-1.5">
                        <div className="font-bold">+ Vận dụng:</div>
                        <ul className="list-disc list-inside pl-1 text-[12px]">
                          {r.yccdDescription.vandung.map((v, i) => <li key={i}>{v}</li>)}
                        </ul>
                      </div>
                    )}
                    {r.yccdDescription.vandungcao.length > 0 && (
                      <div>
                        <div className="font-bold">+ Vận dụng cao:</div>
                        <ul className="list-disc list-inside pl-1 text-[12px]">
                          {r.yccdDescription.vandungcao.map((v, i) => <li key={i}>{v}</li>)}
                        </ul>
                      </div>
                    )}
                  </td>
                  <td className="text-center whitespace-nowrap">{formatSpecCellText(r.mcq_b, spec.showCompetencyCodes)}</td>
                  <td className="text-center whitespace-nowrap">{formatSpecCellText(r.mcq_h, spec.showCompetencyCodes)}</td>
                  <td className="text-center whitespace-nowrap">{formatSpecCellText(r.mcq_vd, spec.showCompetencyCodes)}</td>
                  <td className="text-center whitespace-nowrap">{formatSpecCellText(r.mcq_vdc, spec.showCompetencyCodes)}</td>
                  <td className="text-center whitespace-nowrap text-[11px]">{formatSpecCellText(r.tf_b, spec.showCompetencyCodes)}</td>
                  <td className="text-center whitespace-nowrap text-[11px]">{formatSpecCellText(r.tf_h, spec.showCompetencyCodes)}</td>
                  <td className="text-center whitespace-nowrap text-[11px]">{formatSpecCellText(r.tf_vd, spec.showCompetencyCodes)}</td>
                  <td className="text-center whitespace-nowrap text-[11px]">{formatSpecCellText(r.tf_vdc, spec.showCompetencyCodes)}</td>
                  <td className="text-center whitespace-nowrap">{formatSpecCellText(r.sa_b, spec.showCompetencyCodes)}</td>
                  <td className="text-center whitespace-nowrap">{formatSpecCellText(r.sa_h, spec.showCompetencyCodes)}</td>
                  <td className="text-center whitespace-nowrap">{formatSpecCellText(r.sa_vd, spec.showCompetencyCodes)}</td>
                  <td className="text-center whitespace-nowrap">{formatSpecCellText(r.sa_vdc, spec.showCompetencyCodes)}</td>
                  <td className="text-center whitespace-nowrap">{formatSpecCellText(r.tl_b, spec.showCompetencyCodes)}</td>
                  <td className="text-center whitespace-nowrap">{formatSpecCellText(r.tl_h, spec.showCompetencyCodes)}</td>
                  <td className="text-center whitespace-nowrap">{formatSpecCellText(r.tl_vd, spec.showCompetencyCodes)}</td>
                  <td className="text-center whitespace-nowrap">{formatSpecCellText(r.tl_vdc, spec.showCompetencyCodes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ======================================================== */}
        {/* III. ĐỀ KIỂM TRA                                        */}
        {/* ======================================================== */}
        <div className="mb-8 page-break">
          <div className="text-center mb-4">
            <h3 className="text-base font-bold uppercase">III. ĐỀ KIỂM TRA</h3>
            <div className="text-xs font-bold">Mã đề thi: {variant.code}</div>
          </div>

          {/* Part I */}
          {variant.mcq.length > 0 && (
            <div className="mb-6">
              <p className="font-bold text-sm mb-3">
                PHẦN I ({(variant.mcq.length * 0.25).toFixed(2).replace(/\.00$/, "")} điểm). Câu trắc nghiệm nhiều phương án lựa chọn. Thí sinh trả lời từ câu 1 đến câu {variant.mcq.length}. Mỗi câu hỏi thí sinh chỉ chọn một phương án.
              </p>
              <div className="space-y-3">
                {variant.mcq.map((item, qIdx) => {
                  const q = item.question;
                  const options = item.shuffledOptions || (q.a ? q.a.map((t, idx) => ({ text: t, originalIndex: idx })) : []);
                  return (
                    <div key={qIdx} className="text-sm">
                      <div className="font-medium flex items-start">
                        <span className="font-bold mr-1 flex-shrink-0">Câu {qIdx + 1}:</span>
                        <KatexRenderer content={q.q} />
                      </div>
                      <div className="ml-5 mt-1 space-y-0.5">
                        {options.map((opt, oIdx) => {
                          const isCorrect = isTeacherMode && oIdx === item.shuffledCorrectIndex;
                          return (
                            <div key={oIdx} className="flex items-start text-xs sm:text-sm">
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

          {/* Part II */}
          {variant.tf.length > 0 && (
            <div className="mb-6">
              <p className="font-bold text-sm mb-3">
                PHẦN II ({variant.tf.length} điểm). Câu trắc nghiệm đúng sai. Thí sinh trả lời từ câu 1 đến câu {variant.tf.length}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.
              </p>
              <div className="space-y-4">
                {variant.tf.map((item, qIdx) => {
                  const q = item.question;
                  const items = q.items || [];
                  const subLetters = ['a', 'b', 'c', 'd'];
                  return (
                    <div key={qIdx} className="text-sm">
                      <div className="font-medium flex items-start mb-1">
                        <span className="font-bold mr-1 flex-shrink-0">Câu {qIdx + 1}:</span>
                        <KatexRenderer content={q.q} />
                      </div>
                      <div className="ml-5 space-y-0.5">
                        {items.map((sub, sIdx) => {
                          const isTrueMark = isTeacherMode && sub.isTrue;
                          return (
                            <div key={sIdx} className="flex items-start text-xs sm:text-sm">
                              <span className="font-bold mr-1 flex-shrink-0">
                                {isTrueMark ? '*' : ''}{subLetters[sIdx]})
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

          {/* Part III */}
          {variant.tl.length > 0 && (
            <div className="mb-4">
              <p className="font-bold text-sm mb-3">
                PHẦN III ({variant.tl.length} điểm). Tự luận. Thí sinh trả lời từ câu 1 đến câu {variant.tl.length}.
              </p>
              <div className="space-y-4">
                {variant.tl.map((item, qIdx) => (
                  <div key={qIdx} className="text-sm">
                    <div className="font-medium flex items-start">
                      <span className="font-bold mr-1 flex-shrink-0">Câu {qIdx + 1}:</span>
                      <KatexRenderer content={item.question.q} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* IV. HƯỚNG DẪN CHẤM                                      */}
        {/* ======================================================== */}
        <div className="page-break">
          <h3 className="text-base font-bold uppercase mb-4">IV. HƯỚNG DẪN CHẤM</h3>

          {/* 1. Phần 1 */}
          {variant.mcq.length > 0 && (
            <div className="mb-6">
              <p className="font-bold text-sm mb-1">
                1. Phần 1. Trắc nghiệm. Mỗi câu Phần 1 đúng được 0.25 điểm.
              </p>
              <p className="italic text-xs mb-2">Bảng đáp án Phần 1:</p>
              <table className="document-table text-center text-xs">
                <thead>
                  <tr className="bg-slate-50 font-bold">
                    <th className="w-16">Câu</th>
                    {variant.mcq.map((_, i) => <th key={i}>{i + 1}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr className="font-bold">
                    <td>Đáp án</td>
                    {variant.mcq.map((item, i) => (
                      <td key={i}>{letters[item.shuffledCorrectIndex ?? 0] || 'A'}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* 2. Phần 2 */}
          {variant.tf.length > 0 && (
            <div className="mb-6">
              <p className="font-bold text-sm mb-2">
                2. Phần 2 đúng trọn vẹn được 1 điểm (đúng 1 ý 0.1đ, 2 ý 0.25đ, 3 ý 0.5đ, 4 ý 1đ).
              </p>
              <div className="space-y-1 text-sm font-semibold ml-2">
                {variant.tf.map((item, idx) => {
                  const items = item.question.items || [];
                  const tfString = items.map(x => (x.isTrue ? 'Đ' : 'S')).join('');
                  return (
                    <div key={idx}>{idx + 1}. {tfString}</div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Phần 3 */}
          {variant.tl.length > 0 && (
            <div className="mb-4">
              <p className="font-bold text-sm mb-2">3. Phần 3. Tự luận</p>
              <table className="document-table text-xs align-top">
                <thead>
                  <tr className="text-center font-bold">
                    <th className="w-24">Phần / Câu</th>
                    <th className="text-left">Nội dung đáp án</th>
                    <th className="w-16">Điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {variant.tl.map((item, idx) => (
                    <tr key={idx}>
                      <td className="text-center font-bold">Câu {idx + 1}</td>
                      <td className="leading-relaxed">
                        <KatexRenderer content={item.question.essayAnswer || item.question.q} />
                      </td>
                      <td className="text-center font-bold">{item.question.points || 1.0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
