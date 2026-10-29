import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { PaletteService, Season } from '../../core/palette.service';

interface Particle { x: number; size: number; dur: number; delay: number; drift: number; tone: number; }
interface Tree { x: number; h: number; back: boolean; star: boolean; lights: { cx: number; cy: number; c: string; d: number }[]; }
interface Tulip { x: number; h: number; color: string; sway: number; delay: number; }
interface Egg { x: number; size: number; tilt: number; base: string; ink: string; pattern: 'zigzag' | 'dots' | 'waves' | 'stripes'; }

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

    /** Fenyőerdő: hátsó (kisebb, sötétebb) és első sor; a legnagyobb első soros fán csillag. */
    readonly trees = computed<Tree[]>(() => {
        const r = rng(11), out: Tree[] = [];
        const lightColors = ['#f5d27a', '#ffe9b3', '#e0565b', '#f5d27a'];
        for (const back of [true, false]) {
            const n = back ? 16 : 11;
            for (let i = 0; i < n; i++) {
                const h = back ? 52 + r() * 34 : 70 + r() * 60;
                // égők a fa szintjein (a 100×160-as fa-koordinátákban)
                const lights = back ? [] : Array.from({ length: 5 }, (_, k) => {
                    const tier = [40, 62, 84, 104, 120][k], half = [10, 16, 22, 30, 36][k];
                    return { cx: 50 + (r() * 2 - 1) * half, cy: tier, c: lightColors[Math.floor(r() * lightColors.length)], d: r() * 3 };
                });
                out.push({ x: (i + r() * .7) / n * 100 - 3, h, back, star: false, lights });
            }
        }
        const front = out.filter(t => !t.back);
        front.reduce((a, b) => (b.h > a.h ? b : a)).star = true;
        return out;
    });

    readonly tulips = computed<Tulip[]>(() => {
        const r = rng(23), colors = ['#e2384d', '#f2b631', '#f07aa1', '#9a6ad8', '#ef5a3c', '#f6d04d'];
        return Array.from({ length: 17 }, (_, i) => ({
            x: (i + r() * .8) / 17 * 100 - 2, h: 58 + r() * 46, color: colors[Math.floor(r() * colors.length)],
            sway: 2 + r() * 3, delay: -r() * 4,
        }));
    });

    /** Hímes tojások népi színekkel és mintákkal. */
    readonly eggs: Egg[] = [
        { x: 9, size: 34, tilt: -14, base: '#c8102e', ink: '#fff6e6', pattern: 'zigzag' },
        { x: 31, size: 28, tilt: 10, base: '#2f5bb7', ink: '#ffe08a', pattern: 'dots' },
        { x: 58, size: 36, tilt: -6, base: '#f3c443', ink: '#c8102e', pattern: 'waves' },
        { x: 82, size: 30, tilt: 16, base: '#2f8a4e', ink: '#fff6e6', pattern: 'stripes' },
    ];

    constructor() {
        const onScroll = () => this.faded.set(scrollY > innerHeight * 1.6);
        addEventListener('scroll', onScroll, { passive: true });
        inject(DestroyRef).onDestroy(() => removeEventListener('scroll', onScroll));
    }

    private isHome(): boolean { return this.router.url.split(/[?#]/)[0] === '/'; }
}
