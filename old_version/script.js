/* =========================================================
   Content — edit these arrays to update the site
   ========================================================= */

const DEVICON = "https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons";
const icon = (slug, file = `${slug}-original`) => `${DEVICON}/${slug}/${file}.svg`;

const SKILLS = [
    {
        title: "frontend", skills: [
            ["JavaScript", icon("javascript")], ["React.js", icon("react")], ["Next.js", icon("nextjs")],
            ["TypeScript", icon("typescript")], ["Redux", icon("redux")],
        ]
    },
    {
        title: "backend", skills: [
            ["Node.js", icon("nodejs")], ["Express", icon("express")], ["FastAPI", icon("fastapi")],
            ["REST APIs"], ["Microservices"],
        ]
    },
    {
        title: "ai / genai", skills: [
            ["RAG"], ["LangChain"], ["LangGraph"], ["AI Agents"], ["MCP"],
        ]
    },
    {
        title: "database", skills: [
            ["PostgreSQL", icon("postgresql")], ["MongoDB", icon("mongodb")], ["MySQL", icon("mysql")],
            ["Redis", icon("redis")], ["Qdrant"],
        ]
    },
    {
        title: "cloud & devops", skills: [
            ["AWS EC2", icon("amazonwebservices", "amazonwebservices-original-wordmark")],
            ["Docker", icon("docker")], ["CI/CD", icon("githubactions")], ["Nginx", icon("nginx")],
        ]
    },
    {
        title: "cs fundamentals", skills: [
            ["DSA"], ["System Design"], ["DBMS"], ["Operating Systems"],
        ]
    },
];

const EXPERIENCE = [
    {
        role: "GEN-AI Developer", company: "Hidden Mind Solutions", period: "Oct – Dec 2025",
        description: "Optimized enterprise RAG pipelines by implementing hybrid retrieval (vector + keyword search), improving retrieval accuracy by 35%. Enhanced Agentic AI workflow efficiency by parallelizing independent tool calls and agent tasks, reducing end-to-end response latency by 40%.",
        tags: ["Next.js", "AWS", "CI/CD", "Node.js"],
    },
    {
        role: "Freelance Full Stack Developer", company: "DesiQnA (Ed-Tech)", url: "https://www.desiqna.in/", period: "Aug – Sept 2025",
        description: "Developed and delivered a full-stack website for an ed-tech firm, creating scalable architectures and seamless user experiences. Built interactive learning modules and integrated secure backend services to support growing student engagement.",
        tags: ["Next.js", "MERN", "REST APIs"],
    },
    {
        role: "Frontend Developer Intern", company: "Bodhi Learning Labs", period: "May – Jul 2025",
        description: "Built “MedTalent,” a flagship analytics dashboard using React.js and Recharts, delivering real-time performance metrics with sub-200ms latency. Applied DOM virtualization and lazy loading to reduce initial page load times by 30%.",
        tags: ["React.js", "Recharts", "UI/UX"],
    },
    {
        role: "Full Stack Developer", company: "Purple Technology", period: "Dec 2024 – Feb 2025",
        description: "Developed a university event management platform. Integrated multiple real-time APIs to automate event data updates, reducing manual admin tasks. Implemented secure JWT-based auth and React/Redux to boost load speeds.",
        tags: ["React.js", "Redux", "JWT", "Node.js"],
    },
];

