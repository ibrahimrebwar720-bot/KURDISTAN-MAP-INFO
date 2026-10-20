import React, { useState, useEffect } from 'react';
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

export default function App() {
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const [facts, setFacts] = useState<FactItem[]>(() => loadStoredFacts());
  const [collections, setCollections] = useState<CollectionItem[]>(() =>
    loadStoredCollections()
  );
  const [isAdmin, setIsAdmin] = useState<boolean>(() => getAdminState());

  const [selectedFact, setSelectedFact] = useState<FactItem | null>(null);
  const [detailFact, setDetailFact] = useState<FactItem | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [showAllMarkers, setShowAllMarkers] = useState(true);
  const [showPolygon, setShowPolygon] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');

  // Admin Modals state
  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState(false);
  const [isFactEditorOpen, setIsFactEditorOpen] = useState(false);
  const [factToEdit, setFactToEdit] = useState<FactItem | null>(null);
  const [isCollectionManagerOpen, setIsCollectionManagerOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
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
      // Keep detail fact synced
      setDetailFact((prev) => {
        if (!prev) return null;
        const found = cloudFacts.find((f) => f.id === prev.id);
        return found || null;
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

  // Keyboard navigation & escape to close menu/modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPickingLocation) {
          setIsPickingLocation(false);
          setIsFactEditorOpen(true);
        } else if (isAdminPinModalOpen) {
          setIsAdminPinModalOpen(false);
        } else if (isFactEditorOpen) {
          setIsFactEditorOpen(false);
        } else if (isCollectionManagerOpen) {
          setIsCollectionManagerOpen(false);
        } else if (isGalleryOpen) {
          setIsGalleryOpen(false);
        } else if (detailFact) {
          setDetailFact(null);
        } else if (isMenuOpen) {
          setIsMenuOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    detailFact,
    isMenuOpen,
    isAdminPinModalOpen,
    isFactEditorOpen,
    isCollectionManagerOpen,
    isGalleryOpen,
    isPickingLocation,
  ]);

  // Fact Selection
  const handleSelectFact = (fact: FactItem) => {
    setSelectedFact(fact);
  };

  // Detail Modal Navigation
  const handleModalNavigate = (direction: 'next' | 'prev') => {
    if (!detailFact || facts.length === 0) return;
    const currentIndex = facts.findIndex((f) => f.id === detailFact.id);
    if (direction === 'next') {
      const nextIndex = (currentIndex + 1) % facts.length;
      setDetailFact(facts[nextIndex]);
      setSelectedFact(facts[nextIndex]);
    } else {
      const prevIndex = (currentIndex - 1 + facts.length) % facts.length;
      setDetailFact(facts[prevIndex]);
      setSelectedFact(facts[prevIndex]);
    }
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

  // Add / Edit Fact (Immediately opens form!)
  const handleOpenAddFact = () => {
    setFactToEdit(null);
    setPickedCoords(null);
    setIsMenuOpen(false);
    setIsPickingLocation(false);
    setIsFactEditorOpen(true);
  };

  const handleOpenEditFact = (fact: FactItem) => {
    setFactToEdit(fact);
    setPickedCoords({ lat: fact.lat, lng: fact.lng });
    setIsFactEditorOpen(true);
  };

  const handleSaveFact = (savedFact: FactItem) => {
    // 1. Instant local optimistic update
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

    // 2. Persist to Firebase Cloud for ALL users
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

    // Persist delete to Firebase Cloud
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

    // Persist to Firebase Cloud
    saveNotesToCloud(factId, notes, targetFact).catch((err) => {
      console.error('Failed to save notes to cloud:', err);
    });
  };

  // Save relations / topic linking
  const handleSaveLinks = async (
    sourceFactId: number,
    targetFactIds: number[],
    parentFactId?: number
  ) => {
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

  // Collections handlers (Synced to Firebase Cloud)
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
    <div className="h-full h-[100dvh] w-full overflow-hidden bg-[#05070e] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black text-xs">
      {/* Main Screen: Leaflet CartoDB Dark Matter */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {/* Full Viewport Interactive Kurdish Clean Dark Map */}
        <KurdishDarkLeafletMap
          facts={facts}
          selectedFact={selectedFact}
          onSelectFact={handleSelectFact}
          onOpenDetail={(fact) => setDetailFact(fact)}
          showAllMarkers={showAllMarkers}
          setShowAllMarkers={setShowAllMarkers}
          showPolygon={showPolygon}
          setShowPolygon={setShowPolygon}
          onOpenMenu={() => setIsMenuOpen(true)}
          onOpenGallery={() => setIsGalleryOpen(true)}
          onOpenTheme={() => setIsThemeModalOpen(true)}
          activeTagFilter={selectedCategory}
          setActiveTagFilter={setSelectedCategory}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          isAdmin={isAdmin}
          onTriggerAdminPin={() => setIsAdminPinModalOpen(true)}
          onOpenAddFact={handleOpenAddFact}
          onLogoutAdmin={handleAdminLogout}
          isPickingLocation={isPickingLocation}
          onPickLocation={handlePickLocationOnMap}
          onCancelPickLocation={handleCancelPickLocation}
          pickedCoords={pickedCoords}
          onReplayIntro={() => setShowIntro(true)}
          playMapIntro={showIntro}
          onMapIntroComplete={() => setShowIntro(false)}
        />

        {/* Full-Screen Grid Dashboard for پێڕست (وەک دیزاینی وێنەکە بە شێوازی Grid) */}
        {isMenuOpen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-[#070913]/98 backdrop-blur-2xl animate-fade-in overflow-hidden">
            <FactsList
              facts={facts}
              selectedFact={selectedFact}
              onSelectFact={(fact) => {
                handleSelectFact(fact);
                setIsMenuOpen(false);
              }}
              onOpenDetail={(fact) => setDetailFact(fact)}
              collections={collections}
              selectedCollectionId={selectedCategory}
              onSelectCollection={setSelectedCategory}
              activeCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              isAdmin={isAdmin}
              onOpenAddFact={handleOpenAddFact}
              onOpenEditFact={handleOpenEditFact}
              onOpenCollectionManager={() => setIsCollectionManagerOpen(true)}
              onOpenGallery={() => setIsGalleryOpen(true)}
              onOpenTheme={() => setIsThemeModalOpen(true)}
              onClose={() => setIsMenuOpen(false)}
              onLogoutAdmin={handleAdminLogout}
            />
          </div>
        )}
      </main>

      {/* Fact Detail Modal (With Related Topics & Documents) */}
      <FactDetailModal
        fact={detailFact}
        onClose={() => setDetailFact(null)}
        onNavigate={handleModalNavigate}
        onFlyToMap={(fact) => handleSelectFact(fact)}
        isAdmin={isAdmin}
        onEditFact={(fact) => {
          setDetailFact(null);
          handleOpenEditFact(fact);
        }}
        onSaveNotes={handleSaveNotes}
        onOpenGallery={() => setIsGalleryOpen(true)}
        totalFactsCount={facts.length}
        allFacts={facts}
        onSelectFact={(fact) => {
          setDetailFact(fact);
          handleSelectFact(fact);
        }}
        onSaveLinks={handleSaveLinks}
      />

      {/* Kurdish Historical Gallery Modal with 6-second auto slideshow */}
      <HistoricalGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        facts={facts}
        onFlyToFact={(fact) => {
          handleSelectFact(fact);
          setIsGalleryOpen(false);
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
    </div>
  );
}
