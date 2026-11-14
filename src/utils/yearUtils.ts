import { FactItem } from '../data/kurdishHistoryData';
import type { AppLanguage } from '../context/LanguageContext';

const CENTURY_WORD_MAP: Record<string, number> = {
  'یەکەم': 1, 'دووەم': 2, 'سێیەم': 3, 'چوارەم': 4, 'پێنجەم': 5,
  'شەشەم': 6, 'حەوتەم': 7, 'هەشتەم': 8, 'نۆیەم': 9, 'دەیەم': 10,
  'یازدەیەم': 11, 'دوازدەیەم': 12, 'سێزدەیەم': 13, 'چواردەیەم': 14,
  'پازدەیەم': 15, 'شازدەیەم': 16, 'حەڤدەیەم': 17, 'هەژدەیەم': 18,
  'نۆزدەیەم': 19, 'بیستەم': 20, 'بیست و یەکەم': 21,
};

// Digits mapping between Latin and Kurdish/Arabic
const KURDISH_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toKurdishDigits(val: number | string): string {
  const str = val.toString();
  return str.replace(/\d/g, (d) => KURDISH_DIGITS[parseInt(d, 10)]);
}

export function formatDigits(val: number | string, lang: AppLanguage = 'ckb'): string {
  if (lang === 'en') {
    return normalizeYearString(val.toString());
  }
  return toKurdishDigits(val);
}

export function normalizeYearString(input: string): string {
  if (!input) return '';
  let res = input;
  for (let i = 0; i < 10; i++) {
    res = res.replaceAll(KURDISH_DIGITS[i], i.toString());
    res = res.replaceAll(PERSIAN_DIGITS[i], i.toString());
  }
  return res;
}

function getEnglishOrdinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

export const MIN_HISTORICAL_YEAR = -3000;
export const MAX_HISTORICAL_YEAR = 2026;

/**
 * Format a numeric year to a display string in Kurdish or English
 * Negative = پ.ز (BCE), Positive = ز (CE)
 */
export function formatKurdishYear(year: number, lang: AppLanguage = 'ckb'): string {
  if (lang === 'en') {
    if (year < 0) return `${Math.abs(year)} BCE`;
    return `${year} CE`;
  }
  if (year < 0) {
    const abs = Math.abs(year);
    return `${toKurdishDigits(abs)} پ.ز`;
  }
  return `${toKurdishDigits(year)} ز`;
}

export const formatYear = formatKurdishYear;

/**
 * Format a start and end year range nicely in Kurdish or English
 */
export function formatKurdishYearRange(
  startYear?: number,
  endYear?: number,
  lang: AppLanguage = 'ckb'
): string {
  if (startYear === undefined && endYear === undefined) return '';
  if (startYear !== undefined && endYear === undefined) {
    return formatKurdishYear(startYear, lang);
  }
  if (startYear === undefined && endYear !== undefined) {
    return formatKurdishYear(endYear, lang);
  }
  if (startYear === endYear && startYear !== undefined) {
    return formatKurdishYear(startYear, lang);
  }

  const s = startYear as number;
  const e = endYear as number;

  if (lang === 'en') {
    if (s < 0 && e < 0) {
      return `${Math.abs(s)} – ${Math.abs(e)} BCE`;
    }
    if (s < 0 && e >= 0) {
      return `${Math.abs(s)} BCE – ${e} CE`;
    }
    return `${s} – ${e} CE`;
  }

  if (s < 0 && e < 0) {
    return `${toKurdishDigits(Math.abs(s))} - ${toKurdishDigits(Math.abs(e))} پ.ز`;
  }
  if (s < 0 && e >= 0) {
    return `${toKurdishDigits(Math.abs(s))} پ.ز - ${toKurdishDigits(e)} ز`;
  }
  return `${toKurdishDigits(s)} - ${toKurdishDigits(e)} ز`;
}

export const formatYearRange = formatKurdishYearRange;

/**
 * Convert a century number (e.g. 4 for 4th century) and BC flag into start and end years.
 * e.g. 4th century BC -> startYear: -400, endYear: -301
 * e.g. 12th century AD -> startYear: 1101, endYear: 1200
 */
export function centuryToYearSpan(century: number, isBC: boolean): { startYear: number; endYear: number } {
  const c = Math.max(1, Math.abs(century));
  if (isBC) {
    const s = -c * 100;
    const e = -(c - 1) * 100 - 1;
    return { startYear: s, endYear: e };
  }
  const s = (c - 1) * 100 + 1;
  const e = c * 100;
  return { startYear: s, endYear: e };
}

