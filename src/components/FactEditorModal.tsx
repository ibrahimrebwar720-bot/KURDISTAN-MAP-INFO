import React, { useState, useEffect } from 'react';
import { FactItem } from '../data/kurdishHistoryData';
import { CollectionItem } from '../types/history';
import {
  X,
  MapPin,
  Save,
  Trash2,
  Crosshair,
  BookOpen,
  FileText,
  Layers,
  Sparkles,
  Check,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  factToEdit?: FactItem | null;
  collections: CollectionItem[];
  onSave: (fact: FactItem) => void;
  onDelete?: (factId: number) => void;
  onStartPickLocation: () => void;
  pickedCoords?: { lat: number; lng: number } | null;
  totalFactsCount: number;
}

export const FactEditorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  factToEdit,
  collections,
  onSave,
  onDelete,
  onStartPickLocation,
  pickedCoords,
  totalFactsCount,
}) => {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [fullText, setFullText] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [lat, setLat] = useState<number>(36.8);
  const [lng, setLng] = useState<number>(44.5);
  const [tag, setTag] = useState<FactItem['tag']>('principality');
  const [collectionId, setCollectionId] = useState<string>('powers');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [hasLocationPicked, setHasLocationPicked] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (factToEdit) {
        setName(factToEdit.name);
        setDesc(factToEdit.desc);
        setFullText(factToEdit.fullText);
        setAdditionalNotes(factToEdit.additionalNotes || '');
        setLat(factToEdit.lat);
        setLng(factToEdit.lng);
        setTag(factToEdit.tag);
        setCollectionId(factToEdit.collectionId || 'powers');
        setHasLocationPicked(true);
      } else {
        setName('');
        setDesc('');
        setFullText('');
        setAdditionalNotes('');
        if (pickedCoords) {
          setLat(pickedCoords.lat);
          setLng(pickedCoords.lng);
          setHasLocationPicked(true);
        } else {
          setLat(36.8);
          setLng(44.5);
          setHasLocationPicked(false);
        }
        setTag('principality');
        setCollectionId('powers');
      }
      setConfirmDelete(false);
    }
  }, [isOpen, factToEdit]);

  // Update coords if picked from map
  useEffect(() => {
    if (pickedCoords) {
      setLat(pickedCoords.lat);
      setLng(pickedCoords.lng);
      setHasLocationPicked(true);
    }
  }, [pickedCoords]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const item: FactItem = {
      id: factToEdit ? factToEdit.id : Date.now(),
      num: factToEdit ? factToEdit.num : totalFactsCount + 1,
      eraId: factToEdit ? factToEdit.eraId : 4,
      eraName: factToEdit ? factToEdit.eraName : 'دەسەڵاتە مێژووییەکان',
      eraPeriod: factToEdit ? factToEdit.eraPeriod : 'مێژووی کوردستان',
      name: name.trim(),
      desc: desc.trim() || 'کوردستان',
      fullText: fullText.trim(),
      additionalNotes: additionalNotes.trim(),
      lat: Number(lat),
      lng: Number(lng),
      zoom: factToEdit ? factToEdit.zoom : 8,
      tag: tag,
      collectionId: collectionId,
      isCustom: true,
    };

    onSave(item);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1250] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in text-right">
      <div
        className="relative w-full max-w-lg bg-black border border-indigo-900/90 rounded-2xl p-4 sm:p-5 shadow-[0_0_60px_rgba(79,70,229,0.35)] max-h-[92vh] overflow-y-auto text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-indigo-950 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-500/40 flex items-center justify-center shadow-[0_0_12px_rgba(79,70,229,0.3)]">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {factToEdit ? 'دەستکاریکردنی دەسەڵات و زانیاری' : 'زیادکردنی دەسەڵات و شوێنی نوێ'}
              </h3>
              <p className="text-[10px] text-indigo-300/70">
                {factToEdit
                  ? `دەستکاریکردنی #${factToEdit.num} ${factToEdit.name}`
                  : 'تۆمارکردنی خاڵ و دەسەڵاتی نوێ لەسەر نەخشەی کوردستان'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-indigo-400 hover:text-white hover:bg-indigo-950 transition-colors"
            title="داخستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {/* Name */}
          <div>
            <label className="block text-[11px] font-bold text-indigo-300 mb-1">
              ناوی دەسەڵات / فەرمانڕەوا / شوێن *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="بۆ نموونە: ئەتابەگ نەسرەدین ئەحمەد، قەڵای شێروانە، دەوڵەتی زەند..."
              className="w-full bg-[#030712] text-white px-3 py-2 rounded-xl border border-indigo-900/60 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Location / Geo description */}
          <div>
            <label className="block text-[11px] font-bold text-indigo-300 mb-1">
              پێگەی جوگرافی / شار یان ناوچە
            </label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="بۆ نموونە: ئیزە و ئەسفەهان (لوڕی گەورە)، سلێمانی، ورمێ، ئامەد..."
              className="w-full bg-[#030712] text-white px-3 py-2 rounded-xl border border-indigo-900/60 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* 100% Visual Map Location Picker (NO Coordinate Numbers!) */}
          <div className="p-3 rounded-xl bg-gradient-to-b from-[#060a1c] to-black border border-indigo-900/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>دیاریکردنی شوێن لەسەر نەخشە</span>
              </span>

              <button
                type="button"
                onClick={onStartPickLocation}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all cursor-pointer active:scale-95"
              >
                <Crosshair className="w-3.5 h-3.5 text-white" />
                <span>
                  {hasLocationPicked
                    ? 'گۆڕینی شوێن لەسەر نەخشە'
                    : 'کلیک بکە بۆ دیاریکردن لەسەر نەخشە'}
                </span>
              </button>
            </div>

            {/* Visual confirmation badge */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-black border border-indigo-950 text-[11px]">
              {hasLocationPicked ? (
                <div className="flex items-center gap-2 text-emerald-400">
                  <div className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-500/50 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-emerald-400" />
                  </div>
                  <span className="font-medium">
                    شوێنی ئەم دەسەڵاتە لەسەر نەخشەی کوردستان دیاریکراوە.
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-300">
                  <div className="w-5 h-5 rounded-full bg-amber-950 border border-amber-500/50 flex items-center justify-center shrink-0">
                    <MapPin className="w-3 h-3 text-amber-400 animate-bounce" />
                  </div>
                  <span>
                    تکایە دوگمەی سەرەوە دابگرە تا بە کلیک شوێنەکەی لەسەر نەخشە دەستنیشان بکەیت.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Collection & Tag Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-indigo-300 mb-1 flex items-center gap-1">
                <Layers className="w-3 h-3 text-indigo-400" />
                کۆلێکشن
              </label>
              <select
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
                className="w-full bg-[#030712] text-indigo-200 px-2.5 py-2 rounded-xl border border-indigo-900/60 focus:border-indigo-500 text-xs"
              >
                {collections
                  .filter((c) => c.id !== 'all')
                  .map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-indigo-300 mb-1">
                جۆر / پۆلێن
              </label>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value as FactItem['tag'])}
                className="w-full bg-[#030712] text-indigo-200 px-2.5 py-2 rounded-xl border border-indigo-900/60 focus:border-indigo-500 text-xs"
              >
                <option value="principality">میرنشین و دەسەڵات</option>
                <option value="empire">ئیمپراتۆریەت و دەوڵەت</option>
                <option value="capital">قەڵا و پایتەخت</option>
                <option value="figure">کەسایەتی و فەرمانڕەوا</option>
                <option value="battle">جەنگ و ڕووداو</option>
                <option value="culture">کولتوور و زانست</option>
              </select>
            </div>
          </div>

          {/* Full Historical Text */}
          <div>
            <label className="block text-[11px] font-bold text-indigo-300 mb-1 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              پوختەی مێژوویی و شوێنەواری
            </label>
            <textarea
              rows={3}
              value={fullText}
              onChange={(e) => setFullText(e.target.value)}
              placeholder="وەسفی مێژوویی ئەم دەسەڵاتە، ساڵانی فەرمانڕەوایی، ڕووداوەکان..."
              className="w-full bg-[#030712] text-white px-3 py-2 rounded-xl border border-indigo-900/60 focus:border-indigo-500 focus:outline-none leading-relaxed text-xs"
            />
          </div>

          {/* Additional Information Box (بۆکسی زانیاری زیادە) */}
          <div className="p-2.5 rounded-xl bg-gradient-to-b from-[#050714] to-black border border-indigo-900/70 space-y-1.5">
            <label className="block text-[11px] font-bold text-amber-300 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              بۆکسی زانیاریی زیادە (بەڵگەنامە، دەستنووس و تێبینی تایبەت)
            </label>
            <textarea
              rows={3}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="لێرە زانیاری و سەرچاوەی زیادە، دەقی دەستنووس، وتەی مێژوونووسان یان تێبینی بنووسە..."
              className="w-full bg-black text-indigo-100 placeholder:text-indigo-400/30 px-3 py-2 rounded-lg border border-indigo-950 focus:border-amber-500/80 focus:outline-none text-xs leading-relaxed"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-indigo-950">
            {factToEdit && onDelete && (
              <div>
                {confirmDelete ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(factToEdit.id);
                        onClose();
                      }}
                      className="px-2 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] flex items-center gap-1 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>دڵنیام، بیسڕەوە</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-2 py-1.5 rounded-lg bg-indigo-950 text-indigo-300 text-[10px]"
                    >
                      پەشیمانبوونەوە
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="p-2 rounded-lg text-red-400 hover:text-white hover:bg-red-950/60 border border-red-950 transition-colors"
                    title="سڕینەوەی ئەم دەسەڵاتە"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 mr-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-xl bg-black border border-indigo-950 text-indigo-300 hover:text-white text-xs transition-all"
              >
                داخستن
              </button>

              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>پاشەکەوتکردن</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
