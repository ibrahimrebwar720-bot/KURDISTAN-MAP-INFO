import React, { useState } from 'react';
import { CollectionItem } from '../types/history';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { formatDigits } from '../utils/yearUtils';
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
  const { language, isEn, dir } = useLanguage();
  const { colorMode } = useTheme();
  const isDark = colorMode === 'dark';
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [descEn, setDescEn] = useState('');
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
          ...(isEn
            ? { nameEn: name.trim(), descriptionEn: desc.trim() }
            : {
                ...(nameEn.trim() ? { nameEn: nameEn.trim() } : {}),
                ...(descEn.trim() ? { descriptionEn: descEn.trim() } : {}),
              }),
          color,
        });
      }
      setEditingId(null);
    } else {
      const newCol: CollectionItem = {
        id: `custom_${Date.now()}`,
        name: name.trim(),
        description: desc.trim(),
        ...(isEn
          ? { nameEn: name.trim(), descriptionEn: desc.trim() }
          : {
              ...(nameEn.trim() ? { nameEn: nameEn.trim() } : {}),
              ...(descEn.trim() ? { descriptionEn: descEn.trim() } : {}),
            }),
        color,
        isCustom: true,
      };
      onAddCollection(newCol);
    }

    setName('');
    setDesc('');
    setNameEn('');
    setDescEn('');
    setColor('#f59e0b');
  };

  const handleStartEdit = (col: CollectionItem) => {
    setEditingId(col.id);
    setName(isEn ? col.nameEn || col.name : col.name);
    setDesc(isEn ? col.descriptionEn || col.description || '' : col.description || '');
    setNameEn(col.nameEn || '');
    setDescEn(col.descriptionEn || '');
    setColor(col.color || '#f59e0b');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setDesc('');
    setNameEn('');
    setDescEn('');
    setColor('#f59e0b');
  };

  return (
    <div
      dir={dir}
      className="fixed inset-0 z-[1260] flex items-center justify-center p-3.5 bg-black/80 backdrop-blur-xl animate-fade-in text-start"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-md rounded-3xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto custom-scrollbar overflow-hidden animate-modal-spring border transition-colors ${
          isDark
            ? 'liquid-glass-panel text-slate-100 shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_25px_80px_rgba(0,0,0,0.95),0_0_40px_rgba(245,158,11,0.2)]'
            : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {isDark && <div className="glass-specular-ray" />}

        {/* Header */}
        <div
          className={`flex items-center justify-between border-b pb-3.5 mb-4 ${
            isDark ? 'border-white/10' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                isDark
                  ? 'liquid-glass-btn text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)] border-white/10'
                  : 'bg-amber-100 text-amber-800 border-amber-300 shadow-xs'
              }`}
            >
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isEn ? 'Manage Categories & Collections' : 'بەڕێوەبردنی دەستە و کۆلێکشنەکان'}
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-amber-200/80' : 'text-amber-800'}`}>
                {isEn
                  ? 'Add or edit independent directory collections'
                  : 'زیادکردن و دەستکاریکردنی دەستەکانی پێڕست'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-colors cursor-pointer ${
              isDark
                ? 'text-slate-300 hover:text-white liquid-glass-btn border-white/10'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-300'
            }`}
            title={isEn ? 'Close' : 'داخستن'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Add / Edit Form Card */}
        <form
          onSubmit={handleSave}
          className={`p-4 rounded-2xl border space-y-3 mb-4 text-xs transition-all shadow-sm ${
            isDark
              ? 'liquid-glass-card border-white/10'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <h4
            className={`text-xs font-bold flex items-center gap-1.5 pb-1 border-b ${
              isDark
                ? 'text-amber-300 border-white/10'
                : 'text-amber-900 border-slate-200'
            }`}
          >
            {editingId ? (
              <Edit3 className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
            ) : (
              <Plus className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
            )}
            <span>
              {editingId
                ? isEn
                  ? 'Edit Collection'
                  : 'دەستکاریکردنی دەستە'
                : isEn
                ? 'Add New Collection'
                : 'زیادکردنی دەستەی نوێ'}
            </span>
          </h4>

          <div>
            <label
              className={`block text-[11px] font-bold mb-1 ${
                isDark ? 'text-amber-200/90' : 'text-slate-800'
              }`}
            >
              {isEn ? 'Collection Name *' : 'ناوی کۆلێکشن *'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                isEn
                  ? 'e.g. Classical Poets, Allied Emirates...'
                  : 'بۆ نموونە: شاعیرانی کلاسیک، میرنشینە هاوپەیمانەکان...'
              }
              className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                isDark
                  ? 'liquid-glass-input text-white border-white/15'
                  : 'bg-white text-slate-900 placeholder:text-slate-400 border-slate-300 focus:border-amber-600'
              }`}
            />
          </div>

          <div>
            <label
              className={`block text-[11px] font-bold mb-1 ${
                isDark ? 'text-amber-200/90' : 'text-slate-800'
              }`}
            >
              {isEn ? 'Short Description' : 'وەسف و تێبینی کورت'}
            </label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder={isEn ? 'Short summary...' : 'وەسفێکی کورت...'}
              className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                isDark
                  ? 'liquid-glass-input text-white border-white/15'
                  : 'bg-white text-slate-900 placeholder:text-slate-400 border-slate-300 focus:border-amber-600'
              }`}
            />
          </div>

          {!isEn && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div>
                <label
                  className={`block text-[10px] font-bold mb-1 ${
                    isDark ? 'text-sky-200/90' : 'text-sky-800'
                  }`}
                >
                  ناوی ئینگلیزی (دڵخواز - بۆ هاوکاتکردن)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="Auto-translated if empty"
                  className={`w-full px-2.5 py-1.5 rounded-xl text-[11px] border focus:outline-none ${
                    isDark
                      ? 'liquid-glass-input text-white border-white/15'
                      : 'bg-white text-slate-900 placeholder:text-slate-400 border-slate-300 focus:border-sky-600'
                  }`}
                />
              </div>
              <div>
                <label
                  className={`block text-[10px] font-bold mb-1 ${
                    isDark ? 'text-sky-200/90' : 'text-sky-800'
                  }`}
                >
                  وەسفی ئینگلیزی (دڵخواز)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={descEn}
                  onChange={(e) => setDescEn(e.target.value)}
                  placeholder="Optional English summary"
                  className={`w-full px-2.5 py-1.5 rounded-xl text-[11px] border focus:outline-none ${
                    isDark
                      ? 'liquid-glass-input text-white border-white/15'
                      : 'bg-white text-slate-900 placeholder:text-slate-400 border-slate-300 focus:border-sky-600'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Color picker */}
          <div>
            <label
              className={`block text-[11px] font-bold mb-1.5 flex items-center gap-1 ${
                isDark ? 'text-amber-200/90' : 'text-slate-800'
              }`}
            >
              <Palette className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
              <span>{isEn ? 'Map Marker Color' : 'ڕەنگی نیشاندەر لەسەر نەخشە'}</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform flex items-center justify-center cursor-pointer ${
                    color === c
                      ? isDark
                        ? 'scale-110 border-white ring-2 ring-amber-400/50'
                        : 'scale-110 border-slate-900 ring-2 ring-amber-600/50'
                      : isDark
                      ? 'border-black/40 opacity-80 hover:opacity-100'
                      : 'border-slate-300 opacity-85 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] font-bold" />}
                </button>
              ))}
            </div>
          </div>

          <div
            className={`flex items-center justify-end gap-2 pt-1.5 border-t ${
              isDark ? 'border-white/10' : 'border-slate-200'
            }`}
          >
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className={`px-3 py-1.5 rounded-xl text-xs cursor-pointer border font-semibold ${
                  isDark
                    ? 'liquid-glass-btn text-slate-300 hover:text-white border-white/10'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                {isEn ? 'Cancel' : 'هەڵوەشاندنەوە'}
              </button>
            )}
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl liquid-glass-btn-active font-extrabold text-xs shadow-sm transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>
                {editingId
                  ? isEn
                    ? 'Update'
                    : 'نوێکردنەوە'
                  : isEn
                  ? 'Add Collection'
                  : 'زیادکردنی کۆلێکشن'}
              </span>
            </button>
          </div>
        </form>

        {/* Existing Collections List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {isEn ? 'Available Collections' : 'کۆلێکشنە بەردەستەکان'}
            </span>
            <span
              className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                isDark
                  ? 'text-amber-300 liquid-glass-subtle border-white/10'
                  : 'text-amber-900 bg-amber-100 border-amber-300'
              }`}
            >
              {isEn
                ? `${collections.length} items`
                : `${formatDigits(collections.length, language)} دەستە`}
            </span>
          </div>

          <div
            className={`divide-y border rounded-2xl overflow-hidden max-h-56 overflow-y-auto custom-scrollbar ${
              isDark
                ? 'divide-white/10 border-white/15 liquid-glass-subtle'
                : 'divide-slate-200 border-slate-200 bg-slate-50'
            }`}
          >
            {collections.map((col) => {
              const displayName = isEn ? col.nameEn || col.name : col.name;
              const displayDesc = isEn ? col.descriptionEn || col.description : col.description;
              return (
                <div
                  key={col.id}
                  className={`flex items-center justify-between gap-3 p-3 transition-colors text-xs ${
                    isDark ? 'hover:bg-white/5' : 'hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: col.color }}
                    />
                    <div className="min-w-0">
                      <span
                        className={`font-bold truncate block ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {displayName}
                      </span>
                      {displayDesc && (
                        <span
                          className={`text-[11px] truncate block mt-0.5 ${
                            isDark ? 'text-slate-300/80' : 'text-slate-600'
                          }`}
                        >
                          {displayDesc}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleStartEdit(col)}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        isDark
                          ? 'liquid-glass-btn text-slate-300 hover:text-amber-300 border-white/10'
                          : 'bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-800 border-slate-300'
                      }`}
                      title={isEn ? 'Edit' : 'دەستکاریکردن'}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {col.id !== 'all' && (
                      <button
                        onClick={() => onDeleteCollection(col.id)}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          isDark
                            ? 'text-red-300 hover:text-white liquid-glass-btn border-white/10'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border-rose-200'
                        }`}
                        title={isEn ? 'Delete' : 'سڕینەوە'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

