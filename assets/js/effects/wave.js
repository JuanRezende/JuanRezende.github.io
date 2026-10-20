/* wave.js · the Aura-style LED wave (WebGL): the hero ring and the contact horizon
   Self-contained: reads its own motion/pointer preferences and exposes one function on window.Lumen.
   Loaded before main.js (see the end of index.html). */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ══════════ AURA WAVE (WebGL): a dithered LED field. A noise-warped ring of light grows out of the core and
     a beam runs along the lit frame (hero); a dithered horizon rises at the end (contact). Own shader after Aura's
     scene: the field is computed per cell into a small target, then stamped on screen as squares that grow with
     the light, over a faint grid and a soft underglow. Every motion derives from the clock, never from a frame step. ══════════ */
  function waveField(canvas, mode) {
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, powerPreference: 'low-power' });
    if (!gl) return null;
    const HEAD = '#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n';
    const sh = (type, src) => { const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return o; };
    const prog = (v, f) => { const o = gl.createProgram(); gl.attachShader(o, sh(gl.VERTEX_SHADER, v)); gl.attachShader(o, sh(gl.FRAGMENT_SHADER, f)); gl.linkProgram(o); return gl.getProgramParameter(o, gl.LINK_STATUS) ? o : null; };
    const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    /* pass 1 · the light per cell: r = brightness, g = wide glow, b = warmth (dawn, horizon only) */
    const field = prog(VERT, HEAD +
      'uniform vec2 uGrid;uniform float uT,uGrow,uFrame,uMode;uniform vec2 uR;uniform vec3 uMouse;' +
      'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}' +
      'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}' +
      'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}' +
      'void main(){' +
      'vec2 uv=gl_FragCoord.xy/uGrid;float asp=uGrid.x/uGrid.y;vec2 p=(uv-.5)*vec2(asp,1.);' +
      /* a slow upward drift warps everything (Aura's noise layer) */
      'vec2 q=p*1.6+vec2(0.,-uT*.04);' +
      'vec2 w=vec2(fbm(q+vec2(1.7,9.2)+uT*.06),fbm(q+vec2(8.3,2.8)-uT*.05))-.5;' +
      /* the cursor: the field swells toward it and lights the grid under it */
      'vec2 m=(uMouse.xy-.5)*vec2(asp,1.);vec2 dm=p-m;float md=dot(dm,dm);float pull=exp(-md*9.)*uMouse.z;' +
      'float L=0.,G=0.,W=0.;' +
      'if(uMode<.5){' +
        'float g=uGrow;vec2 R=uR*mix(.05,1.,g);' +
        'vec2 pw=p+w*(.08+.17*g)-dm*.2*pull;' +
        'float d=(length(pw/R)-1.)*min(R.x,R.y);' +
        'float th=.05+.05*fbm(pw*3.1+vec2(uT*.07,-uT*.05));' +
        'float band=exp(-(d*d)/(th*th));' +
        'float a=atan(pw.y,pw.x);' +
        'float beam=.62+.38*pow(.5+.5*sin(a*2.-uT*.5+fbm(pw*2.2-uT*.08)*5.),2.);' +
        'float halo=exp(-abs(d)/.07);float wide=exp(-abs(d)/.2);' +
        'float born=smoothstep(0.,.18,g);' +
        'L=(band*beam*.92+halo*.05)*born;G=(band*.55+wide*.18)*born*beam;' +
        /* the spark the ring is born from */
        'float sp=exp(-dot(p,p)/.0006)*(1.-g)*step(.001,g)*1.3;L+=sp;G+=sp*.2;' +
        /* lit frame: bright edges, strongest on top, a beam running around the perimeter */
        'float e=min(min(uv.x,1.-uv.x)*asp,min(uv.y,1.-uv.y));' +
        'float run=pow(.5+.5*sin(atan(p.y,p.x)-uT*.42),5.);' +
        'float fr=(exp(-e/.008)*.85+exp(-e/.03)*.1)*(.45+.55*smoothstep(.15,1.,uv.y))*(.5+.8*run+.3*fbm(uv*vec2(36.,7.)+uT*.25))*smoothstep(.02,.22,uv.y);' +
        'L+=fr*uFrame;G+=fr*.35*uFrame;' +
      '}else{' +
        /* horizon: a breathing limb of light, its centre warming toward dawn */
        'float y0=-.14+.05*(fbm(vec2(p.x*1.3+uT*.04,uT*.03))-.5)+w.y*.05;' +
        'float d=p.y-y0;float sun=exp(-(p.x*p.x)/.09);' +
        'float line=exp(-(d*d)/.0005);' +
        'float air=exp(-max(d,0.)/.11)*step(0.,d);' +
        'float ground=smoothstep(0.,-.5,d)*.07*(.6+.4*fbm(p*6.+uT*.05));' +
        'L=line*(.55+.8*sun)+air*(.12+.5*sun)*(.6+.4*fbm(p*4.+vec2(0.,-uT*.06)))+ground;' +
        'G=line*.5+air*.45*(.3+sun);W=sun*smoothstep(.05,.5,line+air*.6);' +
      '}' +
      'L+=exp(-md*30.)*uMouse.z*.16;' +
      'L=clamp(L,0.,1.);G=1.-exp(-G*1.4);' +
      'gl_FragColor=vec4(L,G,W,1.);}');
    /* pass 2 · stamp: one square per cell, sized by the cell's light in a few steps; a dim grid where it is dark */
    const stamp = prog(VERT, HEAD +
      'uniform sampler2D uF;uniform vec2 uGrid;uniform float uCell;' +
      'void main(){' +
      'vec2 fc=gl_FragCoord.xy;vec2 cell=floor(fc/uCell);vec2 lc=fract(fc/uCell)-.5;' +
      'vec3 f=texture2D(uF,(cell+.5)/uGrid).rgb;float v=f.r;' +
      'float glow=texture2D(uF,fc/(uGrid*uCell)).g;' +
      'float lv=floor(v*7.+.5)/7.;' +
      'float s=max(.18,lv*.86);' +
      'float inside=step(max(abs(lc.x),abs(lc.y)),s*.5);' +
      'vec3 c=mix(vec3(.04,.15,.3),vec3(.1,.48,.86),smoothstep(.02,.35,v));c=mix(c,vec3(.15,.68,.96),smoothstep(.3,.6,v));' +
      'c=mix(c,vec3(.36,.88,.99),smoothstep(.6,.88,v));' +
      'c=mix(c,vec3(.88,.98,1.),smoothstep(.9,1.,v));' +
      'c=mix(c,vec3(.99,.76,.5),f.b*.85);' +
      'float a=inside*(.16+.84*smoothstep(.02,.6,v));' +
      'float ga=glow*glow*.32;vec3 gc=mix(vec3(.05,.42,.86),vec3(.99,.62,.3),f.b*.6);' +
      'gl_FragColor=vec4(c*a+gc*ga*(1.-a),a+ga*(1.-a));}');
    if (!field || !stamp) return null;

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = (p, n) => gl.getUniformLocation(p, n);
    const U = { grid: loc(field, 'uGrid'), t: loc(field, 'uT'), grow: loc(field, 'uGrow'), frame: loc(field, 'uFrame'), mode: loc(field, 'uMode'), r: loc(field, 'uR'), mouse: loc(field, 'uMouse') };
    const S = { f: loc(stamp, 'uF'), grid: loc(stamp, 'uGrid'), cell: loc(stamp, 'uCell') };
    const tex = gl.createTexture(), fbo = gl.createFramebuffer();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]].forEach(([k, v]) => gl.texParameteri(gl.TEXTURE_2D, k, v));

    let W = 0, H = 0, gw = 0, gh = 0, cell = 5, aspect = 1;
    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return false;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cell = Math.max(2, Math.round((w < 640 ? 4 : 5) * dpr));
      const nw = Math.round(w * dpr), nh = Math.round(h * dpr);
      if (nw === W && nh === H) return true;
      W = canvas.width = nw; H = canvas.height = nh; aspect = w / h;
      gw = Math.ceil(W / cell); gh = Math.ceil(H / cell);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gw, gh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return true;
    };

    /* growth: ring and frame come up when ignited (eased in place; reduced motion gets the grown frame) */
    let g0 = mode === 1 ? -1e9 : null;
    const easeQuart = (x) => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2);
    const growth = (now) => (reduceMotion || g0 === -1e9 ? 1 : g0 === null ? 0 : easeQuart(Math.min(1, (now - g0) / 3400)));
    const frameIn = (now) => (reduceMotion || g0 === -1e9 ? 1 : g0 === null ? 0 : 1 - Math.pow(1 - Math.min(1, (now - g0) / 2200), 3));

    /* the cursor, eased toward its target by time (not by frame count) */
    let mx = 0.5, my = 0.5, mz = 0, tmx = 0.5, tmy = 0.5, tmz = 0, last = performance.now();
    if (finePointer && !reduceMotion) {
      window.addEventListener('pointermove', (e) => {
        const b = canvas.getBoundingClientRect();
        if (!b.width) return;
        tmx = (e.clientX - b.left) / b.width; tmy = 1 - (e.clientY - b.top) / b.height;
        tmz = tmx > -0.05 && tmx < 1.05 && tmy > -0.05 && tmy < 1.05 ? 1 : 0;
        start();
      }, { passive: true });
      document.documentElement.addEventListener('pointerleave', () => { tmz = 0; });
    }

    const t0 = performance.now();
    let visible = false, raf = 0;
    const draw = (now) => {
      raf = 0;
      if (!resize()) return;
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      const k = 1 - Math.exp(-dt * 5);
      mx += (tmx - mx) * k; my += (tmy - my) * k; mz += (tmz - mz) * k;
      const t = reduceMotion ? 14 : ((now - t0) / 1000) % 2000;
      const ring = aspect < 1 ? [aspect * 0.5, 0.4] : [Math.min(aspect * 0.4, 0.78), 0.44];
      gl.disable(gl.BLEND);
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      /* pass 1 → cell target */
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, gw, gh);
      gl.useProgram(field);
      let lp = gl.getAttribLocation(field, 'p');
      gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(U.grid, gw, gh); gl.uniform1f(U.t, t); gl.uniform1f(U.grow, growth(now)); gl.uniform1f(U.frame, frameIn(now));
      gl.uniform1f(U.mode, mode); gl.uniform2f(U.r, ring[0], ring[1]); gl.uniform3f(U.mouse, mx, my, mz);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      /* pass 2 → screen */
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, W, H);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(stamp);
      lp = gl.getAttribLocation(stamp, 'p');
      gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(S.f, 0); gl.uniform2f(S.grid, gw, gh); gl.uniform1f(S.cell, cell);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (visible && !document.hidden && !reduceMotion) raf = requestAnimationFrame(draw);
    };
    const start = () => { if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(draw); } };
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) start(); }).observe(canvas);
    document.addEventListener('visibilitychange', () => start());
    /* a hidden view gives the canvas no size; it is measured again (and redrawn once) when it comes back */
    if ('ResizeObserver' in window) new ResizeObserver(() => { if (canvas.clientWidth) { W = 0; if (!raf) raf = requestAnimationFrame(draw); } }).observe(canvas);
    else window.addEventListener('resize', () => { W = 0; start(); });

    return {
      ignite() { if (g0 === null) { g0 = performance.now(); start(); } },
      grown() { return growth(performance.now()); }
    };
  }

  window.Lumen = Object.assign(window.Lumen || {}, { waveField });
})();
