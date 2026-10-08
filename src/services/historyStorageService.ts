import { ALL_FACTS, FactItem } from '../data/kurdishHistoryData';
import { CollectionItem, DEFAULT_COLLECTIONS, ADMIN_SECRET_CODE } from '../types/history';
import { inferCenturyAndYearForFact } from '../utils/centuryUtils';

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
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COLLECTIONS);
    if (!raw) return DEFAULT_COLLECTIONS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to load collections from storage:', e);
  }
  return DEFAULT_COLLECTIONS;
}

export function saveStoredCollections(collections: CollectionItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections));
  } catch (e) {
    console.error('Failed to save collections to storage:', e);
  }
}

export function sanitizeFact(fact: any): FactItem {
  const latNum = Number(fact?.lat);
  const lngNum = Number(fact?.lng);
  const dateInfo = inferCenturyAndYearForFact(fact);

  return {
    ...fact,
    lat: Number.isFinite(latNum) && latNum >= -90 && latNum <= 90 ? latNum : 36.8,
    lng: Number.isFinite(lngNum) && lngNum >= -180 && lngNum <= 180 ? lngNum : 44.5,
    collectionId: fact?.collectionId || inferCollectionForFact(fact),
    year: fact?.year || dateInfo.year,
    century: fact?.century || dateInfo.century,
    centuryNumber: typeof fact?.centuryNumber === 'number' ? fact.centuryNumber : dateInfo.centuryNumber,
  };
}

export function loadStoredFacts(): FactItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FACTS);
    if (!raw) {
      // Return default facts enriched with default inferred collectionId
      return ALL_FACTS.map(sanitizeFact);
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map(sanitizeFact);
    }
  } catch (e) {
    console.warn('Failed to load facts from storage:', e);
  }

  return ALL_FACTS.map(sanitizeFact);
}

export function saveStoredFacts(facts: FactItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FACTS, JSON.stringify(facts));
  } catch (e) {
    console.error('Failed to save facts to storage:', e);
  }
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
