import { getApiBaseUrl } from './menuStorage.ts';

/**
 * Utility for formatting product image URLs with automatic cache-busting
 * Prevents stale browser / CDN / Service Worker caching on desktop and mobile.
 */
export type ImageSize = 'thumbnail' | 'medium' | 'full';

/**
 * Utility for formatting product image URLs with responsive sizing and automatic cache-busting.
 * Optimizes Unsplash and external images to prevent downloading 600px+ images for small 120px thumbnails,
 * while ensuring local uploads and cache-busting timestamps function properly.
 */
export function getProductImageUrl(
  photoUrl?: string | null,
  updatedAt?: number | string | null,
  size: ImageSize = 'thumbnail'
): string {
  if (!photoUrl || typeof photoUrl !== 'string') return '';
  const clean = photoUrl.trim();
  if (!clean) return '';

  // Data URLs and blob URLs do not require cache busting or remote resizing
  if (clean.startsWith('data:') || clean.startsWith('blob:')) {
    return clean;
  }

  // If pointing to the default official logo in PNG, prefer WebP when available
  if (clean === '/logo_oficial.png' || clean === '/logo_oficial.jpg') {
    if (size === 'thumbnail') {
      return '/logo_oficial_sm.webp';
    }
    return '/logo_oficial.webp';
  }

  const v = updatedAt && Number(updatedAt) > 0 ? String(updatedAt) : 'v1';
  const apiBase = getApiBaseUrl();

  // If it's an uploaded relative path and an external apiBase is configured, prepend apiBase
  let targetUrl = clean;
  if (clean.startsWith('/uploads/') && apiBase) {
    targetUrl = `${apiBase}${clean}`;
  }

  try {
    if (targetUrl.includes('images.unsplash.com')) {
      const u = new URL(targetUrl);
      const width = size === 'thumbnail' ? '300' : size === 'medium' ? '500' : '900';
      const quality = size === 'thumbnail' ? '75' : size === 'medium' ? '80' : '85';
      u.searchParams.set('w', width);
      u.searchParams.set('q', quality);
      u.searchParams.set('auto', 'format');
      u.searchParams.set('fit', 'crop');
      u.searchParams.set('v', v);
      return u.toString();
    }

    if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
      const u = new URL(targetUrl);
      u.searchParams.set('v', v);
      return u.toString();
    }

    // Relative path (like /uploads/photo.jpg)
    const [pathPart, queryPart] = targetUrl.split('?');
    const params = new URLSearchParams(queryPart || '');
    params.set('v', v);
    return `${pathPart}?${params.toString()}`;
  } catch {
    return targetUrl;
  }
}

/**
 * Generates an optimized srcSet for responsive retina display (1x and 2x)
 */
export function getProductImageSrcSet(
  photoUrl?: string | null,
  updatedAt?: number | string | null
): string | undefined {
  if (!photoUrl || typeof photoUrl !== 'string') return undefined;
  if (!photoUrl.includes('images.unsplash.com')) return undefined;

  const thumb = getProductImageUrl(photoUrl, updatedAt, 'thumbnail');
  const medium = getProductImageUrl(photoUrl, updatedAt, 'medium');
  return `${thumb} 1x, ${medium} 2x`;
}

/**
 * Actively purge any stale image and menu caches from window.caches (Service Worker CacheStorage)
 */
export async function clearProductImageCaches(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    if ('caches' in window) {
      const keys = await window.caches.keys();
      for (const key of keys) {
        if (
          key.includes('product-images') ||
          key.includes('api-menu') ||
          key.includes('menu') ||
          key.includes('images') ||
          key.includes('workbox')
        ) {
          await window.caches.delete(key);
        }
      }
    }
  } catch (err) {
    console.warn('CacheStorage cleanup notice:', err);
  }
}
