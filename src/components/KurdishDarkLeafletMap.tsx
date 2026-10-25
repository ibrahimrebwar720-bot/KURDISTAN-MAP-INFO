import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
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
  Images,
  Film,
  Play,
  Pause,
  Medal,
  Palette,
  Link2,
} from 'lucide-react';
import { TimelineSlider } from './TimelineSlider';
import {
  filterFactsByActiveYear,
  formatKurdishYear,
  toKurdishDigits,
  getFactChronologicalYear,
} from '../utils/yearUtils';
import { KurdishMapBorderIllumination } from './KurdishMapBorderIllumination';
import { getCategoryInfo } from '../types/history';
import { useTheme } from '../context/ThemeContext';
import { getLinkedFacts } from '../utils/factRelations';
import { THEME_LIST } from '../types/theme';
import { ThemeSelectorModal } from './ThemeSelectorModal';
import { getFactDisplayImage } from '../utils/historicalImages';

interface Props {
  facts: FactItem[];
  selectedFact: FactItem | null;
  onSelectFact: (fact: FactItem) => void;
  onDeselectFact?: () => void;
  onOpenDetail?: (fact: FactItem) => void;
  showAllMarkers: boolean;
  setShowAllMarkers: (val: boolean) => void;
  showPolygon: boolean;
  setShowPolygon: (val: boolean) => void;
  onOpenMenu?: () => void;
  onOpenGallery?: () => void;
  onOpenTheme?: () => void;
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
  onOpenDocumentaryTour?: () => void;
  externalFlyTo?: { lat: number; lng: number; zoom?: number; id?: string } | null;
}

export const TAG_FILTER_OPTIONS = [
  {
    id: 'all',
    label: 'هەموو پۆلێنەکان',
    shortLabel: 'هەمووی',
    icon: SlidersHorizontal,
    color: '#f59e0b',
    accentClass: 'text-amber-400',
  },
  {
    id: 'principality',
    label: 'میرنشینەکان',
    shortLabel: 'میرنشینەکان',
    icon: Shield,
    color: '#eab308',
    accentClass: 'text-amber-400',
  },
  {
    id: 'civilization',
    label: 'شارستانییەتەکان',
    shortLabel: 'شارستانییەتەکان',
    icon: Landmark,
    color: '#10b981',
    accentClass: 'text-emerald-400',
  },
  {
    id: 'empire',
    label: 'ئیمپراتۆرییەتەکان',
    shortLabel: 'ئیمپراتۆرییەتەکان',
    icon: Crown,
    color: '#f97316',
    accentClass: 'text-orange-400',
  },
  {
    id: 'leader',
    label: 'سەرکردەکان',
    shortLabel: 'سەرکردەکان',
    icon: Medal,
    color: '#f43f5e',
    accentClass: 'text-rose-400',
  },
  {
    id: 'scholar',
    label: 'زانایان',
    shortLabel: 'زانایان',
    icon: BookOpen,
    color: '#06b6d4',
    accentClass: 'text-cyan-400',
  },
  {
    id: 'official',
    label: 'وەزیر و کاربەدەستان',
    shortLabel: 'وەزیر و کاربەدەستان',
    icon: Award,
    color: '#3b82f6',
    accentClass: 'text-blue-400',
  },
  {
    id: 'other_figure',
    label: 'کەسایەتی تر',
    shortLabel: 'کەسایەتی تر',
    icon: Sparkles,
    color: '#ec4899',
    accentClass: 'text-pink-400',
  },
  {
    id: 'castle',
    label: 'قەڵاکان',
    shortLabel: 'قەڵاکان',
    icon: Castle,
    color: '#8b5cf6',
    accentClass: 'text-purple-400',
  },
  {
    id: 'battle',
    label: 'جەنگ و ڕووداوەکان',
    shortLabel: 'جەنگ و ڕووداوەکان',
    icon: Swords,
    color: '#ef4444',
    accentClass: 'text-rose-400',
  },
  {
    id: 'monument',
    label: 'شوێنەوار',
    shortLabel: 'شوێنەوار',
    icon: Compass,
    color: '#14b8a6',
    accentClass: 'text-teal-400',
  },
];

