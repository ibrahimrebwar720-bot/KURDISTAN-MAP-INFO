import React, { useState, useEffect } from 'react';
import { ALL_FACTS, FactItem } from './data/kurdishHistoryData';
import { KurdishDarkLeafletMap } from './components/KurdishDarkLeafletMap';
import { FactsList } from './components/FactsList';
import { FactDetailModal } from './components/FactDetailModal';
import { FeaturedFactCard } from './components/FeaturedFactCard';
import { X, Layers } from 'lucide-react';

export default function App() {
  const [selectedFact, setSelectedFact] = useState<FactItem | null>(ALL_FACTS[0]);
  const [detailFact, setDetailFact] = useState<FactItem | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [showAllMarkers, setShowAllMarkers] = useState(true);
  const [showPolygon, setShowPolygon] = useState(true);
  const [activeTagFilter, setActiveTagFilter] = useState('all');

  // Keyboard navigation & escape to close menu/modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (detailFact) {
          setDetailFact(null);
        } else if (isMenuOpen) {
          setIsMenuOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [detailFact, isMenuOpen]);

  // Fact Selection
  const handleSelectFact = (fact: FactItem) => {
    setSelectedFact(fact);
  };

  // Next / Prev Fact navigation
  const handleNextFact = () => {
    const currentIdx = ALL_FACTS.findIndex((f) => f.id === selectedFact?.id);
    const nextIdx = (currentIdx + 1) % ALL_FACTS.length;
    setSelectedFact(ALL_FACTS[nextIdx]);
  };

  const handlePrevFact = () => {
    const currentIdx = ALL_FACTS.findIndex((f) => f.id === selectedFact?.id);
    const prevIdx = (currentIdx - 1 + ALL_FACTS.length) % ALL_FACTS.length;
    setSelectedFact(ALL_FACTS[prevIdx]);
  };

  // Detail Modal Navigation
  const handleModalNavigate = (direction: 'next' | 'prev') => {
    if (!detailFact) return;
    const currentIndex = ALL_FACTS.findIndex((f) => f.id === detailFact.id);
    if (direction === 'next') {
      const nextIndex = (currentIndex + 1) % ALL_FACTS.length;
      setDetailFact(ALL_FACTS[nextIndex]);
      setSelectedFact(ALL_FACTS[nextIndex]);
    } else {
      const prevIndex = (currentIndex - 1 + ALL_FACTS.length) % ALL_FACTS.length;
      setDetailFact(ALL_FACTS[prevIndex]);
      setSelectedFact(ALL_FACTS[prevIndex]);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#090b0e] text-slate-100 flex flex-col font-sans selection:bg-red-500 selection:text-white text-xs">
      {/* Main Screen: 100% PURE IMMERSIVE CLEAN DARK MAP (Leaflet CartoDB Dark Matter No-Labels) */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {/* Full Viewport Interactive Kurdish Clean Dark Map */}
        <KurdishDarkLeafletMap
          facts={ALL_FACTS}
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
        />

        {/* Slide-Over Menu Drawer: ناوی دەسەڵاتەکان و زانیارییەکان */}
        {isMenuOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Drawer Content: Ultra-Modern Black & Indigo UI */}
            <aside className="relative w-full sm:w-[390px] md:w-[440px] h-full bg-black border-r sm:border-r-0 sm:border-l border-indigo-950 shadow-[0_0_50px_rgba(15,10,40,0.8)] flex flex-col z-10 animate-slide-left text-right">
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
                      ٣٥٠ دەسەڵات، میرنشین و وێستگەی مێژوویی کوردستان
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1 rounded-md text-indigo-400 hover:text-white hover:bg-indigo-950/60 transition-colors"
                  title="داخستنی مینۆ"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Selected Fact Summary inside Drawer */}
              {selectedFact && (
                <div className="p-2 border-b border-indigo-950 bg-black shrink-0">
                  <FeaturedFactCard
                    fact={selectedFact}
                    currentIndex={ALL_FACTS.findIndex((f) => f.id === selectedFact.id)}
                    totalFacts={ALL_FACTS.length}
                    onOpenDetail={(fact) => setDetailFact(fact)}
                    onNext={handleNextFact}
                    onPrev={handlePrevFact}
                  />
                </div>
              )}

              {/* Searchable 350 Facts List inside Drawer */}
              <div className="flex-1 overflow-hidden p-2 bg-black">
                <FactsList
                  facts={ALL_FACTS}
                  selectedFact={selectedFact}
                  onSelectFact={(fact) => {
                    handleSelectFact(fact);
                  }}
                  onOpenDetail={(fact) => setDetailFact(fact)}
                />
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* Fact Detail Modal (With Kurdish & English Wikipedia Fallback) */}
      <FactDetailModal
        fact={detailFact}
        onClose={() => setDetailFact(null)}
        onNavigate={handleModalNavigate}
        onFlyToMap={(fact) => handleSelectFact(fact)}
      />
    </div>
  );
}
