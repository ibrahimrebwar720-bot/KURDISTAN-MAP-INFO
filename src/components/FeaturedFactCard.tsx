import React from 'react';
import { FactItem, ERAS } from '../data/kurdishHistoryData';
import { MapPin, Calendar, Compass, ChevronRight, ChevronLeft, BookOpen } from 'lucide-react';

interface Props {
  fact: FactItem;
  currentIndex: number;
  totalFacts: number;
  onOpenDetail: (fact: FactItem) => void;
  onNext: () => void;
  onPrev: () => void;
  onFlyToMap?: (fact: FactItem) => void;
}

export const FeaturedFactCard: React.FC<Props> = ({
  fact,
  totalFacts,
  onOpenDetail,
  onNext,
  onPrev,
  onFlyToMap,
}) => {
  const eraInfo = ERAS.find((e) => e.id === fact.eraId) || ERAS[0];

  return (
    <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 sm:p-4 shadow-lg flex flex-col gap-2.5 text-right">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">
            #{fact.num}
          </span>
          <h2 className="text-sm sm:text-base font-bold text-white truncate">
            {fact.name}
          </h2>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium shrink-0" style={{ color: eraInfo.accent }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: eraInfo.accent }} />
            {fact.eraName}
          </span>
        </div>

        {/* Prev / Next Mini Navigation */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onPrev}
            title="وێستگەی پێشوو"
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] text-slate-400 font-mono px-1">
            {fact.num}/{totalFacts}
          </span>
          <button
            onClick={onNext}
            title="وێستگەی دواتر"
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Meta Row: Clean unboxed metadata with separators */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400">
        <span className="flex items-center gap-1 text-slate-300">
          <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
          <span>{fact.desc}</span>
        </span>
        {fact.eraPeriod && (
          <>
            <span className="text-slate-600">·</span>
            <span className="flex items-center gap-1 text-slate-400">
              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{fact.eraPeriod}</span>
            </span>
          </>
        )}
      </div>

      {/* Summary Text (Clean, compact, legible) */}
      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-3">
        {fact.fullText}
      </p>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
        <button
          onClick={() => onOpenDetail(fact)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-bold text-xs shadow transition-all"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>وردەکاریی تەواو و مێژوو</span>
        </button>

        {onFlyToMap && (
          <button
            onClick={() => onFlyToMap(fact)}
            className="flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-all shrink-0"
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">نیشاندان لە نەخشە</span>
          </button>
        )}
      </div>
    </div>
  );
};
