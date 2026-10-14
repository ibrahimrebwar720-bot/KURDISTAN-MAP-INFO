import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, Lock, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ADMIN_SECRET_CODE } from '../types/history';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminPinModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(false);
      setSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (pin.trim() === ADMIN_SECRET_CODE) {
      setSuccess(true);
      setError(false);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } else {
      setError(true);
      setPin('');
      setTimeout(() => setError(false), 2500);
    }
  };

  const handleKeypadPress = (num: string) => {
    if (pin.length < 8) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin === ADMIN_SECRET_CODE) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 700);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center p-3.5 bg-black/85 backdrop-blur-md animate-fade-in text-right"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-[#070b14]/85 border border-amber-500/25 rounded-3xl p-6 shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_40px_rgba(245,158,11,0.15)] backdrop-blur-2xl text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
          title="داخستن"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-500/25 via-amber-900/30 to-black border border-amber-500/40 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.25)] mb-3">
            <Lock className="w-6 h-6 text-amber-400 animate-pulse" />
          </div>
          <h3 className="text-base font-bold text-white tracking-wide">
            چوونەژوورەوەی بەڕێوەبەر (ئەدمین)
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
            تکایە کۆدی نهێنی بنووسە بۆ بەڕێوەبردنی نەخشە و زانیارییەکان
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="password"
              inputMode="numeric"
              maxLength={10}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="کۆدی ئەدمین..."
              autoFocus
              className="w-full h-12 bg-[#050812] text-center font-mono text-xl font-extrabold tracking-widest text-amber-300 rounded-2xl border border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 focus:outline-none placeholder:text-slate-600 placeholder:tracking-normal placeholder:text-xs"
            />
            <KeyRound className="w-4 h-4 text-amber-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Keypad Quick Input */}
          <div className="grid grid-cols-3 gap-2 pt-1" dir="ltr">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  if (k === 'C') setPin('');
                  else if (k === '⌫') handleBackspace();
                  else handleKeypadPress(k);
                }}
                className="h-11 rounded-xl bg-slate-900/90 hover:bg-amber-500/20 active:scale-95 border border-slate-800 hover:border-amber-500/40 text-sm font-mono font-bold text-slate-200 hover:text-amber-300 transition-all flex items-center justify-center cursor-pointer shadow-xs"
              >
                {k}
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-950/80 border border-red-500/70 text-red-200 text-xs animate-shake font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>کۆدی داخڵکراو هەڵەیە، دووبارە تاقی بکەرەوە!</span>
            </div>
          )}

          {success && (
            <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-950/80 border border-emerald-500/70 text-emerald-300 text-xs animate-fade-in font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>کۆد درووستە! دەروازەی ئەدمین دەکرێتەوە...</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs shadow-[0_0_25px_rgba(245,158,11,0.35)] transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>چوونەژوورەوە و چالاککردن</span>
          </button>
        </form>
      </div>
    </div>
  );
};
