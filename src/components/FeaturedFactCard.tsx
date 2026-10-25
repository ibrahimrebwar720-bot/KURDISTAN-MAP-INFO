import React from 'react';
import { FactItem } from '../data/kurdishHistoryData';
import { MapPin, ChevronRight, ChevronLeft, BookOpen, X, Edit3, Calendar, Hourglass } from 'lucide-react';
import { getFactDisplayImage } from '../utils/historicalImages';

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
  return (
    <div className="rounded-2xl bg-[#070b14]/80 border border-amber-500/25 p-3 sm:p-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_20px_rgba(245,158,11,0.1)] backdrop-blur-2xl flex flex-col gap-2.5 text-right">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2 border-b border-amber-500/15 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-xs sm:text-sm font-bold text-white truncate">
            {fact.name}
          </h2>
        </div>

        {/* Right side controls: Prev / Next + Close */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onPrev}
            title="دەسەڵاتی پێشوو"
            className="p-1 rounded-lg bg-[#050812]/80 hover:bg-amber-500/20 border border-amber-500/20 text-slate-300 hover:text-amber-300 transition-all active:scale-95 cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] text-amber-300/80 font-mono font-bold px-1">
            {fact.num}/{totalFacts}
          </span>
          <button
            onClick={onNext}
            title="دەسەڵاتی دواتر"
            className="p-1 rounded-lg bg-[#050812]/80 hover:bg-amber-500/20 border border-amber-500/20 text-slate-300 hover:text-amber-300 transition-all active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              title="داخستن"
              className="p-1 mr-0.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Meta Row: Geographic Location & Century / Year */}
      <div className="flex flex-wrap items-center justify-between gap-1 text-[10px]">
        <div className="flex items-center gap-1 text-slate-300 min-w-0">
          <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
          <span className="truncate">{fact.desc}</span>
        </div>

        {(fact.century || fact.year) && (
          <div className="flex items-center gap-1 shrink-0 font-medium">
            {fact.century && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/40 border border-amber-500/20 text-amber-300 font-mono">
                <Hourglass className="w-3 h-3 text-amber-400" />
                <span>{fact.century}</span>
              </span>
            )}
            {fact.year && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-bold">
                <Calendar className="w-3 h-3 text-amber-400" />
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
          <div className="relative rounded-xl overflow-hidden border border-amber-500/25 bg-black/60 max-h-36">
            <img
              src={displayImg}
              alt={fact.imageCaption || fact.name}
              className="w-full h-32 object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
            {(fact.imageCaption || fact.name) && (
              <div className="absolute bottom-1.5 right-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/85 text-[10px] text-amber-200 border border-amber-500/20 backdrop-blur-xs truncate">
                {fact.imageCaption || fact.name}
              </div>
            )}
          </div>
        );
      })()}

      {/* Summary Text (Compact, legible) */}
      <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
        {fact.fullText}
      </p>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-amber-500/15">
        <button
          onClick={() => onOpenDetail(fact)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs shadow-sm transition-all active:scale-[0.98] cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5 text-slate-950" />
          <span>وردەکاریی تەواو و بەڵگەنامە</span>
        </button>

        {isAdmin && onOpenEditFact && (
          <button
            onClick={() => onOpenEditFact(fact)}
            className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 text-xs font-bold transition-all cursor-pointer"
            title="دەستکاریکردنی ئەم دەسەڵاتە"
          >
            <Edit3 className="w-3 h-3" />
            <span className="hidden sm:inline">دەستکاری</span>
          </button>
        )}

        {onFlyToMap && (
          <button
            onClick={() => onFlyToMap(fact)}
            className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl bg-black/60 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs transition-all cursor-pointer"
            title="فڕین بۆ شوێن لەسەر نەخشە"
          >
            <MapPin className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">نەخشە</span>
          </button>
        )}
      </div>
    </div>
  );
};
