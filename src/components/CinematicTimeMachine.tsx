import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  X,
  Compass,
  MapPin,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  BookOpen,
  Award,
  Crown,
  Shield,
  Eye,
  Info,
} from 'lucide-react';
import {
  CINEMATIC_STATIONS,
  CINEMATIC_EPOCHS,
  CinematicStation,
} from '../data/cinematicTimeMachineData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onFlyToStation: (lat: number, lng: number, zoom: number, territoryId?: string) => void;
  onSelectAssociatedFact?: (factId: number) => void;
}

export const CinematicTimeMachine: React.FC<Props> = ({
  isOpen,
  onClose,
  onFlyToStation,
  onSelectAssociatedFact,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isCardMinimized, setIsCardMinimized] = useState(false);
  const [tourProgress, setTourProgress] = useState(0);

  const currentStation: CinematicStation = CINEMATIC_STATIONS[currentIndex];
  const autoPlayTimerRef = useRef<any>(null);
  const progressIntervalRef = useRef<any>(null);
  const STATION_DURATION = 9000; // 9 seconds per station in auto-play mode

  const tourProgressRef = useRef(0);
  const currentIndexRef = useRef(currentIndex);
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Handle flying camera on station change
  const navigateToStation = useCallback(
    (index: number, _playChime?: boolean) => {
      const validIndex = (index + CINEMATIC_STATIONS.length) % CINEMATIC_STATIONS.length;
      setCurrentIndex(validIndex);
      currentIndexRef.current = validIndex;
      tourProgressRef.current = 0;
      setTourProgress(0);

      const target = CINEMATIC_STATIONS[validIndex];
      onFlyToStation(target.lat, target.lng, target.zoom, target.territoryId);
    },
    [onFlyToStation]
  );

  // Initial flight when opening
  useEffect(() => {
    if (isOpen) {
      navigateToStation(currentIndex);
      setIsPlaying(true);
      tourProgressRef.current = 0;
      setTourProgress(0);
    } else {
      setIsPlaying(false);
      tourProgressRef.current = 0;
      setTourProgress(0);
    }
  }, [isOpen]);

  // Autoplay timer and progress bar
  useEffect(() => {
    if (!isOpen || !isPlaying) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    const intervalStep = 100;
    progressIntervalRef.current = setInterval(() => {
      const next = tourProgressRef.current + (intervalStep / STATION_DURATION) * 100;
      if (next >= 100) {
        tourProgressRef.current = 0;
        setTourProgress(0);
        navigateToStation(currentIndexRef.current + 1, true);
      } else {
        tourProgressRef.current = next;
        setTourProgress(next);
      }
    }, intervalStep);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isOpen, isPlaying, navigateToStation]);

  // Keyboard controls
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        // In RTL right goes forward / or reverse
        navigateToStation(currentIndex + 1, true);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        navigateToStation(currentIndex - 1, true);
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, navigateToStation, onClose]);

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleEpochSelect = (epochId: string) => {
    const targetIdx = CINEMATIC_STATIONS.findIndex((s) => s.epochId === epochId);
    if (targetIdx !== -1) {
      navigateToStation(targetIdx);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-between select-none overflow-hidden font-sans">
      {/* 1. Cinematic Letterbox Bar - Top HUD */}
      <header className="pointer-events-auto w-full bg-gradient-to-b from-black via-black/90 to-transparent pt-3 pb-8 px-4 md:px-8 flex items-center justify-between z-50">
        {/* Left: Close & Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-rose-500/20 text-slate-200 hover:text-rose-300 border border-white/15 hover:border-rose-500/40 backdrop-blur-md transition-all cursor-pointer text-xs"
            title="دەرچوون لە گەشتی سینەمایی (ESC)"
          >
            <X className="w-4 h-4" />
            <span className="font-heading font-medium">داخستن</span>
          </button>

          {/* Minimize / Maximize Card */}
          <button
            onClick={() => setIsCardMinimized(!isCardMinimized)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 backdrop-blur-md transition-all cursor-pointer"
            title={isCardMinimized ? 'گەورەکردنی زانیاری' : 'بچووککردنەوە بۆ بینینی تەواوی نەخشە'}
          >
            {isCardMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Center: Title & Cinematic Badge */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="font-heading text-xs md:text-sm font-bold tracking-wider text-amber-300 uppercase">
              گەشتی زەمەنی سینەمایی
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/30">
              TIME-MACHINE
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-300 font-mono mt-0.5">
            <span>
              وێستگەی {currentIndex + 1} لە {CINEMATIC_STATIONS.length}
            </span>
            <span className="text-amber-500/70">•</span>
            <span>{currentStation.period}</span>
          </div>
        </div>

        {/* Right: GPS HUD / Coordinates */}
        <div className="hidden sm:flex items-center gap-3 text-right">
          <div className="flex flex-col text-slate-300 font-mono text-[10px] border-r-2 border-amber-500/60 pr-2.5">
            <span className="text-amber-400/90 font-medium">{currentStation.locationName}</span>
            <span className="text-slate-400">
              {currentStation.lat.toFixed(3)}°N, {currentStation.lng.toFixed(3)}°E
            </span>
          </div>
        </div>
      </header>

      {/* 2. Epoch Bar Indicator (Top Pill Selector) */}
      <div className="pointer-events-auto px-4 w-full flex justify-center -mt-4 mb-2 z-40 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 p-1 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
          {CINEMATIC_EPOCHS.map((ep) => {
            const isActive = currentStation.epochId === ep.id;
            return (
              <button
                key={ep.id}
                onClick={() => handleEpochSelect(ep.id)}
                className={`px-3 py-1 rounded-full text-[11px] font-heading font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-black font-bold shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                    : 'text-slate-300 hover:text-amber-200 hover:bg-white/10'
                }`}
              >
                {ep.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Center Atmospheric Vignette / Clean Space for Map Flying */}
      <div className="flex-1 w-full" />

      {/* 4. Bottom Main Presentation Deck & Documentary Storytelling Card */}
      <footer className="pointer-events-auto w-full bg-gradient-to-t from-black via-black/95 to-transparent pt-6 pb-4 px-3 md:px-8 flex flex-col items-center gap-3 z-50">
        {/* Story Card (Collapsible) */}
        {!isCardMinimized && (
          <div className="w-full max-w-3xl bg-[#080d18]/90 border border-amber-500/35 rounded-2xl p-4 md:p-5 shadow-[0_15px_50px_rgba(0,0,0,0.95),0_0_30px_rgba(245,158,11,0.15)] backdrop-blur-2xl text-right animate-slide-up relative overflow-hidden transition-all">
            {/* Ambient gold glow edge */}
            <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80" />

            {/* Top row: Epoch Tag, Period & Jump to Details */}
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] md:text-xs font-bold px-2.5 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: currentStation.epochBadgeBg,
                    borderColor: currentStation.epochColor,
                    color: currentStation.epochColor,
                  }}
                >
                  {currentStation.epochTitle}
                </span>

                <span className="text-[11px] font-mono text-slate-300 flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-md">
                  <Calendar className="w-3 h-3 text-amber-400" />
                  {currentStation.period}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {currentStation.associatedFactId && onSelectAssociatedFact && (
                  <button
                    onClick={() => {
                      if (currentStation.associatedFactId) {
                        onSelectAssociatedFact(currentStation.associatedFactId);
                        onClose();
                      }
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[11px] transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3 h-3 text-amber-400" />
                    <span>تەواوی بابەت لە نەخشە</span>
                  </button>
                )}
              </div>
            </div>

            {/* Main Station Header */}
            <div className="flex flex-col gap-1 mb-3">
              <div className="flex items-baseline gap-2">
                <h2 className="text-lg md:text-2xl font-bold font-heading text-amber-200 tracking-wide">
                  {currentStation.title}
                </h2>
              </div>
              <p className="text-xs md:text-sm text-amber-400/90 font-medium">
                {currentStation.subtitle}
              </p>
            </div>

            {/* Historic Secret Highlight Box ("دانسقە و نهێنی مێژوویی") */}
            <div className="bg-amber-500/10 border-r-3 border-amber-400 rounded-lg p-2.5 mb-3 text-right">
              <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>نهێنی و گرنگی مێژوویی:</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {currentStation.historicSecret}
              </p>
            </div>

            {/* Documentary Narration */}
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed mb-3">
              {currentStation.storyNarration}
            </p>

            {/* Historic Quote if available */}
            {currentStation.quote && (
              <blockquote className="bg-black/40 border border-white/5 rounded-xl p-2.5 mb-3 text-xs italic text-slate-300">
                <p className="text-amber-200/90 font-serif">«{currentStation.quote.text}»</p>
                <cite className="block text-[10px] text-amber-400/70 not-italic mt-1 text-left">
                  — {currentStation.quote.author}
                </cite>
              </blockquote>
            )}

            {/* Key Figures badges */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-medium">کەسایەتی و ڕابەران:</span>
              {currentStation.keyFigures.map((fig, idx) => (
                <span
                  key={idx}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-200 border border-white/10"
                >
                  {fig}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 5. Player Controls & Progress Scrubber */}
        <div className="w-full max-w-3xl flex flex-col gap-2">
          {/* Progress Timeline Scrubber Dots */}
          <div className="w-full flex items-center justify-between gap-1 px-1">
            {CINEMATIC_STATIONS.map((st, idx) => {
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={st.id}
                  onClick={() => navigateToStation(idx, true)}
                  className={`flex-1 h-1.5 rounded-full transition-all cursor-pointer relative group ${
                    isCurrent
                      ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] scale-y-125'
                      : idx < currentIndex
                      ? 'bg-amber-600/70 hover:bg-amber-500/80'
                      : 'bg-white/15 hover:bg-white/30'
                  }`}
                  title={`${idx + 1}. ${st.title} (${st.period})`}
                >
                  {/* Tooltip on hover */}
                  <span className="absolute bottom-4 right-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-amber-200 text-[10px] px-2 py-0.5 rounded border border-amber-500/40 pointer-events-none whitespace-nowrap z-50">
                    {st.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Autoplay Progress Bar */}
          {isPlaying && (
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-[width] ease-linear"
                style={{ width: `${tourProgress}%` }}
              />
            </div>
          )}

          {/* Player Action Buttons Bar */}
          <div className="w-full flex items-center justify-between px-2 pt-1">
            {/* Previous Station */}
            <button
              onClick={() => navigateToStation(currentIndex - 1, true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-100 border border-white/15 backdrop-blur-md transition-colors cursor-pointer text-xs"
              title="وێستگەی پێشوو (تیرەی چەپ)"
            >
              <SkipForward className="w-4 h-4 text-amber-400 rotate-180" />
              <span className="font-heading hidden sm:inline">پێشوو</span>
            </button>

            {/* Play / Pause Toggle Center */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleTogglePlay}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-bold font-heading shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all transform active:scale-95 cursor-pointer text-xs md:text-sm"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>وەستاندنی گەشت</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>بەردەوامی گەشت</span>
                  </>
                )}
              </button>
            </div>

            {/* Next Station */}
            <button
              onClick={() => navigateToStation(currentIndex + 1, true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-100 border border-white/15 backdrop-blur-md transition-colors cursor-pointer text-xs"
              title="وێستگەی دواتر (تیرەی ڕاست)"
            >
              <span className="font-heading hidden sm:inline">دواتر</span>
              <SkipForward className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
