export type CategoryId =
  | 'principality'
  | 'civilization'
  | 'empire'
  | 'leader'
  | 'scholar'
  | 'official'
  | 'other_figure'
  | 'castle'
  | 'battle'
  | 'monument';

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
 * ١٠ پۆلێنی یەکگرتووی سەرەکی:
 * - میرنشینەکان
 * - شارستانییەتەکان 
 * - ئیمپراتۆرییەتەکان
 * - سەرکردەکان
 * - زانایان
 * - وەزیر و کاربەدەستان
 * - کەسایەتی تر
 * - قەڵاکان
 * - جەنگ و ڕووداوەکان
 * - شوێنەوار
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
    description: 'شارستانییەتە دێرینەکان و سەردەمە کۆنەکان',
    color: '#10b981',
  },
  {
    id: 'empire',
    name: 'ئیمپراتۆرییەتەکان',
    description: 'ئیمپراتۆریەتە مەزنەکان و دەسەڵاتە فەرمانڕەواکان',
    color: '#f97316',
  },
  {
    id: 'leader',
    name: 'سەرکردەکان',
    description: 'سەرکردە، فەرماندە و پێشەوا مێژوویی و نەتەوەییەکانی کوردستان',
    color: '#f43f5e',
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
  {
    id: 'monument',
    name: 'شوێنەوار',
    description: 'شوێنەوارە مێژووییەکان، ئەشکەوت، نەخشە بەردینەکان و شوێنە کۆنەکان',
    color: '#14b8a6',
  },
];

// Alias for backwards compatibility
export const DEFAULT_COLLECTIONS: CategoryItem[] = UNIFIED_CATEGORIES;

/**
 * دۆزینەوەی ناوی کوردی و ناسنامەی پۆلێنی هەر بابەتێک بە یەکگرتوویی
 */
export function getCategoryInfo(fact: { category?: string; tag?: string; collectionId?: string; name?: string; desc?: string } | null | undefined): {
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
  if (
    raw === 'leader' ||
    raw === 'leaders' ||
    raw === 'commander' ||
    raw === 'commanders' ||
    raw === 'سەرکردەکان' ||
    raw === 'سەرکردە' ||
    raw === 'فەرماندە' ||
    raw === 'فەرماندەکان' ||
    raw === 'ڕابەر' ||
    raw === 'ڕابەران' ||
    raw === 'پێشەوا' ||
    raw === 'پێشەوایان'
  ) {
    return { id: 'leader', name: 'سەرکردەکان', color: '#f43f5e' };
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
  if (raw === 'castle' || raw === 'capital' || raw === 'قەڵاکان' || raw === 'قەڵا') {
    return { id: 'castle', name: 'قەڵاکان', color: '#8b5cf6' };
  }
  if (
    raw === 'monument' ||
    raw === 'monuments' ||
    raw === 'archaeology' ||
    raw === 'ruins' ||
    raw === 'heritage' ||
    raw === 'شوێنەوار' ||
    raw === 'شوێنەوارەکان' ||
    raw === 'شوێنەواری'
  ) {
    return { id: 'monument', name: 'شوێنەوار', color: '#14b8a6' };
  }
  if (raw === 'battle' || raw === 'battles' || raw === 'جەنگ و ڕووداوەکان' || raw === 'جەنگ') {
    return { id: 'battle', name: 'جەنگ و ڕووداوەکان', color: '#ef4444' };
  }

  // Detect leader from category/tag or historical names/titles
  const nameDesc = `${fact.name || ''} ${fact.desc || ''}`.toLowerCase();
  if (
    raw === 'leader' ||
    raw === 'leaders' ||
    raw === 'commander' ||
    raw === 'commanders' ||
    raw === 'rulers' ||
    raw === 'سەرکردەکان' ||
    raw === 'سەرکردە' ||
    raw === 'فەرماندە' ||
    raw === 'فەرماندەکان' ||
    raw === 'ڕابەر' ||
    raw === 'ڕابەران' ||
    raw === 'پێشەوا' ||
    raw === 'پێشەوایان' ||
    raw === 'سەرۆک' ||
    nameDesc.includes('سەرکردە') ||
    nameDesc.includes('فەرماندە') ||
    nameDesc.includes('پێشەوا') ||
    nameDesc.includes('ڕابەر') ||
    nameDesc.includes('مەلیک') ||
    nameDesc.includes('سەرۆک') ||
    nameDesc.includes('قازی محەمەد') ||
    nameDesc.includes('شێخ مەحموود') ||
    nameDesc.includes('شێخ مەحمود') ||
    nameDesc.includes('سەڵاحەدین') ||
    nameDesc.includes('شێخ سەعید') ||
    nameDesc.includes('سەید ڕەزا') ||
    nameDesc.includes('ئیحسان نوری') ||
    nameDesc.includes('سمکۆ') ||
    nameDesc.includes('مستەفا بارزانی') ||
    nameDesc.includes('شێخ عوبەیدوڵڵا') ||
    nameDesc.includes('خان لەپ زێڕین') ||
    nameDesc.includes('بەدرخان پاشا') ||
    nameDesc.includes('پاشای گەورە') ||
    nameDesc.includes('پاشای کۆرە') ||
    nameDesc.includes('کەریم خانی زەند') ||
    nameDesc.includes('جەنەراڵ') ||
    nameDesc.includes('سەردار')
  ) {
    return { id: 'leader', name: 'سەرکردەکان', color: '#f43f5e' };
  }

  return { id: 'other_figure', name: 'کەسایەتی تر', color: '#ec4899' };
}
