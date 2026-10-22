import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FactItem } from '../data/kurdishHistoryData';
import {
  X,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Compass,
  Calendar,
  Sparkles,
  BookOpen,
  Volume2,
  VolumeX,
  Film,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { playEraTransitionChime, playTimelineTick } from '../utils/audioEffects';

export interface MilestoneStory {
  id: string;
  factId?: number;
  title: string;
  period: string;
  centuryNumber?: number;
  yearNumber?: number;
  isBC?: boolean;
  lat: number;
  lng: number;
  zoom: number;
  headline: string;
  storyText: string;
  significance: string;
  imageUrl?: string;
  tag: string;
  categoryName: string;
  accentColor: string;
}

// 12 Epoch-defining chapters of Kurdish history
export const DOCUMENTARY_MILESTONES: MilestoneStory[] = [
  {
    id: 'zagros-ancient',
    factId: 1,
    title: 'دەوڵەت و شارستانییەتی گۆتی و لولوبی',
    period: 'هەزارەی سێیەمی پێش زایین',
    isBC: true,
    yearNumber: -2200,
    lat: 35.15,
    lng: 45.8,
    zoom: 8,
    headline: 'سەرهەڵدانی یەکەمین پێکهاتە سیاسی و چیاکانی زاگرۆس',
    storyText:
      'گۆتی و لولوبییەکان لە دێرینترین خەڵکی ڕەسەنی زاگرۆسن کە لە دەوروبەری هەزارەی ٣ی پێش زایین حکومڕانییەکی بەهێزیان دامەزراند و توانییان بۆ ماوەیەک بەسەر میزۆپۆتامیادا باڵادەست بن و نەخشەی دەسەڵاتی ڕۆژهەڵاتی کۆن بگۆڕن.',
    significance: 'دەستپێکی مێژووی شارستانی و خەباتی سەربەخۆیی گەلانی زاگرۆس.',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=900&auto=format&fit=crop&q=80',
    tag: 'شارستانییەتی کۆن',
    categoryName: 'شارستانییەتەکان',
    accentColor: '#d97706',
  },
  {
    id: 'medes-empire',
    factId: 10,
    title: 'ئیمپراتۆرییەتی مەزنی ماد (Medes)',
    period: '٧٠٠ - ٥٥٠ پێش زایین',
    isBC: true,
    yearNumber: -612,
    lat: 34.79,
    lng: 48.51,
    zoom: 7,
    headline: 'یەکگرتنی نەتەوەیی هۆزەکانی ماد و ڕووخاندنی نەینەوا',
    storyText:
      'دیاکۆ و کەیخوسرەوی پادشای ماد توانییان هۆزە ئاریایی و میدییەکان یەکبخەن و پایتەختێکی بەسام لە هەمەدان (ئەگباتانا) دروستبکەن. لە ساڵی ٦١٢ پێش زایین پایتەختی ئاشوورییەکان (نەینەوا)یان کۆنتڕۆڵ کرد کە لە ئەدەبیاتی کوردیدا بە دەستپێکی ساڵنامەی کوردی دادەنرێت.',
    significance: 'بناغەی ناسنامەی نەتەوەیی و ڕۆژمێری کوردی (٢٧٢٥ی کوردی).',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=80',
    tag: 'ئیمپراتۆرییەت',
    categoryName: 'ئیمپراتۆرییەتەکان',
    accentColor: '#f59e0b',
  },
  {
    id: 'corduene-kingdom',
    factId: 25,
    title: 'میرنشینی کۆردوین (Corduene / کاردۆخ)',
    period: 'سەدەی یەکەمی پێش زایین - سەدەی چوارەمی زایین',
    isBC: false,
    yearNumber: 100,
    lat: 37.58,
    lng: 42.18,
    zoom: 8,
    headline: 'خاکی کوردۆخییەکان لە سەرچاوە مێژووییەکانی یۆنان و ڕۆمادا',
    storyText:
      'کۆردوین لە باشووری دەریاچەی وان و باکووری دیجلە دەسەڵاتێکی سەربەخۆ بوو. زینۆفۆن لە پەڕتووکی "ئاناباسیس"دا ئاماژە بە چاونەترسی و ئازایەتی جەنگاوەرانی کوردۆخی دەدات لە ڕووبەڕووبوونەوەی سوپای دە هەزاری یۆنانییەکاندا.',
    significance: 'سەلماندنی ناوی کوردی و جوگرافیای چیاکانی لە نەخشە کلاسیکییەکاندا.',
    imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=900&auto=format&fit=crop&q=80',
    tag: 'پاشایەتی مێژوویی',
    categoryName: 'میرنشینەکان',
    accentColor: '#eab308',
  },
  {
    id: 'shaddadids',
    factId: 65,
    title: 'میرنشینی شەدادی (Ganja & Ani)',
    period: '٩٥١ - ١١٧٤ زایینی',
    isBC: false,
    yearNumber: 970,
    lat: 40.68,
    lng: 46.36,
    zoom: 7,
    headline: 'دەسەڵاتی کورد لە قەوقاز، ئازەربایجان و شاری دێرینی ئانی',
    storyText:
      'شەدادییەکان بە یەکێک لە شارستانیترین میرنشینە کوردییەکان دادەنرێن کە لە نێوان ڕووباری کور و ئاراس فەرمانڕەواییان کردووە. لە گەنجە و ئانی دەیان قەڵا، پردی زەبەلاح و مزگەوتیان بە تەلارسازیی بەرز بنیادنا کە تا ئەمڕۆش شوێنەوارەکانیان ماوە.',
    significance: 'فراوانبوونی دەسەڵات و تەلارسازیی کوردی بەرەو باکووری ئاراس.',
    imageUrl: 'https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?w=900&auto=format&fit=crop&q=80',
    tag: 'میرنشینی ئیسلامی',
    categoryName: 'میرنشینەکان',
    accentColor: '#10b981',
  },
  {
    id: 'marwanids',
    factId: 75,
    title: 'دەوڵەتی مەروانی (Diyarbekir / Mayyafariqin)',
    period: '٩٩٠ - ١٠٨٥ زایینی',
    isBC: false,
    yearNumber: 1020,
    lat: 37.91,
    lng: 40.24,
    zoom: 8,
    headline: 'سەردەمی زێڕینی ئارامی و بوژانەوەی فەرهەنگ لە ئامەد',
    storyText:
      'نەسرو دەولەی مەروانی حوکمی ئامەد و جزیرەی کرد. لە سایەی دەسەڵاتەکەیدا کتێبخانە گەورەکان دروستکران، ڕێگاکانی بازرگانی پارێزراو بوون و پردی بەناوبانگی دە دەلاقە (On Gözlü Köprü) لەسەر دیجلە بنیاتنرا.',
    significance: 'ناوەندی زانست و پێکەوەژیانی ئایینی لە ناوچەی جزیرە.',
    imageUrl: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=900&auto=format&fit=crop&q=80',
    tag: 'دەوڵەتی کوردی',
    categoryName: 'میرنشینەکان',
    accentColor: '#06b6d4',
  },
  {
    id: 'ayyubids',
    factId: 90,
    title: 'دەوڵەتی ئەییووبی و سەلاحەدین',
    period: '١١٧١ - ١٢٥٠ زایینی',
    isBC: false,
    yearNumber: 1187,
    lat: 31.77,
    lng: 35.21,
    zoom: 7,
    headline: 'سەرکەوتنی جەنگی حەتین و ڕزگارکردنی قودس',
    storyText:
      'سەلاحەدینی ئەییووبی، سەرکردەی گەورەی کورد، میسر، شام، حیجاز و یەمەنی یەکخست. لە جەنگی حەتین (١١٨٧ز) سەرکەوتنێکی مێژوویی بەسەر خاچپەرستاندا بەدەستهێنا و بە لێبوردەیی و ڕەوشتبەرزییەوە لە هەموو جیهاندا ناوبانگی پەیداکرد.',
    significance: 'باڵادەستترین دەسەڵاتی کوردی لە مێژووی ڕۆژهەڵاتی ناوەڕاستدا.',
    imageUrl: 'https://images.unsplash.com/photo-1579282240050-352db0a14c21?w=900&auto=format&fit=crop&q=80',
    tag: 'دەسەڵاتی مەزن',
    categoryName: 'سەرکردەکان',
    accentColor: '#f43f5e',
  },
  {
    id: 'badinan',
    factId: 115,
    title: 'میرنشینی بەهدینان (Amadiya)',
    period: '١٣٧٦ - ١٨٤٣ زایینی',
    isBC: false,
    yearNumber: 1550,
    lat: 37.09,
    lng: 43.48,
    zoom: 9,
    headline: 'قەڵای نەبەزی ئامێدی لە دڵی چیاکانی بادینان',
    storyText:
      'میرنشینی بەهدینان بە پێگەی بەهێزی شاری ئامێدی کە لەسەر لووتکەی تاشەبەردێکی سروشتی بنیادنراوە، بۆ نزیکەی پێنج سەدە پێگەی حوکمڕانی و ناوەندی خوێندنی ئاینی و مێژوویی بوو بە بوونی قوتابخانەی قوبەهان.',
    significance: 'پاراستنی سەربەخۆیی ناوخۆیی لە بەرزاییەکانی بادینان.',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&auto=format&fit=crop&q=80',
    tag: 'میرنشینی مێژوویی',
    categoryName: 'میرنشینەکان',
    accentColor: '#3b82f6',
  },
  {
    id: 'ardalan',
    factId: 130,
    title: 'میرنشینی ئەردەڵان (Sanandaj)',
    period: '١١٦٩ - ١٨٦٧ زایینی',
    isBC: false,
    yearNumber: 1750,
    lat: 35.31,
    lng: 46.99,
    zoom: 8,
    headline: 'پایتەختی شیعر و شاکارە ئەدەبییەکانی گۆران و سۆرانی',
    storyText:
      'میرنشینی ئەردەڵان لە ڕۆژهەڵاتی کوردستان بۆ ماوەی ٧٠٠ ساڵ دەسەڵاتی هەبوو. شاری سنە کرا بە پایتەختێکی ڕۆشنبیری و مەستورەی ئەردەڵان یەکەمین ژنە مێژوونووسی ڕۆژهەڵات لەم کۆشک و دەسەڵاتەدا بەرهەمەکانی تۆمارکرد.',
    significance: 'بوژانەوەی زمانی ئەدەبی کوردی و دەرکەوتنی مێژوونووسیی نەتەوەیی.',
    imageUrl: 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=900&auto=format&fit=crop&q=80',
    tag: 'میرنشینی کوردی',
    categoryName: 'میرنشینەکان',
    accentColor: '#a855f7',
  },
  {
    id: 'baban',
    factId: 150,
    title: 'میرنشینی بابان و دروستکردنی سلێمانی',
    period: '١٦٤٩ - ١٨٥١ زایینی',
    isBC: false,
    yearNumber: 1784,
    lat: 35.56,
    lng: 45.43,
    zoom: 9,
    headline: 'ئیبراهیم پاشای بابان و دامەزراندنی شاری سلێمانی (١٧٨٤)',
    storyText:
      'میرنشینی بابان پایتەختی لە قەڵاچوالانەوە گواستەوە بۆ شاری نوێی سلێمانی لە ساڵی ١٧٨٤. سەردەمی بابانییەکان سەردەمی شۆڕشی ئەدەبی بوو بە دەرکەوتنی کلاسیکەکانی نالی، کوردی و سالم کە زاراوەی سۆرانییان کردە شااکاری دەقی کوردی.',
    significance: 'ناوەندی بزووتنەوەی فەرهەنگی و پێشەنگی مۆدێرنیتەی کوردی.',
    imageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=900&auto=format&fit=crop&q=80',
    tag: 'میرنشینی بابان',
    categoryName: 'میرنشینەکان',
    accentColor: '#eab308',
  },
  {
    id: 'soran',
    factId: 165,
    title: 'میرنشینی سۆران و پاشای گەورە',
    period: '١٥٣٠ - ١٨٣٨ زایینی',
    isBC: false,
    yearNumber: 1830,
    lat: 36.61,
    lng: 44.52,
    zoom: 9,
    headline: 'دروستکردنی تۆپ لە ڕەواندز و بەرەنگاربوونەوەی عوسمانییەکان',
    storyText:
      'میر محەمەد (پاشای گەورە / پاشای کۆرە) سوپایەکی مۆدێرنی لە ٤٠ هەزار جەنگاوەر پێکەوەنا و بە هاوکاری وەستا ڕەجەب کارگەی تۆپ و دراو و چەکی لە ڕەواندز دروستکرد، و دەسەڵاتەکەی لە زێی گەورەوە تا سنورەکانی ئازەربایجان و موسڵ بڵاوبووەوە.',
    significance: 'یەکەم تاقیکردنەوەی دەوڵەتداری و پیشەسازی سەربازی کوردی لە سەدەی نۆزدەدا.',
    imageUrl: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=900&auto=format&fit=crop&q=80',
    tag: 'میرنشینی سۆران',
    categoryName: 'میرنشینەکان',
    accentColor: '#f97316',
  },
  {
    id: 'mahmud-kingdom',
    factId: 190,
    title: 'مەملەکەتی کوردستان و شێخ مەحموودی حەفید',
    period: '١٩١٩ - ١٩٢٤ زایینی',
    isBC: false,
    yearNumber: 1922,
    lat: 35.55,
    lng: 45.44,
    zoom: 9,
    headline: 'حکومەتی دارولمولک و ڕاگەیاندنی پادشایەتی لە سلێمانی',
    storyText:
      'شێخ مەحموودی حەفید بەرامبەر داگیرکاریی بەریتانیا ڕاوەستا و مەملەکەتی کوردستانی ڕاگەیاند و خۆی وەک حوکمداری کوردستان ناساند. دەوڵەتەکەی خاوەنی کابینەی وەزیران، ڕۆژنامەی فەرمی (بانگی کوردستان) و پول و دراوی تایبەت بە خۆی بوو.',
    significance: 'ڕاگەیاندنی فەرمیی دەوڵەتی کوردستان لە قۆناغی دوای جەنگی یەکەمی جیهانی.',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900&auto=format&fit=crop&q=80',
    tag: 'دەوڵەتی سەردەم',
    categoryName: 'سەرکردەکان',
    accentColor: '#10b981',
  },
  {
    id: 'mahabad-republic',
    factId: 200,
    title: 'کۆماری دیموکراتی کوردستان (Mahabad Republic)',
    period: '١٩٤٦ زایینی',
    isBC: false,
    yearNumber: 1946,
    lat: 36.76,
    lng: 45.72,
    zoom: 8,
    headline: 'هەڵکردنی ئاڵای کوردستان لە مەیدانی چوارچرا و فەرماندەیی بارزانی',
    storyText:
      'لە ٢ی ڕێبەندانی ١٩٤٦ لە مەیدانی چوارچرای مەهاباد، پێشەوا قازی محەمەد دامەزراندنی کۆماری کوردستانی ڕاگەیاند بە بەشداری ژەنەڕاڵ مستەفا بارزانی وەک فەرماندەی سوپای میللی. لەم کۆمارەدا بۆ یەکەمجار پەروەردەی کوردی کرا بە زامی فەرمی و دەزگای چاپ و گۆڤاری مناڵان دامەزران.',
    significance: 'هێما و لوتکەی سەروەریی نەتەوەیی و یاسایی کوردی لە سەدەی بیستەمدا.',
    imageUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=900&auto=format&fit=crop&q=80',
    tag: 'کۆماری کوردستان',
    categoryName: 'سەرکردەکان',
    accentColor: '#ec4899',
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onFlyToCoords: (lat: number, lng: number, zoom: number, storyTitle: string) => void;
  facts: FactItem[];
  onOpenFactDetail?: (fact: FactItem) => void;
}

export const DocumentaryScrollytellingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onFlyToCoords,
  facts,
  onOpenFactDetail,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activeMilestone = DOCUMENTARY_MILESTONES[currentIndex];

  // Trigger flyTo whenever current milestone changes
  const navigateToMilestone = useCallback(
    (index: number) => {
      const target = DOCUMENTARY_MILESTONES[index];
      if (!target) return;
      setCurrentIndex(index);
      playTimelineTick(900 + index * 40);
      playEraTransitionChime(Boolean(target.isBC));
      onFlyToCoords(target.lat, target.lng, target.zoom, target.title);
    },
    [onFlyToCoords]
  );

  // Auto-play slideshow timer (8 seconds per milestone)
  useEffect(() => {
    if (!isOpen || !isPlaying) {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
      return;
    }

    playTimerRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % DOCUMENTARY_MILESTONES.length;
        const target = DOCUMENTARY_MILESTONES[next];
        onFlyToCoords(target.lat, target.lng, target.zoom, target.title);
        playTimelineTick(1000);
        return next;
      });
    }, 8500);

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isOpen, isPlaying, onFlyToCoords]);

  // Initial trigger when opened
  useEffect(() => {
    if (isOpen) {
      const target = DOCUMENTARY_MILESTONES[0];
      onFlyToCoords(target.lat, target.lng, target.zoom, target.title);
      playEraTransitionChime(true);
    }
  }, [isOpen, onFlyToCoords]);

  // Keyboard navigation (Arrow keys)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        // RTL next
        if (currentIndex < DOCUMENTARY_MILESTONES.length - 1) {
          navigateToMilestone(currentIndex + 1);
        }
      } else if (e.key === 'ArrowRight') {
        // RTL prev
        if (currentIndex > 0) {
          navigateToMilestone(currentIndex - 1);
        }
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, navigateToMilestone, onClose]);

  if (!isOpen) return null;

  // Find corresponding fact if available
  const linkedFact = activeMilestone.factId
    ? facts.find((f) => f.id === activeMilestone.factId)
    : undefined;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-between overflow-hidden">
      {/* Top Floating Glass Header (کنترۆڵ و هەنگاوەکان) */}
      <div className="pointer-events-auto p-3 sm:p-5 flex items-center justify-between gap-3 animate-fade-in">
        {/* Brand / Mode Indicator */}
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl liquid-glass-dock border border-amber-400/30 shadow-[0_10px_35px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center text-black shadow-md">
            <Film className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-amber-300 font-heading">
                گەشت بەناو ڕووداوە گەورەکاندا
              </span>
              <span className="text-[9px] px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 font-mono">
                Documentary Tour
              </span>
            </div>
            <div className="text-[10px] text-slate-300 font-mono">
              وێستگەی <span className="text-white font-bold">{currentIndex + 1}</span> لە{' '}
              <span>{DOCUMENTARY_MILESTONES.length}</span>
            </div>
          </div>
        </div>

        {/* Play/Pause & Close Action Group */}
        <div className="flex items-center gap-2">
          {/* Auto-Play Toggle */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3.5 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold transition-all cursor-pointer shadow-lg backdrop-blur-2xl ${
              isPlaying
                ? 'liquid-glass-btn-active text-black shadow-[0_0_20px_rgba(245,158,11,0.7)]'
                : 'liquid-glass-btn text-slate-200 hover:text-white'
            }`}
            title={isPlaying ? 'وەستاندنی گەشتی خودکار' : 'پەخشی خودکاری فیلمی مێژوو'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-black" />
                <span className="hidden sm:inline">وەستاندن</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-amber-400" />
                <span className="hidden sm:inline">پەخشی خودکار</span>
              </>
            )}
          </button>

          {/* Close Tour Button */}
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl liquid-glass-btn text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-lg border border-white/20"
            title="داخستنی گەشت و گەڕانەوە بۆ نەخشە"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center Cinematic Scrollytelling Story Card (کارتێکی ڕازاوەی سینەمایی لە دەستەڕاست یان خوارەوە) */}
      <div className="pointer-events-auto max-w-xl w-full mx-auto sm:mr-6 sm:ml-auto p-3 sm:p-5 mb-3 sm:mb-6 animate-slide-up">
        <div
          className="relative rounded-3xl liquid-glass-card p-5 sm:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-white/15 backdrop-blur-3xl overflow-hidden text-right"
          style={{
            boxShadow: `0 25px 60px rgba(0,0,0,0.95), 0 0 30px ${activeMilestone.accentColor}25`,
          }}
        >
          {/* Subtle Accent Glow Ring */}
          <div
            className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-l from-amber-400 via-red-500 to-emerald-400"
            style={{
              background: `linear-gradient(to left, ${activeMilestone.accentColor}, #f59e0b, #10b981)`,
            }}
          />

          {/* Header Row: Category Badge, Period & Location */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-xs"
                style={{
                  backgroundColor: `${activeMilestone.accentColor}25`,
                  color: activeMilestone.accentColor,
                  borderColor: `${activeMilestone.accentColor}50`,
                }}
              >
                {activeMilestone.categoryName}
              </span>
              <span className="text-[10px] text-amber-300 font-mono font-bold flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-md">
                <Calendar className="w-3 h-3 text-amber-400" />
                <span>{activeMilestone.period}</span>
              </span>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
              <Compass className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '10s' }} />
              <span>
                {activeMilestone.lat.toFixed(1)}°N, {activeMilestone.lng.toFixed(1)}°E
              </span>
            </div>
          </div>

          {/* Main Title & Headline */}
          <div className="space-y-1.5 mb-3.5">
            <h2 className="text-lg sm:text-xl font-extrabold font-heading text-white tracking-wide leading-tight">
              {activeMilestone.title}
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-amber-300/90 leading-snug">
              {activeMilestone.headline}
            </p>
          </div>

          {/* Narrative Story Body */}
          <p className="text-xs sm:text-[13px] text-slate-200 leading-relaxed sm:leading-loose mb-4 bg-black/40 p-3.5 rounded-2xl border border-white/5">
            {activeMilestone.storyText}
          </p>

          {/* Historical Significance Box */}
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/25 mb-4 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-200/95 leading-relaxed">
              <span className="font-bold text-amber-300">گرنگیی مێژوویی: </span>
              {activeMilestone.significance}
            </div>
          </div>

          {/* Bottom Bar: Navigation Controls & Progress Dots */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
            {/* Step Prev & Next */}
            <div className="flex items-center gap-2">
              <button
                disabled={currentIndex === 0}
                onClick={() => navigateToMilestone(currentIndex - 1)}
                className={`p-2 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                  currentIndex === 0
                    ? 'opacity-30 border-white/5 cursor-not-allowed'
                    : 'liquid-glass-btn text-slate-200 hover:text-white border-white/15 active:scale-95'
                }`}
                title="وێستگەی پێشوو"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                disabled={currentIndex === DOCUMENTARY_MILESTONES.length - 1}
                onClick={() => navigateToMilestone(currentIndex + 1)}
                className={`p-2 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                  currentIndex === DOCUMENTARY_MILESTONES.length - 1
                    ? 'opacity-30 border-white/5 cursor-not-allowed'
                    : 'liquid-glass-btn text-amber-300 hover:text-white border-white/15 active:scale-95'
                }`}
                title="وێستگەی دواتر"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Step Dots Indicator */}
            <div className="flex items-center gap-1 overflow-x-auto px-2 py-1 scrollbar-none max-w-[180px] sm:max-w-[240px]">
              {DOCUMENTARY_MILESTONES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => navigateToMilestone(idx)}
                  className={`transition-all rounded-full cursor-pointer shrink-0 ${
                    currentIndex === idx
                      ? 'w-5 h-2 bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                      : 'w-2 h-2 bg-white/20 hover:bg-white/40'
                  }`}
                  title={`وێستگەی ${idx + 1}`}
                />
              ))}
            </div>

            {/* Read Full Detail if linked fact exists */}
            {linkedFact && onOpenFactDetail && (
              <button
                onClick={() => onOpenFactDetail(linkedFact)}
                className="px-3 py-1.5 rounded-xl liquid-glass-btn text-amber-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-amber-400/30"
                title="بینینی تەواوی زانیاری و بەڵگەنامەکان"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">زانیاری تەواو</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
