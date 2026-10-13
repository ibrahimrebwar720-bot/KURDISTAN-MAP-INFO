import React, { useState, useEffect, useMemo } from 'react';
import { FactItem } from '../data/kurdishHistoryData';
import { CollectionItem } from '../types/history';
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
} from 'lucide-react';
import {
  getFactYearSpan,
  formatKurdishYearRange,
  normalizeYearString,
  toKurdishDigits,
  formatKurdishYear,
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
  collections: CollectionItem[];
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
  collections,
  onSave,
  onDelete,
  onStartPickLocation,
  pickedCoords,
  totalFactsCount,
}) => {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [fullText, setFullText] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [lat, setLat] = useState<number>(36.8);
  const [lng, setLng] = useState<number>(44.5);
  const [tag, setTag] = useState<FactItem['tag']>('principality');
  const [collectionId, setCollectionId] = useState<string>('powers');
  const [startYearInput, setStartYearInput] = useState('');
  const [endYearInput, setEndYearInput] = useState('');
  const [startEra, setStartEra] = useState<'BC' | 'AD'>('AD');
  const [endEra, setEndEra] = useState<'BC' | 'AD'>('AD');
  const [yearError, setYearError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [hasLocationPicked, setHasLocationPicked] = useState(false);

  // Is this fact a historical person / figure?
  const isPerson = tag === 'figure' || tag === 'scholar' || tag === 'minister' || tag === 'official';

  // Google Maps Place Search state
  const [placeSearchQuery, setPlaceSearchQuery] = useState('');
  const [placeSearchResults, setPlaceSearchResults] = useState<PlaceSearchResult[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [selectedPlaceName, setSelectedPlaceName] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadGoogleMapsScript().catch(() => {});
      setPlaceSearchQuery('');
      setPlaceSearchResults([]);

      if (factToEdit) {
        setName(factToEdit.name);
        setDesc(factToEdit.desc);
        setSelectedPlaceName(factToEdit.desc || null);
        setFullText(factToEdit.fullText);
        setAdditionalNotes(factToEdit.additionalNotes || '');
        setLat(factToEdit.lat);
        setLng(factToEdit.lng);
        setTag(factToEdit.tag);
        setCollectionId(factToEdit.collectionId || 'powers');
        if (typeof factToEdit.birthYear === 'number') {
          setStartYearInput(Math.abs(factToEdit.birthYear).toString());
          setStartEra(factToEdit.birthYear < 0 ? 'BC' : 'AD');
          if (typeof factToEdit.deathYear === 'number') {
            setEndYearInput(Math.abs(factToEdit.deathYear).toString());
            setEndEra(factToEdit.deathYear < 0 ? 'BC' : 'AD');
          } else {
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
            setEndYearInput(Math.abs(factToEdit.endYear).toString());
            setEndEra(factToEdit.endYear < 0 ? 'BC' : 'AD');
          } else {
            setEndYearInput('');
            setEndEra(factToEdit.startYear < 0 ? 'BC' : 'AD');
          }
        } else {
          const span = getFactYearSpan(factToEdit);
          setStartYearInput(Math.abs(span.startYear).toString());
          setStartEra(span.startYear < 0 ? 'BC' : 'AD');
          if (span.isRange && span.endYear !== span.startYear) {
            setEndYearInput(Math.abs(span.endYear).toString());
            setEndEra(span.endYear < 0 ? 'BC' : 'AD');
          } else {
            setEndYearInput('');
            setEndEra(span.startYear < 0 ? 'BC' : 'AD');
          }
        }
        setHasLocationPicked(true);
      } else {
        setName('');
        setDesc('');
        setSelectedPlaceName(null);
        setFullText('');
        setAdditionalNotes('');
        setStartYearInput('');
        setEndYearInput('');
        setStartEra('AD');
        setEndEra('AD');
        if (pickedCoords) {
          setLat(pickedCoords.lat);
          setLng(pickedCoords.lng);
          setHasLocationPicked(true);
        } else {
          setLat(36.8);
          setLng(44.5);
          setHasLocationPicked(false);
        }
        setTag('principality');
        setCollectionId('powers');
      }
      setYearError(null);
      setConfirmDelete(false);
    }
  }, [isOpen, factToEdit]);

  const handlePlaceSearch = async (query: string) => {
    setPlaceSearchQuery(query);
    if (query.trim().length < 2) {
      setPlaceSearchResults([]);
      setIsSearchingPlaces(false);
      return;
    }

    setIsSearchingPlaces(true);
    try {
      const results = await searchPlacesOnMap(query);
      setPlaceSearchResults(results);
    } catch {
      setPlaceSearchResults([]);
    } finally {
      setIsSearchingPlaces(false);
    }
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

  // Live preview calculation for real-time visual feedback
  const previewYear = useMemo(() => {
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
      isCrossEra,
      finalStart,
      finalEnd,
    };
  }, [startYearInput, endYearInput, startEra, endEra]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const normStart = normalizeYearString(startYearInput.trim());
    const normEnd = normalizeYearString(endYearInput.trim());
    const startNum = normStart ? parseInt(normStart, 10) : NaN;
    const endNum = normEnd ? parseInt(normEnd, 10) : NaN;

    if (isNaN(startNum)) {
      setYearError(
        isPerson
          ? 'تکایە ساڵی لەدایکبوون بنووسە.'
          : 'تکایە ساڵی دەستپێک / دامەزراندن بنووسە.'
      );
      return;
    }

    const actualStart = startEra === 'BC' ? -Math.abs(startNum) : Math.abs(startNum);
    const actualEnd = !isNaN(endNum)
      ? (endEra === 'BC' ? -Math.abs(endNum) : Math.abs(endNum))
      : actualStart;

    const finalStart = Math.min(actualStart, actualEnd);
    const finalEnd = Math.max(actualStart, actualEnd);
    const formattedYear = formatKurdishYearRange(finalStart, finalEnd);

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
      year: formattedYear,
      startYear: finalStart,
      endYear: !isNaN(endNum) ? finalEnd : (isPerson ? Math.min(2026, finalStart + 75) : finalStart),
      birthYear: isPerson ? finalStart : undefined,
      deathYear: isPerson && !isNaN(endNum) ? finalEnd : undefined,
      isBC: finalStart < 0,
      century: `${Math.ceil(Math.abs(finalStart) / 100)}`,
      centuryNumber: finalStart < 0 ? -Math.ceil(Math.abs(finalStart) / 100) : Math.ceil(finalStart / 100),
      lat: Number.isFinite(Number(lat)) && Number(lat) >= -90 && Number(lat) <= 90 ? Number(lat) : 36.8,
      lng: Number.isFinite(Number(lng)) && Number(lng) >= -180 && Number(lng) <= 180 ? Number(lng) : 44.5,
      zoom: factToEdit ? factToEdit.zoom : 8,
      tag: tag,
      collectionId: collectionId,
      isCustom: true,
    };

    onSave(item);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1250] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in text-right">
      <div
        className="relative w-full max-w-lg bg-black border border-indigo-900/90 rounded-2xl p-4 sm:p-5 shadow-[0_0_60px_rgba(79,70,229,0.35)] max-h-[92vh] overflow-y-auto text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-indigo-950 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-500/40 flex items-center justify-center shadow-[0_0_12px_rgba(79,70,229,0.3)]">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {factToEdit ? 'دەستکاریکردنی دەسەڵات و زانیاری' : 'زیادکردنی دەسەڵات و شوێنی نوێ'}
              </h3>
              <p className="text-[10px] text-indigo-300/70">
                {factToEdit
                  ? `دەستکاریکردنی #${factToEdit.num} ${factToEdit.name}`
                  : 'تۆمارکردنی خاڵ و دەسەڵاتی نوێ لەسەر نەخشەی کوردستان'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-indigo-400 hover:text-white hover:bg-indigo-950 transition-colors"
            title="داخستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {/* Name */}
          <div>
            <label className="block text-[11px] font-bold text-indigo-300 mb-1">
              ناوی دەسەڵات / فەرمانڕەوا / شوێن *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="بۆ نموونە: ئەتابەگ نەسرەدین ئەحمەد، قەڵای شێروانە، دەوڵەتی زەند..."
              className="w-full bg-[#030712] text-white px-3 py-2 rounded-xl border border-indigo-900/60 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Location / Geo description */}
          <div>
            <label className="block text-[11px] font-bold text-indigo-300 mb-1">
              پێگەی جوگرافی / شار یان ناوچە
            </label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="بۆ نموونە: ئیزە و ئەسفەهان (لوڕی گەورە)، سلێمانی، ورمێ، ئامەد..."
              className="w-full bg-[#030712] text-white px-3 py-2 rounded-xl border border-indigo-900/60 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* 100% Visual Map Location Picker with Google Maps Search */}
          <div className="p-3 rounded-xl bg-gradient-to-b from-[#060a1c] to-black border border-indigo-900/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>دیاریکردنی شوێن (بە نەخشە یان گۆگڵ ماپس)</span>
              </span>

              <button
                type="button"
                onClick={onStartPickLocation}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all cursor-pointer active:scale-95"
              >
                <Crosshair className="w-3.5 h-3.5 text-white" />
                <span>
                  {hasLocationPicked
                    ? 'گۆڕینی شوێن بە دەست لەسەر نەخشە'
                    : 'کلیک لەسەر نەخشە بۆ دەستنیشانکردن'}
                </span>
              </button>
            </div>

            {/* Google Maps Search Bar */}
            <div className="space-y-1.5 pt-1.5 border-t border-indigo-950/80">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-amber-300 flex items-center gap-1">
                  <Search className="w-3.5 h-3.5 text-amber-400" />
                  <span>گەڕان بە یارمەتی گۆگڵ ماپ (Google Maps Search):</span>
                </span>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800/50">
                  Google Maps Connected
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={placeSearchQuery}
                  onChange={(e) => handlePlaceSearch(e.target.value)}
                  placeholder="ناوی هەر شار، قەڵا، شارۆچکە، شوێنەوار یان گوندێک بنووسە (بۆ نموونە: سلێمانی، ڕواندز، ئامێدی، سنە، قەڵای هەولێر...)"
                  className="w-full bg-[#030712] text-white pl-8 pr-3 py-2 rounded-xl border border-indigo-900/90 focus:border-amber-500 focus:outline-none text-xs placeholder:text-slate-500"
                />
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {isSearchingPlaces ? (
                    <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  ) : placeSearchQuery ? (
                    <button
                      type="button"
                      onClick={() => {
                        setPlaceSearchQuery('');
                        setPlaceSearchResults([]);
                      }}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <Search className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </div>
              </div>

              {/* Search Results Dropdown List */}
              {placeSearchResults.length > 0 && (
                <div className="bg-[#030712] border border-amber-600/70 rounded-xl overflow-hidden shadow-2xl divide-y divide-indigo-950 max-h-56 overflow-y-auto animate-fade-in z-20">
                  <div className="p-1.5 bg-black/80 text-[9px] text-amber-300 font-bold flex items-center justify-between px-2.5">
                    <span>کلیک لە ناوی شوێنەکە بکە بۆ دیاریکردنی دەستبەجێ:</span>
                    <span className="font-mono text-slate-400">{placeSearchResults.length} ئەنجام دۆزرایەوە</span>
                  </div>
                  {placeSearchResults.map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => handleSelectSearchedPlace(place)}
                      className="w-full text-right p-2.5 hover:bg-amber-950/50 transition-colors flex items-start gap-2.5 cursor-pointer group"
                    >
                      <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 group-hover:scale-125 transition-transform" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white group-hover:text-amber-300 truncate">
                          {place.name}
                        </div>
                        <div className="text-[10px] text-slate-300/80 truncate mt-0.5">
                          {place.formattedAddress}
                        </div>
                        <div className="text-[9px] font-mono text-indigo-400/80 mt-0.5">
                          {place.lat.toFixed(4)}° N, {place.lng.toFixed(4)}° E
                        </div>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800/40 shrink-0 font-bold group-hover:bg-amber-500 group-hover:text-black transition-colors">
                        دەستنیشانکردن
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Visual confirmation badge */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-black border border-indigo-950 text-[11px]">
              {hasLocationPicked ? (
                <div className="flex items-center gap-2 text-emerald-400 min-w-0">
                  <div className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-500/50 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold truncate block">
                      {selectedPlaceName
                        ? `شوێن دیاریکراوە: ${selectedPlaceName}`
                        : 'شوێنی ئەم دەسەڵاتە لەسەر نەخشەی کوردستان دیاریکراوە.'}
                    </span>
                    <span className="text-[9px] font-mono text-emerald-300/80">
                      پۆوتان: {lat.toFixed(3)}° N, {lng.toFixed(3)}° E
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-300">
                  <div className="w-5 h-5 rounded-full bg-amber-950 border border-amber-500/50 flex items-center justify-center shrink-0">
                    <MapPin className="w-3 h-3 text-amber-400 animate-bounce" />
                  </div>
                  <span>
                    دەتوانیت بە سێرچی گۆگڵ ماپس لە سەرەوە یان بە دوگمەی دەستنیشانکردن لەسەر نەخشە خاڵەکە دابنێیت.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Collection & Tag Selection (First so year inputs adapt dynamically) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-indigo-300 mb-1 flex items-center gap-1">
                <Layers className="w-3 h-3 text-indigo-400" />
                کۆلێکشن
              </label>
              <select
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
                className="w-full bg-[#030712] text-indigo-200 px-2.5 py-2 rounded-xl border border-indigo-900/60 focus:border-indigo-500 text-xs"
              >
                {collections
                  .filter((c) => c.id !== 'all')
                  .map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-indigo-300 mb-1 flex items-center gap-1">
                {isPerson ? (
                  <User className="w-3 h-3 text-amber-400" />
                ) : (
                  <Shield className="w-3 h-3 text-blue-400" />
                )}
                جۆر / پۆلێن
              </label>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value as FactItem['tag'])}
                className="w-full bg-[#030712] text-indigo-200 px-2.5 py-2 rounded-xl border border-indigo-900/60 focus:border-indigo-500 text-xs font-bold"
              >
                <option value="principality">میرنشین و دەسەڵات</option>
                <option value="empire">ئیمپراتۆریەت و دەوڵەت</option>
                <option value="minister">وەزیر (وەزیرەکان)</option>
                <option value="official">کاربەدەست (کاربەدەستان و بەڕێوەبەران)</option>
                <option value="scholar">زانا (زانایان و فەیلەسوفان)</option>
                <option value="figure">کەسایەتی و پێشەوا</option>
                <option value="capital">قەڵا و پایتەخت</option>
                <option value="battle">جەنگ و ڕووداو</option>
                <option value="culture">کولتوور و شوێنەوار</option>
              </select>
            </div>
          </div>

          {/* ⏳ ساڵی سەرەتا و کۆتایی / لەدایکبوون و مردن بۆ سکرۆڵی تایملاین */}
          <div className="p-3 rounded-xl bg-gradient-to-b from-[#080d24] to-black border border-indigo-700/60 shadow-lg space-y-2.5">
            <div className="flex items-center justify-between border-b border-indigo-950 pb-2">
              <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>
                  {isPerson
                    ? 'ساڵانی ژیان (لەدایکبوون و کۆچی دوایی) بۆ تایملاین *'
                    : 'ساڵانی دەسەڵات (سەرەتا و کۆتایی) بۆ تایملاین *'}
                </span>
              </span>

              {previewYear?.isCrossEra && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                  نێوان پێش و دوای زایین (پ.ز ⟷ ز)
                </span>
              )}
            </div>

            {/* Helper guidance for cross-era entries */}
            <div className="text-[10px] text-slate-300 bg-indigo-950/40 p-2 rounded-xl border border-indigo-900/50 flex items-start gap-1.5 leading-relaxed">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>
                دەتوانیت ساڵی دەستپێک و کۆتایی بە جیا دیاری بکەیت: ئەگەر دەسەڵات یان کەسایەتییەکە کەوتووەتە نێوان پێش و دوای زایین، دەستپێک بکە بە <strong className="text-amber-300">پ.ز</strong> و کۆتایی بکە بە <strong className="text-indigo-300">ز</strong>.
              </span>
            </div>

            {yearError && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-950/80 border border-rose-500/80 text-rose-200 text-[11px]">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{yearError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Field 1: Birth year or Start year with its own era toggle */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-indigo-300 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-emerald-400" />
                    {isPerson ? 'ساڵی لەدایکبوون *' : 'ساڵی دەستپێک / دامەزراندن *'}
                  </label>
                  {/* Era Selector for Start Year */}
                  <div className="flex items-center gap-0.5 bg-black p-0.5 rounded-lg border border-indigo-900/80 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setStartEra('BC')}
                      className={`px-1.5 py-0.5 rounded transition-all cursor-pointer font-bold ${
                        startEra === 'BC'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="پێش زایین"
                    >
                      پ.ز
                    </button>
                    <button
                      type="button"
                      onClick={() => setStartEra('AD')}
                      className={`px-1.5 py-0.5 rounded transition-all cursor-pointer font-bold ${
                        startEra === 'AD'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="زایینی"
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
                    className="w-full bg-[#030712] text-white pr-2.5 pl-14 py-2 rounded-xl border border-indigo-900/80 focus:border-indigo-500 focus:outline-none text-xs font-mono"
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                    {startEra === 'BC' ? 'پ.ز' : 'زایینی'}
                  </span>
                </div>
              </div>

              {/* Field 2: Death year or End year with its own era toggle */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-indigo-300 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-rose-400" />
                    {isPerson ? 'ساڵی کۆچی دوایی' : 'ساڵی کۆتایی / ڕووخان'}
                  </label>
                  {/* Era Selector for End Year */}
                  <div className="flex items-center gap-0.5 bg-black p-0.5 rounded-lg border border-indigo-900/80 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setEndEra('BC')}
                      className={`px-1.5 py-0.5 rounded transition-all cursor-pointer font-bold ${
                        endEra === 'BC'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="پێش زایین"
                    >
                      پ.ز
                    </button>
                    <button
                      type="button"
                      onClick={() => setEndEra('AD')}
                      className={`px-1.5 py-0.5 rounded transition-all cursor-pointer font-bold ${
                        endEra === 'AD'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="زایینی"
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
                    className="w-full bg-[#030712] text-white pr-2.5 pl-14 py-2 rounded-xl border border-indigo-900/80 focus:border-indigo-500 focus:outline-none text-xs font-mono"
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                    {endEra === 'BC' ? 'پ.ز' : 'زایینی'}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Preview Display */}
            {previewYear && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-black/80 border border-indigo-900/60 text-xs">
                <span className="text-slate-400 text-[11px]">پێشبینینی مێژووی تۆمارکراو:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-300 font-mono text-xs">
                    {previewYear.label}
                  </span>
                  {previewYear.isCrossEra && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-200 border border-amber-500/40">
                      پ.ز ⟷ ز
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Full Historical Text */}
          <div>
            <label className="block text-[11px] font-bold text-indigo-300 mb-1 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              پوختەی مێژوویی و شوێنەواری
            </label>
            <textarea
              rows={3}
              value={fullText}
              onChange={(e) => setFullText(e.target.value)}
              placeholder="وەسفی مێژوویی ئەم دەسەڵاتە، ساڵانی فەرمانڕەوایی، ڕووداوەکان..."
              className="w-full bg-[#030712] text-white px-3 py-2 rounded-xl border border-indigo-900/60 focus:border-indigo-500 focus:outline-none leading-relaxed text-xs"
            />
          </div>

          {/* Additional Information Box (زانیاری زیاتر) */}
          <div className="p-2.5 rounded-xl bg-gradient-to-b from-[#050714] to-black border border-indigo-900/70 space-y-1.5">
            <label className="block text-[11px] font-bold text-amber-300 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              زانیاری زیاتر (بەڵگەنامە، دەستنووس و تێبینی تایبەت)
            </label>
            <textarea
              rows={3}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="لێرە زانیاری زیاتر و سەرچاوەکان، دەقی دەستنووس، وتەی مێژوونووسان یان تێبینی بنووسە..."
              className="w-full bg-black text-indigo-100 placeholder:text-indigo-400/30 px-3 py-2 rounded-lg border border-indigo-950 focus:border-amber-500/80 focus:outline-none text-xs leading-relaxed"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-indigo-950">
            {factToEdit && onDelete && (
              <div>
                {confirmDelete ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(factToEdit.id);
                        onClose();
                      }}
                      className="px-2 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] flex items-center gap-1 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>دڵنیام، بیسڕەوە</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-2 py-1.5 rounded-lg bg-indigo-950 text-indigo-300 text-[10px]"
                    >
                      پەشیمانبوونەوە
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="p-2 rounded-lg text-red-400 hover:text-white hover:bg-red-950/60 border border-red-950 transition-colors"
                    title="سڕینەوەی ئەم دەسەڵاتە"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 mr-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-xl bg-black border border-indigo-950 text-indigo-300 hover:text-white text-xs transition-all"
              >
                داخستن
              </button>

              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>پاشەکەوتکردن</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
