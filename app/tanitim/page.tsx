'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Tv,
  Smartphone,
  Download,
  Copy,
  Check,
  Sparkles,
  Scale,
  Receipt,
  Store,
  Barcode,
  Share2,
} from 'lucide-react';

interface Scene {
  id: number;
  title: string;
  badge: string;
  duration: number;
  subtitle: string;
  type: 'problem' | 'solution' | 'feature1' | 'feature2' | 'cta';
}

const SCENES: Scene[] = [
  {
    id: 0,
    title: '1. Problem: Eski Yazar Kasalar & Veresiye Çilesi',
    badge: 'Sahne 1 / 5: Problem',
    duration: 8,
    subtitle:
      '"Akşam kasayı kapatırken kuruş kuruş açık aramak, defterde unutulan veresiyeler ve binlerce liralık eski yazar kasalar..."',
    type: 'problem',
  },
  {
    id: 1,
    title: '2. Çözüm: EsnafCepte ile Tanışın',
    badge: 'Sahne 2 / 5: Çözüm',
    duration: 8,
    subtitle:
      '"Artık bitti! Karşınızda İnanoraSoft güvencesiyle EsnafCepte! Cebinizdeki telefon veya tablet, artık en gelişmiş bulut kasanız."',
    type: 'solution',
  },
  {
    id: 2,
    title: '3. Özellik: Dijital Terazi & Mobil Barkod Sayım',
    badge: 'Sahne 3 / 5: Terazi & Barkod',
    duration: 8,
    subtitle:
      '"İster teraziyle kilo işi elma, peynir tartın; ister telefon kamerasıyla reyonlarda saniyede yüzlerce barkod okutun."',
    type: 'feature1',
  },
  {
    id: 3,
    title: '4. Özellik: WhatsApp E-Fiş & Patron Z Raporu',
    badge: 'Sahne 4 / 5: Dijital Fiş & Z Raporu',
    duration: 8,
    subtitle:
      '"Termal kağıt masrafına son! Tek tıkla WhatsApp dijital fiş gönderin. Akşam tek tuşla patron Z raporunuz telefonunuza gelsin."',
    type: 'feature2',
  },
  {
    id: 4,
    title: '5. Harekete Geçirici Çağrı: 14 Gün Ücretsiz Başla',
    badge: 'Sahne 5 / 5: Ücretsiz Başla',
    duration: 8,
    subtitle:
      '"Kredi kartı gerekmeden, 14 gün boyunca dükkanınızda hemen ücretsiz deneyin. EsnafCepte — Perakendede yeni çağ. İnanoraSoft."',
    type: 'cta',
  },
];

