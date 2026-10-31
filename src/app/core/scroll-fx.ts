import { Directive, ElementRef, Injectable, Input, NgZone, OnDestroy, AfterViewInit, inject } from '@angular/core';

/**
 * GSAP + ScrollTrigger alapú görgetési animációk, teljesítményre optimalizálva:
 *  - a GSAP csak az oldal betöltése után, üresjáratban töltődik le (külön csomag, nem lassítja az első megjelenést);
 *  - csak transform / opacity animálódik (GPU-barát), Angular zónán kívül;
 *  - „mozgás csökkentése” beállításnál semmi nem mozog, a tartalom végig látható;
 *  - ha a GSAP valamiért nem töltődik be, a tartalom egyszerűen látható marad (nincs előre elrejtve).
 *
 * Fajták:
 *  - rise:     belépés alulról, finom elmosással (címsorok, blokkok)
 *  - stagger:  a gyerekelemek egymás után lépnek be (kártyarácsok)
 *  - parallax: a [data-depth] rétegek eltérő sebességgel mozognak görgetéskor (mockup-kompozíciók)
 *  - camera:   lassú „kamerabeállás” – enyhe 3D döntésből egyenesbe, közelítéssel (nagy referencia-képek)
 *  - drift:    a 3D tárgyak (szikla, üvegszalag) lassan úsznak a görgetéssel
 */
export type FxKind = 'rise' | 'stagger' | 'parallax' | 'camera' | 'drift';

type Gsap = typeof import('gsap').gsap;
type ScrollTriggerT = typeof import('gsap/ScrollTrigger').ScrollTrigger;
interface Lib { gsap: Gsap; ScrollTrigger: ScrollTriggerT; }
interface Entry { el: HTMLElement; kind: FxKind; cleanup?: () => void; }

@Injectable({ providedIn: 'root' })
export class ScrollFxService {
    private readonly zone = inject(NgZone);
    private lib?: Lib;
    private loading?: Promise<Lib | undefined>;
    private readonly pending = new Set<Entry>();
    private refreshTimer = 0;
    private observer?: ResizeObserver;
    readonly enabled = typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    register(el: HTMLElement, kind: FxKind): Entry | undefined {
        if (!this.enabled) return undefined;
        const entry: Entry = { el, kind };
        if (this.lib) this.zone.runOutsideAngular(() => this.apply(entry));
        else { this.pending.add(entry); this.load(); }
        return entry;
    }

    unregister(entry?: Entry): void {
        if (!entry) return;
        this.pending.delete(entry);
        entry.cleanup?.();
    }

    private load(): void {
        if (this.loading) return;
        this.loading = new Promise<void>(resolve => {
            const go = () => resolve();
            const idle = () => { if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(go, { timeout: 3000 }); else setTimeout(go, 1500); };
            if (document.readyState === 'complete') idle(); else window.addEventListener('load', idle, { once: true });
        }).then(() => Promise.all([import('gsap'), import('gsap/ScrollTrigger')]))
            .then(([g, st]) => {
                const lib: Lib = { gsap: g.gsap, ScrollTrigger: st.ScrollTrigger };
                lib.gsap.registerPlugin(lib.ScrollTrigger);
                lib.ScrollTrigger.config({ ignoreMobileResize: true });
                this.lib = lib;
                this.zone.runOutsideAngular(() => {
                    for (const entry of this.pending) this.apply(entry);
                    this.pending.clear();
                    // a tartalom (API-adatok, képek) később is változtathatja az oldal magasságát → a pozíciók újraszámolása
                    this.observer = new ResizeObserver(() => this.scheduleRefresh());
                    this.observer.observe(document.body);
                });
                return lib;
            })
            .catch(() => undefined);
    }

    private scheduleRefresh(): void {
        clearTimeout(this.refreshTimer);
        this.refreshTimer = window.setTimeout(() => this.lib?.ScrollTrigger.refresh(), 250);
    }

    private apply(entry: Entry): void {
        const lib = this.lib;
        if (!lib || !entry.el.isConnected) return;
        const { gsap } = lib;
        const el = entry.el;
        // ami a betöltéskor már a képernyőn (vagy fölötte) van, azt nem rejtjük el utólag – nincs villanás
        const seen = () => el.getBoundingClientRect().top < window.innerHeight * .92;
        let ctx: ReturnType<Gsap['context']> | undefined;
        switch (entry.kind) {
            case 'rise':
                if (seen()) return;
                ctx = gsap.context(() => {
                    gsap.from(el, { y: 46, autoAlpha: 0, duration: 1.1, ease: 'power3.out', clearProps: 'transform,opacity,visibility',
                        scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
                });
                break;
            case 'stagger': {
                if (seen()) return;
                const items = Array.from(el.children) as HTMLElement[];
                ctx = gsap.context(() => {
                    gsap.from(items, { y: 70, autoAlpha: 0, rotateX: 8, transformPerspective: 1200, duration: 1.15, ease: 'power3.out', stagger: .11,
                        clearProps: 'transform,opacity,visibility', scrollTrigger: { trigger: el, start: 'top 84%', once: true } });
                });
                break;
            }
            case 'parallax': {
                const layers = Array.from(el.querySelectorAll<HTMLElement>('[data-depth]'));
                ctx = gsap.context(() => {
                    for (const layer of layers) {
                        const d = parseFloat(layer.dataset['depth'] || '0') || 0;
                        gsap.fromTo(layer, { yPercent: 0, y: d * 46 }, { y: -d * 46, ease: 'none',
                            scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: .7 } });
                    }
                });
                break;
            }
            case 'camera':
                ctx = gsap.context(() => {
                    gsap.fromTo(el, { rotateX: 14, rotateY: el.dataset['side'] === 'right' ? 6 : -6, y: 90, scale: .9, transformPerspective: 1400, transformOrigin: '50% 100%' },
                        { rotateX: 0, rotateY: 0, y: 0, scale: 1, ease: 'none',
                            scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 30%', scrub: .9 } });
                });
                break;
            case 'drift':
                ctx = gsap.context(() => {
                    gsap.fromTo(el, { y: 80, rotate: -4 }, { y: -80, rotate: 4, ease: 'none',
                        scrollTrigger: { trigger: el.parentElement ?? el, start: 'top bottom', end: 'bottom top', scrub: 1.2 } });
                });
                break;
        }
        entry.cleanup = () => ctx?.revert();
        this.scheduleRefresh();
    }
}

/** Görgetési animáció egy elemre: `<div mmFx="stagger">`. */
@Directive({ selector: '[mmFx]', standalone: true })
export class MmFx implements AfterViewInit, OnDestroy {
    @Input('mmFx') kind: FxKind = 'rise';
    private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly fx = inject(ScrollFxService);
    private entry?: ReturnType<ScrollFxService['register']>;

    ngAfterViewInit(): void { this.entry = this.fx.register(this.el.nativeElement, this.kind); }
    ngOnDestroy(): void { this.fx.unregister(this.entry); }
}
