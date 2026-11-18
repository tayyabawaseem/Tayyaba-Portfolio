import { isSafeActionUrl, normalizeWebUrl } from "./validation.js";

const iconNames = new Set([
  "", "home", "info", "sparkles", "briefcase", "code", "mail", "globe", "external-link"
]);
const navigationTypes = new Set(["internal", "external", "anchor", "custom", "dropdown"]);
const navigationTargets = new Set(["same", "new"]);
const navigationPositions = new Set(["sticky", "fixed", "static"]);
const alignments = new Set(["left", "center", "right", "space-between"]);
const shadows = new Set(["none", "soft", "medium", "strong"]);
const layouts = new Set(["horizontal", "centered", "compact", "stacked", "hamburger", "hidden"]);
const dropdownAnimations = new Set(["none", "fade", "slide"]);
const fonts = new Set([
  "Inter", "Poppins", "Roboto", "Montserrat", "Plus Jakarta Sans", "DM Sans",
  "Manrope", "Outfit", "Source Sans 3", "Open Sans", "Lato", "Nunito Sans",
  "system-ui"
]);
const colorPattern = /^#[\da-f]{3}(?:[\da-f]{3})?(?:[\da-f]{2})?$/i;

const navigationColorDefaults = {
  dark: {
    background: "#080a12",
    text: "#eeedf4",
    active: "#a78bfa",
    hover: "#ffffff",
    focus: "#65c8ff",
    border: "#363344"
  },
  light: {
    background: "#f5f6fb",
    text: "#434455",
    active: "#7152df",
    hover: "#1d1c2a",
    focus: "#2376a5",
    border: "#dedee8"
  }
};

export const defaultNavigationAppearance = {
  logoVisible: true,
  logoWidth: 31,
  logoHeight: 31,
  navbarHeight: 76,
  navbarWidth: 1440,
  position: "sticky",
  fontFamily: "Inter",
  fontSize: 11,
  fontWeight: 500,
  spacing: 24,
  alignment: "space-between",
  paddingX: 64,
  borderWidth: 1,
  borderRadius: 8,
  shadow: "soft",
  desktopLayout: "horizontal",
  tabletLayout: "compact",
  mobileLayout: "hamburger",
  mobileMenuBehavior: "dropdown",
  dropdownAnimation: "fade",
  transitionDuration: 0.2,
  colors: navigationColorDefaults
};

export const defaultNavigationItems = [
  { id: "system-home", label: "Home", url: "#home", type: "anchor", icon: "home", order: 0, enabled: true, target: "same", parentId: null, isCta: false, system: true },
  { id: "system-about", label: "About", url: "#about", type: "anchor", icon: "info", order: 1, enabled: true, target: "same", parentId: null, isCta: false, system: true },
  { id: "system-skills", label: "Skills", url: "#skills", type: "anchor", icon: "sparkles", order: 2, enabled: true, target: "same", parentId: null, isCta: false, system: true },
  { id: "system-experience", label: "Experience", url: "#experience", type: "anchor", icon: "briefcase", order: 3, enabled: true, target: "same", parentId: null, isCta: false, system: true },
  { id: "system-projects", label: "Projects", url: "#projects", type: "anchor", icon: "code", order: 4, enabled: true, target: "same", parentId: null, isCta: false, system: true },
  { id: "system-services", label: "Services", url: "#services", type: "anchor", icon: "sparkles", order: 5, enabled: true, target: "same", parentId: null, isCta: false, system: true },
  { id: "system-education", label: "Education", url: "#education", type: "anchor", icon: "info", order: 6, enabled: true, target: "same", parentId: null, isCta: false, system: true },
  { id: "system-certifications", label: "Certifications", url: "#certifications", type: "anchor", icon: "briefcase", order: 7, enabled: true, target: "same", parentId: null, isCta: false, system: true },
  { id: "system-testimonials", label: "Testimonials", url: "#testimonials", type: "anchor", icon: "info", order: 8, enabled: true, target: "same", parentId: null, isCta: false, system: true },
  { id: "system-contact", label: "Contact", url: "#contact", type: "anchor", icon: "mail", order: 9, enabled: true, target: "same", parentId: null, isCta: true, system: true }
];

export const defaultNavigationSettings = () => ({
  showBrand: true,
  showLinks: true,
  showContact: true,
  sticky: true,
  items: structuredClone(defaultNavigationItems),
  appearance: structuredClone(defaultNavigationAppearance)
});

