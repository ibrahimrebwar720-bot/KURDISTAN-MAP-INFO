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
import { getCategoryInfo } from '../types/history';
import { getAllFactImages } from '../utils/historicalImages';
import { getOptimizedImageUrl } from '../utils/imageUtils';
import { formatDigits } from '../utils/yearUtils';
import { getShareableTopicUrl, copyTopicToClipboard } from '../utils/urlRouter';
import { useLanguage } from '../context/LanguageContext';
import { translateFactToEnglishDetailed } from '../services/aiTranslationService';
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
  onOpenGallery?: () => void;
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
  onOpenGallery,
  allFacts = [],
  onSelectFact,
  onSaveLinks,
  totalFactsCount = 350,
}) => {
  const { language, isEn, dir } = useLanguage();
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
        message: err instanceof Error ? err.message : isEn ? 'Translation failed' : 'هەڵەیەک لە وەرگێڕاندا ڕوویدا',
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
      className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-5 bg-black/85 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl liquid-glass-panel rounded-[4px] p-4 sm:p-7 shadow-[0_25px_80px_rgba(0,0,0,0.95)] overflow-y-auto max-h-[92vh] text-start text-slate-100 custom-scrollbar animate-modal-spring"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header row */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5 border-b border-white/[0.08] pb-3.5 mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.1] text-amber-400 flex items-center justify-center shadow-xs shrink-0">
              <MapPin className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xs text-amber-300/90 font-mono font-medium" dir="ltr">
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
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs'
                  : 'bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border-amber-400/25 shadow-xs'
              }`}
              title={
                isEn
                  ? 'Copy direct URL to share this historical entry'
                  : 'کۆپیکردنی بەستەری ڕاستەوخۆ (URL) بۆ ناردن بۆ هاوڕێکانت'
              }
            >
              {copiedUrl ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isEn ? 'Link Copied!' : 'بەستەر کۆپیکرا!'}</span>
                </>
              ) : (
                <>
                  <Link2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isEn ? 'Topic Link' : 'بەستەری بابەت'}</span>
                </>
              )}
            </button>

            {/* User contribution button for facts without image */}
            {allImages.length === 0 && (
              <button
                type="button"
                onClick={() => setIsSubmitPhotoOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/25 hover:from-amber-500/35 hover:to-amber-600/40 text-amber-300 hover:text-white border border-amber-400/40 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                title={
                  isEn
                    ? 'Help kurdistan info map by submitting an image link'
                    : 'یارمەتی -kurdistan info map- بدە بۆ ناردنی لینکی وێنە'
                }
              >
                <ImagePlus className="w-3.5 h-3.5 text-amber-400 shrink-0" />
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-400/35 text-xs font-bold transition-all cursor-pointer disabled:opacity-60"
                title={
                  isEn
                    ? 'Re-translate from Kurdish Sorani source via AI (preserves image URLs & coordinates)'
                    : 'وەرگێڕانی ئەم بابەتە بۆ ئینگلیزی لە ڕێگەی AI (بە هەمان لینکی وێنە و پۆوتان)'
                }
              >
                {isTranslatingAi ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                ) : (
                  <Languages className="w-3.5 h-3.5 text-amber-400" />
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-amber-300 text-xs font-semibold transition-all cursor-pointer border border-white/[0.08]"
                title={isEn ? 'Edit this entry as Admin' : 'دەستکاریکردنی ئەم دەسەڵاتە لەلایەن ئەدمینەوە'}
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>{isEn ? 'Admin Edit' : 'دەستکاریی ئەدمین'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] transition-all cursor-pointer border border-white/[0.08]"
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
                ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
                : 'bg-rose-500/15 border-rose-400/40 text-rose-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>{aiTranslateFeedback.message}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="relative z-10 space-y-4 my-2">
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold font-heading text-white leading-snug drop-shadow-xs">
              {fact.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-amber-300/90 font-medium">
              <Compass className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>
                {isEn ? 'Location:' : 'پێگەی جوگرافی:'} {fact.desc}
              </span>
            </div>

            {/* Unboxed Metadata: Century · Year · Era */}
            <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs text-slate-400">
              {fact.century && (
                <div className="flex items-center gap-1 text-slate-300 font-medium">
                  <Hourglass className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{fact.century}</span>
                </div>
              )}
              {fact.year && (
                <>
                  <span aria-hidden="true" className="text-slate-600 font-mono">·</span>
                  <div className="flex items-center gap-1 text-amber-300 font-mono tabular-nums font-bold">
                    <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{fact.year}</span>
                  </div>
                </>
              )}
              {fact.eraName && (
                <>
                  <span aria-hidden="true" className="text-slate-600 font-mono">·</span>
                  <span className="text-slate-400 text-xs font-semibold">{fact.eraName}</span>
                </>
              )}
            </div>
          </div>

          {/* Custom / Curated Topic Images Carousel or Community Contribution Callout if no image */}
          {(() => {
            if (allImages.length === 0) {
              return (
                <div className="relative rounded-2xl p-4 sm:p-5 border border-dashed border-amber-500/40 bg-gradient-to-b from-amber-500/[0.08] to-amber-500/[0.02] text-center flex flex-col items-center justify-center gap-2.5 my-2 shadow-inner">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                    <ImagePlus className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs sm:text-sm font-black text-white font-heading">
                      {isEn
                        ? 'No archival image has been added to this entry yet'
                        : 'ئەم بابەتە هێشتا وێنەی فەرمی بۆ دانەنراوە'}
                    </h4>
                    <p className="text-[11px] text-slate-300 max-w-sm mx-auto leading-relaxed">
                      {isEn
                        ? 'Help enrich the historical atlas by submitting a verified image link for this topic.'
                        : 'دەتوانیت هاوکار بیت لە دەوڵەمەندکردنی نەخشە بە دانانی بەستەری وێنەی شایستە بۆ ئەم دەسەڵاتە.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSubmitPhotoOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all cursor-pointer active:scale-95 mt-1"
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
              <div className="relative rounded-2xl overflow-hidden border border-amber-500/35 bg-black/90 shadow-xl flex flex-col items-center justify-center p-2 sm:p-2.5 space-y-2">
                {/* Header with Counter Badge if multiple images */}
                {hasMultiple && (
                  <div className="w-full flex items-center justify-between px-2 pt-0.5 text-xs">
                    <span className="flex items-center gap-1.5 text-amber-300 font-bold font-heading text-[11px]">
                      <Images className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isEn ? 'Photo Gallery' : 'ئەلبوومی وێنەکان'}</span>
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
                        className="absolute start-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full glass-dock-2026 text-white hover:text-amber-300 flex items-center justify-center border border-white/20 hover:border-amber-400/50 transition-all active:scale-90 cursor-pointer shadow-lg z-20"
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
                        className="absolute end-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full glass-dock-2026 text-white hover:text-amber-300 flex items-center justify-center border border-white/20 hover:border-amber-400/50 transition-all active:scale-90 cursor-pointer shadow-lg z-20"
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

                {/* Bottom Caption & Gallery Launch Bar */}
                <div className="w-full p-2 px-3 rounded-xl liquid-glass-subtle text-amber-200 text-xs flex items-center justify-between gap-2 shadow-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <Camera className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-medium text-[11px] sm:text-xs truncate">
                      {currentImg.caption || (activeImageIndex === 0 ? fact.imageCaption : '') || fact.name}
                    </span>
                  </div>
                  {onOpenGallery && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                        onOpenGallery();
                      }}
                      className="px-2.5 py-1 rounded-lg liquid-glass-btn text-amber-300 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                      title={isEn ? 'Open in Photo Gallery' : 'کردنەوە لە بەشی گەلەری'}
                    >
                      <Images className="w-3 h-3" />
                      <span>{isEn ? 'Gallery' : 'گەلەری'}</span>
                    </button>
                  )}
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
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl liquid-glass-subtle text-slate-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {isEn ? 'Polity:' : 'دەسەڵات:'} {wikiData.historicalDynasty}
                  </span>
                </span>
              )}
              {wikiData.historicalCapital && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl liquid-glass-subtle text-slate-200">
                  <Landmark className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {isEn ? 'Capital:' : 'پایتەخت:'} {wikiData.historicalCapital}
                  </span>
                </span>
              )}
              {wikiData.historicalDates && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl liquid-glass-subtle text-slate-200">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {isEn ? 'Period:' : 'مێژوو:'} {wikiData.historicalDates}
                  </span>
                </span>
              )}
            </div>
          )}

          {/* Primary Historical Fact text */}
          <div className="p-3.5 sm:p-4 rounded-2xl liquid-glass-card text-slate-200 text-xs sm:text-[13px] leading-relaxed shadow-sm">
            <h4 className="text-xs font-bold text-amber-400 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>
                {isEn ? 'Historical & Archaeological Overview:' : 'پوختەی مێژوویی و شوێنەواری:'}
              </span>
            </h4>
            <p className="whitespace-pre-line leading-relaxed">{fact.fullText}</p>
          </div>

          {/* Related Topics & Figures Section */}
          {(isAdmin || linkedData.allRelated.length > 0 || linkedData.parents.length > 0) && (
            <div className="p-3.5 sm:p-4 rounded-2xl liquid-glass-card shadow-md space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                  <Link2 className="w-4 h-4 text-amber-400" />
                  <span>
                    {isEn ? 'Related Topics & Figures' : 'بابەت و کەسایەتییە پەیوەندیدارەکان'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold liquid-glass-subtle text-amber-300 border border-amber-400/30">
                    {formatDigits(linkedData.allRelated.length, language)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button
                      onClick={() => setIsRelationsModalOpen(true)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg liquid-glass-btn text-amber-300 hover:text-white text-[10px] font-bold transition-all cursor-pointer hover:border-amber-400/50"
                      title={
                        isEn
                          ? 'Only admins can link related topics'
                          : 'تەنها ئەدمین دەتوانێت بابەتەکان ببەستێتەوە'
                      }
                    >
                      <Plus className="w-3 h-3 text-amber-400" />
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
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-amber-200 min-w-0">
                    <Landmark className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-[11px] font-medium text-slate-300 shrink-0">
                      {isEn ? 'Parent Polity:' : 'سەر بە دەسەڵاتی دایک:'}
                    </span>
                    <span className="font-bold text-amber-300 truncate">{linkedData.parents[0].name}</span>
                  </div>
                  <button
                    onClick={() => {
                      if (onSelectFact) onSelectFact(linkedData.parents[0]);
                    }}
                    className="px-2.5 py-1 rounded-lg liquid-glass-btn text-[10px] font-bold text-amber-300 hover:text-white cursor-pointer shrink-0"
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
                        ? 'liquid-glass-btn-active text-black'
                        : 'liquid-glass-subtle text-slate-300 hover:text-white'
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
                          ? 'liquid-glass-btn-active text-black'
                          : 'liquid-glass-subtle text-rose-300 hover:text-rose-200'
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
                          ? 'liquid-glass-btn-active text-black'
                          : 'liquid-glass-subtle text-cyan-300 hover:text-cyan-200'
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
                          ? 'liquid-glass-btn-active text-black'
                          : 'liquid-glass-subtle text-purple-300 hover:text-purple-200'
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
                          ? 'liquid-glass-btn-active text-black'
                          : 'liquid-glass-subtle text-red-300 hover:text-red-200'
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
                          ? 'liquid-glass-btn-active text-black'
                          : 'liquid-glass-subtle text-emerald-300 hover:text-emerald-200'
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
                    return (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl liquid-glass-subtle border border-white/5 hover:border-amber-400/30 transition-all flex flex-col justify-between gap-2 group"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span
                              className="text-[9px] px-1.5 py-0.2 rounded-md font-bold"
                              style={{
                                backgroundColor: `${itemCat.color}20`,
                                color: itemCat.color,
                                border: `1px solid ${itemCat.color}40`,
                              }}
                            >
                              {itemCat.name}
                            </span>
                            {(item.year || item.century) && (
                              <span className="text-[9px] text-amber-200/80 font-mono">
                                {item.year || item.century}
                              </span>
                            )}
                          </div>
                          <h5 className="font-bold text-xs text-white group-hover:text-amber-300 transition-colors truncate">
                            {item.name}
                          </h5>
                          <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5 leading-relaxed">
                            {item.desc}
                          </p>
                        </div>

                        <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-white/5">
                          <button
                            onClick={() => {
                              onFlyToMap(item);
                              onClose();
                            }}
                            className="px-2 py-1 rounded-lg liquid-glass-btn text-[10px] text-slate-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                            title={isEn ? 'Show on map' : 'نیشاندان لە نەخشە'}
                          >
                            <MapPin className="w-2.5 h-2.5 text-amber-400" />
                            <span>{isEn ? 'Map' : 'نەخشە'}</span>
                          </button>
                          <button
                            onClick={() => {
                              if (onSelectFact) {
                                onSelectFact(item);
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg liquid-glass-btn-active text-black text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                          >
                            <span>{isEn ? 'Open Entry' : 'چوونە ناو بابەت'}</span>
                            <NextIcon className="w-3 h-3 text-black" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                isAdmin ? (
                  <div className="py-3 px-3.5 rounded-xl liquid-glass-subtle text-slate-400 text-xs flex items-center justify-between gap-2">
                    <span>
                      {isEn
                        ? 'No rulers, scholars, castles, or battles are linked to this topic yet.'
                        : 'هێشتا هیچ میر، زانا، قەڵا یان ڕووداوێک بەم بابەتەوە نەبەستراوەتەوە.'}
                    </span>
                    <button
                      onClick={() => setIsRelationsModalOpen(true)}
                      className="text-xs text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer shrink-0"
                    >
                      {isEn ? '+ Link Topics' : '+ بەستنەوەی بابەت'}
                    </button>
                  </div>
                ) : null
              )}
            </div>
          )}

          {/* Additional Information Box */}
          <div className="p-3.5 sm:p-4 rounded-2xl liquid-glass-card shadow-md space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-white/10">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>
                  {isEn
                    ? 'Additional Notes, Manuscripts & Sources'
                    : 'زانیاریی زیاتر، دەستنووس و سەرچاوەکان'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {notesSaved && (
                  <span className="text-[10px] text-emerald-400 font-bold">
                    {isEn ? 'Saved! ✓' : 'پاشەکەوتکرا! ✓'}
                  </span>
                )}
                {isAdmin && (
                  <button
                    onClick={() => setIsEditingNotes(!isEditingNotes)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg liquid-glass-btn text-amber-300 text-[10px] font-bold transition-colors cursor-pointer"
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
                  className="w-full liquid-glass-input text-slate-100 placeholder:text-slate-500 p-3 rounded-xl text-xs leading-relaxed"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setIsEditingNotes(false);
                      setNotesContent(fact.additionalNotes || '');
                    }}
                    className="px-3 py-1.5 rounded-xl liquid-glass-btn text-slate-300 text-xs cursor-pointer"
                  >
                    {isEn ? 'Cancel' : 'هەڵوەشاندنەوە'}
                  </button>
                  <button
                    onClick={handleSaveNotesInline}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl liquid-glass-btn-active text-slate-950 font-extrabold text-xs shadow-sm transition-all cursor-pointer"
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
                  <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-400/45 text-amber-200 text-[11px] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
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
                        className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-[11px] flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>{isEn ? 'Clear Mismatched Notes' : 'پاککردنەوەی تێبینیی تێکەڵبوو'}</span>
                      </button>
                    )}
                  </div>
                )}

                {fact.additionalNotes && fact.additionalNotes.trim() ? (
                  <div className="p-3 rounded-xl liquid-glass-subtle text-slate-200 text-xs leading-relaxed whitespace-pre-line font-sans">
                    {fact.additionalNotes}
                  </div>
                ) : (
                  <div className="py-3 px-3.5 rounded-xl liquid-glass-subtle text-slate-400 text-xs leading-relaxed">
                    {isAdmin ? (
                      <div className="flex items-center justify-between gap-2">
                        <span>
                          {isEn
                            ? 'No additional notes or sources recorded yet.'
                            : 'هێشتا زانیاری زیاتر بۆ ئەم بابەتە نەنووسراوە.'}
                        </span>
                        <button
                          onClick={() => setIsEditingNotes(true)}
                          className="text-xs text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer shrink-0"
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
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-white/10 mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                onFlyToMap(fact);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl liquid-glass-btn-active text-slate-950 font-extrabold text-xs shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all cursor-pointer active:scale-95"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{isEn ? 'Show on Map' : 'نیشاندان لە نەخشە'}</span>
            </button>

            <button
              onClick={handleCopyDirectUrl}
              className={`px-3 py-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                copiedUrl
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'liquid-glass-btn text-amber-300 hover:text-white'
              }`}
              title={isEn ? 'Copy direct link for this topic' : 'کۆپیکردنی بەستەری وێب بۆ ئەم بابەتە'}
            >
              {copiedUrl ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Share2 className="w-3.5 h-3.5 text-amber-400" />
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
              className="px-3 py-2 rounded-xl liquid-glass-btn text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs cursor-pointer"
              title={isEn ? 'Copy full historical entry text' : 'لەبەرگرتنەوەی تەواوی دەق و زانیارییەکان'}
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400" />
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
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl liquid-glass-btn text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
            >
              <PrevIcon className="w-3.5 h-3.5" />
              <span>{isEn ? 'Prev' : 'پێشوو'}</span>
            </button>
            <span className="text-xs text-amber-300 font-mono px-1 font-bold">
              {formatDigits(fact.num, language)}/{formatDigits(totalFactsCount, language)}
            </span>
            <button
              onClick={() => onNavigate('next')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl liquid-glass-btn text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
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

