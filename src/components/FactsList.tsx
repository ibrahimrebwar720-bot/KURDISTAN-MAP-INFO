import React, { useState, useMemo } from 'react';
import { FactItem, ERAS } from '../data/kurdishHistoryData';
import { Search, X, ChevronLeft, MapPin } from 'lucide-react';

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
  const [selectedEraId, setSelectedEraId] = useState<number | 'all'>('all');

  const filteredFacts = useMemo(() => {
    return facts.filter((fact) => {
      const matchesSearch =
        searchTerm === '' ||
        fact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fact.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fact.fullText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (fact.region && fact.region.toLowerCase().includes(searchTerm.toLowerCase())) ||
        fact.num.toString() === searchTerm;

      const matchesEra = selectedEraId === 'all' || fact.eraId === selectedEraId;

      return matchesSearch && matchesEra;
    });
  }, [facts, searchTerm, selectedEraId]);

  return (
    <div className="flex flex-col h-full bg-slate-900/90 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
      {/* Search and Era Segmented Filter */}
      <div className="p-2.5 border-b border-slate-800 bg-slate-950/60 space-y-2">
        {/* Compact Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="گەڕان بەپێی ناو، شوێن یان ژمارە..."
            className="w-full bg-slate-900 text-slate-100 placeholder-slate-500 text-xs pr-8 pl-7 py-1.5 rounded-lg border border-slate-700/70 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all text-right"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Compact Segmented Control for Eras */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[11px] scrollbar-none">
          <button
            onClick={() => setSelectedEraId('all')}
            className={`px-2 py-0.5 rounded-md font-medium shrink-0 transition-colors ${
              selectedEraId === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
            }`}
          >
            هەموو ({facts.length})
          </button>
          {ERAS.map((era) => (
            <button
              key={era.id}
              onClick={() => setSelectedEraId(era.id)}
              className={`px-2 py-0.5 rounded-md font-medium shrink-0 transition-colors border ${
                selectedEraId === era.id
                  ? 'border-amber-500/80 bg-amber-500/10 text-amber-300 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 bg-slate-800/60'
              }`}
            >
              {era.title.split(' ')[0]} ({era.count})
            </button>
          ))}
        </div>
      </div>

      {/* List Count Status */}
      <div className="px-3 py-1 bg-slate-950/40 border-b border-slate-800/40 text-[10px] text-slate-400 flex items-center justify-between">
        <span>دەسەڵات و وێستگەکان</span>
        <span>{filteredFacts.length} لە {facts.length} شوێن</span>
      </div>

      {/* Facts Scroll Area - High-Density Professional List Items */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50 min-h-[300px] max-h-[520px] lg:max-h-[640px]">
        {filteredFacts.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            هیچ وێستگەیەک نەدۆزرایەوە
          </div>
        ) : (
          filteredFacts.map((fact) => {
            const isSelected = selectedFact?.id === fact.id;

            return (
              <div
                key={fact.id}
                onClick={() => onSelectFact(fact)}
                className={`group flex items-center justify-between gap-2.5 px-3 py-2 cursor-pointer transition-colors text-right ${
                  isSelected
                    ? 'bg-amber-500/10 border-r-2 border-amber-500'
                    : 'hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Number Badge */}
                  <span
                    className={`w-6 h-6 rounded flex items-center justify-center font-mono text-[10px] font-bold shrink-0 ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    {fact.num}
                  </span>

                  {/* Fact Title & Location */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-semibold truncate ${isSelected ? 'text-amber-300' : 'text-slate-200 group-hover:text-white'}`}>
                        {fact.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate">
                      <span className="truncate">{fact.desc}</span>
                      <span>·</span>
                      <span className="shrink-0">{fact.eraName}</span>
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
                  className="p-1 rounded text-slate-500 hover:text-amber-400 hover:bg-slate-800 transition-colors shrink-0"
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
