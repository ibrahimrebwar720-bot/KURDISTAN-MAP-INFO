/**
 * Kurdish & Arabic Resilient Text Search Normalizer
 * Provides character-unifying normalization for search queries and target texts.
 */

const DIACRITICS_REGEX = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const TATWEEL_REGEX = /\u0640/g;
const ZERO_WIDTH_REGEX = /[\u200B-\u200F\uFEFF\u00AD]/g;

// Eastern Arabic & Persian numerals to Latin numerals
const NUMERALS_MAP: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
};

/**
 * Normalizes a Kurdish/Arabic string for resilient search comparison
 */
export function normalizeKurdishSearchText(text: string | null | undefined): string {
  if (!text) return '';

  return (
    text
      .toString()
      .toLowerCase()
      // Remove diacritics / harakat
      .replace(DIACRITICS_REGEX, '')
      // Remove tatweel / kashida
      .replace(TATWEEL_REGEX, '')
      // Remove zero-width spaces / non-joiners
      .replace(ZERO_WIDTH_REGEX, '')
      // Replace Eastern Arabic & Persian digits
      .replace(/[٠-٩۰-۹]/g, (match) => NUMERALS_MAP[match] || match)
      // Unify Arabic Kaf (ك \u0643) -> Kurdish Kaf (ک \u06A9)
      .replace(/\u0643/g, 'ک')
      // Unify Arabic Yeh (ي \u064A, ى \u0649) -> Kurdish Yeh (ی \u06CC)
      .replace(/[\u064A\u0649]/g, 'ی')
      // Unify Ta Marbuta (ة \u0629) -> Kurdish Ae (ە \u06D5)
      .replace(/\u0629/g, 'ە')
      // Also unify Persian Heh with ye (ۀ) -> ە
      .replace(/\u06C0/g, 'ە')
      // Collapse whitespace
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Checks whether a haystack contains a needle using normalized Kurdish comparison.
 * Also supports flexible matching for 'ه' and 'ە'.
 */
export function kurdishSearchMatch(haystack: string | null | undefined, needle: string): boolean {
  if (!haystack || !needle) return false;

  const normHaystack = normalizeKurdishSearchText(haystack);
  const normNeedle = normalizeKurdishSearchText(needle);

  if (!normNeedle) return true;
  if (normHaystack.includes(normNeedle)) return true;

  // Flexible fallback: also check if matching with 'ه' and 'ە' swapped
  // (many Kurdish typists use Arabic 'ه' instead of Kurdish 'ە' or vice versa)
  const flexibleHaystack = normHaystack.replace(/ه/g, 'ە');
  const flexibleNeedle = normNeedle.replace(/ه/g, 'ە');

  return flexibleHaystack.includes(flexibleNeedle);
}
