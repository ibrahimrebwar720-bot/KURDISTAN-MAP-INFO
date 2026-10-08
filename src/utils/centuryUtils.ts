import { FactItem } from '../data/kurdishHistoryData';

export interface CenturyOption {
  id: string; // 'all' or numeric string like '-7', '12'
  centuryNumber: number; // 0 for all, negative for BC, positive for AD
  label: string; // e.g. "سەدەی ١٢ی زایینی"
  shortLabel: string; // e.g. "سەدەی ١٢"
  range: string; // e.g. "١١٠٠ - ١٢٠٠ ز"
  badgeColor?: string;
}

export const CENTURY_OPTIONS: CenturyOption[] = [
  {
    id: 'all',
    centuryNumber: 0,
    label: 'هەموو سەدەکان',
    shortLabel: 'هەموو سەدەکان',
    range: '٣٠٠٠ پ.ز - ٢٠٢٦ ز',
    badgeColor: '#6366f1',
  },
  {
    id: '-25',
    centuryNumber: -25,
    label: 'هەزارەی ٣ و ٢ی پێش زایین',
    shortLabel: 'هەزارەی ٣-٢ پ.ز',
    range: '٣٠٠٠ - ١٠٠٠ پ.ز',
    badgeColor: '#d97706',
  },
  {
    id: '-8',
    centuryNumber: -8,
    label: 'سەدەی ٩ و ٨ی پێش زایین',
    shortLabel: 'سەدەی ٩-٨ پ.ز',
    range: '٩٠٠ - ٧٠٠ پ.ز',
    badgeColor: '#b45309',
  },
  {
    id: '-7',
    centuryNumber: -7,
    label: 'سەدەی ٧ی پێش زایین',
    shortLabel: 'سەدەی ٧ پ.ز',
    range: '٧٠٠ - ٦٠٠ پ.ز',
    badgeColor: '#059669',
  },
  {
    id: '-6',
    centuryNumber: -6,
    label: 'سەدەی ٦ی پێش زایین',
    shortLabel: 'سەدەی ٦ پ.ز',
    range: '٦٠٠ - ٥٠٠ پ.ز',
    badgeColor: '#047857',
  },
  {
    id: '-4',
    centuryNumber: -4,
    label: 'سەدەی ٤ی پێش زایین',
    shortLabel: 'سەدەی ٤ پ.ز',
    range: '٤٠٠ - ٣٠٠ پ.ز',
    badgeColor: '#0284c7',
  },
  {
    id: '1',
    centuryNumber: 1,
    label: 'سەدەی ١ی پێش زایین تا ١ی زایینی',
    shortLabel: 'سەدەی ١ پ.ز - ١ ز',
    range: '١٠٠ پ.ز - ١٠٠ ز',
    badgeColor: '#0369a1',
  },
  {
    id: '4',
    centuryNumber: 4,
    label: 'سەدەی ٤ و ٥ی زایینی',
    shortLabel: 'سەدەی ٤-٥ ز',
    range: '٣٠٠ - ٥٠٠ ز',
    badgeColor: '#2563eb',
  },
  {
    id: '7',
    centuryNumber: 7,
    label: 'سەدەی ٧ و ٨ی زایینی',
    shortLabel: 'سەدەی ٧-٨ ز',
    range: '٦٠٠ - ٨٠٠ ز',
    badgeColor: '#4f46e5',
  },
  {
    id: '9',
    centuryNumber: 9,
    label: 'سەدەی ٩ی زایینی',
    shortLabel: 'سەدەی ٩ ز',
    range: '٨٠٠ - ٩٠٠ ز',
    badgeColor: '#7c3aed',
  },
  {
    id: '10',
    centuryNumber: 10,
    label: 'سەدەی ١٠ی زایینی',
    shortLabel: 'سەدەی ١٠ ز',
    range: '٩٠٠ - ١٠٠٠ ز',
    badgeColor: '#9333ea',
  },
  {
    id: '11',
    centuryNumber: 11,
    label: 'سەدەی ١١ی زایینی',
    shortLabel: 'سەدەی ١١ ز',
    range: '١٠٠٠ - ١١٠٠ ز',
    badgeColor: '#a855f7',
  },
  {
    id: '12',
    centuryNumber: 12,
    label: 'سەدەی ١٢ی زایینی',
    shortLabel: 'سەدەی ١٢ ز',
    range: '١١٠٠ - ١٢٠٠ ز',
    badgeColor: '#c026d3',
  },
  {
    id: '13',
    centuryNumber: 13,
    label: 'سەدەی ١٣ی زایینی',
    shortLabel: 'سەدەی ١٣ ز',
    range: '١٢٠٠ - ١٣٠٠ ز',
    badgeColor: '#db2777',
  },
  {
    id: '14',
    centuryNumber: 14,
    label: 'سەدەی ١٤ی زایینی',
    shortLabel: 'سەدەی ١٤ ز',
    range: '١٣٠٠ - ١٤٠٠ ز',
    badgeColor: '#e11d48',
  },
  {
    id: '15',
    centuryNumber: 15,
    label: 'سەدەی ١٥ی زایینی',
    shortLabel: 'سەدەی ١٥ ز',
    range: '١٤٠٠ - ١٥٠٠ ز',
    badgeColor: '#ea580c',
  },
  {
    id: '16',
    centuryNumber: 16,
    label: 'سەدەی ١٦ی زایینی',
    shortLabel: 'سەدەی ١٦ ز',
    range: '١٥٠٠ - ١٦٠٠ ز',
    badgeColor: '#d97706',
  },
  {
    id: '17',
    centuryNumber: 17,
    label: 'سەدەی ١٧ی زایینی',
    shortLabel: 'سەدەی ١٧ ز',
    range: '١٦٠٠ - ١٧٠٠ ز',
    badgeColor: '#ca8a04',
  },
  {
    id: '18',
    centuryNumber: 18,
    label: 'سەدەی ١٨ی زایینی',
    shortLabel: 'سەدەی ١٨ ز',
    range: '١٧٠٠ - ١٨٠٠ ز',
    badgeColor: '#65a30d',
  },
  {
    id: '19',
    centuryNumber: 19,
    label: 'سەدەی ١٩ی زایینی',
    shortLabel: 'سەدەی ١٩ ز',
    range: '١٨٠٠ - ١٩٠٠ ز',
    badgeColor: '#16a34a',
  },
  {
    id: '20',
    centuryNumber: 20,
    label: 'سەدەی ٢٠ی زایینی',
    shortLabel: 'سەدەی ٢٠ ز',
    range: '١٩٠٠ - ٢٠٠٠ ز',
    badgeColor: '#0d9488',
  },
  {
    id: '21',
    centuryNumber: 21,
    label: 'سەدەی ٢١ی زایینی',
    shortLabel: 'سەدەی ٢١ ز',
    range: '٢٠٠٠ ز تا ئێستا',
    badgeColor: '#0891b2',
  },
];

