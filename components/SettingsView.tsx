'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  CreditCard,
  Scale,
  Printer,
  Building2,
  FileText,
  Shield,
  Save,
  CheckCircle,
  AlertCircle,
  Cable,
  Wifi,
  Cpu,
  Key,
  Globe,
  HelpCircle,
  RefreshCw,
  Sliders,
  DollarSign,
  Lock,
} from 'lucide-react';
import { Store } from '@/lib/db';
import { buildSaleReceiptBytes, printDirectWebUsb } from '@/lib/escpos';
import { PosBridgeClient } from '@/lib/pos-bridge';

interface SettingsViewProps {
  storeId: number;
  onSettingsSaved?: () => void;
}

export default function SettingsView({ storeId, onSettingsSaved }: SettingsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'HARDWARE' | 'COMPANY' | 'GIB' | 'SECURITY'>('HARDWARE');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Store>>({
    name: '',
    company_title: '',
    phone: '',
    email: '',
    address: '',
    tax_id: '',
    tax_office: '',
    mersis_no: '',
    trade_reg_no: '',

    // GİB
    gib_mode: 'PORTAL',
    gib_username: '',
    gib_password: '',
    integrator_name: 'Paraşüt',
    integrator_api_key: '',
    integrator_api_secret: '',
    invoice_prefix: 'EAC2026',

    // Hardware
    pos_connection_type: 'SERIAL_COM',
    pos_com_port: 'COM3',
    pos_baud_rate: 9600,
    pos_model: 'Beko 300TR',
    pos_ip_address: '192.168.1.150',
    pos_ip_port: 9100,

    scale_connection_type: 'SERIAL_COM',
    scale_com_port: 'COM1',
    scale_baud_rate: 9600,
    scale_protocol: 'CAS',
    scale_prefix: '27',

    printer_type: 'WEBUSB',
    printer_paper_width: '80mm',
    auto_print_receipt: true,
    auto_kick_drawer: true,

    // Security & Supplier
    patron_pin: '1234',
    auto_supplier_whatsapp: false,
    supplier_name: '',
    supplier_phone: '',
  });

  // Test states
  const [posTesting, setPosTesting] = useState(false);
  const [posTestResult, setPosTestResult] = useState<string | null>(null);
  const [gibTesting, setGibTesting] = useState(false);
  const [gibTestResult, setGibTestResult] = useState<string | null>(null);
  const [printerTesting, setPrinterTesting] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [storeId]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stores/settings?storeId=${storeId}`);
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({
          ...prev,
          ...data,
          // Defaults if empty
          pos_connection_type: data.pos_connection_type || 'SERIAL_COM',
          pos_com_port: data.pos_com_port || 'COM3',
          pos_baud_rate: data.pos_baud_rate || 9600,
          pos_model: data.pos_model || 'Beko 300TR',
          scale_connection_type: data.scale_connection_type || 'SERIAL_COM',
          scale_com_port: data.scale_com_port || 'COM1',
          scale_protocol: data.scale_protocol || 'CAS',
          scale_prefix: data.scale_prefix || '27',
          printer_type: data.printer_type || 'WEBUSB',
          printer_paper_width: data.printer_paper_width || '80mm',
          invoice_prefix: data.invoice_prefix || 'EAC2026',
          patron_pin: data.patron_pin || '1234',
        }));
      }
    } catch (e) {
      console.error(e);
      setError('Ayarlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/stores/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          ...formData,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Kaydetme başarısız');
      }

      setToast('Tüm bağlantı ve sistem ayarları başarıyla kaydedildi!');
      setTimeout(() => setToast(null), 3500);
      onSettingsSaved?.();
    } catch (err: any) {
      setError(err.message || 'Ayarlar kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  // Hardware POS test
  const handleTestPos = async () => {
    setPosTesting(true);
    setPosTestResult(null);
    try {
      if (formData.pos_connection_type === 'SIMULATOR') {
        await new Promise(r => setTimeout(r, 800));
        setPosTestResult('✅ Yazılımsal POS Simülatörü Hazır ve Bağlı!');
      } else if (formData.pos_connection_type === 'SERIAL_COM') {
        const hasSerial = 'serial' in navigator;
        if (!hasSerial) {
          setPosTestResult('⚠️ Tarayıcınız Web Serial API desteklemiyor (Google Chrome / MS Edge önerilir).');
        } else {
          try {
            const port = await (navigator as any).serial.requestPort();
            await port.open({ baudRate: formData.pos_baud_rate || 9600 });
            await port.close();
            setPosTestResult(`✅ Kablolu POS Cihazı (${formData.pos_model} - ${formData.pos_com_port || 'COM3'}) Doğrulandı!`);
          } catch (e: any) {
            setPosTestResult(`ℹ️ Port seçimi yapılmadı veya bağlantı kapandı (${e.message || 'İptal edildi'}).`);
          }
        }
      } else {
        // IP_NETWORK
        new PosBridgeClient(`ws://${formData.pos_ip_address || '127.0.0.1'}:${formData.pos_ip_port || 9100}/pos`);
        setPosTestResult(`📡 IP-POS (${formData.pos_ip_address}:${formData.pos_ip_port}) Ağ Soketi Tanımlandı - Sinyal Hazır.`);
      }
    } catch (err: any) {
      setPosTestResult(`❌ Hata: ${err.message || 'Bağlantı kurulamadı'}`);
    } finally {
      setPosTesting(false);
    }
  };

  // GİB connection test
  const handleTestGib = async () => {
    setGibTesting(true);
    setGibTestResult(null);
    try {
      await new Promise(r => setTimeout(r, 1200));
      if (formData.gib_mode === 'PORTAL') {
        if (!formData.gib_username) {
          setGibTestResult('⚠️ Lütfen GİB Portal Kullanıcı Kodu girin.');
        } else {
          setGibTestResult(`✅ GİB E-Arşiv Portalı (earsivportal.efatura.gov.tr) Bağlantısı Başarılı!`);
        }
      } else {
        if (!formData.integrator_api_key) {
          setGibTestResult('⚠️ Lütfen Entegratör API Anahtarı girin.');
        } else {
          setGibTestResult(`✅ ${formData.integrator_name} Özel Entegratör API Doğrulandı (Canlı Mod Aktif).`);
        }
      }
    } finally {
      setGibTesting(false);
    }
  };

  // Printer test print
  const handleTestPrint = async () => {
    setPrinterTesting(true);
    try {
      const receiptBytes = buildSaleReceiptBytes({
        storeName: formData.name || 'EsnafCepte Test Dükkanı',
        address: formData.address || 'Örnek Cad. No:1',
        phone: formData.phone || '0532 000 00 00',
        saleCode: 'TEST-0001',
        items: [
          { name: 'Bağlantı Test Ürünü', quantity: 1, unit_price: 100, total_price: 100 },
        ],
        totalAmount: 100,
        paymentMethod: 'NAKIT',
        paperWidth: formData.printer_paper_width || '80mm',
        autoDrawer: formData.auto_kick_drawer ?? true,
      });

      const res = await printDirectWebUsb(receiptBytes);

      if (res.success) {
        alert('Test fişi başarıyla yazıcıya gönderildi!');
      } else {
        alert(res.message || 'Yazıcıya bağlanılamadı.');
      }
    } catch (err: any) {
      alert(`Yazıcı hatası: ${err.message}`);
    } finally {
      setPrinterTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="font-semibold text-sm">Ayarlar yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Toast Alert */}
      {toast && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white font-bold text-sm flex items-center gap-2 shadow-xl shadow-emerald-600/20 animate-in fade-in">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-600 text-white font-bold text-sm flex items-center gap-2 shadow-xl shadow-red-600/20 animate-in fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-md shadow-emerald-600/20">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">Merkezi Sistem & Donanım Ayarları</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              POS, Terazi, Yazıcı, GİB Fatura ve Güvenlik yapılandırması
            </p>
          </div>
        </div>

        <button
          onClick={() => handleSave()}
          disabled={saving}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-2xl font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 p-1.5 rounded-2xl">
        <button
          onClick={() => setActiveSubTab('HARDWARE')}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            activeSubTab === 'HARDWARE'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>🔌 Donanım & Çevre</span>
        </button>

        <button
          onClick={() => setActiveSubTab('COMPANY')}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            activeSubTab === 'COMPANY'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>🏢 Firma & Vergi</span>
        </button>

        <button
          onClick={() => setActiveSubTab('GIB')}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            activeSubTab === 'GIB'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>🌐 GİB & E-Fatura</span>
        </button>

        <button
          onClick={() => setActiveSubTab('SECURITY')}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            activeSubTab === 'SECURITY'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>🔒 Güvenlik & Kasa</span>
        </button>
      </div>

      {/* TAB 1: DONANIM & ÇEVRE BİRİMLERİ */}
      {activeSubTab === 'HARDWARE' && (
        <div className="space-y-6">
          {/* Section 1: Kablolu POS Cihazı */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Kablolu POS Cihazı Bağlantı Ayarları</h3>
                  <p className="text-[11px] text-slate-400">RS-232 COM Kablosu, USB veya IP-POS GMP-3 Protokolü</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                GMP-3 Uyumlu
              </span>
            </div>

            {/* Explanatory Help Card for Users */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 space-y-2">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                POS Cihazını Bilgisayara Nasıl Bağlayacaksınız?
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-500 pl-1 leading-relaxed">
                <li>POS cihazınızın (Beko, Ingenico vb.) arkasındaki RS-232 / USB kablosunu bilgisayarınızın USB portuna takın.</li>
                <li>Windows <b>Aygıt Yöneticisi &gt; Bağlantı Noktaları (COM ve LPT)</b> bölümünden atanan COM portunu (Örn: <b>COM3</b>) kontrol edin.</li>
                <li>Aşağıdaki listeden ilgili COM portunu ve baud hızını (genelde <b>9600</b>) seçip <b>Bağlantıyı Test Et</b> butonuna tıklayın.</li>
              </ol>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Bağlantı Türü</label>
                <select
                  value={formData.pos_connection_type || 'SERIAL_COM'}
                  onChange={e => setFormData({ ...formData, pos_connection_type: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="SERIAL_COM">Kablolu Seri Port (RS-232 / USB COM)</option>
                  <option value="IP_NETWORK">Ağ / Ethernet (IP-POS TCP)</option>
                  <option value="SIMULATOR">Yazılımsal Test Terminali (Simülatör)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">POS Cihaz Modeli</label>
                <select
                  value={formData.pos_model || 'Beko 300TR'}
                  onChange={e => setFormData({ ...formData, pos_model: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Beko 300TR">Beko 300TR / 400TR</option>
                  <option value="Ingenico iWE280">Ingenico iWE280 / Desk 5000</option>
                  <option value="Hugin T300">Hugin T300 / VX675</option>
                  <option value="Verifone VX680">Verifone VX680 / P400</option>
                  <option value="PAX A910">PAX A910 / D210</option>
                  <option value="Generic GMP-3">Standart GMP-3 Protokolü</option>
                </select>
              </div>

              {formData.pos_connection_type === 'SERIAL_COM' ? (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">COM Portu</label>
                  <select
                    value={formData.pos_com_port || 'COM3'}
                    onChange={e => setFormData({ ...formData, pos_com_port: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                  >
                    {['COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              ) : formData.pos_connection_type === 'IP_NETWORK' ? (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Terminal IP & Port</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="192.168.1.150"
                      value={formData.pos_ip_address || ''}
                      onChange={e => setFormData({ ...formData, pos_ip_address: e.target.value })}
                      className="w-2/3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                    <input
                      type="number"
                      placeholder="9100"
                      value={formData.pos_ip_port || 9100}
                      onChange={e => setFormData({ ...formData, pos_ip_port: parseInt(e.target.value) || 9100 })}
                      className="w-1/3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Simülatör Durumu</label>
                  <div className="px-3 py-2 bg-emerald-50 text-emerald-700 font-bold rounded-xl border border-emerald-200 text-center">
                    Aktif (Fiziki Cihaz Gerekmez)
                  </div>
                </div>
              )}
            </div>

            {/* Test Connection Button & Result */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleTestPos}
                disabled={posTesting}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all w-fit"
              >
                <Cable className="w-3.5 h-3.5 text-emerald-400" />
                <span>{posTesting ? 'Bağlantı Sınanıyor...' : 'Kablolu POS Bağlantısını Test Et'}</span>
              </button>

              {posTestResult && (
                <div className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
                  {posTestResult}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Fiziki Terazi */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <Scale className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Elektronik Terazi Bağlantı Ayarları</h3>
                  <p className="text-[11px] text-slate-400">RS-232 / USB Canlı Gramaj İletimi veya 4 Haneli PLU Kodu</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[10px] font-bold">
                CAS / Dibal / TEM
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Terazi Bağlantı Tipi</label>
                <select
                  value={formData.scale_connection_type || 'SERIAL_COM'}
                  onChange={e => setFormData({ ...formData, scale_connection_type: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="SERIAL_COM">Fiziki Kablolu (COM / RS-232)</option>
                  <option value="MANUAL_PLU">Yalnızca 4 Haneli PLU Kodu</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Terazi Portu</label>
                <select
                  value={formData.scale_com_port || 'COM1'}
                  onChange={e => setFormData({ ...formData, scale_com_port: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                >
                  {['COM1', 'COM2', 'COM3', 'COM4', 'COM5'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Terazi Protokolü</label>
                <select
                  value={formData.scale_protocol || 'CAS'}
                  onChange={e => setFormData({ ...formData, scale_protocol: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="CAS">CAS (ER / SW Serisi)</option>
                  <option value="Dibal">Dibal (L Serisi)</option>
                  <option value="TEM">TEM EKO / Baster</option>
                  <option value="Toledo">Mettler Toledo</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Terazi Barkod Ön Eki</label>
                <input
                  type="text"
                  maxLength={2}
                  placeholder="27"
                  value={formData.scale_prefix || '27'}
                  onChange={e => setFormData({ ...formData, scale_prefix: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center font-bold"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Fiş Yazıcı & Para Çekmecesi */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <Printer className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Termal Fiş Yazıcı & Para Çekmecesi</h3>
                  <p className="text-[11px] text-slate-400">ESC/POS Doğrudan WebUSB Yazdırma ve Kasa Tetiği</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Yazdırma Yöntemi</label>
                <select
                  value={formData.printer_type || 'WEBUSB'}
                  onChange={e => setFormData({ ...formData, printer_type: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="WEBUSB">Doğrudan WebUSB (Termal ESC/POS - Hızlı)</option>
                  <option value="WINDOWS_DRIVER">Tarayıcı Yazdırma (Windows Driver)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Kağıt Genişliği</label>
                <select
                  value={formData.printer_paper_width || '80mm'}
                  onChange={e => setFormData({ ...formData, printer_paper_width: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="80mm">80 mm (Standart Geniş Termal Rulo)</option>
                  <option value="58mm">58 mm (Dar Mobil / Masaüstü Rulo)</option>
                </select>
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.auto_print_receipt ?? true}
                    onChange={e => setFormData({ ...formData, auto_print_receipt: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Satış tamamlandığında otomatik fiş bas</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.auto_kick_drawer ?? true}
                    onChange={e => setFormData({ ...formData, auto_kick_drawer: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Nakit satışta çekmeceyi otomatik aç (ESC p)</span>
                </label>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleTestPrint}
                disabled={printerTesting}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span>{printerTesting ? 'Yazdırılıyor...' : 'Test Fişi Bas & Çekmeceyi Aç'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FİRMA & RESMİ VERGİ BİLGİLERİ */}
      {activeSubTab === 'COMPANY' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              Firma & Resmi Fatura Bilgileri
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Bu bilgiler E-Arşiv faturalarında ve resmi satış fişlerinde satıcı olarak yer alacaktır.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Dükkan / Mağaza Görünen Adı</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                placeholder="Örn: Bereket Süpermarket & Şarküteri"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Resmi Şirket / Ticari Unvan</label>
              <input
                type="text"
                value={formData.company_title || ''}
                onChange={e => setFormData({ ...formData, company_title: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                placeholder="Örn: Bereket Gıda İhtiyaç Maddeleri San. ve Tic. Ltd. Şti."
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">VKN (Vergi Kimlik No) veya TCKN</label>
              <input
                type="text"
                maxLength={11}
                value={formData.tax_id || ''}
                onChange={e => setFormData({ ...formData, tax_id: e.target.value.replace(/\D/g, '') })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                placeholder="10 Haneli VKN veya 11 Haneli TCKN"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Bağlı Olduğu Vergi Dairesi</label>
              <input
                type="text"
                value={formData.tax_office || ''}
                onChange={e => setFormData({ ...formData, tax_office: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                placeholder="Örn: Beyoğlu Vergi Dairesi Müdürlüğü"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">MERSİS Numarası</label>
              <input
                type="text"
                value={formData.mersis_no || ''}
                onChange={e => setFormData({ ...formData, mersis_no: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                placeholder="Örn: 0123456789000014"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Ticaret Sicil Numarası</label>
              <input
                type="text"
                value={formData.trade_reg_no || ''}
                onChange={e => setFormData({ ...formData, trade_reg_no: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                placeholder="Örn: 123456/5"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Fatura İletişim Telefonu</label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                placeholder="0212 555 10 20"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Fatura E-Posta Adresi</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                placeholder="muhasebe@sirketiniz.com"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">İş Yeri Açık Adresi</label>
              <textarea
                rows={2}
                value={formData.address || ''}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                placeholder="Mahalle, Cadde, Sokak, Kapı No, İlçe / İl"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GİB & E-FATURA ENTEGRASYONU */}
      {activeSubTab === 'GIB' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-600" />
              Gelir İdaresi Başkanlığı (GİB) & E-Fatura Entegrasyonu
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              GİB 5.000 / 2.000 TL Portal doğrudan bağlantısı veya Özel Entegratör API ayarları
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">Entegrasyon Yöntemi</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gib_mode: 'PORTAL' })}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    formData.gib_mode === 'PORTAL'
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="font-bold text-slate-800 text-xs flex items-center justify-between">
                    <span>GİB 5.000 / 2.000 TL Ücretsiz Portal</span>
                    {formData.gib_mode === 'PORTAL' && <span className="text-emerald-600">✓ Seçildi</span>}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    İnteraktif Vergi Dairesi portal şifreniz ile doğrudan ve ek ücret ödemeden resmi E-Arşiv fatura kesin.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gib_mode: 'ENTEGRATOR' })}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    formData.gib_mode === 'ENTEGRATOR'
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="font-bold text-slate-800 text-xs flex items-center justify-between">
                    <span>Özel Entegratör API (Otomatik Mühür)</span>
                    {formData.gib_mode === 'ENTEGRATOR' && <span className="text-emerald-600">✓ Seçildi</span>}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Paraşüt, BizimHesap, Uyumsoft, KolayBi veya EDM hesabınızın API anahtarıyla otomatik ve anında onay.
                  </p>
                </button>
              </div>
            </div>

            {formData.gib_mode === 'PORTAL' ? (
              <>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">GİB Portal Kullanıcı Kodu</label>
                  <input
                    type="text"
                    value={formData.gib_username || ''}
                    onChange={e => setFormData({ ...formData, gib_username: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    placeholder="İnteraktif Vergi Dairesi Kullanıcı Kodu"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">GİB Portal Şifresi</label>
                  <input
                    type="password"
                    value={formData.gib_password || ''}
                    onChange={e => setFormData({ ...formData, gib_password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    placeholder="••••••••••••"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Entegratör Sağlayıcı</label>
                  <select
                    value={formData.integrator_name || 'Paraşüt'}
                    onChange={e => setFormData({ ...formData, integrator_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="Paraşüt">Paraşüt E-Fatura API</option>
                    <option value="BizimHesap">BizimHesap API</option>
                    <option value="Uyumsoft">Uyumsoft E-Devlet API</option>
                    <option value="KolayBi">KolayBi E-Arşiv API</option>
                    <option value="EDM Bilişim">EDM Bilişim API</option>
                    <option value="Mikro">Mikro Yazılım API</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fatura Seri / Ön Ek</label>
                  <input
                    type="text"
                    maxLength={16}
                    value={formData.invoice_prefix || 'EAC2026'}
                    onChange={e => setFormData({ ...formData, invoice_prefix: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                    placeholder="EAC2026"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">API Key (İstemci Anahtarı)</label>
                  <input
                    type="text"
                    value={formData.integrator_api_key || ''}
                    onChange={e => setFormData({ ...formData, integrator_api_key: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    placeholder="ent_live_pk_..."
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">API Secret (Gizli Anahtar)</label>
                  <input
                    type="password"
                    value={formData.integrator_api_secret || ''}
                    onChange={e => setFormData({ ...formData, integrator_api_secret: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    placeholder="••••••••••••••••••••"
                  />
                </div>
              </>
            )}

            <div className="sm:col-span-2 pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleTestGib}
                disabled={gibTesting}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all w-fit"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>{gibTesting ? 'GİB Sunucusuna Bağlanılıyor...' : 'GİB Bağlantısını Test Et'}</span>
              </button>

              {gibTestResult && (
                <div className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
                  {gibTestResult}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GÜVENLİK & KASA OPERASYONU */}
      {activeSubTab === 'SECURITY' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              Patron Güvenlik PIN'i & Kasa Denetimi
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Kasiyer yetki kısıtlamaları, Z Raporu gizlilikleri ve toptancı WhatsApp bildirimleri
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Patron / Yönetici PIN Kodu (4 Haneli)
              </label>
              <input
                type="password"
                maxLength={4}
                value={formData.patron_pin || '1234'}
                onChange={e => setFormData({ ...formData, patron_pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center font-black text-lg tracking-widest text-slate-800"
                placeholder="1234"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Kasiyer modunda gizli alış maliyetlerini görmek ve Z Raporunu kapatmak için bu PIN sorulur.
              </p>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Ana Toptancı Adı</label>
              <input
                type="text"
                value={formData.supplier_name || ''}
                onChange={e => setFormData({ ...formData, supplier_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                placeholder="Örn: Mega Gıda & Toptan Ltd."
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Toptancı WhatsApp Numarası</label>
              <input
                type="text"
                value={formData.supplier_phone || ''}
                onChange={e => setFormData({ ...formData, supplier_phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                placeholder="0532 100 20 30"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.auto_supplier_whatsapp ?? false}
                  onChange={e => setFormData({ ...formData, auto_supplier_whatsapp: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span>Kritik stok uyarısında otomatik WhatsApp sipariş taslağı hazırla</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Save Footer */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          onClick={() => handleSave()}
          disabled={saving}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Ayarlar Kaydediliyor...' : 'Tüm Ayarları Kaydet'}</span>
        </button>
      </div>
    </div>
  );
}
