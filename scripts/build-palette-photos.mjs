#!/usr/bin/env node
/**
 * A lila égboltos háttérfotók témaváltozatai – `npm run palettes:photos`
 * public/aurora-cinematic-<fotó>.webp → public/palettes/photos/<fotó>-<téma>.webp
 * A téma `photo` CSS-szűrőjét (scripts/build-palettes.mjs) böngészővásznon alkalmazza, így pontosan az lesz,
 * amit a böngésző mutatna. Playwright kell hozzá (Chromium); a kész képek a repóban vannak, csak egy téma
 * fotószűrőjének módosításakor kell újrafuttatni.
 */
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PALETTES, PHOTOS } from './build-palettes.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'palettes', 'photos');
const { chromium } = createRequire(import.meta.url)('playwright');

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
for (const photo of PHOTOS) {
    const src = 'data:image/webp;base64,' + readFileSync(join(ROOT, 'public', `aurora-cinematic-${photo}.webp`)).toString('base64');
    for (const [name, theme] of Object.entries(PALETTES)) {
        if (!theme) continue;
        const data = await page.evaluate(async ({ src, filter }) => {
            const img = new Image(); img.src = src; await img.decode();
            const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
            const ctx = c.getContext('2d'); ctx.filter = filter; ctx.drawImage(img, 0, 0);
            return c.toDataURL('image/webp', 0.82).split(',')[1];
        }, { src, filter: theme.photo });
        writeFileSync(join(OUT, `${photo}-${name}.webp`), Buffer.from(data, 'base64'));
        console.log(`${photo}-${name}.webp`);
    }
}
await browser.close();
