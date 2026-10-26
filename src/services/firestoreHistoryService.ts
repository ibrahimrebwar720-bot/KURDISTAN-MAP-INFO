import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { ALL_FACTS, FactItem } from '../data/kurdishHistoryData';
import { KURDISH_PROVINCES_CITIES } from '../data/kurdishProvincesData';
import { CollectionItem, DEFAULT_COLLECTIONS } from '../types/history';
import {
  loadStoredFacts,
  saveStoredFacts,
  loadStoredCollections,
  saveStoredCollections,
  sanitizeFact,
  isCityFact,
} from './historyStorageService';
import { resolveImageUrl } from '../utils/imageUtils';

const FACTS_COLLECTION = 'facts';
const COLLECTIONS_COLLECTION = 'collections';

// Helper: Merge Firestore facts with ALL_FACTS baseline
function mergeFactsWithCloud(cloudFacts: FactItem[]): FactItem[] {
  const map = new Map<number, FactItem>();
  // 1. Core 350 historical facts as baseline
  ALL_FACTS.forEach((fact) => {
    if (!isCityFact(fact)) {
      map.set(fact.id, fact);
    }
  });
  // 2. Kurdish provinces / regions
  KURDISH_PROVINCES_CITIES.forEach((city) => {
    if (!isCityFact(city)) {
      map.set(city.id, city);
    }
  });
  // 3. Cloud updates and user custom additions
  cloudFacts.forEach((cf) => {
    if (cf && typeof cf.id === 'number' && !isCityFact(cf)) {
      map.set(cf.id, sanitizeFact(cf));
    }
  });

  return Array.from(map.values());
}

// Helper: Merge Firestore collections with default collections
function mergeCollectionsWithCloud(cloudCols: CollectionItem[]): CollectionItem[] {
  const cloudMap = new Map<string, CollectionItem>();
  cloudCols.forEach((c) => cloudMap.set(c.id, c));

  const baseMerged = DEFAULT_COLLECTIONS.map((bc) => {
    if (cloudMap.has(bc.id)) {
      const updated = cloudMap.get(bc.id)!;
      cloudMap.delete(bc.id);
      return updated;
    }
    return bc;
  });

  const customAdditions = Array.from(cloudMap.values());
  return [...baseMerged, ...customAdditions];
}

/**
 * Real-time subscription to cloud facts across all users worldwide
 */
export function subscribeToCloudFacts(onUpdate: (facts: FactItem[]) => void): () => void {
  try {
    const colRef = collection(db, FACTS_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const cloudList: FactItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && typeof data.id === 'number') {
            const item = data as FactItem;
            if (isCityFact(item)) {
              deleteDoc(docSnap.ref).catch(() => {});
            } else {
              cloudList.push(sanitizeFact(item));
            }
          }
        });

        const merged = mergeFactsWithCloud(cloudList);
        saveStoredFacts(merged);
        onUpdate(merged);
      },
      (error) => {
        console.warn('Realtime facts sync error, using cached facts:', error);
        onUpdate(loadStoredFacts());
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Failed to attach realtime facts listener:', err);
    onUpdate(loadStoredFacts());
    return () => {};
  }
}

/**
 * Save or update fact to Firestore cloud (Strictly Text & URLs only - zero image file uploads)
 */
export async function saveFactToCloud(fact: FactItem): Promise<void> {
  const sanitized = sanitizeFact(fact);

  // Strictly strip any base64 image data to protect Firestore quota
  if (typeof sanitized.imageUrl === 'string') {
    if (sanitized.imageUrl.startsWith('data:')) {
      delete (sanitized as any).imageUrl;
    } else {
      sanitized.imageUrl = resolveImageUrl(sanitized.imageUrl) || undefined;
    }
  }

  const docRef = doc(db, FACTS_COLLECTION, String(sanitized.id));
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

  // Remove any undefined keys to prevent Firestore validation errors
  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  await setDoc(docRef, payload, { merge: true });

  // Update local cache
  const local = loadStoredFacts();
  const exists = local.some((f) => f.id === sanitized.id);
  const updated = exists
    ? local.map((f) => (f.id === sanitized.id ? sanitized : f))
    : [sanitized, ...local];
  saveStoredFacts(updated);
}

/**
 * Delete a fact from Firestore cloud
 */
export async function deleteFactFromCloud(factId: number): Promise<void> {
  const docRef = doc(db, FACTS_COLLECTION, String(factId));
  await deleteDoc(docRef);

  // Update local cache
  const local = loadStoredFacts();
  const updated = local.filter((f) => f.id !== factId);
  saveStoredFacts(updated);
}

/**
 * Save additional notes for a fact to Firestore
 */
export async function saveNotesToCloud(
  factId: number,
  notes: string,
  existingFact?: FactItem
): Promise<void> {
  const docRef = doc(db, FACTS_COLLECTION, String(factId));
  if (existingFact) {
    const sanitized = sanitizeFact(existingFact);
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

  // Update local cache
  const local = loadStoredFacts();
  const updated = local.map((f) => (f.id === factId ? { ...f, additionalNotes: notes } : f));
  saveStoredFacts(updated);
}

/**
 * Update linked and parent facts in Firestore and local storage
 */
export async function updateFactRelationsInCloud(
  factId: number,
  relatedFactIds: number[],
  parentFactId?: number
): Promise<void> {
  const docRef = doc(db, FACTS_COLLECTION, String(factId));
  const payload: Record<string, any> = {
    relatedFactIds,
    updatedAt: Date.now(),
  };
  if (typeof parentFactId === 'number') {
    payload.parentFactId = parentFactId;
  }

  await setDoc(docRef, payload, { merge: true });

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
}

/**
 * Real-time subscription to cloud collections
 */
export function subscribeToCloudCollections(
  onUpdate: (collections: CollectionItem[]) => void
): () => void {
  try {
    const colRef = collection(db, COLLECTIONS_COLLECTION);
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

        const merged = mergeCollectionsWithCloud(cloudList);
        saveStoredCollections(merged);
        onUpdate(merged);
      },
      (error) => {
        console.warn('Realtime collections sync error, using cached:', error);
        onUpdate(loadStoredCollections());
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Failed to attach realtime collections listener:', err);
    onUpdate(loadStoredCollections());
    return () => {};
  }
}

/**
 * Save collection to Firestore cloud
 */
export async function saveCollectionToCloud(collectionItem: CollectionItem): Promise<void> {
  const docRef = doc(db, COLLECTIONS_COLLECTION, collectionItem.id);
  await setDoc(docRef, { ...collectionItem, updatedAt: Date.now() }, { merge: true });

  const local = loadStoredCollections();
  const exists = local.some((c) => c.id === collectionItem.id);
  const updated = exists
    ? local.map((c) => (c.id === collectionItem.id ? collectionItem : c))
    : [...local, collectionItem];
  saveStoredCollections(updated);
}

/**
 * Delete collection from Firestore cloud
 */
export async function deleteCollectionFromCloud(collectionId: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS_COLLECTION, collectionId);
  await deleteDoc(docRef);

  const local = loadStoredCollections();
  const updated = local.filter((c) => c.id !== collectionId);
  saveStoredCollections(updated);
}
