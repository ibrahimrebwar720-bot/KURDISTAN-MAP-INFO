import React from 'react';
import { FactItem } from '../data/kurdishHistoryData';
import { Sparkles, MapPin, ChevronLeft } from 'lucide-react';

interface Props {
  fact: FactItem;
  onFlyTo: (fact: FactItem) => void;
  onOpenDetail: (fact: FactItem) => void;
}

export const FeaturedFactBanner: React.FC<Props> = ({ fact, onFlyTo, onOpenDetail }) => {
  return (
    <div className="bg-[#070b14]/80 border border-amber-500/25 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_20px_rgba(245,158,11,0.1)] backdrop-blur-2xl">
      <div className="flex items-center gap-3.5 w-full sm:w-auto">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/35 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-amber-400 tracking-wider">
              زانیاری هەڵبژێردراو
            </span>
            <span className="text-[10px] bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold">
              #{fact.num} {fact.eraName}
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-white mt-0.5 line-clamp-1">
            {fact.name}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
            {fact.desc}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <button
          onClick={() => onFlyTo(fact)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs shadow-sm transition-all cursor-pointer"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>سەیری نەخشە بکە</span>
        </button>
        <button
          onClick={() => onOpenDetail(fact)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#050812]/80 hover:bg-slate-800 text-slate-200 text-xs border border-amber-500/25 font-semibold transition-all cursor-pointer"
        >
          <span>زیاتر</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
