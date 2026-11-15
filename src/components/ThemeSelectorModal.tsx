import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { THEME_LIST, ThemeId } from '../types/theme';
import { X, Palette, Check, Sparkles, RotateCcw, Sun, Moon } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeSelectorModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { themeId, setTheme, resetTheme, colorMode, setColorMode } = useTheme();
  const { isEn, dir } = useLanguage();
  const isDark = colorMode === 'dark';

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[1280] flex items-center justify-center p-3 sm:p-4 animate-fade-in text-start ${
        isDark ? 'bg-black/85' : 'bg-slate-900/50'
      }`}
      dir={dir}
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-3xl rounded-[4px] p-5 sm:p-7 max-h-[92vh] overflow-y-auto custom-scrollbar flex flex-col gap-4 animate-modal-spring ${
          isDark
            ? 'bg-[#0b0f1c] border border-amber-500/30 border-t-amber-400/50 text-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.95)]'
            : 'bg-[#ffffff] border border-slate-300 border-t-amber-600/60 text-slate-900 shadow-[0_24px_60px_rgba(15,23,42,0.18)]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between pb-4 border-b ${
            isDark ? 'border-amber-500/20' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-[4px] flex items-center justify-center border ${
                isDark
                  ? 'bg-[#101626] border-amber-500/30 text-amber-400 shadow-[0_2px_10px_rgba(0,0,0,0.5)]'
                  : 'bg-amber-50 border-amber-300 text-amber-800 shadow-xs'
              }`}
            >
              <Palette className="w-5 h-5" style={{ color: 'var(--theme-accent)' }} />
            </div>
            <div>
              <h3
                className={`text-base sm:text-lg font-bold flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <span>{isEn ? 'Map Appearance & Themes' : 'بەشی ڕووکار و ستایلی نەخشە'}</span>
                <Sparkles
                  className="w-4 h-4 animate-pulse"
                  style={{ color: 'var(--theme-accent)' }}
                />
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {isEn
                  ? 'Customize brightness mode, architectural palette, and accent highlights'
                  : 'هەڵبژاردنی دۆخی ڕووناکی، ستایل و تێکەڵەی ڕەنگەکان بەپێی دڵخوازی خۆت'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetTheme}
              className={`px-3 py-1.5 rounded-[4px] border text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#101626] border-amber-500/25 hover:border-amber-400/60 text-slate-300 hover:text-white'
                  : 'bg-slate-100 border-slate-300 hover:border-amber-600 text-slate-700 hover:text-slate-900'
              }`}
              title={isEn ? 'Reset to default theme' : 'گەڕانەوە بۆ ڕووکاری بنەڕەتی'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isEn ? 'Default' : 'بنەڕەتی'}</span>
            </button>
            <button
              onClick={onClose}
              className={`w-9 h-9 rounded-[4px] flex items-center justify-center border transition-colors cursor-pointer ${
                isDark
                  ? 'text-slate-300 hover:text-white bg-[#101626] border-amber-500/25 hover:border-amber-400/60'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100 border-slate-300 hover:border-amber-600'
              }`}
              title={isEn ? 'Close' : 'داخستن'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Color Mode Switch */}
        <div
          className={`p-3 sm:p-4 rounded-[4px] border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs ${
            isDark ? 'bg-[#070b14] border-amber-500/20' : 'bg-[#f4f3ef] border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div
              className={`w-9 h-9 rounded-[4px] border flex items-center justify-center shrink-0 ${
                isDark ? 'bg-[#101626] border-amber-500/25' : 'bg-white border-slate-300'
              }`}
            >
              {colorMode === 'light' ? (
                <Sun className="w-4.5 h-4.5 text-amber-700" />
              ) : (
                <Moon className="w-4.5 h-4.5 text-amber-400" />
              )}
            </div>
            <div>
              <span
                className={`text-xs sm:text-sm font-bold block ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {isEn ? 'Display Mode (Light / Dark)' : 'دۆخی دیمەن (ڕووناک / تاریک)'}
              </span>
              <span className={`text-[11px] block ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {isEn
                  ? 'Soft Nordic parchment highlights or deep obsidian slate canvas'
                  : 'سپێیەکی نەرمی کەرەیی و شوشەی پۆرسەلین بە سێبەری فەید بۆ دوگمەکان'}
              </span>
            </div>
          </div>

          <div
            className={`flex items-center gap-1.5 p-1 rounded-[4px] border shrink-0 w-full sm:w-auto ${
              isDark ? 'bg-black/40 border-amber-500/20' : 'bg-white border-slate-300'
            }`}
          >
            <button
              type="button"
              onClick={() => setColorMode('light')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-[3px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                colorMode === 'light'
                  ? 'bg-gradient-to-r from-amber-700 to-amber-600 text-white shadow-md preserve-contrast'
                  : isDark
                  ? 'text-slate-300 hover:text-white hover:bg-white/[0.08]'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>{isEn ? 'Light Mode' : 'دۆخی ڕووناک'}</span>
            </button>
            <button
              type="button"
              onClick={() => setColorMode('dark')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-[3px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                colorMode === 'dark'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>{isEn ? 'Dark Mode' : 'دۆخی تاریک'}</span>
            </button>
          </div>
        </div>

        {/* Theme Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {THEME_LIST.map((item) => {
            const isSelected = themeId === item.id;
            const title = isEn ? item.englishName : item.name;
            const subTitle = isEn ? item.name : item.englishName;
            const desc = isEn ? item.descriptionEn : item.description;
            const primaryLbl = isEn ? item.primaryLabelEn : item.primaryLabel;
            const secondaryLbl = isEn ? item.secondaryLabelEn : item.secondaryLabel;

            return (
              <div
                key={item.id}
                onClick={() => setTheme(item.id as ThemeId)}
                className={`group relative p-4 rounded-[4px] border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 overflow-hidden ${
                  isDark
                    ? isSelected
                      ? 'border-amber-400/80 bg-[#121829] shadow-[0_8px_25px_rgba(0,0,0,0.8),0_0_20px_var(--theme-accent-glow)]'
                      : 'border-amber-500/20 hover:border-amber-400/50 bg-[#0e1424] hover:bg-[#121829]'
                    : isSelected
                    ? 'border-2 bg-[#faf8f4] shadow-md'
                    : 'border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 shadow-xs'
                }`}
                style={{
                  background: isDark && isSelected ? item.panelGradient : undefined,
                  borderColor: !isDark && isSelected ? 'var(--theme-accent)' : undefined,
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

                {/* Top Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center -space-x-1 rtl:space-x-reverse">
                    <span
                      className={`w-6 h-6 rounded-[3px] shadow-md border relative z-10 transition-transform group-hover:scale-105 ${
                        isDark ? 'border-white/60' : 'border-slate-400'
                      }`}
                      style={{
                        backgroundColor: item.primaryColor,
                        boxShadow: isDark ? `0 0 10px ${item.primaryColor}88` : undefined,
                      }}
                      title={primaryLbl}
                    />
                    <span
                      className={`w-6 h-6 rounded-[3px] shadow-sm border relative z-0 ${
                        isDark ? 'border-black/50' : 'border-slate-400'
                      }`}
                      style={{
                        backgroundColor: item.secondaryColor,
                      }}
                      title={secondaryLbl}
                    />
                  </div>

                  {isSelected ? (
                    <span
                      className="preserve-contrast flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-[3px] shadow-sm"
                      style={{
                        backgroundColor: isDark ? item.primaryColor : 'var(--theme-accent)',
                        color: isDark ? item.activeBtnText : '#ffffff',
                      }}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>{isEn ? 'Active' : 'چالاکە'}</span>
                    </span>
                  ) : (
                    <span
                      className={`text-[10px] transition-colors ${
                        isDark
                          ? 'text-slate-400 group-hover:text-slate-200'
                          : 'text-slate-600 group-hover:text-slate-900'
                      }`}
                    >
                      {isEn ? 'Click to apply' : 'کلیک بکە بۆ گۆڕین'}
                    </span>
                  )}
                </div>

                {/* Titles */}
                <div>
                  <h4
                    className={`text-sm font-bold flex items-center gap-1.5 ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    <span>{title}</span>
                  </h4>
                  <span
                    className={`text-[10px] font-mono block mt-0.5 tracking-tight ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    {subTitle}
                  </span>
                  <p
                    className={`text-[11px] leading-relaxed mt-2 line-clamp-2 ${
                      isDark ? 'text-slate-300/90' : 'text-slate-700'
                    }`}
                  >
                    {desc}
                  </p>
                </div>

                {/* Live Mini Preview Bar */}
                <div
                  className={`pt-2 border-t flex items-center justify-between text-[10px] ${
                    isDark ? 'border-white/10' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-[2px] border ${
                        isDark ? 'border-transparent' : 'border-slate-300'
                      }`}
                      style={{ backgroundColor: item.primaryColor }}
                    />
                    <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {primaryLbl}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-[2px] border ${
                        isDark ? 'border-white/30' : 'border-slate-300'
                      }`}
                      style={{ backgroundColor: item.secondaryColor }}
                    />
                    <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {secondaryLbl}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer Note */}
        <div
          className={`pt-3 border-t flex items-center justify-between text-xs ${
            isDark ? 'border-amber-500/20 text-slate-400' : 'border-slate-200 text-slate-600'
          }`}
        >
          <span>
            {isEn
              ? '✓ Your selected theme is saved automatically on this device.'
              : '✓ ڕووکاری هەڵبژێردراو بە شێوەی خۆکار لەسەر ئامێرەکەت دەمێنێتەوە.'}
          </span>
          <button
            onClick={onClose}
            className="preserve-contrast px-4 py-2 rounded-[4px] font-extrabold text-xs cursor-pointer shadow-md transition-all active:scale-95"
            style={{
              background: 'var(--theme-btn-active-bg)',
              color: 'var(--theme-btn-active-text)',
            }}
          >
            {isEn ? 'Done' : 'تەواو'}
          </button>
        </div>
      </div>
    </div>
  );
};
