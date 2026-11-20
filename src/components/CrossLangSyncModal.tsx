import React, { useState, useEffect } from 'react';
import { Languages, Check, X, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { FactItem } from '../data/kurdishHistoryData';
import { AppLanguage, useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { formatTranslationError } from '../services/aiTranslationService';

interface CrossLangSyncModalProps {
  isOpen: boolean;
  fact: FactItem | null;
  sourceLang: AppLanguage;
  syncMode?: 'ai_text' | 'partial_text' | 'non_text';
  changedLabelsKu?: string[];
  changedLabelsEn?: string[];
  onConfirmYes: () => Promise<void>;
  onDeclineNo: () => void;
}

export const CrossLangSyncModal: React.FC<CrossLangSyncModalProps> = ({
  isOpen,
  fact,
  sourceLang,
  syncMode = 'ai_text',
  changedLabelsKu = [],
  changedLabelsEn = [],
  onConfirmYes,
  onDeclineNo,
}) => {
  const { language, isEn, dir } = useLanguage();
  const { colorMode } = useTheme();
  const isDark = colorMode === 'dark';

  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsSyncing(false);
      setErrorMsg(null);
    }
  }, [isOpen, fact?.id, sourceLang]);

  if (!isOpen || !fact) return null;

  const targetLang: AppLanguage = sourceLang === 'ckb' ? 'en' : 'ckb';
  const targetLangLabelKu = targetLang === 'en' ? 'ئینگلیزی' : 'کوردی سۆرانی';
  const targetLangLabelEn = targetLang === 'en' ? 'English' : 'Kurdish Sorani';
  const displayedLabels = isEn ? changedLabelsEn : changedLabelsKu;

  const handleYesClick = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setErrorMsg(null);
    try {
      await onConfirmYes();
    } catch (err) {
      setErrorMsg(formatTranslationError(err, language));
      setIsSyncing(false);
    }
  };

  return (
    <div
      dir={dir}
      className="fixed inset-0 z-[1350] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={() => {
        if (!isSyncing) onDeclineNo();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cross-lang-sync-title"
        className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden transition-all ${
          isDark
            ? 'bg-[#0b1020] border-amber-500/35 text-slate-100'
            : 'bg-white border-amber-500/45 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between gap-3 ${
            isDark
              ? 'bg-gradient-to-r from-amber-500/15 via-sky-500/10 to-transparent border-white/10'
              : 'bg-gradient-to-r from-amber-50 via-sky-50 to-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                isDark
                  ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                  : 'bg-amber-100 border-amber-300 text-amber-800'
              }`}
            >
              <Languages className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3
                id="cross-lang-sync-title"
                className={`text-sm font-extrabold font-heading truncate ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {syncMode === 'partial_text'
                  ? isEn
                    ? `Apply Specific Change to ${targetLangLabelEn}?`
                    : 'هاوکاتکردنی گۆڕانکاریی دیاریکراو'
                  : isEn
                  ? `Apply Change to ${targetLangLabelEn}?`
                  : 'هاوکاتکردنی گۆڕانکاری لە زمانی تردا'}
              </h3>
              <p
                className={`text-[11px] font-medium truncate ${
                  isDark ? 'text-amber-300/90' : 'text-amber-800'
                }`}
              >
                {sourceLang === 'ckb' ? 'کوردی سۆرانی → English' : 'English → کوردی سۆرانی'}
              </p>
            </div>
          </div>

          {!isSyncing && (
            <button
              type="button"
              onClick={onDeclineNo}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark
                  ? 'text-slate-400 hover:text-white hover:bg-white/10'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
              aria-label={isEn ? 'Close' : 'داخستن'}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-start">
          {/* Topic Name Card */}
          <div
            className={`px-3.5 py-2.5 rounded-xl border flex items-center gap-2.5 ${
              isDark
                ? 'bg-white/[0.04] border-white/10'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <Sparkles
              className={`w-4 h-4 shrink-0 ${
                isDark ? 'text-amber-400' : 'text-amber-700'
              }`}
            />
            <span
              className={`text-xs font-bold truncate ${
                isDark ? 'text-amber-200' : 'text-slate-900'
              }`}
            >
              {fact.name}
            </span>
          </div>

          {/* Changed Fields Summary */}
          {displayedLabels.length > 0 && (
            <div className="space-y-1.5">
              <p
                className={`text-[11px] font-bold uppercase tracking-wide ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                {isEn ? 'Modified Fields:' : 'بەشە دەستکاریکراوەکان:'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {displayedLabels.map((label) => (
                  <span
                    key={label}
                    className={`px-2.5 py-1 rounded-md border text-[11px] font-bold ${
                      isDark
                        ? 'bg-amber-500/15 border-amber-400/35 text-amber-200'
                        : 'bg-amber-50 border-amber-300 text-amber-900'
                    }`}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Explicit Confirmation Question */}
          <p
            className={`text-sm font-bold leading-relaxed ${
              isDark ? 'text-slate-100' : 'text-slate-900'
            }`}
          >
            {syncMode === 'partial_text'
              ? isEn
                ? `Do you want ONLY this specific change to be applied to ${targetLangLabelEn}?`
                : `ئایا دەتەوێت تەنها ئەم گۆڕانکارییە لە بەشی ${targetLangLabelKu}ش جێبەجێ بکرێت؟`
              : isEn
              ? `Do you want this change to be applied to the other language (${targetLangLabelEn}) as well?`
              : `ئایا دەتەوێت گۆڕانکارییەکە لە زمانەکەی تریش (${targetLangLabelKu}) بکرێت؟`}
          </p>

          <p
            className={`text-xs leading-relaxed ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            {syncMode === 'non_text'
              ? isEn
                ? 'If you select Yes, only images, coordinates, dates, boundaries, and relations will be copied to the English entry instantly without using AI quota.'
                : 'ئەگەر «بەڵێ» هەڵبژێریت، تەنها وێنە، پۆینتەکان، ساڵ، سنوور و پەیوەندییەکان ڕاستەوخۆ و بێ بەکارهێنانی کۆتای AI بۆ زمانەکەی تر دەگوازرێنەوە.'
              : syncMode === 'partial_text'
              ? isEn
                ? 'Only the modified field(s) above will be translated and updated. The existing Summary and Full Text will remain untouched.'
                : 'تەنها ئەو بەشە گۆڕاوانەی سەرەوە بۆ ئینگلیزی وەردەگێڕدرێن و نوێ دەکرێنەوە؛ دەقی «پوختە» و «درێژە» وەک خۆیان دەمێننەوە و سەرلەنوێ وەرناگێڕدرێنەوە.'
              : isEn
              ? 'If you select Yes, AI will accurately translate the updated text into the other language while syncing the exact same images, coordinates, dates, and linked entries.'
              : 'ئەگەر «بەڵێ» هەڵبژێریت، زیرەکی دەستکرد دەقە نوێکراوەکە بە وردی وەردەگێڕێتە سەر زمانەکەی تر و هەمان وێنە، پۆوتانی نەخشە، مێژوو و پەیوەندییەکان هاوکات دەکات.'}
          </p>

          {/* Error Banner if translation fails */}
          {errorMsg && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs font-medium ${
                isDark
                  ? 'bg-rose-950/50 border-rose-500/40 text-rose-200'
                  : 'bg-rose-50 border-rose-300 text-rose-800'
              }`}
            >
              <AlertCircle
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  isDark ? 'text-rose-400' : 'text-rose-700'
                }`}
              />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer Actions: Yes / No */}
        <div
          className={`px-5 py-3.5 border-t flex items-center justify-end gap-2.5 ${
            isDark
              ? 'bg-white/[0.02] border-white/10'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={onDeclineNo}
            disabled={isSyncing}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 ${
              isDark
                ? 'bg-white/[0.06] hover:bg-white/[0.12] border-white/15 text-slate-200'
                : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800 shadow-xs'
            }`}
          >
            <X className="w-3.5 h-3.5" />
            <span>{isEn ? 'No' : 'نەخێر'}</span>
          </button>

          <button
            type="button"
            onClick={handleYesClick}
            disabled={isSyncing}
            className={`px-5 py-2 rounded-xl text-xs font-extrabold border shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-75 disabled:cursor-wait flex items-center gap-1.5 ${
              isDark
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 border-amber-300/60'
                : 'preserve-contrast bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-800 hover:to-amber-700 text-white border-amber-800/40'
            }`}
          >
            {isSyncing ? (
              <>
                <Loader2 className={`w-3.5 h-3.5 animate-spin ${isDark ? 'text-slate-950' : 'text-white'}`} />
                <span>{isEn ? 'Translating & Syncing...' : 'وەرگێڕان و جێبەجێکردن...'}</span>
              </>
            ) : (
              <>
                <Check className={`w-3.5 h-3.5 stroke-[2.5] ${isDark ? 'text-slate-950' : 'text-white'}`} />
                <span>{isEn ? 'Yes' : 'بەڵێ'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