const PROJECTS = [
    {
        title: "Distributed AI Code Review Platform", img: "images/work/code-review.jpg",
        link: "https://frontend-github-ai-pr-repository.vercel.app/",
        tag: "Multi-agent · LangGraph",
        description: "Automatically reviews GitHub pull requests with 5 microservices and LangGraph-orchestrated agents for security, static analysis, style and architecture, with async processing on QStash and Redis.",
    },
    {
        title: "Udhyog Saathi", img: "images/work/radix.jpg", link: "https://udhyogsaathi.in/",
        tag: "AI · Business SaaS",
        description: "AI-powered business management platform for SMEs: inventory, sales, invoicing, expenses and analytics in one dashboard, with AI demand forecasting.",
    },
    {
        title: "SafeSphere", img: "images/work/Maxlife.jpg", link: "https://sih-frontend-iyu4.vercel.app/",
        tag: "SIH 2025 Nationals",
        description: "Security & incident management platform with secure records, real-time threat monitoring and location-based incident visualization using decentralized architecture and ML.",
    },
    {
        title: "Viscous UI", img: "images/work/viscous.jpg", link: "https://ui-library-lovat-ten.vercel.app/",
        tag: "React UI library",
        description: "A React component library with fluid animations, interactive effects and accessible, production-ready components.",
    },
    {
        title: "GitHub AI Customer Support Agent", img: "images/work/support-agent.jpg",
        link: "https://github-ai-customer-support-agent-1.onrender.com/",
        tag: "LLM agents · RAG",
        description: "Understands GitHub issues, searches documentation and repository context, and answers developers accurately.",
    },
    {
        title: "LMS Platform", img: "images/work/bond.jpg", link: "https://github.com/Manish-bhargava/E-education",
        tag: "MERN · Stripe",
        description: "Full Learning Management System with Stripe payments, admin dashboard and per-student progress tracking.",
    },
    {
        title: "CLI-HUB", img: "images/work/sapphire.jpg", link: "https://github.com/Manish-bhargava/cli-hub",
        tag: "Developer tool",
        description: "AI-powered code generation and project scaffolding, right inside your terminal.",
    },
];

// rows for the hover-slide list (h4 / h5 / h6 like the original)
const WINS_AND_WRITING = [
    { left: "2025", title: "SIH National Finalist", right: "Smart India Hackathon · SafeSphere", link: "https://sih-frontend-iyu4.vercel.app/" },
    { left: "2nd", title: "Next Gen Hackathon", right: "500+ teams · built in 36 hrs" },
    { left: "1800+", title: "LeetCode rating", right: "1000+ problems · LC, GFG, CF" },
    { left: "4+", title: "Internships completed", right: "MERN · Next.js · AWS · AI" },
    { left: "blog", title: "My First Steps into Generative AI", right: "Medium · AI / GenAI", link: "https://medium.com/@bhargavmanish908/my-first-steps-into-the-world-of-generative-ai-79b2d288ce34" },
    { left: "blog", title: "Understanding LangGraph", right: "Medium · AI / LangGraph", link: "https://medium.com/@bhargavmanish908/from-simple-ai-responses-to-intelligent-agents-understanding-langgraph-b241a7523e6a" },
];

/* =========================================================
   Render
   ========================================================= */

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function render() {
    document.getElementById("skill-boxes").innerHTML = SKILLS.map((box, i) => `
        <div class="box ${i % 2 ? "des-box" : "dev-box"}">
            <h4>${esc(box.title)}</h4>
            <div class="elem-div">
                ${box.skills.map(([name, src]) => `
                    <div class="tile" title="${esc(name)}">
                        ${src ? `<img src="${src}" alt="" loading="lazy" onerror="this.remove()">` : ""}
                        <span>${esc(name)}</span>
                    </div>`).join("")}
            </div>
        </div>`).join("");

    document.getElementById("exp-list").innerHTML = EXPERIENCE.map((x) => `
        <article class="exp">
            <div class="exp-when">${esc(x.period)}</div>
            <div class="exp-body">
                <h3>${esc(x.role)}</h3>
                <h5>${x.url ? `<a href="${x.url}" target="_blank" rel="noopener noreferrer">${esc(x.company)} ↗</a>` : esc(x.company)}</h5>
                <p>${esc(x.description)}</p>
                <div class="tags">${x.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div>
            </div>
        </article>`).join("");

    document.getElementById("work-sample").innerHTML = PROJECTS.map((p) => `
        <a class="work" href="${p.link}" target="_blank" rel="noopener noreferrer">
            <img src="${p.img}" alt="${esc(p.title)}" loading="lazy">
            <div class="work-info">
                <small>${esc(p.tag)}</small>
                <h3>${esc(p.title)}</h3>
                <p>${esc(p.description)}</p>
                <b>view live ↗</b>
            </div>
        </a>`).join("");

    document.getElementById("artworks").innerHTML = WINS_AND_WRITING.map((r) => {
        const tag = r.link ? "a" : "div";
        const attrs = r.link ? ` href="${r.link}" target="_blank" rel="noopener noreferrer"` : "";
        return `<${tag} class="row"${attrs}>
            <h4>${esc(r.left)}</h4>
            <h5>${esc(r.title)}${r.link ? " ↗" : ""}</h5>
            <h6>${esc(r.right)}</h6>
            <div class="sliding-div"></div>
        </${tag}>`;
    }).join("");

    document.getElementById("year").textContent = new Date().getFullYear();
}

