import assert from "node:assert/strict";
import { test } from "node:test";
const { zoneHit } = await import("./splitDrop.ts");

test("snap targeting recognizes all four pane edges", () => {
  const panes = [["tab", { x: 0, y: 0, width: 800, height: 600 }]];
  assert.equal(zoneHit(panes, 80, 300, null)?.side, "left");
  assert.equal(zoneHit(panes, 720, 300, null)?.side, "right");
  assert.equal(zoneHit(panes, 400, 80, null)?.side, "top");
  assert.equal(zoneHit(panes, 400, 520, null)?.side, "bottom");
});
