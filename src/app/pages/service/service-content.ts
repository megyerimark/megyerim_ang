import type { Lang, ServiceKey } from '../../core/site-routes';

/**
 * A szolgáltatási céloldalak szövege nyelvenként. Ugyanebből a fájlból készül a build utáni statikus HTML is
 * (scripts/prerender.mjs), ezért futásidejű importot nem tartalmazhat.
 *
 * Szerkesztési elv: csak valós, vállalható állítás kerüljön ide – kitalált ügyfél, eredmény, ár vagy határidő nem.
 */
export interface ServiceCopy {
    /** Rövid felirat a címsor fölött és a morzsamenüben. */
    label: string;
    seoTitle: string;
    seoDescription: string;
    h1: string;
    intro: string;
    problemsTitle: string;
    problems: string[];
    includedTitle: string;
    included: { title: string; text: string }[];
    processTitle: string;
    process: { title: string; text: string }[];
    faqTitle: string;
    faq: { q: string; a: string }[];
    ctaTitle: string;
    ctaText: string;
}

export interface ServiceDef {
    /** Az ajánlatkérő előválasztott típusa (?type=…). */
    quoteType: 'business' | 'landing' | 'webshop' | 'custom' | null;
    copy: Record<Lang, ServiceCopy>;
}

const PROCESS_HU = [
    { title: 'Egyeztetés', text: 'Átbeszéljük a célokat, a célközönséget, a szükséges funkciókat és a rendelkezésre álló tartalmakat. Ebből írásos ajánlat készül.' },
    { title: 'Tervezés', text: 'Oldalszerkezet és vizuális terv készül, amelyet a fejlesztés előtt jóváhagysz – így nincs meglepetés a végén.' },
    { title: 'Fejlesztés', text: 'Megépül a reszponzív, gyors oldal, a szükséges funkciókkal, keresőoptimalizálási alapbeállításokkal és teszteléssel.' },
    { title: 'Élesítés és támogatás', text: 'Átadás, beállítások, rövid betanítás – és igény szerint későbbi karbantartás vagy továbbfejlesztés.' },
];
const PROCESS_EN = [
    { title: 'Discovery', text: 'We discuss your goals, audience, required features and available content. You receive a written proposal based on this.' },
    { title: 'Design', text: 'A page structure and visual design are prepared for your approval before development starts – no surprises at the end.' },
    { title: 'Development', text: 'The responsive, fast website is built with the agreed features, technical SEO basics and testing.' },
    { title: 'Launch and support', text: 'Handover, configuration, a short walkthrough – and ongoing maintenance or further development if you need it.' },
];

