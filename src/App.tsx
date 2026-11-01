import React, { useState, useEffect, useRef } from 'react';
import { FactItem } from './data/kurdishHistoryData';
import { CollectionItem } from './types/history';
import {
  loadStoredFacts,
  loadStoredCollections,
  getAdminState,
  setAdminState,
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
} from './services/firestoreHistoryService';
import { KurdishDarkLeafletMap } from './components/KurdishDarkLeafletMap';
import { FactsList } from './components/FactsList';
import { FactDetailModal } from './components/FactDetailModal';
import { AdminPinModal } from './components/AdminPinModal';
import { FactEditorModal } from './components/FactEditorModal';
import { CollectionManagerModal } from './components/CollectionManagerModal';
import { HistoricalGalleryModal } from './components/HistoricalGalleryModal';
import { ThemeSelectorModal } from './components/ThemeSelectorModal';
import { DocumentaryScrollytellingModal } from './components/DocumentaryScrollytellingModal';
import { HeroSection } from './components/HeroSection';
import { HistoricalJourneyModal } from './components/HistoricalJourneyModal';
import { AppSettingsModal } from './components/AppSettingsModal';
import { useTheme } from './context/ThemeContext';
import {
  parseCurrentUrl,
  updateBrowserUrl,
  getShareableTopicUrl,
} from './utils/urlRouter';

