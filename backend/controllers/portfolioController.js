import Portfolio from "../models/Portfolio.js";
import {
  isSafeActionUrl,
  isValidEmail,
  normalizeWebUrl
} from "../utils/validation.js";
import { validateAnimations, validateNavigationSettings } from "../utils/siteConfig.js";
import { validateHeroConfig } from "../utils/heroConfig.js";

const allowedFields = {
  profile: [
    "name", "designation", "introduction", "profileImage", "profileImagePublicId",
    "heroBackgroundImage", "heroBackgroundImagePublicId", "availabilityStatus",
    "availabilityText", "primaryCtaLabel", "primaryCtaUrl", "secondaryCtaLabel",
    "secondaryCtaUrl", "orbitLabels", "jobTitles", "heroConfig"
  ],
  about: [
    "title", "description", "introduction", "paragraphs", "profileImage", "profileImagePublicId",
    "resumeLink"
  ],
  contact: [
    "email", "phone", "whatsapp", "location", "formTitle", "formDescription",
    "formRecipient"
  ],
  socials: ["linkedin", "github", "instagram", "facebook", "other"],
  settings: [
    "websiteTitle", "logo", "logoPublicId", "favicon", "faviconPublicId",
    "primaryColor", "secondaryColor", "backgroundColor", "fontFamily",
    "sectionVisibility", "sectionOrder", "sectionContent", "sectionStyles",
    "navbar", "animations", "footerText", "seoTitle",
    "seoDescription", "ogImage", "ogImagePublicId"
  ],
  appearance: ["theme", "colors", "typography", "design"],
  resume: ["url", "publicId", "fileName"]
};

const validSections = [
  "hero", "about", "skills", "experience", "projects", "services", "education",
  "certifications", "testimonials", "contact"
];
const webUrlFields = new Set([
  "profileImage", "heroBackgroundImage", "resumeLink", "whatsapp", "linkedin",
  "github", "instagram", "facebook", "logo", "favicon", "ogImage"
]);
const colorFields = new Set(["primaryColor", "secondaryColor", "backgroundColor"]);
const publicIdFields = new Set([
  "profileImagePublicId", "heroBackgroundImagePublicId", "logoPublicId",
  "faviconPublicId", "ogImagePublicId"
]);
const appearanceSchema = {
  theme: {
    defaultTheme: ["dark", "light"],
    toggleVisible: "boolean"
  },
  colors: {
    primary: "color",
    secondary: "color",
    accent: "color",
    background: "color",
    backgroundLight: "color",
    text: "color",
    textLight: "color",
    heading: "color",
    headingLight: "color",
    surface: "color",
    surfaceLight: "color",
    card: "color",
    cardLight: "color",
    button: "color",
    buttonText: "color",
    border: "color",
    borderLight: "color",
    gradientStart: "color",
    gradientEnd: "color"
  },
  typography: {
    fontFamily: "font",
    headingFontFamily: "font",
    bodyFontFamily: "font",
    headingSize: "number",
    bodySize: "number",
    fontWeight: "number",
    headingWeight: "number",
    lineHeight: "number",
    letterSpacing: "number"
  },
  design: {
    borderRadius: ["sharp", "soft", "rounded"],
    buttonStyle: ["solid", "outline", "gradient"],
    cardStyle: ["solid", "glass", "outlined"],
    sectionSpacing: "number",
    sectionBackground: ["default", "surface", "gradient"],
    backgroundGradient: "boolean",
    decorativeElements: "boolean",
    gridBackground: "boolean",
    animations: "boolean"
  }
};
const sectionContentFields = new Set(validSections);
const sectionBackgroundStyles = new Set(["default", "surface", "gradient", "accent"]);
const fontOptions = new Set([
  "Inter", "Poppins", "Roboto", "Montserrat", "Plus Jakarta Sans", "DM Sans",
  "Manrope", "Outfit", "Source Sans 3", "Open Sans", "Lato", "Nunito Sans",
  "system-ui"
]);
const appearanceColorFields = new Set(Object.keys(appearanceSchema.colors));

