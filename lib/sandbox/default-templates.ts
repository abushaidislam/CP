export interface ComponentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  files: {
    "component.tsx": string;
    "default.tsx"?: string;
    "demo.tsx": string;
    "index.css": string;
  };
  dependencies: string[];
}

export const DEFAULT_TEMPLATES: ComponentTemplate[] = [];
