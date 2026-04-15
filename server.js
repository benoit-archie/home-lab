import express from "express";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ── Proxy /api/generate (Ollama compat → Groq) ───────────────────────────────
app.post("/api/generate", async (req, res) => {
  try {
    const upstream = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: req.body.prompt }],
        response_format: { type: "json_object" },
      }),
    });
    const data = await upstream.json();
    if (data.error) console.error("Groq error:", JSON.stringify(data.error));
    const text = data.choices?.[0]?.message?.content ?? "";
    console.log("Groq response length:", text.length, "| first 100:", text.slice(0, 100));
    res.json({ response: text });
  } catch (err) {
    res.status(502).json({ error: "Groq unreachable", detail: err.message });
  }
});

// ── Proxy /api/chat ──────────────────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  try {
    const upstream = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: req.body.messages,
      }),
    });
    const data = await upstream.json();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: "Groq unreachable", detail: err.message });
  }
});

// ── Serve Vite build (SPA fallback) ──────────────────────────────────────────
const DIST = join(__dirname, "dist");
app.use(express.static(DIST));
app.get("*", (_req, res) => res.sendFile(join(DIST, "index.html")));

createServer(app).listen(PORT, () => {
  console.log(`meal-planner listening on :${PORT} — Groq: ${GROQ_MODEL}`);
});
