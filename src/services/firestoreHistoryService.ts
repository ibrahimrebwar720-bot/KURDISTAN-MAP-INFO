import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  deleteField,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { ALL_FACTS, FactItem } from '../data/kurdishHistoryData';
import { STATIC_ENGLISH_FACTS } from '../data/kurdishHistoryDataEn';
import { KURDISH_PROVINCES_CITIES } from '../data/kurdishProvincesData';
import { CollectionItem, getUnifiedCategories, PhotoSubmission } from '../types/history';
import {
  loadStoredFacts,
  saveStoredFacts,
  loadStoredCollections,
  saveStoredCollections,
  sanitizeFact,
  isCityFact,
  loadStoredSubmissions,
  saveStoredSubmissions,
} from './historyStorageService';
import { resolveImageUrl } from '../utils/imageUtils';
import type { AppLanguage } from '../context/LanguageContext';

const PHOTO_SUBMISSIONS_COLLECTION = 'photo_submissions';

function getFactsCollectionName(lang: AppLanguage = 'ckb'): string {
  return lang === 'en' ? 'facts_en' : 'facts';
}

function getCollectionsCollectionName(lang: AppLanguage = 'ckb'): string {
  return lang === 'en' ? 'collections_en' : 'collections';
}

// Helper: Merge Firestore facts with ALL_FACTS baseline (Kurdish mode ONLY)
function mergeFactsWithCloud(cloudFacts: FactItem[]): FactItem[] {
  const map = new Map<number, FactItem>();
  ALL_FACTS.forEach((fact) => {
    if (!isCityFact(fact)) {
      map.set(fact.id, fact);
    }
  });
  KURDISH_PROVINCES_CITIES.forEach((city: FactItem) => {
    if (!isCityFact(city)) {
      map.set(city.id, city);
    }
  });
  cloudFacts.forEach((cf) => {
    if (cf && typeof cf.id === 'number' && !isCityFact(cf)) {
      map.set(cf.id, sanitizeFact(cf, 'ckb'));
    }
  });

  return Array.from(map.values());
}

// Helper: Merge Firestore English facts with optional STATIC_ENGLISH_FACTS baseline (English mode ONLY)
function mergeEnglishFactsWithCloud(cloudFacts: FactItem[]): FactItem[] {
  const map = new Map<number, FactItem>();
  STATIC_ENGLISH_FACTS.forEach((fact) => {
    if (fact && typeof fact.id === 'number') {
      map.set(fact.id, sanitizeFact(fact, 'en'));
    }
  });
  cloudFacts.forEach((cf) => {
    if (cf && typeof cf.id === 'number') {
      map.set(cf.id, sanitizeFact(cf, 'en'));
    }
  });
  return Array.from(map.values()).sort((a, b) => (a.num || a.id) - (b.num || b.id));
}

// Helper: Merge Firestore collections with localized default collections
function mergeCollectionsWithCloud(
  cloudCols: CollectionItem[],
  lang: AppLanguage = 'ckb'
): CollectionItem[] {
  const cloudMap = new Map<string, CollectionItem>();
  cloudCols.forEach((c) => cloudMap.set(c.id, c));

  const defaults = getUnifiedCategories(lang);
  const baseMerged = defaults.map((bc) => {
    if (cloudMap.has(bc.id)) {
      const updated = cloudMap.get(bc.id)!;
      cloudMap.delete(bc.id);
      return {
        ...bc,
        ...updated,
        name: lang === 'en' ? updated.nameEn || updated.name || bc.name : updated.name || bc.name,
      };
    }
    return bc;
  });

  const customAdditions = Array.from(cloudMap.values());
  return [...baseMerged, ...customAdditions];
}

/**
 * Load all Kurdish Sorani facts (cloud merged with ALL_FACTS) so Admin can browse & AI-translate
 * Kurdish topics into English even when viewing English mode.
 */
