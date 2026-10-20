'use client';

import React, { useState, useEffect } from 'react';
import { Package, Send, CheckCircle, Settings, Phone, AlertTriangle } from 'lucide-react';

interface CriticalProduct {
  id: number;
  barcode: string;
  name: string;
  category: string;
  stock_quantity: number;
  critical_level: number;
  unit: string;
}

interface SupplierOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: number;
  storeName: string;
}

export default function SupplierOrderModal({
  isOpen,
  onClose,
  storeId,
  storeName,
}: SupplierOrderModalProps) {
  const [criticalProducts, setCriticalProducts] = useState<CriticalProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [supplierName, setSupplierName] = useState('Ahmet Bey (Ana Toptancı)');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [isAutoActive, setIsAutoActive] = useState(true);
  const [orderQuantities, setOrderQuantities] = useState<Record<number, number>>({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCriticalProducts();
      loadSettings();
    }
  }, [isOpen, storeId]);

  const loadCriticalProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?storeId=${storeId}`);
      if (res.ok) {
        const all = await res.json();
        const critical = all.filter((p: CriticalProduct) => p.stock_quantity <= p.critical_level);
        setCriticalProducts(critical);

        // Varsayılan sipariş adetlerini belirle (kritik seviyenin 3 katı)
        const defaults: Record<number, number> = {};
        critical.forEach((p: CriticalProduct) => {
          defaults[p.id] = Math.max(10, p.critical_level * 3);
        });
        setOrderQuantities(defaults);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await fetch(`/api/stores`);
      if (res.ok) {
        const stores = await res.json();
        const cur = stores.find((s: any) => s.id === storeId);
        if (cur) {
          if (cur.supplier_name) setSupplierName(cur.supplier_name);
          if (cur.supplier_phone) setSupplierPhone(cur.supplier_phone);
          if (cur.auto_supplier_whatsapp !== undefined) setIsAutoActive(cur.auto_supplier_whatsapp);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch('/api/stores/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          auto_supplier_whatsapp: isAutoActive,
          supplier_name: supplierName,
          supplier_phone: supplierPhone,
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSendSupplierWhatsapp = () => {
    if (criticalProducts.length === 0) {
      alert('Sipariş verilecek kritik stoklu ürün bulunmuyor.');
      return;
    }

    const itemsText = criticalProducts
      .map(p => {
        const qty = orderQuantities[p.id] || 10;
        return `• *${qty} ${p.unit}* — ${p.name} _(Kalan Stok: ${p.stock_quantity})_`;
      })
      .join('\n');

    const message =
`📦 *[TOPTANCI SİPARİŞ LİSTESİ]*
🏪 *Dükkan:* ${storeName}
📅 *Tarih:* ${new Date().toLocaleDateString('tr-TR')}

Selam ${supplierName || 'Ahmet Bey'}, dükkanımızda stoğu bitmek üzere olan aşağıdaki ürünleri lütfen ilk sevkiyatımıza ekler misiniz?

${itemsText}

Hayırlı işler, kolay gelsin!
_EsnafCepte • İnanoraSoft ile gönderildi._`;

    const cleanPhone = supplierPhone.replace(/[^0-9]/g, '');
    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone.startsWith('90') ? cleanPhone : '90' + cleanPhone}&text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            ✕
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">📦</span>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
              Toptancı WhatsApp Sipariş Entegrasyonu
            </span>
          </div>

          <h3 className="text-xl font-black">{storeName} — Eksik Ürün Siparişi</h3>
          <p className="text-xs text-emerald-100 mt-1">
            Kritik seviyeye inen ürünleri tek tıkla toptancınıza WhatsApp siparişi olarak iletin.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Active / Passive Toggle and Supplier Settings */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Otomatik Sipariş Durumu
                </span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAutoActive}
                  onChange={e => setIsAutoActive(e.target.checked)}
                  className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className={`text-xs font-black ${isAutoActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {isAutoActive ? 'AKTİF' : 'PASİF'}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Tedarikçi / Toptancı Adı
                </label>
                <input
                  type="text"
                  placeholder="Örn: Ahmet Bey (Metro Toptan)"
                  value={supplierName}
                  onChange={e => setSupplierName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Toptancı WhatsApp Telefonu
                </label>
                <input
                  type="tel"
                  placeholder="05XX XXX XX XX"
                  value={supplierPhone}
                  onChange={e => setSupplierPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              {savedSuccess ? (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Ayarlar Kaydedildi!
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">
                  {isAutoActive ? 'Kritik stok uyarısı geldiğinde WhatsApp butonu görünür.' : 'Otomatik toptancı siparişi kapalıdır.'}
                </span>
              )}
              <button
                type="button"
                disabled={savingSettings}
                onClick={handleSaveSettings}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
              >
                {savingSettings ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
              </button>
            </div>
          </div>

          {/* Critical Products List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Kritik Seviyedeki Ürünler ({criticalProducts.length})
              </h4>
              <span className="text-xs text-slate-400">Sipariş edilecek adedi güncelleyebilirsiniz</span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Ürünler taranıyor...</div>
            ) : criticalProducts.length === 0 ? (
              <div className="p-8 text-center bg-emerald-50/50 border border-emerald-200 rounded-2xl text-xs text-emerald-800">
                🎉 Harika! Dükkanda kritik eşiğin altına düşen ürün bulunmuyor, tüm stoklar yeterli seviyede.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto border border-slate-200 rounded-2xl bg-white">
                {criticalProducts.map(p => (
                  <div key={p.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{p.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Kalan Stok: <strong className="text-red-600 font-mono">{p.stock_quantity} {p.unit}</strong> • Kritik Eşik: {p.critical_level}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-500">Sipariş:</span>
                      <input
                        type="number"
                        min="1"
                        value={orderQuantities[p.id] || 10}
                        onChange={e => {
                          const val = Math.max(1, parseInt(e.target.value) || 1);
                          setOrderQuantities(prev => ({ ...prev, [p.id]: val }));
                        }}
                        className="w-16 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg font-bold font-mono text-center text-xs"
                      />
                      <span className="text-xs font-medium text-slate-600">{p.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs"
          >
            Vazgeç
          </button>
          <button
            disabled={!isAutoActive || criticalProducts.length === 0}
            onClick={handleSendSupplierWhatsapp}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white font-black rounded-xl text-xs shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all"
          >
            <Send className="w-4 h-4" />
            Toptancıya WhatsApp Siparişi Gönder
          </button>
        </div>
      </div>
    </div>
  );
}
