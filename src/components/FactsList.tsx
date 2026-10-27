import React, { useState, useMemo } from 'react';
import { FactItem } from '../data/kurdishHistoryData';
import { CollectionItem, UNIFIED_CATEGORIES, getCategoryInfo } from '../types/history';
import { getFactChronologicalYear } from '../utils/yearUtils';
import { getFactDisplayImage } from '../utils/historicalImages';
import { getOptimizedImageUrl } from '../utils/imageUtils';
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
  Columns2,
  Maximize2,
  Minimize2,
  Image as ImageIcon,
} from 'lucide-react';


interface Props {
  facts: FactItem[];
  selectedFact: FactItem | null;
  onSelectFact: (fact: FactItem) => void;
  onOpenDetail: (fact: FactItem) => void;
  onHoverFact?: (fact: FactItem) => void;
  isSplitMode?: boolean;
  onToggleSplitMode?: () => void;
  mobileSheetState?: 'peek' | 'half' | 'full';
  onToggleMobileSheet?: (state: 'peek' | 'half' | 'full') => void;
  collections?: CollectionItem[];
  selectedCollectionId?: string;
  onSelectCollection?: (id: string) => void;
  activeCategory?: string;
  onSelectCategory?: (id: string) => void;
  isAdmin?: boolean;
  onOpenAdminPin?: () => void;
  onOpenAddFact?: (mode?: 'photo_only' | 'standard') => void;
  onOpenEditFact?: (fact: FactItem) => void;
  onOpenCollectionManager?: () => void;
  onOpenGallery?: () => void;
  onOpenTheme?: () => void;
  onOpenSocialCard?: (fact: FactItem) => void;
  onClose?: () => void;
  onLogoutAdmin?: () => void;
}

