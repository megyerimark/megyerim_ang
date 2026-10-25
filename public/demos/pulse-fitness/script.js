const menuToggle = document.querySelector('.menu-toggle'), mobile = document.querySelector('.mobile-nav');
menuToggle.addEventListener('click', () => { const open = menuToggle.getAttribute('aria-expanded') !== 'true'; menuToggle.setAttribute('aria-expanded', String(open)); mobile.hidden = !open; });
mobile.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { mobile.hidden = true; menuToggle.setAttribute('aria-expanded', 'false'); }));
const tabs = [...document.querySelectorAll('.program-tabs button')];
const progScene = document.querySelector('#programok');
// A görgetés váltja az aktív fület; a fülre kattintva a hozzá tartozó pozícióra görgetünk
progScene.addEventListener('scene:frame', e => { const i = Math.min(tabs.length - 1, Math.round(e.detail.p * (tabs.length - 1))); tabs.forEach((t, k) => { const on = k === i; t.classList.toggle('active', on); t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; }); });
tabs.forEach((tab, i) => tab.addEventListener('click', () => { const top = progScene.getBoundingClientRect().top + scrollY; const d = Math.max(1, progScene.offsetHeight - innerHeight); const target = innerWidth > 860 ? top + d * (i / (tabs.length - 1)) : top + progScene.offsetHeight * (.12 + i * .3); window.scrollTo({ top: target, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }));
document.querySelector('.program-tabs').addEventListener('keydown', e => { if (!['ArrowLeft', 'ArrowRight'].includes(e.key))
    return; e.preventDefault(); const i = tabs.indexOf(document.activeElement); const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length]; next.focus(); next.click(); });
const reveal = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
    } }), { threshold: .08 });
    reveal.forEach(e => obs.observe(e));
}
else
    reveal.forEach(e => e.classList.add('visible'));
document.querySelector('#demo-form').addEventListener('submit', e => { e.preventDefault(); document.querySelector('#form-message').textContent = 'Demójelentkezés kész — az adatokat nem továbbítottuk és nem mentettük.'; e.target.reset(); });