export default function App() {
  const { colorMode } = useTheme();
  const [showIntro, setShowIntro] = useState<boolean>(false);

  // Initial URL parsing for deep-linking & direct article loading
  const initialUrlRef = useRef(parseCurrentUrl());
  const initialTopicFact = useRef<FactItem | null>(null);

  const [facts, setFacts] = useState<FactItem[]>(() => {
    const loaded = loadStoredFacts();
    if (initialUrlRef.current.topicId) {
      const match = loaded.find((f) => f.id === initialUrlRef.current.topicId);
      if (match) {
        initialTopicFact.current = match;
      }
    }
    return loaded;
  });

  const [collections, setCollections] = useState<CollectionItem[]>(() =>
    loadStoredCollections()
  );
  const [isAdmin, setIsAdmin] = useState<boolean>(() => getAdminState());

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
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');

  // Hero Section, Historical Journey & Settings Modal State
  // If URL has a direct topic or specific view, open directly into that view (classic website behavior!)
  const [isHeroOpen, setIsHeroOpen] = useState<boolean>(() => {
    if (initialUrlRef.current.topicId) return false;
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

  // 1. Real-time Firebase Cloud Database synchronization for all users worldwide
  useEffect(() => {
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
              replace: true,
            });
            return foundFromUrl;
          }
        }
        return null;
      });
    });

    const unsubCollections = subscribeToCloudCollections((cloudCols) => {
      setCollections(cloudCols);
    });

    return () => {
      unsubFacts();
      unsubCollections();
    };
  }, []);

  // 2. Initial mount effect: synchronize deep link, title and external flyTo
  useEffect(() => {
    if (initialTopicFact.current) {
      updateBrowserUrl({
        topicId: initialTopicFact.current.id,
        factName: initialTopicFact.current.name,
        view: 'map',
        replace: true,
      });
    } else if (initialUrlRef.current.view) {
      updateBrowserUrl({
        view: initialUrlRef.current.view,
        replace: true,
      });
    }
  }, []);

  // 3. Browser Back/Forward history navigation (Classic Website Navigation Support!)
  useEffect(() => {
    const handlePopState = () => {
      const urlState = parseCurrentUrl();
      if (urlState.topicId) {
        const found = facts.find((f) => f.id === urlState.topicId);
        if (found) {
          setDetailFact(found);
          setSelectedFact(found);
          setIsHeroOpen(false);
          setIsJourneyOpen(false);
          setIsGalleryOpen(false);
          setIsMenuOpen(false);
          document.title = `${found.name} | مێژووی کوردستان`;
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
      replace: false,
    });
  };

  const handleCloseDetail = () => {
    setDetailFact(null);
    updateBrowserUrl({
      topicId: null,
      view: isHeroOpen ? 'hero' : 'map',
      replace: false,
    });
  };

  const handleEnterMap = () => {
    setIsHeroOpen(false);
    updateBrowserUrl({
      topicId: detailFact?.id || null,
      view: 'map',
      factName: detailFact?.name,
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
    });
  };

  const handleOpenJourney = () => {
    setIsJourneyOpen(true);
    updateBrowserUrl({
      view: 'journey',
    });
  };

  const handleCloseJourney = () => {
    setIsJourneyOpen(false);
    updateBrowserUrl({
      view: isHeroOpen ? 'hero' : 'map',
    });
  };

  const handleOpenGallery = () => {
    setIsGalleryOpen(true);
    updateBrowserUrl({
      view: 'gallery',
    });
  };

  const handleCloseGallery = () => {
    setIsGalleryOpen(false);
    updateBrowserUrl({
      view: isHeroOpen ? 'hero' : 'map',
    });
  };

  const handleOpenMenu = () => {
    setIsHeroOpen(false);
    setIsMenuOpen(true);
    updateBrowserUrl({
      view: 'menu',
    });
  };

  const handleCloseMenu = () => {
    setIsMenuOpen(false);
    updateBrowserUrl({
      view: isHeroOpen ? 'hero' : 'map',
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

  const handleSaveFact = (savedFact: FactItem) => {
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
    saveFactToCloud(savedFact).catch((err) => {
      console.error('Failed to sync fact to cloud:', err);
    });
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
    deleteFactFromCloud(factId).catch((err) => {
      console.error('Failed to delete fact from cloud:', err);
    });
  };

  // Save additional notes inline
  const handleSaveNotes = (factId: number, notes: string) => {
    const targetFact = facts.find((f) => f.id === factId);
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
    saveNotesToCloud(factId, notes, targetFact).catch((err) => {
      console.error('Failed to save notes to cloud:', err);
    });
  };

  // Save relations / topic linking (Strictly Admin only)
  const handleSaveLinks = async (
    sourceFactId: number,
    targetFactIds: number[],
    parentFactId?: number
  ) => {
    if (!isAdmin) {
      console.warn('Unauthorized: Only Admin can link or modify topic relationships.');
      return;
    }

    // 1. Optimistic local update
    setFacts((prev) =>
      prev.map((f) => {
        if (f.id === sourceFactId) {
          return {
            ...f,
            relatedFactIds: targetFactIds,
            parentFactId: typeof parentFactId === 'number' ? parentFactId : f.parentFactId,
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
            }
          : null
      );
    }

    // 2. Cloud Firestore update
    await updateFactRelationsInCloud(sourceFactId, targetFactIds, parentFactId).catch((err) => {
      console.error('Failed to sync fact relations to cloud:', err);
    });
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
    saveCollectionToCloud(newCol).catch((err) => {
      console.error('Failed to save collection to cloud:', err);
    });
  };

  const handleUpdateCollection = (updatedCol: CollectionItem) => {
    const updated = collections.map((c) =>
      c.id === updatedCol.id ? updatedCol : c
    );
    setCollections(updated);
    saveCollectionToCloud(updatedCol).catch((err) => {
      console.error('Failed to update collection in cloud:', err);
    });
  };

  const handleDeleteCollection = (colId: string) => {
    const updated = collections.filter((c) => c.id !== colId);
    setCollections(updated);
    if (selectedCategory === colId) {
      setSelectedCategory('all');
    }
    deleteCollectionFromCloud(colId).catch((err) => {
      console.error('Failed to delete collection from cloud:', err);
    });
  };

  return (
    <div
      className={`h-full h-[100dvh] w-full overflow-hidden flex flex-col font-sans selection:bg-amber-500 selection:text-black text-xs transition-colors duration-300 ${
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
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          isAdmin={isAdmin}
          onTriggerAdminPin={() => {
            setIsAdminPinModalOpen(true);
          }}
          onOpenAddFact={handleOpenAddFact}
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
            className={`fixed inset-0 z-50 flex flex-col overflow-hidden animate-page-enter transition-colors duration-300 ${
              colorMode === 'light' ? 'bg-[#f7f6f2] text-slate-900' : 'bg-[#030611] text-slate-100'
            }`}
          >
            <FactsList
              facts={facts}
              selectedFact={selectedFact}
              onSelectFact={(fact) => {
                handleSelectFact(fact);
                setIsMenuOpen(false);
              }}
              onOpenDetail={handleOpenDetail}
              collections={collections}
              selectedCollectionId={selectedCategory}
              onSelectCollection={setSelectedCategory}
              activeCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              isAdmin={isAdmin}
              onOpenAddFact={handleOpenAddFact}
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

      {/* Documentary Scrollytelling Modal (گەشت بەناو ڕووداوە گەورەکاندا) */}
      <DocumentaryScrollytellingModal
        isOpen={isDocumentaryTourOpen}
        onClose={() => setIsDocumentaryTourOpen(false)}
        onFlyToCoords={handleDocumentaryFlyTo}
        facts={facts}
        onOpenFactDetail={(fact) => {
          setIsDocumentaryTourOpen(false);
          handleOpenDetail(fact);
        }}
      />

      {/* Fact Detail Modal (With Related Topics & Documents) */}
      <FactDetailModal
        fact={detailFact}
        onClose={handleCloseDetail}
        onNavigate={handleModalNavigate}
        onFlyToMap={(fact) => handleSelectFact(fact)}
        isAdmin={isAdmin}
        onEditFact={(fact) => {
          handleCloseDetail();
          handleOpenEditFact(fact);
        }}
        onSaveNotes={handleSaveNotes}
        onOpenGallery={handleOpenGallery}
        totalFactsCount={facts.length}
        allFacts={facts}
        onSelectFact={(fact) => {
          handleOpenDetail(fact);
        }}
        onSaveLinks={handleSaveLinks}
      />

      {/* Kurdish Historical Gallery Modal with 6-second auto slideshow */}
      <HistoricalGalleryModal
        isOpen={isGalleryOpen}
        onClose={handleCloseGallery}
        facts={facts}
        onFlyToFact={(fact) => {
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
        onOpenDetail={(fact) => {
          setIsJourneyOpen(false);
          handleOpenDetail(fact);
        }}
        onFlyToFact={(fact) => {
          setIsJourneyOpen(false);
          handleEnterMap();
          handleSelectFact(fact);
        }}
      />
    </div>
  );
}
