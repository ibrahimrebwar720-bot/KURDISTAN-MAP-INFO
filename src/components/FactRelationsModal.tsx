import React, { useState, useMemo } from 'react';
import { FactItem } from '../data/kurdishHistoryData';
import { getCategoryInfo, UNIFIED_CATEGORIES, CategoryId } from '../types/history';
import { kurdishSearchMatch } from '../utils/kurdishSearch';
import {
  X,
  Search,
  Link2,
  Check,
  CheckSquare,
  Square,
  Landmark,
  Save,
  Sparkles,
  Layers,
  Filter,
  Crown,
  Shield,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentFact: FactItem;
  allFacts: FactItem[];
  onSaveLinks: (
    sourceFactId: number,
    targetFactIds: number[],
    parentFactId?: number,
    allyFactIds?: number[]
  ) => void;
}

export const FactRelationsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentFact,
  allFacts,
  onSaveLinks,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<number[]>(() => {
    return Array.isArray(currentFact.relatedFactIds) ? [...currentFact.relatedFactIds] : [];
  });
  const [allyFactIds, setAllyFactIds] = useState<number[]>(() => {
    return Array.isArray(currentFact.allyFactIds) ? [...currentFact.allyFactIds] : [];
  });
  const [allySearchQuery, setAllySearchQuery] = useState('');
  const [parentFactId, setParentFactId] = useState<number | undefined>(currentFact.parentFactId);
  const [isSaving, setIsSaving] = useState(false);

  // Filter candidates (exclude current fact itself)
  const candidateFacts = useMemo(() => {
    return allFacts.filter((f) => f.id !== currentFact.id);
  }, [allFacts, currentFact.id]);

  // Candidate Allies (all other principalities / states / authorities)
  const candidateAllies = useMemo(() => {
    return candidateFacts.filter((f) => {
      const c = getCategoryInfo(f).id;
      return c === 'principality';
    });
  }, [candidateFacts]);

  const filteredCandidateAllies = useMemo(() => {
    if (!allySearchQuery.trim()) return candidateAllies;
    const q = allySearchQuery.trim();
    return candidateAllies.filter(
      (f) => kurdishSearchMatch(f.name, q) || kurdishSearchMatch(f.desc, q)
    );
  }, [candidateAllies, allySearchQuery]);

  // Filtered by query and category
  const filteredCandidates = useMemo(() => {
    let list = candidateFacts;

    if (selectedCatFilter !== 'all') {
      list = list.filter((f) => getCategoryInfo(f).id === selectedCatFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim();
      list = list.filter(
        (f) =>
          kurdishSearchMatch(f.name, q) ||
          kurdishSearchMatch(f.desc, q) ||
          kurdishSearchMatch(f.fullText, q)
      );
    }

    // Sort: selected items first, then alphabetical
    return [...list].sort((a, b) => {
      const aSelected = selectedIds.includes(a.id) ? 1 : 0;
      const bSelected = selectedIds.includes(b.id) ? 1 : 0;
      if (aSelected !== bSelected) return bSelected - aSelected;
      return a.name.localeCompare(b.name, 'ku');
    });
  }, [candidateFacts, selectedCatFilter, searchQuery, selectedIds]);

  // Principalities & broad entities for parent selector
  const broadEntities = useMemo(() => {
    return candidateFacts.filter((f) => {
      const c = getCategoryInfo(f).id;
      return c === 'principality' || c === 'civilization';
    });
  }, [candidateFacts]);

  if (!isOpen) return null;

  const toggleFact = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveLinks(currentFact.id, selectedIds, parentFactId, allyFactIds);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const currentCatInfo = getCategoryInfo(currentFact);

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center p-3 sm:p-5 bg-black/85 animate-fade-in text-right"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl liquid-glass-panel rounded-[4px] p-5 sm:p-6 shadow-[0_25px_80px_rgba(0,0,0,0.95)] max-h-[90vh] flex flex-col text-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md shrink-0"
              style={{
                backgroundColor: `${currentCatInfo.color}25`,
                border: `1px solid ${currentCatInfo.color}50`,
                color: currentCatInfo.color,
              }}
            >
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  بەستنەوە و لینکی بابەتەکان
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold liquid-glass-subtle text-amber-300">
                  {selectedIds.length} دانە هەڵبژێردراوە
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                بەستنەوەی میر، زانا، فەرماندە، قەڵا و جەنگەکان بە «
                <span className="text-amber-300 font-bold">{currentFact.name}</span>»
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl liquid-glass-btn text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Parent Entity Selector (if applicable) */}
        {broadEntities.length > 0 && currentCatInfo.id !== 'principality' && (
          <div className="p-3 mb-3 rounded-2xl liquid-glass-subtle border border-white/10 text-xs shrink-0">
            <label className="block text-[11px] font-bold text-amber-300 mb-1.5 flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-amber-400" />
              <span>دەسەڵات یان میرنشینی سەرەکی (Parent Entity):</span>
            </label>
            <select
              value={parentFactId || ''}
              onChange={(e) =>
                setParentFactId(e.target.value ? Number(e.target.value) : undefined)
              }
              className="w-full liquid-glass-input text-slate-100 p-2.5 rounded-xl text-xs cursor-pointer focus:outline-none"
            >
              <option value="" className="bg-slate-900 text-slate-300">
                -- بێ دیاریکردنی دەسەڵاتی دایک (سەربەخۆ) --
              </option>
              {broadEntities.map((ent) => (
                <option key={ent.id} value={ent.id} className="bg-slate-900 text-slate-100">
                  {ent.name} ({ent.desc})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Allies Selector Section for Principality / Authority / State / Empire */}
        {currentCatInfo.id === 'principality' && (
          <div className="p-3 mb-3 rounded-2xl liquid-glass-subtle border border-emerald-500/30 text-xs shrink-0 bg-emerald-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-emerald-300 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-emerald-400" />
                <span>دەسەڵات و میرنشینە هاوپەیمانەکان (Allies):</span>
              </label>
              <span className="text-[10px] font-bold text-emerald-300 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                {allyFactIds.length} هاوپەیمان
              </span>
            </div>

            {/* Search within Allies */}
            <div className="relative">
              <input
                type="text"
                value={allySearchQuery}
                onChange={(e) => setAllySearchQuery(e.target.value)}
                placeholder="گەڕان بەدوای دەسەڵاتی هاوپەیمان..."
                className="w-full liquid-glass-input text-slate-100 placeholder:text-slate-500 pl-3 pr-8 py-1.5 rounded-xl text-xs"
              />
              <Search className="w-3.5 h-3.5 text-emerald-400 absolute right-2.5 top-2 pointer-events-none" />
              {allySearchQuery && (
                <button
                  type="button"
                  onClick={() => setAllySearchQuery('')}
                  className="absolute left-2.5 top-1.5 text-slate-400 hover:text-white p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* List of Available Principalities / States to Toggle as Allies */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none max-w-full">
              {filteredCandidateAllies.length === 0 ? (
                <span className="text-[11px] text-slate-400 py-1">هیچ دەسەڵاتێکی تر نەدۆزرایەوە</span>
              ) : (
                filteredCandidateAllies.map((ent) => {
                  const isAlly = allyFactIds.includes(ent.id);
                  return (
                    <button
                      key={ent.id}
                      type="button"
                      onClick={() => {
                        setAllyFactIds((prev) =>
                          prev.includes(ent.id) ? prev.filter((id) => id !== ent.id) : [...prev, ent.id]
                        );
                      }}
                      className={`px-2.5 py-1 rounded-xl text-xs shrink-0 flex items-center gap-1.5 border transition-all cursor-pointer active:scale-95 ${
                        isAlly
                          ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 font-bold shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isAlly ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                      <span className="truncate max-w-[130px]">{ent.name}</span>
                      {isAlly && <Check className="w-3 h-3 text-emerald-400" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Search & Category Filter Bar */}
        <div className="space-y-2 mb-3 shrink-0">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="گەڕان بەدوای میر، زانا، قەڵا، جەنگ یان دەسەڵات..."
              className="w-full liquid-glass-input text-slate-100 placeholder:text-slate-500 pl-3 pr-9 py-2 rounded-xl text-xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-2 text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            <button
              onClick={() => setSelectedCatFilter('all')}
              className={`px-2.5 py-1 rounded-lg shrink-0 transition-all cursor-pointer font-medium ${
                selectedCatFilter === 'all'
                  ? 'liquid-glass-btn-active text-black font-bold'
                  : 'liquid-glass-subtle text-slate-300 hover:text-white'
              }`}
            >
              هەموو
            </button>
            {UNIFIED_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCatFilter(cat.id)}
                className={`px-2.5 py-1 rounded-lg shrink-0 transition-all cursor-pointer font-medium flex items-center gap-1 ${
                  selectedCatFilter === cat.id
                    ? 'liquid-glass-btn-active text-black font-bold'
                    : 'liquid-glass-subtle text-slate-300 hover:text-white'
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Facts Checkbox List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar min-h-[220px]">
          {filteredCandidates.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              هیچ بابەتێک بەم ناونیشانە نەدۆزرایەوە. دەتوانیت لە ڕێگەی پۆلێنەکانی ترەوە بگەڕێیت.
            </div>
          ) : (
            filteredCandidates.map((f) => {
              const isChecked = selectedIds.includes(f.id);
              const catInfo = getCategoryInfo(f);
              return (
                <div
                  key={f.id}
                  onClick={() => toggleFact(f.id)}
                  className={`p-2.5 sm:p-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-3 border ${
                    isChecked
                      ? 'bg-amber-500/15 border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                      : 'liquid-glass-subtle border-white/5 hover:border-white/20 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                        isChecked
                          ? 'bg-amber-400 text-black shadow-xs'
                          : 'liquid-glass-btn text-slate-400'
                      }`}
                    >
                      {isChecked ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        <Square className="w-3.5 h-3.5 opacity-40" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-white truncate">{f.name}</span>
                        <span
                          className="text-[10px] px-2 py-0.2 rounded-md font-semibold"
                          style={{
                            backgroundColor: `${catInfo.color}20`,
                            color: catInfo.color,
                            border: `1px solid ${catInfo.color}40`,
                          }}
                        >
                          {catInfo.name}
                        </span>
                        {(f.year || f.century) && (
                          <span className="text-[10px] text-amber-200/80 font-mono">
                            ({f.year || f.century})
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{f.desc}</p>
                    </div>
                  </div>

                  {isChecked && (
                    <span className="text-[10px] text-amber-300 font-bold px-2 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/30 shrink-0">
                      بەستراوەتەوە ✓
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="flex items-center justify-between gap-3 pt-3 mt-3 border-t border-white/10 shrink-0">
          <div className="text-xs text-slate-400">
            {selectedIds.length > 0 ? (
              <span className="text-amber-300 font-bold">
                {selectedIds.length} بابەت پێوە دەبەسترێتەوە
              </span>
            ) : (
              <span>هیچ بابەتێک هەڵنەبژێردراوە</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl liquid-glass-btn text-slate-300 text-xs cursor-pointer"
            >
              هەڵوەشاندنەوە
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl liquid-glass-btn-active text-black font-extrabold text-xs shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'پاشەکەوت دەکرێت...' : 'پاشەکەوتکردنی بەستنەوەکان'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
