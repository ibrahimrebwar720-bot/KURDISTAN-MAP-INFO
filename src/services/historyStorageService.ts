import { ALL_FACTS, FactItem } from '../data/kurdishHistoryData';
import {
  CollectionItem,
  getUnifiedCategories,
  getCategoryInfo,
  ADMIN_SECRET_CODE,
  PhotoSubmission,
} from '../types/history';
import { inferCenturyAndYearForFact } from '../utils/centuryUtils';
import { resolveImageUrl } from '../utils/imageUtils';
import type { AppLanguage } from '../context/LanguageContext';

const STORAGE_KEYS = {
  FACTS: 'kurdish_history_facts_v1',
  FACTS_EN: 'kurdish_history_facts_en_v1',
  COLLECTIONS: 'kurdish_history_collections_v1',
  COLLECTIONS_EN: 'kurdish_history_collections_en_v1',
  ADMIN_ACTIVE: 'kurdish_history_admin_active_v1',
  PHOTO_SUBMISSIONS: 'kurdish_history_photo_submissions_v1',
};

function getFactsStorageKey(lang: AppLanguage = 'ckb'): string {
  return lang === 'en' ? STORAGE_KEYS.FACTS_EN : STORAGE_KEYS.FACTS;
}

function getCollectionsStorageKey(lang: AppLanguage = 'ckb'): string {
  return lang === 'en' ? STORAGE_KEYS.COLLECTIONS_EN : STORAGE_KEYS.COLLECTIONS;
}

// Helper: infer initial collection for default facts
export function inferCollectionForFact(fact: FactItem): string {
  if (fact.collectionId) return fact.collectionId;

  const n = fact.name.toLowerCase();
  const d = fact.desc.toLowerCase();

  if (
    fact.tag === 'leader' ||
    n.includes('سەرکردە') ||
    n.includes('فەرماندە') ||
    n.includes('پێشەوا') ||
    n.includes('ڕابەر') ||
    n.includes('قازی محەمەد') ||
    n.includes('شێخ مەحموود') ||
    n.includes('شێخ مەحمود') ||
    n.includes('مستەفا بارزانی') ||
    n.includes('شێخ سەعید') ||
    n.includes('سەید ڕەزا') ||
    n.includes('ئیحسان نوری') ||
    n.includes('سمکۆ') ||
    n.includes('شێخ عوبەیدوڵڵا')
  ) {
    return 'leader';
  }

  if (
    n.includes('پاشا') ||
    n.includes('ئەتابەگ') ||
    n.includes('سوڵتان') ||
    n.includes('میر') ||
    n.includes('مەلیک') ||
    n.includes('خان') ||
    n.includes('شاخ') ||
    n.includes('خوسرەو') ||
    n.includes('سەردار')
  ) {
    return 'rulers';
  }

  if (
    fact.tag === 'minister' ||
    n.includes('وەزیر') ||
    n.includes('وزیر') ||
    n.includes('ڕاوێژکار') ||
    d.includes('وەزیر')
  ) {
    return 'ministers';
  }

  if (
    fact.tag === 'official' ||
    n.includes('کاربەدەست') ||
    n.includes('دەستەڵاتدار') ||
    n.includes('فەرمانڕەوا') ||
    n.includes('والی') ||
    n.includes('حاکم') ||
    n.includes('سەردار')
  ) {
    return 'officials';
  }

  if (
    fact.tag === 'scholar' ||
    n.includes('زانا') ||
    n.includes('فەیلەسوف') ||
    n.includes('شاعیر') ||
    n.includes('مێژوونووس') ||
    n.includes('ئەحمەدی خانی') ||
    n.includes('مەلای جزیری') ||
    n.includes('شەرەفخان') ||
    n.includes('دینەوەری') ||
    n.includes('ئیبن ئەسیری') ||
    n.includes('زەریاب') ||
    n.includes('مەستوورە')
  ) {
    return 'scholars';
  }

  if (
    fact.tag === 'figure' ||
    n.includes('شێخ') ||
    n.includes('پێشەوا') ||
    n.includes('سەڵاحەدین') ||
    n.includes('ڕابەر') ||
    n.includes('قازی')
  ) {
    return 'figures';
  }

  if (
    fact.tag === 'capital' ||
    n.includes('قەڵا') ||
    n.includes('پایتەخت') ||
    n.includes('شوێنەوار') ||
    n.includes('تەپە') ||
    n.includes('ئەشکەوت') ||
    n.includes('شار') ||
    n.includes('چۆغا')
  ) {
    return 'monuments';
  }

  if (
    fact.tag === 'battle' ||
    n.includes('جەنگ') ||
    n.includes('شەڕ') ||
    n.includes('پەیماننامە') ||
    n.includes('شۆڕش') ||
    d.includes('شەڕ')
  ) {
    return 'battles';
  }

  return 'powers';
}

