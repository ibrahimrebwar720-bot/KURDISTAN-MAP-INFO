import React, { useState, useMemo } from 'react';
import { FactItem } from '../data/kurdishHistoryData';
import { getCategoryInfo, getUnifiedCategories, getAccessibleCategoryColor } from '../types/history';
import { kurdishSearchMatch } from '../utils/kurdishSearch';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { formatDigits } from '../utils/yearUtils';
import {
  X,
  Search,
  Link2,
  Check,
  Square,
  Landmark,
  Save,
  Crown,
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
  const { language, isEn, dir } = useLanguage();
  const { colorMode } = useTheme();
  const isDark = colorMode === 'dark';
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

  const categories = useMemo(() => getUnifiedCategories(language), [language]);

  // Filter candidates (exclude current fact itself)
  const candidateFacts = useMemo(() => {
    return allFacts.filter((f) => f.id !== currentFact.id);
  }, [allFacts, currentFact.id]);

  // Candidate Allies (all other principalities / states / authorities)
  const candidateAllies = useMemo(() => {
    return candidateFacts.filter((f) => {
      const c = getCategoryInfo(f, language).id;
      return c === 'principality';
    });
  }, [candidateFacts, language]);

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
      list = list.filter((f) => getCategoryInfo(f, language).id === selectedCatFilter);
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
      return a.name.localeCompare(b.name, isEn ? 'en' : 'ku');
    });
  }, [candidateFacts, selectedCatFilter, searchQuery, selectedIds, language, isEn]);

  // Principalities & broad entities for parent selector
  const broadEntities = useMemo(() => {
    return candidateFacts.filter((f) => {
      const c = getCategoryInfo(f, language).id;
      return c === 'principality' || c === 'civilization';
    });
  }, [candidateFacts, language]);

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

  const currentCatInfo = getCategoryInfo(currentFact, language);

  const currentAccentColor = getAccessibleCategoryColor(currentCatInfo.color, isDark);

  return (
    <div
      dir={dir}
      className="fixed inset-0 z-[1300] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs animate-fade-in text-start"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-2xl rounded-[4px] p-5 sm:p-6 max-h-[90vh] flex flex-col overflow-hidden border transition-colors ${
          isDark
            ? 'liquid-glass-panel text-slate-100 shadow-[0_25px_80px_rgba(0,0,0,0.95)]'
            : 'bg-white border-slate-300 text-slate-900 shadow-2xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between pb-3.5 mb-3 border-b shrink-0 ${
            isDark ? 'border-white/10' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm shrink-0"
              style={{
                backgroundColor: isDark ? `${currentCatInfo.color}25` : `${currentAccentColor}18`,
                border: `1px solid ${currentAccentColor}55`,
                color: currentAccentColor,
              }}
            >
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {isEn ? 'Link Related Topics & Entities' : 'بەستنەوە و لینکی بابەتەکان'}
                </h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                    isDark
                      ? 'liquid-glass-subtle text-amber-300 border-amber-400/25'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}
                >
                  {isEn
                    ? `${selectedIds.length} selected`
                    : `${formatDigits(selectedIds.length, language)} دانە هەڵبژێردراوە`}
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {isEn ? (
                  <>
                    Connect rulers, scholars, fortresses, and battles to{' '}
                    <span className={`font-bold ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                      “{currentFact.name}”
                    </span>
                  </>
                ) : (
                  <>
                    بەستنەوەی میر، زانا، فەرماندە، قەڵا و جەنگەکان بە «
                    <span className={`font-bold ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                      {currentFact.name}
                    </span>»
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isDark
                ? 'liquid-glass-btn text-slate-400 hover:text-white border-white/10'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-300'
            }`}
            title={isEn ? 'Close' : 'داخستن'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Parent Entity Selector (if applicable) */}
        {broadEntities.length > 0 && currentCatInfo.id !== 'principality' && (
          <div
            className={`p-3 mb-3 rounded-2xl border text-xs shrink-0 ${
              isDark
                ? 'liquid-glass-subtle border-white/10'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <label
              className={`block text-[11px] font-bold mb-1.5 flex items-center gap-1.5 ${
                isDark ? 'text-amber-300' : 'text-amber-900'
              }`}
            >
              <Landmark className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
              <span>
                {isEn
                  ? 'Parent Principality / Polity:'
                  : 'دەسەڵات یان میرنشینی سەرەکی (Parent Entity):'}
              </span>
            </label>
            <select
              value={parentFactId || ''}
              onChange={(e) =>
                setParentFactId(e.target.value ? Number(e.target.value) : undefined)
              }
              className={`w-full p-2.5 rounded-xl text-xs cursor-pointer focus:outline-none border ${
                isDark
                  ? 'liquid-glass-input text-slate-100 border-white/15'
                  : 'bg-white text-slate-900 border-slate-300 focus:border-amber-600'
              }`}
            >
              <option value="" className={isDark ? 'bg-slate-900 text-slate-300' : 'bg-white text-slate-600'}>
                {isEn
                  ? '-- No parent polity (Independent) --'
                  : '-- بێ دیاریکردنی دەسەڵاتی دایک (سەربەخۆ) --'}
              </option>
              {broadEntities.map((ent) => (
                <option
                  key={ent.id}
                  value={ent.id}
                  className={isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}
                >
                  {ent.name} ({ent.desc})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Allies Selector Section for Principality / Authority / State / Empire */}
        {currentCatInfo.id === 'principality' && (
          <div
            className={`p-3 mb-3 rounded-2xl border text-xs shrink-0 space-y-2 ${
              isDark
                ? 'liquid-glass-subtle border-emerald-500/30 bg-emerald-950/20'
                : 'bg-emerald-50 border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <label
                className={`text-[11px] font-black flex items-center gap-1.5 ${
                  isDark ? 'text-emerald-300' : 'text-emerald-900'
                }`}
              >
                <Crown className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />
                <span>
                  {isEn
                    ? 'Allied Polities & Principalities (Allies):'
                    : 'دەسەڵات و میرنشینە هاوپەیمانەکان (Allies):'}
                </span>
              </label>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isDark
                    ? 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30'
                    : 'text-emerald-900 bg-emerald-100 border-emerald-300'
                }`}
              >
                {isEn
                  ? `${allyFactIds.length} allies`
                  : `${formatDigits(allyFactIds.length, language)} هاوپەیمان`}
              </span>
            </div>

            {/* Search within Allies */}
            <div className="relative">
              <input
                type="text"
                value={allySearchQuery}
                onChange={(e) => setAllySearchQuery(e.target.value)}
                placeholder={isEn ? 'Search allied principalities...' : 'گەڕان بەدوای دەسەڵاتی هاوپەیمان...'}
                className={`w-full pe-8 ps-8 py-1.5 rounded-xl text-xs border focus:outline-none ${
                  isDark
                    ? 'liquid-glass-input text-slate-100 placeholder:text-slate-500 border-white/10'
                    : 'bg-white text-slate-900 placeholder:text-slate-500 border-emerald-300 focus:border-emerald-600'
                }`}
              />
              <Search
                className={`w-3.5 h-3.5 absolute start-2.5 top-2 pointer-events-none ${
                  isDark ? 'text-emerald-400' : 'text-emerald-700'
                }`}
              />
              {allySearchQuery && (
                <button
                  type="button"
                  onClick={() => setAllySearchQuery('')}
                  className={`absolute end-2.5 top-1.5 p-0.5 cursor-pointer ${
                    isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* List of Available Principalities / States to Toggle as Allies */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none max-w-full">
              {filteredCandidateAllies.length === 0 ? (
                <span className={`text-[11px] py-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isEn ? 'No other principalities found' : 'هیچ دەسەڵاتێکی تر نەدۆزرایەوە'}
                </span>
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
                          ? isDark
                            ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 font-bold shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                            : 'preserve-contrast bg-emerald-700 border-emerald-800 text-white font-bold shadow-xs'
                          : isDark
                          ? 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
                          : 'bg-white border-slate-300 text-slate-800 hover:bg-emerald-100/60'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isAlly
                            ? isDark
                              ? 'bg-emerald-400'
                              : 'bg-white'
                            : 'bg-slate-400'
                        }`}
                      />
                      <span className="truncate max-w-[130px]">{ent.name}</span>
                      {isAlly && <Check className={`w-3 h-3 ${isDark ? 'text-emerald-400' : 'text-white'}`} />}
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
              placeholder={
                isEn
                  ? 'Search rulers, scholars, castles, battles, or polities...'
                  : 'گەڕان بەدوای میر، زانا، قەڵا، جەنگ یان دەسەڵات...'
              }
              className={`w-full pe-8 ps-9 py-2 rounded-xl text-xs border focus:outline-none ${
                isDark
                  ? 'liquid-glass-input text-slate-100 placeholder:text-slate-500 border-white/10'
                  : 'bg-slate-50 text-slate-900 placeholder:text-slate-500 border-slate-300 focus:bg-white focus:border-amber-600'
              }`}
            />
            <Search className={`w-4 h-4 absolute start-3 top-2.5 pointer-events-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute end-3 top-2 p-0.5 cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
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
                  ? 'liquid-glass-btn-active font-bold'
                  : isDark
                  ? 'liquid-glass-subtle text-slate-300 hover:text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
              }`}
            >
              {isEn ? 'All' : 'هەموو'}
            </button>
            {categories.filter((c) => c.id !== 'all').map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCatFilter(cat.id)}
                className={`px-2.5 py-1 rounded-lg shrink-0 transition-all cursor-pointer font-medium flex items-center gap-1 ${
                  selectedCatFilter === cat.id
                    ? 'liquid-glass-btn-active font-bold'
                    : isDark
                    ? 'liquid-glass-subtle text-slate-300 hover:text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: getAccessibleCategoryColor(cat.color, isDark) }}
                />
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Facts Checkbox List */}
        <div className="flex-1 overflow-y-auto pe-1 space-y-2 custom-scrollbar min-h-[220px]">
          {filteredCandidates.length === 0 ? (
            <div className={`p-8 text-center text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {isEn
                ? 'No topics matched your search. Try another category or keyword.'
                : 'هیچ بابەتێک بەم ناونیشانە نەدۆزرایەوە. دەتوانیت لە ڕێگەی پۆلێنەکانی ترەوە بگەڕێیت.'}
            </div>
          ) : (
            filteredCandidates.map((f) => {
              const isChecked = selectedIds.includes(f.id);
              const catInfo = getCategoryInfo(f, language);
              const catColor = getAccessibleCategoryColor(catInfo.color, isDark);
              return (
                <div
                  key={f.id}
                  onClick={() => toggleFact(f.id)}
                  className={`p-2.5 sm:p-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-3 border ${
                    isChecked
                      ? isDark
                        ? 'bg-amber-500/15 border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                        : 'bg-amber-50 border-amber-500/70 shadow-xs'
                      : isDark
                      ? 'liquid-glass-subtle border-white/5 hover:border-white/20 text-slate-200'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                        isChecked
                          ? isDark
                            ? 'bg-amber-400 text-black shadow-xs'
                            : 'preserve-contrast bg-amber-700 text-white shadow-xs'
                          : isDark
                          ? 'liquid-glass-btn text-slate-400'
                          : 'bg-white border border-slate-300 text-slate-500'
                      }`}
                    >
                      {isChecked ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        <Square className="w-3.5 h-3.5 opacity-60" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-bold text-xs truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {f.name}
                        </span>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-md font-semibold"
                          style={{
                            backgroundColor: isDark ? `${catInfo.color}20` : `${catColor}14`,
                            color: catColor,
                            border: `1px solid ${catColor}45`,
                          }}
                        >
                          {catInfo.name}
                        </span>
                        {(f.year || f.century) && (
                          <span className={`text-[10px] font-mono ${isDark ? 'text-amber-200/80' : 'text-amber-800'}`}>
                            ({f.year || f.century})
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {f.desc}
                      </p>
                    </div>
                  </div>

                  {isChecked && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                        isDark
                          ? 'text-amber-300 bg-amber-400/10 border-amber-400/30'
                          : 'text-amber-900 bg-amber-100 border-amber-400'
                      }`}
                    >
                      {isEn ? 'Linked ✓' : 'بەستراوەتەوە ✓'}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Action Footer */}
        <div
          className={`flex items-center justify-between gap-3 pt-3 mt-3 border-t shrink-0 ${
            isDark ? 'border-white/10' : 'border-slate-200'
          }`}
        >
          <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {selectedIds.length > 0 ? (
              <span className={`font-bold ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                {isEn
                  ? `${selectedIds.length} topic${selectedIds.length === 1 ? '' : 's'} will be linked`
                  : `${formatDigits(selectedIds.length, language)} بابەت پێوە دەبەسترێتەوە`}
              </span>
            ) : (
              <span>{isEn ? 'No topics selected' : 'هیچ بابەتێک هەڵنەبژێردراوە'}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className={`px-3.5 py-1.5 rounded-xl text-xs cursor-pointer border font-semibold ${
                isDark
                  ? 'liquid-glass-btn text-slate-300 border-white/10'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
            >
              {isEn ? 'Cancel' : 'هەڵوەشاندنەوە'}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl liquid-glass-btn-active font-extrabold text-xs shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>
                {isSaving
                  ? isEn
                    ? 'Saving...'
                    : 'پاشەکەوت دەکرێت...'
                  : isEn
                  ? 'Save Links'
                  : 'پاشەکەوتکردنی بەستنەوەکان'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

