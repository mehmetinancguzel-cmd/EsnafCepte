'use client';

import React, { useState } from 'react';
import { ShieldCheck, Lock, Delete, X, AlertTriangle } from 'lucide-react';

interface RolePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  storeId?: number;
  title?: string;
  description?: string;
}

export default function RolePinModal({
  isOpen,
  onClose,
  onSuccess,
  storeId = 1,
  title = 'Patron Güvenlik PIN Kodu',
  description = 'Alış fiyatları, kâr raporları ve yetkili işlemler için 4 haneli PIN kodunuzu girin.',
}: RolePinModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(null);
    }
  }, [isOpen]);

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      const next = pin + digit;
      setPin(next);
      setError(null);
      if (next.length === 4) {
        verifyPin(next);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(null);
  };

  const verifyPin = async (enteredPin: string) => {
    setVerifying(true);
    setError(null);
    try {
      const res = await fetch(`/api/stores/settings?storeId=${storeId}`);
      if (res.ok) {
        const data = await res.json();
        const expectedPin = data.patron_pin || '1234';
        if (enteredPin === expectedPin) {
          onSuccess();
          onClose();
        } else {
          setError('Hatalı PIN Kodu! Lütfen tekrar deneyin.');
          setPin('');
        }
      } else {
        // Fallback default
        if (enteredPin === '1234') {
          onSuccess();
          onClose();
        } else {
          setError('Hatalı PIN Kodu! (Varsayılan: 1234)');
          setPin('');
        }
      }
    } catch {
      if (enteredPin === '1234') {
        onSuccess();
        onClose();
      } else {
        setError('Hatalı PIN Kodu!');
        setPin('');
      }
    } finally {
      setVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xs w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 p-5 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-emerald-500/30">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-white">{title}</h3>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed px-2">
            {description}
          </p>
        </div>

        {/* PIN Indicators */}
        <div className="p-5 flex flex-col items-center space-y-4">
          <div className="flex gap-3">
            {[0, 1, 2, 3].map(idx => (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all ${
                  pin.length > idx
                    ? 'bg-emerald-600 scale-110 shadow-md shadow-emerald-600/30'
                    : 'bg-slate-200'
                }`}
              />
            ))}
          </div>

          {error && (
            <div className="text-rose-600 font-bold text-xs flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2 w-full pt-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(num)}
                disabled={verifying}
                className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-lg transition-all shadow-xs"
              >
                {num}
              </button>
            ))}
            <div />
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              disabled={verifying}
              className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-lg transition-all shadow-xs"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={verifying}
              className="h-12 rounded-2xl bg-slate-100 hover:bg-rose-100 hover:text-rose-700 active:scale-95 text-slate-600 flex items-center justify-center transition-all shadow-xs"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          <p className="text-[10px] text-slate-400 text-center">
            İlk kurulum varsayılan PIN kodu: <strong className="text-slate-600 font-mono">1234</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
