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
  Film,
  Maximize2,
} from 'lucide-react';
import { getFactDisplayImage } from '../utils/historicalImages';
import { getOptimizedImageUrl } from '../utils/imageUtils';
import { useLanguage } from '../context/LanguageContext';
import { formatDigits } from '../utils/yearUtils';

export interface MilestoneStory {
  id: string;
  factId?: number;
  title: string;
  titleEn: string;
  period: string;
  periodEn: string;
  centuryNumber?: number;
  yearNumber?: number;
  isBC?: boolean;
  lat: number;
  lng: number;
  zoom: number;
  headline: string;
  headlineEn: string;
  storyText: string;
  storyTextEn: string;
  significance: string;
  significanceEn: string;
  imageUrl?: string;
  tag: string;
  tagEn: string;
  categoryName: string;
  categoryNameEn: string;
  accentColor: string;
}

// 12 Epoch-defining chapters of Kurdish history
export const DOCUMENTARY_MILESTONES: MilestoneStory[] = [
  {
    id: 'zagros-ancient',
    factId: 1,
    title: 'دەوڵەت و شارستانییەتی گۆتی و لولوبی',
    titleEn: 'Gutian & Lullubi Civilizations',
    period: 'هەزارەی سێیەمی پێش زایین',
    periodEn: '3rd Millennium BCE',
    isBC: true,
    yearNumber: -2200,
    lat: 35.15,
    lng: 45.8,
    zoom: 8,
    headline: 'سەرهەڵدانی یەکەمین پێکهاتە سیاسی و چیاکانی زاگرۆس',
    headlineEn: 'Rise of the Earliest Highland Polities in the Zagros',
    storyText:
      'گۆتی و لولوبییەکان لە دێرینترین خەڵکی ڕەسەنی زاگرۆسن کە لە دەوروبەری هەزارەی ٣ی پێش زایین حکومڕانییەکی بەهێزیان دامەزراند و توانییان بۆ ماوەیەک بەسەر میزۆپۆتامیادا باڵادەست بن و نەخشەی دەسەڵاتی ڕۆژهەڵاتی کۆن بگۆڕن.',
    storyTextEn:
      'The Gutians and Lullubi were among the earliest indigenous peoples of the Zagros Mountains. Around the 3rd millennium BCE they forged formidable highland confederacies, toppling Akkadian hegemony in Mesopotamia and reshaping the political map of the Ancient Near East.',
    significance: 'دەستپێکی مێژووی شارستانی و خەباتی سەربەخۆیی گەلانی زاگرۆس.',
    significanceEn: 'Dawn of recorded highland civilization and Zagros autonomy.',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=900&auto=format&fit=crop&q=80',
    tag: 'شارستانییەتی کۆن',
    tagEn: 'Ancient Civilization',
    categoryName: 'شارستانییەتەکان',
    categoryNameEn: 'Civilizations',
    accentColor: '#d97706',
  },
  {
    id: 'medes-empire',
    factId: 10,
    title: 'ئیمپراتۆرییەتی مەزنی ماد (Medes)',
    titleEn: 'The Median Empire',
    period: '٧٠٠ - ٥٥٠ پێش زایین',
    periodEn: '700 – 550 BCE',
    isBC: true,
    yearNumber: -612,
    lat: 34.79,
    lng: 48.51,
    zoom: 7,
    headline: 'یەکگرتنی نەتەوەیی هۆزەکانی ماد و ڕووخاندنی نەینەوا',
    headlineEn: 'Unification of the Median Tribes & the Fall of Nineveh',
    storyText:
      'دیاکۆ و کەیخوسرەوی پادشای ماد توانییان هۆزە ئاریایی و میدییەکان یەکبخەن و پایتەختێکی بەسام لە هەمەدان (ئەگباتانا) دروستبکەن. لە ساڵی ٦١٢ پێش زایین پایتەختی ئاشوورییەکان (نەینەوا)یان کۆنتڕۆڵ کرد کە لە ئەدەبیاتی کوردیدا بە دەستپێکی ساڵنامەی کوردی دادەنرێت.',
    storyTextEn:
      'Deioces and King Cyaxares united the Median tribes and built the imperial capital at Ecbatana (Hamadan). In 612 BCE, Median forces captured Nineveh—a landmark victory traditionally commemorated as the starting epoch of the Kurdish calendar.',
    significance: 'بناغەی ناسنامەی نەتەوەیی و ڕۆژمێری کوردی (٢٧٢٥ی کوردی).',
    significanceEn: 'Cornerstone of Kurdish historical identity and the Kurdish calendar.',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=80',
    tag: 'ئیمپراتۆرییەت',
    tagEn: 'Empire',
    categoryName: 'ئیمپراتۆرییەتەکان',
    categoryNameEn: 'Empires',
    accentColor: '#f59e0b',
  },
  {
    id: 'corduene-kingdom',
    factId: 25,
    title: 'میرنشینی کۆردوین (Corduene / کاردۆخ)',
    titleEn: 'Kingdom of Corduene (Kardouchia)',
    period: 'سەدەی یەکەمی پێش زایین - سەدەی چوارەمی زایین',
    periodEn: '1st Century BCE – 4th Century CE',
    isBC: false,
    yearNumber: 100,
    lat: 37.58,
    lng: 42.18,
    zoom: 8,
    headline: 'خاکی کوردۆخییەکان لە سەرچاوە مێژووییەکانی یۆنان و ڕۆمادا',
    headlineEn: 'Land of the Carduchi in Classical Greek & Roman Chronicles',
    storyText:
      'کۆردوین لە باشووری دەریاچەی وان و باکووری دیجلە دەسەڵاتێکی سەربەخۆ بوو. زینۆفۆن لە پەڕتووکی "ئاناباسیس"دا ئاماژە بە چاونەترسی و ئازایەتی جەنگاوەرانی کوردۆخی دەدات لە ڕووبەڕووبوونەوەی سوپای دە هەزاری یۆنانییەکاندا.',
    storyTextEn:
      'Lying south of Lake Van along the Upper Tigris, Corduene was an autonomous highland kingdom. Xenophon’s Anabasis famously chronicled the fierce resistance of the Carduchians against the retreat of the Greek Ten Thousand.',
    significance: 'سەلماندنی ناوی کوردی و جوگرافیای چیاکانی لە نەخشە کلاسیکییەکاندا.',
    significanceEn: 'Classical attestation of Kurdish ethnonym and mountain geography.',
    imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=900&auto=format&fit=crop&q=80',
    tag: 'پاشایەتی مێژوویی',
    tagEn: 'Ancient Kingdom',
    categoryName: 'میرنشینەکان',
    categoryNameEn: 'Principalities',
    accentColor: '#eab308',
  },
  {
    id: 'shaddadids',
    factId: 65,
    title: 'میرنشینی شەدادی (Ganja & Ani)',
    titleEn: 'The Shaddadid Dynasty (Ganja & Ani)',
    period: '٩٥١ - ١١٧٤ زایینی',
    periodEn: '951 – 1174 CE',
    isBC: false,
    yearNumber: 970,
    lat: 40.68,
    lng: 46.36,
    zoom: 7,
    headline: 'دەسەڵاتی کورد لە قەوقاز، ئازەربایجان و شاری دێرینی ئانی',
    headlineEn: 'Kurdish Rule in the South Caucasus, Arran, and Medieval Ani',
    storyText:
      'شەدادییەکان بە یەکێک لە شارستانیترین میرنشینە کوردییەکان دادەنرێن کە لە نێوان ڕووباری کور و ئاراس فەرمانڕەواییان کردووە. لە گەنجە و ئانی دەیان قەڵا، پردی زەبەلاح و مزگەوتیان بە تەلارسازیی بەرز بنیادنا کە تا ئەمڕۆش شوێنەوارەکانیان ماوە.',
    storyTextEn:
      'The Shaddadids ruled the lands between the Kura and Aras rivers from capitals in Dvin, Ganja, and Ani. They left behind monumental stone bridges, citadels, and mosques across the Caucasus frontier.',
    significance: 'فراوانبوونی دەسەڵات و تەلارسازیی کوردی بەرەو باکووری ئاراس.',
    significanceEn: 'Northern expansion of Kurdish statecraft and architecture.',
    imageUrl: 'https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?w=900&auto=format&fit=crop&q=80',
    tag: 'میرنشینی ئیسلامی',
    tagEn: 'Medieval Dynasty',
    categoryName: 'میرنشینەکان',
    categoryNameEn: 'Principalities',
    accentColor: '#10b981',
  },
  {
    id: 'marwanids',
    factId: 75,
    title: 'دەوڵەتی مەروانی (Diyarbekir / Mayyafariqin)',
    titleEn: 'The Marwanid Dynasty (Diyarbekir & Mayyafariqin)',
    period: '٩٩٠ - ١٠٨٥ زایینی',
    periodEn: '990 – 1085 CE',
    isBC: false,
    yearNumber: 1020,
    lat: 37.91,
    lng: 40.24,
    zoom: 8,
    headline: 'سەردەمی زێڕینی ئارامی و بوژانەوەی فەرهەنگ لە ئامەد',
    headlineEn: 'A Golden Age of Prosperity & Culture in Amid',
    storyText:
      'نەسرو دەولەی مەروانی حوکمی ئامەد و جزیرەی کرد. لە سایەی دەسەڵاتەکەیدا کتێبخانە گەورەکان دروستکران، ڕێگاکانی بازرگانی پارێزراو بوون و پردی بەناوبانگی دە دەرگا (On Gözlü Köprü) لەسەر دیجلە بنیاتنرا.',
    storyTextEn:
      'Under Nasr al-Dawla Ahmad, the Marwanids governed Diyarbekir, Mayyafariqin (Silvan), and Jazira. Their reign fostered famed libraries, thriving trade routes, and the iconic Ten-Arched Bridge across the Tigris.',
    significance: 'ناوەندی زانست و پێکەوەژیانی ئایینی لە ناوچەی جزیرە.',
    significanceEn: 'Beacon of scholarship, commerce, and civic harmony in Jazira.',
    imageUrl: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=900&auto=format&fit=crop&q=80',
    tag: 'دەوڵەتی کوردی',
    tagEn: 'Kurdish State',
    categoryName: 'میرنشینەکان',
    categoryNameEn: 'Principalities',
    accentColor: '#06b6d4',
  },
  {
    id: 'ayyubids',
    factId: 90,
    title: 'دەوڵەتی ئەییووبی و سەلاحەدین',
    titleEn: 'The Ayyubid Empire & Saladin',
    period: '١١٧١ - ١٢٥٠ زایینی',
    periodEn: '1171 – 1250 CE',
    isBC: false,
    yearNumber: 1187,
    lat: 31.77,
    lng: 35.21,
    zoom: 7,
    headline: 'سەرکەوتنی جەنگی حەتین و ڕزگارکردنی قودس',
    headlineEn: 'Victory at Hattin & the Liberation of Jerusalem',
    storyText:
      'سەلاحەدینی ئەییووبی، سەرکردەی گەورەی کورد، میسر، شام، حیجاز و یەمەنی یەکخست. لە جەنگی حەتین (١١٨٧ز) سەرکەوتنێکی مێژوویی بەسەر خاچپەرستاندا بەدەستهێنا و بە لێبوردەیی و ڕەوشتبەرزییەوە لە هەموو جیهاندا ناوبانگی پەیداکرد.',
    storyTextEn:
      'Born into the Rawadiya Kurdish clan, Saladin unified Egypt, Syria, Upper Mesopotamia, and Hejaz. His decisive victory at the Battle of Hattin (1187 CE) and chivalrous conduct in Jerusalem earned global renown.',
    significance: 'باڵادەستترین دەسەڵاتی کوردی لە مێژووی ڕۆژهەڵاتی ناوەڕاستدا.',
    significanceEn: 'Most expansive dynasty founded by a Kurdish ruler in Near Eastern history.',
    imageUrl: 'https://images.unsplash.com/photo-1579282240050-352db0a14c21?w=900&auto=format&fit=crop&q=80',
    tag: 'دەسەڵاتی مەزن',
    tagEn: 'Great Empire',
    categoryName: 'سەرکردەکان',
    categoryNameEn: 'Leaders',
    accentColor: '#f43f5e',
  },
  {
    id: 'badinan',
    factId: 115,
    title: 'میرنشینی بەهدینان (Amadiya)',
    titleEn: 'Principality of Badinan (Amadiya)',
    period: '١٣٧٦ - ١٨٤٣ زایینی',
    periodEn: '1376 – 1843 CE',
    isBC: false,
    yearNumber: 1550,
    lat: 37.09,
    lng: 43.48,
    zoom: 9,
    headline: 'قەڵای نەبەزی ئامێدی لە دڵی چیاکانی بادینان',
    headlineEn: 'The Unconquered Cliff Citadel of Amadiya',
    storyText:
      'میرنشینی بەهدینان بە پێگەی بەهێزی شاری ئامێدی کە لەسەر لووتکەی تاشەبەردێکی سروشتی بنیادنراوە، بۆ نزیکەی پێنج سەدە پێگەی حوکمڕانی و ناوەندی خوێندنی ئاینی و مێژوویی بوو بە بوونی قوتابخانەی قوبەهان.',
    storyTextEn:
      'Perched atop the steep limestone plateau of Amadiya, the Principality of Badinan defended regional autonomy for nearly five centuries while nurturing centers of learning such as the Qubahan Madrasa.',
    significance: 'پاراستنی سەربەخۆیی ناوخۆیی لە بەرزاییەکانی بادینان.',
    significanceEn: 'Nearly five centuries of highland self-rule in northern Kurdistan.',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&auto=format&fit=crop&q=80',
    tag: 'میرنشینی مێژوویی',
    tagEn: 'Historic Emirate',
    categoryName: 'میرنشینەکان',
    categoryNameEn: 'Principalities',
    accentColor: '#3b82f6',
  },
  {
    id: 'ardalan',
    factId: 130,
    title: 'میرنشینی ئەردەڵان (Sanandaj)',
    titleEn: 'Principality of Ardalan (Sanandaj)',
    period: '١١٦٩ - ١٨٦٧ زایینی',
    periodEn: '1169 – 1867 CE',
    isBC: false,
    yearNumber: 1750,
    lat: 35.31,
    lng: 46.99,
    zoom: 8,
    headline: 'پایتەختی شیعر و شاکارە ئەدەبییەکانی گۆران و سۆرانی',
    headlineEn: 'Patron of Gorani Poetry & Mastura Ardalan’s Chronicles',
    storyText:
      'میرنشینی ئەردەڵان لە ڕۆژهەڵاتی کوردستان بۆ ماوەی ٧٠٠ ساڵ دەسەڵاتی هەبوو. شاری سنە کرا بە پایتەختێکی ڕۆشنبیری و مەستورەی ئەردەڵان یەکەمین ژنە مێژوونووسی ڕۆژهەڵات لەم کۆشک و دەسەڵاتەدا بەرهەمەکانی تۆمارکرد.',
    storyTextEn:
      'Spanning seven centuries across eastern Kurdistan, the Ardalan court in Sina (Sanandaj) elevated classical Gorani poetry and nurtured Mastura Ardalan—celebrated as the Middle East’s pioneering female historian.',
    significance: 'بوژانەوەی زمانی ئەدەبی کوردی و دەرکەوتنی مێژوونووسیی نەتەوەیی.',
    significanceEn: 'Flourishing of Kurdish literary language and historiography.',
    imageUrl: 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=900&auto=format&fit=crop&q=80',
    tag: 'میرنشینی کوردی',
    tagEn: 'Kurdish Emirate',
    categoryName: 'میرنشینەکان',
    categoryNameEn: 'Principalities',
    accentColor: '#a855f7',
  },
  {
    id: 'baban',
    factId: 150,
    title: 'میرنشینی بابان و دروستکردنی سلێمانی',
    titleEn: 'Principality of Baban & Founding of Sulaymaniyah',
    period: '١٦٤٩ - ١٨٥١ زایینی',
    periodEn: '1649 – 1851 CE',
    isBC: false,
    yearNumber: 1784,
    lat: 35.56,
    lng: 45.43,
    zoom: 9,
    headline: 'ئیبراهیم پاشای بابان و دامەزراندنی شاری سلێمانی (١٧٨٤)',
    headlineEn: 'Ibrahim Pasha Baban & the Birth of Sulaymaniyah (1784)',
    storyText:
      'میرنشینی بابان پایتەختی لە قەڵاچوالانەوە گواستەوە بۆ شاری نوێی سلێمانی لە ساڵی ١٧٨٤. سەردەمی بابانییەکان سەردەمی شۆڕشی ئەدەبی بوو بە دەرکەوتنی کلاسیکەکانی نالی، کوردی و سالم کە زاراوەی سۆرانییان کردە شااکاری دەقی کوردی.',
    storyTextEn:
      'Relocating their capital from Qalachwalan to Sulaymaniyah in 1784, the Baban rulers ushered in a literary renaissance led by the classical Sorani poets Nali, Salim, and Kurdi.',
    significance: 'ناوەندی بزووتنەوەی فەرهەنگی و پێشەنگی مۆدێرنیتەی کوردی.',
    significanceEn: 'Heartland of Sorani classical literature and modern cultural revival.',
    imageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=900&auto=format&fit=crop&q=80',
    tag: 'میرنشینی بابان',
    tagEn: 'Baban Emirate',
    categoryName: 'میرنشینەکان',
    categoryNameEn: 'Principalities',
    accentColor: '#eab308',
  },
  {
    id: 'soran',
    factId: 165,
    title: 'میرنشینی سۆران و پاشای گەورە',
    titleEn: 'Emirate of Soran & Mir Muhammad of Rawanduz',
    period: '١٥٣٠ - ١٨٣٨ زایینی',
    periodEn: '1530 – 1838 CE',
    isBC: false,
    yearNumber: 1830,
    lat: 36.61,
    lng: 44.52,
    zoom: 9,
    headline: 'دروستکردنی تۆپ لە ڕەواندز و بەرەنگاربوونەوەی عوسمانییەکان',
    headlineEn: 'The Foundries of Rawanduz & State Modernization',
    storyText:
      'میر محەمەد (پاشای گەورە / پاشای کۆرە) سوپایەکی مۆدێرنی لە ٤٠ هەزار جەنگاوەر پێکەوەنا و بە هاوکاری وەستا ڕەجەب کارگەی تۆپ و دراو و چەکی لە ڕەواندز دروستکرد، و دەسەڵاتەکەی لە زێی گەورەوە تا سنورەکانی ئازەربایجان و موسڵ بڵاوبووەوە.',
    storyTextEn:
      'Mir Muhammad Pasha organized a regular army, minted independent coinage, and commissioned master craftsman Wasta Rajab to cast artillery cannons in Rawanduz, extending Soran authority across much of central Kurdistan.',
    significance: 'یەکەم تاقیکردنەوەی دەوڵەتداری و پیشەسازی سەربازی کوردی لە سەدەی نۆزدەدا.',
    significanceEn: 'Pioneering 19th-century Kurdish military industry and state centralization.',
    imageUrl: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=900&auto=format&fit=crop&q=80',
    tag: 'میرنشینی سۆران',
    tagEn: 'Soran Emirate',
    categoryName: 'میرنشینەکان',
    categoryNameEn: 'Principalities',
    accentColor: '#f97316',
  },
  {
    id: 'mahmud-kingdom',
    factId: 190,
    title: 'مەملەکەتی کوردستان و شێخ مەحموودی حەفید',
    titleEn: 'Kingdom of Kurdistan & Sheikh Mahmud Barzanji',
    period: '١٩١٩ - ١٩٢٤ زایینی',
    periodEn: '1919 – 1924 CE',
    isBC: false,
    yearNumber: 1922,
    lat: 35.55,
    lng: 45.44,
    zoom: 9,
    headline: 'حکومەتی دارولمولک و ڕاگەیاندنی پادشایەتی لە سلێمانی',
    headlineEn: 'Declaration of the Kingdom of Kurdistan in Sulaymaniyah',
    storyText:
      'شێخ مەحموودی حەفید بەرامبەر داگیرکاریی بەریتانیا ڕاوەستا و مەملەکەتی کوردستانی ڕاگەیاند و خۆی وەک حوکمداری کوردستان ناساند. دەوڵەتەکەی خاوەنی کابینەی وەزیران، ڕۆژنامەی فەرمی (بانگی کوردستان) و پول و دراوی تایبەت بە خۆی بوو.',
    storyTextEn:
      'Defying post-WWI mandate partition, Sheikh Mahmud Barzanji proclaimed the Kingdom of Kurdistan in Sulaymaniyah with a cabinet of ministers, postage stamps, and its official newspaper Bangi Kurdistan.',
    significance: 'ڕاگەیاندنی فەرمیی دەوڵەتی کوردستان لە قۆناغی دوای جەنگی یەکەمی جیهانی.',
    significanceEn: 'Post-WWI proclamation of modern Kurdish statehood.',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900&auto=format&fit=crop&q=80',
    tag: 'دەوڵەتی سەردەم',
    tagEn: 'Modern Statehood',
    categoryName: 'سەرکردەکان',
    categoryNameEn: 'Leaders',
    accentColor: '#10b981',
  },
  {
    id: 'mahabad-republic',
    factId: 200,
    title: 'کۆماری دیموکراتی کوردستان (Mahabad Republic)',
    titleEn: 'The Republic of Kurdistan (Mahabad)',
    period: '١٩٤٦ زایینی',
    periodEn: '1946 CE',
    isBC: false,
    yearNumber: 1946,
    lat: 36.76,
    lng: 45.72,
    zoom: 8,
    headline: 'هەڵکردنی ئاڵای کوردستان لە مەیدانی چوارچرا و فەرماندەیی بارزانی',
    headlineEn: 'Raising the Kurdish Flag at Chwar Chira Square',
    storyText:
      'لە ٢ی ڕێبەندانی ١٩٤٦ لە مەیدانی چوارچرای مەهاباد، پێشەوا قازی محەمەد دامەزراندنی کۆماری کوردستانی ڕاگەیاند بە بەشداری ژەنەڕاڵ مستەفا بارزانی وەک فەرماندەی سوپای میللی. لەم کۆمارەدا بۆ یەکەمجار پەروەردەی کوردی کرا بە زامی فەرمی و دەزگای چاپ و گۆڤاری مناڵان دامەزران.',
    storyTextEn:
      'On 22 January 1946 in Mahabad’s Chwar Chira Square, President Qazi Muhammad proclaimed the Republic of Kurdistan alongside General Mustafa Barzani as military commander, establishing Kurdish-language schools, printing presses, and modern civic institutions.',
    significance: 'هێما و لوتکەی سەروەریی نەتەوەیی و یاسایی کوردی لە سەدەی بیستەمدا.',
    significanceEn: 'Landmark symbol of 20th-century Kurdish democratic sovereignty.',
    imageUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=900&auto=format&fit=crop&q=80',
    tag: 'کۆماری کوردستان',
    tagEn: 'Republic of Kurdistan',
    categoryName: 'سەرکردەکان',
    categoryNameEn: 'Leaders',
    accentColor: '#ec4899',
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onFlyToCoords: (lat: number, lng: number, zoom: number, storyTitle: string) => void;
  facts: FactItem[];
  onOpenFactDetail?: (fact: FactItem) => void;
  onOpenHero?: () => void;
}

export const DocumentaryScrollytellingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onFlyToCoords,
  facts,
  onOpenFactDetail,
  onOpenHero,
}) => {
  const { language, isEn, dir } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  const PrevIcon = isEn ? ChevronLeft : ChevronRight;
  const NextIcon = isEn ? ChevronRight : ChevronLeft;

  const activeMilestone = DOCUMENTARY_MILESTONES[currentIndex];
  const mTitle = isEn ? activeMilestone.titleEn : activeMilestone.title;
  const mPeriod = isEn ? activeMilestone.periodEn : activeMilestone.period;
  const mHeadline = isEn ? activeMilestone.headlineEn : activeMilestone.headline;
  const mStory = isEn ? activeMilestone.storyTextEn : activeMilestone.storyText;
  const mSignificance = isEn ? activeMilestone.significanceEn : activeMilestone.significance;
  const mCategory = isEn ? activeMilestone.categoryNameEn : activeMilestone.categoryName;

  // Trigger flyTo whenever current milestone changes
  const navigateToMilestone = useCallback(
    (index: number) => {
      const target = DOCUMENTARY_MILESTONES[index];
      if (!target) return;
      setCurrentIndex(index);
      onFlyToCoords(target.lat, target.lng, target.zoom, isEn ? target.titleEn : target.title);
    },
    [onFlyToCoords, isEn]
  );

  const currentIndexRef = useRef(currentIndex);
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Auto-play slideshow timer (8.5 seconds per milestone)
  useEffect(() => {
    if (!isOpen || !isPlaying) {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
      return;
    }

    playTimerRef.current = setInterval(() => {
      const next = (currentIndexRef.current + 1) % DOCUMENTARY_MILESTONES.length;
      currentIndexRef.current = next;
      setCurrentIndex(next);
      const target = DOCUMENTARY_MILESTONES[next];
      if (target) {
        onFlyToCoords(target.lat, target.lng, target.zoom, isEn ? target.titleEn : target.title);
      }
    }, 8500);

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isOpen, isPlaying, onFlyToCoords, isEn]);

  // Initial trigger when opened
  useEffect(() => {
    if (isOpen) {
      const target = DOCUMENTARY_MILESTONES[0];
      onFlyToCoords(target.lat, target.lng, target.zoom, isEn ? target.titleEn : target.title);
    }
  }, [isOpen, onFlyToCoords, isEn]);

  // Keyboard navigation (Arrow keys respect RTL vs LTR)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        if (isEn) {
          if (currentIndex > 0) navigateToMilestone(currentIndex - 1);
        } else {
          if (currentIndex < DOCUMENTARY_MILESTONES.length - 1) navigateToMilestone(currentIndex + 1);
        }
      } else if (e.key === 'ArrowRight') {
        if (isEn) {
          if (currentIndex < DOCUMENTARY_MILESTONES.length - 1) navigateToMilestone(currentIndex + 1);
        } else {
          if (currentIndex > 0) navigateToMilestone(currentIndex - 1);
        }
      } else if (e.key === 'Escape') {
        if (showLightbox) {
          setShowLightbox(false);
        } else {
          onClose();
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, navigateToMilestone, onClose, isEn, showLightbox]);

  if (!isOpen) return null;

  // Find corresponding fact if available
  const linkedFact = activeMilestone.factId
    ? facts.find((f) => f.id === activeMilestone.factId)
    : undefined;

  return (
    <div
      dir={dir}
      className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-between overflow-hidden"
    >
      {/* Top Floating Header */}
      <div className="pointer-events-auto p-3 sm:p-5 flex items-center justify-between gap-3 animate-fade-in">
        {/* Brand / Mode Indicator */}
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-[4px] bg-[#0b0f1c] border border-amber-500/30 border-t-amber-400/50 shadow-[0_10px_35px_rgba(0,0,0,0.85)]">
          <button
            type="button"
            onClick={onOpenHero}
            className="w-8 h-8 rounded-[4px] bg-white/[0.06] hover:bg-amber-500/20 border border-white/10 hover:border-amber-400/50 p-1 flex items-center justify-center shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-all shrink-0"
            title={isEn ? 'Back to Home Page' : 'گەڕانەوە بۆ پەڕەی سەرەکی'}
          >
            <img
              src="/kimlogo.png"
              alt="KURDISTAN INFO MAP Logo"
              className="w-full h-full object-contain"
            />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-amber-300 font-heading">
                {isEn ? 'Documentary Historical Tour' : 'گەشت بەناو ڕووداوە گەورەکاندا'}
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded-[3px] bg-amber-500/20 text-amber-300 border border-amber-400/30 font-mono">
                {isEn ? '12 Epochs' : 'Documentary Tour'}
              </span>
            </div>
            <div className="text-[10px] text-slate-300 font-mono">
              {isEn ? (
                <>
                  Chapter <span className="text-white font-bold">{formatDigits(currentIndex + 1, language)}</span> of{' '}
                  <span>{formatDigits(DOCUMENTARY_MILESTONES.length, language)}</span>
                </>
              ) : (
                <>
                  وێستگەی <span className="text-white font-bold">{formatDigits(currentIndex + 1, language)}</span> لە{' '}
                  <span>{formatDigits(DOCUMENTARY_MILESTONES.length, language)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Play/Pause & Close Action Group */}
        <div className="flex items-center gap-2">
          {/* Auto-Play Toggle */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3.5 py-2 rounded-[4px] flex items-center gap-2 text-xs font-bold transition-all cursor-pointer shadow-lg ${
              isPlaying
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.6)]'
                : 'bg-[#0b0f1c] hover:bg-[#101626] text-slate-200 hover:text-white border border-amber-500/25 hover:border-amber-400/50'
            }`}
            title={
              isPlaying
                ? isEn
                  ? 'Pause Auto-Play'
                  : 'وەستاندنی گەشتی خودکار'
                : isEn
                ? 'Start Documentary Auto-Play'
                : 'پەخشی خودکاری فیلمی مێژوو'
            }
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-black" />
                <span className="hidden sm:inline">{isEn ? 'Pause' : 'وەستاندن'}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-amber-400" />
                <span className="hidden sm:inline">{isEn ? 'Auto-Play' : 'پەخشی خودکار'}</span>
              </>
            )}
          </button>

          {/* Close Tour Button */}
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-[4px] bg-[#0b0f1c] hover:bg-[#101626] text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-lg border border-amber-500/30 hover:border-amber-400/60"
            title={isEn ? 'Close Tour & Return to Map' : 'داخستنی گەشت و گەڕانەوە بۆ نەخشە'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center Cinematic Scrollytelling Story Card - Large Organized Visual Presentation */}
      <div className="pointer-events-auto max-w-4xl lg:max-w-5xl w-full mx-auto p-3 sm:p-5 mb-2 sm:mb-4 animate-spatial-spring">
        <div
          className="relative rounded-[4px] bg-[#0b0f1c] border border-amber-500/30 border-t-amber-400/50 p-4 sm:p-6 shadow-[0_25px_70px_rgba(0,0,0,0.96)] overflow-hidden text-start"
          style={{
            boxShadow: `0 25px 70px rgba(0,0,0,0.96), 0 0 35px ${activeMilestone.accentColor}25`,
          }}
        >
          {/* Accent Glow Ring */}
          <div
            className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-l from-amber-400 via-red-500 to-emerald-400"
            style={{
              background: `linear-gradient(to left, ${activeMilestone.accentColor}, #f59e0b, #10b981)`,
            }}
          />

          {/* Large Visual Presentation & Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-stretch">
            {/* 1. Large Archival Photo Frame */}
            {(() => {
              const linkedImg = linkedFact ? getFactDisplayImage(linkedFact) : '';
              const milestoneImg = linkedImg || activeMilestone.imageUrl || '';
              return (
                <div
                  className="md:col-span-5 relative w-full h-56 sm:h-64 md:h-72 lg:h-80 rounded-[4px] overflow-hidden border border-amber-500/25 bg-black/85 shadow-2xl group flex items-center justify-center cursor-pointer select-none"
                  onClick={() => {
                    if (milestoneImg) setShowLightbox(true);
                  }}
                  title={isEn ? 'Click to view full-size image' : 'کلیک بکە بۆ بینینی وێنەکە بە سایزی گەورە'}
                >
                  {milestoneImg ? (
                    <>
                      {/* Ambient atmospheric blurred backdrop */}
                      <img
                        src={getOptimizedImageUrl(milestoneImg, 'thumb')}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl opacity-40 select-none pointer-events-none"
                      />
                      {/* Crisp main subject */}
                      <img
                        src={getOptimizedImageUrl(milestoneImg, 'full')}
                        alt={mTitle}
                        loading="lazy"
                        decoding="async"
                        className="relative z-10 max-h-full max-w-full w-auto h-auto object-contain md:object-cover rounded-[3px] transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      {/* Gradient shadow overlay */}
                      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20 pointer-events-none" />

                      {/* Zoom prompt badge */}
                      <div className="absolute bottom-2.5 end-2.5 z-30 px-2.5 py-1 rounded-[3px] bg-black/80 text-amber-300 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1 group-hover:bg-amber-500 group-hover:text-black transition-all">
                        <Maximize2 className="w-3 h-3" />
                        <span>{isEn ? 'Expand' : 'گەورەکردن'}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4 text-center z-10 space-y-2">
                      <div className="w-12 h-12 rounded-[4px] bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                        <Film className="w-6 h-6" />
                      </div>
                      <span className="text-xs text-slate-300 font-bold">{mTitle}</span>
                      <span className="text-[10px] text-amber-300/80 font-mono">
                        {isEn ? 'Archival Plate' : 'وێنەی ئەرشیفی'}
                      </span>
                    </div>
                  )}

                  {/* Overlaid category badge on image */}
                  <div className="absolute top-2.5 start-2.5 z-30 flex items-center gap-1.5 pointer-events-none">
                    <span
                      className="text-[10px] font-bold px-2.5 py-0.5 rounded-[3px] border shadow-sm bg-black/80"
                      style={{
                        color: activeMilestone.accentColor,
                        borderColor: `${activeMilestone.accentColor}70`,
                      }}
                    >
                      {mCategory}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* 2. Structured Narrative & Historical Information */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-3">
              <div className="space-y-2.5">
                {/* Meta Row: Period, Coordinates, Counter */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-300 font-mono font-bold flex items-center gap-1.5 bg-[#101626] px-2.5 py-1 rounded-[3px] border border-amber-500/25">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>{mPeriod}</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-[3px] bg-white/5 border border-white/10 text-slate-300 font-mono">
                      {isEn
                        ? `Stop ${formatDigits(currentIndex + 1, language)} of ${formatDigits(DOCUMENTARY_MILESTONES.length, language)}`
                        : `وێستگەی ${formatDigits(currentIndex + 1, language)} لە ${formatDigits(DOCUMENTARY_MILESTONES.length, language)}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono" dir="ltr">
                    <Compass className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '10s' }} />
                    <span>
                      {activeMilestone.lat.toFixed(1)}°N, {activeMilestone.lng.toFixed(1)}°E
                    </span>
                  </div>
                </div>

                {/* Main Title & Headline */}
                <div className="space-y-1">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-black font-heading text-white tracking-wide leading-tight">
                    {mTitle}
                  </h2>
                  <p className="text-xs sm:text-sm font-bold text-amber-300/95 leading-snug">
                    {mHeadline}
                  </p>
                </div>

                {/* Narrative Story Body */}
                <p className="text-xs sm:text-[13px] text-slate-100 leading-relaxed sm:leading-loose bg-black/50 p-3 sm:p-3.5 rounded-[4px] border border-amber-500/20 shadow-inner max-h-[130px] sm:max-h-[140px] overflow-y-auto">
                  {mStory}
                </p>

                {/* Historical Significance Box */}
                <div className="p-2.5 sm:p-3 rounded-[4px] bg-amber-500/10 border border-amber-400/25 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] sm:text-xs text-amber-200/95 leading-relaxed">
                    <span className="font-bold text-amber-300">
                      {isEn ? 'Historical Significance: ' : 'گرنگیی مێژوویی: '}
                    </span>
                    {mSignificance}
                  </div>
                </div>
              </div>

              {/* Bottom Bar: Navigation Controls & Progress Dots */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-amber-500/20">
                {/* Step Prev & Next */}
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentIndex === 0}
                    onClick={() => navigateToMilestone(currentIndex - 1)}
                    className={`p-2 rounded-[3px] border flex items-center justify-center transition-all cursor-pointer ${
                      currentIndex === 0
                        ? 'opacity-30 border-white/5 cursor-not-allowed bg-black/30'
                        : 'bg-[#101626] border-amber-500/25 hover:border-amber-400/60 text-slate-200 hover:text-white active:scale-95'
                    }`}
                    title={isEn ? 'Previous Chapter' : 'وێستگەی پێشوو'}
                  >
                    <PrevIcon className="w-4 h-4" />
                  </button>

                  <button
                    disabled={currentIndex === DOCUMENTARY_MILESTONES.length - 1}
                    onClick={() => navigateToMilestone(currentIndex + 1)}
                    className={`p-2 rounded-[3px] border flex items-center justify-center transition-all cursor-pointer ${
                      currentIndex === DOCUMENTARY_MILESTONES.length - 1
                        ? 'opacity-30 border-white/5 cursor-not-allowed bg-black/30'
                        : 'bg-[#101626] border-amber-500/25 hover:border-amber-400/60 text-amber-300 hover:text-white active:scale-95'
                    }`}
                    title={isEn ? 'Next Chapter' : 'وێستگەی دواتر'}
                  >
                    <NextIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Step Dots Indicator */}
                <div className="flex items-center gap-1.5 overflow-x-auto px-2 py-1 scrollbar-none max-w-[180px] sm:max-w-[240px]">
                  {DOCUMENTARY_MILESTONES.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => navigateToMilestone(idx)}
                      className={`transition-all rounded-[1px] cursor-pointer shrink-0 ${
                        currentIndex === idx
                          ? 'w-5 h-2 bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                          : 'w-2 h-2 bg-white/20 hover:bg-white/40'
                      }`}
                      title={
                        isEn
                          ? `Chapter ${formatDigits(idx + 1, language)}`
                          : `وێستگەی ${formatDigits(idx + 1, language)}`
                      }
                    />
                  ))}
                </div>

                {/* Read Full Detail if linked fact exists */}
                {linkedFact && onOpenFactDetail && (
                  <button
                    onClick={() => onOpenFactDetail(linkedFact)}
                    className="px-3.5 py-1.5 rounded-[4px] bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    title={
                      isEn
                        ? 'Open full historical article and archive records on the map'
                        : 'بینینی تەواوی زانیاری و بەڵگەنامەکان لە نەخشەدا'
                    }
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Full Entry' : 'تەواوی بابەت'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Fullscreen Preview for Milestone Image */}
      {showLightbox && (() => {
        const linkedImg = linkedFact ? getFactDisplayImage(linkedFact) : '';
        const milestoneImg = linkedImg || activeMilestone.imageUrl || '';
        return (
          <div
            dir={dir}
            className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 pointer-events-auto animate-fade-in"
            onClick={() => setShowLightbox(false)}
          >
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute top-4 end-4 w-11 h-11 rounded-[4px] bg-[#0b0f1c] text-white flex items-center justify-center transition-all cursor-pointer border border-amber-500/30 hover:border-amber-400/60 shadow-xl"
              title={isEn ? 'Close' : 'داخستن'}
            >
              <X className="w-6 h-6" />
            </button>
            <div className="max-w-4xl max-h-[85vh] flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
              <img
                src={getOptimizedImageUrl(milestoneImg, 'full')}
                alt={mTitle}
                className="max-w-full max-h-[75vh] object-contain rounded-[4px] border border-amber-500/30 shadow-[0_0_50px_rgba(0,0,0,0.9)]"
              />
              <div className="text-center text-white space-y-1">
                <h3 className="text-lg font-bold font-heading text-amber-300">{mTitle}</h3>
                <p className="text-xs text-slate-300">{mHeadline} · {mPeriod}</p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

