const fs = require('fs');
const path = require('path');

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbFile = path.join(dataDir, 'db.json');

const sampleProducts = [
  // --- İÇ GİYİM & ÇORAP ---
  { barcode: '8690456128790', name: 'Pierre Cardin Dikişsiz Modal Boxer', category: 'İç Giyim', variant: 'L / Siyah', cost_price: 75, sale_price: 140, stock_quantity: 28, critical_level: 6, unit: 'Adet' },
  { barcode: '8690456128791', name: 'Pierre Cardin Dikişsiz Modal Boxer', category: 'İç Giyim', variant: 'M / Gri', cost_price: 75, sale_price: 140, stock_quantity: 14, critical_level: 5, unit: 'Adet' },
  { barcode: '8690456128792', name: 'Pierre Cardin Dikişsiz Modal Boxer', category: 'İç Giyim', variant: 'XL / Lacivert', cost_price: 75, sale_price: 140, stock_quantity: 4, critical_level: 5, unit: 'Adet' },
  { barcode: '8690888123001', name: 'Dagi Desteksiz Dantelli Sütyen', category: 'İç Giyim', variant: '75B / Beyaz', cost_price: 180, sale_price: 350, stock_quantity: 12, critical_level: 4, unit: 'Adet' },
  { barcode: '8690888123002', name: 'Dagi Desteksiz Dantelli Sütyen', category: 'İç Giyim', variant: '80B / Ten', cost_price: 180, sale_price: 350, stock_quantity: 3, critical_level: 4, unit: 'Adet' },
  { barcode: '8690888123003', name: 'Dagi Desteksiz Dantelli Sütyen', category: 'İç Giyim', variant: '85C / Siyah', cost_price: 180, sale_price: 350, stock_quantity: 8, critical_level: 3, unit: 'Adet' },
  { barcode: '8697771234567', name: 'Penti Parlak Külotlu Çorap 15 Den', category: 'İç Giyim', variant: 'Ten No:57', cost_price: 35, sale_price: 75, stock_quantity: 45, critical_level: 10, unit: 'Adet' },
  { barcode: '8697771234568', name: 'Penti Mat Külotlu Çorap 40 Den', category: 'İç Giyim', variant: 'Siyah', cost_price: 45, sale_price: 95, stock_quantity: 22, critical_level: 8, unit: 'Adet' },

  // --- TUHAFİYE & DİKİŞ ---
  { barcode: '8691122334455', name: 'Alize Puffy El Örgü İpi', category: 'Tuhafiye', variant: 'Renk #161 Pudra', cost_price: 38, sale_price: 65, stock_quantity: 32, critical_level: 8, unit: 'Yumak' },
  { barcode: '8691122334456', name: 'Alize Puffy El Örgü İpi', category: 'Tuhafiye', variant: 'Renk #55 Beyaz', cost_price: 38, sale_price: 65, stock_quantity: 40, critical_level: 10, unit: 'Yumak' },
  { barcode: '8691122334457', name: 'Alize Puffy El Örgü İpi', category: 'Tuhafiye', variant: 'Renk #60 Siyah', cost_price: 38, sale_price: 65, stock_quantity: 2, critical_level: 8, unit: 'Yumak' },
  { barcode: '8697412589630', name: 'Nako Pırlanta El Örgü İpi', category: 'Tuhafiye', variant: 'Renk #208 Su Yeşili', cost_price: 35, sale_price: 60, stock_quantity: 24, critical_level: 6, unit: 'Yumak' },
  { barcode: '8697412589631', name: 'Nako Pırlanta El Örgü İpi', category: 'Tuhafiye', variant: 'Renk #1199 Hardal', cost_price: 35, sale_price: 60, stock_quantity: 19, critical_level: 6, unit: 'Yumak' },
  { barcode: '8693344556677', name: 'DMC Muline Nakış İpliği 8m', category: 'Tuhafiye', variant: 'Renk #310 Siyah', cost_price: 16, sale_price: 30, stock_quantity: 50, critical_level: 12, unit: 'Adet' },
  { barcode: '8693344556678', name: 'DMC Muline Nakış İpliği 8m', category: 'Tuhafiye', variant: 'Renk #blanc Beyaz', cost_price: 16, sale_price: 30, stock_quantity: 42, critical_level: 12, unit: 'Adet' },
  { barcode: '8693344556679', name: 'DMC Muline Nakış İpliği 8m', category: 'Tuhafiye', variant: 'Renk #666 Kırmızı', cost_price: 16, sale_price: 30, stock_quantity: 18, critical_level: 10, unit: 'Adet' },
  { barcode: '8695566778899', name: 'YKK Gizli Fermuar 20cm', category: 'Tuhafiye', variant: 'Siyah', cost_price: 8, sale_price: 20, stock_quantity: 65, critical_level: 15, unit: 'Adet' },
  { barcode: '8695566778898', name: 'YKK Gizli Fermuar 50cm', category: 'Tuhafiye', variant: 'Beyaz', cost_price: 14, sale_price: 35, stock_quantity: 25, critical_level: 10, unit: 'Adet' },
  { barcode: '8692233441122', name: 'Gipür & Brode Dantel Şerit', category: 'Tuhafiye', variant: '5cm Krem (Metre)', cost_price: 12, sale_price: 28, stock_quantity: 85, critical_level: 20, unit: 'Metre' },

  // --- KIRTASİYE ---
  { barcode: '8699988776611', name: 'Faber-Castell 1425 Tükenmez Kalem', category: 'Kırtasiye', variant: '0.7 mm Mavi', cost_price: 9, sale_price: 18, stock_quantity: 3, critical_level: 15, unit: 'Adet' },
  { barcode: '8699988776612', name: 'Faber-Castell 1425 Tükenmez Kalem', category: 'Kırtasiye', variant: '0.7 mm Siyah', cost_price: 9, sale_price: 18, stock_quantity: 55, critical_level: 15, unit: 'Adet' },
  { barcode: '8699988776613', name: 'Faber-Castell 1425 Tükenmez Kalem', category: 'Kırtasiye', variant: '0.7 mm Kırmızı', cost_price: 9, sale_price: 18, stock_quantity: 34, critical_level: 15, unit: 'Adet' },
  { barcode: '8690123456789', name: 'Gıpta Spiralli Çizgili Defter A4 80 Yp', category: 'Kırtasiye', variant: 'Sert Kapak Kraft', cost_price: 32, sale_price: 65, stock_quantity: 48, critical_level: 10, unit: 'Adet' },
  { barcode: '8690123456790', name: 'Gıpta Spiralli Kareli Defter A4 80 Yp', category: 'Kırtasiye', variant: 'Pastel Mavi', cost_price: 32, sale_price: 65, stock_quantity: 36, critical_level: 10, unit: 'Adet' },
  { barcode: '8697894561230', name: 'Rotring Tikky Mekanik Kurşun Kalem', category: 'Kırtasiye', variant: '0.5 mm Bordo', cost_price: 90, sale_price: 165, stock_quantity: 11, critical_level: 5, unit: 'Adet' },
  { barcode: '8697894561231', name: 'Rotring Tikky Mekanik Kurşun Kalem', category: 'Kırtasiye', variant: '0.7 mm Siyah', cost_price: 90, sale_price: 165, stock_quantity: 16, critical_level: 5, unit: 'Adet' },
  { barcode: '8693456781290', name: 'Pritt Stick Yapıştırıcı 43g', category: 'Kırtasiye', variant: 'Standart', cost_price: 34, sale_price: 65, stock_quantity: 26, critical_level: 8, unit: 'Adet' },

  // --- EL İŞİ & HOBİ ---
  { barcode: '8698899001122', name: 'Tulip Etimo Rose Tığ No: 2.5mm', category: 'El İşi', variant: '2.5 mm Pembe Saplı', cost_price: 110, sale_price: 210, stock_quantity: 7, critical_level: 3, unit: 'Adet' },
  { barcode: '8698899001123', name: 'Tulip Etimo Rose Tığ No: 3.0mm', category: 'El İşi', variant: '3.0 mm Pembe Saplı', cost_price: 110, sale_price: 210, stock_quantity: 5, critical_level: 3, unit: 'Adet' },
  { barcode: '8696655443322', name: 'Ahşap Kasnak Çap: 22cm', category: 'El İşi', variant: 'Vidalı Doğal Ahşap', cost_price: 30, sale_price: 60, stock_quantity: 18, critical_level: 5, unit: 'Adet' },
  { barcode: '8696655443323', name: 'Etamin / Kanaviçe Kumaşı 14ct', category: 'El İşi', variant: 'Krem (100x150cm)', cost_price: 95, sale_price: 185, stock_quantity: 12, critical_level: 4, unit: 'Metre' },
  { barcode: '8694433221199', name: 'Cam Kum Boncuk Dizi 50g', category: 'El İşi', variant: 'Metalik Altın No:11/0', cost_price: 18, sale_price: 40, stock_quantity: 35, critical_level: 8, unit: 'Paket' }
];

