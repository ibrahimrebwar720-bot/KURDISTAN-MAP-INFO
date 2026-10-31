import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { FactItem, RAW_FACTS_DATA } from '../data/kurdishHistoryData';
import { getFactDisplayImage } from '../utils/historicalImages';
import { getOptimizedImageUrl } from '../utils/imageUtils';
import { useTheme } from '../context/ThemeContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  facts: FactItem[];
  onFlyToFact?: (fact: FactItem) => void;
  onOpenDetail?: (fact: FactItem) => void;
}

// Curated authentic Kurdish historical narratives matching the documentary poster layout
const CURATED_HISTORICAL_SUMMARIES: Record<string, string> = {
  'گۆتی': 'گوتییەکان یەکێکن لە دێرینترین گەلانی ڕەسەنی چیاکانی زاگرۆس و کوردستان لە هەزارەی سێیەمی پێش زایین. لە سەدەی ٢٢ی پ.ز توانییان دەسەڵاتی ئیمپراتۆریەتی ئەکەدی لە مێزۆپۆتامیا بڕوخێنن و بۆ ماوەی نزیکەی یەک سەدە حوکمڕانیی ناوچەکە بکەن بە پایتەختێتی شاری ئاراپخا (کەرکووکی مێژوویی).',
  'گوتی': 'گوتییەکان یەکێکن لە دێرینترین گەلانی ڕەسەنی چیاکانی زاگرۆس و کوردستان لە هەزارەی سێیەمی پێش زایین. لە سەدەی ٢٢ی پ.ز توانییان دەسەڵاتی ئیمپراتۆریەتی ئەکەدی لە مێزۆپۆتامیا بڕوخێنن و بۆ ماوەی نزیکەی یەک سەدە حوکمڕانیی ناوچەکە بکەن بە پایتەختێتی شاری ئاراپخا (کەرکووکی مێژوویی).',
  'کاشی': 'کاشییەکان هۆزێکی بەهێزی شاخنشینی زاگرۆس بوون کە لە سەدەی ١٦ی پێش زایین لە ناوچەکانی ئارابخا و زاگرۆسەوە هاتن و توانییان بۆ ماوەی زیاتر لە چوار سەدە حوکمڕانییەکی سەقامگیر و ئارام لە بابل و نێوان دوو ڕووبار دابمەزرێنن. کلتوری برۆنز، بیناسازی و بەخێوکردنی ئەسپیان گەیاندە لوتکە.',
  'سوبارتوو': 'سوبارتوو یەکێکە لە کەوناراترین ناو و شارستانیەتە دێرینەکانی باکووری مێزۆپۆتامیا و دامێنی چیاکانی زاگرۆس و کوردستان. لە بەڵگەنامە و تابلۆ قوڕینە سۆمەری و ئەکەدییەکاندا وەک نیشتمانی باکوور و خاکی گەلانی ڕەسەنی چیانشین ناوی هاتووە کە پێشینەی باپیرانی دێرینی گەلی کوردن.',
  'هۆری': 'هۆرییەکان لە هەزارەی سێیەم و دووەمی پێش زایین لە باکوور و ڕۆژئاوای کوردستان ژیاون، خاوەنی زمان و شارستانیەتێکی دەوڵەمەند بوون و بە یەکێک لە بناغە سەرەکییەکانی پێکهاتەی کلتوری، نەتەوەیی و زمانیی گەلی کورد دادەنرێن لە مێژوودا.',
  'لولوبی': 'شارستانیەتی لولوبی لە ناوچەکانی شارەزوور، گەرمیان و سەرپێڵی زەهاو دەسەڵاتدار بوون. تاشەبەردی مێژوویی ئەنوبانینی لە سەرپێڵی زەهاو یەکێکە لە کۆنترین نەخشەبەردینەکانی ڕۆژهەڵاتی ناوەڕاست کە هێز و سەروەریی ئەم گەلە دەسەلمێنێت.',
  'میتانی': 'ئیمپراتۆریەتێکی بەهێزی هۆری-ئاری بوون لە سەدەی ١٥ تا ١٣ی پێش زایین بە پایتەختێتی شاری واشۆکانی لە ڕۆژئاوای کوردستان کە ڕکابەری ئیمپراتۆریەتی فیرعەونەکانی میسریان دەکرد و خاوەنی تۆکمەترین سوپای ئەسپسوار و گالیسکەی جەنگی بوون.',
  'ئۆرارتۆ': 'دەوڵەتێکی گەورەی دەوروبەری دەریاچەی وان لە باکووری کوردستان کە بە قەڵا و تەلارسازیی پێشکەوتووی بەردین، کانزاکاری و کشتوکاڵی ئاودێری ناسراو بوو و بۆ چەندین سەدە ڕکابەری ئیمپراتۆریەتی ئاشووری دەکرد.',
  'نائیری': 'یەکێتییەکی بەهێزی هۆزە چیاییەکانی زاگرۆس و دەوروبەری دەریاچەی وان کە بە ئازایەتی و بەرگریی سەختیان لە نیشتمانەکەیان لە بەرامبەر پەلامارە داگیرکارییەکانی پاشاکانی ئاشووردا ناوبانگیان دەرکردبوو.',
  'مانایی': 'دەوڵەتێکی مێژوویی بوون لە باشووری دەریاچەی ورمێ (سەقز، بۆکان، مەهاباد) کە لە سەدەی ٩ تا ٦ی پێش زایین کلتور و کانزاکارییەکی بێهاوتایان لە قەڵای زێویە و تەپەی حەسەنلو دروست کرد.',
  'ماد': 'ئیمپراتۆریەتی مەزنی ماد لە ساڵی ٧٠٠ی پێش زایین لە ئەکباتانا (هەمەدان) بە یەکێتیی شەش هۆزە سەرەکییەکە دامەزرا و لە ساڵی ٦١٢ی پێش زایین بە هاوپەیمانی لەگەڵ بابلییەکان نەینەوای پایتەختی ئاشوورییەکانیان ڕووخاند و ئیمپراتۆریەتێکی مەزنیان بونیاد نا.',
  'کاردۆخ': 'کاردۆخییەکان گەلێکی ئازا و شەڕکەری چیاکانی باکووری کوردستان بوون کە لە سەدەی چوارەمی پێش زاییندا زەینەفۆنی مێژوونووسی یۆنانی لە کتێبی ئەناباسیادا بە وردی باسی لە ئازایەتی و بەرگریی سەختیان کردووە لە دژی لەشکری یۆنانییەکان.',
  'ئادیابین': 'شانشینێکی دێرین و دەسەڵاتدار بوو لە هەولێر و دەوروبەری (سەدەی یەکەمی زایینی) بە پایتەختێتی قەڵای هەولێر کە بە پێشکەوتنی بازرگانی، سیاسی و کلتوری لە سەرانسەری ناوچەکەدا ناسراوە.',
  'حەسەنوەیهی': 'دەوڵەتێکی سەربەخۆی کوردی لە سەدەی چوارەمی کۆچی بە پایتەختێتی قەڵای سەرمماج لە ناوچەکانی کرماشان، هەمەدان و لوڕستان کە خاوەنی دراوی تایبەت و ئاسایش و ئاوەدانیی زۆر بوون.',
  'مەروانی': 'دەوڵەتێکی کوردیی بەهێز لە باکووری کوردستان (دیاربەکر، میافارقین و جەزیرە) لە سەدەی ١٠ و ١١ی زایینی کە پردی دە دەرگا (دە دەری) و ژێرخانێکی گەورەی زانستی، تەلارسازی و فەرهەنگییان بونیاد نا.',
  'شەدادی': 'دەوڵەتێکی کوردی لە ئەڕان، گەنجە و ئانی (سەدەی ١٠ تا ١٢ی زایینی) کە خاوەنی سوپایەکی تۆکمە و تەلارسازیی پێشکەوتوو و دەروازە بەناوبانگەکانی گەنجە بوون.',
  'ئەییووبی': 'شانشین و ئیمپراتۆریەتی گەورەی ئەییووبی بە سەرکردایەتی سەلاحەدینی ئەییووبی کە میسر، شام، حیجاز و بەشێکی زۆری کوردستانی گرتەوە و شاری قودسی لە دەست خاچپەرستان ئازاد کرد و دادپەروەریی بڵاوکردەوە.',
  'ئەردەڵان': 'میرنشینێکی دێرین و بەهێزی کوردستان بە پایتەختێتی سنە کە بۆ زیاتر لە شەش سەدە سەربەخۆیی و کلتوری ڕەسەنی کوردی و ئەدەبیاتی دەوڵەمەندی هەورامییان لە ڕۆژهەڵاتی کوردستان پاراست.',
  'بابان': 'میرنشینی بابان بە پایتەختێتی قەڵاچوالان و دواتر دامەزراندنی شاری سلێمانی لە ساڵی ١٧٨٤، یەکێک لە گەورەترین ناوەندەکانی ڕۆشنبیری، شۆڕشگێڕی، تەلارسازی و ئەدەبی هاوچەرخی کوردی.',
  'سۆران': 'میرنشینی سۆران لە ڕەواندز بە تایبەت لە سەردەمی میر محەمەد (پاشای گەورە) کە کارگەی چەک و تۆپخانەی سەربەخۆی کوردی، دراوی تایبەت و سوپایەکی ڕێکخراوی نەتەوەیی دامەزراند.',
  'بادینان': 'میرنشینێکی کۆنی کوردستان بە پایتەختێتی ئامێدی لەسەر لوتکەی شاخ کە بە قەڵای پتەو و دەروازەی زێبار و پاراستنی سەربەخۆیی و زانست لە ناوچەی بەهدینان بۆ چەندین سەدە ناسرابوو.',
  'بۆتان': 'میرنشینی بۆتان بە پایتەختێتی جەزیرەی بۆتان، ناوەندی فەرهەنگی شاکارەکانی مەم و زینی ئەحمەدی خانی و بزووتنەوەی سەربەخۆیی بەدرخان پاشا لە باکووری کوردستان.',
  'ئیلام': 'شارستانیەتی ئیلام لە زاگرۆسی باشوور و خاکی مێژوویی ئیلام، یەکێکە لە کەوناراترین شارستانیەتەکانی جیهان کە خاوەنی زیگۆراتی بەناوبانگی چۆغازەنبیل و کلتورێکی دەوڵەمەند بووە.',
  'کۆماری': 'کۆماری کوردستان لە مەهاباد لە ساڵی ١٩٤٦ بە ڕابەرایەتی پێشەوا قازی محەمەد دامەزرا و یەکەم کیانی فەرمی مۆدێرنی دیموکراتی کورد بوو کە خاوەنی ئاڵا، سرودی نەتەوەیی و زمانی فەرمی بوو.',
  'ئەیلوول': 'شۆڕشی مەزنی ئەیلوول لە ساڵی ١٩٦١ بە ڕابەرایەتی مستەفا بارزانی هەڵگیرسا و بووە گەورەترین و درێژترین شۆڕشی سەراسەری باشووری کوردستان کە ڕێککەوتننامەی ١١ی ئاداری بەدەستهێنا.',
};

