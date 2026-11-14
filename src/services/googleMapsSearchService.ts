/**
 * Google Maps & Geocoding Search Service for Kurdish History App
 * Provides place search and authoritative Google Administrative Boundary (Admin Level 1 & 2)
 * reverse-geocoding for accurate province classification.
 * Uses Google Maps Platform Geocoding REST API (per GMP v2025+ non-legacy guidelines)
 * with strict quota defense and Nominatim/geometry fallback.
 */

import { FactItem } from '../data/kurdishHistoryData';
import {
  getCachedGoogleProvince,
  setCachedGoogleProvince,
  mapGoogleAddressToProvince,
  matchFactToProvince,
} from '../data/kurdishProvincesData';

export interface PlaceSearchResult {
  id: string;
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  source: 'google' | 'osm';
  countryCode?: string;
  adminLevel1?: string;
  adminLevel2?: string;
  locality?: string;
  provinceId?: string;
  provinceName?: string;
  inKurdistan?: boolean;
}

export interface GoogleReverseGeocodeResult {
  country: string;
  countryCode: string;
  adminLevel1: string;
  adminLevel2: string;
  locality: string;
  formattedAddress: string;
  provinceId: string;
  provinceName: string;
  inKurdistan: boolean;
  bounds?: [[number, number], [number, number]];
  source: 'google' | 'osm' | 'geometry';
}

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBoF3qz_hdH2a2n_KfCyegJVcMNbCrXTds';

let isGoogleMapsLoaded = false;
let googleMapsLoadPromise: Promise<boolean> | null = null;
let isQuotaExhaustedSession = false;

function triggerQuotaExceeded(): void {
  isQuotaExhaustedSession = true;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
}

/**
 * Dynamically load Google Maps JavaScript API when needed
 */
