import React, { useState, useEffect, useMemo } from 'react';
import { FactItem } from '../data/kurdishHistoryData';
import {
  X,
  MapPin,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  Compass,
  BookOpen,
  Landmark,
  Calendar,
  ShieldCheck,
  FileText,
  Edit3,
  Save,
  Hourglass,
  Camera,
  Images,
  Link2,
  Plus,
  Share2,
  ImagePlus,
  Languages,
  Loader2,
  Sparkles,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { fetchWikipediaFactInfo, WikipediaResult } from '../services/wikipediaService';
import { getLinkedFacts } from '../utils/factRelations';
import { FactRelationsModal } from './FactRelationsModal';
import { SubmitPhotoModal } from './SubmitPhotoModal';
import { getCategoryInfo, getAccessibleCategoryColor } from '../types/history';
import { getAllFactImages } from '../utils/historicalImages';
import { getOptimizedImageUrl } from '../utils/imageUtils';
import { formatDigits } from '../utils/yearUtils';
import { getShareableTopicUrl, copyTopicToClipboard } from '../utils/urlRouter';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { translateFactToEnglishDetailed, formatTranslationError } from '../services/aiTranslationService';
import { loadKurdishFactsFromCloud } from '../services/firestoreHistoryService';
import { findDuplicateNotesOwnerForFact } from '../utils/factConsistency';

interface Props {
  fact: FactItem | null;
  onClose: () => void;
  onNavigate: (dir: 'next' | 'prev') => void;
  onFlyToMap: (fact: FactItem) => void;
  isAdmin?: boolean;
  translatedFactIds?: Set<number>;
  onEditFact?: (fact: FactItem) => void;
  onSaveNotes?: (factId: number, notes: string) => void;
  totalFactsCount?: number;
  allFacts?: FactItem[];
  onSelectFact?: (fact: FactItem) => void;
  onSaveLinks?: (
    sourceFactId: number,
    targetFactIds: number[],
    parentFactId?: number,
    allyFactIds?: number[]
  ) => void;
}

export const FactDetailModal: React.FC<Props> = ({
  fact,
  onClose,
  onNavigate,
  onFlyToMap,
  isAdmin = false,
  translatedFactIds,
  onEditFact,
  onSaveNotes,
  allFacts = [],
  onSelectFact,
  onSaveLinks,
  totalFactsCount = 350,
}) => {
  const { language, isEn, dir } = useLanguage();
  const { colorMode } = useTheme();
  const isDark = colorMode === 'dark';
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [wikiData, setWikiData] = useState<WikipediaResult | null>(null);

  // Admin AI Translation state
  const [isTranslatingAi, setIsTranslatingAi] = useState(false);
  const [aiTranslateFeedback, setAiTranslateFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Multi-image gallery state (up to 10 images)
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const allImages = useMemo(() => getAllFactImages(fact), [fact]);
  const [isSubmitPhotoOpen, setIsSubmitPhotoOpen] = useState(false);

  // Additional Notes Inline Editing state for Admin
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesContent, setNotesContent] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);

  // Related Topics State & Filtering
  const [relationFilter, setRelationFilter] = useState<
    'all' | 'leaders' | 'scholars' | 'castles' | 'battles' | 'monuments' | 'others'
  >('all');
  const [isRelationsModalOpen, setIsRelationsModalOpen] = useState(false);

  const linkedData = useMemo(() => {
    return getLinkedFacts(fact, allFacts);
  }, [fact, allFacts]);

  const duplicateNotesOwner = useMemo(() => {
    if (!fact || !fact.additionalNotes?.trim() || !allFacts.length) return null;
    return findDuplicateNotesOwnerForFact(fact, fact.additionalNotes, allFacts);
  }, [fact, allFacts]);

  const filteredRelatedItems = useMemo(() => {
    if (relationFilter === 'all') return linkedData.allRelated;
    if (relationFilter === 'leaders') return linkedData.byCategory.leaders;
    if (relationFilter === 'scholars') return linkedData.byCategory.scholars;
    if (relationFilter === 'castles') return linkedData.byCategory.castles;
    if (relationFilter === 'battles') return linkedData.byCategory.battles;
    if (relationFilter === 'monuments') return linkedData.byCategory.monuments;
    return linkedData.byCategory.others;
  }, [linkedData, relationFilter]);

  // Fetch Wikipedia or Scholarly Dossier information when fact or language changes
  useEffect(() => {
    if (!fact) return;

    let isMounted = true;
    setWikiData(null);
    setActiveImageIndex(0);
    setIsEditingNotes(false);
    setNotesContent(fact.additionalNotes || '');
    setAiTranslateFeedback(null);

    fetchWikipediaFactInfo(fact.id, fact.name, fact.desc, fact.fullText, language)
      .then((res) => {
        if (isMounted) {
          setWikiData(res);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [fact?.id, language]);

  if (!fact) return null;

  const handleCopyDirectUrl = async () => {
    if (!fact) return;
    const shareUrl = getShareableTopicUrl(fact.id, language);
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2500);
      }
    } catch {
      // fallback
    }
  };

  const handleCopyFact = async () => {
    if (!fact) return;
    const ok = await copyTopicToClipboard(fact, language);
    if (!ok) {
      const shareUrl = getShareableTopicUrl(fact.id, language);
      const fallbackText = isEn
        ? `📌 "${fact.name}"\n\n${fact.fullText}\n\n📍 Location: ${fact.desc}\n🔗 Direct link: ${shareUrl}\n\nSource: kurdistan info map`
        : `📌 «${fact.name}»\n\n${fact.fullText}\n\n📍 شوێن: ${fact.desc}\n🔗 بەستەری ڕاستەوخۆ: ${shareUrl}\n\nسەرچاوە: نەخشە زانیاری کوردستان-kurdistan info map`;
      navigator.clipboard.writeText(fallbackText);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveNotesInline = () => {
    if (onSaveNotes) {
      onSaveNotes(fact.id, notesContent);
      setNotesSaved(true);
      setIsEditingNotes(false);
      setTimeout(() => setNotesSaved(false), 2500);
    }
  };

  const handleAdminAiTranslate = async () => {
    if (!isAdmin || isTranslatingAi) return;
    setIsTranslatingAi(true);
    setAiTranslateFeedback(null);
    try {
      let sourceFact: FactItem = fact;
      if (isEn) {
        const kurdishFacts = await loadKurdishFactsFromCloud();
        const match = kurdishFacts.find((kf) => kf.id === fact.id);
        if (match) {
          sourceFact = match;
        }
      }
      const outcome = await translateFactToEnglishDetailed(sourceFact);
      setAiTranslateFeedback({
        type: 'success',
        message: outcome.notesExcluded
          ? isEn
            ? `Translated to English cleanly! Unrelated additional notes${
                outcome.notesMismatchSubject ? ` (${outcome.notesMismatchSubject})` : ''
              } were excluded.`
            : `بە سەرکەوتوویی وەرگێڕدرا بۆ ئینگلیزی! تێبینییە زیادەکان هی بابەتێکی تر بوون${
                outcome.notesMismatchSubject ? ` (${outcome.notesMismatchSubject})` : ''
              } و بە خۆکاری لابران تا تێکەڵ نەبن.`
          : isEn
          ? 'Re-translated from Kurdish source and updated in English archive!'
          : 'بە سەرکەوتوویی کرایە ئینگلیزی و لە بەشی ئینگلیزیدا پاشەکەوتکرا!',
      });
    } catch (err) {
      setAiTranslateFeedback({
        type: 'error',
        message: formatTranslationError(err, language),
      });
    } finally {
      setIsTranslatingAi(false);
    }
  };

  const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  return (
    <div
      dir={dir}
      className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-xl rounded-[4px] p-4 sm:p-7 overflow-y-auto max-h-[92vh] text-start custom-scrollbar animate-modal-spring border transition-colors ${
          isDark
            ? 'liquid-glass-panel text-slate-100 shadow-[0_25px_80px_rgba(0,0,0,0.95)]'
            : 'bg-white border-slate-300 text-slate-900 shadow-2xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header row */}
        <div
          className={`relative z-10 flex flex-wrap items-center justify-between gap-2.5 border-b pb-3.5 mb-3.5 ${
            isDark ? 'border-white/[0.08]' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl border flex items-center justify-center shadow-xs shrink-0 ${
                isDark
                  ? 'bg-white/[0.06] border-white/[0.1] text-amber-400'
                  : 'bg-amber-100 border-amber-300 text-amber-800'
              }`}
            >
              <MapPin className="w-4 h-4" />
            </div>
            <div
              className={`text-xs font-mono font-medium ${
                isDark ? 'text-amber-300/90' : 'text-amber-900'
              }`}
              dir="ltr"
            >
              <span>
                {Number.isFinite(fact.lat) ? fact.lat.toFixed(2) : '36.80'}° N,{' '}
                {Number.isFinite(fact.lng) ? fact.lng.toFixed(2) : '44.50'}° E
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Shareable Direct Web Link Button */}
            <button
              onClick={handleCopyDirectUrl}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer text-xs font-bold ${
                copiedUrl
                  ? isDark
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-400 shadow-xs'
                  : isDark
                  ? 'bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border-amber-400/25 shadow-xs'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
              }`}
              title={
                isEn
                  ? 'Copy direct URL to share this historical entry'
                  : 'کۆپیکردنی بەستەری ڕاستەوخۆ (URL) بۆ ناردن بۆ هاوڕێکانت'
              }
            >
              {copiedUrl ? (
                <>
                  <Check className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />
                  <span>{isEn ? 'Link Copied!' : 'بەستەر کۆپیکرا!'}</span>
                </>
              ) : (
                <>
                  <Link2 className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
                  <span>{isEn ? 'Topic Link' : 'بەستەری بابەت'}</span>
                </>
              )}
            </button>

            {/* User contribution button for facts without image */}
            {allImages.length === 0 && (
              <button
                type="button"
                onClick={() => setIsSubmitPhotoOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${
                  isDark
                    ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/25 hover:from-amber-500/35 hover:to-amber-600/40 text-amber-300 hover:text-white border-amber-400/40'
                    : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-400'
                }`}
                title={
                  isEn
                    ? 'Help kurdistan info map by submitting an image link'
                    : 'یارمەتی -kurdistan info map- بدە بۆ ناردنی لینکی وێنە'
                }
              >
                <ImagePlus className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-800'}`} />
                <span className="hidden sm:inline">
                  {isEn
                    ? 'Submit Image Link'
                    : 'یارمەتی -kurdistan info map- بدە بۆ ناردنی لینکی وێنە'}
                </span>
                <span className="sm:hidden">{isEn ? 'Add Photo' : 'ناردنی لینکی وێنە'}</span>
              </button>
            )}

            {/* Admin AI Kurdish -> English Translation Button (only for untranslated topics) */}
            {isAdmin && !isEn && !translatedFactIds?.has(fact.id) && (
              <button
                type="button"
                onClick={handleAdminAiTranslate}
                disabled={isTranslatingAi}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer disabled:opacity-60 ${
                  isDark
                    ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-400/35'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-300'
                }`}
                title={
                  isEn
                    ? 'Re-translate from Kurdish Sorani source via AI (preserves image URLs & coordinates)'
                    : 'وەرگێڕانی ئەم بابەتە بۆ ئینگلیزی لە ڕێگەی AI (بە هەمان لینکی وێنە و پۆوتان)'
                }
              >
                {isTranslatingAi ? (
                  <Loader2 className={`w-3.5 h-3.5 animate-spin ${isDark ? 'text-amber-400' : 'text-indigo-700'}`} />
                ) : (
                  <Languages className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-indigo-700'}`} />
                )}
                <span>
                  {isTranslatingAi
                    ? isEn
                      ? 'Translating...'
                      : 'وەردەگێڕدرێت...'
                    : isEn
                    ? 'Re-translate (AI)'
                    : 'وەرگێڕان بۆ EN (AI)'}
                </span>
              </button>
            )}

            {isAdmin && onEditFact && (
              <button
                onClick={() => onEditFact(fact)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  isDark
                    ? 'bg-white/[0.06] hover:bg-white/[0.12] text-amber-300 border-white/[0.08]'
                    : 'bg-slate-100 hover:bg-amber-100 text-amber-900 border-slate-300'
                }`}
                title={isEn ? 'Edit this entry as Admin' : 'دەستکاریکردنی ئەم دەسەڵاتە لەلایەن ئەدمینەوە'}
              >
                <Edit3 className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
                <span>{isEn ? 'Admin Edit' : 'دەستکاریی ئەدمین'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                isDark
                  ? 'text-slate-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.08]'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-300'
              }`}
              title={isEn ? 'Close' : 'داخستن'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* AI Translation Feedback Toast */}
        {aiTranslateFeedback && (
          <div
            className={`relative z-10 mb-3 px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-fade-in ${
              aiTranslateFeedback.type === 'success'
                ? isDark
                  ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : isDark
                ? 'bg-rose-500/15 border-rose-400/40 text-rose-200'
                : 'bg-rose-50 border-rose-300 text-rose-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>{aiTranslateFeedback.message}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="relative z-10 space-y-4 my-2">
          <div>
            <h3
              className={`text-lg sm:text-xl font-extrabold font-heading leading-snug ${
                isDark ? 'text-white drop-shadow-xs' : 'text-slate-900'
              }`}
            >
              {fact.name}
            </h3>
            <div
              className={`flex items-center gap-1.5 mt-1.5 text-xs font-medium ${
                isDark ? 'text-amber-300/90' : 'text-amber-900'
              }`}
            >
              <Compass className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
              <span>
                {isEn ? 'Location:' : 'پێگەی جوگرافی:'} {fact.desc}
              </span>
            </div>

            {/* Unboxed Metadata: Century · Year · Era */}
            <div
              className={`flex flex-wrap items-center gap-2 mt-2.5 text-xs ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              {fact.century && (
                <div
                  className={`flex items-center gap-1 font-medium ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  <Hourglass className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
                  <span>{fact.century}</span>
                </div>
              )}
              {fact.year && (
                <>
                  <span aria-hidden="true" className={`font-mono ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>·</span>
                  <div
                    className={`flex items-center gap-1 font-mono tabular-nums font-bold ${
                      isDark ? 'text-amber-300' : 'text-amber-900'
                    }`}
                  >
                    <Calendar className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
                    <span>{fact.year}</span>
                  </div>
                </>
              )}
              {fact.eraName && (
                <>
                  <span aria-hidden="true" className={`font-mono ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>·</span>
                  <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                    {fact.eraName}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Custom / Curated Topic Images Carousel or Community Contribution Callout if no image */}
          {(() => {
            if (allImages.length === 0) {
              return (
                <div
                  className={`relative rounded-2xl p-4 sm:p-5 border border-dashed text-center flex flex-col items-center justify-center gap-2.5 my-2 shadow-inner ${
                    isDark
                      ? 'border-amber-500/40 bg-gradient-to-b from-amber-500/[0.08] to-amber-500/[0.02]'
                      : 'border-amber-500/50 bg-amber-50/70'
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${
                      isDark
                        ? 'bg-amber-500/20 border-amber-400/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                        : 'bg-amber-100 border-amber-300 text-amber-800 shadow-xs'
                    }`}
                  >
                    <ImagePlus className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className={`text-xs sm:text-sm font-black font-heading ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {isEn
                        ? 'No archival image has been added to this entry yet'
                        : 'ئەم بابەتە هێشتا وێنەی فەرمی بۆ دانەنراوە'}
                    </h4>
                    <p className={`text-[11px] max-w-sm mx-auto leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {isEn
                        ? 'Help enrich the historical atlas by submitting a verified image link for this topic.'
                        : 'دەتوانیت هاوکار بیت لە دەوڵەمەندکردنی نەخشە بە دانانی بەستەری وێنەی شایستە بۆ ئەم دەسەڵاتە.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSubmitPhotoOpen(true)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer active:scale-95 mt-1 ${
                      isDark
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.35)]'
                        : 'preserve-contrast bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-800 hover:to-amber-700 text-white shadow-md'
                    }`}
                  >
                    <ImagePlus className="w-4 h-4 stroke-[2.5]" />
                    <span>
                      {isEn
                        ? 'Submit a Photo Link'
                        : '(یارمەتی -kurdistan info map-بدە بۆ ناردنی لینکی وێنە)'}
                    </span>
                  </button>
                </div>
              );
            }
            const currentImg = allImages[activeImageIndex] || allImages[0];
            const hasMultiple = allImages.length > 1;

            return (
              <div className="preserve-contrast relative rounded-2xl overflow-hidden border border-amber-500/35 bg-black/90 shadow-xl flex flex-col items-center justify-center p-2 sm:p-2.5 space-y-2">
                {/* Header with Counter Badge if multiple images */}
                {hasMultiple && (
                  <div className="w-full flex items-center justify-between px-2 pt-0.5 text-xs">
                    <span className="flex items-center gap-1.5 text-amber-300 font-bold font-heading text-[11px]">
                      <Images className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isEn ? 'Photos' : 'وێنەکان'}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/35 font-mono text-[10px] font-bold">
                      {isEn
                        ? `Photo ${activeImageIndex + 1} of ${allImages.length}`
                        : `وێنەی ${formatDigits(activeImageIndex + 1, language)} لە ${formatDigits(allImages.length, language)}`}
                    </span>
                  </div>
                )}

                {/* Main View Area */}
                <div className="relative w-full overflow-hidden rounded-xl bg-black/95 flex items-center justify-center min-h-[180px] max-h-72 sm:max-h-84 group">
                  <img
                    key={currentImg.url}
                    src={getOptimizedImageUrl(currentImg.url, 'full')}
                    alt={currentImg.caption || fact.name}
                    loading="eager"
                    decoding="async"
                    className="max-h-72 sm:max-h-84 max-w-full w-auto h-auto object-contain mx-auto rounded-xl transition-all duration-300 shadow-md animate-fade-in"
                  />

                  {/* Previous / Next Navigation Arrows */}
                  {hasMultiple && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
                        }}
                        className="absolute start-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/80 hover:bg-black text-white hover:text-amber-300 flex items-center justify-center border border-white/25 hover:border-amber-400/60 transition-all active:scale-90 cursor-pointer shadow-lg z-20"
                        title={isEn ? 'Previous photo' : 'وێنەی پێشوو'}
                        aria-label={isEn ? 'Previous photo' : 'وێنەی پێشوو'}
                      >
                        <PrevIcon className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIndex((prev) => (prev + 1) % allImages.length);
                        }}
                        className="absolute end-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/80 hover:bg-black text-white hover:text-amber-300 flex items-center justify-center border border-white/25 hover:border-amber-400/60 transition-all active:scale-90 cursor-pointer shadow-lg z-20"
                        title={isEn ? 'Next photo' : 'وێنەی دواتر'}
                        aria-label={isEn ? 'Next photo' : 'وێنەی دواتر'}
                      >
                        <NextIcon className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnail Strip for Multi-Images */}
                {hasMultiple && (
                  <div className="w-full flex items-center gap-1.5 overflow-x-auto py-1 px-1 scrollbar-none snap-x touch-pan-x">
                    {allImages.map((imgItem, idx) => {
                      const isSelected = idx === activeImageIndex;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveImageIndex(idx)}
                          className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all duration-200 cursor-pointer snap-start ${
                            isSelected
                              ? 'border-amber-400 ring-2 ring-amber-400/70 scale-105 shadow-[0_0_12px_rgba(245,158,11,0.5)] z-10'
                              : 'border-white/20 hover:border-amber-400/60 opacity-70 hover:opacity-100'
                          }`}
                          title={
                            isEn
                              ? `Photo ${idx + 1}: ${imgItem.caption || fact.name}`
                              : `وێنەی ${formatDigits(idx + 1, language)}: ${imgItem.caption || fact.name}`
                          }
                        >
                          <img
                            src={getOptimizedImageUrl(imgItem.url, 'thumb')}
                            alt=""
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                          <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] font-mono font-bold text-center text-amber-300">
                            {formatDigits(idx + 1, language)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Bottom Caption Bar */}
                <div className="w-full p-2 px-3 rounded-xl bg-white/10 border border-white/10 text-amber-200 text-xs flex items-center justify-between gap-2 shadow-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <Camera className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-medium text-[11px] sm:text-xs truncate">
                      {currentImg.caption || (activeImageIndex === 0 ? fact.imageCaption : '') || fact.name}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Historical Meta Badges if available */}
          {(wikiData?.historicalDates ||
            wikiData?.historicalCapital ||
            wikiData?.historicalDynasty) && (
            <div className="flex flex-wrap gap-2 py-1 text-xs">
              {wikiData.historicalDynasty && (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border ${
                    isDark
                      ? 'liquid-glass-subtle text-slate-200 border-white/10'
                      : 'bg-slate-100 text-slate-800 border-slate-200'
                  }`}
                >
                  <ShieldCheck className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
                  <span>
                    {isEn ? 'Polity:' : 'دەسەڵات:'} {wikiData.historicalDynasty}
                  </span>
                </span>
              )}
              {wikiData.historicalCapital && (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border ${
                    isDark
                      ? 'liquid-glass-subtle text-slate-200 border-white/10'
                      : 'bg-slate-100 text-slate-800 border-slate-200'
                  }`}
                >
                  <Landmark className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
                  <span>
                    {isEn ? 'Capital:' : 'پایتەخت:'} {wikiData.historicalCapital}
                  </span>
                </span>
              )}
              {wikiData.historicalDates && (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border ${
                    isDark
                      ? 'liquid-glass-subtle text-slate-200 border-white/10'
                      : 'bg-slate-100 text-slate-800 border-slate-200'
                  }`}
                >
                  <Calendar className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
                  <span>
                    {isEn ? 'Period:' : 'مێژوو:'} {wikiData.historicalDates}
                  </span>
                </span>
              )}
            </div>
          )}

          {/* Primary Historical Fact text */}
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border text-xs sm:text-[13px] leading-relaxed shadow-sm ${
              isDark
                ? 'liquid-glass-card text-slate-200 border-white/10'
                : 'bg-slate-50 text-slate-800 border-slate-200'
            }`}
          >
            <h4
              className={`text-xs font-bold mb-1.5 flex items-center gap-1.5 ${
                isDark ? 'text-amber-400' : 'text-amber-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>
                {isEn ? 'Historical & Archaeological Overview:' : 'پوختەی مێژوویی و شوێنەواری:'}
              </span>
            </h4>
            <p className="whitespace-pre-line leading-relaxed font-normal">{fact.fullText}</p>
          </div>

          {/* Related Topics & Figures Section */}
          {(isAdmin || linkedData.allRelated.length > 0 || linkedData.parents.length > 0) && (
            <div
              className={`p-3.5 sm:p-4 rounded-2xl border shadow-md space-y-3 ${
                isDark
                  ? 'liquid-glass-card border-white/10'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div
                className={`flex items-center justify-between pb-2 border-b ${
                  isDark ? 'border-white/10' : 'border-slate-200'
                }`}
              >
                <div
                  className={`flex items-center gap-2 font-bold text-xs ${
                    isDark ? 'text-amber-300' : 'text-amber-900'
                  }`}
                >
                  <Link2 className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
                  <span>
                    {isEn ? 'Related Topics & Figures' : 'بابەت و کەسایەتییە پەیوەندیدارەکان'}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      isDark
                        ? 'liquid-glass-subtle text-amber-300 border-amber-400/30'
                        : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}
                  >
                    {formatDigits(linkedData.allRelated.length, language)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button
                      onClick={() => setIsRelationsModalOpen(true)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                        isDark
                          ? 'liquid-glass-btn text-amber-300 hover:text-white border-white/10 hover:border-amber-400/50'
                          : 'bg-white hover:bg-amber-50 text-amber-900 border-amber-300'
                      }`}
                      title={
                        isEn
                          ? 'Only admins can link related topics'
                          : 'تەنها ئەدمین دەتوانێت بابەتەکان ببەستێتەوە'
                      }
                    >
                      <Plus className={`w-3 h-3 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
                      <span>
                        {linkedData.allRelated.length > 0
                          ? isEn
                            ? 'Edit Links'
                            : 'دەستکاریی بەستنەوە'
                          : isEn
                          ? 'Link Topics'
                          : 'بەستنەوەی بابەت'}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Parent Entity Card */}
              {linkedData.parents.length > 0 && (
                <div
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                    isDark
                      ? 'bg-amber-500/10 border-amber-500/25'
                      : 'bg-amber-50 border-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Landmark className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
                    <span
                      className={`text-[11px] font-medium shrink-0 ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      {isEn ? 'Parent Polity:' : 'سەر بە دەسەڵاتی دایک:'}
                    </span>
                    <span
                      className={`font-bold truncate ${
                        isDark ? 'text-amber-300' : 'text-amber-950'
                      }`}
                    >
                      {linkedData.parents[0].name}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (onSelectFact) onSelectFact(linkedData.parents[0]);
                    }}
                    className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold cursor-pointer shrink-0 ${
                      isDark
                        ? 'liquid-glass-btn text-amber-300 hover:text-white border-white/10'
                        : 'bg-white hover:bg-amber-100 text-amber-900 border-amber-300'
                    }`}
                  >
                    {isEn ? 'Open Polity' : 'چوونە ناو دەسەڵات'}
                  </button>
                </div>
              )}

              {/* Relation Filter Tabs */}
              {linkedData.allRelated.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px]">
                  <button
                    onClick={() => setRelationFilter('all')}
                    className={`px-2.5 py-1 rounded-lg shrink-0 transition-all cursor-pointer font-bold ${
                      relationFilter === 'all'
                        ? 'liquid-glass-btn-active'
                        : isDark
                        ? 'liquid-glass-subtle text-slate-300 hover:text-white'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {isEn
                      ? `All (${linkedData.allRelated.length})`
                      : `هەموو (${formatDigits(linkedData.allRelated.length, language)})`}
                  </button>
                  {linkedData.byCategory.leaders.length > 0 && (
                    <button
                      onClick={() => setRelationFilter('leaders')}
                      className={`px-2.5 py-1 rounded-lg shrink-0 transition-all cursor-pointer font-bold ${
                        relationFilter === 'leaders'
                          ? 'liquid-glass-btn-active'
                          : isDark
                          ? 'liquid-glass-subtle text-rose-300 hover:text-rose-200'
                          : 'bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100'
                      }`}
                    >
                      {isEn
                        ? `Leaders (${linkedData.byCategory.leaders.length})`
                        : `میر و سەرکردە (${formatDigits(linkedData.byCategory.leaders.length, language)})`}
                    </button>
                  )}
                  {linkedData.byCategory.scholars.length > 0 && (
                    <button
                      onClick={() => setRelationFilter('scholars')}
                      className={`px-2.5 py-1 rounded-lg shrink-0 transition-all cursor-pointer font-bold ${
                        relationFilter === 'scholars'
                          ? 'liquid-glass-btn-active'
                          : isDark
                          ? 'liquid-glass-subtle text-cyan-300 hover:text-cyan-200'
                          : 'bg-cyan-50 border border-cyan-200 text-cyan-800 hover:bg-cyan-100'
                      }`}
                    >
                      {isEn
                        ? `Scholars & Poets (${linkedData.byCategory.scholars.length})`
                        : `زانا و شاعیر و ئەدیبان (${formatDigits(linkedData.byCategory.scholars.length, language)})`}
                    </button>
                  )}
                  {linkedData.byCategory.castles.length > 0 && (
                    <button
                      onClick={() => setRelationFilter('castles')}
                      className={`px-2.5 py-1 rounded-lg shrink-0 transition-all cursor-pointer font-bold ${
                        relationFilter === 'castles'
                          ? 'liquid-glass-btn-active'
                          : isDark
                          ? 'liquid-glass-subtle text-purple-300 hover:text-purple-200'
                          : 'bg-purple-50 border border-purple-200 text-purple-800 hover:bg-purple-100'
                      }`}
                    >
                      {isEn
                        ? `Castles & Capitals (${linkedData.byCategory.castles.length})`
                        : `قەڵا و پایتەخت (${formatDigits(linkedData.byCategory.castles.length, language)})`}
                    </button>
                  )}
                  {linkedData.byCategory.battles.length > 0 && (
                    <button
                      onClick={() => setRelationFilter('battles')}
                      className={`px-2.5 py-1 rounded-lg shrink-0 transition-all cursor-pointer font-bold ${
                        relationFilter === 'battles'
                          ? 'liquid-glass-btn-active'
                          : isDark
                          ? 'liquid-glass-subtle text-red-300 hover:text-red-200'
                          : 'bg-red-50 border border-red-200 text-red-800 hover:bg-red-100'
                      }`}
                    >
                      {isEn
                        ? `Battles & Events (${linkedData.byCategory.battles.length})`
                        : `جەنگ و ڕووداو (${formatDigits(linkedData.byCategory.battles.length, language)})`}
                    </button>
                  )}
                  {linkedData.byCategory.monuments.length > 0 && (
                    <button
                      onClick={() => setRelationFilter('monuments')}
                      className={`px-2.5 py-1 rounded-lg shrink-0 transition-all cursor-pointer font-bold ${
                        relationFilter === 'monuments'
                          ? 'liquid-glass-btn-active'
                          : isDark
                          ? 'liquid-glass-subtle text-emerald-300 hover:text-emerald-200'
                          : 'bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                      }`}
                    >
                      {isEn
                        ? `Monuments (${linkedData.byCategory.monuments.length})`
                        : `شوێنەوار (${formatDigits(linkedData.byCategory.monuments.length, language)})`}
                    </button>
                  )}
                </div>
              )}

              {/* Related Items Cards Grid */}
              {filteredRelatedItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-64 overflow-y-auto custom-scrollbar pe-0.5">
                  {filteredRelatedItems.map((item) => {
                    const itemCat = getCategoryInfo(item, language);
                    const catColor = getAccessibleCategoryColor(itemCat.color, isDark);
                    return (
                      <div
                        key={item.id}
                        className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between gap-2 group ${
                          isDark
                            ? 'liquid-glass-subtle border-white/5 hover:border-amber-400/30'
                            : 'bg-white border-slate-200 hover:border-amber-500/50 shadow-xs'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded-md font-bold"
                              style={{
                                backgroundColor: isDark ? `${itemCat.color}20` : `${catColor}14`,
                                color: catColor,
                                border: `1px solid ${catColor}45`,
                              }}
                            >
                              {itemCat.name}
                            </span>
                            {(item.year || item.century) && (
                              <span className={`text-[9px] font-mono ${isDark ? 'text-amber-200/80' : 'text-amber-800'}`}>
                                {item.year || item.century}
                              </span>
                            )}
                          </div>
                          <h5
                            className={`font-bold text-xs transition-colors truncate ${
                              isDark
                                ? 'text-white group-hover:text-amber-300'
                                : 'text-slate-900 group-hover:text-amber-800'
                            }`}
                          >
                            {item.name}
                          </h5>
                          <p
                            className={`text-[11px] line-clamp-2 mt-0.5 leading-relaxed ${
                              isDark ? 'text-slate-300' : 'text-slate-600'
                            }`}
                          >
                            {item.desc}
                          </p>
                        </div>

                        <div
                          className={`flex items-center justify-end gap-1.5 pt-1.5 border-t ${
                            isDark ? 'border-white/5' : 'border-slate-100'
                          }`}
                        >
                          <button
                            onClick={() => {
                              onFlyToMap(item);
                              onClose();
                            }}
                            className={`px-2 py-1 rounded-lg text-[10px] flex items-center gap-1 transition-colors cursor-pointer border ${
                              isDark
                                ? 'liquid-glass-btn text-slate-300 hover:text-white border-white/10'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                            }`}
                            title={isEn ? 'Show on map' : 'نیشاندان لە نەخشە'}
                          >
                            <MapPin className={`w-2.5 h-2.5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
                            <span>{isEn ? 'Map' : 'نەخشە'}</span>
                          </button>
                          <button
                            onClick={() => {
                              if (onSelectFact) {
                                onSelectFact(item);
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg liquid-glass-btn-active text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                          >
                            <span>{isEn ? 'Open Entry' : 'چوونە ناو بابەت'}</span>
                            <NextIcon className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                isAdmin ? (
                  <div
                    className={`py-3 px-3.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                      isDark
                        ? 'liquid-glass-subtle text-slate-400 border-white/10'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <span>
                      {isEn
                        ? 'No rulers, scholars, castles, or battles are linked to this topic yet.'
                        : 'هێشتا هیچ میر، زانا، قەڵا یان ڕووداوێک بەم بابەتەوە نەبەستراوەتەوە.'}
                    </span>
                    <button
                      onClick={() => setIsRelationsModalOpen(true)}
                      className={`text-xs font-bold underline cursor-pointer shrink-0 ${
                        isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-800 hover:text-amber-950'
                      }`}
                    >
                      {isEn ? '+ Link Topics' : '+ بەستنەوەی بابەت'}
                    </button>
                  </div>
                ) : null
              )}
            </div>
          )}

          {/* Additional Information Box */}
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border shadow-md space-y-2.5 ${
              isDark
                ? 'liquid-glass-card border-white/10'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div
              className={`flex items-center justify-between pb-1 border-b ${
                isDark ? 'border-white/10' : 'border-slate-200'
              }`}
            >
              <div
                className={`flex items-center gap-1.5 font-bold text-xs ${
                  isDark ? 'text-amber-300' : 'text-amber-900'
                }`}
              >
                <FileText className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
                <span>
                  {isEn
                    ? 'Additional Notes, Manuscripts & Sources'
                    : 'زانیاریی زیاتر، دەستنووس و سەرچاوەکان'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {notesSaved && (
                  <span
                    className={`text-[10px] font-bold ${
                      isDark ? 'text-emerald-400' : 'text-emerald-700'
                    }`}
                  >
                    {isEn ? 'Saved! ✓' : 'پاشەکەوتکرا! ✓'}
                  </span>
                )}
                {isAdmin && (
                  <button
                    onClick={() => setIsEditingNotes(!isEditingNotes)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-colors cursor-pointer ${
                      isDark
                        ? 'liquid-glass-btn text-amber-300 border-white/10'
                        : 'bg-white hover:bg-amber-50 text-amber-900 border-amber-300'
                    }`}
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>
                      {isEditingNotes
                        ? isEn
                          ? 'Close Editor'
                          : 'داخستنی دەستکاری'
                        : isEn
                        ? 'Edit Notes'
                        : 'دەستکاریی تێبینی'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Editing state for Admin */}
            {isEditingNotes ? (
              <div className="space-y-2.5 pt-1">
                <textarea
                  rows={4}
                  value={notesContent}
                  onChange={(e) => setNotesContent(e.target.value)}
                  placeholder={
                    isEn
                      ? 'As Admin, enter archival sources, manuscript excerpts, historical analysis, or bibliography...'
                      : 'وەک ئەدمین، لێرە زانیاری زیاتر، سەرچاوەی دەستنووس، کورتەی کتێب یان شیکاری بۆ ئەم دەسەڵاتە بنووسە...'
                  }
                  className={`w-full p-3 rounded-xl text-xs leading-relaxed border focus:outline-none ${
                    isDark
                      ? 'liquid-glass-input text-slate-100 placeholder:text-slate-500 border-white/15'
                      : 'bg-white text-slate-900 placeholder:text-slate-400 border-slate-300 focus:border-amber-600'
                  }`}
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setIsEditingNotes(false);
                      setNotesContent(fact.additionalNotes || '');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs cursor-pointer border font-semibold ${
                      isDark
                        ? 'liquid-glass-btn text-slate-300 border-white/10'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    {isEn ? 'Cancel' : 'هەڵوەشاندنەوە'}
                  </button>
                  <button
                    onClick={handleSaveNotesInline}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl liquid-glass-btn-active font-extrabold text-xs shadow-sm transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Save' : 'پاشەکەوتکردن'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Display state */
              <div className="space-y-2">
                {isAdmin && duplicateNotesOwner && fact.additionalNotes && fact.additionalNotes.trim() && (
                  <div
                    className={`p-2.5 rounded-xl border text-[11px] flex flex-wrap items-center justify-between gap-2 ${
                      isDark
                        ? 'bg-amber-500/15 border-amber-400/45 text-amber-200'
                        : 'bg-amber-50 border-amber-400 text-amber-950'
                    }`}
                  >
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
                      <span className="leading-relaxed">
                        {isEn
                          ? `Mismatch detected: these notes match "${duplicateNotesOwner.name}" and are automatically excluded from AI translation.`
                          : `ئاگاداری: ئەم تێبینییە زیادەیە هەمان دەقی بابەتی «${duplicateNotesOwner.name}»ـە؛ لە وەرگێڕانی ئینگلیزیدا بە خۆکاری لادەبرێت.`}
                      </span>
                    </div>
                    {onSaveNotes && (
                      <button
                        type="button"
                        onClick={() => {
                          onSaveNotes(fact.id, '');
                          setNotesContent('');
                          setNotesSaved(true);
                          setTimeout(() => setNotesSaved(false), 2500);
                        }}
                        className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] flex items-center gap-1 cursor-pointer shrink-0 transition-colors ${
                          isDark
                            ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                            : 'preserve-contrast bg-amber-700 hover:bg-amber-800 text-white'
                        }`}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>{isEn ? 'Clear Mismatched Notes' : 'پاککردنەوەی تێبینیی تێکەڵبوو'}</span>
                      </button>
                    )}
                  </div>
                )}

                {fact.additionalNotes && fact.additionalNotes.trim() ? (
                  <div
                    className={`p-3 rounded-xl border text-xs leading-relaxed whitespace-pre-line font-sans font-normal ${
                      isDark
                        ? 'liquid-glass-subtle text-slate-200 border-white/10'
                        : 'bg-white text-slate-800 border-slate-200'
                    }`}
                  >
                    {fact.additionalNotes}
                  </div>
                ) : (
                  <div
                    className={`py-3 px-3.5 rounded-xl border text-xs leading-relaxed ${
                      isDark
                        ? 'liquid-glass-subtle text-slate-400 border-white/10'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {isAdmin ? (
                      <div className="flex items-center justify-between gap-2">
                        <span>
                          {isEn
                            ? 'No additional notes or sources recorded yet.'
                            : 'هێشتا زانیاری زیاتر بۆ ئەم بابەتە نەنووسراوە.'}
                        </span>
                        <button
                          onClick={() => setIsEditingNotes(true)}
                          className={`text-xs font-bold underline cursor-pointer shrink-0 ${
                            isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-800 hover:text-amber-950'
                          }`}
                        >
                          {isEn ? 'Add Notes' : 'تۆمارکردنی زانیاری زیاتر'}
                        </button>
                      </div>
                    ) : (
                      <span>
                        {isEn
                          ? 'Primary historical details are presented above. Administrators can add manuscript references and commentary in this section.'
                          : 'زانیارییە سەرەکییەکان لە بەشەکانی سەرەوە خراونەتەڕوو. ئەدمین دەتوانێت لەم بەشەدا بەڵگەنامە و تێبینی نوێ تۆمار بکات.'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div
          className={`relative z-10 flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t mt-4 ${
            isDark ? 'border-white/10' : 'border-slate-200'
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                onFlyToMap(fact);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl liquid-glass-btn-active font-extrabold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{isEn ? 'Show on Map' : 'نیشاندان لە نەخشە'}</span>
            </button>

            <button
              onClick={handleCopyDirectUrl}
              className={`px-3 py-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                copiedUrl
                  ? isDark
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-400'
                  : isDark
                  ? 'liquid-glass-btn text-amber-300 hover:text-white border-white/10'
                  : 'bg-slate-100 hover:bg-amber-50 text-amber-900 border-slate-300'
              }`}
              title={isEn ? 'Copy direct link for this topic' : 'کۆپیکردنی بەستەری وێب بۆ ئەم بابەتە'}
            >
              {copiedUrl ? (
                <Check className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />
              ) : (
                <Share2 className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
              )}
              <span>
                {copiedUrl
                  ? isEn
                    ? 'Link Copied'
                    : 'بەستەر کۆپیکرا'
                  : isEn
                  ? 'Share Link'
                  : 'بەستەری بابەت'}
              </span>
            </button>

            <button
              onClick={handleCopyFact}
              className={`px-3 py-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs cursor-pointer ${
                isDark
                  ? 'liquid-glass-btn text-slate-300 hover:text-white border-white/10'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
              title={isEn ? 'Copy full historical entry text' : 'لەبەرگرتنەوەی تەواوی دەق و زانیارییەکان'}
            >
              {copied ? (
                <Check className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />
              ) : (
                <Copy className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
              )}
              <span>
                {copied
                  ? isEn
                    ? 'Text Copied'
                    : 'دەق کۆپیکرا'
                  : isEn
                  ? 'Copy Text'
                  : 'کۆپیکردنی دەق'}
              </span>
            </button>
          </div>

          {/* Prev / Next Navigation with total count */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onNavigate('prev')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                isDark
                  ? 'liquid-glass-btn text-slate-300 hover:text-white border-white/10'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
            >
              <PrevIcon className="w-3.5 h-3.5" />
              <span>{isEn ? 'Prev' : 'پێشوو'}</span>
            </button>
            <span
              className={`text-xs font-mono px-1 font-bold ${
                isDark ? 'text-amber-300' : 'text-amber-900'
              }`}
            >
              {formatDigits(fact.num, language)}/{formatDigits(totalFactsCount, language)}
            </span>
            <button
              onClick={() => onNavigate('next')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                isDark
                  ? 'liquid-glass-btn text-slate-300 hover:text-white border-white/10'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
            >
              <span>{isEn ? 'Next' : 'دواتر'}</span>
              <NextIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Fact Relations Linker Modal (Only for Admin) */}
      {isAdmin && isRelationsModalOpen && (
        <FactRelationsModal
          isOpen={isRelationsModalOpen}
          onClose={() => setIsRelationsModalOpen(false)}
          currentFact={fact}
          allFacts={allFacts}
          onSaveLinks={async (sourceId, targetIds, parentId, allyIds) => {
            if (isAdmin && onSaveLinks) {
              await onSaveLinks(sourceId, targetIds, parentId, allyIds);
            }
          }}
        />
      )}

      {/* Submit Photo Suggestion Modal for facts without image */}
      {isSubmitPhotoOpen && fact && (
        <SubmitPhotoModal
          fact={fact}
          isOpen={isSubmitPhotoOpen}
          onClose={() => setIsSubmitPhotoOpen(false)}
        />
      )}
    </div>
  );
};

export default FactDetailModal;

