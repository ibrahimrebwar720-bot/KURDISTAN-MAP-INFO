import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Images,
  Check,
  Copy,
  Trash2,
  ExternalLink,
  Clock,
  User,
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { FactItem } from '../data/kurdishHistoryData';
import { PhotoSubmission } from '../types/history';
import {
  approvePhotoSubmission,
  rejectPhotoSubmission,
  deletePhotoSubmission,
} from '../services/firestoreHistoryService';
import { kurdishSearchMatch } from '../utils/kurdishSearch';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { formatDigits } from '../utils/yearUtils';

interface SubmittedPhotosModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissions: PhotoSubmission[];
  allFacts: FactItem[];
  onFactUpdated?: (updatedFact: FactItem) => void;
  onSelectFact?: (fact: FactItem) => void;
}

export const SubmittedPhotosModal: React.FC<SubmittedPhotosModalProps> = ({
  isOpen,
  onClose,
  submissions,
  allFacts,
  onFactUpdated,
  onSelectFact,
}) => {
  const { language, isEn, dir } = useLanguage();
  const { colorMode } = useTheme();
  const isDark = colorMode === 'dark';
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setConfirmDeleteId(null);
      setErrorMsg(null);
      setSuccessMsg(null);
      setPreviewImage(null);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const filteredList = submissions.filter((item) => {
    if (filter !== 'all' && item.status !== filter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim();
    return (
      kurdishSearchMatch(item.factName, q) ||
      (item.senderName && kurdishSearchMatch(item.senderName, q)) ||
      (item.note && kurdishSearchMatch(item.note, q)) ||
      item.imageUrl.toLowerCase().includes(q.toLowerCase())
    );
  });

  const pendingCount = submissions.filter((s) => s.status === 'pending').length;

  const handleCopyUrl = async (submission: PhotoSubmission) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(submission.imageUrl);
        setCopiedId(submission.id);
        if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
        copiedTimerRef.current = setTimeout(() => setCopiedId(null), 2000);
      }
    } catch {
      // ignore
    }
  };

  const handleApprove = async (submission: PhotoSubmission) => {
    setProcessingId(submission.id);
    setErrorMsg(null);
    try {
      const updatedFact = await approvePhotoSubmission(submission, allFacts, language);
      if (updatedFact && onFactUpdated) {
        onFactUpdated(updatedFact);
      }
      setSuccessMsg(
        isEn
          ? `Photo published to "${submission.factName}" successfully!`
          : `وێنەکە بە سەرکەوتوویی لەسەر بابەتی «${submission.factName}» بڵاوکرایەوە!`
      );
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Failed to approve photo submission:', err);
      setErrorMsg(
        isEn
          ? 'Failed to approve and publish photo. Please try again.'
          : 'پەسەندکردن و بڵاوکردنەوەی وێنەکە سەرکەوتوو نەبوو. تکایە دووبارە هەوڵ بدەرەوە.'
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (submission: PhotoSubmission) => {
    setProcessingId(submission.id);
    setErrorMsg(null);
    try {
      await rejectPhotoSubmission(submission.id);
    } catch (err) {
      console.error('Failed to reject submission:', err);
      setErrorMsg(
        isEn
          ? 'Failed to reject submission. Please check your connection.'
          : 'ڕەتکردنەوەی وێنەکە سەرکەوتوو نەبوو.'
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (submissionId: string) => {
    setProcessingId(submissionId);
    setErrorMsg(null);
    try {
      await deletePhotoSubmission(submissionId);
      setConfirmDeleteId(null);
    } catch (err) {
      console.error('Failed to delete submission:', err);
      setErrorMsg(
        isEn
          ? 'Failed to delete submission. Please try again.'
          : 'سڕینەوەی پێشنیارەکە سەرکەوتوو نەبوو.'
      );
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '';
    try {
      const d = new Date(timestamp);
      return d.toLocaleDateString(isEn ? 'en-US' : 'ckb', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 z-[1350] flex items-center justify-center p-3 sm:p-4 animate-fade-in text-start ${
        isDark ? 'bg-black/85' : 'bg-slate-900/50'
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[4px] border overflow-hidden animate-scale-up ${
          isDark
            ? 'bg-[#0b0f1c] border-amber-500/30 border-t-amber-400/50 text-white shadow-[0_24px_70px_rgba(0,0,0,0.9)]'
            : 'bg-white border-slate-300 border-t-amber-600/60 text-slate-900 shadow-[0_24px_60px_rgba(15,23,42,0.18)]'
        }`}
        dir={dir}
      >
        {/* Modal Header */}
        <div
          className={`relative z-10 px-5 py-4 border-b flex items-center justify-between gap-3 shrink-0 ${
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
              <Images className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-base sm:text-lg font-black font-heading ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {isEn ? 'Submitted Photos' : 'وێنە نێردراوەکان'}
                </h2>
                {pendingCount > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-[3px] border text-[10px] font-mono font-bold ${
                      isDark
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}
                  >
                    {formatDigits(pendingCount, language)} {isEn ? 'Pending' : 'چاوەڕوانکراو'}
                  </span>
                )}
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {isEn
                  ? 'Review and approve historical photograph links submitted by visitors'
                  : 'پێداچوونەوە و پەسەندکردنی ئەو وێنانەی کە لەلایەن بەکارهێنەرانەوە نێردراون'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className={`w-9 h-9 rounded-[4px] flex items-center justify-center transition-all cursor-pointer border ${
              isDark
                ? 'text-slate-400 hover:text-white bg-white/5 hover:bg-white/15 border-white/10'
                : 'text-slate-600 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 border-slate-300'
            }`}
            title={isEn ? 'Close' : 'داخستن'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success / Error Alert Banners */}
        {successMsg && (
          <div
            className={`relative z-10 mx-5 mt-3 p-3 rounded-[4px] border text-xs flex items-center justify-between gap-2 animate-fade-in shadow-sm ${
              isDark
                ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className={`w-4 h-4 shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />
              <span className="font-bold">{successMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMsg(null)}
              className={`p-1 cursor-pointer ${isDark ? 'text-emerald-400 hover:text-white' : 'text-emerald-700 hover:text-emerald-950'}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {errorMsg && (
          <div
            className={`relative z-10 mx-5 mt-3 p-3 rounded-[4px] border text-xs flex items-center justify-between gap-2 animate-fade-in shadow-sm ${
              isDark
                ? 'bg-rose-500/20 border-rose-400/40 text-rose-200'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className={`w-4 h-4 shrink-0 ${isDark ? 'text-rose-400' : 'text-rose-700'}`} />
              <span className="font-bold">{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className={`p-1 cursor-pointer ${isDark ? 'text-rose-300 hover:text-white' : 'text-rose-700 hover:text-rose-950'}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Filter Tabs & Search Bar */}
        <div
          className={`relative z-10 px-5 pt-3 pb-2 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0 ${
            isDark ? 'border-white/10' : 'border-slate-200'
          }`}
        >
          <div
            className={`flex items-center gap-1.5 p-1 rounded-[4px] border overflow-x-auto scrollbar-none ${
              isDark ? 'bg-white/[0.04] border-white/10' : 'bg-[#f4f3ef] border-slate-300'
            }`}
          >
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-[3px] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filter === 'pending'
                  ? isDark
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                    : 'bg-amber-700 text-white shadow-sm font-extrabold preserve-contrast'
                  : isDark
                  ? 'text-slate-300 hover:text-white hover:bg-white/5'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                {isEn ? 'Pending' : 'چاوەڕوانکراو'} (
                {formatDigits(submissions.filter((s) => s.status === 'pending').length, language)})
              </span>
            </button>

            <button
              onClick={() => setFilter('approved')}
              className={`px-3 py-1.5 rounded-[3px] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filter === 'approved'
                  ? isDark
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                    : 'bg-emerald-700 text-white shadow-sm font-extrabold preserve-contrast'
                  : isDark
                  ? 'text-slate-300 hover:text-white hover:bg-white/5'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {isEn ? 'Approved' : 'پەسەندکراو'} (
                {formatDigits(submissions.filter((s) => s.status === 'approved').length, language)})
              </span>
            </button>

            <button
              onClick={() => setFilter('rejected')}
              className={`px-3 py-1.5 rounded-[3px] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filter === 'rejected'
                  ? isDark
                    ? 'bg-rose-500 text-white shadow-md font-extrabold'
                    : 'bg-rose-700 text-white shadow-sm font-extrabold preserve-contrast'
                  : isDark
                  ? 'text-slate-300 hover:text-white hover:bg-white/5'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-white'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>
                {isEn ? 'Rejected' : 'ڕەتکراوە'} (
                {formatDigits(submissions.filter((s) => s.status === 'rejected').length, language)})
              </span>
            </button>

            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-[3px] text-xs font-bold transition-all cursor-pointer ${
                filter === 'all'
                  ? isDark
                    ? 'bg-white/20 text-white shadow-md font-extrabold'
                    : 'bg-slate-900 text-white shadow-sm font-extrabold preserve-contrast'
                  : isDark
                  ? 'text-slate-300 hover:text-white hover:bg-white/5'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-white'
              }`}
            >
              {isEn ? 'All' : 'هەمووی'} ({formatDigits(submissions.length, language)})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative sm:w-64">
            <Search className={`w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isEn ? 'Search by entry, sender...' : 'گەڕان بەپێی بابەت، نێرەر...'}
              className={`w-full h-9 ps-9 pe-3 rounded-[4px] border text-xs transition-all outline-hidden ${
                isDark
                  ? 'bg-black/50 border-white/15 focus:border-amber-400 text-white placeholder-slate-500'
                  : 'bg-white border-slate-300 focus:border-amber-700 text-slate-900 placeholder-slate-500'
              }`}
            />
          </div>
        </div>

        {/* Content List Area */}
        <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 custom-scrollbar">
          {filteredList.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <div
                className={`w-12 h-12 rounded-[4px] border flex items-center justify-center mx-auto ${
                  isDark ? 'bg-white/5 border-white/10 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-500'
                }`}
              >
                <Images className="w-6 h-6" />
              </div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                {isEn ? 'No photo submissions in this category' : 'هیچ وێنەیەکی نێردراو لەم بەشەدا نییە'}
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {isEn
                  ? 'When visitors suggest photographs for entries without images, they will appear here.'
                  : 'کاتێک بەکارهێنەران وێنە بۆ بابەتە بێ وێنەکان دەنێرن، لێرەدا دەردەکەون.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredList.map((item) => {
                const targetFact = allFacts.find((f) => f.id === item.factId);
                const isProcessing = processingId === item.id;
                const isCopied = copiedId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`group relative rounded-[4px] border p-3.5 transition-all flex flex-col justify-between gap-3 ${
                      isDark
                        ? 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10 hover:border-amber-500/30 shadow-sm hover:shadow-lg'
                        : 'bg-[#faf9f6] hover:bg-white border-slate-200 hover:border-amber-600 shadow-xs hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        onClick={() => setPreviewImage(item.imageUrl)}
                        className="preserve-contrast relative w-24 h-24 sm:w-28 sm:h-28 rounded-[4px] overflow-hidden bg-black/90 border border-slate-700/60 shrink-0 cursor-pointer group/img shadow-md"
                        title={isEn ? 'Click to view full size' : 'داگرە بۆ بینینی تەواوی قەبارەی وێنە'}
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.factName}
                          className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity text-white">
                          <ExternalLink className="w-4 h-4" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`px-2 py-0.5 rounded-[3px] text-[10px] font-bold border ${
                              item.status === 'approved'
                                ? isDark
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : item.status === 'rejected'
                                ? isDark
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                  : 'bg-rose-100 text-rose-800 border-rose-300'
                                : isDark
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-amber-100 text-amber-900 border-amber-300'
                            }`}
                          >
                            {item.status === 'approved'
                              ? isEn
                                ? 'Approved'
                                : 'پەسەندکراو'
                              : item.status === 'rejected'
                              ? isEn
                                ? 'Rejected'
                                : 'ڕەتکراوە'
                              : isEn
                              ? 'Pending'
                              : 'چاوەڕوانکراو'}
                          </span>

                          <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            {formatDate(item.submittedAt)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <h4 className={`text-sm font-extrabold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {item.factName}
                          </h4>
                          {targetFact && onSelectFact && (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectFact(targetFact);
                                onClose();
                              }}
                              className={`text-[10px] font-bold underline cursor-pointer shrink-0 ${
                                isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-800 hover:text-amber-950'
                              }`}
                              title={isEn ? 'Open entry on map' : 'کردنەوەی بابەت لە نەخشەدا'}
                            >
                              {isEn ? '(Open)' : '(کردنەوە)'}
                            </button>
                          )}
                        </div>

                        {item.senderName && (
                          <div className={`flex items-center gap-1 text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <User className={`w-3 h-3 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                            <span className="truncate">
                              {isEn ? 'Sender:' : 'نێرەر:'} {item.senderName}
                            </span>
                          </div>
                        )}

                        {item.note && (
                          <div
                            className={`flex items-center gap-1 text-[10px] p-1.5 rounded-[3px] border ${
                              isDark
                                ? 'text-slate-300 bg-white/[0.03] border-white/10'
                                : 'text-slate-700 bg-white border-slate-200'
                            }`}
                          >
                            <FileText className={`w-3 h-3 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                            <span className="truncate">{item.note}</span>
                          </div>
                        )}

                        <div
                          className={`text-[10px] font-mono truncate px-2 py-1 rounded-[3px] border ${
                            isDark
                              ? 'text-slate-300 bg-black/40 border-white/10'
                              : 'text-slate-700 bg-slate-100 border-slate-200'
                          }`}
                          dir="ltr"
                        >
                          {item.imageUrl}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`flex items-center justify-between gap-1.5 pt-2 border-t ${
                        isDark ? 'border-white/10' : 'border-slate-200'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(item)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-[4px] text-[11px] font-bold border transition-all cursor-pointer ${
                          isCopied
                            ? isDark
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : isDark
                            ? 'bg-white/5 hover:bg-white/10 text-amber-400 border-white/10'
                            : 'bg-white hover:bg-amber-50 text-amber-900 border-slate-300'
                        }`}
                        title={isEn ? 'Copy image URL' : 'کۆپیکردنی بەستەری وێنە'}
                      >
                        {isCopied ? (
                          <>
                            <Check className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />
                            <span>{isEn ? 'Copied' : 'کۆپیکرا'}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>{isEn ? 'Copy' : 'کۆپی'}</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-1.5">
                        {item.status !== 'approved' && (
                          <button
                            type="button"
                            onClick={() => handleApprove(item)}
                            disabled={isProcessing}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-[4px] text-[11px] font-extrabold shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-40 ${
                              isDark
                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950'
                                : 'bg-emerald-700 hover:bg-emerald-600 text-white preserve-contrast'
                            }`}
                            title={
                              isEn
                                ? 'Approve & publish directly to entry'
                                : 'ڕازیبوون و بڵاوکردنەوە لەسەر بابەتەکە بێ دەستکاری'
                            }
                          >
                            {isProcessing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                            )}
                            <span>{isEn ? 'Approve' : 'ڕازی بوون'}</span>
                          </button>
                        )}

                        {item.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleReject(item)}
                            disabled={isProcessing}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-[4px] text-[11px] font-bold border transition-all cursor-pointer active:scale-95 disabled:opacity-40 ${
                              isDark
                                ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300'
                            }`}
                            title={isEn ? 'Reject this photo' : 'ڕەتکردنەوەی ئەم وێنەیە'}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{isEn ? 'Reject' : 'ڕەتکردنەوە'}</span>
                          </button>
                        )}

                        {confirmDeleteId === item.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              disabled={isProcessing}
                              className="px-2 py-1 rounded-[4px] bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold cursor-pointer disabled:opacity-40"
                            >
                              {isEn ? 'Confirm' : 'سڕینەوە'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              disabled={isProcessing}
                              className={`px-2 py-1 rounded-[4px] text-[10px] font-bold border cursor-pointer ${
                                isDark
                                  ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/15'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                              }`}
                            >
                              {isEn ? 'Cancel' : 'نا'}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(item.id)}
                            disabled={isProcessing}
                            className={`w-8 h-8 rounded-[4px] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 ${
                              isDark
                                ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                                : 'text-slate-500 hover:text-rose-700 hover:bg-rose-50'
                            }`}
                            title={isEn ? 'Delete submission' : 'سڕینەوەی ئەم پێشنیارە'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div
          className={`relative z-10 px-5 py-3 border-t flex items-center justify-between text-xs ${
            isDark
              ? 'border-white/10 bg-white/[0.02] text-slate-400'
              : 'border-slate-200 bg-[#f4f3ef] text-slate-700'
          }`}
        >
          <span>
            {isEn ? (
              <>
                All approved photographs are published directly to the <strong>kurdistan info map</strong> archive.
              </>
            ) : (
              <>
                سەرجەم وێنە پەسەندکراوەکان ڕاستەوخۆ دەخرێنە سەر نەخشە و ئینسایکلۆپیدیای <strong>kurdistan info map</strong>.
              </>
            )}
          </span>
          <button
            onClick={onClose}
            type="button"
            className={`px-4 py-1.5 rounded-[4px] text-xs font-bold border transition-all cursor-pointer ${
              isDark
                ? 'text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 border-white/10'
                : 'text-slate-800 hover:text-slate-950 bg-white hover:bg-slate-100 border-slate-300'
            }`}
          >
            {isEn ? 'Close' : 'داخستن'}
          </button>
        </div>
      </div>

      {/* Full Image Preview Lightbox */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="preserve-contrast fixed inset-0 z-[1400] flex items-center justify-center p-4 bg-black/95 cursor-zoom-out animate-fade-in"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={previewImage}
              alt={isEn ? 'Full photo preview' : 'پێشبینینی گەورەی وێنە'}
              className="max-h-[85vh] max-w-full rounded-[4px] object-contain border border-white/20 shadow-2xl"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 end-3 w-9 h-9 rounded-[4px] bg-black/75 text-white flex items-center justify-center border border-white/25 hover:bg-white/20 transition-all cursor-pointer"
              title={isEn ? 'Close' : 'داخستن'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
