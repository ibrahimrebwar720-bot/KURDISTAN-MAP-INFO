import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share, PlusSquare, X, Shield, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const KURD_MAP_ICON = '/pwa-192x192.png';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { isEn, dir } = useLanguage();
  const { colorMode } = useTheme();
  const isDark = colorMode === 'dark';
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
          className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border transition-all active:scale-95 cursor-pointer ${
            isDark
              ? 'bg-[#0b0f1c] hover:bg-[#101626] border-amber-500/35 hover:border-amber-400 text-amber-300 shadow-[0_4px_16px_rgba(0,0,0,0.8)]'
              : 'bg-white/95 hover:bg-amber-50 border-slate-300 hover:border-amber-600 text-slate-900 shadow-md'
          }`}
          title={isEn ? 'Install KURDISTAN INFO MAP App' : 'دابەزاندنی ئەپی KURDISTAN INFO MAP'}
        >
          <img
            src={KURD_MAP_ICON}
            alt="KURDISTAN INFO MAP"
            className="w-4 h-4 rounded-[3px] object-cover border border-amber-500/60 group-hover:scale-105 transition-transform shadow-xs"
          />
          <span className={`text-[10px] font-bold tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {isEn ? 'Install App' : 'دابەزاندنی ئەپ'}
          </span>
          <Download
            className={`w-3 h-3 group-hover:translate-y-0.5 transition-transform ${
              isDark ? 'text-amber-400' : 'text-amber-800'
            }`}
          />
        </button>
      </div>

      {/* Main PWA Install Modal */}
      {isOpen && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in text-start ${
            isDark ? 'bg-black/85' : 'bg-slate-900/50'
          }`}
          dir={dir}
        >
          <div
            className={`relative w-full max-w-md rounded-[4px] overflow-hidden border ${
              isDark
                ? 'border-amber-500/30 border-t-amber-400/50 shadow-[0_25px_80px_rgba(0,0,0,0.95)] bg-[#0b0f1c] text-white'
                : 'border-slate-300 border-t-amber-600/60 shadow-[0_24px_60px_rgba(15,23,42,0.18)] bg-white text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Atmospheric Header */}
            <div
              className={`relative h-32 sm:h-36 w-full overflow-hidden border-b ${
                isDark
                  ? 'bg-gradient-to-br from-amber-600/20 via-[#0b1020] to-[#070b14] border-amber-500/20'
                  : 'bg-gradient-to-br from-amber-100 via-[#faf7ef] to-[#f4f3ef] border-slate-200'
              }`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent" />

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className={`absolute top-3 end-3 w-8 h-8 rounded-[4px] flex items-center justify-center border transition-colors cursor-pointer z-10 ${
                  isDark
                    ? 'bg-black/70 hover:bg-black text-slate-300 hover:text-white border-slate-700/80'
                    : 'bg-white/90 hover:bg-slate-100 text-slate-700 hover:text-slate-950 border-slate-300'
                }`}
              >
                <X className="w-4 h-4" />
              </button>

              {/* Badge: Online PWA */}
              <div
                className={`absolute top-3 start-3 flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] border text-[10px] font-mono font-bold shadow-xs ${
                  isDark
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                    : 'bg-amber-100 border-amber-300 text-amber-900'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDark ? 'bg-amber-400' : 'bg-amber-700'}`} />
                <span>{isEn ? 'Online PWA' : 'ئۆنڵاین PWA'}</span>
              </div>

              {/* App Icon */}
              <div className="absolute -bottom-2 start-4 flex items-end gap-3 z-10">
                <div
                  className={`relative w-16 h-16 sm:w-18 sm:h-18 rounded-[4px] overflow-hidden border-2 bg-black shrink-0 ${
                    isDark
                      ? 'border-amber-400 shadow-[0_8px_25px_rgba(0,0,0,0.9),0_0_20px_rgba(245,158,11,0.4)]'
                      : 'border-amber-700 shadow-lg'
                  }`}
                >
                  <img
                    src={KURD_MAP_ICON}
                    alt="KURDISTAN INFO MAP"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="pb-3 text-start">
                  <h3
                    className={`text-base sm:text-lg font-black tracking-wide ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                    style={isDark ? { textShadow: '0 2px 8px rgba(0, 0, 0, 0.85)' } : undefined}
                  >
                    KURDISTAN INFO MAP
                  </h3>
                  <p className={`text-[10px] font-medium ${isDark ? 'text-amber-300/90' : 'text-amber-900'}`}>
                    {isEn
                      ? 'Encyclopedia of Historical Powers in Kurdistan'
                      : 'ئینسایکلۆپیدیای دەسەڵاتە مێژووییەکانی کوردستان'}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 pt-3 space-y-3.5">
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {isEn ? (
                  <>
                    Install <strong className={isDark ? 'text-amber-400 font-bold' : 'text-amber-800 font-bold'}>KURDISTAN INFO MAP</strong> to your phone or desktop for instant fullscreen access and high-speed historical mapping.
                  </>
                ) : (
                  <>
                    ئەپی <strong className={isDark ? 'text-amber-400 font-bold' : 'text-amber-800 font-bold'}>KURDISTAN INFO MAP</strong> دابەزێنە بۆ سەر شاشەی مۆبایل یان کۆمپیوتەرەکەت بۆ دەستگەیشتنی خێرا، دۆخی فول سکرین، و کارکردنی ئۆنڵاینی نەخشەکە بە خێرایی باڵا.
                  </>
                )}
              </p>

              {/* Feature Points */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div
                  className={`p-2.5 rounded-[4px] border flex items-center gap-2 ${
                    isDark ? 'bg-[#050812] border-amber-500/20' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <Shield className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-800'}`} />
                  <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                    {isEn ? 'Official Standalone App' : 'ئەپی فەرمی و سەربەخۆ'}
                  </span>
                </div>
                <div
                  className={`p-2.5 rounded-[4px] border flex items-center gap-2 ${
                    isDark ? 'bg-[#050812] border-amber-500/20' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <Sparkles className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-800'}`} />
                  <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                    {isEn ? 'All Principalities & Eras' : 'هەموو میرنشین و جەنگەکان'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                className={`pt-2 flex items-center justify-between gap-2.5 border-t ${
                  isDark ? 'border-amber-500/15' : 'border-slate-200'
                }`}
              >
                <button
                  onClick={handleInstallClick}
                  className={`flex-1 py-2.5 px-4 rounded-[4px] font-extrabold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
                    isDark
                      ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.35)]'
                      : 'bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white shadow-md preserve-contrast'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  <span>{isEn ? 'Install Now' : 'دابەزاندنی یەکسەر'}</span>
                </button>

                <button
                  onClick={() => {
                    setIsOpen(false);
                    setDismissed(true);
                  }}
                  className={`px-3.5 py-2.5 rounded-[4px] border text-xs transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-black/60 hover:bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 hover:text-slate-950'
                  }`}
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
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 text-start ${
            isDark ? 'bg-black/85' : 'bg-slate-900/50'
          }`}
          dir={dir}
        >
          <div
            className={`w-full max-w-sm rounded-[4px] border p-4 sm:p-5 space-y-3.5 animate-fade-in ${
              isDark
                ? 'bg-[#0b0f1c] border-amber-500/30 border-t-amber-400/50 shadow-[0_20px_60px_rgba(0,0,0,0.95)] text-white'
                : 'bg-white border-slate-300 border-t-amber-600/60 shadow-[0_24px_60px_rgba(15,23,42,0.18)] text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`flex items-center justify-between pb-2 border-b ${
                isDark ? 'border-amber-500/20' : 'border-slate-200'
              }`}
            >
              <h4 className={`font-bold text-sm ${isDark ? 'text-amber-400' : 'text-amber-900'}`}>
                {isEn ? 'How to Install on iPhone (iOS)' : 'چۆنیەتی دابەزاندن لەسەر ئایفۆن (iOS)'}
              </h4>
              <button
                onClick={() => setShowIOSGuide(false)}
                className={`w-7 h-7 rounded-[4px] flex items-center justify-center cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ol className={`text-xs space-y-2.5 list-decimal list-inside leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <li className="flex items-start gap-2">
                <Share className={`w-4 h-4 mt-0.5 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-800'}`} />
                <span>
                  {isEn
                    ? <>Tap the <strong>Share</strong> button at the bottom of Safari.</>
                    : <>لە خوارەوەی وێبگەڕی سەفاری کلیک لەسەر دوگمەی <strong>Share</strong> (هاوبەشکردن) بکە.</>}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <PlusSquare className={`w-4 h-4 mt-0.5 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-800'}`} />
                <span>
                  {isEn
                    ? <>Select <strong>Add to Home Screen</strong> from the menu.</>
                    : <>هەڵبژاردنی <strong>Add to Home Screen</strong> (زیادکردن بۆ سەر شاشە) دیاری بکە.</>}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className={`font-bold shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>{isEn ? '3.' : '٣.'}</span>
                <span>
                  {isEn
                    ? <>Tap <strong>Add</strong> in the top corner to install the app icon.</>
                    : <>پاشان لە سەرەوە کلیک لە <strong>Add</strong> بکە تا ئایکۆنی ئەپەکە زیاد بێت.</>}
                </span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSGuide(false)}
              className={`w-full py-2.5 rounded-[4px] font-extrabold text-xs mt-2 cursor-pointer shadow-sm ${
                isDark
                  ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950'
                  : 'bg-gradient-to-r from-amber-700 to-amber-600 text-white preserve-contrast'
              }`}
            >
              {isEn ? 'Got It' : 'تێگەیشتم'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
