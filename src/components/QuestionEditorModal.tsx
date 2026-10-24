'use client';

import React, { useState } from 'react';
import { Grade, QuestionType, Level, Competency, Question } from '@/lib/types';
import { CURRICULUM_DATA } from '@/lib/curriculumData';
import { X, Plus, Save } from 'lucide-react';

interface QuestionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  isOpen,
  onClose,
  onSaved
}) => {
  const [grade, setGrade] = useState<Grade>('11');
  const topics = CURRICULUM_DATA[grade] || [];
  const [selectedTopicId, setSelectedTopicId] = useState(topics[0]?.id || '');
  const currentTopic = topics.find(t => t.id === selectedTopicId) || topics[0];
  const [selectedLessonId, setSelectedLessonId] = useState(currentTopic?.lessons[0]?.id || '');

  const [type, setType] = useState<QuestionType>('MCQ');
  const [level, setLevel] = useState<Level>('biet');
  const [yccd, setYccd] = useState<Competency>('NLa');
  const [yccdContent, setYccdContent] = useState('');
  const [stem, setStem] = useState('');

  // MCQ options
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctMCQ, setCorrectMCQ] = useState(0);

  // TF items
  const [tfItems, setTfItems] = useState([
    { key: 'a', text: '', isTrue: true, level: 'biet' as Level },
    { key: 'b', text: '', isTrue: false, level: 'biet' as Level },
    { key: 'c', text: '', isTrue: true, level: 'hieu' as Level },
    { key: 'd', text: '', isTrue: false, level: 'vandung' as Level },
  ]);

  // SA
  const [correctSA, setCorrectSA] = useState('');

  // TL
  const [essayAnswer, setEssayAnswer] = useState('');

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stem.trim()) {
      alert("Vui lòng nhập nội dung câu hỏi");
      return;
    }

    setLoading(true);
    try {
      const payload: Partial<Question> = {
        grade,
        subject: 'Tin học',
        topicId: selectedTopicId,
        lessonId: selectedLessonId,
        type,
        level,
        yccd,
        yccdContent: yccdContent || `Kiểm tra kiến thức ${currentTopic?.lessons.find(l => l.id === selectedLessonId)?.fullName}`,
        q: stem,
        points: type === 'MCQ' ? 0.25 : type === 'TF' ? 1.0 : type === 'SA' ? 0.25 : 1.0
      };

      if (type === 'MCQ') {
        payload.a = [optA, optB, optC, optD];
        payload.correct = correctMCQ;
      } else if (type === 'TF') {
        payload.items = tfItems;
      } else if (type === 'SA') {
        payload.correctSA = correctSA;
      } else if (type === 'TL') {
        payload.essayAnswer = essayAnswer;
      }

      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Lỗi khi lưu câu hỏi");

      onSaved();
      onClose();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 className="text-base font-bold text-slate-900">Thêm Câu Hỏi Mới Vào Ngân Hàng</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {/* Grade & Lesson */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Khối Lớp:</label>
              <select
                value={grade}
                onChange={(e) => {
                  const g = e.target.value as Grade;
                  setGrade(g);
                  const t = CURRICULUM_DATA[g] || [];
                  setSelectedTopicId(t[0]?.id || '');
                  setSelectedLessonId(t[0]?.lessons[0]?.id || '');
                }}
                className="w-full px-2.5 py-1.5 border rounded bg-white"
              >
                <option value="10">Lớp 10</option>
                <option value="11">Lớp 11</option>
                <option value="12">Lớp 12</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Bài Học:</label>
              <select
                value={selectedLessonId}
                onChange={(e) => setSelectedLessonId(e.target.value)}
                className="w-full px-2.5 py-1.5 border rounded bg-white"
              >
                {currentTopic?.lessons.map((l) => (
                  <option key={l.id} value={l.id}>{l.fullName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Type, Level & Competency */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Dạng Câu Hỏi:</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as QuestionType)}
                className="w-full px-2.5 py-1.5 border rounded bg-white font-bold text-sky-800"
              >
                <option value="MCQ">Trắc nghiệm (MCQ)</option>
                <option value="TF">Đúng / Sai (TF)</option>
                <option value="SA">Trả lời ngắn (SA)</option>
                <option value="TL">Tự luận (TL)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Mức Độ Nhận Thức:</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as Level)}
                className="w-full px-2.5 py-1.5 border rounded bg-white"
              >
                <option value="biet">Biết (Nhận biết)</option>
                <option value="hieu">Hiểu (Thông hiểu)</option>
                <option value="vandung">Vận dụng</option>
                <option value="vandungcao">Vận dụng cao</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Mã Năng Lực:</label>
              <select
                value={yccd}
                onChange={(e) => setYccd(e.target.value as Competency)}
                className="w-full px-2.5 py-1.5 border rounded bg-white font-mono"
              >
                <option value="NLa">NLa (Sử dụng & quản lý CNTT)</option>
                <option value="NLb">NLb (Ứng xử phù hợp MT số)</option>
                <option value="NLc">NLc (Học tập & tự học)</option>
                <option value="NLd">NLd (Giao tiếp & hợp tác)</option>
                <option value="NLe">NLe (Giải quyết vấn đề)</option>
              </select>
            </div>
          </div>

          {/* YCCĐ Content */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Mô tả Yêu cầu cần đạt (YCCĐ):</label>
            <input
              type="text"
              placeholder="Bắt đầu bằng động từ hành vi: Nhận biết được..., Giải thích được..."
              value={yccdContent}
              onChange={(e) => setYccdContent(e.target.value)}
              className="w-full px-3 py-1.5 border rounded"
            />
          </div>

          {/* Question Stem */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nội dung câu hỏi / Tình huống (q):</label>
            <textarea
              rows={3}
              placeholder="Nhập nội dung câu hỏi (hỗ trợ $công thức$ hoặc ```python)..."
              value={stem}
              onChange={(e) => setStem(e.target.value)}
              className="w-full px-3 py-2 border rounded font-mono text-xs"
            />
          </div>

          {/* Form specific fields */}
          {type === 'MCQ' && (
            <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <label className="block font-bold text-slate-700">4 Phương án & Đáp án đúng:</label>
              {[
                { label: 'A', val: optA, set: setOptA, idx: 0 },
                { label: 'B', val: optB, set: setOptB, idx: 1 },
                { label: 'C', val: optC, set: setOptC, idx: 2 },
                { label: 'D', val: optD, set: setOptD, idx: 3 },
              ].map(item => (
                <div key={item.label} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="mcq_correct"
                    checked={correctMCQ === item.idx}
                    onChange={() => setCorrectMCQ(item.idx)}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                    title="Chọn phương án này là đáp án đúng"
                  />
                  <span className="font-bold w-4">{item.label}.</span>
                  <input
                    type="text"
                    value={item.val}
                    onChange={(e) => item.set(e.target.value)}
                    placeholder={`Nội dung phương án ${item.label}...`}
                    className="flex-1 px-2.5 py-1 border rounded bg-white"
                  />
                </div>
              ))}
            </div>
          )}

          {type === 'TF' && (
            <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <label className="block font-bold text-slate-700">4 Ý Đúng / Sai (a, b, c, d):</label>
              {tfItems.map((item, idx) => (
                <div key={item.key} className="flex items-center space-x-2">
                  <span className="font-bold w-4">{item.key})</span>
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => {
                      const updated = [...tfItems];
                      updated[idx].text = e.target.value;
                      setTfItems(updated);
                    }}
                    placeholder={`Nội dung ý ${item.key}...`}
                    className="flex-1 px-2.5 py-1 border rounded bg-white"
                  />
                  <select
                    value={item.isTrue ? 'true' : 'false'}
                    onChange={(e) => {
                      const updated = [...tfItems];
                      updated[idx].isTrue = e.target.value === 'true';
                      setTfItems(updated);
                    }}
                    className={`px-2 py-1 border rounded font-bold ${
                      item.isTrue ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                    }`}
                  >
                    <option value="true">ĐÚNG</option>
                    <option value="false">SAI</option>
                  </select>
                </div>
              ))}
            </div>
          )}

          {type === 'TL' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Đáp án chi tiết & Hướng dẫn chấm:</label>
              <textarea
                rows={4}
                placeholder="Nội dung đáp án chi tiết theo từng ý gạch đầu dòng..."
                value={essayAnswer}
                onChange={(e) => setEssayAnswer(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg font-semibold hover:bg-slate-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Đang lưu...' : 'Lưu Câu Hỏi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
