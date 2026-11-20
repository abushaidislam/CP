import ts from "typescript";
import { parseComponentAST } from "./ast-parser";

export const MAX_DEMO_CONTROLS = 24;
export const SHORT_STRING_MAX_LENGTH = 120;
export const MAX_COLOR_ARRAY_ITEMS = 12;

export const RESERVED_SETTING_KEYS = new Set([
  "key",
  "ref",
  "constructor",
  "prototype",
  "__proto__",
  "toString",
  "valueOf",
]);

export type DemoControlType =
  | "boolean"
  | "number"
  | "color"
  | "color-array"
  | "select"
  | "string"
  | "textarea"
  | "string-array";

export type DemoControlValue =
  | boolean
  | number
  | string
  | string[]
  | null;

export interface DemoControlDefinition {
  key: string;
  label: string;
  type: DemoControlType;
  defaultValue: DemoControlValue;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  description?: string;
}

export interface SkippedDemoControl {
  key: string;
  reason: string;
}

export type DemoControlsContractStatus =
  | "active"
  | "missing-props"
  | "no-settings"
  | "empty";

export interface ParsedDemoControls {
  status: DemoControlsContractStatus;
  hasSettingsObject: boolean;
  acceptsProps: boolean;
  controls: DemoControlDefinition[];
  defaultValues: Record<string, DemoControlValue>;
  skippedKeys: SkippedDemoControl[];
  truncatedCount: number;
  settingsSpan?: {
    start: number;
    end: number;
  };
}

/**
 * Checks whether a string is a valid CSS color literal (hex, rgb/rgba, hsl/hsla, oklch/oklab).
 * Matches 21st.dev's native color control inference.
 */
export function isCssColorString(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed)) {
    return true;
  }
  if (/^rgba?\(\s*[\d.%\s,/]+\)$/i.test(trimmed)) {
    return true;
  }
  if (/^hsla?\(\s*[\d.degturnrad%\s,/]+\)$/i.test(trimmed)) {
    return true;
  }
  if (/^okl(?:ch|ab)\(\s*[\d.%\s,/a-zA-Z-]+\)$/i.test(trimmed)) {
    return true;
  }
  return false;
}

/**
 * Converts a camelCase or snake_case key into a clean human-readable label.
 */
