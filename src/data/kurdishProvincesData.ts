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
  shortName?: string;
  shortNameEn?: string;
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
 * ٤٠ پارێزگا و ناوچەی سەرەکی کوردستانی مەزن (باشوور، باکوور، ڕۆژهەڵات، ڕۆژئاوا)
 * لەسەر شێوازی نەخشەی کوردستانی مەزن (دەریای ناوەڕاست تا کەنداوی فارسی)
 */
const KURDISTAN_PROVINCES_BASE: ProvinceItem[] = [
  // ================= باشووری کوردستان (٦ پارێزگا و ناوچە) =================
  {
    id: 'erbil',
    name: 'هەولێر',
    shortName: 'هەولێر',
    shortNameEn: 'Hawler',
    part: 'south',
    partName: 'باشووری کوردستان',
    inKurdistan: true,
    countryCode: 'IQ',
    center: [36.1912, 44.0091],
    zoom: 9,
    googleAdmin1: ['erbil governorate', 'erbil', 'arbil', 'hawler', 'hewler', 'پارێزگای هەولێر', 'محافظة أربيل'],
    googleAdmin2: ['erbil', 'soran', 'shaqlawa', 'koya', 'koysinjaq', 'choman', 'mergasor', 'khabat', 'makhmur', 'rawanduz', 'dashti hawler'],
    aliases: ['هەولێر', 'اربیل', 'Erbil', 'Hewlêr', 'Hawler', 'هەولیر', 'ڕەواندز', 'شەقڵاوە', 'کۆیە', 'سۆران', 'چۆمان', 'مێرگەسۆر', 'خەبات', 'مەخموور', 'بارزان'],
  },
  {
    id: 'sulaymaniyah',
    name: 'سلێمانی (و هەڵەبجە)',
    shortName: 'سلێمانی',
    shortNameEn: 'Slemani',
    part: 'south',
    partName: 'باشووری کوردستان',
    inKurdistan: true,
    countryCode: 'IQ',
    center: [35.5615, 45.4354],
    zoom: 9,
    googleAdmin1: ['sulaymaniyah governorate', 'sulaymaniyah', 'as sulaymaniyah', 'slemani', 'halabja governorate', 'halabja', 'helebce', 'پارێزگای سلێمانی', 'محافظة السليمانية', 'پارێزگای هەڵەبجە'],
    googleAdmin2: ['sulaymaniyah', 'chamchamal', 'dukan', 'dokan', 'ranya', 'pishdar', 'qaladize', 'penjwin', 'sharbazher', 'mawat', 'qaradagh', 'sayed sadiq', 'darbandikhan', 'halabja', 'khurmal', 'biyara', 'sirwan', 'tawela', 'hawraman'],
    aliases: ['سلێمانی', 'السليمانية', 'Sulaymaniyah', 'Silêmanî', 'Slemani', 'سلیمانی', 'هەڵەبجە', 'حلبجة', 'Halabja', 'هەورامان', 'شارباژێڕ', 'پشدەر', 'قەڵادزێ', 'ڕانیە', 'دووکان', 'دەربەندیخان', 'پێنجوێن', 'سەیدسادق', 'ماوەت', 'چەمچەماڵ', 'قەرەداغ'],
  },
  {
    id: 'duhok',
    name: 'دهۆک',
    shortName: 'دهۆک',
    shortNameEn: 'Duhok',
    part: 'south',
    partName: 'باشووری کوردستان',
    inKurdistan: true,
    countryCode: 'IQ',
    center: [36.8679, 43.05],
    zoom: 9,
    googleAdmin1: ['duhok governorate', 'duhok', 'dohuk', 'dahuk', 'dihok', 'پارێزگای دهۆک', 'محافظة دهوك'],
    googleAdmin2: ['duhok', 'zakho', 'amedi', 'amadiya', 'akre', 'aqrah', 'bardarash', 'sumel', 'semel'],
    aliases: ['دهۆک', 'دهوك', 'Duhok', 'Dihok', 'زاخۆ', 'ئامێدی', 'ئاکرێ', 'بەردەڕەش', 'سێمێل'],
  },
  {
    id: 'kirkuk',
    name: 'کەرکووک',
    shortName: 'کەرکووک',
    shortNameEn: 'Kirkuk',
    part: 'south',
    partName: 'باشووری کوردستان',
    inKurdistan: true,
    countryCode: 'IQ',
    center: [35.42, 44.32],
    zoom: 9,
    googleAdmin1: ['kirkuk governorate', 'kirkuk', 'at-ta\'mim', 'tamin', 'پارێزگای کەرکووک', 'محافظة كركوك'],
    googleAdmin2: ['kirkuk', 'daquq', 'hawija', 'dibis', 'altun kupri', 'tuz khurmatu', 'tooz'],
    aliases: ['کەرکووک', 'کەرکوک', 'کرکوک', 'Kirkuk', 'Kerkûk', 'داقووق', 'حەویجە', 'دووبز', 'لەیلان', 'قەرەهەنجیر', 'ئالتون کۆپری', 'خورماتوو', 'طوزخورماتو'],
  },
  {
    id: 'garmian_diyala',
    name: 'خانەقین و گەرمیان (بەدرە و جەسان)',
    shortName: 'خانەقین',
    shortNameEn: 'Xanaqeen',
    part: 'south',
    partName: 'باشووری کوردستان',
    inKurdistan: true,
    countryCode: 'IQ',
    center: [34.05, 45.48],
    zoom: 8,
    googleAdmin1: ['diyala governorate', 'diyala', 'garmian', 'wasit governorate', 'wasit', 'saladin governorate', 'پارێزگای دیالە', 'محافظة ديالى', 'محافظة واسط'],
    googleAdmin2: ['kalar', 'kifri', 'khanaqin', 'mandali', 'jalawla', 'saadiya', 'qaratapa', 'badra', 'jassan', 'zurbatiya', 'tooz', 'tuz khurmatu'],
    aliases: ['خانەقین', 'گەرمیان', 'کفری', 'کەلار', 'مەندەلی', 'جەلەولا', 'قۆڕەتوو', 'قەرەتەپە', 'دیالە', 'بەدرە', 'جەسان', 'زرباتیە', 'واست', 'خورماتوو', 'Khanaqin', 'Xanaqeen', 'Garmian', 'Badra', 'Jassan', 'سەعدیە'],
  },
  {
    id: 'sinjar_nineveh',
    name: 'مووسڵ (شنگال و دەشتی نەینەوا)',
    shortName: 'مووسڵ',
    shortNameEn: 'Musill',
    part: 'south',
    partName: 'باشووری کوردستان',
    inKurdistan: true,
    countryCode: 'IQ',
    center: [36.38, 42.48],
    zoom: 8,
    googleAdmin1: ['nineveh governorate', 'ninawa governorate', 'nineveh', 'mosul', 'پارێزگای نەینەوا', 'محافظة نينوى'],
    googleAdmin2: ['sinjar', 'al-shikhan', 'sheikhan', 'tel keif', 'tel keppe', 'al-hamdaniya', 'tal afar', 'zummar', 'bashiqa', 'alqosh', 'ba\'aj', 'mosul'],
    aliases: ['مووسڵ', 'موسڵ', 'الموصل', 'شنگال', 'سنجار', 'Musill', 'Mosul', 'Sinjar', 'دەشتی نەینەوا', 'بەعشیقە', 'تەلکێف', 'حەمدانیە', 'قەرەقۆش', 'ئەلقۆش', 'تەلعەفەر', 'زومار', 'ئێزیدخان'],
  },

  // ================= باکووری کوردستان (٢٣ پارێزگا) =================
  {
    id: 'kars',
    name: 'قارس',
    shortName: 'قارس',
    shortNameEn: 'Kars',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [40.39, 42.98],
    zoom: 9,
    googleAdmin1: ['kars', 'kars province', 'kars ili'],
    aliases: ['قارس', 'کارس', 'قەرس', 'Kars', 'Qers', 'ساریکامیش', 'قاقزمان', 'دیگۆر', 'سوسوز', 'ئارپاچای', 'ئاکیەکا', 'سەلیم'],
  },
  {
    id: 'sivas',
    name: 'سیواس',
    shortName: 'سیواس',
    shortNameEn: 'Sivas',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [39.55, 37.18],
    zoom: 8,
    googleAdmin1: ['sivas', 'sivas province', 'sivas ili'],
    aliases: ['سیواس', 'سێواس', 'Sivas', 'Sêwas', 'Sewas', 'کۆچگری', 'دیڤریگی', 'زارا', 'ئیمرانلی', 'کانگال', 'گورون', 'حەفیك'],
  },
  {
    id: 'erzincan',
    name: 'ئەرزنگان',
    shortName: 'ئەرزنگان',
    shortNameEn: 'Azerinjan',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [39.68, 39.48],
    zoom: 9,
    googleAdmin1: ['erzincan', 'erzincan province'],
    aliases: ['ئەرزنگان', 'ئەرزنجان', 'Erzincan', 'Erzîngan', 'Azerinjan', 'کەماخ', 'تەرجان', 'ئیلیچ', 'ڕەفاهیە', 'چاییرلی'],
  },
  {
    id: 'erzurum',
    name: 'ئەرزڕۆم',
    shortName: 'ئەرزڕۆم',
    shortNameEn: 'Arzerrom',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [39.98, 41.38],
    zoom: 8,
    googleAdmin1: ['erzurum', 'erzurum province'],
    aliases: ['ئەرزڕۆم', 'ئەرزەرۆم', 'ارزروم', 'Erzurum', 'Erzerom', 'Arzerrom', 'خنووس', 'قەرەچۆبان', 'تەرمان', 'شێنکایا', 'تەکمان'],
  },
  {
    id: 'igdir',
    name: 'ئیدر',
    shortName: 'ئیدر',
    shortNameEn: 'Egdir',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [39.92, 44.05],
    zoom: 9,
    googleAdmin1: ['ığdır', 'igdir', 'ığdır province', 'igdir province'],
    aliases: ['ئیدر', 'ئیغدیر', 'Igdir', 'Îdir', 'Egdir', 'تووزلوجا', 'ئارالک'],
  },
  {
    id: 'agri',
    name: 'ئاگری',
    shortName: 'ئاگری',
    shortNameEn: 'Agiree',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [39.58, 43.18],
    zoom: 9,
    googleAdmin1: ['ağrı', 'agri', 'ağrı province', 'agri province'],
    aliases: ['ئاگری', 'ئارارات', 'Agri', 'Agirî', 'Agiree', 'بایەزید', 'بازید', 'دۆغوبایەزید', 'پاتنۆس', 'دیادین', 'گیادین', 'توتەک', 'ئەلشکیرت'],
  },
  {
    id: 'dersim',
    name: 'دێرسم (تونجەلی)',
    shortName: 'دێرسم',
    shortNameEn: 'Dersim',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [39.14, 39.56],
    zoom: 9,
    googleAdmin1: ['tunceli', 'tunceli province', 'dersim'],
    aliases: ['دێرسم', 'دەرسیم', 'تونجەلی', 'Dersim', 'Tunceli', 'پردیسوور', 'خۆزات', 'نازمیە', 'مازگرت', 'چەمیشگەزەک', 'پولور'],
  },
  {
    id: 'bingol',
    name: 'چەولیگ (بینگۆل)',
    shortName: 'بینگۆل',
    shortNameEn: 'Bingoll',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [38.96, 40.58],
    zoom: 9,
    googleAdmin1: ['bingöl', 'bingol', 'bingöl province', 'bingol province'],
    aliases: ['چەولیگ', 'بینگۆل', 'Cewlik', 'Bingol', 'Bingoll', 'داراهێنێ', 'کانیرەش', 'کیغی', 'یەدیسو', 'گەنچ'],
  },
  {
    id: 'mus',
    name: 'مووش',
    shortName: 'مووش',
    shortNameEn: 'Mush',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [38.96, 41.82],
    zoom: 9,
    googleAdmin1: ['muş', 'mus', 'muş province', 'mus province'],
    aliases: ['مووش', 'Mus', 'Mûs', 'Mush', 'مەلازگرد', 'گۆمگۆم', 'قۆپ', 'وارتۆ'],
  },
  {
    id: 'van',
    name: 'وان',
    shortName: 'وان',
    shortNameEn: 'Wan',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [38.52, 43.52],
    zoom: 9,
    googleAdmin1: ['van', 'van province'],
    aliases: ['وان', 'Van', 'Wan', 'دەریاچەی وان', 'تووشپا', 'ئەردیش', 'مورادیە', 'باشکەلا', 'گێڤاش', 'ئۆزالپ'],
  },
  {
    id: 'malatya',
    name: 'مەلاتیە',
    shortName: 'مەلاتیە',
    shortNameEn: 'Melatiya',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [38.42, 38.18],
    zoom: 9,
    googleAdmin1: ['malatya', 'malatya province'],
    aliases: ['مەلاتیە', 'مەلاتیا', 'Malatya', 'Meletî', 'Melatiya', 'خەربووت', 'دارەندە', 'ئارگۆڤان', 'پۆتورگە', 'ئەکچەداغ'],
  },
  {
    id: 'elazig',
    name: 'خارپێت (ئەلازیغ)',
    shortName: 'ئەلازیغ',
    shortNameEn: 'Alazeegh',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [38.68, 39.32],
    zoom: 9,
    googleAdmin1: ['elazığ', 'elazig', 'elazığ province', 'elazig province'],
    aliases: ['خارپێت', 'ئەلازیغ', 'Xarpet', 'Elazig', 'Alazeegh', 'پالو', 'قۆڤانجلار', 'مادەن', 'کەبان', 'باژار', 'قەرەکۆچان'],
  },
  {
    id: 'amed',
    name: 'ئامەد (دیاربەکر)',
    shortName: 'ئامەد',
    shortNameEn: 'Amed',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [38.05, 40.15],
    zoom: 9,
    googleAdmin1: ['diyarbakır', 'diyarbakir', 'diyarbakır province', 'diyarbakir province'],
    aliases: ['ئامەد', 'دیاربەکر', 'دیاربکر', 'Amed', 'Diyarbakir', 'Diyarbekir', 'فارقین', 'سلیڤان', 'بیسمل', 'ئەرغەنی', 'لیجە', 'سلێڤان'],
  },
  {
    id: 'batman',
    name: 'باتمان',
    shortName: 'باتمان',
    shortNameEn: 'Batman',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [38.02, 41.32],
    zoom: 9,
    googleAdmin1: ['batman', 'batman province'],
    aliases: ['باتمان', 'ئێلح', 'Batman', 'Êlih', 'حەسەنکێف', 'قوبین', 'کۆزلۆک', 'ساسۆن'],
  },
  {
    id: 'bitlis',
    name: 'بەدلیس',
    shortName: 'بەدلیس',
    shortNameEn: 'Bedlis',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [38.48, 42.32],
    zoom: 9,
    googleAdmin1: ['bitlis', 'bitlis province'],
    aliases: ['بەدلیس', 'Bitlis', 'Bedlis', 'Bedlîs', 'خەڵات', 'تەتوان', 'نۆڕشین', 'مۆتکی', 'خیزان', 'ئەخڵات'],
  },
  {
    id: 'maras',
    name: 'مەرعەش',
    shortName: 'مەرعەش',
    shortNameEn: "Mer'ash",
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [37.82, 37.05],
    zoom: 9,
    googleAdmin1: ['kahramanmaraş', 'kahramanmaras', 'maras', 'kahramanmaraş province'],
    aliases: ['مەرعەش', 'قەهرەمانمەرعەش', 'Maras', "Mer'ash", 'Kahramanmaras', 'ئەلبستان', 'پازارچیک', 'ئەفشین', 'گۆکسون'],
  },
  {
    id: 'urfa',
    name: 'ڕحا (ئورفا)',
    shortName: 'ئورفا',
    shortNameEn: 'Urfa',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [37.32, 38.92],
    zoom: 9,
    googleAdmin1: ['şanlıurfa', 'sanliurfa', 'urfa', 'şanlıurfa province', 'sanliurfa province', 'adıyaman', 'adiyaman'],
    aliases: ['ڕحا', 'ئورفا', 'شانلی ئورفا', 'سەمسوور', 'ئادیامان', 'Riha', 'Urfa', 'Sanliurfa', 'حەڕان', 'سوێرەک', 'وێرانشار', 'بێریجیک', 'پرسیوس'],
  },
  {
    id: 'mardin',
    name: 'ماردین',
    shortName: 'ماردین',
    shortNameEn: 'Mardeen',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [37.34, 40.82],
    zoom: 9,
    googleAdmin1: ['mardin', 'mardin province'],
    aliases: ['ماردین', 'Mardin', 'Mardeen', 'Mêrdîn', 'نسێبین', 'میدیات', 'قۆسەر', 'دێرک چیا', 'ستەور', 'کەربۆران'],
  },
  {
    id: 'siirt',
    name: 'سێرت',
    shortName: 'سێرت',
    shortNameEn: 'Sert',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [37.92, 42.08],
    zoom: 9,
    googleAdmin1: ['siirt', 'siirt province'],
    aliases: ['سێرت', 'سێرتە', 'Siirt', 'Sert', 'Sêrt', 'هاڤێل', 'دێھ', 'شێروان', 'میسریج', 'بەرواری'],
  },
  {
    id: 'sirnak',
    name: 'شڕنەخ',
    shortName: 'شڕنەخ',
    shortNameEn: 'Shirnax',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [37.48, 42.52],
    zoom: 9,
    googleAdmin1: ['şırnak', 'sirnak', 'şırnak province', 'sirnak province'],
    aliases: ['شڕنەخ', 'شیرناخ', 'Sirnak', 'Shirnax', 'Şirnex', 'جزیرە', 'سلۆپی', 'ئیدل', 'قڵابان', 'بەسەباب', 'حەزەخ'],
  },
  {
    id: 'hakkari',
    name: 'جۆلەمێرگ (حەکاری)',
    shortName: 'حەکاری',
    shortNameEn: 'Hekari',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [37.48, 43.92],
    zoom: 9,
    googleAdmin1: ['hakkâri', 'hakkari', 'hakkâri province', 'hakkari province'],
    aliases: ['جۆلەمێرگ', 'حەکاری', 'هەکاری', 'Colemêrg', 'Hakkari', 'Hekari', 'گەڤەر', 'شەمزینان', 'چەلێ', 'یوکسێکۆڤا'],
  },
  {
    id: 'gaziantep',
    name: 'دیلۆک (گازی عەنتاب)',
    shortName: 'گازی عەنتاب',
    shortNameEn: 'Gazi Antab',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [37.08, 37.28],
    zoom: 9,
    googleAdmin1: ['gaziantep', 'gaziantep province', 'kilis', 'kilis province'],
    aliases: ['دیلۆک', 'عەنتاب', 'گازی عەنتاب', 'گازیعەنتاب', 'Dilok', 'Gaziantep', 'Gazi Antab', 'نێزیپ', 'ئیسلاحیە', 'کارکامیش'],
  },
  {
    id: 'askadrome',
    name: 'ئەسکەندەروون (هاتای)',
    shortName: 'ئەسکەندەروون',
    shortNameEn: 'Askadrome',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    countryCode: 'TR',
    center: [36.48, 36.22],
    zoom: 9,
    googleAdmin1: ['hatay', 'hatay province', 'iskenderun', 'alexandretta'],
    googleAdmin2: ['iskenderun', 'samandag', 'antakya', 'dortyol', 'arsuz', 'payas', 'erzin', 'kirikhan', 'hassa', 'reyhanli'],
    aliases: ['ئەسکەندەروون', 'هاتای', 'ئەلێکساندرێتا', 'Askadrome', 'Iskenderun', 'İskenderun', 'Hatay', 'Alexandretta', 'دەریای ناوەڕاست', 'سەمەنداغ', 'ئەنتاکیا', 'دۆرتیۆل'],
  },

  // ================= ڕۆژهەڵاتی کوردستان (٨ پارێزگا) =================
  {
    id: 'urmia',
    name: 'ورمێ',
    shortName: 'ورمێ',
    shortNameEn: 'Wrme',
    part: 'east',
    partName: 'ڕۆژهەڵاتی کوردستان',
    inKurdistan: true,
    countryCode: 'IR',
    center: [37.25, 45.28],
    zoom: 8,
    googleAdmin1: ['west azerbaijan province', 'west azerbaijan', 'استان آذربایجان غربی'],
    aliases: ['ورمێ', 'ارومیە', 'Urmia', 'Wrme', 'Wirmê', 'مەهاباد', 'بۆکان', 'پیرانشار', 'سەردەشت', 'شنۆ', 'خۆی', 'ماکۆ', 'سەڵماس', 'نەغەدە', 'تیکاب', 'چاڵدێران', 'پۆلدەشت', 'ڕەبەت'],
  },
  {
    id: 'sanandaj',
    name: 'سنە (کوردستان)',
    shortName: 'سنە',
    shortNameEn: 'Sinna',
    part: 'east',
    partName: 'ڕۆژهەڵاتی کوردستان',
    inKurdistan: true,
    countryCode: 'IR',
    center: [35.58, 46.92],
    zoom: 9,
    googleAdmin1: ['kurdistan province', 'kurdistan', 'kordestan', 'استان کردستان'],
    aliases: ['سنە', 'سنندج', 'Sanandaj', 'Sinna', 'Sine', 'مەریوان', 'سەقز', 'بانە', 'دیواندەرە', 'قوروە', 'بیجاڕ', 'کامێران', 'سەوڵاوا'],
  },
  {
    id: 'hamedan',
    name: 'هەمەدان',
    shortName: 'هەمەدان',
    shortNameEn: 'Hemedan',
    part: 'east',
    partName: 'ڕۆژهەڵاتی کوردستان',
    inKurdistan: true,
    countryCode: 'IR',
    center: [34.82, 48.55],
    zoom: 9,
    googleAdmin1: ['hamadan province', 'hamadan', 'hamedan', 'استان همدان'],
    aliases: ['هەمەدان', 'همدان', 'Hamedan', 'Hemedan', 'Hamadan', 'ئەکباتانا', 'مەلایێر', 'نەهاوەند', 'تووسرکان', 'کەبوودەرئاهەنگ', 'ئەسەدئاباد'],
  },
  {
    id: 'kermanshah',
    name: 'کرماشان',
    shortName: 'کرماشان',
    shortNameEn: 'Kirmashan',
    part: 'east',
    partName: 'ڕۆژهەڵاتی کوردستان',
    inKurdistan: true,
    countryCode: 'IR',
    center: [34.36, 46.88],
    zoom: 9,
    googleAdmin1: ['kermanshah province', 'kermanshah', 'استان کرمانشاه'],
    aliases: ['کرماشان', 'کرمانشاه', 'Kermanshah', 'Kirmashan', 'قەسری شیرین', 'سەرپێڵی زەهاو', 'ئیسلام ئاباد', 'پاوە', 'جوانڕۆ', 'ڕەوانسەر', 'گیڵانغەرب', 'کەنگاوەر', 'سونقوڕ', 'سەحنە', 'بێستوون', 'کرند'],
  },
  {
    id: 'ilam',
    name: 'ئیلام',
    shortName: 'ئیلام',
    shortNameEn: 'Elam',
    part: 'east',
    partName: 'ڕۆژهەڵاتی کوردستان',
    inKurdistan: true,
    countryCode: 'IR',
    center: [33.25, 46.88],
    zoom: 9,
    googleAdmin1: ['ilam province', 'ilam', 'استان ایلام'],
    aliases: ['ئیلام', 'ایلام', 'Ilam', 'Elam', 'Îlam', 'دەهلۆڕان', 'مێهران', 'ئەیوان', 'ئابدانان', 'دەرەشار', 'شیروان چەردەڤۆڵ', 'مەلەکشاهی'],
  },
  {
    id: 'lorestan',
    name: 'لوڕستان (خورەماوە)',
    shortName: 'لوڕستان',
    shortNameEn: 'Lurrstan Xuram Abad',
    part: 'east',
    partName: 'ڕۆژهەڵاتی کوردستان',
    inKurdistan: true,
    countryCode: 'IR',
    center: [33.48, 48.55],
    zoom: 8,
    googleAdmin1: ['lorestan province', 'lorestan', 'luristan', 'استان لرستان'],
    aliases: ['لوڕستان', 'لرستان', 'خورەماوە', 'خوڕەم ئاباد', 'Lorestan', 'Lurrstan', 'Xuram Abad', 'Khorramabad', 'بۆڕوجێرد', 'کۆیەشت', 'ئەلیگودەرز', 'دووروود', 'نوورئاباد', 'ئەزنا', 'پۆلدوختەر', 'شوانکارە', 'ئەلشتر'],
  },
  {
    id: 'chaharmahal',
    name: 'شەهریکورد (چوارمەحاڵ و بەختیاری)',
    shortName: 'شەهریکورد',
    shortNameEn: 'Shehri Kurd',
    part: 'east',
    partName: 'ڕۆژهەڵاتی کوردستان',
    inKurdistan: true,
    countryCode: 'IR',
    center: [32.02, 50.62],
    zoom: 9,
    googleAdmin1: ['chaharmahal and bakhtiari province', 'chaharmahal and bakhtiari', 'استان چهارمحال و بختیاری'],
    aliases: ['شەهریکورد', 'چوارمەحاڵ', 'بەختیاری', 'چهارمحال و بختیاری', 'Shehri Kurd', 'Shahrekord', 'Chaharmahal', 'Bakhtiari', 'لۆردێگان', 'بۆرووجن', 'فارسان', 'کوهرەنگ'],
  },
  {
    id: 'izeh_khuzestan',
    name: 'دێزفوول (باکووری خووزستان)',
    shortName: 'دێزفوول',
    shortNameEn: 'Dezful',
    part: 'east',
    partName: 'ڕۆژهەڵاتی کوردستان',
    inKurdistan: true,
    countryCode: 'IR',
    center: [31.55, 49.08],
    zoom: 8,
    googleAdmin1: ['khuzestan province', 'khuzestan', 'استان خوزستان'],
    googleAdmin2: ['izeh', 'masjed soleyman', 'dezful', 'shushtar', 'andimeshk', 'baghmalek', 'lali', 'ramhormoz', 'behbahan', 'mahshahr', 'bandar-e mahshahr', 'hendijan'],
    aliases: ['دێزفوول', 'ئیزە', 'خووزستان', 'ئەیلاق', 'شوشتەر', 'مەسجید سولەیمان', 'ئەندیمشک', 'ماەشەهر', 'کەنداوی فارسی', 'Dezful', 'Izeh', 'Khuzestan', 'باغ مەلەک'],
  },

  // ================= ڕۆژئاوای کوردستان (٣ پارێزگا و هەرێم) =================
  {
    id: 'hasakah',
    name: 'حەسەکە (قامیشلۆ و گرێ سپی)',
    shortName: 'حەسەکە',
    shortNameEn: 'Heseke',
    part: 'west',
    partName: 'ڕۆژئاوای کوردستان',
    inKurdistan: true,
    countryCode: 'SY',
    center: [36.42, 40.48],
    zoom: 8,
    googleAdmin1: ['al-hasakah governorate', 'al hasakah', 'hasakah', 'ar-raqqah governorate', 'raqqa governorate', 'محافظة الحسكة'],
    googleAdmin2: ['al-hasakah', 'qamishli', 'al-malikiyah', 'derik', 'ras al-ayn', 'amuda', 'tal tamr', 'tell abyad', 'tal abyad', 'suluk', 'ayn issa'],
    aliases: ['حەسەکە', 'الحسكة', 'Hasakah', 'Heseke', 'قامیشلۆ', 'قامشلي', 'Qamishli', 'گرێ سپی', 'تل أبيض', 'Tell Abyad', 'عاموودا', 'دێرک', 'سەرێکانی', 'تەلتەمر', 'ڕمێلان', 'درباسیە', 'واشۆکانی'],
  },
  {
    id: 'kobani',
    name: 'کۆبانێ',
    shortName: 'کۆبانێ',
    shortNameEn: 'Kobane',
    part: 'west',
    partName: 'ڕۆژئاوای کوردستان',
    inKurdistan: true,
    countryCode: 'SY',
    center: [36.62, 38.36],
    zoom: 9,
    googleAdmin1: ['aleppo governorate', 'محافظة حلب'],
    googleAdmin2: ['ayn al-arab', 'ain al-arab', 'kobani', 'kobane', 'sarrin', 'manbij'],
    aliases: ['کۆبانێ', 'کۆبانی', 'عين العرب', 'Kobani', 'Kobane', 'Kobanî', 'سەڕین', 'شێخلەر'],
  },
  {
    id: 'afrin',
    name: 'عەفرین',
    shortName: 'عەفرین',
    shortNameEn: 'Efrin',
    part: 'west',
    partName: 'ڕۆژئاوای کوردستان',
    inKurdistan: true,
    countryCode: 'SY',
    center: [36.56, 36.82],
    zoom: 9,
    googleAdmin1: ['aleppo governorate', 'محافظة حلب'],
    googleAdmin2: ['afrin', 'efrin', 'jindires', 'rajo', 'bulbul', 'sharran', 'shaykh al-hadid', 'maabatli', 'azaz', 'tal rifaat'],
    aliases: ['عەفرین', 'عفرين', 'Afrin', 'Efrin', 'Efrîn', 'چیای کورمێنج', 'جندرێس', 'ڕاجۆ', 'مەعبەتلی', 'بلبل', 'شێراوا', 'شێخ حەدید'],
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
  // South Kurdistan (6)
  erbil: 'Erbil (Hawler)',
  sulaymaniyah: 'Sulaymaniyah (Slemani)',
  duhok: 'Duhok',
  kirkuk: 'Kirkuk',
  garmian_diyala: 'Khanaqin & Garmian (Xanaqeen)',
  sinjar_nineveh: 'Mosul, Sinjar & Nineveh (Musill)',
  // North Kurdistan (23)
  kars: 'Kars (Qers)',
  sivas: 'Sivas (Sewas)',
  erzincan: 'Erzincan (Azerinjan)',
  erzurum: 'Erzurum (Arzerrom)',
  igdir: 'Igdir (Egdir)',
  agri: 'Agri (Agiree)',
  dersim: 'Dersim (Tunceli)',
  bingol: 'Bingol (Bingoll)',
  mus: 'Mus (Mush)',
  van: 'Van (Wan)',
  malatya: 'Malatya (Melatiya)',
  elazig: 'Elazig (Alazeegh)',
  amed: 'Amed (Diyarbakir)',
  batman: 'Batman',
  bitlis: 'Bitlis (Bedlis)',
  maras: "Maras (Mer'ash)",
  urfa: 'Urfa (Riha)',
  mardin: 'Mardin (Mardeen)',
  siirt: 'Siirt (Sert)',
  sirnak: 'Sirnak (Shirnax)',
  hakkari: 'Hakkari (Hekari)',
  gaziantep: 'Gaziantep (Gazi Antab)',
  askadrome: 'Iskenderun (Askadrome / Hatay)',
  // East Kurdistan (8)
  urmia: 'Urmia (Wrme)',
  sanandaj: 'Sanandaj (Sinna)',
  hamedan: 'Hamadan (Hemedan)',
  kermanshah: 'Kermanshah (Kirmashan)',
  ilam: 'Ilam (Elam)',
  lorestan: 'Lorestan - Khorramabad (Lurrstan Xuram Abad)',
  chaharmahal: 'Shahrekord - Chaharmahal (Shehri Kurd)',
  izeh_khuzestan: 'Dezful & Khuzestan (Dezful)',
  // West Kurdistan (3)
  hasakah: 'Hasakah (Heseke)',
  kobani: 'Kobani (Kobane)',
  afrin: 'Afrin (Efrin)',
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
// Canonical Outside-Kurdistan Cities Registry (Kurdish & English + Coords)
// =========================================================================

interface OutsideCityEntry {
  id: string;
  nameCkb: string;
  nameEn: string;
  keywords: string[];
  coords: Array<{ lat: number; lng: number; radiusKm: number }>;
  aliases?: string[];
}

function normalizePlaceText(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Unify Arabic/Kurdish variant letters (ھ U+06BE -> ه U+0647, ی/ي/ى, ک/ك, ە/ة)
    .replace(/ھ/g, 'ه')
    .replace(/[يیىئ]/g, 'ی')
    .replace(/[كک]/g, 'ک')
    .replace(/[ةە]/g, 'ە')
    .replace(/[أإآا]/g, 'ا')
    .replace(/[ؤوۆ]/g, 'و')
    .replace(/['’`\-–—_,،.()\[\]]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const INVALID_OUTSIDE_REGION_NORMALIZED = new Set([
  'دەرەوەی هێلی کوردستان',
  'دەرەوەی هێڵی کوردستان',
  'دەرەوەی کوردستان',
  'کوردستان',
  'kurdistan',
  'outside kurdistan',
  'outside kurdistan borders',
  'global',
  'رضی اللە عنە',
  'رضي الله عنه',
  'کوری ئەحمەدیل',
  'کوڕی ئەحمەدیل',
  'جانپولاد زادە',
  'جانپۆلاد زادە',
  'هەموو کوردستان',
  'دەرەوەی هێل',
].map(normalizePlaceText));

const INVALID_OUTSIDE_PROVINCE_IDS = new Set([
  'outside_global',
  'outside_دەرەوەی_هێڵی_کوردستان',
  'outside_دەرەوەی_کوردستان',
  'outside_رضی_اللە_عنە',
  'outside_کوڕی_ئەحمەدیل',
  'outside_جانپۆلاد_زادە',
  'outside_outside_kurdistan_borders',
  'outside_کوردستان',
]);

function isValidOutsideRegionLabel(raw: string): boolean {
  const trimmed = (raw || '').trim();
  if (!trimmed) return false;
  if (/^[\d\u0660-\u0669\u06F0-\u06F9\s\-–—]+$/.test(trimmed)) return false;
  if (/رضی\s*الل|رضي\s*الل|کوڕی\s*ئەحمەدیل|جانپۆلاد|سەردەمی|کۆچی|زایینی/.test(trimmed)) return false;
  const norm = normalizePlaceText(trimmed);
  if (!norm || INVALID_OUTSIDE_REGION_NORMALIZED.has(norm)) return false;
  return true;
}

const OUTSIDE_CITIES_REGISTRY: OutsideCityEntry[] = [
  // Iraq (outside Kurdistan)
  {
    id: 'outside_baghdad',
    nameCkb: 'بەغدا',
    nameEn: 'Baghdad',
    keywords: ['baghdad', 'بەغدا', 'بغداد', 'بەغداد'],
    coords: [{ lat: 33.3152, lng: 44.3661, radiusKm: 55 }],
  },
  {
    id: 'outside_babylon',
    nameCkb: 'بابل (حللە)',
    nameEn: 'Babylon (Hillah)',
    keywords: ['babylon', 'hillah', 'hilla', 'بابل', 'حللە', 'حلة'],
    coords: [{ lat: 32.4682, lng: 44.5502, radiusKm: 45 }],
  },
  {
    id: 'outside_tikrit',
    nameCkb: 'تکریت (سەلاحەدین)',
    nameEn: 'Tikrit (Saladin)',
    keywords: ['tikrit', 'تکریت', 'تكريت'],
    coords: [{ lat: 34.5981, lng: 43.6755, radiusKm: 40 }],
  },
  {
    id: 'outside_basra',
    nameCkb: 'بەسڕە',
    nameEn: 'Basra',
    keywords: ['basra', 'بەسڕە', 'بەسرە', 'بصرة'],
    coords: [{ lat: 30.5085, lng: 47.7804, radiusKm: 60 }],
  },
  {
    id: 'outside_najaf',
    nameCkb: 'نەجەف',
    nameEn: 'Najaf',
    keywords: ['najaf', 'نەجەف', 'نجف'],
    coords: [{ lat: 32.0, lng: 44.3333, radiusKm: 35 }],
  },
  {
    id: 'outside_karbala',
    nameCkb: 'کەربەلا',
    nameEn: 'Karbala',
    keywords: ['karbala', 'کەربەلا', 'كربلاء'],
    coords: [{ lat: 32.616, lng: 44.0249, radiusKm: 30 }],
  },
  {
    id: 'outside_anbar',
    nameCkb: 'ئەنبار (ڕومادی)',
    nameEn: 'Al Anbar (Ramadi)',
    keywords: ['anbar', 'ramadi', 'fallujah', 'ئەنبار', 'ڕومادی', 'فەلووجە'],
    coords: [{ lat: 33.4258, lng: 43.2992, radiusKm: 70 }],
  },

  // Syria & Lebanon
  {
    id: 'outside_damascus',
    nameCkb: 'دیمەشق',
    nameEn: 'Damascus',
    keywords: ['damascus', 'دیمەشق', 'دمشق'],
    coords: [{ lat: 33.5138, lng: 36.2765, radiusKm: 35 }],
  },
  {
    id: 'outside_aleppo',
    nameCkb: 'حەلەب',
    nameEn: 'Aleppo',
    keywords: ['aleppo', 'حەلەب', 'حلب'],
    coords: [{ lat: 36.2021, lng: 37.1343, radiusKm: 32 }],
  },
  {
    id: 'outside_azaz',
    nameCkb: 'ئەعزاز (حەلەب)',
    nameEn: 'Azaz (Aleppo)',
    keywords: ["a'zaz", 'azaz', 'ئەعزاز', 'عەزاز', 'اعزاز'],
    coords: [{ lat: 36.5875, lng: 37.0466, radiusKm: 10 }],
  },
  {
    id: 'outside_homs',
    nameCkb: 'حومس (سووریا)',
    nameEn: 'Homs (Syria)',
    keywords: ['homs', 'حومس', 'حمس', 'حمص'],
    coords: [{ lat: 34.7325, lng: 36.7135, radiusKm: 30 }],
  },
  {
    id: 'outside_hama',
    nameCkb: 'حەما (سووریا)',
    nameEn: 'Hama (Syria)',
    keywords: ['hama', 'حەما', 'حەمما', 'حماة'],
    coords: [{ lat: 35.1408, lng: 36.7553, radiusKm: 30 }],
  },
  {
    id: 'outside_raqqa',
    nameCkb: 'ڕەققە',
    nameEn: 'Raqqa',
    keywords: ['raqqa', 'ڕەققە', 'رەققە', 'الرقة'],
    coords: [{ lat: 35.9594, lng: 39.0094, radiusKm: 35 }],
  },
  {
    id: 'outside_baalbek',
    nameCkb: 'بەعلەبەک (لوبنان)',
    nameEn: 'Baalbek (Lebanon)',
    keywords: ['baalbek', 'بەعلەبەک', 'بعلبك'],
    coords: [{ lat: 34.0047, lng: 36.2116, radiusKm: 22 }],
  },
  {
    id: 'outside_mount_lebanon',
    nameCkb: 'جەبەل لوبنان (لوبنان)',
    nameEn: 'Mount Lebanon (Lebanon)',
    keywords: ['mount lebanon', 'beirut', 'جەبەل لوبنان', 'بەیرووت', 'لبنان'],
    coords: [{ lat: 33.9798, lng: 35.8154, radiusKm: 25 }],
  },
  {
    id: 'outside_tripoli_lb',
    nameCkb: 'تەرابلوس (لوبنان)',
    nameEn: 'Tripoli (Lebanon)',
    keywords: ['tripoli lebanon', 'تەرابلوس', 'طرابلس'],
    coords: [{ lat: 34.4348, lng: 35.836, radiusKm: 25 }],
  },

  // Palestine
  {
    id: 'outside_jerusalem',
    nameCkb: 'قودس',
    nameEn: 'Jerusalem',
    keywords: ['jerusalem', 'قودس', 'القدس', 'ئورشەلیم'],
    coords: [{ lat: 31.7769, lng: 35.2224, radiusKm: 12 }],
  },
  {
    id: 'outside_ramallah',
    nameCkb: 'ڕامەڵڵا (فەلەستین)',
    nameEn: 'Ramallah (Palestine)',
    keywords: ['ramallah', 'ڕامەڵڵا', 'رام الله'],
    coords: [{ lat: 31.9522, lng: 35.2332, radiusKm: 12 }],
  },
  {
    id: 'outside_nablus',
    nameCkb: 'نابلس (فەلەستین)',
    nameEn: 'Nablus (Palestine)',
    keywords: ['nablus', 'نابلس'],
    coords: [{ lat: 32.2227, lng: 35.2621, radiusKm: 20 }],
  },
  {
    id: 'outside_acre',
    nameCkb: 'عەککا (فەلەستین)',
    nameEn: 'Acre / Akka',
    keywords: ['acre', 'akko', 'akka', 'eka', 'عەککا', 'عکا'],
    coords: [{ lat: 32.9282, lng: 35.0756, radiusKm: 25 }],
  },

  // Egypt
  {
    id: 'outside_cairo',
    nameCkb: 'قاهیرە',
    nameEn: 'Cairo',
    keywords: ['cairo', 'قاهیرە', 'قاھیرە', 'القاهرة'],
    coords: [{ lat: 30.15, lng: 31.25, radiusKm: 75 }],
  },
  {
    id: 'outside_faiyum',
    nameCkb: 'فەییوم (میسر)',
    nameEn: 'Faiyum (Egypt)',
    keywords: ['faiyum', 'fayoum', 'beni suef', 'فەییوم', 'الفيوم'],
    coords: [{ lat: 29.0946, lng: 30.6409, radiusKm: 65 }],
  },
  {
    id: 'outside_alexandria',
    nameCkb: 'ئەسکەندەرییە (میسر)',
    nameEn: 'Alexandria (Egypt)',
    keywords: ['alexandria', 'ئەسکەندەرییە', 'الإسكندرية'],
    coords: [{ lat: 31.2001, lng: 29.9187, radiusKm: 45 }],
  },

  // Hejaz & Yemen
  {
    id: 'outside_medina',
    nameCkb: 'مەدینە',
    nameEn: 'Medina',
    keywords: ['medina', 'madinah', 'مەدینە', 'المدينة'],
    coords: [{ lat: 24.5247, lng: 39.5692, radiusKm: 65 }],
  },
  {
    id: 'outside_mecca',
    nameCkb: 'مەککە',
    nameEn: 'Mecca',
    keywords: ['mecca', 'makkah', 'مەککە', 'مكة'],
    coords: [{ lat: 21.4225, lng: 39.8262, radiusKm: 35 }],
  },
  {
    id: 'outside_taif',
    nameCkb: 'تائیف (حیجاز)',
    nameEn: 'Taif (Hejaz)',
    keywords: ['taif', "ta'if", 'تائیف', 'الطائف'],
    coords: [{ lat: 21.2841, lng: 40.4248, radiusKm: 40 }],
  },
  {
    id: 'outside_jeddah',
    nameCkb: 'جەددە (حیجاز)',
    nameEn: 'Jeddah (Hejaz)',
    keywords: ['jeddah', 'jidda', 'جەددە', 'جدة'],
    coords: [
      { lat: 20.2802, lng: 38.5126, radiusKm: 55 },
      { lat: 21.4858, lng: 39.1925, radiusKm: 45 },
    ],
  },
  {
    id: 'outside_taiz',
    nameCkb: 'تەعز (یەمەن)',
    nameEn: 'Taiz (Yemen)',
    keywords: ['taiz', 'taizz', "ta'izz", 'تەعز', 'تعز'],
    coords: [{ lat: 13.5776, lng: 44.0178, radiusKm: 60 }],
  },
  {
    id: 'outside_sanaa',
    nameCkb: 'سەنعا (یەمەن)',
    nameEn: 'Sanaa (Yemen)',
    keywords: ['sanaa', "sana'a", 'سەنعا', 'صنعاء'],
    coords: [{ lat: 15.3545, lng: 44.2064, radiusKm: 65 }],
  },
  {
    id: 'outside_hadhramaut',
    nameCkb: 'حەزرەمەوت (یەمەن)',
    nameEn: 'Hadhramaut (Yemen)',
    keywords: ['hadhramaut', 'hadramaut', 'حەزرەمەوت', 'حضرموت'],
    coords: [{ lat: 15.5527, lng: 48.5164, radiusKm: 180 }],
  },

  // Turkey (outside Northern Kurdistan)
  {
    id: 'outside_kilis',
    nameCkb: 'کیلیس',
    nameEn: 'Kilis',
    keywords: ['kilis', 'کیلیس', 'کلیس'],
    coords: [{ lat: 36.7165, lng: 37.1147, radiusKm: 9 }],
  },
  {
    id: 'outside_istanbul',
    nameCkb: 'ئیستەنبوڵ',
    nameEn: 'Istanbul',
    keywords: ['istanbul', 'ئیستەنبوڵ', 'ئەستەنبوڵ', 'ئیستەنبۆل', 'ئەستەنبۆڵ', 'اسطنبول'],
    coords: [{ lat: 41.1, lng: 28.85, radiusKm: 65 }],
  },
  {
    id: 'outside_bursa_iznik',
    nameCkb: 'ئیزنیک / بۆرسە (تورکیا)',
    nameEn: 'Iznik / Bursa (Turkey)',
    keywords: ['iznik', 'îznîk', 'bursa', 'ئیزنیک', 'بۆرسە', 'بورصة'],
    coords: [{ lat: 40.4303, lng: 29.7224, radiusKm: 35 }],
  },
  {
    id: 'outside_manisa',
    nameCkb: 'مانیسا (تورکیا)',
    nameEn: 'Manisa (Turkey)',
    keywords: ['manisa', 'مانیسا', 'مەغنیسیا', 'مەغنیسا'],
    coords: [{ lat: 38.614, lng: 27.4296, radiusKm: 45 }],
  },
  {
    id: 'outside_hattusa',
    nameCkb: 'هاتوشا / چۆروم (تورکیا)',
    nameEn: 'Hattusa / Corum (Turkey)',
    keywords: ['hattusa', 'corum', 'çorum', 'bogazkale', 'هاتوشا', 'چۆروم'],
    coords: [{ lat: 40.0198, lng: 34.615, radiusKm: 50 }],
  },
  {
    id: 'outside_kirsehir',
    nameCkb: 'قڕشەهیر / ڕووباری هالیس (تورکیا)',
    nameEn: 'Kirsehir / Halys River (Turkey)',
    keywords: ['kirsehir', 'kırşehir', 'halys', 'قڕشەهیر', 'ڕووباری هالیس', 'ڕوباری هالیس'],
    coords: [{ lat: 39.1742, lng: 33.7352, radiusKm: 55 }],
  },
  {
    id: 'outside_ankara',
    nameCkb: 'ئەنقەرە',
    nameEn: 'Ankara',
    keywords: ['ankara', 'ئەنقەرە'],
    coords: [{ lat: 39.9334, lng: 32.8597, radiusKm: 50 }],
  },
  {
    id: 'outside_izmir',
    nameCkb: 'ئیزمیر',
    nameEn: 'Izmir',
    keywords: ['izmir', 'ئیزمیر'],
    coords: [{ lat: 38.4237, lng: 27.1428, radiusKm: 40 }],
  },
  {
    id: 'outside_adana',
    nameCkb: 'ئەدەنە',
    nameEn: 'Adana',
    keywords: ['adana', 'ئەدەنە'],
    coords: [{ lat: 37.0, lng: 35.3213, radiusKm: 40 }],
  },
  {
    id: 'outside_hatay',
    nameCkb: 'هاتای (ئەنتاکیا)',
    nameEn: 'Hatay (Antioch)',
    keywords: ['hatay', 'antakya', 'antioch', 'هاتای', 'ئەنتاکیا'],
    coords: [{ lat: 36.2026, lng: 36.1604, radiusKm: 35 }],
  },
  {
    id: 'outside_trabzon',
    nameCkb: 'ترابزۆن',
    nameEn: 'Trabzon',
    keywords: ['trabzon', 'ترابزۆن'],
    coords: [{ lat: 41.0027, lng: 39.7168, radiusKm: 40 }],
  },
  {
    id: 'outside_konya',
    nameCkb: 'قۆنیا',
    nameEn: 'Konya',
    keywords: ['konya', 'قۆنیا'],
    coords: [{ lat: 37.8746, lng: 32.4932, radiusKm: 50 }],
  },
  {
    id: 'outside_kayseri',
    nameCkb: 'قەیسەری',
    nameEn: 'Kayseri',
    keywords: ['kayseri', 'قەیسەری'],
    coords: [{ lat: 38.7312, lng: 35.4787, radiusKm: 45 }],
  },

  // Iran (outside Eastern Kurdistan)
  {
    id: 'outside_maragheh',
    nameCkb: 'مەراغە (ئازەربایجانی ڕۆژهەڵات)',
    nameEn: 'Maragheh (East Azerbaijan)',
    keywords: ['maragheh', 'مەراغە'],
    coords: [{ lat: 37.38, lng: 46.3, radiusKm: 35 }],
  },
  {
    id: 'outside_sarab',
    nameCkb: 'سەراب (ئازەربایجانی ڕۆژهەڵات)',
    nameEn: 'Sarab (East Azerbaijan)',
    keywords: ['sarab', 'سەراب'],
    coords: [{ lat: 37.6882, lng: 47.3512, radiusKm: 40 }],
  },
  {
    id: 'outside_tabriz',
    nameCkb: 'تەورێز (ئازەربایجانی ڕۆژهەڵات)',
    nameEn: 'Tabriz (East Azerbaijan)',
    keywords: ['tabriz', 'تەورێز', 'تەبرێز'],
    coords: [{ lat: 38.0739, lng: 46.2979, radiusKm: 24 }],
  },
  {
    id: 'outside_ahar',
    nameCkb: 'ئەهەر / گانزاک (ئازەربایجانی ڕۆژهەڵات)',
    nameEn: 'Ahar (East Azerbaijan)',
    keywords: ['ahar', 'گانزاگ', 'گانزاک', 'ئەهەر'],
    coords: [{ lat: 38.3244, lng: 46.8127, radiusKm: 24 }],
  },
  {
    id: 'outside_khorasan',
    nameCkb: 'خوراسان (ئیسفەراین)',
    nameEn: 'Khorasan (Esfarayen)',
    keywords: ['khorasan', 'esfarayen', 'mashhad', 'خوراسان', 'خۆراسان', 'ئیسفەراین'],
    coords: [
      { lat: 37.0376, lng: 57.4365, radiusKm: 120 },
      { lat: 36.2605, lng: 59.6168, radiusKm: 120 },
    ],
  },
  {
    id: 'outside_darab_fars',
    nameCkb: 'داراب (فارس / ئێران)',
    nameEn: 'Darab (Fars, Iran)',
    keywords: ['darab', 'darabgerd', 'داراب', 'دارابگرد'],
    coords: [{ lat: 28.7, lng: 54.4, radiusKm: 75 }],
  },
  {
    id: 'outside_shiraz',
    nameCkb: 'شیراز (فارس)',
    nameEn: 'Shiraz (Fars)',
    keywords: ['shiraz', 'شیراز'],
    coords: [{ lat: 29.5918, lng: 52.5837, radiusKm: 70 }],
  },
  {
    id: 'outside_larestan',
    nameCkb: 'لارستان (فارس)',
    nameEn: 'Larestan (Fars)',
    keywords: ['larestan', 'lar', 'لارستان'],
    coords: [
      { lat: 26.9651, lng: 56.066, radiusKm: 65 },
      { lat: 27.6833, lng: 54.3417, radiusKm: 65 },
    ],
  },
  {
    id: 'outside_hormozgan',
    nameCkb: 'میناب (هورموزگان)',
    nameEn: 'Minab / Hormozgan (Iran)',
    keywords: ['hormozgan', 'minab', 'bandar abbas', 'سندرک', 'میناب', 'هورموزگان'],
    coords: [{ lat: 26.8819, lng: 57.4624, radiusKm: 65 }],
  },
  {
    id: 'outside_tehran',
    nameCkb: 'تاران',
    nameEn: 'Tehran',
    keywords: ['tehran', 'تاران', 'تەهران'],
    coords: [{ lat: 35.6892, lng: 51.389, radiusKm: 80 }],
  },
  {
    id: 'outside_isfahan',
    nameCkb: 'ئەسفەهان',
    nameEn: 'Isfahan',
    keywords: ['isfahan', 'esfahan', 'ئەسفەهان'],
    coords: [{ lat: 32.6539, lng: 51.666, radiusKm: 80 }],
  },

  // Caucasus (Armenia, Azerbaijan, Georgia)
  {
    id: 'outside_nakhchivan',
    nameCkb: 'نەخچەوان',
    nameEn: 'Nakhchivan',
    keywords: ['nakhchivan', 'نەخچەوان', 'نەخجەوان'],
    coords: [{ lat: 39.25, lng: 45.45, radiusKm: 40 }],
  },
  {
    id: 'outside_dvin',
    nameCkb: 'دڤین (ئەرمینیا)',
    nameEn: 'Dvin (Armenia)',
    keywords: ['dvin', 'دڤین', 'دوین'],
    coords: [{ lat: 40.01, lng: 44.58, radiusKm: 16 }],
  },
  {
    id: 'outside_vayots_dzor',
    nameCkb: 'ڤایۆتس دزۆر (ئەرمینیا)',
    nameEn: 'Vayots Dzor (Armenia)',
    keywords: ['vayots dzor', 'yeghegis', 'ڤایۆتس دزۆر'],
    coords: [{ lat: 39.9097, lng: 45.5493, radiusKm: 35 }],
  },
  {
    id: 'outside_yerevan',
    nameCkb: 'یەریڤان (ئەرمینیا)',
    nameEn: 'Yerevan (Armenia)',
    keywords: ['yerevan', 'یەریڤان', 'یەرەڤان'],
    coords: [{ lat: 40.1872, lng: 44.5152, radiusKm: 15 }],
  },
  {
    id: 'outside_ganja',
    nameCkb: 'گەنجە (ئازەربایجان)',
    nameEn: 'Ganja (Azerbaijan)',
    keywords: ['ganja', 'گەنجە'],
    coords: [{ lat: 40.6879, lng: 46.3723, radiusKm: 40 }],
  },
  {
    id: 'outside_arran_azerbaijan',
    nameCkb: 'ئەرران / بەردە (ئازەربایجان)',
    nameEn: 'Arran / Barda (Azerbaijan)',
    keywords: ['arran', 'barda', 'ئەرران', 'بەردە'],
    coords: [{ lat: 40.18, lng: 47.65, radiusKm: 60 }],
  },
  {
    id: 'outside_baku',
    nameCkb: 'باکۆ (ئازەربایجان)',
    nameEn: 'Baku (Azerbaijan)',
    keywords: ['baku', 'باکۆ'],
    coords: [{ lat: 40.4093, lng: 49.8671, radiusKm: 45 }],
  },
  {
    id: 'outside_tbilisi',
    nameCkb: 'تبلیسی (جۆرجیا)',
    nameEn: 'Tbilisi (Georgia)',
    keywords: ['tbilisi', 'tiflis', 'تبلیسی', 'تەفلیس'],
    coords: [{ lat: 41.7151, lng: 44.8271, radiusKm: 45 }],
  },

  // Europe & International
  {
    id: 'outside_lausanne',
    nameCkb: 'لۆزان (سویسرا)',
    nameEn: 'Lausanne (Switzerland)',
    keywords: ['lausanne', 'vaud', 'لۆزان'],
    coords: [{ lat: 46.5197, lng: 6.6323, radiusKm: 35 }],
  },
  {
    id: 'outside_geneva',
    nameCkb: 'جنێڤ (سویسرا)',
    nameEn: 'Geneva (Switzerland)',
    keywords: ['geneva', 'geneve', 'جنێڤ'],
    coords: [{ lat: 46.2044, lng: 6.1432, radiusKm: 30 }],
  },
  {
    id: 'outside_paris',
    nameCkb: 'پاریس (فەڕەنسا)',
    nameEn: 'Paris (France)',
    keywords: ['paris', 'sevres', 'sèvres', 'ile de france', 'پاریس', 'سیڤەر'],
    coords: [{ lat: 48.8566, lng: 2.3522, radiusKm: 60 }],
  },
  {
    id: 'outside_london',
    nameCkb: 'لەندەن (بەریتانیا)',
    nameEn: 'London (UK)',
    keywords: ['london', 'لەندەن'],
    coords: [{ lat: 51.5072, lng: -0.1276, radiusKm: 55 }],
  },
  {
    id: 'outside_moscow',
    nameCkb: 'مۆسکۆ (ڕووسیا)',
    nameEn: 'Moscow (Russia)',
    keywords: ['moscow', 'مۆسکۆ'],
    coords: [{ lat: 55.7558, lng: 37.6173, radiusKm: 65 }],
  },
];

function findOutsideCityByCoords(lat: number, lng: number): OutsideCityEntry | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return null;
  let bestEntry: OutsideCityEntry | null = null;
  let bestDistKm = Infinity;
  for (const entry of OUTSIDE_CITIES_REGISTRY) {
    for (const c of entry.coords) {
      const dist = haversineKm(lat, lng, c.lat, c.lng);
      if (dist <= c.radiusKm && dist < bestDistKm) {
        bestDistKm = dist;
        bestEntry = entry;
      }
    }
  }
  return bestEntry;
}

function findOutsideCityByText(rawText: string): OutsideCityEntry | null {
  const norm = normalizePlaceText(rawText);
  if (!norm) return null;
  for (const entry of OUTSIDE_CITIES_REGISTRY) {
    for (const kw of entry.keywords) {
      const normKw = normalizePlaceText(kw);
      if (!normKw) continue;
      if (norm === normKw) return entry;
      // Match whole token/phrase boundaries cleanly
      const escaped = normKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?:^|\\s)${escaped}(?:$|\\s)`, 'i');
      if (regex.test(norm)) return entry;
    }
  }
  return null;
}

function findOutsideCityById(id: string | undefined): OutsideCityEntry | null {
  if (!id) return null;
  return OUTSIDE_CITIES_REGISTRY.find((c) => c.id === id) || null;
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
  'babylon': 'بابل (حللە)',
  'al anbar': 'ئەنبار (ڕومادی)',
  'anbar': 'ئەنبار (ڕومادی)',
  'tehran': 'تاران',
  'tehran province': 'تاران',
  'isfahan': 'ئەسفەهان',
  'fars': 'شیراز (فارس)',
  'east azerbaijan': 'تەورێز (ئازەربایجانی ڕۆژهەڵات)',
  'east azerbaijan province': 'تەورێز (ئازەربایجانی ڕۆژهەڵات)',
  'ardabil': 'ئەردەبێڵ',
  'zanjan': 'زەنجان',
  'qazvin': 'قەزوین',
  'markazi': 'مەرکەزی',
  'hormozgan': 'میناب (هورموزگان)',
  'khorasan': 'خوراسان (ئیسفەراین)',
  'north khorasan': 'خوراسان (ئیسفەراین)',
  'razavi khorasan': 'خوراسان (ئیسفەراین)',
  'damascus': 'دیمەشق',
  'damascus governorate': 'دیمەشق',
  'rif dimashq': 'دیمەشق',
  'aleppo': 'حەلەب',
  'aleppo governorate': 'حەلەب',
  'homs': 'حومس (سووریا)',
  'hama': 'حەما (سووریا)',
  'baalbek-hermel': 'بەعلەبەک (لوبنان)',
  'mount lebanon': 'جەبەل لوبنان (لوبنان)',
  'north': 'تەرابلوس (لوبنان)',
  'cairo': 'قاهیرە',
  'cairo governorate': 'قاهیرە',
  'faiyum': 'فەییوم (میسر)',
  'beni suef': 'فەییوم (میسر)',
  'alexandria': 'ئەسکەندەرییە (میسر)',
  'istanbul': 'ئیستەنبوڵ',
  'bursa': 'ئیزنیک / بۆرسە (تورکیا)',
  'manisa': 'مانیسا (تورکیا)',
  'corum': 'هاتوشا / چۆروم (تورکیا)',
  'çorum': 'هاتوشا / چۆروم (تورکیا)',
  'kirsehir': 'قڕشەهیر / ڕووباری هالیس (تورکیا)',
  'kırşehir': 'قڕشەهیر / ڕووباری هالیس (تورکیا)',
  'kilis': 'کیلیس',
  'ankara': 'ئەنقەرە',
  'izmir': 'ئیزمیر',
  'adana': 'ئەدەنە',
  'hatay': 'هاتای (ئەنتاکیا)',
  'trabzon': 'ترابزۆن',
  'konya': 'قۆنیا',
  'kayseri': 'قەیسەری',
  'geneva': 'جنێڤ (سویسرا)',
  'vaud': 'لۆزان (سویسرا)',
  'ile-de-france': 'پاریس (فەڕەنسا)',
  'île-de-france': 'پاریس (فەڕەنسا)',
  'yerevan': 'یەریڤان (ئەرمینیا)',
  'ararat': 'دڤین (ئەرمینیا)',
  'vayots dzor': 'ڤایۆتس دزۆر (ئەرمینیا)',
  'tbilisi': 'تبلیسی (جۆرجیا)',
  'ganja': 'گەنجە (ئازەربایجان)',
  'nakhchivan': 'نەخچەوان',
  'baku': 'باکۆ (ئازەربایجان)',
  'moscow': 'مۆسکۆ (ڕووسیا)',
  'london': 'لەندەن (بەریتانیا)',
  'mecca': 'مەککە',
  'makkah': 'مەککە',
  'al madinah': 'مەدینە',
  'madinah': 'مەدینە',
  'medina': 'مەدینە',
  'jerusalem': 'قودس',
  'west bank': 'نابلس (فەلەستین)',
  'taizz': 'تەعز (یەمەن)',
  "ta'izz": 'تەعز (یەمەن)',
  'sanaa': 'سەنعا (یەمەن)',
  'hadhramaut': 'حەزرەمەوت (یەمەن)',
};

function normalizeAdminString(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+(governorate|province|il|vilayeti|muhafazah|district|subdistrict|county)$/i, '')
    .trim();
}

/**
 * گۆڕینی زانیاری فەرمی گۆگڵ (Admin Level 1, Admin Level 2, Locality, Country)
 * بۆ یەکێک لە ٤٠ پارێزگای کوردستان یان ناوچەی دەرەوەی کوردستان
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

  const byId = (id: string) => KURDISTAN_PROVINCES.find((p) => p.id === id);

  // 1. Check split governorates FIRST using adminLevel2 / locality + country
  // Iraq split governorates
  if (
    cc === 'IQ' ||
    a1.includes('nineveh') ||
    a1.includes('ninawa') ||
    a1.includes('diyala') ||
    a1.includes('saladin') ||
    a1.includes('salah') ||
    a1.includes('wasit')
  ) {
    if (a1.includes('nineveh') || a1.includes('ninawa')) {
      const sinjarKeywords = [
        'sinjar',
        'shingal',
        'shikhan',
        'sheikhan',
        'tel keif',
        'tel keppe',
        'hamdaniya',
        'tal afar',
        'zummar',
        'bashiqa',
        'alqosh',
        'qaraqosh',
        'bartella',
        'snuny',
        'mosul',
      ];
      if (a2.includes('aqra') || a2.includes('akre') || loc.includes('aqra') || loc.includes('akre')) {
        const prov = byId('duhok');
        if (prov) return { provinceId: prov.id, provinceName: prov.name, inKurdistan: true, province: prov };
      }
      if (sinjarKeywords.some((k) => a2.includes(k) || loc.includes(k))) {
        const prov = byId('sinjar_nineveh');
        if (prov) return { provinceId: prov.id, provinceName: prov.name, inKurdistan: true, province: prov };
      }
      if (Number.isFinite(info.lat) && Number.isFinite(info.lng)) {
        const duhokProv = byId('duhok');
        if (duhokProv && isPointInProvince(info.lat!, info.lng!, duhokProv)) {
          return { provinceId: duhokProv.id, provinceName: duhokProv.name, inKurdistan: true, province: duhokProv };
        }
        const sinjarProv = byId('sinjar_nineveh');
        if (sinjarProv && isPointInProvince(info.lat!, info.lng!, sinjarProv)) {
          return { provinceId: sinjarProv.id, provinceName: sinjarProv.name, inKurdistan: true, province: sinjarProv };
        }
      }
      return {
        provinceId: 'outside_nineveh_mosul',
        provinceName: 'نەینەوا (مووسڵ)',
        inKurdistan: false,
      };
    }

    if (a1.includes('diyala')) {
      const garmianKeywords = ['khanaqin', 'kifri', 'kalar', 'mandali', 'jalawla', 'saadiya', 'qaratapa', 'qoratu'];
      const gp = byId('garmian_diyala');
      if (gp && garmianKeywords.some((k) => a2.includes(k) || loc.includes(k))) {
        return { provinceId: gp.id, provinceName: gp.name, inKurdistan: true, province: gp };
      }
      if (gp && Number.isFinite(info.lat) && Number.isFinite(info.lng) && isPointInProvince(info.lat!, info.lng!, gp)) {
        return { provinceId: gp.id, provinceName: gp.name, inKurdistan: true, province: gp };
      }
      return {
        provinceId: 'outside_diyala',
        provinceName: 'دیالە',
        inKurdistan: false,
      };
    }

    if (a1.includes('saladin') || a1.includes('salah')) {
      const kp = byId('kirkuk');
      const gp = byId('garmian_diyala');
      if (a2.includes('tuz') || a2.includes('tooz') || loc.includes('tuz') || loc.includes('amirli')) {
        const target = gp || kp;
        if (target) return { provinceId: target.id, provinceName: target.name, inKurdistan: true, province: target };
      }
      if (Number.isFinite(info.lat) && Number.isFinite(info.lng)) {
        if (kp && isPointInProvince(info.lat!, info.lng!, kp)) {
          return { provinceId: kp.id, provinceName: kp.name, inKurdistan: true, province: kp };
        }
        if (gp && isPointInProvince(info.lat!, info.lng!, gp)) {
          return { provinceId: gp.id, provinceName: gp.name, inKurdistan: true, province: gp };
        }
      }
      if (loc.includes('tikrit') || a2.includes('tikrit')) {
        return { provinceId: 'outside_tikrit', provinceName: 'تکریت (سەلاحەدین)', inKurdistan: false };
      }
      return {
        provinceId: 'outside_saladin',
        provinceName: 'سەلاحەدین',
        inKurdistan: false,
      };
    }

    if (a1.includes('wasit')) {
      const gp = byId('garmian_diyala');
      if (gp && (a2.includes('badra') || loc.includes('badra') || loc.includes('jassan') || loc.includes('zurbatiya'))) {
        return { provinceId: gp.id, provinceName: gp.name, inKurdistan: true, province: gp };
      }
      if (gp && Number.isFinite(info.lat) && Number.isFinite(info.lng) && isPointInProvince(info.lat!, info.lng!, gp)) {
        return { provinceId: gp.id, provinceName: gp.name, inKurdistan: true, province: gp };
      }
      return {
        provinceId: 'outside_wasit',
        provinceName: 'واست',
        inKurdistan: false,
      };
    }
  }

  // Sulaymaniyah / Halabja / Garmian
  if (a1.includes('sulaymaniyah') || a1.includes('halabja')) {
    const garmian = byId('garmian_diyala');
    if (
      garmian &&
      (a2.includes('kalar') ||
        a2.includes('kifri') ||
        loc.includes('kalar') ||
        loc.includes('kifri') ||
        (Number.isFinite(info.lat) && Number.isFinite(info.lng) && isPointInProvince(info.lat!, info.lng!, garmian)))
    ) {
      return { provinceId: garmian.id, provinceName: garmian.name, inKurdistan: true, province: garmian };
    }
    const sul = byId('sulaymaniyah');
    if (sul) return { provinceId: sul.id, provinceName: sul.name, inKurdistan: true, province: sul };
  }

  // Syria split governorates (Hasakah + Raqqa north -> hasakah; Aleppo -> afrin / kobani)
  if (cc === 'SY' || a1.includes('aleppo') || a1.includes('raqqa') || a1.includes('hasakah')) {
    if (a1.includes('hasakah')) {
      const prov = byId('hasakah');
      if (prov) return { provinceId: prov.id, provinceName: prov.name, inKurdistan: true, province: prov };
    }
    if (a1.includes('raqqa')) {
      const hp = byId('hasakah');
      if (hp && (a2.includes('abyad') || loc.includes('abyad') || loc.includes('suluk') || loc.includes('issa'))) {
        return { provinceId: hp.id, provinceName: hp.name, inKurdistan: true, province: hp };
      }
      if (hp && Number.isFinite(info.lat) && Number.isFinite(info.lng) && isPointInProvince(info.lat!, info.lng!, hp)) {
        return { provinceId: hp.id, provinceName: hp.name, inKurdistan: true, province: hp };
      }
      return { provinceId: 'outside_raqqa', provinceName: 'ڕەققە', inKurdistan: false };
    }
    if (a1.includes('aleppo')) {
      const ap = byId('afrin');
      const kp = byId('kobani');
      if (ap && (a2.includes('afrin') || a2.includes('efrin') || loc.includes('afrin') || loc.includes('jindires') || loc.includes('rajo'))) {
        return { provinceId: ap.id, provinceName: ap.name, inKurdistan: true, province: ap };
      }
      if (kp && (a2.includes('arab') || a2.includes('kobani') || loc.includes('kobani') || loc.includes('ain al-arab') || loc.includes('sarrin'))) {
        return { provinceId: kp.id, provinceName: kp.name, inKurdistan: true, province: kp };
      }
      if (Number.isFinite(info.lat) && Number.isFinite(info.lng)) {
        for (const p of [ap, kp]) {
          if (p && isPointInProvince(info.lat!, info.lng!, p)) {
            return { provinceId: p.id, provinceName: p.name, inKurdistan: true, province: p };
          }
        }
      }
      if (a2.includes('azaz') || a2.includes("a'zaz") || loc.includes('azaz') || loc.includes("a'zaz")) {
        return { provinceId: 'outside_azaz', provinceName: 'ئەعزاز (حەلەب)', inKurdistan: false };
      }
      return { provinceId: 'outside_aleppo', provinceName: 'حەلەب', inKurdistan: false };
    }
  }

  // Iran Khuzestan (Dezful, Andimeshk, Izeh, Shushtar, Masjed Soleyman, Mahshahr)
  if (cc === 'IR' && a1.includes('khuzestan')) {
    const ip = byId('izeh_khuzestan');
    const northKhuzestan = ['izeh', 'masjed', 'dezful', 'shushtar', 'andimeshk', 'baghmalek', 'bagh-e malek', 'lali', 'mahshahr', 'ramhormoz', 'hendijan'];
    if (ip && northKhuzestan.some((k) => a2.includes(k) || loc.includes(k))) {
      return { provinceId: ip.id, provinceName: ip.name, inKurdistan: true, province: ip };
    }
    if (ip && Number.isFinite(info.lat) && Number.isFinite(info.lng) && isPointInProvince(info.lat!, info.lng!, ip)) {
      return { provinceId: ip.id, provinceName: ip.name, inKurdistan: true, province: ip };
    }
    return { provinceId: 'outside_khuzestan', provinceName: 'خووزستان (ئەهواز)', inKurdistan: false };
  }

  // 2. Direct 1-to-1 match against googleAdmin1 across all 40 Kurdistan provinces
  if (a1) {
    for (const prov of KURDISTAN_PROVINCES) {
      if (prov.countryCode && cc && prov.countryCode !== cc) continue;
      const g1List = (prov.googleAdmin1 || []).map((g) => normalizeAdminString(g));
      if (g1List.some((g) => a1 === g || (g.length > 3 && a1.includes(g)))) {
        return { provinceId: prov.id, provinceName: prov.name, inKurdistan: true, province: prov };
      }
    }
  }

  // 3. Outside Kurdistan: match canonical city registry by exact coordinates first, then locality/admin2/admin1
  if (Number.isFinite(info.lat) && Number.isFinite(info.lng)) {
    const coordCity = findOutsideCityByCoords(info.lat!, info.lng!);
    if (coordCity) {
      return {
        provinceId: coordCity.id,
        provinceName: coordCity.nameCkb,
        inKurdistan: false,
      };
    }
  }

  for (const field of [locRaw, a2Raw, a1Raw]) {
    const cityMatch = findOutsideCityByText(field);
    if (cityMatch) {
      return {
        provinceId: cityMatch.id,
        provinceName: cityMatch.nameCkb,
        inKurdistan: false,
      };
    }
  }

  // 4. Fallback to OUTSIDE_PROVINCE_KURDISH_NAMES or cleaned admin name
  const knownOutside =
    OUTSIDE_PROVINCE_KURDISH_NAMES[loc] ||
    OUTSIDE_PROVINCE_KURDISH_NAMES[a2] ||
    OUTSIDE_PROVINCE_KURDISH_NAMES[a1] ||
    OUTSIDE_PROVINCE_KURDISH_NAMES[a1Raw.toLowerCase()];

  const displayOutsideName =
    knownOutside ||
    locRaw ||
    a1Raw
      .replace(/\s+(Governorate|Province|District|Subdistrict)$/i, '')
      .trim() ||
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
  ['بابل (حللە)', 'Babylon (Hillah)'],
  ['بابل', 'Babylon'],
  ['تکریت (سەلاحەدین)', 'Tikrit (Saladin)'],
  ['تکریت', 'Tikrit'],
  ['ئەنبار (ڕومادی)', 'Al Anbar (Ramadi)'],
  ['ئەنبار', 'Al Anbar'],
  ['تاران', 'Tehran'],
  ['ئەسفەهان', 'Isfahan'],
  ['داراب (فارس / ئێران)', 'Darab (Fars, Iran)'],
  ['داراب (فارس)', 'Darab (Fars)'],
  ['شیراز (فارس)', 'Shiraz (Fars)'],
  ['فارس (شیراز)', 'Fars (Shiraz)'],
  ['شیراز', 'Shiraz (Fars)'],
  ['لارستان (فارس)', 'Larestan (Fars)'],
  ['لارستان', 'Larestan (Fars)'],
  ['میناب (هورموزگان)', 'Minab / Hormozgan (Iran)'],
  ['تەورێز (ئازەربایجانی ڕۆژهەڵات)', 'Tabriz (East Azerbaijan)'],
  ['ئازەربایجانی ڕۆژهەڵات (تەورێز)', 'East Azerbaijan (Tabriz)'],
  ['مەراغە (ئازەربایجانی ڕۆژهەڵات)', 'Maragheh (East Azerbaijan)'],
  ['سەراب (ئازەربایجانی ڕۆژهەڵات)', 'Sarab (East Azerbaijan)'],
  ['ئەهەر / گانزاک (ئازەربایجانی ڕۆژهەڵات)', 'Ahar (East Azerbaijan)'],
  ['ئەردەبێڵ', 'Ardabil'],
  ['زەنجان', 'Zanjan'],
  ['قەزوین', 'Qazvin'],
  ['مەرکەزی', 'Markazi'],
  ['خوراسان (ئیسفەراین)', 'Khorasan (Esfarayen)'],
  ['خوراسان', 'Khorasan'],
  ['دیمەشق', 'Damascus'],
  ['حەلەب', 'Aleppo'],
  ['ئەعزاز (حەلەب)', 'Azaz (Aleppo)'],
  ['حومس (سووریا)', 'Homs (Syria)'],
  ['حەما (سووریا)', 'Hama (Syria)'],
  ['ڕەققە', 'Raqqa'],
  ['بەعلەبەک (لوبنان)', 'Baalbek (Lebanon)'],
  ['جەبەل لوبنان (لوبنان)', 'Mount Lebanon (Lebanon)'],
  ['تەرابلوس (لوبنان)', 'Tripoli (Lebanon)'],
  ['خووزستان (ئەهواز)', 'Khuzestan (Ahvaz)'],
  ['قاهیرە', 'Cairo'],
  ['فەییوم (میسر)', 'Faiyum (Egypt)'],
  ['ئەسکەندەرییە (میسر)', 'Alexandria (Egypt)'],
  ['ئیستەنبوڵ', 'Istanbul'],
  ['ئەستەنبوڵ', 'Istanbul'],
  ['ئیزنیک / بۆرسە (تورکیا)', 'Iznik / Bursa (Turkey)'],
  ['مانیسا (تورکیا)', 'Manisa (Turkey)'],
  ['هاتوشا / چۆروم (تورکیا)', 'Hattusa / Corum (Turkey)'],
  ['قڕشەهیر / ڕووباری هالیس (تورکیا)', 'Kirsehir / Halys River (Turkey)'],
  ['کیلیس', 'Kilis'],
  ['ئەنقەرە', 'Ankara'],
  ['ئیزمیر', 'Izmir'],
  ['ئەدەنە', 'Adana'],
  ['هاتای (ئەنتاکیا)', 'Hatay (Antioch)'],
  ['هاتای', 'Hatay'],
  ['ترابزۆن', 'Trabzon'],
  ['قۆنیا', 'Konya'],
  ['قەیسەری', 'Kayseri'],
  ['جنێڤ (سویسرا)', 'Geneva (Switzerland)'],
  ['لۆزان (سویسرا)', 'Lausanne (Switzerland)'],
  ['لۆزان', 'Lausanne (Switzerland)'],
  ['پاریس (فەڕەنسا)', 'Paris (France)'],
  ['پاریس', 'Paris (France)'],
  ['دڤین (ئەرمینیا)', 'Dvin (Armenia)'],
  ['ڤایۆتس دزۆر (ئەرمینیا)', 'Vayots Dzor (Armenia)'],
  ['یەریڤان (ئەرمینیا)', 'Yerevan (Armenia)'],
  ['یەریڤان', 'Yerevan (Armenia)'],
  ['تبلیسی (جۆرجیا)', 'Tbilisi (Georgia)'],
  ['نەخچەوان', 'Nakhchivan'],
  ['گەنجە (ئازەربایجان)', 'Ganja (Azerbaijan)'],
  ['ئەرران / بەردە (ئازەربایجان)', 'Arran / Barda (Azerbaijan)'],
  ['باکۆ (ئازەربایجان)', 'Baku (Azerbaijan)'],
  ['مۆسکۆ (ڕووسیا)', 'Moscow (Russia)'],
  ['مۆسکۆ', 'Moscow'],
  ['لەندەن (بەریتانیا)', 'London (UK)'],
  ['مەککە', 'Mecca'],
  ['مەدینە', 'Medina'],
  ['تائیف (حیجاز)', 'Taif (Hejaz)'],
  ['جەددە (حیجاز)', 'Jeddah (Hejaz)'],
  ['تەعز (یەمەن)', 'Taiz (Yemen)'],
  ['سەنعا (یەمەن)', 'Sanaa (Yemen)'],
  ['حەزرەمەوت (یەمەن)', 'Hadhramaut (Yemen)'],
  ['قودس', 'Jerusalem'],
  ['ڕامەڵڵا (فەلەستین)', 'Ramallah (Palestine)'],
  ['نابلس (فەلەستین)', 'Nablus (Palestine)'],
  ['عەککا (فەلەستین)', 'Acre / Akka'],
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

for (const city of OUTSIDE_CITIES_REGISTRY) {
  OUTSIDE_ID_ENGLISH_MAP[city.id] = city.nameEn;
}

export function translateOutsideLabel(name: string, outsideId: string | undefined, lang: AppLanguage): string {
  const byReg = findOutsideCityById(outsideId);
  if (byReg) {
    return lang === 'en' ? byReg.nameEn : byReg.nameCkb;
  }
  const byText = findOutsideCityByText(name);
  if (byText) {
    return lang === 'en' ? byText.nameEn : byText.nameCkb;
  }
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
  if (!isValidOutsideRegionLabel(clean)) {
    return 'Outside Kurdistan Borders';
  }
  return clean || 'Outside Kurdistan Borders';
}

function resolveOutsideCityFromFact(
  fact: FactItem,
  lang: AppLanguage = 'ckb'
): {
  id: string;
  name: string;
  nameEn: string;
  aliases: string[];
} {
  // 1. Canonical ID if explicit and valid
  if (fact.provinceId && !INVALID_OUTSIDE_PROVINCE_IDS.has(fact.provinceId)) {
    const byId = findOutsideCityById(fact.provinceId);
    if (byId) {
      return {
        id: byId.id,
        name: lang === 'en' ? byId.nameEn : byId.nameCkb,
        nameEn: byId.nameEn,
        aliases: [byId.nameCkb, byId.nameEn, ...byId.keywords],
      };
    }
  }

  // 2. Exact coordinate lookup (prevents multi-city desc strings or vague labels like "کوردستان" from misrouting)
  const byCoords = findOutsideCityByCoords(fact.lat, fact.lng);
  if (byCoords) {
    return {
      id: byCoords.id,
      name: lang === 'en' ? byCoords.nameEn : byCoords.nameCkb,
      nameEn: byCoords.nameEn,
      aliases: [byCoords.nameCkb, byCoords.nameEn, ...byCoords.keywords],
    };
  }

  // 3. Valid structured region field (ignoring previously corrupted parenthesized/generic strings)
  const r = (fact.region || '').trim();
  if (isValidOutsideRegionLabel(r)) {
    const cityFromRegion = findOutsideCityByText(r);
    if (cityFromRegion) {
      return {
        id: cityFromRegion.id,
        name: lang === 'en' ? cityFromRegion.nameEn : cityFromRegion.nameCkb,
        nameEn: cityFromRegion.nameEn,
        aliases: [cityFromRegion.nameCkb, cityFromRegion.nameEn, ...cityFromRegion.keywords],
      };
    }
    const cleanRegionName = translateOutsideLabel(r, fact.provinceId, lang);
    const cleanRegionCkb = translateOutsideLabel(r, fact.provinceId, 'ckb');
    const customId = `outside_${normalizeKurdishSearchText(cleanRegionCkb).replace(/\s+/g, '_') || 'global'}`;
    return {
      id: customId,
      name: cleanRegionName,
      nameEn: translateOutsideLabel(r, fact.provinceId, 'en'),
      aliases: [cleanRegionCkb, cleanRegionName],
    };
  }

  // 4. Desc & title city-keyword match (never extract raw parentheses from fact.name!)
  const cityFromDesc = findOutsideCityByText(fact.desc || '') || findOutsideCityByText(fact.name || '');
  if (cityFromDesc) {
    return {
      id: cityFromDesc.id,
      name: lang === 'en' ? cityFromDesc.nameEn : cityFromDesc.nameCkb,
      nameEn: cityFromDesc.nameEn,
      aliases: [cityFromDesc.nameCkb, cityFromDesc.nameEn, ...cityFromDesc.keywords],
    };
  }

  const fallbackName = lang === 'en' ? 'Outside Kurdistan Borders' : 'دەرەوەی هێڵی کوردستان';
  return {
    id: 'outside_global',
    name: fallbackName,
    nameEn: 'Outside Kurdistan Borders',
    aliases: ['دەرەوەی هێڵی کوردستان', 'Outside Kurdistan Borders'],
  };
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

  // 1. Explicit stored provinceId (skip generic/corrupted outside IDs so polygon & city resolution can re-classify accurately)
  if (fact.provinceId) {
    const exactProv = KURDISTAN_PROVINCES.find((p) => p.id === fact.provinceId);
    if (exactProv) return localizedProv(exactProv);

    if (fact.provinceId.startsWith('outside_') && !INVALID_OUTSIDE_PROVINCE_IDS.has(fact.provinceId)) {
      const resolvedOutside = resolveOutsideCityFromFact(fact, lang);
      return {
        id: resolvedOutside.id,
        name: resolvedOutside.name,
        nameEn: resolvedOutside.nameEn,
        part: 'outside',
        partName: lang === 'en' ? PART_ENGLISH_NAMES.outside : PART_KURDISH_NAMES.outside,
        partNameEn: PART_ENGLISH_NAMES.outside,
        inKurdistan: false,
        center: [fact.lat || 33.31, fact.lng || 44.36],
        zoom: 7,
        aliases: resolvedOutside.aliases,
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
        // Re-map cached Google fields through updated mapper so stale cached labels stay accurate
        const remapped = mapGoogleAddressToProvince({
          countryCode: cachedGoogle.countryCode,
          adminLevel1: cachedGoogle.adminLevel1,
          adminLevel2: cachedGoogle.adminLevel2,
          locality: cachedGoogle.locality,
          lat: fact.lat,
          lng: fact.lng,
        });
        const dispName = translateOutsideLabel(remapped.provinceName, remapped.provinceId, lang);
        const dispNameEn = translateOutsideLabel(remapped.provinceName, remapped.provinceId, 'en');
        const regEntry = findOutsideCityById(remapped.provinceId);
        return {
          id: remapped.provinceId,
          name: dispName,
          nameEn: dispNameEn,
          part: 'outside',
          partName: lang === 'en' ? PART_ENGLISH_NAMES.outside : PART_KURDISH_NAMES.outside,
          partNameEn: PART_ENGLISH_NAMES.outside,
          inKurdistan: false,
          center: [fact.lat, fact.lng],
          zoom: 7,
          aliases: regEntry ? [regEntry.nameCkb, regEntry.nameEn, ...regEntry.keywords] : [dispName, dispNameEn],
        };
      }
    }
  }

  // 3. Explicit fact.region (only if it matches a Kurdistan province; outside cities are handled carefully in Step 6)
  const r = (fact.region || '').trim();
  if (r && isValidOutsideRegionLabel(r)) {
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

  // 6. Outside Kurdistan: accurate city resolution via coordinates, valid region, and description
  const resolvedOutside = resolveOutsideCityFromFact(fact, lang);

  return {
    id: resolvedOutside.id,
    name: resolvedOutside.name,
    nameEn: resolvedOutside.nameEn,
    part: 'outside',
    partName: lang === 'en' ? PART_ENGLISH_NAMES.outside : PART_KURDISH_NAMES.outside,
    partNameEn: PART_ENGLISH_NAMES.outside,
    inKurdistan: false,
    center: [fact.lat || 33.31, fact.lng || 44.36],
    zoom: 7,
    aliases: resolvedOutside.aliases,
  };
}

/**
 * ژماردن و ئامادەکردنی سەرجەم پارێزگاکان:
 * - ٤٠ پارێزگا و ناوچەی کوردستان هەموویان نیشاندەدرێن تەنانەت ئەگەر ٠ داتایشیان هەبێت.
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

  const outsideList: Array<ProvinceItem & { count: number }> = Array.from(outsideMap.values())
    .filter((p) => p.count >= 1)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

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
