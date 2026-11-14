import React, { useState } from 'react';
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
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch {
      // ignore
    }
  };

  const handleApprove = async (submission: PhotoSubmission) => {
    setProcessingId(submission.id);
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
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Failed to approve photo submission:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (submission: PhotoSubmission) => {
    setProcessingId(submission.id);
    try {
      await rejectPhotoSubmission(submission.id);
    } catch (err) {
      console.error('Failed to reject submission:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (submissionId: string) => {
    if (
      window.confirm(
        isEn
          ? 'Are you sure you want to delete this submitted photo?'
          : 'ئایا دڵنیایت لە سڕینەوەی ئەم وێنە نێردراوە؟'
      )
    ) {
      try {
        await deletePhotoSubmission(submissionId);
      } catch (err) {
        console.error('Failed to delete submission:', err);
      }
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
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/85 animate-fade-in text-start">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[4px] bg-[#0b0f1c] border border-amber-500/30 border-t-amber-400/50 text-white overflow-hidden animate-scale-up shadow-[0_24px_70px_rgba(0,0,0,0.9)]"
        dir={dir}
      >
        {/* Modal Header */}
        <div className="relative z-10 px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[3px] bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
              <Images className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black font-heading text-white">
                  {isEn ? 'Submitted Photos' : 'وێنە نێردراوەکان'}
                </h2>
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-[3px] bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-mono font-bold">
                    {formatDigits(pendingCount, language)} {isEn ? 'Pending' : 'چاوەڕوانکراو'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isEn
                  ? 'Review and approve historical photograph links submitted by visitors'
                  : 'پێداچوونەوە و پەسەندکردنی ئەو وێنانەی کە لەلایەن بەکارهێنەرانەوە نێردراون'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white bg-white/5 hover:bg-white/15 transition-all cursor-pointer border border-white/10"
            title={isEn ? 'Close' : 'داخستن'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {successMsg && (
          <div className="relative z-10 mx-5 mt-3 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs flex items-center justify-between gap-2 animate-fade-in shadow-md">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-bold">{successMsg}</span>
            </div>
            <button
              onClick={() => setSuccessMsg(null)}
              className="text-emerald-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Filter Tabs & Search Bar */}
        <div className="relative z-10 px-5 pt-3 pb-2 border-b border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/10 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filter === 'pending'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filter === 'approved'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filter === 'rejected'
                  ? 'bg-rose-500 text-white shadow-md font-extrabold'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-white/20 text-white shadow-md font-extrabold'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {isEn ? 'All' : 'هەمووی'} ({formatDigits(submissions.length, language)})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isEn ? 'Search by entry, sender...' : 'گەڕان بەپێی بابەت، نێرەر...'}
              className="w-full h-9 ps-9 pe-3 rounded-xl bg-black/50 border border-white/15 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white placeholder-slate-500 text-xs transition-all outline-hidden"
            />
          </div>
        </div>

        {/* Content List Area */}
        <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {filteredList.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 mx-auto">
                <Images className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-300">
                {isEn ? 'No photo submissions in this category' : 'هیچ وێنەیەکی نێردراو لەم بەشەدا نییە'}
              </h3>
              <p className="text-xs text-slate-500">
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
                    className="group relative rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-amber-500/30 p-3.5 transition-all flex flex-col justify-between gap-3 shadow-sm hover:shadow-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        onClick={() => setPreviewImage(item.imageUrl)}
                        className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-black/90 border border-white/15 shrink-0 cursor-pointer group/img shadow-md"
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
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                              item.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : item.status === 'rejected'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
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

                          <span className="text-[10px] text-slate-500 font-mono">
                            {formatDate(item.submittedAt)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-extrabold text-white truncate">
                            {item.factName}
                          </h4>
                          {targetFact && onSelectFact && (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectFact(targetFact);
                                onClose();
                              }}
                              className="text-[10px] font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer shrink-0"
                              title={isEn ? 'Open entry on map' : 'کردنەوەی بابەت لە نەخشەدا'}
                            >
                              {isEn ? '(Open)' : '(کردنەوە)'}
                            </button>
                          )}
                        </div>

                        {item.senderName && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-300">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">
                              {isEn ? 'Sender:' : 'نێرەر:'} {item.senderName}
                            </span>
                          </div>
                        )}

                        {item.note && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-white/[0.03] p-1.5 rounded-lg">
                            <FileText className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate">{item.note}</span>
                          </div>
                        )}

                        <div className="text-[10px] font-mono text-slate-400 truncate bg-black/40 px-2 py-1 rounded-md" dir="ltr">
                          {item.imageUrl}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(item)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-white/5 hover:bg-white/10 text-amber-400 border-white/10'
                        }`}
                        title={isEn ? 'Copy image URL' : 'کۆپیکردنی بەستەری وێنە'}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
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
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-extrabold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-40"
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
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-all cursor-pointer active:scale-95 disabled:opacity-40"
                            title={isEn ? 'Reject this photo' : 'ڕەتکردنەوەی ئەم وێنەیە'}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{isEn ? 'Reject' : 'ڕەتکردنەوە'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title={isEn ? 'Delete submission' : 'سڕینەوەی ئەم پێشنیارە'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="relative z-10 px-5 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs text-slate-400">
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
            className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
          >
            {isEn ? 'Close' : 'داخستن'}
          </button>
        </div>
      </div>

      {/* Full Image Preview Lightbox */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/95 backdrop-blur-lg cursor-zoom-out animate-fade-in"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={previewImage}
              alt={isEn ? 'Full photo preview' : 'پێشبینینی گەورەی وێنە'}
              className="max-h-[85vh] max-w-full rounded-2xl object-contain border border-white/20 shadow-2xl"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 end-3 w-9 h-9 rounded-full bg-black/70 text-white flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all cursor-pointer"
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
