import React, { useState, useMemo } from 'react';
import { FactItem } from '../data/kurdishHistoryData';
import { CollectionItem, UNIFIED_CATEGORIES, getCategoryInfo } from '../types/history';
import { getFactChronologicalYear } from '../utils/yearUtils';
import {
  Search,
  X,
  ChevronLeft,
  Plus,
  Settings,
  Edit3,
  Layers,
  MapPin,
  Images,
  Palette,
} from 'lucide-react';

interface Props {
  facts: FactItem[];
  selectedFact: FactItem | null;
  onSelectFact: (fact: FactItem) => void;
  onOpenDetail: (fact: FactItem) => void;
  collections?: CollectionItem[];
  selectedCollectionId?: string;
  onSelectCollection?: (id: string) => void;
  activeCategory?: string;
  onSelectCategory?: (id: string) => void;
  isAdmin?: boolean;
  onOpenAdminPin?: () => void;
  onOpenAddFact?: () => void;
  onOpenEditFact?: (fact: FactItem) => void;
  onOpenCollectionManager?: () => void;
  onOpenGallery?: () => void;
  onOpenTheme?: () => void;
  onClose?: () => void;
  onLogoutAdmin?: () => void;
}

const BATTLE_SCHOLAR_BG = '/src/assets/images/kurd_battle_scholar_bg_1791793720708.jpg';
const KURD_MAP_ICON = '/src/assets/images/kurd_map_pwa_icon_1791793702859.jpg';

