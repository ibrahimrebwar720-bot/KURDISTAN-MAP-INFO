import React, { useState, useMemo } from 'react';
import { FactItem } from '../data/kurdishHistoryData';
import { Search, X, ChevronLeft } from 'lucide-react';

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
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFacts = useMemo(() => {
    if (!searchTerm.trim()) return facts;
    const q = searchTerm.toLowerCase().trim();

    return facts.filter((fact) => {
      return (
        fact.name.toLowerCase().includes(q) ||
        fact.desc.toLowerCase().includes(q) ||
        fact.fullText.toLowerCase().includes(q) ||
        (fact.region && fact.region.toLowerCase().includes(q)) ||
        fact.num.toString() === q
      );
    });
  }, [facts, searchTerm]);

  return (
    <div className="flex flex-col h-full bg-black rounded-lg border border-indigo-950/80 overflow-hidden shadow-2xl">
      {/* Search Header */}
      <div className="p-2 border-b border-indigo-950/80 bg-black/90 space-y-1.5">
        <div className="relative">
          <Search className="w-3 h-3 text-indigo-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="گەڕان لە ٣٥٠ دەسەڵات و وێستگە بەپێی ناو، شوێن یان ژمارە..."
            className="w-full bg-[#030712] text-slate-100 placeholder-indigo-300/40 text-[10px] pr-7 pl-7 py-1.5 rounded-md border border-indigo-900/40 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 focus:outline-none transition-all text-right h-7"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-0.5 text-indigo-400 hover:text-white"
              title="سڕینەوە"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>

        {/* Count & Status bar */}
        <div className="flex items-center justify-between text-[9px] px-0.5 text-indigo-300/70">
          <span className="font-medium">پێڕستی مێژوویی</span>
          <span className="font-mono text-indigo-400 font-semibold">
            {filteredFacts.length} لە {facts.length} وێستگە
          </span>
        </div>
      </div>

      {/* Facts Scroll Area - High-Density Modern Black & Indigo List */}
      <div className="flex-1 overflow-y-auto divide-y divide-indigo-950/40 min-h-0 bg-black">
        {filteredFacts.length === 0 ? (
          <div className="py-8 text-center text-indigo-300/50 text-[10px]">
            هیچ دەسەڵات یان وێستگەیەک بەم ناوە نەدۆزرایەوە
          </div>
        ) : (
          filteredFacts.map((fact) => {
            const isSelected = selectedFact?.id === fact.id;

            return (
              <div
                key={fact.id}
                onClick={() => onSelectFact(fact)}
                className={`group flex items-center justify-between gap-2 px-2.5 py-1.5 cursor-pointer transition-all text-right ${
                  isSelected
                    ? 'bg-indigo-950/60 border-r-2 border-indigo-500 shadow-[inset_0_0_16px_rgba(79,70,229,0.18)]'
                    : 'hover:bg-indigo-950/25 hover:border-r hover:border-indigo-800/40'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {/* Number Badge with Indigo Accent */}
                  <span
                    className={`w-5 h-5 rounded flex items-center justify-center font-mono text-[9px] font-bold shrink-0 transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(79,70,229,0.6)]'
                        : 'bg-[#030712] text-indigo-300/80 border border-indigo-900/40 group-hover:border-indigo-600/50 group-hover:text-indigo-200'
                    }`}
                  >
                    {fact.num}
                  </span>

                  {/* Fact Title & Location */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[11px] font-semibold truncate ${
                          isSelected
                            ? 'text-white'
                            : 'text-slate-200 group-hover:text-indigo-200'
                        }`}
                      >
                        {fact.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-indigo-300/60 truncate leading-tight mt-0.5">
                      <span className="truncate">{fact.desc}</span>
                    </div>
                  </div>
                </div>

                {/* Details Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDetail(fact);
                  }}
                  title="وردەکاری"
                  className={`p-1 rounded transition-colors shrink-0 ${
                    isSelected
                      ? 'text-indigo-300 hover:text-white bg-indigo-900/40'
                      : 'text-indigo-400/50 hover:text-indigo-200 hover:bg-indigo-950/40'
                  }`}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
