import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Meta } from '@angular/platform-browser';
import { ApiService } from '../../core/api.service';
import { ClientProject, ProjectCollaboration, ProjectDocument, QuoteStatus } from '../../core/models';

@Component({ selector: 'app-client-project', standalone: true, imports: [RouterLink, FormsModule], templateUrl: './client-project.html', styleUrl: './client-project.scss' })
export class ClientProjectPage implements OnInit, OnDestroy {
    private readonly api = inject(ApiService);
    private readonly route = inject(ActivatedRoute);
    private readonly meta = inject(Meta);
    private token = '';
    project = signal<ClientProject | null>(null);
    loading = signal(true);
    accepting = signal(false);
    consent = signal(false);
    error = signal('');
    message = signal('');
    collaboration = signal<ProjectCollaboration>({ messages: [], documents: [] });
    newMessage = '';
    sendingMessage = signal(false);
    downloadingId = signal<number | null>(null);
    readonly steps = [
        { label: 'Megkeresés', text: 'A projektigény beérkezett.' },
        { label: 'Ajánlat', text: 'Az ajánlatot e-mailben elküldtük.' },
        { label: 'Elfogadás', text: 'Az ügyfél visszaigazolta az ajánlatot.' },
        { label: 'Lezárás', text: 'A megkeresés lezárult.' }
    ];
    readonly stages: Record<QuoteStatus, number> = { new: 1, reviewing: 1, quoted: 2, accepted: 3, rejected: 1, completed: 4 };

    ngOnInit(): void {
        this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow, noarchive' });
        // The secret is only in the URL fragment, which is never sent to the web server.
        this.token = this.route.snapshot.fragment || '';
        if (!/^[a-f0-9]{64}$/.test(this.token)) {
            this.error.set('Érvénytelen vagy hiányzó privát projektlink. A pontos e-mailben kapott linket nyisd meg.');
            this.loading.set(false);
            return;
        }
        this.api.clientProject(this.token).subscribe({
            next: result => { this.project.set(result.data); this.loading.set(false); this.loadCollaboration(); },
            error: () => { this.error.set('Ez a hozzáférési link nem érvényes, vagy a szolgáltatás átmenetileg nem érhető el.'); this.loading.set(false); }
        });
    }
    ngOnDestroy(): void { this.meta.removeTag('name="robots"'); }
    money(value: number): string { return new Intl.NumberFormat('hu-HU').format(value) + ' Ft'; }
    date(value: string | null): string { return value ? new Date(value).toLocaleDateString('hu-HU') : '—'; }
    status(status: QuoteStatus): string {
        const names: Record<QuoteStatus, string> = { new: 'Beérkezett', reviewing: 'Áttekintés alatt', quoted: 'Ajánlat elküldve', accepted: 'Ajánlat elfogadva', rejected: 'Lezárt, nem elfogadott', completed: 'Lezárt' };
        return names[status];
    }
    canAccept(item: ClientProject): boolean {
        if (item.status !== 'quoted' || !item.quoted_at || !item.proposal_valid_until) return false;
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        return item.proposal_valid_until.slice(0, 10) >= today;
    }
    accept(): void {
        const item = this.project();
        if (!item || !this.consent() || !this.canAccept(item)) return;
        this.accepting.set(true);
        this.error.set('');
        this.api.acceptProposal(this.token).subscribe({
            next: result => { this.project.set(result.data); this.message.set('Az ajánlat elfogadását rögzítettük. Hamarosan egyeztetünk a következő lépésekről.'); this.accepting.set(false); },
            error: (e: HttpErrorResponse) => { this.error.set(e.error?.message || 'Nem sikerült az ajánlat elfogadása.'); this.accepting.set(false); }
        });
    }
    loadCollaboration(): void {
        this.api.clientCollaboration(this.token).subscribe({
            next: result => this.collaboration.set(result.data),
            error: () => this.error.set('Az üzenetek és dokumentumok átmenetileg nem érhetők el.')
        });
    }
    sendMessage(): void {
        if (this.sendingMessage() || this.newMessage.trim().length < 2) return;
        this.sendingMessage.set(true);
        this.api.sendClientMessage(this.token, this.newMessage.trim()).subscribe({
            next: () => { this.newMessage = ''; this.sendingMessage.set(false); this.loadCollaboration(); },
            error: () => { this.sendingMessage.set(false); this.error.set('Az üzenetet nem sikerült elküldeni.'); }
        });
    }
    downloadDocument(doc: ProjectDocument): void {
        this.downloadingId.set(doc.id);
        this.api.downloadClientDocument(this.token, doc.id).subscribe({
            next: blob => { this.saveBlob(blob, doc.filename); this.downloadingId.set(null); },
            error: () => { this.downloadingId.set(null); this.error.set('A dokumentum nem tölthető le.'); }
        });
    }
    private saveBlob(blob: Blob, filename: string): void {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    printProposal(): void { window.print(); }
}
