import React from 'react';
import { X, BookOpen, Map, Sparkles, Shield, Heart } from 'lucide-react';
import { ERAS } from '../data/kurdishHistoryData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-heading text-slate-100">
                دەربارەی ئینسایکلۆپیدیا و نەخشەی دەسەڵاتە کوردییەکان
              </h3>
              <p className="text-xs text-slate-400">وەشانی پڕۆفیشناڵ و دەوڵەمەند (v10.0)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 text-sm text-slate-300 leading-relaxed text-right">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
            <h4 className="font-bold text-amber-300 mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              ئامانجی ئەم وێبسایتە
            </h4>
            <p className="text-xs sm:text-sm">
              پێشکەشکردنی بەڵگەمەند و گشتگیری ٢٠٠ وێستگە، دەسەڵات، میرنشین، ئیمپراتۆریەت، شارستانیەت و کەسایەتیی مێژووی دێرین و مۆدێرنی کورد بە هاوڕێیەتی نەخشەی کارلێککاری جوگرافی (Leaflet Interactive Map) لەسەر چوار پارچەی کوردستانی گەورە.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-100 text-base mb-3 flex items-center gap-2">
              <Map className="w-4 h-4 text-amber-400" />
              پێنج سەردەمە مێژووییەکە:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ERAS.map((era) => (
                <div
                  key={era.id}
                  className="p-3 rounded-xl bg-slate-850 border border-slate-800 space-y-1"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                    <span>بەشی {era.id}: {era.title}</span>
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-300">{era.count} شوێن</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">{era.range}</p>
                  <p className="text-xs text-slate-300 line-clamp-2">{era.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-800 pt-4">
            <h4 className="font-bold text-slate-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              سەرچاوە و شێوازی نەخشەسازی
            </h4>
            <p className="text-xs text-slate-400 leading-normal">
              زانیارییەکان لەسەر بنەمای بەڵگەنامە شوێنەوارییەکان (ئەشکەوتی شانەدەر، جەرمۆ، نەخشی ئەنوبانینی، قەزقاپان، زیویە، هەسەنلو)، کتێبی ئاناباسیسی زەینەفۆن، شەرەفنامەی شەرەفخانی بدلیسی (١٥٩٧)، و نەخشەی مێژوویی چوار پارچەی کوردستان (باکوور، ڕۆژئاوا، باشوور و ڕۆژهەڵاتی کوردستان) ئامادەکراون.
            </p>
          </div>

          <div className="border-t border-slate-800 pt-4 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
            <span>دروستکراوە بە خۆشەویستی بۆ مێژوو و ناسنامەی دەوڵەمەندی کوردستان</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-current inline" />
          </div>
        </div>
      </div>
    </div>
  );
};
