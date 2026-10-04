/// <reference types="google.maps" />
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import { FactItem, GREAT_KURDISTAN_POLYGON, ERAS } from '../data/kurdishHistoryData';
import { Layers, Compass, Maximize2, ShieldCheck, MapPin, Satellite, Mountain, Navigation } from 'lucide-react';

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

// Convert coordinates to Google Maps LatLngLiteral format
const GOOGLE_KURDISTAN_POLYGON = GREAT_KURDISTAN_POLYGON.map(([lat, lng]) => ({
  lat,
  lng,
}));

// Component for rendering polygon inside Google Maps context
function KurdistanPolygonOverlay({ visible }: { visible: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!map || typeof google === 'undefined' || !google.maps) return;

    if (!visible) return;

    const polygon = new google.maps.Polygon({
      paths: GOOGLE_KURDISTAN_POLYGON,
      strokeColor: '#d97706',
      strokeOpacity: 0.95,
      strokeWeight: 2.5,
      fillColor: '#f59e0b',
      fillOpacity: 0.16,
      map: map,
      zIndex: 1,
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="direction: rtl; text-align: right; font-family: 'Vazirmatn', sans-serif; padding: 4px;">
          <h4 style="font-weight: bold; color: #d97706; margin-bottom: 4px; font-size: 14px;">کوردستانی گەورە (The Great Kurdistan)</h4>
          <p style="margin: 0; font-size: 12px; color: #334155; line-height: 1.6;">
            سنووری سروشتی و مێژوویی سەرجەم بەشەکانی کوردستان بە درێژایی زنجیرە چیاکانی زاگرۆس و تۆرۆس.
          </p>
        </div>
      `,
    });

    polygon.addListener('click', (e: google.maps.PolyMouseEvent) => {
      if (e.latLng) {
        infoWindow.setPosition(e.latLng);
        infoWindow.open(map);
      }
    });

    return () => {
      polygon.setMap(null);
      infoWindow.close();
    };
  }, [map, visible]);

  return null;
}

// Component to handle smooth camera flyTo when selectedFact changes
function CameraController({ selectedFact }: { selectedFact: FactItem | null }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !selectedFact) return;

    map.panTo({ lat: selectedFact.lat, lng: selectedFact.lng });
    map.setZoom(selectedFact.zoom || 9);
  }, [map, selectedFact]);

  return null;
}

export const KurdishGoogleMap: React.FC<Props> = ({
  facts,
  selectedFact,
  onSelectFact,
  onOpenDetail,
  showAllMarkers,
  setShowAllMarkers,
  showPolygon,
  setShowPolygon,
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBoF3qz_hdH2a2n_KfCyegJVcMNbCrXTds';

  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'satellite' | 'terrain' | 'hybrid'>('terrain');
  const [infoWindowFact, setInfoWindowFact] = useState<FactItem | null>(selectedFact);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync info window with selected fact
  useEffect(() => {
    if (selectedFact) {
      setInfoWindowFact(selectedFact);
    }
  }, [selectedFact]);

  // Era color helper for badges
  const getEraColor = (eraId: number) => {
    switch (eraId) {
      case 1: return '#d97706'; // Amber (Pre-Mede)
      case 2: return '#059669'; // Emerald (Mede)
      case 3: return '#0284c7'; // Cyan/Blue (Post-Mede)
      case 4: return '#9333ea'; // Purple (Islamic)
      case 5: return '#e11d48'; // Rose (Modern)
      default: return '#3b82f6';
    }
  };

  const handleResetCamera = useCallback(() => {
    const el = document.getElementById('gmp-reset-trigger');
    if (el) el.click();
  }, []);

  return (
    <div className="relative w-full h-[470px] lg:h-[590px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 flex flex-col">
      {/* Floating Map Controls at Top */}
      <div className="absolute top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Map Type Switcher */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-700/60 shadow-lg text-xs">
          <div className="flex items-center gap-1 text-slate-300 font-medium pl-1">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">گووگڵ ماپس:</span>
          </div>

          <button
            onClick={() => setMapTypeId('terrain')}
            className={`px-2 py-1 rounded-lg transition-all font-medium flex items-center gap-1 ${
              mapTypeId === 'terrain'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Mountain className="w-3 h-3" />
            <span>چیاکان</span>
          </button>

          <button
            onClick={() => setMapTypeId('satellite')}
            className={`px-2 py-1 rounded-lg transition-all font-medium flex items-center gap-1 ${
              mapTypeId === 'satellite'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Satellite className="w-3 h-3" />
            <span>مانگی دەستکرد</span>
          </button>

          <button
            onClick={() => setMapTypeId('roadmap')}
            className={`px-2 py-1 rounded-lg transition-all font-medium ${
              mapTypeId === 'roadmap'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            ئاسایی
          </button>
        </div>

        {/* Right side quick action buttons */}
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
            title="گشت ٢٠٠ مارکەر یان تەنها فلتەرکراوەکان"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border backdrop-blur-md shadow-lg transition-all ${
              showAllMarkers
                ? 'bg-blue-600/30 border-blue-500/60 text-blue-300'
                : 'bg-slate-900/90 border-slate-700/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{showAllMarkers ? 'هەموو ٢٠٠ شوێنەکە' : 'فلتەرکراو'}</span>
          </button>
        </div>
      </div>

      {/* Google Maps Viewport with APIProvider */}
      <div className="w-full flex-1 relative z-10">
        <APIProvider apiKey={apiKey} language="ckb" region="IQ">
          <Map
            mapId="DEMO_MAP_ID"
            defaultCenter={{ lat: 36.2, lng: 43.8 }}
            defaultZoom={6}
            mapTypeId={mapTypeId}
            gestureHandling="greedy"
            disableDefaultUI={false}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Camera fly controller */}
            <CameraController selectedFact={selectedFact} />

            {/* Great Kurdistan polygon */}
            <KurdistanPolygonOverlay visible={showPolygon} />

            {/* 200 Advanced Markers */}
            {facts.map((fact) => {
              const isSelected = selectedFact?.id === fact.id;
              const color = getEraColor(fact.eraId);

              return (
                <AdvancedMarker
                  key={fact.id}
                  position={{ lat: fact.lat, lng: fact.lng }}
                  onClick={() => {
                    onSelectFact(fact);
                    setInfoWindowFact(fact);
                  }}
                  title={`#${fact.num}: ${fact.name}`}
                  zIndex={isSelected ? 100 : fact.num}
                >
                  <div
                    className={`relative cursor-pointer transition-all duration-300 ${
                      isSelected
                        ? 'scale-125 z-50 pulse-marker-active'
                        : 'hover:scale-110'
                    }`}
                  >
                    <div
                      style={{
                        backgroundColor: isSelected ? '#f59e0b' : color,
                        borderColor: isSelected ? '#ffffff' : '#0f172a',
                      }}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold border-2 shadow-lg"
                    >
                      {fact.num}
                    </div>
                  </div>
                </AdvancedMarker>
              );
            })}

            {/* Selected Info Window */}
            {infoWindowFact && (
              <InfoWindow
                position={{ lat: infoWindowFact.lat, lng: infoWindowFact.lng }}
                onCloseClick={() => setInfoWindowFact(null)}
                pixelOffset={[0, -20]}
              >
                <div style={{ direction: 'rtl', textAlign: 'right', minWidth: '220px', fontFamily: 'Vazirmatn, sans-serif' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                    <span
                      style={{
                        background: getEraColor(infoWindowFact.eraId),
                        color: '#fff',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                      }}
                    >
                      #{infoWindowFact.num} - {infoWindowFact.eraName}
                    </span>
                  </div>
                  <h4 style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px', margin: '4px 0' }}>
                    {infoWindowFact.name}
                  </h4>
                  <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5, margin: '0 0 6px 0' }}>
                    {infoWindowFact.desc}
                  </p>
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                      {infoWindowFact.lat.toFixed(2)}°N, {infoWindowFact.lng.toFixed(2)}°E
                    </span>
                    <button
                      onClick={() => {
                        onSelectFact(infoWindowFact);
                        if (onOpenDetail) onOpenDetail(infoWindowFact);
                      }}
                      style={{
                        fontSize: '11px',
                        color: '#ffffff',
                        backgroundColor: '#d97706',
                        fontWeight: 'bold',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px 10px',
                      }}
                    >
                      زانیاری زیاتر
                    </button>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>

      {/* Map Footer Bar */}
      <div className="bg-slate-900/95 border-t border-slate-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 z-20">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-500/20"></span>
          <span>٢٠٠ شوێن و دەسەڵاتی مێژوویی لەسەر گووگڵ ماپس</span>
        </div>
      </div>
    </div>
  );
};
