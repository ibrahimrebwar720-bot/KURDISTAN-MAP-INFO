import { FactItem } from '../data/kurdishHistoryData';
import type { AppLanguage } from '../context/LanguageContext';

export interface CenturyOption {
  id: string; // 'all' or numeric string like '-7', '12'
  centuryNumber: number; // 0 for all, negative for BC, positive for AD
  label: string; // e.g. "سەدەی ١٢ی زایینی"
  labelEn: string;
  shortLabel: string; // e.g. "سەدەی ١٢"
  shortLabelEn: string;
  range: string; // e.g. "١١٠٠ - ١٢٠٠ ز"
  rangeEn: string;
  badgeColor?: string;
}

export const CENTURY_OPTIONS: CenturyOption[] = [
  {
    id: 'all',
    centuryNumber: 0,
    label: 'هەموو سەدەکان',
    labelEn: 'All Centuries',
    shortLabel: 'هەموو سەدەکان',
    shortLabelEn: 'All Centuries',
    range: '٣٠٠٠ پ.ز - ٢٠٢٦ ز',
    rangeEn: '3000 BCE – 2026 CE',
    badgeColor: '#6366f1',
  },
  {
    id: '-25',
    centuryNumber: -25,
    label: 'هەزارەی ٣ و ٢ی پێش زایین',
    labelEn: '3rd & 2nd Millennium BCE',
    shortLabel: 'هەزارەی ٣-٢ پ.ز',
    shortLabelEn: '3rd–2nd Mil. BCE',
    range: '٣٠٠٠ - ١٠٠٠ پ.ز',
    rangeEn: '3000 – 1000 BCE',
    badgeColor: '#d97706',
  },
  {
    id: '-8',
    centuryNumber: -8,
    label: 'سەدەی ٩ و ٨ی پێش زایین',
    labelEn: '9th & 8th Century BCE',
    shortLabel: 'سەدەی ٩-٨ پ.ز',
    shortLabelEn: '9th–8th C. BCE',
    range: '٩٠٠ - ٧٠٠ پ.ز',
    rangeEn: '900 – 700 BCE',
    badgeColor: '#b45309',
  },
  {
    id: '-7',
    centuryNumber: -7,
    label: 'سەدەی ٧ی پێش زایین',
    labelEn: '7th Century BCE',
    shortLabel: 'سەدەی ٧ پ.ز',
    shortLabelEn: '7th C. BCE',
    range: '٧٠٠ - ٦٠٠ پ.ز',
    rangeEn: '700 – 600 BCE',
    badgeColor: '#059669',
  },
  {
    id: '-6',
    centuryNumber: -6,
    label: 'سەدەی ٦ی پێش زایین',
    labelEn: '6th Century BCE',
    shortLabel: 'سەدەی ٦ پ.ز',
    shortLabelEn: '6th C. BCE',
    range: '٦٠٠ - ٥٠٠ پ.ز',
    rangeEn: '600 – 500 BCE',
    badgeColor: '#047857',
  },
  {
    id: '-4',
    centuryNumber: -4,
    label: 'سەدەی ٤ی پێش زایین',
    labelEn: '4th Century BCE',
    shortLabel: 'سەدەی ٤ پ.ز',
    shortLabelEn: '4th C. BCE',
    range: '٤٠٠ - ٣٠٠ پ.ز',
    rangeEn: '400 – 300 BCE',
    badgeColor: '#0284c7',
  },
  {
    id: '1',
    centuryNumber: 1,
    label: 'سەدەی ١ی پێش زایین تا ١ی زایینی',
    labelEn: '1st Century BCE – 1st Century CE',
    shortLabel: 'سەدەی ١ پ.ز - ١ ز',
    shortLabelEn: '1st BCE – 1st CE',
    range: '١٠٠ پ.ز - ١٠٠ ز',
    rangeEn: '100 BCE – 100 CE',
    badgeColor: '#0369a1',
  },
  {
    id: '4',
    centuryNumber: 4,
    label: 'سەدەی ٤ و ٥ی زایینی',
    labelEn: '4th & 5th Century CE',
    shortLabel: 'سەدەی ٤-٥ ز',
    shortLabelEn: '4th–5th C. CE',
    range: '٣٠٠ - ٥٠٠ ز',
    rangeEn: '300 – 500 CE',
    badgeColor: '#2563eb',
  },
  {
    id: '7',
    centuryNumber: 7,
    label: 'سەدەی ٧ و ٨ی زایینی',
    labelEn: '7th & 8th Century CE',
    shortLabel: 'سەدەی ٧-٨ ز',
    shortLabelEn: '7th–8th C. CE',
    range: '٦٠٠ - ٨٠٠ ز',
    rangeEn: '600 – 800 CE',
    badgeColor: '#4f46e5',
  },
  {
    id: '9',
    centuryNumber: 9,
    label: 'سەدەی ٩ی زایینی',
    labelEn: '9th Century CE',
    shortLabel: 'سەدەی ٩ ز',
    shortLabelEn: '9th C. CE',
    range: '٨٠٠ - ٩٠٠ ز',
    rangeEn: '800 – 900 CE',
    badgeColor: '#7c3aed',
  },
  {
    id: '10',
    centuryNumber: 10,
    label: 'سەدەی ١٠ی زایینی',
    labelEn: '10th Century CE',
    shortLabel: 'سەدەی ١٠ ز',
    shortLabelEn: '10th C. CE',
    range: '٩٠٠ - ١٠٠٠ ز',
    rangeEn: '900 – 1000 CE',
    badgeColor: '#9333ea',
  },
  {
    id: '11',
    centuryNumber: 11,
    label: 'سەدەی ١١ی زایینی',
    labelEn: '11th Century CE',
    shortLabel: 'سەدەی ١١ ز',
    shortLabelEn: '11th C. CE',
    range: '١٠٠٠ - ١١٠٠ ز',
    rangeEn: '1000 – 1100 CE',
    badgeColor: '#a855f7',
  },
  {
    id: '12',
    centuryNumber: 12,
    label: 'سەدەی ١٢ی زایینی',
    labelEn: '12th Century CE',
    shortLabel: 'سەدەی ١٢ ز',
    shortLabelEn: '12th C. CE',
    range: '١١٠٠ - ١٢٠٠ ز',
    rangeEn: '1100 – 1200 CE',
    badgeColor: '#c026d3',
  },
  {
    id: '13',
    centuryNumber: 13,
    label: 'سەدەی ١٣ی زایینی',
    labelEn: '13th Century CE',
    shortLabel: 'سەدەی ١٣ ز',
    shortLabelEn: '13th C. CE',
    range: '١٢٠٠ - ١٣٠٠ ز',
    rangeEn: '1200 – 1300 CE',
    badgeColor: '#db2777',
  },
  {
    id: '14',
    centuryNumber: 14,
    label: 'سەدەی ١٤ی زایینی',
    labelEn: '14th Century CE',
    shortLabel: 'سەدەی ١٤ ز',
    shortLabelEn: '14th C. CE',
    range: '١٣٠٠ - ١٤٠٠ ز',
    rangeEn: '1300 – 1400 CE',
    badgeColor: '#e11d48',
  },
  {
    id: '15',
    centuryNumber: 15,
    label: 'سەدەی ١٥ی زایینی',
    labelEn: '15th Century CE',
    shortLabel: 'سەدەی ١٥ ز',
    shortLabelEn: '15th C. CE',
    range: '١٤٠٠ - ١٥٠٠ ز',
    rangeEn: '1400 – 1500 CE',
    badgeColor: '#ea580c',
  },
  {
    id: '16',
    centuryNumber: 16,
    label: 'سەدەی ١٦ی زایینی',
    labelEn: '16th Century CE',
    shortLabel: 'سەدەی ١٦ ز',
    shortLabelEn: '16th C. CE',
    range: '١٥٠٠ - ١٦٠٠ ز',
    rangeEn: '1500 – 1600 CE',
    badgeColor: '#d97706',
  },
  {
    id: '17',
    centuryNumber: 17,
    label: 'سەدەی ١٧ی زایینی',
    labelEn: '17th Century CE',
    shortLabel: 'سەدەی ١٧ ز',
    shortLabelEn: '17th C. CE',
    range: '١٦٠٠ - ١٧٠٠ ز',
    rangeEn: '1600 – 1700 CE',
    badgeColor: '#ca8a04',
  },
  {
    id: '18',
    centuryNumber: 18,
    label: 'سەدەی ١٨ی زایینی',
    labelEn: '18th Century CE',
    shortLabel: 'سەدەی ١٨ ز',
    shortLabelEn: '18th C. CE',
    range: '١٧٠٠ - ١٨٠٠ ز',
    rangeEn: '1700 – 1800 CE',
    badgeColor: '#65a30d',
  },
  {
    id: '19',
    centuryNumber: 19,
    label: 'سەدەی ١٩ی زایینی',
    labelEn: '19th Century CE',
    shortLabel: 'سەدەی ١٩ ز',
    shortLabelEn: '19th C. CE',
    range: '١٨٠٠ - ١٩٠٠ ز',
    rangeEn: '1800 – 1900 CE',
    badgeColor: '#16a34a',
  },
  {
    id: '20',
    centuryNumber: 20,
    label: 'سەدەی ٢٠ی زایینی',
    labelEn: '20th Century CE',
    shortLabel: 'سەدەی ٢٠ ز',
    shortLabelEn: '20th C. CE',
    range: '١٩٠٠ - ٢٠٠٠ ز',
    rangeEn: '1900 – 2000 CE',
    badgeColor: '#0d9488',
  },
  {
    id: '21',
    centuryNumber: 21,
    label: 'سەدەی ٢١ی زایینی',
    labelEn: '21st Century CE',
    shortLabel: 'سەدەی ٢١ ز',
    shortLabelEn: '21st C. CE',
    range: '٢٠٠٠ ز تا ئێستا',
    rangeEn: '2000 CE – Present',
    badgeColor: '#0891b2',
  },
];

