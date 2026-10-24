'use client';

import React, { useState } from 'react';
import {
  RotateCcw,
  Search,
  CheckCircle,
  AlertTriangle,
  Banknote,
  CreditCard,
  BookOpen,
  Send,
  X,
  Package,
} from 'lucide-react';

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: number;
  storeName?: string;
  onSuccess?: () => void;
}

export default function ReturnModal({
  isOpen,
  onClose,
  storeId,
  storeName = 'EsnafCepte',
  onSuccess,
}: ReturnModalProps) {
  const [barcode, setBarcode] = useState('');
  const [searching, setSearching] = useState(false);
  const [product, setProduct] = useState<any | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'NAKIT' | 'KREDI_KARTI' | 'VERESIYE'>('NAKIT');
  const [reason, setReason] = useState('Müşteri Cayma / Beğenmedi');
  const [note, setNote] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setBarcode('');
      setProduct(null);
      setQuantity(1);
      setRefundAmount(0);
      setPaymentMethod('NAKIT');
      setReason('Müşteri Cayma / Beğenmedi');
      setNote('');
      setResult(null);
      setError(null);
      fetchCustomers();
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`/api/customers?storeId=${storeId}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchProduct = async (codeToSearch = barcode) => {
    const code = codeToSearch.trim();
    if (!code) return;
    setSearching(true);
    setError(null);
    try {
      const res = await fetch(`/api/products?storeId=${storeId}`);
      if (res.ok) {
        const products = await res.json();
        const found = products.find(
          (p: any) =>
            p.barcode === code ||
            p.name.toLowerCase().includes(code.toLowerCase())
        );
        if (found) {
          setProduct(found);
          setBarcode(found.barcode);
          setQuantity(1);
          setRefundAmount(found.sale_price);
        } else {
          setError(`"${code}" barkodlu veya isimli ürün bulunamadı.`);
          setProduct(null);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ürün aranamadı');
    } finally {
      setSearching(false);
    }
  };

  const handleQuantityChange = (newQty: number) => {
    const q = Math.max(1, newQty);
    setQuantity(q);
    if (product) {
      setRefundAmount(parseFloat((product.sale_price * q).toFixed(2)));
    }
  };

  const handleSubmitRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) {
      setError('Lütfen iade alınacak ürünü bulun.');
      return;
    }
    if (quantity <= 0) {
      setError('İade adedi 1 veya daha büyük olmalıdır.');
      return;
    }
    if (refundAmount < 0) {
      setError('İade tutarı negatif olamaz.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/pos/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: storeId,
          barcode: product.barcode,
          quantity,
          refund_amount: refundAmount,
          payment_method: paymentMethod,
          customer_id: paymentMethod === 'VERESIYE' ? selectedCustomerId : undefined,
          reason: note ? `${reason} (${note})` : reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'İade kaydedilemedi.');
      }

      setResult(data);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleShareWhatsappReceipt = () => {
    if (!result) return;
    const text =
`🔄 *[${storeName.toUpperCase()} - İADE MAKBUZU]*
📦 *Ürün:* ${result.product.name} (${result.product.barcode})
🔢 *Miktar:* ${quantity} ${result.product.unit}
💰 *İade Tutarı:* ₺${refundAmount.toFixed(2)}
💳 *İade Yöntemi:* ${
  paymentMethod === 'NAKIT'
    ? '💵 Nakit İade'
    : paymentMethod === 'KREDI_KARTI'
    ? '💳 Kredi Kartı İadesi'
    : '📒 Cari/Veresiye Borçtan Düşüldü'
}
📌 *İade Nedeni:* ${reason}
🔖 *İade Kodu:* ${result.refundCode}
📅 *Tarih:* ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}

