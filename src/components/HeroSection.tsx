import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Map,
  BookOpen,
  SlidersHorizontal,
  Compass,
  History,
  Sparkles,
} from 'lucide-react';
import { FactItem } from '../data/kurdishHistoryData';
import { getAllFactImages } from '../utils/historicalImages';
import { getOptimizedImageUrl } from '../utils/imageUtils';
import { useTheme } from '../context/ThemeContext';

interface HeroWallpaperItem {
  url: string;
  title: string;
  caption?: string;
  eraName?: string;
  region?: string;
}

interface Props {
  facts: FactItem[];
  onEnterMap: () => void;
  onOpenMenu: () => void;
  onOpenSettings: () => void;
  onOpenGallery?: () => void;
  onOpenJourney?: () => void;
}

interface HeroSlideProps {
  wallpaper: HeroWallpaperItem;
  index: number;
  opacity: number;
  zIndex: number;
  aspectCache: React.MutableRefObject<Record<string, number>>;
  onLoaded?: () => void;
}

const HeroSlide: React.FC<HeroSlideProps> = ({
  wallpaper,
  index,
  opacity,
  zIndex,
  aspectCache,
  onLoaded,
}) => {
  const [aspect, setAspect] = useState<number>(() => {
    return aspectCache.current[wallpaper.url] || 1.5;
  });

  const optimizedUrl = getOptimizedImageUrl(wallpaper.url, 'full');
  const isLandscape = aspect >= 1.0;
  const panClass = isLandscape
    ? index % 2 === 0
      ? 'hero-pan-rtl'
      : 'hero-pan-ltr'
    : index % 2 === 0
    ? 'hero-pan-up'
    : 'hero-pan-down';

  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none select-none transition-opacity duration-1500 ease-in-out"
      style={{ opacity, zIndex, willChange: 'opacity' }}
    >
      {/* Layer 1: Ambient Blurred Backdrop */}
      <img
        src={optimizedUrl}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover scale-125 blur-3xl opacity-40 select-none pointer-events-none"
        style={{ transformOrigin: 'center center' }}
      />

      {/* Layer 2: Sharp Foreground Image with Slow Cinematic Pan */}
      <img
        src={optimizedUrl}
        alt={wallpaper.title || 'Kurdistan Info Map'}
        onLoad={(e) => {
          const { naturalWidth, naturalHeight } = e.currentTarget;
          if (naturalWidth && naturalHeight) {
            const asp = naturalWidth / naturalHeight;
            aspectCache.current[wallpaper.url] = asp;
            setAspect(asp);
          }
          if (onLoaded) {
            onLoaded();
          }
        }}
        className={`w-full h-full object-cover object-center ${panClass}`}
        style={{ transformOrigin: 'center center' }}
      />
    </div>
  );
};

