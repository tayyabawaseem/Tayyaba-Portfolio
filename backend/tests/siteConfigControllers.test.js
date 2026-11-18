import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import Portfolio from "../models/Portfolio.js";
import * as navigation from "../controllers/navigationController.js";
import * as animations from "../controllers/animationController.js";

const originalFindOne = Portfolio.findOne;
const originalFindOneAndUpdate = Portfolio.findOneAndUpdate;
let storedRecord;

const response = () => ({
  statusCode: 200,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  }
});

const call = async (handler, req = {}) => {
  const res = response();
  await handler(req, res);
  return res;
};

const setPath = (root, path, value) => {
  const keys = path.split(".");
  let current = root;
  while (keys.length > 1) {
    const key = keys.shift();
    current[key] ||= {};
    current = current[key];
  }
  current[keys[0]] = structuredClone(value);
};

before(() => {
  storedRecord = { key: "primary", data: { settings: {} } };
  Portfolio.findOne = () => ({
    lean: async () => structuredClone(storedRecord)
  });
  Portfolio.findOneAndUpdate = async (_filter, update) => {
    for (const [path, value] of Object.entries(update.$set)) {
      setPath(storedRecord, path, value);
    }
    return structuredClone(storedRecord);
  };
});

after(() => {
  Portfolio.findOne = originalFindOne;
  Portfolio.findOneAndUpdate = originalFindOneAndUpdate;
});

test("navigation CRUD persists items, hierarchy, appearance, and reset", async () => {
  const defaults = await call(navigation.getAdminNavigation);
  assert.equal(defaults.statusCode, 200);
  const home = defaults.body.navigation.items[0];
  const protectedDelete = await call(navigation.deleteNavigationItem, { params: { id: home.id } });
  assert.equal(protectedDelete.statusCode, 409);

  const createdMenu = await call(navigation.createNavigationItem, {
    body: { label: "More", type: "dropdown", url: "", order: 20 }
  });
  assert.equal(createdMenu.statusCode, 201);
  const menuId = createdMenu.body.item.id;

  const createdChild = await call(navigation.createNavigationItem, {
    body: { label: "Profile", type: "internal", url: "/profile", parentId: menuId, order: 0 }
  });
  assert.equal(createdChild.statusCode, 201);
  const childId = createdChild.body.item.id;

  const updatedChild = await call(navigation.updateNavigationItem, {
    params: { id: childId },
    body: { label: "My profile", type: "internal", url: "/profile", parentId: menuId, order: 1, enabled: false }
  });
  assert.equal(updatedChild.statusCode, 200);
  assert.equal(updatedChild.body.item.enabled, false);

  const appearance = await call(navigation.updateNavigationAppearance, {
    body: { colors: { light: { active: "#123abc" } }, mobileLayout: "stacked" }
  });
  assert.equal(appearance.statusCode, 200);
  assert.equal(appearance.body.appearance.colors.light.active, "#123abc");

  const deletedMenu = await call(navigation.deleteNavigationItem, { params: { id: menuId } });
  assert.equal(deletedMenu.statusCode, 200);
  assert.equal(deletedMenu.body.deletedCount, 2);

  const reset = await call(navigation.resetNavigation);
  assert.equal(reset.statusCode, 200);
  assert.equal(reset.body.navigation.items.length, 10);
  assert.equal(reset.body.navigation.appearance.mobileLayout, "hamburger");
});

test("animation CRUD publishes only enabled configurations and restores defaults", async () => {
  const defaults = await call(animations.getAdminAnimations);
  assert.equal(defaults.statusCode, 200);
  const created = await call(animations.createAnimation, {
    body: {
      name: "Contact reveal",
      target: "contact",
      effect: "fade-up",
      duration: 0.8,
      delay: 0,
      speed: 1,
      easing: "easeOut",
      iterations: 1,
      direction: "normal",
      trigger: "scroll",
      threshold: 0.25,
      enabled: true,
      custom: { distance: 24 }
    }
  });
  assert.equal(created.statusCode, 201);
  const id = created.body.animation.id;

  const updated = await call(animations.updateAnimation, {
    params: { id },
    body: {
      name: "Contact pulse",
      target: "contact",
      effect: "pulse",
      duration: 1,
      delay: 0.1,
      speed: 1,
      easing: "easeInOut",
      iterations: 2,
      direction: "alternate",
      trigger: "hover",
      threshold: 0.4,
      enabled: false,
      custom: { scale: 1.08 }
    }
  });
  assert.equal(updated.statusCode, 200);
  assert.equal(updated.body.animation.effect, "pulse");

  const publicRead = await call(animations.getPublicAnimations);
  assert.equal(publicRead.statusCode, 200);
  assert.equal(publicRead.body.animations.some((item) => item.id === id), false);

  const deleted = await call(animations.deleteAnimation, { params: { id } });
  assert.equal(deleted.statusCode, 200);
  const missing = await call(animations.deleteAnimation, { params: { id } });
  assert.equal(missing.statusCode, 404);

  const reset = await call(animations.resetAnimations);
  assert.equal(reset.statusCode, 200);
  assert.deepEqual(reset.body.animations.map((item) => item.id), [
    "default-hero-reveal",
    "default-section-headings",
    "default-project-cards"
  ]);
});
