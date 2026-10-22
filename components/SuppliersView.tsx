'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  FileText,
  DollarSign,
  Phone,
  Search,
  Building2,
  Calendar,
  CheckCircle,
  AlertCircle,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  PackagePlus,
  Receipt,
  X,
} from 'lucide-react';
import { Supplier, PurchaseInvoice } from '@/lib/db';

interface SuppliersViewProps {
  storeId?: number;
}

export default function SuppliersView({ storeId = 1 }: SuppliersViewProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'SUPPLIERS' | 'INVOICES'>('SUPPLIERS');

  // Modals
  const [newSupplierModalOpen, setNewSupplierModalOpen] = useState(false);
  const [newInvoiceModalOpen, setNewInvoiceModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedSupplierForPayment, setSelectedSupplierForPayment] = useState<Supplier | null>(null);

  // New Supplier Form
  const [sName, setSName] = useState('');
  const [sCompany, setSCompany] = useState('');
  const [sPhone, setSPhone] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sAddress, setSAddress] = useState('');
  const [sTaxId, setSTaxId] = useState('');
  const [sTaxOffice, setSTaxOffice] = useState('');
  const [sInitialBalance, setSInitialBalance] = useState('0');

  // Payment Form
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'NAKIT' | 'HAVALE_EFT' | 'KREDI_KARTI' | 'CEK'>('NAKIT');
  const [payNote, setPayNote] = useState('');

  // New Invoice Form
  const [invSupplierId, setInvSupplierId] = useState<number>(0);
  const [invNo, setInvNo] = useState('');
  const [invDate, setInvDate] = useState(new Date().toISOString().split('T')[0]);
  const [invDueDate, setInvDueDate] = useState('');
  const [invPaidAmount, setInvPaidAmount] = useState('0');
  const [invPayMethod, setInvPayMethod] = useState<'NAKIT' | 'HAVALE_EFT' | 'KREDI_KARTI' | 'CEK'>('NAKIT');
  const [invNote, setInvNote] = useState('');
  const [invItems, setInvItems] = useState<Array<{
    barcode: string;
    name: string;
    quantity: number;
    unit: string;
    unit_cost: number;
    total_cost: number;
  }>>([
    { barcode: '', name: '', quantity: 1, unit: 'Adet', unit_cost: 0, total_cost: 0 }
  ]);

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchData();
  }, [storeId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, iRes] = await Promise.all([
        fetch(`/api/suppliers?storeId=${storeId}`),
        fetch(`/api/purchases?storeId=${storeId}`)
      ]);
      if (sRes.ok) setSuppliers(await sRes.json());
      if (iRes.ok) setInvoices(await iRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sName.trim() || !sPhone.trim()) return;

    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          name: sName.trim(),
          company_name: sCompany.trim(),
          phone: sPhone.trim(),
          email: sEmail.trim(),
          address: sAddress.trim(),
          tax_id: sTaxId.trim(),
          tax_office: sTaxOffice.trim(),
          initial_balance: parseFloat(sInitialBalance) || 0,
        }),
      });

      if (res.ok) {
        setNewSupplierModalOpen(false);
        setSName('');
        setSCompany('');
        setSPhone('');
        setSEmail('');
        setSAddress('');
        setSTaxId('');
        setSTaxOffice('');
        setSInitialBalance('0');
        fetchData();
        setMessage({ text: 'Toptancı başarıyla kaydedildi.', type: 'success' });
        setTimeout(() => setMessage(null), 3500);
      }
    } catch {
      setMessage({ text: 'Toptancı eklenemedi.', type: 'error' });
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierForPayment || !payAmount) return;

    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PAYMENT',
          storeId,
          supplierId: selectedSupplierForPayment.id,
          amount: parseFloat(payAmount),
          paymentMethod: payMethod,
          note: payNote.trim(),
        }),
      });

      if (res.ok) {
        setPaymentModalOpen(false);
        setSelectedSupplierForPayment(null);
        setPayAmount('');
        setPayNote('');
        fetchData();
        setMessage({ text: 'Toptancı ödemesi kaydedildi.', type: 'success' });
        setTimeout(() => setMessage(null), 3500);
      }
    } catch {
      setMessage({ text: 'Ödeme kaydedilemedi.', type: 'error' });
    }
  };

  const handleAddInvoiceItem = () => {
    setInvItems([...invItems, { barcode: '', name: '', quantity: 1, unit: 'Adet', unit_cost: 0, total_cost: 0 }]);
  };

  const handleRemoveInvoiceItem = (index: number) => {
    if (invItems.length === 1) return;
    setInvItems(invItems.filter((_, idx) => idx !== index));
  };

  const handleInvoiceItemChange = (index: number, field: string, val: any) => {
    const updated = [...invItems];
    (updated[index] as any)[field] = val;
    if (field === 'quantity' || field === 'unit_cost') {
      updated[index].total_cost = Number(updated[index].quantity || 0) * Number(updated[index].unit_cost || 0);
    }
    setInvItems(updated);
  };

  const invoiceTotal = invItems.reduce((sum, item) => sum + item.total_cost, 0);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invSupplierId || !invNo.trim() || invItems.some(i => !i.name.trim() || i.quantity <= 0)) {
      alert('Lütfen toptancıyı, fatura numarasını ve ürün detaylarını doldurun.');
      return;
    }

    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          supplierId: invSupplierId,
          invoiceNo: invNo.trim(),
          invoiceDate: invDate,
          dueDate: invDueDate || undefined,
          items: invItems,
          paidAmount: parseFloat(invPaidAmount) || 0,
          paymentMethod: invPayMethod,
          note: invNote.trim(),
        }),
      });

      if (res.ok) {
        setNewInvoiceModalOpen(false);
        setInvNo('');
        setInvPaidAmount('0');
        setInvNote('');
        setInvItems([{ barcode: '', name: '', quantity: 1, unit: 'Adet', unit_cost: 0, total_cost: 0 }]);
        fetchData();
        setMessage({ text: 'Alış faturası işlendi, ürün stokları ve toptancı bakiyesi güncellendi!', type: 'success' });
        setTimeout(() => setMessage(null), 4000);
      }
    } catch {
      setMessage({ text: 'Alış faturası işlenirken hata oluştu.', type: 'error' });
    }
  };

  const totalSupplierDebt = suppliers.reduce((sum, s) => sum + (s.balance || 0), 0);
  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.company_name && s.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    s.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Toast */}
      {message && (
        <div className={`p-4 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg animate-fade-in ${
          message.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Cari & Satın Alma
            </span>
            <span className="text-xs text-slate-400">Toptancı ve Mal Kabul Yönetimi</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black mt-1">Toptancılar & Alış Faturaları</h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              if (suppliers.length === 0) {
                alert('Önce en az bir toptancı eklemelisiniz.');
                return;
              }
              setInvSupplierId(suppliers[0].id);
              setNewInvoiceModalOpen(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black rounded-2xl text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
          >
            <PackagePlus className="w-4 h-4" />
            📦 Alış Faturası Girişi (Mal Kabul)
          </button>

          <button
            onClick={() => setNewSupplierModalOpen(true)}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-2xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 backdrop-blur-sm"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            Yeni Toptancı Ekle
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Toptancılara Toplam Borç</span>
            <ArrowUpRight className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-600 font-mono">
            {totalSupplierDebt.toFixed(2)} ₺
          </div>
          <div className="text-xs text-slate-400 mt-1">{suppliers.length} Kayıtlı Toptancı</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>İşlenen Alış Faturaları</span>
            <Receipt className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-800 font-mono">
            {invoices.length} Fatura
          </div>
          <div className="text-xs text-emerald-600 mt-1 font-semibold">Stoklara Otomatik İşlendi</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Son 30 Gün Satın Alma</span>
            <Truck className="w-5 h-5 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-800 font-mono">
            {invoices.reduce((sum, inv) => sum + inv.total_amount, 0).toFixed(2)} ₺
          </div>
          <div className="text-xs text-slate-400 mt-1">Mal Kabul Hacmi</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('SUPPLIERS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'SUPPLIERS'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Toptancı Listesi ({suppliers.length})
            </button>
            <button
              onClick={() => setActiveTab('INVOICES')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'INVOICES'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Alış Faturaları ({invoices.length})
            </button>
          </div>

          {activeTab === 'SUPPLIERS' && (
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Toptancı adı veya telefon ara..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Tab 1: Suppliers List */}
        {activeTab === 'SUPPLIERS' && (
          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[500px]">
            {filteredSuppliers.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                Kayıtlı toptancı bulunamadı. Yukarıdaki &quot;Yeni Toptancı Ekle&quot; butonundan ekleyebilirsiniz.
              </div>
            ) : (
              filteredSuppliers.map(s => (
                <div key={s.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-800 text-sm">{s.name}</span>
                      {s.company_name && (
                        <span className="text-[11px] text-slate-400 font-normal">({s.company_name})</span>
                      )}
                    </div>
                    <div className="text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {s.phone}
                      </span>
                      {s.tax_id && (
                        <span>VKN: <strong className="text-slate-600">{s.tax_id}</strong> ({s.tax_office || 'Vergi Dairesi'})</span>
                      )}
                      {s.address && <span className="italic">{s.address}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400">Borcumuz</div>
                      <div className={`font-mono font-black text-sm ${s.balance > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                        {s.balance.toFixed(2)} ₺
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedSupplierForPayment(s);
                        setPayAmount(s.balance > 0 ? s.balance.toString() : '');
                        setPaymentModalOpen(true);
                      }}
                      className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition-all flex items-center gap-1 border border-indigo-200"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      Ödeme Yap
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Purchase Invoices List */}
        {activeTab === 'INVOICES' && (
          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[500px]">
            {invoices.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                Kayıtlı alış faturası yok.
              </div>
            ) : (
              invoices.map(inv => (
                <div key={inv.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-800 text-sm font-mono">{inv.invoice_no}</span>
                      <span className="text-slate-600 font-semibold">• {inv.supplier_name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inv.payment_status === 'ODENDI'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : inv.payment_status === 'KISMI'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {inv.payment_status === 'ODENDI' ? 'ÖDENDİ' : inv.payment_status === 'KISMI' ? 'KISMİ ÖDENDİ' : 'AÇIK HESAP'}
                      </span>
                    </div>

                    <div className="text-slate-400 mt-1 flex items-center gap-3">
                      <span>Tarih: {inv.invoice_date}</span>
                      <span>{inv.items.length} Kalem Ürün</span>
                      {inv.note && <span className="italic">({inv.note})</span>}
                    </div>

                    <div className="mt-2 text-[11px] text-slate-600 flex flex-wrap gap-1.5">
                      {inv.items.map((it, idx) => (
                        <span key={idx} className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {it.name} (+{it.quantity} {it.unit} @ {it.unit_cost.toFixed(2)} ₺)
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-right self-end sm:self-auto">
                    <div className="font-mono font-black text-slate-900 text-base">
                      {inv.total_amount.toFixed(2)} ₺
                    </div>
                    {inv.paid_amount > 0 && (
                      <div className="text-[11px] text-emerald-600 font-mono">
                        Ödenen: {inv.paid_amount.toFixed(2)} ₺
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal: Yeni Toptancı Ekle */}
      {newSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-base text-slate-800">Yeni Toptancı Kaydı</h3>
              </div>
              <button onClick={() => setNewSupplierModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSupplier} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Toptancı / Yetkili Adı *</label>
                <input
                  required
                  type="text"
                  placeholder="Örn: Mega Toptan Gıda"
                  value={sName}
                  onChange={e => setSName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Firma Ticari Unvanı</label>
                <input
                  type="text"
                  placeholder="Örn: Mega Dağıtım Pazarlama Ltd. Şti."
                  value={sCompany}
                  onChange={e => setSCompany(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Telefon *</label>
                  <input
                    required
                    type="text"
                    placeholder="0532..."
                    value={sPhone}
                    onChange={e => setSPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">E-Posta</label>
                  <input
                    type="email"
                    placeholder="siparis@..."
                    value={sEmail}
                    onChange={e => setSEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vergi No (VKN / TCKN)</label>
                  <input
                    type="text"
                    placeholder="10 veya 11 haneli"
                    value={sTaxId}
                    onChange={e => setSTaxId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vergi Dairesi</label>
                  <input
                    type="text"
                    placeholder="Vergi Dairesi adı"
                    value={sTaxOffice}
                    onChange={e => setSTaxOffice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Adres</label>
                <input
                  type="text"
                  placeholder="Adres bilgisi"
                  value={sAddress}
                  onChange={e => setSAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mevcut Açık Borç Bakiyesi (TL)</label>
                <input
                  type="number"
                  step="0.01"
                  value={sInitialBalance}
                  onChange={e => setSInitialBalance(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewSupplierModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-xs"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/30"
                >
                  Toptancıyı Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Toptancıya Ödeme Yap */}
      {paymentModalOpen && selectedSupplierForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base text-slate-800">Toptancı Borç Ödemesi</h3>
              </div>
              <button onClick={() => setPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
              <div className="font-bold text-slate-800">{selectedSupplierForPayment.name}</div>
              <div className="text-slate-500 mt-0.5">Mevcut Borç: <strong className="text-red-600 font-mono">{selectedSupplierForPayment.balance.toFixed(2)} ₺</strong></div>
            </div>

            <form onSubmit={handlePayment} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Ödeme Tutarı (TL) *</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-base font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ödeme Yöntemi</label>
                <select
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="NAKIT">Nakit (Kasa Harcaması Olarak Düşer)</option>
                  <option value="HAVALE_EFT">Banka Havale / EFT</option>
                  <option value="KREDI_KARTI">Kredi Kartı</option>
                  <option value="CEK">Çek / Senet</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Açıklama</label>
                <input
                  type="text"
                  placeholder="Örn: 4812 nolu fatura kapatma"
                  value={payNote}
                  onChange={e => setPayNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-xs"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/30"
                >
                  Ödemeyi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Alış Faturası Girişi (Mal Kabul) */}
      {newInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base text-slate-800">Alış Faturası Girişi & Mal Kabul</h3>
              </div>
              <button onClick={() => setNewInvoiceModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Toptancı Firma *</label>
                  <select
                    value={invSupplierId}
                    onChange={e => setInvSupplierId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fatura Numarası *</label>
                  <input
                    required
                    type="text"
                    placeholder="Örn: GIB202600004812"
                    value={invNo}
                    onChange={e => setInvNo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fatura Tarihi</label>
                  <input
                    type="date"
                    value={invDate}
                    onChange={e => setInvDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Faturadaki Ürün Kalemleri</span>
                  <button
                    type="button"
                    onClick={handleAddInvoiceItem}
                    className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-[11px] flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Kalem Ekle
                  </button>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                  <div className="bg-slate-50 px-3 py-2 grid grid-cols-12 gap-2 font-bold text-[11px] text-slate-500">
                    <span className="col-span-3">Barkod</span>
                    <span className="col-span-4">Ürün Adı</span>
                    <span className="col-span-2">Miktar / Birim</span>
                    <span className="col-span-2">Birim Alış (TL)</span>
                    <span className="col-span-1 text-right">Sil</span>
                  </div>

                  {invItems.map((item, idx) => (
                    <div key={idx} className="p-2 grid grid-cols-12 gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Barkod"
                        value={item.barcode}
                        onChange={e => handleInvoiceItemChange(idx, 'barcode', e.target.value)}
                        className="col-span-3 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
                      />
                      <input
                        required
                        type="text"
                        placeholder="Ürün adı"
                        value={item.name}
                        onChange={e => handleInvoiceItemChange(idx, 'name', e.target.value)}
                        className="col-span-4 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                      <div className="col-span-2 flex items-center gap-1">
                        <input
                          required
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={item.quantity}
                          onChange={e => handleInvoiceItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
                        />
                        <span className="text-[10px] text-slate-400">{item.unit}</span>
                      </div>
                      <input
                        required
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_cost}
                        onChange={e => handleInvoiceItemChange(idx, 'unit_cost', parseFloat(e.target.value) || 0)}
                        className="col-span-2 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
                      />
                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveInvoiceItem(idx)}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invoice Bottom Totals & Payment */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-700">Fatura Genel Toplamı:</span>
                  <span className="font-black font-mono text-base text-slate-900">{invoiceTotal.toFixed(2)} ₺</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Peşin Ödenen Tutar (TL)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={invPaidAmount}
                      onChange={e => setInvPaidAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Ödeme Yolu</label>
                    <select
                      value={invPayMethod}
                      onChange={e => setInvPayMethod(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                    >
                      <option value="NAKIT">Kasa Nakit</option>
                      <option value="HAVALE_EFT">Banka Havale</option>
                      <option value="KREDI_KARTI">Kredi Kartı</option>
                      <option value="CEK">Açık Hesap (Sonra Ödenecek)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewInvoiceModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-xs"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  Faturayı Kaydet ve Stokları Artır
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
