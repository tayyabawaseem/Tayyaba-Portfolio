import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  Code2,
  ExternalLink,
  Globe2,
  Home,
  Info,
  Mail,
  Pencil,
  Plus,
  Sparkles,
  Trash2
} from "lucide-react";
import api from "../services/api";
import loadWebFonts from "../utils/loadWebFonts";

const iconComponents = {
  home: Home,
  info: Info,
  sparkles: Sparkles,
  briefcase: BriefcaseBusiness,
  code: Code2,
  mail: Mail,
  globe: Globe2,
  "external-link": ExternalLink
};
const defaultItem = (order) => ({
  label: "",
  url: "",
  type: "anchor",
  icon: "",
  order,
  enabled: true,
  target: "same",
  parentId: null,
  isCta: false
});
const emptyItems = [];
const colorNames = [
  ["background", "Background"],
  ["text", "Text"],
  ["active", "Active"],
  ["hover", "Hover"],
  ["focus", "Focus"],
  ["border", "Border"]
];
const fontOptions = [
  "Inter", "Poppins", "Roboto", "Montserrat", "Plus Jakarta Sans", "DM Sans",
  "Manrope", "Outfit", "Source Sans 3", "Open Sans", "Lato", "Nunito Sans",
  "system-ui"
];

const flattenItems = (items, parentId = null, depth = 0, ancestors = new Set()) => {
  const children = items
    .filter((item) => (parentId === null ? !item.parentId : item.parentId === parentId) && (!item.id || !ancestors.has(item.id)))
    .sort((left, right) => left.order - right.order || left.label.localeCompare(right.label));
  return children.flatMap((item) => {
    if (!item.id) return [{ ...item, depth }];
    const nextAncestors = new Set(ancestors);
    nextAncestors.add(item.id);
    return [{ ...item, depth }, ...flattenItems(items, item.id, depth + 1, nextAncestors)];
  });
};

const countDescendants = (items, id) => {
  const direct = items.filter((item) => item.parentId === id);
  return direct.reduce((count, item) => count + 1 + countDescendants(items, item.id), 0);
};

