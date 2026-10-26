'use client';

import React from 'react';
import { Question, Level, LEVELS, LEVEL_LABELS } from '@/lib/types';
import { Sparkles, Check, Loader2 } from 'lucide-react';

/* ===== Form soạn thảo dùng chung: câu AI vừa tạo & câu có sẵn trong kho ===== */
export const DraftEditor: React.FC<{
  draft: Question;
  onChange: (patch: Partial<Question>) => void;
  onSave: () => void;
  saving: boolean;
  title: string;
  saveLabel: string;
}> = ({ draft, onChange, onSave, saving, title, saveLabel }) => {
  const letters = ['A', 'B', 'C', 'D'];
  const subLetters = ['a', 'b', 'c', 'd'];
  return (
    <div className="border-2 border-purple-200 rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 bg-purple-50 border-b border-purple-200 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-bold text-purple-900">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span>{title}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">{draft.type}</span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">{LEVEL_LABELS[draft.level]}</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">{draft.yccd}</span>
        </div>
      </div>

      <div className="p-4 space-y-3 text-xs">
        <div>
          <label className="block font-bold text-slate-700 mb-1">Nội dung câu hỏi {draft.type === 'TF' ? '(lời dẫn tình huống)' : ''}:</label>
          <textarea
            value={draft.q}
            onChange={(e) => onChange({ q: e.target.value })}
            rows={draft.type === 'TF' ? 4 : 3}
            className="w-full px-2.5 py-2 border border-slate-300 rounded-md font-mono text-[11px] focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Mô tả Yêu cầu cần đạt (YCCĐ):</label>
          <input
            value={draft.yccdContent || ''}
            onChange={(e) => onChange({ yccdContent: e.target.value })}
            className="w-full px-2.5 py-2 border border-slate-300 rounded-md"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Mã năng lực:</label>
            <select
              value={draft.yccd || 'NLa'}
              onChange={(e) => onChange({ yccd: e.target.value as Question['yccd'] })}
              className="w-full px-2.5 py-2 border border-slate-300 rounded-md bg-white font-mono"
            >
              <option value="NLa">NLa — Sử dụng &amp; quản lý CNTT</option>
              <option value="NLb">NLb — Ứng xử môi trường số</option>
              <option value="NLc">NLc — Học tập &amp; tự học</option>
              <option value="NLd">NLd — Giao tiếp &amp; hợp tác</option>
              <option value="NLe">NLe — Giải quyết vấn đề</option>
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Mức độ:</label>
            <select
              value={draft.level}
              onChange={(e) => onChange({ level: e.target.value as Level })}
              className="w-full px-2.5 py-2 border border-slate-300 rounded-md bg-white"
            >
              {LEVELS.map(lv => <option key={lv} value={lv}>{LEVEL_LABELS[lv]}</option>)}
            </select>
          </div>
        </div>

        {draft.type === 'MCQ' && draft.a && (
          <div>
            <label className="block font-bold text-slate-700 mb-1">4 phương án (chọn tròn vào đáp án đúng):</label>
            <div className="space-y-1.5">
              {draft.a.map((opt, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name={`draftCorrect-${draft.id}`}
                    checked={draft.correct === i}
                    onChange={() => onChange({ correct: i })}
                    className="w-4 h-4 accent-emerald-600 flex-shrink-0"
                    title="Chọn làm đáp án đúng"
                  />
                  <span className="font-bold text-slate-600 w-5">{letters[i]}.</span>
                  <input
                    value={opt}
                    onChange={(e) => {
                      const a = [...draft.a!];
                      a[i] = e.target.value;
                      onChange({ a: a as Question['a'] });
                    }}
                    className={`flex-1 px-2.5 py-1.5 border rounded-md ${draft.correct === i ? 'border-emerald-400 bg-emerald-50/60 font-semibold' : 'border-slate-300'}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {draft.type === 'TF' && draft.items && (
          <div>
            <label className="block font-bold text-slate-700 mb-1">4 ý a–d (tick = ĐÚNG, bỏ tick = SAI):</label>
            <div className="space-y-1.5">
              {draft.items.map((it, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={it.isTrue}
                    onChange={(e) => {
                      const items = [...draft.items!];
                      items[i] = { ...items[i], isTrue: e.target.checked };
                      onChange({ items });
                    }}
                    className={`w-4 h-4 flex-shrink-0 ${it.isTrue ? 'accent-emerald-600' : 'accent-rose-600'}`}
                    title={it.isTrue ? 'Ý này ĐÚNG' : 'Ý này SAI'}
                  />
                  <span className="font-bold text-slate-600 w-4">{subLetters[i]})</span>
                  <input
                    value={it.text}
                    onChange={(e) => {
                      const items = [...draft.items!];
                      items[i] = { ...items[i], text: e.target.value };
                      onChange({ items });
                    }}
                    className={`flex-1 px-2.5 py-1.5 border rounded-md ${it.isTrue ? 'border-emerald-300 bg-emerald-50/50' : 'border-rose-200 bg-rose-50/40'}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {draft.type === 'SA' && (
          <div>
            <label className="block font-bold text-slate-700 mb-1">Đáp án (số, tối đa 4 ký tự):</label>
            <input
              value={draft.correctSA || ''}
              onChange={(e) => onChange({ correctSA: e.target.value.slice(0, 4) })}
              className="w-32 px-2.5 py-2 border border-slate-300 rounded-md font-mono font-bold text-center"
            />
          </div>
        )}

        {draft.type === 'TL' && (
          <div>
            <label className="block font-bold text-slate-700 mb-1">Đáp án chi tiết:</label>
            <textarea
              value={draft.essayAnswer || ''}
              onChange={(e) => onChange({ essayAnswer: e.target.value })}
              rows={6}
              className="w-full px-2.5 py-2 border border-slate-300 rounded-md font-mono text-[11px]"
            />
          </div>
        )}

        <button
          onClick={onSave}
          disabled={saving}
          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold rounded-lg shadow transition flex items-center justify-center space-x-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang lưu...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>{saveLabel}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
