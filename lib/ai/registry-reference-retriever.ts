import fs from "fs/promises";
import path from "path";
import {
  readRegistrySummaries,
  resolveSafeComponentDir,
  type RepoSummaryComponent,
} from "@/lib/registry/server-registry";
import type { IntentClassification, RegistryReferenceSummary } from "./types";

export interface LoadedRegistryReference extends RegistryReferenceSummary {
  imageInlineData?: {
    mimeType: string;
    data: string;
  };
  codeExcerpt?: string;
  cssExcerpt?: string;
}

const MAX_IMAGE_BYTES = 1_600_000; // 1.6 MB cap per reference PNG to stay fast & well under API limits
const MAX_CODE_EXCERPT_CHARS = 3_400;
const MAX_CSS_EXCERPT_CHARS = 900;

/**
 * Computes deterministic, multi-signal relevance score between a registered component
 * and the current user request + workspace context.
 */
function scoreRegistryCandidate(
  candidate: RepoSummaryComponent,
  intent: IntentClassification,
  currentDependencies: string[],
  promptLower: string
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  const slugLower = candidate.repoSlug.toLowerCase();
  const nameLower = candidate.name.toLowerCase();
  const descLower = (candidate.description || "").toLowerCase();
  const catLower = (candidate.category || "").toLowerCase();
  const searchable = `${slugLower} ${nameLower} ${descLower} ${catLower}`;

  // 1. Direct name / slug mention in prompt (strongest signal)
  if (
    promptLower.includes(slugLower) ||
    (nameLower.length >= 4 && promptLower.includes(nameLower))
  ) {
    score += 65;
    reasons.push("Direct component match");
  }

  // 2. Category match
  const matchedCat = intent.targetCategories.find(
    (c) => c.toLowerCase() === catLower
  );
  if (matchedCat) {
    score += 24;
    reasons.push(`${candidate.category} category`);
  }

  // 3. Keyword overlap across name, slug, and description
  let keywordHits = 0;
  const matchedKeywords: string[] = [];
  for (const kw of intent.keywords) {
    if (kw.length < 3) continue;
    if (slugLower.includes(kw) || nameLower.includes(kw)) {
      score += 18;
      keywordHits++;
      matchedKeywords.push(kw);
    } else if (descLower.includes(kw)) {
      score += 10;
      keywordHits++;
      matchedKeywords.push(kw);
    }
  }
  if (matchedKeywords.length > 0) {
    reasons.push(`Matches: ${matchedKeywords.slice(0, 3).join(", ")}`);
  }

  // 4. Visual / interaction craftsmanship match
  if (intent.primaryIntent === "motion_polish") {
    if (
      candidate.dependencies.includes("framer-motion") ||
      /spring|kinetic|morph|motion|animated|flip|shuffle/i.test(searchable)
    ) {
      score += 16;
      reasons.push("Rich motion choreography");
    }
  }

  // 5. Dependency alignment (e.g., both use framer-motion or lucide-react)
  const sharedDeps = candidate.dependencies.filter((d) =>
    currentDependencies.includes(d)
  );
  if (sharedDeps.length > 0) {
    score += Math.min(10, sharedDeps.length * 4);
  }

  // 6. Visual preview availability bonus (essential for visual image grounding)
  if (candidate.previewImage) {
    score += 14;
    reasons.push("Has preview.png visual");
  }

  // 7. Gentle deterministic rotation tie-breaker so occasional design inspiration stays varied
  if (keywordHits === 0 && !matchedCat && candidate.previewImage) {
    const promptHash = Array.from(promptLower).reduce(
      (acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 997,
      7
    );
    const slugHash = Array.from(slugLower).reduce(
      (acc, ch) => (acc * 17 + ch.charCodeAt(0)) % 997,
      13
    );
    const affinity = ((promptHash ^ slugHash) % 11) + 1;
    score += affinity;
  }

  return { score, reasons: Array.from(new Set(reasons)).slice(0, 3) };
}

/**
 * Distills a component's source code into high-signal structural/styling excerpts
 * (imports, props interface, visual class tokens, Framer Motion physics) without flooding tokens.
 */
function distillCodeExcerpt(rawCode: string, maxChars: number): string {
  const trimmed = rawCode.trim();
  if (trimmed.length <= maxChars) return trimmed;

  const headLen = Math.floor(maxChars * 0.65);
  const tailLen = maxChars - headLen - 48;
  return `${trimmed.slice(0, headLen)}\n\n// ... [trimmed for compact reference context] ...\n\n${trimmed.slice(trimmed.length - tailLen)}`;
}

async function loadReferenceAssetsFromDisk(
  candidate: RepoSummaryComponent,
  score: number,
  matchReasons: string[],
  pinnedByUser: boolean,
  cwd: string
): Promise<LoadedRegistryReference> {
  let imageInlineData: { mimeType: string; data: string } | undefined;
  let codeExcerpt: string | undefined;
  let cssExcerpt: string | undefined;

  try {
    const compDir = resolveSafeComponentDir(cwd, candidate.repoSlug);
    const previewPath = path.join(compDir, "preview.png");
    const compPath = path.join(compDir, "component.tsx");
    const cssPath = path.join(compDir, "index.css");

    // Read preview.png safely with size cap
    try {
      const stat = await fs.stat(previewPath);
      if (stat.isFile() && stat.size > 0 && stat.size <= MAX_IMAGE_BYTES) {
        const buf = await fs.readFile(previewPath);
        // Verify PNG or JPEG/WebP magic header
        const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
        const isJpeg = buf[0] === 0xff && buf[1] === 0xd8;
        const isWebp =
          buf.length >= 12 &&
          buf.subarray(0, 4).toString("ascii") === "RIFF" &&
          buf.subarray(8, 12).toString("ascii") === "WEBP";
        if (isPng || isJpeg || isWebp) {
          imageInlineData = {
            mimeType: isJpeg ? "image/jpeg" : isWebp ? "image/webp" : "image/png",
            data: buf.toString("base64"),
          };
        }
      }
    } catch {
      // No preview.png on disk
    }

    // Read component.tsx excerpt
    try {
      const rawTsx = await fs.readFile(compPath, "utf-8");
      if (rawTsx.trim().length > 0) {
        codeExcerpt = distillCodeExcerpt(rawTsx, MAX_CODE_EXCERPT_CHARS);
      }
    } catch {
      // ignore
    }

    // Read custom index.css if it contains more than boilerplate @tailwind directives
    try {
      const rawCss = await fs.readFile(cssPath, "utf-8");
      const stripped = rawCss
        .replace(/@tailwind\s+\w+\s*;/g, "")
        .replace(/@import\s+["']tailwindcss["']\s*;/g, "")
        .trim();
      if (stripped.length > 20) {
        cssExcerpt = rawCss.trim().slice(0, MAX_CSS_EXCERPT_CHARS);
      }
    } catch {
      // ignore
    }
  } catch {
    // Safe path guard rejected slug — skip disk assets
  }

  return {
    id: candidate.id,
    slug: candidate.repoSlug,
    name: candidate.name,
    category: candidate.category,
    description: candidate.description,
    score,
    matchReasons,
    previewUrl: candidate.previewImage,
    hasPreviewImage: Boolean(imageInlineData),
    hasCodeSample: Boolean(codeExcerpt),
    dependencies: candidate.dependencies,
    pinnedByUser,
    imageInlineData,
    codeExcerpt,
    cssExcerpt,
  };
}

export interface RetrieveRegistryReferencesInput {
  prompt: string;
  intent: IntentClassification;
  currentDependencies: string[];
  pinnedReferenceSlugs?: string[];
  excludeComponentId?: string;
  excludeComponentSlug?: string;
  maxReferences?: number;
  cwd?: string;
}

/**
 * Retrieves up to `maxReferences` (default 2) visually-grounded registry components
 * including their actual `preview.png` images and distilled styling/code excerpts.
 */
export async function retrieveRegistryReferences(
  input: RetrieveRegistryReferencesInput
): Promise<{
  references: LoadedRegistryReference[];
  totalRegistryCount: number;
}> {
  const cwd = input.cwd || process.cwd();
  const maxRefs = Math.min(3, Math.max(1, input.maxReferences ?? 2));
  const { summaries } = await readRegistrySummaries(cwd);
  const totalRegistryCount = summaries.length;

  if (!input.intent.shouldUseRegistryReferences || summaries.length === 0) {
    return { references: [], totalRegistryCount };
  }

  const excludeIdLower = (input.excludeComponentId || "").toLowerCase();
  const excludeSlugLower = (input.excludeComponentSlug || "").toLowerCase();
  const pinnedSet = new Set(
    (input.pinnedReferenceSlugs || [])
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );

  // Filter out the currently open component unless explicitly pinned by user
  const eligible = summaries.filter((s) => {
    const sSlug = s.repoSlug.toLowerCase();
    const sId = s.id.toLowerCase();
    if (pinnedSet.has(sSlug) || pinnedSet.has(sId)) return true;
    if (excludeIdLower && sId === excludeIdLower) return false;
    if (excludeSlugLower && sSlug === excludeSlugLower) return false;
    return true;
  });

  const promptLower = (input.prompt || "").toLowerCase();
  const selectedCandidates: Array<{
    candidate: RepoSummaryComponent;
    score: number;
    reasons: string[];
    pinnedByUser: boolean;
  }> = [];

  // 1. Honor explicitly pinned references first
  if (pinnedSet.size > 0) {
    for (const s of eligible) {
      if (pinnedSet.has(s.repoSlug.toLowerCase()) || pinnedSet.has(s.id.toLowerCase())) {
        selectedCandidates.push({
          candidate: s,
          score: 100,
          reasons: ["Pinned by developer", s.previewImage ? "Visual preview attached" : "Code pattern attached"],
          pinnedByUser: true,
        });
      }
    }
  }

  // 2. Fill remaining slots with highest-scoring relevant registry components (preferring ones with preview.png)
  if (selectedCandidates.length < maxRefs && pinnedSet.size === 0) {
    const scored = eligible
      .map((candidate) => {
        const { score, reasons } = scoreRegistryCandidate(
          candidate,
          input.intent,
          input.currentDependencies,
          promptLower
        );
        return { candidate, score, reasons, pinnedByUser: false };
      })
      .filter((item) => item.candidate.previewImage || item.score >= 25)
      .sort((a, b) => b.score - a.score);

    // Ensure visual diversity: avoid picking two near-identical components if possible
    for (const item of scored) {
      if (selectedCandidates.length >= maxRefs) break;
      if (selectedCandidates.some((s) => s.candidate.repoSlug === item.candidate.repoSlug)) {
        continue;
      }
      selectedCandidates.push(item);
    }
  }

  const finalSlice = selectedCandidates.slice(0, maxRefs);
  const loaded = await Promise.all(
    finalSlice.map((item) =>
      loadReferenceAssetsFromDisk(
        item.candidate,
        item.score,
        item.reasons,
        item.pinnedByUser,
        cwd
      )
    )
  );

  return {
    references: loaded,
    totalRegistryCount,
  };
}

/**
 * Lists lightweight registry components for the UI Reference Picker modal.
 */
export async function listSelectableRegistryReferences(
  query?: string,
  category?: string,
  cwd: string = process.cwd()
): Promise<RegistryReferenceSummary[]> {
  const { summaries } = await readRegistrySummaries(cwd);
  const q = (query || "").trim().toLowerCase();
  const cat = (category || "").trim().toLowerCase();

  return summaries
    .filter((s) => {
      if (cat && cat !== "all" && (s.category || "").toLowerCase() !== cat) {
        return false;
      }
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.repoSlug.toLowerCase().includes(q) ||
        (s.description || "").toLowerCase().includes(q) ||
        (s.category || "").toLowerCase().includes(q)
      );
    })
    .slice(0, 60)
    .map((s) => ({
      id: s.id,
      slug: s.repoSlug,
      name: s.name,
      category: s.category,
      description: s.description,
      score: 100,
      matchReasons: s.previewImage ? ["Preview image ready"] : ["Code pattern ready"],
      previewUrl: s.previewImage,
      hasPreviewImage: Boolean(s.previewImage),
      hasCodeSample: true,
      dependencies: s.dependencies,
    }));
}
