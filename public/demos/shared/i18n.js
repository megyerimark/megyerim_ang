/*!
 * demo-i18n – a demók kétnyelvűsége (HU/EN), függőség nélkül.
 * A főoldallal közös nyelvbeállítás (localStorage „mm-lang”), felülírható a linkben: ?lang=en / ?lang=hu.
 * Alapértelmezés: magyar. Angol nézetben a megjelenített szöveget fordítjuk szótár alapján (window.DEMO_EN):
 *  text      – pontos egyezés: magyar szöveg (normalizált szóközökkel) → angol; szövegcsomópontokra és a
 *              placeholder / title / aria-label / alt attribútumokra
 *  patterns  – minták a szkriptek által előállított szövegekhez ({0}, {1}… = változó rész; a változó részt is
 *              lefordítjuk, ha szerepel a text szótárban)
 *  meta      – { title, description }
 * A később (szkriptből) beírt szövegeket MutationObserver fordítja. Hiányzó fordításnál a magyar szöveg marad.
 * Ugyanebből a fájlból jön a felső demósáv HU/EN váltója is. A demók szkriptjei a window.demoLang értékét olvassák.
 */
(() => {
  const KEY = 'mm-lang';
  const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA']);
  const norm = s => s.replace(/\s+/g, ' ').trim();

  function initial() {
    try {
      const param = new URLSearchParams(location.search).get('lang');
      if (param === 'en' || param === 'hu') { localStorage.setItem(KEY, param); return param; }
      const stored = localStorage.getItem(KEY);
      if (stored === 'en' || stored === 'hu') return stored;
    } catch { /* privát mód: marad az alapértelmezés */ }
    return 'hu';
  }
  const lang = initial();
  window.demoLang = lang;

  function addToggle() {
    // a demók felső sávja, vagy (a gyűjtőoldalon) egy kijelölt hely
    const ribbon = document.querySelector('.demo-ribbon, [data-demo-lang]');
    if (!ribbon) return;
    const css = document.createElement('style');
    css.textContent = '.demo-lang{display:inline-flex;gap:2px;margin-left:12px;vertical-align:middle}'
      + '.demo-lang a{padding:1px 7px;border:1px solid currentColor;border-radius:99px;color:inherit;font:inherit;text-decoration:none;opacity:.55}'
      + '.demo-lang a[aria-current]{opacity:1}';
    document.head.appendChild(css);
    const box = document.createElement('span');
    box.className = 'demo-lang';
    box.setAttribute('translate', 'no');
    for (const code of ['hu', 'en']) {
      const a = document.createElement('a');
      const url = new URL(location.href); url.searchParams.set('lang', code);
      a.href = url.pathname + url.search + url.hash;
      a.textContent = code.toUpperCase();
      a.lang = code;
      a.setAttribute('aria-label', code === 'hu' ? 'Magyar nyelvű változat' : 'English version');
      if (code === lang) a.setAttribute('aria-current', 'true');
      box.appendChild(a);
    }
    ribbon.appendChild(box);
  }

  const dict = window.DEMO_EN || { text: {}, patterns: {}, meta: {} };
  const patterns = Object.entries(dict.patterns || {})
    .sort((a, b) => b[0].replace(/\{\d+\}/g, '').length - a[0].replace(/\{\d+\}/g, '').length)
    .map(([hu, en]) => ({
      re: new RegExp('^' + hu.split(/\{\d+\}/).map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('(.*?)') + '$', 's'),
      en,
    }));

  function translate(text) {
    const key = norm(text);
    if (!key) return null;
    if (dict.text[key]) return dict.text[key];
    for (const p of patterns) {
      const m = p.re.exec(key);
      if (m) return p.en.replace(/\{(\d+)\}/g, (_, i) => { const part = m[Number(i) + 1] ?? ''; return dict.text[norm(part)] ?? part; });
    }
    return null;
  }

  const written = new WeakMap();
  function skipped(el) {
    for (let e = el; e; e = e.parentElement) if (SKIP.has(e.tagName) || e.getAttribute('translate') === 'no') return true;
    return false;
  }
  function translateNode(node) {
    if (written.get(node) === node.data || skipped(node.parentElement)) return;
    const en = translate(node.data);
    if (en === null) return;
    const lead = node.data.match(/^\s*/)[0], trail = node.data.match(/\s*$/)[0];
    node.data = lead + en + trail;
    written.set(node, node.data);
  }
  function translateAttrs(el) {
    // a textarea tartalmát (a látogató szövegét) nem fordítjuk, a placeholderét igen
    if (skipped(el.tagName === 'TEXTAREA' ? el.parentElement : el)) return;
    for (const name of ATTRS) {
      const value = el.getAttribute(name);
      if (!value) continue;
      const en = translate(value);
      if (en !== null && en !== value) el.setAttribute(name, en);
    }
  }
  function walk(root) {
    if (root.nodeType === Node.TEXT_NODE) { translateNode(root); return; }
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    translateAttrs(root);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (n.nodeType === Node.TEXT_NODE) translateNode(n); else translateAttrs(n);
    }
  }

  function start() {
    addToggle();
    if (lang !== 'en') return;
    document.documentElement.lang = 'en';
    if (dict.meta?.title) document.title = dict.meta.title;
    if (dict.meta?.description) document.querySelector('meta[name="description"]')?.setAttribute('content', dict.meta.description);
    walk(document.body);
    new MutationObserver(records => {
      for (const r of records) {
        if (r.type === 'childList') r.addedNodes.forEach(walk);
        else if (r.type === 'characterData') translateNode(r.target);
        else if (r.type === 'attributes') translateAttrs(r.target);
      }
    }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