export async function loadKurdishFactsFromCloud(): Promise<FactItem[]> {
  try {
    const colRef = collection(db, 'facts');
    const snap = await getDocs(colRef);
    const cloudList: FactItem[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && typeof data.id === 'number') {
        const item = data as FactItem;
        if (!isCityFact(item)) {
          cloudList.push(sanitizeFact(item, 'ckb'));
        }
      }
    });
    const merged = mergeFactsWithCloud(cloudList);
    saveStoredFacts(merged, 'ckb');
    return merged;
  } catch (err) {
    console.warn('Failed to load Kurdish facts from cloud, using cache:', err);
    return loadStoredFacts('ckb');
  }
}

/**
 * Load all English facts (`facts_en` merged with STATIC_ENGLISH_FACTS) for snapshot export and link integrity checks.
 */
export async function loadEnglishFactsFromCloud(): Promise<FactItem[]> {
  try {
    const colRef = collection(db, 'facts_en');
    const snap = await getDocs(colRef);
    const cloudList: FactItem[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && typeof data.id === 'number') {
        cloudList.push(sanitizeFact(data as FactItem, 'en'));
      }
    });
    const merged = mergeEnglishFactsWithCloud(cloudList);
    saveStoredFacts(merged, 'en');
    return merged;
  } catch (err) {
    console.warn('Failed to load English facts from cloud, using cache:', err);
    return loadStoredFacts('en');
  }
}

/**
 * Fetch a single fact from Firestore (or baseline) for a given language.
 */
export async function getFactFromCloud(
  factId: number,
  lang: AppLanguage = 'en'
): Promise<FactItem | null> {
  try {
    const docSnap = await getDoc(doc(db, getFactsCollectionName(lang), String(factId)));
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data && typeof data.id === 'number') {
        return sanitizeFact(data as FactItem, lang);
      }
    }
  } catch (err) {
    console.warn(`Failed to fetch fact ${factId} (${lang}) from cloud:`, err);
  }
  if (lang === 'en') {
    const staticMatch = STATIC_ENGLISH_FACTS.find((f) => f.id === factId);
    if (staticMatch) return sanitizeFact(staticMatch, 'en');
  } else {
    const baseline = [...ALL_FACTS, ...KURDISH_PROVINCES_CITIES].find((f) => f.id === factId);
    if (baseline) return sanitizeFact(baseline, 'ckb');
  }
  return null;
}

/**
 * Real-time subscription to the set of fact IDs that already exist in `facts_en`
 */
export function subscribeToTranslatedFactIds(
  onUpdate: (ids: Set<number>) => void
): () => void {
  try {
    const colRef = collection(db, 'facts_en');
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const ids = new Set<number>();
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && typeof data.id === 'number') {
            ids.add(data.id);
          } else {
            const parsedId = Number(docSnap.id);
            if (Number.isFinite(parsedId) && parsedId > 0) {
              ids.add(parsedId);
            }
          }
        });
        onUpdate(ids);
      },
      (error) => {
        console.warn('Realtime translated IDs sync error, using cached:', error);
        onUpdate(new Set(loadStoredFacts('en').map((f) => f.id)));
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Failed to attach translated IDs listener:', err);
    onUpdate(new Set(loadStoredFacts('en').map((f) => f.id)));
    return () => {};
  }
}

/**
 * Real-time subscription to cloud facts across all users worldwide (strictly separated per language)
 */
export function subscribeToCloudFacts(
  onUpdate: (facts: FactItem[]) => void,
  lang: AppLanguage = 'ckb'
): () => void {
  try {
    const colName = getFactsCollectionName(lang);
    const colRef = collection(db, colName);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const cloudList: FactItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && typeof data.id === 'number') {
            const item = data as FactItem;
            if (lang === 'ckb' && isCityFact(item)) {
              deleteDoc(docSnap.ref).catch(() => {});
            } else {
              cloudList.push(sanitizeFact(item, lang));
            }
          }
        });

        // CRITICAL: English mode (`facts_en`) is 100% independent from Kurdish `ALL_FACTS`, merged only with its own static snapshot
        const finalFacts =
          lang === 'en'
            ? mergeEnglishFactsWithCloud(cloudList)
            : mergeFactsWithCloud(cloudList);

        saveStoredFacts(finalFacts, lang);
        onUpdate(finalFacts);
      },
      (error) => {
        console.warn(`Realtime facts sync error (${lang}), using cached facts:`, error);
        onUpdate(loadStoredFacts(lang));
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn(`Failed to attach realtime facts listener (${lang}):`, err);
    onUpdate(loadStoredFacts(lang));
    return () => {};
  }
}

