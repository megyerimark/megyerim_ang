#!/usr/bin/env node
/**
 * Build utáni statikus prerender a keresőknek (Rackhoston Node.js nélkül is működik: sima HTML fájlok).
 *
 * Minden nyilvános oldalhoz és nyelvhez (magyar + /en/) külön HTML készül a dist/…/browser/_p/ mappába:
 * - saját <title>, meta description, canonical, hreflang-párok, Open Graph adatok és <html lang>;
 * - oldalra szabott strukturált adat (JSON-LD);
 * - az oldal fő tartalma (H1, szövegek, belső linkek) az <app-root> elemen belül. Az Angular induláskor ezt
 *   lecseréli ugyanerre a tartalomra; a statikus változat a JavaScriptet nem futtató robotoknak szól, ezért
 *   vizuálisan rejtett (nincs villanás és elrendezés-ugrás). A szöveg ugyanaz, mint amit az oldal megjelenít.
 *
 * A .htaccess a /ajanlatkeres kérést a _p/ajanlatkeres.html fájlra irányítja, ha az létezik.
 *
 * Referenciák: a publikált projekteket az API-ból kéri le (PRERENDER_API_URL, alapértelmezés: az éles oldal).
 * Ha az API nem érhető el, a referenciák kimaradnak (az Angular futásidőben kezeli őket) – a build nem hibázik.
 * PRERENDER_SKIP_API=1: ne próbálja elérni az API-t.
 */
import { build } from 'esbuild';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist/megyeri-webfejlesztes/browser');
const outDir = join(dist, '_p');
const apiBase = (process.env.PRERENDER_API_URL || 'https://megyerimarkmate.hu/api').replace(/\/+$/, '');

// ---- A közös (Angular-mentes) TypeScript adatfájlok betöltése esbuilddel ----
const bundle = await build({
    stdin: {
        contents: `
            export * from './src/app/core/site-routes';
            export { PAGE_SEO, SITE_URL } from './src/app/core/seo';
            export { SERVICES } from './src/app/pages/service/service-content';
            export * from './src/app/pages/home/home-content';
            export { GUIDES } from './src/app/pages/guide/guide-content';
            export { GUIDES_EN } from './src/app/pages/guide/guide-content-en';
            export { GUIDES_INDEX_SEO, GUIDES_INDEX_SEO_EN } from './src/app/pages/guide/guide-seo';
            export { EN } from './src/app/i18n/en';
        `,
        resolveDir: root,
        loader: 'ts',
    },
    bundle: true, format: 'esm', platform: 'node', write: false, logLevel: 'silent',
});
const data = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const { PUBLIC_PAGES, CASE_PREFIX, PAGE_SEO, SITE_URL, SERVICES, EN, DEFAULT_HERO_HEADLINE, DEFAULT_HERO_DESCRIPTION, PROCESS_STEPS, FAQS, GUIDES, GUIDES_EN, GUIDE_KEYS, GUIDES_INDEX_SEO, GUIDES_INDEX_SEO_EN } = data;

const norm = (text) => text.replace(/\s+/g, ' ').trim();
const tr = (lang, text) => (lang === 'en' ? EN[norm(text)] ?? text : text);
const esc = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const abs = (path) => SITE_URL + (path === '/' ? '/' : path);
const pathOf = (key) => PUBLIC_PAGES.find((page) => page.key === key);
const link = (lang, key) => { const page = pathOf(key); return lang === 'en' && page.en ? page.en : page.hu; };
const clip = (text, max = 158) => (text.length > max ? text.slice(0, max - 1).replace(/\s+\S*$/, '') + '…' : text);

// ---- Élő adatok az API-ból (nem kötelező) ----
async function fetchJson(path) {
    if (process.env.PRERENDER_SKIP_API === '1') return null;
    try {
        const response = await fetch(apiBase + path, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return (await response.json()).data ?? null;
    } catch (error) {
        console.warn(`[prerender] ${apiBase + path} nem érhető el (${error.message}) – kimarad.`);
        return null;
    }
}
const [projectsRaw, settings] = await Promise.all([fetchJson('/projects'), fetchJson('/site-settings')]);
const projects = (Array.isArray(projectsRaw) ? projectsRaw : []).filter((p) => p.is_published && !p.is_demo && /^[a-z0-9-]{1,160}$/.test(p.slug));
const hasEnglishContent = (p) => !!(p.title_en?.trim() && p.summary_en?.trim());
const loc = (lang, obj, field) => (lang === 'en' && typeof obj[field + '_en'] === 'string' && obj[field + '_en'].trim() ? obj[field + '_en'] : obj[field] ?? '');

// ---- Közös HTML-sablon (az Angular build index.html-je) ----
const shell = await readFile(join(dist, 'index.html'), 'utf8');

const ORG_ID = SITE_URL + '/#business';
const crumbs = (lang, items) => ({
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: abs(item.path) })),
});

