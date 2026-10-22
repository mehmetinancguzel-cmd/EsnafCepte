'use client';

import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Send,
  Download,
  X,
  CheckCircle,
  Building2,
  User,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import { createEArchiveInvoice } from '@/lib/earchive';

interface InvoiceItem {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  kdv_rate?: number; // 1, 10, 20
}

interface EArchiveInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeName?: string;
  storeCompanyTitle?: string;
  storeTaxId?: string;
  storeTaxOffice?: string;
  storeMersisNo?: string;
  storePhone?: string;
  storeAddress?: string;
  saleCode?: string;
  totalAmount?: number;
  items?: InvoiceItem[];
  customerName?: string;
  customerPhone?: string;
}

export default function EArchiveInvoiceModal({
  isOpen,
  onClose,
  storeName = 'EsnafCepte Perakende',
  storeCompanyTitle = '',
  storeTaxId = '1234567890',
  storeTaxOffice = 'Vergi Dairesi',
  storeMersisNo = '',
  storePhone = '0850 123 45 67',
  storeAddress = 'İnanoraSoft Cad. No:12/A İstanbul',
  saleCode = 'SLS-10492',
  totalAmount = 0,
  items = [],
  customerName = '',
  customerPhone = '',
}: EArchiveInvoiceModalProps) {
  const [customerType, setCustomerType] = useState<'BIREYSEL' | 'KURUMSAL'>('BIREYSEL');
  const [buyerName, setBuyerName] = useState(customerName || 'Nihai Tüketici');
  const [buyerTaxId, setBuyerTaxId] = useState(customerType === 'BIREYSEL' ? '11111111111' : '');
  const [taxOffice, setTaxOffice] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('Türkiye');
  const [invoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [invoiceTime] = useState(() => new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
  const [invoiceNo] = useState(() => `EAC2026${Math.floor(100000000 + Math.random() * 900000000).toString().slice(0, 9)}`);

  React.useEffect(() => {
    if (customerName) setBuyerName(customerName);
  }, [customerName]);

  if (!isOpen) return null;

  // KDV ve Matrah Hesaplamaları (Varsayılan genel perakende %10 ve %20 ortalaması)
  const defaultItems: InvoiceItem[] =
    items.length > 0
      ? items
      : [
          {
            name: 'Genel Perakende Satış Kalemi',
            quantity: 1,
            unit_price: totalAmount,
            total_price: totalAmount,
            kdv_rate: 10,
          },
        ];

  const subtotalWithoutTax = defaultItems.reduce((sum, it) => {
    const rate = it.kdv_rate ?? 10;
    const base = it.total_price / (1 + rate / 100);
    return sum + base;
  }, 0);

  const totalKdv = totalAmount - subtotalWithoutTax;

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsapp = () => {
    const text =
`📄 *[E-ARŞİV FATURA BİLGİLENDİRMESİ]*
🏪 *Satıcı:* ${storeName}
🧾 *Fatura No:* ${invoiceNo}
📅 *Düzenleme Tarihi:* ${invoiceDate} - ${invoiceTime}
━━━━━━━━━━━━━━━━━━
👤 *Alıcı:* ${buyerName}
🆔 *TCKN/VKN:* ${buyerTaxId}
💰 *KDV Hariç Tutar:* ₺${subtotalWithoutTax.toFixed(2)}
📊 *Toplam KDV:* ₺${totalKdv.toFixed(2)}
⭐ *GENEL TOPLAM:* ₺${totalAmount.toFixed(2)}
━━━━━━━━━━━━━━━━━━
_Faturanız 509 Sıra No.lu VUK Genel Tebliği uyarınca elektronik ortamda düzenlenmiştir._
_EsnafCepte • İnanoraSoft Dijital Fatura_`;

    const cleanPhone = (customerPhone || '').replace(/\D/g, '');
    const waUrl = cleanPhone
      ? `https://wa.me/90${cleanPhone.slice(-10)}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Modal Top Bar */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Resmi e-Arşiv Fatura Taslağı (GİB Uyumlu)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const res = createEArchiveInvoice({
                  issueDate: invoiceDate,
                  issueTime: '12:00:00',
                  invoiceType: 'SATIS',
                  currency: 'TRY',
                  seller: {
                    vknTckn: storeTaxId || '1234567890',
                    title: storeCompanyTitle || storeName,
                    taxOffice: storeTaxOffice || 'Vergi Dairesi',
                    address: storeAddress,
                    phone: storePhone,
                  },
                  buyer: {
                    vknTckn: buyerTaxId || '11111111111',
                    title: buyerName || 'Nihai Tüketici',
                    address: buyerAddress,
                    phone: customerPhone,
                  },
                  items: defaultItems.map(it => ({
                    name: it.name,
                    quantity: it.quantity,
                    unit: 'Adet',
                    unitPrice: it.unit_price,
                    kdvRate: (it.kdv_rate || 10) as 1 | 10 | 20,
                  })),
                });

                const blob = new Blob([res.ublXml], { type: 'application/xml' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${res.invoiceNo}_UBL_TR.xml`;
                a.click();
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              title="GİB Uyumlu UBL-TR 2.1 Resmi XML İndir"
            >
              <Download className="w-3.5 h-3.5" /> UBL-TR XML
            </button>
            <button
              onClick={handleSendWhatsapp}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" /> WhatsApp
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" /> Yazdır / PDF
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Customer / Tax Form (No-Print controls) */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 space-y-3 no-print text-xs">
          <div className="flex items-center gap-4">
            <label className="font-bold text-slate-700">Müşteri Tipi:</label>
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
              <input
                type="radio"
                name="customerType"
                checked={customerType === 'BIREYSEL'}
                onChange={() => {
                  setCustomerType('BIREYSEL');
                  setBuyerTaxId('11111111111');
                }}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <span>Bireysel (TCKN)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
              <input
                type="radio"
                name="customerType"
                checked={customerType === 'KURUMSAL'}
                onChange={() => {
                  setCustomerType('KURUMSAL');
                  setBuyerTaxId('');
                }}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <span>Kurumsal / Şirket (VKN)</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div className="sm:col-span-2">
              <label className="block text-slate-500 font-semibold mb-1">
                {customerType === 'BIREYSEL' ? 'Müşteri Ad Soyad' : 'Şirket Resmi Unvanı'}
              </label>
              <input
                type="text"
                value={buyerName}
                onChange={e => setBuyerName(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                {customerType === 'BIREYSEL' ? 'TC Kimlik No (11 Hane)' : 'Vergi Kimlik No (10 Hane)'}
              </label>
              <input
                type="text"
                maxLength={customerType === 'BIREYSEL' ? 11 : 10}
                value={buyerTaxId}
                onChange={e => setBuyerTaxId(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-800"
                placeholder={customerType === 'BIREYSEL' ? '11111111111' : 'Vergi No'}
              />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Vergi Dairesi</label>
              <input
                type="text"
                value={taxOffice}
                onChange={e => setTaxOffice(e.target.value)}
                placeholder="Örn: Beyoğlu V.D."
                className="w-full p-2 bg-white border border-slate-200 rounded-xl text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Official GİB e-Archive Invoice Canvas (Printable Area) */}
        <div className="p-6 sm:p-8 bg-white text-slate-800 text-[11px] leading-normal font-sans border-t border-slate-100">
          {/* Official Invoice Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="text-xl font-black text-slate-900 tracking-tight">{storeName}</div>
              <div className="text-slate-500 text-[11px] mt-0.5">{storeAddress}</div>
              <div className="text-slate-500 text-[11px]">Tel: {storePhone}</div>
              <div className="text-slate-600 font-semibold mt-1">İnanoraSoft Perakende Bulut Sistemi</div>
            </div>

            {/* GİB e-Arşiv Badge */}
            <div className="text-right flex flex-col items-end">
              <div className="inline-block px-3 py-1 bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-md">
                e-Arşiv Fatura
              </div>
              <div className="mt-2 font-mono font-bold text-sm text-slate-900">
                Fatura No: {invoiceNo}
              </div>
              <div className="text-slate-500 text-[11px]">
                Tarih: {invoiceDate} • Saat: {invoiceTime}
              </div>
              <div className="text-slate-400 text-[10px]">
                Fiş / Sipariş Kodu: {saleCode}
              </div>
            </div>
          </div>

          {/* Buyer & Seller Info Box */}
          <div className="grid grid-cols-2 gap-4 border border-slate-300 rounded-xl p-3.5 mb-5 bg-slate-50/50">
            <div>
              <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-1.5 uppercase text-[10px] tracking-wider text-slate-500">
                SAYIN (ALICI BİLGİLERİ)
              </div>
              <div className="font-bold text-slate-800 text-xs">{buyerName}</div>
              <div className="text-slate-600 mt-0.5">
                <strong>{customerType === 'BIREYSEL' ? 'TCKN:' : 'VKN:'}</strong> {buyerTaxId || 'Belirtilmedi'}
              </div>
              {taxOffice && <div className="text-slate-600"><strong>Vergi Dairesi:</strong> {taxOffice}</div>}
              <div className="text-slate-500">{buyerAddress}</div>
            </div>

            <div className="border-l border-slate-200 pl-4">
              <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-1.5 uppercase text-[10px] tracking-wider text-slate-500">
                DÜZENLEYEN (SATICI BİLGİLERİ)
              </div>
              <div className="font-bold text-slate-800">{storeCompanyTitle || storeName}</div>
              <div className="text-slate-600 mt-0.5"><strong>VKN/TCKN:</strong> {storeTaxId || '1234567890'}</div>
              <div className="text-slate-600"><strong>Vergi Dairesi:</strong> {storeTaxOffice || 'Vergi Dairesi'}</div>
              {storeMersisNo && <div className="text-slate-500">Mersis: {storeMersisNo}</div>}
              <div className="text-slate-500 text-[11px] mt-0.5">{storeAddress}</div>
            </div>
          </div>

          {/* Product Items Table */}
          <div className="border border-slate-300 rounded-xl overflow-hidden mb-4">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-300">
                <tr>
                  <th className="py-2 px-3">Sıra</th>
                  <th className="py-2 px-3">Mal / Hizmet Açıklaması</th>
                  <th className="py-2 px-2 text-center">Miktar</th>
                  <th className="py-2 px-2 text-right">Birim Fiyat</th>
                  <th className="py-2 px-2 text-center">KDV %</th>
                  <th className="py-2 px-3 text-right">Tutar (KDV Dahil)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {defaultItems.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{it.name}</td>
                    <td className="py-2 px-2 text-center font-mono">{it.quantity}</td>
                    <td className="py-2 px-2 text-right font-mono">₺{it.unit_price.toFixed(2)}</td>
                    <td className="py-2 px-2 text-center font-mono font-semibold text-slate-600">
                      %{it.kdv_rate || 10}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      ₺{it.total_price.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Tax Summary */}
          <div className="flex justify-between items-start gap-4 mb-4">
            {/* QR Code and Disclaimer */}
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-center p-1">
                <QrCode className="w-12 h-12 text-slate-800" />
              </div>
              <div className="text-[10px] text-slate-500 max-w-[280px]">
                Bu belge 213 sayılı V.U.K. hükümlerine göre Gelir İdaresi Başkanlığı (GİB) e-Arşiv Fatura standartlarında düzenlenmiştir.
              </div>
            </div>

            {/* Calculations Box */}
            <div className="w-64 bg-slate-50 border border-slate-300 rounded-xl p-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Mal/Hizmet Toplamı:</span>
                <span className="font-mono">₺{subtotalWithoutTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Hesaplanan KDV (%10):</span>
                <span className="font-mono">₺{totalKdv.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-900 border-t border-slate-300 pt-1.5 mt-1">
                <span>Ödenecek Tutar:</span>
                <span className="font-mono text-emerald-700">₺{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Legal Footer Note */}
          <div className="border-t border-slate-200 pt-3 text-[10px] text-slate-400 text-center">
            EsnafCepte Dijital Perakende Otomasyonu • İnanoraSoft Yazılım Teknolojileri A.Ş. güvencesiyle oluşturulmuştur.
          </div>
        </div>
      </div>
    </div>
  );
}