export const defaultAnimations = [
  {
    id: "default-hero-reveal",
    name: "Hero reveal",
    target: "hero",
    effect: "fade-up",
    duration: 0.7,
    delay: 0.05,
    speed: 1,
    easing: "easeOut",
    iterations: 1,
    direction: "normal",
    trigger: "load",
    threshold: 0.15,
    enabled: true,
    custom: { distance: 24, scale: 0.94, rotation: 8, staggerDelay: 0.08 }
  },
  {
    id: "default-section-headings",
    name: "Section headings",
    target: "headings",
    effect: "fade-up",
    duration: 0.55,
    delay: 0,
    speed: 1,
    easing: "easeOut",
    iterations: 1,
    direction: "normal",
    trigger: "scroll",
    threshold: 0.2,
    enabled: true,
    custom: { distance: 18, scale: 0.94, rotation: 8, staggerDelay: 0.08 }
  },
  {
    id: "default-project-cards",
    name: "Project cards",
    target: "project-cards",
    effect: "staggered-reveal",
    duration: 0.6,
    delay: 0,
    speed: 1,
    easing: "easeOut",
    iterations: 1,
    direction: "normal",
    trigger: "scroll",
    threshold: 0.15,
    enabled: true,
    custom: { distance: 20, scale: 0.94, rotation: 8, staggerDelay: 0.08 }
  }
];

const navigationItemFields = new Set([
  "id", "label", "url", "type", "icon", "order", "enabled", "target",
  "parentId", "isCta", "system"
]);

export const validateNavigationItem = (input, { stored = false } = {}) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { error: "Navigation item must be an object." };
  }
  if (Object.keys(input).some((key) => !navigationItemFields.has(key))) {
    return { error: "Navigation item contains an unsupported field." };
  }
  const { label, type, url = "", icon = "", order = 0, enabled = true, target = "same", parentId = null, isCta = false } = input;
  if (stored && (typeof input.id !== "string" || !/^[\w-]{1,80}$/.test(input.id))) {
    return { error: "Navigation item ID is invalid." };
  }
  if (!stored && Object.hasOwn(input, "id")) {
    return { error: "Navigation item ID is managed by the server." };
  }
  if (typeof label !== "string" || !label.trim() || label.trim().length > 80) {
    return { error: "Navigation label is required and must be 80 characters or fewer." };
  }
  if (!navigationTypes.has(type)) return { error: "Navigation item type is unsupported." };
  if (typeof url !== "string" || url.length > 500) return { error: "Navigation URL must be 500 characters or fewer." };
  if (type === "dropdown" && url.trim()) return { error: "Dropdown items cannot have a URL." };
  if (type !== "dropdown" && !url.trim()) return { error: "Navigation URL is required." };
  if (type === "internal") {
    let internalOrigin = "";
    try {
      internalOrigin = new URL(url, "https://portfolio.invalid").origin;
    } catch {
      return { error: "Internal links must use a same-site path beginning with a single slash." };
    }
    if (!url.startsWith("/") || url.startsWith("//") || internalOrigin !== "https://portfolio.invalid") {
      return { error: "Internal links must use a same-site path beginning with a single slash." };
    }
  }
  if (type === "external" && !normalizeWebUrl(url)) return { error: "External links must use a valid HTTP(S) URL." };
  if (type === "anchor" && !/^#[A-Za-z][\w-]{0,79}$/.test(url)) return { error: "Section anchors must use a valid #section-id." };
  if (type === "custom" && !isSafeActionUrl(url, { allowAnchor: true, allowMailto: true, allowTel: true })) {
    return { error: "Custom links must be safe HTTP(S), anchor, email, or phone URLs." };
  }
  if (typeof icon !== "string" || !iconNames.has(icon)) return { error: "Navigation icon is not supported." };
  if (!Number.isInteger(order) || order < 0 || order > 9999) return { error: "Navigation order must be an integer from 0 to 9999." };
  if (typeof enabled !== "boolean" || typeof isCta !== "boolean") return { error: "Navigation visibility and CTA flags must be boolean." };
  if (!navigationTargets.has(target)) return { error: "Navigation target must be same or new." };
  if (parentId !== null && (typeof parentId !== "string" || !/^[\w-]{1,80}$/.test(parentId))) {
    return { error: "Navigation parent ID is invalid." };
  }
  if (type === "dropdown" && isCta) return { error: "Dropdown items cannot be CTA buttons." };
  const system = stored ? input.system === true : false;
  if (stored && Object.hasOwn(input, "system") && typeof input.system !== "boolean") {
    return { error: "Navigation system flag must be boolean." };
  }
  return {
    data: {
      ...(stored ? { id: input.id, system } : {}),
      label: label.trim(),
      url: type === "external" ? normalizeWebUrl(url) : url.trim(),
      type,
      icon,
      order,
      enabled,
      target,
      parentId,
      isCta
    }
  };
};