export function loadStoredCollections(lang: AppLanguage = 'ckb'): CollectionItem[] {
  const base = getUnifiedCategories(lang);
  try {
    const raw = localStorage.getItem(getCollectionsStorageKey(lang));
    if (!raw) return base;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const map = new Map<string, CollectionItem>();
      base.forEach((b) => map.set(b.id, b));
      parsed.forEach((p: CollectionItem) => {
        if (p && typeof p.id === 'string') {
          if (map.has(p.id)) {
            const orig = map.get(p.id)!;
            map.set(p.id, {
              ...orig,
              ...p,
              name: lang === 'en' ? p.nameEn || p.name || orig.name : p.name || orig.name,
            });
          } else {
            map.set(p.id, p);
          }
        }
      });
      return Array.from(map.values());
    }
  } catch {
    // ignore storage read error
  }
  return base;
}

export function saveStoredCollections(collections: CollectionItem[], lang: AppLanguage = 'ckb'): void {
  try {
    localStorage.setItem(getCollectionsStorageKey(lang), JSON.stringify(collections));
  } catch (e) {
    console.warn('LocalStorage notice for collections storage:', e);
  }
}

export function sanitizeFact(fact: any, lang: AppLanguage = 'ckb'): FactItem {
  const latNum = Number(fact?.lat);
  const lngNum = Number(fact?.lng);
  const dateInfo = inferCenturyAndYearForFact(fact, lang);
  const cat = getCategoryInfo(fact, lang);

  return {
    ...fact,
    lat: Number.isFinite(latNum) && latNum >= -90 && latNum <= 90 ? latNum : 36.8,
    lng: Number.isFinite(lngNum) && lngNum >= -180 && lngNum <= 180 ? lngNum : 44.5,
    category: cat.id,
    tag: cat.id,
    collectionId: cat.id,
    year: fact?.year || dateInfo.year,
    century: fact?.century || dateInfo.century,
    centuryNumber: typeof fact?.centuryNumber === 'number' ? fact.centuryNumber : dateInfo.centuryNumber,
    imageUrl: (() => {
      if (typeof fact?.imageUrl !== 'string' || !fact.imageUrl.trim()) return undefined;
      const trimmed = fact.imageUrl.trim();
      if (trimmed.startsWith('data:')) return undefined;
      const resolved = resolveImageUrl(trimmed);
      return resolved || undefined;
    })(),
    imageCaption: typeof fact?.imageCaption === 'string' && fact.imageCaption.trim() ? fact.imageCaption.trim() : undefined,
    images: (() => {
      if (!Array.isArray(fact?.images)) return undefined;
      const validImages: Array<{ url: string; caption?: string }> = [];
      fact.images.forEach((img: any) => {
        if (!img) return;
        const rawUrl = typeof img === 'string' ? img : img.url;
        const caption = typeof img === 'object' && typeof img.caption === 'string' ? img.caption.trim() : undefined;
        if (typeof rawUrl === 'string' && rawUrl.trim() && !rawUrl.trim().startsWith('data:')) {
          const resolved = resolveImageUrl(rawUrl.trim());
          if (resolved) {
            validImages.push({
              url: resolved,
              caption: caption || undefined,
            });
          }
        }
      });
      return validImages.length > 0 ? validImages.slice(0, 10) : undefined;
    })(),
  };
}

export function isCityFact(fact: Partial<FactItem>): boolean {
  if (!fact) return false;
  if (fact.eraName === 'شارەکانی کوردستان') return true;
  if (typeof fact.id === 'number' && fact.id >= 1001 && fact.id <= 1050) return true;
  if (typeof fact.id === 'number' && fact.id >= 901 && fact.id <= 904) return true;
  const n = (fact.name || '').trim();
  if (
    n.includes('حەسەکە') ||
    n.includes('گرێ سپی') ||
    (n.includes('ڕۆژئاوای کوردستان') && !n.includes('هۆرییەکان')) ||
    (n.includes('ڕۆژاوای کوردستان') && !n.includes('هۆرییەکان'))
  ) {
    return true;
  }
  if (
    n.startsWith('شاری ') &&
    !n.includes('ماد') &&
    !n.includes('میتانی') &&
    !n.includes('دینەوەر') &&
    !n.includes('ئاراپخا') &&
    !n.includes('توشپا') &&
    !n.includes('واشۆکانی') &&
    !n.includes('نوزی')
  ) {
    return true;
  }
  return false;
}

