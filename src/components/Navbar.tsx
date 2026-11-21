import React from 'react';
import {
  Home,
  Map,
  BookOpen,
  History,
  Sun,
  Moon,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export type AppWorkspaceView = 'hero' | 'map' | 'menu' | 'journey';

interface Props {
  activeView: AppWorkspaceView;
  onSelectView: (view: AppWorkspaceView) => void;
  onOpenHero: () => void;
  onOpenSettings: () => void;
  factsCount?: number;
  // Backward-compatible optional props if referenced elsewhere
  onOpenMenu?: () => void;
  isMenuOpen?: boolean;
}

const KURD_MAP_ICON = '/pwa-192x192.png';

export const Navbar: React.FC<Props> = ({
  activeView,
  onSelectView,
  onOpenHero,
  onOpenSettings,
}) => {
  const { language, isEn, dir, toggleLanguage } = useLanguage();
  const { colorMode, toggleColorMode } = useTheme();
  const isDark = colorMode === 'dark';

  const navItems: {
    id: AppWorkspaceView;
    label: string;
    labelEn: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'hero', label: 'سەرەکی', labelEn: 'Home', icon: Home },
    { id: 'map', label: 'نەخشە', labelEn: 'Map', icon: Map },
    { id: 'menu', label: 'ئەرشیف', labelEn: 'Directory', icon: BookOpen },
    { id: 'journey', label: 'زانیاری', labelEn: 'Info', icon: History },
  ];

  const handleTabClick = (viewId: AppWorkspaceView) => {
    if (viewId === 'hero') {
      onOpenHero();
    } else {
      onSelectView(viewId);
    }
  };

  return (
    <header
      dir={dir}
      className={`relative z-40 shrink-0 border-b transition-colors ${
        isDark
          ? 'bg-[#090d18] border-white/10 text-slate-100 shadow-md'
          : 'bg-white border-slate-200 text-slate-900 shadow-xs'
      }`}
    >
      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-5 h-12 sm:h-13 flex items-center justify-between gap-3 md:gap-8">
        {/* Zone 1: Brand Mark (Returns Home) */}
        <button
          type="button"
          onClick={onOpenHero}
          className="flex items-center gap-2.5 shrink-0 cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg py-1 pe-1.5"
          title={isEn ? 'Back to Home Page' : 'گەڕانەوە بۆ پەڕەی سەرەکی'}
        >
          <img
            src={KURD_MAP_ICON}
            alt="Kurdistan Info Map"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-md object-contain group-hover:scale-105 transition-transform shrink-0"
          />
          <span
            dir="ltr"
            style={{ fontFamily: "'UnifrakturMaguntia', 'Playfair Display', Georgia, serif" }}
            className={`text-base sm:text-lg font-normal tracking-normal whitespace-nowrap shrink-0 ${
              isDark ? 'text-white group-hover:text-amber-300' : 'text-slate-900 group-hover:text-amber-800'
            }`}
          >
            Kurdistan Info Map
          </span>
        </button>

        {/* Zone 2: Desktop Unified Navigation Tabs (including explicit Home return tab) */}
        <nav
          aria-label={isEn ? 'Main Navigation' : 'بەشە سەرەکییەکان'}
          className="hidden md:flex items-center gap-1 lg:gap-2 overflow-x-auto scrollbar-none"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabClick(item.id)}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs lg:text-[13px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? isDark
                      ? 'text-amber-300 bg-amber-500/12'
                      : 'text-amber-900 bg-amber-100/80'
                    : isDark
                    ? 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive
                      ? isDark
                        ? 'text-amber-400'
                        : 'text-amber-700'
                      : 'opacity-80'
                  }`}
                />
                <span>{isEn ? item.labelEn : item.label}</span>
                {isActive && (
                  <span
                    className={`absolute bottom-0 inset-x-2.5 h-0.5 rounded-full ${
                      isDark ? 'bg-amber-400' : 'bg-amber-600'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Quick Comfort Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={toggleColorMode}
            className={`h-9 w-9 sm:w-auto sm:px-2.5 flex items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              isDark
                ? 'bg-white/[0.05] hover:bg-white/[0.1] border-white/10 text-amber-300'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-amber-800'
            }`}
            title={
              isDark
                ? isEn
                  ? 'Switch to Light Mode'
                  : 'گۆڕین بۆ دۆخی ڕووناک'
                : isEn
                ? 'Switch to Dark Mode'
                : 'گۆڕین بۆ دۆخی تاریک'
            }
            aria-label={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="hidden xl:inline">
              {isDark ? (isEn ? 'Light' : 'ڕووناک') : isEn ? 'Dark' : 'تاریک'}
            </span>
          </button>

          <button
            type="button"
            onClick={toggleLanguage}
            className={`h-9 px-2.5 flex items-center gap-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              isDark
                ? 'bg-white/[0.05] hover:bg-white/[0.1] border-white/10 text-slate-200 hover:text-white'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800 hover:text-slate-950'
            }`}
            title={language === 'en' ? 'گۆڕین بۆ زمانی کوردی سۆرانی' : 'Switch to English'}
          >
            <Globe className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
            <span className="font-mono">{isEn ? 'کوردی' : 'EN'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className={`h-9 px-3 flex items-center gap-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              isDark
                ? 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-400/35 text-amber-200 hover:text-white'
                : 'bg-amber-600 hover:bg-amber-700 border-amber-700 text-white preserve-contrast'
            }`}
            title={isEn ? 'Settings, Themes & Map Styles' : 'ڕێکخستنەکان، ڕووکار و شێوازی نەخشە'}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">{isEn ? 'Settings' : 'ڕێکخستنەکان'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export const MobileBottomNav: React.FC<{
  activeView: AppWorkspaceView;
  onSelectView: (view: AppWorkspaceView) => void;
  onOpenHero: () => void;
}> = ({ activeView, onSelectView, onOpenHero }) => {
  const { isEn, dir } = useLanguage();
  const { colorMode } = useTheme();
  const isDark = colorMode === 'dark';

  const navItems: {
    id: AppWorkspaceView;
    label: string;
    labelEn: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'hero', label: 'سەرەکی', labelEn: 'Home', icon: Home },
    { id: 'map', label: 'نەخشە', labelEn: 'Map', icon: Map },
    { id: 'menu', label: 'ئەرشیف', labelEn: 'Archive', icon: BookOpen },
    { id: 'journey', label: 'زانیاری', labelEn: 'Info', icon: History },
  ];

  return (
    <nav
      dir={dir}
      aria-label={isEn ? 'Mobile Navigation' : 'ڕێنیشاندەری مۆبایل'}
      className={`md:hidden shrink-0 z-40 border-t px-1 py-1 grid grid-cols-4 gap-0.5 ${
        isDark
          ? 'bg-[#090d18] border-white/10 text-slate-300'
          : 'bg-white border-slate-200 text-slate-700'
      }`}
      style={{ paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => (item.id === 'hero' ? onOpenHero() : onSelectView(item.id))}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer px-1 ${
              isActive
                ? isDark
                  ? 'text-amber-300 bg-amber-500/15'
                  : 'text-amber-900 bg-amber-100'
                : isDark
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 ${isActive ? (isDark ? 'text-amber-400' : 'text-amber-700') : ''}`} />
            <span className="truncate max-w-full leading-tight">
              {isEn ? item.labelEn : item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
