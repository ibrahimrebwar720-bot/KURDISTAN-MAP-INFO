import React, { useEffect, useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, X, Sparkles, Clock, MapPin, RotateCcw } from 'lucide-react';
import { FactItem } from '../data/kurdishHistoryData';

interface Props {
  isActive: boolean;
  onStop: () => void;
  currentFact: FactItem;
  currentIndex: number;
  totalFacts: number;
  onNext: () => void;
  onPrev: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onOpenDetail: (fact: FactItem) => void;
  countdownSeconds: number; // current seconds remaining (e.g. 10 down to 0)
  totalDuration: number; // e.g. 10
  onChangeDuration: (dur: number) => void;
  onResetTimer: () => void;
}

export const AutoTourBanner: React.FC<Props> = ({
  isActive,
  onStop,
  currentFact,
  currentIndex,
  totalFacts,
  onNext,
  onPrev,
  isPlaying,
  onTogglePlay,
  onOpenDetail,
  countdownSeconds,
  totalDuration,
  onChangeDuration,
  onResetTimer,
}) => {
  if (!isActive) return null;

  // Calculate percentage of remaining time
  const progressPercent = Math.max(0, Math.min(100, (countdownSeconds / totalDuration) * 100));

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[1100] w-11/12 max-w-2xl bg-slate-900/95 border-2 border-amber-500/60 rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-2xl animate-fade-in text-right">
      {/* Top Bar: Title & Countdown Timer */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-black font-heading text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              گەشتی خودکاری مێژوو (Auto Tour)
            </h4>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              شوێنی {currentIndex + 1} لە {totalFacts}
            </span>
          </div>
        </div>

        {/* 10-Second Countdown Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
            <span>{countdownSeconds} چرکە ماوە</span>
          </div>

          <button
            onClick={onStop}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="داخستنی گەشت"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar for the 10 Seconds */}
      <div className="w-full bg-slate-800/80 h-2 rounded-full my-3 overflow-hidden">
        <div
          className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 h-full transition-all duration-1000 ease-linear rounded-full shadow-lg shadow-amber-500/40"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Current Fact Info & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
        {/* Info Column */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
              {currentFact.num}
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-100 truncate">
              {currentFact.name}
            </h3>
            <span className="text-[10px] bg-slate-800 text-amber-400 px-2 py-0.5 rounded-full shrink-0">
              {currentFact.eraName}
            </span>
          </div>
          <p className="text-xs text-slate-300 line-clamp-1 leading-relaxed">
            {currentFact.desc}
          </p>
        </div>

        {/* Controls Column */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            onClick={() => onOpenDetail(currentFact)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-semibold flex items-center transition-all"
            title="خوێندنەوەی دەق و زانیاری"
          >
            <span>زانیاری زیاتر</span>
          </button>

          <button
            onClick={onPrev}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            title="شوێنی پێشوو"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={onTogglePlay}
            className={`p-2.5 rounded-xl font-bold shadow-lg transition-all flex items-center gap-1.5 ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
            }`}
            title={isPlaying ? 'وەستاندنی کاتی' : 'بەردەوامبوون'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span className="text-xs font-bold px-0.5">{isPlaying ? 'وەستان' : 'دەستپێکردن'}</span>
          </button>

          <button
            onClick={onNext}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            title="شوێنی دواتر"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Duration Selector dropdown/button */}
          <div className="flex items-center gap-1 bg-slate-800/90 rounded-xl p-0.5 border border-slate-700 text-[11px]">
            <button
              onClick={() => onChangeDuration(5)}
              className={`px-1.5 py-1 rounded-lg ${totalDuration === 5 ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'}`}
              title="٥ چرکە"
            >
              ٥چ
            </button>
            <button
              onClick={() => onChangeDuration(10)}
              className={`px-1.5 py-1 rounded-lg ${totalDuration === 10 ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'}`}
              title="١٠ چرکە"
            >
              ١٠چ
            </button>
            <button
              onClick={() => onChangeDuration(15)}
              className={`px-1.5 py-1 rounded-lg ${totalDuration === 15 ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'}`}
              title="١٥ چرکە"
            >
              ١٥چ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
