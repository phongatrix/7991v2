'use client';

import React from 'react';
import { Grade } from '@/lib/types';
import { Award, Clock, FileText, School, Sparkles, ArrowRight } from 'lucide-react';

interface Step1SelectProps {
  grade: Grade;
  setGrade: (g: Grade) => void;
  title: string;
  setTitle: (t: string) => void;
  durationMinutes: number;
  setDurationMinutes: (d: number) => void;
  department: string;
  setDepartment: (d: string) => void;
  school: string;
  setSchool: (s: string) => void;
  variantCount: number;
  setVariantCount: (v: number) => void;
  onNext: () => void;
  onLoadSampleMauPdf: () => void;
}

export const Step1Select: React.FC<Step1SelectProps> = ({
  grade,
  setGrade,
  title,
  setTitle,
  durationMinutes,
  setDurationMinutes,
  department,
  setDepartment,
  school,
  setSchool,
  variantCount,
  setVariantCount,
  onNext,
  onLoadSampleMauPdf
}) => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-sky-600 to-indigo-700 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Bước 1: Chọn Khối, Môn & Thông Tin Đề Thi</h2>
              <p className="text-sky-100 text-xs mt-1">
                Chuẩn hóa cấu trúc theo Công văn 7991/BGDĐT-GDTrH · SGK Kết nối tri thức với cuộc sống
              </p>
            </div>
            <button
              onClick={onLoadSampleMauPdf}
              className="inline-flex items-center px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold backdrop-blur transition border border-white/30"
              title="Nạp ngay ma trận chuẩn 4 phần như file mau.pdf (Tin học 11, 45 phút)"
            >
              <Sparkles className="w-4 h-4 mr-1 text-amber-300" />
              Nạp Đề Mẫu Chuẩn mau.pdf
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Grade selection */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Khối Lớp (Chương trình GDPT 2018 - KNTT)
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['10', '11', '12'] as Grade[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGrade(g)}
                  className={`p-4 rounded-lg border-2 text-center transition flex flex-col items-center justify-center ${
                    grade === g
                      ? 'border-sky-600 bg-sky-50/70 text-sky-900 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <span className="text-2xl font-black mb-1">Lớp {g}</span>
                  <span className="text-xs text-slate-500 font-medium">
                    {g === '10' ? '6 Chủ đề · 34 Bài' : g === '11' ? '7 Chủ đề · 31 Bài (ICT)' : '7 Chủ đề · 28 Bài (ICT)'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Subject & Textbook */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Môn Học</label>
              <input
                type="text"
                readOnly
                value="Tin học (Định hướng Tin học ứng dụng - ICT)"
                className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-md text-sm text-slate-800 font-medium cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Bộ Sách Giáo Khoa</label>
              <input
                type="text"
                readOnly
                value="Kết nối tri thức với cuộc sống (NXB Giáo dục Việt Nam)"
                className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-md text-sm text-slate-800 font-medium cursor-not-allowed"
              />
            </div>
          </div>

          {/* Exam Title & Duration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tiêu Đề Đề Kiểm Tra</label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: ĐỀ KIỂM TRA ĐỊNH KỲ GIỮA HỌC KỲ I"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Thời Gian Làm Bài</label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white"
                >
                  <option value={15}>15 phút (Kiểm tra thường xuyên)</option>
                  <option value={45}>45 phút (Kiểm tra 1 tiết / Giữa kỳ)</option>
                  <option value={60}>60 phút</option>
                  <option value={90}>90 phút (Kiểm tra Cuối kỳ)</option>
                </select>
              </div>
            </div>
          </div>

          {/* School & Variant Count */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Sở GD&ĐT</label>
              <div className="relative">
                <School className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="SỞ GIÁO DỤC & ĐÀO TẠO ĐỒNG THÁP"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Trường THPT</label>
              <div className="relative">
                <School className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder="TRƯỜNG THPT TRƯƠNG ĐỊNH"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Số Mã Đề Muốn Trộn</label>
              <div className="relative">
                <Award className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  value={variantCount}
                  onChange={(e) => setVariantCount(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white"
                >
                  <option value={1}>1 mã đề (001)</option>
                  <option value={2}>2 mã đề (001, 002)</option>
                  <option value={4}>4 mã đề (001, 002, 003, 004)</option>
                  <option value={6}>6 mã đề (001 - 006)</option>
                  <option value={8}>8 mã đề (001 - 008)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              onClick={onNext}
              className="inline-flex items-center px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-sm shadow-md hover:shadow-lg transition space-x-2"
            >
              <span>Tiếp tục: Xây dựng Ma Trận</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
