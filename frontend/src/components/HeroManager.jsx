import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Check,
  Code2,
  Download,
  Eye,
  ExternalLink,
  Globe2,
  GripVertical,
  LoaderCircle,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
  X
} from "lucide-react";
import api from "../services/api";
import HeroSection, {
  defaultHeroActionOrder,
  defaultOrbitRings,
  defaultOrbitSettings,
  resolveHeroActionOrder,
  withOrbitRingDefaults
} from "./HeroSection";
const animationTargets = [
  ["entrance", "Hero entrance"],
  ["heading", "Heading"],
  ["description", "Description"],
  ["portrait", "Profile image"],
  ["rings", "Ring rotation"],
  ["cursor", "Custom cursor"],
  ["buttons", "Buttons"]
];
const animationDefault = { enabled: true, durationMs: 700, delayMs: 0, style: "fade-up" };
const animationDefaultFor = (key) => ({
  ...animationDefault,
  style: ["rings", "cursor"].includes(key) ? "none" : "fade-up"
});
const defaultHeroConfig = {
  titles: [],
  typing: {
    enabled: true,
    typingSpeedMs: 72,
    deletingSpeedMs: 38,
    pauseAfterTypingMs: 1150,
    pauseBeforeNextMs: 220,
    caretEnabled: true,
    style: "type-delete",
    loop: true,
    reducedMotion: "static-first"
  },
  badges: [],
  orbit: defaultOrbitSettings,
  cursor: {
    enabled: true,
    dotSize: 7,
    followerSize: 34,
    color: "#a78bfa",
    followerBorderColor: "#a78bfa",
    glow: 50,
    followerSpeedMs: 120,
    hoverScale: 1.4,
    animationEnabled: true
  },
  appearance: {
    alignment: "left",
    textWidth: 52,
    profileSize: 480,
    sectionHeight: 540,
    columnGap: 56,
    contentGap: 26,
    background: "theme",
    gridVisible: true,
    accentColor: "#a78bfa",
    gradientStart: "#10101d",
    gradientEnd: "#0b111c"
  },
  contentLayout: {
    desktop: {},
    tablet: {},
    mobile: {}
  },
  actionOrder: defaultHeroActionOrder,
  image: {
    objectPositionX: 50,
    objectPositionY: 24,
    size: 300,
    borderWidth: 2,
    borderColor: "#a78bfa",
    glow: 34,
    background: "#131521"
  },
  animations: Object.fromEntries(animationTargets.map(([key]) => [key, animationDefaultFor(key)])),
  content: {
    showName: true,
    showAvailability: true,
    showSocials: true,
    showViewResume: true,
    showDownloadResume: true,
    viewResumeLabel: "View Resume",
    downloadResumeLabel: "Download resume",
    socialVisibility: { linkedin: true, github: true, instagram: true, facebook: true, other: true }
  }
};

const fixedBadgePositions = ["top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left"];
const extraBadgePositions = [0, 4, 2, 6, 1, 5, 3, 7];
const layoutSides = ["top", "right", "bottom", "left"];
const legacySpacingFields = new Set([
  "nameMarginBottom", "nameDesignationGap", "designationMarginTop",
  "designationMarginBottom", "designationDescriptionGap", "descriptionMarginTop",
  "descriptionMarginBottom", "descriptionActionsGap", "contentGap"
]);
const defaultBadgePosition = (order, count) => fixedBadgePositions[
  count < fixedBadgePositions.length
    ? Math.round(order * fixedBadgePositions.length / Math.max(1, count))
    : order < fixedBadgePositions.length
      ? order
      : extraBadgePositions[(order - fixedBadgePositions.length) % extraBadgePositions.length]
];
const nextOrder = (items) => items.map((item) => item.order ?? 0).sort((a, b) => a - b).at(-1) + 1 || 0;
const makeId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const hydrateSocials = (value = {}) => ({
  ...value,
  other: (Array.isArray(value.other) ? value.other : []).map((item) => ({
    ...item,
    id: item.id || makeId("social")
  }))
});

function hydrateHeroConfig(profile = {}) {
  const saved = profile.heroConfig || {};
  const savedRings = Array.isArray(saved.orbit?.rings) ? saved.orbit.rings : defaultOrbitRings;
  const titles = Array.isArray(saved.titles)
    ? saved.titles
    : (Array.isArray(profile.jobTitles) ? profile.jobTitles : []).map((label, order) => ({
      id: makeId("title"), label, enabled: true, order
    }));
  const badges = Array.isArray(saved.badges)
    ? saved.badges
    : (Array.isArray(profile.orbitLabels) ? profile.orbitLabels : []).slice(0, 40).map((label, order) => ({
      id: makeId("badge"),
      label,
      enabled: true,
      order,
      orbit: "inner",
      angle: 0,
      position: fixedBadgePositions[order % fixedBadgePositions.length]
    }));
  return {
    ...defaultHeroConfig,
    ...saved,
    titles: titles.map((item, order) => ({ enabled: true, pauseMs: undefined, ...item, order: item.order ?? order })),
    badges: badges.map((item, order) => ({
      icon: "",
      customIcon: "",
      category: "",
      description: "",
      color: "",
      glow: 18,
      enabled: true,
      animationEnabled: true,
      radius: 100,
      tabletRadius: item.radius ?? 100,
      mobileRadius: item.mobileRadius ?? Math.min(item.radius ?? 100, 90),
      ...item,
      order: item.order ?? order,
      position: item.position || defaultBadgePosition(order, badges.length),
      appearance: { ...(item.appearance || {}) }
    })),
    typing: { ...defaultHeroConfig.typing, ...(saved.typing || {}) },
    orbit: {
      ...defaultHeroConfig.orbit,
      ...(saved.orbit || {}),
      rings: savedRings.map(withOrbitRingDefaults).sort((left, right) => left.order - right.order)
    },
    cursor: { ...defaultHeroConfig.cursor, ...(saved.cursor || {}) },
    appearance: { ...defaultHeroConfig.appearance, ...(saved.appearance || {}) },
    contentLayout: {
      desktop: { ...defaultHeroConfig.contentLayout.desktop, ...(saved.contentLayout?.desktop || {}) },
      tablet: { ...defaultHeroConfig.contentLayout.tablet, ...(saved.contentLayout?.tablet || {}) },
      mobile: { ...defaultHeroConfig.contentLayout.mobile, ...(saved.contentLayout?.mobile || {}) }
    },
    actionOrder: Array.isArray(saved.actionOrder) ? saved.actionOrder : defaultHeroActionOrder,
    image: { ...defaultHeroConfig.image, ...(saved.image || {}) },
    animations: Object.fromEntries(animationTargets.map(([key]) => [
      key,
      { ...animationDefaultFor(key), ...(saved.animations?.[key] || {}) }
    ])),
    content: {
      ...defaultHeroConfig.content,
      ...(saved.content || {}),
      socialVisibility: { ...defaultHeroConfig.content.socialVisibility, ...(saved.content?.socialVisibility || {}) }
    }
  };
}

function Field({ label, value, onChange, type = "text", as = "input", min, max, step = 1, placeholder, help, required = false, allowEmpty = false, children, ...props }) {
  const inputValue = value ?? (type === "checkbox" ? false : "");
  return (
    <label className="hero-manager-field">
      <span>{label}</span>
      {as === "select"
        ? <select value={inputValue} onChange={(event) => onChange(event.target.value)} required={required} {...props}>{children}</select>
        : type === "textarea"
        ? <textarea value={inputValue} onChange={(event) => onChange(event.target.value)} maxLength={5000} required={required} placeholder={placeholder} {...props} />
        : <input
          type={type}
          value={type === "checkbox" ? undefined : inputValue}
          checked={type === "checkbox" ? Boolean(inputValue) : undefined}
          onChange={(event) => onChange(type === "checkbox" ? event.target.checked : type === "number" ? (allowEmpty && event.target.value === "" ? "" : Number(event.target.value)) : event.target.value)}
          min={min}
          max={max}
          step={step}
          required={required}
          placeholder={placeholder}
          {...props}
        />}
      {help && <small>{help}</small>}
    </label>
  );
}

function LayoutNumberField({ label, value, onChange, error, max = 2000 }) {
  return (
    <label className="hero-manager-field hero-layout-number-field">
      <span>{label}</span>
      <span className="hero-layout-number-control">
        <input
          type="number"
          min={0}
          max={max}
          step={1}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value === "" ? "" : Number(event.target.value))}
        />
        <span aria-hidden="true">px</span>
      </span>
      {error && <small className="hero-layout-validation" role="alert">{error}</small>}
    </label>
  );
}

function ElementLayoutEditor({ label, value = {}, onChange, onReset, fields = [], errors = {} }) {
  const sides = ["top", "right", "bottom", "left"];
  return (
    <div className="hero-layout-element">
      <div className="hero-layout-element-heading">
        <strong>{label}</strong>
        <button type="button" className="button button-quiet" onClick={onReset}>
          <RotateCcw size={14} /> Reset section
        </button>
      </div>
      <div className="hero-layout-box-model-grid">
        {["margin", "padding"].map((boxModel) => (
          <fieldset className="hero-layout-box-model" key={boxModel}>
            <legend>{boxModel[0].toUpperCase()}{boxModel.slice(1)} sides</legend>
            <div className="hero-layout-side-grid">
              {sides.map((side) => {
                const path = `${boxModel}.${side}`;
                return <LayoutNumberField
                  key={path}
                  label={`${side[0].toUpperCase()}${side.slice(1)} (px)`}
                  value={value[boxModel]?.[side]}
                  error={errors[path]}
                  onChange={(next) => onChange(path, next)}
                />;
              })}
            </div>
          </fieldset>
        ))}
      </div>
      {fields.length > 0 && <div className="hero-manager-grid hero-layout-element-fields">
        {fields.map((field) => field.type === "select"
          ? <Field
            key={field.key}
            label={field.label}
            value={value[field.key] || ""}
            onChange={(next) => onChange(field.key, next || "")}
            as="select"
          >
            <option value="">Default</option>
            {field.options.map(([option, title]) => <option key={option} value={option}>{title}</option>)}
          </Field>
          : <LayoutNumberField
            key={field.key}
            label={field.label}
            value={value[field.key]}
            error={errors[field.key]}
            max={field.max ?? 2000}
            onChange={(next) => onChange(field.key, next)}
          />)}
      </div>}
    </div>
  );
}

