'use client';

import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Download, RefreshCw, X } from 'lucide-react';

interface ImportWizardModalProps {
  isOpen: boolean;
  storeId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportWizardModal({ isOpen, storeId = 1, onClose, onSuccess }: ImportWizardModalProps) {
  const [fileContent, setFileContent] = useState<string>('');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ createdCount: number; updatedCount: number; errors: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFileContent(text);
      parseCSV(text);
    };
    reader.readAsText(file, 'utf-8');
  };

  const handlePasteChange = (text: string) => {
    setFileContent(text);
    parseCSV(text);
  };

  const parseCSV = (csvText: string) => {
    setError(null);
    setResult(null);
    try {
      const lines = csvText.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) {
        setParsedData([]);
        return;
      }

      // Detect separator: comma or semicolon or tab
      const firstLine = lines[0];
      let sep = ',';
      if (firstLine.includes(';') && (firstLine.match(/;/g) || []).length >= (firstLine.match(/,/g) || []).length) {
        sep = ';';
      } else if (firstLine.includes('\t')) {
        sep = '\t';
      }

      const headers = firstLine.split(sep).map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());

      // Find indices
      const barcodeIdx = headers.findIndex(h => h.includes('barkod') || h.includes('barcode') || h.includes('kod'));
      const nameIdx = headers.findIndex(h => h.includes('ad') || h.includes('isim') || h.includes('ürün') || h.includes('name'));
      const catIdx = headers.findIndex(h => h.includes('kat') || h.includes('category'));
      const varIdx = headers.findIndex(h => h.includes('var') || h.includes('beden') || h.includes('renk'));
      const costIdx = headers.findIndex(h => h.includes('al') || h.includes('maliyet') || h.includes('cost'));
      const saleIdx = headers.findIndex(h => h.includes('sat') || h.includes('fiyat') || h.includes('price'));
      const qtyIdx = headers.findIndex(h => h.includes('stok') || h.includes('adet') || h.includes('miktar') || h.includes('qty'));
      const critIdx = headers.findIndex(h => h.includes('krit') || h.includes('esik'));
      const unitIdx = headers.findIndex(h => h.includes('birim') || h.includes('unit'));

      const products: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(sep).map(p => p.trim().replace(/^"|"$/g, ''));
        if (parts.length < 2) continue;

        const barcode = barcodeIdx !== -1 ? parts[barcodeIdx] : parts[0];
        const name = nameIdx !== -1 ? parts[nameIdx] : parts[1];

        if (!barcode || !name) continue;

        products.push({
          barcode: barcode,
          name: name,
          category: catIdx !== -1 ? parts[catIdx] : 'Diğer',
          variant: varIdx !== -1 ? parts[varIdx] : '',
          cost_price: costIdx !== -1 ? parseFloat(parts[costIdx].replace(',', '.')) || 0 : 0,
          sale_price: saleIdx !== -1 ? parseFloat(parts[saleIdx].replace(',', '.')) || 0 : 0,
          stock_quantity: qtyIdx !== -1 ? parseInt(parts[qtyIdx]) || 0 : 0,
          critical_level: critIdx !== -1 ? parseInt(parts[critIdx]) || 5 : 5,
          unit: unitIdx !== -1 ? parts[unitIdx] : 'Adet',
        });
      }

      setParsedData(products);
    } catch (err: any) {
      setError('CSV ayrıştırılırken hata oluştu: ' + err.message);
    }
  };

  const handleDownloadTemplate = () => {
    const template = 'Barkod,UrunAdi,Kategori,Varyant,AlisFiyati,SatisFiyati,MevcutStok,KritikEsik,Birim\n8690000000001,DMC Nakış İpliği,Tuhafiye,Renk #310 Siyah,15.50,30.00,50,10,Adet\n8690000000002,Modal Erkek Boxer,İç Giyim,L / Siyah,70.00,140.00,25,5,Adet\n8690000000003,Spiralli Defter A4,Kırtasiye,Kareli 80Yp,30.00,60.00,40,8,Adet';
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ornek_stok_sablonu.csv';
    a.click();
  };

  const handleImportSubmit = async () => {
    if (parsedData.length === 0) {
      alert('İçe aktarılacak ürün bulunamadı!');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: storeId,
          products: parsedData,
          updateExisting,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'İçe aktarım başarısız oldu');
      }

      const resData = await res.json();
      setResult(resData);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl space-y-5 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">1000+ Ürün İçe Aktarma Sihirbazı</h3>
              <p className="text-xs text-slate-400">Excel veya CSV listenizi yükleyerek tüm ürünleri tek tıkla sisteme aktarın.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Steps */}
        {!result ? (
          <div className="space-y-4">
            
            {/* Top Helper Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
              <span className="text-slate-600">
                💡 <strong>İpucu:</strong> Sütun sırası fark etmez. Sistem Barkod, Ürün Adı, Fiyat vb. başlıkları otomatik tanır.
              </span>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:border-emerald-500 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" /> Örnek CSV İndir
              </button>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center transition-colors bg-slate-50/50">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">CSV dosyanızı seçin veya buraya sürükleyin</p>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="mt-2 text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
              />
            </div>

            {/* Direct Paste Area */}
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">
                VEYA Excel'den Kopyalayıp Buraya Yapıştırın:
              </label>
              <textarea
                rows={3}
                placeholder="Barkod,Ürün Adı,Kategori,Varyant,Alış,Satış,Stok..."
                value={fileContent}
                onChange={e => handlePasteChange(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Options */}
            <div className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                id="updateExisting"
                checked={updateExisting}
                onChange={e => setUpdateExisting(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <label htmlFor="updateExisting" className="text-slate-700 font-medium">
                Mevcut olan barkodları yeni fiyat ve stok bilgileriyle güncelle
              </label>
            </div>

            {/* Preview Box */}
            {parsedData.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>Önizleme ({parsedData.length} Ürün Bulundu):</span>
                  <span className="text-emerald-600">İlk 5 Satır Gösteriliyor</span>
                </div>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-500 sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Barkod</th>
                        <th className="py-2 px-3">Ürün Adı</th>
                        <th className="py-2 px-2">Varyant</th>
                        <th className="py-2 px-2 text-right">Satış</th>
                        <th className="py-2 px-2 text-center">Stok</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {parsedData.slice(0, 5).map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-1.5 px-3 font-mono">{p.barcode}</td>
                          <td className="py-1.5 px-3 font-bold">{p.name}</td>
                          <td className="py-1.5 px-2 text-purple-600">{p.variant || '-'}</td>
                          <td className="py-1.5 px-2 text-right font-mono">{p.sale_price} ₺</td>
                          <td className="py-1.5 px-2 text-center font-mono">{p.stock_quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Buttons */}
            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 text-slate-600 font-semibold rounded-xl text-xs"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={loading || parsedData.length === 0}
                onClick={handleImportSubmit}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {parsedData.length} Ürünü Stoğa Aktar
              </button>
            </div>

          </div>
        ) : (
          /* Result Summary */
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-800">İçe Aktarım Başarıyla Tamamlandı!</h4>
              <p className="text-xs text-slate-500 mt-1">
                <strong>{result.createdCount}</strong> adet yeni ürün eklendi,{' '}
                <strong>{result.updatedCount}</strong> adet ürün güncellendi.
              </p>
            </div>

            {result.errors.length > 0 && (
              <div className="text-left bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-800 max-h-32 overflow-y-auto">
                <div className="font-bold mb-1">Uyarılar / Atlanan Satırlar:</div>
                {result.errors.map((e, idx) => (
                  <div key={idx}>• {e}</div>
                ))}
              </div>
            )}

            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md"
            >
              Kapat ve Ürünleri İncele
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