function getFactSummaryDisplay(fact: FactItem): string {
  if (!fact) return '';

  const nameTrim = fact.name || '';

  // 1. Check curated rich historical knowledge base by name keyword
  for (const [key, summary] of Object.entries(CURATED_HISTORICAL_SUMMARIES)) {
    if (nameTrim.includes(key)) {
      return summary;
    }
  }

  // 2. Check fact.fullText if it is a substantial description (> 35 chars and clean)
  if (
    fact.fullText &&
    fact.fullText.trim().length > 35 &&
    !fact.fullText.includes('Governorate') &&
    !fact.fullText.includes('Province')
  ) {
    return fact.fullText.trim();
  }

  // 3. Check RAW_FACTS_DATA baseline from database
  if (fact.id && RAW_FACTS_DATA[fact.id]) {
    const raw = RAW_FACTS_DATA[fact.id];
    if (raw.text && raw.text.trim().length > 35) {
      return raw.text.trim();
    }
    if (raw.desc && raw.desc.trim().length > 35) {
      return raw.desc.trim();
    }
  }

  // 4. Check fact.desc if substantial
  if (
    fact.desc &&
    fact.desc.trim().length > 25 &&
    !fact.desc.includes('Governorate') &&
    !fact.desc.includes('Province')
  ) {
    return fact.desc.trim();
  }

  // 5. Rich meaningful fallback incorporating historical identity
  const era = fact.eraName || 'مێژووی دێرین';
  const reg = fact.region || 'کوردستان';
  return `${nameTrim} لە بەڵگەنامە و توێژینەوە مێژووییەکاندا وەک بەشێکی بنەڕەتی لە سەردەمی ${era} و جوگرافیای ${reg} ناسراوە کە ڕۆڵێکی گرنگی لە مێژوو و ناسنامەی کەلەپووری ناوچەکەدا گێڕاوە.`;
}

