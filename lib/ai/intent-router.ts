import type {
  AiIntentType,
  IntentClassification,
  RegistryReferenceMode,
} from "./types";

interface ClassifyIntentInput {
  prompt: string;
  action: "audit" | "chat" | "autofix";
  role: string;
  preserveDesign: boolean;
  registryRefMode: RegistryReferenceMode;
  pinnedReferenceSlugs: string[];
  hasCompilerError: boolean;
  hasUserAttachedImages: boolean;
  currentCategory?: string;
}

// High-signal keywords across English & Banglish for UI design / visual inspiration
const VISUAL_DESIGN_PATTERNS =
  /\b(design|redesign|restyle|visual|aesthetic|style|styling|theme|dark\s*mode|light\s*mode|glass|glassmorph|minimal|minimalist|modern|premium|luxury|craft|polish|elevate|beautiful|sleek|clean|layout|grid|bento|hero|card|button|navbar|sidebar|dock|menu|popover|modal|drawer|carousel|gallery|widget|clock|dial|tuner|wallet|receipt|badge|pill|toggle|switch|accordion|footer|typography|gradient|border|shadow|spotlight|aurora|liquid|morph|kinetic|retro|hardware|isometric|inspire|inspiration|reference|sundor|shundor|bhalo|banaw|banao|designe|notun|look|feel|ui)\b/gi;

const NEW_COMPONENT_PATTERNS =
  /\b(create|build|make|generate|scratch|new\s+component|from\s+scratch|convert\s+into|turn\s+this\s+into|replace\s+with|banaw|banao|toiri|notun)\b/gi;

const MOTION_PATTERNS =
  /\b(motion|animation|animate|framer|spring|physics|hover|tap|gesture|transition|morph|parallax|scroll\s*reveal|micro-interaction|microinteraction|shuffle|swap|flip|kinetic|choreograph)\b/gi;

const BUGFIX_PATTERNS =
  /\b(fix|bug|error|broken|crash|compile|syntax|type\s*error|typescript\s*error|undefined|null|hydrate|hydration|not\s+working|issue|debug|resolve|repair)\b/gi;

const AUDIT_PATTERNS =
  /\b(audit|21st\.dev|standard|guideline|compliance|a11y|accessibility|aria|wcag|keyboard|focus-visible|screen\s*reader|lint|check)\b/gi;

const REFACTOR_PATTERNS =
  /\b(refactor|clean\s*up|extract|subcomponent|memo|memoize|performance|optimize|re-render|props\s*interface|typescript|types|generic|hook|custom\s*hook|architecture|modular)\b/gi;

const DEMO_CONTROLS_PATTERNS =
  /\b(demo|default\.tsx|control|controls|settings|playground|showcase|prop\s*toggle|slider|interactive\s*demo)\b/gi;

const QUESTION_PATTERNS =
  /^\s*(what|why|how|explain|describe|tell\s+me|can\s+you\s+explain|ki|keno|kivabe)\b/i;

const CATEGORY_HINTS: Array<{ category: string; regex: RegExp }> = [
  { category: "Buttons", regex: /\b(button|cta|keycap|action\s*bar|split\s*button|chevron|probe|shimmer)\b/i },
  { category: "Cards", regex: /\b(card|bento|profile|trend|wallet|receipt|showcase|pricing|metric|spotlight)\b/i },
  { category: "Heroes", regex: /\b(hero|landing|headline|banner|search\s*hero|career|agency)\b/i },
  { category: "Navigation", regex: /\b(nav|navbar|menu|mega\s*menu|dock|sidebar|dashboard|shell|switcher|pagination|toolbar|footer)\b/i },
  { category: "Widgets", regex: /\b(widget|clock|alarm|calendar|tuner|radio|dial|pool|checklist|routine|ritual|notification|workflow|tree|emotion|wheel)\b/i },
  { category: "Effects", regex: /\b(effect|orb|aurora|liquid|morph|kinetic|ascii|spotlight|lenticular|gradient|scroll\s*reveal|typography|poster|numeral)\b/i },
  { category: "Forms", regex: /\b(form|input|search\s*bar|toggle|switch|segmented|selector|frequency|avatar\s*toggle|slider)\b/i },
  { category: "Data", regex: /\b(chart|peak|metric|ranking|stack|roadmap|carousel|gallery|accordion|carousel|grid|table)\b/i },
];

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "into", "your", "our",
  "make", "please", "component", "react", "tailwind", "code", "file", "tsx",
  "koro", "kore", "ekta", "emon", "vabe", "vhabe", "bhao", "bhai", "ami",
  "amar", "tumi", "use", "using", "add", "update", "change", "keep", "existing",
  "without", "while", "more", "very", "better", "good", "nice", "also", "want",
]);

