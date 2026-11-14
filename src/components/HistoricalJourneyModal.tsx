import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  Compass,
  BookOpen,
  Landmark,
  ZoomIn,
  Filter,
  ChevronDown,
  Check,
  ImagePlus,
} from 'lucide-react';
import { SubmitPhotoModal } from './SubmitPhotoModal';
import { FactItem, RAW_FACTS_DATA } from '../data/kurdishHistoryData';
import { getFactDisplayImage } from '../utils/historicalImages';
import { getOptimizedImageUrl } from '../utils/imageUtils';
import { formatDigits } from '../utils/yearUtils';
import { useTheme } from '../context/ThemeContext';
import { useLanguage, AppLanguage } from '../context/LanguageContext';
import { getCategoryInfo, getUnifiedCategories } from '../types/history';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  facts: FactItem[];
  onFlyToFact?: (fact: FactItem) => void;
  onOpenDetail?: (fact: FactItem) => void;
  onOpenHero?: () => void;
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

// Curated authentic English historical narratives
const CURATED_HISTORICAL_SUMMARIES_EN: Record<string, string> = {
  gutian: 'The Gutians were among the earliest indigenous peoples of the Zagros Mountains in the 3rd millennium BCE. In the 22nd century BCE they toppled the Akkadian Empire in Mesopotamia and ruled the region for nearly a century with Arrapha (historic Kirkuk) as a key highland center.',
  kassite: 'A powerful Zagros highland people who emerged from the Arrapha and central Zagros region in the 16th century BCE, establishing a stable dynasty in Babylonia for over four centuries renowned for bronze craftsmanship, monumental architecture, and horsemanship.',
  subartu: 'One of the oldest recorded civilizational regions of Upper Mesopotamia and the Zagros foothills. Named in Sumerian and Akkadian cuneiform tablets as the northern highland homeland of indigenous ancestors of the Kurdish peoples.',
  hurrian: 'Inhabiting northern and western Kurdistan during the 3rd and 2nd millennia BCE, the Hurrians forged an influential linguistic and cultural legacy foundational to the ethnogenesis and highland heritage of the Kurdish people.',
  lullubi: 'Centered around Shahrizor, Garmian, and Sarpol-e Zahab, the Lullubi civilization left behind the iconic Anubanini rock relief—one of the oldest monumental carvings in the Near East.',
  mitanni: 'A formidable Hurrian-Indo-Iranian empire from the 15th to 13th centuries BCE ruled from Washukanni in western Kurdistan, rivaling New Kingdom Egypt in diplomacy and chariot warfare.',
  urartu: 'A grand highland kingdom centered on Lake Van in northern Kurdistan, famed for stone fortresses, metallurgy, and advanced irrigation canals that rivaled Assyria for centuries.',
  nairi: 'A resilient confederation of Zagros and Lake Van highland tribes celebrated in ancient annals for their fierce defense against Assyrian imperial campaigns.',
  mannaea: 'Flourishing south of Lake Urmia (Saqqez, Bukan, Mahabad) between the 9th and 6th centuries BCE, leaving masterpieces of goldsmithing and architecture at Ziwiye and Hasanlu.',
  median: 'Founded around 700 BCE at Ecbatana (Hamadan) through the confederation of six tribes, the Median Empire allied with Babylon to capture Nineveh in 612 BCE and shaped the foundational historical identity of Kurdistan.',
  corduene: 'An autonomous mountain kingdom south of Lake Van and the Upper Tigris; Xenophon’s Anabasis vividly describes the courageous resistance of the Carduchians in the 4th century BCE.',
  adiabene: 'An ancient kingdom centered at the Citadel of Erbil in the 1st century CE, prominent across Upper Mesopotamia for trade, diplomacy, and civic heritage.',
  hasanwayhid: 'An independent 10th-century Kurdish dynasty ruled from Sarmaj Castle across Kermanshah, Hamadan, and Luristan, noted for its coinage, stability, and public works.',
  marwanid: 'A prosperous 10th–11th century Kurdish dynasty centered in Diyarbekir, Mayyafariqin (Silvan), and Jazira that built the iconic Ten-Arched Bridge and fostered flourishing scholarship.',
  shaddadid: 'A medieval Kurdish dynasty governing Arran, Ganja, and Ani (10th–12th centuries CE), renowned for disciplined armies, stone citadels, and the famed Gates of Ganja.',
  ayyubid: 'Founded by Saladin (Salah al-Din al-Ayyubi), uniting Kurdistan, Syria, Egypt, and Hejaz while earning universal acclaim for chivalry and statecraft after the Battle of Hattin (1187 CE).',
  ardalan: 'Centered in Sanandaj (Sina), the Principality of Ardalan safeguarded Kurdish political autonomy, classical Gorani literature, and regional historiography for more than six centuries.',
  baban: 'Seated first at Qalachwalan and from 1784 in newly founded Sulaymaniyah, the Baban Emirate sparked a golden renaissance of classical Sorani literature, architecture, and civic reform.',
  soran: 'Centered in Rawanduz, reaching its zenith under Mir Muhammad Pasha who organized a regular army, minted independent currency, and cast domestic artillery cannons.',
  badinan: 'Based atop the dramatic cliff citadel of Amadiya, preserving nearly five centuries of regional self-rule, fortification, and scholarly madrasas across Bahdinan.',
  bohtan: 'Ruled from Jazira (Cizre), birthplace of Ehmede Khani’s epic Mem u Zin and the 19th-century movement of Bedir Khan Beg in northern Kurdistan.',
  elam: 'One of the ancient world’s earliest highland civilizations in the southern Zagros and Ilam, creator of Chogha Zanbil and deep cultural traditions.',
  mahabad: 'Established in 1946 under President Qazi Muhammad as the modern democratic Republic of Kurdistan, complete with national flag, anthem, army, and Kurdish education.',
  september: 'Launched in September 1961 under Mustafa Barzani, becoming the largest nationwide liberation movement in Southern Kurdistan and securing the March 11 Autonomy Accord.',
};

