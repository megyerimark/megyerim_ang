const menuToggle = document.querySelector('.menu-toggle'), mobile = document.querySelector('.mobile-nav');
menuToggle.addEventListener('click', () => { const open = menuToggle.getAttribute('aria-expanded') !== 'true'; menuToggle.setAttribute('aria-expanded', String(open)); mobile.hidden = !open; });
mobile.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { mobile.hidden = true; menuToggle.setAttribute('aria-expanded', 'false'); }));
const programs = { strength: { title: 'Építs erőt, tudatosan.', desc: 'Fokozatos terhelés, stabil alapok és egy rendszer, amely követhetővé teszi a fejlődésedet.', focus: 'Erő & állóképesség', frequency: 'Heti 3 alkalom' }, shape: { title: 'Formáld a saját utad.', desc: 'A mozgás és a tudatos tervezés összhangja, az egyéni céljaidnak megfelelően.', focus: 'Állóképesség & technika', frequency: 'Heti 2–3 alkalom' }, start: { title: 'Indulj el a saját tempódban.', desc: 'Könnyen követhető, fokozatos program azoknak, akik most építik újra a mozgás rutinját.', focus: 'Mobilitás & alapok', frequency: 'Heti 2 alkalom' } };
const tabs = [...document.querySelectorAll('.program-tabs button')];
tabs.forEach(tab => tab.addEventListener('click', () => { tabs.forEach(t => { const selected = t === tab; t.classList.toggle('active', selected); t.setAttribute('aria-selected', String(selected)); t.tabIndex = selected ? 0 : -1; }); const p = programs[tab.dataset.program]; document.querySelector('#program-title').textContent = p.title; document.querySelector('#program-desc').textContent = p.desc; document.querySelector('#program-focus').textContent = p.focus; document.querySelector('#program-frequency').textContent = p.frequency; document.querySelector('#program-panel').setAttribute('aria-labelledby', tab.id); }));
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
