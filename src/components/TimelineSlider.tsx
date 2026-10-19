import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Calendar,
  Layers,
  Search,
  X,
  Film,
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
  isTourActive?: boolean;
  onToggleTour?: () => void;
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
  isTourActive = false,
  onToggleTour,
}) => {
  const [directInputYear, setDirectInputYear] = useState('');
  const [showDirectInput, setShowDirectInput] = useState(false);
  const [scrubYear, setScrubYear] = useState<number | null>(null);

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
  const isProgrammaticScrollRef = useRef(false);
  const programmaticScrollTimerRef = useRef<any>(null);
  const scrollDebounceTimerRef = useRef<any>(null);

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

  // Fast O(log N) needle detection: find the tick element closest to the center needle
  const getYearAtNeedle = useCallback((): number | null => {
    const container = rulerContainerRef.current;
    if (!container) return null;
    const children = container.children;
    if (!children || children.length === 0) return null;

    const containerRect = container.getBoundingClientRect();
    const needleScreenX = containerRect.left + containerRect.width / 2;

    let low = 0;
    let high = children.length - 1;
    let closestEl: HTMLElement | null = null;
    let minDiff = Infinity;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const child = children[mid] as HTMLElement;
      const childRect = child.getBoundingClientRect();
      const childCenterScreenX = childRect.left + childRect.width / 2;
      const diff = Math.abs(childCenterScreenX - needleScreenX);

      if (diff < minDiff) {
        minDiff = diff;
        closestEl = child;
      }

      if (childCenterScreenX < needleScreenX) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    if (closestEl && closestEl.dataset.rulerYear) {
      const yr = Number(closestEl.dataset.rulerYear);
      return Number.isNaN(yr) ? null : yr;
    }
    return null;
  }, []);

  // Programmatically center a year mark in the ruler viewport
  const scrollToYear = useCallback((year: number, smooth = true) => {
    const container = rulerContainerRef.current;
    if (!container) return;

    const activeEl = container.querySelector(
      `[data-ruler-year="${year}"]`
    ) as HTMLElement | null;
    if (!activeEl) return;

    isProgrammaticScrollRef.current = true;
    if (programmaticScrollTimerRef.current) {
      clearTimeout(programmaticScrollTimerRef.current);
    }

    activeEl.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
      inline: 'center',
      block: 'nearest',
    });

    programmaticScrollTimerRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, smooth ? 450 : 100);
  }, []);

  // Center active ruler mark when selectedYear changes externally (not during active user drag/scroll)
  useEffect(() => {
    if (typeof selectedYear === 'number' && !isUserInteractingRef.current && !isDragging) {
      scrollToYear(selectedYear, true);
    }
  }, [selectedYear, isDragging, scrollToYear]);

  // Initial scroll into view on mount without triggering onYearChange
  useEffect(() => {
    const timer = setTimeout(() => {
      const initialYear = typeof selectedYear === 'number' ? selectedYear : 1940;
      scrollToYear(initialYear, false);
    }, 150);

    return () => {
      clearTimeout(timer);
      if (programmaticScrollTimerRef.current) clearTimeout(programmaticScrollTimerRef.current);
      if (scrollDebounceTimerRef.current) clearTimeout(scrollDebounceTimerRef.current);
    };
  }, [scrollToYear]);

  // Step Year buttons
  const handleStepYear = (delta: number) => {
    isUserInteractingRef.current = false;
    const current = typeof selectedYear === 'number' ? selectedYear : 1940;
    const next = Math.max(MIN_HISTORICAL_YEAR, Math.min(MAX_HISTORICAL_YEAR, current + delta));
    onYearChange(next);
  };

  // Direct Jump Submit
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
        isUserInteractingRef.current = false;
        onYearChange(num);
        setShowDirectInput(false);
        setDirectInputYear('');
      }
    }
  };

  // Wheel & Trackpad scrolling
  const handleWheel = (e: React.WheelEvent) => {
    if (!rulerContainerRef.current) return;
    isUserInteractingRef.current = true;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    rulerContainerRef.current.scrollLeft += delta;
  };

  // Button nudges (scroll left / scroll right)
  const handleScrollRuler = (direction: 'left' | 'right') => {
    if (rulerContainerRef.current) {
      const offset = direction === 'left' ? -220 : 220;
      rulerContainerRef.current.scrollBy({
        left: offset,
        behavior: 'smooth',
      });
    }
  };

  // Mouse Drag on Desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!rulerContainerRef.current) return;
    setIsDragging(true);
    isUserInteractingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragScrollLeftRef.current = rulerContainerRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !rulerContainerRef.current) return;
    e.preventDefault();
    isUserInteractingRef.current = true;
    const deltaX = e.clientX - dragStartXRef.current;
    rulerContainerRef.current.scrollLeft = dragScrollLeftRef.current - deltaX;
  };

  const handleMouseUpOrLeave = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  // Touch on Mobile
  const handleTouchStart = () => {
    isUserInteractingRef.current = true;
  };

  const handleTouchEnd = () => {
    // Scroll end handled by onScroll debouncer
  };

  // Native scroll listener on container (synchronizes on swipe, trackpad, inertia)
  const handleScroll = () => {
    if (isProgrammaticScrollRef.current) return;
    if (!rulerContainerRef.current) return;

    isUserInteractingRef.current = true;
    const detectedYear = getYearAtNeedle();
    if (detectedYear !== null) {
      setScrubYear(detectedYear);
    }

    // Debounce pushing year to parent to prevent layout thrashing and setState-in-render
    if (scrollDebounceTimerRef.current) {
      clearTimeout(scrollDebounceTimerRef.current);
    }
    scrollDebounceTimerRef.current = setTimeout(() => {
      if (!isProgrammaticScrollRef.current && rulerContainerRef.current) {
        const finalYear = getYearAtNeedle();
        if (finalYear !== null && finalYear !== selectedYearRef.current) {
          onYearChange(finalYear);
        }
      }
      setScrubYear(null);
      isUserInteractingRef.current = false;
    }, 90);
  };

  // Toggle "All" button: Clicking when active toggles it off and restores previous year!
  const handleToggleAllYears = () => {
    isUserInteractingRef.current = false;
    if (selectedYear === 'all') {
      onYearChange(lastNumericYearRef.current || 1940);
    } else {
      onYearChange('all');
    }
  };

  const activeDisplayYear = scrubYear !== null ? scrubYear : selectedYear;

  return (
    <div className="w-full max-w-2xl flex flex-col items-center gap-0.5 sm:gap-1 text-right select-none transition-all">
      {/* 
        Two-Tone Precision Ruler Dock (ڕاستەی مێژوویی بە شێوازی شوشەی شلە - Liquid Glass)
      */}
      <div className="relative w-full liquid-glass-panel rounded-2xl sm:rounded-3xl p-2 sm:p-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_16px_45px_rgba(0,0,0,0.85),0_0_25px_rgba(245,158,11,0.15)] flex flex-col gap-1 sm:gap-2 transition-all overflow-hidden">
        <div className="glass-specular-ray" />

        {/* Tier 1: Top Status Header (ڕاستەوخۆ بەپێی جوڵەی ڕاستەکە دەگۆڕێت) */}
        <div className="flex items-center justify-between gap-1 sm:gap-1.5 w-full">
          {/* Right: Year Label & Fact Count */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg liquid-glass-btn flex items-center justify-center shrink-0 shadow-xs">
              <Calendar className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-amber-400" />
            </div>

            <div className="flex items-baseline gap-1.5 truncate">
              {/* ئەو ساڵەی لەسەرەوەیە ڕاستەوخۆ نوێ دەبێتەوە */}
              <span className="font-bold text-white text-[11px] sm:text-sm font-mono tracking-wide">
                {activeDisplayYear === 'all'
                  ? 'هەموو ساڵەکان'
                  : formatKurdishYear(activeDisplayYear)}
              </span>

              {/* Fact Count Pill */}
              <span className="text-[8px] sm:text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-amber-300 border border-white/15 shrink-0">
                {toKurdishDigits(filteredCount)} شوێن
              </span>
            </div>
          </div>

          {/* Left: Quick Actions Cluster */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Step -1 Year */}
            <button
              onClick={() => handleStepYear(-1)}
              title="١ ساڵ بۆ دواوە"
              className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg liquid-glass-btn text-slate-300 hover:text-amber-300 flex items-center justify-center transition-all cursor-pointer"
            >
              <ChevronRight className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
            </button>

            {/* Cinematic Guided Tour / Story Mode (گەشتی بینراوی مێژوویی) */}
            {onToggleTour && (
              <button
                onClick={onToggleTour}
                title={
                  isTourActive
                    ? 'وەستاندنی گەشتی بینراوی مێژوویی (Story Mode)'
                    : 'گەشتی بینراوی مێژوویی (Cinematic Guided Tour / Story Mode)'
                }
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                  isTourActive
                    ? 'liquid-glass-btn-active shadow-[0_0_12px_rgba(245,158,11,0.9)] animate-pulse text-black'
                    : 'liquid-glass-btn text-amber-300 hover:text-white'
                }`}
              >
                <Film className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
              </button>
            )}

            {/* Step +1 Year */}
            <button
              onClick={() => handleStepYear(1)}
              title="١ ساڵ بۆ پێشەوە"
              className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg liquid-glass-btn text-slate-300 hover:text-amber-300 flex items-center justify-center transition-all cursor-pointer"
            >
              <ChevronLeft className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
            </button>

            {/* Search Toggle */}
            <button
              onClick={() => setShowDirectInput(!showDirectInput)}
              title="دیاریکردنی ساڵ بە ژمارە"
              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                showDirectInput
                  ? 'liquid-glass-btn-active font-bold'
                  : 'liquid-glass-btn text-slate-300 hover:text-amber-300'
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
              className={`flex items-center gap-1 px-2 sm:px-2.5 h-5 sm:h-6 rounded-lg text-[9px] sm:text-[10px] font-bold transition-all cursor-pointer ${
                selectedYear === 'all'
                  ? 'liquid-glass-btn-active font-extrabold'
                  : 'liquid-glass-btn text-slate-200 hover:text-amber-300'
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
            className="flex items-center gap-1 sm:gap-1.5 p-1.5 rounded-xl liquid-glass-card animate-fade-in shadow-md"
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
              className="flex-1 liquid-glass-input text-white px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs focus:outline-none font-mono"
            />
            <button
              type="submit"
              className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg liquid-glass-btn-active text-black font-extrabold text-[10px] sm:text-xs cursor-pointer shadow-xs active:scale-95 transition-all"
            >
              بڕۆ
            </button>
            <button
              type="button"
              onClick={() => setShowDirectInput(false)}
              className="p-0.5 sm:p-1 rounded-lg liquid-glass-btn text-slate-300 hover:text-white"
            >
              <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </button>
          </form>
        )}

        {/* 
          Tier 2: The Precision Ruler Controller (ڕاستەی پێوان)
          Each centimeter is a graduated measure; user drags or scrolls it like a physical ruler!
        */}
        <div className="relative w-full flex items-center gap-1 sm:gap-1.5 border-t border-white/10 pt-1">
          {/* Scroll forward / right nudge */}
          <button
            type="button"
            onClick={() => handleScrollRuler('right')}
            title="سکرۆڵکردنی ڕاستە بۆ پێشەوە"
            className="w-4 h-7 sm:w-6 sm:h-9 rounded-lg liquid-glass-btn text-slate-300 hover:text-amber-300 flex items-center justify-center shrink-0 cursor-pointer"
          >
            <ChevronRight className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
          </button>

          {/* Precision Ruler Strip (شوشەی شلە بە دەرزی زێڕینی پێوانە) */}
          <div className="relative flex-1 liquid-glass-subtle rounded-xl overflow-hidden py-0.5 sm:py-1 px-0.5 sm:px-1 shadow-inner">
            {/* Center Fixed Hairline Indicator (دەرزی پێوانەی ناوەڕاست) */}
            <div
              className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-[1px] sm:w-0.5 bg-amber-400 z-20 pointer-events-none flex flex-col justify-between items-center"
              style={{ boxShadow: '0 0 10px var(--theme-accent)' }}
            >
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
              dir="ltr"
              className={`timeline-ruler-container flex items-end gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none py-0.5 sm:py-1.5 px-10 sm:px-24 min-h-[26px] sm:min-h-[44px] select-none ${
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

          {/* Scroll backward / left nudge */}
          <button
            type="button"
            onClick={() => handleScrollRuler('left')}
            title="سکرۆڵکردنی ڕاستە بۆ دواوە"
            className="w-4 h-7 sm:w-6 sm:h-9 rounded-lg liquid-glass-btn text-slate-300 hover:text-amber-300 flex items-center justify-center shrink-0 cursor-pointer"
          >
            <ChevronLeft className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
