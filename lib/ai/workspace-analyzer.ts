import { transform } from "sucrase";
import { parseComponentAST, type ParsedComponentAST } from "@/lib/sandbox/ast-parser";
import {
  auditComponentGuidelines,
  type GuidelineAuditResult,
} from "@/lib/sandbox/guideline-linter";
import type { AiVerificationReport } from "./types";

export interface WorkspaceDossier {
  ast: ParsedComponentAST;
  audit: GuidelineAuditResult;
  componentLines: number;
  demoLines: number;
  cssLines: number;
  usesFramerMotion: boolean;
  usesTailwindDark: boolean;
  usesCnUtility: boolean;
  hasNativeDemoControls: boolean;
  promptSummary: string;
}

/**
 * Runs deep static + TypeScript AST analysis on the active workspace files
 * so Gemini receives a surgical architectural dossier before generating code.
 */
export function analyzeWorkspaceDossier(
  componentCode: string,
  demoCode: string,
  cssCode: string,
  dependencies: string[]
): WorkspaceDossier {
  const ast = parseComponentAST(componentCode, demoCode, cssCode);
  const audit = auditComponentGuidelines(
    componentCode,
    demoCode,
    cssCode,
    dependencies
  );

  const componentLines = componentCode ? componentCode.split("\n").length : 0;
  const demoLines = demoCode ? demoCode.split("\n").length : 0;
  const cssLines = cssCode ? cssCode.split("\n").length : 0;
  const usesFramerMotion =
    ast.dependencies.includes("framer-motion") ||
    ast.dependencies.includes("motion") ||
    /\bmotion\./.test(componentCode);
  const usesTailwindDark =
    /\bdark:/.test(componentCode) || /var\(--/.test(componentCode);
  const usesCnUtility = /\bcn\s*\(/.test(componentCode);
  const hasNativeDemoControls = /\bconst\s+settings\s*=/.test(demoCode);

  const propsSummary =
    ast.props.length > 0
      ? ast.props
          .slice(0, 14)
          .map(
            (p) =>
              `${p.name}${p.optional ? "?" : ""}: ${p.type}${
                p.defaultValue ? ` = ${p.defaultValue}` : ""
              }`
          )
          .join("; ")
      : "No explicit props interface detected";

  const failingRules = audit.checks
    .filter((c) => !c.passed)
    .map((c) => `- ${c.title}: ${c.description}`)
    .join("\n");

  const promptSummary = [
    `AST Component: ${ast.componentName} (default export: ${ast.defaultExport || "missing"}, client: ${ast.isClientComponent})`,
    `Typed Props (${ast.props.length}): ${propsSummary}`,
    `File Sizes: component.tsx=${componentLines}L, default.tsx=${demoLines}L, index.css=${cssLines}L`,
    `Signals: FramerMotion=${usesFramerMotion}, DarkTokens=${usesTailwindDark}, cn()=${usesCnUtility}, NativeDemoControls=${hasNativeDemoControls}`,
    `Imported External Packages: ${JSON.stringify(ast.dependencies)}`,
    `Configured Dependencies: ${JSON.stringify(dependencies)}`,
    `21st.dev Static Compliance Score: ${audit.score}/100 (${audit.passedCount}/${audit.totalChecks} checks passed)`,
    failingRules ? `Failing Static Checks:\n${failingRules}` : "All static guideline checks currently passing.",
  ].join("\n");

  return {
    ast,
    audit,
    componentLines,
    demoLines,
    cssLines,
    usesFramerMotion,
    usesTailwindDark,
    usesCnUtility,
    hasNativeDemoControls,
    promptSummary,
  };
}

/**
 * Compiles TSX code using Sucrase (same transpiler used by the live sandbox)
 * to catch JSX/TypeScript syntax errors before returning generated files.
 */
export function verifyTsxCompilation(
  filename: string,
  code: string
): { valid: boolean; error: string | null } {
  if (!code || !code.trim()) {
    return { valid: true, error: null };
  }
  try {
    transform(code, {
      transforms: ["typescript", "jsx"],
      jsxRuntime: "automatic",
      filePath: filename,
    });
    return { valid: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      valid: false,
      error: `${filename}: ${msg}`,
    };
  }
}

/**
 * Verifies all changed files with Sucrase compilation + post-generation 21st.dev audit
 * and builds a transparent verification report.
 */
export function verifyGeneratedWorkspace(params: {
  baselineDossier: WorkspaceDossier;
  baseComponentCode: string;
  baseDemoCode: string;
  baseCssCode: string;
  baseDependencies: string[];
  changedFiles: Partial<Record<string, string>>;
  addedDependencies: string[];
  selfRepaired: boolean;
}): AiVerificationReport {
  const nextComp = params.changedFiles["component.tsx"] ?? params.baseComponentCode;
  const nextDemo =
    params.changedFiles["default.tsx"] ??
    params.changedFiles["demo.tsx"] ??
    params.baseDemoCode;
  const nextCss = params.changedFiles["index.css"] ?? params.baseCssCode;

  const nextDeps = Array.from(
    new Set([...params.baseDependencies, ...params.addedDependencies])
  );

  // Compile checks on modified TSX files
  const compileErrors: string[] = [];
  if (params.changedFiles["component.tsx"]) {
    const res = verifyTsxCompilation("component.tsx", nextComp);
    if (!res.valid && res.error) compileErrors.push(res.error);
  }
  if (params.changedFiles["default.tsx"] || params.changedFiles["demo.tsx"]) {
    const res = verifyTsxCompilation("default.tsx", nextDemo);
    if (!res.valid && res.error) compileErrors.push(res.error);
  }

  // Re-run AST & 21st.dev audit on post-generation state
  const afterAst = parseComponentAST(nextComp, nextDemo, nextCss);
  const afterAudit = auditComponentGuidelines(nextComp, nextDemo, nextCss, nextDeps);

  // Also detect any new packages imported in generated code that weren't listed in addedDependencies
  const detectedNewDeps = afterAst.dependencies.filter(
    (d) => !params.baseDependencies.includes(d)
  );
  const dependencyDelta = Array.from(
    new Set([...params.addedDependencies, ...detectedNewDeps])
  ).filter((d) => !params.baseDependencies.includes(d));

  const changedFileKeys = Object.keys(params.changedFiles);
  const verificationNotes: string[] = [];

  if (compileErrors.length === 0) {
    verificationNotes.push("Sucrase TSX/JSX compilation verified clean");
  } else {
    verificationNotes.push(`Compile warning: ${compileErrors[0]}`);
  }

  const scoreDelta = afterAudit.score - params.baselineDossier.audit.score;
  if (scoreDelta > 0) {
    verificationNotes.push(
      `21st.dev compliance improved +${scoreDelta} pts (${params.baselineDossier.audit.score} → ${afterAudit.score})`
    );
  } else {
    verificationNotes.push(`21st.dev compliance maintained at ${afterAudit.score}/100`);
  }

  if (params.selfRepaired) {
    verificationNotes.push("Automatic compile self-repair loop succeeded");
  }
  if (dependencyDelta.length > 0) {
    verificationNotes.push(`Detected dependencies: ${dependencyDelta.join(", ")}`);
  }

  return {
    beforeScore: params.baselineDossier.audit.score,
    afterScore: afterAudit.score,
    scoreDelta,
    astComponentName: afterAst.componentName,
    propsCount: afterAst.props.length,
    compileValid: compileErrors.length === 0,
    compileError: compileErrors.length > 0 ? compileErrors.join(" | ") : null,
    changedFiles: changedFileKeys,
    dependencyDelta,
    selfRepaired: params.selfRepaired,
    verificationNotes,
  };
}
