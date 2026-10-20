'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Copy, Check, Sparkles, Smartphone, CreditCard, Layers } from 'lucide-react';

export default function BrosurPage() {
  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const postTexts = {
    1: `Hafta sonu dükkanda A4 kağıtlarıyla sabahlayan perakendecilere selam olsun! ☕📋

1000'den fazla ürün çeşidi olan bir dükkanda sayım yapmak işkence mi?
Kasa sırası bekleyen müşteriye fiş keserken POS cihazına tekrar tekrar tutar yazmaktan yoruldunuz mu?

Karşınızda: EsnafCepte 🚀

Tüm perakende işletmeleri (Market, Butik, Kırtasiye, Hırdavat, Petshop) için geliştirilen yeni nesil bulut kasa ve akıllı sayım platformu:

✅ Mobil Kamera ile Hızlı Sayım: Telefon kamerasını reyonlara tutun, barkodları seri okutun. Sistem farkları ve eksikleri anında çıkarsın.
✅ Otomatik POS Yönlendirme: Kasada 'Kredi Kartı'na basın; tutar anında fiziki POS cihazına yansısın. Hatalı tutar çekimine son!
✅ Akıllı Veresiye Defteri: Borçları defterde unutmayın, tek tıkla müşteriye WhatsApp bakiye hatırlatması gönderin.
✅ Raf & Ürün Etiketi: Barkodu olmayan ürünlere termal veya A4 etiket basın.

👉 Donanım masrafı yok. Kendi telefonunuz veya tabletiniz artık en güçlü yardımcınız.

#Perakende #KasaSistemi #StokYönetimi #EsnafCepte #SaaS #DijitalDönüşüm #POS`,

    2: `Kasada tutar yazarken yapılan 1 liralık hata bile gün sonunda kasanızı bozar! 💳⚡

EsnafCepte ile kasiyer hiçbir zaman POS cihazına elle tutar girmez.

1️⃣ Kasada sepete ürünleri ekleyin.
2️⃣ 'Kredi Kartı (F10)' butonuna basın.
3️⃣ Tutar kablosuz olarak fiziki POS cihazına aktarılsın.
4️⃣ Müşteri kartını dokundursun, satış ve stok otomatik eşitlensin!

İşletmenizi modern ödeme teknolojisiyle buluşturun. Detaylar için DM! 📩

#Fintech #RetailTech #POS #ÖdemeSistemleri #EsnafCepte #BarkodluSatış`,

    3: `Market, Butik, Kırtasiye veya Hırdavat... Her perakendecinin ihtiyacı farklıdır ama ortak bir dertleri vardır: 1000'lerce ürünü kayıpsız yönetmek! 🛒👗📚

EsnafCepte Çok Kiracılı (Multi-Tenant) Bulut Platformu ile her sektör kendi hazır şablonuyla dakikalar içinde açılıyor:

🔹 Market Modu: 10.000 hazır barkodlu ürün kataloğu
🔹 Butik Modu: Renk / Beden / Numara varyant matrisi
🔹 Kırtasiye/Tuhafiye: Kamera ile reyon sayım vizörü
🔹 Hırdavat: Metre, koli, kutu birim dönüşümleri

Bayilik ve çözüm ortaklığı fırsatları için bize ulaşın! 🤝

#Girişimcilik #BulutYazılım #SaaS #Esnaf #B2B #Perakende`
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(postTexts[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const element = document.getElementById(`brochure-canvas-${activeTab}`);
      if (!element) return;

      // Load html2canvas dynamically from CDN if not already loaded
      if (!(window as any).html2canvas) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('html2canvas kütüphanesi yüklenemedi'));
          document.body.appendChild(script);
        });
      }

      const html2canvas = (window as any).html2canvas;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#090d16',
      });

      const image = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = image;
      a.download = `esnafcepte_linkedin_brosur_${activeTab}.png`;
      a.click();
    } catch (e: any) {
      alert('İndirme hatası: ' + e.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8">
      {/* Top Header */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2.5 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Pazarlama Kiti
              </span>
              <span className="text-xs text-slate-400">1080x1350 Dikey (4:5)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5">
              EsnafCepte LinkedIn Broşür Stüdyosu
            </h1>
          </div>
        </div>

        {/* Tab selection */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab(1)}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 1 ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            1. A4 Çilesine Son
          </button>
          <button
            onClick={() => setActiveTab(2)}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 2 ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            2. Otomatik POS
          </button>
          <button
            onClick={() => setActiveTab(3)}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 3 ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            3. Çoklu Sektör & B2B
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-8">
        
        {/* BROCHURE DISPLAY */}
        <div className="relative">

          {/* BROCHURE 1 */}
          <div
            id="brochure-canvas-1"
            className={`w-[360px] sm:w-[480px] h-[540px] sm:h-[620px] rounded-3xl p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between border border-slate-700/60 shadow-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 ${
              activeTab === 1 ? 'block' : 'hidden'
            }`}
          >
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-500/25 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-white text-base shadow-lg shadow-emerald-500/30">
                  EC
                </div>
                <div>
                  <div className="font-black text-sm tracking-wide text-white">EsnafCepte</div>
                  <div className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Akıllı Perakende & Sayım</div>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                A4 Kağıdı Çilesine Son!
              </span>
            </div>

            <div className="relative z-10 my-auto py-1">
              <div className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-indigo-400 mb-1">
                Hafta Sonu Sayım Yapmaktan Yorulmadınız mı?
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                1000+ Ürünü Olan Dükkanlar <br />
                <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  20 Dakikada Nasıl Sayıyor?
                </span>
              </h2>
              <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                Pahalı el terminallerine binlerce lira ödemeyin. Cebinizdeki telefonun kamerasını reyonlara tutun; sayım anında tamamlansın.
              </p>

              <div className="grid grid-cols-2 gap-2.5 mt-3">
                <div className="bg-slate-800/80 border border-rose-500/30 rounded-2xl p-3">
                  <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider block mb-0.5">❌ ESKİ DÜZEN</span>
                  <div className="text-[11px] font-bold text-slate-200">A4 Kağıdıyla Sayım</div>
                  <ul className="text-[10px] text-slate-400 mt-1.5 space-y-0.5">
                    <li>• Saatlerce süren çizelgeler</li>
                    <li>• Karışan barkodlar ve eksikler</li>
                    <li>• Pazartesi bulunamayan açıklar</li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-emerald-950/70 to-slate-800/90 border border-emerald-500/50 rounded-2xl p-3 shadow-lg">
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block mb-0.5">✅ ESNAFCEPTE</span>
                  <div className="text-[11px] font-bold text-white">Mobil Kamera Vizörü</div>
                  <ul className="text-[10px] text-emerald-200/90 mt-1.5 space-y-0.5">
                    <li>• Telefonla 'bip' sesli seri sayım</li>
                    <li>• Sayımı duraklat/sürdür esnekliği</li>
                    <li>• Stokları tek tıkla eşitle</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-3">
                <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-lg text-[9px] font-bold border border-slate-700">📱 Sıfır Donanım</span>
                <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-lg text-[9px] font-bold border border-slate-700">⚡ Anlık Fark</span>
                <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-lg text-[9px] font-bold border border-slate-700">📊 Excel Aktarım</span>
              </div>
            </div>

            <div className="relative z-10 pt-3 border-t border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-extrabold text-white">Hemen Ücretsiz Deneyin</div>
                <div className="text-[10px] text-slate-400">esnafcepte.com • DM'den Bilgi Alın</div>
              </div>
              <div className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/30">
                Keşfet 👉
              </div>
            </div>
          </div>

          {/* BROCHURE 2 */}
          <div
            id="brochure-canvas-2"
            className={`w-[360px] sm:w-[480px] h-[540px] sm:h-[620px] rounded-3xl p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between border border-slate-700/60 shadow-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 ${
              activeTab === 2 ? 'block' : 'hidden'
            }`}
          >
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-white text-base shadow-lg shadow-blue-500/30">
                  EC
                </div>
                <div>
                  <div className="font-black text-sm tracking-wide text-white">EsnafCepte</div>
                  <div className="text-[9px] text-blue-400 font-bold uppercase tracking-wider">Kasa & Ödeme Teknolojisi</div>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Hatalı Tutar Çekimine Son!
              </span>
            </div>

            <div className="relative z-10 my-auto py-1">
              <div className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-emerald-400 mb-1">
                Hızlı Kasa & Fiziki POS Entegrasyonu
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                Kasada Tek Tuşa Basın, <br />
                <span className="bg-gradient-to-r from-blue-400 to-teal-300 bg-clip-text text-transparent">
                  Tutar POS Cihazına Uçsun!
                </span>
              </h2>
              <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                Müşteri kuyruğunda POS makinesine tekrar tekrar fiyat girmeye son. Ekrandan 'Kredi Kartı'na basın; cihaz anında uyansın, kart okutulunca fiş çıksın.
              </p>

              <div className="mt-3 bg-slate-900/90 border border-slate-700 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-bold border-b border-slate-800 pb-1.5">
                  <span className="text-slate-300">Otomatik Ödeme Akışı</span>
                  <span className="text-emerald-400">0.8 Saniyede Provizyon</span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="bg-slate-800/90 p-2 rounded-xl border border-slate-700">
                    <div className="text-sm mb-0.5">💻</div>
                    <div className="font-bold text-[10px] text-white">1. Satışı Bitir</div>
                    <div className="text-[8px] text-slate-400 mt-0.5">F10 Kart Seç</div>
                  </div>
                  <div className="bg-blue-900/40 p-2 rounded-xl border border-blue-500/40">
                    <div className="text-sm mb-0.5">📡</div>
                    <div className="font-bold text-[10px] text-blue-200">2. POS'a Aktar</div>
                    <div className="text-[8px] text-blue-300 mt-0.5">Tutar Otomatik</div>
                  </div>
                  <div className="bg-emerald-900/40 p-2 rounded-xl border border-emerald-500/40">
                    <div className="text-sm mb-0.5">💳</div>
                    <div className="font-bold text-[10px] text-emerald-200">3. Temassız Çek</div>
                    <div className="text-[8px] text-emerald-300 mt-0.5">Stok Otomatik Düş</div>
                  </div>
                </div>

                <div className="bg-purple-950/40 border border-purple-500/30 rounded-xl p-2 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-purple-200">📖 Akıllı Veresiye & WhatsApp</div>
                    <div className="text-[8px] text-purple-300">Borçlara tek tıkla nazik WhatsApp hatırlatması.</div>
                  </div>
                  <span className="px-2 py-0.5 bg-purple-600 text-white font-bold text-[9px] rounded-lg">WhatsApp</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-3 border-t border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-extrabold text-white">Tüm Banka & ÖKC POS'ları ile Uyumlu</div>
                <div className="text-[10px] text-slate-400">Beko • Ingenico • Hugin • Verifone • Android POS</div>
              </div>
              <div className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-500/30">
                Bilgi Al 👉
              </div>
            </div>
          </div>

          {/* BROCHURE 3 */}
          <div
            id="brochure-canvas-3"
            className={`w-[360px] sm:w-[480px] h-[540px] sm:h-[620px] rounded-3xl p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between border border-slate-700/60 shadow-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 ${
              activeTab === 3 ? 'block' : 'hidden'
            }`}
          >
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-white text-base shadow-lg shadow-emerald-500/30">
                  EC
                </div>
                <div>
                  <div className="font-black text-sm tracking-wide text-white">EsnafCepte</div>
                  <div className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Bulut B2B Perakende Platformu</div>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Tüm Perakende İçin Tek Çözüm
              </span>
            </div>

            <div className="relative z-10 my-auto py-1">
              <div className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-teal-400 mb-1">
                Marketten Butiğe, Kırtasiyeden Hırdavata
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                Her Sektör İçin <br />
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-300 bg-clip-text text-transparent">
                  Özelleştirilmiş Akıllı Kasa
                </span>
              </h2>
              <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                Kırtasiye ve tuhafiye varyantları mı? Marketin 10.000 hazır barkodu mu? Nalburiye metre/koli hesapları mı? Her işletmeye hazır özel şablon.
              </p>

              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="bg-slate-800/90 border border-slate-700 p-2 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">🛒</span>
                    <span className="font-bold text-[11px] text-white">Market & Büfe</span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-0.5">10.000 hazır barkod, gramajlı/paketli hızlı kasa.</p>
                </div>

                <div className="bg-slate-800/90 border border-slate-700 p-2 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">👗</span>
                    <span className="font-bold text-[11px] text-white">Butik & Giyim</span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-0.5">Renk, Beden, Numara varyant yönetimi.</p>
                </div>

                <div className="bg-slate-800/90 border border-slate-700 p-2 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">📚</span>
                    <span className="font-bold text-[11px] text-white">Kırtasiye & Tuhafiye</span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-0.5">A4 sayım çilesine son veren kamera vizörü.</p>
                </div>

                <div className="bg-slate-800/90 border border-slate-700 p-2 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">🔧</span>
                    <span className="font-bold text-[11px] text-white">Hırdavat & Nalburiye</span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-0.5">Metre, paket, koli birim dönüşümü ve raf etiketi.</p>
                </div>
              </div>

              <div className="mt-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2 text-center">
                <span className="text-[10px] font-bold text-emerald-300">
                  🔒 Multi-Tenant İzolasyon: Her dükkanın verisi %100 gizli ve bağımsızdır.
                </span>
              </div>
            </div>

            <div className="relative z-10 pt-3 border-t border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-extrabold text-white">Bayilik & Çözüm Ortaklığı Fırsatı</div>
                <div className="text-[10px] text-slate-400">Esnafı dijitalleştiren tarafta yerinizi alın.</div>
              </div>
              <div className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/30">
                Bayi Olun 👉
              </div>
            </div>
          </div>

        </div>

        {/* CONTROLS */}
        <div className="w-full lg:w-80 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-400" />
              Broşürü İndir
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              LinkedIn postları için optimize edilmiş yüksek çözünürlüklü PNG görseli oluşturun.
            </p>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {downloading ? 'Görsel Hazırlanıyor...' : 'Görsel Olarak İndir (PNG)'}
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">LinkedIn Paylaşım Metni</h4>
              <button
                onClick={handleCopy}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Kopyalandı' : 'Kopyala'}
              </button>
            </div>
            <textarea
              readOnly
              rows={8}
              value={postTexts[activeTab]}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-300 font-mono resize-none focus:outline-none"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
