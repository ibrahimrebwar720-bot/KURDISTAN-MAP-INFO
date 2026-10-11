/**
 * Google Maps & Geocoding Search Service for Kurdish History App
 * Provides instant search for historical sites, cities, castles, and regions.
 * Loads Google Maps Platform Geocoder & Places with fallback to ensure 100% reliability.
 */

export interface PlaceSearchResult {
  id: string;
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  source: 'google' | 'osm';
}

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBoF3qz_hdH2a2n_KfCyegJVcMNbCrXTds';

let isGoogleMapsLoaded = false;
let googleMapsLoadPromise: Promise<boolean> | null = null;

/**
 * Dynamically load Google Maps JavaScript API with Places and Geocoding libraries
 */
export function loadGoogleMapsScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if ((window as any).google && (window as any).google.maps) {
    isGoogleMapsLoaded = true;
    return Promise.resolve(true);
  }

  if (googleMapsLoadPromise) return googleMapsLoadPromise;

  googleMapsLoadPromise = new Promise<boolean>((resolve) => {
    // Check if script tag already exists
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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&language=ckb,ar,en`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      isGoogleMapsLoaded = true;
      resolve(true);
    };

    script.onerror = (err) => {
      console.warn('Google Maps script load notice, will use geocoding fallback:', err);
      resolve(false);
    };

    document.head.appendChild(script);
  });

  return googleMapsLoadPromise;
}

/**
 * Search locations using Google Maps Geocoder
 */
async function searchWithGoogleMaps(query: string): Promise<PlaceSearchResult[]> {
  const loaded = await loadGoogleMapsScript();
  if (!loaded || !(window as any).google || !(window as any).google.maps) {
    return [];
  }

  return new Promise((resolve) => {
    try {
      const geocoder = new (window as any).google.maps.Geocoder();
      // Bias search towards Greater Kurdistan bounds
      const bounds = new (window as any).google.maps.LatLngBounds(
        new (window as any).google.maps.LatLng(31.0, 36.0),
        new (window as any).google.maps.LatLng(42.0, 52.0)
      );

      geocoder.geocode(
        {
          address: query,
          bounds: bounds,
        },
        (results: any[], status: string) => {
          if (status === 'OK' && results && results.length > 0) {
            const formatted: PlaceSearchResult[] = results.slice(0, 5).map((r, i) => {
              const loc = r.geometry.location;
              return {
                id: `google_${r.place_id || i}`,
                name: r.address_components?.[0]?.long_name || r.formatted_address.split(',')[0],
                formattedAddress: r.formatted_address,
                lat: typeof loc.lat === 'function' ? loc.lat() : loc.lat,
                lng: typeof loc.lng === 'function' ? loc.lng() : loc.lng,
                source: 'google',
              };
            });
            resolve(formatted);
          } else {
            resolve([]);
          }
        }
      );
    } catch (e) {
      console.warn('Google geocode error:', e);
      resolve([]);
    }
  });
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

    return data.map((item: any) => ({
      id: `osm_${item.place_id}`,
      name: item.name || item.display_name.split(',')[0],
      formattedAddress: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      source: 'osm',
    }));
  } catch (err) {
    console.warn('Nominatim fallback error:', err);
    return [];
  }
}

/**
 * Main search function: searches Google Maps first, and falls back if needed
 */
export async function searchPlacesOnMap(query: string): Promise<PlaceSearchResult[]> {
  const clean = query.trim();
  if (!clean || clean.length < 2) return [];

  try {
    // 1. Try Google Maps first
    const googleResults = await searchWithGoogleMaps(clean);
    if (googleResults.length > 0) {
      return googleResults;
    }

    // 2. Fallback to open geocoding
    const osmResults = await searchWithNominatim(clean);
    return osmResults;
  } catch {
    return [];
  }
}
