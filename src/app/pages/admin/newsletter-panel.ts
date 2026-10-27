import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { apiErrorMessage } from '../../core/http-error';
import { NewsletterCounts, NewsletterSubscriber } from '../../core/models';

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
    readonly statusLabel: Record<string, string> = { confirmed: 'Megerősítve', pending: 'Megerősítésre vár', unsubscribed: 'Leiratkozott' };

    ngOnInit(): void { this.load(); }
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
