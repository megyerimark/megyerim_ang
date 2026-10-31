#!/usr/bin/env node
/**
 * Témagenerátor – `npm run palettes`
 *
 * A forrásban a márkaszínek CSS-változók: var(--k-8e78ff) vagy áttetszőséggel var(--k-8e78ff-55).
 * Ez a szkript összegyűjti őket, és legenerálja:
 *  - src/palettes.generated.scss  → az alaptéma (DEFAULT_PALETTE) a :root-on – ez a fő stíluslapba kerül
 *  - public/palettes/<név>.css    → a többi téma, :root[data-palette='<név>'] alatt; csak az aktív töltődik be
 * Az „aurora” téma az eredeti (korábbi lila) színeket adja vissza, pixelre azonosan; a többit
 * OKLCH-színtérben számolja át a téma leírása szerint.
 *
 * A színeket „családokba” soroljuk (sötét háttér, világos tónus, lila, levendula-kék, égkék), és
 * családonként adjuk meg a cél-árnyalatot és a telítettség szorzóját. Így minden árnyalat, áttetszőség és
 * ragyogás arányos marad, és egy új téma néhány számból áll. A generált fájlt kézzel ne szerkeszd.
 */
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const OUT = join(SRC, 'palettes.generated.scss');
const PUBLIC_DIR = join(ROOT, 'public', 'palettes');
/** Ez a téma kerül a fő stíluslapba (az oldal alapértelmezése, a backend site_palette alapértéke is). */
export const DEFAULT_PALETTE = 'cobalt';

/* ---------- témák ----------
 * family: { h: cél-árnyalat (OKLCH fok), c: telítettség-szorzó, spread: a családon belüli eltérések megtartása (0–1),
 *           l: világosság-eltolás (opcionális) }
 * photo: CSS filter, amellyel a lila égboltos háttérfotók témaváltozata készül
 *        (scripts/build-palette-photos.mjs → public/palettes/photos/<fotó>-<téma>.webp). */
export const PALETTES = {
    aurora: null, // az eredeti színek
    // Kobalt: mély éjfekete-kék alap, kobaltkék (#4263FF) elsődleges és cián (#00D9FF) kiemelés – lila nélkül.
    cobalt: {
        photo: 'grayscale(1) sepia(1) hue-rotate(185deg) saturate(3.2) brightness(.85) contrast(1.15)',
        dark: { h: 266, c: .9, spread: .2 }, light: { h: 264, c: .4, spread: 0 },
        violet: { h: 268, c: 1.45, spread: .15, l: -.08 }, blue: { h: 266, c: 1.05, spread: .3 }, sky: { h: 220, c: 1.3, spread: .3 },
    },
    nightblue: {
        photo: 'hue-rotate(-32deg) saturate(.85)',
        dark: { h: 258, c: 1, spread: .3 }, light: { h: 250, c: .9, spread: .3 },
        violet: { h: 250, c: .55, spread: .3, l: .05 }, blue: { h: 245, c: .6, spread: .3, l: .04 }, sky: { h: 232, c: .7, spread: .4 },
    },
    graphite: {
        photo: 'saturate(.2) sepia(.35) brightness(.92)',
        dark: { h: 70, c: .14, spread: 0 }, light: { h: 85, c: .55, spread: 0 },
        violet: { h: 82, c: .42, spread: .2 }, blue: { h: 84, c: .32, spread: .2 }, sky: { h: 80, c: .28, spread: .2 },
    },
    christmas: {
        photo: 'hue-rotate(-145deg) saturate(.9)',
        dark: { h: 172, c: .55, spread: .2 }, light: { h: 95, c: .6, spread: .2 },
        violet: { h: 84, c: .58, spread: .2 }, blue: { h: 158, c: .6, spread: .3 }, sky: { h: 164, c: .55, spread: .3 },
    },
    easter: {
        photo: 'hue-rotate(-165deg) saturate(.7) brightness(1.05)',
        dark: { h: 212, c: .8, spread: .2 }, light: { h: 105, c: .6, spread: .2 },
        violet: { h: 142, c: .62, spread: .3, l: .02 }, blue: { h: 98, c: .72, spread: .2 }, sky: { h: 122, c: .6, spread: .3 },
    },
    valentine: {
        photo: 'hue-rotate(48deg) saturate(.85)',
        dark: { h: 350, c: .75, spread: .2 }, light: { h: 15, c: .6, spread: .2 },
        violet: { h: 8, c: .85, spread: .3 }, blue: { h: 16, c: .6, spread: .3 }, sky: { h: 22, c: .5, spread: .3 },
    },
    national: {
        photo: 'saturate(.4)',
        dark: { h: 262, c: .5, spread: .2 }, light: { h: 265, c: .2, spread: 0 },
        // a piros a fő hangsúly, a zöld csak visszafogottan (a gombok átmenete ne legyen „közlekedési lámpa”)
        violet: { h: 27, c: 1, spread: .2 }, blue: { h: 18, c: .55, spread: .2 }, sky: { h: 150, c: .42, spread: .2 },
    },
};
const CENTER = { dark: 270, light: 270, violet: 300, blue: 270, sky: 235 };
/** A public/aurora-cinematic-<név>.webp háttérfotók, amelyeknek témánként átszínezett változata van. */
export const PHOTOS = ['coast', 'architecture'];

