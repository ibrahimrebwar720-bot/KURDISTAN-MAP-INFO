import React, { useState, useMemo } from 'react';
import {
  X,
  MapPin,
  Search,
  Check,
  Compass,
  MapPinned,
} from 'lucide-react';
import { FactItem } from '../data/kurdishHistoryData';
import {
  ProvinceItem,
  ProvincePart,
  getProvincesWithCounts,
} from '../data/kurdishProvincesData';
import { kurdishSearchMatch } from '../utils/kurdishSearch';
import { useTheme } from '../context/ThemeContext';

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
  const { colorMode } = useTheme();
  const isDark = colorMode !== 'light';

  const [searchQuery, setSearchQuery] = useState('');
  const [activePartFilter, setActivePartFilter] = useState<ProvincePart | 'all'>('all');

  // Compute provinces with dynamic counts based on facts
  const { allProvinces, outsideProvinces, totalFacts } = useMemo(() => {
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
    if (isDark) {
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
    } else {
      switch (part) {
        case 'south':
          return 'bg-emerald-100 text-emerald-800 border-emerald-300';
        case 'north':
          return 'bg-amber-100 text-amber-900 border-amber-300';
        case 'east':
          return 'bg-cyan-100 text-cyan-900 border-cyan-300';
        case 'west':
          return 'bg-purple-100 text-purple-900 border-purple-300';
        case 'outside':
          return 'bg-rose-100 text-rose-900 border-rose-300';
        default:
          return 'bg-slate-100 text-slate-700 border-slate-300';
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-lg rounded-[4px] p-4 sm:p-5 shadow-2xl max-h-[92dvh] flex flex-col overflow-hidden text-right border transition-colors ${
          isDark
            ? 'bg-[#090d18] text-slate-100 border-white/10'
            : 'bg-white text-slate-900 border-slate-300'
        }`}
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Modal Header */}
        <div className={`flex items-center justify-between pb-3 mb-3 border-b shrink-0 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-[4px] flex items-center justify-center shrink-0 border ${
              isDark ? 'bg-amber-400/10 text-amber-400 border-amber-400/30' : 'bg-amber-100 text-amber-800 border-amber-300 shadow-xs'
            }`}>
              <MapPinned className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className={`text-sm sm:text-base font-extrabold font-heading truncate flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                <span>پۆلێنی پارێزگاکان</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-[3px] border font-bold ${
                  isDark ? 'bg-amber-400/15 text-amber-300 border-amber-400/30' : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}>
                  {allProvinces.length} پارێزگا
                </span>
              </h3>
              <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                فلتەرکردنی شوێنەکان بەپێی پارێزگاکانی کوردستان
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-[4px] flex items-center justify-center border transition-colors cursor-pointer shrink-0 ${
              isDark
                ? 'bg-white/[0.06] text-slate-400 hover:text-white border-white/10'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-300'
            }`}
            title="داخستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input Box */}
        <div className="relative mb-3 shrink-0">
          <Search className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="گەڕان بەپێی ناوی پارێزگا (هەولێر، ئامەد، سنە، عەفرین، ماردین...)"
            className={`w-full text-xs pr-9 pl-8 py-2 rounded-[4px] border focus:outline-none transition-all ${
              isDark
                ? 'bg-white/[0.05] text-white placeholder:text-slate-500 border-white/10 focus:border-amber-400'
                : 'bg-slate-50 text-slate-900 placeholder:text-slate-400 border-slate-300 focus:bg-white focus:border-amber-500 font-medium'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={`absolute left-2.5 top-1/2 -translate-y-1/2 p-0.5 cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 4 Parts Tabs Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 custom-scrollbar shrink-0">
          <button
            onClick={() => setActivePartFilter('all')}
            className={`px-3 py-1.5 rounded-[4px] text-xs font-bold transition-all cursor-pointer shrink-0 border ${
              activePartFilter === 'all'
                ? (isDark ? 'bg-amber-400 text-slate-950 border-amber-300 font-extrabold shadow-sm' : 'bg-amber-500 text-slate-950 border-amber-600 font-extrabold shadow-xs')
                : (isDark ? 'bg-white/[0.05] text-slate-300 hover:text-white border-white/10' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300')
            }`}
          >
            هەموو پارێزگاکان ({allProvinces.length})
          </button>

          <button
            onClick={() => setActivePartFilter('south')}
            className={`px-2.5 py-1.5 rounded-[4px] text-xs font-medium transition-all cursor-pointer shrink-0 border ${
              activePartFilter === 'south'
                ? (isDark ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400/60 font-bold' : 'bg-emerald-600 text-white border-emerald-700 font-bold shadow-xs')
                : (isDark ? 'bg-white/[0.04] text-emerald-400 border-white/10' : 'bg-emerald-50 text-emerald-800 border-emerald-200')
            }`}
          >
            باشوور (٩)
          </button>

          <button
            onClick={() => setActivePartFilter('north')}
            className={`px-2.5 py-1.5 rounded-[4px] text-xs font-medium transition-all cursor-pointer shrink-0 border ${
              activePartFilter === 'north'
                ? (isDark ? 'bg-amber-500/30 text-amber-200 border-amber-400/60 font-bold' : 'bg-amber-600 text-white border-amber-700 font-bold shadow-xs')
                : (isDark ? 'bg-white/[0.04] text-amber-400 border-white/10' : 'bg-amber-50 text-amber-900 border-amber-200')
            }`}
          >
            باکوور (٢٤)
          </button>

          <button
            onClick={() => setActivePartFilter('east')}
            className={`px-2.5 py-1.5 rounded-[4px] text-xs font-medium transition-all cursor-pointer shrink-0 border ${
              activePartFilter === 'east'
                ? (isDark ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400/60 font-bold' : 'bg-cyan-600 text-white border-cyan-700 font-bold shadow-xs')
                : (isDark ? 'bg-white/[0.04] text-cyan-400 border-white/10' : 'bg-cyan-50 text-cyan-900 border-cyan-200')
            }`}
          >
            ڕۆژهەڵات (٩)
          </button>

          <button
            onClick={() => setActivePartFilter('west')}
            className={`px-2.5 py-1.5 rounded-[4px] text-xs font-medium transition-all cursor-pointer shrink-0 border ${
              activePartFilter === 'west'
                ? (isDark ? 'bg-purple-500/30 text-purple-200 border-purple-400/60 font-bold' : 'bg-purple-600 text-white border-purple-700 font-bold shadow-xs')
                : (isDark ? 'bg-white/[0.04] text-purple-400 border-white/10' : 'bg-purple-50 text-purple-900 border-purple-200')
            }`}
          >
            ڕۆژئاوا (٥)
          </button>

          {outsideProvinces.length > 0 && (
            <button
              onClick={() => setActivePartFilter('outside')}
              className={`px-2.5 py-1.5 rounded-[4px] text-xs font-medium transition-all cursor-pointer shrink-0 border ${
                activePartFilter === 'outside'
                  ? (isDark ? 'bg-rose-500/30 text-rose-200 border-rose-400/60 font-bold' : 'bg-rose-600 text-white border-rose-700 font-bold shadow-xs')
                  : (isDark ? 'bg-white/[0.04] text-rose-400 border-white/10' : 'bg-rose-50 text-rose-900 border-rose-200')
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
            className={`w-full flex items-center justify-between p-2.5 rounded-[4px] transition-all cursor-pointer text-right border ${
              selectedProvinceId === 'all' || !selectedProvinceId
                ? (isDark ? 'bg-amber-400/20 text-amber-300 border-amber-400/50 font-bold shadow-sm' : 'bg-amber-100 text-amber-950 border-amber-400 font-bold shadow-xs')
                : (isDark ? 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 hover:text-white border-white/10' : 'bg-slate-50 hover:bg-white text-slate-800 border-slate-300 shadow-xs')
            }`}
          >
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-500" />
              <span className="text-xs sm:text-sm font-bold font-heading">
                هەموو پارێزگاکان (سەرجەم کوردستان)
              </span>
            </div>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-[3px] border ${
              isDark ? 'bg-white/10 text-amber-300 border-white/10' : 'bg-white text-amber-900 border-slate-300'
            }`}>
              {totalFacts} شوێن
            </span>
          </button>
        </div>

        {/* Provinces List */}
        <div className="space-y-1.5 overflow-y-auto pr-1 custom-scrollbar flex-1">
          {filteredProvinces.length === 0 ? (
            <div className={`py-8 text-center text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
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
                  className={`w-full flex items-center justify-between p-2 sm:p-2.5 rounded-[4px] transition-all cursor-pointer text-right group border ${
                    isSelected
                      ? (isDark ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold shadow-sm' : 'bg-amber-500 text-slate-950 border-amber-600 font-bold shadow-xs')
                      : (isDark ? 'bg-white/[0.03] hover:bg-white/[0.08] hover:border-amber-400/40 text-slate-200 border-white/10' : 'bg-white hover:bg-amber-50/60 hover:border-amber-400 text-slate-900 border-slate-200 shadow-xs')
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-[4px] flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-slate-950/20 border-slate-950/30 text-slate-950'
                          : (isDark ? 'bg-white/5 border-white/10 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-800')
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs sm:text-[13px] font-heading font-bold truncate ${
                            isSelected
                              ? 'text-slate-950 font-black'
                              : (isDark ? 'text-white group-hover:text-amber-300' : 'text-slate-900 group-hover:text-amber-900')
                          }`}
                        >
                          {prov.name}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-[3px] border font-medium ${getPartColor(
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
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-[3px] border ${
                        isSelected
                          ? 'bg-slate-950/20 text-slate-950 border-slate-950/30'
                          : prov.count > 0
                          ? (isDark ? 'bg-amber-400/15 text-amber-300 border-amber-400/30' : 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold')
                          : (isDark ? 'bg-white/5 text-slate-500 border-white/10' : 'bg-slate-100 text-slate-500 border-slate-200')
                      }`}
                    >
                      {prov.count} شوێن
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className={`pt-3 mt-3 border-t flex items-center justify-between gap-2 shrink-0 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
          <div className={`text-[11px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {currentSelected && currentSelected.id !== 'all' ? (
              <span className={`flex items-center gap-1 font-bold ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
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
            className={`px-3.5 py-1.5 rounded-[4px] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              isDark
                ? 'bg-white/[0.06] hover:bg-white/[0.12] text-amber-300 border-white/10'
                : 'bg-slate-100 hover:bg-slate-200 text-amber-900 border-slate-300'
            }`}
          >
            <span>پاککردنەوە</span>
          </button>
        </div>
      </div>
    </div>
  );
};
