import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  Compass,
  BookOpen,
  Layers,
  Landmark,
  Maximize2,
  Minimize2,
  ZoomIn,
} from 'lucide-react';
import { FactItem, RAW_FACTS_DATA } from '../data/kurdishHistoryData';
import { getFactDisplayImage } from '../utils/historicalImages';
import { getOptimizedImageUrl } from '../utils/imageUtils';
import { toKurdishDigits } from '../utils/yearUtils';
import { useTheme } from '../context/ThemeContext';
import { getCategoryInfo } from '../types/history';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  facts: FactItem[];
  onFlyToFact?: (fact: FactItem) => void;
  onOpenDetail?: (fact: FactItem) => void;
}

// Curated authentic Kurdish historical narratives
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

  // 2. Check fact.fullText if substantial
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

  // 5. Rich fallback
  const era = fact.eraName || 'مێژووی دێرین';
  const reg = fact.region || 'کوردستان';
  return `${nameTrim} لە بەڵگەنامە و توێژینەوە مێژووییەکاندا وەک بەشێکی بنەڕەتی لە سەردەمی ${era} و جوگرافیای ${reg} ناسراوە کە ڕۆڵێکی گرنگی لە مێژوو و ناسنامەی کەلەپووری نەتەوەکەدا گێڕاوە.`;
}

function getFactYearDisplay(fact: FactItem): string {
  if (!fact) return '';
  if (fact.year) {
    const isBc = fact.isBC || (typeof fact.startYear === 'number' && fact.startYear < 0);
    return isBc ? `${toKurdishDigits(fact.year)} پ.ز` : `${toKurdishDigits(fact.year)} زاینی`;
  }
  if (fact.century) return fact.century;
  if (fact.eraName) return fact.eraName;
  return 'سەردەمی مێژوویی';
}