/* ---------- OKLCH ↔ sRGB (Björn Ottosson, OKLab) ---------- */
const lin = c => (c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const gam = c => { const v = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; return Math.round(Math.min(1, Math.max(0, v)) * 255); };
export function toOklch(hex) {
    const [r, g, b] = [0, 2, 4].map(i => lin(parseInt(hex.slice(i, i + 2), 16)));
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
    const A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
    const B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
    return { L, C: Math.hypot(A, B), h: (Math.atan2(B, A) * 180 / Math.PI + 360) % 360 };
}
function rawRgb(L, C, h) {
    const A = C * Math.cos(h * Math.PI / 180), B = C * Math.sin(h * Math.PI / 180);
    const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3, m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3, s = (L - 0.0894841775 * A - 1.2914855480 * B) ** 3;
    return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
}
/** A színtérből kilógó színnél a telítettséget csökkentjük; a világosság és az árnyalat marad. */
export function fromOklch(L, C, h) {
    const ok = v => v.every(x => x >= -0.0005 && x <= 1.0005);
    let rgb = rawRgb(L, C, h);
    if (!ok(rgb)) {
        let lo = 0, hi = C;
        for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (ok(rawRgb(L, mid, h))) lo = mid; else hi = mid; }
        rgb = rawRgb(L, lo, h);
    }
    return rgb.map(x => gam(x).toString(16).padStart(2, '0')).join('');
}

/** Márkaszín-e (a lila–kék–égkék tartomány); a semleges és a jelzőszínek (zöld, piros, sárga) maradnak. */
export const isBrand = hex => { const o = toOklch(hex); return o.C >= 0.012 && o.h >= 195 && o.h <= 335; };
export function family({ L, h }) {
    if (L < 0.3) return 'dark';
    if (L > 0.92) return 'light';
    return h >= 285 ? 'violet' : h >= 255 ? 'blue' : 'sky';
}
export function transform(hex, theme) {
    const o = toOklch(hex), fam = family(o), t = theme[fam];
    const h = (t.h + (o.h - CENTER[fam]) * t.spread + 360) % 360;
    return fromOklch(Math.min(1, Math.max(0, o.L + (t.l ?? 0))), o.C * t.c, h);
}

/**
 * Világos mód (html[data-theme='light']): ugyanazok a márkaszín-változók világos felületre átszámolva.
 * Sötét háttér → világos felület, világos szöveg → sötét tinta, semleges középtónus (halvány szöveg, keret) → tükrözve,
 * telített kiemelés → legfeljebb közepes világosság (fehéren is olvasható). Az áttetszőség marad.
 */
