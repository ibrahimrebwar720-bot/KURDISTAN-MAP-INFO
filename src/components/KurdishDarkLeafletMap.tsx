import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FactItem, GREAT_KURDISTAN_POLYGON } from '../data/kurdishHistoryData';
import { Eye, EyeOff, Moon, Layers, Globe, Menu, Search, Castle, Satellite } from 'lucide-react';

interface Props {
  facts: FactItem[];
  selectedFact: FactItem | null;
  onSelectFact: (fact: FactItem) => void;
  onOpenDetail?: (fact: FactItem) => void;
  showAllMarkers: boolean;
  setShowAllMarkers: (val: boolean) => void;
  showPolygon: boolean;
  setShowPolygon: (val: boolean) => void;
  onOpenMenu?: () => void;
  activeTagFilter: string;
  setActiveTagFilter: (tag: string) => void;
}

export const KurdishDarkLeafletMap: React.FC<Props> = ({
  facts,
  selectedFact,
  onSelectFact,
  onOpenDetail,
  showAllMarkers,
  setShowAllMarkers,
  showPolygon,
  setShowPolygon,
  onOpenMenu,
  activeTagFilter,
  setActiveTagFilter,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);

  // Map Mode: 'dark' (Esri Dark Canvas) or 'satellite' (Esri Dark Satellite) - 100% Free, NO Watermarks!
  const [mapMode, setMapMode] = useState<'dark' | 'satellite'>('dark');

  // Initialize Leaflet Map (Using Esri Dark Canvas with ZERO watermark and ZERO API Key)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Kurdistan: Lat 37.0, Lng 44.0, Zoom 6
    const map = L.map(mapContainerRef.current, {
      center: [36.8, 44.5],
      zoom: 6.5,
      minZoom: 5,
      maxZoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    // 100% Clean, Free, High-Performance Dark TileLayer with NO labels and NO watermarks
    const darkTileLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 16,
        subdomains: ['server', 'services'],
      }
    );

    darkTileLayer.addTo(map);
    tileLayerRef.current = darkTileLayer;

    // Layer Group for markers
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Set initial bounds
    map.fitBounds([
      [31.5, 36.0],
      [40.2, 51.5],
    ], { padding: [20, 20] });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch Tile Layer when mapMode changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    if (mapMode === 'satellite') {
      const satLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 16 }
      );
      satLayer.addTo(map);
      tileLayerRef.current = satLayer;
    } else {
      const darkLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 16 }
      );
      darkLayer.addTo(map);
      tileLayerRef.current = darkLayer;
    }
  }, [mapMode]);

  // Update Kurdistan Territory Polygon
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (polygonLayerRef.current) {
      map.removeLayer(polygonLayerRef.current);
      polygonLayerRef.current = null;
    }

    if (showPolygon) {
      const polygon = L.polygon(GREAT_KURDISTAN_POLYGON, {
        color: '#6366f1',
        weight: 1.5,
        opacity: 0.65,
        fillColor: '#4f46e5',
        fillOpacity: 0.05,
        dashArray: '5, 5',
      }).addTo(map);

      polygonLayerRef.current = polygon;
    }
  }, [showPolygon]);

  // Filter facts based on Tag Filter
  const visibleFacts = facts.filter((fact) => {
    if (activeTagFilter !== 'all' && fact.tag !== activeTagFilter) {
      return false;
    }
    return true;
  });

  // Update Markers (Only the selected location shows its name, matching clean dark style)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    visibleFacts.forEach((fact) => {
      const isSelected = selectedFact?.id === fact.id;

      if (!showAllMarkers && !isSelected) {
        return;
      }

      let iconHtml = '';

      if (isSelected) {
        // Selected location with clean name badge underneath
        iconHtml = `
          <div class="kurdish-selected-marker relative flex flex-col items-center cursor-pointer pointer-events-auto" style="transform: translate(-50%, -50%);">
            <!-- Pulsing outer ring -->
            <div class="absolute w-10 h-10 rounded-full bg-indigo-500/25 animate-ping"></div>
            <!-- Secondary glow ring -->
            <div class="absolute w-6 h-6 rounded-full bg-indigo-600/40"></div>
            <!-- Center Glowing Pin -->
            <div class="relative w-4 h-4 rounded-full bg-indigo-500 border-2 border-white shadow-[0_0_15px_rgba(99,102,241,1)] flex items-center justify-center">
              <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
            </div>
            <!-- Clean Location Name directly beneath pin -->
            <div class="mt-1.5 px-2.5 py-1 rounded-md bg-black/95 border border-indigo-500/80 shadow-[0_0_15px_rgba(79,70,229,0.35)] backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap z-50">
              <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></span>
              <span class="text-[11px] font-bold text-white tracking-wide font-sans">${fact.name}</span>
            </div>
          </div>
        `;
      } else {
        // Subtle minimal glowing dot for all other locations
        iconHtml = `
          <div class="kurdish-dot-marker cursor-pointer transition-transform hover:scale-150" style="transform: translate(-50%, -50%);">
            <div class="w-2.5 h-2.5 rounded-full bg-indigo-400/70 border border-black/80 hover:bg-white shadow-[0_0_6px_rgba(99,102,241,0.6)]"></div>
          </div>
        `;
      }

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-leaflet-div-icon',
        iconSize: isSelected ? [120, 50] : [10, 10],
        iconAnchor: isSelected ? [60, 20] : [5, 5],
      });

      const marker = L.marker([fact.lat, fact.lng], {
        icon: customIcon,
        zIndexOffset: isSelected ? 1000 : 10,
      });

      marker.on('click', () => {
        onSelectFact(fact);
      });

      markersLayer.addLayer(marker);
    });
  }, [visibleFacts, selectedFact?.id, showAllMarkers]);

  // Smooth camera flyTo on selectedFact change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedFact) return;

    map.flyTo([selectedFact.lat, selectedFact.lng], Math.max(map.getZoom(), 8), {
      animate: true,
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [selectedFact?.id]);

  // Reset Camera to center of Kurdistan
  const handleResetCamera = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo([36.8, 44.5], 6.5, {
      animate: true,
      duration: 1.2,
    });
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-black select-none">
      {/* 1. Leaflet Map Viewport */}
      <div ref={mapContainerRef} className="w-full h-full z-0 bg-black" />

      {/* 2. Top-Center Selected Location Header Badge */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center">
        {selectedFact && (
          <div className="flex flex-col items-center pointer-events-auto px-3.5 py-1.5 rounded-xl bg-black/90 border border-indigo-950/80 shadow-[0_0_25px_rgba(79,70,229,0.25)] backdrop-blur-md">
            <span className="text-[10px] text-indigo-400 font-medium tracking-wide">
              دەسەڵاتی دیاریکراو
            </span>
            <span className="text-xs font-bold text-white mt-0.5 max-w-[260px] truncate">
              {selectedFact.name}
            </span>
            <span className="text-[9px] text-indigo-300/70 mt-0.5">
              {selectedFact.desc}
            </span>
          </div>
        )}
      </div>

      {/* 3. Right Side Vertical Controls Dock */}
      <div className="absolute top-3 right-3 z-30 pointer-events-auto flex flex-col items-center gap-1.5 p-1 rounded-2xl bg-black/80 border border-indigo-950 backdrop-blur-xl shadow-2xl">
        {/* Polygon Border Toggle */}
        <button
          onClick={() => setShowPolygon(!showPolygon)}
          title={showPolygon ? 'شاردنەوەی سنووری کوردستان' : 'پیشاندانی سنووری کوردستان'}
          className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border transition-all shadow-lg ${
            showPolygon
              ? 'bg-indigo-600/30 border-indigo-500/80 text-indigo-300'
              : 'bg-black/60 border-indigo-950 text-indigo-400/50 hover:text-white'
          }`}
        >
          {showPolygon ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>

        {/* Satellite / Dark Canvas Switcher */}
        <button
          onClick={() => setMapMode(mapMode === 'dark' ? 'satellite' : 'dark')}
          title={mapMode === 'dark' ? 'گۆڕین بۆ سەتەلایتی تاریک' : 'گۆڕین بۆ نەخشەی ڕەشی خاوێن'}
          className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border transition-all shadow-lg ${
            mapMode === 'satellite'
              ? 'bg-indigo-600/30 border-indigo-500/80 text-indigo-300'
              : 'bg-black/60 border-indigo-950 text-indigo-400 hover:text-white'
          }`}
        >
          {mapMode === 'satellite' ? <Satellite className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        {/* Category Filter Toggle */}
        <button
          onClick={() => {
            const tags = ['all', 'capital', 'empire', 'principality', 'battle'];
            const nextIdx = (tags.indexOf(activeTagFilter) + 1) % tags.length;
            setActiveTagFilter(tags[nextIdx]);
          }}
          title={`فلتەری جۆر: ${activeTagFilter}`}
          className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border transition-all shadow-lg ${
            activeTagFilter !== 'all'
              ? 'bg-indigo-600/30 border-indigo-500/80 text-indigo-300'
              : 'bg-black/60 border-indigo-950 text-indigo-400/50 hover:text-white'
          }`}
        >
          <Castle className="w-3.5 h-3.5" />
        </button>

        {/* Layers: All 350 Markers toggle */}
        <button
          onClick={() => setShowAllMarkers(!showAllMarkers)}
          title={showAllMarkers ? 'هەموو ٣٥٠ مارکەرەکە' : 'تەنها هەڵبژێردراو'}
          className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border transition-all shadow-lg ${
            showAllMarkers
              ? 'bg-indigo-600/30 border-indigo-500/80 text-indigo-300'
              : 'bg-black/60 border-indigo-950 text-indigo-400/50 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
        </button>

        {/* Globe: Reset Camera to Center */}
        <button
          onClick={handleResetCamera}
          title="گەڕانەوە بۆ ناوەندی کوردستان"
          className="w-8 h-8 rounded-full flex items-center justify-center bg-black/60 hover:bg-indigo-950/60 border border-indigo-950 text-indigo-300 hover:text-white backdrop-blur-md shadow-lg transition-all"
        >
          <Globe className="w-3.5 h-3.5" />
        </button>

        <div className="h-px w-5 bg-indigo-950 my-0.5" />

        {/* Menu (Hamburger ≡) */}
        {onOpenMenu && (
          <button
            onClick={onOpenMenu}
            title="کردنەوەی مینۆی دەسەڵاتەکان و زانیارییەکان"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-950/80 hover:bg-indigo-600 border border-indigo-500/40 text-white backdrop-blur-md shadow-[0_0_12px_rgba(79,70,229,0.3)] transition-all active:scale-95"
          >
            <Menu className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Search */}
        {onOpenMenu && (
          <button
            onClick={onOpenMenu}
            title="گەڕان لەناو ٣٥٠ دەسەڵاتدا"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-black/70 hover:bg-indigo-950/80 border border-indigo-950 text-indigo-300 hover:text-white backdrop-blur-md shadow-lg transition-all active:scale-95"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 4. Bottom Center Floating Capsule Dock */}
      <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-auto sm:left-1/2 sm:-translate-x-1/2 z-30 pointer-events-auto flex flex-col items-center gap-2 max-w-xl w-full">
        {selectedFact && (
          <div
            onClick={() => onOpenDetail && onOpenDetail(selectedFact)}
            className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-black/95 border border-indigo-950 hover:border-indigo-500/60 backdrop-blur-xl shadow-[0_0_30px_rgba(15,10,40,0.9)] cursor-pointer transition-all active:scale-98"
          >
            {/* Left Tag */}
            <span className="text-[10px] font-mono font-bold text-indigo-400/80 tracking-wider">
              KUR
            </span>

            {/* Kurdish Flag Icon in Center */}
            <div className="w-5 h-3.5 rounded-sm bg-gradient-to-b from-red-600 via-white to-emerald-600 flex items-center justify-center shadow-xs">
              <span className="text-[7px] text-amber-500 font-bold leading-none select-none">☀️</span>
            </div>

            {/* Selected Location Name (Click opens full history details) */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-white tracking-wide">
              <span>{selectedFact.name}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
