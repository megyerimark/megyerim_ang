import { Component, ElementRef, effect, inject, input, viewChild } from '@angular/core';
import { ConsentService } from '../../core/consent.service';
import { TPipe } from '../../i18n/t.pipe';

/**
 * Trustindex (Google-vélemények) widget – KIZÁRÓLAG hozzájárulás után töltődik be.
 * A widget-azonosítót a backend csak betű-szám formában fogadja el, így szkript nem csempészhető be.
 */
@Component({
    selector: 'app-external-reviews',
    standalone: true,
    imports: [TPipe],
    template: `
      @if (consent.external() === 'granted') {
        <div #host class="reviews-host"></div>
      } @else {
        <div class="reviews-placeholder">
          <p><strong>{{ 'Google-vélemények' | t }}</strong><br>{{ 'A véleményeket egy külső szolgáltató (Trustindex) jeleníti meg, ezért csak a hozzájárulásoddal töltjük be.' | t }}</p>
          <button type="button" class="btn btn-outline" (click)="consent.set('granted')">{{ 'Vélemények megjelenítése' | t }}</button>
        </div>
      }
    `,
    styles: [`
      :host{display:block;margin-top:28px}
      .reviews-placeholder{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px;padding:20px 22px;border:1px dashed var(--border);border-radius:18px;color:var(--muted)}
      .reviews-placeholder p{margin:0;font-size:13px;line-height:1.6;max-width:560px}
      .reviews-placeholder strong{color:var(--text)}
    `]
})
export class ExternalReviews {
    readonly widgetId = input.required<string>();
    readonly consent = inject(ConsentService);
    private readonly host = viewChild<ElementRef<HTMLElement>>('host');
    private loaded = false;

    constructor() {
        effect(() => {
            const el = this.host()?.nativeElement;
            const id = this.widgetId();
            if (!el || this.loaded || !/^[A-Za-z0-9]+$/.test(id)) return;
            this.loaded = true;
            const script = document.createElement('script');
            script.defer = true;
            script.async = true;
            script.src = 'https://cdn.trustindex.io/loader.js?' + id;
            el.appendChild(script);
        });
    }
}