export const KurdishDarkLeafletMap: React.FC<Props> = ({
  facts,
  selectedFact,
  onSelectFact,
  onDeselectFact,
  onOpenDetail,
  showAllMarkers,
  setShowAllMarkers,
  showPolygon,
  setShowPolygon,
  onOpenMenu,
  onOpenGallery,
  onOpenTheme,
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
  onOpenDocumentaryTour,
  externalFlyTo,
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

  // Dynamic Era Atmosphere & Lighting based on timeline year
  // (سەردەمی دێرین تۆنی گەرم و قاوەیی، سەردەمی نوێ ڕووناکی و شین)
  const eraAtmosphere = useMemo(() => {
    if (selectedYear === 'all' || typeof selectedYear !== 'number') {
      return null;
    }
    if (selectedYear < 0) {
      return {
        name: 'سەردەمی دێرین (بەرلە زایین)',
        tintClass: 'bg-gradient-to-t from-amber-950/25 via-amber-900/15 to-transparent',
        glowColor: 'rgba(217, 119, 6, 0.18)',
        borderColor: 'border-amber-500/40',
      };
    }
    if (selectedYear <= 1250) {
      return {
        name: 'سەردەمی ئیسلامی و ناوەڕاست',
        tintClass: 'bg-gradient-to-t from-emerald-950/20 via-teal-900/12 to-transparent',
        glowColor: 'rgba(16, 185, 129, 0.15)',
        borderColor: 'border-emerald-500/40',
      };
    }
    if (selectedYear <= 1850) {
      return {
        name: 'سەردەمی میرنشینەکان',
        tintClass: 'bg-gradient-to-t from-amber-950/20 via-rose-950/12 to-transparent',
        glowColor: 'rgba(245, 158, 11, 0.16)',
        borderColor: 'border-orange-500/40',
      };
    }
    return {
      name: 'سەردەمی هاوچەرخ',
      tintClass: 'bg-gradient-to-t from-blue-950/20 via-indigo-950/15 to-transparent',
      glowColor: 'rgba(59, 130, 246, 0.15)',
      borderColor: 'border-blue-500/40',
    };
  }, [selectedYear]);

  // Handle external flyTo requests (e.g. from Documentary Tour or Split Screen)
  useEffect(() => {
    if (!externalFlyTo || !mapInstanceRef.current) return;
    try {
      mapInstanceRef.current.flyTo([externalFlyTo.lat, externalFlyTo.lng], externalFlyTo.zoom || 8, {
        animate: true,
        duration: 2.2,
        easeLinearity: 0.25,
      });
    } catch (err) {
      console.warn('externalFlyTo error:', err);
    }
  }, [externalFlyTo]);

  // Theme Context & Modal state
  const { theme, themeId, setTheme } = useTheme();
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  // Menu state
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Admin secret 6-tap tracking
  const [adminTapCount, setAdminTapCount] = useState(0);
  const tapTimeoutRef = useRef<any>(null);

  // Compute fact counts per unified category
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = { all: facts.length };
    facts.forEach((f) => {
      const catId = getCategoryInfo(f).id;
      counts[catId] = (counts[catId] || 0) + 1;
    });
    return counts;
  }, [facts]);

  // Selected Fact's linked historical entities & figures
  const selectedLinked = useMemo(() => {
    return getLinkedFacts(selectedFact, facts);
  }, [selectedFact, facts]);

  // Active filter object definition
  const currentFilterObj = useMemo(() => {
    return (
      TAG_FILTER_OPTIONS.find((opt) => opt.id === activeTagFilter) ||
      TAG_FILTER_OPTIONS[0]
    );
  }, [activeTagFilter]);

  // Handle changing filter
  const handleSelectTagFilter = (tagId: string) => {
    setActiveTagFilter(tagId);
    setIsMoreMenuOpen(false);
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

  // Map Click Listener for picking location & deselecting point when tapping empty space
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (isPickingLocation && onPickLocation) {
        onPickLocation(e.latlng.lat, e.latlng.lng);
        return;
      }

      // Close floating menus if open
      setIsMoreMenuOpen(false);

      // Deselect point and dismiss quick summary card when clicking on empty map
      setShowQuickSummary(false);
      if (onDeselectFact) {
        onDeselectFact();
      }
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [isPickingLocation, onPickLocation, onDeselectFact]);

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
        color: theme.primaryColor || '#f59e0b',
        weight: 2,
        opacity: 0.9,
        fillColor: theme.primaryColor || '#f59e0b',
        fillOpacity: 0.07,
        dashArray: '8, 8',
        className: 'luminous-polygon-border',
        interactive: false,
      }).addTo(map);

      polygonLayerRef.current = polygon;
    }
  }, [showPolygon, theme.primaryColor]);

  // Cinematic Guided Tour / Story Mode (گەشتی بینراوی مێژوویی)
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);
  const [isTourPaused, setIsTourPaused] = useState(false);
  const [tourSpeed, setTourSpeed] = useState<number>(7); // seconds per stop
  const [tourProgress, setTourProgress] = useState(0); // 0 to 100%

  // Filter facts based on Active Year and Category Tag
  const visibleFacts = useMemo(() => {
    let list = facts;
    // 1. Category Filter (پۆلێن)
    if (activeTagFilter !== 'all') {
      list = list.filter((fact) => getCategoryInfo(fact).id === activeTagFilter);
    }

    // 2. Active Year Filter (Only if not in tour mode, and when specific year is chosen)
    if (!isTourActive && selectedYear !== 'all') {
      list = filterFactsByActiveYear(list, selectedYear);
    }

    return list;
  }, [facts, activeTagFilter, selectedYear, isTourActive]);

  // Chronologically sorted facts for the Cinematic Story Mode
  // ALWAYS includes all historical places (never filtered down by single year)
  const tourList = useMemo(() => {
    let list = facts;
    if (activeTagFilter !== 'all') {
      const catFiltered = list.filter((fact) => getCategoryInfo(fact).id === activeTagFilter);
      if (catFiltered.length > 0) list = catFiltered;
    }
    return [...list].sort((a, b) => {
      const yearA = getFactChronologicalYear(a);
      const yearB = getFactChronologicalYear(b);
      if (yearA !== yearB) return yearA - yearB;
      return a.id - b.id;
    });
  }, [facts, activeTagFilter]);

  const currentTourFact: FactItem | undefined = tourList[tourIndex];

  // Smooth cinematic flight to target fact
  const flyToTourFact = useCallback(
    (targetFact: FactItem) => {
      const map = mapInstanceRef.current;
      if (!map || !targetFact) return;

      onSelectFact(targetFact);

      if (onYearChange && typeof targetFact.startYear === 'number') {
        onYearChange(targetFact.startYear);
      }

      try {
        const targetZoom = Math.max(targetFact.zoom || 9, 8);
        map.flyTo([targetFact.lat, targetFact.lng], targetZoom, {
          animate: true,
          duration: 2.2,
          easeLinearity: 0.25,
        });
      } catch (err) {
        console.warn('Tour flyTo error:', err);
      }
    },
    [onSelectFact, onYearChange]
  );

  // Toggle Story Mode / Cinematic Tour
  const handleToggleTour = useCallback(() => {
    if (isTourActive) {
      setIsTourActive(false);
      setIsTourPaused(false);
      setTourProgress(0);
      setShowQuickSummary(false);
      if (onYearChange) {
        onYearChange('all');
      }
    } else {
      if (tourList.length === 0) {
        return;
      }

      setShowAllMarkers(true);

      let startIdx = 0;
      if (selectedFact) {
        const found = tourList.findIndex((f) => f.id === selectedFact.id);
        if (found !== -1) startIdx = found;
      }

      setTourIndex(startIdx);
      setIsTourActive(true);
      setIsTourPaused(false);
      setTourProgress(0);
      setShowQuickSummary(false);
      setIsMoreMenuOpen(false);
      flyToTourFact(tourList[startIdx]);
    }
  }, [isTourActive, tourList, selectedFact, flyToTourFact, onYearChange, setShowAllMarkers]);

  const handleNextTourFact = useCallback(() => {
    if (tourList.length === 0) return;
    const nextIdx = (tourIndex + 1) % tourList.length;
    setTourIndex(nextIdx);
    setTourProgress(0);
    flyToTourFact(tourList[nextIdx]);
  }, [tourIndex, tourList, flyToTourFact]);

  const handlePrevTourFact = useCallback(() => {
    if (tourList.length === 0) return;
    const prevIdx = (tourIndex - 1 + tourList.length) % tourList.length;
    setTourIndex(prevIdx);
    setTourProgress(0);
    flyToTourFact(tourList[prevIdx]);
  }, [tourIndex, tourList, flyToTourFact]);

  // Auto-advance timer for Cinematic Tour
  useEffect(() => {
    if (!isTourActive || isTourPaused || tourList.length === 0) {
      return;
    }

    const intervalMs = 100;
    const stepIncrement = (intervalMs / (tourSpeed * 1000)) * 100;

    const timer = setInterval(() => {
      setTourProgress((prev) => {
        if (prev + stepIncrement >= 100) {
          handleNextTourFact();
          return 0;
        }
        return prev + stepIncrement;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isTourActive, isTourPaused, tourSpeed, tourList.length, handleNextTourFact]);

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    // In Tour Mode, display all facts from the tour.
    // In normal mode, display visibleFacts (filtered by active year and active category)
    const factsToRender = isTourActive ? tourList : visibleFacts;

    factsToRender.forEach((fact) => {
      const isSelected = selectedFact?.id === fact.id;

      if (!showAllMarkers && !isSelected && !isTourActive) {
        return;
      }

      // Determine color based on unified category (پۆلێن)
      const catInfo = getCategoryInfo(fact);
      const tagColor = catInfo.color;
      const glowColor = `${tagColor}d9`;

      let iconHtml = '';

      if (isSelected) {
        iconHtml = `
          <div class="relative w-8 h-8 flex items-center justify-center select-none pointer-events-auto animate-marker-pop">
            <!-- Fluid expanding spatial luminous wave -->
            <div class="absolute -inset-2 rounded-full luminous-spatial-ring pointer-events-none" style="background-color: ${glowColor}35; box-shadow: 0 0 16px ${glowColor};"></div>
            
            <!-- Secondary soft breathing halo -->
            <div class="absolute -inset-0.5 rounded-full pointer-events-none opacity-60 animate-pulse" style="background-color: ${glowColor};"></div>
            
            <!-- Central Pin Dot with fluid physics -->
            <div class="relative w-5 h-5 rounded-full border-2 border-white flex items-center justify-center cursor-pointer shadow-xl z-10 transition-transform duration-200 hover:scale-115 active:scale-90" style="background-color: ${tagColor}; box-shadow: 0 0 20px ${glowColor};">
              <div class="w-1.5 h-1.5 rounded-full bg-white shadow-xs"></div>
            </div>

            <!-- Name Label Tag with Spring Appearance -->
            <div class="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 pointer-events-auto z-50 animate-spatial-spring">
              <!-- Little arrow triangle pointing up to the pin dot -->
              <div class="w-2 h-2 rotate-45 bg-[#080c14] border-t border-l border-amber-400/50 mx-auto -mb-1 shadow-xs"></div>
              <!-- Badge Content in RTL -->
              <div dir="rtl" class="px-3 py-1 rounded-xl bg-[#080c14]/95 border border-white/20 shadow-[0_8px_25px_rgba(0,0,0,0.9),0_0_15px_rgba(245,158,11,0.25)] backdrop-blur-xl whitespace-nowrap text-right">
                <span class="text-xs font-extrabold text-white tracking-wide font-heading">${fact.name}</span>
              </div>
            </div>
          </div>
        `;
      } else {
        iconHtml = `
          <div class="w-4 h-4 flex items-center justify-center cursor-pointer pointer-events-auto transition-all duration-200 hover:scale-135 active:scale-85 select-none">
            <div class="w-2.5 h-2.5 rounded-full border border-black/80 hover:bg-white shadow-sm transition-all duration-200" style="background-color: ${tagColor}; box-shadow: 0 0 8px ${glowColor};"></div>
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

        marker.on('click', (e) => {
          if (e && e.originalEvent) {
            L.DomEvent.stopPropagation(e);
          }
          onSelectFact(fact);
          setShowQuickSummary(true);
        });

        markersLayer.addLayer(marker);
      } catch (err) {
        console.warn('Failed to add marker:', err);
      }
    });
  }, [visibleFacts, selectedFact?.id, showAllMarkers, isTourActive, tourList]);

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

      {/* Dynamic Era Atmosphere Lighting & Vignette Overlay */}
      {eraAtmosphere && (
        <div
          className={`absolute inset-0 pointer-events-none z-10 transition-all duration-1000 ${eraAtmosphere.tintClass}`}
          style={{
            boxShadow: `inset 0 0 140px 30px ${eraAtmosphere.glowColor}`,
          }}
        />
      )}

      {/* Dynamic Spatial Category Ambient Color Bleed */}
      {selectedFact && (
        <div
          className="absolute inset-0 pointer-events-none z-10 transition-all duration-700 ease-out"
          style={{
            boxShadow: `inset 0 0 160px 24px ${getCategoryInfo(selectedFact).color}22`,
          }}
        />
      )}

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
          <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass-dock border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_8px_30px_rgba(0,0,0,0.7)] animate-fade-in text-right">
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
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full liquid-glass-subtle text-amber-300 border border-white/10">
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

      </div>

      {/* 3. Top-Left Admin Indicator when active */}
      {isAdmin && (
        <div className="absolute top-3 left-3 z-30 pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-2xl liquid-glass-dock border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_8px_32px_rgba(0,0,0,0.6)]">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
          <span className="text-[11px] font-bold text-amber-300">ئەدمین چالاکە</span>
          {onOpenAddFact && (
            <button
              onClick={onOpenAddFact}
              className="mr-1.5 flex items-center gap-1 px-2.5 py-1 rounded-xl liquid-glass-btn text-amber-300 text-[10px] font-bold transition-colors cursor-pointer"
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

      {/* 4. Top Action Buttons: پێڕست + گەلەری + زیاتر */}
      {/* Backdrop to close menu when tapping anywhere on map */}
      {isMoreMenuOpen && (
        <div
          className="fixed inset-0 z-28 bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in cursor-pointer"
          onClick={() => {
            setIsMoreMenuOpen(false);
          }}
        />
      )}

      <div className="absolute top-3 right-3 z-30 pointer-events-auto flex flex-col items-end gap-2">
        <div className="glass-dock-2026 rounded-2xl p-1 flex items-center gap-1 shadow-2xl">
          {/* دوگمەی سەرەکی پێڕست */}
          {onOpenMenu && (
            <button
              onClick={onOpenMenu}
              className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-amber-300 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer active:scale-95 group"
              title="پێڕستی بابەتەکان"
            >
              <Menu className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
              <span className="font-heading font-extrabold text-xs">پێڕست</span>
            </button>
          )}

          <div className="w-[1px] h-4 bg-white/10 mx-0.5" />

          {/* ئایکۆنی گەلەری */}
          {onOpenGallery && (
            <button
              onClick={onOpenGallery}
              className="relative p-2 rounded-xl text-amber-300 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer active:scale-95 group flex items-center justify-center"
              title="گەلەری"
              aria-label="گەلەری"
            >
              <Images className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
            </button>
          )}

          <div className="w-[1px] h-4 bg-white/10 mx-0.5" />

          {/* دوگمەی سەرەکی 'زیاتر' */}
          <button
            onClick={() => {
              setIsMoreMenuOpen(!isMoreMenuOpen);
            }}
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer select-none ${
              isMoreMenuOpen
                ? 'bg-amber-400 text-black font-extrabold shadow-sm'
                : 'text-slate-100 hover:text-amber-300 hover:bg-white/[0.08]'
            }`}
            title="زیاتر - کرداری خێرا و ئامرازەکانی نەخشە"
          >
            <span className="font-heading font-semibold text-xs">
              {isMoreMenuOpen ? 'داخستن' : 'زیاتر'}
            </span>
            {isMoreMenuOpen ? (
              <X className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
            )}
          </button>
        </div>

        {/* بەشی زیاتر: مێنیوی شوشەی شلە (Liquid Glass Menu) */}
        {isMoreMenuOpen && (
          <div
            className="relative w-64 liquid-glass-card rounded-3xl p-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_20px_50px_rgba(0,0,0,0.85),0_0_25px_rgba(245,158,11,0.15)] backdrop-blur-3xl text-right flex flex-col gap-1.5 animate-menu-dropdown z-30 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass-specular-ray" />

            {/* بەشی ڕووکار (Theme & Appearance) */}
            <div className="p-2 rounded-2xl liquid-glass-subtle border border-white/10 space-y-1.5 shadow-xs">
              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  if (onOpenTheme) onOpenTheme();
                  else setIsThemeModalOpen(true);
                }}
                className="w-full flex items-center justify-between p-1 rounded-xl text-xs hover:bg-white/10 text-slate-200 hover:text-white transition-all cursor-pointer group"
                title="گۆڕینی ستایل و ڕەنگەکانی بەرنامە"
              >
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform shrink-0" style={{ color: theme.primaryColor }} />
                  <span className="font-bold text-white">بەشی ڕووکار</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shadow-xs border border-white/40"
                    style={{ backgroundColor: theme.primaryColor }}
                  />
                  <span className="text-[10px] text-amber-300 font-bold truncate max-w-[85px]">
                    {theme.name.split(' ')[0]}
                  </span>
                </div>
              </button>

              {/* 7 Theme Quick-Pick Swatch Bubbles */}
              <div className="flex items-center justify-between px-1 pt-0.5">
                <span className="text-[9px] text-slate-400 font-medium">ستایلەکان:</span>
                <div className="flex items-center gap-1">
                  {THEME_LIST.map((t) => {
                    const isCur = themeId === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTheme(t.id);
                        }}
                        className={`w-4 h-4 rounded-full transition-all cursor-pointer border ${
                          isCur
                            ? 'scale-125 border-white ring-2 ring-white/60 shadow-[0_0_8px_var(--theme-accent)] z-10'
                            : 'border-black/50 opacity-75 hover:opacity-100 hover:scale-110'
                        }`}
                        style={{ backgroundColor: t.primaryColor }}
                        title={`${t.name} (${t.englishName})`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3. مارکەرەکان (Layers Toggle) */}
            <button
              onClick={() => {
                setShowAllMarkers(!showAllMarkers);
                setIsMoreMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs liquid-glass-subtle hover:border-amber-400/40 text-slate-200 hover:text-amber-200 transition-all cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-medium">نیشاندانی مارکەرەکان</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-slate-200 border border-white/10">
                {showAllMarkers ? `هەمووی (${facts.length})` : 'یەک'}
              </span>
            </button>

            {/* 4. تەواوی نەخشەی کوردستان (Full Map View) */}
            <button
              onClick={() => {
                handleResetCamera();
                setIsMoreMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs liquid-glass-subtle hover:border-amber-400/40 text-slate-200 hover:text-amber-200 transition-all cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <Compass className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-medium">تەواوی نەخشە</span>
              </div>
            </button>

            {/* 5. گۆڕینی شێوازی نەخشە: تاریک / مانگی دەستکرد */}
            <button
              onClick={() => {
                setMapMode(mapMode === 'dark' ? 'satellite' : 'dark');
                setIsMoreMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs liquid-glass-subtle hover:border-amber-400/40 text-slate-200 hover:text-amber-200 transition-all cursor-pointer shadow-xs"
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
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/50 text-emerald-200 transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)]"
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
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                isAdmin
                  ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  : 'liquid-glass-subtle hover:border-amber-400/40 text-slate-200 hover:text-amber-200'
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
      </div>

      {/* 5. Bottom Center Floating Capsule & Year Timeline Slider Dock (باریک، تەنک و ڕوون لەسەر مۆبایل بەبێ پێویستی بە سکرۆڵ) */}
      <div
        className="absolute left-1.5 right-1.5 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-2xl z-40 pointer-events-auto flex flex-col items-center gap-0.5 sm:gap-1 w-auto sm:w-full max-h-[calc(100dvh-4rem)] overflow-y-auto scrollbar-none"
        style={{
          bottom: 'max(0.6rem, calc(env(safe-area-inset-bottom, 0px) + 0.35rem))',
        }}
      >
        {/* Quick Topic Summary Card with 2026 Spatial Glass & Spring Physics */}
        {selectedFact && showQuickSummary && (
          <div
            className="relative w-full max-w-md sm:max-w-lg mb-1 p-4 rounded-3xl glass-dock-2026 text-right animate-spatial-spring z-40 transition-all select-text shrink-0 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Title, Unboxed Metadata & Close */}
            <div className="flex items-start justify-between pb-2.5 mb-2.5 border-b border-white/[0.08] gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-3.5 rounded-xs bg-gradient-to-b from-red-600 via-white to-emerald-600 flex items-center justify-center shadow-xs shrink-0 border border-amber-400/50">
                    <span className="text-[6px] text-amber-500 font-bold leading-none select-none">☀️</span>
                  </div>
                  {/* Unboxed category and tag */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span className="text-amber-400 font-semibold">{selectedFact.tag || 'دەسەڵاتی مێژوویی'}</span>
                    {(selectedFact.year || selectedFact.century) && (
                      <>
                        <span aria-hidden="true" className="text-slate-600 font-mono">·</span>
                        <span className="font-mono tabular-nums text-amber-300 font-bold">
                          {selectedFact.year || selectedFact.century}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <h3 className="text-sm sm:text-base font-extrabold font-heading text-white truncate drop-shadow-xs mt-1">
                  {selectedFact.name}
                </h3>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setShowQuickSummary(false)}
                  className="p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white transition-colors cursor-pointer border border-white/[0.08]"
                  title="داخستنی کورتە"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Topic Image in True Aspect Ratio (بە قیاسی تەواو بێ بڕین) */}
            {(() => {
              const displayImg = getFactDisplayImage(selectedFact);
              if (!displayImg) return null;
              return (
                <div className="relative mb-2.5 rounded-2xl overflow-hidden border border-white/[0.1] bg-black/90 group shadow-lg flex flex-col items-center justify-center p-1.5">
                  <img
                    src={displayImg}
                    alt={selectedFact.imageCaption || selectedFact.name}
                    className="max-h-56 max-w-full w-auto h-auto object-contain mx-auto rounded-xl group-hover:scale-[1.01] transition-transform duration-300 cursor-pointer shadow-md"
                    onClick={() =>
                      setLightboxImage({
                        url: displayImg,
                        caption: selectedFact.imageCaption,
                        title: selectedFact.name,
                      })
                    }
                  />

                  {/* Caption & Image Actions */}
                  <div className="w-full mt-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-amber-200 text-[11px] flex items-center justify-between gap-2 shadow-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Camera className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate font-medium">{selectedFact.imageCaption || selectedFact.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {onOpenGallery && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenGallery();
                          }}
                          className="px-2 py-0.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-amber-300 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer border border-white/[0.08]"
                          title="کردنەوە لە بەشی گەلەری"
                        >
                          <Images className="w-2.5 h-2.5" />
                          <span>گەلەری</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxImage({
                            url: displayImg,
                            caption: selectedFact.imageCaption,
                            title: selectedFact.name,
                          });
                        }}
                        className="p-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white border border-white/[0.08]"
                        title="گەورەکردنی وێنە"
                      >
                        <Maximize2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Location Description */}
            {selectedFact.desc && (
              <div className="flex items-center gap-1.5 mb-2 text-xs text-amber-300/80 font-medium">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{selectedFact.desc}</span>
              </div>
            )}

            {/* Summary Text Content */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-slate-200 text-xs sm:text-[13px] leading-relaxed max-h-36 overflow-y-auto custom-scrollbar">
              <p className="line-clamp-5 whitespace-pre-line leading-relaxed">
                {selectedFact.fullText || selectedFact.desc}
              </p>
            </div>

            {/* Linked Topics Unboxed Row */}
            {selectedLinked.allRelated.length > 0 && (
              <div className="mt-2.5 p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-xs text-amber-300 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>بابەت و کەسایەتییە پەیوەندیدارەکان:</span>
                  </span>
                  <span className="font-mono tabular-nums text-slate-400 text-[11px]">
                    {selectedLinked.allRelated.length} تۆمار
                  </span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {selectedLinked.allRelated.slice(0, 6).map((lf) => {
                    const c = getCategoryInfo(lf);
                    return (
                      <button
                        key={lf.id}
                        type="button"
                        onClick={() => {
                          onSelectFact(lf);
                        }}
                        className="px-2.5 py-1 rounded-xl text-xs shrink-0 flex items-center gap-1.5 border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] hover:border-amber-400/50 transition-all cursor-pointer active:scale-95"
                        title={`کلیک بکە بۆ نیشاندانی «${lf.name}»`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                        <span className="truncate max-w-[130px] font-semibold text-slate-200">{lf.name}</span>
                      </button>
                    );
                  })}
                  {selectedLinked.allRelated.length > 6 && onOpenDetail && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowQuickSummary(false);
                        onOpenDetail(selectedFact);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-white/[0.06] text-xs text-amber-300 shrink-0 font-bold hover:text-white"
                    >
                      +{selectedLinked.allRelated.length - 6}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Action Footer */}
            <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-white/[0.08]">
              <div className="flex items-center gap-2">
                {onOpenDetail && (
                  <button
                    onClick={() => {
                      setShowQuickSummary(false);
                      onOpenDetail(selectedFact);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold text-xs transition-all cursor-pointer active:scale-95 shadow-[0_0_16px_rgba(245,158,11,0.3)]"
                  >
                    <BookOpen className="w-3.5 h-3.5 stroke-[2.5]" />
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
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl liquid-glass-btn text-slate-300 hover:text-white text-[10px] transition-colors cursor-pointer"
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
          filteredCount={isTourActive ? tourList.length : visibleFacts.length}
          totalCount={facts.length}
          isTourActive={isTourActive}
          onToggleTour={handleToggleTour}
        />

        {/* Selected Fact Capsule (Liquid Glass Pill) */}
        {selectedFact && (
          <button
            onClick={() => setShowQuickSummary((prev) => !prev)}
            className="group relative flex items-center gap-1.5 sm:gap-2 px-3.5 py-1.5 rounded-2xl liquid-glass-btn shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_8px_25px_rgba(0,0,0,0.6)] cursor-pointer transition-all duration-200 active:scale-95 animate-fade-in text-right overflow-hidden"
            title="کلیک بکە بۆ پیشاندانی کورتەی بابەت بە مۆنشن و گرافیک"
          >
            <div className="glass-specular-ray" />
            {/* Kurdish Flag Icon in Center */}
            <div className="w-3 h-2 sm:w-3.5 sm:h-2.5 rounded-xs bg-gradient-to-b from-red-600 via-white to-emerald-600 flex items-center justify-center shadow-xs shrink-0">
              <span className="text-[4px] sm:text-[5px] text-amber-500 font-bold leading-none select-none">☀️</span>
            </div>

            {/* Selected Location Name */}
            <span className="text-[11px] sm:text-xs font-bold text-white tracking-wide group-hover:text-amber-300 transition-colors truncate max-w-[150px] sm:max-w-xs">
              {selectedFact.name}
            </span>

            {(selectedFact.year || selectedFact.century) && (
              <span className="text-[8px] sm:text-[9px] font-mono text-amber-300 bg-white/10 px-1.5 py-0.2 rounded border border-white/15 shrink-0">
                {selectedFact.year || selectedFact.century}
              </span>
            )}

            {/* Interactive Motion Indicator */}
            <span className="text-[9px] sm:text-[10px] text-amber-400 font-medium flex items-center gap-0.5 mr-0.5 pr-1 border-r border-white/15 shrink-0">
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

      {/* Full-Screen Lightbox Modal for Topic Image (Liquid Glass Theater) */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-fade-in text-right"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-3xl w-full liquid-glass-card rounded-3xl p-4 sm:p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_25px_80px_rgba(0,0,0,0.95),0_0_40px_rgba(245,158,11,0.2)] backdrop-blur-3xl flex flex-col items-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass-specular-ray" />
            {/* Header */}
            <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl liquid-glass-btn flex items-center justify-center text-amber-300">
                  <Camera className="w-4 h-4" />
                </div>
                <h4 className="text-sm sm:text-base font-bold text-white">
                  {lightboxImage.title}
                </h4>
              </div>
              <button
                onClick={() => setLightboxImage(null)}
                className="w-8 h-8 rounded-xl liquid-glass-btn flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="داخستن"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Image display */}
            <div className="relative rounded-2xl overflow-hidden border border-white/20 max-h-[65vh] w-full flex items-center justify-center bg-black/90 shadow-2xl">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.caption || lightboxImage.title}
                className="max-h-[65vh] w-auto max-w-full object-contain"
              />
            </div>

            {/* Small Caption / Description Text */}
            {lightboxImage.caption && (
              <div className="mt-3.5 w-full p-2.5 px-3.5 rounded-xl liquid-glass-subtle text-amber-200 text-xs sm:text-[13px] backdrop-blur-md flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-medium">{lightboxImage.caption}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. گەشتی بینراوی مێژوویی (Cinematic Guided Tour / Story Mode Overlay) */}
      {isTourActive && currentTourFact && (
        <>
          {/* Cinematic Letterbox Vignettes */}
          <div className="absolute top-0 inset-x-0 h-14 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none z-30 animate-fade-in" />
          <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none z-30 animate-fade-in" />

          {/* Floating Cinematic Story Card */}
          <div className="absolute top-3 sm:top-5 left-1/2 -translate-x-1/2 w-[94%] max-w-lg z-40 pointer-events-auto animate-fade-in text-right">
            <div className="relative liquid-glass-panel rounded-3xl p-3.5 sm:p-4 border border-amber-400/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_20px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(245,158,11,0.25)] overflow-hidden">
              <div className="glass-specular-ray" />

              {/* Card Header: Mode Badge, Progress Counter, Speed Selector, Close */}
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/10">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl liquid-glass-btn flex items-center justify-center shrink-0 shadow-xs">
                    <Film className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-amber-300 font-heading tracking-wide truncate">
                        گەشتی بینراوی مێژوویی
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-300">
                      شوێنی {toKurdishDigits(tourIndex + 1)} لە {toKurdishDigits(tourList.length)}
                    </span>
                  </div>
                </div>

                {/* Speed selector & Exit button */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex items-center p-0.5 rounded-lg liquid-glass-subtle text-[10px] font-mono" dir="ltr">
                    {[5, 7, 10].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => setTourSpeed(sec)}
                        title={`خێرایی پەڕینەوە: ${sec} چرکە`}
                        className={`px-1.5 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                          tourSpeed === sec
                            ? 'liquid-glass-btn-active text-black'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleToggleTour}
                    className="w-7 h-7 rounded-xl flex items-center justify-center liquid-glass-btn text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="داخستنی گەشت"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Animated Timeline Countdown Bar */}
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden my-2.5">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 transition-all duration-100 ease-linear rounded-full shadow-[0_0_10px_rgba(245,158,11,0.8)]"
                  style={{ width: `${tourProgress}%` }}
                />
              </div>

              {/* Story Content Row */}
              <div className="flex gap-3 items-start my-1">
                {(() => {
                  const tourImg = getFactDisplayImage(currentTourFact);
                  if (!tourImg) return null;
                  return (
                    <img
                      src={tourImg}
                      alt={currentTourFact.name}
                      onClick={() =>
                        setLightboxImage({
                          url: tourImg,
                          title: currentTourFact.name,
                          caption: currentTourFact.imageCaption || currentTourFact.desc,
                        })
                      }
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shrink-0 border border-white/20 cursor-pointer shadow-md hover:scale-105 transition-transform"
                      title="کلیک بکە بۆ گەورەکردنی وێنە"
                    />
                  );
                })()}

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="text-sm sm:text-base font-extrabold text-white truncate tracking-wide">
                      {currentTourFact.name}
                    </h3>
                    {(currentTourFact.year || currentTourFact.century) && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full liquid-glass-subtle text-amber-300 border border-amber-400/30 shrink-0">
                        {currentTourFact.year || currentTourFact.century}
                      </span>
                    )}
                    {currentTourFact.eraName && (
                      <span className="text-[9px] text-slate-300 bg-white/5 px-2 py-0.5 rounded-md border border-white/10 shrink-0">
                        {currentTourFact.eraName}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] sm:text-xs text-slate-200 line-clamp-2 leading-relaxed">
                    {currentTourFact.desc || currentTourFact.fullText}
                  </p>
                </div>
              </div>

              {/* Bottom Interactive Navigation & Action Dock */}
              <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-white/10 text-xs">
                {/* Media Controls (Prev, Pause/Play, Next) */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePrevTourFact}
                    title="شوێنی پێشوو"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl liquid-glass-btn text-slate-200 hover:text-amber-300 transition-all cursor-pointer font-bold text-[11px]"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">پێشوو</span>
                  </button>

                  <button
                    onClick={() => setIsTourPaused(!isTourPaused)}
                    title={isTourPaused ? 'دەستپێکردنەوەی گەشت' : 'وەستاندنی کاتی'}
                    className={`flex items-center gap-1 px-3 py-1 rounded-xl font-bold transition-all cursor-pointer text-[11px] ${
                      isTourPaused
                        ? 'liquid-glass-btn-active text-black shadow-md animate-pulse'
                        : 'liquid-glass-btn text-amber-300 hover:text-white'
                    }`}
                  >
                    {isTourPaused ? (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>بەردەوامی</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>وەستان</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleNextTourFact}
                    title="شوێنی دواتر"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl liquid-glass-btn text-slate-200 hover:text-amber-300 transition-all cursor-pointer font-bold text-[11px]"
                  >
                    <span className="hidden sm:inline">دواتر</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* View Details Button */}
                {onOpenDetail && (
                  <button
                    onClick={() => onOpenDetail(currentTourFact)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl liquid-glass-subtle hover:liquid-glass-btn text-amber-300 hover:text-white transition-all cursor-pointer text-[11px] font-bold"
                  >
                    <Maximize2 className="w-3 h-3 text-amber-400" />
                    <span>وردەکاری تەواو</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Theme Selector Modal (بەشی ڕووکار و ستایلی نەخشە) */}
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />
    </div>
  );
};