export function formatControlLabel(key: string): string {
  const spaced = key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .trim();

  if (!spaced) return key;

  const acronyms = new Set(["cta", "ui", "url", "id", "fps", "ms", "rgb", "hsl", "hud", "3d", "2d", "svg", "css", "api", "ai", "sla"]);
  return spaced
    .split(/\s+/)
    .map((word) => {
      const lower = word.toLowerCase();
      if (acronyms.has(lower)) return lower.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

/**
 * Infers ergonomic min, max, and step bounds for a numeric setting value based on magnitude,
 * mirroring 21st.dev's automatic slider inference.
 */
export function inferNumberRange(
  value: number,
  hintComment?: string
): { min: number; max: number; step: number } {
  // Support optional inline range hints like: // 0..100 step 5  or  /* min: 0, max: 2, step: 0.1 */
  if (hintComment) {
    const rangeMatch = hintComment.match(
      /(-?\d+(?:\.\d+)?)\s*(?:\.\.|-|to)\s*(-?\d+(?:\.\d+)?)(?:.*?\bstep\s*[:=]?\s*(\d+(?:\.\d+)?))?/i
    );
    if (rangeMatch) {
      const parsedMin = Number(rangeMatch[1]);
      const parsedMax = Number(rangeMatch[2]);
      if (Number.isFinite(parsedMin) && Number.isFinite(parsedMax) && parsedMax > parsedMin) {
        const parsedStep = rangeMatch[3]
          ? Number(rangeMatch[3])
          : Number.isInteger(parsedMin) && Number.isInteger(parsedMax) && Number.isInteger(value)
          ? 1
          : Number(((parsedMax - parsedMin) / 100).toPrecision(2));
        return {
          min: Math.min(parsedMin, value),
          max: Math.max(parsedMax, value),
          step: parsedStep > 0 ? parsedStep : 1,
        };
      }
    }
  }

  if (!Number.isFinite(value)) {
    return { min: 0, max: 100, step: 1 };
  }

  const isInt = Number.isInteger(value);

  if (value === 0) {
    return { min: 0, max: 100, step: 1 };
  }

  // Normalized decimal ratios (e.g. speed: 0.4, opacity: 0.85, density: 0.5)
  if (value > 0 && value <= 1 && !isInt) {
    const step = value < 0.1 ? 0.01 : 0.05;
    return { min: 0, max: 1, step };
  }

  // Small floats (e.g. 1.5, 2.5)
  if (value > 0 && value <= 10 && !isInt) {
    return { min: 0, max: Math.ceil(value * 3), step: 0.1 };
  }

  // Small positive integers (e.g. seed: 7, columns: 3, blur: 8)
  if (value > 0 && value <= 20 && isInt) {
    return { min: 0, max: Math.max(20, Math.ceil((value * 3) / 5) * 5), step: 1 };
  }

  // Percentage-like values (21..100)
  if (value > 20 && value <= 100) {
    return { min: 0, max: Math.max(100, Math.ceil((value * 2) / 10) * 10), step: isInt ? 1 : 0.1 };
  }

  // Larger positive numbers (e.g. particleCount: 1200, seed: 4211)
  if (value > 100) {
    const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
    const max = Math.ceil((value * 2.5) / magnitude) * magnitude;
    const step = isInt ? Math.max(1, Math.round(magnitude / 100)) : 0.5;
    return { min: 0, max, step };
  }

  // Negative numbers
  const abs = Math.abs(value);
  const bound = abs <= 1 ? 1 : Math.ceil(abs * 2);
  const step = isInt ? 1 : abs <= 1 ? 0.05 : 0.1;
  return { min: -bound, max: bound, step };
}

/**
 * Extracts string literal union options from a TypeScript type node (e.g. "light" | "dark" | "auto").
 */
function extractStringUnionFromTypeNode(typeNode: ts.TypeNode | undefined): string[] | undefined {
  if (!typeNode) return undefined;
  if (ts.isParenthesizedTypeNode(typeNode)) {
    return extractStringUnionFromTypeNode(typeNode.type);
  }
  if (ts.isUnionTypeNode(typeNode)) {
    const options: string[] = [];
    for (const member of typeNode.types) {
      if (ts.isLiteralTypeNode(member) && ts.isStringLiteral(member.literal)) {
        options.push(member.literal.text);
      } else if (
        member.kind === ts.SyntaxKind.UndefinedKeyword ||
        (ts.isLiteralTypeNode(member) && member.literal.kind === ts.SyntaxKind.NullKeyword)
      ) {
        continue;
      } else {
        return undefined;
      }
    }
    return options.length >= 2 ? options : undefined;
  }
  return undefined;
}

/**
 * Parses a string union expression from a raw type string (from parseComponentAST props).
 */
function extractStringUnionFromTypeString(typeStr: string): string[] | undefined {
  const parts = typeStr
    .split("|")
    .map((p) => p.trim())
    .filter((p) => p && p !== "undefined" && p !== "null");
  if (parts.length < 2) return undefined;

  const options: string[] = [];
  for (const part of parts) {
    const match = part.match(/^["']([^"']+)["']$/);
    if (!match) return undefined;
    options.push(match[1]);
  }
  return options.length >= 2 ? options : undefined;
}

/**
 * Unwraps `as ...`, `satisfies ...`, and parenthesized expressions while preserving any union type hint.
 */
function unwrapExpression(expr: ts.Expression): {
  node: ts.Expression;
  unionOptions?: string[];
} {
  let current = expr;
  let unionOptions: string[] | undefined;

  while (true) {
    if (ts.isParenthesizedExpression(current)) {
      current = current.expression;
    } else if (ts.isAsExpression(current)) {
      const inferred = extractStringUnionFromTypeNode(current.type);
      if (inferred) unionOptions = inferred;
      current = current.expression;
    } else if (ts.isSatisfiesExpression(current)) {
      const inferred = extractStringUnionFromTypeNode(current.type);
      if (inferred) unionOptions = inferred;
      current = current.expression;
    } else {
      break;
    }
  }

  return { node: current, unionOptions };
}

/**
 * Evaluates a strictly JSON-compatible static AST expression.
 * Returns { ok: false, reason } for exotic expressions (calls, identifiers, template expressions, spreads).
 */
function evaluateStaticLiteral(expr: ts.Expression): {
  ok: boolean;
  value?: DemoControlValue;
  unionOptions?: string[];
  reason?: string;
} {
  const { node, unionOptions } = unwrapExpression(expr);

  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return { ok: true, value: node.text, unionOptions };
  }

  if (ts.isNumericLiteral(node)) {
    return { ok: true, value: Number(node.text), unionOptions };
  }

  if (
    ts.isPrefixUnaryExpression(node) &&
    (node.operator === ts.SyntaxKind.MinusToken || node.operator === ts.SyntaxKind.PlusToken) &&
    ts.isNumericLiteral(node.operand)
  ) {
    const num = Number(node.operand.text);
    return {
      ok: true,
      value: node.operator === ts.SyntaxKind.MinusToken ? -num : num,
      unionOptions,
    };
  }

  if (node.kind === ts.SyntaxKind.TrueKeyword) {
    return { ok: true, value: true, unionOptions };
  }

  if (node.kind === ts.SyntaxKind.FalseKeyword) {
    return { ok: true, value: false, unionOptions };
  }

  if (node.kind === ts.SyntaxKind.NullKeyword) {
    return { ok: true, value: null, unionOptions };
  }

  if (ts.isArrayLiteralExpression(node)) {
    const items: string[] = [];
    for (const el of node.elements) {
      if (ts.isSpreadElement(el)) {
        return { ok: false, reason: "Spread elements inside arrays are not supported" };
      }
      const unwrappedEl = unwrapExpression(el).node;
      if (ts.isStringLiteral(unwrappedEl) || ts.isNoSubstitutionTemplateLiteral(unwrappedEl)) {
        items.push(unwrappedEl.text);
      } else {
        return { ok: false, reason: "Only static string or color arrays are supported as controls" };
      }
    }
    return { ok: true, value: items, unionOptions };
  }

  if (ts.isObjectLiteralExpression(node)) {
    return { ok: false, reason: "Nested objects are not individually addressable (use flat top-level keys)" };
  }

  if (ts.isTemplateExpression(node)) {
    return { ok: false, reason: "Dynamic template strings are skipped per 21st.dev contract" };
  }

  if (ts.isCallExpression(node)) {
    return { ok: false, reason: "Function call expressions are skipped per 21st.dev contract" };
  }

  if (ts.isIdentifier(node)) {
    return { ok: false, reason: "External identifiers must be static literals per 21st.dev contract" };
  }

  return { ok: false, reason: "Non-literal expression skipped" };
}

/**
 * Extracts leading or trailing comments on a settings property for range hints & descriptions.
 */
function getPropertyComment(node: ts.Node, sourceText: string): string | undefined {
  const leading = ts.getLeadingCommentRanges(sourceText, node.getFullStart()) || [];
  let trailingPos = node.getEnd();
  // Advance past optional comma immediately after property value (e.g. `speed: 0.4, // 0..2 step 0.1`)
  let scan = trailingPos;
  while (scan < sourceText.length && (sourceText[scan] === " " || sourceText[scan] === "\t")) {
    scan++;
  }
  if (sourceText[scan] === ",") {
    trailingPos = scan + 1;
  }
  const trailing = ts.getTrailingCommentRanges(sourceText, trailingPos) || [];
  const parts: string[] = [];

  for (const range of [...leading, ...trailing]) {
    const raw = sourceText.slice(range.pos, range.end);
    const cleaned = raw
      .replace(/^\/\*\*?|\*\/$/g, "")
      .replace(/^\/\//, "")
      .split("\n")
      .map((line) => line.replace(/^\s*\*\s?/, "").trim())
      .filter(Boolean)
      .join(" ");
    if (cleaned) parts.push(cleaned);
  }

  return parts.length > 0 ? parts.join(" ") : undefined;
}

/**
 * Checks whether the demo's default export accepts props (at least 1 parameter).
 */
function detectDefaultExportAcceptsProps(sourceFile: ts.SourceFile): boolean {
  const fnDeclarations = new Map<string, boolean>();
  let foundDefaultExport = false;
  let acceptsProps = false;

  for (const stmt of sourceFile.statements) {
    if (ts.isFunctionDeclaration(stmt) && stmt.name) {
      const hasParams = stmt.parameters.length > 0;
      fnDeclarations.set(stmt.name.text, hasParams);
      const isExport = stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
      const isDefault = stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword);
      if (isExport && isDefault) {
        foundDefaultExport = true;
        acceptsProps = hasParams;
      }
    } else if (ts.isFunctionDeclaration(stmt)) {
      const isExport = stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
      const isDefault = stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword);
      if (isExport && isDefault) {
        foundDefaultExport = true;
        acceptsProps = stmt.parameters.length > 0;
      }
    } else if (ts.isVariableStatement(stmt)) {
      for (const decl of stmt.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && decl.initializer) {
          const init = unwrapExpression(decl.initializer).node;
          if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) {
            fnDeclarations.set(decl.name.text, init.parameters.length > 0);
          }
        }
      }
    } else if (ts.isExportAssignment(stmt) && !stmt.isExportEquals) {
      foundDefaultExport = true;
      const expr = unwrapExpression(stmt.expression).node;
      if (ts.isArrowFunction(expr) || ts.isFunctionExpression(expr)) {
        acceptsProps = expr.parameters.length > 0;
      } else if (ts.isIdentifier(expr)) {
        acceptsProps = fnDeclarations.get(expr.text) ?? false;
      }
    }
  }

  return foundDefaultExport && acceptsProps;
}

