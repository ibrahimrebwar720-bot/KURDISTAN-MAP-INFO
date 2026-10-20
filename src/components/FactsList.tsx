import React, { useState, useMemo } from 'react';
import { FactItem } from '../data/kurdishHistoryData';
import { CollectionItem, UNIFIED_CATEGORIES, getCategoryInfo } from '../types/history';
import { getFactChronologicalYear } from '../utils/yearUtils';
import {
  Search,
  X,
  Plus,
  Edit3,
  MapPin,
  Calendar,
  ArrowUpDown,
  BookOpen,
  Crown,
  Landmark,
  Shield,
  Award,
  Castle,
  Swords,
  Compass,
  Sparkles,
  Link2,
  SlidersHorizontal,
} from 'lucide-react';

interface Props {
  facts: FactItem[];
  selectedFact: FactItem | null;
  onSelectFact: (fact: FactItem) => void;
  onOpenDetail: (fact: FactItem) => void;
  collections?: CollectionItem[];
  selectedCollectionId?: string;
  onSelectCollection?: (id: string) => void;
  activeCategory?: string;
  onSelectCategory?: (id: string) => void;
  isAdmin?: boolean;
  onOpenAdminPin?: () => void;
  onOpenAddFact?: () => void;
  onOpenEditFact?: (fact: FactItem) => void;
  onOpenCollectionManager?: () => void;
  onOpenGallery?: () => void;
  onOpenTheme?: () => void;
  onClose?: () => void;
  onLogoutAdmin?: () => void;
}

type SortOption = 'year_asc' | 'year_desc' | 'category' | 'num';

const getCategoryIconComponent = (catId: string) => {
  switch (catId) {
    case 'principality':
      return Crown;
    case 'civilization':
      return Landmark;
    case 'leader':
      return Shield;
    case 'scholar':
      return BookOpen;
    case 'official':
      return Award;
    case 'castle':
      return Castle;
    case 'battle':
      return Swords;
    case 'monument':
      return Compass;
    default:
      return Sparkles;
  }
};

