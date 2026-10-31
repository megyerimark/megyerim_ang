/**
 * A nyilvános oldalak magyar és angol címe (URL-je) egy helyen.
 *
 * - Magyar: a gyökérben (/ajanlatkeres), angol: az /en/ alatt, angol slugokkal (/en/request-a-quote).
 * - en: null = az oldal csak magyarul létezik (nincs angol URL-je): a nyelve a látogató aktuális nyelve marad.
 * - A privát oldalak (admin, ügyfélportál, fizetés, hírlevél) nyelve szintén nem az URL-ből jön.
 *
 * FONTOS: ez a fájl futásidejű importot nem tartalmazhat (csak `import type`-ot), mert a build utáni
 * prerender-szkript (scripts/prerender.mjs) közvetlenül, Node-ból is betölti.
 */
export type Lang = 'hu' | 'en';

export interface PageRoute {
    /** Belső azonosító (pl. a prerender és az oldaltérkép használja). */
    key: string;
    hu: string;
    /** null: csak magyarul létezik. */
    en: string | null;
}

export const SERVICE_KEYS = ['web', 'landing', 'shop', 'app', 'care'] as const;
export type ServiceKey = (typeof SERVICE_KEYS)[number];

export const PUBLIC_PAGES: PageRoute[] = [
    { key: 'home', hu: '/', en: '/en' },
    { key: 'service:web', hu: '/weboldal-keszites', en: '/en/website-development' },
    { key: 'service:landing', hu: '/landing-oldal-keszites', en: '/en/landing-page-design' },
    { key: 'service:shop', hu: '/webshop-keszites', en: '/en/webshop-development' },
    { key: 'service:app', hu: '/egyedi-webfejlesztes', en: '/en/custom-web-development' },
    { key: 'service:care', hu: '/weboldal-karbantartas', en: '/en/website-maintenance' },
    { key: 'studio', hu: '/tervezo', en: '/en/website-planner' },
    { key: 'quote', hu: '/ajanlatkeres', en: '/en/request-a-quote' },
    { key: 'quiz', hu: '/projekt-kviz', en: '/en/project-quiz' },
    { key: 'consultation', hu: '/konzultacio', en: '/en/consultation' },
    { key: 'privacy', hu: '/adatkezeles', en: '/en/privacy-policy' },
    { key: 'imprint', hu: '/impresszum', en: '/en/legal-notice' },
    { key: 'terms', hu: '/aszf', en: '/en/terms' },
];

/** Referenciaoldalak előtagja nyelvenként: /munkak/:slug ↔ /en/work/:slug */
export const CASE_PREFIX: Record<Lang, string> = { hu: '/munkak', en: '/en/work' };

const byHu = new Map(PUBLIC_PAGES.map(page => [page.hu, page]));
const byEn = new Map(PUBLIC_PAGES.filter(page => page.en).map(page => [page.en as string, page]));

/** Útvonal a lekérdezés és a horgony nélkül, záró perjel nélkül ('/' marad). */
export const cleanPath = (url: string): string => {
    const path = url.split(/[?#]/)[0] || '/';
    return path.length > 1 ? path.replace(/\/+$/, '') || '/' : path;
};

/** Bármely (magyar vagy angol) nyilvános útvonal magyar megfelelője; ismeretlen útvonal változatlanul marad. */
export function toHuPath(url: string): string {
    const path = cleanPath(url);
    const page = byEn.get(path);
    if (page) return page.hu;
    if (path.startsWith(CASE_PREFIX.en + '/')) return CASE_PREFIX.hu + path.slice(CASE_PREFIX.en.length);
    return path;
}

/** Az URL által meghatározott nyelv. null: az oldal nyelve nem az URL-ből jön (jogi és privát oldalak). */
export function langOfPath(url: string): Lang | null {
    const path = cleanPath(url);
    if (path === '/en' || path.startsWith('/en/')) return 'en';
    const page = byHu.get(path);
    if (page) return page.en ? 'hu' : null;
    if (path.startsWith(CASE_PREFIX.hu + '/')) return 'hu';
    return null;
}

/** Van-e az oldalnak angol változata (a jogi oldalaknak és a privát oldalaknak nincs). */
export function hasEnglish(url: string): boolean {
    const hu = toHuPath(url);
    const page = byHu.get(hu);
    if (page) return !!page.en;
    return hu.startsWith(CASE_PREFIX.hu + '/');
}

/**
 * Egy magyar (vagy már angol) útvonal adott nyelvű változata. Ha az oldalnak nincs angol változata,
 * a magyar útvonalat adja vissza. Megőrzi a lekérdezést és a horgonyt.
 */
export function localizePath(url: string, lang: Lang): string {
    const match = /^([^?#]*)(.*)$/.exec(url) ?? ['', url, ''];
    const hu = toHuPath(match[1] || '/');
    const rest = match[2] ?? '';
    if (lang === 'hu') return hu + rest;
    const page = byHu.get(hu);
    if (page) return (page.en ?? page.hu) + rest;
    if (hu.startsWith(CASE_PREFIX.hu + '/')) return CASE_PREFIX.en + hu.slice(CASE_PREFIX.hu.length) + rest;
    return hu + rest;
}

/** Nyilvános (indexelhető) oldal-e: ismert oldal vagy referencia. */
export function isPublicPath(url: string): boolean {
    const hu = toHuPath(url);
    return byHu.has(hu) || /^\/munkak\/[a-z0-9-]{1,160}$/.test(hu);
}
