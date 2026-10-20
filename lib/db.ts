import fs from 'fs';
import path from 'path';

export type StoreSector = 'KIRTASIYE_TUHAFIYE' | 'MARKET' | 'BUTIK_GIYIM' | 'HIRDAVAT' | 'DIGER';
export type UserPlan = 'TRIAL' | 'STARTER' | 'GROWTH' | 'ENTERPRISE';

export interface Store {
  id: number;
  name: string;
  sector: StoreSector;
  phone?: string;
  address?: string;
  auto_supplier_whatsapp?: boolean;
  supplier_name?: string;
  supplier_phone?: string;
  patron_pin?: string;
  tax_id?: string;
  tax_office?: string;
  scale_prefix?: string;
  created_at: string;
}

export interface Expense {
  id: number;
  store_id: number;
  title: string;
  category: 'TOPTANCI' | 'PERSONEL' | 'FATURA' | 'KIRA' | 'YEMEK' | 'DIGER';
  amount: number;
  note?: string;
  created_at: string;
}

export interface User {
  id: number;
  store_id: number;
  name: string;
  email: string;
  phone: string;
  password_hash: string;
  plan: UserPlan;
  trial_ends_at: string;
  created_at: string;
}

export interface Product {
  id: number;
  store_id: number;
  barcode: string;
  name: string;
  category: string;
  variant?: string;
  cost_price: number;
  sale_price: number;
  stock_quantity: number;
  critical_level: number;
  unit: string;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: number;
  store_id: number;
  product_id: number;
  product_name: string;
  barcode: string;
  type: 'GIRIS' | 'CIKIS' | 'SATIS' | 'SAYIM_DUZELTME' | 'IADE';
  quantity: number;
  note?: string;
  created_at: string;
}

export interface SaleItem {
  product_id: number;
  barcode: string;
  name: string;
  variant?: string;
  unit_price: number;
  quantity: number;
  total_price: number;
}

export interface Sale {
  id: number;
  store_id: number;
  sale_code: string;
  total_amount: number;
  discount: number;
  payment_method: 'NAKIT' | 'KREDI_KARTI' | 'VERESIYE';
  customer_id?: number;
  customer_name?: string;
  items: SaleItem[];
  created_at: string;
}

export interface Customer {
  id: number;
  store_id: number;
  name: string;
  phone: string;
  note?: string;
  balance: number; // Borç bakiyesi (TL)
  created_at: string;
  updated_at: string;
}

export interface CustomerTransaction {
  id: number;
  store_id: number;
  customer_id: number;
  type: 'BORC' | 'TAHSILAT';
  amount: number;
  sale_code?: string;
  note?: string;
  created_at: string;
}

export interface AuditItem {
  id: number;
  session_id: number;
  product_id: number;
  barcode: string;
  name: string;
  variant?: string;
  expected_quantity: number;
  counted_quantity: number;
  variance: number; // counted - expected
  scanned_at: string;
}

export interface AuditSession {
  id: number;
  store_id: number;
  session_name: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
  completed_at?: string;
  items: AuditItem[];
}

interface DatabaseSchema {
  stores: Store[];
  users: User[];
  products: Product[];
  stock_movements: StockMovement[];
  sales: Sale[];
  audit_sessions: AuditSession[];
  customers: Customer[];
  customer_transactions: CustomerTransaction[];
  expenses: Expense[];
  nextId: {
    store: number;
    user: number;
    product: number;
    movement: number;
    sale: number;
    session: number;
    auditItem: number;
    customer: number;
    customerTransaction: number;
    expense: number;
  };
}

const dataDir = path.join(process.cwd(), 'data');
const dbFile = path.join(dataDir, 'db.json');

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

const defaultStores: Store[] = [
  {
    id: 1,
    name: 'Örnek Tuhafiye & Kırtasiye',
    sector: 'KIRTASIYE_TUHAFIYE',
    phone: '0532 100 20 30',
    address: 'Merkez Mah. Çarşı İçi No:12',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Bereket Süpermarket',
    sector: 'MARKET',
    phone: '0544 200 30 40',
    address: 'İstasyon Cad. No:45',
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Trend Butik & Giyim',
    sector: 'BUTIK_GIYIM',
    phone: '0555 300 40 50',
    address: 'Moda Sokak No:8',
    created_at: new Date().toISOString(),
  },
];

function getInitialData(): DatabaseSchema {
  const trialEnds = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  return {
    stores: defaultStores,
    users: [
      {
        id: 1,
        store_id: 1,
        name: 'Ahmet Demir (Örnek Esnaf)',
        email: 'demo@esnafcepte.com',
        phone: '0532 100 20 30',
        password_hash: '123456',
        plan: 'TRIAL',
        trial_ends_at: trialEnds,
        created_at: new Date().toISOString(),
      },
    ],
    products: [],
    stock_movements: [],
    sales: [],
    audit_sessions: [],
    customers: [],
    customer_transactions: [],
    expenses: [],
    nextId: {
      store: 4,
      user: 2,
      product: 1,
      movement: 1,
      sale: 1,
      session: 1,
      auditItem: 1,
      customer: 1,
      customerTransaction: 1,
      expense: 1,
    },
  };
}

let cachedData: DatabaseSchema | null = null;

