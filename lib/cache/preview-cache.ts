import type { UserComponent } from "@/lib/store/studio-store";

const IDB_NAME = "component-studio-browser-cache-v2";
const IDB_VERSION = 1;
const PREVIEW_STORE = "previews";
const REGISTRY_STORE = "components";
const CACHE_STORAGE_NAME = "component-studio-previews-cache-v2";

// L1 Instant synchronous in-memory cache so ComponentCard can read previews in 0ms
const memoryPreviewCache = new Map<string, string>();
let memoryComponentsCache: Record<string, UserComponent> | null = null;

function isValidPreview(preview?: string | null): preview is string {
  if (!preview || preview === "./preview.png") return false;
  // Never cache the generic blank wireframe placeholder SVG
  if (preview.includes("id%3D%22bl-grid%22") || preview.includes('id="bl-grid"')) {
    return false;
  }
  return true;
}

export function getCachedPreviewSync(componentId: string): string | undefined {
  return memoryPreviewCache.get(componentId);
}

export async function getCachedPreview(componentId: string): Promise<string | undefined> {
  const cached = memoryPreviewCache.get(componentId);
  if (cached) return cached;

  const db = await openPreviewDatabase();
  if (!db) return undefined;

  return new Promise((resolve) => {
    try {
      const request = db.transaction(PREVIEW_STORE, "readonly").objectStore(PREVIEW_STORE).get(componentId);
      request.onsuccess = () => {
        const preview = request.result;
        if (typeof preview === "string" && isValidPreview(preview)) {
          memoryPreviewCache.set(componentId, preview);
          resolve(preview);
        } else {
          resolve(undefined);
        }
      };
      request.onerror = () => resolve(undefined);
    } catch {
      resolve(undefined);
    }
  });
}

export function setCachedPreviewSync(
  componentId: string,
  previewImage: string
): void {
  if (!componentId || !isValidPreview(previewImage)) return;
  memoryPreviewCache.set(componentId, previewImage);
}

let cachedDbPromise: Promise<IDBDatabase | null> | null = null;

function openPreviewDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || typeof window.indexedDB === "undefined") {
    return Promise.resolve(null);
  }
  if (cachedDbPromise) {
    return cachedDbPromise;
  }

  cachedDbPromise = new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(PREVIEW_STORE)) {
          db.createObjectStore(PREVIEW_STORE);
        }
        if (!db.objectStoreNames.contains(REGISTRY_STORE)) {
          db.createObjectStore(REGISTRY_STORE);
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onclose = () => {
          cachedDbPromise = null;
        };
        db.onversionchange = () => {
          db.close();
          cachedDbPromise = null;
        };
        resolve(db);
      };
      request.onerror = () => {
        cachedDbPromise = null;
        resolve(null);
      };
    } catch {
      cachedDbPromise = null;
      resolve(null);
    }
  });

  return cachedDbPromise;
}

/**
 * Stores a single component's previewImage in L1 memory, IndexedDB, and Browser CacheStorage.
 */