const REMOVABLE_OPTIONAL_FACT_FIELDS = [
  'additionalNotes',
  'region',
  'provinceId',
  'imageUrl',
  'imageCaption',
  'images',
  'parentFactId',
  'relatedFactIds',
  'allyFactIds',
  'endYear',
  'birthYear',
  'deathYear',
  'startCentury',
  'endCentury',
  'startCenturyBC',
  'endCenturyBC',
  'territoryPolygon',
  'territoryColor',
  'overlayImageUrl',
  'overlayBounds',
] as const;

function buildFirestoreFactPayload(sanitized: FactItem): Record<string, any> {
  const payload: Record<string, any> = {
    ...sanitized,
    updatedAt: Date.now(),
  };

  if (typeof payload.imageUrl === 'string') {
    if (payload.imageUrl.startsWith('data:')) {
      delete payload.imageUrl;
    } else {
      payload.imageUrl = resolveImageUrl(payload.imageUrl) || undefined;
    }
  }

  if (Array.isArray(sanitized.images) && sanitized.images.length > 0) {
    payload.images = sanitized.images.map((item) => {
      const cleanImg: Record<string, string> = { url: item.url };
      if (item.caption && item.caption.trim()) {
        cleanImg.caption = item.caption.trim();
      }
      return cleanImg;
    });
  } else {
    delete payload.images;
  }

  // Firestore forbids nested arrays — serialize coordinate pairs as flat { lat, lng } objects
  if (Array.isArray(sanitized.territoryPolygon) && sanitized.territoryPolygon.length > 0) {
    payload.territoryPolygon = sanitized.territoryPolygon.map(([lat, lng]) => ({ lat, lng }));
  } else {
    delete payload.territoryPolygon;
  }

  if (Array.isArray(sanitized.overlayBounds) && sanitized.overlayBounds.length >= 2) {
    payload.overlayBounds = sanitized.overlayBounds.map(([lat, lng]) => ({ lat, lng }));
  } else {
    delete payload.overlayBounds;
  }

  if (typeof payload.additionalNotes === 'string' && !payload.additionalNotes.trim()) {
    delete payload.additionalNotes;
  }
  if (typeof payload.region === 'string' && !payload.region.trim()) {
    delete payload.region;
  }

  for (const field of REMOVABLE_OPTIONAL_FACT_FIELDS) {
    if (payload[field] === undefined) {
      payload[field] = deleteField();
    }
  }

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  return payload;
}

/**
 * Save or update fact to Firestore cloud for the specified language collection
 */
export async function saveFactToCloud(fact: FactItem, lang: AppLanguage = 'ckb'): Promise<void> {
  const sanitized = sanitizeFact(fact, lang);

  if (typeof sanitized.imageUrl === 'string') {
    if (sanitized.imageUrl.startsWith('data:')) {
      delete (sanitized as any).imageUrl;
    } else {
      sanitized.imageUrl = resolveImageUrl(sanitized.imageUrl) || undefined;
    }
  }

  const colName = getFactsCollectionName(lang);
  const docRef = doc(db, colName, String(sanitized.id));
  const payload = buildFirestoreFactPayload(sanitized);

  try {
    await setDoc(docRef, payload, { merge: true });
  } catch (err) {
    console.error(`Firestore WRITE error at ${colName}/${sanitized.id}:`, err);
    throw err;
  }

  const local = loadStoredFacts(lang);
  const exists = local.some((f) => f.id === sanitized.id);
  const updated = exists
    ? local.map((f) => (f.id === sanitized.id ? sanitized : f))
    : [sanitized, ...local];
  saveStoredFacts(updated, lang);
}

/**
 * Delete a fact from Firestore cloud for the specified language collection only
 */
