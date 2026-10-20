import { UserPlan } from './db';

export interface PlanFeatureConfig {
  canUseWirelessPos: boolean;
  canUseThermalLabels: boolean;
  canImportExcel: boolean;
  canCreateMultiStore: boolean;
  maxProducts: number;
  maxCustomers: number;
}

export const PLAN_CONFIGS: Record<UserPlan, PlanFeatureConfig> = {
  TRIAL: {
    canUseWirelessPos: true,
    canUseThermalLabels: true,
    canImportExcel: true,
    canCreateMultiStore: true,
    maxProducts: Infinity,
    maxCustomers: Infinity,
  },
  STARTER: {
    canUseWirelessPos: false,
    canUseThermalLabels: false,
    canImportExcel: false,
    canCreateMultiStore: false,
    maxProducts: 1500,
    maxCustomers: 50,
  },
  GROWTH: {
    canUseWirelessPos: true,
    canUseThermalLabels: true,
    canImportExcel: true,
    canCreateMultiStore: false,
    maxProducts: Infinity,
    maxCustomers: Infinity,
  },
  ENTERPRISE: {
    canUseWirelessPos: true,
    canUseThermalLabels: true,
    canImportExcel: true,
    canCreateMultiStore: true,
    maxProducts: Infinity,
    maxCustomers: Infinity,
  },
};

export type LockedFeature =
  | 'WIRELESS_POS'
  | 'THERMAL_LABELS'
  | 'EXCEL_IMPORT'
  | 'MULTI_STORE'
  | 'PRODUCT_LIMIT'
  | 'CUSTOMER_LIMIT';

export interface LockDetails {
  feature: LockedFeature;
  title: string;
  description: string;
  icon: string;
  requiredPlan: 'GROWTH' | 'ENTERPRISE';
  planName: string;
  price: string;
}

export const LOCKED_FEATURE_DETAILS: Record<LockedFeature, LockDetails> = {
  WIRELESS_POS: {
    feature: 'WIRELESS_POS',
    title: 'Fiziki POS Kablosuz Tutar Gönderme',
    description:
      'Kasada sepet tutarını POS cihazına elle yazma devri bitti! Tutar tek tıkla Wi-Fi/Bluetooth ile POS cihazına aktarılır, sıfır atlama veya eksik çekim riski sıfırlanır.',
    icon: '💳',
    requiredPlan: 'GROWTH',
    planName: 'Büyüyen Esnaf Paketi',
    price: '₺999 / Ay',
  },
  THERMAL_LABELS: {
    feature: 'THERMAL_LABELS',
    title: '50x30mm Termal Rulo Raf Etiketi',
    description:
      'Pahalı A4 yapışkanlı kağıtlar yerine elinizdeki termal rulo yazıcıyla anında hızlı ve ekonomik raf etiketleri basın.',
    icon: '🏷️',
    requiredPlan: 'GROWTH',
    planName: 'Büyüyen Esnaf Paketi',
    price: '₺999 / Ay',
  },
  EXCEL_IMPORT: {
    feature: 'EXCEL_IMPORT',
    title: 'Toplu Excel & CSV İçe Aktarma Sihirbazı',
    description:
      'Binlerce ürünü tek tek elle girmek yerine toptancınızdan aldığınız Excel faturasını veya listesini 1 dakikada dükkanınıza yükleyin.',
    icon: '📊',
    requiredPlan: 'GROWTH',
    planName: 'Büyüyen Esnaf Paketi',
    price: '₺999 / Ay',
  },
  MULTI_STORE: {
    feature: 'MULTI_STORE',
    title: 'Çoklu Şube & Depo Yönetimi',
    description:
      'Birden fazla dükkanınızı veya deponuzu tek ekrandan yönetin, şubeler arası anlık stok transferi yapın ve konsolide ciro raporlarını görün.',
    icon: '🏢',
    requiredPlan: 'ENTERPRISE',
    planName: 'Kurumsal Paket',
    price: '₺1.999 / Ay',
  },
  PRODUCT_LIMIT: {
    feature: 'PRODUCT_LIMIT',
    title: '1.500 Ürün Limitine Ulaşıldı',
    description:
      'Başlangıç paketindeki 1.500 ürün kapasitesini doldurdunuz. Dükkanınızı sınırsız ürün ve varyantla büyütmek için paketinizi yükseltin.',
    icon: '📦',
    requiredPlan: 'GROWTH',
    planName: 'Büyüyen Esnaf Paketi',
    price: '₺999 / Ay',
  },
  CUSTOMER_LIMIT: {
    feature: 'CUSTOMER_LIMIT',
    title: '50 Veresiye Müşterisi Limitine Ulaşıldı',
    description:
      'Başlangıç paketinde tanımlı 50 müşteri kotasına ulaştınız. Sınırsız veresiye takibi ve otomatik WhatsApp ekstreleri için paketinizi yükseltin.',
    icon: '👥',
    requiredPlan: 'GROWTH',
    planName: 'Büyüyen Esnaf Paketi',
    price: '₺999 / Ay',
  },
};
