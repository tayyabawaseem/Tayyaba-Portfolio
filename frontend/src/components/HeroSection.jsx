import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Code2,
  Download
} from "lucide-react";
import { SiteAnimation } from "./SiteAnimation";

const emptyObject = {};
const socialActionKeys = {
  GitHub: "github",
  LinkedIn: "linkedin",
  Instagram: "instagram",
  Facebook: "facebook"
};
const fixedHeroActionOrder = ["github", "linkedin", "resume", "instagram", "facebook"];
const trailingHeroActionOrder = ["download-resume", "primary-cta", "secondary-cta"];
export const defaultHeroActionOrder = [...fixedHeroActionOrder, ...trailingHeroActionOrder];

export function resolveHeroActionOrder(savedOrder, customActionKeys = []) {
  const customKeys = [...new Set(customActionKeys.filter((key) =>
    typeof key === "string" && /^other:[\w-]{1,64}$/.test(key)
  ))];
  const defaultOrder = [
    ...fixedHeroActionOrder,
    ...customKeys,
    ...trailingHeroActionOrder
  ];
  const allowed = new Set(defaultOrder);
  const order = [];
  if (Array.isArray(savedOrder)) {
    for (const key of savedOrder) {
      if (allowed.has(key) && !order.includes(key)) order.push(key);
    }
  }
  for (const key of defaultOrder) {
    if (order.includes(key)) continue;
    const defaultIndex = defaultOrder.indexOf(key);
    const insertionIndex = order.findIndex((existing) => defaultOrder.indexOf(existing) > defaultIndex);
    order.splice(insertionIndex < 0 ? order.length : insertionIndex, 0, key);
  }
  return order;
}

export const defaultOrbitRings = [
  { name: "inner", enabled: true, size: 78, durationMs: 12000, direction: "clockwise", lineThickness: 1, color: "#a78bfa", glow: 34, opacity: 70, order: 0, rotationEnabled: true, tabletSize: 84, mobileSize: 88 },
  { name: "middle", enabled: true, size: 90, durationMs: 18000, direction: "counterclockwise", lineThickness: 1, color: "#a78bfa", glow: 25, opacity: 55, order: 1, rotationEnabled: true, tabletSize: 92, mobileSize: 96 },
  { name: "outer", enabled: true, size: 100, durationMs: 25000, direction: "clockwise", lineThickness: 1, color: "#a78bfa", glow: 18, opacity: 40, order: 2, rotationEnabled: true, tabletSize: 100, mobileSize: 100 }
];
export const defaultOrbitSettings = {
  enabled: true,
  animationEnabled: true,
  pauseOnHover: false,
  rings: defaultOrbitRings,
  badgeSize: 10,
  badgeRadius: 999,
  badgeBackground: "#10111a",
  badgeBorderColor: "#a78bfa",
  badgeTextColor: "#f2f0f7",
  badgeIconColor: "#a78bfa",
  badgeHoverColor: "#a78bfa",
  badgeGlow: 18
};
export function withOrbitRingDefaults(ring, order) {
  return {
    ...(defaultOrbitRings.find((item) => item.name === ring.name) || {}),
    enabled: true,
    rotationEnabled: true,
    opacity: 60,
    order,
    tabletSize: ring.size ?? 90,
    mobileSize: ring.size ?? 94,
    ...ring
  };
}

const animationSetting = (settings, name) => settings?.[name] || {
  enabled: true,
  durationMs: 700,
  delayMs: 0,
  style: name === "rings" ? "none" : "fade-up"
};

function animationClass(settings, name, globallyEnabled) {
  const animation = animationSetting(settings, name);
  if (!globallyEnabled || !animation.enabled || animation.style === "none") return "";
  return `hero-anim-${animation.style}`;
}

function animationStyle(settings, name) {
  const animation = animationSetting(settings, name);
  return {
    "--hero-animation-duration": `${animation.durationMs}ms`,
    "--hero-animation-delay": `${animation.delayMs}ms`
  };
}

const fixedBadgePositions = [
  ["top", -90],
  ["top-right", -45],
  ["right", 0],
  ["bottom-right", 45],
  ["bottom", 90],
  ["bottom-left", 135],
  ["left", 180],
  ["top-left", 225]
];
const extraBadgePositions = [0, 4, 2, 6, 1, 5, 3, 7];
const defaultBadgePosition = (order, count) => fixedBadgePositions[
  count < fixedBadgePositions.length
    ? Math.round(order * fixedBadgePositions.length / Math.max(1, count))
    : order < fixedBadgePositions.length
      ? order
      : extraBadgePositions[(order - fixedBadgePositions.length) % extraBadgePositions.length]
][0];

