import { FactItem, GREAT_KURDISTAN_POLYGON } from './kurdishHistoryData';
import { kurdishSearchMatch, normalizeKurdishSearchText } from '../utils/kurdishSearch';
import boundaryPolygons from './kurdistanBoundaryPolygons.json';
import type { AppLanguage } from '../context/LanguageContext';

export const KURDISH_PROVINCES_CITIES: FactItem[] = [];
export const ROJAVA_LOCATIONS: FactItem[] = [];

export type ProvincePart = 'south' | 'north' | 'east' | 'west' | 'outside';

export interface ProvinceItem {
  id: string;
  name: string;
  nameEn?: string;
  part: ProvincePart;
  partName: string;
  partNameEn?: string;
  inKurdistan: boolean;
  countryCode?: 'IQ' | 'TR' | 'IR' | 'SY' | string;
  center: [number, number]; // [lat, lng]
  zoom: number;
  aliases: string[];
  /** Google Maps Geocoding administrative_area_level_1 names */
  googleAdmin1?: string[];
  /** Google Maps Geocoding administrative_area_level_2 / locality names (for split governorates) */
  googleAdmin2?: string[];
  /** Primary boundary polygon [lat, lng][] (official ADM1/ADM2) */
  polygon?: [number, number][];
  /** Full multi-ring administrative boundary polygons [lat, lng][][] (for split regions / enclaves) */
  polygons?: [number, number][][];
}

/**
 * پشکنینی هاوتایی وشەی تەواو (Word-boundary aware) بۆ ئەوەی ناوی کورت وەک «وان» لەناو «مەریوان» یان «شوان»دا بە هەڵە هاوتا نەبێت
 */
