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
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
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

  // OTP State
  const [otpCode, setOtpCode] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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

      if (data.requireVerification) {
        setMaskedEmail(data.maskedEmail || email);
        setDevCode(data.devCode || null);
        setStep(4);
      } else {
        onSuccess(data.user, data.store);
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız oldu.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.trim().length !== 6) {
      setError('Lütfen 6 haneli doğrulama kodunu eksiksiz giriniz.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: otpCode.trim(),
          purpose: 'REGISTER_VERIFICATION',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Doğrulama kodu geçersiz.');
      }

      onSuccess(data.user, data.store);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Doğrulama hatası.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'REGISTER_VERIFICATION', channel: 'EMAIL' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kod gönderilemedi.');
      if (data.devCode) setDevCode(data.devCode);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kod tekrar gönderilemedi.');
    } finally {
      setResending(false);
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh] my-auto"
        onClick={e => e.stopPropagation()}
      >
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
            <div className="w-6 h-0.5 bg-emerald-400/40" />
            <div className={`flex items-center gap-2 text-xs font-bold ${step >= 2 ? 'text-white' : 'text-emerald-300/60'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-white text-emerald-700' : 'bg-emerald-800 text-white'}`}>2</span>
              Dükkan
            </div>
            <div className="w-6 h-0.5 bg-emerald-400/40" />
            <div className={`flex items-center gap-2 text-xs font-bold ${step >= 3 ? 'text-white' : 'text-emerald-300/60'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 3 ? 'bg-white text-emerald-700' : 'bg-emerald-800 text-white'}`}>3</span>
              Sektör
            </div>
            <div className="w-6 h-0.5 bg-emerald-400/40" />
            <div className={`flex items-center gap-2 text-xs font-bold ${step === 4 ? 'text-white' : 'text-emerald-300/60'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 4 ? 'bg-white text-emerald-700' : 'bg-emerald-800 text-white'}`}>4</span>
              Doğrulama
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

          {/* STEP 4: 6 Haneli Aktivasyon Doğrulama Kodu */}
          {step === 4 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 leading-relaxed">
                <div className="font-bold flex items-center gap-1.5 text-emerald-800 text-sm mb-1.5">
                  <span>✉️</span>
                  <span>E-Posta Doğrulama Kodu</span>
                </div>
                <span>
                  Hesabınızı ve dükkanınızı aktifleştirmek için <strong>{maskedEmail}</strong> adresinize gönderilen 6 haneli doğrulama kodunu giriniz.
                </span>
              </div>

              {resendSuccess && (
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs flex items-center gap-2">
                  <span>✅</span>
                  <span>Yeni doğrulama kodu başarıyla iletildi.</span>
                </div>
              )}

              {devCode && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
                  <span>🛠️ Test Doğrulama Kodu:</span>
                  <span className="font-mono font-black text-amber-950 text-sm tracking-widest bg-amber-200/70 px-2 py-0.5 rounded">
                    {devCode}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  6 Haneli Güvenlik Kodu
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="000000"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-[0.5em] font-mono text-2xl font-black py-3 rounded-2xl border-2 border-slate-300 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-slate-900"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-xl transition-all"
                >
                  ⬅ Geri
                </button>
                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  className="flex-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-3.5 px-6 rounded-xl shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? 'Doğrulanıyor...' : 'Dükkanımı Aktifleştir'}
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending}
                  className="text-xs text-emerald-700 hover:underline font-bold disabled:opacity-50"
                >
                  {resending ? 'Kod Gönderiliyor...' : 'Doğrulama Kodunu Tekrar Gönder'}
                </button>
              </div>
            </form>
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
