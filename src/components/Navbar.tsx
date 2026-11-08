import React from 'react';
import { Menu, X } from 'lucide-react';

interface Props {
  onOpenMenu: () => void;
  isMenuOpen: boolean;
}

const KURD_MAP_ICON = '/kimlogo.png';

export const Navbar: React.FC<Props> = ({ onOpenMenu, isMenuOpen }) => {
  return (
    <header className="relative liquid-glass-dock border-x-0 border-t-0 rounded-none shadow-[0_4px_30px_rgba(0,0,0,0.6)] sticky top-0 z-40 overflow-hidden">
      <div className="glass-specular-ray" />
      <div className="w-full px-2.5 sm:px-4 h-9 sm:h-10 flex items-center justify-between gap-2 relative z-10">
        {/* Logo and Titles */}
        <div className="flex items-center gap-1.5 min-w-0">
          <img
            src={KURD_MAP_ICON}
            alt="KURDISTAN INFO MAP Logo"
            className="w-6 h-6 rounded-lg object-contain drop-shadow-[0_0_8px_rgba(245,158,11,0.45)] shrink-0"
          />
          <div className="flex items-center gap-1.5 min-w-0">
            <h1
              className="text-[11px] sm:text-xs font-black font-heading text-slate-100 tracking-wide truncate"
              style={{
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.8), 0 2px 6px rgba(0, 0, 0, 0.5)',
              }}
            >
              KURDISTAN INFO MAP
            </h1>
            <span className="text-[9px] text-amber-300 font-mono font-bold px-2 py-0.5 rounded-full liquid-glass-subtle border-amber-400/30 shrink-0 shadow-xs">
              ٣٥٠ دەسەڵات
            </span>
          </div>
        </div>

        {/* Menu Toggle Button */}
        <button
          onClick={onOpenMenu}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold transition-all shadow-sm active:scale-95 shrink-0 cursor-pointer ${
            isMenuOpen
              ? 'liquid-glass-btn-active font-extrabold shadow-[0_0_20px_rgba(245,158,11,0.5)]'
              : 'liquid-glass-btn text-amber-300 hover:text-white'
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
