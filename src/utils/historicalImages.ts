import { FactItem, FactImageItem } from '../data/kurdishHistoryData';
import { resolveImageUrl } from './imageUtils';

export interface FactImageEntry {
  url: string;
  caption?: string;
}

/**
 * Returns all valid images (up to 10 images) associated with a fact,
 * with primary/main image at index 0, followed by additional images.
 */
export function getAllFactImages(fact: FactItem | null | undefined): FactImageEntry[] {
  if (!fact) return [];
  const list: FactImageEntry[] = [];
  const seen = new Set<string>();

  // 1. If explicit images array is present and has elements
  if (Array.isArray(fact.images) && fact.images.length > 0) {
    fact.images.forEach((item) => {
      if (!item) return;
      const rawUrl = typeof item === 'string' ? item : item.url;
      const caption = typeof item === 'object' ? item.caption : undefined;
      if (rawUrl && typeof rawUrl === 'string' && rawUrl.trim() && !rawUrl.trim().startsWith('data:')) {
        const resolved = resolveImageUrl(rawUrl.trim());
        if (resolved && !seen.has(resolved)) {
          seen.add(resolved);
          list.push({
            url: resolved,
            caption: caption?.trim() || undefined,
          });
        }
      }
    });
  }

  // 2. Main image (imageUrl) if not already included
  if (typeof fact.imageUrl === 'string' && fact.imageUrl.trim() && !fact.imageUrl.trim().startsWith('data:')) {
    const resolved = resolveImageUrl(fact.imageUrl.trim());
    if (resolved && !seen.has(resolved)) {
      list.unshift({
        url: resolved,
        caption: fact.imageCaption?.trim() || undefined,
      });
      seen.add(resolved);
    }
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
