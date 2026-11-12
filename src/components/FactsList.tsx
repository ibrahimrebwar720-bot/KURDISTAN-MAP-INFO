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
  }, [facts, categoryFilter, provinceFilter, searchTerm, sortBy]);

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
  }, [categoryFilter, provinceFilter, searchTerm, sortBy]);

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

  const isFilterActive = categoryFilter !== 'all' || provinceFilter !== 'all' || searchTerm.trim().length > 0;
  const isDark = colorMode !== 'light';

  return (
    <div
      className={`flex flex-col h-full w-full text-right select-none font-sans overflow-hidden transition-colors ${
        isDark ? 'bg-[#030611] text-slate-100' : 'bg-[#f4f3ef] text-slate-900'
      }`}
    >
      {/* Header Container: Ultra-compact on mobile, spacious HUD on desktop */}
      <header
        className={`border-b shrink-0 z-20 shadow-md transition-colors ${
          isDark
            ? 'bg-[#070b16]/95 border-white/[0.08]'
            : 'bg-white border-slate-200'
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
                className="w-5 h-5 rounded-[3px] object-contain shrink-0"
              />
              <h2 className={`text-xs font-black font-heading truncate tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
                پێڕستی دەسەڵاتەکان
              </h2>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-[3px] border shrink-0 ${
                isDark ? 'bg-amber-400/15 text-amber-300 border-amber-400/25' : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}>
                {filteredFacts.length}
              </span>
            </div>

            {/* Actions: View Toggle, Theme, Admin, Close */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* View Mode Toggle: List vs Grid */}
              <button
                onClick={() => setViewMode((prev) => (prev === 'grid' ? 'list' : 'grid'))}
                className={`w-8 h-8 flex items-center justify-center rounded-[4px] border transition-all cursor-pointer active:scale-95 ${
                  isDark
                    ? 'bg-white/[0.06] hover:bg-white/[0.12] text-amber-300 border-white/10'
                    : 'bg-slate-100 hover:bg-slate-200 text-amber-900 border-slate-300 shadow-xs'
                }`}
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
                className={`w-8 h-8 flex items-center justify-center rounded-[4px] border transition-all cursor-pointer active:scale-95 ${
                  isDark
                    ? 'bg-white/[0.06] text-amber-400 border-white/10'
                    : 'bg-slate-100 text-amber-800 border-slate-300 shadow-xs'
                }`}
                title={isDark ? 'دۆخی ڕووناک' : 'دۆخی تاریک'}
              >
                {isDark ? (
                  <Moon className="w-4 h-4 text-amber-400" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-600" />
                )}
              </button>

              {/* Admin Add Fact */}
              {isAdmin && onOpenAddFact && (
                <button
                  onClick={() => onOpenAddFact('standard')}
                  className="w-8 h-8 flex items-center justify-center rounded-[4px] bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold transition-all cursor-pointer active:scale-95 shadow-sm"
                  title="زیادکردنی بابەتی نوێ"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                </button>
              )}

              {/* Close Button */}
              {onClose && (
                <button
                  onClick={onClose}
                  className={`w-8 h-8 flex items-center justify-center rounded-[4px] border transition-all cursor-pointer active:scale-95 ${
                    isDark
                      ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/30'
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 shadow-xs'
                  }`}
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
              <Search className={`w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="گەڕان بەپێی ناو، سەدە، شار..."
                className={`w-full text-[11px] pr-7.5 pl-6 py-1.5 rounded-[4px] border focus:outline-none transition-all text-right h-8 ${
                  isDark
                    ? 'bg-white/[0.05] text-slate-100 placeholder:text-slate-500 border-white/[0.1] focus:border-amber-400 focus:bg-white/[0.08]'
                    : 'bg-white text-slate-900 placeholder:text-slate-400 border-slate-300 focus:border-amber-500 shadow-inner font-medium'
                }`}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className={`absolute left-2 top-1/2 -translate-y-1/2 p-0.5 cursor-pointer ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
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
                className={`w-full h-8 px-2 rounded-[4px] border text-[11px] font-bold focus:outline-none cursor-pointer truncate appearance-none ${
                  isDark
                    ? 'bg-[#101626] border-white/10 text-amber-300'
                    : 'bg-white border-slate-300 text-amber-900 shadow-xs'
                }`}
                title="پۆلێن"
              >
                <option value="all" className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                  هەموو پۆلێنەکان ({facts.length})
                </option>
                {UNIFIED_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                  <option key={cat.id} value={cat.id} className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
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
                className={`w-full h-8 px-2 rounded-[4px] border text-[11px] font-medium focus:outline-none cursor-pointer truncate appearance-none ${
                  isDark
                    ? 'bg-[#101626] border-white/10 text-slate-200'
                    : 'bg-white border-slate-300 text-slate-800 shadow-xs'
                }`}
                title="ڕیزکردن"
              >
                <option value="latest_added" className={isDark ? 'bg-[#0c101d] text-amber-300 font-bold' : 'bg-white text-amber-900 font-bold'}>
                  نوێترین تۆمار
                </option>
                <option value="year_asc" className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                  ساڵ (کۆن بۆ نوێ)
                </option>
                <option value="year_desc" className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                  ساڵ (نوێ بۆ کۆن)
                </option>
                <option value="category" className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                  بەپێی پۆلێن
                </option>
                <option value="num" className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                  بەپێی ڕیزبەندی
                </option>
              </select>
            </div>

            {/* Compact Province Button */}
            <button
              onClick={() => setIsProvinceModalOpen(true)}
              className={`h-8 px-2 rounded-[4px] border text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 transition-all ${
                provinceFilter !== 'all'
                  ? (isDark ? 'bg-amber-400/25 text-amber-300 border-amber-400/50 shadow-xs' : 'bg-amber-100 text-amber-900 border-amber-400 shadow-xs')
                  : (isDark ? 'bg-white/[0.06] text-amber-300 border-white/10 hover:bg-white/[0.1]' : 'bg-white text-amber-900 border-slate-300 hover:bg-slate-50 shadow-xs')
              }`}
              title="پۆلێنی پارێزگاکان"
            >
              <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
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
                className={`h-8 w-8 shrink-0 flex items-center justify-center rounded-[4px] border transition-all cursor-pointer active:scale-95 ${
                  isDark
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                    : 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
                }`}
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
              <div className={`w-10 h-10 rounded-[4px] flex items-center justify-center p-1 shadow-md overflow-hidden border ${
                isDark ? 'bg-[#101626] border-white/10' : 'bg-white border-slate-200'
              }`}>
                <img
                  src="/kimlogo.png"
                  alt="KURDISTAN INFO MAP Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className={`text-base font-extrabold font-heading tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    ئەرشیفی دەسەڵاتە مێژووییەکان
                  </h2>
                  <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-[3px] border font-semibold tracking-wider ${
                    isDark ? 'bg-amber-400/10 text-amber-300 border-amber-400/20' : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}>
                    2026 HUD
                  </span>
                </div>
                <div className={`flex items-center gap-1.5 text-xs mt-0.5 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  <span className={`font-mono tabular-nums font-bold ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>{filteredFacts.length}</span>
                  <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>/</span>
                  <span className={`font-mono tabular-nums ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{facts.length}</span>
                  <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>بابەت لە ئەرشیفدا</span>
                </div>
              </div>
            </div>

            {/* Command Search Input */}
            <div className="relative flex-1 max-w-xl min-w-[260px]">
              <Search className={`w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="گەڕان بەپێی ناوی میرنشین، سەرکردە، سەدە، شار یان ناوچە..."
                className={`w-full text-xs pr-10 pl-16 py-2.5 rounded-[4px] border focus:outline-none transition-all text-right h-10 shadow-inner ${
                  isDark
                    ? 'bg-white/[0.04] hover:bg-white/[0.06] text-slate-100 placeholder:text-slate-500 border-white/[0.1] focus:border-amber-400 focus:bg-white/[0.08]'
                    : 'bg-slate-50 hover:bg-white text-slate-900 placeholder:text-slate-400 border-slate-300 focus:bg-white focus:border-amber-500 font-medium'
                }`}
              />
              {searchTerm ? (
                <button
                  onClick={() => setSearchTerm('')}
                  className={`absolute left-3 top-1/2 -translate-y-1/2 p-1 cursor-pointer transition-colors ${
                    isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="سڕینەوە"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className={`absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-mono pointer-events-none px-1.5 py-0.5 rounded-[3px] border ${
                  isDark ? 'bg-white/[0.05] border-white/5 text-slate-400' : 'bg-slate-200 border-slate-300 text-slate-600'
                }`}>
                  <span>⌘K</span>
                </div>
              )}
            </div>

            {/* Desktop Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* View Toggle */}
              <button
                onClick={() => setViewMode((prev) => (prev === 'grid' ? 'list' : 'grid'))}
                className={`h-9.5 px-3 flex items-center gap-1.5 rounded-[4px] border transition-all cursor-pointer active:scale-95 ${
                  isDark
                    ? 'bg-white/[0.06] hover:bg-white/[0.12] text-amber-300 border-white/10'
                    : 'bg-white hover:bg-slate-50 text-amber-900 border-slate-300 shadow-xs'
                }`}
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
                      className={`flex items-center gap-1.5 px-3 h-9.5 rounded-[4px] font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95 ${
                        isDark
                          ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-white border border-amber-400/40'
                          : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 shadow-xs'
                      }`}
                      title="بینینی وێنە نێردراوەکان"
                    >
                      <Images className="w-4 h-4 text-amber-500" />
                      <span className="hidden sm:inline">وێنە نێردراوەکان</span>
                      <span className="sm:hidden">نێردراوەکان</span>
                      {typeof pendingSubmissionsCount === 'number' && pendingSubmissionsCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-[2px] bg-amber-500 text-slate-950 font-black text-[10px] animate-pulse">
                          {pendingSubmissionsCount}
                        </span>
                      )}
                    </button>
                  )}
                  {onOpenAddFact && (
                    <>
                      <button
                        onClick={() => onOpenAddFact('photo_only')}
                        className="flex items-center gap-1.5 px-3 h-9.5 rounded-[4px] bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all cursor-pointer active:scale-95"
                        title="زیادکردنی وێنەی مێژوویی"
                      >
                        <ImageIcon className="w-4 h-4 stroke-[2.5]" />
                        <span>وێنە</span>
                      </button>
                      <button
                        onClick={() => onOpenAddFact('standard')}
                        className={`flex items-center gap-1.5 px-3 h-9.5 rounded-[4px] border font-bold text-xs transition-all cursor-pointer active:scale-95 ${
                          isDark
                            ? 'bg-white/[0.08] hover:bg-white/[0.14] border-white/10 text-white'
                            : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-900 shadow-xs'
                        }`}
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
                  className={`px-3 h-9.5 rounded-[4px] text-xs font-semibold border transition-colors cursor-pointer ${
                    isDark
                      ? 'text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border-rose-800/40'
                      : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-300'
                  }`}
                  title="دەرچوون لە ئەدمین"
                >
                  دەرچوون
                </button>
              )}

              {/* Theme Toggle */}
              <button
                onClick={toggleColorMode}
                className={`h-9.5 px-3 flex items-center gap-1.5 rounded-[4px] border transition-all cursor-pointer active:scale-95 ${
                  isDark
                    ? 'border-white/10 bg-white/[0.06] hover:bg-white/[0.12] text-amber-400'
                    : 'border-slate-300 bg-white hover:bg-slate-100 text-amber-800 shadow-xs'
                }`}
                title={isDark ? 'دۆخی ڕووناک' : 'دۆخی تاریک'}
              >
                {isDark ? (
                  <Moon className="w-4 h-4 text-amber-400" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-600" />
                )}
                <span className="text-xs font-semibold">
                  {isDark ? 'تاریک' : 'ڕووناک'}
                </span>
              </button>

              {/* Close Button */}
              {onClose && (
                <button
                  onClick={onClose}
                  className={`h-9.5 px-3.5 flex items-center gap-2 rounded-[4px] border transition-all cursor-pointer active:scale-95 ${
                    isDark
                      ? 'bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 hover:text-white border-white/[0.1]'
                      : 'bg-white hover:bg-slate-100 text-slate-800 hover:text-slate-950 border-slate-300 shadow-xs'
                  }`}
                  title="داخستن و گەڕانەوە"
                >
                  <span className="text-xs font-medium">داخستن</span>
                  <X className="w-4 h-4 text-amber-500" />
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Precision Filter & Chronological Sorting Dock */}
          <div className={`flex items-center justify-between gap-3 pt-2.5 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
            <div className="flex items-center gap-2.5">
              {/* Category Dropdown */}
              <div className={`flex items-center gap-2 rounded-[4px] px-3 h-9 border text-xs transition-colors ${
                isDark ? 'bg-white/[0.04] hover:bg-white/[0.07] border-white/[0.09]' : 'bg-white hover:bg-slate-50 border-slate-300 shadow-xs'
              }`}>
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>پۆلێن:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className={`bg-transparent text-xs font-semibold focus:outline-none cursor-pointer pr-1 ${
                    isDark ? 'text-slate-100' : 'text-slate-900'
                  }`}
                  title="فلتەر بەپێی پۆلێن"
                >
                  <option value="all" className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                    هەموو پۆلێنەکان ({facts.length})
                  </option>
                  {UNIFIED_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                    <option key={cat.id} value={cat.id} className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                      {cat.name} ({categoryCounts[cat.id] || 0})
                    </option>
                  ))}
                </select>
              </div>

              {/* Province Dropdown */}
              <div className={`flex items-center gap-1.5 rounded-[4px] px-2.5 h-9 border text-xs transition-colors ${
                provinceFilter !== 'all'
                  ? (isDark ? 'bg-amber-500/20 border-amber-400/50 text-amber-300' : 'bg-amber-100 border-amber-400 text-amber-900 shadow-xs')
                  : (isDark ? 'bg-white/[0.04] hover:bg-white/[0.07] border-white/[0.09]' : 'bg-white hover:bg-slate-50 border-slate-300 shadow-xs')
              }`}>
                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>پارێزگا:</span>
                <select
                  value={provinceFilter}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  className={`bg-transparent text-xs font-semibold focus:outline-none cursor-pointer pr-1 max-w-[140px] truncate ${
                    isDark ? 'text-slate-100' : 'text-slate-900'
                  }`}
                  title="فلتەر بەپێی پارێزگا"
                >
                  <option value="all" className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                    هەموو پارێزگاکان ({facts.length})
                  </option>
                  <optgroup label="باشووری کوردستان" className={isDark ? 'bg-[#0c101d] text-emerald-400 font-bold' : 'bg-slate-100 text-emerald-700 font-bold'}>
                    {provincesWithCounts.kurdistanProvinces
                      .filter((p) => p.part === 'south')
                      .map((p) => (
                        <option key={p.id} value={p.id} className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                          {p.name} ({p.count})
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="باکووری کوردستان" className={isDark ? 'bg-[#0c101d] text-amber-400 font-bold' : 'bg-slate-100 text-amber-700 font-bold'}>
                    {provincesWithCounts.kurdistanProvinces
                      .filter((p) => p.part === 'north')
                      .map((p) => (
                        <option key={p.id} value={p.id} className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                          {p.name} ({p.count})
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="ڕۆژهەڵاتی کوردستان" className={isDark ? 'bg-[#0c101d] text-cyan-400 font-bold' : 'bg-slate-100 text-cyan-700 font-bold'}>
                    {provincesWithCounts.kurdistanProvinces
                      .filter((p) => p.part === 'east')
                      .map((p) => (
                        <option key={p.id} value={p.id} className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                          {p.name} ({p.count})
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="ڕۆژئاوای کوردستان" className={isDark ? 'bg-[#0c101d] text-purple-400 font-bold' : 'bg-slate-100 text-purple-700 font-bold'}>
                    {provincesWithCounts.kurdistanProvinces
                      .filter((p) => p.part === 'west')
                      .map((p) => (
                        <option key={p.id} value={p.id} className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                          {p.name} ({p.count})
                        </option>
                      ))}
                  </optgroup>
                  {provincesWithCounts.outsideProvinces.length > 0 && (
                    <optgroup label="دەرەوەی کوردستان (تۆمارکراو)" className={isDark ? 'bg-[#0c101d] text-rose-400 font-bold' : 'bg-slate-100 text-rose-700 font-bold'}>
                      {provincesWithCounts.outsideProvinces.map((p) => (
                        <option key={p.id} value={p.id} className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                          {p.name} ({p.count})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <button
                  onClick={() => setIsProvinceModalOpen(true)}
                  className={`p-1 rounded-[3px] cursor-pointer transition-colors ${
                    isDark ? 'hover:bg-white/10 text-amber-400' : 'hover:bg-slate-200 text-amber-700'
                  }`}
                  title="کردنەوەی پێڕستی تەواوی پارێزگاکان"
                >
                  <Compass className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className={`flex items-center gap-2 rounded-[4px] px-3 h-9 border text-xs transition-colors ${
                isDark ? 'bg-white/[0.04] hover:bg-white/[0.07] border-white/[0.09]' : 'bg-white hover:bg-slate-50 border-slate-300 shadow-xs'
              }`}>
                <ArrowUpDown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>ڕیزکردن:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className={`bg-transparent text-xs font-semibold focus:outline-none cursor-pointer pr-1 ${
                    isDark ? 'text-slate-100' : 'text-slate-900'
                  }`}
                  title="ڕیزبەندی بابەتەکان"
                >
                  <option value="latest_added" className={isDark ? 'bg-[#0c101d] text-amber-300 font-bold' : 'bg-white text-amber-900 font-bold'}>
                    دوایین و کۆتا تۆمارکراو
                  </option>
                  <option value="year_asc" className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                    ساڵ (کۆن بۆ نوێ)
                  </option>
                  <option value="year_desc" className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                    ساڵ (نوێ بۆ کۆن)
                  </option>
                  <option value="category" className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                    بەپێی جۆری دەسەڵات
                  </option>
                  <option value="num" className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
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
                  className={`flex items-center gap-1.5 px-3 h-9 rounded-[4px] text-xs font-semibold cursor-pointer border transition-all ${
                    isDark
                      ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-400/20'
                      : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 shadow-xs'
                  }`}
                  title="پاککردنەوەی هەموو فلتەرەکان"
                >
                  <X className="w-3 h-3" />
                  <span>پاککردنەوەی فلتەر</span>
                </button>
              )}
            </div>

            {/* Status Metric */}
            <div className={`text-xs font-medium flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span>نیشاندراو:</span>
              <span className={`font-mono tabular-nums font-bold ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>{filteredFacts.length}</span>
              <span className={isDark ? 'text-slate-500' : 'text-slate-600'}>دەسەڵات و تۆمار</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Scrollable Content Area */}
      <main onScroll={handleScroll} className="flex-1 overflow-y-auto p-2 sm:p-5 lg:p-6 custom-scrollbar">
        {filteredFacts.length === 0 ? (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className={`w-14 h-14 rounded-[4px] mx-auto flex items-center justify-center border ${
              isDark ? 'bg-[#101626] border-white/10 text-amber-400' : 'bg-white border-slate-200 text-amber-600 shadow-sm'
            }`}>
              <Search className="w-7 h-7 stroke-[1.8]" />
            </div>
            <div>
              <h4 className={`font-extrabold text-base font-heading ${isDark ? 'text-white' : 'text-slate-900'}`}>
                هیچ بابەتێک نەدۆزرایەوە
              </h4>
              <p className={`text-xs mt-1 max-w-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                دەتوانیت پۆلێنەکە بگۆڕیت، شێوازی ڕیزبەندی ڕێکبخەیتەوە یان وشەی گەڕانەکەت پاک بکەیتەوە.
              </p>
            </div>
            {isFilterActive && (
              <button
                onClick={() => {
                  handleCategoryChange('all');
                  handleProvinceChange('all');
                  setSearchTerm('');
                }}
                className="px-4 py-2 rounded-[4px] bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs cursor-pointer transition-all shadow-md active:scale-95"
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
                  className={`group relative rounded-[4px] p-2.5 sm:p-3 flex items-center justify-between gap-3 transition-all duration-200 cursor-pointer border text-right ${
                    isSelected
                      ? (isDark
                          ? 'bg-amber-500/[0.16] border-amber-400/80 shadow-[0_0_24px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/40 -translate-y-0.5'
                          : 'bg-amber-100/80 border-amber-500 shadow-md ring-1 ring-amber-500 -translate-y-0.5')
                      : (isDark
                          ? 'bg-[#0b0f1c] hover:bg-[#101626] border-amber-500/20 hover:border-amber-400/50 shadow-xs'
                          : 'bg-white hover:bg-amber-50/40 border-slate-200 hover:border-amber-400 shadow-xs')
                  }`}
                >
                  {/* Right Side: Media Avatar + Core Info */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Thumbnail Avatar */}
                    <div className={`relative w-12 h-12 rounded-[3px] overflow-hidden shrink-0 border flex items-center justify-center shadow-xs ${
                      isDark ? 'border-white/10 bg-[#050814]' : 'border-slate-200 bg-slate-100'
                    }`}>
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
                        <h3 className={`text-xs sm:text-sm font-extrabold font-heading transition-colors truncate ${
                          isSelected
                            ? (isDark ? 'text-amber-300' : 'text-amber-900 font-black')
                            : (isDark ? 'text-slate-100 group-hover:text-amber-300' : 'text-slate-900 group-hover:text-amber-800 font-bold')
                        }`}>
                          {fact.name}
                        </h3>
                        <span
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded-[3px] font-semibold shrink-0"
                          style={{
                            backgroundColor: isDark ? `${catInfo.color}20` : `${catInfo.color}15`,
                            color: isDark ? catInfo.color : (catInfo.color === '#f59e0b' ? '#92400e' : catInfo.color),
                            border: `1px solid ${catInfo.color}40`,
                          }}
                        >
                          {catInfo.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] mt-0.5 truncate">
                        <span className={`font-mono tabular-nums font-bold shrink-0 ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                          {fact.year || fact.century || 'سەردەمی دێرین'}
                        </span>
                        {fact.desc && (
                          <>
                            <span className={isDark ? 'text-slate-600 font-mono' : 'text-slate-400 font-mono'}>·</span>
                            <span className={`truncate text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{fact.desc}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Left Side: Badges + Precision Actions */}
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {hasLinks && (
                      <span
                        className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-[3px] border ${
                          isDark ? 'bg-amber-400/10 text-amber-300/90 border-amber-400/20' : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}
                        title="خاوەنی بابەتی بەستراوە"
                      >
                        <Link2 className="w-3 h-3 text-amber-500" />
                        <span className="tabular-nums">بەستراو</span>
                      </span>
                    )}

                    {isAdmin && onOpenEditFact && (
                      <button
                        onClick={() => onOpenEditFact(fact)}
                        title="دەستکاریکردنی ئەم دەسەڵاتە"
                        className={`p-1.5 rounded-[3px] transition-colors cursor-pointer ${
                          isDark ? 'text-slate-400 hover:text-amber-300 hover:bg-white/[0.08]' : 'text-slate-500 hover:text-amber-800 hover:bg-slate-100'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => onOpenDetail(fact)}
                      title="بینینی تەواوی زانیاری و سەرچاوەکان"
                      className={`px-2.5 py-1.5 rounded-[4px] text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95 border ${
                        isDark
                          ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-white border-amber-400/30'
                          : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 shadow-xs'
                      }`}
                    >
                      <span>زانیاری</span>
                      <BookOpen className="w-3 h-3 text-amber-500" />
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
                  className={`group relative rounded-[4px] p-3 sm:p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer text-right border ${
                    isSelected
                      ? (isDark
                          ? 'bg-amber-500/[0.12] border-amber-400/80 shadow-[0_0_30px_rgba(245,158,11,0.22)] ring-1 ring-amber-400/40 -translate-y-0.5'
                          : 'bg-amber-100/70 border-2 border-amber-500 shadow-md -translate-y-0.5')
                      : (isDark
                          ? 'bg-[#0b0f1c] hover:bg-[#101626] border-amber-500/20 hover:border-amber-400/50 shadow-xs hover:-translate-y-0.5'
                          : 'bg-white hover:bg-amber-50/40 border-slate-200 hover:border-amber-400 shadow-xs hover:-translate-y-0.5')
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Header Row: Corner Media Avatar + Title + Tabular Number */}
                    <div className="flex items-start gap-2.5">
                      {/* Avatar Image in High-Precision Aspect Frame */}
                      <div className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-[4px] overflow-hidden shrink-0 border flex items-center justify-center shadow-md group-hover:scale-105 transition-all ${
                        isDark ? 'border-white/[0.12] bg-[#050814] group-hover:border-amber-400/60' : 'border-slate-200 bg-slate-100 group-hover:border-amber-500'
                      }`}>
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
                            isSelected
                              ? (isDark ? 'text-amber-300' : 'text-amber-900 font-black')
                              : (isDark ? 'text-slate-100 group-hover:text-amber-300' : 'text-slate-900 group-hover:text-amber-800 font-bold')
                          }`}
                        >
                          {fact.name}
                        </h3>

                        {/* Metadata: Category · Year/Century */}
                        <div className="flex items-center gap-1.5 text-[11px] mt-0.5">
                          <span className="font-semibold truncate" style={{ color: isDark ? catInfo.color : (catInfo.color === '#f59e0b' ? '#92400e' : catInfo.color) }}>
                            {catInfo.name}
                          </span>
                          <span aria-hidden="true" className={isDark ? 'text-slate-600 font-mono' : 'text-slate-400 font-mono'}>·</span>
                          <span className={`font-mono tabular-nums font-bold shrink-0 ${isDark ? 'text-amber-300/90' : 'text-amber-800'}`}>
                            {fact.year || fact.century || 'سەردەمی دێرین'}
                          </span>
                        </div>

                        {/* Location / Geography */}
                        {fact.desc && (
                          <div className={`flex items-center gap-1 text-[10px] truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                            <span className="truncate">{fact.desc}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Summary Body */}
                    <p className={`text-[11px] line-clamp-2 leading-relaxed ${isDark ? 'text-slate-300/85' : 'text-slate-700 font-normal'}`}>
                      {fact.fullText || fact.desc}
                    </p>
                  </div>

                  {/* Card Bottom: Indicators & Precision Actions */}
                  <div className={`mt-3 pt-2 border-t flex items-center justify-between gap-2 ${
                    isDark ? 'border-amber-500/15' : 'border-slate-200'
                  }`}>
                    <div className={`flex items-center gap-2 min-w-0 text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {hasLinks && (
                        <span
                          className={`inline-flex items-center gap-1 font-mono text-[10px] font-semibold ${
                            isDark ? 'text-amber-300/90' : 'text-amber-900'
                          }`}
                          title="خاوەنی بابەتی پەیوەندیدارە"
                        >
                          <Link2 className="w-3 h-3 text-amber-500" />
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
                          className={`p-1.5 rounded-[3px] transition-colors cursor-pointer ${
                            isDark ? 'text-slate-400 hover:text-amber-300 hover:bg-white/[0.08]' : 'text-slate-500 hover:text-amber-800 hover:bg-slate-100'
                          }`}
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
                        className={`px-2.5 py-1 rounded-[4px] transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold border ${
                          isDark
                            ? 'bg-white/[0.06] hover:bg-white/[0.12] text-amber-300 hover:text-white border-white/[0.08]'
                            : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 shadow-xs'
                        }`}
                      >
                        <span>زانیاری</span>
                        <BookOpen className="w-3 h-3 text-amber-500" />
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
              className={`px-6 py-2.5 rounded-[4px] border text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md flex items-center gap-2 ${
                isDark
                  ? 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-amber-300 hover:text-white'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-amber-900 shadow-xs'
              }`}
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
