import { Component, inject, input } from '@angular/core';
import { PromoService } from '../../core/promo.service';
import { TPipe } from '../../i18n/t.pipe';

/** Kis akciós doboz az ajánlatkérőben és a kvízben: a kedvezmény automatikusan rögzül a beküldéskor. */
@Component({
    selector: 'app-promo-note',
    standalone: true,
    imports: [TPipe],
    template: `
    @if (promo.promo(); as p) {
      <div class="promo-note" [class.compact]="compact()" role="note">
        <strong class="promo-note-pct">−{{ p.percent }}%</strong>
        <div>
          <b>{{ promo.title() || ('Időszakos akció' | t) }}</b>
          <span>{{ 'A kedvezmény automatikusan rögzül az ajánlatkérésedhez, az ajánlatban az eredeti és az akciós árat is látni fogod.' | t }}
            @if (promo.remaining(); as r) { {{ 'Még' | t }} {{ r.days }} {{ 'nap' | t }} {{ r.hours }} {{ 'óra' | t }}. }</span>
        </div>
      </div>
    }`,
    styles: [`
      .promo-note{display:flex;align-items:center;gap:16px;margin:0 0 22px;padding:14px 18px;border-radius:16px;border:1px solid var(--k-a58cff-73);
        background:linear-gradient(110deg,var(--k-2a1f5c-cc),var(--k-14204a-cc));box-shadow:0 12px 34px #0005}
      .promo-note-pct{flex:none;font:700 clamp(24px,3vw,32px)/1 'Space Grotesk',system-ui,sans-serif;background:linear-gradient(110deg,var(--k-c9b2ff),var(--k-8fdcf0));
        -webkit-background-clip:text;background-clip:text;color:transparent}
      .promo-note div{display:grid;gap:3px;font-size:13.5px;line-height:1.55;color:var(--k-c9d1ec)}
      .promo-note b{color:#fff;font-size:14.5px}
      .promo-note.compact{margin:14px 0 0;padding:11px 14px}
      :host-context([data-theme='light']) .promo-note{background:var(--k-f3efff);border-color:var(--k-c8b8ff)}
      :host-context([data-theme='light']) .promo-note div{color:var(--k-47506f)}
      :host-context([data-theme='light']) .promo-note b{color:var(--k-1d1b3a)}
    `]
})
export class PromoNote {
    readonly promo = inject(PromoService);
    readonly compact = input(false);
    constructor() { this.promo.load(); }
}
