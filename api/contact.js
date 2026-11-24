// Contact form + call requests -> email to Manish (Gmail SMTP). Vercel serverless function: POST /api/contact
// Env vars: GMAIL_USER (your Gmail address), GMAIL_APP_PASSWORD (16-char Google App Password),
//           CONTACT_TO (optional, defaults to GMAIL_USER), ALLOWED_ORIGINS (optional),
//           UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (optional, durable rate limit)
import nodemailer from "nodemailer";
import { consume, clientIp } from "./_ratelimit.js";
import { originAllowed } from "./_origin.js";

const LIMIT = 5, WINDOW_SECONDS = 24 * 60 * 60; // per visitor per day: 5 messages AND 5 call requests
const SLOT_START = 10 * 60, SLOT_END = 18 * 60 + 30; // 10:00 – 18:30 IST, every 30 min
const IST_OFFSET_MIN = 330;

let transporter;
function mailer() {
  transporter ||= nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });
  return transporter;
}

const EMAIL_RE = /^[^\s@<>"]{1,64}@[^\s@<>"]{1,180}\.[a-z]{2,24}$/i;
const clean = (v, max) => (typeof v === "string" ? v.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, max) : "");
const cleanMultiline = (v, max) => (typeof v === "string" ? v.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim().slice(0, max) : "");
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// IST wall-clock -> UTC Date
function istToUtc(dateStr, timeStr) {
  const [y, m, d] = dateStr.split("-").map(Number), [hh, mm] = timeStr.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - IST_OFFSET_MIN * 60000);
}
const icsStamp = (dt) => dt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

