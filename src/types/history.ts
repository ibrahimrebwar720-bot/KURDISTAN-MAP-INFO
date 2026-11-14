import type { AppLanguage } from '../context/LanguageContext';

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
  nameEn?: string;
  description?: string;
  descriptionEn?: string;
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
 * - زانا و شاعیر و ئەدیبان
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
    nameEn: 'All Categories',
    description: 'تەواوی بابەتە مێژووییەکان لە هەموو پۆلێنەکاندا',
    descriptionEn: 'All historical entries across every category',
    color: '#f59e0b',
  },
  {
    id: 'principality',
    name: 'میرنشین - دەسەڵات - دەوڵەت - ئیمپراتۆرییەت',
    nameEn: 'Principalities, States & Empires',
    description: 'میرنشین، دەسەڵات، دەوڵەت و ئیمپراتۆرییەتە فەرمانڕەواکانی کوردستان',
    descriptionEn: 'Ruling Kurdish principalities, polities, states, and empires',
    color: '#eab308',
  },
  {
    id: 'civilization',
    name: 'شارستانییەتەکان',
    nameEn: 'Civilizations',
    description: 'شارستانیەتە دێرینەکان و سەردەمە کۆنەکان',
    descriptionEn: 'Ancient civilizations and early historical peoples of Zagros & Kurdistan',
    color: '#10b981',
  },
  {
    id: 'leader',
    name: 'سەرکردەکان',
    nameEn: 'Leaders & Rulers',
    description: 'سەرکردە، فەرماندە و پێشەوا مێژوویی و نەتەوەییەکانی کوردستان',
    descriptionEn: 'Historical commanders, rulers, and national leaders of Kurdistan',
    color: '#f43f5e',
  },
  {
    id: 'scholar',
    name: 'زانا و شاعیر و ئەدیبان',
    nameEn: 'Scholars, Poets & Historians',
    description: 'زانایان، شاعیران، ئەدیبان، فەیلەسوفان و مێژوونووسانی کورد',
    descriptionEn: 'Kurdish scholars, classical poets, philosophers, and historians',
    color: '#06b6d4',
  },
  {
    id: 'official',
    name: 'وەزیر و کاربەدەستان',
    nameEn: 'Ministers & Statesmen',
    description: 'وەزیران، کاربەدەستان و بەڕێوەبەرانی مێژوویی',
    descriptionEn: 'Historical viziers, governors, diplomats, and administrators',
    color: '#3b82f6',
  },
  {
    id: 'other_figure',
    name: 'کەسایەتی تر',
    nameEn: 'Notable Figures',
    description: 'کەسایەتییە کاریگەر، هونەری و مێژووییەکانی تر',
    descriptionEn: 'Other influential cultural, artistic, and historical figures',
    color: '#ec4899',
  },
  {
    id: 'castle',
    name: 'قەڵاکان',
    nameEn: 'Castles & Citadels',
    description: 'قەڵا مێژووییەکان، پایتەخت و بارەگاکان',
    descriptionEn: 'Historic citadels, fortresses, capitals, and strongholds',
    color: '#8b5cf6',
  },
  {
    id: 'battle',
    name: 'جەنگ و ڕووداوەکان',
    nameEn: 'Battles & Events',
    description: 'جەنگە چارەنووسسازەکان، شۆڕش و ڕووداوەکان',
    descriptionEn: 'Decisive battles, treaties, revolutions, and turning points',
    color: '#ef4444',
  },
  {
    id: 'monument',
    name: 'شوێنەوار',
    nameEn: 'Archaeological Sites',
    description: 'شوێنەوارە مێژووییەکان، ئەشکەوت، نەخشە بەردینەکان و شوێنە کۆنەکان',
    descriptionEn: 'Ancient archaeological sites, rock reliefs, caves, and heritage landmarks',
    color: '#14b8a6',
  },
];

// Alias for backwards compatibility
export const DEFAULT_COLLECTIONS: CategoryItem[] = UNIFIED_CATEGORIES;

