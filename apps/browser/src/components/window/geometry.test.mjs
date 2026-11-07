import assert from "node:assert/strict";
import { test } from "node:test";

globalThis.__DEV__ = false;
const { splitGeometry } = await import("./geometry.ts");
const { layout } = await import("../ui/theme.ts");

const split = (ids, sizes, orientation = "horizontal") => ({ id: "s", orientation, slots: ids.map((tabId, i) => ({ size: sizes[i], tabId })) });

test("split panes sit the card's 9 pt apart and fill it to the last point, whatever the width's parity", () => {
  for (const width of [1158, 1159, 1160.5, 801]) {
    const { panes, dividers } = splitGeometry(split(["a", "b"], [0.5, 0.5]), width, 700);
    assert.equal(panes.b.x - (panes.a.x + panes.a.width), layout.cardInset, `${width}: the gap`);
    assert.equal(panes.b.x + panes.b.width, width, `${width}: the right pane ends at the card's edge`);
    assert.equal(dividers[0].rect.width, layout.cardInset);
  }
  const three = splitGeometry(split(["a", "b", "c"], [1 / 3, 1 / 3, 1 / 3]), 1001, 700).panes;
  assert.equal(three.c.x + three.c.width, 1001);
  const four = splitGeometry(split(["a", "b", "c", "d"], [0.25, 0.25, 0.25, 0.25]), 1001, 700).panes;
  assert.equal(four.d.x + four.d.width, 1001);
  const mixed = splitGeometry(
    {
      id: "mixed",
      orientation: "horizontal",
      slots: [
        { size: 0.5, tabId: "a" },
        {
          size: 0.5,
          split: {
            orientation: "vertical",
            slots: [
              { size: 0.5, tabId: "b" },
              { size: 0.5, split: { orientation: "horizontal", slots: [{ size: 0.5, tabId: "c" }, { size: 0.5, tabId: "d" }] } },
            ],
          },
        },
      ],
    },
    1001,
    700,
  ).panes;
  assert.equal(mixed.b.x > mixed.a.x, true);
  assert.equal(mixed.c.y > mixed.b.y, true);
  assert.equal(mixed.d.x > mixed.c.x, true);
  const tall = splitGeometry(split(["a", "b"], [0.5, 0.5], "vertical"), 900, 701).panes;
  assert.equal(tall.b.y + tall.b.height, 701);
});
