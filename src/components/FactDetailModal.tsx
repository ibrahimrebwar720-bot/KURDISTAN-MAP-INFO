import React, { useState, useEffect } from 'react';
import { FactItem } from '../data/kurdishHistoryData';
import { X, MapPin, Copy, Check, ChevronRight, ChevronLeft, Compass, ExternalLink, BookOpen, Loader2, Landmark, Calendar, ShieldCheck } from 'lucide-react';
import { fetchWikipediaFactInfo, WikipediaResult } from '../services/wikipediaService';

interface Props {
  fact: FactItem | null;
  onClose: () => void;
  onNavigate: (dir: 'next' | 'prev') => void;
  onFlyToMap: (fact: FactItem) => void;
}

export const FactDetailModal: React.FC<Props> = ({
  fact,
  onClose,
  onNavigate,
  onFlyToMap,
}) => {
  const [copied, setCopied] = useState(false);
  const [wikiData, setWikiData] = useState<WikipediaResult | null>(null);
  const [wikiLoading, setWikiLoading] = useState(false);
  const [showEnglishText, setShowEnglishText] = useState(false);

  // Fetch Wikipedia or Scholarly Dossier information when fact changes
  useEffect(() => {
    if (!fact) return;

    let isMounted = true;
    setWikiLoading(true);
    setWikiData(null);
    setShowEnglishText(false);

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

  const handleCopy = () => {
    navigator.clipboard.writeText(`${fact.name}\n${fact.fullText}\nشوێن: ${fact.desc}\nسەرچاوە: ئینسایکلۆپیدیای مێژووی کوردستان`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-2 sm:p-3 bg-black/80 backdrop-blur-xs animate-fade-in">
      <div
        className="relative w-full max-w-lg bg-black border border-indigo-950 rounded-xl p-3.5 sm:p-4 shadow-[0_0_60px_rgba(15,10,40,0.95)] overflow-y-auto max-h-[90vh] text-right"
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
                <span>{fact.lat.toFixed(2)}° N, {fact.lng.toFixed(2)}° E</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-indigo-400 hover:text-white hover:bg-indigo-950/60 transition-all"
            title="داخستن"
          >
            <X className="w-4 h-4" />
          </button>
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
          </div>

          {/* Historical Meta Badges if available */}
          {(wikiData?.historicalDates || wikiData?.historicalCapital || wikiData?.historicalDynasty) && (
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

          {/* Verified Encyclopedia & Multi-Source Section */}
          <div className="p-2.5 rounded-lg bg-black border border-indigo-950/90">
            <div className="flex items-center justify-between gap-1.5 border-b border-indigo-950/80 pb-1.5 mb-2">
              <div className="flex items-center justify-between w-full">
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
                    {wikiData.sourceType === 'academic_encyclopedia' ? 'سەرچاوەی مێژوویی' : wikiData.lang.toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {wikiLoading ? (
              <div className="flex items-center justify-center py-4 gap-1.5 text-[10px] text-indigo-400">
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
                  <div className="p-2 rounded bg-[#030712] border border-indigo-950 text-left" dir="ltr">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1 mb-1 border-b border-indigo-950">
                      <span className="font-mono text-indigo-400">English Wikipedia Source Article</span>
                      <button
                        onClick={() => setShowEnglishText(!showEnglishText)}
                        className="text-[9px] text-indigo-300 hover:text-white underline cursor-pointer"
                      >
                        {showEnglishText ? 'Hide' : 'Show full English text'}
                      </button>
                    </div>
                    <p className={`text-[10px] text-slate-400 font-serif leading-relaxed ${showEnglishText ? '' : 'line-clamp-2'}`}>
                      {wikiData.englishExtract}
                    </p>
                  </div>
                )}

                {/* Bibliographic References */}
                {wikiData.references && wikiData.references.length > 0 && (
                  <div className="pt-1.5 border-t border-indigo-950 text-[10px]">
                    <span className="font-bold text-indigo-400 block mb-1">سەرچاوە و بەڵگەنامە باوەڕپێکراوەکان:</span>
                    <ul className="list-disc list-inside text-indigo-200/70 space-y-0.5 text-[9px]">
                      {wikiData.references.map((ref, idx) => (
                        <li key={idx}>{ref}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* External Research Links (Kurdipedia, Iranica, Wikipedia) */}
                <div className="pt-1.5 border-t border-indigo-950 flex flex-wrap gap-1.5 justify-end">
                  {wikiData.externalLinks?.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black hover:bg-indigo-950 text-indigo-300 text-[9px] font-medium border border-indigo-900/50 hover:border-indigo-500 transition-all"
                    >
                      <span>{link.name}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
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
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] shadow-[0_0_12px_rgba(79,70,229,0.3)] transition-all"
            >
              <MapPin className="w-3 h-3" />
              <span>نیشاندان لە نەخشە</span>
            </button>

            <button
              onClick={handleCopy}
              className="p-1 rounded-md bg-black hover:bg-indigo-950 text-indigo-300 border border-indigo-950 transition-all flex items-center gap-1 text-[10px]"
              title="لەبەرگرتنەوە"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span className="hidden sm:inline">{copied ? 'کۆپیکرا' : 'کۆپی'}</span>
            </button>
          </div>

          {/* Prev / Next Navigation with total count 350 */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onNavigate('prev')}
              className="flex items-center gap-0.5 px-2 py-1 rounded-md bg-black hover:bg-indigo-950 text-indigo-300 border border-indigo-950 text-[10px] font-medium transition-all"
            >
              <ChevronRight className="w-3 h-3" />
              <span>پێشوو</span>
            </button>
            <span className="text-[10px] text-indigo-400/80 font-mono px-0.5 font-bold">
              {fact.num}/350
            </span>
            <button
              onClick={() => onNavigate('next')}
              className="flex items-center gap-0.5 px-2 py-1 rounded-md bg-black hover:bg-indigo-950 text-indigo-300 border border-indigo-950 text-[10px] font-medium transition-all"
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
