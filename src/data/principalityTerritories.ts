/**
 * Historical territory polygons and map overlays for Kurdish principalities, states, and empires.
 * Allows each principality/state/empire to transform the map into its authentic historical borders.
 */

export interface PrincipalityTerritory {
  id: string;
  name: string;
  kurdishTitle: string;
  color: string;
  borderColor: string;
  fillColor: string;
  center: [number, number];
  defaultZoom: number;
  polygon: [number, number][];
  description: string;
  capital: string;
  rulerExample?: string;
  overlayImageUrl?: string;
  overlayBounds?: [[number, number], [number, number]];
}

export const HISTORICAL_TERRITORIES: PrincipalityTerritory[] = [
  {
    id: 'soran',
    name: 'میرنشینی سۆران',
    kurdishTitle: 'سنووری فەرمانڕەوایی میرنشینی سۆران',
    color: '#f59e0b', // Amber / Gold
    borderColor: '#fbbf24',
    fillColor: '#d97706',
    center: [36.65, 44.55],
    defaultZoom: 8,
    capital: 'ڕواندز / هەولێر / حەریر',
    rulerExample: 'میر محەمەد (پاشای گەورە / پاشای کۆرە)',
    description:
      'میرنشینی سۆران لە سەردەمی زێڕینی میر محەمەد (پاشای کۆرە) دەسەڵاتی لە ڕواندز، باڵەکایەتی، هەولێر، کۆیە، ئامێدی و هەتا زێی گەورە و زێی بچووک و دەروازەی موکریان و ئورمیە فراوان بوو، خاوەنی سوپای تۆپخانە و خومخانەی تایبەت بە خۆی بوو.',
    polygon: [
      [36.95, 43.90],
      [37.20, 44.30],
      [37.15, 44.90],
      [36.90, 45.30],
      [36.45, 45.25],
      [36.00, 44.75],
      [35.95, 44.05],
      [36.20, 43.70],
      [36.65, 43.75],
      [36.95, 43.90],
    ],
  },
  {
    id: 'baban',
    name: 'میرنشینی بابان',
    kurdishTitle: 'سنووری فەرمانڕەوایی میرنشینی بابان',
    color: '#8b5cf6', // Royal Purple
    borderColor: '#a78bfa',
    fillColor: '#7c3aed',
    center: [35.55, 45.45],
    defaultZoom: 8,
    capital: 'سلێمانی / قەڵاچوالان',
    rulerExample: 'ئیبراهیم پاشای بابان و ئەحمەد پاشای بابان',
    description:
      'میرنشینی بەناوبانگی بابان لە باشووری کوردستان کە پایتەختەکەی لە قەڵاچوالانەوە گوازرایەوە بۆ شاری سلێمانی (١٧٨٤ز). سنوورەکەی لە شارەزوور، کەرکووک، کفری، ڕانیە، پشدەر تا سەردەشت و سنووری ئەردەڵان کشابوو.',
    polygon: [
      [36.35, 44.90],
      [36.30, 45.60],
      [35.85, 46.10],
      [35.25, 46.15],
      [34.65, 45.40],
      [34.80, 44.60],
      [35.40, 44.30],
      [35.95, 44.70],
      [36.35, 44.90],
    ],
  },
  {
    id: 'badinan',
    name: 'میرنشینی بادینان',
    kurdishTitle: 'سنووری فەرمانڕەوایی میرنشینی بادینان',
    color: '#10b981', // Emerald Green
    borderColor: '#34d399',
    fillColor: '#059669',
    center: [37.09, 43.49],
    defaultZoom: 8,
    capital: 'ئامێدی / دهۆک',
    rulerExample: 'سوڵتان حوسێن وەلی و بەهادین بەگ',
    description:
      'میرنشینێکی کۆنی سەربەرز بە پایتەختی قەڵای نەبەزی ئامێدی لە ساڵی ١٣٧٦ تا ١٨٤٣ز. سنوورەکەی دەشتی نەینەوا، دهۆک، زاخۆ، ئاکرێ، زێبار و تا سنووری بۆتان و هەکاری دەگرتەوە.',
    polygon: [
      [37.40, 42.50],
      [37.45, 43.60],
      [37.20, 44.05],
      [36.70, 43.90],
      [36.65, 43.10],
      [37.00, 42.40],
      [37.40, 42.50],
    ],
  },
  {
    id: 'ardalan',
    name: 'میرنشینی ئەردەڵان',
    kurdishTitle: 'سنووری فەرمانڕەوایی میرنشینی ئەردەڵان',
    color: '#06b6d4', // Cyan / Teal
    borderColor: '#22d3ee',
    fillColor: '#0891b2',
    center: [35.32, 46.99],
    defaultZoom: 8,
    capital: 'سنە / مەریوان / زەڵم',
    rulerExample: 'خەسرەو خانی ئەردەڵان و مەستوورە ئەردەڵان',
    description:
      'میرنشینی دێرینی ئەردەڵان لە ڕۆژهەڵاتی کوردستان لە سەدەی ١٢ تا ١٨٦٧ز. ناوەندەکەی شاری سنە، مەریوان، هەورامان، سەقز، بانە، بیجاڕ و بەشێک لە لوڕستان و کرماشان بووە.',
    polygon: [
      [36.35, 46.00],
      [36.45, 47.70],
      [35.50, 47.90],
      [34.80, 47.10],
      [34.90, 46.10],
      [35.60, 45.75],
      [36.35, 46.00],
    ],
  },
  {
    id: 'bohtan',
    name: 'میرنشینی بۆتان',
    kurdishTitle: 'سنووری فەرمانڕەوایی میرنشینی بۆتان',
    color: '#ef4444', // Crimson / Red
    borderColor: '#f87171',
    fillColor: '#dc2626',
    center: [37.33, 42.18],
    defaultZoom: 8,
    capital: 'جزیرەی بۆتان / فینیک',
    rulerExample: 'میر بەدرخان پاشا و مەم و زین',
    description:
      'میرنشینی مەزنی بۆتان لە باکووری کوردستان بە پایتەختی جەزیرەی بۆتان (Cizre). لە سەردەمی میر بەدرخان پاشا لە ساڵانی ١٨٤٠دا خاوەنی سەربەخۆیی تەواو و هێزێکی سەربازیی یەکگرتوو بوو.',
    polygon: [
      [37.95, 41.50],
      [37.85, 42.90],
      [37.15, 42.60],
      [37.05, 41.80],
      [37.45, 41.35],
      [37.95, 41.50],
    ],
  },
  {
    id: 'hakkari',
    name: 'میرنشینی هەکاری',
    kurdishTitle: 'سنووری فەرمانڕەوایی میرنشینی هەکاری',
    color: '#ec4899', // Pink
    borderColor: '#f472b6',
    fillColor: '#db2777',
    center: [37.57, 43.74],
    defaultZoom: 8,
    capital: 'جۆلەمێرگ / شەمزینان',
    rulerExample: 'میر نوورەدین بەگ و میر شەرەف بەگ',
    description:
      'میرنشینێکی قایمی چیایی لە نێوان باکوور و ڕۆژهەڵاتی کوردستان؛ جۆلەمێرگ (Hakkari)، گەڤەر و شەمزینان لە گرنگترین پێگەکانی بوون.',
    polygon: [
      [37.85, 43.30],
      [37.90, 44.75],
      [36.95, 44.70],
      [37.15, 43.50],
      [37.85, 43.30],
    ],
  },
  {
    id: 'bitlis',
    name: 'میرنشینی بەدلیس (ڕۆژەکی)',
    kurdishTitle: 'سنووری فەرمانڕەوایی میرنشینی بەدلیس',
    color: '#eab308', // Yellow
    borderColor: '#fde047',
    fillColor: '#ca8a04',
    center: [38.40, 42.11],
    defaultZoom: 8,
    capital: 'بەدلیس / ساسۆن / خیزان',
    rulerExample: 'شەرەفخانی بەدلیسی (نووسەری شەرەفنامە)',
    description:
      'میرنشینی بەناوبانگی بەدلیس لە دەوروبەری دەریاچەی وان بە قەڵای پتەوی بەدلیس، کە مەڵبەندی مێژوونووسی گەورە شەرەفخانی بەدلیسی و هۆزی ڕۆژەکی بوو.',
    polygon: [
      [38.95, 41.20],
      [38.90, 42.70],
      [38.15, 42.50],
      [38.05, 41.15],
      [38.95, 41.20],
    ],
  },
  {
    id: 'medes',
    name: 'ئیمپراتۆریەتی ماد',
    kurdishTitle: 'سنووری ئیمپراتۆریەتی یەکگرتووی ماد',
    color: '#3b82f6', // Media Blue
    borderColor: '#60a5fa',
    fillColor: '#2563eb',
    center: [36.00, 47.00],
    defaultZoom: 6,
    capital: 'ئەکباتانا (هەمەدان)',
    rulerExample: 'دیاکۆ، فرەوەرتیش، کەیخوسرەو (هوڤەخشەترە)',
    description:
      'ئیمپراتۆریەتی مەزن و یەکگرتووی ماد (٧٠٠ - ٥٥٠ پ.ز) لە ئەکباتانا (هەمەدان). پاش ڕووخاندنی ئیمپراتۆریەتی ئاشوور لە ٦١٢ پ.ز، تەواوی زاگرۆس، مێزۆپۆتامیا تا ڕووباری هالیس لە ئەنادۆڵ لە ژێر دەسەڵاتی مادییەکاندا بوو.',
    polygon: [
      [40.20, 36.00],
      [41.50, 48.00],
      [37.00, 53.00],
      [32.00, 53.50],
      [31.20, 47.00],
      [34.00, 42.50],
      [37.50, 36.00],
      [40.20, 36.00],
    ],
  },
  {
    id: 'zand',
    name: 'دەوڵەتی زەند',
    kurdishTitle: 'سنووری فەرمانڕەوایی دەوڵەتی کوردیی زەند',
    color: '#14b8a6', // Teal
    borderColor: '#2dd4bf',
    fillColor: '#0f766e',
    center: [32.00, 51.00],
    defaultZoom: 6,
    capital: 'شیراز / مەلایەر',
    rulerExample: 'کەریم خانی زەند (وەکیلولڕەعایا)',
    description:
      'دەوڵەتی زەند بە ڕابەرایەتی کەریم خانی زەند لە هۆزی زەندی لوڕی کورد (١٧٥١ - ١٧٩٤ز)، کە لە شیرازەوە تەواوی ئێران و زاگرۆس و بەسرەی بە دادپەروەری بەڕێوە دەبرد.',
    polygon: [
      [35.80, 46.50],
      [36.00, 52.00],
      [31.00, 54.00],
      [28.50, 52.80],
      [29.80, 48.50],
      [33.50, 46.80],
      [35.80, 46.50],
    ],
  },
  {
    id: 'marwanid',
    name: 'دەوڵەتی مەروانی',
    kurdishTitle: 'سنووری فەرمانڕەوایی دەوڵەتی مەروانی',
    color: '#84cc16', // Lime Green
    borderColor: '#a3e635',
    fillColor: '#65a30d',
    center: [38.10, 40.50],
    defaultZoom: 7,
    capital: 'مەیافارقین (سلڤان) / ئامەد (دیاربەکر)',
    rulerExample: 'نەسرودەولە ئەحمەد و باز بەگی کوردی',
    description:
      'دەوڵەتێکی گەورەی کوردی لە باکووری کوردستان لە ساڵانی ٩٩٠ تا ١٠٨٥ز بە پایتەختی مەیافارقین و ئامەد، خاوەنی ئاوەدانی و پێشکەوتنی شارستانی بوو.',
    polygon: [
      [39.10, 39.50],
      [39.20, 42.80],
      [37.70, 42.20],
      [37.20, 39.80],
      [38.10, 39.20],
      [39.10, 39.50],
    ],
  },
  {
    id: 'shaddadid',
    name: 'دەوڵەتی شەدادی',
    kurdishTitle: 'سنووری فەرمانڕەوایی دەوڵەتی شەدادی',
    color: '#6366f1', // Indigo
    borderColor: '#818cf8',
    fillColor: '#4f46e5',
    center: [40.40, 45.50],
    defaultZoom: 7,
    capital: 'گەنجە / دوین / ئانی',
    rulerExample: 'محەمەد کوڕی شەداد و فەزلون',
    description:
      'دەوڵەتی شەدادی لە هۆزی ڕەوادی کوردی لە ناوچەکانی قەوقاز، ئانی، گەنجە و دوین لە نێوان ساڵانی ٩٥١ تا ١١٩٩ز.',
    polygon: [
      [41.20, 43.20],
      [41.40, 47.00],
      [39.60, 46.80],
      [39.50, 43.80],
      [41.20, 43.20],
    ],
  },
  {
    id: 'mahabad',
    name: 'کۆماری دیموکراتیی کوردستان (مەهاباد)',
    kurdishTitle: 'سنووری کۆماری کوردستان لە مەهاباد (١٩٤٦)',
    color: '#dc2626', // Kurdistan Flag Red
    borderColor: '#ef4444',
    fillColor: '#b91c1c',
    center: [36.76, 45.72],
    defaultZoom: 8,
    capital: 'مەهاباد',
    rulerExample: 'پێشەوا قازی محەمەد و مەلا مستەفا بارزانی',
    description:
      'کۆماری دیموکراتیی کوردستان لە ٢ی ڕێبەندانی ١٩٤٦ بە سەرۆکایەتی پێشەوا قازی محەمەد ڕاگەیەندرا. شارەکانی مەهاباد، بۆکان، سەقز، پیرانشار، شنۆ و نەغەدەی لەخۆگرتبوو.',
    polygon: [
      [37.25, 44.80],
      [37.35, 46.20],
      [36.10, 46.45],
      [36.00, 45.05],
      [36.65, 44.75],
      [37.25, 44.80],
    ],
  },
  {
    id: 'sheikh_mahmud',
    name: 'شانشینی کوردستان (مەلیک مەحمود)',
    kurdishTitle: 'سنووری حکومەتی خوارووی کوردستان (١٩١٩ - ١٩٢٤)',
    color: '#059669', // Emerald
    borderColor: '#10b981',
    fillColor: '#047857',
    center: [35.56, 45.43],
    defaultZoom: 8,
    capital: 'سلێمانی',
    rulerExample: 'شێخ مەحمودی حەفید (مەلیکی کوردستان)',
    description:
      'حکومەت و شانشینی کوردستان بە سەرۆکایەتی شێخ مەحمودی نەمر لە سلێمانی لە ساڵانی ١٩١٩ تا ١٩٢٤ بە بڵاوکردنەوەی ڕۆژنامەی بانگی کوردستان و دەرهێنانی پول و سوپای نیشتمانی.',
    polygon: [
      [36.45, 44.70],
      [36.20, 46.00],
      [35.10, 46.00],
      [34.95, 44.40],
      [35.80, 44.30],
      [36.45, 44.70],
    ],
  },
  {
    id: 'mitanni',
    name: 'ئیمپراتۆریەتی میتانی',
    kurdishTitle: 'سنووری ئیمپراتۆریەتی دێرینی میتانی',
    color: '#d97706', // Amber
    borderColor: '#f59e0b',
    fillColor: '#b45309',
    center: [36.80, 41.50],
    defaultZoom: 7,
    capital: 'واشۆکانی',
    rulerExample: 'شا توشراتا و شا شوتارنا',
    description:
      'ئیمپراتۆریەتی هۆری-میتانی (١٥٠٠ - ١٣٠٠ پ.ز) بە پایتەختی واشۆکانی لە نێوان فورات و دیجلە و باکوور و ڕۆژئاوای کوردستان.',
    polygon: [
      [38.20, 39.50],
      [38.50, 44.00],
      [35.50, 44.50],
      [34.50, 40.00],
      [36.20, 37.00],
      [38.20, 39.50],
    ],
  },
  {
    id: 'urartu',
    name: 'دەوڵەتی ئۆرارتۆ',
    kurdishTitle: 'سنووری دەوڵەتی دێرینی ئۆرارتۆ (وان)',
    color: '#7c3aed', // Purple
    borderColor: '#8b5cf6',
    fillColor: '#6d28d9',
    center: [38.60, 43.50],
    defaultZoom: 7,
    capital: 'تووشپا (وان)',
    rulerExample: 'ساردوری و مێنوا',
    description:
      'دەوڵەتی بەهێزی ئۆرارتۆ لە دەوروبەری دەریاچەی وان و چیای ئارارات بە قەڵاکانی تووشپا، ڕووساهینیلی و هارپووت.',
    polygon: [
      [40.20, 41.50],
      [40.50, 45.20],
      [37.50, 45.00],
      [37.60, 42.00],
      [39.00, 40.50],
      [40.20, 41.50],
    ],
  },
];

