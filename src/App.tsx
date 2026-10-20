import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Product, Additional, StoreConfig, StoreStatus, CartItem } from './types.ts';
import { Header } from './components/Header.tsx';
import { StoreStatusBanner } from './components/StoreStatusBanner.tsx';
import { SearchBar } from './components/SearchBar.tsx';
import { CategoryNav, type CategoryKey } from './components/CategoryNav.tsx';
import { ExperimenteSection } from './components/ExperimenteSection.tsx';
import { ProductCard } from './components/ProductCard.tsx';
import { CartBottomBar } from './components/CartBottomBar.tsx';
import { StoreInfoFooter } from './components/StoreInfoFooter.tsx';
import { SearchX } from 'lucide-react';

// Code-split modals and Admin Panel to drastically shrink initial JS bundle and parse time
const ProductModal = React.lazy(() => import('./components/ProductModal.tsx').then((m) => ({ default: m.ProductModal })));
const DrinkInquiryModal = React.lazy(() => import('./components/DrinkInquiryModal.tsx').then((m) => ({ default: m.DrinkInquiryModal })));
const PhotoZoomModal = React.lazy(() => import('./components/PhotoZoomModal.tsx').then((m) => ({ default: m.PhotoZoomModal })));
const CartDrawer = React.lazy(() => import('./components/CartDrawer.tsx').then((m) => ({ default: m.CartDrawer })));
const AdminPanel = React.lazy(() => import('./components/admin/AdminPanel.tsx').then((m) => ({ default: m.AdminPanel })));

import { fetchMenuDataWithFallback, getLocalMenuData, invalidateMenuCache, getApiBaseUrl, hydratePhotosFromIndexedDb } from './utils/menuStorage.ts';
import { clearProductImageCaches } from './utils/imageUrl.ts';
import { computeStoreStatus } from './utils/statusHelper.ts';
import { normalizeCategoryKey } from './utils/formatters.ts';
import { formatCategoryLabel } from './components/CategoryNav.tsx';

const LOCAL_STORAGE_CART_KEY = 'faby_cart_items_v1';

