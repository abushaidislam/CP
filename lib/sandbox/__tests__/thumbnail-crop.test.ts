import { describe, expect, it } from "bun:test";
import {
  computeDefaultCropRect,
  computeDraggedCropRect,
  computeOutputDimensions,
  isPointInsideCropRect,
  mapDisplayCropToNatural,
  moveCropRect,
} from "../thumbnail-crop";

describe("thumbnail-crop geometry helpers", () => {
  it("computes a centered 4:3 default crop inside wider bounds", () => {
    const rect = computeDefaultCropRect(1000, 600, "4:3");
    expect(rect.height).toBe(600);
    expect(rect.width).toBe(800);
    expect(rect.left).toBe(100);
    expect(rect.top).toBe(0);
  });

  it("computes a centered 16:9 default crop inside taller bounds", () => {
    const rect = computeDefaultCropRect(800, 600, "16:9");
    expect(rect.width).toBe(800);
    expect(rect.height).toBeCloseTo(450, 5);
    expect(rect.left).toBe(0);
    expect(rect.top).toBeCloseTo(75, 5);
  });

  it("clamps dragged crop rects within bounds while preserving locked aspect ratio", () => {
    const rect = computeDraggedCropRect(
      { x: 300, y: 200 },
      { x: 950, y: 700 },
      500,
      400,
      "4:3"
    );
    expect(rect.left).toBe(300);
    expect(rect.top).toBe(200);
    expect(rect.width).toBeLessThanOrEqual(200);
    expect(rect.height).toBeLessThanOrEqual(200);
    expect(rect.width / rect.height).toBeCloseTo(4 / 3, 5);
  });

  it("moves crop rects without overflowing image edges", () => {
    const moved = moveCropRect(
      { left: 100, top: 50, width: 200, height: 150 },
      500,
      -100,
      400,
      300
    );
    expect(moved).toEqual({ left: 200, top: 0, width: 200, height: 150 });
  });

  it("detects whether a pointer coordinate falls inside the selection", () => {
    const rect = { left: 50, top: 40, width: 120, height: 90 };
    expect(isPointInsideCropRect({ x: 100, y: 80 }, rect)).toBe(true);
    expect(isPointInsideCropRect({ x: 10, y: 80 }, rect)).toBe(false);
  });

  it("maps display coordinates to natural pixels and guards zero dimensions", () => {
    expect(mapDisplayCropToNatural({ left: 0, top: 0, width: 100, height: 100 }, 0, 100, 800, 600)).toBeNull();

    const mapped = mapDisplayCropToNatural(
      { left: 50, top: 25, width: 200, height: 150 },
      400,
      300,
      1200,
      900
    );
    expect(mapped).toEqual({ left: 150, top: 75, width: 600, height: 450 });
  });

  it("computes aspect-preserving PNG export dimensions without stretching", () => {
    expect(computeOutputDimensions(1200, 900)).toEqual({ width: 800, height: 600 });
    expect(computeOutputDimensions(1600, 400)).toEqual({ width: 800, height: 200 });
    expect(computeOutputDimensions(400, 1200)).toEqual({ width: 200, height: 600 });
    expect(computeOutputDimensions(200, 150)).toEqual({ width: 400, height: 300 });
  });
});
