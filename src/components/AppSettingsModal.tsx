import React, { useState, useRef } from 'react';
import {
  X,
  Sun,
  Moon,
  Image as ImageIcon,
  MapPin,
  Layers,
  Satellite,
  Compass,
  Palette,
  Shield,
  ShieldCheck,
  Plus,
  SlidersHorizontal,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { THEME_LIST } from '../types/theme';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mapMode: 'dark' | 'satellite';
  setMapMode: (mode: 'dark' | 'satellite') => void;
  markerViewMode: 'photo' | 'points';
  setMarkerViewMode: (mode: 'photo' | 'points') => void;
  showBottomPhotoStrip: boolean;
  setShowBottomPhotoStrip: React.Dispatch<React.SetStateAction<boolean>>;
  showAllMarkers: boolean;
  setShowAllMarkers: (val: boolean) => void;
  showPolygon: boolean;
  setShowPolygon: (val: boolean) => void;
  onReplayIntro?: () => void;
  onOpenDocumentaryTour?: () => void;
  onOpenGallery?: () => void;
  onOpenTheme?: () => void;
  isAdmin: boolean;
  onTriggerAdminPin: () => void;
  onLogoutAdmin?: () => void;
  onOpenAddFact?: (mode?: 'photo_only' | 'standard') => void;
  factsCount: number;
}

