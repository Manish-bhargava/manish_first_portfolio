// Rixie — Manish's AI assistant. Vercel serverless function: POST /api/chat
// Env vars: OPENAI_API_KEY and/or ANTHROPIC_API_KEY (one is required),
//           LLM_PROVIDER ("openai" | "anthropic", optional — defaults to openai when OPENAI_API_KEY is set),
//           OPENAI_MODEL (optional, default gpt-5.4-mini), RIXIE_SECRET (recommended),
//           UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (recommended, durable rate limit),
//           ALLOWED_ORIGINS (optional, comma-separated, e.g. https://manish.dev)
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import crypto from "node:crypto";
import { SYSTEM_PROMPT } from "./_knowledge.js";
import { consume, clientIp } from "./_ratelimit.js";
import { originAllowed } from "./_origin.js";

const ANTHROPIC_MODEL = "claude-opus-5-5";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";
const PROVIDER = (process.env.LLM_PROVIDER || (process.env.OPENAI_API_KEY ? "openai" : "anthropic")).toLowerCase();
const LIMIT = 5;                       // questions per visitor
const WINDOW_SECONDS = 24 * 60 * 60;   // per 24 hours
const MAX_QUESTION_CHARS = 500;
const MAX_REPLY_CHARS = 2500;

let anthropic, openai; // created lazily so a missing key only fails the provider in use
const SECRET = process.env.RIXIE_SECRET || crypto.createHash("sha256")
  .update("rixie:" + (process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || "dev")).digest("hex");
const REFUSED = "I can't help with that one. I'm here to talk about Manish — ask me about his experience, products or why he'd be a great hire.";

async function askClaude(messages) {
  anthropic ||= new Anthropic();
  const response = await anthropic.beta.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 1500,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low" },
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages,
  });
  if (response.stop_reason === "refusal") return REFUSED;
  let text = "";
  for (const block of response.content) if (block.type === "text") text += block.text;
  return text;
}

async function askOpenAI(messages) {
  openai ||= new OpenAI();
  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    max_completion_tokens: 1500,
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
  });
  const msg = completion.choices[0]?.message;
  if (!msg) return "";
  if (msg.refusal) return REFUSED;
  return msg.content || "";
}

// ---------- integrity: only replies Rixie actually produced are accepted back as history ----------
const sign = (text) => crypto.createHmac("sha256", SECRET).update(text).digest("hex");
const verified = (text, sig) => typeof sig === "string" && sig.length === 64 &&
  crypto.timingSafeEqual(Buffer.from(sign(text)), Buffer.from(sig));

// ---------- cheap pre-filter for obvious jailbreak attempts (no model call needed) ----------
const JAILBREAK = /(ignore|disregard|forget|override)\s+(all\s+|any\s+|the\s+|your\s+|previous\s+|prior\s+|above\s+)*(instructions|rules|prompt|guidelines)|system\s*prompt|developer\s*mode|\bDAN\b|jail\s*break|pretend\s+(to\s+be|you\s+are)|act\s+as\s+(an?\s+)?(?!recruiter)|you\s+are\s+now\s+|reveal\s+(your|the)\s+(prompt|instructions|rules)|<\/?(system|knowledge)>/i;
const GUARD_REPLY = "Nice try 😄 I'm Rixie, and my rules don't change. I only talk about Manish — his experience, products and skills. Want to know **why you should hire him**?";


export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!originAllowed(req)) return res.status(403).json({ error: "Forbidden" });

  // ---- validate input ----
  const body = typeof req.body === "string" ? safeJson(req.body) : req.body || {};
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) return res.status(400).json({ error: "Ask a question." });
  if (question.length > MAX_QUESTION_CHARS) return res.status(400).json({ error: `Keep it under ${MAX_QUESTION_CHARS} characters.` });

  const history = [];
  for (const turn of Array.isArray(body.history) ? body.history.slice(-8) : []) {
    if (!turn || typeof turn.q !== "string" || typeof turn.a !== "string") continue;
    if (turn.q.length > MAX_QUESTION_CHARS || turn.a.length > MAX_REPLY_CHARS) continue;
    if (!verified(turn.a, turn.sig)) continue; // drop forged assistant turns
    history.push({ role: "user", content: turn.q }, { role: "assistant", content: turn.a });
  }
  if (history.length / 2 >= LIMIT) return res.status(429).json({ error: "limit", remaining: 0 });

  // ---- rate limit (counts every accepted question, including blocked ones) ----
  const used = await consume(clientIp(req), "rixie", WINDOW_SECONDS);
  if (used > LIMIT) return res.status(429).json({ error: "limit", remaining: 0 });
  const remaining = LIMIT - used;

  if (JAILBREAK.test(question)) return res.status(200).json({ reply: GUARD_REPLY, sig: sign(GUARD_REPLY), remaining });

  // ---- ask the model ----
  try {
    const messages = [...history, { role: "user", content: question }];
    const raw = PROVIDER === "openai" ? await askOpenAI(messages) : await askClaude(messages);
    const reply = raw.trim().slice(0, MAX_REPLY_CHARS) || "Hmm, I lost my train of thought. Try asking that again?";
    return res.status(200).json({ reply, sig: sign(reply), remaining });
  } catch (error) {
    const tag = "Rixie(" + PROVIDER + "):";
    if (error instanceof Anthropic.RateLimitError || error instanceof OpenAI.RateLimitError) {
      console.error(tag, "rate limited", error.status);
      return res.status(503).json({ error: "busy" });
    } else if (error instanceof Anthropic.APIConnectionError || error instanceof OpenAI.APIConnectionError) {
      console.error(tag, "connection error", error.message);
      return res.status(503).json({ error: "busy" });
    } else if (error instanceof Anthropic.APIError || error instanceof OpenAI.APIError) {
      console.error(tag, "API error", error.status, error.message);
      return res.status(502).json({ error: "upstream" });
    }
    console.error(tag, "unexpected error", error?.message || error);
    return res.status(500).json({ error: "server" });
  }
}

function safeJson(s) { try { return JSON.parse(s); } catch { return {}; } }
