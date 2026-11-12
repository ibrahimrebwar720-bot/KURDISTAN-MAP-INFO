import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { THEME_LIST, ThemeId } from '../types/theme';
import { X, Palette, Check, Sparkles, RotateCcw, Sun, Moon } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeSelectorModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { themeId, setTheme, resetTheme, colorMode, setColorMode } = useTheme();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1280] flex items-center justify-center p-3 sm:p-4 bg-black/85 animate-fade-in text-right"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-[#0b0f1c] border border-amber-500/30 border-t-amber-400/50 rounded-[4px] p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.95)] max-h-[92vh] overflow-y-auto text-slate-100 custom-scrollbar overflow-hidden flex flex-col gap-4 animate-modal-spring"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[4px] bg-[#101626] border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
              <Palette className="w-5 h-5" style={{ color: 'var(--theme-accent)' }} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>بەشی ڕووکار و ستایلی نەخشە</span>
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" style={{ color: 'var(--theme-accent)' }} />
              </h3>
              <p className="text-xs text-slate-300">
                هەڵبژاردنی دۆخی ڕووناکی، ستایل و تێکەڵەی ڕەنگەکان بەپێی دڵخوازی خۆت
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetTheme}
              className="px-3 py-1.5 rounded-[4px] bg-[#101626] border border-amber-500/25 hover:border-amber-400/60 text-[11px] font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
              title="گەڕانەوە بۆ ڕووکاری بنەڕەتی"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">بنەڕەتی</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-[4px] flex items-center justify-center text-slate-300 hover:text-white bg-[#101626] border border-amber-500/25 hover:border-amber-400/60 transition-colors cursor-pointer"
              title="داخستن"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Color Mode Switch (ڕووناکی نەرم / دۆخی تاریک بە سێبەری فەید) */}
        <div className="p-3 sm:p-4 rounded-[4px] bg-[#070b14] border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-9 h-9 rounded-[4px] bg-[#101626] border border-amber-500/25 flex items-center justify-center shrink-0">
              {colorMode === 'light' ? (
                <Sun className="w-4.5 h-4.5 text-amber-500" />
              ) : (
                <Moon className="w-4.5 h-4.5 text-amber-400" />
              )}
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-white block">
                دۆخی دیمەن (ڕووناک / تاریک)
              </span>
              <span className="text-[11px] text-slate-300 block">
                سپێیەکی نەرمی کەرەیی و شوشەی پۆرسەلین بە سێبەری فەید بۆ دوگمەکان
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-[4px] bg-black/40 border border-amber-500/20 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setColorMode('light')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-[3px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                colorMode === 'light'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-950" />
              <span>دۆخی ڕووناک</span>
            </button>
            <button
              type="button"
              onClick={() => setColorMode('dark')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-[3px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                colorMode === 'dark'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-amber-950" />
              <span>دۆخی تاریک</span>
            </button>
          </div>
        </div>

        {/* Theme Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {THEME_LIST.map((item) => {
            const isSelected = themeId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => setTheme(item.id as ThemeId)}
                className={`group relative p-4 rounded-[4px] border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 overflow-hidden ${
                  isSelected
                    ? 'border-amber-400/80 bg-[#121829] shadow-[0_8px_25px_rgba(0,0,0,0.8),0_0_20px_var(--theme-accent-glow)]'
                    : 'border-amber-500/20 hover:border-amber-400/50 bg-[#0e1424] hover:bg-[#121829]'
                }`}
                style={{
                  background: isSelected ? item.panelGradient : undefined,
                }}
              >
                {/* Active Glow Accent bar */}
                {isSelected && (
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{
                      background: `linear-gradient(90deg, ${item.primaryColor}, ${item.secondaryColor})`,
                    }}
                  />
                )}

                {/* Top Row: Dual Swatches & Selection Badge */}
                <div className="flex items-center justify-between gap-2">
                  {/* Dual Color Swatch Bubble */}
                  <div className="flex items-center -space-x-1 rtl:space-x-reverse">
                    <span
                      className="w-6 h-6 rounded-[3px] shadow-md border border-white/60 relative z-10 transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: item.primaryColor,
                        boxShadow: `0 0 10px ${item.primaryColor}88`,
                      }}
                      title={item.primaryLabel}
                    />
                    <span
                      className="w-6 h-6 rounded-[3px] shadow-sm border border-black/50 relative z-0"
                      style={{
                        backgroundColor: item.secondaryColor,
                      }}
                      title={item.secondaryLabel}
                    />
                  </div>

                  {/* Active Badge */}
                  {isSelected ? (
                    <span
                      className="flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-[3px] shadow-md"
                      style={{
                        backgroundColor: item.primaryColor,
                        color: item.activeBtnText,
                      }}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>چالاکە</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 group-hover:text-slate-200 transition-colors">
                      کلیک بکە بۆ گۆڕین
                    </span>
                  )}
                </div>

                {/* Titles */}
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>{item.name}</span>
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400 block mt-0.5 tracking-tight">
                    {item.englishName}
                  </span>
                  <p className="text-[11px] text-slate-300/90 leading-relaxed mt-2 line-clamp-2">
                    {item.description}
                  </p>
                </div>

                {/* Live Mini Preview Bar */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-[2px]"
                      style={{ backgroundColor: item.primaryColor }}
                    />
                    <span className="text-slate-300 font-medium">{item.primaryLabel}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-[2px] border border-white/30"
                      style={{ backgroundColor: item.secondaryColor }}
                    />
                    <span className="text-slate-300 font-medium">{item.secondaryLabel}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer Note */}
        <div className="pt-3 border-t border-amber-500/20 flex items-center justify-between text-xs text-slate-400">
          <span>✓ ڕووکاری هەڵبژێردراو بە شێوەی خۆکار لەسەر ئامێرەکەت دەمێنێتەوە.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-[4px] bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs cursor-pointer shadow-md transition-all active:scale-95"
          >
            تەواو
          </button>
        </div>
      </div>
    </div>
  );
};
