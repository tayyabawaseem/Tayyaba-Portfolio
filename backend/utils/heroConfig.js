import { normalizeWebUrl } from "./validation.js";

const colorPattern = /^#(?:[\da-f]{3}|[\da-f]{6}|[\da-f]{8})$/i;
const ringNamePattern = /^[a-z][a-z0-9-]{0,31}$/;
const animationNames = new Set([
  "entrance", "heading", "description", "portrait", "rings", "orbit",
  "particles", "badges", "cursor", "buttons"
]);
const animationStyles = new Set(["fade", "fade-up", "fade-down", "slide", "zoom", "float", "pulse", "none"]);
const fixedHeroActionKeys = new Set([
  "github", "linkedin", "resume", "instagram", "facebook",
  "download-resume", "primary-cta", "secondary-cta"
]);

const isRecord = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const within = (value, minimum, maximum, integer = false) =>
  typeof value === "number" && Number.isFinite(value) &&
  value >= minimum && value <= maximum && (!integer || Number.isInteger(value));
const hasOnlyKeys = (value, keys) => Object.keys(value).every((key) => keys.includes(key));
const isColor = (value) => typeof value === "string" && colorPattern.test(value);
const isSecureIconUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) return true;
  const normalized = normalizeWebUrl(value);
  return Boolean(normalized && normalized.startsWith("https://"));
};

function validateRecord(value, name, keys) {
  if (!isRecord(value) || !hasOnlyKeys(value, keys)) {
    return `${name} contains unsupported or invalid settings.`;
  }
  return "";
}

function validateTitleList(value) {
  if (!Array.isArray(value) || value.length > 40) return "Hero titles must be a list of up to 40 entries.";
  const ids = new Set();
  for (const title of value) {
    if (!isRecord(title) || !hasOnlyKeys(title, [
      "id", "label", "enabled", "order", "color", "gradientStart", "gradientEnd", "pauseMs"
    ]) || typeof title.id !== "string" || !/^[\w-]{1,64}$/.test(title.id) ||
      typeof title.label !== "string" || !title.label.trim() || title.label.trim().length > 120 ||
      typeof title.enabled !== "boolean" || !within(title.order, 0, 999, true) ||
      (title.color !== undefined && title.color !== "" && !isColor(title.color)) ||
      (title.gradientStart !== undefined && title.gradientStart !== "" && !isColor(title.gradientStart)) ||
      (title.gradientEnd !== undefined && title.gradientEnd !== "" && !isColor(title.gradientEnd)) ||
      (title.pauseMs !== undefined && !within(title.pauseMs, 0, 10000, true))) {
      return "Each Hero title must include a valid label, ID, enabled state, and order.";
    }
    if (ids.has(title.id)) return "Hero title IDs must be unique.";
    ids.add(title.id);
  }
  return "";
}

