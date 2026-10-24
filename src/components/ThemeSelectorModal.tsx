import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { THEME_LIST, ThemeId } from '../types/theme';
import { X, Palette, Check, Sparkles, RotateCcw } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeSelectorModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { themeId, setTheme, resetTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1280] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-fade-in text-right"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl liquid-glass-panel rounded-3xl p-5 sm:p-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_25px_80px_rgba(0,0,0,0.95),0_0_50px_var(--theme-accent-glow)] max-h-[92vh] overflow-y-auto text-slate-100 custom-scrollbar overflow-hidden flex flex-col gap-4 animate-modal-spring"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="glass-specular-ray" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl liquid-glass-btn flex items-center justify-center text-amber-400 shadow-[0_0_20px_var(--theme-accent-glow)]">
              <Palette className="w-5 h-5" style={{ color: 'var(--theme-accent)' }} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>بەشی ڕووکار و ستایلی نەخشە</span>
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" style={{ color: 'var(--theme-accent)' }} />
              </h3>
              <p className="text-xs text-slate-300">
                هەڵبژاردنی ستایل و تێکەڵەی ڕەنگەکان بەپێی دڵخوازی خۆت
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetTheme}
              className="px-3 py-1.5 rounded-xl liquid-glass-btn text-[11px] font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
              title="گەڕانەوە بۆ ڕووکاری بنەڕەتی"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">بنەڕەتی</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-white liquid-glass-btn transition-colors cursor-pointer"
              title="داخستن"
            >
              <X className="w-4 h-4" />
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
                className={`group relative p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between gap-3 overflow-hidden ${
                  isSelected
                    ? 'border-white/60 bg-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.7),0_0_30px_var(--theme-accent-glow)] scale-[1.02]'
                    : 'border-white/10 hover:border-white/30 bg-black/40 hover:bg-white/5 hover:scale-[1.01]'
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
                  <div className="flex items-center -space-x-2 rtl:space-x-reverse">
                    <span
                      className="w-7 h-7 rounded-full shadow-lg border-2 border-white/60 relative z-10 transition-transform group-hover:scale-110"
                      style={{
                        backgroundColor: item.primaryColor,
                        boxShadow: `0 0 15px ${item.primaryColor}88`,
                      }}
                      title={item.primaryLabel}
                    />
                    <span
                      className="w-7 h-7 rounded-full shadow-md border-2 border-black/50 relative z-0 transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: item.secondaryColor,
                      }}
                      title={item.secondaryLabel}
                    />
                  </div>

                  {/* Active Badge */}
                  {isSelected ? (
                    <span
                      className="flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md"
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
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: item.primaryColor }}
                    />
                    <span className="text-slate-300 font-medium">{item.primaryLabel}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full border border-white/30"
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
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>✓ ڕووکاری هەڵبژێردراو بە شێوەی خۆکار لەسەر ئامێرەکەت دەمێنێتەوە.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl liquid-glass-btn-active text-black font-extrabold text-xs cursor-pointer shadow-md transition-all active:scale-95"
          >
            تەواو
          </button>
        </div>
      </div>
    </div>
  );
};