export const validateAppearance = (input) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { error: "Appearance settings must be an object." };
  }
  const result = {};
  for (const [group, values] of Object.entries(input)) {
    const schema = appearanceSchema[group];
    if (!schema || !values || typeof values !== "object" || Array.isArray(values)) {
      return { error: `Unsupported appearance group: ${group}.` };
    }
    if (group === "colors") {
      const validatedColors = {};
      for (const [key, value] of Object.entries(values)) {
        if (key === "dark" || key === "light") {
          if (!value || typeof value !== "object" || Array.isArray(value)) {
            return { error: `colors.${key} must be a color object.` };
          }
          const palette = {};
          for (const [colorName, color] of Object.entries(value)) {
            if (!appearanceColorFields.has(colorName) || typeof color !== "string" ||
              !/^#[\da-f]{3}(?:[\da-f]{3})?(?:[\da-f]{2})?$/i.test(color)) {
              return { error: `colors.${key}.${colorName} must be a supported hexadecimal color.` };
            }
            palette[colorName] = color;
          }
          validatedColors[key] = palette;
          continue;
        }
        if (!appearanceColorFields.has(key) || typeof value !== "string" ||
          !/^#[\da-f]{3}(?:[\da-f]{3})?(?:[\da-f]{2})?$/i.test(value)) {
          return { error: `colors.${key} must be a supported hexadecimal color.` };
        }
        validatedColors[key] = value;
      }
      result[group] = validatedColors;
      continue;
    }
    const validatedGroup = {};
    for (const [key, value] of Object.entries(values)) {
      const rule = schema[key];
      if (!rule) return { error: `Unsupported appearance setting: ${group}.${key}.` };
      if (Array.isArray(rule)) {
        if (!rule.includes(value)) return { error: `${group}.${key} has an unsupported value.` };
        validatedGroup[key] = value;
      } else if (rule === "boolean") {
        if (typeof value !== "boolean") return { error: `${group}.${key} must be true or false.` };
        validatedGroup[key] = value;
      } else if (rule === "color") {
        if (typeof value !== "string" || !/^#[\da-f]{3}(?:[\da-f]{3})?(?:[\da-f]{2})?$/i.test(value)) {
          return { error: `${group}.${key} must be a hexadecimal color.` };
        }
        validatedGroup[key] = value;
      } else if (rule === "font") {
        if (typeof value !== "string" || !fontOptions.has(value)) {
          return { error: `${group}.${key} is not an allowed font family.` };
        }
        validatedGroup[key] = value;
      } else if (rule === "number") {
        const limits = {
          headingSize: [24, 72],
          bodySize: [11, 22],
          fontWeight: [300, 700],
          headingWeight: [400, 800],
          lineHeight: [1.2, 2.4],
          letterSpacing: [-0.1, 0.2],
          sectionSpacing: [32, 180]
        };
        const [minimum, maximum] = limits[key] || [0, 100];
        if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
          return { error: `${group}.${key} must be between ${minimum} and ${maximum}.` };
        }
        validatedGroup[key] = value;
      }
    }
    result[group] = validatedGroup;
  }
  return { data: result };
};

