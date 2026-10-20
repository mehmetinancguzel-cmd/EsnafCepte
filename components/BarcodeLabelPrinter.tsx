'use client';

import React, { useState, useEffect } from 'react';
import { Printer, CheckSquare, Square, Filter, Sparkles, Tag, ArrowLeft } from 'lucide-react';

interface Product {
  id: number;
  barcode: string;
  name: string;
  category: string;
  variant?: string;
  sale_price: number;
  stock_quantity: number;
}

// Generate simple SVG Barcode pattern from string
function BarcodeSvg({ code }: { code: string }) {
  // Simple deterministic bar pattern generator
  const bars: boolean[] = [];
  // Guard start
  bars.push(true, false, true);

  for (let i = 0; i < code.length; i++) {
    const charCode = code.charCodeAt(i);
    for (let b = 0; b < 5; b++) {
      bars.push((charCode >> b) % 2 === 1);
    }
    bars.push(false);
  }
  // Guard stop
  bars.push(true, false, true);

  return (
    <svg viewBox={`0 0 ${bars.length * 2} 40`} className="w-full h-8" preserveAspectRatio="none">
      {bars.map((isBlack, idx) =>
        isBlack ? (
          <rect key={idx} x={idx * 2} y="0" width="1.6" height="40" fill="#000000" />
        ) : null
      )}
    </svg>
  );
}

import { UserPlan } from '@/lib/db';
import { LockedFeature } from '@/lib/plans';

interface BarcodeLabelPrinterProps {
  storeId?: number;
  storeName?: string;
  userPlan?: UserPlan;
  onFeatureLocked?: (feature: LockedFeature) => void;
}

