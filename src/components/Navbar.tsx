import React from 'react';
import { Menu, X } from 'lucide-react';

interface Props {
  onOpenMenu: () => void;
  isMenuOpen: boolean;
}

const KURD_MAP_ICON = '/src/assets/images/kurd_map_pwa_icon_1791793702859.jpg';

export const Navbar: React.FC<Props> = ({ onOpenMenu, isMenuOpen }) => {
  return (
    <header className="bg-[#070b14]/75 backdrop-blur-xl border-b border-amber-500/20 shadow-[0_4px_25px_rgba(0,0,0,0.5)] sticky top-0 z-40">
      <div className="w-full px-2.5 sm:px-4 h-9 sm:h-10 flex items-center justify-between gap-2">
        {/* Logo and Titles */}
        <div className="flex items-center gap-1.5 min-w-0">
          <img
            src={KURD_MAP_ICON}
            alt="KURDISTAN INFO MAP Icon"
            className="w-5 h-5 rounded-full object-cover border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.25)] shrink-0"
          />
          <div className="flex items-center gap-1.5 min-w-0">
            <h1 className="text-[11px] sm:text-xs font-black font-heading text-slate-100 tracking-wide truncate">
              KURDISTAN INFO MAP
            </h1>
            <span className="text-[9px] text-amber-300 font-mono font-bold px-1.5 py-0.2 rounded-full bg-amber-500/15 border border-amber-500/30 shrink-0 shadow-xs">
              ٣٥٠ دەسەڵات
            </span>
          </div>
        </div>

        {/* Menu Toggle Button */}
        <button
          onClick={onOpenMenu}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold transition-all shadow-sm active:scale-95 shrink-0 border cursor-pointer ${
            isMenuOpen
              ? 'bg-amber-500 text-black border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
              : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border-amber-500/40 backdrop-blur-md'
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