export const HeroSection: React.FC<Props> = ({
  facts,
  onEnterMap,
  onOpenMenu,
  onOpenSettings,
  onOpenJourney,
}) => {
  const { theme } = useTheme();

  // 1. Responsive Screen Orientation Tracking
  const [isPortrait, setIsPortrait] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerHeight > window.innerWidth;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortrait(portrait);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // 2. ONLY use authentic images recorded in the user's facts database (NO arbitrary stock images)
  const wallpapers: HeroWallpaperItem[] = useMemo(() => {
    const list: HeroWallpaperItem[] = [];
    const seen = new Set<string>();

    if (Array.isArray(facts)) {
      for (const fact of facts) {
        const factImages = getAllFactImages(fact);
        for (const img of factImages) {
          if (img.url && typeof img.url === 'string' && img.url.trim() && !seen.has(img.url)) {
            seen.add(img.url);
            list.push({
              url: img.url,
              title: fact.name,
              caption: img.caption || fact.desc || '',
              eraName: fact.eraName,
              region: fact.region,
            });
          }
        }
      }
    }

    return list;
  }, [facts]);

  // 3. Persistent Dual-Slot crossfading mechanism (Zero unmount / Zero animation reset)
  interface SlotData {
    wallpaper: HeroWallpaperItem;
    index: number;
    id: string;
  }

  const [slotA, setSlotA] = useState<SlotData | null>(() => {
    return wallpapers.length > 0
      ? { wallpaper: wallpapers[0], index: 0, id: `slot-0-${wallpapers[0].url}` }
      : null;
  });
  const [slotB, setSlotB] = useState<SlotData | null>(null);
  const [activeSlot, setActiveSlot] = useState<'A' | 'B'>('A');

  const currentIndexRef = useRef(0);
  const activeSlotRef = useRef<'A' | 'B'>('A');
  const aspectCache = useRef<Record<string, number>>({});

  useEffect(() => {
    activeSlotRef.current = activeSlot;
  }, [activeSlot]);

  // If initial wallpapers become available after load
  useEffect(() => {
    if (wallpapers.length > 0 && !slotA && !slotB) {
      setSlotA({
        wallpaper: wallpapers[0],
        index: 0,
        id: `slot-0-${wallpapers[0].url}`,
      });
      setActiveSlot('A');
      currentIndexRef.current = 0;
    }
  }, [wallpapers, slotA, slotB]);

  // Pre-probe & cache images and aspect ratios
  useEffect(() => {
    if (!wallpapers || wallpapers.length === 0) return;
    wallpapers.forEach((wp) => {
      if (!wp.url) return;
      const img = new Image();
      img.src = getOptimizedImageUrl(wp.url, 'full');
      img.onload = () => {
        if (img.naturalWidth && img.naturalHeight) {
          aspectCache.current[wp.url] = img.naturalWidth / img.naturalHeight;
        }
      };
    });
  }, [wallpapers]);

  // Advance to next wallpaper
  const advanceToNext = useCallback(() => {
    if (wallpapers.length <= 1) return;

    const nextIndex = (currentIndexRef.current + 1) % wallpapers.length;
    currentIndexRef.current = nextIndex;
    const nextWallpaper = wallpapers[nextIndex];

    if (activeSlotRef.current === 'A') {
      // Put next wallpaper into Slot B
      setSlotB({
        wallpaper: nextWallpaper,
        index: nextIndex,
        id: `slotB-${nextIndex}-${nextWallpaper.url}`,
      });
    } else {
      // Put next wallpaper into Slot A
      setSlotA({
        wallpaper: nextWallpaper,
        index: nextIndex,
        id: `slotA-${nextIndex}-${nextWallpaper.url}`,
      });
    }
  }, [wallpapers]);

  // When Slot A finishes loading, make it active
  const handleSlotALoaded = useCallback(() => {
    if (activeSlotRef.current === 'B') {
      setActiveSlot('A');
    }
  }, []);

  // When Slot B finishes loading, make it active
  const handleSlotBLoaded = useCallback(() => {
    if (activeSlotRef.current === 'A') {
      setActiveSlot('B');
    }
  }, []);

  // 4. Automatically cycle background image every 12 seconds
  useEffect(() => {
    if (wallpapers.length <= 1) return;
    const timer = setInterval(() => {
      advanceToNext();
    }, 12000);

    return () => clearInterval(timer);
  }, [wallpapers.length, advanceToNext]);

  const currentWallpaper =
    activeSlot === 'A'
      ? slotA?.wallpaper || slotB?.wallpaper || null
      : slotB?.wallpaper || slotA?.wallpaper || null;

  // Active button press tracking for instant tactile black-on-theme feedback
  const [activeBtn, setActiveBtn] = useState<'map' | 'journey' | 'menu' | 'settings' | null>(null);

  return (
    <section
      id="hero-section"
      className="fixed inset-0 z-40 w-full h-full overflow-hidden select-none flex flex-col justify-between bg-black text-white font-sans animate-fade-in"
    >
      {/* Scoped CSS guaranteeing 100% luminous contrast in both Light and Dark modes */}
      <style>{`
        #hero-section {
          color: #ffffff !important;
        }
        #hero-section .hero-title {
          color: #ffffff !important;
          -webkit-text-stroke: 0 !important;
          text-stroke: 0 !important;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.85), 0 8px 30px rgba(0, 0, 0, 0.75), 0 0 45px rgba(0, 0, 0, 0.6) !important;
        }
        #hero-section .hero-subtitle {
          color: #f8fafc !important;
          -webkit-text-stroke: 0 !important;
          text-stroke: 0 !important;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.85), 0 4px 16px rgba(0, 0, 0, 0.7) !important;
        }
        #hero-section .hero-caption {
          color: #e2e8f0 !important;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.95) !important;
        }
        #hero-section .hero-theme-btn {
          transition: background-color 0.12s ease-out, color 0.12s ease-out, border-color 0.12s ease-out, transform 0.12s ease-out, box-shadow 0.12s ease-out;
          background-color: rgba(12, 16, 28, 0.75) !important;
          backdrop-filter: blur(20px) saturate(180%) !important;
          -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
          border-color: ${theme.primaryColor}70 !important;
          color: ${theme.primaryColor} !important;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.25) !important;
        }
        #hero-section .hero-theme-btn span,
        #hero-section .hero-theme-btn svg {
          color: ${theme.primaryColor} !important;
        }
        #hero-section .hero-theme-btn:active,
        #hero-section .hero-theme-btn.is-active {
          background-color: ${theme.primaryColor} !important;
          border-color: ${theme.primaryColor} !important;
          color: #000000 !important;
          box-shadow: 0 0 32px ${theme.primaryColor} !important;
        }
        #hero-section .hero-theme-btn:active span,
        #hero-section .hero-theme-btn:active svg,
        #hero-section .hero-theme-btn.is-active span,
        #hero-section .hero-theme-btn.is-active svg {
          color: #000000 !important;
        }

        /* 5. Ultra-Smooth Cinematic Pan / Ken Burns Animations */
        @keyframes heroPanRightToLeft {
          0% {
            transform: scale(1.18) translate3d(5%, 0, 0);
          }
          100% {
            transform: scale(1.18) translate3d(-5%, 0, 0);
          }
        }

        @keyframes heroPanLeftToRight {
          0% {
            transform: scale(1.18) translate3d(-5%, 0, 0);
          }
          100% {
            transform: scale(1.18) translate3d(5%, 0, 0);
          }
        }

        @keyframes heroPanBottomToTop {
          0% {
            transform: scale(1.18) translate3d(0, 5%, 0);
          }
          100% {
            transform: scale(1.18) translate3d(0, -5%, 0);
          }
        }

        @keyframes heroPanTopToBottom {
          0% {
            transform: scale(1.18) translate3d(0, -5%, 0);
          }
          100% {
            transform: scale(1.18) translate3d(0, 5%, 0);
          }
        }

        .hero-pan-rtl {
          animation: heroPanRightToLeft 24s cubic-bezier(0.25, 1, 0.5, 1) infinite alternate;
          will-change: transform;
        }

        .hero-pan-ltr {
          animation: heroPanLeftToRight 24s cubic-bezier(0.25, 1, 0.5, 1) infinite alternate;
          will-change: transform;
        }

        .hero-pan-up {
          animation: heroPanBottomToTop 24s cubic-bezier(0.25, 1, 0.5, 1) infinite alternate;
          will-change: transform;
        }

        .hero-pan-down {
          animation: heroPanTopToBottom 24s cubic-bezier(0.25, 1, 0.5, 1) infinite alternate;
          will-change: transform;
        }

        /* 6. Rotating Light Beam around Map Button */
        @keyframes rotateBeam {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .animate-beam-spin {
          animation: rotateBeam 3.2s linear infinite;
          will-change: transform;
        }
      `}</style>

      {/* A. Background Image: Persistent Dual-Slot Seamless Crossfade (No Restart / No Glitch) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        {/* Slot A */}
        {slotA && (
          <HeroSlide
            key={slotA.id}
            wallpaper={slotA.wallpaper}
            index={slotA.index}
            opacity={activeSlot === 'A' ? 1 : 0}
            zIndex={activeSlot === 'A' ? 2 : 1}
            aspectCache={aspectCache}
            onLoaded={handleSlotALoaded}
          />
        )}

        {/* Slot B */}
        {slotB && (
          <HeroSlide
            key={slotB.id}
            wallpaper={slotB.wallpaper}
            index={slotB.index}
            opacity={activeSlot === 'B' ? 1 : 0}
            zIndex={activeSlot === 'B' ? 2 : 1}
            aspectCache={aspectCache}
            onLoaded={handleSlotBLoaded}
          />
        )}

        {/* Fallback pattern when no wallpapers exist */}
        {wallpapers.length === 0 && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#070b14] via-[#0d1424] to-[#04060c]" />
        )}

        {/* Sophisticated Multi-Layered Vignette ensuring total text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/80 z-1 pointer-events-none" />
        <div className="absolute inset-0 bg-radial-[at_center_center] from-transparent via-black/35 to-black/90 z-1 pointer-events-none" />
      </div>

      {/* B. Top Section: English Brand Title in New York Times Editorial Serif Font */}
      <header className="relative z-10 w-full pt-8 sm:pt-14 px-4 sm:px-12 flex flex-col items-center text-center">
        {/* Ambient Subtle Theme Glow */}
        <div
          className="absolute -top-10 left-1/2 -translate-x-1/2 w-80 sm:w-96 h-28 blur-3xl pointer-events-none opacity-25"
          style={{ backgroundColor: theme.primaryColor }}
        />

        {/* Subtle Ambient Black Fade Behind Title (فەیدێکی تەنکی ڕەش لە پشتی بۆ ئەوەی جوان دەرکەوێت) */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-2xl h-24 sm:h-32 rounded-full pointer-events-none blur-2xl opacity-65 bg-black/85"
          aria-hidden="true"
        />

        {/* English Title: KURDISTAN INFO MAP in New York Times Editorial Serif Typeface */}
        <h1
          className="hero-title relative font-['Playfair_Display',Georgia,Cambria,'Times_New_Roman',Times,serif] font-black uppercase text-xl xs:text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-white max-w-full leading-tight transition-all"
          style={{
            letterSpacing: '0.14em',
            textShadow: '0 2px 10px rgba(0,0,0,0.9), 0 8px 30px rgba(0,0,0,0.75), 0 0 45px rgba(0,0,0,0.6)',
          }}
        >
          KURDISTAN INFO MAP
        </h1>

        {/* Subtitle: kurdistan, history, culture in the same New York Times Serif Font */}
        <div className="mt-2.5 sm:mt-3 flex items-center justify-center gap-2 px-2 relative z-10">
          <span
            className="hero-subtitle font-['Playfair_Display',Georgia,Cambria,'Times_New_Roman',Times,serif] text-xs sm:text-base tracking-[0.18em] sm:tracking-[0.24em] font-normal lowercase transition-colors"
            style={{
              color: '#f8fafc',
              textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 4px 16px rgba(0,0,0,0.7)',
            }}
          >
            kurdistan, history, culture
          </span>
          <span
            className="w-1.5 h-1.5 rounded-full shadow-sm shrink-0"
            style={{
              backgroundColor: theme.primaryColor,
              boxShadow: `0 0 10px ${theme.primaryColor}`,
            }}
          />
        </div>
      </header>

      {/* C. Center Visual Accent: Minimal Kurdish Sun Emblem */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pointer-events-none">
        <div className="relative flex items-center justify-center">
          <div
            className="w-20 h-20 sm:w-32 sm:h-32 rounded-full border animate-spin-slow flex items-center justify-center bg-radial from-transparent to-transparent backdrop-blur-[1px] transition-colors"
            style={{ borderColor: `${theme.primaryColor}40` }}
          >
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full border border-white/25 flex items-center justify-center">
              <Compass
                className="w-7 h-7 sm:w-10 sm:h-10 stroke-[1.5] transition-colors"
                style={{ color: theme.primaryColor }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* D. Bottom Section: The 4 Action Buttons with Dynamic Theme Color & Tactile Black-on-Active */}
      <footer className="relative z-10 w-full pb-6 sm:pb-12 px-2 sm:px-6 flex flex-col items-center gap-4">
        {/* The 4 Main Buttons Cluster */}
        <div
          className="w-full max-w-2xl grid grid-cols-4 gap-1.5 sm:gap-3 p-1.5 sm:p-2.5 rounded-3xl bg-black/65 backdrop-blur-2xl border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_20px_50px_rgba(0,0,0,0.85)]"
          dir="rtl"
        >
          {/* Button 1: نەخشە (Interactive Map - Slightly Larger with Rotating Continuous Light Beam) */}
          <div className="relative group/map rounded-2xl overflow-hidden p-[2px] -my-1 sm:-my-1.5 transition-transform duration-200 hover:scale-105 active:scale-95 shadow-[0_0_25px_rgba(0,0,0,0.85)]">
            {/* Ambient Blurred Glow Beam */}
            <div
              className="absolute -inset-[150%] animate-beam-spin pointer-events-none blur-md opacity-85"
              style={{
                background: `conic-gradient(from 0deg, transparent 0%, transparent 60%, ${theme.primaryColor} 82%, #ffffff 100%)`,
              }}
            />

            {/* Crisp Perimeter Light Beam */}
            <div
              className="absolute -inset-[150%] animate-beam-spin pointer-events-none"
              style={{
                background: `conic-gradient(from 0deg, transparent 0%, transparent 65%, ${theme.primaryColor} 84%, #ffffff 100%)`,
              }}
            />

            {/* Inner Button Content */}
            <button
              type="button"
              onClick={onEnterMap}
              onMouseDown={() => setActiveBtn('map')}
              onMouseUp={() => setActiveBtn(null)}
              onTouchStart={() => setActiveBtn('map')}
              onTouchEnd={() => setActiveBtn(null)}
              className={`hero-theme-btn relative w-full h-full flex flex-col items-center justify-center py-3 sm:py-4 px-1.5 sm:px-2.5 rounded-[14px] border-0 transition-all duration-150 cursor-pointer select-none bg-[#090d18]/90 ${
                activeBtn === 'map' ? 'is-active' : ''
              }`}
              style={{
                boxShadow: `inset 0 1px 1px rgba(255, 255, 255, 0.45), 0 0 20px ${theme.primaryColor}35`,
              }}
            >
              <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5">
                <Map className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover/map:scale-115" />
                <span className="text-xs sm:text-base font-black tracking-tight">
                  نەخشە
                </span>
              </div>
              <span className="text-[9px] sm:text-xs font-bold hidden xs:inline opacity-95 truncate max-w-full">
                گەڕانی نەخشە
              </span>
            </button>
          </div>

          {/* Button 2: گەشتی مێژوویی (Historical Journey - 3 Fact Posters) */}
          <button
            type="button"
            onClick={onOpenJourney}
            onMouseDown={() => setActiveBtn('journey')}
            onMouseUp={() => setActiveBtn(null)}
            onTouchStart={() => setActiveBtn('journey')}
            onTouchEnd={() => setActiveBtn(null)}
            className={`hero-theme-btn group relative flex flex-col items-center justify-center py-2.5 sm:py-3.5 px-1 sm:px-2 rounded-2xl border transition-all duration-150 active:scale-95 cursor-pointer select-none ${
              activeBtn === 'journey' ? 'is-active' : ''
            }`}
          >
            <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5">
              <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:scale-110" />
              <span className="text-[11px] sm:text-sm font-extrabold tracking-tight">
                گەشتی مێژوویی
              </span>
            </div>
            <span className="text-[8px] sm:text-[11px] font-semibold hidden xs:inline opacity-90 truncate max-w-full">
              پۆستەری مێژوویی
            </span>
          </button>

          {/* Button 3: پێڕست (Historical Directory) */}
          <button
            type="button"
            onClick={onOpenMenu}
            onMouseDown={() => setActiveBtn('menu')}
            onMouseUp={() => setActiveBtn(null)}
            onTouchStart={() => setActiveBtn('menu')}
            onTouchEnd={() => setActiveBtn(null)}
            className={`hero-theme-btn group relative flex flex-col items-center justify-center py-2.5 sm:py-3.5 px-1 sm:px-2 rounded-2xl border transition-all duration-150 active:scale-95 cursor-pointer select-none ${
              activeBtn === 'menu' ? 'is-active' : ''
            }`}
          >
            <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5">
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:scale-110" />
              <span className="text-[11px] sm:text-sm font-bold tracking-tight">
                پێڕست
              </span>
            </div>
            <span className="text-[8px] sm:text-[11px] font-semibold hidden xs:inline opacity-90 truncate max-w-full">
              بابەتەکان
            </span>
          </button>

          {/* Button 4: ڕێکخستنەکان (Settings) */}
          <button
            type="button"
            onClick={onOpenSettings}
            onMouseDown={() => setActiveBtn('settings')}
            onMouseUp={() => setActiveBtn(null)}
            onTouchStart={() => setActiveBtn('settings')}
            onTouchEnd={() => setActiveBtn(null)}
            className={`hero-theme-btn group relative flex flex-col items-center justify-center py-2.5 sm:py-3.5 px-1 sm:px-2 rounded-2xl border transition-all duration-150 active:scale-95 cursor-pointer select-none ${
              activeBtn === 'settings' ? 'is-active' : ''
            }`}
          >
            <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5">
              <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:scale-110" />
              <span className="text-[11px] sm:text-sm font-bold tracking-tight">
                ڕێکخستنەکان
              </span>
            </div>
            <span className="text-[8px] sm:text-[11px] font-semibold hidden xs:inline opacity-90 truncate max-w-full">
              دیمەن و شێواز
            </span>
          </button>
        </div>

        {/* E. Subdued Bottom Footer: Wallpaper Caption Only (No manual button, 12s auto cycle) */}
        {currentWallpaper ? (
          <div className="w-full max-w-lg flex items-center justify-center text-[10px] sm:text-xs text-slate-200 px-2 text-center" dir="rtl">
            <div className="flex items-center gap-1.5 truncate max-w-full">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  backgroundColor: theme.primaryColor,
                  boxShadow: `0 0 8px ${theme.primaryColor}`,
                }}
              />
              <span className="hero-caption font-semibold text-slate-200 truncate">
                {currentWallpaper.title}
              </span>
              {currentWallpaper.region && (
                <span className="hero-caption text-slate-300 hidden sm:inline truncate">
                  · {currentWallpaper.region}
                </span>
              )}
            </div>
          </div>
        ) : null}
      </footer>
    </section>
  );
};