/**
 * Intelligent helper to match any FactItem to its historical territory,
 * or read custom territory defined directly on the fact.
 */
export function findTerritoryForFact(fact: {
  id?: number;
  name?: string;
  desc?: string;
  fullText?: string;
  territoryPolygon?: [number, number][];
  territoryColor?: string;
  overlayImageUrl?: string;
  overlayBounds?: [[number, number], [number, number]];
}): PrincipalityTerritory | null {
  if (!fact) return null;

  // 1. If fact has custom territoryPolygon explicitly defined, create a custom territory object
  if (Array.isArray(fact.territoryPolygon) && fact.territoryPolygon.length >= 3) {
    const poly = fact.territoryPolygon;
    // Calculate simple centroid
    let sumLat = 0;
    let sumLng = 0;
    for (const p of poly) {
      sumLat += p[0];
      sumLng += p[1];
    }
    const center: [number, number] = [sumLat / poly.length, sumLng / poly.length];
    const color = fact.territoryColor || '#f59e0b';

    return {
      id: `custom_${fact.id || 'fact'}`,
      name: fact.name || 'سنووری دەسەڵات',
      kurdishTitle: `نەخشەی سنووری ${fact.name || 'دەسەڵات'}`,
      color,
      borderColor: color,
      fillColor: color,
      center,
      defaultZoom: 8,
      polygon: poly,
      description: fact.desc || 'سنووری دەسەڵاتی دیاریکراو',
      capital: fact.name || '',
      overlayImageUrl: fact.overlayImageUrl,
      overlayBounds: fact.overlayBounds,
    };
  }

  // 2. Intelligent matching based on name / description / text keywords
  const name = (fact.name || '').toLowerCase();
  const desc = (fact.desc || '').toLowerCase();
  const text = (fact.fullText || '').toLowerCase();
  const combined = `${name} ${desc} ${text}`;

  // Check Soran
  if (
    combined.includes('سۆران') ||
    combined.includes('ڕواندز') ||
    combined.includes('پاشای گەورە') ||
    combined.includes('پاشای کۆرە') ||
    combined.includes('میر محەمەد') ||
    name.includes('سۆران')
  ) {
    return HISTORICAL_TERRITORIES.find((t) => t.id === 'soran') || null;
  }

  // Check Baban
  if (
    combined.includes('بابان') ||
    combined.includes('قەڵاچوالان') ||
    combined.includes('ئیبراهیم پاشا') ||
    combined.includes('ئەحمەد پاشای بابان') ||
    name.includes('بابان')
  ) {
    return HISTORICAL_TERRITORIES.find((t) => t.id === 'baban') || null;
  }

  // Check Badinan
  if (
    combined.includes('بادینان') ||
    combined.includes('ئامێدی') ||
    combined.includes('سوڵتان حوسێن وەلی') ||
    combined.includes('بەهادین بەگ') ||
    name.includes('بادینان')
  ) {
    return HISTORICAL_TERRITORIES.find((t) => t.id === 'badinan') || null;
  }

  // Check Ardalan
  if (
    combined.includes('ئەردەڵان') ||
    combined.includes('سنە') ||
    combined.includes('خەسرەو خان') ||
    combined.includes('مەستوورە') ||
    name.includes('ئەردەڵان')
  ) {
    return HISTORICAL_TERRITORIES.find((t) => t.id === 'ardalan') || null;
  }

  // Check Bohtan
  if (
    combined.includes('بۆتان') ||
    combined.includes('بەدرخان') ||
    combined.includes('جەزیرە') ||
    combined.includes('جزیرە') ||
    name.includes('بۆتان')
  ) {
    return HISTORICAL_TERRITORIES.find((t) => t.id === 'bohtan') || null;
  }

  // Check Hakkari
  if (combined.includes('هەکاری') || combined.includes('جۆلەمێرگ') || combined.includes('شەمزینان')) {
    return HISTORICAL_TERRITORIES.find((t) => t.id === 'hakkari') || null;
  }

  // Check Bitlis
  if (
    combined.includes('بەدلیس') ||
    combined.includes('بدلیس') ||
    combined.includes('ڕۆژەکی') ||
    combined.includes('شەرەفخان')
  ) {
    return HISTORICAL_TERRITORIES.find((t) => t.id === 'bitlis') || null;
  }

  // Check Medes
  if (
    combined.includes('ماد') ||
    combined.includes('ئەکباتانا') ||
    combined.includes('دیاکۆ') ||
    combined.includes('کەیخوسرەو') ||
    name.includes('ماد')
  ) {
    return HISTORICAL_TERRITORIES.find((t) => t.id === 'medes') || null;
  }

  // Check Zand
  if (combined.includes('زەند') || combined.includes('کەریم خان') || name.includes('زەند')) {
    return HISTORICAL_TERRITORIES.find((t) => t.id === 'zand') || null;
  }

  // Check Marwanid
  if (combined.includes('مەروانی') || combined.includes('مەیافارقین') || combined.includes('سلڤان')) {
    return HISTORICAL_TERRITORIES.find((t) => t.id === 'marwanid') || null;
  }

  // Check Shaddadid
  if (combined.includes('شەدادی') || combined.includes('گەنجە') || combined.includes('ئانی')) {
    return HISTORICAL_TERRITORIES.find((t) => t.id === 'shaddadid') || null;
  }

  // Check Mahabad
  if (
    combined.includes('مەهاباد') ||
    combined.includes('قازی محەمەد') ||
    combined.includes('کۆماری کوردستان') ||
    combined.includes('٢ی ڕێبەندان')
  ) {
    return HISTORICAL_TERRITORIES.find((t) => t.id === 'mahabad') || null;
  }

  // Check Sheikh Mahmud
  if (
    combined.includes('شێخ مەحمود') ||
    combined.includes('شانشینی کوردستان') ||
    combined.includes('حکومەتی خواروو')
  ) {
    return HISTORICAL_TERRITORIES.find((t) => t.id === 'sheikh_mahmud') || null;
  }

  // Check Mitanni
  if (combined.includes('میتانی') || combined.includes('واشۆکانی')) {
    return HISTORICAL_TERRITORIES.find((t) => t.id === 'mitanni') || null;
  }

  // Check Urartu
  if (combined.includes('ئۆرارتۆ') || combined.includes('تووشپا')) {
    return HISTORICAL_TERRITORIES.find((t) => t.id === 'urartu') || null;
  }

  return null;
}
