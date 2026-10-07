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
  subscribeToCloudCollections,
  saveCollectionToCloud,
  deleteCollectionFromCloud,
} from './services/firestoreHistoryService';
import { KurdishDarkLeafletMap } from './components/KurdishDarkLeafletMap';
import { FactsList } from './components/FactsList';
import { FactDetailModal } from './components/FactDetailModal';
import { FeaturedFactCard } from './components/FeaturedFactCard';
import { AdminPinModal } from './components/AdminPinModal';
import { FactEditorModal } from './components/FactEditorModal';
import { CollectionManagerModal } from './components/CollectionManagerModal';
import { X, Layers, LogOut } from 'lucide-react';

export default function App() {
  const [facts, setFacts] = useState<FactItem[]>(() => loadStoredFacts());
  const [collections, setCollections] = useState<CollectionItem[]>(() =>
    loadStoredCollections()
  );
  const [isAdmin, setIsAdmin] = useState<boolean>(() => getAdminState());

  const [selectedFact, setSelectedFact] = useState<FactItem | null>(() => {
    const loaded = loadStoredFacts();
    return loaded.length > 0 ? loaded[0] : null;
  });
  const [detailFact, setDetailFact] = useState<FactItem | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [showAllMarkers, setShowAllMarkers] = useState(true);
  const [showPolygon, setShowPolygon] = useState(true);
  const [activeTagFilter, setActiveTagFilter] = useState('all');
  const [selectedCollectionId, setSelectedCollectionId] = useState('all');

  // Admin Modals state
  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState(false);
  const [isFactEditorOpen, setIsFactEditorOpen] = useState(false);
  const [factToEdit, setFactToEdit] = useState<FactItem | null>(null);
  const [isCollectionManagerOpen, setIsCollectionManagerOpen] = useState(false);

  // Map Point Picking state
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [pickedCoords, setPickedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // 1. Real-time Firebase Cloud Database synchronization for all users worldwide
  useEffect(() => {
    const unsubFacts = subscribeToCloudFacts((cloudFacts) => {
      setFacts(cloudFacts);
      // Keep selected fact synced
      setSelectedFact((prev) => {
        if (!prev) return cloudFacts[0] || null;
        const found = cloudFacts.find((f) => f.id === prev.id);
        return found || prev;
      });
      // Keep detail fact synced
      setDetailFact((prev) => {
        if (!prev) return null;
        const found = cloudFacts.find((f) => f.id === prev.id);
        return found || prev;
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
    isPickingLocation,
  ]);

  // Fact Selection
  const handleSelectFact = (fact: FactItem) => {
    setSelectedFact(fact);
  };

  // Next / Prev Fact navigation
  const handleNextFact = () => {
    if (facts.length === 0) return;
    const currentIdx = facts.findIndex((f) => f.id === selectedFact?.id);
    const nextIdx = (currentIdx + 1) % facts.length;
    setSelectedFact(facts[nextIdx]);
  };

  const handlePrevFact = () => {
    if (facts.length === 0) return;
    const currentIdx = facts.findIndex((f) => f.id === selectedFact?.id);
    const prevIdx = (currentIdx - 1 + facts.length) % facts.length;
    setSelectedFact(facts[prevIdx]);
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

  // Add / Edit Fact (Directly pick on map!)
  const handleOpenAddFact = () => {
    setFactToEdit(null);
    setPickedCoords(null);
    setIsMenuOpen(false);
    setIsPickingLocation(true);
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
    if (selectedCollectionId === colId) {
      setSelectedCollectionId('all');
    }
    deleteCollectionFromCloud(colId).catch((err) => {
      console.error('Failed to delete collection from cloud:', err);
    });
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#090b0e] text-slate-100 flex flex-col font-sans selection:bg-red-500 selection:text-white text-xs">
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
          activeTagFilter={activeTagFilter}
          setActiveTagFilter={setActiveTagFilter}
          isAdmin={isAdmin}
          onTriggerAdminPin={() => setIsAdminPinModalOpen(true)}
          onOpenAddFact={handleOpenAddFact}
          onLogoutAdmin={handleAdminLogout}
          isPickingLocation={isPickingLocation}
          onPickLocation={handlePickLocationOnMap}
          onCancelPickLocation={handleCancelPickLocation}
          pickedCoords={pickedCoords}
        />

        {/* Slide-Over Menu Drawer */}
        {isMenuOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Drawer Content */}
            <aside className="relative w-full sm:w-[390px] md:w-[450px] h-full bg-black border-r sm:border-r-0 sm:border-l border-indigo-950 shadow-[0_0_50px_rgba(15,10,40,0.8)] flex flex-col z-10 animate-slide-left text-right">
              {/* Drawer Header with Hairline Indigo Divider */}
              <div className="px-3.5 py-3 border-b border-indigo-950 bg-black flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(79,70,229,0.25)]">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-white tracking-wide">
                      ناوی دەسەڵاتەکان و زانیارییەکان
                    </h2>
                    <span className="text-[9px] text-indigo-400/80 font-medium">
                      {facts.length} دەسەڵات، میرنشین و وێستگەی مێژوویی کوردستان
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {isAdmin ? (
                    <button
                      onClick={handleAdminLogout}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold text-red-300 bg-red-950/60 hover:bg-red-900/60 border border-red-800/60 transition-colors cursor-pointer"
                      title="دەرچوون لە بەشی ئەدمین"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>دەرچوون</span>
                    </button>
                  ) : null}

                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-1 rounded-md text-indigo-400 hover:text-white hover:bg-indigo-950/60 transition-colors cursor-pointer"
                    title="داخستنی مینۆ"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Selected Fact Summary inside Drawer */}
              {selectedFact && (
                <div className="p-2 border-b border-indigo-950 bg-black shrink-0">
                  <FeaturedFactCard
                    fact={selectedFact}
                    currentIndex={facts.findIndex((f) => f.id === selectedFact.id)}
                    totalFacts={facts.length}
                    onOpenDetail={(fact) => setDetailFact(fact)}
                    onNext={handleNextFact}
                    onPrev={handlePrevFact}
                    isAdmin={isAdmin}
                    onOpenEditFact={handleOpenEditFact}
                  />
                </div>
              )}

              {/* Searchable Facts List with Collections inside Drawer */}
              <div className="flex-1 overflow-hidden p-2 bg-black">
                <FactsList
                  facts={facts}
                  selectedFact={selectedFact}
                  onSelectFact={(fact) => {
                    handleSelectFact(fact);
                  }}
                  onOpenDetail={(fact) => setDetailFact(fact)}
                  collections={collections}
                  selectedCollectionId={selectedCollectionId}
                  onSelectCollection={setSelectedCollectionId}
                  isAdmin={isAdmin}
                  onOpenAddFact={handleOpenAddFact}
                  onOpenEditFact={handleOpenEditFact}
                  onOpenCollectionManager={() => setIsCollectionManagerOpen(true)}
                />
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* Fact Detail Modal (With Additional Notes Box in place of Gemini) */}
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
        totalFactsCount={facts.length}
      />

      {/* Admin Secret PIN Verification Modal */}
      <AdminPinModal
        isOpen={isAdminPinModalOpen}
        onClose={() => setIsAdminPinModalOpen(false)}
        onSuccess={handleAdminSuccess}
      />

      {/* Fact Editor Modal (Add/Edit Fact, Map Coordinates, Additional Notes) */}
      <FactEditorModal
        isOpen={isFactEditorOpen}
        onClose={() => setIsFactEditorOpen(false)}
        factToEdit={factToEdit}
        collections={collections}
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
    </div>
  );
}
