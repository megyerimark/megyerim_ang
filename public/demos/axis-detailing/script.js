const toggle = document.querySelector('.menu-toggle'), menu = document.querySelector('.mobile-nav');
toggle.addEventListener('click', () => { const open = toggle.getAttribute('aria-expanded') !== 'true'; toggle.setAttribute('aria-expanded', String(open)); menu.hidden = !open; });
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { menu.hidden = true; toggle.setAttribute('aria-expanded', 'false'); }));
const range = document.querySelector('#comparison-range'), after = document.querySelector('#compare-after'), line = document.querySelector('#compare-line');
function updateRange() { const v = Number(range.value); after.style.clipPath = `inset(0 ${100 - v}% 0 0)`; line.style.left = v + '%'; }
range.addEventListener('input', updateRange);
updateRange();
// A görgetés vezérli a csúszkát (a kézi húzás továbbra is működik)
document.querySelector('#elotte-utana').addEventListener('scene:frame', e => { const p = e.detail.p; range.value = String(Math.round(Math.min(1, Math.max(0, (p - .22) / .6)) * 100)); updateRange(); });
const reveal = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
    } }), { threshold: .07 });
    reveal.forEach(e => obs.observe(e));
}
else
    reveal.forEach(e => e.classList.add('visible'));
document.querySelector('#contact-form').addEventListener('submit', e => { e.preventDefault(); document.querySelector('#form-status').textContent = 'Demó: az űrlap kitöltve, adatot nem küldtünk és nem tároltunk.'; e.target.reset(); });
