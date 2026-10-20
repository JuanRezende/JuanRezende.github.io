/* i18n.js · Portuguese / English
   The page is written in Portuguese. In English (chosen with the PT · EN switch, or ?lang=en), this swaps every text and
   label for its entry in lang/en.js once, before main.js runs, so the word splitting, counters, tab titles and transition
   cards all start from English. Switching language saves the choice and reloads the page on the same hash (an in-place
   swap would leave stale copies in the split headings and their aria-labels).
   The language itself is decided by the <head> script (html[lang], and html.lang-pending, which keeps the page hidden
   until this has run). Loaded after effects/ and before main.js. */
(() => {
  'use strict';

  const doc = document.documentElement;
  const lang = doc.lang === 'en' ? 'en' : 'pt';
  const dict = lang === 'en' && window.I18N_EN ? window.I18N_EN : null;
  const norm = (s) => s.replace(/\s+/g, ' ').trim();
  const ATTRS = ['alt', 'aria-label', 'title', 'data-caption', 'data-title', 'data-label', 'data-suffix'];

  if (dict) {
    const T = dict.text;
    /* text nodes: keep the spaces around the original, they separate it from inline neighbours (<strong>, <em>) */
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement && n.parentElement.closest('script, style') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT)
    });
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const key = norm(n.nodeValue);
      if (!key || !(key in T)) continue;
      const lead = /^\s/.test(n.nodeValue) ? ' ' : '', trail = /\s$/.test(n.nodeValue) ? ' ' : '';
      n.nodeValue = lead + T[key] + trail;
    }
    /* attributes are taken exactly as the dictionary gives them (data-suffix " mi" → "M") */
    document.body.querySelectorAll(ATTRS.map(a => `[${a}]`).join(',')).forEach(el => {
      ATTRS.forEach(a => {
        const v = el.getAttribute(a);
        if (v == null) return;
        const key = norm(v);
        if (key && key in T) el.setAttribute(a, T[key]);
      });
    });
    if (dict.meta) {
      document.title = dict.meta.title;
      const d = document.querySelector('meta[name="description"]');
      if (d) d.setAttribute('content', dict.meta.description);
    }
  }

  /* strings main.js builds at runtime */
  window.I18N = {
    lang,
    t: (s) => (dict && dict.ui && dict.ui[s]) || s,
    locale: lang === 'en' ? 'en-US' : 'pt-BR'
  };

  /* the switch: mark the current language, and on click save the other one and reload on the same view */
  document.querySelectorAll('[data-lang]').forEach(a => {
    const on = a.dataset.lang === lang;
    a.classList.toggle('is-current', on);
    if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    a.addEventListener('click', (e) => {
      e.preventDefault();
      if (a.dataset.lang === lang) return;
      try { localStorage.setItem('jr-lang', a.dataset.lang); } catch (err) { }
      const url = new URL(location.href);
      url.searchParams.set('lang', a.dataset.lang);
      location.href = url.toString();
    });
  });

  doc.classList.remove('lang-pending');
})();
