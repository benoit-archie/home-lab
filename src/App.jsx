import { useState, useEffect } from "react";
import { useLang } from "./i18n.js";

function extractJSON(text) {
  const start = text.indexOf("{");
  if (start === -1) throw new Error("No JSON found in response");
  let depth = 0, inStr = false, escape = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (escape) { escape = false; continue; }
    if (c === "\\" && inStr) { escape = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === "{") depth++;
    if (c === "}") { depth--; if (depth === 0) return JSON.parse(text.slice(start, i + 1)); }
  }
  throw new Error("Unterminated JSON in response");
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

const LANGS = {
  fr: {
    label: "FR", flag: "🇫🇷", name: "français",
    days: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"],
    daysShort: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
    ageRanges: [
      { value: "0-3",   label: "0–3 ans"   },
      { value: "4-10",  label: "4–10 ans"  },
      { value: "11-17", label: "11–17 ans" },
    ],
    householdDesc: ({ adults, children }, ageRanges) => {
      if (children.length === 0) return `${adults} adulte${adults > 1 ? "s" : ""}`;
      const groups = ageRanges
        .map(r => { const n = children.filter(c => c.age === r.value).length; return n ? `${n} enfant${n > 1 ? "s" : ""} ${r.label}` : null; })
        .filter(Boolean).join(", ");
      return `${adults} adulte${adults > 1 ? "s" : ""}, ${children.length} enfant${children.length > 1 ? "s" : ""} (${groups})`;
    },
    ui: {
      appTitle: "Menu de la semaine",
      generateBtn: "✦ Générer avec l'IA",
      clearBtn: "Effacer",
      shoppingBtn: "🛒 Liste de courses",
      paramBtn: "👨‍👩‍👧 Paramètres",
      mealCount: (f, t) => `${f}/${t} repas`,
      weekOverview: "Vue semaine",
      mealHeader: "Repas",
      lunch: "Déjeuner", lunchShort: "Déj.",
      dinner: "Dîner",   dinnerShort: "Dîner",
      lunchHdr: "☀ Déjeuner", dinnerHdr: "🌙 Dîner",
      breakfastHdr: "🌅 P-déj",
      vegeLabel: "🌿 Végé", veganLabel: "🌱 Vegan", meatLabel: "🥩 Viande",
      undefined: "À définir", mealPlaceholder: "Nom du repas…",
      vegeStats: (vegan, vege, total) =>
        `🌱 ${vegan} vegan  ·  🌿 ${vege} végé  ·  🥩 ${total - vegan - vege} viande`,
      vikunjaTitle: "Connexion Vikunja",
      urlLabel: "URL de ton instance", urlPlaceholder: "https://vikunja.velluet.net",
      tokenLabel: "API Token", tokenPlaceholder: "Ton token Vikunja",
      connectBtn: loading => loading ? "Connexion…" : "🔗 Tester & charger les projets",
      projectLabel: "Projet / Liste Courses", projectPlaceholder: "— Choisir un projet —",
      saveBtn: "✓ Sauvegarder",
      householdTitle: "Composition du foyer",
      adultsLabel: "Adultes", childrenLabel: "Enfants",
      childLabel: i => `Enfant ${i + 1}`,
      scheduleLabel: "Planning repas",
      breakfastNote: "P-déj : inclus dans la liste de courses uniquement, pas de génération IA",
      householdTotal: (n, desc) => `${n} personne${n > 1 ? "s" : ""} au total · ${desc}`,
      noProject: "Aucun projet sélectionné dans les réglages.",
      pushing: "Envoi vers Vikunja…",
      tasksDone: (done, name) => `${done} tâches créées dans "${name}" ✓`,
      doneTitle: "Terminé !", closeBtn: "Fermer", errorTitle: "Erreur",
      sendVikunja: "📋 Envoyer dans Vikunja",
      ingredientCount: (n, c) => `${n} ingrédients · ${c} catégories`,
      shoppingTitle: "Liste de courses",
      aiError: "Erreur IA : ",
      shoppingError: "Erreur génération courses : ",
      taskCategory: (cat, emoji) => `Catégorie : ${cat} ${emoji}`,
      taskWeek: label => `Semaine courses : ${label}`,
      weekLocale: "fr-FR",
      dietTitle: "Répartition des repas",
      veganPct: "🌱 Vegan", vegePct: "🌿 Végétarien", meatPct: "🥩 Viande & poisson",
      meatAuto: "auto", dietNote: "Le reste est viande/poisson",
      vegeStatsTarget: (diet) => `Objectif : ${diet.vegan}% vegan · ${diet.vegetarian}% végé · ${diet.meat}% viande`,
      recipeBtn: "📖 Recette",
      recipeTitle: "Recette",
      ingredientsLabel: "Ingrédients",
      stepsLabel: "Préparation",
      servingsLabel: "Portions",
      prepLabel: "Préparation",
      cookLabel: "Cuisson",
      recipeLoading: "Génération de la recette…",
      recipeError: "Impossible de générer la recette.",
    },
    generateBtn: "✦ Générer avec l'IA",
    clearBtn: "Effacer",
    shoppingBtn: "🛒 Liste de courses",
    paramBtn: "👨‍👩‍👧 Paramètres",
    shoppingTitle: "Liste de courses",
    mealPromptIntro: (count, hDesc, diet) => `Planning repas pour une famille de ${count} personnes (${hDesc}) pour une semaine.\nCritères : healthy, équilibré. Répartition : ${diet.vegan}% vegan, ${diet.vegetarian}% végétarien, ${diet.meat}% viande/poisson. Adapte les plats et portions à la composition du foyer. Savoureux, accessible, varié.`,
    mealPromptSlots: "Slots",
    mealPromptInstruction: "Noms de plats complets et appétissants en français, max 5 mots. Exemples corrects : \"Poulet rôti aux herbes\", \"Curry de lentilles corail\", \"Gratin dauphinois\", \"Saumon en croûte d'herbes\". INTERDIT : combinaisons d'ingrédients avec tirets ou slashs (ex: \"Poulet-légumes\" ou \"Riz/poulet\"). Le champ \"vege\" liste les repas végétariens (sans viande/volaille/poisson, œufs/lait/fromage autorisés). Le champ \"vegan\" liste les repas 100% végétaliens (zéro produit animal). \"vegan\" doit être un sous-ensemble de \"vege\".",
    shoppingPromptIntro: (total, hDesc, mealSummary, breakfastLine) =>
      `Famille de ${total} personnes (${hDesc}). Voici les repas de la semaine :\n${mealSummary}\n\nGénère une liste de courses complète, organisée par catégorie.\nAdapte les quantités à la composition exacte du foyer.${breakfastLine}\nRéponds en français.`,
    shoppingCategories: [
      { name: "Fruits & légumes", emoji: "🥦" },
      { name: "Viandes & poissons", emoji: "🥩" },
      { name: "Produits laitiers", emoji: "🧀" },
      { name: "Épicerie sèche", emoji: "🫙" },
      { name: "Boulangerie", emoji: "🍞" },
      { name: "Surgelés", emoji: "❄️" },
      { name: "Boissons & divers", emoji: "🧴" },
    ],
    breakfastLine: (days, hDesc) => `\nPetits-déjeuners : ${days} matins prévus. Inclure les ingrédients adaptés à ${hDesc} (produits laitiers, céréales, pain, confitures, fruits, jus...).`,
    recipePrompt: (mealName, servings) => `Donne la recette détaillée pour "${mealName}" pour ${servings} personnes.\nRéponds UNIQUEMENT en JSON strict :\n{"title":"...","servings":${servings},"prepTime":"...","cookTime":"...","ingredients":[{"name":"...","qty":"..."}],"steps":["..."]}`,
  },
  en: {
    label: "EN", flag: "🇬🇧", name: "English",
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    daysShort: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    ageRanges: [
      { value: "0-3",   label: "0–3 yrs"   },
      { value: "4-10",  label: "4–10 yrs"  },
      { value: "11-17", label: "11–17 yrs" },
    ],
    householdDesc: ({ adults, children }, ageRanges) => {
      if (children.length === 0) return `${adults} adult${adults > 1 ? "s" : ""}`;
      const groups = ageRanges
        .map(r => { const n = children.filter(c => c.age === r.value).length; return n ? `${n} child${n > 1 ? "ren" : ""} ${r.label}` : null; })
        .filter(Boolean).join(", ");
      return `${adults} adult${adults > 1 ? "s" : ""}, ${children.length} child${children.length > 1 ? "ren" : ""} (${groups})`;
    },
    ui: {
      appTitle: "Weekly Menu",
      generateBtn: "✦ Generate with AI",
      clearBtn: "Clear",
      shoppingBtn: "🛒 Shopping list",
      paramBtn: "👨‍👩‍👧 Settings",
      mealCount: (f, t) => `${f}/${t} meals`,
      weekOverview: "Week overview",
      mealHeader: "Meal",
      lunch: "Lunch", lunchShort: "Lunch",
      dinner: "Dinner", dinnerShort: "Dinner",
      lunchHdr: "☀ Lunch", dinnerHdr: "🌙 Dinner",
      breakfastHdr: "🌅 Breakfast",
      vegeLabel: "🌿 Veg", veganLabel: "🌱 Vegan", meatLabel: "🥩 Meat",
      undefined: "Undefined", mealPlaceholder: "Meal name…",
      vegeStats: (vegan, vege, total) =>
        `🌱 ${vegan} vegan  ·  🌿 ${vege} veg  ·  🥩 ${total - vegan - vege} meat`,
      vikunjaTitle: "Vikunja Connection",
      urlLabel: "Your instance URL", urlPlaceholder: "https://vikunja.example.com",
      tokenLabel: "API Token", tokenPlaceholder: "Your Vikunja token",
      connectBtn: loading => loading ? "Connecting…" : "🔗 Test & load projects",
      projectLabel: "Project / Shopping list", projectPlaceholder: "— Select a project —",
      saveBtn: "✓ Save",
      householdTitle: "Household composition",
      adultsLabel: "Adults", childrenLabel: "Children",
      childLabel: i => `Child ${i + 1}`,
      scheduleLabel: "Meal schedule",
      breakfastNote: "Breakfast: included in shopping list only, not AI-generated",
      householdTotal: (n, desc) => `${n} person${n > 1 ? "s" : ""} total · ${desc}`,
      noProject: "No project selected in settings.",
      pushing: "Sending to Vikunja…",
      tasksDone: (done, name) => `${done} tasks created in "${name}" ✓`,
      doneTitle: "Done!", closeBtn: "Close", errorTitle: "Error",
      sendVikunja: "📋 Send to Vikunja",
      ingredientCount: (n, c) => `${n} ingredients · ${c} categories`,
      shoppingTitle: "Shopping list",
      aiError: "AI error: ",
      shoppingError: "Shopping list error: ",
      taskCategory: (cat, emoji) => `Category: ${cat} ${emoji}`,
      taskWeek: label => `Shopping week: ${label}`,
      weekLocale: "en-GB",
      dietTitle: "Meal breakdown",
      veganPct: "🌱 Vegan", vegePct: "🌿 Vegetarian", meatPct: "🥩 Meat & fish",
      meatAuto: "auto", dietNote: "The rest is meat/fish",
      vegeStatsTarget: (diet) => `Target: ${diet.vegan}% vegan · ${diet.vegetarian}% veg · ${diet.meat}% meat`,
      recipeBtn: "📖 Recipe",
      recipeTitle: "Recipe",
      ingredientsLabel: "Ingredients",
      stepsLabel: "Instructions",
      servingsLabel: "Servings",
      prepLabel: "Prep",
      cookLabel: "Cook",
      recipeLoading: "Generating recipe…",
      recipeError: "Could not generate recipe.",
    },
    generateBtn: "✦ Generate with AI",
    clearBtn: "Clear",
    shoppingBtn: "🛒 Shopping list",
    paramBtn: "👨‍👩‍👧 Settings",
    shoppingTitle: "Shopping list",
    mealPromptIntro: (count, hDesc, diet) => `Meal plan for a family of ${count} people (${hDesc}) for one week.\nCriteria: healthy, balanced. Diet breakdown: ${diet.vegan}% vegan, ${diet.vegetarian}% vegetarian, ${diet.meat}% meat/fish. Adapt dishes and portions to the household. Tasty, accessible, varied.`,
    mealPromptSlots: "Slots",
    mealPromptInstruction: "Complete, appetizing dish names in English, max 5 words. Correct examples: \"Herb roasted chicken\", \"Red lentil curry\", \"Baked salmon with herbs\", \"Creamy mushroom risotto\". FORBIDDEN: ingredient combinations with dashes or slashes (e.g. \"Chicken-vegetables\" or \"Rice/chicken\"). IMPORTANT: keep all JSON keys exactly as shown in the template (Lundi, Mardi, Mercredi, Jeudi, Vendredi, Samedi, Dimanche, Déjeuner, Dîner) — only translate the meal name values. The \"vege\" field lists vegetarian meals (no meat/poultry/fish, eggs/dairy allowed). The \"vegan\" field lists 100% plant-based meals (no animal products). \"vegan\" must be a subset of \"vege\".",
    shoppingPromptIntro: (total, hDesc, mealSummary, breakfastLine) =>
      `Family of ${total} people (${hDesc}). Here are the week's meals:\n${mealSummary}\n\nGenerate a complete shopping list, organized by category.\nAdjust quantities to the exact household composition.${breakfastLine}\nRespond in English.`,
    shoppingCategories: [
      { name: "Fruits & vegetables", emoji: "🥦" },
      { name: "Meat & fish", emoji: "🥩" },
      { name: "Dairy", emoji: "🧀" },
      { name: "Dry goods", emoji: "🫙" },
      { name: "Bakery", emoji: "🍞" },
      { name: "Frozen", emoji: "❄️" },
      { name: "Drinks & misc", emoji: "🧴" },
    ],
    breakfastLine: (days, hDesc) => `\nBreakfasts: ${days} mornings planned. Include ingredients suited to ${hDesc} (dairy, cereals, bread, jams, fruits, juice...).`,
    recipePrompt: (mealName, servings) => `Give the detailed recipe for "${mealName}" for ${servings} people.\nRespond ONLY with strict JSON:\n{"title":"...","servings":${servings},"prepTime":"...","cookTime":"...","ingredients":[{"name":"...","qty":"..."}],"steps":["..."]}`,
  },
  de: {
    label: "DE", flag: "🇩🇪", name: "Deutsch",
    days: ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"],
    daysShort: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
    ageRanges: [
      { value: "0-3",   label: "0–3 J."   },
      { value: "4-10",  label: "4–10 J."  },
      { value: "11-17", label: "11–17 J." },
    ],
    householdDesc: ({ adults, children }, ageRanges) => {
      if (children.length === 0) return `${adults} Erwachsene${adults === 1 ? "r" : ""}`;
      const groups = ageRanges
        .map(r => { const n = children.filter(c => c.age === r.value).length; return n ? `${n} Kind${n > 1 ? "er" : ""} ${r.label}` : null; })
        .filter(Boolean).join(", ");
      return `${adults} Erwachsene${adults === 1 ? "r" : ""}, ${children.length} Kind${children.length > 1 ? "er" : ""} (${groups})`;
    },
    ui: {
      appTitle: "Wochenmenü",
      generateBtn: "✦ Mit KI generieren",
      clearBtn: "Löschen",
      shoppingBtn: "🛒 Einkaufsliste",
      paramBtn: "👨‍👩‍👧 Einstellungen",
      mealCount: (f, t) => `${f}/${t} Mahlzeiten`,
      weekOverview: "Wochenübersicht",
      mealHeader: "Mahlzeit",
      lunch: "Mittagessen", lunchShort: "Mittag",
      dinner: "Abendessen", dinnerShort: "Abend",
      lunchHdr: "☀ Mittagessen", dinnerHdr: "🌙 Abendessen",
      breakfastHdr: "🌅 Frühstück",
      vegeLabel: "🌿 Veg", veganLabel: "🌱 Vegan", meatLabel: "🥩 Fleisch",
      undefined: "Offen", mealPlaceholder: "Mahlzeit eingeben…",
      vegeStats: (vegan, vege, total) =>
        `🌱 ${vegan} vegan  ·  🌿 ${vege} veg  ·  🥩 ${total - vegan - vege} Fleisch`,
      vikunjaTitle: "Vikunja-Verbindung",
      urlLabel: "Instanz-URL", urlPlaceholder: "https://vikunja.beispiel.de",
      tokenLabel: "API-Token", tokenPlaceholder: "Dein Vikunja-Token",
      connectBtn: loading => loading ? "Verbinden…" : "🔗 Testen & Projekte laden",
      projectLabel: "Projekt / Einkaufsliste", projectPlaceholder: "— Projekt auswählen —",
      saveBtn: "✓ Speichern",
      householdTitle: "Haushaltszusammensetzung",
      adultsLabel: "Erwachsene", childrenLabel: "Kinder",
      childLabel: i => `Kind ${i + 1}`,
      scheduleLabel: "Mahlzeitenplan",
      breakfastNote: "Frühstück: nur in der Einkaufsliste, keine KI-Generierung",
      householdTotal: (n, desc) => `${n} Person${n > 1 ? "en" : ""} gesamt · ${desc}`,
      noProject: "Kein Projekt in den Einstellungen ausgewählt.",
      pushing: "Sende an Vikunja…",
      tasksDone: (done, name) => `${done} Aufgaben in "${name}" erstellt ✓`,
      doneTitle: "Fertig!", closeBtn: "Schließen", errorTitle: "Fehler",
      sendVikunja: "📋 An Vikunja senden",
      ingredientCount: (n, c) => `${n} Zutaten · ${c} Kategorien`,
      shoppingTitle: "Einkaufsliste",
      aiError: "KI-Fehler: ",
      shoppingError: "Fehler bei der Einkaufsliste: ",
      taskCategory: (cat, emoji) => `Kategorie: ${cat} ${emoji}`,
      taskWeek: label => `Einkaufswoche: ${label}`,
      weekLocale: "de-DE",
      dietTitle: "Mahlzeitenverteilung",
      veganPct: "🌱 Vegan", vegePct: "🌿 Vegetarisch", meatPct: "🥩 Fleisch & Fisch",
      meatAuto: "auto", dietNote: "Der Rest ist Fleisch/Fisch",
      vegeStatsTarget: (diet) => `Ziel: ${diet.vegan}% vegan · ${diet.vegetarian}% veg · ${diet.meat}% Fleisch`,
      recipeBtn: "📖 Rezept",
      recipeTitle: "Rezept",
      ingredientsLabel: "Zutaten",
      stepsLabel: "Zubereitung",
      servingsLabel: "Portionen",
      prepLabel: "Vorbereitung",
      cookLabel: "Kochzeit",
      recipeLoading: "Rezept wird generiert…",
      recipeError: "Rezept konnte nicht generiert werden.",
    },
    generateBtn: "✦ Mit KI generieren",
    clearBtn: "Löschen",
    shoppingBtn: "🛒 Einkaufsliste",
    paramBtn: "👨‍👩‍👧 Einstellungen",
    shoppingTitle: "Einkaufsliste",
    mealPromptIntro: (count, hDesc, diet) => `Mahlzeitenplan für eine Familie von ${count} Personen (${hDesc}) für eine Woche.\nKriterien: gesund, ausgewogen. Verteilung: ${diet.vegan}% vegan, ${diet.vegetarian}% vegetarisch, ${diet.meat}% Fleisch/Fisch. Gerichte und Portionen an den Haushalt anpassen. Lecker, zugänglich, abwechslungsreich.`,
    mealPromptSlots: "Slots",
    mealPromptInstruction: "Vollständige, appetitliche Gerichtsnamen auf Deutsch, max. 5 Wörter. Korrekte Beispiele: \"Kräuterhuhn aus dem Ofen\", \"Rote Linsen Curry\", \"Lachs mit Kräuterkruste\", \"Cremiges Pilzrisotto\". VERBOTEN: Zutatenkombinationen mit Bindestrichen oder Schrägstrichen (z.B. \"Huhn-Gemüse\" oder \"Reis/Huhn\"). Das Feld \"vege\" listet vegetarische Mahlzeiten (kein Fleisch/Geflügel/Fisch, Eier/Milch/Käse erlaubt). Das Feld \"vegan\" listet 100% pflanzliche Mahlzeiten (keine tierischen Produkte). \"vegan\" muss eine Teilmenge von \"vege\" sein.",
    shoppingPromptIntro: (total, hDesc, mealSummary, breakfastLine) =>
      `Familie mit ${total} Personen (${hDesc}). Hier sind die Mahlzeiten der Woche:\n${mealSummary}\n\nErstelle eine vollständige Einkaufsliste, geordnet nach Kategorie.\nMengen an die genaue Haushaltszusammensetzung anpassen.${breakfastLine}\nAntworte auf Deutsch.`,
    shoppingCategories: [
      { name: "Obst & Gemüse", emoji: "🥦" },
      { name: "Fleisch & Fisch", emoji: "🥩" },
      { name: "Milchprodukte", emoji: "🧀" },
      { name: "Trockenwaren", emoji: "🫙" },
      { name: "Backwaren", emoji: "🍞" },
      { name: "Tiefkühlkost", emoji: "❄️" },
      { name: "Getränke & Sonstiges", emoji: "🧴" },
    ],
    breakfastLine: (days, hDesc) => `\nFrühstück: ${days} Morgen geplant. Passende Zutaten für ${hDesc} einschließen (Milchprodukte, Getreide, Brot, Marmeladen, Obst, Saft...).`,
    recipePrompt: (mealName, servings) => `Gib das detaillierte Rezept für "${mealName}" für ${servings} Personen.\nAntworte NUR mit striktem JSON:\n{"title":"...","servings":${servings},"prepTime":"...","cookTime":"...","ingredients":[{"name":"...","qty":"..."}],"steps":["..."]}`,
  },
};