export function loadGoogleMapsScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if ((window as any).google && (window as any).google.maps) {
    isGoogleMapsLoaded = true;
    return Promise.resolve(true);
  }

  if (googleMapsLoadPromise) return googleMapsLoadPromise;

  googleMapsLoadPromise = new Promise<boolean>((resolve) => {
    const existing = document.getElementById('google-maps-script');
    if (existing) {
      existing.addEventListener('load', () => {
        isGoogleMapsLoaded = true;
        resolve(true);
      });
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&language=en`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      isGoogleMapsLoaded = true;
      resolve(true);
    };

    script.onerror = (err) => {
      console.warn('Google Maps script load notice, will use REST geocoding fallback:', err);
      resolve(false);
    };

    document.head.appendChild(script);
  });

  return googleMapsLoadPromise;
}

function parseGoogleAddressComponents(components: any[] = []): {
  country: string;
  countryCode: string;
  adminLevel1: string;
  adminLevel2: string;
  locality: string;
} {
  let country = '';
  let countryCode = '';
  let adminLevel1 = '';
  let adminLevel2 = '';
  let locality = '';

  for (const comp of components) {
    const types: string[] = Array.isArray(comp.types) ? comp.types : [];
    if (types.includes('country')) {
      country = comp.long_name || '';
      countryCode = comp.short_name || '';
    } else if (types.includes('administrative_area_level_1')) {
      adminLevel1 = comp.long_name || '';
    } else if (types.includes('administrative_area_level_2')) {
      adminLevel2 = comp.long_name || '';
    } else if (types.includes('locality') || types.includes('administrative_area_level_3')) {
      if (!locality) locality = comp.long_name || '';
    }
  }

  return { country, countryCode, adminLevel1, adminLevel2, locality };
}

/**
 * Search locations using Google Maps Geocoding REST API (Section 5 non-legacy replacement)
 * Replacement doc: https://developers.google.com/maps/documentation/geocoding/requests-geocoding?utm_campaign=gmp_mcp_codeassist_v1_aistudio
 */
async function searchWithGoogleGeocodeApi(query: string): Promise<PlaceSearchResult[]> {
  if (!GOOGLE_MAPS_API_KEY || isQuotaExhaustedSession) return [];

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      query
    )}&bounds=30.0,36.0|42.0,52.0&language=en&key=${GOOGLE_MAPS_API_KEY}`;

    const res = await fetch(url);
    if (res.status === 429) {
      triggerQuotaExceeded();
      return [];
    }

    const data = await res.json();
    if (data?.status === 'OVER_QUERY_LIMIT' || data?.error?.status === 'RESOURCE_EXHAUSTED') {
      triggerQuotaExceeded();
      return [];
    }

    if (data?.status !== 'OK' || !Array.isArray(data?.results) || data.results.length === 0) {
      return [];
    }

    return data.results.slice(0, 5).map((r: any, i: number) => {
      const loc = r.geometry?.location || {};
      const lat = Number(loc.lat);
      const lng = Number(loc.lng);
      const parsed = parseGoogleAddressComponents(r.address_components);
      const mapped = mapGoogleAddressToProvince({
        ...parsed,
        lat,
        lng,
      });

      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        setCachedGoogleProvince(lat, lng, {
          provinceId: mapped.provinceId,
          provinceName: mapped.provinceName,
          inKurdistan: mapped.inKurdistan,
          countryCode: parsed.countryCode,
          adminLevel1: parsed.adminLevel1,
          adminLevel2: parsed.adminLevel2,
          locality: parsed.locality,
          formattedAddress: r.formatted_address || '',
        });
      }

      return {
        id: `google_${r.place_id || i}`,
        name: r.address_components?.[0]?.long_name || (r.formatted_address || '').split(',')[0],
        formattedAddress: r.formatted_address || '',
        lat,
        lng,
        source: 'google' as const,
        countryCode: parsed.countryCode,
        adminLevel1: parsed.adminLevel1,
        adminLevel2: parsed.adminLevel2,
        locality: parsed.locality,
        provinceId: mapped.provinceId,
        provinceName: mapped.provinceName,
        inKurdistan: mapped.inKurdistan,
      };
    });
  } catch (e) {
    console.warn('Google geocode search notice:', e);
    return [];
  }
}

/**
 * Reverse geocode a coordinate pair (lat, lng) using Google Geocoding REST API
 * to determine exact administrative boundaries (adminLevel1, adminLevel2, country).
 */
