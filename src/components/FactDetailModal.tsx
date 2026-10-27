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
  Maximize2,
  Image as ImageIcon,
  Images,
  Link2,
  Plus,
  GitFork,
  Layers,
} from 'lucide-react';
import { fetchWikipediaFactInfo, WikipediaResult } from '../services/wikipediaService';
import { getLinkedFacts, LinkedFactsResult } from '../utils/factRelations';
import { FactRelationsModal } from './FactRelationsModal';
import { getCategoryInfo } from '../types/history';
import { getFactDisplayImage, getAllFactImages } from '../utils/historicalImages';
import { getOptimizedImageUrl } from '../utils/imageUtils';
import { toKurdishDigits } from '../utils/yearUtils';

const BATTLE_SCHOLAR_BG = '/src/assets/images/kurd_battle_scholar_bg_1791793720708.jpg';

interface Props {
  fact: FactItem | null;
  onClose: () => void;
  onNavigate: (dir: 'next' | 'prev') => void;
  onFlyToMap: (fact: FactItem) => void;
  isAdmin?: boolean;
  onEditFact?: (fact: FactItem) => void;
  onSaveNotes?: (factId: number, notes: string) => void;
  onOpenGallery?: () => void;
  totalFactsCount?: number;
  allFacts?: FactItem[];
  onSelectFact?: (fact: FactItem) => void;
  onSaveLinks?: (sourceFactId: number, targetFactIds: number[], parentFactId?: number) => void;
}

