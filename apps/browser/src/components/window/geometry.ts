import { layout } from "../ui/theme";
import type { SplitNested, SplitSlot, SplitView } from "../../state/browser/types";

export type Rect = { x: number; y: number; width: number; height: number };

const PANE_GAP = layout.cardInset;
const MIN_PANE = 220;

export type Divider = { path: number[]; index: number; rect: Rect; vertical: boolean; total: number };

type SplitGeometry = { panes: Record<string, Rect>; dividers: Divider[] };

function cut(total: number, sizes: number[], gap: number): { start: number; size: number }[] {
  const free = Math.max(0, total - gap * (sizes.length - 1));
  let at = 0;
  let used = 0;
  return sizes.map((f, i) => {
    const size = i === sizes.length - 1 ? free - used : Math.round(free * f);
    const out = { start: at, size };
    at += size + gap;
    used += size;
    return out;
  });
}

export function splitGeometry(split: SplitView, width: number, height: number, gap = PANE_GAP): SplitGeometry {
  const panes: Record<string, Rect> = {};
  const dividers: Divider[] = [];
  const nested = (slot: SplitSlot, parent: SplitView["orientation"]): SplitNested | null => {
    if ("split" in slot) return slot.split;
    if ("stack" in slot) return { orientation: parent === "horizontal" ? "vertical" : "horizontal", slots: slot.stack.map((tabId, i) => ({ tabId, size: slot.stackSizes[i]! })) };
    return null;
  };
  const visit = (orientation: SplitView["orientation"], slots: SplitSlot[], rect: Rect, path: number[]) => {
    const horizontal = orientation === "horizontal";
    const main = cut(horizontal ? rect.width : rect.height, slots.map((slot) => slot.size), gap);
    slots.forEach((slot, i) => {
      const { start, size } = main[i]!;
      const childRect = horizontal ? { x: rect.x + start, y: rect.y, width: size, height: rect.height } : { x: rect.x, y: rect.y + start, width: rect.width, height: size };
      const child = nested(slot, orientation);
      if ("tabId" in slot) panes[slot.tabId] = childRect;
      else if (child) visit(child.orientation, child.slots, childRect, [...path, i]);
      if (i < slots.length - 1) {
        dividers.push({
          path,
          index: i,
          vertical: horizontal,
          total: horizontal ? rect.width : rect.height,
          rect: horizontal ? { x: childRect.x + childRect.width, y: rect.y, width: gap, height: rect.height } : { x: rect.x, y: childRect.y + childRect.height, width: rect.width, height: gap },
        });
      }
    });
  };
  visit(split.orientation, split.slots, { x: 0, y: 0, width, height }, []);
  return { panes, dividers };
}

export function resize(sizes: number[], a: number, delta: number, total: number, gap = PANE_GAP): number[] {
  const free = Math.max(1, total - gap * (sizes.length - 1));
  const px = sizes.map((f) => f * free);
  const pair = px[a]! + px[a + 1]!;
  const min = Math.min(MIN_PANE, px[a]!, px[a + 1]!);
  const left = Math.min(Math.max(px[a]! + delta, min), pair - min);
  const next = [...px];
  next[a] = left;
  next[a + 1] = pair - left;
  return next.map((p) => p / free);
}

export type ToolbarGeometry = {
  sidebarButton: number | null;
  back: number;
  forward: number;
  reload: number;
  urlLeft: number;
};

const geometries = new Map<string, ToolbarGeometry>();

export function toolbarGeometry(o: { sidebarButton: boolean }): ToolbarGeometry {
  const key = `${o.sidebarButton}`;
  let g = geometries.get(key);
  if (!g) geometries.set(key, (g = computeToolbarGeometry(o)));
  return g;
}

function computeToolbarGeometry(o: { sidebarButton: boolean }): ToolbarGeometry {
  const [c0, c1, c2, c3] = layout.toolbarIconCenters;
  if (o.sidebarButton) return { sidebarButton: c0, back: c1, forward: c2, reload: c3, urlLeft: layout.breadcrumbX - 8 };
  const shift = c1 - c0;
  return { sidebarButton: null, back: c1 - shift, forward: c2 - shift, reload: c3 - shift, urlLeft: layout.breadcrumbX - 8 - shift };
}

export const NO_TOOLBAR: ToolbarGeometry = { sidebarButton: null, back: 21, forward: 21, reload: 21, urlLeft: 8 };
