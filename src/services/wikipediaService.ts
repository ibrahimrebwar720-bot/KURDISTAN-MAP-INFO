// Kurdish Wikipedia API Service (Exclusively Kurdish - ckb.wikipedia.org & ku.wikipedia.org)

export interface WikipediaResult {
  title: string;
  extract: string;
  thumbnail?: string;
  pageUrl: string;
  lang: 'ckb' | 'ku';
  description?: string;
}

// In-memory cache to prevent redundant network requests
const cache = new Map<number, WikipediaResult | null>();

/**
 * Normalizes Kurdish text variations for optimal Wikipedia matching:
 * - Kurdish Heh (ھ - U+06BE) vs Arabic Heh (ه - U+0647)
 * - Kurdish Kaf (ک - U+06A9) vs Arabic Kaf (ك - U+0643)
 * - Kurdish Yeh (ی - U+06CC) vs Arabic Yeh (ي - U+064A)
 */
function normalizeKurdish(str: string): string {
  return str
    .replace(/\([^)]*\)/g, ' ') // remove english/latin text in parentheses
    .replace(/[#\d+]/g, ' ')
    .replace(/ك/g, 'ک')
    .replace(/ي/g, 'ی')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Variant with Kurdish Heh (ھ)
 */
function toKurdishHeh(str: string): string {
  return str.replace(/ه/g, 'ھ');
}

/**
 * Variant with standard Heh (ه)
 */
function toStandardHeh(str: string): string {
  return str.replace(/ھ/g, 'ه');
}

/**
 * Fetch summary directly from Kurdish Wikipedia REST API
 */
async function fetchKurdishSummary(title: string, subdomain: 'ckb' | 'ku'): Promise<WikipediaResult | null> {
  try {
    const cleanTitle = title.trim();
    const url = `https://${subdomain}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanTitle)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();

    if (!data.extract || data.type === 'disambiguation') return null;

    // Check that extract contains Kurdish / Arabic script letters, strictly no English
    const hasArabicOrKurdishScript = /[\u0600-\u06FF]/.test(data.extract);
    if (!hasArabicOrKurdishScript && subdomain === 'ku') return null;

    return {
      title: data.title,
      extract: data.extract,
      thumbnail: data.thumbnail?.source,
      pageUrl: data.content_urls?.desktop?.page || `https://${subdomain}.wikipedia.org/wiki/${encodeURIComponent(data.title)}`,
      lang: subdomain,
      description: data.description,
    };
  } catch (e) {
    return null;
  }
}

/**
 * Search Kurdish Wikipedia using Action API
 */
async function searchKurdishWikipedia(term: string, subdomain: 'ckb' | 'ku'): Promise<string | null> {
  if (!term || term.length < 2) return null;
  try {
    const url = `https://${subdomain}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      term
    )}&utf8=&format=json&origin=*`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const firstHit = data.query?.search?.[0];
    return firstHit ? firstHit.title : null;
  } catch (e) {
    return null;
  }
}

/**
 * Fetch Wikipedia information in Kurdish ONLY
 */
export async function fetchWikipediaFactInfo(
  factId: number,
  factName: string,
  fallbackDesc: string
): Promise<WikipediaResult | null> {
  if (cache.has(factId)) {
    return cache.get(factId) || null;
  }

  const baseKurdish = normalizeKurdish(factName);
  const candidates: string[] = [
    baseKurdish,
    toKurdishHeh(baseKurdish),
    toStandardHeh(baseKurdish),
  ];

  // Also add simplified variants (e.g. "دەوڵەتی ئەییووبی" if starts with "ئەییووبییەکان")
  if (baseKurdish.includes('ئەییووبی')) {
    candidates.push('دەوڵەتی ئەییووبی', 'ئەییووبییەکان', 'سەلاحەدینی ئەییووبی');
  }
  if (baseKurdish.includes('بابان')) {
    candidates.push('میرنشینی بابان', 'بابان');
  }
  if (baseKurdish.includes('سۆران')) {
    candidates.push('میرنشینی سۆران', 'سۆران');
  }
  if (baseKurdish.includes('ئەردەڵان')) {
    candidates.push('میرنشینی ئەردەڵان', 'ئەردەڵان');
  }
  if (baseKurdish.includes('بۆتان')) {
    candidates.push('میرنشینی بۆتان', 'بۆتان');
  }
  if (baseKurdish.includes('بادینان')) {
    candidates.push('میرنشینی بادینان', 'بادینان');
  }
  if (baseKurdish.includes('ماد')) {
    candidates.push('ماد', 'مادەکان', 'ئیمپراتۆریەتیی ماد');
  }
  if (baseKurdish.includes('گۆتی') || baseKurdish.includes('گوتی')) {
    candidates.push('گۆتی', 'گوتییەکان', 'گۆتییەکان');
  }
  if (baseKurdish.includes('کۆماری کوردستان') || baseKurdish.includes('مەهاباد')) {
    candidates.push('کۆماری کوردستان', 'کۆماری مەھاباد');
  }

  // Also try main keyword without prefix words like "شەڕی", "پەیمانی", "قەڵای"
  const singleKeyword = baseKurdish.split(' ')[0];
  if (singleKeyword && !candidates.includes(singleKeyword) && singleKeyword.length > 3) {
    candidates.push(singleKeyword);
  }

  // 1. Try exact matches on ckb.wikipedia.org (Central Kurdish / Sorani)
  for (const query of candidates) {
    const directResult = await fetchKurdishSummary(query, 'ckb');
    if (directResult && directResult.extract) {
      cache.set(factId, directResult);
      return directResult;
    }
  }

  // 2. Try search queries on ckb.wikipedia.org
  for (const query of candidates) {
    const searchHit = await searchKurdishWikipedia(query, 'ckb');
    if (searchHit) {
      const searchResult = await fetchKurdishSummary(searchHit, 'ckb');
      if (searchResult && searchResult.extract) {
        cache.set(factId, searchResult);
        return searchResult;
      }
    }
  }

  // 3. Try ku.wikipedia.org with Arabic/Kurdish script
  for (const query of candidates) {
    const kuHit = await searchKurdishWikipedia(query, 'ku');
    if (kuHit) {
      const kuResult = await fetchKurdishSummary(kuHit, 'ku');
      if (kuResult && kuResult.extract) {
        cache.set(factId, kuResult);
        return kuResult;
      }
    }
  }

  // 4. Try city or geographic landmark from fallbackDesc (in Kurdish)
  const cityMatch = normalizeKurdish(fallbackDesc.split(/[،,-]/)[0]?.trim() || '');
  if (cityMatch && cityMatch.length > 3) {
    const cityHit = await searchKurdishWikipedia(cityMatch, 'ckb');
    if (cityHit) {
      const cityResult = await fetchKurdishSummary(cityHit, 'ckb');
      if (cityResult && cityResult.extract) {
        cache.set(factId, cityResult);
        return cityResult;
      }
    }
  }

  cache.set(factId, null);
  return null;
}
