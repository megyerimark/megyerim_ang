import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { PaletteService, Season } from '../../core/palette.service';

interface Particle { x: number; size: number; dur: number; delay: number; drift: number; tone: number; }

/**
 * Ünnepi díszítés a nyilvános oldalakon (az aktív ünnepi témához): karácsony – hóesés, húsvét – szirmok,
 * Valentin-nap – apró szívek, nemzeti ünnep – vékony nemzeti színű szalag. Visszafogott: pár tucat elem,
 * nem fog meg kattintást, két képernyőnyi görgetés után elhalványul; csökkentett mozgásnál nincs részecske.
 */
@Component({
    selector: 'app-seasonal-decor',
    standalone: true,
    template: `
        @if (season(); as s) {
            @if (s === 'national') {<div class="ribbon" aria-hidden="true"></div>}
            @else {
                <div class="field" [attr.data-season]="s" [class.faded]="faded()" aria-hidden="true">
                    @for (p of particles(); track $index) {
                        <i [style.left.%]="p.x" [style.--size]="p.size + 'px'" [style.--dur]="p.dur + 's'" [style.--delay]="p.delay + 's'"
                           [style.--drift]="p.drift + 'px'" [style.--tone]="p.tone" [style.--scale]="p.size / 16"></i>
                    }
                </div>
            }
        }
    `,
    styleUrl: './seasonal-decor.scss',
})
export class SeasonalDecor {
    private readonly palette = inject(PaletteService);
    readonly season = this.palette.decoration;
    readonly faded = signal(false);
    private readonly reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

    /** Determinisztikus „véletlen” elhelyezés (minden betöltéskor ugyanaz, nincs ugrálás). */
    readonly particles = computed<Particle[]>(() => {
        const s = this.season();
        if (!s || s === 'national' || this.reduced) return [];
        const count: Record<Exclude<Season, 'national'>, number> = { christmas: 34, easter: 16, valentine: 11 };
        let seed = 7;
        const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
        return Array.from({ length: count[s] }, () => ({
            x: rnd() * 100,
            size: s === 'christmas' ? 2 + rnd() * 4 : s === 'easter' ? 7 + rnd() * 7 : 8 + rnd() * 8,
            dur: s === 'christmas' ? 10 + rnd() * 12 : s === 'easter' ? 13 + rnd() * 10 : 14 + rnd() * 10,
            delay: -rnd() * 22,
            drift: (rnd() - .5) * (s === 'christmas' ? 80 : 160),
            tone: rnd(),
        }));
    });

    constructor() {
        const onScroll = () => this.faded.set(scrollY > innerHeight * 1.6);
        addEventListener('scroll', onScroll, { passive: true });
        inject(DestroyRef).onDestroy(() => removeEventListener('scroll', onScroll));
    }
}