const sampleCustomers = [
  { id: 1, name: 'Ayşe Terzioğlu (Moda Terzi)', phone: '0532 111 22 33', note: 'Mahalle terzisi, iplik ve fermuar alır, ay başında öder', balance: 640.00 },
  { id: 2, name: 'Zeynep Hoca (Halk Eğitim Dikiş Kursu)', phone: '0544 222 33 44', note: 'Kurs malzemeleri toplu alım', balance: 1250.00 },
  { id: 3, name: 'Mehmet Bakkal (Komşu Esnaf)', phone: '0555 333 44 55', note: 'Çorap ve iç çamaşırı alır', balance: 180.00 },
  { id: 4, name: 'Fatma Teyze', phone: '0505 444 55 66', note: 'Torunlarına yün ve tığ alır', balance: 0.00 }
];

const now = new Date().toISOString();
let idCounter = 1;

const products = sampleProducts.map(p => ({
  ...p,
  id: idCounter++,
  created_at: now,
  updated_at: now
}));

const db = {
  products: products,
  stock_movements: [],
  sales: [],
  audit_sessions: [],
  customers: sampleCustomers.map(c => ({ ...c, created_at: now, updated_at: now })),
  customer_transactions: [
    {
      id: 1,
      customer_id: 1,
      type: 'BORC',
      amount: 640.00,
      sale_code: 'SLS-VER-101',
      note: 'DMC İplik ve Gizli Fermuar Alımı',
      created_at: now
    },
    {
      id: 2,
      customer_id: 2,
      type: 'BORC',
      amount: 1500.00,
      sale_code: 'SLS-VER-102',
      note: 'Toplu Kanaviçe Kumaşı & Alize Puffy',
      created_at: now
    },
    {
      id: 3,
      customer_id: 2,
      type: 'TAHSILAT',
      amount: 250.00,
      note: 'Elden Kısmi Nakit Ödeme',
      created_at: now
    }
  ],
  nextId: {
    product: idCounter,
    movement: 1,
    sale: 1,
    session: 1,
    auditItem: 1,
    customer: 5,
    customerTransaction: 4
  }
};

fs.writeFileSync(dbFile, JSON.stringify(db, null, 2), 'utf-8');
console.log(`✓ Başarılı: ${products.length} ürün ve ${sampleCustomers.length} müşteri data/db.json dosyasına yazıldı.`);