function getFactSummaryDisplay(fact: FactItem, isEn: boolean): string {
  if (!fact) return '';
  const nameTrim = fact.name || '';

  if (isEn) {
    // 1. Prefer fact.fullText when already in English/meaningful prose
    if (fact.fullText && fact.fullText.trim().length > 35) {
      return fact.fullText.trim();
    }
    // 2. Check English curated summaries by keyword
    const lowerName = nameTrim.toLowerCase();
    for (const [key, summary] of Object.entries(CURATED_HISTORICAL_SUMMARIES_EN)) {
      if (lowerName.includes(key)) {
        return summary;
      }
    }
    // 3. Check fact.desc if substantial
    if (fact.desc && fact.desc.trim().length > 25) {
      return fact.desc.trim();
    }
    // 4. Clean English fallback
    const era = fact.eraName || 'Ancient & Medieval History';
    const reg = fact.region || 'Kurdistan';
    return `${nameTrim} is documented in historical archives as an important milestone within ${era} across ${reg}, playing a lasting role in the cultural and political heritage of the region.`;
  }

  // Kurdish Sorani display
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

function getFactYearDisplay(fact: FactItem, language: AppLanguage, isEn: boolean): string {
  if (!fact) return '';
  if (fact.year) {
    const formatted = formatDigits(fact.year, language);
    if (isEn) {
      if (/\b(BCE|CE|BC|AD)\b/i.test(formatted)) return formatted;
      const isBc = fact.isBC || (typeof fact.startYear === 'number' && fact.startYear < 0);
      return isBc ? `${formatted} BCE` : `${formatted} CE`;
    }
    const isBc = fact.isBC || (typeof fact.startYear === 'number' && fact.startYear < 0);
    return isBc ? `${formatted} پ.ز` : `${formatted} زایینی`;
  }
  if (fact.century) return formatDigits(fact.century, language);
  if (fact.eraName) return fact.eraName;
  return isEn ? 'Historical Era' : 'سەردەمی مێژوویی';
}

function getFactLocationDisplay(fact: FactItem, isEn: boolean): string {
  if (!fact) return isEn ? 'Kurdistan' : 'کوردستان';
  if (
    fact.desc &&
    fact.desc.length <= 45 &&
    (isEn ||
      fact.desc.includes('پایتەخت') ||
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
  return isEn ? 'Kurdistan · Zagros Mountains' : 'کوردستان · چیاکانی زاگرۆس';
}

export const HistoricalJourneyModal: React.FC<Props> = ({
  isOpen,
  onClose,
  facts,
  onFlyToFact,
  onOpenDetail,
  onOpenHero,
}) => {
  const { colorMode } = useTheme();
  const { language, isEn, dir } = useLanguage();
  const isDark = colorMode === 'dark';

  const PrevIcon = isEn ? ChevronLeft : ChevronRight;
  const NextIcon = isEn ? ChevronRight : ChevronLeft;

  // Category Filter State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState<boolean>(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string; year?: string } | null>(null);
  const [factToSubmitPhoto, setFactToSubmitPhoto] = useState<FactItem | null>(null);

  const categories = useMemo(() => getUnifiedCategories(language), [language]);

  // Close category dropdown when clicking outside
  useEffect(() => {
    if (!isCategoryDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCategoryDropdownOpen]);

  // Helper: ONLY returns authentic recorded images
  const getAuthenticFactImage = useCallback(
    (f: FactItem | null | undefined): string => {
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
    },
    [failedImages]
  );

  // Category counts across all facts
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = { all: 0 };
    if (Array.isArray(facts)) {
      facts.forEach((f) => {
        if (!f || !f.name) return;
        map.all = (map.all || 0) + 1;
        const cat = getCategoryInfo(f, language).id;
        map[cat] = (map[cat] || 0) + 1;
      });
    }
    return map;
  }, [facts, language]);

  // Current category details
  const currentCategoryObj = useMemo(() => {
    return (
      categories.find((c) => c.id === selectedCategory) || {
        id: 'all',
        name: isEn ? 'All Categories' : 'هەموو پۆلێنەکان',
        color: '#f59e0b',
      }
    );
  }, [categories, selectedCategory, isEn]);

  // Filter valid facts for historical journey by selected category
  const allJourneyFacts: FactItem[] = useMemo(() => {
    if (!facts || !Array.isArray(facts)) return [];
    const valid = facts.filter((f) => f && f.name && f.name.trim().length > 0);
    if (selectedCategory === 'all') return valid;
    return valid.filter((f) => {
      const cat = getCategoryInfo(f, language);
      return cat.id === selectedCategory || f.category === selectedCategory || f.tag === selectedCategory;
    });
  }, [facts, selectedCategory, language]);

  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    setCurrentIndex(0);
    setIsCategoryDropdownOpen(false);
  };

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

  // Preload pipeline
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
        imgObj.decoding = 'async';
        imgObj.src = resolved;
      }
    }
    for (const prevOffset of [1, 2]) {
      const prevItem = allJourneyFacts[(currentIndex - prevOffset + totalFacts) % totalFacts];
      const prevImg = getAuthenticFactImage(prevItem);
      if (prevImg && !preloadedMapRef.current.has(prevImg)) {
        preloadedMapRef.current.add(prevImg);
        const resolvedPrev = getOptimizedImageUrl(prevImg, 'full');
        const imgObjPrev = new Image();
        imgObjPrev.decoding = 'async';
        imgObjPrev.src = resolvedPrev;
      }
    }
  }, [isOpen, currentIndex, totalFacts, allJourneyFacts, getAuthenticFactImage]);

  // Navigation: Next
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
    }, 280);
  }, [totalFacts, isTransitioning, allJourneyFacts, currentIndex]);

  // Navigation: Prev
  const handlePrev = useCallback(() => {
    if (totalFacts <= 1 || isTransitioning) return;
    setIsTransitioning(true);
    setFallingCard(null);
    setIsRisingUp(true);
    setCurrentIndex((prev) => (prev - 1 + totalFacts) % totalFacts);

    setTimeout(() => {
      setIsRisingUp(false);
      setIsTransitioning(false);
    }, 280);
  }, [totalFacts, isTransitioning]);

  // Keyboard navigation respecting RTL vs LTR
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previewImage) {
          setPreviewImage(null);
        } else {
          onClose();
        }
      } else if (!previewImage && e.key === 'ArrowDown') {
        handleNext();
      } else if (!previewImage && e.key === 'ArrowUp') {
        handlePrev();
      } else if (!previewImage && e.key === 'ArrowRight') {
        if (isEn) handleNext();
        else handlePrev();
      } else if (!previewImage && e.key === 'ArrowLeft') {
        if (isEn) handlePrev();
        else handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose, previewImage, isEn]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    const deltaY = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX < 0) {
        if (isEn) handleNext();
        else handlePrev();
      } else {
        if (isEn) handlePrev();
        else handleNext();
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

  if (!isOpen) return null;

  if (totalFacts === 0) {
    return (
      <div
        dir={dir}
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
          <h3 className="font-heading font-bold text-base mb-1">
            {selectedCategory !== 'all'
              ? isEn
                ? 'No entries in this category'
                : 'هیچ بابەتێک لەم پۆلێنەدا نییە'
              : isEn
              ? 'No historical entries available'
              : 'هیچ بابەتێکی مێژوویی بەردەست نییە'}
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            {selectedCategory !== 'all'
              ? isEn
                ? `No records were found under "${currentCategoryObj.name}".`
                : `لە پۆلێنی «${currentCategoryObj.name}» هیچ تۆمارێک نەدۆزرایەوە.`
              : isEn
              ? 'Please add historical entries first or wait for archive records to load.'
              : 'تکایە سەرەتا بابەتەکان داخڵ بکە یان دڵنیابەرەوە لە هێنانەوەی تۆمارەکان.'}
          </p>
          <div className="flex items-center justify-center gap-2">
            {selectedCategory !== 'all' && (
              <button
                type="button"
                onClick={() => handleSelectCategory('all')}
                className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs cursor-pointer hover:bg-amber-400 transition-colors shadow-md"
              >
                {isEn ? 'All Categories' : 'هەموو پۆلێنەکان'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-xs cursor-pointer hover:bg-white/20 transition-colors"
            >
              {isEn ? 'Close' : 'داخستن'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="historical-journey-modal"
      className={`fixed inset-0 z-[1200] flex flex-col justify-between p-2 sm:p-3 md:p-5 select-none overflow-hidden animate-fade-in ${
        isDark ? 'bg-[#06080e]/98 text-white' : 'bg-[#f8fafc]/98 text-slate-900'
      }`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      dir={dir}
    >
      {/* 3D Sketchbook Flip Animation CSS Styles (GPU Composite Accelerated) */}
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

        /* 3D Hardware Accelerated Stage */
        .journey-3d-stage {
          perspective: 1200px;
          -webkit-perspective: 1200px;
          transform-style: preserve-3d;
          -webkit-transform-style: preserve-3d;
        }

        .journey-card-hardware {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          will-change: transform, opacity;
        }

        @keyframes sketchbookFallDown {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate3d(0, 32px, 0) scale(0.96);
            opacity: 0;
          }
        }

        @keyframes sketchbookRiseUp {
          0% {
            transform: translate3d(0, 32px, 0) scale(0.96);
            opacity: 0;
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 1;
          }
        }

        .anim-sketchbook-fall-down {
          animation: sketchbookFallDown 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          pointer-events: none;
          will-change: transform, opacity;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        .anim-sketchbook-rise-up {
          animation: sketchbookRiseUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          will-change: transform, opacity;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
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
          <button
            type="button"
            onClick={onOpenHero}
            className="rounded-xl p-0.5 cursor-pointer hover:scale-105 active:scale-95 transition-transform shrink-0"
            title={isEn ? 'Back to Home Page' : 'گەڕانەوە بۆ پەڕەی سەرەکی'}
          >
            <img
              src="/kimlogo.png"
              alt="KURDISTAN INFO MAP Logo"
              className="w-8 h-8 rounded-xl object-contain drop-shadow-sm select-none"
            />
          </button>
          <div>
            <h2 className="font-heading font-black text-sm sm:text-lg flex items-center gap-2">
              <span>{isEn ? 'Historical Journey' : 'گەشتی مێژوویی'}</span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Category Filter Button with Dropdown */}
          <div className="relative" ref={categoryDropdownRef}>
            <button
              type="button"
              onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 py-1.5 px-2.5 sm:px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs ${
                selectedCategory !== 'all'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-sm'
                  : isDark
                  ? 'bg-white/[0.06] border-white/10 text-slate-200 hover:text-white hover:bg-white/[0.12] hover:border-white/20'
                  : 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200 hover:border-slate-300'
              }`}
              title={isEn ? 'Filter journey entries by category' : 'پۆلێنکردنی بابەتەکانی گەشت'}
            >
              <Filter className="w-3.5 h-3.5 text-amber-500" />
              <span className="max-w-[110px] sm:max-w-[150px] truncate">
                {currentCategoryObj.name}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isCategoryDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Category Dropdown Menu */}
            {isCategoryDropdownOpen && (
              <div
                className={`absolute top-full mt-1.5 end-0 z-50 w-64 sm:w-72 max-h-80 overflow-y-auto rounded-2xl border p-1.5 shadow-2xl backdrop-blur-xl animate-fade-in ${
                  isDark
                    ? 'bg-[#0f1422]/98 border-white/15 text-white shadow-black/80'
                    : 'bg-white/98 border-slate-200 text-slate-900 shadow-slate-400/30'
                }`}
              >
                <div className="px-2.5 py-1.5 text-[11px] font-bold text-slate-400 border-b border-white/10 mb-1 flex items-center justify-between">
                  <span>{isEn ? 'Categories:' : 'پۆلێنی بابەتەکان:'}</span>
                  {selectedCategory !== 'all' && (
                    <button
                      type="button"
                      onClick={() => handleSelectCategory('all')}
                      className="text-amber-500 hover:underline cursor-pointer text-[10px] font-bold"
                    >
                      {isEn ? 'All Categories' : 'هەموو پۆلێنەکان'}
                    </button>
                  )}
                </div>

                <div className="space-y-0.5">
                  {categories.map((cat) => {
                    const count = categoryCounts[cat.id] || 0;
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelectCategory(cat.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-all text-start cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                            : isDark
                            ? 'hover:bg-white/[0.08] text-slate-200'
                            : 'hover:bg-slate-100 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: isSelected ? '#000' : cat.color || '#f59e0b' }}
                          />
                          <span className="truncate">{cat.name}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                              isSelected
                                ? 'bg-black/20 text-slate-950 font-black'
                                : isDark
                                ? 'bg-white/10 text-slate-400'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {formatDigits(count, language)}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Progress Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold shadow-xs ${
              isDark
                ? 'bg-white/[0.05] border-white/10 text-slate-300'
                : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <span className="text-amber-500 font-extrabold">{formatDigits(currentIndex + 1, language)}</span>
            <span className="opacity-40">/</span>
            <span>{formatDigits(totalFacts, language)}</span>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className={`flex items-center gap-1.5 py-1.5 px-2.5 sm:px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs ${
              isDark
                ? 'bg-white/[0.06] border-white/10 text-slate-300 hover:text-white hover:bg-white/[0.15] hover:border-white/20'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200 hover:border-slate-300'
            }`}
            title={isEn ? 'Close (Esc)' : 'داخستن (Esc)'}
            aria-label={isEn ? 'Close' : 'داخستن'}
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">{isEn ? 'Close' : 'داخستن'}</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          CENTER 3D STAGE
          ========================================================================= */}
      <main className="relative flex-1 w-full max-w-4xl mx-auto flex items-center justify-center my-1 sm:my-2 min-h-0 journey-3d-stage">
        <div className="relative w-full h-[560px] sm:h-[620px] max-h-[76dvh] flex items-center justify-center touch-pan-y">
          {/* Floating Prev Button */}
          <button
            type="button"
            onClick={handlePrev}
            disabled={isTransitioning}
            className={`hidden md:flex absolute -start-3 lg:-start-8 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-[4px] items-center justify-center border shadow-2xl transition-all cursor-pointer active:scale-90 disabled:opacity-40 group ${
              isDark
                ? 'bg-[#0b0f1c] border-amber-500/30 text-amber-400 hover:border-amber-400 hover:bg-[#121829]'
                : 'bg-white border-amber-500/30 text-amber-600 hover:border-amber-500 hover:bg-amber-50/50'
            }`}
            title={isEn ? 'Previous Entry' : 'بابەتی پێشوو'}
            aria-label={isEn ? 'Previous Entry' : 'بابەتی پێشوو'}
          >
            <PrevIcon className="w-5 h-5 text-amber-500 transition-transform" />
          </button>

          {/* Floating Next Button */}
          <button
            type="button"
            onClick={handleNext}
            disabled={isTransitioning}
            className={`hidden md:flex absolute -end-3 lg:-end-8 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-[4px] items-center justify-center border shadow-2xl transition-all cursor-pointer active:scale-90 disabled:opacity-40 group ${
              isDark
                ? 'bg-[#0b0f1c] border-amber-500/30 text-amber-400 hover:border-amber-400 hover:bg-[#121829]'
                : 'bg-white border-amber-500/30 text-amber-600 hover:border-amber-500 hover:bg-amber-50/50'
            }`}
            title={isEn ? 'Next Entry' : 'بابەتی دواتر'}
            aria-label={isEn ? 'Next Entry' : 'بابەتی دواتر'}
          >
            <NextIcon className="w-5 h-5 text-amber-500 transition-transform" />
          </button>

          {(() => {
            const factItem = allJourneyFacts[currentIndex];
            if (!factItem) return null;

            const imgUrl = getAuthenticFactImage(factItem);
            const optimizedImg = imgUrl ? getOptimizedImageUrl(imgUrl, 'full') : '';
            const catInfo = getCategoryInfo(factItem, language);

            return (
              <article
                key={`active-card-${factItem.id}`}
                className={`relative w-full max-w-sm sm:max-w-md md:max-w-lg h-full rounded-[4px] overflow-hidden flex flex-col border select-none journey-card-hardware ${
                  isRisingUp ? 'anim-sketchbook-rise-up' : ''
                } ${
                  isDark
                    ? 'bg-[#0b0f1c] border-amber-500/30 border-t-amber-400/50 shadow-[0_16px_40px_rgba(0,0,0,0.85)]'
                    : 'bg-white border-amber-500/30 border-t-amber-400/60 shadow-[0_16px_36px_-6px_rgba(0,0,0,0.15)]'
                }`}
              >
                {/* 1. TOP PART: AUTHENTIC IMAGE */}
                {optimizedImg ? (
                  <div className="relative w-full h-48 sm:h-56 md:h-72 shrink-0 overflow-hidden bg-black/85 flex items-center justify-center group">
                    <img
                      src={optimizedImg}
                      alt=""
                      aria-hidden="true"
                      loading="eager"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover blur-md opacity-30 select-none pointer-events-none"
                    />

                    <img
                      src={optimizedImg}
                      alt={factItem.name}
                      loading="eager"
                      decoding="async"
                      onError={() => {
                        setFailedImages((prev) => new Set(prev).add(factItem.id));
                      }}
                      className="relative z-10 w-full h-full object-contain p-1.5 sm:p-2.5 drop-shadow-md select-none cursor-pointer"
                      onClick={() => {
                        setPreviewImage({
                          url: optimizedImg,
                          title: factItem.name,
                          year: getFactYearDisplay(factItem, language, isEn),
                        });
                      }}
                      title={
                        isEn
                          ? 'Click to view full-size image'
                          : 'کلیک بکە بۆ بینینی تەواوی وێنەکە بە قەبارەی گەورە'
                      }
                    />

                    <div
                      className={`absolute inset-0 z-10 pointer-events-none bg-gradient-to-t ${
                        isDark
                          ? 'from-[#0d121f] via-transparent to-black/35'
                          : 'from-white via-transparent to-black/30'
                      }`}
                    />

                    {/* Fullscreen Zoom Lightbox Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewImage({
                          url: optimizedImg,
                          title: factItem.name,
                          year: getFactYearDisplay(factItem, language, isEn),
                        });
                      }}
                      className="absolute bottom-3 end-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/65 hover:bg-black/85 backdrop-blur-md border border-white/20 text-slate-200 hover:text-white shadow-lg transition-all active:scale-90 cursor-pointer"
                      title={isEn ? 'Expand Fullscreen' : 'کردنەوەی وێنە بە قەبارەی تەواوی شاشە'}
                    >
                      <ZoomIn className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[10px] font-bold hidden sm:inline">
                        {isEn ? 'Expand' : 'گەورەکردن'}
                      </span>
                    </button>
                  </div>
                ) : (
                  <div
                    className={`relative w-full h-36 sm:h-44 shrink-0 overflow-hidden flex flex-col items-center justify-center p-3 border-b text-center gap-2 ${
                      isDark
                        ? 'bg-gradient-to-br from-amber-950/20 via-[#101726] to-[#0a0f1d] border-white/10'
                        : 'bg-gradient-to-br from-amber-50/70 via-slate-50 to-white border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center gap-1.5 z-10">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center border shadow-inner"
                        style={{
                          backgroundColor: isDark ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.12)',
                          borderColor: `${catInfo.color || '#f59e0b'}40`,
                        }}
                      >
                        <Landmark
                          className="w-5 h-5"
                          style={{ color: catInfo.color || '#f59e0b' }}
                        />
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {isEn
                          ? 'No official archival photo added for this entry yet'
                          : 'ئەم بابەتە هێشتا وێنەی فەرمی بۆ دانەنراوە'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFactToSubmitPhoto(factItem);
                      }}
                      className="z-10 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer active:scale-95"
                      title={
                        isEn
                          ? 'Contribute an archival photo URL for Kurdistan Info Map'
                          : 'یارمەتی -kurdistan info map- بدە بۆ ناردنی لینکی وێنە'
                      }
                    >
                      <ImagePlus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>
                        {isEn
                          ? 'Contribute Archival Photo URL'
                          : '(یارمەتی -kurdistan info map- بدە بۆ ناردنی لینکی وێنە)'}
                      </span>
                    </button>
                  </div>
                )}

                {/* 2. BOTTOM PART: TITLE, YEAR/LOCATION, AND RICH FULL SUMMARY */}
                <div className="relative flex-1 min-h-0 flex flex-col justify-between p-4 sm:p-5 text-start">
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
                        <span>{getFactYearDisplay(factItem, language, isEn)}</span>
                      </span>

                      <span className="opacity-30">•</span>

                      <span
                        className={`flex items-center gap-1 truncate max-w-[200px] sm:max-w-[280px] ${
                          isDark ? 'text-slate-300' : 'text-slate-600'
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">{getFactLocationDisplay(factItem, isEn)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Narrative Body */}
                  <div className="flex-1 min-h-0 overflow-y-auto journey-card-scrollbar pe-1 my-1">
                    <p
                      className={`text-xs sm:text-sm md:text-[15px] font-normal leading-relaxed text-justify ${
                        isDark ? 'text-slate-200' : 'text-slate-700'
                      }`}
                    >
                      {getFactSummaryDisplay(factItem, isEn)}
                    </p>
                  </div>

                  {/* Actions on Active Card */}
                  <div
                    className={`pt-3 mt-2 border-t flex items-center gap-2.5 shrink-0 ${
                      isDark ? 'border-white/10' : 'border-slate-200'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onFlyToFact) onFlyToFact(factItem);
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-bold border transition-all cursor-pointer active:scale-95 shadow-xs ${
                        isDark
                          ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/25 text-amber-300 hover:text-amber-200 hover:border-amber-500/40'
                          : 'bg-amber-50/80 hover:bg-amber-100/90 border-amber-200/80 text-amber-900 shadow-xs'
                      }`}
                      title={isEn ? 'Locate this entry on the Kurdistan map' : 'بینینی ئەم خاڵە لەسەر نەخشەی کوردستان'}
                    >
                      <Compass className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>{isEn ? 'On Map' : 'لەسەر نەخشە'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenDetail) onOpenDetail(factItem);
                      }}
                      className="flex-[1.2] flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-slate-950 transition-all cursor-pointer active:scale-95 shadow-[0_4px_16px_rgba(245,158,11,0.3)] hover:shadow-[0_6px_22px_rgba(245,158,11,0.45)]"
                      title={
                        isEn
                          ? 'Open full historical article, archives, and connections'
                          : 'کردنەوەی تەواوی سەرچاوە، بەستراوەکان و وردەکاریی مێژوویی'
                      }
                    >
                      <BookOpen className="w-4 h-4 text-slate-950 shrink-0" />
                      <span>{isEn ? 'More Details' : 'وردەکاریی زیاتر'}</span>
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
                transformOrigin: '50% 100%',
              }}
              className={`absolute inset-0 m-auto w-full max-w-sm sm:max-w-md md:max-w-lg h-full rounded-3xl overflow-hidden flex flex-col border select-none journey-card-hardware anim-sketchbook-fall-down ${
                isDark
                  ? 'bg-[#0d121f] border-white/20 shadow-[0_16px_40px_rgba(0,0,0,0.85)]'
                  : 'bg-white border-slate-200 shadow-[0_16px_36px_-6px_rgba(0,0,0,0.15)]'
              }`}
            >
              {(() => {
                const fallingImg = getAuthenticFactImage(fallingCard);
                const optimizedFallingImg = fallingImg ? getOptimizedImageUrl(fallingImg, 'full') : '';
                return optimizedFallingImg ? (
                  <div className="relative w-full h-48 sm:h-56 md:h-72 shrink-0 overflow-hidden bg-black/85 flex items-center justify-center">
                    <img
                      src={optimizedFallingImg}
                      alt=""
                      aria-hidden="true"
                      loading="eager"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover blur-md opacity-30 select-none pointer-events-none"
                    />
                    <img
                      src={optimizedFallingImg}
                      alt={fallingCard.name}
                      loading="eager"
                      decoding="async"
                      className="relative z-10 w-full h-full select-none object-contain p-1.5 sm:p-2.5 drop-shadow-md"
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
                    className={`relative w-full h-36 sm:h-44 shrink-0 overflow-hidden flex items-center justify-center p-3 border-b ${
                      isDark
                        ? 'bg-gradient-to-br from-amber-950/20 via-[#101726] to-[#0a0f1d] border-white/10'
                        : 'bg-gradient-to-br from-amber-50/70 via-slate-50 to-white border-slate-200'
                    }`}
                  >
                    <Landmark className="w-8 h-8 text-amber-500/70" />
                  </div>
                );
              })()}

              <div className="relative flex-1 min-h-0 flex flex-col justify-between p-4 sm:p-5 text-start">
                <div className="shrink-0 mb-1.5">
                  <h3
                    className={`font-heading font-black text-lg sm:text-xl md:text-2xl tracking-tight leading-snug line-clamp-2 ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {fallingCard.name}
                  </h3>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5 text-xs sm:text-sm font-semibold">
                    <span className="flex items-center gap-1 text-amber-500 font-mono">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{getFactYearDisplay(fallingCard, language, isEn)}</span>
                    </span>

                    <span className="opacity-30">•</span>

                    <span
                      className={`flex items-center gap-1 truncate max-w-[200px] sm:max-w-[280px] ${
                        isDark ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">{getFactLocationDisplay(fallingCard, isEn)}</span>
                    </span>
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto journey-card-scrollbar pe-1 my-1">
                  <p
                    className={`text-xs sm:text-sm md:text-[15px] font-normal leading-relaxed text-justify ${
                      isDark ? 'text-slate-200' : 'text-slate-700'
                    }`}
                  >
                    {getFactSummaryDisplay(fallingCard, isEn)}
                  </p>
                </div>

                {/* Symmetrical Action Placeholders */}
                <div
                  className={`pt-3 mt-2 border-t flex items-center gap-2.5 shrink-0 ${
                    isDark ? 'border-white/10' : 'border-slate-200'
                  }`}
                >
                  <div
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-bold border ${
                      isDark
                        ? 'bg-amber-500/10 border-amber-500/25 text-amber-300'
                        : 'bg-amber-50/80 border-amber-200/80 text-amber-900'
                    }`}
                  >
                    <Compass className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{isEn ? 'On Map' : 'لەسەر نەخشە'}</span>
                  </div>

                  <div className="flex-[1.2] flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 shadow-[0_4px_16px_rgba(245,158,11,0.3)]">
                    <BookOpen className="w-4 h-4 text-slate-950 shrink-0" />
                    <span>{isEn ? 'More Details' : 'وردەکاریی زیاتر'}</span>
                  </div>
                </div>
              </div>
            </article>
          )}
        </div>
      </main>

      {/* =========================================================================
          BOTTOM FOOTER
          ========================================================================= */}
      <footer
        className="w-full max-w-lg md:max-w-xl mx-auto flex items-center justify-between gap-2.5 pt-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] shrink-0 transition-colors z-20"
      >
        {/* Previous Button */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={isTransitioning}
          className={`group flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold border transition-all cursor-pointer active:scale-95 disabled:opacity-40 shadow-xs ${
            isDark
              ? 'bg-[#0f1422]/90 hover:bg-[#161d30] border-white/15 text-slate-200 hover:text-white hover:border-amber-500/40'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 hover:border-amber-500/40 shadow-xs'
          }`}
          title={isEn ? 'Previous Entry' : 'بابەتی پێشوو'}
        >
          <PrevIcon className="w-4 h-4 text-amber-500 transition-transform" />
          <span>{isEn ? 'Previous' : 'پێشوو'}</span>
        </button>

        {/* Center Progress Scrub Indicator */}
        <div
          className={`flex-1 flex flex-col items-center justify-center px-3 py-1.5 rounded-2xl border transition-all ${
            isDark
              ? 'bg-[#0c101c]/90 border-white/10 shadow-inner'
              : 'bg-white/90 border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span
              className={`text-[11px] sm:text-xs font-bold font-mono ${
                isDark ? 'text-slate-200' : 'text-slate-700'
              }`}
            >
              {isEn ? (
                <>
                  Entry <span className="text-amber-500 font-extrabold">{formatDigits(currentIndex + 1, language)}</span> of{' '}
                  {formatDigits(totalFacts, language)}
                </>
              ) : (
                <>
                  بابەتی <span className="text-amber-500 font-extrabold">{formatDigits(currentIndex + 1, language)}</span> لە{' '}
                  {formatDigits(totalFacts, language)}
                </>
              )}
            </span>
          </div>

          {/* Timeline progress line */}
          <div className="w-full max-w-[140px] h-1.5 bg-slate-500/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.max(5, ((currentIndex + 1) / totalFacts) * 100))}%`,
              }}
            />
          </div>
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={handleNext}
          disabled={isTransitioning}
          className="group flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-heading font-black bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-slate-950 transition-all cursor-pointer active:scale-95 shadow-[0_4px_16px_rgba(245,158,11,0.35)] hover:shadow-[0_6px_22px_rgba(245,158,11,0.5)] disabled:opacity-40"
          title={isEn ? 'Next Entry' : 'بابەتی دواتر'}
        >
          <span>{isEn ? 'Next' : 'دواتر'}</span>
          <NextIcon className="w-4 h-4 text-slate-950 transition-transform" />
        </button>
      </footer>

      {/* Full-Screen Image Lightbox Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[1300] flex flex-col items-center justify-between p-3 sm:p-5 bg-black/95 backdrop-blur-xl animate-fade-in text-white select-none"
          onClick={() => setPreviewImage(null)}
          dir={dir}
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
                title={isEn ? 'Open image in new tab' : 'کردنەوەی وێنەکە لە پەڕەی نوێ'}
              >
                <span>{isEn ? 'Open Source URL' : 'کردنەوەی بەستەری وێنە'}</span>
              </a>

              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all cursor-pointer"
                title={isEn ? 'Close (Esc)' : 'داخستن (Esc)'}
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
            <span>
              {isEn
                ? 'Click outside or press Esc to return'
                : 'کلیک لە دەرەوە بکە یان دوگمەی Esc دابگرە بۆ گەڕانەوە'}
            </span>
          </div>
        </div>
      )}

      {/* Submit Photo Suggestion Modal for facts without image in Historical Journey */}
      {factToSubmitPhoto && (
        <SubmitPhotoModal
          fact={factToSubmitPhoto}
          isOpen={!!factToSubmitPhoto}
          onClose={() => setFactToSubmitPhoto(null)}
        />
      )}
    </div>
  );
};

