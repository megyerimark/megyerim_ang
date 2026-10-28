import { Component, DestroyRef, ElementRef, afterNextRender, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { TPipe } from '../../i18n/t.pipe';

export type SubmitLoaderState = 'idle' | 'loading' | 'success';

/**
 * Teljes képernyős „feldolgozás” animáció beküldéskor (foglalás, ajánlatkérés):
 * loading – forgó aurora-gyűrűk, keringő fénypontok, lüktető mag és váltakozó állapotszövegek;
 * success – a gyűrűk összehúzódnak, kirajzolódik a pipa, majd a fátyol elhalványul (closed esemény).
 * Hibánál a szülő 'idle'-re állítja: azonnal eltűnik, a hibaüzenet az űrlapon jelenik meg.
 * Csökkentett mozgás esetén a globális szabály kikapcsolja a mozgást, csak a végállapotok látszanak.
 */
@Component({
    selector: 'app-submit-loader',
    standalone: true,
    imports: [TPipe],
    template: `
        @if (visible()) {
            <div class="veil" [class.is-success]="state() === 'success'" [class.is-leaving]="leaving()" role="status" aria-live="polite">
                <div class="aurora" aria-hidden="true"></div>
                <div class="stage">
                    <div class="orb" aria-hidden="true">
                        <span class="ring r1"></span><span class="ring r2"></span><span class="ring r3"></span>
                        <span class="orbit"><i></i><i></i><i></i></span>
                        <span class="core"></span>
                        <span class="burst"></span>
                        <svg class="check" viewBox="0 0 52 52"><path d="M15 27.5l7.5 7.5L38 19"/></svg>
                    </div>
                    @if (state() === 'success') {
                        <p class="title">{{ successTitle() | t }}</p>
                    } @else {
                        @for (m of [message()]; track m) {<p class="msg">{{ m | t }}</p>}
                        <div class="bar" aria-hidden="true"><i></i></div>
                    }
                </div>
            </div>
        }
    `,
    styleUrl: './submit-loader.scss',
})
export class SubmitLoader {
    readonly state = input<SubmitLoaderState>('idle');
    readonly messages = input<string[]>(['Feldolgozás…']);
    readonly successTitle = input('Kész!');
    /** A siker-animáció után, amikor a fátyol eltűnt. */
    readonly closed = output<void>();

    readonly visible = signal(false);
    readonly leaving = signal(false);
    private readonly step = signal(0);
    readonly message = computed(() => { const list = this.messages(); return list[this.step() % list.length]; });

    private ticker?: ReturnType<typeof setInterval>;
    private timers: ReturnType<typeof setTimeout>[] = [];

    constructor() {
        // csak az állapotváltozás indítja újra; a belső jelek olvasása/írása nem
        effect(() => {
            const state = this.state();
            untracked(() => this.apply(state));
        });
        // A fátyol a <body> közvetlen gyereke legyen: az oldalak beúszó animációja (transform) miatt
        // a position: fixed különben a szülőhöz igazodna, és nem fedné le a fejlécet.
        const host = inject(ElementRef).nativeElement as HTMLElement;
        afterNextRender(() => document.body.appendChild(host));
        inject(DestroyRef).onDestroy(() => { this.clear(); host.remove(); });
    }

    private apply(state: SubmitLoaderState): void {
        this.clear();
        if (state === 'loading') {
            this.leaving.set(false); this.step.set(0); this.visible.set(true);
            // az utolsó állapotszövegnél megállunk (nem pörög körbe a „visszaigazolás” után)
            this.ticker = setInterval(() => this.step.update(i => Math.min(i + 1, this.messages().length - 1)), 1500);
        } else if (state === 'success' && this.visible()) {
            this.timers.push(setTimeout(() => this.leaving.set(true), 1650));
            this.timers.push(setTimeout(() => { this.visible.set(false); this.leaving.set(false); this.closed.emit(); }, 2100));
        } else {
            this.visible.set(false); this.leaving.set(false);
            if (state === 'success') this.closed.emit();
        }
    }

    private clear(): void {
        if (this.ticker) clearInterval(this.ticker);
        this.timers.forEach(clearTimeout); this.timers = [];
    }
}
