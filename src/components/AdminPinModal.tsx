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
    <div className="fixed inset-0 z-[1300] flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-fade-in text-right">
      <div
        className="relative w-full max-w-sm bg-black border border-indigo-900/80 rounded-2xl p-5 shadow-[0_0_60px_rgba(79,70,229,0.3)] text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 left-3.5 p-1 rounded-lg text-indigo-400 hover:text-white hover:bg-indigo-950 transition-colors"
          title="داخستن"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-950/90 border border-indigo-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.35)] mb-2.5">
            <Lock className="w-6 h-6 text-indigo-400 animate-pulse" />
          </div>
          <h3 className="text-sm font-bold text-white tracking-wide">
            چالاککردنی بەشی ئەدمین
          </h3>
          <p className="text-[11px] text-indigo-300/80 mt-1">
            تکایە کۆدی نهێنیی ئەدمین بنووسە بۆ بەڕێوەبردنی سیستمەکە:
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              type="password"
              inputMode="numeric"
              maxLength={10}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="کۆدی ئەدمین (٦ ژمارە)..."
              autoFocus
              className="w-full h-11 bg-[#030712] text-center font-mono text-lg font-bold tracking-widest text-indigo-200 rounded-xl border border-indigo-900/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none placeholder:text-indigo-400/30 placeholder:tracking-normal placeholder:text-xs"
            />
            <KeyRound className="w-4 h-4 text-indigo-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Keypad Quick Input */}
          <div className="grid grid-cols-3 gap-1.5 pt-1" dir="ltr">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  if (k === 'C') setPin('');
                  else if (k === '⌫') handleBackspace();
                  else handleKeypadPress(k);
                }}
                className="h-10 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/60 active:scale-95 border border-indigo-900/40 text-sm font-mono font-bold text-indigo-200 transition-all flex items-center justify-center cursor-pointer"
              >
                {k}
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-red-950/60 border border-red-800/60 text-red-300 text-[11px] animate-shake">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>کۆدی داخڵکراو هەڵەیە، تکایە دڵنیابەرەوە!</span>
            </div>
          )}

          {success && (
            <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-[11px] animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>کۆد درووستە! دەسەڵاتی ئەدمین ئەکتیڤ دەکرێت...</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs shadow-[0_0_20px_rgba(79,70,229,0.4)] border border-indigo-400/40 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>چوونەژوورەوە و چالاککردن</span>
          </button>
        </form>
      </div>
    </div>
  );
};
