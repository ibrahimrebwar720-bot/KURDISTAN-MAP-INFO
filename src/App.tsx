import React, { useState, useEffect, useRef } from 'react';
import { FactItem } from './data/kurdishHistoryData';
import { CollectionItem, PhotoSubmission } from './types/history';
import {
  loadStoredFacts,
  loadStoredCollections,
  getAdminState,
  setAdminState,
  loadStoredSubmissions,
} from './services/historyStorageService';
import {
  subscribeToCloudFacts,
  saveFactToCloud,
  deleteFactFromCloud,
  saveNotesToCloud,
  updateFactRelationsInCloud,
  subscribeToCloudCollections,
  saveCollectionToCloud,
  deleteCollectionFromCloud,
  subscribeToPhotoSubmissions,
} from './services/firestoreHistoryService';
import { KurdishDarkLeafletMap } from './components/KurdishDarkLeafletMap';
import { FactsList } from './components/FactsList';

// Resilient dynamic import helper with automatic retry for network or dev-server transient hiccups
function lazyWithRetry<T extends React.ComponentType<any>>(
  importer: () => Promise<any>,
  namedExport?: string
) {
  return React.lazy(async () => {
    try {
      const mod = await importer();
      const component =
        (namedExport && mod[namedExport]) ||
        mod.default ||
        Object.values(mod).find((v) => typeof v === 'function');
      return { default: component as T };
    } catch (error) {
      console.warn('Initial dynamic import failed, retrying...', error);
      await new Promise((resolve) => setTimeout(resolve, 750));
      const mod = await importer();
      const component =
        (namedExport && mod[namedExport]) ||
        mod.default ||
        Object.values(mod).find((v) => typeof v === 'function');
      return { default: component as T };
    }
  });
}

// Code-split heavy secondary modals for instant zero-lag initial page load
const FactDetailModal = lazyWithRetry(() => import('./components/FactDetailModal'), 'FactDetailModal');
const AdminPinModal = lazyWithRetry(() => import('./components/AdminPinModal'), 'AdminPinModal');
const FactEditorModal = lazyWithRetry(() => import('./components/FactEditorModal'), 'FactEditorModal');
const CollectionManagerModal = lazyWithRetry(() => import('./components/CollectionManagerModal'), 'CollectionManagerModal');
const HistoricalGalleryModal = lazyWithRetry(() => import('./components/HistoricalGalleryModal'), 'HistoricalGalleryModal');
const ThemeSelectorModal = lazyWithRetry(() => import('./components/ThemeSelectorModal'), 'ThemeSelectorModal');
const DocumentaryScrollytellingModal = lazyWithRetry(() => import('./components/DocumentaryScrollytellingModal'), 'DocumentaryScrollytellingModal');
const HeroSection = lazyWithRetry(() => import('./components/HeroSection'), 'HeroSection');
const HistoricalJourneyModal = lazyWithRetry(() => import('./components/HistoricalJourneyModal'), 'HistoricalJourneyModal');
const AppSettingsModal = lazyWithRetry(() => import('./components/AppSettingsModal'), 'AppSettingsModal');
const SubmittedPhotosModal = lazyWithRetry(() => import('./components/SubmittedPhotosModal'), 'SubmittedPhotosModal');
const CrossLangSyncModal = lazyWithRetry(() => import('./components/CrossLangSyncModal'), 'CrossLangSyncModal');
import { useTheme } from './context/ThemeContext';
import { AppLanguage, useLanguage, getInitialLanguage } from './context/LanguageContext';
import { translateFactToLanguageDetailed } from './services/aiTranslationService';
import {
  parseCurrentUrl,
  updateBrowserUrl,
} from './utils/urlRouter';
import { updateDynamicSeo } from './services/seoManager';