export const validateNavigationItems = (input, { stored = true } = {}) => {
  if (!Array.isArray(input) || input.length > 100) return { error: "Navigation items must be a list of up to 100 items." };
  const items = [];
  for (const item of input) {
    const validated = validateNavigationItem(item, { stored });
    if (validated.error) return validated;
    items.push(validated.data);
  }
  const ids = new Set(items.map((item) => item.id).filter(Boolean));
  if (ids.size !== items.length) return { error: "Navigation item IDs must be unique." };
  const uniqueLinks = new Set();
  for (const item of items) {
    const duplicateKey = `${item.parentId || "root"}:${item.type === "dropdown" ? item.label.toLowerCase() : item.url.toLowerCase()}`;
    if (uniqueLinks.has(duplicateKey)) return { error: "Navigation items cannot duplicate a link under the same menu." };
    uniqueLinks.add(duplicateKey);
    if (item.parentId) {
      const parent = items.find((candidate) => candidate.id === item.parentId);
      if (!parent || parent.type !== "dropdown") return { error: "Navigation parents must reference an existing dropdown item." };
    }
  }
  const byId = new Map(items.map((item) => [item.id, item]));
  for (const item of items) {
    const visited = new Set([item.id]);
    let parentId = item.parentId;
    let depth = 1;
    while (parentId) {
      if (visited.has(parentId)) return { error: "Navigation items cannot contain parent cycles." };
      visited.add(parentId);
      const parent = byId.get(parentId);
      parentId = parent?.parentId;
      depth += 1;
      if (depth > 3) return { error: "Navigation dropdowns cannot exceed three levels." };
    }
  }
  return { data: items };
};

const navigationAppearanceFields = {
  logoVisible: "boolean",
  logoWidth: [20, 280],
  logoHeight: [20, 120],
  navbarHeight: [40, 180],
  navbarWidth: [320, 1920],
  position: navigationPositions,
  fontFamily: fonts,
  fontSize: [8, 24],
  fontWeight: [300, 800],
  spacing: [0, 80],
  alignment: alignments,
  paddingX: [0, 120],
  borderWidth: [0, 5],
  borderRadius: [0, 32],
  shadow: shadows,
  desktopLayout: layouts,
  tabletLayout: layouts,
  mobileLayout: layouts,
  mobileMenuBehavior: new Set(["dropdown", "overlay"]),
  dropdownAnimation: dropdownAnimations,
  transitionDuration: [0, 1.5]
};
const navigationPaletteFields = new Set(["background", "text", "active", "hover", "focus", "border"]);

export const validateNavigationAppearance = (input) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { error: "Navigation appearance must be an object." };
  const result = {};
  for (const [key, value] of Object.entries(input)) {
    if (key === "colors") {
      if (!value || typeof value !== "object" || Array.isArray(value)) return { error: "Navigation colors must be an object." };
      const colors = {};
      for (const [theme, palette] of Object.entries(value)) {
        if (!["dark", "light"].includes(theme) || !palette || typeof palette !== "object" || Array.isArray(palette)) {
          return { error: "Navigation colors must contain dark or light palettes." };
        }
        colors[theme] = {};
        for (const [colorName, color] of Object.entries(palette)) {
          if (!navigationPaletteFields.has(colorName) || typeof color !== "string" || !colorPattern.test(color)) {
            return { error: `Navigation ${theme} ${colorName} color is invalid.` };
          }
          colors[theme][colorName] = color;
        }
      }
      result.colors = colors;
      continue;
    }
    const rule = navigationAppearanceFields[key];
    if (!rule) return { error: `Unsupported navigation appearance setting: ${key}.` };
    if (rule === "boolean") {
      if (typeof value !== "boolean") return { error: `${key} must be true or false.` };
    } else if (rule instanceof Set) {
      if (!rule.has(value)) return { error: `${key} has an unsupported value.` };
    } else if (typeof rule === "object") {
      if (typeof value !== "number" || !Number.isFinite(value) || value < rule[0] || value > rule[1]) {
        return { error: `${key} must be between ${rule[0]} and ${rule[1]}.` };
      }
    }
    result[key] = value;
  }
  return { data: result };
};

export const validateNavigationSettings = (input) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { error: "Navigation settings must be an object." };
  const result = {};
  for (const [key, value] of Object.entries(input)) {
    if (["showBrand", "showLinks", "showContact", "sticky"].includes(key)) {
      if (typeof value !== "boolean") return { error: `${key} must be true or false.` };
      result[key] = value;
    } else if (key === "items") {
      const validated = validateNavigationItems(value, { stored: true });
      if (validated.error) return validated;
      result.items = validated.data;
    } else if (key === "appearance") {
      const validated = validateNavigationAppearance(value);
      if (validated.error) return validated;
      result.appearance = validated.data;
    } else {
      return { error: `Unsupported navigation setting: ${key}.` };
    }
  }
  return { data: result };
};

