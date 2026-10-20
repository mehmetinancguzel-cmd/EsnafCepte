'use client';

import React, { useState, useEffect } from 'react';
import { DailyZReport } from '@/lib/db';
import {
  FileText,
  DollarSign,
  CreditCard,
  BookOpen,
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  Printer,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface DailyZReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: number;
  storeName: string;
}

export default function DailyZReportModal({
  isOpen,
  onClose,
  storeId,
  storeName,
}: DailyZReportModalProps) {
  const [report, setReport] = useState<DailyZReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [countedCash, setCountedCash] = useState<string>('');
  const [patronPhone, setPatronPhone] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadReport();
    }
  }, [isOpen, storeId]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/z-report?storeId=${storeId}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const countedVal = parseFloat(countedCash) || 0;
  const theoretical = report?.theoreticalCash || 0;
  const diff = countedCash !== '' ? countedVal - theoretical : 0;

  const handleSendWhatsapp = () => {
    if (!report) return;

    let text = report.whatsappSummaryText;
    if (countedCash !== '') {
      text += `\n━━━━━━━━━━━━━━━━━━\n💵 *Fiziki Sayılan Nakit:* ₺${countedVal.toFixed(2)}`;
      if (diff === 0) {
        text += `\n✅ *Kasa Durumu: TAM DENK (0.00 TL Fark)*`;
      } else if (diff > 0) {
        text += `\n🟢 *Kasa Durumu: +₺${diff.toFixed(2)} KASA FAZLASI*`;
      } else {
        text += `\n🔴 *Kasa Durumu: -₺${Math.abs(diff).toFixed(2)} KASA AÇIĞI*`;
      }
    }

    const cleanPhone = patronPhone.replace(/[^0-9]/g, '');
    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone.startsWith('90') ? cleanPhone : '90' + cleanPhone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            ✕
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">📊</span>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
              Gün Sonu Z Raporu & Kasa Mutabakatı
            </span>
          </div>

          <h2 className="text-2xl font-black">{storeName}</h2>
          <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tarih: {report?.date || 'Bugün'}</span>
            <span>•</span>
            <span>Toplam {report?.salesCount || 0} Fiş Kesildi</span>
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Rapor hesaplanıyor...</div>
          ) : report ? (
            <>
              {/* Ciro Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Toplam Satış</span>
                  <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
                    ₺{report.totalNetSales.toFixed(2)}
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Nakit Satış</span>
                  <div className="text-lg font-black text-emerald-700 font-mono mt-0.5">
                    ₺{report.cashSales.toFixed(2)}
                  </div>
                </div>

                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">POS / Kredi Kartı</span>
                  <div className="text-lg font-black text-blue-700 font-mono mt-0.5">
                    ₺{report.cardSales.toFixed(2)}
                  </div>
                </div>

                <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Veresiye Satış</span>
                  <div className="text-lg font-black text-purple-700 font-mono mt-0.5">
                    ₺{report.veresiyeSales.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Cash Flow Reconciliation */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Nakit Kasa Giriş / Çıkış Dengesi
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <ArrowDownLeft className="w-4 h-4 text-emerald-600" /> Nakit Satış Girişi
                    </span>
                    <span className="font-mono font-bold text-emerald-600">+₺{report.cashSales.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <ArrowDownLeft className="w-4 h-4 text-emerald-600" /> Veresiye Tahsilatları
                    </span>
                    <span className="font-mono font-bold text-emerald-600">+₺{report.collectionsCash.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <ArrowUpRight className="w-4 h-4 text-rose-600" /> Kasadan Yapılan Masraflar ({report.expensesList.length} Kalem)
                    </span>
                    <span className="font-mono font-bold text-rose-600">-₺{report.totalExpenses.toFixed(2)}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-bold text-sm">
                    <span className="text-slate-900">Kasada Olması Gereken Net Nakit:</span>
                    <span className="font-mono text-base text-emerald-700">₺{report.theoreticalCash.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Cash Drawer Count & Discrepancy */}
              <div className="p-4 bg-gradient-to-br from-indigo-50/60 to-purple-50/60 border-2 border-indigo-200 rounded-2xl space-y-3">
                <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                  Çekmece Nakit Sayımı & Kasa Farkı
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Kasadaki Nakiti Saydım, Tam Olarak:
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={countedCash}
                        onChange={e => setCountedCash(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-indigo-300 rounded-xl text-base font-black font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="absolute right-3 top-3 text-xs font-bold text-slate-400">TL</span>
                    </div>
                  </div>

                  {countedCash !== '' && (
                    <div
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                        diff === 0
                          ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                          : diff > 0
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                          : 'bg-rose-50 border-rose-300 text-rose-700'
                      }`}
                    >
                      {diff === 0 ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                          <div>
                            <div className="font-black">Kasa Tam Dengede!</div>
                            <div className="text-[11px] opacity-80">0.00 TL fark ile gün başarıyla kapandı.</div>
                          </div>
                        </>
                      ) : diff > 0 ? (
                        <>
                          <AlertCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                          <div>
                            <div className="font-black">+₺{diff.toFixed(2)} Kasa Fazlası</div>
                            <div className="text-[11px] opacity-80">Kasada beklenenden fazla nakit var.</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                          <div>
                            <div className="font-black">-₺{Math.abs(diff).toFixed(2)} Kasa Açığı!</div>
                            <div className="text-[11px] opacity-80">Kasada eksik nakit tespit edildi.</div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Patron WhatsApp Notification Bar */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    📱 Patron WhatsApp Raporu
                  </span>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Günün hasılat özetini ve kasa mutabakatını patronun telefonuna tek tıkla iletin.
                  </p>
                  <input
                    type="tel"
                    placeholder="Patron Tel: 05XX XXX XX XX (İsteğe bağlı)"
                    value={patronPhone}
                    onChange={e => setPatronPhone(e.target.value)}
                    className="mt-2 w-full sm:w-64 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                </div>

                <button
                  onClick={handleSendWhatsapp}
                  className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all self-start sm:self-auto"
                >
                  <Send className="w-4 h-4" />
                  WhatsApp ile Gönder
                </button>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" /> Yazdır / PDF Al
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl"
          >
            Tamamla & Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
