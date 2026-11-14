import { AppLanguage } from '../context/LanguageContext';
import { FactItem } from '../data/kurdishHistoryData';
import { getProvinceById, matchFactToProvince } from '../data/kurdishProvincesData';
import { formatYearRange } from '../utils/yearUtils';
import { saveFactToCloud } from './firestoreHistoryService';

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
    try {
      const errJson = await response.json();
      if (errJson?.error) errorMessage = String(errJson.error);
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMessage);
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
}

/**
 * Batch-translates an array of Kurdish FactItems into English sequentially (avoiding rate spikes)
 * and persists each translated item immediately into Firestore `facts_en`.
 */
export async function translateFactsBatchToEnglish(
  sourceFacts: FactItem[],
  onProgress?: (progress: BatchTranslateProgress) => void,
  shouldStop?: () => boolean
): Promise<BatchTranslateProgress> {
  const succeeded: FactItem[] = [];
  const failed: Array<{ id: number; name: string; error: string }> = [];
  let notesExcludedCount = 0;
  const total = sourceFacts.length;

  for (let i = 0; i < total; i++) {
    if (shouldStop && shouldStop()) break;
    const fact = sourceFacts[i];
    onProgress?.({
      completed: i,
      total,
      currentName: fact.name,
      succeeded: [...succeeded],
      failed: [...failed],
      notesExcludedCount,
    });
    try {
      const outcome = await translateFactToEnglishDetailed(fact);
      succeeded.push(outcome.fact);
      if (outcome.notesExcluded) {
        notesExcludedCount += 1;
      }
    } catch (err) {
      failed.push({
        id: fact.id,
        name: fact.name,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const finalState: BatchTranslateProgress = {
    completed: succeeded.length + failed.length,
    total,
    currentName: '',
    succeeded,
    failed,
    notesExcludedCount,
  };
  onProgress?.(finalState);
  return finalState;
}
