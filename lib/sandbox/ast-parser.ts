import ts from "typescript";

export interface ParsedProp {
  name: string;
  type: string;
  optional: boolean;
  description?: string;
  defaultValue?: string;
}

export interface ParsedExport {
  name: string;
  isDefault: boolean;
  kind: "function" | "component" | "const" | "type" | "interface" | "unknown";
}

export interface ParsedComponentAST {
  componentName: string;
  title: string;
  description: string;
  defaultExport: string | null;
  namedExports: ParsedExport[];
  props: ParsedProp[];
  dependencies: string[];
  devDependencies: string[];
  relativeImports: string[];
  isClientComponent: boolean;
  rawTsx: string;
}

export interface TwentyFirstPublishPayload {
  $schema?: string;
  name: string;
  type: "registry:ui";
  title: string;
  description: string;
  author?: string;
  dependencies: string[];
  devDependencies: string[];
  registryDependencies: string[];
  files: Array<{
    path: string;
    content: string;
    type: "registry:ui" | "registry:example" | "registry:page";
    target?: string;
  }>;
  props: ParsedProp[];
  tailwind?: {
    config?: Record<string, unknown>;
  };
  cliCommand: string;
}

/**
 * Extracts JSDoc comments preceding a TypeScript node
 */
function getJSDocComment(node: ts.Node, sourceCode: string): string | undefined {
  const fullText = sourceCode;
  const comments = ts.getLeadingCommentRanges(fullText, node.getFullStart());
  if (!comments || comments.length === 0) return undefined;

  for (const comment of comments) {
    const text = fullText.substring(comment.pos, comment.end);
    if (text.startsWith("/**")) {
      return text
        .replace(/^\/\*\*|\*\/$/g, "")
        .split("\n")
        .map((line) => line.replace(/^\s*\*\s?/, "").trim())
        .filter(Boolean)
        .join(" ");
    }
  }
  return undefined;
}

/**
 * Parses TSX code using TypeScript compiler AST
 */
