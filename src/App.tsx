import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ALL_FACTS, FactItem } from './data/kurdishHistoryData';
import { KurdishGoogleMap } from './components/KurdishGoogleMap';
import { FactsList } from './components/FactsList';
import { Navbar } from './components/Navbar';
import { FactDetailModal } from './components/FactDetailModal';
import { AutoTourBanner } from './components/AutoTourBanner';

export default function App() {
  const [selectedFact, setSelectedFact] = useState<FactItem | null>(ALL_FACTS[0]);
  const [detailFact, setDetailFact] = useState<FactItem | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  const [showAllMarkers, setShowAllMarkers] = useState(true);
  const [showPolygon, setShowPolygon] = useState(true);

  // Auto Tour State & 10-Second Countdown
  const [isAutoTourActive, setIsAutoTourActive] = useState(false);
  const [autoTourIndex, setAutoTourIndex] = useState(0);
  const [isAutoTourPlaying, setIsAutoTourPlaying] = useState(false);
  const [tourDuration, setTourDuration] = useState(10); // default 10 seconds
  const [countdownSeconds, setCountdownSeconds] = useState(10);

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

  // Auto Tour 10-Second Countdown Logic
  useEffect(() => {
    if (!isAutoTourActive || !isAutoTourPlaying) return;

    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          // Transition to next fact
          setAutoTourIndex((prevIdx) => {
            const nextIdx = (prevIdx + 1) % ALL_FACTS.length;
            setSelectedFact(ALL_FACTS[nextIdx]);
            return nextIdx;
          });
          return tourDuration; // Reset to 10 seconds
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAutoTourActive, isAutoTourPlaying, tourDuration]);

  const handleStartAutoTour = () => {
    setIsAutoTourActive(true);
    setIsAutoTourPlaying(true);
    setCountdownSeconds(tourDuration);
    const startIdx = selectedFact ? ALL_FACTS.findIndex((f) => f.id === selectedFact.id) : 0;
    const finalStart = startIdx >= 0 ? startIdx : 0;
    setAutoTourIndex(finalStart);
    setSelectedFact(ALL_FACTS[finalStart]);
  };

  const handleStopAutoTour = () => {
    setIsAutoTourActive(false);
    setIsAutoTourPlaying(false);
    setCountdownSeconds(tourDuration);
  };

  const handleNextTourFact = useCallback(() => {
    const nextIdx = (autoTourIndex + 1) % ALL_FACTS.length;
    setAutoTourIndex(nextIdx);
    setSelectedFact(ALL_FACTS[nextIdx]);
    setCountdownSeconds(tourDuration);
  }, [autoTourIndex, tourDuration]);

  const handlePrevTourFact = useCallback(() => {
    const prevIdx = (autoTourIndex - 1 + ALL_FACTS.length) % ALL_FACTS.length;
    setAutoTourIndex(prevIdx);
    setSelectedFact(ALL_FACTS[prevIdx]);
    setCountdownSeconds(tourDuration);
  }, [autoTourIndex, tourDuration]);

  const handleChangeDuration = (newDur: number) => {
    setTourDuration(newDur);
    setCountdownSeconds(newDur);
  };

  const handleResetTimer = () => {
    setCountdownSeconds(tourDuration);
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
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        onStartAutoTour={handleStartAutoTour}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 flex flex-col gap-5">
        {/* Unified Integrated Container: Map and Facts List together in one place */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Map Column */}
          <div
            ref={mapContainerRef}
            className="lg:col-span-7 xl:col-span-7 flex flex-col gap-3"
          >
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
          </div>

          {/* Facts List Column - always together with the map */}
          <div className="lg:col-span-5 xl:col-span-5 h-[560px] lg:h-[650px]">
            <FactsList
              facts={ALL_FACTS}
              selectedFact={selectedFact}
              onSelectFact={handleSelectFact}
              onOpenDetail={(fact) => setDetailFact(fact)}
            />
          </div>
        </div>
      </main>

      {/* Enhanced Auto Tour Floating Bar with 10-Second Countdown */}
      <AutoTourBanner
        isActive={isAutoTourActive}
        onStop={handleStopAutoTour}
        currentFact={ALL_FACTS[autoTourIndex] || ALL_FACTS[0]}
        currentIndex={autoTourIndex}
        totalFacts={ALL_FACTS.length}
        onNext={handleNextTourFact}
        onPrev={handlePrevTourFact}
        isPlaying={isAutoTourPlaying}
        onTogglePlay={() => setIsAutoTourPlaying(!isAutoTourPlaying)}
        onOpenDetail={(fact) => setDetailFact(fact)}
        countdownSeconds={countdownSeconds}
        totalDuration={tourDuration}
        onChangeDuration={handleChangeDuration}
        onResetTimer={handleResetTimer}
      />

      {/* Fact Detail Modal */}
      <FactDetailModal
        fact={detailFact}
        onClose={() => setDetailFact(null)}
        onNavigate={handleModalNavigate}
        onFlyToMap={(fact) => handleSelectFact(fact)}
      />

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-amber-500 font-bold">نەخشە و ئینسایکلۆپیدیای مێژووی کورد</span>
            <span>-</span>
            <span>بەستراوەتەوە بە گووگڵ ماپس (Google Maps Platform)</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={handleStartAutoTour} className="hover:text-amber-400 transition-colors">
              گەشتی خودکار (١٠ چرکە)
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