export async function reverseGeocodeProvinceWithGoogle(
  lat: number,
  lng: number,
  options?: { skipCache?: boolean }
): Promise<GoogleReverseGeocodeResult> {
  if (!options?.skipCache) {
    const cached = getCachedGoogleProvince(lat, lng);
    if (cached) {
      return {
        country: '',
        countryCode: cached.countryCode,
        adminLevel1: cached.adminLevel1,
        adminLevel2: cached.adminLevel2,
        locality: cached.locality,
        formattedAddress: cached.formattedAddress,
        provinceId: cached.provinceId,
        provinceName: cached.provinceName,
        inKurdistan: cached.inKurdistan,
        source: 'google',
      };
    }
  }

  // 1. Primary: Google Maps Platform Geocoding REST API
  if (GOOGLE_MAPS_API_KEY && !isQuotaExhaustedSession) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat.toFixed(6)},${lng.toFixed(
        6
      )}&language=en&key=${GOOGLE_MAPS_API_KEY}`;

      const res = await fetch(url);
      if (res.status === 429) {
        triggerQuotaExceeded();
      } else {
        const data = await res.json();
        if (data?.status === 'OVER_QUERY_LIMIT' || data?.error?.status === 'RESOURCE_EXHAUSTED') {
          triggerQuotaExceeded();
        } else if (data?.status === 'OK' && Array.isArray(data?.results) && data.results.length > 0) {
          // Merge address components across top results so adminLevel1/adminLevel2 are always captured
          const merged = {
            country: '',
            countryCode: '',
            adminLevel1: '',
            adminLevel2: '',
            locality: '',
          };

          let adminBounds: [[number, number], [number, number]] | undefined;

          for (const item of data.results) {
            const parsed = parseGoogleAddressComponents(item.address_components);
            if (!merged.country && parsed.country) merged.country = parsed.country;
            if (!merged.countryCode && parsed.countryCode) merged.countryCode = parsed.countryCode;
            if (!merged.adminLevel1 && parsed.adminLevel1) merged.adminLevel1 = parsed.adminLevel1;
            if (!merged.adminLevel2 && parsed.adminLevel2) merged.adminLevel2 = parsed.adminLevel2;
            if (!merged.locality && parsed.locality) merged.locality = parsed.locality;

            const types: string[] = Array.isArray(item.types) ? item.types : [];
            if (!adminBounds && types.includes('administrative_area_level_1') && item.geometry?.viewport) {
              const vp = item.geometry.viewport;
              adminBounds = [
                [vp.southwest.lat, vp.southwest.lng],
                [vp.northeast.lat, vp.northeast.lng],
              ];
            }
          }

          const mapped = mapGoogleAddressToProvince({
            ...merged,
            lat,
            lng,
          });

          const formattedAddress = data.results[0]?.formatted_address || '';

          setCachedGoogleProvince(lat, lng, {
            provinceId: mapped.provinceId,
            provinceName: mapped.provinceName,
            inKurdistan: mapped.inKurdistan,
            countryCode: merged.countryCode,
            adminLevel1: merged.adminLevel1,
            adminLevel2: merged.adminLevel2,
            locality: merged.locality,
            formattedAddress,
          });

          return {
            ...merged,
            formattedAddress,
            provinceId: mapped.provinceId,
            provinceName: mapped.provinceName,
            inKurdistan: mapped.inKurdistan,
            bounds: adminBounds,
            source: 'google',
          };
        }
      }
    } catch (e) {
      console.warn('Google reverse geocode error:', e);
    }
  }

  // 2. Fallback: Nominatim/OSM reverse geocode if Google failed or offline
  try {
    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1&accept-language=en`;
    const osmRes = await fetch(osmUrl);
    if (osmRes.ok) {
      const osmData = await osmRes.json();
      const addr = osmData?.address || {};
      const countryCode = (addr.country_code || '').toUpperCase();
      const adminLevel1 = addr.state || addr.province || addr.region || '';
      const adminLevel2 = addr.county || addr.district || addr.state_district || '';
      const locality = addr.city || addr.town || addr.village || '';
      const mapped = mapGoogleAddressToProvince({
        country: addr.country || '',
        countryCode,
        adminLevel1,
        adminLevel2,
        locality,
        lat,
        lng,
      });

      setCachedGoogleProvince(lat, lng, {
        provinceId: mapped.provinceId,
        provinceName: mapped.provinceName,
        inKurdistan: mapped.inKurdistan,
        countryCode,
        adminLevel1,
        adminLevel2,
        locality,
        formattedAddress: osmData?.display_name || '',
      });

      return {
        country: addr.country || '',
        countryCode,
        adminLevel1,
        adminLevel2,
        locality,
        formattedAddress: osmData?.display_name || '',
        provinceId: mapped.provinceId,
        provinceName: mapped.provinceName,
        inKurdistan: mapped.inKurdistan,
        source: 'osm',
      };
    }
  } catch {
    // ignore OSM fallback error
  }

  // 3. Final fallback: Local geometric polygon check
  const geomMatched = matchFactToProvince({
    id: 0,
    num: 0,
    eraId: 1,
    eraName: '',
    eraPeriod: '',
    name: '',
    desc: '',
    fullText: '',
    lat,
    lng,
    tag: '',
  });

  return {
    country: '',
    countryCode: '',
    adminLevel1: '',
    adminLevel2: '',
    locality: '',
    formattedAddress: '',
    provinceId: geomMatched?.id || 'outside_global',
    provinceName: geomMatched?.name || 'دەرەوەی هێڵی کوردستان',
    inKurdistan: !!geomMatched?.inKurdistan,
    source: 'geometry',
  };
}

