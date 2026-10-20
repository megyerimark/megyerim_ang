const toggle = document.querySelector('.menu-toggle');
const mobile = document.querySelector('.mobile-nav');
toggle.addEventListener('click', () => { const open = toggle.getAttribute('aria-expanded') !== 'true'; toggle.setAttribute('aria-expanded', String(open)); mobile.hidden = !open; });
mobile.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { mobile.hidden = true; toggle.setAttribute('aria-expanded', 'false'); }));
const sections = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => { entries.forEach(e => { if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
    } }); }, { threshold: .08 });
    sections.forEach(e => obs.observe(e));
}
else
    sections.forEach(e => e.classList.add('visible'));
document.querySelector('#booking-form').addEventListener('submit', e => { e.preventDefault(); e.currentTarget.querySelector('.form-status').textContent = 'Demó beküldés sikeres – nem tároltunk és nem továbbítottunk adatokat.'; e.currentTarget.reset(); });
