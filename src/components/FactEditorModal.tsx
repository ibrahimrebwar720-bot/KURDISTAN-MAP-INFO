import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FactItem } from '../data/kurdishHistoryData';
import {
  CollectionItem,
  CategoryId,
  getUnifiedCategories,
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
  Globe,
  Copy,
  Images,
  Languages,
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
  formatDigits,
  centuryToYearSpan,
  centuryRangeToYearSpan,
  formatKurdishCentury,
  formatKurdishCenturyRange,
} from '../utils/yearUtils';
import {
  searchPlacesOnMap,
  PlaceSearchResult,
  loadGoogleMapsScript,
  reverseGeocodeProvinceWithGoogle,
} from '../services/googleMapsSearchService';
import {
  KURDISTAN_PROVINCES,
  matchFactToProvince,
} from '../data/kurdishProvincesData';
import { useLanguage } from '../context/LanguageContext';
import { translateFactToEnglishDetailed } from '../services/aiTranslationService';
import { findDuplicateNotesOwnerForFact } from '../utils/factConsistency';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  factToEdit?: FactItem | null;
  initialMode?: 'photo_only' | 'standard';
  collections: CollectionItem[];
  allFacts?: FactItem[];
  onSave: (fact: FactItem, options?: { isEdit?: boolean; skipCrossLangPrompt?: boolean }) => void;
  onDelete?: (factId: number) => void;
  onStartPickLocation: () => void;
  pickedCoords?: { lat: number; lng: number } | null;
  totalFactsCount: number;
  translatedFactIds?: Set<number>;
}

