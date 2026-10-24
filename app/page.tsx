'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Barcode,
  Package,
  ArrowLeftRight,
  BarChart3,
  Store,
  Clock,
  Sparkles,
  Smartphone,
  Tag,
  Users,
  ChevronDown,
  Check,
  Plus,
  X,
  LogOut,
  Zap,
  Globe,
  User as UserIcon,
  Truck,
  Settings,
  Menu,
} from 'lucide-react';
import PosView from '@/components/PosView';
import AuditView from '@/components/AuditView';
import ProductsView from '@/components/ProductsView';
import BarcodeLabelPrinter from '@/components/BarcodeLabelPrinter';
import CustomersView, { Customer } from '@/components/CustomersView';
import SuppliersView from '@/components/SuppliersView';
import MovementsView from '@/components/MovementsView';
import ReportsView from '@/components/ReportsView';
import SettingsView from '@/components/SettingsView';
import LandingView from '@/components/LandingView';
import RegisterModal from '@/components/RegisterModal';
import LoginModal from '@/components/LoginModal';
import MobileAuthScreen from '@/components/MobileAuthScreen';
import UpgradePlanModal from '@/components/UpgradePlanModal';
import FeatureLockedModal from '@/components/FeatureLockedModal';
import { StoreSector, User, Store as DbStore } from '@/lib/db';
import { LockedFeature } from '@/lib/plans';
import { Capacitor } from '@capacitor/core';

interface StoreItem {
  id: number;
  name: string;
  sector: StoreSector;
  phone?: string;
  address?: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'POS' | 'AUDIT' | 'PRODUCTS' | 'LABELS' | 'CUSTOMERS' | 'SUPPLIERS' | 'MOVEMENTS' | 'REPORTS' | 'SETTINGS'>('POS');
  const [time, setTime] = useState<string>('');
  const [selectedCustomerForSale, setSelectedCustomerForSale] = useState<Customer | null>(null);

  // Landing Page & Auth Flow States
  const [isLandingView, setIsLandingView] = useState<boolean>(true);
  const [registerModalOpen, setRegisterModalOpen] = useState<boolean>(false);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState<boolean>(false);
  const [lockedFeature, setLockedFeature] = useState<LockedFeature | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Mobile App Dedicated Mode
  const [isMobileApp, setIsMobileApp] = useState<boolean>(false);
  const [showLandingFromMobile, setShowLandingFromMobile] = useState<boolean>(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);

  // Multi-Store State
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [activeStoreId, setActiveStoreId] = useState<number>(1);
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const [newStoreModalOpen, setNewStoreModalOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreSector, setNewStoreSector] = useState<StoreSector>('MARKET');
  const [newStorePhone, setNewStorePhone] = useState('');
  const [newStoreSeedTemplate, setNewStoreSeedTemplate] = useState(true);
  const [creatingStore, setCreatingStore] = useState(false);