export default function TanitimPage() {
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'16-9' | '9-16'>('16-9');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const totalDuration = SCENES.reduce((acc, s) => acc + s.duration, 0);

  // Audio Synth for feedback
  const playSound = (freq: number, type: OscillatorType = 'sine', duration = 0.15) => {
    if (isMuted || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 0.2;
          if (next >= totalDuration) {
            setIsPlaying(false);
            return totalDuration;
          }
          return next;
        });
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isPlaying, totalDuration]);

  // Synchronize scene index based on currentTime
  useEffect(() => {
    let accumulated = 0;
    for (let i = 0; i < SCENES.length; i++) {
      if (currentTime >= accumulated && currentTime < accumulated + SCENES[i].duration) {
        if (currentSceneIdx !== i) {
          setCurrentSceneIdx(i);
          playSound(i === 1 ? 523 : i === 2 ? 880 : 660, 'sine', 0.2);
        }
        break;
      }
      accumulated += SCENES[i].duration;
    }
  }, [currentTime]);

  const togglePlay = () => {
    if (!isPlaying && currentTime >= totalDuration) {
      setCurrentTime(0);
      setCurrentSceneIdx(0);
    }
    setIsPlaying(!isPlaying);
    playSound(440, 'triangle', 0.1);
  };

  const jumpToScene = (idx: number) => {
    let target = 0;
    for (let i = 0; i < idx; i++) {
      target += SCENES[i].duration;
    }
    setCurrentTime(target);
    setCurrentSceneIdx(idx);
    playSound(600, 'sine', 0.1);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const activeScene = SCENES[currentSceneIdx];
  const progressPct = (currentTime / totalDuration) * 100;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-10 h-10 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all"
              title="Kasa Paneline Dön"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg text-white tracking-tight">EsnafCepte</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  İnanoraSoft Prodüksiyon
                </span>
              </div>
              <p className="text-xs text-slate-400">Resmi Tanıtım Videosu & Reklam Materyalleri Kiti</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAspectRatio('16-9')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                aspectRatio === '16-9'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" /> 16:9 Web/YouTube
            </button>
            <button
              onClick={() => setAspectRatio('9-16')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                aspectRatio === '9-16'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" /> 9:16 Reels/TikTok
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10 flex-1 w-full">
        {/* Section 1: Interactive Video Simulator */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
                1. Bölüm • İnteraktif Tanıtım Videosu
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">
                EsnafCepte Lansman Reklam Filmi (40 Saniye)
              </h2>
            </div>
            <span className="text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              Web Audio & Dinamik Sahne Animasyonu
            </span>
          </div>

          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-4 sm:p-6 shadow-2xl">
            <div className="flex flex-col lg:flex-row gap-6 items-center">
              {/* Video Player Display */}
              <div className="w-full lg:w-3/5 flex justify-center">
                <div
                  className={`w-full bg-black rounded-2xl border-2 border-slate-700 overflow-hidden relative shadow-2xl flex flex-col justify-between transition-all duration-300 ${
                    aspectRatio === '9-16' ? 'max-w-[360px] aspect-[9/16]' : 'max-w-[680px] aspect-video'
                  }`}
                >
                  {/* Top Header inside Video */}
                  <div className="relative z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-xs font-black shadow">
                        EC
                      </div>
                      <span className="font-black text-white text-sm tracking-tight drop-shadow">
                        EsnafCepte
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-black/60 border border-white/10 text-[11px] font-mono text-emerald-300 backdrop-blur-md">
                      {activeScene.badge}
                    </span>
                  </div>

                  {/* Dynamic Scene Stage */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center select-none">
                    {activeScene.type === 'problem' && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="w-20 h-20 rounded-3xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center text-3xl mx-auto shadow-lg">
                          🧾
                        </div>
                        <div className="text-xs uppercase font-mono tracking-widest text-red-400 font-bold">
                          Geleneksel Kasa Çilesi
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-white max-w-sm mx-auto">
                          Defterde Unutulan Veresiyeler, Saatler Süren Sayım...
                        </h3>
                        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-mono">
                          <span className="bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
                            ❌ Kağıt Masrafı
                          </span>
                          <span className="bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
                            ❌ Kasa Kaçağı
                          </span>
                        </div>
                      </div>
                    )}

                    {activeScene.type === 'solution' && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center text-4xl shadow-2xl shadow-emerald-500/50 mx-auto animate-pulse">
                          🚀
                        </div>
                        <div className="text-xs uppercase font-mono tracking-widest text-emerald-400 font-bold">
                          İnanoraSoft Gururla Sunar
                        </div>
                        <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                          EsnafCepte
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-300 max-w-xs mx-auto">
                          Perakende Bulut Kasa & Akıllı Stok Yönetimi
                        </p>
                      </div>
                    )}

                    {activeScene.type === 'feature1' && (
                      <div className="space-y-3 animate-fade-in max-w-sm">
                        <div className="w-16 h-16 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center text-3xl mx-auto shadow-md">
                          ⚖️
                        </div>
                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-center shadow-inner">
                          <div className="text-[11px] text-slate-400 uppercase">DİJİTAL TERAZİ TARTIMI</div>
                          <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-wider">
                            1.250 KG
                          </div>
                          <div className="text-xs text-white mt-1">
                            Amasya Elması • Tutar: <strong className="text-emerald-400">56.25 ₺</strong>
                          </div>
                        </div>
                        <p className="text-xs text-slate-300">
                          Telefon kamerası ile reyonlarda anında barkod okuma & sayım!
                        </p>
                      </div>
                    )}

                    {activeScene.type === 'feature2' && (
                      <div className="space-y-3 animate-fade-in max-w-sm">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-3xl mx-auto shadow-md">
                          📲
                        </div>
                        <h4 className="text-xl font-black text-white">WhatsApp Dijital E-Fiş</h4>
                        <div className="bg-emerald-950/50 p-3 rounded-2xl border border-emerald-500/30 text-left text-xs font-mono text-slate-200 space-y-1 shadow">
                          <div className="text-emerald-400 font-bold">📲 WhatsApp Fiş Bildirimi</div>
                          <div>🛒 Toplam: ₺185.00 (3 Kalem)</div>
                          <div>💳 Ödeme: Kredi Kartı (POS)</div>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Akşam patron Z raporu tek tuşla cebinizde.
                        </p>
                      </div>
                    )}

                    {activeScene.type === 'cta' && (
                      <div className="space-y-4 animate-fade-in max-w-sm">
                        <span className="inline-block px-4 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/30">
                          14 Gün Tamamen Ücretsiz
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-black text-white">
                          Dükkanınızı Dijitale Taşıyın!
                        </h3>
                        <p className="text-xs text-slate-300">
                          Kredi kartı gerekmez. Hemen dükkanınızı açın ve test edin.
                        </p>
                        <Link
                          href="/"
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-black text-sm shadow-xl shadow-emerald-500/30 hover:scale-105 transition-all"
                        >
                          <span>Hemen Ücretsiz Başla</span>
                        </Link>
                        <div className="text-[11px] text-slate-500 font-bold">
                          Bir İnanoraSoft İnovasyonudur.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Subtitle Bar */}
                  <div className="relative z-20 p-4 bg-gradient-to-t from-black/95 via-black/80 to-transparent">
                    <div className="bg-black/75 border border-white/10 rounded-xl p-2.5 text-center text-xs sm:text-sm font-semibold text-emerald-200 drop-shadow backdrop-blur-md">
                      {activeScene.subtitle}
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls & Scene Jumps */}
              <div className="w-full lg:w-2/5 space-y-4">
                <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                      <span>{currentTime.toFixed(1)}s</span>
                      <span className="text-emerald-400 font-bold">40.0s</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-150"
                        style={{ width: `${progressPct}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Playback Buttons */}
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => jumpToScene(Math.max(0, currentSceneIdx - 1))}
                      className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-all"
                    >
                      <SkipBack className="w-4 h-4" />
                    </button>
                    <button
                      onClick={togglePlay}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-sm shadow-lg shadow-emerald-500/25 hover:scale-105 transition-all flex items-center gap-2"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      <span>{isPlaying ? 'Durdur' : 'Videoyu Başlat'}</span>
                    </button>
                    <button
                      onClick={() => jumpToScene(Math.min(SCENES.length - 1, currentSceneIdx + 1))}
                      className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-all"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        isMuted
                          ? 'bg-slate-800 text-slate-500'
                          : 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
                      }`}
                      title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Scene Selectors */}
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Sahneler (Tıklayıp Geçin):
                    </span>
                    <div className="grid grid-cols-5 gap-1 text-[10px] font-bold">
                      {SCENES.map((scene, i) => (
                        <button
                          key={scene.id}
                          onClick={() => jumpToScene(i)}
                          className={`p-2 rounded-lg text-center transition-all ${
                            currentSceneIdx === i
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          {i + 1}. {scene.type.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Photorealistic Generated Images */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
                2. Bölüm • Tanıtım & Reklam Görselleri
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">
                Profesyonel Tanıtım Fotoğrafları
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Sosyal medya, reklam kampanyaları ve basılı broşürler için hazır HD fotoğraflar
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Image 1: Retail Shop Owner & Cloud POS */}
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-5 space-y-4 flex flex-col justify-between shadow-xl hover:border-emerald-500/40 transition-all">
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                  Hero Lansman Görseli
                </span>
                <h3 className="font-extrabold text-base text-white">Mutlu Esnaf & Bulut Kasa Tableti</h3>
                <p className="text-xs text-slate-400">
                  Modern butik ve market tezgahında EsnafCepte yeşil kasa arayüzünü gülümseyerek sunan dükkan sahibi.
                </p>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-700 aspect-video relative bg-slate-950">
                <img
                  src="/promo_hero_owner.jpg"
                  alt="EsnafCepte Dükkan Sahibi"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>

              <a
                href="/promo_hero_owner.jpg"
                download="EsnafCepte_Hero_Lansman.jpg"
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5" /> HD Görseli İndir
              </a>
            </div>

            {/* Image 2: Digital Scale & POS Checkout */}
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-5 space-y-4 flex flex-col justify-between shadow-xl hover:border-teal-500/40 transition-all">
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full">
                  Donanım & Terazi Entegrasyonu
                </span>
                <h3 className="font-extrabold text-base text-white">Elektronik Terazi & Akıllı Tezgah</h3>
                <p className="text-xs text-slate-400">
                  Manav ve şarküteri esnafı için terazi tartımı, barkod okuyucu ve temassız POS cihazı yakın çekimi.
                </p>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-700 aspect-video relative bg-slate-950">
                <img
                  src="/promo_scale_checkout.jpg"
                  alt="EsnafCepte Terazi ve Kasa"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>

              <a
                href="/promo_scale_checkout.jpg"
                download="EsnafCepte_Terazi_Kasa.jpg"
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5" /> HD Görseli İndir
              </a>
            </div>

            {/* Image 3: Mobile AI Barcode Scanning */}
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-5 space-y-4 flex flex-col justify-between shadow-xl hover:border-indigo-500/40 transition-all">
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full">
                  Mobil Sayım Vizörü
                </span>
                <h3 className="font-extrabold text-base text-white">Reyonlarda Telefonla Seri Sayım</h3>
                <p className="text-xs text-slate-400">
                  Pahalı el terminallerine son! Akıllı telefon kamerası ile reyonlarda seri barkod okuma ve anlık stok takibi.
                </p>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-700 aspect-video relative bg-slate-950">
                <img
                  src="/promo_mobile_scan.jpg"
                  alt="EsnafCepte Mobil Sayım"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>

              <a
                href="/promo_mobile_scan.jpg"
                download="EsnafCepte_Mobil_Sayim.jpg"
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5" /> HD Görseli İndir
              </a>
            </div>
          </div>
        </section>

        {/* Section 3: Voiceover Script & Copywriting */}
        <section className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
                3. Bölüm • Prodüksiyon Rehberi
              </span>
              <h2 className="text-xl font-black text-white mt-0.5">
                Seslendirme Metinleri (Voiceover Script)
              </h2>
            </div>
            <button
              onClick={() =>
                handleCopy(
                  SCENES.map((s) => `${s.title}\n${s.subtitle}`).join('\n\n'),
                  'allScript'
                )
              }
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
            >
              {copiedText === 'allScript' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText === 'allScript' ? 'Kopyalandı!' : 'Tüm Senaryoyu Kopyala'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {SCENES.map((s) => (
              <div key={s.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-400">
                  <span className="text-emerald-400">{s.title}</span>
                  <span className="font-mono text-[10px]">{s.duration} Saniye</span>
                </div>
                <p className="text-slate-200 italic leading-relaxed">{s.subtitle}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>© 2026 İnanoraSoft. EsnafCepte — Perakende Bulut Kasa & Akıllı Stok Yönetimi.</p>
      </footer>
    </div>
  );
}