_İadeniz stoğumuza ve kasa hareketlerimize işlenmiştir._`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 to-red-600 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <RotateCcw className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Ürün İadesi & Değişim</h3>
              <p className="text-xs text-rose-100">Stoğa geri al, kasadan veya cariden iade et</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[82vh] overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {result ? (
            /* Success State */
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-9 h-9" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-800">İade Başarıyla Tamamlandı!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  {result.product.name} stoğa geri eklendi ve kasa güncellendi.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">İade Kodu:</span>
                  <span className="font-mono font-bold text-slate-800">{result.refundCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">İade Tutarı:</span>
                  <span className="font-bold text-rose-600 text-sm">₺{refundAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">İade Yöntemi:</span>
                  <span className="font-semibold text-slate-700">
                    {paymentMethod === 'NAKIT'
                      ? '💵 Nakit (Kasadan Çıktı)'
                      : paymentMethod === 'KREDI_KARTI'
                      ? '💳 Kredi Kartı İadesi'
                      : '📒 Veresiye Mahsubu'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Yeni Stok Miktarı:</span>
                  <span className="font-bold text-emerald-600">{result.product.stock_quantity} {result.product.unit}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleShareWhatsappReceipt}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
                >
                  <Send className="w-4 h-4" /> Müşteriye WhatsApp İade Fişi Gönder
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Kapat
                </button>
              </div>
            </div>
          ) : (
            /* Refund Form */
            <form onSubmit={handleSubmitRefund} className="space-y-4 text-xs">
              {/* Product Lookup */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  1. İade Alınacak Ürün Barkodu veya Adı
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Barkod okutun veya ürün adı yazın..."
                      value={barcode}
                      onChange={e => setBarcode(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearchProduct();
                        }
                      }}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSearchProduct()}
                    disabled={searching}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shrink-0"
                  >
                    {searching ? 'Aranıyor...' : 'Ürünü Bul'}
                  </button>
                </div>
              </div>

              {/* Product Preview Card */}
              {product && (
                <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl flex items-start gap-3">
                  <div className="p-2.5 bg-white text-rose-600 rounded-xl shadow-xs border border-rose-100">
                    <Package className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-slate-900 text-sm">{product.name}</div>
                    <div className="flex items-center gap-2 mt-0.5 text-slate-500">
                      <span className="font-mono">{product.barcode}</span>
                      <span>•</span>
                      <span>Kategori: {product.category}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-500">Mevcut Stok: </span>
                        <span className="font-bold text-slate-700">{product.stock_quantity} {product.unit}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Birim Satış: </span>
                        <span className="font-bold text-rose-600">₺{product.sale_price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quantity & Refund Amount */}
              {product && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        İade Adedi ({product.unit})
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(quantity - 1)}
                          className="w-9 h-9 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center text-sm"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={e => handleQuantityChange(parseInt(e.target.value) || 1)}
                          className="flex-1 py-2 text-center bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(quantity + 1)}
                          className="w-9 h-9 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center text-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        İade Edilecek Toplam Tutar (₺)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={refundAmount}
                        onChange={e => setRefundAmount(parseFloat(e.target.value) || 0)}
                        className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-rose-600 font-mono"
                      />
                    </div>
                  </div>

                  {/* Payment Method Choice */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">
                      İade Ödeme Yöntemi
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('NAKIT')}
                        className={`py-2.5 px-2 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all border ${
                          paymentMethod === 'NAKIT'
                            ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Banknote className="w-4 h-4" />
                        <span>Nakit İade</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('KREDI_KARTI')}
                        className={`py-2.5 px-2 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all border ${
                          paymentMethod === 'KREDI_KARTI'
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Kart / Slip İade</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('VERESIYE')}
                        className={`py-2.5 px-2 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all border ${
                          paymentMethod === 'VERESIYE'
                            ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>Cari / Borç Düş</span>
                      </button>
                    </div>
                  </div>

                  {/* If Veresiye, select customer */}
                  {paymentMethod === 'VERESIYE' && (
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Borcundan Düşülecek Müşteri
                      </label>
                      <select
                        value={selectedCustomerId || ''}
                        onChange={e => setSelectedCustomerId(Number(e.target.value) || undefined)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                        required
                      >
                        <option value="">-- Müşteri Seçin --</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} (Mevcut Borç: ₺{c.balance.toFixed(2)})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Reason */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        İade Nedeni
                      </label>
                      <select
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      >
                        <option value="Müşteri Cayma / Beğenmedi">Müşteri Cayma / Beğenmedi</option>
                        <option value="Kusurlu / Ayıplı Ürün">Kusurlu / Ayıplı Ürün</option>
                        <option value="Yanlış Beden / Varyant">Yanlış Beden / Varyant</option>
                        <option value="Tarihi Geçmiş / Bozulmuş">Tarihi Geçmiş / Bozulmuş</option>
                        <option value="Diğer">Diğer</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Açıklama / Not (Opsiyonel)
                      </label>
                      <input
                        type="text"
                        placeholder="Örn: Etiketi sağlam, kutusu açılmamış"
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  {/* Submit Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                    >
                      Vazgeç
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-md shadow-rose-600/20 flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      {submitting ? 'İşleniyor...' : `₺${refundAmount.toFixed(2)} İadeyi Onayla`}
                    </button>
                  </div>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