export const FactEditorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  factToEdit,
  initialMode = 'photo_only',
  collections: _collections,
  allFacts = [],
  onSave,
  onDelete,
  onStartPickLocation,
  pickedCoords,
  totalFactsCount,
  translatedFactIds,
}) => {
  const { language, isEn, dir } = useLanguage();
  const editableCategories = useMemo(
    () => getUnifiedCategories(language).filter((c) => c.id !== 'all'),
    [language]
  );

  const [formMode, setFormMode] = useState<'photo_only' | 'standard'>('photo_only');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [fullText, setFullText] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [lat, setLat] = useState<number>(36.8);
  const [lng, setLng] = useState<number>(44.5);
  const [showManualCoords, setShowManualCoords] = useState(false);
  const [provinceId, setProvinceId] = useState<string>('');
  const [regionName, setRegionName] = useState<string>('');
  const [googleAdminSummary, setGoogleAdminSummary] = useState<string>('');
  const [isResolvingProvince, setIsResolvingProvince] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('principality');
  const [isSavingAndTranslating, setIsSavingAndTranslating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const duplicateNotesOwner = useMemo(() => {
    if (!isOpen || !additionalNotes.trim() || !allFacts.length) return null;
    return findDuplicateNotesOwnerForFact(
      factToEdit || { id: 0, name },
      additionalNotes,
      allFacts
    );
  }, [isOpen, factToEdit, name, additionalNotes, allFacts]);

  // Hierarchy & Topic Linking state
  const [parentFactId, setParentFactId] = useState<number | undefined>(undefined);
  const [relatedFactIds, setRelatedFactIds] = useState<number[]>([]);
  const [allyFactIds, setAllyFactIds] = useState<number[]>([]);
  const [isLinkingModalOpen, setIsLinkingModalOpen] = useState(false);

  // Fast memoized lookups for parent and related entities
  const availableParentFacts = useMemo(() => {
    return allFacts
      .filter((f) => {
        const c = getCategoryInfo(f, language).id;
        return (
          (c === 'principality' || c === 'empire' || c === 'civilization') &&
          (!factToEdit || f.id !== factToEdit.id)
        );
      })
      .map((ent) => ({
        id: ent.id,
        name: ent.name,
        desc: ent.desc,
      }));
  }, [allFacts, factToEdit, language]);

  const factsByIdMap = useMemo(() => {
    const map = new Map<number, FactItem>();
    for (const f of allFacts) {
      map.set(f.id, f);
    }
    return map;
  }, [allFacts]);

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

  const linkInfo = useMemo(() => getLinkTypeInfo(imageUrl, language), [imageUrl, language]);

  const handleImageUrlChange = (rawUrl: string) => {
    const trimmed = rawUrl.trim();
    if (trimmed.startsWith('data:')) {
      setImageLoadError(
        isEn
          ? 'Direct file uploads are disabled to protect speed and storage. Please paste a web image URL instead.'
          : 'بارکردنی فایلی وێنە ناچالاک کراوە بۆ پاراستنی خێرایی و کەمکردنەوەی قەبارەی بەرنامە. تکایە تەنها لینکی وێنە دابنێ.'
      );
      return;
    }
    setImageLoadError(null);
    const resolved = resolveImageUrl(trimmed);
    setImageUrl(resolved);
    if (resolved && !imageCaption.trim() && name.trim()) {
      setImageCaption(
        isEn ? `Archival image for "${name.trim()}"` : `وێنەی تایبەت بە «${name.trim()}»`
      );
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
          setImageLoadError(
            isEn
              ? 'Direct file uploads are disabled. Please paste an image URL.'
              : 'بارکردنی فایلی وێنە ناچالاک کراوە. تکایە تەنها لینکی وێنە دابنێ.'
          );
          return prev;
        }
        const resolved = resolveImageUrl(trimmed);
        const currentCaption = next[index]?.caption || '';
        next[index] = {
          url: resolved,
          caption: currentCaption.trim()
            ? currentCaption
            : name.trim()
            ? isEn
              ? `Photo #${index + 2} for "${name.trim()}"`
              : `وێنەی #${index + 2} ی «${name.trim()}»`
            : '',
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
          factToEdit.tag === 'Historical Photo' ||
          (!!factToEdit.imageUrl && !factToEdit.additionalNotes && factToEdit.category === 'monument');
        setFormMode(isPhotoItem ? 'photo_only' : 'standard');
        setName(factToEdit.name);
        setDesc(factToEdit.desc);
        setSelectedPlaceName(factToEdit.desc || null);
        setFullText(factToEdit.fullText);
        setAdditionalNotes(factToEdit.additionalNotes || '');
        setImageUrl(factToEdit.imageUrl || '');
        setImageCaption(factToEdit.imageCaption || '');

        // Populate the 9 extra image slots from factToEdit.images (items beyond Image #1)
        const initialExtras = Array.from({ length: 9 }, () => ({ url: '', caption: '' }));
        let hasExistingExtras = false;
        if (Array.isArray(factToEdit.images) && factToEdit.images.length > 0) {
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
        const existingProv = matchFactToProvince(factToEdit, language);
        setProvinceId(factToEdit.provinceId || existingProv?.id || '');
        setRegionName(factToEdit.region || existingProv?.name || '');
        setGoogleAdminSummary('');
        // Unified Category
        const catInfo = getCategoryInfo(factToEdit, language);
        setSelectedCategory(catInfo.id);

        // Topic Hierarchy & Relations
        setParentFactId(factToEdit.parentFactId);
        setRelatedFactIds(Array.isArray(factToEdit.relatedFactIds) ? factToEdit.relatedFactIds : []);
        setAllyFactIds(Array.isArray(factToEdit.allyFactIds) ? factToEdit.allyFactIds : []);

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
          const lowerRaw = rawYearText.toLowerCase();
          const hasCenturyWord =
            rawYearText.includes('سەدە') ||
            rawYearText.includes('سەدەی') ||
            lowerRaw.includes('century');
          const isCenturyRange =
            hasCenturyWord &&
            (rawYearText.includes('-') ||
              rawYearText.includes('–') ||
              rawYearText.includes('تا') ||
              rawYearText.includes('—') ||
              /\bto\b/i.test(rawYearText));

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
            const isBC =
              factToEdit.isBC ||
              rawYearText.includes('پ.ز') ||
              rawYearText.includes('پێش') ||
              /\bbce?\b/i.test(rawYearText);
            setStartCenturyEra(isBC ? 'BC' : 'AD');
            setEndCenturyEra(isBC ? 'BC' : 'AD');
          } else if (hasCenturyWord || (!factToEdit.startYear && factToEdit.century)) {
            setTimeMode('single_century');
            const numMatch = rawYearText.match(/\d+/);
            setStartCenturyInput(numMatch ? numMatch[0] : (factToEdit.centuryNumber ? Math.abs(factToEdit.centuryNumber).toString() : '1'));
            const isBC =
              factToEdit.isBC ||
              (factToEdit.centuryNumber ? factToEdit.centuryNumber < 0 : false) ||
              rawYearText.includes('پ.ز') ||
              rawYearText.includes('پێش') ||
              /\bbce?\b/i.test(rawYearText);
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
            const span = getFactYearSpan(factToEdit, language);
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
          setProvinceId('');
          setRegionName('');
        }
        setGoogleAdminSummary('');
        setSelectedCategory('principality');
        setParentFactId(undefined);
        setRelatedFactIds([]);
        setAllyFactIds([]);
        setImageUrl('');
        setImageCaption('');
        setExtraImages(Array.from({ length: 9 }, () => ({ url: '', caption: '' })));
        setShowExtraImages(false);
        setFormMode(initialMode);
      }
      setYearError(null);
      setConfirmDelete(false);
      setAiError(null);
    } else {
      setName('');
      setDesc('');
      setFullText('');
      setAdditionalNotes('');
      setImageUrl('');
      setImageCaption('');
      setExtraImages(Array.from({ length: 9 }, () => ({ url: '', caption: '' })));
      setShowExtraImages(false);
      setYearError(null);
      setConfirmDelete(false);
      setAiError(null);
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

  const resolveProvinceFromCoords = async (targetLat: number, targetLng: number, skipCache = false) => {
    if (!Number.isFinite(targetLat) || !Number.isFinite(targetLng)) return;
    setIsResolvingProvince(true);
    try {
      const res = await reverseGeocodeProvinceWithGoogle(targetLat, targetLng, { skipCache });
      setProvinceId(res.provinceId);
      const matchedProv = KURDISTAN_PROVINCES.find((p) => p.id === res.provinceId);
      const localizedProvName = isEn
        ? matchedProv?.nameEn ||
          (res.provinceName === 'دەرەوەی هێڵی کوردستان' ? 'Outside Kurdistan' : res.provinceName)
        : matchedProv?.name || res.provinceName;
      setRegionName(localizedProvName);
      const adminParts = [res.adminLevel2, res.adminLevel1, res.countryCode].filter(Boolean);
      setGoogleAdminSummary(
        adminParts.length > 0
          ? `${
              res.source === 'google'
                ? isEn
                  ? 'Google'
                  : 'گۆگڵ'
                : isEn
                ? 'Map'
                : 'نەخشە'
            }: ${adminParts.join(' • ')}`
          : ''
      );
    } catch {
      // keep fallback
    } finally {
      setIsResolvingProvince(false);
    }
  };

  const handleSelectSearchedPlace = (place: PlaceSearchResult) => {
    setLat(place.lat);
    setLng(place.lng);
    setHasLocationPicked(true);
    setSelectedPlaceName(place.name);
    if (!desc.trim()) {
      setDesc(place.formattedAddress.split(',').slice(0, 2).join(isEn ? ', ' : '، '));
    }
    if (place.provinceId) {
      setProvinceId(place.provinceId);
      const matchedProv = KURDISTAN_PROVINCES.find((p) => p.id === place.provinceId);
      const localizedProvName = isEn
        ? matchedProv?.nameEn ||
          (place.provinceName === 'دەرەوەی هێڵی کوردستان' ? 'Outside Kurdistan' : place.provinceName || '')
        : matchedProv?.name || place.provinceName || '';
      setRegionName(localizedProvName);
      const adminParts = [place.adminLevel2, place.adminLevel1, place.countryCode].filter(Boolean);
      setGoogleAdminSummary(
        adminParts.length > 0
          ? `${
              place.source === 'google'
                ? isEn
                  ? 'Google'
                  : 'گۆگڵ'
                : isEn
                ? 'Map'
                : 'نەخشە'
            }: ${adminParts.join(' • ')}`
          : ''
      );
    } else {
      resolveProvinceFromCoords(place.lat, place.lng);
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
      resolveProvinceFromCoords(pickedCoords.lat, pickedCoords.lng);
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
        label: formatKurdishYear(actualYear, language),
        subLabel: isEn
          ? `Year ${Math.abs(actualYear)} (${startEra === 'BC' ? 'BCE' : 'CE'}) on timeline`
          : `ساڵی ${formatDigits(Math.abs(actualYear), language)} (${startEra === 'BC' ? 'پێش زایین' : 'زایینی'}) لەسەر تایملاین`,
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
        label: formatKurdishYearRange(finalStart, finalEnd, language),
        subLabel: isEn
          ? `${finalEnd - finalStart}-year span (${formatKurdishYear(finalStart, language)} to ${formatKurdishYear(finalEnd, language)})`
          : `ماوەی ${formatDigits(finalEnd - finalStart, language)} ساڵ (لەسەر تایملاین لە ${formatKurdishYear(finalStart, language)} تا ${formatKurdishYear(finalEnd, language)})`,
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
        label: formatKurdishCentury(c, isBC, true, language),
        subLabel: isEn
          ? `Corresponds to ${formatKurdishYear(span.startYear, language)} – ${formatKurdishYear(span.endYear, language)} on timeline`
          : `هاوتایە لەگەڵ ساڵانی (${formatKurdishYear(span.startYear, language)} تا ${formatKurdishYear(span.endYear, language)}) لەسەر تایملاین`,
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
        label: formatKurdishCenturyRange(c1, startBC, validC2, endBC, true, language),
        subLabel: isEn
          ? `Corresponds to ${formatKurdishYear(span.startYear, language)} – ${formatKurdishYear(span.endYear, language)} on timeline`
          : `هاوتایە لەگەڵ ساڵانی (${formatKurdishYear(span.startYear, language)} تا ${formatKurdishYear(span.endYear, language)}) لەسەر تایملاین`,
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
    language,
    isEn,
  ]);

  if (!isOpen) return null;

  const buildFactItemFromForm = (): FactItem | null => {
    setAiError(null);
    if (formMode === 'photo_only') {
      if (!imageUrl.trim()) {
        setImageLoadError(
          isEn ? 'Please enter or paste an image URL here.' : 'تکایە لینکی وێنەکە لێرە بنووسە یان پەیستی بکە.'
        );
        return null;
      }
      const normStart = normalizeYearString(startYearInput.trim());
      const startNum = normStart ? parseInt(normStart, 10) : NaN;
      if (isNaN(startNum)) {
        setYearError(isEn ? 'Please enter a valid year for the photograph.' : 'تکایە ساڵی وێنەکە بە درووستی بنووسە.');
        return null;
      }
      const actualYear = startEra === 'BC' ? -Math.abs(startNum) : Math.abs(startNum);
      const formattedYear = formatKurdishYear(actualYear, language);
      const centuryNum = actualYear < 0 ? -Math.ceil(Math.abs(actualYear) / 100) : Math.ceil(actualYear / 100);
      const centuryLabel = formatKurdishCentury(Math.abs(centuryNum), actualYear < 0, true, language);

      let eraId = 4;
      let eraName = isEn ? 'Medieval Dynasties & Emirates' : 'میرنشین و دەسەڵاتە ئیسلامییەکان';
      if (actualYear < -800) {
        eraId = 1;
        eraName = isEn ? 'Ancient Pre-Median Polities & Peoples' : 'دەسەڵات و گەلە دێرینەکانی پێش ماد';
      } else if (actualYear < -500) {
        eraId = 2;
        eraName = isEn ? 'The Median Empire & Classical Antiquity' : 'ئیمپراتۆریەتی ماد و سەردەمی کۆن';
      } else if (actualYear < 650) {
        eraId = 3;
        eraName = isEn
          ? 'Post-Median Kingdoms to Early Islam'
          : actualYear < 0
          ? 'سەردەمی پێش و دوای زایین'
          : 'سەردەمی کلاسیک و کۆن';
      } else if (actualYear < 1918) {
        eraId = 4;
        eraName = isEn ? 'Medieval Dynasties & Emirates' : 'میرنشین و دەسەڵاتە ئیسلامییەکان';
      } else {
        eraId = 5;
        eraName = isEn ? 'Modern & Contemporary Era' : 'سەردەمی هاوچەرخ';
      }

      const resolvedPrimary = resolveImageUrl(imageUrl.trim());
      const finalTitle =
        name.trim() ||
        selectedPlaceName ||
        (imageCaption.trim()
          ? imageCaption.trim().slice(0, 45)
          : fullText.trim()
          ? fullText.trim().slice(0, 45)
          : isEn
          ? 'Historical Photograph'
          : 'وێنەی مێژوویی');
      const finalCaption = imageCaption.trim() || fullText.trim() || finalTitle;
      const finalDesc = selectedPlaceName || desc.trim() || (isEn ? 'Kurdistan' : 'کوردستان');
      const finalFullText = fullText.trim() || finalCaption;

      return {
        id: factToEdit ? factToEdit.id : Date.now(),
        num: factToEdit ? factToEdit.num : totalFactsCount + 1,
        eraId: factToEdit ? factToEdit.eraId : eraId,
        eraName: factToEdit ? factToEdit.eraName : eraName,
        eraPeriod: factToEdit ? factToEdit.eraPeriod : isEn ? 'History of Kurdistan' : 'مێژووی کوردستان',
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
        region: regionName.trim() || undefined,
        provinceId: provinceId.trim() || undefined,
        tag: isEn ? 'Historical Photo' : 'وێنەی مێژوویی',
        collectionId: 'monument',
        category: 'monument',
        imageUrl: resolvedPrimary,
        imageCaption: finalCaption,
        images: [{ url: resolvedPrimary, caption: finalCaption }],
        isCustom: true,
      };
    }

    if (!name.trim()) return null;

    let finalStart = 0;
    let finalEnd = 0;
    let formattedYear = '';
    let centuryLabel = '';
    let centuryNum = 1;

    if (timeMode === 'single_year') {
      const normStart = normalizeYearString(startYearInput.trim());
      const startNum = normStart ? parseInt(normStart, 10) : NaN;
      if (isNaN(startNum)) {
        setYearError(isEn ? 'Please enter a valid year.' : 'تکایە ساڵەکە بە درووستی بنووسە.');
        return null;
      }
      const actualYear = startEra === 'BC' ? -Math.abs(startNum) : Math.abs(startNum);
      finalStart = actualYear;
      finalEnd = isPerson ? Math.min(2026, actualYear + 75) : actualYear;
      formattedYear = formatKurdishYear(actualYear, language);
      centuryNum = actualYear < 0 ? -Math.ceil(Math.abs(actualYear) / 100) : Math.ceil(actualYear / 100);
      centuryLabel = formatKurdishCentury(Math.abs(centuryNum), actualYear < 0, true, language);
    } else if (timeMode === 'year_range') {
      const normStart = normalizeYearString(startYearInput.trim());
      const normEnd = normalizeYearString(endYearInput.trim());
      const startNum = normStart ? parseInt(normStart, 10) : NaN;
      const endNum = normEnd ? parseInt(normEnd, 10) : NaN;

      if (isNaN(startNum)) {
        setYearError(
          isPerson
            ? isEn
              ? 'Please enter birth year.'
              : 'تکایە ساڵی لەدایکبوون بنووسە.'
            : isEn
            ? 'Please enter start year.'
            : 'تکایە ساڵی دەستپێک بنووسە.'
        );
        return null;
      }

      const actualStart = startEra === 'BC' ? -Math.abs(startNum) : Math.abs(startNum);
      const actualEnd = !isNaN(endNum)
        ? (endEra === 'BC' ? -Math.abs(endNum) : Math.abs(endNum))
        : actualStart;

      finalStart = Math.min(actualStart, actualEnd);
      finalEnd = Math.max(actualStart, actualEnd);
      formattedYear = formatKurdishYearRange(finalStart, finalEnd, language);
      centuryNum = finalStart < 0 ? -Math.ceil(Math.abs(finalStart) / 100) : Math.ceil(finalStart / 100);
      centuryLabel = formatKurdishCentury(Math.abs(centuryNum), finalStart < 0, true, language);
    } else if (timeMode === 'single_century') {
      const normC = normalizeYearString(startCenturyInput.trim());
      const c = normC ? parseInt(normC, 10) : NaN;
      if (isNaN(c) || c < 1) {
        setYearError(
          isEn
            ? 'Please enter a valid century number (e.g. 4 or 12).'
            : 'تکایە ژمارەی سەدەکە بە درووستی بنووسە (بۆ نموونە: ٤ یان ١٢).'
        );
        return null;
      }
      const isBC = startCenturyEra === 'BC';
      const span = centuryToYearSpan(c, isBC);
      finalStart = span.startYear;
      finalEnd = span.endYear;
      formattedYear = formatKurdishCentury(c, isBC, false, language);
      centuryLabel = formatKurdishCentury(c, isBC, true, language);
      centuryNum = isBC ? -c : c;
    } else if (timeMode === 'century_range') {
      const normC1 = normalizeYearString(startCenturyInput.trim());
      const normC2 = normalizeYearString(endCenturyInput.trim());
      const c1 = normC1 ? parseInt(normC1, 10) : NaN;
      const c2 = normC2 ? parseInt(normC2, 10) : NaN;

      if (isNaN(c1) || c1 < 1) {
        setYearError(isEn ? 'Please enter the start century.' : 'تکایە سەدەی دەستپێک دیاری بکە.');
        return null;
      }
      const validC2 = isNaN(c2) || c2 < 1 ? c1 : c2;
      const startBC = startCenturyEra === 'BC';
      const endBC = endCenturyEra === 'BC';
      const span = centuryRangeToYearSpan(c1, startBC, validC2, endBC);
      finalStart = span.startYear;
      finalEnd = span.endYear;
      formattedYear = formatKurdishCenturyRange(c1, startBC, validC2, endBC, false, language);
      centuryLabel = formatKurdishCenturyRange(c1, startBC, validC2, endBC, true, language);
      centuryNum = span.startYear < 0 ? -c1 : c1;
    }

    // Dynamic era assignment for new custom items
    let eraId = factToEdit ? factToEdit.eraId : 4;
    let eraName = factToEdit
      ? factToEdit.eraName
      : isEn
      ? 'Historical Polities'
      : 'دەسەڵاتە مێژووییەکان';
    if (!factToEdit) {
      if (finalStart < -800) {
        eraId = 1;
        eraName = isEn ? 'Ancient Pre-Median Polities & Peoples' : 'دەسەڵات و گەلە دێرینەکانی پێش ماد';
      } else if (finalStart < -500) {
        eraId = 2;
        eraName = isEn ? 'The Median Empire & Classical Antiquity' : 'ئیمپراتۆریەتی ماد و سەردەمی کۆن';
      } else if (finalStart < 650) {
        eraId = 3;
        eraName = isEn
          ? 'Post-Median Kingdoms to Early Islam'
          : finalStart < 0 && finalEnd > 0
          ? 'سەردەمی پێش و دوای زایین'
          : 'سەردەمی کلاسیک و کۆن';
      } else if (finalStart < 1918) {
        eraId = 4;
        eraName = isEn ? 'Medieval Dynasties, Atabegs & Emirates' : 'میرنشین و دەسەڵاتە ئیسلامییەکان';
      } else {
        eraId = 5;
        eraName = isEn ? 'Modern & Contemporary Era' : 'سەردەمی هاوچەرخ';
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

    return {
      id: factToEdit ? factToEdit.id : Date.now(),
      num: factToEdit ? factToEdit.num : totalFactsCount + 1,
      eraId: eraId,
      eraName: eraName,
      eraPeriod: factToEdit ? factToEdit.eraPeriod : isEn ? 'History of Kurdistan' : 'مێژووی کوردستان',
      name: name.trim(),
      desc: desc.trim() || (isEn ? 'Kurdistan' : 'کوردستان'),
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
      region: regionName.trim() || undefined,
      provinceId: provinceId.trim() || undefined,
      tag: selectedCategory,
      collectionId: selectedCategory,
      category: selectedCategory,
      imageUrl: finalPrimaryImage ? finalPrimaryImage.url : undefined,
      imageCaption: finalPrimaryImage ? finalPrimaryImage.caption : undefined,
      images: finalImagesArray.length > 0 ? finalImagesArray : undefined,
      parentFactId: typeof parentFactId === 'number' ? parentFactId : undefined,
      relatedFactIds: relatedFactIds.length > 0 ? relatedFactIds : undefined,
      allyFactIds: allyFactIds.length > 0 ? allyFactIds : undefined,
      isCustom: true,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const item = buildFactItemFromForm();
    if (!item) return;
    onSave(item, { isEdit: Boolean(factToEdit) });
    onClose();
  };

  const handleSaveAndTranslateAi = async () => {
    const item = buildFactItemFromForm();
    if (!item || isSavingAndTranslating) return;
    setIsSavingAndTranslating(true);
    setAiError(null);
    try {
      onSave(item, { isEdit: Boolean(factToEdit), skipCrossLangPrompt: true });
      await translateFactToEnglishDetailed(item);
      onClose();
    } catch (err) {
      setAiError(
        err instanceof Error
          ? err.message
          : isEn
          ? 'AI translation failed'
          : 'وەرگێڕانی AI سەرکەوتوو نەبوو'
      );
    } finally {
      setIsSavingAndTranslating(false);
    }
  };

  return (
    <div
      dir={dir}
      className="fixed inset-0 z-[1250] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xs animate-fade-in text-start fast-glass-modal"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl glass-dock-2026 rounded-3xl p-6 sm:p-8 shadow-[0_30px_90px_rgba(0,0,0,0.95)] max-h-[92vh] flex flex-col text-slate-100 overflow-hidden animate-spatial-spring will-change-transform"
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
                    ? formMode === 'photo_only'
                      ? isEn
                        ? 'Edit Historical Photograph'
                        : 'دەستکاریکردنی وێنەی مێژوویی'
                      : isEn
                      ? 'Edit Historical Entry'
                      : 'دەستکاریکردنی دەسەڵات و بابەت'
                    : formMode === 'photo_only'
                    ? isEn
                      ? 'Quick Historical Photo Form'
                      : 'فۆڕمی تایبەتی وێنەی مێژوویی'
                    : isEn
                    ? 'Add New Historical Entry'
                    : 'زیادکردنی بابەت و شوێنی نوێ'}
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {formMode === 'photo_only'
                  ? isEn
                    ? 'Pin an archival photograph to the map with 4 quick fields: Image URL, Year, Location, and Caption'
                    : 'دانانی وێنەی مێژوویی لەسەر نەخشە تەنها بە ٤ خانە: لینکی وێنە، ساڵ، شوێن، و زانیاری وێنە'
                  : factToEdit
                  ? isEn
                    ? `Editing details for "${factToEdit.name}" on the map and archive`
                    : `دەستکاریکردنی زانیارییەکانی «${factToEdit.name}» لەسەر نەخشە و ئەرشیف`
                  : isEn
                  ? 'Record a new polity, ruler, fortress, battle, or site with full details'
                  : 'تۆمارکردنی دەسەڵات، کەسایەتی، قەڵا یان ڕووداوێکی نوێ بە وردەکاریی تەواو'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center liquid-glass-btn text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={isEn ? 'Close' : 'داخستن'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Mode Selector */}
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
            <span>
              {isEn ? 'Historical Photo Mode (4 Fields)' : 'فۆڕمی وێنەی مێژوویی (تەنها ٤ خانەکە)'}
            </span>
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
            <span>{isEn ? 'Full Entry Mode' : 'فۆڕمی گشتی (تەواوی بابەت)'}</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto pe-1 space-y-4 text-xs flex-1 custom-scrollbar">
          {formMode === 'photo_only' ? (
            <div className="space-y-4 animate-fade-in">
              {/* Guidance Banner */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/20 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-400 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-start">
                  <h4 className="text-xs font-bold text-amber-300">
                    {isEn ? 'Quick Historical Photograph Form' : 'فۆڕمی خێرا و سەربەخۆی وێنەی مێژوویی'}
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                    {isEn
                      ? 'Fill in these 4 fields to display an archival photograph immediately on the map and photo strip.'
                      : 'تەنها بە پڕکردنەوەی ئەم ٤ خانەیە، وێنە مێژووییەکە لەسەر نەخشەی وێنەیی و شریتەکەی خوارەوە بە خێرایی پیشان دەدرێت.'}
                  </p>
                </div>
              </div>

              {/* 1. Image Link / URL */}
              <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg liquid-glass-btn flex items-center justify-center text-[11px] font-mono font-bold text-amber-300">
                      01
                    </span>
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span>{isEn ? 'Photo URL (Historical Image Link)' : 'لینکی وێنە (بەستەری وێنەی مێژوویی)'}</span>
                  </span>
                  <span className="text-[11px] text-slate-400">{isEn ? 'Primary URL' : 'بەستەری سەرەکی'}</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    {isEn ? 'Image URL' : 'بەستەری وێنە (Image URL)'} <span className="text-amber-400">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <LinkIcon className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => handleImageUrlChange(e.target.value)}
                        placeholder={
                          isEn
                            ? 'https://... Paste direct image link here'
                            : 'https://... لینکی ڕاستەوخۆی وێنە لێرە دابنێ'
                        }
                        dir="ltr"
                        className="w-full bg-black/40 text-slate-100 placeholder:text-slate-500 text-xs pr-10 pl-9 py-2.5 rounded-xl border border-white/10 focus:border-amber-400 focus:outline-none transition-all font-mono"
                      />
                      {imageUrl && (
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white cursor-pointer"
                          title={isEn ? 'Clear' : 'سڕینەوە'}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handlePasteClipboard}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl liquid-glass-btn hover:border-amber-400/50 text-slate-200 hover:text-amber-300 text-xs font-semibold shrink-0 cursor-pointer transition-all"
                      title={isEn ? 'Paste from clipboard' : 'پەیستکردن لە کلیپبۆرد'}
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Paste' : 'پەیست'}</span>
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
                        alt={isEn ? 'Historical photo preview' : 'پێشبینینی وێنەی مێژوویی'}
                        className="max-h-72 w-auto object-contain rounded-lg shadow-lg"
                        onError={() =>
                          setImageLoadError(
                            isEn
                              ? 'Could not load this image. Please verify the direct link.'
                              : 'نەتوانرا ئەم وێنەیە باربکرێت، تکایە دڵنیابە لە درووستی بەستەرەکە.'
                          )
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between w-full px-2 text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                        <Check className="w-3.5 h-3.5" />
                        <span>{isEn ? 'Image preview ready' : 'پێشبینینی وێنە ئامادەیە'}</span>
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
                    <span className="text-xs font-medium text-slate-300">
                      {isEn ? 'No image URL entered yet' : 'هیچ بەستەرێکی وێنە دانەنراوە'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {isEn
                        ? 'Paste any direct image link from Wikimedia Commons, ImgBB, or the web.'
                        : 'دەتوانیت هەر لینکێکی وێنە لە ویکیپیدیا، ئیمگەر یان وێب لێرە دابنێیت.'}
                    </span>
                  </div>
                )}
              </div>

              {/* 2. Year & Date */}
              <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg liquid-glass-btn flex items-center justify-center text-[11px] font-mono font-bold text-amber-300">
                      02
                    </span>
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span>{isEn ? 'Year & Date' : 'ساڵ و ڕێکەوت'}</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {isEn ? 'Historical date of the photograph' : 'کاتی وێنە لە مێژوودا'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">
                      {isEn ? 'Year' : 'ساڵ'} <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={startYearInput}
                      onChange={(e) => {
                        setStartYearInput(e.target.value);
                        setYearError(null);
                      }}
                      placeholder={isEn ? 'e.g., 1920 or 1187' : 'بۆ نموونە: 1920 یان 1187'}
                      dir="ltr"
                      className="w-full bg-black/40 text-slate-100 placeholder:text-slate-500 text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:border-amber-400 focus:outline-none transition-all font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">
                      {isEn ? 'Era (CE / BCE)' : 'سەردەم (زایینی / پێش زایین)'}
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
                        {isEn ? 'CE (AD)' : 'زایینی (ز)'}
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
                        {isEn ? 'BCE (BC)' : 'پێش زایین (پ.ز)'}
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

              {/* 3. Location on Map */}
              <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg liquid-glass-btn flex items-center justify-center text-[11px] font-mono font-bold text-amber-300">
                      03
                    </span>
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <span>{isEn ? 'Location on Map' : 'شوێن لەسەر نەخشە'}</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {isEn ? 'Pinpoint coordinates' : 'دیاریکردنی خاڵ'}
                  </span>
                </div>

                {/* Place Search */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    {isEn ? 'Search City or Place (Google Places)' : 'گەڕان بۆ شوێن یان شار (Google Places)'}
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={placeSearchQuery}
                      onChange={(e) => handlePlaceSearch(e.target.value)}
                      placeholder={
                        isEn
                          ? 'e.g., Erbil Citadel, Sulaymaniyah, Amed, Mahabad, Zakho, Kermanshah...'
                          : 'بۆ نموونە: قەڵای هەولێر، سلێمانی، ئامەد، مەهاباد، زاخۆ، کرماشان...'
                      }
                      className="w-full bg-black/40 text-slate-100 placeholder:text-slate-500 text-xs ps-10 pe-9 py-2.5 rounded-xl border border-white/10 focus:border-amber-400 focus:outline-none transition-all"
                    />
                    {isSearchingPlaces && (
                      <Loader2 className="w-4 h-4 text-amber-400 absolute end-3 top-1/2 -translate-y-1/2 animate-spin pointer-events-none" />
                    )}
                  </div>

                  {placeSearchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-30 max-h-48 overflow-y-auto rounded-xl bg-[#0b0f19] border border-white/15 shadow-2xl p-1 space-y-1">
                      {placeSearchResults.map((place, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectSearchedPlace(place)}
                          className="w-full text-start px-3 py-2 rounded-lg hover:bg-white/10 flex items-center justify-between text-xs text-slate-200 transition-colors cursor-pointer"
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
                        {selectedPlaceName
                          ? selectedPlaceName
                          : hasLocationPicked
                          ? isEn
                            ? 'Location Selected'
                            : 'شوێن دیاریکراوە'
                          : isEn
                          ? 'Location Not Selected'
                          : 'شوێن دیاری نەکراوە'}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400" dir="ltr">
                        {isEn ? 'Coords:' : 'پۆوتانەکان:'} {lat.toFixed(4)}, {lng.toFixed(4)}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onStartPickLocation}
                    className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Pick on Map Manually' : 'دیاریکردن بە دەست لەسەر نەخشە'}</span>
                  </button>
                </div>
              </div>

              {/* 4. Photo Information & Caption */}
              <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg liquid-glass-btn flex items-center justify-center text-[11px] font-mono font-bold text-amber-300">
                      04
                    </span>
                    <Info className="w-4 h-4 text-amber-400" />
                    <span>{isEn ? 'Photograph Details' : 'زانیاری لەسەر وێنە'}</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {isEn ? 'Historical note & description' : 'تێبینی و وەسفی مێژوویی'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    {isEn ? 'Photo Title (Short Heading)' : 'ناونیشانی وێنە (ناوی کورت یان سەردێڕ)'}{' '}
                    <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={
                      isEn
                        ? 'e.g., Sheikh Mahmud Barzanji, Dimdim Citadel, Old Sulaymaniyah...'
                        : 'بۆ نموونە: وێنەی شێخ مەحمودی حەفید، قەڵای دمدم، دیمەنی کۆنی سلێمانی...'
                    }
                    className="w-full bg-black/40 text-slate-100 placeholder:text-slate-500 text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:border-amber-400 focus:outline-none transition-all font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    {isEn ? 'Full Description & Context' : 'زانیاری و وەسفی تەواوی وێنە'}{' '}
                    <span className="text-amber-400">*</span>
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
                    placeholder={
                      isEn
                        ? 'Describe where this photograph was taken, who appears in it, its date, and historical significance...'
                        : 'زانیاری لەسەر ئەم وێنەیە، لە کوێ گیراوە، کێ تێیدایە، کات و سەردەم، و گرنگییە مێژوویییەکەی بنووسە...'
                    }
                    className="w-full bg-black/40 text-slate-100 placeholder:text-slate-500 text-xs p-3.5 rounded-xl border border-white/10 focus:border-amber-400 focus:outline-none transition-all resize-y leading-relaxed"
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* SECTION 1: Basic Information & Classification */}
              <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 transition-all space-y-4 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg liquid-glass-btn flex items-center justify-center text-[11px] font-mono font-bold text-amber-300">
                      01
                    </span>
                    <span>{isEn ? 'Entry Title & Classification' : 'ناونیشان و پۆلێنبەندی بابەت'}</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {isEn ? 'Core Information' : 'زانیارییە سەرەکییەکان'}
                  </span>
                </div>

                {/* Name Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    {isEn ? 'Polity / Figure / Site Name' : 'ناوی دەسەڵات / کەسایەتی / شوێن'}{' '}
                    <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={
                      isEn
                        ? 'e.g., Principality of Baban, Sharafkhan Bidlisi, Erbil Citadel...'
                        : 'بۆ نموونە: ئەتابەگ نەسرەدین ئەحمەد، قەڵای شێروانە، دەوڵەتی زەند، شەرەفخانی بەدلیسی...'
                    }
                    className="w-full liquid-glass-input text-white px-3.5 py-2.5 rounded-xl text-sm font-semibold placeholder:text-slate-500"
                  />
                </div>

                {/* Unified Category Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-amber-300">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        {isEn ? 'Category' : 'پۆلێنی بابەت'} <span className="text-amber-400">*</span>
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {isEn
                        ? `Select 1 of ${editableCategories.length} categories`
                        : `یەکێک لە ${formatDigits(editableCategories.length, language)} پۆلێنە سەرەکییەکە هەڵبژێرە`}
                    </span>
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {editableCategories.map((cat) => {
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

              {/* SECTION 2: Geographic Location & Google Maps */}
              <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 transition-all space-y-4 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg liquid-glass-btn flex items-center justify-center text-[11px] font-mono font-bold text-amber-300">
                      02
                    </span>
                    <span>
                      {isEn ? 'Geographic Location & Map Coordinates' : 'شوێن و پۆوتانی جوگرافی لەسەر نەخشە'}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowManualCoords(!showManualCoords)}
                    className="text-[11px] text-amber-400/90 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>
                      {showManualCoords
                        ? isEn
                          ? 'Hide Manual Coords'
                          : 'شاردنەوەی پۆوتانی دەستی'
                        : isEn
                        ? 'Edit Manual Coords'
                        : 'دەستکاریکردنی دەستی پۆوتان'}
                    </span>
                  </button>
                </div>

                {/* Region / Geographic description */}
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    {isEn ? 'Geographic Location / City, Region or Country' : 'پێگەی جوگرافی / شار، ناوچە یان وڵات'}
                  </label>
                  <input
                    type="text"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder={
                      isEn
                        ? 'e.g., Sulaymaniyah, Urmia, Amed (Diyarbakir), Cizre, Erbil...'
                        : 'بۆ نموونە: ئیزە و ئەسفەهان (لوڕی گەورە)، سلێمانی، ورمێ، ئامەد، جزیرە، هەولێر...'
                    }
                    className="w-full liquid-glass-input text-white px-3.5 py-2.5 rounded-xl text-xs placeholder:text-slate-500"
                  />
                </div>

                {/* Google Maps Search Bar + Direct Map Picker */}
                <div className="p-3.5 rounded-2xl liquid-glass-subtle space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Search className="w-4 h-4 text-amber-400" />
                      <span>
                        {isEn ? 'Search Google Maps for instant placement:' : 'گەڕان لە گۆگڵ ماپ بۆ دۆزینەوەی دەستبەجێ:'}
                      </span>
                    </span>

                    <button
                      type="button"
                      onClick={onStartPickLocation}
                      className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl liquid-glass-btn text-amber-300 font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
                    >
                      <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        {hasLocationPicked
                          ? isEn
                            ? 'Reposition on Map'
                            : 'گۆڕینی شوێن بە دەست لەسەر نەخشە'
                          : isEn
                          ? 'Pick by Clicking Map'
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
                      placeholder={
                        isEn
                          ? 'Type any city, fortress, town, archaeological site, or village (e.g., Sulaymaniyah, Rawanduz, Bitlis...)'
                          : 'ناوی هەر شار، قەڵا، شارۆچکە، شوێنەوار یان گوند بنووسە (بۆ نموونە: سلێمانی، ڕواندز، قەڵای دمدم، بەدلیس، ئامێدی...)'
                      }
                      className="w-full liquid-glass-input text-white pe-9 ps-3.5 py-2.5 rounded-xl text-xs placeholder:text-slate-500"
                    />
                    <div className="absolute end-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
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
                        <span>
                          {isEn ? 'Click a place to select it immediately:' : 'کلیک لە ناوی شوێنەکە بکە بۆ دیاریکردنی دەستبەجێ:'}
                        </span>
                        <span className="font-mono text-slate-400">
                          {formatDigits(placeSearchResults.length, language)} {isEn ? 'results' : 'ئەنجام'}
                        </span>
                      </div>
                      {placeSearchResults.map((place) => (
                        <button
                          key={place.id}
                          type="button"
                          onClick={() => handleSelectSearchedPlace(place)}
                          className="w-full text-start p-3 hover:liquid-glass-btn transition-colors flex items-start gap-3 cursor-pointer group"
                        >
                          <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 group-hover:scale-125 transition-transform" />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-white group-hover:text-amber-300 truncate">
                              {place.name}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate mt-0.5">
                              {place.formattedAddress}
                            </div>
                            <div className="text-[10px] font-mono text-amber-400/80 mt-0.5" dir="ltr">
                              {place.lat.toFixed(4)}° N, {place.lng.toFixed(4)}° E
                            </div>
                          </div>
                          <span className="text-[10px] px-2.5 py-1 rounded-lg liquid-glass-btn text-amber-300 shrink-0 font-bold group-hover:liquid-glass-btn-active group-hover:text-black transition-colors">
                            {isEn ? 'Select' : 'دەستنیشانکردن'}
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
                              ? isEn
                                ? `Selected: ${selectedPlaceName}`
                                : `شوێن دیاریکراوە: ${selectedPlaceName}`
                              : isEn
                              ? 'Location coordinates set.'
                              : 'شوێنی ئەم دەسەڵاتە دیاریکراوە.'}
                          </span>
                          <span className="text-[11px] font-mono text-amber-300" dir="ltr">
                            {isEn ? 'Coords:' : 'پۆوتان:'} {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-300 text-xs">
                        <div className="w-6 h-6 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center shrink-0">
                          <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                        <span>
                          {isEn
                            ? 'Use Google Maps search above or click the map picker button to set coordinates.'
                            : 'دەتوانیت بە سێرچی گۆگڵ ماپس لە سەرەوە یان بە دوگمەی نەخشە پۆینتەکە دیاری بکەیت.'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Optional Manual GPS Coordinates fields */}
                  {showManualCoords && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 animate-fade-in">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          {isEn ? 'Latitude' : 'هێڵی پانی (Latitude)'}
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={lat}
                          onChange={(e) => {
                            setLat(parseFloat(e.target.value) || 0);
                            setHasLocationPicked(true);
                          }}
                          dir="ltr"
                          className="w-full bg-[#050812] text-white px-3 py-1.5 rounded-lg border border-slate-700 font-mono text-xs focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          {isEn ? 'Longitude' : 'هێڵی درێژی (Longitude)'}
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={lng}
                          onChange={(e) => {
                            setLng(parseFloat(e.target.value) || 0);
                            setHasLocationPicked(true);
                          }}
                          dir="ltr"
                          className="w-full bg-[#050812] text-white px-3 py-1.5 rounded-lg border border-slate-700 font-mono text-xs focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Province Classification & Google Boundary Verification */}
                  <div className="pt-2.5 border-t border-white/10 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          {isEn
                            ? 'Province Classification (Boundaries & Google Data):'
                            : 'پۆلێنی پارێزگا (بەپێی سنوور و داتای گۆگڵ):'}
                        </span>
                      </label>

                      <button
                        type="button"
                        onClick={() => resolveProvinceFromCoords(lat, lng, true)}
                        disabled={isResolvingProvince}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-300 text-[11px] font-bold cursor-pointer transition-all disabled:opacity-50"
                      >
                        {isResolvingProvince ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Globe className="w-3 h-3" />
                        )}
                        <span>{isEn ? 'Detect Boundary via Google' : 'دیاریکردنی سنوور بە داتای گۆگڵ'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <select
                        value={provinceId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProvinceId(val);
                          const found = KURDISTAN_PROVINCES.find((p) => p.id === val);
                          if (found) setRegionName(isEn ? found.nameEn || found.name : found.name);
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#0b101d] text-slate-100 text-xs font-bold focus:border-amber-400 focus:outline-none"
                      >
                        <option value="">
                          {isEn ? 'Auto-detect on Map' : 'دیاریکردنی خۆکار لەسەر نەخشە'}
                        </option>
                        <optgroup label={isEn ? 'Southern Kurdistan' : 'باشووری کوردستان'}>
                          {KURDISTAN_PROVINCES.filter((p) => p.part === 'south').map((p) => (
                            <option key={p.id} value={p.id}>
                              {isEn ? p.nameEn || p.name : p.name}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label={isEn ? 'Northern Kurdistan' : 'باکووری کوردستان'}>
                          {KURDISTAN_PROVINCES.filter((p) => p.part === 'north').map((p) => (
                            <option key={p.id} value={p.id}>
                              {isEn ? p.nameEn || p.name : p.name}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label={isEn ? 'Eastern Kurdistan' : 'ڕۆژهەڵاتی کوردستان'}>
                          {KURDISTAN_PROVINCES.filter((p) => p.part === 'east').map((p) => (
                            <option key={p.id} value={p.id}>
                              {isEn ? p.nameEn || p.name : p.name}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label={isEn ? 'Western Kurdistan' : 'ڕۆژئاوای کوردستان'}>
                          {KURDISTAN_PROVINCES.filter((p) => p.part === 'west').map((p) => (
                            <option key={p.id} value={p.id}>
                              {isEn ? p.nameEn || p.name : p.name}
                            </option>
                          ))}
                        </optgroup>
                        {provinceId.startsWith('outside_') && (
                          <option value={provinceId}>
                            {isEn ? 'Outside Kurdistan: ' : 'دەرەوەی کوردستان: '}
                            {regionName || provinceId.replace('outside_', '')}
                          </option>
                        )}
                      </select>

                      <input
                        type="text"
                        value={regionName}
                        onChange={(e) => setRegionName(e.target.value)}
                        placeholder={
                          isEn
                            ? 'Province or region name (e.g., Erbil, Baghdad)'
                            : 'ناوی پارێزگا یان هەرێم (بۆ نموونە: هەولێر، بەغدا)'
                        }
                        className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#0b101d] text-slate-100 text-xs placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    {googleAdminSummary && (
                      <div className="text-[10px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 rounded-lg px-2.5 py-1.5 font-mono flex items-center gap-1.5">
                        <Check className="w-3 h-3 shrink-0" />
                        <span className="truncate">{googleAdminSummary}</span>
                      </div>
                    )}
                  </div>
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
                  {isEn
                    ? 'Historical Chronology (by Year or Century) for Timeline & Map'
                    : 'دیاریکردنی کاتی مێژوویی (بە ساڵ یان بە سەدە) بۆ تایملاین و نەخشە'}
                </span>
              </span>

              {previewTimeSpan?.isCrossEra && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold liquid-glass-btn-active text-black shadow-sm animate-pulse">
                  {isEn ? 'Cross-Era (BCE ⟷ CE)' : 'نێوان پێش و دوای زایین (پ.ز ⟷ ز)'}
                </span>
              )}
            </div>

            {/* Mode Selector Segmented Tabs: ٤ بژاردەی سەرەکی بە شێوازی Liquid Glass */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-amber-200/90">
                {isEn ? 'Select Date Format Mode:' : 'شێوازی دیاریکردنی کات هەڵبژێرە:'}
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
                  <span className="truncate">{isEn ? 'Single Year' : 'ساڵێکی دیاریکراو'}</span>
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
                  <span className="truncate">{isEn ? 'Year Range' : 'نێوان دوو ساڵ'}</span>
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
                  <span className="truncate">{isEn ? 'Single Century' : 'بەتەنیا یەک سەدە'}</span>
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
                  <span className="truncate">{isEn ? 'Century Range' : 'نێوان دوو سەدە'}</span>
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
                    <span>
                      {isPerson
                        ? isEn
                          ? 'Birth Year or Active Year'
                          : 'ساڵی لەدایکبوون یان ساڵی چالاکی'
                        : isEn
                        ? 'Event or Founding Year'
                        : 'ساڵی ڕووداو یان دامەزراندن'}
                    </span>
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
                      {isEn ? 'BCE' : 'پ.ز'}
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
                      {isEn ? 'CE' : 'ز'}
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
                    placeholder={
                      isEn
                        ? startEra === 'BC'
                          ? 'e.g. 612 (BCE)'
                          : 'e.g. 1514 (CE)'
                        : startEra === 'BC'
                        ? 'بۆ نموونە: 612 (پێش زایین)'
                        : 'بۆ نموونە: 1514 (زایینی)'
                    }
                    className="w-full liquid-glass-input text-white ps-3 pe-24 py-2.5 rounded-xl text-xs font-mono font-bold"
                  />
                  <span className="absolute end-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-amber-400/80 pointer-events-none">
                    {isEn ? (startEra === 'BC' ? 'BCE' : 'CE') : startEra === 'BC' ? 'پێش زایین' : 'زایینی'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  {isEn
                    ? 'This entry will be pinned specifically to this year on the map and timeline.'
                    : 'ئەم بابەتە بەتەنیا بۆ ئەم ساڵە لەسەر نەخشە و تایملاین جێگیر دەبێت.'}
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
                        <span>
                          {isPerson
                            ? isEn
                              ? 'Birth Year'
                              : 'ساڵی لەدایکبوون'
                            : isEn
                            ? 'Start / Founding Year'
                            : 'ساڵی دەستپێک / دامەزراندن'}
                        </span>
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
                          {isEn ? 'BCE' : 'پ.ز'}
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
                          {isEn ? 'CE' : 'ز'}
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
                        placeholder={
                          isEn
                            ? startEra === 'BC'
                              ? 'e.g. 150 (BCE)'
                              : 'e.g. 1514 (CE)'
                            : startEra === 'BC'
                            ? 'بۆ نموونە: 150 (پ.ز)'
                            : 'بۆ نموونە: 1514 (ز)'
                        }
                        className="w-full liquid-glass-input text-white ps-3 pe-16 py-2 rounded-xl text-xs font-mono font-bold"
                      />
                      <span className="absolute end-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-400/80 pointer-events-none">
                        {isEn ? (startEra === 'BC' ? 'BCE' : 'CE') : startEra === 'BC' ? 'پ.ز' : 'ز'}
                      </span>
                    </div>
                  </div>

                  {/* Field 2: End Year */}
                  <div className="liquid-glass-subtle rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {isPerson
                            ? isEn
                              ? 'Death Year'
                              : 'ساڵی کۆچی دوایی'
                            : isEn
                            ? 'End / Decline Year'
                            : 'ساڵی کۆتایی / ڕووخان'}
                        </span>
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
                          {isEn ? 'BCE' : 'پ.ز'}
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
                          {isEn ? 'CE' : 'ز'}
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
                        placeholder={
                          isEn
                            ? endEra === 'BC'
                              ? 'e.g. 40 (BCE)'
                              : 'e.g. 1851 (CE)'
                            : endEra === 'BC'
                            ? 'بۆ نموونە: 40 (پ.ز)'
                            : 'بۆ نموونە: 1851 (ز)'
                        }
                        className="w-full liquid-glass-input text-white ps-3 pe-16 py-2 rounded-xl text-xs font-mono font-bold"
                      />
                      <span className="absolute end-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-400/80 pointer-events-none">
                        {isEn ? (endEra === 'BC' ? 'BCE' : 'CE') : endEra === 'BC' ? 'پ.ز' : 'ز'}
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
                    <span>{isEn ? 'Select Century (Single Century)' : 'سەدە دیاری بکە (بەتەنیا یەک سەدە)'}</span>
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
                      {isEn ? 'BCE' : 'پ.ز (پێش زایین)'}
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
                      {isEn ? 'CE' : 'ز (زایینی)'}
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
                    placeholder={isEn ? 'Enter century number: e.g. 4 or 12' : 'ژمارەی سەدە بنووسە: بۆ نموونە 4 یان 12'}
                    className="w-full liquid-glass-input text-white ps-3 pe-32 py-2.5 rounded-xl text-xs font-mono font-bold"
                  />
                  <span className="absolute end-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-amber-400/90 pointer-events-none">
                    {isEn
                      ? startCenturyEra === 'BC'
                        ? 'Century BCE'
                        : 'Century CE'
                      : startCenturyEra === 'BC'
                      ? 'سەدەی پێش زایین'
                      : 'سەدەی زایینی'}
                  </span>
                </div>

                {/* Quick preset century buttons */}
                <div>
                  <span className="block text-[10px] text-slate-400 mb-1.5 font-bold">
                    {isEn ? 'Quick Century Presets:' : 'هەڵبژاردنی خێرا بۆ سەدە:'}
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
                        {isEn ? `C. ${num}` : `سەدەی ${formatDigits(num, language)}`}
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
                        <span>{isEn ? 'Start Century' : 'سەدەی دەستپێک'}</span>
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
                          {isEn ? 'BCE' : 'پ.ز'}
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
                          {isEn ? 'CE' : 'ز'}
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
                        placeholder={isEn ? 'e.g. 4 or 10' : 'بۆ نموونە: 4 یان 10'}
                        className="w-full liquid-glass-input text-white ps-3 pe-24 py-2 rounded-xl text-xs font-mono font-bold"
                      />
                      <span className="absolute end-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-400/80 pointer-events-none">
                        {isEn
                          ? `C. ${startCenturyEra === 'BC' ? 'BCE' : 'CE'}`
                          : `سەدەی ${startCenturyEra === 'BC' ? 'پ.ز' : 'ز'}`}
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
                          {formatDigits(n, language)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Century 2: End */}
                  <div className="liquid-glass-subtle rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        <span>{isEn ? 'End Century' : 'سەدەی کۆتایی'}</span>
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
                          {isEn ? 'BCE' : 'پ.ز'}
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
                          {isEn ? 'CE' : 'ز'}
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
                        placeholder={isEn ? 'e.g. 2 or 12' : 'بۆ نموونە: 2 یان 12'}
                        className="w-full liquid-glass-input text-white ps-3 pe-24 py-2 rounded-xl text-xs font-mono font-bold"
                      />
                      <span className="absolute end-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-400/80 pointer-events-none">
                        {isEn
                          ? `C. ${endCenturyEra === 'BC' ? 'BCE' : 'CE'}`
                          : `سەدەی ${endCenturyEra === 'BC' ? 'پ.ز' : 'ز'}`}
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
                          {formatDigits(n, language)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Live Interactive Year / Century Preview Badge */}
            {previewTimeSpan && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl liquid-glass-subtle text-xs border border-amber-400/30">
                <div className="space-y-0.5 min-w-0">
                  <div className="text-slate-300 text-xs flex items-center gap-1.5 font-bold">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isEn ? 'Recorded Date Preview:' : 'پێشبینینی ڕێکەوتی تۆمارکراو:'}</span>
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
                      {isEn ? 'BCE ⟷ CE' : 'پ.ز ⟷ ز'}
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
                <span>
                  {isEn
                    ? 'Historical Summary, Archaeology & Archives'
                    : 'پوختەی مێژوویی، شوێنەواری و بەڵگەنامەکان'}
                </span>
              </span>
              <span className="text-[11px] text-slate-400">
                {isEn ? 'Narrative & Sources' : 'دەق و سەرچاوەکان'}
              </span>
            </div>

            {/* Full historical overview text */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {isEn
                    ? 'Historical & Archaeological Overview (Main Text)'
                    : 'پوختەی مێژوویی و شوێنەواری (دەقی سەرەکی)'}
                </span>
              </label>
              <textarea
                rows={3}
                value={fullText}
                onChange={(e) => setFullText(e.target.value)}
                placeholder={
                  isEn
                    ? 'Write a historical description of this polity, figure, or site: key events, battles, monuments, and legacy...'
                    : 'وەسفی مێژوویی ئەم دەسەڵاتە یان کەسایەتییە بنووسە: ڕووداوە گرنگەکان، نەبەردییەکان، ئاسەوارەکان و بەسەرهاتەکانی فەرمانڕەوایی...'
                }
                className="w-full liquid-glass-input text-white px-3.5 py-2.5 rounded-xl leading-relaxed text-xs placeholder:text-slate-500"
              />
            </div>

            {/* Additional notes, manuscripts & references */}
            <div className="p-3.5 rounded-2xl liquid-glass-subtle space-y-2">
              <label className="block text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {isEn
                    ? 'Additional Notes, Manuscripts, Historians & References'
                    : 'زانیاریی زیاتر، دەستنووس، وتەی مێژوونووسان و سەرچاوەکان'}
                </span>
              </label>

              {duplicateNotesOwner && (
                <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-400/50 text-amber-200 text-[11px] flex flex-wrap items-center justify-between gap-2 animate-fade-in">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">
                      {isEn
                        ? `Warning: These additional notes match the entry "${duplicateNotesOwner.name}" and appear to be pasted from another topic.`
                        : `ئاگاداری: ئەم تێبینییە زیادەیە هەمان دەقی بابەتی «${duplicateNotesOwner.name}»ـە و پێدەچێت بە هەڵە تێکەڵ بووبێت.`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAdditionalNotes('')}
                    className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-[11px] flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{isEn ? 'Clear Mismatched Notes' : 'سڕینەوەی تێبینیی تێکەڵبوو'}</span>
                  </button>
                </div>
              )}

              <textarea
                rows={3}
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder={
                  isEn
                    ? 'Add extended details, manuscript excerpts, historians’ quotes, preserved artifacts, and bibliographic references...'
                    : 'لێرە زانیارییە زیاترەکان، دەقی دەستنووس و وتەی مێژوونووسان، شوێنەوارە پارێزراوەکان و سەرچاوەی کتێبەکان تۆمار بکە...'
                }
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
                <span>
                  {isEn
                    ? 'Image URLs (Up to 10 Photos • Primary & Extra Slots)'
                    : 'بەستەری وێنەکان (تا ١٠ وێنە • وێنەی سەرەکی و وێنە زیاترەکان)'}
                </span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full liquid-glass-subtle text-amber-300 border border-amber-400/40">
                {isEn ? 'Up to 10 Photos • Direct URLs' : 'تا ١٠ وێنە • بەستەری ڕاستەوخۆ'}
              </span>
            </div>

            {/* Image #1 - Primary */}
            <div className="p-3.5 rounded-2xl liquid-glass-subtle border border-amber-400/25 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-amber-400 text-black font-extrabold text-[10px] font-heading shadow-xs">
                    {isEn ? 'Primary Photo #1' : 'وێنەی سەرەکی #١'}
                  </span>
                  <span className="text-xs font-bold text-white">
                    {isEn
                      ? 'Featured on the map marker and entry header'
                      : 'پێشاندانی سەر نەخشە و بەرگی سەرەکی بابەت'}
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
                  <span>{isEn ? 'Primary Image URL (#1):' : 'بەستەری وێنەی سەرەکی (#١):'}</span>
                </label>
                <div className="relative flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => handleImageUrlChange(e.target.value)}
                      placeholder={
                        isEn
                          ? 'Paste primary image URL here (Wikipedia, ImgBB, Drive...)'
                          : 'لینکی وێنەی سەرەکی لێرە دابنێ (Wikipedia, ImgBB, Drive...)'
                      }
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
                        title={isEn ? 'Clear URL' : 'سڕینەوەی بەستەر'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="shrink-0 px-3 py-2 rounded-xl liquid-glass-btn text-amber-300 hover:text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                    title={isEn ? 'Paste from clipboard' : 'پەیستکردن لە کلیپبۆرد'}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isEn ? 'Paste' : 'پەیست'}</span>
                  </button>
                </div>
              </div>

              {/* Caption Input #1 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {isEn ? 'Caption & Description for Primary Photo (#1):' : 'تێبینی و وەسف لەسەر وێنەی سەرەکی (#١):'}
                  </span>
                </label>
                <input
                  type="text"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  placeholder={
                    isEn
                      ? 'e.g. Portrait, the citadel in the early 20th century, or map of the capital...'
                      : 'بۆ نموونە: نیگاری کەسایەتی، قەڵاکە لە سەدەی بیستەم، یاخود نەخشەی پایتەخت...'
                  }
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
                        isEn
                          ? 'Could not load image from this URL. Please verify the direct link.'
                          : 'نەتوانرا وێنەکە لەم بەستەرە باربکرێت، تکایە دڵنیابە لە دروستی بەستەرەکە.'
                      )
                    }
                    onLoad={() => setImageLoadError(null)}
                  />
                  {imageCaption && (
                    <div className="w-full mt-2 p-1.5 px-2.5 rounded-lg liquid-glass-subtle text-amber-200 text-xs flex items-center gap-1.5">
                      <ImageIcon className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="font-medium text-start text-[11px] truncate">{imageCaption}</span>
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

            {/* Extra 9 Images Accordion Button */}
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
                  <div className="text-start">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-heading">
                        {showExtraImages
                          ? isEn
                            ? 'Hide Extra 9 Photo Slots'
                            : 'شاردنەوەی ٩ بۆشایی وێنەکەی تر'
                          : isEn
                          ? 'Add More Photos (Open 9 Additional URL & Caption Slots)'
                          : 'زیادکردنی وێنەی تر (کردنەوەی ٩ لینکی تر و ٩ تێبینی)'}
                      </span>
                      {filledExtraCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-400/25 text-amber-300 border border-amber-400/40 text-[10px] font-mono font-bold">
                          {isEn
                            ? `${filledExtraCount} of 9 filled`
                            : `${formatDigits(filledExtraCount, language)} لە ٩ وێنە پڕکراوەتەوە`}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-white/5 text-slate-400 text-[10px]">
                          {isEn ? 'Up to 9 extra photos' : 'تا ٩ وێنەی زیاتر'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {showExtraImages
                        ? isEn
                          ? 'Click to collapse extra slots'
                          : 'کلیک بکە بۆ داخستنی خانەکان'
                        : isEn
                        ? 'Click to expand 9 additional image URLs & captions for the photo album'
                        : 'کلیک بکە بۆ نیشاندانی بۆشایی ٩ لینک و ٩ تێبینی بۆ ئەلبوومی وێنەکان'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs shrink-0">
                  <span className="hidden sm:inline">
                    {showExtraImages ? (isEn ? 'Collapse' : 'داخستن') : isEn ? 'Expand' : 'کردنەوە'}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-300 ${
                      showExtraImages ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>
            </div>

            {/* 9 Extra Image Slots */}
            {showExtraImages && (
              <div className="space-y-3.5 pt-1 animate-fade-in">
                <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Images className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-bold text-[11px]">
                      {isEn
                        ? '9 Additional Photo & Caption Slots (Photo #2 to #10)'
                        : '٩ بۆشایی وێنەی زیاتر و ٩ بۆشایی تێبینی (وێنەی #٢ تا #١٠)'}
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-300 font-mono">
                    {isEn ? 'Total capacity: 10 photos' : 'کۆی گشتی بەردەست: ١٠ وێنە'}
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
                              {isEn ? `Photo #${imgNumber}` : `وێنەی #${formatDigits(imgNumber, language)}`}
                            </span>
                            <span className="text-[11px] font-medium text-slate-300">
                              {isFilled
                                ? isEn
                                  ? 'Image configured'
                                  : 'وێنەکە دیاریکراوە'
                                : isEn
                                ? 'Empty slot'
                                : 'بۆشایی بەتاڵ'}
                            </span>
                          </div>

                          {isFilled && (
                            <button
                              type="button"
                              onClick={() => handleClearExtraImage(idx)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-lg liquid-glass-btn text-rose-300 hover:text-rose-200 text-[10px] cursor-pointer"
                              title={isEn ? 'Remove this photo' : 'سڕینەوەی ئەم وێنەیە'}
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>{isEn ? 'Clear' : 'سڕینەوە'}</span>
                            </button>
                          )}
                        </div>

                        {/* Fields: URL + Caption */}
                        <div className="space-y-2.5">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-300 mb-1 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <LinkIcon className="w-3 h-3 text-amber-400" />
                                <span>
                                  {isEn
                                    ? `Image #${imgNumber} URL:`
                                    : `بۆشایی لینکی وێنەی #${formatDigits(imgNumber, language)}:`}
                                </span>
                              </span>
                            </label>
                            <div className="relative flex items-center gap-1.5">
                              <input
                                type="url"
                                value={extra.url}
                                onChange={(e) => handleExtraImageChange(idx, 'url', e.target.value)}
                                placeholder={
                                  isEn
                                    ? `Photo #${imgNumber} URL (Wikipedia, ImgBB, Drive...)`
                                    : `لینکی وێنەی #${formatDigits(imgNumber, language)} (Wikipedia, ImgBB, Drive...)`
                                }
                                className="w-full liquid-glass-input text-white px-3 py-1.5 rounded-xl text-xs font-mono placeholder:text-slate-600"
                                dir="ltr"
                              />
                              <button
                                type="button"
                                onClick={() => handlePasteExtraClipboard(idx)}
                                className="shrink-0 px-2.5 py-1.5 rounded-xl liquid-glass-btn text-amber-300 hover:text-white text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                title={isEn ? 'Paste from clipboard' : 'پەیستکردن لە کلیپبۆرد'}
                              >
                                <Copy className="w-3 h-3" />
                                <span className="hidden sm:inline">{isEn ? 'Paste' : 'پەیست'}</span>
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                              <FileText className="w-3 h-3 text-amber-400" />
                              <span>
                                {isEn
                                  ? `Caption for Photo #${imgNumber}:`
                                  : `بۆشایی تێبینی لەسەر وێنەی #${formatDigits(imgNumber, language)}:`}
                              </span>
                            </label>
                            <input
                              type="text"
                              value={extra.caption}
                              onChange={(e) => handleExtraImageChange(idx, 'caption', e.target.value)}
                              placeholder={
                                isEn
                                  ? `Caption, location, or description for photo #${imgNumber}...`
                                  : `تێبینی، شوێن یان وەسفی وێنەی #${formatDigits(imgNumber, language)}...`
                              }
                              className="w-full liquid-glass-input text-white px-3 py-1.5 rounded-xl text-xs placeholder:text-slate-500"
                            />
                          </div>

                          {/* Thumbnail preview if URL is set */}
                          {isFilled && (
                            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-black/60 border border-white/10 mt-1">
                              <img
                                src={extra.url}
                                alt={extra.caption || `Photo #${imgNumber}`}
                                className="w-12 h-12 object-cover rounded-lg border border-amber-400/40 shrink-0"
                                loading="lazy"
                              />
                              <div className="min-w-0 flex-1 text-start">
                                <p className="text-[11px] font-bold text-amber-300 truncate">
                                  {extra.caption ||
                                    (isEn ? `Photo #${imgNumber}` : `وێنەی #${formatDigits(imgNumber, language)}`)}
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
                <span>
                  {isEn
                    ? 'Linking to Polities, Rulers & Related Entries'
                    : 'بەستنەوە بە دەسەڵات، میرنشین و بابەتە پەیوەندیدارەکان'}
                </span>
              </span>
              <span className="text-[11px] text-amber-300/80">
                {isEn ? 'Emirate, Ruler, Scholar, Fortress, Battle' : 'میرنشین، میر، زانا، قەڵا، جەنگ'}
              </span>
            </div>

            {/* Parent Entity Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {isEn ? 'Parent Polity or Empire' : 'دەسەڵات یان میرنشینی سەرەکی (Parent Entity)'}
                </span>
              </label>
              <select
                value={parentFactId || ''}
                onChange={(e) =>
                  setParentFactId(e.target.value ? Number(e.target.value) : undefined)
                }
                className="w-full liquid-glass-input text-slate-100 p-2.5 rounded-xl text-xs cursor-pointer focus:outline-none"
              >
                <option value="" className="bg-slate-900 text-slate-300">
                  {isEn
                    ? '-- No parent polity (independent or top-level entity) --'
                    : '-- بەبێ دەسەڵاتی دایک (سەربەخۆ یان خۆی دەسەڵاتی سەرەکییە) --'}
                </option>
                {availableParentFacts.map((ent) => (
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
                  <span>
                    {isEn
                      ? `Linked Entries & Figures (${relatedFactIds.length})`
                      : `بابەت و کەسایەتییە بەستراوەکان (${formatDigits(relatedFactIds.length, language)})`}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsLinkingModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg liquid-glass-btn text-amber-300 hover:text-white text-[11px] font-bold cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-amber-400" />
                  <span>{isEn ? 'Select & Link Entries' : 'دیاریکردن و گەڕان بۆ بەستنەوە'}</span>
                </button>
              </div>

              {relatedFactIds.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl liquid-glass-subtle">
                  {relatedFactIds.map((rfId) => {
                    const found = factsByIdMap.get(rfId);
                    if (!found) return null;
                    const cat = getCategoryInfo(found, language);
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
                  {isEn
                    ? 'No related entries linked yet. Click the button above to link.'
                    : 'هێشتا هیچ بابەتی تر نەبەستراوەتەوە. کلیک لە دوگمەی سەرەوە بکە بۆ بەستنەوە.'}
                </div>
              )}
            </div>

            {/* Allies Section */}
            {selectedCategory === 'principality' && (
              <div className="p-3.5 rounded-2xl bg-emerald-950/25 border border-emerald-500/25 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      {isEn
                        ? `Allied Polities & Principalities (${allyFactIds.length})`
                        : `دەسەڵات و میرنشینە هاوپەیمانەکان (${formatDigits(allyFactIds.length, language)})`}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsLinkingModalOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 hover:text-white text-[11px] font-bold cursor-pointer transition-all"
                  >
                    <Plus className="w-3 h-3 text-emerald-400" />
                    <span>{isEn ? 'Select Allies' : 'دیاریکردنی هاوپەیمان'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-300">
                  {isEn
                    ? 'Select allied principalities or states to connect them with glowing green alliance lines on the map and relations graph.'
                    : 'هاوپەیمانی لەگەڵ دەسەڵات، میرنشین، یان دەوڵەتەکانی تر دیاری بکە تا بە هێڵی سەوزی درەوشاوەی «هاوپەیمان» لەسەر نەخشە و تۆڕی کەسایەتییەکان ببەسترێنەوە.'}
                </p>

                {allyFactIds.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-black/40 border border-emerald-500/20">
                    {allyFactIds.map((afId) => {
                      const found = factsByIdMap.get(afId);
                      if (!found) return null;
                      return (
                        <span
                          key={afId}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/15 border border-emerald-500/40 text-emerald-200"
                        >
                          <Shield className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{found.name}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setAllyFactIds((prev) => prev.filter((id) => id !== afId))
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
                  <div className="py-2 px-3 rounded-xl bg-black/25 text-slate-400 text-xs border border-white/5">
                    {isEn
                      ? 'No allies selected. Click the button above to assign allied entities.'
                      : 'هیچ هاوپەیمانێک دیاری نەکراوە. کلیک لە دوگمەی سەرەوە بکە بۆ دەستنیشانکردنی هاوپەیمانەکان.'}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

          {/* AI Translation Error Banner */}
          {aiError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/80 border border-rose-500/70 text-rose-200 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{aiError}</span>
            </div>
          )}

          {/* Action Buttons Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10 shrink-0">
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
                      <span>{isEn ? 'Confirm Delete' : 'دڵنیام، بیسڕەوە'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-3 py-2 rounded-xl liquid-glass-btn text-slate-300 hover:text-white text-xs cursor-pointer"
                    >
                      {isEn ? 'Cancel' : 'پەشیمانبوونەوە'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="p-2.5 rounded-xl text-red-400 hover:text-white hover:bg-red-950/70 border border-red-900/40 hover:border-red-700 transition-colors cursor-pointer"
                    title={isEn ? 'Delete this entry' : 'سڕینەوەی ئەم بابەتە'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Cancel, AI Translate & Save Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 ms-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isSavingAndTranslating}
                className="px-4 py-2.5 rounded-xl liquid-glass-btn text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                {isEn ? 'Close' : 'داخستن'}
              </button>

              {!isEn && !(factToEdit && translatedFactIds?.has(factToEdit.id)) && (
                <button
                  type="button"
                  onClick={handleSaveAndTranslateAi}
                  disabled={isSavingAndTranslating}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/50 text-sky-200 hover:text-white font-bold text-xs transition-all cursor-pointer active:scale-95 disabled:opacity-60 disabled:cursor-wait"
                  title="پاشەکەوتکردن بە کوردی و وەرگێڕانی خۆکار بۆ بەشی ئینگلیزی (facts_en) بە هەمان وێنە و پۆتان"
                >
                  {isSavingAndTranslating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-sky-300" />
                      <span>وەرگێڕان بەردەوامە...</span>
                    </>
                  ) : (
                    <>
                      <Languages className="w-4 h-4 text-sky-300" />
                      <span>پاشەکەوت + وەرگێڕان بۆ ئینگلیزی (AI)</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="submit"
                disabled={isSavingAndTranslating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl liquid-glass-btn-active text-black font-extrabold text-xs shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {formMode === 'photo_only' ? (
                  <>
                    <ImageIcon className="w-4 h-4 text-black" />
                    <span>
                      {isEn
                        ? 'Save & Pin Photo on Map'
                        : 'تۆمارکردن و دانانی وێنە لەسەر نەخشە'}
                    </span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-black" />
                    <span>
                      {isEn ? 'Save Changes' : 'پاشەکەوتکردنی زانیارییەکان'}
                    </span>
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
            factToEdit
              ? {
                  ...factToEdit,
                  tag: selectedCategory,
                  relatedFactIds,
                  parentFactId,
                  allyFactIds,
                }
              : {
                  id: 999999999,
                  num: 0,
                  eraId: 1,
                  eraName: '',
                  eraPeriod: '',
                  name: name.trim() || (isEn ? 'New Entry' : 'بابەتی نوێ'),
                  desc: desc.trim() || '',
                  fullText: fullText.trim() || '',
                  lat: Number(lat) || 36.8,
                  lng: Number(lng) || 44.5,
                  tag: selectedCategory,
                  relatedFactIds,
                  parentFactId,
                  allyFactIds,
                }
          }
          allFacts={allFacts}
          onSaveLinks={async (_sourceId, targetIds, newParentId, newAllyIds) => {
            setRelatedFactIds(targetIds);
            if (typeof newParentId === 'number' || newParentId === undefined) {
              setParentFactId(newParentId);
            }
            if (newAllyIds) {
              setAllyFactIds(newAllyIds);
            }
          }}
        />
      )}
    </div>
  );
};