export default function NavigationManager({ notify }) {
  const [config, setConfig] = useState(null);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingTheme, setEditingTheme] = useState("dark");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("navigation/admin");
      setConfig(data.navigation);
      setLoadError("");
    } catch (error) {
      setLoadError(error.message);
      notify(error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    let active = true;
    api.get("navigation/admin")
      .then(({ data }) => {
        if (active) {
          setConfig(data.navigation);
          setLoadError("");
        }
      })
      .catch((error) => {
        if (active) {
          setLoadError(error.message);
          notify(error.message, "error");
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [notify]);

  const items = config?.items || emptyItems;
  const appearance = config?.appearance;
  const parentCandidates = useMemo(() => {
    if (!editing) return [];
    const descendants = new Set();
    const collect = (id) => items.filter((item) => item.parentId === id).forEach((item) => {
      descendants.add(item.id);
      collect(item.id);
    });
    if (editing.id) collect(editing.id);
    return items.filter((item) => item.type === "dropdown" && item.id !== editing.id && !descendants.has(item.id));
  }, [editing, items]);
  const rows = useMemo(() => flattenItems(items), [items]);
  const filteredRows = rows.filter((item) => {
    const query = search.trim().toLowerCase();
    const matchesText = !query || [item.label, item.url, item.type].some((value) => value.toLowerCase().includes(query));
    const matchesStatus = statusFilter === "all" || (statusFilter === "enabled" ? item.enabled : !item.enabled);
    return matchesText && matchesStatus;
  });
  const previewItems = editing
    ? editing.id
      ? items.map((item) => item.id === editing.id ? editing : item)
      : [...items, editing]
    : items;
  const enabledPreviewItems = flattenItems(previewItems.filter((item) => item.enabled));
  const currentColors = appearance?.colors?.[editingTheme] || {};

  useEffect(() => {
    if (appearance?.fontFamily) loadWebFonts([appearance.fontFamily]);
  }, [appearance?.fontFamily]);

  const saveItem = async (event) => {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    const payload = {
      label: editing.label,
      url: editing.type === "dropdown" ? "" : editing.url,
      type: editing.type,
      icon: editing.icon || "",
      order: Number(editing.order),
      enabled: editing.enabled,
      target: editing.target,
      parentId: editing.parentId || null,
      isCta: editing.type !== "dropdown" && Boolean(editing.isCta)
    };
    try {
      if (editing.id) await api.put(`navigation/items/${editing.id}`, payload);
      else await api.post("navigation/items", payload);
      notify(editing.id ? "Navigation item saved." : "Navigation item created.");
      setEditing(null);
      await load();
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (item) => {
    const descendants = countDescendants(items, item.id);
    const detail = descendants ? ` Its ${descendants} nested item(s) will also be deleted.` : "";
    if (!window.confirm(`Delete "${item.label}"?${item.system ? " This is a protected system item." : detail}`)) return;
    try {
      await api.delete(`navigation/items/${item.id}`);
      notify("Navigation item deleted.");
      await load();
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const saveAppearance = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put("navigation/appearance", appearance);
      setConfig((current) => ({ ...current, appearance: data.appearance }));
      notify("Navigation appearance saved.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!window.confirm("Restore all navigation items and appearance settings to defaults?")) return;
    setSaving(true);
    try {
      const { data } = await api.put("navigation/reset");
      setConfig(data.navigation);
      setEditing(null);
      notify("Navigation restored to defaults.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const updateAppearance = (key, value) => setConfig((current) => ({
    ...current,
    appearance: { ...current.appearance, [key]: value }
  }));
  const updateColor = (key, value) => setConfig((current) => ({
    ...current,
    appearance: {
      ...current.appearance,
      colors: {
        ...current.appearance.colors,
        [editingTheme]: { ...current.appearance.colors[editingTheme], [key]: value }
      }
    }
  }));

  if (loading) return <div className="manager-page"><div className="admin-panel"><p>Loading navigation settings…</p></div></div>;
  if (loadError || !config || !appearance) return <div className="manager-page"><div className="admin-error" role="alert">{loadError || "Navigation settings could not be loaded."}<button className="button button-quiet" type="button" onClick={load}>Try again</button></div></div>;

  return (
    <div className="manager-page navigation-manager">
      <div className="admin-page-heading">
        <div><p className="admin-kicker">SITE STRUCTURE</p><h1>Navigation</h1><p>Manage public links, dropdowns, responsive behavior, and navigation styling.</p></div>
        <button className="button button-primary" type="button" onClick={() => setEditing(defaultItem(items.length))}><Plus size={16} /> Add navigation item</button>
      </div>

      <section className="admin-panel nav-preview-panel">
        <div className="panel-heading"><div><h2>Live navigation preview</h2><p>Preview updates as you edit; save items and styles separately.</p></div></div>
        <div className="nav-preview" style={{
          minHeight: appearance.navbarHeight,
          maxWidth: appearance.navbarWidth,
          paddingInline: appearance.paddingX,
          gap: appearance.spacing,
          justifyContent: appearance.alignment === "center" ? "center" : appearance.alignment === "right" ? "flex-end" : appearance.alignment === "left" ? "flex-start" : "space-between",
          fontFamily: `"${appearance.fontFamily}", sans-serif`,
          fontSize: appearance.fontSize,
          fontWeight: appearance.fontWeight,
          borderColor: currentColors.border,
          borderWidth: appearance.borderWidth,
          borderStyle: "solid",
          background: currentColors.background,
          color: currentColors.text,
          borderRadius: appearance.borderRadius,
          boxShadow: appearance.shadow === "none" ? "none" : appearance.shadow === "strong" ? "0 12px 32px rgba(0,0,0,.24)" : appearance.shadow === "medium" ? "0 8px 22px rgba(0,0,0,.18)" : "0 4px 14px rgba(0,0,0,.12)",
          "--nav-preview-hover": currentColors.hover,
          "--nav-preview-active": currentColors.active
        }}>
          {appearance.logoVisible && <strong className="nav-preview-brand" style={{ width: appearance.logoWidth, height: appearance.logoHeight }}>P</strong>}
          <div className="nav-preview-links">{enabledPreviewItems.filter((item) => !item.parentId).map((item) => {
            const childCount = previewItems.filter((child) => child.enabled && child.parentId === item.id).length;
            return (
              <span className={item.isCta ? "nav-preview-cta" : ""} key={item.id || `draft-${item.label}`}>
                <span style={{ color: item.isCta ? currentColors.active : currentColors.text }}>
                  {item.label || "New item"}{item.type === "dropdown" ? ` ⌄${childCount ? ` ${childCount}` : ""}` : ""}
                </span>
              </span>
            );
          })}</div>
          {appearance.mobileLayout === "hamburger" && <button className="nav-preview-hamburger" type="button" aria-label="Mobile menu preview"><span /><span /><span /></button>}
        </div>
      </section>

      <div className="manager-toolbar nav-manager-toolbar">
        <label className="search-field"><span aria-hidden="true">⌕</span><input aria-label="Search navigation" placeholder="Search label, URL, or type" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <select aria-label="Filter navigation by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">All statuses</option><option value="enabled">Enabled</option><option value="disabled">Disabled</option>
        </select>
        <span className="item-count">{filteredRows.length} of {items.length} items</span>
      </div>

      {filteredRows.length ? (
        <div className="content-table navigation-table" role="table" aria-label="Navigation items">
          <div className="navigation-table-head" role="row"><span>Item</span><span>Type / URL</span><span>Status</span><span>Order</span><span>Actions</span></div>
          {filteredRows.map((item) => {
            const Icon = iconComponents[item.icon];
            const parent = items.find((candidate) => candidate.id === item.parentId);
            return (
              <div className="navigation-row" role="row" key={item.id} style={{ "--nav-depth": item.depth }}>
                <div className="navigation-item-label">{Icon && <Icon size={15} />}<strong>{item.label}</strong>{item.isCta && <span className="nav-cta-badge">CTA</span>}{item.system && <span className="nav-system-badge">System</span>}{parent && <small>in {parent.label}</small>}</div>
                <div className="navigation-item-url"><span>{item.type}</span><code>{item.url || "Dropdown"}</code>{item.target === "new" && <small>new tab</small>}</div>
                <span className={`status-pill ${item.enabled ? "status-published" : "status-draft"}`}>{item.enabled ? "Enabled" : "Disabled"}</span>
                <span className="nav-order-number">{item.order}</span>
                <div className="row-actions"><button type="button" aria-label={`Edit ${item.label}`} onClick={() => setEditing({ ...item })}><Pencil size={15} /></button><button type="button" className="delete-action" aria-label={item.system ? `${item.label} is protected` : `Delete ${item.label}`} title={item.system ? "System navigation items cannot be deleted" : "Delete navigation item"} disabled={item.system} onClick={() => removeItem(item)}><Trash2 size={15} /></button></div>
              </div>
            );
          })}
        </div>
      ) : <div className="admin-panel"><div className="empty-state"><span><Globe2 size={20} /></span><h3>{items.length ? "No matching navigation items" : "No navigation items"}</h3><p>Create a link or dropdown to show it in the public navigation.</p><button className="button button-primary" type="button" onClick={() => setEditing(defaultItem(items.length))}><Plus size={15} /> Add item</button></div></div>}

      {editing && (
        <section className="admin-panel nav-item-editor">
          <div className="panel-heading"><div><h2>{editing.id ? `Edit ${editing.label}` : "New navigation item"}</h2><p>Items update the public menu as soon as they are saved.</p></div><button className="icon-button" type="button" aria-label="Close editor" onClick={() => setEditing(null)}>×</button></div>
          <form className="editor-fields" onSubmit={saveItem}>
            <label>Label<input required maxLength={80} value={editing.label} onChange={(event) => setEditing({ ...editing, label: event.target.value })} /></label>
            <label>Item type<select value={editing.type} onChange={(event) => setEditing({ ...editing, type: event.target.value, url: event.target.value === "dropdown" ? "" : editing.url || (event.target.value === "anchor" ? "#about" : ""), isCta: event.target.value === "dropdown" ? false : editing.isCta })}><option value="anchor">Section anchor</option><option value="internal">Internal page</option><option value="external">External link</option><option value="custom">Custom URL</option><option value="dropdown">Dropdown menu</option></select></label>
            {editing.type !== "dropdown" && <label>URL or path<input required maxLength={500} placeholder={editing.type === "anchor" ? "#projects" : editing.type === "internal" ? "/about" : "https://example.com"} value={editing.url} onChange={(event) => setEditing({ ...editing, url: event.target.value })} /></label>}
            <label>Icon<select value={editing.icon || ""} onChange={(event) => setEditing({ ...editing, icon: event.target.value })}><option value="">No icon</option><option value="home">Home</option><option value="info">Info</option><option value="sparkles">Sparkles</option><option value="briefcase">Briefcase</option><option value="code">Code</option><option value="mail">Mail</option><option value="globe">Globe</option><option value="external-link">External link</option></select></label>
            <label>Parent dropdown<select value={editing.parentId || ""} onChange={(event) => setEditing({ ...editing, parentId: event.target.value || null })}><option value="">Top level</option>{parentCandidates.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label>
            <label>Position<input type="number" min="0" max="9999" step="1" required value={editing.order} onChange={(event) => setEditing({ ...editing, order: Number(event.target.value) })} /></label>
            <label>Open link<select value={editing.target} disabled={editing.type === "dropdown" || editing.type === "anchor"} onChange={(event) => setEditing({ ...editing, target: event.target.value })}><option value="same">Same tab</option><option value="new">New tab</option></select></label>
            <label className="checkbox-field"><input type="checkbox" checked={editing.enabled} onChange={(event) => setEditing({ ...editing, enabled: event.target.checked })} />Enabled on public site</label>
            <label className="checkbox-field"><input type="checkbox" checked={Boolean(editing.isCta)} disabled={editing.type === "dropdown"} onChange={(event) => setEditing({ ...editing, isCta: event.target.checked })} />Style as a CTA button</label>
            <div className="editor-footer field-wide"><button className="button button-quiet" type="button" onClick={() => setEditing(null)}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? "Saving…" : "Save item"}</button></div>
          </form>
        </section>
      )}

      <section className="admin-panel nav-appearance-panel">
        <div className="panel-heading"><div><h2>Navigation appearance & behavior</h2><p>Colors are configured separately for dark and light visitors.</p></div></div>
        <form className="nav-appearance-form" onSubmit={saveAppearance}>
          <div className="editor-fields">
            <label className="checkbox-field"><input type="checkbox" checked={appearance.logoVisible} onChange={(event) => updateAppearance("logoVisible", event.target.checked)} />Show logo</label>
            <label>Logo width · {appearance.logoWidth}px<input type="range" min="20" max="280" value={appearance.logoWidth} onChange={(event) => updateAppearance("logoWidth", Number(event.target.value))} /></label>
            <label>Logo height · {appearance.logoHeight}px<input type="range" min="20" max="120" value={appearance.logoHeight} onChange={(event) => updateAppearance("logoHeight", Number(event.target.value))} /></label>
            <label>Navbar height · {appearance.navbarHeight}px<input type="range" min="40" max="180" value={appearance.navbarHeight} onChange={(event) => updateAppearance("navbarHeight", Number(event.target.value))} /></label>
            <label>Navbar width · {appearance.navbarWidth}px<input type="range" min="320" max="1920" step="20" value={appearance.navbarWidth} onChange={(event) => updateAppearance("navbarWidth", Number(event.target.value))} /></label>
            <label>Position<select value={appearance.position} onChange={(event) => updateAppearance("position", event.target.value)}><option value="sticky">Sticky</option><option value="fixed">Fixed</option><option value="static">Static</option></select></label>
            <label>Font family<select value={appearance.fontFamily} onChange={(event) => updateAppearance("fontFamily", event.target.value)}>{fontOptions.map((font) => <option key={font}>{font}</option>)}</select></label>
            <label>Font size · {appearance.fontSize}px<input type="range" min="8" max="24" value={appearance.fontSize} onChange={(event) => updateAppearance("fontSize", Number(event.target.value))} /></label>
            <label>Font weight · {appearance.fontWeight}<input type="range" min="300" max="800" step="100" value={appearance.fontWeight} onChange={(event) => updateAppearance("fontWeight", Number(event.target.value))} /></label>
            <label>Item spacing · {appearance.spacing}px<input type="range" min="0" max="80" value={appearance.spacing} onChange={(event) => updateAppearance("spacing", Number(event.target.value))} /></label>
            <label>Alignment<select value={appearance.alignment} onChange={(event) => updateAppearance("alignment", event.target.value)}><option value="space-between">Space between</option><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label>
            <label>Horizontal padding · {appearance.paddingX}px<input type="range" min="0" max="120" value={appearance.paddingX} onChange={(event) => updateAppearance("paddingX", Number(event.target.value))} /></label>
            <label>Border width · {appearance.borderWidth}px<input type="range" min="0" max="5" value={appearance.borderWidth} onChange={(event) => updateAppearance("borderWidth", Number(event.target.value))} /></label>
            <label>Border radius · {appearance.borderRadius}px<input type="range" min="0" max="32" value={appearance.borderRadius} onChange={(event) => updateAppearance("borderRadius", Number(event.target.value))} /></label>
            <label>Shadow<select value={appearance.shadow} onChange={(event) => updateAppearance("shadow", event.target.value)}><option value="none">None</option><option value="soft">Soft</option><option value="medium">Medium</option><option value="strong">Strong</option></select></label>
            <label>Desktop layout<select value={appearance.desktopLayout} onChange={(event) => updateAppearance("desktopLayout", event.target.value)}><option value="horizontal">Horizontal</option><option value="centered">Centered</option><option value="compact">Compact</option></select></label>
            <label>Tablet layout<select value={appearance.tabletLayout} onChange={(event) => updateAppearance("tabletLayout", event.target.value)}><option value="horizontal">Horizontal</option><option value="compact">Compact</option><option value="hamburger">Hamburger</option><option value="stacked">Stacked</option><option value="hidden">Hidden</option></select></label>
            <label>Mobile layout<select value={appearance.mobileLayout} onChange={(event) => updateAppearance("mobileLayout", event.target.value)}><option value="hamburger">Hamburger</option><option value="stacked">Stacked</option><option value="hidden">Hidden</option><option value="horizontal">Horizontal</option></select></label>
            <label>Mobile menu behavior<select value={appearance.mobileMenuBehavior} onChange={(event) => updateAppearance("mobileMenuBehavior", event.target.value)}><option value="dropdown">Dropdown</option><option value="overlay">Overlay</option></select></label>
            <label>Dropdown animation<select value={appearance.dropdownAnimation} onChange={(event) => updateAppearance("dropdownAnimation", event.target.value)}><option value="none">None</option><option value="fade">Fade</option><option value="slide">Slide</option></select></label>
            <label>Transition · {appearance.transitionDuration}s<input type="range" min="0" max="1.5" step="0.05" value={appearance.transitionDuration} onChange={(event) => updateAppearance("transitionDuration", Number(event.target.value))} /></label>
          </div>
          <div className="palette-tabs" role="group" aria-label="Navigation color palette">
            {["dark", "light"].map((theme) => <button type="button" className={`palette-tab ${editingTheme === theme ? "active" : ""}`} key={theme} aria-pressed={editingTheme === theme} onClick={() => setEditingTheme(theme)}>{theme === "dark" ? "Dark" : "Light"} palette</button>)}
          </div>
          <div className="color-control-grid">{colorNames.map(([key, label]) => <label className="color-control" key={key}><span>{label}</span><input type="color" value={currentColors[key]} onChange={(event) => updateColor(key, event.target.value)} /><code>{currentColors[key]}</code></label>)}</div>
          <div className="editor-footer"><button className="button button-primary" disabled={saving}>{saving ? "Saving…" : "Save navigation appearance"}</button></div>
        </form>
      </section>
      <div className="editor-footer nav-reset"><span className="form-help">System links are protected from deletion. Deleting a dropdown removes its nested items.</span><button className="button button-quiet" type="button" disabled={saving} onClick={reset}>Reset navigation to defaults</button></div>
    </div>
  );
}