export function getUnifiedCategories(lang: AppLanguage = 'ckb'): CategoryItem[] {
  if (lang === 'ckb') return UNIFIED_CATEGORIES;
  return UNIFIED_CATEGORIES.map((c) => ({
    ...c,
    name: c.nameEn || c.name,
    description: c.descriptionEn || c.description,
  }));
}

export function getCategoryDisplayName(cat: CategoryItem, lang: AppLanguage = 'ckb'): string {
  return lang === 'en' ? cat.nameEn || cat.name : cat.name;
}

/**
 * دۆزینەوەی ناو و ناسنامەی پۆلێنی هەر بابەتێک بە یەکگرتوویی (کوردی یان ئینگلیزی)
 */
export function getCategoryInfo(
  fact: { category?: string; tag?: string; collectionId?: string; name?: string; desc?: string } | null | undefined,
  lang: AppLanguage = 'ckb'
): {
  id: CategoryId;
  name: string;
  color: string;
} {
  const byId = (id: CategoryId): { id: CategoryId; name: string; color: string } => {
    const found = UNIFIED_CATEGORIES.find((c) => c.id === id);
    if (!found) {
      return {
        id: 'principality',
        name: lang === 'en' ? 'Principalities, States & Empires' : 'میرنشین - دەسەڵات - دەوڵەت - ئیمپراتۆرییەت',
        color: '#eab308',
      };
    }
    return {
      id,
      name: lang === 'en' ? found.nameEn || found.name : found.name,
      color: found.color,
    };
  };

  if (!fact) {
    return byId('principality');
  }

  const raw = (fact.category || fact.tag || fact.collectionId || '').toLowerCase().trim();

  if (
    raw === 'principality' ||
    raw === 'empire' ||
    raw === 'powers' ||
    raw === 'state' ||
    raw === 'میرنشینەکان' ||
    raw === 'میرنشین' ||
    raw === 'ئیمپراتۆرییەتەکان' ||
    raw === 'ئیمپراتۆریەت' ||
    raw === 'دەسەڵات' ||
    raw === 'دەوڵەت' ||
    raw.includes('میرنشین') ||
    raw.includes('ئیمپراتۆریەت')
  ) {
    return byId('principality');
  }
  if (raw === 'civilization' || raw === 'culture' || raw === 'شارستانییەتەکان' || raw === 'شارستانییەت') {
    return byId('civilization');
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
    return byId('leader');
  }
  if (
    raw === 'scholar' ||
    raw === 'scholars' ||
    raw === 'زانایان' ||
    raw === 'زانا' ||
    raw === 'زانا و شاعیر و ئەدیبان' ||
    raw === 'شاعیر' ||
    raw === 'شاعیران' ||
    raw === 'ئەدیب' ||
    raw === 'ئەدیبان'
  ) {
    return byId('scholar');
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
    return byId('official');
  }
  if (raw === 'castle' || raw === 'capital' || raw === 'قەڵاکان' || raw === 'قەڵا') {
    return byId('castle');
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
    return byId('monument');
  }
  if (raw === 'battle' || raw === 'battles' || raw === 'جەنگ و ڕووداوەکان' || raw === 'جەنگ') {
    return byId('battle');
  }

  // Detect leader from category/tag or historical names/titles
  const nameDesc = `${fact.name || ''} ${fact.desc || ''}`.toLowerCase();
  if (
    raw === 'rulers' ||
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
    nameDesc.includes('سەردار') ||
    nameDesc.includes('qazi muhammad') ||
    nameDesc.includes('saladin') ||
    nameDesc.includes('sheikh mahmud') ||
    nameDesc.includes('mustafa barzani') ||
    nameDesc.includes('bedirxan') ||
    nameDesc.includes('karim khan zand')
  ) {
    return byId('leader');
  }

  return byId('other_figure');
}

export interface PhotoSubmission {
  id: string;
  factId: number;
  factName: string;
  imageUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: number;
  senderName?: string;
  note?: string;
  approvedAt?: number;
}
