'use client';

import React, { useState } from 'react';
import { StoreSector } from '@/lib/db';

interface LandingViewProps {
  onOpenRegister: () => void;
  onOpenLogin: () => void;
  onEnterLiveDemo: (sector?: StoreSector) => void;
  onOpenBrochures: () => void;
}

export default function LandingView({
  onOpenRegister,
  onOpenLogin,
  onEnterLiveDemo,
  onOpenBrochures,
}: LandingViewProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  const faqs = [
    {
      q: 'Kayıt olurken kredi kartı girmem gerekiyor mu?',
      a: 'Kesinlikle hayır! 14 günlük deneme sürümünü başlatmak için hiçbir kart bilgisi gerekmez. Süre sonunda dilediğiniz paketi seçebilirsiniz.',
    },
    {
      q: 'Dükkanımda 5.000 ürün var, bunları tek tek mi kaydedeceğim?',
      a: 'Hayır. Kayıt olurken sektörünüzü (Market, Kırtasiye, Butik, Hırdavat) seçtiğinizde en çok satan hazır ürünler otomatik dükkanınıza tanımlanır. Ayrıca elinizdeki Excel veya toptancı faturasını Akıllı İçe Aktarma Sihirbazı ile 1 dakikada yükleyebilirsiniz.',
    },
    {
      q: 'Pahalı bir el terminali veya kablolu barkod okuyucu almam gerekir mi?',
      a: 'Gerekmez! Cep telefonunuzun kamerası, yapay zeka destekli vizör sayesinde 1 saniyede barkod tanır. Dükkandaki tüm personelin telefonunu el terminaline dönüştürebilirsiniz.',
    },
    {
      q: 'Fiziki POS cihazına tutar nasıl gönderilir?',
      a: 'EsnafCepte, Wi-Fi ve Bluetooth destekli yeni nesil Android POS terminalleriyle (Beko, Ingenico, Pax vb.) doğrudan haberleşir. Kasada "Fiziki POS ile Öde" dediğinizde çekilecek tutar POS ekranına anında düşer, elle tutar yazıp sıfır atlama riski biter.',
    },
    {
      q: 'Birden fazla personelim aynı anda sayım veya satış yapabilir mi?',
      a: 'Evet! Bulut mimarimiz sayesinde aynı anda iki çalışanınız farklı reyonlarda mobil kamera ile sayım yaparken, siz kasada barkod okutarak satış yapabilirsiniz. Stoklar anlık eşitlenir.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold py-2.5 px-4 text-center flex items-center justify-center gap-2">
        <span>🎉</span>
        <span>Türkiye&apos;nin ilk Perakende ve Esnaf Odaklı Hibrit Bulut POS Sistemi — Kredi Kartsız 14 Gün Ücretsiz Deneyin!</span>
        <button
          onClick={onOpenRegister}
          className="ml-2 underline font-black hover:text-emerald-100"
        >
          Hemen Katılın ➔
        </button>
      </div>

      {/* Main Navigation */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 text-2xl font-black">
              EC
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                EsnafCepte
                <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Cloud POS
                </span>
              </span>
              <p className="text-[11px] text-slate-400 -mt-0.5 hidden sm:block">
                Akıllı Stok & POS Platformu
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#ozellikler" className="hover:text-emerald-400 transition-colors">Özellikler</a>
            <a href="#sektorler" className="hover:text-emerald-400 transition-colors">Sektörler</a>
            <a href="#fiyatlar" className="hover:text-emerald-400 transition-colors">Paketler & Fiyatlar</a>
            <a href="#sss" className="hover:text-emerald-400 transition-colors">SSS</a>
            <a
              href="/tanitim"
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold"
            >
              <span>🎬</span> Tanıtım Videosu
            </a>
            <button
              onClick={onOpenBrochures}
              className="hover:text-emerald-300 flex items-center gap-1"
            >
              <span>📢</span> Broşürler
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onEnterLiveDemo()}
              className="hidden lg:flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs transition-all"
            >
              <span>👁️</span> Canlı Demoyu Aç
            </button>
            <button
              onClick={onOpenLogin}
              className="text-slate-300 hover:text-white font-bold text-xs px-3 py-2 rounded-xl transition-colors"
            >
              Giriş Yap
            </button>
            <button
              onClick={onOpenRegister}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
            >
              14 Gün Ücretsiz Başla
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute -top-10 left-10 w-72 h-72 bg-teal-500/10 blur-[90px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 px-4 py-1.5 rounded-full text-xs font-semibold text-emerald-400 mb-6 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Tüm Perakende Sektörleri İçin Hibrit Çözüm
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-tight">
            Hafta Sonu A4 Kağıtla Sayım Çilesine ve{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              Kasada Hatalı POS Çekimine Son!
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Telefonunuz saniyeler içinde <strong className="text-white">akıllı el terminaline</strong> ve{' '}
            <strong className="text-white">kablosuz POS kasasına</strong> dönüşür.
            Kırtasiyeden süpermarkete, butikten hırdavata tüm esnafın stok ve veresiye kontrolü artık cebinde.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onOpenRegister}
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-base font-black px-8 py-4 rounded-2xl shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 flex items-center justify-center gap-3"
            >
              <span>🚀</span> 14 Gün Koşulsuz Ücretsiz Dene
            </button>
            <button
              onClick={() => onEnterLiveDemo()}
              className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-base font-bold px-8 py-4 rounded-2xl transition-all flex items-center justify-center gap-3"
            >
              <span>🎮</span> Canlı Demo Kasasını Aç
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-400 font-bold">✓</span> Kredi Kartı İstemez
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-400 font-bold">✓</span> 60 Saniyede Kurulum
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-400 font-bold">✓</span> Donanım Masrafı Sıfır
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-400 font-bold">✓</span> Hazır Sektörel Katalog
            </span>
          </div>

          {/* Hero Visual Mockup Preview */}
          <div className="mt-14 max-w-5xl mx-auto rounded-3xl p-3 bg-gradient-to-b from-slate-700/50 to-slate-800/20 border border-slate-700 shadow-2xl backdrop-blur">
            <div className="bg-slate-950 rounded-2xl p-4 sm:p-6 border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs text-slate-400 ml-2 font-mono">esnafcepte.com/kasa-canli-demo</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Bulut Veritabanı Aktif
                </div>
              </div>

              {/* 3 Mockup Highlight Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-bold text-emerald-400">📸 Kamera Sayım Vizörü</span>
                    <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px]">Aktif</span>
                  </div>
                  <div className="h-28 bg-slate-950 rounded-lg border border-slate-800/80 flex flex-col items-center justify-center p-2 text-center relative overflow-hidden">
                    <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-0.5 bg-red-500/80 shadow-[0_0_8px_red] animate-pulse" />
                    <p className="text-xs font-mono text-slate-300">Barkod Taranıyor...</p>
                    <p className="text-[11px] text-emerald-400 font-bold mt-1">8690637011019 [Bulundu]</p>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">Durdur, çayını iç, sonra kaldığın raftan devam et.</p>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-bold text-sky-400">💳 Fiziki POS Tutar İtişi</span>
                    <span className="bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded text-[10px]">Kablosuz</span>
                  </div>
                  <div className="h-28 bg-slate-950 rounded-lg border border-slate-800/80 flex flex-col items-center justify-center p-2 text-center">
                    <p className="text-[11px] text-slate-400">POS Ekranına Yansıtılan Tutar:</p>
                    <p className="text-2xl font-black text-white mt-1">₺ 845,50</p>
                    <p className="text-[10px] text-sky-400 font-semibold mt-1">✓ Temassız Kart Bekleniyor...</p>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">Elle tuşlama yok, 100 TL yerine 10 TL çekme riski sıfır.</p>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-bold text-amber-400">💬 WhatsApp Veresiye</span>
                    <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded text-[10px]">Tek Tık</span>
                  </div>
                  <div className="h-28 bg-slate-950 rounded-lg border border-slate-800/80 flex flex-col items-center justify-center p-2 text-center">
                    <p className="text-xs font-semibold text-slate-200">Müşteri: Mehmet Bey</p>
                    <p className="text-sm font-black text-amber-400 mt-1">Toplam Borç: ₺ 1.420,00</p>
                    <span className="mt-1 inline-flex items-center gap-1 text-[10px] bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-bold">
                      WhatsApp ile Hatırlat
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">Defter kayboldu, borç silindi derdine son.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sektörler Bölümü */}
      <section id="sektorler" className="py-20 bg-slate-950/80 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-2">
              SEKTÖREL ÇÖZÜMLER
            </h2>
            <h3 className="text-3xl sm:text-4xl font-black text-white">
              Her Esnafın Dili ve Rafı Farklıdır
            </h3>
            <p className="text-slate-400 mt-3 text-base">
              Kırtasiyenin varyantı dikiş ipliğidir, butiğin bedendir, marketin ise gramaj ve son kullanma tarihidir.
              EsnafCepte dükkanınıza göre şekil alır.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Sektör 1: Market */}
            <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-6 rounded-3xl transition-all group flex flex-col justify-between">
              <div>
                <div className="text-4xl mb-4 p-3 bg-emerald-500/10 w-fit rounded-2xl text-emerald-400 group-hover:scale-110 transition-transform">
                  🛒
                </div>
                <h4 className="text-xl font-bold text-white mb-2">Market & Bakkal</h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  10.000+ barkodlu hazır ürün veri tabanı. Yoğurt, süt, ekmek ve tekel ürünlerinde ışık hızında kasa okuması ve terazi entegrasyonu.
                </p>
                <ul className="text-xs text-slate-300 space-y-1.5 mb-6">
                  <li className="flex items-center gap-1.5">✓ Hazır temel gıda kataloğu</li>
                  <li className="flex items-center gap-1.5">✓ Hızlı nakit/kart satışı</li>
                  <li className="flex items-center gap-1.5">✓ Kritik stok uyarıları</li>
                </ul>
              </div>
              <button
                onClick={() => onEnterLiveDemo('MARKET')}
                className="w-full bg-slate-800 hover:bg-emerald-600 hover:text-white text-emerald-400 font-bold py-2.5 rounded-xl text-xs transition-colors"
              >
                Market Demosunu Aç ➔
              </button>
            </div>

            {/* Sektör 2: Butik */}
            <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-6 rounded-3xl transition-all group flex flex-col justify-between">
              <div>
                <div className="text-4xl mb-4 p-3 bg-fuchsia-500/10 w-fit rounded-2xl text-fuchsia-400 group-hover:scale-110 transition-transform">
                  👗
                </div>
                <h4 className="text-xl font-bold text-white mb-2">Butik & Giyim</h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Beden (S, M, L, XL) ve Renk varyantı yönetimi. Askıdaki ürünler için tek tıkla şık fiyat ve barkod etiketi basımı.
                </p>
                <ul className="text-xs text-slate-300 space-y-1.5 mb-6">
                  <li className="flex items-center gap-1.5">✓ Beden ve Renk kırılımları</li>
                  <li className="flex items-center gap-1.5">✓ Askı ve raf etiket baskısı</li>
                  <li className="flex items-center gap-1.5">✓ Sezonluk stok temizliği</li>
                </ul>
              </div>
              <button
                onClick={() => onEnterLiveDemo('BUTIK_GIYIM')}
                className="w-full bg-slate-800 hover:bg-fuchsia-600 hover:text-white text-fuchsia-400 font-bold py-2.5 rounded-xl text-xs transition-colors"
              >
                Butik Demosunu Aç ➔
              </button>
            </div>

            {/* Sektör 3: Kırtasiye */}
            <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-6 rounded-3xl transition-all group flex flex-col justify-between">
              <div>
                <div className="text-4xl mb-4 p-3 bg-amber-500/10 w-fit rounded-2xl text-amber-400 group-hover:scale-110 transition-transform">
                  📚
                </div>
                <h4 className="text-xl font-bold text-white mb-2">Kırtasiye & Tuhafiye</h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Okul sezonunda yüzlerce çeşit kalem, defter ve iplik bobinini kaybolmadan sayın. Toptancı listelerini anında içeri aktarın.
                </p>
                <ul className="text-xs text-slate-300 space-y-1.5 mb-6">
                  <li className="flex items-center gap-1.5">✓ İplik no, renk ve defter tipi</li>
                  <li className="flex items-center gap-1.5">✓ Toptancı Excel yükleme</li>
                  <li className="flex items-center gap-1.5">✓ Sezonluk sayım raporları</li>
                </ul>
              </div>
              <button
                onClick={() => onEnterLiveDemo('KIRTASIYE_TUHAFIYE')}
                className="w-full bg-slate-800 hover:bg-amber-600 hover:text-white text-amber-400 font-bold py-2.5 rounded-xl text-xs transition-colors"
              >
                Kırtasiye Demosunu Aç ➔
              </button>
            </div>

            {/* Sektör 4: Hırdavat */}
            <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-6 rounded-3xl transition-all group flex flex-col justify-between">
              <div>
                <div className="text-4xl mb-4 p-3 bg-cyan-500/10 w-fit rounded-2xl text-cyan-400 group-hover:scale-110 transition-transform">
                  🔧
                </div>
                <h4 className="text-xl font-bold text-white mb-2">Hırdavat & Nalburiye</h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Adet, metre ve kilo bazlı satış. El aletleri, yapıştırıcılar, boya ve civata çeşitlerinde eksik stok tespiti.
                </p>
                <ul className="text-xs text-slate-300 space-y-1.5 mb-6">
                  <li className="flex items-center gap-1.5">✓ Metre / Adet / Kilo birimleri</li>
                  <li className="flex items-center gap-1.5">✓ Usta veresiye defteri</li>
                  <li className="flex items-center gap-1.5">✓ Dayanıklı raf etiketleri</li>
                </ul>
              </div>
              <button
                onClick={() => onEnterLiveDemo('HIRDAVAT')}
                className="w-full bg-slate-800 hover:bg-cyan-600 hover:text-white text-cyan-400 font-bold py-2.5 rounded-xl text-xs transition-colors"
              >
                Hırdavat Demosunu Aç ➔
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Temel Özellikler / Problem & Çözüm */}
      <section id="ozellikler" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-2">
              NEDEN ESNAFCEPTE?
            </h2>
            <h3 className="text-3xl sm:text-4xl font-black text-white">
              Eski Yöntemler Sizi Zarara Uğratır
            </h3>
            <p className="text-slate-400 mt-3 text-base">
              A4 kağıda elle çentik atılan sayımlar, kasada elle tutar yazılan POS cihazları ve unutulan veresiye borçları her ay binlerce lira kaçak demektir.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-3xl p-8 flex gap-6 items-start">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl flex-shrink-0">
                📸
              </div>
              <div>
                <h4 className="text-xl font-bold text-white mb-2">
                  Mobil Kamera Vizörü ile Sayım
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed mb-3">
                  Pahalı el terminalleri kiralamayın. Telefonunuzun kamerasını rafa tutun; otomatik vizör barkodu anında okur, adetleri toplar.
                  Sayımı istediğiniz an durdurun, müşteri gelince satışınızı yapın, sonra kaldığınız yerden devam edin.
                </p>
                <span className="text-xs font-semibold text-emerald-400">
                  ⚡ 500 ürünlük reyon sayımı 8 dakikaya iner.
                </span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-3xl p-8 flex gap-6 items-start">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center text-3xl flex-shrink-0">
                💳
              </div>
              <div>
                <h4 className="text-xl font-bold text-white mb-2">
                  Fiziki POS Cihazına Otomatik Tutar İtişi
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed mb-3">
                  Kasada sepet tutarı 845,50 TL çıktı. Kasiyer POS cihazına bunu elle yazmak zorunda kalmaz.
                  &quot;Fiziki POS ile Öde&quot; butonuna basıldığı an tutar kablosuz olarak cihazın ekranına yansır.
                </p>
                <span className="text-xs font-semibold text-sky-400">
                  ⚡ Sıfır atlama, eksik çekim ve gün sonu kasa açığına son.
                </span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-3xl p-8 flex gap-6 items-start">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-3xl flex-shrink-0">
                💬
              </div>
              <div>
                <h4 className="text-xl font-bold text-white mb-2">
                  WhatsApp Entegre Veresiye Defteri
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed mb-3">
                  Mahalle esnafının güven ilişkisini dijitale taşıdık. Veresiye satış anında müşterinin bakiyesine eklenir.
                  Tek tıkla müşteriye WhatsApp üzerinden nazik ve profesyonel hesap özeti gönderilir.
                </p>
                <span className="text-xs font-semibold text-amber-400">
                  ⚡ Tahsilat hızınız %40 oranında artar.
                </span>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-3xl p-8 flex gap-6 items-start">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center text-3xl flex-shrink-0">
                🏷️
              </div>
              <div>
                <h4 className="text-xl font-bold text-white mb-2">
                  Standart A4 & Termal Raf Etiketi Basımı
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed mb-3">
                  Binlerce liralık endüstriyel etiket makinesi almanıza gerek yok. Kırtasiyeden alacağınız 24&apos;lü veya 40&apos;lı standart yapışkanlı A4 kağıda ya da elinizdeki termal fiş yazıcısına dükkan logolu fiyat etiketlerini hemen basın.
                </p>
                <span className="text-xs font-semibold text-purple-400">
                  ⚡ Raftaki fiyat ile kasadaki fiyat her zaman eşit kalır.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fiyatlandırma & Paketler Bölümü */}
      <section id="fiyatlar" className="py-20 bg-slate-950/80 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-2">
              ŞEFFAF VE ESNAF DOSTU FİYATLAR
            </h2>
            <h3 className="text-3xl sm:text-4xl font-black text-white">
              Sürpriz Yok. Yıllık Bağlayıcılık Yok.
            </h3>
            <p className="text-slate-400 mt-3 text-base">
              İlk 14 gün boyunca tüm özellikler sınırsız ve ücretsiz. Memnun kalmazsanız tek kuruş ödemezsiniz.
            </p>

            {/* Billing Cycle Switch */}
            <div className="inline-flex items-center bg-slate-900 border border-slate-700 p-1.5 rounded-2xl mt-6">
              <button
                onClick={() => setBillingCycle('MONTHLY')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  billingCycle === 'MONTHLY'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Aylık Ödeme
              </button>
              <button
                onClick={() => setBillingCycle('YEARLY')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  billingCycle === 'YEARLY'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Yıllık Ödeme
                <span className="bg-emerald-950 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-black">
                  %20 İndirimli
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* PLAN 1: Başlangıç */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div>
                <div className="inline-block bg-slate-800 text-slate-300 text-xs font-bold px-3 py-1 rounded-full mb-4">
                  Küçük Esnaf İçin
                </div>
                <h4 className="text-2xl font-black text-white">Başlangıç</h4>
                <p className="text-xs text-slate-400 mt-1">Tek şube ve temel stok-kasa ihtiyacı olan işletmeler için.</p>

                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white">
                    ₺{billingCycle === 'MONTHLY' ? '499' : '399'}
                  </span>
                  <span className="text-xs text-slate-400">/ ay + KDV</span>
                </div>

                <ul className="mt-8 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span> 1 Dükkan & 1 Kasiyer Hesabı
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span> Mobil Kamera ile Sınırsız Sayım
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span> 1.500 Ürün Kapasitesi
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span> WhatsApp Veresiye Defteri (50 Müşteri)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span> Standart A4 Raf Etiket Basımı
                  </li>
                  <li className="flex items-center gap-2 text-slate-500 line-through">
                    ✗ Fiziki POS Otomatik Tutar İtişi
                  </li>
                  <li className="flex items-center gap-2 text-slate-500 line-through">
                    ✗ Çoklu Kullanıcı Eşzamanlı Sayım
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800">
                <button
                  onClick={onOpenRegister}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 px-4 rounded-xl text-xs transition-all"
                >
                  14 Gün Ücretsiz Başlat ➔
                </button>
              </div>
            </div>

            {/* PLAN 2: Büyüyen Esnaf (POPÜLER) */}
            <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/40 border-2 border-emerald-500 rounded-3xl p-8 flex flex-col justify-between relative shadow-2xl shadow-emerald-950/60 transform lg:-translate-y-3">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-[11px] uppercase tracking-wider px-4 py-1 rounded-full shadow-lg">
                ★ EN ÇOK TERCİH EDİLEN
              </div>

              <div>
                <div className="inline-block bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full mb-4">
                  Yoğun Perakende İçin
                </div>
                <h4 className="text-2xl font-black text-white">Büyüyen Esnaf</h4>
                <p className="text-xs text-slate-300 mt-1">POS cihazı kullanan, personeli olan ve hızlı satış yapan işletmeler.</p>

                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-4xl font-black text-emerald-400">
                    ₺{billingCycle === 'MONTHLY' ? '999' : '799'}
                  </span>
                  <span className="text-xs text-slate-400">/ ay + KDV</span>
                </div>

                <ul className="mt-8 space-y-3 text-xs text-slate-200">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span> <strong>3 Kullanıcı</strong> & Eşzamanlı Sayım
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span> <strong>Fiziki POS Kablosuz Tutar Aktarımı</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span> <strong>Sınırsız</strong> Ürün & Varyant Takibi
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span> Sınırsız Veresiye Müşterisi & WhatsApp Ekstresi
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span> A4 + 50x30mm <strong>Termal Rulo Raf Etiketi</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span> Excel/CSV Akıllı İçe Aktarma Sihirbazı
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span> Öncelikli Telefon & Canlı Destek
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-emerald-900/50">
                <button
                  onClick={onOpenRegister}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black py-4 px-4 rounded-xl text-xs shadow-xl shadow-emerald-500/20 transition-all hover:scale-102"
                >
                  14 Gün Ücretsiz Başlat ➔
                </button>
              </div>
            </div>

            {/* PLAN 3: Kurumsal / Zincir */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div>
                <div className="inline-block bg-slate-800 text-slate-300 text-xs font-bold px-3 py-1 rounded-full mb-4">
                  Çoklu Şube & Zincirler
                </div>
                <h4 className="text-2xl font-black text-white">Kurumsal</h4>
                <p className="text-xs text-slate-400 mt-1">Birden fazla dükkanı veya deposu olan esnaf ve zincir mağazalar.</p>

                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white">
                    ₺{billingCycle === 'MONTHLY' ? '1.999' : '1.599'}
                  </span>
                  <span className="text-xs text-slate-400">/ ay + KDV</span>
                </div>

                <ul className="mt-8 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span> <strong>Sınırsız Şube</strong> ve Sınırsız Kasa
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span> Şubeler Arası Anlık Stok Transferi
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span> Konsolide Patron Raporları & Ciro Analizi
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span> Çoklu Fiziki POS Cihazı Eşleştirme
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span> Özel Muhasebe & ERP Entegrasyonları
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span> 7/24 Özel Müşteri Temsilcisi
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800">
                <button
                  onClick={onOpenRegister}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 px-4 rounded-xl text-xs transition-all"
                >
                  14 Gün Ücretsiz Başlat ➔
                </button>
              </div>
            </div>
          </div>

          {/* Guarantee Banner */}
          <div className="mt-12 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/30 rounded-2xl p-6 text-center max-w-3xl mx-auto">
            <span className="text-3xl">🛡️</span>
            <h5 className="text-base font-bold text-white mt-2">14 Gün Sıfır Risk Garantisi</h5>
            <p className="text-xs text-slate-300 mt-1 max-w-xl mx-auto">
              Hesabınızı hemen oluşturun. 14 gün boyunca dükkanınızı dilediğiniz gibi yönetin, sayım yapın. Beğenmezseniz sistem otomatik sonlanır, kredi kartınızdan hiçbir ücret çekilmez.
            </p>
          </div>
        </div>
      </section>

      {/* SSS Bölümü */}
      <section id="sss" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-2">
              AKLINIZA TAKILANLAR
            </h2>
            <h3 className="text-3xl font-black text-white">Sıkça Sorulan Sorular</h3>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-slate-800/60 border border-slate-700/80 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full text-left p-5 flex items-center justify-between text-base font-bold text-white hover:text-emerald-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  <span className="text-emerald-400 text-xl font-mono">
                    {activeFaq === idx ? '−' : '+'}
                  </span>
                </button>
                {activeFaq === idx && (
                  <div className="px-5 pb-5 text-sm text-slate-300 leading-relaxed border-t border-slate-700/50 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <h3 className="text-3xl sm:text-4xl font-black tracking-tight">
            Dükkanınızı Sayım Çilesinden Kurtarın
          </h3>
          <p className="mt-3 text-base text-emerald-100 max-w-xl mx-auto">
            Hemen kaydolun, 14 gün ücretsiz kullanın. Türkiye&apos;nin dört bir yanındaki esnaflar gibi siz de kasanızı cebinizden yönetin.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onOpenRegister}
              className="bg-slate-950 hover:bg-slate-900 text-white font-black text-sm px-8 py-4 rounded-2xl shadow-xl transition-all hover:scale-105"
            >
              14 Gün Koşulsuz Ücretsiz Başla ➔
            </button>
            <button
              onClick={() => onEnterLiveDemo()}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-sm px-8 py-4 rounded-2xl transition-all"
            >
              Canlı Demoyu İncele
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-300">EsnafCepte</span>
            <span>— Bir <strong className="text-emerald-400 font-bold">İnanoraSoft</strong> Ürünüdür</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={onOpenBrochures} className="hover:text-emerald-400">Tanıtım Broşürleri</button>
            <a href="#fiyatlar" className="hover:text-emerald-400">Fiyatlandırma</a>
            <a href="#sss" className="hover:text-emerald-400">SSS</a>
            <span>© 2026 <strong className="text-slate-400 font-bold">İnanoraSoft</strong>. Tüm Hakları Saklıdır.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
