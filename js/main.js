/* =========================================================
   SF PREMIUM FITNESS — interacciones y animaciones
   ========================================================= */

/* ---------- CONFIGURACIÓN: completa estos datos ---------- */
const CONFIG = {
  // WhatsApp con código de país, solo números. Ej: "528712740443"
  // Si se deja vacío, los botones "Escríbenos" abren el chat de Instagram.
  whatsapp: "528712740443",
  instagram: "sfpremiumfitness",
  // Horario (hora de Torreón). 0 = domingo … 6 = sábado. Horas en formato 24 h.
  hours: {
    0: [8, 14],
    1: [5, 22], 2: [5, 22], 3: [5, 22], 4: [5, 22], 5: [5, 22],
    6: [7, 15],
  },
  timeZone: "America/Monterrey",
};

(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- datos de contacto ---------- */
  $("#year").textContent = new Date().getFullYear();

  /* ---------- horario: resalta el día de hoy y muestra abierto/cerrado ---------- */
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: CONFIG.timeZone, weekday: "short", hour: "numeric", minute: "numeric", hour12: false,
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t).value;
    const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
    const now = (+get("hour") % 24) + +get("minute") / 60;
    const [open, close] = CONFIG.hours[day];
    const isOpen = now >= open && now < close;
    const badge = $("#openNow");
    badge.textContent = isOpen ? "Abierto ahora" : "Cerrado ahora";
    badge.classList.add(isOpen ? "is-open" : "is-closed");
    $$("#hours tr").forEach((tr) => {
      if (tr.dataset.days.split(",").map(Number).includes(day)) tr.classList.add("is-today");
    });
  } catch (_) { /* navegador sin soporte de zonas horarias */ }

  const contactUrl = (msg = "") =>
    CONFIG.whatsapp
      ? `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`
      : `https://ig.me/m/${CONFIG.instagram}`;

  $$(".js-contact").forEach((el) => {
    el.href = contactUrl(el.dataset.msg);
    el.target = "_blank";
    el.rel = "noopener";
  });

  /* ---------- loader ---------- */
  document.body.classList.add("is-loading");
  const hideLoader = () => {
    $("#loader").classList.add("is-done");
    document.body.classList.remove("is-loading");
    // Revela el hero en cascada
    $$(".hero .reveal").forEach((el, i) => {
      el.style.setProperty("--d", `${0.1 + i * 0.09}s`);
      el.classList.add("is-in");
    });
    $$(".hero .tag").forEach((t) => t.classList.add("is-in"));
  };
  // Espera solo la foto principal (no el mapa ni el resto), con un mínimo para lucir la animación
  let loaderDone = false;
  const finish = () => { if (!loaderDone) { loaderDone = true; hideLoader(); } };
  const heroImg = $(".hero__bg img");
  const minTime = new Promise((r) => setTimeout(r, reduceMotion ? 0 : 1300));
  const heroReady = heroImg.complete ? Promise.resolve() : new Promise((r) => { heroImg.addEventListener("load", r); heroImg.addEventListener("error", r); });
  Promise.all([minTime, heroReady]).then(finish);
  setTimeout(finish, 3000); // por si la imagen tarda

  /* ---------- nav: fondo al hacer scroll + ocultar al bajar ---------- */
  const nav = $("#nav");
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 40);
    nav.classList.toggle("is-hidden", y > lastY && y > 500 && !$("#navLinks").classList.contains("is-open"));
    lastY = y;
    $(".float-btn").classList.toggle("is-visible", y > 600);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- menú móvil ---------- */
  const burger = $("#burger");
  const links = $("#navLinks");
  const toggleMenu = (open) => {
    links.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    document.body.style.overflow = open ? "hidden" : "";
  };
  burger.addEventListener("click", () => toggleMenu(!links.classList.contains("is-open")));
  $$("a", links).forEach((a) => a.addEventListener("click", () => toggleMenu(false)));

  /* ---------- link activo según sección ---------- */
  const navMap = new Map($$(".nav__links a:not(.btn)").map((a) => [a.getAttribute("href").slice(1), a]));
  const secObs = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navMap.forEach((a) => a.classList.remove("is-active"));
      navMap.get(e.target.id)?.classList.add("is-active");
    }),
    { rootMargin: "-45% 0px -50% 0px" }
  );
  navMap.forEach((_, id) => { const s = document.getElementById(id); if (s) secObs.observe(s); });

  /* ---------- reveal on scroll (con cascada por grupo) ---------- */
  const revObs = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      $$(".tag", e.target).forEach((t) => t.classList.add("is-in"));
      revObs.unobserve(e.target);
    }),
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  $$(".reveal").forEach((el) => {
    if (el.closest(".hero")) return; // el hero se anima al terminar el loader
    const siblings = $$(":scope > .reveal", el.parentElement);
    const idx = siblings.indexOf(el);
    if (idx > 0) el.style.setProperty("--d", `${Math.min(idx * 0.08, 0.5)}s`);
    revObs.observe(el);
  });

  /* ---------- contadores ---------- */
  const fmt = (n, el) =>
    el.dataset.format === "thousands" ? n.toLocaleString("es-MX")
    : el.dataset.format === "decimal" ? (n / 10).toFixed(1)
    : String(n);
  const countObs = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const end = +el.dataset.count;
      const dur = reduceMotion ? 0 : 1600;
      const t0 = performance.now();
      const tick = (t) => {
        const p = dur ? Math.min((t - t0) / dur, 1) : 1;
        el.textContent = fmt(Math.round(end * (1 - Math.pow(1 - p, 4))), el);
        if (p < 1) requestAnimationFrame(tick);
      };
      setTimeout(() => requestAnimationFrame(tick), el.closest(".hero") ? 1500 : 0);
      countObs.unobserve(el);
    }),
    { threshold: 0.6 }
  );
  $$("[data-count]").forEach((el) => countObs.observe(el));

  /* ---------- parallax ---------- */
  const parallax = $$("[data-parallax]");
  if (!reduceMotion && parallax.length) {
    let ticking = false;
    const run = () => {
      parallax.forEach((el) => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        el.style.transform = `translate3d(0, ${(r.top * -+el.dataset.parallax).toFixed(1)}px, 0)`;
      });
      ticking = false;
    };
    window.addEventListener("scroll", () => { if (!ticking) { requestAnimationFrame(run); ticking = true; } }, { passive: true });
    run();
  }

  /* ---------- tilt 3D + brillo que sigue al mouse ---------- */
  if (finePointer && !reduceMotion) {
    $$("[data-tilt]").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", `${x * 100}%`);
        card.style.setProperty("--my", `${y * 100}%`);
        card.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 6}deg) rotateY(${(x - 0.5) * 8}deg) translateY(-4px)`;
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });

    /* botones magnéticos */
    $$(".magnetic").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
      });
      btn.addEventListener("pointerleave", () => { btn.style.transform = ""; });
    });

    /* resplandor del cursor */
    const glow = $(".cursor-glow");
    let gx = 0, gy = 0, cx = 0, cy = 0;
    window.addEventListener("pointermove", (e) => { gx = e.clientX; gy = e.clientY; }, { passive: true });
    const follow = () => {
      cx += (gx - cx) * 0.12; cy += (gy - cy) * 0.12;
      glow.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(follow);
    };
    follow();
  }

  /* ---------- lightbox de la galería ---------- */
  const items = $$(".g-item");
  const lb = $("#lightbox");
  const lbImg = $("#lbImg");
  const lbCap = $("#lbCap");
  let current = 0;
  let lastFocus = null;
  const show = (i) => {
    current = (i + items.length) % items.length;
    const img = $("img", items[current]);
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    lbCap.textContent = $("span", items[current]).textContent;
  };
  const openLb = (i) => {
    lastFocus = document.activeElement;
    show(i);
    lb.hidden = false;
    requestAnimationFrame(() => lb.classList.add("is-open"));
    document.body.style.overflow = "hidden";
    $("#lbClose").focus();
  };
  const closeLb = () => {
    lb.classList.remove("is-open");
    document.body.style.overflow = "";
    setTimeout(() => { lb.hidden = true; }, 350);
    lastFocus?.focus();
  };
  items.forEach((it, i) => it.addEventListener("click", () => openLb(i)));
  $("#lbClose").addEventListener("click", closeLb);
  $("#lbPrev").addEventListener("click", () => show(current - 1));
  $("#lbNext").addEventListener("click", () => show(current + 1));
  lb.addEventListener("click", (e) => { if (e.target === lb) closeLb(); });
  document.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowLeft") show(current - 1);
    if (e.key === "ArrowRight") show(current + 1);
  });
  let touchX = null;
  lb.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  /* ---------- formulario ---------- */
  const form = $("#contactForm");
  const msg = $("#formMsg");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const req = $$("[required]", form);
    let ok = true;
    req.forEach((f) => {
      const bad = !f.value.trim();
      f.classList.toggle("is-invalid", bad);
      if (bad) ok = false;
    });
    if (!ok) { msg.textContent = "Por favor completa tu nombre y teléfono."; return; }

    const d = new FormData(form);
    const text = `Hola SF Premium Fitness, soy ${d.get("nombre")} (tel. ${d.get("telefono")}). Me interesa: ${d.get("interes")}. ${d.get("mensaje") || ""}`.trim();

    if (CONFIG.whatsapp) {
      window.open(contactUrl(text), "_blank", "noopener");
      msg.textContent = "¡Listo! Te llevamos a WhatsApp para enviar tu mensaje.";
    } else {
      try { await navigator.clipboard.writeText(text); } catch (_) { /* sin portapapeles */ }
      window.open(contactUrl(), "_blank", "noopener");
      msg.textContent = "Copiamos tu mensaje: pégalo en el chat de Instagram que se abrió.";
    }
    form.reset();
  });
  $$("input, textarea", form).forEach((f) => f.addEventListener("input", () => f.classList.remove("is-invalid")));
})();