export function loadDb(): DatabaseSchema {
  if (cachedData) return cachedData;
  ensureDataDir();
  if (!fs.existsSync(dbFile)) {
    const init = getInitialData();
    saveDb(init);
    cachedData = init;
    return init;
  }

  try {
    const raw = fs.readFileSync(dbFile, 'utf-8');
    const parsed = JSON.parse(raw);
    let mutated = false;

    // Schema migration checks
    if (!parsed.stores || parsed.stores.length === 0) {
      parsed.stores = defaultStores;
      mutated = true;
    }
    if (!parsed.nextId.store) {
      parsed.nextId.store = 4;
      mutated = true;
    }
    if (!parsed.users) {
      const trialEnds = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      parsed.users = [
        {
          id: 1,
          store_id: 1,
          name: 'Ahmet Demir (Örnek Esnaf)',
          email: 'demo@esnafcepte.com',
          phone: '0532 100 20 30',
          password_hash: '123456',
          plan: 'TRIAL',
          trial_ends_at: trialEnds,
          created_at: new Date().toISOString(),
        },
      ];
      mutated = true;
    }
    if (!parsed.nextId.user) {
      parsed.nextId.user = 2;
      mutated = true;
    }
    if (!parsed.customers) parsed.customers = [];
    if (!parsed.customer_transactions) parsed.customer_transactions = [];
    if (!parsed.expenses) parsed.expenses = [];
    if (!parsed.nextId.customer) parsed.nextId.customer = 1;
    if (!parsed.nextId.customerTransaction) parsed.nextId.customerTransaction = 1;
    if (!parsed.nextId.expense) parsed.nextId.expense = 1;

    // Assign store_id: 1 to any legacy records missing store_id
    for (const p of parsed.products) {
      if (!p.store_id) { p.store_id = 1; mutated = true; }
    }
    for (const s of parsed.sales) {
      if (!s.store_id) { s.store_id = 1; mutated = true; }
    }
    for (const m of parsed.stock_movements) {
      if (!m.store_id) { m.store_id = 1; mutated = true; }
    }
    for (const c of parsed.customers) {
      if (!c.store_id) { c.store_id = 1; mutated = true; }
    }
    for (const a of parsed.audit_sessions) {
      if (!a.store_id) { a.store_id = 1; mutated = true; }
    }

    // Auto-seed starter products for Store 2 (Bereket Süpermarket) if empty
    const marketProducts = parsed.products.filter((p: Product) => p.store_id === 2);
    if (marketProducts.length === 0) {
      const now = new Date().toISOString();
      const marketSeed = [
        { barcode: '8690637011019', name: 'Çaykur Rize Turist Çay 1000g', category: 'Gıda / İçecek', cost_price: 115, sale_price: 155, stock_quantity: 45, critical_level: 10, unit: 'Adet' },
        { barcode: '8690558000010', name: 'Sütaş Doğal Yoğurt 1500g', category: 'Süt & Kahvaltılık', cost_price: 52, sale_price: 68, stock_quantity: 30, critical_level: 8, unit: 'Adet' },
        { barcode: '8690565000011', name: 'Pınar Tam Yağlı Süt 1 Lt', category: 'Süt & Kahvaltılık', cost_price: 28, sale_price: 38, stock_quantity: 60, critical_level: 15, unit: 'Adet' },
        { barcode: '8690520000010', name: 'Tat Domates Salçası 830g', category: 'Temel Gıda', cost_price: 40, sale_price: 55, stock_quantity: 35, critical_level: 10, unit: 'Adet' },
        { barcode: '8690504000010', name: 'Ülker Çikolatalı Gofret 36g', category: 'Atıştırmalık', cost_price: 7, sale_price: 12, stock_quantity: 120, critical_level: 25, unit: 'Adet' },
        { barcode: '8690777000011', name: 'Torku Toz Şeker 5 Kg', category: 'Temel Gıda', cost_price: 140, sale_price: 185, stock_quantity: 24, critical_level: 5, unit: 'Adet' },
        { barcode: '8690501000010', name: 'Erikli Su 5 Litre', category: 'İçecek', cost_price: 16, sale_price: 25, stock_quantity: 50, critical_level: 12, unit: 'Adet' },
        { barcode: '8690637000022', name: 'Omo Matik Toz Deterjan 6 Kg', category: 'Temizlik', cost_price: 220, sale_price: 295, stock_quantity: 16, critical_level: 4, unit: 'Adet' },
        { barcode: '8690637000033', name: 'Domestos Çamaşır Suyu 750ml', category: 'Temizlik', cost_price: 30, sale_price: 42, stock_quantity: 32, critical_level: 8, unit: 'Adet' },
        { barcode: '8690544000011', name: 'Filiz Burgu Makarna 500g', category: 'Temel Gıda', cost_price: 13, sale_price: 19, stock_quantity: 75, critical_level: 20, unit: 'Adet' },
      ];
      for (const item of marketSeed) {
        parsed.products.push({
          id: parsed.nextId.product++,
          store_id: 2,
          ...item,
          variant: '',
          created_at: now,
          updated_at: now,
        });
      }
      // Add a sample customer for market
      parsed.customers.push({
        id: parsed.nextId.customer++,
        store_id: 2,
        name: 'Ali Kaptan (Komşu Esnaf)',
        phone: '0533 444 55 66',
        balance: 450,
        note: 'Haftalık bakkal veresiyesi',
        created_at: now,
        updated_at: now,
      });
      mutated = true;
    }

    // Auto-seed starter products for Store 3 (Trend Butik & Giyim) if empty
    const butikProducts = parsed.products.filter((p: Product) => p.store_id === 3);
    if (butikProducts.length === 0) {
      const now = new Date().toISOString();
      const butikSeed = [
        { barcode: '8680001010111', name: 'Oversize Basic T-Shirt', category: 'Üst Giyim', variant: 'Beyaz / M', cost_price: 130, sale_price: 290, stock_quantity: 20, critical_level: 5, unit: 'Adet' },
        { barcode: '8680001010128', name: 'Oversize Basic T-Shirt', category: 'Üst Giyim', variant: 'Siyah / L', cost_price: 130, sale_price: 290, stock_quantity: 16, critical_level: 5, unit: 'Adet' },
        { barcode: '8680001020210', name: 'Slim Fit Jean Pantolon', category: 'Alt Giyim', variant: 'Mavi / 32', cost_price: 290, sale_price: 650, stock_quantity: 12, critical_level: 3, unit: 'Adet' },
        { barcode: '8680001030319', name: 'Polo Yaka Triko Kazak', category: 'Üst Giyim', variant: 'Gri / L', cost_price: 240, sale_price: 490, stock_quantity: 14, critical_level: 4, unit: 'Adet' },
        { barcode: '8680001040418', name: 'Kapüşonlu Sweatshirt', category: 'Dış Giyim', variant: 'Antrasit / XL', cost_price: 320, sale_price: 690, stock_quantity: 10, critical_level: 3, unit: 'Adet' },
        { barcode: '8680001050517', name: 'Keten Kargo Pantolon', category: 'Alt Giyim', variant: 'Bej / 34', cost_price: 270, sale_price: 550, stock_quantity: 15, critical_level: 4, unit: 'Adet' },
      ];
      for (const item of butikSeed) {
        parsed.products.push({
          id: parsed.nextId.product++,
          store_id: 3,
          ...item,
          created_at: now,
          updated_at: now,
        });
      }
      // Add a sample customer for boutique
      parsed.customers.push({
        id: parsed.nextId.customer++,
        store_id: 3,
        name: 'Selin Hanım (VIP Müşteri)',
        phone: '0555 777 88 99',
        balance: 1250,
        note: 'Sezon elbiseleri ayrıldı',
        created_at: now,
        updated_at: now,
      });
      mutated = true;
    }

    if (mutated) {
      saveDb(parsed);
    }

    cachedData = parsed;
    return cachedData!;
  } catch (err) {
    console.error('Veritabanı okuma hatası, sıfırlanıyor:', err);
    const init = getInitialData();
    saveDb(init);
    cachedData = init;
    return init;
  }
}

