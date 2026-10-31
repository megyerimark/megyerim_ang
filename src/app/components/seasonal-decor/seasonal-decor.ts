import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { PaletteService, Season } from '../../core/palette.service';
import { toHuPath } from '../../core/site-routes';

interface Particle { x: number; size: number; dur: number; delay: number; drift: number; tone: number; }
interface Tree { x: number; h: number; back: boolean; src: string; flip: boolean; decorated: boolean; low: boolean; }
interface Tulip { x: number; h: number; src: string; sway: number; delay: number; }
interface Egg { x: number; size: number; tilt: number; src: string; }

/** Determinisztikus „véletlen” (minden betöltéskor ugyanaz az elrendezés, nincs ugrálás). */
function rng(seed: number) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }

/**
 * Ünnepi díszítés a nyilvános oldalakon (az aktív ünnepi témához):
 *  részecskék – karácsony: hóesés, húsvét: szirmok, Valentin-nap: apró szívek (minden nyilvános oldalon)
 *  jelenet a főoldal első képernyőjének alján – karácsony: havas fenyőerdő pislákoló égőkkel és csillaggal,
 *    húsvét: ringatózó tulipánok és hímes tojások a fűben, nemzeti ünnep: kokárda (+ nemzeti szalag felül)
 * Nem fog meg kattintást, nem takarja a szöveget; a részecskék két képernyő után elhalványulnak,
 * csökkentett mozgásnál nincs részecske és a jelenet is mozdulatlan.
 */
@Component({
    selector: 'app-seasonal-decor',
    standalone: true,
    templateUrl: './seasonal-decor.html',
    styleUrl: './seasonal-decor.scss',
})
export class SeasonalDecor {
    private readonly palette = inject(PaletteService);
    readonly season = this.palette.decoration;
    readonly faded = signal(false);
    private readonly reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    private readonly router = inject(Router);
    /** A jelenet csak a főoldalon (az űrlapos oldalakon ne legyen díszlet a mezők körül). */
    readonly onHome = toSignal(this.router.events.pipe(filter(e => e instanceof NavigationEnd), map(() => this.isHome())), { initialValue: this.isHome() });

    readonly particles = computed<Particle[]>(() => {
        const s = this.season();
        if (!s || s === 'national' || this.reduced) return [];
        const count: Record<Exclude<Season, 'national'>, number> = { christmas: 34, easter: 16, valentine: 11 };
        const r = rng(7);
        return Array.from({ length: count[s] }, () => ({
            x: r() * 100,
            size: s === 'christmas' ? 2 + r() * 4 : s === 'easter' ? 7 + r() * 7 : 8 + r() * 8,
            dur: s === 'christmas' ? 10 + r() * 12 : s === 'easter' ? 13 + r() * 10 : 14 + r() * 10,
            delay: -r() * 22,
            drift: (r() - .5) * (s === 'christmas' ? 80 : 160),
            tone: r(),
        }));
    });

    /** Fenyőerdő (public/seasonal, scripts/build-seasonal-art.mjs): hátsó, halványabb sor és első sor; egy díszfa. */
    readonly trees = computed<Tree[]>(() => {
        const r = rng(11), out: Tree[] = [], kinds = ['fir-a', 'fir-b', 'fir-c'];
        for (const back of [true, false]) {
            const n = back ? 9 : 6;
            for (let i = 0; i < n; i++) {
                out.push({ x: (i + .2 + r() * .6) / n * 100, h: back ? 88 + r() * 40 : 118 + r() * 50, back,
                    src: `/seasonal/${kinds[Math.floor(r() * kinds.length)]}.webp`, flip: r() < .5, decorated: false, low: false });
            }
        }
        // a díszfa jobbra, a szöveg és a gombok alatti területen kívül
        out.push({ x: 80, h: 168, back: false, src: '/seasonal/fir-decorated.webp', flip: false, decorated: true, low: false });
        // a bal oldalon (asztali nézetben a szöveg és a gombok alatt) alacsonyabb fák
        for (const t of out) t.low = t.x < 46;
        return out;
    });

    readonly tulips = computed<Tulip[]>(() => {
        const r = rng(23), colors = ['red', 'yellow', 'pink', 'purple', 'orange', 'white'];
        return Array.from({ length: 15 }, (_, i) => ({
            x: (i + .15 + r() * .7) / 15 * 100, h: 92 + r() * 44, src: `/seasonal/tulip-${colors[Math.floor(r() * colors.length)]}.svg`,
            sway: 1.5 + r() * 2.5, delay: -r() * 4,
        }));
    });

    /** Hímes tojások népi színekkel és mintákkal. */
    readonly eggs: Egg[] = [
        { x: 11, size: 40, tilt: -12, src: '/seasonal/egg-red.svg' },
        { x: 36, size: 34, tilt: 9, src: '/seasonal/egg-blue.svg' },
        { x: 61, size: 44, tilt: -5, src: '/seasonal/egg-yellow.svg' },
        { x: 86, size: 37, tilt: 13, src: '/seasonal/egg-green.svg' },
    ];

    constructor() {
        const onScroll = () => this.faded.set(scrollY > innerHeight * 1.6);
        addEventListener('scroll', onScroll, { passive: true });
        inject(DestroyRef).onDestroy(() => removeEventListener('scroll', onScroll));
    }

    private isHome(): boolean { return toHuPath(this.router.url) === '/'; }
}
