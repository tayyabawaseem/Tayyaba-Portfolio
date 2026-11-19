import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  ChevronDown as MoveDown,
  ChevronUp as MoveUp,
  Code2,
  Download,
  ExternalLink,
  GraduationCap,
  Globe2,
  Home,
  Info,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  Moon,
  Pencil,
  Plus,
  Send,
  Settings,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BrowserRouter,
  Link,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import api from "./services/api";
import NavigationManager from "./components/NavigationManager";
import AnimationManager from "./components/AnimationManager";
import HeroSection from "./components/HeroSection";
import HeroManager from "./components/HeroManager";
import { SiteAnimation, SiteAnimationProvider } from "./components/SiteAnimation";
import loadWebFonts from "./utils/loadWebFonts";
import { parseProjectDescription } from "./utils/projectDescription";
import SkillsSection from "./components/SkillsSection";
import SkillsManager from "./components/SkillsManager";

const AuthContext = createContext(null);
const ToastContext = createContext(() => {});

const navigation = [
  ["Dashboard", "dashboard", LayoutDashboard],
  ["Profile / Hero", "profile", Sparkles],
  ["About", "about", BriefcaseBusiness],
  ["Skills", "skills", Code2],
  ["Experience", "experience", BriefcaseBusiness],
  ["Projects", "projects", Globe2],
  ["Services", "services", Sparkles],
  ["Education", "education", GraduationCap],
  ["Certifications", "certifications", Check],
  ["Testimonials", "testimonials", MessageCircle],
  ["Resume", "resume", Download],
  ["Contact Information", "contact", Mail],
  ["Contact Messages", "contact-messages", MessageCircle],
  ["Social Links", "social-links", ExternalLink],
  ["Website Settings", "website-settings", Settings],
  ["Appearance", "appearance", Sparkles],
  ["Navigation", "navigation", Menu],
  ["Website Animations", "animations", Sparkles],
  ["SEO Settings", "seo-settings", Globe2],
];

const sectionOptions = [
  ["hero", "Hero"],
  ["about", "About"],
  ["skills", "Skills"],
  ["experience", "Experience"],
  ["projects", "Projects"],
  ["services", "Services"],
  ["education", "Education"],
  ["certifications", "Certifications"],
  ["testimonials", "Testimonials"],
  ["contact", "Contact"],
];

const defaultAppearance = {
  theme: { defaultTheme: "dark", toggleVisible: true },
  colors: {
    dark: {
      primary: "#a78bfa", secondary: "#65c8ff", accent: "#8b5cf6",
      background: "#080a12", text: "#eeedf4", heading: "#f2f0f7",
      surface: "#0e101a", card: "#131521", button: "#7152df",
      buttonText: "#ffffff", border: "#363344",
      gradientStart: "#171329", gradientEnd: "#101b27",
    },
    light: {
      primary: "#7152df", secondary: "#2376a5", accent: "#7043dc",
      background: "#f5f6fb", text: "#434455", heading: "#1d1c2a",
      surface: "#ffffff", card: "#ffffff", button: "#7152df",
      buttonText: "#ffffff", border: "#dedee8",
      gradientStart: "#ebe7f8", gradientEnd: "#e5f1f8",
    },
  },
  typography: {
    fontFamily: "Inter", headingFontFamily: "Plus Jakarta Sans",
    bodyFontFamily: "Inter", headingSize: 44, bodySize: 14,
    fontWeight: 400, headingWeight: 700, lineHeight: 1.75,
    letterSpacing: -0.02,
  },
  design: {
    borderRadius: "soft", buttonStyle: "gradient", cardStyle: "glass",
    sectionSpacing: 92, sectionBackground: "default",
    backgroundGradient: true, decorativeElements: true,
    gridBackground: true, animations: true,
  },
};

const appearanceColorFields = [
  ["primary", "Primary color"], ["secondary", "Secondary color"],
  ["accent", "Accent color"], ["background", "Background"],
  ["text", "Text color"], ["heading", "Heading color"],
  ["surface", "Surface color"], ["card", "Card background"],
  ["button", "Button color"], ["buttonText", "Button text"],
  ["border", "Border color"], ["gradientStart", "Gradient start"],
  ["gradientEnd", "Gradient end"],
];

const fontOptions = [
  "Inter", "Poppins", "Roboto", "Montserrat", "Plus Jakarta Sans",
  "DM Sans", "Manrope", "Outfit", "Source Sans 3", "Open Sans",
  "Lato", "Nunito Sans", "system-ui",
];

const managedTypes = new Set([
  "skills", "experience", "services", "education", "certifications", "testimonials",
]);

const field = (name, label, type = "text", extra = {}) => ({ name, label, type, ...extra });

const contentFields = {
  skills: [
    field("name", "Skill name", "text", { required: true }),
    field("category", "Category", "select", {
      options: ["Frontend", "Backend", "Database", "CMS", "Tools", "AI / Automation"],
    }),
    field("icon", "Icon name or image URL"),
    field("proficiency", "Proficiency (%)", "number", { min: 0, max: 100 }),
  ],
  experience: [
    field("jobTitle", "Job title", "text", { required: true }),
    field("company", "Company"),
    field("employmentType", "Employment type"),
    field("location", "Location"),
    field("startDate", "Start date", "text", { placeholder: "e.g. Jan 2023" }),
    field("endDate", "End date", "text", { placeholder: "Leave blank if current" }),
    field("currentlyWorking", "Currently working here", "checkbox"),
    field("description", "Description", "textarea"),
    field("responsibilities", "Responsibilities", "list"),
    field("technologies", "Technologies", "list"),
  ],
  services: [
    field("title", "Service title", "text", { required: true }),
    field("description", "Description", "textarea"),
    field("icon", "Icon name"),
  ],
  education: [
    field("degree", "Degree", "text", { required: true }),
    field("institution", "Institution"),
    field("startDate", "Start date"),
    field("endDate", "End date"),
    field("description", "Description", "textarea"),
  ],
  certifications: [
    field("title", "Certification title", "text", { required: true }),
    field("organization", "Issuing organization"),
    field("issueDate", "Issue date"),
    field("credentialId", "Credential ID"),
    field("credentialUrl", "Credential URL", "url"),
    field("image", "Certificate image", "image"),
  ],
  testimonials: [
    field("name", "Client name", "text", { required: true }),
    field("designation", "Designation"),
    field("company", "Company"),
    field("testimonial", "Testimonial", "textarea", { required: true }),
    field("profileImage", "Profile image", "image"),
  ],
};

const portfolioFields = {
  profile: [
    field("name", "Name", "text", { required: true }),
    field("designation", "Designation"),
    field("jobTitles", "Animated job titles", "list"),
    field("introduction", "Introduction", "textarea"),
    field("profileImage", "Profile image", "image"),
    field("heroBackgroundImage", "Hero background image", "image"),
    field("availabilityStatus", "Available for work", "checkbox"),
    field("availabilityText", "Availability text"),
    field("primaryCtaLabel", "Primary button label"),
    field("primaryCtaUrl", "Primary button URL"),
    field("secondaryCtaLabel", "Secondary button label"),
    field("secondaryCtaUrl", "Secondary button URL"),
    field("orbitLabels", "Technology orbit labels (first 6 shown)", "list"),
  ],
  about: [
    field("title", "Section title"),
    field("description", "Description", "textarea"),
    field("introduction", "Professional introduction", "textarea"),
    field("paragraphs", "Additional paragraphs", "list"),
    field("profileImage", "Profile image", "image"),
    field("resumeLink", "Resume URL", "url"),
  ],
  contact: [
    field("email", "Email", "email"),
    field("phone", "Phone"),
    field("whatsapp", "WhatsApp URL", "url"),
    field("location", "Location"),
    field("formTitle", "Contact form title"),
    field("formDescription", "Contact form text", "textarea"),
    field("formRecipient", "Notification recipient email", "email"),
  ],
  socials: [
    field("linkedin", "LinkedIn URL", "url"),
    field("github", "GitHub URL", "url"),
    field("instagram", "Instagram URL", "url"),
    field("facebook", "Facebook URL", "url"),
    field("other", "Other professional links (JSON)", "json"),
  ],
  settings: [
    field("websiteTitle", "Website title"),
    field("logo", "Logo", "image"),
    field("favicon", "Favicon", "image"),
    field("sectionVisibility", "Section visibility", "sectionVisibility"),
    field("sectionOrder", "Section order", "sectionOrder"),
    field("sectionContent", "Section headings and descriptions", "sectionContent"),
    field("sectionStyles", "Section backgrounds", "sectionStyles"),
    field("navbar", "Navigation options", "navbar"),
    field("footerText", "Footer text", "textarea"),
    field("seoTitle", "SEO title"),
    field("seoDescription", "SEO description", "textarea"),
    field("ogImage", "Open Graph image", "image"),
  ],
  resume: [field("url", "Resume PDF", "resume")],
};

const sectionBackgroundOptions = [
  ["default", "Default"],
  ["surface", "Surface"],
  ["gradient", "Gradient"],
  ["accent", "Accent tint"],
];

const navbarFields = [
  ["showBrand", "Show site name / logo"],
  ["showLinks", "Show section links"],
  ["showContact", "Show contact button"],
  ["sticky", "Keep navigation sticky"],
];

const defaultSectionOrder = sectionOptions.map(([id]) => id);
const sharedColorKeys = ["primary", "secondary", "accent", "button", "buttonText", "gradientStart", "gradientEnd"];
const readStoredTheme = () => {
  try {
    const stored = localStorage.getItem("portfolio-theme");
    if (stored === "dark" || stored === "light") return stored;
    if (stored !== null) localStorage.removeItem("portfolio-theme");
  } catch (error) {
    console.warn("Unable to read the saved portfolio theme preference.", error);
  }
  return null;
};
const readAppearanceCache = () => {
  try {
    const stored = localStorage.getItem("portfolio-appearance-cache");
    if (!stored) return null;
    const cached = JSON.parse(stored);
    return cached && typeof cached === "object" ? cached : null;
  } catch (error) {
    console.warn("Unable to read cached portfolio appearance.", error);
    return null;
  }
};
const mergeAppearance = (appearance = {}) => {
  const legacyColors = appearance.colors || {};
  const safePalette = (palette, fallback) => Object.fromEntries(Object.entries(fallback).map(([key, defaultValue]) => [
    key,
    typeof palette?.[key] === "string" && /^#[\da-f]{3}(?:[\da-f]{3})?(?:[\da-f]{2})?$/i.test(palette[key])
      ? palette[key]
      : defaultValue,
  ]));
  const darkColors = safePalette({
      ...defaultAppearance.colors.dark,
      ...Object.fromEntries(sharedColorKeys.map((key) => [key, legacyColors[key] || defaultAppearance.colors.dark[key]])),
      background: legacyColors.background || defaultAppearance.colors.dark.background,
      text: legacyColors.text || defaultAppearance.colors.dark.text,
      heading: legacyColors.heading || defaultAppearance.colors.dark.heading,
      surface: legacyColors.surface || defaultAppearance.colors.dark.surface,
      card: legacyColors.card || defaultAppearance.colors.dark.card,
      border: legacyColors.border || defaultAppearance.colors.dark.border,
      ...legacyColors.dark,
    }, defaultAppearance.colors.dark);
  const lightColors = safePalette({
      ...defaultAppearance.colors.light,
      ...Object.fromEntries(sharedColorKeys.map((key) => [key, legacyColors[key] || defaultAppearance.colors.light[key]])),
      background: legacyColors.backgroundLight || defaultAppearance.colors.light.background,
      text: legacyColors.textLight || defaultAppearance.colors.light.text,
      heading: legacyColors.headingLight || defaultAppearance.colors.light.heading,
      surface: legacyColors.surfaceLight || defaultAppearance.colors.light.surface,
      card: legacyColors.cardLight || defaultAppearance.colors.light.card,
      border: legacyColors.borderLight || defaultAppearance.colors.light.border,
      ...legacyColors.light,
    }, defaultAppearance.colors.light);
  const defaultTheme = appearance.theme?.defaultTheme === "light" ? "light" : "dark";
  return {
    theme: {
      ...defaultAppearance.theme,
      ...appearance.theme,
      defaultTheme,
      toggleVisible: typeof appearance.theme?.toggleVisible === "boolean"
        ? appearance.theme.toggleVisible
        : defaultAppearance.theme.toggleVisible,
    },
    colors: { dark: darkColors, light: lightColors },
    typography: { ...defaultAppearance.typography, ...appearance.typography },
    design: { ...defaultAppearance.design, ...appearance.design },
  };
};