export const validateSection = (section, input) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { error: "Section data must be an object." };
  }
  const allowed = allowedFields[section];
  if (!allowed) return { error: "Unsupported portfolio section." };
  const data = {};

  for (const [field, value] of Object.entries(input)) {
    if (!allowed.includes(field)) return { error: `Unsupported field: ${field}.` };
    if (typeof value === "string") {
      if (value.length > 5000) return { error: `${field} is too long.` };
      const trimmed = value.trim();
      if (publicIdFields.has(field) && trimmed && !trimmed.startsWith("tayyaba-portfolio/")) {
        return { error: `${field} is not a valid Cloudinary asset ID.` };
      }
      if (webUrlFields.has(field)) {
        const url = normalizeWebUrl(trimmed);
        if (trimmed && !url) return { error: `${field} must be a valid HTTP(S) URL.` };
        data[field] = url || "";
        continue;
      }
      if (["primaryCtaUrl", "secondaryCtaUrl"].includes(field) && !isSafeActionUrl(trimmed, {
        allowAnchor: true,
        allowMailto: true,
        allowTel: true
      })) {
        return { error: `${field} must be a safe web URL, anchor, email, or phone link.` };
      }
      if (field === "formRecipient" && trimmed && !isValidEmail(trimmed)) {
        return { error: "Notification recipient must be a valid email address." };
      }
      if (field === "email" && trimmed && !isValidEmail(trimmed)) {
        return { error: "Contact email must be valid." };
      }
      if (colorFields.has(field) && trimmed && !/^#[\da-f]{3,8}$/i.test(trimmed)) {
        return { error: `${field} must be a hexadecimal color.` };
      }
      if (field === "fontFamily" && trimmed && !/^[\w\s,"'-]{1,100}$/.test(trimmed)) {
        return { error: "Font family contains unsupported characters." };
      }
      data[field] = trimmed;
      continue;
    }
    if (["orbitLabels", "jobTitles", "paragraphs", "sectionOrder"].includes(field)) {
      if (!Array.isArray(value) || value.length > 40 || value.some((entry) => typeof entry !== "string")) {
        return { error: `${field} must be a list of text values.` };
      }
      const entries = value.map((entry) => entry.trim().slice(0, 240));
      if (field === "sectionOrder" && entries.some((entry) => !validSections.includes(entry))) {
        return { error: "Section order contains an unsupported section." };
      }
      data[field] = entries;
      continue;
    }
    if (field === "availabilityStatus" && typeof value === "boolean") {
      data[field] = value;
      continue;
    }
    if (field === "heroConfig") {
      const validated = validateHeroConfig(value);
      if (validated.error) return validated;
      data[field] = validated.data;
      continue;
    }
    if (field === "sectionVisibility") {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return { error: `${field} must be an object.` };
      }
      const entries = Object.entries(value);
      if (entries.length > 20 || entries.some(([key, enabled]) =>
        !validSections.includes(key) ||
        typeof enabled !== "boolean"
      )) {
        return { error: `${field} contains invalid settings.` };
      }
      data[field] = Object.fromEntries(entries);
      continue;
    }
    if (field === "navbar") {
      const validated = validateNavigationSettings(value);
      if (validated.error) return validated;
      data[field] = validated.data;
      continue;
    }
    if (field === "animations") {
      const validated = validateAnimations(value);
      if (validated.error) return validated;
      data[field] = validated.data;
      continue;
    }
    if (field === "sectionContent") {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return { error: "sectionContent must be an object." };
      }
      const entries = Object.entries(value);
      if (entries.length > validSections.length || entries.some(([section, content]) =>
        !sectionContentFields.has(section) || !content || typeof content !== "object" ||
        Array.isArray(content) || Object.entries(content).some(([key, text]) =>
          !["title", "description"].includes(key) || typeof text !== "string" || text.length > 500
        )
      )) {
        return { error: "Section heading settings contain invalid values." };
      }
      data[field] = Object.fromEntries(entries.map(([section, content]) => [
        section,
        Object.fromEntries(Object.entries(content).map(([key, text]) => [key, text.trim()]))
      ]));
      continue;
    }
    if (field === "sectionStyles") {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return { error: "sectionStyles must be an object." };
      }
      const entries = Object.entries(value);
      if (entries.length > validSections.length || entries.some(([section, style]) =>
        !sectionContentFields.has(section) || !sectionBackgroundStyles.has(style)
      )) {
        return { error: "Section background settings contain invalid values." };
      }
      data[field] = Object.fromEntries(entries);
      continue;
    }
    if (field === "other" && section === "socials") {
      if (!Array.isArray(value) || value.length > 20) {
        return { error: "Other social links must be a list." };
      }
      if (value.some((item) => !item || typeof item.label !== "string" || !item.label.trim() ||
        typeof item.url !== "string" || item.label.length > 80 || item.url.length > 500 ||
        (item.id !== undefined && (typeof item.id !== "string" || !/^[\w-]{1,64}$/.test(item.id))) ||
        (item.enabled !== undefined && typeof item.enabled !== "boolean") ||
        !normalizeWebUrl(item.url))) {
        return { error: "Other social links must include a label and URL." };
      }
      const ids = value.filter((item) => item.id !== undefined).map((item) => item.id);
      if (new Set(ids).size !== ids.length) {
        return { error: "Other social link IDs must be unique." };
      }
      data[field] = value.map(({ id, label, url, enabled }) => ({
        ...(id !== undefined ? { id } : {}),
        label: label.trim(),
        url: normalizeWebUrl(url),
        enabled: enabled !== false
      }));
      continue;
    }
    return { error: `${field} has an invalid value.` };
  }
  return { data };
};

