import { FactItem } from '../data/kurdishHistoryData';
import { normalizeKurdishSearchText } from './kurdishSearch';

export interface DuplicateNotesMismatch {
  fact: FactItem;
  likelySourceFact: FactItem;
}

const STOP_WORDS = new Set([
  'شاری',
  'میرنشینی',
  'دەوڵەتی',
  'ئیمپراتۆریەتی',
  'قەڵای',
  'ئەشکەوتی',
  'شاخی',
  'چیای',
  'میر',
  'پاشا',
  'خان',
  'بەگ',
  'شێخ',
  'مەلا',
  'ئەمیر',
  'سەید',
  'حاجی',
  'مەزن',
  'یەکەم',
  'دووەم',
  'بووە',
  'بەڵام',
  'لەگەڵ',
  'دواتر',
  'ساڵی',
  'سەردەمی',
  'کوردستان',
  'مێژوویی',
  'ئەمەش',
  'کاتێک',
  'هەروەها',
  'بەهۆی',
  'کردووە',
  'دەسەڵاتی',
  'ناوچەی',
  'پاشان',
  'خۆی',
  'لەو',
  'ئەو',
  'ئەم',
  'لەسەر',
  'لەلایەن',
  'بۆیە',
  'چەند',
  'یەکێک',
]);

function phoneticKurdish(text: string): string {
  return normalizeKurdishSearchText(text)
    .replace(/[«»"'()[\]{}.,،؛:!؟?\-–—]/g, ' ')
    .replace(/ەی/g, 'ی')
    .replace(/ێ/g, 'ی')
    .replace(/ڵ/g, 'ل')
    .replace(/ڕ/g, 'ر')
    .replace(/ۆ/g, 'و')
    .replace(/ه/g, 'ە')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts meaningful keywords from a fact's title and fullText to check whether
 * a shared `additionalNotes` block belongs to this fact or was accidentally copied from another fact.
 */
function scoreNotesOwnership(fact: FactItem, notesNorm: string): number {
  let score = 0;
  const notesPhon = phoneticKurdish(notesNorm);
  const rawName = (fact.name || '').replace(/\(.*?\)/g, '').trim();
  const nameNorm = normalizeKurdishSearchText(rawName);
  const namePhon = phoneticKurdish(rawName);

  if (nameNorm.length >= 3 && notesNorm.includes(nameNorm)) {
    score += 100;
  } else if (namePhon.length >= 3 && notesPhon.includes(namePhon)) {
    score += 90;
  }
  if (nameNorm.length >= 3 && notesNorm.slice(0, 120).includes(nameNorm)) {
    score += 80;
  } else if (namePhon.length >= 3 && notesPhon.slice(0, 120).includes(namePhon)) {
    score += 70;
  }

  const nameTokens = namePhon
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !STOP_WORDS.has(t));

  for (const tok of nameTokens) {
    if (notesPhon.includes(tok)) {
      score += 30;
      if (notesPhon.slice(0, 160).includes(tok)) {
        score += 20;
      }
    }
  }

  // Also compare distinctive keywords from fullText against additionalNotes
  const fullPhon = phoneticKurdish(fact.fullText || '');
  if (fullPhon) {
    const seen = new Set<string>();
    const fullTokens = fullPhon
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 4 && !STOP_WORDS.has(t));
    for (const tok of fullTokens) {
      if (seen.has(tok)) continue;
      seen.add(tok);
      if (notesPhon.includes(tok)) {
        score += 8;
      }
    }
  }

  return score;
}

/**
 * Finds facts whose `additionalNotes` is an exact duplicate of another fact's `additionalNotes`
 * and likely belongs to that other fact rather than this fact.
 */
export function findMismatchedDuplicateNotesFacts(facts: FactItem[]): DuplicateNotesMismatch[] {
  const groups = new Map<string, FactItem[]>();

  for (const fact of facts) {
    const notes = (fact.additionalNotes || '').trim();
    if (notes.length < 60) continue;
    const signature = normalizeKurdishSearchText(notes.slice(0, 140));
    if (signature.length < 40) continue;
    const list = groups.get(signature) || [];
    list.push(fact);
    groups.set(signature, list);
  }

  const mismatches: DuplicateNotesMismatch[] = [];

  for (const [, group] of groups.entries()) {
    if (group.length < 2) continue;
    const sampleNotesNorm = normalizeKurdishSearchText(group[0].additionalNotes || '');

    const ranked = [...group].sort((a, b) => {
      const scoreA = scoreNotesOwnership(a, sampleNotesNorm);
      const scoreB = scoreNotesOwnership(b, sampleNotesNorm);
      if (scoreB !== scoreA) return scoreB - scoreA;
      return (a.updatedAt || a.id) - (b.updatedAt || b.id);
    });

    const owner = ranked[0];
    for (let i = 1; i < ranked.length; i++) {
      const suspect = ranked[i];
      const suspectScore = scoreNotesOwnership(suspect, sampleNotesNorm);
      const ownerScore = scoreNotesOwnership(owner, sampleNotesNorm);
      // Flag if suspect either has lower ownership score or was updated after the owner
      if (suspectScore < ownerScore || (suspect.updatedAt || 0) > (owner.updatedAt || 0)) {
        mismatches.push({
          fact: suspect,
          likelySourceFact: owner,
        });
      }
    }
  }

  return mismatches;
}

/**
 * Checks if a single fact's `additionalNotes` duplicates another fact in `allFacts`.
 */
export function findDuplicateNotesOwnerForFact(
  fact: Partial<FactItem> | null | undefined,
  notesText: string,
  allFacts: FactItem[]
): FactItem | null {
  const trimmed = (notesText || '').trim();
  if (trimmed.length < 60 || !allFacts.length) return null;

  const sig = normalizeKurdishSearchText(trimmed.slice(0, 140));
  if (sig.length < 40) return null;

  const matches = allFacts.filter((other) => {
    if (fact?.id && other.id === fact.id) return false;
    const otherNotes = (other.additionalNotes || '').trim();
    if (otherNotes.length < 60) return false;
    return normalizeKurdishSearchText(otherNotes.slice(0, 140)) === sig;
  });

  if (matches.length === 0) return null;

  const sampleNorm = normalizeKurdishSearchText(trimmed);
  const currentScore = fact?.name ? scoreNotesOwnership(fact as FactItem, sampleNorm) : 0;

  const sortedOwners = [...matches].sort((a, b) => {
    const sa = scoreNotesOwnership(a, sampleNorm);
    const sb = scoreNotesOwnership(b, sampleNorm);
    if (sb !== sa) return sb - sa;
    return (a.updatedAt || a.id) - (b.updatedAt || b.id);
  });

  const bestOther = sortedOwners[0];
  const bestOtherScore = scoreNotesOwnership(bestOther, sampleNorm);

  if (bestOtherScore > currentScore) {
    return bestOther;
  }

  if (bestOtherScore === currentScore) {
    const factTime = fact?.updatedAt || fact?.id || 0;
    const otherTime = bestOther.updatedAt || bestOther.id || 0;
    if (factTime > otherTime) {
      return bestOther;
    }
  }

  return null;
}
