'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  FileSpreadsheet,
  Edit2,
  Trash2,
  Barcode,
  Layers,
  CheckCircle,
  Upload,
} from 'lucide-react';
import ImportWizardModal from '@/components/ImportWizardModal';
import SupplierOrderModal from '@/components/SupplierOrderModal';

interface Product {
  id: number;
  barcode: string;
  name: string;
  category: string;
  variant?: string;
  cost_price: number;
  sale_price: number;
  stock_quantity: number;
  critical_level: number;
  unit: string;
  plu_code?: string;
}

import { UserPlan } from '@/lib/db';
import { LockedFeature } from '@/lib/plans';

interface ProductsViewProps {
  storeId?: number;
  storeName?: string;
  userPlan?: UserPlan;
  onFeatureLocked?: (feature: LockedFeature) => void;
}

export default function ProductsView({
  storeId = 1,
  storeName = 'EsnafCepte',
  userPlan = 'TRIAL',
  onFeatureLocked,
}: ProductsViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('TÜMÜ');
  const [modalOpen, setModalOpen] = useState(false);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [importWizardOpen, setImportWizardOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<'PATRON' | 'KASIYER'>('PATRON');

  useEffect(() => {
    try {
      const r = localStorage.getItem('esnaf_active_role');
      if (r === 'KASIYER' || r === 'PATRON') setActiveRole(r);
    } catch {}
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [storeId]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?storeId=${storeId}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.barcode) {
      alert('Barkod ve ürün adı zorunludur!');
      return;
    }

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editingProduct, store_id: storeId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Kaydedilemedi');
      }

      setModalOpen(false);
      setEditingProduct(null);
      fetchProducts();
      setToast('Ürün başarıyla kaydedildi!');
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const generateBarcode = () => {
    const randomEan = '869' + Math.floor(1000000000 + Math.random() * 9000000000).toString();
    setEditingProduct(prev => ({ ...prev, barcode: randomEan }));
  };

  // Dinamik Kategoriler (Veritabanındaki gerçek ürün kategorilerinden otomatik üretilir)
  const availableCategories = [
    'TÜMÜ',
    ...Array.from(new Set(products.map(p => p.category).filter(Boolean))),
  ];

  const filtered = products.filter(p => {
    const matchCat = categoryFilter === 'TÜMÜ' || p.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search) ||
      (p.plu_code && p.plu_code.includes(search)) ||
      (p.variant && p.variant.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20">
          <CheckCircle className="w-5 h-5" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600" />
            Stok & Ürün Listesi
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Toplam {products.length} kayıtlı ürün • {products.filter(p => p.stock_quantity <= p.critical_level).length} kritik seviyede
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSupplierModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white shadow-md shadow-emerald-700/20"
            title="Kritik stoktaki ürünleri toptancıya WhatsApp ile sipariş verin"
          >
            <span>📦</span> Toptancı Siparişi
          </button>

          <button
            onClick={() => {
              if (userPlan === 'STARTER') {
                onFeatureLocked?.('EXCEL_IMPORT');
                return;
              }
              setImportWizardOpen(true);
            }}
            className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
              userPlan === 'STARTER'
                ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
            }`}
          >
            {userPlan === 'STARTER' ? (
              <>
                <span>🔒</span> Excel Yükle (Kilitli - Yükselt)
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" /> 1000+ Ürün Yükle (Excel/CSV)
              </>
            )}
          </button>

          <button
            onClick={() => {
              if (userPlan === 'STARTER' && products.length >= 1500) {
                onFeatureLocked?.('PRODUCT_LIMIT');
                return;
              }
              setEditingProduct({
                category: 'Genel',
                unit: 'Adet',
                cost_price: 0,
                sale_price: 0,
                stock_quantity: 0,
                critical_level: 5,
              });
              setModalOpen(true);
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Yeni Ürün Ekle
          </button>

          <button
            onClick={() => {
              const csv = [
                'Barkod,Ürün Adı,Kategori,Varyant,Alış Fiyatı,Satış Fiyatı,Mevcut Stok,Kritik Eşik',
                ...products.map(
                  p => `"${p.barcode}","${p.name}","${p.category}","${p.variant || ''}",${p.cost_price},${p.sale_price},${p.stock_quantity},${p.critical_level}`
                ),
              ].join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `stok_listesi_${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
            }}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5"
            title="Excel/CSV İndir"
          >
            <FileSpreadsheet className="w-4 h-4" /> CSV İndir
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Ürün adı, barkod veya renk/beden ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Dynamic Category Filter */}
          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'TÜMÜ' ? 'Tüm Kategoriler' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Barkod</th>
                <th className="py-3 px-4">Ürün Adı & Varyant</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3 text-right">{activeRole === 'KASIYER' ? 'Alış (Gizli)' : 'Alış'}</th>
                <th className="py-3 px-3 text-right">Satış</th>
                <th className="py-3 px-3 text-center">Stok</th>
                <th className="py-3 px-4 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    Aranan kriterlere uygun ürün bulunamadı.
                  </td>
                </tr>
              ) : (
                filtered.map(p => {
                  const isLow = p.stock_quantity <= p.critical_level;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">
                        {p.barcode}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-800">{p.name}</span>
                          {p.plu_code && (
                            <span
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300"
                              title="Terazi 4 Haneli PLU Kodu"
                            >
                              ⚖️ PLU: {p.plu_code}
                            </span>
                          )}
                        </div>
                        {p.variant && (
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                            {p.variant}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs text-slate-600 font-semibold bg-slate-100 px-2 py-1 rounded-md">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-xs text-slate-500">
                        {activeRole === 'KASIYER' ? '*** ₺' : `${p.cost_price.toFixed(2)} ₺`}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">
                        {p.sale_price.toFixed(2)} ₺
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                            isLow
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {isLow && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                          {p.stock_quantity} {p.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setEditingProduct(p);
                            setModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-800">
                {editingProduct.id ? 'Ürünü Düzenle' : 'Yeni Ürün Kaydı'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Barkod Numarası</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="EAN-13 Barkod..."
                    value={editingProduct.barcode || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={generateBarcode}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                  >
                    Barkod Üret
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Ürün Adı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Pierre Cardin Dikişsiz Boxer"
                  value={editingProduct.name || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Kategori</label>
                  <input
                    type="text"
                    list="category-suggestions"
                    placeholder="Örn: Manav, Şarküteri, Gıda, Temizlik..."
                    value={editingProduct.category || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                  />
                  <datalist id="category-suggestions">
                    {availableCategories.filter(c => c !== 'TÜMÜ').map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="font-bold text-slate-600 block mb-1">Varyant (Beden/Renk/No)</label>
                  <input
                    type="text"
                    placeholder="Örn: L / Siyah veya Renk #161"
                    value={editingProduct.variant || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, variant: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Alış Maliyeti (₺)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.cost_price || 0}
                    onChange={e => setEditingProduct({ ...editingProduct, cost_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-600 block mb-1">Satış Fiyatı (₺)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.sale_price || 0}
                    onChange={e => setEditingProduct({ ...editingProduct, sale_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-sm text-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Mevcut Stok</label>
                  <input
                    type="number"
                    value={editingProduct.stock_quantity || 0}
                    onChange={e => setEditingProduct({ ...editingProduct, stock_quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-600 block mb-1">Kritik Eşik</label>
                  <input
                    type="number"
                    value={editingProduct.critical_level || 5}
                    onChange={e => setEditingProduct({ ...editingProduct, critical_level: parseInt(e.target.value) || 5 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-600 block mb-1">Birim</label>
                  <select
                    value={editingProduct.unit || 'Adet'}
                    onChange={e => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="Adet">Adet</option>
                    <option value="Kg">Kg (Tartımlı)</option>
                    <option value="Gram">Gram</option>
                    <option value="Litre">Litre</option>
                    <option value="Metre">Metre</option>
                    <option value="Paket">Paket</option>
                    <option value="Koli">Koli</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-600 block mb-1">
                    Terazi PLU
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder={editingProduct.unit === 'Kg' ? 'Oto (1001)' : '4 Hane'}
                    value={editingProduct.plu_code || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, plu_code: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm"
                    title="Tartımlı ürünler için tek seferlik 4 haneli terazi kodu"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 font-semibold rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Wizard Modal */}
      <ImportWizardModal
        isOpen={importWizardOpen}
        storeId={storeId}
        onClose={() => setImportWizardOpen(false)}
        onSuccess={() => {
          setImportWizardOpen(false);
          fetchProducts();
        }}
      />

      {/* Supplier Order Modal */}
      <SupplierOrderModal
        isOpen={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        storeId={storeId}
        storeName={storeName}
      />
    </div>
  );
}
