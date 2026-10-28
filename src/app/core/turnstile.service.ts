import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import { ApiService } from './api.service';

/** A Cloudflare Turnstile böngészős API-jának az a része, amit használunk. */
export interface TurnstileApi {
    render(element: HTMLElement, options: {
        sitekey: string; language?: string; theme?: 'auto' | 'light' | 'dark'; action?: string;
        callback: (token: string) => void; 'expired-callback': () => void; 'error-callback': () => void;
    }): string;
    reset(widgetId: string): void;
    remove(widgetId: string): void;
}

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/**
 * Bot-védelem (Cloudflare Turnstile). A nyilvános kulcsot a backend adja (/api/site-settings);
 * ha nincs beállítva, a robotszűrő ki van kapcsolva, és a szkript sem töltődik be.
 */
@Injectable({ providedIn: 'root' })
export class TurnstileService {
    private readonly api = inject(ApiService);
    private script: Promise<TurnstileApi> | null = null;

    readonly siteKey$: Observable<string | null> = this.api.publicSettings().pipe(
        map(r => r?.data?.turnstile_site_key || null),
        catchError(() => of(null)),
        shareReplay(1),
    );

    load(): Promise<TurnstileApi> {
        const w = window as unknown as { turnstile?: TurnstileApi };
        if (w.turnstile) return Promise.resolve(w.turnstile);
        this.script ??= new Promise<TurnstileApi>((resolve, reject) => {
            const tag = document.createElement('script');
            tag.src = SCRIPT_URL;
            tag.async = true;
            tag.onload = () => w.turnstile ? resolve(w.turnstile) : reject(new Error('Turnstile unavailable'));
            tag.onerror = () => { this.script = null; tag.remove(); reject(new Error('Turnstile unavailable')); };
            document.head.appendChild(tag);
        });
        return this.script;
    }
}
