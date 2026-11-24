// Clears Rixie + contact-form rate-limit counters in Upstash Redis (for testing).
// Usage: npm run reset-limits            -> clears rixie + contact counters
//        npm run reset-limits -- rixie   -> clears only one bucket prefix
const url = process.env.UPSTASH_REDIS_REST_URL, token = process.env.UPSTASH_REDIS_REST_TOKEN;
if (!url || !token) {
  console.log("Upstash isn't configured — limits live in server memory, so just restart the server (npm run dev).");
  process.exit(0);
}
const call = async (cmd) => {
  const r = await fetch(url.replace(/\/$/, ""), { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify(cmd) });
  if (!r.ok) throw new Error("Upstash " + r.status + " " + (await r.text()).slice(0, 200));
  return (await r.json()).result;
};
const prefixes = process.argv.slice(2).length ? process.argv.slice(2) : ["rixie", "contact"];
let total = 0;
for (const prefix of prefixes) {
  let cursor = "0", keys = [];
  do {
    const [next, batch] = await call(["SCAN", cursor, "MATCH", prefix + "*", "COUNT", "500"]);
    cursor = String(next); keys.push(...batch);
  } while (cursor !== "0");
  if (keys.length) await call(["DEL", ...keys]);
  console.log(`${prefix}: cleared ${keys.length} counter(s)`);
  total += keys.length;
}
console.log(`Done — ${total} counter(s) reset.`);
