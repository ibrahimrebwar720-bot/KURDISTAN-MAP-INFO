import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FactItem, GREAT_KURDISTAN_POLYGON } from '../data/kurdishHistoryData';
import {
  createCachedTileLayer,
  DARK_MAP_TILE_URL,
  LIGHT_MAP_TILE_URL,
  SATELLITE_MAP_TILE_URL,
} from '../services/mapTileCacheService';
import {
  Layers,
  Menu,
  Search,
  Castle,
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
  ImagePlus,
  Medal,
  Palette,
  Link2,
  Sun,
  Moon,
  Share2,
  Globe,
  RotateCcw,
} from 'lucide-react';
import { SubmitPhotoModal } from './SubmitPhotoModal';
import { TimelineSlider } from './TimelineSlider';
import { kurdishSearchMatch } from '../utils/kurdishSearch';
import {
  filterFactsByActiveYear,
  formatKurdishYear,
  formatDigits,
  getFactYearSpan,
} from '../utils/yearUtils';
import { KurdishMapBorderIllumination } from './KurdishMapBorderIllumination';
import { getCategoryInfo, getAccessibleCategoryColor } from '../types/history';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
  getLinkedFacts,
  getKnowledgeGraphNetwork,
  compareFactsChronologically,
  KnowledgeGraphNetwork,
} from '../utils/factRelations';
import { THEME_LIST } from '../types/theme';
import { getFactDisplayImage } from '../utils/historicalImages';
import { getOptimizedImageUrl } from '../utils/imageUtils';
import { copyTopicToClipboard, getShareableTopicUrl } from '../utils/urlRouter';
import {
  ProvinceItem,
  getProvincesWithCounts,
  filterFactsByProvince,
  KURDISTAN_PROVINCES,
  getProvinceBounds,
} from '../data/kurdishProvincesData';
import { ProvinceSelectorModal } from './ProvinceSelectorModal';

const ThemeSelectorModal = React.lazy(() =>
  import('./ThemeSelectorModal').then((m) => ({
    default: m.ThemeSelectorModal,
  }))
);

function escapeHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
  onOpenHero?: () => void;
  onOpenSettings?: () => void;
  onOpenMenu?: () => void;
  onOpenJourney?: () => void;
  onOpenTheme?: () => void;
  mapMode?: 'dark' | 'satellite';
  setMapMode?: (mode: 'dark' | 'satellite') => void;
  activeTagFilter: string;
  setActiveTagFilter: (tag: string) => void;
  selectedProvince?: string;
  onSelectProvince?: (provinceId: string, province?: ProvinceItem) => void;
  // Year & Timeline Slider Props
  selectedYear?: number | 'all';
  onYearChange?: (year: number | 'all') => void;
  // Admin Props
  isAdmin?: boolean;
  onTriggerAdminPin: () => void;
  onOpenAddFact?: (mode?: 'photo_only' | 'standard') => void;
  onOpenSubmittedPhotos?: () => void;
  pendingSubmissionsCount?: number;
  onLogoutAdmin?: () => void;
  isPickingLocation?: boolean;
  onPickLocation?: (lat: number, lng: number) => void;
  onCancelPickLocation?: () => void;
  pickedCoords?: { lat: number; lng: number } | null;
  onReplayIntro?: () => void;
  playMapIntro?: boolean;
  onMapIntroComplete?: () => void;
  externalFlyTo?: { lat: number; lng: number; zoom?: number; id?: string } | null;
}

