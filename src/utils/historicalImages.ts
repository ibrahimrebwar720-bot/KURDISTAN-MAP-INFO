import { FactItem } from '../data/kurdishHistoryData';
import { resolveImageUrl } from './imageUtils';

/**
 * Returns the fact's verified image URL only if provided by the user via link.
 * Does not set or fallback to any mock/stock images.
 */
export function getFactDisplayImage(fact: FactItem | null | undefined): string {
  if (!fact) return '';
  if (typeof fact.imageUrl === 'string' && fact.imageUrl.trim().length > 0) {
    return resolveImageUrl(fact.imageUrl.trim());
  }
  return '';
}