export const AppSettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  mapMode,
  setMapMode,
  markerViewMode,
  setMarkerViewMode,
  showBottomPhotoStrip,
  setShowBottomPhotoStrip,
  showAllMarkers,
  setShowAllMarkers,
  showPolygon,
  setShowPolygon,
  onReplayIntro,
  onOpenDocumentaryTour,
  onOpenGallery,
  onOpenTheme,
  isAdmin,
  onTriggerAdminPin,
  onLogoutAdmin,
  onOpenAddFact,
  factsCount,
}) => {
  const { theme, themeId, setTheme, colorMode, setColorMode } = useTheme();

  // Admin secret 6-tap tracking
  const [adminTapCount, setAdminTapCount] = useState(0);
  const tapTimeoutRef = useRef<any>(null);

  if (!isOpen) return null;

  const handleAdminTap = () => {
    if (isAdmin) {
      if (onLogoutAdmin) onLogoutAdmin();
      return;
    }
    const next = adminTapCount + 1;
    setAdminTapCount(next);
    if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    if (next >= 6) {
      setAdminTapCount(0);
      onTriggerAdminPin();
      onClose();
    } else {
      tapTimeoutRef.current = setTimeout(() => {
        setAdminTapCount(0);
      }, 4000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-md rounded-3xl p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_24px_60px_rgba(0,0,0,0.85)] max-h-[90vh] overflow-y-auto text-right flex flex-col gap-4 animate-scale-in transition-colors duration-300 ${
          colorMode === 'light'
            ? 'bg-[#f7f5ed] text-slate-900 border border-amber-900/15'
            : 'bg-[#080d19]/95 text-slate-100 border border-white/10'
        }`}
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 border border-amber-500/30">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-sm sm:text-base">
                ڕێکخستنەکان و ئامرازەکان
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                ڕێکخستنی شێوازی نەخشە، دیمەن و ڕووکار
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            title="داخستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. دۆخی دیمەن (ڕووناکی نەرم / تاریک) */}
        <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/[0.04] border border-black/5 dark:border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold flex items-center gap-1.5">
              {colorMode === 'light' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-amber-400" />
              )}
              <span>دۆخی دیمەن (ڕووناک / تاریک)</span>
            </span>
            <span className="text-[11px] font-bold text-amber-500">
              {colorMode === 'light' ? 'ڕووناک' : 'تاریک'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setColorMode('light')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                colorMode === 'light'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                  : 'bg-black/5 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-black/10 dark:hover:bg-white/10'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>ڕووناک</span>
            </button>
            <button
              type="button"
              onClick={() => setColorMode('dark')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                colorMode === 'dark'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                  : 'bg-black/5 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-black/10 dark:hover:bg-white/10'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>تاریک (Dark)</span>
            </button>
          </div>
        </div>

        {/* 2. شێوازی نیشاندانی مارکەرەکان (وێنەیی / خاڵەکان) */}
        <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/[0.04] border border-black/5 dark:border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-amber-500" />
              <span>شێوازی نیشاندانی شوێنەکان</span>
            </span>
            <span className="text-[11px] font-bold text-amber-500">
              {markerViewMode === 'photo' ? 'وێنەیی (چوارگۆشە)' : 'خاڵەکان (پۆینت)'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMarkerViewMode('photo')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                markerViewMode === 'photo'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                  : 'bg-black/5 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-black/10 dark:hover:bg-white/10'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>نیشاندانی وێنەیی</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMarkerViewMode('points');
                setShowBottomPhotoStrip(false);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                markerViewMode === 'points'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                  : 'bg-black/5 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-black/10 dark:hover:bg-white/10'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>خاڵە کلاسیکییەکان</span>
            </button>
          </div>

          {markerViewMode === 'photo' && (
            <button
              type="button"
              onClick={() => setShowBottomPhotoStrip((prev) => !prev)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 transition-all cursor-pointer mt-1"
            >
              <span>شریتی وێنەیی خوارەوە</span>
              <span className={`text-[11px] font-extrabold ${showBottomPhotoStrip ? 'text-emerald-500' : 'text-slate-400'}`}>
                {showBottomPhotoStrip ? 'کراوەیە' : 'داخراوە'}
              </span>
            </button>
          )}
        </div>

        {/* 3. جۆری نەخشە: مانگی دەستکرد / تاریک */}
        <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/[0.04] border border-black/5 dark:border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold flex items-center gap-1.5">
              <Satellite className="w-4 h-4 text-amber-500" />
              <span>تایلی نەخشەی بنەڕەت</span>
            </span>
            <span className="text-[11px] font-bold text-amber-500">
              {mapMode === 'satellite' ? 'مانگی دەستکرد' : 'نەخشەی ئەسڵی'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMapMode('dark')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mapMode === 'dark'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                  : 'bg-black/5 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-black/10 dark:hover:bg-white/10'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>نەخشەی ئەسڵی</span>
            </button>
            <button
              type="button"
              onClick={() => setMapMode('satellite')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mapMode === 'satellite'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                  : 'bg-black/5 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-black/10 dark:hover:bg-white/10'
              }`}
            >
              <Satellite className="w-3.5 h-3.5" />
              <span>مانگی دەستکرد</span>
            </button>
          </div>
        </div>

        {/* 4. بەشی ڕووکار و ڕەنگەکانی بەرنامە (Theme & Colors) */}
        <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/[0.04] border border-black/5 dark:border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-amber-500" />
              <span>ڕەنگی سەرەکی و ڕووکار</span>
            </span>
            {onOpenTheme && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTheme();
                }}
                className="text-[11px] text-amber-500 hover:underline font-bold cursor-pointer"
              >
                هەموو ستایلەکان
              </button>
            )}
          </div>
          <div className="flex items-center justify-between px-1 py-1">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
              {theme.name}
            </span>
            <div className="flex items-center gap-1.5">
              {THEME_LIST.map((t) => {
                const isCur = themeId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className={`w-5 h-5 rounded-full transition-all cursor-pointer border ${
                      isCur
                        ? 'scale-125 border-white ring-2 ring-amber-500 shadow-md z-10'
                        : 'border-black/30 dark:border-black/60 opacity-80 hover:opacity-100 hover:scale-110'
                    }`}
                    style={{ backgroundColor: t.primaryColor }}
                    title={`${t.name} (${t.englishName})`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* 5. کۆنتڕۆڵی نەخشە و ئامرازەکان */}
        <div className="space-y-1.5">
          {/* نیشاندانی هەموو مارکەرەکان */}
          <button
            type="button"
            onClick={() => setShowAllMarkers(!showAllMarkers)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs bg-black/5 dark:bg-white/[0.04] hover:bg-black/10 dark:hover:bg-white/[0.08] transition-colors cursor-pointer border border-black/5 dark:border-white/10"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              <span className="font-bold">نیشاندانی مارکەرەکان</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-lg bg-black/10 dark:bg-white/10 text-slate-700 dark:text-slate-200 font-bold">
              {showAllMarkers ? `هەمووی (${factsCount})` : 'یەک پۆینت'}
            </span>
          </button>
        </div>

        {/* 6. بەشی ئەدمین (Admin Controls) */}
        <div className="pt-2 border-t border-black/10 dark:border-white/10">
          {isAdmin && onOpenAddFact && (
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAddFact('photo_only');
                }}
                className="py-2 px-3 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 border border-amber-500/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>فۆڕمی وێنە</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAddFact('standard');
                }}
                className="py-2 px-3 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-500 border border-emerald-500/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>بابەتی نوێ</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleAdminTap}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
              isAdmin
                ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 font-bold'
                : 'bg-black/5 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:text-amber-500 border border-black/5 dark:border-white/10'
            }`}
          >
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              ) : (
                <Shield className="w-4 h-4 text-amber-500/70" />
              )}
              <span>
                {isAdmin
                  ? 'دۆخی ئەدمین چالاکە (داگرە بۆ دەرچوون)'
                  : adminTapCount > 0
                  ? `دۆخی ئەدمین (${adminTapCount}/6)`
                  : 'چوونەژوورەوەی ئەدمین'}
              </span>
            </div>
            {isAdmin && <span className="text-[10px] text-emerald-500 font-bold">دەرچوون</span>}
          </button>
        </div>
      </div>
    </div>
  );
};
