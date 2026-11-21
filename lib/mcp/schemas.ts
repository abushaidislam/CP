import { z } from "zod";

function normalizeDependencies(val: unknown): string[] {
  if (Array.isArray(val)) {
    return val.map((s) => String(s).trim()).filter(Boolean);
  }
  if (typeof val === "string") {
    return val
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export const createComponentSchema = z.object({
  name: z.string().min(1, "Component name is required").describe("Human-readable component display name"),
  slug: z.string().optional().describe("URL-safe kebab-case slug. If omitted, generated automatically from name"),
  category: z.string().default("Custom").describe("Component category (e.g. Buttons, Cards, Navigation, Hero, Effects)"),
  description: z.string().default("").describe("Short description of what the component does and its design style"),
  componentCode: z.string().min(1, "component.tsx code is required").describe("The full React TSX source code for component.tsx"),
  defaultCode: z.string().optional().default("").describe("The full React TSX code for default.tsx demonstrating and rendering the component. If omitted, generated automatically"),
  dependencies: z.preprocess(normalizeDependencies, z.array(z.string()).default([])).describe("Required npm packages, e.g. ['framer-motion', 'lucide-react']"),
  css: z.string().optional().describe("Optional custom CSS rules for index.css"),
});

export type CreateComponentInput = z.input<typeof createComponentSchema>;
export type CreateComponentOutput = z.infer<typeof createComponentSchema>;

export const updateComponentSchema = z.object({
  slug: z.string().min(1, "Component slug is required").describe("The slug of the component to update"),
  name: z.string().optional().describe("New display name"),
  description: z.string().optional().describe("Updated description"),
  category: z.string().optional().describe("Updated category"),
  componentCode: z.string().optional().describe("Updated component.tsx code"),
  defaultCode: z.string().optional().describe("Updated default.tsx code"),
  css: z.string().optional().describe("Updated index.css code"),
  dependencies: z.preprocess(normalizeDependencies, z.array(z.string()).optional()).describe("Updated dependencies list"),
  changeMessage: z.string().optional().describe("Description of what was changed in this version (e.g. 'Added spring animation')"),
  baseVersion: z.string().optional().describe("Optional past version identifier (e.g. 'v1' or 'v2') to base this update on"),
  createCheckpoint: z.boolean().default(true).describe("Whether to snapshot current state into version history before applying new changes"),
});

export type UpdateComponentInput = z.input<typeof updateComponentSchema>;
export type UpdateComponentOutput = z.infer<typeof updateComponentSchema>;

export const manageVersionsSchema = z.object({
  slug: z.string().min(1, "Component slug is required").describe("The slug of the component"),
  action: z.enum(["list", "restore", "delete"]).describe("Version action to perform: 'list', 'restore', or 'delete'"),
  targetVersion: z.string().optional().describe("Version identifier to restore (e.g. 'v2' or 'v1') - required when action is 'restore'"),
  versionIds: z.array(z.string()).optional().describe("Array of version identifiers to delete (e.g. ['v1', 'v2']) - required when action is 'delete'"),
});

export type ManageVersionsInput = z.input<typeof manageVersionsSchema>;
export type ManageVersionsOutput = z.infer<typeof manageVersionsSchema>;

export const getComponentSchema = z.object({
  slug: z.string().min(1, "Component slug or ID is required").describe("Slug or ID of the component to fetch"),
});

export type GetComponentInput = z.input<typeof getComponentSchema>;
export type GetComponentOutput = z.infer<typeof getComponentSchema>;

export const listComponentsSchema = z.object({
  category: z.string().optional().describe("Filter components by category"),
  search: z.string().optional().describe("Search query matching name, slug, or description"),
  limit: z.number().int().positive().default(50).optional().describe("Maximum number of components to return"),
});

export type ListComponentsInput = z.input<typeof listComponentsSchema>;
export type ListComponentsOutput = z.infer<typeof listComponentsSchema>;

export const deleteComponentSchema = z.object({
  slug: z.string().min(1, "Component slug is required").describe("Slug of the component to delete"),
  confirm: z.boolean().default(true).describe("Explicit confirmation flag to prevent accidental deletion"),
});

export type DeleteComponentInput = z.input<typeof deleteComponentSchema>;
export type DeleteComponentOutput = z.infer<typeof deleteComponentSchema>;

export const validateComponentSchema = z.object({
  componentCode: z.string().min(1, "component.tsx code is required").describe("React TSX source code for component.tsx to validate"),
  defaultCode: z.string().optional().default("").describe("Optional default.tsx demo code to validate"),
  css: z.string().optional().default("").describe("Optional index.css rules to validate"),
  dependencies: z.preprocess(normalizeDependencies, z.array(z.string()).default([])).describe("Declared npm dependencies"),
});

export type ValidateComponentInput = z.input<typeof validateComponentSchema>;
export type ValidateComponentOutput = z.infer<typeof validateComponentSchema>;

export const patchOperationSchema = z.object({
  file: z
    .enum(["component.tsx", "default.tsx", "index.css"])
    .default("component.tsx")
    .describe("Target file to patch (default: 'component.tsx')"),
  search: z.string().min(1, "Search block is required").describe("Exact substring to find in the target file"),
  replace: z.string().describe("Replacement string to substitute in place of the search block"),
});

export const patchComponentSchema = z.object({
  slug: z.string().min(1, "Component slug is required").describe("The slug of the component to patch"),
  patches: z
    .array(patchOperationSchema)
    .min(1, "At least one patch operation is required")
    .describe("Ordered list of search/replace patch blocks to apply"),
  changeMessage: z
    .string()
    .optional()
    .describe("Description of what was changed in this patched version"),
  baseVersion: z
    .string()
    .optional()
    .describe("Optional past version identifier (e.g. 'v1') to base this patch on"),
});

export type PatchComponentInput = z.input<typeof patchComponentSchema>;
export type PatchComponentOutput = z.infer<typeof patchComponentSchema>;

export const diffVersionsSchema = z.object({
  slug: z.string().min(1, "Component slug is required").describe("The slug of the component"),
  fromVersion: z
    .string()
    .optional()
    .describe("Base version ID to compare from (e.g. 'v1'). Defaults to previous version"),
  toVersion: z
    .string()
    .optional()
    .describe("Target version ID to compare to (e.g. 'v2'). Defaults to current active version"),
  file: z
    .enum(["component.tsx", "default.tsx", "index.css", "all"])
    .default("all")
    .optional()
    .describe("Which file to diff ('component.tsx', 'default.tsx', 'index.css', or 'all')"),
});

export type DiffVersionsInput = z.input<typeof diffVersionsSchema>;
export type DiffVersionsOutput = z.infer<typeof diffVersionsSchema>;

