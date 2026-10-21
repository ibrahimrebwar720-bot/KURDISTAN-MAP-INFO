import { FactItem } from '../data/kurdishHistoryData';
import { getCategoryInfo } from '../types/history';
import { getFactChronologicalYear } from './yearUtils';

/**
 * Finds all explicitly user-linked facts for a given fact:
 * 1. Explicit children: other.parentFactId === fact.id (user-assigned)
 * 2. Explicit parent: other.id === fact.parentFactId (user-assigned)
 * 3. Explicit related IDs: fact.relatedFactIds contains other.id or vice versa (user-assigned)
 *
 * NOTE: Automatic keyword linking has been removed so only user-added connections appear.
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
 * Finds the explicit parent principality / empire / civilization fact for a fact (if assigned by user)
 */
export function getParentFactForFact(fact: FactItem | null | undefined, allFacts: FactItem[]): FactItem | null {
  if (!fact || !Array.isArray(allFacts)) return null;

  // Explicit parentFactId only
  if (typeof fact.parentFactId === 'number') {
    const found = allFacts.find((f) => f.id === fact.parentFactId);
    if (found) return found;
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
    } else if (cat === 'scholar') {
      groups.scholars.push(f);
    } else if (cat === 'battle') {
      groups.battles.push(f);
    } else {
      groups.others.push(f);
    }
  });

  return groups;
}
