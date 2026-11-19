import { describe, it, expect } from "bun:test";
import {
  parseDemoControls,
  bakeSettingsIntoDemoCode,
  scaffoldSettingsDemo,
  isCssColorString,
  formatControlLabel,
  inferNumberRange,
  MAX_DEMO_CONTROLS,
} from "../demo-controls";
import { compileSandboxHtml } from "../sandbox-compiler";

describe("21st.dev Native Demo Controls Parser (parseDemoControls)", () => {
  it("infers booleans, numbers, colors, color arrays, selects, strings, textareas, and string arrays", () => {
    const longText = "A".repeat(140);
    const demoCode = `
import React from "react";
import Hero from "./component";

const settings = {
  title: "Orbital Studio",
  description: "${longText}",
  speed: 0.4,
  particleCount: 1200,
  offset: -4,
  glow: true,
  accentColor: "#7c3aed",
  rgbColor: "rgba(16, 185, 129, 0.8)",
  oklchColor: "oklch(0.72 0.19 250)",
  palette: ["#7c3aed", "#06b6d4", "#ec4899"],
  tags: ["alpha", "beta", "gamma"],
  theme: "dark" as "light" | "dark" | "auto",
  density: 40, // 10..100 step 5
};

export default function Demo(props: Partial<typeof settings>) {
  const s = { ...settings, ...props };
  return <Hero {...s} />;
}
`;

    const parsed = parseDemoControls(demoCode);
    expect(parsed.status).toBe("active");
    expect(parsed.hasSettingsObject).toBe(true);
    expect(parsed.acceptsProps).toBe(true);
    expect(parsed.truncatedCount).toBe(0);

    const byKey = Object.fromEntries(parsed.controls.map((c) => [c.key, c]));

    expect(byKey.title.type).toBe("string");
    expect(byKey.title.defaultValue).toBe("Orbital Studio");

    expect(byKey.description.type).toBe("textarea");
    expect(byKey.description.defaultValue).toBe(longText);

    expect(byKey.speed.type).toBe("number");
    expect(byKey.speed.defaultValue).toBe(0.4);
    expect(byKey.speed.min).toBe(0);
    expect(byKey.speed.max).toBe(1);
    expect(byKey.speed.step).toBe(0.05);

    expect(byKey.particleCount.type).toBe("number");
    expect(byKey.particleCount.defaultValue).toBe(1200);
    expect(byKey.particleCount.max).toBeGreaterThanOrEqual(2400);

    expect(byKey.offset.type).toBe("number");
    expect(byKey.offset.defaultValue).toBe(-4);
    expect(byKey.offset.min).toBeLessThan(0);

    expect(byKey.glow.type).toBe("boolean");
    expect(byKey.glow.defaultValue).toBe(true);

    expect(byKey.accentColor.type).toBe("color");
    expect(byKey.rgbColor.type).toBe("color");
    expect(byKey.oklchColor.type).toBe("color");

    expect(byKey.palette.type).toBe("color-array");
    expect(byKey.palette.defaultValue).toEqual(["#7c3aed", "#06b6d4", "#ec4899"]);

    expect(byKey.tags.type).toBe("string-array");
    expect(byKey.tags.defaultValue).toEqual(["alpha", "beta", "gamma"]);

    expect(byKey.theme.type).toBe("select");
    expect(byKey.theme.options).toEqual(["light", "dark", "auto"]);
    expect(byKey.theme.defaultValue).toBe("dark");

    expect(byKey.density.type).toBe("number");
    expect(byKey.density.min).toBe(10);
    expect(byKey.density.max).toBe(100);
    expect(byKey.density.step).toBe(5);
  });

  it("infers string union select options from component.tsx Props AST when demo has no `as` cast", () => {
    const componentCode = `
import React from "react";
export interface StatusPillProps {
  status?: "healthy" | "degraded" | "critical";
  label?: string;
}
export default function StatusPill({ status = "healthy", label = "Online" }: StatusPillProps) {
  return <div>{status}: {label}</div>;
}
`;
    const demoCode = `
import React from "react";
import StatusPill from "./component";

const settings = {
  status: "healthy",
  label: "All Systems Operational",
};

export default function Demo(props: Partial<typeof settings>) {
  const s = { ...settings, ...props };
  return <StatusPill status={s.status as any} label={s.label} />;
}
`;

    const parsed = parseDemoControls(demoCode, componentCode);
    expect(parsed.status).toBe("active");
    const statusCtrl = parsed.controls.find((c) => c.key === "status");
    expect(statusCtrl?.type).toBe("select");
    expect(statusCtrl?.options).toEqual(["healthy", "degraded", "critical"]);
  });

  it("reports missing-props when settings exist but Demo() does not accept props", () => {
    const demoCode = `
import React from "react";
const settings = {
  label: "Click Me",
  disabled: false,
};
export default function Demo() {
  return <button disabled={settings.disabled}>{settings.label}</button>;
}
`;

    const parsed = parseDemoControls(demoCode);
    expect(parsed.status).toBe("missing-props");
    expect(parsed.hasSettingsObject).toBe(true);
    expect(parsed.acceptsProps).toBe(false);
    expect(parsed.controls.length).toBe(2);
  });

  it("reports no-settings when demo does not declare const settings", () => {
    const demoCode = `
import React from "react";
export default function Demo() {
  return <div>Static Demo</div>;
}
`;

    const parsed = parseDemoControls(demoCode);
    expect(parsed.status).toBe("no-settings");
    expect(parsed.hasSettingsObject).toBe(false);
    expect(parsed.controls.length).toBe(0);
  });

  it("skips reserved keys and exotic expressions per-key without crashing", () => {
    const demoCode = `
import React from "react";
const EXTERNAL = "foo";
const extra = { x: 1 };

const settings = {
  ...extra,
  key: "bad-key",
  ref: "bad-ref",
  constructor: "bad-ctor",
  prototype: "bad-proto",
  __proto__: "bad-dunder",
  dynamicFn: Date.now(),
  externalRef: EXTERNAL,
  templateExpr: \`hello \${EXTERNAL}\`,
  nestedObj: { a: 1 },
  mixedArray: ["ok", 42],
  nullVal: null,
  validLabel: "Works Fine",
  validSpeed: 1.5,
};

export default function Demo(props: Partial<typeof settings>) {
  const s = { ...settings, ...props };
  return <div>{s.validLabel}</div>;
}
`;

    const parsed = parseDemoControls(demoCode);
    expect(parsed.status).toBe("active");
    expect(parsed.controls.map((c) => c.key)).toEqual(["validLabel", "validSpeed"]);
    expect(parsed.skippedKeys.length).toBeGreaterThanOrEqual(10);
  });

  it("caps extracted controls at 24 and reports truncatedCount", () => {
    const entries = Array.from({ length: 30 }, (_, i) => `  prop${i}: ${i + 1},`).join("\n");
    const demoCode = `
import React from "react";
const settings = {
${entries}
};
export default function Demo(props: Partial<typeof settings>) {
  return <div>{props.prop0 ?? settings.prop0}</div>;
}
`;

    const parsed = parseDemoControls(demoCode);
    expect(parsed.controls.length).toBe(MAX_DEMO_CONTROLS);
    expect(parsed.truncatedCount).toBe(6);
  });
});

