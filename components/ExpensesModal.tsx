'use client';

import React, { useState, useEffect } from 'react';
import { Expense } from '@/lib/db';
import { DollarSign, Plus, Trash2, Calendar, Tag } from 'lucide-react';

interface ExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: number;
  onExpenseAdded?: () => void;
}

export default function ExpensesModal({ isOpen, onClose, storeId, onExpenseAdded }: ExpensesModalProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Expense['category']>('DIGER');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadExpenses();
    }
  }, [isOpen, storeId]);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/expenses?storeId=${storeId}`);
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    setSaving(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          title: title.trim(),
          amount: parseFloat(amount),
          category,
          note: note.trim(),
        }),
      });

      if (res.ok) {
        setTitle('');
        setAmount('');
        setNote('');
        loadExpenses();
        onExpenseAdded?.();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (!confirm('Bu gider kaydını silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/expenses?id=${id}&storeId=${storeId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        loadExpenses();
        onExpenseAdded?.();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryNames: Record<Expense['category'], string> = {
    TOPTANCI: 'Toptancı Ödemesi',
    PERSONEL: 'Personel / Maaş / Avans',
    YEMEK: 'Yemek / Çay / Mutfak',
    FATURA: 'Fatura (Elektrik/Su/İnt)',
    KIRA: 'Dükkan Kirası',
    DIGER: 'Diğer Genel Gider',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-700 to-red-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl">
              💸
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Kasa Gider & Masraf Yönetimi</h3>
              <p className="text-rose-100 text-xs">Kasadan yapılan harcamalar, toptancı ve personel ödemeleri</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* New Expense Form */}
          <form onSubmit={handleAddExpense} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Yeni Gider / Masraf Ekle</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Gider Başlığı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Ekmek fırını toptan ödeme, Çırak haftalığı..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Tutar (TL) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 text-rose-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Kategori</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="TOPTANCI">📦 Toptancı / Mal Alımı</option>
                  <option value="PERSONEL">👤 Personel / Maaş / Avans</option>
                  <option value="YEMEK">🍲 Yemek / Mutfak Masrafı</option>
                  <option value="FATURA">⚡ Fatura (Elektrik/Su/İnternet)</option>
                  <option value="KIRA">🏬 Dükkan Kirası</option>
                  <option value="DIGER">🏷️ Diğer Çeşitli Gider</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Açıklama (İsteğe bağlı)</label>
                <input
                  type="text"
                  placeholder="Fiş no, makbuz vb..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="pt-1 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs shadow-md shadow-rose-600/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {saving ? 'Kaydediliyor...' : 'Kasadan Masrafı Düş'}
              </button>
            </div>
          </form>

          {/* Expenses List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Kayıtlı Masraflar ({expenses.length})
              </h4>
              <span className="text-xs font-bold text-rose-600 font-mono">
                Toplam Gider: ₺{totalExpense.toFixed(2)}
              </span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Yükleniyor...</div>
            ) : expenses.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                Henüz kayıtlı bir masraf bulunmuyor.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto border border-slate-100 rounded-2xl">
                {expenses.map(e => (
                  <div key={e.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800">{e.title}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
                          {categoryNames[e.category] || e.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{new Date(e.created_at).toLocaleDateString('tr-TR')} {new Date(e.created_at).toLocaleTimeString('tr-TR').slice(0, 5)}</span>
                        {e.note && <span>• {e.note}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-sm text-rose-600">
                        -₺{e.amount.toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleDeleteExpense(e.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>Masraflar gün sonu Z raporunda net kasanızdan otomatik düşülür.</span>
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