function ColorField({ label, value, onChange, allowEmpty = false }) {
  return (
    <label className="hero-manager-field hero-manager-color">
      <span>{label}</span>
      <span className="hero-manager-color-control">
        <input type="color" value={/^#[\da-f]{6}$/i.test(value || "") ? value : "#a78bfa"} onChange={(event) => onChange(event.target.value)} />
        <code>{value || "Theme default"}</code>
        {allowEmpty && value && <button type="button" className="icon-button" aria-label={`Clear ${label}`} onClick={() => onChange("")}><X size={14} /></button>}
      </span>
    </label>
  );
}

function SettingsCard({ title, description, children, className = "" }) {
  return (
    <section className={`admin-panel hero-settings-card ${className}`}>
      <div className="panel-heading"><div><h2>{title}</h2>{description && <p>{description}</p>}</div></div>
      {children}
    </section>
  );
}

function HeroPreview({ profile, socials, resume, about, previewDevice, onPreviewDeviceChange }) {
  const socialItems = [
    ["LinkedIn", socials.linkedin, ExternalLink, "linkedin"],
    ["GitHub", socials.github, ExternalLink, "github"],
    ["Instagram", socials.instagram, ExternalLink, "instagram"],
    ["Facebook", socials.facebook, ExternalLink, "facebook"],
    ...(Array.isArray(socials.other)
      ? socials.other.map((item, index) => [
        item.label,
        item.url,
        ExternalLink,
        `other:${item.id || `legacy-other-${index}`}`,
        item.enabled !== false
      ])
      : [])
  ];
  const palette = {
    "--site-background": "#080a12",
    "--site-primary": "#a78bfa",
    "--site-secondary": "#65c8ff",
    "--site-accent": "#8b5cf6",
    "--site-heading": "#f2f0f7",
    "--site-text": "#eeedf4",
    "--site-card": "#131521",
    "--site-gradient-start": "#171329",
    "--site-gradient-end": "#101b27",
    "--site-font": "Inter, sans-serif",
    "--site-heading-font": "Inter, sans-serif",
    "--site-heading-size": "42px",
    "--site-heading-weight": 700,
    "--site-body-size": "14px",
    "--site-font-weight": 400,
    "--site-line-height": 1.7,
    "--site-letter-spacing": "-.02em",
    "--site-border": "#363344",
    "--site-button": "#7152df",
    "--site-button-text": "#ffffff",
    "--site-radius": "8px",
    "--site-surface": "#0e101a"
  };
  return (
    <div className="hero-admin-preview site-shell" style={palette} data-theme="dark" data-preview-device={previewDevice}>
      <div className="hero-admin-preview-toolbar">
        <div className="hero-admin-preview-label"><Eye size={14} /> Live preview · Dark palette</div>
        <div className="hero-preview-device-switch" role="group" aria-label="Preview device">
          {["desktop", "tablet", "mobile"].map((device) => <button
            key={device}
            type="button"
            aria-pressed={previewDevice === device}
            className={previewDevice === device ? "active" : ""}
            onClick={() => onPreviewDeviceChange(device)}
          >{device}</button>)}
        </div>
      </div>
      <HeroSection
        profile={profile}
        portfolio={{ resume, about }}
        socialItems={socialItems}
        animationsEnabled
        previewDevice={previewDevice}
      />
    </div>
  );
}

export default function HeroManager({ notify }) {
  const [profile, setProfile] = useState({});
  const [socials, setSocials] = useState({});
  const [about, setAbout] = useState({});
  const [resume, setResume] = useState({});
  const [tab, setTab] = useState("content");
  const [layoutDevice, setLayoutDevice] = useState("desktop");
  const [previewDevice, setPreviewDevice] = useState("desktop");
  const [layoutDirty, setLayoutDirty] = useState(false);
  const [layoutErrors, setLayoutErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({});
  const [retiredAssets, setRetiredAssets] = useState([]);
  const [uploadedAssets, setUploadedAssets] = useState([]);
  const config = useMemo(() => hydrateHeroConfig(profile), [profile]);
  const tabs = [
    ["content", "Content"],
    ["titles", "Animated titles"],
    ["orbit", "Technology orbit"],
    ["image", "Profile image"],
    ["cursor", "Custom cursor"],
    ["layout", "Content spacing"],
    ["animations", "Animations & layout"]
  ];

  useEffect(() => {
    let active = true;
    api.get("portfolio/admin")
      .then(({ data }) => {
        if (!active) return;
        setLoadError("");
        const savedProfile = data.portfolio?.profile || {};
        setProfile({
          ...savedProfile,
          availabilityStatus: savedProfile.availabilityStatus ?? true
        });
        setLayoutDirty(false);
        setSocials(hydrateSocials(data.portfolio?.socials || {}));
        setAbout(data.portfolio?.about || {});
        setResume(data.portfolio?.resume || {});
        setRetiredAssets([]);
      })
      .catch((error) => {
        if (active) {
          setLoadError(error.message);
          notify(error.message, "error");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [notify]);

  const updateConfig = (group, key, value) => {
    setProfile((current) => ({
      ...current,
      heroConfig: {
        ...hydrateHeroConfig(current),
        [group]: ["titles", "badges"].includes(group)
          ? value
          : { ...hydrateHeroConfig(current)[group], [key]: value }
      }
    }));
  };
  const updateContentLayout = (property, value) => {
    const errorKey = `${layoutDevice}.legacy.${property}`;
    if (legacySpacingFields.has(property) && value !== "" &&
      (!Number.isInteger(value) || value < 0 || value > 2000)) {
      setLayoutErrors((current) => ({
        ...current,
        [errorKey]: "Enter a whole number from 0 to 2000 px."
      }));
      return;
    }
    setLayoutErrors((current) => {
      const next = { ...current };
      delete next[errorKey];
      return next;
    });
    setProfile((current) => {
      const next = hydrateHeroConfig(current);
      const layout = { ...next.contentLayout[layoutDevice] };
      layout[property] = value === "" ? null : value;
      return {
        ...current,
        heroConfig: {
          ...next,
          contentLayout: { ...next.contentLayout, [layoutDevice]: layout }
        }
      };
    });
    setLayoutDirty(true);
  };
  const resetContentLayout = () => {
    setProfile((current) => {
      const next = hydrateHeroConfig(current);
      return {
        ...current,
        heroConfig: {
          ...next,
          contentLayout: { ...next.contentLayout, [layoutDevice]: {} }
        }
      };
    });
    setLayoutErrors((current) => Object.fromEntries(
      Object.entries(current).filter(([key]) => !key.startsWith(`${layoutDevice}.`))
    ));
    setLayoutDirty(true);
  };
  const updateElementLayout = (element, property, value) => {
    const numericLimits = {
      width: 2000,
      height: 2000,
      diameter: 2000,
      gap: 2000,
      horizontalGap: 2000,
      verticalGap: 2000,
      iconSize: 256,
      iconPadding: 256,
      borderRadius: 999,
      hoverSpacing: 200
    };
    const lastSegment = property.split(".").at(-1);
    const max = layoutSides.includes(lastSegment) ? 2000 : numericLimits[lastSegment];
    const errorKey = `${layoutDevice}.${element}.${property}`;
    if (typeof value === "number" &&
      (max === undefined || !Number.isInteger(value) || value < 0 || value > max)) {
      setLayoutErrors((current) => ({
        ...current,
        [errorKey]: `Enter a whole number from 0 to ${max ?? 2000} px.`
      }));
      return;
    }
    setLayoutErrors((current) => {
      const next = { ...current };
      delete next[errorKey];
      return next;
    });
    setProfile((current) => {
      const next = hydrateHeroConfig(current);
      const layout = { ...next.contentLayout[layoutDevice] };
      const elements = { ...(layout.elements || {}) };
      const settings = { ...(elements[element] || {}) };
      const [group, side] = property.split(".");
      if (side && ["margin", "padding"].includes(group)) {
        settings[group] = { ...(settings[group] || {}), [side]: value === "" ? null : value };
      } else {
        settings[property] = value === "" ? null : value;
      }
      elements[element] = settings;
      layout.elements = elements;
      return {
        ...current,
        heroConfig: {
          ...next,
          contentLayout: { ...next.contentLayout, [layoutDevice]: layout }
        }
      };
    });
    setLayoutDirty(true);
  };
  const resetLayoutElements = (elements, legacyFields = []) => {
    setProfile((current) => {
      const next = hydrateHeroConfig(current);
      const layout = { ...next.contentLayout[layoutDevice] };
      const elementSettings = { ...(layout.elements || {}) };
      elements.forEach((element) => { elementSettings[element] = null; });
      layout.elements = elementSettings;
      legacyFields.forEach((field) => { layout[field] = null; });
      return {
        ...current,
        heroConfig: {
          ...next,
          contentLayout: { ...next.contentLayout, [layoutDevice]: layout }
        }
      };
    });
    setLayoutErrors((current) => Object.fromEntries(
      Object.entries(current).filter(([key]) =>
        !key.startsWith(`${layoutDevice}.`) ||
        !elements.some((element) => key.startsWith(`${layoutDevice}.${element}.`)) &&
        !legacyFields.some((field) => key === `${layoutDevice}.legacy.${field}`)
      )
    ));
    setLayoutDirty(true);
  };
  const resetAllContentLayouts = () => {
    setProfile((current) => {
      const next = hydrateHeroConfig(current);
      return {
        ...current,
        heroConfig: {
          ...next,
          contentLayout: { desktop: {}, tablet: {}, mobile: {} }
        }
      };
    });
    setLayoutErrors({});
    setLayoutDirty(true);
  };
  const updateNested = (group, key, property, value) => {
    setProfile((current) => {
      const next = hydrateHeroConfig(current);
      if (group === "orbit" && key === "rings") {
        return {
          ...current,
          heroConfig: {
            ...next,
            orbit: {
              ...next.orbit,
              rings: next.orbit.rings.map((ring) => ring.name === property ? { ...ring, ...value } : ring)
            }
          }
        };
      }
      if (group === "content" && key === "socialVisibility") {
        return {
          ...current,
          heroConfig: {
            ...next,
            content: {
              ...next.content,
              socialVisibility: { ...next.content.socialVisibility, [property]: value }
            }
          }
        };
      }
      return {
        ...current,
        heroConfig: {
          ...next,
          [group]: { ...next[group], [key]: { ...next[group][key], [property]: value } }
        }
      };
    });
  };
  const updateItem = (key, id, property, value) => {
    const items = [...(config[key] || [])].map((item) => {
      if (item.id !== id) return item;
      const next = { ...item };
      if (property === "direction" && value === "") delete next.direction;
      else next[property] = value;
      return next;
    });
    updateConfig(key, key === "titles" ? "titles" : "badges", items);
  };
  const reorderItem = (key, id, direction) => {
    const items = [...config[key]].sort((left, right) => left.order - right.order);
    const index = items.findIndex((item) => item.id === id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= items.length) return;
    [items[index], items[nextIndex]] = [items[nextIndex], items[index]];
    updateConfig(key, key, items.map((item, order) => ({ ...item, order })));
  };
  const addTitle = () => updateConfig("titles", "titles", [
    ...[...config.titles].sort((a, b) => a.order - b.order),
    { id: makeId("title"), label: "", enabled: true, order: nextOrder(config.titles), pauseMs: undefined }
  ]);
  const addBadge = () => updateConfig("badges", "badges", [
    ...[...config.badges].sort((a, b) => a.order - b.order),
    {
      id: makeId("badge"),
      label: "",
      icon: "",
      customIcon: "",
      category: "",
      description: "",
      orbit: config.orbit.rings[0]?.name || "inner",
      order: nextOrder(config.badges),
      position: defaultBadgePosition(config.badges.length, config.badges.length + 1),
      enabled: true,
      animationEnabled: true,
      angle: -90,
      radius: 100,
      tabletRadius: 100,
      mobileRadius: 90,
      color: "",
      glow: 18,
      appearance: {}
    }
  ]);
  const addRing = () => {
    if (config.orbit.rings.length >= 10) {
      notify("A maximum of 10 orbit rings is supported.", "error");
      return;
    }
    const name = `ring-${Date.now().toString(36)}`;
    updateConfig("orbit", "rings", [
      ...config.orbit.rings,
      withOrbitRingDefaults({
        name,
        enabled: true,
        size: 96,
        durationMs: 20000,
        direction: "clockwise",
        lineThickness: 1,
        color: "#a78bfa",
        glow: 22,
        order: nextOrder(config.orbit.rings)
      }, config.orbit.rings.length)
    ]);
  };
  const updateRing = (ringName, property, value) => {
    if (property === "name") {
      const newName = value.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/^[^a-z]+/, "").slice(0, 32);
      if (!newName || config.orbit.rings.some((ring) => ring.name === newName && ring.name !== ringName)) return;
      setProfile((current) => {
        const next = hydrateHeroConfig(current);
        return {
          ...current,
          heroConfig: {
            ...next,
            badges: next.badges.map((badge) => badge.orbit === ringName ? { ...badge, orbit: newName } : badge),
            orbit: { ...next.orbit, rings: next.orbit.rings.map((ring) => ring.name === ringName ? { ...ring, name: newName } : ring) }
          }
        };
      });
      return;
    }
    updateNested("orbit", "rings", ringName, { [property]: value });
  };
  const reorderRing = (ringName, direction) => {
    const rings = [...config.orbit.rings].sort((left, right) => left.order - right.order);
    const index = rings.findIndex((ring) => ring.name === ringName);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= rings.length) return;
    [rings[index], rings[nextIndex]] = [rings[nextIndex], rings[index]];
    updateConfig("orbit", "rings", rings.map((ring, order) => ({ ...ring, order })));
  };
  const removeRing = (ring) => {
    if (config.orbit.rings.length < 2) {
      notify("Keep at least one orbit ring. Add another ring before deleting this one.", "error");
      return;
    }
    const replacement = config.orbit.rings.find((item) => item.name !== ring.name);
    const assigned = config.badges.filter((badge) => badge.orbit === ring.name).length;
    const message = assigned
      ? `Reassign ${assigned} badge${assigned === 1 ? "" : "s"} to "${replacement.name}" and delete "${ring.name}"?`
      : `Delete the "${ring.name}" orbit ring?`;
    if (!window.confirm(message)) return;
    setProfile((current) => {
      const next = hydrateHeroConfig(current);
      return {
        ...current,
        heroConfig: {
          ...next,
          badges: next.badges.map((badge) => badge.orbit === ring.name ? { ...badge, orbit: replacement.name } : badge),
          orbit: {
            ...next.orbit,
            rings: next.orbit.rings
              .filter((item) => item.name !== ring.name)
              .map((item, order) => ({ ...item, order }))
          }
        }
      };
    });
  };
  const updateBadgeAppearance = (id, property, value) => {
    updateConfig("badges", "badges", config.badges.map((item) => item.id === id
      ? { ...item, appearance: { ...(item.appearance || {}), [property]: value } }
      : item));
  };
  const removeItem = (key, item) => {
    if (!window.confirm(`Delete "${item.label || "untitled item"}"?`)) return;
    updateConfig(key, key, config[key].filter((entry) => entry.id !== item.id).map((entry, order) => ({ ...entry, order })));
  };

  const uploadImage = async (fieldName, file) => {
    if (!file) return;
    const body = new FormData();
    body.append("image", file);
    setUploading((current) => ({ ...current, [fieldName]: true }));
    try {
      const { data } = await api.post("upload/image", body, { headers: { "Content-Type": "multipart/form-data" } });
      setUploadedAssets((current) => [...current, {
        publicId: data.image.publicId,
        url: data.image.url
      }]);
      if (profile[`${fieldName}PublicId`] && profile[fieldName]) {
        setRetiredAssets((current) => [...current, {
          publicId: profile[`${fieldName}PublicId`],
          url: profile[fieldName]
        }]);
      }
      setProfile((current) => ({
        ...current,
        [fieldName]: data.image.url,
        [`${fieldName}PublicId`]: data.image.publicId
      }));
      notify("Hero image uploaded. Save changes to publish it.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setUploading((current) => ({ ...current, [fieldName]: false }));
    }
  };

  const uploadResume = async (file) => {
    if (!file) return;
    const body = new FormData();
    body.append("resume", file);
    setUploading((current) => ({ ...current, resume: true }));
    try {
      const { data } = await api.post("upload/resume", body, { headers: { "Content-Type": "multipart/form-data" } });
      const nextResume = { ...resume, ...data.resume };
      await api.put("portfolio/resume", nextResume);
      setResume(nextResume);
      if (resume.publicId && resume.publicId !== nextResume.publicId) {
        await api.delete("upload/resume", { data: { publicId: resume.publicId } })
          .catch(() => notify("Resume was replaced, but the prior file could not be removed.", "error"));
      }
      notify("Resume uploaded and saved.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setUploading((current) => ({ ...current, resume: false }));
    }
  };

  const persist = async (nextProfile = profile, nextSocials = socials, nextConfig = config, nextAbout = about) => {
    const profilePayload = {
      ...nextProfile,
      heroConfig: nextConfig,
      jobTitles: nextConfig.titles.map((item) => item.label.trim()).filter(Boolean),
      orbitLabels: nextConfig.badges.map((item) => item.label.trim()).filter(Boolean)
    };
    await api.put("portfolio/profile", profilePayload);
    await api.put("portfolio/socials", nextSocials);
    await api.put("portfolio/about", nextAbout);
    const readback = await api.get("portfolio/admin");
    const savedProfile = readback.data.portfolio?.profile || {};
    setProfile({ ...savedProfile, availabilityStatus: savedProfile.availabilityStatus ?? true });
    setSocials(hydrateSocials(readback.data.portfolio?.socials || {}));
    setAbout(readback.data.portfolio?.about || {});
    setResume(readback.data.portfolio?.resume || {});
    setLayoutDirty(false);
    setLayoutErrors({});
    let cleanupFailed = false;
    for (const asset of retiredAssets) {
      try {
        await api.delete("upload/image", { data: { publicId: asset.publicId, imageUrl: asset.url } });
      } catch {
        cleanupFailed = true;
      }
    }
    setRetiredAssets([]);
    setUploadedAssets([]);
    notify("Profile / Hero settings saved.");
    if (cleanupFailed) notify("Settings saved; an old image is still referenced and was kept.", "error");
  };
  const save = async (event) => {
    event.preventDefault();
    if (Object.keys(layoutErrors).length) {
      notify("Fix the Hero layout values before saving.", "error");
      setTab("layout");
      return;
    }
    if (config.titles.some((item) => !item.label.trim())) {
      notify("Every animated title needs non-empty text.", "error");
      setTab("titles");
      return;
    }
    if (config.badges.some((item) => !item.label.trim())) {
      notify("Every technology badge needs a label.", "error");
      setTab("orbit");
      return;
    }
    setSaving(true);
    try {
      await persist();
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setSaving(false);
    }
  };
  const discardChanges = async () => {
    if (!window.confirm("Discard unsaved Hero changes and reload the last saved settings?")) return;
    setSaving(true);
    try {
      const { data } = await api.get("portfolio/admin");
      for (const asset of uploadedAssets) {
        await api.delete("upload/image", { data: { publicId: asset.publicId, imageUrl: asset.url } });
      }
      const savedProfile = data.portfolio?.profile || {};
      setProfile({ ...savedProfile, availabilityStatus: savedProfile.availabilityStatus ?? true });
      setLayoutDirty(false);
      setLayoutErrors({});
      setSocials(hydrateSocials(data.portfolio?.socials || {}));
      setAbout(data.portfolio?.about || {});
      setResume(data.portfolio?.resume || {});
      setRetiredAssets([]);
      setUploadedAssets([]);
      notify("Unsaved changes discarded.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setSaving(false);
    }
  };
  const resetVisuals = async () => {
    if (!window.confirm("Reset Hero appearance, cursor, orbit, and animation settings? Content and title/badge entries will be preserved.")) return;
    const resetRings = config.orbit.rings.length
      ? config.orbit.rings.map((ring, order) => withOrbitRingDefaults({
        ...defaultOrbitRings[order % defaultOrbitRings.length],
        name: ring.name
      }, order))
      : defaultOrbitRings;
    const nextConfig = {
      ...config,
      typing: { ...defaultHeroConfig.typing },
      orbit: { ...defaultOrbitSettings, rings: resetRings },
      badges: config.badges.map((badge) => ({
        ...badge,
        orbit: resetRings.some((ring) => ring.name === badge.orbit) ? badge.orbit : resetRings[0].name,
        radius: 100,
        tabletRadius: 100,
        mobileRadius: 90,
        durationMs: undefined,
        delayMs: 0,
        direction: undefined,
        animationEnabled: true,
        color: "",
        glow: 18,
        appearance: {}
      })),
      cursor: { ...defaultHeroConfig.cursor },
      appearance: { ...defaultHeroConfig.appearance },
      image: { ...defaultHeroConfig.image },
      animations: Object.fromEntries(animationTargets.map(([key]) => [key, animationDefaultFor(key)]))
    };
    const nextProfile = { ...profile, heroConfig: nextConfig };
    setProfile(nextProfile);
    setSaving(true);
    try {
      await persist(nextProfile, socials, nextConfig, about);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setSaving(false);
    }
  };
  const removeProfileImage = async () => {
    if (!profile.profileImage) return;
    if (!window.confirm("Remove the current profile image from the portfolio?")) return;
    setRetiredAssets((current) => profile.profileImagePublicId
      ? [...current, { publicId: profile.profileImagePublicId, url: profile.profileImage }]
      : current);
    setProfile((current) => ({ ...current, profileImage: "", profileImagePublicId: "" }));
  };
  const removeHeroBackground = async () => {
    if (!profile.heroBackgroundImage) return;
    if (!window.confirm("Remove the current Hero background image?")) return;
    setRetiredAssets((current) => profile.heroBackgroundImagePublicId
      ? [...current, { publicId: profile.heroBackgroundImagePublicId, url: profile.heroBackgroundImage }]
      : current);
    setProfile((current) => ({ ...current, heroBackgroundImage: "", heroBackgroundImagePublicId: "" }));
  };
  const addOtherSocial = () => setSocials((current) => ({
    ...current,
    other: [...(Array.isArray(current.other) ? current.other : []), { id: makeId("social"), label: "", url: "" }]
  }));
  const updateOtherSocial = (index, key, value) => setSocials((current) => ({
    ...current,
    other: current.other.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item)
  }));
  const previewProfile = { ...profile, heroConfig: config };
  const selectedContentLayout = config.contentLayout[layoutDevice] || {};
  const selectedLayoutElements = selectedContentLayout.elements || {};
  const errorsForElement = (element) => Object.fromEntries(
    Object.entries(layoutErrors)
      .filter(([key]) => key.startsWith(`${layoutDevice}.${element}.`))
      .map(([key, message]) => [key.slice(`${layoutDevice}.${element}.`.length), message])
  );
  const selectedLayoutErrors = Object.entries(layoutErrors)
    .filter(([key]) => key.startsWith(`${layoutDevice}.`))
    .map(([, message]) => message);
  const heroPreview = <HeroPreview
    profile={previewProfile}
    socials={socials}
    resume={resume}
    about={about}
    previewDevice={previewDevice}
    onPreviewDeviceChange={setPreviewDevice}
  />;

  if (loading) return <div className="loading-state"><LoaderCircle className="spin" size={20} /> Loading Profile / Hero settings…</div>;
  if (loadError) return <div className="admin-error"><X size={19} />{loadError}<button type="button" className="button button-quiet" onClick={() => { setLoadError(""); setLoading(true); api.get("portfolio/admin").then(({ data }) => { setProfile(data.portfolio?.profile || {}); setSocials(hydrateSocials(data.portfolio?.socials || {})); setAbout(data.portfolio?.about || {}); setResume(data.portfolio?.resume || {}); }).catch((error) => setLoadError(error.message)).finally(() => setLoading(false)); }}>Retry</button></div>;

  return (
    <div className="manager-page hero-manager">
      <div className="admin-page-heading">
        <div><p className="admin-kicker">PORTFOLIO CONTENT</p><h1>Profile / Hero</h1><p>Manage Hero content, motion, portrait, orbit, and cursor settings in the existing portfolio database.</p></div>
        <button type="button" className="button button-quiet" onClick={resetVisuals} disabled={saving}>Reset visual defaults</button>
      </div>
      <div className="hero-manager-tabs" role="tablist" aria-label="Profile and Hero settings">
        {tabs.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}</button>)}
      </div>
      <form className="hero-manager-form" onSubmit={save}>
        {tab === "content" && <>
          <SettingsCard title="Profile information" description="These fields are stored in the existing profile section and rendered on the public Hero.">
            <div className="hero-manager-grid">
              <Field label="Full name" value={profile.name} onChange={(value) => setProfile((current) => ({ ...current, name: value }))} maxLength={160} required />
              <Field label="Professional designation" value={profile.designation} onChange={(value) => setProfile((current) => ({ ...current, designation: value }))} maxLength={160} />
              <Field label="Short introduction" type="textarea" value={profile.introduction} onChange={(value) => setProfile((current) => ({ ...current, introduction: value }))} />
              <Field label="Detailed description (optional)" type="textarea" value={about.description} onChange={(value) => setAbout((current) => ({ ...current, description: value }))} />
              <label className="hero-manager-field hero-manager-check"><input type="checkbox" checked={profile.availabilityStatus !== false} onChange={(event) => setProfile((current) => ({ ...current, availabilityStatus: event.target.checked }))} /><span>Show Open to Work badge</span></label>
              <Field label="Availability badge text" value={profile.availabilityText || "Open to Work"} onChange={(value) => setProfile((current) => ({ ...current, availabilityText: value }))} maxLength={80} />
            </div>
          </SettingsCard>
          <SettingsCard title="Calls to action" description="Resume links continue to use your existing Resume and About settings.">
            <div className="hero-manager-grid">
              <Field label="Primary button label" value={profile.primaryCtaLabel} onChange={(value) => setProfile((current) => ({ ...current, primaryCtaLabel: value }))} />
              <Field label="Primary button URL" value={profile.primaryCtaUrl} onChange={(value) => setProfile((current) => ({ ...current, primaryCtaUrl: value }))} placeholder="#contact" />
              <Field label="Secondary button label" value={profile.secondaryCtaLabel} onChange={(value) => setProfile((current) => ({ ...current, secondaryCtaLabel: value }))} />
              <Field label="Secondary button URL" value={profile.secondaryCtaUrl} onChange={(value) => setProfile((current) => ({ ...current, secondaryCtaUrl: value }))} placeholder="#about" />
              <Field label="View Resume button label" value={config.content.viewResumeLabel} onChange={(value) => updateConfig("content", "viewResumeLabel", value)} maxLength={80} />
              <Field label="Download Resume accessible label" value={config.content.downloadResumeLabel} onChange={(value) => updateConfig("content", "downloadResumeLabel", value)} maxLength={80} />
              <label className="hero-manager-field hero-manager-check"><input type="checkbox" checked={config.content.showViewResume} onChange={(event) => updateConfig("content", "showViewResume", event.target.checked)} /><span>Show View Resume button</span></label>
              <label className="hero-manager-field hero-manager-check"><input type="checkbox" checked={config.content.showDownloadResume} onChange={(event) => updateConfig("content", "showDownloadResume", event.target.checked)} /><span>Show Download Resume button</span></label>
            </div>
            <div className="hero-manager-resume">
              {resume.url
                ? <><div><strong>{resume.fileName || "Current resume"}</strong><span>Resume used by the Hero</span></div><a className="button button-quiet" href={resume.url} target="_blank" rel="noreferrer">View PDF</a></>
                : <div><strong>No resume uploaded</strong><span>Upload a PDF to enable Hero resume buttons.</span></div>}
              <label className="button button-primary hero-upload-button"><Upload size={15} />{uploading.resume ? "Uploading…" : resume.url ? "Replace PDF" : "Upload PDF"}<input type="file" accept="application/pdf,.pdf" disabled={uploading.resume} onChange={(event) => uploadResume(event.target.files[0])} /></label>
            </div>
          </SettingsCard>
          <SettingsCard title="Social links" description="Social URLs are saved through the existing protected socials endpoint.">
            <div className="hero-manager-grid">
              {["github", "linkedin", "instagram", "facebook"].map((key) => <Field key={key} label={`${key[0].toUpperCase()}${key.slice(1)} URL`} value={socials[key]} onChange={(value) => setSocials((current) => ({ ...current, [key]: value }))} type="url" />)}
              {Object.entries(config.content.socialVisibility).map(([key, enabled]) => <label className="hero-manager-field hero-manager-check" key={`social-${key}`}><input type="checkbox" checked={enabled} onChange={(event) => updateNested("content", "socialVisibility", key, event.target.checked)} /><span>Show {key === "other" ? "custom" : key} social links</span></label>)}
            </div>
            <div className="hero-manager-list">
              {(socials.other || []).map((item, index) => <div className="hero-manager-social-row" key={`social-${index}`}>
                <Field label="Label" value={item.label} onChange={(value) => updateOtherSocial(index, "label", value)} maxLength={80} required />
                <Field label="URL" value={item.url} onChange={(value) => updateOtherSocial(index, "url", value)} type="url" required />
                <label className="hero-manager-field hero-manager-check"><input type="checkbox" checked={item.enabled !== false} onChange={(event) => updateOtherSocial(index, "enabled", event.target.checked)} /><span>Enabled</span></label>
                <button type="button" className="icon-button delete-action" aria-label="Remove social link" onClick={() => setSocials((current) => ({ ...current, other: current.other.filter((_, itemIndex) => itemIndex !== index) }))}><Trash2 size={16} /></button>
              </div>)}
              <button type="button" className="button button-quiet" onClick={addOtherSocial}><Plus size={15} /> Add social link</button>
            </div>
          </SettingsCard>
        </>}

        {tab === "titles" && <>
          <SettingsCard title="Animated job titles" description="Create, edit, enable, order, and style titles. Disabled items are never shown publicly.">
            <div className="hero-manager-list">
              {[...config.titles].sort((a, b) => a.order - b.order).map((item, index) => <article className="hero-manager-item" key={item.id}>
                <div className="hero-manager-item-heading"><strong>Title {index + 1}</strong><div className="hero-manager-item-actions">
                  <button type="button" className="icon-button" aria-label="Move title up" disabled={index === 0} onClick={() => reorderItem("titles", item.id, -1)}><ArrowUp size={15} /></button>
                  <button type="button" className="icon-button" aria-label="Move title down" disabled={index === config.titles.length - 1} onClick={() => reorderItem("titles", item.id, 1)}><ArrowDown size={15} /></button>
                  <button type="button" className="icon-button delete-action" aria-label="Delete title" onClick={() => removeItem("titles", item)}><Trash2 size={15} /></button>
                </div></div>
                <div className="hero-manager-grid">
                  <Field label="Title text" value={item.label} onChange={(value) => updateItem("titles", item.id, "label", value)} maxLength={120} required />
                  <Field label="Display order" type="number" min={0} max={999} value={item.order} onChange={(value) => updateItem("titles", item.id, "order", value)} />
                  <Field label="Pause after this title (ms, optional)" type="number" min={0} max={10000} value={item.pauseMs ?? ""} onChange={(value) => updateItem("titles", item.id, "pauseMs", value === "" ? undefined : value)} />
                  <label className="hero-manager-field hero-manager-check"><input type="checkbox" checked={item.enabled} onChange={(event) => updateItem("titles", item.id, "enabled", event.target.checked)} /><span>Enabled on public site</span></label>
                  <ColorField label="Text color (optional)" value={item.color || ""} allowEmpty onChange={(value) => updateItem("titles", item.id, "color", value)} />
                  <ColorField label="Gradient start (optional)" value={item.gradientStart || ""} allowEmpty onChange={(value) => updateItem("titles", item.id, "gradientStart", value)} />
                  <ColorField label="Gradient end (optional)" value={item.gradientEnd || ""} allowEmpty onChange={(value) => updateItem("titles", item.id, "gradientEnd", value)} />
                </div>
              </article>)}
              <button type="button" className="button button-primary" onClick={addTitle}><Plus size={16} /> Add job title</button>
            </div>
          </SettingsCard>
          <SettingsCard title="Typing animation" description="Timing changes affect both this preview and the saved public animation.">
            <div className="hero-manager-grid">
              <Field label="Typing speed (ms/character)" type="number" min={10} max={1000} value={config.typing.typingSpeedMs} onChange={(value) => updateConfig("typing", "typingSpeedMs", value)} />
              <Field label="Deleting speed (ms/character)" type="number" min={10} max={1000} value={config.typing.deletingSpeedMs} onChange={(value) => updateConfig("typing", "deletingSpeedMs", value)} />
              <Field label="Pause after typing (ms)" type="number" min={0} max={10000} value={config.typing.pauseAfterTypingMs} onChange={(value) => updateConfig("typing", "pauseAfterTypingMs", value)} />
              <Field label="Pause before next title (ms)" type="number" min={0} max={10000} value={config.typing.pauseBeforeNextMs} onChange={(value) => updateConfig("typing", "pauseBeforeNextMs", value)} />
              <Field label="Typing style" value={config.typing.style} onChange={(value) => updateConfig("typing", "style", value)} as="select"><option value="type-delete">Type and delete</option><option value="type-only">Type, then switch</option></Field>
              <ColorField label="Text color" value={config.typing.textColor || ""} allowEmpty onChange={(value) => updateConfig("typing", "textColor", value)} />
              <ColorField label="Gradient start" value={config.typing.gradientStart || ""} allowEmpty onChange={(value) => updateConfig("typing", "gradientStart", value)} />
              <ColorField label="Gradient end" value={config.typing.gradientEnd || ""} allowEmpty onChange={(value) => updateConfig("typing", "gradientEnd", value)} />
              <Field label="Reduced-motion behavior" value={config.typing.reducedMotion} onChange={(value) => updateConfig("typing", "reducedMotion", value)} as="select">
                <option value="static-first">Show first title, no animation</option>
                <option value="static-designation">Show configured title, no animation</option>
                <option value="hide">Hide animated title</option>
              </Field>
              <label className="hero-manager-field hero-manager-check"><input type="checkbox" checked={config.typing.enabled} onChange={(event) => updateConfig("typing", "enabled", event.target.checked)} /><span>Enable typing animation</span></label>
              <label className="hero-manager-field hero-manager-check"><input type="checkbox" checked={config.typing.loop} onChange={(event) => updateConfig("typing", "loop", event.target.checked)} /><span>Repeat title list</span></label>
              <label className="hero-manager-field hero-manager-check"><input type="checkbox" checked={config.typing.caretEnabled} onChange={(event) => updateConfig("typing", "caretEnabled", event.target.checked)} /><span>Show blinking caret</span></label>
            </div>
          </SettingsCard>
        </>}

        {tab === "orbit" && <>
          <SettingsCard title="Overview and animation settings" description="Badge positions are fixed. Only the orbit rings rotate. Saved changes appear immediately in the live preview below.">
            <div className="hero-manager-grid">
              <label className="hero-manager-field hero-manager-check"><input type="checkbox" checked={config.orbit.enabled} onChange={(event) => updateConfig("orbit", "enabled", event.target.checked)} /><span>Show technology orbit</span></label>
              <label className="hero-manager-field hero-manager-check"><input type="checkbox" checked={config.orbit.animationEnabled !== false} onChange={(event) => updateConfig("orbit", "animationEnabled", event.target.checked)} /><span>Rotate orbit rings</span></label>
              <label className="hero-manager-field hero-manager-check"><input type="checkbox" checked={config.orbit.pauseOnHover === true} onChange={(event) => updateConfig("orbit", "pauseOnHover", event.target.checked)} /><span>Pause orbit while hovered</span></label>
              <label className="hero-manager-field hero-manager-check"><input type="checkbox" checked={config.animations.rings.enabled} onChange={(event) => updateNested("animations", "rings", "enabled", event.target.checked)} /><span>Respect Hero animation setting</span></label>
            </div>
            <p className="form-help">Badges stay at their assigned positions. Reduced-motion visitors see still rings.</p>
          </SettingsCard>

          <SettingsCard title="Manage technology badges" description="Badges stay fixed around the portrait. Assign one of eight positions, then edit, reorder, enable, or delete each badge.">
            <div className="hero-manager-list">
              {[...config.badges].sort((a, b) => a.order - b.order).map((item, index) => <article className="hero-manager-item" key={item.id}>
                <div className="hero-manager-item-heading">
                  <div className="hero-manager-badge-preview">
                    {item.customIcon ? <img src={item.customIcon} alt="" /> : <span>{item.icon || "◆"}</span>}
                    <div><strong>{item.label || `Badge ${index + 1}`}</strong><small>{item.category || item.position}</small></div>
                    <span className={`status-pill ${item.enabled ? "status-published" : "status-draft"}`}>{item.enabled ? "Visible" : "Hidden"}</span>
                  </div>
                  <div className="hero-manager-item-actions">
                    <button type="button" className="icon-button" aria-label="Move badge up" disabled={index === 0} onClick={() => reorderItem("badges", item.id, -1)}><ArrowUp size={15} /></button>
                    <button type="button" className="icon-button" aria-label="Move badge down" disabled={index === config.badges.length - 1} onClick={() => reorderItem("badges", item.id, 1)}><ArrowDown size={15} /></button>
                    <button type="button" className="icon-button delete-action" aria-label={`Delete ${item.label || "badge"}`} onClick={() => removeItem("badges", item)}><Trash2 size={15} /></button>
                  </div>
                </div>
                <div className="hero-manager-grid">
                  <Field label="Technology name" value={item.label} onChange={(value) => updateItem("badges", item.id, "label", value)} maxLength={60} required />
                  <Field label="Category" value={item.category} onChange={(value) => updateItem("badges", item.id, "category", value)} maxLength={80} />
                  <Field label="Icon text (optional)" value={item.icon} onChange={(value) => updateItem("badges", item.id, "icon", value)} maxLength={24} />
                  <Field label="Custom image / SVG URL (optional)" type="url" value={item.customIcon} onChange={(value) => updateItem("badges", item.id, "customIcon", value)} maxLength={2048} placeholder="https://…" />
                  <Field label="Fixed position" value={item.position} onChange={(value) => updateItem("badges", item.id, "position", value)} as="select">
                    {fixedBadgePositions.map((position) => <option key={position} value={position}>{position.replace("-", " ")}</option>)}
                  </Field>
                  <Field label="Horizontal position offset (px)" type="number" min={-200} max={200} value={item.offsetX} onChange={(value) => updateItem("badges", item.id, "offsetX", value === "" ? undefined : value)} help="Optional fine adjustment; does not animate." allowEmpty />
                  <Field label="Vertical position offset (px)" type="number" min={-200} max={200} value={item.offsetY} onChange={(value) => updateItem("badges", item.id, "offsetY", value === "" ? undefined : value)} help="Optional fine adjustment; does not animate." allowEmpty />
                  <Field label="Display order" type="number" min={0} max={999} value={item.order} onChange={(value) => updateItem("badges", item.id, "order", value)} />
                  <Field label="Glow intensity (0-100)" type="number" min={0} max={100} value={item.glow} onChange={(value) => updateItem("badges", item.id, "glow", value)} />
                  <ColorField label="Glow color (optional)" value={item.color || ""} allowEmpty onChange={(value) => updateItem("badges", item.id, "color", value)} />
                  <label className="hero-manager-field hero-manager-check"><input type="checkbox" checked={item.enabled} onChange={(event) => updateItem("badges", item.id, "enabled", event.target.checked)} /><span>Visible on public site</span></label>
                  <Field label="Short description" type="textarea" value={item.description} onChange={(value) => updateItem("badges", item.id, "description", value)} maxLength={500} />
                </div>
                <details className="hero-manager-badge-appearance">
                  <summary>Badge appearance and typography</summary>
                  <div className="hero-manager-grid">
                    <ColorField label="Background color" value={item.appearance.backgroundColor || ""} allowEmpty onChange={(value) => updateBadgeAppearance(item.id, "backgroundColor", value)} />
                    <ColorField label="Text color" value={item.appearance.textColor || ""} allowEmpty onChange={(value) => updateBadgeAppearance(item.id, "textColor", value)} />
                    <ColorField label="Icon color" value={item.appearance.iconColor || ""} allowEmpty onChange={(value) => updateBadgeAppearance(item.id, "iconColor", value)} />
                    <ColorField label="Border color" value={item.appearance.borderColor || ""} allowEmpty onChange={(value) => updateBadgeAppearance(item.id, "borderColor", value)} />
                    <ColorField label="Glow color" value={item.appearance.glowColor || ""} allowEmpty onChange={(value) => updateBadgeAppearance(item.id, "glowColor", value)} />
                    <ColorField label="Hover color" value={item.appearance.hoverColor || ""} allowEmpty onChange={(value) => updateBadgeAppearance(item.id, "hoverColor", value)} />
                    <Field label="Width (px)" type="number" min={40} max={300} value={item.appearance.width} onChange={(value) => updateBadgeAppearance(item.id, "width", value)} />
                    <Field label="Height (px)" type="number" min={20} max={100} value={item.appearance.height} onChange={(value) => updateBadgeAppearance(item.id, "height", value)} />
                    <Field label="Horizontal padding (px)" type="number" min={0} max={40} value={item.appearance.paddingX} onChange={(value) => updateBadgeAppearance(item.id, "paddingX", value)} />
                    <Field label="Vertical padding (px)" type="number" min={0} max={24} value={item.appearance.paddingY} onChange={(value) => updateBadgeAppearance(item.id, "paddingY", value)} />
                    <Field label="Border radius (px)" type="number" min={0} max={999} value={item.appearance.borderRadius} onChange={(value) => updateBadgeAppearance(item.id, "borderRadius", value)} />
                    <Field label="Border thickness (px)" type="number" min={0} max={10} step={0.5} value={item.appearance.borderWidth} onChange={(value) => updateBadgeAppearance(item.id, "borderWidth", value)} />
                    <Field label="Icon size (px)" type="number" min={8} max={48} value={item.appearance.iconSize} onChange={(value) => updateBadgeAppearance(item.id, "iconSize", value)} />
                    <Field label="Font size (px)" type="number" min={8} max={32} value={item.appearance.fontSize} onChange={(value) => updateBadgeAppearance(item.id, "fontSize", value)} />
                    <Field label="Font family" value={item.appearance.fontFamily} onChange={(value) => updateBadgeAppearance(item.id, "fontFamily", value)} maxLength={100} placeholder="Use site font" />
                    <Field label="Font weight" type="number" min={100} max={900} step={100} value={item.appearance.fontWeight} onChange={(value) => updateBadgeAppearance(item.id, "fontWeight", value)} />
                    <Field label="Letter spacing (px)" type="number" min={-2} max={8} step={0.1} value={item.appearance.letterSpacing} onChange={(value) => updateBadgeAppearance(item.id, "letterSpacing", value)} />
                    <Field label="Text alignment" value={item.appearance.textAlign || "center"} onChange={(value) => updateBadgeAppearance(item.id, "textAlign", value)} as="select"><option value="center">Center</option><option value="left">Left</option></Field>
                    <Field label="Hover effect" value={item.appearance.hoverAnimation || "glow"} onChange={(value) => updateBadgeAppearance(item.id, "hoverAnimation", value)} as="select"><option value="glow">Glow</option><option value="none">None</option></Field>
                  </div>
                </details>
              </article>)}
              {!config.badges.length && <p className="form-help">No technology badges yet. Add one to begin building your orbit.</p>}
              <button type="button" className="button button-primary" onClick={addBadge} disabled={!config.orbit.rings.length}><Plus size={16} /> Add technology badge</button>
            </div>
          </SettingsCard>

          <SettingsCard title="Orbit ring management" description="Add, edit, reorder, enable, or remove rings. Badges are reassigned to another ring before deletion.">
            <div className="hero-manager-list">
              {config.orbit.rings.map((ring, index) => <article className="hero-manager-item" key={ring.name}>
                <div className="hero-manager-item-heading">
                  <strong>{ring.name || `Ring ${index + 1}`}</strong>
                  <div className="hero-manager-item-actions">
                    <button type="button" className="icon-button" aria-label="Move ring up" disabled={index === 0} onClick={() => reorderRing(ring.name, -1)}><ArrowUp size={15} /></button>
                    <button type="button" className="icon-button" aria-label="Move ring down" disabled={index === config.orbit.rings.length - 1} onClick={() => reorderRing(ring.name, 1)}><ArrowDown size={15} /></button>
                    <button type="button" className="icon-button delete-action" aria-label={`Delete ${ring.name} ring`} onClick={() => removeRing(ring)}><Trash2 size={15} /></button>
                  </div>
                </div>
                <div className="hero-manager-grid">
                  <Field label="Ring ID / name" value={ring.name} onChange={(value) => updateRing(ring.name, "name", value)} maxLength={32} pattern="[a-z][a-z0-9-]{0,31}" required />
                  <Field label="Desktop diameter (%)" type="number" min={50} max={100} value={ring.size} onChange={(value) => updateRing(ring.name, "size", value)} />
                  <Field label="Tablet diameter (%)" type="number" min={50} max={100} value={ring.tabletSize} onChange={(value) => updateRing(ring.name, "tabletSize", value)} />
                  <Field label="Mobile diameter (%)" type="number" min={50} max={100} value={ring.mobileSize} onChange={(value) => updateRing(ring.name, "mobileSize", value)} />
                  <Field label="Rotation duration (ms)" type="number" min={6000} max={60000} step={500} value={ring.durationMs} onChange={(value) => updateRing(ring.name, "durationMs", value)} />
                  <Field label="Direction" value={ring.direction} onChange={(value) => updateRing(ring.name, "direction", value)} as="select"><option value="clockwise">Clockwise</option><option value="counterclockwise">Counterclockwise</option></Field>
                  <Field label="Line thickness (px)" type="number" min={0} max={5} step={0.5} value={ring.lineThickness} onChange={(value) => updateRing(ring.name, "lineThickness", value)} />
                  <Field label="Opacity (0-100)" type="number" min={0} max={100} value={ring.opacity} onChange={(value) => updateRing(ring.name, "opacity", value)} />
                  <Field label="Glow intensity (0-100)" type="number" min={0} max={100} value={ring.glow} onChange={(value) => updateRing(ring.name, "glow", value)} />
                  <ColorField label="Ring color" value={ring.color} onChange={(value) => updateRing(ring.name, "color", value)} />
                  <label className="hero-manager-field hero-manager-check"><input type="checkbox" checked={ring.enabled} onChange={(event) => updateRing(ring.name, "enabled", event.target.checked)} /><span>Visible</span></label>
                  <label className="hero-manager-field hero-manager-check"><input type="checkbox" checked={ring.rotationEnabled !== false} onChange={(event) => updateRing(ring.name, "rotationEnabled", event.target.checked)} /><span>Animate ring</span></label>
                </div>
              </article>)}
              <button type="button" className="button button-primary" onClick={addRing} disabled={config.orbit.rings.length >= 10}><Plus size={16} /> Add orbit ring</button>
            </div>
          </SettingsCard>

          <SettingsCard title="Global badge appearance" description="These settings provide defaults; individual badge styling overrides them.">
            <div className="hero-manager-grid">
              <Field label="Default text size (px)" type="number" min={8} max={24} value={config.orbit.badgeSize} onChange={(value) => updateConfig("orbit", "badgeSize", value)} />
              <Field label="Default corner radius (px)" type="number" min={0} max={999} value={config.orbit.badgeRadius} onChange={(value) => updateConfig("orbit", "badgeRadius", value)} />
              <Field label="Default glow (0-100)" type="number" min={0} max={100} value={config.orbit.badgeGlow} onChange={(value) => updateConfig("orbit", "badgeGlow", value)} />
              <ColorField label="Default background" value={config.orbit.badgeBackground} onChange={(value) => updateConfig("orbit", "badgeBackground", value)} />
              <ColorField label="Default border color" value={config.orbit.badgeBorderColor} onChange={(value) => updateConfig("orbit", "badgeBorderColor", value)} />
              <ColorField label="Default text color" value={config.orbit.badgeTextColor} onChange={(value) => updateConfig("orbit", "badgeTextColor", value)} />
              <ColorField label="Default icon color" value={config.orbit.badgeIconColor} onChange={(value) => updateConfig("orbit", "badgeIconColor", value)} />
              <ColorField label="Default hover color" value={config.orbit.badgeHoverColor} onChange={(value) => updateConfig("orbit", "badgeHoverColor", value)} />
            </div>
          </SettingsCard>
          <div className="hero-manager-preview-heading"><h2>Live preview</h2><p>Uses the same Hero component as the public portfolio. Draft changes are not persisted until Save.</p></div>
        </>}

        {tab === "image" && <>
          <SettingsCard title="Profile image" description="Uploads use the existing authenticated Cloudinary image pipeline. Crop positioning remains circular and object-fit: cover.">
            <div className="hero-manager-image-preview">{profile.profileImage ? <img src={profile.profileImage} alt="Current profile" /> : <div>No image uploaded</div>}</div>
            <div className="hero-manager-image-actions">
              <label className="button button-primary hero-upload-button"><Upload size={15} />{uploading.profileImage ? "Uploading…" : profile.profileImage ? "Replace image" : "Upload image"}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploading.profileImage} onChange={(event) => uploadImage("profileImage", event.target.files[0])} /></label>
              {profile.profileImage && <button type="button" className="button button-quiet" onClick={removeProfileImage}>Remove image</button>}
              <span className="form-help">JPG, PNG, WEBP, or GIF · maximum 5 MB</span>
            </div>
            <div className="hero-manager-grid">
              <Field label="Portrait size (px)" type="number" min={180} max={520} value={config.image.size} onChange={(value) => updateConfig("image", "size", value)} />
              <Field label="Border thickness (px)" type="number" min={0} max={20} step={0.5} value={config.image.borderWidth} onChange={(value) => updateConfig("image", "borderWidth", value)} />
              <Field label="Horizontal crop position (%)" type="number" min={0} max={100} value={config.image.objectPositionX} onChange={(value) => updateConfig("image", "objectPositionX", value)} />
              <Field label="Vertical crop position (%)" type="number" min={0} max={100} value={config.image.objectPositionY} onChange={(value) => updateConfig("image", "objectPositionY", value)} />
              <Field label="Glow intensity (0-100)" type="number" min={0} max={100} value={config.image.glow} onChange={(value) => updateConfig("image", "glow", value)} />
              <ColorField label="Border color" value={config.image.borderColor} onChange={(value) => updateConfig("image", "borderColor", value)} />
              <ColorField label="Portrait background" value={config.image.background} onChange={(value) => updateConfig("image", "background", value)} />
            </div>
          </SettingsCard>
        </>}

        {tab === "cursor" && <SettingsCard title="Custom cursor" description="The custom cursor is automatically disabled for touch devices and reduced-motion visitors.">
          <div className="hero-manager-grid">
            <label className="hero-manager-field hero-manager-check"><input type="checkbox" checked={config.cursor.enabled} onChange={(event) => updateConfig("cursor", "enabled", event.target.checked)} /><span>Enable custom cursor</span></label>
            <Field label="Dot size (px)" type="number" min={2} max={20} value={config.cursor.dotSize} onChange={(value) => updateConfig("cursor", "dotSize", value)} />
            <Field label="Follower size (px)" type="number" min={12} max={100} value={config.cursor.followerSize} onChange={(value) => updateConfig("cursor", "followerSize", value)} />
            <Field label="Follower speed (ms)" type="number" min={20} max={1000} value={config.cursor.followerSpeedMs} onChange={(value) => updateConfig("cursor", "followerSpeedMs", value)} />
            <Field label="Hover expansion multiplier" type="number" min={1} max={2} step={0.05} value={config.cursor.hoverScale} onChange={(value) => updateConfig("cursor", "hoverScale", value)} />
            <Field label="Glow intensity (0-100)" type="number" min={0} max={100} value={config.cursor.glow} onChange={(value) => updateConfig("cursor", "glow", value)} />
            <ColorField label="Cursor color" value={config.cursor.color} onChange={(value) => updateConfig("cursor", "color", value)} />
            <ColorField label="Follower border color" value={config.cursor.followerBorderColor} onChange={(value) => updateConfig("cursor", "followerBorderColor", value)} />
            <label className="hero-manager-field hero-manager-check"><input type="checkbox" checked={config.cursor.animationEnabled} onChange={(event) => updateConfig("cursor", "animationEnabled", event.target.checked)} /><span>Animate follower and hover expansion</span></label>
          </div>
        </SettingsCard>}

        {tab === "layout" && <>
          <details className="hero-layout-details" open>
            <summary>Responsive Settings</summary>
            <div className="hero-layout-device-controls">
              <p>Choose the breakpoint whose values you are editing. Desktop, tablet, and mobile settings are stored independently.</p>
              <div className="hero-preview-device-switch" role="group" aria-label="Responsive settings breakpoint">
                {["desktop", "tablet", "mobile"].map((device) => <button
                  key={device}
                  type="button"
                  aria-pressed={layoutDevice === device}
                  className={layoutDevice === device ? "active" : ""}
                  onClick={() => {
                    setLayoutDevice(device);
                    setPreviewDevice(device);
                  }}
                >{device}</button>)}
              </div>
              <button type="button" className="button button-quiet" onClick={resetContentLayout}>
                <RotateCcw size={14} /> Reset {layoutDevice}
              </button>
              <button type="button" className="button button-quiet" onClick={resetAllContentLayouts}>
                <RotateCcw size={14} /> Reset All Layout
              </button>
            </div>
          </details>

          <details className="hero-layout-details" open>
            <summary>Hero Content</summary>
            <ElementLayoutEditor
              label="Hero content column"
              value={selectedLayoutElements.heroContent || {}}
              errors={errorsForElement("heroContent")}
              onChange={(property, value) => updateElementLayout("heroContent", property, value)}
              onReset={() => resetLayoutElements(["heroContent"], ["containerWidth", "containerOffsetX", "containerOffsetY", "contentGap"])}
              fields={[
                { key: "width", label: "Content width (px)" },
                { key: "height", label: "Content height (px)" },
                { key: "alignment", label: "Content alignment", type: "select", options: [["left", "Left"], ["center", "Center"], ["right", "Right"]] }
              ]}
            />
            <div className="hero-manager-grid">
              <Field label="Legacy content width (px)" type="number" min={180} max={1400} value={selectedContentLayout.containerWidth} onChange={(value) => updateContentLayout("containerWidth", value)} placeholder="Auto" allowEmpty />
              <Field label="Content horizontal position (px)" type="number" min={-600} max={600} value={selectedContentLayout.containerOffsetX} onChange={(value) => updateContentLayout("containerOffsetX", value)} placeholder="0" allowEmpty />
              <Field label="Content vertical position (px)" type="number" min={-600} max={600} value={selectedContentLayout.containerOffsetY} onChange={(value) => updateContentLayout("containerOffsetY", value)} placeholder="0" allowEmpty />
              <Field label="Overall content gap (px)" type="number" min={0} max={2000} value={selectedContentLayout.contentGap} onChange={(value) => updateContentLayout("contentGap", value)} placeholder="Use current Hero spacing" allowEmpty />
            </div>
          </details>

          <details className="hero-layout-details" open>
            <summary>Name &amp; Designation</summary>
            <button type="button" className="button button-quiet hero-layout-reset-section" onClick={() => resetLayoutElements(
              ["name", "designation"],
              [
                "nameMarginBottom", "nameFontSize", "nameLineHeight", "nameOffsetX",
                "nameOffsetY", "nameDesignationGap", "designationMarginTop",
                "designationMarginBottom", "designationFontSize", "designationLineHeight",
                "designationHeight", "designationTextAlign", "designationDescriptionGap"
              ]
            )}><RotateCcw size={14} /> Reset Name &amp; Designation</button>
            <ElementLayoutEditor
              label="Name"
              value={selectedLayoutElements.name || {}}
              errors={errorsForElement("name")}
              onChange={(property, value) => updateElementLayout("name", property, value)}
              onReset={() => resetLayoutElements(["name"], ["nameMarginBottom", "nameFontSize", "nameLineHeight", "nameOffsetX", "nameOffsetY", "nameDesignationGap"])}
              fields={[
                { key: "width", label: "Name width (px)" },
                { key: "height", label: "Name height (px)" },
                { key: "alignment", label: "Name alignment", type: "select", options: [["left", "Left"], ["center", "Center"], ["right", "Right"]] }
              ]}
            />
            <div className="hero-manager-grid">
              <Field label="Name bottom margin (px)" type="number" min={0} max={2000} value={selectedContentLayout.nameMarginBottom} onChange={(value) => updateContentLayout("nameMarginBottom", value)} placeholder="Default" allowEmpty />
              <Field label="Name font size (px)" type="number" min={8} max={120} value={selectedContentLayout.nameFontSize} onChange={(value) => updateContentLayout("nameFontSize", value)} placeholder="Default" allowEmpty />
              <Field label="Name line height" type="number" min={0.7} max={3} step={0.05} value={selectedContentLayout.nameLineHeight} onChange={(value) => updateContentLayout("nameLineHeight", value)} placeholder="Default" allowEmpty />
              <Field label="Name horizontal position (px)" type="number" min={-300} max={300} value={selectedContentLayout.nameOffsetX} onChange={(value) => updateContentLayout("nameOffsetX", value)} placeholder="0" allowEmpty />
              <Field label="Name vertical position (px)" type="number" min={-300} max={300} value={selectedContentLayout.nameOffsetY} onChange={(value) => updateContentLayout("nameOffsetY", value)} placeholder="0" allowEmpty />
            </div>
            <ElementLayoutEditor
              label="Animated designation"
              value={selectedLayoutElements.designation || {}}
              errors={errorsForElement("designation")}
              onChange={(property, value) => updateElementLayout("designation", property, value)}
              onReset={() => resetLayoutElements(["designation"], [
                "designationMarginTop", "designationMarginBottom", "designationFontSize",
                "designationLineHeight", "designationHeight", "designationTextAlign",
                "designationDescriptionGap"
              ])}
              fields={[
                { key: "width", label: "Designation width (px)" },
                { key: "height", label: "Designation height (px)" },
                { key: "alignment", label: "Designation alignment", type: "select", options: [["left", "Left"], ["center", "Center"], ["right", "Right"]] }
              ]}
            />
            <div className="hero-manager-grid">
              <Field label="Designation top margin (px)" type="number" min={0} max={2000} value={selectedContentLayout.designationMarginTop} onChange={(value) => updateContentLayout("designationMarginTop", value)} placeholder="Default" allowEmpty />
              <Field label="Designation bottom margin (px)" type="number" min={0} max={2000} value={selectedContentLayout.designationMarginBottom} onChange={(value) => updateContentLayout("designationMarginBottom", value)} placeholder="Default" allowEmpty />
              <Field label="Designation font size (px)" type="number" min={8} max={140} value={selectedContentLayout.designationFontSize} onChange={(value) => updateContentLayout("designationFontSize", value)} placeholder="Default" allowEmpty />
              <Field label="Designation line height" type="number" min={0.7} max={3} step={0.05} value={selectedContentLayout.designationLineHeight} onChange={(value) => updateContentLayout("designationLineHeight", value)} placeholder="Default" allowEmpty />
              <Field label="Animation container height (px)" type="number" min={16} max={320} value={selectedContentLayout.designationHeight} onChange={(value) => updateContentLayout("designationHeight", value)} placeholder="Automatic (prevents shifting)" allowEmpty />
              <Field label="Animation text alignment" value={selectedContentLayout.designationTextAlign || ""} onChange={(value) => updateContentLayout("designationTextAlign", value)} as="select"><option value="">Default</option><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></Field>
            </div>
          </details>

          <details className="hero-layout-details" open>
            <summary>Description</summary>
            <ElementLayoutEditor
              label="Description"
              value={selectedLayoutElements.description || {}}
              errors={errorsForElement("description")}
              onChange={(property, value) => updateElementLayout("description", property, value)}
              onReset={() => resetLayoutElements(["description"], [
                "descriptionMarginTop", "descriptionMarginBottom", "descriptionFontSize",
                "descriptionLineHeight", "descriptionLetterSpacing", "descriptionMaxWidth",
                "descriptionTextAlign"
              ])}
              fields={[
                { key: "width", label: "Description width (px)" },
                { key: "height", label: "Description height (px)" },
                { key: "alignment", label: "Description alignment", type: "select", options: [["left", "Left"], ["center", "Center"], ["right", "Right"], ["justify", "Justify"]] }
              ]}
            />
            <div className="hero-manager-grid">
              <Field label="Description top margin (px)" type="number" min={0} max={2000} value={selectedContentLayout.descriptionMarginTop} onChange={(value) => updateContentLayout("descriptionMarginTop", value)} placeholder="Default" allowEmpty />
              <Field label="Description bottom margin (px)" type="number" min={0} max={2000} value={selectedContentLayout.descriptionMarginBottom} onChange={(value) => updateContentLayout("descriptionMarginBottom", value)} placeholder="0" allowEmpty />
              <Field label="Description font size (px)" type="number" min={8} max={48} value={selectedContentLayout.descriptionFontSize} onChange={(value) => updateContentLayout("descriptionFontSize", value)} placeholder="Default" allowEmpty />
              <Field label="Description line height" type="number" min={0.8} max={3} step={0.05} value={selectedContentLayout.descriptionLineHeight} onChange={(value) => updateContentLayout("descriptionLineHeight", value)} placeholder="1.75" allowEmpty />
              <Field label="Description letter spacing (px)" type="number" min={-5} max={20} step={0.1} value={selectedContentLayout.descriptionLetterSpacing} onChange={(value) => updateContentLayout("descriptionLetterSpacing", value)} placeholder="Default" allowEmpty />
              <Field label="Description maximum width (px)" type="number" min={120} max={1200} value={selectedContentLayout.descriptionMaxWidth} onChange={(value) => updateContentLayout("descriptionMaxWidth", value)} placeholder="500" allowEmpty />
              <Field label="Description text alignment" value={selectedContentLayout.descriptionTextAlign || ""} onChange={(value) => updateContentLayout("descriptionTextAlign", value)} as="select"><option value="">Default</option><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></Field>
            </div>
          </details>

          <details className="hero-layout-details" open>
            <summary>Buttons</summary>
            <ElementLayoutEditor
              label="Action buttons"
              value={selectedLayoutElements.buttons || {}}
              errors={errorsForElement("buttons")}
              onChange={(property, value) => updateElementLayout("buttons", property, value)}
              onReset={() => resetLayoutElements(["buttons"], ["descriptionActionsGap"])}
              fields={[
                { key: "width", label: "Button group width (px)" },
                { key: "height", label: "Button group height (px)" },
                { key: "gap", label: "Button gap (px)" },
                { key: "alignment", label: "Button alignment", type: "select", options: [["left", "Left"], ["center", "Center"], ["right", "Right"], ["space-between", "Space between"]] }
              ]}
            />
            <div className="hero-manager-grid">
              <Field label="Description-to-buttons gap (px)" type="number" min={0} max={2000} value={selectedContentLayout.descriptionActionsGap} onChange={(value) => updateContentLayout("descriptionActionsGap", value)} placeholder="0" allowEmpty />
            </div>
          </details>

          <details className="hero-layout-details" open>
            <summary>Social Icons</summary>
            <ElementLayoutEditor
              label="Social icon row"
              value={selectedLayoutElements.socialIcons || {}}
              errors={errorsForElement("socialIcons")}
              onChange={(property, value) => updateElementLayout("socialIcons", property, value)}
              onReset={() => resetLayoutElements(["socialIcons"])}
              fields={[
                { key: "width", label: "Icon row width (px)" },
                { key: "height", label: "Icon row height (px)" },
                { key: "iconSize", label: "Icon size (px)", max: 256 },
                { key: "horizontalGap", label: "Horizontal icon gap (px)" },
                { key: "verticalGap", label: "Vertical icon gap (px)" },
                { key: "iconPadding", label: "Icon padding (px)", max: 256 },
                { key: "borderRadius", label: "Icon border radius (px)", max: 999 },
                { key: "hoverSpacing", label: "Hover lift spacing (px)", max: 200 },
                { key: "alignment", label: "Icon alignment", type: "select", options: [["left", "Left"], ["center", "Center"], ["right", "Right"], ["space-between", "Space between"]] },
                { key: "hoverEffect", label: "Icon hover effect", type: "select", options: [["default", "Theme default"], ["none", "None"], ["lift", "Lift and glow"], ["glow", "Glow"]] }
              ]}
            />
          </details>

          <details className="hero-layout-details" open>
            <summary>Technology Orbit</summary>
            <ElementLayoutEditor
              label="Fixed orbit and badge layer"
              value={selectedLayoutElements.orbit || {}}
              errors={errorsForElement("orbit")}
              onChange={(property, value) => updateElementLayout("orbit", property, value)}
              onReset={() => resetLayoutElements(["orbit"])}
              fields={[{ key: "diameter", label: "Orbit diameter (px)" }]}
            />
            <p className="form-help">Spacing adjusts the fixed orbit composition; badge positions and ring-only animation remain unchanged.</p>
          </details>

          <details className="hero-layout-details" open>
            <summary>Profile Image</summary>
            <ElementLayoutEditor
              label="Circular portrait"
              value={selectedLayoutElements.profileImage || {}}
              errors={errorsForElement("profileImage")}
              onChange={(property, value) => updateElementLayout("profileImage", property, value)}
              onReset={() => resetLayoutElements(["profileImage"])}
              fields={[{ key: "diameter", label: "Portrait diameter (px)" }]}
            />
            <p className="form-help">The portrait remains a centered circle; width and height stay matched to preserve its crop.</p>
          </details>

          <details className="hero-layout-details" open>
            <summary>Container Layout</summary>
            <ElementLayoutEditor
              label="Outer Hero container"
              value={selectedLayoutElements.container || {}}
              errors={errorsForElement("container")}
              onChange={(property, value) => updateElementLayout("container", property, value)}
              onReset={() => resetLayoutElements(["container"])}
              fields={[
                { key: "width", label: "Hero width (px)" },
                { key: "height", label: "Hero minimum height (px)" },
                { key: "gap", label: "Column gap (px)" },
                { key: "alignment", label: "Content alignment", type: "select", options: [["stretch", "Stretch"], ["start", "Start"], ["center", "Center"], ["end", "End"]] }
              ]}
            />
          </details>

          {selectedLayoutErrors.length > 0 && <p className="hero-layout-validation" role="alert">
            {selectedLayoutErrors[0]} Correct the highlighted layout value before saving.
          </p>}

          <details className="hero-layout-details hero-layout-preview" open>
            <summary>Live Preview</summary>
            <p className="form-help">Changes update immediately. Switch the device preview above to inspect each responsive layout before saving.</p>
            {heroPreview}
          </details>
        </>}

        {tab === "animations" && <>
          <SettingsCard title="Hero animations" description="Each animation supports enable/disable, duration, delay, and a supported style.">
            <div className="hero-manager-list">
              {animationTargets.map(([key, label]) => {
                const animation = config.animations[key];
                return <article className="hero-manager-item" key={key}>
                  <div className="hero-manager-item-heading"><strong>{label}</strong><label className="hero-manager-check"><input type="checkbox" checked={animation.enabled} onChange={(event) => updateNested("animations", key, "enabled", event.target.checked)} /><span>Enabled</span></label></div>
                  <div className="hero-manager-grid">
                    {["entrance", "heading", "description", "portrait", "buttons"].includes(key)
                      ? <Field label="Style" value={animation.style} onChange={(value) => updateNested("animations", key, "style", value)} as="select"><option value="fade">Fade</option><option value="fade-up">Fade up</option><option value="fade-down">Fade down</option><option value="slide">Slide</option><option value="zoom">Zoom</option><option value="none">None</option></Field>
                      : <p className="form-help">{key === "cursor" ? "Follower speed is managed in Custom Cursor." : "Orbit durations are managed per ring in Technology Orbit."}</p>}
                    {!["rings", "orbit", "cursor"].includes(key) && <Field label="Duration (ms)" type="number" min={0} max={10000} value={animation.durationMs} onChange={(value) => updateNested("animations", key, "durationMs", value)} />}
                    {key !== "cursor" && <Field label="Delay (ms)" type="number" min={0} max={10000} value={animation.delayMs} onChange={(value) => updateNested("animations", key, "delayMs", value)} />}
                  </div>
                </article>;
              })}
            </div>
          </SettingsCard>
          <SettingsCard title="Hero layout and appearance" description="These styles apply to the Hero only; global theme colors remain managed by Appearance settings.">
            <div className="hero-manager-background">
              <div>{profile.heroBackgroundImage && <img src={profile.heroBackgroundImage} alt="Hero background preview" />}</div>
              <label className="button button-quiet hero-upload-button"><Upload size={15} />{uploading.heroBackgroundImage ? "Uploading…" : profile.heroBackgroundImage ? "Replace background image" : "Upload background image"}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploading.heroBackgroundImage} onChange={(event) => uploadImage("heroBackgroundImage", event.target.files[0])} /></label>
              {profile.heroBackgroundImage && <button type="button" className="button button-quiet" onClick={removeHeroBackground}>Remove background image</button>}
            </div>
            <div className="hero-manager-grid">
              <Field label="Content alignment" value={config.appearance.alignment} onChange={(value) => updateConfig("appearance", "alignment", value)} as="select"><option value="left">Left</option><option value="center">Center</option></Field>
              <Field label="Text width (%)" type="number" min={30} max={70} value={config.appearance.textWidth} onChange={(value) => updateConfig("appearance", "textWidth", value)} />
              <Field label="Hero height (px)" type="number" min={320} max={1000} value={config.appearance.sectionHeight} onChange={(value) => updateConfig("appearance", "sectionHeight", value)} />
              <Field label="Orbit composition size (px)" type="number" min={180} max={520} value={config.appearance.profileSize} onChange={(value) => updateConfig("appearance", "profileSize", value)} />
              <Field label="Column spacing (px)" type="number" min={0} max={180} value={config.appearance.columnGap} onChange={(value) => updateConfig("appearance", "columnGap", value)} />
              <Field label="Content spacing (px)" type="number" min={0} max={100} value={config.appearance.contentGap} onChange={(value) => updateConfig("appearance", "contentGap", value)} />
              <Field label="Background" value={config.appearance.background} onChange={(value) => updateConfig("appearance", "background", value)} as="select"><option value="theme">Use active theme</option><option value="gradient">Custom gradient</option><option value="transparent">Transparent</option></Field>
              <ColorField label="Accent color" value={config.appearance.accentColor} onChange={(value) => updateConfig("appearance", "accentColor", value)} />
              <ColorField label="Gradient start" value={config.appearance.gradientStart} onChange={(value) => updateConfig("appearance", "gradientStart", value)} />
              <ColorField label="Gradient end" value={config.appearance.gradientEnd} onChange={(value) => updateConfig("appearance", "gradientEnd", value)} />
              <label className="hero-manager-field hero-manager-check"><input type="checkbox" checked={config.appearance.gridVisible} onChange={(event) => updateConfig("appearance", "gridVisible", event.target.checked)} /><span>Show background grid</span></label>
            </div>
          </SettingsCard>
        </>}

        <div className="hero-manager-savebar">
          <span className={layoutDirty ? "form-help hero-unsaved-indicator" : "form-help"}>{layoutDirty ? "Unsaved responsive layout changes. Save to publish them." : "Save writes Hero settings to MongoDB using the existing authenticated profile API."}</span>
          <button type="button" className="button button-quiet" onClick={discardChanges} disabled={saving || Object.values(uploading).some(Boolean)}>Discard drafts</button>
          <button type="submit" className="button button-primary" disabled={saving || Object.values(uploading).some(Boolean)}>{saving ? "Saving…" : "Save Hero changes"}{saving ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}</button>
        </div>
      </form>

      {tab !== "layout" && heroPreview}
    </div>
  );
}
