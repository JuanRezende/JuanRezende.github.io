/* ══════════════════════════════════════════════════════════════════════════════════════
   main.js · Juan Rezende portfolio — everything that runs on the page
   Needs (loaded before it): GSAP + ScrollTrigger (assets/vendor), effects/cosmos.js, effects/wave.js.

   Contents (search for the ══ headers):
     setup ........... flags (motion, fine pointer), helpers $ / $$, views
     COSMOS .......... starts the background starfield
     ROUTER .......... home sections (#sobre) and cases (#case/<slug>[/<section>])
     VIEW SETUP ...... nav state, per-view observers, word splitting
     MOTION .......... GSAP timelines per view: hero, projects, about, process, contact, cases
     IGNITION ........ featured card: tilt, border trace, converging corners
     INTRO ........... the opening beam and name
     HEADER PROGRESS · POINTER LIGHT · LUMEN (glass spotlight, magnetic buttons, reels, offscreen pause)
     MOBILE MENU · LIGHTBOX · TABS · E-MAIL
     WAVE ............ hero ring + contact horizon (effects/wave.js)
     BOOT ............ first route, intro, load refresh
   ══════════════════════════════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const doc = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  const motion = hasGSAP && !reduceMotion;

  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
  }
  doc.classList.toggle('motion', motion);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  const header = $('#site-header');
  const views = { home: $('#view-home'), case: $('#view-case') };
  const cases = {};
  $$('.case').forEach(a => { cases[a.dataset.case] = a; });
  const baseTitle = document.title;
  /* credential counts follow their lists, so adding a certificate is a single line of markup */
  $$('[data-count-of]').forEach(el => { const list = $(el.dataset.countOf); if (list) el.textContent = list.children.length; });

  /* lite mode (html.fx-lite, set in <head> when there is no hardware graphics, or by the FX WATCHDOG below) */
  const isLite = () => doc.classList.contains('fx-lite');

  /* ══════════ COSMOS: the background starfield (effects/cosmos.js) ══════════ */
  const cosmos = Lumen.createCosmos($('#cosmos'));

  /* ══════════ ROUTER: home sections (#sobre) and cases (#case/<slug>[/<section>]) ══════════ */
  function parse(hash = location.hash) {
    const h = decodeURIComponent(hash || '');
    const m = h.match(/^#case\/([\w-]+)(?:\/([\w-]+))?$/);
    if (m && cases[m[1]]) return { view: 'case', slug: m[1], section: m[2] || null };
    return { view: 'home', slug: null, target: h.slice(1) || null };
  }

  let current = { view: null, slug: null };
  let busy = false, pending = false;
  function route({ smooth = false, initial = false } = {}) {
    const next = parse();
    if (busy) { pending = true; return; }
    if (next.view === current.view && next.slug === current.slug) {
      focusTarget(scrollToTarget(next, smooth));
      return;
    }
    const swap = (delay) => {
      showView(next, delay);
      const el = scrollToTarget(next, false);
      focusTarget(el || (next.view === 'case' ? $('.case-title', cases[next.slug]) : null));
    };
    if (initial || !motion) { swap(initial ? 'intro' : 0); return; }
    jump(next, swap);
  }

  /* title card between views: the screen fades to night and jumps through the stars (effects/cosmos.js warp),
     a line of light draws the next title mid-flight, then the stars settle and it opens on the new view */
  const warp = Lumen.createWarp($('.curtain__warp'));
  function jump(next, swap) {
    busy = true;
    const c = $('#curtain'), line = $('.curtain__line', c), parts = $$('.curtain__label, .curtain__title', c);
    const article = next.view === 'case' ? cases[next.slug] : null;
    const kicker = article && $('.spaced', article);
    $('.curtain__label', c).textContent = article ? (kicker ? kicker.textContent.split('·')[0].trim() : 'Case') : 'Portfólio';
    $('.curtain__title', c).textContent = article ? article.dataset.title : 'Juan Rezende';
    const tl = gsap.timeline({ onComplete: () => { if (warp) warp.stop(); busy = false; if (pending) { pending = false; route(); } } });
    if (warp) {
      tl.add(() => warp.start(), 0)
        .fromTo(warp.state, { speed: 0 }, { speed: 1, duration: 0.85, ease: 'power2.in' }, 0)
        .to(warp.state, { speed: 0, duration: 0.8, ease: 'power3.out' }, 1.0);
    }
    tl.set(c, { visibility: 'visible' }, 0)
      .to(c, { opacity: 1, duration: 0.45, ease: 'power2.inOut' }, 0)
      .fromTo(line, { scaleX: 0, transformOrigin: 'left center' }, { scaleX: 1, duration: 0.7, ease: 'power3.inOut' }, 0.2)
      .fromTo(parts, { opacity: 0, y: 14, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.55, stagger: 0.07, ease: 'power3.out' }, 0.3)
      .add(() => swap(0.2), 0.95)
      .to(parts, { opacity: 0, y: -10, duration: 0.3, ease: 'power2.in' }, 1.1)
      .to(line, { scaleX: 0, transformOrigin: 'right center', duration: 0.45, ease: 'power3.in' }, 1.1)
      .to(c, { opacity: 0, duration: 0.6, ease: 'power2.inOut' }, 1.3)
      .set(c, { visibility: 'hidden' });
  }

  function showView(next, delay) {
    unmount();
    const isCase = next.view === 'case';
    views.home.hidden = isCase;
    views.case.hidden = !isCase;
    Object.values(cases).forEach(a => { a.hidden = a.dataset.case !== next.slug; });
    const article = isCase ? cases[next.slug] : null;
    document.title = isCase ? `${article.dataset.title} | Juan Rezende` : baseTitle;
    if (!isCase) setNavCurrent(null);
    window.scrollTo(0, 0);
    if (isCase) setupCase(article); else setupHome();
    setupShared(isCase ? views.case : views.home);
    mount(next.view, article, delay);
    if (hasGSAP) ScrollTrigger.refresh();
    current = { view: next.view, slug: next.slug };
  }

  function scrollToTarget(next, smooth) {
    let el = null;
    if (next.view === 'case' && next.section) el = document.getElementById(`${next.slug}-${next.section}`);
    if (next.view === 'home' && next.target) el = document.getElementById(next.target);
    const behavior = smooth && !reduceMotion ? 'smooth' : 'auto';
    if (!el) {
      if (next.view === 'home' && !next.target) window.scrollTo({ top: 0, behavior });
      return null;
    }
    const top = next.target === 'inicio' ? 0 : Math.max(0, el.getBoundingClientRect().top + window.scrollY - header.offsetHeight + 1);
    window.scrollTo({ top, behavior });
    return el;
  }

  function focusTarget(el) {
    if (!el) return;
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const href = a.getAttribute('href');
    if (href === '#') return;
    e.preventDefault();
    closeMenu();
    if (href === '#conteudo') { focusTarget($('#conteudo')); return; }
    const next = parse(href);
    const same = next.view === current.view && next.slug === current.slug;
    if (href !== location.hash) history[same ? 'replaceState' : 'pushState'](null, '', href);
    route({ smooth: true });
  });
  window.addEventListener('popstate', () => route());

  /* ══════════ VIEW SETUP (always runs) ══════════ */
  let observers = [];

  function setNavCurrent(id) {
    $$('.nav-link[data-nav]').forEach(l => { if (l.dataset.nav === id) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current'); });
  }

  function setupHome() {
    if (motion) splitWords($('#sobre .statement'));
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => { if (en.isIntersecting) setNavCurrent(en.target.id === 'inicio' ? null : en.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['inicio', 'projetos', 'sobre', 'processo', 'artigos', 'contato'].forEach(id => { const s = document.getElementById(id); if (s) io.observe(s); });
    observers.push(io);
  }

  function setupCase(article) {
    const slug = article.dataset.case;
    const secs = $$('.csec', article);
    const list = $('[data-index]', article);
    if (list && !list.children.length) {
      list.innerHTML = secs.map((s, i) => `<li><a href="#case/${slug}/${s.id.slice(slug.length + 1)}"><span class="n">${String(i + 1).padStart(2, '0')}</span><span>${s.dataset.label}</span></a></li>`).join('');
    }
    const links = list ? $$('a', list) : [];
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const i = secs.indexOf(en.target);
        links.forEach((l, j) => { if (j === i) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current'); });
      });
    }, { rootMargin: '-30% 0px -65% 0px' });
    secs.forEach(s => io.observe(s));
    observers.push(io);
  }

  /* media frames catch a single pass of light the first time they enter */
  function setupShared(scope) {
    if (!motion) return;
    const frames = $$('.media__frame, .stage', scope).filter(el => !el.closest('[hidden]'));
    frames.forEach(f => f.classList.remove('is-scanned'));
    const fio = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-scanned'); obs.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -15% 0px' });
    frames.forEach(f => fio.observe(f));
    observers.push(fio);
  }

  function splitWords(el) {
    if (!el || el.dataset.split) return;
    el.dataset.split = '1';
    const walk = (node) => {
      Array.from(node.childNodes).forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const s = document.createElement('span');
            s.className = 'w'; s.textContent = part; frag.append(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
  }

  /* ══════════ MOTION (GSAP, scoped per view and reverted on leave) ══════════ */
  let ctx = null, mm = null, heroTl = null;
  const settle = { clearProps: 'transform,filter' };

  function unmount() {
    observers.forEach(o => o.disconnect());
    observers = [];
    if (mm) { mm.revert(); mm = null; }
    if (ctx) { ctx.revert(); ctx = null; }
    heroTl = null;
  }

  function mount(view, article, delay) {
    if (!motion) return;
    ctx = gsap.context(() => { if (view === 'home') animateHome(delay); else animateCase(article, delay); });
  }

  function revealBatch(scope) {
    const els = $$('[data-reveal]', scope).filter(el => !el.closest('[hidden]'));
    if (!els.length) return;
    gsap.set(els, { opacity: 0, y: 30, filter: 'blur(8px)' });
    ScrollTrigger.batch(els, {
      start: 'top 90%', once: true,
      onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.1, stagger: 0.09, ease: 'power3.out', overwrite: true, clearProps: 'transform,filter' })
    });
  }

  /* titles are set word by word; the accessible name stays the whole sentence */
  function splitHeading(el) {
    if (!el || el.dataset.words) return;
    el.dataset.words = '1';
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    const walk = (node) => {
      Array.from(node.childNodes).forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(' '); return; }
            const word = document.createElement('span');
            word.className = 'wd'; word.setAttribute('aria-hidden', 'true'); word.textContent = part;
            frag.append(word);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
  }

  /* each word drifts in from the right out of blur, like the stacked titles of the reference */
  function revealHeadings(list) {
    list.forEach(hd => {
      splitHeading(hd);
      gsap.from($$('.wd', hd), { opacity: 0, x: 60, filter: 'blur(8px)', duration: 1.1, stagger: 0.07, ease: 'power3.out', clearProps: 'transform,filter,opacity', scrollTrigger: { trigger: hd, start: 'top 86%' } });
    });
  }

  function counters(scope) {
    $$('[data-count]', scope).forEach(el => {
      const end = parseFloat(el.dataset.count), suffix = el.dataset.suffix || '', dec = +el.dataset.decimals || 0;
      const fmt = (v) => v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix;
      const obj = { v: 0 };
      el.textContent = fmt(0);
      gsap.to(obj, {
        v: end, duration: 1.8, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        onUpdate: () => { el.textContent = fmt(obj.v); },
        onComplete: () => { el.textContent = fmt(end); }
      });
    });
  }

  /* swaps the text for random glyphs that resolve left to right; the final text is kept on the element so a revert mid-way can't leave it scrambled */
  function scramble(el, duration) {
    const text = el.dataset.text || (el.dataset.text = el.textContent);
    const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/';
    const o = { p: 0 };
    el.textContent = text;
    return gsap.to(o, {
      p: 1, duration, ease: 'none',
      onUpdate: () => { const n = Math.floor(o.p * text.length); el.textContent = text.slice(0, n) + text.slice(n).replace(/\S/g, () => glyphs[(Math.random() * glyphs.length) | 0]); },
      onComplete: () => { el.textContent = text; }
    });
  }

  /* ══════════ IGNITION: the featured container rises out of a tilt, light draws its border up from the base,
     the viewfinder corners converge and a pool of light comes up under it (scroll-linked; the still is untouched) ══════════ */
  function drawTrace(ig) {
    const media = $('.proj__media', ig), svg = $('.proj__trace', ig);
    if (!media || !svg) return;
    const W = media.clientWidth, H = media.clientHeight;
    if (!W || !H) return;
    const r = Math.max(0, parseFloat(getComputedStyle(media).borderTopLeftRadius) - 1), s = 0.75, k = Math.max(0, r - s), p = $$('path', svg);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    p[0].setAttribute('d', `M${W / 2} ${H - s}H${r}A${k} ${k} 0 0 1 ${s} ${H - r}V${r}A${k} ${k} 0 0 1 ${r} ${s}H${W / 2}`);
    p[1].setAttribute('d', `M${W / 2} ${H - s}H${W - r}A${k} ${k} 0 0 0 ${W - s} ${H - r}V${r}A${k} ${k} 0 0 0 ${W - r} ${s}H${W / 2}`);
  }
  const ease3 = (t) => 1 - Math.pow(1 - t, 3);
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  function setIgnite(ig, p) {
    const e = ease3(p), d = clamp01((p - 0.04) / 0.72), c = ease3(clamp01((p - 0.3) / 0.66));
    ig.style.setProperty('--tilt', (1 - e).toFixed(4));
    ig.style.setProperty('--dim', (1 - clamp01(p / 0.8)).toFixed(4));
    ig.style.setProperty('--draw', (d < 0.5 ? 2 * d * d : 1 - Math.pow(-2 * d + 2, 2) / 2).toFixed(4));
    ig.style.setProperty('--c-off', (64 - 50 * c).toFixed(1) + 'px');
    ig.style.setProperty('--c-op', c.toFixed(3));
    ig.style.setProperty('--glow', clamp01((p - 0.38) / 0.6).toFixed(3));
  }
  $$('[data-ignite]').forEach(ig => {
    drawTrace(ig);
    if ('ResizeObserver' in window) new ResizeObserver(() => drawTrace(ig)).observe($('.proj__media', ig));
  });

  function animateHome(delay) {
    heroTl = gsap.timeline({ paused: delay === 'intro', delay: typeof delay === 'number' ? delay : 0 })
      .from('.hero__gl', { opacity: 0, duration: 2.4, ease: 'power2.out' }, 0)
      .call(() => { if (wave) wave.ignite(); }, null, 0.15)
      .from('.hero__beams', { opacity: 0, duration: 2.4, ease: 'power2.out' }, 0.9)
      .from('.hero__laser', { scaleY: 0, duration: 1.4, ease: 'power3.inOut', clearProps: 'transform' }, 0)
      .fromTo('.hero__bloom', { scale: 0.3, opacity: 0 }, { scale: 1.25, opacity: 1, duration: 0.45, ease: 'power2.out' }, 0.75)
      .to('.hero__bloom', { scale: 2.2, opacity: 0, duration: 1.7, ease: 'power2.out' }, 1.2)
      .fromTo('.hero__flare', { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.85, ease: 'expo.out' }, 0.75)
      .to('.hero__flare', { opacity: 0, duration: 1.5, ease: 'power2.inOut' }, 1.4)
      /* Title, promise and single action enter in sequence. */
      .from('.hero__frame', { opacity: 0, scale: 1.05, duration: 1.8, ease: 'power3.out', clearProps: 'transform' }, 0.8)
      .from('.hero__line > *', { yPercent: 38, opacity: 0, filter: 'blur(14px)', duration: 1.6, ease: 'expo.out', stagger: 0.14, clearProps: 'transform,filter,opacity' }, 0.9)
      .fromTo('.hero__promise', { clipPath: 'inset(-30% 50% -30% 50%)', opacity: 0, filter: 'blur(8px)' }, { clipPath: 'inset(-30% 0% -30% 0%)', opacity: 1, filter: 'blur(0px)', duration: 1.4, ease: 'power3.inOut', clearProps: 'clipPath,filter,opacity' }, 1.35)
      .from('.hero__horizon', { scaleX: 0, opacity: 0, duration: 1.6, ease: 'expo.out', clearProps: 'transform' }, 1.55)
      .from('.hero__cta > *', { opacity: 0, y: 18, filter: 'blur(6px)', duration: 1, ease: 'power3.out', stagger: 0.12, ...settle }, 1.6);

    const heroST = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
    /* transform + opacity only: a filter scrubbed by scroll repaints the whole hero on every frame */
    gsap.to('.hero__inner', { yPercent: -18, scale: 0.94, opacity: 0, ease: 'none', scrollTrigger: heroST });
    gsap.to('.hero__stage', { scale: 1.15, opacity: 0.12, ease: 'none', scrollTrigger: heroST });

    revealHeadings($$('.h2, .stacked', views.home));

    /* the credit reels slide in from opposite sides */
    gsap.from('.ticker__row', { opacity: 0, x: (i) => (i ? 120 : -120), duration: 1.6, ease: 'expo.out', stagger: 0.12, clearProps: 'transform,opacity', scrollTrigger: { trigger: '.ticker', start: 'top 94%' } });

    /* projects: the featured still is pulled into focus by the scroll (the reference's stage);
       the others slide in from their own side out of blur, and every still drifts inside its frame */
    $$('.proj').forEach(card => {
      const media = $('.proj__media', card), still = $('.proj__parallax', card);
      if (card.classList.contains('proj--featured')) {
        const ig = $('.proj__ignite', card), proxy = { p: 0 };
        if (ig) gsap.to(proxy, { p: 1, ease: 'none', onUpdate: () => setIgnite(ig, proxy.p), scrollTrigger: { trigger: ig, start: 'top 96%', end: 'top 26%', scrub: 0.6 } });
        gsap.from($('.proj__body', card), { opacity: 0, y: 30, filter: 'blur(8px)', duration: 1.1, ease: 'power3.out', ...settle, scrollTrigger: { trigger: $('.proj__body', card), start: 'top 92%' } });
      } else {
        const side = card.getBoundingClientRect().left < window.innerWidth / 2 ? -40 : 40;
        gsap.from(card, { opacity: 0, y: 80, x: side, filter: 'blur(10px)', duration: 1.2, ease: 'power3.out', ...settle, scrollTrigger: { trigger: card, start: 'top 85%' } });
        gsap.fromTo(still, { scale: 1.16 }, { scale: 1, duration: 2, ease: 'power3.out', scrollTrigger: { trigger: card, start: 'top 85%' } });
      }
      gsap.fromTo(still, { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    const words = $$('#sobre .statement .w');
    if (words.length) gsap.fromTo(words, { opacity: 0.14 }, { opacity: 1, stagger: 0.05, ease: 'none', scrollTrigger: { trigger: '#sobre .statement', start: 'top 82%', end: 'bottom 45%', scrub: 0.6 } });
    counters($('.impact'));
    gsap.fromTo('.portrait__frame img', { scale: 1.14 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.portrait', start: 'top bottom', end: 'bottom top', scrub: true } });

    const bar = $('.process__bar span'), comet = $('.process__comet');
    if (bar) bar.style.transform = '';
    if (comet) comet.style.transform = '';
    mm = gsap.matchMedia();
    mm.add('(min-width: 1024px)', () => {
      const track = $('.process__track');
      const dist = () => Math.max(0, track.scrollWidth - doc.clientWidth);
      if (dist() < 40) return;
      const steps = $$('.step');
      let bases = [], span = 1;
      const measure = () => {
        const x = gsap.getProperty(track, 'x') || 0;
        bases = steps.map(st => { const r = st.getBoundingClientRect(); return r.left + r.width / 2 - x; });
        span = Math.max(1, dist());
      };
      const focus = () => {
        if (!bases.length) measure();
        const x = gsap.getProperty(track, 'x') || 0;
        const p = Math.min(1, Math.max(0, -x / span));
        const first = bases[0], last = bases[bases.length - 1] - span;
        const fx = first + (last - first) * p;
        const pitch = bases.length > 1 ? bases[1] - bases[0] : 400;
        steps.forEach((st, i) => {
          const t = Math.min(1, Math.abs(bases[i] + x - fx) / (pitch * 1.6));
          st.style.opacity = (1 - t * 0.5).toFixed(3);
          st.style.transform = `scale(${(1 - t * 0.06).toFixed(4)})`;
          st.style.filter = t > 0.03 ? `blur(${(t * 2).toFixed(2)}px)` : 'none';
        });
      };
      const refocus = () => { measure(); focus(); };
      gsap.to(track, {
        x: () => -dist(), ease: 'none', onUpdate: focus,
        scrollTrigger: {
          trigger: '.process__pin', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate: (st) => {
            if (bar) bar.style.transform = `scaleX(${st.progress})`;
            if (comet) comet.style.transform = `translateX(${st.progress * comet.parentElement.clientWidth}px)`;
          }
        }
      });
      refocus();
      ScrollTrigger.addEventListener('refresh', refocus);
      return () => {
        ScrollTrigger.removeEventListener('refresh', refocus);
        steps.forEach(st => { st.style.opacity = ''; st.style.transform = ''; st.style.filter = ''; });
      };
    });
    mm.add('(max-width: 1023px)', () => {
      gsap.from('.step', { opacity: 0, y: 40, duration: 0.9, stagger: 0.08, ease: 'power3.out', ...settle, scrollTrigger: { trigger: '.process__track', start: 'top 85%' } });
    });

    gsap.fromTo('.horizon', { yPercent: 40 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '#contato', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    gsap.fromTo('.horizon__sun', { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, ease: 'none', scrollTrigger: { trigger: '#contato', start: 'top 60%', end: 'bottom bottom', scrub: true } });
    gsap.fromTo('.horizon__flare', { scaleX: 0.15, opacity: 0 }, { scaleX: 1, opacity: 1, ease: 'none', scrollTrigger: { trigger: '#contato', start: 'top 70%', end: 'bottom bottom', scrub: true } });
    revealBatch(views.home);
  }

  function animateCase(article, delay) {
    gsap.from($$('.case-el', article), { opacity: 0, y: 30, filter: 'blur(8px)', duration: 1.1, stagger: 0.08, ease: 'power3.out', ...settle, delay: typeof delay === 'number' ? delay : 0.1 });
    const stage = $('.stage', article);
    if (stage) gsap.fromTo(stage, { scale: 0.9, opacity: 0.35 }, { scale: 1, opacity: 1, ease: 'none', scrollTrigger: { trigger: stage, start: 'top 95%', end: 'center 60%', scrub: 0.6 } });
    revealHeadings($$('.csec h2', article).concat($$('.case-contact .h2')));
    revealBatch(article);
    revealBatch($('.case-contact'));
    counters(article);
  }

  function playHero() { if (heroTl) heroTl.play(); }

  /* the nebula and dust drift with the scroll (skipped in lite mode: two full-screen layers moving on every scroll frame) */
  const atmosTweens = [];
  if (motion) {
    if (!isLite()) atmosTweens.push(
      gsap.to('.atmos__layer', { yPercent: -12, ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 1.2 } }),
      gsap.to('.atmos__dust', { yPercent: -26, ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 1.6 } }));
    gsap.from('#site-header', { y: -60, opacity: 0, duration: 1.1, ease: 'power3.out', clearProps: 'transform', delay: doc.classList.contains('no-intro') ? 0 : 1.8 });
  }

  /* ══════════ INTRO: a single beam of light, the name, then the scene ══════════ */
  function runIntro(done) {
    const intro = $('#intro');
    try { sessionStorage.setItem('jr-intro', '1'); } catch (e) {}
    if (!intro || doc.classList.contains('no-intro')) { if (intro) intro.remove(); done(); return; }
    const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.race([fonts, new Promise(r => setTimeout(r, 900))]).then(() => {
      setTimeout(() => {
        intro.classList.add('is-done');
        setTimeout(done, 250);
        setTimeout(() => intro.remove(), 1100);
      }, 1300);
    });
  }

  /* ══════════ HEADER PROGRESS ══════════ */
  const progress = $('#scroll-progress');
  let progressQueued = false;
  function updateProgress() {
    progressQueued = false;
    const max = doc.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
  }
  window.addEventListener('scroll', () => { if (!progressQueued) { progressQueued = true; requestAnimationFrame(updateProgress); } }, { passive: true });

  /* ══════════ POINTER LIGHT: soft ambient glow + a key light that follows the cursor over project stills ══════════ */
  if (finePointer && !reduceMotion) {
    const glow = $('.cursor-glow');
    let gx = window.innerWidth / 2, gy = window.innerHeight / 2, tx = gx, ty = gy, running = false;
    const tick = () => {
      gx += (tx - gx) * 0.1; gy += (ty - gy) * 0.1;
      glow.style.transform = `translate3d(${gx.toFixed(1)}px,${gy.toFixed(1)}px,0)`;
      if (Math.abs(tx - gx) + Math.abs(ty - gy) > 0.5) requestAnimationFrame(tick); else running = false;
    };
    window.addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; glow.style.opacity = '1'; if (!running) { running = true; requestAnimationFrame(tick); } }, { passive: true });
    $$('.proj__media, .next-card__media').forEach(m => {
      m.addEventListener('pointermove', (e) => {
        const r = m.getBoundingClientRect();
        m.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        m.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      });
    });
  }

  /* ══════════ LUMEN: glass spotlight, magnetic actions, lit section edges, credit reels, offscreen pause ══════════ */
  if (finePointer && !reduceMotion) {
    /* one delegated listener moves the spotlight inside whichever glass panel is under the cursor */
    document.addEventListener('pointermove', (e) => {
      const g = e.target.closest && e.target.closest('.glass, .cap, .step');
      if (!g) return;
      const r = g.getBoundingClientRect();
      g.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
      g.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
    }, { passive: true });
    /* actions lean toward the cursor a little, then settle back */
    $$('.btn').forEach(b => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        b.style.setProperty('--tx', ((e.clientX - r.left - r.width / 2) * 0.16).toFixed(1) + 'px');
        b.style.setProperty('--ty', ((e.clientY - r.top - r.height / 2) * 0.28).toFixed(1) + 'px');
      });
      b.addEventListener('pointerleave', () => { b.style.removeProperty('--tx'); b.style.removeProperty('--ty'); });
    });
  }
  /* each reel is doubled so the loop has no seam */
  if (!reduceMotion) $$('.ticker__row').forEach(row => { const tr = $('.ticker__track', row); if (tr && row.children.length === 1) row.appendChild(tr.cloneNode(true)); });
  /* section edges catch a beam of light the first time they arrive */
  if (motion) {
    const litIO = new IntersectionObserver((entries) => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-lit'); litIO.unobserve(en.target); } }), { rootMargin: '0px 0px -18% 0px' });
    $$('.section').forEach(s => litIO.observe(s));
  }
  /* looping CSS motion rests while its block is off screen */
  if ('IntersectionObserver' in window) {
    const pauseIO = new IntersectionObserver((entries) => entries.forEach(en => en.target.classList.toggle('is-paused', !en.isIntersecting)));
    $$('.hero, .ticker, .portrait, .ai-card, .btn--fill, .btn--solid').forEach(el => pauseIO.observe(el));
  }

  /* ══════════ MOBILE MENU ══════════ */
  const menuBtn = $('.menu-btn'), menu = $('#mobile-menu');
  function setMenu(open) {
    menu.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    $('use', menuBtn).setAttribute('href', open ? '#i-x' : '#i-menu');
    doc.classList.toggle('is-locked', open);
    if (open) {
      const first = $('a', menu); if (first) first.focus();
      if (motion) gsap.from($$('a', menu), { opacity: 0, y: 14, duration: 0.6, stagger: 0.05, ease: 'power3.out', clearProps: 'all' });
    }
  }
  function closeMenu() { if (menu.classList.contains('is-open')) setMenu(false); }
  menuBtn.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); } });

  /* ══════════ LIGHTBOX ══════════ */
  const lb = $('#lightbox'), lbImg = $('#lightbox-img'), lbCap = $('#lightbox-cap');
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-zoom]');
    if (!t) return;
    e.preventDefault();
    if (typeof lb.showModal !== 'function') { window.open(t.dataset.zoom, '_blank', 'noopener'); return; }
    lbImg.src = t.dataset.zoom;
    lbImg.alt = t.dataset.caption || '';
    lbCap.textContent = t.dataset.caption || '';
    lb.showModal();
    doc.classList.add('is-locked');
    $('.lightbox__scroll', lb).scrollTop = 0;
    if (motion) gsap.fromTo('.lightbox__fig', { opacity: 0, scale: 0.97 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out', clearProps: 'all' });
  });
  lb.addEventListener('close', () => { doc.classList.remove('is-locked'); lbImg.removeAttribute('src'); });
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target.classList.contains('lightbox__scroll')) lb.close(); });
  $('.lightbox__close', lb).addEventListener('click', () => lb.close());

  /* ══════════ TABS ══════════ */
  $$('[role="tablist"]').forEach(list => {
    const tabs = $$('[role="tab"]', list);
    const select = (tab, focus) => {
      tabs.forEach(t => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        panel.hidden = !on;
        if (on && motion) gsap.fromTo(panel, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', clearProps: 'transform,opacity' });
      });
      if (focus) tab.focus();
      if (hasGSAP) ScrollTrigger.refresh();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', (e) => {
        let j = null;
        if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
        if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
        if (e.key === 'Home') j = 0;
        if (e.key === 'End') j = tabs.length - 1;
        if (j !== null) { e.preventDefault(); select(tabs[j], true); }
      });
    });
  });

  /* ══════════ E-MAIL (assembled at click time so the address never sits in the HTML for scrapers) ══════════ */
  const mailAddr = () => atob('ZXVqdWFucmV6ZW5kZQ==') + '@' + atob('Z21haWwuY29t');
  /* mailto: does nothing without a default mail app, so open Gmail's compose window instead;
     the address is also copied, for visitors who write from another client */
  $$('[data-mail]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      const addr = mailAddr();
      try { navigator.clipboard?.writeText(addr).catch(() => {}); } catch (_) {}
      window.open('https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(addr), '_blank', 'noopener');
    });
  });


  /* ══════════ WAVE: hero ring and contact horizon (effects/wave.js) ══════════ */
  const heroCanvas = $('.hero__gl'), horizonCanvas = $('.horizon__gl');
  const wave = heroCanvas ? Lumen.waveField(heroCanvas, 0) : null;
  const horizon = horizonCanvas ? Lumen.waveField(horizonCanvas, 1) : null;
  /* without the GSAP timeline (no library, reduced motion) the ring is lit at once */
  if (wave && !motion) wave.ignite();

  /* ══════════ FX WATCHDOG: a GPU that is present but too weak (median frame over 40ms, under ~25fps) switches the
     visit to lite mode. 40ms, not 17: Chrome's energy saver caps pages at 30fps and must not trip it. Skipped when a
     mode was forced (?fx=) or chosen earlier this session. ══════════ */
  function goLite() {
    if (isLite()) return;
    doc.classList.add('fx-lite');
    try { sessionStorage.setItem('jr-fx', 'lite'); } catch (e) {}
    atmosTweens.forEach(t => { if (t.scrollTrigger) t.scrollTrigger.kill(); t.kill(); });
    if (hasGSAP) gsap.set(['.atmos__layer', '.atmos__dust'], { clearProps: 'transform' });
    [wave, horizon, cosmos].forEach(fx => { if (fx && fx.lite) fx.lite(); });
  }
  function watchFrames() {
    let chosen = null;
    try { chosen = sessionStorage.getItem('jr-fx'); } catch (e) {}
    if (chosen || isLite() || reduceMotion) return;
    const sample = (tries) => {
      if (document.hidden || busy) { if (tries) setTimeout(() => sample(tries - 1), 1500); return; }
      const t = []; let last = 0;
      const f = (now) => {
        if (last) t.push(now - last);
        last = now;
        if (document.hidden) return;
        if (t.length < 60) { requestAnimationFrame(f); return; }
        t.sort((a, b) => a - b);
        if (t[t.length >> 1] > 40) goLite();
      };
      requestAnimationFrame(f);
    };
    setTimeout(() => sample(4), 2500);
  }

  /* ══════════ BOOT ══════════ */
  route({ initial: true });
  updateProgress();
  runIntro(() => { playHero(); watchFrames(); });
  window.addEventListener('load', () => {
    if (hasGSAP) ScrollTrigger.refresh();
    const p = parse();
    if ((p.view === 'home' && p.target) || p.section) scrollToTarget(p, false);
  });
})();
