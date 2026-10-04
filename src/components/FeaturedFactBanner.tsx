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
    <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
      <div className="flex items-center gap-3.5 w-full sm:w-auto">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              زانیاری هەڵبژێردراو
            </span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
              #{fact.num} {fact.eraName}
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-100 mt-0.5 line-clamp-1">
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>سەیری نەخشە بکە</span>
        </button>
        <button
          onClick={() => onOpenDetail(fact)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 font-medium transition-all"
        >
          <span>زیاتر</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
