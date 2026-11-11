import { FactItem, GREAT_KURDISTAN_POLYGON } from './kurdishHistoryData';
import { kurdishSearchMatch, normalizeKurdishSearchText } from '../utils/kurdishSearch';

export const KURDISH_PROVINCES_CITIES: FactItem[] = [];
export const ROJAVA_LOCATIONS: FactItem[] = [];

export type ProvincePart = 'south' | 'north' | 'east' | 'west' | 'outside';

export interface ProvinceItem {
  id: string;
  name: string;
  part: ProvincePart;
  partName: string;
  inKurdistan: boolean;
  center: [number, number]; // [lat, lng]
  zoom: number;
  aliases: string[];
}

/**
 * ٤٧ پارێزگا و ناوچەی سەرەکی کوردستانی مەزن (باشوور، باکوور، ڕۆژهەڵات، ڕۆژئاوا)
 * بەپێی داواکاری بەکارهێنەر هەموو ئەم ٤٧ پارێزگایە هەمیشە لە پۆلێندا دەمێننەوە ئەگەر ٠ داتایشیان هەبێت.
 */
export const KURDISTAN_PROVINCES: ProvinceItem[] = [
  // ================= باشووری کوردستان (٩ ناوچە و پارێزگا) =================
  {
    id: 'erbil',
    name: 'هەولێر',
    part: 'south',
    partName: 'باشووری کوردستان',
    inKurdistan: true,
    center: [36.1912, 44.0091],
    zoom: 9,
    aliases: ['هەولێر', 'اربیل', 'Erbil', 'Hewlêr', 'هەولیر', 'ڕەواندز', 'شەقڵاوە', 'کۆیە', 'سۆران', 'چۆمان', 'مێرگەسۆر', 'خەبات'],
  },
  {
    id: 'sulaymaniyah',
    name: 'سلێمانی',
    part: 'south',
    partName: 'باشووری کوردستان',
    inKurdistan: true,
    center: [35.5615, 45.4354],
    zoom: 9,
    aliases: ['سلێمانی', 'السليمانية', 'Sulaymaniyah', 'Silêmanî', 'سلیمانی', 'شارباژێڕ', 'پشدەر', 'قەڵادزێ', 'ڕانیە', 'دووکان', 'دەربەندیخان', 'پێنجوێن', 'سەیدسادق', 'ماوەت', 'چەمچەماڵ'],
  },
  {
    id: 'duhok',
    name: 'دهۆک',
    part: 'south',
    partName: 'باشووری کوردستان',
    inKurdistan: true,
    center: [36.8679, 42.9885],
    zoom: 9,
    aliases: ['دهۆک', 'دهوك', 'Duhok', 'Dihok', 'زاخۆ', 'ئامێدی', 'ئاکرێ', 'شێخان', 'بەردەڕەش', 'سێمێل'],
  },
  {
    id: 'halabja',
    name: 'هەڵەبجە',
    part: 'south',
    partName: 'باشووری کوردستان',
    inKurdistan: true,
    center: [35.1778, 45.9861],
    zoom: 10,
    aliases: ['هەڵەبجە', 'حلبجة', 'Halabja', 'Helebce', 'هەلەبجە', 'هەورامان', 'خورماڵ', 'بیارە', 'سیروان', 'تەوێڵە'],
  },
  {
    id: 'kirkuk',
    name: 'کەرکووک',
    part: 'south',
    partName: 'باشووری کوردستان',
    inKurdistan: true,
    center: [35.4681, 44.3922],
    zoom: 9,
    aliases: ['کەرکووک', 'کەرکوک', 'کرکوک', 'Kirkuk', 'Kerkûk', 'داقووق', 'حەویجە', 'دووبز', 'لەیلان', 'شوان', 'قەرەهەنجیر'],
  },
  {
    id: 'garmian_diyala',
    name: 'گەرمیان و خانەقین',
    part: 'south',
    partName: 'باشووری کوردستان',
    inKurdistan: true,
    center: [34.3524, 45.3855],
    zoom: 9,
    aliases: ['گەرمیان', 'خانەقین', 'کفری', 'کەلار', 'مەندەلی', 'جەلەولا', 'قۆڕەتوو', 'قەرەتەپە', 'دیالە', 'Khanaqin', 'Garmian', 'سەعدیە', 'کفری'],
  },
  {
    id: 'sinjar_nineveh',
    name: 'شنگال و دەشتی نەینەوا',
    part: 'south',
    partName: 'باشووری کوردستان',
    inKurdistan: true,
    center: [36.3209, 41.8624],
    zoom: 9,
    aliases: ['شنگال', 'سنجار', 'Sinjar', 'دەشتی نەینەوا', 'بەعشیقە', 'شێخان', 'تەلکێف', 'حەمدانیە', 'قەرەقۆش', 'ئەلقۆش', 'تەلعەفەر', 'زومار'],
  },
  {
    id: 'tuz_khurmatu',
    name: 'خورماتوو',
    part: 'south',
    partName: 'باشووری کوردستان',
    inKurdistan: true,
    center: [34.8872, 44.6331],
    zoom: 9,
    aliases: ['خورماتوو', 'طوزخورماتو', 'خورماتو', 'Tuz Khurmatu', 'سەلاحەدین', 'ئامرلی', 'سلێمان بەی'],
  },
  {
    id: 'badra_jassan',
    name: 'بەدرە و جەسان (واست)',
    part: 'south',
    partName: 'باشووری کوردستان',
    inKurdistan: true,
    center: [33.1042, 45.9528],
    zoom: 9,
    aliases: ['بەدرە', 'جەسان', 'بدرة', 'جسان', 'واست', 'Badra', 'Jassan', 'زرباتیە', 'کوت'],
  },

  // ================= باکووری کوردستان (٢٤ پارێزگا) =================
  {
    id: 'amed',
    name: 'ئامەد (دیاربەکر)',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    center: [37.9144, 40.2306],
    zoom: 9,
    aliases: ['ئامەد', 'دیاربەکر', 'دیاربکر', 'Amed', 'Diyarbakir', 'Diyarbekir', 'پایاس', 'فارقین', 'سلیڤان', 'بیسمل', 'ئەرغەنی', 'قوڵپ', 'لیجە', 'سوور'],
  },
  {
    id: 'van',
    name: 'وان',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    center: [38.5012, 43.3749],
    zoom: 9,
    aliases: ['وان', 'Van', 'Wan', 'دەریاچەی وان', 'تووشپا', 'ئەردیش', 'مورادیە', 'باشکەلا', 'گێڤاش', 'ئۆزالپ', 'ئەردیش'],
  },
  {
    id: 'mardin',
    name: 'ماردین',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    center: [37.3129, 40.7339],
    zoom: 9,
    aliases: ['ماردین', 'Mardin', 'Mêrdîn', 'نسێبین', 'میدیات', 'قۆسەر', 'دێرک چیا', 'ستەور', 'کەربۆران', 'یەشیللی'],
  },
  {
    id: 'bitlis',
    name: 'بەدلیس',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    center: [38.4006, 42.1095],
    zoom: 9,
    aliases: ['بەدلیس', 'Bitlis', 'Bedlîs', 'خەڵات', 'تەتوان', 'نۆڕشین', 'مۆتکی', 'خیزان', 'ئەخڵات'],
  },
  {
    id: 'urfa',
    name: 'ڕحا (ئورفا)',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    center: [37.1674, 38.7955],
    zoom: 9,
    aliases: ['ڕحا', 'ئورفا', 'شانلی ئورفا', 'Riha', 'Urfa', 'Sanliurfa', 'حەڕان', 'سوێرەک', 'وێرانشار', 'بێریجیک', 'پرسیوس', 'حەلوانی'],
  },
  {
    id: 'dersim',
    name: 'دێرسم (تونجەلی)',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    center: [39.1081, 39.5478],
    zoom: 9,
    aliases: ['دێرسم', 'تونجەلی', 'Dersim', 'Tunceli', 'پردیسوور', 'خۆزات', 'نازمیە', 'مازگرت', 'چەمیشگەزەک', 'پولور'],
  },
  {
    id: 'batman',
    name: 'باتمان',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    center: [37.8874, 41.1322],
    zoom: 9,
    aliases: ['باتمان', 'ئێلح', 'Batman', 'Êlih', 'حەسەنکێف', 'قوبین', 'کۆزلۆک', 'ساسۆن', 'گەرمیک'],
  },
  {
    id: 'siirt',
    name: 'سێرت',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    center: [37.9333, 41.95],
    zoom: 9,
    aliases: ['سێرت', 'سێرتە', 'Siirt', 'Sêrt', 'هاڤێل', 'دێھ', 'شێروان', 'میسریج', 'بەرواری'],
  },
  {
    id: 'hakkari',
    name: 'جۆلەمێرگ (حەکاری)',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    center: [37.5744, 43.7408],
    zoom: 9,
    aliases: ['جۆلەمێرگ', 'حەکاری', 'Colemêrg', 'Hakkari', 'گەڤەر', 'شەمزینان', 'چەلێ', 'یوکسێکۆڤا'],
  },
  {
    id: 'sirnak',
    name: 'شڕنەخ',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    center: [37.5186, 42.4594],
    zoom: 9,
    aliases: ['شڕنەخ', 'شیرناخ', 'Sirnak', 'Şirnex', 'جزیرە', 'سلۆپی', 'ئیدل', 'قڵابان', 'بەسەباب', 'حەزەخ'],
  },
  {
    id: 'mus',
    name: 'مووش',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    center: [38.7432, 41.491],
    zoom: 9,
    aliases: ['مووش', 'Mus', 'Mûs', 'مەلازگرد', 'گۆمگۆم', 'قۆپ', 'تێلی', 'وارشین'],
  },
  {
    id: 'agri',
    name: 'ئاگری',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    center: [39.7191, 43.0503],
    zoom: 9,
    aliases: ['ئاگری', 'Agri', 'Agirî', 'بایەزید', 'دۆغوبایەزید', 'پاتنۆس', 'دیادین', 'گیادین', 'توتەک', 'ئەلشکیرت'],
  },
  {
    id: 'igdir',
    name: 'ئیدر',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    center: [39.9237, 44.045],
    zoom: 9,
    aliases: ['ئیدر', 'ئیغدیر', 'Igdir', 'Îdir', 'تووزلوجا', 'قوڵپ', 'ئارالک'],
  },
  {
    id: 'kars',
    name: 'قەرس',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    center: [40.6013, 43.0975],
    zoom: 9,
    aliases: ['قەرس', 'قارص', 'Kars', 'Qers', 'سەریقامیش', 'کاغزمان', 'دیگۆر', 'ئارپاچای', 'سلێمانلی'],
  },
  {
    id: 'erzurum',
    name: 'ئەرزڕۆم',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    center: [39.9055, 41.2658],
    zoom: 9,
    aliases: ['ئەرزڕۆم', 'ئەرزەرۆم', 'ارزروم', 'Erzurum', 'Erzerom', 'خنووس', 'قەرەچۆبان', 'تەرمان', 'شێنکایا', 'تەکمان'],
  },
  {
    id: 'erzincan',
    name: 'ئەرزنگان',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    center: [39.75, 39.5],
    zoom: 9,
    aliases: ['ئەرزنگان', 'ئەرزنجان', 'Erzincan', 'Erzîngan', 'کەماخ', 'تەرجان', 'ئیلیچ', 'ڕەفاهیە', 'چاییرلی'],
  },
  {
    id: 'malatya',
    name: 'مەلاتیە',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    center: [38.3552, 38.3095],
    zoom: 9,
    aliases: ['مەلاتیە', 'مەلاتیا', 'Malatya', 'Meletî', 'خەربووت', 'دارەندە', 'ئارگۆڤان', 'پۆتورگە', 'ئەکچەداغ'],
  },
  {
    id: 'adiyaman',
    name: 'سەمسوور (ئادیامان)',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    center: [37.7648, 38.2786],
    zoom: 9,
    aliases: ['سەمسوور', 'ئادیامان', 'Samsur', 'Adiyaman', 'کاحتا', 'گۆلباشی', 'بێسنی', 'چەلیکهان', 'چیای نەمروود', 'سامسور'],
  },
  {
    id: 'bingol',
    name: 'چەولیگ (بینگۆل)',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    center: [38.8854, 40.4983],
    zoom: 9,
    aliases: ['چەولیگ', 'بینگۆل', 'Cewlik', 'Bingol', 'داراهێنێ', 'کانیرەش', 'کیغی', 'یەدیسو', 'گەنچ'],
  },
  {
    id: 'elazig',
    name: 'خارپێت (ئەلازیغ)',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    center: [38.6748, 39.2225],
    zoom: 9,
    aliases: ['خارپێت', 'ئەلازیغ', 'Xarpet', 'Elazig', 'پالو', 'قۆڤانجلار', 'مادەن', 'کەبان', 'باژار', 'قەرەکۆچان'],
  },
  {
    id: 'gaziantep',
    name: 'دیلۆک (عەنتاب)',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    center: [37.0662, 37.3833],
    zoom: 9,
    aliases: ['دیلۆک', 'عەنتاب', 'گازیعەنتاب', 'Dilok', 'Gaziantep', 'نێزیپ', 'ئیسلاحیە', 'کارکامیش', 'یاوزەلی', 'ئۆغوزەلی'],
  },
  {
    id: 'maras',
    name: 'مەرعەش',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    center: [37.5753, 36.9228],
    zoom: 9,
    aliases: ['مەرعەش', 'قەهرەمانمەرعەش', 'Maras', 'Kahramanmaras', 'ئەلبستان', 'پازارچیک', 'ئەفشین', 'گۆکسون', 'توروغڵو'],
  },
  {
    id: 'sivas',
    name: 'سێواس (کۆچگری)',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    center: [39.7477, 37.0179],
    zoom: 9,
    aliases: ['سێواس', 'کۆچگری', 'Sivas', 'Sêwaz', 'زارا', 'دیڤریگی', 'ئیمرانلی', 'کانگال', 'هافیک'],
  },
  {
    id: 'ardahan',
    name: 'ئەردێخان',
    part: 'north',
    partName: 'باکووری کوردستان',
    inKurdistan: true,
    center: [41.1105, 42.7022],
    zoom: 9,
    aliases: ['ئەردێخان', 'ئەرداهان', 'Ardahan', 'Erdêxan', 'گۆلە', 'چڵدر', 'پۆسۆف', 'دامال'],
  },

  // ================= ڕۆژهەڵاتی کوردستان (٩ پارێزگا) =================
  {
    id: 'sanandaj',
    name: 'سنە (کوردستان)',
    part: 'east',
    partName: 'ڕۆژهەڵاتی کوردستان',
    inKurdistan: true,
    center: [35.3144, 46.9923],
    zoom: 9,
    aliases: ['سنە', 'سنندج', 'Sanandaj', 'Sine', 'مەریوان', 'سەقز', 'بانە', 'دیواندەرە', 'قوروە', 'بیجاڕ', 'کامێران', 'سەوڵاوا', 'دەولەت ئاباد'],
  },
  {
    id: 'kermanshah',
    name: 'کرماشان',
    part: 'east',
    partName: 'ڕۆژهەڵاتی کوردستان',
    inKurdistan: true,
    center: [34.3277, 47.0778],
    zoom: 9,
    aliases: ['کرماشان', 'کرمانشاه', 'Kermanshah', 'Kirmashan', 'قەسری شیرین', 'سەرپێڵی زەهاو', 'ئیسلام ئاباد', 'پاوە', 'جوانڕۆ', 'ڕەوانسەر', 'گیڵانغەرب', 'کەنگاوەر', 'سونقوڕ', 'سەحنە', 'بێستوون', 'کرند'],
  },
  {
    id: 'ilam',
    name: 'ئیلام',
    part: 'east',
    partName: 'ڕۆژهەڵاتی کوردستان',
    inKurdistan: true,
    center: [33.6374, 46.4227],
    zoom: 9,
    aliases: ['ئیلام', 'ایلام', 'Ilam', 'Îlam', 'دەهلۆڕان', 'مێهران', 'ئەیوان', 'ئابدانان', 'دەرەشار', 'شیروان', 'بەدرە ڕۆژهەڵات', 'مەلەکشاهی', 'چەردەڤۆڵ'],
  },
  {
    id: 'urmia',
    name: 'ورمێ (ئازەربایجانی ڕۆژاوا)',
    part: 'east',
    partName: 'ڕۆژهەڵاتی کوردستان',
    inKurdistan: true,
    center: [37.5527, 45.0761],
    zoom: 9,
    aliases: ['ورمێ', 'ارومیە', 'Urmia', 'Wirmê', 'مەهاباد', 'بۆکان', 'پیرانشار', 'سەردەشت', 'شنۆ', 'خۆی', 'ماکۆ', 'سەڵماس', 'نەغەدە', 'تیکاب', 'شاتین دژ', 'چاڵدێران', 'پۆلدەشت', 'ڕەبەت', 'قەرەزیائەدین'],
  },
  {
    id: 'lorestan',
    name: 'لوڕستان',
    part: 'east',
    partName: 'ڕۆژهەڵاتی کوردستان',
    inKurdistan: true,
    center: [33.4878, 48.3558],
    zoom: 9,
    aliases: ['لوڕستان', 'لرستان', 'Lorestan', 'Loristan', 'خورەماوە', 'خوڕەم ئاباد', 'بۆڕوجێرد', 'کۆیەشت', 'ئەلیگودەرز', 'دووروود', 'نوورئاباد', 'ئەزنا', 'پۆلدوختەر', 'شوانکارە', 'ئەلشتر'],
  },
  {
    id: 'chaharmahal',
    name: 'چوارمەحاڵ و بەختیاری',
    part: 'east',
    partName: 'ڕۆژهەڵاتی کوردستان',
    inKurdistan: true,
    center: [32.3256, 50.8644],
    zoom: 9,
    aliases: ['چوارمەحاڵ', 'بەختیاری', 'چهارمحال و بختیاری', 'Chaharmahal', 'Bakhtiari', 'شەهریکورد', 'لۆردێگان', 'بۆرووجن', 'فارسان', 'کوهرەنگ', 'ئەردەڵ'],
  },
  {
    id: 'kohgiluyeh',
    name: 'کۆهگیلوویە و بۆیەر ئەحمەد',
    part: 'east',
    partName: 'ڕۆژهەڵاتی کوردستان',
    inKurdistan: true,
    center: [30.6684, 51.5912],
    zoom: 9,
    aliases: ['کۆهگیلوویە', 'بۆیەر ئەحمەد', 'کهگیلویە و بویراحمد', 'Kohgiluyeh', 'یاسووج', 'دێهدەشت', 'گۆچساران', 'دنا', 'چەرام', 'بەهمەئی'],
  },
  {
    id: 'izeh_khuzestan',
    name: 'ئیزە و باکووری خووزستان',
    part: 'east',
    partName: 'ڕۆژهەڵاتی کوردستان',
    inKurdistan: true,
    center: [31.8328, 49.8692],
    zoom: 9,
    aliases: ['ئیزە', 'خووزستان', 'ئەیلاق', 'شوشتەر', 'دێزفوول', 'مەسجید سولەیمان', 'ئەندیمشک', 'Izeh', 'Khuzestan', 'باغ مەلەک', 'لالین'],
  },
  {
    id: 'hamedan',
    name: 'هەمەدان',
    part: 'east',
    partName: 'ڕۆژهەڵاتی کوردستان',
    inKurdistan: true,
    center: [34.7989, 48.515],
    zoom: 9,
    aliases: ['هەمەدان', 'همدان', 'Hamedan', 'Hemedan', 'ئەکباتانا', 'مەلایێر', 'نەهاوەند', 'تووسرکان', 'کەبوودەرئاهەنگ', 'ئەسەدئاباد', 'ڕەزەن'],
  },

  // ================= ڕۆژئاوای کوردستان (٥ پارێزگا و هەرێم) =================
  {
    id: 'hasakah',
    name: 'حەسەکە و قامیشلۆ',
    part: 'west',
    partName: 'ڕۆژئاوای کوردستان',
    inKurdistan: true,
    center: [36.5022, 40.7483],
    zoom: 9,
    aliases: ['حەسەکە', 'الحسكة', 'Hasakah', 'قامیشلۆ', 'قامشلي', 'Qamishli', 'عاموودا', 'دێرک', 'سەرێکانی', 'تەلتەمر', 'ڕمێلان', 'درباسیە', 'جەزیرە', 'تەل حەمیس'],
  },
  {
    id: 'kobani',
    name: 'کۆبانێ',
    part: 'west',
    partName: 'ڕۆژئاوای کوردستان',
    inKurdistan: true,
    center: [36.8911, 38.3533],
    zoom: 9,
    aliases: ['کۆبانێ', 'کۆبانی', 'عين العرب', 'Kobani', 'Kobanî', 'سەڕین', 'شێخلەر', 'قەناعە'],
  },
  {
    id: 'afrin',
    name: 'عەفرین',
    part: 'west',
    partName: 'ڕۆژئاوای کوردستان',
    inKurdistan: true,
    center: [36.5119, 36.8689],
    zoom: 9,
    aliases: ['عەفرین', 'عفرين', 'Afrin', 'Efrîn', 'چیای کورمێنج', 'جندرێس', 'ڕاجۆ', 'مەعبەتلی', 'بلبل', 'شێراوا', 'شێخ حەدید'],
  },
  {
    id: 'sheikh_maqsoud_shahba',
    name: 'شێخ مەقسوود، شەهبا و مەنبەج',
    part: 'west',
    partName: 'ڕۆژئاوای کوردستان',
    inKurdistan: true,
    center: [36.35, 37.30],
    zoom: 9,
    aliases: ['شێخ مەقسوود', 'شەهبا', 'مەنبەج', 'تەل ڕەفعەت', 'باکووری حەلەب', 'حەلەب', 'Sheikh Maqsoud', 'Shahba', 'Manbij'],
  },
  {
    id: 'gire_spi',
    name: 'گرێ سپی',
    part: 'west',
    partName: 'ڕۆژئاوای کوردستان',
    inKurdistan: true,
    center: [36.6975, 38.9553],
    zoom: 9,
    aliases: ['گرێ سپی', 'تل أبيض', 'Tell Abyad', 'Girê Spî', 'عەین عیسا', 'سلوک'],
  },
];

