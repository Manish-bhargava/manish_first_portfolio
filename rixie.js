/* Rixie — Manish's AI assistant (chat widget).
   Talks to /api/chat (Claude, server-side). If that endpoint isn't reachable
   (static hosting, local file preview, no API key), it falls back to a small
   offline answerer that only uses the verified facts below. */
(function () {
  "use strict";
  var LIMIT = 5, STORE = "rixie_v1", API = "/api/chat";

  // local testing only: open http://localhost:3000/?reset-limits to forget this browser's question count
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) && /[?&]reset-limits\b/.test(location.search)) {
    try { localStorage.removeItem(STORE); } catch (e) {}
  }

  // ---------- state ----------
  var state = { used: 0, history: [], reset: 0, awaitingRole: false };
  try {
    var saved = JSON.parse(localStorage.getItem(STORE) || "null");
    if (saved && saved.reset > Date.now()) state = Object.assign(state, saved);
  } catch (e) {}
  if (!state.reset || state.reset < Date.now()) state.reset = Date.now() + 864e5;
  function save() { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {} }

  // ---------- DOM ----------
  var root = document.createElement("div");
  root.className = "rixie";
  root.innerHTML =
    '<button class="rixie-fab" aria-expanded="false" aria-controls="rixiePanel"><span class="rixie-orb" aria-hidden="true"></span><span>Ask Rixie</span></button>' +
    '<section class="rixie-panel" id="rixiePanel" role="dialog" aria-label="Rixie, Manish’s AI assistant" hidden>' +
      '<header class="rixie-head"><span class="rixie-orb big" aria-hidden="true"></span><div><strong>Rixie</strong><span>Manish’s AI assistant</span></div>' +
      '<span class="rixie-count" id="rixieCount"></span><button class="rixie-x" aria-label="Close chat">✕</button></header>' +
      '<div class="rixie-log" id="rixieLog" aria-live="polite"></div>' +
      '<div class="rixie-chips" id="rixieChips"></div>' +
      '<form class="rixie-form" id="rixieForm"><input id="rixieInput" maxlength="500" autocomplete="off" placeholder="Ask about Manish…" aria-label="Your question" /><button aria-label="Send">↑</button></form>' +
      '<p class="rixie-foot">Answers only about Manish · 5 questions per visitor</p>' +
    '</section>';
  document.body.appendChild(root);
  var fab = root.querySelector(".rixie-fab"), panel = root.querySelector(".rixie-panel"),
      log = root.querySelector("#rixieLog"), form = root.querySelector("#rixieForm"),
      input = root.querySelector("#rixieInput"), chips = root.querySelector("#rixieChips"),
      count = root.querySelector("#rixieCount"), busy = false;

  var SUGGEST = ["Why should we hire Manish?", "What has he built?", "What’s his experience?", "LeetCode & hackathons?"];

  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fmt(t) { // safe: escape first, then allow **bold**, bullets and links
    return esc(t)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(https?:\/\/[^\s<]+[^\s<.,)])/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
      .replace(/(^|\n)[-•] /g, "$1• ")
      .replace(/\n/g, "<br>");
  }
  function bubble(who, text) {
    var b = document.createElement("div");
    b.className = "rixie-msg " + who;
    b.innerHTML = fmt(text);
    log.appendChild(b); log.scrollTop = log.scrollHeight;
    return b;
  }
  function left() { return Math.max(0, LIMIT - state.used); }
  function renderCount() {
    count.textContent = left() + " / " + LIMIT + " left";
    var done = left() === 0;
    input.disabled = done;
    input.placeholder = done ? "Question limit reached" : "Ask about Manish…";
    chips.innerHTML = done ? "" : SUGGEST.map(function (s) { return '<button type="button">' + esc(s) + "</button>"; }).join("");
  }
  function greet() {
    if (log.childElementCount) return;
    bubble("bot", "Hi, I’m **Rixie**, Manish’s AI assistant 👋 Ask me about his experience, products, skills — or why he’d be a great hire. You get " + LIMIT + " questions.");
    state.history.forEach(function (t) { bubble("user", t.q); bubble("bot", t.a); });
    if (!left()) limitMsg();
  }
  function limitMsg() { bubble("bot", "That’s your " + LIMIT + " questions — thanks for stopping by! For anything else, reach Manish directly at bhargavmanish908@gmail.com or on LinkedIn."); }

  function open(v) {
    panel.hidden = !v; fab.setAttribute("aria-expanded", String(v)); root.classList.toggle("is-open", v);
    if (v) { greet(); renderCount(); setTimeout(function () { input.focus(); }, 50); }
  }
  fab.addEventListener("click", function () { open(panel.hidden); });
  root.querySelector(".rixie-x").addEventListener("click", function () { open(false); fab.focus(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) { open(false); fab.focus(); } });
  chips.addEventListener("click", function (e) { if (e.target.tagName === "BUTTON") ask(e.target.textContent); });
  form.addEventListener("submit", function (e) { e.preventDefault(); ask(input.value); });

  function ask(q) {
    q = String(q || "").trim().slice(0, 500);
    if (!q || busy) return;
    if (!left()) return;
    busy = true; input.value = "";
    bubble("user", q);
    var typing = bubble("bot typing", "");
    typing.innerHTML = "<i></i><i></i><i></i>";
    remote(q).catch(function () { return { reply: offline(q), sig: "" }; }).then(function (r) {
      typing.remove();
      if (r.limit) { state.used = LIMIT; limitMsg(); }
      else {
        bubble("bot", r.reply);
        state.used += 1;
        if (typeof r.remaining === "number") state.used = Math.max(state.used, LIMIT - r.remaining);
        state.history.push({ q: q, a: r.reply, sig: r.sig || "" });
        state.history = state.history.slice(-LIMIT);
        if (!left()) limitMsg();
      }
      save(); renderCount(); busy = false;
    });
  }

  function remote(q) {
    if (location.protocol === "file:") return Promise.reject(new Error("offline"));
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { ctrl && ctrl.abort(); }, 25000);
    return fetch(API, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q, history: state.history.filter(function (t) { return t.sig; }) }),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      clearTimeout(timer);
      if (res.status === 429) return { limit: true };
      var type = res.headers.get("content-type") || "";
      if (!res.ok || type.indexOf("application/json") < 0) throw new Error("unavailable");
      return res.json().then(function (d) { if (!d.reply) throw new Error("bad"); return d; });
    });
  }

  // ---------- offline answerer: verified facts only ----------
  var F = {
    exp: {
      ai: "**AI Engineering Intern — Hidden Mind Solutions** (Oct–Dec 2025): hybrid-retrieval RAG pipelines (+35% retrieval accuracy) and parallel agent tool calls (−40% latency) with LangGraph, MCP, FastAPI, Qdrant, Docker and AWS.",
      backend: "**Backend Developer — DesiQnA** (Aug–Sep 2025): REST APIs in Node.js, Express and PostgreSQL for 100+ concurrent users; Redis caching and indexing cut API latency 40%.",
      frontend: "**Frontend & Full Stack Intern — Bodhi Learning Labs** (May–Jul 2025): MedTalent healthcare platform in React with 15+ Recharts dashboards; lazy loading cut load time ~30%.",
      fullstack: "**Full Stack Intern — Purple Technology** (Dec 2024–Feb 2025): university event platform used by 500+ students, with JWT + role-based auth, React and Redux."
    },
    proj: {
      review: "**AI GitHub PR Reviewer** — 5 microservices, multi-agent LangGraph workflow on GitHub webhooks; used by 20+ teams.",
      udhyog: "**Udhyog Saathi** — B2B SaaS (GST billing, inventory, AI assistant) on AWS EC2 + Nginx, serving 100+ concurrent users.",
      safe: "**SafeSphere** — SIH 2025 national-finals project; real-time SOS portal + command center over WebSockets (he led the frontend).",
      support: "**GitHub AI Support Agent** — RAG agent grounded in docs and repository context.",
      viscous: "**Viscous UI** — React component library of fluid, motion-first components.",
      dukaan: "**Dukaan Flow** — FMCG distributor ordering platform that handles WhatsApp, photo and Hindi voice-note orders.",
      cli: "**CLI-Hub** — AI code generation and scaffolding in the terminal."
    },
    wins: "He’s a **LeetCode Knight (1800+ rating)** with 900+ DSA problems solved, a **Smart India Hackathon 2025 National Finalist** and a **Next Gen Hackathon Winner**.",
    contact: "Reach Manish at **bhargavmanish908@gmail.com**, on LinkedIn (linkedin.com/in/manish-bhargava-36093a2b7) or GitHub (github.com/Manish-bhargava)."
  };
  var ROLES = [
    { re: /\b(ai|ml|gen ?ai|genai|llm|rag)\b|machine learning|agentic|\bagents?\b/i, name: "AI / GenAI Engineer", exp: ["ai", "backend"], proj: ["review", "support", "udhyog"] },
    { re: /\b(front ?end|react|ui)\b|web dev/i, name: "Frontend", exp: ["frontend", "fullstack"], proj: ["viscous", "safe", "udhyog"] },
    { re: /\b(back ?end|node|apis?|server)\b/i, name: "Backend", exp: ["backend", "ai"], proj: ["review", "udhyog", "dukaan"] },
    { re: /\b(full ?stack|mern)\b/i, name: "Full Stack", exp: ["fullstack", "frontend", "backend"], proj: ["udhyog", "review", "safe"] },
    { re: /\b(sde|software|engineer|developer|intern|swe|graduate|fresher)\b/i, name: "Software Engineer", exp: ["ai", "backend", "frontend"], proj: ["review", "udhyog", "safe"] }
  ];
  var ROASTS = [
    "Wow, a recruiter-grade question if I’ve ever seen one… from a 5-year-old. 😏",
    "That’s adorable. Did you ask your calculator that too?",
    "Bold of you to spend one of your 5 precious questions on that. 💀",
    "I’m an AI assistant, not a kindergarten quiz show."
  ];
  function pitch(role) {
    return "Great — for a **" + role.name + "** role, here’s why Manish fits:\n" +
      role.exp.map(function (k) { return "• " + F.exp[k]; }).join("\n") + "\n" +
      "• He’s shipped " + role.proj.map(function (k) { return F.proj[k]; }).join(" ") + "\n" +
      "• " + F.wins + "\n" + F.contact;
  }
  function offline(q) {
    var s = q.toLowerCase();
    if (/(ignore|forget|override).{0,40}(instruction|rule|prompt)|system prompt|developer mode|\bdan\b|jail ?break|pretend|you are now|act as/.test(s))
      return "Nice try 😄 I’m Rixie and my rules don’t change. I only talk about Manish — want to know **why you should hire him**?";
    var role = ROLES.filter(function (r) { return r.re.test(s); })[0];
    if (state.awaitingRole && role) { state.awaitingRole = false; return pitch(role); }
    if (/(why|should).{0,30}hire|hire (him|manish)|good fit|stand out/.test(s)) {
      if (role) return pitch(role);
      state.awaitingRole = true;
      return "Happy to make the case! First — **what role are you hiring for?** (e.g. Frontend, Backend, Full Stack, AI/GenAI Engineer, SDE intern)";
    }
    if (state.awaitingRole && /(sales|marketing|account|hr|finance|design(er)?$)/.test(s)) {
      state.awaitingRole = false;
      return "Honestly, that isn’t Manish’s focus. He’s a strong fit for **Software, Full Stack, Backend and AI/GenAI Engineering** roles. " + F.contact;
    }
    if (/(project|built|build|product|portfolio|made)/.test(s)) return "Here are some things he’s shipped:\n" + ["review", "udhyog", "safe", "dukaan", "support", "viscous"].map(function (k) { return "• " + F.proj[k]; }).join("\n");
    if (/(experience|intern|work(ed)?|job|company)/.test(s)) return "His internships so far:\n" + ["ai", "backend", "frontend", "fullstack"].map(function (k) { return "• " + F.exp[k]; }).join("\n");
    if (/(leetcode|dsa|competitive|rating|hackathon|sih|achiev|award|knight)/.test(s)) return F.wins;
    if (/(skill|stack|tech|language|tools?)/.test(s)) return "**Frontend:** React, Next.js, TypeScript, Redux, Tailwind. **Backend:** Node.js, Express, FastAPI, PostgreSQL, MongoDB, Redis. **AI:** LangChain, LangGraph, RAG, MCP, multi-agent systems. **Cloud:** AWS, Docker, Nginx, CI/CD.";
    if (/(contact|email|reach|linkedin|github|resume|cv)/.test(s)) return F.contact;
    if (/(study|college|education|degree|university|vit)/.test(s)) return "He’s doing a **B.Tech in Computer Science & Engineering at VIT-AP** (2023–2027).";
    if (/(who|about|tell me|introduce)/.test(s)) return "Manish is a **Full Stack AI Developer & Cloud-Native Engineer** from India who builds and ships real products — from a 5-microservice AI code reviewer to a SaaS serving 100+ concurrent users. " + F.wins;
    if (role) { state.awaitingRole = false; return pitch(role); }
    if (/[bcdfghjklmnpqrstvwxz]{6,}|qwert|asdf|zxcv|(.)\1{3,}|^\s*\d+\s*[-+*\/x]\s*\d+|joke|dumb|stupid|idiot|bored|lol|hello there|\bpizza\b|weather|capital of|meaning of life/.test(s) || s.length < 3)
      return ROASTS[Math.floor(Math.random() * ROASTS.length)] + " Try a real one: **Why should we hire Manish?**";
    return "I only know about Manish, and I won’t guess. Try: **Why should we hire Manish?**, **What has he built?** or **What’s his tech stack?** For anything else, email bhargavmanish908@gmail.com.";
  }

  renderCount();
})();
