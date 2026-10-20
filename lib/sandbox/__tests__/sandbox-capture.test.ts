import { describe, it, expect } from "bun:test";
import { compileSandboxHtml } from "../sandbox-compiler";

describe("Live Canvas Snapshot Capture Protocol (compileSandboxHtml)", () => {
  const sampleComponent = `
    import React from "react";
    export default function TestComponent() {
      return <div className="p-4 text-white">Hello World</div>;
    }
  `;
  const sampleDemo = `
    import React from "react";
    import TestComponent from "./component";
    export default function Demo() {
      return <TestComponent />;
    }
  `;

  it("should compile sandbox HTML cleanly without errors", () => {
    const result = compileSandboxHtml(
      sampleComponent,
      sampleDemo,
      "",
      ["react", "react-dom"]
    );

    expect(result.error).toBeNull();
    expect(result.html).toBeTruthy();
    expect(result.html).toContain("<!DOCTYPE html>");
  });

  it("should include CAPTURE_PREVIEW message listener in compiled script", () => {
    const result = compileSandboxHtml(
      sampleComponent,
      sampleDemo,
      "",
      []
    );

    expect(result.error).toBeNull();
    expect(result.html).toContain('event.data.type === "CAPTURE_PREVIEW"');
    expect(result.html).toContain("captureLivePreview(event.data.componentId)");
  });

  it("should include PREVIEW_CAPTURED parent notification in capture handler", () => {
    const result = compileSandboxHtml(
      sampleComponent,
      sampleDemo,
      "",
      []
    );

    expect(result.error).toBeNull();
    expect(result.html).toContain('type: "PREVIEW_CAPTURED"');
    expect(result.html).toContain("componentId: componentId");
    expect(result.html).toContain("dataUrl: finalDataUrl");
  });

  it("should include canvas capture check and foreignObject SVG capture logic", () => {
    const result = compileSandboxHtml(
      sampleComponent,
      sampleDemo,
      "",
      []
    );

    expect(result.error).toBeNull();
    // Check for canvas detection and toDataURL
    expect(result.html).toContain("innerCanvas.toDataURL");
    // Check for SVG foreignObject DOM capture
    expect(result.html).toContain("<foreignObject");
    expect(result.html).toContain("http://www.w3.org/2000/svg");
    expect(result.html).toContain("XMLSerializer().serializeToString");
    // Check for offscreen canvas / image or SVG fallback logic
    expect(result.html).toContain("captureLivePreview");
    expect(result.html).toContain("new Image()");
    expect(result.html).toContain("document.createElement(\"canvas\")");
    expect(result.html).toContain("500");
  });

  it("should maintain capture protocol when using different themes and background configs", () => {
    const lightResult = compileSandboxHtml(
      sampleComponent,
      sampleDemo,
      ".test { color: red; }",
      [],
      "light",
      "light"
    );

    expect(lightResult.error).toBeNull();
    expect(lightResult.html).toContain('event.data.type === "CAPTURE_PREVIEW"');
    expect(lightResult.html).toContain("captureLivePreview");

    const darkResult = compileSandboxHtml(
      sampleComponent,
      sampleDemo,
      "",
      [],
      "mesh",
      "dark"
    );

    expect(darkResult.error).toBeNull();
    expect(darkResult.html).toContain('event.data.type === "CAPTURE_PREVIEW"');
    expect(darkResult.html).toContain("captureLivePreview");
  });
});
