import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Play, Plus, RotateCcw, Trash2 } from "lucide-react";
import api from "../services/api";

const effects = [
  ["fade-in", "Fade In"], ["fade-up", "Fade Up"], ["fade-down", "Fade Down"],
  ["fade-left", "Fade Left"], ["fade-right", "Fade Right"], ["slide-in", "Slide In"],
  ["zoom-in", "Zoom In"], ["zoom-out", "Zoom Out"], ["scale", "Scale"],
  ["rotate", "Rotate"], ["bounce", "Bounce"], ["float", "Float"],
  ["pulse", "Pulse"], ["staggered-reveal", "Staggered Reveal"]
];
const targets = [
  ["navbar", "Navbar"], ["hero", "Hero section"], ["headings", "Headings"],
  ["text", "Text"], ["buttons-links", "Buttons and links"], ["images", "Images"],
  ["project-cards", "Project cards"], ["service-cards", "Service cards"],
  ["about", "About section"], ["skills", "Skills section"],
  ["experience", "Experience section"], ["projects", "Projects section"],
  ["services", "Services section"], ["education", "Education section"],
  ["certifications", "Certifications section"], ["testimonials", "Testimonials section"],
  ["contact", "Contact section"], ["footer", "Footer"]
];
const effectLabel = (effect) => effects.find(([value]) => value === effect)?.[1] || effect;
const targetLabel = (target) => targets.find(([value]) => value === target)?.[1] || target;
const newAnimation = () => ({
  name: "",
  target: "hero",
  effect: "fade-up",
  duration: 0.6,
  delay: 0,
  speed: 1,
  easing: "easeOut",
  iterations: 1,
  direction: "normal",
  trigger: "scroll",
  threshold: 0.2,
  enabled: true,
  custom: { distance: 24, scale: 0.94, rotation: 8, staggerDelay: 0.08 }
});

const previewFrames = (animation) => {
  const distance = animation.custom?.distance ?? 24;
  const scale = animation.custom?.scale ?? 0.94;
  const rotation = animation.custom?.rotation ?? 8;
  const from = { opacity: 0 };
  const to = { opacity: 1 };
  if (["fade-up", "staggered-reveal", "bounce", "float"].includes(animation.effect)) from.y = distance;
  if (animation.effect === "fade-down") from.y = -distance;
  if (["fade-left", "slide-in"].includes(animation.effect)) from.x = distance;
  if (animation.effect === "fade-right") from.x = -distance;
  if (["zoom-in", "scale"].includes(animation.effect)) from.scale = scale;
  if (animation.effect === "zoom-out") from.scale = 1 + (1 - scale);
  if (animation.effect === "rotate") from.rotate = -rotation;
  if (animation.effect === "float") to.y = [0, -distance / 2, 0];
  if (animation.effect === "pulse") to.scale = [1, Math.max(scale, 1.04), 1];
  if (animation.effect === "bounce") to.y = [0, -distance / 3, 0];
  return { from, to };
};

function AnimationPreview({ animation, playKey }) {
  const frames = previewFrames(animation);
  return (
    <div className="animation-preview-stage">
      <motion.div
        key={playKey}
        className="animation-preview-chip"
        initial={frames.from}
        animate={frames.to}
        transition={{
          duration: animation.duration / animation.speed,
          delay: animation.delay,
          ease: animation.easing,
          repeat: animation.iterations - 1,
          repeatType: animation.direction === "normal" ? "loop" : animation.direction === "reverse" ? "reverse" : "mirror"
        }}
      >
        {effectLabel(animation.effect)}
      </motion.div>
    </div>
  );
}