const initMeals = () => Object.fromEntries(DAYS.map(d => [d, { Déjeuner: "", Dîner: "" }]));

const defaultSchedule = Object.fromEntries(DAYS.map(d => [d, {
  breakfast: true,
  lunch: ["Lundi", "Samedi", "Dimanche"].includes(d),
  dinner: true,
}]));
const defaultHousehold = { adults: 2, children: [{ age: "4-10" }, { age: "4-10" }], schedule: defaultSchedule };

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

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  app: {
    minHeight: "100vh",
    background: "#fafafa",
    fontFamily: "'Inter', system-ui, sans-serif",
    color: "#111",
  },
  header: {
    background: "#111111",
    padding: "16px 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  },
  logo: {
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: 20,
    fontWeight: 700,
    color: "#fff",
    margin: 0,
    letterSpacing: "-0.03em",
  },
  sub: {
    fontSize: 11,
    color: "#999",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginTop: 2,
  },
  btn: (variant = "ghost") => ({
    padding: "6px 14px",
    borderRadius: 6,
    border: variant === "primary" ? "none"
      : variant === "danger" ? "1px solid #ef4444"
      : variant === "green" ? "none"
      : "1px solid rgba(255,255,255,0.2)",
    background: variant === "primary" ? "#6366f1"
      : variant === "danger" ? "transparent"
      : variant === "green" ? "#22c55e"
      : "transparent",
    color: variant === "primary" ? "#fff"
      : variant === "danger" ? "#ef4444"
      : variant === "green" ? "#fff"
      : "rgba(255,255,255,0.85)",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 500,
    fontFamily: "inherit",
    letterSpacing: "0.02em",
    transition: "opacity 0.15s",
    whiteSpace: "nowrap",
  }),
  card: {
    background: "#fff",
    borderRadius: 8,
    border: "1px solid #e5e5e5",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  pill: (color) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "2px 8px",
    borderRadius: 99,
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    background: color === "amber" ? "#fef3c7" : "#dcfce7",
    color: color === "amber" ? "#92400e" : "#166534",
  }),
};

