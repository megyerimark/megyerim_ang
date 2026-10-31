import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollScrubber, range } from '../../core/scroll-scrubber';
import { TPipe } from '../../i18n/t.pipe';
import { I18nService } from '../../i18n/i18n.service';

/**
 * Főoldali nyitójelenet. Görgetésre (rögzített, görgetésvezérelt jelenet) a szöveg elhalványul, a kamera a
 * kristályszikla fénylő magjába úszik, a gyűrűk felpörögnek, és egy fényvillanásból indul a következő jelenet.
 */
@Component({
    selector: 'app-hero',
    standalone: true,
    imports: [RouterLink, TPipe],
    templateUrl: './hero.html',
    styleUrl: './hero.scss'
})
export class Hero implements AfterViewInit, OnDestroy {
    readonly i18n = inject(I18nService);
    @ViewChild('heroSection', { static: true }) private section!: ElementRef<HTMLElement>;
    @Input()
    headline = 'Ne csak jelen legyél online. Emelkedj ki.';
    @Input()
    description = 'Prémium weboldalak, amelyek nemcsak szépek, hanem ügyfeleket is hoznak.';
    /** A főoldal 8 fejezete – a hero alsó sávja ezt jelzi (2. kép). */
    readonly segments = Array.from({ length: 8 });
    /** Lebegő fényszikrák a szikla körül (rögzített minta, hogy minden betöltésnél ugyanúgy nézzen ki). */
    readonly sparks = [[18, 30, 7, 3], [26, 72, 9, 2], [38, 14, 8, 2], [52, 86, 11, 3], [64, 22, 6, 2], [74, 64, 10, 4],
        [82, 36, 8, 2], [88, 78, 12, 3], [12, 56, 10, 2], [46, 48, 9, 2], [58, 8, 7, 3], [30, 92, 13, 2], [92, 18, 9, 2], [8, 84, 11, 3]]
        .map(([x, y, d, s]) => ({ x: x + '%', y: y + '%', d: d + 's', s: s + 'px' }));
    private readonly chapterIds = ['cinematic-story'];
    private scrubber?: ScrollScrubber;

    /** A teljes főcím az aktuális nyelven (fordítás után bontjuk sorokra). */
    private get text(): string { return this.i18n.t(this.headline); }
    get titleLead(): string { const t = this.text; const idx = t.lastIndexOf('. '); return idx > 0 ? t.slice(0, idx + 1) : t; }
    get titleAccent(): string { const t = this.text; const idx = t.lastIndexOf('. '); return idx > 0 ? t.slice(idx + 2) : ''; }
    /** A főcím első része két, kiegyensúlyozott sorba törve (pl. „Ne csak jelen / legyél online.”). */
    get leadLines(): string[] {
        const words = this.titleLead.split(' ');
        if (words.length < 3) return [this.titleLead];
        let best = 1, bestDiff = Infinity;
        for (let i = 1; i < words.length; i++) {
            const diff = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length);
            if (diff < bestDiff) { best = i; bestDiff = diff; }
        }
        return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
    }

    ngAfterViewInit(): void {
        if (typeof window === 'undefined') return;
        const el = this.section.nativeElement;
        this.scrubber = new ScrollScrubber(el, p => {
            const set = (name: string, value: number) => el.style.setProperty(name, value.toFixed(4));
            set('--hp', p);
            set('--h-copy', range(p, .04, .38));
            set('--h-push', range(p, .08, .86));
            set('--h-swap', range(p, .34, .58));
            // fényvillanás: a beúszás végén felizzik, majd átadja a helyét a következő jelenetnek
            const flash = range(p, .7, .9) - range(p, .9, 1);
            set('--h-flash', flash);
            set('--h-out', range(p, .9, 1));
        }, { reducedProgress: 0, pinBreakpoint: 980 });
        this.scrubber.start();
    }

    ngOnDestroy(): void { this.scrubber?.destroy(); }

    next(): void {
        const target = document.getElementById(this.chapterIds[0]);
        if (target) target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }
}