describe("bakeSettingsIntoDemoCode", () => {
  it("rewrites tuned values directly inside const settings while preserving type assertions", () => {
    const demoCode = `import React from "react";

const settings = {
  title: "Initial",
  speed: 0.4,
  glow: true,
  theme: "dark" as "light" | "dark" | "auto",
  palette: ["#7c3aed", "#06b6d4"],
};

export default function Demo(props: Partial<typeof settings>) {
  const s = { ...settings, ...props };
  return <div>{s.title}</div>;
}
`;

    const baked = bakeSettingsIntoDemoCode(demoCode, {
      title: "Tuned Hero",
      speed: 0.85,
      glow: false,
      theme: "light",
      palette: ["#ff0055", "#00e5ff", "#22c55e"],
    });

    expect(baked).toContain('title: "Tuned Hero"');
    expect(baked).toContain("speed: 0.85");
    expect(baked).toContain("glow: false");
    expect(baked).toContain('theme: "light" as "light" | "dark" | "auto"');
    expect(baked).toContain('palette: ["#ff0055", "#00e5ff", "#22c55e"]');

    const reparsed = parseDemoControls(baked);
    expect(reparsed.defaultValues.title).toBe("Tuned Hero");
    expect(reparsed.defaultValues.speed).toBe(0.85);
    expect(reparsed.defaultValues.glow).toBe(false);
    expect(reparsed.defaultValues.theme).toBe("light");
    expect(reparsed.defaultValues.palette).toEqual(["#ff0055", "#00e5ff", "#22c55e"]);
  });
});

