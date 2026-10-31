import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TPipe } from '../../i18n/t.pipe';
import { I18nService } from '../../i18n/i18n.service';
import { LpPipe } from '../../i18n/lp.pipe';

/**
 * Főoldali akció-szekció. Görgetésre „összeáll”: a nagy százalék beúszik és felpörög 0-tól a kedvezményig,
 * a fénygyűrűk forognak, a kártya felemelkedik. Csökkentett mozgásnál statikus, de ugyanúgy olvasható.
 * A számítás csak akkor fut, amikor a szekció látszik (IntersectionObserver), rAF-fel, passzív görgetésfigyelővel.
 */
@Component({
    selector: 'app-promo-spotlight',
    standalone: true,
    imports: [LpPipe, RouterLink, TPipe],
    templateUrl: './promo-spotlight.html',
    styleUrl: './promo-spotlight.scss'
})
export class PromoSpotlight implements AfterViewInit, OnDestroy {
    readonly percent = input.required<number>();
    readonly title = input<string>('');
    readonly text = input<string>('');
    readonly endsAt = input<string | null>(null);

    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly zone = inject(NgZone);
    readonly i18n = inject(I18nService);

    /** 0..1 – mennyire „állt össze” a szekció (görgetés alapján). */
    readonly progress = signal(1);
    readonly shownPercent = computed(() => Math.round(this.percent() * Math.min(1, this.progress() * 1.6)));
    readonly now = signal(Date.now());
    readonly countdown = computed(() => {
        const end = this.endsAt();
        if (!end) return null;
        const ms = new Date(end + 'T23:59:59').getTime() - this.now();
        if (ms <= 0) return null;
        return { days: Math.floor(ms / 86_400_000), hours: Math.floor(ms / 3_600_000) % 24, minutes: Math.floor(ms / 60_000) % 60 };
    });
    readonly endsLabel = computed(() => {
        const end = this.endsAt();
        return end ? new Date(end + 'T12:00:00').toLocaleDateString(this.i18n.lang() === 'en' ? 'en-GB' : 'hu-HU', { month: 'long', day: 'numeric' }) : '';
    });

    private observer?: IntersectionObserver;
    private ticking = false;
    private timer?: ReturnType<typeof setInterval>;
    private readonly onScroll = () => {
        if (this.ticking) return;
        this.ticking = true;
        requestAnimationFrame(() => { this.ticking = false; this.measure(); });
    };

    ngAfterViewInit(): void {
        if (typeof window === 'undefined') return;
        this.timer = setInterval(() => this.now.set(Date.now()), 30_000);
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
        this.progress.set(0);
        this.measure();
        this.zone.runOutsideAngular(() => {
            this.observer = new IntersectionObserver(([entry]) => {
                if (entry.isIntersecting) { window.addEventListener('scroll', this.onScroll, { passive: true }); this.measure(); }
                else window.removeEventListener('scroll', this.onScroll);
            });
            this.observer.observe(this.host.nativeElement);
        });
    }

    private measure(): void {
        const rect = this.host.nativeElement.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        // 0: a szekció teteje épp belép alul; 1: a szekció közepe a képernyő felső harmadánál.
        const raw = (vh - rect.top) / (vh * 0.75 + rect.height * 0.25);
        const p = Math.max(0, Math.min(1, raw));
        const eased = 1 - Math.pow(1 - p, 3);
        this.host.nativeElement.style.setProperty('--promo-p', eased.toFixed(4));
        if (Math.abs(eased - this.progress()) > 0.01 || eased === 1) this.zone.run(() => this.progress.set(eased));
    }

    ngOnDestroy(): void {
        this.observer?.disconnect();
        if (typeof window !== 'undefined') window.removeEventListener('scroll', this.onScroll);
        if (this.timer) clearInterval(this.timer);
    }
}
