import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { apiErrorMessage } from '../../core/http-error';
import { NewsletterCampaign, NewsletterCounts, NewsletterSubscriber } from '../../core/models';

/** Hírlevél fül: feliratkozók (kettős megerősítéssel), CSV-export, GDPR-törlés. */
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
            next: r => { this.items.set(r.data); this.counts.set(r.counts); this.loading.set(false); },
            error: e => { this.loading.set(false); this.toast.error(apiErrorMessage(e)); }
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
