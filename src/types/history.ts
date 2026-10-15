export type CategoryId =
  | 'principality'
  | 'civilization'
  | 'empire'
  | 'scholar'
  | 'official'
  | 'other_figure'
  | 'castle'
  | 'battle';

export interface CategoryItem {
  id: CategoryId | 'all' | string;
  name: string;
  description?: string;
  color: string;
  isCustom?: boolean;
}

// Backward-compatible alias for existing code referencing CollectionItem
export type CollectionItem = CategoryItem;

export const ADMIN_SECRET_CODE = '200076';

/**
 * ٨ پۆلێنی یەکگرتووی سەرەکی بەپێی داواکاری بەکارهێنەر:
 * - میرنشینەکان
 * - شارستانییەتەکان 
 * - ئیمپراتۆرییەتەکان
 * - زانایان
 * - وەزیر و کاربەدەستان
 * - کەسایەتی تر
 * - قەڵاکان
 * - جەنگ و ڕووداوەکان
 */
export const UNIFIED_CATEGORIES: CategoryItem[] = [
  {
    id: 'all',
    name: 'هەموو پۆلێنەکان',
    description: 'تەواوی بابەتە مێژووییەکان لە هەموو پۆلێنەکاندا',
    color: '#f59e0b',
  },
  {
    id: 'principality',
    name: 'میرنشینەکان',
    description: 'میرنشینە مێژووییەکان و میرەکانی کوردستان',
    color: '#eab308',
  },
  {
    id: 'civilization',
    name: 'شارستانییەتەکان',
    description: 'شارستانییەتە دێرینەکان و شوێنەوارە شارستانییەکان',
    color: '#10b981',
  },
  {
    id: 'empire',
    name: 'ئیمپراتۆرییەتەکان',
    description: 'ئیمپراتۆریەتە مەزنەکان و دەسەڵاتە فەرمانڕەواکان',
    color: '#f97316',
  },
  {
    id: 'scholar',
    name: 'زانایان',
    description: 'زانایان، فەیلەسوفان و مێژوونووسانی کورد',
    color: '#06b6d4',
  },
  {
    id: 'official',
    name: 'وەزیر و کاربەدەستان',
    description: 'وەزیران، کاربەدەستان و بەڕێوەبەرانی مێژوویی',
    color: '#3b82f6',
  },
  {
    id: 'other_figure',
    name: 'کەسایەتی تر',
    description: 'سەرکردە، شاعیر و کەسایەتییە کاریگەرەکانی تر',
    color: '#ec4899',
  },
  {
    id: 'castle',
    name: 'قەڵاکان',
    description: 'قەڵا مێژووییەکان، پایتەخت و بارەگاکان',
    color: '#8b5cf6',
  },
  {
    id: 'battle',
    name: 'جەنگ و ڕووداوەکان',
    description: 'جەنگە چارەنووسسازەکان، شۆڕش و ڕووداوەکان',
    color: '#ef4444',
  },
];

// Alias for backwards compatibility
export const DEFAULT_COLLECTIONS: CategoryItem[] = UNIFIED_CATEGORIES;

/**
 * دۆزینەوەی ناوی کوردی و ناسنامەی پۆلێنی هەر بابەتێک بە یەکگرتوویی
 */
export function getCategoryInfo(fact: { category?: string; tag?: string; collectionId?: string } | null | undefined): {
  id: CategoryId;
  name: string;
  color: string;
} {
  if (!fact) {
    return { id: 'principality', name: 'میرنشینەکان', color: '#eab308' };
  }

  const raw = (fact.category || fact.tag || fact.collectionId || '').toLowerCase().trim();

  if (raw === 'principality' || raw === 'powers' || raw === 'میرنشینەکان' || raw === 'میرنشین') {
    return { id: 'principality', name: 'میرنشینەکان', color: '#eab308' };
  }
  if (raw === 'civilization' || raw === 'culture' || raw === 'شارستانییەتەکان' || raw === 'شارستانییەت') {
    return { id: 'civilization', name: 'شارستانییەتەکان', color: '#10b981' };
  }
  if (raw === 'empire' || raw === 'ئیمپراتۆرییەتەکان' || raw === 'ئیمپراتۆریەت') {
    return { id: 'empire', name: 'ئیمپراتۆرییەتەکان', color: '#f97316' };
  }
  if (raw === 'scholar' || raw === 'scholars' || raw === 'زانایان' || raw === 'زانا') {
    return { id: 'scholar', name: 'زانایان', color: '#06b6d4' };
  }
  if (
    raw === 'official' ||
    raw === 'officials' ||
    raw === 'minister' ||
    raw === 'ministers' ||
    raw === 'وەزیر و کاربەدەستان' ||
    raw === 'وەزیر' ||
    raw === 'کاربەدەست'
  ) {
    return { id: 'official', name: 'وەزیر و کاربەدەستان', color: '#3b82f6' };
  }
  if (raw === 'castle' || raw === 'capital' || raw === 'monuments' || raw === 'قەڵاکان' || raw === 'قەڵا') {
    return { id: 'castle', name: 'قەڵاکان', color: '#8b5cf6' };
  }
  if (raw === 'battle' || raw === 'battles' || raw === 'جەنگ و ڕووداوەکان' || raw === 'جەنگ') {
    return { id: 'battle', name: 'جەنگ و ڕووداوەکان', color: '#ef4444' };
  }

  return { id: 'other_figure', name: 'کەسایەتی تر', color: '#ec4899' };
}
