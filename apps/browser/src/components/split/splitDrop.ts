import type { SplitSide } from "../../state/splits/splits";
import type { Rect } from "../window/geometry";

const STAGES = {
  rest: { width: 0.1324, height: 0.383, inset: 0.025 },
  grown: { width: 0.215, height: 0.611, inset: 0.02 },
  active: { width: 0.241, height: 0.69, inset: 0.02 },
} as const;
export type ZoneStage = keyof typeof STAGES;
const LEAN = 0.43;

export const PREVIEW = { width: 209, height: 110 };

export function zoneRect(pane: Rect, side: SplitSide, stage: ZoneStage, pointerX = 0): Rect {
  const s = STAGES[stage];
  const width = pane.width * (side === "left" || side === "right" ? s.width : s.height);
  const height = pane.height * (side === "top" || side === "bottom" ? s.width : s.height);
  const insetX = pane.width * s.inset;
  const insetY = pane.height * s.inset;
  const x = side === "left" ? pane.x + insetX : side === "right" ? pane.x + pane.width - insetX - width : pane.x + (pane.width - width) / 2;
  const y = side === "top" ? pane.y + insetY : side === "bottom" ? pane.y + pane.height - insetY - height : pane.y + (pane.height - height) / 2;
  if (stage !== "active") return { x, y, width, height };
  const home = zoneRect(pane, side, "grown");
  const centre = home.x + home.width / 2;
  const lean = centre + (pointerX - centre) * LEAN;
  const activeX = side === "left" || side === "right" ? Math.max(pane.x + insetX, Math.min(pane.x + pane.width - insetX - width, lean - width / 2)) : home.x;
  return { x: activeX, y: home.y, width: home.width, height: home.height };
}

const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

export function zoneHit(panes: [string, Rect][], px: number, py: number, current: { tabId: string; side: SplitSide } | null) {
  const card = { x: px - PREVIEW.width / 2, y: py - PREVIEW.height / 2, width: PREVIEW.width, height: PREVIEW.height };
  let best: { tabId: string; side: SplitSide; distance: number } | null = null;
  for (const [tabId, pane] of panes) {
    for (const side of ["left", "right", "top", "bottom"] as const) {
      const keep = current?.tabId === tabId && current.side === side;
      const r = zoneRect(pane, side, keep ? "active" : "grown", px);
      if (!overlaps(card, r)) continue;
      const distance = keep ? -1 : Math.abs(r.x + r.width / 2 - px);
      if (!best || distance < best.distance) best = { tabId, side, distance };
    }
  }
  return best && { tabId: best.tabId, side: best.side };
}
