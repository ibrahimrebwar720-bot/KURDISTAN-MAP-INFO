import { FactItem } from '../data/kurdishHistoryData';
import { getCategoryInfo } from '../types/history';

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
 * Returns only explicitly user-linked facts for a given fact:
 * 1. Explicitly linked via relatedFactIds (selected by user)
 * 2. Explicitly linked via parentFactId (parent-child hierarchy selected by user)
 * 3. Reverse explicit links (where user selected this fact as parent or related on another item)
 *
 * NOTE: Automatic / inferred keyword linking is completely disabled as per user instruction.
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

  // 1. Check user-defined parent link
  if (typeof currentFact.parentFactId === 'number') {
    const parent = allFacts.find((f) => f.id === currentFact.parentFactId);
    if (parent && parent.id !== currentFact.id) {
      explicitIds.add(parent.id);
      explicitList.push(parent);
      parentsList.push(parent);
    }
  }

  // 2. Check user-defined relatedFactIds
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

  // 3. Check reverse: other facts that have user-defined parentFactId === currentFact.id or relatedFactIds containing currentFact.id
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

  // Only explicit user-added links
  const allRelated = explicitList;

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
    inferred: [],
    parents: parentsList,
    byCategory,
  };
}

/**
 * Connect or disconnect a link between two facts (user action)
 */
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
