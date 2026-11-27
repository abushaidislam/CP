import {
  getCachedPreviewSync,
  loadBrowserCachedPreviews,
  setCachedPreviewSync,
} from "@/lib/cache/preview-cache";
import {
  createDefaultVariant,
  DEFAULT_TEMPLATE_PREVIEWS,
  normalizeStudioFiles,
} from "../default-previews";
import type {
  ComponentVariant,
  RepoGitInfo,
  RepoSummaryInput,
  StudioFiles,
  StudioSliceCreator,
  StudioState,
  UserComponent,
} from "../types";

export type RepoSyncSlice = Pick<
  StudioState,
  | "isRepoSyncModalOpen"
  | "repoSyncStatus"
  | "autoSaveToRepo"
  | "lastRepoSyncError"
  | "repoGitInfo"
  | "githubRepoConfig"
  | "setRepoSyncModalOpen"
  | "setAutoSaveToRepo"
  | "setGithubRepoConfig"
  | "hydrateFromBrowserCache"
  | "seedRepoSummaries"
  | "hydrateSingleComponentFromServer"
  | "ensureComponentFilesLoaded"
  | "hydrateFromProjectRepo"
  | "saveComponentToProjectRepo"
  | "syncAllComponentsToProjectRepo"
  | "importWorkspaceBundle"
>;

interface RepoSyncApiResponse {
  success?: boolean;
  isPayloadTooLarge?: boolean;
  readOnlyFs?: boolean;
  error?: string;
  savedCount?: number;
  pushedComponentsCount?: number;
  savedRecords?: Array<{
    id: string;
    slug: string;
    repoPath: string;
    lastRepoSyncAt: number;
  }>;
  totalRepoComponents?: number;
  commitSha?: string;
  commitUrl?: string;
  githubPush?: {
    pushed: boolean;
    commitSha?: string;
    commitUrl?: string;
    error?: string;
  } | null;
}

async function parseSafeJson(res: Response): Promise<RepoSyncApiResponse> {
  if (typeof res.text === "function") {
    const raw = await res.text();
    try {
      return JSON.parse(raw) as RepoSyncApiResponse;
    } catch {
      const snippet = raw.replace(/<[^>]*>/g, " ").trim().slice(0, 140);
      const isTooLarge =
        res.status === 413 ||
        /Request Entity Too Large|Payload Too Large/i.test(raw);
      return {
        success: false,
        isPayloadTooLarge: isTooLarge,
        error: isTooLarge
          ? "Request payload exceeded server limit (HTTP 413)."
          : `Server returned non-JSON response (${res.status}): ${snippet || res.statusText}`,
      };
    }
  }
  return (await res.json()) as RepoSyncApiResponse;
}

function buildAuthHeaders(ownerSessionToken: string | null): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-Studio-Client": "component-studio",
    ...(ownerSessionToken ? { "X-Studio-Owner-Token": ownerSessionToken } : {}),
  };
}

