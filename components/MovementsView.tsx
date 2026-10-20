'use client';

import React, { useState, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, RotateCcw, Plus, CheckCircle } from 'lucide-react';

interface Movement {
  id: number;
  product_id: number;
  product_name: string;
  barcode: string;
  type: 'GIRIS' | 'CIKIS' | 'SATIS' | 'SAYIM_DUZELTME' | 'IADE';
  quantity: number;
  note?: string;
  created_at: string;
}

interface Product {
  id: number;
  barcode: string;
  name: string;
  variant?: string;
  stock_quantity: number;
}

interface MovementsViewProps {
  storeId?: number;
}

export default function MovementsView({ storeId = 1 }: MovementsViewProps) {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [movementType, setMovementType] = useState<'GIRIS' | 'CIKIS' | 'IADE'>('GIRIS');
  const [quantity, setQuantity] = useState<number>(1);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    setSelectedProductId('');
  }, [storeId]);

  const fetchData = async () => {
    try {
      const [mRes, pRes] = await Promise.all([
        fetch(`/api/movements?storeId=${storeId}`),
        fetch(`/api/products?storeId=${storeId}`)
      ]);
      if (mRes.ok) setMovements(await mRes.json());
      if (pRes.ok) setProducts(await pRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || quantity <= 0) {
      alert('Lütfen ürün ve geçerli miktar seçin');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: storeId,
          product_id: selectedProductId,
          type: movementType,
          quantity,
          note,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'İşlem başarısız');
      }

      setQuantity(1);
      setNote('');
      fetchData();
      setToast('Stok hareketi başarıyla işlendi!');
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Toast */}
      {toast && (
        <div className="lg:col-span-12 p-3.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20">
          <CheckCircle className="w-5 h-5" />
          <span>{toast}</span>
        </div>
      )}

      {/* Form: Yeni Hareket (Giriş/Çıkış) (4 cols) */}
      <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-800">Stok Giriş - Çıkış İşlemi</h2>
          <p className="text-xs text-slate-400 mt-0.5">Toptancıdan mal kabulü, fire veya iadeleri kaydedin.</p>
        </div>

        <form onSubmit={handleAddMovement} className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-slate-600 block mb-1">İşlem Türü</label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setMovementType('GIRIS')}
                className={`py-2 rounded-xl font-bold flex flex-col items-center gap-1 border transition-all ${
                  movementType === 'GIRIS'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                <span>Mal Kabul (+)</span>
              </button>

              <button
                type="button"
                onClick={() => setMovementType('CIKIS')}
                className={`py-2 rounded-xl font-bold flex flex-col items-center gap-1 border transition-all ${
                  movementType === 'CIKIS'
                    ? 'bg-red-50 border-red-500 text-red-700 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-red-600" />
                <span>Fire / Zayi (-)</span>
              </button>

              <button
                type="button"
                onClick={() => setMovementType('IADE')}
                className={`py-2 rounded-xl font-bold flex flex-col items-center gap-1 border transition-all ${
                  movementType === 'IADE'
                    ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <RotateCcw className="w-4 h-4 text-purple-600" />
                <span>Müşteri İade (+)</span>
              </button>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">Ürün Seçin</label>
            <select
              required
              value={selectedProductId}
              onChange={e => setSelectedProductId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
            >
              <option value="">-- Listeden Ürün Seçin --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.variant ? `(${p.variant})` : ''} - Mevcut Stok: {p.stock_quantity}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">Miktar (Adet)</label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={e => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">Açıklama / Fatura No / Not</label>
            <input
              type="text"
              placeholder="Örn: Tahtakale Toptancı Fatura #4812"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Hareketi Stoğa Kaydet
          </button>
        </form>
      </div>

      {/* Table: Hareket Geçmişi (8 cols) */}
      <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-800">Stok Hareket Geçmişi ({movements.length})</h2>
          <p className="text-xs text-slate-400 mt-0.5">Satışlar, mal kabulleri ve sayım düzeltmelerinin tam dökümü.</p>
        </div>

        <div className="overflow-y-auto max-h-[500px] divide-y divide-slate-100">
          {movements.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">Henüz bir stok hareketi kaydedilmemiş.</div>
          ) : (
            movements.map(m => {
              const isPositive = m.quantity > 0;
              return (
                <div key={m.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{m.product_name}</div>
                    <div className="text-slate-400 font-mono mt-0.5">
                      {m.barcode} • {new Date(m.created_at).toLocaleString('tr-TR')}
                      {m.note && <span className="text-slate-600 ml-2 italic">({m.note})</span>}
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        m.type === 'GIRIS'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : m.type === 'SATIS'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : m.type === 'IADE'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : m.type === 'SAYIM_DUZELTME'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {m.type === 'GIRIS' ? 'GİRİŞ' : m.type === 'SATIS' ? 'SATIŞ' : m.type === 'IADE' ? 'İADE' : m.type === 'CIKIS' ? 'FİRE / ÇIKIŞ' : m.type}
                    </span>

                    <span
                      className={`font-mono font-bold text-sm min-w-[60px] text-right ${
                        isPositive ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {isPositive ? `+${m.quantity}` : m.quantity}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
