import React from 'react';
import { Menu, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { formatDigits } from '../utils/yearUtils';

interface Props {
  onOpenMenu: () => void;
  isMenuOpen: boolean;
  onOpenHero?: () => void;
}

const KURD_MAP_ICON = '/kimlogo.png';

export const Navbar: React.FC<Props> = ({ onOpenMenu, isMenuOpen, onOpenHero }) => {
  const { language, isEn, dir } = useLanguage();

  return (
    <header
      dir={dir}
      className="preserve-contrast relative bg-[#0b0f1c] border-b border-amber-500/25 sticky top-0 z-40 shadow-md"
    >
      <div className="w-full px-2.5 sm:px-4 h-9 sm:h-10 flex items-center justify-between gap-2 relative z-10">
        {/* Logo and Titles */}
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            type="button"
            onClick={onOpenHero}
            className="shrink-0 rounded-[2px] cursor-pointer hover:scale-105 active:scale-95 transition-transform"
            title={isEn ? 'Back to Home Page' : 'گەڕانەوە بۆ پەڕەی سەرەکی'}
          >
            <img
              src={KURD_MAP_ICON}
              alt="KURDISTAN INFO MAP Logo"
              className="w-6 h-6 rounded-[2px] object-contain"
            />
          </button>
          <div className="flex items-center gap-1.5 min-w-0">
            <h1 className="text-[11px] sm:text-xs font-black font-heading text-slate-100 tracking-wide truncate">
              KURDISTAN INFO MAP
            </h1>
            <span className="text-[9px] text-amber-300 font-mono font-bold px-2 py-0.5 rounded-[2px] bg-amber-500/15 border border-amber-400/35 shrink-0 tabular-nums">
              {formatDigits(350, language)} {isEn ? 'Powers' : 'دەسەڵات'}
            </span>
          </div>
        </div>

        {/* Menu Toggle Button */}
        <button
          onClick={onOpenMenu}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-[3px] text-[11px] font-bold transition-all shrink-0 cursor-pointer border ${
            isMenuOpen
              ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-black border-amber-300 font-black shadow-sm'
              : 'bg-[#131b2e] hover:bg-[#1a243c] text-amber-300 hover:text-white border-white/12 border-t-white/25 hover:border-amber-400/40'
          }`}
          title={
            isMenuOpen
              ? isEn
                ? 'Close Menu'
                : 'داخستنی مینۆ'
              : isEn
              ? 'Open Historical Directory & Information Menu'
              : 'کردنەوەی مینۆی دەسەڵاتەکان و زانیارییەکان'
          }
        >
          {isMenuOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
          <span>
            {isMenuOpen
              ? isEn
                ? 'Close Menu'
                : 'داخستنی مینۆ'
              : isEn
              ? 'Menu: Historical Directory'
              : 'مینۆ: دەسەڵاتەکان و زانیارییەکان'}
          </span>
        </button>
      </div>
    </header>
  );
};

