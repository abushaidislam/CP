import type { StateStorage } from "zustand/middleware";
import {
  cacheComponentPreview,
  getCachedPreviewSync,
  setCachedPreviewSync,
} from "@/lib/cache/preview-cache";
import {
  createInitialUserComponents,
  DEFAULT_TEMPLATE_PREVIEWS,
  normalizeStudioFiles,
} from "./default-previews";
import type {
  ComponentVariant,
  RecordingConfig,
  StudioFiles,
  StudioState,
  UserComponent,
} from "./types";

const memoryStorageFallback = new Map<string, string>();
let pendingStorageTimer: ReturnType<typeof setTimeout> | null = null;
let pendingStorageWrite: { name: string; value: string } | null = null;

export const flushPendingStorageNow = (): void => {
  if (pendingStorageTimer) {
    clearTimeout(pendingStorageTimer);
    pendingStorageTimer = null;
  }
  if (pendingStorageWrite) {
    const { name, value } = pendingStorageWrite;
    pendingStorageWrite = null;
    flushToLocalStorage(name, value);
  }
};

export const flushToLocalStorage = (name: string, value: string): void => {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(name, value);
  } catch {
    // Recover from QuotaExceededError (5MB browser localStorage limit with 30+ components & base64 PNGs)
    // Offload heavy preview images to Browser Cache (IndexedDB + CacheStorage) before slimming localStorage
    try {
      const parsed = JSON.parse(value);
      if (parsed?.state) {
        // Step 1: Trim checkpoint histories to latest 3 per variant
        if (parsed.state.variantsByTemplate) {
          for (const tid of Object.keys(parsed.state.variantsByTemplate)) {
            const list = parsed.state.variantsByTemplate[tid];
            if (Array.isArray(list)) {
              parsed.state.variantsByTemplate[tid] = list.map((v: ComponentVariant) => ({
                ...v,
                checkpoints: Array.isArray(v.checkpoints) ? v.checkpoints.slice(0, 3) : [],
              }));
            }
          }
        }
        // Step 2: Persist oversized base64 PNG strings (>80KB) in Browser Cache (IndexedDB/CacheStorage)
        // and replace only the localStorage copy so localStorage stays under 5MB
        if (parsed.state.userComponents) {
          for (const cid of Object.keys(parsed.state.userComponents)) {
            const c = parsed.state.userComponents[cid];
            if (
              c?.previewImage &&
              c.previewImage.startsWith("data:image/png;base64,") &&
              c.previewImage.length > 80_000
            ) {
              setCachedPreviewSync(cid, c.previewImage);
              void cacheComponentPreview(cid, c.previewImage);
              c.previewImage =
                DEFAULT_TEMPLATE_PREVIEWS[cid] || DEFAULT_TEMPLATE_PREVIEWS["blank"];
            }
          }
        }
        window.localStorage.setItem(name, JSON.stringify(parsed));
      }
    } catch {
      // Ignore if storage remains locked
    }
  }
};

export const resilientStudioStorage: StateStorage = {
  getItem: (name: string): string | null => {
    const inMemory = memoryStorageFallback.get(name);
    if (inMemory !== undefined) return inMemory;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(name);
      }
    } catch {
      // Fallback to in-memory storage
    }
    return null;
  },
  setItem: (name: string, value: string): void => {
    memoryStorageFallback.set(name, value);
    if (typeof window === "undefined" || !window.localStorage) return;
    pendingStorageWrite = { name, value };
    if (pendingStorageTimer) {
      clearTimeout(pendingStorageTimer);
    }
    pendingStorageTimer = setTimeout(() => {
      pendingStorageTimer = null;
      pendingStorageWrite = null;
      flushToLocalStorage(name, value);
    }, 400);
  },
  removeItem: (name: string): void => {
    if (pendingStorageTimer) {
      clearTimeout(pendingStorageTimer);
      pendingStorageTimer = null;
    }
    pendingStorageWrite = null;
    memoryStorageFallback.delete(name);
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(name);
      }
    } catch {
      // Ignore
    }
  },
};