export async function deleteFactFromCloud(factId: number, lang: AppLanguage = 'ckb'): Promise<void> {
  const colName = getFactsCollectionName(lang);
  const docRef = doc(db, colName, String(factId));
  try {
    await deleteDoc(docRef);
  } catch (err) {
    console.error(`Firestore DELETE error at ${colName}/${factId}:`, err);
    throw err;
  }

  const local = loadStoredFacts(lang);
  const updated = local.filter((f) => f.id !== factId);
  saveStoredFacts(updated, lang);
}

/**
 * Save additional notes for a fact to Firestore
 */
export async function saveNotesToCloud(
  factId: number,
  notes: string,
  existingFact?: FactItem,
  lang: AppLanguage = 'ckb'
): Promise<void> {
  const colName = getFactsCollectionName(lang);
  const docRef = doc(db, colName, String(factId));
  const trimmedNotes = notes.trim();

  try {
    if (existingFact) {
      const sanitized = sanitizeFact(
        {
          ...existingFact,
          additionalNotes: trimmedNotes || undefined,
        },
        lang
      );
      await setDoc(docRef, buildFirestoreFactPayload(sanitized), { merge: true });
    } else {
      await setDoc(
        docRef,
        {
          id: factId,
          additionalNotes: trimmedNotes ? notes : deleteField(),
          updatedAt: Date.now(),
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.error(`Firestore WRITE error (notes) at ${colName}/${factId}:`, err);
    throw err;
  }

  const local = loadStoredFacts(lang);
  const updated = local.map((f) =>
    f.id === factId ? { ...f, additionalNotes: trimmedNotes ? notes : undefined } : f
  );
  saveStoredFacts(updated, lang);
}

/**
 * Update linked and parent facts in Firestore and local storage
 */
export async function updateFactRelationsInCloud(
  factId: number,
  relatedFactIds: number[],
  parentFactId?: number,
  allyFactIds?: number[],
  lang: AppLanguage = 'ckb'
): Promise<void> {
  const colName = getFactsCollectionName(lang);
  const docRef = doc(db, colName, String(factId));
  const payload: Record<string, any> = {
    relatedFactIds,
    parentFactId: typeof parentFactId === 'number' ? parentFactId : deleteField(),
    allyFactIds: Array.isArray(allyFactIds) ? allyFactIds : deleteField(),
    updatedAt: Date.now(),
  };

  try {
    await setDoc(docRef, payload, { merge: true });
  } catch (err) {
    console.error(`Firestore WRITE error (relations) at ${colName}/${factId}:`, err);
    throw err;
  }

  const local = loadStoredFacts(lang);
  const updated = local.map((f) => {
    if (f.id === factId) {
      const nextFact: FactItem = {
        ...f,
        relatedFactIds,
      };
      if (typeof parentFactId === 'number') {
        nextFact.parentFactId = parentFactId;
      } else {
        delete nextFact.parentFactId;
      }
      if (Array.isArray(allyFactIds)) {
        nextFact.allyFactIds = allyFactIds;
      } else {
        delete nextFact.allyFactIds;
      }
      return nextFact;
    }
    return f;
  });
  saveStoredFacts(updated, lang);
}

/**
 * Update a fact's coordinates (and optional provinceId) in Firestore and cascade the same
 * spatial coordinates to the counterpart language collection if present (without altering texts).
 */
export async function updateFactLocationInCloud(
  fact: FactItem,
  newLat: number,
  newLng: number,
  provinceId: string | undefined,
  lang: AppLanguage = 'ckb'
): Promise<FactItem> {
  const updatedFact: FactItem = {
    ...fact,
    lat: newLat,
    lng: newLng,
    ...(provinceId ? { provinceId } : {}),
    isCustom: true,
    updatedAt: Date.now(),
  };

  await saveFactToCloud(updatedFact, lang);

  const otherLang: AppLanguage = lang === 'ckb' ? 'en' : 'ckb';
  const otherColName = getFactsCollectionName(otherLang);
  const otherDocRef = doc(db, otherColName, String(fact.id));
  try {
    const snap = await getDoc(otherDocRef);
    if (snap.exists()) {
      await setDoc(
        otherDocRef,
        {
          lat: newLat,
          lng: newLng,
          ...(provinceId ? { provinceId } : {}),
          updatedAt: Date.now(),
        },
        { merge: true }
      );
      const otherLocal = loadStoredFacts(otherLang);
      if (otherLocal.some((f) => f.id === fact.id)) {
        saveStoredFacts(
          otherLocal.map((f) =>
            f.id === fact.id
              ? { ...f, lat: newLat, lng: newLng, ...(provinceId ? { provinceId } : {}) }
              : f
          ),
          otherLang
        );
      }
    }
  } catch (err) {
    console.warn(`Failed to sync dispersed coordinates to ${otherColName}/${fact.id}:`, err);
  }

  return updatedFact;
}

/**
 * Real-time subscription to cloud collections (strictly separated per language)
 */
export function subscribeToCloudCollections(
  onUpdate: (collections: CollectionItem[]) => void,
  lang: AppLanguage = 'ckb'
): () => void {
  try {
    const colRef = collection(db, getCollectionsCollectionName(lang));
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const cloudList: CollectionItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && typeof data.id === 'string') {
            cloudList.push(data as CollectionItem);
          }
        });

        const merged = mergeCollectionsWithCloud(cloudList, lang);
        saveStoredCollections(merged, lang);
        onUpdate(merged);
      },
      (error) => {
        console.warn(`Realtime collections sync error (${lang}), using cached:`, error);
        onUpdate(loadStoredCollections(lang));
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn(`Failed to attach realtime collections listener (${lang}):`, err);
    onUpdate(loadStoredCollections(lang));
    return () => {};
  }
}

