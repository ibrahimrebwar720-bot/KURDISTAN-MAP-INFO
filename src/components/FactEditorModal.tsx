import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FactItem } from '../data/kurdishHistoryData';
import {
  CollectionItem,
  CategoryId,
  UNIFIED_CATEGORIES,
  getCategoryInfo,
} from '../types/history';
import {
  X,
  MapPin,
  Save,
  Trash2,
  Crosshair,
  BookOpen,
  FileText,
  Layers,
  Sparkles,
  Check,
  Calendar,
  AlertCircle,
  Search,
  Loader2,
  Clock,
  User,
  Shield,
  Compass,
  Sliders,
  ChevronDown,
  Info,
  Image as ImageIcon,
  Link as LinkIcon,
  Link2,
  Landmark,
  Plus,
  Eye,
  ExternalLink,
  Globe,
  Copy,
  Images,
} from 'lucide-react';
import { FactRelationsModal } from './FactRelationsModal';
import {
  resolveImageUrl,
  getLinkTypeInfo,
} from '../utils/imageUtils';
import {
  getFactYearSpan,
  formatKurdishYearRange,
  formatKurdishYear,
  normalizeYearString,
  toKurdishDigits,
  centuryToYearSpan,
  centuryRangeToYearSpan,
  formatKurdishCentury,
  formatKurdishCenturyRange,
} from '../utils/yearUtils';
import {
  searchPlacesOnMap,
  PlaceSearchResult,
  loadGoogleMapsScript,
} from '../services/googleMapsSearchService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  factToEdit?: FactItem | null;
  initialMode?: 'photo_only' | 'standard';
  collections: CollectionItem[];
  allFacts?: FactItem[];
  onSave: (fact: FactItem) => void;
  onDelete?: (factId: number) => void;
  onStartPickLocation: () => void;
  pickedCoords?: { lat: number; lng: number } | null;
  totalFactsCount: number;
}