export default function App() {
  const { colorMode } = useTheme();
  const { language, isEn } = useLanguage();
  const [showIntro, setShowIntro] = useState<boolean>(false);

  // Initial URL parsing for deep-linking & direct article loading
  const initialUrlRef = useRef(parseCurrentUrl());
  const initialTopicFact = useRef<FactItem | null>(null);

  const [facts, setFacts] = useState<FactItem[]>(() => {
    const initLang = getInitialLanguage();
    const loaded = loadStoredFacts(initLang);
    if (initialUrlRef.current.topicId) {
      const match = loaded.find((f) => f.id === initialUrlRef.current.topicId);
      if (match) {
        initialTopicFact.current = match;
      }
    }
    return loaded;
  });

  const [collections, setCollections] = useState<CollectionItem[]>(() =>
    loadStoredCollections(getInitialLanguage())
  );
  const [isAdmin, setIsAdmin] = useState<boolean>(() => getAdminState());
  const [photoSubmissions, setPhotoSubmissions] = useState<PhotoSubmission[]>(() => loadStoredSubmissions());
  const [isSubmittedPhotosOpen, setIsSubmittedPhotosOpen] = useState(false);
  const [crossLangSyncTarget, setCrossLangSyncTarget] = useState<{
    fact: FactItem;
    sourceLang: AppLanguage;
  } | null>(null);

  const [selectedFact, setSelectedFact] = useState<FactItem | null>(() => initialTopicFact.current);
  const [detailFact, setDetailFact] = useState<FactItem | null>(() => initialTopicFact.current);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(() => initialUrlRef.current.view === 'menu');

  // Documentary Tour state & Map FlyTo bridge
  const [isDocumentaryTourOpen, setIsDocumentaryTourOpen] = useState(false);
  const [externalFlyTo, setExternalFlyTo] = useState<{
    lat: number;
    lng: number;
    zoom?: number;
    id?: string;
  } | null>(() => {
    if (initialTopicFact.current) {
      return {
        lat: initialTopicFact.current.lat,
        lng: initialTopicFact.current.lng,
        zoom: 8.5,
        id: `init-${initialTopicFact.current.id}`,
      };
    }
    return null;
  });

  const [showAllMarkers, setShowAllMarkers] = useState(true);
  const [showPolygon, setShowPolygon] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProvince, setSelectedProvince] = useState<string>(
    () => initialUrlRef.current.province || 'all'
  );
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');

  // Hero Section, Historical Journey & Settings Modal State
  // If URL has a direct topic, province, or specific view, open directly into that view (classic website behavior!)
  const [isHeroOpen, setIsHeroOpen] = useState<boolean>(() => {
    if (initialUrlRef.current.topicId || initialUrlRef.current.province) return false;
    if (
      initialUrlRef.current.view === 'map' ||
      initialUrlRef.current.view === 'journey' ||
      initialUrlRef.current.view === 'gallery' ||
      initialUrlRef.current.view === 'menu'
    ) {
      return false;
    }
    return true;
  });

  const [isJourneyOpen, setIsJourneyOpen] = useState<boolean>(
    () => initialUrlRef.current.view === 'journey'
  );
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(
    () => initialUrlRef.current.view === 'gallery'
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Map modes shared between Leaflet map and Settings Modal
  const [mapMode, setMapMode] = useState<'dark' | 'satellite'>('dark');
  const [markerViewMode, setMarkerViewMode] = useState<'photo' | 'points'>('points');
  const [showBottomPhotoStrip, setShowBottomPhotoStrip] = useState<boolean>(false);

  // Admin Modals state
  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState(false);
  const [isFactEditorOpen, setIsFactEditorOpen] = useState(false);
  const [factToEdit, setFactToEdit] = useState<FactItem | null>(null);
  const [isCollectionManagerOpen, setIsCollectionManagerOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  // Map Point Picking state
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [pickedCoords, setPickedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Google Maps Platform Quota Exceeded Alert State
  const [isGmpQuotaExceeded, setIsGmpQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuota = () => setIsGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // Synchronize SEO meta tags, OpenGraph, canonical URL & Schema.org JSON-LD
  useEffect(() => {
    const activeView = isJourneyOpen
      ? 'journey'
      : isGalleryOpen
      ? 'gallery'
      : isMenuOpen
      ? 'menu'
      : isDocumentaryTourOpen
      ? 'tour'
      : isHeroOpen
      ? 'hero'
      : 'map';

    updateDynamicSeo({
      detailFact,
      selectedProvinceId: selectedProvince,
      activeView,
      facts,
      language,
    });
  }, [detailFact, selectedProvince, isHeroOpen, isJourneyOpen, isGalleryOpen, isMenuOpen, isDocumentaryTourOpen, facts, language]);

  const handleProvinceChange = (provId: string) => {
    setSelectedProvince(provId);
    updateBrowserUrl({
      province: provId === 'all' ? null : provId,
      view: isHeroOpen ? 'hero' : 'map',
      lang: language,
      replace: false,
    });
  };

  // Global copy event listener: whenever someone copies text from the app, append source attribution
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      // Don't intercept inside input fields, textareas, or admin editable elements
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const selectedText = selection.toString().trim();
      if (!selectedText) return;

      const attribution = isEn
        ? '\n\nSource: kurdistan info map'
        : '\n\nسەرچاوە: نەخشە زانیاری کوردستان-kurdistan info map';
      if (
        selectedText.includes('سەرچاوە: نەخشە زانیاری کوردستان-kurdistan info map') ||
        selectedText.includes('Source: kurdistan info map')
      ) {
        return;
      }

      if (e.clipboardData) {
        e.clipboardData.setData('text/plain', `${selectedText}${attribution}`);
        e.preventDefault();
      }
    };

    document.addEventListener('copy', handleCopy);
    return () => document.removeEventListener('copy', handleCopy);
  }, [isEn]);

  // 1. Real-time Firebase Cloud Database synchronization for all users worldwide (isolated per language)
  useEffect(() => {
    const cachedFacts = loadStoredFacts(language);
    setFacts(cachedFacts);
    setCollections(loadStoredCollections(language));
    setSelectedFact((prev) => (prev ? cachedFacts.find((f) => f.id === prev.id) || null : null));
    setDetailFact((prev) => (prev ? cachedFacts.find((f) => f.id === prev.id) || null : null));
    setIsFactEditorOpen(false);

    const unsubFacts = subscribeToCloudFacts((cloudFacts) => {
      setFacts(cloudFacts);
      // Keep selected fact synced
      setSelectedFact((prev) => {
        if (!prev) return null;
        const found = cloudFacts.find((f) => f.id === prev.id);
        return found || null;
      });
      // Keep detail fact synced or resolve deep-linked topic if not found locally
      setDetailFact((prev) => {
        if (prev) {
          const found = cloudFacts.find((f) => f.id === prev.id);
          return found || null;
        }
        if (initialUrlRef.current.topicId) {
          const foundFromUrl = cloudFacts.find((f) => f.id === initialUrlRef.current.topicId);
          if (foundFromUrl) {
            setIsHeroOpen(false);
            updateBrowserUrl({
              topicId: foundFromUrl.id,
              factName: foundFromUrl.name,
              view: 'map',
              lang: language,
              replace: true,
            });
            return foundFromUrl;
          }
        }
        return null;
      });
    }, language);

    const unsubCollections = subscribeToCloudCollections((cloudCols) => {
      setCollections(cloudCols);
    }, language);

    const unsubSubmissions = subscribeToPhotoSubmissions((subs) => {
      setPhotoSubmissions(subs);
    });

    return () => {
      unsubFacts();
      unsubCollections();
      unsubSubmissions();
    };
  }, [language]);

  // 2. Initial mount effect: synchronize deep link, title and external flyTo
  useEffect(() => {
    const initLang = getInitialLanguage();
    if (initialTopicFact.current) {
      updateBrowserUrl({
        topicId: initialTopicFact.current.id,
        factName: initialTopicFact.current.name,
        view: 'map',
        lang: initLang,
        replace: true,
      });
    } else if (initialUrlRef.current.view || initialUrlRef.current.province) {
      updateBrowserUrl({
        view: initialUrlRef.current.view,
        province: initialUrlRef.current.province,
        lang: initLang,
        replace: true,
      });
    }
  }, []);

  // 3. Browser Back/Forward history navigation (Classic Website Navigation Support!)
  useEffect(() => {
    const handlePopState = () => {
      const urlState = parseCurrentUrl();
      setSelectedProvince(urlState.province || 'all');
      if (urlState.topicId) {
        const found = facts.find((f) => f.id === urlState.topicId);
        if (found) {
          setDetailFact(found);
          setSelectedFact(found);
          setIsHeroOpen(false);
          setIsJourneyOpen(false);
          setIsGalleryOpen(false);
          setIsMenuOpen(false);
        }
      } else {
        setDetailFact(null);
        if (urlState.view === 'journey') {
          setIsJourneyOpen(true);
          setIsGalleryOpen(false);
          setIsMenuOpen(false);
          setIsHeroOpen(false);
        } else if (urlState.view === 'gallery') {
          setIsGalleryOpen(true);
          setIsJourneyOpen(false);
          setIsMenuOpen(false);
          setIsHeroOpen(false);
        } else if (urlState.view === 'menu') {
          setIsMenuOpen(true);
          setIsJourneyOpen(false);
          setIsGalleryOpen(false);
          setIsHeroOpen(false);
        } else if (urlState.view === 'map') {
          setIsHeroOpen(false);
          setIsJourneyOpen(false);
          setIsGalleryOpen(false);
          setIsMenuOpen(false);
        } else if (urlState.view === 'hero' || !urlState.view) {
          setIsHeroOpen(true);
          setIsJourneyOpen(false);
          setIsGalleryOpen(false);
          setIsMenuOpen(false);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [facts]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPickingLocation) {
          setIsPickingLocation(false);
          setIsFactEditorOpen(true);
        } else if (isJourneyOpen) {
          handleCloseJourney();
        } else if (isAdminPinModalOpen) {
          setIsAdminPinModalOpen(false);
        } else if (isFactEditorOpen) {
          setIsFactEditorOpen(false);
        } else if (isCollectionManagerOpen) {
          setIsCollectionManagerOpen(false);
        } else if (isGalleryOpen) {
          handleCloseGallery();
        } else if (detailFact) {
          handleCloseDetail();
        } else if (isMenuOpen) {
          handleCloseMenu();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    detailFact,
    isMenuOpen,
    isJourneyOpen,
    isAdminPinModalOpen,
    isFactEditorOpen,
    isCollectionManagerOpen,
    isGalleryOpen,
    isPickingLocation,
    isHeroOpen,
  ]);

  // Fact Selection & Smooth Map FlyTo Bridge
  const handleSelectFact = (fact: FactItem) => {
    setSelectedFact(fact);
    setExternalFlyTo({
      lat: fact.lat,
      lng: fact.lng,
      zoom: 8.5,
      id: `fact-${fact.id}-${Date.now()}`,
    });
  };

  // Documentary Tour Map FlyTo Bridge
  const handleDocumentaryFlyTo = (lat: number, lng: number, zoom: number, storyTitle: string) => {
    setExternalFlyTo({
      lat,
      lng,
      zoom,
      id: `doc-${storyTitle}-${Date.now()}`,
    });
  };

  // URL-synchronized View & Detail Navigation Handlers
  const handleOpenDetail = (fact: FactItem) => {
    setDetailFact(fact);
    setSelectedFact(fact);
    updateBrowserUrl({
      topicId: fact.id,
      factName: fact.name,
      view: 'map',
      lang: language,
      replace: false,
    });
  };

  const handleCloseDetail = () => {
    setDetailFact(null);
    updateBrowserUrl({
      topicId: null,
      view: isHeroOpen ? 'hero' : 'map',
      lang: language,
      replace: false,
    });
  };

  const handleEnterMap = () => {
    setIsHeroOpen(false);
    updateBrowserUrl({
      topicId: detailFact?.id || null,
      view: 'map',
      factName: detailFact?.name,
      lang: language,
    });
  };

  const handleReturnToHero = () => {
    setIsHeroOpen(true);
    setDetailFact(null);
    setIsJourneyOpen(false);
    setIsGalleryOpen(false);
    setIsMenuOpen(false);
    updateBrowserUrl({
      topicId: null,
      view: 'hero',
      lang: language,
    });
  };

  const handleOpenJourney = () => {
    setIsJourneyOpen(true);
    updateBrowserUrl({
      view: 'journey',
      lang: language,
    });
  };

  const handleCloseJourney = () => {
    setIsJourneyOpen(false);
    updateBrowserUrl({
      view: isHeroOpen ? 'hero' : 'map',
      lang: language,
    });
  };

  const handleOpenGallery = () => {
    setIsGalleryOpen(true);
    updateBrowserUrl({
      view: 'gallery',
      lang: language,
    });
  };

  const handleCloseGallery = () => {
    setIsGalleryOpen(false);
    updateBrowserUrl({
      view: isHeroOpen ? 'hero' : 'map',
      lang: language,
    });
  };

  const handleOpenMenu = () => {
    setIsMenuOpen(true);
    updateBrowserUrl({
      view: 'menu',
      lang: language,
    });
  };

  const handleCloseMenu = () => {
    setIsMenuOpen(false);
    updateBrowserUrl({
      view: isHeroOpen ? 'hero' : 'map',
      lang: language,
    });
  };

  // Detail Modal Navigation with URL sync
  const handleModalNavigate = (direction: 'next' | 'prev') => {
    if (!detailFact || facts.length === 0) return;
    const currentIndex = facts.findIndex((f) => f.id === detailFact.id);
    const targetIndex =
      direction === 'next'
        ? (currentIndex + 1) % facts.length
        : (currentIndex - 1 + facts.length) % facts.length;
    const targetFact = facts[targetIndex];
    setDetailFact(targetFact);
    setSelectedFact(targetFact);
    updateBrowserUrl({
      topicId: targetFact.id,
      factName: targetFact.name,
      lang: language,
      replace: false,
    });
  };

  // Admin Pin Success
  const handleAdminSuccess = () => {
    setIsAdmin(true);
    setAdminState(true);
    setIsAdminPinModalOpen(false);
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setAdminState(false);
  };

  const [factEditorMode, setFactEditorMode] = useState<'photo_only' | 'standard'>('photo_only');

  // Add / Edit Fact (Immediately opens form!)
  const handleOpenAddFact = (mode: 'photo_only' | 'standard' = 'photo_only') => {
    setFactToEdit(null);
    setPickedCoords(null);
    setIsMenuOpen(false);
    setIsPickingLocation(false);
    setFactEditorMode(mode);
    setIsFactEditorOpen(true);
  };

  const handleOpenEditFact = (fact: FactItem) => {
    setFactToEdit(fact);
    setPickedCoords({ lat: fact.lat, lng: fact.lng });
    setIsFactEditorOpen(true);
  };

  const handleSaveFact = (
    savedFact: FactItem,
    options?: { isEdit?: boolean; skipCrossLangPrompt?: boolean }
  ) => {
    const exists = facts.some((f) => f.id === savedFact.id);
    const updatedList = exists
      ? facts.map((f) => (f.id === savedFact.id ? savedFact : f))
      : [savedFact, ...facts];

    setFacts(updatedList);
    setSelectedFact(savedFact);
    if (detailFact && detailFact.id === savedFact.id) {
      setDetailFact(savedFact);
    }
    setPickedCoords(null);

    // Persist text/topic data to Firestore cloud (URLs only, zero binary uploads)
    saveFactToCloud(savedFact, language).catch((err) => {
      console.error('Failed to sync fact to cloud:', err);
    });

    if (isAdmin && (options?.isEdit ?? exists) && !options?.skipCrossLangPrompt) {
      setCrossLangSyncTarget({ fact: savedFact, sourceLang: language });
    }
  };

  const handleDeleteFact = (factId: number) => {
    const updatedList = facts.filter((f) => f.id !== factId);
    setFacts(updatedList);

    if (selectedFact?.id === factId) {
      setSelectedFact(updatedList.length > 0 ? updatedList[0] : null);
    }
    if (detailFact?.id === factId) {
      setDetailFact(null);
    }

    // Persist delete to Firestore cloud
    deleteFactFromCloud(factId, language).catch((err) => {
      console.error('Failed to delete fact from cloud:', err);
    });
  };

  // Save additional notes inline
  const handleSaveNotes = (factId: number, notes: string) => {
    const targetFact = facts.find((f) => f.id === factId);
    const updatedFact = targetFact ? { ...targetFact, additionalNotes: notes } : null;
    const updatedList = facts.map((f) => {
      if (f.id === factId) {
        return { ...f, additionalNotes: notes };
      }
      return f;
    });

    setFacts(updatedList);

    if (selectedFact && selectedFact.id === factId) {
      setSelectedFact({ ...selectedFact, additionalNotes: notes });
    }
    if (detailFact && detailFact.id === factId) {
      setDetailFact({ ...detailFact, additionalNotes: notes });
    }

    // Persist to Firestore cloud
    saveNotesToCloud(factId, notes, targetFact, language).catch((err) => {
      console.error('Failed to save notes to cloud:', err);
    });

    if (isAdmin && updatedFact) {
      setCrossLangSyncTarget({ fact: updatedFact, sourceLang: language });
    }
  };

  // Save relations / topic linking (Strictly Admin only)
  const handleSaveLinks = async (
    sourceFactId: number,
    targetFactIds: number[],
    parentFactId?: number,
    allyFactIds?: number[]
  ) => {
    if (!isAdmin) {
      console.warn('Unauthorized: Only Admin can link or modify topic relationships.');
      return;
    }

    const existingFact = facts.find((f) => f.id === sourceFactId);
    const updatedFact: FactItem | null = existingFact
      ? {
          ...existingFact,
          relatedFactIds: targetFactIds,
          parentFactId: typeof parentFactId === 'number' ? parentFactId : existingFact.parentFactId,
          allyFactIds: Array.isArray(allyFactIds) ? allyFactIds : existingFact.allyFactIds,
        }
      : null;

    // 1. Optimistic local update
    setFacts((prev) =>
      prev.map((f) => {
        if (f.id === sourceFactId) {
          return {
            ...f,
            relatedFactIds: targetFactIds,
            parentFactId: typeof parentFactId === 'number' ? parentFactId : f.parentFactId,
            allyFactIds: Array.isArray(allyFactIds) ? allyFactIds : f.allyFactIds,
          };
        }
        return f;
      })
    );

    if (detailFact && detailFact.id === sourceFactId) {
      setDetailFact((prev) =>
        prev
          ? {
              ...prev,
              relatedFactIds: targetFactIds,
              parentFactId: typeof parentFactId === 'number' ? parentFactId : prev.parentFactId,
              allyFactIds: Array.isArray(allyFactIds) ? allyFactIds : prev.allyFactIds,
            }
          : null
      );
    }

    // 2. Cloud Firestore update
    await updateFactRelationsInCloud(sourceFactId, targetFactIds, parentFactId, allyFactIds, language).catch((err) => {
      console.error('Failed to sync fact relations to cloud:', err);
    });

    if (updatedFact) {
      setCrossLangSyncTarget({ fact: updatedFact, sourceLang: language });
    }
  };

  const handleConfirmCrossLangSync = async () => {
    if (!crossLangSyncTarget) return;
    const targetLang: AppLanguage = crossLangSyncTarget.sourceLang === 'ckb' ? 'en' : 'ckb';
    await translateFactToLanguageDetailed(crossLangSyncTarget.fact, targetLang);
    setCrossLangSyncTarget(null);
  };

  // Map Point Picking flow
  const handleStartPickLocation = () => {
    setIsFactEditorOpen(false);
    setIsMenuOpen(false);
    setIsPickingLocation(true);
  };

  const handlePickLocationOnMap = (lat: number, lng: number) => {
    setPickedCoords({ lat, lng });
    setIsPickingLocation(false);
    setIsFactEditorOpen(true);
  };

  const handleCancelPickLocation = () => {
    setIsPickingLocation(false);
    setIsFactEditorOpen(true);
  };

  // Collections handlers (Synced to Firestore cloud)
  const handleAddCollection = (newCol: CollectionItem) => {
    const updated = [...collections, newCol];
    setCollections(updated);
    saveCollectionToCloud(newCol, language).catch((err) => {
      console.error('Failed to save collection to cloud:', err);
    });
  };

  const handleUpdateCollection = (updatedCol: CollectionItem) => {
    const updated = collections.map((c) =>
      c.id === updatedCol.id ? updatedCol : c
    );
    setCollections(updated);
    saveCollectionToCloud(updatedCol, language).catch((err) => {
      console.error('Failed to update collection in cloud:', err);
    });
  };

  const handleDeleteCollection = (colId: string) => {
    const updated = collections.filter((c) => c.id !== colId);
    setCollections(updated);
    if (selectedCategory === colId) {
      setSelectedCategory('all');
    }
    deleteCollectionFromCloud(colId, language).catch((err) => {
      console.error('Failed to delete collection from cloud:', err);
    });
  };

  const pendingSubmissionsCount = photoSubmissions.filter((s) => s.status === 'pending').length;

  return (
    <div
      className={`h-full h-[100dvh] w-full overflow-hidden flex flex-col font-sans selection:bg-amber-500 selection:text-black text-xs ${
        colorMode === 'light' ? 'bg-[#f7f6f2] text-slate-900' : 'bg-[#05070e] text-slate-100'
      }`}
    >
      {/* Main Screen: Leaflet CartoDB Dark Matter */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {/* Full Viewport Interactive Kurdish Clean Dark Map */}
        <KurdishDarkLeafletMap
          facts={facts}
          selectedFact={selectedFact}
          onSelectFact={handleSelectFact}
          onDeselectFact={() => setSelectedFact(null)}
          onOpenDetail={handleOpenDetail}
          showAllMarkers={showAllMarkers}
          setShowAllMarkers={setShowAllMarkers}
          showPolygon={showPolygon}
          setShowPolygon={setShowPolygon}
          onOpenHero={handleReturnToHero}
          onOpenSettings={() => setIsSettingsOpen(true)}
          mapMode={mapMode}
          setMapMode={setMapMode}
          markerViewMode={markerViewMode}
          setMarkerViewMode={setMarkerViewMode}
          showBottomPhotoStrip={showBottomPhotoStrip}
          setShowBottomPhotoStrip={setShowBottomPhotoStrip}
          onOpenMenu={handleOpenMenu}
          onOpenGallery={handleOpenGallery}
          onOpenTheme={() => {
            setIsThemeModalOpen(true);
          }}
          activeTagFilter={selectedCategory}
          setActiveTagFilter={setSelectedCategory}
          selectedProvince={selectedProvince}
          onSelectProvince={handleProvinceChange}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          isAdmin={isAdmin}
          onTriggerAdminPin={() => {
            setIsAdminPinModalOpen(true);
          }}
          onOpenAddFact={handleOpenAddFact}
          onOpenSubmittedPhotos={() => setIsSubmittedPhotosOpen(true)}
          pendingSubmissionsCount={pendingSubmissionsCount}
          onLogoutAdmin={handleAdminLogout}
          isPickingLocation={isPickingLocation}
          onPickLocation={handlePickLocationOnMap}
          onCancelPickLocation={handleCancelPickLocation}
          pickedCoords={pickedCoords}
          onReplayIntro={() => setShowIntro(true)}
          playMapIntro={showIntro}
          onMapIntroComplete={() => setShowIntro(false)}
          onOpenDocumentaryTour={() => {
            setIsDocumentaryTourOpen(true);
          }}
          externalFlyTo={externalFlyTo}
        />

        {/* Fullscreen View for پێڕست with 2026 Spatial Page Transition */}
        {isMenuOpen && (
          <div
            className={`fixed inset-0 z-50 flex flex-col overflow-hidden animate-page-enter ${
              colorMode === 'light' ? 'bg-[#f7f6f2] text-slate-900' : 'bg-[#030611] text-slate-100'
            }`}
          >
            <FactsList
              facts={facts}
              selectedFact={selectedFact}
              onSelectFact={(fact) => {
                handleEnterMap();
                handleSelectFact(fact);
                setIsMenuOpen(false);
              }}
              onOpenDetail={handleOpenDetail}
              collections={collections}
              selectedCollectionId={selectedCategory}
              onSelectCollection={setSelectedCategory}
              activeCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              selectedProvince={selectedProvince}
              onSelectProvince={handleProvinceChange}
              isAdmin={isAdmin}
              onOpenAddFact={handleOpenAddFact}
              onOpenSubmittedPhotos={() => setIsSubmittedPhotosOpen(true)}
              pendingSubmissionsCount={pendingSubmissionsCount}
              onOpenEditFact={handleOpenEditFact}
              onOpenCollectionManager={() => setIsCollectionManagerOpen(true)}
              onOpenGallery={handleOpenGallery}
              onOpenTheme={() => setIsThemeModalOpen(true)}
              onClose={handleCloseMenu}
              onLogoutAdmin={handleAdminLogout}
            />
          </div>
        )}
      </main>

      {/* Lazy loaded modals suspended seamlessly without blocking initial page render */}
      <React.Suspense fallback={null}>
        {/* Documentary Scrollytelling Modal (گەشت بەناو ڕووداوە گەورەکاندا) */}
        <DocumentaryScrollytellingModal
        isOpen={isDocumentaryTourOpen}
        onClose={() => setIsDocumentaryTourOpen(false)}
        onFlyToCoords={handleDocumentaryFlyTo}
        facts={facts}
        onOpenFactDetail={(fact: FactItem) => {
          setIsDocumentaryTourOpen(false);
          handleOpenDetail(fact);
        }}
      />

      {/* Fact Detail Modal (With Related Topics & Documents) */}
      <FactDetailModal
        fact={detailFact}
        onClose={handleCloseDetail}
        onNavigate={handleModalNavigate}
        onFlyToMap={(fact: FactItem) => handleSelectFact(fact)}
        isAdmin={isAdmin}
        onEditFact={(fact: FactItem) => {
          handleCloseDetail();
          handleOpenEditFact(fact);
        }}
        onSaveNotes={handleSaveNotes}
        onOpenGallery={handleOpenGallery}
        totalFactsCount={facts.length}
        allFacts={facts}
        onSelectFact={(fact: FactItem) => {
          handleOpenDetail(fact);
        }}
        onSaveLinks={handleSaveLinks}
      />

      {/* Kurdish Historical Gallery Modal with 6-second auto slideshow */}
      <HistoricalGalleryModal
        isOpen={isGalleryOpen}
        onClose={handleCloseGallery}
        facts={facts}
        onFlyToFact={(fact: FactItem) => {
          handleSelectFact(fact);
          handleCloseGallery();
        }}
      />

      {/* Admin Secret PIN Verification Modal */}
      <AdminPinModal
        isOpen={isAdminPinModalOpen}
        onClose={() => setIsAdminPinModalOpen(false)}
        onSuccess={handleAdminSuccess}
      />

      {/* Fact Editor Modal (Add/Edit Fact, Relations Linking, Coordinates, Notes) */}
      <FactEditorModal
        isOpen={isFactEditorOpen}
        onClose={() => setIsFactEditorOpen(false)}
        factToEdit={factToEdit}
        initialMode={factEditorMode}
        collections={collections}
        allFacts={facts}
        onSave={handleSaveFact}
        onDelete={handleDeleteFact}
        onStartPickLocation={handleStartPickLocation}
        pickedCoords={pickedCoords}
        totalFactsCount={facts.length}
      />

      {/* Collection Manager Modal (Manage collections for Menu) */}
      <CollectionManagerModal
        isOpen={isCollectionManagerOpen}
        onClose={() => setIsCollectionManagerOpen(false)}
        collections={collections}
        onAddCollection={handleAddCollection}
        onUpdateCollection={handleUpdateCollection}
        onDeleteCollection={handleDeleteCollection}
      />

      {/* App Theme & Color Customizer Modal (بەشی ڕووکار) */}
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />

      {/* App Settings Modal (ڕێکخستنەکان - former زیاتر) */}
      <AppSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        mapMode={mapMode}
        setMapMode={setMapMode}
        markerViewMode={markerViewMode}
        setMarkerViewMode={setMarkerViewMode}
        showBottomPhotoStrip={showBottomPhotoStrip}
        setShowBottomPhotoStrip={setShowBottomPhotoStrip}
        showAllMarkers={showAllMarkers}
        setShowAllMarkers={setShowAllMarkers}
        showPolygon={showPolygon}
        setShowPolygon={setShowPolygon}
        onReplayIntro={() => {
          setIsSettingsOpen(false);
          setIsHeroOpen(false);
          setShowIntro(true);
        }}
        onOpenDocumentaryTour={() => {
          setIsSettingsOpen(false);
          setIsHeroOpen(false);
          setIsDocumentaryTourOpen(true);
        }}
        onOpenGallery={() => {
          setIsSettingsOpen(false);
          setIsGalleryOpen(true);
        }}
        onOpenTheme={() => {
          setIsSettingsOpen(false);
          setIsThemeModalOpen(true);
        }}
        isAdmin={isAdmin}
        onTriggerAdminPin={() => {
          setIsSettingsOpen(false);
          setIsAdminPinModalOpen(true);
        }}
        onLogoutAdmin={handleAdminLogout}
        onOpenAddFact={handleOpenAddFact}
        onOpenSubmittedPhotos={() => {
          setIsSettingsOpen(false);
          setIsSubmittedPhotosOpen(true);
        }}
        pendingSubmissionsCount={pendingSubmissionsCount}
        factsCount={facts.length}
      />

      {/* Iconic Entrance Hero Section (مەدخەل و سێکشنی سەرەکی) */}
      {isHeroOpen && (
        <HeroSection
          facts={facts}
          onEnterMap={handleEnterMap}
          onOpenJourney={handleOpenJourney}
          onOpenMenu={handleOpenMenu}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenGallery={handleOpenGallery}
        />
      )}

      {/* Historical Journey 3-Fact Poster Modal (گەشتی مێژوویی - لاپەڕەی کتێب) */}
      <HistoricalJourneyModal
        isOpen={isJourneyOpen}
        onClose={handleCloseJourney}
        facts={facts}
        onOpenDetail={(fact: FactItem) => {
          setIsJourneyOpen(false);
          handleOpenDetail(fact);
        }}
        onFlyToFact={(fact: FactItem) => {
          setIsJourneyOpen(false);
          handleEnterMap();
          handleSelectFact(fact);
        }}
      />

      {/* Admin Submitted Photos Moderation Modal (وێنە نێردراوەکان) */}
      {isAdmin && isSubmittedPhotosOpen && (
        <SubmittedPhotosModal
          isOpen={isSubmittedPhotosOpen}
          onClose={() => setIsSubmittedPhotosOpen(false)}
          submissions={photoSubmissions}
          allFacts={facts}
          onFactUpdated={(updatedFact: FactItem) => {
            setFacts((prev) => prev.map((f) => (f.id === updatedFact.id ? updatedFact : f)));
            if (selectedFact?.id === updatedFact.id) setSelectedFact(updatedFact);
            if (detailFact?.id === updatedFact.id) setDetailFact(updatedFact);
          }}
          onSelectFact={(fact: FactItem) => {
            handleSelectFact(fact);
            handleOpenDetail(fact);
          }}
        />
      )}

      {/* Cross-Language Edit Sync Confirmation Modal */}
      {crossLangSyncTarget && (
        <CrossLangSyncModal
          isOpen={Boolean(crossLangSyncTarget)}
          fact={crossLangSyncTarget.fact}
          sourceLang={crossLangSyncTarget.sourceLang}
          onConfirmYes={handleConfirmCrossLangSync}
          onDeclineNo={() => setCrossLangSyncTarget(null)}
        />
      )}
    </React.Suspense>
  </div>
);
}
