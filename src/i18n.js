import { useState } from "react";

// ─── TRANSLATIONS ─────────────────────────────────────────────────────────────
// Clés identiques à LANGS[lang].ui dans App.jsx.
// Nouvelles clés : navPlan, navHousehold, navShopping, navSync, navLang,
//                  navSettings, generating, successTitle.
// Les valeurs peuvent être des strings ou des fonctions (même signature que ui).

export const TRANSLATIONS = {
  fr: {
    // ── App / header ──
    appTitle:       "Menu de la semaine",
    weekLocale:     "fr-FR",

    // ── Sidebar nav ──
    navPlan:        "Planning",
    navHousehold:   "Famille",
    navShopping:    "Courses",
    navSync:        "Sync",
    navLang:        "Langue",
    navSettings:    "Paramètres",

    // ── Boutons principaux ──
    generateBtn:    "✦ Générer avec l'IA",
    generating:     "Génération…",
    clearBtn:       "Effacer",
    shoppingBtn:    "🛒 Liste de courses",
    paramBtn:       "👨‍👩‍👧 Paramètres",
    saveBtn:        "✓ Sauvegarder",
    closeBtn:       "Fermer",
    sendVikunja:    "📋 Envoyer dans Vikunja",
    recipeBtn:      "📖 Recette",

    // ── Compteurs / états ──
    mealCount:      (f, t) => `${f}/${t} repas`,
    ingredientCount:(n, c) => `${n} ingrédients · ${c} catégories`,
    tasksDone:      (done, name) => `${done} tâches créées dans "${name}" ✓`,
    householdTotal: (n, desc) => `${n} personne${n > 1 ? "s" : ""} au total · ${desc}`,
    childLabel:     i => `Enfant ${i + 1}`,
    vegeStats:      (vegan, vege, total) =>
                      `🌱 ${vegan} vegan  ·  🌿 ${vege} végé  ·  🥩 ${total - vegan - vege} viande`,
    vegeStatsTarget:(diet) =>
                      `Objectif : ${diet.vegan}% vegan · ${diet.vegetarian}% végé · ${diet.meat}% viande`,
    taskCategory:   (cat, emoji) => `Catégorie : ${cat} ${emoji}`,
    taskWeek:       label => `Semaine courses : ${label}`,
    connectBtn:     loading => loading ? "Connexion…" : "🔗 Tester & charger les projets",

    // ── Vue semaine / planning ──
    weekOverview:   "Vue semaine",
    mealHeader:     "Repas",
    lunch:          "Déjeuner",
    lunchShort:     "Déj.",
    dinner:         "Dîner",
    dinnerShort:    "Dîner",
    lunchHdr:       "☀ Déjeuner",
    dinnerHdr:      "🌙 Dîner",
    breakfastHdr:   "🌅 P-déj",
    undefined:      "À définir",
    mealPlaceholder:"Nom du repas…",

    // ── Diet pills ──
    vegeLabel:      "🌿 Végé",
    veganLabel:     "🌱 Vegan",
    meatLabel:      "🥩 Viande",

    // ── Foyer ──
    householdTitle: "Composition du foyer",
    adultsLabel:    "Adultes",
    childrenLabel:  "Enfants",
    scheduleLabel:  "Planning repas",
    breakfastNote:  "P-déj : inclus dans la liste de courses uniquement, pas de génération IA",

    // ── Répartition repas ──
    dietTitle:      "Répartition des repas",
    veganPct:       "🌱 Vegan",
    vegePct:        "🌿 Végétarien",
    meatPct:        "🥩 Viande & poisson",
    meatAuto:       "auto",
    dietNote:       "Le reste est viande/poisson",

    // ── Courses / shopping ──
    shoppingTitle:  "Liste de courses",
    shoppingError:  "Erreur génération courses : ",

    // ── Vikunja / connexion ──
    vikunjaTitle:   "Connexion Vikunja",
    urlLabel:       "URL de ton instance",
    urlPlaceholder: "https://vikunja.velluet.net",
    tokenLabel:     "API Token",
    tokenPlaceholder:"Ton token Vikunja",
    projectLabel:   "Projet / Liste Courses",
    projectPlaceholder:"— Choisir un projet —",
    noProject:      "Aucun projet sélectionné dans les réglages.",
    pushing:        "Envoi vers Vikunja…",

    // ── Modals ──
    doneTitle:      "Terminé !",
    successTitle:   "Succès",
    errorTitle:     "Erreur",
    aiError:        "Erreur IA : ",

    // ── Recette ──
    recipeTitle:    "Recette",
    ingredientsLabel:"Ingrédients",
    stepsLabel:     "Préparation",
    servingsLabel:  "Portions",
    prepLabel:      "Préparation",
    cookLabel:      "Cuisson",
    recipeLoading:  "Génération de la recette…",
    recipeError:    "Impossible de générer la recette.",
  },

  en: {
    // ── App / header ──
    appTitle:       "Weekly Menu",
    weekLocale:     "en-GB",

    // ── Sidebar nav ──
    navPlan:        "Planning",
    navHousehold:   "Household",
    navShopping:    "Shopping",
    navSync:        "Sync",
    navLang:        "Language",
    navSettings:    "Settings",

    // ── Boutons principaux ──
    generateBtn:    "✦ Generate with AI",
    generating:     "Generating…",
    clearBtn:       "Clear",
    shoppingBtn:    "🛒 Shopping list",
    paramBtn:       "👨‍👩‍👧 Settings",
    saveBtn:        "✓ Save",
    closeBtn:       "Close",
    sendVikunja:    "📋 Send to Vikunja",
    recipeBtn:      "📖 Recipe",

    // ── Compteurs / états ──
    mealCount:      (f, t) => `${f}/${t} meals`,
    ingredientCount:(n, c) => `${n} ingredients · ${c} categories`,
    tasksDone:      (done, name) => `${done} tasks created in "${name}" ✓`,
    householdTotal: (n, desc) => `${n} person${n > 1 ? "s" : ""} total · ${desc}`,
    childLabel:     i => `Child ${i + 1}`,
    vegeStats:      (vegan, vege, total) =>
                      `🌱 ${vegan} vegan  ·  🌿 ${vege} veg  ·  🥩 ${total - vegan - vege} meat`,
    vegeStatsTarget:(diet) =>
                      `Target: ${diet.vegan}% vegan · ${diet.vegetarian}% veg · ${diet.meat}% meat`,
    taskCategory:   (cat, emoji) => `Category: ${cat} ${emoji}`,
    taskWeek:       label => `Shopping week: ${label}`,
    connectBtn:     loading => loading ? "Connecting…" : "🔗 Test & load projects",

    // ── Vue semaine / planning ──
    weekOverview:   "Week overview",
    mealHeader:     "Meal",
    lunch:          "Lunch",
    lunchShort:     "Lunch",
    dinner:         "Dinner",
    dinnerShort:    "Dinner",
    lunchHdr:       "☀ Lunch",
    dinnerHdr:      "🌙 Dinner",
    breakfastHdr:   "🌅 Breakfast",
    undefined:      "Undefined",
    mealPlaceholder:"Meal name…",

    // ── Diet pills ──
    vegeLabel:      "🌿 Veg",
    veganLabel:     "🌱 Vegan",
    meatLabel:      "🥩 Meat",

    // ── Foyer ──
    householdTitle: "Household composition",
    adultsLabel:    "Adults",
    childrenLabel:  "Children",
    scheduleLabel:  "Meal schedule",
    breakfastNote:  "Breakfast: included in shopping list only, not AI-generated",

    // ── Répartition repas ──
    dietTitle:      "Meal breakdown",
    veganPct:       "🌱 Vegan",
    vegePct:        "🌿 Vegetarian",
    meatPct:        "🥩 Meat & fish",
    meatAuto:       "auto",
    dietNote:       "The rest is meat/fish",

    // ── Courses / shopping ──
    shoppingTitle:  "Shopping list",
    shoppingError:  "Shopping list error: ",

    // ── Vikunja / connexion ──
    vikunjaTitle:   "Vikunja Connection",
    urlLabel:       "Your instance URL",
    urlPlaceholder: "https://vikunja.example.com",
    tokenLabel:     "API Token",
    tokenPlaceholder:"Your Vikunja token",
    projectLabel:   "Project / Shopping list",
    projectPlaceholder:"— Select a project —",
    noProject:      "No project selected in settings.",
    pushing:        "Sending to Vikunja…",

    // ── Modals ──
    doneTitle:      "Done!",
    successTitle:   "Success",
    errorTitle:     "Error",
    aiError:        "AI error: ",

    // ── Recette ──
    recipeTitle:    "Recipe",
    ingredientsLabel:"Ingredients",
    stepsLabel:     "Instructions",
    servingsLabel:  "Servings",
    prepLabel:      "Prep",
    cookLabel:      "Cook",
    recipeLoading:  "Generating recipe…",
    recipeError:    "Could not generate recipe.",
  },
};

// Ordre d'affichage dans le sélecteur de langue
export const LANG_ORDER = Object.keys(TRANSLATIONS);

// ─── HOOK ─────────────────────────────────────────────────────────────────────
// Retourne { lang, setLang, t }
//   t('clé')            → string
//   t('clé', arg1, …)   → appelle la fonction associée à la clé
//
// Note : le hook gère lui-même la persistance localStorage.
// Ne pas avoir d'useEffect séparé dans App pour la langue.

export function useLang() {
  const [lang, setLangState] = useState(
    () => {
      const saved = localStorage.getItem("meal-planner-lang");
      return saved && TRANSLATIONS[saved] ? saved : "fr";
    }
  );

  const setLang = (l) => {
    if (!TRANSLATIONS[l]) return;
    setLangState(l);
    localStorage.setItem("meal-planner-lang", l);
  };

  const dict = TRANSLATIONS[lang] || TRANSLATIONS.fr;

  const t = (key, ...args) => {
    const val = dict[key];
    if (val === undefined) return key; // clé manquante → renvoie la clé brute
    return typeof val === "function" ? val(...args) : val;
  };

  return { lang, setLang, t };
}