function countMatches(text: string, regex: RegExp): number {
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

export function extractPromptKeywords(prompt: string): string[] {
  const tokens = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !STOP_WORDS.has(t));
  return Array.from(new Set(tokens)).slice(0, 24);
}

/**
 * Classifies the user's intent and makes a smart, selective ("maje maje")
 * decision on whether to ground the AI in visual preview images & design
 * patterns from registered library components.
 */
export function classifyAiIntent(input: ClassifyIntentInput): IntentClassification {
  const prompt = (input.prompt || "").trim();
  const visualHits = countMatches(prompt, VISUAL_DESIGN_PATTERNS);
  const newCompHits = countMatches(prompt, NEW_COMPONENT_PATTERNS);
  const motionHits = countMatches(prompt, MOTION_PATTERNS);
  const bugfixHits = countMatches(prompt, BUGFIX_PATTERNS);
  const auditHits = countMatches(prompt, AUDIT_PATTERNS);
  const refactorHits = countMatches(prompt, REFACTOR_PATTERNS);
  const demoHits = countMatches(prompt, DEMO_CONTROLS_PATTERNS);
  const isQuestion =
    QUESTION_PATTERNS.test(prompt) &&
    newCompHits === 0 &&
    visualHits <= 1 &&
    bugfixHits === 0 &&
    !prompt.toLowerCase().includes("change") &&
    !prompt.toLowerCase().includes("add");

  // Detect target component categories mentioned in prompt
  const targetCategories: string[] = [];
  for (const hint of CATEGORY_HINTS) {
    if (hint.regex.test(prompt)) {
      targetCategories.push(hint.category);
    }
  }
  if (targetCategories.length === 0 && input.currentCategory) {
    targetCategories.push(input.currentCategory);
  }

  // Determine primary intent
  let primaryIntent: AiIntentType = "visual_design";
  if (input.action === "audit" || (input.action === "autofix" && visualHits === 0)) {
    primaryIntent = "audit_standards";
  } else if (input.hasCompilerError && (bugfixHits > 0 || prompt.length < 80)) {
    primaryIntent = "bugfix";
  } else if (bugfixHits >= 2 && visualHits === 0 && newCompHits === 0) {
    primaryIntent = "bugfix";
  } else if (auditHits >= 2 && visualHits === 0 && newCompHits === 0) {
    primaryIntent = "audit_standards";
  } else if (demoHits >= 2 && visualHits <= 1) {
    primaryIntent = "demo_controls";
  } else if (newCompHits >= 1 && (visualHits >= 1 || targetCategories.length > 0)) {
    primaryIntent = "new_component";
  } else if (motionHits >= 2 && visualHits <= 2) {
    primaryIntent = "motion_polish";
  } else if (visualHits >= 2 || input.role === "designer") {
    primaryIntent = "visual_design";
  } else if (refactorHits >= 2 && visualHits === 0) {
    primaryIntent = "refactor_architecture";
  } else if (isQuestion) {
    primaryIntent = "question";
  } else if (visualHits >= 1 || motionHits >= 1) {
    primaryIntent = "visual_design";
  } else {
    primaryIntent = "refactor_architecture";
  }

  // Confidence score (0..100) that visual design grounding will elevate the result
  let visualConfidence = 0;
  visualConfidence += Math.min(45, visualHits * 16);
  visualConfidence += Math.min(25, newCompHits * 15);
  visualConfidence += Math.min(20, motionHits * 10);
  if (input.role === "designer") visualConfidence += 30;
  if (input.role === "optimizer") visualConfidence += 15;
  if (!input.preserveDesign) visualConfidence += 15;
  if (primaryIntent === "bugfix" || primaryIntent === "audit_standards") {
    visualConfidence -= 35;
  }
  if (primaryIntent === "question") {
    visualConfidence -= 25;
  }
  if (input.hasUserAttachedImages) {
    // User already supplied their own target mockup; only supplement if explicitly pinned or "always"
    visualConfidence -= 20;
  }
  visualConfidence = Math.max(0, Math.min(100, visualConfidence));

  const allowVisualMutations =
    !input.preserveDesign ||
    input.role === "designer" ||
    primaryIntent === "visual_design" ||
    primaryIntent === "new_component" ||
    primaryIntent === "motion_polish";

  // Selective Reference Decision Gate ("auto" = smart occasional grounding)
  const hasPinned = input.pinnedReferenceSlugs.length > 0;
  let shouldUseRegistryReferences = false;
  let referenceDecisionReason = "";

  if (hasPinned) {
    shouldUseRegistryReferences = true;
    referenceDecisionReason = `Using ${input.pinnedReferenceSlugs.length} user-pinned registry reference${input.pinnedReferenceSlugs.length === 1 ? "" : "s"} with visual preview & code tokens.`;
  } else if (input.registryRefMode === "off") {
    shouldUseRegistryReferences = false;
    referenceDecisionReason = "Registry visual references disabled by user preference.";
  } else if (input.registryRefMode === "always") {
    shouldUseRegistryReferences = true;
    referenceDecisionReason = "Always-on Registry Visual Grounding active — retrieving top matching component designs.";
  } else {
    // SMART SELECTIVE ("auto") MODE — uses registry references selectively when visual/design craft benefits
    const isSurgicalNonVisual =
      primaryIntent === "bugfix" ||
      primaryIntent === "audit_standards" ||
      primaryIntent === "question" ||
      (primaryIntent === "refactor_architecture" && input.preserveDesign && visualHits === 0);

    if (isSurgicalNonVisual) {
      shouldUseRegistryReferences = false;
      referenceDecisionReason =
        primaryIntent === "bugfix"
          ? "Skipped registry visuals to keep bugfix 100% surgical on existing code."
          : primaryIntent === "audit_standards"
          ? "Skipped registry visuals to preserve existing design during standards audit."
          : "Skipped registry visuals for focused architectural/logic request.";
    } else if (visualConfidence >= 32 || primaryIntent === "new_component" || input.role === "designer") {
      shouldUseRegistryReferences = true;
      referenceDecisionReason =
        input.role === "designer"
          ? "UI Designer persona active — pulling matching registry preview images for visual craft alignment."
          : primaryIntent === "new_component"
          ? "New component synthesis detected — grounding layout & polish in matching registry designs."
          : primaryIntent === "motion_polish"
          ? "Motion choreography task — referencing registry spring & interaction patterns."
          : "Visual design intent detected — selectively pulling matching registry preview images as aesthetic inspiration.";
    } else {
      shouldUseRegistryReferences = false;
      referenceDecisionReason =
        "Staying focused on active workspace code without pulling external visual references.";
    }
  }

  return {
    primaryIntent,
    shouldUseRegistryReferences,
    referenceDecisionReason,
    visualConfidence,
    targetCategories,
    keywords: extractPromptKeywords(prompt),
    allowVisualMutations,
  };
}
