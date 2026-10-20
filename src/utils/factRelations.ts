import { FactItem } from '../data/kurdishHistoryData';
import { getCategoryInfo, CategoryId } from '../types/history';

/**
 * Common known historical entity roots and keywords for Kurdish history
 */
const ENTITY_KEYWORD_MAP: Record<string, string[]> = {
  // سۆران
  سۆران: ['سۆران', 'ڕواندز', 'پاشای کۆرە', 'میر محەمەد', 'خانزاد', 'وەستا ڕەجەب', 'دوین', 'هەریر'],
  // بابان
  بابان: ['بابان', 'سلێمانی', 'ئیبراهیم پاشا', 'ئەحمەد پاشا', 'قەڵاچوالان', 'مەحموود پاشا', 'قەرەداغ'],
  // بۆتان
  بۆتان: ['بۆتان', 'جزیرە', 'بەدرخان', 'ئەحمەدی خانی', 'مەلای جزیری', 'شەرەفخان'],
  // ئەردەڵان
  ئەردەڵان: ['ئەردەڵان', 'سنە', 'مەستوورە', 'خوسرەو خان', 'قەڵای سنە', 'هەڵۆ خان'],
  // بادینان
  بادینان: ['بادینان', 'ئامێدی', 'بەهائەدین', 'قوباد پاشا', 'دەروازەی زێبار'],
  // ماد
  ماد: ['ماد', 'دیاکۆ', 'کەیخوسرەو', 'ئەستیاگ', 'ئێکباتانا', 'هەمەدان', 'قەزقاپان', 'تەختی سڵێمان'],
  // ئەییووبی
  ئەییووبی: ['ئەییووبی', 'سەلاحەدین', 'سەڵاحەدین', 'حەتین', 'موزەفەرەدین', 'گوکبۆری'],
  // برادۆست
  برادۆست: ['برادۆست', 'دیمدیم', 'قەڵای دمدم', 'خان لەپ زێڕین', 'سید خان'],
  // حەسەنوەیهی
  حەسەنوەیهی: ['حەسەنوەیهی', 'دینەوەر', 'سەرمای', 'بەدر کوڕی حەسەنوەیهی'],
  // مەڕوانی
  مەڕوانی: ['مەڕوانی', 'ئامەد', 'مەییافاریقین', 'دیاربەکر', 'باذی کوڕی دۆستەک'],
  // شەدادی
  شەدادی: ['شەدادی', 'گەنجە', 'دەبیل', 'ئانی', 'فەزڵون'],
  // میتانی
  میتانی: ['میتانی', 'واشۆکانی', 'توشراتا', 'سەوشتاتار', 'حوری'],
  // گۆتی
  گۆتی: ['گۆتی', 'گۆتییەکان', 'تریقان', 'زاگرۆس'],
  // لوولوبی
  لوولوبی: ['لوولوبی', 'ئانوبانینی', 'سەرپێڵی زەهاو', 'زەهاو'],
  // زەند
  زەند: ['زەند', 'کەریم خان', 'شیراز', 'زەندییەکان'],
  // بدلیس
  بدلیس: ['بدلیس', 'ڕۆژەکی', 'شەرەفخان', 'شەرەفنامە'],
  // هەکاری
  هەکاری: ['هەکاری', 'جۆلەمێرگ', 'شەمزینان'],
  // موکریان
  موکریان: ['موکریان', 'مەهاباد', 'قازی محەمەد', 'سەیفی قازی'],
};

/**
 * Extract clean entity search keywords from a fact's name
 */
export function extractEntityKeywords(name: string): string[] {
  const clean = name
    .replace(/^میرنشینی\s+/, '')
    .replace(/^ئیمپراتۆریەتی\s+/, '')
    .replace(/^دەوڵەتی\s+/, '')
    .replace(/^شارستانییەتی\s+/, '')
    .replace(/^شانشینی\s+/, '')
    .replace(/^ویلایەتی\s+/, '')
    .replace(/^خانەدانی\s+/, '')
    .replace(/^فەرمانڕەوایەتی\s+/, '')
    .replace(/\s*\(.*?\)/g, '')
    .trim();

  const keywords: string[] = [];
  if (clean.length >= 3) {
    keywords.push(clean);
  }

  // Look up known keyword clusters
  for (const [key, list] of Object.entries(ENTITY_KEYWORD_MAP)) {
    if (name.includes(key) || clean.includes(key)) {
      keywords.push(...list);
    }
  }

  return Array.from(new Set(keywords));
}

export interface LinkedFactsResult {
  allRelated: FactItem[];
  explicit: FactItem[];
  inferred: FactItem[];
  parents: FactItem[];
  byCategory: {
    leaders: FactItem[];
    scholars: FactItem[];
    officials: FactItem[];
    castles: FactItem[];
    battles: FactItem[];
    monuments: FactItem[];
    principalities: FactItem[];
    others: FactItem[];
  };
}

/**
 * Find all facts related to the current fact:
 * 1. Explicitly linked via relatedFactIds
 * 2. Explicitly linked via parentFactId (parent-child hierarchy)
 * 3. Smart historical relationship based on entity name and semantic match
 */
