(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- year ---------- */
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- theme toggle (light / dark) ---------- */
  const themeBtn = $(".theme-toggle");
  const themeMeta = $('meta[name="theme-color"]');
  const applyTheme = (t, save) => {
    root.dataset.theme = t;
    themeBtn.setAttribute("aria-label", t === "dark" ? "Switch to light mode" : "Switch to dark mode");
    if (themeMeta) themeMeta.content = t === "dark" ? "#111111" : "#f6f3ee";
    if (save) { try { localStorage.setItem("theme", t); } catch (e) {} }
  };
  applyTheme(root.dataset.theme || "dark", false);
  themeBtn.addEventListener("click", () => applyTheme(root.dataset.theme === "dark" ? "light" : "dark", true));
  // follow OS changes unless the visitor picked a theme themselves
  const mq = matchMedia("(prefers-color-scheme: light)");
  if (mq.addEventListener) mq.addEventListener("change", (e) => {
    let saved = null;
    try { saved = localStorage.getItem("theme"); } catch (err) {}
    if (!saved) applyTheme(e.matches ? "light" : "dark", false);
  });

  /* ---------- mobile menu ---------- */
  const menuBtn = $(".menu-btn");
  const links = $("#nav-links");
  const setMenu = (open) => {
    links.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  menuBtn.addEventListener("click", () => setMenu(!links.classList.contains("open")));
  $$("a", links).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
  document.addEventListener("click", (e) => {
    if (links.classList.contains("open") && !links.contains(e.target) && !menuBtn.contains(e.target)) setMenu(false);
  });

  /* ---------- scroll-driven effects ---------- */
  const nav = $(".nav");
  const progress = $(".scroll-progress");
  const badge = $(".nav-badge");
  const track = $(".marquee-track");
  const intro = $(".intro");
  const banner = $(".banner");
  let ticking = false;

  const onScroll = () => {
    ticking = false;
    const y = scrollY;
    const max = root.scrollHeight - innerHeight;
    progress.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
    nav.dataset.scrolled = y > 24 ? "true" : "false";
    if (badge) badge.style.setProperty("--rot", Math.min(y / 4, 90) + "deg");

    if (reduceMotion) return;

    // name marquee: slides left as the intro section scrolls through the viewport
    if (track && intro) {
      const r = intro.getBoundingClientRect();
      const p = Math.min(Math.max((innerHeight - r.top) / (innerHeight + r.height), 0), 1);
      const travel = track.scrollWidth / 2;
      track.style.setProperty("--mx", (-p * travel) + "px");
    }
    // hero parallax
    if (banner && y < innerHeight * 1.2) {
      banner.style.setProperty("--portrait-y", (y * 0.12) + "px");
      banner.style.setProperty("--collage-y", (y * -0.08) + "px");
    }
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener("resize", onScroll);
  onScroll();

  /* ---------- active nav link ---------- */
  const navMap = new Map($$("a", links).map((a) => [a.getAttribute("href").slice(1), a]));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const a = navMap.get(e.target.id);
      if (a && e.isIntersecting) {
        navMap.forEach((l) => l.classList.remove("active"));
        a.classList.add("active");
      }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  navMap.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });

  /* ---------- reveal on scroll ---------- */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const sibs = $$(":scope > .reveal", el.parentElement);
      el.style.transitionDelay = Math.min(Math.max(sibs.indexOf(el), 0), 5) * 80 + "ms";
      el.classList.add("is-in");
      revealIO.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal").forEach((el) => revealIO.observe(el));

  /* ---------- count-up stats ---------- */
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const end = +el.dataset.count;
      countIO.unobserve(el);
      if (reduceMotion) return;
      const t0 = performance.now();
      const dur = 1400;
      const step = (t) => {
        const k = Math.min((t - t0) / dur, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step);
      };
      el.textContent = "0";
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  $$("[data-count]").forEach((el) => countIO.observe(el));

  /* ---------- experience tabs (WAI-ARIA tabs pattern) ---------- */
  const tabs = $$('.tabs [role="tab"]');
  const indicator = $(".tab-indicator");
  const moveIndicator = () => {
    const sel = tabs.find((t) => t.getAttribute("aria-selected") === "true");
    if (!sel || !indicator) return;
    indicator.style.setProperty("--ix", sel.offsetLeft + "px");
    indicator.style.setProperty("--iw", sel.offsetWidth + "px");
  };
  const selectTab = (tab, focus) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute("aria-controls"));
      if (panel) panel.hidden = !on;
    });
    if (focus) tab.focus();
    moveIndicator();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => selectTab(tab));
    tab.addEventListener("keydown", (e) => {
      const keys = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
      if (!(e.key in keys)) return;
      e.preventDefault();
      selectTab(tabs[(keys[e.key] + tabs.length) % tabs.length], true);
    });
  });
  moveIndicator();
  addEventListener("resize", moveIndicator);
  if (document.fonts) document.fonts.ready.then(moveIndicator);
})();
