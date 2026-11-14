import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share, PlusSquare, X, Shield, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const KURD_MAP_ICON = '/src/assets/images/kurd_map_pwa_icon_1791793702859.jpg';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { isEn, dir } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

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
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      {/* Floating Compact Install Pill (Corner) */}
      <div className="fixed top-3 left-3 z-30 animate-fade-in pointer-events-auto">
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#0b0f1c] hover:bg-[#101626] border border-amber-500/35 hover:border-amber-400 text-amber-300 shadow-[0_4px_16px_rgba(0,0,0,0.8)] transition-all active:scale-95 cursor-pointer"
          title={isEn ? 'Install KURDISTAN INFO MAP App' : 'دابەزاندنی ئەپی KURDISTAN INFO MAP'}
        >
          <img
            src={KURD_MAP_ICON}
            alt="KURDISTAN INFO MAP"
            className="w-4 h-4 rounded-[3px] object-cover border border-amber-400/60 group-hover:scale-105 transition-transform shadow-xs"
          />
          <span className="text-[10px] font-bold text-white tracking-wide">
            {isEn ? 'Install App' : 'دابەزاندنی ئەپ'}
          </span>
          <Download className="w-3 h-3 text-amber-400 group-hover:translate-y-0.5 transition-transform" />
        </button>
      </div>

      {/* Main PWA Install Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 animate-fade-in text-start"
          dir={dir}
        >
          <div
            className="relative w-full max-w-md rounded-[4px] overflow-hidden border border-amber-500/30 border-t-amber-400/50 shadow-[0_25px_80px_rgba(0,0,0,0.95)] bg-[#0b0f1c] text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Atmospheric Header */}
            <div className="relative h-32 sm:h-36 w-full overflow-hidden bg-gradient-to-br from-amber-600/20 via-[#0b1020] to-[#070b14] border-b border-amber-500/20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent" />

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-3 end-3 w-8 h-8 rounded-[4px] flex items-center justify-center bg-black/70 hover:bg-black text-slate-300 hover:text-white border border-slate-700/80 transition-colors cursor-pointer z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Badge: Online PWA */}
              <div className="absolute top-3 start-3 flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>{isEn ? 'Online PWA' : 'ئۆنڵاین PWA'}</span>
              </div>

              {/* App Icon */}
              <div className="absolute -bottom-2 start-4 flex items-end gap-3 z-10">
                <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-[4px] overflow-hidden border-2 border-amber-400 shadow-[0_8px_25px_rgba(0,0,0,0.9),0_0_20px_rgba(245,158,11,0.4)] bg-black shrink-0">
                  <img
                    src={KURD_MAP_ICON}
                    alt="KURDISTAN INFO MAP"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="pb-3 text-start">
                  <h3
                    className="text-base sm:text-lg font-black tracking-wide text-white"
                    style={{
                      textShadow: '0 2px 8px rgba(0, 0, 0, 0.85)',
                    }}
                  >
                    KURDISTAN INFO MAP
                  </h3>
                  <p className="text-[10px] text-amber-300/90 font-medium">
                    {isEn
                      ? 'Encyclopedia of Historical Powers in Kurdistan'
                      : 'ئینسایکلۆپیدیای دەسەڵاتە مێژووییەکانی کوردستان'}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 pt-3 space-y-3.5">
              <p className="text-xs text-slate-300 leading-relaxed">
                {isEn ? (
                  <>
                    Install <strong className="text-amber-400 font-bold">KURDISTAN INFO MAP</strong> to your phone or desktop for instant fullscreen access and high-speed historical mapping.
                  </>
                ) : (
                  <>
                    ئەپی <strong className="text-amber-400 font-bold">KURDISTAN INFO MAP</strong> دابەزێنە بۆ سەر شاشەی مۆبایل یان کۆمپیوتەرەکەت بۆ دەستگەیشتنی خێرا، دۆخی فول سکرین، و کارکردنی ئۆنڵاینی نەخشەکە بە خێرایی باڵا.
                  </>
                )}
              </p>

              {/* Feature Points */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="p-2.5 rounded-[4px] bg-[#050812] border border-amber-500/20 flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-slate-200">
                    {isEn ? 'Official Standalone App' : 'ئەپی فەرمی و سەربەخۆ'}
                  </span>
                </div>
                <div className="p-2.5 rounded-[4px] bg-[#050812] border border-amber-500/20 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-slate-200">
                    {isEn ? 'All Principalities & Eras' : 'هەموو میرنشین و جەنگەکان'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-2.5 border-t border-amber-500/15">
                <button
                  onClick={handleInstallClick}
                  className="flex-1 py-2.5 px-4 rounded-[4px] bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs shadow-[0_0_20px_rgba(245,158,11,0.35)] flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-slate-950" />
                  <span>{isEn ? 'Install Now' : 'دابەزاندنی یەکسەر'}</span>
                </button>

                <button
                  onClick={() => {
                    setIsOpen(false);
                    setDismissed(true);
                  }}
                  className="px-3.5 py-2.5 rounded-[4px] bg-black/60 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs transition-colors cursor-pointer"
                >
                  {isEn ? 'Later' : 'دوایی'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 text-start"
          dir={dir}
        >
          <div
            className="w-full max-w-sm rounded-[4px] bg-[#0b0f1c] border border-amber-500/30 border-t-amber-400/50 p-4 sm:p-5 shadow-[0_20px_60px_rgba(0,0,0,0.95)] text-white space-y-3.5 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
              <h4 className="font-bold text-sm text-amber-400">
                {isEn ? 'How to Install on iPhone (iOS)' : 'چۆنیەتی دابەزاندن لەسەر ئایفۆن (iOS)'}
              </h4>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-7 h-7 rounded-[4px] flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ol className="text-xs text-slate-300 space-y-2.5 list-decimal list-inside leading-relaxed">
              <li className="flex items-start gap-2">
                <Share className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <span>
                  {isEn
                    ? <>Tap the <strong>Share</strong> button at the bottom of Safari.</>
                    : <>لە خوارەوەی وێبگەڕی سەفاری کلیک لەسەر دوگمەی <strong>Share</strong> (هاوبەشکردن) بکە.</>}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <PlusSquare className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <span>
                  {isEn
                    ? <>Select <strong>Add to Home Screen</strong> from the menu.</>
                    : <>هەڵبژاردنی <strong>Add to Home Screen</strong> (زیادکردن بۆ سەر شاشە) دیاری بکە.</>}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-400 shrink-0">{isEn ? '3.' : '٣.'}</span>
                <span>
                  {isEn
                    ? <>Tap <strong>Add</strong> in the top corner to install the app icon.</>
                    : <>پاشان لە سەرەوە کلیک لە <strong>Add</strong> بکە تا ئایکۆنی ئەپەکە زیاد بێت.</>}
                </span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-[4px] bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-extrabold text-xs mt-2 cursor-pointer shadow-sm"
            >
              {isEn ? 'Got It' : 'تێگەیشتم'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
