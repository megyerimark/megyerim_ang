import { Injectable, signal } from '@angular/core';

/** acknowledged = a látogató tudomásul vette a sáv szövegét, amikor még nem volt külső tartalom (arra nem adott hozzájárulást). */
export type ConsentState = 'unknown' | 'granted' | 'denied' | 'acknowledged';
const KEY = 'mm-consent-v1';

/**
 * Süti-/külső tartalom hozzájárulás. Az oldal alapból csak a működéshez szükséges sütiket használja;
 * hozzájárulás csak külső tartalomhoz (pl. Google-vélemények widget) kell, és amíg nincs, az nem töltődik be.
 */
@Injectable({ providedIn: 'root' })
export class ConsentService {
    readonly external = signal<ConsentState>(this.read());
    /** A külső tartalom be van-e kapcsolva az oldalon (admin beállítás) – csak ekkor kérdezünk. */
    readonly needed = signal(false);
    readonly panelOpen = signal(false);

    private read(): ConsentState {
        try {
            const raw = localStorage.getItem(KEY);
            return raw === 'granted' || raw === 'denied' || raw === 'acknowledged' ? raw : 'unknown';
        } catch { return 'unknown'; }
    }

    set(state: Exclude<ConsentState, 'unknown'>): void {
        this.external.set(state);
        this.panelOpen.set(false);
        try { localStorage.setItem(KEY, state); } catch { /* privát mód: csak erre a látogatásra él */ }
    }

    /** „Elfogadom”: külső tartalom esetén hozzájárulás, egyébként csak tudomásulvétel. */
    accept(): void { this.set(this.needed() ? 'granted' : 'acknowledged'); }

    openSettings(): void { this.panelOpen.set(true); }
}
