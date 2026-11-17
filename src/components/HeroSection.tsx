import React, { useState, useEffect } from 'react';
import {
  Map,
  BookOpen,
  SlidersHorizontal,
  History,
  ArrowRight,
  ArrowLeft,
  Sun,
  Moon,
} from 'lucide-react';
import { FactItem } from '../data/kurdishHistoryData';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

// Automatically pick up local user-provided hero background images if present in src/assets/images/hero/
const localHeroImageModules = import.meta.glob('../assets/images/hero/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const LOCAL_HERO_IMAGES: string[] = Object.keys(localHeroImageModules)
  .sort()
  .map((key) => localHeroImageModules[key])
  .filter(Boolean);

const HERO_MOTION_CLASSES = [
  'hero-move-rtl',
  'hero-move-ltr',
  'hero-move-ttb',
  'hero-move-btt',
] as const;

interface Props {
  facts: FactItem[];
  onEnterMap: () => void;
  onOpenMenu: () => void;
  onOpenSettings: () => void;
  onOpenJourney?: () => void;
  onSelectFactFromHero?: (fact: FactItem) => void;
  onSearchToDirectory?: (query: string) => void;
}

export const HeroSection: React.FC<Props> = ({
  onEnterMap,
  onOpenMenu,
  onOpenSettings,
  onOpenJourney,
}) => {
  const { colorMode, toggleColorMode } = useTheme();
  const { language, isEn, dir, setLanguage } = useLanguage();
  const isDark = colorMode === 'dark';

  const [slideState, setSlideState] = useState<{
    activeIndex: number;
    step: number;
    motions: number[];
  }>(() => ({
    activeIndex: 0,
    step: 0,
    motions: LOCAL_HERO_IMAGES.map((_, idx) => idx % HERO_MOTION_CLASSES.length),
  }));

  const hasLocalPhotos = LOCAL_HERO_IMAGES.length > 0;

  useEffect(() => {
    if (LOCAL_HERO_IMAGES.length <= 1) return;
    const timer = window.setInterval(() => {
      setSlideState((prev) => {
        const nextIndex = (prev.activeIndex + 1) % LOCAL_HERO_IMAGES.length;
        const nextStep = prev.step + 1;
        const nextMotions = [...prev.motions];
        nextMotions[nextIndex] = nextStep % HERO_MOTION_CLASSES.length;
        return {
          activeIndex: nextIndex,
          step: nextStep,
          motions: nextMotions,
        };
      });
    }, 7000);
    return () => window.clearInterval(timer);
  }, []);

  const ForwardArrow = isEn ? ArrowRight : ArrowLeft;
  // Use dark editorial contrast whenever local photographs are shown OR dark mode is active
  const useDarkSurface = hasLocalPhotos || isDark;

  return (
    <section
      id="hero-section"
      dir={dir}
      className={`fixed inset-0 z-40 w-full h-full overflow-y-auto overflow-x-hidden flex flex-col font-sans animate-fade-in transition-colors duration-300 ${
        useDarkSurface
          ? 'preserve-contrast bg-[#070a12] text-white'
          : 'bg-[#f6f3ec] text-slate-900'
      }`}
    >
      {/* Background: Local user-provided hero photos BG(1), BG(2), BG(3) with 4-directional motion */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
        {hasLocalPhotos ? (
          <>
            {LOCAL_HERO_IMAGES.map((src, idx) => {
              const motionIndex = slideState.motions[idx] ?? 0;
              const motionClass = HERO_MOTION_CLASSES[motionIndex];
              const isActive = idx === slideState.activeIndex;
              return (
                <div
                  key={src}
                  className={`absolute inset-0 overflow-hidden transition-opacity duration-[1400ms] ease-in-out ${
                    isActive ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <img
                    key={`${src}-${motionIndex}`}
                    src={src}
                    alt={`Kurdistan Info Map ${idx + 1}`}
                    loading="eager"
                    decoding="async"
                    className={`w-full h-full object-cover object-center ${motionClass}`}
                  />
                </div>
              );
            })}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(6,9,18,0.72) 0%, rgba(6,9,18,0.36) 46%, rgba(6,9,18,0.82) 100%)',
              }}
            />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: isDark
                ? 'radial-gradient(ellipse 75% 55% at 50% 34%, rgba(245, 158, 11, 0.10) 0%, rgba(15, 23, 42, 0.45) 52%, rgba(7, 10, 18, 1) 100%)'
                : 'radial-gradient(ellipse 75% 55% at 50% 34%, rgba(180, 83, 9, 0.08) 0%, rgba(246, 243, 236, 0.6) 55%, rgba(246, 243, 236, 1) 100%)',
            }}
          />
        )}
      </div>

      {/* Minimal Top Utility Bar (no duplicate logo/brand text) */}
      <header className="relative z-20 w-full max-w-6xl mx-auto px-4 sm:px-8 pt-4 sm:pt-5 flex items-center justify-end shrink-0">
        <div className="flex items-center gap-2" dir="ltr">
          <button
            type="button"
            onClick={toggleColorMode}
            className={`h-9 w-9 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
              useDarkSurface
                ? 'bg-white/10 hover:bg-white/20 border-white/15 text-amber-300'
                : 'bg-white/80 hover:bg-white border-slate-300/80 text-amber-700 shadow-xs'
            }`}
            title={isDark ? (isEn ? 'Light Mode' : 'دۆخی ڕووناک') : isEn ? 'Dark Mode' : 'دۆخی تاریک'}
            aria-label={isDark ? (isEn ? 'Light Mode' : 'دۆخی ڕووناک') : isEn ? 'Dark Mode' : 'دۆخی تاریک'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div
            className={`flex items-center p-0.5 rounded-lg border ${
              useDarkSurface
                ? 'bg-black/45 border-white/15'
                : 'bg-white/80 border-slate-300/80 shadow-xs'
            }`}
          >
            <button
              type="button"
              onClick={() => setLanguage('ckb')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                language === 'ckb'
                  ? useDarkSurface
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-amber-700 text-white'
                  : useDarkSurface
                  ? 'text-slate-200 hover:text-white'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              کوردی
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                language === 'en'
                  ? useDarkSurface
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-amber-700 text-white'
                  : useDarkSurface
                  ? 'text-slate-200 hover:text-white'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              EN
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenSettings}
            className={`h-9 px-3 rounded-lg border flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${
              useDarkSurface
                ? 'bg-white/10 hover:bg-white/20 border-white/15 text-slate-100'
                : 'bg-white/80 hover:bg-white border-slate-300/80 text-slate-800 shadow-xs'
            }`}
            title={isEn ? 'Settings' : 'ڕێکخستنەکان'}
          >
            <SlidersHorizontal
              className={`w-3.5 h-3.5 ${useDarkSurface ? 'text-amber-300' : 'text-amber-700'}`}
            />
            <span className="hidden sm:inline">{isEn ? 'Settings' : 'ڕێکخستن'}</span>
          </button>
        </div>
      </header>

      {/* Main Hero Area: Upper Emblem & Masthead + Bottom Navigation Actions */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-between px-4 sm:px-6 pt-6 sm:pt-10 pb-8 sm:pb-12 text-center max-w-3xl mx-auto w-full">
        {/* Top Focal Masthead */}
        <div className="flex flex-col items-center">
          <img
            src="/kimlogo.png"
            alt="Kurdistan Info Map"
            className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-2xl sm:rounded-3xl object-contain mb-4 drop-shadow-[0_8px_28px_rgba(245,158,11,0.38)]"
          />
          <h1
            dir="ltr"
            style={{ fontFamily: "'Cinzel', 'Playfair Display', 'Noto Serif', Georgia, serif" }}
            className={`font-bold text-3xl sm:text-5xl md:text-6xl tracking-wide leading-tight ${
              useDarkSurface
                ? 'text-white drop-shadow-[0_6px_24px_rgba(0,0,0,0.85)]'
                : 'text-slate-950'
            }`}
          >
            Kurdistan{' '}
            <span className={useDarkSurface ? 'text-amber-400' : 'text-amber-700'}>Info Map</span>
          </h1>
          <p
            dir={isEn ? 'ltr' : 'rtl'}
            className={`mt-2.5 text-xs sm:text-sm md:text-base font-medium ${
              isEn ? 'tracking-[0.22em] uppercase' : 'tracking-normal'
            } ${
              useDarkSurface
                ? 'text-amber-100/90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]'
                : 'text-slate-700'
            }`}
          >
            {isEn ? 'KURDISTAN . CULTURE . HISTORY' : 'کوردستان . کلتوور . مێژوو'}
          </p>
        </div>

        {/* Bottom Primary CTA + Secondary Actions */}
        <div className="flex flex-col items-center gap-3.5 w-full pt-8">
          <button
            type="button"
            onClick={onEnterMap}
            className={`inline-flex items-center justify-center gap-2.5 px-10 py-3.5 rounded-xl font-black text-sm sm:text-base transition-all cursor-pointer active:scale-[0.98] ${
              useDarkSurface
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-[0_10px_28px_rgba(245,158,11,0.30)]'
                : 'bg-amber-700 hover:bg-amber-800 text-white shadow-[0_10px_24px_rgba(180,83,9,0.22)]'
            }`}
          >
            <Map className="w-5 h-5 shrink-0" />
            <span>{isEn ? 'Map' : 'نــەخشـە'}</span>
            <ForwardArrow className="w-4 h-4 shrink-0" />
          </button>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={onOpenMenu}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                useDarkSurface
                  ? 'bg-white/[0.06] hover:bg-white/[0.12] border-white/15 text-slate-200 hover:text-white'
                  : 'bg-white/80 hover:bg-white border-slate-300/80 text-slate-800 hover:text-slate-950 shadow-xs'
              }`}
            >
              <BookOpen
                className={`w-4 h-4 shrink-0 ${useDarkSurface ? 'text-amber-400' : 'text-amber-700'}`}
              />
              <span>{isEn ? 'Archive Directory' : 'ئەرشیف و پێڕست'}</span>
            </button>

            <button
              type="button"
              onClick={() => (onOpenJourney ? onOpenJourney() : onEnterMap())}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                useDarkSurface
                  ? 'bg-white/[0.06] hover:bg-white/[0.12] border-white/15 text-slate-200 hover:text-white'
                  : 'bg-white/80 hover:bg-white border-slate-300/80 text-slate-800 hover:text-slate-950 shadow-xs'
              }`}
            >
              <History
                className={`w-4 h-4 shrink-0 ${useDarkSurface ? 'text-amber-400' : 'text-amber-700'}`}
              />
              <span>{isEn ? 'Info' : 'زانیاری'}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};