export default function AnimationManager({ notify }) {
  const [animations, setAnimations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [targetFilter, setTargetFilter] = useState("all");
  const [effectFilter, setEffectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [previewing, setPreviewing] = useState(null);
  const [previewKey, setPreviewKey] = useState(0);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("animations/admin");
      setAnimations(data.animations || []);
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
    api.get("animations/admin")
      .then(({ data }) => {
        if (active) {
          setAnimations(data.animations || []);
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

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return animations.filter((animation) =>
      (!search || `${animation.name} ${animation.target} ${animation.effect}`.toLowerCase().includes(search)) &&
      (targetFilter === "all" || animation.target === targetFilter) &&
      (effectFilter === "all" || animation.effect === effectFilter) &&
      (statusFilter === "all" || (statusFilter === "enabled" ? animation.enabled : !animation.enabled))
    );
  }, [animations, query, targetFilter, effectFilter, statusFilter]);

  const save = async (event) => {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    const payload = {
      ...editing,
      duration: Number(editing.duration),
      delay: Number(editing.delay),
      speed: Number(editing.speed),
      iterations: Number(editing.iterations),
      threshold: Number(editing.threshold),
      custom: Object.fromEntries(Object.entries(editing.custom || {}).map(([key, value]) => [key, Number(value)]))
    };
    try {
      if (editing.id) await api.put(`animations/${editing.id}`, payload);
      else await api.post("animations", payload);
      notify(editing.id ? "Animation saved." : "Animation created.");
      setEditing(null);
      await load();
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (animation) => {
    if (!window.confirm(`Delete the "${animation.name}" animation?`)) return;
    try {
      await api.delete(`animations/${animation.id}`);
      notify("Animation deleted.");
      if (previewing?.id === animation.id) setPreviewing(null);
      await load();
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const reset = async () => {
    if (!window.confirm("Restore the website animations to their default presets?")) return;
    setSaving(true);
    try {
      const { data } = await api.put("animations/reset");
      setAnimations(data.animations || []);
      setEditing(null);
      setPreviewing(null);
      notify("Animations restored to defaults.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const update = (key, value) => setEditing((current) => ({ ...current, [key]: value }));
  const updateCustom = (key, value) => setEditing((current) => ({
    ...current,
    custom: { ...current.custom, [key]: Number(value) }
  }));
  const preview = (animation) => {
    setPreviewing(animation);
    setPreviewKey((current) => current + 1);
  };

  if (loading) return <div className="manager-page"><div className="admin-panel"><p>Loading animation settings…</p></div></div>;
  if (loadError) return <div className="manager-page"><div className="admin-error" role="alert">{loadError}<button className="button button-quiet" type="button" onClick={load}>Try again</button></div></div>;

  return (
    <div className="manager-page animation-manager">
      <div className="admin-page-heading">
        <div><p className="admin-kicker">MOTION SYSTEM</p><h1>Website Animations</h1><p>Configure reusable, reduced-motion-aware effects across the public portfolio.</p></div>
        <button className="button button-primary" type="button" onClick={() => setEditing(newAnimation())}><Plus size={16} /> Add animation</button>
      </div>

      <div className="animation-filter-toolbar manager-toolbar">
        <label className="search-field"><span aria-hidden="true">⌕</span><input aria-label="Search animations" placeholder="Search animations" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <select aria-label="Filter animations by target" value={targetFilter} onChange={(event) => setTargetFilter(event.target.value)}><option value="all">All targets</option>{targets.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>
        <select aria-label="Filter animations by effect" value={effectFilter} onChange={(event) => setEffectFilter(event.target.value)}><option value="all">All effects</option>{effects.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>
        <select aria-label="Filter animations by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option><option value="enabled">Enabled</option><option value="disabled">Disabled</option></select>
        <span className="item-count">{filtered.length} of {animations.length}</span>
      </div>

      {filtered.length ? <div className="content-table animation-table" role="table" aria-label="Website animations">
        <div className="animation-table-head" role="row"><span>Name / target</span><span>Effect / trigger</span><span>Timing</span><span>Status</span><span>Actions</span></div>
        {filtered.map((animation) => <div className="animation-row" role="row" key={animation.id}>
          <div><strong>{animation.name}</strong><span>{targetLabel(animation.target)}</span></div>
          <div><span className="animation-effect-label">{effectLabel(animation.effect)}</span><small>{animation.trigger} · {Math.round(animation.threshold * 100)}% threshold</small></div>
          <div><span>{animation.duration}s · {animation.speed}×</span><small>{animation.delay}s delay · {animation.iterations} iteration(s)</small></div>
          <span className={`status-pill ${animation.enabled ? "status-published" : "status-draft"}`}>{animation.enabled ? "Enabled" : "Disabled"}</span>
          <div className="row-actions">
            <button type="button" aria-label={`Preview ${animation.name}`} onClick={() => preview(animation)}><Play size={15} /></button>
            <button type="button" aria-label={`Edit ${animation.name}`} onClick={() => setEditing({ ...animation, custom: { ...animation.custom } })}><Pencil size={15} /></button>
            <button type="button" className="delete-action" aria-label={`Delete ${animation.name}`} onClick={() => remove(animation)}><Trash2 size={15} /></button>
          </div>
        </div>)}
      </div> : <div className="admin-panel"><div className="empty-state"><span><RotateCcw size={20} /></span><h3>{animations.length ? "No matching animations" : "No animations configured"}</h3><p>Create a supported animation or restore the recommended defaults.</p><button className="button button-primary" type="button" onClick={() => setEditing(newAnimation())}><Plus size={15} /> Add animation</button></div></div>}

      {previewing && <section className="admin-panel animation-preview-panel">
        <div className="panel-heading"><div><h2>Animation preview</h2><p>{previewing.name} · {targetLabel(previewing.target)}</p></div><button className="button button-quiet" type="button" onClick={() => preview(previewing)}><Play size={14} /> Replay</button></div>
        <AnimationPreview animation={editing || previewing} playKey={previewKey} />
      </section>}

      {editing && <section className="admin-panel animation-editor">
        <div className="panel-heading"><div><h2>{editing.id ? `Edit ${editing.name}` : "New animation"}</h2><p>Changes are only published after saving.</p></div><button type="button" className="icon-button" aria-label="Close editor" onClick={() => setEditing(null)}>×</button></div>
        <form className="editor-fields" onSubmit={save}>
          <label>Animation name<input required maxLength={80} value={editing.name} onChange={(event) => update("name", event.target.value)} /></label>
          <label>Target<select value={editing.target} onChange={(event) => update("target", event.target.value)}>{targets.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label>Effect / preset<select value={editing.effect} onChange={(event) => update("effect", event.target.value)}>{effects.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label>Trigger<select value={editing.trigger} onChange={(event) => update("trigger", event.target.value)}><option value="load">Page load</option><option value="scroll">Scroll into view</option><option value="hover">Hover</option><option value="click">Click / tap</option></select></label>
          <label>Duration · {editing.duration}s<input type="number" min="0.1" max="10" step="0.05" required value={editing.duration} onChange={(event) => update("duration", event.target.value)} /></label>
          <label>Delay · {editing.delay}s<input type="number" min="0" max="5" step="0.05" value={editing.delay} onChange={(event) => update("delay", event.target.value)} /></label>
          <label>Speed multiplier<input type="number" min="0.25" max="4" step="0.05" value={editing.speed} onChange={(event) => update("speed", event.target.value)} /></label>
          <label>Easing<select value={editing.easing} onChange={(event) => update("easing", event.target.value)}><option value="linear">Linear</option><option value="easeIn">Ease in</option><option value="easeOut">Ease out</option><option value="easeInOut">Ease in/out</option></select></label>
          <label>Iterations<input type="number" min="1" max="20" step="1" value={editing.iterations} onChange={(event) => update("iterations", event.target.value)} /></label>
          <label>Direction<select value={editing.direction} onChange={(event) => update("direction", event.target.value)}><option value="normal">Normal</option><option value="reverse">Reverse</option><option value="alternate">Alternate</option><option value="alternate-reverse">Alternate reverse</option></select></label>
          <label>Scroll threshold · {Math.round(editing.threshold * 100)}%<input type="range" min="0" max="1" step="0.05" value={editing.threshold} onChange={(event) => update("threshold", Number(event.target.value))} /></label>
          <label className="checkbox-field"><input type="checkbox" checked={editing.enabled} onChange={(event) => update("enabled", event.target.checked)} />Enabled on public site</label>
          <fieldset className="field-control field-wide animation-custom-fields"><legend>Custom effect settings</legend><div className="editor-fields">
            <label>Travel distance · {editing.custom?.distance ?? 24}px<input type="range" min="0" max="400" value={editing.custom?.distance ?? 24} onChange={(event) => updateCustom("distance", event.target.value)} /></label>
            <label>Scale · {editing.custom?.scale ?? 0.94}<input type="number" min="0.2" max="2" step="0.01" value={editing.custom?.scale ?? 0.94} onChange={(event) => updateCustom("scale", event.target.value)} /></label>
            <label>Rotation · {editing.custom?.rotation ?? 8}°<input type="number" min="-360" max="360" step="1" value={editing.custom?.rotation ?? 8} onChange={(event) => updateCustom("rotation", event.target.value)} /></label>
            <label>Stagger delay · {editing.custom?.staggerDelay ?? 0.08}s<input type="number" min="0" max="1" step="0.01" value={editing.custom?.staggerDelay ?? 0.08} onChange={(event) => updateCustom("staggerDelay", event.target.value)} /></label>
          </div></fieldset>
          <div className="animation-editor-preview field-wide"><AnimationPreview animation={editing} playKey={previewKey + 1} /><button className="button button-quiet" type="button" onClick={() => setPreviewKey((current) => current + 1)}><Play size={14} /> Preview current settings</button></div>
          <div className="editor-footer field-wide"><button className="button button-quiet" type="button" onClick={() => setEditing(null)}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? "Saving…" : "Save animation"}</button></div>
        </form>
      </section>}

      <div className="editor-footer animation-reset"><span className="form-help">Reduced-motion preferences disable these effects for visitors who request less motion.</span><button className="button button-quiet" type="button" onClick={reset} disabled={saving}><RotateCcw size={14} /> Reset animations to defaults</button></div>
    </div>
  );
}
