const toggle = document.querySelector('.menu-toggle'), menu = document.querySelector('.mobile-nav');
toggle.addEventListener('click', () => { const open = toggle.getAttribute('aria-expanded') !== 'true'; toggle.setAttribute('aria-expanded', String(open)); menu.hidden = !open; });
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { menu.hidden = true; toggle.setAttribute('aria-expanded', 'false'); }));
const range = document.querySelector('#comparison-range'), after = document.querySelector('#compare-after'), line = document.querySelector('#compare-line');
function updateRange() { const v = Number(range.value); after.style.clipPath = `inset(0 ${100 - v}% 0 0)`; line.style.left = v + '%'; }
range.addEventListener('input', updateRange);
updateRange();
const plans = { essential: { name: 'Essential Detail', description: 'Az autó megjelenésének átgondolt felfrissítése.', price: '24 900 Ft', features: ['Külső kézi mosás', 'Felületek ápolása', 'Felnik tisztítása'] }, signature: { name: 'Signature Care', description: 'Komplex autóápolás, amely a belső és külső felületeket is új szintre emeli.', price: '49 900 Ft', features: ['Részletes külső detailing', 'Utastér tisztítása és ápolása', 'Prémium felületi finish'] }, ultimate: { name: 'Ultimate Shield', description: 'Átfogó prémium kezelés, külön hangsúllyal a tartósabb felületvédelemre.', price: '89 900 Ft', features: ['Külső-belső mélytisztítás', 'Fényezés-előkészítés', 'Mintakerámia védelem'] } };
const tabs = [...document.querySelectorAll('.package-tab')];
tabs.forEach(button => button.addEventListener('click', () => { tabs.forEach(t => { const active = t === button; t.classList.toggle('active', active); t.setAttribute('aria-pressed', String(active)); }); const p = plans[button.dataset.plan]; document.querySelector('#plan-name').textContent = p.name; document.querySelector('#plan-description').textContent = p.description; document.querySelector('#plan-price').textContent = p.price; document.querySelector('#plan-features').replaceChildren(...p.features.map(item => { const li = document.createElement('li'); li.textContent = item; return li; })); }));
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
