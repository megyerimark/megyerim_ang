import { AfterViewInit, Component, ElementRef, Input, NgZone, OnDestroy, ViewChild, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TPipe } from '../../i18n/t.pipe';
import { I18nService } from '../../i18n/i18n.service';
import { FlightEngine } from './flight-engine';

/**
 * Főoldali filmszerű nyitójelenet (a védjegy). Izzó részecskegyűrű a kristályszikla körül; görgetésre a gyűrű
 * szétrobban, a kamera a fényoszlopok között előrerepül a folyamat paneljein át, amelyek kék fényporrá esnek szét,
 * végül megérkezik a záró táblához. Csökkentett mozgásnál egyszerű, egymás alatti elrendezés.
 */
@Component({
    selector: 'app-hero',
    standalone: true,
    imports: [RouterLink, TPipe],
    templateUrl: './hero.html',
    styleUrl: './hero.scss',
    host: { '[class.flat]': 'reduced' }
})
export class Hero implements AfterViewInit, OnDestroy {
    readonly i18n = inject(I18nService);
    private readonly zone = inject(NgZone);
    @ViewChild('flight', { static: true }) private section!: ElementRef<HTMLElement>;
    @ViewChild('pin', { static: true }) private pin!: ElementRef<HTMLElement>;
    @ViewChild('world', { static: true }) private world!: ElementRef<HTMLElement>;
    @ViewChild('fx', { static: true }) private canvas!: ElementRef<HTMLCanvasElement>;
    @ViewChild('chapter', { static: true }) private chapterEl!: ElementRef<HTMLElement>;
    @ViewChild('counter', { static: true }) private counterEl!: ElementRef<HTMLElement>;
    @Input()
    headline = 'Ne csak jelen legyél online. Emelkedj ki.';
    @Input()
    description = 'Prémium weboldalak, amelyek nemcsak szépek, hanem ügyfeleket is hoznak.';

    readonly reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    /** A folyamat lépései – a kamera ezek mellett repül el. */
    readonly steps = [
        { n: '01', k: 'STRATÉGIA', title: 'Megismerem a céljaidat.', text: 'Átbeszéljük a vállalkozásodat, az ügyfeleidet és azt, mit kell elérnie az oldalnak.', img: '/brand/ribbon-860.webp' },
        { n: '02', k: 'DIZÁJN', title: 'Egyedi arculat, sablon nélkül.', text: 'Olyan felület, ami a márkádat tükrözi, és egyértelműen vezet az ajánlatkérésig.', img: '/demos/previews/nobile.webp' },
        { n: '03', k: 'FEJLESZTÉS', title: 'Gyors, minden kijelzőn.', text: 'Reszponzív, kereshető és biztonságos weboldal, mobilra optimalizálva.', img: '/brand/showcase-900.webp' },
        { n: '04', k: 'ÁTADÁS', title: 'Utána sem hagylak magadra.', text: 'Élesítés, mérés és karbantartás – a weboldalad tovább fejlődik veled.', img: '/brand/rock-820.webp' },
    ];
    /** Fényoszlopok a repülés két oldalán (magasság px-ben, rögzített minta). */
    readonly pillars = Array.from({ length: 20 }, (_, i) => ({ h: 260 + ((i * 137) % 560) }));
    /** HUD-feliratok: nyitókép, a négy lépés, záró tábla. */
    readonly chapters = ['01 / AZ ELSŐ BENYOMÁS', '02 / STRATÉGIA', '03 / DIZÁJN', '04 / FEJLESZTÉS', '05 / ÁTADÁS', '06 / ÍGY KEL ÉLETRE'];
    private engine?: FlightEngine;

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
        if (typeof window === 'undefined' || this.reduced) return;
        const world = this.world.nativeElement;
        const total = this.chapters.length;
        this.zone.runOutsideAngular(() => {
            this.engine = new FlightEngine({
                section: this.section.nativeElement,
                pin: this.pin.nativeElement,
                canvas: this.canvas.nativeElement,
                panels: Array.from(world.querySelectorAll<HTMLElement>('.fpanel')),
                finale: world.querySelector<HTMLElement>('.ffinale')!,
                pillars: Array.from(world.querySelectorAll<HTMLElement>('.pillar')),
                onChapter: index => {
                    this.chapterEl.nativeElement.textContent = this.i18n.t(this.chapters[index]);
                    this.counterEl.nativeElement.textContent = `0${index + 1} / 0${total}`;
                },
            });
            this.engine.start();
        });
    }

    ngOnDestroy(): void { this.engine?.destroy(); }
}
