import React from 'react';
import { FactItem } from '../data/kurdishHistoryData';
import { MapPin, ChevronRight, ChevronLeft, BookOpen, X } from 'lucide-react';

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
}

export const FeaturedFactCard: React.FC<Props> = ({
  fact,
  totalFacts,
  onOpenDetail,
  onNext,
  onPrev,
  onFlyToMap,
  onClose,
}) => {
  return (
    <div className="rounded-xl bg-black border border-indigo-950/90 p-2.5 sm:p-3 shadow-2xl flex flex-col gap-2 text-right">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2 border-b border-indigo-950/80 pb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[9px] font-mono font-bold text-indigo-300 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-800/40 shrink-0">
            #{fact.num}
          </span>
          <h2 className="text-xs sm:text-sm font-bold text-white truncate">
            {fact.name}
          </h2>
        </div>

        {/* Right side controls: Prev / Next + Close */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onPrev}
            title="دەسەڵاتی پێشوو"
            className="p-1 rounded bg-[#030712] hover:bg-indigo-950 border border-indigo-950 text-indigo-300 hover:text-white transition-all active:scale-95"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
          <span className="text-[9px] text-indigo-400/80 font-mono px-0.5">
            {fact.num}/{totalFacts}
          </span>
          <button
            onClick={onNext}
            title="دەسەڵاتی دواتر"
            className="p-1 rounded bg-[#030712] hover:bg-indigo-950 border border-indigo-950 text-indigo-300 hover:text-white transition-all active:scale-95"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              title="داخستن"
              className="p-1 mr-0.5 rounded text-indigo-400 hover:text-white hover:bg-indigo-950/50 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Meta Row: Geographic Location */}
      <div className="flex items-center gap-1 text-[9px] text-indigo-300/80">
        <MapPin className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
        <span className="truncate">{fact.desc}</span>
      </div>

      {/* Summary Text (Compact, legible) */}
      <p className="text-[10px] sm:text-[11px] text-slate-300 leading-relaxed line-clamp-2">
        {fact.fullText}
      </p>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 pt-1.5 border-t border-indigo-950/60">
        <button
          onClick={() => onOpenDetail(fact)}
          className="flex-1 flex items-center justify-center gap-1 py-1 px-2.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[10px] shadow-[0_0_12px_rgba(79,70,229,0.25)] transition-all active:scale-[0.98]"
        >
          <BookOpen className="w-3 h-3" />
          <span>وردەکاریی تەواو و بەڵگەنامە</span>
        </button>

        {onFlyToMap && (
          <button
            onClick={() => onFlyToMap(fact)}
            className="flex items-center justify-center gap-1 py-1 px-2 rounded-md bg-black hover:bg-indigo-950 border border-indigo-900/40 text-indigo-300 text-[10px] transition-all"
            title="فڕین بۆ شوێن لەسەر نەخشە"
          >
            <MapPin className="w-3 h-3 text-indigo-400" />
            <span className="hidden sm:inline">نەخشە</span>
          </button>
        )}
      </div>
    </div>
  );
};
