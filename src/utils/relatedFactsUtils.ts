import { FactItem } from '../data/kurdishHistoryData';
import { getCategoryInfo } from '../types/history';
import { getFactChronologicalYear } from './yearUtils';

interface HistoricalEntityKeywordMap {
  canonicalName: string;
  roots: string[];
}

const HISTORICAL_ENTITY_KEYWORDS: HistoricalEntityKeywordMap[] = [
  { canonicalName: 'میرنشینی سۆران', roots: ['سۆران', 'ڕواندز', 'پاشای گەورە', 'میر محەمەد', 'خانزاد', 'مستەفا بەگ'] },
  { canonicalName: 'میرنشینی بابان', roots: ['بابان', 'قەڵاچوالان', 'سلێمانی', 'سولەیمان پاشا', 'ئەحمەد پاشای بابان', 'مەحموود پاشای بابان', 'بەکرەجۆ'] },
  { canonicalName: 'میرنشینی ئەردەڵان', roots: ['ئەردەڵان', 'سنە', 'مەستوورە', 'خەسرەو خان', 'هەڵۆخان', 'قەڵای حەسەن ئاباد', 'قەڵای پاڵەنگان'] },
  { canonicalName: 'میرنشینی بەهدینان (بادینان)', roots: ['بەهدینان', 'بادینان', 'ئامێدی', 'سوڵتان حوسێن', 'قوباد پاشا', 'مەعەهەدی قوبەهان'] },
  { canonicalName: 'میرنشینی بۆتان', roots: ['بۆتان', 'جزیرە', 'بەدرخان', 'بەدرخان پاشا', 'قەڵای درزینی', 'مەم و زین'] },
  { canonicalName: 'میرنشینی برادۆست', roots: ['برادۆست', 'دیمدیم', 'دمدم', 'خان لەپ زێڕین', 'حەمە بگ'] },
  { canonicalName: 'میرنشینی هەکاری', roots: ['هەکاری', 'جوڵەمێرگ', 'قەڵای هەکاری', 'شمبەدین'] },
  { canonicalName: 'میرنشینی شەدادی', roots: ['شەدادی', 'گەنجە', 'دەبیل', 'ئانی', 'ئەنووشیروان', 'فەزڵوون'] },
  { canonicalName: 'میرنشینی مەڕوانی', roots: ['مەڕوانی', 'مەییافاریقین', 'ئامەد', 'فارقین', 'نەسرولدەولە'] },
  { canonicalName: 'میرنشینی حەسنەوی', roots: ['حەسنەوی', 'سەرمایج', 'شەفەقە', 'بەدر بن حەسنەوی', 'شاپوورخواست'] },
  { canonicalName: 'ئەییووبییەکان', roots: ['ئەییووبی', 'سەڵاحەدین', 'سەڵاحەددین', 'مەلیک عادل', 'قەڵای سەڵاحەدین', 'حەما', 'دیمەشق'] },
  { canonicalName: 'میرنشینی هەورامان', roots: ['هەورامان', 'سانەکانی هەورامان', 'سان', 'تەوێڵە', 'نەوسوود', 'بێساران'] },
  { canonicalName: 'کۆماری مەهاباد (کوردستان)', roots: ['مەهاباد', 'قازی محەمەد', 'پێشەوا', 'کۆماری کوردستان', 'چوارچرا', 'بارزانی لە مەهاباد'] },
  { canonicalName: 'کۆماری ئارارات', roots: ['ئارارات', 'ئیحسان نوری', 'خۆیبون', 'چیای ئارارات', 'زەیلان'] },
  { canonicalName: 'شانشینی کوردستان', roots: ['شانشینی کوردستان', 'شێخ مەحموود', 'شێخ مەحمودی حەفید', 'مەلیکی کوردستان', 'دەربەندی بازیان'] },
  { canonicalName: 'ئیمپراتۆریەتی ماد', roots: ['ماد', 'ئەکباتانا', 'دیاکۆ', 'کەیخوسرەو', 'فرەڤارتیش', 'ئاستیاگ', 'هەمەدان', 'تەپەی نوشیجان'] },
  { canonicalName: 'ئیمپراتۆریەتی میتانی', roots: ['میتانی', 'واشۆکانی', 'توشراتا', 'سەوشتەتەر', 'خابوور'] },
  { canonicalName: 'شارستانیەتی هۆری', roots: ['هۆری', 'نوزی', 'کەرکووک', 'تابلۆی نوزی', 'ئاراپخا'] },
  { canonicalName: 'شارستانیەتی گوتی', roots: ['گوتی', 'ئیرتکتی', 'زاگرۆس', 'ئەکەد'] },
  { canonicalName: 'شارستانیەتی لولوبی', roots: ['لولوبی', 'ئەنوبانینی', 'سەرپێڵ', 'شارەزوور', 'تاشەبەردی ئەنوبانینی'] },
  { canonicalName: 'شارستانیەتی ئۆرارتۆ', roots: ['ئۆرارتۆ', 'وان', 'توشپا', 'قەڵای وان', 'سەردوری', 'مەنوا'] },
  { canonicalName: 'شارستانیەتی کاشی', roots: ['کاشی', 'کاشییەکان', 'بابل', 'خانەقین', 'زاگرۆس'] },
  { canonicalName: 'زەندییەکان', roots: ['زەند', 'کەریم خان', 'کەریم خانی زەند', 'شیراز', 'مەلایەر'] },
];

/**
 * Returns clean entity keywords that this fact strongly references
 */
