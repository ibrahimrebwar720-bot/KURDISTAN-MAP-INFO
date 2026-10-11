import React, { useState, useMemo } from 'react';
import { FactItem } from '../data/kurdishHistoryData';
import { CollectionItem } from '../types/history';
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
} from 'lucide-react';

interface Props {
  facts: FactItem[];
  selectedFact: FactItem | null;
  onSelectFact: (fact: FactItem) => void;
  onOpenDetail: (fact: FactItem) => void;
  collections: CollectionItem[];
  selectedCollectionId: string;
  onSelectCollection: (id: string) => void;
  isAdmin?: boolean;
  onOpenAdminPin?: () => void;
  onOpenAddFact?: () => void;
  onOpenEditFact?: (fact: FactItem) => void;
  onOpenCollectionManager?: () => void;
  onClose?: () => void;
  onLogoutAdmin?: () => void;
}

export const FactsList: React.FC<Props> = ({
  facts,
  selectedFact,
  onSelectFact,
  onOpenDetail,
  collections,
  selectedCollectionId,
  onSelectCollection,
  isAdmin = false,
  onOpenAddFact,
  onOpenEditFact,
  onOpenCollectionManager,
  onClose,
  onLogoutAdmin,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter facts by search query AND selected collection
  const filteredFacts = useMemo(() => {
    let list = facts;

    // Filter by Collection
    if (selectedCollectionId && selectedCollectionId !== 'all') {
      list = list.filter((fact) => fact.collectionId === selectedCollectionId);
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
  }, [facts, searchTerm, selectedCollectionId]);

  // Compute counts per collection
  const collectionCounts = useMemo(() => {
    const map: Record<string, number> = { all: facts.length };
    facts.forEach((f) => {
      const cId = f.collectionId || 'powers';
      map[cId] = (map[cId] || 0) + 1;
    });
    return map;
  }, [facts]);

  return (
    <div className="flex flex-col h-full bg-black rounded-lg border border-indigo-950/80 overflow-hidden shadow-2xl">
      {/* Top Header: Search and Admin Actions */}
      <div className="p-2 border-b border-indigo-950/80 bg-black/95 space-y-2">
        {/* Search Input Row with Close & Admin Logout */}
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="w-3 h-3 text-indigo-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="گەڕان لەناو دەسەڵات، کەسایەتی، شوێن و زانیاری..."
              className="w-full bg-[#030712] text-slate-100 placeholder-indigo-300/40 text-[10px] pr-7 pl-7 py-1.5 rounded-md border border-indigo-900/40 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 focus:outline-none transition-all text-right h-7"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-0.5 text-indigo-400 hover:text-white"
                title="سڕینەوە"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          {isAdmin && onLogoutAdmin && (
            <button
              onClick={onLogoutAdmin}
              className="px-2 h-7 rounded-md text-[9px] font-bold text-red-300 bg-red-950/60 hover:bg-red-900/60 border border-red-800/60 transition-colors cursor-pointer shrink-0"
              title="دەرچوون لە ئەدمین"
            >
              دەرچوون
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-md bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-900/40 text-indigo-300 hover:text-white transition-colors cursor-pointer shrink-0"
              title="داخستنی مینۆ"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Collections Filter Bar with Horizontal Scroll */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] px-0.5">
            <span className="font-bold text-indigo-300 flex items-center gap-1">
              <Layers className="w-3 h-3 text-indigo-400" />
              <span>کۆلێکشنەکان:</span>
            </span>

            {/* Admin: Manage Collections Button */}
            {isAdmin && onOpenCollectionManager && (
              <button
                onClick={onOpenCollectionManager}
                className="flex items-center gap-1 text-[9px] text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
                title="دەستکاریکردن یان زیادکردنی کۆلێکشن"
              >
                <Settings className="w-2.5 h-2.5" />
                <span>دەستکاریی کۆلێکشن</span>
              </button>
            )}
          </div>

          {/* Collection Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[9px]">
            {collections.map((col) => {
              const isSelected = selectedCollectionId === col.id;
              const count = collectionCounts[col.id] || 0;

              return (
                <button
                  key={col.id}
                  onClick={() => onSelectCollection(col.id)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer shrink-0 font-medium ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(79,70,229,0.5)] border border-indigo-400'
                      : 'bg-[#030712] text-indigo-300/80 hover:text-white hover:bg-indigo-950/60 border border-indigo-950'
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: col.color }}
                  />
                  <span>{col.name}</span>
                  <span
                    className={`font-mono text-[8px] px-1 py-0.1 rounded-full ${
                      isSelected
                        ? 'bg-black/30 text-white'
                        : 'bg-indigo-950 text-indigo-400'
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
            className="w-full py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 hover:from-indigo-600 hover:to-purple-600 text-white font-bold text-[10px] shadow-[0_0_15px_rgba(79,70,229,0.3)] flex items-center justify-center gap-1.5 transition-all active:scale-[0.99] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>زیادکردنی دەسەڵات، شوێن و زانیاریی نوێ</span>
          </button>
        )}

        {/* Count & Status bar */}
        <div className="flex items-center justify-between text-[9px] px-0.5 text-indigo-300/70 border-t border-indigo-950/60 pt-1">
          <span className="font-medium">پێڕستی مێژوویی</span>
          <span className="font-mono text-indigo-400 font-semibold">
            {filteredFacts.length} لە {facts.length} وێستگە
          </span>
        </div>
      </div>

      {/* Facts Scroll Area - High-Density Modern Black & Indigo List */}
      <div className="flex-1 overflow-y-auto divide-y divide-indigo-950/40 min-h-0 bg-black">
        {filteredFacts.length === 0 ? (
          <div className="py-12 text-center text-indigo-300/70 text-xs px-4 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 shadow-md">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-xs">
                {facts.length === 0
                  ? 'هێشتا هیچ دەسەڵاتێک لەسەر نەخشە تۆمار نەکراوە'
                  : 'هیچ دەسەڵاتێک لەم گەڕانە یان کۆلێکشنە نەدۆزرایەوە'}
              </p>
              <p className="text-[10px] text-indigo-300/60 mt-1">
                {facts.length === 0
                  ? 'لەمەودوا دەتوانیت خۆت بە ئارەزووی خۆت دەسەڵات و وێستگەکان لەسەر نەخشەکە زیاد بکەیت.'
                  : 'دەتوانیت فلتەرەکە بگۆڕیت یان دەسەڵاتی نوێ تۆمار بکەیت.'}
              </p>
            </div>
            {onOpenAddFact && (
              <button
                onClick={onOpenAddFact}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(79,70,229,0.35)] transition-all cursor-pointer active:scale-95"
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
                className={`group flex items-center justify-between gap-2 px-2.5 py-1.5 cursor-pointer transition-all text-right ${
                  isSelected
                    ? 'bg-indigo-950/60 border-r-2 border-indigo-500 shadow-[inset_0_0_16px_rgba(79,70,229,0.18)]'
                    : 'hover:bg-indigo-950/25 hover:border-r hover:border-indigo-800/40'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {/* Number Badge with Indigo Accent */}
                  <span
                    className={`w-5 h-5 rounded flex items-center justify-center font-mono text-[9px] font-bold shrink-0 transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(79,70,229,0.6)]'
                        : 'bg-[#030712] text-indigo-300/80 border border-indigo-900/40 group-hover:border-indigo-600/50 group-hover:text-indigo-200'
                    }`}
                  >
                    {fact.num}
                  </span>

                  {/* Fact Title & Location */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[11px] font-semibold truncate ${
                          isSelected
                            ? 'text-white'
                            : 'text-slate-200 group-hover:text-indigo-200'
                        }`}
                      >
                        {fact.name}
                      </span>
                      {fact.tag && (
                        <span
                          className={`text-[8px] font-medium border px-1 rounded ${
                            fact.tag === 'minister'
                              ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800/40'
                              : fact.tag === 'official'
                              ? 'bg-orange-950/80 text-orange-300 border-orange-800/40'
                              : fact.tag === 'scholar'
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/40'
                              : fact.tag === 'empire'
                              ? 'bg-blue-950/80 text-blue-300 border-blue-800/40'
                              : fact.tag === 'principality'
                              ? 'bg-amber-950/80 text-amber-300 border-amber-800/40'
                              : fact.tag === 'capital'
                              ? 'bg-purple-950/80 text-purple-300 border-purple-800/40'
                              : fact.tag === 'battle'
                              ? 'bg-rose-950/80 text-rose-300 border-rose-800/40'
                              : 'bg-indigo-950/80 text-indigo-300 border-indigo-800/40'
                          }`}
                        >
                          {fact.tag === 'minister'
                            ? 'وەزیر'
                            : fact.tag === 'official'
                            ? 'کاربەدەست'
                            : fact.tag === 'scholar'
                            ? 'زانا'
                            : fact.tag === 'empire'
                            ? 'دەوڵەت'
                            : fact.tag === 'principality'
                            ? 'میرنشین'
                            : fact.tag === 'capital'
                            ? 'قەڵا'
                            : fact.tag === 'battle'
                            ? 'جەنگ'
                            : 'کەسایەتی'}
                        </span>
                      )}
                      {fact.isCustom && (
                        <span className="text-[8px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 rounded">
                          نوێ
                        </span>
                      )}
                      {fact.additionalNotes && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="خاوەنی زانیاری زیاترە" />
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-1 text-[9px] text-indigo-300/60 leading-tight mt-0.5">
                      <div className="flex items-center gap-1 min-w-0 truncate">
                        <MapPin className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{fact.desc}</span>
                      </div>
                      {(fact.century || fact.year) && (
                        <span className="font-mono text-[8px] text-amber-300 bg-amber-950/70 border border-amber-800/40 px-1.5 py-0.2 rounded shrink-0">
                          {fact.year || fact.century}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons: Detail & Admin Edit */}
                <div className="flex items-center gap-0.5 shrink-0">
                  {isAdmin && onOpenEditFact && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEditFact(fact);
                      }}
                      title="دەستکاریکردنی ئەم دەسەڵاتە"
                      className="p-1 rounded text-indigo-400/60 hover:text-amber-300 hover:bg-indigo-950 transition-colors"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDetail(fact);
                    }}
                    title="وردەکاری"
                    className={`p-1 rounded transition-colors shrink-0 ${
                      isSelected
                        ? 'text-indigo-300 hover:text-white bg-indigo-900/40'
                        : 'text-indigo-400/50 hover:text-indigo-200 hover:bg-indigo-950/40'
                    }`}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
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