export function getLinkedFacts(
  currentFact: FactItem | null | undefined,
  allFacts: FactItem[]
): LinkedFactsResult {
  const empty: LinkedFactsResult = {
    allRelated: [],
    explicit: [],
    inferred: [],
    parents: [],
    byCategory: {
      leaders: [],
      scholars: [],
      officials: [],
      castles: [],
      battles: [],
      monuments: [],
      principalities: [],
      others: [],
    },
  };

  if (!currentFact || !Array.isArray(allFacts) || allFacts.length === 0) {
    return empty;
  }

  const explicitIds = new Set<number>();
  const explicitList: FactItem[] = [];
  const parentsList: FactItem[] = [];

  // 1. Check parent link
  if (typeof currentFact.parentFactId === 'number') {
    const parent = allFacts.find((f) => f.id === currentFact.parentFactId);
    if (parent && parent.id !== currentFact.id) {
      explicitIds.add(parent.id);
      explicitList.push(parent);
      parentsList.push(parent);
    }
  }

  // 2. Check currentFact.relatedFactIds
  if (Array.isArray(currentFact.relatedFactIds)) {
    currentFact.relatedFactIds.forEach((rid) => {
      if (typeof rid === 'number' && rid !== currentFact.id && !explicitIds.has(rid)) {
        const found = allFacts.find((f) => f.id === rid);
        if (found) {
          explicitIds.add(found.id);
          explicitList.push(found);
        }
      }
    });
  }

  // 3. Check reverse: other facts that have parentFactId === currentFact.id or relatedFactIds containing currentFact.id
  allFacts.forEach((other) => {
    if (other.id === currentFact.id) return;

    if (other.parentFactId === currentFact.id && !explicitIds.has(other.id)) {
      explicitIds.add(other.id);
      explicitList.push(other);
    } else if (
      Array.isArray(other.relatedFactIds) &&
      other.relatedFactIds.includes(currentFact.id) &&
      !explicitIds.has(other.id)
    ) {
      explicitIds.add(other.id);
      explicitList.push(other);
    }
  });

  // 4. Inferred matching for Principalities, Empires, and Civilizations
  const cat = getCategoryInfo(currentFact).id;
  const isBroadEntity =
    cat === 'principality' || cat === 'empire' || cat === 'civilization';

  const keywords = extractEntityKeywords(currentFact.name);
  const inferredList: FactItem[] = [];

  if (keywords.length > 0) {
    allFacts.forEach((other) => {
      if (other.id === currentFact.id || explicitIds.has(other.id)) return;

      const otherText = `${other.name} ${other.desc || ''} ${other.fullText || ''} ${
        other.additionalNotes || ''
      }`.toLowerCase();

      // Check if other matches any of our keywords
      const matches = keywords.some((kw) => {
        const lowerKw = kw.toLowerCase();
        // Exact word or boundary match
        return otherText.includes(lowerKw);
      });

      if (matches) {
        // If current is broad entity, accept child matches
        // If both are leaders/scholars, only accept if strongly shared
        if (isBroadEntity) {
          inferredList.push(other);
        } else {
          // If other is the broad principality itself
          const otherCat = getCategoryInfo(other).id;
          if (
            otherCat === 'principality' ||
            otherCat === 'empire' ||
            otherCat === 'civilization'
          ) {
            inferredList.push(other);
          } else {
            // Also accept if current name explicitly mentions the entity and other does too
            inferredList.push(other);
          }
        }
      }
    });
  }

  // Combine and sort
  const allRelated = [...explicitList, ...inferredList];

  // Group by category
  const byCategory = {
    leaders: [] as FactItem[],
    scholars: [] as FactItem[],
    officials: [] as FactItem[],
    castles: [] as FactItem[],
    battles: [] as FactItem[],
    monuments: [] as FactItem[],
    principalities: [] as FactItem[],
    others: [] as FactItem[],
  };

  allRelated.forEach((item) => {
    const c = getCategoryInfo(item).id;
    if (c === 'leader') byCategory.leaders.push(item);
    else if (c === 'scholar') byCategory.scholars.push(item);
    else if (c === 'official') byCategory.officials.push(item);
    else if (c === 'castle') byCategory.castles.push(item);
    else if (c === 'battle') byCategory.battles.push(item);
    else if (c === 'monument') byCategory.monuments.push(item);
    else if (c === 'principality' || c === 'empire' || c === 'civilization')
      byCategory.principalities.push(item);
    else byCategory.others.push(item);
  });

  return {
    allRelated,
    explicit: explicitList,
    inferred: inferredList,
    parents: parentsList,
    byCategory,
  };
}

/**
 * Connect or disconnect a link between two facts
 */
export function toggleFactLinkInList(
  sourceFactId: number,
  targetFactId: number,
  facts: FactItem[]
): FactItem[] {
  return facts.map((f) => {
    if (f.id === sourceFactId) {
      const existing = Array.isArray(f.relatedFactIds) ? f.relatedFactIds : [];
      const hasLink = existing.includes(targetFactId);
      const nextRelated = hasLink
        ? existing.filter((id) => id !== targetFactId)
        : [...existing, targetFactId];
      return {
        ...f,
        relatedFactIds: nextRelated,
      };
    }
    if (f.id === targetFactId) {
      const existing = Array.isArray(f.relatedFactIds) ? f.relatedFactIds : [];
      const hasLink = existing.includes(sourceFactId);
      const nextRelated = hasLink
        ? existing.filter((id) => id !== sourceFactId)
        : [...existing, sourceFactId];
      return {
        ...f,
        relatedFactIds: nextRelated,
      };
    }
    return f;
  });
}
