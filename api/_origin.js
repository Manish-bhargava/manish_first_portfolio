// Only let pages from this same site (or origins listed in ALLOWED_ORIGINS) call the API.
// Same-site is detected from the request's own host, so it works on localhost, *.vercel.app and custom domains.
export function originAllowed(req) {
  const origin = req.headers.origin;
  const list = (process.env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim().replace(/\/$/, "")).filter(Boolean);
  if (!origin) return list.length === 0; // non-browser callers only when no allowlist is set
  let host;
  try { host = new URL(origin).host; } catch { return false; }
  const selfHost = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  if (selfHost && host === selfHost) return true;
  return list.length === 0 || list.includes(origin.replace(/\/$/, ""));
}