  const storeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTime(new Date().toLocaleTimeString('tr-TR'));
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('tr-TR'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (storeDropdownRef.current && !storeDropdownRef.current.contains(event.target as Node)) {
        setStoreDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchStores();
    // Check mobile app native environment or query param
    try {
      const isNative = Capacitor.isNativePlatform();
      const isAppQuery = typeof window !== 'undefined' && (
        window.location.search.includes('app=true') ||
        window.location.search.includes('mobile=true')
      );
      if (isNative || isAppQuery) {
        setIsMobileApp(true);
      }
    } catch {
      // ignore
    }

    // Check localStorage for saved session
    try {
      const savedUser = localStorage.getItem('esnafcepte_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        setCurrentUser(u);
        if (u.store_id) setActiveStoreId(u.store_id);
        setIsLandingView(false);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchStores = async () => {
    try {
      const res = await fetch('/api/stores');
      if (res.ok) {
        const data = await res.json();
        setStores(data);
        if (data.length > 0 && !activeStoreId) {
          setActiveStoreId(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoginSuccess = (user: User, store: StoreItem | DbStore) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('esnafcepte_user', JSON.stringify(user));
    } catch {}
    fetchStores();
    setActiveStoreId(store.id);
    setIsLandingView(false);
  };

  const handleRegisterSuccess = (user: User, store: StoreItem | DbStore) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('esnafcepte_user', JSON.stringify(user));
    } catch {}
    fetchStores();
    setActiveStoreId(store.id);
    setIsLandingView(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('esnafcepte_user');
    } catch {}
    setIsLandingView(true);
  };

  const handleEnterLiveDemo = (sector?: StoreSector) => {
    setIsLandingView(false);
    if (sector && stores.length > 0) {
      const matched = stores.find(s => s.sector === sector);
      if (matched) {
        setActiveStoreId(matched.id);
      }
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) {
      alert('Lütfen mağaza adını giriniz');
      return;
    }

    setCreatingStore(true);
    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStoreName.trim(),
          sector: newStoreSector,
          phone: newStorePhone.trim(),
          seedTemplate: newStoreSeedTemplate,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        await fetchStores();
        setActiveStoreId(created.id);
        setNewStoreModalOpen(false);
        setNewStoreName('');
        setNewStorePhone('');
      } else {
        const err = await res.json();
        alert(err.error || 'Mağaza oluşturulamadı');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Hata oluştu');
    } finally {
      setCreatingStore(false);
    }
  };

  const activeStore = stores.find(s => s.id === activeStoreId) || stores[0] || null;

  // Kalan deneme gün sayısı
  let remainingTrialDays = 14;
  if (currentUser?.trial_ends_at) {
    const diff = new Date(currentUser.trial_ends_at).getTime() - Date.now();
    remainingTrialDays = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  // 0. Mobil Uygulama Modu (Native Android/iOS veya ?app=true)
  // Mobil uygulamada tanıtım sayfaları gizlenir, doğrudan güvenli giriş ve 2FA ekranı açılır.
  if (isMobileApp && !currentUser && !showLandingFromMobile) {
    return (
      <MobileAuthScreen
        onSuccess={handleLoginSuccess}
        onOpenLandingSite={() => {
          if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
            window.open('https://esnafcepte.inanora.com', '_system');
          } else {
            setShowLandingFromMobile(true);
          }
        }}
      />
    );
  }

  // 1. Ziyaretçi Tanıtım Sitesini İncelemek İstiyorsa (Landing Page)
  if (isLandingView) {
    return (
      <>
        {showLandingFromMobile && (
          <div className="fixed top-4 left-4 z-50">
            <button
              onClick={() => setShowLandingFromMobile(false)}
              className="bg-slate-900/90 backdrop-blur hover:bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-full shadow-lg border border-slate-700 flex items-center gap-2 transition-all"
            >
              <span>←</span>
              <span>Mobil Giriş Ekranına Dön</span>
            </button>
          </div>
        )}

        <LandingView
          onOpenRegister={() => setRegisterModalOpen(true)}
          onOpenLogin={() => setLoginModalOpen(true)}
          onEnterLiveDemo={handleEnterLiveDemo}
          onOpenBrochures={() => {
            window.location.href = '/brosur';
          }}
        />

        <RegisterModal
          isOpen={registerModalOpen}
          onClose={() => setRegisterModalOpen(false)}
          onSuccess={handleRegisterSuccess}
          onOpenLogin={() => {
            setRegisterModalOpen(false);
            setLoginModalOpen(true);
          }}
        />

        <LoginModal
          isOpen={loginModalOpen}
          onClose={() => setLoginModalOpen(false)}
          onSuccess={handleLoginSuccess}
          onOpenRegister={() => {
            setLoginModalOpen(false);
            setRegisterModalOpen(true);
          }}
        />
      </>
    );
  }

  // Drawer Navigation Items Definition
  const drawerNavItems = [
    { id: 'POS' as const, label: 'Kasa Satış', desc: 'Hızlı barkodlu satış & fiş', icon: CreditCard },
    { id: 'AUDIT' as const, label: 'Stok Sayımı', desc: 'Kamera barkod okuyucu & vizör', icon: Barcode },
    { id: 'PRODUCTS' as const, label: 'Ürünler & Stok', desc: 'Katalog, fiyatlar & kritik stok', icon: Package },
    { id: 'LABELS' as const, label: 'Barkod & Raf Etiketi', desc: 'Fiyat etiketi basımı & şablonlar', icon: Tag },
    { id: 'CUSTOMERS' as const, label: 'Veresiye Defteri', desc: 'Müşteri hesapları & borç takibi', icon: Users },
    { id: 'SUPPLIERS' as const, label: 'Toptancılar', desc: 'Alış faturaları & toptancı borçları', icon: Truck },
    { id: 'MOVEMENTS' as const, label: 'Kasa & Stok Hareketleri', desc: 'Giriş / çıkış hareket günlüğü', icon: ArrowLeftRight },
    { id: 'REPORTS' as const, label: 'Raporlar & Z Raporu', desc: 'Gün sonu, ciro & kar analizi', icon: BarChart3 },
    { id: 'SETTINGS' as const, label: 'Dükkan & Donanım Ayarları', desc: 'GİB e-fatura, terazi, POS, yazıcı', icon: Settings },
  ];

  // 2. Esnaf Dükkan & Kasa Yönetim Paneli
  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Sol Açılır Menü (Slide-over Drawer) */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex animate-fade-in">
          {/* Arka Plan Karartması */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Sol Panel */}
          <div className="relative w-80 max-w-[85vw] bg-slate-900 border-r border-slate-800 text-white flex flex-col h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {/* Panel Üst Başlığı */}
            <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border-b border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white leading-tight">
                      Esnaf<span className="text-emerald-400">Cepte</span>
                    </h2>
                    <span className="text-[10px] text-slate-400">Mobil Kasa & Stok</span>
                  </div>
                </div>

                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label="Menüyü Kapat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Dükkan Bilgisi Kartı */}
              <div className="p-3 rounded-2xl bg-slate-800/90 border border-slate-700/80">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl p-1 bg-slate-900 rounded-xl border border-slate-700/50">
                    {activeStore?.sector === 'MARKET' ? '🛒' : activeStore?.sector === 'BUTIK_GIYIM' ? '👗' : activeStore?.sector === 'HIRDAVAT' ? '🔧' : '📚'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">
                      {currentUser ? 'Dükkanınız' : 'Demo Dükkan'}
                    </div>
                    <div className="text-xs font-bold text-white truncate">
                      {activeStore?.name || 'EsnafCepte'}
                    </div>
                  </div>
                </div>

                {/* Kullanıcı & Paket Rozeti */}
                {currentUser && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-semibold text-white truncate max-w-[120px]">{currentUser.name}</span>
                    </div>
                    <button
                      onClick={() => {
                        setMobileDrawerOpen(false);
                        setUpgradeModalOpen(true);
                      }}
                      className="px-2 py-0.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[10px] border border-amber-500/30 transition-all"
                    >
                      {remainingTrialDays}g Deneme ⚡
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Navigasyon Menü Listesi */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Menü & Modüller
              </div>

              {drawerNavItems.map(item => {
                const isActive = activeTab === item.id;
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/25'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-xl ${isActive ? 'bg-white/20' : 'bg-slate-800 text-slate-400'}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="leading-tight">{item.label}</div>
                        <div className={`text-[10px] font-normal ${isActive ? 'text-emerald-100' : 'text-slate-500'}`}>
                          {item.desc}
                        </div>
                      </div>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-white" />}
                  </button>
                );
              })}
            </div>

            {/* Menü Altı: Çıkış Butonu & Ekstra İşlemler */}
            <div className="p-3 border-t border-slate-800 bg-slate-950 space-y-2">
              <button
                onClick={() => {
                  setMobileDrawerOpen(false);
                  setIsLandingView(true);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-800 transition-all"
              >
                <span className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-teal-400" />
                  <span>Tanıtım & Fiyatlar Sitesi</span>
                </span>
                <span className="text-[10px] text-slate-500">➔</span>
              </button>

              {currentUser ? (
                <button
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 text-red-400 hover:text-red-300 border border-red-500/30 rounded-2xl font-bold text-xs transition-all"
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                  <span>Güvenli Çıkış Yap</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    setLoginModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs transition-all shadow-md shadow-emerald-600/30"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Dükkan Girişi Yap</span>
                </button>
              )}

              <div className="pt-1 text-center">
                <p className="text-[10px] text-slate-400 font-medium">
                  İnanoraSoft Bulut Perakende Teknolojileri © 2026
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Navbar: Clean & Spacious with Hamburger Menu */}
      <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex items-center justify-between">
          
          {/* Left: Hamburger Button, Brand & Store Selector */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Hamburger Menü Butonu (Sol Açılır Menüyü Tetikler) */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="p-2 -ml-1 text-slate-300 hover:text-white hover:bg-slate-800 active:bg-slate-700 rounded-xl transition-all flex items-center justify-center shrink-0 border border-slate-700/60"
              title="Menüyü Aç"
              aria-label="Menüyü Aç"
            >
              <Menu className="w-5 h-5 text-emerald-400" />
            </button>

            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-wide text-white">
                Esnaf<span className="text-emerald-400">Cepte</span>
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30 hidden sm:inline">
                Bulut POS
              </span>
            </div>

            {/* Store Badge or Selector */}
            {currentUser ? (
              /* Giriş Yapmış Esnaf: Kendi Dükkanı Sabit Rozet Olarak Gösterilir */
              <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 rounded-xl shadow-inner max-w-[130px] sm:max-w-[200px]">
                <span className="text-xs">
                  {activeStore?.sector === 'MARKET' ? '🛒' : activeStore?.sector === 'BUTIK_GIYIM' ? '👗' : activeStore?.sector === 'HIRDAVAT' ? '🔧' : '📚'}
                </span>
                <div className="text-left min-w-0">
                  <div className="text-[8px] text-emerald-400 font-bold uppercase tracking-wider leading-none hidden sm:block">Dükkanınız</div>
                  <div className="text-xs font-bold text-white truncate leading-tight">
                    {activeStore?.name || 'Dükkanım'}
                  </div>
                </div>
              </div>
            ) : (
              /* Giriş Yapmamış Ziyaretçi: Canlı Demo Dükkan Değiştirici */
              <div className="relative" ref={storeDropdownRef}>
                <button
                  onClick={() => setStoreDropdownOpen(prev => !prev)}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 px-2.5 py-1 rounded-xl transition-all"
                  title="Demo Sektörü Değiştir"
                >
                  <span className="text-xs">
                    {activeStore?.sector === 'MARKET' ? '🛒' : activeStore?.sector === 'BUTIK_GIYIM' ? '👗' : activeStore?.sector === 'HIRDAVAT' ? '🔧' : '📚'}
                  </span>
                  <span className="text-xs font-bold text-white max-w-[100px] sm:max-w-[160px] truncate leading-tight">
                    {activeStore?.name || 'Dükkan Seç'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
                </button>

                {/* Store Dropdown Menu */}
                {storeDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 space-y-1 animate-fade-in">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
                      <span>Örnek Sektör Dükkanları</span>
                      <span className="text-amber-400 font-mono">Demo Modu</span>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {stores.map(s => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setActiveStoreId(s.id);
                            setStoreDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between text-xs transition-colors ${
                            s.id === activeStoreId ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-base shrink-0">
                              {s.sector === 'MARKET' ? '🛒' : s.sector === 'BUTIK_GIYIM' ? '👗' : s.sector === 'HIRDAVAT' ? '🔧' : '📚'}
                            </span>
                            <div>
                              <div className="font-bold leading-tight">{s.name}</div>
                              <div className="text-[10px] opacity-75 mt-0.5">
                                {s.sector === 'MARKET' ? 'Süpermarket' : s.sector === 'BUTIK_GIYIM' ? 'Butik & Giyim' : s.sector === 'HIRDAVAT' ? 'Hırdavat' : 'Tuhafiye & Kırtasiye'}
                              </div>
                            </div>
                          </div>
                          {s.id === activeStoreId && <Check className="w-4 h-4 text-white shrink-0" />}
                        </button>
                      ))}
                    </div>

                    <div className="pt-1.5 border-t border-slate-800">
                      <button
                        onClick={() => {
                          setStoreDropdownOpen(false);
                          setNewStoreModalOpen(true);
                        }}
                        className="w-full py-2 px-3 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Kendi Dükkanını Aç (14 Gün Ücretsiz)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Status, Trial Badge */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-300">
            {/* Trial Status Badge */}
            <button
              onClick={() => setUpgradeModalOpen(true)}
              className="bg-gradient-to-r from-amber-500/20 to-emerald-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 border border-amber-500/40 text-amber-300 px-2.5 sm:px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-sm text-xs"
              title="Paket detaylarını gör veya yükselt"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>
                {remainingTrialDays}g Deneme
              </span>
            </button>

            {/* Quick Settings Button (Masaüstü) */}
            <button
              onClick={() => setActiveTab('SETTINGS')}
              className={`p-1.5 rounded-xl border transition-all hidden sm:flex ${
                activeTab === 'SETTINGS'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
              }`}
              title="Sistem ve Donanım Ayarları"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Clock (Geniş Ekran) */}
            <div className="hidden xl:flex items-center gap-1.5 font-mono bg-slate-800/90 px-2.5 py-1.5 rounded-xl border border-slate-700/80">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold text-xs">{time || '12:00:00'}</span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-6 pb-6 md:pb-28">
        {activeTab === 'POS' && (
          <PosView
            storeId={activeStore?.id || 1}
            storeName={activeStore?.name || 'EsnafCepte'}
            initialCustomer={selectedCustomerForSale}
            onClearCustomer={() => setSelectedCustomerForSale(null)}
            userPlan={currentUser?.plan || 'TRIAL'}
            onFeatureLocked={feat => setLockedFeature(feat)}
          />
        )}
        {activeTab === 'AUDIT' && <AuditView storeId={activeStore?.id || 1} />}
        {activeTab === 'PRODUCTS' && (
          <ProductsView
            storeId={activeStore?.id || 1}
            storeName={activeStore?.name || 'EsnafCepte'}
            userPlan={currentUser?.plan || 'TRIAL'}
            onFeatureLocked={feat => setLockedFeature(feat)}
          />
        )}
        {activeTab === 'LABELS' && (
          <BarcodeLabelPrinter
            storeId={activeStore?.id || 1}
            storeName={activeStore?.name || 'EsnafCepte'}
            userPlan={currentUser?.plan || 'TRIAL'}
            onFeatureLocked={feat => setLockedFeature(feat)}
          />
        )}
        {activeTab === 'CUSTOMERS' && (
          <CustomersView
            storeId={activeStore?.id || 1}
            storeName={activeStore?.name || 'EsnafCepte'}
            userPlan={currentUser?.plan || 'TRIAL'}
            onFeatureLocked={feat => setLockedFeature(feat)}
            onSelectCustomerForSale={(c) => {
              setSelectedCustomerForSale(c);
              setActiveTab('POS');
            }}
          />
        )}
        {activeTab === 'SUPPLIERS' && <SuppliersView storeId={activeStore?.id || 1} />}
        {activeTab === 'MOVEMENTS' && <MovementsView storeId={activeStore?.id || 1} />}
        {activeTab === 'REPORTS' && (
          <ReportsView
            storeId={activeStore?.id || 1}
            storeName={activeStore?.name || 'EsnafCepte'}
          />
        )}
        {activeTab === 'SETTINGS' && (
          <SettingsView
            storeId={activeStore?.id || 1}
            onSettingsSaved={() => {
              fetchStores();
            }}
          />
        )}
      </main>

      {/* Bottom Sticky Dock Navigation (Masaüstü Ekranlarda Görünür, Mobilde Sol Menü Kullanılır) */}
      <nav className="hidden md:block fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 shadow-2xl py-2 px-2 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-around gap-1 sm:gap-2">
          
          {/* 1. Hızlı Satış (Kasa) */}
          <button
            onClick={() => setActiveTab('POS')}
            className={`flex-1 flex flex-col items-center py-1.5 px-1 sm:px-2 rounded-2xl transition-all duration-200 ${
              activeTab === 'POS'
                ? 'bg-gradient-to-t from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/25 scale-105'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <CreditCard className="w-5 h-5 mb-1" />
            <span className="text-[11px] font-bold tracking-tight">Kasa Satış</span>
          </button>

          {/* 2. Stok Sayımı (Mobil Vizör) */}
          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`flex-1 flex flex-col items-center py-1.5 px-1 sm:px-2 rounded-2xl transition-all duration-200 ${
              activeTab === 'AUDIT'
                ? 'bg-gradient-to-t from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/25 scale-105'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Barcode className="w-5 h-5 mb-1" />
            <span className="text-[11px] font-bold tracking-tight">Stok Sayım</span>
          </button>

          {/* 3. Ürünler & Stok */}
          <button
            onClick={() => setActiveTab('PRODUCTS')}
            className={`flex-1 flex flex-col items-center py-1.5 px-1 sm:px-2 rounded-2xl transition-all duration-200 ${
              activeTab === 'PRODUCTS'
                ? 'bg-gradient-to-t from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/25 scale-105'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Package className="w-5 h-5 mb-1" />
            <span className="text-[11px] font-bold tracking-tight">Ürünler</span>
          </button>

          {/* 4. Raf Etiketi */}
          <button
            onClick={() => setActiveTab('LABELS')}
            className={`flex-1 flex flex-col items-center py-1.5 px-1 sm:px-2 rounded-2xl transition-all duration-200 ${
              activeTab === 'LABELS'
                ? 'bg-gradient-to-t from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/25 scale-105'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Tag className="w-5 h-5 mb-1" />
            <span className="text-[11px] font-bold tracking-tight">Etiket</span>
          </button>

          {/* 5. Müşteriler & Veresiye */}
          <button
            onClick={() => setActiveTab('CUSTOMERS')}
            className={`flex-1 flex flex-col items-center py-1.5 px-1 sm:px-2 rounded-2xl transition-all duration-200 ${
              activeTab === 'CUSTOMERS'
                ? 'bg-gradient-to-t from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/25 scale-105'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-5 h-5 mb-1" />
            <span className="text-[11px] font-bold tracking-tight">Veresiye</span>
          </button>

          {/* 6. Toptancılar & Alış Faturaları */}
          <button
            onClick={() => setActiveTab('SUPPLIERS')}
            className={`flex-1 flex flex-col items-center py-1.5 px-1 sm:px-2 rounded-2xl transition-all duration-200 ${
              activeTab === 'SUPPLIERS'
                ? 'bg-gradient-to-t from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/25 scale-105'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Truck className="w-5 h-5 mb-1" />
            <span className="text-[11px] font-bold tracking-tight">Toptancı</span>
          </button>

          {/* 7. Stok Hareketleri */}
          <button
            onClick={() => setActiveTab('MOVEMENTS')}
            className={`flex-1 flex flex-col items-center py-1.5 px-1 sm:px-2 rounded-2xl transition-all duration-200 ${
              activeTab === 'MOVEMENTS'
                ? 'bg-gradient-to-t from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/25 scale-105'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ArrowLeftRight className="w-5 h-5 mb-1" />
            <span className="text-[11px] font-bold tracking-tight">Hareket</span>
          </button>

          {/* 8. Raporlar */}
          <button
            onClick={() => setActiveTab('REPORTS')}
            className={`flex-1 flex flex-col items-center py-1.5 px-1 sm:px-2 rounded-2xl transition-all duration-200 ${
              activeTab === 'REPORTS'
                ? 'bg-gradient-to-t from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/25 scale-105'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-5 h-5 mb-1" />
            <span className="text-[11px] font-bold tracking-tight">Raporlar</span>
          </button>

          {/* 9. Ayarlar */}
          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`flex-1 flex flex-col items-center py-1.5 px-1 sm:px-2 rounded-2xl transition-all duration-200 ${
              activeTab === 'SETTINGS'
                ? 'bg-gradient-to-t from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/25 scale-105'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-5 h-5 mb-1" />
            <span className="text-[11px] font-bold tracking-tight">Ayarlar</span>
          </button>

        </div>
      </nav>

      {/* Modal: Yeni Dükkan / Şube Aç */}
      {newStoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-base text-slate-800">Yeni Dükkan / Şube Aç</h3>
              </div>
              <button
                onClick={() => setNewStoreModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStore} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Dükkan / İşletme Adı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Kardeşler Hırdavat & Nalburiye"
                  value={newStoreName}
                  onChange={e => setNewStoreName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">İşletme Sektörü *</label>
                <select
                  value={newStoreSector}
                  onChange={e => setNewStoreSector(e.target.value as StoreSector)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="MARKET">🛒 Süpermarket / Bakkal / Büfe</option>
                  <option value="KIRTASIYE_TUHAFIYE">📚 Kırtasiye / Tuhafiye / El İşi</option>
                  <option value="BUTIK_GIYIM">👗 Butik / Giyim / Ayakkabı</option>
                  <option value="HIRDAVAT">🔧 Hırdavat / Nalburiye / Yapı</option>
                  <option value="DIGER">🏬 Diğer Perakende</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Seçtiğiniz sektöre göre hazır ürünler, birimler ve barkodlar sisteme otomatik yüklenir.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Telefon Numarası (Opsiyonel)</label>
                <input
                  type="tel"
                  placeholder="05XX XXX XX XX"
                  value={newStorePhone}
                  onChange={e => setNewStorePhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="seedTemplate"
                  checked={newStoreSeedTemplate}
                  onChange={e => setNewStoreSeedTemplate(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 mt-0.5"
                />
                <label htmlFor="seedTemplate" className="text-slate-700 text-xs">
                  <strong>Sektörel Başlangıç Kataloğunu Yükle:</strong> Dükkanı açtığınızda örnek barkodlu ürünler hazır gelsin.
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewStoreModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-xs"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={creatingStore}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/30"
                >
                  {creatingStore ? 'Dükkan Açılıyor...' : 'Dükkanı Aç ve Giriş Yap'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Paket Yükseltme & Deneme Süresi */}
      <UpgradePlanModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        currentUser={currentUser}
        onPlanUpdated={(updatedUser) => {
          setCurrentUser(updatedUser);
          try {
            localStorage.setItem('esnafcepte_user', JSON.stringify(updatedUser));
          } catch {}
        }}
      />

      {/* Modal: Kayıt Ol */}
      <RegisterModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onSuccess={handleRegisterSuccess}
        onOpenLogin={() => {
          setRegisterModalOpen(false);
          setLoginModalOpen(true);
        }}
      />

      {/* Modal: Giriş Yap */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
        onOpenRegister={() => {
          setLoginModalOpen(false);
          setRegisterModalOpen(true);
        }}
      />

      {/* Modal: Özellik Kilidi (Plan Yükseltme Zorunluluğu) */}
      <FeatureLockedModal
        isOpen={lockedFeature !== null}
        feature={lockedFeature}
        onClose={() => setLockedFeature(null)}
        currentUser={currentUser}
        onPlanUpgraded={(updatedUser) => {
          setCurrentUser(updatedUser);
          try {
            localStorage.setItem('esnafcepte_user', JSON.stringify(updatedUser));
          } catch {}
          setLockedFeature(null);
        }}
      />
    </div>
  );
}