const safeArray = (value) => Array.isArray(value) ? value : [];
const titleCase = (value) => value.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const notify = useCallback((message, kind = "success") => {
    setToast({ message, kind });
    window.setTimeout(() => setToast(null), 4200);
  }, []);
  return (
    <ToastContext.Provider value={notify}>
      {children}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`toast toast-${toast.kind}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            role="status"
          >
            {toast.kind === "error" ? <X size={17} /> : <Check size={17} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}

function useToast() {
  return useContext(ToastContext);
}

function PublicNavigationItem({ item, location, onNavigate }) {
  const navigate = useNavigate();
  const iconMap = {
    home: Home,
    info: Info,
    sparkles: Sparkles,
    briefcase: BriefcaseBusiness,
    code: Code2,
    mail: Mail,
    globe: Globe2,
    "external-link": ExternalLink,
  };
  const Icon = iconMap[item.icon];
  if (item.type === "dropdown" || item.children?.length) {
    return (
      <details className="nav-dropdown" key={item.id}>
        <summary>{Icon && <Icon size={14} aria-hidden="true" />}<span>{item.label}</span><ChevronDown size={13} aria-hidden="true" /></summary>
        <div className="nav-dropdown-menu">
          {item.children?.map((child) => <PublicNavigationItem key={child.id} item={child} location={location} onNavigate={onNavigate} />)}
        </div>
      </details>
    );
  }
  const isActive = item.type === "anchor"
    ? location.hash === item.url
    : item.type === "internal" && location.pathname === item.url;
  const external = item.type === "external" || (item.type === "custom" && /^https?:/i.test(item.url));
  const target = item.target === "new" ? "_blank" : undefined;
  const handleClick = (event) => {
    onNavigate?.();
    if (item.type === "internal" && !target) {
      event.preventDefault();
      navigate(item.url);
    }
  };
  return (
    <SiteAnimation
      as="a"
      animationTarget="buttons-links"
      className={item.isCta ? "nav-contact" : ""}
      href={item.url}
      target={target}
      rel={target ? "noopener noreferrer" : undefined}
      aria-current={isActive ? "page" : undefined}
      data-active={isActive ? "true" : undefined}
      onClick={handleClick}
    >
      {Icon && <Icon size={14} aria-hidden="true" />}{item.label}
      {external && <ExternalLink size={12} aria-hidden="true" />}
    </SiteAnimation>
  );
}

function Loading({ label = "Loading" }) {
  return <div className="loading-state"><LoaderCircle className="spin" size={20} />{label}</div>;
}

function PublicPortfolio() {
  const [portfolio, setPortfolio] = useState({});
  const [content, setContent] = useState({});
  const [projects, setProjects] = useState([]);
  const [navigationConfig, setNavigationConfig] = useState(null);
  const [animations, setAnimations] = useState([]);
  const [mobileMenu, setMobileMenu] = useState({ location: "", open: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeProject, setActiveProject] = useState(null);
  const [theme, setTheme] = useState(readStoredTheme);
  const [cachedAppearance] = useState(readAppearanceCache);
  const location = useLocation();
  const profile = portfolio.profile || {};
  const settings = portfolio.settings || {};
  const socials = portfolio.socials || {};
  const savedAppearance = Object.keys(portfolio.appearance || {}).length
    ? portfolio.appearance
    : cachedAppearance || {};
  const appearance = mergeAppearance(savedAppearance);
  const typography = appearance.typography;
  const design = appearance.design;
  const legacyBackground = settings.backgroundColor;
  const currentLocation = `${location.pathname}${location.hash}`;
  const mobileMenuOpen = mobileMenu.location === currentLocation && mobileMenu.open;
  const closeMobileMenu = () => setMobileMenu({ location: currentLocation, open: false });

  useEffect(() => {
    if (!theme) return;
    try {
      localStorage.setItem("portfolio-theme", theme);
    } catch (error) {
      console.error("Unable to save the portfolio theme preference.", error);
    }
  }, [theme]);

  const activeTheme = theme || appearance.theme.defaultTheme;
  const activeColors = appearance.colors[activeTheme];
  const colors = activeTheme === "dark" &&
    !savedAppearance.colors?.dark?.background &&
    !savedAppearance.colors?.background &&
    legacyBackground
    ? { ...activeColors, background: legacyBackground }
    : activeColors;
  useEffect(() => {
    document.documentElement.dataset.portfolioTheme = activeTheme;
    document.documentElement.style.setProperty("--portfolio-boot-background", colors.background);
    document.documentElement.style.setProperty("--portfolio-boot-text", colors.text);
    if (!loading) {
      try {
        localStorage.setItem("portfolio-appearance-cache", JSON.stringify({
          theme: appearance.theme,
          colors: appearance.colors,
        }));
      } catch (error) {
        console.error("Unable to cache portfolio appearance for startup.", error);
      }
    }
  }, [activeTheme, colors.background, colors.text, appearance.theme, appearance.colors, loading]);
  useEffect(() => {
    loadWebFonts([typography.fontFamily, typography.headingFontFamily, typography.bodyFontFamily]);
  }, [typography.fontFamily, typography.headingFontFamily, typography.bodyFontFamily]);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get("portfolio"),
      api.get("content"),
      api.get("projects"),
      api.get("navigation").catch((requestError) => {
        console.error("Could not load public navigation configuration.", requestError);
        return null;
      }),
      api.get("animations").catch((requestError) => {
        console.error("Could not load public animation configuration.", requestError);
        return null;
      }),
    ]).then(([portfolioResponse, contentResponse, projectsResponse, navigationResponse, animationResponse]) => {
      if (!active) return;
      const portfolioData = portfolioResponse.data.portfolio || {};
      setPortfolio(portfolioData);
      setContent(contentResponse.data.content || {});
      setProjects(projectsResponse.data.projects || []);
      setNavigationConfig(navigationResponse?.data.navigation || null);
      setAnimations(animationResponse?.data.animations || []);
    }).catch((requestError) => {
      if (active) setError(requestError.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (settings.seoTitle || settings.websiteTitle) document.title = settings.seoTitle || settings.websiteTitle;
    const description = document.querySelector('meta[name="description"]');
    if (description && settings.seoDescription) description.content = settings.seoDescription;
    if (settings.ogImage) {
      let imageMeta = document.querySelector('meta[property="og:image"]');
      if (!imageMeta) {
        imageMeta = document.createElement("meta");
        imageMeta.setAttribute("property", "og:image");
        document.head.appendChild(imageMeta);
      }
      imageMeta.setAttribute("content", settings.ogImage);
    }
    if (settings.favicon) {
      let iconLink = document.querySelector('link[rel="icon"]');
      if (!iconLink) {
        iconLink = document.createElement("link");
        iconLink.setAttribute("rel", "icon");
        document.head.appendChild(iconLink);
      }
      iconLink.setAttribute("href", settings.favicon);
    }
  }, [settings.websiteTitle, settings.seoTitle, settings.seoDescription, settings.ogImage, settings.favicon]);

  const socialItems = [
    ["LinkedIn", socials.linkedin, ExternalLink, "linkedin"],
    ["GitHub", socials.github, Code2, "github"],
    ["Instagram", socials.instagram, Globe2, "instagram"],
    ["Facebook", socials.facebook, Globe2, "facebook"],
    ...safeArray(socials.other).map((item, index) => [
      item.label,
      item.url,
      ExternalLink,
      `other:${item.id || `legacy-other-${index}`}`,
      item.enabled !== false
    ])
  ];

  const sectionContent = settings.sectionContent || {};
  const sectionStyles = settings.sectionStyles || {};
  const sectionHeadings = {
    about: ["01", "About me", ""],
    skills: ["02", "Technical skills", "Tools and technologies I work with."],
    experience: ["03", "Experience", "A selection of roles and work."],
    projects: ["04", "Selected projects", "A few things I’ve built."],
    services: ["05", "Services", "Ways I can help move your product forward."],
    education: ["06", "Education", ""],
    certifications: ["07", "Certifications", ""],
    testimonials: ["08", "Kind words", ""],
    contact: ["09", "Let's build something meaningful.", ""],
  };
  const sectionHasContent = {
    hero: true,
    about: Boolean(
      portfolio.about?.title || portfolio.about?.description ||
      portfolio.about?.introduction || safeArray(portfolio.about?.paragraphs).length
    ),
    skills: safeArray(content.skills).length > 0,
    experience: safeArray(content.experience).length > 0,
    projects: projects.length > 0,
    services: safeArray(content.services).length > 0,
    education: safeArray(content.education).length > 0,
    certifications: safeArray(content.certifications).length > 0,
    testimonials: safeArray(content.testimonials).length > 0,
    contact: true,
  };
  const getHeading = (key) => {
    const [index, title, description] = sectionHeadings[key];
    return {
      index,
      title: sectionContent[key]?.title ?? title,
      description: sectionContent[key]?.description ?? description,
    };
  };
  const sectionClass = (key) => `section-background-${sectionStyles[key] || "default"}`;
  const allSections = {
    hero: <HeroSection key="hero" profile={profile} portfolio={portfolio} socialItems={socialItems} animationsEnabled={design.animations} className={sectionClass("hero")} />,
    about: <AboutSection key="about" data={portfolio.about || {}} heading={getHeading("about")} className={sectionClass("about")} />,
    skills: <SkillsSection key="skills" items={content.skills || []} heading={getHeading("skills")} className={sectionClass("skills")} settings={settings.skills || {}} />,
    experience: <ExperienceSection key="experience" items={content.experience || []} heading={getHeading("experience")} className={sectionClass("experience")} />,
    projects: <ProjectsSection key="projects" items={projects} onSelect={setActiveProject} heading={getHeading("projects")} className={sectionClass("projects")} />,
    services: <ServicesSection key="services" items={content.services || []} heading={getHeading("services")} className={sectionClass("services")} />,
    education: <EducationSection key="education" items={content.education || []} heading={getHeading("education")} className={sectionClass("education")} />,
    certifications: <CertificationSection key="certifications" items={content.certifications || []} heading={getHeading("certifications")} className={sectionClass("certifications")} />,
    testimonials: <TestimonialsSection key="testimonials" items={content.testimonials || []} heading={getHeading("testimonials")} className={sectionClass("testimonials")} />,
    contact: <ContactSection key="contact" data={portfolio.contact || {}} heading={getHeading("contact")} className={sectionClass("contact")} />,
  };
  const configuredOrder = [...new Set(safeArray(settings.sectionOrder).filter((name) => allSections[name]))];
  const sectionOrder = [
    ...configuredOrder,
    ...defaultSectionOrder.filter((name) => !configuredOrder.includes(name)),
  ];
  const visibleSections = sectionOrder
    .filter((name) => allSections[name] && settings.sectionVisibility?.[name] !== false)
    .map((name) => allSections[name]);
  const navAppearance = navigationConfig?.appearance || {};
  const navColors = navAppearance.colors?.[activeTheme] || {};
  const navigationEnabled = (items) => safeArray(items).flatMap((item) => {
    if (item.isCta && (navigationConfig?.showContact === false || settings.navbar?.showContact === false)) return [];
    if (item.type === "anchor") {
      const section = item.url.slice(1) === "home" ? "hero" : item.url.slice(1);
      if (settings.sectionVisibility?.[section] === false) return [];
      if (section in sectionHasContent && !sectionHasContent[section]) return [];
    }
    const children = navigationEnabled(item.children);
    if (item.type === "dropdown" && !children.length) return [];
    return [{ ...item, children }];
  });
  const siteNavItems = navigationEnabled(navigationConfig?.items);
  const showBrand = settings.navbar?.showBrand !== false &&
    navigationConfig?.showBrand !== false && navAppearance.logoVisible !== false;
  const showLinks = settings.navbar?.showLinks !== false && navigationConfig?.showLinks !== false;
  const renderLinks = showLinks && siteNavItems.length > 0;
  const mobileMenuEnabled = renderLinks && (
    navAppearance.mobileLayout === "hamburger" ||
    navAppearance.tabletLayout === "hamburger"
  );
  const navStyle = {
    position: navAppearance.position || (settings.navbar?.sticky === false ? "static" : "sticky"),
    top: navAppearance.position === "fixed" ? 0 : undefined,
    left: navAppearance.position === "fixed" ? 0 : undefined,
    right: navAppearance.position === "fixed" ? 0 : undefined,
    width: "100%",
    maxWidth: navAppearance.navbarWidth ? `${navAppearance.navbarWidth}px` : undefined,
    marginInline: "auto",
    minHeight: navAppearance.navbarHeight ? `${navAppearance.navbarHeight}px` : undefined,
    paddingInline: `${navAppearance.paddingX ?? 64}px`,
    gap: `${navAppearance.spacing ?? 24}px`,
    justifyContent: navAppearance.alignment === "left" ? "flex-start" : navAppearance.alignment === "center" ? "center" : navAppearance.alignment === "right" ? "flex-end" : "space-between",
    fontFamily: `"${navAppearance.fontFamily || typography.bodyFontFamily || typography.fontFamily}", sans-serif`,
    fontSize: `${navAppearance.fontSize ?? 11}px`,
    fontWeight: navAppearance.fontWeight ?? 500,
    "--nav-spacing": `${navAppearance.spacing ?? 24}px`,
    "--nav-background": navColors.background || "var(--site-card)",
    "--nav-border": navColors.border || "var(--site-border)",
    background: navColors.background || undefined,
    borderBottom: `${navAppearance.borderWidth ?? 1}px solid ${navColors.border || "var(--site-border)"}`,
    borderRadius: `${navAppearance.borderRadius ?? 8}px`,
    boxShadow: navAppearance.shadow === "none" ? "none" : navAppearance.shadow === "strong" ? "0 12px 32px rgba(0,0,0,.24)" : navAppearance.shadow === "medium" ? "0 8px 22px rgba(0,0,0,.18)" : "0 4px 14px rgba(0,0,0,.12)",
    "--nav-text": navColors.text || "var(--site-text)",
    "--nav-active": navColors.active || "var(--site-primary)",
    "--nav-hover": navColors.hover || "var(--site-heading)",
    "--nav-focus": navColors.focus || "var(--site-secondary)",
    "--nav-transition": `${navAppearance.transitionDuration ?? 0.2}s`,
    "--nav-logo-width": `${navAppearance.logoWidth ?? 31}px`,
    "--nav-logo-height": `${navAppearance.logoHeight ?? 31}px`,
  };
  if (loading) return <Loading label="Loading portfolio" />;

  return (
    <SiteAnimationProvider animations={animations} enabled={design.animations}>
    <main className="site-shell" data-theme={activeTheme} data-grid={design.gridBackground} data-decoration={design.decorativeElements} data-animations={design.animations} data-gradient={design.backgroundGradient} data-card-style={design.cardStyle} data-button-style={design.buttonStyle} data-section-background={design.sectionBackground} data-radius={design.borderRadius} style={{
      paddingTop: navAppearance.position === "fixed" ? `${navAppearance.navbarHeight || 76}px` : undefined,
      "--accent": colors.primary,
      "--accent-secondary": colors.secondary,
      "--site-primary": colors.primary,
      "--site-background": colors.background,
      "--site-text": colors.text,
      "--site-heading": colors.heading,
      "--site-surface": colors.surface,
      "--site-card": colors.card,
      "--site-border": colors.border,
      "--site-button": colors.button,
      "--site-button-text": colors.buttonText,
      "--site-accent": colors.accent,
      "--site-gradient-start": colors.gradientStart,
      "--site-gradient-end": colors.gradientEnd,
      "--site-font": `"${typography.bodyFontFamily || typography.fontFamily}", sans-serif`,
      "--site-heading-font": `"${typography.headingFontFamily || typography.fontFamily}", sans-serif`,
      "--site-heading-size": `${typography.headingSize}px`,
      "--site-font-weight": typography.fontWeight,
      "--site-heading-weight": typography.headingWeight,
      "--site-line-height": typography.lineHeight,
      "--site-letter-spacing": `${typography.letterSpacing}em`,
      "--site-body-size": `${typography.bodySize}px`,
      "--site-radius": design.borderRadius === "sharp" ? "2px" : design.borderRadius === "rounded" ? "18px" : "9px",
      "--site-section-spacing": `${design.sectionSpacing}px`,
      "--site-section-bg": design.sectionBackground,
    }}>
      {error && <div className="site-error" role="alert">Could not load portfolio content: {error}</div>}
      <SiteAnimation as="header" animationTarget="navbar" className={`site-nav nav-desktop-${navAppearance.desktopLayout || "horizontal"} nav-tablet-${navAppearance.tabletLayout || "compact"} nav-mobile-${navAppearance.mobileLayout || "hamburger"} nav-menu-${navAppearance.mobileMenuBehavior || "dropdown"} ${mobileMenuOpen ? "nav-mobile-open" : ""}`}       data-brand={showBrand} data-alignment={navAppearance.alignment || "space-between"} data-mobile-layout={navAppearance.mobileLayout || "hamburger"} data-tablet-layout={navAppearance.tabletLayout || "compact"} data-dropdown-animation={navAppearance.dropdownAnimation || "fade"} style={navStyle}>
        {showBrand && <a className="brand-mark" href="#home" aria-label="Home">
          {settings.logo ? <img src={settings.logo} alt="" /> : <span>{profile.name?.slice(0, 1) || "•"}</span>}
          <span>{settings.websiteTitle || profile.name || ""}</span>
        </a>}
        {renderLinks && <nav className="site-links" id="public-navigation" aria-label="Main navigation">
          {siteNavItems.map((item) => <PublicNavigationItem key={item.id} item={item} location={location} onNavigate={closeMobileMenu} />)}
        </nav>}
        {mobileMenuEnabled && <button className="site-menu-toggle" type="button" aria-controls="public-navigation" aria-expanded={mobileMenuOpen} aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"} onClick={() => setMobileMenu({ location: currentLocation, open: !mobileMenuOpen })}><Menu size={18} /></button>}
        {appearance.theme?.toggleVisible && <button className="theme-toggle" type="button" onClick={() => setTheme(activeTheme === "dark" ? "light" : "dark")} aria-label={`Switch to ${activeTheme === "dark" ? "light" : "dark"} theme`}>{activeTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}</button>}
      </SiteAnimation>

      {visibleSections}
      <SiteAnimation as="footer" animationTarget="footer" className="site-footer">
        <SiteAnimation as="a" animationTarget="buttons-links" className="brand-mark" href="#home"><span>{profile.name?.slice(0, 1) || "•"}</span><span>{profile.name || ""}</span></SiteAnimation>
        <SiteAnimation as="p" animationTarget="text">{settings.footerText || ""}</SiteAnimation>
        <SiteAnimation as="a" animationTarget="buttons-links" href="#home" className="back-top">Back to top <ArrowUpRight size={14} /></SiteAnimation>
      </SiteAnimation>
      <AnimatePresence>
        {activeProject && <ProjectModal project={activeProject} onClose={() => setActiveProject(null)} />}
      </AnimatePresence>
    </main>
    </SiteAnimationProvider>
  );
}

function SectionHeading({ index, title, description }) {
  return (
    <div className="section-heading">
      <span className="section-index">{index} /</span>
      <div><SiteAnimation as="h2" animationTarget="headings">{title}</SiteAnimation>{description && <SiteAnimation as="p" animationTarget="text">{description}</SiteAnimation>}</div>
    </div>
  );
}

function AboutSection({ data, heading, className = "" }) {
  if (!data.description && !data.introduction && !safeArray(data.paragraphs).length && !data.title) return null;
  return (
    <SiteAnimation as="section" animationTarget="about" className={`content-section about-section ${className}`} id="about">
      <SectionHeading index={heading.index} title={data.title || heading.title} description={data.description || heading.description} />
      <div className="about-body">
        {data.profileImage && <SiteAnimation as="div" animationTarget="images" className="about-image"><img src={data.profileImage} alt="" /></SiteAnimation>}
        <div className="about-text">
          {data.introduction && <SiteAnimation as="p" animationTarget="text" className="lead-text">{data.introduction}</SiteAnimation>}
          {safeArray(data.paragraphs).map((paragraph, index) => <SiteAnimation as="p" animationTarget="text" key={index}>{paragraph}</SiteAnimation>)}
          {data.resumeLink && <SiteAnimation as="a" animationTarget="buttons-links" className="text-link" href={data.resumeLink} target="_blank" rel="noreferrer">View resume <ArrowUpRight size={15} /></SiteAnimation>}
        </div>
      </div>
    </SiteAnimation>
  );
}

function ExperienceSection({ items, heading, className = "" }) {
  if (!items.length) return null;
  return (
    <SiteAnimation as="section" animationTarget="experience" className={`content-section ${className}`} id="experience">
      <SectionHeading {...heading} />
      <div className="timeline">
        {items.map((item, index) => (
          <SiteAnimation as="article" animationTarget="text" delayIndex={index} className="timeline-item" key={item._id}>
            <span className="timeline-dot" />
            <div className="timeline-meta"><span>{item.startDate}{item.startDate && " — "}{item.currentlyWorking ? "Present" : item.endDate}</span><span>{item.location}</span></div>
            <h3>{item.jobTitle}</h3><p className="muted">{[item.company, item.employmentType].filter(Boolean).join(" · ")}</p>
            {item.description && <p>{item.description}</p>}
            {!!item.responsibilities?.length && <ul>{item.responsibilities.map((text, index) => <li key={index}>{text}</li>)}</ul>}
            {!!item.technologies?.length && <div className="tag-row">{item.technologies.map((technology) => <span key={technology}>{technology}</span>)}</div>}
          </SiteAnimation>
        ))}
      </div>
    </SiteAnimation>
  );
}

function ProjectsSection({ items, onSelect, heading, className = "" }) {
  if (!items.length) return null;
  return (
    <SiteAnimation as="section" animationTarget="projects" className={`content-section projects-section ${className}`} id="projects">
      <SectionHeading {...heading} />
      <div className="projects-grid">
        {items.map((project, index) => (
          <SiteAnimation as="article" animationTarget="project-cards" delayIndex={index} className="project-card" key={project._id}>
            <SiteAnimation as="button" animationTarget="buttons-links" type="button" className="project-visual" onClick={() => onSelect(project)} aria-label={`View ${project.title}`}>
              {project.thumbnail ? <SiteAnimation as="img" animationTarget="images" src={project.thumbnail} alt="" loading="lazy" /> : <div className="project-empty"><Code2 size={34} /></div>}
              <span className="project-open"><ArrowUpRight size={20} /></span>
              {project.featured && <span className="featured-pill"><Sparkles size={12} /> Featured</span>}
            </SiteAnimation>
            <div className="project-info">
              <div><SiteAnimation as="p" animationTarget="text" className="project-category">{project.category || ""}</SiteAnimation><SiteAnimation as="h3" animationTarget="headings">{project.title}</SiteAnimation></div>
              <SiteAnimation as="button" animationTarget="buttons-links" type="button" className="round-link" onClick={() => onSelect(project)} aria-label={`Project details: ${project.title}`}><ArrowUpRight size={18} /></SiteAnimation>
            </div>
            <SiteAnimation as="p" animationTarget="text" className="project-description">{project.shortDescription}</SiteAnimation>
            <div className="tag-row">{safeArray(project.techStack).map((technology) => <span key={technology}>{technology}</span>)}</div>
            <div className="project-actions">
              {project.liveUrl && <a className="project-action-primary" href={project.liveUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>Live demo <ArrowUpRight size={14} /></a>}
              {project.githubUrl && <a className="project-action-secondary" href={project.githubUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}><Code2 size={14} /> Source code</a>}
            </div>
          </SiteAnimation>
        ))}
      </div>
    </SiteAnimation>
  );
}

function ProjectModal({ project, onClose }) {
  const images = [project.thumbnail, ...safeArray(project.galleryAssets).map((asset) => asset.url), ...safeArray(project.gallery)]
    .filter((url, index, list) => url && list.indexOf(url) === index);
  const descriptionSections = parseProjectDescription(project.description || project.shortDescription);
  const technologySection = descriptionSections.find((section) => section.kind === "technologies");
  const contentSections = descriptionSections.filter((section) => section.kind !== "technologies");
  const technologies = safeArray(project.techStack);
  const sectionTitle = (section) => ({
    overview: "Project Overview",
    features: "Key Features",
    highlights: "Project Highlights",
    technologies: "Technologies Used",
  }[section.kind] || section.heading);
  return (
    <motion.div className="modal-backdrop" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.article className="project-modal" onClick={(event) => event.stopPropagation()} initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}>
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close project"><X size={20} /></button>
        <div className="modal-gallery">{images.map((url) => <img src={url} alt={project.title || ""} key={url} />)}</div>
        <p className="project-category">{project.category || ""}</p><h2>{project.title}</h2>
        <div className="project-modal-content">
          {contentSections.map((section, sectionIndex) => (
            <section className="project-detail-section" key={`${section.kind}-${section.heading}-${sectionIndex}`}>
              <h3>{sectionTitle(section)}</h3>
              {section.blocks.map((block, blockIndex) => {
                if (block.type === "subheading") return <h4 key={`${block.type}-${blockIndex}`}>{block.text}</h4>;
                if (block.type === "list") return <ul key={`${block.type}-${blockIndex}`}>{block.items.map((item, itemIndex) => <li key={`${itemIndex}-${item}`}>{item}</li>)}</ul>;
                return <p key={`${block.type}-${blockIndex}`}>{block.text}</p>;
              })}
            </section>
          ))}
          {(technologies.length > 0 || technologySection) && (
            <section className="project-detail-section project-technologies">
              <h3>Technologies Used</h3>
              {technologySection?.blocks.map((block, index) => block.type === "list"
                ? <ul key={`technology-list-${index}`}>{block.items.map((item, itemIndex) => <li key={`${itemIndex}-${item}`}>{item}</li>)}</ul>
                : <p key={`technology-copy-${index}`}>{block.text}</p>)}
              {technologies.length > 0 && <div className="project-modal-tech">{technologies.map((technology) => <span key={technology}>{technology}</span>)}</div>}
            </section>
          )}
        </div>
        <div className="modal-actions">
          {project.liveUrl && <a className="button button-primary" href={project.liveUrl} target="_blank" rel="noreferrer">Live demo <ArrowUpRight size={16} /></a>}
          {project.githubUrl && <a className="button button-quiet" href={project.githubUrl} target="_blank" rel="noreferrer"><Code2 size={16} /> Source code</a>}
        </div>
      </motion.article>
    </motion.div>
  );
}

function ServicesSection({ items, heading, className = "" }) {
  if (!items.length) return null;
  return (
    <SiteAnimation as="section" animationTarget="services" className={`content-section ${className}`} id="services">
      <SectionHeading {...heading} />
      <div className="service-grid">{items.map((item, index) => (
        <SiteAnimation as="article" animationTarget="service-cards" delayIndex={index} className="service-card" key={item._id}><span>0{index + 1}</span><SiteAnimation as="h3" animationTarget="headings">{item.title}</SiteAnimation><SiteAnimation as="p" animationTarget="text">{item.description}</SiteAnimation></SiteAnimation>
      ))}</div>
    </SiteAnimation>
  );
}

function EducationSection({ items, heading, className = "" }) {
  if (!items.length) return null;
  return (
    <SiteAnimation as="section" animationTarget="education" className={`content-section ${className}`} id="education">
      <SectionHeading {...heading} />
      <div className="education-list">{items.map((item) => (
        <SiteAnimation as="article" animationTarget="text" key={item._id}><GraduationCap size={19} /><div><SiteAnimation as="h3" animationTarget="headings">{item.degree}</SiteAnimation><SiteAnimation as="p" animationTarget="text">{item.institution}</SiteAnimation>{item.description && <SiteAnimation as="p" animationTarget="text">{item.description}</SiteAnimation>}</div><span>{[item.startDate, item.endDate].filter(Boolean).join(" — ")}</span></SiteAnimation>
      ))}</div>
    </SiteAnimation>
  );
}

function CertificationSection({ items, heading, className = "" }) {
  if (!items.length) return null;
  return (
    <SiteAnimation as="section" animationTarget="certifications" className={`content-section ${className}`} id="certifications">
      <SectionHeading {...heading} />
      <div className="cert-grid">{items.map((item) => (
        <SiteAnimation as="article" animationTarget="text" key={item._id} className="cert-card">{item.image && <SiteAnimation as="img" animationTarget="images" src={item.image} alt="" loading="lazy" />}<div><SiteAnimation as="p" animationTarget="text" className="project-category">{item.organization}</SiteAnimation><SiteAnimation as="h3" animationTarget="headings">{item.title}</SiteAnimation><SiteAnimation as="p" animationTarget="text">{item.issueDate}</SiteAnimation>{item.credentialUrl && <SiteAnimation as="a" animationTarget="buttons-links" href={item.credentialUrl} target="_blank" rel="noreferrer">View credential <ArrowUpRight size={14} /></SiteAnimation>}</div></SiteAnimation>
      ))}</div>
    </SiteAnimation>
  );
}

function TestimonialsSection({ items, heading, className = "" }) {
  if (!items.length) return null;
  return (
    <SiteAnimation as="section" animationTarget="testimonials" className={`content-section ${className}`} id="testimonials">
      <SectionHeading {...heading} />
      <div className="testimonial-grid">{items.map((item) => (
        <SiteAnimation as="article" animationTarget="text" className="testimonial-card" key={item._id}><span className="quote-mark">“</span><SiteAnimation as="p" animationTarget="text">{item.testimonial}</SiteAnimation><div className="testimonial-author">{item.profileImage && <SiteAnimation as="img" animationTarget="images" src={item.profileImage} alt="" />}<div><strong>{item.name}</strong><span>{[item.designation, item.company].filter(Boolean).join(" · ")}</span></div></div></SiteAnimation>
      ))}</div>
    </SiteAnimation>
  );
}

function ContactSection({ data, heading, className = "" }) {
  const notify = useToast();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const update = (event) => setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const { data: response } = await api.post("contact", form);
      notify(response.message);
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <SiteAnimation as="section" animationTarget="contact" className={`content-section contact-section ${className}`} id="contact">
      <SectionHeading {...heading} title={data.formTitle || heading.title} description={data.formDescription || heading.description} />
      <div className="contact-grid">
        <div className="contact-details">
          {data.email && <a href={`mailto:${data.email}`}><Mail size={17} />{data.email}</a>}
          {data.phone && <a href={`tel:${data.phone}`}><MessageCircle size={17} />{data.phone}</a>}
          {data.location && <p><Globe2 size={17} />{data.location}</p>}
          {data.whatsapp && <a href={data.whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={17} />WhatsApp</a>}
        </div>
        <form className="contact-form" onSubmit={submit}>
          <div className="form-two"><label>Name<input name="name" value={form.name} onChange={update} required minLength={2} maxLength={100} /></label><label>Email<input name="email" type="email" value={form.email} onChange={update} required maxLength={254} /></label></div>
          <label>Subject<input name="subject" value={form.subject} onChange={update} required maxLength={160} /></label>
          <label>Message<textarea name="message" value={form.message} onChange={update} required minLength={10} maxLength={5000} rows="5" /></label>
          <SiteAnimation as="button" animationTarget="buttons-links" className="button button-primary" type="submit" disabled={busy}>{busy ? "Sending…" : "Send message"}{busy ? <LoaderCircle className="spin" size={16} /> : <Send size={16} />}</SiteAnimation>
        </form>
      </div>
    </SiteAnimation>
  );
}

function AppRoutes() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const [admin, setAdmin] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const checkingAuth = isAdminRoute && !authChecked;
  useEffect(() => {
    if (!isAdminRoute || authChecked) return undefined;
    let active = true;
    api.get("auth/me")
      .then(({ data }) => {
        if (active) setAdmin(data.admin);
      })
      .catch(() => {
        if (active) setAdmin(null);
      })
      .finally(() => {
        if (active) setAuthChecked(true);
      });
    return () => { active = false; };
  }, [isAdminRoute, authChecked]);
  const authValue = useMemo(() => ({ admin, setAdmin, checkingAuth }), [admin, checkingAuth]);

  return (
    <AuthContext.Provider value={authValue}>
      <Routes>
        <Route path="/*" element={<PublicPortfolio />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin" element={<ProtectedAdmin><AdminLayout /></ProtectedAdmin>}>
          <Route index element={<AdminDashboard />} />
          <Route path=":section" element={<ContentManager />} />
        </Route>
      </Routes>
    </AuthContext.Provider>
  );
}

function ProtectedAdmin({ children }) {
  const { admin, checkingAuth } = useContext(AuthContext);
  if (checkingAuth) return <Loading label="Checking your session" />;
  return admin ? children : <Navigate to="/admin/login" replace />;
}

function LoginPage() {
  const { admin, setAdmin, checkingAuth } = useContext(AuthContext);
  const notify = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  if (checkingAuth) return <Loading label="Checking your session" />;
  if (admin) return <Navigate to="/admin" replace />;
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post("auth/login", form);
      setAdmin(data.admin);
      navigate("/admin", { replace: true });
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="login-shell">
      <div className="login-decoration"><span /><span /><span /></div>
      <Link to="/" className="login-back"><ArrowLeft size={16} /> Back to portfolio</Link>
      <form className="login-card" onSubmit={submit}>
        <div className="login-icon"><LockKeyhole size={21} /></div>
        <p className="eyebrow">Private workspace</p><h1>Welcome back.</h1><p className="muted">Sign in to manage your portfolio.</p>
        <label>Email address<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="username" required /></label>
        <label>Password<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="current-password" required /></label>
        <button className="button button-primary login-submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}{busy ? <LoaderCircle className="spin" size={16} /> : <ArrowRight size={16} />}</button>
        <p className="login-note">Administrator access only</p>
      </form>
    </main>
  );
}

function AdminLayout() {
  const { admin, setAdmin } = useContext(AuthContext);
  const notify = useToast();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const logout = async () => {
    try {
      await api.post("auth/logout");
      setAdmin(null);
      navigate("/admin/login");
    } catch (error) {
      notify(error.message, "error");
    }
  };
  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <Link to="/" className="admin-brand"><span className="brand-orb">✳</span><div><strong>Portfolio CMS</strong><small>PERSONAL WORKSPACE</small></div></Link>
        <div className="sidebar-label">Workspace</div>
        <nav className="admin-nav">
          {navigation.map(([label, path, Icon]) => (
            <NavLink key={path} to={path === "dashboard" ? "/admin" : `/admin/${path}`} end={path === "dashboard"} onClick={() => setMenuOpen(false)}>
              <Icon size={17} /><span>{label}</span>{path === "dashboard" && <ArrowRight size={14} className="nav-trailing" />}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="admin-user"><span>{admin?.name?.slice(0, 1) || "A"}</span><div><strong>{admin?.name}</strong><small>{admin?.email}</small></div></div>
          <button className="logout-button" onClick={logout}><LogOut size={16} /> Log out</button>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar"><button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu"><Menu size={20} /></button><div><span className="topbar-path">Workspace</span><ChevronDown size={14} /><span>Portfolio CMS</span></div><Link to="/" target="_blank" className="preview-link">View site <ArrowUpRight size={14} /></Link></header>
        <div className="admin-content"><Outlet /></div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([
      api.get("projects/admin/all"),
      api.get("contact/admin/summary"),
      ...[...managedTypes].map((type) => api.get(`content/${type}`)),
    ]).then(([projectResponse, messageResponse, ...contentResponses]) => {
      const projects = projectResponse.data.projects || [];
      const entries = contentResponses.flatMap((response) => response.data.items || []);
      const recentActivity = [
        ...projects.map((project) => ({
          id: `project-${project._id}`,
          label: project.title,
          detail: `${project.status === "published" ? "Published" : "Updated"} project`,
          createdAt: project.updatedAt || project.createdAt,
          kind: "project",
        })),
        ...(messageResponse.data.recent || []).map((message) => ({
          id: `message-${message._id}`,
          label: message.subject,
          detail: `Message from ${message.name}`,
          createdAt: message.createdAt,
          kind: "message",
        })),
      ].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)).slice(0, 6);
      setStats({
        projects: projects.length,
        published: projects.filter((project) => project.status === "published").length,
        drafts: projects.filter((project) => project.status === "draft").length,
        skills: contentResponses[0].data.items?.length || 0,
        experience: contentResponses[1].data.items?.length || 0,
        messages: messageResponse.data.total,
        unreadMessages: messageResponse.data.unread,
        recentActivity,
        entries,
      });
    }).catch((requestError) => setError(requestError.message));
  }, []);
  if (error) return <div className="admin-error"><X size={19} />{error}</div>;
  if (!stats) return <Loading label="Loading dashboard" />;
  return (
    <div className="dashboard-page">
      <div className="admin-page-heading"><div><p className="admin-kicker">OVERVIEW</p><h1>Dashboard</h1><p>Here’s what’s happening with your portfolio.</p></div><Link to="/" target="_blank" className="button button-primary">Preview portfolio <ArrowUpRight size={16} /></Link></div>
      <div className="stats-grid">
        <StatCard label="Total projects" value={stats.projects} icon={Globe2} color="violet" />
        <StatCard label="Published" value={stats.published} icon={Check} color="green" />
        <StatCard label="Drafts" value={stats.drafts} icon={Pencil} color="orange" />
        <StatCard label="Skills" value={stats.skills} icon={Code2} color="blue" />
        <StatCard label="Experience" value={stats.experience} icon={BriefcaseBusiness} color="pink" />
        <StatCard label="CMS entries" value={stats.entries.length} icon={LayoutDashboard} color="slate" />
        <StatCard label="Messages" value={stats.messages} icon={Mail} color="blue" />
        <StatCard label="Unread messages" value={stats.unreadMessages} icon={MessageCircle} color="orange" />
      </div>
      <div className="dashboard-columns">
        <section className="admin-panel">
          <div className="panel-heading"><div><h2>Recent activity</h2><p>Latest project and contact updates</p></div><Link to="/admin/projects" className="text-link">Projects <ArrowRight size={14} /></Link></div>
          {stats.recentActivity.length ? <div className="recent-list">{stats.recentActivity.map((activity) => <div className="recent-project" key={activity.id}><div className="recent-thumb">{activity.kind === "project" ? <Code2 size={17} /> : <Mail size={17} />}</div><div><strong>{activity.label}</strong><span>{activity.detail} · {new Date(activity.createdAt).toLocaleDateString()}</span></div></div>)}</div> : <EmptyState title="No recent activity" text="Project updates and contact messages will appear here." />}
        </section>
        <section className="admin-panel quick-panel">
          <div className="panel-heading"><div><h2>Quick links</h2><p>Jump back into your work</p></div></div>
          {navigation.slice(1, 6).map(([label, path, Icon]) => <Link className="quick-link" to={`/admin/${path}`} key={path}><span><Icon size={17} /></span>{label}<ArrowUpRight size={15} /></Link>)}
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  return <article className="stat-card"><span className={`stat-icon stat-${color}`}><Icon size={18} /></span><div><strong>{value}</strong><span>{label}</span></div><ArrowUpRight className="stat-arrow" size={15} /></article>;
}

function ContentManager() {
  const { section } = useParams();
  const notify = useToast();
  const match = navigation.find((item) => item[1] === section);
  if (!match) return <Navigate to="/admin" replace />;
  if (section === "projects") return <ProjectManager />;
  if (section === "contact-messages") return <ContactInbox />;
  if (section === "appearance") return <AppearanceEditor />;
  if (section === "navigation") return <NavigationManager notify={notify} />;
  if (section === "animations") return <AnimationManager notify={notify} />;
  if (section === "skills") return <SkillsManager />;
  if (managedTypes.has(section)) return <ContentListManager key={section} type={section} title={match[0]} />;
  if (section === "resume") return <PortfolioEditor section="resume" title={match[0]} />;
  if (section === "profile") return <HeroManager notify={notify} />;
  if (section === "about" || section === "contact") return <PortfolioEditor section={section} title={match[0]} />;
  if (section === "social-links") return <PortfolioEditor section="socials" title={match[0]} />;
  if (section === "website-settings" || section === "seo-settings") return <PortfolioEditor section="settings" title={match[0]} seoOnly={section === "seo-settings"} />;
  return <Navigate to="/admin" replace />;
}

function ContentListManager({ type, title }) {
  const notify = useToast();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({});
  const [retiredAssets, setRetiredAssets] = useState([]);
  const fields = contentFields[type];
  const load = useCallback(() => api.get(`content/${type}`).then(({ data }) => setItems(data.items || [])).catch((error) => notify(error.message, "error")).finally(() => setLoading(false)), [type, notify]);
  useEffect(() => { load(); }, [load]);
  const save = async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(Object.entries(editing).filter(([key]) =>
      !["visible", "displayOrder", "_id", "title", "type"].includes(key)
    ));
    const { visible = true, displayOrder = 0, _id } = editing;
    setSaving(true);
    try {
      if (_id) await api.put(`content/${type}/${_id}`, { data, visible, displayOrder });
      else await api.post(`content/${type}`, { data, visible, displayOrder });
      let cleanupFailed = false;
      for (const asset of retiredAssets) {
        try {
          await api.delete("upload/image", { data: { publicId: asset.publicId, imageUrl: asset.url } });
        } catch {
          cleanupFailed = true;
        }
      }
      notify(`${title} saved.`);
      if (cleanupFailed) notify("Content saved; an old image is still referenced and was kept.", "error");
      setRetiredAssets([]);
      setEditing(null);
      await load();
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setSaving(false);
    }
  };
  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`content/${type}/${item._id}`);
      const assets = [
        ...(item.imagePublicId ? [{ publicId: item.imagePublicId, url: item.image }] : []),
        ...(item.profileImagePublicId ? [{ publicId: item.profileImagePublicId, url: item.profileImage }] : []),
      ];
      let cleanupFailed = false;
      for (const asset of assets) {
        try {
          await api.delete("upload/image", { data: { publicId: asset.publicId, imageUrl: asset.url } });
        } catch {
          cleanupFailed = true;
        }
      }
      notify("Item deleted.");
      if (cleanupFailed) notify("Item deleted; an image still used elsewhere was kept.", "error");
      await load();
    } catch (error) {
      notify(error.message, "error");
    }
  };
  const uploadField = async (fieldName, file) => {
    if (!file) return;
    const body = new FormData();
    body.append("image", file);
    const previousPublicId = editing?.[`${fieldName}PublicId`];
    if (previousPublicId && editing[fieldName]) {
      setRetiredAssets((current) => [...current, {
        publicId: previousPublicId,
        url: editing[fieldName],
      }]);
    }
    setUploading((current) => ({ ...current, [fieldName]: 1 }));
    try {
      const { data } = await api.post("upload/image", body, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progress) => setUploading((current) => ({ ...current, [fieldName]: Math.round((progress.loaded / (progress.total || progress.loaded || 1)) * 100) })),
      });
      setEditing((current) => ({ ...current, [fieldName]: data.image.url, [`${fieldName}PublicId`]: data.image.publicId }));
      notify("Image uploaded.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setUploading((current) => ({ ...current, [fieldName]: 0 }));
    }
  };
  const filtered = items.filter((item) => `${item.title} ${item.company || ""} ${item.category || ""}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="manager-page">
      <div className="admin-page-heading"><div><p className="admin-kicker">CONTENT MANAGEMENT</p><h1>{title}</h1><p>Create, update, and organize your {title.toLowerCase()}.</p></div><button className="button button-primary" onClick={() => { setRetiredAssets([]); setEditing({ visible: true, displayOrder: 0 }); }}><Plus size={17} /> Add {title.slice(0, -1) || "item"}</button></div>
      <div className="manager-toolbar"><div className="search-field"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${title.toLowerCase()}…`} /></div><span className="item-count">{filtered.length} items</span></div>
      {loading ? <Loading label={`Loading ${title.toLowerCase()}`} /> : filtered.length ? (
        <div className="content-table">{filtered.map((item) => <article className="content-row" key={item._id}>
          {item.image || item.profileImage ? <img className="row-avatar" src={item.image || item.profileImage} alt="" /> : <span className="row-avatar row-avatar-icon"><Sparkles size={17} /></span>}
          <div className="row-main"><strong>{item.title}</strong><span>{[item.category, item.company, item.institution, item.organization].filter(Boolean).join(" · ") || type}</span></div>
          <span className={`status-pill ${item.visible ? "status-published" : "status-draft"}`}>{item.visible ? "Visible" : "Hidden"}</span>
          <div className="row-actions"><button title="Edit" onClick={() => { setRetiredAssets([]); setEditing({ ...item }); }}><Pencil size={16} /></button><button title="Delete" className="delete-action" onClick={() => remove(item)}><Trash2 size={16} /></button></div>
        </article>)}</div>
      ) : <EmptyState title={`No ${title.toLowerCase()} found`} text="Add your first entry when you're ready." action={<button className="button button-primary" onClick={() => { setRetiredAssets([]); setEditing({ visible: true, displayOrder: 0 }); }}><Plus size={15} /> Add entry</button>} />}
      <AnimatePresence>{editing && (
        <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditing(null)}>
          <motion.div className="editor-modal" initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }} onClick={(event) => event.stopPropagation()}>
            <div className="editor-heading"><div><p className="admin-kicker">{editing._id ? "EDIT ENTRY" : "NEW ENTRY"}</p><h2>{editing._id ? "Update" : "Create"} {title.slice(0, -1) || "entry"}</h2></div><button className="icon-button" onClick={() => setEditing(null)} aria-label="Close"><X size={19} /></button></div>
            <form onSubmit={save} className="editor-form">
              <div className="editor-fields">{fields.map((definition) => <FormField key={definition.name} definition={definition} value={editing[definition.name]} onChange={(value) => setEditing((current) => ({ ...current, [definition.name]: value }))} onUpload={uploadField} uploadProgress={uploading[definition.name]} />)}</div>
              <div className="form-two form-meta">
                <FormField definition={field("displayOrder", "Display order", "number")} value={editing.displayOrder ?? 0} onChange={(value) => setEditing((current) => ({ ...current, displayOrder: value }))} />
                <FormField definition={field("visible", "Show on website", "checkbox")} value={editing.visible !== false} onChange={(value) => setEditing((current) => ({ ...current, visible: value }))} />
              </div>
              <div className="editor-footer"><button type="button" className="button button-quiet" onClick={() => setEditing(null)}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? "Saving…" : "Save changes"}{saving ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}</button></div>
            </form>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>
    </div>
  );
}

function ProjectManager() {
  const notify = useToast();
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState(null);
  const [oldAssets, setOldAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [galleryProgress, setGalleryProgress] = useState(0);
  const [filterFeatured, setFilterFeatured] = useState(false);
  const load = useCallback(() => api.get("projects/admin/all").then(({ data }) => setProjects(data.projects || [])).catch((error) => notify(error.message, "error")).finally(() => setLoading(false)), [notify]);
  useEffect(() => { load(); }, [load]);
  const edit = (project = null) => {
    setOldAssets(project ? [
      ...(project.thumbnailPublicId ? [{ url: project.thumbnail, publicId: project.thumbnailPublicId }] : []),
      ...safeArray(project.galleryAssets),
    ] : []);
    setEditing(project ? {
      ...project,
      techStackText: safeArray(project.techStack).join(", "),
      galleryAssets: safeArray(project.galleryAssets).map((asset) => ({ ...asset })),
    } : {
      title: "", slug: "", shortDescription: "", description: "", category: "",
      techStackText: "", thumbnail: "", thumbnailPublicId: "", galleryAssets: [],
      liveUrl: "", githubUrl: "", featured: false, status: "draft", displayOrder: 0,
    });
  };
  const setField = (name, value) => setEditing((current) => ({ ...current, [name]: value }));
  const upload = async (files, multiple = false) => {
    const list = [...files];
    if (!list.length) return;
    const body = new FormData();
    if (multiple) list.forEach((file) => body.append("images", file));
    else body.append("image", list[0]);
    const endpoint = multiple ? "upload/multiple" : "upload/image";
    const setProgressValue = multiple ? setGalleryProgress : setProgress;
    setProgressValue(1);
    try {
      const { data } = await api.post(endpoint, body, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => setProgressValue(Math.round((event.loaded / (event.total || event.loaded || 1)) * 100)),
      });
      if (multiple) setEditing((current) => ({ ...current, galleryAssets: [...current.galleryAssets, ...data.images.map(({ url, publicId }) => ({ url, publicId }))] }));
      else setEditing((current) => ({ ...current, thumbnail: data.image.url, thumbnailPublicId: data.image.publicId }));
      notify(multiple ? "Gallery uploaded." : "Thumbnail uploaded.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setProgressValue(0);
    }
  };
  const save = async (event) => {
    event.preventDefault();
    const projectData = { ...editing };
    const projectId = projectData._id;
    const techStackText = projectData.techStackText;
    ["_id", "__v", "createdAt", "updatedAt", "id", "techStackText"].forEach((key) => delete projectData[key]);
    projectData.techStack = techStackText.split(",").map((technology) => technology.trim()).filter(Boolean);
    if (!projectData.slug) projectData.slug = projectData.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    setSaving(true);
    try {
      let saved;
      if (projectId) saved = (await api.put(`projects/${projectId}`, projectData)).data.project;
      else saved = (await api.post("projects", projectData)).data.project;
      const newAssets = [
        ...(saved.thumbnailPublicId ? [{ url: saved.thumbnail, publicId: saved.thumbnailPublicId }] : []),
        ...safeArray(saved.galleryAssets),
      ];
      const removed = oldAssets.filter((oldAsset) => !newAssets.some((asset) => asset.publicId === oldAsset.publicId));
      let cleanupFailed = false;
      for (const asset of removed) {
        try {
          await api.delete("upload/image", { data: { publicId: asset.publicId, imageUrl: asset.url } });
        } catch {
          cleanupFailed = true;
        }
      }
      notify(projectId ? "Project updated." : "Project created.");
      if (cleanupFailed) notify("Project saved; an old image is still referenced elsewhere and was kept.", "error");
      setEditing(null);
      await load();
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setSaving(false);
    }
  };
  const remove = async (project) => {
    if (!window.confirm(`Delete "${project.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`projects/${project._id}`);
      const assets = [
        ...(project.thumbnailPublicId ? [{ url: project.thumbnail, publicId: project.thumbnailPublicId }] : []),
        ...safeArray(project.galleryAssets),
      ];
      let cleanupFailed = false;
      for (const asset of assets) {
        try {
          await api.delete("upload/image", { data: { publicId: asset.publicId, imageUrl: asset.url } });
        } catch {
          cleanupFailed = true;
        }
      }
      notify("Project deleted.");
      if (cleanupFailed) notify("Project deleted; an image still used elsewhere was kept.", "error");
      await load();
    } catch (error) {
      notify(error.message, "error");
    }
  };
  const filtered = projects.filter((project) =>
    (status === "all" || project.status === status) &&
    (!filterFeatured || project.featured) &&
    `${project.title} ${project.category || ""}`.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="manager-page">
      <div className="admin-page-heading"><div><p className="admin-kicker">CONTENT MANAGEMENT</p><h1>Projects</h1><p>Showcase your work and manage what visitors can see.</p></div><button className="button button-primary" onClick={() => edit()}><Plus size={17} /> Add project</button></div>
      <div className="manager-toolbar"><div className="search-field"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search projects…" /></div><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="published">Published</option><option value="draft">Drafts</option></select><label className="filter-check"><input type="checkbox" checked={filterFeatured} onChange={(event) => setFilterFeatured(event.target.checked)} /> Featured</label><span className="item-count">{filtered.length} projects</span></div>
      {loading ? <Loading label="Loading projects" /> : filtered.length ? <div className="project-admin-grid">{filtered.map((project) => (
        <article className="project-admin-card" key={project._id}><div className="project-admin-image">{project.thumbnail && <img src={project.thumbnail} alt="" />}<span className={`status-pill status-${project.status}`}>{project.status}</span>{project.featured && <span className="admin-featured"><Sparkles size={12} /></span>}</div><div className="project-admin-body"><p>{project.category}</p><h3>{project.title}</h3><span>{project.shortDescription}</span><div className="project-admin-actions"><button className="button button-quiet" onClick={() => edit(project)}><Pencil size={15} /> Edit</button><button className="icon-button delete-action" onClick={() => remove(project)} title="Delete project"><Trash2 size={16} /></button></div></div></article>
      ))}</div> : <EmptyState title="No projects found" text="Create a project to publish it on your site." action={<button className="button button-primary" onClick={() => edit()}><Plus size={15} /> Add project</button>} />}
      <AnimatePresence>{editing && <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditing(null)}>
        <motion.div className="editor-modal project-editor" initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }} onClick={(event) => event.stopPropagation()}>
          <div className="editor-heading"><div><p className="admin-kicker">{editing._id ? "EDIT PROJECT" : "NEW PROJECT"}</p><h2>{editing._id ? "Update project" : "Create project"}</h2></div><button className="icon-button" onClick={() => setEditing(null)} aria-label="Close"><X size={19} /></button></div>
          <form onSubmit={save} className="editor-form">
            <div className="editor-fields project-fields">
              <label>Project title<input required maxLength={160} value={editing.title} onChange={(event) => { setField("title", event.target.value); if (!editing._id) setField("slug", event.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")); }} /></label>
              <label>Slug<input required value={editing.slug} onChange={(event) => setField("slug", event.target.value)} /></label>
              <label className="field-wide">Short description<textarea required maxLength={500} rows="2" value={editing.shortDescription} onChange={(event) => setField("shortDescription", event.target.value)} /></label>
              <label className="field-wide">Full description<textarea required rows="5" value={editing.description} onChange={(event) => setField("description", event.target.value)} /></label>
              <label>Category<input value={editing.category} onChange={(event) => setField("category", event.target.value)} /></label>
              <label>Technologies (comma separated)<input value={editing.techStackText} onChange={(event) => setField("techStackText", event.target.value)} /></label>
              <label>Live URL<input type="url" value={editing.liveUrl} onChange={(event) => setField("liveUrl", event.target.value)} /></label>
              <label>GitHub URL<input type="url" value={editing.githubUrl} onChange={(event) => setField("githubUrl", event.target.value)} /></label>
              <label>Display order<input type="number" value={editing.displayOrder} onChange={(event) => setField("displayOrder", Number(event.target.value))} /></label>
              <label>Publication status<select value={editing.status} onChange={(event) => setField("status", event.target.value)}><option value="draft">Draft</option><option value="published">Published</option></select></label>
              <label className="checkbox-field"><input type="checkbox" checked={editing.featured} onChange={(event) => setField("featured", event.target.checked)} /> Feature this project</label>
            </div>
            <div className="upload-block"><label>Project thumbnail <span>JPG, PNG, WEBP or GIF · max 5 MB</span></label><div className="upload-preview">{editing.thumbnail && <img src={editing.thumbnail} alt="Project thumbnail preview" />}<label className="upload-button"><Upload size={15} />{editing.thumbnail ? "Replace thumbnail" : "Upload thumbnail"}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => upload(event.target.files)} /></label>{progress > 0 && <span className="upload-progress">{progress}%</span>}</div></div>
            <div className="upload-block"><label>Gallery images <span>Multiple images, up to 10 at a time</span></label><div className="gallery-preview">{editing.galleryAssets.map((asset) => <div key={asset.publicId}><img src={asset.url} alt="" /><button type="button" onClick={() => setField("galleryAssets", editing.galleryAssets.filter((image) => image.publicId !== asset.publicId))} aria-label="Remove gallery image"><X size={14} /></button></div>)}<label className="gallery-add"><Plus size={19} /><input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => upload(event.target.files, true)} /></label>{galleryProgress > 0 && <span className="upload-progress">{galleryProgress}%</span>}</div></div>
            <div className="editor-footer"><button type="button" className="button button-quiet" onClick={() => setEditing(null)}>Cancel</button><button className="button button-primary" disabled={saving || !editing.thumbnail}>{saving ? "Saving…" : "Save project"}{saving ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}</button></div>
          </form>
        </motion.div>
      </motion.div>}</AnimatePresence>
    </div>
  );
}

