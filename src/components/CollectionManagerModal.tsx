import React, { useState } from 'react';
import { CollectionItem } from '../types/history';
import { X, Plus, Trash2, Edit3, Check, Layers, Palette } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  collections: CollectionItem[];
  onAddCollection: (col: CollectionItem) => void;
  onUpdateCollection: (col: CollectionItem) => void;
  onDeleteCollection: (id: string) => void;
}

const PRESET_COLORS = [
  '#f59e0b', // Amber / Gold
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#ec4899', // Rose Pink
  '#8b5cf6', // Violet
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#ef4444', // Red
];

export const CollectionManagerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  collections,
  onAddCollection,
  onUpdateCollection,
  onDeleteCollection,
}) => {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [color, setColor] = useState('#f59e0b');
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId) {
      const existing = collections.find((c) => c.id === editingId);
      if (existing) {
        onUpdateCollection({
          ...existing,
          name: name.trim(),
          description: desc.trim(),
          color,
        });
      }
      setEditingId(null);
    } else {
      const newCol: CollectionItem = {
        id: `custom_${Date.now()}`,
        name: name.trim(),
        description: desc.trim(),
        color,
        isCustom: true,
      };
      onAddCollection(newCol);
    }

    setName('');
    setDesc('');
    setColor('#f59e0b');
  };

  const handleStartEdit = (col: CollectionItem) => {
    setEditingId(col.id);
    setName(col.name);
    setDesc(col.description || '');
    setColor(col.color || '#f59e0b');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setDesc('');
    setColor('#f59e0b');
  };

  return (
    <div
      className="fixed inset-0 z-[1260] flex items-center justify-center p-3.5 bg-black/85 backdrop-blur-md animate-fade-in text-right"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#090d16] border border-amber-500/35 rounded-3xl p-5 sm:p-6 shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_50px_rgba(245,158,11,0.15)] max-h-[90vh] overflow-y-auto text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-3.5 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Layers className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">بەڕێوەبردنی دەستە و کۆلێکشنەکان</h3>
              <p className="text-[11px] text-slate-400">
                زیادکردن و دەستکاریکردنی دەستەکانی پێڕست
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
            title="داخستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Add / Edit Form Card */}
        <form onSubmit={handleSave} className="p-4 rounded-2xl bg-[#0e1526]/90 border border-slate-800 hover:border-amber-500/30 space-y-3 mb-4 text-xs transition-colors">
          <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 pb-1 border-b border-slate-800/80">
            {editingId ? <Edit3 className="w-3.5 h-3.5 text-amber-400" /> : <Plus className="w-3.5 h-3.5 text-amber-400" />}
            <span>{editingId ? 'دەستکاریکردنی دەستە' : 'زیادکردنی دەستەی نوێ'}</span>
          </h4>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              ناوی کۆلێکشن *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="بۆ نموونە: شاعیرانی کلاسیک، میرنشینە هاوپەیمانەکان..."
              className="w-full bg-[#050812] text-white px-3 py-2 rounded-xl border border-slate-700/80 focus:border-amber-400 focus:outline-none text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              وەسف و تێبینی کورت
            </label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="وەسفێکی کورت..."
              className="w-full bg-[#050812] text-white px-3 py-2 rounded-xl border border-slate-700/80 focus:border-amber-400 focus:outline-none text-xs"
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1.5 flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span>ڕەنگی نیشاندەر لەسەر نەخشە</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform flex items-center justify-center cursor-pointer ${
                    color === c ? 'scale-110 border-white ring-2 ring-amber-400/50' : 'border-slate-800 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-black drop-shadow-sm" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-slate-800/80">
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs hover:text-white cursor-pointer"
              >
                هەڵوەشاندنەوە
              </button>
            )}
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs shadow-sm transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{editingId ? 'نوێکردنەوە' : 'زیادکردنی کۆلێکشن'}</span>
            </button>
          </div>
        </form>

        {/* Existing Collections List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">
              کۆلێکشنە بەردەستەکان
            </span>
            <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
              {collections.length} دەستە
            </span>
          </div>

          <div className="divide-y divide-slate-800 border border-slate-800 rounded-2xl overflow-hidden bg-[#050812] max-h-56 overflow-y-auto custom-scrollbar">
            {collections.map((col) => (
              <div
                key={col.id}
                className="flex items-center justify-between gap-3 p-3 hover:bg-slate-900/60 transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: col.color }}
                  />
                  <div className="min-w-0">
                    <span className="font-bold text-white truncate block">
                      {col.name}
                    </span>
                    {col.description && (
                      <span className="text-[11px] text-slate-400 truncate block mt-0.5">
                        {col.description}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleStartEdit(col)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors cursor-pointer"
                    title="دەستکاریکردن"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {col.id !== 'all' && (
                    <button
                      onClick={() => onDeleteCollection(col.id)}
                      className="p-1.5 rounded-lg text-red-400 hover:text-white hover:bg-red-950/70 transition-colors cursor-pointer"
                      title="سڕینەوە"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
