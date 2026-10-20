/* cosmos.js · the quiet depth starfield behind the whole page (canvas 2D)
   Self-contained: reads its own motion/pointer preferences and exposes one function on window.Lumen.
   Loaded before main.js (see the end of index.html). */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  /* lite mode (html.fx-lite, see the <head> script): fewer stars, drawn at 1x */
  const isLite = () => document.documentElement.classList.contains('fx-lite');

  /* ══════════ COSMOS: quiet depth starfield (slow twinkle, scroll + pointer parallax) ══════════ */
  function createCosmos(canvas) {
    const c = canvas ? canvas.getContext('2d') : null;
    if (!c) return;
    const tints = ['255,255,255', '255,255,255', '255,255,255', '214,236,255', '196,248,255', '253,224,190'];
    const stars = Array.from({ length: isLite() ? 140 : finePointer ? 360 : 170 }, () => ({
      x: Math.random(), y: Math.random(), z: 0.15 + Math.pow(Math.random(), 2.2) * 0.85,
      ph: Math.random() * 6.283, sp: 0.3 + Math.random() * 1.1, tint: tints[(Math.random() * tints.length) | 0]
    }));
    let w = 0, h = 0, raf = 0, mx = 0, my = 0, tmx = 0, tmy = 0, lastY = window.scrollY, vel = 0;
    const resize = () => {
      const d = isLite() ? 1 : Math.min(window.devicePixelRatio || 1, finePointer ? 1.5 : 1);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = Math.round(w * d); canvas.height = Math.round(h * d);
      c.setTransform(d, 0, 0, d, 0, 0);
    };
    if (finePointer && !reduceMotion) {
      window.addEventListener('pointermove', (e) => { tmx = e.clientX / w - 0.5; tmy = e.clientY / h - 0.5; }, { passive: true });
    }
    const draw = (now) => {
      const y = window.scrollY;
      vel += ((y - lastY) - vel) * 0.25; lastY = y;
      const trail = reduceMotion ? 0 : Math.min(Math.abs(vel) * 0.35, 30) * (vel > 0 ? 1 : -1);
      mx += (tmx - mx) * 0.04; my += (tmy - my) * 0.04;
      c.clearRect(0, 0, w, h);
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const px = (((s.x * w - mx * 30 * s.z) % w) + w) % w;
        const py = (((s.y * h - y * s.z * 0.12 - my * 22 * s.z) % h) + h) % h;
        const tw = reduceMotion ? 0.85 : 0.6 + 0.4 * Math.sin(now * 0.001 * s.sp + s.ph);
        const size = 0.5 + s.z * 1.2;
        const col = `rgba(${s.tint},${(0.12 + 0.68 * s.z) * tw})`;
        if (Math.abs(trail) > 1.5) {
          c.strokeStyle = col; c.lineWidth = size;
          c.beginPath(); c.moveTo(px, py); c.lineTo(px, py + trail * s.z); c.stroke();
        } else {
          c.fillStyle = col;
          c.fillRect(px, py, size, size);
        }
      }
    };
    const loop = (now) => { raf = 0; draw(now); if (!document.hidden) raf = requestAnimationFrame(loop); };
    resize();
    window.addEventListener('resize', () => { resize(); if (reduceMotion) draw(performance.now()); });
    if (reduceMotion) draw(performance.now());
    else {
      raf = requestAnimationFrame(loop);
      document.addEventListener('visibilitychange', () => { if (!document.hidden && !raf) raf = requestAnimationFrame(loop); });
    }
    /* the page went lite mid-visit (FX WATCHDOG in main.js) */
    return { lite() { if (stars.length > 140) stars.length = 140; resize(); } };
  }

  /* ══════════ WARP: the jump between views (stars rush out of the centre, then settle) ══════════
     Returns { state, start, stop }. The caller tweens state.speed (0 = still, 1 = full warp);
     the loop only runs between start() and stop(). */
  function createWarp(canvas) {
    const c = canvas ? canvas.getContext('2d') : null;
    if (!c) return null;
    const tints = ['255,255,255', '255,255,255', '214,236,255', '186,230,253', '103,232,249', '253,224,190'];
    const DEPTH = 1000, FOCAL = 260;
    let N = 0;
    const state = { speed: 0 };
    let w = 0, h = 0, raf = 0, last = 0, stars = [];
    const seed = (s, far) => {
      s.x = (Math.random() - 0.5) * 1600; s.y = (Math.random() - 0.5) * 1000;
      s.z = far ? DEPTH * (0.55 + Math.random() * 0.45) : 40 + Math.random() * DEPTH; s.pz = s.z;
      s.tint = tints[(Math.random() * tints.length) | 0];
      return s;
    };
    const resize = () => {
      const d = isLite() ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = Math.round(w * d); canvas.height = Math.round(h * d);
      c.setTransform(d, 0, 0, d, 0, 0);
    };
    const frame = (now) => {
      const dt = Math.min(33, now - (last || now)); last = now;
      const v = state.speed, cx = w / 2, cy = h / 2, k = FOCAL * Math.max(w, h) / 900;
      c.clearRect(0, 0, w, h);
      // a faint blue bloom at the vanishing point while at speed
      if (v > 0.05) {
        const g = c.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.45);
        g.addColorStop(0, `rgba(56,189,248,${0.16 * v})`); g.addColorStop(1, 'rgba(56,189,248,0)');
        c.fillStyle = g; c.fillRect(0, 0, w, h);
      }
      c.lineCap = 'round';
      for (const s of stars) {
        s.pz = s.z;
        s.z -= (0.25 + v * 7) * dt;                        // drift when still, rush at full speed
        if (s.z < 1) { seed(s, true); continue; }
        const x = cx + (s.x / s.z) * k, y = cy + (s.y / s.z) * k;
        const tail = Math.min(DEPTH, s.z + 14 + v * 340);  // streak length grows with speed
        const px = cx + (s.x / tail) * k, py = cy + (s.y / tail) * k;
        if (x < -50 || x > w + 50 || y < -50 || y > h + 50) { seed(s, true); continue; }
        const near = 1 - s.z / DEPTH;
        c.strokeStyle = `rgba(${s.tint},${Math.min(1, 0.15 + near * 0.95)})`;
        c.lineWidth = 0.4 + near * 1.8;
        c.beginPath(); c.moveTo(px, py); c.lineTo(x, y); c.stroke();
      }
      raf = requestAnimationFrame(frame);
    };
    window.addEventListener('resize', () => { if (raf) resize(); });
    return {
      state,
      start() {
        if (raf) return;
        resize(); last = 0;
        N = isLite() ? 160 : finePointer ? 420 : 220;
        stars = Array.from({ length: N }, () => seed({}, false));
        raf = requestAnimationFrame(frame);
      },
      stop() { cancelAnimationFrame(raf); raf = 0; state.speed = 0; c.clearRect(0, 0, w, h); }
    };
  }

  window.Lumen = Object.assign(window.Lumen || {}, { createCosmos, createWarp });
})();