function validateBadgeAppearance(value) {
  const keys = [
    "backgroundColor", "textColor", "iconColor", "borderColor", "glowColor",
    "hoverColor", "width", "height", "paddingX", "paddingY", "borderRadius",
    "borderWidth", "iconSize", "fontSize", "fontFamily", "fontWeight",
    "letterSpacing", "textAlign", "hoverAnimation"
  ];
  const invalid = validateRecord(value, "badge appearance", keys);
  if (invalid) return invalid;
  if (["backgroundColor", "textColor", "iconColor", "borderColor", "glowColor", "hoverColor"]
    .some((key) => key in value && !isColor(value[key])) ||
    ("width" in value && !within(value.width, 40, 300, true)) ||
    ("height" in value && !within(value.height, 20, 100, true)) ||
    ("paddingX" in value && !within(value.paddingX, 0, 40, true)) ||
    ("paddingY" in value && !within(value.paddingY, 0, 24, true)) ||
    ("borderRadius" in value && !within(value.borderRadius, 0, 999, true)) ||
    ("borderWidth" in value && !within(value.borderWidth, 0, 10)) ||
    ("iconSize" in value && !within(value.iconSize, 8, 48, true)) ||
    ("fontSize" in value && !within(value.fontSize, 8, 32, true)) ||
    ("fontFamily" in value && (typeof value.fontFamily !== "string" || !/^[\w\s,"'-]{1,100}$/.test(value.fontFamily))) ||
    ("fontWeight" in value && !within(value.fontWeight, 100, 900, true)) ||
    ("letterSpacing" in value && !within(value.letterSpacing, -2, 8)) ||
    ("textAlign" in value && !["left", "center"].includes(value.textAlign)) ||
    ("hoverAnimation" in value && !["none", "glow", "scale"].includes(value.hoverAnimation))) {
    return "Badge appearance settings contain invalid values.";
  }
  return "";
}

function validateBadgeList(value) {
  if (!Array.isArray(value) || value.length > 40) return "Orbit badges must be a list of up to 40 entries.";
  const ids = new Set();
  for (const badge of value) {
    if (!isRecord(badge) || !hasOnlyKeys(badge, [
      "id", "label", "icon", "customIcon", "category", "description", "orbit",
      "order", "enabled", "angle", "radius", "tabletRadius", "mobileRadius",
      "durationMs", "delayMs", "direction", "animationEnabled", "color", "glow",
      "appearance", "position", "offsetX", "offsetY"
    ]) || typeof badge.id !== "string" || !/^[\w-]{1,64}$/.test(badge.id) ||
      typeof badge.label !== "string" || !badge.label.trim() || badge.label.trim().length > 60 ||
      (badge.icon !== undefined && (typeof badge.icon !== "string" || badge.icon.length > 24)) ||
      (badge.customIcon !== undefined && (typeof badge.customIcon !== "string" ||
        badge.customIcon.length > 2048 || !isSecureIconUrl(badge.customIcon))) ||
      (badge.category !== undefined && (typeof badge.category !== "string" || badge.category.length > 80)) ||
      (badge.description !== undefined && (typeof badge.description !== "string" || badge.description.length > 500)) ||
      typeof badge.orbit !== "string" || !ringNamePattern.test(badge.orbit) || !within(badge.order, 0, 999, true) ||
      typeof badge.enabled !== "boolean" || !within(badge.angle, -360, 360) ||
      (badge.radius !== undefined && !within(badge.radius, 65, 100)) ||
      (badge.tabletRadius !== undefined && !within(badge.tabletRadius, 65, 100)) ||
      (badge.mobileRadius !== undefined && !within(badge.mobileRadius, 65, 100)) ||
      (badge.durationMs !== undefined && !within(badge.durationMs, 1000, 120000, true)) ||
      (badge.delayMs !== undefined && !within(badge.delayMs, 0, 60000, true)) ||
      (badge.direction !== undefined && !["clockwise", "counterclockwise"].includes(badge.direction)) ||
      (badge.animationEnabled !== undefined && typeof badge.animationEnabled !== "boolean") ||
      (badge.position !== undefined && !["top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left"].includes(badge.position)) ||
      (badge.offsetX !== undefined && !within(badge.offsetX, -200, 200, true)) ||
      (badge.offsetY !== undefined && !within(badge.offsetY, -200, 200, true)) ||
      (badge.color !== undefined && badge.color !== "" && !isColor(badge.color)) ||
      (badge.glow !== undefined && !within(badge.glow, 0, 100)) ||
      (badge.appearance !== undefined && validateBadgeAppearance(badge.appearance))) {
      return "Each orbit badge must include a valid label, orbit, angle, enabled state, and order.";
    }
    if (ids.has(badge.id)) return "Orbit badge IDs must be unique.";
    ids.add(badge.id);
  }
  return "";
}

function validateContentLayout(value) {
  const invalid = validateRecord(value, "contentLayout", ["desktop", "tablet", "mobile"]);
  if (invalid) return invalid;

  const numericFields = {
    nameMarginBottom: [0, 2000, true],
    nameFontSize: [8, 120, true],
    nameLineHeight: [0.7, 3, false],
    nameOffsetX: [-300, 300, true],
    nameOffsetY: [-300, 300, true],
    nameDesignationGap: [0, 2000, true],
    designationMarginTop: [0, 2000, true],
    designationMarginBottom: [0, 2000, true],
    designationFontSize: [8, 140, true],
    designationLineHeight: [0.7, 3, false],
    designationHeight: [16, 320, true],
    designationDescriptionGap: [0, 2000, true],
    descriptionMarginTop: [0, 2000, true],
    descriptionMarginBottom: [0, 2000, true],
    descriptionFontSize: [8, 48, true],
    descriptionLineHeight: [0.8, 3, false],
    descriptionLetterSpacing: [-5, 20, false],
    descriptionMaxWidth: [120, 1200, true],
    descriptionActionsGap: [0, 2000, true],
    contentGap: [0, 2000, true],
    containerWidth: [180, 1400, true],
    containerOffsetX: [-600, 600, true],
    containerOffsetY: [-600, 600, true]
  };
  const alignmentFields = ["designationTextAlign", "descriptionTextAlign"];
  const elementFields = {
    heroContent: ["margin", "padding", "width", "height", "alignment"],
    name: ["margin", "padding", "width", "height", "alignment"],
    designation: ["margin", "padding", "width", "height", "alignment"],
    description: ["margin", "padding", "width", "height", "alignment"],
    buttons: ["margin", "padding", "width", "height", "gap", "alignment"],
    socialIcons: [
      "margin", "padding", "width", "height", "iconSize", "horizontalGap",
      "verticalGap", "iconPadding", "borderRadius", "hoverSpacing", "alignment",
      "hoverEffect"
    ],
    orbit: ["margin", "padding", "diameter"],
    profileImage: ["margin", "padding", "diameter"],
    container: ["margin", "padding", "width", "height", "gap", "alignment"]
  };
  const elementNumericFields = {
    width: [0, 2000, true],
    height: [0, 2000, true],
    diameter: [0, 2000, true],
    gap: [0, 2000, true],
    horizontalGap: [0, 2000, true],
    verticalGap: [0, 2000, true],
    iconSize: [0, 256, true],
    iconPadding: [0, 256, true],
    borderRadius: [0, 999, true],
    hoverSpacing: [0, 200, true]
  };
  const alignmentValues = {
    heroContent: ["left", "center", "right"],
    name: ["left", "center", "right"],
    designation: ["left", "center", "right"],
    description: ["left", "center", "right", "justify"],
    buttons: ["left", "center", "right", "space-between"],
    socialIcons: ["left", "center", "right", "space-between"],
    orbit: ["left", "center", "right"],
    profileImage: ["left", "center", "right"],
    container: ["start", "center", "end", "stretch"]
  };
  const validateBoxSides = (sides, name) => {
    if (sides === null) return "";
    if (!isRecord(sides) || !hasOnlyKeys(sides, ["top", "right", "bottom", "left"])) {
      return `${name} must contain only top, right, bottom, and left values.`;
    }
    for (const [side, amount] of Object.entries(sides)) {
      if (amount !== null && !within(amount, 0, 2000, true)) {
        return `${name}.${side} must be a non-negative pixel value no greater than 2000.`;
      }
    }
    return "";
  };
  const validateElements = (elements) => {
    const invalidElements = validateRecord(elements, "contentLayout.elements", Object.keys(elementFields));
    if (invalidElements) return invalidElements;
    for (const [element, settings] of Object.entries(elements)) {
      if (settings === null) continue;
      const invalidSettings = validateRecord(settings, `${element} layout`, elementFields[element]);
      if (invalidSettings) return invalidSettings;
      for (const boxModel of ["margin", "padding"]) {
        if (boxModel in settings) {
          const invalidSides = validateBoxSides(settings[boxModel], `${element}.${boxModel}`);
          if (invalidSides) return invalidSides;
        }
      }
      for (const [field, [minimum, maximum, integer]] of Object.entries(elementNumericFields)) {
        if (field in settings && settings[field] !== null &&
          !within(settings[field], minimum, maximum, integer)) {
          return `${element}.${field} must be between ${minimum} and ${maximum}.`;
        }
      }
      if ("alignment" in settings && settings.alignment !== null &&
        !alignmentValues[element].includes(settings.alignment)) {
        return `${element}.alignment is unsupported.`;
      }
      if ("hoverEffect" in settings && settings.hoverEffect !== null &&
        !["default", "none", "lift", "glow"].includes(settings.hoverEffect)) {
        return "socialIcons.hoverEffect is unsupported.";
      }
    }
    return "";
  };

  for (const [device, layout] of Object.entries(value)) {
    if (!["desktop", "tablet", "mobile"].includes(device) ||
      !isRecord(layout) ||
      !hasOnlyKeys(layout, [...Object.keys(numericFields), ...alignmentFields, "elements"])) {
      return "Responsive Hero content layout contains unsupported settings.";
    }
    for (const [field, [minimum, maximum, integer]] of Object.entries(numericFields)) {
      if (field in layout && layout[field] !== null &&
        !within(layout[field], minimum, maximum, integer)) {
        return `Hero content layout setting ${field} is invalid for ${device}.`;
      }
    }
    for (const field of alignmentFields) {
      if (field in layout && layout[field] !== null &&
        !["left", "center", "right"].includes(layout[field])) {
        return `Hero content layout setting ${field} is invalid for ${device}.`;
      }
    }
    if ("elements" in layout && layout.elements !== null) {
      const invalidElements = validateElements(layout.elements);
      if (invalidElements) return invalidElements;
    }
  }
  return "";
}

function validateTyping(value) {
  const keys = [
    "enabled", "typingSpeedMs", "deletingSpeedMs", "pauseAfterTypingMs",
    "pauseBeforeNextMs", "caretEnabled", "style", "loop", "textColor",
    "gradientStart", "gradientEnd", "reducedMotion"
  ];
  const invalid = validateRecord(value, "typing", keys);
  if (invalid) return invalid;
  if (("enabled" in value && typeof value.enabled !== "boolean") ||
    ("typingSpeedMs" in value && !within(value.typingSpeedMs, 10, 1000, true)) ||
    ("deletingSpeedMs" in value && !within(value.deletingSpeedMs, 10, 1000, true)) ||
    ("pauseAfterTypingMs" in value && !within(value.pauseAfterTypingMs, 0, 10000, true)) ||
    ("pauseBeforeNextMs" in value && !within(value.pauseBeforeNextMs, 0, 10000, true)) ||
    ("caretEnabled" in value && typeof value.caretEnabled !== "boolean") ||
    ("style" in value && !["type-delete", "type-only"].includes(value.style)) ||
    ("loop" in value && typeof value.loop !== "boolean") ||
    ["textColor", "gradientStart", "gradientEnd"].some((key) => key in value && !isColor(value[key])) ||
    ("reducedMotion" in value && !["static-first", "static-designation", "hide"].includes(value.reducedMotion))) {
    return "Typing settings contain invalid values.";
  }
  return "";
}

function validateOrbit(value) {
  const keys = [
    "enabled", "rings", "particleCount", "particleSpeed", "badgeSize", "badgeRadius",
    "badgeBackground", "badgeBorderColor", "badgeGlow", "animationEnabled",
    "pauseOnHover", "particleEnabled", "particleSize", "particleColor",
    "particleOpacity", "particleGlow", "particleDirection", "badgeTextColor",
    "badgeIconColor", "badgeHoverColor"
  ];
  const invalid = validateRecord(value, "orbit", keys);
  if (invalid) return invalid;
  if (("enabled" in value && typeof value.enabled !== "boolean") ||
    ("animationEnabled" in value && typeof value.animationEnabled !== "boolean") ||
    ("pauseOnHover" in value && typeof value.pauseOnHover !== "boolean") ||
    ("particleEnabled" in value && typeof value.particleEnabled !== "boolean") ||
    ("particleCount" in value && !within(value.particleCount, 0, 12, true)) ||
    ("particleSpeed" in value && !within(value.particleSpeed, 0.1, 5)) ||
    ("particleSize" in value && !within(value.particleSize, 1, 20, true)) ||
    ("particleOpacity" in value && !within(value.particleOpacity, 0, 100)) ||
    ("particleGlow" in value && !within(value.particleGlow, 0, 100)) ||
    ("particleDirection" in value && !["clockwise", "counterclockwise"].includes(value.particleDirection)) ||
    ("badgeSize" in value && !within(value.badgeSize, 8, 24)) ||
    ("badgeRadius" in value && !within(value.badgeRadius, 0, 999)) ||
    ["badgeBackground", "badgeBorderColor", "badgeTextColor", "badgeIconColor", "badgeHoverColor", "particleColor"]
      .some((key) => key in value && !isColor(value[key])) ||
    ("badgeGlow" in value && !within(value.badgeGlow, 0, 100))) {
    return "Orbit settings contain invalid values.";
  }
  if ("rings" in value) {
    if (!Array.isArray(value.rings) || value.rings.length > 10) return "Orbit rings must contain at most ten entries.";
    const names = new Set();
    for (const ring of value.rings) {
      if (!isRecord(ring) || !hasOnlyKeys(ring, [
        "name", "enabled", "size", "durationMs", "direction", "lineThickness",
        "color", "glow", "opacity", "order", "rotationEnabled", "tabletSize", "mobileSize"
      ]) || typeof ring.name !== "string" || !ringNamePattern.test(ring.name) || names.has(ring.name) ||
        typeof ring.enabled !== "boolean" || !within(ring.size, 50, 100) ||
        !within(ring.durationMs, 6000, 60000, true) ||
        !["clockwise", "counterclockwise"].includes(ring.direction) ||
        !within(ring.lineThickness, 0, 5) || !isColor(ring.color) ||
        !within(ring.glow, 0, 100) ||
        (ring.opacity !== undefined && !within(ring.opacity, 0, 100)) ||
        (ring.order !== undefined && !within(ring.order, 0, 999, true)) ||
        (ring.rotationEnabled !== undefined && typeof ring.rotationEnabled !== "boolean") ||
        (ring.tabletSize !== undefined && !within(ring.tabletSize, 50, 100)) ||
        (ring.mobileSize !== undefined && !within(ring.mobileSize, 50, 100))) {
        return "Each orbit ring must include a valid size, speed, direction, and appearance.";
      }
      names.add(ring.name);
    }
  }
  return "";
}

function validateCursor(value) {
  const keys = [
    "enabled", "dotSize", "followerSize", "color", "followerBorderColor",
    "glow", "followerSpeedMs", "hoverScale", "animationEnabled"
  ];
  const invalid = validateRecord(value, "cursor", keys);
  if (invalid) return invalid;
  if (("enabled" in value && typeof value.enabled !== "boolean") ||
    ("dotSize" in value && !within(value.dotSize, 2, 20)) ||
    ("followerSize" in value && !within(value.followerSize, 12, 100)) ||
    ["color", "followerBorderColor"].some((key) => key in value && !isColor(value[key])) ||
    ("glow" in value && !within(value.glow, 0, 100)) ||
    ("followerSpeedMs" in value && !within(value.followerSpeedMs, 20, 1000, true)) ||
    ("hoverScale" in value && !within(value.hoverScale, 1, 2)) ||
    ("animationEnabled" in value && typeof value.animationEnabled !== "boolean")) {
    return "Cursor settings contain invalid values.";
  }
  return "";
}

function validateAppearance(value) {
  const keys = [
    "alignment", "textWidth", "profileSize", "sectionHeight", "columnGap",
    "contentGap", "background", "gridVisible", "accentColor", "gradientStart", "gradientEnd"
  ];
  const invalid = validateRecord(value, "appearance", keys);
  if (invalid) return invalid;
  if (("alignment" in value && !["left", "center"].includes(value.alignment)) ||
    ("textWidth" in value && !within(value.textWidth, 30, 70)) ||
    ("profileSize" in value && !within(value.profileSize, 180, 520, true)) ||
    ("sectionHeight" in value && !within(value.sectionHeight, 320, 1000, true)) ||
    ("columnGap" in value && !within(value.columnGap, 0, 180, true)) ||
    ("contentGap" in value && !within(value.contentGap, 0, 100, true)) ||
    ("background" in value && !["theme", "gradient", "transparent"].includes(value.background)) ||
    ("gridVisible" in value && typeof value.gridVisible !== "boolean") ||
    ["accentColor", "gradientStart", "gradientEnd"].some((key) => key in value && !isColor(value[key]))) {
    return "Hero appearance settings contain invalid values.";
  }
  return "";
}

function validateImage(value) {
  const keys = [
    "objectPositionX", "objectPositionY", "size", "borderWidth", "borderColor",
    "glow", "background"
  ];
  const invalid = validateRecord(value, "image", keys);
  if (invalid) return invalid;
  if (("objectPositionX" in value && !within(value.objectPositionX, 0, 100)) ||
    ("objectPositionY" in value && !within(value.objectPositionY, 0, 100)) ||
    ("size" in value && !within(value.size, 180, 520, true)) ||
    ("borderWidth" in value && !within(value.borderWidth, 0, 20)) ||
    ["borderColor", "background"].some((key) => key in value && !isColor(value[key])) ||
    ("glow" in value && !within(value.glow, 0, 100))) {
    return "Profile image settings contain invalid values.";
  }
  return "";
}

function validateAnimations(value) {
  if (!isRecord(value) || Object.keys(value).some((key) => !animationNames.has(key))) {
    return "Hero animations contain unsupported targets.";
  }
  for (const [name, animation] of Object.entries(value)) {
    if (!isRecord(animation) || !hasOnlyKeys(animation, ["enabled", "durationMs", "delayMs", "style"]) ||
      typeof animation.enabled !== "boolean" ||
      !within(animation.durationMs, 0, 10000, true) ||
      !within(animation.delayMs, 0, 10000, true) ||
      !animationStyles.has(animation.style)) {
      return `Hero animation settings for ${name} are invalid.`;
    }
  }
  return "";
}

function validateContent(value) {
  const keys = ["showName", "showAvailability", "showSocials", "showViewResume", "showDownloadResume", "viewResumeLabel", "downloadResumeLabel", "socialVisibility"];
  const invalid = validateRecord(value, "content", keys);
  if (invalid) return invalid;
  for (const key of ["showName", "showAvailability", "showSocials", "showViewResume", "showDownloadResume"]) {
    if (key in value && typeof value[key] !== "boolean") return `Hero content setting ${key} must be true or false.`;
  }
  for (const key of ["viewResumeLabel", "downloadResumeLabel"]) {
    if (key in value && (typeof value[key] !== "string" || value[key].trim().length > 80)) {
      return `Hero content setting ${key} must be text with at most 80 characters.`;
    }
  }
  if ("socialVisibility" in value) {
    if (!isRecord(value.socialVisibility) ||
      Object.entries(value.socialVisibility).some(([key, enabled]) =>
        !["linkedin", "github", "instagram", "facebook", "other"].includes(key) ||
        typeof enabled !== "boolean"
      )) {
      return "Hero social visibility settings are invalid.";
    }
  }
  return "";
}

function validateActionOrder(value) {
  if (!Array.isArray(value) || value.length > 40) {
    return "Hero action order must be a list of up to 40 entries.";
  }
  const seen = new Set();
  for (const key of value) {
    if (typeof key !== "string" ||
      (!fixedHeroActionKeys.has(key) && !/^other:[\w-]{1,64}$/.test(key))) {
      return "Hero action order contains an unsupported item.";
    }
    if (seen.has(key)) return "Hero action order items must be unique.";
    seen.add(key);
  }
  return "";
}

export function validateHeroConfig(value) {
  const keys = ["titles", "typing", "badges", "orbit", "cursor", "appearance", "image", "animations", "content", "contentLayout", "actionOrder"];
  const invalid = validateRecord(value, "heroConfig", keys);
  if (invalid) return { error: invalid };

  const validators = [
    ["titles", validateTitleList],
    ["typing", validateTyping],
    ["badges", validateBadgeList],
    ["orbit", validateOrbit],
    ["cursor", validateCursor],
    ["appearance", validateAppearance],
    ["image", validateImage],
    ["animations", validateAnimations],
    ["content", validateContent],
    ["contentLayout", validateContentLayout],
    ["actionOrder", validateActionOrder]
  ];
  for (const [key, validate] of validators) {
    if (key in value) {
      const error = validate(value[key]);
      if (error) return { error };
    }
  }
  if (Array.isArray(value.badges) && Array.isArray(value.orbit?.rings)) {
    const ringNames = new Set(value.orbit.rings.map((ring) => ring.name));
    if (value.badges.some((badge) => !ringNames.has(badge.orbit))) {
      return { error: "Every technology badge must be assigned to an existing orbit ring." };
    }
  }
  const data = Object.fromEntries(Object.entries(value).map(([key, setting]) => {
    if (key === "titles") {
      return [key, setting.map((item) => ({
        ...item,
        id: item.id.trim(),
        label: item.label.trim()
      }))];
    }
    if (key === "badges") {
      return [key, setting.map((item) => ({
        ...item,
        id: item.id.trim(),
        label: item.label.trim(),
        icon: item.icon?.trim() || "",
        ...(item.customIcon !== undefined ? { customIcon: normalizeWebUrl(item.customIcon) || "" } : {}),
        ...(item.category !== undefined ? { category: item.category.trim() } : {}),
        ...(item.description !== undefined ? { description: item.description.trim() } : {})
      }))];
    }
    if (key === "content") {
      return [key, {
        ...setting,
        ...(setting.viewResumeLabel !== undefined ? { viewResumeLabel: setting.viewResumeLabel.trim() } : {}),
        ...(setting.downloadResumeLabel !== undefined ? { downloadResumeLabel: setting.downloadResumeLabel.trim() } : {})
      }];
    }
    return [key, setting];
  }));
  return { data };
}
