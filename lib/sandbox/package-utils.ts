export interface CuratedPackage {
  name: string;
  category: "animation" | "ui" | "icons" | "utilities" | "data";
  desc: string;
  recommendedVersion?: string;
}

export const CURATED_PACKAGES: CuratedPackage[] = [
  // Animation
  {
    name: "framer-motion",
    category: "animation",
    desc: "Production-ready motion and physics library for React",
    recommendedVersion: "11.11.17",
  },
  {
    name: "canvas-confetti",
    category: "animation",
    desc: "Performant particle confetti animation engine",
    recommendedVersion: "1.9.4",
  },
  {
    name: "gsap",
    category: "animation",
    desc: "Ultra high-performance professional web animation",
    recommendedVersion: "3.12.5",
  },
  {
    name: "three",
    category: "animation",
    desc: "3D WebGL graphics library for interactive canvasing",
  },

  // UI Primitives
  {
    name: "@radix-ui/react-dialog",
    category: "ui",
    desc: "Accessible modal dialog primitive",
  },
  {
    name: "@radix-ui/react-tooltip",
    category: "ui",
    desc: "Accessible floating tooltip primitive",
  },
  {
    name: "@radix-ui/react-dropdown-menu",
    category: "ui",
    desc: "Accessible dropdown menu with keyboard navigation",
  },
  {
    name: "vaul",
    category: "ui",
    desc: "Unstyled drawer component for React (iOS style sheet)",
  },
  {
    name: "sonner",
    category: "ui",
    desc: "Opinionated toast notification component",
  },
  {
    name: "cmdk",
    category: "ui",
    desc: "Fast, unstyled command menu React component",
  },

  // Icons
  {
    name: "lucide-react",
    category: "icons",
    desc: "Clean & consistent vector icon set (800+ icons)",
    recommendedVersion: "0.475.0",
  },
  {
    name: "@tabler/icons-react",
    category: "icons",
    desc: "Over 5,000 pixel-perfect vector icons",
  },
  {
    name: "react-icons",
    category: "icons",
    desc: "Popular icons collection (FontAwesome, Material, Feather)",
  },

  // Utilities
  {
    name: "clsx",
    category: "utilities",
    desc: "Utility for constructing className strings conditionally",
  },
  {
    name: "tailwind-merge",
    category: "utilities",
    desc: "Merge Tailwind CSS classes in JS without conflicts",
  },
  {
    name: "class-variance-authority",
    category: "utilities",
    desc: "CVA - Type-safe CSS variant management for UI components",
  },
  {
    name: "date-fns",
    category: "utilities",
    desc: "Modern JavaScript date utility library",
  },

  // Data & Charts
  {
    name: "recharts",
    category: "data",
    desc: "Redefined chart library built with React and D3",
  },
  {
    name: "react-dropzone",
    category: "data",
    desc: "HTML5 drag and drop file upload zone for React",
  },
];

/**
 * Validates npm package name format (including optional version tag @x.x.x)
 */
export function isValidPackageName(pkg: string): boolean {
  const trimmed = pkg.trim();
  if (!trimmed || trimmed.length > 214) return false;
  // Match standard package names like lodash, @radix-ui/react-dialog, vaul@1.0.0
  const npmPackageRegex =
    /^(?:@([a-z0-9-_~][a-z0-9-_.~]*)\/)?([a-z0-9-_~][a-z0-9-_.~]*)(?:@([a-zA-Z0-9-._~^]+))?$/;
  return npmPackageRegex.test(trimmed);
}

/**
 * Extracts all external import specifiers from user code
 * Filters out internal paths (./, ../, @/) and react/react-dom
 */
export function extractCodeImports(code: string): string[] {
  const imports = new Set<string>();
  if (!code) return [];

  // Match import ... from 'package' or import 'package'
  const importRegex =
    /(?:import\s+(?:[\w*\s{},]*\s+from\s+)?|import\s*\(\s*)['"]([^'"]+)['"]/g;

  let match;
  while ((match = importRegex.exec(code)) !== null) {
    const specifier = match[1];

    // Skip relative or local alias paths
    if (
      specifier.startsWith(".") ||
      specifier.startsWith("/") ||
      specifier.startsWith("@/") ||
      specifier.startsWith("http://") ||
      specifier.startsWith("https://") ||
      specifier.startsWith("data:")
    ) {
      continue;
    }

    // Skip built-in react runtime packages
    if (
      specifier === "react" ||
      specifier.startsWith("react/") ||
      specifier === "react-dom" ||
      specifier.startsWith("react-dom/")
    ) {
      continue;
    }

    // Extract root package name (handling scoped packages like @radix-ui/react-dialog)
    let rootPkg = specifier;
    if (specifier.startsWith("@")) {
      const parts = specifier.split("/");
      if (parts.length >= 2) {
        rootPkg = `${parts[0]}/${parts[1]}`;
      }
    } else {
      rootPkg = specifier.split("/")[0];
    }

    if (rootPkg) {
      imports.add(rootPkg);
    }
  }

  return Array.from(imports);
}
