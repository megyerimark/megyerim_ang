// Autószerviz demó – egy sablonból két változat:
//   public/demos/pada-trade/index.html   – ügyfélnek szóló tervezet (valós adatokkal, nem listázott, noindex)
//   public/demos/autoszerviz/index.html  – portfólió-demó fiktív névvel és adatokkal
// Futtatás módosítás után:  node scripts/demo-autoszerviz.mjs
// A közös stílus, szkript, szótár és képek: public/demos/autoszerviz/ (style.css, script.js, en.js, img/)
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const VARIANTS = {
    'pada-trade': {
        robots: 'noindex, nofollow',
        ribbon: 'TERVEZET — A PADA TRADE KFT. ÚJ WEBOLDALÁNAK BEMUTATÓ VÁLTOZATA',
        title: 'Pada Trade Kft. – Autószerviz, autóvillamosság, autóklíma | Budapest XVIII.',
        description: 'Autószerviz, autóvillamosság és autóklíma Budapest XVIII. kerületében: diagnosztika, indítómotor- és generátorjavítás, klímatöltés, vizsgaügyintézés.',
        logoText: 'PADA TRADE KFT.', brand: 'PADA TRADE', brandSub: 'Autószerviz · Autóvillamosság', legal: 'Pada Trade Kft.',
        district: 'Budapest XVIII. kerületében',
        motto: 'Minden, ami autó', slogan: 'Trabanttól a kamionig',
        address: '1188 Budapest, Kölcsey u. 40/a.', addressNote: 'Arany J. u. – Törvény u. között',
        phone: '+36 30 961 6336', phoneTel: '+36309616336', phone2: '06-1-294-65-05', phone2Tel: '+3612946505',
        email: 'pada.trade@gmail.com', email2: 'duzsati@gmail.com',
        maps: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('1188 Budapest, Kölcsey utca 40/a'),
        about: [
            'Ha autójának elektronikai problémája van, vagy kiegészítőket szeretne beszereltetni, jó helyen jár. Nagy munkatapasztalattal és sok éves múlttal állunk rendelkezésére a gépjármű-elektronika számos területén.',
            'Egyéni igény esetén, vagy ha további információra van szüksége, forduljon hozzánk bizalommal – telefonon, e-mailben vagy az időpontkérő űrlapon.',
        ],
        aboutImg: { src: 'shop-800.webp', alt: 'A Pada Trade autóvillamossági műhely bejárata', caption: 'Műhelyünk: 1188 Budapest, Kölcsey u. 40/a.' },
        reviews: [
            'Minden problémát megold, szinte nincs lehetetlen feladat a számára. Nagyon korrekt, ajánlom.',
            'Nagyon korrekt szakember. Minőségi munka kerül ki a keze alól, legyen az bármi. Csak ajánlani tudom!',
            'Mindenkinek ajánlani tudom, aki rugalmas időbeosztású és korrekt áron dolgozó autójavítót keres.',
        ],
        area: ['XVIII. kerület', 'X. kerület', 'XIX. kerület', 'XX. kerület', 'XXIII. kerület', 'Vecsés', 'Gyál'],
    },
    autoszerviz: {
        robots: 'noindex, follow',
        ribbon: 'PORTFÓLIÓ DEMÓ — FIKTÍV AUTÓSZERVIZ',
        title: 'VOLT Autószerviz – Autószerviz, autóvillamosság, autóklíma | Demó',
        description: 'VOLT Autószerviz – fiktív autószerviz demóweboldal: szolgáltatások, időpontkérés, vélemények, elérhetőség.',
        logoText: 'VOLT AUTÓSZERVIZ', brand: 'VOLT', brandSub: 'Autószerviz · Autóvillamosság', legal: 'VOLT Autószerviz (fiktív)',
        district: 'Budapesten',
        motto: 'Gyors hibakeresés, korrekt ár', slogan: 'Kisautótól a kisteherautóig',
        address: '1234 Budapest, Minta utca 12.', addressNote: 'fiktív cím',
        phone: '+36 30 000 0000', phoneTel: '+36300000000', phone2: '+36 1 000 0000', phone2Tel: '+3610000000',
        email: 'info@volt-szerviz.example', email2: null,
        maps: 'https://www.google.com/maps/search/?api=1&query=Budapest',
        about: [
            'Autószerelés, autóvillamosság és autóklíma egy helyen: a hibát diagnosztikával keressük meg, a javítás előtt egyeztetjük az árat, és csak azt cseréljük, amit tényleg kell.',
            'Személyautókkal és kisteherautókkal is foglalkozunk; flottáknak kiszállással és kedvezménnyel.',
        ],
        aboutImg: { src: 'tech-1200.webp', alt: 'Szerelő diagnosztikai tablettel egy autó mellett', caption: 'Diagnosztika a javítás előtt – fiktív szerviz' },
        reviews: [
            'Gyorsan megtalálták a hibát, és előre megmondták, mennyibe fog kerülni. Pontosan annyi is lett.',
            'Klímatöltésre vittem, fél nap alatt kész lett. Rugalmasak és korrektek.',
            'A generátorom felújítása olcsóbb volt, mint egy új, és azóta is hibátlan.',
        ],
        area: ['Budapest', 'Pest megye', 'Flották kiszállással'],
    },
};

