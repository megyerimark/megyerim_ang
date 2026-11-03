// Autószerviz demó: menü, visszafogott görgetési effektek (lassú mélység a nyitóképen és a képeken,
// finom beúszás), demó időpontkérő. Csökkentett mozgásnál semmi nem mozog, minden azonnal látszik.
(() => {
  document.documentElement.classList.remove('no-js');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // mobilmenü
  const toggle = document.querySelector('.menu-toggle'), menu = document.querySelector('.mobile-nav');
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
  });
  menu?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { menu.hidden = true; toggle.setAttribute('aria-expanded', 'false'); }));

  // fejléc háttér görgetés után
  const topbar = document.querySelector('.topbar');
  const hero = document.querySelector('.hero');
  const parallax = [...document.querySelectorAll('[data-parallax]')];
  const fab = document.querySelector('.call-fab');
  let ticking = false;
  function frame() {
    ticking = false;
    const y = scrollY, vh = innerHeight;
    topbar.classList.toggle('scrolled', y > 30);
    fab?.classList.toggle('show', y > vh * 0.75);
    if (reduced) return;
    // nyitókép: a háttér lassabban mozog, a szöveg enyhén halványul
    if (hero && y < vh * 1.2) {
      const p = Math.min(1, y / vh);
      hero.style.setProperty('--hy', (y * 0.28).toFixed(1) + 'px');
      hero.style.setProperty('--hs', (1.04 + p * 0.04).toFixed(3));
      hero.style.setProperty('--hc', (y * 0.12).toFixed(1) + 'px');
      hero.style.setProperty('--ho', (1 - p * 0.9).toFixed(3));
    }
    // képek: kis mélységhatás a képernyő közepéhez képest
    for (const el of parallax) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) continue;
      const k = Number(el.dataset.parallax) || 0.08;
      el.style.setProperty('--py', ((r.top + r.height / 2 - vh / 2) * -k).toFixed(1) + 'px');
    }
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  addEventListener('resize', frame, { passive: true });
  frame();

  // finom beúszás
  const items = document.querySelectorAll('.reveal');
  if (!reduced && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(el => io.observe(el));
  } else items.forEach(el => el.classList.add('visible'));

  // időpontkérés: a dátum legkorábban holnap
  const date = document.querySelector('#booking-date');
  if (date) { const t = new Date(Date.now() + 864e5); date.min = t.toISOString().slice(0, 10); }
  document.querySelector('#booking-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const status = document.querySelector('#form-status');
    status.textContent = window.demoLang === 'en'
      ? 'Demo: on the live site this request is emailed to the workshop. Nothing was sent or stored.'
      : 'Bemutató: az éles oldalon a kérés e-mailben érkezik a szervizhez. Most adatot nem küldtünk és nem tároltunk.';
    e.target.reset();
  });
})();
