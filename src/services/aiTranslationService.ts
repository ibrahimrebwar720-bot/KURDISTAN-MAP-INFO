import { AppLanguage } from '../context/LanguageContext';
import { FactItem } from '../data/kurdishHistoryData';
import { CollectionItem } from '../types/history';
import { getProvinceById, matchFactToProvince } from '../data/kurdishProvincesData';
import { formatYearRange } from '../utils/yearUtils';
import { getFactFromCloud, saveFactToCloud } from './firestoreHistoryService';

export type TranslatableFactField =
  | 'name'
  | 'desc'
  | 'fullText'
  | 'additionalNotes'
  | 'eraName'
  | 'eraPeriod'
  | 'year'
  | 'century'
  | 'region'
  | 'imageCaption'
  | 'imagesCaptions';

export interface FactFieldDiff {
  changedTextFields: TranslatableFactField[];
  hasSummaryOrFullTextChange: boolean;
  hasStructureChange: boolean;
  changedLabelsKu: string[];
  changedLabelsEn: string[];
}

export interface TranslateFactOptions {
  fieldsToTranslate?: TranslatableFactField[];
}

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

  get isTemporarilyUnavailable(): boolean {
    return (
      this.statusCode === 503 ||
      this.statusCode === 502 ||
      this.statusCode === 504 ||
      this.code === 'MODEL_UNAVAILABLE'
    );
  }
}

function cleanRawErrorString(msg: string): string {
  const trimmed = (msg || '').trim();
  const jsonStart = trimmed.indexOf('{');
  if (jsonStart !== -1) {
    try {
      const parsed = JSON.parse(trimmed.slice(jsonStart)) as {
        error?: { message?: string };
        message?: string;
      };
      if (parsed?.error?.message) return String(parsed.error.message);
      if (parsed?.message) return String(parsed.message);
    } catch {
      // ignore invalid JSON
    }
  }
  return trimmed;
}

export function formatTranslationError(err: unknown, language: AppLanguage): string {
  const isEn = language === 'en';
  if (err instanceof TranslationApiError && err.isQuotaExceeded) {
    return isEn
      ? 'Daily Free Tier AI translation limit reached. To translate more items now, select a billing-enabled Gemini API key in Settings > Secrets, or try again tomorrow.'
      : 'سنووری ڕۆژانەی وەرگێڕانی AI لە پلانی خۆڕایی (Free Tier) پڕبووەتەوە. بۆ بەردەوامبوون، کلیلی Gemini API ی خاوەن Billing لە Settings > Secrets هەڵبژێرە یان سبەینێ هەوڵ بدەرەوە.';
  }
  if (err instanceof TranslationApiError && err.code === 'MISSING_HOST_API_KEY') {
    return isEn
      ? 'GEMINI_API_KEY is not configured on this external host. Add GEMINI_API_KEY in your Cloudflare Workers/Pages Environment Variables & Secrets to enable translation.'
      : 'کلیلی GEMINI_API_KEY لەسەر ئەم هۆستە دەرەکییە دانەنراوە. بۆ کارکردنی وەرگێڕان، لە ڕێکخستنەکانی هۆستەکەت (Cloudflare Environment Variables / Secrets) گۆڕاوی GEMINI_API_KEY زیاد بکە.';
  }
  if (
    err instanceof TranslationApiError &&
    (err.statusCode === 404 || err.statusCode === 405 || err.code === 'HOST_API_UNAVAILABLE')
  ) {
    return isEn
      ? 'The translation server endpoint is not active on this static host. Deploy using Cloudflare Workers/Pages Functions or the Node server with GEMINI_API_KEY configured.'
      : 'خزمەتگوزاریی وەرگێڕان لەسەر ئەم هۆستە چالاک نییە (تەنها فایلی ستاتیکە یان ڕاژەی /api چالاک نەکراوە). تکایە بە Cloudflare Workers/Pages Functions یان سێرڤەری تەواو لەگەڵ GEMINI_API_KEY بڵاوی بکەرەوە.';
  }
  const rawMsg = err instanceof Error ? err.message : String(err || '');
  const lower = rawMsg.toLowerCase();
  if (
    (err instanceof TranslationApiError && err.isTemporarilyUnavailable) ||
    lower.includes('"code":503') ||
    lower.includes('unavailable') ||
    lower.includes('high demand') ||
    lower.includes('overloaded')
  ) {
    return isEn
      ? 'The AI translation server is temporarily busy due to high demand. Please wait a few seconds and try again.'
      : 'سێرڤەری وەرگێڕانی AI لەم ساتەدا فشاری زۆری لەسەرە (503). تکایە چەند چرکەیەک چاوەڕوان بە و دووبارە هەوڵ بدەرەوە.';
  }
  if (err instanceof TranslationApiError && err.statusCode === 500 && rawMsg === 'HTTP 500') {
    return isEn
      ? 'The translation server returned an internal error (HTTP 500). Ensure the host server is running and GEMINI_API_KEY is configured, then try again.'
      : 'سێرڤەری وەرگێڕان تووشی هەڵەیەکی ناوخۆیی بوو (HTTP 500). دڵنیابە لە کارکردنی سێرڤەر و دانانی GEMINI_API_KEY لە هۆستەکەدا، پاشان دووبارە هەوڵ بدەرەوە.';
  }
  const cleaned = cleanRawErrorString(rawMsg);
  if (cleaned) {
    return cleaned;
  }
  return isEn ? 'AI translation failed' : 'وەرگێڕانی AI سەرکەوتوو نەبوو';
}