export const FactEditorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  factToEdit,
  initialMode = 'photo_only',
  collections,
  allFacts = [],
  onSave,
  onDelete,
  onStartPickLocation,
  pickedCoords,
  totalFactsCount,
}) => {
  const [formMode, setFormMode] = useState<'photo_only' | 'standard'>('photo_only');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [fullText, setFullText] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [lat, setLat] = useState<number>(36.8);
  const [lng, setLng] = useState<number>(44.5);
  const [showManualCoords, setShowManualCoords] = useState(false);
  // Unified single category state (میرنشینەکان، شارستانییەتەکان، ئیمپراتۆرییەتەکان، زانا و شاعیر و ئەدیبان، وەزیر و کاربەدەستان، کەسایەتی تر، قەڵاکان، جەنگ و ڕووداوەکان)
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('principality');

  // Hierarchy & Topic Linking state
  const [parentFactId, setParentFactId] = useState<number | undefined>(undefined);
  const [relatedFactIds, setRelatedFactIds] = useState<number[]>([]);
  const [isLinkingModalOpen, setIsLinkingModalOpen] = useState(false);

  // Time format mode: 'single_year' (ساڵێک) | 'year_range' (دوو ساڵ) | 'single_century' (تەنیا یەک سەدە) | 'century_range' (نێوان دوو سەدە)
  const [timeMode, setTimeMode] = useState<
    'single_year' | 'year_range' | 'single_century' | 'century_range'
  >('single_year');
  const [startYearInput, setStartYearInput] = useState('');
  const [endYearInput, setEndYearInput] = useState('');
  const [startEra, setStartEra] = useState<'BC' | 'AD'>('AD');
  const [endEra, setEndEra] = useState<'BC' | 'AD'>('AD');

  // Century inputs
  const [startCenturyInput, setStartCenturyInput] = useState('10');
  const [endCenturyInput, setEndCenturyInput] = useState('12');
  const [startCenturyEra, setStartCenturyEra] = useState<'BC' | 'AD'>('AD');
  const [endCenturyEra, setEndCenturyEra] = useState<'BC' | 'AD'>('AD');

  const [yearError, setYearError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [hasLocationPicked, setHasLocationPicked] = useState(false);

  // Is this fact a historical person / figure?
  const isPerson =
    selectedCategory === 'leader' ||
    selectedCategory === 'scholar' ||
    selectedCategory === 'official' ||
    selectedCategory === 'other_figure';

  // Topic Image & Caption state (URL & Image Host only - protecting Firestore quota)
  const [imageUrl, setImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [imageLoadError, setImageLoadError] = useState<string | null>(null);

  // Additional 9 images state (total up to 10 images with imageUrl as Image #1)
  const [extraImages, setExtraImages] = useState<Array<{ url: string; caption: string }>>(() =>
    Array.from({ length: 9 }, () => ({ url: '', caption: '' }))
  );
  const [showExtraImages, setShowExtraImages] = useState<boolean>(false);

  const filledExtraCount = useMemo(() => {
    return extraImages.filter((img) => img.url.trim().length > 0).length;
  }, [extraImages]);

  const linkInfo = useMemo(() => getLinkTypeInfo(imageUrl), [imageUrl]);

  const handleImageUrlChange = (rawUrl: string) => {
    const trimmed = rawUrl.trim();
    if (trimmed.startsWith('data:')) {
      setImageLoadError('بارکردنی فایلی وێنە ناچالاک کراوە بۆ پاراستنی خێرایی و کەمکردنەوەی قەبارەی بەرنامە. تکایە تەنها لینکی وێنە دابنێ.');
      return;
    }
    setImageLoadError(null);
    const resolved = resolveImageUrl(trimmed);
    setImageUrl(resolved);
    if (resolved && !imageCaption.trim() && name.trim()) {
      setImageCaption(`وێنەی تایبەت بە «${name.trim()}»`);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator?.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          handleImageUrlChange(text);
        }
      }
    } catch {
      // ignore clipboard permission error
    }
  };

  const handleExtraImageChange = (index: number, field: 'url' | 'caption', val: string) => {
    setExtraImages((prev) => {
      const next = [...prev];
      if (field === 'url') {
        const trimmed = val.trim();
        if (trimmed.startsWith('data:')) {
          setImageLoadError('بارکردنی فایلی وێنە ناچالاک کراوە. تکایە تەنها لینکی وێنە دابنێ.');
          return prev;
        }
        const resolved = resolveImageUrl(trimmed);
        const currentCaption = next[index]?.caption || '';
        next[index] = {
          url: resolved,
          caption: currentCaption.trim() ? currentCaption : (name.trim() ? `وێنەی #${index + 2} ی «${name.trim()}»` : ''),
        };
      } else {
        next[index] = {
          ...next[index],
          caption: val,
        };
      }
      return next;
    });
  };

  const handlePasteExtraClipboard = async (index: number) => {
    try {
      if (navigator?.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          handleExtraImageChange(index, 'url', text);
        }
      }
    } catch {}
  };

  const handleClearExtraImage = (index: number) => {
    setExtraImages((prev) => {
      const next = [...prev];
      next[index] = { url: '', caption: '' };
      return next;
    });
  };

  // Google Maps Place Search state with high-performance debounce
  const [placeSearchQuery, setPlaceSearchQuery] = useState('');
  const [placeSearchResults, setPlaceSearchResults] = useState<PlaceSearchResult[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [selectedPlaceName, setSelectedPlaceName] = useState<string | null>(null);
  const searchTimeoutRef = useRef<any>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadGoogleMapsScript().catch(() => {});
      setPlaceSearchQuery('');
      setPlaceSearchResults([]);
      setShowManualCoords(false);
      setImageLoadError(null);

      if (factToEdit) {
        const isPhotoItem =
          factToEdit.tag === 'وێنەی مێژوویی' ||
          (!!factToEdit.imageUrl && !factToEdit.additionalNotes && factToEdit.category === 'monument');
        setFormMode(isPhotoItem ? 'photo_only' : 'standard');
        setName(factToEdit.name);
        setDesc(factToEdit.desc);
        setSelectedPlaceName(factToEdit.desc || null);
        setFullText(factToEdit.fullText);
        setImageUrl(factToEdit.imageUrl || '');
        setImageCaption(factToEdit.imageCaption || '');

        // Populate the 9 extra image slots from factToEdit.images (items beyond Image #1)
        const initialExtras = Array.from({ length: 9 }, () => ({ url: '', caption: '' }));
        let hasExistingExtras = false;
        if (Array.isArray(factToEdit.images) && factToEdit.images.length > 0) {
          // If first image in images matches factToEdit.imageUrl, extra are images.slice(1)
          // Otherwise, collect remaining items
          const extrasList = factToEdit.images.slice(1, 10);
          extrasList.forEach((item, idx) => {
            if (idx < 9 && item) {
              const u = typeof item === 'string' ? item : item.url;
              const c = typeof item === 'object' ? item.caption : '';
              if (u && u.trim()) {
                initialExtras[idx] = { url: u.trim(), caption: c?.trim() || '' };
                hasExistingExtras = true;
              }
            }
          });
        }
        setExtraImages(initialExtras);
        setShowExtraImages(hasExistingExtras);
        setLat(factToEdit.lat);
        setLng(factToEdit.lng);
        // Unified Category
        const catInfo = getCategoryInfo(factToEdit);
        setSelectedCategory(catInfo.id);

        // Topic Hierarchy & Relations
        setParentFactId(factToEdit.parentFactId);
        setRelatedFactIds(Array.isArray(factToEdit.relatedFactIds) ? factToEdit.relatedFactIds : []);

        // Load Time Mode & Values
        if (factToEdit.timeSpanType) {
          setTimeMode(factToEdit.timeSpanType);
          if (factToEdit.timeSpanType === 'single_century') {
            const c = factToEdit.startCentury || (factToEdit.centuryNumber ? Math.abs(factToEdit.centuryNumber) : 1);
            setStartCenturyInput(c.toString());
            setStartCenturyEra(factToEdit.startCenturyBC ?? (factToEdit.isBC || (factToEdit.centuryNumber ? factToEdit.centuryNumber < 0 : false)) ? 'BC' : 'AD');
          } else if (factToEdit.timeSpanType === 'century_range') {
            const c1 = factToEdit.startCentury || 1;
            const c2 = factToEdit.endCentury || c1;
            setStartCenturyInput(c1.toString());
            setEndCenturyInput(c2.toString());
            setStartCenturyEra(factToEdit.startCenturyBC ? 'BC' : 'AD');
            setEndCenturyEra(factToEdit.endCenturyBC ? 'BC' : 'AD');
          } else if (factToEdit.timeSpanType === 'single_year') {
            const s = typeof factToEdit.startYear === 'number' ? factToEdit.startYear : (factToEdit.birthYear || 0);
            setStartYearInput(Math.abs(s).toString());
            setStartEra(s < 0 ? 'BC' : 'AD');
            setEndYearInput('');
          } else {
            const s = typeof factToEdit.startYear === 'number' ? factToEdit.startYear : (factToEdit.birthYear || 0);
            const e = typeof factToEdit.endYear === 'number' ? factToEdit.endYear : (factToEdit.deathYear || s);
            setStartYearInput(Math.abs(s).toString());
            setStartEra(s < 0 ? 'BC' : 'AD');
            setEndYearInput(Math.abs(e).toString());
            setEndEra(e < 0 ? 'BC' : 'AD');
          }
        } else {
          // Detect mode for legacy facts
          const rawYearText = (factToEdit.year || '') + ' ' + (factToEdit.century || '');
          const hasCenturyWord = rawYearText.includes('سەدە') || rawYearText.includes('سەدەی');
          const isCenturyRange = hasCenturyWord && (rawYearText.includes('-') || rawYearText.includes('تا') || rawYearText.includes('—'));

          if (isCenturyRange) {
            setTimeMode('century_range');
            const nums = rawYearText.match(/\d+/g);
            if (nums && nums.length >= 2) {
              setStartCenturyInput(nums[0]);
              setEndCenturyInput(nums[1]);
            } else {
              setStartCenturyInput('10');
              setEndCenturyInput('12');
            }
            const isBC = factToEdit.isBC || rawYearText.includes('پ.ز') || rawYearText.includes('پێش');
            setStartCenturyEra(isBC ? 'BC' : 'AD');
            setEndCenturyEra(isBC ? 'BC' : 'AD');
          } else if (hasCenturyWord || (!factToEdit.startYear && factToEdit.century)) {
            setTimeMode('single_century');
            const numMatch = rawYearText.match(/\d+/);
            setStartCenturyInput(numMatch ? numMatch[0] : (factToEdit.centuryNumber ? Math.abs(factToEdit.centuryNumber).toString() : '1'));
            const isBC = factToEdit.isBC || (factToEdit.centuryNumber ? factToEdit.centuryNumber < 0 : false) || rawYearText.includes('پ.ز') || rawYearText.includes('پێش');
            setStartCenturyEra(isBC ? 'BC' : 'AD');
          } else if (typeof factToEdit.birthYear === 'number') {
            setStartYearInput(Math.abs(factToEdit.birthYear).toString());
            setStartEra(factToEdit.birthYear < 0 ? 'BC' : 'AD');
            if (typeof factToEdit.deathYear === 'number') {
              setTimeMode('year_range');
              setEndYearInput(Math.abs(factToEdit.deathYear).toString());
              setEndEra(factToEdit.deathYear < 0 ? 'BC' : 'AD');
            } else {
              setTimeMode('single_year');
              setEndYearInput('');
              setEndEra(factToEdit.birthYear < 0 ? 'BC' : 'AD');
            }
          } else if (typeof factToEdit.startYear === 'number') {
            setStartYearInput(Math.abs(factToEdit.startYear).toString());
            setStartEra(factToEdit.startYear < 0 ? 'BC' : 'AD');
            if (
              typeof factToEdit.endYear === 'number' &&
              factToEdit.endYear !== factToEdit.startYear
            ) {
              setTimeMode('year_range');
              setEndYearInput(Math.abs(factToEdit.endYear).toString());
              setEndEra(factToEdit.endYear < 0 ? 'BC' : 'AD');
            } else {
              setTimeMode('single_year');
              setEndYearInput('');
              setEndEra(factToEdit.startYear < 0 ? 'BC' : 'AD');
            }
          } else {
            const span = getFactYearSpan(factToEdit);
            setStartYearInput(Math.abs(span.startYear).toString());
            setStartEra(span.startYear < 0 ? 'BC' : 'AD');
            if (span.isRange && span.endYear !== span.startYear) {
              setTimeMode('year_range');
              setEndYearInput(Math.abs(span.endYear).toString());
              setEndEra(span.endYear < 0 ? 'BC' : 'AD');
            } else {
              setTimeMode('single_year');
              setEndYearInput('');
              setEndEra(span.startYear < 0 ? 'BC' : 'AD');
            }
          }
        }
        setHasLocationPicked(true);
      } else {
        setName('');
        setDesc('');
        setSelectedPlaceName(null);
        setFullText('');
        setAdditionalNotes('');
        setTimeMode('single_year');
        setStartYearInput('');
        setEndYearInput('');
        setStartEra('AD');
        setEndEra('AD');
        setStartCenturyInput('10');
        setEndCenturyInput('12');
        setStartCenturyEra('AD');
        setEndCenturyEra('AD');
        if (pickedCoords) {
          setLat(pickedCoords.lat);
          setLng(pickedCoords.lng);
          setHasLocationPicked(true);
        } else {
          setLat(36.8);
          setLng(44.5);
          setHasLocationPicked(false);
        }
        setSelectedCategory('principality');
        setParentFactId(undefined);
        setRelatedFactIds([]);
        setImageUrl('');
        setImageCaption('');
        setExtraImages(Array.from({ length: 9 }, () => ({ url: '', caption: '' })));
        setShowExtraImages(false);
        setFormMode(initialMode);
      }
      setYearError(null);
      setConfirmDelete(false);
    }
  }, [isOpen, factToEdit, initialMode]);

  const handlePlaceSearch = (query: string) => {
    setPlaceSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length < 2) {
      setPlaceSearchResults([]);
      setIsSearchingPlaces(false);
      return;
    }

    setIsSearchingPlaces(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchPlacesOnMap(query);
        setPlaceSearchResults(results);
      } catch {
        setPlaceSearchResults([]);
      } finally {
        setIsSearchingPlaces(false);
      }
    }, 350);
  };

  const handleSelectSearchedPlace = (place: PlaceSearchResult) => {
    setLat(place.lat);
    setLng(place.lng);
    setHasLocationPicked(true);
    setSelectedPlaceName(place.name);
    if (!desc.trim()) {
      setDesc(place.formattedAddress.split(',').slice(0, 2).join('، '));
    }
    setPlaceSearchResults([]);
    setPlaceSearchQuery('');
  };

  // Update coords if picked from map
  useEffect(() => {
    if (pickedCoords) {
      setLat(pickedCoords.lat);
      setLng(pickedCoords.lng);
      setHasLocationPicked(true);
    }
  }, [pickedCoords]);

  // Live preview calculation for real-time visual feedback across all 4 modes
  const previewTimeSpan = useMemo(() => {
    if (timeMode === 'single_year') {
      const norm = normalizeYearString(startYearInput.trim());
      const num = norm ? parseInt(norm, 10) : NaN;
      if (isNaN(num)) return null;
      const actualYear = startEra === 'BC' ? -Math.abs(num) : Math.abs(num);
      return {
        label: formatKurdishYear(actualYear),
        subLabel: `ساڵی ${toKurdishDigits(Math.abs(actualYear))} (${startEra === 'BC' ? 'پێش زایین' : 'زایینی'}) لەسەر تایملاین`,
        isCrossEra: false,
        finalStart: actualYear,
        finalEnd: actualYear,
      };
    }

    if (timeMode === 'year_range') {
      const normStart = normalizeYearString(startYearInput.trim());
      const normEnd = normalizeYearString(endYearInput.trim());
      const startNum = normStart ? parseInt(normStart, 10) : NaN;
      const endNum = normEnd ? parseInt(normEnd, 10) : NaN;

      if (isNaN(startNum)) return null;

      const actualStart = startEra === 'BC' ? -Math.abs(startNum) : Math.abs(startNum);
      const actualEnd = !isNaN(endNum)
        ? (endEra === 'BC' ? -Math.abs(endNum) : Math.abs(endNum))
        : actualStart;

      const finalStart = Math.min(actualStart, actualEnd);
      const finalEnd = Math.max(actualStart, actualEnd);
      const isCrossEra = finalStart < 0 && finalEnd > 0;

      return {
        label: formatKurdishYearRange(finalStart, finalEnd),
        subLabel: `ماوەی ${toKurdishDigits(finalEnd - finalStart)} ساڵ (لەسەر تایملاین لە ${formatKurdishYear(finalStart)} تا ${formatKurdishYear(finalEnd)})`,
        isCrossEra,
        finalStart,
        finalEnd,
      };
    }

    if (timeMode === 'single_century') {
      const normC = normalizeYearString(startCenturyInput.trim());
      const c = normC ? parseInt(normC, 10) : NaN;
      if (isNaN(c) || c < 1) return null;
      const isBC = startCenturyEra === 'BC';
      const span = centuryToYearSpan(c, isBC);
      return {
        label: formatKurdishCentury(c, isBC, true),
        subLabel: `هاوتایە لەگەڵ ساڵانی (${formatKurdishYear(span.startYear)} تا ${formatKurdishYear(span.endYear)}) لەسەر تایملاین`,
        isCrossEra: false,
        finalStart: span.startYear,
        finalEnd: span.endYear,
      };
    }

    if (timeMode === 'century_range') {
      const normC1 = normalizeYearString(startCenturyInput.trim());
      const normC2 = normalizeYearString(endCenturyInput.trim());
      const c1 = normC1 ? parseInt(normC1, 10) : NaN;
      const c2 = normC2 ? parseInt(normC2, 10) : NaN;

      if (isNaN(c1) || c1 < 1) return null;
      const validC2 = isNaN(c2) || c2 < 1 ? c1 : c2;

      const startBC = startCenturyEra === 'BC';
      const endBC = endCenturyEra === 'BC';
      const span = centuryRangeToYearSpan(c1, startBC, validC2, endBC);
      const isCrossEra = span.startYear < 0 && span.endYear > 0;

      return {
        label: formatKurdishCenturyRange(c1, startBC, validC2, endBC, true),
        subLabel: `هاوتایە لەگەڵ ساڵانی (${formatKurdishYear(span.startYear)} تا ${formatKurdishYear(span.endYear)}) لەسەر تایملاین`,
        isCrossEra,
        finalStart: span.startYear,
        finalEnd: span.endYear,
      };
    }

    return null;
  }, [
    timeMode,
    startYearInput,
    endYearInput,
    startEra,
    endEra,
    startCenturyInput,
    endCenturyInput,
    startCenturyEra,
    endCenturyEra,
  ]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formMode === 'photo_only') {
      if (!imageUrl.trim()) {
        setImageLoadError('تکایە لینکی وێنەکە لێرە بنووسە یان پەیستی بکە.');
        return;
      }
      const normStart = normalizeYearString(startYearInput.trim());
      const startNum = normStart ? parseInt(normStart, 10) : NaN;
      if (isNaN(startNum)) {
        setYearError('تکایە ساڵی وێنەکە بە درووستی بنووسە.');
        return;
      }
      const actualYear = startEra === 'BC' ? -Math.abs(startNum) : Math.abs(startNum);
      const formattedYear = formatKurdishYear(actualYear);
      const centuryNum = actualYear < 0 ? -Math.ceil(Math.abs(actualYear) / 100) : Math.ceil(actualYear / 100);
      const centuryLabel = formatKurdishCentury(Math.abs(centuryNum), actualYear < 0, true);

      let eraId = 4;
      let eraName = 'میرنشین و دەسەڵاتە ئیسلامییەکان';
      if (actualYear < -800) {
        eraId = 1;
        eraName = 'دەسەڵات و گەلە دێرینەکانی پێش ماد';
      } else if (actualYear < -500) {
        eraId = 2;
        eraName = 'ئیمپراتۆریەتی ماد و سەردەمی کۆن';
      } else if (actualYear < 650) {
        eraId = 3;
        eraName = actualYear < 0 ? 'سەردەمی پێش و دوای زایین' : 'سەردەمی کلاسیک و کۆن';
      } else if (actualYear < 1918) {
        eraId = 4;
        eraName = 'میرنشین و دەسەڵاتە ئیسلامییەکان';
      } else {
        eraId = 5;
        eraName = 'سەردەمی هاوچەرخ';
      }

      const resolvedPrimary = resolveImageUrl(imageUrl.trim());
      const finalTitle =
        name.trim() ||
        selectedPlaceName ||
        (imageCaption.trim()
          ? imageCaption.trim().slice(0, 45)
          : fullText.trim()
          ? fullText.trim().slice(0, 45)
          : 'وێنەی مێژوویی');
      const finalCaption = imageCaption.trim() || fullText.trim() || finalTitle;
      const finalDesc = selectedPlaceName || desc.trim() || 'کوردستان';
      const finalFullText = fullText.trim() || finalCaption;

      const item: FactItem = {
        id: factToEdit ? factToEdit.id : Date.now(),
        num: factToEdit ? factToEdit.num : totalFactsCount + 1,
        eraId: factToEdit ? factToEdit.eraId : eraId,
        eraName: factToEdit ? factToEdit.eraName : eraName,
        eraPeriod: factToEdit ? factToEdit.eraPeriod : 'مێژووی کوردستان',
        name: finalTitle,
        desc: finalDesc,
        fullText: finalFullText,
        additionalNotes: additionalNotes.trim(),
        timeSpanType: 'single_year',
        year: formattedYear,
        startYear: actualYear,
        endYear: actualYear,
        isBC: actualYear < 0,
        century: centuryLabel,
        centuryNumber: centuryNum,
        lat: Number.isFinite(Number(lat)) && Number(lat) >= -90 && Number(lat) <= 90 ? Number(lat) : 36.8,
        lng: Number.isFinite(Number(lng)) && Number(lng) >= -180 && Number(lng) <= 180 ? Number(lng) : 44.5,
        zoom: factToEdit?.zoom || 8,
        tag: 'وێنەی مێژوویی',
        collectionId: 'monument',
        category: 'monument',
        imageUrl: resolvedPrimary,
        imageCaption: finalCaption,
        images: [{ url: resolvedPrimary, caption: finalCaption }],
        isCustom: true,
      };

      onSave(item);
      onClose();
      return;
    }

    if (!name.trim()) return;

    let finalStart = 0;
    let finalEnd = 0;
    let formattedYear = '';
    let centuryLabel = '';
    let centuryNum = 1;

    if (timeMode === 'single_year') {
      const normStart = normalizeYearString(startYearInput.trim());
      const startNum = normStart ? parseInt(normStart, 10) : NaN;
      if (isNaN(startNum)) {
        setYearError('تکایە ساڵەکە بە درووستی بنووسە.');
        return;
      }
      const actualYear = startEra === 'BC' ? -Math.abs(startNum) : Math.abs(startNum);
      finalStart = actualYear;
      finalEnd = isPerson ? Math.min(2026, actualYear + 75) : actualYear;
      formattedYear = formatKurdishYear(actualYear);
      centuryNum = actualYear < 0 ? -Math.ceil(Math.abs(actualYear) / 100) : Math.ceil(actualYear / 100);
      centuryLabel = formatKurdishCentury(Math.abs(centuryNum), actualYear < 0, true);
    } else if (timeMode === 'year_range') {
      const normStart = normalizeYearString(startYearInput.trim());
      const normEnd = normalizeYearString(endYearInput.trim());
      const startNum = normStart ? parseInt(normStart, 10) : NaN;
      const endNum = normEnd ? parseInt(normEnd, 10) : NaN;

      if (isNaN(startNum)) {
        setYearError(isPerson ? 'تکایە ساڵی لەدایکبوون بنووسە.' : 'تکایە ساڵی دەستپێک بنووسە.');
        return;
      }

      const actualStart = startEra === 'BC' ? -Math.abs(startNum) : Math.abs(startNum);
      const actualEnd = !isNaN(endNum)
        ? (endEra === 'BC' ? -Math.abs(endNum) : Math.abs(endNum))
        : actualStart;

      finalStart = Math.min(actualStart, actualEnd);
      finalEnd = Math.max(actualStart, actualEnd);
      formattedYear = formatKurdishYearRange(finalStart, finalEnd);
      centuryNum = finalStart < 0 ? -Math.ceil(Math.abs(finalStart) / 100) : Math.ceil(finalStart / 100);
      centuryLabel = formatKurdishCentury(Math.abs(centuryNum), finalStart < 0, true);
    } else if (timeMode === 'single_century') {
      const normC = normalizeYearString(startCenturyInput.trim());
      const c = normC ? parseInt(normC, 10) : NaN;
      if (isNaN(c) || c < 1) {
        setYearError('تکایە ژمارەی سەدەکە بە درووستی بنووسە (بۆ نموونە: ٤ یان ١٢).');
        return;
      }
      const isBC = startCenturyEra === 'BC';
      const span = centuryToYearSpan(c, isBC);
      finalStart = span.startYear;
      finalEnd = span.endYear;
      formattedYear = formatKurdishCentury(c, isBC, false);
      centuryLabel = formatKurdishCentury(c, isBC, true);
      centuryNum = isBC ? -c : c;
    } else if (timeMode === 'century_range') {
      const normC1 = normalizeYearString(startCenturyInput.trim());
      const normC2 = normalizeYearString(endCenturyInput.trim());
      const c1 = normC1 ? parseInt(normC1, 10) : NaN;
      const c2 = normC2 ? parseInt(normC2, 10) : NaN;

      if (isNaN(c1) || c1 < 1) {
        setYearError('تکایە سەدەی دەستپێک دیاری بکە.');
        return;
      }
      const validC2 = isNaN(c2) || c2 < 1 ? c1 : c2;
      const startBC = startCenturyEra === 'BC';
      const endBC = endCenturyEra === 'BC';
      const span = centuryRangeToYearSpan(c1, startBC, validC2, endBC);
      finalStart = span.startYear;
      finalEnd = span.endYear;
      formattedYear = formatKurdishCenturyRange(c1, startBC, validC2, endBC, false);
      centuryLabel = formatKurdishCenturyRange(c1, startBC, validC2, endBC, true);
      centuryNum = span.startYear < 0 ? -c1 : c1;
    }

    // Dynamic era assignment for new custom items
    let eraId = factToEdit ? factToEdit.eraId : 4;
    let eraName = factToEdit ? factToEdit.eraName : 'دەسەڵاتە مێژووییەکان';
    if (!factToEdit) {
      if (finalStart < -800) {
        eraId = 1;
        eraName = 'دەسەڵات و گەلە دێرینەکانی پێش ماد';
      } else if (finalStart < -500) {
        eraId = 2;
        eraName = 'ئیمپراتۆریەتی ماد و سەردەمی کۆن';
      } else if (finalStart < 650) {
        eraId = 3;
        eraName = finalStart < 0 && finalEnd > 0 ? 'سەردەمی پێش و دوای زایین' : 'سەردەمی کلاسیک و کۆن';
      } else if (finalStart < 1918) {
        eraId = 4;
        eraName = 'میرنشین و دەسەڵاتە ئیسلامییەکان';
      } else {
        eraId = 5;
        eraName = 'سەردەمی هاوچەرخ';
      }
    }

    // Collect all valid images up to 10 (Primary Image + 9 Additional Images)
    const allImagesList: Array<{ url: string; caption?: string }> = [];
    const resolvedPrimary = imageUrl.trim() ? resolveImageUrl(imageUrl.trim()) : '';
    if (resolvedPrimary) {
      allImagesList.push({
        url: resolvedPrimary,
        caption: imageCaption.trim() || undefined,
      });
    }

    extraImages.forEach((extra) => {
      if (extra.url && extra.url.trim()) {
        const res = resolveImageUrl(extra.url.trim());
        if (res) {
          allImagesList.push({
            url: res,
            caption: extra.caption.trim() || undefined,
          });
        }
      }
    });

    const finalImagesArray = allImagesList.slice(0, 10);
    const finalPrimaryImage = finalImagesArray[0];

    const item: FactItem = {
      id: factToEdit ? factToEdit.id : Date.now(),
      num: factToEdit ? factToEdit.num : totalFactsCount + 1,
      eraId: eraId,
      eraName: eraName,
      eraPeriod: factToEdit ? factToEdit.eraPeriod : 'مێژووی کوردستان',
      name: name.trim(),
      desc: desc.trim() || 'کوردستان',
      fullText: fullText.trim(),
      additionalNotes: additionalNotes.trim(),
      timeSpanType: timeMode,
      year: formattedYear,
      startYear: finalStart,
      endYear: finalEnd,
      birthYear: isPerson && timeMode === 'single_year' ? finalStart : undefined,
      deathYear: isPerson && timeMode === 'year_range' ? finalEnd : undefined,
      isBC: finalStart < 0,
      century: centuryLabel,
      centuryNumber: centuryNum,
      startCentury: (timeMode === 'single_century' || timeMode === 'century_range') ? (parseInt(startCenturyInput, 10) || 1) : undefined,
      endCentury: timeMode === 'century_range' ? (parseInt(endCenturyInput, 10) || 1) : undefined,
      startCenturyBC: (timeMode === 'single_century' || timeMode === 'century_range') ? (startCenturyEra === 'BC') : undefined,
      endCenturyBC: timeMode === 'century_range' ? (endCenturyEra === 'BC') : undefined,
      lat: Number.isFinite(Number(lat)) && Number(lat) >= -90 && Number(lat) <= 90 ? Number(lat) : 36.8,
      lng: Number.isFinite(Number(lng)) && Number(lng) >= -180 && Number(lng) <= 180 ? Number(lng) : 44.5,
      zoom: factToEdit?.zoom || 8,
      tag: selectedCategory,
      collectionId: selectedCategory,
      category: selectedCategory,
      imageUrl: finalPrimaryImage ? finalPrimaryImage.url : undefined,
      imageCaption: finalPrimaryImage ? finalPrimaryImage.caption : undefined,
      images: finalImagesArray.length > 0 ? finalImagesArray : undefined,
      parentFactId: typeof parentFactId === 'number' ? parentFactId : undefined,
      relatedFactIds: relatedFactIds.length > 0 ? relatedFactIds : undefined,
      isCustom: true,
    };

    onSave(item);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[1250] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-2xl animate-fade-in text-right"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl glass-dock-2026 rounded-3xl p-6 sm:p-8 shadow-[0_30px_90px_rgba(0,0,0,0.95)] max-h-[92vh] flex flex-col text-slate-100 overflow-hidden animate-spatial-spring"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5 mb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center shadow-md shrink-0">
              {formMode === 'photo_only' ? (
                <ImageIcon className="w-5 h-5 text-amber-400" />
              ) : (
                <Sparkles className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold font-heading text-white tracking-wide">
                  {factToEdit
                    ? (formMode === 'photo_only' ? 'دەستکاریکردنی وێنەی مێژوویی' : 'دەستکاریکردنی دەسەڵات و بابەت')
                    : (formMode === 'photo_only' ? 'فۆڕمی تایبەتی وێنەی مێژوویی' : 'زیادکردنی بابەت و شوێنی نوێ')}
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {formMode === 'photo_only'
                  ? 'دانانی وێنەی مێژوویی لەسەر نەخشە تەنها بە ٤ خانە: لینکی وێنە، ساڵ، شوێن، و زانیاری وێنە'
                  : (factToEdit
                      ? `دەستکاریکردنی زانیارییەکانی «${factToEdit.name}» لەسەر نەخشە و ئەرشیف`
                      : 'تۆمارکردنی دەسەڵات، کەسایەتی، قەڵا یان ڕووداوێکی نوێ بە وردەکاریی تەواو')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center liquid-glass-btn text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="داخستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Mode Selector: فۆڕمی وێنەی مێژوویی vs فۆڕمی تەواوی بابەت */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08] mb-4 shrink-0">
          <button
            type="button"
            onClick={() => setFormMode('photo_only')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              formMode === 'photo_only'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/25'
                : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <ImageIcon className="w-4 h-4 shrink-0" />
            <span>فۆڕمی وێنەی مێژوویی (تەنها ٤ خانەکە)</span>
          </button>
          <button
            type="button"
            onClick={() => setFormMode('standard')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              formMode === 'standard'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/25'
                : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>فۆڕمی گشتی (تەواوی بابەت)</span>
          </button>
        </div>

        {/* Scrollable Form Body with Refined Structure */}
        <form onSubmit={handleSubmit} className="overflow-y-auto pr-1 space-y-4 text-xs flex-1 custom-scrollbar">
          
          {formMode === 'photo_only' ? (
            <div className="space-y-4 animate-fade-in">
              {/* Guidance Banner */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/20 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-400 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <h4 className="text-xs font-bold text-amber-300">فۆڕمی خێرا و سەربەخۆی وێنەی مێژوویی</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                    تەنها بە پڕکردنەوەی ئەم ٤ خانەیە، وێنە مێژووییەکە لەسەر نەخشەی وێنەیی و شریتەکەی خوارەوە بە خێرایی پیشان دەدرێت.
                  </p>
                </div>
              </div>

              {/* 1. بەستەری وێنە (Image Link / URL) */}
              <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg liquid-glass-btn flex items-center justify-center text-[11px] font-mono font-bold text-amber-300">
                      01
                    </span>
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span>لینکی وێنە (بەستەری وێنەی مێژوویی)</span>
                  </span>
                  <span className="text-[11px] text-slate-400">بەستەری سەرەکی</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    بەستەری وێنە (Image URL) <span className="text-amber-400">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <LinkIcon className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => handleImageUrlChange(e.target.value)}
                        placeholder="https://... لینکی ڕاستەوخۆی وێنە لێرە دابنێ"
                        dir="ltr"
                        className="w-full bg-black/40 text-slate-100 placeholder:text-slate-500 text-xs pr-10 pl-9 py-2.5 rounded-xl border border-white/10 focus:border-amber-400 focus:outline-none transition-all font-mono"
                      />
                      {imageUrl && (
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white cursor-pointer"
                          title="سڕینەوە"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handlePasteClipboard}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl liquid-glass-btn hover:border-amber-400/50 text-slate-200 hover:text-amber-300 text-xs font-semibold shrink-0 cursor-pointer transition-all"
                      title="پەیستکردن لە کلیپبۆرد"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>پەیست</span>
                    </button>
                  </div>

                  {imageLoadError && (
                    <div className="mt-2 p-2.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-200 text-xs flex items-center gap-2 animate-fade-in">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{imageLoadError}</span>
                    </div>
                  )}
                </div>

                {/* Real-time Image Preview Frame */}
                {imageUrl ? (
                  <div className="rounded-2xl overflow-hidden border border-white/15 bg-black/70 p-2.5 flex flex-col items-center justify-center gap-2">
                    <div className="w-full max-h-72 overflow-hidden rounded-xl flex items-center justify-center bg-black/90">
                      <img
                        src={imageUrl}
                        alt="پێشبینینی وێنەی مێژوویی"
                        className="max-h-72 w-auto object-contain rounded-lg shadow-lg"
                        onError={() => setImageLoadError('نەتوانرا ئەم وێنەیە باربکرێت، تکایە دڵنیابە لە درووستی بەستەرەکە.')}
                      />
                    </div>
                    <div className="flex items-center justify-between w-full px-2 text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                        <Check className="w-3.5 h-3.5" />
                        <span>پێشبینینی وێنە ئامادەیە</span>
                      </div>
                      {linkInfo && (
                        <span className="font-mono text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                          {linkInfo.label}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-white/15 bg-white/[0.02] flex flex-col items-center justify-center text-center gap-1.5 text-slate-400">
                    <ImageIcon className="w-7 h-7 text-slate-500 mb-1" />
                    <span className="text-xs font-medium text-slate-300">هیچ بەستەرێکی وێنە دانەنراوە</span>
                    <span className="text-[11px] text-slate-500">
                      دەتوانیت هەر لینکێکی وێنە لە ویکیپیدیا، ئیمگەر یان وێب لێرە دابنێیت.
                    </span>
                  </div>
                )}
              </div>

              {/* 2. ساڵ و کات (Year) */}
              <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg liquid-glass-btn flex items-center justify-center text-[11px] font-mono font-bold text-amber-300">
                      02
                    </span>
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span>ساڵ و ڕێکەوت</span>
                  </span>
                  <span className="text-[11px] text-slate-400">کاتی وێنە لە مێژوودا</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">
                      ساڵ <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={startYearInput}
                      onChange={(e) => {
                        setStartYearInput(e.target.value);
                        setYearError(null);
                      }}
                      placeholder="بۆ نموونە: 1920 یان 1187"
                      dir="ltr"
                      className="w-full bg-black/40 text-slate-100 placeholder:text-slate-500 text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:border-amber-400 focus:outline-none transition-all font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">
                      سەردەم (زایینی / پێش زایین)
                    </label>
                    <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-xl border border-white/10">
                      <button
                        type="button"
                        onClick={() => setStartEra('AD')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          startEra === 'AD'
                            ? 'bg-amber-500 text-black shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        زایینی (ز)
                      </button>
                      <button
                        type="button"
                        onClick={() => setStartEra('BC')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          startEra === 'BC'
                            ? 'bg-amber-500 text-black shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        پێش زایین (پ.ز)
                      </button>
                    </div>
                  </div>
                </div>

                {previewTimeSpan && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-amber-300">
                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-semibold">{previewTimeSpan.label}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-300">{previewTimeSpan.subLabel}</span>
                  </div>
                )}

                {yearError && (
                  <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{yearError}</span>
                  </div>
                )}
              </div>

              {/* 3. شوێن لەسەر نەخشە (Location on Map) */}
              <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg liquid-glass-btn flex items-center justify-center text-[11px] font-mono font-bold text-amber-300">
                      03
                    </span>
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <span>شوێن لەسەر نەخشە</span>
                  </span>
                  <span className="text-[11px] text-slate-400">دیاریکردنی خاڵ</span>
                </div>

                {/* Place Search */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    گەڕان بۆ شوێن یان شار (Google Places)
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={placeSearchQuery}
                      onChange={(e) => handlePlaceSearch(e.target.value)}
                      placeholder="بۆ نموونە: قەڵای هەولێر، سلێمانی، ئامەد، مەهاباد، زاخۆ، کرماشان..."
                      className="w-full bg-black/40 text-slate-100 placeholder:text-slate-500 text-xs pr-10 pl-9 py-2.5 rounded-xl border border-white/10 focus:border-amber-400 focus:outline-none transition-all"
                    />
                    {isSearchingPlaces && (
                      <Loader2 className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2 animate-spin pointer-events-none" />
                    )}
                  </div>

                  {/* Place Results */}
                  {placeSearchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-30 max-h-48 overflow-y-auto rounded-xl bg-[#0b0f19] border border-white/15 shadow-2xl p-1 space-y-1">
                      {placeSearchResults.map((place, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectSearchedPlace(place)}
                          className="w-full text-right px-3 py-2 rounded-lg hover:bg-white/10 flex items-center justify-between text-xs text-slate-200 transition-colors cursor-pointer"
                        >
                          <div>
                            <div className="font-bold text-white">{place.name}</div>
                            <div className="text-[10px] text-slate-400">{place.formattedAddress}</div>
                          </div>
                          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Current Coords Display + Pick on Map Action */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/10">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${hasLocationPicked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-400'}`}>
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">
                        {selectedPlaceName ? selectedPlaceName : (hasLocationPicked ? 'شوێن دیاریکراوە' : 'شوێن دیاری نەکراوە')}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        پۆوتانەکان: {lat.toFixed(4)}, {lng.toFixed(4)}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onStartPickLocation}
                    className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>دیاریکردن بە دەست لەسەر نەخشە</span>
                  </button>
                </div>
              </div>

              {/* 4. زانیاری لەسەر وێنە (Information on Image / Caption) */}
              <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg liquid-glass-btn flex items-center justify-center text-[11px] font-mono font-bold text-amber-300">
                      04
                    </span>
                    <Info className="w-4 h-4 text-amber-400" />
                    <span>زانیاری لەسەر وێنە</span>
                  </span>
                  <span className="text-[11px] text-slate-400">تێبینی و وەسفی مێژوویی</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    ناونیشانی وێنە (ناوی کورت یان سەردێڕ) <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="بۆ نموونە: وێنەی شێخ مەحمودی حەفید، قەڵای دمدم، دیمەنی کۆنی سلێمانی..."
                    className="w-full bg-black/40 text-slate-100 placeholder:text-slate-500 text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:border-amber-400 focus:outline-none transition-all font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    زانیاری و وەسفی تەواوی وێنە <span className="text-amber-400">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={fullText}
                    onChange={(e) => {
                      setFullText(e.target.value);
                      if (!imageCaption.trim()) {
                        setImageCaption(e.target.value.slice(0, 100));
                      }
                    }}
                    placeholder="زانیاری لەسەر ئەم وێنەیە، لە کوێ گیراوە، کێ تێیدایە، کات و سەردەم، و گرنگییە مێژوویییەکەی بنووسە..."
                    className="w-full bg-black/40 text-slate-100 placeholder:text-slate-500 text-xs p-3.5 rounded-xl border border-white/10 focus:border-amber-400 focus:outline-none transition-all resize-y leading-relaxed"
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* SECTION 1: ناو و پۆلێنبەندی (Basic Information & Classification) */}
              <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 transition-all space-y-4 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg liquid-glass-btn flex items-center justify-center text-[11px] font-mono font-bold text-amber-300">
                      01
                    </span>
                    <span>ناونیشان و پۆلێنبەندی بابەت</span>
                  </span>
              <span className="text-[11px] text-slate-400">زانیارییە سەرەکییەکان</span>
            </div>

            {/* Name Field */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">
                ناوی دەسەڵات / کەسایەتی / شوێن <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="بۆ نموونە: ئەتابەگ نەسرەدین ئەحمەد، قەڵای شێروانە، دەوڵەتی زەند، شەرەفخانی بەدلیسی..."
                className="w-full liquid-glass-input text-white px-3.5 py-2.5 rounded-xl text-sm font-semibold placeholder:text-slate-500"
              />
            </div>

            {/* Unified Category Selector (تەنها یەک پۆلێن لەنێوان ٩ پۆلێنە سەرەکییەکە) */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-amber-300">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>پۆلێنی بابەت <span className="text-amber-400">*</span></span>
                </span>
                <span className="text-[10px] text-slate-400">یەکێک لە ١٠ پۆلێنە سەرەکییەکە هەڵبژێرە</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {UNIFIED_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id as CategoryId)}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'liquid-glass-btn-active font-extrabold shadow-md scale-[1.02]'
                          : 'liquid-glass-btn text-slate-300 hover:text-white'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: isSelected ? '#000000' : cat.color }}
                      />
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 2: شوێن و جوگرافیا (Geographic Location & Google Maps) */}
          <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 transition-all space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg liquid-glass-btn flex items-center justify-center text-[11px] font-mono font-bold text-amber-300">
                  02
                </span>
                <span>شوێن و پۆوتانی جوگرافی لەسەر نەخشە</span>
              </span>
              <button
                type="button"
                onClick={() => setShowManualCoords(!showManualCoords)}
                className="text-[11px] text-amber-400/90 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-medium"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{showManualCoords ? 'شاردنەوەی پۆوتانی دەستی' : 'دەستکاریکردنی دەستی پۆوتان'}</span>
              </button>
            </div>

            {/* Region / Geographic description */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">
                پێگەی جوگرافی / شار، ناوچە یان وڵات
              </label>
              <input
                type="text"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="بۆ نموونە: ئیزە و ئەسفەهان (لوڕی گەورە)، سلێمانی، ورمێ، ئامەد، جزیرە، هەولێر..."
                className="w-full liquid-glass-input text-white px-3.5 py-2.5 rounded-xl text-xs placeholder:text-slate-500"
              />
            </div>

            {/* Google Maps Search Bar + Direct Map Picker */}
            <div className="p-3.5 rounded-2xl liquid-glass-subtle space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-amber-400" />
                  <span>گەڕان لە گۆگڵ ماپ بۆ دۆزینەوەی دەستبەجێ:</span>
                </span>

                <button
                  type="button"
                  onClick={onStartPickLocation}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl liquid-glass-btn text-amber-300 font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {hasLocationPicked
                      ? 'گۆڕینی شوێن بە دەست لەسەر نەخشە'
                      : 'دیاریکردن بە کلیک لەسەر نەخشە'}
                  </span>
                </button>
              </div>

              {/* Search Input Box */}
              <div className="relative">
                <input
                  type="text"
                  value={placeSearchQuery}
                  onChange={(e) => handlePlaceSearch(e.target.value)}
                  placeholder="ناوی هەر شار، قەڵا، شارۆچکە، شوێنەوار یان گوند بنووسە (بۆ نموونە: سلێمانی، ڕواندز، قەڵای دمدم، بەدلیس، ئامێدی...)"
                  className="w-full liquid-glass-input text-white pl-9 pr-3.5 py-2.5 rounded-xl text-xs placeholder:text-slate-500"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {isSearchingPlaces ? (
                    <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                  ) : placeSearchQuery ? (
                    <button
                      type="button"
                      onClick={() => {
                        setPlaceSearchQuery('');
                        setPlaceSearchResults([]);
                      }}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <Search className="w-4 h-4 text-slate-500" />
                  )}
                </div>
              </div>

              {/* Search Results Dropdown List */}
              {placeSearchResults.length > 0 && (
                <div className="liquid-glass-card rounded-2xl overflow-hidden shadow-2xl divide-y divide-white/10 max-h-56 overflow-y-auto animate-fade-in">
                  <div className="p-2 liquid-glass-subtle text-[10px] text-amber-300 font-bold flex items-center justify-between px-3">
                    <span>کلیک لە ناوی شوێنەکە بکە بۆ دیاریکردنی دەستبەجێ:</span>
                    <span className="font-mono text-slate-400">{placeSearchResults.length} ئەنجام</span>
                  </div>
                  {placeSearchResults.map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => handleSelectSearchedPlace(place)}
                      className="w-full text-right p-3 hover:liquid-glass-btn transition-colors flex items-start gap-3 cursor-pointer group"
                    >
                      <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 group-hover:scale-125 transition-transform" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white group-hover:text-amber-300 truncate">
                          {place.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {place.formattedAddress}
                        </div>
                        <div className="text-[10px] font-mono text-amber-400/80 mt-0.5">
                          {place.lat.toFixed(4)}° N, {place.lng.toFixed(4)}° E
                        </div>
                      </div>
                      <span className="text-[10px] px-2.5 py-1 rounded-lg liquid-glass-btn text-amber-300 shrink-0 font-bold group-hover:liquid-glass-btn-active group-hover:text-black transition-colors">
                        دەستنیشانکردن
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Visual Confirmation Badge */}
              <div className="flex items-center justify-between p-3 rounded-xl liquid-glass-subtle text-xs">
                {hasLocationPicked ? (
                  <div className="flex items-center gap-2.5 text-emerald-400 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-slate-100 truncate block">
                        {selectedPlaceName
                          ? `شوێن دیاریکراوە: ${selectedPlaceName}`
                          : 'شوێنی ئەم دەسەڵاتە دیاریکراوە.'}
                      </span>
                      <span className="text-[11px] font-mono text-amber-300">
                        پۆوتان: {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-300 text-xs">
                    <div className="w-6 h-6 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center shrink-0">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <span>
                      دەتوانیت بە سێرچی گۆگڵ ماپس لە سەرەوە یان بە دوگمەی نەخشە پۆینتەکە دیاری بکەیت.
                    </span>
                  </div>
                )}
              </div>

              {/* Optional Manual GPS Coordinates fields */}
              {showManualCoords && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 animate-fade-in">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      هێڵی پانی (Latitude)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={lat}
                      onChange={(e) => {
                        setLat(parseFloat(e.target.value) || 0);
                        setHasLocationPicked(true);
                      }}
                      className="w-full bg-[#050812] text-white px-3 py-1.5 rounded-lg border border-slate-700 font-mono text-xs focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      هێڵی درێژی (Longitude)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={lng}
                      onChange={(e) => {
                        setLng(parseFloat(e.target.value) || 0);
                        setHasLocationPicked(true);
                      }}
                      className="w-full bg-[#050812] text-white px-3 py-1.5 rounded-lg border border-slate-700 font-mono text-xs focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: ساڵنامە و تایملاین (Timeline & Eras - ساڵ یان سەدە) */}
          <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 transition-all space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg liquid-glass-btn flex items-center justify-center text-[11px] font-mono font-bold text-amber-300">
                  03
                </span>
                <span>
                  دیاریکردنی کاتی مێژوویی (بە ساڵ یان بە سەدە) بۆ تایملاین و نەخشە
                </span>
              </span>

              {previewTimeSpan?.isCrossEra && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold liquid-glass-btn-active text-black shadow-sm animate-pulse">
                  نێوان پێش و دوای زایین (پ.ز ⟷ ز)
                </span>
              )}
            </div>

            {/* Mode Selector Segmented Tabs: ٤ بژاردەی سەرەکی بە شێوازی Liquid Glass */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-amber-200/90">
                شێوازی دیاریکردنی کات هەڵبژێرە:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-2xl liquid-glass-subtle">
                <button
                  type="button"
                  onClick={() => {
                    setTimeMode('single_year');
                    setYearError(null);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    timeMode === 'single_year'
                      ? 'liquid-glass-btn-active text-black font-extrabold shadow-sm'
                      : 'liquid-glass-btn text-slate-300 hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">ساڵێکی دیاریکراو</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTimeMode('year_range');
                    setYearError(null);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    timeMode === 'year_range'
                      ? 'liquid-glass-btn-active text-black font-extrabold shadow-sm'
                      : 'liquid-glass-btn text-slate-300 hover:text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">نێوان دوو ساڵ</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTimeMode('single_century');
                    setYearError(null);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    timeMode === 'single_century'
                      ? 'liquid-glass-btn-active text-black font-extrabold shadow-sm'
                      : 'liquid-glass-btn text-slate-300 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">بەتەنیا یەک سەدە</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTimeMode('century_range');
                    setYearError(null);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    timeMode === 'century_range'
                      ? 'liquid-glass-btn-active text-black font-extrabold shadow-sm'
                      : 'liquid-glass-btn text-slate-300 hover:text-white'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">نێوان دوو سەدە</span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {yearError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/80 border border-rose-500/80 text-rose-200 text-xs font-medium">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{yearError}</span>
              </div>
            )}

            {/* MODE 1: ساڵێکی دیاریکراو (Single Year) */}
            {timeMode === 'single_year' && (
              <div className="liquid-glass-subtle rounded-xl p-3.5 space-y-2.5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isPerson ? 'ساڵی لەدایکبوون یان ساڵی چالاکی' : 'ساڵی ڕووداو یان دامەزراندن'}</span>
                    <span className="text-amber-400">*</span>
                  </label>

                  {/* Segmented Era Switcher */}
                  <div className="flex items-center p-0.5 rounded-lg liquid-glass-card text-xs" dir="ltr">
                    <button
                      type="button"
                      onClick={() => setStartEra('BC')}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer font-bold ${
                        startEra === 'BC'
                          ? 'liquid-glass-btn-active font-extrabold shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      پ.ز
                    </button>
                    <button
                      type="button"
                      onClick={() => setStartEra('AD')}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer font-bold ${
                        startEra === 'AD'
                          ? 'liquid-glass-btn-active font-extrabold shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      ز
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    value={startYearInput}
                    onChange={(e) => {
                      setStartYearInput(e.target.value);
                      setYearError(null);
                    }}
                    placeholder={startEra === 'BC' ? 'بۆ نموونە: 612 (پێش زایین)' : 'بۆ نموونە: 1514 (زایینی)'}
                    className="w-full liquid-glass-input text-white pr-3 pl-20 py-2.5 rounded-xl text-xs font-mono font-bold"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-amber-400/80 pointer-events-none">
                    {startEra === 'BC' ? 'پێش زایین' : 'زایینی'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  ئەم بابەتە بەتەنیا بۆ ئەم ساڵە لەسەر نەخشە و تایملاین جێگیر دەبێت.
                </p>
              </div>
            )}

            {/* MODE 2: نێوان دوو ساڵ (Year Range) */}
            {timeMode === 'year_range' && (
              <div className="space-y-3 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Field 1: Start Year */}
                  <div className="liquid-glass-subtle rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isPerson ? 'ساڵی لەدایکبوون' : 'ساڵی دەستپێک / دامەزراندن'}</span>
                        <span className="text-amber-400">*</span>
                      </label>

                      <div className="flex items-center p-0.5 rounded-lg liquid-glass-card text-xs" dir="ltr">
                        <button
                          type="button"
                          onClick={() => setStartEra('BC')}
                          className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer font-bold ${
                            startEra === 'BC'
                              ? 'liquid-glass-btn-active font-extrabold shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          پ.ز
                        </button>
                        <button
                          type="button"
                          onClick={() => setStartEra('AD')}
                          className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer font-bold ${
                            startEra === 'AD'
                              ? 'liquid-glass-btn-active font-extrabold shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          ز
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={startYearInput}
                        onChange={(e) => {
                          setStartYearInput(e.target.value);
                          setYearError(null);
                        }}
                        placeholder={startEra === 'BC' ? 'بۆ نموونە: 150 (پ.ز)' : 'بۆ نموونە: 1514 (ز)'}
                        className="w-full liquid-glass-input text-white pr-3 pl-16 py-2 rounded-xl text-xs font-mono font-bold"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-400/80 pointer-events-none">
                        {startEra === 'BC' ? 'پ.ز' : 'ز'}
                      </span>
                    </div>
                  </div>

                  {/* Field 2: End Year */}
                  <div className="liquid-glass-subtle rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{isPerson ? 'ساڵی کۆچی دوایی' : 'ساڵی کۆتایی / ڕووخان'}</span>
                      </label>

                      <div className="flex items-center p-0.5 rounded-lg liquid-glass-card text-xs" dir="ltr">
                        <button
                          type="button"
                          onClick={() => setEndEra('BC')}
                          className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer font-bold ${
                            endEra === 'BC'
                              ? 'liquid-glass-btn-active font-extrabold shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          پ.ز
                        </button>
                        <button
                          type="button"
                          onClick={() => setEndEra('AD')}
                          className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer font-bold ${
                            endEra === 'AD'
                              ? 'liquid-glass-btn-active font-extrabold shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          ز
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={endYearInput}
                        onChange={(e) => {
                          setEndYearInput(e.target.value);
                          setYearError(null);
                        }}
                        placeholder={endEra === 'BC' ? 'بۆ نموونە: 40 (پ.ز)' : 'بۆ نموونە: 1851 (ز)'}
                        className="w-full liquid-glass-input text-white pr-3 pl-16 py-2 rounded-xl text-xs font-mono font-bold"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-400/80 pointer-events-none">
                        {endEra === 'BC' ? 'پ.ز' : 'ز'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODE 3: بەتەنیا یەک سەدە (Single Century) */}
            {timeMode === 'single_century' && (
              <div className="liquid-glass-subtle rounded-xl p-3.5 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>سەدە دیاری بکە (بەتەنیا یەک سەدە)</span>
                    <span className="text-amber-400">*</span>
                  </label>

                  <div className="flex items-center p-0.5 rounded-lg liquid-glass-card text-xs" dir="ltr">
                    <button
                      type="button"
                      onClick={() => setStartCenturyEra('BC')}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer font-bold ${
                        startCenturyEra === 'BC'
                          ? 'liquid-glass-btn-active font-extrabold shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      پ.ز (پێش زایین)
                    </button>
                    <button
                      type="button"
                      onClick={() => setStartCenturyEra('AD')}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer font-bold ${
                        startCenturyEra === 'AD'
                          ? 'liquid-glass-btn-active font-extrabold shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      ز (زایینی)
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    value={startCenturyInput}
                    onChange={(e) => {
                      setStartCenturyInput(e.target.value);
                      setYearError(null);
                    }}
                    placeholder="ژمارەی سەدە بنووسە: بۆ نموونە 4 یان 12"
                    className="w-full liquid-glass-input text-white pr-3 pl-32 py-2.5 rounded-xl text-xs font-mono font-bold"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-amber-400/90 pointer-events-none">
                    {startCenturyEra === 'BC' ? 'سەدەی پێش زایین' : 'سەدەی زایینی'}
                  </span>
                </div>

                {/* Quick preset century buttons */}
                <div>
                  <span className="block text-[10px] text-slate-400 mb-1.5 font-bold">
                    هەڵبژاردنی خێرا بۆ سەدە:
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto custom-scrollbar">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          setStartCenturyInput(num.toString());
                          setYearError(null);
                        }}
                        className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                          startCenturyInput === num.toString()
                            ? 'liquid-glass-btn-active text-black'
                            : 'liquid-glass-btn text-slate-300 hover:text-amber-300'
                        }`}
                      >
                        سەدەی {toKurdishDigits(num)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* MODE 4: لە نێوان دوو سەدە (Century Range) */}
            {timeMode === 'century_range' && (
              <div className="space-y-3 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Century 1: Start */}
                  <div className="liquid-glass-subtle rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        <span>سەدەی دەستپێک</span>
                        <span className="text-amber-400">*</span>
                      </label>

                      <div className="flex items-center p-0.5 rounded-lg liquid-glass-card text-xs" dir="ltr">
                        <button
                          type="button"
                          onClick={() => setStartCenturyEra('BC')}
                          className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer font-bold ${
                            startCenturyEra === 'BC'
                              ? 'liquid-glass-btn-active font-extrabold shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          پ.ز
                        </button>
                        <button
                          type="button"
                          onClick={() => setStartCenturyEra('AD')}
                          className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer font-bold ${
                            startCenturyEra === 'AD'
                              ? 'liquid-glass-btn-active font-extrabold shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          ز
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={startCenturyInput}
                        onChange={(e) => {
                          setStartCenturyInput(e.target.value);
                          setYearError(null);
                        }}
                        placeholder="بۆ نموونە: 4 یان 10"
                        className="w-full liquid-glass-input text-white pr-3 pl-20 py-2 rounded-xl text-xs font-mono font-bold"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-400/80 pointer-events-none">
                        سەدەی {startCenturyEra === 'BC' ? 'پ.ز' : 'ز'}
                      </span>
                    </div>

                    {/* Presets */}
                    <div className="flex flex-wrap gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].slice(0, 10).map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setStartCenturyInput(n.toString())}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                            startCenturyInput === n.toString()
                              ? 'liquid-glass-btn-active text-black'
                              : 'bg-white/5 hover:bg-white/10 text-slate-300'
                          }`}
                        >
                          {toKurdishDigits(n)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Century 2: End */}
                  <div className="liquid-glass-subtle rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        <span>سەدەی کۆتایی</span>
                      </label>

                      <div className="flex items-center p-0.5 rounded-lg liquid-glass-card text-xs" dir="ltr">
                        <button
                          type="button"
                          onClick={() => setEndCenturyEra('BC')}
                          className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer font-bold ${
                            endCenturyEra === 'BC'
                              ? 'liquid-glass-btn-active font-extrabold shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          پ.ز
                        </button>
                        <button
                          type="button"
                          onClick={() => setEndCenturyEra('AD')}
                          className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer font-bold ${
                            endCenturyEra === 'AD'
                              ? 'liquid-glass-btn-active font-extrabold shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          ز
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={endCenturyInput}
                        onChange={(e) => {
                          setEndCenturyInput(e.target.value);
                          setYearError(null);
                        }}
                        placeholder="بۆ نموونە: 2 یان 12"
                        className="w-full liquid-glass-input text-white pr-3 pl-20 py-2 rounded-xl text-xs font-mono font-bold"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-400/80 pointer-events-none">
                        سەدەی {endCenturyEra === 'BC' ? 'پ.ز' : 'ز'}
                      </span>
                    </div>

                    {/* Presets */}
                    <div className="flex flex-wrap gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].slice(0, 10).map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setEndCenturyInput(n.toString())}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                            endCenturyInput === n.toString()
                              ? 'liquid-glass-btn-active text-black'
                              : 'bg-white/5 hover:bg-white/10 text-slate-300'
                          }`}
                        >
                          {toKurdishDigits(n)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Live Interactive Kurdish Year / Century Preview Badge */}
            {previewTimeSpan && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl liquid-glass-subtle text-xs border border-amber-400/30">
                <div className="space-y-0.5 min-w-0">
                  <div className="text-slate-300 text-xs flex items-center gap-1.5 font-bold">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>پێشبینینی ڕێکەوتی تۆمارکراو:</span>
                  </div>
                  {previewTimeSpan.subLabel && (
                    <p className="text-[11px] text-amber-200/85 truncate">
                      {previewTimeSpan.subLabel}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-extrabold text-amber-300 font-mono text-sm sm:text-base tracking-wider drop-shadow-sm">
                    {previewTimeSpan.label}
                  </span>
                  {previewTimeSpan.isCrossEra && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-bold liquid-glass-btn-active text-black">
                      پ.ز ⟷ ز
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: دەقی مێژوویی و بەڵگەنامەکان (Narrative & Archives) */}
          <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 transition-all space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg liquid-glass-btn flex items-center justify-center text-[11px] font-mono font-bold text-amber-300">
                  04
                </span>
                <span>پوختەی مێژوویی، شوێنەواری و بەڵگەنامەکان</span>
              </span>
              <span className="text-[11px] text-slate-400">دەق و سەرچاوەکان</span>
            </div>

            {/* Full historical overview text */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>پوختەی مێژوویی و شوێنەواری (دەقی سەرەکی)</span>
              </label>
              <textarea
                rows={3}
                value={fullText}
                onChange={(e) => setFullText(e.target.value)}
                placeholder="وەسفی مێژوویی ئەم دەسەڵاتە یان کەسایەتییە بنووسە: ڕووداوە گرنگەکان، نەبەردییەکان، ئاسەوارەکان و بەسەرهاتەکانی فەرمانڕەوایی..."
                className="w-full liquid-glass-input text-white px-3.5 py-2.5 rounded-xl leading-relaxed text-xs placeholder:text-slate-500"
              />
            </div>

            {/* Additional notes, manuscripts & references */}
            <div className="p-3.5 rounded-2xl liquid-glass-subtle space-y-2">
              <label className="block text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>زانیاریی زیاتر، دەستنووس، وتەی مێژوونووسان و سەرچاوەکان</span>
              </label>
              <textarea
                rows={3}
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="لێرە زانیارییە زیاترەکان، دەقی دەستنووس و وتەی مێژوونووسان، شوێنەوارە پارێزراوەکان و سەرچاوەی کتێبەکان تۆمار بکە..."
                className="w-full liquid-glass-input text-slate-200 placeholder:text-slate-500 px-3.5 py-2 rounded-xl text-xs leading-relaxed"
              />
            </div>
          </div>

          {/* SECTION 5: وێنەکان (تا ١٠ وێنەی ڕاستەقینە • وێنەی سەرەکی و ٩ وێنەی تر) */}
          <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 transition-all space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg liquid-glass-btn flex items-center justify-center text-[11px] font-mono font-bold text-amber-300">
                  05
                </span>
                <span>بەستەری وێنەکان (تا ١٠ وێنە • وێنەی سەرەکی و وێنە زیاترەکان)</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full liquid-glass-subtle text-amber-300 border border-amber-400/40">
                تا ١٠ وێنە • بەستەری ڕاستەوخۆ
              </span>
            </div>

            {/* وێنەی سەرەکی #١ (Image #1 - Primary) */}
            <div className="p-3.5 rounded-2xl liquid-glass-subtle border border-amber-400/25 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-amber-400 text-black font-extrabold text-[10px] font-heading shadow-xs">
                    وێنەی سەرەکی #١
                  </span>
                  <span className="text-xs font-bold text-white">
                    پێشاندانی سەر نەخشە و بەرگی سەرەکی بابەت
                  </span>
                </div>
                {imageUrl && (
                  <span className="text-[10px] text-amber-300 font-mono px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-400/20">
                    {linkInfo.label}
                  </span>
                )}
              </div>

              {/* URL Input #1 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span>بەستەری وێنەی سەرەکی (#١):</span>
                </label>
                <div className="relative flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => handleImageUrlChange(e.target.value)}
                      placeholder="لینکی وێنەی سەرەکی لێرە دابنێ (Wikipedia, ImgBB, Drive...)"
                      className="w-full liquid-glass-input text-white px-3.5 py-2 rounded-xl text-xs font-mono placeholder:text-slate-600 pl-9"
                      dir="ltr"
                    />
                    {imageUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setImageUrl('');
                          setImageLoadError(null);
                        }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                        title="سڕینەوەی بەستەر"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="shrink-0 px-3 py-2 rounded-xl liquid-glass-btn text-amber-300 hover:text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                    title="پەیستکردن لە کلیپبۆرد"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">پەیست</span>
                  </button>
                </div>
              </div>

              {/* Caption Input #1 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span>تێبینی و وەسف لەسەر وێنەی سەرەکی (#١):</span>
                </label>
                <input
                  type="text"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  placeholder="بۆ نموونە: نیگاری کەسایەتی، قەڵاکە لە سەدەی بیستەم، یاخود نەخشەی پایتەخت..."
                  className="w-full liquid-glass-input text-white px-3.5 py-2 rounded-xl text-xs placeholder:text-slate-500"
                />
              </div>

              {/* Preview of Image #1 */}
              {imageUrl && (
                <div className="relative rounded-xl overflow-hidden border border-amber-400/40 bg-black/90 flex flex-col items-center justify-center p-2 min-h-[140px]">
                  <img
                    src={imageUrl}
                    alt={imageCaption || name || 'Primary Image Preview'}
                    className="max-h-52 max-w-full w-auto h-auto object-contain mx-auto rounded-lg shadow-md"
                    onError={() =>
                      setImageLoadError(
                        'نەتوانرا وێنەکە لەم بەستەرە باربکرێت، تکایە دڵنیابە لە دروستی بەستەرەکە.'
                      )
                    }
                    onLoad={() => setImageLoadError(null)}
                  />
                  {imageCaption && (
                    <div className="w-full mt-2 p-1.5 px-2.5 rounded-lg liquid-glass-subtle text-amber-200 text-xs flex items-center gap-1.5">
                      <ImageIcon className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="font-medium text-right text-[11px] truncate">{imageCaption}</span>
                    </div>
                  )}
                </div>
              )}

              {imageLoadError && (
                <div className="p-2 rounded-xl bg-rose-950/70 border border-rose-500/60 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{imageLoadError}</span>
                </div>
              )}
            </div>

            {/* دوگمەی کردنەوەی بۆشایی ٩ لینکەکەی تر و ٩ بۆشایی تێبینییەکان */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowExtraImages(!showExtraImages)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                  showExtraImages
                    ? 'bg-amber-500/15 border-amber-400/60 shadow-[0_4px_20px_rgba(245,158,11,0.15)]'
                    : 'liquid-glass-subtle hover:border-amber-400/40 border-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                      filledExtraCount > 0
                        ? 'bg-amber-400 text-black font-extrabold shadow-sm'
                        : 'bg-white/10 text-amber-300 border border-amber-400/30'
                    }`}
                  >
                    +9
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-heading">
                        {showExtraImages
                          ? 'شاردنەوەی ٩ بۆشایی وێنەکەی تر'
                          : 'زیادکردنی وێنەی تر (کردنەوەی ٩ لینکی تر و ٩ تێبینی)'}
                      </span>
                      {filledExtraCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-400/25 text-amber-300 border border-amber-400/40 text-[10px] font-mono font-bold">
                          {toKurdishDigits(filledExtraCount)} لە ٩ وێنە پڕکراوەتەوە
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-white/5 text-slate-400 text-[10px]">
                          تا ٩ وێنەی زیاتر
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {showExtraImages
                        ? 'کلیک بکە بۆ داخستنی خانەکان'
                        : 'کلیک بکە بۆ نیشاندانی بۆشایی ٩ لینک و ٩ تێبینی بۆ ئەلبوومی وێنەکان'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs shrink-0">
                  <span className="hidden sm:inline">
                    {showExtraImages ? 'داخستن' : 'کردنەوە'}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-300 ${
                      showExtraImages ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>
            </div>

            {/* خانەکانی ٩ وێنەکەی تر و ٩ تێبینییەکەیان کاتێک دوگمەکە دادەگیرێت */}
            {showExtraImages && (
              <div className="space-y-3.5 pt-1 animate-fade-in">
                <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Images className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-bold text-[11px]">
                      ٩ بۆشایی وێنەی زیاتر و ٩ بۆشایی تێبینی (وێنەی #٢ تا #١٠)
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-300 font-mono">
                    کۆی گشتی بەردەست: ١٠ وێنە
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {extraImages.map((extra, idx) => {
                    const imgNumber = idx + 2;
                    const isFilled = extra.url.trim().length > 0;
                    return (
                      <div
                        key={idx}
                        className={`p-3 sm:p-3.5 rounded-2xl transition-all border ${
                          isFilled
                            ? 'bg-amber-950/20 border-amber-400/35 shadow-xs'
                            : 'liquid-glass-subtle border-white/[0.08]'
                        }`}
                      >
                        {/* Slot Header */}
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.08]">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                                isFilled
                                  ? 'bg-amber-400 text-black shadow-xs'
                                  : 'bg-white/10 text-slate-300'
                              }`}
                            >
                              وێنەی #{toKurdishDigits(imgNumber)}
                            </span>
                            <span className="text-[11px] font-medium text-slate-300">
                              {isFilled ? 'وێنەکە دیاریکراوە' : 'بۆشایی بەتاڵ'}
                            </span>
                          </div>

                          {isFilled && (
                            <button
                              type="button"
                              onClick={() => handleClearExtraImage(idx)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-lg liquid-glass-btn text-rose-300 hover:text-rose-200 text-[10px] cursor-pointer"
                              title="سڕینەوەی ئەم وێنەیە"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>سڕینەوە</span>
                            </button>
                          )}
                        </div>

                        {/* Fields: URL + Caption */}
                        <div className="space-y-2.5">
                          {/* 1. بۆشایی لینکی وێنە */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-300 mb-1 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <LinkIcon className="w-3 h-3 text-amber-400" />
                                <span>بۆشایی لینکی وێنەی #{toKurdishDigits(imgNumber)}:</span>
                              </span>
                            </label>
                            <div className="relative flex items-center gap-1.5">
                              <input
                                type="url"
                                value={extra.url}
                                onChange={(e) => handleExtraImageChange(idx, 'url', e.target.value)}
                                placeholder={`لینکی وێنەی #${toKurdishDigits(imgNumber)} (Wikipedia, ImgBB, Drive...)`}
                                className="w-full liquid-glass-input text-white px-3 py-1.5 rounded-xl text-xs font-mono placeholder:text-slate-600"
                                dir="ltr"
                              />
                              <button
                                type="button"
                                onClick={() => handlePasteExtraClipboard(idx)}
                                className="shrink-0 px-2.5 py-1.5 rounded-xl liquid-glass-btn text-amber-300 hover:text-white text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                title="پەیستکردن لە کلیپبۆرد"
                              >
                                <Copy className="w-3 h-3" />
                                <span className="hidden sm:inline">پەیست</span>
                              </button>
                            </div>
                          </div>

                          {/* 2. بۆشایی تێبینی لەسەر وێنە */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                              <FileText className="w-3 h-3 text-amber-400" />
                              <span>بۆشایی تێبینی لەسەر وێنەی #{toKurdishDigits(imgNumber)}:</span>
                            </label>
                            <input
                              type="text"
                              value={extra.caption}
                              onChange={(e) => handleExtraImageChange(idx, 'caption', e.target.value)}
                              placeholder={`تێبینی، شوێن یان وەسفی وێنەی #${toKurdishDigits(imgNumber)}...`}
                              className="w-full liquid-glass-input text-white px-3 py-1.5 rounded-xl text-xs placeholder:text-slate-500"
                            />
                          </div>

                          {/* Thumbnail preview if URL is set */}
                          {isFilled && (
                            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-black/60 border border-white/10 mt-1">
                              <img
                                src={extra.url}
                                alt={extra.caption || `وێنەی #${imgNumber}`}
                                className="w-12 h-12 object-cover rounded-lg border border-amber-400/40 shrink-0"
                                loading="lazy"
                              />
                              <div className="min-w-0 flex-1 text-right">
                                <p className="text-[11px] font-bold text-amber-300 truncate">
                                  {extra.caption || `وێنەی #${toKurdishDigits(imgNumber)}`}
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono truncate" dir="ltr">
                                  {extra.url}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 6: بەستنەوە بە دەسەڵات، میرنشین و بابەتە پەیوەندیدارەکان (Linking & Associations) */}
          <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 transition-all space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg liquid-glass-btn flex items-center justify-center text-[11px] font-mono font-bold text-amber-300">
                  06
                </span>
                <span>بەستنەوە بە دەسەڵات، میرنشین و بابەتە پەیوەندیدارەکان</span>
              </span>
              <span className="text-[11px] text-amber-300/80">میرنشین، میر، زانا، قەڵا، جەنگ</span>
            </div>


            {/* Parent Entity Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-amber-400" />
                <span>دەسەڵات یان میرنشینی سەرەکی (Parent Entity)</span>
              </label>
              <select
                value={parentFactId || ''}
                onChange={(e) =>
                  setParentFactId(e.target.value ? Number(e.target.value) : undefined)
                }
                className="w-full liquid-glass-input text-slate-100 p-2.5 rounded-xl text-xs cursor-pointer focus:outline-none"
              >
                <option value="" className="bg-slate-900 text-slate-300">
                  -- بەبێ دەسەڵاتی دایک (سەربەخۆ یان خۆی دەسەڵاتی سەرەکییە) --
                </option>
                {allFacts
                  .filter((f) => {
                    const c = getCategoryInfo(f).id;
                    return (
                      (c === 'principality' || c === 'empire' || c === 'civilization') &&
                      (!factToEdit || f.id !== factToEdit.id)
                    );
                  })
                  .map((ent) => (
                    <option key={ent.id} value={ent.id} className="bg-slate-900 text-slate-100">
                      {ent.name} ({ent.desc})
                    </option>
                  ))}
              </select>
            </div>

            {/* Linked Facts Selector / Chips */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>بابەت و کەسایەتییە بەستراوەکان ({relatedFactIds.length})</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsLinkingModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg liquid-glass-btn text-amber-300 hover:text-white text-[11px] font-bold cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-amber-400" />
                  <span>دیاریکردن و گەڕان بۆ بەستنەوە</span>
                </button>
              </div>

              {relatedFactIds.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl liquid-glass-subtle">
                  {relatedFactIds.map((rfId) => {
                    const found = allFacts.find((f) => f.id === rfId);
                    if (!found) return null;
                    const cat = getCategoryInfo(found);
                    return (
                      <span
                        key={rfId}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border"
                        style={{
                          backgroundColor: `${cat.color}15`,
                          borderColor: `${cat.color}40`,
                          color: '#fff',
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span>{found.name}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setRelatedFactIds((prev) => prev.filter((id) => id !== rfId))
                          }
                          className="p-0.5 rounded-md hover:bg-white/20 text-slate-400 hover:text-white cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              ) : (
                <div className="py-2.5 px-3 rounded-xl liquid-glass-subtle text-slate-400 text-xs">
                  هێشتا هیچ بابەتی تر نەبەستراوەتەوە. کلیک لە دوگمەی سەرەوە بکە بۆ بەستنەوە.
                </div>
              )}
            </div>
          </div>
        </>
      )}

          {/* Action Buttons Bar */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10 shrink-0">
            {/* Delete button (when editing) */}
            {factToEdit && onDelete && (
              <div>
                {confirmDelete ? (
                  <div className="flex items-center gap-1.5 animate-fade-in">
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(factToEdit.id);
                        onClose();
                      }}
                      className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>دڵنیام، بیسڕەوە</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-3 py-2 rounded-xl liquid-glass-btn text-slate-300 hover:text-white text-xs cursor-pointer"
                    >
                      پەشیمانبوونەوە
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="p-2.5 rounded-xl text-red-400 hover:text-white hover:bg-red-950/70 border border-red-900/40 hover:border-red-700 transition-colors cursor-pointer"
                    title="سڕینەوەی ئەم بابەتە"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Cancel & Save Buttons */}
            <div className="flex items-center gap-2.5 mr-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl liquid-glass-btn text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
              >
                داخستن
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl liquid-glass-btn-active text-black font-extrabold text-xs shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all cursor-pointer active:scale-95"
              >
                {formMode === 'photo_only' ? (
                  <>
                    <ImageIcon className="w-4 h-4 text-black" />
                    <span>تۆمارکردن و دانانی وێنە لەسەر نەخشە</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-black" />
                    <span>پاشەکەوتکردنی زانیارییەکان</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Fact Relations Linker Modal */}
      {isLinkingModalOpen && (
        <FactRelationsModal
          isOpen={isLinkingModalOpen}
          onClose={() => setIsLinkingModalOpen(false)}
          currentFact={
            factToEdit || {
              id: 999999999,
              num: 0,
              eraId: 1,
              eraName: '',
              eraPeriod: '',
              name: name.trim() || 'بابەتی نوێ',
              desc: desc.trim() || '',
              fullText: fullText.trim() || '',
              lat: Number(lat) || 36.8,
              lng: Number(lng) || 44.5,
              tag: selectedCategory,
              relatedFactIds,
              parentFactId,
            }
          }
          allFacts={allFacts}
          onSaveLinks={async (_sourceId, targetIds, newParentId) => {
            setRelatedFactIds(targetIds);
            if (typeof newParentId === 'number' || newParentId === undefined) {
              setParentFactId(newParentId);
            }
          }}
        />
      )}
    </div>
  );
};
