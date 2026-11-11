import React, { useState, useMemo, useEffect } from 'react';
import { FactItem } from '../data/kurdishHistoryData';
import { CollectionItem, UNIFIED_CATEGORIES, getCategoryInfo } from '../types/history';
import { getFactChronologicalYear } from '../utils/yearUtils';
import { kurdishSearchMatch } from '../utils/kurdishSearch';
import { getFactDisplayImage } from '../utils/historicalImages';
import { getOptimizedImageUrl } from '../utils/imageUtils';
import {
  ProvinceItem,
  getProvincesWithCounts,
  filterFactsByProvince,
} from '../data/kurdishProvincesData';
import { ProvinceSelectorModal } from './ProvinceSelectorModal';
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
  LayoutGrid,
  List,
  Image as ImageIcon,
  Images,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

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
  selectedProvince?: string;
  onSelectProvince?: (provinceId: string, province?: ProvinceItem) => void;
  isAdmin?: boolean;
  onOpenAdminPin?: () => void;
  onOpenAddFact?: (mode?: 'photo_only' | 'standard') => void;
  onOpenSubmittedPhotos?: () => void;
  pendingSubmissionsCount?: number;
  onOpenEditFact?: (fact: FactItem) => void;
  onOpenCollectionManager?: () => void;
  onOpenGallery?: () => void;
  onOpenTheme?: () => void;
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
  activeCategory,
  onSelectCategory,
  selectedProvince = 'all',
  onSelectProvince,
  isAdmin = false,
  onOpenAddFact,
  onOpenSubmittedPhotos,
  pendingSubmissionsCount,
  onOpenEditFact,
  onClose,
  onLogoutAdmin,
}) => {
  const { colorMode, toggleColorMode } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>(activeCategory || 'all');
  const [provinceFilter, setProvinceFilter] = useState<string>(selectedProvince || 'all');
  const [isProvinceModalOpen, setIsProvinceModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('year_asc');

  // Adaptive view mode: default to compact list on mobile, grid on desktop
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return 'list';
    }
    return 'grid';
  });

  // Sync category filter if changed from outside
  useEffect(() => {
    if (activeCategory) {
      setCategoryFilter(activeCategory);
    }
  }, [activeCategory]);

  // Sync province filter if changed from outside
  useEffect(() => {
    if (selectedProvince !== undefined) {
      setProvinceFilter(selectedProvince);
    }
  }, [selectedProvince]);

  const handleCategoryChange = (cat: string) => {
    setCategoryFilter(cat);
    if (onSelectCategory) {
      onSelectCategory(cat);
    }
  };

  const handleProvinceChange = (provId: string, prov?: ProvinceItem) => {
    setProvinceFilter(provId);
    if (onSelectProvince) {
      onSelectProvince(provId, prov);
    }
  };

  // Compute provinces with counts for 47 Kurdistan provinces + outside Kurdistan with count >= 1
  const provincesWithCounts = useMemo(() => {
    return getProvincesWithCounts(facts);
  }, [facts]);

  // Filter & Sort facts
  const filteredFacts = useMemo(() => {
    let list = facts;

    // Filter by unified category
    if (categoryFilter && categoryFilter !== 'all') {
      list = list.filter((fact) => getCategoryInfo(fact).id === categoryFilter);
    }

    // Filter by province
    if (provinceFilter && provinceFilter !== 'all') {
      list = filterFactsByProvince(list, provinceFilter);
    }

    // Filter by search term with Kurdish / Arabic multi-keyboard normalization
    if (searchTerm.trim()) {
      const q = searchTerm.trim();
      list = list.filter((fact) => {
        return (
          kurdishSearchMatch(fact.name, q) ||
          kurdishSearchMatch(fact.desc, q) ||
          kurdishSearchMatch(fact.fullText, q) ||
          (fact.additionalNotes && kurdishSearchMatch(fact.additionalNotes, q)) ||
          (fact.region && kurdishSearchMatch(fact.region, q)) ||
          (fact.year && kurdishSearchMatch(fact.year, q)) ||
          (fact.century && kurdishSearchMatch(fact.century, q)) ||
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

  // Progressive chunking for instantaneous opening without UI thread freeze
  const INITIAL_BATCH = 24;
  const BATCH_SIZE = 24;
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_BATCH);

  // Reset pagination when search or filters change
  useEffect(() => {
    setVisibleCount(INITIAL_BATCH);
  }, [categoryFilter, searchTerm, sortBy]);

  const displayedFacts = useMemo(() => {
    return filteredFacts.slice(0, visibleCount);
  }, [filteredFacts, visibleCount]);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 300) {
      if (visibleCount < filteredFacts.length) {
        setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, filteredFacts.length));
      }
    }
  };

  const isFilterActive = categoryFilter !== 'all' || searchTerm.trim().length > 0;

  return (
    <div
      className={`flex flex-col h-full w-full text-right select-none font-sans overflow-hidden transition-colors ${
        colorMode === 'light' ? 'bg-[#f8f9fa] text-slate-800' : 'bg-[#030611] text-slate-100'
      }`}
    >
      {/* Header Container: Ultra-compact on mobile, spacious HUD on desktop */}
      <header
        className={`border-b shrink-0 backdrop-blur-2xl z-20 shadow-md transition-colors ${
          colorMode === 'light'
            ? 'bg-[#ffffff]/95 border-slate-200'
            : 'bg-[#070b16]/95 border-white/[0.08]'
        }`}
      >
        {/* ================= MOBILE COMPACT HEADER (< sm) ================= */}
        <div className="flex sm:hidden flex-col gap-1.5 px-2.5 py-2">
          {/* Mobile Row 1: Title + Count + Quick Action Icons */}
          <div className="flex items-center justify-between gap-2">
            {/* Title & Count */}
            <div className="flex items-center gap-1.5 min-w-0">
              <img
                src="/kimlogo.png"
                alt="Logo"
                className="w-5 h-5 rounded-md object-contain shrink-0"
              />
              <h2 className="text-xs font-black font-heading text-white truncate tracking-wide">
                پێڕستی دەسەڵاتەکان
              </h2>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-amber-400/15 text-amber-300 border border-amber-400/25 shrink-0">
                {filteredFacts.length}
              </span>
            </div>

            {/* Actions: View Toggle, Theme, Admin, Close */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* View Mode Toggle: List vs Grid */}
              <button
                onClick={() => setViewMode((prev) => (prev === 'grid' ? 'list' : 'grid'))}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-amber-300 border border-white/10 transition-all cursor-pointer active:scale-95"
                title={viewMode === 'grid' ? 'گۆڕین بۆ لیستی پوخت' : 'گۆڕین بۆ کارتەکان'}
                aria-label="شێوازی نیشاندان"
              >
                {viewMode === 'grid' ? (
                  <List className="w-4 h-4" />
                ) : (
                  <LayoutGrid className="w-4 h-4" />
                )}
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleColorMode}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.06] text-amber-400 border border-white/10 transition-all cursor-pointer active:scale-95"
                title={colorMode === 'light' ? 'دۆخی تاریک' : 'دۆخی ڕووناک'}
              >
                {colorMode === 'light' ? (
                  <Sun className="w-4 h-4 text-amber-500" />
                ) : (
                  <Moon className="w-4 h-4 text-amber-400" />
                )}
              </button>

              {/* Admin Add Fact */}
              {isAdmin && onOpenAddFact && (
                <button
                  onClick={() => onOpenAddFact('standard')}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-amber-400 text-black font-bold transition-all cursor-pointer active:scale-95 shadow-sm"
                  title="زیادکردنی بابەتی نوێ"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                </button>
              )}

              {/* Close Button */}
              {onClose && (
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all cursor-pointer active:scale-95"
                  title="داخستن و گەڕانەوە"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Mobile Row 2: Search Input + Compact Category & Sort Dropdowns in One Slim Line */}
          <div className="flex items-center gap-1.5">
            {/* Slim Search Input */}
            <div className="relative flex-1 min-w-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="گەڕان بەپێی ناو، سەدە، شار..."
                className="w-full bg-white/[0.05] text-slate-100 placeholder:text-slate-500 text-[11px] pr-7.5 pl-6 py-1.5 rounded-xl border border-white/[0.1] focus:border-amber-400/80 focus:bg-white/[0.08] focus:outline-none transition-all text-right h-8"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-white cursor-pointer"
                  title="سڕینەوە"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Compact Category Dropdown */}
            <div className="relative shrink-0 max-w-[130px]">
              <select
                value={categoryFilter}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full h-8 px-2 rounded-xl bg-white/[0.06] border border-white/10 text-[11px] font-bold text-amber-300 focus:outline-none cursor-pointer truncate appearance-none"
                title="پۆلێن"
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

            {/* Compact Sort Dropdown */}
            <div className="relative shrink-0 max-w-[95px]">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full h-8 px-2 rounded-xl bg-white/[0.06] border border-white/10 text-[11px] font-medium text-slate-200 focus:outline-none cursor-pointer truncate appearance-none"
                title="ڕیزکردن"
              >
                <option value="latest_added" className="bg-[#0c101d] text-amber-300 font-bold">
                  نوێترین تۆمار
                </option>
                <option value="year_asc" className="bg-[#0c101d] text-slate-100">
                  ساڵ (کۆن بۆ نوێ)
                </option>
                <option value="year_desc" className="bg-[#0c101d] text-slate-100">
                  ساڵ (نوێ بۆ کۆن)
                </option>
                <option value="category" className="bg-[#0c101d] text-slate-100">
                  بەپێی پۆلێن
                </option>
                <option value="num" className="bg-[#0c101d] text-slate-100">
                  بەپێی ڕیزبەندی
                </option>
              </select>
            </div>

            {/* Compact Province Button */}
            <button
              onClick={() => setIsProvinceModalOpen(true)}
              className={`h-8 px-2 rounded-xl border text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 transition-all ${
                provinceFilter !== 'all'
                  ? 'bg-amber-400/25 text-amber-300 border-amber-400/50 shadow-xs'
                  : 'bg-white/[0.06] text-amber-300 border-white/10 hover:bg-white/[0.1]'
              }`}
              title="پۆلێنی پارێزگاکان"
            >
              <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate max-w-[70px]">
                {provinceFilter === 'all'
                  ? 'پارێزگا'
                  : provincesWithCounts.allProvinces.find((p) => p.id === provinceFilter)?.name || 'پارێزگا'}
              </span>
            </button>

            {/* Reset Button (only shown when filter is active) */}
            {isFilterActive && (
              <button
                onClick={() => {
                  handleCategoryChange('all');
                  handleProvinceChange('all');
                  setSearchTerm('');
                }}
                className="h-8 w-8 shrink-0 flex items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 transition-all cursor-pointer active:scale-95"
                title="پاککردنەوەی فلتەر"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ================= DESKTOP SPACIOUS HEADER (>= sm) ================= */}
        <div className="hidden sm:flex flex-col gap-3 px-6 py-3.5">
          {/* Row 1: Brand / Title + Command Search + Action Dock */}
          <div className="flex items-center justify-between gap-4">
            {/* Logo & Headline */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-2xl glass-dock-2026 flex items-center justify-center p-1 shadow-md overflow-hidden">
                <img
                  src="/kimlogo.png"
                  alt="KURDISTAN INFO MAP Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold font-heading text-white tracking-wide">
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

            {/* Command Search Input */}
            <div className="relative flex-1 max-w-xl min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="گەڕان بەپێی ناوی میرنشین، سەرکردە، سەدە، شار یان ناوچە..."
                className="w-full bg-white/[0.04] hover:bg-white/[0.06] text-slate-100 placeholder:text-slate-500 text-xs pr-10 pl-16 py-2.5 rounded-2xl border border-white/[0.1] focus:border-amber-400/80 focus:bg-white/[0.08] focus:outline-none transition-all text-right h-10 shadow-inner"
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

            {/* Desktop Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* View Toggle */}
              <button
                onClick={() => setViewMode((prev) => (prev === 'grid' ? 'list' : 'grid'))}
                className="h-9.5 px-3 flex items-center gap-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-amber-300 border border-white/10 transition-all cursor-pointer active:scale-95"
                title={viewMode === 'grid' ? 'گۆڕین بۆ لیستی پوخت' : 'گۆڕین بۆ کارتەکان'}
              >
                {viewMode === 'grid' ? (
                  <>
                    <List className="w-4 h-4" />
                    <span className="text-xs font-semibold">لیست</span>
                  </>
                ) : (
                  <>
                    <LayoutGrid className="w-4 h-4" />
                    <span className="text-xs font-semibold">کارتەکان</span>
                  </>
                )}
              </button>

              {isAdmin && (
                <div className="flex items-center gap-1.5">
                  {onOpenSubmittedPhotos && (
                    <button
                      onClick={onOpenSubmittedPhotos}
                      className="flex items-center gap-1.5 px-3 h-9.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-white border border-amber-400/40 font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
                      title="بینینی وێنە نێردراوەکان"
                    >
                      <Images className="w-4 h-4 text-amber-400" />
                      <span className="hidden sm:inline">وێنە نێردراوەکان</span>
                      <span className="sm:hidden">نێردراوەکان</span>
                      {typeof pendingSubmissionsCount === 'number' && pendingSubmissionsCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] animate-pulse">
                          {pendingSubmissionsCount}
                        </span>
                      )}
                    </button>
                  )}
                  {onOpenAddFact && (
                    <>
                      <button
                        onClick={() => onOpenAddFact('photo_only')}
                        className="flex items-center gap-1.5 px-3 h-9.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold text-xs shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all cursor-pointer active:scale-95"
                        title="زیادکردنی وێنەی مێژوویی"
                      >
                        <ImageIcon className="w-4 h-4 stroke-[2.5]" />
                        <span>وێنە</span>
                      </button>
                      <button
                        onClick={() => onOpenAddFact('standard')}
                        className="flex items-center gap-1.5 px-3 h-9.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-white font-bold text-xs transition-all cursor-pointer active:scale-95"
                        title="زیادکردنی بابەتی نوێ"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>بابەتی نوێ</span>
                      </button>
                    </>
                  )}
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

              {/* Theme Toggle */}
              <button
                onClick={toggleColorMode}
                className="h-9.5 px-3 flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.06] hover:bg-white/[0.12] text-amber-400 transition-all cursor-pointer active:scale-95"
                title={colorMode === 'light' ? 'دۆخی تاریک' : 'دۆخی ڕووناک'}
              >
                {colorMode === 'light' ? (
                  <Sun className="w-4 h-4 text-amber-500" />
                ) : (
                  <Moon className="w-4 h-4 text-amber-400" />
                )}
                <span className="text-xs font-semibold">
                  {colorMode === 'light' ? 'ڕووناک' : 'تاریک'}
                </span>
              </button>

              {/* Close Button */}
              {onClose && (
                <button
                  onClick={onClose}
                  className="h-9.5 px-3.5 flex items-center gap-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 hover:text-white transition-all cursor-pointer border border-white/[0.1] active:scale-95"
                  title="داخستن و گەڕانەوە"
                >
                  <span className="text-xs font-medium">داخستن</span>
                  <X className="w-4 h-4 text-amber-400" />
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Precision Filter & Chronological Sorting Dock */}
          <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              {/* Category Dropdown */}
              <div className="flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.07] rounded-xl px-3 h-9 border border-white/[0.09] text-xs transition-colors">
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-[11px] text-slate-400 font-medium">پۆلێن:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => handleCategoryChange(e.target.value)}
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

              {/* Province Dropdown */}
              <div className="flex items-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.07] rounded-xl px-2.5 h-9 border border-white/[0.09] text-xs transition-colors">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-[11px] text-slate-400 font-medium">پارێزگا:</span>
                <select
                  value={provinceFilter}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-100 focus:outline-none cursor-pointer pr-1 max-w-[140px] truncate"
                  title="فلتەر بەپێی پارێزگا"
                >
                  <option value="all" className="bg-[#0c101d] text-slate-100">
                    هەموو پارێزگاکان ({facts.length})
                  </option>
                  <optgroup label="باشووری کوردستان" className="bg-[#0c101d] text-emerald-400 font-bold">
                    {provincesWithCounts.kurdistanProvinces
                      .filter((p) => p.part === 'south')
                      .map((p) => (
                        <option key={p.id} value={p.id} className="bg-[#0c101d] text-slate-100">
                          {p.name} ({p.count})
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="باکووری کوردستان" className="bg-[#0c101d] text-amber-400 font-bold">
                    {provincesWithCounts.kurdistanProvinces
                      .filter((p) => p.part === 'north')
                      .map((p) => (
                        <option key={p.id} value={p.id} className="bg-[#0c101d] text-slate-100">
                          {p.name} ({p.count})
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="ڕۆژهەڵاتی کوردستان" className="bg-[#0c101d] text-cyan-400 font-bold">
                    {provincesWithCounts.kurdistanProvinces
                      .filter((p) => p.part === 'east')
                      .map((p) => (
                        <option key={p.id} value={p.id} className="bg-[#0c101d] text-slate-100">
                          {p.name} ({p.count})
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="ڕۆژئاوای کوردستان" className="bg-[#0c101d] text-purple-400 font-bold">
                    {provincesWithCounts.kurdistanProvinces
                      .filter((p) => p.part === 'west')
                      .map((p) => (
                        <option key={p.id} value={p.id} className="bg-[#0c101d] text-slate-100">
                          {p.name} ({p.count})
                        </option>
                      ))}
                  </optgroup>
                  {provincesWithCounts.outsideProvinces.length > 0 && (
                    <optgroup label="دەرەوەی کوردستان (تۆمارکراو)" className="bg-[#0c101d] text-rose-400 font-bold">
                      {provincesWithCounts.outsideProvinces.map((p) => (
                        <option key={p.id} value={p.id} className="bg-[#0c101d] text-slate-100">
                          {p.name} ({p.count})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <button
                  onClick={() => setIsProvinceModalOpen(true)}
                  className="p-1 rounded-lg hover:bg-white/10 text-amber-400 cursor-pointer"
                  title="کردنەوەی پێڕستی تەواوی پارێزگاکان"
                >
                  <Compass className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.07] rounded-xl px-3 h-9 border border-white/[0.09] text-xs transition-colors">
                <ArrowUpDown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-[11px] text-slate-400 font-medium">ڕیزکردن:</span>
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
              {isFilterActive && (
                <button
                  onClick={() => {
                    handleCategoryChange('all');
                    handleProvinceChange('all');
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
        </div>
      </header>

      {/* Main Scrollable Content Area */}
      <main onScroll={handleScroll} className="flex-1 overflow-y-auto p-2 sm:p-5 lg:p-6 custom-scrollbar">
        {filteredFacts.length === 0 ? (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl glass-dock-2026 mx-auto flex items-center justify-center text-amber-400">
              <Search className="w-7 h-7 stroke-[1.8]" />
            </div>
            <div>
              <h4 className="font-extrabold text-base text-white font-heading">هیچ بابەتێک نەدۆزرایەوە</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
                دەتوانیت پۆلێنەکە بگۆڕیت، شێوازی ڕیزبەندی ڕێکبخەیتەوە یان وشەی گەڕانەکەت پاک بکەیتەوە.
              </p>
            </div>
            {isFilterActive && (
              <button
                onClick={() => {
                  handleCategoryChange('all');
                  setSearchTerm('');
                }}
                className="px-4 py-2 rounded-xl bg-amber-400 text-black font-extrabold text-xs cursor-pointer hover:bg-amber-300 transition-all shadow-md active:scale-95"
              >
                پاککردنەوەی فلتەر
              </button>
            )}
          </div>
        ) : viewMode === 'list' ? (
          /* ================= HIGH-DENSITY COMPACT LIST VIEW ================= */
          <div className="flex flex-col gap-2 max-w-4xl mx-auto">
            {displayedFacts.map((fact) => {
              const isSelected = selectedFact?.id === fact.id;
              const catInfo = getCategoryInfo(fact);
              const CatIcon = getCategoryIconComponent(catInfo.id);
              const displayImage = getFactDisplayImage(fact);
              const hasLinks =
                (Array.isArray(fact.relatedFactIds) && fact.relatedFactIds.length > 0) ||
                typeof fact.parentFactId === 'number' ||
                (Array.isArray(fact.allyFactIds) && fact.allyFactIds.length > 0);

              return (
                <div
                  key={fact.id}
                  onMouseEnter={() => {
                    if (onHoverFact) onHoverFact(fact);
                  }}
                  onClick={() => onSelectFact(fact)}
                  className={`group relative rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-3 transition-all duration-200 cursor-pointer border text-right ${
                    isSelected
                      ? 'bg-amber-500/[0.16] border-amber-400/80 shadow-[0_0_24px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/40 -translate-y-0.5'
                      : colorMode === 'light'
                      ? 'bg-white hover:bg-slate-50 border-slate-200 hover:border-amber-400/40 shadow-xs'
                      : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.08] hover:border-amber-400/30'
                  }`}
                >
                  {/* Right Side: Media Avatar + Core Info */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Thumbnail Avatar */}
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-[#050814] flex items-center justify-center shadow-xs">
                      {displayImage ? (
                        <img
                          src={getOptimizedImageUrl(displayImage, 'thumb')}
                          alt={fact.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ backgroundColor: `${catInfo.color}20` }}
                        >
                          <CatIcon className="w-5 h-5" style={{ color: catInfo.color }} />
                        </div>
                      )}
                    </div>

                    {/* Texts: Title, Category pill, Date, Desc */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-xs sm:text-sm font-extrabold font-heading text-white group-hover:text-amber-300 transition-colors truncate">
                          {fact.name}
                        </h3>
                        <span
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded-md font-semibold shrink-0"
                          style={{
                            backgroundColor: `${catInfo.color}20`,
                            color: catInfo.color,
                          }}
                        >
                          {catInfo.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5 truncate">
                        <span className="font-mono tabular-nums text-amber-300 font-bold shrink-0">
                          {fact.year || fact.century || 'سەردەمی دێرین'}
                        </span>
                        {fact.desc && (
                          <>
                            <span className="text-slate-600 font-mono">·</span>
                            <span className="truncate text-slate-400 text-[10px]">{fact.desc}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Left Side: Badges + Precision Actions */}
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {hasLinks && (
                      <span
                        className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-amber-300/80 px-2 py-0.5 rounded-lg bg-amber-400/10 border border-amber-400/20"
                        title="خاوەنی بابەتی بەستراوە"
                      >
                        <Link2 className="w-3 h-3 text-amber-400" />
                        <span className="tabular-nums">بەستراو</span>
                      </span>
                    )}

                    {isAdmin && onOpenEditFact && (
                      <button
                        onClick={() => onOpenEditFact(fact)}
                        title="دەستکاریکردنی ئەم دەسەڵاتە"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-white/[0.08] transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => onOpenDetail(fact)}
                      title="بینینی تەواوی زانیاری و سەرچاوەکان"
                      className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-white border border-amber-400/30 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                    >
                      <span>زانیاری</span>
                      <BookOpen className="w-3 h-3 text-amber-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ================= RESPONSIVE GRID CARDS VIEW ================= */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
            {displayedFacts.map((fact) => {
              const isSelected = selectedFact?.id === fact.id;
              const catInfo = getCategoryInfo(fact);
              const CatIcon = getCategoryIconComponent(catInfo.id);
              const displayImage = getFactDisplayImage(fact);
              const hasLinks =
                (Array.isArray(fact.relatedFactIds) && fact.relatedFactIds.length > 0) ||
                typeof fact.parentFactId === 'number' ||
                (Array.isArray(fact.allyFactIds) && fact.allyFactIds.length > 0);

              return (
                <div
                  key={fact.id}
                  onMouseEnter={() => {
                    if (onHoverFact) onHoverFact(fact);
                  }}
                  onClick={() => onSelectFact(fact)}
                  className={`group relative rounded-2xl p-3 sm:p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer text-right ${
                    isSelected
                      ? 'bg-amber-500/[0.12] border border-amber-400/80 shadow-[0_0_30px_rgba(245,158,11,0.22)] ring-1 ring-amber-400/40 -translate-y-0.5'
                      : 'card-editorial-2026 hover:border-amber-400/40 hover:-translate-y-0.5'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Header Row: Corner Media Avatar + Title + Tabular Number */}
                    <div className="flex items-start gap-2.5">
                      {/* Avatar Image in High-Precision Aspect Circle */}
                      <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden shrink-0 border border-white/[0.12] bg-[#050814] shadow-md group-hover:scale-105 group-hover:border-amber-400/60 transition-all flex items-center justify-center">
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
                        <h3
                          className={`text-xs sm:text-[13px] font-extrabold font-heading line-clamp-1 transition-colors ${
                            isSelected ? 'text-amber-300' : 'text-slate-100 group-hover:text-amber-300'
                          }`}
                        >
                          {fact.name}
                        </h3>

                        {/* Metadata: Category · Year/Century */}
                        <div className="flex items-center gap-1.5 text-[11px] mt-0.5 text-slate-400">
                          <span className="font-semibold truncate" style={{ color: catInfo.color }}>
                            {catInfo.name}
                          </span>
                          <span aria-hidden="true" className="text-slate-600 font-mono">·</span>
                          <span className="font-mono tabular-nums text-amber-300/90 font-medium shrink-0">
                            {fact.year || fact.century || 'سەردەمی دێرین'}
                          </span>
                        </div>

                        {/* Location / Geography */}
                        {fact.desc && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate mt-0.5">
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
                  <div className="mt-3 pt-2 border-t border-white/[0.07] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 text-slate-400 text-[10px]">
                      {hasLinks && (
                        <span
                          className="inline-flex items-center gap-1 font-mono text-[10px] text-amber-300/90 font-semibold"
                          title="خاوەنی بابەتی پەیوەندیدارە"
                        >
                          <Link2 className="w-3 h-3 text-amber-400" />
                          <span className="tabular-nums">{fact.relatedFactIds?.length || 1} بەستراو</span>
                        </span>
                      )}
                    </div>

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

        {/* Progressive Load More indicator */}
        {visibleCount < filteredFacts.length && (
          <div className="py-6 flex flex-col items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => Math.min(prev + BATCH_SIZE * 2, filteredFacts.length))}
              className="px-6 py-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-bold text-amber-300 hover:text-white transition-all cursor-pointer active:scale-95 shadow-md flex items-center gap-2"
            >
              <span>نیشاندانی زیاتر</span>
              <span className="font-mono text-[11px] opacity-75">
                ({filteredFacts.length - visibleCount} بابەتی تر ماوە)
              </span>
            </button>
          </div>
        )}
      </main>

      {/* Full Province Selection Modal */}
      <ProvinceSelectorModal
        isOpen={isProvinceModalOpen}
        onClose={() => setIsProvinceModalOpen(false)}
        facts={facts}
        selectedProvinceId={provinceFilter}
        onSelectProvince={(provId, prov) => {
          handleProvinceChange(provId, prov);
        }}
      />
    </div>
  );
};
