import type { StoreConfig, Product, Additional, StoreStatus } from '../types.ts';
import { DEFAULT_CONFIG, DEFAULT_PRODUCTS, DEFAULT_ADDITIONALS } from '../data/defaultMenuData.ts';
import { computeStoreStatus } from './statusHelper.ts';
import { saveImageToIndexedDb, getImageFromIndexedDb } from './imageDb.ts';
import { normalizeCategoryKey, formatCategoryLabel, parseCustomCategories } from './formatters.ts';

export const CURRENT_DATA_VERSION = 2;
const LOCAL_MENU_DATA_KEY = 'faby_menu_data_v2';
const LEGACY_LOCAL_MENU_DATA_KEY = 'faby_menu_data_v1';
const LOCAL_ADMIN_CREDS_KEY = 'faby_admin_creds_v1';
const LOCAL_CUSTOM_API_KEY = 'faby_custom_api_url';

export interface MenuDataResponse {
  config: StoreConfig;
  products: Product[];
  additionals: Additional[];
  storeStatus: StoreStatus;
}

// In-memory cache to guarantee instant synchronization across views
let inMemoryCache: { config: StoreConfig; products: Product[]; additionals: Additional[] } | null = null;
let activeFetchPromise: Promise<MenuDataResponse> | null = null;

export function invalidateMenuCache() {
  inMemoryCache = null;
  activeFetchPromise = null;
}

/**
 * Get configured API Base URL (if user configured a custom backend, e.g. Render/Cloud Run, or VITE_API_URL)
 */
export function getApiBaseUrl(): string {
  try {
    const custom = localStorage.getItem(LOCAL_CUSTOM_API_KEY);
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, '');
    }
  } catch {}

  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // Default to same-origin relative paths (supports localhost, Netlify Functions, and any domain)
  return '';
}

export function setCustomApiBaseUrl(url: string) {
  try {
    if (url && url.trim()) {
      localStorage.setItem(LOCAL_CUSTOM_API_KEY, url.trim().replace(/\/+$/, ''));
    } else {
      localStorage.removeItem(LOCAL_CUSTOM_API_KEY);
    }
  } catch {}
}

/**
 * Checks if a photo URL looks valid and not like a broken dummy or missing local upload
 */
function isHealthyPhotoUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim();
  if (!clean) return false;
  // Data URLs and blob URLs are always valid
  if (clean.startsWith('data:') || clean.startsWith('blob:')) return true;
  // External URLs (Unsplash, HTTPS)
  if (clean.startsWith('http://') || clean.startsWith('https://')) return true;
  // Local existing static assets
  if (clean === '/logo_oficial.png' || clean === '/logo_oficial.jpg' || clean.startsWith('/pwa-')) return true;
  // Local uploads: only if they are known valid files or general paths
  return clean.startsWith('/');
}

/**
 * Get stored or default local menu data, ensuring all products have valid photos and config
 */
export function getLocalMenuData(): { config: StoreConfig; products: Product[]; additionals: Additional[] } {
  if (inMemoryCache) {
    return inMemoryCache;
  }

  // Clear legacy v1 data if v2 doesn't exist yet to prevent mobile stale cache retention
  try {
    if (!localStorage.getItem(LOCAL_MENU_DATA_KEY) && localStorage.getItem(LEGACY_LOCAL_MENU_DATA_KEY)) {
      localStorage.removeItem(LEGACY_LOCAL_MENU_DATA_KEY);
    }
  } catch {}

  try {
    const raw = localStorage.getItem(LOCAL_MENU_DATA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.config && Array.isArray(parsed.products) && parsed.products.length > 0) {
        const finalCustomCats = parseCustomCategories(parsed.config.customCategories);
        const result = {
          config: {
            ...DEFAULT_CONFIG,
            ...parsed.config,
            customCategories: finalCustomCats,
            version: CURRENT_DATA_VERSION,
          },
          products: parsed.products.sort((a: Product, b: Product) => (a.order || 99) - (b.order || 99)),
          additionals: Array.isArray(parsed.additionals) && parsed.additionals.length > 0 ? parsed.additionals : DEFAULT_ADDITIONALS,
        };
        inMemoryCache = result;
        return result;
      }
    }
  } catch (e) {
    console.warn('Could not read local menu cache:', e);
  }

  const defaultResult = {
    config: { ...DEFAULT_CONFIG, version: CURRENT_DATA_VERSION },
    products: [...DEFAULT_PRODUCTS],
    additionals: [...DEFAULT_ADDITIONALS],
  };
  inMemoryCache = defaultResult;
  return defaultResult;
}