export const SERVICES: Record<ServiceKey, ServiceDef> = {
    web: {
        quoteType: 'business',
        copy: {
            hu: {
                label: 'Weboldal készítés',
                seoTitle: 'Weboldal készítés vállalkozásoknak | Megyeri Márk Máté',
                seoDescription: 'Egyedi céges weboldal készítése: prémium design, gyors betöltés, mobilbarát felület és keresőbarát alapok. Kérj személyre szabott árajánlatot!',
                h1: 'Weboldal készítés vállalkozásoknak',
                intro: 'Egyedi tervezésű céges weboldalt készítek, amely hitelesen bemutatja a vállalkozásodat, gyorsan betölt mobilon is, és egyértelművé teszi a látogatóknak, hogyan léphetnek kapcsolatba veled.',
                problemsTitle: 'Mikor érdemes új weboldalban gondolkodni?',
                problems: [
                    'A jelenlegi oldal elavultnak hat, és nem tükrözi a szolgáltatásaid minőségét.',
                    'Mobilon nehezen használható vagy lassan tölt be.',
                    'A látogatók nem találják gyorsan, amit keresnek, és kevés az érdeklődés.',
                    'Sablonból készült, ezért nem különböztet meg a versenytársaidtól.',
                ],
                includedTitle: 'Mit tartalmaz a weboldal készítés?',
                included: [
                    { title: 'Egyedi design', text: 'A megjelenés a márkádhoz és a célközönségedhez igazodik, nem egy előre gyártott sablonhoz.' },
                    { title: 'Reszponzív, gyors felület', text: 'Mobilra, tabletre és asztali gépre optimalizált oldal, optimalizált képekkel és betöltéssel.' },
                    { title: 'Keresőbarát alapok', text: 'Oldalankénti cím és leírás, logikus címsorszerkezet, oldaltérkép és technikai SEO-beállítások.' },
                    { title: 'Kapcsolatfelvétel és ajánlatkérés', text: 'Egyértelmű cselekvésre ösztönző elemek, űrlapok és visszaigazolások, spamvédelemmel.' },
                    { title: 'Szerkeszthető tartalom', text: 'Igény esetén adminfelület, ahol a fontos tartalmakat magad is frissítheted.' },
                    { title: 'Adatvédelmi alapok', text: 'HTTPS, biztonsági beállítások és az adatkezeléshez szükséges oldalak helye.' },
                ],
                processTitle: 'Hogyan zajlik a közös munka?',
                process: PROCESS_HU,
                faqTitle: 'Gyakori kérdések a weboldal készítésről',
                faq: [
                    { q: 'Mennyibe kerül egy céges weboldal?', a: 'Az ár az oldalak számától, a funkcióktól és a tervezési igénytől függ. Az ajánlatkérőben megadhatod a költségkeretedet, és ahhoz igazítva készül az ajánlat.' },
                    { q: 'Mennyi idő alatt készül el?', a: 'Az ütemezést a terjedelem, a jóváhagyások és a tartalmak rendelkezésre állása határozza meg. A pontos menetrendet még a fejlesztés előtt rögzítjük.' },
                    { q: 'Később bővíthető lesz az oldal?', a: 'Igen. Az oldal úgy épül, hogy később új aloldalakkal, funkciókkal vagy nyelvekkel is bővíthető legyen.' },
                ],
                ctaTitle: 'Beszéljünk az új weboldaladról',
                ctaText: 'Írd le pár percben, mire van szükséged – személyre szabott ajánlatot kapsz, amely nem kötelez semmire.',
            },
            en: {
                label: 'Website development',
                seoTitle: 'Custom Website Development for Businesses | Márk Máté Megyeri',
                seoDescription: 'Custom business website development: premium design, fast loading, mobile-friendly and search-engine-ready. Request a tailored quote!',
                h1: 'Custom website development for businesses',
                intro: 'I design and build custom business websites that present your company credibly, load fast on mobile and make it obvious to visitors how to get in touch with you.',
                problemsTitle: 'When is it time for a new website?',
                problems: [
                    'Your current site looks outdated and does not reflect the quality of your services.',
                    'It is hard to use on mobile or loads slowly.',
                    'Visitors cannot quickly find what they are looking for, and enquiries are rare.',
                    'It was built from a template, so it does not set you apart from competitors.',
                ],
                includedTitle: 'What is included?',
                included: [
                    { title: 'Custom design', text: 'The look is tailored to your brand and audience, not to a pre-made template.' },
                    { title: 'Responsive, fast interface', text: 'Optimised for mobile, tablet and desktop, with optimised images and loading.' },
                    { title: 'Search-engine-ready foundations', text: 'Unique titles and descriptions per page, a logical heading structure, a sitemap and technical SEO settings.' },
                    { title: 'Contact and quote requests', text: 'Clear calls to action, forms and confirmations with spam protection.' },
                    { title: 'Editable content', text: 'An admin interface where you can update key content yourself, if needed.' },
                    { title: 'Privacy and security basics', text: 'HTTPS, security headers and room for the required privacy pages.' },
                ],
                processTitle: 'How we work together',
                process: PROCESS_EN,
                faqTitle: 'Website development FAQ',
                faq: [
                    { q: 'How much does a business website cost?', a: 'The price depends on the number of pages, the features and the design requirements. You can enter your budget in the quote form and the proposal is tailored to it.' },
                    { q: 'How long does it take?', a: 'The schedule depends on the scope, approvals and content availability. We agree on the exact timeline before development starts.' },
                    { q: 'Can the website be extended later?', a: 'Yes. It is built so that new pages, features or languages can be added later.' },
                ],
                ctaTitle: 'Let’s talk about your new website',
                ctaText: 'Describe what you need in a few minutes – you will receive a tailored, no-obligation proposal.',
            },
        },
    },
    landing: {
        quoteType: 'landing',
        copy: {
            hu: {
                label: 'Landing oldal készítés',
                seoTitle: 'Landing oldal készítés – konverzióra tervezve | Megyeri Márk Máté',
                seoDescription: 'Egyetlen célra fókuszáló landing oldal kampányokhoz, termékbevezetéshez vagy szolgáltatáshoz: gyors, mobilbarát, mérhető. Kérj ajánlatot!',
                h1: 'Landing oldal készítés',
                intro: 'Egy jól meghatározott cél köré épített, fókuszált oldalt készítek – legyen szó hirdetési kampányról, új szolgáltatásról, eseményről vagy termékbevezetésről.',
                problemsTitle: 'Mikor jó választás a landing oldal?',
                problems: [
                    'Hirdetést futtatsz, de a forgalom a főoldaladra érkezik, ahol elvész.',
                    'Egy új szolgáltatást vagy ajánlatot szeretnél gyorsan, önálló oldalon bemutatni.',
                    'Mérni szeretnéd, hány látogatóból lesz érdeklődő.',
                ],
                includedTitle: 'Mit tartalmaz?',
                included: [
                    { title: 'Egy cél, egy üzenet', text: 'A szerkezet a választott cselekvés köré épül: ajánlatkérés, jelentkezés, foglalás vagy vásárlás.' },
                    { title: 'Meggyőző felépítés', text: 'Probléma, megoldás, előnyök, bizalmi elemek és gyakori kérdések logikus sorrendben.' },
                    { title: 'Gyors betöltés', text: 'Könnyű, optimalizált oldal, hogy a hirdetésre kattintó látogató ne pattanjon le.' },
                    { title: 'Mérhetőség', text: 'Az űrlapküldések és a fontos kattintások mérhetők, a forrás (pl. UTM) rögzíthető.' },
                ],
                processTitle: 'Hogyan zajlik a közös munka?',
                process: PROCESS_HU,
                faqTitle: 'Gyakori kérdések a landing oldalakról',
                faq: [
                    { q: 'Miben más, mint egy teljes weboldal?', a: 'A landing oldal egyetlen célra fókuszál, kevesebb a menüpont és az elterelő elem. Ezért kampányokhoz és új ajánlatokhoz különösen jól működik.' },
                    { q: 'Hozzáköthető a meglévő weboldalamhoz?', a: 'Igen, elkészülhet a meglévő domain alatt vagy külön aloldalként is – ezt az egyeztetésen döntjük el.' },
                ],
                ctaTitle: 'Van egy kampányod vagy új ajánlatod?',
                ctaText: 'Mondd el, mi a cél, és összerakom, milyen landing oldal szolgálná a legjobban.',
            },
            en: {
                label: 'Landing page design',
                seoTitle: 'Landing Page Design – Built to Convert | Márk Máté Megyeri',
                seoDescription: 'Focused landing pages for campaigns, launches and services: fast, mobile-friendly and measurable. Request a quote!',
                h1: 'Landing page design and development',
                intro: 'I build focused pages around one clear goal – an ad campaign, a new service, an event or a product launch.',
                problemsTitle: 'When is a landing page the right choice?',
                problems: [
                    'You run ads, but the traffic lands on your homepage and gets lost.',
                    'You want to present a new service or offer quickly on its own page.',
                    'You want to measure how many visitors turn into enquiries.',
                ],
                includedTitle: 'What is included?',
                included: [
                    { title: 'One goal, one message', text: 'The structure is built around the chosen action: a quote request, sign-up, booking or purchase.' },
                    { title: 'Persuasive structure', text: 'Problem, solution, benefits, trust elements and FAQ in a logical order.' },
                    { title: 'Fast loading', text: 'A lightweight, optimised page so visitors coming from ads do not bounce.' },
                    { title: 'Measurability', text: 'Form submissions and key clicks can be tracked, and the traffic source (e.g. UTM) recorded.' },
                ],
                processTitle: 'How we work together',
                process: PROCESS_EN,
                faqTitle: 'Landing page FAQ',
                faq: [
                    { q: 'How is it different from a full website?', a: 'A landing page focuses on a single goal, with fewer menu items and distractions. That is why it works especially well for campaigns and new offers.' },
                    { q: 'Can it be connected to my existing website?', a: 'Yes, it can live under your existing domain or as a separate page – we decide this during discovery.' },
                ],
                ctaTitle: 'Planning a campaign or a new offer?',
                ctaText: 'Tell me the goal and I will outline which landing page would serve it best.',
            },
        },
    },
    shop: {
        quoteType: 'webshop',
        copy: {
            hu: {
                label: 'Webshop készítés',
                seoTitle: 'Webshop készítés egyedi igényekre | Megyeri Márk Máté',
                seoDescription: 'Webshop készítés vállalkozásoknak: átlátható termékoldalak, egyszerű vásárlási folyamat, online fizetés és kezelhető admin. Kérj árajánlatot!',
                h1: 'Webshop készítés',
                intro: 'Olyan webáruházat készítek, amelyben a vásárlók könnyen megtalálják és megveszik a termékeidet, te pedig egyszerűen kezelheted a rendeléseket.',
                problemsTitle: 'Mikor érdemes webshopban gondolkodni?',
                problems: [
                    'Telefonon, e-mailben vagy közösségi médiában veszed fel a rendeléseket, és ez sok időt visz el.',
                    'A meglévő webshopod nehezen kezelhető, vagy a vásárlók félbehagyják a rendelést.',
                    'Egyedi működésre van szükséged, amit egy dobozos megoldás nem tud.',
                ],
                includedTitle: 'Mit tartalmaz?',
                included: [
                    { title: 'Termékek és kategóriák', text: 'Átlátható termékoldalak képekkel, változatokkal és kereshető kategóriákkal.' },
                    { title: 'Egyszerű vásárlási folyamat', text: 'Kosár, rendelés és visszaigazolás a lehető legkevesebb lépésben, mobilon is.' },
                    { title: 'Online fizetés', text: 'Bankkártyás fizetés beépítése megbízható fizetési szolgáltatón keresztül.' },
                    { title: 'Kezelőfelület', text: 'Admin a termékek, készlet és rendelések kezeléséhez, igény szerint értesítésekkel.' },
                    { title: 'Jogi és adatvédelmi alapok', text: 'Helyet kapnak az ÁSZF, az adatkezelési tájékoztató és a szükséges hozzájárulások.' },
                ],
                processTitle: 'Hogyan zajlik a közös munka?',
                process: PROCESS_HU,
                faqTitle: 'Gyakori kérdések a webshop készítésről',
                faq: [
                    { q: 'Milyen fizetési módokat lehet beépíteni?', a: 'Bankkártyás online fizetés mellett az utánvét vagy az átutalás is megoldható – a konkrét szolgáltatót az igényeid alapján választjuk ki.' },
                    { q: 'Össze lehet kötni számlázó- vagy készletkezelő rendszerrel?', a: 'Sok esetben igen, ha a rendszernek van elérhető API-ja. Ezt az egyeztetésen nézzük meg konkrétan.' },
                ],
                ctaTitle: 'Tervezel webshopot?',
                ctaText: 'Írd le, mit és hogyan szeretnél értékesíteni – erre építve készül a személyre szabott ajánlat.',
            },
            en: {
                label: 'Webshop development',
                seoTitle: 'Webshop Development for Your Business | Márk Máté Megyeri',
                seoDescription: 'E-commerce website development: clear product pages, a simple checkout, online payments and an easy-to-use admin. Request a quote!',
                h1: 'Webshop development',
                intro: 'I build online shops where customers easily find and buy your products, and where you can manage orders without hassle.',
                problemsTitle: 'When should you consider a webshop?',
                problems: [
                    'You take orders by phone, email or social media, and it takes up a lot of time.',
                    'Your current shop is hard to manage, or customers abandon their orders.',
                    'You need custom functionality that an off-the-shelf solution cannot provide.',
                ],
                includedTitle: 'What is included?',
                included: [
                    { title: 'Products and categories', text: 'Clear product pages with images, variants and searchable categories.' },
                    { title: 'Simple checkout', text: 'Cart, order and confirmation in as few steps as possible, on mobile too.' },
                    { title: 'Online payments', text: 'Card payments integrated through a reliable payment provider.' },
                    { title: 'Admin interface', text: 'Manage products, stock and orders, with notifications if needed.' },
                    { title: 'Legal and privacy basics', text: 'Room for terms and conditions, the privacy policy and the required consents.' },
                ],
                processTitle: 'How we work together',
                process: PROCESS_EN,
                faqTitle: 'Webshop development FAQ',
                faq: [
                    { q: 'Which payment methods can be integrated?', a: 'Besides online card payments, cash on delivery or bank transfer are also possible – the specific provider is chosen based on your needs.' },
                    { q: 'Can it connect to invoicing or inventory software?', a: 'In many cases yes, if the system offers an API. We look at this specifically during discovery.' },
                ],
                ctaTitle: 'Planning an online shop?',
                ctaText: 'Describe what and how you want to sell – the tailored proposal is built on that.',
            },
        },
    },
    app: {
        quoteType: 'custom',
        copy: {
            hu: {
                label: 'Egyedi webfejlesztés',
                seoTitle: 'Egyedi webfejlesztés és webes rendszerek | Megyeri Márk Máté',
                seoDescription: 'Egyedi webes rendszerek, adminfelületek és ügyfélportálok Angular és Laravel alapon, a valós munkafolyamataidhoz igazítva. Kérj ajánlatot!',
                h1: 'Egyedi webfejlesztés és webes rendszerek',
                intro: 'Ha egy sablon vagy dobozos szoftver már nem elég, olyan webes rendszert fejlesztek, amely a valós munkafolyamataidhoz igazodik: adminfelületet, ügyfélportált, foglalási vagy ajánlatkezelő rendszert.',
                problemsTitle: 'Milyen problémákra jelent megoldást?',
                problems: [
                    'Táblázatokban, e-mailekben és papíron követed az ügyfeleket, ajánlatokat vagy foglalásokat.',
                    'Ugyanazokat az adatokat több helyre is be kell írni.',
                    'Egy meglévő rendszer nem tudja, amire a vállalkozásodnak szüksége van.',
                ],
                includedTitle: 'Mit tartalmazhat?',
                included: [
                    { title: 'Adminfelület', text: 'Átlátható kezelőfelület az adatok, státuszok és jogosultságok kezeléséhez.' },
                    { title: 'Ügyfélportál', text: 'Ügyfeleid saját felületen követhetik az ügyeiket, dokumentumaikat vagy fizetéseiket.' },
                    { title: 'Automatizált értesítések', text: 'E-mail-értesítések és visszaigazolások az ismétlődő kommunikáció helyett.' },
                    { title: 'Online fizetés és integrációk', text: 'Fizetési szolgáltató és külső rendszerek bekötése API-n keresztül, ahol ez lehetséges.' },
                    { title: 'Biztonság', text: 'Szerveroldali jogosultságkezelés, kétlépcsős azonosítás, naplózás és rendszeres mentés.' },
                ],
                processTitle: 'Hogyan zajlik a közös munka?',
                process: PROCESS_HU,
                faqTitle: 'Gyakori kérdések az egyedi fejlesztésről',
                faq: [
                    { q: 'Milyen technológiával dolgozol?', a: 'A felhasználói felület jellemzően Angularral, a háttérrendszer Laravellel (PHP) és MySQL adatbázissal készül. Ez stabil, jól karbantartható alap.' },
                    { q: 'Mi van, ha még nem tudom pontosan, mire van szükségem?', a: 'Ez teljesen természetes. Az első egyeztetésen közösen feltérképezzük a folyamatot, és abból állítjuk össze a szükséges funkciókat.' },
                ],
                ctaTitle: 'Van egy folyamat, amit egyszerűbbé tennél?',
                ctaText: 'Írd le, hogyan dolgoztok most, és megnézzük, milyen webes rendszer könnyítené meg a munkát.',
            },
            en: {
                label: 'Custom web development',
                seoTitle: 'Custom Web Development & Web Applications | Márk Máté Megyeri',
                seoDescription: 'Custom web applications, admin panels and client portals built with Angular and Laravel, tailored to your real workflows. Request a quote!',
                h1: 'Custom web development and web applications',
                intro: 'When a template or off-the-shelf software is no longer enough, I build web applications tailored to your real workflows: admin panels, client portals, booking or quote management systems.',
                problemsTitle: 'What problems does it solve?',
                problems: [
                    'You track clients, quotes or bookings in spreadsheets, emails and on paper.',
                    'The same data has to be entered in several places.',
                    'An existing system cannot do what your business needs.',
                ],
                includedTitle: 'What can it include?',
                included: [
                    { title: 'Admin panel', text: 'A clear interface to manage data, statuses and permissions.' },
                    { title: 'Client portal', text: 'Your clients can follow their cases, documents or payments on their own interface.' },
                    { title: 'Automated notifications', text: 'Email notifications and confirmations instead of repetitive manual communication.' },
                    { title: 'Online payments and integrations', text: 'Payment providers and external systems connected via API where possible.' },
                    { title: 'Security', text: 'Server-side permissions, two-factor authentication, logging and regular backups.' },
                ],
                processTitle: 'How we work together',
                process: PROCESS_EN,
                faqTitle: 'Custom development FAQ',
                faq: [
                    { q: 'Which technologies do you use?', a: 'The user interface is typically built with Angular, the backend with Laravel (PHP) and a MySQL database – a stable, maintainable foundation.' },
                    { q: 'What if I do not know exactly what I need yet?', a: 'That is completely normal. In the first meeting we map out your process together and derive the required features from it.' },
                ],
                ctaTitle: 'Is there a process you would like to simplify?',
                ctaText: 'Describe how you work today, and we will see which web application would make it easier.',
            },
        },
    },
    care: {
        quoteType: null,
        copy: {
            hu: {
                label: 'Weboldal karbantartás',
                seoTitle: 'Weboldal karbantartás és üzemeltetés | Megyeri Márk Máté',
                seoDescription: 'Rendszeres weboldal karbantartás: frissítések, mentések, biztonsági ellenőrzés, kisebb módosítások és gyors hibaelhárítás. Kérj ajánlatot!',
                h1: 'Weboldal karbantartás',
                intro: 'Egy weboldal az élesítés után is figyelmet igényel. Rendszeres karbantartással az oldalad biztonságos, naprakész és gyors marad – neked pedig nem kell a technikai részletekkel foglalkoznod.',
                problemsTitle: 'Mikor van szükség karbantartásra?',
                problems: [
                    'Nincs, aki rendszeresen frissítené az oldalt és a mögötte lévő rendszert.',
                    'Egy hiba vagy leállás esetén nem tudod, kihez fordulj.',
                    'Időnként tartalmat vagy kisebb funkciót módosítanál, de nincs rá kapacitásod.',
                ],
                includedTitle: 'Mit tartalmazhat?',
                included: [
                    { title: 'Frissítések', text: 'A keretrendszer és a függőségek rendszeres, ellenőrzött frissítése.' },
                    { title: 'Mentések', text: 'Rendszeres mentés a fájlokról és az adatbázisról, visszaállítási lehetőséggel.' },
                    { title: 'Biztonsági ellenőrzés', text: 'Sérülékenységek figyelése, biztonsági beállítások áttekintése.' },
                    { title: 'Kisebb módosítások', text: 'Tartalmi és kisebb funkcionális változtatások egyeztetett keretben.' },
                    { title: 'Hibaelhárítás', text: 'Ha valami nem működik, gyorsan megnézem és javítom.' },
                ],
                processTitle: 'Hogyan működik?',
                process: [
                    { title: 'Átvilágítás', text: 'Áttekintem az oldal jelenlegi állapotát, a tárhelyet és a technikai hátteret.' },
                    { title: 'Keret egyeztetése', text: 'Megbeszéljük, mire van szükség rendszeresen, és mi számít külön feladatnak.' },
                    { title: 'Folyamatos gondozás', text: 'Rendszeres frissítés, mentés és ellenőrzés, igény esetén havi díjas formában.' },
                ],
                faqTitle: 'Gyakori kérdések a karbantartásról',
                faq: [
                    { q: 'Más által készített weboldalt is vállalsz?', a: 'Az átvilágítás után eldöntjük, hogy a meglévő oldal biztonságosan karbantartható-e, vagy érdemes inkább felújítani.' },
                    { q: 'Hogyan történik a fizetés?', a: 'A rendszeres karbantartás havi díjas konstrukcióban is igénybe vehető, bankkártyás fizetéssel.' },
                ],
                ctaTitle: 'Gondoskodjunk a weboldaladról',
                ctaText: 'Írd meg, milyen oldalról van szó, és javaslatot teszek a karbantartás keretére.',
            },
            en: {
                label: 'Website maintenance',
                seoTitle: 'Website Maintenance and Support | Márk Máté Megyeri',
                seoDescription: 'Regular website maintenance: updates, backups, security checks, small changes and fast troubleshooting. Request a quote!',
                h1: 'Website maintenance and support',
                intro: 'A website needs attention after launch, too. With regular maintenance your site stays secure, up to date and fast – and you do not have to deal with the technical details.',
                problemsTitle: 'When do you need maintenance?',
                problems: [
                    'Nobody regularly updates the website and the system behind it.',
                    'If something breaks or goes down, you do not know who to turn to.',
                    'You would occasionally change content or a small feature, but have no capacity for it.',
                ],
                includedTitle: 'What can it include?',
                included: [
                    { title: 'Updates', text: 'Regular, tested updates of the framework and dependencies.' },
                    { title: 'Backups', text: 'Regular backups of files and the database, with the option to restore.' },
                    { title: 'Security checks', text: 'Monitoring for vulnerabilities and reviewing security settings.' },
                    { title: 'Small changes', text: 'Content and small functional changes within an agreed scope.' },
                    { title: 'Troubleshooting', text: 'If something does not work, I look into it and fix it quickly.' },
                ],
                processTitle: 'How it works',
                process: [
                    { title: 'Audit', text: 'I review the current state of the website, the hosting and the technical background.' },
                    { title: 'Agree on the scope', text: 'We discuss what is needed regularly and what counts as a separate task.' },
                    { title: 'Ongoing care', text: 'Regular updates, backups and checks, optionally as a monthly plan.' },
                ],
                faqTitle: 'Website maintenance FAQ',
                faq: [
                    { q: 'Do you maintain websites built by someone else?', a: 'After an audit we decide whether the existing site can be maintained safely or whether a refresh makes more sense.' },
                    { q: 'How does payment work?', a: 'Regular maintenance is available as a monthly plan with card payment.' },
                ],
                ctaTitle: 'Let’s take care of your website',
                ctaText: 'Tell me about your website and I will suggest a suitable maintenance scope.',
            },
        },
    },
};