function getMatchingEntityRoots(fact: FactItem): string[] {
  const text = `${fact.name} ${fact.desc} ${fact.fullText}`.toLowerCase();
  const matchedRoots: string[] = [];

  for (const group of HISTORICAL_ENTITY_KEYWORDS) {
    const isDirectMatch = group.roots.some((root) => text.includes(root.toLowerCase()));
    if (isDirectMatch) {
      matchedRoots.push(...group.roots);
    }
  }

  return matchedRoots;
}

/**
 * Finds all linked facts for a given fact:
 * 1. Explicit children: other.parentFactId === fact.id
 * 2. Explicit parent: other.id === fact.parentFactId
 * 3. Explicit related IDs: fact.relatedFactIds contains other.id or vice versa
 * 4. Semantic historical entity linkage (e.g. all castles, leaders, battles belonging to Soran / Baban / Ardalan etc.)
 */
export function getLinkedFactsForFact(fact: FactItem | null | undefined, allFacts: FactItem[]): FactItem[] {
  if (!fact || !Array.isArray(allFacts) || allFacts.length === 0) return [];

  const linkedMap = new Map<number, FactItem>();

  // 1. Direct parent fact
  if (typeof fact.parentFactId === 'number') {
    const parent = allFacts.find((f) => f.id === fact.parentFactId);
    if (parent && parent.id !== fact.id) {
      linkedMap.set(parent.id, parent);
    }
  }

  // 2. Direct children facts (facts where parentFactId === fact.id)
  allFacts.forEach((other) => {
    if (other.id !== fact.id && other.parentFactId === fact.id) {
      linkedMap.set(other.id, other);
    }
  });

  // 3. Explicitly chosen relatedFactIds
  if (Array.isArray(fact.relatedFactIds)) {
    fact.relatedFactIds.forEach((id) => {
      if (id !== fact.id) {
        const found = allFacts.find((f) => f.id === id);
        if (found) linkedMap.set(found.id, found);
      }
    });
  }

  // Also reverse check: any other fact that lists this fact in its relatedFactIds
  allFacts.forEach((other) => {
    if (other.id !== fact.id && Array.isArray(other.relatedFactIds) && other.relatedFactIds.includes(fact.id)) {
      linkedMap.set(other.id, other);
    }
  });

  // 4. Semantic historical entity linking
  // If fact is a major authority/principality/empire/civilization, or references historical dynasty roots
  const roots = getMatchingEntityRoots(fact);
  if (roots.length > 0) {
    allFacts.forEach((other) => {
      if (other.id === fact.id || linkedMap.has(other.id)) return;

      const otherText = `${other.name} ${other.desc} ${other.fullText}`.toLowerCase();
      const hasSharedRoot = roots.some((root) => {
        // Must be exact word or substring with minimum 3 chars
        return root.length >= 3 && otherText.includes(root.toLowerCase());
      });

      if (hasSharedRoot) {
        linkedMap.set(other.id, other);
      }
    });
  }

  const results = Array.from(linkedMap.values());

  // Sort chronologically, then by name
  return results.sort((a, b) => {
    const yearA = getFactChronologicalYear(a);
    const yearB = getFactChronologicalYear(b);
    if (yearA !== yearB) return yearA - yearB;
    return a.name.localeCompare(b.name, 'ckb');
  });
}

/**
 * Finds the parent principality / empire / civilization fact for a fact
 */
export function getParentFactForFact(fact: FactItem | null | undefined, allFacts: FactItem[]): FactItem | null {
  if (!fact || !Array.isArray(allFacts)) return null;

  // 1. Explicit parentFactId
  if (typeof fact.parentFactId === 'number') {
    const found = allFacts.find((f) => f.id === fact.parentFactId);
    if (found) return found;
  }

  // 2. Inferred parent entity for figures / castles / battles
  const factCat = getCategoryInfo(fact).id;
  const isCandidateChild = ['leader', 'scholar', 'official', 'other_figure', 'castle', 'battle', 'monument'].includes(factCat);

  if (isCandidateChild) {
    const roots = getMatchingEntityRoots(fact);
    if (roots.length > 0) {
      // Find a principality, empire, or civilization among allFacts that matches these roots
      const parent = allFacts.find((other) => {
        if (other.id === fact.id) return false;
        const otherCat = getCategoryInfo(other).id;
        const isParentType = ['principality', 'empire', 'civilization'].includes(otherCat);
        if (!isParentType) return false;

        const otherText = `${other.name} ${other.desc}`.toLowerCase();
        return roots.some((r) => r.length >= 3 && otherText.includes(r.toLowerCase()));
      });

      if (parent) return parent;
    }
  }

  return null;
}

export type LinkedCategoryTab = 'all' | 'leaders' | 'castles' | 'scholars' | 'battles' | 'others';

export function groupLinkedFactsByCategory(linkedFacts: FactItem[]): Record<LinkedCategoryTab, FactItem[]> {
  const groups: Record<LinkedCategoryTab, FactItem[]> = {
    all: linkedFacts,
    leaders: [],
    castles: [],
    scholars: [],
    battles: [],
    others: [],
  };

  linkedFacts.forEach((f) => {
    const cat = getCategoryInfo(f).id;
    if (cat === 'leader' || cat === 'official') {
      groups.leaders.push(f);
    } else if (cat === 'castle' || cat === 'monument') {
      groups.castles.push(f);
    } else if (cat === 'scholar' || cat === 'other_figure') {
      groups.scholars.push(f);
    } else if (cat === 'battle') {
      groups.battles.push(f);
    } else {
      groups.others.push(f);
    }
  });

  return groups;
}
