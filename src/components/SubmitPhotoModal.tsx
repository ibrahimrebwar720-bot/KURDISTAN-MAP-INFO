import React, { useState, useEffect, useRef } from 'react';
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
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

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
  const { isEn, dir } = useLanguage();
  const { colorMode } = useTheme();
  const isDark = colorMode === 'dark';
  const [url, setUrl] = useState('');
  const [senderName, setSenderName] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [pastedFeedback, setPastedFeedback] = useState(false);
  const pasteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submitCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (submitCloseTimerRef.current) {
        clearTimeout(submitCloseTimerRef.current);
        submitCloseTimerRef.current = null;
      }
      setUrl('');
      setSenderName('');
      setNote('');
      setIsSubmitting(false);
      setIsSubmitted(false);
      setError(null);
      setPreviewLoaded(false);
      setPreviewError(false);
      setPastedFeedback(false);
    } else {
      setError(null);
      setIsSubmitted(false);
      setPreviewLoaded(false);
      setPreviewError(false);
    }
  }, [isOpen, fact.id]);

  useEffect(() => {
    return () => {
      if (pasteTimerRef.current) clearTimeout(pasteTimerRef.current);
      if (submitCloseTimerRef.current) clearTimeout(submitCloseTimerRef.current);
    };
  }, []);

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
          if (pasteTimerRef.current) clearTimeout(pasteTimerRef.current);
          pasteTimerRef.current = setTimeout(() => setPastedFeedback(false), 2000);
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
      setError(
        isEn
          ? 'Please enter or paste the image URL.'
          : 'تکایە بەستەری (لینکی) وێنەکە بنووسە یان پێستی بکە.'
      );
      return;
    }

    if (cleanUrl.startsWith('data:')) {
      setError(
        isEn
          ? 'Please provide a public web link (http:// or https://), not an embedded file.'
          : 'تکایە بەستەری ڕاستەقینەی سەر وێب دابنێ (http یان https) نەک کۆدی فایل.'
      );
      return;
    }

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      setError(
        isEn
          ? 'URL must start with http:// or https://.'
          : 'دەبێت بەستەرەکە بە http:// یان https:// دەستپێبکات.'
      );
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

      if (submitCloseTimerRef.current) clearTimeout(submitCloseTimerRef.current);
      submitCloseTimerRef.current = setTimeout(() => {
        onClose();
        setIsSubmitted(false);
        setUrl('');
        setSenderName('');
        setNote('');
      }, 2600);
    } catch (err) {
      console.error('Failed to submit photo suggestion:', err);
      setError(
        isEn
          ? 'Could not send submission. Check your connection and try again.'
          : 'نەتوانرا بنێردرێت، تکایە دڵنیابە لە هێڵی ئینتەرنێت و دووبارە تاقی بکەرەوە.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
      className={`fixed inset-0 z-[1360] flex items-center justify-center p-3 sm:p-4 animate-fade-in text-start ${
        isDark ? 'bg-black/85' : 'bg-slate-900/50'
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-lg rounded-[4px] border p-5 sm:p-6 overflow-hidden animate-scale-up ${
          isDark
            ? 'bg-[#0b0f1c] border-amber-500/30 border-t-amber-400/50 text-white shadow-[0_20px_60px_rgba(0,0,0,0.9)]'
            : 'bg-white border-slate-300 border-t-amber-600/60 text-slate-900 shadow-[0_24px_60px_rgba(15,23,42,0.18)]'
        }`}
        dir={dir}
      >
        {/* Header */}
        <div
          className={`relative z-10 flex items-start justify-between gap-3 border-b pb-4 mb-4 ${
            isDark ? 'border-white/10' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-[3px] border flex items-center justify-center shrink-0 ${
                isDark
                  ? 'bg-amber-500/20 border-amber-400/40 text-amber-400'
                  : 'bg-amber-50 border-amber-300 text-amber-800'
              }`}
            >
              <ImagePlus className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className={`text-base sm:text-lg font-black font-heading tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isEn ? (
                  <>
                    Help <span className={isDark ? 'text-amber-400' : 'text-amber-800'}>kurdistan info map</span> by submitting a photo URL
                  </>
                ) : (
                  <>
                    یارمەتی <span className={isDark ? 'text-amber-400' : 'text-amber-800'}>kurdistan info map</span> بدە بۆ ناردنی لینکی وێنە
                  </>
                )}
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {isEn
                  ? 'Suggest an authentic historical photograph for this entry'
                  : 'ناردنی پێشنیاری وێنەی شایستە و مێژوویی بۆ ئەم بابەتە'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className={`w-8 h-8 rounded-[3px] flex items-center justify-center transition-all cursor-pointer border ${
              isDark
                ? 'text-slate-400 hover:text-white bg-white/5 hover:bg-white/15 border-white/10'
                : 'text-slate-600 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 border-slate-300'
            }`}
            title={isEn ? 'Close' : 'داخستن'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="relative z-10 py-8 flex flex-col items-center justify-center text-center space-y-3 animate-fade-in">
            <div
              className={`w-16 h-16 rounded-none border-2 flex items-center justify-center ${
                isDark
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400'
                  : 'bg-emerald-50 border-emerald-600 text-emerald-700'
              }`}
            >
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <h3 className={`text-lg font-black font-heading ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
              {isEn
                ? 'Thank you! Photo link submitted successfully'
                : 'دەستت خۆش بێت! وێنەکە بە سەرکەوتوویی نێردرا'}
            </h3>
            <p className={`text-xs max-w-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {isEn ? (
                <>
                  Your photo suggestion has been sent to the{' '}
                  <strong className={isDark ? 'text-amber-400' : 'text-amber-800'}>kurdistan info map</strong> review queue. Once approved, it will appear on{' '}
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>&ldquo;{fact.name}&rdquo;</span>.
                </>
              ) : (
                <>
                  لینکی وێنەکەت گەیشتە بەشی ئەدمینی <strong className={isDark ? 'text-amber-400' : 'text-amber-800'}>kurdistan info map</strong>، دوای پێداچوونەوە ڕاستەوخۆ لەسەر بابەتی <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>«{fact.name}»</span> بڵاو دەکرێتەوە.
                </>
              )}
            </p>
            <div className={`flex items-center gap-1.5 text-[11px] pt-2 ${isDark ? 'text-amber-400/90' : 'text-amber-800'}`}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {isEn
                  ? 'Thank you for enriching Kurdish historical archives'
                  : 'سوپاس بۆ بەشداریت لە دەوڵەمەندکردنی مێژووی کوردستان'}
              </span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
            <div
              className={`p-3 rounded-[4px] border flex items-center justify-between gap-3 ${
                isDark ? 'bg-white/[0.04] border-white/10' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="space-y-0.5">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    isDark ? 'text-amber-400' : 'text-amber-800'
                  }`}
                >
                  {isEn ? 'Target Entry' : 'بابەتی مەبەست'}
                </span>
                <h4 className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{fact.name}</h4>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {fact.desc} {fact.century ? `· ${fact.century}` : ''}
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-[4px] border text-[10px] font-bold shrink-0 ${
                  isDark
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                    : 'bg-amber-100 border-amber-300 text-amber-900'
                }`}
              >
                {isEn ? 'No Photo' : 'بێ وێنەیە'}
              </span>
            </div>

            {error && (
              <div
                className={`p-2.5 rounded-[4px] border text-xs flex items-center gap-2 animate-fade-in ${
                  isDark
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    : 'bg-rose-50 border-rose-300 text-rose-800'
                }`}
              >
                <AlertCircle className={`w-4 h-4 shrink-0 ${isDark ? 'text-rose-400' : 'text-rose-700'}`} />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
                  <Link2 className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-800'}`} />
                  <span>{isEn ? 'Image URL *' : 'لینکی وێنەکە (URL) *'}</span>
                </label>
                <button
                  type="button"
                  onClick={handlePaste}
                  className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-[4px] border transition-all cursor-pointer ${
                    isDark
                      ? 'text-amber-400 hover:text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border-amber-400/25'
                      : 'text-amber-900 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border-amber-300'
                  }`}
                  title={isEn ? 'Paste from clipboard' : 'لەبەرگیراوە لە کلیپبۆردەوە دابنێ'}
                >
                  {pastedFeedback ? (
                    <>
                      <Check className={`w-3 h-3 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />
                      <span className={isDark ? 'text-emerald-300' : 'text-emerald-800'}>{isEn ? 'Pasted!' : 'دانرا!'}</span>
                    </>
                  ) : (
                    <>
                      <Clipboard className="w-3 h-3" />
                      <span>{isEn ? 'Paste' : 'پێستکردن (Paste)'}</span>
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
                  className={`w-full h-10 px-3.5 rounded-[4px] border text-xs font-mono transition-all outline-hidden text-left ${
                    isDark
                      ? 'bg-black/60 border-white/20 focus:border-amber-400 text-white placeholder-slate-500'
                      : 'bg-white border-slate-300 focus:border-amber-700 text-slate-900 placeholder-slate-500'
                  }`}
                />
              </div>
              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {isEn
                  ? 'You can copy a direct image link from Wikimedia Commons, Wikipedia, or any trusted archive.'
                  : 'دەتوانیت بەستەری وێنە لە ویکیپیدیا، گووگڵ، یان هەر ماڵپەڕێکی متمانەپێکراو کۆپی بکەیت و لێرە دایبنێیت.'}
              </p>
            </div>

            {url.trim().length > 10 && (
              <div
                className={`p-2.5 rounded-[4px] border space-y-1.5 ${
                  isDark ? 'bg-black/70 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className={`flex items-center justify-between text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span>{isEn ? 'Image Preview:' : 'پێشبینینی وێنەکە:'}</span>
                  {previewLoaded && !previewError && (
                    <span className={`flex items-center gap-1 text-[10px] ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                      <Check className="w-3 h-3" /> {isEn ? 'Image loaded' : 'وێنەکە کار دەکات'}
                    </span>
                  )}
                  {previewError && (
                    <span className={`flex items-center gap-1 text-[10px] ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>
                      <AlertCircle className="w-3 h-3" /> {isEn ? 'Failed to load image' : 'نەتوانرا وێنەکە باربکرێت'}
                    </span>
                  )}
                </div>

                <div className="preserve-contrast relative w-full h-36 rounded-[4px] overflow-hidden bg-black/90 flex items-center justify-center border border-white/10">
                  <img
                    src={url.trim()}
                    alt={isEn ? 'Photo preview' : 'پێشبینینی وێنە'}
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
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-xs gap-1.5">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                      <span>{isEn ? 'Checking image...' : 'پشکنینی وێنە...'}</span>
                    </div>
                  )}
                  {previewError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-rose-300 text-xs p-2 text-center gap-1">
                      <AlertCircle className="w-5 h-5 text-rose-400" />
                      <span className="font-semibold">
                        {isEn ? 'Direct image link failed to load' : 'لینکی وێنەکە ڕاستەوخۆ ناکرێتەوە'}
                      </span>
                      <span className="text-[10px] text-slate-300">
                        {isEn
                          ? 'Ensure the URL points directly to an image (.jpg, .png, .webp)'
                          : 'دڵنیابە بەستەرەکە ڕاستەوخۆ بە .jpg، .png یان وێب دەبێتەوە'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <User className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                <span>{isEn ? 'Your Name (Optional)' : 'ناوی بەڕێزت (ئارەزوومەندانە)'}</span>
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder={isEn ? 'e.g., Aram Mohammed' : 'بۆ نموونە: ئارام محەمەد'}
                className={`w-full h-9.5 px-3 rounded-[4px] border text-xs transition-all outline-hidden ${
                  isDark
                    ? 'bg-black/50 border-white/15 focus:border-amber-400 text-white placeholder-slate-500'
                    : 'bg-white border-slate-300 focus:border-amber-700 text-slate-900 placeholder-slate-500'
                }`}
              />
            </div>

            <div className="space-y-1">
              <label className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <FileText className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                <span>{isEn ? 'Note or Image Source (Optional)' : 'تێبینی یان سەرچاوەی وێنە (ئارەزوومەندانە)'}</span>
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={isEn ? 'Source URL, archive citation, or date' : 'سەرچاوەی وێنە یان شوێنی دۆزینەوە'}
                className={`w-full h-9.5 px-3 rounded-[4px] border text-xs transition-all outline-hidden ${
                  isDark
                    ? 'bg-black/50 border-white/15 focus:border-amber-400 text-white placeholder-slate-500'
                    : 'bg-white border-slate-300 focus:border-amber-700 text-slate-900 placeholder-slate-500'
                }`}
              />
            </div>

            <div className={`flex items-center justify-end gap-2.5 pt-3 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-[4px] text-xs font-semibold transition-all cursor-pointer border ${
                  isDark
                    ? 'text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border-white/10'
                    : 'text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 border-slate-300'
                }`}
              >
                {isEn ? 'Cancel' : 'پاشگەزبوونەوە'}
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !url.trim()}
                className={`flex items-center gap-2 px-5 py-2 rounded-[4px] text-xs font-extrabold transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${
                  isDark
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.35)]'
                    : 'bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white shadow-md preserve-contrast'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{isEn ? 'Sending...' : 'ناردن...'}</span>
                  </>
                ) : (
                  <>
                    <ImagePlus className="w-4 h-4 stroke-[2.5]" />
                    <span>{isEn ? 'Submit to Admin' : 'ناردنی وێنە بۆ ئادمین'}</span>
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