function getFactLocationDisplay(fact: FactItem): string {
  if (!fact) return 'کوردستان';
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

export const HistoricalJourneyModal: React.FC<Props> = ({
  isOpen,
  onClose,
  facts,
  onFlyToFact,
  onOpenDetail,
}) => {
  const { colorMode, theme } = useTheme();
  const isDark = colorMode === 'dark';

  // Image presentation controls: 'contain' ensures 100% of the image is visible without cropping
  const [imageFitMode, setImageFitMode] = useState<'contain' | 'cover'>('contain');
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string; year?: string } | null>(null);

  // Helper: ONLY returns authentic recorded images, strictly excluding self-generated or synthetic fallback images
  const getAuthenticFactImage = useCallback((f: FactItem | null | undefined): string => {
    if (!f) return '';
    if (failedImages.has(f.id)) return '';
    const img = getFactDisplayImage(f);
    if (
      !img ||
      !img.trim() ||
      img.includes('kurd_battle_scholar_bg') ||
      img.includes('hero/bg')
    ) {
      return '';
    }
    return img;
  }, [failedImages]);

  // Filter valid facts for historical journey
  const allJourneyFacts: FactItem[] = useMemo(() => {
    if (!facts || !Array.isArray(facts)) return [];
    return facts.filter((f) => f && f.name && f.name.trim().length > 0);
  }, [facts]);

  const totalFacts = allJourneyFacts.length;
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  // Sketchbook Page Flip Animation States
  const [fallingCard, setFallingCard] = useState<FactItem | null>(null);
  const [isRisingUp, setIsRisingUp] = useState<boolean>(false);

  // Preloaded image URL cache
  const preloadedMapRef = useRef<Set<string>>(new Set());

  // Touch gesture state
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsTransitioning(false);
      setFallingCard(null);
      setIsRisingUp(false);
    }
  }, [isOpen]);

  // Preload pipeline: Preload 6-8 upcoming authentic cards in background for instant zero-lag transitions
  useEffect(() => {
    if (!isOpen || totalFacts === 0) return;

    const preloadBatchSize = Math.min(8, totalFacts);
    for (let offset = 0; offset < preloadBatchSize; offset++) {
      const item = allJourneyFacts[(currentIndex + offset) % totalFacts];
      const rawImg = getAuthenticFactImage(item);
      if (rawImg && !preloadedMapRef.current.has(rawImg)) {
        preloadedMapRef.current.add(rawImg);
        const resolved = getOptimizedImageUrl(rawImg, 'full');
        const imgObj = new Image();
        imgObj.src = resolved;
      }
    }
  }, [isOpen, currentIndex, totalFacts, allJourneyFacts, getAuthenticFactImage]);

  // Navigation: Next (Page flips and falls down)
  const handleNext = useCallback(() => {
    if (totalFacts <= 1 || isTransitioning) return;
    setIsTransitioning(true);
    setIsRisingUp(false);
    const activeFact = allJourneyFacts[currentIndex];
    setFallingCard(activeFact);
    setCurrentIndex((prev) => (prev + 1) % totalFacts);

    setTimeout(() => {
      setFallingCard(null);
      setIsTransitioning(false);
    }, 440);
  }, [totalFacts, isTransitioning, allJourneyFacts, currentIndex]);

  // Navigation: Prev (Page sweeps and rises up from bottom)
  const handlePrev = useCallback(() => {
    if (totalFacts <= 1 || isTransitioning) return;
    setIsTransitioning(true);
    setFallingCard(null);
    setIsRisingUp(true);
    setCurrentIndex((prev) => (prev - 1 + totalFacts) % totalFacts);

    setTimeout(() => {
      setIsRisingUp(false);
      setIsTransitioning(false);
    }, 440);
  }, [totalFacts, isTransitioning]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previewImage) {
          setPreviewImage(null);
        } else {
          onClose();
        }
      } else if (!previewImage && (e.key === 'ArrowRight' || e.key === 'ArrowDown')) {
        handleNext();
      } else if (!previewImage && (e.key === 'ArrowLeft' || e.key === 'ArrowUp')) {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose, previewImage]);

  // Touch handlers
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
        handleNext();
      } else {
        handlePrev();
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

  if (!isOpen) return null;

  if (totalFacts === 0) {
    return (
      <div
        className={`fixed inset-0 z-[1200] flex items-center justify-center p-4 backdrop-blur-xl animate-fade-in ${
          isDark ? 'bg-black/95 text-white' : 'bg-white/95 text-slate-900'
        }`}
      >
        <div
          className={`text-center max-w-sm p-6 rounded-3xl border shadow-2xl ${
            isDark ? 'bg-[#0f1422] border-white/10' : 'bg-white border-slate-200'
          }`}
        >
          <BookOpen className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <h3 className="font-heading font-bold text-base mb-1">هیچ بابەتێکی مێژوویی بەردەست نییە</h3>
          <p className="text-xs text-slate-400 mb-4">
            تکایە سەرەتا بابەتەکان داخڵ بکە یان دڵنیابەرەوە لە هێنانەوەی تۆمارەکان.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs cursor-pointer hover:bg-amber-400 transition-colors"
          >
            داخستن
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      id="historical-journey-modal"
      className={`fixed inset-0 z-[1200] flex flex-col justify-between p-2 sm:p-3 md:p-5 select-none overflow-hidden animate-fade-in transition-colors duration-300 ${
        isDark ? 'bg-[#06080e]/98 text-white' : 'bg-[#f8fafc]/98 text-slate-900'
      }`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      dir="rtl"
    >
      {/* 3D Sketchbook Flip Animation CSS Styles */}
      <style>{`
        #historical-journey-modal, #historical-journey-modal * {
          box-sizing: border-box;
        }
        .journey-card-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .journey-card-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(245, 158, 11, 0.35);
          border-radius: 9999px;
        }
        .journey-card-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(245, 158, 11, 0.7);
        }

        /* Sketchbook Page Turning / Drop Down Animation */
        @keyframes sketchbookFallDown {
          0% {
            transform: translateY(0px) rotateX(0deg) scale(1);
            opacity: 1;
            box-shadow: 0 30px 90px rgba(0, 0, 0, 0.95);
          }
          30% {
            transform: translateY(22px) rotateX(-14deg) scale(0.98);
            opacity: 0.96;
            box-shadow: 0 40px 100px rgba(0, 0, 0, 0.85);
          }
          100% {
            transform: translateY(135%) rotateX(-42deg) scale(0.88);
            opacity: 0;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          }
        }

        /* Sketchbook Page Return / Sweep Up from Bottom Animation */
        @keyframes sketchbookRiseUp {
          0% {
            transform: translateY(135%) rotateX(-42deg) scale(0.88);
            opacity: 0;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          }
          72% {
            transform: translateY(-10px) rotateX(5deg) scale(1.02);
            opacity: 0.98;
            box-shadow: 0 35px 95px rgba(0, 0, 0, 0.9);
          }
          100% {
            transform: translateY(0px) rotateX(0deg) scale(1);
            opacity: 1;
            box-shadow: 0 30px 90px rgba(0, 0, 0, 0.95);
          }
        }

        .anim-sketchbook-fall-down {
          animation: sketchbookFallDown 0.44s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          transform-origin: bottom center;
          pointer-events: none;
        }

        .anim-sketchbook-rise-up {
          animation: sketchbookRiseUp 0.44s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: bottom center;
        }
      `}</style>

      {/* =========================================================================
          TOP HEADER BAR
          ========================================================================= */}
      <header
        className={`w-full max-w-5xl mx-auto flex items-center justify-between pb-2 border-b shrink-0 transition-colors ${
          isDark ? 'border-white/10' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-black shadow-md shrink-0"
            style={{ backgroundColor: theme.primaryColor || '#f59e0b' }}
          >
            <Layers className="w-4 h-4 text-black" />
          </div>
          <div>
            <h2 className="font-heading font-black text-sm sm:text-lg flex items-center gap-2">
              <span>گەشتی مێژوویی</span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Progress Badge */}
          <div
            className={`flex items-center gap-1 px-3 py-1 rounded-xl border text-xs font-mono font-bold ${
              isDark
                ? 'bg-white/[0.05] border-white/10 text-slate-300'
                : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <span className="text-amber-500">{toKurdishDigits(currentIndex + 1)}</span>
            <span className="opacity-40">/</span>
            <span>{toKurdishDigits(totalFacts)}</span>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl border transition-all cursor-pointer active:scale-95 ${
              isDark
                ? 'bg-white/[0.06] border-white/10 text-slate-300 hover:text-white hover:bg-white/[0.15]'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title="داخستن (Esc)"
            aria-label="داخستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* =========================================================================
          CENTER 3D STAGE:
          Front sharp card + 5 VISIBLY STEPPED & SPREAD BLURRED BACKGROUND CARDS
          ========================================================================= */}
      <main className="relative flex-1 w-full max-w-4xl mx-auto flex items-center justify-center my-1 sm:my-2 min-h-0 [perspective:1400px]">
        <div className="relative w-full h-[560px] sm:h-[620px] max-h-[76dvh] flex items-center justify-center">
          {(() => {
            const factItem = allJourneyFacts[currentIndex];
            if (!factItem) return null;

            const imgUrl = getAuthenticFactImage(factItem);
            const optimizedImg = imgUrl ? getOptimizedImageUrl(imgUrl, 'full') : '';
            const catInfo = getCategoryInfo(factItem);

            return (
              <article
                key={`active-card-${factItem.id}`}
                className={`relative w-full max-w-sm sm:max-w-md md:max-w-lg h-full rounded-3xl overflow-hidden flex flex-col border transition-all duration-300 ease-out select-none ${
                  isRisingUp ? 'anim-sketchbook-rise-up' : ''
                } ${
                  isDark
                    ? 'bg-[#0d121f] border-white/20 shadow-[0_30px_90px_rgba(0,0,0,0.95),0_0_40px_rgba(245,158,11,0.2)]'
                    : 'bg-white border-slate-200 shadow-[0_25px_70px_-10px_rgba(0,0,0,0.18),0_10px_25px_rgba(0,0,0,0.06)]'
                }`}
              >
                {/* 1. TOP PART: AUTHENTIC IMAGE WITH DUAL-LAYER SIZING & ASPECT RATIO PRESERVATION */}
                {optimizedImg ? (
                  <div className="relative w-full h-52 sm:h-60 md:h-72 shrink-0 overflow-hidden bg-black/85 flex items-center justify-center group">
                    {/* Ambient Blur Layer: matches exact photo colors, no ugly borders */}
                    <img
                      src={optimizedImg}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-35 scale-110 pointer-events-none select-none transition-opacity duration-300"
                    />

                    {/* Main Foreground Image: fully preserved aspect ratio without chopping off faces or maps */}
                    <img
                      src={optimizedImg}
                      alt={factItem.name}
                      onError={() => {
                        setFailedImages((prev) => new Set(prev).add(factItem.id));
                      }}
                      className={`relative z-10 w-full h-full transition-all duration-300 select-none cursor-pointer ${
                        imageFitMode === 'contain'
                          ? 'object-contain p-1.5 sm:p-2.5 drop-shadow-md'
                          : 'object-cover object-center'
                      }`}
                      onClick={() => {
                        setPreviewImage({
                          url: optimizedImg,
                          title: factItem.name,
                          year: getFactYearDisplay(factItem),
                        });
                      }}
                      title="کلیک بکە بۆ بینینی تەواوی وێنەکە بە قەبارەی گەورە"
                    />

                    {/* Bottom subtle gradient overlay */}
                    <div
                      className={`absolute inset-0 z-10 pointer-events-none bg-gradient-to-t ${
                        isDark
                          ? 'from-[#0d121f] via-transparent to-black/35'
                          : 'from-white via-transparent to-black/30'
                      }`}
                    />

                    {/* Top-Right Badge: Category */}
                    <div className="absolute top-2.5 right-2.5 z-20">
                      <span
                        className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-md backdrop-blur-md flex items-center gap-1.5 border"
                        style={{
                          backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)',
                          color: catInfo.color || '#f59e0b',
                          borderColor: `${catInfo.color || '#f59e0b'}55`,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: catInfo.color || '#f59e0b' }}
                        />
                        <span>{catInfo.name}</span>
                      </span>
                    </div>

                    {/* Top-Left Controls: Year Badge + Size/Fit Mode Toggle + Zoom Lightbox */}
                    <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5">
                      {/* Sizing Fit Mode Toggle Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageFitMode((prev) => (prev === 'contain' ? 'cover' : 'contain'));
                        }}
                        className={`p-1.5 rounded-full border shadow-md backdrop-blur-md transition-all active:scale-90 cursor-pointer ${
                          imageFitMode === 'contain'
                            ? 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400'
                            : isDark
                            ? 'bg-black/70 text-slate-200 border-white/20 hover:text-white'
                            : 'bg-white/90 text-slate-700 border-slate-300 hover:text-slate-900'
                        }`}
                        title={
                          imageFitMode === 'contain'
                            ? 'قەبارە: پیشاندانی تەواوی وێنە (بێ بڕین) - کلیک بکە بۆ پڕکردنەوە'
                            : 'قەبارە: پڕکردنەوەی کارد - کلیک بکە بۆ پیشاندانی تەواوی وێنە بێ بڕین'
                        }
                      >
                        {imageFitMode === 'contain' ? (
                          <Minimize2 className="w-3.5 h-3.5" />
                        ) : (
                          <Maximize2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Zoom Lightbox Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewImage({
                            url: optimizedImg,
                            title: factItem.name,
                            year: getFactYearDisplay(factItem),
                          });
                        }}
                        className={`p-1.5 rounded-full border shadow-md backdrop-blur-md transition-all active:scale-90 cursor-pointer ${
                          isDark
                            ? 'bg-black/70 text-slate-200 border-white/20 hover:text-white'
                            : 'bg-white/90 text-slate-700 border-slate-300 hover:text-slate-900'
                        }`}
                        title="گەورەکردنی وێنە بە قەبارەی تەواو"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>

                      {/* Year Badge */}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold shadow-md backdrop-blur-md border ${
                          isDark
                            ? 'bg-black/70 text-amber-300 border-amber-400/30'
                            : 'bg-white/90 text-amber-700 border-amber-500/40'
                        }`}
                      >
                        {getFactYearDisplay(factItem)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`relative w-full h-32 sm:h-40 shrink-0 overflow-hidden flex flex-col justify-between p-3.5 border-b ${
                      isDark
                        ? 'bg-gradient-to-br from-amber-950/20 via-[#101726] to-[#0a0f1d] border-white/10'
                        : 'bg-gradient-to-br from-amber-50/70 via-slate-50 to-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between z-10">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold shadow-xs backdrop-blur-md flex items-center gap-1.5 border"
                        style={{
                          backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.95)',
                          color: catInfo.color || '#f59e0b',
                          borderColor: `${catInfo.color || '#f59e0b'}55`,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: catInfo.color || '#f59e0b' }}
                        />
                        <span>{catInfo.name}</span>
                      </span>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold border ${
                          isDark
                            ? 'bg-black/60 text-amber-300 border-amber-400/30'
                            : 'bg-white text-amber-700 border-amber-500/30'
                        }`}
                      >
                        {getFactYearDisplay(factItem)}
                      </span>
                    </div>

                    <div className="flex items-center justify-center py-1 z-10 opacity-75">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner"
                        style={{
                          backgroundColor: isDark ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.12)',
                          borderColor: `${catInfo.color || '#f59e0b'}40`,
                        }}
                      >
                        <Landmark
                          className="w-6 h-6"
                          style={{ color: catInfo.color || '#f59e0b' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. BOTTOM PART: TITLE, YEAR/LOCATION, AND RICH FULL SUMMARY */}
                <div className="relative flex-1 min-h-0 flex flex-col justify-between p-4 sm:p-5 text-right">
                  {/* Title & Metadata */}
                  <div className="shrink-0 mb-1.5">
                    <h3
                      className={`font-heading font-black text-lg sm:text-xl md:text-2xl tracking-tight leading-snug line-clamp-2 ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {factItem.name}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5 text-xs sm:text-sm font-semibold">
                      <span className="flex items-center gap-1 text-amber-500 font-mono">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{getFactYearDisplay(factItem)}</span>
                      </span>

                      <span className="opacity-30">•</span>

                      <span
                        className={`flex items-center gap-1 truncate max-w-[200px] sm:max-w-[280px] ${
                          isDark ? 'text-slate-300' : 'text-slate-600'
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">{getFactLocationDisplay(factItem)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Narrative Body: Full Summary */}
                  <div className="flex-1 min-h-0 overflow-y-auto journey-card-scrollbar pr-1 my-1">
                    <p
                      className={`text-xs sm:text-sm md:text-[15px] font-normal leading-relaxed text-justify ${
                        isDark ? 'text-slate-200' : 'text-slate-700'
                      }`}
                    >
                      {getFactSummaryDisplay(factItem)}
                    </p>
                  </div>

                  {/* Actions on Active Card */}
                  <div
                    className={`pt-2.5 mt-1.5 border-t flex items-center justify-between gap-2 shrink-0 ${
                      isDark ? 'border-white/10' : 'border-slate-200'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onFlyToFact) onFlyToFact(factItem);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-95 ${
                        isDark
                          ? 'bg-white/[0.08] hover:bg-white/[0.15] border-white/15 text-slate-200 hover:text-white'
                          : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                      }`}
                      title="بینینی ئەم خاڵە لەسەر نەخشەی کوردستان"
                    >
                      <Compass className="w-3.5 h-3.5 text-amber-500" />
                      <span>نەخشە</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenDetail) onOpenDetail(factItem);
                      }}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 transition-all cursor-pointer active:scale-95 shadow-md"
                      title="کردنەوەی تەواوی سەرچاوە، بەستراوەکان و وردەکاریی مێژوویی"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-slate-950" />
                      <span>وردەکاریی زیاتر</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })()}

          {/* Falling Card overlay when clicking Next */}
          {fallingCard && (
            <article
              key={`falling-card-${fallingCard.id}`}
              style={{
                zIndex: 50,
                transformOrigin: 'bottom center',
              }}
              className={`absolute inset-y-0 my-auto w-full max-w-sm sm:max-w-md md:max-w-lg rounded-3xl overflow-hidden flex flex-col border select-none anim-sketchbook-fall-down ${
                isDark
                  ? 'bg-[#0d121f] border-white/20 shadow-[0_30px_90px_rgba(0,0,0,0.95),0_0_40px_rgba(245,158,11,0.2)]'
                  : 'bg-white border-slate-200 shadow-[0_25px_70px_-10px_rgba(0,0,0,0.18),0_10px_25px_rgba(0,0,0,0.06)]'
              }`}
            >
              {(() => {
                const fallingImg = getAuthenticFactImage(fallingCard);
                const optimizedFallingImg = fallingImg ? getOptimizedImageUrl(fallingImg, 'full') : '';
                return optimizedFallingImg ? (
                  <div className="relative w-full h-52 sm:h-60 md:h-72 shrink-0 overflow-hidden bg-black/85 flex items-center justify-center">
                    <img
                      src={optimizedFallingImg}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-35 scale-110 pointer-events-none select-none"
                    />
                    <img
                      src={optimizedFallingImg}
                      alt={fallingCard.name}
                      className={`relative z-10 w-full h-full select-none ${
                        imageFitMode === 'contain'
                          ? 'object-contain p-1.5 sm:p-2.5 drop-shadow-md'
                          : 'object-cover object-center'
                      }`}
                    />
                    <div
                      className={`absolute inset-0 z-10 bg-gradient-to-t ${
                        isDark
                          ? 'from-[#0d121f] via-transparent to-black/35'
                          : 'from-white via-transparent to-black/30'
                      }`}
                    />
                  </div>
                ) : (
                  <div
                    className={`relative w-full h-28 sm:h-36 shrink-0 overflow-hidden flex items-center justify-center p-3 border-b ${
                      isDark
                        ? 'bg-gradient-to-br from-amber-950/20 via-[#101726] to-[#0a0f1d] border-white/10'
                        : 'bg-gradient-to-br from-amber-50/70 via-slate-50 to-white border-slate-200'
                    }`}
                  >
                    <Landmark className="w-8 h-8 text-amber-500/70" />
                  </div>
                );
              })()}

              <div className="relative flex-1 min-h-0 flex flex-col justify-between p-3.5 sm:p-5 text-right">
                <div className="shrink-0 mb-1.5">
                  <h3
                    className={`font-heading font-black text-base sm:text-xl md:text-2xl tracking-tight leading-snug line-clamp-2 ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {fallingCard.name}
                  </h3>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto journey-card-scrollbar pr-1 my-1">
                  <p
                    className={`text-xs sm:text-sm font-normal leading-relaxed text-justify ${
                      isDark ? 'text-slate-200' : 'text-slate-700'
                    }`}
                  >
                    {getFactSummaryDisplay(fallingCard)}
                  </p>
                </div>
              </div>
            </article>
          )}
        </div>
      </main>

      {/* =========================================================================
          BOTTOM FOOTER: CONTROLS & NAVIGATION
          ========================================================================= */}
      <footer
        className={`w-full max-w-5xl mx-auto flex items-center justify-between pt-1.5 pb-[max(0.2rem,env(safe-area-inset-bottom))] border-t shrink-0 transition-colors ${
          isDark ? 'border-white/10' : 'border-slate-200'
        }`}
      >
        {/* Previous Button (پێشوو) */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={isTransitioning}
          className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${
            isDark
              ? 'bg-white/[0.08] hover:bg-white/[0.16] border-white/15 text-white'
              : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
          }`}
          title="بابەتی پێشوو (Left Arrow)"
        >
          <ChevronRight className="w-4 h-4 text-amber-500" />
          <span>پێشوو</span>
        </button>

        {/* Center Progress Dots */}
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span
              className={`text-[11px] sm:text-xs font-bold font-mono ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              بابەتی {toKurdishDigits(currentIndex + 1)} لە {toKurdishDigits(totalFacts)}
            </span>
          </div>
        </div>

        {/* Next Button (دواتر) */}
        <button
          type="button"
          onClick={handleNext}
          disabled={isTransitioning}
          className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-heading font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 transition-all cursor-pointer active:scale-95 shadow-md disabled:opacity-50"
          title="بابەتی دواتر (Right Arrow)"
        >
          <span>دواتر</span>
          <ChevronLeft className="w-4 h-4 text-slate-950" />
        </button>
      </footer>

      {/* Full-Screen Image Lightbox Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[1300] flex flex-col items-center justify-between p-3 sm:p-5 bg-black/95 backdrop-blur-xl animate-fade-in text-white select-none"
          onClick={() => setPreviewImage(null)}
          dir="rtl"
        >
          {/* Top Bar */}
          <div
            className="w-full max-w-4xl flex items-center justify-between py-2.5 px-3 rounded-2xl bg-white/[0.06] border border-white/10 z-10 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <div>
                <h3 className="font-heading font-black text-sm sm:text-base text-amber-300">
                  {previewImage.title}
                </h3>
                {previewImage.year && (
                  <span className="text-[11px] text-slate-400 font-mono">{previewImage.year}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={previewImage.url}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-xs font-bold transition-all flex items-center gap-1.5 text-slate-200 hover:text-white"
                title="کردنەوەی وێنەکە لە پەڕەی نوێ"
              >
                <span>کردنەوەی بەستەری وێنە</span>
              </a>

              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all cursor-pointer"
                title="داخستن (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Center Image Container */}
          <div
            className="relative flex-1 w-full max-w-4xl flex items-center justify-center p-2 sm:p-4 min-h-0 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImage.url}
              alt={previewImage.title}
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-[0_20px_70px_rgba(0,0,0,0.9)] drop-shadow-2xl transition-transform duration-300"
            />
          </div>

          {/* Footer Navigation Note */}
          <div className="text-[11px] text-slate-400 pb-1 shrink-0">
            <span>کلیک لە دەرەوە بکە یان دوگمەی Esc دابگرە بۆ گەڕانەوە</span>
          </div>
        </div>
      )}
    </div>
  );
};