export const createRepoSyncSlice: StudioSliceCreator<RepoSyncSlice> = (
  set,
  get
) => ({
  isRepoSyncModalOpen: false,
  repoSyncStatus: "idle",
  autoSaveToRepo: false,
  lastRepoSyncError: null,
  repoGitInfo: null,
  githubRepoConfig: {
    repo: "",
    branch: "main",
    token: "",
  },

  setRepoSyncModalOpen: (open) =>
    set({ isRepoSyncModalOpen: open, isPublishModalOpen: open }),

  setAutoSaveToRepo: (enabled) => set({ autoSaveToRepo: enabled }),

  setGithubRepoConfig: (config) =>
    set((state) => ({
      githubRepoConfig: {
        ...state.githubRepoConfig,
        ...config,
      },
    })),

  hydrateFromBrowserCache: async () => {
    if (typeof window === "undefined") return;
    try {
      const { previews, components: cachedComponents } =
        await loadBrowserCachedPreviews();
      const hasPreviews = Object.keys(previews).length > 0;
      const hasCachedComponents =
        cachedComponents && Object.keys(cachedComponents).length > 0;

      if (!hasPreviews && !hasCachedComponents) return;

      set((state) => {
        const nextUserComponents: Record<string, UserComponent> = {
          ...(cachedComponents || {}),
          ...(state.userComponents || {}),
        };
        let changed = false;
        const deletedSet = new Set(state.deletedBuiltInIds || []);

        if (hasCachedComponents) {
          for (const [id, cachedComp] of Object.entries(cachedComponents!)) {
            if (!nextUserComponents[id] && cachedComp && !deletedSet.has(id)) {
              nextUserComponents[id] = {
                ...cachedComp,
                files: normalizeStudioFiles(cachedComp.files),
              };
              changed = true;
            }
          }
        }

        for (const [id, comp] of Object.entries(nextUserComponents)) {
          if (!comp) continue;
          const cachedImg = previews[id];
          const isPlaceholder =
            !comp.previewImage ||
            comp.previewImage === "./preview.png" ||
            comp.previewImage === DEFAULT_TEMPLATE_PREVIEWS["blank"];
          if (cachedImg && (isPlaceholder || comp.previewImage !== cachedImg)) {
            nextUserComponents[id] = {
              ...comp,
              previewImage: cachedImg,
            };
            changed = true;
          }
        }

        if (!changed) return state;
        return {
          userComponents: nextUserComponents,
        };
      });
    } catch {
      // Ignore browser cache read errors
    }
  },

  seedRepoSummaries: (summaries) => {
    if (!Array.isArray(summaries) || summaries.length === 0) return;
    set((state) => {
      const nextUserComponents = { ...(state.userComponents || {}) };
      const summaryIdSet = new Set(summaries.map((s) => s.id));
      let changed = false;

      // Remove built-in or previously repo-synced components that were deleted from the authoritative server registry
      for (const [id, existing] of Object.entries(nextUserComponents)) {
        if (
          existing &&
          !summaryIdSet.has(id) &&
          (existing.savedInRepo === true ||
            (existing.isBuiltIn && existing.savedInRepo !== false))
        ) {
          delete nextUserComponents[id];
          changed = true;
        }
      }

      for (const summary of summaries) {
        const existing = nextUserComponents[summary.id];
        const resolvedPreview =
          summary.previewImage ||
          getCachedPreviewSync(summary.id) ||
          existing?.previewImage ||
          DEFAULT_TEMPLATE_PREVIEWS[summary.id] ||
          DEFAULT_TEMPLATE_PREVIEWS["blank"];

        setCachedPreviewSync(summary.id, resolvedPreview);

        if (!existing) {
          nextUserComponents[summary.id] = {
            id: summary.id,
            name: summary.name,
            description: summary.description,
            category: summary.category,
            isBuiltIn: summary.isBuiltIn,
            createdAt: summary.createdAt || summary.updatedAt || Date.now(),
            updatedAt: summary.updatedAt || Date.now(),
            files: {
              "component.tsx": "",
              "default.tsx": "",
              "demo.tsx": "",
              "index.css": "",
            },
            dependencies: summary.dependencies || [],
            previewImage: resolvedPreview,
            repoSlug: summary.repoSlug,
            repoPath: summary.repoPath,
            savedInRepo: true,
            lastRepoSyncAt: summary.lastRepoSyncAt,
            filesLoaded: false,
          };
          changed = true;
        } else {
          const shouldUpdateMeta =
            existing.savedInRepo !== false &&
            (summary.updatedAt || 0) >= (existing.updatedAt || 0);
          const needsPreviewUpgrade =
            Boolean(summary.previewImage) &&
            existing.previewImage !== summary.previewImage &&
            !existing.previewImage?.startsWith("data:image/png;base64,");

          if (shouldUpdateMeta || needsPreviewUpgrade || !existing.repoSlug) {
            nextUserComponents[summary.id] = {
              ...existing,
              name: shouldUpdateMeta ? summary.name : existing.name,
              description: shouldUpdateMeta
                ? summary.description
                : existing.description,
              category: shouldUpdateMeta ? summary.category : existing.category,
              previewImage: needsPreviewUpgrade
                ? resolvedPreview
                : existing.previewImage || resolvedPreview,
              repoSlug: summary.repoSlug || existing.repoSlug,
              repoPath: summary.repoPath || existing.repoPath,
              savedInRepo: true,
              lastRepoSyncAt:
                summary.lastRepoSyncAt || existing.lastRepoSyncAt,
            };
            changed = true;
          }
        }
      }

      if (!changed) return state;
      return { userComponents: nextUserComponents };
    });
  },

  hydrateSingleComponentFromServer: (component, variants, activeVariantId) => {
    if (!component?.id) return;
    const normalizedFiles = normalizeStudioFiles(component.files);
    set((state) => {
      const existing = state.userComponents?.[component.id];
      const isDirtyLocal =
        existing &&
        existing.savedInRepo === false &&
        Boolean(existing.files?.["component.tsx"]) &&
        (existing.updatedAt || 0) > (component.updatedAt || 0);

      const resolvedComp: UserComponent = isDirtyLocal
        ? {
            ...existing,
            repoSlug: component.repoSlug || existing.repoSlug,
            repoPath: component.repoPath || existing.repoPath,
            previewImage: existing.previewImage || component.previewImage,
            filesLoaded: true,
          }
        : {
            ...component,
            files: normalizedFiles,
            savedInRepo: true,
            filesLoaded: true,
          };

      const existingVariants = state.variantsByTemplate?.[component.id] || [];
      const nextVariants =
        Array.isArray(variants) && variants.length > 0 && !isDirtyLocal
          ? variants.map((v) => ({
              ...v,
              files: normalizeStudioFiles(v.files),
            }))
          : existingVariants.length > 0
          ? existingVariants
          : [
              createDefaultVariant(
                component.id,
                resolvedComp.files,
                resolvedComp.dependencies || []
              ),
            ];

      const resolvedActiveVariantId =
        activeVariantId ||
        state.activeVariantByTemplate?.[component.id] ||
        nextVariants[0]?.id;

      return {
        userComponents: {
          ...(state.userComponents || {}),
          [component.id]: resolvedComp,
        },
        variantsByTemplate: {
          ...(state.variantsByTemplate || {}),
          [component.id]: nextVariants,
        },
        activeVariantByTemplate: {
          ...(state.activeVariantByTemplate || {}),
          [component.id]: resolvedActiveVariantId,
        },
        currentTemplateId: component.id,
        files: resolvedComp.files,
        dependencies: [...(resolvedComp.dependencies || [])],
        compilerError: null,
        repoSyncStatus:
          state.repoSyncStatus === "syncing"
            ? "syncing"
            : resolvedComp.savedInRepo
            ? "synced"
            : "dirty",
        recentComponentIds: [
          component.id,
          ...(state.recentComponentIds || []).filter((cid) => cid !== component.id),
        ].slice(0, 50),
      };
    });
  },

  ensureComponentFilesLoaded: async (id) => {
    if (!id || typeof window === "undefined") return null;
    const current = get().userComponents?.[id];
    if (
      current &&
      current.filesLoaded !== false &&
      current.files?.["component.tsx"]
    ) {
      return current;
    }
    try {
      const res = await fetch(`/api/repo-sync?id=${encodeURIComponent(id)}`, {
        method: "GET",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return current || null;
      const data = (await res.json()) as {
        success?: boolean;
        component?: UserComponent;
        manifest?: {
          variants?: ComponentVariant[];
          activeVariantId?: string;
        };
      };
      if (!data.success || !data.component) return current || null;

      const fetched = data.component;
      const normalizedFiles = normalizeStudioFiles(fetched.files);
      set((state) => {
        const existing = state.userComponents?.[fetched.id];
        const mergedComp: UserComponent = {
          ...(existing || {}),
          ...fetched,
          files: normalizedFiles,
          savedInRepo: true,
          filesLoaded: true,
        };
        const isCurrentlyActive = state.currentTemplateId === fetched.id;
        const existingVariants = state.variantsByTemplate?.[fetched.id] || [];
        const nextVariants =
          Array.isArray(data.manifest?.variants) &&
          data.manifest.variants.length > 0
            ? data.manifest.variants.map((v) => ({
                ...v,
                files: normalizeStudioFiles(v.files),
              }))
            : existingVariants.length > 0
            ? existingVariants
            : [
                createDefaultVariant(
                  fetched.id,
                  normalizedFiles,
                  fetched.dependencies || []
                ),
              ];

        const nextActiveVariantId =
          data.manifest?.activeVariantId ||
          state.activeVariantByTemplate?.[fetched.id] ||
          nextVariants[0]?.id;

        return {
          userComponents: {
            ...(state.userComponents || {}),
            [fetched.id]: mergedComp,
          },
          variantsByTemplate: {
            ...(state.variantsByTemplate || {}),
            [fetched.id]: nextVariants,
          },
          activeVariantByTemplate: {
            ...(state.activeVariantByTemplate || {}),
            [fetched.id]: nextActiveVariantId,
          },
          ...(isCurrentlyActive
            ? {
                files: normalizedFiles,
                dependencies: [...(fetched.dependencies || [])],
                compilerError: null,
              }
            : {}),
        };
      });
      return get().userComponents?.[fetched.id] || fetched;
    } catch {
      return current || null;
    }
  },

  hydrateFromProjectRepo: async () => {
    if (typeof window === "undefined") return;
    // 1. Immediately restore previews from Browser Cache (IndexedDB / CacheStorage)
    void get().hydrateFromBrowserCache();

    try {
      // 2. Fetch lightweight summary index (~30KB JSON, binary preview URLs — ZERO base64 PNG bloat)
      const res = await fetch("/api/repo-sync?mode=summary", {
        method: "GET",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        success?: boolean;
        totalComponents?: number;
        summaries?: RepoSummaryInput[];
        gitInfo?: RepoGitInfo;
      };

      if (!data.success) return;

      if (Array.isArray(data.summaries) && data.summaries.length > 0) {
        get().seedRepoSummaries(data.summaries);
      }

      set((state) => {
        const activeComp = state.userComponents?.[state.currentTemplateId];
        return {
          repoGitInfo: data.gitInfo
            ? {
                ...data.gitInfo,
                totalComponents: data.totalComponents,
              }
            : state.repoGitInfo,
          repoSyncStatus:
            activeComp?.savedInRepo && state.repoSyncStatus === "idle"
              ? "synced"
              : state.repoSyncStatus,
        };
      });

      // 3. Ensure active component's source files are hydrated if currently summary-only
      const activeId = get().currentTemplateId;
      const activeComp = get().userComponents?.[activeId];
      if (
        activeComp &&
        (activeComp.filesLoaded === false || !activeComp.files?.["component.tsx"])
      ) {
        void get().ensureComponentFilesLoaded(activeId);
      }
    } catch {
      // Ignore network errors during initial background hydration
    }
  },

  saveComponentToProjectRepo: async (options = {}) => {
    const state = get();
    const targetId = options.componentId || state.currentTemplateId;
    const targetComp = state.userComponents?.[targetId];
    if (!targetComp) {
      return {
        success: false,
        error: "Active component not found in workspace.",
      };
    }

    // Ensure latest editor files are synced if saving the active component
    const compToSave: UserComponent =
      targetId === state.currentTemplateId
        ? {
            ...targetComp,
            files: {
              ...state.files,
              "default.tsx":
                state.files["default.tsx"] ?? state.files["demo.tsx"],
              "demo.tsx":
                state.files["demo.tsx"] ?? state.files["default.tsx"] ?? "",
            },
            dependencies: [...state.dependencies],
          }
        : targetComp;

    set({ repoSyncStatus: "syncing", lastRepoSyncError: null });

    try {
      const authHeaders = buildAuthHeaders(state.ownerSessionToken);
      let res = await fetch("/api/repo-sync", {
        method: "POST",
        credentials: "same-origin",
        headers: authHeaders,
        body: JSON.stringify({
          action: "save_component",
          component: compToSave,
          variants: state.variantsByTemplate?.[targetId] || [],
          activeVariantId: state.activeVariantByTemplate?.[targetId],
          commitMessage: options.commitMessage,
          commitToGit: true,
          pushToGithub: Boolean(options.pushToGithub),
          githubConfig: state.githubRepoConfig,
        }),
      });

      let data = await parseSafeJson(res);

      // Automatic fallback if reverse proxy rejected large checkpoint history / payload (HTTP 413)
      if (!res.ok && (res.status === 413 || data.isPayloadTooLarge)) {
        // First retry: drop heavy checkpoint history while preserving previewImage
        res = await fetch("/api/repo-sync", {
          method: "POST",
          credentials: "same-origin",
          headers: authHeaders,
          body: JSON.stringify({
            action: "save_component",
            component: compToSave,
            variants: [],
            activeVariantId: state.activeVariantByTemplate?.[targetId],
            commitMessage: options.commitMessage,
            commitToGit: true,
            pushToGithub: Boolean(options.pushToGithub),
            githubConfig: state.githubRepoConfig,
          }),
        });
        data = await parseSafeJson(res);
      }

      if (!res.ok && (res.status === 413 || data.isPayloadTooLarge)) {
        const slimComp: UserComponent = {
          ...compToSave,
          previewImage: compToSave.previewImage?.startsWith(
            "data:image/png;base64,"
          )
            ? undefined
            : compToSave.previewImage,
        };
        res = await fetch("/api/repo-sync", {
          method: "POST",
          credentials: "same-origin",
          headers: authHeaders,
          body: JSON.stringify({
            action: "save_component",
            component: slimComp,
            variants: [],
            activeVariantId: state.activeVariantByTemplate?.[targetId],
            commitMessage: options.commitMessage,
            commitToGit: true,
            pushToGithub: Boolean(options.pushToGithub),
            githubConfig: state.githubRepoConfig,
          }),
        });
        data = await parseSafeJson(res);
      }

      if (!res.ok || !data.success) {
        const errMsg =
          data.error || "Failed to save component to project repository.";
        set({ repoSyncStatus: "error", lastRepoSyncError: errMsg });
        return { success: false, error: errMsg };
      }

      if (options.pushToGithub && data.githubPush && !data.githubPush.pushed) {
        const ghErr =
          data.githubPush.error || "Saved locally, but GitHub push failed.";
        set({ repoSyncStatus: "error", lastRepoSyncError: ghErr });
        return { success: false, error: ghErr };
      }

      const record = data.savedRecords?.[0];
      const syncedAt = record?.lastRepoSyncAt || Date.now();

      set((s) => {
        const existing = s.userComponents?.[targetId] || compToSave;
        return {
          repoSyncStatus: "synced",
          lastRepoSyncError: null,
          repoGitInfo: s.repoGitInfo
            ? {
                ...s.repoGitInfo,
                lastCommitSha: data.commitSha || s.repoGitInfo.lastCommitSha,
                totalComponents:
                  data.totalRepoComponents ?? s.repoGitInfo.totalComponents,
              }
            : {
                lastCommitSha: data.commitSha,
                totalComponents: data.totalRepoComponents,
              },
          userComponents: {
            ...s.userComponents,
            [targetId]: {
              ...existing,
              repoSlug: record?.slug || existing.repoSlug,
              savedInRepo: true,
              lastRepoSyncAt: syncedAt,
              lastCommitSha: data.commitSha || existing.lastCommitSha,
              lastCommitUrl: data.commitUrl || existing.lastCommitUrl,
            },
          },
        };
      });

      get().addTerminalLog({
        type: "system",
        message: `[Repo Sync] Saved ${compToSave.name} to ${
          record?.repoPath || "registry/components"
        }${data.commitSha ? ` (commit ${data.commitSha})` : ""}.`,
      });

      return {
        success: true,
        repoPath: record?.repoPath,
        commitSha: data.commitSha,
        commitUrl: data.commitUrl,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      set({ repoSyncStatus: "error", lastRepoSyncError: msg });
      return { success: false, error: msg };
    }
  },

  syncAllComponentsToProjectRepo: async (options = {}) => {
    const state = get();
    // Only sync components whose source files are loaded (skip untouched summary-only repo entries so we never overwrite disk files with empty strings)
    const allComps = Object.values(state.userComponents || {}).filter(
      (c) =>
        c &&
        (c.id === state.currentTemplateId ||
          (c.filesLoaded !== false && Boolean(c.files?.["component.tsx"])))
    );
    if (allComps.length === 0) {
      return { success: false, error: "No components available to sync." };
    }

    const items = allComps.map((comp) => {
      const rawVariants = state.variantsByTemplate?.[comp.id] || [];
      // Trim heavy checkpoint history when syncing in bulk to keep payload compact
      const compactVariants = rawVariants.map((v) => ({
        ...v,
        files: normalizeStudioFiles(v.files),
        checkpoints: (v.checkpoints || []).slice(-2),
      }));
      const rawComp =
        comp.id === state.currentTemplateId
          ? {
              ...comp,
              files: normalizeStudioFiles(state.files),
              dependencies: [...state.dependencies],
            }
          : {
              ...comp,
              files: normalizeStudioFiles(comp.files),
            };

      // When syncing many components at once (>4), strip oversized base64 PNG strings (>80KB)
      // so all components fit in a single fast request and single atomic GitHub commit.
      const isOversizedPng =
        allComps.length > 4 &&
        rawComp.previewImage?.startsWith("data:image/png;base64,") &&
        rawComp.previewImage.length > 80_000;

      return {
        component: isOversizedPng
          ? { ...rawComp, previewImage: undefined }
          : rawComp,
        variants: compactVariants,
        activeVariantId: state.activeVariantByTemplate?.[comp.id],
      };
    });

    set({ repoSyncStatus: "syncing", lastRepoSyncError: null });

    // Partition items into safe chunks (~350 KB max per request) so reverse proxies (Nginx/Cloudflare/Vercel)
    // never reject bulk syncs of 30+ components with "413 Request Entity Too Large".
    const MAX_CHUNK_BYTES = 350_000;
    const chunks: Array<typeof items> = [];
    let currentChunk: typeof items = [];
    let currentChunkBytes = 0;

    for (const item of items) {
      const estimatedBytes = JSON.stringify(item).length;
      if (
        currentChunk.length > 0 &&
        currentChunkBytes + estimatedBytes > MAX_CHUNK_BYTES
      ) {
        chunks.push(currentChunk);
        currentChunk = [item];
        currentChunkBytes = estimatedBytes;
      } else {
        currentChunk.push(item);
        currentChunkBytes += estimatedBytes;
      }
    }
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }

    try {
      const allSavedRecords: Array<{
        id: string;
        slug: string;
        repoPath: string;
        lastRepoSyncAt: number;
      }> = [];
      let lastCommitSha: string | undefined;
      let lastCommitUrl: string | undefined;
      let latestTotalRepoComponents: number | undefined;
      let latestPushedComponentsCount: number | undefined;
      let fallbackPerChunkGithubPush = false;
      const authHeaders = buildAuthHeaders(state.ownerSessionToken);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const isFinalChunk = i === chunks.length - 1;
        const shouldPushThisChunk =
          Boolean(options.pushToGithub) &&
          (isFinalChunk || fallbackPerChunkGithubPush);
        const pushScope =
          shouldPushThisChunk && !fallbackPerChunkGithubPush
            ? "all_registry"
            : "written";
        const chunkCommitMsg =
          !fallbackPerChunkGithubPush || chunks.length === 1
            ? options.commitMessage
            : `${
                options.commitMessage ||
                `feat(registry): sync ${items.length} workspace components`
              } (batch ${i + 1}/${chunks.length})`;

        let res = await fetch("/api/repo-sync", {
          method: "POST",
          credentials: "same-origin",
          headers: authHeaders,
          body: JSON.stringify({
            action: "sync_all",
            items: chunk,
            commitMessage: chunkCommitMsg,
            commitToGit: isFinalChunk,
            pushToGithub: shouldPushThisChunk,
            pushScope,
            githubConfig: state.githubRepoConfig,
          }),
        });

        let data = await parseSafeJson(res);

        // On read-only serverless filesystems, disk cannot accumulate earlier chunks across requests.
        // Fall back to per-chunk GitHub push only when the server explicitly reports a read-only FS.
        if (
          !res.ok &&
          data.readOnlyFs &&
          Boolean(options.pushToGithub) &&
          !shouldPushThisChunk
        ) {
          fallbackPerChunkGithubPush = true;
          const fallbackMsg =
            chunks.length === 1
              ? options.commitMessage
              : `${
                  options.commitMessage ||
                  `feat(registry): sync ${items.length} workspace components`
                } (batch ${i + 1}/${chunks.length})`;
          res = await fetch("/api/repo-sync", {
            method: "POST",
            credentials: "same-origin",
            headers: authHeaders,
            body: JSON.stringify({
              action: "sync_all",
              items: chunk,
              commitMessage: fallbackMsg,
              commitToGit: false,
              pushToGithub: true,
              pushScope: "written",
              githubConfig: state.githubRepoConfig,
            }),
          });
          data = await parseSafeJson(res);
        }

        // If this chunk still hit HTTP 413 (e.g. a single component had a huge >1MB base64 PNG),
        // retry the chunk with heavy base64 PNGs stripped so component code is guaranteed to sync.
        if (!res.ok && (res.status === 413 || data.isPayloadTooLarge)) {
          const slimChunk = chunk.map((entry) => ({
            ...entry,
            component: {
              ...entry.component,
              previewImage: entry.component.previewImage?.startsWith(
                "data:image/png;base64,"
              )
                ? undefined
                : entry.component.previewImage,
            },
            variants: [],
          }));

          const retryPush =
            Boolean(options.pushToGithub) &&
            (isFinalChunk || fallbackPerChunkGithubPush);
          res = await fetch("/api/repo-sync", {
            method: "POST",
            credentials: "same-origin",
            headers: authHeaders,
            body: JSON.stringify({
              action: "sync_all",
              items: slimChunk,
              commitMessage: chunkCommitMsg,
              commitToGit: isFinalChunk,
              pushToGithub: retryPush,
              pushScope:
                retryPush && !fallbackPerChunkGithubPush
                  ? "all_registry"
                  : "written",
              githubConfig: state.githubRepoConfig,
            }),
          });
          data = await parseSafeJson(res);
        }

        if (!res.ok || !data.success) {
          const errMsg =
            data.error ||
            `Failed to sync batch ${i + 1}/${chunks.length} to project repository.`;
          set({ repoSyncStatus: "error", lastRepoSyncError: errMsg });
          return { success: false, error: errMsg };
        }

        if (
          options.pushToGithub &&
          (isFinalChunk || fallbackPerChunkGithubPush) &&
          data.githubPush &&
          !data.githubPush.pushed
        ) {
          const ghErr =
            data.githubPush.error || "Saved locally, but GitHub push failed.";
          set({ repoSyncStatus: "error", lastRepoSyncError: ghErr });
          return { success: false, error: ghErr };
        }

        if (Array.isArray(data.savedRecords)) {
          allSavedRecords.push(...data.savedRecords);
        }
        if (data.commitSha) lastCommitSha = data.commitSha;
        if (data.commitUrl) lastCommitUrl = data.commitUrl;
        if (typeof data.totalRepoComponents === "number") {
          latestTotalRepoComponents = data.totalRepoComponents;
        }
        if (typeof data.pushedComponentsCount === "number") {
          latestPushedComponentsCount = data.pushedComponentsCount;
        }
      }

      const recordMap = new Map(allSavedRecords.map((r) => [r.id, r]));

      set((s) => {
        const nextUserComponents = { ...s.userComponents };
        for (const [id, comp] of Object.entries(nextUserComponents)) {
          const rec = recordMap.get(id);
          if (rec) {
            nextUserComponents[id] = {
              ...comp,
              repoSlug: rec.slug,
              savedInRepo: true,
              lastRepoSyncAt: rec.lastRepoSyncAt,
              lastCommitSha: lastCommitSha || comp.lastCommitSha,
              lastCommitUrl: lastCommitUrl || comp.lastCommitUrl,
            };
          }
        }
        return {
          userComponents: nextUserComponents,
          repoSyncStatus: "synced",
          lastRepoSyncError: null,
          repoGitInfo: s.repoGitInfo
            ? {
                ...s.repoGitInfo,
                lastCommitSha: lastCommitSha || s.repoGitInfo.lastCommitSha,
                totalComponents:
                  latestTotalRepoComponents ?? s.repoGitInfo.totalComponents,
              }
            : {
                lastCommitSha,
                totalComponents: latestTotalRepoComponents,
              },
        };
      });

      const reportedCount =
        latestPushedComponentsCount ?? (allSavedRecords.length || items.length);

      get().addTerminalLog({
        type: "system",
        message: `[Repo Sync] Synced ${reportedCount} components to registry/components/${
          lastCommitSha ? ` (commit ${lastCommitSha})` : ""
        }.`,
      });

      return {
        success: true,
        savedCount: reportedCount,
        commitSha: lastCommitSha,
        commitUrl: lastCommitUrl,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      set({ repoSyncStatus: "error", lastRepoSyncError: msg });
      return { success: false, error: msg };
    }
  },

  importWorkspaceBundle: (rawJson) => {
    try {
      const parsed = JSON.parse(rawJson) as {
        state?: {
          userComponents?: Record<string, UserComponent>;
          variantsByTemplate?: Record<string, ComponentVariant[]>;
          activeVariantByTemplate?: Record<string, string>;
        };
        userComponents?: Record<string, UserComponent>;
        variantsByTemplate?: Record<string, ComponentVariant[]>;
        activeVariantByTemplate?: Record<string, string>;
      };

      const incomingComponents =
        parsed?.state?.userComponents || parsed?.userComponents;
      const incomingVariants =
        parsed?.state?.variantsByTemplate || parsed?.variantsByTemplate || {};
      const incomingActiveVariants =
        parsed?.state?.activeVariantByTemplate ||
        parsed?.activeVariantByTemplate ||
        {};

      if (
        !incomingComponents ||
        typeof incomingComponents !== "object" ||
        Object.keys(incomingComponents).length === 0
      ) {
        return {
          success: false,
          importedCount: 0,
          error:
            "No valid userComponents found in JSON. Provide a Component Studio backup .json or localStorage '21st-component-studio-storage-v3' dump.",
        };
      }

      let importedCount = 0;
      set((state) => {
        const nextUserComponents = { ...(state.userComponents || {}) };
        const nextVariants = { ...(state.variantsByTemplate || {}) };
        const nextActiveVariants = {
          ...(state.activeVariantByTemplate || {}),
        };

        for (const [id, comp] of Object.entries(incomingComponents)) {
          if (!comp || !comp.files || !comp.files["component.tsx"]) continue;
          const normalizedFiles: StudioFiles = {
            "component.tsx": comp.files["component.tsx"],
            "default.tsx":
              comp.files["default.tsx"] ?? comp.files["demo.tsx"] ?? "",
            "demo.tsx":
              comp.files["demo.tsx"] ?? comp.files["default.tsx"] ?? "",
            "index.css":
              comp.files["index.css"] ||
              "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n",
          };
          nextUserComponents[id] = {
            ...comp,
            id: comp.id || id,
            files: normalizedFiles,
            dependencies: Array.isArray(comp.dependencies)
              ? comp.dependencies
              : [],
            savedInRepo: false,
          };
          if (Array.isArray(incomingVariants[id])) {
            nextVariants[id] = incomingVariants[id];
          }
          if (incomingActiveVariants[id]) {
            nextActiveVariants[id] = incomingActiveVariants[id];
          }
          importedCount++;
        }

        if (importedCount === 0) {
          return state;
        }

        return {
          userComponents: nextUserComponents,
          variantsByTemplate: nextVariants,
          activeVariantByTemplate: nextActiveVariants,
          repoSyncStatus: "dirty",
          lastRepoSyncError: null,
        };
      });

      if (importedCount === 0) {
        return {
          success: false,
          importedCount: 0,
          error:
            "No components with valid source code (component.tsx) were found in this backup file.",
        };
      }

      return {
        success: true,
        importedCount,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        importedCount: 0,
        error: `Invalid JSON bundle: ${msg}`,
      };
    }
  },
});