export function kurdishWordMatch(haystack: string | null | undefined, word: string): boolean {
  if (!haystack || !word) return false;
  const normH = normalizeKurdishSearchText(haystack);
  const normW = normalizeKurdishSearchText(word);
  if (!normW) return false;

  // Replace punctuation and parentheses with spaces so tokens split cleanly
  const cleanH = normH.replace(/[()[\]{}«»"'،,.\-–—/:;!؟?\\]/g, ' ');
  const tokens = cleanH.split(/\s+/).filter(Boolean);
  const wordTokens = normW.replace(/[()[\]{}«»"'،,.\-–—/:;!؟?\\]/g, ' ').split(/\s+/).filter(Boolean);

  if (wordTokens.length === 1) {
    const w = wordTokens[0];
    const flexW = w.replace(/ه/g, 'ە');
    return tokens.some((t) => t === w || t.replace(/ه/g, 'ە') === flexW);
  }

  // Multi-word phrase: check contiguous token match or padded substring
  const paddedH = ` ${tokens.join(' ')} `;
  const phrase = ` ${wordTokens.join(' ')} `;
  if (paddedH.includes(phrase)) return true;
  return paddedH.replace(/ه/g, 'ە').includes(phrase.replace(/ه/g, 'ە'));
}

/**
 * ٤٧ پارێزگا و ناوچەی سەرەکی کوردستانی مەزن (باشوور، باکوور، ڕۆژهەڵات، ڕۆژئاوا)
 * هەر پارێزگایەک سنووری پۆلیگۆنی جوگرافی و ناوی فەرمی گۆگڵ (Admin Level 1 & 2) لەخۆدەگرێت
 */
const KURDISTAN_PROVINCES_BASE: ProvinceItem[] = [
  // ================= باشووری کوردستان (٩ ناوچە و پارێزگا) =================
  {
    id: 'erbil',
    name: 'هەولێر',
    part: 'south',
    partName: 'باشووری کوردستان',
    inKurdistan: true,
    countryCode: 'IQ',
    center: [36.1912, 44.0091],
    zoom: 9,
    googleAdmin1: ['erbil governorate', 'erbil', 'arbil', 'hawler', 'hewler', 'پارێزگای هەولێر', 'محافظة أربيل'],
    googleAdmin2: ['erbil', 'soran', 'shaqlawa', 'koya', 'koysinjaq', 'choman', 'mergasor', 'khabat', 'makhmur', 'rawanduz', 'dashti hawler'],
    aliases: ['هەولێر', 'اربیل', 'Erbil', 'Hewlêr', 'هەولیر', 'ڕەواندز', 'شەقڵاوە', 'کۆیە', 'سۆران', 'چۆمان', 'مێرگەسۆر', 'خەبات', 'مەخموور', 'بارزان'],
    polygon: [
      [37.06, 43.92],
      [37.02, 44.45],
      [36.68, 45.06],
      [36.44, 44.82],
      [36.12, 44.68],
      [35.84, 44.52],
      [35.62, 43.92],
      [35.68, 43.40],
      [36.02, 43.42],
      [36.30, 43.54],
      [36.50, 43.80],
      [36.82, 43.95],
    ],
  },
  {
    id: 'sulaymaniyah',
    name: 'سلێمانی',
    part: 'south',
    partName: 'باشووری کوردستان',
    inKurdistan: true,
    countryCode: 'IQ',
    center: [35.5615, 45.4354],
    zoom: 9,
    googleAdmin1: ['sulaymaniyah governorate', 'sulaymaniyah', 'as sulaymaniyah', 'slemani', 'پارێزگای سلێمانی', 'محافظة السليمانية'],
    googleAdmin2: ['sulaymaniyah', 'chamchamal', 'dukan', 'dokan', 'ranya', 'pishdar', 'qaladize', 'penjwin', 'sharbazher', 'mawat', 'qaradagh', 'sayed sadiq', 'darbandikhan'],
    aliases: ['سلێمانی', 'السليمانية', 'Sulaymaniyah', 'Silêmanî', 'سلیمانی', 'شارباژێڕ', 'پشدەر', 'قەڵادزێ', 'ڕانیە', 'دووکان', 'دەربەندیخان', 'پێنجوێن', 'سەیدسادق', 'ماوەت', 'چەمچەماڵ', 'قەرەداغ'],
    polygon: [
      [36.44, 44.82],
      [36.45, 45.15],
      [36.16, 45.42],
      [35.76, 46.10],
      [35.34, 45.95],
      [35.30, 45.82],
      [35.02, 45.82],
      [35.00, 45.28],
      [35.14, 44.82],
      [35.62, 44.72],
      [35.84, 44.52],
      [36.12, 44.68],
    ],
  },
  {
    id: 'duhok',
    name: 'دهۆک',
    part: 'south',
    partName: 'باشووری کوردستان',
    inKurdistan: true,
    countryCode: 'IQ',
    center: [36.8679, 42.9885],
    zoom: 9,
    googleAdmin1: ['duhok governorate', 'duhok', 'dohuk', 'dahuk', 'dihok', 'پارێزگای دهۆک', 'محافظة دهوك'],
    googleAdmin2: ['duhok', 'zakho', 'amedi', 'amadiya', 'akre', 'aqrah', 'bardarash', 'sumel', 'semel'],
    aliases: ['دهۆک', 'دهوك', 'Duhok', 'Dihok', 'زاخۆ', 'ئامێدی', 'ئاکرێ', 'بەردەڕەش', 'سێمێل'],
    polygon: [
      [37.36, 42.35],
      [37.32, 43.35],
      [37.14, 43.96],
      [36.82, 43.95],
      [36.50, 43.80],
      [36.42, 43.52],
      [36.75, 43.28],
      [36.77, 42.95],
      [36.84, 42.65],
      [37.06, 42.34],
    ],
  },
  {
    id: 'halabja',
    name: 'هەڵەبجە',
    part: 'south',
    partName: 'باشووری کوردستان',
    inKurdistan: true,
    countryCode: 'IQ',
    center: [35.1778, 45.9861],
    zoom: 10,
    googleAdmin1: ['halabja governorate', 'halabja', 'helebce', 'پارێزگای هەڵەبجە', 'محافظة حلبجة'],
    googleAdmin2: ['halabja', 'khurmal', 'biyara', 'sirwan', 'tawela', 'hawraman'],
    aliases: ['هەڵەبجە', 'حلبجة', 'Halabja', 'Helebce', 'هەلەبجە', 'هەورامان', 'خورماڵ', 'بیارە', 'سیروان', 'تەوێڵە'],
    polygon: [
      [35.34, 45.95],
      [35.30, 46.22],
      [35.06, 46.22],
      [34.96, 45.98],
      [35.02, 45.82],
      [35.30, 45.82],
    ],
  },
  {
    id: 'kirkuk',
    name: 'کەرکووک',
    part: 'south',
    partName: 'باشووری کوردستان',
    inKurdistan: true,
    countryCode: 'IQ',
    center: [35.4681, 44.3922],
    zoom: 9,
    googleAdmin1: ['kirkuk governorate', 'kirkuk', 'at-ta\'mim', 'tamin', 'پارێزگای کەرکووک', 'محافظة كركوك'],
    googleAdmin2: ['kirkuk', 'daquq', 'hawija', 'dibis', 'altun kupri'],
    aliases: ['کەرکووک', 'کەرکوک', 'کرکوک', 'Kirkuk', 'Kerkûk', 'داقووق', 'حەویجە', 'دووبز', 'لەیلان', 'قەرەهەنجیر', 'ئالتون کۆپری'],
    polygon: [
      [35.84, 44.52],
      [35.62, 44.72],
      [35.14, 44.82],
      [35.00, 44.45],
      [34.98, 44.08],
      [35.24, 43.55],
      [35.68, 43.40],
      [35.62, 43.92],
    ],
  },
  {
    id: 'garmian_diyala',
    name: 'گەرمیان و خانەقین',
    part: 'south',
    partName: 'باشووری کوردستان',
    inKurdistan: true,
    countryCode: 'IQ',
    center: [34.3524, 45.3855],
    zoom: 9,
    googleAdmin1: ['diyala governorate', 'diyala', 'garmian', 'پارێزگای دیالە', 'محافظة ديالى'],
    googleAdmin2: ['kalar', 'kifri', 'khanaqin', 'mandali', 'jalawla', 'saadiya', 'qaratapa', 'baladruz'],
    aliases: ['گەرمیان', 'خانەقین', 'کفری', 'کەلار', 'مەندەلی', 'جەلەولا', 'قۆڕەتوو', 'قەرەتەپە', 'دیالە', 'Khanaqin', 'Garmian', 'سەعدیە'],
    polygon: [
      [35.00, 45.28],
      [35.02, 45.82],
      [34.72, 45.76],
      [34.32, 45.58],
      [33.65, 45.75],
      [33.58, 45.28],
      [34.10, 44.95],
      [34.55, 44.80],
      [34.95, 44.82],
    ],
  },
  {
    id: 'sinjar_nineveh',
    name: 'شنگال و دەشتی نەینەوا',
    part: 'south',
    partName: 'باشووری کوردستان',
    inKurdistan: true,
    countryCode: 'IQ',
    center: [36.3209, 41.8624],
    zoom: 9,
    googleAdmin1: ['nineveh governorate', 'ninawa governorate', 'nineveh', 'پارێزگای نەینەوا', 'محافظة نينوى'],
    googleAdmin2: ['sinjar', 'al-shikhan', 'sheikhan', 'tel keif', 'tel keppe', 'al-hamdaniya', 'tal afar', 'zummar', 'bashiqa', 'alqosh', 'ba\'aj'],
    aliases: ['شنگال', 'سنجار', 'Sinjar', 'دەشتی نەینەوا', 'بەعشیقە', 'تەلکێف', 'حەمدانیە', 'قەرەقۆش', 'ئەلقۆش', 'تەلعەفەر', 'زومار', 'ئێزیدخان'],
    polygon: [
      [37.06, 42.34],
      [36.84, 42.65],
      [36.77, 42.95],
      [36.75, 43.28],
      [36.42, 43.52],
      [36.12, 43.46],
      [36.02, 42.85],
      [36.08, 41.80],
      [36.15, 41.22],
      [36.68, 41.45],
      [36.96, 42.02],
    ],
  },
  {
    id: 'tuz_khurmatu',
    name: 'خورماتوو',
    part: 'south',
    partName: 'باشووری کوردستان',
    inKurdistan: true,
    countryCode: 'IQ',
    center: [34.8872, 44.6331],
    zoom: 9,
    googleAdmin1: ['saladin governorate', 'salah al-din governorate', 'salah ad din', 'محافظة صلاح الدين'],
    googleAdmin2: ['tooz', 'tuz khurmatu', 'tuz', 'amirli', 'sulaiman beg'],
    aliases: ['خورماتوو', 'طوزخورماتو', 'خورماتو', 'Tuz Khurmatu', 'سەلاحەدین', 'ئامرلی', 'سلێمان بەی'],
    polygon: [
      [35.14, 44.82],
      [34.95, 44.82],
      [34.55, 44.80],
      [34.55, 44.32],
      [34.98, 44.08],
      [35.00, 44.45],
    ],
  },
  {
    id: 'badra_jassan',
    name: 'بەدرە و جەسان (واست)',
    part: 'south',
    partName: 'باشووری کوردستان',
    inKurdistan: true,
    countryCode: 'IQ',
    center: [33.1042, 45.9528],
    zoom: 9,
    googleAdmin1: ['wasit governorate', 'wasit', 'محافظة واسط'],
    googleAdmin2: ['badra', 'jassan', 'zurbatiya'],
    aliases: ['بەدرە', 'جەسان', 'بدرة', 'جسان', 'واست', 'Badra', 'Jassan', 'زرباتیە'],
    polygon: [
      [33.48, 45.75],
      [33.36, 46.28],
      [32.82, 46.42],
      [32.78, 45.75],
      [33.12, 45.65],
    ],
  },

  // ================= باکووری کوردستان (٢٤ پارێزگا) =================
  {
    id: 'amed',
    name: 'ئامەد (دیاربەکر)',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [37.9144, 40.2306],
    zoom: 9,
    googleAdmin1: ['diyarbakır', 'diyarbakir', 'diyarbakır province', 'diyarbakir province'],
    aliases: ['ئامەد', 'دیاربەکر', 'دیاربکر', 'Amed', 'Diyarbakir', 'Diyarbekir', 'فارقین', 'سلیڤان', 'بیسمل', 'ئەرغەنی', 'لیجە', 'سلێڤان'],
    polygon: [
      [38.62, 40.15],
      [38.58, 41.12],
      [38.05, 41.12],
      [37.65, 40.98],
      [37.62, 40.00],
      [37.92, 39.32],
      [38.38, 39.42],
      [38.55, 39.88],
    ],
  },
  {
    id: 'van',
    name: 'وان',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [38.5012, 43.3749],
    zoom: 9,
    googleAdmin1: ['van', 'van province'],
    aliases: ['وان', 'Van', 'Wan', 'دەریاچەی وان', 'تووشپا', 'ئەردیش', 'مورادیە', 'باشکەلا', 'گێڤاش', 'ئۆزالپ'],
    polygon: [
      [39.35, 43.35],
      [39.25, 44.32],
      [38.45, 44.48],
      [37.82, 44.22],
      [37.78, 42.95],
      [38.28, 42.72],
      [38.88, 42.95],
      [39.20, 43.12],
    ],
  },
  {
    id: 'mardin',
    name: 'ماردین',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [37.3129, 40.7339],
    zoom: 9,
    googleAdmin1: ['mardin', 'mardin province'],
    aliases: ['ماردین', 'Mardin', 'Mêrdîn', 'نسێبین', 'میدیات', 'قۆسەر', 'دێرک چیا', 'ستەور', 'کەربۆران'],
    polygon: [
      [37.65, 40.00],
      [37.65, 40.98],
      [37.55, 41.88],
      [37.04, 41.82],
      [37.08, 40.55],
      [37.14, 39.88],
      [37.52, 39.95],
    ],
  },
  {
    id: 'bitlis',
    name: 'بەدلیس',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [38.4006, 42.1095],
    zoom: 9,
    googleAdmin1: ['bitlis', 'bitlis province'],
    aliases: ['بەدلیس', 'Bitlis', 'Bedlîs', 'خەڵات', 'تەتوان', 'نۆڕشین', 'مۆتکی', 'خیزان', 'ئەخڵات'],
    polygon: [
      [38.92, 42.10],
      [38.88, 42.95],
      [38.28, 42.72],
      [38.12, 42.45],
      [38.22, 41.78],
      [38.68, 41.82],
    ],
  },
  {
    id: 'urfa',
    name: 'ڕحا (ئورفا)',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [37.1674, 38.7955],
    zoom: 9,
    googleAdmin1: ['şanlıurfa', 'sanliurfa', 'urfa', 'şanlıurfa province', 'sanliurfa province'],
    aliases: ['ڕحا', 'ئورفا', 'شانلی ئورفا', 'Riha', 'Urfa', 'Sanliurfa', 'حەڕان', 'سوێرەک', 'وێرانشار', 'بێریجیک', 'پرسیوس'],
    polygon: [
      [37.92, 39.32],
      [37.62, 40.00],
      [37.14, 39.88],
      [36.82, 40.18],
      [36.82, 39.92],
      [36.715, 38.95],
      [36.86, 38.66],
      [36.91, 38.44],
      [36.91, 38.28],
      [36.83, 37.98],
      [36.93, 37.90],
      [37.48, 37.95],
      [37.68, 38.80],
    ],
  },
  {
    id: 'dersim',
    name: 'دێرسم (تونجەلی)',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [39.1081, 39.5478],
    zoom: 9,
    googleAdmin1: ['tunceli', 'tunceli province', 'dersim'],
    aliases: ['دێرسم', 'دەرسیم', 'تونجەلی', 'Dersim', 'Tunceli', 'پردیسوور', 'خۆزات', 'نازمیە', 'مازگرت', 'چەمیشگەزەک', 'پولور'],
    polygon: [
      [39.62, 39.25],
      [39.58, 40.15],
      [39.05, 40.12],
      [38.82, 39.65],
      [38.84, 38.82],
      [39.38, 38.88],
    ],
  },
  {
    id: 'batman',
    name: 'باتمان',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [37.8874, 41.1322],
    zoom: 9,
    googleAdmin1: ['batman', 'batman province'],
    aliases: ['باتمان', 'ئێلح', 'Batman', 'Êlih', 'حەسەنکێف', 'قوبین', 'کۆزلۆک', 'ساسۆن'],
    polygon: [
      [38.52, 41.12],
      [38.45, 41.62],
      [38.00, 41.65],
      [37.55, 41.58],
      [37.65, 40.98],
      [38.05, 41.12],
    ],
  },
  {
    id: 'siirt',
    name: 'سێرت',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [37.9333, 41.95],
    zoom: 9,
    googleAdmin1: ['siirt', 'siirt province'],
    aliases: ['سێرت', 'سێرتە', 'Siirt', 'Sêrt', 'هاڤێل', 'دێھ', 'شێروان', 'میسریج', 'بەرواری'],
    polygon: [
      [38.22, 41.78],
      [38.12, 42.45],
      [37.92, 42.82],
      [37.68, 42.65],
      [37.68, 41.62],
      [38.00, 41.65],
    ],
  },
  {
    id: 'hakkari',
    name: 'جۆلەمێرگ (حەکاری)',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [37.5744, 43.7408],
    zoom: 9,
    googleAdmin1: ['hakkâri', 'hakkari', 'hakkâri province', 'hakkari province'],
    aliases: ['جۆلەمێرگ', 'حەکاری', 'Colemêrg', 'Hakkari', 'گەڤەر', 'شەمزینان', 'چەلێ', 'یوکسێکۆڤا'],
    polygon: [
      [37.78, 43.35],
      [37.82, 44.22],
      [37.42, 44.78],
      [37.14, 44.45],
      [37.18, 43.35],
    ],
  },
  {
    id: 'sirnak',
    name: 'شڕنەخ',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [37.5186, 42.4594],
    zoom: 9,
    googleAdmin1: ['şırnak', 'sirnak', 'şırnak province', 'sirnak province'],
    aliases: ['شڕنەخ', 'شیرناخ', 'Sirnak', 'Şirnex', 'جزیرە', 'سلۆپی', 'ئیدل', 'قڵابان', 'بەسەباب', 'حەزەخ'],
    polygon: [
      [37.68, 41.72],
      [37.68, 42.65],
      [37.78, 43.35],
      [37.18, 43.35],
      [37.14, 42.35],
      [37.18, 41.82],
    ],
  },
  {
    id: 'mus',
    name: 'مووش',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [38.7432, 41.491],
    zoom: 9,
    googleAdmin1: ['muş', 'mus', 'muş province', 'mus province'],
    aliases: ['مووش', 'Mus', 'Mûs', 'مەلازگرد', 'گۆمگۆم', 'قۆپ', 'وارتۆ'],
    polygon: [
      [39.32, 41.15],
      [39.32, 42.62],
      [38.92, 42.58],
      [38.92, 42.10],
      [38.68, 41.82],
      [38.52, 41.12],
    ],
  },
  {
    id: 'agri',
    name: 'ئاگری',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [39.7191, 43.0503],
    zoom: 9,
    googleAdmin1: ['ağrı', 'agri', 'ağrı province', 'agri province'],
    aliases: ['ئاگری', 'ئارارات', 'Agri', 'Agirî', 'بایەزید', 'بازید', 'دۆغوبایەزید', 'پاتنۆس', 'دیادین', 'گیادین', 'توتەک', 'ئەلشکیرت'],
    polygon: [
      [40.02, 42.45],
      [39.96, 43.30],
      [39.72, 43.75],
      [39.74, 44.55],
      [39.38, 44.45],
      [39.25, 43.35],
      [39.12, 42.58],
      [39.62, 42.32],
    ],
  },
  {
    id: 'igdir',
    name: 'ئیدر',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [39.9237, 44.045],
    zoom: 9,
    googleAdmin1: ['ığdır', 'igdir', 'ığdır province', 'igdir province'],
    aliases: ['ئیدر', 'ئیغدیر', 'Igdir', 'Îdir', 'تووزلوجا', 'ئارالک'],
    polygon: [
      [40.14, 43.35],
      [40.06, 44.62],
      [39.74, 44.82],
      [39.74, 44.55],
      [39.72, 43.75],
      [39.96, 43.30],
    ],
  },
  {
    id: 'kars',
    name: 'قەرس',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [40.6013, 43.0975],
    zoom: 9,
    googleAdmin1: ['kars', 'kars province'],
    aliases: ['قەرس', 'قارص', 'Kars', 'Qers', 'سەریقامیش', 'کاغزمان', 'دیگۆر', 'ئارپاچای'],
    polygon: [
      [40.88, 42.45],
      [40.88, 43.72],
      [40.14, 43.68],
      [40.02, 42.45],
      [40.35, 42.20],
    ],
  },
  {
    id: 'erzurum',
    name: 'ئەرزڕۆم',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [39.9055, 41.2658],
    zoom: 9,
    googleAdmin1: ['erzurum', 'erzurum province'],
    aliases: ['ئەرزڕۆم', 'ئەرزەرۆم', 'ارزروم', 'Erzurum', 'Erzerom', 'خنووس', 'قەرەچۆبان', 'تەرمان', 'شێنکایا', 'تەکمان'],
    polygon: [
      [40.88, 40.55],
      [40.85, 42.45],
      [40.02, 42.45],
      [39.62, 42.32],
      [39.32, 42.10],
      [39.32, 41.15],
      [39.55, 40.42],
      [40.25, 40.40],
    ],
  },
  {
    id: 'erzincan',
    name: 'ئەرزنگان',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [39.75, 39.5],
    zoom: 9,
    googleAdmin1: ['erzincan', 'erzincan province'],
    aliases: ['ئەرزنگان', 'ئەرزنجان', 'Erzincan', 'Erzîngan', 'کەماخ', 'تەرجان', 'ئیلیچ', 'ڕەفاهیە', 'چاییرلی'],
    polygon: [
      [40.12, 38.45],
      [40.08, 40.48],
      [39.55, 40.42],
      [39.58, 40.15],
      [39.62, 39.25],
      [39.22, 38.45],
    ],
  },
  {
    id: 'malatya',
    name: 'مەلاتیە',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [38.3552, 38.3095],
    zoom: 9,
    googleAdmin1: ['malatya', 'malatya province'],
    aliases: ['مەلاتیە', 'مەلاتیا', 'Malatya', 'Meletî', 'خەربووت', 'دارەندە', 'ئارگۆڤان', 'پۆتورگە', 'ئەکچەداغ'],
    polygon: [
      [39.12, 37.85],
      [39.02, 38.75],
      [38.25, 38.92],
      [38.05, 38.68],
      [38.08, 37.65],
      [38.65, 37.38],
    ],
  },
  {
    id: 'adiyaman',
    name: 'سەمسوور (ئادیامان)',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [37.7648, 38.2786],
    zoom: 9,
    googleAdmin1: ['adıyaman', 'adiyaman', 'adıyaman province', 'adiyaman province'],
    aliases: ['سەمسوور', 'ئادیامان', 'Samsur', 'Adiyaman', 'کاحتا', 'گۆلباشی', 'بێسنی', 'چەلیکهان', 'چیای نەمروود', 'سامسور'],
    polygon: [
      [38.12, 37.85],
      [38.05, 38.98],
      [37.68, 38.80],
      [37.48, 37.95],
      [37.55, 37.48],
      [37.95, 37.55],
    ],
  },
  {
    id: 'bingol',
    name: 'چەولیگ (بینگۆل)',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [38.8854, 40.4983],
    zoom: 9,
    googleAdmin1: ['bingöl', 'bingol', 'bingöl province', 'bingol province'],
    aliases: ['چەولیگ', 'بینگۆل', 'Cewlik', 'Bingol', 'داراهێنێ', 'کانیرەش', 'کیغی', 'یەدیسو', 'گەنچ'],
    polygon: [
      [39.52, 40.15],
      [39.32, 41.15],
      [38.58, 41.12],
      [38.62, 40.15],
      [39.05, 40.12],
    ],
  },
  {
    id: 'elazig',
    name: 'خارپێت (ئەلازیغ)',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [38.6748, 39.2225],
    zoom: 9,
    googleAdmin1: ['elazığ', 'elazig', 'elazığ province', 'elazig province'],
    aliases: ['خارپێت', 'ئەلازیغ', 'Xarpet', 'Elazig', 'پالو', 'قۆڤانجلار', 'مادەن', 'کەبان', 'باژار', 'قەرەکۆچان'],
    polygon: [
      [39.05, 40.12],
      [38.62, 40.15],
      [38.38, 39.42],
      [38.25, 38.92],
      [38.84, 38.82],
      [38.82, 39.65],
    ],
  },
  {
    id: 'gaziantep',
    name: 'دیلۆک (عەنتاب)',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [37.0662, 37.3833],
    zoom: 9,
    googleAdmin1: ['gaziantep', 'gaziantep province'],
    aliases: ['دیلۆک', 'عەنتاب', 'گازیعەنتاب', 'Dilok', 'Gaziantep', 'نێزیپ', 'ئیسلاحیە', 'کارکامیش'],
    polygon: [
      [37.48, 37.95],
      [36.93, 37.90],
      [36.82, 36.60],
      [37.25, 36.55],
      [37.42, 37.45],
    ],
  },
  {
    id: 'maras',
    name: 'مەرعەش',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [37.5753, 36.9228],
    zoom: 9,
    googleAdmin1: ['kahramanmaraş', 'kahramanmaras', 'maras', 'kahramanmaraş province'],
    aliases: ['مەرعەش', 'قەهرەمانمەرعەش', 'Maras', 'Kahramanmaras', 'ئەلبستان', 'پازارچیک', 'ئەفشین', 'گۆکسون'],
    polygon: [
      [38.62, 37.35],
      [38.08, 37.65],
      [37.55, 37.48],
      [37.42, 37.45],
      [37.25, 36.55],
      [37.75, 36.15],
      [38.45, 36.40],
    ],
  },
  {
    id: 'sivas',
    name: 'سێواس (کۆچگری)',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [39.7477, 37.0179],
    zoom: 9,
    googleAdmin1: ['sivas', 'sivas province'],
    aliases: ['سێواس', 'کۆچگری', 'Sivas', 'Sêwaz', 'زارا', 'دیڤریگی', 'ئیمرانلی', 'کانگال', 'هافیک'],
    polygon: [
      [40.45, 37.20],
      [40.12, 38.45],
      [39.22, 38.45],
      [38.65, 37.38],
      [38.95, 36.05],
      [39.85, 35.95],
      [40.35, 36.55],
    ],
  },
  {
    id: 'ardahan',
    name: 'ئەردێخان',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [41.1105, 42.7022],
    zoom: 9,
    googleAdmin1: ['ardahan', 'ardahan province'],
    aliases: ['ئەردێخان', 'ئەرداهان', 'Ardahan', 'Erdêxan', 'گۆلە', 'چڵدر', 'پۆسۆف', 'دامال'],
    polygon: [
      [41.58, 42.45],
      [41.45, 43.48],
      [40.88, 43.45],
      [40.88, 42.45],
      [40.72, 42.20],
      [41.20, 42.22],
    ],
  },

  // ================= ڕۆژهەڵاتی کوردستان (٩ پارێزگا) =================
  {
    id: 'sanandaj',
    name: 'سنە (کوردستان)',
    part: 'east',
    partName: 'ڕۆژهەڵاتی کوردستان',
    inKurdistan: true,
    countryCode: 'IR',
    center: [35.3144, 46.9923],
    zoom: 9,
    googleAdmin1: ['kurdistan province', 'kurdistan', 'kordestan', 'استان کردستان'],
    aliases: ['سنە', 'سنندج', 'Sanandaj', 'Sine', 'مەریوان', 'سەقز', 'بانە', 'دیواندەرە', 'قوروە', 'بیجاڕ', 'کامێران', 'سەوڵاوا'],
    polygon: [
      [36.42, 46.02],
      [36.42, 47.45],
      [36.05, 48.12],
      [35.12, 48.05],
      [34.78, 47.25],
      [34.82, 46.65],
      [35.30, 46.22],
      [35.76, 46.10],
      [35.92, 45.65],
    ],
  },
  {
    id: 'kermanshah',
    name: 'کرماشان',
    part: 'east',
    partName: 'ڕۆژهەڵاتی کوردستان',
    inKurdistan: true,
    countryCode: 'IR',
    center: [34.3277, 47.0778],
    zoom: 9,
    googleAdmin1: ['kermanshah province', 'kermanshah', 'استان کرمانشاه'],
    aliases: ['کرماشان', 'کرمانشاه', 'Kermanshah', 'Kirmashan', 'قەسری شیرین', 'سەرپێڵی زەهاو', 'ئیسلام ئاباد', 'پاوە', 'جوانڕۆ', 'ڕەوانسەر', 'گیڵانغەرب', 'کەنگاوەر', 'سونقوڕ', 'سەحنە', 'بێستوون', 'کرند'],
    polygon: [
      [35.06, 46.22],
      [34.82, 46.65],
      [34.78, 47.25],
      [34.95, 47.98],
      [34.35, 48.10],
      [33.85, 47.50],
      [33.92, 45.65],
      [34.32, 45.58],
      [34.72, 45.76],
    ],
  },
  {
    id: 'ilam',
    name: 'ئیلام',
    part: 'east',
    partName: 'ڕۆژهەڵاتی کوردستان',
    inKurdistan: true,
    countryCode: 'IR',
    center: [33.6374, 46.4227],
    zoom: 9,
    googleAdmin1: ['ilam province', 'ilam', 'استان ایلام'],
    aliases: ['ئیلام', 'ایلام', 'Ilam', 'Îlam', 'دەهلۆڕان', 'مێهران', 'ئەیوان', 'ئابدانان', 'دەرەشار', 'شیروان چەردەڤۆڵ', 'مەلەکشاهی'],
    polygon: [
      [33.92, 45.65],
      [33.85, 47.50],
      [33.10, 47.92],
      [32.28, 47.72],
      [32.42, 46.85],
      [32.82, 46.42],
      [33.36, 46.28],
      [33.65, 45.75],
    ],
  },
  {
    id: 'urmia',
    name: 'ورمێ (ئازەربایجانی ڕۆژاوا)',
    part: 'east',
    partName: 'ڕۆژهەڵاتی کوردستان',
    inKurdistan: true,
    countryCode: 'IR',
    center: [37.5527, 45.0761],
    zoom: 9,
    googleAdmin1: ['west azerbaijan province', 'west azerbaijan', 'استان آذربایجان غربی'],
    aliases: ['ورمێ', 'ارومیە', 'Urmia', 'Wirmê', 'مەهاباد', 'بۆکان', 'پیرانشار', 'سەردەشت', 'شنۆ', 'خۆی', 'ماکۆ', 'سەڵماس', 'نەغەدە', 'تیکاب', 'چاڵدێران', 'پۆلدەشت', 'ڕەبەت'],
    polygon: [
      [39.74, 44.55],
      [39.55, 45.25],
      [38.55, 45.30],
      [37.25, 45.95],
      [36.75, 47.35],
      [36.25, 47.15],
      [36.42, 46.02],
      [35.92, 45.65],
      [36.16, 45.42],
      [36.45, 45.15],
      [36.68, 45.06],
      [37.42, 44.78],
      [38.45, 44.48],
      [39.38, 44.45],
    ],
  },
  {
    id: 'lorestan',
    name: 'لوڕستان',
    part: 'east',
    partName: 'ڕۆژهەڵاتی کوردستان',
    inKurdistan: true,
    countryCode: 'IR',
    center: [33.4878, 48.3558],
    zoom: 9,
    googleAdmin1: ['lorestan province', 'lorestan', 'luristan', 'استان لرستان'],
    aliases: ['لوڕستان', 'لرستان', 'Lorestan', 'Loristan', 'خورەماوە', 'خوڕەم ئاباد', 'بۆڕوجێرد', 'کۆیەشت', 'ئەلیگودەرز', 'دووروود', 'نوورئاباد', 'ئەزنا', 'پۆلدوختەر', 'شوانکارە', 'ئەلشتر'],
    polygon: [
      [34.35, 48.10],
      [34.12, 49.05],
      [33.55, 50.10],
      [32.78, 49.95],
      [32.68, 48.85],
      [32.92, 47.92],
      [33.10, 47.92],
      [33.85, 47.50],
    ],
  },
  {
    id: 'chaharmahal',
    name: 'چوارمەحاڵ و بەختیاری',
    part: 'east',
    partName: 'ڕۆژهەڵاتی کوردستان',
    inKurdistan: true,
    countryCode: 'IR',
    center: [32.3256, 50.8644],
    zoom: 9,
    googleAdmin1: ['chaharmahal and bakhtiari province', 'chaharmahal and bakhtiari', 'استان چهارمحال و بختیاری'],
    aliases: ['چوارمەحاڵ', 'بەختیاری', 'چهارمحال و بختیاری', 'Chaharmahal', 'Bakhtiari', 'شەهریکورد', 'لۆردێگان', 'بۆرووجن', 'فارسان', 'کوهرەنگ'],
    polygon: [
      [32.78, 49.95],
      [32.75, 51.35],
      [31.85, 51.55],
      [31.22, 51.15],
      [31.35, 50.35],
      [32.15, 49.75],
    ],
  },
  {
    id: 'kohgiluyeh',
    name: 'کۆهگیلوویە و بۆیەر ئەحمەد',
    part: 'east',
    partName: 'ڕۆژهەڵاتی کوردستان',
    inKurdistan: true,
    countryCode: 'IR',
    center: [30.6684, 51.5912],
    zoom: 9,
    googleAdmin1: ['kohgiluyeh and boyer-ahmad province', 'kohgiluyeh and boyer-ahmad', 'استان کهگیلویه و بویراحمد'],
    aliases: ['کۆهگیلوویە', 'بۆیەر ئەحمەد', 'کهگیلویە و بویراحمد', 'Kohgiluyeh', 'یاسووج', 'دێهدەشت', 'گۆچساران', 'دنا'],
    polygon: [
      [31.35, 50.35],
      [31.22, 51.15],
      [30.92, 51.85],
      [30.08, 51.65],
      [30.15, 50.45],
      [30.85, 50.10],
    ],
  },
  {
    id: 'izeh_khuzestan',
    name: 'ئیزە و باکووری خووزستان',
    part: 'east',
    partName: 'ڕۆژهەڵاتی کوردستان',
    inKurdistan: true,
    countryCode: 'IR',
    center: [31.8328, 49.8692],
    zoom: 9,
    googleAdmin1: ['khuzestan province', 'khuzestan', 'استان خوزستان'],
    googleAdmin2: ['izeh', 'masjed soleyman', 'dezful', 'shushtar', 'andimeshk', 'baghmalek', 'lali', 'ramhormoz', 'behbahan'],
    aliases: ['ئیزە', 'خووزستان', 'ئەیلاق', 'شوشتەر', 'دێزفوول', 'مەسجید سولەیمان', 'ئەندیمشک', 'Izeh', 'Khuzestan', 'باغ مەلەک'],
    polygon: [
      [32.92, 47.92],
      [32.68, 48.85],
      [32.78, 49.95],
      [32.15, 49.75],
      [31.35, 50.35],
      [31.12, 49.75],
      [31.65, 48.35],
      [32.28, 47.72],
    ],
  },
  {
    id: 'hamedan',
    name: 'هەمەدان',
    part: 'east',
    partName: 'ڕۆژهەڵاتی کوردستان',
    inKurdistan: true,
    countryCode: 'IR',
    center: [34.7989, 48.515],
    zoom: 9,
    googleAdmin1: ['hamadan province', 'hamadan', 'hamedan', 'استان همدان'],
    aliases: ['هەمەدان', 'همدان', 'Hamedan', 'Hemedan', 'ئەکباتانا', 'مەلایێر', 'نەهاوەند', 'تووسرکان', 'کەبوودەرئاهەنگ', 'ئەسەدئاباد'],
    polygon: [
      [35.70, 48.10],
      [35.55, 49.35],
      [34.25, 49.45],
      [34.12, 49.05],
      [34.35, 48.10],
      [34.95, 47.98],
      [35.12, 48.05],
    ],
  },

  // ================= ڕۆژئاوای کوردستان (٥ پارێزگا و هەرێم) =================
  {
    id: 'hasakah',
    name: 'حەسەکە و قامیشلۆ',
    part: 'west',
    partName: 'ڕۆژئاوای کوردستان',
    inKurdistan: true,
    countryCode: 'SY',
    center: [36.5022, 40.7483],
    zoom: 9,
    googleAdmin1: ['al-hasakah governorate', 'al hasakah', 'hasakah', 'محافظة الحسكة'],
    googleAdmin2: ['al-hasakah', 'qamishli', 'al-malikiyah', 'derik', 'ras al-ayn', 'amuda', 'tal tamr'],
    aliases: ['حەسەکە', 'الحسكة', 'Hasakah', 'قامیشلۆ', 'قامشلي', 'Qamishli', 'عاموودا', 'دێرک', 'سەرێکانی', 'تەلتەمر', 'ڕمێلان', 'درباسیە', 'واشۆکانی'],
    polygon: [
      [37.14, 42.35],
      [37.06, 42.34],
      [36.96, 42.02],
      [36.68, 41.45],
      [36.15, 41.22],
      [36.02, 40.92],
      [36.18, 39.85],
      [36.82, 39.92],
      [37.14, 40.55],
      [37.04, 41.82],
    ],
  },
  {
    id: 'kobani',
    name: 'کۆبانێ',
    part: 'west',
    partName: 'ڕۆژئاوای کوردستان',
    inKurdistan: true,
    countryCode: 'SY',
    center: [36.8911, 38.3533],
    zoom: 9,
    googleAdmin1: ['aleppo governorate', 'محافظة حلب'],
    googleAdmin2: ['ayn al-arab', 'ain al-arab', 'kobani', 'kobane', 'sarrin'],
    aliases: ['کۆبانێ', 'کۆبانی', 'عين العرب', 'Kobani', 'Kobanî', 'سەڕین', 'شێخلەر'],
    polygon: [
      [36.83, 37.98],
      [36.91, 38.28],
      [36.91, 38.44],
      [36.86, 38.66],
      [36.42, 38.64],
      [36.42, 38.05],
    ],
  },
  {
    id: 'afrin',
    name: 'عەفرین',
    part: 'west',
    partName: 'ڕۆژئاوای کوردستان',
    inKurdistan: true,
    countryCode: 'SY',
    center: [36.5119, 36.8689],
    zoom: 9,
    googleAdmin1: ['aleppo governorate', 'محافظة حلب'],
    googleAdmin2: ['afrin', 'efrin', 'jindires', 'rajo', 'bulbul', 'sharran', 'shaykh al-hadid', 'maabatli'],
    aliases: ['عەفرین', 'عفرين', 'Afrin', 'Efrîn', 'چیای کورمێنج', 'جندرێس', 'ڕاجۆ', 'مەعبەتلی', 'بلبل', 'شێراوا', 'شێخ حەدید'],
    polygon: [
      [36.84, 36.60],
      [36.82, 37.05],
      [36.34, 37.04],
      [36.32, 36.52],
      [36.60, 36.42],
    ],
  },
  {
    id: 'sheikh_maqsoud_shahba',
    name: 'شێخ مەقسوود، شەهبا و مەنبەج',
    part: 'west',
    partName: 'ڕۆژئاوای کوردستان',
    inKurdistan: true,
    countryCode: 'SY',
    center: [36.48, 37.60],
    zoom: 9,
    googleAdmin1: ['aleppo governorate', 'محافظة حلب'],
    googleAdmin2: ['manbij', 'azaz', 'al-bab', 'mount simeon', 'aleppo', 'tal rifaat', 'tall rifaat', 'sheikh maqsoud'],
    aliases: ['شێخ مەقسوود', 'شەهبا', 'مەنبەج', 'تەل ڕەفعەت', 'باکووری حەلەب', 'Sheikh Maqsoud', 'Shahba', 'Manbij'],
    polygon: [
      [36.82, 37.05],
      [36.83, 37.98],
      [36.42, 38.05],
      [36.18, 37.65],
      [36.16, 37.10],
      [36.34, 37.04],
    ],
  },
  {
    id: 'gire_spi',
    name: 'گرێ سپی',
    part: 'west',
    partName: 'ڕۆژئاوای کوردستان',
    inKurdistan: true,
    countryCode: 'SY',
    center: [36.6975, 38.9553],
    zoom: 9,
    googleAdmin1: ['ar-raqqah governorate', 'raqqa governorate', 'محافظة الرقة'],
    googleAdmin2: ['tell abyad', 'tal abyad', 'suluk', 'ayn issa'],
    aliases: ['گرێ سپی', 'تل أبيض', 'Tell Abyad', 'Girê Spî', 'عەین عیسا', 'سلوک'],
    polygon: [
      [36.86, 38.66],
      [36.715, 38.95],
      [36.82, 39.92],
      [36.32, 39.85],
      [36.32, 38.64],
    ],
  },
];

export const PART_ENGLISH_NAMES: Record<ProvincePart, string> = {
  south: 'South Kurdistan (Bashur)',
  north: 'North Kurdistan (Bakur)',
  east: 'East Kurdistan (Rojhelat)',
  west: 'West Kurdistan (Rojava)',
  outside: 'Outside Kurdistan',
};

export const PART_KURDISH_NAMES: Record<ProvincePart, string> = {
  south: 'باشووری کوردستان',
  north: 'باکووری کوردستان',
  east: 'ڕۆژهەڵاتی کوردستان',
  west: 'ڕۆژئاوای کوردستان',
  outside: 'دەرەوەی کوردستان',
};

export const PROVINCE_ENGLISH_NAMES: Record<string, string> = {
  // South Kurdistan (9)
  erbil: 'Erbil (Hewler)',
  sulaymaniyah: 'Sulaymaniyah',
  duhok: 'Duhok',
  halabja: 'Halabja',
  kirkuk: 'Kirkuk',
  garmian_diyala: 'Garmian & Khanaqin',
  sinjar_nineveh: 'Sinjar & Nineveh Plains',
  tuz_khurmatu: 'Tuz Khurmatu',
  badra_jassan: 'Badra & Jassan (Wasit)',
  // North Kurdistan (24)
  amed: 'Amed (Diyarbakir)',
  van: 'Van (Wan)',
  mardin: 'Mardin',
  bitlis: 'Bitlis',
  urfa: 'Urfa (Riha)',
  dersim: 'Dersim (Tunceli)',
  batman: 'Batman (Elih)',
  siirt: 'Siirt (Sert)',
  hakkari: 'Hakkari (Colemerg)',
  sirnak: 'Sirnak',
  mus: 'Mus',
  agri: 'Agri',
  igdir: 'Igdir',
  kars: 'Kars',
  erzurum: 'Erzurum',
  erzincan: 'Erzincan',
  malatya: 'Malatya',
  adiyaman: 'Adiyaman (Semsur)',
  bingol: 'Bingol (Cewlig)',
  elazig: 'Elazig (Xarpet)',
  gaziantep: 'Gaziantep (Dilok)',
  maras: 'Kahramanmaras (Gurgum)',
  sivas: 'Sivas (Kocgiri)',
  ardahan: 'Ardahan',
  // East Kurdistan (9)
  sanandaj: 'Sanandaj (Sine)',
  kermanshah: 'Kermanshah (Kirmashan)',
  ilam: 'Ilam',
  urmia: 'Urmia (West Azerbaijan)',
  lorestan: 'Lorestan',
  chaharmahal: 'Chaharmahal & Bakhtiari',
  kohgiluyeh: 'Kohgiluyeh & Boyer-Ahmad',
  izeh_khuzestan: 'Izeh & North Khuzestan',
  hamedan: 'Hamadan (Hamedan)',
  // West Kurdistan (5)
  hasakah: 'Hasakah & Qamishlo',
  kobani: 'Kobani',
  afrin: 'Afrin',
  sheikh_maqsoud_shahba: 'Sheikh Maqsoud, Shahba & Manbij',
  gire_spi: 'Gire Spi (Tell Abyad)',
};

const OFFICIAL_PROVINCE_RINGS = (
  boundaryPolygons as unknown as {
    provinces: Record<string, [number, number][][]>;
    greatKurdistan: [number, number][];
  }
).provinces;

export const KURDISTAN_PROVINCES: ProvinceItem[] = KURDISTAN_PROVINCES_BASE.map((prov) => {
  const realRings = OFFICIAL_PROVINCE_RINGS[prov.id];
  const enriched: ProvinceItem = {
    ...prov,
    nameEn: PROVINCE_ENGLISH_NAMES[prov.id] || prov.name,
    partNameEn: PART_ENGLISH_NAMES[prov.part],
  };
  if (realRings && realRings.length > 0) {
    return {
      ...enriched,
      polygon: realRings[0],
      polygons: realRings,
    };
  }
  return {
    ...enriched,
    polygons: prov.polygon ? [prov.polygon] : undefined,
  };
});

export function getProvinceById(id: string): ProvinceItem | undefined {
  return KURDISTAN_PROVINCES.find((p) => p.id === id);
}

export function getProvinceDisplayName(
  prov: { id?: string; name: string; nameEn?: string } | null | undefined,
  lang: AppLanguage = 'ckb'
): string {
  if (!prov) return '';
  if (lang === 'en') {
    return prov.nameEn || (prov.id ? PROVINCE_ENGLISH_NAMES[prov.id] : undefined) || prov.name;
  }
  return prov.name;
}

export function getPartDisplayName(part: ProvincePart, lang: AppLanguage = 'ckb'): string {
  return lang === 'en' ? PART_ENGLISH_NAMES[part] : PART_KURDISH_NAMES[part];
}

// =========================================================================
// Google Geocoding 14-day Cache (Compliant with GMP ToS 30-day Caching Limit)
// =========================================================================
const GOOGLE_PROVINCE_CACHE_KEY = 'kurdish_history_google_province_cache_v1';
const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export interface CachedGoogleProvinceEntry {
  provinceId: string;
  provinceName: string;
  inKurdistan: boolean;
  countryCode: string;
  adminLevel1: string;
  adminLevel2: string;
  locality: string;
  formattedAddress: string;
  cachedAt: number;
}

let memoryCache: Record<string, CachedGoogleProvinceEntry> | null = null;

function loadCacheMap(): Record<string, CachedGoogleProvinceEntry> {
  if (memoryCache) return memoryCache;
  try {
    const raw = localStorage.getItem(GOOGLE_PROVINCE_CACHE_KEY);
    if (!raw) {
      memoryCache = {};
      return memoryCache;
    }
    const parsed = JSON.parse(raw);
    const now = Date.now();
    const cleaned: Record<string, CachedGoogleProvinceEntry> = {};
    if (parsed && typeof parsed === 'object') {
      for (const [k, v] of Object.entries(parsed)) {
        const entry = v as CachedGoogleProvinceEntry;
        if (entry && typeof entry.cachedAt === 'number' && now - entry.cachedAt < CACHE_TTL_MS) {
          cleaned[k] = entry;
        }
      }
    }
    memoryCache = cleaned;
    return memoryCache;
  } catch {
    memoryCache = {};
    return memoryCache;
  }
}

export function getCoordCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

export function getCachedGoogleProvince(lat: number, lng: number): CachedGoogleProvinceEntry | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const map = loadCacheMap();
  return map[getCoordCacheKey(lat, lng)] || null;
}

export function setCachedGoogleProvince(
  lat: number,
  lng: number,
  entry: Omit<CachedGoogleProvinceEntry, 'cachedAt'>
): void {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
  const map = loadCacheMap();
  map[getCoordCacheKey(lat, lng)] = {
    ...entry,
    cachedAt: Date.now(),
  };
  try {
    // Keep cache compact (max ~800 entries)
    const keys = Object.keys(map);
    if (keys.length > 800) {
      keys
        .sort((a, b) => map[a].cachedAt - map[b].cachedAt)
        .slice(0, keys.length - 800)
        .forEach((k) => delete map[k]);
    }
    localStorage.setItem(GOOGLE_PROVINCE_CACHE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage quota errors
  }
}

// =========================================================================
// Google Admin Area -> Kurdish Province Mapping
// =========================================================================
const OUTSIDE_PROVINCE_KURDISH_NAMES: Record<string, string> = {
  'baghdad': 'بەغدا',
  'baghdad governorate': 'بەغدا',
  'basra': 'بەسڕە',
  'basra governorate': 'بەسڕە',
  'najaf': 'نەجەف',
  'karbala': 'کەربەلا',
  'babylon': 'بابل',
  'al anbar': 'ئەنبار',
  'anbar': 'ئەنبار',
  'tehran': 'تاران',
  'tehran province': 'تاران',
  'isfahan': 'ئەسفەهان',
  'fars': 'فارس (شیراز)',
  'east azerbaijan': 'ئازەربایجانی ڕۆژهەڵات (تەورێز)',
  'east azerbaijan province': 'ئازەربایجانی ڕۆژهەڵات (تەورێز)',
  'ardabil': 'ئەردەبێڵ',
  'zanjan': 'زەنجان',
  'qazvin': 'قەزوین',
  'markazi': 'مەرکەزی',
  'khorasan': 'خوراسان',
  'razavi khorasan': 'خوراسان',
  'damascus': 'دیمەشق',
  'damascus governorate': 'دیمەشق',
  'aleppo': 'حەلەب',
  'aleppo governorate': 'حەلەب',
  'cairo': 'قاهیرە',
  'cairo governorate': 'قاهیرە',
  'istanbul': 'ئیستەنبوڵ',
  'ankara': 'ئەنقەرە',
  'izmir': 'ئیزمیر',
  'adana': 'ئەدەنە',
  'hatay': 'هاتای',
  'trabzon': 'ترابزۆن',
  'konya': 'قۆنیا',
  'kayseri': 'قەیسەری',
  'geneva': 'جنێڤ (سویسرا)',
  'vaud': 'لۆزان (سویسرا)',
  'ile-de-france': 'پاریس (فەڕەنسا)',
  'île-de-france': 'پاریس (فەڕەنسا)',
  'yerevan': 'یەریڤان (ئەرمینیا)',
  'tbilisi': 'تبلیسی (جۆرجیا)',
  'baku': 'باکۆ (ئازەربایجان)',
  'moscow': 'مۆسکۆ (ڕووسیا)',
  'london': 'لەندەن (بەریتانیا)',
  'mecca': 'مەککە',
  'medina': 'مەدینە',
  'jerusalem': 'قودس',
};

function normalizeAdminString(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+(governorate|province|il|vilayeti|muhafazah|district|subdistrict)$/i, '')
    .trim();
}

/**
 * گۆڕینی زانیاری فەرمی گۆگڵ (Admin Level 1, Admin Level 2, Locality, Country)
 * بۆ یەکێک لە ٤٧ پارێزگای کوردستان یان ناوچەی دەرەوەی کوردستان
 */
export function mapGoogleAddressToProvince(info: {
  countryCode?: string;
  country?: string;
  adminLevel1?: string;
  adminLevel2?: string;
  locality?: string;
  lat?: number;
  lng?: number;
}): {
  provinceId: string;
  provinceName: string;
  inKurdistan: boolean;
  province?: ProvinceItem;
} {
  const cc = (info.countryCode || '').toUpperCase();
  const a1Raw = (info.adminLevel1 || '').trim();
  const a2Raw = (info.adminLevel2 || '').trim();
  const locRaw = (info.locality || '').trim();
  const a1 = normalizeAdminString(a1Raw);
  const a2 = normalizeAdminString(a2Raw);
  const loc = normalizeAdminString(locRaw);

  // 1. Check split governorates FIRST using adminLevel2 / locality + country
  // Iraq split governorates
  if (cc === 'IQ' || a1.includes('nineveh') || a1.includes('ninawa') || a1.includes('diyala') || a1.includes('saladin') || a1.includes('salah') || a1.includes('wasit')) {
    if (a1.includes('nineveh') || a1.includes('ninawa')) {
      const sinjarKeywords = ['sinjar', 'shingal', 'shikhan', 'sheikhan', 'tel keif', 'tel keppe', 'hamdaniya', 'tal afar', 'zummar', 'bashiqa', 'alqosh', 'qaraqosh', 'bartella', 'snuny'];
      if (a2.includes('aqra') || a2.includes('akre') || loc.includes('aqra') || loc.includes('akre')) {
        const prov = KURDISTAN_PROVINCES.find((p) => p.id === 'duhok')!;
        return { provinceId: prov.id, provinceName: prov.name, inKurdistan: true, province: prov };
      }
      if (sinjarKeywords.some((k) => a2.includes(k) || loc.includes(k))) {
        const prov = KURDISTAN_PROVINCES.find((p) => p.id === 'sinjar_nineveh')!;
        return { provinceId: prov.id, provinceName: prov.name, inKurdistan: true, province: prov };
      }
      // If coordinates are inside Sinjar / Nineveh Plains or Duhok (Aqra) official boundary
      if (Number.isFinite(info.lat) && Number.isFinite(info.lng)) {
        const duhokProv = KURDISTAN_PROVINCES.find((p) => p.id === 'duhok')!;
        if (isPointInProvince(info.lat!, info.lng!, duhokProv)) {
          return { provinceId: duhokProv.id, provinceName: duhokProv.name, inKurdistan: true, province: duhokProv };
        }
        const sinjarProv = KURDISTAN_PROVINCES.find((p) => p.id === 'sinjar_nineveh')!;
        if (isPointInProvince(info.lat!, info.lng!, sinjarProv)) {
          return { provinceId: sinjarProv.id, provinceName: sinjarProv.name, inKurdistan: true, province: sinjarProv };
        }
      }
      // Otherwise Mosul / south Nineveh is outside Kurdistan border
      return {
        provinceId: 'outside_nineveh_mosul',
        provinceName: locRaw ? `${locRaw} (نەینەوا)` : 'نەینەوا (مووسڵ)',
        inKurdistan: false,
      };
    }

    if (a1.includes('diyala')) {
      const garmianKeywords = ['khanaqin', 'kifri', 'kalar', 'mandali', 'jalawla', 'saadiya', 'qaratapa', 'qoratu'];
      if (garmianKeywords.some((k) => a2.includes(k) || loc.includes(k))) {
        const prov = KURDISTAN_PROVINCES.find((p) => p.id === 'garmian_diyala')!;
        return { provinceId: prov.id, provinceName: prov.name, inKurdistan: true, province: prov };
      }
      if (Number.isFinite(info.lat) && Number.isFinite(info.lng)) {
        const gp = KURDISTAN_PROVINCES.find((p) => p.id === 'garmian_diyala')!;
        if (isPointInProvince(info.lat!, info.lng!, gp)) {
          return { provinceId: gp.id, provinceName: gp.name, inKurdistan: true, province: gp };
        }
      }
      return {
        provinceId: 'outside_diyala',
        provinceName: locRaw ? `${locRaw} (دیالە)` : 'دیالە',
        inKurdistan: false,
      };
    }

    if (a1.includes('saladin') || a1.includes('salah')) {
      if (a2.includes('tuz') || a2.includes('tooz') || loc.includes('tuz') || loc.includes('amirli')) {
        const prov = KURDISTAN_PROVINCES.find((p) => p.id === 'tuz_khurmatu')!;
        return { provinceId: prov.id, provinceName: prov.name, inKurdistan: true, province: prov };
      }
      if (Number.isFinite(info.lat) && Number.isFinite(info.lng)) {
        const tp = KURDISTAN_PROVINCES.find((p) => p.id === 'tuz_khurmatu')!;
        if (isPointInProvince(info.lat!, info.lng!, tp)) {
          return { provinceId: tp.id, provinceName: tp.name, inKurdistan: true, province: tp };
        }
      }
      return {
        provinceId: 'outside_saladin',
        provinceName: locRaw ? `${locRaw} (سەلاحەدین)` : 'سەلاحەدین',
        inKurdistan: false,
      };
    }

    if (a1.includes('wasit')) {
      if (a2.includes('badra') || loc.includes('badra') || loc.includes('jassan') || loc.includes('zurbatiya')) {
        const prov = KURDISTAN_PROVINCES.find((p) => p.id === 'badra_jassan')!;
        return { provinceId: prov.id, provinceName: prov.name, inKurdistan: true, province: prov };
      }
      if (Number.isFinite(info.lat) && Number.isFinite(info.lng)) {
        const bp = KURDISTAN_PROVINCES.find((p) => p.id === 'badra_jassan')!;
        if (isPointInProvince(info.lat!, info.lng!, bp)) {
          return { provinceId: bp.id, provinceName: bp.name, inKurdistan: true, province: bp };
        }
      }
      return {
        provinceId: 'outside_wasit',
        provinceName: locRaw ? `${locRaw} (واست)` : 'واست',
        inKurdistan: false,
      };
    }
  }

  // Sulaymaniyah vs Halabja vs Garmian (Halabja & Kalar sometimes appear under Sulaymaniyah in Google!)
  if (a1.includes('sulaymaniyah')) {
    if (
      a2.includes('halabja') ||
      loc.includes('halabja') ||
      loc.includes('khurmal') ||
      loc.includes('biyara') ||
      (Number.isFinite(info.lat) &&
        Number.isFinite(info.lng) &&
        isPointInProvince(info.lat!, info.lng!, KURDISTAN_PROVINCES.find((p) => p.id === 'halabja')!))
    ) {
      const prov = KURDISTAN_PROVINCES.find((p) => p.id === 'halabja')!;
      return { provinceId: prov.id, provinceName: prov.name, inKurdistan: true, province: prov };
    }
    if (
      a2.includes('kalar') ||
      a2.includes('kifri') ||
      loc.includes('kalar') ||
      loc.includes('kifri') ||
      (Number.isFinite(info.lat) &&
        Number.isFinite(info.lng) &&
        isPointInProvince(info.lat!, info.lng!, KURDISTAN_PROVINCES.find((p) => p.id === 'garmian_diyala')!))
    ) {
      const prov = KURDISTAN_PROVINCES.find((p) => p.id === 'garmian_diyala')!;
      return { provinceId: prov.id, provinceName: prov.name, inKurdistan: true, province: prov };
    }
  }

  // Syria split governorates (Aleppo -> Afrin / Kobani / Sheikh Maqsoud-Manbij; Raqqa -> Gire Spi)
  if (cc === 'SY' || a1.includes('aleppo') || a1.includes('raqqa') || a1.includes('hasakah')) {
    if (a1.includes('hasakah')) {
      const prov = KURDISTAN_PROVINCES.find((p) => p.id === 'hasakah')!;
      return { provinceId: prov.id, provinceName: prov.name, inKurdistan: true, province: prov };
    }
    if (a1.includes('raqqa')) {
      if (a2.includes('abyad') || loc.includes('abyad') || loc.includes('suluk') || loc.includes('issa')) {
        const prov = KURDISTAN_PROVINCES.find((p) => p.id === 'gire_spi')!;
        return { provinceId: prov.id, provinceName: prov.name, inKurdistan: true, province: prov };
      }
      if (Number.isFinite(info.lat) && Number.isFinite(info.lng)) {
        const gp = KURDISTAN_PROVINCES.find((p) => p.id === 'gire_spi')!;
        if (isPointInProvince(info.lat!, info.lng!, gp)) {
          return { provinceId: gp.id, provinceName: gp.name, inKurdistan: true, province: gp };
        }
      }
      return { provinceId: 'outside_raqqa', provinceName: 'ڕەققە', inKurdistan: false };
    }
    if (a1.includes('aleppo')) {
      if (a2.includes('afrin') || a2.includes('efrin') || loc.includes('afrin') || loc.includes('jindires') || loc.includes('rajo')) {
        const prov = KURDISTAN_PROVINCES.find((p) => p.id === 'afrin')!;
        return { provinceId: prov.id, provinceName: prov.name, inKurdistan: true, province: prov };
      }
      if (a2.includes('arab') || a2.includes('kobani') || loc.includes('kobani') || loc.includes('ain al-arab') || loc.includes('sarrin')) {
        const prov = KURDISTAN_PROVINCES.find((p) => p.id === 'kobani')!;
        return { provinceId: prov.id, provinceName: prov.name, inKurdistan: true, province: prov };
      }
      if (a2.includes('manbij') || a2.includes('azaz') || loc.includes('manbij') || loc.includes('rifaat') || loc.includes('sheikh maqsoud')) {
        const prov = KURDISTAN_PROVINCES.find((p) => p.id === 'sheikh_maqsoud_shahba')!;
        return { provinceId: prov.id, provinceName: prov.name, inKurdistan: true, province: prov };
      }
      if (Number.isFinite(info.lat) && Number.isFinite(info.lng)) {
        for (const id of ['afrin', 'kobani', 'sheikh_maqsoud_shahba']) {
          const p = KURDISTAN_PROVINCES.find((x) => x.id === id)!;
          if (isPointInProvince(info.lat!, info.lng!, p)) {
            return { provinceId: p.id, provinceName: p.name, inKurdistan: true, province: p };
          }
        }
      }
      return { provinceId: 'outside_aleppo', provinceName: 'حەلەب', inKurdistan: false };
    }
  }

  // Iran Khuzestan split (North Khuzestan: Izeh, Dezful, Shushtar, Masjed Soleyman, Andimeshk)
  if (cc === 'IR' && a1.includes('khuzestan')) {
    const northKhuzestan = ['izeh', 'masjed', 'dezful', 'shushtar', 'andimeshk', 'baghmalek', 'bagh-e malek', 'lali'];
    if (northKhuzestan.some((k) => a2.includes(k) || loc.includes(k))) {
      const prov = KURDISTAN_PROVINCES.find((p) => p.id === 'izeh_khuzestan')!;
      return { provinceId: prov.id, provinceName: prov.name, inKurdistan: true, province: prov };
    }
    if (Number.isFinite(info.lat) && Number.isFinite(info.lng)) {
      const ip = KURDISTAN_PROVINCES.find((p) => p.id === 'izeh_khuzestan')!;
      if (isPointInProvince(info.lat!, info.lng!, ip)) {
        return { provinceId: ip.id, provinceName: ip.name, inKurdistan: true, province: ip };
      }
    }
    return { provinceId: 'outside_khuzestan', provinceName: locRaw || 'خووزستان (ئەهواز)', inKurdistan: false };
  }

  // 2. Direct 1-to-1 match against googleAdmin1 across all 47 Kurdistan provinces
  if (a1) {
    for (const prov of KURDISTAN_PROVINCES) {
      if (prov.countryCode && cc && prov.countryCode !== cc) continue;
      const g1List = (prov.googleAdmin1 || []).map((g) => normalizeAdminString(g));
      if (g1List.some((g) => a1 === g || (g.length > 3 && a1.includes(g)))) {
        return { provinceId: prov.id, provinceName: prov.name, inKurdistan: true, province: prov };
      }
    }
  }

  // 3. Outside Kurdistan: construct clean name from OUTSIDE_PROVINCE_KURDISH_NAMES or raw Google Admin 1 / Locality
  const knownOutside =
    OUTSIDE_PROVINCE_KURDISH_NAMES[a1] ||
    OUTSIDE_PROVINCE_KURDISH_NAMES[a1Raw.toLowerCase()] ||
    OUTSIDE_PROVINCE_KURDISH_NAMES[loc];

  const displayOutsideName =
    knownOutside ||
    a1Raw
      .replace(/\s+Governorate$/i, '')
      .replace(/\s+Province$/i, '')
      .trim() ||
    locRaw ||
    (info.country || 'دەرەوەی هێڵی کوردستان');

  const outsideId = `outside_${normalizeKurdishSearchText(displayOutsideName).replace(/\s+/g, '_') || 'global'}`;
  return {
    provinceId: outsideId,
    provinceName: displayOutsideName,
    inKurdistan: false,
  };
}

// =========================================================================
// Geometric Polygon & Segment Distance Helpers
// =========================================================================

export function isPointInPolygon(lat: number, lng: number, polygon: [number, number][]): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect = yi > lng !== yj > lng && lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function isPointInProvince(lat: number, lng: number, prov: ProvinceItem): boolean {
  const rings =
    prov.polygons && prov.polygons.length > 0
      ? prov.polygons
      : prov.polygon && prov.polygon.length >= 3
      ? [prov.polygon]
      : [];
  for (const ring of rings) {
    if (isPointInPolygon(lat, lng, ring)) return true;
  }
  return false;
}

/**
 * پشکنینی کەوتنی خاڵێک لە ناو سنووری مێژوویی کوردستانی مەزن بەپێی پۆلیگۆنی نەخشە
 */
export function isPointInKurdistanPolygon(lat: number, lng: number): boolean {
  return isPointInPolygon(lat, lng, GREAT_KURDISTAN_POLYGON);
}

function pointToSegmentDistSq(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    return (px - ax) * (px - ax) + (py - ay) * (py - ay);
  }
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = ax + t * dx;
  const projY = ay + t * dy;
  return (px - projX) * (px - projX) + (py - projY) * (py - projY);
}

function distanceToProvinceEdgeSq(lat: number, lng: number, prov: ProvinceItem): number {
  const rings =
    prov.polygons && prov.polygons.length > 0
      ? prov.polygons
      : prov.polygon && prov.polygon.length >= 3
      ? [prov.polygon]
      : [];
  let minSq = Infinity;
  for (const polygon of rings) {
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const d = pointToSegmentDistSq(lat, lng, polygon[i][0], polygon[i][1], polygon[j][0], polygon[j][1]);
      if (d < minSq) minSq = d;
    }
  }
  return minSq;
}

/**
 * هێنانەوەی سنوورە لاکێشەییەکان (Bounds) بۆ زوومکردن لەسەر نەخشە
 */
export function getProvinceBounds(prov: ProvinceItem): [[number, number], [number, number]] {
  const rings =
    prov.polygons && prov.polygons.length > 0
      ? prov.polygons
      : prov.polygon && prov.polygon.length >= 3
      ? [prov.polygon]
      : [[prov.center]];
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const pts of rings) {
    for (const [la, ln] of pts) {
      if (la < minLat) minLat = la;
      if (la > maxLat) maxLat = la;
      if (ln < minLng) minLng = ln;
      if (ln > maxLng) maxLng = ln;
    }
  }
  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ];
}

