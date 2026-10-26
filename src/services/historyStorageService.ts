import { ALL_FACTS, FactItem } from '../data/kurdishHistoryData';
import { KURDISH_PROVINCES_CITIES } from '../data/kurdishProvincesData';
import {
  CollectionItem,
  DEFAULT_COLLECTIONS,
  UNIFIED_CATEGORIES,
  getCategoryInfo,
  ADMIN_SECRET_CODE,
} from '../types/history';
import { inferCenturyAndYearForFact } from '../utils/centuryUtils';
import { resolveImageUrl } from '../utils/imageUtils';

const STORAGE_KEYS = {
  FACTS: 'kurdish_history_facts_v1',
  COLLECTIONS: 'kurdish_history_collections_v1',
  ADMIN_ACTIVE: 'kurdish_history_admin_active_v1',
};

// Helper: infer initial collection for default facts
export function inferCollectionForFact(fact: FactItem): string {
  if (fact.collectionId) return fact.collectionId;

  const n = fact.name.toLowerCase();
  const d = fact.desc.toLowerCase();
  const t = fact.fullText.toLowerCase();

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

  // Default to powers / principalities
  return 'powers';
}

export function loadStoredCollections(): CollectionItem[] {
  return UNIFIED_CATEGORIES;
}

export function saveStoredCollections(collections: CollectionItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections));
  } catch (e) {
    console.warn('LocalStorage notice for collections storage:', e);
  }
}

export function sanitizeFact(fact: any): FactItem {
  const latNum = Number(fact?.lat);
  const lngNum = Number(fact?.lng);
  const dateInfo = inferCenturyAndYearForFact(fact);
  const cat = getCategoryInfo(fact);

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
      // Drop bulky inline base64 images so Firestore quota is fully protected
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
  // Remove Hasakah and Rojava province stations as requested by user
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
  // Filter out any standalone city names that were added as modern cities or provincial station points
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

export function loadStoredFacts(): FactItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FACTS);
    if (!raw) {
      return ALL_FACTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Filter out city facts / stations
      const cleaned = parsed
        .filter((f) => f && typeof f.id === 'number' && !isCityFact(f))
        .map((f) => sanitizeFact(f));

      const map = new Map<number, FactItem>();
      // Ensure all 350 historical facts exist as baseline
      ALL_FACTS.forEach((fact) => map.set(fact.id, fact));
      cleaned.forEach((f) => map.set(f.id, f));
      const merged = Array.from(map.values());

      return merged;
    }
  } catch (e) {
    console.warn('Failed to load facts from storage:', e);
  }

  return ALL_FACTS;
}

function sanitizeFactForLocalStorage(fact: FactItem): FactItem {
  // Preserve image fields reliably
  return fact;
}

export function saveStoredFacts(facts: FactItem[]): void {
  try {
    const safeFacts = facts.map(sanitizeFactForLocalStorage);
    localStorage.setItem(STORAGE_KEYS.FACTS, JSON.stringify(safeFacts));
  } catch (e: any) {
    // If browser localStorage quota is reached, store essential fields including images
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
        parentFactId: f.parentFactId,
        relatedFactIds: f.relatedFactIds,
        imageUrl: f.imageUrl,
        imageCaption: f.imageCaption,
      }));
      localStorage.setItem(STORAGE_KEYS.FACTS, JSON.stringify(compactFacts));
    } catch {
      try {
        localStorage.removeItem(STORAGE_KEYS.FACTS);
      } catch {}
    }
  }
}

export function saveSingleFact(fact: FactItem): FactItem[] {
  const local = loadStoredFacts();
  const sanitized = sanitizeFact(fact);
  const exists = local.some((f) => f.id === sanitized.id);
  const updated = exists
    ? local.map((f) => (f.id === sanitized.id ? sanitized : f))
    : [sanitized, ...local];
  saveStoredFacts(updated);
  return updated;
}

export function deleteSingleFact(factId: number): FactItem[] {
  const local = loadStoredFacts();
  const updated = local.filter((f) => f.id !== factId);
  saveStoredFacts(updated);
  return updated;
}

export function saveFactNotesLocally(factId: number, notes: string): FactItem[] {
  const local = loadStoredFacts();
  const updated = local.map((f) => (f.id === factId ? { ...f, additionalNotes: notes } : f));
  saveStoredFacts(updated);
  return updated;
}

export function updateFactRelationsLocally(
  factId: number,
  relatedFactIds: number[],
  parentFactId?: number
): FactItem[] {
  const local = loadStoredFacts();
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
  saveStoredFacts(updated);
  return updated;
}

export function saveSingleCollection(col: CollectionItem): CollectionItem[] {
  const cols = loadStoredCollections();
  const exists = cols.some((c) => c.id === col.id);
  const updated = exists
    ? cols.map((c) => (c.id === col.id ? col : c))
    : [...cols, col];
  saveStoredCollections(updated);
  return updated;
}

export function deleteSingleCollection(colId: string): CollectionItem[] {
  const cols = loadStoredCollections();
  const updated = cols.filter((c) => c.id !== colId);
  saveStoredCollections(updated);
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
