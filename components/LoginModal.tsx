'use client';

import React, { useState } from 'react';
import { User, Store } from '@/lib/db';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User, store: Store) => void;
  onOpenRegister: () => void;
}

export default function LoginModal({ isOpen, onClose, onSuccess, onOpenRegister }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Giriş yapılamadı.');
      }

      onSuccess(data.user, data.store);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Giriş hatası.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: demoPass }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Giriş yapılamadı.');
      }

      onSuccess(data.user, data.store);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Demo girişi başarısız.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🏪</span>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">EsnafCepte Giriş</span>
          </div>
          <h2 className="text-xl font-black">Dükkanınıza Giriş Yapın</h2>
          <p className="text-slate-300 text-xs mt-1">
            Kasanızı ve stok sayımınızı yönetmek için bilgilerinizi giriniz.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                E-Posta Adresi
              </label>
              <input
                type="email"
                required
                placeholder="esnaf@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Şifre
              </label>
              <input
                type="password"
                required
                placeholder="••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm"
            >
              {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>

          {/* Quick Demo Access */}
          <div className="pt-3 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
              Veya Tek Tıkla Hazır Demo Hesabı Açın
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('demo@esnafcepte.com', '123456')}
                className="text-left p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all flex items-center justify-between text-xs font-semibold text-slate-800"
              >
                <span className="flex items-center gap-2">
                  <span>📚</span>
                  <span>Ahmet Usta (Kırtasiye & Tuhafiye Demo)</span>
                </span>
                <span className="text-emerald-600 font-bold">Giriş ➔</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-600 flex items-center justify-center gap-1">
          Henüz dükkanınız yok mu?
          <button
            onClick={() => {
              onClose();
              onOpenRegister();
            }}
            className="text-emerald-700 font-bold hover:underline"
          >
            14 Gün Ücretsiz Kaydolun
          </button>
        </div>
      </div>
    </div>
  );
}
