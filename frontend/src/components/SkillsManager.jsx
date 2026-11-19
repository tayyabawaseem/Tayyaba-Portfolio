import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, LoaderCircle, Pencil, Plus, Save, Sparkles, Trash2, X } from "lucide-react";
import api from "../services/api";
import { DEFAULT_SKILL_CATEGORIES } from "./SkillsSection";

const defaults = () => ({
  categories: DEFAULT_SKILL_CATEGORIES.map((name, order) => ({ name, enabled: true, order })),
  scroller: { visible: true, pauseOnHover: true, speed: 42, direction: "left", iconSize: 24, spacing: 34 },
});
const emptySkill = (category, order = 0) => ({ name: "", category, icon: "", visible: true, displayOrder: order, categoryOrder: order, scrollerOrder: 0 });
const DEFAULT_SKILLS = {
  Frontend: ["HTML", "CSS", "JavaScript", "React JS", "Redux Toolkit", "Bootstrap", "Material UI", "Tailwind CSS", "Socket.io"],
  Backend: ["Firebase", "Node JS", "Express JS", "MongoDB"],
  Tools: ["Git", "GitHub", "VS Code", "Postman", "Netlify", "Vercel"],
};
const skillData = (skill, patch = {}) => ({
  name: skill.name, category: skill.category || "Other Technologies", icon: skill.icon || "",
  ...(skill.proficiency !== undefined ? { proficiency: skill.proficiency } : {}),
  categoryOrder: skill.categoryOrder ?? skill.displayOrder ?? 0, scrollerOrder: skill.scrollerOrder ?? skill.displayOrder ?? 0,
  ...patch,
});

