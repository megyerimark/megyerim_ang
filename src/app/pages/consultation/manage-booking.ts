import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { ManagedConsultation } from '../../core/models';
import { I18nService } from '../../i18n/i18n.service';
import { LpPipe } from '../../i18n/lp.pipe';
import { TPipe } from '../../i18n/t.pipe';

/**
 * Konzultáció önkiszolgálás (/konzultacio/foglalasom#<kulcs>): a visszaigazoló levélben kapott személyes linkkel
 * az ügyfél megnézheti, átfoglalhatja vagy lemondhatja az időpontját (legkésőbb 2 órával előtte).
 * A kulcs a címsor # utáni részében van, így nem kerül szervernaplóba és hivatkozó (Referer) fejlécbe.
 */
@Component({
    selector: 'app-manage-booking',
    standalone: true,
    imports: [RouterLink, TPipe, LpPipe],
    templateUrl: './manage-booking.html',
    styleUrl: './consultation.scss'
})
export class ManageBookingPage implements OnInit {
    readonly i18n = inject(I18nService);
    private readonly api = inject(ApiService);
    private token = '';
    readonly loading = signal(true);
    readonly busy = signal(false);
    readonly booking = signal<ManagedConsultation | null>(null);
    readonly state = signal<'view' | 'rescheduled' | 'cancelled' | 'invalid'>('view');
    readonly selected = signal<number | null>(null);
    readonly confirmCancel = signal(false);
    readonly error = signal('');

    ngOnInit(): void {
        const hash = typeof location !== 'undefined' ? location.hash.slice(1) : '';
        if (!/^[a-f0-9]{64}$/.test(hash)) { this.loading.set(false); this.state.set('invalid'); return; }
        this.token = hash;
        // a kulcs ne maradjon a böngésző előzményeiben látható címben
        history.replaceState(null, '', location.pathname);
        this.load();
    }

    private load(): void {
        this.loading.set(true);
        this.api.manageConsultation(this.token).subscribe({
            next: r => { this.booking.set(r.data); this.loading.set(false); },
            error: () => { this.loading.set(false); this.state.set('invalid'); }
        });
    }

    date(iso: string): string {
        return new Date(iso).toLocaleString(this.i18n.lang() === 'en' ? 'en-GB' : 'hu-HU', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Budapest' });
    }

    reschedule(): void {
        const id = this.selected();
        if (!id || this.busy()) return;
        this.busy.set(true); this.error.set('');
        this.api.rescheduleConsultation(this.token, id).subscribe({
            next: r => {
                const b = this.booking();
                if (b) this.booking.set({ ...b, starts_at: r.data.starts_at, duration_minutes: r.data.duration_minutes });
                this.state.set('rescheduled'); this.busy.set(false);
            },
            error: (e: HttpErrorResponse) => { this.fail(e); this.load(); }
        });
    }

    cancel(): void {
        if (this.busy()) return;
        this.busy.set(true); this.error.set('');
        this.api.cancelConsultation(this.token).subscribe({
            next: () => { this.state.set('cancelled'); this.busy.set(false); },
            error: (e: HttpErrorResponse) => this.fail(e)
        });
    }

    private fail(e: HttpErrorResponse): void {
        this.busy.set(false);
        const first = e.error?.errors ? Object.values(e.error.errors as Record<string, string[]>)[0]?.[0] : null;
        this.error.set(first || (e.status === 429 ? 'Túl sok próbálkozás. Próbáld újra pár perc múlva.' : 'A módosítás nem sikerült. Próbáld újra.'));
    }
}