export const animationTargets = [
  "navbar", "hero", "headings", "text", "buttons-links", "images", "project-cards",
  "service-cards", "about", "skills", "experience", "projects", "services",
  "education", "certifications", "testimonials", "contact", "footer"
];
export const animationEffects = [
  "fade-in", "fade-up", "fade-down", "fade-left", "fade-right", "slide-in",
  "zoom-in", "zoom-out", "scale", "rotate", "bounce", "float", "pulse",
  "staggered-reveal"
];
const animationTriggers = new Set(["load", "scroll", "hover", "click"]);
const animationDirections = new Set(["normal", "reverse", "alternate", "alternate-reverse"]);
const animationEasings = new Set(["linear", "easeIn", "easeOut", "easeInOut"]);
const animationFields = new Set([
  "id", "name", "target", "effect", "duration", "delay", "speed", "easing",
  "iterations", "direction", "trigger", "threshold", "enabled", "custom"
]);
const customAnimationFields = new Set(["distance", "scale", "rotation", "staggerDelay"]);

export const validateAnimation = (input, { stored = false } = {}) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { error: "Animation must be an object." };
  if (Object.keys(input).some((key) => !animationFields.has(key))) return { error: "Animation contains an unsupported field." };
  if (stored && (typeof input.id !== "string" || !/^[\w-]{1,80}$/.test(input.id))) return { error: "Animation ID is invalid." };
  if (!stored && Object.hasOwn(input, "id")) return { error: "Animation ID is managed by the server." };
  const {
    name, target, effect, duration, delay = 0, speed = 1, easing = "easeOut",
    iterations = 1, direction = "normal", trigger = "scroll", threshold = 0.2,
    enabled = true, custom = {}
  } = input;
  if (typeof name !== "string" || !name.trim() || name.trim().length > 80) return { error: "Animation name is required and must be 80 characters or fewer." };
  if (!animationTargets.includes(target)) return { error: "Animation target is unsupported." };
  if (!animationEffects.includes(effect)) return { error: "Animation effect is unsupported." };
  if (typeof duration !== "number" || !Number.isFinite(duration) || duration < 0.1 || duration > 10) return { error: "Animation duration must be between 0.1 and 10 seconds." };
  if (typeof delay !== "number" || !Number.isFinite(delay) || delay < 0 || delay > 5) return { error: "Animation delay must be between 0 and 5 seconds." };
  if (typeof speed !== "number" || !Number.isFinite(speed) || speed < 0.25 || speed > 4) return { error: "Animation speed must be between 0.25 and 4." };
  if (!animationEasings.has(easing)) return { error: "Animation easing is unsupported." };
  if (!Number.isInteger(iterations) || iterations < 1 || iterations > 20) return { error: "Animation iterations must be an integer from 1 to 20." };
  if (!animationDirections.has(direction)) return { error: "Animation direction is unsupported." };
  if (!animationTriggers.has(trigger)) return { error: "Animation trigger is unsupported." };
  if (typeof threshold !== "number" || !Number.isFinite(threshold) || threshold < 0 || threshold > 1) return { error: "Animation threshold must be between 0 and 1." };
  if (typeof enabled !== "boolean") return { error: "Animation enabled status must be boolean." };
  if (!custom || typeof custom !== "object" || Array.isArray(custom) ||
    Object.keys(custom).some((key) => !customAnimationFields.has(key))) {
    return { error: "Animation custom configuration contains unsupported fields." };
  }
  const customLimits = { distance: [0, 400], scale: [0.2, 2], rotation: [-360, 360], staggerDelay: [0, 1] };
  const validatedCustom = {};
  for (const [key, value] of Object.entries(custom)) {
    const [minimum, maximum] = customLimits[key];
    if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
      return { error: `Animation custom ${key} must be between ${minimum} and ${maximum}.` };
    }
    validatedCustom[key] = value;
  }
  return {
    data: {
      ...(stored ? { id: input.id } : {}),
      name: name.trim(),
      target,
      effect,
      duration,
      delay,
      speed,
      easing,
      iterations,
      direction,
      trigger,
      threshold,
      enabled,
      custom: validatedCustom
    }
  };
};

export const validateAnimations = (input, { stored = true } = {}) => {
  if (!Array.isArray(input) || input.length > 80) return { error: "Animations must be a list of up to 80 configurations." };
  const animations = [];
  for (const animation of input) {
    const validated = validateAnimation(animation, { stored });
    if (validated.error) return validated;
    animations.push(validated.data);
  }
  const ids = new Set(animations.map((animation) => animation.id).filter(Boolean));
  if (ids.size !== animations.length) return { error: "Animation IDs must be unique." };
  const enabledTargets = new Set();
  for (const animation of animations) {
    if (!animation.enabled) continue;
    if (enabledTargets.has(animation.target)) return { error: `Only one enabled animation may target ${animation.target}.` };
    enabledTargets.add(animation.target);
  }
  return { data: animations };
};
