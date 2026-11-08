// ORBIS – interaktív 3D Naprendszer-lexikon (portfólió-demó).
// Egy adatforrásból készül: public/demos/naprendszer/index.html (magyar szöveg) + en.js (angol szótár a ../shared/i18n.js-hez)
// + data.js (a 3D jelenet és a térkép-kártya adatai, mindkét nyelven).
// Futtatás módosítás után:  node scripts/demo-naprendszer.mjs
// Az adatok a NASA Solar System Exploration összefoglalói alapján, kerekítve.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public/demos/naprendszer');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const norm = s => String(s).replace(/\s+/g, ' ').trim();

// angol szótár: a megjelenő magyar szöveg → angol
const EN = {};
const t = (hu, en) => { if (en && norm(hu) !== norm(en)) EN[norm(hu)] = en; return esc(hu); };

const FIELDS = [
    ['diameter', 'Átmérő', 'Diameter'],
    ['distance', 'Távolság a Naptól', 'Distance from the Sun'],
    ['day', 'Tengelyforgás', 'Rotation period'],
    ['year', 'Keringési idő', 'Orbital period'],
    ['moons', 'Holdak', 'Moons'],
    ['temp', 'Hőmérséklet', 'Temperature'],
];

// d: átmérő km, au: közepes naptávolság (CsE), yearDays: keringési idő földi napban (a táblázat rendezéséhez)
const BODIES = [
    {
        key: 'nap', hu: 'Nap', en: 'Sun', kind: ['Csillag · G2V sárga törpe', 'Star · G2V yellow dwarf'],
        lead: ['A Naprendszer középpontja és egyetlen csillaga: a teljes tömeg 99,8%-át adja. Magjában másodpercenként mintegy 600 millió tonna hidrogén olvad héliummá – ez a fény és a hő forrása.',
            'The centre of the Solar System and its only star, holding 99.8% of its total mass. In its core about 600 million tonnes of hydrogen fuse into helium every second – the source of all its light and heat.'],
        data: {
            diameter: ['1 392 700 km', '1,392,700 km'], distance: ['– (a Tejút középpontjától ~26 000 fényév)', '– (~26,000 light-years from the galactic centre)'],
            day: ['~25 nap (az egyenlítőn)', '~25 days (at the equator)'], year: ['~230 millió év a Tejút körül', '~230 million years around the Milky Way'],
            moons: ['8 bolygó kering körülötte', '8 planets orbit it'], temp: ['~5 500 °C a felszínen', '~5,500 °C at the surface'],
        },
        facts: [
            ['A fénye kb. 8 perc 20 másodperc alatt ér a Földre.', 'Its light reaches Earth in about 8 minutes 20 seconds.'],
            ['Nagyjából 1,3 millió Föld férne bele.', 'Roughly 1.3 million Earths would fit inside it.'],
            ['Kb. 4,6 milliárd éves – élete nagyjából felénél tart.', 'It is about 4.6 billion years old – roughly halfway through its life.'],
        ],
        d: 1392700, au: 0, yearDays: null, moons: null,
    },
    {
        key: 'merkur', hu: 'Merkúr', en: 'Mercury', kind: ['Kőzetbolygó', 'Rocky planet'],
        lead: ['A legkisebb és a Naphoz legközelebbi bolygó. Szinte nincs légköre, ezért nappal 430 °C-ra hevül, éjjel −180 °C alá hűl. Felszínét a Holdéhoz hasonlóan kráterek borítják.',
            'The smallest planet and the closest to the Sun. With almost no atmosphere it heats up to 430 °C by day and drops below −180 °C at night. Like the Moon, its surface is covered in craters.'],
        data: {
            diameter: ['4 879 km', '4,879 km'], distance: ['57,9 millió km (0,39 CsE)', '57.9 million km (0.39 AU)'],
            day: ['58,6 földi nap', '58.6 Earth days'], year: ['88 földi nap', '88 Earth days'], moons: ['0', '0'], temp: ['−180 … +430 °C', '−180 … +430 °C'],
        },
        facts: [
            ['Egy merkúri nap napkeltétől napkeltéig 176 földi nap – hosszabb, mint az éve.', 'A Mercury day from sunrise to sunrise lasts 176 Earth days – longer than its year.'],
            ['Bár a Naphoz legközelebb van, nem ő a legforróbb bolygó, hanem a Vénusz.', 'Although it is closest to the Sun, it is not the hottest planet – Venus is.'],
            ['Hatalmas vasmagja a bolygó sugarának mintegy 85%-áig ér.', 'Its huge iron core reaches about 85% of the planet’s radius.'],
        ],
        d: 4879, au: 0.39, yearDays: 88, moons: 0,
    },
    {
        key: 'venusz', hu: 'Vénusz', en: 'Venus', kind: ['Kőzetbolygó', 'Rocky planet'],
        lead: ['Méretében a Föld ikertestvére, de sűrű szén-dioxid-légköre és kénsavfelhői miatt üvegházpokol: felszínén 465 °C van, a légnyomás a földi 90-szerese.',
            'Earth’s twin in size, but its thick carbon-dioxide atmosphere and sulphuric-acid clouds make it a greenhouse inferno: 465 °C at the surface and 90 times Earth’s air pressure.'],
        data: {
            diameter: ['12 104 km', '12,104 km'], distance: ['108,2 millió km (0,72 CsE)', '108.2 million km (0.72 AU)'],
            day: ['243 földi nap (ellentétes irányban)', '243 Earth days (retrograde)'], year: ['224,7 földi nap', '224.7 Earth days'], moons: ['0', '0'], temp: ['~465 °C', '~465 °C'],
        },
        facts: [
            ['Egy nap hosszabb rajta, mint egy év.', 'A day on Venus is longer than its year.'],
            ['Fordított irányban forog: ott a Nap nyugaton kel fel.', 'It spins backwards: the Sun rises in the west there.'],
            ['A Hold után a legfényesebb égitest az éjszakai égbolton.', 'After the Moon, it is the brightest object in the night sky.'],
        ],
        d: 12104, au: 0.72, yearDays: 224.7, moons: 0,
    },
    {
        key: 'fold', hu: 'Föld', en: 'Earth', kind: ['Kőzetbolygó · otthonunk', 'Rocky planet · our home'],
        lead: ['Az egyetlen ismert hely, ahol élet van. Felszínének mintegy 71%-át víz borítja, nitrogén–oxigén légköre és mágneses tere véd a világűr sugárzásától.',
            'The only place known to harbour life. Water covers about 71% of its surface, and its nitrogen–oxygen atmosphere and magnetic field shield it from space radiation.'],
        data: {
            diameter: ['12 742 km', '12,742 km'], distance: ['149,6 millió km (1 CsE)', '149.6 million km (1 AU)'],
            day: ['23 óra 56 perc', '23 h 56 min'], year: ['365,25 nap', '365.25 days'], moons: ['1 (a Hold)', '1 (the Moon)'], temp: ['átlagosan +15 °C', '+15 °C on average'],
        },
        facts: [
            ['A Hold kb. 384 400 km-re kering, és mindig ugyanazt az oldalát mutatja felénk.', 'The Moon orbits about 384,400 km away and always shows us the same side.'],
            ['A 23,4°-os tengelyferdeség okozza az évszakokat.', 'Its 23.4° axial tilt causes the seasons.'],
            ['Az egyetlen bolygó, amelynek felszínén tartósan folyékony víz van.', 'The only planet with stable liquid water on its surface.'],
        ],
        d: 12742, au: 1, yearDays: 365.25, moons: 1,
    },
    {
        key: 'mars', hu: 'Mars', en: 'Mars', kind: ['Kőzetbolygó · a vörös bolygó', 'Rocky planet · the red planet'],
        lead: ['Színét a felszíni vas-oxid, vagyis a rozsda adja. Ritka szén-dioxid-légkörű, hideg sivatag, sarki jégsapkákkal és a Naprendszer legmagasabb vulkánjával.',
            'Its colour comes from iron oxide – rust – on its surface. A cold desert with a thin carbon-dioxide atmosphere, polar ice caps and the tallest volcano in the Solar System.'],
        data: {
            diameter: ['6 779 km', '6,779 km'], distance: ['227,9 millió km (1,52 CsE)', '227.9 million km (1.52 AU)'],
            day: ['24 óra 37 perc', '24 h 37 min'], year: ['687 földi nap', '687 Earth days'], moons: ['2 (Phobos, Deimos)', '2 (Phobos, Deimos)'], temp: ['átlagosan −65 °C', '−65 °C on average'],
        },
        facts: [
            ['Az Olympus Mons kb. 22 km magas – közel háromszorosa a Mount Everestnek.', 'Olympus Mons is about 22 km high – nearly three times Mount Everest.'],
            ['A Valles Marineris kanyonrendszer mintegy 4 000 km hosszú.', 'The Valles Marineris canyon system is about 4,000 km long.'],
            ['Felszínét jelenleg is robotok kutatják, például a Perseverance rover.', 'Robots are exploring its surface right now, such as the Perseverance rover.'],
        ],
        d: 6779, au: 1.52, yearDays: 687, moons: 2,
    },
    {
        key: 'jupiter', hu: 'Jupiter', en: 'Jupiter', kind: ['Gázóriás', 'Gas giant'],
        lead: ['A legnagyobb bolygó: tömege két és félszerese az összes többi bolygóénak együttvéve. Felhősávjait több száz km/órás szelek hajtják.',
            'The largest planet: two and a half times the mass of all the other planets combined. Its cloud bands are driven by winds of hundreds of kilometres per hour.'],
        data: {
            diameter: ['139 820 km', '139,820 km'], distance: ['778,5 millió km (5,2 CsE)', '778.5 million km (5.2 AU)'],
            day: ['9 óra 56 perc', '9 h 56 min'], year: ['11,9 földi év', '11.9 Earth years'], moons: ['95+', '95+'], temp: ['~−110 °C (felhőtető)', '~−110 °C (cloud tops)'],
        },
        facts: [
            ['A Nagy Vörös Folt egy évszázadok óta tomboló vihar, nagyobb a Földnél.', 'The Great Red Spot is a storm that has raged for centuries – it is bigger than Earth.'],
            ['A leggyorsabban forgó bolygó: egy nap rajta 10 óránál is rövidebb.', 'The fastest-spinning planet: a day there is under 10 hours.'],
            ['Ganümédész nevű holdja nagyobb a Merkúrnál.', 'Its moon Ganymede is bigger than Mercury.'],
        ],
        d: 139820, au: 5.2, yearDays: 4333, moons: 95,
    },
    {
        key: 'szaturnusz', hu: 'Szaturnusz', en: 'Saturn', kind: ['Gázóriás · gyűrűs bolygó', 'Gas giant · the ringed planet'],
        lead: ['Látványos gyűrűi főleg vízjégdarabokból állnak, átmérőjük mintegy 280 000 km – vastagságuk viszont sok helyen alig néhány tíz méter.',
            'Its spectacular rings are made mostly of chunks of water ice and span about 280,000 km – yet in many places they are only a few tens of metres thick.'],
        data: {
            diameter: ['116 460 km', '116,460 km'], distance: ['1,43 milliárd km (9,5 CsE)', '1.43 billion km (9.5 AU)'],
            day: ['10 óra 33 perc', '10 h 33 min'], year: ['29,4 földi év', '29.4 Earth years'], moons: ['270+', '270+'], temp: ['~−140 °C (felhőtető)', '~−140 °C (cloud tops)'],
        },
        facts: [
            ['Átlagos sűrűsége kisebb a vízénél – egy elég nagy kádban elúszna.', 'Its average density is lower than water’s – it would float in a big enough bathtub.'],
            ['Neki van a legtöbb ismert holdja a Naprendszerben.', 'It has the most known moons in the Solar System.'],
            ['Titán nevű holdján sűrű légkör és metántavak vannak.', 'Its moon Titan has a thick atmosphere and lakes of methane.'],
        ],
        d: 116460, au: 9.5, yearDays: 10759, moons: 274,
    },
    {
        key: 'uranusz', hu: 'Uránusz', en: 'Uranus', kind: ['Jégóriás', 'Ice giant'],
        lead: ['Szinte az oldalán fekve kering: tengelye 98°-ban dől. Halvány kékeszöld színét a légkörében lévő metán adja.',
            'It orbits almost on its side, with its axis tilted by 98°. Methane in its atmosphere gives it a pale blue-green colour.'],
        data: {
            diameter: ['50 724 km', '50,724 km'], distance: ['2,87 milliárd km (19,2 CsE)', '2.87 billion km (19.2 AU)'],
            day: ['17 óra 14 perc (ellentétes irányban)', '17 h 14 min (retrograde)'], year: ['84 földi év', '84 Earth years'], moons: ['28+', '28+'], temp: ['~−195 °C (felhőtető)', '~−195 °C (cloud tops)'],
        },
        facts: [
            ['A sarkain 42 évig tart a nappal, majd 42 évig az éjszaka.', 'At its poles, daylight lasts 42 years, followed by 42 years of night.'],
            ['Az első távcsővel felfedezett bolygó (William Herschel, 1781).', 'The first planet discovered with a telescope (William Herschel, 1781).'],
            ['Neki is van gyűrűrendszere, csak sötét és halvány.', 'It has a ring system too – just dark and faint.'],
        ],
        d: 50724, au: 19.2, yearDays: 30687, moons: 28,
    },
    {
        key: 'neptunusz', hu: 'Neptunusz', en: 'Neptune', kind: ['Jégóriás', 'Ice giant'],
        lead: ['A legtávolabbi bolygó, mélykék jégóriás. Itt fújnak a Naprendszer leggyorsabb szelei, akár 2 000 km/óra sebességgel.',
            'The most distant planet, a deep-blue ice giant. The fastest winds in the Solar System blow here, at up to 2,000 km/h.'],
        data: {
            diameter: ['49 244 km', '49,244 km'], distance: ['4,5 milliárd km (30,1 CsE)', '4.5 billion km (30.1 AU)'],
            day: ['16 óra 6 perc', '16 h 6 min'], year: ['164,8 földi év', '164.8 Earth years'], moons: ['16', '16'], temp: ['~−200 °C (felhőtető)', '~−200 °C (cloud tops)'],
        },
        facts: [
            ['Előbb számításokkal jósolták meg a létezését, csak utána látták távcsővel (1846).', 'Its existence was predicted by maths before anyone saw it through a telescope (1846).'],
            ['Felfedezése óta mindössze egyetlen kört tett meg a Nap körül (2011-ben).', 'Since its discovery it has completed just one orbit of the Sun (in 2011).'],
            ['Legnagyobb holdja, a Triton, a bolygó forgásával ellentétes irányban kering.', 'Its largest moon, Triton, orbits against the planet’s spin.'],
        ],
        d: 49244, au: 30.1, yearDays: 60190, moons: 16,
    },
];

