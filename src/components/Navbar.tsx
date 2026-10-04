import React from 'react';
import { Play } from 'lucide-react';

interface Props {
  onStartAutoTour: () => void;
}

export const Navbar: React.FC<Props> = ({
  onStartAutoTour,
}) => {
  return (
    <header className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-amber-500/20 text-slate-100 shadow-2xl">
      {/* Decorative Golden Line at Top */}
      <div className="h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo and Titles */}
        <div className="flex items-center gap-3.5 text-right">
          {/* Kurdish Sun Emblem */}
          <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-400 to-amber-600 p-0.5 shadow-lg shadow-amber-500/20 shrink-0 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <span className="text-2xl select-none">☀️</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl md:text-2xl font-black font-heading tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100">
                نەخشە و ئینسایکلۆپیدیای دەسەڵاتە کوردییەکان
              </h1>
              <span className="hidden sm:inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ٢٠٠/٢٠٠ شوێن
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
              گەشتێکی کارلێککاری مێژوویی بەناو ٢٠٠ میرنشین، ئیمپراتۆریەت، پایتەخت و ڕووداوی گەلی کورد لە زاگرۆس تا جیهان
            </p>
          </div>
        </div>

        {/* Quick Action Navigation */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <button
            onClick={onStartAutoTour}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20 transition-all text-xs sm:text-sm"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>دەستپێکردنی گەشتی خودکار (١٠ چرکە)</span>
          </button>
        </div>
      </div>
    </header>
  );
};
