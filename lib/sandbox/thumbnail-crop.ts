export type CropPoint = {
  x: number;
  y: number;
};

export type CropRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type CropAspectPreset = "4:3" | "16:9" | "1:1" | "free";

export const CROP_ASPECT_RATIOS: Record<Exclude<CropAspectPreset, "free">, number> = {
  "4:3": 4 / 3,
  "16:9": 16 / 9,
  "1:1": 1,
};

export const MIN_CROP_SIZE = 12;
export const MAX_THUMBNAIL_WIDTH = 800;
export const MAX_THUMBNAIL_HEIGHT = 600;

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Computes the largest centered crop rectangle inside the display bounds
 * matching the requested aspect preset.
 */
export function computeDefaultCropRect(
  boundsWidth: number,
  boundsHeight: number,
  preset: CropAspectPreset
): CropRect {
  if (boundsWidth <= 0 || boundsHeight <= 0) {
    return { left: 0, top: 0, width: 0, height: 0 };
  }

  if (preset === "free") {
    return { left: 0, top: 0, width: boundsWidth, height: boundsHeight };
  }

  const ratio = CROP_ASPECT_RATIOS[preset];
  const boundsRatio = boundsWidth / boundsHeight;

  let width: number;
  let height: number;
  if (boundsRatio > ratio) {
    height = boundsHeight;
    width = height * ratio;
  } else {
    width = boundsWidth;
    height = width / ratio;
  }

  return {
    left: (boundsWidth - width) / 2,
    top: (boundsHeight - height) / 2,
    width,
    height,
  };
}

/**
 * Computes a clamped crop rectangle while dragging from `anchor` to `current`.
 * Locks aspect ratio when `preset !== "free"`.
 */
export function computeDraggedCropRect(
  anchor: CropPoint,
  current: CropPoint,
  boundsWidth: number,
  boundsHeight: number,
  preset: CropAspectPreset
): CropRect {
  if (boundsWidth <= 0 || boundsHeight <= 0) {
    return { left: 0, top: 0, width: 0, height: 0 };
  }

  const ax = clamp(anchor.x, 0, boundsWidth);
  const ay = clamp(anchor.y, 0, boundsHeight);
  const cx = clamp(current.x, 0, boundsWidth);
  const cy = clamp(current.y, 0, boundsHeight);

  if (preset === "free") {
    const left = Math.min(ax, cx);
    const top = Math.min(ay, cy);
    return {
      left,
      top,
      width: Math.abs(cx - ax),
      height: Math.abs(cy - ay),
    };
  }

  const ratio = CROP_ASPECT_RATIOS[preset];
  const dx = cx - ax;
  const dy = cy - ay;
  const signX = dx >= 0 ? 1 : -1;
  const signY = dy >= 0 ? 1 : -1;

  const maxW = signX > 0 ? boundsWidth - ax : ax;
  const maxH = signY > 0 ? boundsHeight - ay : ay;

  const desiredW = Math.max(Math.abs(dx), Math.abs(dy) * ratio);
  const width = Math.max(0, Math.min(desiredW, maxW, maxH * ratio));
  const height = width / ratio;

  return {
    left: signX > 0 ? ax : ax - width,
    top: signY > 0 ? ay : ay - height,
    width,
    height,
  };
}

/**
 * Moves an existing crop rectangle within bounds without resizing it.
 */
export function moveCropRect(
  rect: CropRect,
  deltaX: number,
  deltaY: number,
  boundsWidth: number,
  boundsHeight: number
): CropRect {
  const maxLeft = Math.max(0, boundsWidth - rect.width);
  const maxTop = Math.max(0, boundsHeight - rect.height);
  return {
    ...rect,
    left: clamp(rect.left + deltaX, 0, maxLeft),
    top: clamp(rect.top + deltaY, 0, maxTop),
  };
}

export function isPointInsideCropRect(point: CropPoint, rect: CropRect): boolean {
  return (
    point.x >= rect.left &&
    point.x <= rect.left + rect.width &&
    point.y >= rect.top &&
    point.y <= rect.top + rect.height
  );
}

/**
 * Maps a display-space crop rectangle to clamped natural-pixel source coordinates.
 */
export function mapDisplayCropToNatural(
  crop: CropRect,
  displayWidth: number,
  displayHeight: number,
  naturalWidth: number,
  naturalHeight: number
): CropRect | null {
  if (
    displayWidth <= 0 ||
    displayHeight <= 0 ||
    naturalWidth <= 0 ||
    naturalHeight <= 0
  ) {
    return null;
  }

  const scaleX = naturalWidth / displayWidth;
  const scaleY = naturalHeight / displayHeight;

  const left = clamp(Math.round(crop.left * scaleX), 0, naturalWidth - 1);
  const top = clamp(Math.round(crop.top * scaleY), 0, naturalHeight - 1);
  const right = clamp(
    Math.round((crop.left + crop.width) * scaleX),
    left + 1,
    naturalWidth
  );
  const bottom = clamp(
    Math.round((crop.height + crop.top) * scaleY),
    top + 1,
    naturalHeight
  );

  const width = right - left;
  const height = bottom - top;
  if (width <= 0 || height <= 0) return null;

  return { left, top, width, height };
}

/**
 * Computes aspect-preserving PNG export dimensions bounded by maxWidth x maxHeight.
 */
export function computeOutputDimensions(
  sourceWidth: number,
  sourceHeight: number,
  maxWidth = MAX_THUMBNAIL_WIDTH,
  maxHeight = MAX_THUMBNAIL_HEIGHT
): { width: number; height: number } {
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return { width: maxWidth, height: maxHeight };
  }

  const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight, 2);
  return {
    width: Math.max(1, Math.round(sourceWidth * scale)),
    height: Math.max(1, Math.round(sourceHeight * scale)),
  };
}
