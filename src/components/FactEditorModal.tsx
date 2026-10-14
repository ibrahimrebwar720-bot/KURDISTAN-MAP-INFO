import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Compass,
  Sliders,
  ChevronDown,
  Info,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  Eye,
} from 'lucide-react';
import {
  compressImageFile,
  KURDISH_HISTORICAL_IMAGE_PRESETS,
} from '../utils/imageUtils';
import {
  getFactYearSpan,
  formatKurdishYearRange,
  normalizeYearString,
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
  const [showManualCoords, setShowManualCoords] = useState(false);
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

  // Topic Image & Caption state
  const [imageUrl, setImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setImageUploadError(null);
    try {
      const compressedDataUrl = await compressImageFile(file);
      setImageUrl(compressedDataUrl);
      if (!imageCaption.trim() && name.trim()) {
        setImageCaption(`وێنەی تایبەت بە «${name.trim()}»`);
      }
    } catch (err: any) {
      setImageUploadError(err?.message || 'هەڵە لە بارکردنی وێنەکەدا ڕوویدا');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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
      setShowManualCoords(false);
      setImageUploadError(null);

      if (factToEdit) {
        setName(factToEdit.name);
        setDesc(factToEdit.desc);
        setSelectedPlaceName(factToEdit.desc || null);
        setFullText(factToEdit.fullText);
        setAdditionalNotes(factToEdit.additionalNotes || '');
        setImageUrl(factToEdit.imageUrl || '');
        setImageCaption(factToEdit.imageCaption || '');
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
        setImageUrl('');
        setImageCaption('');
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
      imageUrl: imageUrl.trim() || undefined,
      imageCaption: imageCaption.trim() || undefined,
      isCustom: true,
    };

    onSave(item);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[1250] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in text-right"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-[#070b14]/85 border border-amber-500/25 rounded-3xl p-5 sm:p-7 shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_50px_rgba(245,158,11,0.12)] backdrop-blur-2xl max-h-[92vh] flex flex-col text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-4 mb-5 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 via-amber-900/30 to-black border border-amber-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.25)] shrink-0">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  {factToEdit ? 'دەستکاریکردنی دەسەڵات و بابەت' : 'زیادکردنی بابەت و شوێنی نوێ'}
                </h3>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {factToEdit ? `#${factToEdit.num}` : 'نوێ'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {factToEdit
                  ? `دەستکاریکردنی زانیارییەکانی «${factToEdit.name}» لەسەر نەخشە و تایملاین`
                  : 'تۆمارکردنی دەسەڵات، کەسایەتی، قەڵا یان ڕووداوێکی نوێ بە دیاریکردنی ورد'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
            title="داخستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body with Refined Structure */}
        <form onSubmit={handleSubmit} className="overflow-y-auto pr-1 space-y-5 text-xs flex-1 custom-scrollbar">
          
          {/* SECTION 1: ناو و پۆلێنبەندی (Basic Information & Classification) */}
          <div className="bg-[#0e1526]/90 border border-slate-800/90 hover:border-amber-500/30 rounded-2xl p-4 sm:p-5 transition-colors space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[11px] font-mono font-bold text-amber-300">
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
                className="w-full bg-[#050812] text-white px-3.5 py-2.5 rounded-xl border border-slate-700/80 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 focus:outline-none text-sm font-semibold placeholder:text-slate-500 transition-all"
              />
            </div>

            {/* Collection & Tag Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Collection */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>کۆلێکشن (دەستە)</span>
                </label>
                <div className="relative">
                  <select
                    value={collectionId}
                    onChange={(e) => setCollectionId(e.target.value)}
                    className="w-full appearance-none bg-[#050812] text-slate-200 px-3.5 py-2.5 rounded-xl border border-slate-700/80 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 focus:outline-none text-xs font-medium cursor-pointer"
                  >
                    {collections
                      .filter((c) => c.id !== 'all')
                      .map((col) => (
                        <option key={col.id} value={col.id} className="bg-[#090d16] text-white">
                          {col.name}
                        </option>
                      ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Tag / Category */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                  {isPerson ? (
                    <User className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>جۆر و پۆلێن (پێگەی مێژوویی)</span>
                </label>
                <div className="relative">
                  <select
                    value={tag}
                    onChange={(e) => setTag(e.target.value as FactItem['tag'])}
                    className="w-full appearance-none bg-[#050812] text-amber-300 font-bold px-3.5 py-2.5 rounded-xl border border-slate-700/80 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 focus:outline-none text-xs cursor-pointer"
                  >
                    <option value="principality" className="bg-[#090d16] text-white">میرنشین و دەسەڵات</option>
                    <option value="empire" className="bg-[#090d16] text-white">ئیمپراتۆریەت و دەوڵەت</option>
                    <option value="minister" className="bg-[#090d16] text-white">وەزیر (وەزیرە مێژووییەکان)</option>
                    <option value="official" className="bg-[#090d16] text-white">کاربەدەست و بەڕێوەبەر</option>
                    <option value="scholar" className="bg-[#090d16] text-white">زانا و فەیلەسوف</option>
                    <option value="figure" className="bg-[#090d16] text-white">کەسایەتی و پێشەوا</option>
                    <option value="capital" className="bg-[#090d16] text-white">قەڵا و پایتەخت</option>
                    <option value="battle" className="bg-[#090d16] text-white">جەنگ و پەیماننامە</option>
                    <option value="culture" className="bg-[#090d16] text-white">کولتوور و شوێنەوار</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: شوێن و جوگرافیا (Geographic Location & Google Maps) */}
          <div className="bg-[#0e1526]/90 border border-slate-800/90 hover:border-amber-500/30 rounded-2xl p-4 sm:p-5 transition-colors space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[11px] font-mono font-bold text-amber-300">
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
                className="w-full bg-[#050812] text-white px-3.5 py-2.5 rounded-xl border border-slate-700/80 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 focus:outline-none text-xs placeholder:text-slate-500"
              />
            </div>

            {/* Google Maps Search Bar + Direct Map Picker */}
            <div className="p-3.5 rounded-2xl bg-black/50 border border-slate-800/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-amber-400" />
                  <span>گەڕان لە گۆگڵ ماپ بۆ دۆزینەوەی دەستبەجێ:</span>
                </span>

                <button
                  type="button"
                  onClick={onStartPickLocation}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
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
                  className="w-full bg-[#050812] text-white pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-700/90 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 focus:outline-none text-xs placeholder:text-slate-500"
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
                <div className="bg-[#090d16] border border-amber-500/50 rounded-2xl overflow-hidden shadow-2xl divide-y divide-slate-800 max-h-56 overflow-y-auto animate-fade-in">
                  <div className="p-2 bg-black/80 text-[10px] text-amber-300 font-bold flex items-center justify-between px-3">
                    <span>کلیک لە ناوی شوێنەکە بکە بۆ دیاریکردنی دەستبەجێ:</span>
                    <span className="font-mono text-slate-400">{placeSearchResults.length} ئەنجام</span>
                  </div>
                  {placeSearchResults.map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => handleSelectSearchedPlace(place)}
                      className="w-full text-right p-3 hover:bg-amber-500/10 transition-colors flex items-start gap-3 cursor-pointer group"
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
                      <span className="text-[10px] px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0 font-bold group-hover:bg-amber-400 group-hover:text-black transition-colors">
                        دەستنیشانکردن
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Visual Confirmation Badge */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#050812] border border-slate-800 text-xs">
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

          {/* SECTION 3: ساڵنامە و تایملاین (Timeline & Eras - BC/AD & Cross-Era) */}
          <div className="bg-gradient-to-b from-[#10172a] to-[#0a0f1d] border border-amber-500/40 rounded-2xl p-4 sm:p-5 transition-colors space-y-4 shadow-[0_0_30px_rgba(245,158,11,0.06)]">
            <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[11px] font-mono font-bold text-amber-300">
                  03
                </span>
                <span>
                  {isPerson
                    ? 'ساڵانی ژیان (لەدایکبوون و کۆچی دوایی) بۆ تایملاین'
                    : 'ساڵانی دەسەڵات (سەرەتا و کۆتایی) بۆ تایملاین'}
                </span>
              </span>

              {previewYear?.isCrossEra && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-amber-500/25 to-amber-600/30 text-amber-300 border border-amber-500/50 shadow-sm animate-pulse">
                  نێوان پێش و دوای زایین (پ.ز ⟷ ز)
                </span>
              )}
            </div>

            {/* Helper guidance for cross-era and single-year entries */}
            <div className="text-[11px] text-slate-300 bg-black/40 p-3 rounded-xl border border-slate-800 flex items-start gap-2 leading-relaxed">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                دەتوانیت ساڵی دەستپێک و کۆتایی بە ئازادی دیاری بکەیت. ئەگەر کەسایەتی یان دەسەڵاتەکە کەوتووەتە نێوان پێش زایین و دوای زایین، بژاردەی یەکەم بکە بە <strong className="text-amber-400 font-bold">پ.ز</strong> و دووەم بکە بە <strong className="text-amber-300 font-bold">ز</strong>.
              </span>
            </div>

            {yearError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/80 border border-rose-500/80 text-rose-200 text-xs font-medium">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{yearError}</span>
              </div>
            )}

            {/* Year Inputs with Segmented BC/AD Era Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Field 1: Birth / Start Year */}
              <div className="bg-[#050812] border border-slate-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isPerson ? 'ساڵی لەدایکبوون' : 'ساڵی دەستپێک / دامەزراندن'}</span>
                    <span className="text-amber-400">*</span>
                  </label>

                  {/* Segmented Era Switcher */}
                  <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-700 text-xs" dir="ltr">
                    <button
                      type="button"
                      onClick={() => setStartEra('BC')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-bold ${
                        startEra === 'BC'
                          ? 'bg-amber-500 text-black shadow-sm font-extrabold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      پ.ز
                    </button>
                    <button
                      type="button"
                      onClick={() => setStartEra('AD')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-bold ${
                        startEra === 'AD'
                          ? 'bg-amber-400/25 text-amber-300 border border-amber-500/40 font-extrabold'
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
                    placeholder={startEra === 'BC' ? 'بۆ نموونە: 150 (پێش زایین)' : 'بۆ نموونە: 1514 (زایینی)'}
                    className="w-full bg-[#0a0f1d] text-white pr-3 pl-16 py-2.5 rounded-xl border border-slate-700 focus:border-amber-400 focus:outline-none text-xs font-mono font-bold"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-amber-400/80 pointer-events-none">
                    {startEra === 'BC' ? 'پێش زایین' : 'زایینی'}
                  </span>
                </div>
              </div>

              {/* Field 2: Death / End Year */}
              <div className="bg-[#050812] border border-slate-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{isPerson ? 'ساڵی کۆچی دوایی' : 'ساڵی کۆتایی / ڕووخان'}</span>
                  </label>

                  {/* Segmented Era Switcher */}
                  <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-700 text-xs" dir="ltr">
                    <button
                      type="button"
                      onClick={() => setEndEra('BC')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-bold ${
                        endEra === 'BC'
                          ? 'bg-amber-500 text-black shadow-sm font-extrabold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      پ.ز
                    </button>
                    <button
                      type="button"
                      onClick={() => setEndEra('AD')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-bold ${
                        endEra === 'AD'
                          ? 'bg-amber-400/25 text-amber-300 border border-amber-500/40 font-extrabold'
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
                    placeholder={endEra === 'BC' ? 'بۆ نموونە: 40 (پێش زایین)' : 'بۆ نموونە: 1851 (زایینی)'}
                    className="w-full bg-[#0a0f1d] text-white pr-3 pl-16 py-2.5 rounded-xl border border-slate-700 focus:border-amber-400 focus:outline-none text-xs font-mono font-bold"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-amber-400/80 pointer-events-none">
                    {endEra === 'BC' ? 'پێش زایین' : 'زایینی'}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Interactive Kurdish Year Preview Badge */}
            {previewYear && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/70 border border-amber-500/30 text-xs">
                <span className="text-slate-300 text-xs flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>پێشبینینی ڕێکەوتی تۆمارکراو:</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-amber-300 font-mono text-sm tracking-wider">
                    {previewYear.label}
                  </span>
                  {previewYear.isCrossEra && (
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-500/25 text-amber-200 border border-amber-500/50">
                      پ.ز ⟷ ز
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: دەقی مێژوویی و بەڵگەنامەکان (Narrative & Archives) */}
          <div className="bg-[#0e1526]/90 border border-slate-800/90 hover:border-amber-500/30 rounded-2xl p-4 sm:p-5 transition-colors space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[11px] font-mono font-bold text-amber-300">
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
                className="w-full bg-[#050812] text-white px-3.5 py-2.5 rounded-xl border border-slate-700/80 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 focus:outline-none leading-relaxed text-xs placeholder:text-slate-500"
              />
            </div>

            {/* Additional notes, manuscripts & references */}
            <div className="p-3.5 rounded-2xl bg-black/60 border border-amber-500/20 space-y-2">
              <label className="block text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>زانیاریی زیاتر، دەستنووس، وتەی مێژوونووسان و سەرچاوەکان</span>
              </label>
              <textarea
                rows={3}
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="لێرە زانیارییە زیاترەکان، دەقی دەستنووس و وتەی مێژوونووسان، شوێنەوارە پارێزراوەکان و سەرچاوەی کتێبەکان تۆمار بکە..."
                className="w-full bg-[#050812] text-slate-200 placeholder:text-slate-500 px-3.5 py-2 rounded-xl border border-slate-800 focus:border-amber-400 focus:outline-none text-xs leading-relaxed"
              />
            </div>
          </div>

          {/* SECTION 5: وێنە و ڕوونکردنەوەی وێنە (وێنەی تایبەت بە بابەت و زانیاری بچووک لەسەری) */}
          <div className="bg-[#0e1526]/90 border border-slate-800/90 hover:border-amber-500/30 rounded-2xl p-4 sm:p-5 transition-colors space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[11px] font-mono font-bold text-amber-300">
                  05
                </span>
                <span>وێنەی تایبەت بە بابەت و زانیاری لەسەری</span>
              </span>
              <span className="text-[11px] text-amber-300/80">یەک وێنە + نوسینی بچووک</span>
            </div>

            {/* Explanatory note */}
            <div className="text-[11px] text-slate-300 bg-black/40 p-3 rounded-xl border border-slate-800 flex items-start gap-2 leading-relaxed">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                دەتوانیت یەک وێنەی تایبەت بەم بابەتە دابنێیت (لە مۆبایلەکەت، کۆمپیوتەرەکەت یان بە بەستەر). کاتێک بەکارهێنەر لەسەر نەخشە پۆینتەکە دادەگرێت، ئەم وێنەیە لەگەڵ کورتەی بابەت و ئەو زانیارییە بچووکەی لەسەری دەینووسیت بە جوانترین شێواز نیشان دەدرێت.
              </span>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageFileChange}
            />

            {/* Image Selection Buttons & URL Input */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Upload Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-98 disabled:opacity-50"
                >
                  {isUploadingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  ) : (
                    <Upload className="w-4 h-4 text-amber-400" />
                  )}
                  <span>{isUploadingImage ? 'کەمکردنەوەی قەبارە و بارکردن...' : 'هەڵبژاردنی وێنە لە مۆبایل / کۆمپیوتەر'}</span>
                </button>

                {/* Preset Historical Images Dropdown */}
                <div className="p-1 rounded-xl bg-black/50 border border-slate-800 text-[11px]">
                  <span className="text-slate-400 px-2 block mb-1">وێنەی نموونەیی ئامادەکراو:</span>
                  <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-0.5">
                    {KURDISH_HISTORICAL_IMAGE_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setImageUrl(preset.url);
                          if (!imageCaption.trim()) {
                            setImageCaption(preset.caption);
                          }
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-amber-500/20 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 text-slate-300 text-[10px] whitespace-nowrap transition-colors cursor-pointer"
                        title={preset.caption}
                      >
                        {preset.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* URL Input */}
              <div className="relative">
                <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span>یان بەستەری ڕاستەوخۆی وێنە لە ئینتەرنێتەوە (Image URL):</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/kurdish_history_image.jpg"
                    className="w-full bg-[#050812] text-white px-3.5 py-2.5 rounded-xl border border-slate-700/80 focus:border-amber-400 focus:outline-none text-xs font-mono placeholder:text-slate-600 pl-10"
                    dir="ltr"
                  />
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                      title="سڕینەوەی بەستەر"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {imageUploadError && (
                <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/60 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{imageUploadError}</span>
                </div>
              )}

              {/* Image Preview & Caption Field */}
              {imageUrl && (
                <div className="p-3.5 rounded-2xl bg-black/60 border border-amber-500/30 space-y-3 animate-fade-in shadow-md">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>پێشبینینی وێنەکە</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl('');
                        setImageCaption('');
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/80 text-rose-300 text-[10px] cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>لابردنی وێنە</span>
                    </button>
                  </div>

                  <div className="relative rounded-xl overflow-hidden border border-amber-500/20 max-h-56 bg-slate-950 flex items-center justify-center">
                    <img
                      src={imageUrl}
                      alt={imageCaption || name || 'Topic Image Preview'}
                      className="w-full h-48 object-cover object-center"
                      onError={() => setImageUploadError('نەتوانرا وێنەکە لەم بەستەرە باربکرێت، تکایە دڵنیابە لە دروستی بەستەرەکە.')}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
                    {imageCaption && (
                      <div className="absolute bottom-2 right-2 left-2 p-1.5 px-2.5 rounded-lg bg-black/80 border border-amber-500/30 text-amber-200 text-[11px] backdrop-blur-md flex items-center gap-1.5">
                        <ImageIcon className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="truncate">{imageCaption}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Small Caption / Description about Image */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span>زانیاری لەسەر وێنەکە (بە نوسینێکی بچووک نیشان دەدرێت)</span>
                </label>
                <input
                  type="text"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  placeholder="بۆ نموونە: دیمەنی قەڵاکە لە سەرەتای سەدەی بیستەم، یان نیگاری پاشا لەسەر بەردی دێرین..."
                  className="w-full bg-[#050812] text-white px-3.5 py-2.5 rounded-xl border border-slate-700/80 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 focus:outline-none text-xs placeholder:text-slate-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  ئەم نوسینە بە قەبارەیەکی بچووک و جوان لە ژێر یان لەسەر وێنەکە لە کاتی داگرتنی پۆینت نیشان دەدرێت.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons Bar */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800/90 shrink-0">
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
                      className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs cursor-pointer"
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
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
              >
                داخستن
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs shadow-[0_0_25px_rgba(245,158,11,0.35)] transition-all cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>پاشەکەوتکردنی زانیارییەکان</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
