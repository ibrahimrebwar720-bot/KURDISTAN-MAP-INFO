import React from 'react';
import { FactItem } from '../data/kurdishHistoryData';
import { MapPin, Layers } from 'lucide-react';

interface Props {
  facts: FactItem[];
  selectedFact: FactItem | null;
  onSelectFact: (fact: FactItem) => void;
  onOpenDetail: (fact: FactItem) => void;
}

export const FactsList: React.FC<Props> = ({
  facts,
  selectedFact,
  onSelectFact,
  onOpenDetail,
}) => {
  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl border border-slate-800 backdrop-blur-md overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-800/80 bg-slate-900/90 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold font-heading text-slate-100">
            لیستی ٢٠٠ دەسەڵات و وێستگەی مێژوویی
          </h3>
        </div>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
          ٢٠٠ وێستگە
        </span>
      </div>

      <div className="px-5 py-2 bg-slate-950/40 border-b border-slate-800/50 text-xs text-slate-400">
        <span>💡 لەسەر هەر وێستگەیەک داگرە تا نەخشەکە فڕین بکات بۆ شوێنەکەی</span>
      </div>

      {/* Facts Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[350px] max-h-[600px] lg:max-h-[720px]">
        {facts.map((fact) => {
          const isSelected = selectedFact?.id === fact.id;

          return (
            <div
              key={fact.id}
              onClick={() => onSelectFact(fact)}
              className={`group relative p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer text-right ${
                isSelected
                  ? 'bg-gradient-to-r from-amber-500/15 via-slate-850 to-slate-850 border-amber-500 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-850/60 hover:bg-slate-800/80 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Number Badge */}
                <div
                  className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 transition-transform ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 scale-105 shadow-md shadow-amber-500/30'
                      : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'
                  }`}
                >
                  {fact.num}
                </div>

                {/* Fact Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-amber-300 transition-colors truncate">
                      {fact.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full shrink-0">
                      #{fact.num}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {fact.fullText}
                  </p>

                  {/* Footer Actions inside Card */}
                  <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-800/60 text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-500" />
                      <span className="truncate max-w-[200px]">{fact.desc}</span>
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDetail(fact);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-[11px] font-semibold border border-slate-700/60 transition-colors"
                    >
                      زانیاری زیاتر
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