/**
 * Finds the module-level `const settings = { ... }` object literal in the AST.
 */
function findSettingsObjectLiteral(
  sourceFile: ts.SourceFile
): ts.ObjectLiteralExpression | null {
  for (const stmt of sourceFile.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (ts.isIdentifier(decl.name) && decl.name.text === "settings" && decl.initializer) {
        const unwrapped = unwrapExpression(decl.initializer).node;
        if (ts.isObjectLiteralExpression(unwrapped)) {
          return unwrapped;
        }
      }
    }
  }
  return null;
}

/**
 * Parses `default.tsx` (and optionally `component.tsx` for union type inference) according to
 * the exact 21st.dev Native Demo Controls (`const settings` + `Demo(props)`) contract.
 */
export function parseDemoControls(
  demoCode: string,
  componentCode?: string
): ParsedDemoControls {
  if (!demoCode || !demoCode.trim()) {
    return {
      status: "no-settings",
      hasSettingsObject: false,
      acceptsProps: false,
      controls: [],
      defaultValues: {},
      skippedKeys: [],
      truncatedCount: 0,
    };
  }

  const sourceFile = ts.createSourceFile(
    "default.tsx",
    demoCode,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

  const settingsObj = findSettingsObjectLiteral(sourceFile);
  const acceptsProps = detectDefaultExportAcceptsProps(sourceFile);

  if (!settingsObj) {
    return {
      status: "no-settings",
      hasSettingsObject: false,
      acceptsProps,
      controls: [],
      defaultValues: {},
      skippedKeys: [],
      truncatedCount: 0,
    };
  }

  // Optional union inference from component.tsx Props interface (e.g. status?: "healthy" | "degraded")
  const componentUnionMap = new Map<string, string[]>();
  const componentDescMap = new Map<string, string>();
  if (componentCode && componentCode.trim()) {
    try {
      const compAst = parseComponentAST(componentCode);
      for (const prop of compAst.props) {
        const union = extractStringUnionFromTypeString(prop.type);
        if (union) {
          componentUnionMap.set(prop.name, union);
        }
        if (prop.description) {
          componentDescMap.set(prop.name, prop.description);
        }
      }
    } catch {
      // Ignore component parse issues
    }
  }

  const controls: DemoControlDefinition[] = [];
  const defaultValues: Record<string, DemoControlValue> = {};
  const skippedKeys: SkippedDemoControl[] = [];
  let truncatedCount = 0;

  for (const prop of settingsObj.properties) {
    if (ts.isSpreadAssignment(prop)) {
      skippedKeys.push({
        key: "...spread",
        reason: "Spread properties inside settings are skipped per 21st.dev contract",
      });
      continue;
    }

    if (!ts.isPropertyAssignment(prop)) {
      skippedKeys.push({
        key: prop.getText(sourceFile).slice(0, 24),
        reason: "Only static key: value literal assignments are supported",
      });
      continue;
    }

    // Plain identifier keys only (or simple identifier-like string literal)
    let keyName: string | null = null;
    if (ts.isIdentifier(prop.name)) {
      keyName = prop.name.text;
    } else if (ts.isStringLiteral(prop.name) && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(prop.name.text)) {
      keyName = prop.name.text;
    }

    if (!keyName) {
      skippedKeys.push({
        key: prop.name.getText(sourceFile),
        reason: "Keys must be plain identifiers",
      });
      continue;
    }

    if (RESERVED_SETTING_KEYS.has(keyName)) {
      skippedKeys.push({
        key: keyName,
        reason: `Reserved key "${keyName}" is ignored by 21st.dev`,
      });
      continue;
    }

    const evalRes = evaluateStaticLiteral(prop.initializer);
    if (!evalRes.ok || evalRes.value === undefined) {
      skippedKeys.push({
        key: keyName,
        reason: evalRes.reason || "Unsupported value expression",
      });
      continue;
    }

    if (controls.length >= MAX_DEMO_CONTROLS) {
      truncatedCount += 1;
      continue;
    }

    const comment = getPropertyComment(prop, demoCode);
    const value = evalRes.value;
    const label = formatControlLabel(keyName);
    const description = comment || componentDescMap.get(keyName);

    let def: DemoControlDefinition | null = null;

    if (typeof value === "boolean") {
      def = {
        key: keyName,
        label,
        type: "boolean",
        defaultValue: value,
        description,
      };
    } else if (typeof value === "number") {
      const range = inferNumberRange(value, comment);
      def = {
        key: keyName,
        label,
        type: "number",
        defaultValue: value,
        min: range.min,
        max: range.max,
        step: range.step,
        description,
      };
    } else if (typeof value === "string") {
      const unionOptions = evalRes.unionOptions || componentUnionMap.get(keyName);
      if (unionOptions && unionOptions.includes(value)) {
        def = {
          key: keyName,
          label,
          type: "select",
          defaultValue: value,
          options: unionOptions,
          description,
        };
      } else if (isCssColorString(value)) {
        def = {
          key: keyName,
          label,
          type: "color",
          defaultValue: value,
          description,
        };
      } else if (value.length > SHORT_STRING_MAX_LENGTH) {
        def = {
          key: keyName,
          label,
          type: "textarea",
          defaultValue: value,
          description,
        };
      } else {
        def = {
          key: keyName,
          label,
          type: "string",
          defaultValue: value,
          description,
        };
      }
    } else if (Array.isArray(value)) {
      if (
        value.length > 0 &&
        value.length <= MAX_COLOR_ARRAY_ITEMS &&
        value.every((item) => isCssColorString(item))
      ) {
        def = {
          key: keyName,
          label,
          type: "color-array",
          defaultValue: value,
          description,
        };
      } else {
        def = {
          key: keyName,
          label,
          type: "string-array",
          defaultValue: value,
          description,
        };
      }
    } else if (value === null) {
      skippedKeys.push({
        key: keyName,
        reason: "Null values do not render an interactive control",
      });
      continue;
    }

    if (def) {
      controls.push(def);
      defaultValues[keyName] = def.defaultValue;
    }
  }

  let status: DemoControlsContractStatus = "active";
  if (controls.length === 0) {
    status = "empty";
  } else if (!acceptsProps) {
    status = "missing-props";
  }

  return {
    status,
    hasSettingsObject: true,
    acceptsProps,
    controls,
    defaultValues,
    skippedKeys,
    truncatedCount,
    settingsSpan: {
      start: settingsObj.getStart(sourceFile),
      end: settingsObj.getEnd(),
    },
  };
}

/**
 * Formats a JS value cleanly as TypeScript source literal for baking back into `const settings`.
 */
function formatValueAsTsLiteral(value: DemoControlValue): string {
  if (typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value === null) {
    return "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => JSON.stringify(item)).join(", ")}]`;
  }
  return JSON.stringify(value);
}

/**
 * Bakes modified control overrides directly back into `const settings = { ... }` in `default.tsx`,
 * matching 21st.dev's native copy-code behavior where tuned control values are preserved in copied code.
 */
export function bakeSettingsIntoDemoCode(
  demoCode: string,
  overrides: Record<string, DemoControlValue>
): string {
  const overrideKeys = Object.keys(overrides);
  if (!demoCode || overrideKeys.length === 0) return demoCode;

  const sourceFile = ts.createSourceFile(
    "default.tsx",
    demoCode,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

  const settingsObj = findSettingsObjectLiteral(sourceFile);
  if (!settingsObj) return demoCode;

  const edits: Array<{ start: number; end: number; replacement: string }> = [];

  for (const prop of settingsObj.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    let keyName: string | null = null;
    if (ts.isIdentifier(prop.name)) {
      keyName = prop.name.text;
    } else if (ts.isStringLiteral(prop.name)) {
      keyName = prop.name.text;
    }

    if (!keyName || !(keyName in overrides)) continue;

    const newVal = overrides[keyName];
    // Preserve trailing type assertion (e.g. `"dark" as "light" | "dark" | "auto"`)
    let targetNode: ts.Expression = prop.initializer;
    while (ts.isAsExpression(targetNode) || ts.isSatisfiesExpression(targetNode)) {
      targetNode = targetNode.expression;
    }

    edits.push({
      start: targetNode.getStart(sourceFile),
      end: targetNode.getEnd(),
      replacement: formatValueAsTsLiteral(newVal),
    });
  }

  if (edits.length === 0) return demoCode;

  // Apply edits from end to start to keep offsets valid
  edits.sort((a, b) => b.start - a.start);
  let output = demoCode;
  for (const edit of edits) {
    output = output.slice(0, edit.start) + edit.replacement + output.slice(edit.end);
  }
  return output;
}

/**
 * Scaffolds a 100% 21st.dev-compliant `default.tsx` with `const settings = { ... }` and
 * `export default function Demo(props: Partial<typeof settings>)` derived from `component.tsx` Props AST.
 */
export function scaffoldSettingsDemo(
  componentCode: string,
  existingDemoCode?: string
): string {
  const ast = parseComponentAST(componentCode);
  const compName = ast.componentName || "Component";

  // Extract up to 8 meaningful interactive props from component.tsx
  const settingsEntries: Array<{
    key: string;
    literal: string;
    propAssign: string;
    isChildren?: boolean;
  }> = [];

  for (const prop of ast.props) {
    if (settingsEntries.length >= 8) break;
    if (
      prop.name === "className" ||
      prop.name === "style" ||
      prop.name === "ref" ||
      prop.name === "key" ||
      prop.name.startsWith("on") ||
      prop.type.includes("=>") ||
      prop.type.includes("Function")
    ) {
      continue;
    }

    const typeLower = prop.type.toLowerCase().trim();
    const rawDefault = prop.defaultValue?.trim();

    if (prop.name === "children") {
      const cleanLabel =
        rawDefault && /^["']/.test(rawDefault)
          ? rawDefault
          : JSON.stringify(ast.title || "Interactive Preview");
      settingsEntries.push({
        key: "label",
        literal: cleanLabel,
        propAssign: "",
        isChildren: true,
      });
      continue;
    }

    // String union
    const union = extractStringUnionFromTypeString(prop.type);
    if (union && union.length > 0) {
      const defaultLiteral =
        rawDefault && /^["']/.test(rawDefault) ? rawDefault : JSON.stringify(union[0]);
      const unionType = union.map((u) => JSON.stringify(u)).join(" | ");
      settingsEntries.push({
        key: prop.name,
        literal: `${defaultLiteral} as ${unionType}`,
        propAssign: `${prop.name}={s.${prop.name}}`,
      });
      continue;
    }

    if (typeLower === "boolean") {
      const val = rawDefault === "true" || rawDefault === "false" ? rawDefault : "true";
      settingsEntries.push({
        key: prop.name,
        literal: val,
        propAssign: `${prop.name}={s.${prop.name}}`,
      });
      continue;
    }

    if (typeLower === "number") {
      const parsed = rawDefault ? Number(rawDefault) : NaN;
      const val = Number.isFinite(parsed) ? String(parsed) : "10";
      settingsEntries.push({
        key: prop.name,
        literal: val,
        propAssign: `${prop.name}={s.${prop.name}}`,
      });
      continue;
    }

    if (typeLower === "string") {
      const val =
        rawDefault && /^["']/.test(rawDefault)
          ? rawDefault
          : JSON.stringify(formatControlLabel(prop.name));
      settingsEntries.push({
        key: prop.name,
        literal: val,
        propAssign: `${prop.name}={s.${prop.name}}`,
      });
      continue;
    }

    if (typeLower === "string[]") {
      const val =
        rawDefault && rawDefault.startsWith("[")
          ? rawDefault
          : '["Item One", "Item Two", "Item Three"]';
      settingsEntries.push({
        key: prop.name,
        literal: val,
        propAssign: `${prop.name}={s.${prop.name}}`,
      });
    }
  }

  // Fallback if component defines no primitive props
  if (settingsEntries.length === 0) {
    settingsEntries.push(
      {
        key: "padding",
        literal: "24",
        propAssign: "",
      },
      {
        key: "centered",
        literal: "true",
        propAssign: "",
      }
    );

    return `"use client";

import React from "react";
import ${compName} from "../components/ui/component";

const settings = {
  padding: 24,
  centered: true,
};

export default function Demo(props: Partial<typeof settings>) {
  const s = { ...settings, ...props };

  return (
    <div
      className={\`min-h-full w-full flex \${s.centered ? "items-center justify-center" : "items-start justify-start"}\`}
      style={{ padding: s.padding }}
    >
      <${compName} />
    </div>
  );
}
`;
  }

  // If existing demo already has `const settings = ...` but is missing `(props: Partial<typeof settings>)`,
  // upgrade the default export signature cleanly!
  if (existingDemoCode) {
    const parsedExisting = parseDemoControls(existingDemoCode, componentCode);
    if (parsedExisting.hasSettingsObject && !parsedExisting.acceptsProps) {
      return existingDemoCode.replace(
        /export\s+default\s+function\s+([A-Za-z0-9_$]*)\s*\(\s*\)\s*\{/,
        `export default function $1(props: Partial<typeof settings>) {\n  const s = { ...settings, ...props };`
      );
    }
  }

  const childrenEntry = settingsEntries.find((e) => e.isChildren);
  const propAssignments = settingsEntries
    .filter((e) => !e.isChildren && e.propAssign)
    .map((e) => `        ${e.propAssign}`)
    .join("\n");

  const settingsLines = settingsEntries
    .map((e) => `  ${e.key}: ${e.literal},`)
    .join("\n");

  const jsxBlock = childrenEntry
    ? propAssignments
      ? `<${compName}\n${propAssignments}\n      >\n        {s.${childrenEntry.key}}\n      </${compName}>`
      : `<${compName}>{s.${childrenEntry.key}}</${compName}>`
    : propAssignments
    ? `<${compName}\n${propAssignments}\n      />`
    : `<${compName} />`;

  return `"use client";

import React from "react";
import ${compName} from "../components/ui/component";

const settings = {
${settingsLines}
};

export default function Demo(props: Partial<typeof settings>) {
  const s = { ...settings, ...props };

  return (
    <div className="min-h-full w-full flex items-center justify-center p-6 font-sans">
      ${jsxBlock}
    </div>
  );
}
`;
}