export async function cacheComponentPreview(
  componentId: string,
  previewImage: string
): Promise<void> {
  if (!componentId || !isValidPreview(previewImage)) return;
  memoryPreviewCache.set(componentId, previewImage);

  if (typeof window === "undefined") return;

  // Native HTTP preview URLs are cached directly by the browser HTTP cache via immutable ETag headers.
  if (previewImage.startsWith("/api/repo-sync/preview/")) return;

  // 1. Save in IndexedDB
  try {
    const db = await openPreviewDatabase();
    if (db) {
      await new Promise<void>((resolve) => {
        const tx = db.transaction(PREVIEW_STORE, "readwrite");
        tx.objectStore(PREVIEW_STORE).put(previewImage, componentId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    }
  } catch {
    // Ignore IndexedDB quota/private mode errors
  }

  // 2. Also store in Browser CacheStorage API for fast native HTTP/Cache lookup
  try {
    if ("caches" in window) {
      const cache = await window.caches.open(CACHE_STORAGE_NAME);
      const cacheUrl = `/__studio_preview_cache__/${encodeURIComponent(componentId)}`;
      await cache.put(
        cacheUrl,
        new Response(previewImage, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        })
      );
    }
  } catch {
    // Ignore CacheStorage errors
  }
}

/**
 * Batch-saves multiple component previews and full component registry snapshot into IndexedDB & CacheStorage.
 */
export async function cacheComponentsBatch(
  components: Record<string, UserComponent>
): Promise<void> {
  if (!components || typeof components !== "object") return;

  memoryComponentsCache = components;
  const previewEntries: Array<[string, string]> = [];

  for (const [id, comp] of Object.entries(components)) {
    if (comp?.previewImage && isValidPreview(comp.previewImage)) {
      memoryPreviewCache.set(id, comp.previewImage);
      previewEntries.push([id, comp.previewImage]);
    }
  }

  if (typeof window === "undefined") return;

  try {
    const db = await openPreviewDatabase();
    if (db) {
      await new Promise<void>((resolve) => {
        const tx = db.transaction([PREVIEW_STORE, REGISTRY_STORE], "readwrite");
        const pStore = tx.objectStore(PREVIEW_STORE);
        for (const [id, img] of previewEntries) {
          pStore.put(img, id);
        }
        const rStore = tx.objectStore(REGISTRY_STORE);
        rStore.put(components, "all_user_components");
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    }
  } catch {
    // Ignore IndexedDB errors
  }

  try {
    if ("caches" in window && previewEntries.length > 0) {
      const cache = await window.caches.open(CACHE_STORAGE_NAME);
      await Promise.all(
        previewEntries.map(([id, img]) =>
          cache
            .put(
              `/__studio_preview_cache__/${encodeURIComponent(id)}`,
              new Response(img, {
                headers: {
                  "Content-Type": "text/plain; charset=utf-8",
                  "Cache-Control": "public, max-age=31536000, immutable",
                },
              })
            )
            .catch(() => {})
        )
      );
    }
  } catch {
    // Ignore CacheStorage errors
  }
}

/**
 * Loads all cached component previews and registry snapshot from IndexedDB / Browser CacheStorage.
 * Populates the L1 synchronous memory cache immediately.
 */
export async function loadBrowserCachedPreviews(): Promise<{
  previews: Record<string, string>;
  components: Record<string, UserComponent> | null;
}> {
  const previews: Record<string, string> = {};
  for (const [k, v] of memoryPreviewCache.entries()) {
    previews[k] = v;
  }

  if (typeof window === "undefined") {
    return { previews, components: memoryComponentsCache };
  }

  let cachedComponents: Record<string, UserComponent> | null =
    memoryComponentsCache;

  try {
    const db = await openPreviewDatabase();
    if (db) {
      await new Promise<void>((resolve) => {
        const tx = db.transaction([PREVIEW_STORE, REGISTRY_STORE], "readonly");
        const pStore = tx.objectStore(PREVIEW_STORE);
        const rStore = tx.objectStore(REGISTRY_STORE);

        const keysReq = pStore.getAllKeys();
        const valsReq = pStore.getAll();
        const compReq = rStore.get("all_user_components");

        tx.oncomplete = () => {
          const keys = keysReq.result || [];
          const vals = valsReq.result || [];
          for (let i = 0; i < keys.length; i++) {
            const k = String(keys[i]);
            const v = vals[i];
            if (typeof v === "string" && isValidPreview(v)) {
              previews[k] = v;
              memoryPreviewCache.set(k, v);
            }
          }
          if (compReq.result && typeof compReq.result === "object") {
            cachedComponents = compReq.result as Record<string, UserComponent>;
            memoryComponentsCache = cachedComponents;
            for (const [cid, c] of Object.entries(cachedComponents)) {
              if (c?.previewImage && isValidPreview(c.previewImage)) {
                previews[cid] = c.previewImage;
                memoryPreviewCache.set(cid, c.previewImage);
              }
            }
          }
          resolve();
        };
        tx.onerror = () => resolve();
      });
    }
  } catch {
    // Fallback to CacheStorage if IndexedDB was unavailable
  }

  // Fallback check in Browser CacheStorage if IndexedDB had no previews yet
  if (Object.keys(previews).length === 0 && "caches" in window) {
    try {
      const cache = await window.caches.open(CACHE_STORAGE_NAME);
      const requests = await cache.keys();
      await Promise.all(
        requests.map(async (req) => {
          const url = new URL(req.url, window.location.origin);
          const prefix = "/__studio_preview_cache__/";
          if (url.pathname.startsWith(prefix)) {
            const id = decodeURIComponent(url.pathname.slice(prefix.length));
            const res = await cache.match(req);
            if (res) {
              const text = await res.text();
              if (isValidPreview(text)) {
                previews[id] = text;
                memoryPreviewCache.set(id, text);
              }
            }
          }
        })
      );
    } catch {
      // Ignore
    }
  }

  return { previews, components: cachedComponents };
}

export async function removeCachedComponentPreview(
  componentId: string
): Promise<void> {
  memoryPreviewCache.delete(componentId);
  if (memoryComponentsCache && componentId in memoryComponentsCache) {
    const nextCache = { ...memoryComponentsCache };
    delete nextCache[componentId];
    memoryComponentsCache = nextCache;
  }
  if (typeof window === "undefined") return;

  try {
    const db = await openPreviewDatabase();
    if (db) {
      await new Promise<void>((resolve) => {
        const tx = db.transaction([PREVIEW_STORE, REGISTRY_STORE], "readwrite");
        tx.objectStore(PREVIEW_STORE).delete(componentId);
        const rStore = tx.objectStore(REGISTRY_STORE);
        const getReq = rStore.get("all_user_components");
        getReq.onsuccess = () => {
          const cached = getReq.result as Record<string, UserComponent> | undefined;
          if (cached && typeof cached === "object" && componentId in cached) {
            const updated = { ...cached };
            delete updated[componentId];
            memoryComponentsCache = updated;
            rStore.put(updated, "all_user_components");
          }
        };
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    }
  } catch {
    // Ignore
  }

  try {
    if ("caches" in window) {
      const cache = await window.caches.open(CACHE_STORAGE_NAME);
      await cache.delete(
        `/__studio_preview_cache__/${encodeURIComponent(componentId)}`
      );
    }
  } catch {
    // Ignore
  }
}
