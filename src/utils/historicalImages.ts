import { FactItem, FactImageItem } from '../data/kurdishHistoryData';
import { resolveImageUrl } from './imageUtils';

export interface FactImageEntry {
  url: string;
  caption?: string;
}

/**
 * Returns all valid images (up to 10 images) associated with a fact,
 * with primary/main image at index 0, followed by additional images.
 * Recognizes all image property variants (imageUrl, image, img, photo, etc.)
 */
export function getAllFactImages(fact: FactItem | null | undefined): FactImageEntry[] {
  if (!fact) return [];
  const list: FactImageEntry[] = [];
  const seen = new Set<string>();
  const anyFact = fact as any;

  const pushIfValid = (candidate: any, caption?: string) => {
    if (!candidate) return;
    const raw = typeof candidate === 'string' ? candidate : candidate.url || candidate.image || candidate.imageUrl || candidate.src || candidate.link || candidate.photo;
    const cap = caption || (typeof candidate === 'object' ? candidate.caption || candidate.title || candidate.desc : undefined);
    if (typeof raw === 'string' && raw.trim().length > 0) {
      const trimmed = raw.trim();
      // Block synthetic AI generated backgrounds
      if (trimmed.includes('kurd_battle_scholar_bg') || trimmed.includes('hero/bg')) {
        return;
      }
      const resolved = resolveImageUrl(trimmed);
      if (resolved && !seen.has(resolved)) {
        seen.add(resolved);
        list.push({
          url: resolved,
          caption: typeof cap === 'string' && cap.trim() ? cap.trim() : undefined,
        });
      }
    }
  };

  // 1. Primary main image candidate properties
  pushIfValid(fact.imageUrl, fact.imageCaption);
  pushIfValid(anyFact.image, anyFact.imageCaption || anyFact.caption);
  pushIfValid(anyFact.img);
  pushIfValid(anyFact.photo);
  pushIfValid(anyFact.photoUrl);
  pushIfValid(anyFact.picture);
  pushIfValid(anyFact.pictureUrl);
  pushIfValid(anyFact.thumbnail);
  pushIfValid(anyFact.coverImage);
  pushIfValid(anyFact.overlayImageUrl);

  // 2. Explicit images array if present
  if (Array.isArray(fact.images) && fact.images.length > 0) {
    fact.images.forEach((item) => {
      pushIfValid(item);
    });
  }

  // Also check if anyFact.photos or anyFact.gallery exists
  if (Array.isArray(anyFact.photos)) {
    anyFact.photos.forEach((item: any) => pushIfValid(item));
  }
  if (Array.isArray(anyFact.gallery)) {
    anyFact.gallery.forEach((item: any) => pushIfValid(item));
  }

  return list.slice(0, 10);
}

/**
 * Returns the fact's primary/main display image URL (Image #1).
 */
export function getFactDisplayImage(fact: FactItem | null | undefined): string {
  if (!fact) return '';
  const all = getAllFactImages(fact);
  if (all.length > 0) return all[0].url;
  return '';
}