// ─── SETTINGS PANEL ───────────────────────────────────────────────────────────
function Settings({ config, onSave, t }) {
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
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#666", marginBottom: 6 }}>
        {label}
      </label>
      <input
        type={type}
        value={local[key] || ""}
        onChange={e => setLocal(p => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "8px 12px", borderRadius: 6,
          border: "1px solid #e5e5e5", background: "#fff",
          fontSize: 13, fontFamily: "inherit", color: "#111",
          outline: "none", boxSizing: "border-box",
        }}
      />
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700 }}>{t('vikunjaTitle')}</h3>
      {field(t('urlLabel'), "baseUrl", t('urlPlaceholder'))}
      {field(t('tokenLabel'), "token", t('tokenPlaceholder'), "password")}

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button style={S.btn("primary")} onClick={fetchProjects} disabled={loading}>
          {t('connectBtn', loading)}
        </button>
      </div>

      {err && <div style={{ padding: "10px 12px", borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontSize: 12, marginBottom: 16 }}>{err}</div>}

      {projects.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#666", marginBottom: 6 }}>
            {t('projectLabel')}
          </label>
          <select
            value={local.projectId || ""}
            onChange={e => setLocal(p => ({ ...p, projectId: e.target.value, projectName: projects.find(pr => String(pr.id) === e.target.value)?.title || "" }))}
            style={{
              width: "100%", padding: "8px 12px", borderRadius: 6,
              border: "1px solid #e5e5e5", background: "#fff",
              fontSize: 13, fontFamily: "inherit", color: "#111", outline: "none",
            }}
          >
            <option value="">{t('projectPlaceholder')}</option>
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
        {t('saveBtn')}
      </button>
    </div>
  );
}

