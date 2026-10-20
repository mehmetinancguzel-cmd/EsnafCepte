'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  X,
  Check,
  RefreshCw,
  Plus,
  Minus,
  Sparkles,
  Barcode,
  History,
  FileSpreadsheet,
} from 'lucide-react';
import { playBeep } from '@/lib/beep';

interface AuditItem {
  id: number;
  product_id: number;
  barcode: string;
  name: string;
  variant?: string;
  expected_quantity: number;
  counted_quantity: number;
  variance: number;
  scanned_at: string;
}

interface AuditSession {
  id: number;
  session_name: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
  items: AuditItem[];
}

interface AuditViewProps {
  storeId?: number;
}

export default function AuditView({ storeId = 1 }: AuditViewProps) {
  const [session, setSession] = useState<AuditSession | null>(null);
  const [lastScanned, setLastScanned] = useState<AuditItem | null>(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [customQty, setCustomQty] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'DIFF' | 'EXACT'>('ALL');
  const [historyList, setHistoryList] = useState<AuditSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const scannerRef = useRef<any>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchActiveSession();
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    fetchActiveSession();
    setLastScanned(null);
  }, [storeId]);

  const fetchActiveSession = async () => {
    try {
      const res = await fetch(`/api/audit?storeId=${storeId}`);
      if (res.ok) {
        const data = await res.json();
        setSession(data.active || null);
        setHistoryList(data.history || []);
        if (data.active && data.active.items.length > 0) {
          setLastScanned(data.active.items[0]);
        } else {
          setLastScanned(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startNewSession = async () => {
    setLoading(true);
    try {
      const name = `Sayım Oturumu - ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'START', name, store_id: storeId }),
      });
      if (res.ok) {
        const s = await res.json();
        setSession(s);
        setLastScanned(null);
        playBeep('success');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Camera Barcode Scanning logic
  const startCamera = async () => {
    setScannerError(null);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 260, height: 180 },
        },
        (decodedText) => {
          handleScanBarcode(decodedText);
        },
        () => {
          // Frame error (silently ignore non-detected frames)
        }
      );
      setCameraActive(true);
    } catch (err: any) {
      console.error('Kamera başlatma hatası:', err);
      setScannerError('Kamera açılamadı. HTTPS veya localhost üzerinde çalıştığınızdan ve kamera izni verdiğinizden emin olun.');
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        // ignore
      }
      scannerRef.current = null;
    }
    setCameraActive(false);
  };

  const handleScanBarcode = async (barcode: string, quantityDelta = 1, absoluteQuantity?: number) => {
    if (!session) return;
    const cleanCode = barcode.trim();
    if (!cleanCode) return;

    try {
      const res = await fetch('/api/audit/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          barcode: cleanCode,
          quantityDelta,
          absoluteQuantity,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        playBeep('error');
        setScannerError(err.error || 'Barkod bulunamadı');
        setTimeout(() => setScannerError(null), 3000);
        return;
      }

      const data = await res.json();
      setSession(data.session);
      setLastScanned(data.scannedItem);
      setBarcodeInput('');
      playBeep('success');
      manualInputRef.current?.focus();
    } catch (err: any) {
      playBeep('error');
      setScannerError(err.message);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      handleScanBarcode(barcodeInput.trim(), 1);
    }
  };

  const handleUpdateLastQty = (delta: number) => {
    if (!lastScanned) return;
    handleScanBarcode(lastScanned.barcode, delta);
  };

  const handleSetAbsoluteQty = () => {
    if (!lastScanned || !customQty) return;
    const num = parseInt(customQty);
    if (!isNaN(num) && num >= 0) {
      handleScanBarcode(lastScanned.barcode, 0, num);
      setCustomQty('');
    }
  };

  const handlePauseSession = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'PAUSE', sessionId: session.id }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSession(updated);
        await stopCamera();
        playBeep('success');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleResumeSession = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESUME', sessionId: session.id }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSession(updated);
        playBeep('success');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSession = async () => {
    if (!session) return;
    const confirmCancel = confirm(
      `Bu sayım oturumunu İPTAL ETMEK istediğinizden emin misiniz?\n\n- Sayılan ${session.items.length} kalem ürün silinecektir.\n- Stoklarınızda HİÇBİR değişiklik yapılmayacaktır.`
    );
    if (!confirmCancel) return;

    setLoading(true);
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CANCEL', sessionId: session.id }),
      });
      if (res.ok) {
        await stopCamera();
        setSession(null);
        setLastScanned(null);
        await fetchActiveSession();
        playBeep('warning');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSession = async () => {
    if (!session || session.items.length === 0) {
      alert('Sayım listesinde hiç ürün yok!');
      return;
    }

    const confirmSync = confirm(
      `Sayımı tamamlamak ve sayılan miktarları FİİLİ STOK olarak kaydetmek istiyor musunuz?\n\nToplam ${session.items.length} kalem ürün sayıldı.`
    );

    if (!confirmSync) return;

    setLoading(true);
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'COMPLETE',
          sessionId: session.id,
          applyToStock: true,
        }),
      });

      if (res.ok) {
        alert('Tebrikler! Sayım tamamlandı ve tüm stoklar başarıyla eşitlendi.');
        stopCamera();
        fetchActiveSession();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Filter items
  const filteredItems = (session?.items || []).filter(item => {
    if (filterType === 'DIFF') return item.variance !== 0;
    if (filterType === 'EXACT') return item.variance === 0;
    return true;
  });

  const totalVariance = (session?.items || []).reduce((sum, item) => sum + item.variance, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Top Banner: Sayım Oturumu Durumu */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
              A4 Çilesine Son Veren Mod
            </span>
            {session && (
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold border flex items-center gap-1.5 ${
                  session.status === 'PAUSED'
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {session.status === 'PAUSED' ? '⏸️ Sayım Duraklatıldı (Beklemede)' : '🟢 Aktif Sayılıyor'} (#{session.id})
              </span>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 mt-1">
            {session ? session.session_name : 'Aktif Sayım Oturumu Yok'}
          </h2>
          <p className="text-xs text-slate-500">
            {session?.status === 'PAUSED'
              ? 'Sayım duraklatıldı. Cihaz pilinizi korumak için kamera kapatıldı. Dilediğiniz an devam edebilirsiniz.'
              : 'Telefon kamerası veya barkod okuyucuyla reyonu sayın. Sistem farkı anında hesaplasın.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
          {!session ? (
            <button
              onClick={startNewSession}
              disabled={loading}
              className="w-full sm:w-auto px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              Yeni Sayım Başlat
            </button>
          ) : (
            <>
              {session.status === 'ACTIVE' ? (
                <button
                  onClick={handlePauseSession}
                  disabled={loading}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs sm:text-sm shadow-sm flex items-center gap-1.5 transition-colors"
                  title="Müşteri geldiğinde veya mola verdiğinizde sayımı duraklatın"
                >
                  <Pause className="w-4 h-4 fill-white" />
                  Sayımı Duraklat
                </button>
              ) : (
                <button
                  onClick={handleResumeSession}
                  disabled={loading}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs sm:text-sm shadow-sm shadow-indigo-600/30 flex items-center gap-1.5 transition-colors"
                  title="Sayımı kaldığı yerden devam ettir"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Sayımı Sürdür
                </button>
              )}

              <button
                onClick={handleCompleteSession}
                disabled={loading || session.items.length === 0}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-colors"
                title="Tüm sayımı tamamla ve stokları fiili sayım ile eşitle"
              >
                <Check className="w-4 h-4" />
                Sayımı Bitir & Stokları Eşitle
              </button>

              <button
                onClick={handleCancelSession}
                disabled={loading}
                className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1 transition-colors"
                title="Sayımı stokları değiştirmeden iptal et"
              >
                <X className="w-4 h-4" />
                İptal Et
              </button>
            </>
          )}

          <button
            onClick={() => setShowHistory(prev => !prev)}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
            title="Geçmiş Sayımlar"
          >
            <History className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Paused Session Notice Banner */}
      {session && session.status === 'PAUSED' && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center shrink-0">
              <Pause className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">Sayım Şu Anda Duraklatıldı (Beklemede)</h4>
              <p className="text-xs text-amber-700">
                Hafızada <strong>{session.items.length} kalem</strong> sayılmış ürününüz güvenle saklanıyor. Müşteri işleminiz veya molanız bittiğinde aşağıdaki butondan devam edebilirsiniz.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={handleResumeSession}
              disabled={loading}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Kaldığın Yerden Devam Et
            </button>
            <button
              onClick={handleCancelSession}
              disabled={loading}
              className="px-3 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-amber-300 text-xs font-semibold rounded-xl"
            >
              Oturumu İptal Et
            </button>
          </div>
        </div>
      )}

      {session && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Column: Camera Scanner & Manual Input (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Camera Box Card */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-indigo-400" />
                  Kamera Barkod Okuyucu
                </span>
                <button
                  onClick={cameraActive ? stopCamera : startCamera}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    cameraActive
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {cameraActive ? 'Kamerayı Kapat' : 'Kamerayı Aç'}
                </button>
              </div>

              {/* Camera Target Area */}
              <div className="relative w-full aspect-[4/3] bg-black rounded-xl overflow-hidden flex items-center justify-center border-2 border-dashed border-slate-700">
                <div id="qr-reader" className="w-full h-full"></div>

                {!cameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    <Camera className="w-10 h-10 text-slate-600 mb-2 stroke-[1.5]" />
                    <p className="text-xs text-slate-400">
                      Mobil cihazınızın kamerasını açarak barkodları arka arkaya okutabilirsiniz.
                    </p>
                    <button
                      onClick={startCamera}
                      className="mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 text-indigo-300"
                    >
                      Kamera Vizörünü Başlat
                    </button>
                  </div>
                )}

                {cameraActive && (
                  <div className="absolute left-6 right-6 h-0.5 bg-red-500 shadow-[0_0_12px_#ef4444] scanner-laser pointer-events-none"></div>
                )}
              </div>

              {scannerError && (
                <div className="mt-3 p-2.5 rounded-lg bg-red-500/20 border border-red-500/30 text-xs text-red-300">
                  {scannerError}
                </div>
              )}
            </div>

            {/* Quick Manual / Bluetooth Scanner Input */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <form onSubmit={handleManualSubmit} className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Barkod Tabancası / Manuel Giriş
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Barcode className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      ref={manualInputRef}
                      type="text"
                      placeholder="Barkod okutun veya yazın..."
                      value={barcodeInput}
                      onChange={e => setBarcodeInput(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow"
                  >
                    Say
                  </button>
                </div>
              </form>
            </div>

            {/* Son Okutulan Ürün Kartı (Live Variance Card) */}
            {lastScanned ? (
              <div className="bg-white rounded-2xl border-2 border-indigo-500/40 p-4 shadow-md space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      Son Okutulan Ürün
                    </span>
                    <h3 className="font-bold text-base text-slate-800 mt-1">{lastScanned.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                      <span className="font-mono">{lastScanned.barcode}</span>
                      {lastScanned.variant && (
                        <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.2 rounded border border-purple-200">
                          {lastScanned.variant}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3-lü Kıyas Kutusu: Sistem vs Sayılan vs Fark */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-100">
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">Sistemde</span>
                    <span className="text-base font-bold font-mono text-slate-700">
                      {lastScanned.expected_quantity}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200">
                    <span className="text-[10px] text-indigo-700 font-semibold block uppercase">Sayılan</span>
                    <span className="text-lg font-extrabold font-mono text-indigo-700">
                      {lastScanned.counted_quantity}
                    </span>
                  </div>
                  <div
                    className={`p-2.5 rounded-xl border ${
                      lastScanned.variance === 0
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : lastScanned.variance < 0
                        ? 'bg-red-50 border-red-200 text-red-700'
                        : 'bg-blue-50 border-blue-200 text-blue-700'
                    }`}
                  >
                    <span className="text-[10px] font-bold block uppercase">Fark</span>
                    <span className="text-base font-extrabold font-mono">
                      {lastScanned.variance > 0 ? `+${lastScanned.variance}` : lastScanned.variance}
                      {lastScanned.variance < 0 ? ' (Eksik)' : lastScanned.variance > 0 ? ' (Fazla)' : ' (Tam)'}
                    </span>
                  </div>
                </div>

                {/* Hızlı Adet Ayarlama Butonları */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleUpdateLastQty(-1)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700 text-sm"
                  >
                    -1 Eksilt
                  </button>
                  <button
                    onClick={() => handleUpdateLastQty(1)}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-sm"
                  >
                    +1 Arttır
                  </button>
                </div>

                {/* Manuel Toplu Adet Gir */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <input
                    type="number"
                    min="0"
                    placeholder="Adet gir..."
                    value={customQty}
                    onChange={e => setCustomQty(e.target.value)}
                    className="w-28 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                  />
                  <button
                    onClick={handleSetAbsoluteQty}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg"
                  >
                    Adeti Sabitle
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-6 text-center text-slate-400 text-xs">
                Henüz bir ürün okutulmadı. Kamerayı barkoda tutun veya yukarıya barkod girin.
              </div>
            )}

          </div>

          {/* Right Column: Scanned List & Discrepancy Table (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col justify-between">
            <div>
              {/* Header & Filter Pills */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                    Sayılan Kalemler ({session.items.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Toplam Sayım Net Farkı:{' '}
                    <span
                      className={`font-mono font-bold ${
                        totalVariance === 0 ? 'text-emerald-600' : totalVariance < 0 ? 'text-red-600' : 'text-blue-600'
                      }`}
                    >
                      {totalVariance > 0 ? `+${totalVariance}` : totalVariance} Adet
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    onClick={() => setFilterType('ALL')}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                      filterType === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Tümü ({session.items.length})
                  </button>
                  <button
                    onClick={() => setFilterType('DIFF')}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                      filterType === 'DIFF' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700'
                    }`}
                  >
                    Fark Olanlar ({session.items.filter(i => i.variance !== 0).length})
                  </button>
                  <button
                    onClick={() => setFilterType('EXACT')}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                      filterType === 'EXACT' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    Tam Olanlar ({session.items.filter(i => i.variance === 0).length})
                  </button>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-y-auto max-h-[460px] divide-y divide-slate-100 mt-2">
                {filteredItems.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs">
                    Bu filtreye uyan sayılmış ürün bulunmuyor.
                  </div>
                ) : (
                  filteredItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => setLastScanned(item)}
                      className="py-3 px-2 hover:bg-slate-50 rounded-xl cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="font-bold text-sm text-slate-800">{item.name}</div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                          <span className="font-mono">{item.barcode}</span>
                          {item.variant && (
                            <span className="px-2 py-0.5 rounded text-[11px] bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                              {item.variant}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-right">
                        <div className="text-xs">
                          <div className="text-slate-400">Sistem: <strong className="text-slate-700">{item.expected_quantity}</strong></div>
                          <div className="text-indigo-600 font-bold">Sayılan: {item.counted_quantity}</div>
                        </div>

                        <div
                          className={`w-20 py-1.5 rounded-lg text-center font-mono font-bold text-xs ${
                            item.variance === 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : item.variance < 0
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {item.variance > 0 ? `+${item.variance}` : item.variance}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom Status / CSV Export */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>{session.items.length} kalem sayıldı</span>
              <button
                onClick={() => {
                  const csv = [
                    'Barkod,Ürün Adı,Varyant,Sistem Stoku,Sayılan Miktar,Fark',
                    ...session.items.map(
                      i => `"${i.barcode}","${i.name}","${i.variant || ''}",${i.expected_quantity},${i.counted_quantity},${i.variance}`
                    ),
                  ].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `sayim_raporu_${session.id}.csv`;
                  a.click();
                }}
                className="text-slate-700 hover:text-indigo-600 font-semibold flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4" /> Excel/CSV Fark Raporu İndir
              </button>
            </div>
          </div>

        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" /> Tamamlanmış Sayım Geçmişi
              </h3>
              <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {historyList.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">Kayıtlı sayım bulunamadı.</div>
              ) : (
                historyList.map(h => (
                  <div key={h.id} className="p-3 hover:bg-slate-50 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-slate-800">{h.session_name}</div>
                      <div className="text-xs text-slate-400">
                        {new Date(h.created_at).toLocaleDateString('tr-TR')} • {h.items.length} Kalem
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-bold ${
                        h.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : h.status === 'CANCELLED'
                          ? 'bg-slate-100 text-slate-500'
                          : h.status === 'PAUSED'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-indigo-50 text-indigo-700'
                      }`}
                    >
                      {h.status === 'COMPLETED'
                        ? 'Tamamlandı'
                        : h.status === 'CANCELLED'
                        ? 'İptal Edildi'
                        : h.status === 'PAUSED'
                        ? 'Duraklatıldı'
                        : 'Aktif'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
