'use client';

import React, { useState } from 'react';
import {
  Store as StoreIcon,
  Lock,
  Mail,
  Phone,
  User as UserIcon,
  Building2,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Globe,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { User, StoreSector, Store as DbStore } from '@/lib/db';

interface MobileAuthScreenProps {
  onSuccess: (user: User, store: DbStore) => void;
  onOpenLandingSite: () => void;
}

export default function MobileAuthScreen({ onSuccess, onOpenLandingSite }: MobileAuthScreenProps) {
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [step, setStep] = useState<'FORM' | 'OTP'>('FORM');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [phone, setPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [sector, setSector] = useState<StoreSector>('MARKET');

  // OTP Verification State
  const [otpCode, setOtpCode] = useState('');
  const [otpPurpose, setOtpPurpose] = useState<'REGISTER_VERIFICATION' | 'LOGIN_2FA'>('LOGIN_2FA');
  const [maskedContact, setMaskedContact] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  // 1. Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Giriş yapılamadı.');
      }

      if (data.require2FA) {
        setOtpPurpose('LOGIN_2FA');
        setMaskedContact(data.maskedEmail || email);
        setDevCode(data.devCode || null);
        setStep('OTP');
        setSuccessToast('6 haneli güvenlik kodu e-posta adresinize (SMS altyapısı hazır) iletildi.');
      } else {
        onSuccess(data.user, data.store);
      }
    } catch (err: any) {
      setError(err.message || 'Giriş yapılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Submit Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          seedTemplate: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Kayıt işlemi başarısız.');
      }

      if (data.requireVerification) {
        setOtpPurpose('REGISTER_VERIFICATION');
        setMaskedContact(data.maskedEmail || email);
        setDevCode(data.devCode || null);
        setStep('OTP');
        setSuccessToast('Hesabınız oluşturuldu! Lütfen e-postanıza gönderilen doğrulama kodunu giriniz.');
      } else {
        onSuccess(data.user, data.store);
      }
    } catch (err: any) {
      setError(err.message || 'Kayıt sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Verify OTP Code
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
          purpose: otpPurpose,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Doğrulama kodu geçersiz.');
      }

      onSuccess(data.user, data.store);
    } catch (err: any) {
      setError(err.message || 'Kod doğrulanamadı.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Resend Code
  const handleResendCode = async () => {
    setResending(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: otpPurpose }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tekrar gönderilemedi');
      setDevCode(data.devCode || null);
      setSuccessToast('Yeni doğrulama kodu başarıyla gönderildi.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  // Quick Demo Login helper
  const handleQuickDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setLoading(true);
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: demoEmail, password: demoPass }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.require2FA) {
          setOtpPurpose('LOGIN_2FA');
          setMaskedContact(d.maskedEmail || demoEmail);
          setStep('OTP');
          setSuccessToast('6 haneli güvenlik kodu e-posta adresinize iletildi.');
        } else if (d.success) {
          onSuccess(d.user, d.store);
        } else if (d.error) {
          setError(d.error);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 select-none">
      <div className="max-w-md w-full mx-auto my-auto py-6 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-xl shadow-emerald-500/20 border border-emerald-400/30 mb-1">
            <StoreIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            Esnaf<span className="text-emerald-400">Cepte</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
              Mobil Kasa
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            {step === 'OTP'
              ? '2 Adımlı Güvenlik Doğrulaması'
              : authMode === 'LOGIN'
              ? 'Dükkan kasanıza ve stoklarınıza erişin'
              : '14 gün koşulsuz ücretsiz esnaf hesabı açın'}
          </p>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 rounded-2xl text-xs flex items-center gap-2 shadow-lg animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-950/80 border border-red-600/50 text-red-300 rounded-2xl text-xs flex items-center gap-2 shadow-lg animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: FORM (LOGIN OR REGISTER) */}
        {step === 'FORM' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl space-y-5">
            {/* Segmented Mode Selector */}
            <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('LOGIN');
                  setError(null);
                }}
                className={`py-2.5 rounded-xl transition-all ${
                  authMode === 'LOGIN'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Giriş Yap
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('REGISTER');
                  setError(null);
                }}
                className={`py-2.5 rounded-xl transition-all ${
                  authMode === 'REGISTER'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Yeni Kayıt (Ücretsiz)
              </button>
            </div>

            {/* LOGIN FORM */}
            {authMode === 'LOGIN' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    E-Posta Adresi
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="esnaf@ornek.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    Şifre
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Kasa Girişi Yap</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Demo Quick Button */}
                <div className="pt-2 border-t border-slate-800 text-center">
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('demo@esnafcepte.com', '123456')}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors flex items-center justify-center gap-1.5 mx-auto"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Örnek Demo Hesabıyla Hızlı Giriş Yap</span>
                  </button>
                </div>
              </form>
            ) : (
              /* REGISTER FORM */
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Yetkili Adı Soyadı</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="Ahmet Demir"
                      value={userName}
                      onChange={e => setUserName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-xs focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">E-Posta</label>
                    <input
                      type="email"
                      required
                      placeholder="ahmet@gmail.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Telefon (SMS İçin)</label>
                    <input
                      type="tel"
                      placeholder="0532 100 20 30"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Dükkan / İşletme Adı</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="Bereket Süpermarket & Şarküteri"
                      value={storeName}
                      onChange={e => setStoreName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Faaliyet Sektörü</label>
                    <select
                      value={sector}
                      onChange={e => setSector(e.target.value as StoreSector)}
                      className="w-full px-2 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                    >
                      <option value="MARKET">Market / Gıda / Şarküteri</option>
                      <option value="BUTIK_GIYIM">Butik / Giyim / Ayakkabı</option>
                      <option value="KIRTASIYE_TUHAFIYE">Kırtasiye / Tuhafiye</option>
                      <option value="HIRDAVAT">Hırdavat & Yapı Market</option>
                      <option value="DIGER">Diğer Perakende</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Şifre (Min 6 Karakter)</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all mt-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : '14 Gün Ücretsiz Başlat'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* STEP 2: OTP / 2FA VERIFICATION */}
        {step === 'OTP' && (
          <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-5 animate-in zoom-in-95">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/30 mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-black text-white">Güvenlik Doğrulaması</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hesabınızın güvenliği için <strong className="text-white">{maskedContact}</strong> adresine 6 haneli doğrulama kodu gönderildi.
              </p>
            </div>

            {/* Test Helper Badge */}
            {devCode && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center space-y-0.5">
                <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                  ⚡ Test / Geliştirici Doğrulama Kodu:
                </span>
                <span className="font-mono text-xl font-black text-amber-400 tracking-widest">
                  {devCode}
                </span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold text-xs mb-2 text-center">
                  6 Haneli Kodu Giriniz:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  placeholder="------"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full py-3.5 bg-slate-950 border-2 border-emerald-500/50 focus:border-emerald-400 rounded-2xl text-center font-mono text-2xl font-black tracking-[0.5em] text-white focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Kodu Onayla ve Giriş Yap'}
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep('FORM');
                    setOtpCode('');
                  }}
                  className="text-slate-400 hover:text-slate-200"
                >
                  ← Geri Dön
                </button>

                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resending}
                  className="text-emerald-400 hover:text-emerald-300 font-bold"
                >
                  {resending ? 'Gönderiliyor...' : 'Kodu Tekrar Gönder'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* BOTTOM REDIRECTION: TANITIM SİTESİ VE PAKETLER */}
        <div className="pt-6 border-t border-slate-800 text-center space-y-3">
          <button
            type="button"
            onClick={onOpenLandingSite}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-bold transition-all shadow-md group"
          >
            <Globe className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>EsnafCepte Tanıtım & Fiyatları İncele</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </button>

          <p className="text-[11px] text-slate-500">
            İnanoraSoft Bulut Perakende Teknolojileri © 2026 • v1.0.0
          </p>
        </div>

      </div>
    </div>
  );
}
