# 🚀 EsnafCepte • Perakende Bulut Kasa & Akıllı Stok Yönetimi

<div align="center">
  <img src="public/promo_hero_owner.jpg" alt="EsnafCepte Hero" width="800" style="border-radius: 16px; margin-bottom: 20px;" />

  <p align="center">
    <strong>Market, Butik, Kırtasiye, Şarküteri ve Hırdavat Esnafı İçin Yeni Nesil Hibrit Bulut POS Platformu</strong>
  </p>

  <p align="center">
    <a href="#-temel-özellikler">Özellikler</a> •
    <a href="#-kurulum--çalıştırma">Kurulum</a> •
    <a href="#-ekran-görüntüleri--modüller">Modüller</a> •
    <a href="#-teknoloji-yığını">Teknolojiler</a> •
    <a href="#-hakkında">Hakkında</a>
  </p>
</div>

---

## 🌟 Temel Özellikler

- **💳 Hızlı Kasa & POS:** Barkod okuyucuyla anlık satış, klavye kısayolları (`F2`, `F3`, `F9`, `F10`), fiş askıya alma (sepet park etme) ve para üstü hesabı.
- **⚖️ Terazi & Tartım Entegrasyonu:** Manav, şarküteri ve kuruyemiş için dijital yeşil LED tartım ekranı (`ScaleModal`), dara alma, hızlı gramaj butonları ve **EAN-13 (27, 28, 29)** terazili barkod çözümleme motoru.
- **📱 Mobil Kamera ile Reyon Sayım Vizörü:** Pahalı el terminaline gerek olmadan akıllı telefon kamerası ile reyonlarda seri barkod okuma, anlık fark tespiti ve tek tıkla stok eşitleme.
- **📒 Akıllı Veresiye Defteri:** Müşteri bakiye takibi, borç/tahsilat hareketleri ve tek tıkla müşteriye **WhatsApp Borç Bildirimi** gönderme.
- **💸 Kasa Gider & Masraf Takibi:** Gün içindeki yemek, fatura, kurye ve dükkan harcamalarını kasadan düşme.
- **📊 Gün Sonu Kasa Kapatma & Z Raporu:** Fiziksel sayılan nakit ile sistem nakdini karşılaştırma, kasa fazlası/açığı tespiti ve tek tıkla patronun telefonuna **WhatsApp Z Raporu** özeti iletme.
- **🔒 Güvenlik & Personel Modu:** Kasiyer personeli çalışırken alış fiyatlarını ve hassas ciro/kâr raporlarını 4 haneli **Patron PIN Kodu** ile gizleme.
- **🧾 Resmi E-Arşiv & Dijital Fiş:** Müşteriye WhatsApp dijital e-fiş gönderme veya GİB uyumlu e-Arşiv fatura oluşturma.
- **🔄 Ürün İade & Değişim:** Satış kodu veya barkod ile hızlı iade alma ve stoğa otomatik geri işleme.
- **📦 Kritik Stoktan Toptancıya WhatsApp Siparişi:** Kritik seviyenin altına düşen ürünleri tek tıkla toptancı sipariş listesine dönüştürme.
- **🏪 Çoklu Dükkan / Şube Yönetimi:** Tek hesaptan birden fazla dükkan/şube açma ve sektörel hazır şablonlarla (Market, Butik, Kırtasiye, Hırdavat) başlama.
- **🎬 Tanıtım Stüdyosu & Broşürler:** Dahili `/tanitim` ve `/brosur` sayfalarıyla interaktif reklam filmi provası, seslendirme metinleri ve sosyal medya pazarlama kiti.

---

## 📸 Ekran Görüntüleri & Modüller

| Hero Lansman & Kasa | Dijital Terazi & Tartım | Mobil Kamera Sayımı |
| :---: | :---: | :---: |
| <img src="public/promo_hero_owner.jpg" width="300" /> | <img src="public/promo_scale_checkout.jpg" width="300" /> | <img src="public/promo_mobile_scan.jpg" width="300" /> |
| *Mutlu Esnaf & Bulut Kasa* | *Terazi, POS & Tablet Tezgahı* | *Mobil AR Reyon Sayım Vizörü* |

---

## 🚀 Kurulum & Çalıştırma

### Gereksinimler
- **Node.js**: v18.0.0 veya üzeri
- **npm** veya **yarn**

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/mehmetinancguzel-cmd/EsnafCepte.git
cd EsnafCepte
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Örnek Veritabanını Başlatın (Opsiyonel)
```bash
npm run seed
```

### 4. Geliştirme Sunucusunu Başlatın
```bash
npm run dev
```

Uygulama varsayılan olarak **`http://localhost:3000`** adresinde açılır.

### 5. Üretim (Production) Derlemesi
```bash
npm run build
npm run start
```

---

## 📱 Telefondan / Tabletten Kullanım (Aynı Wi-Fi):
1. Bilgisayarınızın yerel IP adresini öğrenin (örn: `192.168.1.50`).
2. Telefon veya tabletinizin tarayıcısından `http://192.168.1.50:3000` adresine girin.
3. İsterseniz tarayıcı menüsünden **"Ana Ekrana Ekle" (PWA)** diyerek yerel mobil uygulama gibi kullanın.

---

## 🛠️ Teknoloji Yığını

- **Framework:** Next.js 15 (App Router)
- **Arayüz:** React 19, Tailwind CSS, Lucide Icons
- **Barkod & Kamera:** HTML5-QRCode
- **Ses & Efektler:** Web Audio API Synth Engine
- **Veri Katmanı:** Hibrit Dosya Tabanlı JSON DB (`lib/db.ts`)
- **Dil:** TypeScript

---

## 🏢 Hakkında

**EsnafCepte**, **İnanoraSoft** tarafından Türkiye'deki KOBİ ve perakende esnafının dijital dönüşümünü hızlandırmak amacıyla geliştirilmiştir.

© 2026 **İnanoraSoft**. Tüm hakları saklıdır.
