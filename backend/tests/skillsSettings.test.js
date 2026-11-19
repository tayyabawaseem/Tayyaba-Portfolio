import test from "node:test";
import assert from "node:assert/strict";
import { createSettingsUpdateFields, validateSection } from "../controllers/portfolioController.js";

test("validates independently persisted skill categories and scroller controls", () => {
  const settings = {
    categories: [
      { name: "Frontend", enabled: true, order: 0 },
      { name: "Other Technologies", enabled: false, order: 1 }
    ],
    scroller: { visible: true, pauseOnHover: true, speed: 42, direction: "left", iconSize: 24, spacing: 34 }
  };
  assert.deepEqual(validateSection("settings", { skills: settings }), { data: { skills: settings } });
});

test("rejects duplicate category names and invalid scroller bounds", () => {
  assert.match(validateSection("settings", { skills: { categories: [
    { name: "Tools", enabled: true, order: 0 }, { name: "tools", enabled: true, order: 1 }
  ] } }).error, /unique/);
  assert.match(validateSection("settings", { skills: { scroller: { speed: 500 } } }).error, /invalid value/);
});

test("accepts partial skill settings so unrelated portfolio settings stay untouched", () => {
  assert.deepEqual(validateSection("settings", { skills: { scroller: { direction: "right" } } }), {
    data: { skills: { scroller: { direction: "right" } } }
  });
  assert.deepEqual(createSettingsUpdateFields({ skills: { scroller: { direction: "right" } } }), {
    "data.settings.skills.scroller.direction": "right"
  });
});