const OUTSIDE_KURDISH_TO_ENGLISH: Array<[string, string]> = [
  ['بەغدا', 'Baghdad'],
  ['بەسڕە', 'Basra'],
  ['نەجەف', 'Najaf'],
  ['کەربەلا', 'Karbala'],
  ['بابل', 'Babylon'],
  ['ئەنبار', 'Al Anbar'],
  ['تاران', 'Tehran'],
  ['ئەسفەهان', 'Isfahan'],
  ['شیراز (فارس)', 'Shiraz (Fars)'],
  ['فارس (شیراز)', 'Fars (Shiraz)'],
  ['شیراز', 'Shiraz (Fars)'],
  ['ئازەربایجانی ڕۆژهەڵات (تەورێز)', 'East Azerbaijan (Tabriz)'],
  ['ئەردەبێڵ', 'Ardabil'],
  ['زەنجان', 'Zanjan'],
  ['قەزوین', 'Qazvin'],
  ['مەرکەزی', 'Markazi'],
  ['خوراسان', 'Khorasan'],
  ['دیمەشق', 'Damascus'],
  ['حەلەب', 'Aleppo'],
  ['ڕەققە', 'Raqqa'],
  ['خووزستان (ئەهواز)', 'Khuzestan (Ahvaz)'],
  ['قاهیرە', 'Cairo'],
  ['ئیستەنبوڵ', 'Istanbul'],
  ['ئەستەنبوڵ', 'Istanbul'],
  ['ئەنقەرە', 'Ankara'],
  ['ئیزمیر', 'Izmir'],
  ['ئەدەنە', 'Adana'],
  ['هاتای', 'Hatay'],
  ['ترابزۆن', 'Trabzon'],
  ['قۆنیا', 'Konya'],
  ['قەیسەری', 'Kayseri'],
  ['جنێڤ (سویسرا)', 'Geneva (Switzerland)'],
  ['لۆزان (سویسرا)', 'Lausanne (Switzerland)'],
  ['لۆزان', 'Lausanne (Switzerland)'],
  ['پاریس (فەڕەنسا)', 'Paris (France)'],
  ['پاریس', 'Paris (France)'],
  ['یەریڤان (ئەرمینیا)', 'Yerevan (Armenia)'],
  ['یەریڤان', 'Yerevan (Armenia)'],
  ['تبلیسی (جۆرجیا)', 'Tbilisi (Georgia)'],
  ['باکۆ (ئازەربایجان)', 'Baku (Azerbaijan)'],
  ['مۆسکۆ (ڕووسیا)', 'Moscow (Russia)'],
  ['مۆسکۆ', 'Moscow'],
  ['لەندەن (بەریتانیا)', 'London (UK)'],
  ['مەککە', 'Mecca'],
  ['مەدینە', 'Medina'],
  ['قودس', 'Jerusalem'],
  ['مووسڵ (نەینەوا)', 'Mosul (Nineveh)'],
  ['نەینەوا (مووسڵ)', 'Nineveh (Mosul)'],
  ['مووسڵ', 'Mosul (Nineveh)'],
  ['دیالە', 'Diyala'],
  ['سەلاحەدین', 'Saladin'],
  ['واست', 'Wasit'],
];

