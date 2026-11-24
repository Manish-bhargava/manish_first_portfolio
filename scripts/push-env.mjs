// Copies the settings from .env into your Vercel project (production + preview), without printing values.
// Run once after `npx vercel@latest link`:   npm run env:push
import { spawnSync } from "node:child_process";

const KEYS = ["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "LLM_PROVIDER", "OPENAI_MODEL", "RIXIE_SECRET",
  "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "GMAIL_USER", "GMAIL_APP_PASSWORD", "CONTACT_TO"];
// ALLOWED_ORIGINS is skipped on purpose: the API already allows its own site on any domain.

const vercel = (args, input) => spawnSync("npx", ["--yes", "vercel@latest", ...args], { input, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
let ok = 0, skipped = 0, failed = 0;
for (const key of KEYS) {
  const value = (process.env[key] || "").trim();
  if (!value) { console.log(`- ${key}: empty in .env, skipped`); skipped++; continue; }
  for (const env of ["production", "preview"]) {
    vercel(["env", "rm", key, env, "--yes"]);            // ignore "not found"
    const r = vercel(["env", "add", key, env], value);
    if (r.status === 0) ok++;
    else { failed++; console.log(`✗ ${key} (${env}): ${(r.stderr || r.stdout).split("\n").filter(Boolean).pop()}`); }
  }
  console.log(`✓ ${key}`);
}
console.log(`\nDone: ${ok} set, ${skipped} skipped, ${failed} failed.` + (failed ? "  (Run `npx vercel@latest link` first if the project isn't linked.)" : ""));