type SortOption = 'latest_added' | 'year_asc' | 'year_desc' | 'category' | 'num';

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
  onHoverFact,
  isSplitMode = true,
  onToggleSplitMode,
  mobileSheetState = 'half',
  onToggleMobileSheet,
  isAdmin = false,
  onOpenAddFact,
  onOpenEditFact,
  onOpenSocialCard,
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
      if (sortBy === 'latest_added') {
        const isCustomA = !!a.isCustom || a.id > 1000000;
        const isCustomB = !!b.isCustom || b.id > 1000000;
        if (isCustomA && !isCustomB) return -1;
        if (!isCustomA && isCustomB) return 1;
        if (b.id !== a.id) return b.id - a.id;
        return b.num - a.num;
      }
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
    <div className="flex flex-col h-full w-full text-right select-none font-sans bg-[#030611] text-slate-100 overflow-hidden">
      {/* 2026 Spatial Command Header */}
      <header className="px-4 py-3.5 sm:px-6 border-b border-white/[0.08] shrink-0 bg-[#070b16]/90 backdrop-blur-2xl flex flex-col gap-3.5 z-10 shadow-2xl">
        {/* Row 1: Brand / Title + Command Search + Action Dock */}
        <div className="flex items-center justify-between gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
          {/* Logo & Headline */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-2xl glass-dock-2026 flex items-center justify-center text-amber-400 shadow-md">
              <BookOpen className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold font-heading text-white tracking-wide">
                  ئەرشیفی دەسەڵاتە مێژووییەکان
                </h2>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-md bg-amber-400/10 text-amber-300 border border-amber-400/20 font-semibold tracking-wider">
                  2026 HUD
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5 font-medium">
                <span className="font-mono tabular-nums text-amber-300 font-bold">{filteredFacts.length}</span>
                <span className="text-slate-600">/</span>
                <span className="font-mono tabular-nums text-slate-400">{facts.length}</span>
                <span className="text-slate-500 text-[11px]">بابەت لە ئەرشیفدا</span>
              </div>
            </div>
          </div>

          {/* 2026 Command Search Input */}
          <div className="relative flex-1 max-w-xl min-w-[260px] order-3 sm:order-2 w-full sm:w-auto">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="گەڕان بەپێی ناوی میرنشین، سەرکردە، سەدە، شار یان ناوچە..."
              className="w-full bg-white/[0.04] hover:bg-white/[0.06] text-slate-100 placeholder:text-slate-500 text-xs pr-10 pl-16 py-2.5 rounded-2xl border border-white/[0.1] focus:border-amber-400/80 focus:bg-white/[0.08] focus:outline-none transition-all text-right h-10.5 shadow-inner"
            />
            {searchTerm ? (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white cursor-pointer transition-colors"
                title="سڕینەوە"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-mono text-slate-400 pointer-events-none bg-white/[0.05] px-1.5 py-0.5 rounded-md border border-white/5">
                <span>⌘K</span>
              </div>
            )}
          </div>

          {/* Actions: Admin + Close Fullscreen */}
          <div className="flex items-center gap-2 shrink-0 order-2 sm:order-3">
            {isAdmin && onOpenAddFact && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onOpenAddFact('photo_only')}
                  className="flex items-center gap-1.5 px-3 h-9.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold text-xs shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all cursor-pointer active:scale-95"
                  title="زیادکردنی وێنەی مێژوویی (فۆڕمی تایبەت)"
                >
                  <ImageIcon className="w-4 h-4 stroke-[2.5]" />
                  <span className="hidden sm:inline">وێنەی مێژوویی</span>
                </button>
                <button
                  onClick={() => onOpenAddFact('standard')}
                  className="flex items-center gap-1.5 px-3 h-9.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-white font-bold text-xs transition-all cursor-pointer active:scale-95"
                  title="زیادکردنی بابەتی گشتی"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span className="hidden sm:inline">بابەتی نوێ</span>
                </button>
              </div>
            )}

            {isAdmin && onLogoutAdmin && (
              <button
                onClick={onLogoutAdmin}
                className="px-3 h-9.5 rounded-xl text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/40 transition-colors cursor-pointer"
                title="دەرچوون لە ئەدمین"
              >
                دەرچوون
              </button>
            )}

            {onClose && (
              <button
                onClick={onClose}
                className="h-9.5 px-3 sm:px-3.5 flex items-center gap-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 hover:text-white transition-all cursor-pointer border border-white/[0.1] active:scale-95"
                title="داخستن و گەڕانەوە بۆ نەخشە"
              >
                <span className="text-xs font-medium hidden sm:inline">گەڕانەوە بۆ نەخشە</span>
                <X className="w-4 h-4 text-amber-400" />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Precision Filter & Chronological Sorting Dock */}
        <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-white/[0.06] flex-wrap">
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            {/* Category Dropdown with Specular Glass */}
            <div className="flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.07] rounded-xl px-3 h-9 border border-white/[0.09] text-xs transition-colors">
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">پۆلێن:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-100 focus:outline-none cursor-pointer pr-1"
                title="فلتەر بەپێی پۆلێن"
              >
                <option value="all" className="bg-[#0c101d] text-slate-100">
                  هەموو پۆلێنەکان ({facts.length})
                </option>
                {UNIFIED_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-[#0c101d] text-slate-100">
                    {cat.name} ({categoryCounts[cat.id] || 0})
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.07] rounded-xl px-3 h-9 border border-white/[0.09] text-xs transition-colors">
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">ڕیزکردن:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-xs font-semibold text-slate-100 focus:outline-none cursor-pointer pr-1"
                title="ڕیزبەندی بابەتەکان"
              >
                <option value="latest_added" className="bg-[#0c101d] text-slate-100 font-bold text-amber-300">
                  دوایین و کۆتا تۆمارکراو
                </option>
                <option value="year_asc" className="bg-[#0c101d] text-slate-100">
                  ساڵ (کۆن بۆ نوێ)
                </option>
                <option value="year_desc" className="bg-[#0c101d] text-slate-100">
                  ساڵ (نوێ بۆ کۆن)
                </option>
                <option value="category" className="bg-[#0c101d] text-slate-100">
                  بەپێی جۆری دەسەڵات
                </option>
                <option value="num" className="bg-[#0c101d] text-slate-100">
                  بەپێی تۆمارکردنی سەرەتا
                </option>
              </select>
            </div>

            {/* Reset Filter Button */}
            {(categoryFilter !== 'all' || searchTerm) && (
              <button
                onClick={() => {
                  setCategoryFilter('all');
                  setSearchTerm('');
                }}
                className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold cursor-pointer border border-amber-400/20 transition-all"
                title="پاککردنەوەی هەموو فلتەرەکان"
              >
                <X className="w-3 h-3" />
                <span>پاککردنەوەی فلتەر</span>
              </button>
            )}
          </div>

          {/* Status Metric */}
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <span>نیشاندراو:</span>
            <span className="font-mono tabular-nums text-amber-300 font-bold">{filteredFacts.length}</span>
            <span className="text-slate-600">دەسەڵات و تۆمار</span>
          </div>
        </div>
      </header>

      {/* Main Responsive Grid Layout for Facts */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 custom-scrollbar">
        {filteredFacts.length === 0 ? (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl glass-dock-2026 mx-auto flex items-center justify-center text-amber-400">
              <Search className="w-8 h-8 stroke-[1.8]" />
            </div>
            <div>
              <h4 className="font-extrabold text-lg text-white font-heading">هیچ بابەتێک نەدۆزرایەوە</h4>
              <p className="text-xs text-slate-400 mt-1.5 max-w-sm leading-relaxed">
                دەتوانیت پۆلێنەکە بگۆڕیت، شێوازی ڕیزبەندی ڕێکبخەیتەوە یان وشەی گەڕانەکەت پاک بکەیتەوە.
              </p>
            </div>
            {(categoryFilter !== 'all' || searchTerm) && (
              <button
                onClick={() => {
                  setCategoryFilter('all');
                  setSearchTerm('');
                }}
                className="px-4 py-2 rounded-xl bg-amber-400 text-black font-extrabold text-xs cursor-pointer hover:bg-amber-300 transition-all shadow-md active:scale-95"
              >
                پاککردنەوەی فلتەر
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5">
            {filteredFacts.map((fact) => {
              const isSelected = selectedFact?.id === fact.id;
              const catInfo = getCategoryInfo(fact);
              const CatIcon = getCategoryIconComponent(catInfo.id);
              const displayImage = getFactDisplayImage(fact);
              const hasLinks =
                (Array.isArray(fact.relatedFactIds) && fact.relatedFactIds.length > 0) ||
                typeof fact.parentFactId === 'number';

              return (
                <div
                  key={fact.id}
                  onMouseEnter={() => {
                    if (onHoverFact) onHoverFact(fact);
                  }}
                  onClick={() => {
                    onSelectFact(fact);
                  }}
                  className={`group relative rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer text-right ${
                    isSelected
                      ? 'bg-amber-500/[0.12] border border-amber-400/80 shadow-[0_0_30px_rgba(245,158,11,0.22)] ring-1 ring-amber-400/40 -translate-y-0.5'
                      : 'card-editorial-2026 hover:border-amber-400/40 hover:-translate-y-1'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header Row: Corner Media Avatar + Title + Tabular Number */}
                    <div className="flex items-start gap-3">
                      {/* Avatar Image in High-Precision Aspect Circle */}
                      <div className="relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-white/[0.12] bg-[#050814] shadow-md group-hover:scale-105 group-hover:border-amber-400/60 transition-all flex items-center justify-center">
                        {displayImage ? (
                          <img
                            src={getOptimizedImageUrl(displayImage, 'thumb')}
                            alt={fact.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ backgroundColor: `${catInfo.color}18` }}
                          >
                            <CatIcon className="w-5 h-5" style={{ color: catInfo.color }} />
                          </div>
                        )}
                      </div>

                      {/* Title & Chronology */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <h3
                            className={`text-xs sm:text-[13px] font-extrabold font-heading line-clamp-1 transition-colors ${
                              isSelected ? 'text-amber-300' : 'text-slate-100 group-hover:text-amber-300'
                            }`}
                          >
                            {fact.name}
                          </h3>
                        </div>

                        {/* Unboxed Metadata: Category · Year/Century */}
                        <div className="flex items-center gap-1.5 text-[11px] mt-1 text-slate-400">
                          <span className="font-semibold" style={{ color: catInfo.color }}>
                            {catInfo.name}
                          </span>
                          <span aria-hidden="true" className="text-slate-600 font-mono">·</span>
                          <span className="font-mono tabular-nums text-amber-300/90 font-medium">
                            {fact.year || fact.century || 'سەردەمی دێرین'}
                          </span>
                        </div>

                        {/* Location / Geography */}
                        {fact.desc && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate mt-1">
                            <MapPin className="w-3 h-3 text-amber-400/70 shrink-0" />
                            <span className="truncate">{fact.desc}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Summary Body */}
                    <p className="text-[11px] text-slate-300/80 line-clamp-2 leading-relaxed">
                      {fact.fullText || fact.desc}
                    </p>
                  </div>

                  {/* Card Bottom: Unboxed Indicators & Precision Actions */}
                  <div className="mt-3.5 pt-2.5 border-t border-white/[0.07] flex items-center justify-between gap-2">
                    {/* Unboxed Relation Indicator */}
                    <div className="flex items-center gap-2 min-w-0 text-slate-400 text-[10px]">
                      {hasLinks && (
                        <span
                          className="inline-flex items-center gap-1 font-mono text-[10px] text-amber-300/90 font-semibold"
                          title="خاوەنی بابەتی پەیوەندیدارە"
                        >
                          <Link2 className="w-3 h-3 text-amber-400" />
                          <span className="tabular-nums">{fact.relatedFactIds?.length || 1} پەیوەندیدار</span>
                        </span>
                      )}
                    </div>

                    {/* Actions: Admin Edit & Detail Button */}
                    <div className="flex items-center gap-1 shrink-0">
                      {isAdmin && onOpenEditFact && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenEditFact(fact);
                          }}
                          title="دەستکاریکردنی ئەم دەسەڵاتە"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-white/[0.08] transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {onOpenSocialCard && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenSocialCard(fact);
                          }}
                          title="دروستکردنی کارتی بڵاوکردنەوە بۆ سۆشیال میدیا و ستۆری"
                          className="px-2 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold border border-amber-400/25"
                        >
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span className="hidden sm:inline">کارت</span>
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDetail(fact);
                        }}
                        title="بینینی تەواوی زانیاری و سەرچاوەکان"
                        className="px-2.5 py-1 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-amber-300 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold border border-white/[0.08]"
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
