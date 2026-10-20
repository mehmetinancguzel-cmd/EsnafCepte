'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  CreditCard,
  Banknote,
  ShoppingBag,
  FileText,
  DollarSign,
  AlertTriangle,
  Lock,
  Unlock,
  ShieldAlert,
  Calendar,
  Receipt,
  BookOpen,
  ArrowDownLeft,
  ArrowUpRight,
  PlusCircle,
  Eye,
  CheckCircle,
} from 'lucide-react';
import DailyZReportModal from './DailyZReportModal';
import ExpensesModal from './ExpensesModal';
import RolePinModal from './RolePinModal';
import { Expense } from '@/lib/db';

interface Sale {
  id: number;
  sale_code: string;
  total_amount: number;
  discount: number;
  payment_method: string;
  items: any[];
  created_at: string;
}

interface Product {
  id: number;
  stock_quantity: number;
  critical_level: number;
  sale_price: number;
  cost_price: number;
}

interface ReportsViewProps {
  storeId?: number;
  storeName?: string;
  activeRole?: 'PATRON' | 'KASIYER';
}

export default function ReportsView({
  storeId = 1,
  storeName = 'EsnafCepte',
  activeRole: propRole,
}: ReportsViewProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);

  // Security & Role check
  const [currentRole, setCurrentRole] = useState<'PATRON' | 'KASIYER'>('PATRON');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);

  // Sub-modals
  const [zReportModalOpen, setZReportModalOpen] = useState(false);
  const [expensesModalOpen, setExpensesModalOpen] = useState(false);

  // Active sub-tab in Reports: 'SALES' | 'EXPENSES'
  const [activeSubTab, setActiveSubTab] = useState<'SALES' | 'EXPENSES'>('SALES');

  useEffect(() => {
    try {
      const savedRole = localStorage.getItem('esnaf_active_role');
      if (propRole) {
        setCurrentRole(propRole);
      } else if (savedRole === 'KASIYER' || savedRole === 'PATRON') {
        setCurrentRole(savedRole);
      }
    } catch (e) {
      console.error(e);
    }
  }, [propRole]);

  useEffect(() => {
    fetchData();
  }, [storeId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, pRes, eRes] = await Promise.all([
        fetch(`/api/pos/sale?storeId=${storeId}`),
        fetch(`/api/products?storeId=${storeId}`),
        fetch(`/api/expenses?storeId=${storeId}`),
      ]);
      if (sRes.ok) setSales(await sRes.json());
      if (pRes.ok) setProducts(await pRes.json());
      if (eRes.ok) setExpenses(await eRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const totalRevenue = sales.reduce((sum, s) => sum + s.total_amount, 0);
  const cashSales = sales.filter(s => s.payment_method === 'NAKIT').reduce((sum, s) => sum + s.total_amount, 0);
  const cardSales = sales.filter(s => s.payment_method === 'KREDI_KARTI').reduce((sum, s) => sum + s.total_amount, 0);
  const veresiyeSales = sales.filter(s => s.payment_method === 'VERESIYE').reduce((sum, s) => sum + s.total_amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netEstimatedCash = Math.max(0, cashSales - totalExpenses);
  const totalStockWorth = products.reduce((sum, p) => sum + p.stock_quantity * p.sale_price, 0);
  const criticalCount = products.filter(p => p.stock_quantity <= p.critical_level).length;

  // If cashier is logged in and hasn't unlocked with Patron PIN
  const isLocked = currentRole === 'KASIYER' && !isUnlocked;

  if (isLocked) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-sm my-6 space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Ciro ve Kâr Raporları Korumalıdır</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Kasiyer modunda hassas finansal veriler, toplam ciro ve dükkan kâr marjları gizlenir.
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={() => setPinModalOpen(true)}
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-sm shadow-md transition-all inline-flex items-center gap-2"
          >
            <Unlock className="w-4 h-4 text-emerald-400" />
            Patron PIN ile Görüntüle
          </button>
        </div>

        <RolePinModal
          isOpen={pinModalOpen}
          onClose={() => setPinModalOpen(false)}
          onSuccess={() => {
            setIsUnlocked(true);
            setPinModalOpen(false);
          }}
          storeId={storeId}
          title="Raporları Açmak İçin Patron PIN"
          description="Lütfen 4 haneli güvenlik PIN kodunuzu girin."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions: Z Raporu & Gider Ekle */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-5 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {storeName}
            </span>
            <span className="text-xs text-slate-400">Finans & Kasa Analitiği</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black mt-1">Dükkan Raporları & Gün Sonu</h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setExpensesModalOpen(true)}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-2xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 backdrop-blur-sm"
          >
            <ArrowUpRight className="w-4 h-4 text-red-400" />
            💸 Gider / Masraf Ekle
          </button>

          <button
            onClick={() => setZReportModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black rounded-2xl text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            📊 Gün Sonu Z Raporu
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (6 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* 1. Toplam Ciro */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1.5">
            <span>Toplam Ciro</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-slate-800 font-mono">
            {totalRevenue.toFixed(2)} ₺
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 font-semibold">{sales.length} Fiş Kesildi</div>
        </div>

        {/* 2. Nakit Satış */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1.5">
            <span>Nakit Kasa</span>
            <Banknote className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-slate-800 font-mono">
            {cashSales.toFixed(2)} ₺
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Nakit Satışlar</div>
        </div>

        {/* 3. Kredi Kartı POS */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1.5">
            <span>Kredi Kartı</span>
            <CreditCard className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-black text-slate-800 font-mono">
            {cardSales.toFixed(2)} ₺
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Banka POS</div>
        </div>

        {/* 4. Veresiye Satış */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1.5">
            <span>Veresiye Satış</span>
            <BookOpen className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-slate-800 font-mono">
            {veresiyeSales.toFixed(2)} ₺
          </div>
          <div className="text-[11px] text-amber-600 mt-1 font-medium">Deftere Yazılan</div>
        </div>

        {/* 5. Dükkan Giderleri */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1.5">
            <span>Dükkan Giderleri</span>
            <ArrowUpRight className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-xl font-black text-red-600 font-mono">
            -{totalExpenses.toFixed(2)} ₺
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{expenses.length} Masraf Kalemi</div>
        </div>

        {/* 6. Net Kasa Nakit */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-sm">
          <div className="flex items-center justify-between text-emerald-700 text-[11px] font-bold uppercase tracking-wider mb-1.5">
            <span>Net Kasa Nakit</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-700 font-mono">
            {netEstimatedCash.toFixed(2)} ₺
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 font-medium">Nakit - Masraflar</div>
        </div>
      </div>

      {/* Sub Tabs: Fişler vs Masraflar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('SALES')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'SALES'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tamamlanan Satışlar ({sales.length})
            </button>
            <button
              onClick={() => setActiveSubTab('EXPENSES')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'EXPENSES'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Dükkan Masrafları ({expenses.length})
            </button>
          </div>

          <div className="text-xs text-slate-400">
            {activeSubTab === 'SALES'
              ? 'Tüm kasa fişleri ve kalemleri'
              : 'Yemek, fatura, toptancı ve kurye ödemeleri'}
          </div>
        </div>

        {/* SubTab 1: Sales History */}
        {activeSubTab === 'SALES' && (
          <div className="overflow-y-auto max-h-[500px] divide-y divide-slate-100">
            {sales.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">Henüz yapılmış bir satış bulunamadı.</div>
            ) : (
              sales.map(s => (
                <div key={s.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm font-mono">{s.sale_code}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.payment_method === 'NAKIT'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : s.payment_method === 'KREDI_KARTI'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {s.payment_method}
                      </span>
                    </div>

                    <div className="text-slate-400 mt-1">
                      {new Date(s.created_at).toLocaleString('tr-TR')} • {s.items.length} Kalem Ürün
                    </div>

                    <div className="mt-1 text-[11px] text-slate-600 flex flex-wrap gap-2">
                      {s.items.map((it: any, idx: number) => (
                        <span key={idx} className="bg-slate-100 px-2 py-0.5 rounded">
                          {it.name} (x{it.quantity})
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-right self-end sm:self-auto">
                    <div className="font-extrabold font-mono text-emerald-600 text-base">
                      {s.total_amount.toFixed(2)} ₺
                    </div>
                    {s.discount > 0 && (
                      <div className="text-[10px] text-red-500 font-mono">İndirim: -{s.discount.toFixed(2)} ₺</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* SubTab 2: Expenses History */}
        {activeSubTab === 'EXPENSES' && (
          <div className="overflow-y-auto max-h-[500px] divide-y divide-slate-100">
            {expenses.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                Kayıtlı dükkan masrafı yok. Yukarıdaki &quot;Gider / Masraf Ekle&quot; butonundan harcama girebilirsiniz.
              </div>
            ) : (
              expenses.map(exp => (
                <div key={exp.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{exp.title}</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      {new Date(exp.created_at).toLocaleString('tr-TR')}
                      {exp.note && <span className="text-slate-600 ml-2 italic">({exp.note})</span>}
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                      {exp.category}
                    </span>
                    <span className="font-mono font-bold text-red-600 text-sm">
                      -{exp.amount.toFixed(2)} ₺
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <DailyZReportModal
        isOpen={zReportModalOpen}
        onClose={() => setZReportModalOpen(false)}
        storeId={storeId}
        storeName={storeName}
      />

      <ExpensesModal
        isOpen={expensesModalOpen}
        onClose={() => setExpensesModalOpen(false)}
        storeId={storeId}
        onExpenseAdded={fetchData}
      />

      <RolePinModal
        isOpen={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        onSuccess={() => {
          setIsUnlocked(true);
          setPinModalOpen(false);
        }}
        storeId={storeId}
        title="Patron PIN Kodu"
      />
    </div>
  );
}
