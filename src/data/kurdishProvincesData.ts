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
 * ٣٨ پارێزگا و ناوچەی سەرەکی کوردستانی مەزن (باشوور، باکوور، ڕۆژهەڵات، ڕۆژئاوا)
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

  // ================= باکووری کوردستان (٢١ پارێزگا) =================
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
  // North Kurdistan (21)
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
 * بۆ یەکێک لە ٣٨ پارێزگای کوردستان یان ناوچەی دەرەوەی کوردستان
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
        provinceName: locRaw ? `${locRaw} (نەینەوا)` : 'نەینەوا (مووسڵ)',
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
        provinceName: locRaw ? `${locRaw} (دیالە)` : 'دیالە',
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
      return {
        provinceId: 'outside_saladin',
        provinceName: locRaw ? `${locRaw} (سەلاحەدین)` : 'سەلاحەدین',
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
        provinceName: locRaw ? `${locRaw} (واست)` : 'واست',
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
    return { provinceId: 'outside_khuzestan', provinceName: locRaw || 'خووزستان (ئەهواز)', inKurdistan: false };
  }

  // 2. Direct 1-to-1 match against googleAdmin1 across all 38 Kurdistan provinces
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
 * - ٣٨ پارێزگا و ناوچەی کوردستان هەموویان نیشاندەدرێن تەنانەت ئەگەر ٠ داتایشیان هەبێت.
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