const I = {
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>',
    wrench: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8 6.2 21l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.8-.8-.8-2.8z"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
    snow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 2v20M4 6l16 12M20 6 4 18M9 4l3 2 3-2M9 20l3-2 3 2"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3 5 6v6c0 4.5 3 7.7 7 9 4-1.3 7-4.5 7-9V6z"/><path d="m9 12 2 2 4-4"/></svg>',
    truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7z"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg>',
    chip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>',
    logo: '<svg class="logo-car" viewBox="0 0 200 44" fill="none" aria-hidden="true"><defs><linearGradient id="logo-g" x1="0" x2="1"><stop offset="0" stop-color="#2f6bff"/><stop offset=".55" stop-color="#5a96ff"/><stop offset="1" stop-color="#2f6bff"/></linearGradient></defs><path d="M14 40C8 40 6 35 12 31c12-6 32-9 52-10 16-9 34-16 56-16s38 6 50 14c12 2 22 5 26 10 2 3 1 6-2 7" stroke="url(#logo-g)" stroke-width="3" stroke-linecap="round"/><path d="M78 19c14-7 28-10 43-10s27 4 35 10z" stroke="url(#logo-g)" stroke-width="1.6" stroke-linejoin="round" opacity=".85"/><path d="M104 10l-2 9" stroke="url(#logo-g)" stroke-width="1.6" opacity=".85"/></svg>',
    car: '<svg viewBox="0 0 48 22" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M2 17h4m30 0h10V13c0-2-1.5-3-3.5-3.4L36 8 28 3H14L7 8.5 3 10v7"/><circle cx="11" cy="17" r="3"/><circle cx="33" cy="17" r="3"/><path d="M14 17h16"/></svg>',
};

const SERVICES = [
    { icon: 'bolt', img: 'diag', alt: 'Autóelektronikai diagnosztika tablettel', title: 'Autóvillamosság', text: 'Elektronikai hibák feltárása és javítása, kiegészítők szakszerű beszerelése.',
      items: ['Gépjármű-villamossági javítások', 'Indítómotorok, generátorok javítása, felújítása', 'Centrálzár beszerelés', 'Riasztó beszerelés', 'Tolatóradar beszerelés', 'Ablaktörlő, hűtő és ventilátorok javítása'] },
    { icon: 'wrench', img: 'engine', alt: 'Szerelő munka közben egy autó motorterében', title: 'Autószerviz', text: 'Javítás és karbantartás A-tól Z-ig, a műszaki vizsgáig.',
      items: ['Autószerelés', 'Jármű-diagnosztika', 'Akkumulátor', 'Vizsgaügyintézés', 'Autógáz beszerelés, javítás'] },
    { icon: 'snow', img: 'halo', alt: 'Kéken világító fényszóró sötétben', title: 'Autóklíma', text: 'Hűvös utastér nyáron, páramentes szélvédő télen.',
      items: ['Autóklíma szerelés, javítás', 'Autóklíma töltés automata géppel', 'Vegyszermentes fertőtlenítés'],
      note: 'Több autó klímájának javítását kiszállással, flottakedvezménnyel vállaljuk.' },
];