const nf = n => n.toLocaleString('hu-HU').replace(/ /g, ' ');
const nfEn = n => n.toLocaleString('en-US');

// ── HTML darabok ─────────────────────────────────────────────────────────────
const toc = BODIES.map((b, i) => `<a href="#${b.key}" data-toc="${b.key}"><span>${String(i + 1).padStart(2, '0')}</span>${t(b.hu, b.en)}</a>`).join('');

const entry = (b, i) => {
    const ratio = b.d / 12742;
    const rows = FIELDS.map(([k, hu, en]) => `<tr><th scope="row">${t(hu, en)}</th><td>${t(b.data[k][0], b.data[k][1])}</td></tr>`).join('');
    const facts = b.facts.map(([hu, en]) => `<li>${t(hu, en)}</li>`).join('');
    const ratioHu = ratio >= 10 ? ratio.toFixed(0) : ratio.toFixed(2).replace('.', ',');
    const ratioEn = ratio >= 10 ? ratio.toFixed(0) : ratio.toFixed(2);
    const bar = b.key === 'nap'
        ? `<p class="entry-compare-note">${t('Átmérője a Földének kb. 109-szerese.', 'Its diameter is about 109 times Earth’s.')}</p>`
        : `<div class="entry-compare"><span>${t('Átmérő a Földhöz képest', 'Diameter compared with Earth')}</span><div class="bar" aria-hidden="true"><i style="--w:${Math.min(100, Math.sqrt(ratio / 11) * 100).toFixed(1)}%"></i></div><b>${t(ratioHu + '×', ratioEn + '×')}</b></div>`;
    return `
    <article class="entry" id="${b.key}" data-focus="${b.key}" aria-labelledby="${b.key}-title">
      <div class="entry-card reveal">
        <p class="entry-kicker"><span>${String(i + 1).padStart(2, '0')}</span>${t(b.kind[0], b.kind[1])}</p>
        <h2 id="${b.key}-title">${t(b.hu, b.en)}</h2>
        <p class="entry-lead">${t(b.lead[0], b.lead[1])}</p>
        <table class="infobox"><caption>${t('Adatlap', 'Fact sheet')}</caption><tbody>${rows}</tbody></table>
        ${bar}
        <h3>${t('Érdekességek', 'Did you know?')}</h3>
        <ul class="facts">${facts}</ul>
      </div>
    </article>`;
};