export const FactDetailModal: React.FC<Props> = ({
  fact,
  onClose,
  onNavigate,
  onFlyToMap,
  isAdmin = false,
  onEditFact,
  onSaveNotes,
  onOpenGallery,
  allFacts = [],
  onSelectFact,
  onSaveLinks,
  totalFactsCount = 350,
}) => {
  const [copied, setCopied] = useState(false);
  const [wikiData, setWikiData] = useState<WikipediaResult | null>(null);

  // Multi-image gallery state (up to 10 images)
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const allImages = useMemo(() => getAllFactImages(fact), [fact]);

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

  const filteredRelatedItems = useMemo(() => {
    if (relationFilter === 'all') return linkedData.allRelated;
    if (relationFilter === 'leaders') return linkedData.byCategory.leaders;
    if (relationFilter === 'scholars') return linkedData.byCategory.scholars;
    if (relationFilter === 'castles') return linkedData.byCategory.castles;
    if (relationFilter === 'battles') return linkedData.byCategory.battles;
    if (relationFilter === 'monuments') return linkedData.byCategory.monuments;
    return linkedData.byCategory.others;
  }, [linkedData, relationFilter]);

  // Fetch Wikipedia or Scholarly Dossier information when fact changes
  useEffect(() => {
    if (!fact) return;

    let isMounted = true;
    setWikiData(null);
    setActiveImageIndex(0);
    setIsEditingNotes(false);
    setNotesContent(fact.additionalNotes || '');

    fetchWikipediaFactInfo(fact.id, fact.name, fact.desc, fact.fullText)
      .then((res) => {
        if (isMounted) {
          setWikiData(res);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [fact?.id]);

  if (!fact) return null;

  const handleCopyFact = () => {
    navigator.clipboard.writeText(
      `${fact.name}\n${fact.fullText}\nشوێن: ${fact.desc}${
        fact.additionalNotes ? `\nزانیاری زیاتر: ${fact.additionalNotes}` : ''
      }\nسەرچاوە: ئینسایکلۆپیدیای دەسەڵاتە کوردییەکان`
    );
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

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-2xl animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl glass-dock-2026 rounded-3xl p-5 sm:p-7 shadow-[0_30px_90px_rgba(0,0,0,0.95)] overflow-y-auto max-h-[92vh] text-right text-slate-100 overflow-hidden custom-scrollbar animate-spatial-spring"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Background Layer: Kurdish Battles & Scholars Artwork */}
        <div className="absolute inset-0 pointer-events-none opacity-10 overflow-hidden z-0">
          <img
            src={BATTLE_SCHOLAR_BG}
            alt="Kurdish Battles & Scholars Background"
            className="w-full h-full object-cover object-center filter saturate-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#070b14]/70 via-[#070b14]/90 to-[#070b14]" />
        </div>

        {/* Header row */}
        <div className="relative z-10 flex items-center justify-between gap-3 border-b border-white/[0.08] pb-3.5 mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.1] text-amber-400 flex items-center justify-center shadow-xs shrink-0">
              <MapPin className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xs text-amber-300/90 font-mono font-medium">
              <span>
                {Number.isFinite(fact.lat) ? fact.lat.toFixed(2) : '36.80'}° N,{' '}
                {Number.isFinite(fact.lng) ? fact.lng.toFixed(2) : '44.50'}° E
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && onEditFact && (
              <button
                onClick={() => onEditFact(fact)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-amber-300 text-xs font-semibold transition-all cursor-pointer border border-white/[0.08]"
                title="دەستکاریکردنی ئەم دەسەڵاتە لەلایەن ئەدمینەوە"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>دەستکاریی ئەدمین</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] transition-all cursor-pointer border border-white/[0.08]"
              title="داخستن"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="relative z-10 space-y-4 my-2">
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold font-heading text-white leading-snug drop-shadow-xs">
              {fact.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-amber-300/90 font-medium">
              <Compass className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>پێگەی جوگرافی: {fact.desc}</span>
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

          {/* Custom / Curated Topic Images Carousel (تا ١٠ وێنە لەگەڵ تێبینی و شریتی وێنەکان) */}
          {(() => {
            if (allImages.length === 0) return null;
            const currentImg = allImages[activeImageIndex] || allImages[0];
            const hasMultiple = allImages.length > 1;

            return (
              <div className="relative rounded-2xl overflow-hidden border border-amber-500/35 bg-black/90 shadow-xl flex flex-col items-center justify-center p-2 sm:p-2.5 space-y-2">
                {/* Header with Counter Badge if multiple images */}
                {hasMultiple && (
                  <div className="w-full flex items-center justify-between px-2 pt-0.5 text-xs">
                    <span className="flex items-center gap-1.5 text-amber-300 font-bold font-heading text-[11px]">
                      <Images className="w-3.5 h-3.5 text-amber-400" />
                      <span>ئەلبوومی وێنەکان</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/35 font-mono text-[10px] font-bold">
                      وێنەی {toKurdishDigits(activeImageIndex + 1)} لە {toKurdishDigits(allImages.length)}
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
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full glass-dock-2026 text-white hover:text-amber-300 flex items-center justify-center border border-white/20 hover:border-amber-400/50 transition-all active:scale-90 cursor-pointer shadow-lg z-20"
                        title="وێنەی پێشوو"
                        aria-label="وێنەی پێشوو"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIndex((prev) => (prev + 1) % allImages.length);
                        }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full glass-dock-2026 text-white hover:text-amber-300 flex items-center justify-center border border-white/20 hover:border-amber-400/50 transition-all active:scale-90 cursor-pointer shadow-lg z-20"
                        title="وێنەی دواتر"
                        aria-label="وێنەی دواتر"
                      >
                        <ChevronLeft className="w-4 h-4" />
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
                          title={`وێنەی ${toKurdishDigits(idx + 1)}: ${imgItem.caption || fact.name}`}
                        >
                          <img
                            src={getOptimizedImageUrl(imgItem.url, 'thumb')}
                            alt=""
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                          <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] font-mono font-bold text-center text-amber-300">
                            {toKurdishDigits(idx + 1)}
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
                      title="کردنەوە لە بەشی گەلەری"
                    >
                      <Images className="w-3 h-3" />
                      <span>گەلەری</span>
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
                  <span>دەسەڵات: {wikiData.historicalDynasty}</span>
                </span>
              )}
              {wikiData.historicalCapital && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl liquid-glass-subtle text-slate-200">
                  <Landmark className="w-3.5 h-3.5 text-amber-400" />
                  <span>پایتەخت: {wikiData.historicalCapital}</span>
                </span>
              )}
              {wikiData.historicalDates && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl liquid-glass-subtle text-slate-200">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>مێژوو: {wikiData.historicalDates}</span>
                </span>
              )}
            </div>
          )}

          {/* Primary Historical Fact text */}
          <div className="p-3.5 sm:p-4 rounded-2xl liquid-glass-card text-slate-200 text-xs sm:text-[13px] leading-relaxed shadow-sm">
            <h4 className="text-xs font-bold text-amber-400 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>پوختەی مێژوویی و شوێنەواری:</span>
            </h4>
            <p className="whitespace-pre-line leading-relaxed">{fact.fullText}</p>
          </div>

          {/* بەشی بابەت و کەسایەتییە پەیوەندیدارەکان (تەنها کاتێک ئەدمینە یان بابەتی بەستراوە هەیە پیشان دەدرێت) */}
          {(isAdmin || linkedData.allRelated.length > 0 || linkedData.parents.length > 0) && (
            <div className="p-3.5 sm:p-4 rounded-2xl liquid-glass-card shadow-md space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                  <Link2 className="w-4 h-4 text-amber-400" />
                  <span>بابەت و کەسایەتییە پەیوەندیدارەکان</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold liquid-glass-subtle text-amber-300 border border-amber-400/30">
                    {linkedData.allRelated.length}
                  </span>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => setIsRelationsModalOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg liquid-glass-btn text-amber-300 hover:text-white text-[10px] font-bold transition-all cursor-pointer hover:border-amber-400/50"
                    title="تەنها ئەدمین دەتوانێت بابەتەکان ببەستێتەوە"
                  >
                    <Plus className="w-3 h-3 text-amber-400" />
                    <span>{linkedData.allRelated.length > 0 ? 'دەستکاریی بەستنەوە' : 'بەستنەوەی بابەت'}</span>
                  </button>
                )}
              </div>

            {/* Parent Entity Card (دەسەڵاتی دایک) */}
            {linkedData.parents.length > 0 && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-amber-200 min-w-0">
                  <Landmark className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-[11px] font-medium text-slate-300 shrink-0">سەر بە دەسەڵاتی دایک:</span>
                  <span className="font-bold text-amber-300 truncate">{linkedData.parents[0].name}</span>
                </div>
                <button
                  onClick={() => {
                    if (onSelectFact) onSelectFact(linkedData.parents[0]);
                  }}
                  className="px-2.5 py-1 rounded-lg liquid-glass-btn text-[10px] font-bold text-amber-300 hover:text-white cursor-pointer shrink-0"
                >
                  چوونە ناو دەسەڵات
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
                  هەموو ({linkedData.allRelated.length})
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
                    میر و سەرکردە ({linkedData.byCategory.leaders.length})
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
                    زانا و شاعیر و ئەدیبان ({linkedData.byCategory.scholars.length})
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
                    قەڵا و پایتەخت ({linkedData.byCategory.castles.length})
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
                    جەنگ و ڕووداو ({linkedData.byCategory.battles.length})
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
                    شوێنەوار ({linkedData.byCategory.monuments.length})
                  </button>
                )}
              </div>
            )}

            {/* Related Items Cards Grid */}
            {filteredRelatedItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-64 overflow-y-auto custom-scrollbar pr-0.5">
                {filteredRelatedItems.map((item) => {
                  const itemCat = getCategoryInfo(item);
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
                          title="نیشاندان لە نەخشە"
                        >
                          <MapPin className="w-2.5 h-2.5 text-amber-400" />
                          <span>نەخشە</span>
                        </button>
                        <button
                          onClick={() => {
                            if (onSelectFact) {
                              onSelectFact(item);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg liquid-glass-btn-active text-black text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                        >
                          <span>چوونە ناو بابەت</span>
                          <ChevronLeft className="w-3 h-3 text-black" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              isAdmin ? (
                <div className="py-3 px-3.5 rounded-xl liquid-glass-subtle text-slate-400 text-xs flex items-center justify-between gap-2">
                  <span>هێشتا هیچ میر، زانا، قەڵا یان ڕووداوێک بەم بابەتەوە نەبەستراوەتەوە.</span>
                  <button
                    onClick={() => setIsRelationsModalOpen(true)}
                    className="text-xs text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer shrink-0"
                  >
                    + بەستنەوەی بابەت
                  </button>
                </div>
              ) : null
            )}
          </div>
        )}

          {/* زانیاری زیاتر (Additional Information Box) */}
          <div className="p-3.5 sm:p-4 rounded-2xl liquid-glass-card shadow-md space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-white/10">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>زانیاریی زیاتر، دەستنووس و سەرچاوەکان</span>
              </div>
              <div className="flex items-center gap-1.5">
                {notesSaved && (
                  <span className="text-[10px] text-emerald-400 font-bold">
                    پاشەکەوتکرا! ✓
                  </span>
                )}
                {isAdmin && (
                  <button
                    onClick={() => setIsEditingNotes(!isEditingNotes)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg liquid-glass-btn text-amber-300 text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isEditingNotes ? 'داخستنی دەستکاری' : 'دەستکاریی تێبینی'}</span>
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
                  placeholder="وەک ئەدمین، لێرە زانیاری زیاتر، سەرچاوەی دەستنووس، کورتەی کتێب یان شیکاری بۆ ئەم دەسەڵاتە بنووسە..."
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
                    هەڵوەشاندنەوە
                  </button>
                  <button
                    onClick={handleSaveNotesInline}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl liquid-glass-btn-active text-slate-950 font-extrabold text-xs shadow-sm transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>پاشەکەوتکردن</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Display state */
              <div>
                {fact.additionalNotes && fact.additionalNotes.trim() ? (
                  <div className="p-3 rounded-xl liquid-glass-subtle text-slate-200 text-xs leading-relaxed whitespace-pre-line font-sans">
                    {fact.additionalNotes}
                  </div>
                ) : (
                  <div className="py-3 px-3.5 rounded-xl liquid-glass-subtle text-slate-400 text-xs leading-relaxed">
                    {isAdmin ? (
                      <div className="flex items-center justify-between">
                        <span>هێشتا زانیاری زیاتر بۆ ئەم بابەتە نەنووسراوە.</span>
                        <button
                          onClick={() => setIsEditingNotes(true)}
                          className="text-xs text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                        >
                          تۆمارکردنی زانیاری زیاتر
                        </button>
                      </div>
                    ) : (
                      <span>
                        زانیارییە سەرەکییەکان لە بەشەکانی سەرەوە خراونەتەڕوو. ئەدمین دەتوانێت لەم بەشەدا بەڵگەنامە و تێبینی نوێ تۆمار بکات.
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
              <span>نیشاندان لە نەخشە</span>
            </button>

            <button
              onClick={handleCopyFact}
              className="px-3 py-2 rounded-xl liquid-glass-btn text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs cursor-pointer"
              title="لەبەرگرتنەوە"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>{copied ? 'کۆپیکرا' : 'کۆپی'}</span>
            </button>
          </div>

          {/* Prev / Next Navigation with total count */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onNavigate('prev')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl liquid-glass-btn text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              <span>پێشوو</span>
            </button>
            <span className="text-xs text-amber-300 font-mono px-1 font-bold">
              {fact.num}/{totalFactsCount}
            </span>
            <button
              onClick={() => onNavigate('next')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl liquid-glass-btn text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
            >
              <span>دواتر</span>
              <ChevronLeft className="w-3.5 h-3.5" />
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
          onSaveLinks={async (sourceId, targetIds, parentId) => {
            if (isAdmin && onSaveLinks) {
              await onSaveLinks(sourceId, targetIds, parentId);
            }
          }}
        />
      )}
    </div>
  );
};
