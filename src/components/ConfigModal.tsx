'use client';

import React, { useState, useEffect } from 'react';
import { X, Key, ShieldCheck, Check, PlayCircle, Loader2, AlertTriangle, ChevronDown, ChevronUp, ExternalLink, BookOpenCheck } from 'lucide-react';
import { DEFAULT_GEMINI_MODEL } from '@/lib/types';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GeminiModelInfo {
  id: string;
  name: string;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose }) => {
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState(DEFAULT_GEMINI_MODEL);
  const [hasServerGemini, setHasServerGemini] = useState(false);
  const [saved, setSaved] = useState(false);

  // Kiểm tra API key + danh sách model thật từ Gemini API
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [models, setModels] = useState<GeminiModelInfo[]>([]);
  const [showGuide, setShowGuide] = useState(false);

  const loadModels = async (typedKey: string) => {
    const res = await fetch('/api/ai/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(typedKey ? { apiKey: typedKey } : {})
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không truy vấn được danh sách model');
    return data.models as GeminiModelInfo[];
  };

  useEffect(() => {
    if (isOpen) {
      setTestResult(null);
      setModels([]);
      fetch('/api/config')
        .then(res => res.json())
        .then(data => {
          setHasServerGemini(data.hasGeminiKey);
          if (data.geminiModel) setGeminiModel(data.geminiModel);
          // Đã có key trên server → lấy luôn danh sách model thật
          if (data.hasGeminiKey) {
            loadModels('')
              .then(ms => setModels(ms))
              .catch(() => { /* key server có thể chưa hợp lệ, bỏ qua */ });
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    if (!geminiKey && !hasServerGemini) {
      setTestResult({ ok: false, message: 'Vui lòng nhập API key Gemini trước khi kiểm tra.' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const ms = await loadModels(geminiKey);
      setModels(ms);
      const hasDefault = ms.some(m => m.id === geminiModel);
      setTestResult({
        ok: true,
        message: `Kết nối thành công! Tìm thấy ${ms.length} model Gemini${hasDefault ? ` — model "${geminiModel}" khả dụng.` : ` (model "${geminiModel}" không có trong danh sách, hãy chọn model khác).`}`
      });
    } catch (err) {
      setTestResult({ ok: false, message: `Kiểm tra thất bại: ${(err as Error).message}` });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geminiKey: geminiKey || undefined,
          geminiModel
        })
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => {
          setSaved(false);
          onClose();
        }, 1200);
      }
    } catch (err) {
      alert((err as Error).message);
    }
  };

  // Gộp model mặc định (đặt đầu tiên) với danh sách model thật từ API
  const modelOptions: GeminiModelInfo[] = [{ id: DEFAULT_GEMINI_MODEL, name: 'Gemini 3.8 Flash (Mặc định)' }];
  for (const m of models) {
    if (m.id !== DEFAULT_GEMINI_MODEL && !modelOptions.some(o => o.id === m.id)) {
      modelOptions.push(m);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in duration-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-sky-600" />
            <h3 className="text-base font-bold text-slate-900">Cấu Hình API Key AI (Server-side)</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className="p-3 bg-sky-50 border border-sky-200 text-sky-950 rounded-lg flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-sky-600 mt-0.5 flex-shrink-0" />
            <span>
              Theo Mục 3 &amp; 7 của quy chuẩn, API key chỉ được lưu và gọi từ server-side, tuyệt đối không lộ trong mã client.
            </span>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Google Gemini API Key:
              {hasServerGemini && <span className="ml-2 text-emerald-600 font-semibold">(Đã cấu hình trên Server)</span>}
            </label>
            <div className="flex space-x-2">
              <input
                type="password"
                placeholder={hasServerGemini ? "••••••••••••••••••••••••" : "Nhập API key Gemini..."}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-md font-mono"
              />
              <button
                onClick={handleTest}
                disabled={testing}
                className="inline-flex items-center px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold rounded-md shadow-sm transition flex-shrink-0"
                title="Kiểm tra API key và tải danh sách model Gemini"
              >
                {testing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Đang test...
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4 mr-1" />
                    Test
                  </>
                )}
              </button>
            </div>

            {testResult && (
              <div className={`mt-2 p-2.5 rounded-lg border flex items-start space-x-1.5 ${
                testResult.ok
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                {testResult.ok ? (
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                )}
                <span className="leading-relaxed">{testResult.message}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Model Gemini Mặc Định:
              {models.length > 0 && <span className="ml-2 text-slate-400 font-normal">({models.length} model khả dụng)</span>}
            </label>
            <select
              value={geminiModel}
              onChange={(e) => setGeminiModel(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white font-medium"
            >
              {modelOptions.map(m => (
                <option key={m.id} value={m.id}>
                  {m.id === DEFAULT_GEMINI_MODEL ? m.name : `${m.id}${m.name ? ` — ${m.name}` : ''}`}
                </option>
              ))}
            </select>
          <p className="mt-1 text-[11px] text-slate-500">
            Bấm <b>Test</b> để truy vấn các model Gemini hiện có trên tài khoản của bạn; danh sách sẽ cập nhật vào ô chọn.
          </p>
          </div>

          {/* Hướng dẫn lấy Gemini API Key */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="w-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left transition"
            >
              <span className="flex items-center font-bold text-slate-800">
                <BookOpenCheck className="w-4 h-4 mr-2 text-sky-600" />
                Hướng dẫn lấy Gemini API Key
              </span>
              {showGuide ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>

            {showGuide && (
              <div className="px-4 py-3 bg-white text-[11.5px] leading-relaxed text-slate-700 border-t border-slate-200 space-y-2.5">
                <p className="font-bold text-slate-800">Các bước lấy Gemini API Key:</p>

                <div>
                  <p><b>1. Truy cập Google AI Studio:</b> Mở trình duyệt và đi đến trang Google AI Studio{' '}
                    <a href="https://aistudio.google.com/api-keys" target="_blank" rel="noopener noreferrer"
                      className="text-sky-600 hover:underline inline-flex items-center font-semibold">
                      aistudio.google.com/api-keys
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>.
                  </p>
                </div>

                <div>
                  <p><b>2. Đăng nhập tài khoản:</b> Nhấp vào nút đăng nhập và sử dụng tài khoản Google (Gmail) của bạn.</p>
                </div>

                <div>
                  <p><b>3. Tạo API Key:</b></p>
                  <ul className="list-disc list-inside pl-2 space-y-1 mt-1">
                    <li>Tại giao diện chính, tìm và nhấp vào mục <b>"Get API key"</b> (ở cột bên trái hoặc góc màn hình).</li>
                    <li>Nhấp tiếp vào nút <b>"+ Create API key"</b>.</li>
                    <li>Chọn một Dự án (Project) có sẵn trên Google Cloud hoặc để mặc định nếu dùng tài khoản cá nhân thông thường, sau đó xác nhận tạo.</li>
                  </ul>
                </div>

                <div>
                  <p><b>4. Sao chép mã:</b> Một chuỗi ký tự dài sẽ hiện ra, hãy bấm sao chép và lưu trữ mã này thật cẩn thận.</p>
                </div>

                <a href="https://aistudio.google.com/api-keys" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1.5 mt-1 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-md transition">
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  Mở Google AI Studio
                </a>
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow transition flex items-center justify-center space-x-2"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Đã lưu thành công!</span>
              </>
            ) : (
              <span>Lưu Cấu Hình</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