export function parseComponentAST(
  tsxCode: string,
  demoCode?: string,
  cssCode?: string
): ParsedComponentAST {
  const sourceFile = ts.createSourceFile(
    "component.tsx",
    tsxCode,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

  const dependencies = new Set<string>();
  const devDependencies = new Set<string>(["@types/react", "typescript"]);
  const relativeImports = new Set<string>();
  const namedExports: ParsedExport[] = [];
  let defaultExport: string | null = null;
  const props: ParsedProp[] = [];
  let isClientComponent = tsxCode.includes('"use client"') || tsxCode.includes("'use client'");

  // Helper to extract default values from function parameter destructuring
  const defaultValuesMap = new Map<string, string>();

  function visit(node: ts.Node) {
    // 1. Detect Imports
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier.getText(sourceFile).replace(/['"]/g, "");
      if (moduleSpecifier.startsWith("./") || moduleSpecifier.startsWith("../") || moduleSpecifier.startsWith("@/")) {
        relativeImports.add(moduleSpecifier);
      } else {
        // Extract root package name (e.g., 'framer-motion', '@radix-ui/react-dialog')
        const parts = moduleSpecifier.split("/");
        const pkgName = moduleSpecifier.startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0];
        if (pkgName && pkgName !== "react" && pkgName !== "react-dom") {
          dependencies.add(pkgName);
        }
      }
    }

    // 2. Detect Default Export: `export default function Component(...)`
    if (ts.isFunctionDeclaration(node)) {
      const isExported = node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
      const isDefault = node.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword);
      const name = node.name ? node.name.text : "AnonymousComponent";

      if (isDefault) {
        defaultExport = name;
      }
      if (isExported) {
        namedExports.push({
          name,
          isDefault: !!isDefault,
          kind: "component",
        });

        // Inspect function parameters for default prop values: ({ title = "Hello", ... })
        if (node.parameters.length > 0) {
          const firstParam = node.parameters[0];
          if (ts.isObjectBindingPattern(firstParam.name)) {
            for (const element of firstParam.name.elements) {
              if (ts.isBindingElement(element) && element.initializer) {
                const propName = element.name.getText(sourceFile);
                const defaultValue = element.initializer.getText(sourceFile);
                defaultValuesMap.set(propName, defaultValue);
              }
            }
          }
        }
      }
    }

    // 3. Detect Default Export: `export default Component`
    if (ts.isExportAssignment(node)) {
      defaultExport = node.expression.getText(sourceFile);
      namedExports.push({
        name: defaultExport,
        isDefault: true,
        kind: "component",
      });
    }

    // 4. Detect Named Variable Exports: `export const SpotlightCard = ...`
    if (ts.isVariableStatement(node)) {
      const isExported = node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
      if (isExported) {
        for (const decl of node.declarationList.declarations) {
          const varName = decl.name.getText(sourceFile);
          namedExports.push({
            name: varName,
            isDefault: false,
            kind: "const",
          });
        }
      }
    }

    // 5. Detect Interface Declarations for Props
    if (ts.isInterfaceDeclaration(node)) {
      const interfaceName = node.name.text;
      const isProps = interfaceName.toLowerCase().includes("props") || interfaceName.endsWith("Props");

      if (isProps) {
        for (const member of node.members) {
          if (ts.isPropertySignature(member) && member.name) {
            const propName = member.name.getText(sourceFile);
            const typeText = member.type ? member.type.getText(sourceFile) : "any";
            const optional = !!member.questionToken;
            const description = getJSDocComment(member, tsxCode);
            const defaultValue = defaultValuesMap.get(propName);

            props.push({
              name: propName,
              type: typeText,
              optional,
              description,
              defaultValue,
            });
          }
        }
      }
    }

    // 6. Detect Type Alias for Props: `type ComponentProps = { ... }`
    if (ts.isTypeAliasDeclaration(node)) {
      const typeName = node.name.text;
      if (typeName.toLowerCase().includes("props") && ts.isTypeLiteralNode(node.type)) {
        for (const member of node.type.members) {
          if (ts.isPropertySignature(member) && member.name) {
            const propName = member.name.getText(sourceFile);
            const typeText = member.type ? member.type.getText(sourceFile) : "any";
            const optional = !!member.questionToken;
            const description = getJSDocComment(member, tsxCode);
            const defaultValue = defaultValuesMap.get(propName);

            if (!props.some((p) => p.name === propName)) {
              props.push({
                name: propName,
                type: typeText,
                optional,
                description,
                defaultValue,
              });
            }
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  // Derive component name
  const rawName = defaultExport || namedExports[0]?.name || "CustomComponent";
  // Clean up component name
  const componentName = rawName.replace(/[^a-zA-Z0-9]/g, "");
  // Title case formatted: "SpotlightCard" -> "Spotlight Card"
  const title = componentName
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();

  return {
    componentName,
    title,
    description: `A production-ready ${title} component authored in 21st.dev Component Studio with Tailwind CSS.`,
    defaultExport: defaultExport || componentName,
    namedExports,
    props,
    dependencies: Array.from(dependencies),
    devDependencies: Array.from(devDependencies),
    relativeImports: Array.from(relativeImports),
    isClientComponent,
    rawTsx: tsxCode,
  };
}

/**
 * Creates the exact 21st.dev registry schema payload
 */
export function generateTwentyFirstPayload(
  componentTsx: string,
  demoTsx: string,
  indexCss?: string,
  overrides?: Partial<TwentyFirstPublishPayload>
): TwentyFirstPublishPayload {
  const ast = parseComponentAST(componentTsx, demoTsx, indexCss);
  const slug = ast.componentName
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .toLowerCase();

  const files: TwentyFirstPublishPayload["files"] = [
    {
      path: `components/ui/${slug}.tsx`,
      content: componentTsx,
      type: "registry:ui",
      target: `components/ui/${slug}.tsx`,
    },
    {
      path: `components/demo/${slug}-demo.tsx`,
      content: demoTsx,
      type: "registry:example",
      target: `components/demo/${slug}-demo.tsx`,
    },
  ];

  if (indexCss && indexCss.trim().length > 0) {
    files.push({
      path: `styles/${slug}.css`,
      content: indexCss,
      type: "registry:ui",
    });
  }

  const payload: TwentyFirstPublishPayload = {
    $schema: "https://21st.dev/schema/component.json",
    name: slug,
    type: "registry:ui",
    title: overrides?.title || ast.title,
    description: overrides?.description || ast.description,
    author: overrides?.author || "Component Studio Creator",
    dependencies: Array.from(new Set([...ast.dependencies, ...(overrides?.dependencies || [])])),
    devDependencies: ast.devDependencies,
    registryDependencies: overrides?.registryDependencies || [],
    files,
    props: ast.props,
    cliCommand: `npx 21st@latest add ${slug}`,
    ...overrides,
  };

  return payload;
}
