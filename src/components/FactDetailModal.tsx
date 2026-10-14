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
  Landmark,
  Calendar,
  ShieldCheck,
  FileText,
  Edit3,
  Save,
  Hourglass,
  Camera,
  Maximize2,
  Image as ImageIcon,
} from 'lucide-react';
import { fetchWikipediaFactInfo, WikipediaResult } from '../services/wikipediaService';

const BATTLE_SCHOLAR_BG = '/src/assets/images/kurd_battle_scholar_bg_1791793720708.jpg';

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

  // Additional Notes Inline Editing state for Admin
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesContent, setNotesContent] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);

  // Fetch Wikipedia or Scholarly Dossier information when fact changes
  useEffect(() => {
    if (!fact) return;

    let isMounted = true;
    setWikiData(null);
    setIsEditingNotes(false);
    setNotesContent(fact.additionalNotes || '');

    fetchWikipediaFactInfo(fact.id, fact.name, fact.desc, fact.fullText)
      .then((res) => {
        if (isMounted) {
          setWikiData(res);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [fact?.id]);

  if (!fact) return null;

  const handleCopyFact = () => {
    navigator.clipboard.writeText(
      `${fact.name}\n${fact.fullText}\nشوێن: ${fact.desc}${
        fact.additionalNotes ? `\nزانیاری زیاتر: ${fact.additionalNotes}` : ''
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
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-[#070b14]/85 border border-amber-500/25 rounded-3xl p-4 sm:p-6 shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_40px_rgba(245,158,11,0.15)] backdrop-blur-2xl overflow-y-auto max-h-[92vh] text-right text-slate-100 overflow-hidden custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Background Layer: Kurdish Battles & Scholars Artwork */}
        <div className="absolute inset-0 pointer-events-none opacity-10 overflow-hidden z-0">
          <img
            src={BATTLE_SCHOLAR_BG}
            alt="Kurdish Battles & Scholars Background"
            className="w-full h-full object-cover object-center filter saturate-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#070b14]/70 via-[#070b14]/90 to-[#070b14]" />
        </div>

        {/* Header row */}
        <div className="relative z-10 flex items-center justify-between gap-3 border-b border-amber-500/20 pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-300 font-mono font-bold text-xs flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.2)] shrink-0">
              #{fact.num}
            </span>
            <div>
              <div className="flex items-center gap-1.5 text-[11px] text-amber-300/80 font-mono">
                <MapPin className="w-3 h-3 text-amber-400" />
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-[11px] font-bold transition-all cursor-pointer backdrop-blur-md"
                title="دەستکاریکردنی ئەم دەسەڵاتە لەلایەن ئەدمینەوە"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>دەستکاریی ئەدمین</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 border border-slate-800 transition-all cursor-pointer"
              title="داخستن"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="relative z-10 space-y-3.5 my-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold font-heading text-white leading-snug">
              {fact.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-amber-200/80">
              <Compass className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>پێگەی جوگرافی: {fact.desc}</span>
            </div>

            {/* Century & Year Historical Time Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs">
              {fact.century && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/50 border border-amber-500/30 text-amber-200 font-bold shadow-xs backdrop-blur-md">
                  <Hourglass className="w-3.5 h-3.5 text-amber-400" />
                  <span>{fact.century}</span>
                </div>
              )}
              {fact.year && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono font-bold shadow-xs backdrop-blur-md">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>{fact.year}</span>
                </div>
              )}
              {fact.eraName && (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/40 border border-slate-700/80 text-slate-300 text-[11px] backdrop-blur-md">
                  <span>{fact.eraName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Custom Topic Image with Small Info / Caption Note */}
          {fact.imageUrl && (
            <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 bg-black/70 shadow-lg group">
              <img
                src={fact.imageUrl}
                alt={fact.imageCaption || fact.name}
                className="w-full h-48 sm:h-60 object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070b14]/90 via-transparent to-black/20 pointer-events-none" />
              {fact.imageCaption && (
                <div className="absolute bottom-2 right-2 left-2 p-2 px-3 rounded-xl bg-[#070b14]/90 border border-amber-500/35 text-amber-200 text-xs backdrop-blur-md flex items-center gap-2 shadow-sm">
                  <Camera className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="font-medium text-[11px] sm:text-xs">{fact.imageCaption}</span>
                </div>
              )}
            </div>
          )}

          {/* Historical Meta Badges if available */}
          {(wikiData?.historicalDates ||
            wikiData?.historicalCapital ||
            wikiData?.historicalDynasty) && (
            <div className="flex flex-wrap gap-2 py-1 text-xs">
              {wikiData.historicalDynasty && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#050812]/60 text-slate-200 border border-amber-500/20 backdrop-blur-md">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>دەسەڵات: {wikiData.historicalDynasty}</span>
                </span>
              )}
              {wikiData.historicalCapital && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#050812]/60 text-slate-200 border border-amber-500/20 backdrop-blur-md">
                  <Landmark className="w-3.5 h-3.5 text-amber-400" />
                  <span>پایتەخت: {wikiData.historicalCapital}</span>
                </span>
              )}
              {wikiData.historicalDates && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#050812]/60 text-slate-200 border border-amber-500/20 backdrop-blur-md">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>مێژوو: {wikiData.historicalDates}</span>
                </span>
              )}
            </div>
          )}

          {/* Primary Historical Fact text */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#050812]/60 border border-amber-500/20 text-slate-200 text-xs sm:text-[13px] leading-relaxed backdrop-blur-md">
            <h4 className="text-xs font-bold text-amber-400 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>پوختەی مێژوویی و شوێنەواری:</span>
            </h4>
            <p className="whitespace-pre-line leading-relaxed">{fact.fullText}</p>
          </div>

          {/* زانیاری زیاتر (Additional Information Box) */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-black/45 border border-amber-500/20 shadow-md space-y-2.5 backdrop-blur-md">
            <div className="flex items-center justify-between pb-1 border-b border-amber-500/15">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>زانیاریی زیاتر، دەستنووس و سەرچاوەکان</span>
              </div>
              <div className="flex items-center gap-1.5">
                {notesSaved && (
                  <span className="text-[10px] text-emerald-400 font-bold">
                    پاشەکەوتکرا! ✓
                  </span>
                )}
                {isAdmin && (
                  <button
                    onClick={() => setIsEditingNotes(!isEditingNotes)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-[10px] font-bold border border-amber-500/30 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isEditingNotes ? 'داخستنی دەستکاری' : 'دەستکاریی تێبینی'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Editing state for Admin */}
            {isEditingNotes ? (
              <div className="space-y-2.5 pt-1">
                <textarea
                  rows={4}
                  value={notesContent}
                  onChange={(e) => setNotesContent(e.target.value)}
                  placeholder="وەک ئەدمین، لێرە زانیاری زیاتر، سەرچاوەی دەستنووس، کورتەی کتێب یان شیکاری بۆ ئەم دەسەڵاتە بنووسە..."
                  className="w-full bg-[#050812] text-slate-100 placeholder:text-slate-500 p-3 rounded-xl border border-amber-500/35 focus:border-amber-400 focus:outline-none text-xs leading-relaxed"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setIsEditingNotes(false);
                      setNotesContent(fact.additionalNotes || '');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs"
                  >
                    هەڵوەشاندنەوە
                  </button>
                  <button
                    onClick={handleSaveNotesInline}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs shadow-sm transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>پاشەکەوتکردن</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Display state */
              <div>
                {fact.additionalNotes && fact.additionalNotes.trim() ? (
                  <div className="p-3 rounded-xl bg-[#050812]/50 border border-amber-500/15 text-slate-200 text-xs leading-relaxed whitespace-pre-line font-sans">
                    {fact.additionalNotes}
                  </div>
                ) : (
                  <div className="py-3 px-3.5 rounded-xl bg-[#050812]/40 border border-slate-800/80 text-slate-400 text-xs leading-relaxed">
                    {isAdmin ? (
                      <div className="flex items-center justify-between">
                        <span>هێشتا زانیاری زیاتر بۆ ئەم بابەتە نەنووسراوە.</span>
                        <button
                          onClick={() => setIsEditingNotes(true)}
                          className="text-xs text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                        >
                          تۆمارکردنی زانیاری زیاتر
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

        {/* Action Buttons Footer */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-amber-500/20 mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                onFlyToMap(fact);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all cursor-pointer active:scale-95"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>نیشاندان لە نەخشە</span>
            </button>

            <button
              onClick={handleCopyFact}
              className="px-3 py-2 rounded-xl bg-black/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all flex items-center gap-1.5 text-xs cursor-pointer"
              title="لەبەرگرتنەوە"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>{copied ? 'کۆپیکرا' : 'کۆپی'}</span>
            </button>
          </div>

          {/* Prev / Next Navigation with total count */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onNavigate('prev')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#050812]/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-amber-500/20 text-xs font-semibold transition-all cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              <span>پێشوو</span>
            </button>
            <span className="text-xs text-amber-300 font-mono px-1 font-bold">
              {fact.num}/{totalFactsCount}
            </span>
            <button
              onClick={() => onNavigate('next')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#050812]/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-amber-500/20 text-xs font-semibold transition-all cursor-pointer"
            >
              <span>دواتر</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
