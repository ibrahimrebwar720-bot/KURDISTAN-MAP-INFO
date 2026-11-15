import React from 'react';
import { FactItem } from '../data/kurdishHistoryData';
import { MapPin, ChevronRight, ChevronLeft, BookOpen, X, Edit3, Calendar, Hourglass } from 'lucide-react';
import { getFactDisplayImage } from '../utils/historicalImages';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { formatDigits } from '../utils/yearUtils';

interface Props {
  fact: FactItem;
  currentIndex: number;
  totalFacts: number;
  onOpenDetail: (fact: FactItem) => void;
  onNext: () => void;
  onPrev: () => void;
  onFlyToMap?: (fact: FactItem) => void;
  onClose?: () => void;
  onOpenMenu?: () => void;
  isAdmin?: boolean;
  onOpenEditFact?: (fact: FactItem) => void;
}

export const FeaturedFactCard: React.FC<Props> = ({
  fact,
  totalFacts,
  onOpenDetail,
  onNext,
  onPrev,
  onFlyToMap,
  onClose,
  isAdmin = false,
  onOpenEditFact,
}) => {
  const { language, isEn, dir } = useLanguage();
  const { colorMode } = useTheme();
  const isDark = colorMode === 'dark';

  return (
    <div
      dir={dir}
      className={`rounded-[4px] border p-3 sm:p-3.5 flex flex-col gap-2.5 text-start transition-colors ${
        isDark
          ? 'bg-[#0b0f1c] border-amber-500/30 border-t-amber-400/50 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.9),0_0_20px_rgba(245,158,11,0.08)]'
          : 'bg-white border-slate-200 border-t-amber-600 shadow-lg'
      }`}
    >
      {/* Header Row */}
      <div
        className={`flex items-center justify-between gap-2 border-b pb-2 ${
          isDark ? 'border-white/10' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <h2
            className={`text-xs sm:text-sm font-bold font-heading truncate ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            {fact.name}
          </h2>
        </div>

        {/* Navigation controls: Prev / Next + Close */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onPrev}
            title={isEn ? 'Previous Entry' : 'دەسەڵاتی پێشوو'}
            className={`p-1 rounded-[3px] border transition-all active:scale-95 cursor-pointer ${
              isDark
                ? 'bg-[#12192a] hover:bg-amber-500/20 border-white/12 text-slate-300 hover:text-amber-300'
                : 'bg-slate-100 hover:bg-amber-100 border-slate-300 text-slate-700 hover:text-amber-900'
            }`}
          >
            {isEn ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          <span
            className={`text-[10px] font-mono font-bold px-1 tabular-nums ${
              isDark ? 'text-amber-300' : 'text-amber-800'
            }`}
          >
            {formatDigits(fact.num, language)}/{formatDigits(totalFacts, language)}
          </span>
          <button
            onClick={onNext}
            title={isEn ? 'Next Entry' : 'دەسەڵاتی دواتر'}
            className={`p-1 rounded-[3px] border transition-all active:scale-95 cursor-pointer ${
              isDark
                ? 'bg-[#12192a] hover:bg-amber-500/20 border-white/12 text-slate-300 hover:text-amber-300'
                : 'bg-slate-100 hover:bg-amber-100 border-slate-300 text-slate-700 hover:text-amber-900'
            }`}
          >
            {isEn ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              title={isEn ? 'Close' : 'داخستن'}
              className={`p-1 ms-0.5 rounded-[3px] transition-colors cursor-pointer ${
                isDark
                  ? 'text-slate-400 hover:text-white hover:bg-white/10'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Meta Row: Geographic Location & Century / Year */}
      <div className="flex flex-wrap items-center justify-between gap-1 text-[10px]">
        <div
          className={`flex items-center gap-1 min-w-0 ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}
        >
          <MapPin className={`w-3 h-3 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
          <span className="truncate">{fact.desc}</span>
        </div>

        {(fact.century || fact.year) && (
          <div className="flex items-center gap-1 shrink-0 font-medium">
            {fact.century && (
              <span
                className={`flex items-center gap-1 px-2 py-0.5 rounded-[3px] border font-mono ${
                  isDark
                    ? 'bg-black/50 border-amber-500/25 text-amber-300'
                    : 'bg-slate-100 border-slate-300 text-amber-900'
                }`}
              >
                <Hourglass className={`w-3 h-3 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
                <span>{fact.century}</span>
              </span>
            )}
            {fact.year && (
              <span
                className={`flex items-center gap-1 px-2 py-0.5 rounded-[3px] border font-mono font-bold ${
                  isDark
                    ? 'bg-amber-500/15 border-amber-500/35 text-amber-300'
                    : 'bg-amber-100 border-amber-300 text-amber-900'
                }`}
              >
                <Calendar className={`w-3 h-3 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
                <span>{fact.year}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Topic Image if present */}
      {(() => {
        const displayImg = getFactDisplayImage(fact);
        if (!displayImg) return null;
        return (
          <div className="preserve-contrast relative rounded-[3px] overflow-hidden border border-white/12 bg-black max-h-36">
            <img
              src={displayImg}
              alt={fact.imageCaption || fact.name}
              className="w-full h-32 object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent pointer-events-none" />
            {(fact.imageCaption || fact.name) && (
              <div className="absolute bottom-1.5 start-1.5 end-1.5 px-2 py-0.5 rounded-[2px] bg-black/90 text-[10px] text-amber-200 border border-amber-500/25 truncate">
                {fact.imageCaption || fact.name}
              </div>
            )}
          </div>
        );
      })()}

      {/* Summary Text (Compact, legible) */}
      <p
        className={`text-xs leading-relaxed line-clamp-2 ${
          isDark ? 'text-slate-300' : 'text-slate-700'
        }`}
      >
        {fact.fullText}
      </p>

      {/* Action Buttons */}
      <div
        className={`flex items-center gap-2 pt-2 border-t ${
          isDark ? 'border-white/10' : 'border-slate-200'
        }`}
      >
        <button
          onClick={() => onOpenDetail(fact)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-[3px] font-extrabold text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer ${
            isDark
              ? 'bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950'
              : 'preserve-contrast bg-gradient-to-b from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white'
          }`}
        >
          <BookOpen className={`w-3.5 h-3.5 ${isDark ? 'text-slate-950' : 'text-white'}`} />
          <span>{isEn ? 'Full Details & Archives' : 'وردەکاریی تەواو و بەڵگەنامە'}</span>
        </button>

        {isAdmin && onOpenEditFact && (
          <button
            onClick={() => onOpenEditFact(fact)}
            className={`flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-[3px] border text-xs font-bold transition-all cursor-pointer ${
              isDark
                ? 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/35 text-amber-300'
                : 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900'
            }`}
            title={isEn ? 'Edit this entry' : 'دەستکاریکردنی ئەم دەسەڵاتە'}
          >
            <Edit3 className="w-3 h-3" />
            <span className="hidden sm:inline">{isEn ? 'Edit' : 'دەستکاری'}</span>
          </button>
        )}

        {onFlyToMap && (
          <button
            onClick={() => onFlyToMap(fact)}
            className={`flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-[3px] border text-xs transition-all cursor-pointer ${
              isDark
                ? 'bg-[#12192a] hover:bg-[#18223a] border-white/12 text-slate-200 hover:text-white'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800 hover:text-slate-950'
            }`}
            title={isEn ? 'Fly to location on map' : 'فڕین بۆ شوێن لەسەر نەخشە'}
          >
            <MapPin className={`w-3 h-3 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
            <span className="hidden sm:inline">{isEn ? 'Map' : 'نەخشە'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

