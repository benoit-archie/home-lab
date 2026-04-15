# 🥗 Meal Planner · velluet.net

Planning repas hebdomadaire avec génération IA et intégration Vikunja.

## Stack
- React 18 + Vite
- Claude API (claude-sonnet) pour la génération des repas et liste de courses
- Vikunja REST API pour l'export des tâches

---

## Déploiement sur le homelab Debian

### 1. Cloner / copier le projet
```bash
# Sur ton serveur Debian
mkdir -p ~/docker/meal-planner
cd ~/docker/meal-planner
# Copie tous les fichiers ici
```

### 2. Variables d'environnement
```bash
cp .env.example .env
nano .env
# → Remplis ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Réseau Docker (si pas déjà créé)
```bash
docker network create proxy
```

### 4. Build & lancement
```bash
docker compose up -d --build
```

L'app tourne sur le port **5174** en interne.

---

## Config Caddy (caddy.velluet.net ou Caddyfile)

```caddyfile
meals.velluet.net {
    reverse_proxy meal-planner:80
}
```

Accessible ensuite via WireGuard sur `https://meals.velluet.net`.

---

## Développement local (Arch Linux)

```bash
npm install
cp .env.example .env.local
# → Remplis VITE_ANTHROPIC_API_KEY dans .env.local
npm run dev
# → http://localhost:5173
```

> ⚠️ La clé API est exposée côté client (Vite VITE_*). C'est acceptable
> pour un usage privé sur réseau local/WireGuard. Ne jamais exposer publiquement.

---

## Utilisation

1. **⚙ Vikunja** → Saisis l'URL de ton instance + API token → Teste → Choisis la liste "Courses"
2. **✦ Générer avec l'IA** → Planning healthy 50% végé généré automatiquement
3. Ajuste les repas manuellement si besoin, toggle 🌿/🥩
4. **🛒 Liste de courses** → Générée par l'IA depuis les repas
5. **Envoyer dans Vikunja** → Une tâche par ingrédient dans ta liste Courses
