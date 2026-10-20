'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  UserCheck,
  Send,
  Printer,
  CheckCircle,
  AlertTriangle,
  X,
  Banknote,
  Receipt,
} from 'lucide-react';

interface ShiftHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: number;
  storeName?: string;
}

export default function ShiftHandoverModal({
  isOpen,
  onClose,
  storeId,
  storeName = 'EsnafCepte',
}: ShiftHandoverModalProps) {
  const [cashierName, setCashierName] = useState('Gündüz Kasiyeri');
  const [receiverName, setReceiverName] = useState('Akşam Kasiyeri');
  const [countedCash, setCountedCash] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadShiftData();
    }
  }, [isOpen, storeId]);

  const loadShiftData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/z-report?storeId=${storeId}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
        setCountedCash(data.theoreticalCash ? String(data.theoreticalCash) : '0');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const countedNum = parseFloat(countedCash) || 0;
  const theoretical = report?.theoreticalCash || 0;
  const difference = countedNum - theoretical;

  const handleSendWhatsappHandover = () => {
    if (!report) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('tr-TR');

    const text =
`⏱️ *[KASİYER VARDIYA DEVİR TUTANAĞI]*
🏪 *Dükkan:* ${storeName}
👤 *Devreden Kasiyer:* ${cashierName}
👥 *Devralan Kasiyer:* ${receiverName}
📅 *Tarih & Saat:* ${dateStr} - ${timeStr}
━━━━━━━━━━━━━━━━━━
🧾 *Vardiya Fiş Sayısı:* ${report.salesCount} adet
💰 *Toplam Satış Cirosu:* ₺${report.totalNetSales.toFixed(2)}
💵 *Nakit Satış:* ₺${report.cashSales.toFixed(2)}
💳 *Kredi Kartı (POS):* ₺${report.cardSales.toFixed(2)}
📒 *Veresiye Satış:* ₺${report.veresiyeSales.toFixed(2)}
💸 *Vardiya İçi Masraflar:* ₺${report.totalExpenses.toFixed(2)}
━━━━━━━━━━━━━━━━━━
⭐ *KASADA OLMASI GEREKEN:* ₺${theoretical.toFixed(2)}
💵 *SAYILIP DEVREDİLEN NAKİT:* ₺${countedNum.toFixed(2)}
${
  difference === 0
    ? '✅ *KASA KURUŞU KURUŞUNA TAM*'
    : difference > 0
    ? `⚠️ *KASA FAZLASI:* +₺${difference.toFixed(2)}`
    : `🚨 *KASA AÇIĞI:* -₺${Math.abs(difference).toFixed(2)}`
}
${notes ? `📝 *Not:* ${notes}\n` : ''}━━━━━━━━━━━━━━━━━━
_Her iki personel tarafından sayılarak teslim edilmiştir._`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handlePrintHandover = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Vardiya Devri & Kasa Teslimi</h3>
              <p className="text-xs text-blue-100">Personel değişiminde ara kasa mutabakat tutanağı</p>
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
        <div className="p-5 max-h-[82vh] overflow-y-auto space-y-4 text-xs">
          {loading ? (
            <div className="py-12 text-center text-slate-400">Veriler hazırlanıyor...</div>
          ) : (
            <>
              {/* Personnel Names */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    👤 Devreden Personel
                  </label>
                  <input
                    type="text"
                    value={cashierName}
                    onChange={e => setCashierName(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800"
                    placeholder="Kasiyer Adı"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    👥 Devralan Personel
                  </label>
                  <input
                    type="text"
                    value={receiverName}
                    onChange={e => setReceiverName(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800"
                    placeholder="Devralan Personel"
                  />
                </div>
              </div>

              {/* Shift Summary Metrics */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                  <div className="text-slate-400 text-[11px]">Fiş Sayısı</div>
                  <div className="font-bold text-sm text-slate-800 mt-0.5">
                    {report?.salesCount || 0} adet
                  </div>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                  <div className="text-emerald-700 text-[11px] font-semibold">Nakit Satış</div>
                  <div className="font-bold text-sm text-emerald-800 mt-0.5">
                    ₺{(report?.cashSales || 0).toFixed(2)}
                  </div>
                </div>
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl text-center">
                  <div className="text-indigo-700 text-[11px] font-semibold">Kartlı Satış</div>
                  <div className="font-bold text-sm text-indigo-800 mt-0.5">
                    ₺{(report?.cardSales || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Cash Reconciliation Box */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3 shadow-md">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Kasada Olması Gereken Teorik Nakit:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    ₺{theoretical.toFixed(2)}
                  </span>
                </div>

                <div>
                  <label className="font-bold text-slate-200 block mb-1">
                    💵 Kasiyerin Saydığı Fiili Nakit (TL)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={countedCash}
                    onChange={e => setCountedCash(e.target.value)}
                    placeholder="Kasayı sayıp tutarı girin..."
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Status Indicator */}
                <div
                  className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-between ${
                    difference === 0
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                      : difference > 0
                      ? 'bg-blue-950/80 text-blue-400 border border-blue-800'
                      : 'bg-rose-950/80 text-rose-400 border border-rose-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {difference === 0 ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                    <span>
                      {difference === 0
                        ? 'Kasa Tam (Açık Yok)'
                        : difference > 0
                        ? 'Kasa Fazlası Var'
                        : 'Kasa Açığı Var'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-sm">
                    {difference > 0 ? `+₺${difference.toFixed(2)}` : difference < 0 ? `-₺${Math.abs(difference).toFixed(2)}` : '₺0.00'}
                  </span>
                </div>
              </div>

              {/* Handover Note */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Vardiya Devir Notu (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Örn: 200 TL bozuk para çekmecede bırakıldı"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleSendWhatsappHandover}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
                >
                  <Send className="w-4 h-4" /> Patrona WhatsApp ile İlet
                </button>

                <button
                  type="button"
                  onClick={handlePrintHandover}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Yazdır
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
