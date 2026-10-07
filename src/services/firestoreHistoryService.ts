import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { ALL_FACTS, FactItem } from '../data/kurdishHistoryData';
import { CollectionItem, DEFAULT_COLLECTIONS } from '../types/history';
import {
  loadStoredFacts,
  saveStoredFacts,
  loadStoredCollections,
  saveStoredCollections,
  inferCollectionForFact,
  sanitizeFact,
} from './historyStorageService';

const FACTS_COLLECTION = 'facts';
const COLLECTIONS_COLLECTION = 'collections';

// Helper: Merge Firestore facts with default ALL_FACTS
function mergeFactsWithCloud(cloudFacts: FactItem[]): FactItem[] {
  const cloudMap = new Map<number, FactItem>();
  cloudFacts.forEach((cf) => {
    cloudMap.set(cf.id, sanitizeFact(cf));
  });

  // Base facts: apply any cloud updates/overrides
  const mergedBase = ALL_FACTS.map((baseFact) => {
    if (cloudMap.has(baseFact.id)) {
      const updated = cloudMap.get(baseFact.id)!;
      cloudMap.delete(baseFact.id);
      return sanitizeFact({
        ...baseFact,
        ...updated,
        collectionId: updated.collectionId || baseFact.collectionId || inferCollectionForFact(baseFact),
      });
    }
    return sanitizeFact({
      ...baseFact,
      collectionId: baseFact.collectionId || inferCollectionForFact(baseFact),
    });
  });

  // Remaining cloud facts are new additions added by admins
  const newAdditions: FactItem[] = Array.from(cloudMap.values()).map(sanitizeFact);

  // Filter out any explicitly marked deleted facts if needed
  const finalFacts = [...newAdditions, ...mergedBase];
  return finalFacts;
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
            cloudList.push(data as FactItem);
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
 * Save or update fact to Firestore cloud so all users see it
 */
export async function saveFactToCloud(fact: FactItem): Promise<void> {
  const docRef = doc(db, FACTS_COLLECTION, String(fact.id));
  const payload = {
    ...fact,
    updatedAt: Date.now(),
  };

  await setDoc(docRef, payload, { merge: true });

  // Update local cache
  const local = loadStoredFacts();
  const exists = local.some((f) => f.id === fact.id);
  const updated = exists
    ? local.map((f) => (f.id === fact.id ? fact : f))
    : [fact, ...local];
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
    await setDoc(
      docRef,
      {
        ...existingFact,
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
 * Real-time subscription to cloud collections across all users worldwide
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
          if (data && data.id) {
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
export async function saveCollectionToCloud(col: CollectionItem): Promise<void> {
  const docRef = doc(db, COLLECTIONS_COLLECTION, col.id);
  await setDoc(docRef, col, { merge: true });

  const local = loadStoredCollections();
  const exists = local.some((c) => c.id === col.id);
  const updated = exists ? local.map((c) => (c.id === col.id ? col : c)) : [...local, col];
  saveStoredCollections(updated);
}

/**
 * Delete custom collection from Firestore cloud
 */
export async function deleteCollectionFromCloud(colId: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS_COLLECTION, colId);
  await deleteDoc(docRef);

  const local = loadStoredCollections();
  const updated = local.filter((c) => c.id !== colId);
  saveStoredCollections(updated);
}