export const FactsList: React.FC<Props> = ({
  facts,
  selectedFact,
  onSelectFact,
  onOpenDetail,
  collections,
  selectedCollectionId,
  onSelectCollection,
  activeCategory,
  onSelectCategory,
  isAdmin = false,
  onOpenAddFact,
  onOpenEditFact,
  onOpenCollectionManager,
  onOpenGallery,
  onOpenTheme,
  onClose,
  onLogoutAdmin,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const currentCategory = activeCategory || selectedCollectionId || 'all';

  const handleCategorySelect = (catId: string) => {
    if (onSelectCategory) onSelectCategory(catId);
    if (onSelectCollection) onSelectCollection(catId);
  };

  // Filter facts by search query AND unified category (پۆلێن)
  const filteredFacts = useMemo(() => {
    let list = facts;

    // Filter by unified category
    if (currentCategory && currentCategory !== 'all') {
      list = list.filter((fact) => getCategoryInfo(fact).id === currentCategory);
    }

    // Filter by Search Term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter((fact) => {
        return (
          fact.name.toLowerCase().includes(q) ||
          fact.desc.toLowerCase().includes(q) ||
          fact.fullText.toLowerCase().includes(q) ||
          (fact.additionalNotes && fact.additionalNotes.toLowerCase().includes(q)) ||
          (fact.region && fact.region.toLowerCase().includes(q)) ||
          fact.num.toString() === q
        );
      });
    }

    // Sort chronologically (بەپێی سەدە و ساڵ، کامیان کۆنترە ئەو لەسەرەوە بێت)
    return [...list].sort((a, b) => {
      const yearA = getFactChronologicalYear(a);
      const yearB = getFactChronologicalYear(b);
      if (yearA !== yearB) {
        return yearA - yearB;
      }
      return a.id - b.id;
    });
  }, [facts, searchTerm, currentCategory]);

  // Compute counts per unified category (پۆلێن)
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = { all: facts.length };
    facts.forEach((f) => {
      const cId = getCategoryInfo(f).id;
      map[cId] = (map[cId] || 0) + 1;
    });
    return map;
  }, [facts]);

  return (
    <div className="relative flex flex-col h-full liquid-glass-panel rounded-2xl sm:rounded-3xl border border-white/20 border-t-white/45 overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_25px_60px_rgba(0,0,0,0.9)]">
      <div className="glass-specular-ray" />

      {/* Subtle Background Layer: Kurdish Battles & Scholars Artwork */}
      <div className="absolute inset-0 pointer-events-none opacity-10 overflow-hidden z-0">
        <img
          src={BATTLE_SCHOLAR_BG}
          alt="Kurdish Battles & Scholars Background"
          className="w-full h-full object-cover object-center filter saturate-50"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070b14]/70 via-[#070b14]/90 to-[#070b14]" />
      </div>

      {/* Top Header: Search and Admin Actions */}
      <div className="relative z-10 p-3 border-b border-white/10 liquid-glass-subtle space-y-2.5">
        {/* App Title Row with Kurdistan Map Icon */}
        <div className="flex items-center justify-between px-1 pb-1 border-b border-white/10">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={KURD_MAP_ICON}
              alt="KURDISTAN INFO MAP"
              className="w-5 h-5 rounded-full object-cover border border-amber-400/50 shadow-[0_0_10px_rgba(245,158,11,0.25)]"
            />
            <span className="text-xs font-black text-amber-300 font-heading tracking-wide">
              KURDISTAN INFO MAP
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {onOpenTheme && (
              <button
                onClick={() => {
                  if (onClose) onClose();
                  onOpenTheme();
                }}
                className="p-1.5 rounded-xl liquid-glass-btn text-amber-300 hover:text-white transition-all cursor-pointer flex items-center justify-center shadow-xs"
                title="بەشی ڕووکار (Theme)"
                aria-label="بەشی ڕووکار"
              >
                <Palette className="w-3.5 h-3.5 text-amber-400" />
              </button>
            )}
            {onOpenGallery && (
              <button
                onClick={() => {
                  if (onClose) onClose();
                  onOpenGallery();
                }}
                className="p-1.5 rounded-xl liquid-glass-btn text-amber-300 hover:text-white transition-all cursor-pointer flex items-center justify-center shadow-xs"
                title="گەلەری"
                aria-label="گەلەری"
              >
                <Images className="w-3.5 h-3.5 text-amber-400" />
              </button>
            )}
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full liquid-glass-subtle text-amber-300 border border-amber-400/30">
              PWA ONLINE
            </span>
          </div>
        </div>

        {/* Search Input Row with Close & Admin Logout */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-amber-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="گەڕان لەناو دەسەڵات، کەسایەتی، شوێن و زانیاری..."
              className="w-full liquid-glass-input text-slate-100 placeholder:text-slate-400 text-xs pr-8 pl-8 py-2 rounded-xl focus:border-amber-400 focus:outline-none transition-all text-right h-8"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-white cursor-pointer"
                title="سڕینەوە"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {isAdmin && onLogoutAdmin && (
            <button
              onClick={onLogoutAdmin}
              className="px-2.5 h-8 rounded-xl text-[10px] font-bold text-red-300 bg-red-950/70 hover:bg-red-900/70 border border-red-800/60 transition-colors cursor-pointer shrink-0"
              title="دەرچوون لە ئەدمین"
            >
              دەرچوون
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl liquid-glass-btn text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
              title="داخستنی مینۆ"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Unified Categories Filter Bar with Horizontal Scroll (پۆلێنەکان) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>پۆلێن:</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {UNIFIED_CATEGORIES.length - 1} پۆلێن
            </span>
          </div>

          {/* Unified Category Pills (Liquid Glass Pills) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px]">
            {UNIFIED_CATEGORIES.map((cat) => {
              const isSelected = currentCategory === cat.id;
              const count = categoryCounts[cat.id] || 0;

              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer shrink-0 font-medium ${
                    isSelected
                      ? 'liquid-glass-btn-active font-extrabold shadow-md'
                      : 'liquid-glass-btn text-slate-300 hover:text-amber-300'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: isSelected ? '#000000' : cat.color }}
                  />
                  <span>{cat.name}</span>
                  <span
                    className={`font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-black/30 text-black'
                        : 'bg-white/10 text-amber-300/90 border border-white/10'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Admin Quick Action: Add New Place & Authority */}
        {isAdmin && onOpenAddFact && (
          <button
            onClick={onOpenAddFact}
            className="w-full py-2 px-3 rounded-xl liquid-glass-btn-active text-black font-extrabold text-xs shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>زیادکردنی دەسەڵات، شوێن و زانیاریی نوێ</span>
          </button>
        )}

        {/* Count & Status bar */}
        <div className="flex items-center justify-between text-[10px] px-1 text-slate-400 border-t border-white/10 pt-1.5">
          <span className="font-medium text-amber-400/90">پێڕستی مێژوویی</span>
          <span className="font-mono text-amber-300 font-bold">
            {filteredFacts.length} لە {facts.length} دەسەڵات و شوێن
          </span>
        </div>
      </div>

      {/* Facts Scroll Area - High-Density Modern Frosted Glass List */}
      <div className="flex-1 overflow-y-auto divide-y divide-amber-500/10 min-h-0 custom-scrollbar">
        {filteredFacts.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs px-4 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center mx-auto text-amber-400 shadow-md">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">
                {facts.length === 0
                  ? 'هێشتا هیچ دەسەڵاتێک لەسەر نەخشە تۆمار نەکراوە'
                  : 'هیچ دەسەڵاتێک لەم گەڕانە یان کۆلێکشنە نەدۆزرایەوە'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {facts.length === 0
                  ? 'لەمەودوا دەتوانیت خۆت بە ئارەزووی خۆت دەسەڵات و شوێنەکان لەسەر نەخشەکە زیاد بکەیت.'
                  : 'دەتوانیت فلتەرەکە بگۆڕیت یان دەسەڵاتی نوێ تۆمار بکەیت.'}
              </p>
            </div>
            {onOpenAddFact && (
              <button
                onClick={onOpenAddFact}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold text-xs shadow-md transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>زیادکردنی یەکەم دەسەڵات</span>
              </button>
            )}
          </div>
        ) : (
          filteredFacts.map((fact) => {
            const isSelected = selectedFact?.id === fact.id;

            return (
              <div
                key={fact.id}
                onClick={() => onSelectFact(fact)}
                className={`group flex items-center justify-between gap-2.5 px-3 py-2 cursor-pointer transition-all text-right rounded-xl mx-1.5 my-0.5 ${
                  isSelected
                    ? 'liquid-glass-subtle border-r-2 border-amber-400 shadow-[inset_0_0_20px_rgba(245,158,11,0.2)]'
                    : 'hover:liquid-glass-subtle hover:border-r hover:border-amber-400/40'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Number Badge with Gold Accent */}
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-[10px] font-bold shrink-0 transition-all ${
                      isSelected
                        ? 'liquid-glass-btn-active text-black shadow-[0_0_10px_rgba(245,158,11,0.6)] font-extrabold'
                        : 'liquid-glass-btn text-amber-300'
                    }`}
                  >
                    {fact.num}
                  </span>

                  {/* Fact Title & Location */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-xs font-bold truncate ${
                          isSelected
                            ? 'text-white'
                            : 'text-slate-100 group-hover:text-amber-300'
                        }`}
                      >
                        {fact.name}
                      </span>
                      {(() => {
                        const catInfo = getCategoryInfo(fact);
                        return (
                          <span
                            className="text-[9px] font-medium border px-1.5 py-0.2 rounded-md"
                            style={{
                              backgroundColor: `${catInfo.color}18`,
                              color: catInfo.color,
                              borderColor: `${catInfo.color}40`,
                            }}
                          >
                            {catInfo.name}
                          </span>
                        );
                      })()}
                      {fact.isCustom && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/35 px-1.5 py-0.2 rounded font-bold">
                          نوێ
                        </span>
                      )}
                      {fact.additionalNotes && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="خاوەنی زانیاری زیاترە" />
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-1 text-[10px] text-slate-400 leading-tight mt-1">
                      <div className="flex items-center gap-1 min-w-0 truncate">
                        <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="truncate">{fact.desc}</span>
                      </div>
                      {(fact.century || fact.year) && (
                        <span className="font-mono text-[9px] font-bold text-amber-300 bg-amber-950/70 border border-amber-800/40 px-1.5 py-0.2 rounded shrink-0">
                          {fact.year || fact.century}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons: Detail & Admin Edit */}
                <div className="flex items-center gap-1 shrink-0">
                  {isAdmin && onOpenEditFact && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEditFact(fact);
                      }}
                      title="دەستکاریکردنی ئەم دەسەڵاتە"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDetail(fact);
                    }}
                    title="وردەکاری"
                    className={`p-1.5 rounded-lg transition-colors shrink-0 cursor-pointer ${
                      isSelected
                        ? 'text-amber-300 hover:text-white bg-amber-500/20'
                        : 'text-slate-400 hover:text-amber-200 hover:bg-white/10'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