const OUTSIDE_ID_ENGLISH_MAP: Record<string, string> = {
  outside_nineveh_mosul: 'Mosul (Nineveh)',
  outside_diyala: 'Diyala',
  outside_saladin: 'Saladin',
  outside_wasit: 'Wasit',
  outside_raqqa: 'Raqqa',
  outside_aleppo: 'Aleppo',
  outside_khuzestan: 'Khuzestan (Ahvaz)',
};

function translateOutsideLabel(name: string, outsideId: string | undefined, lang: AppLanguage): string {
  if (lang !== 'en') return name;
  if (outsideId && OUTSIDE_ID_ENGLISH_MAP[outsideId]) {
    return OUTSIDE_ID_ENGLISH_MAP[outsideId];
  }
  const clean = (name || '').trim();
  for (const [ckb, en] of OUTSIDE_KURDISH_TO_ENGLISH) {
    if (clean === ckb || clean.includes(ckb)) {
      return en;
    }
  }
  if (clean === 'دەرەوەی هێڵی کوردستان' || clean === 'دەرەوەی کوردستان') {
    return 'Outside Kurdistan Borders';
  }
  return clean || 'Outside Kurdistan Borders';
}

function extractOutsideNameFromFact(fact: FactItem, lang: AppLanguage = 'ckb'): string {
  const r = (fact.region || '').trim();
  if (r) return translateOutsideLabel(r, fact.provinceId, lang);

  const n = (fact.name || '').trim();
  const parenMatch = n.match(/\(([^)]+)\)/);
  if (parenMatch && parenMatch[1]) {
    const inside = parenMatch[1].trim();
    if (
      inside &&
      !inside.includes('کوردستان') &&
      !inside.toLowerCase().includes('kurdistan') &&
      inside.length <= 32
    ) {
      return translateOutsideLabel(inside, fact.provinceId, lang);
    }
  }

  const externalCities: Array<[string, string, string]> = [
    ['بەغدا', 'بەغدا', 'Baghdad'],
    ['baghdad', 'بەغدا', 'Baghdad'],
    ['قاهیرە', 'قاهیرە', 'Cairo'],
    ['cairo', 'قاهیرە', 'Cairo'],
    ['تاران', 'تاران', 'Tehran'],
    ['tehran', 'تاران', 'Tehran'],
    ['دیمەشق', 'دیمەشق', 'Damascus'],
    ['damascus', 'دیمەشق', 'Damascus'],
    ['ئیستەنبوڵ', 'ئیستەنبوڵ', 'Istanbul'],
    ['ئەستەنبوڵ', 'ئیستەنبوڵ', 'Istanbul'],
    ['istanbul', 'ئیستەنبوڵ', 'Istanbul'],
    ['ئەنقەرە', 'ئەنقەرە', 'Ankara'],
    ['ankara', 'ئەنقەرە', 'Ankara'],
    ['لۆزان', 'لۆزان (سویسرا)', 'Lausanne (Switzerland)'],
    ['lausanne', 'لۆزان (سویسرا)', 'Lausanne (Switzerland)'],
    ['سویسرا', 'لۆزان (سویسرا)', 'Switzerland'],
    ['پاریس', 'پاریس (فەڕەنسا)', 'Paris (France)'],
    ['paris', 'پاریس (فەڕەنسا)', 'Paris (France)'],
    ['فڕەنسا', 'پاریس (فەڕەنسا)', 'Paris (France)'],
    ['فەڕەنسا', 'پاریس (فەڕەنسا)', 'Paris (France)'],
    ['شیراز', 'شیراز (فارس)', 'Shiraz (Fars)'],
    ['shiraz', 'شیراز (فارس)', 'Shiraz (Fars)'],
    ['ئەسفەهان', 'ئەسفەهان', 'Isfahan'],
    ['isfahan', 'ئەسفەهان', 'Isfahan'],
    ['مووسڵ', 'مووسڵ (نەینەوا)', 'Mosul (Nineveh)'],
    ['mosul', 'مووسڵ (نەینەوا)', 'Mosul (Nineveh)'],
    ['حەلەب', 'حەلەب', 'Aleppo'],
    ['aleppo', 'حەلەب', 'Aleppo'],
    ['بەسڕە', 'بەسڕە', 'Basra'],
    ['basra', 'بەسڕە', 'Basra'],
    ['مۆسکۆ', 'مۆسکۆ', 'Moscow'],
    ['moscow', 'مۆسکۆ', 'Moscow'],
    ['یەریڤان', 'یەریڤان', 'Yerevan'],
    ['yerevan', 'یەریڤان', 'Yerevan'],
  ];

  const d = (fact.desc || '').trim();
  const nLower = n.toLowerCase();
  const dLower = d.toLowerCase();
  for (const [kw, labelCkb, labelEn] of externalCities) {
    if (
      kurdishWordMatch(n, kw) ||
      kurdishWordMatch(d, kw) ||
      (/^[a-z]+$/i.test(kw) && (nLower.includes(kw) || dLower.includes(kw)))
    ) {
      return lang === 'en' ? labelEn : labelCkb;
    }
  }

  return lang === 'en' ? 'Outside Kurdistan Borders' : 'دەرەوەی هێڵی کوردستان';
}