export function toLight(hex) {
    const o = toOklch(hex), clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    if (o.L < 0.3) return fromOklch(clamp(0.97 + (o.L - 0.14) * 0.4, 0.95, 1), Math.min(o.C, 0.012), o.h);
    if (o.L > 0.88) return fromOklch(0.2 + (1 - o.L) * 0.8, Math.max(0.03, o.C * 0.8), o.C < 0.02 ? 266 : o.h);
    if (o.C < 0.07) return fromOklch(clamp(1.06 - 0.7 * o.L, 0.42, 0.74), o.C, o.h);
    return fromOklch(Math.min(o.L, 0.6), o.C, o.h);
}

/* ---------- forrás bejárása, generálás ---------- */
function collectTokens() {
    const tokens = new Set();
    (function walk(dir) {
        for (const name of readdirSync(dir)) {
            const p = join(dir, name);
            if (statSync(p).isDirectory()) walk(p);
            else if (/\.(scss|html|ts)$/.test(name) && p !== OUT) for (const m of readFileSync(p, 'utf8').matchAll(/var\(--k-([0-9a-f]{6})(?:-([0-9a-f]{2}))?\)/g)) tokens.add(m[0].slice(4, -1));
        }
    })(SRC);
    return [...tokens].sort();
}

function main() {
    const tokens = collectTokens();
    const value = (token, theme) => {
        const [, hex, alpha] = token.match(/^--k-([0-9a-f]{6})(?:-([0-9a-f]{2}))?$/);
        return '#' + (theme ? transform(hex, theme) : hex) + (alpha ?? '');
    };
    const head = '/* GENERÁLT FÁJL – ne szerkeszd kézzel. Forrás: scripts/build-palettes.mjs (npm run palettes) */\n';
    // a háttérfotók témaváltozata (az aurora az eredeti fotókat használja)
    const photos = name => PHOTOS.map(ph => `  --mm-photo-${ph}: url('${name === 'aurora' ? `/aurora-cinematic-${ph}.webp` : `/palettes/photos/${ph}-${name}.webp`}');`).join('\n');
    const block = (selector, theme, name) => `${selector} {\n${photos(name)}\n`
        + tokens.map(t => `  ${t}: ${value(t, theme)};`).join('\n') + '\n}\n';
    // világos módban is sötéten maradó előnézetek (pl. egy sötét weboldal bemutatója): az eredeti sötét értékek
    const darkBlock = (selector, theme) => `${selector} {\n` + tokens.map(t => `  ${t}: ${value(t, theme)};`).join('\n') + '\n}\n';
    // a világos mód változatai: a téma színeiből számolva, az áttetszőség megtartásával
    const lightBlock = (selector, theme) => `${selector} {\n` + tokens.map(t => {
        const v = value(t, theme); return `  ${t}: #${toLight(v.slice(1, 7))}${v.slice(7)};`;
    }).join('\n') + '\n}\n';
    writeFileSync(OUT, head + `/* Alaptéma: ${DEFAULT_PALETTE}. ${tokens.length} márkaszín-változó. */\n` + block(':root', PALETTES[DEFAULT_PALETTE], DEFAULT_PALETTE)
        + lightBlock(":root[data-theme='light']", PALETTES[DEFAULT_PALETTE])
        + darkBlock(":root[data-theme='light'] .mm-keep-dark", PALETTES[DEFAULT_PALETTE]));
    mkdirSync(PUBLIC_DIR, { recursive: true });
    for (const [name, theme] of Object.entries(PALETTES)) {
        if (name !== DEFAULT_PALETTE) writeFileSync(join(PUBLIC_DIR, `${name}.css`), head + block(`:root[data-palette='${name}']`, theme, name)
            + lightBlock(`:root[data-palette='${name}'][data-theme='light']`, theme)
            + darkBlock(`:root[data-palette='${name}'][data-theme='light'] .mm-keep-dark`, theme));
    }
    console.log(`${tokens.length} változó; alaptéma: ${DEFAULT_PALETTE}; külön fájl: ${Object.keys(PALETTES).filter(n => n !== DEFAULT_PALETTE).join(', ')}`);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) main();