const tableRows = BODIES.filter(b => b.key !== 'nap').map(b => `<tr>
          <th scope="row"><a href="#${b.key}">${t(b.hu, b.en)}</a></th>
          <td data-v="${b.d}">${t(nf(b.d), nfEn(b.d))}</td>
          <td data-v="${b.au}">${t(String(b.au).replace('.', ','), String(b.au))}</td>
          <td data-v="${b.yearDays}">${t(nf(b.yearDays), nfEn(b.yearDays))}</td>
          <td data-v="${b.moons}">${b.data.moons[0].split(' ')[0]}</td>
        </tr>`).join('');

const searchOptions = BODIES.map(b => `<option value="${t(b.hu, b.en)}"></option>`).join('');

const html = `<!doctype html>
<html lang="hu">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="robots" content="noindex, follow">
    <meta name="description" content="${t('ORBIS – interaktív 3D Naprendszer-lexikon: görgess végig a Naptól a Neptunuszig, kattints a bolygókra, és hasonlítsd össze őket.', 'ORBIS – an interactive 3D encyclopedia of the Solar System: scroll from the Sun to Neptune, click the planets and compare them.')}">
    <meta name="theme-color" content="#030305">
    <title>${t('ORBIS – Interaktív Naprendszer-lexikon | Demó', 'ORBIS – Interactive Solar System Encyclopedia | Demo')}</title>
    <link rel="stylesheet" href="/fonts/fonts.css"><link rel="stylesheet" href="style.css">
    <script src="en.js" defer></script><script src="../shared/i18n.js" defer></script>
    <script type="module" src="main.js"></script>
  </head>
  <body>
    <canvas class="space" aria-hidden="true"></canvas>
    <div class="labels" aria-hidden="true"></div>
    <div class="demo-ribbon">${t('PORTFÓLIÓ DEMÓ — INTERAKTÍV 3D LEXIKON', 'PORTFOLIO DEMO — INTERACTIVE 3D ENCYCLOPEDIA')} <a href="../index.html">${t('← Összes demó', '← All demos')}</a></div>
    <header class="topbar">
      <a class="logo" href="#kezdet" aria-label="${t('ORBIS kezdőlap', 'ORBIS home')}"><i aria-hidden="true"></i>ORBIS</a>
      <form class="search" role="search" aria-label="${t('Keresés a lexikonban', 'Search the encyclopedia')}">
        <input type="search" list="orbis-bodies" placeholder="${t('Keresés…', 'Search…')}" aria-label="${t('Égitest keresése', 'Find a body')}">
        <datalist id="orbis-bodies">${searchOptions}</datalist>
        <button type="submit">${t('Ugrás', 'Go')}</button>
      </form>
      <nav class="top-nav" aria-label="${t('Fő navigáció', 'Main navigation')}">
        <a href="#nap">${t('Lexikon', 'Encyclopedia')}</a>
        <a href="#terkep">${t('Térkép', 'Map')}</a>
        <a href="#osszehasonlitas">${t('Összehasonlítás', 'Compare')}</a>
      </nav>
    </header>
    <nav class="toc" aria-label="${t('Tartalom', 'Contents')}"><p>${t('Tartalom', 'Contents')}</p>${toc}<a href="#terkep" data-toc="terkep"><span>◎</span>${t('Térkép', 'Map')}</a></nav>

    <main>
      <section class="hero" id="kezdet" data-focus="hold" aria-labelledby="hero-title">
        <div class="hero-copy">
          <p class="eyebrow">${t('Interaktív 3D enciklopédia', 'Interactive 3D encyclopedia')}</p>
          <h1 id="hero-title"><span>${t('Naprendszer', 'Solar')}</span><span class="dim">${t('lexikon.', 'System.')}</span></h1>
          <p class="hero-lead">${t('Görgess végig a Naptól a Neptunuszig: a kamera bolygóról bolygóra repül, közben minden égitestről rövid, közérthető szócikket olvashatsz.', 'Scroll from the Sun to Neptune: the camera flies from planet to planet while you read a short, clear entry about each one.')}</p>
          <div class="hero-actions">
            <a class="btn btn-solid" href="#nap">${t('Utazás indítása ↓', 'Start the journey ↓')}</a>
            <a class="btn btn-ghost" href="#terkep">${t('Ugrás a térképre', 'Jump to the map')}</a>
          </div>
        </div>
        <p class="hero-caption"><b>${t('A képen: a Hold', 'Pictured: the Moon')}</b> ${t('3 474 km átmérő · 384 400 km-re a Földtől · húzással forgathatod', '3,474 km across · 384,400 km from Earth · drag to rotate')}</p>
        <a class="scroll-hint" href="#nap" aria-label="${t('Tovább a lexikonhoz', 'Continue to the encyclopedia')}"><i></i></a>
      </section>

      <div class="entries">${BODIES.map(entry).join('')}
      </div>

      <section class="map" id="terkep" data-focus="overview" aria-labelledby="map-title">
        <div class="map-head reveal">
          <p class="eyebrow">${t('A Naprendszer térképe', 'Map of the Solar System')}</p>
          <h2 id="map-title">${t('Kattints egy bolygóra.', 'Click a planet.')}</h2>
          <p>${t('Húzással forgathatod a nézetet. A méretek és a távolságok nem méretarányosak – úgy sűrítettük őket, hogy minden bolygó egyszerre látszódjon.', 'Drag to rotate the view. Sizes and distances are not to scale – they are compressed so every planet fits on screen at once.')}</p>
        </div>
        <aside class="map-card" aria-live="polite" translate="no"></aside>
      </section>

      <section class="compare" id="osszehasonlitas" data-focus="overview-quiet" aria-labelledby="compare-title">
        <div class="compare-card reveal">
          <p class="eyebrow">${t('Összehasonlító táblázat', 'Comparison table')}</p>
          <h2 id="compare-title">${t('A nyolc bolygó egymás mellett', 'The eight planets side by side')}</h2>
          <p class="muted">${t('Kattints egy oszlop fejlécére a rendezéshez.', 'Click a column header to sort.')}</p>
          <div class="table-wrap">
            <table class="sortable">
              <thead><tr>
                <th scope="col"><button type="button" data-col="0">${t('Bolygó', 'Planet')}</button></th>
                <th scope="col"><button type="button" data-col="1">${t('Átmérő (km)', 'Diameter (km)')}</button></th>
                <th scope="col"><button type="button" data-col="2">${t('Naptávolság (CsE)', 'Distance (AU)')}</button></th>
                <th scope="col"><button type="button" data-col="3">${t('Keringés (földi nap)', 'Orbit (Earth days)')}</button></th>
                <th scope="col"><button type="button" data-col="4">${t('Holdak', 'Moons')}</button></th>
              </tr></thead>
              <tbody>${tableRows}
              </tbody>
            </table>
          </div>
          <p class="source">${t('Adatok: a NASA Solar System Exploration összefoglalói alapján, kerekítve. A holdak száma az ismert holdakat jelenti, és az új felfedezésekkel nő. CsE = csillagászati egység, a Föld–Nap közepes távolság (149,6 millió km).', 'Data: based on NASA Solar System Exploration summaries, rounded. Moon counts are known moons and grow with new discoveries. AU = astronomical unit, the mean Earth–Sun distance (149.6 million km).')}</p>
        </div>
      </section>
    </main>

    <footer class="footer">
      <p><b>ORBIS</b> · ${t('Portfólió-demó: interaktív 3D lexikon WebGL-lel. A bolygók felszíne valós időben, programból készül.', 'Portfolio demo: an interactive 3D encyclopedia built with WebGL. The planet surfaces are generated in real time.')}</p>
      <p>${t('Készítette:', 'Made by:')} <a href="https://megyerimarkmate.hu" target="_blank" rel="noopener">Megyeri Márk Máté</a></p>
    </footer>
  </body>
</html>
`;