const contentLayoutProperties = [
  ["nameMarginBottom", "--hero-name-margin-bottom", "px"],
  ["nameFontSize", "--hero-name-font-size", "px"],
  ["nameLineHeight", "--hero-name-line-height", ""],
  ["nameOffsetX", "--hero-name-offset-x", "px"],
  ["nameOffsetY", "--hero-name-offset-y", "px"],
  ["nameDesignationGap", "--hero-name-designation-gap", "px"],
  ["designationMarginTop", "--hero-designation-margin-top", "px"],
  ["designationMarginBottom", "--hero-designation-margin-bottom", "px"],
  ["designationFontSize", "--hero-designation-font-size", "px"],
  ["designationLineHeight", "--hero-designation-line-height", ""],
  ["designationHeight", "--hero-designation-height", "px"],
  ["designationTextAlign", "--hero-designation-text-align", ""],
  ["designationDescriptionGap", "--hero-designation-description-gap", "px"],
  ["descriptionMarginTop", "--hero-description-margin-top", "px"],
  ["descriptionMarginBottom", "--hero-description-margin-bottom", "px"],
  ["descriptionFontSize", "--hero-description-font-size", "px"],
  ["descriptionLineHeight", "--hero-description-line-height", ""],
  ["descriptionLetterSpacing", "--hero-description-letter-spacing", "px"],
  ["descriptionMaxWidth", "--hero-description-max-width", "px"],
  ["descriptionTextAlign", "--hero-description-text-align", ""],
  ["descriptionActionsGap", "--hero-description-actions-gap", "px"],
  ["contentGap", "--hero-content-gap", "px"],
  ["containerWidth", "--hero-content-width", "px"],
  ["containerOffsetX", "--hero-content-offset-x", "px"],
  ["containerOffsetY", "--hero-content-offset-y", "px"]
];

const layoutSides = ["top", "right", "bottom", "left"];
const layoutElementCssName = (name) => name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

function createContentLayoutStyle(layout) {
  const style = Object.fromEntries(contentLayoutProperties.flatMap(([key, property, unit]) => {
    const value = layout?.[key];
    if (value === undefined || value === null || value === "" ||
      (unit !== "" && !Number.isFinite(value))) return [];
    return [[property, `${value}${unit}`]];
  }));
  for (const [element, settings] of Object.entries(layout?.elements || {})) {
    if (!settings || typeof settings !== "object") continue;
    const cssName = layoutElementCssName(element);
    for (const boxModel of ["margin", "padding"]) {
      for (const side of layoutSides) {
        const value = settings[boxModel]?.[side];
        if (Number.isFinite(value)) {
          style[`--hero-layout-${cssName}-${boxModel}-${side}`] = `${value}px`;
        }
      }
    }
    for (const property of [
      "width", "height", "diameter", "gap", "horizontalGap", "verticalGap",
      "iconSize", "iconPadding", "borderRadius", "hoverSpacing"
    ]) {
      if (Number.isFinite(settings[property])) {
        style[`--hero-layout-${cssName}-${property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`] = `${settings[property]}px`;
      }
    }
    if (typeof settings.alignment === "string") {
      const flexAlignment = { left: "flex-start", right: "flex-end" };
      style[`--hero-layout-${cssName}-alignment`] =
        ["buttons", "socialIcons"].includes(element)
          ? flexAlignment[settings.alignment] || settings.alignment
          : settings.alignment;
    }
    if (typeof settings.hoverEffect === "string") {
      style[`--hero-layout-${cssName}-hover-effect`] = settings.hoverEffect;
    }
  }
  const icons = layout?.elements?.socialIcons;
  if (Number.isFinite(icons?.iconSize) || Number.isFinite(icons?.iconPadding)) {
    style["--hero-layout-social-icons-box-size"] =
      `${(icons.iconSize ?? 16) + 2 * (icons.iconPadding ?? 0)}px`;
  }
  const orbit = layout?.elements?.orbit;
  if (orbit) {
    const margin = orbit.margin || {};
    const padding = orbit.padding || {};
    const horizontalAlignment = {
      left: ["0%", "0%"],
      center: ["50%", "-50%"],
      right: ["100%", "-100%"]
    }[orbit.alignment] || ["50%", "-50%"];
    style["--hero-layout-orbit-left"] = horizontalAlignment[0];
    style["--hero-layout-orbit-translate-x"] = horizontalAlignment[1];
    style["--hero-layout-orbit-offset-x"] =
      `${((margin.left ?? 0) - (margin.right ?? 0)) / 2}px`;
    style["--hero-layout-orbit-offset-y"] =
      `${((margin.top ?? 0) - (margin.bottom ?? 0)) / 2}px`;
    style["--hero-layout-orbit-inset"] = `${Math.max(
      (margin.top ?? 0) + (padding.top ?? 0),
      (margin.right ?? 0) + (padding.right ?? 0),
      (margin.bottom ?? 0) + (padding.bottom ?? 0),
      (margin.left ?? 0) + (padding.left ?? 0)
    )}px`;
  }
  const profileImage = layout?.elements?.profileImage;
  if (profileImage?.alignment) {
    const horizontalAlignment = {
      left: ["0%", "0%"],
      center: ["50%", "-50%"],
      right: ["100%", "-100%"]
    }[profileImage.alignment];
    if (horizontalAlignment) {
      style["--hero-layout-profile-image-left"] = horizontalAlignment[0];
      style["--hero-layout-profile-image-translate-x"] = horizontalAlignment[1];
    }
  }
  return style;
}