export function studioPersistMerge(
  persistedState: unknown,
  currentState: StudioState
): StudioState {
  const persisted = (persistedState || {}) as Partial<StudioState>;
  const initialComponents = createInitialUserComponents();

  // Migrate legacy/invalid persisted model IDs to valid Gemini models
  const VALID_AI_MODELS = new Set([
    "gemini-4-hydrogen",
    "gemini-4-argon",
    "gemini-3.1-flash-lite",
  ]);
  const persistedModel =
    persisted.aiModel && VALID_AI_MODELS.has(persisted.aiModel)
      ? persisted.aiModel
      : "gemini-4-hydrogen";

  const mergedFiles: StudioFiles = {
    ...currentState.files,
    ...(persisted.files || {}),
    "default.tsx":
      persisted.files?.["default.tsx"] ??
      persisted.files?.["demo.tsx"] ??
      currentState.files["default.tsx"] ??
      currentState.files["demo.tsx"] ??
      "",
    "demo.tsx":
      persisted.files?.["demo.tsx"] ??
      persisted.files?.["default.tsx"] ??
      currentState.files["demo.tsx"] ??
      "",
  };

  // Normalize all persisted userComponents so legacy components (with only "demo.tsx")
  // always have both "default.tsx" and "demo.tsx" populated.
  const normalizedPersistedComponents: Record<string, UserComponent> = {};
  for (const [id, comp] of Object.entries(persisted.userComponents || {})) {
    if (!comp) continue;
    const cachedPreview = getCachedPreviewSync(id);
    const hasCustomPreview =
      comp.previewImage &&
      comp.previewImage !== "./preview.png" &&
      comp.previewImage !== DEFAULT_TEMPLATE_PREVIEWS["blank"];
    const resolvedPreview = hasCustomPreview
      ? comp.previewImage
      : cachedPreview || comp.previewImage;
    if (resolvedPreview && resolvedPreview !== DEFAULT_TEMPLATE_PREVIEWS["blank"]) {
      setCachedPreviewSync(id, resolvedPreview);
    }
    normalizedPersistedComponents[id] = {
      ...comp,
      previewImage: resolvedPreview,
      files: normalizeStudioFiles(comp.files),
    };
  }

  // Normalize all persisted variants and checkpoints as well
  const normalizedPersistedVariants: Record<string, ComponentVariant[]> = {};
  for (const [tid, varList] of Object.entries(persisted.variantsByTemplate || {})) {
    if (!Array.isArray(varList)) continue;
    normalizedPersistedVariants[tid] = varList.map((v) => ({
      ...v,
      files: normalizeStudioFiles(v.files),
      checkpoints: Array.isArray(v.checkpoints)
        ? v.checkpoints.map((cp) => ({
            ...cp,
            files: normalizeStudioFiles(cp.files),
          }))
        : [],
    }));
  }

  const legacyRec = (persisted.recordingConfig || {}) as Partial<RecordingConfig> & {
    duration?: number;
    resolution?: string;
  };
  const validDuration: 5 | 8 | 12 | 15 =
    legacyRec.duration === 5 ||
    legacyRec.duration === 8 ||
    legacyRec.duration === 12 ||
    legacyRec.duration === 15
      ? legacyRec.duration
      : 8;
  const validResolution: "1080p" | "720p" =
    legacyRec.resolution === "720p" ? "720p" : "1080p";

  const deletedBuiltInSet = new Set(
    Array.isArray(persisted.deletedBuiltInIds) ? persisted.deletedBuiltInIds : []
  );
  const filteredInitialComponents: Record<string, UserComponent> = {};
  for (const [id, comp] of Object.entries(initialComponents)) {
    if (!deletedBuiltInSet.has(id)) {
      filteredInitialComponents[id] = comp;
    }
  }
  for (const deletedId of deletedBuiltInSet) {
    delete normalizedPersistedComponents[deletedId];
  }

  return {
    ...currentState,
    ...persisted,
    aiModel: persistedModel,
    files: mergedFiles,
    deletedBuiltInIds: Array.from(deletedBuiltInSet),
    recordingConfig: {
      ...currentState.recordingConfig,
      ...legacyRec,
      duration: validDuration,
      resolution: validResolution,
    },
    userComponents: {
      ...filteredInitialComponents,
      ...normalizedPersistedComponents,
    },
    variantsByTemplate: {
      ...currentState.variantsByTemplate,
      ...normalizedPersistedVariants,
    },
    activeVariantByTemplate: {
      ...currentState.activeVariantByTemplate,
      ...(persisted.activeVariantByTemplate || {}),
    },
  };
}
