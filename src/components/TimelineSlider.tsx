import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Layers,
  Search,
  X,
} from 'lucide-react';
import { FactItem } from '../data/kurdishHistoryData';
import {
  MIN_HISTORICAL_YEAR,
  MAX_HISTORICAL_YEAR,
  formatKurdishYear,
  toKurdishDigits,
  normalizeYearString,
} from '../utils/yearUtils';

interface Props {
  facts: FactItem[];
  selectedYear: number | 'all';
  onYearChange: (year: number | 'all') => void;
  filteredCount: number;
  totalCount: number;
}

interface RulerMark {
  year: number;
  type: 'cm' | 'half' | 'mm';
  label?: string;
  isFactYear?: boolean;
}

export const TimelineSlider: React.FC<Props> = ({
  facts,
  selectedYear,
  onYearChange,
  filteredCount,
  totalCount,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [directInputYear, setDirectInputYear] = useState('');
  const [showDirectInput, setShowDirectInput] = useState(false);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const selectedYearRef = useRef(selectedYear);
  selectedYearRef.current = selectedYear;

  // Toggle memory: remembers previous numeric year so clicking "All" a second time restores it
  const lastNumericYearRef = useRef<number>(
    typeof selectedYear === 'number' ? selectedYear : 1940
  );
  useEffect(() => {
    if (typeof selectedYear === 'number') {
      lastNumericYearRef.current = selectedYear;
    }
  }, [selectedYear]);

  // Horizontal scroll container ref for the ruler
  const rulerContainerRef = useRef<HTMLDivElement>(null);
  const isUserInteractingRef = useRef(false);
  const wheelTimeoutRef = useRef<any>(null);

  // Mouse Drag state for desktop ruler scrubbing
  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef(0);
  const dragScrollLeftRef = useRef(0);

  // Build authentic metric ruler marks (ڕاستەی پێوان)
  const rulerMarks = useMemo(() => {
    const marks: RulerMark[] = [];
    const factYearsSet = new Set<number>();

    facts.forEach((f) => {
      if (typeof f.startYear === 'number') factYearsSet.add(f.startYear);
      if (typeof f.endYear === 'number') factYearsSet.add(f.endYear);
      if (typeof f.birthYear === 'number') factYearsSet.add(f.birthYear);
      if (typeof f.deathYear === 'number') factYearsSet.add(f.deathYear);
    });

    // 1. Ancient & Classical Ruler marks (-3000 to 1800)
    for (let y = -3000; y < -500; y += 100) {
      marks.push({ year: y, type: 'cm', label: formatKurdishYear(y) });
      marks.push({ year: y + 50, type: 'half' });
    }

    for (let y = -500; y < 500; y += 50) {
      marks.push({
        year: y,
        type: y % 100 === 0 ? 'cm' : 'half',
        label: y % 100 === 0 ? formatKurdishYear(y) : undefined,
      });
      marks.push({ year: y + 25, type: 'mm' });
    }

    for (let y = 500; y < 1800; y += 25) {
      marks.push({
        year: y,
        type: y % 50 === 0 ? 'cm' : 'half',
        label: y % 50 === 0 ? formatKurdishYear(y) : undefined,
      });
      marks.push({ year: y + 10, type: 'mm' });
    }

    // 2. Modern Era Ruler Marks (1800 to 2026)
    // Every decade is a major centimeter line with bold label
    // Every 5 years is a half-centimeter line
    // Individual years are millimeter tick lines
    for (let y = 1800; y <= 2026; y += 1) {
      if (y % 10 === 0) {
        marks.push({
          year: y,
          type: 'cm',
          label: toKurdishDigits(y),
          isFactYear: factYearsSet.has(y),
        });
      } else if (y % 5 === 0) {
        marks.push({
          year: y,
          type: 'half',
          label: undefined,
          isFactYear: factYearsSet.has(y),
        });
      } else {
        marks.push({
          year: y,
          type: 'mm',
          isFactYear: factYearsSet.has(y),
          label: factYearsSet.has(y) ? toKurdishDigits(y) : undefined,
        });
      }
    }

    // Add any remaining exact fact years not on the grid
    factYearsSet.forEach((fy) => {
      if (!marks.some((m) => m.year === fy)) {
        marks.push({
          year: fy,
          type: 'cm',
          label: formatKurdishYear(fy),
          isFactYear: true,
        });
      }
    });

    return marks.sort((a, b) => a.year - b.year);
  }, [facts]);

  // Read which year is currently aligned under the ruler center needle
  const syncYearFromRulerCenter = useCallback(() => {
    if (!rulerContainerRef.current) return;
    const container = rulerContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;

    const tickElements = container.querySelectorAll<HTMLElement>('[data-ruler-year]');
    let closestYear: number | null = null;
    let minDiff = Infinity;

    tickElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const tickCenter = rect.left + rect.width / 2;
      const diff = Math.abs(tickCenter - containerCenter);
      if (diff < minDiff) {
        minDiff = diff;
        closestYear = Number(el.dataset.rulerYear);
      }
    });

    if (closestYear !== null && closestYear !== selectedYearRef.current) {
      onYearChange(closestYear);
    }
  }, [onYearChange]);

  // Center active ruler mark in the ruler viewport when selectedYear changes programmatically
  useEffect(() => {
    if (rulerContainerRef.current && typeof selectedYear === 'number' && !isUserInteractingRef.current) {
      const activeEl = rulerContainerRef.current.querySelector(
        `[data-ruler-year="${selectedYear}"]`
      ) as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        });
      }
    }
  }, [selectedYear]);

  // Auto-play history animation
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        const prevYear = selectedYearRef.current;
        const current = typeof prevYear === 'number' ? prevYear : MIN_HISTORICAL_YEAR;
        if (current >= MAX_HISTORICAL_YEAR) {
          setIsPlaying(false);
          onYearChange(MAX_HISTORICAL_YEAR);
        } else {
          let step = 1;
          if (current < -500) step = 50;
          else if (current < 1500) step = 20;
          else if (current < 1800) step = 10;
          else if (current >= 1800) step = 2;

          const next = Math.min(current + step, MAX_HISTORICAL_YEAR);
          onYearChange(next);
        }
      }, 900);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, onYearChange]);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (selectedYear === 'all' || selectedYear >= MAX_HISTORICAL_YEAR) {
        onYearChange(1800);
      }
      setIsPlaying(true);
    }
  };

  const handleStepYear = (delta: number) => {
    setIsPlaying(false);
    isUserInteractingRef.current = false;
    const current = typeof selectedYear === 'number' ? selectedYear : 1940;
    const next = Math.max(MIN_HISTORICAL_YEAR, Math.min(MAX_HISTORICAL_YEAR, current + delta));
    onYearChange(next);
  };

  const handleDirectJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directInputYear.trim()) return;
    const norm = normalizeYearString(directInputYear.trim());
    const match = norm.match(/-?\d+/);
    if (match) {
      let num = parseInt(match[0], 10);
      if (directInputYear.includes('پ.ز') || directInputYear.includes('پێش')) {
        num = -Math.abs(num);
      }
      if (num >= MIN_HISTORICAL_YEAR && num <= MAX_HISTORICAL_YEAR) {
        setIsPlaying(false);
        isUserInteractingRef.current = false;
        onYearChange(num);
        setShowDirectInput(false);
        setDirectInputYear('');
      }
    }
  };

  // Wheel handling on the ruler
  const handleWheel = (e: React.WheelEvent) => {
    if (rulerContainerRef.current) {
      isUserInteractingRef.current = true;
      rulerContainerRef.current.scrollLeft += e.deltaY;
      syncYearFromRulerCenter();

      clearTimeout(wheelTimeoutRef.current);
      wheelTimeoutRef.current = setTimeout(() => {
        isUserInteractingRef.current = false;
      }, 250);
    }
  };

  // Button nudges
  const handleScrollRuler = (direction: 'left' | 'right') => {
    if (rulerContainerRef.current) {
      isUserInteractingRef.current = true;
      rulerContainerRef.current.scrollBy({
        left: direction === 'left' ? -200 : 200,
        behavior: 'smooth',
      });
      setTimeout(() => {
        syncYearFromRulerCenter();
        isUserInteractingRef.current = false;
      }, 250);
    }
  };

  // Mouse Drag on Desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!rulerContainerRef.current) return;
    setIsDragging(true);
    isUserInteractingRef.current = true;
    dragStartXRef.current = e.pageX - rulerContainerRef.current.offsetLeft;
    dragScrollLeftRef.current = rulerContainerRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !rulerContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - rulerContainerRef.current.offsetLeft;
    const walk = (x - dragStartXRef.current) * 1.5;
    rulerContainerRef.current.scrollLeft = dragScrollLeftRef.current - walk;
    syncYearFromRulerCenter();
  };

  const handleMouseUpOrLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setTimeout(() => {
        isUserInteractingRef.current = false;
      }, 200);
    }
  };

  // Touch on Mobile
  const handleTouchStart = () => {
    isUserInteractingRef.current = true;
  };

  const handleTouchEnd = () => {
    setTimeout(() => {
      syncYearFromRulerCenter();
      isUserInteractingRef.current = false;
    }, 200);
  };

  // Native scroll listener on container (synchronizes top year as ruler moves)
  const handleScroll = () => {
    if (isUserInteractingRef.current) {
      syncYearFromRulerCenter();
    }
  };

  // Toggle "All" button: Clicking when active toggles it off and restores previous year!
  const handleToggleAllYears = () => {
    setIsPlaying(false);
    isUserInteractingRef.current = false;
    if (selectedYear === 'all') {
      onYearChange(lastNumericYearRef.current || 1940);
    } else {
      onYearChange('all');
    }
  };

  return (
    <div className="w-full max-w-2xl flex flex-col items-center gap-0.5 sm:gap-1 text-right select-none transition-all">
      {/* 
        Two-Tone Precision Ruler Dock (ڕاستەی مێژوویی: باریک، کۆمپاکت و جوان بۆ مۆبایل)
      */}
      <div className="w-full bg-[#080c14]/95 border border-amber-500/30 rounded-xl sm:rounded-2xl p-1.5 sm:p-2.5 backdrop-blur-xl shadow-[0_6px_25px_rgba(0,0,0,0.85),0_0_15px_rgba(245,158,11,0.06)] flex flex-col gap-1 sm:gap-1.5 transition-all">
        {/* Tier 1: Top Status Header (ڕاستەوخۆ بەپێی جوڵەی ڕاستەکە دەگۆڕێت) */}
        <div className="flex items-center justify-between gap-1 sm:gap-1.5">
          {/* Right: Year Label & Fact Count */}
          <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-amber-500/15 border border-amber-500/40 flex items-center justify-center shrink-0">
              <Calendar className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-amber-400" />
            </div>

            <div className="flex items-baseline gap-1 sm:gap-1.5 truncate">
              {/* ئەو ساڵەی لەسەرەوەیە ڕاستەوخۆ نوێ دەبێتەوە */}
              <span className="font-bold text-white text-[11px] sm:text-sm font-mono tracking-wide">
                {selectedYear === 'all'
                  ? 'هەموو ساڵەکان'
                  : formatKurdishYear(selectedYear)}
              </span>

              {/* Fact Count Pill */}
              <span className="text-[8px] sm:text-[9px] font-mono px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded sm:rounded-md bg-amber-950/80 text-amber-300 border border-amber-800/50 shrink-0">
                {toKurdishDigits(filteredCount)} شوێن
              </span>
            </div>
          </div>

          {/* Left: Quick Actions Cluster */}
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            {/* Step -1 Year */}
            <button
              onClick={() => handleStepYear(-1)}
              title="١ ساڵ بۆ دواوە"
              className="w-5 h-5 sm:w-6 sm:h-6 rounded sm:rounded-lg bg-[#0d121f] hover:bg-amber-950/60 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-amber-400 flex items-center justify-center transition-all cursor-pointer"
            >
              <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>

            {/* Play / Pause Toggle Button */}
            <button
              onClick={togglePlay}
              title={isPlaying ? 'وەستاندنی تایملاین' : 'پەخشکردنی مێژوو بەپێی ڕاستە'}
              className={`w-5 h-5 sm:w-6 sm:h-6 rounded sm:rounded-lg flex items-center justify-center transition-all cursor-pointer active:scale-95 border ${
                isPlaying
                  ? 'bg-amber-500 text-black border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-pulse'
                  : 'bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-black border-amber-500/40'
              }`}
            >
              {isPlaying ? (
                <Pause className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
              ) : (
                <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current ml-0.5" />
              )}
            </button>

            {/* Step +1 Year */}
            <button
              onClick={() => handleStepYear(1)}
              title="١ ساڵ بۆ پێشەوە"
              className="w-5 h-5 sm:w-6 sm:h-6 rounded sm:rounded-lg bg-[#0d121f] hover:bg-amber-950/60 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-amber-400 flex items-center justify-center transition-all cursor-pointer"
            >
              <ChevronLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>

            {/* Search Toggle */}
            <button
              onClick={() => setShowDirectInput(!showDirectInput)}
              title="دیاریکردنی ساڵ بە ژمارە"
              className={`w-5 h-5 sm:w-6 sm:h-6 rounded sm:rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                showDirectInput
                  ? 'bg-amber-500 text-black border-amber-400 font-bold'
                  : 'bg-[#0d121f] border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/40'
              }`}
            >
              <Search className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </button>

            {/* Toggle All Years Button (Clicking again toggles OFF) */}
            <button
              onClick={handleToggleAllYears}
              title={
                selectedYear === 'all'
                  ? 'کلیک بکەرەوە بۆ گەڕانەوە بۆ ساڵی دیاریکراو'
                  : 'پیشاندانی هەموو ساڵەکان'
              }
              className={`flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 h-5 sm:h-6 rounded sm:rounded-lg text-[9px] sm:text-[10px] font-medium border transition-all cursor-pointer ${
                selectedYear === 'all'
                  ? 'bg-amber-500 text-black border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)] font-bold'
                  : 'bg-[#0d121f] text-slate-300 hover:text-amber-300 hover:bg-amber-950/40 border-slate-800 hover:border-amber-500/40'
              }`}
            >
              <Layers className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>هەمووی</span>
            </button>
          </div>
        </div>

        {/* Optional Direct Year Jump Form */}
        {showDirectInput && (
          <form
            onSubmit={handleDirectJumpSubmit}
            className="flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-[#0d121f] border border-amber-500/50 animate-fade-in"
          >
            <span className="text-[9px] sm:text-[10px] text-amber-400 font-bold shrink-0">
              ساڵ بنووسە:
            </span>
            <input
              type="text"
              autoFocus
              value={directInputYear}
              onChange={(e) => setDirectInputYear(e.target.value)}
              placeholder="1940، 1890، 612 پ.ز..."
              className="flex-1 bg-[#05070e] text-white px-2 py-0.5 sm:py-1 rounded border border-slate-800 text-[10px] sm:text-xs focus:outline-none focus:border-amber-500 font-mono"
            />
            <button
              type="submit"
              className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] sm:text-xs cursor-pointer"
            >
              بڕۆ
            </button>
            <button
              type="button"
              onClick={() => setShowDirectInput(false)}
              className="p-0.5 sm:p-1 rounded text-slate-400 hover:text-white"
            >
              <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </button>
          </form>
        )}

        {/* 
          Tier 2: The Precision Ruler Controller (ڕاستەی پێوان)
          Each centimeter is a graduated measure; user drags or scrolls it like a physical ruler!
        */}
        <div className="relative w-full flex items-center gap-0.5 sm:gap-1 border-t border-slate-800/80 pt-0.5 sm:pt-1">
          {/* Scroll left nudge */}
          <button
            type="button"
            onClick={() => handleScrollRuler('left')}
            title="سکرۆڵکردنی ڕاستە بۆ چەپ"
            className="w-4 h-7 sm:w-5 sm:h-9 rounded sm:rounded-md bg-[#0d121f] hover:bg-amber-950/60 text-slate-400 hover:text-amber-300 flex items-center justify-center shrink-0 border border-slate-800 cursor-pointer"
          >
            <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>

          {/* Precision Ruler Strip (خاوەن نیشاندەری ناوەڕاست و هێڵەکانی سانتیمەتر) */}
          <div className="relative flex-1 bg-gradient-to-b from-[#0e1422] to-[#070a13] border border-amber-500/30 rounded-lg sm:rounded-xl overflow-hidden py-0.5 sm:py-1 px-0.5 sm:px-1">
            {/* Center Fixed Hairline Indicator (دەرزی پێوانەی ناوەڕاست) */}
            <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-[1px] sm:w-0.5 bg-amber-400 z-20 pointer-events-none shadow-[0_0_8px_#f59e0b] flex flex-col justify-between items-center">
              <span className="text-[5px] sm:text-[7px] text-amber-400 -mt-0.5 leading-none select-none">▼</span>
              <span className="text-[5px] sm:text-[7px] text-amber-400 -mb-0.5 leading-none select-none">▲</span>
            </div>

            {/* Scrollable graduated ruler container with drag and wheel support */}
            <div
              ref={rulerContainerRef}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onScroll={handleScroll}
              className={`flex items-end gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none py-1 sm:py-1.5 px-14 sm:px-24 scroll-smooth min-h-[34px] sm:min-h-[44px] select-none ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              style={{ touchAction: 'pan-x' }}
            >
              {rulerMarks.map((mark, idx) => {
                const isSelected = selectedYear === mark.year;

                return (
                  <button
                    key={`${mark.year}-${idx}`}
                    data-ruler-year={mark.year}
                    onClick={() => {
                      setIsPlaying(false);
                      isUserInteractingRef.current = false;
                      onYearChange(mark.year);
                    }}
                    title={`ساڵی ${formatKurdishYear(mark.year)}`}
                    className={`group flex flex-col items-center justify-end shrink-0 cursor-pointer transition-all px-0.5 relative ${
                      isSelected ? 'scale-110 z-10' : 'opacity-85 hover:opacity-100'
                    }`}
                  >
                    {/* Centimeter / Millimeter Tick Line */}
                    <div
                      className={`transition-all rounded-full ${
                        isSelected
                          ? 'w-1 h-4 sm:h-5.5 bg-amber-400 shadow-[0_0_10px_#f59e0b]'
                          : mark.type === 'cm'
                          ? 'w-[1.5px] h-3 sm:h-4 bg-amber-400/90 group-hover:bg-amber-300'
                          : mark.type === 'half'
                          ? 'w-[1px] h-2 sm:h-2.5 bg-amber-400/50 group-hover:bg-amber-400'
                          : 'w-[1px] h-1.5 bg-amber-400/25 group-hover:bg-amber-400/60'
                      }`}
                    />

                    {/* Centimeter Mark Label */}
                    {(mark.label || isSelected) && (
                      <span
                        className={`text-[7px] sm:text-[8px] font-mono leading-none mt-0.5 sm:mt-1 tracking-tighter whitespace-nowrap select-none transition-colors ${
                          isSelected
                            ? 'text-amber-300 font-bold scale-105'
                            : mark.isFactYear
                            ? 'text-amber-400/90 font-semibold'
                            : 'text-slate-400/80 group-hover:text-amber-300'
                        }`}
                      >
                        {mark.label || toKurdishDigits(mark.year)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scroll right nudge */}
          <button
            type="button"
            onClick={() => handleScrollRuler('right')}
            title="سکرۆڵکردنی ڕاستە بۆ ڕاست"
            className="w-4 h-7 sm:w-5 sm:h-9 rounded sm:rounded-md bg-[#0d121f] hover:bg-amber-950/60 text-slate-400 hover:text-amber-300 flex items-center justify-center shrink-0 border border-slate-800 cursor-pointer"
          >
            <ChevronLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
