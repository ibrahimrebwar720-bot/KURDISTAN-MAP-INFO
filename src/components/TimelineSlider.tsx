import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Calendar,
  Layers,
  Hash,
  X,
} from 'lucide-react';
import { FactItem } from '../data/kurdishHistoryData';
import {
  MIN_HISTORICAL_YEAR,
  MAX_HISTORICAL_YEAR,
  formatKurdishYear,
  formatDigits,
  normalizeYearString,
} from '../utils/yearUtils';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

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
}) => {
  const { language, isEn, dir } = useLanguage();
  const { colorMode } = useTheme();
  const isDark = colorMode === 'dark';
  const [directInputYear, setDirectInputYear] = useState('');
  const [directInputEra, setDirectInputEra] = useState<'AD' | 'BC'>('AD');
  const [showDirectInput, setShowDirectInput] = useState(false);
  const [scrubYear, setScrubYear] = useState<number | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

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
  const isPhysicallyInteractingRef = useRef(false);
  const isProgrammaticScrollRef = useRef(true);
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
      marks.push({ year: y, type: 'cm', label: formatKurdishYear(y, language) });
      marks.push({ year: y + 50, type: 'half' });
    }

    for (let y = -500; y < 500; y += 50) {
      marks.push({
        year: y,
        type: y % 100 === 0 ? 'cm' : 'half',
        label: y % 100 === 0 ? formatKurdishYear(y, language) : undefined,
      });
      marks.push({ year: y + 25, type: 'mm' });
    }

    for (let y = 500; y < 1800; y += 25) {
      marks.push({
        year: y,
        type: y % 50 === 0 ? 'cm' : 'half',
        label: y % 50 === 0 ? formatKurdishYear(y, language) : undefined,
      });
      marks.push({ year: y + 10, type: 'mm' });
    }

    // 2. Modern Era Ruler Marks (1800 to 2026)
    for (let y = 1800; y <= 2026; y += 1) {
      if (y % 10 === 0) {
        marks.push({
          year: y,
          type: 'cm',
          label: formatDigits(y, language),
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
          label: factYearsSet.has(y) ? formatDigits(y, language) : undefined,
        });
      }
    }

    // Add any remaining exact fact years not on the grid
    factYearsSet.forEach((fy) => {
      if (!marks.some((m) => m.year === fy)) {
        marks.push({
          year: fy,
          type: 'cm',
          label: formatKurdishYear(fy, language),
          isFactYear: true,
        });
      }
    });

    return marks.sort((a, b) => a.year - b.year);
  }, [facts, language]);

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

    const targetLeft =
      activeEl.offsetLeft - container.clientWidth / 2 + activeEl.offsetWidth / 2;
    container.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: smooth ? 'smooth' : 'auto',
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
    if (scrollDebounceTimerRef.current) {
      clearTimeout(scrollDebounceTimerRef.current);
    }
    isProgrammaticScrollRef.current = true;
    isPhysicallyInteractingRef.current = false;
    isUserInteractingRef.current = false;
    setScrubYear(null);
    const current = typeof selectedYear === 'number' ? selectedYear : 1940;
    const next = Math.max(MIN_HISTORICAL_YEAR, Math.min(MAX_HISTORICAL_YEAR, current + delta));
    onYearChange(next);
    setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 450);
  };

  // Direct Numeric Year Jump Submit
  const handleDirectJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directInputYear.trim()) return;
    const norm = normalizeYearString(directInputYear.trim());
    const match = norm.match(/-?\d+/);
    if (match) {
      let num = parseInt(match[0], 10);
      const lower = directInputYear.toLowerCase();
      if (
        directInputEra === 'BC' ||
        directInputYear.includes('پ.ز') ||
        directInputYear.includes('پێش') ||
        lower.includes('bc') ||
        num < 0
      ) {
        num = -Math.abs(num);
      } else {
        num = Math.abs(num);
      }
      if (num >= MIN_HISTORICAL_YEAR && num <= MAX_HISTORICAL_YEAR) {
        if (scrollDebounceTimerRef.current) {
          clearTimeout(scrollDebounceTimerRef.current);
        }
        isProgrammaticScrollRef.current = true;
        isPhysicallyInteractingRef.current = false;
        isUserInteractingRef.current = false;
        setScrubYear(null);
        onYearChange(num);
        setShowDirectInput(false);
        setDirectInputYear('');
        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 450);
      }
    }
  };

  // Wheel & Trackpad scrolling
  const handleWheel = (e: React.WheelEvent) => {
    if (!rulerContainerRef.current) return;
    isPhysicallyInteractingRef.current = true;
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
    isPhysicallyInteractingRef.current = true;
    isUserInteractingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragScrollLeftRef.current = rulerContainerRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !rulerContainerRef.current) return;
    e.preventDefault();
    isPhysicallyInteractingRef.current = true;
    isUserInteractingRef.current = true;
    const deltaX = e.clientX - dragStartXRef.current;
    rulerContainerRef.current.scrollLeft = dragScrollLeftRef.current - deltaX;
  };

  const handleMouseUpOrLeave = () => {
    if (isDragging) {
      setIsDragging(false);
    }
    setTimeout(() => {
      isPhysicallyInteractingRef.current = false;
    }, 120);
  };

  // Touch on Mobile
  const handleTouchStart = () => {
    isPhysicallyInteractingRef.current = true;
    isUserInteractingRef.current = true;
  };

  const handleTouchEnd = () => {
    setTimeout(() => {
      isPhysicallyInteractingRef.current = false;
    }, 250);
  };

  // Native scroll listener on container (synchronizes on swipe, trackpad, inertia)
  const handleScroll = () => {
    if (isProgrammaticScrollRef.current) return;
    if (!rulerContainerRef.current) return;

    // Discard passive/layout reflow scroll events when user did not physically drag/touch
    if (!isPhysicallyInteractingRef.current && !isDragging) return;

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
      if (!isProgrammaticScrollRef.current && rulerContainerRef.current && (isPhysicallyInteractingRef.current || isDragging)) {
        const finalYear = getYearAtNeedle();
        if (finalYear !== null && finalYear !== selectedYearRef.current) {
          onYearChange(finalYear);
        }
      }
      setScrubYear(null);
      isPhysicallyInteractingRef.current = false;
      isUserInteractingRef.current = false;
    }, 110);
  };

  // Toggle "All" button: Clicking when active toggles it off and restores previous year!
  const handleToggleAllYears = () => {
    // 1. Immediately cancel any pending scroll debounce timer
    if (scrollDebounceTimerRef.current) {
      clearTimeout(scrollDebounceTimerRef.current);
    }
    // 2. Lock programmatic scroll so reflow scroll events cannot revert 'all'
    isProgrammaticScrollRef.current = true;
    isPhysicallyInteractingRef.current = false;
    isUserInteractingRef.current = false;
    setScrubYear(null);

    if (selectedYear === 'all') {
      onYearChange(lastNumericYearRef.current || 1940);
    } else {
      onYearChange('all');
    }

    // 3. Keep lock active long enough for DOM updates and reflow to finish
    setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 550);
  };

  // 1-Click Quick Jump to a historical era / year
  const handleJumpToYearDirect = (year: number | 'all') => {
    if (scrollDebounceTimerRef.current) {
      clearTimeout(scrollDebounceTimerRef.current);
    }
    isProgrammaticScrollRef.current = true;
    isPhysicallyInteractingRef.current = false;
    isUserInteractingRef.current = false;
    setScrubYear(null);
    onYearChange(year);
    setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 500);
  };

  const activeDisplayYear = scrubYear !== null ? scrubYear : selectedYear;

  return (
    <div
      className="w-full max-w-xl flex flex-col items-center gap-0.5 text-start select-none transition-all"
      dir={dir}
    >
      {/* 2026 Spatial Chronological Dock */}
      <div className="relative w-full glass-dock-2026 rounded-xl sm:rounded-2xl px-2.5 py-1.5 sm:px-3 sm:py-1.5 flex flex-col gap-1 sm:gap-1.5 transition-all overflow-hidden shadow-2xl">
        {/* Tier 1: Slim Top Status Header */}
        <div className="flex items-center justify-between gap-1.5 w-full min-h-[28px]">
          {/* Year Label & Fact Count */}
          <button
            type="button"
            onClick={() => {
              if (isCollapsed) setIsCollapsed(false);
              setShowDirectInput((prev) => !prev);
            }}
            title={isEn ? 'Click to enter a year by number' : 'کلیک بکە بۆ دیاریکردنی ساڵ بە ژمارە'}
            className="flex items-center gap-1.5 sm:gap-2 min-w-0 cursor-pointer group text-start"
          >
            <div
              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg border flex items-center justify-center shrink-0 shadow-xs ${
                isDark
                  ? 'bg-white/[0.06] border-white/[0.1] group-hover:border-amber-400/50'
                  : 'bg-slate-100 border-slate-300 group-hover:border-amber-500'
              }`}
            >
              <Calendar
                className={`w-3 h-3 ${
                  isDark ? 'text-amber-400' : 'text-amber-800'
                }`}
              />
            </div>

            <div className="flex items-center gap-1.5 truncate">
              <span
                className={`font-extrabold text-[11px] sm:text-xs font-mono tracking-wide transition-colors ${
                  isDark ? 'text-white group-hover:text-amber-300' : 'text-slate-900 group-hover:text-amber-800'
                }`}
              >
                {activeDisplayYear === 'all'
                  ? isEn
                    ? 'All Years'
                    : 'هەموو ساڵەکان'
                  : formatKurdishYear(activeDisplayYear, language)}
              </span>

              <span className={`font-mono text-[10px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>·</span>
              <span
                className={`text-[10px] sm:text-[11px] font-mono font-semibold tabular-nums ${
                  isDark ? 'text-amber-300/90' : 'text-amber-800'
                }`}
              >
                {formatDigits(filteredCount, language)} {isEn ? 'sites' : 'شوێن'}
              </span>
            </div>
          </button>

          {/* Quick Actions Cluster */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Step -1 Year */}
            <button
              type="button"
              onClick={() => handleStepYear(-1)}
              title={isEn ? 'Step -1 year' : '١ ساڵ بۆ دواوە'}
              className={`h-7 min-w-[28px] px-1 rounded-lg flex items-center justify-center transition-all cursor-pointer border active:scale-95 ${
                isDark
                  ? 'bg-white/[0.06] hover:bg-white/[0.14] text-slate-200 hover:text-amber-300 border-white/[0.1]'
                  : 'bg-white hover:bg-slate-100 text-slate-800 hover:text-amber-800 border-slate-300 shadow-xs'
              }`}
            >
              {isEn ? (
                <ChevronLeft className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Step +1 Year */}
            <button
              type="button"
              onClick={() => handleStepYear(1)}
              title={isEn ? 'Step +1 year' : '١ ساڵ بۆ پێشەوە'}
              className={`h-7 min-w-[28px] px-1 rounded-lg flex items-center justify-center transition-all cursor-pointer border active:scale-95 ${
                isDark
                  ? 'bg-white/[0.06] hover:bg-white/[0.14] text-slate-200 hover:text-amber-300 border-white/[0.1]'
                  : 'bg-white hover:bg-slate-100 text-slate-800 hover:text-amber-800 border-slate-300 shadow-xs'
              }`}
            >
              {isEn ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronLeft className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Numeric Year Selection Toggle */}
            <button
              type="button"
              onClick={() => {
                if (isCollapsed) setIsCollapsed(false);
                if (!showDirectInput && typeof selectedYear === 'number') {
                  setDirectInputYear(Math.abs(selectedYear).toString());
                  setDirectInputEra(selectedYear < 0 ? 'BC' : 'AD');
                }
                setShowDirectInput((prev) => !prev);
              }}
              title={isEn ? 'Select year by number' : 'دیاریکردنی ساڵ بە ژمارە'}
              className={`h-7 px-2 rounded-lg flex items-center gap-1 text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer active:scale-95 border ${
                showDirectInput
                  ? 'liquid-glass-btn-active font-bold'
                  : isDark
                  ? 'bg-white/[0.06] hover:bg-white/[0.14] text-slate-200 hover:text-amber-300 border-white/[0.1]'
                  : 'bg-white hover:bg-slate-100 text-slate-800 hover:text-amber-800 border-slate-300 shadow-xs'
              }`}
            >
              <Hash className="w-3 h-3 shrink-0" />
              <span>{isEn ? 'Year' : 'ساڵ'}</span>
            </button>

            {/* Toggle All Years Button */}
            <button
              type="button"
              onClick={handleToggleAllYears}
              title={
                selectedYear === 'all'
                  ? isEn
                    ? 'Click again to restore selected year'
                    : 'کلیک بکەرەوە بۆ گەڕانەوە بۆ ساڵی دیاریکراو'
                  : isEn
                  ? 'Show all historical years'
                  : 'پیشاندانی هەموو ساڵەکان'
              }
              className={`flex items-center gap-1 px-2 h-7 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer border active:scale-95 ${
                selectedYear === 'all'
                  ? 'liquid-glass-btn-active font-extrabold'
                  : isDark
                  ? 'bg-white/[0.06] hover:bg-white/[0.14] text-slate-200 hover:text-amber-300 border-white/[0.1]'
                  : 'bg-white hover:bg-slate-100 text-slate-800 hover:text-amber-800 border-slate-300 shadow-xs'
              }`}
            >
              <Layers className="w-3 h-3 shrink-0" />
              <span>{isEn ? 'All' : 'هەمووی'}</span>
            </button>

            {/* Collapse / Expand Timeline Ruler */}
            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              title={isCollapsed ? (isEn ? 'Expand timeline' : 'کردنەوەی هێڵی کات') : (isEn ? 'Minimize timeline' : 'بچووککردنەوەی هێڵی کات')}
              className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all cursor-pointer border active:scale-95 ${
                isDark
                  ? 'bg-white/[0.06] hover:bg-white/[0.14] text-slate-300 hover:text-white border-white/[0.1]'
                  : 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-950 border-slate-300 shadow-xs'
              }`}
            >
              {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Numeric Year Entry Form */}
        {!isCollapsed && showDirectInput && (
          <form
            onSubmit={handleDirectJumpSubmit}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl liquid-glass-card animate-fade-in shadow-md"
          >
            <span
              className={`text-[11px] font-bold shrink-0 ${
                isDark ? 'text-amber-400' : 'text-amber-800'
              }`}
            >
              {isEn ? 'Year #:' : 'ژمارەی ساڵ:'}
            </span>
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              value={directInputYear}
              onChange={(e) => setDirectInputYear(e.target.value)}
              placeholder={isEn ? 'e.g. 1946 or 612' : 'نموونە: 1946 یان 612'}
              className={`flex-1 min-w-0 liquid-glass-input px-2.5 py-1 rounded-lg text-xs focus:outline-none font-mono ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            />
            <button
              type="button"
              onClick={() => setDirectInputEra((prev) => (prev === 'AD' ? 'BC' : 'AD'))}
              title={isEn ? 'Toggle CE / BCE' : 'گۆڕینی زایینی / پ.ز'}
              className={`px-2 py-1 rounded-lg text-[10px] font-extrabold border cursor-pointer shrink-0 transition-colors ${
                directInputEra === 'BC'
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : isDark
                  ? 'bg-white/[0.08] text-slate-200 border-white/15 hover:bg-white/[0.15]'
                  : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
              }`}
            >
              {directInputEra === 'BC' ? (isEn ? 'BCE' : 'پ.ز') : isEn ? 'CE' : 'ز'}
            </button>
            <button
              type="submit"
              className="px-2.5 py-1 rounded-lg liquid-glass-btn-active font-extrabold text-[11px] cursor-pointer shadow-xs active:scale-95 transition-all shrink-0"
            >
              {isEn ? 'Go' : 'بڕۆ'}
            </button>
            <button
              type="button"
              onClick={() => setShowDirectInput(false)}
              className={`p-1 rounded-lg liquid-glass-btn shrink-0 ${
                isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Tier 2: Precision Ruler Controller */}
        {!isCollapsed && (
        <div
          className={`relative w-full flex items-center gap-1.5 border-t pt-1.5 ${
            isDark ? 'border-white/10' : 'border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={() => handleScrollRuler(isEn ? 'left' : 'right')}
            title={isEn ? 'Scroll ruler earlier' : 'سکرۆڵکردنی ڕاستە بۆ پێشەوە'}
            className={`w-8 h-9 sm:w-9 sm:h-10 rounded-xl liquid-glass-btn flex items-center justify-center shrink-0 cursor-pointer ${
              isDark ? 'text-slate-300 hover:text-amber-300' : 'text-slate-700 hover:text-amber-800'
            }`}
          >
            {isEn ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          <div className="relative flex-1 liquid-glass-subtle rounded-xl overflow-hidden py-0.5 sm:py-1 px-0.5 sm:px-1 shadow-inner">
            <div
              className={`absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-[1px] sm:w-0.5 z-20 pointer-events-none flex flex-col justify-between items-center ${
                isDark ? 'bg-amber-400' : 'bg-amber-700'
              }`}
              style={{ boxShadow: '0 0 10px var(--theme-accent)' }}
            >
              <span
                className={`text-[5px] sm:text-[7px] -mt-0.5 leading-none select-none ${
                  isDark ? 'text-amber-400' : 'text-amber-700'
                }`}
              >
                ▼
              </span>
              <span
                className={`text-[5px] sm:text-[7px] -mb-0.5 leading-none select-none ${
                  isDark ? 'text-amber-400' : 'text-amber-700'
                }`}
              >
                ▲
              </span>
            </div>

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
                      if (scrollDebounceTimerRef.current) {
                        clearTimeout(scrollDebounceTimerRef.current);
                      }
                      isProgrammaticScrollRef.current = true;
                      isPhysicallyInteractingRef.current = false;
                      isUserInteractingRef.current = false;
                      setScrubYear(null);
                      onYearChange(mark.year);
                      setTimeout(() => {
                        isProgrammaticScrollRef.current = false;
                      }, 450);
                    }}
                    title={isEn ? `Year ${formatKurdishYear(mark.year, 'en')}` : `ساڵی ${formatKurdishYear(mark.year, 'ckb')}`}
                    className={`group flex flex-col items-center justify-end shrink-0 cursor-pointer px-0.5 relative ${
                      isSelected ? 'scale-110 z-10' : 'opacity-85 hover:opacity-100'
                    }`}
                  >
                    <div
                      className={`rounded-none ${
                        isSelected
                          ? isDark
                            ? 'w-1 h-4 sm:h-5.5 bg-amber-400 shadow-[0_0_10px_#f59e0b]'
                            : 'w-1 h-4 sm:h-5.5 bg-amber-700 shadow-[0_0_8px_rgba(180,83,9,0.5)]'
                          : mark.type === 'cm'
                          ? isDark
                            ? 'w-[1.5px] h-3 sm:h-4 bg-amber-400/90 group-hover:bg-amber-300'
                            : 'w-[1.5px] h-3 sm:h-4 bg-amber-800/80 group-hover:bg-amber-900'
                          : mark.type === 'half'
                          ? isDark
                            ? 'w-[1px] h-2 sm:h-2.5 bg-amber-400/50 group-hover:bg-amber-400'
                            : 'w-[1px] h-2 sm:h-2.5 bg-amber-800/50 group-hover:bg-amber-800'
                          : isDark
                          ? 'w-[1px] h-1.5 bg-amber-400/25 group-hover:bg-amber-400/60'
                          : 'w-[1px] h-1.5 bg-amber-800/25 group-hover:bg-amber-800/60'
                      }`}
                    />

                    {(mark.label || isSelected) && (
                      <span
                        className={`text-[7px] sm:text-[8px] font-mono leading-none mt-0.5 sm:mt-1 tracking-tighter whitespace-nowrap select-none transition-colors ${
                          isSelected
                            ? isDark
                              ? 'text-amber-300 font-bold scale-105'
                              : 'text-amber-900 font-bold scale-105'
                            : mark.isFactYear
                            ? isDark
                              ? 'text-amber-400/90 font-semibold'
                              : 'text-amber-800 font-semibold'
                            : isDark
                            ? 'text-slate-400/80 group-hover:text-amber-300'
                            : 'text-slate-600 group-hover:text-amber-900'
                        }`}
                      >
                        {mark.label || formatDigits(mark.year, language)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleScrollRuler(isEn ? 'right' : 'left')}
            title={isEn ? 'Scroll ruler later' : 'سکرۆڵکردنی ڕاستە بۆ دواوە'}
            className={`w-8 h-9 sm:w-9 sm:h-10 rounded-xl liquid-glass-btn flex items-center justify-center shrink-0 cursor-pointer ${
              isDark ? 'text-slate-300 hover:text-amber-300' : 'text-slate-700 hover:text-amber-800'
            }`}
          >
            {isEn ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
        )}
      </div>
    </div>
  );
};
