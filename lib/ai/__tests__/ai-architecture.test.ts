import { describe, expect, it } from "bun:test";
import { classifyAiIntent } from "../intent-router";
import {
  listSelectableRegistryReferences,
  retrieveRegistryReferences,
} from "../registry-reference-retriever";
import {
  analyzeWorkspaceDossier,
  verifyGeneratedWorkspace,
  verifyTsxCompilation,
} from "../workspace-analyzer";

describe("AI Architecture: Intent Router & Selective Registry Grounding", () => {
  it("selectively enables registry visual references for visual design prompts in auto mode", () => {
    const result = classifyAiIntent({
      prompt: "Redesign this card into a sleek modern bento layout with glassmorphism and micro-interactions",
      action: "chat",
      role: "engineer",
      preserveDesign: false,
      registryRefMode: "auto",
      pinnedReferenceSlugs: [],
      hasCompilerError: false,
      hasUserAttachedImages: false,
    });

    expect(result.shouldUseRegistryReferences).toBe(true);
    expect(result.primaryIntent).toBe("visual_design");
    expect(result.targetCategories).toContain("Cards");
  });

  it("supports Banglish visual design prompts for selective grounding", () => {
    const result = classifyAiIntent({
      prompt: "ekta onek sundor modern hero section banaw glass designe",
      action: "chat",
      role: "engineer",
      preserveDesign: true,
      registryRefMode: "auto",
      pinnedReferenceSlugs: [],
      hasCompilerError: false,
      hasUserAttachedImages: false,
    });

    expect(result.shouldUseRegistryReferences).toBe(true);
    expect(result.targetCategories).toContain("Heroes");
  });

  it("skips registry visual references for pure surgical bugfix prompts in auto mode", () => {
    const result = classifyAiIntent({
      prompt: "Fix the undefined TypeScript error on line 42 and resolve hydration crash",
      action: "chat",
      role: "engineer",
      preserveDesign: true,
      registryRefMode: "auto",
      pinnedReferenceSlugs: [],
      hasCompilerError: true,
      hasUserAttachedImages: false,
    });

    expect(result.primaryIntent).toBe("bugfix");
    expect(result.shouldUseRegistryReferences).toBe(false);
  });

  it("respects explicit off, always, and user-pinned overrides", () => {
    const offResult = classifyAiIntent({
      prompt: "Redesign into a luxury bento hero",
      action: "chat",
      role: "designer",
      preserveDesign: false,
      registryRefMode: "off",
      pinnedReferenceSlugs: [],
      hasCompilerError: false,
      hasUserAttachedImages: false,
    });
    expect(offResult.shouldUseRegistryReferences).toBe(false);

    const alwaysResult = classifyAiIntent({
      prompt: "Fix typo in prop name",
      action: "chat",
      role: "engineer",
      preserveDesign: true,
      registryRefMode: "always",
      pinnedReferenceSlugs: [],
      hasCompilerError: false,
      hasUserAttachedImages: false,
    });
    expect(alwaysResult.shouldUseRegistryReferences).toBe(true);

    const pinnedResult = classifyAiIntent({
      prompt: "Fix typo",
      action: "chat",
      role: "engineer",
      preserveDesign: true,
      registryRefMode: "off",
      pinnedReferenceSlugs: ["agency-bento-showcase"],
      hasCompilerError: false,
      hasUserAttachedImages: false,
    });
    expect(pinnedResult.shouldUseRegistryReferences).toBe(true);
  });
});

describe("AI Architecture: Registry Reference Retriever", () => {
  it("loads matching registry components with preview.png inlineData and excludes active component", async () => {
    const intent = classifyAiIntent({
      prompt: "Create a premium bento showcase card with smooth hover lighting",
      action: "chat",
      role: "designer",
      preserveDesign: false,
      registryRefMode: "auto",
      pinnedReferenceSlugs: [],
      hasCompilerError: false,
      hasUserAttachedImages: false,
    });

    const { references, totalRegistryCount } = await retrieveRegistryReferences({
      prompt: "Create a premium bento showcase card with smooth hover lighting",
      intent,
      currentDependencies: ["framer-motion", "lucide-react"],
      excludeComponentSlug: "agency-bento-showcase",
      maxReferences: 2,
    });

    expect(totalRegistryCount).toBeGreaterThan(0);
    expect(references.length).toBeGreaterThan(0);
    expect(references.length).toBeLessThanOrEqual(2);
    expect(references.some((r) => r.slug === "agency-bento-showcase")).toBe(false);
    expect(references.some((r) => r.hasPreviewImage && Boolean(r.imageInlineData?.data))).toBe(true);
  });

  it("lists searchable registry references for the UI picker", async () => {
    const items = await listSelectableRegistryReferences("bento");
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].slug).toBeTruthy();
  });
});

describe("AI Architecture: Workspace Analyzer & Sucrase Verification", () => {
  const validComponent = `"use client";
import React from "react";

export interface DemoCardProps {
  title?: string;
}

export default function DemoCard({ title = "Hello" }: DemoCardProps) {
  return <div className="rounded-xl p-4 bg-white dark:bg-zinc-900">{title}</div>;
}
`;

  const validDemo = `"use client";
import React from "react";
import DemoCard from "./component";

export default function Demo() {
  return <DemoCard title="Preview" />;
}
`;

  it("validates clean TSX compilation and catches malformed JSX", () => {
    expect(verifyTsxCompilation("component.tsx", validComponent).valid).toBe(true);
    const broken = verifyTsxCompilation(
      "component.tsx",
      `export default function Broken() { return <div className="x"><span>unclosed</div>; }`
    );
    expect(broken.valid).toBe(false);
    expect(broken.error).toContain("component.tsx");
  });

  it("analyzes AST dossier and verifies generated workspace delta", () => {
    const dossier = analyzeWorkspaceDossier(validComponent, validDemo, "", ["lucide-react"]);
    expect(dossier.ast.componentName).toBe("DemoCard");
    expect(dossier.ast.props.length).toBe(1);

    const report = verifyGeneratedWorkspace({
      baselineDossier: dossier,
      baseComponentCode: validComponent,
      baseDemoCode: validDemo,
      baseCssCode: "",
      baseDependencies: ["lucide-react"],
      changedFiles: {
        "component.tsx": validComponent.replace("Hello", "Elevated"),
      },
      addedDependencies: [],
      selfRepaired: false,
    });

    expect(report.compileValid).toBe(true);
    expect(report.changedFiles).toEqual(["component.tsx"]);
    expect(report.propsCount).toBe(1);
  });
});
