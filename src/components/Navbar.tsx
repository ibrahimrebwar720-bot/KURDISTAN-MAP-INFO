import React from 'react';
import { Menu, X } from 'lucide-react';

interface Props {
  onOpenMenu: () => void;
  isMenuOpen: boolean;
}

const KURD_MAP_ICON = '/src/assets/images/kurd_map_pwa_icon_1791793702859.jpg';

export const Navbar: React.FC<Props> = ({ onOpenMenu, isMenuOpen }) => {
  return (
    <header className="bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40">
      <div className="w-full px-2.5 sm:px-4 h-9 sm:h-10 flex items-center justify-between gap-2">
        {/* Logo and Titles */}
        <div className="flex items-center gap-1.5 min-w-0">
          <img
            src={KURD_MAP_ICON}
            alt="KURDISTAN INFO MAP Icon"
            className="w-5 h-5 rounded-full object-cover border border-amber-500/40 shrink-0"
          />
          <div className="flex items-center gap-1.5 min-w-0">
            <h1 className="text-[11px] sm:text-xs font-black font-heading text-slate-100 tracking-wide truncate">
              KURDISTAN INFO MAP
            </h1>
            <span className="text-[9px] text-amber-400 font-mono font-semibold px-1 py-0.2 rounded bg-amber-500/10 border border-amber-500/20 shrink-0">
              ٣٥٠ دەسەڵات
            </span>
          </div>
        </div>

        {/* Menu Toggle Button */}
        <button
          onClick={onOpenMenu}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all shadow-sm active:scale-95 shrink-0 ${
            isMenuOpen
              ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-400/30'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
          }`}
          title={isMenuOpen ? 'داخستنی مینۆ' : 'کردنەوەی مینۆی دەسەڵاتەکان و زانیارییەکان'}
        >
          {isMenuOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
          <span>{isMenuOpen ? 'داخستنی مینۆ' : 'مینۆ: دەسەڵاتەکان و زانیارییەکان'}</span>
        </button>
      </div>
    </header>
  );
};
