import React, { useState, useEffect } from 'react';
import { FactItem } from '../data/kurdishHistoryData';
import { X, MapPin, Copy, Check, ChevronRight, ChevronLeft, Compass, ExternalLink, Globe, BookOpen, Loader2 } from 'lucide-react';
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

  // Fetch Wikipedia information when fact changes
  useEffect(() => {
    if (!fact) return;

    let isMounted = true;
    setWikiLoading(true);
    setWikiData(null);

    fetchWikipediaFactInfo(fact.id, fact.name, fact.desc)
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
    navigator.clipboard.writeText(`${fact.name}\n${fact.fullText}\nشوێن: ${fact.desc}\nسەرچاوە: نەخشە و ئینسایکلۆپیدیای دەسەڵاتە کوردییەکان`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate fallback Wikipedia search link (ckb.wikipedia.org)
  const cleanSearchTerm = fact.name.replace(/\([^)]*\)/g, '').trim();
  const wikiFallbackUrl = `https://ckb.wikipedia.org/w/index.php?search=${encodeURIComponent(cleanSearchTerm)}`;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-y-auto max-h-[92vh] text-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        {/* Header row */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 font-black text-lg flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              {fact.num}
            </span>
            <div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-amber-500/20">
                {fact.eraName} ({fact.eraPeriod})
              </span>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>{fact.lat.toFixed(2)}° باکوور، {fact.lng.toFixed(2)}° ڕۆژهەڵات</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-4 my-2">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold font-heading text-slate-100 leading-snug">
              {fact.name}
            </h3>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-amber-400">
              <Compass className="w-3.5 h-3.5 shrink-0" />
              <span>پێگەی جوگرافی: {fact.desc}</span>
            </div>
          </div>

          {/* Primary Historical Fact text */}
          <div className="p-4 rounded-2xl bg-slate-850/80 border border-slate-800 text-slate-200 text-sm sm:text-base leading-relaxed">
            <h4 className="text-xs font-bold text-amber-400 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>پوختەی مێژوویی و شوێنەواری:</span>
            </h4>
            <p>{fact.fullText}</p>
          </div>

          {/* Live Wikipedia Section */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-850 border border-slate-700/80 shadow-inner">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-slate-800 text-amber-400 flex items-center justify-center font-serif font-black text-xs border border-slate-700">
                  W
                </div>
                <span className="text-xs font-bold text-slate-200">
                  زانیاری فراوان لە ویکیپیدیای کوردی (Kurdish Wikipedia)
                </span>
              </div>

              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 font-mono border border-slate-700">
                ویکیپیدیای کوردی (ckb)
              </span>
            </div>

            {wikiLoading ? (
              <div className="flex items-center justify-center py-6 gap-2 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                <span>داتای ویکیپیدیای کوردی دەهێنرێت...</span>
              </div>
            ) : wikiData ? (
              <div className="space-y-3">
                {/* Thumbnail if available */}
                <div className="flex flex-col sm:flex-row gap-3 items-start">
                  {wikiData.thumbnail && (
                    <img
                      src={wikiData.thumbnail}
                      alt={wikiData.title}
                      className="w-full sm:w-36 h-28 object-cover rounded-xl border border-slate-700 shadow-md shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-sm text-slate-100 mb-1">
                      {wikiData.title}
                    </h5>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-4">
                      {wikiData.extract}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <a
                    href={wikiData.pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-400 hover:text-amber-300 text-xs font-semibold border border-slate-700 transition-all shadow"
                  >
                    <span>خوێندنەوەی تەواوی وتار لە ویکیپیدیای کوردی</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-2 py-2 text-center sm:text-right">
                <p className="text-xs text-slate-400">
                  بۆ دەستکەوتنی وتار و بەڵگەنامەی مێژوویی زیاتر لەسەر ئەم دەسەڵات یان ناوچەیە، لە ویکیپیدیای کوردی بگەڕێ:
                </p>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
                  <a
                    href={wikiFallbackUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 text-xs font-semibold border border-amber-500/30 transition-all"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>گەڕان لە ویکیپیدیای کوردی (ckb.wikipedia.org)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800/80 mt-5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onFlyToMap(fact);
                onClose();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all"
            >
              <MapPin className="w-4 h-4" />
              <span>نیشاندان لەسەر نەخشە</span>
            </button>

            <button
              onClick={handleCopy}
              className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all flex items-center gap-1.5 text-xs sm:text-sm"
              title="لەبەرگرتنەوەی دەق"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'لەبەرگیرایەوە' : 'لەبەرگرتنەوە'}</span>
            </button>
          </div>

          {/* Prev / Next Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('prev')}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition-all"
            >
              <ChevronRight className="w-4 h-4" />
              <span>پێشوو</span>
            </button>
            <span className="text-xs text-slate-500 font-mono">
              {fact.num} / 200
            </span>
            <button
              onClick={() => onNavigate('next')}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition-all"
            >
              <span>دواتر</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
