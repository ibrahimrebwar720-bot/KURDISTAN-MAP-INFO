import { AppLanguage } from '../context/LanguageContext';
import { FactItem } from '../data/kurdishHistoryData';
import { CollectionItem } from '../types/history';
import { getProvinceById, matchFactToProvince } from '../data/kurdishProvincesData';
import { formatYearRange } from '../utils/yearUtils';
import { getFactFromCloud, saveFactToCloud } from './firestoreHistoryService';

interface TranslatedFactTextPayload {
  name?: string;
  desc?: string;
  fullText?: string;
  additionalNotes?: string;
  eraName?: string;
  eraPeriod?: string;
  year?: string;
  century?: string;
  region?: string;
  imageCaption?: string;
  imagesCaptions?: string[];
}

export interface TranslateFactOutcome {
  fact: FactItem;
  notesExcluded: boolean;
  notesMismatchSubject?: string;
}

export class TranslationApiError extends Error {
  statusCode: number;
  code?: string;
  retryAfterSeconds?: number;

  constructor(
    message: string,
    statusCode: number,
    code?: string,
    retryAfterSeconds?: number
  ) {
    super(message);
    this.name = 'TranslationApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }

  get isQuotaExceeded(): boolean {
    return this.statusCode === 429 || this.code === 'QUOTA_EXHAUSTED';
  }
}

export function formatTranslationError(err: unknown, language: AppLanguage): string {
  const isEn = language === 'en';
  if (err instanceof TranslationApiError && err.isQuotaExceeded) {
    return isEn
      ? 'Daily Free Tier AI translation limit reached. To translate more items now, select a billing-enabled Gemini API key in Settings > Secrets, or try again tomorrow.'
      : 'سنووری ڕۆژانەی وەرگێڕانی AI لە پلانی خۆڕایی (Free Tier) پڕبووەتەوە. بۆ بەردەوامبوون، کلیلی Gemini API ی خاوەن Billing لە Settings > Secrets هەڵبژێرە یان سبەینێ هەوڵ بدەرەوە.';
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return isEn ? 'AI translation failed' : 'وەرگێڕانی AI سەرکەوتوو نەبوو';
}

/**
 * Translates a FactItem into the target language ('en' or 'ckb') via /api/translate-fact,
 * strictly preserving the exact same coordinates, boundaries, IDs, dates, relations, and image URLs,
 * then saves it directly to the target language's Firestore collection (`facts_en` or `facts`).
 */
export async function translateFactToLanguageDetailed(
  sourceFact: FactItem,
  targetLanguage: AppLanguage
): Promise<TranslateFactOutcome> {
  const response = await fetch('/api/translate-fact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fact: sourceFact, targetLanguage }),
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    let errorCode: string | undefined;
    let retryAfterSeconds: number | undefined;
    try {
      const errJson = await response.json();
      if (errJson?.error) errorMessage = String(errJson.error);
      if (errJson?.code) errorCode = String(errJson.code);
      if (typeof errJson?.retryAfterSeconds === 'number') {
        retryAfterSeconds = errJson.retryAfterSeconds;
      }
    } catch {
      // ignore json parse error
    }
    throw new TranslationApiError(errorMessage, response.status, errorCode, retryAfterSeconds);
  }

  const data = (await response.json()) as {
    translated?: TranslatedFactTextPayload;
    meta?: {
      notesExcluded?: boolean;
      notesMismatchSubject?: string;
    };
  };
  const t = data.translated;
  if (!t || !t.name) {
    throw new Error('AI translation returned empty result.');
  }

  const notesExcluded = Boolean(data.meta?.notesExcluded);
  const notesMismatchSubject = notesExcluded
    ? data.meta?.notesMismatchSubject?.trim() || undefined
    : undefined;

  // Strictly preserve ALL original image URLs and gallery ordering
  const preservedImages = Array.isArray(sourceFact.images)
    ? sourceFact.images.map((img, idx) => {
        const translatedCap =
          Array.isArray(t.imagesCaptions) && typeof t.imagesCaptions[idx] === 'string'
            ? t.imagesCaptions[idx].trim()
            : img.caption;
        return {
          url: img.url,
          ...(translatedCap ? { caption: translatedCap } : {}),
        };
      })
    : undefined;

  // Fallback province/region label if AI left region blank
  const matchedProv =
    (sourceFact.provinceId ? getProvinceById(sourceFact.provinceId) : undefined) ||
    matchFactToProvince(sourceFact, targetLanguage);

  const fallbackYear =
    typeof sourceFact.startYear === 'number'
      ? formatYearRange(sourceFact.startYear, sourceFact.endYear, targetLanguage)
      : sourceFact.year;

  let resolvedCentury = (t.century || sourceFact.century || '').trim();
  if (typeof sourceFact.startYear === 'number' && sourceFact.startYear < -4000) {
    if (targetLanguage === 'en') {
      if (
        !resolvedCentury ||
        /^\d+(st|nd|rd|th)\s+century\s+bce?$/i.test(resolvedCentury) ||
        /سەدە/.test(resolvedCentury)
      ) {
        resolvedCentury = 'Paleolithic / Prehistoric Era';
      }
    } else if (!resolvedCentury || /century/i.test(resolvedCentury) || /٧٠٠/.test(resolvedCentury)) {
      resolvedCentury = 'سەردەمی بەردین / پێش‌مێژوو';
    }
  }

  const resolvedAdditionalNotes = notesExcluded
    ? undefined
    : t.additionalNotes?.trim()
    ? t.additionalNotes.trim()
    : undefined;

  const fallbackRegion = targetLanguage === 'en' ? matchedProv?.nameEn : matchedProv?.name;

  const translatedFact: FactItem = {
    // 1. Preserve ALL structural, spatial, relational, numeric date & image URL fields verbatim
    ...sourceFact,
    id: sourceFact.id,
    num: sourceFact.num,
    eraId: sourceFact.eraId,
    lat: sourceFact.lat,
    lng: sourceFact.lng,
    zoom: sourceFact.zoom,
    provinceId: sourceFact.provinceId || matchedProv?.id,
    tag: sourceFact.tag,
    category: sourceFact.category,
    collectionId: sourceFact.collectionId,
    startYear: sourceFact.startYear,
    endYear: sourceFact.endYear,
    birthYear: sourceFact.birthYear,
    deathYear: sourceFact.deathYear,
    isBC: sourceFact.isBC,
    centuryNumber: sourceFact.centuryNumber,
    timeSpanType: sourceFact.timeSpanType,
    startCentury: sourceFact.startCentury,
    endCentury: sourceFact.endCentury,
    startCenturyBC: sourceFact.startCenturyBC,
    endCenturyBC: sourceFact.endCenturyBC,
    territoryPolygon: sourceFact.territoryPolygon,
    territoryColor: sourceFact.territoryColor,
    overlayImageUrl: sourceFact.overlayImageUrl,
    overlayBounds: sourceFact.overlayBounds,
    parentFactId: sourceFact.parentFactId,
    relatedFactIds: sourceFact.relatedFactIds,
    allyFactIds: sourceFact.allyFactIds,
    imageUrl: sourceFact.imageUrl,
    images: preservedImages,

    // 2. Apply AI-translated scholarly textual fields
    name: t.name.trim(),
    desc: (t.desc || sourceFact.desc || '').trim(),
    fullText: (t.fullText || sourceFact.fullText || '').trim(),
    additionalNotes: resolvedAdditionalNotes,
    eraName: (t.eraName || sourceFact.eraName || '').trim(),
    eraPeriod: (t.eraPeriod || sourceFact.eraPeriod || '').trim(),
    year: (t.year || fallbackYear || '').trim(),
    century: resolvedCentury,
    region: (t.region || fallbackRegion || sourceFact.region || '').trim() || undefined,
    imageCaption: t.imageCaption?.trim() ? t.imageCaption.trim() : undefined,
    isCustom: true,
    updatedAt: Date.now(),
  };

  await saveFactToCloud(translatedFact, targetLanguage);
  return {
    fact: translatedFact,
    notesExcluded,
    notesMismatchSubject,
  };
}

export async function translateFactToEnglishDetailed(
  sourceFact: FactItem
): Promise<TranslateFactOutcome> {
  return translateFactToLanguageDetailed(sourceFact, 'en');
}

export async function translateFactToEnglishAndSave(sourceFact: FactItem): Promise<FactItem> {
  const outcome = await translateFactToEnglishDetailed(sourceFact);
  return outcome.fact;
}

export interface BatchTranslateProgress {
  completed: number;
  total: number;
  currentName: string;
  succeeded: FactItem[];
  failed: Array<{ id: number; name: string; error: string }>;
  notesExcludedCount: number;
  quotaExceeded?: boolean;
  retryAfterSeconds?: number;
}

/**
 * Batch-translates an array of Kurdish FactItems into English sequentially (avoiding rate spikes)
 * and persists each translated item immediately into Firestore `facts_en`.
 * Stops immediately if Gemini quota is exhausted (429 / QUOTA_EXHAUSTED) so it does not spam failing requests.
 */
export async function translateFactsBatchToEnglish(
  sourceFacts: FactItem[],
  onProgress?: (progress: BatchTranslateProgress) => void,
  shouldStop?: () => boolean
): Promise<BatchTranslateProgress> {
  const succeeded: FactItem[] = [];
  const failed: Array<{ id: number; name: string; error: string }> = [];
  let notesExcludedCount = 0;
  let quotaExceeded = false;
  let retryAfterSeconds: number | undefined;
  const total = sourceFacts.length;

  for (let i = 0; i < total; i++) {
    if (shouldStop && shouldStop()) break;
    if (i > 0) {
      await new Promise((r) => setTimeout(r, 400));
      if (shouldStop && shouldStop()) break;
    }
    const fact = sourceFacts[i];
    onProgress?.({
      completed: i,
      total,
      currentName: fact.name,
      succeeded: [...succeeded],
      failed: [...failed],
      notesExcludedCount,
      quotaExceeded,
      retryAfterSeconds,
    });
    try {
      const outcome = await translateFactToEnglishDetailed(fact);
      succeeded.push(outcome.fact);
      if (outcome.notesExcluded) {
        notesExcludedCount += 1;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      failed.push({
        id: fact.id,
        name: fact.name,
        error: message,
      });
      if (err instanceof TranslationApiError && err.isQuotaExceeded) {
        quotaExceeded = true;
        retryAfterSeconds = err.retryAfterSeconds;
        break;
      }
    }
  }

  const finalState: BatchTranslateProgress = {
    completed: succeeded.length + failed.length,
    total,
    currentName: '',
    succeeded,
    failed,
    notesExcludedCount,
    quotaExceeded,
    retryAfterSeconds,
  };
  onProgress?.(finalState);
  return finalState;
}

function normStr(val: string | undefined | null): string {
  return (val || '').trim();
}

function stableJson(val: unknown): string {
  return JSON.stringify(val ?? null);
}

/**
 * Returns true if any human-language textual field changed between `prev` and `next`.
 * Used to avoid wasting AI quota when only coordinates, images, dates, polygons, or relations changed.
 */
export function hasFactTextChanged(
  prev: FactItem | null | undefined,
  next: FactItem
): boolean {
  if (!prev) return true;
  if (normStr(prev.name) !== normStr(next.name)) return true;
  if (normStr(prev.desc) !== normStr(next.desc)) return true;
  if (normStr(prev.fullText) !== normStr(next.fullText)) return true;
  if (normStr(prev.additionalNotes) !== normStr(next.additionalNotes)) return true;
  if (normStr(prev.eraName) !== normStr(next.eraName)) return true;
  if (normStr(prev.eraPeriod) !== normStr(next.eraPeriod)) return true;
  if (normStr(prev.year) !== normStr(next.year)) return true;
  if (normStr(prev.century) !== normStr(next.century)) return true;
  if (normStr(prev.region) !== normStr(next.region)) return true;
  if (normStr(prev.imageCaption) !== normStr(next.imageCaption)) return true;

  const prevCaptions = (prev.images || []).map((i) => normStr(i.caption));
  const nextCaptions = (next.images || []).map((i) => normStr(i.caption));
  if (stableJson(prevCaptions) !== stableJson(nextCaptions)) return true;

  return false;
}

/**
 * Returns true if non-text structural fields (coords, images, dates, territory, category, relations) changed.
 */
export function hasFactStructureChanged(
  prev: FactItem | null | undefined,
  next: FactItem
): boolean {
  if (!prev) return true;
  if (prev.lat !== next.lat || prev.lng !== next.lng || prev.zoom !== next.zoom) return true;
  if (prev.provinceId !== next.provinceId) return true;
  if (prev.tag !== next.tag || prev.category !== next.category || prev.collectionId !== next.collectionId) return true;
  if (
    prev.startYear !== next.startYear ||
    prev.endYear !== next.endYear ||
    prev.birthYear !== next.birthYear ||
    prev.deathYear !== next.deathYear ||
    prev.isBC !== next.isBC ||
    prev.centuryNumber !== next.centuryNumber ||
    prev.timeSpanType !== next.timeSpanType ||
    prev.startCentury !== next.startCentury ||
    prev.endCentury !== next.endCentury ||
    prev.startCenturyBC !== next.startCenturyBC ||
    prev.endCenturyBC !== next.endCenturyBC
  ) {
    return true;
  }
  if (normStr(prev.imageUrl) !== normStr(next.imageUrl)) return true;
  const prevUrls = (prev.images || []).map((i) => normStr(i.url));
  const nextUrls = (next.images || []).map((i) => normStr(i.url));
  if (stableJson(prevUrls) !== stableJson(nextUrls)) return true;

  if (prev.parentFactId !== next.parentFactId) return true;
  if (stableJson(prev.relatedFactIds || []) !== stableJson(next.relatedFactIds || [])) return true;
  if (stableJson(prev.allyFactIds || []) !== stableJson(next.allyFactIds || [])) return true;
  if (prev.territoryColor !== next.territoryColor) return true;
  if (stableJson(prev.territoryPolygon) !== stableJson(next.territoryPolygon)) return true;
  if (normStr(prev.overlayImageUrl) !== normStr(next.overlayImageUrl)) return true;
  if (stableJson(prev.overlayBounds) !== stableJson(next.overlayBounds)) return true;

  return false;
}

/**
 * Syncs ONLY structural/non-text fields (coords, images, dates, territory, relations, category)
 * from the Kurdish Knowledge Base `sourceFact` into an already-translated target language document
 * WITHOUT calling Gemini AI and preserving all existing translated text & captions.
 * Returns true if the target entry existed and was updated; false if not yet translated.
 */
export async function syncFactNonTextFieldsToLanguage(
  sourceFact: FactItem,
  targetLanguage: AppLanguage
): Promise<boolean> {
  const existingTarget = await getFactFromCloud(sourceFact.id, targetLanguage);
  if (!existingTarget) {
    return false;
  }

  const existingCaptionByUrl = new Map<string, string>();
  if (Array.isArray(existingTarget.images)) {
    for (const img of existingTarget.images) {
      if (img?.url && img.caption) {
        existingCaptionByUrl.set(img.url, img.caption);
      }
    }
  }

  const syncedImages = Array.isArray(sourceFact.images)
    ? sourceFact.images.map((img) => {
        const preservedCaption = existingCaptionByUrl.get(img.url);
        return {
          url: img.url,
          ...(preservedCaption ? { caption: preservedCaption } : img.caption ? { caption: img.caption } : {}),
        };
      })
    : undefined;

  const syncedYear =
    typeof sourceFact.startYear === 'number'
      ? formatYearRange(sourceFact.startYear, sourceFact.endYear, targetLanguage)
      : existingTarget.year;

  const mergedTarget: FactItem = {
    ...existingTarget,
    num: sourceFact.num,
    eraId: sourceFact.eraId,
    lat: sourceFact.lat,
    lng: sourceFact.lng,
    zoom: sourceFact.zoom,
    provinceId: sourceFact.provinceId,
    tag: sourceFact.tag,
    category: sourceFact.category,
    collectionId: sourceFact.collectionId,
    startYear: sourceFact.startYear,
    endYear: sourceFact.endYear,
    birthYear: sourceFact.birthYear,
    deathYear: sourceFact.deathYear,
    isBC: sourceFact.isBC,
    centuryNumber: sourceFact.centuryNumber,
    timeSpanType: sourceFact.timeSpanType,
    startCentury: sourceFact.startCentury,
    endCentury: sourceFact.endCentury,
    startCenturyBC: sourceFact.startCenturyBC,
    endCenturyBC: sourceFact.endCenturyBC,
    year: syncedYear,
    territoryPolygon: sourceFact.territoryPolygon,
    territoryColor: sourceFact.territoryColor,
    overlayImageUrl: sourceFact.overlayImageUrl,
    overlayBounds: sourceFact.overlayBounds,
    parentFactId: sourceFact.parentFactId,
    relatedFactIds: sourceFact.relatedFactIds,
    allyFactIds: sourceFact.allyFactIds,
    imageUrl: sourceFact.imageUrl,
    images: syncedImages,
    updatedAt: Date.now(),
  };

  await saveFactToCloud(mergedTarget, targetLanguage);
  return true;
}

/**
 * Translates a Kurdish collection into English via /api/translate-collection when `nameEn` is missing,
 * falling back safely to the Kurdish text if AI is offline or quota is reached.
 */
export async function translateCollectionToEnglish(
  col: CollectionItem
): Promise<CollectionItem> {
  if (col.nameEn && col.nameEn.trim()) {
    return {
      ...col,
      name: col.nameEn.trim(),
      description: (col.descriptionEn || col.description || '').trim() || undefined,
    };
  }

  try {
    const response = await fetch('/api/translate-collection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: col.name,
        description: col.description || '',
      }),
    });
    if (response.ok) {
      const data = (await response.json()) as {
        translated?: { name?: string; description?: string };
      };
      const enName = data?.translated?.name?.trim();
      const enDesc = data?.translated?.description?.trim();
      if (enName) {
        return {
          ...col,
          name: enName,
          nameEn: enName,
          description: enDesc || col.description,
          descriptionEn: enDesc || col.descriptionEn,
        };
      }
    }
  } catch {
    // Fallback below
  }

  return {
    ...col,
    nameEn: col.nameEn || col.name,
    descriptionEn: col.descriptionEn || col.description,
  };
}