function PortfolioEditor({ section, title, seoOnly = false }) {
  const notify = useToast();
  const [value, setValue] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({});
  const [retiredAssets, setRetiredAssets] = useState([]);
  const definitions = useMemo(() => portfolioFields[section] || [], [section]);
  useEffect(() => {
    api.get("portfolio/admin").then(({ data }) => {
      const current = data.portfolio?.[section] || {};
      setValue({ ...current });
    }).catch((error) => notify(error.message, "error")).finally(() => setLoading(false));
  }, [section, seoOnly, definitions, notify]);
  const visibleDefinitions = seoOnly ? definitions.filter((item) => ["seoTitle", "seoDescription", "ogImage"].includes(item.name)) : definitions;
  const uploadField = async (fieldName, file) => {
    if (!file) return;
    const body = new FormData();
    body.append("image", file);
    const previousPublicId = value[`${fieldName}PublicId`];
    const previousUrl = value[fieldName];
    setUploading((current) => ({ ...current, [fieldName]: true }));
    try {
      const { data } = await api.post("upload/image", body, { headers: { "Content-Type": "multipart/form-data" } });
      const publicIdField = `${fieldName}PublicId`;
      setValue((current) => ({ ...current, [fieldName]: data.image.url, [publicIdField]: data.image.publicId }));
      if (previousPublicId && previousUrl && previousPublicId !== data.image.publicId) {
        setRetiredAssets((current) => [...current, { publicId: previousPublicId, url: previousUrl }]);
      }
      notify("Image uploaded.");
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
    setUploading((current) => ({ ...current, url: true }));
    try {
      const current = await api.get("portfolio/admin");
      const previousResume = current.data.portfolio?.resume;
      const { data } = await api.post("upload/resume", body, { headers: { "Content-Type": "multipart/form-data" } });
      const nextResume = { ...previousResume, ...data.resume };
      setValue(nextResume);
      await api.put("portfolio/resume", nextResume);
      if (previousResume?.publicId && previousResume.publicId !== data.resume.publicId) {
        try {
          await api.delete("upload/resume", { data: { publicId: previousResume.publicId } });
        } catch {
          notify("Resume replaced; the previous file could not be removed.", "error");
        }
      }
      notify("Resume uploaded and saved.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setUploading((current) => ({ ...current, url: false }));
    }
  };
  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.put(`portfolio/${section}`, value);
      let cleanupFailed = false;
      for (const asset of retiredAssets) {
        try {
          await api.delete("upload/image", { data: { publicId: asset.publicId, imageUrl: asset.url } });
        } catch {
          cleanupFailed = true;
        }
      }
      setRetiredAssets([]);
      notify(`${title} saved.`);
      if (cleanupFailed) notify("Content saved; an old image is still referenced and was kept.", "error");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setSaving(false);
    }
  };
  if (loading) return <Loading label={`Loading ${title.toLowerCase()}`} />;
  if (section === "resume") return (
    <div className="manager-page">
      <div className="admin-page-heading"><div><p className="admin-kicker">PORTFOLIO CONTENT</p><h1>{title}</h1><p>Upload or replace your public PDF resume.</p></div></div>
      <div className="admin-panel resume-panel">{value.url ? <><div className="resume-preview"><Download size={28} /><div><strong>{value.fileName || "Current resume"}</strong><span>Uploaded PDF</span></div><a className="button button-quiet" href={value.url} target="_blank" rel="noreferrer">Preview <ArrowUpRight size={15} /></a></div></> : <EmptyState title="No resume uploaded" text="Choose a PDF file to make it available from your portfolio." />}
        <label className="resume-upload button button-primary"><Upload size={16} />{uploading.url ? "Uploading…" : value.url ? "Replace PDF" : "Upload PDF"}<input type="file" accept="application/pdf,.pdf" onChange={(event) => uploadResume(event.target.files[0])} disabled={uploading.url} /></label><p className="form-help">PDF only · maximum 10 MB</p>
      </div>
    </div>
  );
  return (
    <div className="manager-page">
      <div className="admin-page-heading"><div><p className="admin-kicker">PORTFOLIO CONTENT</p><h1>{title}</h1><p>Update your portfolio content and preferences.</p></div></div>
      <form className="admin-panel portfolio-form" onSubmit={save}>
        <div className="editor-fields">{visibleDefinitions.map((definition) => <FormField key={definition.name} definition={definition} value={value[definition.name]} onChange={(next) => setValue((current) => ({ ...current, [definition.name]: next }))} onUpload={uploadField} uploadProgress={uploading[definition.name]} />)}</div>
        <div className="editor-footer"><span className="form-help">Changes are saved to your portfolio database.</span><button className="button button-primary" disabled={saving}>{saving ? "Saving…" : "Save changes"}{saving ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}</button></div>
      </form>
    </div>
  );
}

