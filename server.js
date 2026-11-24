// Local dev server: serves the site and the /api/chat function, reading keys from .env.
// Run: npm run dev   then open http://localhost:3000
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import chat from "./api/chat.js";
import contact from "./api/contact.js";
const ROUTES = { "/api/chat": chat, "/api/contact": contact };

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml",
  ".pdf": "application/pdf", ".ico": "image/x-icon", ".ttf": "font/ttf", ".otf": "font/otf" };
const BLOCKED = /(^|\/)(\.env|\.git|node_modules|api|scripts|server\.js|package(-lock)?\.json|vercel\.json|\.vercelignore|[^/]*\.md)(\/|$)/;

http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  const handler = ROUTES[url.pathname];
  if (handler) {
    let raw = "";
    req.on("data", (c) => { raw += c; if (raw.length > 20000) req.destroy(); });
    req.on("end", () => {
      try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }
      res.status = (code) => { res.statusCode = code; return res; };
      res.json = (obj) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(obj)); };
      handler(req, res);
    });
    return;
  }
  const rel = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname).replace(/^\/+/, "");
  const file = path.resolve(ROOT, rel);
  if (!file.startsWith(ROOT + path.sep) || BLOCKED.test(rel)) { res.statusCode = 404; return res.end("Not found"); }
  fs.readFile(file, (err, data) => {
    if (err) { res.statusCode = 404; return res.end("Not found"); }
    res.setHeader("Content-Type", TYPES[path.extname(file).toLowerCase()] || "application/octet-stream");
    res.end(data);
  });
}).listen(PORT, () => {
  const provider = process.env.LLM_PROVIDER || (process.env.OPENAI_API_KEY ? "openai" : process.env.ANTHROPIC_API_KEY ? "anthropic" : "none (offline mode)");
  console.log(`Portfolio running at http://localhost:${PORT}  ·  Rixie provider: ${provider}`);
});
