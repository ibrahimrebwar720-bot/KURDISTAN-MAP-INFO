import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FactItem, GREAT_KURDISTAN_POLYGON } from '../data/kurdishHistoryData';
import {
  Eye,
  EyeOff,
  Moon,
  Layers,
  Globe,
  Menu,
  Search,
  Castle,
  Satellite,
  Shield,
  ShieldCheck,
  Plus,
  Crosshair,
  Crown,
  Swords,
  SlidersHorizontal,
  X,
  Check,
} from 'lucide-react';

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
  // Admin Props
  isAdmin?: boolean;
  onTriggerAdminPin: () => void;
  onOpenAddFact?: () => void;
  onLogoutAdmin?: () => void;
  isPickingLocation?: boolean;
  onPickLocation?: (lat: number, lng: number) => void;
  onCancelPickLocation?: () => void;
  pickedCoords?: { lat: number; lng: number } | null;
}

const TAG_FILTER_OPTIONS = [
  {
    id: 'all',
    label: 'هەموو وێستگەکان',
    shortLabel: 'هەمووی',
    icon: SlidersHorizontal,
    color: '#6366f1',
    accentClass: 'text-indigo-400',
  },
  {
    id: 'capital',
    label: 'قەڵا و پایتەختەکان',
    shortLabel: 'قەڵاکان',
    icon: Castle,
    color: '#a855f7',
    accentClass: 'text-purple-400',
  },
  {
    id: 'empire',
    label: 'دەوڵەت و ئیمپراتۆریەتەکان',
    shortLabel: 'دەوڵەتەکان',
    icon: Crown,
    color: '#3b82f6',
    accentClass: 'text-blue-400',
  },
  {
    id: 'principality',
    label: 'میرنشین و دەسەڵاتەکان',
    shortLabel: 'میرنشینەکان',
    icon: Shield,
    color: '#eab308',
    accentClass: 'text-amber-400',
  },
  {
    id: 'battle',
    label: 'جەنگ و ڕووداوە مێژووییەکان',
    shortLabel: 'جەنگەکان',
    icon: Swords,
    color: '#ef4444',
    accentClass: 'text-rose-400',
  },
];

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
  isAdmin = false,
  onTriggerAdminPin,
  onOpenAddFact,
  onLogoutAdmin,
  isPickingLocation = false,
  onPickLocation,
  onCancelPickLocation,
  pickedCoords,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const pickedMarkerRef = useRef<L.Marker | null>(null);

  // Map Mode: 'dark' (Esri Dark Canvas) or 'satellite' (Esri Dark Satellite)
  const [mapMode, setMapMode] = useState<'dark' | 'satellite'>('dark');

  // Filter Menu Popover & Toast state
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [filterNotification, setFilterNotification] = useState<string | null>(null);
  const filterNotificationTimeoutRef = useRef<any>(null);

  // Admin secret 6-tap tracking
  const [adminTapCount, setAdminTapCount] = useState(0);
  const tapTimeoutRef = useRef<any>(null);

  // Compute fact counts per tag
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = { all: facts.length };
    facts.forEach((f) => {
      counts[f.tag] = (counts[f.tag] || 0) + 1;
    });
    return counts;
  }, [facts]);

  // Active filter object definition
  const currentFilterObj = useMemo(() => {
    return (
      TAG_FILTER_OPTIONS.find((opt) => opt.id === activeTagFilter) ||
      TAG_FILTER_OPTIONS[0]
    );
  }, [activeTagFilter]);

  // Handle changing filter with beautiful notification
  const handleSelectTagFilter = (tagId: string) => {
    setActiveTagFilter(tagId);
    setIsFilterMenuOpen(false);

    const targetOpt = TAG_FILTER_OPTIONS.find((t) => t.id === tagId) || TAG_FILTER_OPTIONS[0];
    setFilterNotification(targetOpt.label);

    if (filterNotificationTimeoutRef.current) {
      clearTimeout(filterNotificationTimeoutRef.current);
    }
    filterNotificationTimeoutRef.current = setTimeout(() => {
      setFilterNotification(null);
    }, 3500);
  };

  // Toggle or Cycle filter
  const handleFilterButtonClick = () => {
    setIsFilterMenuOpen((prev) => !prev);
  };

  const handleAdminIconClick = () => {
    if (isAdmin) {
      if (onLogoutAdmin) {
        onLogoutAdmin();
      }
      return;
    }

    const nextCount = adminTapCount + 1;
    setAdminTapCount(nextCount);

    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }

    if (nextCount >= 6) {
      setAdminTapCount(0);
      onTriggerAdminPin();
    } else {
      tapTimeoutRef.current = setTimeout(() => {
        setAdminTapCount(0);
      }, 4000);
    }
  };

  // Initialize Leaflet Map
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

    // Dark TileLayer with NO labels and NO watermarks
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
    map.fitBounds(
      [
        [31.5, 36.0],
        [40.2, 51.5],
      ],
      { padding: [20, 20] }
    );

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Map Click Listener for picking location
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (isPickingLocation && onPickLocation) {
        onPickLocation(e.latlng.lat, e.latlng.lng);
      }
      setIsFilterMenuOpen(false);
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [isPickingLocation, onPickLocation]);

  // Display picked marker on map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (pickedMarkerRef.current) {
      map.removeLayer(pickedMarkerRef.current);
      pickedMarkerRef.current = null;
    }

    if (pickedCoords) {
      const lat = Number(pickedCoords.lat);
      const lng = Number(pickedCoords.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const customIcon = L.divIcon({
        html: `
          <div class="relative flex flex-col items-center pointer-events-none" style="transform: translate(-50%, -50%);">
            <div class="absolute w-8 h-8 rounded-full bg-amber-400/30 animate-ping"></div>
            <div class="relative w-5 h-5 rounded-full bg-amber-500 border-2 border-white shadow-[0_0_15px_rgba(245,158,11,1)] flex items-center justify-center">
              <div class="w-1.5 h-1.5 rounded-full bg-black"></div>
            </div>
            <div class="mt-1 px-2 py-0.5 rounded bg-black/90 border border-amber-500 text-[10px] font-bold text-amber-300 whitespace-nowrap shadow-md">
              پۆینتی دەستنیشانکراو
            </div>
          </div>
        `,
        className: 'custom-picked-marker',
        iconSize: [100, 40],
        iconAnchor: [50, 20],
      });

      const marker = L.marker([lat, lng], {
        icon: customIcon,
        zIndexOffset: 2000,
      }).addTo(map);

      pickedMarkerRef.current = marker;
    }
  }, [pickedCoords]);

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
  const visibleFacts = useMemo(() => {
    return facts.filter((fact) => {
      if (activeTagFilter !== 'all' && fact.tag !== activeTagFilter) {
        return false;
      }
      return true;
    });
  }, [facts, activeTagFilter]);

  // Update Markers
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
        iconHtml = `
          <div class="kurdish-selected-marker relative flex flex-col items-center cursor-pointer pointer-events-auto" style="transform: translate(-50%, -50%);">
            <div class="absolute w-10 h-10 rounded-full bg-indigo-500/25 animate-ping"></div>
            <div class="absolute w-6 h-6 rounded-full bg-indigo-600/40"></div>
            <div class="relative w-4 h-4 rounded-full bg-indigo-500 border-2 border-white shadow-[0_0_15px_rgba(99,102,241,1)] flex items-center justify-center">
              <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
            </div>
            <div class="mt-1.5 px-2.5 py-1 rounded-md bg-black/95 border border-indigo-500/80 shadow-[0_0_15px_rgba(79,70,229,0.35)] backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap z-50">
              <span class="w-1.5 h-1.5 rounded-full ${
                fact.isCustom ? 'bg-amber-400' : 'bg-indigo-400'
              } shrink-0"></span>
              <span class="text-[11px] font-bold text-white tracking-wide font-sans">${
                fact.name
              }</span>
            </div>
          </div>
        `;
      } else {
        const dotBg = fact.isCustom
          ? 'bg-amber-400 border-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
          : 'bg-indigo-400/70 border-black/80 hover:bg-white shadow-[0_0_6px_rgba(99,102,241,0.6)]';

        iconHtml = `
          <div class="kurdish-dot-marker cursor-pointer transition-transform hover:scale-150" style="transform: translate(-50%, -50%);">
            <div class="w-2.5 h-2.5 rounded-full ${dotBg} border"></div>
          </div>
        `;
      }

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-leaflet-div-icon',
        iconSize: isSelected ? [120, 50] : [10, 10],
        iconAnchor: isSelected ? [60, 20] : [5, 5],
      });

      const lat = Number(fact.lat);
      const lng = Number(fact.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return;
      }

      const marker = L.marker([lat, lng], {
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

    const lat = Number(selectedFact.lat);
    const lng = Number(selectedFact.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    map.flyTo([lat, lng], Math.max(map.getZoom() || 6.5, 8), {
      animate: true,
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [selectedFact?.id, selectedFact?.lat, selectedFact?.lng]);

  // Reset Camera to center of Kurdistan
  const handleResetCamera = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo([36.8, 44.5], 6.5, {
      animate: true,
      duration: 1.2,
    });
  };

  const FilterIconComponent = currentFilterObj.icon;

  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-black select-none ${
        isPickingLocation ? 'cursor-crosshair' : ''
      }`}
    >
      {/* 1. Leaflet Map Viewport */}
      <div ref={mapContainerRef} className="w-full h-full z-0 bg-black" />

      {/* 2. Top-Center Indicators: Pick Mode / Filter Badge / Selected Location Badge */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center gap-1.5">
        {/* A. Picking Location Prompt */}
        {isPickingLocation ? (
          <div className="flex items-center gap-2 pointer-events-auto px-4 py-2 rounded-xl bg-amber-500/95 text-black font-bold text-xs shadow-[0_0_30px_rgba(245,158,11,0.5)] border border-amber-300 animate-bounce">
            <Crosshair className="w-4 h-4 text-black animate-spin" />
            <span>کلیک لەسەر هەر شوێنێکی نەخشە بکە بۆ دانانی پۆینتی دەسەڵات</span>
            {onCancelPickLocation && (
              <button
                onClick={onCancelPickLocation}
                className="mr-2 px-2 py-0.5 rounded bg-black text-amber-300 text-[10px] font-mono cursor-pointer"
              >
                پەشیمانبوونەوە
              </button>
            )}
          </div>
        ) : null}

        {/* B. Active Filter Persistent Badge (Shown whenever activeTagFilter is not 'all') */}
        {activeTagFilter !== 'all' && (
          <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/95 border border-indigo-500/80 shadow-[0_0_25px_rgba(79,70,229,0.45)] backdrop-blur-md animate-fade-in text-right">
            <span
              className="w-2 h-2 rounded-full animate-ping shrink-0"
              style={{ backgroundColor: currentFilterObj.color }}
            />
            <FilterIconComponent
              className={`w-3.5 h-3.5 ${currentFilterObj.accentClass} shrink-0`}
            />
            <span className="text-xs font-bold text-white tracking-wide">
              {currentFilterObj.label}
            </span>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60">
              {visibleFacts.length} شوێن
            </span>
            <button
              onClick={() => handleSelectTagFilter('all')}
              className="p-1 -mr-1 rounded-full text-indigo-400 hover:text-white hover:bg-indigo-950 transition-colors cursor-pointer"
              title="لابردنی فلتەر و پیشاندانی هەمووی"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* C. Filter Notification Toast (Pops up when switched) */}
        {filterNotification && activeTagFilter === 'all' && (
          <div className="pointer-events-auto flex items-center gap-2 px-3 py-1 rounded-full bg-black/90 border border-indigo-950 text-indigo-300 text-[11px] font-medium shadow-xl backdrop-blur-md animate-fade-in">
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
            <span>فلتەر: {filterNotification}</span>
          </div>
        )}

        {/* D. Selected Fact Header Badge */}
        {!isPickingLocation && selectedFact && (
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

      {/* 3. Top-Left Admin Indicator when active */}
      {isAdmin && (
        <div className="absolute top-3 left-3 z-30 pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/90 border border-emerald-500/70 shadow-[0_0_20px_rgba(16,185,129,0.3)] backdrop-blur-md">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <span className="text-[11px] font-bold text-emerald-300">ئەدمین چالاکە</span>
          {onOpenAddFact && (
            <button
              onClick={onOpenAddFact}
              className="mr-1.5 flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 text-[10px] transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>دەسەڵاتی نوێ</span>
            </button>
          )}
          {onLogoutAdmin && (
            <button
              onClick={onLogoutAdmin}
              className="mr-1 flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-950/70 hover:bg-red-900/70 text-red-300 border border-red-800/60 text-[10px] transition-colors cursor-pointer"
              title="داخستنی دۆخی ئەدمین"
            >
              <X className="w-3 h-3" />
              <span>داخستن</span>
            </button>
          )}
        </div>
      )}

      {/* 4. Right Side Vertical Controls Dock */}
      <div className="absolute top-3 right-3 z-30 pointer-events-auto flex flex-col items-center gap-1.5 p-1 rounded-2xl bg-black/80 border border-indigo-950 backdrop-blur-xl shadow-2xl">
        {/* Admin Secret Icon (Click 6 times activates admin code prompt, click once when active to deactivate) */}
        <button
          onClick={handleAdminIconClick}
          title={
            isAdmin
              ? 'دۆخی ئەدمین چالاکە - کلیک بکەوە بۆ لاچوون و داخستنی ئەدمین'
              : adminTapCount > 0
              ? `${adminTapCount}/6 جار کلیک کراوە`
              : 'ئایکۆنی بەڕێوەبردن (٦ جار دەستی لێبدە بۆ چالاککردن)'
          }
          className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border transition-all shadow-lg active:scale-90 ${
            isAdmin
              ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
              : adminTapCount > 0
              ? 'bg-indigo-950/80 border-indigo-500 text-indigo-300 animate-pulse'
              : 'bg-black/60 border-indigo-950 text-indigo-400/50 hover:text-white'
          }`}
        >
          {isAdmin ? (
            <ShieldCheck className="w-3.5 h-3.5" />
          ) : (
            <Shield className="w-3.5 h-3.5" />
          )}
        </button>

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
          {mapMode === 'satellite' ? (
            <Satellite className="w-3.5 h-3.5" />
          ) : (
            <Moon className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Category Filter Toggle with Dynamic Icon & Popover Flyout */}
        <div className="relative">
          <button
            onClick={handleFilterButtonClick}
            title={`فلتەری جۆر: ${currentFilterObj.label}`}
            className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border transition-all shadow-lg cursor-pointer ${
              activeTagFilter !== 'all'
                ? 'bg-indigo-600/40 border-indigo-400 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)] ring-2 ring-indigo-500/40'
                : 'bg-black/60 border-indigo-950 text-indigo-400/60 hover:text-white'
            }`}
          >
            <FilterIconComponent
              className={`w-3.5 h-3.5 ${
                activeTagFilter !== 'all' ? currentFilterObj.accentClass : ''
              }`}
            />
          </button>

          {/* Interactive Popover Menu for Category Filters */}
          {isFilterMenuOpen && (
            <div className="absolute right-10 top-0 w-60 bg-black/95 border border-indigo-900/90 rounded-2xl p-2.5 shadow-[0_0_40px_rgba(15,10,40,0.95)] backdrop-blur-2xl z-50 text-right animate-slide-left space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-indigo-950/80 px-1 text-indigo-300">
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[11px] font-bold text-white">
                    فلتەری جۆری وێستگەکان
                  </span>
                </div>
                <button
                  onClick={() => setIsFilterMenuOpen(false)}
                  className="p-0.5 rounded text-indigo-400 hover:text-white hover:bg-indigo-950 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-1">
                {TAG_FILTER_OPTIONS.map((opt) => {
                  const isSelected = activeTagFilter === opt.id;
                  const IconComp = opt.icon;
                  const count = tagCounts[opt.id] || 0;

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectTagFilter(opt.id)}
                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl transition-all cursor-pointer text-xs ${
                        isSelected
                          ? 'bg-indigo-600 text-white font-bold shadow-[0_0_15px_rgba(79,70,229,0.5)] border border-indigo-400/60'
                          : 'bg-[#030712] text-slate-300 hover:bg-indigo-950/60 hover:text-white border border-indigo-950/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <IconComp
                          className={`w-4 h-4 shrink-0 ${
                            isSelected ? 'text-white' : opt.accentClass
                          }`}
                        />
                        <span className="truncate">{opt.label}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className={`font-mono text-[9px] px-1.5 py-0.2 rounded-full ${
                            isSelected
                              ? 'bg-black/40 text-white font-bold'
                              : 'bg-indigo-950 text-indigo-300'
                          }`}
                        >
                          {count}
                        </span>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Layers: All Markers toggle */}
        <button
          onClick={() => setShowAllMarkers(!showAllMarkers)}
          title={showAllMarkers ? `هەموو ${facts.length} مارکەرەکە` : 'تەنها هەڵبژێردراو'}
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
            title="گەڕان لەناو دەسەڵاتەکاندا"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-black/70 hover:bg-indigo-950/80 border border-indigo-950 text-indigo-300 hover:text-white backdrop-blur-md shadow-lg transition-all active:scale-95"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 5. Bottom Center Floating Capsule Dock */}
      <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-auto sm:left-1/2 sm:-translate-x-1/2 z-30 pointer-events-auto flex flex-col items-center gap-2 max-w-xl w-full">
        {selectedFact && (
          <div
            onClick={() => onOpenDetail && onOpenDetail(selectedFact)}
            className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-black/95 border border-indigo-950 hover:border-indigo-500/60 backdrop-blur-xl shadow-[0_0_30px_rgba(15,10,40,0.9)] cursor-pointer transition-all active:scale-98"
          >
            <span className="text-[10px] font-mono font-bold text-indigo-400/80 tracking-wider">
              KUR
            </span>

            {/* Kurdish Flag Icon in Center */}
            <div className="w-5 h-3.5 rounded-sm bg-gradient-to-b from-red-600 via-white to-emerald-600 flex items-center justify-center shadow-xs">
              <span className="text-[7px] text-amber-500 font-bold leading-none select-none">☀️</span>
            </div>

            {/* Selected Location Name */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-white tracking-wide">
              <span>{selectedFact.name}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