function AppearanceEditor() {
  const notify = useToast();
  const [appearance, setAppearance] = useState(defaultAppearance);
  const [editingPalette, setEditingPalette] = useState("dark");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    api.get("portfolio/admin")
      .then(({ data }) => setAppearance(mergeAppearance(data.portfolio?.appearance)))
      .catch((error) => notify(error.message, "error"))
      .finally(() => setLoading(false));
  }, [notify]);
  const update = (group, key, value) => {
    setAppearance((current) => ({
      ...current,
      [group]: { ...current[group], [key]: value },
    }));
  };
  const updateColor = (key, value) => {
    setAppearance((current) => ({
      ...current,
      colors: {
        ...current.colors,
        [editingPalette]: { ...current.colors[editingPalette], [key]: value },
      },
    }));
  };
  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.put("portfolio/appearance", appearance);
      notify("Appearance settings saved.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setSaving(false);
    }
  };
  const reset = async () => {
    if (!window.confirm("Reset all appearance settings to the portfolio defaults?")) return;
    setSaving(true);
    try {
      await api.put("portfolio/appearance", defaultAppearance);
      setAppearance(defaultAppearance);
      notify("Appearance reset to defaults.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setSaving(false);
    }
  };
  const { theme, colors, typography, design } = appearance;
  const previewColors = colors[editingPalette];
  useEffect(() => {
    loadWebFonts([typography.fontFamily, typography.headingFontFamily, typography.bodyFontFamily]);
  }, [typography.fontFamily, typography.headingFontFamily, typography.bodyFontFamily]);
  if (loading) return <Loading label="Loading appearance settings" />;
  const previewStyle = {
    "--preview-background": previewColors.background,
    "--preview-text": previewColors.text,
    "--preview-heading": previewColors.heading,
    "--preview-surface": previewColors.surface,
    "--preview-card": previewColors.card,
    "--preview-border": previewColors.border,
    "--preview-primary": previewColors.primary,
    "--preview-secondary": previewColors.secondary,
    "--preview-accent": previewColors.accent,
    "--preview-button": previewColors.button,
    "--preview-button-text": previewColors.buttonText,
    "--preview-body-font": `"${typography.bodyFontFamily}", sans-serif`,
    "--preview-heading-font": `"${typography.headingFontFamily}", sans-serif`,
    "--preview-heading-size": `${typography.headingSize}px`,
    "--preview-body-size": `${typography.bodySize}px`,
    "--preview-heading-weight": typography.headingWeight,
    "--preview-font-weight": typography.fontWeight,
    "--preview-line-height": typography.lineHeight,
    "--preview-letter-spacing": `${typography.letterSpacing}em`,
    "--preview-radius": design.borderRadius === "sharp" ? "2px" : design.borderRadius === "rounded" ? "18px" : "9px",
    "--preview-gradient-start": previewColors.gradientStart,
    "--preview-gradient-end": previewColors.gradientEnd,
  };
  return (
    <div className="manager-page appearance-page">
      <div className="admin-page-heading"><div><p className="admin-kicker">SITE DESIGN</p><h1>Appearance</h1><p>Preview and customize the colors, type, and surface styles used across your public portfolio.</p></div></div>
      <form className="appearance-layout" onSubmit={save}>
        <div className="appearance-controls">
          <section className="admin-panel appearance-group">
            <div className="panel-heading"><div><h2>Theme</h2><p>Choose the visitor default and toggle behavior.</p></div></div>
            <div className="editor-fields">
              <label>Default theme<select value={theme.defaultTheme} onChange={(event) => { update("theme", "defaultTheme", event.target.value); setEditingPalette(event.target.value); }}><option value="dark">Dark</option><option value="light">Light</option></select></label>
              <label className="checkbox-field"><input type="checkbox" checked={theme.toggleVisible} onChange={(event) => update("theme", "toggleVisible", event.target.checked)} />Show the theme toggle to visitors</label>
            </div>
          </section>
          <section className="admin-panel appearance-group">
            <div className="panel-heading"><div><h2>Theme colors</h2><p>Each theme has an independent palette.</p></div></div>
            <div className="palette-tabs" role="group" aria-label="Choose palette to customize">
              {["dark", "light"].map((palette) => <button type="button" className={`palette-tab ${editingPalette === palette ? "active" : ""}`} key={palette} onClick={() => setEditingPalette(palette)} aria-pressed={editingPalette === palette}>{titleCase(palette)} palette</button>)}
            </div>
            <div className="color-control-grid">{appearanceColorFields.map(([key, label]) => <label className="color-control" key={key}><span>{label}</span><input type="color" value={previewColors[key]} onChange={(event) => updateColor(key, event.target.value)} /><code>{previewColors[key]}</code></label>)}</div>
          </section>
          <section className="admin-panel appearance-group">
            <div className="panel-heading"><div><h2>Typography</h2><p>Fonts use available web font families and system fallbacks.</p></div></div>
            <div className="editor-fields">
              <label>Base font<select value={typography.fontFamily} onChange={(event) => update("typography", "fontFamily", event.target.value)}>{fontOptions.map((font) => <option key={font}>{font}</option>)}</select></label>
              <label>Body font<select value={typography.bodyFontFamily} onChange={(event) => update("typography", "bodyFontFamily", event.target.value)}>{fontOptions.map((font) => <option key={font}>{font}</option>)}</select></label>
              <label>Heading font<select value={typography.headingFontFamily} onChange={(event) => update("typography", "headingFontFamily", event.target.value)}>{fontOptions.map((font) => <option key={font}>{font}</option>)}</select></label>
              <label>Heading size · {typography.headingSize}px<input type="range" min="24" max="72" value={typography.headingSize} onChange={(event) => update("typography", "headingSize", Number(event.target.value))} /></label>
              <label>Body size · {typography.bodySize}px<input type="range" min="11" max="22" value={typography.bodySize} onChange={(event) => update("typography", "bodySize", Number(event.target.value))} /></label>
              <label>Body font weight · {typography.fontWeight}<input type="range" min="300" max="700" step="100" value={typography.fontWeight} onChange={(event) => update("typography", "fontWeight", Number(event.target.value))} /></label>
              <label>Heading font weight · {typography.headingWeight}<input type="range" min="400" max="800" step="100" value={typography.headingWeight} onChange={(event) => update("typography", "headingWeight", Number(event.target.value))} /></label>
              <label>Line height · {typography.lineHeight}<input type="range" min="1.2" max="2.4" step="0.05" value={typography.lineHeight} onChange={(event) => update("typography", "lineHeight", Number(event.target.value))} /></label>
              <label>Letter spacing · {typography.letterSpacing}em<input type="range" min="-0.1" max="0.2" step="0.01" value={typography.letterSpacing} onChange={(event) => update("typography", "letterSpacing", Number(event.target.value))} /></label>
            </div>
          </section>
          <section className="admin-panel appearance-group">
            <div className="panel-heading"><div><h2>Design</h2><p>Adjust component treatments and visual effects.</p></div></div>
            <div className="editor-fields">
              <label>Border radius<select value={design.borderRadius} onChange={(event) => update("design", "borderRadius", event.target.value)}><option value="sharp">Sharp</option><option value="soft">Soft</option><option value="rounded">Rounded</option></select></label>
              <label>Button style<select value={design.buttonStyle} onChange={(event) => update("design", "buttonStyle", event.target.value)}><option value="solid">Solid</option><option value="outline">Outline</option><option value="gradient">Gradient</option></select></label>
              <label>Card style<select value={design.cardStyle} onChange={(event) => update("design", "cardStyle", event.target.value)}><option value="solid">Solid</option><option value="glass">Glass</option><option value="outlined">Outlined</option></select></label>
              <label>Default section background<select value={design.sectionBackground} onChange={(event) => update("design", "sectionBackground", event.target.value)}><option value="default">Default</option><option value="surface">Surface</option><option value="gradient">Gradient</option></select></label>
              <label>Section spacing · {design.sectionSpacing}px<input type="range" min="32" max="180" value={design.sectionSpacing} onChange={(event) => update("design", "sectionSpacing", Number(event.target.value))} /></label>
              {[
                ["backgroundGradient", "Background gradient"],
                ["decorativeElements", "Decorative elements"],
                ["gridBackground", "Grid background"],
                ["animations", "Animations"],
              ].map(([key, label]) => <label className="checkbox-field" key={key}><input type="checkbox" checked={design[key]} onChange={(event) => update("design", key, event.target.checked)} />{label}</label>)}
            </div>
          </section>
        </div>
        <aside className="appearance-preview-column">
          <section className="admin-panel appearance-preview-panel">
            <div className="panel-heading"><div><h2>Live preview</h2><p>Updates as you edit; save to publish.</p></div></div>
            <div className="appearance-preview" data-theme={editingPalette} data-card-style={design.cardStyle} data-button-style={design.buttonStyle} data-radius={design.borderRadius} data-gradient={design.backgroundGradient} style={previewStyle}>
              <span className="preview-eyebrow">Portfolio / 01</span>
              <div className="preview-swatches" aria-label="Primary, secondary, and accent colors"><i title="Primary color" /><i title="Secondary color" /><i title="Accent color" /></div>
              <h3>Thoughtful digital experiences.</h3>
              <p>Body copy preview. This is how paragraphs will appear with the selected fonts and colors.</p>
              <button type="button">Primary action <ArrowRight size={14} /></button>
              <article><span>FEATURED PROJECT</span><strong>Project card preview</strong><p>Card surfaces and border treatments appear across your portfolio.</p></article>
            </div>
          </section>
          <div className="editor-footer appearance-actions"><button type="button" className="button button-quiet" onClick={reset} disabled={saving}>Reset to default</button><button className="button button-primary" disabled={saving}>{saving ? "Saving…" : "Save changes"}{saving ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}</button></div>
        </aside>
      </form>
    </div>
  );
}