/**
 * Save updated menu data to localStorage, IndexedDB and in-memory cache, and notify UI
 */
export function saveLocalMenuData(
  data: {
    config?: StoreConfig;
    products?: Product[];
    additionals?: Additional[];
  },
  emitEvents: boolean = true
) {
  const current = getLocalMenuData();
  const authoritativeCustom = data.config && data.config.customCategories !== undefined
    ? parseCustomCategories(data.config.customCategories)
    : parseCustomCategories(current.config?.customCategories);

  const updatedProducts = (data.products || current.products).map((p) => ({
    ...p,
    updatedAt: p.updatedAt || Date.now(),
  }));

  const updated = {
    config: {
      ...(data.config || current.config),
      customCategories: authoritativeCustom,
      version: CURRENT_DATA_VERSION,
      updatedAt: data.config?.updatedAt || Date.now(),
    },
    products: updatedProducts,
    additionals: data.additionals || current.additionals,
  };

  inMemoryCache = updated;

  // Persist base64 images into IndexedDB asynchronously for permanent device storage
  if (data.products && Array.isArray(data.products)) {
    data.products.forEach((p) => {
      if (p.id && p.photoUrl && p.photoUrl.startsWith('data:image')) {
        saveImageToIndexedDb(p.id, p.photoUrl).catch(() => {});
      }
    });
  }

  try {
    localStorage.setItem(LOCAL_MENU_DATA_KEY, JSON.stringify(updated));
  } catch (e) {
    try {
      const lightweight = {
        ...updated,
        products: updated.products.map((p) => ({
          ...p,
          photoUrl: p.photoUrl && p.photoUrl.startsWith('data:image') ? '' : p.photoUrl,
        })),
      };
      localStorage.setItem(LOCAL_MENU_DATA_KEY, JSON.stringify(lightweight));
    } catch {
      console.warn('LocalStorage quota or write warning (persisting in memory and IndexedDB):', e);
    }
  }

  // Notify other windows/tabs and components about the data change ONLY when requested
  if (emitEvents) {
    try {
      window.dispatchEvent(new CustomEvent('faby_menu_updated', { detail: updated }));
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('faby_menu_channel');
        bc.postMessage({ type: 'menu_updated', updatedAt: updated.config.updatedAt });
        bc.close();
      }
    } catch {}
  }

  return updated;
}

/**
 * Update a specific product directly in local cache
 */
export function updateLocalProduct(id: string, updates: Partial<Product>): Product[] {
  const current = getLocalMenuData();
  const index = current.products.findIndex((p) => p.id === id);
  let updatedProducts: Product[];

  const now = Date.now();
  if (index > -1) {
    updatedProducts = current.products.map((p) =>
      p.id === id ? ({ ...p, ...updates, updatedAt: now } as Product) : p
    );
  } else {
    const def = DEFAULT_PRODUCTS.find((p) => p.id === id);
    const newProd = ({ ...(def || {}), id, ...updates, updatedAt: now } as Product);
    updatedProducts = [...current.products, newProd];
  }

  saveLocalMenuData({ products: updatedProducts }, true);
  return updatedProducts;
}

/**
 * Fetch menu data from server with automatic seamless offline/Netlify fallback.
 * Deduplicates in-flight requests, prioritizes fast static JSON endpoints,
 * preserves user-saved newer product modifications and photos, and falls back instantaneously.
 */
