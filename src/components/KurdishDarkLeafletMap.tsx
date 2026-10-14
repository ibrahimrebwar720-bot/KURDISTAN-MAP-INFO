import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FactItem, GREAT_KURDISTAN_POLYGON } from '../data/kurdishHistoryData';
import {
  createCachedTileLayer,
  preloadKurdistanTiles,
  DARK_MAP_TILE_URL,
  SATELLITE_MAP_TILE_URL,
} from '../services/mapTileCacheService';
import {
  Layers,
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
  Hourglass,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Calendar,
  History,
  Landmark,
  Award,
  Briefcase,
  BookOpen,
  Compass,
  MapPin,
  Copy,
  ChevronDown,
  Sparkles,
  Camera,
  Maximize2,
  Image as ImageIcon,
} from 'lucide-react';
import { TimelineSlider } from './TimelineSlider';
import {
  filterFactsByActiveYear,
  formatKurdishYear,
} from '../utils/yearUtils';
import { KurdishMapBorderIllumination } from './KurdishMapBorderIllumination';

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
  // Year & Timeline Slider Props
  selectedYear?: number | 'all';
  onYearChange?: (year: number | 'all') => void;
  // Admin Props
  isAdmin?: boolean;
  onTriggerAdminPin: () => void;
  onOpenAddFact?: () => void;
  onLogoutAdmin?: () => void;
  isPickingLocation?: boolean;
  onPickLocation?: (lat: number, lng: number) => void;
  onCancelPickLocation?: () => void;
  pickedCoords?: { lat: number; lng: number } | null;
  onReplayIntro?: () => void;
  playMapIntro?: boolean;
  onMapIntroComplete?: () => void;
}

