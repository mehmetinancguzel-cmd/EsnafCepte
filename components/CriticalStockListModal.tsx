'use client';

import React from 'react';
import { AlertTriangle, Package, X, Send, ArrowRight } from 'lucide-react';

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

interface CriticalStockListModalProps {
  isOpen: boolean;
  onClose: () => void;
  criticalProducts: Product[];
  onOpenSupplierOrder: () => void;
}

export default function CriticalStockListModal({
  isOpen,
  onClose,
  criticalProducts,
  onOpenSupplierOrder,
}: CriticalStockListModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-amber-500 px-5 py-4 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-black/10 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-950">
                Kritik Stok Uyarı Listesi ({criticalProducts.length} Ürün)
              </h3>
              <p className="text-xs text-amber-950 font-medium">
                Belirlenen kritik eşiğin altına düşen ürünler
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-black/10 text-slate-950 font-bold transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product List */}
        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-3 text-xs">
          {criticalProducts.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              Kritik seviyede ürün bulunmuyor. Tüm stoklar yeterli!
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Ürün Adı</th>
                    <th className="py-2.5 px-2">Barkod</th>
                    <th className="py-2.5 px-2 text-center">Kritik Eşik</th>
                    <th className="py-2.5 px-3 text-right">Mevcut Stok</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {criticalProducts.map(p => {
                    const isZero = p.stock_quantity <= 0;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-800">{p.name}</div>
                          {p.variant && (
                            <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                              {p.variant}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 font-mono text-slate-400">{p.barcode}</td>
                        <td className="py-2.5 px-2 text-center font-mono text-slate-600">
                          {p.critical_level} {p.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md font-mono font-bold ${
                              isZero
                                ? 'bg-red-100 text-red-700 border border-red-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {p.stock_quantity} {p.unit}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
            >
              Kapat
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSupplierOrder();
              }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Toptancıya WhatsApp Siparişi Oluştur</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
