'use client';

import React, { useState } from 'react';
import { Grade } from '@/lib/types';
import { CURRICULUM_DATA } from '@/lib/curriculumData';
import { X, UploadCloud, Loader2, CheckCircle2, FileText } from 'lucide-react';

interface ImportWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportWordModal: React.FC<ImportWordModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [grade, setGrade] = useState<Grade>('11');
  const topics = CURRICULUM_DATA[grade] || [];
  const [selectedTopicId, setSelectedTopicId] = useState(topics[0]?.id || '');
  const currentTopic = topics.find(t => t.id === selectedTopicId) || topics[0];
  const [selectedLessonId, setSelectedLessonId] = useState(currentTopic?.lessons[0]?.id || '');

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImport = async () => {
    if (!file) {
      setErrorMessage("Vui lòng chọn tệp .docx để tải lên.");
      return;
    }

    setLoading(true);
    setStats(null);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('grade', grade);
      formData.append('lessonId', selectedLessonId);

      const res = await fetch('/api/import-docx', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi nhập file');
      }

      setStats(data.stats);
      onSuccess();
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in duration-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <UploadCloud className="w-5 h-5 text-sky-600" />
            <h3 className="text-base font-bold text-slate-900">Import Câu Hỏi Từ File Word (.docx)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {/* File Picker */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Chọn file Word (.docx):</label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-sky-500 transition bg-slate-50">
              <input
                type="file"
                accept=".docx"
                id="file-upload"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <FileText className="w-8 h-8 text-slate-400 mb-2" />
                <span className="font-bold text-sky-600 text-sm">
                  {file ? file.name : "Nhấn để chọn file Word (.docx)"}
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  Định dạng hỗ trợ: [P1] MCQ (A-D, *A là đúng), [P2] TF (a-d), [P3] SA, [P4] TL
                </span>
              </label>
            </div>
          </div>

          {/* Grade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Khối Lớp:</label>
              <select
                value={grade}
                onChange={(e) => {
                  const g = e.target.value as Grade;
                  setGrade(g);
                  const newTopics = CURRICULUM_DATA[g] || [];
                  setSelectedTopicId(newTopics[0]?.id || '');
                  setSelectedLessonId(newTopics[0]?.lessons[0]?.id || '');
                }}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white"
              >
                <option value="10">Lớp 10</option>
                <option value="11">Lớp 11</option>
                <option value="12">Lớp 12</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Gán vào Bài học:</label>
              <select
                value={selectedLessonId}
                onChange={(e) => setSelectedLessonId(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white"
              >
                {currentTopic?.lessons.map((l) => (
                  <option key={l.id} value={l.id}>{l.fullName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Results stats */}
          {stats && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-lg">
              <div className="flex items-center space-x-1.5 font-bold mb-1 text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Nhập thành công {stats.totalParsed} câu hỏi!</span>
              </div>
              <div className="grid grid-cols-4 gap-1 text-[11px] text-emerald-800">
                <span>MCQ: {stats.mcq}</span>
                <span>Đúng/Sai: {stats.tf}</span>
                <span>Ngắn: {stats.sa}</span>
                <span>Tự luận: {stats.tl}</span>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
              {errorMessage}
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={loading || !file}
            className={`w-full py-2.5 px-4 font-bold rounded-lg shadow transition flex items-center justify-center space-x-2 text-white ${
              loading || !file ? 'bg-slate-400 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang phân tích cú pháp file Word...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Tiến Hành Phân Tích & Lưu Kho</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
