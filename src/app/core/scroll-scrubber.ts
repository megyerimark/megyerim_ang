export const clamp = (value: number, min = 0, max = 1): number => Math.min(max, Math.max(min, value));
export const smooth = (value: number): number => value * value * (3 - 2 * value);
/** 0→1 átmenet a [from, to] tartományban, ease-szel. */
export const range = (p: number, from: number, to: number): number => smooth(clamp((p - from) / (to - from)));

export interface ScrubberOptions {
  /** Ez alatti ablakszélességnél nincs rögzítés: a jelenet a szekció áthaladása közben játszik le. */
  pinBreakpoint?: number;
  /** Követési sebesség (0–1). Kisebb = lágyabb. */
  ease?: number;
  /** Csökkentett mozgás esetén ezen a fix állapoton áll meg a jelenet. */
  reducedProgress?: number;
}

/**
 * Görgetésvezérelt „scrub”: a szekció rögzített (sticky) szakaszán végigfutó 0–1 haladást
 * simítva adja át a callbacknek – ugyanúgy, ahogy a videóban a jelenet a görgetéssel játszódik le.
 * Angular-függetlenül, zónán kívül futtatható.
 */
export class ScrollScrubber {
  private target = 0;
  private current = 0;
  private raf = 0;
  private active = false;
  private readonly pinBreakpoint: number;
  private readonly ease: number;
  private readonly reduced: boolean;

  constructor(private readonly section: HTMLElement, private readonly onFrame: (progress: number) => void, options: ScrubberOptions = {}) {
    this.pinBreakpoint = options.pinBreakpoint ?? 870;
    this.ease = options.ease ?? .12;
    this.reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (this.reduced) { this.target = this.current = options.reducedProgress ?? 1; }
  }

  start(): void {
    if (typeof window === 'undefined') return;
    if (this.reduced) { this.onFrame(this.current); return; }
    window.addEventListener('scroll', this.measure, { passive: true });
    window.addEventListener('resize', this.measure, { passive: true });
    this.active = true;
    this.measure();
  }

  destroy(): void {
    if (typeof window === 'undefined') return;
    if (this.active) {
      window.removeEventListener('scroll', this.measure);
      window.removeEventListener('resize', this.measure);
    }
    if (this.raf) window.cancelAnimationFrame(this.raf);
    this.active = false;
  }

  /** Aktuális cél-haladás (0–1), pl. fejezetre ugráshoz. */
  get progress(): number { return this.target; }

  /** A görgetési pozíció, ahol a haladás elérné a megadott értéket. */
  scrollYFor(progress: number): number {
    const top = this.section.getBoundingClientRect().top + window.scrollY;
    const distance = Math.max(1, this.section.offsetHeight - window.innerHeight);
    return top + distance * clamp(progress);
  }

  private readonly measure = (): void => {
    const rect = this.section.getBoundingClientRect();
    if (window.innerWidth <= this.pinBreakpoint) {
      this.target = clamp((window.innerHeight * .9 - rect.top) / Math.max(1, rect.height * .9 + window.innerHeight * .1));
    } else {
      this.target = clamp(-rect.top / Math.max(1, rect.height - window.innerHeight));
    }
    if (!this.raf) this.raf = window.requestAnimationFrame(this.tick);
  };

  private readonly tick = (): void => {
    this.raf = 0;
    this.current += (this.target - this.current) * this.ease;
    if (Math.abs(this.target - this.current) < .0004) this.current = this.target;
    this.onFrame(this.current);
    if (this.current !== this.target) this.raf = window.requestAnimationFrame(this.tick);
  };
}
