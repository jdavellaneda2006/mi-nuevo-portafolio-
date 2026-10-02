// ===== Menú móvil =====
const menu = document.querySelector('.mobile-menu');
const toggle = document.querySelector('.menu-toggle');
let lenis = null;

if (menu && toggle) {
  const setOpen = (open) => {
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  toggle.addEventListener('click', () => setOpen(true));
  menu.querySelector('.close')?.addEventListener('click', () => setOpen(false));
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
}

// ===== Filtros de artículos =====
document.querySelectorAll('.filter').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter').forEach((b) => b.classList.toggle('active', b === btn));
    const tipo = btn.dataset.filter;
    document.querySelectorAll('.card').forEach((card) => {
      card.classList.toggle('hidden', tipo !== 'todos' && card.dataset.tipo !== tipo);
    });
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });
});

// ===== Formularios de demostración =====
document.querySelectorAll('form[data-demo]').forEach((form) => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const note = form.querySelector('.form-note');
    if (note) note.textContent = 'Gracias. Este formulario es de demostración, aún no envía datos.';
    form.reset();
  });
});

// ===== Animaciones (inspiradas en art-yakushev.com) =====
// Scroll suave con Lenis, títulos que suben letra a letra desde una máscara,
// textos que pasan de desenfocado a enfocado al hacer scroll, imágenes que se
// revelan con clip-path y enlaces con "letter roll" al pasar el ratón.
(function animations() {
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduce || !window.gsap || !window.ScrollTrigger || !window.SplitText) {
    root.classList.remove('js-anim');
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText);
  if (window.ScrambleTextPlugin) gsap.registerPlugin(ScrambleTextPlugin);

  const EASE = 'expo.out';
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // --- Scroll suave ---
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.8, anchors: { offset: -84 } });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // --- Intro al cargar la página ---
  const intro = gsap.timeline({ defaults: { ease: EASE } });

  intro.from('.site-header', { yPercent: -100, autoAlpha: 0, duration: 1.2 });

  const heroStrip = document.querySelector('.hero-strip');
  if (heroStrip) intro.from(heroStrip, { yPercent: 100, duration: 1.4, ease: 'expo.inOut' }, 0);

  const heroBg = document.querySelector('.hero-placeholder, .hero video');
  if (heroBg) intro.from(heroBg, { scale: 1.25, filter: 'blur(20px)', duration: 2.4 }, 0);

  const h1 = document.querySelector('main h1');
  if (h1) {
    SplitText.create(h1, {
      type: 'lines,words,chars',
      mask: 'lines',
      autoSplit: true,
      onSplit(self) {
        gsap.set(h1, { autoAlpha: 1 });
        const tween = gsap.from(self.chars, {
          yPercent: 110, duration: 1.3, ease: EASE, stagger: { amount: 0.6 },
        });
        intro.add(tween, heroStrip ? 0.6 : 0.3);
        return tween;
      },
    });
  }

  const introExtras = gsap.utils.toArray(
    '.page-head .tag, .page-head .lead, .page-head .article-meta, .hero-strip p'
  );
  if (introExtras.length) {
    intro.from(introExtras, {
      autoAlpha: 0, y: 20, filter: 'blur(12px)', duration: 1.2, stagger: 0.12,
    }, 0.9);
  }
  root.classList.remove('js-anim');

  // --- Títulos de sección: letras que suben desde la máscara al entrar ---
  const headings = gsap.utils.toArray('main h2, .prose > h3');
  headings.forEach((el) => {
    SplitText.create(el, {
      type: 'lines,words,chars',
      mask: 'lines',
      autoSplit: true,
      onSplit: (self) => gsap.from(self.chars, {
        yPercent: 110,
        duration: 1.1,
        ease: EASE,
        stagger: { amount: 0.4 },
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      }),
    });
  });

  // --- Textos destacados: cada letra pasa de borrosa a nítida con el scroll ---
  gsap.utils.toArray('main blockquote').forEach((el) => {
    SplitText.create(el, {
      type: 'words,chars',
      autoSplit: true,
      onSplit: (self) => gsap.fromTo(self.chars,
        { opacity: 0.08, filter: 'blur(8px)' },
        {
          opacity: 1,
          filter: 'blur(0px)',
          ease: 'power1.out',
          stagger: { amount: 0.8 },
          scrollTrigger: { trigger: el, start: 'top 85%', end: 'bottom 55%', scrub: 0.3 },
        }),
    });
  });

  // --- Imágenes: revelado con clip-path y zoom interior ---
  const media = gsap.utils.toArray('.article-cover, main figure');
  media.forEach((el) => {
    const inner = el.querySelector('.ph, img, video');
    const tl = gsap.timeline({
      defaults: { ease: 'expo.inOut', duration: 1.5 },
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
    tl.from(el, { clipPath: 'inset(100% 0% 0% 0%)' });
    if (inner) tl.from(inner, { scale: 1.3 }, 0);
    const caption = el.querySelector('figcaption');
    if (caption) tl.from(caption, { autoAlpha: 0, y: 12, duration: 0.8, ease: EASE }, 0.8);
  });

  // Parallax suave en el fondo del hero y la portada del artículo
  gsap.utils.toArray('.hero-placeholder, .hero video').forEach((el) => {
    gsap.to(el, {
      yPercent: 15,
      ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top top', end: 'bottom top', scrub: true },
    });
  });
  // La imagen de portada mide 120% del contenedor, así que se mueve dentro de ese margen.
  // Las que llevan data-static (p. ej. con un logo arriba) se quedan quietas.
  gsap.utils.toArray('.article-cover img:not([data-static])').forEach((el) => {
    gsap.fromTo(el, { yPercent: -8 }, {
      yPercent: 8,
      ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  // --- Bloques: aparecen con desenfoque + desplazamiento, en cascada ---
  const blockSelector = [
    '.prose > *:not(h1):not(h2):not(h3):not(figure):not(blockquote)',
    '.section-head .filters', '.card', '.pub-list li', '.contact-card', '.form',
    '.newsletter .container > *', 'main .section > .container > p',
    '.site-footer .container > *',
  ].join(',');
  const skip = new Set([...headings, ...media]);
  const blocks = gsap.utils.toArray(blockSelector).filter((el) =>
    !el.closest('.page-head') && !el.closest('.hero') &&
    ![...skip].some((s) => s !== el && s.contains(el))
  );

  gsap.set(blocks, { autoAlpha: 0, y: 40, filter: 'blur(10px)' });
  ScrollTrigger.batch(blocks, {
    start: 'top 92%',
    once: true,
    onEnter: (batch) => gsap.to(batch, {
      autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 1.1, ease: EASE, stagger: 0.08,
      clearProps: 'filter,transform',
    }),
  });

  // --- Hover: letras que ruedan en enlaces de navegación y botones ---
  if (canHover) {
    gsap.utils.toArray('.nav a, .btn, .site-footer a').forEach((link) => {
      if (link.children.length || !link.textContent.trim()) return;
      const label = link.textContent;
      link.textContent = '';
      const wrap = document.createElement('span');
      wrap.className = 'roll';
      wrap.textContent = label;
      link.appendChild(wrap);
      link.setAttribute('aria-label', label.trim());
      const { chars } = SplitText.create(wrap, { type: 'chars', charsClass: 'roll-char' });

      link.addEventListener('mouseenter', () => {
        gsap.fromTo(chars, { yPercent: 0 }, {
          yPercent: -100, duration: 0.6, ease: 'expo.inOut', stagger: 0.015, overwrite: true,
        });
      });
    });

    // Logo: texto que se "baraja" al pasar el ratón
    const logo = document.querySelector('.logo');
    if (logo && window.ScrambleTextPlugin) {
      const text = logo.textContent;
      logo.addEventListener('mouseenter', () => {
        gsap.to(logo, {
          duration: 0.8,
          scrambleText: { text, chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', speed: 0.6 },
          overwrite: true,
        });
      });
    }
  }

  // Recalcular posiciones cuando terminen de cargar fuentes e imágenes
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
