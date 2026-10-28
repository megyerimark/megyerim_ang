import { AfterViewInit, Component, DestroyRef, ElementRef, computed, inject, input, model, signal, viewChild } from '@angular/core';
import { TurnstileService, TurnstileApi } from '../../core/turnstile.service';
import { I18nService } from '../../i18n/i18n.service';
import { TPipe } from '../../i18n/t.pipe';

/**
 * Robotszűrő widget: <app-turnstile [(token)]="data.turnstile_token" action="quote" />.
 * A kulcs egyszer használatos – sikertelen beküldés után hívd meg a reset()-et.
 * Ha a backenden nincs Turnstile-kulcs, a komponens semmit nem jelenít meg, és a ready() mindig igaz.
 */
@Component({
    selector: 'app-turnstile',
    standalone: true,
    imports: [TPipe],
    template: `
        <div #host class="turnstile-host"></div>
        @if (failed()) {<p class="turnstile-error" role="alert">{{ 'A robotszűrő nem töltődött be. Kapcsold ki a reklámblokkolót, vagy frissítsd az oldalt.' | t }}</p>}
    `,
    styles: [`:host { display: block; } :host:empty, .turnstile-host:empty { display: none; } .turnstile-host { min-height: 65px; margin: .75rem 0; } .turnstile-error { color: var(--danger, #e5484d); font-size: .875rem; margin: .5rem 0; }`],
})
export class Turnstile implements AfterViewInit {
    readonly token = model('');
    readonly action = input<string>();
    private readonly service = inject(TurnstileService);
    private readonly i18n = inject(I18nService);
    private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');
    private api: TurnstileApi | null = null;
    private widgetId: string | null = null;
    private destroyed = false;

    readonly enabled = signal(false);
    readonly failed = signal(false);
    /** Beküldhető-e az űrlap: kikapcsolt robotszűrőnél mindig, egyébként sikeres ellenőrzés után. */
    readonly ready = computed(() => !this.enabled() || this.token() !== '');

    private readonly destroyRef = inject(DestroyRef);

    constructor() {
        this.destroyRef.onDestroy(() => { this.destroyed = true; if (this.api && this.widgetId) this.api.remove(this.widgetId); });
    }

    ngAfterViewInit(): void {
        const sub = this.service.siteKey$.subscribe(siteKey => {
            if (!siteKey) return;
            this.enabled.set(true);
            this.service.load().then(api => {
                if (this.destroyed) return;
                this.api = api;
                this.widgetId = api.render(this.host().nativeElement, {
                    sitekey: siteKey, language: this.i18n.lang(), theme: 'auto', action: this.action(),
                    callback: token => { this.failed.set(false); this.token.set(token); },
                    'expired-callback': () => this.token.set(''),
                    'error-callback': () => { this.token.set(''); this.failed.set(true); },
                });
            }).catch(() => this.failed.set(true));
        });
        this.destroyRef.onDestroy(() => sub.unsubscribe());
    }

    reset(): void {
        this.token.set('');
        if (this.api && this.widgetId) this.api.reset(this.widgetId);
    }
}
