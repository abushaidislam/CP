export type StudioPhase =
  | "idle"
  | "previewing"
  | "countdown"
  | "capturing-moves"
  | "rendering-replay"
  | "recording"
  | "processing"
  | "review"
  | "error";

export interface ReplayEventItem {
  t: number;
  kind: "move" | "down" | "up" | "scroll";
  nx: number;
  ny: number;
  scrollY: number;
}

export interface DiscoveredTargetsInfo {
  interactiveCount: number;
  scrollableDistance: number;
  hasCanvas: boolean;
}

export function formatTimecode(ms: number): string {
  const safe = Math.max(0, ms);
  const totalSec = Math.floor(safe / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  const centis = Math.floor((safe % 1000) / 10);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(centis).padStart(2, "0")}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function slugifyFilename(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "component"
  );
}
