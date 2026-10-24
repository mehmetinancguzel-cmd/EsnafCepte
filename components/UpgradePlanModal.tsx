'use client';

import React, { useState } from 'react';
import { User, UserPlan } from '@/lib/db';

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onPlanUpdated: (updatedUser: User) => void;
}

export default function UpgradePlanModal({
  isOpen,
  onClose,
  currentUser,
  onPlanUpdated,
}: UpgradePlanModalProps) {
  const [loadingPlan, setLoadingPlan] = useState<UserPlan | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentPlan = currentUser?.plan || 'TRIAL';

  const handleSelectPlan = async (plan: UserPlan) => {
    if (!currentUser) return;
    setLoadingPlan(plan);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, plan }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(`Paketiniz başarıyla "${plan}" olarak güncellendi!`);
        onPlanUpdated(data.user);
        setTimeout(() => {
          setSuccessMessage(null);
          onClose();
        }, 1200);
      } else {
        alert(data.error || 'Plan güncellenemedi');
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Bağlantı hatası');
    } finally {
      setLoadingPlan(null);
    }
  };

  // Deneme gün sayısı hesabı
  let remainingDays = 14;
  if (currentUser?.trial_ends_at) {
    const diff = new Date(currentUser.trial_ends_at).getTime() - Date.now();
    remainingDays = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh] my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            ✕
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">⚡</span>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
              Paket Yönetimi & Deneme Durumu
            </span>
          </div>

          <h2 className="text-2xl font-black">Dükkanınızı Büyütecek Planı Seçin</h2>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
            <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
              <span>⏱️</span>
              <span>
                {currentPlan === 'TRIAL'
                  ? `14 Günlük Ücretsiz Deneme (Kalan: ${remainingDays} Gün)`
                  : `Aktif Paket: ${currentPlan}`}
              </span>
            </div>
            <span className="text-slate-300">
              Kredi kartı gerekmez. İstediğiniz zaman geçiş yapabilirsiniz.
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-bounce">
              <span>🎉</span>
              <span>{successMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Başlangıç */}
            <div
              className={`p-5 rounded-2xl border-2 flex flex-col justify-between transition-all ${
                currentPlan === 'STARTER'
                  ? 'border-emerald-500 bg-emerald-50/40 shadow-md'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-black text-slate-900 text-base">Başlangıç</h4>
                  {currentPlan === 'STARTER' && (
                    <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      Mevcut Plan
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mb-3">Tek şubeli küçük esnaflar için ideal.</p>
                <div className="text-2xl font-black text-slate-900 mb-4">
                  ₺499 <span className="text-xs font-medium text-slate-500">/ ay</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-2 mb-4">
                  <li className="flex items-center gap-1.5">✓ 1 Kasiyer / Kasa</li>
                  <li className="flex items-center gap-1.5">✓ Mobil Kamera ile Sayım</li>
                  <li className="flex items-center gap-1.5">✓ 1.500 Ürün Kapasitesi</li>
                  <li className="flex items-center gap-1.5">✓ Standart A4 Raf Etiketi</li>
                  <li className="flex items-center gap-1.5 text-slate-400 line-through">✗ Fiziki POS Entegrasyonu</li>
                </ul>
              </div>

              <button
                disabled={loadingPlan !== null || currentPlan === 'STARTER'}
                onClick={() => handleSelectPlan('STARTER')}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                  currentPlan === 'STARTER'
                    ? 'bg-slate-200 text-slate-500 cursor-default'
                    : 'bg-slate-900 hover:bg-slate-800 text-white shadow-md'
                }`}
              >
                {loadingPlan === 'STARTER' ? 'Güncelleniyor...' : currentPlan === 'STARTER' ? 'Kullanılıyor' : 'Bu Pakete Geç'}
              </button>
            </div>

            {/* 2. Büyüyen Esnaf (POPÜLER) */}
            <div
              className={`p-5 rounded-2xl border-2 flex flex-col justify-between relative transition-all shadow-lg ${
                currentPlan === 'GROWTH'
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-emerald-500/20'
                  : 'border-emerald-500 bg-white'
              }`}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 font-black text-[10px] px-3 py-0.5 rounded-full uppercase tracking-wider">
                ★ Popüler Tercih
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-black text-slate-900 text-base">Büyüyen Esnaf</h4>
                  {currentPlan === 'GROWTH' && (
                    <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      Mevcut Plan
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mb-3">POS cihazı kullanan yoğun işletmeler.</p>
                <div className="text-2xl font-black text-emerald-600 mb-4">
                  ₺999 <span className="text-xs font-medium text-slate-500">/ ay</span>
                </div>
                <ul className="text-xs text-slate-700 space-y-2 mb-4 font-medium">
                  <li className="flex items-center gap-1.5">✓ <strong>3 Kullanıcı & Kasa</strong></li>
                  <li className="flex items-center gap-1.5">✓ <strong>Fiziki POS Kablosuz Tutar Aktarımı</strong></li>
                  <li className="flex items-center gap-1.5">✓ <strong>Sınırsız</strong> Ürün & Varyant</li>
                  <li className="flex items-center gap-1.5">✓ A4 + 50x30mm <strong>Termal Raf Etiketi</strong></li>
                  <li className="flex items-center gap-1.5">✓ WhatsApp Otomatik Borç Bildirimi</li>
                  <li className="flex items-center gap-1.5">✓ Excel/CSV Akıllı İçe Aktarma</li>
                </ul>
              </div>

              <button
                disabled={loadingPlan !== null || currentPlan === 'GROWTH'}
                onClick={() => handleSelectPlan('GROWTH')}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-black transition-all ${
                  currentPlan === 'GROWTH'
                    ? 'bg-slate-200 text-slate-500 cursor-default'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-600/30'
                }`}
              >
                {loadingPlan === 'GROWTH' ? 'Güncelleniyor...' : currentPlan === 'GROWTH' ? 'Kullanılıyor' : 'Büyüyen Esnafa Geç'}
              </button>
            </div>

            {/* 3. Kurumsal */}
            <div
              className={`p-5 rounded-2xl border-2 flex flex-col justify-between transition-all ${
                currentPlan === 'ENTERPRISE'
                  ? 'border-emerald-500 bg-emerald-50/40 shadow-md'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-black text-slate-900 text-base">Kurumsal</h4>
                  {currentPlan === 'ENTERPRISE' && (
                    <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      Mevcut Plan
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mb-3">Çoklu şube ve zincir işletmeler.</p>
                <div className="text-2xl font-black text-slate-900 mb-4">
                  ₺1.999 <span className="text-xs font-medium text-slate-500">/ ay</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-2 mb-4">
                  <li className="flex items-center gap-1.5">✓ <strong>Sınırsız Şube & Kasa</strong></li>
                  <li className="flex items-center gap-1.5">✓ Şubeler Arası Anlık Transfer</li>
                  <li className="flex items-center gap-1.5">✓ Konsolide Ciro & Raporlama</li>
                  <li className="flex items-center gap-1.5">✓ Özel ERP/Muhasebe Entegrasyonu</li>
                  <li className="flex items-center gap-1.5">✓ 7/24 Öncelikli Müşteri Hattı</li>
                </ul>
              </div>

              <button
                disabled={loadingPlan !== null || currentPlan === 'ENTERPRISE'}
                onClick={() => handleSelectPlan('ENTERPRISE')}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                  currentPlan === 'ENTERPRISE'
                    ? 'bg-slate-200 text-slate-500 cursor-default'
                    : 'bg-slate-900 hover:bg-slate-800 text-white shadow-md'
                }`}
              >
                {loadingPlan === 'ENTERPRISE' ? 'Güncelleniyor...' : currentPlan === 'ENTERPRISE' ? 'Kullanılıyor' : 'Kurumsal Pakete Geç'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>Tüm paketlerde 14 günlük deneme süresi koşulsuz korunur.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
