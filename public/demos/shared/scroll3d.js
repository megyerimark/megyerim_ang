/*!
 * scroll3d – egyszerű, függőségmentes görgetésvezérelt jelenetmotor a demókhoz.
 * A főoldali ScrollScrubber elvét követi: a „jelenet” (data-scene) rögzített (sticky) szakaszán futó
 * 0–1 haladást simítva CSS-változóként adja át (--p), az elemeknek pedig szakaszolt, easelt --t értéket.
 *
 *  data-scene              a magas szekció; --p (0–1) kerül rá
 *  data-pin="860"          e szélesség alatt nincs rögzítés (a jelenet áthaladás közben játszik le)
 *  data-final="1"          csökkentett mozgásnál ezen a haladáson áll meg
 *  data-steps="3"          data-step="0..2" attribútum a haladásból
 *  [data-t="a,b"]          az elemre --t (0–1) kerül, ha a haladás az [a,b] sávban van
 *  [data-fan]              gyerekeire --o (előjeles eltolás), --a (abszolút) és --i érték kerül (coverflow)
 *  [data-count="98"]       szám felfutás a --t szerint (a data-t-vel együtt)
 *  [data-speed="0.2"]      parallax: --py (px) a viewport közepéhez képest
 */
(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = v => v * v * (3 - 2 * v);
  const fmt = n => String(Math.round(n));

  const scenes = [...document.querySelectorAll('[data-scene]')].map(el => {
    const fan = el.querySelector('[data-fan]');
    return {
      el, fan, fanItems: fan ? [...fan.children] : [],
      pin: Number(el.dataset.pin || 860), ease: Number(el.dataset.ease || .12),
      final: Number(el.dataset.final || 1), steps: Number(el.dataset.steps || 0),
      items: [...el.querySelectorAll('[data-t]')].map(node => {
        const [a, b] = node.dataset.t.split(',').map(Number);
        return { node, a, b, count: node.dataset.count !== undefined ? Number(node.dataset.count) : null };
      }),
      cur: 0, target: 0, on: false
    };
  });
  const speeds = [...document.querySelectorAll('[data-speed]')].map(node => ({ node, k: Number(node.dataset.speed) }));

  const progressBar = document.createElement('div');
  progressBar.className = 's3d-progress';
  progressBar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progressBar);

  function paint(s, p) {
    s.el.style.setProperty('--p', p.toFixed(4));
    if (s.steps) s.el.dataset.step = String(Math.min(s.steps - 1, Math.floor(p * s.steps * .9999)));
    for (const it of s.items) {
      const t = smooth(clamp((p - it.a) / Math.max(.0001, it.b - it.a)));
      it.node.style.setProperty('--t', t.toFixed(4));
      if (it.count !== null) it.node.textContent = fmt(it.count * t);
    }
    if (s.fanItems.length) {
      const n = s.fanItems.length, pos = p * (n - 1);
      s.fanItems.forEach((c, i) => {
        const o = i - pos;
        c.style.setProperty('--o', o.toFixed(4));
        c.style.setProperty('--a', Math.abs(o).toFixed(4));
        c.style.setProperty('--i', String(i));
        c.classList.toggle('is-active', Math.abs(o) < .5);
      });
    }
    s.el.dispatchEvent(new CustomEvent('scene:frame', { detail: { p } }));
  }

  function measureTarget(s) {
    const r = s.el.getBoundingClientRect(), vh = innerHeight;
    if (innerWidth <= s.pin) return clamp((vh * .92 - r.top) / Math.max(1, r.height * .85 + vh * .1));
    return clamp(-r.top / Math.max(1, r.height - vh));
  }

  let raf = 0;
  function frame() {
    raf = 0;
    let more = false;
    for (const s of scenes) {
      const r = s.el.getBoundingClientRect();
      const near = r.bottom > -innerHeight * .5 && r.top < innerHeight * 1.5;
      s.target = measureTarget(s);
      if (!near && Math.abs(s.cur - s.target) < .001) continue;
      s.cur += (s.target - s.cur) * s.ease;
      if (Math.abs(s.target - s.cur) < .0006) s.cur = s.target; else more = true;
      paint(s, s.cur);
    }
    const mid = innerHeight / 2;
    for (const sp of speeds) {
      const r = sp.node.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) continue;
      sp.node.style.setProperty('--py', ((r.top + r.height / 2 - mid) * sp.k * -1).toFixed(1) + 'px');
    }
    const max = Math.max(1, root.scrollHeight - innerHeight);
    root.style.setProperty('--sp', clamp(scrollY / max).toFixed(4));
    if (more) raf = requestAnimationFrame(frame);
  }
  const request = () => { if (!raf) raf = requestAnimationFrame(frame); };

  if (reduced) {
    for (const s of scenes) { s.cur = s.final; paint(s, s.final); }
    progressBar.remove();
    return;
  }
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request, { passive: true });
  if (matchMedia('(pointer:fine)').matches) {
    addEventListener('pointermove', e => {
      root.style.setProperty('--mx', (e.clientX / innerWidth * 2 - 1).toFixed(3));
      root.style.setProperty('--my', (e.clientY / innerHeight * 2 - 1).toFixed(3));
    }, { passive: true });
  }
  // induláskor azonnal a kezdőállapotot rajzoljuk (ne villanjon)
  for (const s of scenes) { s.target = measureTarget(s); s.cur = s.target; paint(s, s.cur); }
  request();
  window.scroll3d = { scenes, request };
})();
