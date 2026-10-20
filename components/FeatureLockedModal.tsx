'use client';

import React, { useState } from 'react';
import { LockedFeature, LOCKED_FEATURE_DETAILS } from '@/lib/plans';
import { User } from '@/lib/db';

interface FeatureLockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: LockedFeature | null;
  currentUser: User | null;
  onPlanUpgraded: (updatedUser: User) => void;
}

export default function FeatureLockedModal({
  isOpen,
  onClose,
  feature,
  currentUser,
  onPlanUpgraded,
}: FeatureLockedModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !feature) return null;

  const details = LOCKED_FEATURE_DETAILS[feature];
  if (!details) return null;

  const handleUpgrade = async () => {
    if (!currentUser) {
      alert('Lütfen önce dükkanınıza giriş yapınız veya kaydolunuz.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          plan: details.requiredPlan,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        onPlanUpgraded(data.user);
        onClose();
      } else {
        alert(data.error || 'Paket yükseltilemedi.');
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Bağlantı hatası.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            ✕
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🔒</span>
            <span className="text-xs font-black uppercase tracking-wider bg-white/20 text-white px-2.5 py-0.5 rounded-full">
              Üst Paket Özelliği
            </span>
          </div>

          <h3 className="text-xl font-black">{details.title}</h3>
          <p className="text-xs text-amber-100 mt-1">
            Bu özellik mevcut paketinizde (Başlangıç) kilitlidir.
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-3.5">
            <span className="text-3xl p-2 bg-white rounded-xl shadow-sm flex-shrink-0">
              {details.icon}
            </span>
            <div className="text-xs text-slate-600 leading-relaxed">
              <strong className="text-slate-900 block mb-1 font-bold">Neden Bu Özelliğe İhtiyacınız Var?</strong>
              {details.description}
            </div>
          </div>

          {/* Target Plan Highlight Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-500 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Gerekli Paket
              </span>
              <h4 className="font-black text-slate-900 text-sm mt-1">{details.planName}</h4>
              <p className="text-[11px] text-slate-500">İstediğiniz zaman iptal edebilirsiniz.</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-black text-emerald-700">{details.price}</div>
              <span className="text-[10px] text-slate-400 font-medium">+ KDV</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              Şimdilik Kalsın
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleUpgrade}
              className="flex-2 py-3 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? 'Yükseltiliyor...' : `🚀 ${details.planName}'e Geç`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