export const FactsList: React.FC<Props> = ({
  facts,
  selectedFact,
  onSelectFact,
  onOpenDetail,
  isAdmin = false,
  onOpenAddFact,
  onOpenEditFact,
  onClose,
  onLogoutAdmin,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('year_asc');

  // Filter & Sort facts
  const filteredFacts = useMemo(() => {
    let list = facts;

    // Filter by unified category
    if (categoryFilter && categoryFilter !== 'all') {
      list = list.filter((fact) => getCategoryInfo(fact).id === categoryFilter);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter((fact) => {
        return (
          fact.name.toLowerCase().includes(q) ||
          fact.desc.toLowerCase().includes(q) ||
          fact.fullText.toLowerCase().includes(q) ||
          (fact.additionalNotes && fact.additionalNotes.toLowerCase().includes(q)) ||
          (fact.region && fact.region.toLowerCase().includes(q)) ||
          (fact.year && fact.year.toLowerCase().includes(q)) ||
          (fact.century && fact.century.toLowerCase().includes(q)) ||
          fact.num.toString() === q
        );
      });
    }

    // Sort by selected criteria
    return [...list].sort((a, b) => {
      if (sortBy === 'year_asc') {
        const yearA = getFactChronologicalYear(a);
        const yearB = getFactChronologicalYear(b);
        if (yearA !== yearB) return yearA - yearB;
        return a.num - b.num;
      }
      if (sortBy === 'year_desc') {
        const yearA = getFactChronologicalYear(a);
        const yearB = getFactChronologicalYear(b);
        if (yearA !== yearB) return yearB - yearA;
        return b.num - a.num;
      }
      if (sortBy === 'category') {
        const catA = getCategoryInfo(a).name;
        const catB = getCategoryInfo(b).name;
        const comp = catA.localeCompare(catB, 'ckb');
        if (comp !== 0) return comp;
        return getFactChronologicalYear(a) - getFactChronologicalYear(b);
      }
      // Default: By fact number
      return a.num - b.num;
    });
  }, [facts, categoryFilter, searchTerm, sortBy]);

  // Compute category counts for badge indicators
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: facts.length };
    facts.forEach((fact) => {
      const cat = getCategoryInfo(fact).id;
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [facts]);

  return (
    <div className="flex flex-col h-full w-full text-right select-none font-sans bg-[#070913] text-slate-100 overflow-hidden">
      {/* Top Header & Navigation Bar (دیزاینی ڕێکخستنی پێڕست) */}
      <header className="px-4 py-3 sm:px-6 border-b border-white/10 shrink-0 bg-[#0c101d]/90 backdrop-blur-xl flex flex-col gap-3 z-10 shadow-lg">
        {/* Row 1: Title, Search & Main Action Controls */}
        <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          {/* Title & Counter */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl liquid-glass-btn flex items-center justify-center text-amber-400 shrink-0 shadow-sm">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold font-heading text-white tracking-wide truncate">
                پێڕستی بابەتە مێژووییەکان
              </h2>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                <span className="text-amber-300 font-bold">{filteredFacts.length}</span> لە{' '}
                <span>{facts.length} بابەت</span>
              </div>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md w-full">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="گەڕان بەپێی ناو، دەسەڵات، ساڵ، شوێن و زانیاری..."
              className="w-full liquid-glass-input text-slate-100 placeholder:text-slate-400 text-xs pr-9 pl-8 py-2 rounded-xl focus:border-amber-400 focus:outline-none transition-all text-right h-9"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white cursor-pointer transition-colors"
                title="سڕینەوە"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sorting, Admin & Close Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Sort Dropdown Selector */}
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl px-2 h-9">
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-[11px] font-bold text-slate-200 focus:outline-none cursor-pointer pr-1"
                title="ڕیزبەندی بابەتەکان"
              >
                <option value="year_asc" className="bg-[#0f1424] text-slate-100">
                  ڕیزبەندی: بەپێی ساڵ (کۆن بۆ نوێ)
                </option>
                <option value="year_desc" className="bg-[#0f1424] text-slate-100">
                  ڕیزبەندی: بەپێی ساڵ (نوێ بۆ کۆن)
                </option>
                <option value="category" className="bg-[#0f1424] text-slate-100">
                  ڕیزبەندی: بەپێی پۆلێن
                </option>
                <option value="num" className="bg-[#0f1424] text-slate-100">
                  ڕیزبەندی: بەپێی زنجیرە (#1-350)
                </option>
              </select>
            </div>

            {isAdmin && onOpenAddFact && (
              <button
                onClick={onOpenAddFact}
                className="flex items-center gap-1 px-3 h-9 rounded-xl liquid-glass-btn-active text-black font-extrabold text-xs shadow-md transition-all cursor-pointer active:scale-95"
                title="زیادکردنی بابەتی نوێ"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span className="hidden sm:inline">زیادکردن</span>
              </button>
            )}

            {isAdmin && onLogoutAdmin && (
              <button
                onClick={onLogoutAdmin}
                className="px-2.5 h-9 rounded-xl text-[10px] font-bold text-red-300 bg-red-950/70 hover:bg-red-900/70 border border-red-800/60 transition-colors cursor-pointer shrink-0"
                title="دەرچوون لە ئەدمین"
              >
                دەرچوون
              </button>
            )}

            {onClose && (
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-xl liquid-glass-btn text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
                title="داخستنی پێڕست"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Unified Categories Filter Strip (پۆلێنەکان) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px]">
          <span className="text-[10px] text-amber-300 font-bold shrink-0 flex items-center gap-1 pl-1">
            <SlidersHorizontal className="w-3 h-3 text-amber-400" />
            <span>پۆلێن:</span>
          </span>
          {UNIFIED_CATEGORIES.map((cat) => {
            const isSelected = categoryFilter === cat.id;
            const count = categoryCounts[cat.id] || 0;

            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded-xl transition-all flex items-center gap-1.5 shrink-0 border cursor-pointer ${
                  isSelected
                    ? 'liquid-glass-btn-active text-black font-extrabold shadow-sm scale-105'
                    : 'liquid-glass-btn text-slate-200 hover:text-white border-white/10'
                }`}
                style={
                  isSelected
                    ? undefined
                    : { borderColor: `${cat.color}35`, backgroundColor: `${cat.color}10` }
                }
              >
                {cat.id !== 'all' && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: cat.color }}
                  />
                )}
                <span className="font-bold">{cat.name}</span>
                <span
                  className={`font-mono text-[9px] px-1 rounded-md ${
                    isSelected
                      ? 'bg-black/25 text-black font-bold'
                      : 'bg-white/10 text-slate-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Grid Workspace for Facts (شێوازی Grid بە وێنەی سوچ و زانیاری) */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        {filteredFacts.length === 0 ? (
          <div className="h-full min-h-[350px] flex flex-col items-center justify-center p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl liquid-glass-btn mx-auto flex items-center justify-center text-amber-400">
              <Search className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-bold text-base text-slate-200">هیچ بابەتێک نەدۆزرایەوە</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                دەتوانیت پۆلێنەکە بگۆڕیت، شێوازی ڕیزبەندی بگۆڕیت یان دەستەواژەی گەڕانەکەت پاک بکەیتەوە.
              </p>
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 rounded-xl liquid-glass-btn text-amber-300 font-bold text-xs cursor-pointer hover:text-white"
              >
                پاککردنەوەی گەڕان
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4">
            {filteredFacts.map((fact) => {
              const isSelected = selectedFact?.id === fact.id;
              const catInfo = getCategoryInfo(fact);
              const CatIcon = getCategoryIconComponent(catInfo.id);
              const hasLinks =
                (Array.isArray(fact.relatedFactIds) && fact.relatedFactIds.length > 0) ||
                typeof fact.parentFactId === 'number';

              return (
                <div
                  key={fact.id}
                  onClick={() => onSelectFact(fact)}
                  className={`group relative rounded-2xl p-3.5 flex flex-col justify-between transition-all duration-200 cursor-pointer text-right border ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-400/80 shadow-[0_0_25px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/50'
                      : 'liquid-glass-card hover:border-amber-400/50 hover:shadow-xl hover:-translate-y-0.5'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Top Row: Corner Image + Name & Badges */}
                    <div className="flex items-start gap-3">
                      {/* Corner Image (لە سوچێکی هەر بابەتێک وێنەکەی دیاربێت) */}
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden shrink-0 border border-amber-400/35 bg-black/60 shadow-md group-hover:scale-105 group-hover:border-amber-400/70 transition-all flex items-center justify-center">
                        {fact.imageUrl ? (
                          <img
                            src={fact.imageUrl}
                            alt={fact.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex flex-col items-center justify-center text-center p-1"
                            style={{
                              backgroundColor: `${catInfo.color}25`,
                            }}
                          >
                            <CatIcon className="w-5 h-5" style={{ color: catInfo.color }} />
                            <span className="text-[8px] font-mono font-bold text-amber-300 mt-0.5">
                              #{fact.num}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Title & Chronology */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          {/* Number Badge */}
                          <span
                            className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-md shrink-0 border"
                            style={{
                              backgroundColor: `${catInfo.color}15`,
                              color: catInfo.color,
                              borderColor: `${catInfo.color}35`,
                            }}
                          >
                            #{fact.num}
                          </span>

                          {/* Year / Century */}
                          {(fact.century || fact.year) && (
                            <span className="font-mono text-[9px] font-bold text-amber-300 bg-amber-950/70 border border-amber-800/40 px-1.5 py-0.2 rounded shrink-0 flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5 text-amber-400" />
                              <span>{fact.year || fact.century}</span>
                            </span>
                          )}
                        </div>

                        {/* Fact Title */}
                        <h3
                          className={`text-xs sm:text-[13px] font-bold line-clamp-1 transition-colors ${
                            isSelected ? 'text-white' : 'text-slate-100 group-hover:text-amber-300'
                          }`}
                        >
                          {fact.name}
                        </h3>

                        {/* Location / Region */}
                        {fact.desc && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate mt-0.5">
                            <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="truncate">{fact.desc}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Brief description / Summary */}
                    <p className="text-[11px] sm:text-xs text-slate-300/90 line-clamp-2 leading-relaxed">
                      {fact.fullText || fact.desc}
                    </p>
                  </div>

                  {/* Card Bottom: Category Badge, Links & Action Buttons */}
                  <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
                    {/* Category Pill with Colored Indicator */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="text-[9px] font-bold border px-2 py-0.5 rounded-lg shrink-0 flex items-center gap-1"
                        style={{
                          backgroundColor: `${catInfo.color}18`,
                          color: catInfo.color,
                          borderColor: `${catInfo.color}40`,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: catInfo.color }}
                        />
                        <span className="truncate max-w-[90px]">{catInfo.name}</span>
                      </span>

                      {/* Linked Topics Badge */}
                      {hasLinks && (
                        <span
                          className="inline-flex items-center gap-0.5 text-[8px] bg-white/10 text-amber-300 px-1.5 py-0.5 rounded-md border border-white/10 shrink-0 font-bold"
                          title="خاوەنی بابەتی بەستراوەیە"
                        >
                          <Link2 className="w-2.5 h-2.5" />
                          <span>{fact.relatedFactIds?.length || 1}</span>
                        </span>
                      )}
                    </div>

                    {/* Action Buttons: Detail & Admin Edit */}
                    <div className="flex items-center gap-1 shrink-0">
                      {isAdmin && onOpenEditFact && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenEditFact(fact);
                          }}
                          title="دەستکاریکردنی ئەم دەسەڵاتە"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDetail(fact);
                        }}
                        title="بینینی تەواوی زانیاری و سەرچاوەکان"
                        className="px-2.5 py-1 rounded-xl liquid-glass-btn text-amber-300 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                      >
                        <span>زانیاری</span>
                        <BookOpen className="w-3 h-3 text-amber-400" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
