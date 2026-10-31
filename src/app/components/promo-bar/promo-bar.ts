import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PromoService } from '../../core/promo.service';
import { TPipe } from '../../i18n/t.pipe';
import { LpPipe } from '../../i18n/lp.pipe';

const DISMISS_KEY = 'mm-promo-bar-dismissed';

/**
 * Vékony akciós sáv a menü fölött, minden nyilvános oldalon (az app dönti el, hol jelenjen meg).
 * Bezárás után ugyanaz az akció nem jön elő újra; egy új akció (más %, cím vagy lejárat) igen.
 */
@Component({
    selector: 'app-promo-bar',
    standalone: true,
    imports: [LpPipe, RouterLink, TPipe],
    template: `
    @if (visible(); as p) {
      <div class="promo-bar" role="region" [attr.aria-label]="'Időszakos akció' | t">
        <a class="promo-bar-link" [routerLink]="'/ajanlatkeres' | lp">
          <span class="promo-bar-pct">−{{ p.percent }}%</span>
          <span class="promo-bar-text">{{ promo.title() || ('Időszakos akció az új weboldalakra' | t) }}</span>
          @if (promo.remaining(); as r) {<span class="promo-bar-time">{{ 'még' | t }} {{ r.days }} {{ 'nap' | t }} {{ r.hours }} {{ 'óra' | t }}</span>}
          <span class="promo-bar-cta">{{ 'Ajánlatot kérek' | t }} →</span>
        </a>
        <button type="button" class="promo-bar-close" (click)="dismiss()" [attr.aria-label]="'Akciós sáv bezárása' | t">×</button>
      </div>
    }`,
    styles: [`
      .promo-bar{position:relative;z-index:121;display:flex;align-items:center;justify-content:center;min-height:40px;padding:0 44px;
        background:linear-gradient(100deg,var(--k-2b1f63),var(--k-1b2c5e) 55%,var(--k-123a52));border-bottom:1px solid #ffffff1f;color:var(--k-eef0ff)}
      .promo-bar-link{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:4px 12px;padding:9px 0;color:inherit;text-decoration:none;font-size:13px;line-height:1.3;text-align:center}
      .promo-bar-pct{font:700 15px/1 'Space Grotesk',system-ui,sans-serif;color:var(--k-d8c9ff)}
      .promo-bar-text{font-weight:600}
      .promo-bar-time{color:var(--k-a9e9f5)}
      .promo-bar-cta{text-decoration:underline;text-underline-offset:3px}
      .promo-bar-link:hover .promo-bar-cta{color:#fff}
      .promo-bar-close{position:absolute;right:8px;top:50%;transform:translateY(-50%);width:32px;height:32px;border:0;border-radius:50%;background:transparent;color:var(--k-cfd3f3);font-size:20px;cursor:pointer}
      .promo-bar-close:hover{background:#ffffff1a;color:#fff}
      @media (max-width:560px){.promo-bar{padding:0 38px 0 12px}.promo-bar-link{font-size:12px;gap:2px 8px}.promo-bar-time{display:none}}
    `]
})
export class PromoBar {
    readonly promo = inject(PromoService);
    private readonly dismissed = signal(this.read());
    private readonly signature = computed(() => { const p = this.promo.promo(); return p ? `${p.percent}|${p.ends_at ?? ''}|${p.title}` : ''; });
    readonly visible = computed(() => { const p = this.promo.promo(); return p && this.dismissed() !== this.signature() ? p : null; });

    constructor() { this.promo.load(); }

    dismiss(): void {
        const sig = this.signature();
        this.dismissed.set(sig);
        try { localStorage.setItem(DISMISS_KEY, sig); } catch { /* privát mód: csak erre a látogatásra zárjuk be */ }
    }
    private read(): string {
        try { return localStorage.getItem(DISMISS_KEY) ?? ''; } catch { return ''; }
    }
}
