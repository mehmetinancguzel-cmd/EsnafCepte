'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Scale,
  X,
  Plus,
  Minus,
  CheckCircle,
  Search,
  Barcode,
  ShoppingBag,
  Zap,
  Cable,
  Check,
} from 'lucide-react';
import { SerialScaleDriver } from '@/lib/serial-scale';

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

interface ScaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddToCart: (product: Product, weightKg: number) => void;
  initialProduct?: Product | null;
}

export default function ScaleModal({
  isOpen,
  onClose,
  products,
  onAddToCart,
  initialProduct = null,
}: ScaleModalProps) {
  // Filter products that are sold by weight (unit 'Kg' or category Manav/Şarküteri/Kuruyemiş)
  const weighedProducts = products.filter(
    p =>
      p.unit.toLowerCase() === 'kg' ||
      p.unit.toLowerCase() === 'kilo' ||
      ['manav', 'şarküteri', 'sarkuteri', 'kuruyemiş', 'kuruyemis', 'kasap', 'bakliyat'].includes(
        p.category.toLowerCase()
      ) ||
      p.barcode.startsWith('27') ||
      p.barcode.startsWith('28') ||
      p.barcode.startsWith('001')
  );

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [weightKg, setWeightKg] = useState<number>(1.0);
  const [search, setSearch] = useState('');
  const [isStable, setIsStable] = useState(true);
  const [scaleConnected, setScaleConnected] = useState(false);
  const [scaleConnecting, setScaleConnecting] = useState(false);
  const scaleDriverRef = useRef<SerialScaleDriver | null>(null);

  useEffect(() => {
    return () => {
      if (scaleDriverRef.current) {
        scaleDriverRef.current.disconnect();
      }
    };
  }, []);

  const handleConnectScale = async () => {
    if (scaleConnected) {
      if (scaleDriverRef.current) {
        await scaleDriverRef.current.disconnect();
      }
      setScaleConnected(false);
      return;
    }

    setScaleConnecting(true);
    try {
      const driver = new SerialScaleDriver();
      scaleDriverRef.current = driver;

      driver.onWeight((reading) => {
        setWeightKg(reading.weightKg);
        setIsStable(reading.isStable);
      });

      const success = await driver.connect(9600, 'CAS');
      if (success) {
        setScaleConnected(true);
      }
    } catch (e: any) {
      alert(e.message || 'Fiziki teraziye bağlanılamadı.');
    } finally {
      setScaleConnecting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (initialProduct) {
        setSelectedProduct(initialProduct);
      } else if (weighedProducts.length > 0) {
        setSelectedProduct(weighedProducts[0]);
      } else if (products.length > 0) {
        setSelectedProduct(products[0]);
      }
      setWeightKg(1.0);
      setSearch('');
    }
  }, [isOpen, initialProduct]);

  if (!isOpen) return null;

  const currentPrice = selectedProduct?.sale_price || 0;
  const totalPrice = parseFloat((currentPrice * weightKg).toFixed(2));

  // Generates 13-digit EAN-13 Scale Barcode preview (27 PPPPP GGGGG C)
  const generateScaleBarcode = () => {
    if (!selectedProduct) return '';
    const itemCode = (selectedProduct.barcode.replace(/\D/g, '') || '00101').slice(-5).padStart(5, '0');
    const gramStr = Math.round(weightKg * 1000).toString().padStart(5, '0');
    return `27${itemCode}${gramStr}5`;
  };

  const handleConfirm = () => {
    if (!selectedProduct) return;
    if (weightKg <= 0) {
      alert('Lütfen geçerli bir ağırlık girin.');
      return;
    }
    onAddToCart(selectedProduct, weightKg);
    onClose();
  };

  const quickWeights = [
    { label: '100 gr', val: 0.1 },
    { label: '250 gr', val: 0.25 },
    { label: '500 gr', val: 0.5 },
    { label: '750 gr', val: 0.75 },
    { label: '1.00 Kg', val: 1.0 },
    { label: '1.25 Kg', val: 1.25 },
    { label: '1.50 Kg', val: 1.5 },
    { label: '2.00 Kg', val: 2.0 },
    { label: '3.00 Kg', val: 3.0 },
    { label: '5.00 Kg', val: 5.0 },
  ];

  const filteredProducts = weighedProducts.filter(
    p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-900 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Terazi & Tartım Ekranı</h3>
              <p className="text-xs text-emerald-100">Gramajlı / Kilo ile satılan ürünler ve terazi entegrasyonu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 max-h-[85vh] overflow-y-auto space-y-5 text-xs">
          {/* Physical Serial Scale Connector Bar */}
          <div className="flex items-center justify-between bg-slate-100 p-2.5 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${scaleConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span className="font-bold text-slate-700">
                {scaleConnected ? 'Fiziki Terazi Bağlı (Canlı Veri Akışı Aktif)' : 'Fiziki Terazi (COM/RS-232/USB)'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleConnectScale}
              disabled={scaleConnecting}
              className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1.5 ${
                scaleConnected
                  ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
              }`}
            >
              <Cable className="w-3.5 h-3.5" />
              {scaleConnecting ? 'Bağlanıyor...' : scaleConnected ? 'Bağlantıyı Kes' : '🔌 Teraziye Bağlan'}
            </button>
          </div>

          {/* Real-time Digital Scale Display (Bizerba/CAS style LED) */}
          <div className="bg-slate-950 p-4 rounded-2xl border-2 border-slate-800 shadow-inner text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* LED Screen */}
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-4xl sm:text-5xl font-black text-emerald-400 tracking-wider">
                {weightKg.toFixed(3)}
              </span>
              <span className="text-xl font-bold text-emerald-500 font-mono">KG</span>
              <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                {isStable ? '● DENGELİ (STABLE)' : '○ HAREKETLİ'}
              </span>
            </div>

            {/* Price Calculations in Scale */}
            <div className="text-right">
              <div className="text-slate-400 text-[11px]">Birim Fiyat: ₺{currentPrice.toFixed(2)} / Kg</div>
              <div className="text-2xl font-black font-mono text-amber-300 mt-0.5">
                ₺{totalPrice.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Terazi Kodu: {generateScaleBarcode()}
              </div>
            </div>
          </div>

          {/* Quick Weight Adjuster & Keypad */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700">Tartılan Ağırlığı Ayarlayın:</label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setWeightKg(0)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold"
                >
                  Sıfırla (Zero)
                </button>
                <button
                  type="button"
                  onClick={() => setWeightKg(prev => Math.max(0.05, parseFloat((prev - 0.1).toFixed(3))))}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold"
                >
                  -100 gr
                </button>
                <button
                  type="button"
                  onClick={() => setWeightKg(prev => parseFloat((prev + 0.1).toFixed(3)))}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold"
                >
                  +100 gr
                </button>
              </div>
            </div>

            {/* Quick Weight Presets */}
            <div className="grid grid-cols-5 gap-1.5">
              {quickWeights.map(w => (
                <button
                  key={w.label}
                  type="button"
                  onClick={() => setWeightKg(w.val)}
                  className={`py-2 rounded-xl font-bold font-mono text-xs transition-all border ${
                    weightKg === w.val
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>

            {/* Manual custom weight input */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-slate-500 font-medium">Manuel Gramaj Gir:</span>
              <input
                type="number"
                step="0.005"
                min="0.01"
                value={weightKg}
                onChange={e => setWeightKg(Math.max(0.01, parseFloat(e.target.value) || 0))}
                className="w-32 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-slate-500 font-bold">Kg</span>
            </div>
          </div>

          {/* Product Selection List */}
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700">
                Tartılacak Ürünü Seçin ({weighedProducts.length} Terazi Ürünü):
              </label>
              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Elma, peynir, ceviz..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
              {filteredProducts.map(p => {
                const isSelected = selectedProduct?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-800 text-xs">{p.name}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono">{p.barcode}</span>
                        <span>•</span>
                        <span>{p.category}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-emerald-700 text-xs">
                        ₺{p.sale_price.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400">/ {p.unit}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] text-slate-500">Seçilen:</div>
              <div className="font-bold text-slate-800 text-sm">
                {selectedProduct ? selectedProduct.name : 'Ürün seçiniz'} ({weightKg} Kg)
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!selectedProduct || weightKg <= 0}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 text-sm"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Sepete Ekle (₺{totalPrice.toFixed(2)})</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
