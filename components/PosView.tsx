'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Barcode,
  Search,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  Receipt,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ShoppingBag,
  Users,
  Send,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  FileText,
  ShieldCheck,
  Lock,
  Scale,
  Clock,
} from 'lucide-react';
import { playBeep } from '@/lib/beep';
import ExpensesModal from '@/components/ExpensesModal';
import DailyZReportModal from '@/components/DailyZReportModal';
import ReturnModal from '@/components/ReturnModal';
import RolePinModal from '@/components/RolePinModal';
import ShiftHandoverModal from '@/components/ShiftHandoverModal';
import EArchiveInvoiceModal from '@/components/EArchiveInvoiceModal';
import ScaleModal from '@/components/ScaleModal';
import CriticalStockListModal from '@/components/CriticalStockListModal';
import SupplierOrderModal from '@/components/SupplierOrderModal';
import { parseScaleBarcode } from '@/lib/scale';

export interface Customer {
  id: number;
  name: string;
  phone: string;
  note?: string;
  balance: number;
}

interface Product {
  id: number;
  barcode: string;
  name: string;
  category: string;
  variant?: string;
  sale_price: number;
  stock_quantity: number;
  critical_level: number;
  unit: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

import { UserPlan } from '@/lib/db';
import { LockedFeature } from '@/lib/plans';

interface PosViewProps {
  storeId?: number;
  storeName?: string;
  initialCustomer?: Customer | null;
  onClearCustomer?: () => void;
  userPlan?: UserPlan;
  onFeatureLocked?: (feature: LockedFeature) => void;
}

export default function PosView({
  storeId = 1,
  storeName = 'EsnafCepte Kasa',
  initialCustomer,
  onClearCustomer,
  userPlan = 'TRIAL',
  onFeatureLocked,
}: PosViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(initialCustomer || null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [discount, setDiscount] = useState<number>(0);
  const [cashGiven, setCashGiven] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastReceipt, setLastReceipt] = useState<any | null>(null);
  const [veresiyeModalOpen, setVeresiyeModalOpen] = useState(false);
  const [expensesModalOpen, setExpensesModalOpen] = useState(false);
  const [zReportModalOpen, setZReportModalOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');

  // Held Carts (Sepeti Askıya Alma)
  interface HeldCartItem {
    id: string;
    timestamp: string;
    cart: CartItem[];
    customer: Customer | null;
    discount: number;
    totalAmount: number;
  }
  const [heldCarts, setHeldCarts] = useState<HeldCartItem[]>([]);
  const [heldModalOpen, setHeldModalOpen] = useState(false);

  // Return / Refund Modal
  const [returnModalOpen, setReturnModalOpen] = useState(false);

  // Shift Handover Modal
  const [shiftModalOpen, setShiftModalOpen] = useState(false);

  // E-Archive Invoice Modal
  const [eInvoiceModalOpen, setEInvoiceModalOpen] = useState(false);

  // Scale Modal (Terazi Tartım Ekranı)
  const [scaleModalOpen, setScaleModalOpen] = useState(false);
  const [scaleModalProduct, setScaleModalProduct] = useState<Product | null>(null);

  // Critical Stock & Supplier Order Modals
  const [criticalStockModalOpen, setCriticalStockModalOpen] = useState(false);
  const [supplierOrderModalOpen, setSupplierOrderModalOpen] = useState(false);

  // Role: Patron vs Kasiyer
  const [activeRole, setActiveRole] = useState<'PATRON' | 'KASIYER'>('PATRON');
  const [rolePinModalOpen, setRolePinModalOpen] = useState(false);
  const [pinTargetAction, setPinTargetAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    try {
      const savedRole = localStorage.getItem('esnaf_active_role');
      if (savedRole === 'KASIYER' || savedRole === 'PATRON') {
        setActiveRole(savedRole);
      }
      const savedHeld = localStorage.getItem(`heldCarts_${storeId}`);
      if (savedHeld) {
        setHeldCarts(JSON.parse(savedHeld));
      }
    } catch (e) {
      console.error(e);
    }
  }, [storeId]);

  const handleHoldCart = () => {
    if (cart.length === 0) return;
    const currentSubtotal = cart.reduce((sum, item) => sum + item.product.sale_price * item.quantity, 0);
    const newHold: HeldCartItem = {
      id: `HOLD-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      cart: [...cart],
      customer: activeCustomer,
      discount,
      totalAmount: Math.max(0, currentSubtotal - discount),
    };
    const updated = [newHold, ...heldCarts];
    setHeldCarts(updated);
    try {
      localStorage.setItem(`heldCarts_${storeId}`, JSON.stringify(updated));
    } catch {}
    clearCart();
    setActiveCustomer(null);
    setMessage({ text: '⏸️ Fiş askıya alındı. Sıradaki müşterinin satışına geçebilirsiniz.', type: 'success' });
    setTimeout(() => setMessage(null), 3500);
    playBeep('success');
  };

  const handleRecallCart = (holdId: string) => {
    const target = heldCarts.find(h => h.id === holdId);
    if (!target) return;
    if (cart.length > 0) {
      if (!confirm('Kasada mevcut ürünler var. Mevcut sepet silinip askıdaki fiş yüklensin mi?')) {
        return;
      }
    }
    setCart(target.cart);
    setActiveCustomer(target.customer);
    setDiscount(target.discount);
    const updated = heldCarts.filter(h => h.id !== holdId);
    setHeldCarts(updated);
    try {
      localStorage.setItem(`heldCarts_${storeId}`, JSON.stringify(updated));
    } catch {}
    setHeldModalOpen(false);
    setMessage({ text: '🛒 Askıdaki fiş kasaya geri yüklendi!', type: 'success' });
    setTimeout(() => setMessage(null), 3000);
    playBeep('success');
  };

  const handleDeleteHeldCart = (holdId: string) => {
    const updated = heldCarts.filter(h => h.id !== holdId);
    setHeldCarts(updated);
    try {
      localStorage.setItem(`heldCarts_${storeId}`, JSON.stringify(updated));
    } catch {}
  };

  const requirePatronRole = (action: () => void) => {
    if (activeRole === 'PATRON') {
      action();
    } else {
      setPinTargetAction(() => action);
      setRolePinModalOpen(true);
    }
  };

  const handleSwitchRole = (newRole: 'PATRON' | 'KASIYER') => {
    if (newRole === 'KASIYER') {
      setActiveRole('KASIYER');
      localStorage.setItem('esnaf_active_role', 'KASIYER');
      setMessage({ text: '👤 Kasiyer Modu aktif edildi. Maliyet ve kâr bilgileri gizlendi.', type: 'success' });
      setTimeout(() => setMessage(null), 3500);
    } else {
      setPinTargetAction(() => {
        setActiveRole('PATRON');
        localStorage.setItem('esnaf_active_role', 'PATRON');
        setMessage({ text: '🛡️ Patron Yetkisi onaylandı.', type: 'success' });
        setTimeout(() => setMessage(null), 3000);
      });
      setRolePinModalOpen(true);
    }
  };

  const handleSendWhatsappReceipt = (receiptToSend = lastReceipt) => {
    if (!receiptToSend) return;
    const itemsList = receiptToSend.items
      .map((it: any) => `• ${it.quantity}x ${it.name}: ₺${it.total_price.toFixed(2)}`)
      .join('\n');

    const paymentText =
      receiptToSend.payment_method === 'NAKIT'
        ? '💵 Nakit'
        : receiptToSend.payment_method === 'KREDI_KARTI'
        ? '💳 Kredi Kartı'
        : '📒 Veresiye';

    const text =
`🧾 *[DİJİTAL SATIŞ FİŞİ]*
🏪 *${storeName}*
📅 ${new Date(receiptToSend.created_at).toLocaleDateString('tr-TR')} ${new Date(receiptToSend.created_at).toLocaleTimeString('tr-TR').slice(0, 5)}
🔖 *Fiş No:* #${receiptToSend.sale_code}
━━━━━━━━━━━━━━━━━━
${itemsList}
━━━━━━━━━━━━━━━━━━
💰 *TOPLAM TUTAR:* ₺${receiptToSend.total_amount.toFixed(2)}
💳 *Ödeme Türü:* ${paymentText}

Bizi tercih ettiğiniz için teşekkür ederiz!
_EsnafCepte • Dijital Çevre Dostu E-Fiş_`;

    const phone = activeCustomer?.phone?.replace(/[^0-9]/g, '') || '';
    const url = phone
      ? `https://api.whatsapp.com/send?phone=${phone.startsWith('90') ? phone : '90' + phone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

    window.open(url, '_blank');
  };

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialCustomer) {
      setActiveCustomer(initialCustomer);
    }
  }, [initialCustomer]);

  useEffect(() => {
    loadProducts();
    setCart([]);
  }, [storeId]);

  useEffect(() => {
    loadProducts();
    // Focus barcode input by default
    barcodeInputRef.current?.focus();

    // Global keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F9') {
        e.preventDefault();
        handleCheckout('NAKIT');
      } else if (e.key === 'F10') {
        e.preventDefault();
        handleCheckout('KREDI_KARTI');
      } else if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      } else if (e.key === 'F3') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, discount]);

  const loadProducts = async () => {
    try {
      const res = await fetch(`/api/products?storeId=${storeId}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBarcodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    // 1. Terazi Barkodu Kontrolü (27, 28, 29 ile başlayan EAN-13 ağırlıklı barkodlar)
    const scale = parseScaleBarcode(code);
    if (scale.isScale && scale.itemCode) {
      const found = products.find(
        p =>
          p.barcode === code ||
          p.barcode === scale.itemCode ||
          p.barcode === String(scale.numericCode) ||
          p.barcode.endsWith(scale.itemCode)
      );
      if (found) {
        addScaleProductToCart(found, scale.weightKg || 1);
        setBarcodeInput('');
        return;
      }
    }

    // 2. Standart Barkod Kontrolü
    const found = products.find(p => p.barcode === code);
    if (found) {
      addToCart(found);
      setBarcodeInput('');
      playBeep('success');
    } else {
      playBeep('error');
      setMessage({ text: `Barkod bulunamadı: ${code}`, type: 'error' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const addScaleProductToCart = (product: Product, weight: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: parseFloat((item.quantity + weight).toFixed(3)) }
            : item
        );
      }
      return [{ product, quantity: weight }, ...prev];
    });
    setMessage({
      text: `⚖️ Terazi Tartımı: ${product.name} (${weight} ${product.unit || 'kg'}) sepete eklendi!`,
      type: 'success',
    });
    setTimeout(() => setMessage(null), 3500);
    playBeep('success');
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [{ product, quantity: 1 }, ...prev];
    });
    playBeep('success');
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setCashGiven('');
    barcodeInputRef.current?.focus();
  };

  // Totals
  const subtotal = cart.reduce((sum, item) => sum + item.product.sale_price * item.quantity, 0);
  const total = Math.max(0, subtotal - discount);
  const cashNum = parseFloat(cashGiven) || 0;
  const change = cashNum > total ? cashNum - total : 0;

  const fetchCustomersList = async () => {
    try {
      const res = await fetch(`/api/customers?storeId=${storeId}`);
      if (res.ok) {
        const list = await res.json();
        setCustomers(list);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCheckout = async (paymentMethod: 'NAKIT' | 'KREDI_KARTI' | 'VERESIYE', customerId?: number) => {
    const targetCustomerId = customerId || activeCustomer?.id;

    if (paymentMethod === 'VERESIYE' && !targetCustomerId) {
      fetchCustomersList();
      setVeresiyeModalOpen(true);
      return;
    }

    if (cart.length === 0) {
      setMessage({ text: 'Sepet boş, ürün ekleyin!', type: 'error' });
      playBeep('warning');
      setTimeout(() => setMessage(null), 2500);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        store_id: storeId,
        payment_method: paymentMethod,
        discount: discount,
        customer_id: targetCustomerId,
        items: cart.map(item => ({
          barcode: item.product.barcode,
          quantity: item.quantity,
        })),
      };

      const res = await fetch('/api/pos/sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Satış tamamlanamadı');
      }

      const sale = await res.json();
      setLastReceipt(sale);
      setVeresiyeModalOpen(false);
      playBeep('success');
      clearCart();
      loadProducts();
      setMessage({ text: `Satış Başarılı! Fiş Kodu: ${sale.sale_code}`, type: 'success' });
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      playBeep('error');
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const criticalProducts = products.filter(p => p.stock_quantity <= p.critical_level);

  return (
    <div className="grid grid-cols-12 gap-5">
      {/* Toast Message */}
      {message && (
        <div
          className={`col-span-12 p-3.5 rounded-xl text-sm font-semibold flex items-center justify-between shadow-md transition-all ${
            message.type === 'success'
              ? 'bg-emerald-600 text-white shadow-emerald-600/20'
              : 'bg-red-600 text-white shadow-red-600/20'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Left Column: Barcode input + Cart Table (7 cols) */}
      <div className="col-span-12 lg:col-span-8 flex flex-col justify-between space-y-4">
        
        {/* Barcode and Search Header */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          
          {/* Customer / Veresiye Selection Bar */}
          <div className="mb-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <span className="text-slate-500 font-semibold">Cari / Müşteri:</span>
              {activeCustomer ? (
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-800 bg-purple-100/70 text-purple-900 px-2 py-0.5 rounded-lg border border-purple-200">
                    {activeCustomer.name}
                  </span>
                  <span className="font-mono text-red-600 font-bold">
                    (Borç: {activeCustomer.balance.toFixed(2)} ₺)
                  </span>
                </div>
              ) : (
                <span className="text-slate-500 font-medium italic">Genel Perakende Müşteri</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Role Indicator & Switcher */}
              {activeRole === 'PATRON' ? (
                <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg text-emerald-800 font-bold text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Patron</span>
                  <button
                    type="button"
                    onClick={() => handleSwitchRole('KASIYER')}
                    className="ml-1 text-slate-500 hover:text-slate-800 underline text-[10px]"
                    title="Kasiyer moduna geç (maliyetleri gizler)"
                  >
                    Kasiyer Moduna Geç
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg text-blue-800 font-bold text-[11px]">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Kasiyer</span>
                  <button
                    type="button"
                    onClick={() => handleSwitchRole('PATRON')}
                    className="ml-1 text-blue-600 hover:text-blue-800 underline text-[10px] font-bold"
                    title="Patron moduna geç (PIN gereklidir)"
                  >
                    Patron Girişi (PIN)
                  </button>
                </div>
              )}

              {activeCustomer ? (
                <button
                  type="button"
                  onClick={() => {
                    setActiveCustomer(null);
                    onClearCustomer?.();
                  }}
                  className="text-red-500 hover:text-red-700 font-bold hover:underline"
                >
                  ✕ Müşteriyi Kaldır
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    fetchCustomersList();
                    setVeresiyeModalOpen(true);
                  }}
                  className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold rounded-lg border border-purple-200 transition-colors"
                >
                  + Veresiye Müşterisi Seç
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Barcode className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Barkod okutun veya tuşlayın... (F2: Barkod, F3: Ara, 27/28: Terazi)"
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-emerald-500 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-sm transition-colors flex items-center gap-1.5 shadow-sm shadow-emerald-600/30 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Ekle
            </button>
            <button
              type="button"
              onClick={() => {
                setScaleModalProduct(null);
                setScaleModalOpen(true);
              }}
              className="px-3.5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm shadow-teal-600/25 shrink-0"
              title="Gramajlı / Kilo ile satış (Terazi Tartım Ekranı)"
            >
              <Scale className="w-4 h-4" />
              <span>⚖️ Terazi / Tartım</span>
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Search className="w-4 h-4" />
              Ürün Bul
            </button>
          </form>

          {/* Quick Category / Popular shortcut buttons */}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-medium shrink-0">Hızlı Ekle:</span>
            {products.slice(0, 6).map(p => {
              const isKg = p.unit.toLowerCase() === 'kg' || p.unit.toLowerCase() === 'kilo';
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    if (isKg) {
                      setScaleModalProduct(p);
                      setScaleModalOpen(true);
                    } else {
                      addToCart(p);
                    }
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-lg whitespace-nowrap text-slate-600 transition-colors flex items-center gap-1"
                >
                  <span>{isKg ? '⚖️' : '+'}</span>
                  <span>{p.name.slice(0, 18)}..</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cart Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <span>Sepetteki Ürünler ({cart.length} Kalem)</span>
              {heldCarts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setHeldModalOpen(true)}
                  className="px-2 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] flex items-center gap-1 shadow-sm transition-all animate-pulse"
                >
                  <PauseCircle className="w-3.5 h-3.5" />
                  <span>{heldCarts.length} Askıda Fiş [Geri Çağır]</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={handleHoldCart}
                  className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold rounded-lg flex items-center gap-1 transition-colors"
                  title="Mevcut sepeti askıya alıp sonraki müşteriye geçin"
                >
                  <PauseCircle className="w-3.5 h-3.5" /> Fişi Askıya Al
                </button>
              )}
              {cart.length > 0 && (
                <button onClick={clearCart} className="text-red-500 hover:text-red-700 font-bold flex items-center gap-1">
                  <Trash2 className="w-3.5 h-3.5" /> Boşalt
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[460px]">
            {cart.length === 0 ? (
              <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center">
                <ShoppingBag className="w-12 h-12 stroke-[1.5] text-slate-300 mb-2" />
                <p className="font-medium text-sm">Sepetiniz Boş</p>
                <p className="text-xs text-slate-400 mt-1">Barkod okutarak veya ürün arayarak satışa başlayın</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/60 text-slate-400 text-xs font-medium border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-4">Ürün & Varyant</th>
                    <th className="py-2.5 px-2 text-center">Adet</th>
                    <th className="py-2.5 px-3 text-right">B.Fiyat</th>
                    <th className="py-2.5 px-4 text-right">Toplam</th>
                    <th className="py-2.5 px-3 text-center">Sil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {cart.map(item => (
                    <tr key={item.product.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{item.product.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400 font-mono">{item.product.barcode}</span>
                          {item.product.variant && (
                            <span className="px-2 py-0.5 rounded text-[11px] bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                              {item.product.variant}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="inline-flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="px-2 py-1 text-slate-500 hover:bg-slate-200"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2.5 font-bold font-mono text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="px-2 py-1 text-slate-500 hover:bg-slate-200"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {item.product.sale_price.toFixed(2)} ₺
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                        {(item.product.sale_price * item.quantity).toFixed(2)} ₺
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded-md"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Keyboard Shortcuts Bar */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="bg-white px-2 py-1 rounded border border-slate-200 font-mono font-bold text-slate-700">F2: Barkod Odakla</span>
            <span className="bg-white px-2 py-1 rounded border border-slate-200 font-mono font-bold text-slate-700">F3: Ürün Ara</span>
            <span className="bg-white px-2 py-1 rounded border border-slate-200 font-mono font-bold text-emerald-700">F9: Nakit Satış</span>
            <span className="bg-white px-2 py-1 rounded border border-slate-200 font-mono font-bold text-blue-700">F10: Kredi Kartı</span>
          </div>
        </div>

        {/* Critical Stock Alert Bar */}
        {criticalProducts.length > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                <strong>Kritik Stok Uyarısı:</strong> {criticalProducts.length} ürün eşiğin altında! (Örn:{' '}
                {criticalProducts[0]?.name} - {criticalProducts[0]?.stock_quantity} {criticalProducts[0]?.unit})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCriticalStockModalOpen(true)}
              className="font-bold text-amber-900 hover:text-amber-950 underline cursor-pointer shrink-0 ml-2 text-xs"
            >
              İncele ({criticalProducts.length})
            </button>
          </div>
        )}
      </div>

      {/* Right Column: Checkout & Payment (4 cols) */}
      <div className="col-span-12 lg:col-span-4 flex flex-col justify-between space-y-4">
        
        {/* Payment Summary Box */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400">
              Ödeme Özeti
            </h3>
            <div className="flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => setReturnModalOpen(true)}
                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                title="Ürün İadesi & Değişim"
              >
                <RotateCcw className="w-3 h-3" /> İade
              </button>
              <button
                type="button"
                onClick={() => requirePatronRole(() => setExpensesModalOpen(true))}
                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                title="Kasadan yapılan masraf/gider kaydı"
              >
                <span>💸</span> Masraf
              </button>
              <button
                type="button"
                onClick={() => setShiftModalOpen(true)}
                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                title="Kasiyer Vardiya Devri & Kasa Teslim Tutanağı"
              >
                <Clock className="w-3 h-3" /> Devir
              </button>
              <button
                type="button"
                onClick={() => requirePatronRole(() => setZReportModalOpen(true))}
                className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                title="Gün Sonu Z Raporu ve Kasa Mutabakatı"
              >
                <span>📊</span> Z Raporu
              </button>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Ara Toplam:</span>
              <span className="font-mono font-semibold">{subtotal.toFixed(2)} ₺</span>
            </div>

            <div className="flex justify-between items-center text-slate-500">
              <span>İndirim (₺):</span>
              <input
                type="number"
                min="0"
                value={discount || ''}
                onChange={e => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0.00"
                className="w-24 px-2 py-1 text-right font-mono text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-between text-slate-500">
              <span>KDV (%20 Dahil):</span>
              <span className="font-mono">{(total * 0.2).toFixed(2)} ₺</span>
            </div>

            <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
              <span className="text-base font-bold text-slate-800">Ödenecek Tutar:</span>
              <span className="text-3xl font-extrabold text-emerald-600 font-mono">
                {total.toFixed(2)} ₺
              </span>
            </div>
          </div>

          {/* Quick Cash Given Buttons */}
          <div className="pt-3 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-500 uppercase block mb-1.5">
              Alınan Nakit & Para Üstü
            </label>
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {[total, 100, 200, 500].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setCashGiven(val.toString())}
                  className="py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold font-mono text-slate-700"
                >
                  {val === total ? 'Tam Para' : `${val} ₺`}
                </button>
              ))}
            </div>

            <input
              type="number"
              placeholder="Farklı alınan nakit girin..."
              value={cashGiven}
              onChange={e => setCashGiven(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />

            {cashNum > 0 && (
              <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex justify-between items-center text-xs">
                <span className="text-emerald-800 font-bold">Verilecek Para Üstü:</span>
                <span className="text-lg font-bold font-mono text-emerald-600">{change.toFixed(2)} ₺</span>
              </div>
            )}
          </div>

          {/* Big Action Payment Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => handleCheckout('NAKIT')}
              disabled={loading || cart.length === 0}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold text-base shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
            >
              <Banknote className="w-5 h-5" />
              NAKİT SATIŞ (F9)
            </button>

            {/* Wireless POS Push Button (Feature Gated) */}
            <button
              onClick={() => {
                if (userPlan === 'STARTER') {
                  onFeatureLocked?.('WIRELESS_POS');
                  return;
                }
                handleCheckout('KREDI_KARTI');
              }}
              disabled={loading || cart.length === 0}
              className={`w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                userPlan === 'STARTER'
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 shadow-sm cursor-pointer'
                  : 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-lg shadow-sky-600/25'
              }`}
            >
              {userPlan === 'STARTER' ? (
                <>
                  <span>🔒</span>
                  <span>Fiziki POS Kablosuz Aktarım (Kilitli - Yükselt)</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>⚡ Fiziki POS Cihazına Tutar Gönder (F10)</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleCheckout('KREDI_KARTI')}
              disabled={loading || cart.length === 0}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs flex items-center justify-center gap-2"
            >
              <span>💳 Manuel Kredi Kartı Çekimi</span>
            </button>

            <div className="grid grid-cols-4 gap-1.5">
              <button
                onClick={() => handleCheckout('VERESIYE')}
                className={`py-2.5 rounded-xl font-bold text-xs transition-all ${
                  activeCustomer
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {activeCustomer ? `${activeCustomer.name.split(' ')[0]}` : 'Veresiye'}
              </button>
              <button
                onClick={() => lastReceipt && window.print()}
                disabled={!lastReceipt}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1"
              >
                <Receipt className="w-3.5 h-3.5" /> Fiş
              </button>
              <button
                onClick={() => handleSendWhatsappReceipt()}
                disabled={!lastReceipt}
                className="py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-black rounded-xl text-xs transition-colors flex items-center justify-center gap-1 shadow-sm"
                title="Müşteriye dijital e-fiş gönder (Kağıtsız)"
              >
                <Send className="w-3.5 h-3.5" /> E-Fiş
              </button>
              <button
                onClick={() => setEInvoiceModalOpen(true)}
                disabled={!lastReceipt && cart.length === 0}
                className="py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold rounded-xl text-[11px] transition-colors flex items-center justify-center gap-1 shadow-sm"
                title="GİB Uyumlu Resmi e-Arşiv Fatura Düzenle"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" /> e-Arşiv
              </button>
            </div>
          </div>
        </div>

        {/* Last Receipt Preview Card */}
        {lastReceipt && (
          <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 text-xs text-slate-700 space-y-2">
            <div className="flex justify-between font-bold text-slate-900 pb-1 border-b border-emerald-200/80">
              <span>Son Fiş: #{lastReceipt.sale_code}</span>
              <span className="font-mono text-emerald-700 font-black">{lastReceipt.total_amount.toFixed(2)} ₺</span>
            </div>
            <div className="text-[11px] text-slate-600 flex justify-between items-center">
              <span>{lastReceipt.payment_method === 'NAKIT' ? '💵 Nakit' : lastReceipt.payment_method === 'KREDI_KARTI' ? '💳 POS/Kart' : '📒 Veresiye'} • {lastReceipt.items.length} Kalem</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEInvoiceModalOpen(true)}
                  className="text-blue-700 hover:text-blue-900 font-bold underline flex items-center gap-1"
                >
                  <FileText className="w-3 h-3" /> e-Arşiv
                </button>
                <button
                  onClick={() => handleSendWhatsappReceipt()}
                  className="text-emerald-700 hover:text-emerald-900 font-bold underline flex items-center gap-1"
                >
                  <Send className="w-3 h-3" /> WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Product Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <Search className="w-5 h-5 text-emerald-600" /> Hızlı Ürün Arama
              </h3>
              <button onClick={() => setSearchOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <input
              type="text"
              autoFocus
              placeholder="Ürün adı, barkod veya beden/renk yazın..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />

            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
              {products
                .filter(
                  p =>
                    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.barcode.includes(searchQuery) ||
                    (p.variant && p.variant.toLowerCase().includes(searchQuery.toLowerCase()))
                )
                .slice(0, 10)
                .map(product => (
                  <div
                    key={product.id}
                    onClick={() => {
                      addToCart(product);
                      setSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="p-3 hover:bg-emerald-50 cursor-pointer flex items-center justify-between transition-colors rounded-lg"
                  >
                    <div>
                      <div className="font-bold text-sm text-slate-800">{product.name}</div>
                      <div className="text-xs text-slate-500">
                        <span className="font-mono">{product.barcode}</span> • {product.category}
                        {product.variant && ` • ${product.variant}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold font-mono text-emerald-600 text-sm">
                        {product.sale_price.toFixed(2)} ₺
                      </div>
                      <div className="text-xs text-slate-400">Stok: {product.stock_quantity}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Veresiye Customer Picker Modal */}
      {veresiyeModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-800">Veresiye Satış - Müşteri Seçimi</h3>
                <p className="text-xs text-slate-400">Bu satışın borcu seçilen müşterinin cari hesabına işlenecektir.</p>
              </div>
              <button onClick={() => setVeresiyeModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                autoFocus
                placeholder="Müşteri adı veya telefon ara..."
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
              />

              <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                {customers
                  .filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch))
                  .map(c => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setActiveCustomer(c);
                        setVeresiyeModalOpen(false);
                        if (cart.length > 0) {
                          handleCheckout('VERESIYE', c.id);
                        } else {
                          setMessage({ text: `${c.name} seçildi. Şimdi sepete ürün ekleyebilirsiniz.`, type: 'success' });
                          setTimeout(() => setMessage(null), 3000);
                        }
                      }}
                      className="p-3 hover:bg-purple-50 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-800">{c.name}</div>
                        <div className="text-[11px] text-slate-400">{c.phone}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold font-mono text-red-600">{c.balance.toFixed(2)} ₺</div>
                        <div className="text-[10px] text-slate-400">Mevcut Borç</div>
                      </div>
                    </div>
                  ))}

                {customers.length === 0 && (
                  <div className="p-4 text-center text-xs text-slate-400">Kayıtlı müşteri bulunamadı.</div>
                )}
              </div>

              {/* Quick Add Customer Form */}
              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200 space-y-2 text-xs">
                <div className="font-bold text-purple-900">Müşteri Listede Yok mu? Hızlıca Ekle:</div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Ad Soyad..."
                    value={quickName}
                    onChange={e => setQuickName(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="tel"
                    placeholder="Telefon..."
                    value={quickPhone}
                    onChange={e => setQuickPhone(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <button
                  type="button"
                  disabled={!quickName || !quickPhone}
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/customers', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: quickName, phone: quickPhone, store_id: storeId }),
                      });
                      if (res.ok) {
                        const newCust = await res.json();
                        setActiveCustomer(newCust);
                        setVeresiyeModalOpen(false);
                        if (cart.length > 0) {
                          handleCheckout('VERESIYE', newCust.id);
                        } else {
                          setMessage({ text: `${newCust.name} kaydedildi ve seçildi.`, type: 'success' });
                          setTimeout(() => setMessage(null), 3000);
                        }
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg font-bold text-xs shadow-sm transition-colors"
                >
                  Müşteriyi Kaydet ve Seç
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Expenses / Masraf Modal */}
      <ExpensesModal
        isOpen={expensesModalOpen}
        onClose={() => setExpensesModalOpen(false)}
        storeId={storeId}
      />

      {/* Daily Z-Report / Kasa Kapatma Modal */}
      <DailyZReportModal
        isOpen={zReportModalOpen}
        onClose={() => setZReportModalOpen(false)}
        storeId={storeId}
        storeName={storeName}
      />

      {/* Held Carts (Askıdaki Fişler) Modal */}
      {heldModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-amber-500 text-slate-950 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-sm">
                <PauseCircle className="w-5 h-5" />
                <span>Askıdaki Fişler ({heldCarts.length})</span>
              </div>
              <button onClick={() => setHeldModalOpen(false)} className="font-bold text-lg hover:opacity-70">✕</button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto space-y-3">
              {heldCarts.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">Askıda bekleyen fiş bulunmuyor.</div>
              ) : (
                heldCarts.map(item => (
                  <div key={item.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-slate-800">
                        {item.customer ? item.customer.name : 'Genel Müşteri'}
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        Saat: {item.timestamp} • {item.cart.length} Kalem Ürün
                      </div>
                      <div className="font-mono font-bold text-emerald-700 text-sm mt-1">
                        ₺{item.totalAmount.toFixed(2)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleRecallCart(item.id)}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm"
                      >
                        <PlayCircle className="w-4 h-4" /> Kasaya Al
                      </button>
                      <button
                        onClick={() => handleDeleteHeldCart(item.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                        title="Fişi İptal Et"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Return / Refund Modal */}
      <ReturnModal
        isOpen={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        storeId={storeId}
        storeName={storeName}
        onSuccess={() => {
          loadProducts();
          setMessage({ text: 'Ürün başarıyla iade alındı ve stok güncellendi.', type: 'success' });
          setTimeout(() => setMessage(null), 3500);
        }}
      />

      {/* Role / Patron PIN Modal */}
      <RolePinModal
        isOpen={rolePinModalOpen}
        onClose={() => {
          setRolePinModalOpen(false);
          setPinTargetAction(null);
        }}
        storeId={storeId}
        onSuccess={() => {
          if (pinTargetAction) {
            pinTargetAction();
            setPinTargetAction(null);
          }
        }}
      />

      {/* Shift Handover Modal */}
      <ShiftHandoverModal
        isOpen={shiftModalOpen}
        onClose={() => setShiftModalOpen(false)}
        storeId={storeId}
        storeName={storeName}
      />

      {/* E-Archive Invoice Modal */}
      <EArchiveInvoiceModal
        isOpen={eInvoiceModalOpen}
        onClose={() => setEInvoiceModalOpen(false)}
        storeName={storeName}
        saleCode={lastReceipt?.sale_code || 'SLS-TASLAK'}
        totalAmount={lastReceipt ? lastReceipt.total_amount : total}
        items={lastReceipt ? lastReceipt.items : cart.map(i => ({
          name: i.product.name,
          quantity: i.quantity,
          unit_price: i.product.sale_price,
          total_price: i.product.sale_price * i.quantity,
          kdv_rate: 10,
        }))}
        customerName={activeCustomer?.name || ''}
        customerPhone={activeCustomer?.phone || ''}
      />

      {/* Scale / Terazi Tartım Modal */}
      <ScaleModal
        isOpen={scaleModalOpen}
        onClose={() => setScaleModalOpen(false)}
        products={products}
        initialProduct={scaleModalProduct}
        onAddToCart={(p, w) => addScaleProductToCart(p, w)}
      />

      {/* Critical Stock List Modal */}
      <CriticalStockListModal
        isOpen={criticalStockModalOpen}
        onClose={() => setCriticalStockModalOpen(false)}
        criticalProducts={criticalProducts}
        onOpenSupplierOrder={() => setSupplierOrderModalOpen(true)}
      />

      {/* Supplier Order Modal */}
      <SupplierOrderModal
        isOpen={supplierOrderModalOpen}
        onClose={() => setSupplierOrderModalOpen(false)}
        storeId={storeId}
        storeName={storeName}
      />
    </div>
  );
}
