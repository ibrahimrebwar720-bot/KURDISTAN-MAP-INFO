import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, X, Lock, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ADMIN_SECRET_CODE } from '../types/history';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminPinModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const { isEn, dir } = useLanguage();
  const { colorMode } = useTheme();
  const isDark = colorMode === 'dark';
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(false);
      setSuccess(false);
    } else {
      clearTimers();
    }
  }, [isOpen]);

  useEffect(() => {
    return () => clearTimers();
  }, []);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (pin.trim() === ADMIN_SECRET_CODE) {
      setSuccess(true);
      setError(false);
      clearTimers();
      successTimerRef.current = setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } else {
      setError(true);
      setPin('');
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setError(false), 2500);
    }
  };

  const handleKeypadPress = (num: string) => {
    if (pin.length < 8) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin === ADMIN_SECRET_CODE) {
        setSuccess(true);
        clearTimers();
        successTimerRef.current = setTimeout(() => {
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
      className={`fixed inset-0 z-[1300] flex items-center justify-center p-3.5 animate-fade-in text-start ${
        isDark ? 'bg-black/85' : 'bg-slate-900/50'
      }`}
      dir={dir}
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-sm rounded-[4px] p-6 overflow-hidden animate-modal-spring border ${
          isDark
            ? 'bg-[#0b0f1c] border-amber-500/30 border-t-amber-400/50 text-slate-100 shadow-[0_25px_80px_rgba(0,0,0,0.95)]'
            : 'bg-white border-slate-300 border-t-amber-600/60 text-slate-900 shadow-[0_24px_60px_rgba(15,23,42,0.18)]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 end-4 w-8 h-8 rounded-[4px] flex items-center justify-center border transition-colors cursor-pointer ${
            isDark
              ? 'text-slate-300 hover:text-white bg-[#101626] border-amber-500/20 hover:border-amber-400/50'
              : 'text-slate-600 hover:text-slate-950 bg-slate-100 border-slate-300 hover:border-amber-600'
          }`}
          title={isEn ? 'Close' : 'داخستن'}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-5">
          <div
            className={`w-13 h-13 rounded-[4px] border flex items-center justify-center mb-3 ${
              isDark
                ? 'bg-[#101626] border-amber-500/30 text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.2)]'
                : 'bg-amber-50 border-amber-300 text-amber-800 shadow-xs'
            }`}
          >
            <Lock className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className={`text-base font-bold tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {isEn ? 'Administrator Access' : 'چوونەژوورەوەی بەڕێوەبەر (ئەدمین)'}
          </h3>
          <p className={`text-xs mt-1 max-w-[260px] ${isDark ? 'text-amber-200/80' : 'text-slate-600'}`}>
            {isEn
              ? 'Enter the admin PIN code to manage historical entries & AI translations'
              : 'تکایە کۆدی نهێنی بنووسە بۆ بەڕێوەبردنی نەخشە و زانیارییەکان'}
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
              placeholder={isEn ? 'Admin PIN...' : 'کۆدی ئەدمین...'}
              autoFocus
              className={`w-full h-12 border text-center font-mono text-xl font-extrabold tracking-widest rounded-[4px] placeholder:tracking-normal placeholder:text-xs focus:outline-none ${
                isDark
                  ? 'bg-[#070b14] border-amber-500/30 text-amber-300 placeholder:text-slate-500 focus:border-amber-400'
                  : 'bg-slate-50 border-slate-300 text-amber-900 placeholder:text-slate-500 focus:border-amber-700'
              }`}
            />
            <KeyRound
              className={`w-4 h-4 absolute end-4 top-1/2 -translate-y-1/2 pointer-events-none ${
                isDark ? 'text-amber-400' : 'text-amber-800'
              }`}
            />
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
                className={`h-11 rounded-[4px] border active:scale-95 text-sm font-mono font-bold transition-all flex items-center justify-center cursor-pointer shadow-xs ${
                  isDark
                    ? 'bg-[#101626] hover:bg-[#182033] border-amber-500/20 hover:border-amber-400/50 text-slate-200 hover:text-amber-300'
                    : 'bg-slate-100 hover:bg-amber-50 border-slate-300 hover:border-amber-600 text-slate-900 hover:text-amber-900'
                }`}
              >
                {k}
              </button>
            ))}
          </div>

          {error && (
            <div
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-[4px] border text-xs animate-shake font-medium ${
                isDark
                  ? 'bg-red-950/80 border-red-500/70 text-red-200'
                  : 'bg-red-50 border-red-300 text-red-800'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{isEn ? 'Incorrect PIN code, please try again!' : 'کۆدی داخڵکراو هەڵەیە، دووبارە تاقی بکەرەوە!'}</span>
            </div>
          )}

          {success && (
            <div
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-[4px] border text-xs animate-fade-in font-bold ${
                isDark
                  ? 'bg-emerald-950/80 border-emerald-500/70 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{isEn ? 'PIN verified! Unlocking admin tools...' : 'کۆد درووستە! دەروازەی ئەدمین دەکرێتەوە...'}</span>
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-3 rounded-[4px] font-extrabold text-xs transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 ${
              isDark
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.35)]'
                : 'bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white shadow-md preserve-contrast'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isEn ? 'Sign In & Activate' : 'چوونەژوورەوە و چالاککردن'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
