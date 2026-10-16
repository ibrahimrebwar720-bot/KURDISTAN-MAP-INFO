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
  Images,
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
  onOpenGallery?: () => void;
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
  onOpenGallery,
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
      className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl liquid-glass-panel rounded-3xl p-4 sm:p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_25px_80px_rgba(0,0,0,0.95),0_0_40px_rgba(245,158,11,0.2)] overflow-y-auto max-h-[92vh] text-right text-slate-100 overflow-hidden custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
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

        {/* Header row */}
        <div className="relative z-10 flex items-center justify-between gap-3 border-b border-white/10 pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl liquid-glass-btn text-amber-300 font-mono font-bold text-xs flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.2)] shrink-0">
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-glass-btn text-amber-300 text-[11px] font-bold transition-all cursor-pointer"
                title="دەستکاریکردنی ئەم دەسەڵاتە لەلایەن ئەدمینەوە"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>دەستکاریی ئەدمین</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-white liquid-glass-btn transition-all cursor-pointer"
              title="داخستن"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="relative z-10 space-y-3.5 my-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold font-heading text-white leading-snug drop-shadow-xs">
              {fact.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-amber-200/90 font-medium">
              <Compass className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>پێگەی جوگرافی: {fact.desc}</span>
            </div>

            {/* Century & Year Historical Time Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs">
              {fact.century && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl liquid-glass-subtle text-amber-200 font-bold shadow-xs">
                  <Hourglass className="w-3.5 h-3.5 text-amber-400" />
                  <span>{fact.century}</span>
                </div>
              )}
              {fact.year && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl liquid-glass-btn text-amber-300 font-mono font-bold shadow-xs">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>{fact.year}</span>
                </div>
              )}
              {fact.eraName && (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl liquid-glass-subtle text-slate-300 text-[11px]">
                  <span>{fact.eraName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Custom Topic Image in True Aspect Ratio (بە قیاسی تەواو بێ بڕین) */}
          {fact.imageUrl && (
            <div className="relative rounded-2xl overflow-hidden border border-amber-500/35 bg-black/90 shadow-xl group flex flex-col items-center justify-center p-1.5 sm:p-2">
              <img
                src={fact.imageUrl}
                alt={fact.imageCaption || fact.name}
                className="max-h-72 sm:max-h-80 max-w-full w-auto h-auto object-contain mx-auto rounded-xl group-hover:scale-[1.01] transition-transform duration-300 shadow-md"
              />
              {fact.imageCaption && (
                <div className="w-full mt-2 p-2 px-3 rounded-xl liquid-glass-subtle text-amber-200 text-xs flex items-center justify-between gap-2 shadow-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <Camera className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-medium text-[11px] sm:text-xs truncate">{fact.imageCaption}</span>
                  </div>
                  {onOpenGallery && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                        onOpenGallery();
                      }}
                      className="px-2.5 py-1 rounded-lg liquid-glass-btn text-amber-300 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                      title="کردنەوە لە بەشی گەلەری"
                    >
                      <Images className="w-3 h-3" />
                      <span>گەلەری</span>
                    </button>
                  )}
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
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl liquid-glass-subtle text-slate-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>دەسەڵات: {wikiData.historicalDynasty}</span>
                </span>
              )}
              {wikiData.historicalCapital && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl liquid-glass-subtle text-slate-200">
                  <Landmark className="w-3.5 h-3.5 text-amber-400" />
                  <span>پایتەخت: {wikiData.historicalCapital}</span>
                </span>
              )}
              {wikiData.historicalDates && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl liquid-glass-subtle text-slate-200">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>مێژوو: {wikiData.historicalDates}</span>
                </span>
              )}
            </div>
          )}

          {/* Primary Historical Fact text */}
          <div className="p-3.5 sm:p-4 rounded-2xl liquid-glass-card text-slate-200 text-xs sm:text-[13px] leading-relaxed shadow-sm">
            <h4 className="text-xs font-bold text-amber-400 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>پوختەی مێژوویی و شوێنەواری:</span>
            </h4>
            <p className="whitespace-pre-line leading-relaxed">{fact.fullText}</p>
          </div>

          {/* زانیاری زیاتر (Additional Information Box) */}
          <div className="p-3.5 sm:p-4 rounded-2xl liquid-glass-card shadow-md space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-white/10">
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
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg liquid-glass-btn text-amber-300 text-[10px] font-bold transition-colors cursor-pointer"
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
                  className="w-full liquid-glass-input text-slate-100 placeholder:text-slate-500 p-3 rounded-xl text-xs leading-relaxed"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setIsEditingNotes(false);
                      setNotesContent(fact.additionalNotes || '');
                    }}
                    className="px-3 py-1.5 rounded-xl liquid-glass-btn text-slate-300 text-xs cursor-pointer"
                  >
                    هەڵوەشاندنەوە
                  </button>
                  <button
                    onClick={handleSaveNotesInline}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl liquid-glass-btn-active text-slate-950 font-extrabold text-xs shadow-sm transition-all cursor-pointer"
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
                  <div className="p-3 rounded-xl liquid-glass-subtle text-slate-200 text-xs leading-relaxed whitespace-pre-line font-sans">
                    {fact.additionalNotes}
                  </div>
                ) : (
                  <div className="py-3 px-3.5 rounded-xl liquid-glass-subtle text-slate-400 text-xs leading-relaxed">
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
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-white/10 mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                onFlyToMap(fact);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl liquid-glass-btn-active text-slate-950 font-extrabold text-xs shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all cursor-pointer active:scale-95"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>نیشاندان لە نەخشە</span>
            </button>

            <button
              onClick={handleCopyFact}
              className="px-3 py-2 rounded-xl liquid-glass-btn text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs cursor-pointer"
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
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl liquid-glass-btn text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              <span>پێشوو</span>
            </button>
            <span className="text-xs text-amber-300 font-mono px-1 font-bold">
              {fact.num}/{totalFactsCount}
            </span>
            <button
              onClick={() => onNavigate('next')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl liquid-glass-btn text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
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