export function loadStoredFacts(lang: AppLanguage = 'ckb'): FactItem[] {
  const key = getFactsStorageKey(lang);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return lang === 'en' ? [] : ALL_FACTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      if (lang === 'en') {
        return parsed
          .filter((f) => f && typeof f.id === 'number')
          .map((f) => sanitizeFact(f, 'en'));
      }

      if (parsed.length > 0) {
        const cleaned = parsed
          .filter((f) => f && typeof f.id === 'number' && !isCityFact(f))
          .map((f) => sanitizeFact(f, 'ckb'));

        const map = new Map<number, FactItem>();
        ALL_FACTS.forEach((fact) => map.set(fact.id, fact));
        cleaned.forEach((f) => map.set(f.id, f));
        return Array.from(map.values());
      }
    }
  } catch (e) {
    console.warn('Failed to load facts from storage:', e);
  }

  return lang === 'en' ? [] : ALL_FACTS;
}

function sanitizeFactForLocalStorage(fact: FactItem): FactItem {
  return fact;
}

export function saveStoredFacts(facts: FactItem[], lang: AppLanguage = 'ckb'): void {
  const key = getFactsStorageKey(lang);
  try {
    const safeFacts = facts.map(sanitizeFactForLocalStorage);
    localStorage.setItem(key, JSON.stringify(safeFacts));
  } catch {
    try {
      const compactFacts = facts.map((f) => ({
        id: f.id,
        num: f.num,
        name: f.name,
        lat: f.lat,
        lng: f.lng,
        category: f.category,
        tag: f.tag,
        collectionId: f.collectionId,
        startYear: f.startYear,
        endYear: f.endYear,
        year: f.year,
        century: f.century,
        centuryNumber: f.centuryNumber,
        desc: (f.desc || '').slice(0, 160),
        region: f.region,
        provinceId: f.provinceId,
        parentFactId: f.parentFactId,
        relatedFactIds: f.relatedFactIds,
        imageUrl: f.imageUrl,
        imageCaption: f.imageCaption,
      }));
      localStorage.setItem(key, JSON.stringify(compactFacts));
    } catch {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
    }
  }
}

export function saveSingleFact(fact: FactItem, lang: AppLanguage = 'ckb'): FactItem[] {
  const local = loadStoredFacts(lang);
  const sanitized = sanitizeFact(fact, lang);
  const exists = local.some((f) => f.id === sanitized.id);
  const updated = exists
    ? local.map((f) => (f.id === sanitized.id ? sanitized : f))
    : [sanitized, ...local];
  saveStoredFacts(updated, lang);
  return updated;
}

export function deleteSingleFact(factId: number, lang: AppLanguage = 'ckb'): FactItem[] {
  const local = loadStoredFacts(lang);
  const updated = local.filter((f) => f.id !== factId);
  saveStoredFacts(updated, lang);
  return updated;
}

export function saveFactNotesLocally(factId: number, notes: string, lang: AppLanguage = 'ckb'): FactItem[] {
  const local = loadStoredFacts(lang);
  const updated = local.map((f) => (f.id === factId ? { ...f, additionalNotes: notes } : f));
  saveStoredFacts(updated, lang);
  return updated;
}

export function updateFactRelationsLocally(
  factId: number,
  relatedFactIds: number[],
  parentFactId?: number,
  lang: AppLanguage = 'ckb'
): FactItem[] {
  const local = loadStoredFacts(lang);
  const updated = local.map((f) => {
    if (f.id === factId) {
      return {
        ...f,
        relatedFactIds,
        ...(typeof parentFactId === 'number' ? { parentFactId } : {}),
      };
    }
    return f;
  });
  saveStoredFacts(updated, lang);
  return updated;
}

export function saveSingleCollection(col: CollectionItem, lang: AppLanguage = 'ckb'): CollectionItem[] {
  const cols = loadStoredCollections(lang);
  const exists = cols.some((c) => c.id === col.id);
  const updated = exists
    ? cols.map((c) => (c.id === col.id ? col : c))
    : [...cols, col];
  saveStoredCollections(updated, lang);
  return updated;
}

export function deleteSingleCollection(colId: string, lang: AppLanguage = 'ckb'): CollectionItem[] {
  const cols = loadStoredCollections(lang);
  const updated = cols.filter((c) => c.id !== colId);
  saveStoredCollections(updated, lang);
  return updated;
}

export function getAdminState(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEYS.ADMIN_ACTIVE) === 'true';
  } catch {
    return false;
  }
}

export function setAdminState(active: boolean): void {
  try {
    if (active) {
      sessionStorage.setItem(STORAGE_KEYS.ADMIN_ACTIVE, 'true');
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.ADMIN_ACTIVE);
    }
  } catch (e) {
    console.error('Failed to set admin state:', e);
  }
}

export function verifyAdminCode(code: string): boolean {
  return code.trim() === ADMIN_SECRET_CODE;
}

export function loadStoredSubmissions(): PhotoSubmission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PHOTO_SUBMISSIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredSubmissions(submissions: PhotoSubmission[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PHOTO_SUBMISSIONS, JSON.stringify(submissions));
  } catch (err) {
    console.warn('Failed to save photo submissions to localStorage:', err);
  }
}
