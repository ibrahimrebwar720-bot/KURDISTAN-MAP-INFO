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
  '#6366f1', // Indigo
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#eab308', // Amber
  '#f97316', // Orange
  '#ef4444', // Red
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#14b8a6', // Teal
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
  const [color, setColor] = useState('#6366f1');
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
    setColor('#6366f1');
  };

  const handleStartEdit = (col: CollectionItem) => {
    setEditingId(col.id);
    setName(col.name);
    setDesc(col.description || '');
    setColor(col.color || '#6366f1');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setDesc('');
    setColor('#6366f1');
  };

  return (
    <div className="fixed inset-0 z-[1260] flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-fade-in text-right">
      <div
        className="relative w-full max-w-md bg-black border border-indigo-900/90 rounded-2xl p-4 sm:p-5 shadow-[0_0_60px_rgba(79,70,229,0.35)] max-h-[90vh] overflow-y-auto text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-indigo-950 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-500/40 flex items-center justify-center shadow-[0_0_12px_rgba(79,70,229,0.3)]">
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">بەڕێوەبردنی کۆلێکشنەکان</h3>
              <p className="text-[10px] text-indigo-300/70">
                زیادکردن و دەستکاریکردنی کۆلێکشنەکانی مینۆ
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

        {/* Add / Edit Form */}
        <form onSubmit={handleSave} className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-900/50 space-y-2.5 mb-4 text-xs">
          <h4 className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
            {editingId ? <Edit3 className="w-3.5 h-3.5 text-amber-400" /> : <Plus className="w-3.5 h-3.5 text-indigo-400" />}
            <span>{editingId ? 'دەستکاریکردنی کۆلێکشن' : 'زیادکردنی کۆلێکشن نوێ'}</span>
          </h4>

          <div>
            <label className="block text-[10px] text-indigo-300/80 mb-1">
              ناوی کۆلێکشن *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="بۆ نموونە: شاعیرانی کلاسیک، میرنشینە هاوپەیمانەکان..."
              className="w-full bg-[#030712] text-white px-3 py-1.5 rounded-lg border border-indigo-900/60 focus:border-indigo-500 text-xs"
            />
          </div>

          <div>
            <label className="block text-[10px] text-indigo-300/80 mb-1">
              وەسف و تێبینی کۆلێکشن
            </label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="وەسفێکی کورت..."
              className="w-full bg-[#030712] text-white px-3 py-1.5 rounded-lg border border-indigo-900/60 focus:border-indigo-500 text-xs"
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-[10px] text-indigo-300/80 mb-1 flex items-center gap-1">
              <Palette className="w-3 h-3" />
              ڕەنگی نیشاندەر
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full border transition-transform flex items-center justify-center cursor-pointer ${
                    color === c ? 'scale-110 border-white ring-2 ring-indigo-400/50' : 'border-black/50 opacity-80'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-3 h-3 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-2.5 py-1 rounded-lg bg-black text-indigo-300 text-[10px]"
              >
                هەڵوەشاندنەوە
              </button>
            )}
            <button
              type="submit"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-[0_0_10px_rgba(79,70,229,0.3)] transition-all cursor-pointer"
            >
              <Check className="w-3 h-3" />
              <span>{editingId ? 'نوێکردنەوە' : 'زیادکردنی کۆلێکشن'}</span>
            </button>
          </div>
        </form>

        {/* Existing Collections List */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-indigo-300 block mb-1">
            کۆلێکشنە بەردەستەکان ({collections.length})
          </span>

          <div className="divide-y divide-indigo-950/60 border border-indigo-950 rounded-xl overflow-hidden bg-black max-h-56 overflow-y-auto">
            {collections.map((col) => (
              <div
                key={col.id}
                className="flex items-center justify-between gap-2 p-2 hover:bg-indigo-950/20 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: col.color }}
                  />
                  <div className="min-w-0">
                    <span className="font-semibold text-white truncate block">
                      {col.name}
                    </span>
                    {col.description && (
                      <span className="text-[9px] text-indigo-300/60 truncate block">
                        {col.description}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleStartEdit(col)}
                    className="p-1 rounded text-indigo-400 hover:text-white hover:bg-indigo-950 transition-colors"
                    title="دەستکاریکردن"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>

                  {col.id !== 'all' && (
                    <button
                      onClick={() => onDeleteCollection(col.id)}
                      className="p-1 rounded text-red-400 hover:text-white hover:bg-red-950/60 transition-colors"
                      title="سڕینەوە"
                    >
                      <Trash2 className="w-3 h-3" />
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
