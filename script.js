(function () {
  var root = document.documentElement;
  root.classList.add("js");

  // ---- motion toggle ----
  var motionBtn = document.getElementById("motionToggle");
  var motionState = document.getElementById("motionState");
  var off = false;
  try { off = localStorage.getItem("motion") === "off"; } catch (e) {}
  function applyMotion() {
    root.classList.toggle("no-motion", off);
    motionState.textContent = off ? "OFF" : "ON";
    motionBtn.setAttribute("aria-pressed", String(off));
  }
  applyMotion();
  motionBtn.addEventListener("click", function () {
    off = !off;
    try { localStorage.setItem("motion", off ? "off" : "on"); } catch (e) {}
    applyMotion();
  });

  // ---- light / dark theme ----
  var themeBtn = document.getElementById("themeToggle");
  function setTheme(t, save) {
    root.classList.add("theme-anim");
    root.setAttribute("data-theme", t);
    if (themeBtn) themeBtn.setAttribute("aria-label", t === "light" ? "Switch to dark mode" : "Switch to light mode");
    if (save) { try { localStorage.setItem("theme", t); } catch (e) {} }
    setTimeout(function () { root.classList.remove("theme-anim"); }, 400);
  }
  if (themeBtn) {
    setTheme(root.getAttribute("data-theme") || "dark", false);
    themeBtn.addEventListener("click", function () { setTheme(root.getAttribute("data-theme") === "light" ? "dark" : "light", true); });
  }
  if (window.matchMedia) {
    var mq = matchMedia("(prefers-color-scheme: light)");
    var follow = function (e) { var saved; try { saved = localStorage.getItem("theme"); } catch (x) {} if (!saved) setTheme(e.matches ? "light" : "dark", false); };
    if (mq.addEventListener) mq.addEventListener("change", follow);
  }

  // ---- nav: scroll state, hide on scroll down, progress bar ----
  var nav = document.getElementById("nav");
  var progress = document.getElementById("progress");
  var lastY = 0;
  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
    nav.classList.toggle("scrolled", y > 40);
    lastY = y;
  }

  // ---- mobile menu ----
  var menu = document.getElementById("main-nav");
  var menuBtn = document.getElementById("menuToggle");
  menuBtn.addEventListener("click", function () {
    var open = menu.classList.toggle("is-open");
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.querySelector("span").textContent = open ? "Close" : "Menu";
  });
  menu.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      menu.classList.remove("is-open");
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.querySelector("span").textContent = "Menu";
    });
  });

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---- reveal on scroll ----
  var items = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
  }

  // ---- products grid + detail modal ----
  var PRODUCTS = [
    { id: "code-review", featured: true, cats: ["ai", "fullstack"], cat: "AI & distributed systems", badge: "LIVE · FLAGSHIP",
      title: "Distributed AI Code Review Platform",
      cover: { img: "./images/work/code-review.jpg" },
      short: "A 5-microservice GitHub PR reviewer powered by a multi-agent LangGraph workflow.",
      lead: "Install it on a repository and every pull request gets reviewed automatically. Webhooks trigger a multi-agent LangGraph workflow that reads the diff, flags security issues, checks style and architecture, suggests fixes and posts contextual review comments back on GitHub.",
      points: ["5 independent microservices with async processing over QStash and Redis", "Specialised agents for security, static analysis, style and architecture", "Webhook-driven — reviews land on the PR without anyone lifting a finger", "Containerised with Docker and deployed on AWS"],
      stack: ["LangGraph", "FastAPI", "Redis", "QStash", "Docker", "AWS", "Webhooks"],
      live: "https://frontend-github-ai-pr-repository.vercel.app/" },
    { id: "udhyog", cats: ["fullstack", "ai"], cat: "SaaS · Product", badge: "LIVE · 100+ USERS",
      title: "Udhyog Saathi",
      cover: { title: "Udhyog <em>Saathi</em>", sub: "GST BILLING · INVENTORY · AI INSIGHTS", bg: "linear-gradient(135deg, #2a1608, #0d0a08 70%)", glow: "#ff8c5955", accent: "#ffb27f" },
      short: "Business suite for SMEs — GST billing, inventory, analytics and AI support.",
      lead: "An all-in-one operating system for small and medium businesses: inventory, sales, GST invoicing, expenses and analytics in one dashboard, with an AI assistant and demand forecasting on top. Running in production for real businesses.",
      points: ["Serving 100+ concurrent users in production", "AI support assistant and demand forecasting built with LangGraph", "Google OAuth + JWT authentication and integrated payments", "Deployed on AWS EC2 behind Nginx"],
      stack: ["MongoDB", "Express", "React", "Node.js", "LangGraph", "AWS EC2", "Nginx"],
      live: "https://udhyogsaathi.in/" },
    { id: "safesphere", cats: ["fullstack", "ai"], cat: "Real-time systems", badge: "SIH 2025 · NATIONAL FINALIST",
      title: "SafeSphere",
      cover: { title: "Safe<em>Sphere</em>", sub: "SOS PORTAL · COMMAND CENTER · LIVE TRACKING", bg: "linear-gradient(135deg, #2a0b0b, #0b0909 70%)", glow: "#ff4d4d55", accent: "#ff8a80" },
      short: "AI safety platform with a real-time SOS portal and emergency command center.",
      lead: "Built for Smart India Hackathon 2025, where we reached the national finals. Citizens raise SOS alerts from a portal; responders track incidents live from a command center, with AI/ML threat detection flagging what needs attention first.",
      points: ["Led the frontend for both the Citizen SOS Portal and the Command Center", "WebSockets for live location, alerts and two-way communication", "Wired to AI/ML services for threat detection", "Top 5 nationally at Smart India Hackathon 2025"],
      stack: ["Next.js", "WebSockets", "AI/ML", "REST APIs"],
      live: "https://sih-frontend-iyu4.vercel.app/" },
    { id: "support-agent", cats: ["ai"], cat: "Agents & retrieval", badge: "LIVE",
      title: "GitHub AI Support Agent",
      cover: { img: "./images/work/support-agent.jpg" },
      short: "A customer-support agent grounded in repository knowledge with RAG.",
      lead: "An LLM support agent that understands GitHub issues, searches documentation and repository context, and answers developers accurately — grounded in the actual codebase instead of guessing.",
      points: ["Retrieval-augmented generation over docs and repository content", "Understands issue context before answering", "Deployed and usable live"],
      stack: ["Python", "RAG", "LLM agents", "Vector search"],
      live: "https://github-ai-customer-support-agent-1.onrender.com/" },
    { id: "viscous", cats: ["frontend"], cat: "Open source · UI", badge: "LIVE",
      title: "Viscous UI",
      cover: { img: "./images/work/viscous.jpg" },
      short: "A React component library of fluid, motion-first components.",
      lead: "A React component library focused on fluid animation and interaction — accessible, production-ready components that feel alive without sacrificing usability.",
      points: ["Motion-first components with fluid, interactive effects", "Accessible and production-ready", "Documented with a live showcase site"],
      stack: ["React", "Design systems", "Motion", "CSS"],
      live: "https://ui-library-lovat-ten.vercel.app/" },
    { id: "lms", cats: ["fullstack"], cat: "Ed-tech · Full stack", badge: "OPEN SOURCE",
      title: "LMS Platform",
      cover: { title: "Learn<em>.</em>", sub: "COURSES · STRIPE PAYMENTS · PROGRESS TRACKING", bg: "linear-gradient(135deg, #1b1230, #0a0910 70%)", glow: "#9b7bff55", accent: "#b9a3ff" },
      short: "A full Learning Management System with payments and progress tracking.",
      lead: "A complete learning management system: course catalogue, Stripe-powered enrolment, an admin dashboard for managing content and per-student progress tracking.",
      points: ["Stripe payments for course enrolment", "Admin dashboard to manage courses and students", "Per-student progress tracking"],
      stack: ["MongoDB", "Express", "React", "Node.js", "Stripe"],
      repo: "https://github.com/Manish-bhargava/E-education" },
    { id: "cli-hub", cats: ["tools", "ai"], cat: "Developer tooling", badge: "OPEN SOURCE",
      title: "CLI-Hub",
      cover: { term: "<b>$</b> cli-hub generate api --ai\n✓ scaffolded 12 files\n✓ routes, models, tests ready", sub: "AI CODE GENERATION IN YOUR TERMINAL", bg: "linear-gradient(135deg, #0b1f14, #080a09 70%)", glow: "#3ddc8455", accent: "#9ff0b5" },
      short: "AI-powered code generation and project scaffolding, right in the terminal.",
      lead: "A developer tool that brings AI workflows into the terminal — generate code and scaffold whole projects without leaving the command line.",
      points: ["AI-powered code generation from the command line", "Project scaffolding for common stacks", "Built for speed in day-to-day developer workflows"],
      stack: ["Node.js", "CLI", "LLM APIs"],
      repo: "https://github.com/Manish-bhargava/cli-hub" }
  ];

  var grid = document.getElementById("productGrid");
  var modal = document.getElementById("productModal");
  if (grid && modal) {
    var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
    var coverHTML = function (c, alt) {
      if (c.img) return '<img src="' + c.img + '" alt="' + esc(alt) + '" loading="lazy" />';
      return '<div class="art" style="--art-bg:' + c.bg + ';--art-glow:' + c.glow + ';--art-accent:' + c.accent + '">' +
        (c.term ? '<div class="art-term">' + c.term + '</div>' : '<div class="art-title">' + c.title + '</div>') +
        '<div class="art-sub">' + c.sub + '</div></div>';
    };
    var visible = PRODUCTS.slice(), current = 0, lastFocus = null;

    var render = function (filter) {
      visible = PRODUCTS.filter(function (p) { return filter === "all" || p.cats.indexOf(filter) > -1; });
      grid.classList.toggle("featured", filter === "all");
      grid.innerHTML = visible.map(function (p, i) {
        return '<article class="product-card' + (p.featured ? " is-featured" : "") + '" data-i="' + i + '" style="animation-delay:' + (i * 60) + 'ms">' +
          '<div class="pc-cover">' + coverHTML(p.cover, p.title) +
          '<span class="pc-badge' + (p.live ? " live" : "") + '">' + p.badge + '</span><span class="pc-open" aria-hidden="true">↗</span></div>' +
          '<div class="pc-body"><span class="pc-cat">' + esc(p.cat) + '</span><h3>' + esc(p.title) + '</h3><p>' + esc(p.short) + '</p>' +
          '<ul class="tags">' + p.stack.slice(0, 4).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + '</ul>' +
          '<div class="pc-actions"><button type="button" class="pc-more" aria-label="View details for ' + esc(p.title) + '">View details <span>→</span></button>' +
          (p.live ? '<a class="pc-live" href="' + p.live + '" target="_blank" rel="noopener" aria-label="Open ' + esc(p.title) + ' live site"><i></i>Live ↗</a>'
                  : (p.repo ? '<a class="pc-live code" href="' + p.repo + '" target="_blank" rel="noopener" aria-label="View ' + esc(p.title) + ' code on GitHub">Code ↗</a>' : '')) +
          '</div></div></article>';
      }).join("") + (filter === "all" ?
        '<a class="product-card github-tile" href="https://github.com/Manish-bhargava" target="_blank" rel="noopener" style="animation-delay:' + (visible.length * 60) + 'ms"><span class="gt-num">20+</span><h3>More on GitHub ↗</h3><p>Experiments, tools and everything in between.</p></a>' : "");
    };

    var open = function (i) {
      current = (i + visible.length) % visible.length;
      var p = visible[current];
      document.getElementById("pmCover").innerHTML = coverHTML(p.cover, p.title);
      document.getElementById("pmMeta").textContent = p.cat + " · " + p.badge;
      document.getElementById("pmTitle").textContent = p.title;
      document.getElementById("pmLead").textContent = p.lead;
      document.getElementById("pmPoints").innerHTML = p.points.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
      document.getElementById("pmTags").innerHTML = p.stack.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
      var acts = "";
      if (p.live) acts += '<a class="pm-btn primary" href="' + p.live + '" target="_blank" rel="noopener"><i></i>Visit live ↗</a>';
      if (p.repo) acts += '<a class="pm-btn' + (p.live ? "" : " primary") + '" href="' + p.repo + '" target="_blank" rel="noopener">View code on GitHub ↗</a>';
      document.getElementById("pmActions").innerHTML = acts;
      document.getElementById("pmCount").textContent = String(current + 1).padStart(2, "0") + " / " + String(visible.length).padStart(2, "0");
      if (!modal.open) {
        lastFocus = document.activeElement;
        if (modal.showModal) modal.showModal(); else modal.setAttribute("open", "");
        document.body.classList.add("modal-open");
      }
      modal.scrollTop = 0;
    };
    var close = function () {
      if (modal.close) modal.close(); else modal.removeAttribute("open");
    };
    modal.addEventListener("close", function () {
      document.body.classList.remove("modal-open");
      if (lastFocus) lastFocus.focus();
    });

    grid.addEventListener("click", function (e) {
      if (e.target.closest("a")) return; // live / code links open normally
      var card = e.target.closest(".product-card[data-i]");
      if (card) open(+card.dataset.i);
    });
    document.getElementById("pmClose").addEventListener("click", close);
    document.getElementById("pmPrev").addEventListener("click", function () { open(current - 1); });
    document.getElementById("pmNext").addEventListener("click", function () { open(current + 1); });
    modal.addEventListener("click", function (e) { if (e.target === modal) close(); });
    modal.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") open(current + 1);
      if (e.key === "ArrowLeft") open(current - 1);
    });

    var filterBtns = document.querySelectorAll(".product-filters button");
    filterBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        filterBtns.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        render(b.dataset.filter);
      });
    });
    render("all");
  }

  // ---- experience route: bus drives along as you scroll ----
  var route = document.getElementById("route");
  if (route) {
    var stopsEls = route.querySelectorAll(".stop");
    var routeTick = function () {
      var r = route.getBoundingClientRect(), vh = window.innerHeight;
      var vertical = window.innerWidth <= 900, p;
      if (vertical) p = (vh * 0.6 - r.top) / r.height;
      else p = (vh * 0.85 - r.top) / (vh * 0.55);
      p = Math.max(0, Math.min(1, p));
      route.style.setProperty("--p", p.toFixed(4));
      stopsEls.forEach(function (st) {
        var dot = st.querySelector(".stop-dot").getBoundingClientRect();
        var at = vertical ? (dot.top + dot.height / 2 - r.top) / r.height : (dot.left + dot.width / 2 - r.left) / r.width;
        st.classList.toggle("reached", p >= at - 0.005);
      });
    };
    window.addEventListener("scroll", routeTick, { passive: true });
    window.addEventListener("resize", routeTick);
    routeTick();
  }

  // ---- discipline explorer ----
  var stories = [
    { label: "STRUCTURE", title: "Give an idea structure.", text: "Full-stack products and interfaces that connect real needs to working software.", link: "Explore the products ↗", href: "#work" },
    { label: "INTELLIGENCE", title: "Make software think.", text: "Multi-agent LangGraph workflows, RAG and LLM agents that turn models into reliable product features.", link: "Explore the AI work ↗", href: "#work" },
    { label: "MOMENTUM", title: "Take it to production.", text: "Docker, AWS, Nginx and CI/CD — shipping real products to real users, at real concurrency.", link: "See the journey ↗", href: "#experience" }
  ];
  var shape = document.getElementById("sigShape");
  var buttons = document.querySelectorAll(".signal-options button");
  buttons.forEach(function (b) {
    b.addEventListener("click", function () {
      var i = +b.dataset.i, s = stories[i];
      buttons.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      shape.dataset.shape = i;
      document.getElementById("sigLabel").textContent = s.label;
      document.getElementById("sigTitle").textContent = s.title;
      document.getElementById("sigText").textContent = s.text;
      var l = document.getElementById("sigLink");
      l.textContent = s.link; l.href = s.href;
      document.getElementById("sigCount").textContent = "0" + (i + 1) + " / 03";
    });
  });

  // ---- copy email / phone ----
  document.querySelectorAll(".contact-copy").forEach(function (b) {
    b.addEventListener("click", function () {
      var text = b.getAttribute("data-copy"), done = function () {
        b.textContent = "Copied ✓"; b.classList.add("copied");
        setTimeout(function () { b.textContent = "Copy"; b.classList.remove("copied"); }, 1600);
      };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback);
      else fallback();
      function fallback() {
        var t = document.createElement("textarea"); t.value = text; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
        document.body.appendChild(t); t.select();
        try { document.execCommand("copy"); done(); } catch (e) { window.prompt("Copy:", text); }
        t.remove();
      }
    });
  });

  // ---- year ----
  document.getElementById("year").textContent = new Date().getFullYear();
})();