/**
 * Save collection to Firestore cloud
 */
export async function saveCollectionToCloud(
  collectionItem: CollectionItem,
  lang: AppLanguage = 'ckb'
): Promise<void> {
  const docRef = doc(db, getCollectionsCollectionName(lang), collectionItem.id);
  const payload: Record<string, any> = {
    ...collectionItem,
    updatedAt: Date.now(),
  };
  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });
  await setDoc(docRef, payload, { merge: true });

  const local = loadStoredCollections(lang);
  const exists = local.some((c) => c.id === collectionItem.id);
  const updated = exists
    ? local.map((c) => (c.id === collectionItem.id ? collectionItem : c))
    : [...local, collectionItem];
  saveStoredCollections(updated, lang);
}

/**
 * Delete collection from Firestore cloud
 */
export async function deleteCollectionFromCloud(
  collectionId: string,
  lang: AppLanguage = 'ckb'
): Promise<void> {
  const docRef = doc(db, getCollectionsCollectionName(lang), collectionId);
  await deleteDoc(docRef);

  const local = loadStoredCollections(lang);
  const updated = local.filter((c) => c.id !== collectionId);
  saveStoredCollections(updated, lang);
}

/**
 * Submit user-suggested photo link for a historical fact
 */
export async function submitPhotoSuggestion(data: {
  factId: number;
  factName: string;
  imageUrl: string;
  senderName?: string;
  note?: string;
}): Promise<PhotoSubmission> {
  const cleanUrl = data.imageUrl.trim();
  if (!cleanUrl || cleanUrl.startsWith('data:')) {
    throw new Error('Please enter a valid web image URL, not a base64 file.');
  }

  const id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const resolvedUrl = resolveImageUrl(cleanUrl) || cleanUrl;

  const submission: PhotoSubmission = {
    id,
    factId: data.factId,
    factName: data.factName.trim(),
    imageUrl: resolvedUrl,
    status: 'pending',
    submittedAt: Date.now(),
    ...(data.senderName?.trim() ? { senderName: data.senderName.trim() } : {}),
    ...(data.note?.trim() ? { note: data.note.trim() } : {}),
  };

  const docRef = doc(db, PHOTO_SUBMISSIONS_COLLECTION, id);
  await setDoc(docRef, submission);

  const local = loadStoredSubmissions();
  saveStoredSubmissions([submission, ...local.filter((s) => s.id !== id)]);

  return submission;
}

/**
 * Real-time subscription to photo submissions
 */