/**
 * Verify and resolve province boundaries for a batch of facts via Google Geocoding API.
 * Skips facts that already have cached Google results or explicit provinceId (unless force=true).
 */
export async function verifyFactsProvincesWithGoogle(
  facts: FactItem[],
  options?: {
    force?: boolean;
    onProgress?: (done: number, total: number) => void;
    onResolvedFact?: (fact: FactItem, result: GoogleReverseGeocodeResult) => void;
  }
): Promise<{
  checkedCount: number;
  updatedCount: number;
  quotaHit: boolean;
}> {
  const candidates = facts.filter((f) => {
    if (!Number.isFinite(f.lat) || !Number.isFinite(f.lng)) return false;
    if (f.lat === 0 && f.lng === 0) return false;
    if (options?.force) return true;
    return !getCachedGoogleProvince(f.lat, f.lng);
  });

  if (candidates.length === 0) {
    return { checkedCount: 0, updatedCount: 0, quotaHit: false };
  }

  let checkedCount = 0;
  let updatedCount = 0;

  for (const fact of candidates) {
    if (isQuotaExhaustedSession) {
      return { checkedCount, updatedCount, quotaHit: true };
    }

    const res = await reverseGeocodeProvinceWithGoogle(fact.lat, fact.lng, {
      skipCache: !!options?.force,
    });
    checkedCount++;
    if (res.source === 'google' || res.source === 'osm') {
      updatedCount++;
      options?.onResolvedFact?.(fact, res);
    }
    options?.onProgress?.(checkedCount, candidates.length);

    // Gentle pacing to avoid burst rate limits
    await new Promise((r) => setTimeout(r, 90));
  }

  return { checkedCount, updatedCount, quotaHit: isQuotaExhaustedSession };
}

/**
 * Fallback Geocoding via Nominatim/OSM with Kurdistan regional priority
 */
async function searchWithNominatim(query: string): Promise<PlaceSearchResult[]> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&limit=5&addressdetails=1&accept-language=ckb,ku,ar,en`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'ku,ckb,ar,en',
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => {
      const lat = parseFloat(item.lat);
      const lng = parseFloat(item.lon);
      const addr = item.address || {};
      const mapped = mapGoogleAddressToProvince({
        country: addr.country || '',
        countryCode: (addr.country_code || '').toUpperCase(),
        adminLevel1: addr.state || addr.province || '',
        adminLevel2: addr.county || addr.district || '',
        locality: addr.city || addr.town || addr.village || '',
        lat,
        lng,
      });

      return {
        id: `osm_${item.place_id}`,
        name: item.name || item.display_name.split(',')[0],
        formattedAddress: item.display_name,
        lat,
        lng,
        source: 'osm',
        countryCode: (addr.country_code || '').toUpperCase(),
        adminLevel1: addr.state || addr.province || '',
        adminLevel2: addr.county || addr.district || '',
        locality: addr.city || addr.town || addr.village || '',
        provinceId: mapped.provinceId,
        provinceName: mapped.provinceName,
        inKurdistan: mapped.inKurdistan,
      };
    });
  } catch (err) {
    console.warn('Nominatim fallback error:', err);
    return [];
  }
}

/**
 * Main search function: searches Google Maps Geocoding API first, and falls back to Nominatim if needed
 */
export async function searchPlacesOnMap(query: string): Promise<PlaceSearchResult[]> {
  const clean = query.trim();
  if (!clean || clean.length < 2) return [];

  try {
    const googleResults = await searchWithGoogleGeocodeApi(clean);
    if (googleResults.length > 0) {
      return googleResults;
    }

    const osmResults = await searchWithNominatim(clean);
    return osmResults;
  } catch {
    return [];
  }
}
