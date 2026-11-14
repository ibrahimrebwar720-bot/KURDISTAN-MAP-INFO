import { FactItem } from '../data/kurdishHistoryData';
import { getCategoryInfo } from '../types/history';
import type { AppLanguage } from '../context/LanguageContext';

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

  if (typeof currentFact.parentFactId === 'number') {
    const parent = allFacts.find((f) => f.id === currentFact.parentFactId);
    if (parent && parent.id !== currentFact.id) {
      explicitIds.add(parent.id);
      explicitList.push(parent);
      parentsList.push(parent);
    }
  }

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

  const allRelated = explicitList;

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
    inferred: [],
    parents: parentsList,
    byCategory,
  };
}

export function toggleFactLinkInList(
  sourceFactId: number,
  targetFactId: number,
  facts: FactItem[]
): FactItem[] {
  return facts.map((f) => {
    if (f.id === sourceFactId) {
      const existing = Array.isArray(f.relatedFactIds) ? f.relatedFactIds : [];
      const has = existing.includes(targetFactId);
      const nextRelated = has
        ? existing.filter((id) => id !== targetFactId)
        : [...existing, targetFactId];

      return {
        ...f,
        relatedFactIds: nextRelated,
      };
    }
    if (f.id === targetFactId) {
      const existing = Array.isArray(f.relatedFactIds) ? f.relatedFactIds : [];
      const has = existing.includes(sourceFactId);
      const nextRelated = has
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

export interface KnowledgeGraphLink {
  source: FactItem;
  target: FactItem;
  relationType: 'parent' | 'ruler' | 'scholar' | 'castle' | 'battle' | 'city' | 'ally' | 'related';
  label: string;
  isDirectParent: boolean;
  color: string;
}

export interface KnowledgeGraphNetwork {
  centerFact: FactItem;
  nodes: FactItem[];
  links: KnowledgeGraphLink[];
  parentFact: FactItem | null;
}

export function getKnowledgeGraphNetwork(
  centerFact: FactItem | null | undefined,
  allFacts: FactItem[],
  lang: AppLanguage = 'ckb'
): KnowledgeGraphNetwork | null {
  if (!centerFact || !Array.isArray(allFacts) || allFacts.length === 0) {
    return null;
  }

  const nodesMap = new Map<number, FactItem>();
  const links: KnowledgeGraphLink[] = [];
  const addedLinkKeys = new Set<string>();
  const isEn = lang === 'en';

  const getRelationColor = (relationType: string, isParent: boolean) => {
    if (isParent) return '#eab308';
    switch (relationType) {
      case 'ruler':
        return '#f59e0b';
      case 'castle':
        return '#38bdf8';
      case 'battle':
        return '#f43f5e';
      case 'scholar':
        return '#a855f7';
      case 'city':
        return '#10b981';
      default:
        return '#06b6d4';
    }
  };

  const getRelationLabel = (target: FactItem, isParent: boolean) => {
    if (isParent) return isEn ? 'Parent Power' : 'دەسەڵاتی دایک';
    const cat = getCategoryInfo(target, lang).id;
    if (cat === 'castle') return isEn ? 'Castle & Fortress' : 'قەڵا و سەنگەر';
    if (cat === 'battle') return isEn ? 'Decisive Battle' : 'جەنگی چارەنووسساز';
    if (cat === 'leader') return isEn ? 'Ruler / Leader' : 'فەرمانڕەوا / سەرکردە';
    if (cat === 'scholar') return isEn ? 'Scholar & Poet' : 'زانا و ئەدیب';
    if (cat === 'principality' || cat === 'empire') return isEn ? 'Allied Power' : 'دەسەڵاتی هاوپەیمان';
    if (cat === 'monument') return isEn ? 'Historical Monument' : 'ئاسەواری مێژوویی';
    return isEn ? 'Related' : 'پەیوەندیدار';
  };

  const getRelationType = (target: FactItem, isParent: boolean): KnowledgeGraphLink['relationType'] => {
    if (isParent) return 'parent';
    const cat = getCategoryInfo(target, lang).id;
    if (cat === 'leader') return 'ruler';
    if (cat === 'castle') return 'castle';
    if (cat === 'battle') return 'battle';
    if (cat === 'scholar') return 'scholar';
    if (cat === 'principality' || cat === 'empire') return 'ally';
    return 'related';
  };

  const addLink = (source: FactItem, target: FactItem, isParent: boolean, customLabel?: string) => {
    if (source.id === target.id) return;
    const key = [Math.min(source.id, target.id), Math.max(source.id, target.id)].join('-');
    if (addedLinkKeys.has(key)) return;
    addedLinkKeys.add(key);

    nodesMap.set(target.id, target);

    const relType = getRelationType(target, isParent);
    const label = customLabel || getRelationLabel(target, isParent);
    const color = getRelationColor(relType, isParent);

    links.push({
      source,
      target,
      relationType: relType,
      label,
      isDirectParent: isParent,
      color,
    });
  };

  let resolvedParent: FactItem | null = null;
  if (typeof centerFact.parentFactId === 'number') {
    resolvedParent = allFacts.find((f) => f.id === centerFact.parentFactId) || null;
  }

  if (resolvedParent) {
    addLink(centerFact, resolvedParent, true, isEn ? 'Parent Power' : 'دەسەڵاتی دایک');
  }

  allFacts.forEach((f) => {
    if (f.id === centerFact.id) return;

    if (f.parentFactId === centerFact.id) {
      addLink(centerFact, f, false);
      return;
    }

    if (Array.isArray(centerFact.relatedFactIds) && centerFact.relatedFactIds.includes(f.id)) {
      addLink(centerFact, f, false);
      return;
    }

    if (Array.isArray(f.relatedFactIds) && f.relatedFactIds.includes(centerFact.id)) {
      addLink(centerFact, f, false);
      return;
    }

    if (Array.isArray(centerFact.allyFactIds) && centerFact.allyFactIds.includes(f.id)) {
      addLink(centerFact, f, false, isEn ? 'Ally' : 'هاوپەیمان');
      return;
    }

    if (Array.isArray(f.allyFactIds) && f.allyFactIds.includes(centerFact.id)) {
      addLink(centerFact, f, false, isEn ? 'Ally' : 'هاوپەیمان');
      return;
    }
  });

  return {
    centerFact,
    nodes: Array.from(nodesMap.values()),
    links,
    parentFact: resolvedParent,
  };
}