/** Egy oldal teljes HTML-je. alternates: { hu, en } útvonalak (en hiányozhat). */
function renderPage({ lang, path, alternates, title, description, body, jsonLd = [], ogType = 'website', image }) {
    const head = [
        `<title>${esc(title)}</title>`,
        `<meta name="description" content="${esc(description)}">`,
        `<link rel="canonical" href="${esc(abs(path))}">`,
        ...(alternates.en ? [
            `<link rel="alternate" hreflang="hu" href="${esc(abs(alternates.hu))}">`,
            `<link rel="alternate" hreflang="en" href="${esc(abs(alternates.en))}">`,
            `<link rel="alternate" hreflang="x-default" href="${esc(abs(alternates.hu))}">`,
        ] : []),
        `<meta property="og:url" content="${esc(abs(path))}">`,
        ...jsonLd.map((item) => `<script type="application/ld+json">${JSON.stringify(item).replace(/</g, '\\u003c')}</script>`),
    ].join('\n    ');

    let html = shell
        .replace(/<html lang="[^"]*">/, `<html lang="${lang}">`)
        .replace(/<title>[\s\S]*?<\/title>/, '')
        .replace(/<meta\s+name="description"[\s\S]*?>/, '')
        .replace(/<!-- Ez az alap \(shell\)[\s\S]*?-->\n?/, '')
        .replace(/(<meta property="og:type" content=")[^"]*(")/, `$1${ogType}$2`)
        .replace(/(<meta property="og:locale" content=")[^"]*(")/, `$1${lang === 'en' ? 'en_US' : 'hu_HU'}$2`)
        .replace(/(<meta property="og:locale:alternate" content=")[^"]*(")/, `$1${lang === 'en' ? 'hu_HU' : 'en_US'}$2`)
        .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
        .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(description)}$2`)
        .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
        .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${esc(description)}$2`)
        .replace('<meta charset="utf-8">', `<meta charset="utf-8">\n    ${head}`)
        .replace(/<app-root><\/app-root>/, `<app-root><div class="prerender-content">${body}</div></app-root>`);
    if (image) html = html.replace(/(<meta property="og:image:alt" content=")[^"]*(")/, `$1${esc(title)}$2`).replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${esc(image)}$2`).replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${esc(image)}$2`);
    return html;
}

const nav = (lang) => `<nav><a href="${link(lang, 'home')}">${esc(tr(lang, 'Főoldal'))}</a> · ${['service:web', 'service:landing', 'service:shop', 'service:app', 'service:care']
    .map((key) => `<a href="${link(lang, key)}">${esc(SERVICES[key.slice(8)].copy[lang].label)}</a>`).join(' · ')} · <a href="/utmutatok">${esc(tr(lang, 'Útmutatók'))}</a> · <a href="${link(lang, 'quote')}">${esc(tr(lang, 'Ajánlatkérés'))}</a> · <a href="${link(lang, 'consultation')}">${esc(tr(lang, 'Kapcsolat'))}</a></nav>`;
const footer = (lang) => `<footer><a href="${link(lang, 'privacy')}">${esc(tr(lang, 'Adatkezelési tájékoztató'))}</a> · <a href="${link(lang, 'terms')}">${esc(tr(lang, 'ÁSZF'))}</a> · <a href="${link(lang, 'imprint')}">${esc(tr(lang, 'Impresszum'))}</a></footer>`;
const wrap = (lang, main) => `${nav(lang)}<main>${main}</main>${footer(lang)}`;

/** Oldalanként saját megosztási kép (public/og/<kulcs>-<nyelv>.jpg), ha létezik; különben az alapértelmezett. */
const ogImage = (key, lang) => (existsSync(join(dist, 'og', `${key}-${lang}.jpg`)) ? `${SITE_URL}/og/${key}-${lang}.jpg` : undefined);

const pages = [];
const add = (file, html) => pages.push({ file, html });
const fileFor = (path) => (path === '/' ? 'index.html' : path.slice(1) + '.html');

// ---- Főoldal ----
for (const lang of ['hu', 'en']) {
    const page = pathOf('home');
    const custom = lang === 'hu' ? settings : null;
    const seo = PAGE_SEO[lang]['/'];
    const headlineRaw = settings?.hero_headline?.trim();
    const headline = !headlineRaw || headlineRaw === 'Prémium weboldalak, amelyek nemcsak szépek.' ? DEFAULT_HERO_HEADLINE : headlineRaw;
    const descRaw = settings?.hero_description?.trim();
    const heroDescription = !descRaw || ['Egyedi, modern weboldalak vállalkozásoknak.', 'Egyedi, modern weboldalakat készítek vállalkozásoknak – átgondolt dizájnnal és üzleti szemlélettel.'].includes(descRaw) ? DEFAULT_HERO_DESCRIPTION : descRaw;
    const faq = FAQS.map((item) => ({ q: tr(lang, item.question), a: tr(lang, item.answer) }));
    const body = wrap(lang, [
        `<h1>${esc(tr(lang, headline))}</h1>`,
        `<p>${esc(tr(lang, heroDescription))}</p>`,
        `<section><h2>${esc(tr(lang, 'Szolgáltatások'))}</h2><ul>${Object.entries(SERVICES).map(([key, def]) => `<li><a href="${link(lang, 'service:' + key)}">${esc(def.copy[lang].label)}</a> – ${esc(def.copy[lang].intro)}</li>`).join('')}</ul></section>`,
        projects.length ? `<section><h2>${esc(tr(lang, 'Megvalósult munkák'))}</h2><ul>${projects.map((p) => `<li><a href="${lang === 'en' && hasEnglishContent(p) ? CASE_PREFIX.en : CASE_PREFIX.hu}/${p.slug}">${esc(loc(lang, p, 'title'))}</a> – ${esc(loc(lang, p, 'summary'))}</li>`).join('')}</ul></section>` : '',
        `<section><h2>${esc(tr(lang, 'Munkafolyamat'))}</h2><ol>${PROCESS_STEPS.map((step) => `<li><h3>${esc(tr(lang, step.title))}</h3><p>${esc(tr(lang, step.description))}</p></li>`).join('')}</ol></section>`,
        `<section><h2>${esc(tr(lang, 'GYIK'))}</h2>${faq.map((item) => `<h3>${esc(item.q)}</h3><p>${esc(item.a)}</p>`).join('')}</section>`,
        `<p><a href="${link(lang, 'quote')}">${esc(tr(lang, 'Ajánlatot kérek'))}</a> · <a href="${link(lang, 'quiz')}">${esc(tr(lang, '2 perces igényfelmérő'))}</a> · <a href="${link(lang, 'studio')}">${esc(tr(lang, 'Weboldaltervező'))}</a></p>`,
    ].join(''));
    add(fileFor(lang === 'en' ? page.en : page.hu), renderPage({
        lang, path: lang === 'en' ? page.en : page.hu, alternates: { hu: page.hu, en: page.en },
        title: custom?.meta_title || seo.title, description: custom?.meta_description || seo.description, body,
        image: settings?.og_image_url || ogImage('home', lang),
        jsonLd: [{
            '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: lang,
            mainEntity: faq.map((item) => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })),
        }],
    }));
}

// ---- Szolgáltatási céloldalak ----
for (const [key, def] of Object.entries(SERVICES)) {
    const page = pathOf('service:' + key);
    for (const lang of ['hu', 'en']) {
        const c = def.copy[lang];
        const path = lang === 'en' ? page.en : page.hu;
        const quote = link(lang, 'quote') + (def.quoteType ? `?type=${def.quoteType}` : '');
        const body = wrap(lang, [
            `<p>${esc(tr(lang, 'Főoldal'))} / ${esc(tr(lang, 'Szolgáltatások'))} / ${esc(c.label)}</p>`,
            `<h1>${esc(c.h1)}</h1><p>${esc(c.intro)}</p>`,
            `<p><a href="${quote}">${esc(tr(lang, 'Ajánlatot kérek'))}</a> · <a href="${link(lang, 'consultation')}">${esc(tr(lang, 'Konzultációt foglalok'))}</a></p>`,
            `<section><h2>${esc(c.problemsTitle)}</h2><ul>${c.problems.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></section>`,
            `<section><h2>${esc(c.includedTitle)}</h2>${c.included.map((item) => `<h3>${esc(item.title)}</h3><p>${esc(item.text)}</p>`).join('')}</section>`,
            `<section><h2>${esc(c.processTitle)}</h2><ol>${c.process.map((item) => `<li><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p></li>`).join('')}</ol></section>`,
            projects.length ? `<section><h2>${esc(tr(lang, 'Megvalósult munkák'))}</h2><ul>${projects.slice(0, 3).map((p) => `<li><a href="${lang === 'en' && hasEnglishContent(p) ? CASE_PREFIX.en : CASE_PREFIX.hu}/${p.slug}">${esc(loc(lang, p, 'title'))}</a></li>`).join('')}</ul></section>` : '',
            `<section><h2>${esc(c.faqTitle)}</h2>${c.faq.map((item) => `<h3>${esc(item.q)}</h3><p>${esc(item.a)}</p>`).join('')}</section>`,
            `<section><h2>${esc(c.ctaTitle)}</h2><p>${esc(c.ctaText)}</p><p><a href="${quote}">${esc(tr(lang, 'Ajánlatot kérek'))}</a></p></section>`,
        ].join(''));
        add(fileFor(path), renderPage({
            lang, path, alternates: { hu: page.hu, en: page.en }, title: c.seoTitle, description: c.seoDescription, body,
            image: ogImage('service-' + key, lang),
            jsonLd: [
                {
                    '@context': 'https://schema.org', '@type': 'Service', name: c.label, description: c.seoDescription,
                    url: abs(path), inLanguage: lang, serviceType: c.label, areaServed: [{ '@type': 'Country', name: 'Hungary' }, { '@type': 'Place', name: 'Worldwide' }],
                    provider: { '@type': 'ProfessionalService', '@id': ORG_ID, name: 'Megyeri Márk Máté | Webfejlesztés', url: SITE_URL + '/' },
                },
                crumbs(lang, [{ name: tr(lang, 'Főoldal'), path: link(lang, 'home') }, { name: c.label, path }]),
            ],
        }));
    }
}

// ---- Egyéb nyilvános oldalak (tervező, ajánlatkérés, kvíz, konzultáció, jogi oldalak) ----
// A H1 darabjai pontosan úgy, ahogy az oldal sablonja kiírja (a fordítás darabonként történik, mint a | t pipe-nál).
const H1 = {
    studio: ['Alakítsd a saját', 'weboldalad', 'világát.'],
    quote: ['Mesélj a', 'projektedről.'],
    quiz: ['Találjuk meg a', 'hozzád illő weboldalt.'],
    consultation: ['Beszéljünk a projektedről.'],
    privacy: ['Adatkezelési tájékoztató'],
    imprint: ['Impresszum'],
    terms: ['Általános Szerződési Feltételek'],
};
// A jogi oldalak angol szövege nem a szótárból, hanem a sablon angol ágából jön.
const H1_EN = { privacy: 'Privacy Notice', imprint: 'Legal notice', terms: 'General Terms and Conditions' };
for (const [key, h1] of Object.entries(H1)) {
    const page = pathOf(key);
    for (const lang of page.en ? ['hu', 'en'] : ['hu']) {
        const path = lang === 'en' ? page.en : page.hu;
        const seo = PAGE_SEO[lang][page.hu];
        const heading = lang === 'en' && H1_EN[key] ? H1_EN[key] : h1.map((piece) => tr(lang, piece)).join(' ');
        add(fileFor(path), renderPage({
            lang, path, alternates: { hu: page.hu, en: page.en }, title: seo.title, description: seo.description,
            body: wrap(lang, `<h1>${esc(heading)}</h1><p>${esc(seo.description)}</p>`),
            image: ogImage(key, lang) ?? ogImage('home', lang),
            jsonLd: [crumbs(lang, [{ name: tr(lang, 'Főoldal'), path: link(lang, 'home') }, { name: heading, path }])],
        }));
    }
}

// ---- Útmutatók (magyarul és angolul) ----
for (const lang of ['hu', 'en']) {
    const content = lang === 'en' ? GUIDES_EN : GUIDES;
    const indexSeo = lang === 'en' ? GUIDES_INDEX_SEO_EN : GUIDES_INDEX_SEO;
    const index = pathOf('guides');
    const indexPath = lang === 'en' ? index.en : index.hu;
    const guidesName = tr(lang, 'Útmutatók');
    const home = { name: tr(lang, 'Főoldal'), path: link(lang, 'home') };
    add(fileFor(indexPath), renderPage({
        lang, path: indexPath, alternates: { hu: index.hu, en: index.en }, title: indexSeo.title, description: indexSeo.description,
        image: ogImage('guides', lang),
        body: wrap(lang, `<h1>${esc(tr(lang, 'Útmutatók weboldal készítéshez'))}</h1><ul>${GUIDE_KEYS.map((key) => `<li><a href="${link(lang, 'guide:' + key)}">${esc(content[key].h1)}</a> – ${esc(content[key].seoDescription)}</li>`).join('')}</ul>`),
        jsonLd: [crumbs(lang, [home, { name: guidesName, path: indexPath }])],
    }));
    for (const key of GUIDE_KEYS) {
        const g = content[key];
        const page = pathOf('guide:' + key);
        const path = lang === 'en' ? page.en : page.hu;
        const body = wrap(lang, [
            `<p>${esc(home.name)} / ${esc(guidesName)} / ${esc(g.label)}</p>`,
            `<article><h1>${esc(g.h1)}</h1><p>${esc(g.intro)}</p>`,
            ...g.sections.map((s) => `<section><h2>${esc(s.h2)}</h2>${s.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}${s.list?.length ? `<ul>${s.list.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}</section>`),
            `<section><h2>${esc(tr(lang, 'Gyakori kérdések'))}</h2>${g.faq.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join('')}</section>`,
            `<p><a href="${link(lang, 'service:' + g.related)}">${esc(SERVICES[g.related].copy[lang].label)}</a> · <a href="${link(lang, 'quote')}">${esc(tr(lang, 'Ajánlatot kérek'))}</a></p></article>`,
        ].join(''));
        add(fileFor(path), renderPage({
            lang, path, alternates: { hu: page.hu, en: page.en }, title: g.seoTitle, description: g.seoDescription, body, ogType: 'article',
            image: ogImage('guide-' + key, lang),
            jsonLd: [
                {
                    '@context': 'https://schema.org', '@type': 'Article', headline: g.h1, description: g.seoDescription, inLanguage: lang,
                    datePublished: g.updated, dateModified: g.updated, mainEntityOfPage: abs(path),
                    image: ogImage('guide-' + key, lang) ?? SITE_URL + '/og-image.jpg',
                    author: { '@type': 'Person', name: tr(lang, 'Megyeri Márk Máté'), url: SITE_URL + '/' },
                    publisher: { '@type': 'Organization', '@id': ORG_ID, name: 'Megyeri Márk Máté | Webfejlesztés', logo: { '@type': 'ImageObject', url: SITE_URL + '/apple-touch-icon.png' } },
                },
                {
                    '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: lang,
                    mainEntity: g.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
                },
                crumbs(lang, [home, { name: guidesName, path: indexPath }, { name: g.label, path }]),
            ],
        }));
    }
}

// ---- Referenciák ----
for (const p of projects) {
    for (const lang of hasEnglishContent(p) ? ['hu', 'en'] : ['hu']) {
        const path = `${CASE_PREFIX[lang]}/${p.slug}`;
        const title = `${loc(lang, p, 'title')} – ${tr(lang, 'Weboldal referencia')} | ${tr(lang, 'Megyeri Márk Máté')}`;
        const summary = loc(lang, p, 'summary');
        const description = loc(lang, p, 'description');
        const results = Array.isArray(p.results) ? p.results : [];
        const body = wrap(lang, [
            `<h1>${esc(loc(lang, p, 'title'))}</h1><p>${esc(summary)}</p>`,
            p.technologies?.length ? `<ul>${p.technologies.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '',
            results.length ? `<section><h2>${esc(tr(lang, 'EREDMÉNYEK'))}</h2><ul>${results.map((r) => `<li>${esc(r.value)} – ${esc(r.label)}</li>`).join('')}</ul></section>` : '',
            description ? `<section><h2>${esc(tr(lang, 'A projekt részletei'))}</h2><p>${esc(description)}</p></section>` : '',
            `<p><a href="${link(lang, 'quote')}">${esc(tr(lang, 'Ajánlatot kérek'))}</a></p>`,
        ].join(''));
        add(fileFor(path), renderPage({
            lang, path, alternates: { hu: `${CASE_PREFIX.hu}/${p.slug}`, en: hasEnglishContent(p) ? `${CASE_PREFIX.en}/${p.slug}` : null },
            title, description: clip(summary), body, ogType: 'article', image: p.cover_image_url || undefined,
            jsonLd: [
                {
                    '@context': 'https://schema.org', '@type': 'CreativeWork', name: loc(lang, p, 'title'), description: summary, url: abs(path), inLanguage: lang,
                    ...(p.cover_image_url ? { image: p.cover_image_url } : {}), ...(p.technologies?.length ? { keywords: p.technologies.join(', ') } : {}),
                    creator: { '@type': 'Person', name: 'Megyeri Márk Máté', url: SITE_URL + '/' },
                },
                crumbs(lang, [{ name: tr(lang, 'Főoldal'), path: link(lang, 'home') }, { name: loc(lang, p, 'title'), path }]),
            ],
        }));
    }
}

// ---- Kiírás ----
await rm(outDir, { recursive: true, force: true });
for (const { file, html } of pages) {
    const target = join(outDir, file);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, html);
}
console.log(`[prerender] ${pages.length} oldal elkészült (${projects.length} referencia) → ${outDir}`);