describe("scaffoldSettingsDemo", () => {
  it("generates a compliant 21st.dev settings demo from component.tsx Props AST", () => {
    const componentCode = `
import React from "react";

export interface GlowCardProps {
  title?: string;
  intensity?: number;
  animated?: boolean;
  variant?: "glass" | "solid" | "outline";
  onClick?: () => void;
}

export default function GlowCard({
  title = "Quantum Deck",
  intensity = 0.7,
  animated = true,
  variant = "glass",
}: GlowCardProps) {
  return <div>{title}</div>;
}
`;

    const scaffolded = scaffoldSettingsDemo(componentCode);
    const parsed = parseDemoControls(scaffolded, componentCode);

    expect(parsed.status).toBe("active");
    expect(parsed.acceptsProps).toBe(true);
    expect(parsed.controls.some((c) => c.key === "title" && c.type === "string")).toBe(true);
    expect(parsed.controls.some((c) => c.key === "intensity" && c.type === "number")).toBe(true);
    expect(parsed.controls.some((c) => c.key === "animated" && c.type === "boolean")).toBe(true);
    expect(parsed.controls.some((c) => c.key === "variant" && c.type === "select")).toBe(true);
    // Callback props should not be scaffolded
    expect(parsed.controls.some((c) => c.key === "onClick")).toBe(false);
  });

  it("upgrades an existing settings demo that is missing Demo(props) signature", () => {
    const existingDemo = `import React from "react";
import Widget from "./component";

const settings = {
  count: 5,
};

export default function Demo() {
  return <Widget count={settings.count} />;
}
`;
    const upgraded = scaffoldSettingsDemo(
      `export default function Widget({ count = 5 }: { count?: number }) { return <div>{count}</div>; }`,
      existingDemo
    );

    expect(upgraded).toContain("export default function Demo(props: Partial<typeof settings>)");
    expect(upgraded).toContain("const s = { ...settings, ...props };");
    const parsed = parseDemoControls(upgraded);
    expect(parsed.status).toBe("active");
  });
});

describe("Helper utilities & Sandbox Live Prop Injection", () => {
  it("recognizes CSS colors and formats labels cleanly", () => {
    expect(isCssColorString("#fff")).toBe(true);
    expect(isCssColorString("#7c3aed")).toBe(true);
    expect(isCssColorString("rgb(255, 0, 128)")).toBe(true);
    expect(isCssColorString("hsl(210 100% 50% / 0.5)")).toBe(true);
    expect(isCssColorString("oklch(0.7 0.2 140)")).toBe(true);
    expect(isCssColorString("not-a-color")).toBe(false);

    expect(formatControlLabel("ctaText")).toBe("CTA Text");
    expect(formatControlLabel("particle_count")).toBe("Particle Count");
    expect(formatControlLabel("accentColor")).toBe("Accent Color");

    const smallFloatRange = inferNumberRange(0.5);
    expect(smallFloatRange).toEqual({ min: 0, max: 1, step: 0.05 });
  });

  it("compiles sandbox HTML with zero-reload SET_DEMO_PROPS, RESET_DEMO_PROPS, and SET_FIT_MODE hooks", () => {
    const componentCode = `
import React from "react";
export default function Badge({ label = "Hi" }: { label?: string }) {
  return <span>{label}</span>;
}
`;
    const demoCode = `
import React from "react";
import Badge from "./component";
const settings = { label: "Native" };
export default function Demo(props: Partial<typeof settings>) {
  const s = { ...settings, ...props };
  return <Badge label={s.label} />;
}
`;

    const result = compileSandboxHtml(componentCode, demoCode, "", [], "solid", "dark", {
      initialDemoProps: { label: "Live Tuned" },
      fitMode: "scale",
    });

    expect(result.error).toBeNull();
    expect(result.html).toContain('data-fit-mode="scale"');
    expect(result.html).toContain('[data-fit-hide]');
    expect(result.html).toContain('event.data.type === "SET_DEMO_PROPS"');
    expect(result.html).toContain('event.data.type === "RESET_DEMO_PROPS"');
    expect(result.html).toContain('event.data.type === "SET_FIT_MODE"');
    expect(result.html).toContain("__STUDIO_SET_DEMO_PROPS__");
    expect(result.html).toContain('React.createElement(DemoComponent, demoProps)');
    expect(result.html).toContain('"Live Tuned"');
  });
});
