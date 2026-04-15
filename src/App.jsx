import { useState, useEffect } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const DAYS_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const NO_LUNCH = ["Mardi", "Mercredi", "Jeudi", "Vendredi"];
const hasMeal = (day, type) => !(type === "Déjeuner" && NO_LUNCH.includes(day));
const initMeals = () => Object.fromEntries(DAYS.map(d => [d, { Déjeuner: "", Dîner: "" }]));

const AGE_RANGES = [
  { value: "0-3",   label: "0–3 ans"   },
  { value: "4-10",  label: "4–10 ans"  },
  { value: "11-17", label: "11–17 ans" },
];
const defaultHousehold = { adults: 2, children: [{ age: "4-10" }, { age: "4-10" }] };

function householdDesc({ adults, children }) {
  if (children.length === 0)
    return `${adults} adulte${adults > 1 ? "s" : ""}`;
  const groups = AGE_RANGES
    .map(r => { const n = children.filter(c => c.age === r.value).length; return n ? `${n} enfant${n > 1 ? "s" : ""} ${r.label}` : null; })
    .filter(Boolean).join(", ");
  return `${adults} adulte${adults > 1 ? "s" : ""}, ${children.length} enfant${children.length > 1 ? "s" : ""} (${groups})`;
}

// ─── VIKUNJA API ──────────────────────────────────────────────────────────────
async function vikunjaFetch(baseUrl, token, path, method = "GET", body = null) {
  const res = await fetch(`${baseUrl}/api/v1${path}`, {
    method,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Vikunja ${res.status}: ${await res.text()}`);
  return res.json();
}

async function getProjects(baseUrl, token) {
  return vikunjaFetch(baseUrl, token, "/projects");
}

async function pushToVikunja(baseUrl, token, projectId, shoppingList, weekLabel) {
  // Clear existing tasks with same label pattern? Non — on push direct.
  const created = [];
  for (const cat of shoppingList) {
    for (const item of cat.items) {
      const task = await vikunjaFetch(baseUrl, token, `/projects/${projectId}/tasks`, "PUT", {
        title: `${item.name} — ${item.qty}`,
        description: `Catégorie : ${cat.name}\nSemaine : ${weekLabel}`,
        labels: [],
      });
      created.push(task);
    }
  }
  return created;
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  app: {
    minHeight: "100vh",
    background: "#f7f4ef",
    fontFamily: "'Epilogue', system-ui, sans-serif",
    color: "#1a1a18",
  },
  header: {
    background: "#1a1a18",
    padding: "28px 32px 24px",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 16,
  },
  logo: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 28,
    color: "#f7f4ef",
    margin: 0,
    letterSpacing: "-0.02em",
  },
  sub: {
    fontSize: 11,
    color: "#5a5a52",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    marginTop: 4,
  },
  btn: (variant = "ghost") => ({
    padding: "9px 18px",
    borderRadius: 8,
    border: variant === "primary" ? "none"
      : variant === "danger" ? "1.5px solid #e85d4a"
      : variant === "green" ? "none"
      : "1.5px solid rgba(247,244,239,0.15)",
    background: variant === "primary" ? "#e8c547"
      : variant === "danger" ? "transparent"
      : variant === "green" ? "#3d9970"
      : "transparent",
    color: variant === "primary" ? "#1a1a18"
      : variant === "danger" ? "#e85d4a"
      : variant === "green" ? "#fff"
      : "#f7f4ef",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "inherit",
    letterSpacing: "0.04em",
    transition: "opacity 0.15s",
    whiteSpace: "nowrap",
  }),
  card: {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e8e4dc",
    overflow: "hidden",
  },
  pill: (color) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "2px 8px",
    borderRadius: 99,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    background: color === "amber" ? "#fef3c7" : "#dcfce7",
    color: color === "amber" ? "#92400e" : "#166534",
  }),
};

// ─── SETTINGS PANEL ───────────────────────────────────────────────────────────
function Settings({ config, onSave }) {
  const [local, setLocal] = useState(config);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const fetchProjects = async () => {
    if (!local.baseUrl || !local.token) return;
    setLoading(true); setErr(null);
    try {
      const list = await getProjects(local.baseUrl.replace(/\/$/, ""), local.token);
      setProjects(list || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const field = (label, key, placeholder, type = "text") => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#5a5a52", marginBottom: 6 }}>
        {label}
      </label>
      <input
        type={type}
        value={local[key] || ""}
        onChange={e => setLocal(p => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "10px 12px", borderRadius: 8,
          border: "1.5px solid #e8e4dc", background: "#fafaf8",
          fontSize: 13, fontFamily: "inherit", color: "#1a1a18",
          outline: "none", boxSizing: "border-box",
        }}
      />
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700 }}>Connexion Vikunja</h3>
      {field("URL de ton instance", "baseUrl", "https://vikunja.velluet.net")}
      {field("API Token", "token", "Ton token Vikunja", "password")}

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button style={S.btn("primary")} onClick={fetchProjects} disabled={loading}>
          {loading ? "Connexion…" : "🔗 Tester & charger les projets"}
        </button>
      </div>

      {err && <div style={{ padding: "10px 12px", borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontSize: 12, marginBottom: 16 }}>{err}</div>}

      {projects.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#5a5a52", marginBottom: 6 }}>
            Projet / Liste Courses
          </label>
          <select
            value={local.projectId || ""}
            onChange={e => setLocal(p => ({ ...p, projectId: e.target.value, projectName: projects.find(pr => String(pr.id) === e.target.value)?.title || "" }))}
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 8,
              border: "1.5px solid #e8e4dc", background: "#fafaf8",
              fontSize: 13, fontFamily: "inherit", color: "#1a1a18", outline: "none",
            }}
          >
            <option value="">— Choisir un projet —</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
      )}

      <button
        style={S.btn("green")}
        onClick={() => onSave(local)}
        disabled={!local.baseUrl || !local.token}
      >
        ✓ Sauvegarder
      </button>
    </div>
  );
}

// ─── HOUSEHOLD SETTINGS ───────────────────────────────────────────────────────
function HouseholdSettings({ household, onChange }) {
  const { adults, children } = household;

  const setAdults = n => onChange({ ...household, adults: Math.min(8, Math.max(1, n)) });
  const setChildCount = n => {
    const count = Math.min(8, Math.max(0, n));
    const next = Array.from({ length: count }, (_, i) => children[i] || { age: "4-10" });
    onChange({ ...household, children: next });
  };
  const setChildAge = (i, age) =>
    onChange({ ...household, children: children.map((c, j) => j === i ? { ...c, age } : c) });

  const stepBtn = (disabled) => ({
    width: 32, height: 32, borderRadius: 8, border: "1.5px solid #e8e4dc",
    background: disabled ? "#f0ece4" : "#fafaf8", cursor: disabled ? "default" : "pointer",
    fontSize: 18, fontFamily: "inherit", color: disabled ? "#c4bfb5" : "#1a1a18",
    fontWeight: 600, lineHeight: "30px", textAlign: "center", padding: 0,
  });

  const Stepper = ({ value, onDec, onInc, min, max }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <button style={stepBtn(value <= min)} onClick={onDec} disabled={value <= min}>−</button>
      <span style={{ fontSize: 22, fontWeight: 700, minWidth: 24, textAlign: "center" }}>{value}</span>
      <button style={stepBtn(value >= max)} onClick={onInc} disabled={value >= max}>+</button>
    </div>
  );

  const labelStyle = { display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#5a5a52", marginBottom: 10 };

  return (
    <div style={{ padding: 24 }}>
      <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700 }}>Composition du foyer</h3>

      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>Adultes</label>
        <Stepper value={adults} min={1} max={8} onDec={() => setAdults(adults - 1)} onInc={() => setAdults(adults + 1)} />
      </div>

      <div style={{ marginBottom: children.length > 0 ? 16 : 0 }}>
        <label style={labelStyle}>Enfants</label>
        <Stepper value={children.length} min={0} max={8} onDec={() => setChildCount(children.length - 1)} onInc={() => setChildCount(children.length + 1)} />
      </div>

      {children.length > 0 && (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {children.map((child, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 12, color: "#5a5a52", minWidth: 68, fontWeight: 600 }}>Enfant {i + 1}</span>
              <div style={{ display: "flex", gap: 6 }}>
                {AGE_RANGES.map(r => (
                  <button key={r.value} onClick={() => setChildAge(i, r.value)} style={{
                    padding: "5px 10px", borderRadius: 8, cursor: "pointer",
                    fontSize: 11, fontWeight: 600, fontFamily: "inherit",
                    border: `1.5px solid ${child.age === r.value ? "#3d9970" : "#e8e4dc"}`,
                    background: child.age === r.value ? "#f0fdf4" : "#fafaf8",
                    color: child.age === r.value ? "#166534" : "#5a5a52",
                    transition: "all 0.15s",
                  }}>{r.label}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 20, padding: "10px 14px", borderRadius: 8, background: "#f7f4ef", fontSize: 12, color: "#5a5a52" }}>
        {adults + children.length} personne{adults + children.length > 1 ? "s" : ""} au total · {householdDesc({ adults, children })}
      </div>
    </div>
  );
}

// ─── MEAL CELL ────────────────────────────────────────────────────────────────
function MealCell({ value, onChange, isVege }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => { setDraft(value); }, [value]);

  const commit = () => { setEditing(false); onChange(draft); };

  return (
    <div
      onClick={() => { setEditing(true); setDraft(value); }}
      style={{
        minHeight: 52,
        padding: "10px 12px",
        borderRadius: 8,
        background: value ? (isVege ? "#f0fdf4" : "#fffbeb") : "#fafaf8",
        border: `1.5px solid ${value ? (isVege ? "#bbf7d0" : "#fde68a") : "#e8e4dc"}`,
        cursor: "pointer",
        transition: "all 0.15s",
        position: "relative",
      }}
    >
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => e.key === "Enter" && commit()}
          style={{
            width: "100%", background: "transparent", border: "none",
            outline: "none", fontSize: 13, fontFamily: "inherit", color: "#1a1a18",
          }}
          placeholder="Nom du repas…"
        />
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: 13, color: value ? "#1a1a18" : "#c4bfb5", fontStyle: value ? "normal" : "italic", lineHeight: 1.4 }}>
            {value || "À définir"}
          </span>
          {value && (
            <span style={S.pill(isVege ? "green" : "amber")}>
              {isVege ? "🌿 Vég" : "🥩 Viande"}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── PUSH MODAL ───────────────────────────────────────────────────────────────
function PushModal({ config, shoppingList, weekLabel, onClose }) {
  const [status, setStatus] = useState("idle"); // idle | pushing | done | error
  const [msg, setMsg] = useState("");
  const [count, setCount] = useState(0);

  const push = async () => {
    if (!config.projectId) { setMsg("Aucun projet sélectionné dans les réglages."); setStatus("error"); return; }
    setStatus("pushing"); setMsg(""); setCount(0);
    try {
      const total = shoppingList.reduce((a, c) => a + c.items.length, 0);
      let done = 0;
      for (const cat of shoppingList) {
        for (const item of cat.items) {
          await vikunjaFetch(config.baseUrl.replace(/\/$/, ""), config.token, `/projects/${config.projectId}/tasks`, "PUT", {
            title: `${item.name} — ${item.qty}`,
            description: `Catégorie : ${cat.name} ${cat.emoji}\nSemaine courses : ${weekLabel}`,
          });
          done++;
          setCount(done);
        }
      }
      setStatus("done");
      setMsg(`${done} tâches créées dans "${config.projectName || "Courses"}" ✓`);
    } catch (e) {
      setStatus("error");
      setMsg(e.message);
    }
  };

  useEffect(() => { push(); }, []);

  const total = shoppingList.reduce((a, c) => a + c.items.length, 0);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(26,26,24,0.6)",
      backdropFilter: "blur(6px)", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{ ...S.card, maxWidth: 440, width: "100%", padding: 32, textAlign: "center" }}>
        {status === "pushing" && (
          <>
            <div style={{ fontSize: 40, marginBottom: 16, animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>Envoi vers Vikunja…</h3>
            <p style={{ color: "#5a5a52", fontSize: 14 }}>{count} / {total} tâches créées</p>
            <div style={{ marginTop: 16, height: 4, background: "#e8e4dc", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${(count / total) * 100}%`, height: "100%", background: "#3d9970", transition: "width 0.3s", borderRadius: 99 }} />
            </div>
          </>
        )}
        {status === "done" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>Terminé !</h3>
            <p style={{ color: "#5a5a52", fontSize: 14, marginBottom: 20 }}>{msg}</p>
            <button style={S.btn("primary")} onClick={onClose}>Fermer</button>
          </>
        )}
        {status === "error" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>Erreur</h3>
            <p style={{ color: "#991b1b", fontSize: 13, marginBottom: 20, wordBreak: "break-all" }}>{msg}</p>
            <button style={S.btn()} onClick={onClose}>Fermer</button>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── SHOPPING PREVIEW ─────────────────────────────────────────────────────────
function ShoppingPreview({ list, onPush, onClose, canPush }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(26,26,24,0.55)",
      backdropFilter: "blur(6px)", zIndex: 150,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{ ...S.card, maxWidth: 680, width: "100%", maxHeight: "88vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e8e4dc", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 22 }}>Liste de courses</h2>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#5a5a52" }}>
              {list.reduce((a, c) => a + c.items.length, 0)} ingrédients · {list.length} catégories
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {canPush && (
              <button style={S.btn("green")} onClick={onPush}>
                📋 Envoyer dans Vikunja
              </button>
            )}
            <button style={{ ...S.btn(), color: "#5a5a52", border: "1.5px solid #e8e4dc" }} onClick={onClose}>✕</button>
          </div>
        </div>
        <div style={{ overflowY: "auto", padding: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {list.map(cat => (
              <div key={cat.name} style={{ ...S.card, padding: "14px 16px" }}>
                <h4 style={{ margin: "0 0 10px", fontSize: 12, color: "#5a5a52", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {cat.emoji} {cat.name}
                </h4>
                <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                  {cat.items.map((item, i) => (
                    <li key={i} style={{
                      display: "flex", justifyContent: "space-between",
                      padding: "5px 0",
                      borderBottom: i < cat.items.length - 1 ? "1px solid #f0ece4" : "none",
                    }}>
                      <span style={{ fontSize: 13, color: "#1a1a18" }}>{item.name}</span>
                      <span style={{ fontSize: 11, color: "#8a8a7e", fontWeight: 600 }}>{item.qty}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [meals, setMeals] = useState(initMeals);
  const [vegeFlags, setVegeFlags] = useState({}); // { "Lundi-Dîner": true, ... }
  const [config, setConfig] = useState({ baseUrl: "", token: "", projectId: "", projectName: "" });
  const [household, setHousehold] = useState(() => {
    try { return JSON.parse(localStorage.getItem("meal-planner-household")) || defaultHousehold; }
    catch { return defaultHousehold; }
  });
  const [tab, setTab] = useState("plan"); // plan | settings | household

  useEffect(() => {
    localStorage.setItem("meal-planner-household", JSON.stringify(household));
  }, [household]);
  const [activeDay, setActiveDay] = useState(0);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState(null);
  const [shoppingList, setShoppingList] = useState(null);
  const [showShopping, setShowShopping] = useState(false);
  const [showPush, setShowPush] = useState(false);
  const [listLoading, setListLoading] = useState(false);

  const weekLabel = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const setMeal = (day, type, val) =>
    setMeals(p => ({ ...p, [day]: { ...p[day], [type]: val } }));

  const toggleVege = (day, type) => {
    const k = `${day}-${type}`;
    setVegeFlags(p => ({ ...p, [k]: !p[k] }));
  };

  const filledCount = DAYS.reduce((a, d) =>
    a + ["Déjeuner", "Dîner"].filter(t => hasMeal(d, t) && meals[d][t]).length, 0);
  const totalSlots = DAYS.reduce((a, d) =>
    a + ["Déjeuner", "Dîner"].filter(t => hasMeal(d, t)).length, 0);

  // ── AI: generate meals ──
  const generateMeals = async () => {
    setGenLoading(true); setGenError(null);
    const slots = DAYS.flatMap(d =>
      ["Déjeuner", "Dîner"].filter(t => hasMeal(d, t)).map(t => `${d} ${t}`)
    );
    const hDesc = householdDesc(household);
    const prompt = `Planning repas pour une famille de ${household.adults + household.children.length} personnes (${hDesc}) pour une semaine.
Critères : healthy, équilibré, ~50% végétarien. Adapte les plats et portions à la composition du foyer. Savoureux, accessible, varié.

Slots : ${slots.join(", ")}

Réponds UNIQUEMENT en JSON strict, sans backticks :
{
  "meals": {
    "Lundi": { "Déjeuner": "...", "Dîner": "..." },
    "Mardi": { "Dîner": "..." },
    "Mercredi": { "Dîner": "..." },
    "Jeudi": { "Dîner": "..." },
    "Vendredi": { "Dîner": "..." },
    "Samedi": { "Déjeuner": "...", "Dîner": "..." },
    "Dimanche": { "Déjeuner": "...", "Dîner": "..." }
  },
  "vege": ["Lundi-Dîner", "Mercredi-Dîner"]
}
Noms courts (max 5 mots), en français. Le champ "vege" liste les clés "Jour-Repas" végétariens.`;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3.2:3b",
          prompt,
          stream: false,
        }),
      });
      const data = await res.json();
      const text = data.response || "";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      const newMeals = initMeals();
      DAYS.forEach(d => {
        ["Déjeuner", "Dîner"].forEach(t => {
          if (hasMeal(d, t) && parsed.meals[d]?.[t]) newMeals[d][t] = parsed.meals[d][t];
        });
      });
      setMeals(newMeals);
      const flags = {};
      (parsed.vege || []).forEach(k => { flags[k] = true; });
      setVegeFlags(flags);
    } catch (e) {
      setGenError("Erreur IA : " + e.message);
    } finally {
      setGenLoading(false);
    }
  };

  // ── AI: generate shopping list ──
  const generateShopping = async () => {
    setListLoading(true);
    const mealSummary = DAYS.map(d =>
      ["Déjeuner", "Dîner"].filter(t => hasMeal(d, t) && meals[d][t])
        .map(t => `${d} ${t}: ${meals[d][t]}`).join("\n")
    ).filter(Boolean).join("\n");

    const hDesc = householdDesc(household);
    const total = household.adults + household.children.length;
    const prompt = `Famille de ${total} personnes (${hDesc}). Voici les repas de la semaine :
${mealSummary}

Génère une liste de courses complète, organisée par catégorie.
Adapte les quantités à la composition exacte du foyer.
Réponds UNIQUEMENT en JSON strict sans backticks :
{
  "categories": [
    { "name": "Fruits & légumes", "emoji": "🥦", "items": [{"name": "Tomates", "qty": "800g"}] },
    { "name": "Viandes & poissons", "emoji": "🥩", "items": [] },
    { "name": "Produits laitiers", "emoji": "🧀", "items": [] },
    { "name": "Épicerie sèche", "emoji": "🫙", "items": [] },
    { "name": "Boulangerie", "emoji": "🍞", "items": [] },
    { "name": "Surgelés", "emoji": "❄️", "items": [] },
    { "name": "Boissons & divers", "emoji": "🧴", "items": [] }
  ]
}
Omets les catégories vides.`;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3.2:3b",
          prompt,
          stream: false,
        }),
      });
      const data = await res.json();
      const text = data.response || "";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setShoppingList(parsed.categories.filter(c => c.items?.length > 0));
      setShowShopping(true);
    } catch (e) {
      alert("Erreur génération courses : " + e.message);
    } finally {
      setListLoading(false);
    }
  };

  const configOk = config.baseUrl && config.token && config.projectId;

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=Epilogue:wght@300;400;500;600;700&family=Playfair+Display:wght@400;600&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        button:hover { opacity: 0.85; }
        input:focus, select:focus { border-color: #3d9970 !important; box-shadow: 0 0 0 3px rgba(61,153,112,0.12); }
      `}</style>

      {/* HEADER */}
      <div style={S.header}>
        <div>
          <h1 style={S.logo}>Menu de la semaine</h1>
          <p style={{ ...S.sub, color: "#8a8a7e" }}>
            {householdDesc(household)} · {weekLabel}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button
            style={S.btn("primary")}
            onClick={generateMeals}
            disabled={genLoading}
          >
            {genLoading
              ? <span style={{ display: "inline-block", animation: "spin 0.8s linear infinite" }}>⟳</span>
              : "✦ Générer avec l'IA"}
          </button>
          <button
            style={S.btn()}
            onClick={() => setMeals(initMeals())}
          >
            Effacer
          </button>
          <button
            style={{ ...S.btn("green"), opacity: filledCount === 0 ? 0.4 : 1 }}
            onClick={generateShopping}
            disabled={filledCount === 0 || listLoading}
          >
            {listLoading ? "⟳ Génération…" : "🛒 Liste de courses"}
          </button>
          <button
            style={{ ...S.btn(), borderColor: tab === "household" ? "#e8c547" : undefined, color: tab === "household" ? "#e8c547" : undefined }}
            onClick={() => setTab(t => t === "household" ? "plan" : "household")}
          >
            👨‍👩‍👧 Paramètres
          </button>
          <button
            style={{ ...S.btn(), borderColor: tab === "settings" ? "#e8c547" : undefined, color: tab === "settings" ? "#e8c547" : undefined }}
            onClick={() => setTab(t => t === "settings" ? "plan" : "settings")}
          >
            ⚙ Vikunja {configOk ? "✓" : ""}
          </button>
        </div>
      </div>

      {genError && (
        <div style={{ background: "#fef2f2", borderBottom: "1px solid #fecaca", padding: "10px 32px", fontSize: 13, color: "#991b1b" }}>{genError}</div>
      )}

      {/* PROGRESS BAR */}
      <div style={{ background: "#1a1a18", padding: "0 32px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: 2, background: "rgba(247,244,239,0.1)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              width: `${(filledCount / totalSlots) * 100}%`, height: "100%",
              background: "#e8c547", borderRadius: 99, transition: "width 0.4s",
            }} />
          </div>
          <span style={{ fontSize: 11, color: "#5a5a52", whiteSpace: "nowrap" }}>
            {filledCount}/{totalSlots} repas
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 24px 48px" }}>

        {/* HOUSEHOLD SETTINGS */}
        {tab === "household" && (
          <div style={{ ...S.card, marginBottom: 24, animation: "fadeIn 0.2s ease" }}>
            <HouseholdSettings household={household} onChange={h => { setHousehold(h); }} />
          </div>
        )}

        {/* VIKUNJA SETTINGS */}
        {tab === "settings" && (
          <div style={{ ...S.card, marginBottom: 24, animation: "fadeIn 0.2s ease" }}>
            <Settings config={config} onSave={c => { setConfig(c); setTab("plan"); }} />
          </div>
        )}

        {/* DAY TABS */}
        <div style={{ display: "flex", gap: 4, marginBottom: 16, overflowX: "auto", paddingBottom: 2 }}>
          {DAYS.map((day, i) => {
            const filled = ["Déjeuner", "Dîner"].some(t => hasMeal(day, t) && meals[day][t]);
            return (
              <button key={day} onClick={() => setActiveDay(i)} style={{
                padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                background: activeDay === i ? "#1a1a18" : "transparent",
                color: activeDay === i ? "#f7f4ef" : "#8a8a7e",
                fontSize: 12, fontWeight: activeDay === i ? 700 : 400,
                fontFamily: "inherit", whiteSpace: "nowrap",
                transition: "all 0.15s", position: "relative",
              }}>
                {DAYS_SHORT[i]}
                {filled && <span style={{
                  display: "inline-block", width: 5, height: 5, borderRadius: "50%",
                  background: "#3d9970", marginLeft: 5, verticalAlign: "middle",
                }} />}
              </button>
            );
          })}
        </div>

        {/* DAY CARD */}
        {DAYS.map((day, i) => {
          if (i !== activeDay) return null;
          const slots = ["Déjeuner", "Dîner"].filter(t => hasMeal(day, t));
          return (
            <div key={day} style={{ ...S.card, animation: "fadeIn 0.15s ease" }}>
              <div style={{
                padding: "14px 20px", borderBottom: "1px solid #f0ece4",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 600 }}>{day}</span>
                <span style={{ fontSize: 11, color: "#8a8a7e" }}>
                  {slots.filter(t => meals[day][t]).length}/{slots.length} repas
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: slots.length === 1 ? "1fr" : "1fr 1fr", gap: 16, padding: 20 }}>
                {slots.map(type => {
                  const k = `${day}-${type}`;
                  const isVege = vegeFlags[k] || false;
                  return (
                    <div key={type}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#5a5a52" }}>
                          {type === "Déjeuner" ? "☀ Déjeuner" : "🌙 Dîner"}
                        </span>
                        {meals[day][type] && (
                          <button
                            onClick={() => toggleVege(day, type)}
                            style={{
                              fontSize: 10, padding: "2px 8px", borderRadius: 99,
                              border: `1px solid ${isVege ? "#bbf7d0" : "#fde68a"}`,
                              background: isVege ? "#f0fdf4" : "#fffbeb",
                              color: isVege ? "#166534" : "#92400e",
                              cursor: "pointer", fontFamily: "inherit", fontWeight: 700,
                            }}
                          >
                            {isVege ? "🌿 Vég" : "🥩 Viande"}
                          </button>
                        )}
                      </div>
                      <MealCell
                        value={meals[day][type]}
                        onChange={v => setMeal(day, type, v)}
                        isVege={isVege}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* WEEKLY OVERVIEW TABLE */}
        <div style={{ ...S.card, marginTop: 20 }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0ece4" }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#5a5a52" }}>Vue semaine</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#fafaf8" }}>
                  <th style={{ padding: "8px 14px", textAlign: "left", color: "#8a8a7e", fontWeight: 700, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", width: 80 }}>Repas</th>
                  {DAYS.map((d, i) => (
                    <th key={d} style={{
                      padding: "8px 8px", textAlign: "center", color: activeDay === i ? "#1a1a18" : "#8a8a7e",
                      fontWeight: activeDay === i ? 700 : 400, fontSize: 11, cursor: "pointer",
                      borderBottom: activeDay === i ? "2px solid #1a1a18" : "2px solid transparent",
                    }} onClick={() => setActiveDay(i)}>{DAYS_SHORT[i]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {["Déjeuner", "Dîner"].map(type => (
                  <tr key={type} style={{ borderTop: "1px solid #f0ece4" }}>
                    <td style={{ padding: "10px 14px", color: "#5a5a52", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {type === "Déjeuner" ? "☀" : "🌙"} {type === "Déjeuner" ? "Déj." : "Dîner"}
                    </td>
                    {DAYS.map(day => {
                      const active = hasMeal(day, type);
                      const val = meals[day][type];
                      const k = `${day}-${type}`;
                      const isVege = vegeFlags[k];
                      return (
                        <td key={day} style={{
                          padding: "8px 4px", textAlign: "center",
                          background: !active ? "#fafaf8" : undefined,
                        }}>
                          {!active ? (
                            <span style={{ color: "#e8e4dc", fontSize: 16 }}>·</span>
                          ) : (
                            <div style={{
                              fontSize: 11, lineHeight: 1.3, color: val ? "#1a1a18" : "#c4bfb5",
                              padding: "3px 4px", borderRadius: 6,
                              background: val ? (isVege ? "#f0fdf4" : "#fffbeb") : "transparent",
                            }}>
                              {val || "—"}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* VEGE STATS */}
        {filledCount > 0 && (() => {
          const vegeCount = Object.values(vegeFlags).filter(Boolean).length;
          const pct = Math.round((vegeCount / filledCount) * 100);
          return (
            <div style={{ marginTop: 12, display: "flex", gap: 12, fontSize: 12, color: "#8a8a7e" }}>
              <span>🌿 {vegeCount} repas végétariens</span>
              <span>🥩 {filledCount - vegeCount} avec viande/poisson</span>
              <span style={{ color: pct >= 40 && pct <= 60 ? "#166534" : "#92400e" }}>
                {pct}% végé {pct >= 40 && pct <= 60 ? "✓" : "— objectif 50%"}
              </span>
            </div>
          );
        })()}
      </div>

      {/* MODALS */}
      {showShopping && shoppingList && (
        <ShoppingPreview
          list={shoppingList}
          canPush={configOk}
          weekLabel={weekLabel}
          onPush={() => { setShowShopping(false); setShowPush(true); }}
          onClose={() => setShowShopping(false)}
        />
      )}
      {showPush && shoppingList && (
        <PushModal
          config={config}
          shoppingList={shoppingList}
          weekLabel={weekLabel}
          onClose={() => setShowPush(false)}
        />
      )}
    </div>
  );
}
