import React, { useState, useEffect, useRef } from 'react';
import { ALL_FACTS, FactItem } from './data/kurdishHistoryData';
import { KurdishGoogleMap } from './components/KurdishGoogleMap';
import { FactsList } from './components/FactsList';
import { Navbar } from './components/Navbar';
import { FactDetailModal } from './components/FactDetailModal';
import { FeaturedFactCard } from './components/FeaturedFactCard';

export default function App() {
  const [selectedFact, setSelectedFact] = useState<FactItem | null>(ALL_FACTS[0]);
  const [detailFact, setDetailFact] = useState<FactItem | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  const [showAllMarkers, setShowAllMarkers] = useState(true);
  const [showPolygon, setShowPolygon] = useState(true);

  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Listen to Google Maps quota exceeded event
  useEffect(() => {
    const handler = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handler);
    return () => window.removeEventListener('gmp-quota-exceeded', handler);
  }, []);

  // Fact Selection
  const handleSelectFact = (fact: FactItem) => {
    setSelectedFact(fact);
  };

  // Next / Prev Fact navigation for Featured Fact Card
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Demo Key Quota Exhaustion Banner */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              Google Maps Platform documentation
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-4 md:px-6 py-3 sm:py-4 flex flex-col gap-3">
        {/* Unified Integrated Container: Map and Facts List together in one place */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
          {/* Map & Featured Card Column */}
          <div
            ref={mapContainerRef}
            className="lg:col-span-7 xl:col-span-7 flex flex-col gap-3"
          >
            {/* The Map (Compact & balanced on mobile, expandable on demand) */}
            <KurdishGoogleMap
              facts={ALL_FACTS}
              selectedFact={selectedFact}
              onSelectFact={(fact) => {
                setSelectedFact(fact);
              }}
              onOpenDetail={(fact) => setDetailFact(fact)}
              showAllMarkers={showAllMarkers}
              setShowAllMarkers={setShowAllMarkers}
              showPolygon={showPolygon}
              setShowPolygon={setShowPolygon}
            />

            {/* Featured Fact Card - Compact, Sleek, Professional Details */}
            {selectedFact && (
              <FeaturedFactCard
                fact={selectedFact}
                currentIndex={ALL_FACTS.findIndex((f) => f.id === selectedFact.id)}
                totalFacts={ALL_FACTS.length}
                onOpenDetail={(fact) => setDetailFact(fact)}
                onNext={handleNextFact}
                onPrev={handlePrevFact}
                onFlyToMap={(fact) => {
                  setSelectedFact(fact);
                  mapContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
              />
            )}
          </div>

          {/* Facts List Column - Clean professional list */}
          <div className="lg:col-span-5 xl:col-span-5 h-[480px] lg:h-[680px]">
            <FactsList
              facts={ALL_FACTS}
              selectedFact={selectedFact}
              onSelectFact={handleSelectFact}
              onOpenDetail={(fact) => setDetailFact(fact)}
            />
          </div>
        </div>
      </main>

      {/* Fact Detail Modal */}
      <FactDetailModal
        fact={detailFact}
        onClose={() => setDetailFact(null)}
        onNavigate={handleModalNavigate}
        onFlyToMap={(fact) => handleSelectFact(fact)}
      />
    </div>
  );
}
