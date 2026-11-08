import React, { useState } from 'react';
import {
  X,
  ImagePlus,
  Link2,
  Check,
  Clipboard,
  AlertCircle,
  Loader2,
  User,
  FileText,
  Sparkles,
} from 'lucide-react';
import { FactItem } from '../data/kurdishHistoryData';
import { submitPhotoSuggestion } from '../services/firestoreHistoryService';

interface SubmitPhotoModalProps {
  fact: FactItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SubmitPhotoModal: React.FC<SubmitPhotoModalProps> = ({
  fact,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [url, setUrl] = useState('');
  const [senderName, setSenderName] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live image preview test state
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [pastedFeedback, setPastedFeedback] = useState(false);

  if (!isOpen) return null;

  const handlePaste = async () => {
    try {
      if (navigator?.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setUrl(text.trim());
          setPreviewLoaded(false);
          setPreviewError(false);
          setPastedFeedback(true);
          setTimeout(() => setPastedFeedback(false), 2000);
        }
      }
    } catch {
      // ignore clipboard permission error
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = url.trim();

    if (!cleanUrl) {
      setError('تکایە بەستەری (لینکی) وێنەکە بنووسە یان پێستی بکە.');
      return;
    }

    if (cleanUrl.startsWith('data:')) {
      setError('تکایە بەستەری ڕاستەقینەی سەر وێب دابنێ (http یان https) نەک کۆدی فایل.');
      return;
    }

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      setError('دەبێت بەستەرەکە بە http:// یان https:// دەستپێبکات.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await submitPhotoSuggestion({
        factId: fact.id,
        factName: fact.name,
        imageUrl: cleanUrl,
        senderName: senderName.trim() || undefined,
        note: note.trim() || undefined,
      });

      setIsSubmitted(true);
      if (onSuccess) onSuccess();

      setTimeout(() => {
        onClose();
        setIsSubmitted(false);
        setUrl('');
        setSenderName('');
        setNote('');
      }, 2600);
    } catch (err) {
      console.error('Failed to submit photo suggestion:', err);
      setError('نەتوانرا بنێردرێت، تکایە دڵنیابە لە هێڵی ئینتەرنێت و دووبارە تاقی بکەرەوە.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in text-right">
      <div
        className="relative w-full max-w-lg rounded-3xl bg-slate-950/95 border border-amber-500/40 p-5 sm:p-6 shadow-[0_25px_60px_-15px_rgba(245,158,11,0.25)] text-white overflow-hidden animate-scale-up"
        dir="rtl"
      >
        {/* Glow ambient background decoration */}
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex items-start justify-between gap-3 border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <ImagePlus className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black font-heading text-white tracking-wide">
                یارمەتی <span className="text-amber-400">kurdistan info map</span> بدە بۆ ناردنی لینکی وێنە
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                ناردنی پێشنیاری وێنەی شایستە و مێژوویی بۆ ئەم بابەتە
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white bg-white/5 hover:bg-white/15 transition-all cursor-pointer border border-white/10"
            title="داخستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSubmitted ? (
          /* Success Screen */
          <div className="relative z-10 py-8 flex flex-col items-center justify-center text-center space-y-3 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.4)] animate-bounce">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <h3 className="text-lg font-black font-heading text-emerald-300">
              دەستت خۆش بێت! وێنەکە بە سەرکەوتوویی نێردرا
            </h3>
            <p className="text-xs text-slate-300 max-w-sm leading-relaxed">
              لینکی وێنەکەت گەیشتە بەشی ئەدمینی <strong className="text-amber-400">kurdistan info map</strong>، دوای پێداچوونەوە ڕاستەوخۆ لەسەر بابەتی <span className="text-white font-bold">«{fact.name}»</span> بڵاو دەکرێتەوە.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-amber-400/90 pt-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>سوپاس بۆ بەشداریت لە دەوڵەمەندکردنی مێژووی کوردستان</span>
            </div>
          </div>
        ) : (
          /* Form Body */
          <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
            {/* Fact Target Info Box */}
            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                  بابەتی مەبەست
                </span>
                <h4 className="text-sm font-extrabold text-white">
                  {fact.name}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {fact.desc} {fact.century ? `· ${fact.century}` : ''}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold shrink-0">
                بێ وێنەیە
              </span>
            </div>

            {/* Error Message if any */}
            {error && (
              <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Image URL Input with Paste Button */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>لینکی وێنەکە (URL) *</span>
                </label>
                <button
                  type="button"
                  onClick={handlePaste}
                  className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 px-2.5 py-0.5 rounded-lg border border-amber-400/25 transition-all cursor-pointer"
                  title="لەبەرگیراوە لە کلیپبۆردەوە دابنێ"
                >
                  {pastedFeedback ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-300">دانرا!</span>
                    </>
                  ) : (
                    <>
                      <Clipboard className="w-3 h-3" />
                      <span>پێستکردن (Paste)</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setPreviewLoaded(false);
                    setPreviewError(false);
                    setError(null);
                  }}
                  placeholder="https://example.com/image.jpg"
                  required
                  dir="ltr"
                  className="w-full h-10 px-3.5 rounded-xl bg-black/60 border border-white/20 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white placeholder-slate-500 text-xs font-mono transition-all outline-hidden text-left"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                دەتوانیت بەستەری وێنە لە ویکیپیدیا، گووگڵ، یان هەر ماڵپەڕێکی متمانەپێکراو کۆپی بکەیت و لێرە دایبنێیت.
              </p>
            </div>

            {/* Live Image Preview if URL provided */}
            {url.trim().length > 10 && (
              <div className="p-2.5 rounded-2xl bg-black/70 border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-300 font-bold">
                  <span>پێشبینینی وێنەکە:</span>
                  {previewLoaded && !previewError && (
                    <span className="text-emerald-400 flex items-center gap-1 text-[10px]">
                      <Check className="w-3 h-3" /> وێنەکە کار دەکات
                    </span>
                  )}
                  {previewError && (
                    <span className="text-rose-400 flex items-center gap-1 text-[10px]">
                      <AlertCircle className="w-3 h-3" /> نەتوانرا وێنەکە باربکرێت
                    </span>
                  )}
                </div>

                <div className="relative w-full h-36 rounded-xl overflow-hidden bg-black/90 flex items-center justify-center border border-white/10">
                  <img
                    src={url.trim()}
                    alt="پێشبینینی وێنە"
                    onLoad={() => {
                      setPreviewLoaded(true);
                      setPreviewError(false);
                    }}
                    onError={() => {
                      setPreviewError(true);
                      setPreviewLoaded(false);
                    }}
                    className={`max-h-full max-w-full object-contain transition-all duration-300 ${
                      previewLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                    }`}
                  />
                  {!previewLoaded && !previewError && (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs gap-1.5">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                      <span>پشکنینی وێنە...</span>
                    </div>
                  )}
                  {previewError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-rose-400 text-xs p-2 text-center gap-1">
                      <AlertCircle className="w-5 h-5 text-rose-500" />
                      <span className="font-semibold">لینکی وێنەکە ڕاستەوخۆ ناکرێتەوە</span>
                      <span className="text-[10px] text-slate-400">دڵنیابە بەستەرەکە ڕاستەوخۆ بە .jpg، .png یان وێب دەبێتەوە</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sender Name (Optional) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>ناوی بەڕێزت (ئارەزوومەندانە)</span>
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="بۆ نموونە: ئارام محەمەد"
                className="w-full h-9.5 px-3 rounded-xl bg-black/50 border border-white/15 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white placeholder-slate-500 text-xs transition-all outline-hidden"
              />
            </div>

            {/* Note or Source Citation (Optional) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>تێبینی یان سەرچاوەی وێنە (ئارەزوومەندانە)</span>
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="سەرچاوەی وێنە یان شوێنی دۆزینەوە"
                className="w-full h-9.5 px-3 rounded-xl bg-black/50 border border-white/15 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white placeholder-slate-500 text-xs transition-all outline-hidden"
              />
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
              >
                پاشگەزبوونەوە
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !url.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>ناردن...</span>
                  </>
                ) : (
                  <>
                    <ImagePlus className="w-4 h-4 stroke-[2.5]" />
                    <span>ناردنی وێنە بۆ ئادمین</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
