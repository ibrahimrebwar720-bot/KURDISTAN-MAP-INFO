import React, { useState, useEffect } from 'react';
import { FactItem } from '../data/kurdishHistoryData';
import {
  X,
  MapPin,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  Compass,
  BookOpen,
  Loader2,
  Landmark,
  Calendar,
  ShieldCheck,
  FileText,
  Edit3,
  Save,
  Layers,
  Hourglass,
} from 'lucide-react';
import { fetchWikipediaFactInfo, WikipediaResult } from '../services/wikipediaService';

interface Props {
  fact: FactItem | null;
  onClose: () => void;
  onNavigate: (dir: 'next' | 'prev') => void;
  onFlyToMap: (fact: FactItem) => void;
  isAdmin?: boolean;
  onEditFact?: (fact: FactItem) => void;
  onSaveNotes?: (factId: number, notes: string) => void;
  totalFactsCount?: number;
}

export const FactDetailModal: React.FC<Props> = ({
  fact,
  onClose,
  onNavigate,
  onFlyToMap,
  isAdmin = false,
  onEditFact,
  onSaveNotes,
  totalFactsCount = 350,
}) => {
  const [copied, setCopied] = useState(false);
  const [wikiData, setWikiData] = useState<WikipediaResult | null>(null);
  const [wikiLoading, setWikiLoading] = useState(false);
  const [showEnglishText, setShowEnglishText] = useState(false);

  // Additional Notes Inline Editing state for Admin
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesContent, setNotesContent] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);

  // Fetch Wikipedia or Scholarly Dossier information when fact changes
  useEffect(() => {
    if (!fact) return;

    let isMounted = true;
    setWikiLoading(true);
    setWikiData(null);
    setShowEnglishText(false);
    setIsEditingNotes(false);
    setNotesContent(fact.additionalNotes || '');

    fetchWikipediaFactInfo(fact.id, fact.name, fact.desc, fact.fullText)
      .then((res) => {
        if (isMounted) {
          setWikiData(res);
          setWikiLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setWikiLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [fact?.id]);

  if (!fact) return null;

  const handleCopyFact = () => {
    navigator.clipboard.writeText(
      `${fact.name}\n${fact.fullText}\nشوێن: ${fact.desc}${
        fact.additionalNotes ? `\nزانیاری زیادە: ${fact.additionalNotes}` : ''
      }\nسەرچاوە: ئینسایکلۆپیدیای دەسەڵاتە کوردییەکان`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveNotesInline = () => {
    if (onSaveNotes) {
      onSaveNotes(fact.id, notesContent);
      setNotesSaved(true);
      setIsEditingNotes(false);
      setTimeout(() => setNotesSaved(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-2 sm:p-3 bg-black/85 backdrop-blur-xs animate-fade-in">
      <div
        className="relative w-full max-w-lg bg-black border border-indigo-950 rounded-xl p-3.5 sm:p-4 shadow-[0_0_60px_rgba(15,10,40,0.95)] overflow-y-auto max-h-[92vh] text-right text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header row */}
        <div className="flex items-center justify-between gap-2 border-b border-indigo-950 pb-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center shadow-[0_0_12px_rgba(79,70,229,0.4)] shrink-0">
              #{fact.num}
            </span>
            <div>
              <div className="flex items-center gap-1 text-[10px] text-indigo-300 font-mono">
                <MapPin className="w-2.5 h-2.5 text-indigo-400" />
                <span>
                  {Number.isFinite(fact.lat) ? fact.lat.toFixed(2) : '36.80'}° N,{' '}
                  {Number.isFinite(fact.lng) ? fact.lng.toFixed(2) : '44.50'}° E
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isAdmin && onEditFact && (
              <button
                onClick={() => onEditFact(fact)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-200 text-[10px] font-bold transition-all cursor-pointer"
                title="دەستکاریکردنی ئەم دەسەڵاتە لەلایەن ئەدمینەوە"
              >
                <Edit3 className="w-3 h-3 text-indigo-400" />
                <span>دەستکاریی ئەدمین</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-indigo-400 hover:text-white hover:bg-indigo-950/60 transition-all cursor-pointer"
              title="داخستن"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-2.5 my-1.5">
          <div>
            <h3 className="text-sm sm:text-base font-bold font-heading text-white leading-snug">
              {fact.name}
            </h3>
            <div className="flex items-center gap-1 mt-0.5 text-[11px] text-indigo-300/80">
              <Compass className="w-3 h-3 shrink-0 text-indigo-400" />
              <span>پێگەی جوگرافی: {fact.desc}</span>
            </div>

            {/* Century & Year Historical Time Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
              {fact.century && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/90 border border-purple-600/70 text-purple-200 font-bold shadow-[0_0_15px_rgba(168,85,247,0.25)]">
                  <Hourglass className="w-3.5 h-3.5 text-purple-400" />
                  <span>{fact.century}</span>
                </div>
              )}
              {fact.year && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/90 border border-amber-600/70 text-amber-200 font-mono font-bold shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>{fact.year}</span>
                </div>
              )}
              {fact.eraName && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-950/80 border border-indigo-800/50 text-indigo-300 text-[10px]">
                  <span>{fact.eraName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Historical Meta Badges if available */}
          {(wikiData?.historicalDates ||
            wikiData?.historicalCapital ||
            wikiData?.historicalDynasty) && (
            <div className="flex flex-wrap gap-1.5 py-1 text-[10px]">
              {wikiData.historicalDynasty && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/40">
                  <ShieldCheck className="w-2.5 h-2.5 text-indigo-400" />
                  <span>دەسەڵات: {wikiData.historicalDynasty}</span>
                </span>
              )}
              {wikiData.historicalCapital && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/40">
                  <Landmark className="w-2.5 h-2.5 text-indigo-400" />
                  <span>پایتەخت: {wikiData.historicalCapital}</span>
                </span>
              )}
              {wikiData.historicalDates && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/40">
                  <Calendar className="w-2.5 h-2.5 text-indigo-400" />
                  <span>مێژوو: {wikiData.historicalDates}</span>
                </span>
              )}
            </div>
          )}

          {/* Primary Historical Fact text */}
          <div className="p-2.5 rounded-lg bg-[#030712] border border-indigo-950/80 text-slate-200 text-xs leading-relaxed">
            <h4 className="text-[11px] font-bold text-indigo-400 mb-1 flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              <span>پوختەی مێژوویی و شوێنەواری:</span>
            </h4>
            <p>{fact.fullText}</p>
          </div>

          {/* Encyclopedia Text Section */}
          <div className="p-2.5 rounded-lg bg-black border border-indigo-950/90 space-y-2">
            <div className="flex items-center justify-between gap-1.5 border-b border-indigo-950/80 pb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-indigo-950 text-indigo-300 flex items-center justify-center font-serif font-bold text-[9px] border border-indigo-800/40">
                  {wikiData?.sourceType === 'academic_encyclopedia' ? '📜' : 'W'}
                </span>
                <span className="text-[10px] font-bold text-slate-200">
                  {wikiData?.sourceName || 'ئینسایکلۆپیدیای مێژووی کوردستان'}
                </span>
              </div>
              {wikiData && (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/40">
                  {wikiData.sourceType === 'academic_encyclopedia'
                    ? 'بەڵگەنامە'
                    : wikiData.lang.toUpperCase()}
                </span>
              )}
            </div>

            {wikiLoading ? (
              <div className="flex items-center justify-center py-3 gap-1.5 text-[10px] text-indigo-400">
                <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />
                <span>داتای مێژوویی دەهێنرێت...</span>
              </div>
            ) : wikiData ? (
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2 items-start">
                  {wikiData.thumbnail && (
                    <img
                      src={wikiData.thumbnail}
                      alt={wikiData.title}
                      className="w-full sm:w-24 h-20 object-cover rounded border border-indigo-950 shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0 text-right" dir="rtl">
                    <h5 className="font-bold text-xs text-white mb-0.5">
                      {wikiData.title}
                    </h5>
                    <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-line">
                      {wikiData.extract}
                    </p>
                  </div>
                </div>

                {/* Original English Text Toggle if available */}
                {wikiData.englishExtract && (
                  <div
                    className="p-2 rounded bg-[#030712] border border-indigo-950 text-left"
                    dir="ltr"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1 mb-1 border-b border-indigo-950">
                      <span className="font-mono text-indigo-400">
                        English Wikipedia Source
                      </span>
                      <button
                        onClick={() => setShowEnglishText(!showEnglishText)}
                        className="text-[9px] text-indigo-300 hover:text-white underline cursor-pointer"
                      >
                        {showEnglishText ? 'Hide' : 'Show full English text'}
                      </button>
                    </div>
                    <p
                      className={`text-[10px] text-slate-400 font-serif leading-relaxed ${
                        showEnglishText ? '' : 'line-clamp-2'
                      }`}
                    >
                      {wikiData.englishExtract}
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* NEW: بۆکسی زانیاریی زیادە (Additional Information Box - Replaced Gemini) */}
          <div className="p-3 rounded-xl bg-gradient-to-b from-[#060a1c] to-black border border-indigo-900/70 shadow-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>بۆکسی زانیاریی زیادە</span>
              </div>
              <div className="flex items-center gap-1">
                {notesSaved && (
                  <span className="text-[9px] text-emerald-400 font-medium">
                    پاشەکەوتکرا! ✓
                  </span>
                )}
                {isAdmin && (
                  <button
                    onClick={() => setIsEditingNotes(!isEditingNotes)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-950 hover:bg-indigo-900 text-indigo-300 hover:text-white text-[9px] border border-indigo-800/50 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-2.5 h-2.5" />
                    <span>{isEditingNotes ? 'داخستنی دەستکاری' : 'دەستکاریی تێبینی'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Editing state for Admin */}
            {isEditingNotes ? (
              <div className="space-y-2 pt-1">
                <textarea
                  rows={4}
                  value={notesContent}
                  onChange={(e) => setNotesContent(e.target.value)}
                  placeholder="وەک ئەدمین، لێرە زانیاریی زیادە، سەرچاوەی دەستنووس، کورتەی کتێب یان شیکاری بۆ ئەم دەسەڵاتە بنووسە..."
                  className="w-full bg-[#030712] text-slate-100 placeholder:text-indigo-400/40 p-2.5 rounded-lg border border-indigo-700/60 focus:border-amber-400 focus:outline-none text-xs leading-relaxed"
                />
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => {
                      setIsEditingNotes(false);
                      setNotesContent(fact.additionalNotes || '');
                    }}
                    className="px-2.5 py-1 rounded-md bg-black text-indigo-300 text-[10px]"
                  >
                    هەڵوەشاندنەوە
                  </button>
                  <button
                    onClick={handleSaveNotesInline}
                    className="flex items-center gap-1 px-3 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] shadow-sm transition-all cursor-pointer"
                  >
                    <Save className="w-3 h-3" />
                    <span>پاشەکەوتکردن</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Display state */
              <div>
                {fact.additionalNotes && fact.additionalNotes.trim() ? (
                  <div className="p-2.5 rounded-lg bg-black/80 border border-indigo-950/80 text-indigo-100 text-xs leading-relaxed whitespace-pre-line font-sans">
                    {fact.additionalNotes}
                  </div>
                ) : (
                  <div className="py-2.5 px-3 rounded-lg bg-black/60 border border-indigo-950/60 text-indigo-300/60 text-[11px] leading-relaxed">
                    {isAdmin ? (
                      <div className="flex items-center justify-between">
                        <span>هێشتا زانیاریی زیادە بۆ ئەم بابەتە نەنووسراوە.</span>
                        <button
                          onClick={() => setIsEditingNotes(true)}
                          className="text-[10px] text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
                        >
                          تۆمارکردنی زانیاری زیادە
                        </button>
                      </div>
                    ) : (
                      <span>
                        زانیارییە سەرەکییەکان لە بەشەکانی سەرەوە خراونەتەڕوو. ئەدمین دەتوانێت لەم بەشەدا بەڵگەنامە و تێبینی نوێ تۆمار بکات.
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-indigo-950 mt-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                onFlyToMap(fact);
                onClose();
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] shadow-[0_0_12px_rgba(79,70,229,0.3)] transition-all cursor-pointer"
            >
              <MapPin className="w-3 h-3" />
              <span>نیشاندان لە نەخشە</span>
            </button>

            <button
              onClick={handleCopyFact}
              className="p-1 rounded-md bg-black hover:bg-indigo-950 text-indigo-300 border border-indigo-950 transition-all flex items-center gap-1 text-[10px] cursor-pointer"
              title="لەبەرگرتنەوە"
            >
              {copied ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              <span className="hidden sm:inline">{copied ? 'کۆپیکرا' : 'کۆپی'}</span>
            </button>
          </div>

          {/* Prev / Next Navigation with total count */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onNavigate('prev')}
              className="flex items-center gap-0.5 px-2 py-1 rounded-md bg-black hover:bg-indigo-950 text-indigo-300 border border-indigo-950 text-[10px] font-medium transition-all cursor-pointer"
            >
              <ChevronRight className="w-3 h-3" />
              <span>پێشوو</span>
            </button>
            <span className="text-[10px] text-indigo-400/80 font-mono px-0.5 font-bold">
              {fact.num}/{totalFactsCount}
            </span>
            <button
              onClick={() => onNavigate('next')}
              className="flex items-center gap-0.5 px-2 py-1 rounded-md bg-black hover:bg-indigo-950 text-indigo-300 border border-indigo-950 text-[10px] font-medium transition-all cursor-pointer"
            >
              <span>دواتر</span>
              <ChevronLeft className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