export default function SkillsManager() {
  const [skills, setSkills] = useState([]);
  const [settings, setSettings] = useState(defaults);
  const [baseline, setBaseline] = useState("");
  const [editing, setEditing] = useState(null);
  const [categoryDraft, setCategoryDraft] = useState("");
  const [dragged, setDragged] = useState(null);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const orderedCategories = useMemo(() => [...settings.categories].sort((a, b) => a.order - b.order), [settings.categories]);
  const dirty = JSON.stringify(settings) !== baseline;
  const load = useCallback(async (preserveSettings = false) => {
    setBusy(true);
    try {
      const [{ data: content }, { data: portfolio }] = await Promise.all([api.get("content/skills"), api.get("portfolio/admin")]);
      setSkills(content.items || []);
      const saved = portfolio.portfolio?.settings?.skills;
      const categoryNames = [...(saved?.categories || defaults().categories).map((category) => category.name)];
      for (const name of [...new Set((content.items || []).map((item) => item.category).filter(Boolean))]) if (!categoryNames.includes(name)) categoryNames.push(name);
      const value = { ...defaults(), ...(saved || {}), categories: (saved?.categories || defaults().categories).concat(categoryNames.filter((name) => !(saved?.categories || defaults().categories).some((category) => category.name === name)).map((name, index) => ({ name, enabled: true, order: (saved?.categories || defaults().categories).length + index }))), scroller: { ...defaults().scroller, ...(saved?.scroller || {}) } };
      if (!preserveSettings) { setSettings(value); setBaseline(JSON.stringify(value)); }
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const persistSettings = async (next) => {
    setSaving(true); setMessage("");
    try {
      await api.put("portfolio/settings", { skills: next });
      setSettings(next); setBaseline(JSON.stringify(next)); setMessage("Changes saved.");
    } catch (error) { setMessage(error.message); }
    finally { setSaving(false); }
  };
  const saveSkill = async (event) => {
    event.preventDefault(); setSaving(true); setMessage("");
    const { _id, title, type, ...fields } = editing;
    const data = Object.fromEntries(Object.entries(fields).filter(([key]) => !["visible", "displayOrder"].includes(key)));
    try {
      if (_id) await api.put(`content/skills/${_id}`, { data, visible: editing.visible, displayOrder: editing.displayOrder });
      else await api.post("content/skills", { data, visible: editing.visible, displayOrder: editing.displayOrder });
      setEditing(null); await load(true);
    } catch (error) { setMessage(error.message); }
    finally { setSaving(false); }
  };
  const move = async (category, item, delta) => {
    const group = skills.filter((skill) => skill.category === category).sort((a, b) => (a.categoryOrder ?? a.displayOrder) - (b.categoryOrder ?? b.displayOrder));
    const from = group.findIndex((skill) => skill._id === item._id); const to = from + delta;
    if (to < 0 || to >= group.length) return;
    [group[from], group[to]] = [group[to], group[from]];
    setSaving(true);
    try { await Promise.all(group.map((skill, index) => api.put(`content/skills/${skill._id}`, { data: skillData(skill, { categoryOrder: index }) }))); await load(true); }
    catch (error) { setMessage(error.message); }
    finally { setSaving(false); }
  };
  const moveScroller = async (item, delta) => {
    const group = [...scrollerOrder]; const from = group.findIndex((skill) => skill._id === item._id); const to = from + delta;
    if (to < 0 || to >= group.length) return;
    [group[from], group[to]] = [group[to], group[from]]; setSaving(true);
    try { await Promise.all(group.map((skill, index) => api.put(`content/skills/${skill._id}`, { data: skillData(skill, { scrollerOrder: index }) }))); await load(true); }
    catch (error) { setMessage(error.message); } finally { setSaving(false); }
  };
  const dropScroller = async (targetId) => {
    if (!dragged || dragged.kind !== "scroller" || dragged.id === targetId) return;
    const group = [...scrollerOrder]; const from = group.findIndex((skill) => skill._id === dragged.id); const to = group.findIndex((skill) => skill._id === targetId);
    if (from < 0 || to < 0) return;
    group.splice(to, 0, group.splice(from, 1)[0]); setDragged(null); setSaving(true);
    try { await Promise.all(group.map((skill, index) => api.put(`content/skills/${skill._id}`, { data: skillData(skill, { scrollerOrder: index }) }))); await load(true); }
    catch (error) { setMessage(error.message); } finally { setSaving(false); }
  };
  const changeCategoryOrder = (name, delta) => {
    const list = [...orderedCategories]; const from = list.findIndex((category) => category.name === name); const to = from + delta;
    if (to < 0 || to >= list.length) return;
    [list[from], list[to]] = [list[to], list[from]];
    persistSettings({ ...settings, categories: list.map((category, order) => ({ ...category, order })) });
  };
  const dropCategory = (name) => {
    if (!dragged || dragged.kind !== "category" || dragged.name === name) return;
    const list = [...orderedCategories]; const from = list.findIndex((category) => category.name === dragged.name); const to = list.findIndex((category) => category.name === name);
    if (from < 0 || to < 0) return;
    list.splice(to, 0, list.splice(from, 1)[0]); setDragged(null);
    persistSettings({ ...settings, categories: list.map((category, order) => ({ ...category, order })) });
  };
  const dropSkill = async (category, targetId) => {
    if (!dragged || dragged.kind !== "skill" || dragged.category !== category || dragged.id === targetId) return;
    const group = skills.filter((skill) => skill.category === category).sort((a, b) => (a.categoryOrder ?? a.displayOrder) - (b.categoryOrder ?? b.displayOrder));
    const from = group.findIndex((skill) => skill._id === dragged.id); const to = group.findIndex((skill) => skill._id === targetId);
    if (from < 0 || to < 0) return;
    group.splice(to, 0, group.splice(from, 1)[0]); setDragged(null); setSaving(true);
    try { await Promise.all(group.map((skill, index) => api.put(`content/skills/${skill._id}`, { data: skillData(skill, { categoryOrder: index }) }))); await load(true); }
    catch (error) { setMessage(error.message); } finally { setSaving(false); }
  };
  const deleteSkill = async (item) => {
    if (!window.confirm(`Delete ${item.name}?`)) return;
    try { await api.delete(`content/skills/${item._id}`); await load(true); } catch (error) { setMessage(error.message); }
  };
  const addCategory = () => {
    const name = categoryDraft.trim();
    if (!name || settings.categories.some((category) => category.name.toLowerCase() === name.toLowerCase())) return;
    persistSettings({ ...settings, categories: [...settings.categories, { name, enabled: true, order: settings.categories.length }] }); setCategoryDraft("");
  };
  const addMissingDefaults = async () => {
    const known = new Set(skills.map((item) => `${(item.category || "").toLowerCase()}::${item.name.trim().toLowerCase()}`));
    const missing = Object.entries(DEFAULT_SKILLS).flatMap(([category, names]) => names.filter((name) => !known.has(`${category.toLowerCase()}::${name.toLowerCase()}`)).map((name) => ({ name, category })));
    if (!missing.length) { setMessage("All default skills are already present."); return; }
    setSaving(true); setMessage("");
    try {
      const scrollerStart = skills.length;
      await Promise.all(missing.map(({ name, category }, index) => {
        const groupSize = skills.filter((item) => item.category === category).length + missing.filter((item) => item.category === category).findIndex((item) => item.name === name);
        return api.post("content/skills", { data: { name, category, icon: "", categoryOrder: groupSize, scrollerOrder: scrollerStart + index }, visible: true, displayOrder: scrollerStart + index });
      }));
      setMessage(`Added ${missing.length} missing default skills.`); await load(true);
    } catch (error) { setMessage(error.message); } finally { setSaving(false); }
  };
  const renameCategory = async (category) => {
    const name = window.prompt("Category name", category.name)?.trim();
    if (!name || name === category.name || settings.categories.some((entry) => entry.name.toLowerCase() === name.toLowerCase())) return;
    setSaving(true);
    try {
      await Promise.all(skills.filter((item) => item.category === category.name).map((item) => api.put(`content/skills/${item._id}`, { data: skillData(item, { category: name }) })));
      await persistSettings({ ...settings, categories: settings.categories.map((entry) => entry.name === category.name ? { ...entry, name } : entry) }); await load();
    } catch (error) { setMessage(error.message); } finally { setSaving(false); }
  };
  const removeCategory = async (category) => {
    const assigned = skills.filter((item) => item.category === category.name);
    const targetName = category.name === "Other Technologies" ? "Frontend" : "Other Technologies";
    if (assigned.length && !settings.categories.some((entry) => entry.name === targetName)) {
      setMessage(`Add the “${targetName}” category first so its skills have a destination.`); return;
    }
    if (assigned.length && !window.confirm(`Move ${assigned.length} skills to ${targetName} and delete ${category.name}?`)) return;
    setSaving(true);
    try {
      await Promise.all(assigned.map((item, index) => api.put(`content/skills/${item._id}`, { data: skillData(item, { category: targetName, categoryOrder: index }) })));
      await persistSettings({ ...settings, categories: settings.categories.filter((entry) => entry.name !== category.name).map((entry, order) => ({ ...entry, order })) }); await load();
    } catch (error) { setMessage(error.message); } finally { setSaving(false); }
  };
  const uploadLogo = async (file) => {
    if (!file || !editing) return;
    const form = new FormData(); form.append("image", file);
    try { const { data } = await api.post("upload/image", form, { headers: { "Content-Type": "multipart/form-data" } }); setEditing((current) => ({ ...current, icon: data.image.url })); }
    catch (error) { setMessage(error.message); }
  };
  const scrollerOrder = [...skills].sort((a, b) => (a.scrollerOrder ?? a.displayOrder) - (b.scrollerOrder ?? b.displayOrder));
  if (busy) return <div className="skills-admin-loading"><LoaderCircle className="spin" /> Loading your skills…</div>;
  return <div className="manager-page skills-manager">
    <header className="admin-page-heading"><div><p className="admin-kicker">PORTFOLIO CONTENT</p><h1>Skills studio</h1><p>Shape skill groups, their order, and the moving technology strip.</p></div><div className="skills-heading-actions"><span className={`skills-save-state ${dirty ? "is-dirty" : ""}`}>{dirty ? "Unsaved settings" : "All changes saved"}</span><button className="button button-quiet" disabled={saving} onClick={addMissingDefaults}><Sparkles size={15} /> Add missing default skills</button></div></header>
    <section className="skills-admin-panel"><div className="skills-admin-title"><div><h2>Categories</h2><p>Category order controls the public card layout.</p></div><form onSubmit={(event) => { event.preventDefault(); addCategory(); }}><input aria-label="New category name" value={categoryDraft} onChange={(event) => setCategoryDraft(event.target.value)} placeholder="Add a category" /><button className="button button-primary" type="submit"><Plus size={15} /> Add</button></form></div>
      <div className="skills-admin-categories">{orderedCategories.map((category, index) => <article className="skills-admin-category" key={category.name} onDragOver={(event) => event.preventDefault()} onDrop={() => dropCategory(category.name)}>
        <div className="skills-admin-category-head"><span className="skills-drag-handle" draggable onDragStart={(event) => { event.stopPropagation(); setDragged({ kind: "category", name: category.name }); }}> <GripVertical size={16} /></span><strong>{category.name}</strong><span>{skills.filter((item) => item.category === category.name).length} skills</span><button title="Move category up" disabled={!index} onClick={() => changeCategoryOrder(category.name, -1)}><ArrowUp size={15} /></button><button title="Move category down" disabled={index === orderedCategories.length - 1} onClick={() => changeCategoryOrder(category.name, 1)}><ArrowDown size={15} /></button><button title="Rename category" onClick={() => renameCategory(category)}><Pencil size={14} /></button><button title="Delete category" className="skills-danger" onClick={() => removeCategory(category)}><Trash2 size={14} /></button><label className="skills-toggle"><input type="checkbox" checked={category.enabled} onChange={(event) => persistSettings({ ...settings, categories: settings.categories.map((entry) => entry.name === category.name ? { ...entry, enabled: event.target.checked } : entry) })} />Visible</label>
        </div><div className="skills-admin-list">{skills.filter((item) => item.category === category.name).sort((a, b) => (a.categoryOrder ?? a.displayOrder) - (b.categoryOrder ?? b.displayOrder)).map((item, position, group) => <div className="skills-admin-item" key={item._id} onDragOver={(event) => event.preventDefault()} onDrop={() => dropSkill(category.name, item._id)}><span className="skills-admin-grip" draggable onDragStart={() => setDragged({ kind: "skill", id: item._id, category: category.name })}>⠿</span><span className="skills-admin-name"><Sparkles size={14} />{item.name}</span><small>{item.visible ? "Public" : "Hidden"}</small><button title="Move up" disabled={!position} onClick={() => move(category.name, item, -1)}><ArrowUp size={14} /></button><button title="Move down" disabled={position === group.length - 1} onClick={() => move(category.name, item, 1)}><ArrowDown size={14} /></button><button title="Edit skill" onClick={() => setEditing({ ...item })}><Pencil size={14} /></button><button title="Delete skill" className="skills-danger" onClick={() => deleteSkill(item)}><Trash2 size={14} /></button></div>)}<button className="skills-add-row" onClick={() => setEditing(emptySkill(category.name, skills.filter((item) => item.category === category.name).length))}><Plus size={14} /> Add skill to {category.name}</button></div>
      </article>)}</div>
    </section>
    <section className="skills-admin-panel"><div className="skills-admin-title"><div><h2>Scroller settings</h2><p>Independent sequence and motion controls.</p></div></div>
      <div className="skills-scroller-controls"><label className="skills-toggle"><input type="checkbox" checked={settings.scroller.visible} onChange={(event) => setSettings({ ...settings, scroller: { ...settings.scroller, visible: event.target.checked } })} />Show technology scroller</label><label className="skills-toggle"><input type="checkbox" checked={settings.scroller.pauseOnHover} onChange={(event) => setSettings({ ...settings, scroller: { ...settings.scroller, pauseOnHover: event.target.checked } })} />Pause on hover</label><label>Direction<select value={settings.scroller.direction} onChange={(event) => setSettings({ ...settings, scroller: { ...settings.scroller, direction: event.target.value } })}><option value="left">Right to left</option><option value="right">Left to right</option></select></label><label>Speed · {settings.scroller.speed}<input type="range" min="10" max="120" value={settings.scroller.speed} onChange={(event) => setSettings({ ...settings, scroller: { ...settings.scroller, speed: Number(event.target.value) } })} /></label><label>Logo size · {settings.scroller.iconSize}px<input type="range" min="16" max="64" value={settings.scroller.iconSize} onChange={(event) => setSettings({ ...settings, scroller: { ...settings.scroller, iconSize: Number(event.target.value) } })} /></label><label>Item spacing · {settings.scroller.spacing}px<input type="range" min="8" max="80" value={settings.scroller.spacing} onChange={(event) => setSettings({ ...settings, scroller: { ...settings.scroller, spacing: Number(event.target.value) } })} /></label></div>
      <div className="skills-mini-preview"><span>LIVE PREVIEW · DRAG ITEMS OR USE THE ARROWS</span><div className="skills-scroller-order">{scrollerOrder.map((skill, index) => <b key={skill._id} draggable onDragStart={() => setDragged({ kind: "scroller", id: skill._id })} onDragOver={(event) => event.preventDefault()} onDrop={() => dropScroller(skill._id)}><span>{skill.name}</span><button title="Move earlier in scroller" disabled={!index || saving} onClick={() => moveScroller(skill, -1)}><ArrowUp size={13} /></button><button title="Move later in scroller" disabled={index === scrollerOrder.length - 1 || saving} onClick={() => moveScroller(skill, 1)}><ArrowDown size={13} /></button></b>)}</div><div className={`skills-motion-preview ${settings.scroller.pauseOnHover ? "pause-on-hover" : ""}`} style={{ "--preview-speed": `${Math.max(3, 360 / Number(settings.scroller.speed || 42))}s`, "--preview-direction": settings.scroller.direction === "right" ? "reverse" : "normal", "--preview-gap": `${settings.scroller.spacing}px` }}>{settings.scroller.visible && scrollerOrder.length > 1 && <div className="skills-motion-track">{[0, 1].map((copy) => <div className="skills-motion-group" key={copy}>{scrollerOrder.map((skill) => <span key={`${copy}-${skill._id}`}>{skill.name}</span>)}</div>)}</div>}</div></div><div className="skills-panel-actions"><span>{message || (dirty ? "You have unsaved scroller settings." : "")}</span><button className="button button-quiet" disabled={!dirty || saving} onClick={() => setSettings(JSON.parse(baseline))}>Discard changes</button><button className="button button-quiet" disabled={saving} onClick={() => setSettings(defaults())}>Reset defaults</button><button className="button button-primary" disabled={!dirty || saving} onClick={() => persistSettings(settings)}><Save size={15} />{saving ? "Saving…" : "Save changes"}</button></div>
    </section>
    {editing && <div className="modal-backdrop" onClick={() => setEditing(null)}><section className="editor-modal skills-editor-modal" onClick={(event) => event.stopPropagation()}><header className="editor-heading"><div><p className="admin-kicker">SKILL DETAILS</p><h2>{editing._id ? "Edit skill" : "Add a skill"}</h2></div><button className="icon-button" onClick={() => setEditing(null)}><X size={18} /></button></header><form className="editor-form" onSubmit={saveSkill}><div className="editor-fields"><label>Technology name<input required maxLength="100" value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} /></label><label>Category<select value={editing.category || "Other Technologies"} onChange={(event) => setEditing({ ...editing, category: event.target.value })}>{orderedCategories.map((category) => <option key={category.name}>{category.name}</option>)}</select></label><label className="field-wide">Logo URL (optional)<input type="url" placeholder="https://…" value={editing.icon || ""} onChange={(event) => setEditing({ ...editing, icon: event.target.value })} /><span className="skills-logo-actions"><small>Use a direct logo URL or upload an image.</small><label className="button button-quiet">Upload logo<input type="file" accept="image/*" hidden onChange={(event) => uploadLogo(event.target.files?.[0])} /></label></span></label><label>Category position<input type="number" min="0" value={editing.categoryOrder ?? editing.displayOrder ?? 0} onChange={(event) => setEditing({ ...editing, categoryOrder: Number(event.target.value), displayOrder: Number(event.target.value) })} /></label><label className="skills-toggle"><input type="checkbox" checked={editing.visible !== false} onChange={(event) => setEditing({ ...editing, visible: event.target.checked })} />Show on portfolio</label></div><div className="editor-footer"><button type="button" className="button button-quiet" onClick={() => setEditing(null)}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? "Saving…" : "Save skill"}</button></div></form></section></div>}
  </div>;
}
