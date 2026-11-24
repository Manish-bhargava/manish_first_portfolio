// Shared per-visitor rate limiter. Uses Upstash Redis when configured (durable),
// otherwise falls back to per-instance memory (best effort; resets on restart).
import crypto from "node:crypto";

const memory = new Map();

export function clientIp(req) {
  const fwd = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return fwd || req.headers["x-real-ip"] || req.socket?.remoteAddress || "unknown";
}

// Returns how many times this visitor has used `bucket` in the current window (including this call).
export async function consume(ip, bucket, windowSeconds) {
  const key = bucket + ":" + crypto.createHash("sha256").update(ip).digest("hex").slice(0, 32);
  const url = process.env.UPSTASH_REDIS_REST_URL, token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    try {
      const r = await fetch(url.replace(/\/$/, "") + "/pipeline", {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify([["INCR", key], ["EXPIRE", key, windowSeconds, "NX"]]),
      });
      if (r.ok) {
        const [incr] = await r.json();
        return Number(incr.result);
      }
    } catch (e) {
      console.error("rate limit store unavailable, using memory:", e.message);
    }
  }
  const now = Date.now(), entry = memory.get(key);
  if (!entry || entry.reset < now) { memory.set(key, { n: 1, reset: now + windowSeconds * 1000 }); return 1; }
  entry.n += 1;
  return entry.n;
}
