'use client';

import React, { useState } from 'react';
import { StoreSector, User, Store } from '@/lib/db';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User, store: Store) => void;
  onOpenLogin: () => void;
}

export default function RegisterModal({ isOpen, onClose, onSuccess, onOpenLogin }: RegisterModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const [storeName, setStoreName] = useState('');
  const [address, setAddress] = useState('');

  const [sector, setSector] = useState<StoreSector>('MARKET');
  const [seedTemplate, setSeedTemplate] = useState(true);

  if (!isOpen) return null;

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!userName.trim() || !email.trim() || !password.trim()) {
      setError('Lütfen yetkili adı, e-posta ve şifrenizi giriniz.');
      return;
    }
    if (password.length < 6) {
      setError('Şifreniz en az 6 karakter olmalıdır.');
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!storeName.trim()) {
      setError('Lütfen dükkan / işletme adınızı belirtiniz.');
      return;
    }
    setStep(3);
  };

  const handleCompleteRegister = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName,
          email,
          phone,
          password,
          storeName,
          sector,
          address,
          seedTemplate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Kayıt tamamlanamadı.');
      }

      onSuccess(data.user, data.store);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız oldu.');
    } finally {
      setLoading(false);
    }
  };

  const sectorOptions: { id: StoreSector; title: string; desc: string; icon: string }[] = [
    {
      id: 'MARKET',
      title: 'Market & Bakkal & Şarküteri',
      desc: 'Barkodlu hızlı satış, terazi entegrasyonu, temel gıda ve tekel stok yönetimi',
      icon: '🛒',
    },
    {
      id: 'BUTIK_GIYIM',
      title: 'Butik & Giyim & Ayakkabı',
      desc: 'Beden, renk varyantları, askı ve etiket basımı, vitrin takibi',
      icon: '👗',
    },
    {
      id: 'KIRTASIYE_TUHAFIYE',
      title: 'Kırtasiye & Tuhafiye & Kitap',
      desc: 'Okul sezonu yoğunluğu, iplik/düğme çeşitleri, fotokopi ve defter sayımı',
      icon: '📚',
    },
    {
      id: 'HIRDAVAT',
      title: 'Hırdavat & Nalburiye & Yapı',
      desc: 'El aletleri, boya, vida/somun, şerit metre ve teknik malzeme yönetimi',
      icon: '🔧',
    },
    {
      id: 'DIGER',
      title: 'Diğer Perakende & Toptan',
      desc: 'Hızlı kasa, veresiye defteri ve mobil kamera barkodlu genel sayım',
      icon: '🏬',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
          <div className="inline-flex items-center gap-2 bg-emerald-500/40 text-emerald-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            ✨ 14 Gün Koşulsuz Ücretsiz Deneme
          </div>
          <h2 className="text-2xl font-black tracking-tight">EsnafCepte&apos;ye Hoş Geldiniz</h2>
          <p className="text-emerald-100 text-sm mt-1">
            Kredi kartı gerekmez. Dükkanınızı 1 dakikada kurun, sayım çilesine son verin.
          </p>

          {/* Stepper Dots */}
          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-emerald-500/30">
            <div className={`flex items-center gap-2 text-xs font-bold ${step >= 1 ? 'text-white' : 'text-emerald-300/60'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-white text-emerald-700' : 'bg-emerald-800 text-white'}`}>1</span>
              Yetkili
            </div>
            <div className="w-8 h-0.5 bg-emerald-400/40" />
            <div className={`flex items-center gap-2 text-xs font-bold ${step >= 2 ? 'text-white' : 'text-emerald-300/60'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-white text-emerald-700' : 'bg-emerald-800 text-white'}`}>2</span>
              Dükkan
            </div>
            <div className="w-8 h-0.5 bg-emerald-400/40" />
            <div className={`flex items-center gap-2 text-xs font-bold ${step === 3 ? 'text-white' : 'text-emerald-300/60'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 3 ? 'bg-white text-emerald-700' : 'bg-emerald-800 text-white'}`}>3</span>
              Sektör
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Yetkili Bilgileri */}
          {step === 1 && (
            <form onSubmit={handleNextStep1} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Adınız ve Soyadınız <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Mehmet Öztürk"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-Posta Adresiniz (Giriş için) <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="esnaf@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cep Telefonunuz (WhatsApp & SMS)
                  </label>
                  <input
                    type="tel"
                    placeholder="05XX XXX XX XX"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Giriş Şifresi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="En az 6 karakter"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  Dükkan Bilgilerine İlerle ➔
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Dükkan Bilgileri */}
          {step === 2 && (
            <form onSubmit={handleNextStep2} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dükkan / İşletme Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Güven Market, Yıldız Kırtasiye, Şık Butik"
                  value={storeName}
                  onChange={e => setStoreName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                />
                <p className="text-[11px] text-slate-500 mt-1">Bu isim fişlerde ve raf etiketlerinizde görünecektir.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Şehir ve Adres (İsteğe bağlı)
                </label>
                <textarea
                  rows={2}
                  placeholder="Örn: Kadıköy Çarşı İçi No:14, İstanbul"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-xl transition-all"
                >
                  ⬅ Geri
                </button>
                <button
                  type="submit"
                  className="flex-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  Sektör Seçimine İlerle ➔
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Sektör Seçimi & Şablon Kataloğu */}
          {step === 3 && (
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                İşletmenizin Ana Faaliyet Sektörü:
              </label>

              <div className="space-y-2">
                {sectorOptions.map(opt => (
                  <div
                    key={opt.id}
                    onClick={() => setSector(opt.id)}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                      sector === opt.id
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="text-2xl p-2 bg-white rounded-xl shadow-sm border border-slate-100 flex-shrink-0">
                      {opt.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900">{opt.title}</h4>
                        <input
                          type="radio"
                          name="sector"
                          checked={sector === opt.id}
                          onChange={() => setSector(opt.id)}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                        />
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{opt.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Seed Template Checkbox */}
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl flex items-center gap-3">
                <input
                  type="checkbox"
                  id="seedTemplate"
                  checked={seedTemplate}
                  onChange={e => setSeedTemplate(e.target.checked)}
                  className="h-5 w-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="seedTemplate" className="text-xs text-amber-900 font-medium cursor-pointer">
                  <span className="font-bold text-amber-950">Örnek Sektörel Ürün Kataloğu Yüklensin mi?</span>
                  <br />
                  Seçtiğiniz sektöre uygun en çok satan barkodlu ürünler hazır tanımlı olarak gelir, hemen sayıma ve satışa başlayabilirsiniz.
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-xl transition-all"
                >
                  ⬅ Geri
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCompleteRegister}
                  className="flex-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-3.5 px-6 rounded-xl shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? 'Dükkanınız Kuruluyor...' : '🚀 14 Gün Ücretsiz Başlat'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-600 flex items-center justify-center gap-1">
          Zaten hesabınız var mı?
          <button
            onClick={() => {
              onClose();
              onOpenLogin();
            }}
            className="text-emerald-700 font-bold hover:underline"
          >
            Giriş Yapın
          </button>
        </div>
      </div>
    </div>
  );
}
