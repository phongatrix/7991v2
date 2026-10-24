'use client';

import React from 'react';
import { Database, UploadCloud, Settings, RefreshCw, BookOpen } from 'lucide-react';

interface HeaderProps {
  onOpenQBank: () => void;
  onOpenImport: () => void;
  onOpenConfig: () => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenQBank,
  onOpenImport,
  onOpenConfig,
  onReset
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold shadow-md">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">Ngân Hàng Đề</span>
                <span className="text-sky-600 font-semibold text-sm">| Feng's Exam</span>
                <span className="bg-sky-100 text-sky-800 text-xs px-2 py-0.5 rounded-full font-medium">CV 7991</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                TẠO ĐỀ TỪ NGÂN HÀNG CÂU HỎI · MA TRẬN - BẢN ĐẶC TẢ - ĐỀ - ĐÁP ÁN
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={onReset}
              className="inline-flex items-center px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition"
              title="Làm mới toàn bộ quy trình tạo đề"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Làm Mới
            </button>

            <button
              onClick={onOpenQBank}
              className="inline-flex items-center px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition"
            >
              <Database className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
              Ngân Hàng Câu Hỏi
            </button>

            <button
              onClick={onOpenImport}
              className="inline-flex items-center px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition"
            >
              <UploadCloud className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
              Import Word
            </button>

            <button
              onClick={onOpenConfig}
              className="p-2 text-slate-500 hover:text-slate-700 rounded-md hover:bg-slate-100 transition"
              title="Cấu hình API Key"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
