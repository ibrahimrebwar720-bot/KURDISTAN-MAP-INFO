import React from 'react';

export const Navbar: React.FC = () => {
  return (
    <header className="bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-12 sm:h-13 flex items-center justify-between gap-3">
        {/* Logo and Titles */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
            <span className="text-sm select-none">☀️</span>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-xs sm:text-sm font-bold font-heading text-slate-100 truncate">
              ئینسایکلۆپیدیای دەسەڵاتە کوردییەکان
            </h1>
            <span className="text-[10px] text-amber-400 font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 shrink-0">
              ٢٠٠ وێستگە
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