export function matchFactToProvince(
  fact: FactItem,
  lang: AppLanguage = 'ckb'
):
  | ProvinceItem
  | {
      id: string;
      name: string;
      nameEn?: string;
      part: 'outside';
      partName: string;
      partNameEn?: string;
      inKurdistan: false;
      center: [number, number];
      zoom: number;
      aliases: string[];
    }
  | null {
  if (!fact) return null;

  const localizedProv = (p: ProvinceItem): ProvinceItem => ({
    ...p,
    name: lang === 'en' ? p.nameEn || PROVINCE_ENGLISH_NAMES[p.id] || p.name : p.name,
    partName: lang === 'en' ? p.partNameEn || PART_ENGLISH_NAMES[p.part] : p.partName,
  });

  // 1. Explicit stored provinceId
  if (fact.provinceId) {
    const exactProv = KURDISTAN_PROVINCES.find((p) => p.id === fact.provinceId);
    if (exactProv) return localizedProv(exactProv);

    if (fact.provinceId.startsWith('outside_')) {
      const outsideName = extractOutsideNameFromFact(fact, lang);
      return {
        id: fact.provinceId,
        name: outsideName,
        nameEn: outsideName,
        part: 'outside',
        partName: lang === 'en' ? PART_ENGLISH_NAMES.outside : PART_KURDISH_NAMES.outside,
        partNameEn: PART_ENGLISH_NAMES.outside,
        inKurdistan: false,
        center: [fact.lat || 33.31, fact.lng || 44.36],
        zoom: 7,
        aliases: [outsideName],
      };
    }
  }

  const hasValidCoords =
    Number.isFinite(fact.lat) &&
    Number.isFinite(fact.lng) &&
    !(fact.lat === 0 && fact.lng === 0);

  // 2. Cached Google Maps Geocoding administrative resolution for these exact coordinates
  if (hasValidCoords) {
    const cachedGoogle = getCachedGoogleProvince(fact.lat, fact.lng);
    if (cachedGoogle) {
      if (cachedGoogle.inKurdistan) {
        const prov = KURDISTAN_PROVINCES.find((p) => p.id === cachedGoogle.provinceId);
        if (prov) return localizedProv(prov);
      } else {
        const dispName = translateOutsideLabel(cachedGoogle.provinceName, cachedGoogle.provinceId, lang);
        return {
          id: cachedGoogle.provinceId,
          name: dispName,
          nameEn: dispName,
          part: 'outside',
          partName: lang === 'en' ? PART_ENGLISH_NAMES.outside : PART_KURDISH_NAMES.outside,
          partNameEn: PART_ENGLISH_NAMES.outside,
          inKurdistan: false,
          center: [fact.lat, fact.lng],
          zoom: 7,
          aliases: [dispName],
        };
      }
    }
  }

  // 3. Explicit fact.region (only the structured region field, never random paragraph mentions!)
  const r = (fact.region || '').trim();
  if (r) {
    const rLower = r.toLowerCase();
    for (const prov of KURDISTAN_PROVINCES) {
      if (
        kurdishWordMatch(r, prov.name) ||
        kurdishSearchMatch(prov.name, r) ||
        (prov.nameEn && rLower.includes(prov.nameEn.toLowerCase()))
      ) {
        return localizedProv(prov);
      }
      for (const alias of prov.aliases) {
        if (kurdishWordMatch(r, alias) || rLower.includes(alias.toLowerCase())) {
          return localizedProv(prov);
        }
      }
    }
  }

  // 4. Official Administrative GeoJSON Polygon Point-in-Polygon Check
  if (hasValidCoords) {
    const matchedPolygons: ProvinceItem[] = [];
    for (const prov of KURDISTAN_PROVINCES) {
      if (isPointInProvince(fact.lat, fact.lng, prov)) {
        matchedPolygons.push(prov);
      }
    }

    if (matchedPolygons.length === 1) {
      return localizedProv(matchedPolygons[0]);
    }

    if (matchedPolygons.length > 1) {
      let best = matchedPolygons[0];
      let bestDistSq = Infinity;
      for (const p of matchedPolygons) {
        const dLat = fact.lat - p.center[0];
        const dLng = fact.lng - p.center[1];
        const d = dLat * dLat + dLng * dLng;
        if (d < bestDistSq) {
          bestDistSq = d;
          best = p;
        }
      }
      return localizedProv(best);
    }

    let closestProv: ProvinceItem | null = null;
    let minEdgeDistSq = Infinity;

    for (const prov of KURDISTAN_PROVINCES) {
      const edgeDistSq = distanceToProvinceEdgeSq(fact.lat, fact.lng, prov);
      if (edgeDistSq < minEdgeDistSq) {
        minEdgeDistSq = edgeDistSq;
        closestProv = prov;
      }
    }

    if (closestProv && minEdgeDistSq < 0.0006) {
      return localizedProv(closestProv);
    }
  }

  // 5. Fallback when coordinates are missing/default (NOT overriding valid outside coordinates!)
  if (!hasValidCoords) {
    const n = (fact.name || '').trim();
    const nLower = n.toLowerCase();
    for (const prov of KURDISTAN_PROVINCES) {
      if (kurdishWordMatch(n, prov.name) || (prov.nameEn && nLower.includes(prov.nameEn.toLowerCase()))) {
        return localizedProv(prov);
      }
      for (const alias of prov.aliases) {
        if (kurdishWordMatch(n, alias)) return localizedProv(prov);
      }
    }
  }

  // 6. Outside Kurdistan
  const outsideNameCkb = extractOutsideNameFromFact(fact, 'ckb');
  const outsideName = extractOutsideNameFromFact(fact, lang);
  const outsideId = `outside_${normalizeKurdishSearchText(outsideNameCkb).replace(/\s+/g, '_') || 'global'}`;

  return {
    id: outsideId,
    name: outsideName,
    nameEn: outsideName,
    part: 'outside',
    partName: lang === 'en' ? PART_ENGLISH_NAMES.outside : PART_KURDISH_NAMES.outside,
    partNameEn: PART_ENGLISH_NAMES.outside,
    inKurdistan: false,
    center: [fact.lat || 33.31, fact.lng || 44.36],
    zoom: 7,
    aliases: [outsideName],
  };
}

