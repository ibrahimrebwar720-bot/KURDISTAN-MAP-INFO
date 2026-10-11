import { FactItem } from '../data/kurdishHistoryData';

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

export function normalizeYearString(input: string): string {
  if (!input) return '';
  let res = input;
  for (let i = 0; i < 10; i++) {
    res = res.replaceAll(KURDISH_DIGITS[i], i.toString());
    res = res.replaceAll(PERSIAN_DIGITS[i], i.toString());
  }
  return res;
}

export const MIN_HISTORICAL_YEAR = -3000;
export const MAX_HISTORICAL_YEAR = 2026;

/**
 * Format a numeric year to a display string in Kurdish
 * Negative = پ.ز (BC), Positive = ز (AD)
 */
export function formatKurdishYear(year: number): string {
  if (year < 0) {
    const abs = Math.abs(year);
    return `${toKurdishDigits(abs)} پ.ز`;
  }
  return `${toKurdishDigits(year)} ز`;
}

/**
 * Format a start and end year range nicely in Kurdish
 */
export function formatKurdishYearRange(startYear?: number, endYear?: number): string {
  if (startYear === undefined && endYear === undefined) return '';
  if (startYear !== undefined && endYear === undefined) {
    return formatKurdishYear(startYear);
  }
  if (startYear === undefined && endYear !== undefined) {
    return formatKurdishYear(endYear);
  }
  if (startYear === endYear && startYear !== undefined) {
    return formatKurdishYear(startYear);
  }

  const s = startYear as number;
  const e = endYear as number;

  if (s < 0 && e < 0) {
    return `${toKurdishDigits(Math.abs(s))} - ${toKurdishDigits(Math.abs(e))} پ.ز`;
  }
  if (s < 0 && e >= 0) {
    return `${toKurdishDigits(Math.abs(s))} پ.ز - ${toKurdishDigits(e)} ز`;
  }
  return `${toKurdishDigits(s)} - ${toKurdishDigits(e)} ز`;
}

/**
 * Extract numeric startYear and endYear from any FactItem.
 * Handles explicit startYear/endYear, birthYear/deathYear, or falls back to parsing year text.
 */
export function getFactYearSpan(fact: Partial<FactItem>): {
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
      label: fact.year || formatKurdishYearRange(s, e),
    };
  }

  const isPersonTag =
    fact.tag === 'figure' ||
    fact.tag === 'scholar' ||
    fact.tag === 'minister' ||
    fact.tag === 'official' ||
    typeof fact.birthYear === 'number';

  if (explicitStart !== undefined && explicitEnd === undefined) {
    if (isPersonTag) {
      // If a person has birthYear but no deathYear, consider active for ~75 years
      const end = Math.min(MAX_HISTORICAL_YEAR, explicitStart + 75);
      return {
        startYear: explicitStart,
        endYear: end,
        isRange: true,
        label: fact.year || formatKurdishYear(explicitStart),
      };
    }
    return {
      startYear: explicitStart,
      endYear: explicitStart,
      isRange: false,
      label: fact.year || formatKurdishYear(explicitStart),
    };
  }

  if (explicitStart === undefined && explicitEnd !== undefined) {
    if (isPersonTag) {
      const start = explicitEnd - 70;
      return {
        startYear: start,
        endYear: explicitEnd,
        isRange: true,
        label: fact.year || formatKurdishYear(explicitEnd),
      };
    }
    return {
      startYear: explicitEnd,
      endYear: explicitEnd,
      isRange: false,
      label: fact.year || formatKurdishYear(explicitEnd),
    };
  }

  // 2. Parse from year string
  const rawYear = fact.year ? normalizeYearString(fact.year) : '';
  const isBC =
    Boolean(fact.isBC) ||
    (fact.year && (fact.year.includes('پ.ز') || fact.year.includes('پێش'))) ||
    (fact.century && (fact.century.includes('پ.ز') || fact.century.includes('پێش'))) ||
    (fact.eraPeriod && (fact.eraPeriod.includes('پ.ز') || fact.eraPeriod.includes('پێش'))) ||
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
      label: fact.year || formatKurdishYearRange(s, e),
    };
  } else if (matches && matches.length === 1) {
    let y = parseInt(matches[0], 10);
    if (isBC) y = -Math.abs(y);
    return {
      startYear: y,
      endYear: y,
      isRange: false,
      label: fact.year || formatKurdishYear(y),
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
    const isCenturyBC = fact.century.includes('پ.ز') || fact.century.includes('پێش');
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
      // e.g. -7 (7th century BC: 700 to 600 BC)
      s = c * 100;
      e = (c + 1) * 100;
    } else {
      // e.g. 12 (12th century AD: 1100 to 1200 AD)
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
      return { startYear: -3000, endYear: -800, isRange: true, label: '٣٠٠٠ - ٨٠٠ پ.ز' };
    case 2:
      return { startYear: -700, endYear: -550, isRange: true, label: '٧٠٠ - ٥٥٠ پ.ز' };
    case 3:
      return { startYear: -400, endYear: 650, isRange: true, label: '٤٠٠ پ.ز - ٦٥٠ ز' };
    case 4:
      return { startYear: 900, endYear: 1850, isRange: true, label: '٩٠٠ - ١٨٥٠ ز' };
    case 5:
    default:
      return { startYear: 1919, endYear: 2026, isRange: true, label: '١٩١٩ - ٢٠٢٦ ز' };
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
