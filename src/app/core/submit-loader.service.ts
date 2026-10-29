import { Injectable, signal } from '@angular/core';

export type SubmitLoaderState = 'idle' | 'loading' | 'success';

/**
 * A beküldés-animáció (SubmitLoader) vezérlése az egész alkalmazásban. A komponens egyszer szerepel
 * (app.html), így az oldalváltás (pl. belépés után az adminba) sem szakítja meg.
 *  start(lépések)   – a szerverre várunk; a lépésszövegek váltakoznak (magyar kulcsok, a t pipe fordítja)
 *  succeed(cím)     – pipa és felirat, majd magától eltűnik
 *  stop()           – hiba vagy további teendő az űrlapon: azonnal eltűnik
 *  redirect(url)    – külső oldal (Stripe): az animáció az oldalváltásig fut
 */
@Injectable({ providedIn: 'root' })
export class SubmitLoaderService {
    readonly state = signal<SubmitLoaderState>('idle');
    readonly steps = signal<string[]>(['Feldolgozás…']);
    readonly successTitle = signal('Kész!');
    /** Minden start() új futást jelent – az animáció a lépéseket elölről kezdi. */
    readonly run = signal(0);
    /** Ha a szerver sosem válaszolna, a fátyol ne zárja ki a látogatót az oldalról. */
    private static readonly MAX_WAIT_MS = 30_000;
    private watchdog?: ReturnType<typeof setTimeout>;

    constructor() {
        // Vissza gombbal visszatérve a Stripe-ról a böngésző a régi oldalt állítja vissza (bfcache):
        // ne maradjon fent az átirányítás animációja.
        if (typeof window !== 'undefined') addEventListener('pageshow', e => { if (e.persisted) this.stop(); });
    }

    start(steps: string[]): void {
        this.steps.set(steps.length ? steps : ['Feldolgozás…']);
        const run = this.run() + 1;
        this.run.set(run);
        this.state.set('loading');
        this.arm(run);
    }

    succeed(title: string): void {
        clearTimeout(this.watchdog);
        this.successTitle.set(title);
        this.state.set('success');
    }

    stop(): void { clearTimeout(this.watchdog); this.state.set('idle'); }

    /** Külső fizetési oldalra lépés: az animáció fut tovább, amíg a böngésző el nem navigál. */
    redirect(url: string, step = 'Átirányítás a biztonságos fizetési oldalra…', delayMs = 0): void {
        if (this.state() !== 'loading') this.start([step]);
        else { this.steps.set([step]); this.run.update(n => n + 1); this.arm(this.run()); }
        setTimeout(() => { location.href = url; }, delayMs);
    }

    private arm(run: number): void {
        clearTimeout(this.watchdog);
        this.watchdog = setTimeout(() => { if (this.run() === run && this.state() === 'loading') this.stop(); }, SubmitLoaderService.MAX_WAIT_MS);
    }
}
