import { Component, OnInit, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/api.service';
import { ConsultationSlot } from '../../core/models';
import { TPipe } from '../../i18n/t.pipe';
import { I18nService } from '../../i18n/i18n.service';
import { Turnstile } from '../../components/turnstile/turnstile';
import { SubmitLoaderService } from '../../core/submit-loader.service';
import { LpPipe } from '../../i18n/lp.pipe';

@Component({ selector: 'app-consultation', standalone: true, imports: [LpPipe, FormsModule, RouterLink, TPipe, Turnstile], templateUrl: './consultation.html', styleUrl: './consultation.scss' })
export class ConsultationPage implements OnInit {
    readonly i18n = inject(I18nService);
    private readonly api = inject(ApiService);
    slots = signal<ConsultationSlot[]>([]);
    loading = signal(true);
    sending = signal(false);
    selectedSlot = signal<number | null>(null);
    confirmation = signal<{reference: number; starts_at: string; duration_minutes: number} | null>(null);
    error = signal('');
    data = {customer_name: '', email: '', phone: '', notes: '', privacy_notice_acknowledged: false, website: '', turnstile_token: ''};
    private readonly captcha = viewChild(Turnstile);
    private readonly loader = inject(SubmitLoaderService);
    ngOnInit(): void { this.load(); }
    load(): void {
        this.loading.set(true);
        this.api.availableConsultations().subscribe({
            next: r => {this.slots.set(r.data); this.loading.set(false);},
            error: () => { this.loading.set(false); this.error.set('Az időpontok nem tölthetők be. Próbáld újra később.'); }
        });
    }
    date(date: string): string {
        return new Date(date).toLocaleString(this.i18n.lang() === 'en' ? 'en-GB' : 'hu-HU', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Budapest' });
    }
    book(): void {
        if (this.sending() || !this.selectedSlot()) return;
        if (!this.data.customer_name.trim() || !/^\S+@\S+\.\S+$/.test(this.data.email) || !this.data.privacy_notice_acknowledged) {
            this.error.set('A név, érvényes e-mail-cím és az adatkezelés tudomásulvétele kötelező.'); return;
        }
        if (this.captcha() && !this.captcha()!.ready()) { this.error.set('Várd meg, amíg a robotszűrő ellenőrzése befejeződik.'); return; }
        this.error.set(''); this.sending.set(true);
        this.loader.start(['Időpont ellenőrzése…', 'Foglalás rögzítése…', 'Visszaigazolás előkészítése…']);
        this.api.bookConsultation({...this.data, consultation_slot_id: this.selectedSlot()!}).subscribe({
            next: r => { this.confirmation.set(r); this.sending.set(false); this.slots.set([]); this.loader.succeed('Időpont lefoglalva!'); },
            error: (e: HttpErrorResponse) => {
                this.loader.stop();
                this.captcha()?.reset();
                const fieldError = e.error?.errors?.email?.[0] ?? e.error?.errors?.turnstile_token?.[0];
                this.error.set(e.status === 422 ? (fieldError || 'Az adatok vagy az időpont nem érvényes. Frissítsd az időpontokat és próbáld újra.') : 'A foglalás nem sikerült. Próbáld újra.');
                this.sending.set(false); this.load();
            }
        });
    }
    addToCalendar(): void {
        const booking = this.confirmation(); if (!booking) return;
        const start = new Date(booking.starts_at);
        const end = new Date(start.getTime() + booking.duration_minutes * 60000);
        const utc = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
        const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Megyeri//Konzultacio//HU','CALSCALE:GREGORIAN','BEGIN:VEVENT',
            `UID:konzultacio-${booking.reference}@megyerimarkmate.hu`,`DTSTAMP:${utc(new Date())}`,
            `DTSTART:${utc(start)}`,`DTEND:${utc(end)}`,'SUMMARY:Webfejlesztési konzultáció – Megyeri Márk Máté',
            'DESCRIPTION:A konzultáció részleteit külön egyeztetjük.','END:VEVENT','END:VCALENDAR'];
        const file = new Blob([lines.join('\r\n')+'\r\n'], {type:'text/calendar;charset=utf-8'});
        const url = URL.createObjectURL(file); const link = document.createElement('a');
        link.href = url; link.download = `megyeri-konzultacio-${booking.reference}.ics`; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

}