/**
 * پشکنینی کەوتنی خاڵێک لە ناو سنووری مێژوویی کوردستانی مەزن بەپێی پۆلیگۆنی نەخشە
 */
export function isPointInKurdistanPolygon(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  let inside = false;
  for (let i = 0, j = GREAT_KURDISTAN_POLYGON.length - 1; i < GREAT_KURDISTAN_POLYGON.length; j = i++) {
    const xi = GREAT_KURDISTAN_POLYGON[i][0];
    const yi = GREAT_KURDISTAN_POLYGON[i][1];
    const xj = GREAT_KURDISTAN_POLYGON[j][0];
    const yj = GREAT_KURDISTAN_POLYGON[j][1];

    const intersect = yi > lng !== yj > lng && lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * دۆزینەوەی پارێزگای پەیوەندیدار بە یەک فاکت
 */
export function matchFactToProvince(fact: FactItem): ProvinceItem | { id: string; name: string; part: 'outside'; partName: 'دەرەوەی کوردستان'; inKurdistan: false; center: [number, number]; zoom: number; aliases: string[] } | null {
  if (!fact) return null;

  const r = (fact.region || '').trim();
  const n = (fact.name || '').trim();
  const d = (fact.desc || '').trim();
  const t = (fact.fullText || '').trim();

  // 1. گەڕان بەدوای هاوتایی ڕاستەوخۆ لەگەڵ ناو یان هاوناوی (aliases) ٤٧ پارێزگاکەی کوردستان
  for (const prov of KURDISTAN_PROVINCES) {
    if (r && kurdishSearchMatch(prov.name, r)) return prov;
    for (const alias of prov.aliases) {
      if (r && kurdishSearchMatch(alias, r)) return prov;
      if (kurdishSearchMatch(n, alias)) return prov;
      if (kurdishSearchMatch(d, alias)) return prov;
    }
  }

  // 2. ئەگەر بە ناو نەدۆزرایەوە، پشکنین بەپێی دووری جوگرافی لە سەنتەری پارێزگاکانی کوردستان
  if (Number.isFinite(fact.lat) && Number.isFinite(fact.lng)) {
    let closestProv: ProvinceItem | null = null;
    let minDistanceSq = Infinity;

    for (const prov of KURDISTAN_PROVINCES) {
      const dLat = fact.lat - prov.center[0];
      const dLng = fact.lng - prov.center[1];
      const distSq = dLat * dLat + dLng * dLng;

      // ئەگەر لە مەودای نزیکەی ٠.٥٥ پلە (نزیکەی ٦٠ کیلۆمەتر) بێت
      if (distSq < minDistanceSq && distSq < 0.35) {
        minDistanceSq = distSq;
        closestProv = prov;
      }
    }

    if (closestProv) {
      return closestProv;
    }

    // 3. ئەگەر لە ناو هێڵی پۆلیگۆنی کوردستان بوو بەڵام ناوی تایبەت نەبوو، نزیکترین پارێزگای کوردستان دیاری دەکرێت
    if (isPointInKurdistanPolygon(fact.lat, fact.lng)) {
      for (const prov of KURDISTAN_PROVINCES) {
        const dLat = fact.lat - prov.center[0];
        const dLng = fact.lng - prov.center[1];
        const distSq = dLat * dLat + dLng * dLng;
        if (distSq < minDistanceSq) {
          minDistanceSq = distSq;
          closestProv = prov;
        }
      }
      if (closestProv) return closestProv;
    }
  }

  // 4. ئەگەر خاڵەکە یان بابەتەکە بە تەواوی لە دەرەوەی هێڵی کوردستان بوو:
  // ناوی شوێن یان شارەکە لە region وەردەگیرێت، ئەگەر نەبوو لە desc یاخود 'دەرەوەی کوردستان'
  const outsideName = r || (d ? d.split('-')[0].trim() : 'دەرەوەی هێڵی کوردستان');
  const outsideId = `outside_${normalizeKurdishSearchText(outsideName).replace(/\s+/g, '_') || 'global'}`;

  return {
    id: outsideId,
    name: outsideName,
    part: 'outside',
    partName: 'دەرەوەی کوردستان',
    inKurdistan: false,
    center: [fact.lat || 33.31, fact.lng || 44.36],
    zoom: 7,
    aliases: [outsideName],
  };
}

/**
 * ژماردن و ئامادەکردنی سەرجەم پارێزگاکان بەپێی یاسای بەکارهێنەر:
 * - ٤٧ پارێزگای کوردستان هەموویان نیشاندەدرێن تەنانەت ئەگەر ٠ داتایشیان هەبێت.
 * - پارێزگا یان شوێنەکانی دەرەوەی هێڵی کوردستان تەنها کاتێک دەردەکەون کە خاوەنی لانیکەم ١ داتا بن (count >= 1).
 */
export function getProvincesWithCounts(facts: FactItem[]): {
  allProvinces: Array<ProvinceItem & { count: number }>;
  kurdistanProvinces: Array<ProvinceItem & { count: number }>;
  outsideProvinces: Array<ProvinceItem & { count: number }>;
  totalFacts: number;
} {
  const countsMap = new Map<string, number>();
  const outsideMap = new Map<string, ProvinceItem & { count: number }>();

  // ژماردنی سەرەتایی ٠ بۆ هەموو ٤٧ پارێزگاکەی کوردستان
  KURDISTAN_PROVINCES.forEach((p) => {
    countsMap.set(p.id, 0);
  });

  facts.forEach((fact) => {
    const matched = matchFactToProvince(fact);
    if (!matched) return;

    if (matched.inKurdistan) {
      countsMap.set(matched.id, (countsMap.get(matched.id) || 0) + 1);
    } else {
      // شوێنی دەرەوەی هێڵی کوردستان
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

  // هەموو ٤٧ پارێزگای کوردستان بە ژمارەی داتاکانیان (تەنانەت ئەگەر ٠ بێت)
  const kurdistanList: Array<ProvinceItem & { count: number }> = KURDISTAN_PROVINCES.map((p) => ({
    ...p,
    count: countsMap.get(p.id) || 0,
  }));

  // تەنها ئەو شوێنانەی دەرەوەی کوردستان کە خاوەنی لانیکەم ١ داتان (count >= 1)
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
