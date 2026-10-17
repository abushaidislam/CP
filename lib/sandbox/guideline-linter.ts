import { parseComponentAST } from "@/lib/sandbox/ast-parser";

export interface GuidelineCheckItem {
  id: string;
  category: "standards" | "styling" | "typescript" | "dependencies" | "demo";
  title: string;
  description: string;
  severity: "error" | "warning" | "success";
  passed: boolean;
  fixSuggestion?: string;
}

export interface GuidelineAuditResult {
  score: number;
  totalChecks: number;
  passedCount: number;
  checks: GuidelineCheckItem[];
  canAutoFix: boolean;
}

/**
 * Performs fast static verification of 21st.dev component authoring guidelines
 */
export function auditComponentGuidelines(
  componentCode: string,
  demoCode: string,
  cssCode: string,
  activeDependencies: string[]
): GuidelineAuditResult {
  const checks: GuidelineCheckItem[] = [];
  const ast = parseComponentAST(componentCode, demoCode, cssCode);

  // 1. "use client" Directive Check
  const hasHooksOrEvents =
    /\b(useState|useEffect|useRef|useMemo|useCallback|useId|useContext|useReducer)\b/.test(
      componentCode
    ) || /\bon[A-Z][a-zA-Z]+\s*=/g.test(componentCode);

  const hasUseClient =
    componentCode.includes('"use client"') || componentCode.includes("'use client'");

  if (hasHooksOrEvents) {
    checks.push({
      id: "use-client",
      category: "standards",
      title: 'Client Directive ("use client")',
      description: hasUseClient
        ? 'Properly marked with "use client" for React 19 interactivity.'
        : 'Missing "use client" directive at the top of component.tsx while using state or events.',
      severity: hasUseClient ? "success" : "error",
      passed: hasUseClient,
      fixSuggestion: 'Add "use client"; as the very first line of component.tsx.',
    });
  } else {
    checks.push({
      id: "use-client",
      category: "standards",
      title: 'Server / Client Component Directive',
      description: 'Stateless component without interactive hooks.',
      severity: "success",
      passed: true,
    });
  }

  // 2. TypeScript Props Interface
  const hasProps = ast.props.length > 0;
  const hasPropsInterface =
    /interface\s+\w+Props\b/.test(componentCode) || /type\s+\w+Props\b/.test(componentCode);

  checks.push({
    id: "ts-props-interface",
    category: "typescript",
    title: "TypeScript Props Interface",
    description: hasPropsInterface
      ? "Component defines explicit TypeScript Props interface."
      : "Missing exported Props interface (e.g. export interface ComponentProps).",
    severity: hasPropsInterface ? "success" : "warning",
    passed: hasPropsInterface,
    fixSuggestion:
      "Define and export a typed interface like: export interface ComponentProps extends React.HTMLAttributes<HTMLDivElement> { ... }",
  });

  // 3. className Prop Acceptance
  const acceptsClassName =
    ast.props.some((p) => p.name === "className") ||
    /className\s*\??\s*:\s*string/.test(componentCode) ||
    /HTMLAttributes<[^>]+>/.test(componentCode);

  checks.push({
    id: "classname-prop",
    category: "standards",
    title: "Custom className Forwarding",
    description: acceptsClassName
      ? "Component accepts custom className for easy styling overrides."
      : "Component should accept className?: string prop to allow customization.",
    severity: acceptsClassName ? "success" : "warning",
    passed: acceptsClassName,
    fixSuggestion: "Add className?: string to props and pass it to the root element.",
  });

  // 4. cn() Utility Usage for Class Merging
  const usesCn =
    /\bcn\s*\(/.test(componentCode) &&
    /@\/lib\/utils|clsx|tailwind-merge/.test(componentCode);

  checks.push({
    id: "cn-utility",
    category: "styling",
    title: "Tailwind cn() Class Merging",
    description: usesCn
      ? "Uses cn() utility from @/lib/utils to merge classes safely without conflicts."
      : "Should use cn(...) to merge default classes with user-provided className.",
    severity: usesCn ? "success" : "warning",
    passed: usesCn,
    fixSuggestion:
      'Import { cn } from "@/lib/utils" and wrap root element classes: className={cn("base-classes", className)}',
  });

  // 5. Dark Mode Support
  const hasDarkModeClasses =
    /\bdark:/.test(componentCode) ||
    /\bdark:/.test(cssCode) ||
    /var\(--/.test(componentCode) ||
    /var\(--/.test(cssCode);

  checks.push({
    id: "dark-mode",
    category: "styling",
    title: "Dark & Light Mode Compatibility",
    description: hasDarkModeClasses
      ? "Includes dark mode styles (dark: classes or CSS theme variables)."
      : "No dark: classes detected. 21st.dev components should support both dark and light modes.",
    severity: hasDarkModeClasses ? "success" : "warning",
    passed: hasDarkModeClasses,
    fixSuggestion:
      "Add dark:bg-... and dark:text-... variants or use semantic color tokens like bg-background, text-foreground.",
  });

  // 6. Responsive Sizing & Breakpoints
  const hasResponsiveClasses =
    /\b(sm:|md:|lg:|xl:|max-w-|w-full)\b/.test(componentCode) ||
    /\b(sm:|md:|lg:|xl:|max-w-|w-full)\b/.test(demoCode);

  checks.push({
    id: "responsive-design",
    category: "styling",
    title: "Responsive Layout & Mobile Support",
    description: hasResponsiveClasses
      ? "Component includes responsive widths or Tailwind breakpoint variants."
      : "Consider adding responsive classes (sm:, md:, w-full, max-w-*) so the component looks great on all screens.",
    severity: hasResponsiveClasses ? "success" : "warning",
    passed: hasResponsiveClasses,
    fixSuggestion: "Use w-full max-w-md or responsive grid/flex containers.",
  });

  // 7. Component Export Structure
  const hasValidExport =
    !!ast.defaultExport || ast.namedExports.some((e) => e.kind === "component");

  checks.push({
    id: "valid-export",
    category: "standards",
    title: "Component Export Declaration",
    description: hasValidExport
      ? `Exports valid component: "${ast.defaultExport || ast.namedExports[0]?.name}".`
      : "No valid component export found in component.tsx.",
    severity: hasValidExport ? "success" : "error",
    passed: hasValidExport,
    fixSuggestion: "Export your component as export default function ComponentName() { ... }",
  });

  // 8. Demo Showcase Component
  const hasValidDemo =
    demoCode.includes("export default") || /function\s+Demo\b/.test(demoCode);
  const demoImportsComponent =
    demoCode.includes("./component") || demoCode.includes(ast.componentName);

  checks.push({
    id: "demo-showcase",
    category: "demo",
    title: "Demo Showcase (demo.tsx)",
    description:
      hasValidDemo && demoImportsComponent
        ? "demo.tsx provides an isolated preview showcase of the component."
        : "demo.tsx should import and showcase the component with realistic mock content.",
    severity: hasValidDemo && demoImportsComponent ? "success" : "warning",
    passed: hasValidDemo && demoImportsComponent,
    fixSuggestion:
      'In demo.tsx, export a default function Demo() { return <div className="p-8"><YourComponent /></div>; }',
  });

  // 9. External Package Dependencies Verification
  const missingDependencies: string[] = [];
  for (const dep of ast.dependencies) {
    if (!activeDependencies.includes(dep)) {
      missingDependencies.push(dep);
    }
  }

  const depsOk = missingDependencies.length === 0;
  checks.push({
    id: "dependencies-sync",
    category: "dependencies",
    title: "Dependencies Verification",
    description: depsOk
      ? `All ${ast.dependencies.length} imported packages are properly configured.`
      : `Missing registered dependencies: ${missingDependencies.join(", ")}.`,
    severity: depsOk ? "success" : "warning",
    passed: depsOk,
    fixSuggestion: `Add ${missingDependencies.join(", ")} to your Packages list.`,
  });

  // Calculate score (0-100)
  const total = checks.length;
  let passed = 0;
  for (const c of checks) {
    if (c.passed) passed++;
    else if (c.severity === "warning") passed += 0.5; // partial credit for minor warnings
  }

  const score = Math.round((passed / total) * 100);

  return {
    score,
    totalChecks: total,
    passedCount: checks.filter((c) => c.passed).length,
    checks,
    canAutoFix: checks.some((c) => !c.passed),
  };
}