export default function App() {
  // Pre-load local cached menu data synchronously so the menu renders instantaneously (0ms)
  const initialLocal = useMemo(() => {
    try {
      const local = getLocalMenuData();
      return {
        config: local.config,
        products: local.products,
        additionals: local.additionals,
        storeStatus: computeStoreStatus(local.config),
      };
    } catch {
      return null;
    }
  }, []);

  // Application Data from Server (with instant local fallback)
  const [config, setConfig] = useState<StoreConfig | null>(() => initialLocal?.config || null);
  const [products, setProducts] = useState<Product[]>(() => initialLocal?.products || []);
  const [additionals, setAdditionals] = useState<Additional[]>(() => initialLocal?.additionals || []);
  const [storeStatus, setStoreStatus] = useState<StoreStatus | null>(() => initialLocal?.storeStatus || null);
  const [isLoading, setIsLoading] = useState<boolean>(() => !initialLocal?.config);
  const [dataError, setDataError] = useState<string | null>(null);

  // Search & Category Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('todos');

  // Shopping Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal States
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);
  const [inquiryDrink, setInquiryDrink] = useState<Product | null>(null);
  const [zoomedPhotoProduct, setZoomedPhotoProduct] = useState<Product | null>(null);

  // Admin Login state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() =>
    Boolean(localStorage.getItem('faby_admin_token'))
  );

  // Listen to popstate / hashchange for direct admin navigation
  useEffect(() => {
    // Ensure default initial page is the cardápio (cleans up any previous /admin path)
    if (typeof window !== 'undefined' && window.location.pathname.toLowerCase().includes('/admin')) {
      try {
        window.history.replaceState(null, '', '/');
      } catch {}
    }

    const handleUrlChange = () => {
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path.includes('/admin') || search.includes('admin') || hash.includes('admin')) {
        setIsAdminOpen(true);
      } else {
        setIsAdminOpen(false);
      }
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const handleOpenAdmin = () => {
    setIsAdminOpen(true);
    try {
      if (!window.location.pathname.includes('/admin')) {
        window.history.pushState(null, '', '/admin');
      }
    } catch {}
  };

  const handleCloseAdmin = () => {
    setIsAdminOpen(false);
    try {
      if (window.location.pathname.includes('/admin')) {
        window.history.pushState(null, '', '/');
      }
    } catch {}
  };

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_CART_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.warn('Could not persist cart to localStorage:', e);
    }
  }, [cartItems]);

  // Fetch full menu from server with automatic Netlify/offline fallback
  const fetchMenuData = useCallback(async (targetCategory?: string) => {
    try {
      invalidateMenuCache();
      const data = await fetchMenuDataWithFallback();
      setConfig(data.config);
      setProducts(data.products || []);
      setAdditionals(data.additionals || []);
      setStoreStatus(data.storeStatus);
      setDataError(null);
      if (targetCategory) {
        setSelectedCategory(normalizeCategoryKey(targetCategory));
        setSearchTerm('');
      }
    } catch (err: any) {
      console.error('Error fetching menu:', err);
      setDataError(err.message || 'Erro ao carregar o cardápio');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Multi-device real-time synchronization:
  // 1. Server-Sent Events (SSE) for instantaneous push across all open mobile & desktop pages
  // 2. Tab wake-up & window focus (unlocking mobile phone or switching tabs)
  // 3. Fallback lightweight version poll every 2 seconds
  // 4. BroadcastChannel for 0ms cross-tab synchronization
  useEffect(() => {
    fetchMenuData();

    // 1. Server-Sent Events listener for instant multi-device push
    let sse: EventSource | null = null;
    let sseReconnectTimer: any = null;
    let sseBackoff = 2000;

    const setupSSE = () => {
      if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') return;
      const apiBase = getApiBaseUrl();
      const isStaticHost =
        !apiBase &&
        (window.location.hostname.includes('netlify.app') ||
          window.location.hostname.includes('github.io') ||
          window.location.hostname.includes('vercel.app'));

      if (isStaticHost) return;

      try {
        if (sse) {
          try { sse.close(); } catch {}
          sse = null;
        }
        sse = new EventSource(`${apiBase}/api/sync/events`);

        sse.onopen = () => {
          sseBackoff = 2000;
        };

        sse.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data && (data.type === 'menu_updated' || data.type === 'connected')) {
              await clearProductImageCaches();
              invalidateMenuCache();
              fetchMenuData();
            }
          } catch {}
        };

        sse.onerror = () => {
          if (sse) {
            try { sse.close(); } catch {}
            sse = null;
          }
          if (!sseReconnectTimer) {
            sseReconnectTimer = setTimeout(() => {
              sseReconnectTimer = null;
              sseBackoff = Math.min(sseBackoff * 1.5, 12000);
              setupSSE();
            }, sseBackoff);
          }
        };
      } catch {}
    };

    setupSSE();

    // 2. Refresh immediately when mobile screen wakes up or user returns to tab
    const handleVisibilityOrFocus = async () => {
      if (document.visibilityState === 'visible') {
        await clearProductImageCaches();
        invalidateMenuCache();
        fetchMenuData();
        if (!sse) {
          setupSSE();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    window.addEventListener('online', handleVisibilityOrFocus);
    window.addEventListener('pageshow', handleVisibilityOrFocus);

    // 3. Periodic fallback poll every 2 seconds (checks /api/sync/version to ensure sync across devices)
    let lastKnownUpdatedAt = 0;
    const pollInterval = setInterval(async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const apiBase = getApiBaseUrl();
        const res = await fetch(`${apiBase}/api/sync/version?_t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
        });
        if (res.ok) {
          const info = await res.json();
          if (info && info.updatedAt && info.updatedAt > lastKnownUpdatedAt) {
            if (lastKnownUpdatedAt > 0) {
              await clearProductImageCaches();
              invalidateMenuCache();
              fetchMenuData();
            }
            lastKnownUpdatedAt = info.updatedAt;
          }
        }
      } catch {}
    }, 2000);

    // 4. Cross-tab instant communication via BroadcastChannel
    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel('faby_menu_channel');
        channel.onmessage = () => {
          invalidateMenuCache();
          fetchMenuData();
        };
      } catch {}
    }

    const handleMenuUpdated = () => {
      invalidateMenuCache();
      fetchMenuData();
    };

    window.addEventListener('faby_menu_updated', handleMenuUpdated);
    window.addEventListener('storage', handleMenuUpdated);

    return () => {
      if (sse) {
        try { sse.close(); } catch {}
      }
      if (sseReconnectTimer) clearTimeout(sseReconnectTimer);
      if (channel) channel.close();
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.removeEventListener('online', handleVisibilityOrFocus);
      window.removeEventListener('pageshow', handleVisibilityOrFocus);
      window.removeEventListener('faby_menu_updated', handleMenuUpdated);
      window.removeEventListener('storage', handleMenuUpdated);
    };
  }, [fetchMenuData]);

  // Total cart calculations
  const totalCartCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [cartItems]);

  const subtotalCents = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.totalPrice, 0);
  }, [cartItems]);

  // Product counts per category (supports all existing and upcoming categories dynamically)
  const productCounts = useMemo(() => {
    const counts: Record<string, number> = {
      todos: products.length,
      lanches: 0,
      cuscuz: 0,
      sopas: 0,
      bebidas: 0,
    };
    if (config?.customCategories && Array.isArray(config.customCategories)) {
      config.customCategories.forEach((cat) => {
        const id = typeof cat === 'string' ? normalizeCategoryKey(cat) : normalizeCategoryKey(cat.id);
        if (id) counts[id] = 0;
      });
    }
    products.forEach((p) => {
      const cat = normalizeCategoryKey(p.categoryId);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [products, config?.customCategories]);

  // Filtered products list with active accent-insensitive and multi-field search
  const filteredProducts = useMemo(() => {
    const normalize = (text?: string) =>
      text
        ? text
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
        : '';

    const hasSearch = searchTerm.trim() !== '';
    const query = normalize(searchTerm.trim());

    return products.filter((product) => {
      // 1. Search term filter (nome, descrição, ingredientes, sabor, categoria)
      if (hasSearch) {
        const matchesName = normalize(product.name).includes(query);
        const matchesDescription = normalize(product.description).includes(query);
        const matchesIngredients = product.ingredients?.some((ing) =>
          normalize(ing).includes(query)
        );
        const matchesFlavor = normalize(product.drinkDetails?.flavor).includes(query);
        const matchesCategory = normalize(product.categoryId).includes(query);

        if (!matchesName && !matchesDescription && !matchesIngredients && !matchesFlavor && !matchesCategory) {
          return false;
        }
      }

      // 2. Category filter
      if (selectedCategory !== 'todos') {
        const prodCat = normalizeCategoryKey(product.categoryId);
        const selCat = normalizeCategoryKey(selectedCategory);
        if (prodCat !== selCat) {
          return false;
        }
      }

      return true;
    });
  }, [products, selectedCategory, searchTerm]);

  // Add / Save item to cart
  const handleSaveToCart = (item: CartItem) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === item.id);
      if (existingIndex > -1) {
        const copy = [...prev];
        copy[existingIndex] = item;
        return copy;
      }
      return [...prev, item];
    });
    setCustomizingProduct(null);
    setEditingCartItem(null);
  };

  // Update item quantity in cart
  const handleUpdateQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((i) => {
        if (i.id === itemId) {
          const totalPrice = i.unitPriceWithAdditionals * newQty;
          return { ...i, quantity: newQty, totalPrice };
        }
        return i;
      })
    );
  };

  // Remove item from cart
  const handleRemoveItem = (itemId: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  // Clear cart
  const handleClearCart = () => {
    setCartItems([]);
  };

  // Open edit modal for cart item
  const handleEditCartItem = (item: CartItem) => {
    const originalProd = products.find((p) => p.id === item.productId);
    if (originalProd) {
      setEditingCartItem(item);
      setCustomizingProduct(originalProd);
      setIsCartOpen(false);
    }
  };

  // Add drink directly from upsell
  const handleAddDrinkDirect = (drink: Product) => {
    const size = drink.drinkDetails?.sizes?.find((s) => s.available && s.price > 0);
    const price = size ? size.price : drink.price;
    const newItem: CartItem = {
      id: `cart-drink-${Date.now()}`,
      productId: drink.id,
      productName: drink.name,
      basePrice: price,
      quantity: 1,
      removedIngredients: [],
      additionals: [],
      notes: '',
      drinkOption: size
        ? { sizeId: size.id, sizeName: size.name, flavor: drink.drinkDetails?.flavor }
        : undefined,
      unitPriceWithAdditionals: price,
      totalPrice: price,
    };
    setCartItems((prev) => [...prev, newItem]);
  };

  if (isLoading && !config) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-900 rounded-full animate-spin mb-4" />
        <p className="font-bold text-stone-700 text-sm">Carregando cardápio Faby Lanches...</p>
      </div>
    );
  }

  if (dataError && !config) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 text-center">
        <p className="font-bold text-rose-700 mb-2">Erro ao carregar o cardápio</p>
        <p className="text-stone-600 text-sm mb-4">{dataError}</p>
        <button
          onClick={() => fetchMenuData()}
          className="px-4 py-2 bg-purple-900 text-amber-300 font-bold rounded-xl text-sm"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans selection:bg-purple-200 selection:text-purple-950">
      {/* 1. CABEÇALHO COM LOGO E CARRINHO */}
      <Header
        customLogoUrl={config?.logoUrl}
        totalCartCount={totalCartCount}
        subtotalCents={subtotalCents}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAdmin={handleOpenAdmin}
      />

      {/* 2. STATUS DE FUNCIONAMENTO E PRAZO ESTIMADO */}
      {config && storeStatus && (
        <StoreStatusBanner config={config} status={storeStatus} />
      )}

      {/* 3. CAMPO DE BUSCA */}
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val);
          if (val.trim() !== '' && selectedCategory !== 'todos') {
            setSelectedCategory('todos');
          }
        }}
        resultCount={filteredProducts.length}
        totalProductsCount={products.length}
      />

      {/* 4. CATEGORIAS */}
      <CategoryNav
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        productCounts={productCounts}
        customCategories={config?.customCategories}
      />

      {/* 5. SEÇÃO "EXPERIMENTE" (apenas quando não há busca ativa e categoria for 'todos' ou 'lanches') */}
      {!searchTerm && (selectedCategory === 'todos' || selectedCategory === 'lanches') && config && (
        <ExperimenteSection
          products={products}
          experimentProductIds={config.experimentProductIds || []}
          onSelectProduct={(p) => {
            setEditingCartItem(null);
            setCustomizingProduct(p);
          }}
          onZoomPhoto={setZoomedPhotoProduct}
          onInquireDrink={setInquiryDrink}
        />
      )}

      {/* 6. PRODUTOS */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 w-full flex-1">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-200">
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <span>
              {normalizeCategoryKey(selectedCategory) === 'todos'
                ? 'Todos os Produtos'
                : normalizeCategoryKey(selectedCategory) === 'lanches'
                ? 'Lanches Artesanais'
                : normalizeCategoryKey(selectedCategory) === 'cuscuz'
                ? 'Cuscuz Tradicional'
                : normalizeCategoryKey(selectedCategory) === 'sopas'
                ? 'Sopas e Canjas'
                : normalizeCategoryKey(selectedCategory) === 'bebidas'
                ? 'Sucos e Vitaminas'
                : (config?.customCategories?.find((c) => (typeof c === 'string' ? normalizeCategoryKey(c) : normalizeCategoryKey(c.id)) === normalizeCategoryKey(selectedCategory)) as any)?.name || formatCategoryLabel(selectedCategory)}
            </span>
            <span className="text-sm font-semibold text-stone-600 bg-stone-200/70 px-2 py-0.5 rounded-full">
              {filteredProducts.length}
            </span>
          </h2>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-white rounded-2xl border border-stone-200 p-8 shadow-xs">
            <div className="w-16 h-16 mx-auto rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
              <SearchX className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-stone-800">
              {searchTerm
                ? 'Nenhum produto encontrado'
                : `Nenhum produto em "${formatCategoryLabel(selectedCategory, config?.customCategories)}" ainda`}
            </h3>
            <p className="text-sm text-stone-500 max-w-sm mx-auto leading-relaxed">
              {searchTerm
                ? `Não encontramos nenhum item correspondente a "${searchTerm}". Tente buscar por outro nome ou ingrediente.`
                : 'Esta categoria está cadastrada no cardápio e em breve novas delícias estarão disponíveis aqui!'}
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('todos');
              }}
              className="mt-2 px-5 py-2 rounded-xl bg-purple-900 text-amber-300 font-bold text-xs hover:bg-purple-800 transition cursor-pointer"
            >
              Ver cardápio completo
            </button>
          </div>
        ) : (
          /* Cards Grid: 1 column on mobile, 2 on tablet, up to 3 on desktop */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
            {filteredProducts.map((product, idx) => (
              <ProductCard
                key={product.id}
                product={product}
                isPriority={idx < 2}
                onSelect={(p) => {
                  setEditingCartItem(null);
                  setCustomizingProduct(p);
                }}
                onZoomPhoto={setZoomedPhotoProduct}
                onInquireDrink={setInquiryDrink}
                isFeatured={false}
              />
            ))}
          </div>
        )}
      </main>

      {/* 7. INFORMAÇÕES DA LOJA */}
      {config && storeStatus && (
        <StoreInfoFooter
          config={config}
          status={storeStatus}
          onOpenAdmin={() => setIsAdminOpen(true)}
          hasCartItems={totalCartCount > 0}
        />
      )}

      {/* BARRA FIXA INFERIOR NO CELULAR (COM CLEARANCE) */}
      <CartBottomBar
        totalCount={totalCartCount}
        subtotalCents={subtotalCents}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* MODAL DE PERSONALIZAÇÃO DO PRODUTO (LAZY) */}
      {customizingProduct && (
        <React.Suspense fallback={null}>
          <ProductModal
            product={products.find((p) => p.id === customizingProduct.id) || customizingProduct}
            additionals={additionals}
            existingItem={editingCartItem}
            onClose={() => {
              setCustomizingProduct(null);
              setEditingCartItem(null);
            }}
            onSaveToCart={handleSaveToCart}
          />
        </React.Suspense>
      )}

      {/* MODAL DE CONSULTA DE BEBIDAS SEM PREÇO (LAZY) */}
      {inquiryDrink && config && (
        <React.Suspense fallback={null}>
          <DrinkInquiryModal
            product={products.find((p) => p.id === inquiryDrink.id) || inquiryDrink}
            whatsappNumber={config.whatsappNumber}
            onClose={() => setInquiryDrink(null)}
          />
        </React.Suspense>
      )}

      {/* MODAL DE FOTO AMPLIADA (LAZY) */}
      {zoomedPhotoProduct && (
        <React.Suspense fallback={null}>
          <PhotoZoomModal
            product={products.find((p) => p.id === zoomedPhotoProduct.id) || zoomedPhotoProduct}
            onClose={() => setZoomedPhotoProduct(null)}
            onAdd={(p) => {
              setEditingCartItem(null);
              setCustomizingProduct(p);
            }}
          />
        </React.Suspense>
      )}

      {/* DRAWER DO CARRINHO & CHECKOUT (LAZY) */}
      {isCartOpen && config && storeStatus && (
        <React.Suspense fallback={null}>
          <CartDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            items={cartItems}
            config={config}
            status={storeStatus}
            allProducts={products}
            additionals={additionals}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onEditItem={handleEditCartItem}
            onAddDrinkDirect={handleAddDrinkDirect}
            onClearCart={handleClearCart}
            onApplyServerValidation={(updated) => setCartItems(updated)}
          />
        </React.Suspense>
      )}

      {/* PAINEL ADMINISTRATIVO PROTEGIDO (LAZY - LOADED ONLY ON DEMAND) */}
      {isAdminOpen && config && (
        <React.Suspense fallback={
          <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-purple-300 border-t-amber-400 rounded-full animate-spin" />
          </div>
        }>
          <AdminPanel
            isOpen={isAdminOpen}
            onClose={handleCloseAdmin}
            config={config}
            products={products}
            additionals={additionals}
            onRefreshData={fetchMenuData}
            onAuthChange={(loggedIn) => {
              setIsAdminLoggedIn(loggedIn);
            }}
          />
        </React.Suspense>
      )}
    </div>
  );
}
