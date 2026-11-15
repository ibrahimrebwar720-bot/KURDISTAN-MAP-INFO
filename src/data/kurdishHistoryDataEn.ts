import type { FactItem } from './kurdishHistoryData';

/**
 * Optional Static English Baseline Snapshot (derived from the Central Kurdish `ckb` Knowledge Base).
 * Admin can export a snapshot from the AI Translator Studio and paste entries here
 * so visitors loading English mode see translated topics instantaneously before Firestore syncs.
 * Live updates and newer translations in Firestore `facts_en` always override entries here by `id`.
 */
export const STATIC_ENGLISH_FACTS: FactItem[] = [];