function page(slug, d) {
    const services = SERVICES.map((s, i) => `
        <article class="service reveal" style="--d:${(i * 0.08).toFixed(2)}s">
          <div class="service-img">
            <div class="service-photo" data-parallax="0.06"><img src="../autoszerviz/img/${s.img}-640.webp" srcset="../autoszerviz/img/${s.img}-640.webp 640w, ../autoszerviz/img/${s.img}-1200.webp 1200w" sizes="(max-width: 760px) 92vw, 33vw" alt="${esc(s.alt)}" width="640" height="427" loading="lazy" decoding="async"></div>
            <span class="service-icon">${I[s.icon]}</span>
          </div>
          <div class="service-body">
            <h3>${esc(s.title)}</h3>
            <p>${esc(s.text)}</p>
            <ul>${s.items.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
            ${s.note ? `<p class="note">${esc(s.note)}</p>` : ''}
          </div>
        </article>`).join('');
    const reviews = d.reviews.map((r, i) => `
        <figure class="review reveal" style="--d:${(i * 0.08).toFixed(2)}s">
          <div class="stars" aria-label="5 csillag">★★★★★</div>
          <blockquote>„${esc(r)}”</blockquote>
        </figure>`).join('');
    const area = d.area.map((a, i) => `<li${i === 0 ? ' class="main"' : ''}>${esc(a)}</li>`).join('');
    const email2 = d.email2 ? `<br><a href="mailto:${esc(d.email2)}">${esc(d.email2)}</a>` : '';
    return `<!doctype html>
<html lang="hu" class="no-js">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${esc(d.title)}</title>
    <meta name="description" content="${esc(d.description)}">
    <meta name="robots" content="${d.robots}">
    <meta name="theme-color" content="#05080f">
    <link rel="preload" as="image" href="../autoszerviz/img/hero-2000.webp" imagesrcset="../autoszerviz/img/hero-m.webp 800w, ../autoszerviz/img/hero-1000.webp 1000w, ../autoszerviz/img/hero-2000.webp 2000w" imagesizes="100vw">
    <link rel="stylesheet" href="/fonts/fonts.css">
    <link rel="stylesheet" href="../autoszerviz/style.css">
    <script src="../autoszerviz/en.js" defer></script><script src="../shared/i18n.js" defer></script><script src="../autoszerviz/script.js" defer></script>
  </head>
  <body>
    <div class="demo-ribbon">${esc(d.ribbon)} <a href="../index.html">← Összes demó</a></div>
    <header class="topbar">
      <div class="topbar-inner">
        <a class="logo" href="#top" aria-label="${esc(d.legal)} – főoldal">${I.logo}<b>${esc(d.logoText)}</b></a>
        <nav class="nav" aria-label="Fő navigáció">
          <a href="#szolgaltatasok">Szolgáltatások</a><a href="#rolunk">Rólunk</a><a href="#velemenyek">Vélemények</a><a href="#kapcsolat">Kapcsolat</a>
        </nav>
        <a class="btn btn-primary top-cta" href="tel:${d.phoneTel}">${I.phone}${esc(d.phone)}</a>
        <button type="button" class="menu-toggle" aria-controls="mobile-nav" aria-expanded="false" aria-label="Menü megnyitása"><span></span><span></span><span></span></button>
      </div>
      <nav class="mobile-nav" id="mobile-nav" hidden aria-label="Mobil navigáció">
        <a href="#szolgaltatasok">Szolgáltatások</a><a href="#rolunk">Rólunk</a><a href="#idopont">Időpont egyeztetése</a><a href="#velemenyek">Vélemények</a><a href="#kapcsolat">Kapcsolat</a>
      </nav>
    </header>

    <main id="top">
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-bg"><img src="../autoszerviz/img/hero-2000.webp" srcset="../autoszerviz/img/hero-m.webp 800w, ../autoszerviz/img/hero-1000.webp 1000w, ../autoszerviz/img/hero-2000.webp 2000w" sizes="100vw" alt="" width="2000" height="1250" fetchpriority="high" decoding="async"></div>
        <div class="hero-copy">
          <span class="eyebrow">Autószerviz · Autóvillamosság · Autóklíma</span>
          <h1 id="hero-title">Megbízható szerviz <span>az autója</span> szolgálatában.</h1>
          <p class="lead">Teljes körű autószerviz, autóvillamosság és autóklíma ${esc(d.district)} – gyorsan, szakszerűen, korrekt áron.</p>
          <div class="hero-actions">
            <a class="btn btn-primary" href="tel:${d.phoneTel}">${I.phone}${esc(d.phone)}</a>
            <a class="btn btn-ghost" href="tel:${d.phone2Tel}">${I.phone}${esc(d.phone2)}</a>
          </div>
          <ul class="hero-facts">
            <li>${I.pin}${esc(d.address)}</li>
            <li>${I.clock}Hétfő–Péntek 08:00–17:00</li>
          </ul>
        </div>
      </section>

      <section class="trust" aria-label="Miért minket?">
        <ul>
          <li class="reveal">${I.chip}Autóelektronika-specialisták</li>
          <li class="reveal" style="--d:.06s">${I.shield}Korrekt, előre egyeztetett ár</li>
          <li class="reveal" style="--d:.12s">${I.truck}Flottáknak kiszállással</li>
          <li class="reveal" style="--d:.18s">${I.car}${esc(d.slogan)}</li>
        </ul>
      </section>

      <section class="section" id="szolgaltatasok" aria-labelledby="services-title">
        <div class="wrap">
          <div class="section-head reveal">
            <div><span class="eyebrow">Szolgáltatásaink</span><h2 id="services-title">Minden, amire az autójának szüksége van.</h2></div>
            <p>A hibakereséstől a beszerelésig: egy helyen intézheti az autószerelést, az elektronikát és a klímát.</p>
          </div>
          <div class="services">${services}
          </div>
        </div>
      </section>

      <section class="statement" aria-label="Mottó">
        <div class="statement-bg" data-parallax="0.12"><img src="../autoszerviz/img/halo-1200.webp" alt="" width="1200" height="801" loading="lazy" decoding="async"></div>
        <div class="wrap reveal">
          <blockquote>Nem csodát, de <span>hatékony megoldást</span> nyújtunk az autójával kapcsolatos problémákra.</blockquote>
          <cite>„${esc(d.motto)}”</cite>
        </div>
      </section>

      <section class="section" id="rolunk" aria-labelledby="about-title">
        <div class="wrap about">
          <div class="reveal">
            <span class="eyebrow">Rólunk</span>
            <h2 id="about-title">Tapasztalat, amire számíthat.</h2>
            ${d.about.map(p => `<p>${esc(p)}</p>`).join('\n            ')}
            <span class="about-motto">${esc(d.slogan)}</span>
          </div>
          <div class="about-media reveal" style="--d:.1s">
            <figure><img src="../autoszerviz/img/${d.aboutImg.src}" alt="${esc(d.aboutImg.alt)}" width="800" height="600" loading="lazy" decoding="async"><figcaption>${esc(d.aboutImg.caption)}</figcaption></figure>
            <div class="about-badge"><b>H–P 8–17</b><small>Szombaton zárva</small></div>
          </div>
        </div>
      </section>

      <section class="section" id="idopont" aria-labelledby="booking-title" style="padding-top:0">
        <div class="wrap booking">
          <div class="reveal">
            <span class="eyebrow">Időpont egyeztetése</span>
            <h2 id="booking-title" style="margin:14px 0 0;font-size:clamp(30px,4vw,48px)">Egy hívás, és megbeszéljük.</h2>
            <ol class="steps">
              <li><b>Telefonos egyeztetés</b><span>Mondja el, milyen autóról és milyen problémáról van szó – megbeszéljük az időpontot.</span></li>
              <li><b>Állapotfelmérés</b><span>Diagnosztikával megkeressük a hiba okát.</span></li>
              <li><b>Ár egyeztetése</b><span>A javítás előtt elmondjuk, mi kell és mennyibe kerül.</span></li>
              <li><b>Javítás és átadás</b><span>Elvégezzük a munkát, és elmondjuk, mire figyeljen.</span></li>
            </ol>
          </div>
          <div class="form-card call-card reveal" style="--d:.1s">
            <h3>Hívjon minket</h3>
            <p>Időpontot telefonon egyeztetünk – hívjon nyitvatartási időben, és megbeszéljük, mikor tudja hozni az autót.</p>
            <a class="call-line" href="tel:${d.phoneTel}"><small>Mobil</small><b>${esc(d.phone)}</b>${I.phone}</a>
            <a class="call-line" href="tel:${d.phone2Tel}"><small>Vezetékes</small><b>${esc(d.phone2)}</b>${I.phone}</a>
            <table class="hours"><tr><td>Hétfő – Péntek</td><td>08:00 – 17:00</td></tr><tr><td>Szombat – Vasárnap</td><td>Zárva</td></tr></table>
          </div>
        </div>
      </section>

      <section class="section" id="velemenyek" aria-labelledby="reviews-title" style="padding-top:0">
        <div class="wrap">
          <div class="section-head reveal"><div><span class="eyebrow">Rólunk írták</span><h2 id="reviews-title">Elégedett ügyfeleink mondták.</h2></div></div>
          <div class="reviews">${reviews}
          </div>
          <div class="reveal" style="margin-top:56px">
            <span class="eyebrow">Ahol dolgozunk</span>
            <ul class="area">${area}</ul>
          </div>
        </div>
      </section>

      <section class="section" id="kapcsolat" aria-labelledby="contact-title" style="padding-top:0">
        <div class="wrap">
          <div class="section-head reveal"><div><span class="eyebrow">Kapcsolat</span><h2 id="contact-title">Hívjon, írjon, vagy ugorjon be.</h2></div></div>
          <div class="contact">
            <div class="contact-card reveal">
              <h3>${esc(d.legal)}</h3>
              <ul class="contact-list">
                <li>${I.pin}<div><small>Cím</small>${esc(d.address)}<br><span style="color:var(--muted)">${esc(d.addressNote)}</span></div></li>
                <li>${I.phone}<div><small>Telefon</small><a href="tel:${d.phoneTel}">${esc(d.phone)}</a><br><a href="tel:${d.phone2Tel}">${esc(d.phone2)}</a></div></li>
                <li>${I.mail}<div><small>E-mail</small><a href="mailto:${esc(d.email)}">${esc(d.email)}</a>${email2}</div></li>
                <li>${I.clock}<div style="flex:1"><small>Nyitvatartás</small>
                  <table class="hours"><tr><td>Hétfő – Péntek</td><td>08:00 – 17:00</td></tr><tr><td>Szombat – Vasárnap</td><td>Zárva</td></tr></table></div></li>
              </ul>
            </div>
            <a class="map-card reveal" style="--d:.1s" href="${esc(d.maps)}" target="_blank" rel="noopener">
              <span class="pin">${I.pin}</span>
              <b>${esc(d.address)}</b><span>${esc(d.addressNote)}</span>
              <span class="btn btn-ghost">Útvonaltervezés ${I.arrow}</span>
            </a>
          </div>
        </div>
      </section>
    </main>

    <footer class="footer">
      <div class="wrap"><span>© ${new Date().getFullYear()} ${esc(d.legal)} – „${esc(d.motto)}”</span><span>Weboldal: Megyeri Márk Máté</span></div>
    </footer>
    <a class="call-fab" href="tel:${d.phoneTel}" aria-label="Hívás: ${esc(d.phone)}">${I.phone}</a>
  </body>
</html>
`;
}

for (const [slug, data] of Object.entries(VARIANTS)) {
    const file = join(root, 'public/demos', slug, 'index.html');
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, page(slug, data));
    console.log('→', file);
}