/**
 * Automatically infers century, centuryNumber, and year for a fact if not explicitly set.
 * Returns clean century strings with NO kingdom/empire names.
 */
export function inferCenturyAndYearForFact(fact: Partial<FactItem>): {
  century: string;
  centuryNumber: number;
  year: string;
} {
  // If explicitly set, respect it
  if (fact.century && fact.year && typeof fact.centuryNumber === 'number') {
    return {
      century: fact.century,
      centuryNumber: fact.centuryNumber,
      year: fact.year,
    };
  }

  const name = (fact.name || '').toLowerCase();
  const desc = (fact.desc || '').toLowerCase();
  const text = (fact.fullText || '').toLowerCase();
  const period = (fact.eraPeriod || '').toLowerCase();
  const eraId = fact.eraId || 1;
  const combined = `${name} ${desc} ${text} ${period}`;

  // 1. Check for specific centuries in text
  if (combined.includes('سەدەی ٢٢') || combined.includes('سەدەی 22')) {
    return { century: 'هەزارەی ٣ی پێش زایین', centuryNumber: -25, year: '٢٢٠٠ پ.ز' };
  }
  if (combined.includes('سەدەی ١٥') || combined.includes('سەدەی 15') || combined.includes('میتانی')) {
    if (combined.includes('پێش زایین') || combined.includes('پ.ز') || eraId === 1) {
      return { century: 'هەزارەی ٣ و ٢ی پێش زایین', centuryNumber: -25, year: '١٥٠٠ - ١٣٠٠ پ.ز' };
    }
    return { century: 'سەدەی ١٥ی زایینی', centuryNumber: 15, year: 'سەدەی ١٥ی زایینی' };
  }
  if (combined.includes('سەدەی ٩ی پێش') || combined.includes('سەدەی ٨ی پێش') || combined.includes('ئۆرارتۆ') || combined.includes('مانایی') || combined.includes('نائیری')) {
    return { century: 'سەدەی ٩ و ٨ی پێش زایین', centuryNumber: -8, year: '٨٥٠ - ٧٠٠ پ.ز' };
  }
  if (combined.includes('ماد') || combined.includes('نەینەوا') || combined.includes('دیاکۆ') || combined.includes('کەیخوسرەو') || combined.includes('٧٠٠ پێش') || combined.includes('٦١٢')) {
    return { century: 'سەدەی ٧ی پێش زایین', centuryNumber: -7, year: '٧٠٠ - ٥٥٠ پ.ز' };
  }
  if (combined.includes('کاردۆخ') || combined.includes('ئەکسینۆفۆن') || combined.includes('٤٠١')) {
    return { century: 'سەدەی ٤ی پێش زایین', centuryNumber: -4, year: '٤٠١ پ.ز' };
  }
  if (combined.includes('ئادیابین') || combined.includes('حودەیب') || combined.includes('ئەلیماسی') || combined.includes('مۆنۆباز') || combined.includes('هێلینی')) {
    return { century: 'سەدەی ١ی پێش زایین تا ١ی زایینی', centuryNumber: 1, year: 'سەدەی ١ی زایینی' };
  }
  if (combined.includes('کەیۆسی') || combined.includes('هەورامان') || combined.includes('ئەشکەوتی کرفتوو')) {
    return { century: 'سەدەی ٤ و ٥ی زایینی', centuryNumber: 4, year: 'سەدەی ٤ی زایینی' };
  }
  if (combined.includes('سەدەی ٧') || combined.includes('سەدەی حەوتەم') || combined.includes('هاتنی ئیسلام')) {
    return { century: 'سەدەی ٧ و ٨ی زایینی', centuryNumber: 7, year: 'سەدەی ٧ی زایینی (٦٤٠ ز)' };
  }
  if (combined.includes('سەدەی ١٠') || combined.includes('حەسەنوەیهی') || combined.includes('شەدادی') || combined.includes('مەروانی')) {
    return { century: 'سەدەی ١٠ی زایینی', centuryNumber: 10, year: '٩٥٩ - ١٠٥٠ ز' };
  }
  if (combined.includes('سەدەی ١١') || combined.includes('عەنازی') || combined.includes('کاکۆیی')) {
    return { century: 'سەدەی ١١ی زایینی', centuryNumber: 11, year: '٩٩٠ - ١١١٧ ز' };
  }
  if (combined.includes('سەدەی ١٢') || combined.includes('ئەییووبی') || combined.includes('سەلاحەدین') || combined.includes('هەزارئەسپی') || combined.includes('١١٧٤') || combined.includes('١١٨٧')) {
    return { century: 'سەدەی ١٢ی زایینی', centuryNumber: 12, year: '١١٧١ - ١٢٥٠ ز' };
  }
  if (combined.includes('سەدەی ١٣') || combined.includes('شوانکارە') || combined.includes('لوڕستان')) {
    return { century: 'سەدەی ١٣ی زایینی', centuryNumber: 13, year: 'سەدەی ١٣ی زایینی' };
  }
  if (combined.includes('سەدەی ١٤') || combined.includes('ئەردەڵان') || combined.includes('بەهدینان')) {
    return { century: 'سەدەی ١٤ی زایینی', centuryNumber: 14, year: 'سەدەی ١٤ی زایینی (١٣٤٠ ز)' };
  }
  if (combined.includes('سەدەی ١٦') || combined.includes('شەرەفنامە') || combined.includes('شەرەفخان') || combined.includes('چاڵدێران') || combined.includes('١٥١٤') || combined.includes('١٥٩٧')) {
    return { century: 'سەدەی ١٦ی زایینی', centuryNumber: 16, year: '١٥١٤ - ١٥٩٧ ز' };
  }
  if (combined.includes('سەدەی ١٧') || combined.includes('دمدم') || combined.includes('ئەحمەدی خانی') || combined.includes('مەم و زین') || combined.includes('١٦٠٩')) {
    return { century: 'سەدەی ١٧ی زایینی', centuryNumber: 17, year: '١٦٠٩ - ١٦٩٥ ز' };
  }
  if (combined.includes('سەدەی ١٨') || combined.includes('زەند') || combined.includes('کەریم خان') || combined.includes('١٧٥٠') || combined.includes('١٧٨٤')) {
    return { century: 'سەدەی ١٨ی زایینی', centuryNumber: 18, year: '١٧٥٠ - ١٧٩٤ ز' };
  }
  if (combined.includes('سەدەی ١٩') || combined.includes('١٨٤٦') || combined.includes('١٨٨٠') || combined.includes('بەدرخان') || combined.includes('پاشای گەورە') || combined.includes('شێخ عوبەیدوڵڵا')) {
    return { century: 'سەدەی ١٩ی زایینی', centuryNumber: 19, year: '١٨١٣ - ١٨٨١ ز' };
  }
  if (combined.includes('سەدەی ٢٠') || combined.includes('١٩٢٠') || combined.includes('١٩٤٦') || combined.includes('مەهاباد') || combined.includes('شێخ مەحمود') || combined.includes('قازی محەمەد') || combined.includes('ئارارات')) {
    return { century: 'سەدەی ٢٠ی زایینی', centuryNumber: 20, year: '١٩١٩ - ١٩٤٦ ز' };
  }
  if (combined.includes('سەدەی ٢١') || combined.includes('٢٠٠') || combined.includes('هاوچەرخ')) {
    return { century: 'سەدەی ٢١ی زایینی', centuryNumber: 21, year: '٢٠٠٣ ز تا ئەمڕۆ' };
  }

  // Fallback based on eraId
  switch (eraId) {
    case 1:
      return {
        century: 'هەزارەی ٣ و ٢ی پێش زایین',
        centuryNumber: -25,
        year: '٣٠٠٠ - ٨٠٠ پ.ز',
      };
    case 2:
      return {
        century: 'سەدەی ٧ی پێش زایین',
        centuryNumber: -7,
        year: '٧٠٠ - ٥٥٠ پ.ز',
      };
    case 3:
      return {
        century: 'سەدەی ٤ی پێش زایین تا ٧ی زایینی',
        centuryNumber: 1,
        year: 'سەدەی ٤ پ.ز - ٧ ز',
      };
    case 4:
      return {
        century: 'سەدەی ١٢ی زایینی',
        centuryNumber: 12,
        year: 'سەدەی ٩ - ١٩ ز',
      };
    case 5:
    default:
      return {
        century: 'سەدەی ٢٠ی زایینی',
        centuryNumber: 20,
        year: 'سەدەی ٢٠ی زایینی',
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
    // Check direct matching centuryId or centuryNumber
    if (f.centuryNumber !== undefined && f.centuryNumber === targetOption.centuryNumber) {
      return true;
    }

    // Matching against inferred century
    const inferred = inferCenturyAndYearForFact(f);
    if (inferred.centuryNumber === targetOption.centuryNumber) {
      return true;
    }

    if (f.century && f.century.includes(targetOption.shortLabel)) {
      return true;
    }

    return false;
  });
}