const readPortfolio = async () => {
  const portfolio = await Portfolio.findOne({ key: "primary" }).lean();
  return portfolio?.data || {};
};

export const getPublicPortfolio = async (req, res) => {
  try {
    const data = await readPortfolio();
    const contact = { ...(data.contact || {}) };
    const settings = { ...(data.settings || {}) };
    if (settings.navbar) {
      const { showBrand, showLinks, showContact, sticky } = settings.navbar;
      settings.navbar = Object.fromEntries(
        Object.entries({ showBrand, showLinks, showContact, sticky })
          .filter(([, value]) => typeof value === "boolean")
      );
    }
    delete settings.animations;
    delete contact.formRecipient;
    res.json({
      success: true,
      portfolio: { ...data, settings, contact }
    });
  } catch (error) {
    console.error("Public Portfolio Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch portfolio settings." });
  }
};

export const getPublicProfile = async (req, res) => {
  try {
    const data = await readPortfolio();
    res.json({ success: true, profile: data.profile || {} });
  } catch (error) {
    console.error("Public Profile Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch public profile." });
  }
};

export const getAdminPortfolio = async (req, res) => {
  try {
    res.json({ success: true, portfolio: await readPortfolio() });
  } catch (error) {
    console.error("Admin Portfolio Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch portfolio settings." });
  }
};

function flattenProfileUpdate(value, path, updates) {
  if (value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length) {
    for (const [key, nestedValue] of Object.entries(value)) {
      flattenProfileUpdate(nestedValue, `${path}.${key}`, updates);
    }
    return;
  }
  updates[path] = value;
}

export function createProfileUpdateFields(profileData) {
  const updates = {};
  for (const [key, value] of Object.entries(profileData)) {
    flattenProfileUpdate(value, `data.profile.${key}`, updates);
  }
  return updates;
}

export const updatePortfolioSection = async (req, res) => {
  if (req.params.section === "appearance") {
    const validatedAppearance = validateAppearance(req.body);
    if (validatedAppearance.error) {
      res.status(400).json({ success: false, message: validatedAppearance.error });
      return;
    }
    try {
      const portfolio = await Portfolio.findOneAndUpdate(
        { key: "primary" },
        { $set: { "data.appearance": validatedAppearance.data } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      );
      res.json({
        success: true,
        portfolio: portfolio.data,
        message: "Appearance settings updated."
      });
    } catch (error) {
      console.error("Appearance Update Error:", error.message);
      res.status(500).json({ success: false, message: "Unable to update appearance settings." });
    }
    return;
  }

  const validated = validateSection(req.params.section, req.body);
  if (validated.error) {
    res.status(400).json({ success: false, message: validated.error });
    return;
  }
  try {
    const update = req.params.section === "profile"
      ? createProfileUpdateFields(validated.data)
      : { [`data.${req.params.section}`]: validated.data };
    const portfolio = await Portfolio.findOneAndUpdate(
      { key: "primary" },
      { $set: update },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json({
      success: true,
      portfolio: portfolio.data,
      message: "Portfolio section updated."
    });
  } catch (error) {
    console.error("Portfolio Update Error:", error.message);
    res.status(500).json({ success: false, message: "Unable to update portfolio section." });
  }
};