export default function BarcodeLabelPrinter({
  storeId = 1,
  storeName = 'EsnafCepte Perakende',
  userPlan = 'TRIAL',
  onFeatureLocked,
}: BarcodeLabelPrinterProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('TÜMÜ');
  const [labelFormat, setLabelFormat] = useState<'A4_24' | 'A4_40' | 'THERMAL'>('A4_24');
  const [customStoreName, setCustomStoreName] = useState(storeName);
  const [showStoreName, setShowStoreName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [printCopies, setPrintCopies] = useState<number>(1);
  const [inPrintMode, setInPrintMode] = useState(false);

  useEffect(() => {
    setCustomStoreName(storeName);
  }, [storeName]);

  useEffect(() => {
    fetch(`/api/products?storeId=${storeId}`)
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        if (Array.isArray(data)) {
          setSelectedIds(data.slice(0, 8).map(p => p.id));
        }
      })
      .catch(console.error);
  }, [storeId]);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const selectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => p.id));
    }
  };

  const [searchTerm, setSearchTerm] = useState('');

  // Extract real dynamic categories from the store's actual products
  const dynamicCategories = ['TÜMÜ', ...Array.from(new Set(products.map(p => p.category?.trim()).filter(Boolean)))];

  const filteredProducts = products.filter(p => {
    const matchesCategory =
      categoryFilter === 'TÜMÜ' || p.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesSearch =
      !searchTerm.trim() ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm) ||
      (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const selectedProducts = products.filter(p => selectedIds.includes(p.id));

  // Duplicated list according to print copies
  const printItems: Product[] = [];
  selectedProducts.forEach(p => {
    for (let i = 0; i < printCopies; i++) {
      printItems.push(p);
    }
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Print-Only CSS Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-label-sheet, #printable-label-sheet * {
            visibility: visible;
          }
          #printable-label-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 5mm;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Screen Controls Header (Hidden in Print) */}
      <div className="no-print bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Tag className="w-6 h-6 text-indigo-600" /> Toplu Raf & Barkod Etiketi Basma
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ürünleriniz için A4 etiket sayfasına (24'lü / 40'lı) veya termal yazıcıya hazır etiketler basın.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={selectedProducts.length === 0}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Etiketleri Yazdır / PDF ({printItems.length} Adet)
            </button>
          </div>
        </div>

        {/* Configuration Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          
          <div>
            <label className="font-bold text-slate-600 block mb-1">Etiket Formatı</label>
            <select
              value={labelFormat}
              onChange={e => {
                const val = e.target.value as any;
                if (val === 'THERMAL' && userPlan === 'STARTER') {
                  onFeatureLocked?.('THERMAL_LABELS');
                  return;
                }
                setLabelFormat(val);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            >
              <option value="A4_24">A4 Sayfada 24'lü Etiket (3x8 - Standart Raf)</option>
              <option value="A4_40">A4 Sayfada 40'lı Etiket (4x10 - Küçük Parça)</option>
              <option value="THERMAL">
                {userPlan === 'STARTER' ? '🔒 Termal Tekli Rulo (50x30 mm - Büyüyen Esnaf)' : 'Termal Tekli Rulo (50x30 mm)'}
              </option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">Dükkan Başlığı</label>
            <input
              type="text"
              value={customStoreName}
              onChange={e => setCustomStoreName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">Her Üründen Kaç Kopya?</label>
            <input
              type="number"
              min="1"
              max="50"
              value={printCopies}
              onChange={e => setPrintCopies(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono"
            />
          </div>

          <div className="flex flex-col justify-end space-y-1">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showStoreName}
                onChange={e => setShowStoreName(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-indigo-600"
              />
              <span className="text-slate-700">Dükkan adını göster</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showPrice}
                onChange={e => setShowPrice(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-indigo-600"
              />
              <span className="text-slate-700">Fiyatı büyük göster</span>
            </label>
          </div>

        </div>

        {/* Product Selection Bar */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold text-slate-700 flex items-center gap-1"
            >
              {selectedIds.length === filteredProducts.length ? (
                <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
              ) : (
                <Square className="w-3.5 h-3.5 text-slate-400" />
              )}
              {selectedIds.length === filteredProducts.length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
            </button>
            <span className="text-slate-500 font-medium">
              {selectedIds.length} / {products.length} ürün seçildi ({printItems.length} etiket basılacak)
            </span>
          </div>

          {/* Dynamic Categories & Search Bar (Customer Controlled) */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Ürün adı, barkod veya kategori ara..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44 sm:w-56"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1">
              {dynamicCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors text-xs ${
                    categoryFilter === cat ? 'bg-slate-900 text-white font-bold' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Screen Selection Checkbox Pills (Hidden in Print) */}
      <div className="no-print bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Basılacak Ürünleri Seçin:</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
          {filteredProducts.map(p => {
            const isSelected = selectedIds.includes(p.id);
            return (
              <div
                key={p.id}
                onClick={() => toggleSelect(p.id)}
                className={`p-2 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                  isSelected
                    ? 'bg-indigo-50/70 border-indigo-500 text-indigo-900 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="truncate pr-2">
                  <div className="truncate font-bold">{p.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">
                    {p.barcode} {p.variant ? `(${p.variant})` : ''}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="font-mono font-bold text-emerald-600">{p.sale_price} ₺</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Printable Sheet View (Printed when Ctrl+P or button clicked) */}
      <div className="bg-slate-200 p-4 sm:p-8 rounded-2xl flex justify-center overflow-x-auto shadow-inner">
        
        <div
          id="printable-label-sheet"
          className={`bg-white shadow-xl border border-slate-300 p-4 transition-all ${
            labelFormat === 'THERMAL' ? 'w-[360px]' : 'w-full max-w-[850px] min-h-[1100px]'
          }`}
        >
          {printItems.length === 0 ? (
            <div className="py-24 text-center text-slate-400 text-sm">
              Yukarıdan etiket basmak istediğiniz ürünleri seçin.
            </div>
          ) : (
            <div
              className={`grid gap-2 sm:gap-3 ${
                labelFormat === 'A4_40'
                  ? 'grid-cols-4'
                  : labelFormat === 'A4_24'
                  ? 'grid-cols-3'
                  : 'grid-cols-1'
              }`}
            >
              {printItems.map((p, idx) => (
                <div
                  key={idx}
                  className="border-2 border-dashed border-slate-400 rounded-lg p-2.5 flex flex-col justify-between text-center bg-white page-break-inside-avoid"
                  style={{ minHeight: labelFormat === 'A4_40' ? '90px' : '115px' }}
                >
                  {showStoreName && (
                    <div className="text-[9px] uppercase tracking-wider font-extrabold text-slate-700 truncate border-b border-slate-200 pb-0.5">
                      {customStoreName || 'EsnafCepte'}
                    </div>
                  )}

                  <div className="py-1">
                    <div className="font-bold text-[11px] text-slate-900 leading-tight line-clamp-2">
                      {p.name}
                    </div>
                    {p.variant && (
                      <div className="text-[9px] font-semibold text-slate-500 mt-0.5 truncate">
                        {p.variant}
                      </div>
                    )}
                  </div>

                  {showPrice && (
                    <div className="text-base sm:text-lg font-black font-mono text-black leading-none my-0.5">
                      {p.sale_price.toFixed(2)} ₺
                    </div>
                  )}

                  <div className="mt-1">
                    <BarcodeSvg code={p.barcode} />
                    <div className="text-[9px] font-mono tracking-widest text-slate-800 font-bold mt-0.5">
                      {p.barcode}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