export function subscribeToPhotoSubmissions(
  onUpdate: (submissions: PhotoSubmission[]) => void
): () => void {
  try {
    const colRef = collection(db, PHOTO_SUBMISSIONS_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const list: PhotoSubmission[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && typeof data.id === 'string' && typeof data.factId === 'number') {
            list.push(data as PhotoSubmission);
          }
        });

        list.sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));
        saveStoredSubmissions(list);
        onUpdate(list);
      },
      (error) => {
        console.warn('Realtime submissions sync error, using cached:', error);
        onUpdate(loadStoredSubmissions());
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Failed to attach realtime submissions listener:', err);
    onUpdate(loadStoredSubmissions());
    return () => {};
  }
}

/**
 * Approve photo submission: since `ckb` is the Master Knowledge Base, always updates `facts` (ckb)
 * AND automatically syncs the approved image into `facts_en` if that topic already exists there.
 */
export async function approvePhotoSubmission(
  submission: PhotoSubmission,
  allFacts: FactItem[],
  lang: AppLanguage = 'ckb'
): Promise<FactItem | null> {
  const cleanUrl = resolveImageUrl(submission.imageUrl) || submission.imageUrl;

  const mergePhotoIntoFact = (fact: FactItem): FactItem => {
    const existingImages = Array.isArray(fact.images) ? [...fact.images] : [];
    const alreadyInImages = existingImages.some((img) => img.url === cleanUrl);
    const updatedImages = alreadyInImages
      ? existingImages
      : [
          {
            url: cleanUrl,
            caption: submission.note || fact.name || submission.factName,
          },
          ...existingImages,
        ];
    return {
      ...fact,
      imageUrl: cleanUrl,
      images: updatedImages,
    };
  };

  // 1. Always update Master Kurdish Knowledge Base (`ckb`)
  const ckbTarget =
    (lang === 'ckb' ? allFacts.find((f) => f.id === submission.factId) : undefined) ||
    (await getFactFromCloud(submission.factId, 'ckb')) ||
    loadStoredFacts('ckb').find((f) => f.id === submission.factId);

  let updatedCkbFact: FactItem | null = null;
  if (ckbTarget) {
    updatedCkbFact = mergePhotoIntoFact(ckbTarget);
    await saveFactToCloud(updatedCkbFact, 'ckb');
  }

  // 2. Also cascade photo to `facts_en` if this entry exists in English (without AI)
  const enTarget =
    (lang === 'en' ? allFacts.find((f) => f.id === submission.factId) : undefined) ||
    (await getFactFromCloud(submission.factId, 'en'));

  let updatedEnFact: FactItem | null = null;
  if (enTarget) {
    updatedEnFact = mergePhotoIntoFact(enTarget);
    await saveFactToCloud(updatedEnFact, 'en');
  }

  if (!updatedCkbFact && !updatedEnFact) {
    console.warn(`Fact with id ${submission.factId} not found.`);
    return null;
  }

  const subRef = doc(db, PHOTO_SUBMISSIONS_COLLECTION, submission.id);
  await setDoc(
    subRef,
    {
      status: 'approved',
      approvedAt: Date.now(),
    },
    { merge: true }
  );

  const local = loadStoredSubmissions();
  const updatedLocal = local.map((s) =>
    s.id === submission.id ? { ...s, status: 'approved' as const, approvedAt: Date.now() } : s
  );
  saveStoredSubmissions(updatedLocal);

  return lang === 'en' ? updatedEnFact || updatedCkbFact : updatedCkbFact || updatedEnFact;
}

/**
 * Reject a photo submission
 */
export async function rejectPhotoSubmission(submissionId: string): Promise<void> {
  const subRef = doc(db, PHOTO_SUBMISSIONS_COLLECTION, submissionId);
  await setDoc(subRef, { status: 'rejected' }, { merge: true });

  const local = loadStoredSubmissions();
  const updated = local.map((s) =>
    s.id === submissionId ? { ...s, status: 'rejected' as const } : s
  );
  saveStoredSubmissions(updated);
}

/**
 * Permanently delete a photo submission
 */
export async function deletePhotoSubmission(submissionId: string): Promise<void> {
  const subRef = doc(db, PHOTO_SUBMISSIONS_COLLECTION, submissionId);
  await deleteDoc(subRef);

  const local = loadStoredSubmissions();
  const updated = local.filter((s) => s.id !== submissionId);
  saveStoredSubmissions(updated);
}

