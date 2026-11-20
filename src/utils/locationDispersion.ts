import { FactItem } from '../data/kurdishHistoryData';
import {
  KURDISTAN_PROVINCES,
  ProvinceItem,
  getProvinceById,
  getProvinceBounds,
  isPointInProvince,
  isPointInKurdistanPolygon,
  matchFactToProvince,
} from '../data/kurdishProvincesData';

export const DEFAULT_OVERLAP_THRESHOLD_DEG = 0.045; // ~5 km on map
const LNG_SCALE = Math.cos((37 * Math.PI) / 180); // Aspect-ratio scaling for Kurdistan (~37°N)

export function coordDistanceDeg(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = lat1 - lat2;
  const dLng = (lng1 - lng2) * LNG_SCALE;
  return Math.hypot(dLat, dLng);
}

export function isValidCoord(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001)
  );
}

function roundCoord(val: number): number {
  return Math.round(val * 100000) / 100000;
}

function halton(index: number, base: number): number {
  let result = 0;
  let f = 1 / base;
  let i = index;
  while (i > 0) {
    result += f * (i % base);
    i = Math.floor(i / base);
    f /= base;
  }
  return result;
}

function pointToSegDistSq(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return (px - ax) * (px - ax) + (py - ay) * (py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = ax + t * dx;
  const projY = ay + t * dy;
  return (px - projX) * (px - projX) + (py - projY) * (py - projY);
}

function approxEdgeClearanceDeg(lat: number, lng: number, prov: ProvinceItem): number {
  const rings =
    prov.polygons && prov.polygons.length > 0
      ? prov.polygons
      : prov.polygon && prov.polygon.length >= 3
      ? [prov.polygon]
      : [];
  let minSq = Infinity;
  for (const poly of rings) {
    const step = poly.length > 180 ? Math.ceil(poly.length / 180) : 1;
    for (let i = 0; i < poly.length; i += step) {
      const nextIdx = (i + step) % poly.length;
      const d = pointToSegDistSq(
        lat,
        lng * LNG_SCALE,
        poly[i][0],
        poly[i][1] * LNG_SCALE,
        poly[nextIdx][0],
        poly[nextIdx][1] * LNG_SCALE
      );
      if (d < minSq) minSq = d;
    }
  }
  return Number.isFinite(minSq) ? Math.sqrt(minSq) : 0.05;
}

interface CandidatePoint {
  lat: number;
  lng: number;
  clearance: number;
}

const provinceCandidatesCache = new Map<string, CandidatePoint[]>();

function getProvinceInteriorCandidates(prov: ProvinceItem): CandidatePoint[] {
  const cached = provinceCandidatesCache.get(prov.id);
  if (cached) return cached;

  const [[minLat, minLng], [maxLat, maxLng]] = getProvinceBounds(prov);
  const latSpan = Math.max(0.05, maxLat - minLat);
  const lngSpan = Math.max(0.05, maxLng - minLng);

  const candidates: CandidatePoint[] = [];
  const maxSamples = 950;
  for (let i = 1; i <= maxSamples && candidates.length < 320; i++) {
    const u = halton(i, 2);
    const v = halton(i, 3);
    const lat = minLat + u * latSpan;
    const lng = minLng + v * lngSpan;
    if (isPointInProvince(lat, lng, prov)) {
      candidates.push({
        lat,
        lng,
        clearance: approxEdgeClearanceDeg(lat, lng, prov),
      });
    }
  }

  // Fallback fine grid if polygon is very narrow or thin
  if (candidates.length < 24) {
    const gridN = 28;
    for (let r = 1; r < gridN; r++) {
      for (let c = 1; c < gridN; c++) {
        const lat = minLat + (r / gridN) * latSpan;
        const lng = minLng + (c / gridN) * lngSpan;
        if (isPointInProvince(lat, lng, prov)) {
          candidates.push({
            lat,
            lng,
            clearance: approxEdgeClearanceDeg(lat, lng, prov),
          });
        }
      }
    }
  }

  // Always ensure province center is included if inside polygon
  if (isPointInProvince(prov.center[0], prov.center[1], prov)) {
    candidates.push({
      lat: prov.center[0],
      lng: prov.center[1],
      clearance: approxEdgeClearanceDeg(prov.center[0], prov.center[1], prov),
    });
  }

  provinceCandidatesCache.set(prov.id, candidates);
  return candidates;
}

/**
 * Finds the best non-overlapping coordinate strictly inside a Kurdistan province's boundary polygon
 * using Mitchell's Best-Candidate (maximizing minimum distance to existing occupied points).
 */
export function findDispersedPointInProvince(
  prov: ProvinceItem,
  occupiedPoints: Array<{ lat: number; lng: number }>,
  seedOffset = 0
): { lat: number; lng: number } {
  const candidates = getProvinceInteriorCandidates(prov);
  if (candidates.length === 0) {
    // Geometric fallback around province center if polygon is empty
    return findDispersedPointAroundAnchor(prov.center[0], prov.center[1], occupiedPoints, seedOffset, false);
  }

  // Prefer candidates with safe interior clearance (>= 0.02°) if enough exist
  const interiorComfortable = candidates.filter((c) => c.clearance >= 0.02);
  const pool = interiorComfortable.length >= 16 ? interiorComfortable : candidates;

  if (occupiedPoints.length === 0) {
    const pick = pool[Math.abs(seedOffset) % pool.length];
    return { lat: roundCoord(pick.lat), lng: roundCoord(pick.lng) };
  }

  // Only consider occupied points within a generous margin around the province bbox for speed
  const [[minLat, minLng], [maxLat, maxLng]] = getProvinceBounds(prov);
  const nearbyOccupied = occupiedPoints.filter(
    (p) =>
      p.lat >= minLat - 0.5 &&
      p.lat <= maxLat + 0.5 &&
      p.lng >= minLng - 0.5 &&
      p.lng <= maxLng + 0.5
  );
  const checkPoints = nearbyOccupied.length > 0 ? nearbyOccupied : occupiedPoints;

  let bestCand = pool[0];
  let bestScore = -Infinity;

  for (let i = 0; i < pool.length; i++) {
    const idx = (i + Math.abs(seedOffset)) % pool.length;
    const cand = pool[idx];
    let minDist = Infinity;
    for (let j = 0; j < checkPoints.length; j++) {
      const d = coordDistanceDeg(cand.lat, cand.lng, checkPoints[j].lat, checkPoints[j].lng);
      if (d < minDist) minDist = d;
    }
    // Slight preference for points well inside the boundary vs hugging the border
    const score = minDist + Math.min(cand.clearance, 0.05) * 0.25;
    if (score > bestScore) {
      bestScore = score;
      bestCand = cand;
    }
  }

  return {
    lat: roundCoord(bestCand.lat),
    lng: roundCoord(bestCand.lng),
  };
}

/**
 * Disperses points in a Vogel/sunflower spiral around an anchor (used for outside-Kurdistan locations).
 */
export function findDispersedPointAroundAnchor(
  anchorLat: number,
  anchorLng: number,
  occupiedPoints: Array<{ lat: number; lng: number }>,
  seedOffset = 0,
  avoidKurdistanInterior = true
): { lat: number; lng: number } {
  const safeLat = isValidCoord(anchorLat, anchorLng) ? anchorLat : 33.3152;
  const safeLng = isValidCoord(anchorLat, anchorLng) ? anchorLng : 44.3661;
  const anchorInKurdistan = isPointInKurdistanPolygon(safeLat, safeLng);

  const goldenAngle = 2.399963229728653;
  const candidates: Array<{ lat: number; lng: number }> = [];
  const totalRings = 120;
  const maxRadius = 0.28;

  for (let i = 1; i <= totalRings; i++) {
    const r = 0.05 + maxRadius * Math.sqrt(i / totalRings);
    const theta = (i + seedOffset) * goldenAngle;
    const cLat = safeLat + r * Math.sin(theta);
    const cLng = safeLng + (r / LNG_SCALE) * Math.cos(theta);
    if (avoidKurdistanInterior && !anchorInKurdistan && isPointInKurdistanPolygon(cLat, cLng)) {
      continue;
    }
    candidates.push({ lat: cLat, lng: cLng });
  }

  if (candidates.length === 0) {
    return {
      lat: roundCoord(safeLat + 0.055),
      lng: roundCoord(safeLng + 0.055),
    };
  }

  if (occupiedPoints.length === 0) {
    return { lat: roundCoord(candidates[0].lat), lng: roundCoord(candidates[0].lng) };
  }

  let best = candidates[0];
  let bestScore = -Infinity;
  for (const cand of candidates) {
    let minDist = Infinity;
    for (const p of occupiedPoints) {
      const d = coordDistanceDeg(cand.lat, cand.lng, p.lat, p.lng);
      if (d < minDist) minDist = d;
    }
    // Favor minimum distance while keeping reasonably close to original city anchor
    const distFromAnchor = coordDistanceDeg(cand.lat, cand.lng, safeLat, safeLng);
    const score = Math.min(minDist, 0.14) * 2 - distFromAnchor * 0.25;
    if (score > bestScore) {
      bestScore = score;
      best = cand;
    }
  }

  return { lat: roundCoord(best.lat), lng: roundCoord(best.lng) };
}

export function hasNearbyFactOverlap(
  lat: number,
  lng: number,
  facts: Array<{ id?: number; lat: number; lng: number }>,
  excludeFactId?: number,
  minSeparationDeg = DEFAULT_OVERLAP_THRESHOLD_DEG
): boolean {
  if (!isValidCoord(lat, lng)) return true;
  for (const f of facts) {
    if (excludeFactId !== undefined && f.id === excludeFactId) continue;
    if (!isValidCoord(f.lat, f.lng)) continue;
    if (coordDistanceDeg(lat, lng, f.lat, f.lng) < minSeparationDeg) {
      return true;
    }
  }
  return false;
}

export function resolveKurdistanProvinceForFact(fact: {
  id?: number;
  name?: string;
  desc?: string;
  lat: number;
  lng: number;
  provinceId?: string;
  region?: string;
}): ProvinceItem | null {
  if (fact.provinceId) {
    const byId = getProvinceById(fact.provinceId);
    if (byId) return byId;
  }
  const matched = matchFactToProvince(
    {
      id: fact.id || 0,
      num: 0,
      eraId: 1,
      eraName: '',
      eraPeriod: '',
      name: fact.name || '',
      desc: fact.desc || '',
      fullText: '',
      lat: fact.lat,
      lng: fact.lng,
      region: fact.region,
      provinceId: fact.provinceId,
      tag: '',
    },
    'ckb'
  );
  if (matched && matched.inKurdistan) {
    return KURDISTAN_PROVINCES.find((p) => p.id === matched.id) || null;
  }
  return null;
}

export interface DisperseSingleResult {
  lat: number;
  lng: number;
  dispersed: boolean;
  province?: ProvinceItem | null;
}

/**
 * Ensures a newly entered or edited fact coordinate does not overlap any existing fact.
 * If an overlap exists (or `forceDisperse` is true), scatters the point cleanly inside the
 * fact's Kurdistan province boundary (or around its anchor outside Kurdistan).
 */
export function resolveNonOverlappingCoords(params: {
  lat: number;
  lng: number;
  provinceId?: string;
  regionName?: string;
  name?: string;
  desc?: string;
  allFacts: FactItem[];
  excludeFactId?: number;
  minSeparationDeg?: number;
  forceDisperse?: boolean;
}): DisperseSingleResult {
  const {
    lat,
    lng,
    provinceId,
    regionName,
    name,
    desc,
    allFacts,
    excludeFactId,
    minSeparationDeg = DEFAULT_OVERLAP_THRESHOLD_DEG,
    forceDisperse = false,
  } = params;

  const prov = resolveKurdistanProvinceForFact({
    id: excludeFactId,
    name,
    desc,
    lat,
    lng,
    provinceId: provinceId?.trim() || undefined,
    region: regionName?.trim() || undefined,
  });

  const occupied = allFacts
    .filter((f) => (excludeFactId === undefined || f.id !== excludeFactId) && isValidCoord(f.lat, f.lng))
    .map((f) => ({ lat: f.lat, lng: f.lng }));

  const needsDisperse =
    forceDisperse ||
    !isValidCoord(lat, lng) ||
    hasNearbyFactOverlap(lat, lng, occupied, undefined, minSeparationDeg);

  if (!needsDisperse) {
    return {
      lat: roundCoord(lat),
      lng: roundCoord(lng),
      dispersed: false,
      province: prov,
    };
  }

  const seed = Math.abs(Math.round((excludeFactId || Date.now()) % 997));
  if (prov) {
    const nextPt = findDispersedPointInProvince(prov, occupied, seed);
    return {
      lat: nextPt.lat,
      lng: nextPt.lng,
      dispersed: true,
      province: prov,
    };
  }

  const nextPt = findDispersedPointAroundAnchor(lat, lng, occupied, seed);
  return {
    lat: nextPt.lat,
    lng: nextPt.lng,
    dispersed: true,
    province: null,
  };
}

export interface LocationFixPlanItem {
  fact: FactItem;
  oldLat: number;
  oldLng: number;
  newLat: number;
  newLng: number;
  provinceId?: string;
  provinceNameCkb: string;
  provinceNameEn: string;
}

/**
 * Scans all facts and prepares a deterministic dispersion plan for any overlapping points
 * (within `minSeparationDeg`) or invalid coordinates, keeping the earliest/primary entry
 * anchored and dispersing duplicates inside their respective province boundaries.
 */
export function analyzeOverlappingFactLocations(
  facts: FactItem[],
  minSeparationDeg = DEFAULT_OVERLAP_THRESHOLD_DEG
): LocationFixPlanItem[] {
  if (!facts || facts.length === 0) return [];

  // Process primary/older entries first so existing anchor landmarks stay put and duplicates disperse
  const sorted = [...facts].sort((a, b) => {
    const aCustom = Boolean(a.isCustom || a.id > 1000000);
    const bCustom = Boolean(b.isCustom || b.id > 1000000);
    if (aCustom !== bCustom) return aCustom ? 1 : -1;
    if (a.num !== b.num) return a.num - b.num;
    return a.id - b.id;
  });

  const anchors: Array<{ lat: number; lng: number }> = [];
  const toFix: FactItem[] = [];

  for (const fact of sorted) {
    if (!isValidCoord(fact.lat, fact.lng)) {
      toFix.push(fact);
      continue;
    }
    const overlapsAnchor = anchors.some(
      (a) => coordDistanceDeg(fact.lat, fact.lng, a.lat, a.lng) < minSeparationDeg
    );
    if (overlapsAnchor) {
      toFix.push(fact);
    } else {
      anchors.push({ lat: fact.lat, lng: fact.lng });
    }
  }

  if (toFix.length === 0) return [];

  const occupied = [...anchors];
  const plan: LocationFixPlanItem[] = [];

  for (let idx = 0; idx < toFix.length; idx++) {
    const fact = toFix[idx];
    const prov = resolveKurdistanProvinceForFact(fact);
    const matchedAny = matchFactToProvince(fact, 'ckb');
    const matchedEn = matchFactToProvince(fact, 'en');

    const nextCoord = prov
      ? findDispersedPointInProvince(prov, occupied, idx * 17 + fact.id)
      : findDispersedPointAroundAnchor(fact.lat, fact.lng, occupied, idx * 17 + fact.id);

    occupied.push(nextCoord);

    plan.push({
      fact,
      oldLat: fact.lat,
      oldLng: fact.lng,
      newLat: nextCoord.lat,
      newLng: nextCoord.lng,
      provinceId: prov?.id || fact.provinceId || matchedAny?.id,
      provinceNameCkb: prov?.name || matchedAny?.name || fact.region || 'دەرەوەی کوردستان',
      provinceNameEn: prov?.nameEn || matchedEn?.name || fact.region || 'Outside Kurdistan',
    });
  }

  return plan;
}
