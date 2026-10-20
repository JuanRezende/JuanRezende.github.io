/* cosmos.js · the quiet depth starfield behind the whole page (canvas 2D)
   Self-contained: reads its own motion/pointer preferences and exposes one function on window.Lumen.
   Loaded before main.js (see the end of index.html). */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ══════════ COSMOS: quiet depth starfield (slow twinkle, scroll + pointer parallax) ══════════ */
  function createCosmos(canvas) {
    const c = canvas ? canvas.getContext('2d') : null;
    if (!c) return;
    const tints = ['255,255,255', '255,255,255', '255,255,255', '214,236,255', '196,248,255', '253,224,190'];
    const stars = Array.from({ length: finePointer ? 360 : 170 }, () => ({
      x: Math.random(), y: Math.random(), z: 0.15 + Math.pow(Math.random(), 2.2) * 0.85,
      ph: Math.random() * 6.283, sp: 0.3 + Math.random() * 1.1, tint: tints[(Math.random() * tints.length) | 0]
    }));
    let w = 0, h = 0, raf = 0, mx = 0, my = 0, tmx = 0, tmy = 0, lastY = window.scrollY, vel = 0;
    const resize = () => {
      const d = Math.min(window.devicePixelRatio || 1, finePointer ? 1.5 : 1);
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
  }

  window.Lumen = Object.assign(window.Lumen || {}, { createCosmos });
})();
