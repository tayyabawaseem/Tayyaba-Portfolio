import { useMemo } from "react";
import { Code2 } from "lucide-react";
import { SiteAnimation } from "./SiteAnimation";

export const DEFAULT_SKILL_CATEGORIES = ["Frontend", "Backend", "Tools", "AI & Machine Learning", "Database", "Other Technologies"];
const slug = (name = "") => ({ "React JS": "react", "Redux Toolkit": "redux", "Node JS": "nodedotjs", "Express JS": "express", "Tailwind CSS": "tailwindcss", "Material UI": "mui", "Socket.io": "socketdotio", "VS Code": "visualstudiocode", "GitHub": "github", "AI & Machine Learning": "tensorflow" }[name] || name.toLowerCase().replace(/\+/g, "plus").replace(/[^a-z0-9]/g, ""));
const logoUrl = (name) => `https://cdn.simpleicons.org/${slug(name)}`;

function SkillLogo({ item, size = 24 }) {
  const source = item.icon?.startsWith("http") ? item.icon : logoUrl(item.name);
  return <img className="premium-skill-logo" width={size} height={size} src={source} alt="" loading="lazy" onError={(event) => { const fallback = document.createElement("span"); fallback.className = "premium-skill-logo-fallback"; fallback.textContent = item.name?.slice(0, 1) || "•"; fallback.style.width = `${size}px`; fallback.style.height = `${size}px`; event.currentTarget.replaceWith(fallback); }} />;
}

export default function SkillsSection({ items = [], heading, className = "", settings = {} }) {
  const categories = useMemo(() => {
    const configured = Array.isArray(settings.categories) && settings.categories.length ? settings.categories : DEFAULT_SKILL_CATEGORIES.map((name, order) => ({ name, enabled: true, order }));
    const known = new Set(configured.map((category) => category.name));
    const legacy = [...new Set(items.map((item) => item.category).filter((name) => name && !known.has(name)))].map((name, index) => ({ name, enabled: true, order: configured.length + index }));
    return [...configured, ...legacy].filter((category) => category.enabled).sort((a, b) => a.order - b.order);
  }, [settings.categories, items]);
  const scroller = { visible: true, pauseOnHover: true, speed: 42, direction: "left", iconSize: 24, spacing: 34, ...settings.scroller };
  const visibleItems = items.filter((item) => item.visible !== false);
  const orderedItems = [...visibleItems].sort((a, b) => (a.categoryOrder ?? a.displayOrder ?? 0) - (b.categoryOrder ?? b.displayOrder ?? 0));
  return <SiteAnimation as="section" animationTarget="skills" className={`content-section premium-skills-section ${className}`} id="skills">
    <SectionHeading heading={heading} />
    <div className="premium-skill-categories">{categories.map((category) => {
      const group = orderedItems.filter((item) => item.category === category.name);
      return <article className="premium-skill-category" key={category.name}>
        <div className="premium-category-heading"><span className="premium-category-mark"><Code2 size={17} /></span><div><h3>{category.name}</h3><span>{String(group.length).padStart(2, "0")} technologies</span></div></div>
        <div className="premium-skill-grid">{group.length ? group.map((item) => <div className="premium-skill-tile" key={item._id}><SkillLogo item={item} /><span>{item.name}</span></div>) : <span className="premium-skill-empty">More skills coming soon</span>}</div>
      </article>;
    })}</div>
    {scroller.visible && visibleItems.length > 1 && <div className={`skills-marquee ${scroller.pauseOnHover ? "pause-on-hover" : ""}`} aria-label="Technology skills" style={{ "--skills-duration": `${Math.max(3, 360 / Number(scroller.speed || 42))}s`, "--skills-direction": scroller.direction === "right" ? "reverse" : "normal", "--skills-size": `${scroller.iconSize}px`, "--skills-gap": `${scroller.spacing}px` }}>
      <div className="skills-marquee-track">{[0, 1].map((copy) => <div className="skills-marquee-group" key={copy} aria-hidden={copy ? "true" : undefined}>{[...visibleItems].sort((a, b) => (a.scrollerOrder ?? a.displayOrder ?? 0) - (b.scrollerOrder ?? b.displayOrder ?? 0)).map((item) => <span className="skills-marquee-item" key={`${copy}-${item._id}`}><SkillLogo item={item} size={scroller.iconSize} />{item.name}</span>)}</div>)}</div>
    </div>}
  </SiteAnimation>;
}

function SectionHeading({ heading = {} }) {
  return <div className="section-heading"><span className="section-index">{heading.index || "02"}</span><div><h2>{heading.title || "Technical skills"}</h2><p>{heading.description || "Tools and technologies I work with."}</p></div></div>;
}
