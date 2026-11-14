import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { ALL_FACTS, FactItem } from '../data/kurdishHistoryData';
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

        // CRITICAL: English mode (`facts_en`) is 100% independent — never merge Kurdish `ALL_FACTS` into it
        const finalFacts =
          lang === 'en'
            ? cloudList.sort((a, b) => (a.num || a.id) - (b.num || b.id))
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

  const docRef = doc(db, getFactsCollectionName(lang), String(sanitized.id));
  const payload: Record<string, any> = {
    ...sanitized,
    updatedAt: Date.now(),
  };

  if (Array.isArray(sanitized.images)) {
    payload.images = sanitized.images.map((item) => {
      const cleanImg: Record<string, string> = { url: item.url };
      if (item.caption && item.caption.trim()) {
        cleanImg.caption = item.caption.trim();
      }
      return cleanImg;
    });
  }

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  await setDoc(docRef, payload, { merge: true });

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
  const docRef = doc(db, getFactsCollectionName(lang), String(factId));
  await deleteDoc(docRef);

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
  const docRef = doc(db, getFactsCollectionName(lang), String(factId));
  if (existingFact) {
    const sanitized = sanitizeFact(existingFact, lang);
    await setDoc(
      docRef,
      {
        ...sanitized,
        additionalNotes: notes,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } else {
    await setDoc(
      docRef,
      {
        id: factId,
        additionalNotes: notes,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  }

  const local = loadStoredFacts(lang);
  const updated = local.map((f) => (f.id === factId ? { ...f, additionalNotes: notes } : f));
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
  const docRef = doc(db, getFactsCollectionName(lang), String(factId));
  const payload: Record<string, any> = {
    relatedFactIds,
    updatedAt: Date.now(),
  };
  if (typeof parentFactId === 'number') {
    payload.parentFactId = parentFactId;
  }
  if (Array.isArray(allyFactIds)) {
    payload.allyFactIds = allyFactIds;
  }

  await setDoc(docRef, payload, { merge: true });

  const local = loadStoredFacts(lang);
  const updated = local.map((f) => {
    if (f.id === factId) {
      return {
        ...f,
        relatedFactIds,
        ...(typeof parentFactId === 'number' ? { parentFactId } : {}),
        ...(Array.isArray(allyFactIds) ? { allyFactIds } : {}),
      };
    }
    return f;
  });
  saveStoredFacts(updated, lang);
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
  await setDoc(docRef, { ...collectionItem, updatedAt: Date.now() }, { merge: true });

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
 * Approve photo submission: automatically publishes the image onto the fact
 * in the active language (and also syncs into the counterpart if matching ID exists!)
 */
export async function approvePhotoSubmission(
  submission: PhotoSubmission,
  allFacts: FactItem[],
  lang: AppLanguage = 'ckb'
): Promise<FactItem | null> {
  const targetFact =
    allFacts.find((f) => f.id === submission.factId) ||
    loadStoredFacts(lang).find((f) => f.id === submission.factId);

  if (!targetFact) {
    console.warn(`Fact with id ${submission.factId} not found.`);
    return null;
  }

  const cleanUrl = resolveImageUrl(submission.imageUrl) || submission.imageUrl;

  const existingImages = Array.isArray(targetFact.images) ? [...targetFact.images] : [];
  const alreadyInImages = existingImages.some((img) => img.url === cleanUrl);

  const updatedImages = alreadyInImages
    ? existingImages
    : [
        {
          url: cleanUrl,
          caption: submission.note || submission.factName,
        },
        ...existingImages,
      ];

  const updatedFact: FactItem = {
    ...targetFact,
    imageUrl: cleanUrl,
    images: updatedImages,
  };

  await saveFactToCloud(updatedFact, lang);

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

  return updatedFact;
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