/**
 * Convert a century range into start and end years.
 * Can cross eras (e.g. 4th BC to 2nd AD).
 */
export function centuryRangeToYearSpan(
  startCentury: number,
  startBC: boolean,
  endCentury: number,
  endBC: boolean
): { startYear: number; endYear: number } {
  const span1 = centuryToYearSpan(startCentury, startBC);
  const span2 = centuryToYearSpan(endCentury, endBC);
  const s = Math.min(span1.startYear, span2.startYear);
  const e = Math.max(span1.endYear, span2.endYear);
  return { startYear: s, endYear: e };
}

/**
 * Format a single century in Kurdish or English
 */
export function formatKurdishCentury(
  century: number,
  isBC: boolean,
  long = false,
  lang: AppLanguage = 'ckb'
): string {
  const c = Math.max(1, Math.abs(century));
  if (lang === 'en') {
    const eraLabel = isBC ? 'BCE' : 'CE';
    return `${getEnglishOrdinal(c)} Century ${eraLabel}`;
  }
  const eraLabel = isBC ? (long ? 'پێش زایین' : 'پ.ز') : (long ? 'زایینی' : 'ز');
  return `سەدەی ${toKurdishDigits(c)}ی ${eraLabel}`;
}

export const formatCentury = formatKurdishCentury;

/**
 * Format a century range in Kurdish or English
 */
export function formatKurdishCenturyRange(
  startCentury: number,
  startBC: boolean,
  endCentury: number,
  endBC: boolean,
  long = false,
  lang: AppLanguage = 'ckb'
): string {
  const c1 = Math.max(1, Math.abs(startCentury));
  const c2 = Math.max(1, Math.abs(endCentury));

  if (lang === 'en') {
    if (startBC && !endBC) {
      return `${getEnglishOrdinal(c1)} Century BCE – ${getEnglishOrdinal(c2)} Century CE`;
    }
    if (!startBC && endBC) {
      return `${getEnglishOrdinal(c2)} Century BCE – ${getEnglishOrdinal(c1)} Century CE`;
    }
    const minC = Math.min(c1, c2);
    const maxC = Math.max(c1, c2);
    if (startBC && endBC) {
      return `${getEnglishOrdinal(maxC)} – ${getEnglishOrdinal(minC)} Century BCE`;
    }
    return `${getEnglishOrdinal(minC)} – ${getEnglishOrdinal(maxC)} Century CE`;
  }

  if (startBC && !endBC) {
    return `سەدەی ${toKurdishDigits(c1)}ی پ.ز - سەدەی ${toKurdishDigits(c2)}ی ز`;
  }
  if (!startBC && endBC) {
    return `سەدەی ${toKurdishDigits(c2)}ی پ.ز - سەدەی ${toKurdishDigits(c1)}ی ز`;
  }
  if (startBC && endBC) {
    const minC = Math.min(c1, c2);
    const maxC = Math.max(c1, c2);
    const eraLabel = long ? 'پێش زایین' : 'پ.ز';
    return `سەدەی ${toKurdishDigits(maxC)} - ${toKurdishDigits(minC)}ی ${eraLabel}`;
  }
  const minC = Math.min(c1, c2);
  const maxC = Math.max(c1, c2);
  const eraLabel = long ? 'زایینی' : 'ز';
  return `سەدەی ${toKurdishDigits(minC)} - ${toKurdishDigits(maxC)}ی ${eraLabel}`;
}

export const formatCenturyRange = formatKurdishCenturyRange;

function hasBCToken(str?: string): boolean {
  if (!str) return false;
  return (
    str.includes('پ.ز') ||
    str.includes('پێش') ||
    /\bb\.?c\.?e?\.?\b/i.test(str)
  );
}

/**
 * Extract numeric startYear and endYear from any FactItem.
 * Handles explicit startYear/endYear, birthYear/deathYear, or falls back to parsing year text.
 */
