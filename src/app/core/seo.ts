import type { Lang } from '../i18n/i18n.service';

export const SITE_URL = 'https://megyerimarkmate.hu';

interface PageSeo { title: string; description: string; }

/**
 * A nyilvános oldalak címe és leírása a Google-találatokban, nyelvenként. Azok a kifejezések legyenek benne,
 * amelyekre az ügyfelek keresnek (weboldal készítés, webfejlesztés, árajánlat…; angolul: website design,
 * web development, quote…). A cím legfeljebb ~60, a leírás ~155 karakter – a Google a hosszabbat levágja.
 * A magyar főoldal címét és leírását az admin (Oldalbeállítások → SEO) felülírhatja.
 */
export const PAGE_SEO: Record<Lang, Record<string, PageSeo>> = {
    hu: {
        '/': {
            title: 'Weboldal készítés és egyedi webfejlesztés | Megyeri Márk Máté',
            description: 'Egyedi weboldal, webshop és webes rendszer készítése vállalkozásoknak – online, itthon és külföldön. Prémium design, gyors betöltés. Kérj ajánlatot!',
        },
        '/tervezo': {
            title: 'Interaktív weboldaltervező – tervezd meg a weboldalad | Megyeri Márk Máté',
            description: 'Próbáld ki az interaktív weboldaltervezőt: válassz stílust, színeket és funkciókat, és nézd meg élőben, milyen lehet a vállalkozásod weboldala.',
        },
        '/ajanlatkeres': {
            title: 'Weboldal árajánlat kérése | Megyeri Márk Máté',
            description: 'Kérj személyre szabott árajánlatot weboldal, webshop vagy webes rendszer készítésére. Pár perc kitölteni, és nem kötelez semmire.',
        },
        '/projekt-kviz': {
            title: 'Milyen weboldal kell a vállalkozásodnak? 2 perces kvíz | Megyeri Márk Máté',
            description: 'Pár kérdéssel megtudhatod, milyen weboldal illik a vállalkozásodhoz és mire érdemes figyelni – a végén ajánlatot is kérhetsz.',
        },
        '/konzultacio': {
            title: 'Online konzultáció weboldal készítéshez | Megyeri Márk Máté',
            description: 'Foglalj időpontot online konzultációra: átbeszéljük, milyen weboldal vagy webes rendszer segítené a vállalkozásodat.',
        },
        '/adatkezeles': { title: 'Adatkezelési tájékoztató | Megyeri Márk Máté', description: 'Hogyan kezelem a személyes adataidat az oldalon, az ajánlatkérésnél és a konzultációfoglalásnál.' },
        '/impresszum': { title: 'Impresszum | Megyeri Márk Máté', description: 'A weboldal üzemeltetőjének és a tárhelyszolgáltatónak az adatai.' },
        '/aszf': { title: 'Általános Szerződési Feltételek | Megyeri Márk Máté', description: 'A weboldal- és webfejlesztési szolgáltatás általános szerződési feltételei.' },
    },
    en: {
        '/': {
            title: 'Custom Website Design & Web Development | Márk Máté Megyeri',
            description: 'Freelance web developer building custom websites, web shops and web apps for businesses worldwide. Premium design, fast loading. Request a quote!',
        },
        '/tervezo': {
            title: 'Interactive Website Designer – Plan Your Website | Márk Máté Megyeri',
            description: 'Try the interactive website designer: pick a style, colours and features and see live what your business website could look like.',
        },
        '/ajanlatkeres': {
            title: 'Get a Website Design Quote | Márk Máté Megyeri',
            description: 'Request a tailored quote for a custom website, web shop or web application. It takes a few minutes and comes with no obligation.',
        },
        '/projekt-kviz': {
            title: 'What Website Does Your Business Need? 2-Minute Quiz | Márk Máté Megyeri',
            description: 'Answer a few questions to find out which kind of website fits your business and what to look out for – then request a quote.',
        },
        '/konzultacio': {
            title: 'Book an Online Website Consultation | Márk Máté Megyeri',
            description: 'Book an online video call to discuss which website or web application would help your business grow.',
        },
        '/adatkezeles': { title: 'Privacy Policy | Márk Máté Megyeri', description: 'How your personal data is handled on this site, in quote requests and consultation bookings.' },
        '/impresszum': { title: 'Legal Notice | Márk Máté Megyeri', description: 'Details of the website operator and the hosting provider.' },
        '/aszf': { title: 'Terms and Conditions | Márk Máté Megyeri', description: 'General terms and conditions of the website and web development service.' },
    },
};

/** Az oldal saját, nyelvhez tartozó címe (canonical, og:url): az angol változat a ?lang=en paraméteres cím. */
export const pageUrl = (path: string, lang: Lang) => SITE_URL + path + (lang === 'en' ? '?lang=en' : '');
