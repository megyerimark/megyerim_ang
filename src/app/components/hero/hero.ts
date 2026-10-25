import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollScrubber, range } from '../../core/scroll-scrubber';

/**
 * Főoldali nyitójelenet. Görgetésre a kamera „beúszik” a monitorba (rögzített, görgetésvezérelt
 * jelenet, mint a referencia-videóban), a szöveg elhalványul, a képernyő tartalma váltódik.
 */
@Component({
    selector: 'app-hero',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './hero.html',
    styleUrl: './hero.scss'
})
export class Hero implements AfterViewInit, OnDestroy {
    @ViewChild('heroSection', { static: true }) private section!: ElementRef<HTMLElement>;
    @Input()
    headline = 'Ne csak jelen legyél online. Emelkedj ki.';
    @Input()
    description = 'Prémium weboldalak, amelyek nemcsak szépek, hanem ügyfeleket is hoznak.';
    /** A főoldal 8 fejezete – a hero alsó sávja ezt jelzi (2. kép). */
    readonly segments = Array.from({ length: 8 });
    private readonly chapterIds = ['cinematic-story'];
    private scrubber?: ScrollScrubber;

    get titleLead(): string { const idx = this.headline.lastIndexOf('. '); return idx > 0 ? this.headline.slice(0, idx + 1) : this.headline; }
    get titleAccent(): string { const idx = this.headline.lastIndexOf('. '); return idx > 0 ? this.headline.slice(idx + 2) : ''; }
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
            set('--h-out', range(p, .82, 1));
        }, { reducedProgress: 0, pinBreakpoint: 980 });
        this.scrubber.start();
    }

    ngOnDestroy(): void { this.scrubber?.destroy(); }

    next(): void {
        const target = document.getElementById(this.chapterIds[0]);
        if (target) target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }
}
