import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share, PlusSquare, X, Shield, Sparkles } from 'lucide-react';

const BATTLE_SCHOLAR_BG = '/src/assets/images/kurd_battle_scholar_bg_1791793720708.jpg';
const KURD_MAP_ICON = '/src/assets/images/kurd_map_pwa_icon_1791793702859.jpg';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isOpen, setIsOpen] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // If already installed or explicitly dismissed, don't show the floating prompt
  if (isInstalled || dismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setIsOpen(false);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // General instructions modal
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      {/* Floating Compact Install Pill (Corner) */}
      <div className="fixed top-3 left-3 z-30 animate-fade-in pointer-events-auto">
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#080d1a]/90 hover:bg-[#0e162b] border border-amber-500/50 hover:border-amber-400 text-amber-300 shadow-[0_4px_20px_rgba(0,0,0,0.8),0_0_15px_rgba(245,158,11,0.2)] backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          title="دابەزاندنی ئەپی KURDISTAN INFO MAP"
        >
          <img
            src={KURD_MAP_ICON}
            alt="KURDISTAN INFO MAP"
            className="w-4 h-4 rounded-full object-cover border border-amber-400/60 group-hover:scale-110 transition-transform"
          />
          <span className="text-[10px] font-bold text-white tracking-wide">
            دابەزاندنی ئەپ
          </span>
          <Download className="w-3 h-3 text-amber-400 group-hover:translate-y-0.5 transition-transform" />
        </button>
      </div>

      {/* Main PWA Install Modal with Battle & Scholar Epic Background */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in text-right">
          <div
            className="relative w-full max-w-md rounded-2xl overflow-hidden border border-amber-500/40 shadow-[0_20px_60px_rgba(0,0,0,0.95),0_0_35px_rgba(245,158,11,0.25)] bg-[#090d16] text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Atmospheric Header with Kurdish Battles & Scholars Image Background */}
            <div className="relative h-44 sm:h-48 w-full overflow-hidden">
              <img
                src={BATTLE_SCHOLAR_BG}
                alt="Kurdish Battles & Scholars Background"
                className="w-full h-full object-cover object-center filter brightness-90 contrast-110 scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-[#090d16]/60 to-black/40" />

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-2.5 right-2.5 p-1 rounded-full bg-black/70 hover:bg-black text-slate-300 hover:text-white border border-slate-700/80 transition-colors cursor-pointer z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Badge: Online PWA */}
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[9px] font-mono shadow-md backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>ئۆنڵاین PWA</span>
              </div>

              {/* Kurdistan Map App Icon floating over the center */}
              <div className="absolute -bottom-2 right-4 flex items-end gap-3 z-10">
                <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-[0_8px_25px_rgba(0,0,0,0.9),0_0_20px_rgba(245,158,11,0.5)] bg-black shrink-0">
                  <img
                    src={KURD_MAP_ICON}
                    alt="KURDISTAN INFO MAP"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="pb-3 text-right">
                  <h3 className="text-base sm:text-lg font-black tracking-wide text-white drop-shadow-md">
                    KURDISTAN INFO MAP
                  </h3>
                  <p className="text-[10px] text-amber-300/90 font-medium">
                    ئینسایکلۆپیدیای دەسەڵاتە مێژووییەکانی کوردستان
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 pt-3 space-y-3.5">
              <p className="text-xs text-slate-300 leading-relaxed">
                ئەپی <strong className="text-amber-400 font-bold">KURDISTAN INFO MAP</strong> دابەزێنە بۆ سەر شاشەی مۆبایل یان کۆمپیوتەرەکەت بۆ دەستگەیشتنی خێرا، دۆخی فول سکرین، و کارکردنی ئۆنڵاینی نەخشەکە بە خێرایی باڵا.
              </p>

              {/* Feature Points */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="p-2 rounded-xl bg-black/60 border border-indigo-950/80 flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-slate-200">ئەپی فەرمی و سەربەخۆ</span>
                </div>
                <div className="p-2 rounded-xl bg-black/60 border border-indigo-950/80 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-slate-200">هەموو میرنشین و جەنگەکان</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-2 border-t border-indigo-950/60">
                <button
                  onClick={handleInstallClick}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 hover:from-amber-500 hover:to-amber-300 text-black font-extrabold text-xs shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-black" />
                  <span>دابەزاندنی یەکسەر</span>
                </button>

                <button
                  onClick={() => {
                    setIsOpen(false);
                    setDismissed(true);
                  }}
                  className="px-3 py-2.5 rounded-xl bg-black/60 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs transition-colors cursor-pointer"
                >
                  دوایی
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md text-right">
          <div
            className="w-full max-w-sm rounded-2xl bg-[#090d16] border border-amber-500/40 p-4 sm:p-5 shadow-2xl text-white space-y-3 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-indigo-950">
              <h4 className="font-bold text-sm text-amber-400">
                چۆنیەتی دابەزاندن لەسەر ئایفۆن (iOS)
              </h4>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ol className="text-xs text-slate-300 space-y-2.5 list-decimal list-inside leading-relaxed">
              <li className="flex items-start gap-2">
                <Share className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <span>لە خوارەوەی وێبگەڕی سەفاری کلیک لەسەر دوگمەی <strong>Share</strong> (هاوبەشکردن) بکە.</span>
              </li>
              <li className="flex items-start gap-2">
                <PlusSquare className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <span>هەڵبژاردنی <strong>Add to Home Screen</strong> (زیادکردن بۆ سەر شاشە) دیاری بکە.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-400 shrink-0">٣.</span>
                <span>پاشان لە سەرەوە کلیک لە <strong>Add</strong> بکە تا ئایکۆنی ئەپەکە زیاد بێت.</span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2 rounded-xl bg-amber-500 text-black font-bold text-xs mt-2 cursor-pointer"
            >
              تێگەیشتم
            </button>
          </div>
        </div>
      )}
    </>
  );
};
