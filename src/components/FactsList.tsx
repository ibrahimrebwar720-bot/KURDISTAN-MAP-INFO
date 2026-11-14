import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FactItem } from '../data/kurdishHistoryData';
import { CollectionItem, getUnifiedCategories, getCategoryInfo } from '../types/history';
import { getFactChronologicalYear, formatDigits } from '../utils/yearUtils';
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
  Globe,
  Languages,
  Loader2,
  Check,
  AlertCircle,
  Square,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { loadKurdishFactsFromCloud, saveNotesToCloud } from '../services/firestoreHistoryService';
import {
  translateFactToEnglishDetailed,
  translateFactsBatchToEnglish,
  BatchTranslateProgress,
} from '../services/aiTranslationService';
import { findMismatchedDuplicateNotesFacts } from '../utils/factConsistency';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

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
  const { language, isEn, dir, toggleLanguage } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>(activeCategory || 'all');
  const [provinceFilter, setProvinceFilter] = useState<string>(selectedProvince || 'all');
  const [isProvinceModalOpen, setIsProvinceModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('year_asc');

  // Admin AI Translation States
  const [translatingIds, setTranslatingIds] = useState<Record<number, boolean>>({});
  const [translatedFeedback, setTranslatedFeedback] = useState<Record<number, 'ok' | 'err'>>({});
  const [isAiStudioOpen, setIsAiStudioOpen] = useState(false);
  const [kurdishSourceFacts, setKurdishSourceFacts] = useState<FactItem[]>([]);
  const [englishExistingIds, setEnglishExistingIds] = useState<Set<number>>(new Set());
  const [studioLoading, setStudioLoading] = useState(false);
  const [studioFilter, setStudioFilter] = useState<'untranslated' | 'all' | 'translated'>('untranslated');
  const [studioSearch, setStudioSearch] = useState('');
  const [batchProgress, setBatchProgress] = useState<BatchTranslateProgress | null>(null);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const stopBatchRef = useRef(false);
  const [studioNotice, setStudioNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isCleaningMismatches, setIsCleaningMismatches] = useState(false);

  const mismatchedNotesList = useMemo(
    () => findMismatchedDuplicateNotesFacts(kurdishSourceFacts),
    [kurdishSourceFacts]
  );

  const mismatchOwnerById = useMemo(() => {
    const map = new Map<number, FactItem>();
    for (const m of mismatchedNotesList) {
      map.set(m.fact.id, m.likelySourceFact);
    }
    return map;
  }, [mismatchedNotesList]);

  const openAiStudio = async () => {
    setIsAiStudioOpen(true);
    setStudioLoading(true);
    setStudioNotice(null);
    try {
      const [ckbList, enSnap] = await Promise.all([
        loadKurdishFactsFromCloud(),
        getDocs(collection(db, 'facts_en')),
      ]);
      const sortedCkb = [...ckbList].sort(
        (a, b) => getFactChronologicalYear(a) - getFactChronologicalYear(b)
      );
      setKurdishSourceFacts(sortedCkb);
      const enIds = new Set<number>();
      enSnap.forEach((docSnap) => {
        const d = docSnap.data();
        if (d && typeof d.id === 'number') {
          enIds.add(d.id);
        }
      });
      setEnglishExistingIds(enIds);
    } catch (err) {
      setStudioNotice({
        type: 'err',
        text: err instanceof Error ? err.message : 'Failed to load cloud datasets.',
      });
    } finally {
      setStudioLoading(false);
    }
  };

  const handleQuickTranslateCard = async (fact: FactItem) => {
    if (translatingIds[fact.id]) return;
    setTranslatingIds((prev) => ({ ...prev, [fact.id]: true }));
    setTranslatedFeedback((prev) => {
      const copy = { ...prev };
      delete copy[fact.id];
      return copy;
    });
    try {
      await translateFactToEnglishDetailed(fact);
      setTranslatedFeedback((prev) => ({ ...prev, [fact.id]: 'ok' }));
      setEnglishExistingIds((prev) => {
        const next = new Set(prev);
        next.add(fact.id);
        return next;
      });
    } catch (err) {
      console.error('Quick AI translate failed:', err);
      setTranslatedFeedback((prev) => ({ ...prev, [fact.id]: 'err' }));
    } finally {
      setTranslatingIds((prev) => {
        const copy = { ...prev };
        delete copy[fact.id];
        return copy;
      });
    }
  };

  const handleStudioTranslateOne = async (fact: FactItem) => {
    setStudioNotice(null);
    setTranslatingIds((prev) => ({ ...prev, [fact.id]: true }));
    try {
      const outcome = await translateFactToEnglishDetailed(fact);
      setEnglishExistingIds((prev) => {
        const next = new Set(prev);
        next.add(fact.id);
        return next;
      });
      setStudioNotice({
        type: 'ok',
        text: outcome.notesExcluded
          ? isEn
            ? `Translated "${fact.name}" → "${outcome.fact.name}". Unrelated pasted additional notes${
                outcome.notesMismatchSubject ? ` (${outcome.notesMismatchSubject})` : ''
              } were automatically omitted.`
            : `بابەتی «${fact.name}» وەرگێڕدرا بۆ ئینگلیزی («${outcome.fact.name}»). تێبینییە زیادە تێکەڵبووەکان${
                outcome.notesMismatchSubject ? ` (${outcome.notesMismatchSubject})` : ''
              } بە خۆکاری لابران.`
          : isEn
          ? `Translated "${fact.name}" → "${outcome.fact.name}" and saved to English archive.`
          : `بابەتی «${fact.name}» وەرگێڕدرا بۆ ئینگلیزی («${outcome.fact.name}») بە هەمان وێنە و پۆینتی نەخشە.`,
      });
    } catch (err) {
      setStudioNotice({
        type: 'err',
        text: err instanceof Error ? err.message : 'Translation failed',
      });
    } finally {
      setTranslatingIds((prev) => {
        const copy = { ...prev };
        delete copy[fact.id];
        return copy;
      });
    }
  };

  const studioFilteredList = useMemo(() => {
    let list = kurdishSourceFacts;
    if (studioFilter === 'untranslated') {
      list = list.filter((f) => !englishExistingIds.has(f.id));
    } else if (studioFilter === 'translated') {
      list = list.filter((f) => englishExistingIds.has(f.id));
    }
    if (studioSearch.trim()) {
      const q = studioSearch.trim();
      list = list.filter(
        (f) =>
          kurdishSearchMatch(f.name, q) ||
          kurdishSearchMatch(f.desc, q) ||
          kurdishSearchMatch(f.year || '', q)
      );
    }
    return list;
  }, [kurdishSourceFacts, englishExistingIds, studioFilter, studioSearch]);

  const untranslatedCount = useMemo(
    () => kurdishSourceFacts.filter((f) => !englishExistingIds.has(f.id)).length,
    [kurdishSourceFacts, englishExistingIds]
  );

  const handleBatchTranslateUntranslated = async () => {
    const targets = kurdishSourceFacts.filter((f) => !englishExistingIds.has(f.id));
    if (targets.length === 0 || isBatchRunning) return;
    stopBatchRef.current = false;
    setIsBatchRunning(true);
    setStudioNotice(null);
    setBatchProgress({
      completed: 0,
      total: targets.length,
      currentName: targets[0].name,
      succeeded: [],
      failed: [],
      notesExcludedCount: 0,
    });

    const summary = await translateFactsBatchToEnglish(
      targets,
      (prog) => {
        setBatchProgress(prog);
        if (prog.succeeded.length > 0) {
          setEnglishExistingIds((prev) => {
            const next = new Set(prev);
            prog.succeeded.forEach((s) => next.add(s.id));
            return next;
          });
        }
      },
      () => stopBatchRef.current
    );

    setIsBatchRunning(false);
    setStudioNotice({
      type: summary.failed.length === 0 ? 'ok' : 'err',
      text: isEn
        ? `Batch finished: ${summary.succeeded.length} translated, ${summary.failed.length} failed.${
            summary.notesExcludedCount > 0
              ? ` (${summary.notesExcludedCount} unrelated pasted notes excluded automatically)`
              : ''
          }`
        : `وەرگێڕانی بەکۆمەڵ تەواو بوو: ${formatDigits(summary.succeeded.length, language)} سەرکەوتوو، ${formatDigits(summary.failed.length, language)} سەرنەکەوت.${
            summary.notesExcludedCount > 0
              ? ` (${formatDigits(summary.notesExcludedCount, language)} تێبینیی تێکەڵبوو بە خۆکاری لابران)`
              : ''
          }`,
    });
  };

  const handleCleanMismatchedNotes = async () => {
    if (isCleaningMismatches || mismatchedNotesList.length === 0) return;
    setIsCleaningMismatches(true);
    setStudioNotice(null);
    try {
      const cleanedIds = new Set<number>();
      for (const item of mismatchedNotesList) {
        await saveNotesToCloud(item.fact.id, '', item.fact, 'ckb');
        cleanedIds.add(item.fact.id);
      }
      setKurdishSourceFacts((prev) =>
        prev.map((f) => (cleanedIds.has(f.id) ? { ...f, additionalNotes: '' } : f))
      );
      setStudioNotice({
        type: 'ok',
        text: isEn
          ? `Cleaned ${cleanedIds.size} entries with mismatched duplicate additional notes in the Kurdish archive.`
          : `${formatDigits(cleanedIds.size, language)} بابەت کە تێبینیی زیادەی بابەتێکی تری پێوە لکابوو لە ئەرشیفی کوردیدا پاککرانەوە.`,
      });
    } catch (err) {
      setStudioNotice({
        type: 'err',
        text: err instanceof Error ? err.message : 'Failed to clean mismatched notes',
      });
    } finally {
      setIsCleaningMismatches(false);
    }
  };

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

  const [provinceCacheTick, setProvinceCacheTick] = useState<number>(0);

  useEffect(() => {
    const onUpdated = () => setProvinceCacheTick((t) => t + 1);
    window.addEventListener('google-province-cache-updated', onUpdated);
    return () => window.removeEventListener('google-province-cache-updated', onUpdated);
  }, []);

  const localizedCategories = useMemo(() => getUnifiedCategories(language), [language]);

  // Compute provinces with counts
  const provincesWithCounts = useMemo(() => {
    return getProvincesWithCounts(facts, language);
  }, [facts, language, provinceCacheTick]);

  // Filter & Sort facts
  const filteredFacts = useMemo(() => {
    let list = facts;

    if (categoryFilter && categoryFilter !== 'all') {
      list = list.filter((fact) => getCategoryInfo(fact, language).id === categoryFilter);
    }

    if (provinceFilter && provinceFilter !== 'all') {
      list = filterFactsByProvince(list, provinceFilter);
    }

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
        const catA = getCategoryInfo(a, language).name;
        const catB = getCategoryInfo(b, language).name;
        const comp = catA.localeCompare(catB, isEn ? 'en' : 'ckb');
        if (comp !== 0) return comp;
        return getFactChronologicalYear(a) - getFactChronologicalYear(b);
      }
      return a.num - b.num;
    });
  }, [facts, categoryFilter, provinceFilter, searchTerm, sortBy, provinceCacheTick, language, isEn]);

  // Compute category counts for badge indicators
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: facts.length };
    facts.forEach((fact) => {
      const cat = getCategoryInfo(fact, language).id;
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [facts, language]);

  const INITIAL_BATCH = 24;
  const BATCH_SIZE = 24;
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_BATCH);

  useEffect(() => {
    setVisibleCount(INITIAL_BATCH);
  }, [categoryFilter, provinceFilter, searchTerm, sortBy, language]);

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
      dir={dir}
      className={`flex flex-col h-full w-full text-start select-none font-sans overflow-hidden transition-colors ${
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
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <img
                src="/kimlogo.png"
                alt="Logo"
                className="w-5 h-5 rounded-[3px] object-contain shrink-0"
              />
              <h2 className={`text-xs font-black font-heading truncate tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isEn ? 'Historical Archive' : 'پێڕستی دەسەڵاتەکان'}
              </h2>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-[3px] border shrink-0 ${
                isDark ? 'bg-amber-400/15 text-amber-300 border-amber-400/25' : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}>
                {formatDigits(filteredFacts.length, language)}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Admin AI Translator Studio Button (Mobile) */}
              {isAdmin && (
                <button
                  onClick={openAiStudio}
                  className="h-8 px-2 flex items-center gap-1 rounded-[4px] bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold text-[10px] transition-all cursor-pointer active:scale-95 shadow-sm"
                  title={isEn ? 'AI Kurdish → English Translator Studio' : 'ستۆدیۆی وەرگێڕانی AI بۆ ئینگلیزی'}
                >
                  <Languages className="w-3.5 h-3.5" />
                  <span>AI</span>
                </button>
              )}

              {/* Language Switcher */}
              <button
                onClick={toggleLanguage}
                className={`h-8 px-2 flex items-center gap-1 rounded-[4px] border text-[10px] font-mono font-bold transition-all cursor-pointer active:scale-95 ${
                  isDark
                    ? 'bg-white/[0.06] text-amber-300 border-white/10'
                    : 'bg-slate-100 text-amber-900 border-slate-300 shadow-xs'
                }`}
                title={isEn ? 'گۆڕین بۆ زمانی کوردی' : 'Switch to English'}
              >
                {isEn ? 'کوردی' : 'EN'}
              </button>

              {/* View Mode Toggle */}
              <button
                onClick={() => setViewMode((prev) => (prev === 'grid' ? 'list' : 'grid'))}
                className={`w-8 h-8 flex items-center justify-center rounded-[4px] border transition-all cursor-pointer active:scale-95 ${
                  isDark
                    ? 'bg-white/[0.06] hover:bg-white/[0.12] text-amber-300 border-white/10'
                    : 'bg-slate-100 hover:bg-slate-200 text-amber-900 border-slate-300 shadow-xs'
                }`}
                title={
                  viewMode === 'grid'
                    ? (isEn ? 'Switch to compact list' : 'گۆڕین بۆ لیستی پوخت')
                    : (isEn ? 'Switch to card grid' : 'گۆڕین بۆ کارتەکان')
                }
                aria-label={isEn ? 'View mode' : 'شێوازی نیشاندان'}
              >
                {viewMode === 'grid' ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleColorMode}
                className={`w-8 h-8 flex items-center justify-center rounded-[4px] border transition-all cursor-pointer active:scale-95 ${
                  isDark
                    ? 'bg-white/[0.06] text-amber-400 border-white/10'
                    : 'bg-slate-100 text-amber-800 border-slate-300 shadow-xs'
                }`}
                title={isDark ? (isEn ? 'Light mode' : 'دۆخی ڕووناک') : (isEn ? 'Dark mode' : 'دۆخی تاریک')}
              >
                {isDark ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-600" />}
              </button>

              {/* Admin Add Fact */}
              {isAdmin && onOpenAddFact && (
                <button
                  onClick={() => onOpenAddFact('standard')}
                  className="w-8 h-8 flex items-center justify-center rounded-[4px] bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold transition-all cursor-pointer active:scale-95 shadow-sm"
                  title={isEn ? 'Add new topic' : 'زیادکردنی بابەتی نوێ'}
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
                  title={isEn ? 'Close' : 'داخستن و گەڕانەوە'}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Mobile Row 2: Search Input + Category & Sort Dropdowns */}
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1 min-w-0">
              <Search className={`w-3.5 h-3.5 absolute start-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isEn ? 'Search name, era, city...' : 'گەڕان بەپێی ناو، سەدە، شار...'}
                className={`w-full text-[11px] ps-8 pe-6 py-1.5 rounded-[4px] border focus:outline-none transition-all text-start h-8 ${
                  isDark
                    ? 'bg-white/[0.05] text-slate-100 placeholder:text-slate-500 border-white/[0.1] focus:border-amber-400 focus:bg-white/[0.08]'
                    : 'bg-white text-slate-900 placeholder:text-slate-400 border-slate-300 focus:border-amber-500 shadow-inner font-medium'
                }`}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className={`absolute end-2 top-1/2 -translate-y-1/2 p-0.5 cursor-pointer ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                  title={isEn ? 'Clear' : 'سڕینەوە'}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="relative shrink-0 max-w-[120px]">
              <select
                value={categoryFilter}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className={`w-full h-8 px-2 rounded-[4px] border text-[11px] font-bold focus:outline-none cursor-pointer truncate appearance-none ${
                  isDark ? 'bg-[#101626] border-white/10 text-amber-300' : 'bg-white border-slate-300 text-amber-900 shadow-xs'
                }`}
                title={isEn ? 'Category' : 'پۆلێن'}
              >
                <option value="all" className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                  {isEn ? `All (${formatDigits(facts.length, language)})` : `هەموو پۆلێنەکان (${facts.length})`}
                </option>
                {localizedCategories.filter((c) => c.id !== 'all').map((cat) => (
                  <option key={cat.id} value={cat.id} className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                    {cat.name} ({formatDigits(categoryCounts[cat.id] || 0, language)})
                  </option>
                ))}
              </select>
            </div>

            <div className="relative shrink-0 max-w-[92px]">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className={`w-full h-8 px-2 rounded-[4px] border text-[11px] font-medium focus:outline-none cursor-pointer truncate appearance-none ${
                  isDark ? 'bg-[#101626] border-white/10 text-slate-200' : 'bg-white border-slate-300 text-slate-800 shadow-xs'
                }`}
                title={isEn ? 'Sort by' : 'ڕیزکردن'}
              >
                <option value="latest_added" className={isDark ? 'bg-[#0c101d] text-amber-300 font-bold' : 'bg-white text-amber-900 font-bold'}>
                  {isEn ? 'Newest' : 'نوێترین تۆمار'}
                </option>
                <option value="year_asc" className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                  {isEn ? 'Oldest → Newest' : 'ساڵ (کۆن بۆ نوێ)'}
                </option>
                <option value="year_desc" className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                  {isEn ? 'Newest → Oldest' : 'ساڵ (نوێ بۆ کۆن)'}
                </option>
                <option value="category" className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                  {isEn ? 'Category' : 'بەپێی پۆلێن'}
                </option>
                <option value="num" className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                  {isEn ? 'Index Order' : 'بەپێی ڕیزبەندی'}
                </option>
              </select>
            </div>

            <button
              onClick={() => setIsProvinceModalOpen(true)}
              className={`h-8 px-2 rounded-[4px] border text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 transition-all ${
                provinceFilter !== 'all'
                  ? (isDark ? 'bg-amber-400/25 text-amber-300 border-amber-400/50 shadow-xs' : 'bg-amber-100 text-amber-900 border-amber-400 shadow-xs')
                  : (isDark ? 'bg-white/[0.06] text-amber-300 border-white/10 hover:bg-white/[0.1]' : 'bg-white text-amber-900 border-slate-300 hover:bg-slate-50 shadow-xs')
              }`}
              title={isEn ? 'Provinces' : 'پۆلێنی پارێزگاکان'}
            >
              <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
              <span className="truncate max-w-[70px]">
                {provinceFilter === 'all'
                  ? (isEn ? 'Province' : 'پارێزگا')
                  : (isEn
                      ? provincesWithCounts.allProvinces.find((p) => p.id === provinceFilter)?.nameEn || 'Province'
                      : provincesWithCounts.allProvinces.find((p) => p.id === provinceFilter)?.name || 'پارێزگا')}
              </span>
            </button>

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
                title={isEn ? 'Clear filters' : 'پاککردنەوەی فلتەر'}
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
                    {isEn ? 'Historical Archive Directory' : 'ئەرشیفی دەسەڵاتە مێژووییەکان'}
                  </h2>
                  <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-[3px] border font-semibold tracking-wider ${
                    isDark ? 'bg-amber-400/10 text-amber-300 border-amber-400/20' : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}>
                    {isEn ? 'EN EDITION' : '2026 HUD'}
                  </span>
                </div>
                <div className={`flex items-center gap-1.5 text-xs mt-0.5 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  <span className={`font-mono tabular-nums font-bold ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                    {formatDigits(filteredFacts.length, language)}
                  </span>
                  <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>/</span>
                  <span className={`font-mono tabular-nums ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {formatDigits(facts.length, language)}
                  </span>
                  <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                    {isEn ? 'entries in archive' : 'بابەت لە ئەرشیفدا'}
                  </span>
                </div>
              </div>
            </div>

            {/* Command Search Input */}
            <div className="relative flex-1 max-w-xl min-w-[220px]">
              <Search className={`w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  isEn
                    ? 'Search dynasty, ruler, century, city or region...'
                    : 'گەڕان بەپێی ناوی میرنشین، سەرکردە، سەدە، شار یان ناوچە...'
                }
                className={`w-full text-xs ps-10 pe-16 py-2.5 rounded-[4px] border focus:outline-none transition-all text-start h-10 shadow-inner ${
                  isDark
                    ? 'bg-white/[0.04] hover:bg-white/[0.06] text-slate-100 placeholder:text-slate-500 border-white/[0.1] focus:border-amber-400 focus:bg-white/[0.08]'
                    : 'bg-slate-50 hover:bg-white text-slate-900 placeholder:text-slate-400 border-slate-300 focus:bg-white focus:border-amber-500 font-medium'
                }`}
              />
              {searchTerm ? (
                <button
                  onClick={() => setSearchTerm('')}
                  className={`absolute end-3 top-1/2 -translate-y-1/2 p-1 cursor-pointer transition-colors ${
                    isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title={isEn ? 'Clear search' : 'سڕینەوە'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className={`absolute end-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-mono pointer-events-none px-1.5 py-0.5 rounded-[3px] border ${
                  isDark ? 'bg-white/[0.05] border-white/5 text-slate-400' : 'bg-slate-200 border-slate-300 text-slate-600'
                }`}>
                  <span>⌘K</span>
                </div>
              )}
            </div>

            {/* Desktop Actions */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
              {/* Admin AI Translator Studio Button */}
              {isAdmin && (
                <button
                  onClick={openAiStudio}
                  className="h-9.5 px-3 flex items-center gap-1.5 rounded-[4px] bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95 border border-indigo-400/40"
                  title={isEn ? 'Open AI Kurdish → English Translator Studio' : 'کردنەوەی ستۆدیۆی وەرگێڕانی AI (کوردی → ئینگلیزی)'}
                >
                  <Languages className="w-4 h-4" />
                  <span>{isEn ? 'AI Translator Studio' : 'وەرگێڕانی AI بۆ ئینگلیزی'}</span>
                </button>
              )}

              {/* Language Switcher */}
              <button
                onClick={toggleLanguage}
                className={`h-9.5 px-3 flex items-center gap-1.5 rounded-[4px] border transition-all cursor-pointer active:scale-95 ${
                  isDark
                    ? 'bg-white/[0.06] hover:bg-white/[0.12] text-amber-300 border-white/10'
                    : 'bg-white hover:bg-slate-50 text-amber-900 border-slate-300 shadow-xs'
                }`}
                title={isEn ? 'گۆڕین بۆ زمانی کوردی سۆرانی' : 'Switch to English Dataset'}
              >
                <Globe className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold font-mono">{isEn ? 'کوردی' : 'EN'}</span>
              </button>

              {/* View Toggle */}
              <button
                onClick={() => setViewMode((prev) => (prev === 'grid' ? 'list' : 'grid'))}
                className={`h-9.5 px-3 flex items-center gap-1.5 rounded-[4px] border transition-all cursor-pointer active:scale-95 ${
                  isDark
                    ? 'bg-white/[0.06] hover:bg-white/[0.12] text-amber-300 border-white/10'
                    : 'bg-white hover:bg-slate-50 text-amber-900 border-slate-300 shadow-xs'
                }`}
                title={
                  viewMode === 'grid'
                    ? (isEn ? 'Switch to list view' : 'گۆڕین بۆ لیستی پوخت')
                    : (isEn ? 'Switch to card grid' : 'گۆڕین بۆ کارتەکان')
                }
              >
                {viewMode === 'grid' ? (
                  <>
                    <List className="w-4 h-4" />
                    <span className="text-xs font-semibold">{isEn ? 'List' : 'لیست'}</span>
                  </>
                ) : (
                  <>
                    <LayoutGrid className="w-4 h-4" />
                    <span className="text-xs font-semibold">{isEn ? 'Cards' : 'کارتەکان'}</span>
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
                      title={isEn ? 'Review submitted photos' : 'بینینی وێنە نێردراوەکان'}
                    >
                      <Images className="w-4 h-4 text-amber-500" />
                      <span className="hidden md:inline">{isEn ? 'Submissions' : 'وێنە نێردراوەکان'}</span>
                      {typeof pendingSubmissionsCount === 'number' && pendingSubmissionsCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-[2px] bg-amber-500 text-slate-950 font-black text-[10px] animate-pulse">
                          {formatDigits(pendingSubmissionsCount, language)}
                        </span>
                      )}
                    </button>
                  )}
                  {onOpenAddFact && (
                    <>
                      <button
                        onClick={() => onOpenAddFact('photo_only')}
                        className="flex items-center gap-1.5 px-3 h-9.5 rounded-[4px] bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all cursor-pointer active:scale-95"
                        title={isEn ? 'Add quick archival photo' : 'زیادکردنی وێنەی مێژوویی'}
                      >
                        <ImageIcon className="w-4 h-4 stroke-[2.5]" />
                        <span>{isEn ? 'Photo' : 'وێنە'}</span>
                      </button>
                      <button
                        onClick={() => onOpenAddFact('standard')}
                        className={`flex items-center gap-1.5 px-3 h-9.5 rounded-[4px] border font-bold text-xs transition-all cursor-pointer active:scale-95 ${
                          isDark
                            ? 'bg-white/[0.08] hover:bg-white/[0.14] border-white/10 text-white'
                            : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-900 shadow-xs'
                        }`}
                        title={isEn ? 'Add new topic' : 'زیادکردنی بابەتی نوێ'}
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>{isEn ? 'New Topic' : 'بابەتی نوێ'}</span>
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
                  title={isEn ? 'Exit Admin mode' : 'دەرچوون لە ئەدمین'}
                >
                  {isEn ? 'Logout' : 'دەرچوون'}
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
                title={isDark ? (isEn ? 'Light mode' : 'دۆخی ڕووناک') : (isEn ? 'Dark mode' : 'دۆخی تاریک')}
              >
                {isDark ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-600" />}
                <span className="text-xs font-semibold">
                  {isDark ? (isEn ? 'Dark' : 'تاریک') : (isEn ? 'Light' : 'ڕووناک')}
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
                  title={isEn ? 'Close directory' : 'داخستن و گەڕانەوە'}
                >
                  <span className="text-xs font-medium">{isEn ? 'Close' : 'داخستن'}</span>
                  <X className="w-4 h-4 text-amber-500" />
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Precision Filter & Chronological Sorting Dock */}
          <div className={`flex items-center justify-between gap-3 pt-2.5 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Category Dropdown */}
              <div className={`flex items-center gap-2 rounded-[4px] px-3 h-9 border text-xs transition-colors ${
                isDark ? 'bg-white/[0.04] hover:bg-white/[0.07] border-white/[0.09]' : 'bg-white hover:bg-slate-50 border-slate-300 shadow-xs'
              }`}>
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isEn ? 'Category:' : 'پۆلێن:'}
                </span>
                <select
                  value={categoryFilter}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className={`bg-transparent text-xs font-semibold focus:outline-none cursor-pointer pe-1 ${
                    isDark ? 'text-slate-100' : 'text-slate-900'
                  }`}
                  title={isEn ? 'Filter by category' : 'فلتەر بەپێی پۆلێن'}
                >
                  <option value="all" className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                    {isEn ? `All Categories (${formatDigits(facts.length, language)})` : `هەموو پۆلێنەکان (${facts.length})`}
                  </option>
                  {localizedCategories.filter((c) => c.id !== 'all').map((cat) => (
                    <option key={cat.id} value={cat.id} className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                      {cat.name} ({formatDigits(categoryCounts[cat.id] || 0, language)})
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
                <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isEn ? 'Province:' : 'پارێزگا:'}
                </span>
                <select
                  value={provinceFilter}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  className={`bg-transparent text-xs font-semibold focus:outline-none cursor-pointer pe-1 max-w-[160px] truncate ${
                    isDark ? 'text-slate-100' : 'text-slate-900'
                  }`}
                  title={isEn ? 'Filter by province' : 'فلتەر بەپێی پارێزگا'}
                >
                  <option value="all" className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                    {isEn ? `All Provinces (${formatDigits(facts.length, language)})` : `هەموو پارێزگاکان (${facts.length})`}
                  </option>
                  <optgroup label={isEn ? 'Southern Kurdistan' : 'باشووری کوردستان'} className={isDark ? 'bg-[#0c101d] text-emerald-400 font-bold' : 'bg-slate-100 text-emerald-700 font-bold'}>
                    {provincesWithCounts.kurdistanProvinces
                      .filter((p) => p.part === 'south')
                      .map((p) => (
                        <option key={p.id} value={p.id} className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                          {(isEn ? p.nameEn : p.name)} ({formatDigits(p.count, language)})
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label={isEn ? 'Northern Kurdistan' : 'باکووری کوردستان'} className={isDark ? 'bg-[#0c101d] text-amber-400 font-bold' : 'bg-slate-100 text-amber-700 font-bold'}>
                    {provincesWithCounts.kurdistanProvinces
                      .filter((p) => p.part === 'north')
                      .map((p) => (
                        <option key={p.id} value={p.id} className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                          {(isEn ? p.nameEn : p.name)} ({formatDigits(p.count, language)})
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label={isEn ? 'Eastern Kurdistan' : 'ڕۆژهەڵاتی کوردستان'} className={isDark ? 'bg-[#0c101d] text-cyan-400 font-bold' : 'bg-slate-100 text-cyan-700 font-bold'}>
                    {provincesWithCounts.kurdistanProvinces
                      .filter((p) => p.part === 'east')
                      .map((p) => (
                        <option key={p.id} value={p.id} className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                          {(isEn ? p.nameEn : p.name)} ({formatDigits(p.count, language)})
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label={isEn ? 'Western Kurdistan' : 'ڕۆژئاوای کوردستان'} className={isDark ? 'bg-[#0c101d] text-purple-400 font-bold' : 'bg-slate-100 text-purple-700 font-bold'}>
                    {provincesWithCounts.kurdistanProvinces
                      .filter((p) => p.part === 'west')
                      .map((p) => (
                        <option key={p.id} value={p.id} className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                          {(isEn ? p.nameEn : p.name)} ({formatDigits(p.count, language)})
                        </option>
                      ))}
                  </optgroup>
                  {provincesWithCounts.outsideProvinces.length > 0 && (
                    <optgroup label={isEn ? 'Outside Kurdistan (Recorded)' : 'دەرەوەی کوردستان (تۆمارکراو)'} className={isDark ? 'bg-[#0c101d] text-rose-400 font-bold' : 'bg-slate-100 text-rose-700 font-bold'}>
                      {provincesWithCounts.outsideProvinces.map((p) => (
                        <option key={p.id} value={p.id} className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                          {(isEn ? p.nameEn : p.name)} ({formatDigits(p.count, language)})
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
                  title={isEn ? 'Open full provinces browser' : 'کردنەوەی پێڕستی تەواوی پارێزگاکان'}
                >
                  <Compass className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className={`flex items-center gap-2 rounded-[4px] px-3 h-9 border text-xs transition-colors ${
                isDark ? 'bg-white/[0.04] hover:bg-white/[0.07] border-white/[0.09]' : 'bg-white hover:bg-slate-50 border-slate-300 shadow-xs'
              }`}>
                <ArrowUpDown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isEn ? 'Sort:' : 'ڕیزکردن:'}
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className={`bg-transparent text-xs font-semibold focus:outline-none cursor-pointer pe-1 ${
                    isDark ? 'text-slate-100' : 'text-slate-900'
                  }`}
                  title={isEn ? 'Sort entries' : 'ڕیزبەندی بابەتەکان'}
                >
                  <option value="latest_added" className={isDark ? 'bg-[#0c101d] text-amber-300 font-bold' : 'bg-white text-amber-900 font-bold'}>
                    {isEn ? 'Recently Added' : 'دوایین و کۆتا تۆمارکراو'}
                  </option>
                  <option value="year_asc" className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                    {isEn ? 'Year (Oldest First)' : 'ساڵ (کۆن بۆ نوێ)'}
                  </option>
                  <option value="year_desc" className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                    {isEn ? 'Year (Newest First)' : 'ساڵ (نوێ بۆ کۆن)'}
                  </option>
                  <option value="category" className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                    {isEn ? 'By Category' : 'بەپێی جۆری دەسەڵات'}
                  </option>
                  <option value="num" className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                    {isEn ? 'Default Order' : 'بەپێی تۆمارکردنی سەرەتا'}
                  </option>
                </select>
              </div>

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
                  title={isEn ? 'Clear all filters' : 'پاککردنەوەی هەموو فلتەرەکان'}
                >
                  <X className="w-3 h-3" />
                  <span>{isEn ? 'Clear Filters' : 'پاککردنەوەی فلتەر'}</span>
                </button>
              )}
            </div>

            <div className={`text-xs font-medium flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span>{isEn ? 'Showing:' : 'نیشاندراو:'}</span>
              <span className={`font-mono tabular-nums font-bold ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                {formatDigits(filteredFacts.length, language)}
              </span>
              <span className={isDark ? 'text-slate-500' : 'text-slate-600'}>
                {isEn ? 'historical entries' : 'دەسەڵات و تۆمار'}
              </span>
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
              {isEn && facts.length === 0 ? (
                <Globe className="w-7 h-7 stroke-[1.8]" />
              ) : (
                <Search className="w-7 h-7 stroke-[1.8]" />
              )}
            </div>
            <div>
              <h4 className={`font-extrabold text-base font-heading ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isEn && facts.length === 0
                  ? 'English Archive is Currently Empty'
                  : (isEn ? 'No Matching Entries Found' : 'هیچ بابەتێک نەدۆزرایەوە')}
              </h4>
              <p className={`text-xs mt-1 max-w-md leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {isEn && facts.length === 0
                  ? (isAdmin
                      ? 'Use the AI Kurdish → English Translator Studio to translate Kurdish historical entries into English while keeping exact map coordinates and image URLs, or add a new English entry manually.'
                      : 'The independent English edition is being curated. You can switch to Kurdish Sorani in the meantime.')
                  : (isEn
                      ? 'Try switching categories, adjusting province filters, or clearing your search query.'
                      : 'دەتوانیت پۆلێنەکە بگۆڕیت، شێوازی ڕیزبەندی ڕێکبخەیتەوە یان وشەی گەڕانەکەت پاک بکەیتەوە.')}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {isEn && facts.length === 0 && isAdmin && (
                <button
                  onClick={openAiStudio}
                  className="px-4 py-2 rounded-[4px] bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-xs cursor-pointer transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                >
                  <Languages className="w-4 h-4" />
                  <span>Open AI Translator Studio</span>
                </button>
              )}
              {isEn && facts.length === 0 && isAdmin && onOpenAddFact && (
                <button
                  onClick={() => onOpenAddFact('standard')}
                  className="px-4 py-2 rounded-[4px] bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs cursor-pointer transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add English Topic</span>
                </button>
              )}
              {isEn && facts.length === 0 && (
                <button
                  onClick={toggleLanguage}
                  className={`px-4 py-2 rounded-[4px] border text-xs font-bold cursor-pointer transition-all ${
                    isDark
                      ? 'bg-white/10 hover:bg-white/15 border-white/15 text-amber-300'
                      : 'bg-white hover:bg-slate-100 border-slate-300 text-amber-900'
                  }`}
                >
                  کوردی سۆرانی
                </button>
              )}
              {isFilterActive && (
                <button
                  onClick={() => {
                    handleCategoryChange('all');
                    handleProvinceChange('all');
                    setSearchTerm('');
                  }}
                  className="px-4 py-2 rounded-[4px] bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs cursor-pointer transition-all shadow-md active:scale-95"
                >
                  {isEn ? 'Clear Filters' : 'پاککردنەوەی فلتەر'}
                </button>
              )}
            </div>
          </div>
        ) : viewMode === 'list' ? (
          /* ================= HIGH-DENSITY COMPACT LIST VIEW ================= */
          <div className="flex flex-col gap-2 max-w-4xl mx-auto">
            {displayedFacts.map((fact) => {
              const isSelected = selectedFact?.id === fact.id;
              const catInfo = getCategoryInfo(fact, language);
              const CatIcon = getCategoryIconComponent(catInfo.id);
              const displayImage = getFactDisplayImage(fact);
              const hasLinks =
                (Array.isArray(fact.relatedFactIds) && fact.relatedFactIds.length > 0) ||
                typeof fact.parentFactId === 'number' ||
                (Array.isArray(fact.allyFactIds) && fact.allyFactIds.length > 0);
              const isTranslating = !!translatingIds[fact.id];
              const trFeedback = translatedFeedback[fact.id];

              return (
                <div
                  key={fact.id}
                  onMouseEnter={() => {
                    if (onHoverFact) onHoverFact(fact);
                  }}
                  onClick={() => onSelectFact(fact)}
                  className={`group relative rounded-[4px] p-2.5 sm:p-3 flex items-center justify-between gap-3 transition-all duration-200 cursor-pointer border text-start ${
                    isSelected
                      ? (isDark
                          ? 'bg-amber-500/[0.16] border-amber-400/80 shadow-[0_0_24px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/40 -translate-y-0.5'
                          : 'bg-amber-100/80 border-amber-500 shadow-md ring-1 ring-amber-500 -translate-y-0.5')
                      : (isDark
                          ? 'bg-[#0b0f1c] hover:bg-[#101626] border-amber-500/20 hover:border-amber-400/50 shadow-xs'
                          : 'bg-white hover:bg-amber-50/40 border-slate-200 hover:border-amber-400 shadow-xs')
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
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
                          {fact.year || fact.century || (isEn ? 'Ancient Era' : 'سەردەمی دێرین')}
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

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {hasLinks && (
                      <span
                        className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-[3px] border ${
                          isDark ? 'bg-amber-400/10 text-amber-300/90 border-amber-400/20' : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}
                        title={isEn ? 'Has linked entries' : 'خاوەنی بابەتی بەستراوە'}
                      >
                        <Link2 className="w-3 h-3 text-amber-500" />
                        <span className="tabular-nums">{isEn ? 'Linked' : 'بەستراو'}</span>
                      </span>
                    )}

                    {/* Quick AI Translate to English button (Admin in Kurdish mode) */}
                    {isAdmin && !isEn && (
                      <button
                        type="button"
                        onClick={() => handleQuickTranslateCard(fact)}
                        disabled={isTranslating}
                        title="وەرگێڕان بۆ ئینگلیزی لە ڕێگەی AI (بە هەمان وێنە و پۆینتی نەخشە)"
                        className={`px-2 py-1 rounded-[3px] text-[10px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                          trFeedback === 'ok'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                            : trFeedback === 'err'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                            : 'bg-indigo-500/20 hover:bg-indigo-500/35 text-indigo-300 border-indigo-400/40'
                        }`}
                      >
                        {isTranslating ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : trFeedback === 'ok' ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Languages className="w-3 h-3" />
                        )}
                        <span>{trFeedback === 'ok' ? 'EN ✓' : 'AI → EN'}</span>
                      </button>
                    )}

                    {isAdmin && onOpenEditFact && (
                      <button
                        onClick={() => onOpenEditFact(fact)}
                        title={isEn ? 'Edit entry' : 'دەستکاریکردنی ئەم دەسەڵاتە'}
                        className={`p-1.5 rounded-[3px] transition-colors cursor-pointer ${
                          isDark ? 'text-slate-400 hover:text-amber-300 hover:bg-white/[0.08]' : 'text-slate-500 hover:text-amber-800 hover:bg-slate-100'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => onOpenDetail(fact)}
                      title={isEn ? 'Open full dossier' : 'بینینی تەواوی زانیاری و سەرچاوەکان'}
                      className={`px-2.5 py-1.5 rounded-[4px] text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95 border ${
                        isDark
                          ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-white border-amber-400/30'
                          : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 shadow-xs'
                      }`}
                    >
                      <span>{isEn ? 'Details' : 'زانیاری'}</span>
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
              const catInfo = getCategoryInfo(fact, language);
              const CatIcon = getCategoryIconComponent(catInfo.id);
              const displayImage = getFactDisplayImage(fact);
              const hasLinks =
                (Array.isArray(fact.relatedFactIds) && fact.relatedFactIds.length > 0) ||
                typeof fact.parentFactId === 'number' ||
                (Array.isArray(fact.allyFactIds) && fact.allyFactIds.length > 0);
              const isTranslating = !!translatingIds[fact.id];
              const trFeedback = translatedFeedback[fact.id];

              return (
                <div
                  key={fact.id}
                  onMouseEnter={() => {
                    if (onHoverFact) onHoverFact(fact);
                  }}
                  onClick={() => onSelectFact(fact)}
                  className={`group relative rounded-[4px] p-3 sm:p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer text-start border ${
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
                    <div className="flex items-start gap-2.5">
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

                        <div className="flex items-center gap-1.5 text-[11px] mt-0.5">
                          <span className="font-semibold truncate" style={{ color: isDark ? catInfo.color : (catInfo.color === '#f59e0b' ? '#92400e' : catInfo.color) }}>
                            {catInfo.name}
                          </span>
                          <span aria-hidden="true" className={isDark ? 'text-slate-600 font-mono' : 'text-slate-400 font-mono'}>·</span>
                          <span className={`font-mono tabular-nums font-bold shrink-0 ${isDark ? 'text-amber-300/90' : 'text-amber-800'}`}>
                            {fact.year || fact.century || (isEn ? 'Ancient Era' : 'سەردەمی دێرین')}
                          </span>
                        </div>

                        {fact.desc && (
                          <div className={`flex items-center gap-1 text-[10px] truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                            <span className="truncate">{fact.desc}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className={`text-[11px] line-clamp-2 leading-relaxed ${isDark ? 'text-slate-300/85' : 'text-slate-700 font-normal'}`}>
                      {fact.fullText || fact.desc}
                    </p>
                  </div>

                  {/* Card Bottom */}
                  <div className={`mt-3 pt-2 border-t flex items-center justify-between gap-2 ${
                    isDark ? 'border-amber-500/15' : 'border-slate-200'
                  }`}>
                    <div className={`flex items-center gap-2 min-w-0 text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {hasLinks && (
                        <span
                          className={`inline-flex items-center gap-1 font-mono text-[10px] font-semibold ${
                            isDark ? 'text-amber-300/90' : 'text-amber-900'
                          }`}
                          title={isEn ? 'Linked historical topics' : 'خاوەنی بابەتی پەیوەندیدارە'}
                        >
                          <Link2 className="w-3 h-3 text-amber-500" />
                          <span className="tabular-nums">
                            {formatDigits(fact.relatedFactIds?.length || 1, language)} {isEn ? 'links' : 'بەستراو'}
                          </span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isAdmin && !isEn && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickTranslateCard(fact);
                          }}
                          disabled={isTranslating}
                          title="وەرگێڕان بۆ ئینگلیزی لە ڕێگەی AI"
                          className={`px-2 py-1 rounded-[3px] text-[10px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                            trFeedback === 'ok'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                              : trFeedback === 'err'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                              : 'bg-indigo-500/20 hover:bg-indigo-500/35 text-indigo-300 border-indigo-400/40'
                          }`}
                        >
                          {isTranslating ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : trFeedback === 'ok' ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Languages className="w-3 h-3" />
                          )}
                          <span>{trFeedback === 'ok' ? 'EN ✓' : 'AI → EN'}</span>
                        </button>
                      )}

                      {isAdmin && onOpenEditFact && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenEditFact(fact);
                          }}
                          title={isEn ? 'Edit entry' : 'دەستکاریکردنی ئەم دەسەڵاتە'}
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
                        title={isEn ? 'Open full dossier' : 'بینینی تەواوی زانیاری و سەرچاوەکان'}
                        className={`px-2.5 py-1 rounded-[4px] transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold border ${
                          isDark
                            ? 'bg-white/[0.06] hover:bg-white/[0.12] text-amber-300 hover:text-white border-white/[0.08]'
                            : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 shadow-xs'
                        }`}
                      >
                        <span>{isEn ? 'Details' : 'زانیاری'}</span>
                        <BookOpen className="w-3 h-3 text-amber-500" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Progressive Load More */}
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
              <span>{isEn ? 'Show More' : 'نیشاندانی زیاتر'}</span>
              <span className="font-mono text-[11px] opacity-75">
                ({formatDigits(filteredFacts.length - visibleCount, language)} {isEn ? 'remaining' : 'بابەتی تر ماوە'})
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

      {/* ================= ADMIN AI KURDISH → ENGLISH TRANSLATOR STUDIO ================= */}
      {isAdmin && isAiStudioOpen && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-lg animate-fade-in"
          onClick={() => !isBatchRunning && setIsAiStudioOpen(false)}
        >
          <div
            dir={dir}
            className="relative w-full max-w-4xl max-h-[90dvh] flex flex-col rounded-3xl bg-[#070b16] border border-indigo-500/40 shadow-[0_25px_80px_rgba(0,0,0,0.95)] overflow-hidden text-start text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-3 bg-gradient-to-r from-indigo-950/60 via-[#0b1022] to-[#070b16]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center shrink-0">
                  <Languages className="w-5 h-5 text-indigo-300" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-white font-heading truncate">
                    {isEn
                      ? 'AI Kurdish → English Translator Studio'
                      : 'ستۆدیۆی وەرگێڕانی زیرەکی (کوردی → ئینگلیزی)'}
                  </h3>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    {isEn
                      ? 'Translates Kurdish historical topics into the independent English dataset (`facts_en`) while keeping exact map coordinates, boundaries, and image URLs.'
                      : 'هەموو دەقەکانی بابەتە کوردییەکان بە زیرەکی دەستکرد دەکاتە ئینگلیزی و بە هەمان وێنە و پۆینتی نەخشە لە داتابەیسی سەربەخۆی ئینگلیزی تۆماری دەکات.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isBatchRunning}
                onClick={() => setIsAiStudioOpen(false)}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 flex items-center justify-center text-slate-300 hover:text-white border border-white/10 cursor-pointer disabled:opacity-40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Toolbar: Tabs + Search + Batch Action */}
            <div className="p-3 sm:p-4 border-b border-white/10 space-y-3 bg-[#0a0f1d]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setStudioFilter('untranslated')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      studioFilter === 'untranslated'
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {isEn ? 'Untranslated' : 'وەرگێڕان نەکراوەکان'} ({formatDigits(untranslatedCount, language)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudioFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      studioFilter === 'all'
                        ? 'bg-indigo-500 text-white border-indigo-400'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {isEn ? 'All Kurdish Topics' : 'هەموو بابەتە کوردییەکان'} ({formatDigits(kurdishSourceFacts.length, language)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudioFilter('translated')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      studioFilter === 'translated'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {isEn ? 'Translated' : 'وەرگێڕدراوەکان'} ({formatDigits(kurdishSourceFacts.length - untranslatedCount, language)})
                  </button>
                </div>

                {/* Batch Translate or Stop */}
                <div className="flex items-center gap-2">
                  {isBatchRunning ? (
                    <button
                      type="button"
                      onClick={() => {
                        stopBatchRef.current = true;
                      }}
                      className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>{isEn ? 'Stop Batch' : 'وەستاندنی پرۆسە'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={studioLoading || untranslatedCount === 0}
                      onClick={handleBatchTranslateUntranslated}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 disabled:opacity-40 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        {isEn
                          ? `Translate All Untranslated (${untranslatedCount})`
                          : `وەرگێڕانی هەموو نەکراوەکان (${formatDigits(untranslatedCount, language)})`}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Search inside Studio */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={studioSearch}
                  onChange={(e) => setStudioSearch(e.target.value)}
                  placeholder={isEn ? 'Filter Kurdish topics by title or place...' : 'گەڕان لە ناوی بابەتە کوردییەکاندا...'}
                  className="w-full ps-9 pe-8 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400"
                />
                {studioSearch && (
                  <button
                    type="button"
                    onClick={() => setStudioSearch('')}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Batch Progress Bar */}
              {batchProgress && (
                <div className="p-3 rounded-2xl bg-indigo-950/50 border border-indigo-400/30 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-200 truncate">
                      {isBatchRunning
                        ? `${isEn ? 'Translating:' : 'خەریکی وەرگێڕان:'} ${batchProgress.currentName}`
                        : (isEn ? 'Batch translation finished' : 'پرۆسەی وەرگێڕانی بەکۆمەڵ تەواوبوو')}
                    </span>
                    <span className="font-mono font-bold text-amber-300 shrink-0">
                      {formatDigits(batchProgress.completed, language)} / {formatDigits(batchProgress.total, language)}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-400 via-violet-400 to-amber-400 transition-all duration-300"
                      style={{
                        width: `${batchProgress.total > 0 ? Math.round((batchProgress.completed / batchProgress.total) * 100) : 0}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-4 text-[11px] font-mono">
                    <span className="text-emerald-400">
                      ✓ {formatDigits(batchProgress.succeeded.length, language)} {isEn ? 'succeeded' : 'سەرکەوتوو'}
                    </span>
                    {batchProgress.failed.length > 0 && (
                      <span className="text-rose-400">
                        ✕ {formatDigits(batchProgress.failed.length, language)} {isEn ? 'failed' : 'هەڵە'}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Mismatched Duplicate Notes Warning & 1-Click Cleaner */}
              {mismatchedNotesList.length > 0 && (
                <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-400/45 text-amber-100 text-xs flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-bold text-amber-200">
                        {isEn
                          ? `${mismatchedNotesList.length} Kurdish entries have mismatched duplicate additional notes from other topics`
                          : `${formatDigits(mismatchedNotesList.length, language)} بابەتی کوردی تێبینیی زیادەی بابەتێکی تریان پێوە لکاوە (لەوانە: ${mismatchedNotesList
                              .slice(0, 3)
                              .map((m) => `«${m.fact.name}»`)
                              .join('، ')})`}
                      </p>
                      <p className="text-[11px] text-amber-200/80">
                        {isEn
                          ? 'AI translation now excludes them automatically, or click to clean them from the Kurdish entries.'
                          : 'وەرگێڕانی AI بە خۆکاری لایاندەبات، یان دەتوانیت لێرەوە لە ئەرشیفە کوردییەکەشدا پاکیان بکەیتەوە.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isCleaningMismatches || isBatchRunning}
                    onClick={handleCleanMismatchedNotes}
                    className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                  >
                    {isCleaningMismatches ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {isCleaningMismatches
                        ? isEn
                          ? 'Cleaning...'
                          : 'خەریکی پاککردنەوە...'
                        : isEn
                        ? 'Clean Mismatched Notes'
                        : 'پاککردنەوەی تێبینییە تێکەڵبووەکان'}
                    </span>
                  </button>
                </div>
              )}

              {/* Notice Toast */}
              {studioNotice && (
                <div
                  className={`p-2.5 px-3 rounded-xl text-xs font-medium flex items-center gap-2 border ${
                    studioNotice.type === 'ok'
                      ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-200'
                      : 'bg-rose-500/15 border-rose-400/30 text-rose-200'
                  }`}
                >
                  {studioNotice.type === 'ok' ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{studioNotice.text}</span>
                </div>
              )}
            </div>

            {/* Studio Items List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 custom-scrollbar">
              {studioLoading ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs">
                  <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
                  <span>{isEn ? 'Loading Kurdish & English archives...' : 'بارکردنی بابەتە کوردی و ئینگلیزییەکان...'}</span>
                </div>
              ) : studioFilteredList.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  {isEn ? 'No matching topics in this filter.' : 'هیچ بابەتێک لەم بەشەدا نییە.'}
                </div>
              ) : (
                studioFilteredList.map((src) => {
                  const hasEn = englishExistingIds.has(src.id);
                  const isBusy = !!translatingIds[src.id];
                  const thumb = getFactDisplayImage(src);

                  return (
                    <div
                      key={src.id}
                      className="p-2.5 sm:p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-900 border border-white/10 shrink-0 flex items-center justify-center">
                          {thumb ? (
                            <img
                              src={getOptimizedImageUrl(thumb, 'thumb')}
                              alt={src.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <MapPin className="w-4 h-4 text-amber-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-bold text-white truncate" dir="rtl">
                              {src.name}
                            </span>
                            {hasEn ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
                                {isEn ? 'In English ✓' : 'وەرگێڕدراوە ✓'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold">
                                {isEn ? 'Pending' : 'وەرگێڕان نەکراوە'}
                              </span>
                            )}
                            {mismatchOwnerById.get(src.id) && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/40 text-[10px] font-bold">
                                {isEn
                                  ? `Mismatched notes (${mismatchOwnerById.get(src.id)?.name})`
                                  : `تێبینیی «${mismatchOwnerById.get(src.id)?.name}» تێکەڵبووە`}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 truncate">
                            {src.year && <span className="font-mono text-amber-300">{src.year}</span>}
                            <span className="font-mono" dir="ltr">
                              ({src.lat.toFixed(2)}, {src.lng.toFixed(2)})
                            </span>
                            {thumb && (
                              <span className="text-emerald-400/90 flex items-center gap-0.5">
                                <ImageIcon className="w-2.5 h-2.5" />
                                <span>{isEn ? 'Image kept' : 'وێنە پارێزراو'}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isBusy || isBatchRunning}
                        onClick={() => handleStudioTranslateOne(src)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-all disabled:opacity-50 ${
                          hasEn
                            ? 'bg-white/10 hover:bg-indigo-500/30 text-slate-200 border border-white/15'
                            : 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-sm'
                        }`}
                      >
                        {isBusy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : hasEn ? (
                          <RefreshCw className="w-3.5 h-3.5" />
                        ) : (
                          <Languages className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {isBusy
                            ? (isEn ? 'Translating...' : 'وەرگێڕان...')
                            : hasEn
                            ? (isEn ? 'Re-translate (AI)' : 'نوێکردنەوە (AI)')
                            : (isEn ? 'Translate to English (AI)' : 'وەرگێڕان بۆ ئینگلیزی')}
                        </span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