function getViewportDevice() {
  if (typeof window === "undefined") return "desktop";
  if (window.matchMedia("(max-width: 760px)").matches) return "mobile";
  if (window.matchMedia("(max-width: 1050px)").matches) return "tablet";
  return "desktop";
}

function TypingTitle({ titles, settings, enabled, designation }) {
  const prefersReducedMotion = useReducedMotion();
  const sequenceKey = titles.map((entry) => `${entry.id}:${entry.label}`).join("\u001f");
  const [typingState, setTypingState] = useState({
    sequenceKey: "",
    titleIndex: 0,
    characterCount: 0,
    deleting: false
  });
  const sequenceChanged = typingState.sequenceKey !== sequenceKey;
  const titleIndex = sequenceChanged ? 0 : Math.min(typingState.titleIndex, Math.max(0, titles.length - 1));
  const characterCount = sequenceChanged ? 0 : typingState.characterCount;
  const deleting = sequenceChanged ? false : typingState.deleting;
  const updateTypingState = useCallback((update) => {
    setTypingState((current) => {
      const base = current.sequenceKey === sequenceKey
        ? current
        : { sequenceKey, titleIndex: 0, characterCount: 0, deleting: false };
      return { ...update(base), sequenceKey };
    });
  }, [sequenceKey]);
  const titleEntry = titles[titleIndex] || titles[0];
  const title = titleEntry?.label || "";
  const typingEnabled = settings.enabled !== false && enabled && titles.length > 1;
  const staticBehavior = settings.reducedMotion || "static-first";
  const isStatic = !typingEnabled || prefersReducedMotion;
  const visibleTitle = prefersReducedMotion && staticBehavior === "hide"
    ? ""
    : isStatic
      ? prefersReducedMotion && staticBehavior === "static-designation" ? designation || title : title
      : title.slice(0, characterCount);
  const titleGradient = Boolean(titleEntry?.gradientStart && titleEntry?.gradientEnd);
  const globalGradient = Boolean(settings.gradientStart && settings.gradientEnd);
  const hasGradient = titleGradient || (!titleEntry?.color && globalGradient);
  const solidColor = titleEntry?.color && !titleGradient
    ? titleEntry.color
    : !globalGradient ? settings.textColor : "";
  const titleLines = Math.max(1, Math.ceil(Math.max(...titles.map((entry) => entry.label.length), 0) / 24));
  const titleStyle = {
    ...(solidColor && !hasGradient
      ? { color: solidColor, background: "none", WebkitTextFillColor: solidColor, "--hero-title-color": solidColor }
      : {}),
    ...(titleGradient
      ? { "--hero-title-gradient": `linear-gradient(100deg, ${titleEntry.gradientStart}, ${titleEntry.gradientEnd})` }
      : !titleEntry?.color && globalGradient
        ? { "--hero-title-gradient": `linear-gradient(100deg, ${settings.gradientStart}, ${settings.gradientEnd})` }
        : {}),
    ...(settings.textColor ? { "--hero-title-color": settings.textColor } : {})
  };

  useEffect(() => {
    if (isStatic || !title) return undefined;
    let timer;
    if (!deleting && characterCount < title.length) {
      timer = window.setTimeout(
        () => updateTypingState((current) => ({ ...current, characterCount: current.characterCount + 1 })),
        settings.typingSpeedMs ?? 72
      );
    } else if (!deleting) {
      const pause = titleEntry.pauseMs ?? settings.pauseAfterTypingMs ?? 1150;
      if (settings.loop === false && titleIndex === titles.length - 1) return undefined;
      timer = window.setTimeout(() => {
        if (settings.style === "type-only") {
          updateTypingState((current) => ({
            ...current,
            titleIndex: (current.titleIndex + 1) % titles.length,
            characterCount: 0,
            deleting: false
          }));
        } else {
          updateTypingState((current) => ({ ...current, deleting: true }));
        }
      }, pause + (settings.style === "type-only" ? settings.pauseBeforeNextMs ?? 220 : 0));
    } else if (characterCount > 0) {
      timer = window.setTimeout(
        () => updateTypingState((current) => ({ ...current, characterCount: current.characterCount - 1 })),
        settings.deletingSpeedMs ?? 38
      );
    } else {
      timer = window.setTimeout(() => {
        updateTypingState((current) => ({
          ...current,
          titleIndex: (current.titleIndex + 1) % titles.length,
          deleting: false
        }));
      }, settings.pauseBeforeNextMs ?? 220);
    }
    return () => window.clearTimeout(timer);
  }, [characterCount, deleting, isStatic, settings, title, titleEntry, titleIndex, titles, updateTypingState]);

  if (prefersReducedMotion && staticBehavior === "hide") return null;
  return (
    <SiteAnimation
      as="h1"
      animationTarget="headings"
      className={`hero-title ${animationClass(settings.animations, "heading", enabled)}`}
      style={{ ...animationStyle(settings.animations, "heading"), "--hero-title-min-height": `var(--hero-designation-height, ${titleLines * 1.08}em)`, ...titleStyle }}
      aria-label={titles.map((item) => item.label).join(". ")}
    >
      <span className="hero-typed-title" style={titleStyle} data-solid={Boolean(solidColor && !hasGradient)}>
        {visibleTitle}
        {settings.caretEnabled !== false && typingEnabled && <span className="hero-typing-caret" aria-hidden="true" />}
      </span>
    </SiteAnimation>
  );
}

