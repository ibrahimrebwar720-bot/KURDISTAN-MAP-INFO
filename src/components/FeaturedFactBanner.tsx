import React from 'react';
import { FactItem } from '../data/kurdishHistoryData';
import { Sparkles, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface Props {
  fact: FactItem;
  onFlyTo: (fact: FactItem) => void;
  onOpenDetail: (fact: FactItem) => void;
}

export const FeaturedFactBanner: React.FC<Props> = ({ fact, onFlyTo, onOpenDetail }) => {
  const { isEn, dir } = useLanguage();
  const { colorMode } = useTheme();
  const isDark = colorMode === 'dark';

  return (
    <div
      dir={dir}
      className={`border rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-2xl transition-colors ${
        isDark
          ? 'bg-[#070b14]/80 border-amber-500/25 shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_20px_rgba(245,158,11,0.1)]'
          : 'bg-white/95 border-slate-200 shadow-lg'
      }`}
    >
      <div className="flex items-center gap-3.5 w-full sm:w-auto">
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
            isDark
              ? 'bg-amber-500/15 text-amber-400 border-amber-500/35 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
              : 'bg-amber-100 text-amber-800 border-amber-300 shadow-xs'
          }`}
        >
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="text-start">
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-bold tracking-wider ${
                isDark ? 'text-amber-400' : 'text-amber-800'
              }`}
            >
              {isEn ? 'Featured Entry' : 'زانیاری هەڵبژێردراو'}
            </span>
            {fact.eraName && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${
                  isDark
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}
              >
                {fact.eraName}
              </span>
            )}
          </div>
          <h3
            className={`text-sm sm:text-base font-bold mt-0.5 line-clamp-1 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            {fact.name}
          </h3>
          <p
            className={`text-xs line-clamp-1 mt-0.5 ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            {fact.desc}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <button
          onClick={() => onFlyTo(fact)}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-extrabold text-xs shadow-sm transition-all cursor-pointer ${
            isDark
              ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950'
              : 'preserve-contrast bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-800 hover:to-amber-700 text-white'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>{isEn ? 'View on Map' : 'سەیری نەخشە بکە'}</span>
        </button>
        <button
          onClick={() => onOpenDetail(fact)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs border font-semibold transition-all cursor-pointer ${
            isDark
              ? 'bg-[#050812]/80 hover:bg-slate-800 text-slate-200 border-amber-500/25'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
          }`}
        >
          <span>{isEn ? 'More' : 'زیاتر'}</span>
          {isEn ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};

