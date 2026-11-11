import React, { useState, useMemo } from 'react';
import {
  X,
  MapPin,
  Search,
  Check,
  Globe2,
  Compass,
  SlidersHorizontal,
  Layers,
  MapPinned,
} from 'lucide-react';
import { FactItem } from '../data/kurdishHistoryData';
import {
  ProvinceItem,
  ProvincePart,
  getProvincesWithCounts,
} from '../data/kurdishProvincesData';
import { kurdishSearchMatch } from '../utils/kurdishSearch';

interface ProvinceSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  facts: FactItem[];
  selectedProvinceId: string;
  onSelectProvince: (provinceId: string, province?: ProvinceItem) => void;
}

export const ProvinceSelectorModal: React.FC<ProvinceSelectorModalProps> = ({
  isOpen,
  onClose,
  facts,
  selectedProvinceId,
  onSelectProvince,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activePartFilter, setActivePartFilter] = useState<ProvincePart | 'all'>('all');

  // Compute provinces with dynamic counts based on facts
  const { allProvinces, kurdistanProvinces, outsideProvinces, totalFacts } = useMemo(() => {
    return getProvincesWithCounts(facts);
  }, [facts]);

  // Filtered list based on search and part tab
  const filteredProvinces = useMemo(() => {
    let list = allProvinces;

    // Filter by Part tab
    if (activePartFilter !== 'all') {
      list = list.filter((p) => p.part === activePartFilter);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.trim();
      list = list.filter((p) => {
        return (
          kurdishSearchMatch(p.name, q) ||
          kurdishSearchMatch(p.partName, q) ||
          p.aliases.some((a) => kurdishSearchMatch(a, q))
        );
      });
    }

    return list;
  }, [allProvinces, activePartFilter, searchQuery]);

  if (!isOpen) return null;

  const currentSelected = allProvinces.find((p) => p.id === selectedProvinceId);

  const getPartColor = (part: ProvincePart) => {
    switch (part) {
      case 'south':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30';
      case 'north':
        return 'bg-amber-500/15 text-amber-300 border-amber-400/30';
      case 'east':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30';
      case 'west':
        return 'bg-purple-500/15 text-purple-300 border-purple-400/30';
      case 'outside':
        return 'bg-rose-500/15 text-rose-300 border-rose-400/30';
      default:
        return 'bg-white/10 text-slate-300 border-white/15';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg liquid-glass-panel rounded-3xl p-4 sm:p-5 border border-white/20 shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_35px_rgba(245,158,11,0.2)] max-h-[92dvh] flex flex-col overflow-hidden text-right animate-spatial-spring"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="glass-specular-ray" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl liquid-glass-btn flex items-center justify-center text-amber-400 border border-amber-400/35 shrink-0 shadow-xs">
              <MapPinned className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-extrabold text-white font-heading truncate flex items-center gap-2">
                <span>پۆلێنی پارێزگاکان</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold">
                  {allProvinces.length} پارێزگا
                </span>
              </h3>
              <p className="text-[11px] text-slate-300 font-light truncate">
                فلتەرکردنی شوێنەکان بەپێی پارێزگاکانی چوار پارچەی کوردستان
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl liquid-glass-btn flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            title="داخستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input Box */}
        <div className="relative mb-3 shrink-0">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="گەڕان بەپێی ناوی پارێزگا (هەولێر، ئامەد، سنە، عەفرین، ماردین...)"
            className="w-full bg-white/[0.06] text-white placeholder:text-slate-400 text-xs pr-9 pl-8 py-2 rounded-2xl border border-white/10 focus:border-amber-400/80 focus:bg-white/[0.09] focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 4 Parts Tabs Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 custom-scrollbar shrink-0">
          <button
            onClick={() => setActivePartFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border ${
              activePartFilter === 'all'
                ? 'liquid-glass-btn-active text-black border-amber-400 shadow-xs'
                : 'liquid-glass-btn text-slate-300 hover:text-white border-white/10'
            }`}
          >
            هەموو پارێزگاکان ({allProvinces.length})
          </button>

          <button
            onClick={() => setActivePartFilter('south')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer shrink-0 border ${
              activePartFilter === 'south'
                ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400/60 font-bold shadow-xs'
                : 'liquid-glass-btn text-emerald-300/80 hover:text-emerald-200 border-white/10'
            }`}
          >
            باشوور (٩)
          </button>

          <button
            onClick={() => setActivePartFilter('north')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer shrink-0 border ${
              activePartFilter === 'north'
                ? 'bg-amber-500/25 text-amber-200 border-amber-400/60 font-bold shadow-xs'
                : 'liquid-glass-btn text-amber-300/80 hover:text-amber-200 border-white/10'
            }`}
          >
            باکوور (٢٤)
          </button>

          <button
            onClick={() => setActivePartFilter('east')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer shrink-0 border ${
              activePartFilter === 'east'
                ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/60 font-bold shadow-xs'
                : 'liquid-glass-btn text-cyan-300/80 hover:text-cyan-200 border-white/10'
            }`}
          >
            ڕۆژهەڵات (٩)
          </button>

          <button
            onClick={() => setActivePartFilter('west')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer shrink-0 border ${
              activePartFilter === 'west'
                ? 'bg-purple-500/25 text-purple-200 border-purple-400/60 font-bold shadow-xs'
                : 'liquid-glass-btn text-purple-300/80 hover:text-purple-200 border-white/10'
            }`}
          >
            ڕۆژئاوا (٥)
          </button>

          {outsideProvinces.length > 0 && (
            <button
              onClick={() => setActivePartFilter('outside')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer shrink-0 border ${
                activePartFilter === 'outside'
                  ? 'bg-rose-500/25 text-rose-200 border-rose-400/60 font-bold shadow-xs'
                  : 'liquid-glass-btn text-rose-300/80 hover:text-rose-200 border-white/10'
              }`}
            >
              دەرەوەی کوردستان ({outsideProvinces.length})
            </button>
          )}
        </div>

        {/* Reset / All Provinces Quick Option */}
        <div className="mb-2 shrink-0">
          <button
            onClick={() => {
              onSelectProvince('all');
              onClose();
            }}
            className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition-all cursor-pointer text-right border ${
              selectedProvinceId === 'all' || !selectedProvinceId
                ? 'liquid-glass-btn-active text-black shadow-md border-amber-400 font-bold'
                : 'liquid-glass-btn hover:border-amber-400/40 text-slate-200 hover:text-white border-white/10'
            }`}
          >
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              <span className="text-xs sm:text-sm font-bold font-heading">
                هەموو پارێزگاکان (سەرجەم کوردستان)
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-amber-300 border border-white/10">
              {totalFacts} شوێن
            </span>
          </button>
        </div>

        {/* Provinces List */}
        <div className="space-y-1.5 overflow-y-auto pr-1 custom-scrollbar flex-1">
          {filteredProvinces.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              هیچ پارێزگایەک بەم ناوەوە نەدۆزرایەوە.
            </div>
          ) : (
            filteredProvinces.map((prov) => {
              const isSelected = selectedProvinceId === prov.id;

              return (
                <button
                  key={prov.id}
                  onClick={() => {
                    onSelectProvince(prov.id, prov);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-2 sm:p-2.5 rounded-2xl transition-all cursor-pointer text-right group border ${
                    isSelected
                      ? 'liquid-glass-btn-active text-black shadow-md border-amber-400 font-bold'
                      : 'liquid-glass-btn hover:border-amber-400/40 text-slate-200 hover:text-white border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-black/15 border-black/20 text-black'
                          : 'bg-white/5 border-white/10 text-amber-400 group-hover:scale-110 transition-transform'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs sm:text-[13px] font-heading font-bold truncate ${
                            isSelected ? 'text-black font-black' : 'text-white group-hover:text-amber-300'
                          }`}
                        >
                          {prov.name}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-md border font-medium ${getPartColor(
                            prov.part
                          )}`}
                        >
                          {prov.partName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        isSelected
                          ? 'bg-black/20 text-black border-black/30'
                          : prov.count > 0
                          ? 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                          : 'bg-white/5 text-slate-400 border-white/10'
                      }`}
                    >
                      {prov.count} شوێن
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-black" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between gap-2 shrink-0">
          <div className="text-[11px] text-slate-300">
            {currentSelected && currentSelected.id !== 'all' ? (
              <span className="flex items-center gap-1 text-amber-300">
                <MapPin className="w-3 h-3" />
                <span>پارێزگای هەڵبژێردراو: {currentSelected.name}</span>
              </span>
            ) : (
              <span>هەموو کوردستان پیشاندراوە</span>
            )}
          </div>

          <button
            onClick={() => {
              onSelectProvince('all');
              onClose();
            }}
            className="px-3.5 py-1.5 rounded-xl liquid-glass-btn text-amber-300 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-white/10"
          >
            <span>پاککردنەوە</span>
          </button>
        </div>
      </div>
    </div>
  );
};