function getFactYearDisplay(fact: FactItem): string {
  if (fact.year) {
    const isBc = fact.isBC || (typeof fact.startYear === 'number' && fact.startYear < 0);
    return isBc ? `${fact.year} پ.ز` : `${fact.year}`;
  }
  if (fact.century) return fact.century;
  if (fact.eraName) return fact.eraName;
  return 'سەردەمی مێژوویی';
}

function getFactLocationDisplay(fact: FactItem): string {
  if (
    fact.desc &&
    fact.desc.length <= 40 &&
    (fact.desc.includes('پایتەخت') ||
      fact.desc.includes('کەرکووک') ||
      fact.desc.includes('ئاراپخا') ||
      fact.desc.includes('هەولێر') ||
      fact.desc.includes('سلێمانی') ||
      fact.desc.includes('زاگرۆس') ||
      fact.desc.includes('بابل') ||
      fact.desc.includes('وان'))
  ) {
    return fact.desc;
  }
  if (fact.region && fact.region.trim()) {
    return fact.region.trim();
  }
  return 'کوردستان · چیاکانی زاگرۆس';
}

interface PosterArchivalImageProps {
  imageUrl: string;
  title: string;
  panelBg: string;
  filterMode?: 'grayscale' | 'sepia';
  edgeDirection?: 'to-left' | 'to-right';
}