export const TAG_FILTER_OPTIONS = [
  {
    id: 'all',
    label: 'هەموو پۆلێنەکان',
    labelEn: 'All Categories',
    shortLabel: 'هەمووی',
    shortLabelEn: 'All',
    icon: SlidersHorizontal,
    color: '#f59e0b',
    accentClass: 'text-amber-400',
  },
  {
    id: 'principality',
    label: 'میرنشین - دەسەڵات - دەوڵەت - ئیمپراتۆرییەت',
    labelEn: 'Principalities, States & Empires',
    shortLabel: 'میرنشین و دەسەڵاتەکان',
    shortLabelEn: 'Principalities',
    icon: Crown,
    color: '#eab308',
    accentClass: 'text-amber-400',
  },
  {
    id: 'civilization',
    label: 'شارستانییەتەکان',
    labelEn: 'Civilizations',
    shortLabel: 'شارستانییەتەکان',
    shortLabelEn: 'Civilizations',
    icon: Landmark,
    color: '#10b981',
    accentClass: 'text-emerald-400',
  },
  {
    id: 'leader',
    label: 'سەرکردەکان',
    labelEn: 'Leaders & Rulers',
    shortLabel: 'سەرکردەکان',
    shortLabelEn: 'Leaders',
    icon: Medal,
    color: '#f43f5e',
    accentClass: 'text-rose-400',
  },
  {
    id: 'scholar',
    label: 'زانا و شاعیر و ئەدیبان',
    labelEn: 'Scholars, Poets & Historians',
    shortLabel: 'زانا و شاعیر و ئەدیبان',
    shortLabelEn: 'Scholars & Poets',
    icon: BookOpen,
    color: '#06b6d4',
    accentClass: 'text-cyan-400',
  },
  {
    id: 'official',
    label: 'وەزیر و کاربەدەستان',
    labelEn: 'Ministers & Statesmen',
    shortLabel: 'وەزیر و کاربەدەستان',
    shortLabelEn: 'Statesmen',
    icon: Award,
    color: '#3b82f6',
    accentClass: 'text-blue-400',
  },
  {
    id: 'other_figure',
    label: 'کەسایەتی تر',
    labelEn: 'Notable Figures',
    shortLabel: 'کەسایەتی تر',
    shortLabelEn: 'Figures',
    icon: Sparkles,
    color: '#ec4899',
    accentClass: 'text-pink-400',
  },
  {
    id: 'castle',
    label: 'قەڵاکان',
    labelEn: 'Castles & Citadels',
    shortLabel: 'قەڵاکان',
    shortLabelEn: 'Castles',
    icon: Castle,
    color: '#8b5cf6',
    accentClass: 'text-purple-400',
  },
  {
    id: 'battle',
    label: 'جەنگ و ڕووداوەکان',
    labelEn: 'Battles & Events',
    shortLabel: 'جەنگ و ڕووداوەکان',
    shortLabelEn: 'Battles',
    icon: Swords,
    color: '#ef4444',
    accentClass: 'text-rose-400',
  },
  {
    id: 'monument',
    label: 'شوێنەوار',
    labelEn: 'Archaeological Sites',
    shortLabel: 'شوێنەوار',
    shortLabelEn: 'Monuments',
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
  onOpenHero,
  onOpenSettings,
  onOpenMenu,
  onOpenJourney,
  onOpenTheme,
  mapMode: externalMapMode,
  activeTagFilter,
  setActiveTagFilter,
  selectedProvince = 'all',
  onSelectProvince,
  selectedYear = 'all',
  onYearChange,
  isAdmin = false,
  onTriggerAdminPin,
  onOpenAddFact,
  onOpenSubmittedPhotos,
  pendingSubmissionsCount,
  onLogoutAdmin,
  isPickingLocation = false,
  onPickLocation,
  onCancelPickLocation,
  pickedCoords,
  onReplayIntro,
  playMapIntro = false,
  onMapIntroComplete,
  externalFlyTo,
}) => {
  const { language, isEn, dir, toggleLanguage } = useLanguage();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [leafletMap, setLeafletMap] = useState<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const currentTileUrlRef = useRef<string>('');
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const selectedMarkerLayerRef = useRef<L.LayerGroup | null>(null);
  const provincesCanvasRendererRef = useRef<L.Canvas | null>(null);
  const vectorCanvasRendererRef = useRef<L.Canvas | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const allProvincesLayerRef = useRef<L.LayerGroup | null>(null);
  const provinceLabelsLayerRef = useRef<L.LayerGroup | null>(null);
  const provincePolygonLayerRef = useRef<L.Polygon | null>(null);
  const pickedMarkerRef = useRef<L.Marker | null>(null);
  const knowledgeGraphLayerRef = useRef<L.LayerGroup | null>(null);
  const [showKnowledgeGraphLines, setShowKnowledgeGraphLines] = useState<boolean>(true);
  const [provinceCacheTick, setProvinceCacheTick] = useState<number>(0);

  useEffect(() => {
    const onUpdated = () => setProvinceCacheTick((t) => t + 1);
    window.addEventListener('google-province-cache-updated', onUpdated);
    return () => window.removeEventListener('google-province-cache-updated', onUpdated);
  }, []);

  // Category Selector Modal directly on map (دوگمەی پۆلێنەکان)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);

  // Province Selector Modal & Filter on map (پۆلێنی پارێزگاکان)
  const [localProvince, setLocalProvince] = useState<string>(selectedProvince || 'all');
  const activeProvince = selectedProvince ?? localProvince;
  const [isProvinceModalOpen, setIsProvinceModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (selectedProvince !== undefined) {
      setLocalProvince(selectedProvince);
    }
  }, [selectedProvince]);

  const handleSelectProvince = (provId: string, prov?: ProvinceItem) => {
    setLocalProvince(provId);
    if (onSelectProvince) {
      onSelectProvince(provId, prov);
    }
    const targetProv = prov || KURDISTAN_PROVINCES.find((p) => p.id === provId);
    if (targetProv && mapInstanceRef.current) {
      if (targetProv.polygon && targetProv.polygon.length >= 3) {
        mapInstanceRef.current.flyToBounds(getProvinceBounds(targetProv), {
          padding: [42, 42],
          maxZoom: 10,
          duration: 1.2,
        });
      } else if (targetProv.center) {
        mapInstanceRef.current.flyTo(targetProv.center, targetProv.zoom || 9, {
          duration: 1.4,
          easeLinearity: 0.25,
        });
      }
    }
  };

  const currentProvinceObj = useMemo(() => {
    return KURDISTAN_PROVINCES.find((p) => p.id === activeProvince);
  }, [activeProvince]);

  // Principality / Authority Focus Isolation Mode (فۆکەسی دەسەڵات: تەنها پەیوەندیدارەکانی دەردەکەون)
  const [isPrincipalityFocusActive, setIsPrincipalityFocusActive] = useState<boolean>(true);

  // Map Mode: 'dark' (Esri Dark Canvas) or 'satellite' (Esri Dark Satellite) — controlled via Settings
  const mapMode = externalMapMode ?? 'dark';

  // Quick Topic Summary Card / Side Inspector Drawer state
  const [showQuickSummary, setShowQuickSummary] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const copiedSummaryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{
    url: string;
    caption?: string;
    title: string;
  } | null>(null);
  const [factToSubmitPhoto, setFactToSubmitPhoto] = useState<FactItem | null>(null);

  // Inline Map Instant Search state
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [showMapSearchResults, setShowMapSearchResults] = useState(false);
  const mapSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (mapSearchRef.current && !mapSearchRef.current.contains(e.target as Node)) {
        setShowMapSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const mapSearchMatches = useMemo(() => {
    const q = mapSearchQuery.trim();
    if (!q) return [];
    return facts
      .filter(
        (f) =>
          kurdishSearchMatch(f.name, q) ||
          kurdishSearchMatch(f.desc, q) ||
          kurdishSearchMatch(f.region || '', q) ||
          kurdishSearchMatch(f.year || '', q)
      )
      .slice(0, 6);
  }, [facts, mapSearchQuery]);

  // Dynamic Era Atmosphere & Lighting based on timeline year
  const eraAtmosphere = useMemo(() => {
    if (selectedYear === 'all' || typeof selectedYear !== 'number') {
      return null;
    }
    if (selectedYear < 0) {
      return {
        name: isEn ? 'Ancient Era (BCE)' : 'سەردەمی دێرین (بەرلە زایین)',
        tintClass: 'bg-gradient-to-t from-amber-950/25 via-amber-900/15 to-transparent',
        glowColor: 'rgba(217, 119, 6, 0.18)',
        borderColor: 'border-amber-500/40',
      };
    }
    if (selectedYear <= 1250) {
      return {
        name: isEn ? 'Islamic & Medieval Era' : 'سەردەمی ئیسلامی و ناوەڕاست',
        tintClass: 'bg-gradient-to-t from-emerald-950/20 via-teal-900/12 to-transparent',
        glowColor: 'rgba(16, 185, 129, 0.15)',
        borderColor: 'border-emerald-500/40',
      };
    }
    if (selectedYear <= 1850) {
      return {
        name: isEn ? 'Kurdish Principalities Era' : 'سەردەمی میرنشینەکان',
        tintClass: 'bg-gradient-to-t from-amber-950/20 via-rose-950/12 to-transparent',
        glowColor: 'rgba(245, 158, 11, 0.16)',
        borderColor: 'border-orange-500/40',
      };
    }
    return {
      name: isEn ? 'Modern Era' : 'سەردەمی هاوچەرخ',
      tintClass: 'bg-gradient-to-t from-blue-950/20 via-indigo-950/15 to-transparent',
      glowColor: 'rgba(59, 130, 246, 0.15)',
      borderColor: 'border-blue-500/40',
    };
  }, [selectedYear, isEn]);

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
  const { theme, themeId, setTheme, colorMode, setColorMode, toggleColorMode } = useTheme();
  const isDark = colorMode === 'dark';
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  // Menu state
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Admin secret 6-tap tracking
  const [adminTapCount, setAdminTapCount] = useState(0);
  const tapTimeoutRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
      if (copiedSummaryTimeoutRef.current) clearTimeout(copiedSummaryTimeoutRef.current);
    };
  }, []);

  // Compute fact counts per unified category
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = { all: facts.length };
    facts.forEach((f) => {
      const catId = getCategoryInfo(f, language).id;
      counts[catId] = (counts[catId] || 0) + 1;
    });
    return counts;
  }, [facts, language]);

  // Selected Fact's linked historical entities & figures
  const selectedLinked = useMemo(() => {
    return getLinkedFacts(selectedFact, facts);
  }, [selectedFact, facts]);

  // Selected Fact's Knowledge Graph network
  const selectedKnowledgeGraph = useMemo(() => {
    return getKnowledgeGraphNetwork(selectedFact, facts, language);
  }, [selectedFact, facts, language]);

  // Active filter object definition
  const currentFilterObj = useMemo(() => {
    return (
      TAG_FILTER_OPTIONS.find((opt) => opt.id === activeTagFilter) ||
      TAG_FILTER_OPTIONS[0]
    );
  }, [activeTagFilter]);

  // Check if a fact belongs to principality / authority / state / empire
  const isPrincipalityFact = useCallback((fact: FactItem | null | undefined): boolean => {
    if (!fact) return false;
    const cat = getCategoryInfo(fact).id;
    if (cat === 'principality' || cat === 'empire') return true;
    const tag = (fact.tag || '').toLowerCase();
    const name = (fact.name || '').toLowerCase();
    return (
      tag.includes('principality') ||
      tag.includes('emirate') ||
      tag.includes('kingdom') ||
      tag.includes('dynasty') ||
      tag.includes('empire') ||
      tag.includes('state') ||
      tag.includes('میرنشین') ||
      tag.includes('دەوڵەت') ||
      tag.includes('دەسەڵات') ||
      tag.includes('ئیمپراتۆریەت') ||
      name.includes('principality') ||
      name.includes('emirate') ||
      name.includes('kingdom') ||
      name.includes('dynasty') ||
      name.includes('empire') ||
      name.includes('میرنشین') ||
      name.includes('دەوڵەت') ||
      name.includes('دەسەڵات') ||
      name.includes('ئیمپراتۆریەت')
    );
  }, []);

  // Compute the related fact IDs set for the selected principality/state
  // When clicked, only this state + its related items (figures, castles, battles, scholars, allies) remain on the map
  const relatedFactIdsSet = useMemo(() => {
    if (!selectedFact) return null;

    const isDirectPrincipality = isPrincipalityFact(selectedFact);
    const parentFact =
      typeof selectedFact.parentFactId === 'number'
        ? facts.find((f) => f.id === selectedFact.parentFactId)
        : null;
    const isParentPrincipality = parentFact && isPrincipalityFact(parentFact);

    // If neither selectedFact nor its parent is a principality, do not isolate
    if (!isDirectPrincipality && !isParentPrincipality) {
      return null;
    }

    const targetEntity = isDirectPrincipality ? selectedFact : parentFact!;
    const idSet = new Set<number>();
    idSet.add(targetEntity.id);
    idSet.add(selectedFact.id);

    // 1. Explicit relatedFactIds in targetEntity
    if (Array.isArray(targetEntity.relatedFactIds)) {
      targetEntity.relatedFactIds.forEach((rid) => {
        if (typeof rid === 'number') idSet.add(rid);
      });
    }

    // 2. Explicit parentFactId in targetEntity
    if (typeof targetEntity.parentFactId === 'number') {
      idSet.add(targetEntity.parentFactId);
    }

    // 3. Explicit allyFactIds in targetEntity
    if (Array.isArray(targetEntity.allyFactIds)) {
      targetEntity.allyFactIds.forEach((aid) => {
        if (typeof aid === 'number') idSet.add(aid);
      });
    }

    // 4. Reverse lookup across all facts in the dataset
    facts.forEach((other) => {
      if (other.id === targetEntity.id) return;

      if (other.parentFactId === targetEntity.id) {
        idSet.add(other.id);
      }
      if (Array.isArray(other.relatedFactIds) && other.relatedFactIds.includes(targetEntity.id)) {
        idSet.add(other.id);
      }
      if (Array.isArray(other.allyFactIds) && other.allyFactIds.includes(targetEntity.id)) {
        idSet.add(other.id);
      }
    });

    // 5. Also include relations from selectedFact if different from targetEntity
    if (selectedFact.id !== targetEntity.id) {
      if (Array.isArray(selectedFact.relatedFactIds)) {
        selectedFact.relatedFactIds.forEach((rid) => {
          if (typeof rid === 'number') idSet.add(rid);
        });
      }
      if (Array.isArray(selectedFact.allyFactIds)) {
        selectedFact.allyFactIds.forEach((aid) => {
          if (typeof aid === 'number') idSet.add(aid);
        });
      }
    }

    // 6. Name root safety fallback (e.g. "ئەییووبی" / "ئەیوبی" / "Principality of ...")
    const cleanName = targetEntity.name
      .replace(/میرنشینی|دەوڵەتی|ئیمپراتۆریەتی|دەسەڵاتی|principality of|emirate of|kingdom of|empire of|dynasty of|state of|\(.*?\)/gi, '')
      .trim()
      .toLowerCase();

    if (cleanName.length >= 3) {
      facts.forEach((f) => {
        if (idSet.has(f.id)) return;
        const fn = f.name.toLowerCase();
        if (
          fn.includes(cleanName) ||
          (cleanName.includes('ئەیوب') && (fn.includes('ئەییووب') || fn.includes('ئەیوب'))) ||
          (cleanName.includes('ayyub') && fn.includes('ayyub'))
        ) {
          idSet.add(f.id);
        }
      });
    }

    return idSet;
  }, [selectedFact, facts, isPrincipalityFact]);

  // When a principality or related item is selected, activate focus isolation
  useEffect(() => {
    if (selectedFact && isPrincipalityFact(selectedFact)) {
      setIsPrincipalityFocusActive(true);
    }
  }, [selectedFact?.id, isPrincipalityFact]);

  // Handle changing filter
  const handleSelectTagFilter = (tagId: string) => {
    setActiveTagFilter(tagId);
    setIsMoreMenuOpen(false);
    setIsCategoryModalOpen(false);
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
    // Prefer Canvas renderer & deferred tile updates during active zoom/pan for zero stutter
    const map = L.map(mapContainerRef.current, {
      center: [36.2, 43.8],
      zoom: 5.5,
      minZoom: 4,
      maxZoom: 16,
      preferCanvas: true,
      zoomControl: false,
      attributionControl: false,
      zoomAnimation: true,
      zoomAnimationThreshold: 6,
      fadeAnimation: false,
      markerZoomAnimation: true,
      inertia: true,
      inertiaDeceleration: 3000,
      inertiaMaxSpeed: 1800,
      easeLinearity: 0.2,
      zoomSnap: 0.5,
      zoomDelta: 0.5,
      wheelDebounceTime: 60,
      wheelPxPerZoomLevel: 120,
    });

    // TileLayer with native browser cache + deferred zoom loading
    const initialTileUrl = colorMode === 'light' ? LIGHT_MAP_TILE_URL : DARK_MAP_TILE_URL;
    const initialTileLayer = createCachedTileLayer(initialTileUrl, {
      maxZoom: 16,
    });

    initialTileLayer.addTo(map);
    tileLayerRef.current = initialTileLayer;
    currentTileUrlRef.current = initialTileUrl;

    // Non-interactive panes for 38 province patchwork & labels under markers
    const provincesPane = map.createPane('kurdistan-provinces-pane');
    provincesPane.style.zIndex = '340';
    provincesPane.style.pointerEvents = 'none';

    const provinceLabelsPane = map.createPane('kurdistan-province-labels-pane');
    provinceLabelsPane.style.zIndex = '355';
    provinceLabelsPane.style.pointerEvents = 'none';

    // Shared Canvas renderers eliminate SVG/DOM overhead on 4,300+ polygon vertices & 289+ point markers
    const provincesCanvasRenderer = L.canvas({
      pane: 'kurdistan-provinces-pane',
      padding: 0.25,
      tolerance: 0,
    });
    provincesCanvasRendererRef.current = provincesCanvasRenderer;

    const vectorCanvasRenderer = L.canvas({
      padding: 0.25,
      tolerance: 8,
    });
    vectorCanvasRendererRef.current = vectorCanvasRenderer;

    const allProvincesLayer = L.layerGroup().addTo(map);
    allProvincesLayerRef.current = allProvincesLayer;

    const provinceLabelsLayer = L.layerGroup().addTo(map);
    provinceLabelsLayerRef.current = provinceLabelsLayer;

    // Layer Groups for base markers vs single active selected marker
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    const selectedMarkerLayer = L.layerGroup().addTo(map);
    selectedMarkerLayerRef.current = selectedMarkerLayer;

    // Layer Group for Knowledge Graph connection lines
    const knowledgeGraphLayer = L.layerGroup().addTo(map);
    knowledgeGraphLayerRef.current = knowledgeGraphLayer;

    // Frame all of Greater Kurdistan cleanly so the whole map is clearly visible upon opening
    const kurdistanBounds = L.latLngBounds(GREAT_KURDISTAN_POLYGON);
    map.fitBounds(kurdistanBounds, {
      padding: [20, 20],
      maxZoom: 6.2,
    });

    // Invalidate size after layout settles without triggering pan recalcs
    let resizeRafId: number | null = null;
    const scheduleInvalidateSize = () => {
      if (resizeRafId !== null) cancelAnimationFrame(resizeRafId);
      resizeRafId = requestAnimationFrame(() => {
        resizeRafId = null;
        try {
          map.invalidateSize({ animate: false, pan: false });
        } catch {}
      });
    };

    const timer1 = setTimeout(scheduleInvalidateSize, 100);
    const timer2 = setTimeout(scheduleInvalidateSize, 400);

    window.addEventListener('resize', scheduleInvalidateSize);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(scheduleInvalidateSize);
      resizeObserver.observe(mapContainerRef.current);
    }

    mapInstanceRef.current = map;
    setLeafletMap(map);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (resizeRafId !== null) cancelAnimationFrame(resizeRafId);
      window.removeEventListener('resize', scheduleInvalidateSize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      allProvincesLayerRef.current = null;
      provinceLabelsLayerRef.current = null;
      markersLayerRef.current = null;
      selectedMarkerLayerRef.current = null;
      provincesCanvasRendererRef.current = null;
      vectorCanvasRendererRef.current = null;
      knowledgeGraphLayerRef.current = null;
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
      setIsCategoryModalOpen(false);

      // Deselect point and dismiss quick summary card when clicking on empty map
      setShowQuickSummary(false);
      setIsPrincipalityFocusActive(false);
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
          <div class="preserve-contrast relative w-6 h-6 flex items-center justify-center select-none pointer-events-none map-pin-circle">
            <div class="absolute -inset-1 rounded-full bg-amber-400/35 animate-ping"></div>
            <div class="relative w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow-[0_0_12px_rgba(245,158,11,0.9)] flex items-center justify-center">
              <div class="w-1.5 h-1.5 rounded-full bg-black"></div>
            </div>
            <div class="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-0.5 rounded-none bg-black border border-amber-500 text-[10px] font-bold text-amber-300 whitespace-nowrap" dir="${dir}">
              ${isEn ? 'Selected Location' : 'پۆینتی دەستنیشانکراو'}
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
  }, [pickedCoords, dir, isEn]);

  // Switch Tile Layer when mapMode or colorMode changes (Cached & Smooth)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    let targetTileUrl = '';
    if (mapMode === 'satellite') {
      targetTileUrl = SATELLITE_MAP_TILE_URL;
    } else {
      targetTileUrl = colorMode === 'light' ? LIGHT_MAP_TILE_URL : DARK_MAP_TILE_URL;
    }

    // Do not unnecessarily remove and re-add layer if URL hasn't changed
    if (targetTileUrl === currentTileUrlRef.current && tileLayerRef.current) {
      return;
    }

    const oldLayer = tileLayerRef.current;

    const nextLayer = createCachedTileLayer(targetTileUrl, {
      maxZoom: 16,
      subdomains: ['server', 'services'],
    });
    nextLayer.addTo(map);
    tileLayerRef.current = nextLayer;
    currentTileUrlRef.current = targetTileUrl;

    if (oldLayer) {
      setTimeout(() => {
        try {
          if (map.hasLayer(oldLayer)) {
            map.removeLayer(oldLayer);
          }
        } catch {}
      }, 120);
    }
  }, [mapMode, colorMode]);

  // Update Kurdistan Territory Polygon & 38-Province Inner Patchwork
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (polygonLayerRef.current) {
      map.removeLayer(polygonLayerRef.current);
      polygonLayerRef.current = null;
    }
    if (allProvincesLayerRef.current) {
      allProvincesLayerRef.current.clearLayers();
    }
    if (provinceLabelsLayerRef.current) {
      provinceLabelsLayerRef.current.clearLayers();
    }

    if (showPolygon) {
      const shadePalette = ['#d97706', '#92400e', '#ea580c', '#b45309', '#f59e0b'];
      const isLight = colorMode === 'light';
      const borderColor = isLight ? '#b45309' : theme.primaryColor || '#f59e0b';
      const provRenderer = provincesCanvasRendererRef.current || undefined;

      if (allProvincesLayerRef.current && provinceLabelsLayerRef.current) {
        KURDISTAN_PROVINCES.forEach((prov, idx) => {
          const rings =
            prov.polygons && prov.polygons.length > 0
              ? prov.polygons
              : prov.polygon && prov.polygon.length >= 3
              ? [prov.polygon]
              : null;

          const isSelectedProv = activeProvince === prov.id;
          const fillTint = shadePalette[idx % shadePalette.length];

          if (rings) {
            const innerPoly = L.polygon(rings as L.LatLngExpression[][], {
              pane: 'kurdistan-provinces-pane',
              renderer: provRenderer,
              smoothFactor: 1.5,
              color: borderColor,
              weight: isSelectedProv ? 1.5 : 0.9,
              opacity: isSelectedProv ? 0.8 : isLight ? 0.55 : 0.42,
              fillColor: fillTint,
              fillOpacity: isSelectedProv ? 0 : isLight ? 0.08 : 0.055,
              interactive: false,
            });
            allProvincesLayerRef.current?.addLayer(innerPoly);
          }

          const labelText =
            language === 'en'
              ? prov.shortNameEn || prov.nameEn || prov.name
              : prov.shortName || prov.name;

          if (labelText && prov.center) {
            const labelIcon = L.divIcon({
              className: 'kurdistan-province-map-label',
              iconSize: [0, 0],
              iconAnchor: [0, 0],
              html: `<div style="transform:translate(-50%,-50%);white-space:nowrap;pointer-events:none;font-size:10px;font-weight:700;color:${
                isLight ? 'rgba(69,26,3,0.82)' : 'rgba(253,230,138,0.75)'
              };text-shadow:${
                isLight ? '0 1px 1px rgba(255,255,255,0.9)' : '0 1px 2px rgba(0,0,0,0.9)'
              };">${escapeHtml(labelText)}</div>`,
            });
            const labelMarker = L.marker(prov.center, {
              icon: labelIcon,
              pane: 'kurdistan-province-labels-pane',
              interactive: false,
            });
            provinceLabelsLayerRef.current?.addLayer(labelMarker);
          }
        });
      }

      const polygon = L.polygon(GREAT_KURDISTAN_POLYGON, {
        pane: 'kurdistan-provinces-pane',
        renderer: provRenderer,
        smoothFactor: 1.5,
        color: theme.primaryColor || '#f59e0b',
        weight: 2.2,
        opacity: 0.92,
        fillColor: theme.primaryColor || '#f59e0b',
        fillOpacity: 0.03,
        dashArray: '8, 8',
        interactive: false,
      }).addTo(map);

      polygonLayerRef.current = polygon;
    }
  }, [showPolygon, activeProvince, theme.primaryColor, colorMode, language]);

  // Show 38 province labels only at overview-to-regional zooms so detail views remain uncluttered
  useEffect(() => {
    const map = mapInstanceRef.current;
    const labelsLayer = provinceLabelsLayerRef.current;
    if (!map || !labelsLayer) return;

    const syncLabelVisibility = () => {
      const z = map.getZoom();
      const shouldShow = showPolygon && z >= 5.2 && z <= 11.5;
      if (shouldShow && !map.hasLayer(labelsLayer)) {
        labelsLayer.addTo(map);
      } else if (!shouldShow && map.hasLayer(labelsLayer)) {
        map.removeLayer(labelsLayer);
      }
    };

    syncLabelVisibility();
    map.on('zoomend', syncLabelVisibility);
    return () => {
      map.off('zoomend', syncLabelVisibility);
    };
  }, [leafletMap, showPolygon]);

  // Highlight Selected Province Administrative Boundary on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (provincePolygonLayerRef.current) {
      map.removeLayer(provincePolygonLayerRef.current);
      provincePolygonLayerRef.current = null;
    }

    if (activeProvince && activeProvince !== 'all') {
      const targetProv = KURDISTAN_PROVINCES.find((p) => p.id === activeProvince);
      const rings =
        targetProv?.polygons && targetProv.polygons.length > 0
          ? targetProv.polygons
          : targetProv?.polygon && targetProv.polygon.length >= 3
          ? [targetProv.polygon]
          : null;
      if (rings) {
        const provPoly = L.polygon(rings as L.LatLngExpression[][], {
          pane: 'kurdistan-provinces-pane',
          renderer: provincesCanvasRendererRef.current || undefined,
          smoothFactor: 1.5,
          color: '#fbbf24',
          weight: 2.5,
          opacity: 0.95,
          fillColor: '#f59e0b',
          fillOpacity: 0.14,
          dashArray: '5, 5',
          interactive: false,
        }).addTo(map);
        provincePolygonLayerRef.current = provPoly;
      }
    }
  }, [activeProvince]);

  // Filter facts based on Principality Focus Isolation, Category Tag, Province, and Active Year
  const visibleFacts = useMemo(() => {
    let list = facts;

    // 1. Principality / Authority Focus Isolation
    if (isPrincipalityFocusActive && relatedFactIdsSet && relatedFactIdsSet.size > 0) {
      list = list.filter((fact) => relatedFactIdsSet.has(fact.id));
      return list;
    }

    // 2. Category Filter (پۆلێن)
    if (activeTagFilter !== 'all') {
      list = list.filter((fact) => getCategoryInfo(fact).id === activeTagFilter);
    }

    // 2.5. Province Filter (پۆلێنی پارێزگا)
    if (activeProvince !== 'all') {
      list = filterFactsByProvince(list, activeProvince);
    }

    // 3. Active Year Filter
    if (selectedYear !== 'all') {
      list = filterFactsByActiveYear(list, selectedYear);
    }

    return list;
  }, [facts, isPrincipalityFocusActive, relatedFactIdsSet, activeTagFilter, activeProvince, selectedYear, provinceCacheTick]);

  // Update Base Markers (Canvas circleMarkers - points only)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    if (!showAllMarkers) {
      return;
    }

    const canvasRenderer = vectorCanvasRendererRef.current || undefined;

    visibleFacts.forEach((fact) => {
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

      const catInfo = getCategoryInfo(fact, language);
      const tagColor = catInfo.color;

      try {
        const circle = L.circleMarker([lat, lng], {
          renderer: canvasRenderer,
          radius: 5.5,
          color: '#0b0f1c',
          weight: 1.5,
          opacity: 0.9,
          fillColor: tagColor,
          fillOpacity: 0.95,
        });

        if (fact.name) {
          circle.bindTooltip(escapeHtml(fact.name), {
            direction: 'top',
            offset: [0, -6],
            opacity: 0.95,
          });
        }

        circle.on('click', (e) => {
          if (e && e.originalEvent) {
            L.DomEvent.stopPropagation(e);
          }
          setIsPrincipalityFocusActive(true);
          onSelectFact(fact);
          setShowQuickSummary(true);
        });

        markersLayer.addLayer(circle);
      } catch (err) {
        console.warn('Failed to add canvas marker:', err);
      }
    });
  }, [visibleFacts, showAllMarkers, language]);

  // Update Single Active Selected Marker Separately (never rebuilds all base markers on click)
  useEffect(() => {
    const selectedLayer = selectedMarkerLayerRef.current;
    if (!selectedLayer) return;

    selectedLayer.clearLayers();
    if (!selectedFact) return;

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

    const catInfo = getCategoryInfo(selectedFact, language);
    const tagColor = catInfo.color;
    const glowColor = `${tagColor}d9`;
    const safeName = escapeHtml(selectedFact.name || '');
    const alignClass = isEn ? 'text-left' : 'text-right';

    const iconSize: [number, number] = [28, 28];
    const iconAnchor: [number, number] = [14, 14];
    const iconHtml = `
      <div class="preserve-contrast relative w-8 h-8 flex items-center justify-center select-none pointer-events-auto animate-marker-pop map-pin-circle">
        <div class="absolute -inset-2 rounded-full pointer-events-none opacity-40 animate-ping" style="background-color: ${glowColor};"></div>
        <div class="relative w-5 h-5 rounded-full border-2 border-white flex items-center justify-center cursor-pointer shadow-lg z-10" style="background-color: ${tagColor};">
          <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
        </div>
        <div class="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 pointer-events-auto z-50">
          <div class="w-2 h-2 rotate-45 bg-[#080c14] border-t border-l border-amber-400/50 mx-auto -mb-1"></div>
          <div dir="${dir}" class="px-3 py-1 bg-[#080c14] border border-amber-500/60 whitespace-nowrap ${alignClass} shadow-lg">
            <span class="text-xs font-black text-white tracking-wide font-heading">${safeName}</span>
          </div>
        </div>
      </div>
    `;

    const customIcon = L.divIcon({
      html: iconHtml,
      className: 'kurdish-map-marker-container',
      iconSize,
      iconAnchor,
    });

    try {
      const marker = L.marker([lat, lng], {
        icon: customIcon,
        zIndexOffset: 1000,
      });

      marker.on('click', (e) => {
        if (e && e.originalEvent) {
          L.DomEvent.stopPropagation(e);
        }
        setIsPrincipalityFocusActive(true);
        onSelectFact(selectedFact);
        setShowQuickSummary(true);
      });

      selectedLayer.addLayer(marker);
    } catch (err) {
      console.warn('Failed to add selected marker:', err);
    }
  }, [selectedFact, language, dir, isEn]);

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

  // On-Map Spiderweb / Constellation Knowledge Graph Laser Lines Renderer
  useEffect(() => {
    const map = mapInstanceRef.current;
    const kgLayer = knowledgeGraphLayerRef.current;
    if (!map || !kgLayer) return;

    kgLayer.clearLayers();

    if (!selectedFact || !showKnowledgeGraphLines) return;

    const network = getKnowledgeGraphNetwork(selectedFact, facts, language);
    if (!network || network.links.length === 0) return;

    // Render clean laser lines for explicit user-linked facts
    network.links.forEach((link) => {
      const lat1 = Number(link.source.lat);
      const lng1 = Number(link.source.lng);
      const lat2 = Number(link.target.lat);
      const lng2 = Number(link.target.lng);

      if (
        !Number.isFinite(lat1) ||
        !Number.isFinite(lng1) ||
        !Number.isFinite(lat2) ||
        !Number.isFinite(lng2)
      ) {
        return;
      }

      // Static clean connection line on Canvas
      const connectionLine = L.polyline(
        [
          [lat1, lng1],
          [lat2, lng2],
        ],
        {
          renderer: vectorCanvasRendererRef.current || undefined,
          color: link.color,
          weight: link.isDirectParent ? 3 : 2.2,
          opacity: 0.9,
          lineCap: 'round',
          interactive: true,
        }
      );
      connectionLine.on('click', () => {
        onSelectFact(link.target);
      });
      kgLayer.addLayer(connectionLine);

      // Midpoint Relation Badge Tag
      const midLat = (lat1 + lat2) / 2;
      const midLng = (lng1 + lng2) / 2;
      const badgeIcon = L.divIcon({
        className: 'knowledge-graph-midpoint-badge',
        html: `
          <div class="preserve-contrast px-2.5 py-0.5 text-[9px] font-black text-white border flex items-center gap-1 cursor-pointer select-none map-pin-circle"
               style="background-color: #060a16; border-color: ${link.color};" dir="${dir}">
            <span class="w-1.5 h-1.5 rounded-full shrink-0" style="background-color: ${link.color}"></span>
            <span class="whitespace-nowrap font-bold">${escapeHtml(link.label)}</span>
          </div>
        `,
        iconSize: [84, 22],
        iconAnchor: [42, 11],
      });
      const badgeMarker = L.marker([midLat, midLng], {
        icon: badgeIcon,
        interactive: true,
      });
      badgeMarker.on('click', () => {
        onSelectFact(link.target);
      });
      kgLayer.addLayer(badgeMarker);
    });
  }, [selectedFact, facts, showKnowledgeGraphLines, language, dir]);

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
      className={`relative w-full h-full overflow-hidden select-none ${
        colorMode === 'light' ? 'bg-[#eae7de]' : 'bg-[#12161f]'
      } ${isPickingLocation ? 'cursor-crosshair' : ''}`}
    >
      {/* 1. Leaflet Map Viewport */}
      <div
        ref={mapContainerRef}
        id="kurdish-leaflet-map-host"
        className="w-full h-full z-0 leaflet-container"
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          inset: 0,
          direction: 'ltr',
        }}
      />

      {/* Dynamic Era Atmosphere Lighting & Vignette Overlay (Dark mode only, lightweight radial gradient) */}
      {eraAtmosphere && colorMode !== 'light' && (
        <div
          className={`absolute inset-0 pointer-events-none z-10 ${eraAtmosphere.tintClass}`}
          style={{
            background: `radial-gradient(circle at center, transparent 58%, ${eraAtmosphere.glowColor} 100%)`,
          }}
        />
      )}

      {/* Dynamic Spatial Category Ambient Color Bleed (lightweight gradient instead of blurred inset shadow) */}
      {selectedFact && (
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: `radial-gradient(circle at center, transparent 62%, ${getCategoryInfo(selectedFact, language).color}1f 100%)`,
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

      {/* 3. Unified Calm Top Map Search & Control Bar (Navbar handles Home/Lang/Theme/Settings) */}
      <div
        className="absolute top-2.5 inset-x-2.5 sm:top-3 sm:inset-x-3 z-30 pointer-events-none flex flex-wrap items-center justify-between gap-2"
        dir={dir}
      >
        {/* Start Cluster: Inline Map Search + Categories + Provinces */}
        <div className="pointer-events-auto flex items-center gap-1.5 flex-wrap max-w-full">
          {/* Inline Map Search (Slim & Narrow) */}
          <div ref={mapSearchRef} className="relative w-36 xs:w-44 sm:w-48">
            <div className="glass-dock-2026 rounded-xl flex items-center px-2 h-8 border border-transparent focus-within:border-amber-400/70 transition-colors shadow-lg">
              <Search className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
              <input
                type="text"
                value={mapSearchQuery}
                onFocus={() => setShowMapSearchResults(true)}
                onChange={(e) => {
                  setMapSearchQuery(e.target.value);
                  setShowMapSearchResults(true);
                }}
                placeholder={isEn ? 'Search map...' : 'گەڕان لە نەخشە...'}
                className={`bare-input w-full bg-transparent text-xs font-medium px-2 focus:outline-none ${
                  isDark ? 'text-white placeholder:text-slate-400' : 'text-slate-900 placeholder:text-slate-500'
                }`}
              />
              {mapSearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setMapSearchQuery('');
                    setShowMapSearchResults(false);
                  }}
                  className={`p-0.5 rounded cursor-pointer ${
                    isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title={isEn ? 'Clear search' : 'سڕینەوە'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Live Search Dropdown */}
            {showMapSearchResults && mapSearchQuery.trim().length > 0 && (
              <div
                className={`absolute top-full mt-1.5 start-0 w-72 sm:w-80 rounded-2xl border p-1.5 shadow-2xl backdrop-blur-xl z-50 max-h-72 overflow-y-auto custom-scrollbar ${
                  isDark
                    ? 'bg-[#0b1020]/98 border-white/15 text-slate-100'
                    : 'bg-white/98 border-slate-300 text-slate-900'
                }`}
              >
                {mapSearchMatches.length === 0 ? (
                  <p className={`text-xs px-3 py-3 text-center ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {isEn ? 'No matching places found.' : 'هیچ شوێنێک نەدۆزرایەوە.'}
                  </p>
                ) : (
                  <div className="space-y-0.5">
                    {mapSearchMatches.map((match) => {
                      const cat = getCategoryInfo(match, language);
                      const img = getFactDisplayImage(match);
                      return (
                        <button
                          key={match.id}
                          type="button"
                          onClick={() => {
                            onSelectFact(match);
                            setShowQuickSummary(true);
                            setShowMapSearchResults(false);
                            setMapSearchQuery('');
                          }}
                          className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-start transition-colors cursor-pointer ${
                            isDark ? 'hover:bg-white/[0.08]' : 'hover:bg-amber-50'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-amber-500/30 bg-black/80 flex items-center justify-center">
                            {img ? (
                              <img src={getOptimizedImageUrl(img, 'thumb')} alt={match.name} className="w-full h-full object-cover" />
                            ) : (
                              <MapPin className="w-4 h-4 text-amber-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold truncate">{match.name}</p>
                            <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                              {cat.name}
                              {(match.year || match.century) ? ` · ${match.year || match.century}` : ''}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Categories + Provinces Pill */}
          <div className="glass-dock-2026 rounded-xl p-0.5 flex items-center gap-0.5 shadow-lg">
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen((prev) => !prev)}
              className={`relative flex items-center gap-1.5 px-2.5 h-8.5 rounded-lg transition-all cursor-pointer active:scale-95 text-xs font-bold ${
                activeTagFilter !== 'all'
                  ? isDark
                    ? 'bg-amber-400/25 text-amber-300 border border-amber-400/40'
                    : 'bg-amber-100 text-amber-950 border border-amber-400'
                  : isDark
                  ? 'text-slate-200 hover:text-amber-300 hover:bg-white/[0.08]'
                  : 'text-slate-800 hover:text-amber-900 hover:bg-amber-50'
              }`}
              title={isEn ? 'Filter by category' : 'پۆلێنەکان'}
            >
              <Layers className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
              <span className="whitespace-nowrap hidden xs:inline">
                {activeTagFilter === 'all'
                  ? isEn
                    ? 'Categories'
                    : 'پۆلێنەکان'
                  : isEn
                  ? currentFilterObj.shortLabelEn
                  : currentFilterObj.shortLabel}
              </span>
              {activeTagFilter !== 'all' && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: getAccessibleCategoryColor(currentFilterObj.color, isDark) }}
                />
              )}
            </button>

            <div className={`w-[1px] h-4 ${isDark ? 'bg-white/10' : 'bg-slate-300'}`} />

            <button
              type="button"
              onClick={() => setIsProvinceModalOpen((prev) => !prev)}
              className={`relative flex items-center gap-1.5 px-2.5 h-8.5 rounded-lg transition-all cursor-pointer active:scale-95 text-xs font-bold ${
                activeProvince !== 'all'
                  ? isDark
                    ? 'bg-amber-400/25 text-amber-300 border border-amber-400/40'
                    : 'bg-amber-100 text-amber-950 border border-amber-400'
                  : isDark
                  ? 'text-slate-200 hover:text-amber-300 hover:bg-white/[0.08]'
                  : 'text-slate-800 hover:text-amber-900 hover:bg-amber-50'
              }`}
              title={isEn ? 'Filter by province' : 'پارێزگاکان'}
            >
              <MapPin className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
              <span className="whitespace-nowrap hidden xs:inline">
                {activeProvince === 'all'
                  ? isEn
                    ? 'Provinces'
                    : 'پارێزگاکان'
                  : isEn
                  ? currentProvinceObj?.nameEn || currentProvinceObj?.name || 'Province'
                  : currentProvinceObj?.name || 'پارێزگا'}
              </span>
            </button>
          </div>
        </div>

        {/* End Cluster: Reset Camera + Admin Bar */}
        <div className="pointer-events-auto flex items-center gap-1.5 flex-wrap">
          <div className="glass-dock-2026 rounded-xl p-0.5 flex items-center gap-0.5 shadow-lg">
            {/* Reset Camera */}
            <button
              type="button"
              onClick={handleResetCamera}
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all cursor-pointer active:scale-95 ${
                isDark
                  ? 'text-slate-200 hover:text-amber-300 hover:bg-white/[0.08]'
                  : 'text-slate-800 hover:text-amber-900 hover:bg-amber-50'
              }`}
              title={isEn ? 'Reset map view to Greater Kurdistan' : 'گەڕانەوەی دیدی نەخشە بۆ کوردستانی گەورە'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Admin Quick Bar when active */}
          {isAdmin && (
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-xl glass-dock-2026 border shadow-lg ${
                isDark ? 'border-amber-400/30' : 'border-amber-400/50'
              }`}
            >
              <span className={`w-2 h-2 rounded-full animate-pulse shrink-0 ${isDark ? 'bg-amber-400' : 'bg-amber-600'}`} />
              {onOpenSubmittedPhotos && (
                <button
                  type="button"
                  onClick={onOpenSubmittedPhotos}
                  className={`flex items-center gap-1 px-2 h-8 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    isDark
                      ? 'bg-amber-500/20 hover:bg-amber-500/35 text-amber-200'
                      : 'bg-amber-100 hover:bg-amber-200 text-amber-950'
                  }`}
                  title={isEn ? 'Submitted photos' : 'وێنە نێردراوەکان'}
                >
                  <Images className="w-3.5 h-3.5" />
                  {typeof pendingSubmissionsCount === 'number' && pendingSubmissionsCount > 0 && (
                    <span className="preserve-contrast px-1.5 rounded-full bg-amber-600 text-white font-black text-[10px]">
                      {formatDigits(pendingSubmissionsCount, language)}
                    </span>
                  )}
                </button>
              )}
              {onOpenAddFact && (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenAddFact('photo_only')}
                    className={`flex items-center gap-1 px-2 h-8 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      isDark ? 'text-slate-200 hover:bg-white/10' : 'text-slate-800 hover:bg-slate-100'
                    }`}
                    title={isEn ? 'Add quick photo' : 'وێنەی نوێ'}
                  >
                    <ImageIcon className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
                    <span className="hidden lg:inline">{isEn ? 'Photo' : 'وێنە'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenAddFact('standard')}
                    className={`flex items-center gap-1 px-2 h-8 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      isDark ? 'text-slate-200 hover:bg-white/10' : 'text-slate-800 hover:bg-slate-100'
                    }`}
                    title={isEn ? 'Add topic' : 'بابەتی نوێ'}
                  >
                    <Plus className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />
                    <span className="hidden lg:inline">{isEn ? 'Topic' : 'بابەت'}</span>
                  </button>
                </>
              )}
              {onLogoutAdmin && (
                <button
                  type="button"
                  onClick={onLogoutAdmin}
                  className={`flex items-center gap-1 px-2 h-8 rounded-lg text-[11px] font-bold cursor-pointer ${
                    isDark ? 'text-rose-300 hover:bg-rose-950/60' : 'text-rose-700 hover:bg-rose-100'
                  }`}
                  title={isEn ? 'Exit Admin' : 'دەرچوون'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3B. Status Pills Below Top Toolbar: Pick Mode / Category Filter / Authority Focus / Empty EN Helper */}
      <div className="absolute top-[96px] sm:top-[60px] left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center gap-1.5 max-w-[92vw]" dir={dir}>
        {/* A. Picking Location Prompt */}
        {isPickingLocation ? (
          <div className="preserve-contrast flex items-center gap-2 pointer-events-auto px-4 py-2 rounded-xl bg-amber-500/95 text-slate-950 font-bold text-xs shadow-[0_0_30px_rgba(245,158,11,0.5)] border border-amber-300 animate-bounce">
            <Crosshair className="w-4 h-4 text-slate-950 animate-spin shrink-0" />
            <span>
              {isEn
                ? 'Click anywhere on the map to place coordinates'
                : 'کلیک لەسەر هەر شوێنێکی نەخشە بکە بۆ دانانی پۆینتی دەسەڵات'}
            </span>
            {onCancelPickLocation && (
              <button
                onClick={onCancelPickLocation}
                className="ms-2 px-2 py-0.5 rounded bg-black text-amber-300 text-[10px] font-mono cursor-pointer shrink-0"
              >
                {isEn ? 'Cancel' : 'پەشیمانبوونەوە'}
              </button>
            )}
          </div>
        ) : null}

        {/* B. Active Filter Persistent Badge */}
        {activeTagFilter !== 'all' && (
          <div className={`pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass-dock border shadow-lg animate-fade-in text-start ${
            isDark ? 'border-white/20' : 'border-slate-300'
          }`}>
            <span
              className="w-2 h-2 rounded-full animate-ping shrink-0"
              style={{ backgroundColor: getAccessibleCategoryColor(currentFilterObj.color, isDark) }}
            />
            <FilterIconComponent
              className="w-3.5 h-3.5 shrink-0"
              style={{ color: getAccessibleCategoryColor(currentFilterObj.color, isDark) }}
            />
            <span className={`text-xs font-bold tracking-wide truncate max-w-[180px] sm:max-w-xs ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {isEn ? currentFilterObj.labelEn : currentFilterObj.label}
            </span>
            <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full border shrink-0 ${
              isDark
                ? 'liquid-glass-subtle text-amber-300 border-white/10'
                : 'bg-amber-100 text-amber-900 border-amber-300'
            }`}>
              {formatDigits(visibleFacts.length, language)} {isEn ? 'sites' : 'شوێن'}
            </span>
            <button
              onClick={() => handleSelectTagFilter('all')}
              className={`p-1 -me-1 rounded-full transition-colors cursor-pointer ${
                isDark
                  ? 'text-amber-400 hover:text-white hover:bg-white/10'
                  : 'text-amber-800 hover:text-slate-950 hover:bg-amber-100'
              }`}
              title={isEn ? 'Clear category filter' : 'لابردنی فلتەر و پیشاندانی هەمووی'}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* C. Principality / Authority Focus Isolation Indicator */}
        {isPrincipalityFocusActive && relatedFactIdsSet && selectedFact && isPrincipalityFact(selectedFact) && (
          <div className={`pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass-dock border shadow-lg animate-fade-in text-start ${
            isDark ? 'border-amber-400/50' : 'border-amber-500/50'
          }`}>
            <span className={`w-2 h-2 rounded-full animate-ping shrink-0 ${isDark ? 'bg-amber-400' : 'bg-amber-600'}`} />
            <Crown className={`w-4 h-4 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
            <span className={`text-xs font-bold font-heading truncate max-w-[160px] sm:max-w-xs ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {isEn ? 'Focus: ' : 'فۆکەس: '}
              <span className={`font-extrabold ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>{selectedFact.name}</span>
            </span>
            <button
              onClick={() => setIsPrincipalityFocusActive(false)}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ms-1 border shrink-0 ${
                isDark
                  ? 'bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 hover:text-white border-amber-400/30'
                  : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-300'
              }`}
              title={isEn ? 'Show all historical sites on map' : 'پیشاندانی هەموو شوێنەکانی تر لەسەر نەخشە'}
            >
              <X className={`w-3 h-3 ${isDark ? 'text-amber-300' : 'text-amber-800'}`} />
              <span>{isEn ? 'Show All' : 'پیشاندانی هەمووی'}</span>
            </button>
          </div>
        )}

        {/* D. Empty English Dataset Helper Card */}
        {isEn && facts.length === 0 && (
          <div className={`pointer-events-auto mt-2 px-4 py-3 rounded-2xl glass-dock-2026 border shadow-2xl flex flex-col sm:flex-row items-center gap-3 text-start max-w-lg animate-fade-in ${
            isDark ? 'border-amber-400/40' : 'border-amber-400/60'
          }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${
                isDark ? 'bg-amber-500/20 border-amber-400/40' : 'bg-amber-100 border-amber-300'
              }`}>
                <Globe className={`w-4 h-4 ${isDark ? 'text-amber-300' : 'text-amber-800'}`} />
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>English Historical Archive</p>
                <p className={`text-[11px] leading-snug ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {isAdmin
                    ? 'This independent English archive is empty. Open Directory to AI-translate Kurdish entries or add English topics.'
                    : 'No English historical entries have been published yet. Switch to Kurdish Sorani or check back soon.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {isAdmin && onOpenMenu && (
                <button
                  type="button"
                  onClick={onOpenMenu}
                  className="preserve-contrast px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-[11px] transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                >
                  Open AI Translator
                </button>
              )}
              <button
                type="button"
                onClick={toggleLanguage}
                className={`px-3 py-1.5 rounded-xl border font-bold text-[11px] transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
                  colorMode === 'light'
                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-400'
                    : 'bg-white/10 hover:bg-white/20 text-amber-200 border-white/15'
                }`}
              >
                کوردی
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Non-Overlapping Side Inspector Drawer (Desktop) & Bottom Sheet (Mobile) */}
      {selectedFact && showQuickSummary && (() => {
        const stepList = visibleFacts.length > 1 ? visibleFacts : facts;
        const currentIdx = stepList.findIndex((f) => f.id === selectedFact.id);
        const handleStepTopic = (delta: -1 | 1) => {
          if (stepList.length <= 1) return;
          const baseIdx = currentIdx >= 0 ? currentIdx : 0;
          const nextIdx = (baseIdx + delta + stepList.length) % stepList.length;
          onSelectFact(stepList[nextIdx]);
          setShowQuickSummary(true);
        };
        const displayImg = getFactDisplayImage(selectedFact);

        return (
          <aside
            dir={dir}
            onClick={(e) => e.stopPropagation()}
            className={`absolute inset-x-2 bottom-2 max-h-[62dvh] md:inset-x-auto md:top-16 md:bottom-3 md:end-3 md:w-[375px] lg:w-[405px] md:max-h-none z-40 rounded-2xl sm:rounded-3xl glass-dock-2026 border flex flex-col overflow-hidden text-start animate-spatial-spring select-text shadow-2xl ${
              isDark ? 'border-white/15' : 'border-slate-300'
            }`}
          >
            {/* Inspector Header */}
            <div className={`px-4 pt-3.5 pb-3 border-b shrink-0 flex items-start justify-between gap-2 ${
              isDark ? 'border-white/[0.08]' : 'border-slate-200'
            }`}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-3.5 rounded-xs bg-gradient-to-b from-red-600 via-white to-emerald-600 flex items-center justify-center shadow-xs shrink-0 border border-amber-400/50">
                    <span className="text-[6px] text-amber-500 font-bold leading-none select-none">☀️</span>
                  </div>
                  <div className={`flex items-center gap-1.5 text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <span
                      className="font-semibold truncate"
                      style={{ color: getAccessibleCategoryColor(getCategoryInfo(selectedFact, language).color, isDark) }}
                    >
                      {getCategoryInfo(selectedFact, language).name || selectedFact.tag || (isEn ? 'Historical Power' : 'دەسەڵاتی مێژوویی')}
                    </span>
                    {(selectedFact.year || selectedFact.century) && (
                      <>
                        <span aria-hidden="true" className={`font-mono ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>·</span>
                        <span className={`font-mono tabular-nums font-bold shrink-0 ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                          {selectedFact.year || selectedFact.century}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <h3 className={`text-base sm:text-lg font-extrabold font-heading leading-snug mt-1 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {selectedFact.name}
                </h3>
              </div>

              {/* Prev / Next / Close Controls */}
              <div className="flex items-center gap-1 shrink-0">
                {stepList.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleStepTopic(-1)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-white/[0.06] hover:bg-white/[0.14] text-slate-300 hover:text-white border-white/[0.08]'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                      }`}
                      title={isEn ? 'Previous site' : 'شوێنی پێشوو'}
                    >
                      {isEn ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStepTopic(1)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-white/[0.06] hover:bg-white/[0.14] text-slate-300 hover:text-white border-white/[0.08]'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                      }`}
                      title={isEn ? 'Next site' : 'شوێنی دواتر'}
                    >
                      {isEn ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setShowQuickSummary(false)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer border ${
                    isDark
                      ? 'bg-white/[0.06] hover:bg-white/[0.14] text-slate-300 hover:text-white border-white/[0.08]'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 border-slate-300'
                  }`}
                  title={isEn ? 'Minimize inspector' : 'داخستنی پانێڵ'}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Inspector Body */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-3">
              {/* Topic Image or Submit Prompt */}
              {!displayImg ? (
                <div className="rounded-2xl p-3 border border-dashed border-amber-500/45 bg-gradient-to-b from-amber-500/[0.08] to-transparent text-center flex flex-col items-center justify-center gap-2">
                  <p className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {isEn
                      ? 'No archival photo added for this entry yet'
                      : 'ئەم بابەتە هێشتا وێنەی فەرمی بۆ دانەنراوە'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setFactToSubmitPhoto(selectedFact)}
                    className="preserve-contrast flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95"
                  >
                    <ImagePlus className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Suggest Image URL' : 'ناردنی لینکی وێنە'}</span>
                  </button>
                </div>
              ) : (
                <div className="preserve-contrast relative rounded-2xl overflow-hidden border border-white/[0.1] bg-black/90 group shadow-md flex flex-col items-center justify-center p-1.5">
                  <img
                    src={displayImg}
                    alt={selectedFact.imageCaption || selectedFact.name}
                    className="max-h-48 sm:max-h-56 max-w-full w-auto h-auto object-contain mx-auto rounded-xl group-hover:scale-[1.01] transition-transform duration-300 cursor-pointer"
                    onClick={() =>
                      setLightboxImage({
                        url: displayImg,
                        caption: selectedFact.imageCaption,
                        title: selectedFact.name,
                      })
                    }
                  />
                  <div className="w-full mt-1.5 px-2.5 py-1 rounded-xl bg-white/[0.08] border border-white/[0.1] text-amber-200 text-[11px] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Camera className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate font-medium">{selectedFact.imageCaption || selectedFact.name}</span>
                    </div>
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
                      className="p-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.16] text-slate-200 hover:text-white cursor-pointer"
                      title={isEn ? 'Enlarge image' : 'گەورەکردنی وێنە'}
                    >
                      <Maximize2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Location Description */}
              {selectedFact.desc && (
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${isDark ? 'text-amber-300/90' : 'text-amber-800'}`}>
                  <MapPin className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
                  <span>{selectedFact.desc}</span>
                </div>
              )}

              {/* Unclipped Readable Historical Narrative */}
              <div className={`p-3.5 rounded-2xl border text-[13px] leading-relaxed font-normal whitespace-pre-line ${
                isDark
                  ? 'bg-white/[0.03] border-white/[0.08] text-slate-200'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}>
                {selectedFact.fullText || selectedFact.desc}
              </div>

              {/* Linked Topics (Vertical Chronological Column) */}
              {((selectedKnowledgeGraph?.nodes.length || 0) > 0 || selectedLinked.allRelated.length > 0) && (() => {
                const chronologicalLinked = [
                  ...(selectedKnowledgeGraph?.nodes && selectedKnowledgeGraph.nodes.length > 0
                    ? selectedKnowledgeGraph.nodes
                    : selectedLinked.allRelated),
                ].sort(compareFactsChronologically);

                return (
                  <div className={`p-3 rounded-2xl border space-y-2 ${
                    isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className={`flex items-center justify-between text-xs font-bold ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
                      <span className="flex items-center gap-1.5">
                        <Link2 className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
                        <span>{isEn ? 'Connected Sites' : 'شوێنە پەیوەندیدارەکان'}</span>
                      </span>
                      <span className={`font-mono tabular-nums text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {formatDigits(chronologicalLinked.length, language)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto custom-scrollbar pe-0.5">
                      {chronologicalLinked.map((lf, idx) => {
                        const c = getCategoryInfo(lf, language);
                        const accColor = getAccessibleCategoryColor(c.color, isDark);
                        const rawYear = lf.year || lf.century || getFactYearSpan(lf, language).label;
                        const displayYear = rawYear ? formatDigits(rawYear, language) : '';
                        return (
                          <button
                            key={lf.id}
                            type="button"
                            onClick={() => {
                              onSelectFact(lf);
                              setShowQuickSummary(true);
                            }}
                            className={`w-full px-2.5 py-2 rounded-xl text-xs flex items-center justify-between gap-2 border hover:border-amber-400/50 transition-all cursor-pointer active:scale-[0.99] text-start ${
                              isDark
                                ? 'border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-slate-200'
                                : 'border-slate-300 bg-white hover:bg-amber-50 text-slate-900'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span
                                className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono tabular-nums font-bold shrink-0 ${
                                  isDark ? 'bg-white/10 text-amber-300' : 'bg-amber-100 text-amber-900'
                                }`}
                              >
                                {formatDigits(idx + 1, language)}
                              </span>
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: accColor }} />
                              <span className="truncate font-semibold">{lf.name}</span>
                            </div>
                            {displayYear && (
                              <span
                                className={`text-[10px] font-mono tabular-nums font-bold shrink-0 px-1.5 py-0.5 rounded-md border ${
                                  isDark
                                    ? 'bg-white/[0.04] text-amber-200/90 border-white/10'
                                    : 'bg-amber-50 text-amber-900 border-amber-200'
                                }`}
                              >
                                {displayYear}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Sticky Inspector Action Footer */}
            <div className={`px-4 py-3 border-t shrink-0 flex flex-wrap items-center justify-between gap-2 ${
              isDark ? 'border-white/[0.08] bg-[#070b16]/80' : 'border-slate-200 bg-white/90'
            }`}>
              {onOpenDetail && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenDetail(selectedFact);
                  }}
                  className="preserve-contrast flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-extrabold text-xs transition-all cursor-pointer active:scale-95 shadow-md"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>{isEn ? 'Read Full Dossier' : 'زانیاریی تەواو و سەرچاوەکان'}</span>
                </button>
              )}

              <div className="flex items-center gap-1.5">
                {isPrincipalityFact(selectedFact) && (
                  <button
                    type="button"
                    onClick={() => setIsPrincipalityFocusActive((prev) => !prev)}
                    className={`flex items-center gap-1 px-2.5 h-9.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      isPrincipalityFocusActive
                        ? 'liquid-glass-btn-active font-extrabold'
                        : isDark
                        ? 'bg-white/[0.06] text-amber-300 border-white/10 hover:bg-white/10'
                        : 'bg-slate-100 text-amber-900 border-slate-300 hover:bg-slate-200'
                    }`}
                    title={isEn ? 'Focus on this polity and its linked sites' : 'فۆکەس لەسەر ئەم دەسەڵاتە'}
                  >
                    <Crown className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={async () => {
                    let ok = await copyTopicToClipboard(selectedFact, language);
                    if (!ok) {
                      try {
                        if (navigator?.clipboard?.writeText) {
                          await navigator.clipboard.writeText(
                            isEn
                              ? `📌 «${selectedFact.name}»\n\n${selectedFact.fullText || selectedFact.desc}\n\n📍 Location: ${selectedFact.desc}\n🔗 ${getShareableTopicUrl(selectedFact.id, language)}\n\nSource: kurdistan info map`
                              : `📌 «${selectedFact.name}»\n\n${selectedFact.fullText || selectedFact.desc}\n\n📍 شوێن: ${selectedFact.desc}\n🔗 ${getShareableTopicUrl(selectedFact.id, language)}\n\nسەرچاوە: نەخشە زانیاری کوردستان-kurdistan info map`
                          );
                          ok = true;
                        }
                      } catch {
                        // ignore clipboard failure
                      }
                    }
                    if (ok) {
                      setCopiedSummary(true);
                      if (copiedSummaryTimeoutRef.current) clearTimeout(copiedSummaryTimeoutRef.current);
                      copiedSummaryTimeoutRef.current = setTimeout(() => setCopiedSummary(false), 2000);
                    }
                  }}
                  className={`flex items-center gap-1 px-2.5 h-9.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-white/[0.06] hover:bg-white/10 text-amber-300 border-white/10'
                      : 'bg-slate-100 hover:bg-slate-200 text-amber-900 border-slate-300'
                  }`}
                  title={isEn ? 'Copy share link & summary' : 'کۆپیکردنی بەستەر و دەق'}
                >
                  {copiedSummary ? (
                    <Check className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />
                  ) : (
                    <Copy className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
                  )}
                </button>
              </div>
            </div>
          </aside>
        );
      })()}

      {/* 5. Bottom Timeline Slider Dock */}
      <div
        className={`absolute z-30 pointer-events-auto flex-col items-center gap-1 transition-all ${
          selectedFact && showQuickSummary
            ? `hidden md:flex ${
                isEn
                  ? 'md:left-3 md:right-[405px] lg:right-[435px]'
                  : 'md:right-3 md:left-[405px] lg:left-[435px]'
              }`
            : 'flex left-1.5 right-1.5 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-full sm:max-w-xl'
        }`}
        style={{
          bottom: 'max(0.6rem, calc(env(safe-area-inset-bottom, 0px) + 0.35rem))',
        }}
      >
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

        {/* Selected Fact Capsule (when inspector is minimized) */}
        {selectedFact && !showQuickSummary && (
          <button
            dir={dir}
            onClick={() => setShowQuickSummary(true)}
            className="group relative flex items-center gap-2 px-3.5 py-2 rounded-2xl liquid-glass-btn shadow-lg cursor-pointer transition-all duration-200 active:scale-95 animate-fade-in text-start overflow-hidden"
            title={isEn ? 'Open topic inspector' : 'کردنەوەی زانیاریی شوێنی هەڵبژێردراو'}
          >
            <div className="w-3.5 h-2.5 rounded-xs bg-gradient-to-b from-red-600 via-white to-emerald-600 flex items-center justify-center shadow-xs shrink-0">
              <span className="text-[5px] text-amber-500 font-bold leading-none select-none">☀️</span>
            </div>

            <span
              className={`text-xs font-bold tracking-wide transition-colors truncate max-w-[160px] sm:max-w-xs ${
                isDark ? 'text-white group-hover:text-amber-300' : 'text-slate-900 group-hover:text-amber-800'
              }`}
            >
              {selectedFact.name}
            </span>

            {(selectedFact.year || selectedFact.century) && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${
                  isDark
                    ? 'text-amber-300 bg-white/10 border-white/15'
                    : 'text-amber-900 bg-amber-100 border-amber-300 font-bold'
                }`}
              >
                {selectedFact.year || selectedFact.century}
              </span>
            )}

            <span
              className={`text-[10px] font-bold flex items-center gap-0.5 ms-0.5 ps-1.5 border-s shrink-0 ${
                isDark ? 'text-amber-400 border-white/15' : 'text-amber-800 border-slate-300'
              }`}
            >
              <span>{isEn ? 'Open' : 'کردنەوە'}</span>
              <ChevronUp className="w-3 h-3" />
            </span>
          </button>
        )}
      </div>

      {/* Full-Screen Lightbox Modal for Topic Image */}
      {lightboxImage && (
        <div
          dir={dir}
          className="preserve-contrast fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-fade-in text-start"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-3xl w-full liquid-glass-card rounded-3xl p-4 sm:p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_25px_80px_rgba(0,0,0,0.95),0_0_40px_rgba(245,158,11,0.2)] backdrop-blur-3xl flex flex-col items-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass-specular-ray" />
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
                title={isEn ? 'Close' : 'داخستن'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-white/20 max-h-[65vh] w-full flex items-center justify-center bg-black/90 shadow-2xl">
              <img
                src={getOptimizedImageUrl(lightboxImage.url, 'full')}
                alt={lightboxImage.caption || lightboxImage.title}
                loading="eager"
                decoding="async"
                className="max-h-[65vh] w-auto max-w-full object-contain"
              />
            </div>

            {lightboxImage.caption && (
              <div className="mt-3.5 w-full p-2.5 px-3.5 rounded-xl liquid-glass-subtle text-amber-200 text-xs sm:text-[13px] backdrop-blur-md flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-medium">{lightboxImage.caption}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Theme Selector Modal */}
      <React.Suspense fallback={null}>
        <ThemeSelectorModal
          isOpen={isThemeModalOpen}
          onClose={() => setIsThemeModalOpen(false)}
        />
      </React.Suspense>

      {/* Category Selection Popover Modal */}
      {isCategoryModalOpen && (
        <div
          className={`fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-4 backdrop-blur-md animate-fade-in text-start ${
            isDark ? 'bg-black/75' : 'bg-slate-900/45'
          }`}
          onClick={() => setIsCategoryModalOpen(false)}
        >
          <div
            className={`relative w-full max-w-md liquid-glass-panel rounded-3xl p-4 sm:p-5 border max-h-[90dvh] flex flex-col overflow-hidden ${
              isDark
                ? 'border-white/20 shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_35px_rgba(245,158,11,0.2)]'
                : 'border-slate-300 shadow-[0_25px_70px_rgba(15,23,42,0.22)]'
            }`}
            onClick={(e) => e.stopPropagation()}
            dir={dir}
          >
            <div className="glass-specular-ray" />

            {/* Header */}
            <div className={`flex items-center justify-between pb-3 mb-3 border-b shrink-0 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl liquid-glass-btn flex items-center justify-center border ${
                    isDark ? 'text-amber-400 border-amber-400/30' : 'text-amber-700 border-amber-400/60'
                  }`}
                >
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-sm sm:text-base font-extrabold font-heading ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {isEn ? 'Map Historical Categories' : 'پۆلێنی شوێنەکان لەسەر نەخشە'}
                  </h3>
                  <p className={`text-[11px] font-light ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {isEn
                      ? 'Select a category to filter sites displayed on the map'
                      : 'یەک جۆر پۆلێن دیاریبکە بۆ پیشاندانی تەنها ئەو بابەتانە'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className={`w-8 h-8 rounded-xl liquid-glass-btn flex items-center justify-center transition-colors cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'
                }`}
                title={isEn ? 'Close' : 'داخستن'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category Options List */}
            <div className="space-y-1.5 overflow-y-auto pe-1 custom-scrollbar flex-1">
              {TAG_FILTER_OPTIONS.map((opt) => {
                const isSelected = activeTagFilter === opt.id;
                const count = tagCounts[opt.id] ?? 0;
                const IconComp = opt.icon;
                const accessibleOptColor = getAccessibleCategoryColor(opt.color, isDark);

                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      handleSelectTagFilter(opt.id);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-2xl transition-all cursor-pointer text-start group border ${
                      isSelected
                        ? 'liquid-glass-btn-active shadow-md border-amber-400/80 font-bold'
                        : `liquid-glass-btn ${
                            isDark
                              ? 'hover:border-amber-400/40 text-slate-200 hover:text-white'
                              : 'hover:border-amber-500/60 text-slate-800 hover:text-slate-950'
                          }`
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? isDark
                              ? 'bg-black/15 border-black/20'
                              : 'bg-white/20 border-white/30'
                            : isDark
                              ? 'bg-white/5 border-white/10'
                              : 'bg-slate-100 border-slate-200'
                        }`}
                        style={!isSelected ? { color: accessibleOptColor, borderColor: `${accessibleOptColor}40` } : undefined}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span
                          className={`block text-xs sm:text-sm font-heading font-bold truncate ${
                            isSelected
                              ? 'font-extrabold'
                              : isDark
                                ? 'text-white group-hover:text-amber-300'
                                : 'text-slate-900 group-hover:text-amber-800'
                          }`}
                        >
                          {isEn ? opt.labelEn : opt.label}
                        </span>
                        {opt.id !== 'all' && (
                          <span
                            className={`block text-[10px] truncate ${
                              isSelected
                                ? 'opacity-85 font-medium'
                                : isDark
                                  ? 'text-slate-400 font-light'
                                  : 'text-slate-600 font-normal'
                            }`}
                          >
                            {isEn ? opt.shortLabelEn : opt.shortLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          isSelected
                            ? isDark
                              ? 'bg-black/20 border-black/30'
                              : 'bg-white/20 border-white/30'
                            : isDark
                              ? 'bg-white/10 text-amber-300 border-white/10'
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}
                      >
                        {formatDigits(count, language)} {isEn ? 'sites' : 'شوێن'}
                      </span>
                      {isSelected && <Check className="w-4 h-4 ms-1 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Reset Footer */}
            {activeTagFilter !== 'all' && (
              <div className={`pt-3 mt-3 border-t flex justify-end shrink-0 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                <button
                  onClick={() => {
                    handleSelectTagFilter('all');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl liquid-glass-btn text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                    isDark
                      ? 'text-amber-300 hover:text-white border-white/10'
                      : 'text-amber-900 hover:text-slate-950 border-slate-300'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                  <span>
                    {isEn ? 'Clear filter & show all sites' : 'لابردنی فلتەر و پیشاندانی هەموو شوێنەکان'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submit Photo Suggestion Modal for facts without image on map */}
      {factToSubmitPhoto && (
        <SubmitPhotoModal
          fact={factToSubmitPhoto}
          isOpen={!!factToSubmitPhoto}
          onClose={() => setFactToSubmitPhoto(null)}
        />
      )}

      {/* Province Selector Modal on Map */}
      <ProvinceSelectorModal
        isOpen={isProvinceModalOpen}
        onClose={() => setIsProvinceModalOpen(false)}
        facts={facts}
        selectedProvinceId={activeProvince}
        onSelectProvince={handleSelectProvince}
      />
    </div>
  );
};