function validateCall(b) {
  const date = typeof b.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.date) ? b.date : "";
  const time = typeof b.time === "string" && /^\d{2}:\d{2}$/.test(b.time) ? b.time : "";
  if (!date || !time) return "Pick a date and a time slot.";
  const [hh, mm] = time.split(":").map(Number), mins = hh * 60 + mm;
  if (mins < SLOT_START || mins > SLOT_END || mm % 30) return "Pick one of the listed time slots.";
  const start = istToUtc(date, time), now = Date.now();
  if (isNaN(start) || start.getTime() < now + 30 * 60000) return "That slot has already passed — pick a later one.";
  if (start.getTime() > now + 31 * 864e5) return "Pick a date within the next month.";
  const day = new Date(Date.UTC(...date.split("-").map((n, i) => (i === 1 ? n - 1 : +n)))).getUTCDay();
  if (day === 0 || day === 6) return "Calls are available Monday to Friday.";
  if (![15, 30, 45].includes(Number(b.duration))) return "Pick a call length.";
  if (!["phone", "meet"].includes(b.mode)) return "Choose phone or Google Meet.";
  if (b.mode === "phone" && !/^\+?[\d\s()-]{7,20}$/.test(String(b.phone || ""))) return "Add a phone number we can call.";
  return null;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!originAllowed(req)) return res.status(403).json({ error: "Forbidden" });

  const b = (typeof req.body === "string" ? safeJson(req.body) : req.body) || {};
  if (b.website) return res.status(200).json({ ok: true }); // honeypot: bots fill hidden fields

  const type = b.type === "call" ? "call" : "message";
  const name = clean(b.name, 80), email = clean(b.email, 120), company = clean(b.company, 100), role = clean(b.role, 100);
  const message = cleanMultiline(b.message, type === "call" ? 600 : 2000);
  if (name.length < 2) return res.status(400).json({ error: "Please add your name." });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "Please add a valid email address." });
  if (type === "message" && message.length < 10) return res.status(400).json({ error: "Your message is a little short — add a few more words." });
  if (type === "call") { const err = validateCall(b); if (err) return res.status(400).json({ error: err }); }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return res.status(503).json({ error: "not_configured" });

  const used = await consume(clientIp(req), "contact-" + type, WINDOW_SECONDS);
  if (used > LIMIT) return res.status(429).json({ error: type === "call"
    ? "You've already requested " + LIMIT + " calls today — Manish will get back to you soon."
    : "You've already sent " + LIMIT + " messages today — Manish will get back to you soon." });

  const who = name + (company ? " · " + company : "");
  const rows = [["Name", name], ["Email", email], ["Company", company], ["Hiring for", role]];
  let subject, intro, extraHtml = "", extraText = "", icalEvent;

  if (type === "call") {
    const duration = Number(b.duration), mode = b.mode === "meet" ? "Google Meet" : "Phone call";
    const phone = clean(b.phone, 20), start = istToUtc(b.date, b.time), end = new Date(start.getTime() + duration * 60000);
    const pretty = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" }).format(start) + " IST";
    rows.push(["When", pretty], ["Length", duration + " minutes"], ["How", mode + (phone ? " — " + phone : "")]);
    subject = `📞 Call request: ${who} — ${pretty}`;
    intro = `${name} would like a ${duration}-minute ${mode.toLowerCase()} with you.`;
    const details = `Call with ${name}${company ? " (" + company + ")" : ""}\nEmail: ${email}${phone ? "\nPhone: " + phone : ""}\nRole: ${role || "—"}\n\n${message}`;
    const gcal = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent(`Call: ${who}`) +
      "&dates=" + icsStamp(start) + "/" + icsStamp(end) + "&details=" + encodeURIComponent(details) + "&add=" + encodeURIComponent(email);
    extraHtml = `<p style="margin:22px 0"><a href="${esc(gcal)}" style="background:#ff8c59;color:#120b07;padding:12px 20px;border-radius:30px;text-decoration:none;font-weight:600">Add to Google Calendar</a>
      &nbsp; <a href="mailto:${esc(email)}?subject=${encodeURIComponent("Re: our call")}" style="color:#d55923">Reply to confirm</a></p>`;
    extraText = `\nAdd to Google Calendar: ${gcal}\n`;
    const icsText = (s) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
    icalEvent = {
      method: "PUBLISH", filename: "call-request.ics",
      content: ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Manish Portfolio//Call Request//EN", "METHOD:PUBLISH", "BEGIN:VEVENT",
        "UID:" + Date.now() + "-" + Math.random().toString(36).slice(2) + "@portfolio", "DTSTAMP:" + icsStamp(new Date()),
        "DTSTART:" + icsStamp(start), "DTEND:" + icsStamp(end), "SUMMARY:" + icsText(`Call: ${who}`),
        "DESCRIPTION:" + icsText(details), "END:VEVENT", "END:VCALENDAR"].join("\r\n"),
    };
  } else {
    subject = `📩 New message from ${who}`;
    intro = `${name} sent you a message from your portfolio.`;
  }

  const tableHtml = rows.filter(([, v]) => v).map(([k, v]) =>
    `<tr><td style="padding:6px 16px 6px 0;color:#8d877f;font-size:12px;text-transform:uppercase;letter-spacing:1px">${esc(k)}</td><td style="padding:6px 0;font-weight:600">${esc(v)}</td></tr>`).join("");
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;color:#17140e">
    <p style="font-size:16px">${esc(intro)}</p>
    <table style="border-collapse:collapse;margin:12px 0">${tableHtml}</table>
    ${message ? `<div style="white-space:pre-wrap;background:#f6f1ea;border-left:3px solid #ff8c59;padding:14px 16px;border-radius:6px;line-height:1.6">${esc(message)}</div>` : ""}
    ${extraHtml}
    <p style="color:#8d877f;font-size:12px;margin-top:24px">Sent from your portfolio contact form · just hit Reply to answer ${esc(name)}.</p></div>`;
  const text = `${intro}\n\n${rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${message}\n${extraText}`;

  try {
    await mailer().sendMail({
      from: { name: "Portfolio Contact", address: process.env.GMAIL_USER },
      to: recipient(),
      replyTo: { name, address: email },
      subject: subject.slice(0, 200), text, html,
      ...(icalEvent ? { icalEvent } : {}),
    });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Contact: email failed:", error.code || "", error.responseCode || "", error.message);
    const auth = error.code === "EAUTH" || error.responseCode === 535;
    return res.status(502).json({ error: auth ? "not_configured" : "send_failed" });
  }
}

// CONTACT_TO is optional; if it isn't a valid email address, fall back to GMAIL_USER.
function recipient() {
  const to = (process.env.CONTACT_TO || "").trim();
  if (to && EMAIL_RE.test(to)) return to;
  if (to) console.warn("Contact: CONTACT_TO is not an email address, sending to GMAIL_USER instead.");
  return process.env.GMAIL_USER.trim();
}

function safeJson(s) { try { return JSON.parse(s); } catch { return {}; } }