function ContactInbox() {
  const notify = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => api.get("contact/admin/messages")
      .then(({ data }) => setMessages(data.messages || []))
      .catch((error) => notify(error.message, "error"))
      .finally(() => setLoading(false)), [notify]);
  useEffect(() => { load(); }, [load]);
  const toggleRead = async (message) => {
    try {
      await api.patch(`contact/admin/messages/${message._id}`, { read: !message.read });
      await load();
    } catch (error) {
      notify(error.message, "error");
    }
  };
  const remove = async (message) => {
    if (!window.confirm(`Delete the message from ${message.name}?`)) return;
    try {
      await api.delete(`contact/admin/messages/${message._id}`);
      notify("Message deleted.");
      await load();
    } catch (error) {
      notify(error.message, "error");
    }
  };
  return (
    <div className="manager-page">
      <div className="admin-page-heading"><div><p className="admin-kicker">INCOMING MESSAGES</p><h1>Contact Messages</h1><p>Messages submitted through your public contact form.</p></div><span className="item-count">{messages.filter((message) => !message.read).length} unread · {messages.length} loaded</span></div>
      {loading ? <Loading label="Loading messages" /> : messages.length ? (
        <div className="inbox-list">{messages.map((message) => (
          <article className={`inbox-message ${message.read ? "" : "inbox-unread"}`} key={message._id}>
            <div className="inbox-message-heading"><div><h2>{message.subject}</h2><p>{message.name} · <a href={`mailto:${message.email}`}>{message.email}</a></p></div><time>{new Date(message.createdAt).toLocaleDateString()}</time></div>
            <p className="inbox-message-body">{message.message}</p>
            <div className="inbox-actions"><a className="text-link" href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`}>Reply by email <ArrowUpRight size={14} /></a><button type="button" className="button button-quiet" onClick={() => toggleRead(message)}>{message.read ? "Mark unread" : "Mark read"}</button><button type="button" className="icon-button delete-action" onClick={() => remove(message)} aria-label="Delete message"><Trash2 size={16} /></button></div>
          </article>
        ))}</div>
      ) : <EmptyState title="No messages yet" text="Contact form submissions will appear here." />}
    </div>
  );
}

function FormField({ definition, value, onChange, onUpload, uploadProgress }) {
  const { name, label, type, required, placeholder, options = [], ...attributes } = definition;
  const objectTypes = ["sectionVisibility", "sectionContent", "sectionStyles", "navbar"];
  const current = value ?? (type === "checkbox" ? false : type === "list" || type === "sectionOrder" ? [] : objectTypes.includes(type) ? {} : "");
  const wrapperClass = type === "textarea" || type === "list" || type === "json" || type === "image" || type === "resume" || type.startsWith("section") ? "field-wide" : "";
  if (type === "checkbox") return <label className="checkbox-field"><input type="checkbox" checked={Boolean(current)} onChange={(event) => onChange(event.target.checked)} />{label}</label>;
  if (type === "list") return <label className={wrapperClass}>{label}<textarea rows="3" placeholder="One item per line" value={safeArray(current).join("\n")} onChange={(event) => onChange(event.target.value.split("\n"))} /></label>;
  if (type === "json") return <label className={wrapperClass}>{label}<textarea rows="4" placeholder="[]" value={typeof current === "string" ? current : JSON.stringify(current, null, 2)} onChange={(event) => { try { onChange(JSON.parse(event.target.value)); } catch { onChange(event.target.value); } }} /></label>;
  if (type === "sectionVisibility") return (
    <fieldset className="field-control field-wide section-setting-field"><legend>{label}</legend>
      <div className="section-toggle-grid">{sectionOptions.map(([section, sectionLabel]) => <label className="checkbox-field" key={section}><input type="checkbox" checked={current[section] !== false} onChange={(event) => onChange({ ...current, [section]: event.target.checked })} />{sectionLabel}</label>)}</div>
    </fieldset>
  );
  if (type === "sectionOrder") {
    const savedOrder = [...new Set(safeArray(current).filter((section) => defaultSectionOrder.includes(section)))];
    const order = [...savedOrder, ...defaultSectionOrder.filter((section) => !savedOrder.includes(section))];
    const move = (index, direction) => {
      const target = index + direction;
      if (target < 0 || target >= order.length) return;
      const reordered = [...order];
      [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
      onChange(reordered);
    };
    return <fieldset className="field-control field-wide section-setting-field"><legend>{label}</legend><ol className="section-order-list">{order.map((section, index) => <li key={section}><span>{sectionOptions.find(([id]) => id === section)?.[1]}</span><div><button type="button" className="icon-button" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`Move ${section} up`}><MoveUp size={15} /></button><button type="button" className="icon-button" disabled={index === order.length - 1} onClick={() => move(index, 1)} aria-label={`Move ${section} down`}><MoveDown size={15} /></button></div></li>)}</ol></fieldset>;
  }
  if (type === "sectionContent") return (
    <fieldset className="field-control field-wide section-setting-field"><legend>{label}</legend>
      <div className="section-content-grid">{sectionOptions.filter(([section]) => section !== "hero").map(([section, sectionLabel]) => <div className="section-content-item" key={section}><strong>{sectionLabel}</strong><label>Heading<input value={current[section]?.title || ""} onChange={(event) => onChange({ ...current, [section]: { ...current[section], title: event.target.value } })} /></label><label>Description<textarea rows="2" value={current[section]?.description || ""} onChange={(event) => onChange({ ...current, [section]: { ...current[section], description: event.target.value } })} /></label></div>)}</div>
    </fieldset>
  );
  if (type === "sectionStyles") return (
    <fieldset className="field-control field-wide section-setting-field"><legend>{label}</legend><div className="editor-fields">{sectionOptions.map(([section, sectionLabel]) => <label key={section}>{sectionLabel}<select value={current[section] || "default"} onChange={(event) => onChange({ ...current, [section]: event.target.value })}>{sectionBackgroundOptions.map(([style, styleLabel]) => <option value={style} key={style}>{styleLabel}</option>)}</select></label>)}</div></fieldset>
  );
  if (type === "navbar") return <fieldset className="field-control field-wide section-setting-field"><legend>{label}</legend><div className="section-toggle-grid">{navbarFields.map(([key, navbarLabel]) => <label className="checkbox-field" key={key}><input type="checkbox" checked={current[key] !== false} onChange={(event) => onChange({ ...current, [key]: event.target.checked })} />{navbarLabel}</label>)}</div></fieldset>;
  if (type === "image") return (
    <div className={`field-control ${wrapperClass}`}><label>{label}</label><div className="image-field-row">{typeof current === "string" && current.startsWith("http") && <img src={current} alt="" />}<label className="upload-button"><Upload size={15} />{uploadProgress ? `${uploadProgress}%` : current ? "Replace image" : "Upload image"}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => onUpload?.(name, event.target.files[0])} /></label></div>{typeof current === "string" && current.startsWith("http") && <span className="image-url">{current}</span>}</div>
  );
  if (type === "resume") return <div className={`field-control ${wrapperClass}`}><label>{label}</label><label className="upload-button"><Upload size={15} />{uploadProgress ? "Uploading…" : current ? "Replace PDF" : "Upload PDF"}<input type="file" accept="application/pdf,.pdf" onChange={(event) => onUpload?.(name, event.target.files[0])} /></label>{current && <a href={current} target="_blank" rel="noreferrer" className="text-link">View current resume <ArrowUpRight size={14} /></a>}</div>;
  if (type === "select") return <label>{label}<select required={required} value={current} onChange={(event) => onChange(event.target.value)}><option value="">Select category</option>{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
  if (type === "textarea") return <label className={wrapperClass}>{label}<textarea required={required} rows="4" placeholder={placeholder} value={current} onChange={(event) => onChange(event.target.value)} /></label>;
  return <label>{label}<input type={type} required={required} placeholder={placeholder} value={current} onChange={(event) => onChange(type === "number" ? event.target.value === "" ? "" : Number(event.target.value) : event.target.value)} {...attributes} /></label>;
}

function EmptyState({ title, text, action }) {
  return <div className="empty-state"><span><LayoutDashboard size={20} /></span><h3>{title}</h3><p>{text}</p>{action}</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider><AppRoutes /></ToastProvider>
    </BrowserRouter>
  );
}
