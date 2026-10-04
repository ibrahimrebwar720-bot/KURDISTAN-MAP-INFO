import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { FactItem, GREAT_KURDISTAN_POLYGON, ERAS } from '../data/kurdishHistoryData';
import { Layers, Eye, Compass, Maximize2, ShieldCheck, MapPin } from 'lucide-react';

interface Props {
  facts: FactItem[];
  selectedFact: FactItem | null;
  onSelectFact: (fact: FactItem) => void;
  onOpenDetail?: (fact: FactItem) => void;
  showAllMarkers: boolean;
  setShowAllMarkers: (val: boolean) => void;
  showPolygon: boolean;
  setShowPolygon: (val: boolean) => void;
}

type MapTheme = 'dark' | 'satellite' | 'antique';

const TILE_LAYERS: Record<MapTheme, { url: string; attribution: string }> = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB &copy; OpenStreetMap'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS'
  },
  antique: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB &copy; OpenStreetMap'
  }
};

export const KurdishHistoryMap: React.FC<Props> = ({
  facts,
  selectedFact,
  onSelectFact,
  onOpenDetail,
  showAllMarkers,
  setShowAllMarkers,
  showPolygon,
  setShowPolygon
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const activeMarkerRef = useRef<L.Marker | null>(null);

  const [mapTheme, setMapTheme] = useState<MapTheme>('dark');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [36.2, 43.8],
      zoom: 6,
      minZoom: 4,
      maxZoom: 16,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    const initialTiles = L.tileLayer(TILE_LAYERS[mapTheme].url, {
      attribution: TILE_LAYERS[mapTheme].attribution,
      maxZoom: 18,
    }).addTo(map);

    tileLayerRef.current = initialTiles;

    // Great Kurdistan polygon
    const polygon = L.polygon(GREAT_KURDISTAN_POLYGON, {
      color: '#d97706',
      fillColor: '#f59e0b',
      fillOpacity: 0.18,
      weight: 2.5,
      dashArray: '6, 6'
    }).addTo(map);

    polygon.bindPopup(`
      <div style="direction: rtl; text-align: right; font-family: 'Vazirmatn', sans-serif;">
        <h4 style="font-weight: bold; color: #f59e0b; margin-bottom: 4px; font-size: 15px;">کوردستانی گەورە (The Great Kurdistan)</h4>
        <p style="margin: 0; font-size: 12px; color: #cbd5e1; line-height: 1.6;">
          سنووری سروشتی و مێژوویی سەرجەم بەشەکانی کوردستان بە درێژایی زنجیرە چیاکانی زاگرۆس و تۆرۆس.
        </p>
      </div>
    `);

    polygonLayerRef.current = polygon;

    const markerGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markerGroup;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when Theme changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newTiles = L.tileLayer(TILE_LAYERS[mapTheme].url, {
      attribution: TILE_LAYERS[mapTheme].attribution,
      maxZoom: 18,
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTiles;
  }, [mapTheme]);

  // Update Polygon visibility
  useEffect(() => {
    if (!mapInstanceRef.current || !polygonLayerRef.current) return;
    if (showPolygon) {
      if (!mapInstanceRef.current.hasLayer(polygonLayerRef.current)) {
        polygonLayerRef.current.addTo(mapInstanceRef.current);
      }
    } else {
      if (mapInstanceRef.current.hasLayer(polygonLayerRef.current)) {
        mapInstanceRef.current.removeLayer(polygonLayerRef.current);
      }
    }
  }, [showPolygon]);

  // Era color helper for badges
  const getEraColor = (eraId: number) => {
    switch (eraId) {
      case 1: return '#d97706'; // Amber (Pre-Mede)
      case 2: return '#059669'; // Emerald (Mede)
      case 3: return '#0284c7'; // Cyan/Blue (Post-Mede to Islam)
      case 4: return '#9333ea'; // Purple (Islamic Dynasties)
      case 5: return '#e11d48'; // Rose (Modern)
      default: return '#3b82f6';
    }
  };

  // Render markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersLayerRef.current;
    if (!map || !group) return;

    group.clearLayers();

    facts.forEach((fact) => {
      const isSelected = selectedFact?.id === fact.id;
      const color = getEraColor(fact.eraId);

      const markerHtml = `
        <div class="relative group cursor-pointer transition-all duration-300 ${isSelected ? 'scale-125 z-50 pulse-marker-active' : 'hover:scale-110'}">
          <div style="background-color: ${isSelected ? '#f59e0b' : color}; border-color: ${isSelected ? '#ffffff' : '#0f172a'};"
               class="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold border-2 shadow-lg transition-transform duration-200">
            ${fact.num}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-fact-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -16]
      });

      const marker = L.marker([fact.lat, fact.lng], { icon: customIcon });

      const popupHtml = `
        <div style="direction: rtl; text-align: right; min-width: 200px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <span style="background: ${color}; color: #fff; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold;">
              #${fact.num} - ${fact.eraName}
            </span>
          </div>
          <h4 style="font-weight: 700; color: #f1f5f9; font-size: 14px; margin-bottom: 4px;">
            ${fact.name}
          </h4>
          <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0 0 8px 0;">
            ${fact.desc}
          </p>
          <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 6px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 10px; color: #64748b;">${fact.lat.toFixed(2)}°N, ${fact.lng.toFixed(2)}°E</span>
            <button id="leaflet-popup-btn-${fact.id}" style="background: #d97706; color: #fff; border: none; border-radius: 6px; padding: 4px 8px; font-size: 11px; font-weight: bold; cursor: pointer;">
              زانیاری زیاتر
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        onSelectFact(fact);
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`leaflet-popup-btn-${fact.id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectFact(fact);
            if (onOpenDetail) onOpenDetail(fact);
          };
        }
      });

      group.addLayer(marker);

      if (isSelected) {
        activeMarkerRef.current = marker;
      }
    });
  }, [facts, selectedFact, onSelectFact]);

  // Fly to selected fact
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedFact) return;

    mapInstanceRef.current.flyTo(
      [selectedFact.lat, selectedFact.lng],
      selectedFact.zoom || 9,
      { duration: 1.2, easeLinearity: 0.25 }
    );

    // Open popup after fly
    if (activeMarkerRef.current) {
      activeMarkerRef.current.openPopup();
    }
  }, [selectedFact]);

  // Reset to full view of Kurdistan
  const handleResetView = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([36.2, 43.8], 6, { duration: 1 });
  };

  const toggleFullscreen = () => {
    if (!mapContainerRef.current) return;
    if (!isFullscreen) {
      if (mapContainerRef.current.requestFullscreen) {
        mapContainerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="relative w-full h-[460px] lg:h-[580px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 flex flex-col">
      {/* Map Header Floating Controls */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left side: Map Styles and Quick Controls */}
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-lg">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">ستایل:</span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setMapTheme('dark')}
              className={`px-2.5 py-1 text-xs rounded-lg transition-all font-medium ${
                mapTheme === 'dark'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              شەوانە
            </button>
            <button
              onClick={() => setMapTheme('satellite')}
              className={`px-2.5 py-1 text-xs rounded-lg transition-all font-medium ${
                mapTheme === 'satellite'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              مانگی دەستکرد
            </button>
            <button
              onClick={() => setMapTheme('antique')}
              className={`px-2.5 py-1 text-xs rounded-lg transition-all font-medium ${
                mapTheme === 'antique'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              ئەتڵەس
            </button>
          </div>
        </div>

        {/* Right side: Border Polygon & Reset View buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setShowPolygon(!showPolygon)}
            title="نیشاندان یان شاردنەوەی سنووری کوردستانی گەورە"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border backdrop-blur-md shadow-lg transition-all ${
              showPolygon
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                : 'bg-slate-900/90 border-slate-700/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">سنووری کوردستان</span>
          </button>

          <button
            onClick={() => setShowAllMarkers(!showAllMarkers)}
            title="گشت ٢٠٠ مارکەر یان تەنها ئەوانەی فلتەر کراون"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border backdrop-blur-md shadow-lg transition-all ${
              showAllMarkers
                ? 'bg-blue-600/30 border-blue-500/60 text-blue-300'
                : 'bg-slate-900/90 border-slate-700/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{showAllMarkers ? 'هەموو شوێنەکان (٢٠٠)' : 'فلتەرکراو'}</span>
          </button>

          <button
            onClick={handleResetView}
            title="گەڕانەوە بۆ نەخشەی گشتی کوردستان"
            className="flex items-center gap-1 p-2 rounded-xl text-xs font-medium bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/60 backdrop-blur-md shadow-lg transition-all"
          >
            <Compass className="w-4 h-4 text-amber-400" />
          </button>

          <button
            onClick={toggleFullscreen}
            title="تەواوی شاشە"
            className="p-2 rounded-xl text-xs font-medium bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/60 backdrop-blur-md shadow-lg transition-all hidden sm:block"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map DOM Element */}
      <div ref={mapContainerRef} className="w-full flex-1 z-10" />

      {/* Map Footer Overlay at Bottom */}
      <div className="bg-slate-900/95 border-t border-slate-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 z-20">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-500/20"></span>
          <span>٢٠٠ شوێن و دەسەڵاتی مێژوویی</span>
        </div>
      </div>
    </div>
  );
};