/**
 * Translates a FactItem into the target language ('en' or 'ckb') via /api/translate-fact,
 * strictly preserving the exact same coordinates, boundaries, IDs, dates, relations, and image URLs,
 * then saves it directly to the target language's Firestore collection (`facts_en` or `facts`).
 * When `options.fieldsToTranslate` is provided and an existing target-language entry exists,
 * ONLY those specific changed fields are translated and merged — leaving `desc`, `fullText`,
 * and all other untouched target-language fields completely intact.
 */
export async function translateFactToLanguageDetailed(
  sourceFact: FactItem,
  targetLanguage: AppLanguage,
  options?: TranslateFactOptions
): Promise<TranslateFactOutcome> {
  const requestedFields =
    options?.fieldsToTranslate && options.fieldsToTranslate.length > 0
      ? Array.from(new Set(options.fieldsToTranslate))
      : undefined;

  const existingTarget = requestedFields
    ? await getFactFromCloud(sourceFact.id, targetLanguage)
    : null;

  // Only perform partial translation if we have an existing target entry to merge into;
  // otherwise perform full translation so the new target entry is complete.
  const effectiveFields = requestedFields && existingTarget ? requestedFields : undefined;

  // If ONLY empty/cleared fields were modified in an existing target entry,
  // apply the clear + structural sync immediately without needing an AI call.
  if (effectiveFields && existingTarget) {
    const allClearedOrEmpty = effectiveFields.every((fieldKey) => {
      if (fieldKey === 'imagesCaptions') {
        return !Array.isArray(sourceFact.images) || sourceFact.images.every((img) => !normStr(img.caption));
      }
      return !normStr((sourceFact as unknown as Record<string, string | undefined>)[fieldKey]);
    });

    if (allClearedOrEmpty) {
      const reqSet = new Set<TranslatableFactField>(effectiveFields);
      const existingCaptionByUrl = new Map<string, string>();
      if (Array.isArray(existingTarget.images)) {
        for (const img of existingTarget.images) {
          if (img?.url && img.caption) {
            existingCaptionByUrl.set(img.url, img.caption);
          }
        }
      }
      const clearedImages = Array.isArray(sourceFact.images)
        ? sourceFact.images.map((img) => {
            const preservedCap = reqSet.has('imagesCaptions') ? undefined : existingCaptionByUrl.get(img.url);
            return {
              url: img.url,
              ...(preservedCap ? { caption: preservedCap } : {}),
            };
          })
        : undefined;

      const clearedFact: FactItem = {
        ...existingTarget,
        id: sourceFact.id,
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
        territoryPolygon: sourceFact.territoryPolygon,
        territoryColor: sourceFact.territoryColor,
        overlayImageUrl: sourceFact.overlayImageUrl,
        overlayBounds: sourceFact.overlayBounds,
        parentFactId: sourceFact.parentFactId,
        relatedFactIds: sourceFact.relatedFactIds,
        allyFactIds: sourceFact.allyFactIds,
        imageUrl: sourceFact.imageUrl,
        images: clearedImages,
        additionalNotes: reqSet.has('additionalNotes') ? undefined : existingTarget.additionalNotes,
        eraName: reqSet.has('eraName') ? '' : existingTarget.eraName,
        eraPeriod: reqSet.has('eraPeriod') ? '' : existingTarget.eraPeriod,
        year: reqSet.has('year') ? '' : existingTarget.year,
        century: reqSet.has('century') ? '' : existingTarget.century,
        region: reqSet.has('region') ? undefined : existingTarget.region,
        imageCaption: reqSet.has('imageCaption') ? undefined : existingTarget.imageCaption,
        isCustom: true,
        updatedAt: Date.now(),
      };

      await saveFactToCloud(clearedFact, targetLanguage);
      return {
        fact: clearedFact,
        notesExcluded: false,
      };
    }
  }

  let response: Response | null = null;
  for (let clientAttempt = 1; clientAttempt <= 2; clientAttempt++) {
    response = await fetch('/api/translate-fact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fact: sourceFact,
        targetLanguage,
        ...(effectiveFields ? { fieldsToTranslate: effectiveFields } : {}),
      }),
    });

    if (response.ok) break;

    if (
      clientAttempt === 1 &&
      (response.status === 503 || response.status === 502 || response.status === 504)
    ) {
      await new Promise((r) => setTimeout(r, 1800));
      continue;
    }

    let errorMessage = `HTTP ${response.status}`;
    let errorCode: string | undefined;
    let retryAfterSeconds: number | undefined;
    try {
      const errJson = await response.json();
      if (errJson?.error) errorMessage = cleanRawErrorString(String(errJson.error));
      if (errJson?.code) errorCode = String(errJson.code);
      if (typeof errJson?.retryAfterSeconds === 'number') {
        retryAfterSeconds = errJson.retryAfterSeconds;
      }
    } catch {
      // ignore json parse error
    }
    throw new TranslationApiError(errorMessage, response.status, errorCode, retryAfterSeconds);
  }

  if (!response || !response.ok) {
    throw new TranslationApiError('Translation service unavailable', 503, 'MODEL_UNAVAILABLE');
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new TranslationApiError(
      'Host returned non-JSON response for /api/translate-fact',
      404,
      'HOST_API_UNAVAILABLE'
    );
  }

  const data = (await response.json()) as {
    translated?: TranslatedFactTextPayload;
    meta?: {
      notesExcluded?: boolean;
      notesMismatchSubject?: string;
    };
  };
  const t = data.translated;
  if (!t || (!effectiveFields && !t.name?.trim())) {
    throw new TranslationApiError('AI translation returned empty result.', 503, 'MODEL_UNAVAILABLE');
  }

  const notesExcluded = Boolean(data.meta?.notesExcluded);
  const notesMismatchSubject = notesExcluded
    ? data.meta?.notesMismatchSubject?.trim() || undefined
    : undefined;

  if (effectiveFields) {
    for (const fieldKey of effectiveFields) {
      if (fieldKey === 'imagesCaptions') {
        const hasSourceCaptions =
          Array.isArray(sourceFact.images) && sourceFact.images.some((img) => normStr(img.caption));
        if (hasSourceCaptions && !Array.isArray(t.imagesCaptions)) {
          throw new TranslationApiError('AI translation returned incomplete image captions.', 503, 'MODEL_UNAVAILABLE');
        }
        continue;
      }
      if (fieldKey === 'additionalNotes' && notesExcluded) {
        continue;
      }
      const sourceVal = normStr((sourceFact as unknown as Record<string, string | undefined>)[fieldKey]);
      const outVal = typeof t[fieldKey] === 'string' ? (t[fieldKey] as string).trim() : '';
      if (sourceVal && !outVal) {
        throw new TranslationApiError('AI translation returned incomplete fields.', 503, 'MODEL_UNAVAILABLE');
      }
    }
  }

  // Fallback province/region label if AI left region blank
  const matchedProv =
    (sourceFact.provinceId ? getProvinceById(sourceFact.provinceId) : undefined) ||
    matchFactToProvince(sourceFact, targetLanguage);

  const fallbackYear =
    typeof sourceFact.startYear === 'number'
      ? formatYearRange(sourceFact.startYear, sourceFact.endYear, targetLanguage)
      : sourceFact.year;

  const normalizeCentury = (rawCentury: string | undefined) => {
    let resolved = (rawCentury || '').trim();
    if (typeof sourceFact.startYear === 'number' && sourceFact.startYear < -4000) {
      if (targetLanguage === 'en') {
        if (
          !resolved ||
          /^\d+(st|nd|rd|th)\s+century\s+bce?$/i.test(resolved) ||
          /سەدە/.test(resolved)
        ) {
          resolved = 'Paleolithic / Prehistoric Era';
        }
      } else if (!resolved || /century/i.test(resolved) || /٧٠٠/.test(resolved)) {
        resolved = 'سەردەمی بەردین / پێش‌مێژوو';
      }
    }
    return resolved;
  };

  const fallbackRegion = targetLanguage === 'en' ? matchedProv?.nameEn : matchedProv?.name;

  // Partial Merge Mode: preserve existingTarget.desc, fullText, and all untouched fields 100%
  if (effectiveFields && existingTarget) {
    const reqSet = new Set<TranslatableFactField>(effectiveFields);
    const existingCaptionByUrl = new Map<string, string>();
    if (Array.isArray(existingTarget.images)) {
      for (const img of existingTarget.images) {
        if (img?.url && img.caption) {
          existingCaptionByUrl.set(img.url, img.caption);
        }
      }
    }

    const mergedImages = Array.isArray(sourceFact.images)
      ? sourceFact.images.map((img, idx) => {
          if (reqSet.has('imagesCaptions')) {
            const sourceCap = normStr(img.caption);
            const aiCap =
              Array.isArray(t.imagesCaptions) && typeof t.imagesCaptions[idx] === 'string'
                ? t.imagesCaptions[idx].trim()
                : undefined;
            const resolvedCap = sourceCap
              ? aiCap || existingCaptionByUrl.get(img.url) || sourceCap
              : undefined;
            return {
              url: img.url,
              ...(resolvedCap ? { caption: resolvedCap } : {}),
            };
          }
          const preservedCap = existingCaptionByUrl.get(img.url);
          return {
            url: img.url,
            ...(preservedCap ? { caption: preservedCap } : {}),
          };
        })
      : undefined;

    const mergedFact: FactItem = {
      ...existingTarget,
      // Always sync structural, spatial, numeric date, relational, and media URL fields verbatim
      id: sourceFact.id,
      num: sourceFact.num,
      eraId: sourceFact.eraId,
      lat: sourceFact.lat,
      lng: sourceFact.lng,
      zoom: sourceFact.zoom,
      provinceId: sourceFact.provinceId || existingTarget.provinceId || matchedProv?.id,
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
      images: mergedImages,
      // Apply ONLY requested translated textual fields
      name: reqSet.has('name') && t.name?.trim() ? t.name.trim() : existingTarget.name,
      desc: reqSet.has('desc')
        ? (t.desc || sourceFact.desc || existingTarget.desc || '').trim()
        : existingTarget.desc,
      fullText: reqSet.has('fullText')
        ? (t.fullText || sourceFact.fullText || existingTarget.fullText || '').trim()
        : existingTarget.fullText,
      additionalNotes: reqSet.has('additionalNotes')
        ? notesExcluded
          ? undefined
          : t.additionalNotes?.trim() || undefined
        : existingTarget.additionalNotes,
      eraName: reqSet.has('eraName')
        ? (t.eraName || sourceFact.eraName || existingTarget.eraName || '').trim()
        : existingTarget.eraName,
      eraPeriod: reqSet.has('eraPeriod')
        ? (t.eraPeriod || sourceFact.eraPeriod || existingTarget.eraPeriod || '').trim()
        : existingTarget.eraPeriod,
      year: reqSet.has('year')
        ? (t.year || fallbackYear || existingTarget.year || '').trim()
        : existingTarget.year,
      century: reqSet.has('century')
        ? normalizeCentury(t.century || sourceFact.century || existingTarget.century)
        : existingTarget.century,
      region: reqSet.has('region')
        ? (t.region || fallbackRegion || sourceFact.region || '').trim() || undefined
        : existingTarget.region,
      imageCaption: reqSet.has('imageCaption')
        ? t.imageCaption?.trim() || undefined
        : existingTarget.imageCaption,
      isCustom: true,
      updatedAt: Date.now(),
    };

    await saveFactToCloud(mergedFact, targetLanguage);
    return {
      fact: mergedFact,
      notesExcluded,
      notesMismatchSubject,
    };
  }

  // Strictly preserve ALL original image URLs and gallery ordering for full translation
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

  const resolvedCentury = normalizeCentury(t.century || sourceFact.century);

  const resolvedAdditionalNotes = notesExcluded
    ? undefined
    : t.additionalNotes?.trim()
    ? t.additionalNotes.trim()
    : undefined;

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
    name: (t.name || sourceFact.name).trim(),
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
      const message = formatTranslationError(err, 'en');
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
      if (err instanceof TranslationApiError && err.isTemporarilyUnavailable) {
        await new Promise((r) => setTimeout(r, 2200));
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

const FIELD_LABELS: Record<TranslatableFactField, { ku: string; en: string }> = {
  name: { ku: 'ناونیشان', en: 'Title' },
  desc: { ku: 'پوختە', en: 'Summary' },
  fullText: { ku: 'درێژە', en: 'Full Text' },
  additionalNotes: { ku: 'تێبینی زیاتر', en: 'Additional Notes' },
  eraName: { ku: 'ناوی سەردەم', en: 'Era Name' },
  eraPeriod: { ku: 'ماوەی سەردەم', en: 'Era Period' },
  year: { ku: 'ساڵ / مێژوو', en: 'Year / Date' },
  century: { ku: 'سەدە', en: 'Century' },
  region: { ku: 'ناوچە و پارێزگا', en: 'Region / Province' },
  imageCaption: { ku: 'زانیاری وێنەی سەرەکی', en: 'Primary Image Caption' },
  imagesCaptions: { ku: 'زانیاری وێنەکان', en: 'Gallery Captions' },
};

function didGalleryCaptionsTextChange(
  prevImages: FactItem['images'],
  nextImages: FactItem['images']
): boolean {
  const prevList = Array.isArray(prevImages) ? prevImages : [];
  const nextList = Array.isArray(nextImages) ? nextImages : [];
  const prevCapByUrl = new Map<string, string>();
  for (const img of prevList) {
    if (img?.url) {
      prevCapByUrl.set(normStr(img.url), normStr(img.caption));
    }
  }
  const nextCapByUrl = new Map<string, string>();
  for (const img of nextList) {
    if (img?.url) {
      nextCapByUrl.set(normStr(img.url), normStr(img.caption));
    }
  }

  for (const [url, nextCap] of nextCapByUrl.entries()) {
    const prevCap = prevCapByUrl.get(url) ?? '';
    if (nextCap !== prevCap) return true;
  }
  for (const [url, prevCap] of prevCapByUrl.entries()) {
    if (prevCap && !nextCapByUrl.has(url)) {
      return false; // Removing an image only removes its caption structurally; no AI translation needed
    }
  }
  return false;
}

/**
 * Computes the exact field-level diff between `prev` and `next` FactItem.
 * Distinguishes edits to `desc` (پوختە) / `fullText` (درێژە) from edits to any other field
 * so minor edits (name, region, year, notes, captions, etc.) only sync those specific fields.
 */
export function getFactFieldDiff(
  prev: FactItem | null | undefined,
  next: FactItem
): FactFieldDiff {
  if (!prev) {
    const allFields: TranslatableFactField[] = [
      'name',
      'desc',
      'fullText',
      'additionalNotes',
      'eraName',
      'eraPeriod',
      'year',
      'century',
      'region',
      'imageCaption',
      'imagesCaptions',
    ];
    return {
      changedTextFields: allFields,
      hasSummaryOrFullTextChange: true,
      hasStructureChange: true,
      changedLabelsKu: allFields.map((f) => FIELD_LABELS[f].ku),
      changedLabelsEn: allFields.map((f) => FIELD_LABELS[f].en),
    };
  }

  const changedTextFields: TranslatableFactField[] = [];
  if (normStr(prev.name) !== normStr(next.name)) changedTextFields.push('name');
  if (normStr(prev.desc) !== normStr(next.desc)) changedTextFields.push('desc');
  if (normStr(prev.fullText) !== normStr(next.fullText)) changedTextFields.push('fullText');
  if (normStr(prev.additionalNotes) !== normStr(next.additionalNotes)) {
    changedTextFields.push('additionalNotes');
  }
  if (normStr(prev.eraName) !== normStr(next.eraName)) changedTextFields.push('eraName');
  if (normStr(prev.eraPeriod) !== normStr(next.eraPeriod)) changedTextFields.push('eraPeriod');
  if (normStr(prev.year) !== normStr(next.year)) changedTextFields.push('year');
  if (normStr(prev.century) !== normStr(next.century)) changedTextFields.push('century');
  if (normStr(prev.region) !== normStr(next.region)) changedTextFields.push('region');
  if (normStr(prev.imageCaption) !== normStr(next.imageCaption)) {
    changedTextFields.push('imageCaption');
  }
  if (didGalleryCaptionsTextChange(prev.images, next.images)) {
    changedTextFields.push('imagesCaptions');
  }

  const changedLabelsKu = changedTextFields.map((f) => FIELD_LABELS[f].ku);
  const changedLabelsEn = changedTextFields.map((f) => FIELD_LABELS[f].en);

  // Append human-readable labels for non-text structural edits when shown alongside text changes
  if (prev.lat !== next.lat || prev.lng !== next.lng || prev.zoom !== next.zoom) {
    changedLabelsKu.push('شوێن لەسەر نەخشە');
    changedLabelsEn.push('Map Coordinates');
  }
  if (
    normStr(prev.imageUrl) !== normStr(next.imageUrl) ||
    stableJson((prev.images || []).map((i) => normStr(i.url))) !==
      stableJson((next.images || []).map((i) => normStr(i.url)))
  ) {
    changedLabelsKu.push('وێنەکان');
    changedLabelsEn.push('Images');
  }
  if (prev.category !== next.category || prev.collectionId !== next.collectionId) {
    changedLabelsKu.push('پۆلێن');
    changedLabelsEn.push('Category');
  }
  if (
    prev.territoryColor !== next.territoryColor ||
    stableJson(prev.territoryPolygon) !== stableJson(next.territoryPolygon)
  ) {
    changedLabelsKu.push('سنووری دەسەڵات');
    changedLabelsEn.push('Territory Boundary');
  }

  const hasSummaryOrFullTextChange =
    changedTextFields.includes('desc') || changedTextFields.includes('fullText');
  const hasStructureChange = hasFactStructureChanged(prev, next);

  return {
    changedTextFields,
    hasSummaryOrFullTextChange,
    hasStructureChange,
    changedLabelsKu,
    changedLabelsEn,
  };
}

/**
 * Returns true if any human-language textual field changed between `prev` and `next`.
 * Used to avoid wasting AI quota when only coordinates, images, dates, polygons, or relations changed.
 */
export function hasFactTextChanged(
  prev: FactItem | null | undefined,
  next: FactItem
): boolean {
  return getFactFieldDiff(prev, next).changedTextFields.length > 0;
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
 * Translates a CollectionItem into the target language ('en' or 'ckb') via /api/translate-collection,
 * falling back safely to existing text if AI is offline or quota is reached.
 */
export async function translateCollectionToLanguage(
  col: CollectionItem,
  targetLanguage: AppLanguage,
  forceRetranslate = false
): Promise<CollectionItem> {
  if (targetLanguage === 'en' && !forceRetranslate && col.nameEn && col.nameEn.trim()) {
    return {
      ...col,
      name: col.nameEn.trim(),
      description: (col.descriptionEn || col.description || '').trim() || undefined,
    };
  }

  try {
    const sourceName = targetLanguage === 'ckb' ? col.nameEn || col.name : col.name;
    const sourceDesc =
      targetLanguage === 'ckb' ? col.descriptionEn || col.description || '' : col.description || '';

    const response = await fetch('/api/translate-collection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: sourceName,
        description: sourceDesc,
        targetLanguage,
      }),
    });
    if (response.ok) {
      const data = (await response.json()) as {
        translated?: { name?: string; description?: string };
      };
      const translatedName = data?.translated?.name?.trim();
      const translatedDesc = data?.translated?.description?.trim();
      if (translatedName) {
        if (targetLanguage === 'en') {
          return {
            ...col,
            name: translatedName,
            nameEn: translatedName,
            description: translatedDesc || col.description,
            descriptionEn: translatedDesc || col.descriptionEn,
          };
        }
        return {
          ...col,
          name: translatedName,
          nameEn: col.nameEn || sourceName,
          description: translatedDesc || col.description,
          descriptionEn: col.descriptionEn || sourceDesc || undefined,
        };
      }
    }
  } catch {
    // Fallback below
  }

  if (targetLanguage === 'en') {
    return {
      ...col,
      name: col.nameEn || col.name,
      nameEn: col.nameEn || col.name,
      description: col.descriptionEn || col.description,
      descriptionEn: col.descriptionEn || col.description,
    };
  }
  return {
    ...col,
    name: col.name,
    nameEn: col.nameEn || col.name,
    description: col.description,
    descriptionEn: col.descriptionEn || col.description,
  };
}

export async function translateCollectionToEnglish(
  col: CollectionItem
): Promise<CollectionItem> {
  return translateCollectionToLanguage(col, 'en');
}