/* =========================================================
   Motion (same feel as the original: smooth scroll + scrub)
   ========================================================= */

function setupMotion() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // smooth scroll (Lenis) synced with ScrollTrigger
    if (!reduce && window.Lenis) {
        const lenis = new Lenis({ lerp: 0.09 });
        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add((t) => lenis.raf(t * 1000));
        gsap.ticker.lagSmoothing(0);
        document.querySelectorAll('a[href^="#"]').forEach((a) =>
            a.addEventListener("click", (e) => {
                const target = document.querySelector(a.getAttribute("href"));
                if (target) { e.preventDefault(); lenis.scrollTo(target); }
            })
        );
    }

    if (reduce) return;

    // nav arrow rotates + gets a background once you scroll
    gsap.to("nav .nav-arrow svg", {
        rotate: 90,
        scrollTrigger: { trigger: "#page1", start: "top -5%", end: "top -6%", scrub: 1 },
    });
    gsap.to("nav .nav-arrow", {
        backgroundColor: "#111",
        scrollTrigger: { trigger: "#page1", start: "top -15%", end: "top -60%", scrub: 2 },
    });

    // hero entrance
    gsap.from("#page1 h1", { y: 40, opacity: 0, duration: 1, ease: "power3.out" });
    gsap.from("#image-div", { y: 80, opacity: 0, duration: 1.2, delay: 0.15, ease: "power3.out" });

    // name marquee scrubbed with scroll
    gsap.to("#name-div h1", {
        xPercent: -100,
        x: () => -window.innerWidth * 0.02,
        ease: "none",
        scrollTrigger: { trigger: "#name-div", start: "top bottom", end: "bottom top", scrub: 0.7 },
    });

    // intro lines fade in one by one
    gsap.utils.toArray("#intro-div > h1").forEach((el) =>
        gsap.from(el, { opacity: 0, y: 30, duration: 1, scrollTrigger: { trigger: el, start: "top 75%" } })
    );
    gsap.from("#stats > div", {
        opacity: 0, y: 30, stagger: 0.12, duration: 0.8,
        scrollTrigger: { trigger: "#stats", start: "top 85%" },
    });

    // skill boxes
    gsap.utils.toArray(".box").forEach((box) => {
        gsap.from(box.querySelector("h4"), { opacity: 0, scrollTrigger: { trigger: box, start: "top 75%" } });
        gsap.from(box.querySelectorAll(".tile"), {
            opacity: 0, y: 20, stagger: { amount: 0.8 },
            scrollTrigger: { trigger: box, start: "top 80%" },
        });
    });

    // experience + work
    gsap.utils.toArray(".exp").forEach((el) =>
        gsap.from(el, { opacity: 0, y: 50, duration: 0.9, scrollTrigger: { trigger: el, start: "top 85%" } })
    );
    gsap.from(".work", {
        opacity: 0, y: 40, stagger: 0.1, duration: 0.8,
        scrollTrigger: { trigger: "#work-sample", start: "top 75%" },
    });
    gsap.from("#artworks .row", {
        opacity: 0, x: -30, stagger: 0.08, duration: 0.6,
        scrollTrigger: { trigger: "#artworks", start: "top 80%" },
    });
}

render();
setupMotion();