const PosterArchivalImage: React.FC<PosterArchivalImageProps> = ({
  imageUrl,
  title,
  panelBg,
  filterMode = 'grayscale',
  edgeDirection = 'to-left',
}) => {
  const [aspect, setAspect] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const fullUrl = useMemo(() => getOptimizedImageUrl(imageUrl, 'full'), [imageUrl]);
  const thumbUrl = useMemo(() => getOptimizedImageUrl(imageUrl, 'thumb'), [imageUrl]);

  const isVertical = aspect !== null && aspect < 1.15;

  return (
    <div className="relative w-1/2 h-full min-h-0 overflow-hidden flex items-center justify-center bg-black/85 select-none p-1 sm:p-3 shrink-0">
      {/* 1. Ambient Blurred Backdrop */}
      {imageUrl && !hasError && (
        <img
          src={thumbUrl || fullUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl opacity-35 brightness-75 select-none pointer-events-none"
        />
      )}

      {/* 2. Sharp Subject */}
      {imageUrl && !hasError ? (
        <img
          src={fullUrl}
          alt={title}
          onLoad={(e) => {
            setIsLoaded(true);
            const { naturalWidth, naturalHeight } = e.currentTarget;
            if (naturalWidth && naturalHeight) {
              setAspect(naturalWidth / naturalHeight);
            }
          }}
          onError={() => setHasError(true)}
          className={`relative z-10 transition-all duration-500 group-hover:scale-105 ${
            filterMode === 'sepia'
              ? 'filter sepia contrast-125 brightness-95'
              : 'filter grayscale contrast-125 brightness-95'
          } ${
            isVertical
              ? 'max-h-[95%] max-w-[95%] w-auto h-auto object-contain object-center drop-shadow-[0_8px_20px_rgba(0,0,0,0.9)] rounded'
              : 'w-full h-full object-cover object-center'
          } ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      ) : (
        <div className="relative z-10 text-[10px] sm:text-xs text-slate-500 font-mono">وێنەی تۆمارکراو</div>
      )}

      {/* 3. Soft Border Feathering towards text */}
      <div
        className={`absolute inset-y-0 ${
          edgeDirection === 'to-left' ? 'left-0' : 'right-0'
        } w-4 sm:w-12 pointer-events-none z-20`}
        style={{
          background:
            edgeDirection === 'to-left'
              ? `linear-gradient(to right, ${panelBg} 0%, transparent 100%)`
              : `linear-gradient(to left, ${panelBg} 0%, transparent 100%)`,
        }}
      />
      {/* Frame vignette shadow */}
      <div className="absolute inset-0 shadow-[inset_0_0_16px_rgba(0,0,0,0.6)] pointer-events-none z-20" />
    </div>
  );
};

export const HistoricalJourneyModal: React.FC<Props> = ({
  isOpen,
  onClose,
  facts,
  onFlyToFact,
  onOpenDetail,
}) => {
  const { theme } = useTheme();

  // 1. Strict filter: ONLY include recorded facts that have authentic images
  const factsWithImages: FactItem[] = useMemo(() => {
    if (!facts || !Array.isArray(facts)) return [];
    return facts.filter((f) => {
      const img = getFactDisplayImage(f);
      return Boolean(img && img.trim().length > 0 && !img.startsWith('data:'));
    });
  }, [facts]);

  // 2. Group facts into pages of 3 items each
  const pages: FactItem[][] = useMemo(() => {
    if (factsWithImages.length === 0) return [];
    const chunks: FactItem[][] = [];
    for (let i = 0; i < factsWithImages.length; i += 3) {
      const chunk = factsWithImages.slice(i, i + 3);
      if (chunk.length === 3) {
        chunks.push(chunk);
      } else {
        const needed = 3 - chunk.length;
        chunks.push([...chunk, ...factsWithImages.slice(0, needed)]);
      }
    }
    return chunks;
  }, [factsWithImages]);

  const [currentPage, setCurrentPage] = useState<number>(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  // Touch gesture support for mobile swiping between pages
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  // Reset to first page when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentPage(0);
      setIsAnimating(false);
    }
  }, [isOpen]);

  const handleNextPage = useCallback(() => {
    if (pages.length <= 1 || isAnimating) return;
    setDirection('next');
    setIsAnimating(true);
    setCurrentPage((prev) => (prev + 1) % pages.length);
    setTimeout(() => setIsAnimating(false), 380);
  }, [pages.length, isAnimating]);

  const handlePrevPage = useCallback(() => {
    if (pages.length <= 1 || isAnimating) return;
    setDirection('prev');
    setIsAnimating(true);
    setCurrentPage((prev) => (prev - 1 + pages.length) % pages.length);
    setTimeout(() => setIsAnimating(false), 380);
  }, [pages.length, isAnimating]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        handleNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        handlePrevPage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentPage, pages.length, handleNextPage, handlePrevPage, onClose]);

  // Touch gesture listeners
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    const deltaY = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        handleNextPage();
      } else {
        handlePrevPage();
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

  if (!isOpen) return null;

  if (pages.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in text-white p-4">
        <div className="text-center max-w-sm p-6 rounded-2xl bg-white/5 border border-white/10">
          <BookOpen className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <h3 className="font-heading font-bold text-base mb-1 text-white">هیچ بابەتێکی وێنەدار نەدۆزرایەوە</h3>
          <p className="text-xs text-slate-400 mb-4">
            تەنها ئەو بابەتانە لە گەشتی مێژووییدا دەردەکەون کە وێنەی تۆمارکراوی تایبەت بە خۆیان هەیە.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs cursor-pointer hover:bg-amber-400 transition-colors"
          >
            داخستن
          </button>
        </div>
      </div>
    );
  }

  const currentItems = pages[currentPage] || pages[0];
  const itemTop = currentItems[0];
  const itemMid = currentItems[1];
  const itemBot = currentItems[2];

  const imgTop = getFactDisplayImage(itemTop);
  const imgMid = getFactDisplayImage(itemMid);
  const imgBot = getFactDisplayImage(itemBot);

  return (
    <div
      id="journey-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl animate-fade-in select-none overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <style>{`
        #journey-modal, #journey-modal * {
          box-sizing: border-box;
        }
        @keyframes posterSlideInRight {
          0% {
            opacity: 0;
            transform: translateX(35px) scale(0.99);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @keyframes posterSlideInLeft {
          0% {
            opacity: 0;
            transform: translateX(-35px) scale(0.99);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        .anim-slide-from-right {
          animation: posterSlideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .anim-slide-from-left {
          animation: posterSlideInLeft 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>

      {/* Main Container - Exactly matches viewport height without scroll on both computer & mobile */}
      <div className="relative w-full h-[100dvh] max-w-4xl mx-auto flex flex-col justify-between py-1.5 sm:py-2.5 px-1 sm:px-3 overflow-hidden">
        {/* =========================================================================
            HEADER BAR
            ========================================================================= */}
        <header className="relative z-30 w-full flex items-center justify-between pb-1.5 border-b border-white/10 px-1 sm:px-2 shrink-0">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center font-bold text-black shadow-md shrink-0"
              style={{ backgroundColor: theme.primaryColor }}
            >
              <BookOpen className="w-3.5 h-3.5 text-black" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-xs sm:text-base text-white flex items-center gap-1.5 sm:gap-2">
                <span>گەشتی مێژوویی</span>
                <span className="text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-amber-300 border border-white/15">
                  پۆستەری مێژوو
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Page Counter Badge */}
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-black/60 border border-white/15 text-xs text-slate-300 font-mono">
              <span className="text-amber-400 font-bold">{currentPage + 1}</span>
              <span className="text-slate-500">/</span>
              <span>{pages.length}</span>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg bg-white/[0.08] hover:bg-white/[0.16] active:scale-95 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="داخستن (Esc)"
              aria-label="داخستن"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* =========================================================================
            CENTER: THE 3 SPREAD POSTER (NO SCROLL ON COMPUTER & MOBILE)
            Both mobile and computer share the EXACT SAME layout:
            3 horizontal split panels (Text | Image, Image | Text, Text | Image)
            Dividing the container height cleanly into thirds (h-1/3 each) without scrollbars!
            ========================================================================= */}
        <div
          key={`poster-page-${currentPage}`}
          className="relative flex-1 w-full my-1 sm:my-1.5 flex flex-col justify-between rounded-xl sm:rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-black min-h-0"
        >
          {/* =========================================================================
              PANEL 1 (TOP): DARK DRAMATIC ARCHIVAL POSTER
              Layout: Text Block on Left, Adaptive Image on Right
              ========================================================================= */}
          <section
            onClick={() => onOpenDetail && onOpenDetail(itemTop)}
            className="group relative flex-1 min-h-0 flex flex-row items-stretch border-b border-white/10 bg-[#07090e] cursor-pointer hover:bg-white/[0.03] transition-colors overflow-hidden"
          >
            {/* Left: Vintage Text Column */}
            <div
              className={`relative z-10 w-1/2 flex flex-col justify-between p-2 sm:p-4 md:p-5 text-right overflow-hidden shrink-0 ${
                direction === 'next' ? 'anim-slide-from-left' : 'anim-slide-from-right'
              }`}
              dir="rtl"
            >
              {/* Year & Location */}
              <div className="shrink-0">
                <div className="flex items-center justify-start gap-1 sm:gap-2">
                  <span className="journey-year font-mono text-xs sm:text-xl text-amber-400/60">-</span>
                  <span className="journey-year text-sm sm:text-2xl font-mono font-black tracking-wider sm:tracking-widest text-amber-400">
                    {getFactYearDisplay(itemTop)}
                  </span>
                  <span className="journey-year font-mono text-xs sm:text-xl text-amber-400/60">-</span>
                </div>
                <div className="journey-meta text-[9px] sm:text-xs font-mono tracking-wider text-slate-300 mt-0.5 uppercase truncate">
                  {getFactLocationDisplay(itemTop)}
                </div>
              </div>

              {/* Historical Narrative */}
              <p className="journey-summary text-[10px] sm:text-xs md:text-sm text-white font-light leading-snug sm:leading-relaxed my-0.5 sm:my-1 line-clamp-3 sm:line-clamp-4 max-w-xl overflow-hidden">
                {getFactSummaryDisplay(itemTop)}
              </p>

              {/* Star Divider & Title */}
              <div className="shrink-0">
                <div className="text-right tracking-[0.4em] sm:tracking-[0.6em] text-amber-400 text-[10px] sm:text-xs font-serif my-0.5">
                  * * *
                </div>
                <h3 className="journey-title font-heading font-black text-xs sm:text-lg md:text-xl text-amber-300 tracking-wide uppercase leading-tight truncate group-hover:text-amber-200 transition-colors">
                  {itemTop.name}
                </h3>
              </div>
            </div>

            {/* Right: Archival Image (50% width, full height of panel) */}
            <PosterArchivalImage
              imageUrl={imgTop}
              title={itemTop.name}
              panelBg="#07090e"
              filterMode="grayscale"
              edgeDirection="to-left"
            />
          </section>

          {/* =========================================================================
              PANEL 2 (MIDDLE): DARK VINTAGE EDITORIAL POSTER
              Layout: Adaptive Image on Left, Luminous Text Block on Right
              ========================================================================= */}
          <section
            onClick={() => onOpenDetail && onOpenDetail(itemMid)}
            className="group relative flex-1 min-h-0 flex flex-row items-stretch border-b border-white/10 bg-[#0a0e1a] cursor-pointer hover:bg-white/[0.03] transition-colors overflow-hidden"
          >
            {/* Left: Archival Image (50% width, full height of panel) */}
            <PosterArchivalImage
              imageUrl={imgMid}
              title={itemMid.name}
              panelBg="#0a0e1a"
              filterMode="grayscale"
              edgeDirection="to-right"
            />

            {/* Right: Luminous Archival Typography */}
            <div
              className={`relative z-10 w-1/2 flex flex-col justify-between p-2 sm:p-4 md:p-5 text-right overflow-hidden shrink-0 ${
                direction === 'next' ? 'anim-slide-from-right' : 'anim-slide-from-left'
              }`}
              dir="rtl"
            >
              {/* Title at top */}
              <div className="shrink-0">
                <h3 className="journey-title font-heading font-black text-xs sm:text-lg md:text-2xl text-amber-300 tracking-tight leading-tight uppercase truncate group-hover:text-amber-200 transition-colors">
                  {itemMid.name}
                </h3>
              </div>

              {/* Historical Narrative */}
              <p className="journey-summary text-[10px] sm:text-xs md:text-sm text-white font-light leading-snug sm:leading-relaxed my-0.5 sm:my-1 line-clamp-3 sm:line-clamp-4 max-w-xl overflow-hidden">
                {getFactSummaryDisplay(itemMid)}
              </p>

              {/* Star Divider & Bottom Year / Location */}
              <div className="shrink-0">
                <div className="text-right tracking-[0.4em] sm:tracking-[0.6em] text-amber-400 text-[10px] sm:text-xs font-serif my-0.5">
                  * * *
                </div>
                <div className="journey-meta text-[9px] sm:text-xs font-mono font-bold tracking-wider text-slate-300 uppercase truncate">
                  <span className="journey-year text-amber-400">{getFactYearDisplay(itemMid)}</span> · {getFactLocationDisplay(itemMid)}
                </div>
              </div>
            </div>
          </section>

          {/* =========================================================================
              PANEL 3 (BOTTOM): WARM SEPIA ARCHIVAL DOSSIER POSTER
              Layout: Text Block on Left in warm amber/gold tones, Adaptive Image on Right
              ========================================================================= */}
          <section
            onClick={() => onOpenDetail && onOpenDetail(itemBot)}
            className="group relative flex-1 min-h-0 flex flex-row items-stretch bg-[#0c0906] cursor-pointer hover:bg-white/[0.03] transition-colors overflow-hidden"
          >
            {/* Left: Warm Archival Text Column */}
            <div
              className={`relative z-10 w-1/2 flex flex-col justify-between p-2 sm:p-4 md:p-5 text-right overflow-hidden shrink-0 ${
                direction === 'next' ? 'anim-slide-from-left' : 'anim-slide-from-right'
              }`}
              dir="rtl"
            >
              {/* Year & Location */}
              <div className="shrink-0">
                <div className="flex items-center justify-start gap-1 sm:gap-2">
                  <span className="journey-year font-mono text-xs sm:text-xl text-amber-400/60">-</span>
                  <span className="journey-year text-sm sm:text-2xl font-mono font-black tracking-wider sm:tracking-widest text-amber-300">
                    {getFactYearDisplay(itemBot)}
                  </span>
                  <span className="journey-year font-mono text-xs sm:text-xl text-amber-400/60">-</span>
                </div>
                <div className="journey-meta text-[9px] sm:text-xs font-mono tracking-wider text-amber-200/80 mt-0.5 uppercase truncate">
                  {getFactLocationDisplay(itemBot)}
                </div>
              </div>

              {/* Historical Narrative */}
              <p className="journey-summary text-[10px] sm:text-xs md:text-sm text-amber-50 font-light leading-snug sm:leading-relaxed my-0.5 sm:my-1 line-clamp-3 sm:line-clamp-4 max-w-xl overflow-hidden">
                {getFactSummaryDisplay(itemBot)}
              </p>

              {/* Star Divider & Headline */}
              <div className="shrink-0">
                <div className="text-right tracking-[0.4em] sm:tracking-[0.6em] text-amber-400 text-[10px] sm:text-xs font-serif my-0.5">
                  * * *
                </div>
                <h3 className="journey-title font-heading font-black text-xs sm:text-lg md:text-xl text-amber-300 tracking-wide uppercase leading-tight truncate group-hover:text-amber-200 transition-colors">
                  {itemBot.name}
                </h3>
              </div>
            </div>

            {/* Right: Archival Image (50% width, full height of panel) */}
            <PosterArchivalImage
              imageUrl={imgBot}
              title={itemBot.name}
              panelBg="#0c0906"
              filterMode="sepia"
              edgeDirection="to-left"
            />
          </section>
        </div>

        {/* =========================================================================
            FOOTER: PAGINATION & HINT
            ========================================================================= */}
        <footer className="relative z-30 w-full flex items-center justify-between pt-1 pb-[max(0.2rem,env(safe-area-inset-bottom))] border-t border-white/10 px-1 sm:px-2 shrink-0">
          {/* Previous Page Button */}
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={isAnimating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/15 text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            title="لاپەڕەی پێشوو (Left Arrow)"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>لاپەڕەی پێشوو</span>
          </button>

          {/* Center Hint */}
          <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <span className="hidden sm:inline">کلیک لەسەر هەر بابەتێک بکە بۆ بینینی بەڵگەنامە و وێنەکان</span>
            <span className="sm:hidden text-slate-400">
              کلیک لەسەر بابەت بکە بۆ نەخشە
            </span>
          </div>

          {/* Next Page Button */}
          <button
            type="button"
            onClick={handleNextPage}
            disabled={isAnimating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-heading font-extrabold text-xs transition-all active:scale-95 cursor-pointer shadow-md disabled:opacity-50"
            title="لاپەڕەی دواتر (Right Arrow)"
          >
            <span>لاپەڕەی دواتر</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-950" />
          </button>
        </footer>
      </div>
    </div>
  );
};
