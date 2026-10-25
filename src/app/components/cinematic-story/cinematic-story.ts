import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollScrubber, range } from '../../core/scroll-scrubber';

/**
 * „Így kel életre egy weboldal” – görgetésvezérelt, szétszedett (exploded) réteges jelenet.
 * A képkockánkénti értékeket CSS-változókba írjuk zónán kívül; Angular csak fejezetváltáskor frissít.
 */
@Component({
  selector: 'app-cinematic-story',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './cinematic-story.html',
  styleUrl: './cinematic-story.scss'
})
export class CinematicStory implements AfterViewInit, OnDestroy {
  @ViewChild('storySection', { static: true }) private section!: ElementRef<HTMLElement>;
  private readonly zone = inject(NgZone);
  private scrubber?: ScrollScrubber;
  readonly activeIndex = signal(0);

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return;
    const el = this.section.nativeElement;
    this.zone.runOutsideAngular(() => {
      this.scrubber = new ScrollScrubber(el, p => this.paint(el, p), { reducedProgress: .9 });
      this.scrubber.start();
    });
  }

  ngOnDestroy(): void { this.scrubber?.destroy(); }

  /** A fejezetsáv pontjára kattintva az adott fejezethez görget. */
  goTo(index: number): void {
    if (!this.scrubber) return;
    window.scrollTo({ top: this.scrubber.scrollYFor(index / 4 + .125), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  private paint(el: HTMLElement, p: number): void {
    const set = (name: string, value: number) => el.style.setProperty(name, value.toFixed(4));
    set('--p', p);
    // 0 = összerakott oldal, 1 = teljesen szétszedett rétegek (lépcsőzetesen, alulról felfelé)
    set('--ex-1', range(p, .02, .34));
    set('--ex-2', range(p, .07, .39));
    set('--ex-3', range(p, .12, .44));
    set('--ex-4', range(p, .17, .49));
    set('--ex-5', range(p, .22, .54));
    set('--ex-6', range(p, .27, .59));
    set('--ex-phone', range(p, .5, .8));
    for (let i = 0; i < 5; i++) set(`--call-${i + 1}`, range(p, .3 + i * .07, .4 + i * .07));
    const index = Math.min(3, Math.floor(p * 4));
    if (index !== this.activeIndex()) this.zone.run(() => this.activeIndex.set(index));
  }
}
