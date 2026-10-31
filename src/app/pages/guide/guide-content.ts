import type { GuideKey, ServiceKey } from '../../core/site-routes';

/**
 * Útmutató cikkek (magyar nyelvű, keresőoptimalizált tartalom). Ugyanebből a fájlból készül a build utáni
 * statikus HTML is (scripts/prerender.mjs), ezért futásidejű importot nem tartalmazhat.
 *
 * Szerkesztési elv (mint a szolgáltatási oldalaknál): csak valós, vállalható állítás – kitalált ár, határidő,
 * ügyfél vagy eredmény nem kerülhet bele. Az árakról általános tényezőket írunk, konkrét összeget az ajánlat ad.
 */
export interface GuideSection {
    h2: string;
    paragraphs: string[];
    list?: string[];
}

export interface Guide {
    /** Rövid felirat (morzsamenü, kártya). */
    label: string;
    seoTitle: string;
    seoDescription: string;
    h1: string;
    intro: string;
    /** Becsült olvasási idő percben. */
    minutes: number;
    /** Utolsó tartalmi frissítés (ÉÉÉÉ-HH-NN) – a strukturált adatban és az oldalon is megjelenik. */
    updated: string;
    sections: GuideSection[];
    faq: { q: string; a: string }[];
    /** A témához illő szolgáltatási oldal (belső link). */
    related: ServiceKey;
    ctaTitle: string;
    ctaText: string;
}