// ── a 3D jelenet + térkép-kártya adatai ──────────────────────────────────────
const data = BODIES.map(b => ({
    key: b.key, name: { hu: b.hu, en: b.en }, kind: { hu: b.kind[0], en: b.kind[1] },
    rows: FIELDS.map(([k, hu, en]) => ({ label: { hu, en }, value: { hu: b.data[k][0], en: b.data[k][1] } })),
    fact: { hu: b.facts[0][0], en: b.facts[0][1] },
}));
const dataJs = `// Generálta: scripts/demo-naprendszer.mjs – ne kézzel szerkeszd.\nexport const ENTRIES = ${JSON.stringify(data, null, 1)};\nexport const UI = ${JSON.stringify({
    more: { hu: 'Szócikk megnyitása ↓', en: 'Open the entry ↓' },
    pick: { hu: 'Válassz bolygót a térképen vagy a nevére kattintva.', en: 'Pick a planet on the map or by clicking its name.' },
    moon: { hu: 'Hold', en: 'Moon' },
})};\n`;

const enJs = `// ORBIS – angol szótár a ../shared/i18n.js-hez. Generálta: scripts/demo-naprendszer.mjs – ne kézzel szerkeszd.
window.DEMO_EN = ${JSON.stringify({
    meta: {
        title: 'ORBIS – Interactive Solar System Encyclopedia | Demo',
        description: 'ORBIS – an interactive 3D encyclopedia of the Solar System: scroll from the Sun to Neptune, click the planets and compare them.',
    },
    text: EN,
    patterns: {},
}, null, 1)};
`;

writeFileSync(join(out, 'index.html'), html);
writeFileSync(join(out, 'data.js'), dataJs);
writeFileSync(join(out, 'en.js'), enJs);
console.log('→', join(out, 'index.html'), `(${Object.keys(EN).length} angol szöveg)`);