// ─── HOUSEHOLD SETTINGS ───────────────────────────────────────────────────────
function HouseholdSettings({ household, onChange, daysShort, ageRanges, householdDesc, t, dietPrefs, onDietChange }) {
  const { adults, children } = household;

  const setAdults = n => onChange({ ...household, adults: Math.min(8, Math.max(1, n)) });
  const setChildCount = n => {
    const count = Math.min(8, Math.max(0, n));
    const next = Array.from({ length: count }, (_, i) => children[i] || { age: "4-10" });
    onChange({ ...household, children: next });
  };
  const setChildAge = (i, age) =>
    onChange({ ...household, children: children.map((c, j) => j === i ? { ...c, age } : c) });

  const schedule = household.schedule ?? defaultSchedule;
  const setScheduleField = (day, field, val) =>
    onChange({ ...household, schedule: { ...schedule, [day]: { ...schedule[day], [field]: val } } });

  const stepBtn = (disabled) => ({
    width: 32, height: 32, borderRadius: 6, border: "1px solid #e5e5e5",
    background: disabled ? "#f5f5f5" : "#fff", cursor: disabled ? "default" : "pointer",
    fontSize: 18, fontFamily: "inherit", color: disabled ? "#bbb" : "#111",
    fontWeight: 600, lineHeight: "30px", textAlign: "center", padding: 0,
  });

  const Stepper = ({ value, onDec, onInc, min, max }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <button style={stepBtn(value <= min)} onClick={onDec} disabled={value <= min}>−</button>
      <span style={{ fontSize: 22, fontWeight: 700, minWidth: 24, textAlign: "center" }}>{value}</span>
      <button style={stepBtn(value >= max)} onClick={onInc} disabled={value >= max}>+</button>
    </div>
  );

  const labelStyle = { display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#666", marginBottom: 10 };

  return (
    <div style={{ padding: 24 }}>
      <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700 }}>{t('householdTitle')}</h3>

      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>{t('adultsLabel')}</label>
        <Stepper value={adults} min={1} max={8} onDec={() => setAdults(adults - 1)} onInc={() => setAdults(adults + 1)} />
      </div>

      <div style={{ marginBottom: children.length > 0 ? 16 : 0 }}>
        <label style={labelStyle}>{t('childrenLabel')}</label>
        <Stepper value={children.length} min={0} max={8} onDec={() => setChildCount(children.length - 1)} onInc={() => setChildCount(children.length + 1)} />
      </div>

      {children.length > 0 && (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {children.map((child, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 12, color: "#666", minWidth: 68, fontWeight: 600 }}>{t('childLabel', i)}</span>
              <div style={{ display: "flex", gap: 6 }}>
                {ageRanges.map(r => (
                  <button key={r.value} onClick={() => setChildAge(i, r.value)} style={{
                    padding: "5px 10px", borderRadius: 8, cursor: "pointer",
                    fontSize: 11, fontWeight: 600, fontFamily: "inherit",
                    border: `1px solid ${child.age === r.value ? "#6366f1" : "#e5e5e5"}`,
                    background: child.age === r.value ? "#eef2ff" : "#fafafa",
                    color: child.age === r.value ? "#4338ca" : "#666",
                    transition: "all 0.15s",
                  }}>{r.label}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <label style={labelStyle}>{t('scheduleLabel')}</label>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ padding: "4px 8px 8px 0", textAlign: "left", color: "#666", fontWeight: 700, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", minWidth: 60 }}></th>
                {[t('breakfastHdr'), t('lunchHdr'), t('dinnerHdr')].map(h => (
                  <th key={h} style={{ padding: "4px 12px 8px", textAlign: "center", color: "#666", fontWeight: 700, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day, i) => (
                <tr key={day} style={{ borderTop: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "8px 8px 8px 0", fontWeight: 600, fontSize: 12, color: "#111" }}>{daysShort[i]}</td>
                  {[["breakfast", "#6366f1"], ["lunch", "#6366f1"], ["dinner", "#6366f1"]].map(([field, color]) => (
                    <td key={field} style={{ padding: "8px 12px", textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={schedule[day]?.[field] ?? false}
                        onChange={e => setScheduleField(day, field, e.target.checked)}
                        style={{ width: 16, height: 16, cursor: "pointer", accentColor: color }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ margin: "8px 0 0", fontSize: 11, color: "#999" }}>
          {t('breakfastNote')}
        </p>
      </div>

      {/* DIET BREAKDOWN */}
      <div style={{ marginTop: 24 }}>
        <label style={labelStyle}>{t('dietTitle')}</label>
        {[
          { key: "vegan",       label: t('veganPct'),  color: "#6ee7b7", auto: false },
          { key: "vegetarian",  label: t('vegePct'),   color: "#3d9970", auto: false },
          { key: "meat",        label: t('meatPct'),   color: "#e85d4a", auto: true  },
        ].map(({ key, label, color, auto }) => {
          const val = dietPrefs[key];
          const max = key === "vegan"
            ? 100 - dietPrefs.vegetarian
            : key === "vegetarian"
            ? 100 - dietPrefs.vegan
            : null;
          return (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#666", minWidth: 130 }}>{label}</span>
              {auto ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, height: 6, borderRadius: 99, background: "#f0f0f0", overflow: "hidden" }}>
                    <div style={{ width: `${val}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.2s" }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: val < 0 ? "#e85d4a" : "#111", minWidth: 38, textAlign: "right" }}>
                    {val < 0 ? "!" : `${val}%`}
                  </span>
                  <span style={{ fontSize: 10, color: "#999", fontStyle: "italic" }}>{t('meatAuto')}</span>
                </div>
              ) : (
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    type="range"
                    min={0} max={max} step={10}
                    value={val}
                    onChange={e => {
                      const v = Number(e.target.value);
                      const meat = 100 - (key === "vegan" ? v + dietPrefs.vegetarian : dietPrefs.vegan + v);
                      onDietChange({ ...dietPrefs, [key]: v, meat });
                    }}
                    style={{ flex: 1, accentColor: color }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 700, minWidth: 38, textAlign: "right" }}>{val}%</span>
                </div>
              )}
            </div>
          );
        })}
        {dietPrefs.meat < 0 && (
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#e85d4a" }}>Vegan + vegetarian &gt; 100%</p>
        )}
        <p style={{ margin: "8px 0 0", fontSize: 11, color: "#999" }}>{t('dietNote')}</p>
      </div>

      <div style={{ marginTop: 20, padding: "10px 14px", borderRadius: 8, background: "#f5f5f5", fontSize: 12, color: "#666" }}>
        {t('householdTotal', adults + children.length, householdDesc({ adults, children }, ageRanges))}
      </div>
    </div>
  );
}

// ─── MEAL CELL ────────────────────────────────────────────────────────────────
function MealCell({ value, onChange, dietType, t }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => { setDraft(value); }, [value]);

  const commit = () => { setEditing(false); onChange(draft); };

  const cellStyle = dietType === "vegan"
    ? { bg: "#ecfdf5", border: "#6ee7b7", pillColor: "vegan" }
    : dietType === "vege"
    ? { bg: "#f0fdf4", border: "#bbf7d0", pillColor: "green" }
    : { bg: "#fffbeb", border: "#fde68a", pillColor: "amber" };

  return (
    <div
      onClick={() => { setEditing(true); setDraft(value); }}
      style={{
        minHeight: 52,
        padding: "10px 12px",
        borderRadius: 8,
        background: value ? cellStyle.bg : "#fff",
        border: `1px solid ${value ? cellStyle.border : "#e5e5e5"}`,
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
            outline: "none", fontSize: 13, fontFamily: "inherit", color: "#111",
          }}
          placeholder={t('mealPlaceholder')}
        />
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: 13, color: value ? "#111" : "#bbb", fontStyle: value ? "normal" : "italic", lineHeight: 1.4 }}>
            {value || t('undefined')}
          </span>
          {value && (
            <span style={{
              ...S.pill(cellStyle.pillColor),
              background: dietType === "vegan" ? "#d1fae5" : dietType === "vege" ? "#dcfce7" : "#fef3c7",
              color: dietType === "vegan" ? "#065f46" : dietType === "vege" ? "#166534" : "#92400e",
            }}>
              {dietType === "vegan" ? t('veganLabel') : dietType === "vege" ? t('vegeLabel') : t('meatLabel')}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── RECIPE MODAL ────────────────────────────────────────────────────────────
function RecipeModal({ mealName, recipe, loading, error, onClose, t }) {
  return (
    <div className="modal-overlay" style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(6px)", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div className="modal-sheet" style={{ ...S.card, maxWidth: 580, width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #e5e5e5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: 20 }}>{t('recipeTitle')}</h2>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#666" }}>{mealName}</p>
          </div>
          <button style={{ ...S.btn(), color: "#666", border: "1px solid #e5e5e5" }} onClick={onClose}>✕</button>
        </div>
        <div style={{ overflowY: "auto", padding: 24, flex: 1 }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#999" }}>
              <div style={{ fontSize: 32, marginBottom: 12, display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</div>
              <p style={{ margin: 0, fontSize: 14 }}>{t('recipeLoading')}</p>
            </div>
          )}
          {error && <p style={{ color: "#991b1b", fontSize: 14 }}>{t('recipeError')}</p>}
          {recipe && !loading && (
            <>
              <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, background: "#f5f5f5", padding: "4px 10px", borderRadius: 99, color: "#666" }}>
                  👤 {recipe.servings} {t('servingsLabel')}
                </span>
                {recipe.prepTime && (
                  <span style={{ fontSize: 12, background: "#f5f5f5", padding: "4px 10px", borderRadius: 99, color: "#666" }}>
                    ⏱ {t('prepLabel')} : {recipe.prepTime}
                  </span>
                )}
                {recipe.cookTime && (
                  <span style={{ fontSize: 12, background: "#f5f5f5", padding: "4px 10px", borderRadius: 99, color: "#666" }}>
                    🍳 {t('cookLabel')} : {recipe.cookTime}
                  </span>
                )}
              </div>

              <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#666" }}>
                {t('ingredientsLabel')}
              </h3>
              <ul style={{ margin: "0 0 24px", padding: 0, listStyle: "none" }}>
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "7px 0", borderBottom: i < recipe.ingredients.length - 1 ? "1px solid #f0f0f0" : "none",
                  }}>
                    <span style={{ fontSize: 13, color: "#111" }}>{ing.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#999", background: "#f5f5f5", padding: "2px 8px", borderRadius: 6 }}>{ing.qty}</span>
                  </li>
                ))}
              </ul>

              <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#666" }}>
                {t('stepsLabel')}
              </h3>
              <ol style={{ margin: 0, padding: "0 0 0 20px" }}>
                {recipe.steps.map((step, i) => (
                  <li key={i} style={{ fontSize: 13, lineHeight: 1.6, color: "#111", marginBottom: 10, paddingLeft: 4 }}>
                    {step}
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PUSH MODAL ───────────────────────────────────────────────────────────────
function PushModal({ config, shoppingList, weekLabel, onClose, t }) {
  const [status, setStatus] = useState("idle");
  const [msg, setMsg] = useState("");
  const [count, setCount] = useState(0);

  const push = async () => {
    if (!config.projectId) { setMsg(t('noProject')); setStatus("error"); return; }
    setStatus("pushing"); setMsg(""); setCount(0);
    try {
      const total = shoppingList.reduce((a, c) => a + c.items.length, 0);
      let done = 0;
      for (const cat of shoppingList) {
        for (const item of cat.items) {
          await vikunjaFetch(config.baseUrl.replace(/\/$/, ""), config.token, `/projects/${config.projectId}/tasks`, "PUT", {
            title: `${item.name} — ${item.qty}`,
            description: `${t('taskCategory', cat.name, cat.emoji)}\n${t('taskWeek', weekLabel)}`,
          });
          done++;
          setCount(done);
        }
      }
      setStatus("done");
      setMsg(t('tasksDone', done, config.projectName || ""));
    } catch (e) {
      setStatus("error");
      setMsg(e.message);
    }
  };

  useEffect(() => { push(); }, []);

  const total = shoppingList.reduce((a, c) => a + c.items.length, 0);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(6px)", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{ ...S.card, maxWidth: 440, width: "100%", padding: 32, textAlign: "center" }}>
        {status === "pushing" && (
          <>
            <div style={{ fontSize: 40, marginBottom: 16, animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>{t('pushing')}</h3>
            <p style={{ color: "#666", fontSize: 14 }}>{count} / {total}</p>
            <div style={{ marginTop: 16, height: 4, background: "#e5e5e5", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${(count / total) * 100}%`, height: "100%", background: "#6366f1", transition: "width 0.3s", borderRadius: 99 }} />
            </div>
          </>
        )}
        {status === "done" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>{t('doneTitle')}</h3>
            <p style={{ color: "#666", fontSize: 14, marginBottom: 20 }}>{msg}</p>
            <button style={S.btn("primary")} onClick={onClose}>{t('closeBtn')}</button>
          </>
        )}
        {status === "error" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>{t('errorTitle')}</h3>
            <p style={{ color: "#991b1b", fontSize: 13, marginBottom: 20, wordBreak: "break-all" }}>{msg}</p>
            <button style={S.btn()} onClick={onClose}>{t('closeBtn')}</button>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── SHOPPING PREVIEW ─────────────────────────────────────────────────────────
function ShoppingPreview({ list, onPush, onClose, canPush, t }) {
  return (
    <div className="modal-overlay" style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
      backdropFilter: "blur(6px)", zIndex: 150,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div className="modal-sheet" style={{ ...S.card, maxWidth: 680, width: "100%", maxHeight: "88vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e5e5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: 22 }}>{t('shoppingTitle')}</h2>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
              {t('ingredientCount', list.reduce((a, c) => a + c.items.length, 0), list.length)}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {canPush && (
              <button style={S.btn("green")} onClick={onPush}>
                {t('sendVikunja')}
              </button>
            )}
            <button style={{ ...S.btn(), color: "#666", border: "1px solid #e5e5e5" }} onClick={onClose}>✕</button>
          </div>
        </div>
        <div style={{ overflowY: "auto", padding: 24 }}>
          <div className="shopping-grid">
            {list.map(cat => (
              <div key={cat.name} style={{ ...S.card, padding: "14px 16px" }}>
                <h4 style={{ margin: "0 0 10px", fontSize: 12, color: "#666", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {cat.emoji} {cat.name}
                </h4>
                <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                  {cat.items.map((item, i) => (
                    <li key={i} style={{
                      display: "flex", justifyContent: "space-between",
                      padding: "5px 0",
                      borderBottom: i < cat.items.length - 1 ? "1px solid #f0f0f0" : "none",
                    }}>
                      <span style={{ fontSize: 13, color: "#111" }}>{item.name}</span>
                      <span style={{ fontSize: 11, color: "#999", fontWeight: 600 }}>{item.qty}</span>
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
// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ tab, setTab, lang, setLang, onShopping, filledCount, shoppingList, onSync, onGenerate, genLoading, onClear, t }) {
  const items = [
    { id: "plan",      emoji: "🗓",  label: t('navPlan'),      action: () => setTab("plan") },
    { id: "household", emoji: "👨‍👩‍👧", label: t('navHousehold'), action: () => setTab("household") },
    { id: "shopping",  emoji: "🛒",  label: t('navShopping'),  action: onShopping, shopping: true },
    { id: "sync",      emoji: "🔗",  label: t('navSync'),      action: onSync },
    { id: "lang",      emoji: "🌍",  label: t('navLang'),      action: () => {
      const keys = Object.keys(LANGS);
      setLang(keys[(keys.indexOf(lang) + 1) % keys.length]);
    }},
    { id: "settings",  emoji: "⚙",   label: t('navSettings'), action: () => setTab("settings") },
  ];
  return (
    <nav className="sidebar">
      {items.map(item => (
        <button
          key={item.id}
          className={[
            "sidebar-item",
            tab === item.id ? "active" : "",
            item.disabled ? "disabled" : "",
            item.shopping ? "shopping" : "",
            item.shopping && filledCount === 0 ? "shopping-empty" : "",
          ].filter(Boolean).join(" ")}
          onClick={item.disabled ? undefined : item.action}
          title={item.label}
          disabled={item.disabled}
        >
          <span className="sidebar-emoji">{item.emoji}</span>
          <span className="sidebar-label">{item.label}</span>
        </button>
      ))}
      <div style={{ flex: 1 }} />
      <div className="sidebar-bottom">
        <button
          className="sidebar-generate"
          onClick={onGenerate}
          disabled={genLoading}
          title={t('generateBtn')}
        >
          <span className="sidebar-bottom-icon">
            {genLoading
              ? <span style={{ display: "inline-block", animation: "spin 0.8s linear infinite" }}>⟳</span>
              : "✦"}
          </span>
          <span className="sidebar-bottom-label">{t('generateBtn')}</span>
        </button>
        <button
          className="sidebar-clear"
          onClick={onClear}
          title={t('clearBtn')}
        >
          <span className="sidebar-bottom-icon">🗑</span>
          <span className="sidebar-bottom-label">{t('clearBtn')}</span>
        </button>
      </div>
    </nav>
  );
}

export default function App() {
  const [meals, setMeals] = useState(initMeals);
  const [vegeFlags, setVegeFlags] = useState({});
  const [config, setConfig] = useState({ baseUrl: "", token: "", projectId: "", projectName: "" });
  const [household, setHousehold] = useState(() => {
    try { return JSON.parse(localStorage.getItem("meal-planner-household")) || defaultHousehold; }
    catch { return defaultHousehold; }
  });
  const [tab, setTab] = useState("plan");
  const { lang, setLang, t } = useLang();
  const L = LANGS[lang] || LANGS.fr;
  const [dietPrefs, setDietPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("meal-planner-diet")) || { vegan: 0, vegetarian: 50, meat: 50 }; }
    catch { return { vegan: 0, vegetarian: 50, meat: 50 }; }
  });

  useEffect(() => {
    localStorage.setItem("meal-planner-household", JSON.stringify(household));
  }, [household]);
  useEffect(() => {
    localStorage.setItem("meal-planner-diet", JSON.stringify(dietPrefs));
  }, [dietPrefs]);

  const [activeDay, setActiveDay] = useState(0);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState(null);
  const [shoppingList, setShoppingList] = useState(null);
  const [showShopping, setShowShopping] = useState(false);
  const [showPush, setShowPush] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [recipeModal, setRecipeModal] = useState(null); // { mealName }
  const [recipeData, setRecipeData] = useState({ loading: false, error: false, recipe: null });

  const weekLabel = new Date().toLocaleDateString(t('weekLocale'), { day: "numeric", month: "long", year: "numeric" });

  const setMeal = (day, type, val) =>
    setMeals(p => ({ ...p, [day]: { ...p[day], [type]: val } }));

  const toggleVege = (day, type) => {
    const k = `${day}-${type}`;
    setVegeFlags(p => {
      const cur = p[k];
      const next = cur === undefined ? "vege" : cur === "vege" ? "vegan" : undefined;
      const updated = { ...p };
      if (next === undefined) delete updated[k]; else updated[k] = next;
      return updated;
    });
  };

  const hasMeal = (day, type) => {
    const s = (household.schedule ?? defaultSchedule)[day];
    if (type === "Déjeuner") return s?.lunch ?? false;
    if (type === "Dîner") return s?.dinner ?? false;
    return false;
  };

  const filledCount = DAYS.reduce((a, d) =>
    a + ["Déjeuner", "Dîner"].filter(tp => hasMeal(d, tp) && meals[d][tp]).length, 0);
  const totalSlots = DAYS.reduce((a, d) =>
    a + ["Déjeuner", "Dîner"].filter(tp => hasMeal(d, tp)).length, 0);

  // ── AI: generate meals ──
  const generateMeals = async () => {
    setGenLoading(true); setGenError(null);
    const slots = DAYS.flatMap(d =>
      ["Déjeuner", "Dîner"].filter(tp => hasMeal(d, tp)).map(tp => `${d} ${tp}`)
    );
    const hDesc = L.householdDesc(household, L.ageRanges);
    const mealsTemplate = Object.fromEntries(
      DAYS.filter(d => ["Déjeuner", "Dîner"].some(tp => hasMeal(d, tp)))
        .map(d => [d, Object.fromEntries(["Déjeuner", "Dîner"].filter(tp => hasMeal(d, tp)).map(tp => [tp, "..."]))])
    );
    const prompt = `${L.mealPromptIntro(household.adults + household.children.length, hDesc, dietPrefs)}

${L.mealPromptSlots} : ${slots.join(", ")}

Respond ONLY with strict JSON, no backticks :
${JSON.stringify({ meals: mealsTemplate, vege: slots.slice(0, 2).map(s => s.replace(" ", "-")), vegan: slots.slice(0, 1).map(s => s.replace(" ", "-")) }, null, 2)}
${L.mealPromptInstruction}`;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama3.2:3b", prompt, stream: false }),
      });
      const data = await res.json();
      const text = data.response || "";
      const parsed = extractJSON(text);
      const newMeals = initMeals();
      DAYS.forEach(d => {
        ["Déjeuner", "Dîner"].forEach(tp => {
          if (hasMeal(d, tp) && parsed.meals[d]?.[tp]) newMeals[d][tp] = parsed.meals[d][tp];
        });
      });
      setMeals(newMeals);
      const flags = {};
      const veganSet = new Set(parsed.vegan || []);
      (parsed.vege || []).forEach(k => { flags[k] = veganSet.has(k) ? "vegan" : "vege"; });
      setVegeFlags(flags);
    } catch (e) {
      setGenError(t('aiError') + e.message);
    } finally {
      setGenLoading(false);
    }
  };

  // ── AI: generate shopping list ──
  const generateShopping = async () => {
    setListLoading(true);
    const mealSummary = DAYS.map(d =>
      ["Déjeuner", "Dîner"].filter(tp => hasMeal(d, tp) && meals[d][tp])
        .map(tp => `${d} ${tp}: ${meals[d][tp]}`).join("\n")
    ).filter(Boolean).join("\n");

    const hDesc = L.householdDesc(household, L.ageRanges);
    const total = household.adults + household.children.length;
    const breakfastDays = DAYS.filter(d => (household.schedule ?? defaultSchedule)[d].breakfast).length;
    const breakfastLine = breakfastDays > 0 ? L.breakfastLine(breakfastDays, hDesc) : "";
    const categoriesTemplate = { categories: L.shoppingCategories.map(c => ({ ...c, items: [{ name: "...", qty: "..." }] })) };
    const prompt = `${L.shoppingPromptIntro(total, hDesc, mealSummary, breakfastLine)}
Respond ONLY with strict JSON, no backticks :
${JSON.stringify(categoriesTemplate, null, 2)}
Omit empty categories.`;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama3.2:3b", prompt, stream: false }),
      });
      const data = await res.json();
      const text = data.response || "";
      const parsed = extractJSON(text);
      setShoppingList(parsed.categories.filter(c => c.items?.length > 0));
      setShowShopping(true);
    } catch (e) {
      alert(t('shoppingError') + e.message);
    } finally {
      setListLoading(false);
    }
  };

  const configOk = config.baseUrl && config.token && config.projectId;

  const openRecipe = async (mealName) => {
    const servings = household.adults + household.children.length;
    setRecipeModal({ mealName });
    setRecipeData({ loading: true, error: false, recipe: null });
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama3.2:3b", prompt: L.recipePrompt(mealName, servings), stream: false }),
      });
      const data = await res.json();
      const recipe = extractJSON(data.response || "");
      setRecipeData({ loading: false, error: false, recipe });
    } catch {
      setRecipeData({ loading: false, error: true, recipe: null });
    }
  };

  // Meal type label helper
  const mealTypeLabel = (type, short = false) =>
    type === "Déjeuner"
      ? (short ? t('lunchShort') : t('lunch'))
      : (short ? t('dinnerShort') : t('dinner'));
  const mealTypeIcon = type => type === "Déjeuner" ? "☀" : "🌙";

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        button:hover { opacity: 0.85; }
        input:focus, select:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
        .sidebar {
          position: fixed; left: 0; top: 0; bottom: 0; width: 48px;
          background: #111111; display: flex; flex-direction: column;
          padding: 16px 0; z-index: 200; overflow: hidden;
          transition: width 0.2s ease;
          border-right: 1px solid rgba(99,102,241,0.1);
        }
        .sidebar:hover { width: 200px; }
        .sidebar-item {
          display: flex; align-items: center; gap: 12px;
          padding: 11px 12px; border: none; background: transparent;
          color: #888; cursor: pointer; font-family: inherit;
          font-size: 13px; font-weight: 500; white-space: nowrap;
          transition: background 0.2s, color 0.2s; width: 100%; text-align: left;
        }
        .sidebar-item:hover { background: rgba(255,255,255,0.05); color: #ccc; opacity: 1; }
        .sidebar-item.active { background: #1f1f1f; color: #fff; }
        .sidebar-item.disabled { opacity: 0.35; cursor: not-allowed; }
        .sidebar-item.shopping { color: #6366f1; }
        .sidebar-item.shopping:hover { color: #818cf8; }
        .sidebar-item.shopping-empty { opacity: 0.4; }
        .sidebar-emoji { font-size: 17px; flex-shrink: 0; width: 24px; text-align: center; }
        .sidebar-label { opacity: 0; transition: opacity 0.15s; white-space: nowrap; overflow: hidden; }
        .sidebar:hover .sidebar-label { opacity: 1; }
        .sidebar-bottom { padding: 8px 8px; border-top: 1px solid rgba(255,255,255,0.07); display: flex; flex-direction: column; gap: 6px; }
        .sidebar-generate {
          display: flex; align-items: center; gap: 12px; padding: 9px 12px; border-radius: 6px;
          border: none; background: #6366f1; color: #fff; cursor: pointer; font-family: inherit;
          font-size: 12px; font-weight: 600; white-space: nowrap; width: 100%; text-align: left;
          transition: background 0.2s; overflow: hidden;
        }
        .sidebar-generate:hover { background: #4f46e5; opacity: 1; }
        .sidebar-generate:disabled { opacity: 0.45; cursor: not-allowed; }
        .sidebar-clear {
          display: flex; align-items: center; gap: 12px; padding: 8px 12px; border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #888;
          cursor: pointer; font-family: inherit; font-size: 12px; font-weight: 500;
          white-space: nowrap; width: 100%; text-align: left; transition: background 0.2s, color 0.2s; overflow: hidden;
        }
        .sidebar-clear:hover { background: rgba(255,255,255,0.05); color: #ccc; opacity: 1; }
        .sidebar-bottom-icon { font-size: 14px; flex-shrink: 0; width: 22px; text-align: center; }
        .sidebar-bottom-label { opacity: 0; transition: opacity 0.15s; white-space: nowrap; }
        .sidebar:hover .sidebar-bottom-label { opacity: 1; }
        .main-content { margin-left: 48px; transition: margin-left 0.2s ease; }
        .sidebar:hover ~ .main-content { margin-left: 200px; }
        .page-title { padding: 24px 32px 16px; border-bottom: 1px solid #e5e5e5; background: #fff; }
        .progress-bar-wrap { background: #fff; border-bottom: 1px solid #e5e5e5; padding: 8px 32px; }
        .main-pad { max-width: 900px; margin: 0 auto; padding: 24px 24px 48px; }
        .day-grid { display: grid; gap: 16px; padding: 20px; }
        .shopping-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .mobile-generate { display: none; }
        @media (max-width: 640px) {
          .sidebar {
            position: fixed; top: auto; left: 0; right: 0; bottom: 0;
            width: 100% !important; height: 56px; flex-direction: row;
            padding: 0; border-right: none; border-top: 1px solid rgba(255,255,255,0.08);
            transition: none;
          }
          .sidebar:hover { width: 100% !important; }
          .sidebar-item {
            flex-direction: column; gap: 2px; padding: 6px 2px; flex: 1;
            justify-content: center; align-items: center; font-size: 9px;
          }
          .sidebar-label { opacity: 1; font-size: 9px; }
          .sidebar-emoji { font-size: 18px; width: auto; }
          .sidebar-bottom { display: none; }
          .main-content { margin-left: 0 !important; padding-bottom: 56px; transition: none; }
          .sidebar:hover ~ .main-content { margin-left: 0 !important; }
          .page-title { padding: 14px 16px 12px; }
          .page-title h1 { font-size: 18px !important; }
          .progress-bar-wrap { padding: 6px 16px; }
          .main-pad { padding: 12px 12px 72px; }
          .day-grid { grid-template-columns: 1fr !important; padding: 12px; gap: 12px; }
          .shopping-grid { grid-template-columns: 1fr; }
          .mobile-generate {
            display: flex; align-items: center; justify-content: center; gap: 8px;
            padding: 12px 0 4px;
          }
          .modal-overlay { align-items: flex-end !important; padding: 0 !important; }
          .modal-sheet {
            max-width: 100% !important; max-height: 92vh !important;
            border-radius: 16px 16px 0 0 !important;
            width: 100% !important;
          }
        }
      `}</style>

      <Sidebar
        tab={tab}
        setTab={setTab}
        lang={lang}
        setLang={setLang}
        onShopping={generateShopping}
        filledCount={filledCount}
        shoppingList={shoppingList}
        onSync={() => shoppingList ? setShowPush(true) : setTab("settings")}
        onGenerate={generateMeals}
        genLoading={genLoading}
        onClear={() => setMeals(initMeals())}
        t={t}
      />
      <div className="main-content">

      {/* PAGE TITLE */}
      <div className="page-title">
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#111", letterSpacing: "-0.02em" }}>
          {t('appTitle')}
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 11, color: "#999", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {L.householdDesc(household, L.ageRanges)} · {weekLabel}
        </p>
      </div>

      {genError && (
        <div style={{ background: "#fef2f2", borderBottom: "1px solid #fecaca", padding: "10px 32px", fontSize: 13, color: "#991b1b" }}>{genError}</div>
      )}

      {/* PROGRESS BAR */}
      <div className="progress-bar-wrap">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: 2, background: "#e5e5e5", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              width: `${(filledCount / totalSlots) * 100}%`, height: "100%",
              background: "#6366f1", borderRadius: 99, transition: "width 0.4s",
            }} />
          </div>
          <span style={{ fontSize: 11, color: "#999", whiteSpace: "nowrap" }}>
            {t('mealCount', filledCount, totalSlots)}
          </span>
        </div>
      </div>

      <div className="main-pad">

        {/* HOUSEHOLD SETTINGS */}
        {tab === "household" && (
          <div style={{ ...S.card, marginBottom: 24, animation: "fadeIn 0.2s ease" }}>
            <HouseholdSettings
              household={household}
              onChange={h => setHousehold(h)}
              daysShort={L.daysShort}
              ageRanges={L.ageRanges}
              householdDesc={L.householdDesc}
              t={t}
              dietPrefs={dietPrefs}
              onDietChange={setDietPrefs}
            />
          </div>
        )}

        {/* VIKUNJA SETTINGS */}
        {tab === "settings" && (
          <div style={{ ...S.card, marginBottom: 24, animation: "fadeIn 0.2s ease" }}>
            <Settings config={config} onSave={c => { setConfig(c); setTab("plan"); }} t={t} />
          </div>
        )}

        {/* MOBILE GENERATE */}
        <div className="mobile-generate">
          <button
            style={{
              flex: 1, padding: "12px", borderRadius: 8, border: "none",
              background: "#6366f1", color: "#fff", fontSize: 14, fontWeight: 600,
              fontFamily: "inherit", cursor: "pointer", opacity: genLoading ? 0.6 : 1,
            }}
            onClick={generateMeals}
            disabled={genLoading}
          >
            {genLoading
              ? <span style={{ display: "inline-block", animation: "spin 0.8s linear infinite" }}>⟳</span>
              : `✦ ${t('generateBtn')}`}
          </button>
        </div>

        {/* DAY TABS */}
        <div style={{ display: "flex", gap: 4, marginBottom: 16, overflowX: "auto", paddingBottom: 2 }}>
          {DAYS.map((day, i) => {
            const filled = ["Déjeuner", "Dîner"].some(tp => hasMeal(day, tp) && meals[day][tp]);
            return (
              <button key={day} onClick={() => setActiveDay(i)} style={{
                padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                background: activeDay === i ? "#6366f1" : "transparent",
                color: activeDay === i ? "#fff" : "#666",
                fontSize: 12, fontWeight: activeDay === i ? 600 : 400,
                fontFamily: "inherit", whiteSpace: "nowrap",
                transition: "all 0.15s", position: "relative",
              }}>
                {L.daysShort[i]}
                {filled && <span style={{
                  display: "inline-block", width: 5, height: 5, borderRadius: "50%",
                  background: activeDay === i ? "#fff" : "#6366f1", marginLeft: 5, verticalAlign: "middle",
                }} />}
              </button>
            );
          })}
        </div>

        {/* DAY CARD */}
        {DAYS.map((day, i) => {
          if (i !== activeDay) return null;
          const slots = ["Déjeuner", "Dîner"].filter(tp => hasMeal(day, tp));
          return (
            <div key={day} style={{ ...S.card, animation: "fadeIn 0.15s ease" }}>
              <div style={{
                padding: "14px 20px", borderBottom: "1px solid #f0f0f0",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 20, fontWeight: 600 }}>{L.days[i]}</span>
                <span style={{ fontSize: 11, color: "#999" }}>
                  {t('mealCount', slots.filter(tp => meals[day][tp]).length, slots.length)}
                </span>
              </div>
              <div className="day-grid" style={{ gridTemplateColumns: slots.length === 1 ? "1fr" : "1fr 1fr" }}>
                {slots.map(type => {
                  const k = `${day}-${type}`;
                  const dietType = vegeFlags[k]; // "vege" | "vegan" | undefined(=meat)
                  const dietStyle = dietType === "vegan"
                    ? { border: "1px solid #6ee7b7", bg: "#ecfdf5", color: "#065f46", label: t('veganLabel') }
                    : dietType === "vege"
                    ? { border: "1px solid #bbf7d0", bg: "#f0fdf4", color: "#166534", label: t('vegeLabel') }
                    : { border: "1px solid #fde68a", bg: "#fffbeb", color: "#92400e", label: t('meatLabel') };
                  return (
                    <div key={type}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#666" }}>
                          {mealTypeIcon(type)} {mealTypeLabel(type)}
                        </span>
                        {meals[day][type] && (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              onClick={() => toggleVege(day, type)}
                              title="meat → veg → vegan → meat"
                              style={{
                                fontSize: 10, padding: "2px 8px", borderRadius: 99,
                                border: dietStyle.border, background: dietStyle.bg,
                                color: dietStyle.color,
                                cursor: "pointer", fontFamily: "inherit", fontWeight: 700,
                              }}
                            >
                              {dietStyle.label}
                            </button>
                            <button
                              onClick={() => openRecipe(meals[day][type])}
                              style={{
                                fontSize: 10, padding: "2px 8px", borderRadius: 99,
                                border: "1px solid #e5e5e5", background: "#f5f5f5",
                                color: "#666", cursor: "pointer", fontFamily: "inherit", fontWeight: 700,
                              }}
                            >
                              {t('recipeBtn')}
                            </button>
                          </div>
                        )}
                      </div>
                      <MealCell
                        value={meals[day][type]}
                        onChange={v => setMeal(day, type, v)}
                        dietType={dietType}
                        t={t}
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
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0" }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#666" }}>{t('weekOverview')}</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#fafafa" }}>
                  <th style={{ padding: "8px 14px", textAlign: "left", color: "#999", fontWeight: 700, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", width: 80 }}>{t('mealHeader')}</th>
                  {DAYS.map((d, i) => (
                    <th key={d} style={{
                      padding: "8px 8px", textAlign: "center", color: activeDay === i ? "#111" : "#999",
                      fontWeight: activeDay === i ? 700 : 400, fontSize: 11, cursor: "pointer",
                      borderBottom: activeDay === i ? "2px solid #6366f1" : "2px solid transparent",
                    }} onClick={() => setActiveDay(i)}>{L.daysShort[i]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {["Déjeuner", "Dîner"].map(type => (
                  <tr key={type} style={{ borderTop: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "10px 14px", color: "#666", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {mealTypeIcon(type)} {mealTypeLabel(type, true)}
                    </td>
                    {DAYS.map(day => {
                      const active = hasMeal(day, type);
                      const val = meals[day][type];
                      const k = `${day}-${type}`;
                      const dt = vegeFlags[k];
                      const cellBg = dt === "vegan" ? "#ecfdf5" : dt === "vege" ? "#f0fdf4" : "#fffbeb";
                      return (
                        <td key={day} style={{
                          padding: "8px 4px", textAlign: "center",
                          background: !active ? "#fafafa" : undefined,
                        }}>
                          {!active ? (
                            <span style={{ color: "#e5e5e5", fontSize: 16 }}>·</span>
                          ) : (
                            <div style={{
                              fontSize: 11, lineHeight: 1.3, color: val ? "#111" : "#bbb",
                              padding: "3px 4px", borderRadius: 6,
                              background: val ? cellBg : "transparent",
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
          const vals = Object.values(vegeFlags);
          const veganCount = vals.filter(v => v === "vegan").length;
          const vegeCount = vals.filter(v => v === "vege").length;
          const nonMeatPct = Math.round(((veganCount + vegeCount) / filledCount) * 100);
          const targetVegePct = dietPrefs.vegan + dietPrefs.vegetarian;
          const onTarget = Math.abs(nonMeatPct - targetVegePct) <= 10;
          return (
            <div style={{ marginTop: 12, fontSize: 12, color: "#999", display: "flex", flexDirection: "column", gap: 4 }}>
              <span>{t('vegeStats', veganCount, vegeCount, filledCount)}</span>
              <span style={{ color: onTarget ? "#166534" : "#92400e" }}>
                {t('vegeStatsTarget', dietPrefs)} {onTarget ? "✓" : ""}
              </span>
            </div>
          );
        })()}

        {/* SHOPPING BUTTON */}
        <div style={{ marginTop: 24, display: "flex", justifyContent: "center" }}>
          <button
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 24px", borderRadius: 8, border: "none",
              background: filledCount === 0 ? "#e5e5e5" : "#22c55e",
              color: filledCount === 0 ? "#999" : "#fff",
              fontSize: 13, fontWeight: 600, fontFamily: "inherit",
              cursor: filledCount === 0 ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}
            onClick={generateShopping}
            disabled={filledCount === 0 || listLoading}
          >
            {listLoading
              ? <span style={{ display: "inline-block", animation: "spin 0.8s linear infinite" }}>⟳</span>
              : "🛒"}
            {listLoading ? ` ${t('generating')}` : ` ${t('shoppingBtn')}`}
          </button>
        </div>
      </div>

      {/* MODALS */}
      {showShopping && shoppingList && (
        <ShoppingPreview
          list={shoppingList}
          canPush={configOk}
          weekLabel={weekLabel}
          onPush={() => { setShowShopping(false); setShowPush(true); }}
          onClose={() => setShowShopping(false)}
          t={t}
        />
      )}
      {showPush && shoppingList && (
        <PushModal
          config={config}
          shoppingList={shoppingList}
          weekLabel={weekLabel}
          onClose={() => setShowPush(false)}
          t={t}
        />
      )}
      {recipeModal && (
        <RecipeModal
          mealName={recipeModal.mealName}
          recipe={recipeData.recipe}
          loading={recipeData.loading}
          error={recipeData.error}
          onClose={() => setRecipeModal(null)}
          t={t}
        />
      )}
      </div>{/* main-content */}
    </div>
  );
}