/**
 * ژماردن و ئامادەکردنی سەرجەم پارێزگاکان:
 * - ٤٧ پارێزگای کوردستان هەموویان نیشاندەدرێن تەنانەت ئەگەر ٠ داتایشیان هەبێت.
 * - پارێزگا یان شوێنەکانی دەرەوەی هێڵی کوردستان تەنها کاتێک دەردەکەون کە خاوەنی لانیکەم ١ داتا بن (count >= 1).
 */
export function getProvincesWithCounts(
  facts: FactItem[],
  lang: AppLanguage = 'ckb'
): {
  allProvinces: Array<ProvinceItem & { count: number }>;
  kurdistanProvinces: Array<ProvinceItem & { count: number }>;
  outsideProvinces: Array<ProvinceItem & { count: number }>;
  totalFacts: number;
} {
  const countsMap = new Map<string, number>();
  const outsideMap = new Map<string, ProvinceItem & { count: number }>();

  KURDISTAN_PROVINCES.forEach((p) => {
    countsMap.set(p.id, 0);
  });

  facts.forEach((fact) => {
    const matched = matchFactToProvince(fact, lang);
    if (!matched) return;

    if (matched.inKurdistan) {
      countsMap.set(matched.id, (countsMap.get(matched.id) || 0) + 1);
    } else {
      const existing = outsideMap.get(matched.id);
      if (existing) {
        existing.count += 1;
      } else {
        outsideMap.set(matched.id, {
          ...(matched as ProvinceItem),
          count: 1,
        });
      }
    }
  });

  const kurdistanList: Array<ProvinceItem & { count: number }> = KURDISTAN_PROVINCES.map((p) => ({
    ...p,
    name: lang === 'en' ? p.nameEn || PROVINCE_ENGLISH_NAMES[p.id] || p.name : p.name,
    partName: lang === 'en' ? p.partNameEn || PART_ENGLISH_NAMES[p.part] : p.partName,
    count: countsMap.get(p.id) || 0,
  }));

  const outsideList: Array<ProvinceItem & { count: number }> = Array.from(outsideMap.values()).filter(
    (p) => p.count >= 1
  );

  return {
    allProvinces: [...kurdistanList, ...outsideList],
    kurdistanProvinces: kurdistanList,
    outsideProvinces: outsideList,
    totalFacts: facts.length,
  };
}

/**
 * فلتەرکردنی کۆمەڵێک فاکت بەپێی پارێزگای دیاریکراو
 */
export function filterFactsByProvince(facts: FactItem[], provinceId: string): FactItem[] {
  if (!provinceId || provinceId === 'all') return facts;

  return facts.filter((fact) => {
    const matched = matchFactToProvince(fact);
    return matched ? matched.id === provinceId : false;
  });
}