export const GUIDES: Record<GuideKey, Guide> = {
    price: {
        label: 'Weboldal ára',
        seoTitle: 'Mennyibe kerül egy weboldal? Mitől függ az ár | Megyeri Márk Máté',
        seoDescription: 'Mitől függ egy weboldal ára? Oldalszám, egyedi dizájn, funkciók, tartalom, tárhely és karbantartás – így tudod reálisan megtervezni a költségkeretet.',
        h1: 'Mennyibe kerül egy weboldal, és mitől függ az ár?',
        intro: 'A „mennyibe kerül egy weboldal?” kérdésre őszintén csak annyi a válasz: attól függ, mit kell tudnia. Ebben az útmutatóban végigvesszük, mely tényezők határozzák meg az árat, mire érdemes költeni, és hogyan kérj olyan ajánlatot, amit valóban össze tudsz hasonlítani.',
        minutes: 6,
        updated: '2026-11-01',
        sections: [
            {
                h2: 'Miért nincs egyetlen „weboldal-ár”?',
                paragraphs: [
                    'Egy egyoldalas bemutatkozó oldal és egy foglalási rendszerrel, adminfelülettel ellátott céges oldal között nagyságrendi különbség van a munka mennyiségében – ahogy egy garzon és egy családi ház építése között is.',
                    'Az ár nagy részét a tervezésre, a fejlesztésre és a tesztelésre fordított idő adja. Minél több egyedi elem, funkció és aloldal kell, annál több ez az idő.',
                ],
            },
            {
                h2: 'A legfontosabb ártényezők',
                paragraphs: ['Ha ajánlatokat hasonlítasz össze, ezeket a pontokat érdemes egymás mellé tenni:'],
                list: [
                    'Oldalak száma és szerkezete: egyoldalas landing, 4–6 aloldalas céges oldal vagy sok aloldalas, kategóriás felépítés.',
                    'Dizájn: kész sablon testreszabása vagy teljesen egyedi, a márkádra tervezett megjelenés.',
                    'Funkciók: kapcsolatfelvételi űrlap, időpontfoglalás, többnyelvűség, online fizetés, hírlevél, adminfelület.',
                    'Tartalom: te adod a szövegeket és képeket, vagy szövegírásra, fotózásra, illusztrációkra is szükség van.',
                    'Keresőoptimalizálási alapok: gyors betöltés, helyes címek és leírások, strukturált adatok, oldaltérkép.',
                    'Üzemeltetés: domain, tárhely, SSL, biztonsági mentések, frissítések és későbbi módosítások.',
                ],
            },
            {
                h2: 'Egyszeri és folyamatos költségek',
                paragraphs: [
                    'A fejlesztés jellemzően egyszeri díj. Emellett vannak folyamatos tételek: a domain és a tárhely éves díja, illetve ha kéred, a karbantartás (frissítések, mentések, kisebb módosítások, felügyelet).',
                    'Érdemes már az ajánlatkéréskor rákérdezni, mi tartozik bele az árba, és mi számít külön tételnek – így később nem ér meglepetés.',
                ],
            },
            {
                h2: 'Hol nem érdemes spórolni?',
                paragraphs: ['Néhány dolog később sokkal drágábban javítható, mint elsőre jól megcsinálni:'],
                list: [
                    'A mobilos megjelenés – a látogatók jelentős része telefonról érkezik.',
                    'A betöltési sebesség – a lassú oldalt sokan elhagyják, mielőtt megjelenne.',
                    'Az egyértelmű kapcsolatfelvétel – ha nem világos a következő lépés, az érdeklődő elvész.',
                    'A biztonság és a mentések – egy feltört vagy elveszett oldal helyreállítása időt és bizalmat is visz.',
                ],
            },
            {
                h2: 'Hogyan kérj összehasonlítható ajánlatot?',
                paragraphs: [
                    'Írd le röviden, mit csinál a vállalkozásod, kiknek szól az oldal, és mit kell elérnie (például több ajánlatkérés vagy időpontfoglalás). Sorold fel a szükséges funkciókat, és jelezd, ha van már arculatod, szöveged vagy képed.',
                    'Ha van elképzelésed a költségkeretről, azt is érdemes megadni: így a javaslat már a keretedhez igazodhat, és látod, mit kapsz érte.',
                ],
            },
        ],
        faq: [
            { q: 'Kaphatok pontos árat ajánlatkérés nélkül?', a: 'Pontos árat csak az igények ismeretében lehet adni. A rövid ajánlatkérő vagy a 2 perces igényfelmérő után személyre szabott, írásos ajánlatot kapsz, ami nem kötelez semmire.' },
            { q: 'Mi a különbség a sablonos és az egyedi weboldal ára között?', a: 'A sablon kiindulópontot ad, ezért a tervezési munka kevesebb – cserébe a megjelenés és a felépítés kötöttebb. Egyedi tervezésnél a márkádhoz és a céljaidhoz igazodik minden, ami több tervezési időt jelent.' },
            { q: 'Részletekben is fizethető?', a: 'A munka jellemzően előleggel indul, a fennmaradó összeg az átadáskor esedékes. A pontos feltételek az írásos ajánlatban szerepelnek.' },
        ],
        related: 'web',
        ctaTitle: 'Kíváncsi vagy, mennyi lenne a te weboldalad?',
        ctaText: 'Írd le néhány mondatban az elképzelésedet, és személyre szabott ajánlatot kapsz – kötelezettség nélkül.',
    },
    'landing-vs-business': {
        label: 'Landing vagy céges oldal?',
        seoTitle: 'Landing oldal vagy céges weboldal? Melyik kell neked? | Megyeri Márk Máté',
        seoDescription: 'Landing oldal vagy többoldalas céges weboldal? Mikor melyik a jobb választás, mik az előnyeik, és mikor érdemes a kettőt együtt használni.',
        h1: 'Landing oldal vagy céges weboldal: melyik kell neked?',
        intro: 'Mindkettő weboldal, de más feladatra készül. A landing oldal egyetlen célra fókuszál, a céges weboldal a teljes vállalkozásodat mutatja be. Megmutatom, mikor melyik a jobb választás – és mikor érdemes a kettőt együtt használni.',
        minutes: 5,
        updated: '2026-11-01',
        sections: [
            {
                h2: 'Mi az a landing oldal?',
                paragraphs: [
                    'A landing oldal egyetlen, jól meghatározott cél köré épülő oldal: például egy szolgáltatás, egy kampány vagy egy esemény bemutatása, egyetlen egyértelmű cselekvésre ösztönzéssel (ajánlatkérés, jelentkezés, foglalás).',
                    'Nincs benne sok menüpont és kitérő: a látogatót végigvezeti a legfontosabb érveken a döntésig.',
                ],
            },
            {
                h2: 'Mi a céges weboldal?',
                paragraphs: [
                    'A céges weboldal a vállalkozásod online „irodája”: bemutatja, kik vagytok, milyen szolgáltatásaitok vannak, hogyan dolgoztok, és hogyan lehet felvenni veletek a kapcsolatot. Több aloldalból áll, és hosszú távon építi a márkát és a bizalmat.',
                    'Több aloldal több keresési kifejezésre is megjelenhet a Google-ben, ezért a keresőoptimalizálás szempontjából is erősebb alap.',
                ],
            },
            {
                h2: 'Mikor válassz landing oldalt?',
                paragraphs: ['A landing oldal akkor jó választás, ha:'],
                list: [
                    'egy konkrét ajánlatot, kampányt vagy új szolgáltatást szeretnél gyorsan elindítani;',
                    'hirdetésekből (Google, Facebook) érkeznek a látogatók, és egyetlen lépésre akarod őket vezetni;',
                    'még csak most indul a vállalkozásod, és első lépésként egy fókuszált bemutatkozás is elég.',
                ],
            },
            {
                h2: 'Mikor válassz céges weboldalt?',
                paragraphs: ['A többoldalas céges weboldal akkor indokolt, ha:'],
                list: [
                    'több szolgáltatásod van, és mindegyiket külön szeretnéd bemutatni;',
                    'fontos, hogy a Google-ben több témára is megtaláljanak;',
                    'referenciákat, csapatot, folyamatot, gyakori kérdéseket is meg szeretnél mutatni;',
                    'hosszú távon szeretnél építeni a márkádra és a tartalmaidra.',
                ],
            },
            {
                h2: 'A kettő együtt',
                paragraphs: [
                    'Gyakori és jól működő megoldás, hogy a céges weboldal adja az alapot, a kampányokhoz pedig külön landing oldalak készülnek. Így a hirdetésekből érkező látogató fókuszált oldalt lát, a márka pedig egységes marad.',
                ],
            },
        ],
        faq: [
            { q: 'Egy landing oldalból később lehet céges weboldal?', a: 'Igen. Ha a landing oldal jól átgondolt szerkezetre és arculatra épül, később bővíthető további aloldalakkal.' },
            { q: 'Melyik a gyorsabban elkészülő megoldás?', a: 'Általában a landing oldal, mert kevesebb az aloldal és a tartalom. A pontos ütemezés az igényektől és a tartalmak elkészültétől függ.' },
            { q: 'Nem tudom eldönteni, melyik kell. Mit tegyek?', a: 'Töltsd ki a 2 perces igényfelmérőt, vagy foglalj egy ingyenes konzultációt – a céljaid alapján javaslatot kapsz.' },
        ],
        related: 'landing',
        ctaTitle: 'Segítek eldönteni, melyik illik hozzád',
        ctaText: 'A 2 perces igényfelmérő alapján személyre szabott javaslatot kapsz arra, milyen weboldallal érdemes indulnod.',
    },
    steps: {
        label: 'A weboldal készítés lépései',
        seoTitle: 'Weboldal készítés lépésről lépésre – mire készülj fel? | Megyeri Márk Máté',
        seoDescription: 'Hogyan zajlik egy weboldal elkészítése az első egyeztetéstől az élesítésig? Lépések, teendők és egy ellenőrzőlista arról, mit készíts elő.',
        h1: 'Weboldal készítés lépésről lépésre: mire készülj fel?',
        intro: 'Ha most csináltatsz először weboldalt, jó tudni, hogyan zajlik a folyamat, és mikor mire lesz szükség tőled. Ebből az útmutatóból kiderül, mik a lépések, és mit érdemes előre összekészíteni, hogy minden gördülékenyen haladjon.',
        minutes: 6,
        updated: '2026-11-01',
        sections: [
            {
                h2: '1. Egyeztetés és ajánlat',
                paragraphs: [
                    'Átbeszéljük, mit csinál a vállalkozásod, kik az ügyfeleid, és mit kell elérnie az oldalnak. Ebből írásos ajánlat készül a terjedelemmel, a funkciókkal, az árral és az ütemezéssel.',
                ],
            },
            {
                h2: '2. Tervezés',
                paragraphs: [
                    'Elkészül az oldal szerkezete (milyen aloldalak, milyen sorrendben, milyen tartalommal) és a vizuális terv. Ezt a fejlesztés előtt jóváhagyod – így a végén nem érhet meglepetés.',
                ],
            },
            {
                h2: '3. Fejlesztés és tartalomfeltöltés',
                paragraphs: [
                    'Megépül a reszponzív, gyors weboldal a szükséges funkciókkal. Közben bekerülnek a szövegek és a képek. Ennél a lépésnél a leggyakoribb csúszás oka a hiányzó tartalom – ezért érdemes azt időben előkészíteni.',
                ],
            },
            {
                h2: '4. Tesztelés és élesítés',
                paragraphs: [
                    'Az oldal különböző eszközökön és böngészőkben is ellenőrzésre kerül: űrlapok, linkek, sebesség, mobilos megjelenés. Ezután kerül a végleges címére, beállítjuk a keresőoptimalizálási alapokat, és megkapod a szükséges hozzáféréseket.',
                ],
            },
            {
                h2: '5. Utána: karbantartás és fejlődés',
                paragraphs: [
                    'Egy weboldal nem „kész” az átadással: frissítések, mentések, kisebb módosítások és új tartalmak tartják naprakészen és biztonságosan. Igény szerint ezt karbantartási megállapodás keretében is vállalom.',
                ],
            },
            {
                h2: 'Ellenőrzőlista: mit készíts elő?',
                paragraphs: ['Ezekkel sokat gyorsíthatsz a folyamaton:'],
                list: [
                    'Logó és arculati elemek (színek, betűtípus), ha már vannak.',
                    'A szolgáltatásaid listája rövid leírással.',
                    'Bemutatkozó szöveg rólad vagy a csapatról.',
                    'Saját fotók (iroda, munka közben, termékek) – ezek hitelesebbek a stockképeknél.',
                    'Referenciák, vélemények, ha szeretnéd megjeleníteni őket.',
                    'Elérhetőségek, nyitvatartás, cégadatok (az impresszumhoz).',
                    'Néhány weboldal, ami tetszik (és ami nem) – ez sokat segít a tervezésben.',
                    'A meglévő domain és tárhely hozzáférései, ha már van ilyen.',
                ],
            },
        ],
        faq: [
            { q: 'Mennyi ideig tart egy weboldal elkészítése?', a: 'A terjedelemtől, a funkcióktól és a tartalmak elkészültétől függ. A pontos ütemezést az ajánlat tartalmazza, és még a fejlesztés előtt tisztázzuk.' },
            { q: 'Nincs még szövegem. Ez gond?', a: 'Nem, de érdemes időben foglalkozni vele. Ha kéred, a szerkezethez igazodó szövegvázlatban is tudok segíteni, amit aztán a saját szavaiddal pontosíthatsz.' },
            { q: 'Később én is tudom módosítani az oldalt?', a: 'Igen, ha a projektben adminfelület vagy szerkeszthető tartalom is szerepel. Ellenkező esetben a módosításokat karbantartás keretében vagy alkalmanként vállalom.' },
        ],
        related: 'web',
        ctaTitle: 'Kezdjük az első lépéssel',
        ctaText: 'Foglalj egy ingyenes konzultációt, vagy írd le az elképzelésedet az ajánlatkérőben.',
    },
    'speed-seo': {
        label: 'Sebesség és SEO alapok',
        seoTitle: 'Gyors és jól kereshető weboldal: 10 alapszabály | Megyeri Márk Máté',
        seoDescription: 'Mitől lesz gyors és jól kereshető egy weboldal? Tíz gyakorlati alapszabály a betöltési sebességről, a mobilos megjelenésről és a keresőoptimalizálásról.',
        h1: 'Gyors és jól kereshető weboldal: 10 alapszabály',
        intro: 'A Google a gyors, mobilon is jól használható és egyértelmű szerkezetű oldalakat részesíti előnyben – és a látogatók is ezeken maradnak szívesebben. Ez a tíz alapszabály segít felmérni, hol tart a weboldalad.',
        minutes: 7,
        updated: '2026-11-01',
        sections: [
            {
                h2: 'Sebesség',
                paragraphs: ['A lassú oldalt sokan elhagyják, mielőtt egyáltalán megjelenne. A sebesség a keresési rangsorolásban is szerepet játszik.'],
                list: [
                    '1. Optimalizált képek: modern formátum (például WebP), a megjelenítési mérethez igazított felbontás, és a nem látható képek késleltetett betöltése.',
                    '2. Kevesebb és kisebb JavaScript: csak az töltődjön be azonnal, ami az első képernyőhöz kell; a többi később.',
                    '3. Gyorsítótárazás és tömörítés: a böngésző ne töltse le újra a változatlan fájlokat, a szerver pedig tömörítve küldje őket.',
                    '4. Saját tárhelyről betöltött betűtípusok: kevesebb külső kérés, gyorsabb első megjelenés és adatvédelmi előny is.',
                ],
            },
            {
                h2: 'Mobil és használhatóság',
                paragraphs: [],
                list: [
                    '5. Mobilra tervezett felület: olvasható betűméret, jól nyomható gombok, vízszintes görgetés nélkül.',
                    '6. Egyértelmű következő lépés: minden oldalon legyen világos, hogyan lehet ajánlatot kérni vagy kapcsolatba lépni.',
                ],
            },
            {
                h2: 'Keresőoptimalizálás',
                paragraphs: [],
                list: [
                    '7. Oldalanként egyedi cím és leírás: ezek jelennek meg a Google találati listájában – legyen bennük, amire az ügyfeleid keresnek.',
                    '8. Logikus címsor-szerkezet: oldalanként egy fő címsor (H1), alatta témánként tagolt alcímek.',
                    '9. Témánként külön oldal: egy szolgáltatás = egy aloldal. Így több keresésre is megjelenhetsz.',
                    '10. Technikai alapok: oldaltérkép (sitemap.xml), robots.txt, helyes átirányítások, HTTPS, strukturált adatok és Google Search Console-regisztráció.',
                ],
            },
            {
                h2: 'Hogyan mérd?',
                paragraphs: [
                    'A Google PageSpeed Insights ingyenesen megmutatja az oldal sebességét mobilon és asztali gépen, a Search Console pedig azt, milyen keresésekre jelensz meg, és van-e indexelési hiba. Érdemes mindkettőt rendszeresen ellenőrizni – egy-egy új kép vagy bővítmény is ronthat az eredményeken.',
                ],
            },
        ],
        faq: [
            { q: 'Mennyi idő alatt látszik a keresőoptimalizálás hatása?', a: 'Ez a versenytől és a tartalomtól függ; jellemzően hetek-hónapok alatt. A technikai alapok gyorsabban rendbe tehetők, a jó helyezéshez viszont rendszeres, hasznos tartalom is kell.' },
            { q: 'Mit jelent a PageSpeed pontszám?', a: 'Egy 0–100 közötti összesített mutató a betöltési sebességről és a stabilitásról. Önmagában nem cél, de jól jelzi, hol lehet javítani a felhasználói élményen.' },
            { q: 'A meglévő weboldalamat is fel tudod gyorsítani?', a: 'Sok esetben igen – a képek, a betöltési sorrend és a gyorsítótárazás rendbetételével. Ehhez először átnézem a jelenlegi oldalt, és javaslatot teszek.' },
        ],
        related: 'care',
        ctaTitle: 'Szeretnéd, hogy átnézzem a weboldaladat?',
        ctaText: 'Írd meg a címét az ajánlatkérőben, és javaslatot teszek a gyorsításra és a keresőoptimalizálásra.',
    },
};
