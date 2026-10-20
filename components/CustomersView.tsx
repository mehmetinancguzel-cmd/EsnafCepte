'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  CheckCircle,
  Clock,
  DollarSign,
  AlertCircle,
  FileText,
  ShoppingCart,
  ChevronRight,
} from 'lucide-react';

export interface Customer {
  id: number;
  name: string;
  phone: string;
  note?: string;
  balance: number;
  created_at: string;
}

interface Transaction {
  id: number;
  customer_id: number;
  type: 'BORC' | 'TAHSILAT';
  amount: number;
  sale_code?: string;
  note?: string;
  created_at: string;
}

import { UserPlan } from '@/lib/db';
import { LockedFeature } from '@/lib/plans';

interface CustomersViewProps {
  storeId?: number;
  storeName?: string;
  onSelectForSale?: (customer: Customer) => void;
  onSelectCustomerForSale?: (customer: Customer) => void;
  userPlan?: UserPlan;
  onFeatureLocked?: (feature: LockedFeature) => void;
}

export default function CustomersView({
  storeId = 1,
  storeName = 'EsnafCepte',
  onSelectForSale,
  onSelectCustomerForSale,
  userPlan = 'TRIAL',
  onFeatureLocked,
}: CustomersViewProps) {
  const selectForSaleCallback = onSelectCustomerForSale || onSelectForSale;
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  
  // Modals
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', note: '' });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCustomers();
    setSelectedCustomer(null);
  }, [storeId]);

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`/api/customers?storeId=${storeId}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
        if (data.length > 0 && !selectedCustomer) {
          handleSelectCustomer(data[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectCustomer = async (c: Customer) => {
    setSelectedCustomer(c);
    setLoadingTx(true);
    try {
      const res = await fetch(`/api/customers/${c.id}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTx(false);
      // On mobile screens, scroll down to the detail area
      if (window.innerWidth < 1024) {
        setTimeout(() => {
          detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) {
      alert('İsim ve telefon zorunludur!');
      return;
    }

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newCustomer, store_id: storeId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Müşteri eklenemedi');
      }

      const created = await res.json();
      setAddCustomerOpen(false);
      setNewCustomer({ name: '', phone: '', note: '' });
      fetchCustomers();
      handleSelectCustomer(created);
      setToast('Yeni müşteri başarıyla eklendi!');
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      alert('Geçerli bir tutar girin!');
      return;
    }

    try {
      const res = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          note: paymentNote || 'Nakit Tahsilat',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Tahsilat işlenemedi');
      }

      const data = await res.json();
      setPaymentAmount('');
      setPaymentNote('');
      setSelectedCustomer(data.customer);
      handleSelectCustomer(data.customer);
      fetchCustomers();
      setToast('Tahsilat başarıyla kaydedildi ve bakiye düşürüldü!');
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openWhatsApp = (customer: Customer) => {
    const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.startsWith('90') ? cleanPhone : cleanPhone.startsWith('0') ? '9' + cleanPhone : '90' + cleanPhone;
    const text = encodeURIComponent(
      `Merhaba ${customer.name},\n\nGökkuşağı Tuhafiye & Kırtasiye'den güncel veresiye bakiye durumunuz: ${customer.balance.toFixed(2)} ₺'dir.\n\nİyi günler dileriz!`
    );
    window.open(`https://wa.me/${phoneWithCountry}?text=${text}`, '_blank');
  };

  const totalOutstandingDebt = customers.reduce((sum, c) => sum + c.balance, 0);

  const filtered = customers.filter(
    c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20">
          <CheckCircle className="w-5 h-5" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Banner & Stats */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
              Esnaf Veresiye Defteri
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mt-1 flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" /> Müşteri & Veresiye Hesapları
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Toplam {customers.length} kayıtlı müşteri • Toplam Açık Veresiye Alacağı:{' '}
            <strong className="text-red-600 font-mono text-sm">{totalOutstandingDebt.toFixed(2)} ₺</strong>
          </p>
        </div>

        <button
          onClick={() => {
            if (userPlan === 'STARTER' && customers.length >= 50) {
              onFeatureLocked?.('CUSTOMER_LIMIT');
              return;
            }
            setAddCustomerOpen(true);
          }}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs shadow-md shadow-purple-600/20 flex items-center gap-2 self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4" /> Yeni Müşteri Kaydı
        </button>
      </div>

      {/* Main Grid: Customer List (5 cols) + Customer Detail/Ledger (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Customer List */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Müşteri Listesi</span>
            <span className="text-[11px] text-slate-400">İncelemek için tıklayın</span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Müşteri adı veya telefon ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            />
          </div>

          <div className="overflow-y-auto max-h-[520px] divide-y divide-slate-100 space-y-1">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Kayıtlı müşteri bulunamadı. "Yeni Müşteri Kaydı" butonuna tıklayarak ekleyin.
              </div>
            ) : (
              filtered.map(c => {
                const isSelected = selectedCustomer?.id === c.id;
                const hasDebt = c.balance > 0;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCustomer(c)}
                    className={`p-3.5 rounded-2xl cursor-pointer transition-all flex items-center justify-between border ${
                      isSelected
                        ? 'bg-purple-50 border-purple-500 shadow-sm ring-1 ring-purple-400'
                        : 'bg-white border-slate-200/80 hover:border-purple-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-800">{c.name}</span>
                        {isSelected && (
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-purple-600 text-white">
                            Seçili
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {c.phone}
                      </div>
                      {c.note && <div className="text-[11px] text-slate-500 italic mt-0.5">{c.note}</div>}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div
                          className={`font-mono font-extrabold text-sm ${
                            hasDebt ? 'text-red-600' : 'text-emerald-600'
                          }`}
                        >
                          {c.balance.toFixed(2)} ₺
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">
                          {hasDebt ? 'Borcu Var' : 'Borcu Yok'}
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-purple-600' : 'text-slate-300'}`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Customer Account Ledger & Transactions */}
        <div ref={detailRef} className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          {selectedCustomer ? (
            <>
              {/* Customer Header Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-purple-300 tracking-wider bg-white/10 px-2 py-0.5 rounded">
                      Cari Kartı #{selectedCustomer.id}
                    </span>
                    <span className="text-xs text-emerald-300 font-semibold">Aktif Müşteri</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mt-1">{selectedCustomer.name}</h3>
                  <div className="text-xs text-purple-200 flex items-center gap-2 mt-1">
                    <Phone className="w-3.5 h-3.5 text-purple-300" /> {selectedCustomer.phone}
                    {selectedCustomer.note && <span>• {selectedCustomer.note}</span>}
                  </div>

                  {/* Bu Müşteriye Kasada Satış Yap Butonu */}
                  {selectForSaleCallback && (
                    <button
                      type="button"
                      onClick={() => selectForSaleCallback(selectedCustomer)}
                      className="mt-3 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-emerald-500/30 flex items-center gap-2 transition-all active:scale-95"
                    >
                      <ShoppingCart className="w-4 h-4 text-slate-950" />
                      Bu Müşteriye Kasada Satış Yap
                    </button>
                  )}
                </div>

                <div className="text-right bg-white/10 p-3.5 rounded-2xl backdrop-blur-sm self-start sm:self-auto border border-white/10">
                  <div className="text-[10px] uppercase tracking-wider text-purple-200 font-semibold">
                    Güncel Borç Bakiyesi
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-amber-300 mt-0.5">
                    {selectedCustomer.balance.toFixed(2)} ₺
                  </div>
                </div>
              </div>

              {/* Action Buttons: Tahsilat Al & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Tahsilat Form */}
                <form onSubmit={handleAddPayment} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                  <div className="font-bold text-slate-700 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" /> Borç Tahsilatı Al
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="Alınan Tutar (₺)..."
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(e.target.value)}
                      className="w-32 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Not (Örn: Nakit)..."
                      value={paymentNote}
                      onChange={e => setPaymentNote(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow-sm transition-colors"
                  >
                    Tahsilatı Kaydet & Borcu Düş
                  </button>
                </form>

                {/* WhatsApp Reminder */}
                <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/50 flex flex-col justify-between text-xs space-y-2">
                  <div>
                    <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <Send className="w-4 h-4 text-emerald-600" /> WhatsApp'tan Ekstre Gönder
                    </div>
                    <p className="text-[11px] text-emerald-700 mt-1">
                      Müşteriye tek tıkla güncel borç tutarını içeren nezaket mesajı gönderin.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openWhatsApp(selectedCustomer)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" /> WhatsApp ile Hatırlat
                  </button>
                </div>
              </div>

              {/* Transaction Ledger Table */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">
                  Hesap Hareketleri / Ekstre ({transactions.length})
                </h4>

                <div className="overflow-y-auto max-h-64 border border-slate-200 rounded-2xl divide-y divide-slate-100 text-xs">
                  {transactions.length === 0 ? (
                    <div className="py-8 text-center text-slate-400">Bu müşteriye ait henüz bir işlem yok.</div>
                  ) : (
                    transactions.map(t => {
                      const isBorc = t.type === 'BORC';
                      return (
                        <div key={t.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isBorc ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                                }`}
                              >
                                {isBorc ? 'VERESİYE SATIŞ' : 'TAHSİLAT'}
                              </span>
                              {t.sale_code && <span className="font-mono text-slate-500 font-bold">{t.sale_code}</span>}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {new Date(t.created_at).toLocaleString('tr-TR')}
                              {t.note && <span className="text-slate-600 ml-1 italic">({t.note})</span>}
                            </div>
                          </div>

                          <div
                            className={`font-mono font-bold text-sm ${
                              isBorc ? 'text-red-600' : 'text-emerald-600'
                            }`}
                          >
                            {isBorc ? `+${t.amount.toFixed(2)} ₺` : `-${t.amount.toFixed(2)} ₺`}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="py-28 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
              <Users className="w-12 h-12 stroke-[1.5] text-slate-300 mb-2" />
              <p className="font-medium text-sm">Müşteri Seçilmedi</p>
              <p className="text-slate-400 mt-1">Ekstresini görmek ve tahsilat almak için soldan bir müşteri seçin.</p>
            </div>
          )}
        </div>

      </div>

      {/* Add Customer Modal */}
      {addCustomerOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-800">Yeni Müşteri (Cari) Kaydı</h3>
              <button onClick={() => setAddCustomerOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Müşteri Adı Soyadı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Ayşe Hanım (Terzi)"
                  value={newCustomer.name}
                  onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Telefon Numarası</label>
                <input
                  type="tel"
                  required
                  placeholder="05XX XXX XX XX"
                  value={newCustomer.phone}
                  onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Not / Adres / Tanımlayıcı</label>
                <input
                  type="text"
                  placeholder="Örn: Yan sokaktaki terzi, ay başında öder"
                  value={newCustomer.note}
                  onChange={e => setNewCustomer({ ...newCustomer, note: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddCustomerOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 font-semibold rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-md"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
