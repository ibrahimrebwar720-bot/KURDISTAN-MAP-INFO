import L from 'leaflet';

export const MAP_TILE_CACHE_NAME = 'kurdish-history-map-tiles-v1';
const PRELOAD_FLAG_KEY = 'kurdish_map_precached_flag_v1';

// ArcGIS World Dark Gray Base URL
export const DARK_MAP_TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';

// ArcGIS Satellite imagery URL
export const SATELLITE_MAP_TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

// Slippy map tile coordinate helpers
export function lon2tile(lon: number, zoom: number): number {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

export function lat2tile(lat: number, zoom: number): number {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
      Math.pow(2, zoom)
  );
}

/**
 * Custom Leaflet TileLayer that serves tiles from CacheStorage first.
 * Completely eliminates black loading squares and ensures fast, offline-ready map navigation.
 */
export const CachedTileLayer = L.TileLayer.extend({
  createTile(coords: L.Coords, done: (err: any, tile: HTMLElement) => void): HTMLElement {
    const tile = document.createElement('img');
    tile.alt = '';
    tile.setAttribute('role', 'presentation');
    tile.style.backgroundColor = '#12161f'; // Match ArcGIS dark gray background to prevent black flashes

    const url = (this as any).getTileUrl(coords);

    if (typeof window !== 'undefined' && 'caches' in window) {
      caches
        .open(MAP_TILE_CACHE_NAME)
        .then((cache) => {
          return cache.match(url).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse.blob().then((blob) => {
                const objectUrl = URL.createObjectURL(blob);
                tile.onload = () => {
                  URL.revokeObjectURL(objectUrl);
                  done(null, tile);
                };
                tile.onerror = () => {
                  URL.revokeObjectURL(objectUrl);
                  tile.src = url;
                  done(null, tile);
                };
                tile.src = objectUrl;
              });
            }

            // Not yet in cache: fetch with CORS, save to cache, and display
            return fetch(url, { mode: 'cors' })
              .then((networkResp) => {
                if (networkResp.ok) {
                  const toCache = networkResp.clone();
                  cache.put(url, toCache).catch(() => {});
                  return networkResp.blob();
                }
                throw new Error('Tile response not OK');
              })
              .then((blob) => {
                const objectUrl = URL.createObjectURL(blob);
                tile.onload = () => {
                  URL.revokeObjectURL(objectUrl);
                  done(null, tile);
                };
                tile.onerror = () => {
                  URL.revokeObjectURL(objectUrl);
                  tile.src = url;
                  done(null, tile);
                };
                tile.src = objectUrl;
              })
              .catch(() => {
                // Fallback to direct image load
                tile.onload = () => done(null, tile);
                tile.onerror = () => done(null, tile);
                tile.src = url;
              });
          });
        })
        .catch(() => {
          tile.onload = () => done(null, tile);
          tile.onerror = () => done(null, tile);
          tile.src = url;
        });
    } else {
      tile.onload = () => done(null, tile);
      tile.onerror = () => done(null, tile);
      tile.src = url;
    }

    return tile;
  },
});

/**
 * Factory for creating a cached TileLayer
 */
export function createCachedTileLayer(
  urlTemplate: string,
  options: L.TileLayerOptions = {}
): L.TileLayer {
  const mergedOptions: L.TileLayerOptions = {
    maxZoom: 16,
    keepBuffer: 12, // Keeps out-of-viewport tiles in memory for instantaneous panning
    updateWhenIdle: false, // Continue loading immediately while panning
    updateWhenZooming: true, // Retain existing tiles during zoom animations
    crossOrigin: 'anonymous',
    ...options,
  };

  return new (CachedTileLayer as any)(urlTemplate, mergedOptions) as L.TileLayer;
}

/**
 * Background pre-caching of Kurdistan region base map tiles (Zooms 5, 6, 7).
 * Downloads ~35 small tiles (~150KB total) into browser CacheStorage so that
 * when the user navigates, the base map renders without black patches.
 */
export async function preloadKurdistanTiles(
  onProgress?: (progress: { loaded: number; total: number; done: boolean }) => void
): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;

  try {
    const isAlreadyPreloaded = localStorage.getItem(PRELOAD_FLAG_KEY);
    const cache = await caches.open(MAP_TILE_CACHE_NAME);

    // Kurdistan Bounding Box:
    // South: 31.0, North: 41.0, West: 36.0, East: 52.0
    const zoomLevels = [5, 6, 7];
    const urlsToCache: string[] = [];

    for (const z of zoomLevels) {
      const minX = lon2tile(36.0, z);
      const maxX = lon2tile(52.0, z);
      const minY = lat2tile(41.0, z);
      const maxY = lat2tile(31.0, z);

      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          const tileUrl = DARK_MAP_TILE_URL.replace('{z}', String(z))
            .replace('{y}', String(y))
            .replace('{x}', String(x));
          urlsToCache.push(tileUrl);
        }
      }
    }

    const total = urlsToCache.length;
    let loaded = 0;

    // If already preloaded previously, verify quickly without blocking
    if (isAlreadyPreloaded) {
      if (onProgress) onProgress({ loaded: total, total, done: true });
      return;
    }

    // Download in small concurrent chunks so we don't hog bandwidth
    const chunkSize = 6;
    for (let i = 0; i < urlsToCache.length; i += chunkSize) {
      const chunk = urlsToCache.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(async (url) => {
          try {
            const hasMatch = await cache.match(url);
            if (!hasMatch) {
              const resp = await fetch(url, { mode: 'cors' });
              if (resp.ok) {
                await cache.put(url, resp);
              }
            }
          } catch {
            // Silently ignore individual tile fetch failures
          } finally {
            loaded++;
            if (onProgress) {
              onProgress({ loaded, total, done: loaded >= total });
            }
          }
        })
      );
    }

    localStorage.setItem(PRELOAD_FLAG_KEY, 'true');
    if (onProgress) onProgress({ loaded: total, total, done: true });
  } catch (err) {
    console.warn('Background tile preloading notice:', err);
  }
}