export function getLocalizedCenturyOption(opt: CenturyOption, lang: AppLanguage = 'ckb') {
  return {
    ...opt,
    displayLabel: lang === 'en' ? opt.labelEn : opt.label,
    displayShortLabel: lang === 'en' ? opt.shortLabelEn : opt.shortLabel,
    displayRange: lang === 'en' ? opt.rangeEn : opt.range,
  };
}

/**
 * Automatically infers century, centuryNumber, and year for a fact if not explicitly set.
 */
export function inferCenturyAndYearForFact(
  fact: Partial<FactItem>,
  lang: AppLanguage = 'ckb'
): {
  century: string;
  centuryNumber: number;
  year: string;
} {
  if (fact.century && fact.year && typeof fact.centuryNumber === 'number') {
    return {
      century: fact.century,
      centuryNumber: fact.centuryNumber,
      year: fact.year,
    };
  }

  const pick = (ckb: string, en: string) => (lang === 'en' ? en : ckb);
  const name = (fact.name || '').toLowerCase();
  const desc = (fact.desc || '').toLowerCase();
  const text = (fact.fullText || '').toLowerCase();
  const period = (fact.eraPeriod || '').toLowerCase();
  const eraId = fact.eraId || 1;
  const combined = `${name} ${desc} ${text} ${period}`;

  if (combined.includes('سەدەی ٢٢') || combined.includes('سەدەی 22') || combined.includes('22nd century')) {
    return {
      century: pick('هەزارەی ٣ی پێش زایین', '3rd Millennium BCE'),
      centuryNumber: -25,
      year: pick('٢٢٠٠ پ.ز', '2200 BCE'),
    };
  }
  if (combined.includes('سەدەی ١٥') || combined.includes('سەدەی 15') || combined.includes('میتانی') || combined.includes('mitanni')) {
    if (combined.includes('پێش زایین') || combined.includes('پ.ز') || combined.includes('bce') || eraId === 1) {
      return {
        century: pick('هەزارەی ٣ و ٢ی پێش زایین', '3rd & 2nd Millennium BCE'),
        centuryNumber: -25,
        year: pick('١٥٠٠ - ١٣٠٠ پ.ز', '1500 – 1300 BCE'),
      };
    }
    return {
      century: pick('سەدەی ١٥ی زایینی', '15th Century CE'),
      centuryNumber: 15,
      year: pick('سەدەی ١٥ی زایینی', '15th Century CE'),
    };
  }
  if (combined.includes('سەدەی ٩ی پێش') || combined.includes('سەدەی ٨ی پێش') || combined.includes('ئۆرارتۆ') || combined.includes('مانایی') || combined.includes('نائیری') || combined.includes('urartu') || combined.includes('mannaea')) {
    return {
      century: pick('سەدەی ٩ و ٨ی پێش زایین', '9th & 8th Century BCE'),
      centuryNumber: -8,
      year: pick('٨٥٠ - ٧٠٠ پ.ز', '850 – 700 BCE'),
    };
  }
  if (combined.includes('ماد') || combined.includes('نەینەوا') || combined.includes('دیاکۆ') || combined.includes('کەیخوسرەو') || combined.includes('٧٠٠ پێش') || combined.includes('٦١٢') || combined.includes('media') || combined.includes('median')) {
    return {
      century: pick('سەدەی ٧ی پێش زایین', '7th Century BCE'),
      centuryNumber: -7,
      year: pick('٧٠٠ - ٥٥٠ پ.ز', '700 – 550 BCE'),
    };
  }
  if (combined.includes('کاردۆخ') || combined.includes('ئەکسینۆفۆن') || combined.includes('٤٠١') || combined.includes('corduene')) {
    return {
      century: pick('سەدەی ٤ی پێش زایین', '4th Century BCE'),
      centuryNumber: -4,
      year: pick('٤٠١ پ.ز', '401 BCE'),
    };
  }
  if (combined.includes('ئادیابین') || combined.includes('حودەیب') || combined.includes('ئەلیماسی') || combined.includes('مۆنۆباز') || combined.includes('هێلینی') || combined.includes('adiabene')) {
    return {
      century: pick('سەدەی ١ی پێش زایین تا ١ی زایینی', '1st Century BCE – 1st Century CE'),
      centuryNumber: 1,
      year: pick('سەدەی ١ی زایینی', '1st Century CE'),
    };
  }
  if (combined.includes('کەیۆسی') || combined.includes('هەورامان') || combined.includes('ئەشکەوتی کرفتوو') || combined.includes('karaftu')) {
    return {
      century: pick('سەدەی ٤ و ٥ی زایینی', '4th & 5th Century CE'),
      centuryNumber: 4,
      year: pick('سەدەی ٤ی زایینی', '4th Century CE'),
    };
  }
  if (combined.includes('سەدەی ٧') || combined.includes('سەدەی حەوتەم') || combined.includes('هاتنی ئیسلام')) {
    return {
      century: pick('سەدەی ٧ و ٨ی زایینی', '7th & 8th Century CE'),
      centuryNumber: 7,
      year: pick('سەدەی ٧ی زایینی (٦٤٠ ز)', '7th Century CE (640 CE)'),
    };
  }
  if (combined.includes('سەدەی ١٠') || combined.includes('حەسەنوەیهی') || combined.includes('شەدادی') || combined.includes('مەروانی') || combined.includes('marwanid') || combined.includes('shaddadid')) {
    return {
      century: pick('سەدەی ١٠ی زایینی', '10th Century CE'),
      centuryNumber: 10,
      year: pick('٩٥٩ - ١٠٥٠ ز', '959 – 1050 CE'),
    };
  }
  if (combined.includes('سەدەی ١١') || combined.includes('عەنازی') || combined.includes('کاکۆیی') || combined.includes('annazid')) {
    return {
      century: pick('سەدەی ١١ی زایینی', '11th Century CE'),
      centuryNumber: 11,
      year: pick('٩٩٠ - ١١١٧ ز', '990 – 1117 CE'),
    };
  }
  if (combined.includes('سەدەی ١٢') || combined.includes('ئەییووبی') || combined.includes('سەلاحەدین') || combined.includes('هەزارئەسپی') || combined.includes('١١٧٤') || combined.includes('١١٨٧') || combined.includes('ayyubid') || combined.includes('saladin')) {
    return {
      century: pick('سەدەی ١٢ی زایینی', '12th Century CE'),
      centuryNumber: 12,
      year: pick('١١٧١ - ١٢٥٠ ز', '1171 – 1250 CE'),
    };
  }
  if (combined.includes('سەدەی ١٣') || combined.includes('شوانکارە') || combined.includes('لوڕستان')) {
    return {
      century: pick('سەدەی ١٣ی زایینی', '13th Century CE'),
      centuryNumber: 13,
      year: pick('سەدەی ١٣ی زایینی', '13th Century CE'),
    };
  }
  if (combined.includes('سەدەی ١٤') || combined.includes('ئەردەڵان') || combined.includes('بەهدینان') || combined.includes('ardalan') || combined.includes('bahdinan')) {
    return {
      century: pick('سەدەی ١٤ی زایینی', '14th Century CE'),
      centuryNumber: 14,
      year: pick('سەدەی ١٤ی زایینی (١٣٤٠ ز)', '14th Century CE (1340 CE)'),
    };
  }
  if (combined.includes('سەدەی ١٦') || combined.includes('شەرەفنامە') || combined.includes('شەرەفخان') || combined.includes('چاڵدێران') || combined.includes('١٥١٤') || combined.includes('١٥٩٧') || combined.includes('chaldiran') || combined.includes('sharafnama')) {
    return {
      century: pick('سەدەی ١٦ی زایینی', '16th Century CE'),
      centuryNumber: 16,
      year: pick('١٥١٤ - ١٥٩٧ ز', '1514 – 1597 CE'),
    };
  }
  if (combined.includes('سەدەی ١٧') || combined.includes('دمدم') || combined.includes('ئەحمەدی خانی') || combined.includes('مەم و زین') || combined.includes('١٦٠٩') || combined.includes('dimdim')) {
    return {
      century: pick('سەدەی ١٧ی زایینی', '17th Century CE'),
      centuryNumber: 17,
      year: pick('١٦٠٩ - ١٦٩٥ ز', '1609 – 1695 CE'),
    };
  }
  if (combined.includes('سەدەی ١٨') || combined.includes('زەند') || combined.includes('کەریم خان') || combined.includes('١٧٥٠') || combined.includes('١٧٨٤') || combined.includes('zand')) {
    return {
      century: pick('سەدەی ١٨ی زایینی', '18th Century CE'),
      centuryNumber: 18,
      year: pick('١٧٥٠ - ١٧٩٤ ز', '1750 – 1794 CE'),
    };
  }
  if (combined.includes('سەدەی ١٩') || combined.includes('١٨٤٦') || combined.includes('١٨٨٠') || combined.includes('بەدرخان') || combined.includes('پاشای گەورە') || combined.includes('شێخ عوبەیدوڵڵا') || combined.includes('bedirxan')) {
    return {
      century: pick('سەدەی ١٩ی زایینی', '19th Century CE'),
      centuryNumber: 19,
      year: pick('١٨١٣ - ١٨٨١ ز', '1813 – 1881 CE'),
    };
  }
  if (combined.includes('سەدەی ٢٠') || combined.includes('١٩٢٠') || combined.includes('١٩٤٦') || combined.includes('مەهاباد') || combined.includes('شێخ مەحمود') || combined.includes('قازی محەمەد') || combined.includes('ئارارات') || combined.includes('mahabad')) {
    return {
      century: pick('سەدەی ٢٠ی زایینی', '20th Century CE'),
      centuryNumber: 20,
      year: pick('١٩١٩ - ١٩٤٦ ز', '1919 – 1946 CE'),
    };
  }
  if (combined.includes('سەدەی ٢١') || combined.includes('٢٠٠') || combined.includes('هاوچەرخ')) {
    return {
      century: pick('سەدەی ٢١ی زایینی', '21st Century CE'),
      centuryNumber: 21,
      year: pick('٢٠٠٣ ز تا ئەمڕۆ', '2003 CE – Present'),
    };
  }

  switch (eraId) {
    case 1:
      return {
        century: pick('هەزارەی ٣ و ٢ی پێش زایین', '3rd & 2nd Millennium BCE'),
        centuryNumber: -25,
        year: pick('٣٠٠٠ - ٨٠٠ پ.ز', '3000 – 800 BCE'),
      };
    case 2:
      return {
        century: pick('سەدەی ٧ی پێش زایین', '7th Century BCE'),
        centuryNumber: -7,
        year: pick('٧٠٠ - ٥٥٠ پ.ز', '700 – 550 BCE'),
      };
    case 3:
      return {
        century: pick('سەدەی ٤ی پێش زایین تا ٧ی زایینی', '4th Century BCE – 7th Century CE'),
        centuryNumber: 1,
        year: pick('سەدەی ٤ پ.ز - ٧ ز', '4th C. BCE – 7th C. CE'),
      };
    case 4:
      return {
        century: pick('سەدەی ١٢ی زایینی', '12th Century CE'),
        centuryNumber: 12,
        year: pick('سەدەی ٩ - ١٩ ز', '9th – 19th C. CE'),
      };
    case 5:
    default:
      return {
        century: pick('سەدەی ٢٠ی زایینی', '20th Century CE'),
        centuryNumber: 20,
        year: pick('سەدەی ٢٠ی زایینی', '20th Century CE'),
      };
  }
}

/**
 * Filter facts by century id
 */
export function filterFactsByCentury(facts: FactItem[], centuryId: string): FactItem[] {
  if (!centuryId || centuryId === 'all') return facts;

  const targetOption = CENTURY_OPTIONS.find((c) => c.id === centuryId);
  if (!targetOption) return facts;

  return facts.filter((f) => {
    if (f.centuryNumber !== undefined && f.centuryNumber === targetOption.centuryNumber) {
      return true;
    }

    const inferred = inferCenturyAndYearForFact(f);
    if (inferred.centuryNumber === targetOption.centuryNumber) {
      return true;
    }

    if (
      f.century &&
      (f.century.includes(targetOption.shortLabel) || f.century.includes(targetOption.shortLabelEn))
    ) {
      return true;
    }

    return false;
  });
}
