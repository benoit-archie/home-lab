import express from "express";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const OLLAMA_URL = process.env.OLLAMA_URL || "http://ollama:11434";
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ── Proxy /api/generate ──────────────────────────────────────────────────────
app.post("/api/generate", async (req, res) => {
  try {
    const upstream = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const data = await upstream.json();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: "Ollama unreachable", detail: err.message });
  }
});

// ── Proxy /api/chat ──────────────────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  try {
    const upstream = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const data = await upstream.json();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: "Ollama unreachable", detail: err.message });
  }
});

// ── Serve Vite build (SPA fallback) ──────────────────────────────────────────
const DIST = join(__dirname, "dist");
app.use(express.static(DIST));
app.get("*", (_req, res) => res.sendFile(join(DIST, "index.html")));

createServer(app).listen(PORT, () => {
  console.log(`meal-planner listening on :${PORT} — Ollama: ${OLLAMA_URL}`);
});