function OrbitBadges({ badges, settings, animations, motionAllowed, device, hasCustomLayout }) {
  const rings = Array.isArray(settings.rings) ? settings.rings : defaultOrbitRings;
  const activeRings = rings.filter((ring) => ring.enabled !== false).sort((left, right) => left.order - right.order);
  if (settings.enabled === false) return null;

  const badgeGroups = new Map(fixedBadgePositions.map(([position]) => [position, []]));
  badges.forEach((badge, index) => {
    const fallbackPosition = defaultBadgePosition(badge.order ?? index, badges.length);
    const position = badgeGroups.has(badge.position) ? badge.position : fallbackPosition;
    badgeGroups.get(position).push(badge);
  });
  const badgeLayouts = [];
  for (const [position, angle] of fixedBadgePositions) {
    const group = badgeGroups.get(position).sort((left, right) => left.order - right.order);
    const radians = (angle * Math.PI) / 180;
    const radius = device === "mobile" ? 48 : 42;
    const stackStep = group.length === 2 ? 22 : 30;
    group.forEach((badge, index) => {
      const stackOffset = (index - (group.length - 1) / 2) * stackStep;
      badgeLayouts.push({
        badge,
        positionStyle: {
          "--badge-left": `${50 + radius * Math.cos(radians) - stackOffset * Math.sin(radians)}%`,
          "--badge-top": `${50 + radius * Math.sin(radians) + stackOffset * Math.cos(radians)}%`,
          "--badge-offset-x": `${badge.offsetX ?? 0}px`,
          "--badge-offset-y": `${badge.offsetY ?? 0}px`,
          "--badge-offset-x-tablet": `${(badge.offsetX ?? 0) * 0.8}px`,
          "--badge-offset-y-tablet": `${(badge.offsetY ?? 0) * 0.8}px`,
          "--badge-offset-x-mobile": `${(badge.offsetX ?? 0) * 0.65}px`,
          "--badge-offset-y-mobile": `${(badge.offsetY ?? 0) * 0.65}px`
        }
      });
    });
  }
  const ringAnimation = animationSetting(animations, "rings");
  const animationDelay = ringAnimation.delayMs ?? 0;

  return (
    <div
      className={`hero-orbit-system${hasCustomLayout ? " hero-orbit-system-custom" : ""}`}
      data-pause-hover={settings.pauseOnHover ? "true" : "false"}
      data-device={device}
      role="img"
      aria-label={`Technology stack: ${badges.map((badge) => badge.label).join(", ")}`}
    >
      <div className="hero-ring-layer" aria-hidden="true">
        {activeRings.map((ring) => {
          const ringRotationEnabled = motionAllowed &&
            settings.animationEnabled !== false &&
            ring.rotationEnabled !== false &&
            ringAnimation.enabled !== false;
          return (
            <div
              key={ring.name}
              className={`hero-orbit-path hero-orbit-path-${ring.name}`}
              style={{
                "--orbit-size": `${ring.size ?? 90}%`,
                "--orbit-size-tablet": `${ring.tabletSize ?? ring.size ?? 90}%`,
                "--orbit-size-mobile": `${ring.mobileSize ?? ring.size ?? 94}%`,
                "--orbit-duration": `${ring.durationMs ?? 18000}ms`,
                "--orbit-direction": ring.direction === "counterclockwise" ? "reverse" : "normal",
                "--orbit-line-width": `${ring.lineThickness ?? 1}px`,
                "--orbit-color": ring.color || "#a78bfa",
                "--orbit-glow": `${ring.glow ?? 20}%`,
                "--orbit-opacity": (ring.opacity ?? 60) / 100,
                "--orbit-rotation-delay": `${animationDelay}ms`
              }}
            >
              <div className={`hero-orbit-rotor ${ringRotationEnabled ? "" : "hero-orbit-static"}`} />
            </div>
          );
        })}
      </div>
      <div className="hero-badge-layer">
        {badgeLayouts.map(({ badge, positionStyle }) => {
          const appearance = badge.appearance || emptyObject;
          const borderColor = appearance.borderColor || badge.color || settings.badgeBorderColor || "#a78bfa";
          return (
            <span className="hero-orbit-position" key={badge.id} style={{
              ...positionStyle,
              "--badge-color": appearance.glowColor || badge.color || settings.badgeBorderColor || "#a78bfa",
              "--badge-glow": `${badge.glow ?? settings.badgeGlow ?? 18}%`,
              "--badge-background": appearance.backgroundColor || settings.badgeBackground || "var(--site-background, #080a12)",
              "--badge-text-color": appearance.textColor || settings.badgeTextColor || "var(--site-heading, #f2f0f7)",
              "--badge-icon-color": appearance.iconColor || settings.badgeIconColor || borderColor,
              "--badge-border-color": borderColor,
              "--badge-hover-color": appearance.hoverColor || settings.badgeHoverColor || "var(--site-primary, #a78bfa)",
              "--badge-size": `${appearance.fontSize ?? settings.badgeSize ?? 10}px`,
              "--badge-font-family": appearance.fontFamily || "var(--site-font, 'DM Sans', sans-serif)",
              "--badge-font-weight": appearance.fontWeight ?? 600,
              "--badge-letter-spacing": `${appearance.letterSpacing ?? 0}px`,
              "--badge-radius": `${appearance.borderRadius ?? settings.badgeRadius ?? 999}px`,
              "--badge-border-width": `${appearance.borderWidth ?? 1}px`,
              "--badge-padding-x": `${appearance.paddingX ?? 10}px`,
              "--badge-padding-y": `${appearance.paddingY ?? 4}px`,
              "--badge-width": appearance.width ? `${appearance.width}px` : "max-content",
              "--badge-height": appearance.height ? `${appearance.height}px` : "25px",
              "--badge-icon-size": `${appearance.iconSize ?? 12}px`,
              "--badge-mobile-size": `${Math.max(8, Math.round((appearance.fontSize ?? settings.badgeSize ?? 10) * 0.82))}px`,
              "--badge-mobile-padding-x": `${Math.max(4, Math.round((appearance.paddingX ?? 10) * 0.7))}px`,
              "--badge-mobile-padding-y": `${Math.max(2, Math.round((appearance.paddingY ?? 4) * 0.75))}px`,
              "--badge-mobile-height": appearance.height ? `${Math.min(appearance.height, 30)}px` : "22px",
              "--badge-mobile-width": appearance.width ? `${Math.min(appearance.width, 180)}px` : "max-content",
              "--badge-mobile-icon-size": `${Math.min(appearance.iconSize ?? 12, 12)}px`,
              "--badge-text-align": appearance.textAlign || "center",
              "--badge-justify": appearance.textAlign === "left" ? "flex-start" : "center"
            }}>
              <span className="hero-tech-badge" title={badge.description || badge.label} data-hover-effect={appearance.hoverAnimation === "glow" ? "glow" : "none"}>
                {badge.customIcon
                  ? <img className="hero-tech-icon-image" src={badge.customIcon} alt="" aria-hidden="true" loading="lazy" />
                  : badge.icon && <span className="hero-tech-icon" aria-hidden="true">{badge.icon}</span>}
                <span>{badge.label}</span>
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function HeroCursor({ dotRef, followerRef }) {
  return (
    <div className="hero-cursor" aria-hidden="true">
      <span className="hero-cursor-dot" ref={dotRef} />
      <span className="hero-cursor-follower" ref={followerRef} />
    </div>
  );
}

function SocialIcon({ label, Icon }) {
  if (label === "GitHub") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.23c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.2.08 1.83 1.23 1.83 1.23 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.62-2.8 5.64-5.48 5.94.43.37.81 1.1.81 2.22v3.3c0 .32.22.69.82.57A12 12 0 0 0 12 .5Z" />
      </svg>
    );
  }
  if (label === "LinkedIn") return <span className="hero-social-wordmark" aria-hidden="true">in</span>;
  return Icon ? <Icon size={16} /> : null;
}

export default function HeroSection({
  profile,
  portfolio,
  socialItems,
  animationsEnabled,
  previewDevice,
  className = ""
}) {
  const dotRef = useRef(null);
  const followerRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const [viewportDevice, setViewportDevice] = useState(getViewportDevice);
  const config = profile.heroConfig || emptyObject;
  const typing = config.typing || emptyObject;
  const orbit = config.orbit || emptyObject;
  const cursor = config.cursor || emptyObject;
  const appearance = config.appearance || emptyObject;
  const image = config.image || emptyObject;
  const content = config.content || emptyObject;
  const contentLayout = config.contentLayout || emptyObject;

  useEffect(() => {
    const tabletQuery = window.matchMedia("(max-width: 1050px)");
    const mobileQuery = window.matchMedia("(max-width: 760px)");
    const updateDevice = () => setViewportDevice(mobileQuery.matches ? "mobile" : tabletQuery.matches ? "tablet" : "desktop");
    tabletQuery.addEventListener("change", updateDevice);
    mobileQuery.addEventListener("change", updateDevice);
    return () => {
      tabletQuery.removeEventListener("change", updateDevice);
      mobileQuery.removeEventListener("change", updateDevice);
    };
  }, []);
  const titles = useMemo(() => {
    if (Array.isArray(config.titles)) {
      return [...config.titles]
        .filter((title) => title && title.enabled && title.label?.trim())
        .sort((left, right) => left.order - right.order);
    }
    return Array.isArray(profile.jobTitles)
      ? profile.jobTitles.filter((title) => typeof title === "string" && title.trim())
        .map((label, order) => ({ id: `legacy-title-${order}`, label: label.trim(), order, enabled: true }))
      : profile.designation
        ? [{ id: "profile-designation", label: profile.designation, enabled: true, order: 0 }]
        : [];
  }, [config.titles, profile.designation, profile.jobTitles]);
  const badges = useMemo(() => {
    if (Array.isArray(config.badges)) {
      const visibleBadges = [...config.badges]
        .filter((badge) => badge && badge.enabled && badge.label?.trim())
        .sort((left, right) => left.order - right.order);
      return visibleBadges.map((badge, index) => ({
        ...badge,
        position: badge.position || defaultBadgePosition(index, visibleBadges.length)
      }));
    }
    const labels = (Array.isArray(profile.orbitLabels) ? profile.orbitLabels : [])
      .filter((label) => typeof label === "string" && label.trim());
    return labels.map((label, order) => ({
        id: `legacy-badge-${order}`,
        label: label.trim(),
        enabled: true,
        order,
        position: defaultBadgePosition(order, labels.length)
      }));
  }, [config.badges, profile.orbitLabels]);
  const resumeUrl = portfolio.resume?.url || portfolio.about?.resumeLink || "";
  const intro = profile.introduction || portfolio.about?.introduction || portfolio.about?.description || "";
  const allSocialItems = (Array.isArray(socialItems) ? socialItems : []).map((item, index) => ({
    label: item[0],
    url: item[1],
    Icon: item[2],
    key: item[3] || socialActionKeys[item[0]] || `other:legacy-other-${index}`,
    enabled: item[4] !== false
  }));
  const customActionKeys = allSocialItems
    .filter((item) => item.key.startsWith("other:"))
    .map((item) => item.key);
  const visibleSocialItems = allSocialItems.filter((item) =>
    item.url &&
    item.enabled &&
    content.showSocials !== false &&
    content.socialVisibility?.[item.key.startsWith("other:") ? "other" : item.key] !== false
  );
  const actionOrder = resolveHeroActionOrder(config.actionOrder, customActionKeys);
  const socialItemsByKey = new Map(visibleSocialItems.map((item) => [item.key, item]));
  const motionEnabled = animationsEnabled && !prefersReducedMotion;
  const buttonHover = animationSetting(config.animations, "buttons");
  const cursorEnabled = cursor.enabled !== false && motionEnabled;
  const cursorAnimationEnabled = cursor.animationEnabled !== false &&
    animationSetting(config.animations, "cursor").enabled !== false;
  const sectionStyle = {
    "--hero-copy-width": `${appearance.textWidth ?? 52}%`,
    "--hero-section-height": `${appearance.sectionHeight ?? 540}px`,
    "--hero-column-gap": `${appearance.columnGap ?? 56}px`,
    "--hero-content-gap": `${appearance.contentGap ?? 26}px`,
    "--hero-art-width": `${appearance.profileSize ?? 480}px`,
    "--hero-portrait-size": `${Math.min(100, (image.size ?? 300) / (appearance.profileSize ?? 480) * 100)}%`,
    "--hero-image-border-width": `${image.borderWidth ?? 2}px`,
    "--hero-image-border-color": image.borderColor || appearance.accentColor || "var(--site-primary, #a78bfa)",
    "--hero-image-glow": `${image.glow ?? 34}%`,
    "--hero-image-background": image.background || "var(--site-card, #131521)",
    "--hero-image-position": `${image.objectPositionX ?? 50}% ${image.objectPositionY ?? 24}%`,
    "--hero-cursor-dot-size": `${cursor.dotSize ?? 7}px`,
    "--hero-cursor-follower-size": `${cursor.followerSize ?? 34}px`,
    "--hero-cursor-color": cursor.color || "var(--site-primary, #a78bfa)",
    "--hero-cursor-border": cursor.followerBorderColor || cursor.color || "var(--site-primary, #a78bfa)",
    "--hero-cursor-glow": `${(cursor.glow ?? 50) * 0.24}%`,
    "--hero-cursor-speed": `${cursorAnimationEnabled ? cursor.followerSpeedMs ?? 120 : 0}ms`,
    "--hero-cursor-hover-size": `${(cursor.followerSize ?? 34) * (cursorAnimationEnabled ? cursor.hoverScale ?? 1.4 : 1)}px`,
    "--hero-button-hover-duration": `${buttonHover.durationMs ?? 180}ms`,
    "--hero-accent": appearance.accentColor || "var(--site-primary, #a78bfa)",
    ...(appearance.background === "gradient"
      ? { background: `linear-gradient(135deg, ${appearance.gradientStart || "#10101d"}, ${appearance.gradientEnd || "#0b111c"})` }
      : appearance.background === "transparent" ? { background: "transparent" } : {})
  };
  const handlePointerMove = (event) => {
    if (!cursorEnabled || event.pointerType === "touch") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const position = `translate3d(${event.clientX - bounds.left}px, ${event.clientY - bounds.top}px, 0) translate(-50%, -50%)`;
    const interactive = event.target?.closest?.("a, button");
    for (const cursorElement of [dotRef.current, followerRef.current]) {
      if (!cursorElement) continue;
      cursorElement.style.transform = position;
      cursorElement.dataset.visible = "true";
    }
    if (followerRef.current) followerRef.current.dataset.hovering = String(Boolean(interactive));
  };
  const hideCursor = () => {
    if (dotRef.current) dotRef.current.dataset.visible = "false";
    if (followerRef.current) {
      followerRef.current.dataset.visible = "false";
      followerRef.current.dataset.hovering = "false";
    }
  };
  const showAvailability = content.showAvailability !== false;
  const showResumeView = content.showViewResume !== false;
  const showResumeDownload = content.showDownloadResume !== false;
  const showSocials = content.showSocials !== false;
  const hasVisibleSocials = showSocials && visibleSocialItems.length > 0;
  const hasHeroActions = Boolean(
    (resumeUrl && (showResumeView || showResumeDownload)) ||
    (profile.primaryCtaUrl && profile.primaryCtaUrl !== resumeUrl) ||
    (profile.secondaryCtaUrl && profile.secondaryCtaUrl !== resumeUrl)
  );
  const appearanceAlignment = appearance.alignment === "center" ? "hero-align-center" : "";
  const activeDevice = previewDevice || viewportDevice;
  const activeContentLayout = contentLayout[activeDevice] || emptyObject;
  const layoutElements = activeContentLayout.elements || emptyObject;
  const responsiveContentStyle = createContentLayoutStyle(activeContentLayout);
  const renderButtonAction = (key, href, className, children, linkProps = {}) => (
    <div
      key={key}
      className={`hero-action-order-button ${animationClass(config.animations, "buttons", motionEnabled)}`}
      style={animationStyle(config.animations, "buttons")}
    >
      <SiteAnimation as="a" animationTarget="buttons-links" className={className} href={href} {...linkProps}>
        {children}
      </SiteAnimation>
    </div>
  );
  const orderedActionItems = actionOrder.map((key) => {
    const socialItem = socialItemsByKey.get(key);
    if (socialItem) {
      return (
        <SiteAnimation
          as="a"
          animationTarget="buttons-links"
          className="hero-action-social-link"
          key={key}
          href={socialItem.url}
          aria-label={socialItem.label}
          target="_blank"
          rel="noreferrer"
        >
          <SocialIcon label={socialItem.label} Icon={socialItem.Icon} />
        </SiteAnimation>
      );
    }
    if (key === "resume" && resumeUrl && showResumeView) {
      return renderButtonAction(
        key,
        resumeUrl,
        "button button-primary",
        <>{content.viewResumeLabel || "View Resume"} <ArrowUpRight size={16} /></>,
        { target: "_blank", rel: "noopener noreferrer" }
      );
    }
    if (key === "download-resume" && resumeUrl && showResumeDownload) {
      return renderButtonAction(
        key,
        resumeUrl,
        "button button-icon",
        <Download size={17} />,
        {
          download: true,
          "aria-label": content.downloadResumeLabel || "Download resume",
          title: content.downloadResumeLabel || "Download resume"
        }
      );
    }
    if (key === "primary-cta" && profile.primaryCtaUrl && profile.primaryCtaUrl !== resumeUrl) {
      return renderButtonAction(
        key,
        profile.primaryCtaUrl,
        "button button-quiet",
        <>{profile.primaryCtaLabel || "Contact me"} <ArrowRight size={16} /></>
      );
    }
    if (key === "secondary-cta" && profile.secondaryCtaUrl && profile.secondaryCtaUrl !== resumeUrl) {
      return renderButtonAction(
        key,
        profile.secondaryCtaUrl,
        "button button-quiet",
        <>{profile.secondaryCtaLabel || "Learn more"} <ArrowUpRight size={15} /></>
      );
    }
    return null;
  }).filter(Boolean);

  return (
    <SiteAnimation
      as="section"
      animationTarget="hero"
      id="home"
      className={`hero-section ${appearanceAlignment} ${appearance.gridVisible === false ? "hero-grid-hidden" : ""} ${className}`}
      data-custom-cursor={cursorEnabled ? "enabled" : "disabled"}
      data-hero-grid={appearance.gridVisible === false ? "false" : "true"}
      data-button-hover={buttonHover.enabled ? buttonHover.style : "none"}
      data-social-hover-effect={layoutElements.socialIcons?.hoverEffect || "default"}
      data-preview-device={previewDevice}
      style={{ ...sectionStyle, ...responsiveContentStyle }}
      onPointerMove={handlePointerMove}
      onPointerLeave={hideCursor}
    >
      <div
        className={`hero-copy ${animationClass(config.animations, "entrance", motionEnabled)}`}
        style={animationStyle(config.animations, "entrance")}
      >
        {showAvailability && profile.availabilityStatus && (
          <div className="availability">
            <i aria-hidden="true" />
            {profile.availabilityText || "Open to Work"}
          </div>
        )}
        {content.showName !== false && profile.name && <p className="hero-name">{profile.name}</p>}
        {titles.length > 0 && <TypingTitle titles={titles} settings={typing} enabled={motionEnabled} designation={profile.designation} />}
        {intro && (
          <SiteAnimation as="p" animationTarget="text" className={`hero-intro ${animationClass(config.animations, "description", motionEnabled)}`} style={animationStyle(config.animations, "description")}>
            {intro}
          </SiteAnimation>
        )}
        {orderedActionItems.length > 0 && (
          <div
            className="hero-action-social-row"
            data-has-actions={hasHeroActions}
            data-has-socials={hasVisibleSocials}
          >
            {orderedActionItems}
          </div>
        )}
      </div>

      <div className={`hero-art ${animationClass(config.animations, "portrait", motionEnabled)}`} style={animationStyle(config.animations, "portrait")}>
        {profile.heroBackgroundImage && <div className="hero-art-image" style={{ backgroundImage: `url("${profile.heroBackgroundImage}")` }} />}
        <div className="hero-glow" aria-hidden="true" />
        <OrbitBadges
          badges={badges}
          settings={orbit}
          animations={config.animations || emptyObject}
          motionAllowed={motionEnabled}
          device={activeDevice}
          hasCustomLayout={Boolean(layoutElements.orbit && typeof layoutElements.orbit === "object" && Object.keys(layoutElements.orbit).length)}
        />
        <div className="hero-portrait-frame">
          {profile.profileImage ? (
            <img src={profile.profileImage} alt={profile.name || "Profile"} />
          ) : (
            <div className="profile-placeholder"><Code2 size={54} /></div>
          )}
        </div>
      </div>

      {cursorEnabled && <HeroCursor dotRef={dotRef} followerRef={followerRef} />}
      <SiteAnimation as="a" animationTarget="buttons-links" className="scroll-cue" href="#about">
        <ArrowDown size={15} /> Scroll to explore
      </SiteAnimation>
    </SiteAnimation>
  );
}