export async function fetchMenuDataWithFallback(): Promise<MenuDataResponse> {
  if (activeFetchPromise) {
    return activeFetchPromise;
  }

  activeFetchPromise = (async (): Promise<MenuDataResponse> => {
    const apiBase = getApiBaseUrl();
    const timestamp = Date.now();

    // Query live authoritative server database endpoint first, then static /api/menu.json as fallback
    const endpointCandidates = [
      apiBase ? `${apiBase}/api/menu?_t=${timestamp}` : '',
      `/api/menu?_t=${timestamp}`,
      apiBase ? `${apiBase}/api/menu.json?_t=${timestamp}` : '',
      `/api/menu.json?_t=${timestamp}`,
    ].filter(Boolean);

    const endpoints = Array.from(new Set(endpointCandidates));

    for (const url of endpoints) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      try {
        const res = await fetch(url, {
          headers: {
            Accept: 'application/json',
            'Cache-Control': 'no-cache',
          },
          cache: 'no-store',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data && data.config && Array.isArray(data.products) && data.products.length > 0) {
            const serverProducts = data.products as Product[];

            // Central Shared Truth: The central server database is authoritative across all devices.
            // Products, prices, descriptions, availability, and photos from the server replace any outdated local copies.
            const sortedProducts = [...serverProducts].sort((a, b) => (a.order || 99) - (b.order || 99));

            // Server custom categories are authoritative
            const serverCustomCategories = parseCustomCategories(data.config?.customCategories);

            const finalConfig = {
              ...DEFAULT_CONFIG,
              ...data.config,
              customCategories: serverCustomCategories,
              version: CURRENT_DATA_VERSION,
              updatedAt: data.config?.updatedAt || Date.now(),
            };

            const finalAdditionals =
              Array.isArray(data.additionals) && data.additionals.length > 0
                ? data.additionals
                : DEFAULT_ADDITIONALS;

            saveLocalMenuData({
              config: finalConfig,
              products: sortedProducts,
              additionals: finalAdditionals,
            }, false); // Do not fire event to avoid triggering re-fetch loop

            return {
              config: finalConfig,
              products: sortedProducts,
              additionals: finalAdditionals,
              storeStatus: data.storeStatus || computeStoreStatus(finalConfig),
            };
          }
        }
      } catch {
        clearTimeout(timeoutId);
        // Continue to next endpoint attempt without delay
      }
    }

    // 2. Seamless instant fallback to local/bundled menu data
    const local = getLocalMenuData();
    const storeStatus = computeStoreStatus(local.config);

    return {
      config: local.config,
      products: local.products,
      additionals: local.additionals,
      storeStatus,
    };
  })().finally(() => {
    activeFetchPromise = null;
  });

  return activeFetchPromise;
}

/**
 * Local Admin Authentication & Credential Management for Static Hosting
 */
export function getLocalAdminCreds(): { email: string; passwordHash: string; recoveryKey: string } {
  try {
    const raw = localStorage.getItem(LOCAL_ADMIN_CREDS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}

  return {
    email: 'admin@fabylanches.com',
    passwordHash: 'admin',
    recoveryKey: 'FABY-ADMIN-RECOVERY',
  };
}

export function saveLocalAdminCreds(creds: { email?: string; passwordHash?: string; recoveryKey?: string }) {
  try {
    const current = getLocalAdminCreds();
    const updated = { ...current, ...creds };
    localStorage.setItem(LOCAL_ADMIN_CREDS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not persist admin credentials:', e);
  }
}

/**
 * Restore product photos from IndexedDB if localStorage has missing/partial data
 */
export async function hydratePhotosFromIndexedDb(products: Product[]): Promise<Product[]> {
  if (typeof window === 'undefined') return products;
  try {
    let hasChanges = false;
    const hydrated = await Promise.all(
      products.map(async (p) => {
        if (!p.photoUrl || p.photoUrl.startsWith('data:image')) {
          const cachedImg = await getImageFromIndexedDb(p.id);
          if (cachedImg && cachedImg !== p.photoUrl) {
            hasChanges = true;
            return { ...p, photoUrl: cachedImg };
          }
        }
        return p;
      })
    );
    if (hasChanges) {
      saveLocalMenuData({ products: hydrated });
    }
    return hydrated;
  } catch {
    return products;
  }
}

