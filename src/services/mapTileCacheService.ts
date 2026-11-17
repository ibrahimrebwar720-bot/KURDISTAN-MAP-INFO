import L from 'leaflet';

export const MAP_TILE_CACHE_NAME = 'kurdish-history-map-tiles-v1';
const PRELOAD_FLAG_KEY = 'kurdish_map_precached_flag_v1';

// ArcGIS World Dark Gray Base URL
export const DARK_MAP_TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';

// ArcGIS World Light Gray Base URL (Crisp, elegant, soft parchment tone, 100% free)
export const LIGHT_MAP_TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';

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
 * Custom Leaflet TileLayer that preserves native browser caching while
 * decoding tiles asynchronously off the main thread.
 */
export const CachedTileLayer = L.TileLayer.extend({
  createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
    const tile = (L.TileLayer.prototype as any).createTile.call(
      this,
      coords,
      done
    ) as HTMLImageElement;
    if (tile) {
      tile.decoding = 'async';
      tile.loading = 'eager';
    }
    return tile;
  },
});

/**
 * Factory for creating a zero-lag TileLayer:
 * - keepBuffer: 2 prevents hundreds of offscreen tile DOM nodes
 * - updateWhenIdle: true & updateWhenZooming: false prevents network/decode
 *   stutters while panning or zooming
 */
export function createCachedTileLayer(
  urlTemplate: string,
  options: L.TileLayerOptions = {}
): L.TileLayer {
  const mergedOptions: L.TileLayerOptions = {
    maxZoom: 16,
    keepBuffer: 2,
    updateWhenIdle: true,
    updateWhenZooming: false,
    updateInterval: 200,
    detectRetina: false,
    ...options,
  };

  return new (CachedTileLayer as unknown as new (
    url: string,
    opts?: L.TileLayerOptions
  ) => L.TileLayer)(urlTemplate, mergedOptions);
}

/**
 * Background pre-caching of tiles: disabled by default to keep initial load instant and ultra-lightweight.
 */
export async function preloadKurdistanTiles(
  onProgress?: (progress: { loaded: number; total: number; done: boolean }) => void
): Promise<void> {
  if (onProgress) onProgress({ loaded: 0, total: 0, done: true });
}

