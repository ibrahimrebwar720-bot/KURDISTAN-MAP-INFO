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
} from 'lucide-react';
import { TimelineSlider } from './TimelineSlider';
import {
  filterFactsByActiveYear,
  formatKurdishYear,
} from '../utils/yearUtils';

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
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const pickedMarkerRef = useRef<L.Marker | null>(null);

  // Map Mode: 'dark' (Esri Dark Canvas) or 'satellite' (Esri Dark Satellite)
  const [mapMode, setMapMode] = useState<'dark' | 'satellite'>('dark');

  // Quick Topic Summary Card state for bottom dock
  const [showQuickSummary, setShowQuickSummary] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

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

    // Center on central Kurdistan: Erbil, Kirkuk, Shingal, Khanaqin & Wasit
    const map = L.map(mapContainerRef.current, {
      center: [35.2, 44.2],
      zoom: 6.5,
      minZoom: 5,
      maxZoom: 16,
      zoomControl: false,
      attributionControl: false,
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

    // Set initial bounds to frame all of Erbil, Kirkuk, Shingal, Khanaqin, and down to Badra & Jassan in Wasit
    map.fitBounds(
      [
        [32.6, 40.8], // Southwest: covering Badra & Jassan in Wasit (33.0°N) and Shingal in west (41.1°E)
        [37.5, 47.2], // Northeast: covering Erbil, Kirkuk, Khanaqin & Zagros
      ],
      {
        paddingTopLeft: [20, 20],
        paddingBottomRight: [20, 105], // Ensure Badra & Jassan in Wasit are not obscured by bottom timeline dock
      }
    );

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

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
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
          <div class="kurdish-selected-marker relative flex flex-col items-center cursor-pointer pointer-events-auto" style="transform: translate(-50%, -50%);">
            <div class="absolute w-10 h-10 rounded-full animate-ping" style="background-color: ${glowColor}; opacity: 0.35;"></div>
            <div class="absolute w-6 h-6 rounded-full" style="background-color: ${glowColor}; opacity: 0.5;"></div>
            <div class="relative w-4 h-4 rounded-full border-2 border-white flex items-center justify-center" style="background-color: ${tagColor}; box-shadow: 0 0 15px ${glowColor};">
              <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
            </div>
            <div class="mt-1.5 px-2.5 py-1 rounded-md bg-black/95 border border-indigo-500/80 shadow-[0_0_15px_rgba(79,70,229,0.35)] backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap z-50">
              <span class="w-1.5 h-1.5 rounded-full shrink-0" style="background-color: ${tagColor};"></span>
              <span class="text-[11px] font-bold text-white tracking-wide font-sans">${fact.name}</span>
            </div>
          </div>
        `;
      } else {
        iconHtml = `
          <div class="kurdish-dot-marker cursor-pointer transition-transform hover:scale-150" style="transform: translate(-50%, -50%);">
            <div class="w-2.5 h-2.5 rounded-full border border-black/80 hover:bg-white shadow-sm" style="background-color: ${tagColor}; box-shadow: 0 0 6px ${glowColor};"></div>
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

  // Smooth camera flyTo on selectedFact change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedFact) return;

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
      const safeZoom = Number.isFinite(currentZoom) ? Math.max(currentZoom, 8) : 8;
      map.flyTo([lat, lng], safeZoom, {
        animate: true,
        duration: 1.2,
        easeLinearity: 0.25,
      });
    } catch {
      try {
        map.setView([lat, lng], 8);
      } catch {}
    }
  }, [selectedFact?.id, selectedFact?.lat, selectedFact?.lng]);

  // Reset Camera to center of Kurdistan
  const handleResetCamera = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    try {
      const size = map.getSize();
      if (!size || size.x === 0 || size.y === 0) {
        map.setView([36.8, 44.5], 6.5);
        return;
      }
      map.flyTo([36.8, 44.5], 6.5, {
        animate: true,
        duration: 1.2,
      });
    } catch {
      try {
        map.setView([36.8, 44.5], 6.5);
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

        {/* Filter Notification Toast (Pops up when switched) */}
        {filterNotification && activeTagFilter === 'all' && (
          <div className="pointer-events-auto flex items-center gap-2 px-3 py-1 rounded-full bg-black/90 border border-indigo-950 text-indigo-300 text-[11px] font-medium shadow-xl backdrop-blur-md animate-fade-in">
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
            <span>فلتەر: {filterNotification}</span>
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

        {/* Overview Viewport Reset (Framing Erbil, Kirkuk, Shingal, Khanaqin, Badra & Jassan) */}
        <button
          onClick={() => {
            if (!mapInstanceRef.current) return;
            mapInstanceRef.current.flyToBounds(
              [
                [32.6, 40.8],
                [37.5, 47.2],
              ],
              {
                paddingTopLeft: [20, 20],
                paddingBottomRight: [20, 105],
                duration: 1.2,
              }
            );
          }}
          title="گەڕانەوە بۆ نەخشەی گشتی (هەولێر، کەرکووک، شنگاڵ، خانەقین، بەدرە و جەسان)"
          className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border border-amber-500/40 bg-[#080c14]/90 text-amber-400 hover:text-white hover:border-amber-400 transition-all shadow-lg cursor-pointer"
        >
          <Compass className="w-3.5 h-3.5" />
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

      {/* 5. Bottom Center Floating Capsule & Year Timeline Slider Dock (باریک، تەنک و جوان بۆ مۆبایلیش) */}
      <div className="absolute bottom-1.5 left-1.5 right-1.5 sm:bottom-2 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-2xl z-30 pointer-events-auto flex flex-col items-center gap-0.5 sm:gap-1 w-auto sm:w-full">
        {/* Quick Topic Summary Card with Beautiful Motion & Graphic (کورتەی بابەت بە مۆنشن و گرافیکی پرۆفێشناڵ) */}
        {selectedFact && showQuickSummary && (
          <div
            className="w-full max-w-md sm:max-w-lg mb-1.5 p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-[#0e1626]/98 via-[#080d17]/98 to-[#03060c]/98 border border-amber-500/40 shadow-[0_15px_45px_rgba(0,0,0,0.95),0_0_30px_rgba(245,158,11,0.2)] backdrop-blur-2xl text-right animate-summary-popup z-40 transition-all select-text"
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
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-medium">
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

            {/* Location Description */}
            {selectedFact.desc && (
              <div className="flex items-center gap-1.5 mb-2 text-[11px] text-amber-200/90 font-medium">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{selectedFact.desc}</span>
              </div>
            )}

            {/* Summary Text Content with Elegant Typography */}
            <div className="p-2.5 rounded-xl bg-black/60 border border-indigo-950/80 text-slate-200 text-xs sm:text-[13px] leading-relaxed max-h-36 overflow-y-auto shadow-inner">
              <p className="line-clamp-5 whitespace-pre-line">
                {selectedFact.fullText || selectedFact.desc}
              </p>
            </div>

            {/* Action Footer */}
            <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-indigo-950/80">
              <div className="flex items-center gap-1.5">
                {onOpenDetail && (
                  <button
                    onClick={() => {
                      setShowQuickSummary(false);
                      onOpenDetail(selectedFact);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-bold text-xs shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all cursor-pointer active:scale-95"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-black" />
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
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/60 hover:bg-indigo-950/70 text-slate-300 hover:text-white border border-indigo-900/60 text-[10px] transition-colors cursor-pointer"
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
            className="group flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg sm:rounded-xl bg-[#080c14]/95 hover:bg-[#0f172a] border border-amber-500/40 hover:border-amber-400 backdrop-blur-xl shadow-lg cursor-pointer transition-all duration-200 active:scale-95 animate-fade-in text-right"
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
    </div>
  );
};
