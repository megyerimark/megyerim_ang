import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { apiErrorMessage } from '../../core/http-error';
import { BrevoStatus, NewsletterCampaign, NewsletterCounts, NewsletterSubscriber } from '../../core/models';

/** Hírlevél fül: feliratkozók (kettős megerősítéssel), Brevo-szinkron, import, CSV-export, GDPR-törlés. */
@Component({
    selector: 'app-newsletter-panel',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './newsletter-panel.html',
    styleUrl: './finance-panel.scss'
})
export class NewsletterPanel implements OnInit {
    private readonly api = inject(ApiService);
    private readonly toast = inject(ToastService);
    readonly items = signal<NewsletterSubscriber[]>([]);
    readonly counts = signal<NewsletterCounts>({ confirmed: 0, pending: 0, unsubscribed: 0 });
    readonly loading = signal(true);
    q = '';
    status = '';
    readonly campaigns = signal<NewsletterCampaign[]>([]);
    readonly audience = signal<{ all: number; hu: number; en: number }>({ all: 0, hu: 0, en: 0 });
    readonly sending = signal(false);
    draft: { subject: string; body: string; button_text: string; button_url: string; audience: 'all' | 'hu' | 'en' } = { subject: '', body: '', button_text: '', button_url: '', audience: 'all' };
    readonly brevo = signal<BrevoStatus | null>(null);
    readonly syncing = signal(false);
    readonly importing = signal(false);
    importOpen = false;
    importDraft: { emails: string; lang: 'hu' | 'en'; consent_note: string; confirm: boolean } = { emails: '', lang: 'hu', consent_note: '', confirm: false };
    readonly welcomeLabel: Record<string, string> = { queued: 'üdvözlő sorozat: indul', added: 'üdvözlő sorozat: elindult', skipped: 'üdvözlő sorozat nélkül' };
    readonly statusLabel: Record<string, string> = { confirmed: 'Megerősítve', pending: 'Megerősítésre vár', unsubscribed: 'Leiratkozott' };

    ngOnInit(): void { this.load(); this.loadCampaigns(); }
    loadCampaigns(): void {
        this.api.newsletterCampaigns().subscribe({ next: r => { this.campaigns.set(r.data); this.audience.set(r.audience); }, error: () => {} });
    }
    private payload() {
        const d = this.draft;
        return { subject: d.subject.trim(), body: d.body.trim(), audience: d.audience, button_text: d.button_text.trim() || null, button_url: d.button_url.trim() || null };
    }
    private valid(): boolean {
        const p = this.payload();
        if (p.subject.length < 3 || p.body.length < 10) { this.toast.error('Add meg a tárgyat és legalább pár mondatos szöveget.'); return false; }
        if (!!p.button_text !== !!p.button_url) { this.toast.error('A gombhoz felirat és link is kell (vagy egyik se).'); return false; }
        if (p.button_url && !/^https:\/\//i.test(p.button_url)) { this.toast.error('A gomb linkje https://-sel kezdődjön.'); return false; }
        return true;
    }
    sendTest(): void {
        if (!this.valid()) return;
        this.sending.set(true);
        this.api.newsletterTest(this.payload()).subscribe({ next: r => { this.toast.success(r.message); this.sending.set(false); }, error: e => { this.toast.error(apiErrorMessage(e)); this.sending.set(false); } });
    }
    sendCampaign(): void {
        if (!this.valid()) return;
        const n = this.audience()[this.draft.audience];
        if (!confirm(`Biztosan kiküldöd ${n} feliratkozónak? Ez nem vonható vissza.`)) return;
        this.sending.set(true);
        this.api.newsletterSend({ ...this.payload(), confirm: true }).subscribe({
            next: r => { this.toast.success(r.message); this.sending.set(false); this.draft = { subject: '', body: '', button_text: '', button_url: '', audience: 'all' }; setTimeout(() => this.loadCampaigns(), 1500); },
            error: e => { this.toast.error(apiErrorMessage(e)); this.sending.set(false); }
        });
    }
    load(): void {
        this.loading.set(true);
        this.api.adminNewsletter(this.q.trim(), this.status).subscribe({
            next: r => { this.items.set(r.data); this.counts.set(r.counts); this.brevo.set(r.brevo ?? null); this.loading.set(false); },
            error: e => { this.loading.set(false); this.toast.error(apiErrorMessage(e)); }
        });
    }
    syncBrevo(): void {
        this.syncing.set(true);
        this.api.brevoSync().subscribe({
            next: r => { this.toast.success(r.message); this.brevo.set(r.brevo); this.syncing.set(false); this.load(); },
            error: e => { this.toast.error(apiErrorMessage(e)); this.syncing.set(false); }
        });
    }
    /** Brevo-állapot egy sorhoz (csak ha a Brevo be van állítva). */
    brevoState(s: NewsletterSubscriber): string {
        if (!this.brevo()?.configured || s.status === 'pending') return '';
        if (s.brevo_synced_at) return 'Brevo ✓';
        return s.brevo_error ? 'Brevo: hiba – újrapróbálja' : 'Brevo: szinkronra vár';
    }
    importCount(): number {
        return new Set(this.importDraft.emails.split(/[\s,;]+/).map(e => e.trim().toLowerCase()).filter(e => e.includes('@'))).size;
    }
    runImport(): void {
        const d = this.importDraft;
        if (!this.importCount()) { this.toast.error('Adj meg legalább egy e-mail-címet.'); return; }
        if (d.consent_note.trim().length < 10) { this.toast.error('Írd le, hol és mikor adtak marketing-hozzájárulást (legalább 10 karakter).'); return; }
        if (!d.confirm) { this.toast.error('Erősítsd meg, hogy mindegyik címhez van igazolható hozzájárulás.'); return; }
        this.importing.set(true);
        this.api.importNewsletter({ emails: d.emails, lang: d.lang, consent_note: d.consent_note.trim(), confirm: true }).subscribe({
            next: r => { this.toast.success(r.message); this.importing.set(false); this.importOpen = false; this.importDraft = { emails: '', lang: 'hu', consent_note: '', confirm: false }; this.load(); this.loadCampaigns(); },
            error: e => { this.toast.error(apiErrorMessage(e)); this.importing.set(false); }
        });
    }
    exportCsv(): void {
        this.api.exportNewsletter().subscribe({
            next: blob => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `hirlevel-feliratkozok-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); },
            error: e => this.toast.error(apiErrorMessage(e))
        });
    }
    remove(s: NewsletterSubscriber): void {
        if (!confirm(`Véglegesen törlöd: ${s.email}? (GDPR törlési kérelem esetén.)`)) return;
        this.api.deleteNewsletterSubscriber(s.id).subscribe({ next: r => { this.toast.success(r.message); this.load(); }, error: e => this.toast.error(apiErrorMessage(e)) });
    }
    date(v: string | null): string { return v ? new Date(v).toLocaleDateString('hu-HU') : '—'; }
}