const TAG_FILTER_OPTIONS = [
  {
    id: 'all',
    label: 'هەموو دەسەڵاتەکان',
    shortLabel: 'هەمووی',
    icon: SlidersHorizontal,
    color: '#6366f1',
    accentClass: 'text-indigo-400',
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
    id: 'empire',
    label: 'دەوڵەت و ئیمپراتۆریەتەکان',
    shortLabel: 'دەوڵەتەکان',
    icon: Crown,
    color: '#3b82f6',
    accentClass: 'text-blue-400',
  },
  {
    id: 'minister',
    label: 'وەزیر و سەروەران',
    shortLabel: 'وەزیر',
    icon: Award,
    color: '#06b6d4',
    accentClass: 'text-cyan-400',
  },
  {
    id: 'official',
    label: 'کاربەدەستان و بەڕێوەبەران',
    shortLabel: 'کاربەدەست',
    icon: Briefcase,
    color: '#f97316',
    accentClass: 'text-orange-400',
  },
  {
    id: 'scholar',
    label: 'زانایان و بیرمەندان',
    shortLabel: 'زانا',
    icon: BookOpen,
    color: '#10b981',
    accentClass: 'text-emerald-400',
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
  selectedYear = 'all',
  onYearChange,
  isAdmin = false,
  onTriggerAdminPin,
  onOpenAddFact,
  onLogoutAdmin,
  isPickingLocation = false,
  onPickLocation,
  onCancelPickLocation,
  pickedCoords,
  onReplayIntro,
  playMapIntro = false,
  onMapIntroComplete,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [leafletMap, setLeafletMap] = useState<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const pickedMarkerRef = useRef<L.Marker | null>(null);

  // Map Mode: 'dark' (Esri Dark Canvas) or 'satellite' (Esri Dark Satellite)
  const [mapMode, setMapMode] = useState<'dark' | 'satellite'>('dark');

  // Quick Topic Summary Card state for bottom dock
  const [showQuickSummary, setShowQuickSummary] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{
    url: string;
    caption?: string;
    title: string;
  } | null>(null);

  // Filter Menu Popover & Toast state
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
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
    setIsMoreMenuOpen(false);

    const targetOpt = TAG_FILTER_OPTIONS.find((t) => t.id === tagId) || TAG_FILTER_OPTIONS[0];
    setFilterNotification(targetOpt.label);

    if (filterNotificationTimeoutRef.current) {
      clearTimeout(filterNotificationTimeoutRef.current);
    }
    filterNotificationTimeoutRef.current = setTimeout(() => {
      setFilterNotification(null);
    }, 3500);
  };

  // Toggle or open filter menu and automatically close more menu
  const handleFilterButtonClick = () => {
    setIsMoreMenuOpen(false);
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

    // Center on Greater Kurdistan (Bakur, Bashur, Rojava, Rojhelat)
    // Optimized for 60 FPS - 120 FPS high-refresh rate displays (ProMotion / 120Hz OLEDs)
    const map = L.map(mapContainerRef.current, {
      center: [36.2, 43.8],
      zoom: 5.5,
      minZoom: 4,
      maxZoom: 16,
      zoomControl: false,
      attributionControl: false,
      zoomAnimation: true,
      zoomAnimationThreshold: 8,
      fadeAnimation: true,
      markerZoomAnimation: true,
      inertia: true,
      inertiaDeceleration: 3400, // Smooth 120fps friction curve
      inertiaMaxSpeed: 2400,
      easeLinearity: 0.15,
      wheelDebounceTime: 20, // Rapid responsive wheel response for high Hz mice/trackpads
      wheelPxPerZoomLevel: 90,
    });

    // Dark TileLayer with persistent CacheStorage - avoids black loading squares
    const darkTileLayer = createCachedTileLayer(DARK_MAP_TILE_URL, {
      maxZoom: 16,
      subdomains: ['server', 'services'],
    });

    darkTileLayer.addTo(map);
    tileLayerRef.current = darkTileLayer;

    // Layer Group for markers
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Frame all of Greater Kurdistan cleanly so the whole map is clearly visible upon opening
    const kurdistanBounds = L.latLngBounds(GREAT_KURDISTAN_POLYGON);
    map.fitBounds(kurdistanBounds, {
      padding: [20, 20],
      maxZoom: 6.2,
    });

    // Invalidate size after layout settles to prevent NaN coordinates in flyTo
    const timer = setTimeout(() => {
      try {
        map.invalidateSize();
      } catch {}
    }, 150);

    const handleResize = () => {
      try {
        map.invalidateSize();
      } catch {}
    };
    window.addEventListener('resize', handleResize);

    // Silently pre-cache Kurdistan region base map tiles in background
    preloadKurdistanTiles();

    mapInstanceRef.current = map;
    setLeafletMap(map);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapInstanceRef.current = null;
      setLeafletMap(null);
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
      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        return;
      }

      const customIcon = L.divIcon({
        html: `
          <div class="relative w-6 h-6 flex items-center justify-center select-none pointer-events-none">
            <div class="absolute -inset-1 rounded-full bg-amber-400/35 animate-ping"></div>
            <div class="relative w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow-[0_0_15px_rgba(245,158,11,1)] flex items-center justify-center">
              <div class="w-1.5 h-1.5 rounded-full bg-black"></div>
            </div>
            <div class="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-0.5 rounded bg-black/95 border border-amber-500 text-[10px] font-bold text-amber-300 whitespace-nowrap shadow-md" dir="rtl">
              پۆینتی دەستنیشانکراو
            </div>
          </div>
        `,
        className: 'custom-picked-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      try {
        const marker = L.marker([lat, lng], {
          icon: customIcon,
          zIndexOffset: 2000,
        }).addTo(map);

        pickedMarkerRef.current = marker;
      } catch (err) {
        console.warn('Failed to place picked marker:', err);
      }
    }
  }, [pickedCoords]);

  // Switch Tile Layer when mapMode changes (Cached & Smooth)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    if (mapMode === 'satellite') {
      const satLayer = createCachedTileLayer(SATELLITE_MAP_TILE_URL, { maxZoom: 16 });
      satLayer.addTo(map);
      tileLayerRef.current = satLayer;
    } else {
      const darkLayer = createCachedTileLayer(DARK_MAP_TILE_URL, {
        maxZoom: 16,
        subdomains: ['server', 'services'],
      });
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
        color: '#f59e0b',
        weight: 1.8,
        opacity: 0.75,
        fillColor: '#f59e0b',
        fillOpacity: 0.05,
        dashArray: '6, 6',
      }).addTo(map);

      polygonLayerRef.current = polygon;
    }
  }, [showPolygon]);

  // Filter facts based on Active Year and Category Tag
  const visibleFacts = useMemo(() => {
    let list = facts;
    // 1. Active Year Filter (Checks startYear <= selectedYear <= endYear)
    if (selectedYear !== 'all') {
      list = filterFactsByActiveYear(list, selectedYear);
    }

    // 2. Category Tag Filter
    if (activeTagFilter !== 'all') {
      list = list.filter((fact) => fact.tag === activeTagFilter);
    }
    return list;
  }, [facts, activeTagFilter, selectedYear]);

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

      // Determine color based on tag
      let tagColor = '#6366f1';
      let glowColor = 'rgba(99,102,241,0.8)';
      if (fact.tag === 'minister') {
        tagColor = '#06b6d4';
        glowColor = 'rgba(6,182,212,0.85)';
      } else if (fact.tag === 'official') {
        tagColor = '#f97316';
        glowColor = 'rgba(249,115,22,0.85)';
      } else if (fact.tag === 'scholar') {
        tagColor = '#10b981';
        glowColor = 'rgba(16,185,129,0.85)';
      } else if (fact.tag === 'empire') {
        tagColor = '#3b82f6';
        glowColor = 'rgba(59,130,246,0.85)';
      } else if (fact.tag === 'principality') {
        tagColor = '#eab308';
        glowColor = 'rgba(234,179,8,0.85)';
      } else if (fact.tag === 'capital') {
        tagColor = '#a855f7';
        glowColor = 'rgba(168,85,247,0.85)';
      } else if (fact.tag === 'battle') {
        tagColor = '#ef4444';
        glowColor = 'rgba(239,68,68,0.85)';
      }

      let iconHtml = '';

      if (isSelected) {
        iconHtml = `
          <div class="relative w-7 h-7 flex items-center justify-center select-none pointer-events-auto">
            <!-- Outer glowing pulse ring centered on the pin -->
            <div class="absolute -inset-1.5 rounded-full animate-ping pointer-events-none opacity-40" style="background-color: ${glowColor};"></div>
            
            <!-- Secondary soft halo centered on the pin -->
            <div class="absolute inset-0 rounded-full pointer-events-none opacity-60" style="background-color: ${glowColor};"></div>
            
            <!-- Central Pin Dot (Centered exactly at (14px, 14px)) -->
            <div class="relative w-4 h-4 rounded-full border-2 border-white flex items-center justify-center cursor-pointer shadow-lg z-10" style="background-color: ${tagColor}; box-shadow: 0 0 16px ${glowColor};">
              <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
            </div>

            <!-- Name Label Tag (Hangs directly below the pin, centered horizontally at 50% without displacing the anchor) -->
            <div class="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 pointer-events-auto z-50">
              <!-- Little arrow triangle pointing up to the pin dot -->
              <div class="w-2 h-2 rotate-45 bg-[#080c14] border-t border-l border-indigo-500/80 mx-auto -mb-1 shadow-xs"></div>
              <!-- Badge Content in RTL -->
              <div dir="rtl" class="px-2.5 py-1 rounded-md bg-[#080c14]/95 border border-indigo-500/80 shadow-[0_4px_20px_rgba(0,0,0,0.9),0_0_15px_rgba(79,70,229,0.35)] backdrop-blur-md whitespace-nowrap text-right">
                <span class="text-[11px] font-bold text-white tracking-wide font-sans">${fact.name}</span>
              </div>
            </div>
          </div>
        `;
      } else {
        iconHtml = `
          <div class="w-4 h-4 flex items-center justify-center cursor-pointer pointer-events-auto transition-transform duration-150 hover:scale-125 select-none">
            <div class="w-2.5 h-2.5 rounded-full border border-black/80 hover:bg-white shadow-sm transition-colors" style="background-color: ${tagColor}; box-shadow: 0 0 6px ${glowColor};"></div>
          </div>
        `;
      }

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'kurdish-map-marker-container',
        iconSize: isSelected ? [28, 28] : [16, 16],
        iconAnchor: isSelected ? [14, 14] : [8, 8],
      });

      const lat = Number(fact.lat);
      const lng = Number(fact.lng);
      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        return;
      }

      try {
        const marker = L.marker([lat, lng], {
          icon: customIcon,
          zIndexOffset: isSelected ? 1000 : 10,
        });

        marker.on('click', () => {
          onSelectFact(fact);
          setShowQuickSummary(true);
        });

        markersLayer.addLayer(marker);
      } catch (err) {
        console.warn('Failed to add marker:', err);
      }
    });
  }, [visibleFacts, selectedFact?.id, showAllMarkers]);

  // Smooth camera flyTo on selectedFact change (disabled while intro is running)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedFact || playMapIntro) return;

    const lat = Number(selectedFact.lat);
    const lng = Number(selectedFact.lng);
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return;
    }

    try {
      const size = map.getSize();
      if (!size || size.x === 0 || size.y === 0) {
        map.setView([lat, lng], 8);
        return;
      }
      const currentZoom = map.getZoom();
      const safeZoom = Number.isFinite(currentZoom) ? Math.max(currentZoom, 7.5) : 7.5;
      map.flyTo([lat, lng], safeZoom, {
        animate: true,
        duration: 1.2,
        easeLinearity: 0.25,
      });
    } catch {
      try {
        map.setView([lat, lng], 7.5);
      } catch {}
    }
  }, [selectedFact?.id, selectedFact?.lat, selectedFact?.lng, playMapIntro]);

  // Reset Camera to full view of Greater Kurdistan
  const handleResetCamera = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    try {
      const kurdistanBounds = L.latLngBounds(GREAT_KURDISTAN_POLYGON);
      map.fitBounds(kurdistanBounds, {
        padding: [25, 25],
        maxZoom: 6.2,
        animate: true,
      });
    } catch {
      try {
        map.setView([36.2, 43.8], 5.5);
      } catch {}
    }
  };

  const FilterIconComponent = currentFilterObj.icon;

  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-[#12161f] select-none ${
        isPickingLocation ? 'cursor-crosshair' : ''
      }`}
    >
      {/* 1. Leaflet Map Viewport */}
      <div ref={mapContainerRef} className="w-full h-full z-0 bg-[#12161f]" />

      {/* 2. 4-Second Kurdistan Border Light Beam Motion Graphic & Illumination directly on real map */}
      <KurdishMapBorderIllumination
        map={leafletMap}
        isActive={!!playMapIntro}
        onComplete={() => {
          if (onMapIntroComplete) onMapIntroComplete();
        }}
        durationMs={4000}
      />

      {/* 3. Top-Center Indicators: Pick Mode / Filter Badge / Selected Location Badge */}
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
          <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#070b14]/75 border border-amber-500/25 shadow-[0_8px_30px_rgba(0,0,0,0.7),0_0_20px_rgba(245,158,11,0.12)] backdrop-blur-xl animate-fade-in text-right">
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
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
              {visibleFacts.length} شوێن
            </span>
            <button
              onClick={() => handleSelectTagFilter('all')}
              className="p-1 -mr-1 rounded-full text-amber-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="لابردنی فلتەر و پیشاندانی هەمووی"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Filter Notification Toast (Pops up when switched) */}
        {filterNotification && activeTagFilter === 'all' && (
          <div className="pointer-events-auto flex items-center gap-2 px-3 py-1 rounded-full bg-[#070b14]/75 border border-amber-500/20 text-amber-300 text-[11px] font-medium shadow-xl backdrop-blur-xl animate-fade-in">
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>فلتەر: {filterNotification}</span>
          </div>
        )}
      </div>

      {/* 3. Top-Left Admin Indicator when active */}
      {isAdmin && (
        <div className="absolute top-3 left-3 z-30 pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#070b14]/75 border border-amber-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_20px_rgba(245,158,11,0.1)] backdrop-blur-xl">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
          <span className="text-[11px] font-bold text-amber-300">ئەدمین چالاکە</span>
          {onOpenAddFact && (
            <button
              onClick={onOpenAddFact}
              className="mr-1.5 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>زیادکردنی بابەت</span>
            </button>
          )}
          {onLogoutAdmin && (
            <button
              onClick={onLogoutAdmin}
              className="mr-1 flex items-center gap-1 px-2 py-1 rounded-xl bg-red-950/70 hover:bg-red-900/70 text-red-300 border border-red-800/60 text-[10px] transition-colors cursor-pointer"
              title="داخستنی دۆخی ئەدمین"
            >
              <X className="w-3 h-3" />
              <span>داخستن</span>
            </button>
          )}
        </div>
      )}

      {/* 4. "زیاتر" Button & 3D Glass Marbles Dock ("تۆپ تۆپ وەک هەڵمات بکەونە سەر یەک بە گرافیکێکی زۆر شاز") */}
      {/* Backdrop to close menu when tapping anywhere on map */}
      {/* Backdrop to close menu when tapping anywhere on map */}
      {(isMoreMenuOpen || isFilterMenuOpen) && (
        <div
          className="fixed inset-0 z-28 bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in cursor-pointer"
          onClick={() => {
            setIsMoreMenuOpen(false);
            setIsFilterMenuOpen(false);
          }}
        />
      )}

      <div className="absolute top-3 right-3 z-30 pointer-events-auto flex flex-col items-end gap-2">
        {/* The Primary "زیاتر" (More) Floating Button - Simple & Clean Design */}
        <button
          onClick={() => {
            setIsMoreMenuOpen(!isMoreMenuOpen);
            if (isMoreMenuOpen) setIsFilterMenuOpen(false);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl backdrop-blur-xl border transition-all duration-200 shadow-xl cursor-pointer select-none ${
            isMoreMenuOpen
              ? 'bg-amber-500 text-black font-extrabold border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
              : 'bg-[#070b14]/75 hover:bg-[#0d1424]/85 border-amber-500/25 hover:border-amber-400 text-slate-100 hover:text-amber-300 shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
          }`}
          title="زیاتر - کرداری خێرا و ئامرازەکانی نەخشە"
        >
          <span className="font-heading font-medium text-xs">
            {isMoreMenuOpen ? 'داخستن' : 'زیاتر'}
          </span>
          {isMoreMenuOpen ? (
            <X className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
          )}
        </button>

        {/* Simple & Clean Dropdown Menu ("بەشی زیاتر: سادە و ساکار بەبێ تۆپ تۆپ") */}
        {isMoreMenuOpen && (
          <div
            className="w-56 bg-[#070b14]/80 border border-amber-500/25 rounded-2xl p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_20px_rgba(245,158,11,0.12)] backdrop-blur-2xl text-right flex flex-col gap-1 animate-menu-dropdown z-30"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1. پێڕست و بابەتەکان (Menu & Drawer) - (Search is inside menu drawer) */}
            <button
              onClick={() => {
                setIsMoreMenuOpen(false);
                setIsFilterMenuOpen(false);
                if (onOpenMenu) onOpenMenu();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-amber-200 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <Menu className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                <span className="font-medium">پێڕست و بابەتەکان</span>
              </div>
            </button>

            {/* 2. فلتەری دەسەڵاتەکان (Filter Categories) - Closes more menu automatically */}
            <button
              onClick={() => {
                setIsMoreMenuOpen(false);
                setIsFilterMenuOpen(true);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer border ${
                activeTagFilter !== 'all'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'text-slate-200 hover:text-amber-200 hover:bg-amber-500/10 border-transparent hover:border-amber-500/20'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-medium">فلتەری بابەتەکان</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {currentFilterObj.label}
              </span>
            </button>

            {/* 3. مارکەرەکان (Layers Toggle) */}
            <button
              onClick={() => {
                setShowAllMarkers(!showAllMarkers);
                setIsMoreMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-amber-200 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-medium">نیشاندانی مارکەرەکان</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 text-slate-300">
                {showAllMarkers ? `هەمووی (${facts.length})` : 'یەک'}
              </span>
            </button>

            {/* 4. تەواوی نەخشەی کوردستان (Full Map View) */}
            <button
              onClick={() => {
                handleResetCamera();
                setIsMoreMenuOpen(false);
                setIsFilterMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-amber-200 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Compass className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-medium">تەواوی نەخشە</span>
              </div>
            </button>

            {/* دووبارەکردنەوەی ئینترۆی تیشکی نەخشە */}
            {onReplayIntro && (
              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onReplayIntro();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-amber-200 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-medium">دووبارەکردنەوەی ئینترۆی نەخشە</span>
                </div>
              </button>
            )}

            {/* 5. گۆڕینی شێوازی نەخشە: تاریک / مانگی دەستکرد */}
            <button
              onClick={() => {
                setMapMode(mapMode === 'dark' ? 'satellite' : 'dark');
                setIsMoreMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-amber-200 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Satellite className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-medium">
                  {mapMode === 'dark' ? 'نەخشەی مانگی دەستکرد' : 'نەخشەی تاریک'}
                </span>
              </div>
            </button>

            {/* 6. زیادکردنی بابەت (کاتێک ئەدمین چالاکە) */}
            {isAdmin && onOpenAddFact && (
              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onOpenAddFact();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Plus className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-bold">زیادکردنی بابەت</span>
                </div>
              </button>
            )}

            {/* 7. بەڕێوەبردن (Admin Secret Mode) */}
            <button
              onClick={() => {
                handleAdminIconClick();
                if (isAdmin) setIsMoreMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer border ${
                isAdmin
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'text-slate-300 hover:text-amber-200 hover:bg-amber-500/10 border-transparent hover:border-amber-500/20'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isAdmin ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Shield className="w-4 h-4 text-amber-400/80 shrink-0" />
                )}
                <span className="font-medium">
                  {isAdmin
                    ? 'ئەدمین چالاکە'
                    : adminTapCount > 0
                    ? `بەڕێوەبردن (${adminTapCount}/6)`
                    : 'بەڕێوەبردن'}
                </span>
              </div>
            </button>
          </div>
        )}

        {/* Interactive Popover Menu for Category Filters - Independent from More menu */}
        {isFilterMenuOpen && (
          <div
            className="w-64 bg-[#070b14]/80 border border-amber-500/25 rounded-2xl p-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_25px_rgba(245,158,11,0.15)] backdrop-blur-2xl z-40 text-right animate-menu-dropdown space-y-2 mt-1"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-amber-500/20 px-1 text-amber-300">
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-bold text-amber-200">
                  فلتەری جۆری دەسەڵاتەکان
                </span>
              </div>
              <button
                onClick={() => setIsFilterMenuOpen(false)}
                className="p-1 rounded-lg text-amber-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="داخستن"
              >
                <X className="w-3.5 h-3.5" />
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
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-amber-500 text-black font-extrabold shadow-md border border-amber-300'
                        : 'bg-[#050812]/50 text-slate-200 hover:bg-amber-500/15 hover:text-amber-200 border border-slate-800/80 hover:border-amber-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <IconComp
                        className={`w-4 h-4 shrink-0 ${
                          isSelected ? 'text-black' : 'text-amber-400'
                        }`}
                      />
                      <span className="truncate">{opt.label}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className={`font-mono text-[9px] px-1.5 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-black/30 text-black font-bold'
                            : 'bg-white/5 text-amber-300/80'
                        }`}
                      >
                        {count}
                      </span>
                      {isSelected && <Check className="w-3 h-3 text-black font-bold" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 5. Bottom Center Floating Capsule & Year Timeline Slider Dock (باریک، تەنک و ڕوون لەسەر مۆبایل بەبێ پێویستی بە سکرۆڵ) */}
      <div
        className="absolute left-1.5 right-1.5 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-2xl z-40 pointer-events-auto flex flex-col items-center gap-0.5 sm:gap-1 w-auto sm:w-full max-h-[calc(100dvh-4rem)] overflow-y-auto scrollbar-none"
        style={{
          bottom: 'max(0.6rem, calc(env(safe-area-inset-bottom, 0px) + 0.35rem))',
        }}
      >
        {/* Quick Topic Summary Card with Beautiful Motion & Graphic (کورتەی بابەت بە مۆنشن و گرافیکی پرۆفێشناڵ) */}
        {selectedFact && showQuickSummary && (
          <div
            className="w-full max-w-md sm:max-w-lg mb-1 p-3 sm:p-4 rounded-2xl bg-[#070b14]/80 border border-amber-500/25 shadow-[0_16px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(245,158,11,0.15)] backdrop-blur-2xl text-right animate-summary-popup z-40 transition-all select-text shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative Header with Kurdish Flag, Golden Sun & Category */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-500/20">
              <div className="flex items-center gap-2 min-w-0">
                {/* Kurdish Flag badge with glowing sun */}
                <div className="w-6 h-4 rounded-xs bg-gradient-to-b from-red-600 via-white to-emerald-600 flex items-center justify-center shadow-xs shrink-0 border border-amber-400/50">
                  <span className="text-[7px] text-amber-500 font-bold leading-none select-none">☀️</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-amber-400 tracking-wider">
                      کورتەی بابەت
                    </span>
                    {selectedFact.tag && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium">
                        {selectedFact.tag}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold font-heading text-white truncate drop-shadow-xs mt-0.5">
                    {selectedFact.name}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {(selectedFact.year || selectedFact.century) && (
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-700/60 shadow-xs">
                    {selectedFact.year || selectedFact.century}
                  </span>
                )}
                <button
                  onClick={() => setShowQuickSummary(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="داخستنی کورتە"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Topic Image with Glassmorphism Border & Small Information Text */}
            {selectedFact.imageUrl && (
              <div className="relative mb-2.5 rounded-xl overflow-hidden border border-amber-500/30 bg-black/70 group shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
                <img
                  src={selectedFact.imageUrl}
                  alt={selectedFact.imageCaption || selectedFact.name}
                  className="w-full h-36 sm:h-44 object-cover object-center group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                  onClick={() =>
                    setLightboxImage({
                      url: selectedFact.imageUrl!,
                      caption: selectedFact.imageCaption,
                      title: selectedFact.name,
                    })
                  }
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070b14]/90 via-transparent to-black/20 pointer-events-none" />

                {/* Small Caption / Information on the image (نوسینی بچووک بۆ زانیاری لەسەر وێنەکە) */}
                {selectedFact.imageCaption && (
                  <div className="absolute bottom-1.5 right-1.5 left-1.5 px-2 py-1 rounded-lg bg-[#070b14]/90 border border-amber-500/30 text-amber-200 text-[10px] sm:text-[11px] backdrop-blur-md flex items-center justify-between gap-1.5 shadow-sm">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Camera className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="truncate font-medium">{selectedFact.imageCaption}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxImage({
                          url: selectedFact.imageUrl!,
                          caption: selectedFact.imageCaption,
                          title: selectedFact.name,
                        });
                      }}
                      className="p-0.5 rounded text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                      title="گەورەکردنی وێنە"
                    >
                      <Maximize2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Location Description */}
            {selectedFact.desc && (
              <div className="flex items-center gap-1.5 mb-2 text-[11px] text-amber-200/90 font-medium">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{selectedFact.desc}</span>
              </div>
            )}

            {/* Summary Text Content with Elegant Typography */}
            <div className="p-3 rounded-xl bg-black/45 border border-amber-500/15 text-slate-200 text-xs sm:text-[13px] leading-relaxed max-h-36 overflow-y-auto custom-scrollbar">
              <p className="line-clamp-5 whitespace-pre-line">
                {selectedFact.fullText || selectedFact.desc}
              </p>
            </div>

            {/* Action Footer */}
            <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-amber-500/20">
              <div className="flex items-center gap-1.5">
                {onOpenDetail && (
                  <button
                    onClick={() => {
                      setShowQuickSummary(false);
                      onOpenDetail(selectedFact);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all cursor-pointer active:scale-95"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-slate-950" />
                    <span>زانیاری زیاتر و بەڵگەنامەکان</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${selectedFact.name}\n${selectedFact.fullText || selectedFact.desc}\nشوێن: ${selectedFact.desc}`
                    );
                    setCopiedSummary(true);
                    setTimeout(() => setCopiedSummary(false), 2000);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-black/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-[10px] transition-colors cursor-pointer"
                  title="لەبەرگرتنەوەی دەق"
                >
                  {copiedSummary ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-slate-400" />
                  )}
                  <span>{copiedSummary ? 'کۆپیکرا' : 'کۆپی'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Timeline Slider Component */}
        <TimelineSlider
          facts={facts}
          selectedYear={selectedYear}
          onYearChange={(newYear) => {
            if (onYearChange) onYearChange(newYear);
          }}
          filteredCount={visibleFacts.length}
          totalCount={facts.length}
        />

        {/* Selected Fact Capsule (Two-Tone Sleek Style - هر پۆینتێک داگرێت ببێتە ئەو شتە و بە کلیک کورتەی بدات) */}
        {selectedFact && (
          <button
            onClick={() => setShowQuickSummary((prev) => !prev)}
            className="group flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-xl sm:rounded-2xl bg-[#070b14]/75 hover:bg-[#0c1220]/85 border border-amber-500/25 hover:border-amber-400/50 backdrop-blur-xl shadow-[0_8px_25px_rgba(0,0,0,0.6)] cursor-pointer transition-all duration-200 active:scale-95 animate-fade-in text-right"
            title="کلیک بکە بۆ پیشاندانی کورتەی بابەت بە مۆنشن و گرافیک"
          >
            {/* Kurdish Flag Icon in Center */}
            <div className="w-3 h-2 sm:w-3.5 sm:h-2.5 rounded-xs bg-gradient-to-b from-red-600 via-white to-emerald-600 flex items-center justify-center shadow-xs shrink-0">
              <span className="text-[4px] sm:text-[5px] text-amber-500 font-bold leading-none select-none">☀️</span>
            </div>

            {/* Selected Location Name */}
            <span className="text-[11px] sm:text-xs font-bold text-white tracking-wide group-hover:text-amber-300 transition-colors truncate max-w-[150px] sm:max-w-xs">
              {selectedFact.name}
            </span>

            {(selectedFact.year || selectedFact.century) && (
              <span className="text-[8px] sm:text-[9px] font-mono text-amber-300 bg-amber-950/80 px-1 sm:px-1.5 py-0.2 rounded border border-amber-800/40 shrink-0">
                {selectedFact.year || selectedFact.century}
              </span>
            )}

            {/* Interactive Motion Indicator */}
            <span className="text-[9px] sm:text-[10px] text-amber-400 font-medium flex items-center gap-0.5 mr-0.5 pr-1 border-r border-amber-900/50 shrink-0">
              <span>کورتە</span>
              <ChevronUp
                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform duration-300 ${
                  showQuickSummary ? 'rotate-180 text-amber-300' : 'text-amber-400 group-hover:-translate-y-0.5'
                }`}
              />
            </span>
          </button>
        )}
      </div>

      {/* Full-Screen Lightbox Modal for Topic Image */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in text-right"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-[#070b14]/90 border border-amber-500/35 rounded-3xl p-4 sm:p-5 shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_40px_rgba(245,158,11,0.2)] backdrop-blur-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-amber-500/20">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                  <Camera className="w-4 h-4" />
                </div>
                <h4 className="text-sm sm:text-base font-bold text-white">
                  {lightboxImage.title}
                </h4>
              </div>
              <button
                onClick={() => setLightboxImage(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 border border-slate-800 transition-colors cursor-pointer"
                title="داخستن"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Image display */}
            <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 max-h-[65vh] w-full flex items-center justify-center bg-black">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.caption || lightboxImage.title}
                className="max-h-[65vh] w-auto max-w-full object-contain"
              />
            </div>

            {/* Small Caption / Description Text */}
            {lightboxImage.caption && (
              <div className="mt-3.5 w-full p-2.5 px-3.5 rounded-xl bg-black/60 border border-amber-500/25 text-amber-200 text-xs sm:text-[13px] backdrop-blur-md flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-medium">{lightboxImage.caption}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
