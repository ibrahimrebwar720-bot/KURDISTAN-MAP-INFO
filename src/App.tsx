import React, { useState, useEffect } from 'react';
import { FactItem } from './data/kurdishHistoryData';
import { CollectionItem } from './types/history';
import {
  loadStoredFacts,
  loadStoredCollections,
  getAdminState,
  setAdminState,
  saveSingleFact,
  deleteSingleFact,
  saveFactNotesLocally,
  updateFactRelationsLocally,
  saveSingleCollection,
  deleteSingleCollection,
} from './services/historyStorageService';
import { KurdishDarkLeafletMap } from './components/KurdishDarkLeafletMap';
import { FactsList } from './components/FactsList';
import { FactDetailModal } from './components/FactDetailModal';
import { AdminPinModal } from './components/AdminPinModal';
import { FactEditorModal } from './components/FactEditorModal';
import { CollectionManagerModal } from './components/CollectionManagerModal';
import { HistoricalGalleryModal } from './components/HistoricalGalleryModal';
import { ThemeSelectorModal } from './components/ThemeSelectorModal';
import { DocumentaryScrollytellingModal } from './components/DocumentaryScrollytellingModal';

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

  // Split View & Mobile Bottom Sheet states for Menu
  const [isSplitMode, setIsSplitMode] = useState<boolean>(true);
  const [mobileSheetState, setMobileSheetState] = useState<'peek' | 'half' | 'full'>('half');

  // Documentary Tour state & Map FlyTo bridge
  const [isDocumentaryTourOpen, setIsDocumentaryTourOpen] = useState(false);
  const [externalFlyTo, setExternalFlyTo] = useState<{
    lat: number;
    lng: number;
    zoom?: number;
    id?: string;
  } | null>(null);

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
    const updatedList = saveSingleFact(savedFact);
    setFacts(updatedList);
    setSelectedFact(savedFact);
    if (detailFact && detailFact.id === savedFact.id) {
      setDetailFact(savedFact);
    }
    setPickedCoords(null);
  };

  const handleDeleteFact = (factId: number) => {
    const updatedList = deleteSingleFact(factId);
    setFacts(updatedList);

    if (selectedFact?.id === factId) {
      setSelectedFact(updatedList.length > 0 ? updatedList[0] : null);
    }
    if (detailFact?.id === factId) {
      setDetailFact(null);
    }
  };

  // Save additional notes inline
  const handleSaveNotes = (factId: number, notes: string) => {
    const updatedList = saveFactNotesLocally(factId, notes);
    setFacts(updatedList);

    if (selectedFact && selectedFact.id === factId) {
      setSelectedFact({ ...selectedFact, additionalNotes: notes });
    }
    if (detailFact && detailFact.id === factId) {
      setDetailFact({ ...detailFact, additionalNotes: notes });
    }
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

    const updatedList = updateFactRelationsLocally(sourceFactId, targetFactIds, parentFactId);
    setFacts(updatedList);

    if (detailFact && detailFact.id === sourceFactId) {
      const found = updatedList.find((f) => f.id === sourceFactId);
      setDetailFact(found || null);
    }
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

  // Collections handlers (Local storage)
  const handleAddCollection = (newCol: CollectionItem) => {
    const updated = saveSingleCollection(newCol);
    setCollections(updated);
  };

  const handleUpdateCollection = (updatedCol: CollectionItem) => {
    const updated = saveSingleCollection(updatedCol);
    setCollections(updated);
  };

  const handleDeleteCollection = (colId: string) => {
    const updated = deleteSingleCollection(colId);
    setCollections(updated);
    if (selectedCategory === colId) {
      setSelectedCategory('all');
    }
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
          onOpenDocumentaryTour={() => setIsDocumentaryTourOpen(true)}
          externalFlyTo={externalFlyTo}
        />

        {/* Split Screen / Fullscreen / Mobile Bottom Sheet for پێڕست */}
        {isMenuOpen && (
          <>
            {/* Desktop / Tablet: Split Screen Side Panel OR Fullscreen View */}
            <div
              className={`hidden sm:flex flex-col bg-[#070913]/95 backdrop-blur-3xl overflow-hidden transition-all duration-300 z-40 ${
                isSplitMode
                  ? 'fixed top-0 bottom-0 right-0 w-full sm:w-[480px] md:w-[540px] lg:w-[620px] xl:w-[680px] border-l border-white/10 shadow-[-25px_0_60px_rgba(0,0,0,0.95)] animate-slide-in-right'
                  : 'fixed inset-0 z-50 bg-[#070913]/98 animate-fade-in'
              }`}
            >
              <FactsList
                facts={facts}
                selectedFact={selectedFact}
                onSelectFact={(fact) => {
                  handleSelectFact(fact);
                  if (!isSplitMode) {
                    setIsMenuOpen(false);
                  }
                }}
                onHoverFact={(fact) => {
                  if (isSplitMode) {
                    handleSelectFact(fact);
                  }
                }}
                isSplitMode={isSplitMode}
                onToggleSplitMode={() => setIsSplitMode(!isSplitMode)}
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

            {/* Mobile Responsive Interactive Bottom Sheet (دەستکاری بە یەک پەنجە: Peek 38%, Half 65%, Full 94%) */}
            <div
              className={`sm:hidden fixed bottom-0 left-0 right-0 z-40 rounded-t-3xl border-t border-amber-400/30 bg-[#070913]/96 backdrop-blur-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.95)] transition-all duration-300 flex flex-col overflow-hidden ${
                mobileSheetState === 'peek'
                  ? 'h-[38dvh]'
                  : mobileSheetState === 'half'
                  ? 'h-[65dvh]'
                  : 'h-[94dvh]'
              }`}
            >
              <FactsList
                facts={facts}
                selectedFact={selectedFact}
                onSelectFact={(fact) => {
                  handleSelectFact(fact);
                  setMobileSheetState('peek');
                }}
                isSplitMode={true}
                mobileSheetState={mobileSheetState}
                onToggleMobileSheet={(st) => setMobileSheetState(st)}
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
          </>
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
          setDetailFact(fact);
        }}
      />

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