export function getFactYearSpan(
  fact: Partial<FactItem>,
  lang: AppLanguage = 'ckb'
): {
  startYear: number;
  endYear: number;
  isRange: boolean;
  label: string;
} {
  // 1. Direct explicit numeric fields
  const explicitStart =
    typeof fact.startYear === 'number'
      ? fact.startYear
      : typeof fact.birthYear === 'number'
      ? fact.birthYear
      : undefined;

  const explicitEnd =
    typeof fact.endYear === 'number'
      ? fact.endYear
      : typeof fact.deathYear === 'number'
      ? fact.deathYear
      : undefined;

  if (explicitStart !== undefined && explicitEnd !== undefined) {
    const s = Math.min(explicitStart, explicitEnd);
    const e = Math.max(explicitStart, explicitEnd);
    return {
      startYear: s,
      endYear: e,
      isRange: s !== e,
      label: fact.year || formatKurdishYearRange(s, e, lang),
    };
  }

  const isPersonTag =
    fact.tag === 'leader' ||
    fact.tag === 'figure' ||
    fact.tag === 'scholar' ||
    fact.tag === 'minister' ||
    fact.tag === 'official' ||
    typeof fact.birthYear === 'number';

  if (explicitStart !== undefined && explicitEnd === undefined) {
    if (isPersonTag) {
      const end = Math.min(MAX_HISTORICAL_YEAR, explicitStart + 75);
      return {
        startYear: explicitStart,
        endYear: end,
        isRange: true,
        label: fact.year || formatKurdishYear(explicitStart, lang),
      };
    }
    return {
      startYear: explicitStart,
      endYear: explicitStart,
      isRange: false,
      label: fact.year || formatKurdishYear(explicitStart, lang),
    };
  }

  if (explicitStart === undefined && explicitEnd !== undefined) {
    if (isPersonTag) {
      const start = explicitEnd - 70;
      return {
        startYear: start,
        endYear: explicitEnd,
        isRange: true,
        label: fact.year || formatKurdishYear(explicitEnd, lang),
      };
    }
    return {
      startYear: explicitEnd,
      endYear: explicitEnd,
      isRange: false,
      label: fact.year || formatKurdishYear(explicitEnd, lang),
    };
  }

  // 2. Parse from year string
  const rawYear = fact.year ? normalizeYearString(fact.year) : '';
  if (rawYear) {
    const rangeParts = rawYear.split(/[-–—]|(\bتا\b)|(\bto\b)/i);
    const cleanedParts = rangeParts.filter(
      (p) => p && p.trim() !== 'تا' && p.trim().toLowerCase() !== 'to' && /\d/.test(p)
    );
    if (cleanedParts.length >= 2) {
      const p1 = cleanedParts[0];
      const p2 = cleanedParts[1];
      const m1 = p1.match(/\d+/);
      const m2 = p2.match(/\d+/);
      if (m1 && m2) {
        let y1 = parseInt(m1[0], 10);
        let y2 = parseInt(m2[0], 10);

        const p1HasBC = hasBCToken(p1);
        const p2HasBC = hasBCToken(p2);

        if (p1HasBC && !p2HasBC) {
          y1 = -Math.abs(y1);
          y2 = Math.abs(y2);
        } else if (p2HasBC && !p1HasBC && !p1.includes('ز') && !/\bce\b|\bad\b/i.test(p1)) {
          y1 = -Math.abs(y1);
          y2 = -Math.abs(y2);
        } else if (p1HasBC && p2HasBC) {
          y1 = -Math.abs(y1);
          y2 = -Math.abs(y2);
        } else if (fact.isBC || fact.eraId === 1 || fact.eraId === 2) {
          y1 = -Math.abs(y1);
          y2 = -Math.abs(y2);
        }

        const s = Math.min(y1, y2);
        const e = Math.max(y1, y2);
        return {
          startYear: s,
          endYear: e,
          isRange: true,
          label: fact.year || formatKurdishYearRange(s, e, lang),
        };
      }
    }
  }

  const isBC =
    Boolean(fact.isBC) ||
    hasBCToken(fact.year) ||
    hasBCToken(fact.century) ||
    hasBCToken(fact.eraPeriod) ||
    (fact.eraId !== undefined && fact.eraId <= 2) ||
    (fact.centuryNumber !== undefined && fact.centuryNumber < 0);

  const matches = rawYear.match(/\d+/g);
  if (matches && matches.length >= 2) {
    let y1 = parseInt(matches[0], 10);
    let y2 = parseInt(matches[1], 10);
    if (isBC) {
      y1 = -Math.abs(y1);
      y2 = -Math.abs(y2);
    }
    const s = Math.min(y1, y2);
    const e = Math.max(y1, y2);
    return {
      startYear: s,
      endYear: e,
      isRange: true,
      label: fact.year || formatKurdishYearRange(s, e, lang),
    };
  } else if (matches && matches.length === 1) {
    let y = parseInt(matches[0], 10);
    if (isBC) y = -Math.abs(y);
    return {
      startYear: y,
      endYear: y,
      isRange: false,
      label: fact.year || formatKurdishYear(y, lang),
    };
  }

  // 3. Fallback based on centuryNumber or century text
  let cNumber =
    typeof fact.centuryNumber === 'number' && fact.centuryNumber !== 0
      ? fact.centuryNumber
      : undefined;

  if (cNumber === undefined && fact.century) {
    const rawC = normalizeYearString(fact.century);
    const cMatch = rawC.match(/\d+/);
    const isCenturyBC = hasBCToken(fact.century);
    if (cMatch) {
      const val = parseInt(cMatch[0], 10);
      cNumber = isCenturyBC ? -val : val;
    } else {
      for (const [word, val] of Object.entries(CENTURY_WORD_MAP)) {
        if (fact.century.includes(word)) {
          cNumber = isCenturyBC ? -val : val;
          break;
        }
      }
    }
  }

  if (cNumber !== undefined) {
    const c = cNumber;
    let s: number;
    let e: number;
    if (c < 0) {
      s = c * 100;
      e = (c + 1) * 100;
    } else {
      s = (c - 1) * 100;
      e = c * 100;
    }
    return {
      startYear: Math.min(s, e),
      endYear: Math.max(s, e),
      isRange: true,
      label: fact.year || fact.century || `${c}`,
    };
  }

  // 4. Fallback based on eraId
  switch (fact.eraId) {
    case 1:
      return {
        startYear: -3000,
        endYear: -800,
        isRange: true,
        label: lang === 'en' ? '3000 – 800 BCE' : '٣٠٠٠ - ٨٠٠ پ.ز',
      };
    case 2:
      return {
        startYear: -700,
        endYear: -550,
        isRange: true,
        label: lang === 'en' ? '700 – 550 BCE' : '٧٠٠ - ٥٥٠ پ.ز',
      };
    case 3:
      return {
        startYear: -400,
        endYear: 650,
        isRange: true,
        label: lang === 'en' ? '400 BCE – 650 CE' : '٤٠٠ پ.ز - ٦٥٠ ز',
      };
    case 4:
      return {
        startYear: 900,
        endYear: 1850,
        isRange: true,
        label: lang === 'en' ? '900 – 1850 CE' : '٩٠٠ - ١٨٥٠ ز',
      };
    case 5:
    default:
      return {
        startYear: 1919,
        endYear: 2026,
        isRange: true,
        label: lang === 'en' ? '1919 – 2026 CE' : '١٩١٩ - ٢٠٢٦ ز',
      };
  }
}

