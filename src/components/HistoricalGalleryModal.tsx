import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { FactItem } from '../data/kurdishHistoryData';
import {
  X,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  MapPin,
  Calendar,
  Sparkles,
  Camera,
  Layers,
  Clock,
  RotateCcw,
  Plus,
} from 'lucide-react';

export interface GalleryItem {
  id: string | number;
  title: string;
  url: string;
  caption: string;
  year?: string;
  eraName?: string;
  tag?: string;
  fact?: FactItem;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  facts: FactItem[];
  onFlyToFact?: (fact: FactItem) => void;
  initialIndex?: number;
}

export const HistoricalGalleryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  facts,
  onFlyToFact,
  initialIndex = 0,
}) => {
  // Only display images added by the user in facts (no extra mock or preset images)
  const galleryItems: GalleryItem[] = useMemo(() => {
    const list: GalleryItem[] = [];

    facts.forEach((fact) => {
      if (fact.imageUrl && fact.imageUrl.trim()) {
        list.push({
          id: `fact-${fact.id}`,
          title: fact.name,
          url: fact.imageUrl.trim(),
          caption: fact.imageCaption || fact.desc || fact.name,
          year: fact.year || fact.century,
          eraName: fact.eraName,
          tag: fact.tag,
          fact: fact,
        });
      }
    });

    return list;
  }, [facts]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [progress, setProgress] = useState(0); // 0 to 100%
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync initialIndex when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialIndex >= 0 && initialIndex < galleryItems.length) {
        setCurrentIndex(initialIndex);
      } else {
        setCurrentIndex(0);
      }
      setIsAutoPlay(true);
      setProgress(0);
    }
  }, [isOpen, initialIndex, galleryItems.length]);

  const total = galleryItems.length;
  const currentItem = galleryItems[currentIndex] || galleryItems[0];

  // Next / Previous Navigation
  const handleNext = useCallback(() => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev + 1) % total);
    setProgress(0);
  }, [total]);

  const handlePrev = useCallback(() => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
    setProgress(0);
  }, [total]);

  // Automatic Display Timer (6 Seconds: ٦ چرکە جارێک وێنەکە تۆماتیکی بگۆڕێت)
  useEffect(() => {
    if (!isOpen || !isAutoPlay || total <= 1) {
      setProgress(0);
      return;
    }

    const intervalMs = 6000; // 6 seconds
    const tickMs = 50; // Update progress bar every 50ms
    const step = (tickMs / intervalMs) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev + step >= 100) {
          handleNext();
          return 0;
        }
        return prev + step;
      });
    }, tickMs);

    return () => clearInterval(timer);
  }, [isOpen, isAutoPlay, total, handleNext]);

  // Keyboard navigation: Escape to close, Arrows to navigate, Space to toggle autoplay
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          }
          setIsFullscreen(false);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsAutoPlay((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, onClose, handleNext, handlePrev]);

  // Toggle Fullscreen Mode
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {
          setIsFullscreen(!isFullscreen);
        });
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {
          setIsFullscreen(false);
        });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 flex flex-col bg-[#04060c]/95 backdrop-blur-2xl text-slate-100 select-none overflow-hidden ${
        isFullscreen ? 'p-2 sm:p-4' : 'p-2 sm:p-6'
      }`}
      dir="rtl"
    >
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none z-0" />

      {/* Top Header Bar */}
      <div className="relative z-20 flex items-center justify-between pb-3 border-b border-amber-500/20 shrink-0">
        {/* Title and Kurdish Sun Emblem */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)] shrink-0">
            <span className="text-base select-none leading-none">☀️</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black font-heading text-white tracking-wide truncate">
                گەلەری مێژوویی کوردستان
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {total} وێنە
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-amber-200/70 truncate">
              وێنە و زانیارییە تۆمارکراوەکانی کوردستان
            </p>
          </div>
        </div>

        {/* Action Controls: Autoplay Toggle, Fullscreen & Close */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Autoplay button (Active when multiple images exist) */}
          {total > 1 && (
            <button
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                isAutoPlay
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                  : 'bg-black/60 hover:bg-slate-800 text-slate-300 border-slate-700/80 hover:text-white'
              }`}
              title={
                isAutoPlay
                  ? 'وەستاندنی گۆڕینی وێنە'
                  : 'دەستپێکردنی گۆڕینی وێنە (٦ چرکە)'
              }
            >
              {isAutoPlay ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current text-amber-400" />
                  <span className="hidden sm:inline">وەستاندن</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current text-amber-400" />
                  <span className="hidden sm:inline">دەستپێکردن</span>
                </>
              )}
            </button>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={handleToggleFullscreen}
            className="p-2 rounded-xl bg-black/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-colors cursor-pointer"
            title={isFullscreen ? 'دەرچوون لە شاشەی پڕ' : 'شاشەی پڕ (Fullscreen)'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          {/* Close Modal Button */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-black/60 hover:bg-red-950/70 text-slate-300 hover:text-red-300 border border-slate-700/80 hover:border-red-800/60 transition-colors cursor-pointer"
            title="داخستن (Escape)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 6-Second Slideshow Progress Bar */}
      {total > 1 && (
        <div className="relative z-20 w-full h-1 bg-black/60 overflow-hidden shrink-0">
          <div
            className={`h-full transition-all ease-linear ${
              isAutoPlay
                ? 'bg-gradient-to-r from-amber-600 via-amber-400 to-amber-300'
                : 'bg-slate-700'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Center Display: Focused strictly on Image and Info Under the Image ("بەس وێنە و زانیاری ژێر وێنەت تیا دانرێت") */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-2 sm:p-4 min-h-0 overflow-y-auto custom-scrollbar">
        {currentItem ? (
          <div className="w-full max-w-4xl flex flex-col items-center my-auto">
            {/* The Image Container with Glass Border, Golden Aura and Smooth Transition */}
            <div className="relative w-full rounded-2xl overflow-hidden border border-amber-500/35 bg-black/85 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(245,158,11,0.12)] group">
              {/* Main Image in 100% True Proportions (بێ بڕین و بە قیاسی تەواو) */}
              <div className="relative w-full min-h-[240px] max-h-[60vh] flex items-center justify-center bg-black/95 p-2 sm:p-3">
                <img
                  key={currentItem.url}
                  src={currentItem.url}
                  alt={currentItem.caption || currentItem.title}
                  className="max-h-[55vh] max-w-full w-auto h-auto object-contain mx-auto rounded-lg transition-transform duration-300 shadow-2xl"
                />

                {/* Subtle vignette border gradient */}
                <div className="absolute inset-0 ring-1 ring-inset ring-amber-500/20 pointer-events-none rounded-2xl" />

                {/* Left/Right Floating Navigation Arrows */}
                {total > 1 && (
                  <>
                    <button
                      onClick={handlePrev}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full bg-black/70 hover:bg-amber-500 text-white hover:text-black border border-amber-500/40 backdrop-blur-md transition-all shadow-xl cursor-pointer hover:scale-110 active:scale-95"
                      title="وێنەی پێشوو (تیرەی ڕاست)"
                    >
                      <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>

                    <button
                      onClick={handleNext}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full bg-black/70 hover:bg-amber-500 text-white hover:text-black border border-amber-500/40 backdrop-blur-md transition-all shadow-xl cursor-pointer hover:scale-110 active:scale-95"
                      title="وێنەی داهاتوو (تیرەی چەپ)"
                    >
                      <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </>
                )}

                {/* Image Counter Badge on top corner */}
                <div className="absolute top-3 right-3 px-3 py-1 rounded-xl bg-black/80 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold backdrop-blur-md shadow-md flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {currentIndex + 1} / {total}
                  </span>
                </div>
              </div>
            </div>

            {/* Information Strictly UNDER the Image ("زانیاری ژێر وێنە") */}
            <div className="w-full mt-3 sm:mt-4 p-3.5 sm:p-5 rounded-2xl bg-[#070b14]/90 border border-amber-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-xl text-right transition-all">
              {/* Title & Badges Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-amber-500/20">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                  <h3 className="text-base sm:text-lg font-bold font-heading text-white truncate drop-shadow-xs">
                    {currentItem.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  {currentItem.year && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/35 text-amber-300 font-mono text-xs font-bold">
                      <Calendar className="w-3 h-3 text-amber-400" />
                      <span>{currentItem.year}</span>
                    </span>
                  )}
                  {currentItem.eraName && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/50 border border-slate-700 text-slate-300 text-[11px]">
                      <span>{currentItem.eraName}</span>
                    </span>
                  )}
                  {currentItem.fact && onFlyToFact && (
                    <button
                      onClick={() => {
                        onClose();
                        onFlyToFact(currentItem.fact!);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-bold transition-colors cursor-pointer"
                      title="فڕین بۆ شوێنی ئەم بابەتە لەسەر نەخشە"
                    >
                      <MapPin className="w-3 h-3 text-amber-400" />
                      <span>فڕین لەسەر نەخشە</span>
                    </button>
                  )}
                </div>
              </div>

              {/* The Information Under the Image (زانیاری و ڕوونکردنەوەی ژێر وێنەکە) */}
              <div className="flex items-start gap-2.5 text-amber-100/90 text-xs sm:text-sm leading-relaxed">
                <Camera className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="font-medium whitespace-pre-line">
                  {currentItem.caption}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 max-w-md mx-auto my-auto bg-[#070b14]/70 border border-amber-500/25 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-4 shadow-[0_0_25px_rgba(245,158,11,0.15)]">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="text-base sm:text-lg font-bold font-heading text-white mb-2">
              هیچ وێنەیەک دانەنراوە
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              تەنها ئەو وێنانە لێرە نیشان دەدرێن کە لە بەشی ئەدمین بۆ بابەتەکانت دایاندەنێیت.
              کاتێک بابەتێکی نوێ زیاد دەکەیت یان دەستکاری دەکەیت، وێنە و زانیاری ژێر وێنە دابنێ تا لەم گەلەرییەدا دەربکەوێت.
            </p>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-colors cursor-pointer shadow-lg"
            >
              داخستن
            </button>
          </div>
        )}
      </div>

      {/* Bottom Thumbnail Strip (Only when multiple images exist) */}
      {total > 1 && (
        <div className="relative z-20 pt-2 pb-1 border-t border-amber-500/20 bg-black/40 backdrop-blur-xl shrink-0 flex flex-col gap-2">
          {/* Thumbnails row */}
          <div className="flex items-center justify-center gap-2 px-2 overflow-x-auto scrollbar-none max-w-full">
            {galleryItems.map((item, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setProgress(0);
                  }}
                  className={`relative w-12 h-10 sm:w-16 sm:h-12 rounded-xl overflow-hidden shrink-0 border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                      : 'border-slate-800 opacity-60 hover:opacity-100 hover:border-amber-500/40'
                  }`}
                  title={item.title}
                >
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-amber-500/15 pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom controls helper text */}
          <div className="flex items-center justify-between px-3 text-[10px] sm:text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span>کۆنترۆڵ: تیرەکانی تەختەکلیل بۆ گۆڕین</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Space بۆ وەستاندن / دەستپێکردن</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCurrentIndex(0);
                  setProgress(0);
                }}
                className="hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1"
                title="گەڕانەوە بۆ سەرەتا"
              >
                <RotateCcw className="w-3 h-3" />
                <span>دەستپێک</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
