'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
  maxReachedStep: number;
}

const STEPS = [
  { num: 1, label: 'Chọn Lớp & Môn' },
  { num: 2, label: 'Ma Trận' },
  { num: 3, label: 'Bản Đặc Tả' },
  { num: 4, label: 'Sinh Đề' },
  { num: 5, label: 'Đáp Án' },
  { num: 6, label: 'Kết Quả Tổng Hợp' }
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  onSelectStep,
  maxReachedStep
}) => {
  return (
    <div className="bg-white border-b border-slate-200 py-3 px-4 no-print shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto">
        <div className="flex items-center space-x-2 sm:space-x-6 min-w-max mx-auto">
          {STEPS.map((s) => {
            const isActive = currentStep === s.num;
            const isCompleted = s.num < currentStep;
            const isAccessible = s.num <= maxReachedStep;

            return (
              <button
                key={s.num}
                onClick={() => isAccessible && onSelectStep(s.num)}
                disabled={!isAccessible}
                className={`flex items-center space-x-2 group focus:outline-none transition ${
                  !isAccessible ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition ${
                    isActive
                      ? 'bg-sky-600 text-white ring-4 ring-sky-100 shadow'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <div className="text-left hidden md:block">
                  <div
                    className={`text-xs font-bold leading-tight ${
                      isActive ? 'text-sky-700' : isCompleted ? 'text-slate-800' : 'text-slate-500'
                    }`}
                  >
                    Bước {s.num}
                  </div>
                  <div
                    className={`text-xs ${
                      isActive ? 'font-semibold text-slate-900' : 'text-slate-500'
                    }`}
                  >
                    {s.label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
