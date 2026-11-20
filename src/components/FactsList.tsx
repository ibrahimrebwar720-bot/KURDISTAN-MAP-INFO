import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FactItem } from '../data/kurdishHistoryData';
import { CollectionItem, getUnifiedCategories, getCategoryInfo, getAccessibleCategoryColor } from '../types/history';
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
  Trash2,
  Download,
  Shuffle,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
  loadKurdishFactsFromCloud,
  loadEnglishFactsFromCloud,
  saveNotesToCloud,
  updateFactLocationInCloud,
} from '../services/firestoreHistoryService';
import {
  translateFactToEnglishDetailed,
  translateFactsBatchToEnglish,
  BatchTranslateProgress,
  TranslationApiError,
  formatTranslationError,
} from '../services/aiTranslationService';
import { findMismatchedDuplicateNotesFacts } from '../utils/factConsistency';
import {
  analyzeOverlappingFactLocations,
  LocationFixPlanItem,
} from '../utils/locationDispersion';

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
  translatedFactIds?: Set<number>;
  onOpenAdminPin?: () => void;
  onOpenAddFact?: (mode?: 'photo_only' | 'standard') => void;
  onOpenSubmittedPhotos?: () => void;
  pendingSubmissionsCount?: number;
  onOpenEditFact?: (fact: FactItem) => void;
  onOpenCollectionManager?: () => void;
  onOpenTheme?: () => void;
  onOpenHero?: () => void;
  onClose?: () => void;
  onLogoutAdmin?: () => void;
  onFactsLocationsFixed?: (updatedFacts: FactItem[]) => void;
  initialSearchTerm?: string;
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
  translatedFactIds,
  onOpenAddFact,
  onOpenSubmittedPhotos,
  pendingSubmissionsCount,
  onOpenEditFact,
  onClose,
  onLogoutAdmin,
  onFactsLocationsFixed,
  initialSearchTerm,
}) => {
  const { colorMode } = useTheme();
  const { language, isEn, dir, toggleLanguage } = useLanguage();
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm || '');
  const [categoryFilter, setCategoryFilter] = useState<string>(activeCategory || 'all');
  const [provinceFilter, setProvinceFilter] = useState<string>(selectedProvince || 'all');
  const [isProvinceModalOpen, setIsProvinceModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('year_asc');

  useEffect(() => {
    if (typeof initialSearchTerm === 'string' && initialSearchTerm.trim().length > 0) {
      setSearchTerm(initialSearchTerm);
    }
  }, [initialSearchTerm]);

  // Admin AI Translation States
  const [translatingIds, setTranslatingIds] = useState<Record<number, boolean>>({});
  const [translatedFeedback, setTranslatedFeedback] = useState<Record<number, 'ok' | 'err'>>({});
  const [isAiStudioOpen, setIsAiStudioOpen] = useState(false);
  const [kurdishSourceFacts, setKurdishSourceFacts] = useState<FactItem[]>([]);
  const [englishArchiveFacts, setEnglishArchiveFacts] = useState<FactItem[]>([]);
  const [englishExistingIds, setEnglishExistingIds] = useState<Set<number>>(
    () => new Set(translatedFactIds || [])
  );
  const [studioLoading, setStudioLoading] = useState(false);
  const [studioSearch, setStudioSearch] = useState('');
  const [studioSortMode, setStudioSortMode] = useState<'priority' | 'chronological'>('priority');
  const [batchProgress, setBatchProgress] = useState<BatchTranslateProgress | null>(null);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const stopBatchRef = useRef(false);
  const [studioNotice, setStudioNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isCleaningMismatches, setIsCleaningMismatches] = useState(false);

  // Admin Location Overlap Fix (چاکسازی لۆکەیشن) states
  const [isLocationFixOpen, setIsLocationFixOpen] = useState(false);
  const [locationFixPlan, setLocationFixPlan] = useState<LocationFixPlanItem[]>([]);
  const [isFixingLocations, setIsFixingLocations] = useState(false);
  const [locationFixProgress, setLocationFixProgress] = useState<{ completed: number; total: number }>({
    completed: 0,
    total: 0,
  });
  const [locationFixNotice, setLocationFixNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const overlappingLocationsPreview = useMemo(
    () => (isAdmin ? analyzeOverlappingFactLocations(facts) : []),
    [facts, isAdmin]
  );

  const openLocationFixModal = () => {
    const plan = analyzeOverlappingFactLocations(facts);
    setLocationFixPlan(plan);
    setLocationFixProgress({ completed: 0, total: plan.length });
    setLocationFixNotice(null);
    setIsLocationFixOpen(true);
  };

  const handleApplyLocationFixes = async () => {
    if (isFixingLocations || locationFixPlan.length === 0) return;
    setIsFixingLocations(true);
    setLocationFixNotice(null);
    const total = locationFixPlan.length;
    setLocationFixProgress({ completed: 0, total });

    const updatedFacts: FactItem[] = [];
    let failedCount = 0;
    let firstErrorMsg = '';
    const BATCH_SIZE = 6;

    try {
      for (let i = 0; i < locationFixPlan.length; i += BATCH_SIZE) {
        const chunk = locationFixPlan.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          chunk.map((item) =>
            updateFactLocationInCloud(
              item.fact,
              item.newLat,
              item.newLng,
              item.provinceId,
              language
            )
          )
        );
        results.forEach((res) => {
          if (res.status === 'fulfilled') {
            updatedFacts.push(res.value);
          } else {
            failedCount += 1;
            if (!firstErrorMsg) {
              firstErrorMsg = res.reason instanceof Error ? res.reason.message : String(res.reason || '');
            }
          }
        });
        setLocationFixProgress({
          completed: Math.min(i + chunk.length, total),
          total,
        });
      }

      if (updatedFacts.length > 0) {
        onFactsLocationsFixed?.(updatedFacts);
      }

      if (failedCount === 0) {
        setLocationFixPlan([]);
        setLocationFixNotice({
          type: 'ok',
          text: isEn
            ? `Successfully dispersed and saved ${updatedFacts.length} overlapping map pins across province boundaries (synced to both languages).`
            : `${formatDigits(updatedFacts.length, language)} خاڵی تێکەڵبوو بە سەرکەوتوویی پەرت کرانە ناو سنووری پارێزگاکانیان و لە هەردوو زمانەکەدا پاشەکەوت کران ✓`,
        });
      } else {
        setLocationFixPlan((prev) =>
          prev.filter((item) => !updatedFacts.some((u) => u.id === item.fact.id))
        );
        setLocationFixNotice({
          type: 'err',
          text: isEn
            ? `Updated ${updatedFacts.length} locations, ${failedCount} failed${firstErrorMsg ? `: ${firstErrorMsg}` : '.'}`
            : `${formatDigits(updatedFacts.length, language)} شوێن چاک کران، بەڵام ${formatDigits(failedCount, language)} سەرنەکەوت${firstErrorMsg ? `: ${firstErrorMsg}` : '.'}`,
        });
      }
    } finally {
      setIsFixingLocations(false);
    }
  };

  useEffect(() => {
    if (translatedFactIds) {
      setEnglishExistingIds(new Set(translatedFactIds));
    }
  }, [translatedFactIds]);

  const linkedByEnFactIds = useMemo(() => {
    const ids = new Set<number>();
    englishArchiveFacts.forEach((f) => {
      if (typeof f.parentFactId === 'number' && !englishExistingIds.has(f.parentFactId)) {
        ids.add(f.parentFactId);
      }
      f.relatedFactIds?.forEach((rid) => {
        if (!englishExistingIds.has(rid)) ids.add(rid);
      });
      f.allyFactIds?.forEach((aid) => {
        if (!englishExistingIds.has(aid)) ids.add(aid);
      });
    });
    return ids;
  }, [englishArchiveFacts, englishExistingIds]);

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
      const [ckbList, enList] = await Promise.all([
        loadKurdishFactsFromCloud(),
        loadEnglishFactsFromCloud(),
      ]);
      const sortedCkb = [...ckbList].sort(
        (a, b) => getFactChronologicalYear(a) - getFactChronologicalYear(b)
      );
      setKurdishSourceFacts(sortedCkb);
      setEnglishArchiveFacts(enList);
      setEnglishExistingIds(new Set(enList.map((f) => f.id)));
    } catch (err) {
      setStudioNotice({
        type: 'err',
        text: err instanceof Error ? err.message : 'Failed to load cloud datasets.',
      });
    } finally {
      setStudioLoading(false);
    }
  };

  const handleExportEnglishSnapshot = async () => {
    try {
      const enList =
        englishArchiveFacts.length > 0 ? englishArchiveFacts : await loadEnglishFactsFromCloud();
      const blob = new Blob([JSON.stringify(enList, null, 2)], {
        type: 'application/json;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kurdistan-history-en-snapshot-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStudioNotice({
        type: 'ok',
        text: isEn
          ? `Exported ${enList.length} English entries as JSON snapshot.`
          : `${formatDigits(enList.length, language)} بابەتی ئینگلیزی وەک فایلی JSON دابەزێنرا.`,
      });
    } catch (err) {
      setStudioNotice({
        type: 'err',
        text: err instanceof Error ? err.message : 'Failed to export English snapshot.',
      });
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
      if (err instanceof TranslationApiError && err.isQuotaExceeded) {
        console.warn('Quick AI translate paused: quota exceeded (429).');
        setStudioNotice({
          type: 'err',
          text: formatTranslationError(err, language),
        });
      } else {
        console.error('Quick AI translate failed:', err);
      }
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
        text: formatTranslationError(err, language),
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
    let list = kurdishSourceFacts.filter((f) => !englishExistingIds.has(f.id));
    if (studioSearch.trim()) {
      const q = studioSearch.trim();
      list = list.filter(
        (f) =>
          kurdishSearchMatch(f.name, q) ||
          kurdishSearchMatch(f.desc, q) ||
          kurdishSearchMatch(f.year || '', q)
      );
    }
    if (studioSortMode === 'priority') {
      const score = (f: FactItem) => {
        let s = 0;
        if (linkedByEnFactIds.has(f.id)) s += 100;
        if (getFactDisplayImage(f)) s += 10;
        return s;
      };
      list = [...list].sort((a, b) => {
        const diff = score(b) - score(a);
        if (diff !== 0) return diff;
        return getFactChronologicalYear(a) - getFactChronologicalYear(b);
      });
    }
    return list;
  }, [
    kurdishSourceFacts,
    englishExistingIds,
    studioSearch,
    studioSortMode,
    linkedByEnFactIds,
  ]);

  const untranslatedCount = useMemo(
    () => kurdishSourceFacts.filter((f) => !englishExistingIds.has(f.id)).length,
    [kurdishSourceFacts, englishExistingIds]
  );

  const translatedCount = useMemo(
    () => kurdishSourceFacts.filter((f) => englishExistingIds.has(f.id)).length,
    [kurdishSourceFacts, englishExistingIds]
  );

  const handleBatchTranslateUntranslated = async () => {
    const targets = studioFilteredList.length > 0 && studioSearch.trim() === ''
      ? studioFilteredList
      : kurdishSourceFacts.filter((f) => !englishExistingIds.has(f.id));
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
    if (summary.quotaExceeded) {
      setStudioNotice({
        type: 'err',
        text: isEn
          ? `Batch paused after ${summary.succeeded.length} translations: Free Tier daily AI quota was reached. Select a billing-enabled Gemini API key in Settings > Secrets to continue, or try again tomorrow.`
          : `وەرگێڕانی بەکۆمەڵ دوای ${formatDigits(summary.succeeded.length, language)} بابەت وەستێنرا چونکە سنووری ڕۆژانەی پلانی خۆڕایی (Free Tier) پڕبووەوە. بۆ بەردەوامبوون کلیلی Gemini API ی خاوەن Billing لە Settings > Secrets هەڵبژێرە یان سبەینێ هەوڵ بدەرەوە.`,
      });
      return;
    }
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
      {/* Unified Archive Catalog Search & Filter Header (Navbar handles global Home/Lang/Theme) */}
      <header
        className={`border-b shrink-0 z-20 shadow-sm transition-colors ${
          isDark
            ? 'bg-[#070b16]/95 border-white/[0.08]'
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-2.5 sm:py-3.5 flex flex-col gap-2.5">
          {/* Row 1: Section Heading + Live Search + View Toggle + Admin Tools */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                  isDark
                    ? 'bg-amber-500/15 border-amber-400/30 text-amber-300'
                    : 'bg-amber-100 border-amber-300 text-amber-800'
                }`}
              >
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className={`text-sm sm:text-base font-extrabold font-heading truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {isEn ? 'Archive Directory' : 'ئەرشیفی دەسەڵاتەکان'}
                  </h2>
                  <span className={`font-mono text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>·</span>
                  <span className={`text-xs font-mono tabular-nums font-bold ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                    {formatDigits(filteredFacts.length, language)} / {formatDigits(facts.length, language)}
                  </span>
                </div>
              </div>
            </div>

            {/* Controls Cluster: Search Input next to Cards/List Switcher + Admin Tools */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial justify-end">
              {/* Search Input next to Cards/List button */}
              <div className="relative flex-1 min-w-[160px] sm:w-56 md:w-64 sm:flex-initial">
                <Search className={`w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={
                    isEn
                      ? 'Search dynasty, leader, city, or year...'
                      : 'گەڕان بەپێی ناو، سەرکردە، شار یان ساڵ...'
                  }
                  className={`w-full text-xs ps-9 pe-8 py-2 rounded-xl border focus:outline-none transition-all text-start h-9 ${
                    isDark
                      ? 'bg-white/[0.05] hover:bg-white/[0.08] text-slate-100 placeholder:text-slate-500 border-white/[0.1] focus:border-amber-400'
                      : 'bg-slate-50 hover:bg-white text-slate-900 placeholder:text-slate-400 border-slate-300 focus:bg-white focus:border-amber-500 font-medium'
                  }`}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className={`absolute end-2.5 top-1/2 -translate-y-1/2 p-1 cursor-pointer ${
                      isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                    }`}
                    title={isEn ? 'Clear search' : 'سڕینەوە'}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setViewMode((prev) => (prev === 'grid' ? 'list' : 'grid'))}
                className={`h-9 px-2.5 sm:px-3 flex items-center gap-1.5 rounded-xl border transition-all cursor-pointer active:scale-95 text-xs font-bold shrink-0 ${
                  isDark
                    ? 'bg-white/[0.06] hover:bg-white/[0.12] text-amber-300 border-white/10'
                    : 'bg-slate-100 hover:bg-slate-200 text-amber-900 border-slate-300 shadow-xs'
                }`}
                title={
                  viewMode === 'grid'
                    ? isEn
                      ? 'Switch to list view'
                      : 'گۆڕین بۆ لیستی پوخت'
                    : isEn
                    ? 'Switch to card grid'
                    : 'گۆڕین بۆ کارتەکان'
                }
              >
                {viewMode === 'grid' ? (
                  <>
                    <List className="w-4 h-4" />
                    <span className="hidden md:inline">{isEn ? 'List' : 'لیست'}</span>
                  </>
                ) : (
                  <>
                    <LayoutGrid className="w-4 h-4" />
                    <span className="hidden md:inline">{isEn ? 'Cards' : 'کارتەکان'}</span>
                  </>
                )}
              </button>

              {isAdmin && (
                <>
                  <button
                    type="button"
                    onClick={openLocationFixModal}
                    className={`h-9 px-2.5 sm:px-3 flex items-center gap-1.5 rounded-xl border font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95 ${
                      overlappingLocationsPreview.length > 0
                        ? isDark
                          ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-400/45'
                          : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-400'
                        : isDark
                        ? 'bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 border-white/15'
                        : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                    }`}
                    title={isEn ? 'Disperse overlapping map locations inside province boundaries' : 'چاکسازی و پەرتکردنی لۆکەیشنە تێکەڵبووەکان لە ناو سنووری پارێزگاکاندا'}
                  >
                    <Shuffle className="w-4 h-4 shrink-0" />
                    <span>{isEn ? 'Fix Locations' : 'چاکسازی لۆکەیشن'}</span>
                    {overlappingLocationsPreview.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-md bg-amber-500 text-slate-950 font-black text-[10px] tabular-nums">
                        {formatDigits(overlappingLocationsPreview.length, language)}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={openAiStudio}
                    className="preserve-contrast h-9 px-2.5 sm:px-3 flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
                    title={isEn ? 'AI Translation Studio' : 'ستۆدیۆی وەرگێڕانی AI'}
                  >
                    <Languages className="w-4 h-4" />
                    <span className="hidden lg:inline">{isEn ? 'AI Studio' : 'وەرگێڕانی AI'}</span>
                  </button>

                  {onOpenSubmittedPhotos && (
                    <button
                      type="button"
                      onClick={onOpenSubmittedPhotos}
                      className={`h-9 px-2.5 flex items-center gap-1 rounded-xl font-bold text-xs border transition-all cursor-pointer active:scale-95 ${
                        isDark
                          ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-400/40'
                          : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                      }`}
                      title={isEn ? 'Photo submissions' : 'وێنە نێردراوەکان'}
                    >
                      <Images className="w-4 h-4 text-amber-500" />
                      {typeof pendingSubmissionsCount === 'number' && pendingSubmissionsCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-black text-[10px]">
                          {formatDigits(pendingSubmissionsCount, language)}
                        </span>
                      )}
                    </button>
                  )}

                  {onOpenAddFact && (
                    <>
                      <button
                        type="button"
                        onClick={() => onOpenAddFact('photo_only')}
                        className="h-9 px-2.5 sm:px-3 flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-extrabold text-xs shadow-xs cursor-pointer active:scale-95"
                        title={isEn ? 'Add quick photo' : 'زیادکردنی وێنە'}
                      >
                        <ImageIcon className="w-4 h-4" />
                        <span className="hidden md:inline">{isEn ? 'Photo' : 'وێنە'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenAddFact('standard')}
                        className={`h-9 px-2.5 sm:px-3 flex items-center gap-1.5 rounded-xl border font-bold text-xs cursor-pointer active:scale-95 ${
                          isDark
                            ? 'bg-white/[0.08] hover:bg-white/[0.14] border-white/10 text-white'
                            : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-900 shadow-xs'
                        }`}
                        title={isEn ? 'Add new topic' : 'بابەتی نوێ'}
                      >
                        <Plus className="w-4 h-4" />
                        <span className="hidden md:inline">{isEn ? 'Topic' : 'بابەت'}</span>
                      </button>
                    </>
                  )}

                  {onLogoutAdmin && (
                    <button
                      type="button"
                      onClick={onLogoutAdmin}
                      className={`h-9 px-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                        isDark
                          ? 'text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border-rose-800/40'
                          : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-300'
                      }`}
                      title={isEn ? 'Exit Admin' : 'دەرچوون لە ئەدمین'}
                    >
                      {isEn ? 'Logout' : 'دەرچوون'}
                    </button>
                  )}
                </>
              )}

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className={`hidden sm:flex h-9 w-9 items-center justify-center rounded-xl border transition-all cursor-pointer active:scale-95 ${
                    isDark
                      ? 'bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white border-white/[0.1]'
                      : 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-950 border-slate-300 shadow-xs'
                  }`}
                  title={isEn ? 'Back to Map' : 'گەڕانەوە بۆ نەخشە'}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Clean Unified Filters (Category, Province, Sort, Clear) */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
            {/* Category Filter */}
            <div className={`flex items-center gap-1.5 rounded-xl px-2.5 h-9 border text-xs shrink-0 transition-colors ${
              categoryFilter !== 'all'
                ? isDark
                  ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                  : 'bg-amber-100 border-amber-400 text-amber-950 shadow-xs'
                : isDark
                ? 'bg-white/[0.04] hover:bg-white/[0.07] border-white/[0.09]'
                : 'bg-slate-50 hover:bg-white border-slate-300 shadow-xs'
            }`}>
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <select
                value={categoryFilter}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className={`bg-transparent text-xs font-bold focus:outline-none cursor-pointer pe-1 max-w-[140px] sm:max-w-[180px] truncate ${
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

            {/* Province Filter */}
            <div className={`flex items-center gap-1.5 rounded-xl px-2.5 h-9 border text-xs shrink-0 transition-colors ${
              provinceFilter !== 'all'
                ? isDark
                  ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                  : 'bg-amber-100 border-amber-400 text-amber-950 shadow-xs'
                : isDark
                ? 'bg-white/[0.04] hover:bg-white/[0.07] border-white/[0.09]'
                : 'bg-slate-50 hover:bg-white border-slate-300 shadow-xs'
            }`}>
              <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <select
                value={provinceFilter}
                onChange={(e) => handleProvinceChange(e.target.value)}
                className={`bg-transparent text-xs font-bold focus:outline-none cursor-pointer pe-1 max-w-[130px] sm:max-w-[165px] truncate ${
                  isDark ? 'text-slate-100' : 'text-slate-900'
                }`}
                title={isEn ? 'Filter by province' : 'فلتەر بەپێی پارێزگا'}
              >
                <option value="all" className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                  {isEn ? 'All Provinces' : 'هەموو پارێزگاکان'}
                </option>
                <optgroup label={isEn ? 'Southern Kurdistan' : 'باشووری کوردستان'} className={isDark ? 'bg-[#0c101d] text-emerald-400 font-bold' : 'bg-slate-100 text-emerald-700 font-bold'}>
                  {provincesWithCounts.kurdistanProvinces
                    .filter((p) => p.part === 'south')
                    .map((p) => (
                      <option key={p.id} value={p.id} className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                        {isEn ? p.nameEn : p.name}
                      </option>
                    ))}
                </optgroup>
                <optgroup label={isEn ? 'Northern Kurdistan' : 'باکووری کوردستان'} className={isDark ? 'bg-[#0c101d] text-amber-400 font-bold' : 'bg-slate-100 text-amber-700 font-bold'}>
                  {provincesWithCounts.kurdistanProvinces
                    .filter((p) => p.part === 'north')
                    .map((p) => (
                      <option key={p.id} value={p.id} className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                        {isEn ? p.nameEn : p.name}
                      </option>
                    ))}
                </optgroup>
                <optgroup label={isEn ? 'Eastern Kurdistan' : 'ڕۆژهەڵاتی کوردستان'} className={isDark ? 'bg-[#0c101d] text-cyan-400 font-bold' : 'bg-slate-100 text-cyan-700 font-bold'}>
                  {provincesWithCounts.kurdistanProvinces
                    .filter((p) => p.part === 'east')
                    .map((p) => (
                      <option key={p.id} value={p.id} className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                        {isEn ? p.nameEn : p.name}
                      </option>
                    ))}
                </optgroup>
                <optgroup label={isEn ? 'Western Kurdistan' : 'ڕۆژئاوای کوردستان'} className={isDark ? 'bg-[#0c101d] text-purple-400 font-bold' : 'bg-slate-100 text-purple-700 font-bold'}>
                  {provincesWithCounts.kurdistanProvinces
                    .filter((p) => p.part === 'west')
                    .map((p) => (
                      <option key={p.id} value={p.id} className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                        {isEn ? p.nameEn : p.name}
                      </option>
                    ))}
                </optgroup>
                {provincesWithCounts.outsideProvinces.length > 0 && (
                  <optgroup label={isEn ? 'Outside Kurdistan' : 'دەرەوەی کوردستان'} className={isDark ? 'bg-[#0c101d] text-rose-400 font-bold' : 'bg-slate-100 text-rose-700 font-bold'}>
                    {provincesWithCounts.outsideProvinces.map((p) => (
                      <option key={p.id} value={p.id} className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                        {isEn ? p.nameEn : p.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <button
                type="button"
                onClick={() => setIsProvinceModalOpen(true)}
                className={`p-1 rounded-lg cursor-pointer transition-colors ${
                  isDark ? 'hover:bg-white/10 text-amber-400' : 'hover:bg-slate-200 text-amber-700'
                }`}
                title={isEn ? 'Browse all provinces' : 'بینینی هەموو پارێزگاکان'}
              >
                <Compass className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className={`flex items-center gap-1.5 rounded-xl px-2.5 h-9 border text-xs shrink-0 transition-colors ${
              isDark ? 'bg-white/[0.04] hover:bg-white/[0.07] border-white/[0.09]' : 'bg-slate-50 hover:bg-white border-slate-300 shadow-xs'
            }`}>
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className={`bg-transparent text-xs font-bold focus:outline-none cursor-pointer pe-1 ${
                  isDark ? 'text-slate-100' : 'text-slate-900'
                }`}
                title={isEn ? 'Sort entries' : 'ڕیزبەندی بابەتەکان'}
              >
                <option value="year_asc" className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                  {isEn ? 'Oldest → Newest' : 'ساڵ (کۆن بۆ نوێ)'}
                </option>
                <option value="year_desc" className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                  {isEn ? 'Newest → Oldest' : 'ساڵ (نوێ بۆ کۆن)'}
                </option>
                <option value="latest_added" className={isDark ? 'bg-[#0c101d] text-amber-300 font-bold' : 'bg-white text-amber-900 font-bold'}>
                  {isEn ? 'Recently Added' : 'نوێترین تۆمارکراو'}
                </option>
                <option value="category" className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                  {isEn ? 'By Category' : 'بەپێی پۆلێن'}
                </option>
                <option value="num" className={isDark ? 'bg-[#0c101d] text-slate-100' : 'bg-white text-slate-900'}>
                  {isEn ? 'Default Order' : 'ڕیزبەندیی سەرەتا'}
                </option>
              </select>
            </div>

            {isFilterActive && (
              <button
                type="button"
                onClick={() => {
                  handleCategoryChange('all');
                  handleProvinceChange('all');
                  setSearchTerm('');
                }}
                className={`flex items-center gap-1 px-3 h-9 rounded-xl text-xs font-bold cursor-pointer border shrink-0 transition-all ${
                  isDark
                    ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-400/30'
                    : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-300 shadow-xs'
                }`}
                title={isEn ? 'Clear all filters' : 'پاککردنەوەی فلتەر'}
              >
                <X className="w-3.5 h-3.5" />
                <span>{isEn ? 'Reset' : 'پاککردنەوە'}</span>
              </button>
            )}
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
                  className="preserve-contrast px-4 py-2 rounded-[4px] bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-xs cursor-pointer transition-all shadow-md active:scale-95 flex items-center gap-1.5"
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
                          <CatIcon className="w-5 h-5" style={{ color: getAccessibleCategoryColor(catInfo.color, isDark) }} />
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
                        {(() => {
                          const catColor = getAccessibleCategoryColor(catInfo.color, isDark);
                          return (
                            <span
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded-[3px] font-semibold shrink-0"
                              style={{
                                backgroundColor: isDark ? `${catInfo.color}20` : `${catColor}14`,
                                color: catColor,
                                border: `1px solid ${catColor}45`,
                              }}
                            >
                              {catInfo.name}
                            </span>
                          );
                        })()}
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

                    {/* Quick AI Translate to English button (Admin in Kurdish mode, hidden if already translated) */}
                    {isAdmin && !isEn && !englishExistingIds.has(fact.id) && (
                      <button
                        type="button"
                        onClick={() => handleQuickTranslateCard(fact)}
                        disabled={isTranslating}
                        title="وەرگێڕان بۆ ئینگلیزی لە ڕێگەی AI (بە هەمان وێنە و پۆینتی نەخشە)"
                        className={`px-2 py-1 rounded-[3px] text-[10px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                          trFeedback === 'ok'
                            ? (isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300')
                            : trFeedback === 'err'
                            ? (isDark ? 'bg-rose-500/20 text-rose-300 border-rose-400/40' : 'bg-rose-100 text-rose-800 border-rose-300')
                            : (isDark ? 'bg-indigo-500/20 hover:bg-indigo-500/35 text-indigo-300 border-indigo-400/40' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-300')
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
                            <CatIcon className="w-5 h-5" style={{ color: getAccessibleCategoryColor(catInfo.color, isDark) }} />
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
                          <span className="font-semibold truncate" style={{ color: getAccessibleCategoryColor(catInfo.color, isDark) }}>
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

                    <p className={`text-[11px] line-clamp-2 leading-relaxed font-normal ${isDark ? 'text-slate-300/85' : 'text-slate-700'}`}>
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
                      {isAdmin && !isEn && !englishExistingIds.has(fact.id) && (
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
                              ? (isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300')
                              : trFeedback === 'err'
                              ? (isDark ? 'bg-rose-500/20 text-rose-300 border-rose-400/40' : 'bg-rose-100 text-rose-800 border-rose-300')
                              : (isDark ? 'bg-indigo-500/20 hover:bg-indigo-500/35 text-indigo-300 border-indigo-400/40' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-300')
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
          className="fixed inset-0 z-[2000] flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-lg animate-fade-in"
          onClick={() => !isBatchRunning && setIsAiStudioOpen(false)}
        >
          <div
            dir={dir}
            className={`relative w-full max-w-4xl max-h-[90dvh] flex flex-col rounded-3xl border overflow-hidden text-start ${
              isDark
                ? 'bg-[#070b16] border-indigo-500/40 text-slate-100 shadow-[0_25px_80px_rgba(0,0,0,0.95)]'
                : 'bg-white border-indigo-300 text-slate-900 shadow-2xl'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className={`p-4 sm:p-5 border-b flex items-center justify-between gap-3 ${
                isDark
                  ? 'border-white/10 bg-gradient-to-r from-indigo-950/60 via-[#0b1022] to-[#070b16]'
                  : 'border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-slate-50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${
                    isDark
                      ? 'bg-indigo-500/20 border-indigo-400/40 text-indigo-300'
                      : 'bg-indigo-100 border-indigo-300 text-indigo-700'
                  }`}
                >
                  <Languages className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className={`text-sm sm:text-base font-black font-heading truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {isEn
                      ? 'AI Kurdish → English Translator Studio'
                      : 'ستۆدیۆی وەرگێڕانی زیرەکی (کوردی → ئینگلیزی)'}
                  </h3>
                  <p className={`text-[11px] leading-snug ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
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
                className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer disabled:opacity-40 transition-colors ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border-white/10'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-300'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Toolbar: Coverage + Priority Sort + Export + Batch Action */}
            <div
              className={`p-3 sm:p-4 border-b space-y-3 ${
                isDark ? 'border-white/10 bg-[#0a0f1d]' : 'border-slate-200 bg-slate-50'
              }`}
            >
              {/* Master Knowledge Base Translation Coverage Bar */}
              {kurdishSourceFacts.length > 0 && (
                <div
                  className={`p-2.5 rounded-2xl border space-y-1.5 ${
                    isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {isEn
                        ? 'Knowledge Base Coverage (ckb → en)'
                        : 'ڕێژەی وەرگێڕان لە بنکەی کوردییەوە (ckb → en)'}
                    </span>
                    <span className={`font-mono font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                      {formatDigits(translatedCount, language)} / {formatDigits(kurdishSourceFacts.length, language)} (
                      {formatDigits(
                        Math.round((translatedCount / kurdishSourceFacts.length) * 100),
                        language
                      )}
                      %)
                    </span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-all duration-300"
                      style={{
                        width: `${Math.round((translatedCount / kurdishSourceFacts.length) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                      isDark
                        ? 'bg-amber-500/20 text-amber-300 border-amber-400/35'
                        : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}
                  >
                    {isEn ? 'Untranslated Topics' : 'بابەتە وەرگێڕان نەکراوەکان'} ({formatDigits(untranslatedCount, language)})
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setStudioSortMode((prev) => (prev === 'priority' ? 'chronological' : 'priority'))
                    }
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border cursor-pointer transition-colors ${
                      studioSortMode === 'priority'
                        ? isDark
                          ? 'bg-sky-500/20 text-sky-300 border-sky-400/40'
                          : 'bg-sky-100 text-sky-800 border-sky-300'
                        : isDark
                        ? 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {studioSortMode === 'priority'
                      ? isEn
                        ? 'Sort: Priority First'
                        : 'ڕیزکردن: ئەولەوییەت'
                      : isEn
                      ? 'Sort: Chronological'
                      : 'ڕیزکردن: مێژوویی'}
                  </button>
                </div>

                {/* Export Snapshot + Batch Translate or Stop */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    disabled={studioLoading || translatedCount === 0}
                    onClick={handleExportEnglishSnapshot}
                    className={`px-3 py-2 rounded-xl border font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors ${
                      isDark
                        ? 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/15'
                        : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                    }`}
                    title={isEn ? 'Download translated English entries as JSON snapshot' : 'داگرتنی داتای ئینگلیزی وەک فایلی JSON'}
                  >
                    <Download className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />
                    <span>{isEn ? 'Export EN JSON' : 'داگرتنی EN JSON'}</span>
                  </button>

                  {isBatchRunning ? (
                    <button
                      type="button"
                      onClick={() => {
                        stopBatchRef.current = true;
                      }}
                      className="preserve-contrast px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>{isEn ? 'Stop Batch' : 'وەستاندنی پرۆسە'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={studioLoading || untranslatedCount === 0}
                      onClick={handleBatchTranslateUntranslated}
                      className="preserve-contrast px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
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
                <Search className={`w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                <input
                  type="text"
                  value={studioSearch}
                  onChange={(e) => setStudioSearch(e.target.value)}
                  placeholder={isEn ? 'Filter Kurdish topics by title or place...' : 'گەڕان لە ناوی بابەتە کوردییەکاندا...'}
                  className={`w-full ps-9 pe-8 py-2 rounded-xl border text-xs focus:outline-none focus:border-indigo-500 ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-500'
                  }`}
                />
                {studioSearch && (
                  <button
                    type="button"
                    onClick={() => setStudioSearch('')}
                    className={`absolute end-2.5 top-1/2 -translate-y-1/2 cursor-pointer ${
                      isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Batch Progress Bar */}
              {batchProgress && (
                <div
                  className={`p-3 rounded-2xl border space-y-2 ${
                    isDark ? 'bg-indigo-950/50 border-indigo-400/30' : 'bg-indigo-50 border-indigo-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-bold truncate ${isDark ? 'text-indigo-200' : 'text-indigo-900'}`}>
                      {isBatchRunning
                        ? `${isEn ? 'Translating:' : 'خەریکی وەرگێڕان:'} ${batchProgress.currentName}`
                        : (isEn ? 'Batch translation finished' : 'پرۆسەی وەرگێڕانی بەکۆمەڵ تەواوبوو')}
                    </span>
                    <span className={`font-mono font-bold shrink-0 ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                      {formatDigits(batchProgress.completed, language)} / {formatDigits(batchProgress.total, language)}
                    </span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-indigo-200/70'}`}>
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-amber-500 transition-all duration-300"
                      style={{
                        width: `${batchProgress.total > 0 ? Math.round((batchProgress.completed / batchProgress.total) * 100) : 0}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-4 text-[11px] font-mono font-bold">
                    <span className={isDark ? 'text-emerald-400' : 'text-emerald-700'}>
                      ✓ {formatDigits(batchProgress.succeeded.length, language)} {isEn ? 'succeeded' : 'سەرکەوتوو'}
                    </span>
                    {batchProgress.failed.length > 0 && (
                      <span className={isDark ? 'text-rose-400' : 'text-rose-700'}>
                        ✕ {formatDigits(batchProgress.failed.length, language)} {isEn ? 'failed' : 'هەڵە'}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Mismatched Duplicate Notes Warning & 1-Click Cleaner */}
              {mismatchedNotesList.length > 0 && (
                <div
                  className={`p-3 rounded-2xl border text-xs flex flex-wrap items-center justify-between gap-3 ${
                    isDark
                      ? 'bg-amber-500/15 border-amber-400/45 text-amber-100'
                      : 'bg-amber-50 border-amber-300 text-amber-950'
                  }`}
                >
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
                    <div className="space-y-0.5 min-w-0">
                      <p className={`font-bold ${isDark ? 'text-amber-200' : 'text-amber-900'}`}>
                        {isEn
                          ? `${mismatchedNotesList.length} Kurdish entries have mismatched duplicate additional notes from other topics`
                          : `${formatDigits(mismatchedNotesList.length, language)} بابەتی کوردی تێبینیی زیادەی بابەتێکی تریان پێوە لکاوە (لەوانە: ${mismatchedNotesList
                              .slice(0, 3)
                              .map((m) => `«${m.fact.name}»`)
                              .join('، ')})`}
                      </p>
                      <p className={`text-[11px] ${isDark ? 'text-amber-200/80' : 'text-amber-800'}`}>
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
                    className="preserve-contrast px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
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
                      ? isDark
                        ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-200'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : isDark
                      ? 'bg-rose-500/15 border-rose-400/30 text-rose-200'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}
                >
                  {studioNotice.type === 'ok' ? (
                    <Check className={`w-4 h-4 shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />
                  ) : (
                    <AlertCircle className={`w-4 h-4 shrink-0 ${isDark ? 'text-rose-400' : 'text-rose-700'}`} />
                  )}
                  <span>{studioNotice.text}</span>
                </div>
              )}
            </div>

            {/* Studio Items List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 custom-scrollbar">
              {studioLoading ? (
                <div className={`py-16 flex flex-col items-center justify-center gap-3 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  <Loader2 className={`w-7 h-7 animate-spin ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  <span>{isEn ? 'Loading Kurdish & English archives...' : 'بارکردنی بابەتە کوردی و ئینگلیزییەکان...'}</span>
                </div>
              ) : studioFilteredList.length === 0 ? (
                <div className={`py-16 text-center text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {untranslatedCount === 0
                    ? (isEn ? 'All historical topics have already been translated.' : 'هەموو بابەتەکان پێشتر وەرگێڕانیان بۆ کراوە.')
                    : (isEn ? 'No matching untranslated topics.' : 'هیچ بابەتێکی وەرگێڕان نەکراو لەم گەڕانەدا نییە.')}
                </div>
              ) : (
                studioFilteredList.map((src) => {
                  const isBusy = !!translatingIds[src.id];
                  const thumb = getFactDisplayImage(src);

                  return (
                    <div
                      key={src.id}
                      className={`p-2.5 sm:p-3 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                        isDark
                          ? 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10'
                          : 'bg-slate-50 hover:bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className={`w-11 h-11 rounded-xl overflow-hidden border shrink-0 flex items-center justify-center ${
                            isDark ? 'bg-slate-900 border-white/10' : 'bg-slate-200 border-slate-300'
                          }`}
                        >
                          {thumb ? (
                            <img
                              src={getOptimizedImageUrl(thumb, 'thumb')}
                              alt={src.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <MapPin className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs sm:text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`} dir="rtl">
                              {src.name}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                                isDark
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                                  : 'bg-amber-100 text-amber-900 border-amber-300'
                              }`}
                            >
                              {isEn ? 'Pending' : 'وەرگێڕان نەکراوە'}
                            </span>
                            {linkedByEnFactIds.has(src.id) && (
                              <span
                                className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                                  isDark
                                    ? 'bg-sky-500/20 text-sky-300 border-sky-400/40'
                                    : 'bg-sky-100 text-sky-800 border-sky-300'
                                }`}
                              >
                                {isEn ? 'Linked in EN' : 'لینکراوە لە ئینگلیزیدا'}
                              </span>
                            )}
                            {mismatchOwnerById.get(src.id) && (
                              <span
                                className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                                  isDark
                                    ? 'bg-amber-500/20 text-amber-200 border-amber-400/40'
                                    : 'bg-amber-100 text-amber-900 border-amber-300'
                                }`}
                              >
                                {isEn
                                  ? `Mismatched notes (${mismatchOwnerById.get(src.id)?.name})`
                                  : `تێبینیی «${mismatchOwnerById.get(src.id)?.name}» تێکەڵبووە`}
                              </span>
                            )}
                          </div>
                          <div className={`flex items-center gap-2 text-[10px] mt-0.5 truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            {src.year && <span className={`font-mono font-bold ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>{src.year}</span>}
                            <span className="font-mono" dir="ltr">
                              ({src.lat.toFixed(2)}, {src.lng.toFixed(2)})
                            </span>
                            {thumb && (
                              <span className={`flex items-center gap-0.5 font-medium ${isDark ? 'text-emerald-400/90' : 'text-emerald-700'}`}>
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
                        className="preserve-contrast px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-all disabled:opacity-50 bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
                      >
                        {isBusy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Languages className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {isBusy
                            ? (isEn ? 'Translating...' : 'وەرگێڕان...')
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
      {/* ================= ADMIN LOCATION OVERLAP FIX MODAL (چاکسازی لۆکەیشن) ================= */}
      {isAdmin && isLocationFixOpen && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-lg animate-fade-in"
          onClick={() => !isFixingLocations && setIsLocationFixOpen(false)}
        >
          <div
            dir={dir}
            className={`relative w-full max-w-3xl max-h-[88dvh] flex flex-col rounded-3xl border overflow-hidden text-start ${
              isDark
                ? 'bg-[#070b16] border-emerald-500/40 text-slate-100 shadow-[0_25px_80px_rgba(0,0,0,0.95)]'
                : 'bg-white border-emerald-300 text-slate-900 shadow-2xl'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className={`p-4 sm:p-5 border-b flex items-center justify-between gap-3 ${
                isDark
                  ? 'border-white/10 bg-gradient-to-r from-emerald-950/60 via-[#0b1022] to-[#070b16]'
                  : 'border-slate-200 bg-gradient-to-r from-emerald-50 via-white to-slate-50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${
                    isDark
                      ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                      : 'bg-emerald-100 border-emerald-300 text-emerald-700'
                  }`}
                >
                  <Shuffle className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className={`text-sm sm:text-base font-black font-heading truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {isEn ? 'Fix Overlapping Map Locations' : 'چاکسازی لۆکەیشن و پەرتکردنی خاڵەکان'}
                  </h3>
                  <p className={`text-[11px] leading-snug ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {isEn
                      ? 'Detects pins stacked on the same spot and scatters them evenly inside their province boundaries across both languages.'
                      : 'ئەو خاڵانەی لەسەر هەمان پۆوتان کەوتوونەتە سەر یەک دەدۆزێتەوە و بەسەر پانتایی نێو سنووری پارێزگاکانیاندا پەرتیان دەکات.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isFixingLocations}
                onClick={() => setIsLocationFixOpen(false)}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer disabled:opacity-40 transition-colors ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border-white/10'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-300'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Action & Progress Toolbar */}
            <div
              className={`p-3 sm:p-4 border-b space-y-3 ${
                isDark ? 'border-white/10 bg-[#0a0f1d]' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                      locationFixPlan.length > 0
                        ? isDark
                          ? 'bg-amber-500/20 text-amber-300 border-amber-400/35'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                        : isDark
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/35'
                        : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    }`}
                  >
                    {locationFixPlan.length > 0
                      ? isEn
                        ? `${locationFixPlan.length} overlapping entries found`
                        : `${formatDigits(locationFixPlan.length, language)} خاڵی تێکەڵبوو دۆزرایەوە`
                      : isEn
                      ? '0 overlapping pins'
                      : 'هیچ خاڵێکی تێکەڵبوو نەماوە'}
                  </span>
                </div>

                {locationFixPlan.length > 0 && (
                  <button
                    type="button"
                    disabled={isFixingLocations}
                    onClick={handleApplyLocationFixes}
                    className="preserve-contrast px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                  >
                    {isFixingLocations ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>
                      {isFixingLocations
                        ? isEn
                          ? 'Dispersing & Saving...'
                          : 'خەریکی چاکسازی و پاشەکەوت...'
                        : isEn
                        ? `Disperse & Save All (${locationFixPlan.length})`
                        : `چاکسازیکردن و پاشەکەوت (${formatDigits(locationFixPlan.length, language)})`}
                    </span>
                  </button>
                )}
              </div>

              {isFixingLocations && locationFixProgress.total > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                    <span className={isDark ? 'text-emerald-300' : 'text-emerald-800'}>
                      {isEn ? 'Updating Firestore coordinates...' : 'نوێکردنەوەی پۆوتانەکان لە بنکەی داتادا...'}
                    </span>
                    <span className={isDark ? 'text-amber-300' : 'text-amber-800'}>
                      {formatDigits(locationFixProgress.completed, language)} / {formatDigits(locationFixProgress.total, language)}
                    </span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-200"
                      style={{
                        width: `${Math.round((locationFixProgress.completed / locationFixProgress.total) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {locationFixNotice && (
                <div
                  className={`p-2.5 px-3 rounded-xl text-xs font-medium flex items-center gap-2 border ${
                    locationFixNotice.type === 'ok'
                      ? isDark
                        ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-200'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : isDark
                      ? 'bg-rose-500/15 border-rose-400/30 text-rose-200'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}
                >
                  {locationFixNotice.type === 'ok' ? (
                    <Check className={`w-4 h-4 shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />
                  ) : (
                    <AlertCircle className={`w-4 h-4 shrink-0 ${isDark ? 'text-rose-400' : 'text-rose-700'}`} />
                  )}
                  <span>{locationFixNotice.text}</span>
                </div>
              )}
            </div>

            {/* Preview List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 custom-scrollbar">
              {locationFixPlan.length === 0 ? (
                <div className={`py-14 flex flex-col items-center justify-center text-center gap-2.5 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${
                    isDark ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-400' : 'bg-emerald-100 border-emerald-300 text-emerald-700'
                  }`}>
                    <Check className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-sm">
                    {isEn
                      ? 'All points are cleanly separated!'
                      : 'هەموو خاڵەکان لەسەر نەخشە جیاکراونەتەوە و ڕێکن!'}
                  </p>
                  <p className={`max-w-md text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {isEn
                      ? 'No two entries share overlapping coordinates within the same area.'
                      : 'هیچ دوو بابەتێک لەسەر هەمان شوێن بەسەر یەکدا نەکەوتوون.'}
                  </p>
                </div>
              ) : (
                locationFixPlan.map((item) => (
                  <div
                    key={item.fact.id}
                    className={`p-2.5 sm:p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-2.5 ${
                      isDark
                        ? 'bg-white/[0.03] border-white/10'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs sm:text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {item.fact.name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${
                            isDark
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {isEn ? item.provinceNameEn : item.provinceNameCkb}
                        </span>
                      </div>
                      <div className={`text-[10px] font-mono flex items-center gap-2 flex-wrap ${isDark ? 'text-slate-400' : 'text-slate-600'}`} dir="ltr">
                        <span className={isDark ? 'text-rose-300/90' : 'text-rose-700'}>
                          {item.oldLat.toFixed(4)}, {item.oldLng.toFixed(4)}
                        </span>
                        <span>→</span>
                        <span className={isDark ? 'text-emerald-300 font-bold' : 'text-emerald-700 font-bold'}>
                          {item.newLat.toFixed(4)}, {item.newLng.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