/**
 * Returns a numeric sort key representing the earliest chronological point of a fact.
 * Smaller number = older / earlier in history (e.g. -3000 < -612 < 985 < 1890).
 */
export function getFactChronologicalYear(fact: Partial<FactItem>): number {
  const span = getFactYearSpan(fact);
  return span.startYear;
}

/**
 * Checks whether a fact was active/alive in the given year.
 * Rule requested by user:
 * "بۆ نمونە کەسێکمان هەیە ١٨٩٠ لەدایک بووە و ١٩٦٠ مردووە سکرۆڵەکە بچێتە سەر ساڵی ١٩٤٠ ئەم کەسایەتییەش نیشانبدات لەسەر نەخشە چونکە لە ژیاندا بووە بۆ دەوڵەت و باقی ئەانی تریش بە هەمان شێوە"
 */
export function isFactActiveInYear(fact: Partial<FactItem>, year: number): boolean {
  const span = getFactYearSpan(fact);

  if (span.isRange) {
    return span.startYear <= year && year <= span.endYear;
  }

  // For single-year events (e.g. battle in 1514, or event in 612 BC),
  // match exact year or a tight window of +/- 3 years so it doesn't vanish prematurely when scrolling
  return Math.abs(span.startYear - year) <= 3;
}

/**
 * Filter facts array by the given year, or return all if 'all'.
 */
export function filterFactsByActiveYear(facts: FactItem[], year: number | 'all'): FactItem[] {
  if (year === 'all') {
    return facts;
  }
  return facts.filter((f) => isFactActiveInYear(f, year));
}
