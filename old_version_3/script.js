(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // year
  const y = $("#year");
  if (y) y.textContent = new Date().getFullYear();

  // scroll progress + hide-on-scroll nav
  const progress = $(".scroll-progress");
  const nav = $(".navigation");
  let lastY = 0;
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    const menuOpen = $(".nav-links").classList.contains("open");
    nav.dataset.hidden = !menuOpen && scrollY > 140 && scrollY > lastY ? "true" : "false";
    lastY = scrollY;
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // mobile menu
  const toggle = $(".menu-toggle");
  const links = $(".nav-links");
  const setMenu = (open) => {
    links.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open);
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    toggle.firstElementChild.textContent = open ? "Close" : "Menu";
  };
  toggle.addEventListener("click", () => setMenu(!links.classList.contains("open")));
  $$("a", links).forEach((a) => a.addEventListener("click", () => setMenu(false)));

  // reveal on scroll
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
    }),
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  $$("[data-reveal]").forEach((el) => io.observe(el));

  // signal explorer
  const signals = [
    { label: "STRUCTURE", shape: "shape-structure", title: "Give an idea structure.",
      text: "Full-stack products with MERN, Next.js and FastAPI that connect real needs to working software." },
    { label: "NETWORK", shape: "shape-network", title: "Make models reason over real data.",
      text: "RAG pipelines, LangGraph agents and MCP servers that plug intelligence into products." },
    { label: "RIPPLES", shape: "shape-ripples", title: "Ship it. Let it scale.",
      text: "Dockerised, CI/CD-driven deployments on AWS that keep running after launch." },
  ];
  const ex = $(".signal-explorer");
  if (ex) {
    const shape = $(".signal-shape", ex), label = $(".signal-center-label", ex),
      count = $(".signal-count", ex), story = $(".signal-story", ex);
    $$(".signal-options button", ex).forEach((btn) => btn.addEventListener("click", () => {
      const i = +btn.dataset.i, s = signals[i];
      $$(".signal-options button", ex).forEach((b) => b.setAttribute("aria-pressed", b === btn));
      shape.className = `signal-shape ${s.shape}`;
      label.textContent = s.label;
      count.textContent = `0${i + 1} / 03`;
      story.innerHTML = `<h3>${s.title}</h3><p>${s.text}</p>`;
      story.classList.remove("swap"); void story.offsetWidth; story.classList.add("swap");
    }));
  }

  // expertise accordion + thinking path
  const paths = [
    { t: "FULL STACK ENGINEERING", s: ["Understand the need", "Design the system", "Build the product"] },
    { t: "GENERATIVE AI", s: ["Find the right data", "Ground the model", "Orchestrate the agents"] },
    { t: "CLOUD & DEVOPS", s: ["Containerise", "Automate the pipeline", "Ship and observe"] },
  ];
  const items = $$(".expertise-item");
  items.forEach((item, idx) => {
    const btn = $("button", item);
    btn.addEventListener("click", () => {
      items.forEach((other) => {
        const open = other === item;
        other.classList.toggle("expanded", open);
        $("button", other).setAttribute("aria-expanded", open);
        $(".expertise-body", other).hidden = !open;
      });
      const p = paths[idx];
      $("#path-title").textContent = p.t;
      $("#path-steps").innerHTML = p.s
        .map((step, n) => `<li style="animation-delay:${n * 70}ms"><span>0${n + 1}</span>${step}</li>`)
        .join("");
    });
  });
})();
