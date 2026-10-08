import React, { useState } from 'react';
import { Download, Smartphone, X, Share } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  darkMode?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ darkMode = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed standalone PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
        title="Cài đặt ứng dụng Line 98 về màn hình chính"
      >
        <Download size={15} />
        <span>Cài App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 border ${
            darkMode
              ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
          title="Cài đặt Line 98 trên iPhone / iPad"
        >
          <Smartphone size={15} className="text-blue-500" />
          <span>Cài App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className={`w-full max-w-sm rounded-2xl p-6 shadow-2xl border transition-all ${
              darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-800'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <img src={`${import.meta.env.BASE_URL}icon.png`} alt="Line 98" className="w-8 h-8 rounded-lg shadow-sm" />
                  <h3 className="text-base font-bold">Cài đặt Line 98 trên iOS</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 font-bold text-xs shrink-0 mt-0.5">1</span>
                  <p className="text-slate-600 dark:text-slate-300">
                    Nhấn vào nút <span className="inline-flex items-center font-semibold text-blue-500"><Share size={14} className="inline mr-1" /> Chia sẻ (Share)</span> ở thanh công cụ Safari.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 font-bold text-xs shrink-0 mt-0.5">2</span>
                  <p className="text-slate-600 dark:text-slate-300">
                    Cuộn xuống và chọn <strong className="text-slate-800 dark:text-white">Thêm vào MH chính (Add to Home Screen)</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 font-bold text-xs shrink-0 mt-0.5">3</span>
                  <p className="text-slate-600 dark:text-slate-300">
                    Nhấn <strong className="text-slate-800 dark:text-white">Thêm (Add)</strong> ở góc trên bên phải để chơi game không cần mở trình duyệt!
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 text-sm font-semibold text-white shadow-md transition"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
