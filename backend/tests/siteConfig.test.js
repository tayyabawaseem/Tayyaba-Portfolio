import test from "node:test";
import assert from "node:assert/strict";
import {
  defaultAnimations,
  defaultNavigationItems,
  defaultNavigationSettings,
  validateAnimation,
  validateAnimations,
  validateNavigationAppearance,
  validateNavigationItem,
  validateNavigationItems
} from "../utils/siteConfig.js";

test("navigation defaults satisfy the stored configuration contract", () => {
  assert.deepEqual(validateNavigationItems(defaultNavigationItems), {
    data: defaultNavigationItems
  });
  assert.deepEqual(validateNavigationAppearance(defaultNavigationSettings().appearance), {
    data: defaultNavigationSettings().appearance
  });
});

test("navigation validates safe link types and rejects duplicate links", () => {
  assert.equal(validateNavigationItem({
    label: "External",
    url: "javascript:alert(1)",
    type: "external"
  }).error, "External links must use a valid HTTP(S) URL.");

  const duplicate = [
    { id: "first", label: "About", url: "#about", type: "anchor" },
    { id: "second", label: "About me", url: "#about", type: "anchor" }
  ];
  assert.match(validateNavigationItems(duplicate).error, /cannot duplicate a link/);
});

test("navigation enforces dropdown parents, acyclic hierarchy, and depth", () => {
  const validTree = [
    { id: "menu", label: "More", type: "dropdown", url: "" },
    { id: "child", label: "Profile", type: "anchor", url: "#profile", parentId: "menu" }
  ];
  assert.equal(validateNavigationItems(validTree).error, undefined);

  const cycle = [
    { id: "first", label: "First", type: "dropdown", url: "", parentId: "second" },
    { id: "second", label: "Second", type: "dropdown", url: "", parentId: "first" }
  ];
  assert.match(validateNavigationItems(cycle).error, /parent cycles/);

  const tooDeep = [
    { id: "one", label: "One", type: "dropdown", url: "" },
    { id: "two", label: "Two", type: "dropdown", url: "", parentId: "one" },
    { id: "three", label: "Three", type: "dropdown", url: "", parentId: "two" },
    { id: "four", label: "Four", type: "anchor", url: "#four", parentId: "three" }
  ];
  assert.match(validateNavigationItems(tooDeep).error, /cannot exceed three levels/);
});

test("animation defaults validate and enabled targets remain unique", () => {
  assert.deepEqual(validateAnimations(defaultAnimations), { data: defaultAnimations });

  const duplicateTarget = [
    ...defaultAnimations,
    {
      ...defaultAnimations[0],
      id: "another-hero",
      name: "Another hero animation"
    }
  ];
  assert.match(validateAnimations(duplicateTarget).error, /Only one enabled animation/);
});

test("animation inputs reject unsupported values and accept bounded settings", () => {
  assert.match(validateAnimation({
    name: "Unsafe",
    target: "hero",
    effect: "typing",
    duration: 1
  }).error, /effect is unsupported/);

  const valid = validateAnimation({
    name: "Contact reveal",
    target: "contact",
    effect: "fade-up",
    duration: 0.8,
    delay: 0.1,
    speed: 1.2,
    easing: "easeOut",
    iterations: 2,
    direction: "alternate",
    trigger: "scroll",
    threshold: 0.35,
    enabled: true,
    custom: { distance: 30, staggerDelay: 0.1 }
  });
  assert.equal(valid.error, undefined);
  assert.equal(valid.data.threshold, 0.35);
});