export function saveDb(data: DatabaseSchema) {
  ensureDataDir();
  cachedData = data;
  const tempFile = `${dbFile}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, dbFile);
}

// ================= STORES METHODS =================
export function getStores(): Store[] {
  return loadDb().stores;
}

export function getStoreById(id: number): Store | undefined {
  return loadDb().stores.find(s => s.id === id);
}

export function createStore(params: {
  name: string;
  sector: StoreSector;
  phone?: string;
  address?: string;
  seedTemplate?: boolean;
}): Store {
  const db = loadDb();
  const now = new Date().toISOString();

  const newStore: Store = {
    id: db.nextId.store++,
    name: params.name.trim(),
    sector: params.sector,
    phone: params.phone?.trim() || '',
    address: params.address?.trim() || '',
    created_at: now,
  };

  db.stores.push(newStore);

  // Optional: Auto-seed initial catalog based on sector
  if (params.seedTemplate) {
    if (params.sector === 'MARKET') {
      const sample = [
        { barcode: '8690637011019', name: 'Çaykur Rize Turist Çay 1000g', category: 'Gıda', cost_price: 115, sale_price: 155, stock_quantity: 40, critical_level: 10, unit: 'Adet' },
        { barcode: '8690558000010', name: 'Sütaş Doğal Yoğurt 1500g', category: 'Gıda', cost_price: 52, sale_price: 68, stock_quantity: 25, critical_level: 8, unit: 'Adet' },
        { barcode: '8690504000010', name: 'Ülker Çikolatalı Gofret 36g', category: 'Atıştırmalık', cost_price: 7, sale_price: 12, stock_quantity: 100, critical_level: 20, unit: 'Adet' },
      ];
      for (const item of sample) {
        db.products.push({ id: db.nextId.product++, store_id: newStore.id, ...item, variant: '', created_at: now, updated_at: now });
      }
    } else if (params.sector === 'BUTIK_GIYIM') {
      const sample = [
        { barcode: '8680001010111', name: 'Oversize Basic T-Shirt', category: 'Üst Giyim', variant: 'Beyaz / M', cost_price: 130, sale_price: 290, stock_quantity: 15, critical_level: 5, unit: 'Adet' },
        { barcode: '8680001020210', name: 'Slim Fit Jean Pantolon', category: 'Alt Giyim', variant: 'Mavi / 32', cost_price: 290, sale_price: 650, stock_quantity: 10, critical_level: 3, unit: 'Adet' },
      ];
      for (const item of sample) {
        db.products.push({ id: db.nextId.product++, store_id: newStore.id, ...item, created_at: now, updated_at: now });
      }
    } else if (params.sector === 'KIRTASIYE_TUHAFIYE') {
      const sample = [
        { barcode: '8690001001011', name: 'Faber-Castell 2B Kurşun Kalem', category: 'Kırtasiye', cost_price: 8, sale_price: 15, stock_quantity: 150, critical_level: 20, unit: 'Adet' },
        { barcode: '8690002002022', name: 'Dikiş İpliği No:50 (Beyaz)', category: 'Tuhafiye', cost_price: 12, sale_price: 25, stock_quantity: 80, critical_level: 15, unit: 'Adet' },
      ];
      for (const item of sample) {
        db.products.push({ id: db.nextId.product++, store_id: newStore.id, ...item, variant: '', created_at: now, updated_at: now });
      }
    } else if (params.sector === 'HIRDAVAT') {
      const sample = [
        { barcode: '8690005001111', name: 'Akfix 705 Hızlı Yapıştırıcı 200ml', category: 'Yapıştırıcı & Kimyasal', cost_price: 65, sale_price: 110, stock_quantity: 40, critical_level: 8, unit: 'Adet' },
        { barcode: '8690005002222', name: 'İzeltaş Şerit Metre 5 Metre', category: 'El Aletleri', cost_price: 110, sale_price: 185, stock_quantity: 25, critical_level: 5, unit: 'Adet' },
        { barcode: '8690005003333', name: 'Sista Üniversal Silikon Şeffaf', category: 'Yalıtım & Dolgu', cost_price: 85, sale_price: 140, stock_quantity: 30, critical_level: 6, unit: 'Adet' },
      ];
      for (const item of sample) {
        db.products.push({ id: db.nextId.product++, store_id: newStore.id, ...item, variant: '', created_at: now, updated_at: now });
      }
    }
  }

  saveDb(db);
  return newStore;
}

// ================= AUTH & USER METHODS =================
export function registerStoreAndUser(params: {
  userName: string;
  email: string;
  phone: string;
  password: string;
  storeName: string;
  sector: StoreSector;
  address?: string;
  seedTemplate?: boolean;
}): { user: Omit<User, 'password_hash'>; store: Store } {
  const db = loadDb();
  const normalizedEmail = params.email.trim().toLowerCase();

  const existing = db.users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    throw new Error('Bu e-posta adresiyle kayıtlı bir hesap zaten var.');
  }

  // 1. Yeni Dükkan Oluştur ve Sektör Şablonunu Başlat
  const store = createStore({
    name: params.storeName,
    sector: params.sector,
    phone: params.phone,
    address: params.address,
    seedTemplate: params.seedTemplate ?? true,
  });

  // 2. 14 Günlük Koşulsuz Ücretsiz Deneme Tanımla
  const now = new Date();
  const trialEnds = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();

  // 3. Kullanıcıyı Kaydet
  const newUser: User = {
    id: db.nextId.user++,
    store_id: store.id,
    name: params.userName.trim(),
    email: normalizedEmail,
    phone: params.phone.trim(),
    password_hash: params.password,
    plan: 'TRIAL',
    trial_ends_at: trialEnds,
    created_at: now.toISOString(),
  };

  db.users.push(newUser);
  saveDb(db);

  const { password_hash, ...safeUser } = newUser;
  return { user: safeUser, store };
}

export function authenticateUser(email: string, password: string): { user: Omit<User, 'password_hash'>; store: Store } {
  const db = loadDb();
  const normalizedEmail = email.trim().toLowerCase();
  const user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!user || user.password_hash !== password) {
    throw new Error('E-posta veya şifre hatalı. Lütfen kontrol ediniz.');
  }

  const store = db.stores.find(s => s.id === user.store_id) || db.stores[0];
  const { password_hash, ...safeUser } = user;
  return { user: safeUser, store };
}

export function getUserById(id: number): { user: Omit<User, 'password_hash'>; store: Store } | null {
  const db = loadDb();
  const user = db.users.find(u => u.id === id);
  if (!user) return null;
  const store = db.stores.find(s => s.id === user.store_id) || db.stores[0];
  const { password_hash, ...safeUser } = user;
  return { user: safeUser, store };
}

export function updateUserPlan(userId: number, plan: UserPlan): { user: Omit<User, 'password_hash'>; store: Store } {
  const db = loadDb();
  const user = db.users.find(u => u.id === userId);
  if (!user) throw new Error('Kullanıcı bulunamadı');

  user.plan = plan;
  saveDb(db);

  const store = db.stores.find(s => s.id === user.store_id) || db.stores[0];
  const { password_hash, ...safeUser } = user;
  return { user: safeUser, store };
}

// ================= PRODUCT METHODS (STORE FILTERED) =================
export function getProducts(storeId?: number): Product[] {
  const products = loadDb().products;
  if (storeId) {
    return products.filter(p => p.store_id === storeId);
  }
  return products;
}

export function getProductByBarcode(barcode: string, storeId?: number): Product | undefined {
  const db = loadDb();
  const trimmed = barcode.trim();
  if (storeId) {
    return db.products.find(p => p.store_id === storeId && p.barcode === trimmed);
  }
  return db.products.find(p => p.barcode === trimmed);
}

export function getProductById(id: number, storeId?: number): Product | undefined {
  const db = loadDb();
  if (storeId) {
    return db.products.find(p => p.id === id && p.store_id === storeId);
  }
  return db.products.find(p => p.id === id);
}

export function saveProduct(data: Omit<Product, 'id' | 'created_at' | 'updated_at'> & { id?: number; store_id?: number }): Product {
  const db = loadDb();
  const now = new Date().toISOString();
  const targetStoreId = data.store_id || 1;

  if (data.id) {
    const idx = db.products.findIndex(p => p.id === data.id);
    if (idx !== -1) {
      const existing = db.products[idx];
      const updated: Product = {
        ...existing,
        ...data,
        store_id: data.store_id || existing.store_id || targetStoreId,
        id: existing.id,
        updated_at: now,
      };
      db.products[idx] = updated;
      saveDb(db);
      return updated;
    }
  }

  // Check duplicate barcode within the SAME STORE
  const existingBarcode = db.products.find(
    p => p.store_id === targetStoreId && p.barcode === data.barcode.trim()
  );
  if (existingBarcode) {
    throw new Error(`Bu barkod (${data.barcode}) bu dükkanda zaten kayıtlı: ${existingBarcode.name}`);
  }

  const newProduct: Product = {
    ...data,
    store_id: targetStoreId,
    barcode: data.barcode.trim(),
    id: db.nextId.product++,
    created_at: now,
    updated_at: now,
  };

  db.products.push(newProduct);
  saveDb(db);
  return newProduct;
}

// ================= TOPLU ÜRÜN İÇE AKTARMA (BULK IMPORT) =================
export function bulkImportProducts(
  rawProducts: Array<{
    barcode: string;
    name: string;
    category?: string;
    variant?: string;
    cost_price?: number;
    sale_price?: number;
    stock_quantity?: number;
    critical_level?: number;
    unit?: string;
  }>,
  storeId: number = 1,
  updateExisting: boolean = true
): { createdCount: number; updatedCount: number; errors: string[] } {
  const db = loadDb();
  const now = new Date().toISOString();
  let createdCount = 0;
  let updatedCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < rawProducts.length; i++) {
    const item = rawProducts[i];
    const barcode = (item.barcode || '').toString().trim();
    const name = (item.name || '').trim();

    if (!barcode || !name) {
      errors.push(`Satır ${i + 1}: Barkod ve Ürün Adı zorunludur.`);
      continue;
    }

    const existingIndex = db.products.findIndex(
      p => p.store_id === storeId && p.barcode === barcode
    );

    if (existingIndex !== -1) {
      if (updateExisting) {
        const existing = db.products[existingIndex];
        db.products[existingIndex] = {
          ...existing,
          name: name,
          category: item.category || existing.category,
          variant: item.variant !== undefined ? item.variant : existing.variant,
          cost_price: Number(item.cost_price ?? existing.cost_price),
          sale_price: Number(item.sale_price ?? existing.sale_price),
          stock_quantity: Number(item.stock_quantity ?? existing.stock_quantity),
          critical_level: Number(item.critical_level ?? existing.critical_level),
          unit: item.unit || existing.unit || 'Adet',
          updated_at: now,
        };
        updatedCount++;
      } else {
        errors.push(`Satır ${i + 1} (${barcode}): Ürün bu mağazada zaten mevcut, atlandı.`);
      }
    } else {
      const newProduct: Product = {
        id: db.nextId.product++,
        store_id: storeId,
        barcode: barcode,
        name: name,
        category: item.category || 'Genel',
        variant: item.variant || '',
        cost_price: Number(item.cost_price || 0),
        sale_price: Number(item.sale_price || 0),
        stock_quantity: Number(item.stock_quantity || 0),
        critical_level: Number(item.critical_level || 5),
        unit: item.unit || 'Adet',
        created_at: now,
        updated_at: now,
      };
      db.products.push(newProduct);
      createdCount++;
    }
  }

  saveDb(db);
  return { createdCount, updatedCount, errors };
}

// ================= SALES & POS METHODS =================
export function createSale(params: {
  store_id?: number;
  payment_method: 'NAKIT' | 'KREDI_KARTI' | 'VERESIYE';
  discount?: number;
  customer_id?: number;
  items: { barcode: string; quantity: number }[];
}): Sale {
  const db = loadDb();
  const now = new Date().toISOString();
  const targetStoreId = params.store_id || 1;
  const discount = params.discount || 0;

  let customer: Customer | undefined;
  if (params.payment_method === 'VERESIYE') {
    if (!params.customer_id) {
      throw new Error('Veresiye satış için bir müşteri seçilmelidir.');
    }
    customer = db.customers.find(c => c.id === params.customer_id && c.store_id === targetStoreId);
    if (!customer) {
      throw new Error('Seçilen müşteri bu mağazada bulunamadı.');
    }
  }

  const saleItems: SaleItem[] = [];
  let totalAmount = 0;

  for (const item of params.items) {
    const product = db.products.find(
      p => p.store_id === targetStoreId && p.barcode === item.barcode.trim()
    );
    if (!product) {
      throw new Error(`Barkod bulunamadı: ${item.barcode}`);
    }

    const itemTotal = product.sale_price * item.quantity;
    totalAmount += itemTotal;

    saleItems.push({
      product_id: product.id,
      barcode: product.barcode,
      name: product.name,
      variant: product.variant,
      unit_price: product.sale_price,
      quantity: item.quantity,
      total_price: itemTotal,
    });

    // Decrease stock
    product.stock_quantity -= item.quantity;
    product.updated_at = now;

    // Movement log
    db.stock_movements.push({
      id: db.nextId.movement++,
      store_id: targetStoreId,
      product_id: product.id,
      product_name: product.name,
      barcode: product.barcode,
      type: 'SATIS',
      quantity: -item.quantity,
      note: `Satış: ${item.quantity} ${product.unit}`,
      created_at: now,
    });
  }

  const finalAmount = Math.max(0, totalAmount - discount);
  const saleCode = `SLS-${Date.now().toString().slice(-6)}`;

  const newSale: Sale = {
    id: db.nextId.sale++,
    store_id: targetStoreId,
    sale_code: saleCode,
    total_amount: finalAmount,
    discount: discount,
    payment_method: params.payment_method,
    customer_id: customer?.id,
    customer_name: customer?.name,
    items: saleItems,
    created_at: now,
  };

  db.sales.unshift(newSale);

  // Update Veresiye debt if applicable
  if (params.payment_method === 'VERESIYE' && customer) {
    customer.balance += finalAmount;
    customer.updated_at = now;

    db.customer_transactions.push({
      id: db.nextId.customerTransaction++,
      store_id: targetStoreId,
      customer_id: customer.id,
      type: 'BORC',
      amount: finalAmount,
      sale_code: saleCode,
      note: `Veresiye Satış (${saleItems.length} Kalem Ürün)`,
      created_at: now,
    });
  }

  saveDb(db);
  return newSale;
}

export interface CreateRefundParams {
  store_id: number;
  barcode: string;
  quantity: number;
  refund_amount: number;
  payment_method: 'NAKIT' | 'KREDI_KARTI' | 'VERESIYE';
  customer_id?: number;
  reason?: string;
}

export function createRefund(params: CreateRefundParams): {
  movement: StockMovement;
  product: Product;
  refundCode: string;
  expense?: Expense;
} {
  const db = loadDb();
  const now = new Date().toISOString();
  const targetStoreId = params.store_id || 1;

  const product = db.products.find(
    p => p.store_id === targetStoreId && p.barcode === params.barcode.trim()
  );
  if (!product) {
    throw new Error(`İade edilecek barkod bulunamadı: ${params.barcode}`);
  }

  // Stoğu geri artır
  product.stock_quantity += params.quantity;
  product.updated_at = now;

  const refundCode = `REF-${Date.now().toString().slice(-6)}`;

  // Stok hareketine IADE olarak işle
  const movement: StockMovement = {
    id: db.nextId.movement++,
    store_id: targetStoreId,
    product_id: product.id,
    product_name: product.name,
    barcode: product.barcode,
    type: 'IADE',
    quantity: params.quantity,
    note: `İade (${params.payment_method}): ${params.quantity} ${product.unit} - ${params.reason || 'Müşteri İadesi'}`,
    created_at: now,
  };
  db.stock_movements.push(movement);

  // Müşteri hesabı / veresiye mahsubu ise borcu düş
  if (params.customer_id) {
    const customer = db.customers.find(c => c.id === params.customer_id && c.store_id === targetStoreId);
    if (customer) {
      customer.balance = Math.max(0, customer.balance - params.refund_amount);
      customer.updated_at = now;

      db.customer_transactions.push({
        id: db.nextId.customerTransaction++,
        store_id: targetStoreId,
        customer_id: customer.id,
        type: 'TAHSILAT',
        amount: params.refund_amount,
        sale_code: refundCode,
        note: `Ürün İadesi Mahsubu (${product.name})`,
        created_at: now,
      });
    }
  }

  // Eğer Nakit iade yapıldıysa kasadan nakit çıkışı olur. Z raporu kasa tutarı ile tam uyumlu olması için Masraf kaydı oluşturulur:
  let expense: Expense | undefined;
  if (params.payment_method === 'NAKIT') {
    expense = {
      id: db.nextId.expense++,
      store_id: targetStoreId,
      title: `Ürün İadesi: ${product.name}`,
      category: 'DIGER',
      amount: params.refund_amount,
      note: `Kasa Nakit İadesi (${params.quantity} ${product.unit} - ${refundCode})`,
      created_at: now,
    };
    db.expenses.push(expense);
  }

  saveDb(db);
  return {
    movement,
    product,
    refundCode,
    expense,
  };
}

export function getSales(storeId?: number): Sale[] {
  const sales = loadDb().sales;
  if (storeId) {
    return sales.filter(s => s.store_id === storeId);
  }
  return sales;
}

// ================= CUSTOMERS & VERESIYE LEDGER =================
export function getCustomers(storeId?: number): Customer[] {
  const customers = loadDb().customers;
  if (storeId) {
    return customers.filter(c => c.store_id === storeId);
  }
  return customers;
}

export function getCustomerById(id: number, storeId?: number): Customer | undefined {
  const db = loadDb();
  if (storeId) {
    return db.customers.find(c => c.id === id && c.store_id === storeId);
  }
  return db.customers.find(c => c.id === id);
}

export function addCustomer(params: {
  store_id?: number;
  name: string;
  phone: string;
  note?: string;
  initialBalance?: number;
}): Customer {
  const db = loadDb();
  const now = new Date().toISOString();
  const targetStoreId = params.store_id || 1;

  const newCustomer: Customer = {
    id: db.nextId.customer++,
    store_id: targetStoreId,
    name: params.name.trim(),
    phone: params.phone.trim(),
    note: params.note?.trim() || '',
    balance: Number(params.initialBalance || 0),
    created_at: now,
    updated_at: now,
  };

  db.customers.unshift(newCustomer);

  if (newCustomer.balance > 0) {
    db.customer_transactions.push({
      id: db.nextId.customerTransaction++,
      store_id: targetStoreId,
      customer_id: newCustomer.id,
      type: 'BORC',
      amount: newCustomer.balance,
      note: 'Açılış Devir Bakiyesi',
      created_at: now,
    });
  }

  saveDb(db);
  return newCustomer;
}

export function recordCustomerPayment(params: {
  customerId: number;
  amount: number;
  note?: string;
  store_id?: number;
}): { customer: Customer; transaction: CustomerTransaction } {
  const db = loadDb();
  const targetStoreId = params.store_id || 1;
  const customer = db.customers.find(c => c.id === params.customerId && c.store_id === targetStoreId);
  if (!customer) throw new Error('Müşteri bulunamadı');

  const now = new Date().toISOString();
  const amount = Number(params.amount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error('Geçerli bir tahsilat tutarı giriniz.');
  }

  customer.balance = Math.max(0, customer.balance - amount);
  customer.updated_at = now;

  const transaction: CustomerTransaction = {
    id: db.nextId.customerTransaction++,
    store_id: targetStoreId,
    customer_id: customer.id,
    type: 'TAHSILAT',
    amount: amount,
    note: params.note || 'Nakit / Havale Tahsilat',
    created_at: now,
  };

  db.customer_transactions.unshift(transaction);
  saveDb(db);
  return { customer, transaction };
}

export function getCustomerTransactions(customerId: number, storeId?: number): CustomerTransaction[] {
  const list = loadDb().customer_transactions;
  return list.filter(t => t.customer_id === customerId && (!storeId || t.store_id === storeId));
}

// Aliases for API compatibility
export const saveCustomer = addCustomer;
export function addCustomerPayment(params: { customer_id: number; amount: number; note?: string; store_id?: number }): CustomerTransaction {
  return recordCustomerPayment({
    customerId: params.customer_id,
    amount: params.amount,
    note: params.note,
    store_id: params.store_id,
  }).transaction;
}

// ================= STOCK MOVEMENTS =================
export function addStockMovement(data: {
  store_id?: number;
  product_id: number;
  type: 'GIRIS' | 'CIKIS' | 'IADE';
  quantity: number;
  note?: string;
}): StockMovement {
  const db = loadDb();
  const targetStoreId = data.store_id || 1;
  const product = db.products.find(p => p.id === data.product_id && p.store_id === targetStoreId);
  if (!product) throw new Error('Ürün bulunamadı');

  const now = new Date().toISOString();
  const multiplier = data.type === 'GIRIS' || data.type === 'IADE' ? 1 : -1;
  const effectiveChange = data.quantity * multiplier;

  product.stock_quantity += effectiveChange;
  product.updated_at = now;

  const movement: StockMovement = {
    id: db.nextId.movement++,
    store_id: targetStoreId,
    product_id: product.id,
    product_name: product.name,
    barcode: product.barcode,
    type: data.type,
    quantity: effectiveChange,
    note: data.note,
    created_at: now,
  };

  db.stock_movements.unshift(movement);
  saveDb(db);
  return movement;
}

export function getStockMovements(storeId?: number): StockMovement[] {
  const movements = loadDb().stock_movements;
  if (storeId) {
    return movements.filter(m => m.store_id === storeId);
  }
  return movements;
}

// ================= AUDIT / SAYIM METHODS (A4 ÇÖZÜMÜ) =================
export function getActiveAuditSession(storeId?: number): AuditSession | undefined {
  const targetStoreId = storeId || 1;
  return loadDb().audit_sessions.find(
    s => s.store_id === targetStoreId && (s.status === 'ACTIVE' || s.status === 'PAUSED')
  );
}

export function getAuditSessions(storeId?: number): AuditSession[] {
  const sessions = loadDb().audit_sessions;
  if (storeId) {
    return sessions.filter(s => s.store_id === storeId);
  }
  return sessions;
}

export function startAuditSession(name: string, storeId?: number): AuditSession {
  const db = loadDb();
  const targetStoreId = storeId || 1;
  const existing = db.audit_sessions.find(
    s => s.store_id === targetStoreId && (s.status === 'ACTIVE' || s.status === 'PAUSED')
  );
  if (existing) {
    if (existing.status === 'PAUSED') {
      existing.status = 'ACTIVE';
      saveDb(db);
    }
    return existing;
  }

  const newSession: AuditSession = {
    id: db.nextId.session++,
    store_id: targetStoreId,
    session_name: name || `Sayım Oturumu - ${new Date().toLocaleDateString('tr-TR')}`,
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
    items: [],
  };

  db.audit_sessions.unshift(newSession);
  saveDb(db);
  return newSession;
}

export function pauseAuditSession(sessionId: number): AuditSession {
  const db = loadDb();
  const session = db.audit_sessions.find(s => s.id === sessionId);
  if (!session) throw new Error('Sayım oturumu bulunamadı');
  session.status = 'PAUSED';
  saveDb(db);
  return session;
}

export function resumeAuditSession(sessionId: number): AuditSession {
  const db = loadDb();
  const session = db.audit_sessions.find(s => s.id === sessionId);
  if (!session) throw new Error('Sayım oturumu bulunamadı');
  session.status = 'ACTIVE';
  saveDb(db);
  return session;
}

export function cancelAuditSession(sessionId: number): AuditSession {
  const db = loadDb();
  const session = db.audit_sessions.find(s => s.id === sessionId);
  if (!session) throw new Error('Sayım oturumu bulunamadı');
  session.status = 'CANCELLED';
  session.completed_at = new Date().toISOString();
  saveDb(db);
  return session;
}

export function scanAuditBarcode(params: {
  sessionId: number;
  barcode: string;
  quantityDelta?: number;
  absoluteQuantity?: number;
}): { session: AuditSession; scannedItem: AuditItem; product: Product } {
  const db = loadDb();
  const session = db.audit_sessions.find(s => s.id === params.sessionId);
  if (!session) throw new Error('Sayım oturumu bulunamadı');
  if (session.status !== 'ACTIVE' && session.status !== 'PAUSED') throw new Error('Bu sayım oturumu aktif değil');
  if (session.status === 'PAUSED') session.status = 'ACTIVE';

  const product = db.products.find(
    p => p.store_id === session.store_id && p.barcode === params.barcode.trim()
  );
  if (!product) throw new Error(`Bu mağazada kayıtlı barkod bulunamadı: ${params.barcode}`);

  let item = session.items.find(i => i.product_id === product.id);
  const now = new Date().toISOString();

  if (item) {
    if (params.absoluteQuantity !== undefined) {
      item.counted_quantity = params.absoluteQuantity;
    } else {
      item.counted_quantity += (params.quantityDelta ?? 1);
    }
    item.variance = item.counted_quantity - item.expected_quantity;
    item.scanned_at = now;
  } else {
    const counted = params.absoluteQuantity !== undefined ? params.absoluteQuantity : (params.quantityDelta ?? 1);
    item = {
      id: db.nextId.auditItem++,
      session_id: session.id,
      product_id: product.id,
      barcode: product.barcode,
      name: product.name,
      variant: product.variant,
      expected_quantity: product.stock_quantity,
      counted_quantity: counted,
      variance: counted - product.stock_quantity,
      scanned_at: now,
    };
    session.items.unshift(item);
  }

  saveDb(db);
  return { session, scannedItem: item, product };
}

export function completeAuditSession(sessionId: number, applyToStock: boolean): AuditSession {
  const db = loadDb();
  const session = db.audit_sessions.find(s => s.id === sessionId);
  if (!session) throw new Error('Sayım oturumu bulunamadı');
  if (session.status === 'COMPLETED') return session;

  const now = new Date().toISOString();
  session.status = 'COMPLETED';
  session.completed_at = now;

  if (applyToStock) {
    for (const item of session.items) {
      const product = db.products.find(p => p.id === item.product_id && p.store_id === session.store_id);
      if (product) {
        const diff = item.variance;
        if (diff !== 0) {
          product.stock_quantity = item.counted_quantity;
          product.updated_at = now;

          db.stock_movements.push({
            id: db.nextId.movement++,
            store_id: session.store_id,
            product_id: product.id,
            product_name: product.name,
            barcode: product.barcode,
            type: 'SAYIM_DUZELTME',
            quantity: diff,
            note: `Sayım Eşitleme (${session.session_name}): ${item.expected_quantity} -> ${item.counted_quantity} (${diff > 0 ? '+' : ''}${diff})`,
            created_at: now,
          });
        }
      }
    }
  }

  saveDb(db);
  return session;
}

// ================= EXPENSES & MASRAF METHODS =================
export function addExpense(params: {
  storeId: number;
  title: string;
  category: Expense['category'];
  amount: number;
  note?: string;
}): Expense {
  const db = loadDb();
  const expense: Expense = {
    id: db.nextId.expense++,
    store_id: params.storeId,
    title: params.title.trim(),
    category: params.category,
    amount: Number(params.amount),
    note: params.note?.trim(),
    created_at: new Date().toISOString(),
  };

  db.expenses.push(expense);
  saveDb(db);
  return expense;
}

export function getExpenses(storeId: number): Expense[] {
  const db = loadDb();
  return db.expenses
    .filter(e => e.store_id === storeId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function deleteExpense(id: number, storeId: number): boolean {
  const db = loadDb();
  const idx = db.expenses.findIndex(e => e.id === id && e.store_id === storeId);
  if (idx !== -1) {
    db.expenses.splice(idx, 1);
    saveDb(db);
    return true;
  }
  return false;
}

// ================= STORE SETTINGS & SUPPLIER METHODS =================
export function updateStoreSupplierSettings(
  storeId: number,
  settings: {
    auto_supplier_whatsapp?: boolean;
    supplier_name?: string;
    supplier_phone?: string;
    patron_pin?: string;
    tax_id?: string;
    tax_office?: string;
    scale_prefix?: string;
  }
): Store {
  const db = loadDb();
  const store = db.stores.find(s => s.id === storeId);
  if (!store) throw new Error('Mağaza bulunamadı');

  if (settings.auto_supplier_whatsapp !== undefined) {
    store.auto_supplier_whatsapp = settings.auto_supplier_whatsapp;
  }
  if (settings.supplier_name !== undefined) {
    store.supplier_name = settings.supplier_name;
  }
  if (settings.supplier_phone !== undefined) {
    store.supplier_phone = settings.supplier_phone;
  }
  if (settings.patron_pin !== undefined) {
    store.patron_pin = settings.patron_pin;
  }
  if (settings.tax_id !== undefined) {
    store.tax_id = settings.tax_id;
  }
  if (settings.tax_office !== undefined) {
    store.tax_office = settings.tax_office;
  }
  if (settings.scale_prefix !== undefined) {
    store.scale_prefix = settings.scale_prefix;
  }

  saveDb(db);
  return store;
}

// ================= DAILY Z REPORT (GÜN SONU MUTABAKAT) =================
export interface DailyZReport {
  date: string;
  storeName: string;
  salesCount: number;
  totalGrossSales: number;
  totalDiscount: number;
  totalNetSales: number;
  cashSales: number;
  cardSales: number;
  veresiyeSales: number;
  collectionsCash: number; // Veresiye tahsilatları
  totalExpenses: number; // Masraflar
  theoreticalCash: number; // Kasada olması gereken nakit
  expensesList: Expense[];
  whatsappSummaryText: string;
}

export function getDailyZReport(storeId: number, targetDate?: string): DailyZReport {
  const db = loadDb();
  const store = db.stores.find(s => s.id === storeId) || db.stores[0];

  const now = targetDate ? new Date(targetDate) : new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).getTime();

  // 1. O günkü satışlar
  const daySales = db.sales.filter(s => {
    if (s.store_id !== storeId) return false;
    const t = new Date(s.created_at).getTime();
    return t >= startOfDay && t <= endOfDay;
  });

  let totalNetSales = 0;
  let totalDiscount = 0;
  let cashSales = 0;
  let cardSales = 0;
  let veresiyeSales = 0;

  for (const s of daySales) {
    totalNetSales += s.total_amount;
    totalDiscount += s.discount || 0;
    if (s.payment_method === 'NAKIT') cashSales += s.total_amount;
    else if (s.payment_method === 'KREDI_KARTI') cardSales += s.total_amount;
    else if (s.payment_method === 'VERESIYE') veresiyeSales += s.total_amount;
  }

  // 2. O günkü veresiye nakit tahsilatları
  const dayTransactions = db.customer_transactions.filter(tx => {
    if (tx.store_id !== storeId || tx.type !== 'TAHSILAT') return false;
    const t = new Date(tx.created_at).getTime();
    return t >= startOfDay && t <= endOfDay;
  });

  const collectionsCash = dayTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  // 3. O günkü masraflar / giderler
  const dayExpenses = db.expenses.filter(e => {
    if (e.store_id !== storeId) return false;
    const t = new Date(e.created_at).getTime();
    return t >= startOfDay && t <= endOfDay;
  });

  const totalExpenses = dayExpenses.reduce((sum, e) => sum + e.amount, 0);

  // 4. Kasada Olması Gereken Nakit: (Nakit Satışlar + Nakit Veresiye Tahsilatları) - Masraflar
  const theoreticalCash = Math.max(0, cashSales + collectionsCash - totalExpenses);

  const formattedDate = now.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const whatsappSummaryText =
`📊 *[ESNAFCEPTE GÜN SONU Z RAPORU]*
🏪 *Dükkan:* ${store.name}
📅 *Tarih:* ${formattedDate}
━━━━━━━━━━━━━━━━━━
💰 *Toplam Satış Cirosu:* ₺${totalNetSales.toFixed(2)} (${daySales.length} Fiş)
💵 *Nakit Satış:* ₺${cashSales.toFixed(2)}
💳 *Kredi Kartı (POS):* ₺${cardSales.toFixed(2)}
📒 *Veresiye Satış:* ₺${veresiyeSales.toFixed(2)}
━━━━━━━━━━━━━━━━━━
📥 *Veresiye Tahsilatı:* +₺${collectionsCash.toFixed(2)}
💸 *Günlük Masraflar:* -₺${totalExpenses.toFixed(2)}
━━━━━━━━━━━━━━━━━━
⭐ *KASADA OLMASI GEREKEN NAKİT:* ₺${theoreticalCash.toFixed(2)}

_EsnafCepte • İnanoraSoft ile otomatik oluşturuldu._`;

  return {
    date: formattedDate,
    storeName: store.name,
    salesCount: daySales.length,
    totalGrossSales: totalNetSales + totalDiscount,
    totalDiscount,
    totalNetSales,
    cashSales,
    cardSales,
    veresiyeSales,
    collectionsCash,
    totalExpenses,
    theoreticalCash,
    expensesList: dayExpenses,
    whatsappSummaryText,
  };
}
