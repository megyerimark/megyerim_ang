import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Meta } from '@angular/platform-browser';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { SubmitLoaderService } from '../../core/submit-loader.service';
import { ClientProject, ProjectCollaboration, ProjectDocument, QuoteStatus } from '../../core/models';
import { LpPipe } from '../../i18n/lp.pipe';

@Component({ selector: 'app-client-project', standalone: true, imports: [LpPipe, RouterLink, FormsModule], templateUrl: './client-project.html', styleUrl: './client-project.scss' })
export class ClientProjectPage implements OnInit, OnDestroy {
    private readonly api = inject(ApiService);
    private readonly route = inject(ActivatedRoute);
    private readonly meta = inject(Meta);
    private readonly toast = inject(ToastService);
    private readonly loader = inject(SubmitLoaderService);
    /** Vissza gombbal a Stripe-ról visszatérve (bfcache) a gombok ne maradjanak letiltva. */
    private readonly onPageShow = (e: PageTransitionEvent) => { if (e.persisted) { this.paying.set(false); this.accepting.set(false); } };
    private token = '';
    project = signal<ClientProject | null>(null);
    loading = signal(true);
    accepting = signal(false);
    consent = signal(false);
    earlyStart = signal(false);
    paying = signal(false);
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
        addEventListener('pageshow', this.onPageShow);
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
    ngOnDestroy(): void { this.meta.removeTag('name="robots"'); removeEventListener('pageshow', this.onPageShow); }
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
        this.loader.start(['Ajánlat ellenőrzése…', 'Elfogadás rögzítése…', 'Szerződés véglegesítése…']);
        this.api.acceptProposal(this.token, this.earlyStart()).subscribe({
            next: result => {
                this.project.set(result.data);
                // Kötelező előleg: azonnal a Stripe biztonságos fizetési oldalára irányítjuk.
                if (result.payment_url) {
                    this.message.set('Az ajánlat elfogadását rögzítettük. Átirányítás az előleg fizetéséhez…');
                    this.toast.info('Ajánlat elfogadva – átirányítás a biztonságos fizetési oldalra…');
                    this.loader.redirect(result.payment_url, 'Ajánlat elfogadva – átirányítás a biztonságos fizetéshez…', 900);
                    return;
                }
                this.accepting.set(false);
                // Ha a szerver nem tudott fizetési oldalt nyitni, de online fizetés van és előleg jár:
                // egyszer automatikusan újrapróbáljuk (a szerver a már nyitott munkamenetet adja vissza, dupla fizetés nem lehet).
                const depositDue = !!result.data.deposit_amount_huf && !result.data.deposit_paid_at;
                if (depositDue && result.data.online_payment && result.payment_status !== 'transfer_only') {
                    this.message.set('Az ajánlat elfogadását rögzítettük. Átirányítás az előleg fizetéséhez…');
                    this.payDeposit();
                    return;
                }
                this.loader.succeed('Ajánlat elfogadva!');
                this.message.set(result.data.deposit_amount_huf && !result.data.deposit_paid_at
                    ? 'Az ajánlat elfogadását rögzítettük. A munka az előleg beérkezése után indul – lent fizetheted, vagy írj, és küldöm a díjbekérőt.'
                    : 'Az ajánlat elfogadását rögzítettük. Hamarosan egyeztetünk a következő lépésekről.');
                setTimeout(() => document.getElementById('fizetes')?.scrollIntoView({ behavior: 'smooth' }), 200);
            },
            error: (e: HttpErrorResponse) => { this.loader.stop(); this.error.set(e.error?.message || 'Nem sikerült az ajánlat elfogadása.'); this.accepting.set(false); }
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
        this.loader.start(['Üzenet küldése…']);
        this.api.sendClientMessage(this.token, this.newMessage.trim()).subscribe({
            next: () => { this.loader.succeed('Üzenet elküldve!'); this.newMessage = ''; this.sendingMessage.set(false); this.loadCollaboration(); this.toast.success('Üzenet elküldve. Hamarosan válaszolok.'); },
            error: () => { this.loader.stop(); this.sendingMessage.set(false); this.toast.error('Az üzenetet nem sikerült elküldeni. Próbáld újra.'); }
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
    /** Stripe Checkout: a szerver friss fizetési munkamenetet nyit, mi csak átirányítunk. */
    private redirect(request: ReturnType<ApiService['depositCheckout']>, portal = false): void {
        if (this.paying()) return;
        this.paying.set(true);
        this.loader.start(portal
            ? ['Számlázási portál megnyitása…', 'Biztonságos kapcsolat a Stripe-pal…']
            : ['Fizetés előkészítése…', 'Biztonságos kapcsolat a Stripe-pal…', 'Átirányítás a fizetési oldalra…']);
        request.subscribe({
            next: r => this.loader.redirect(r.url, portal ? 'Átirányítás a számlázási portálra…' : 'Átirányítás a biztonságos fizetési oldalra…'),
            error: (e: HttpErrorResponse) => {
                this.loader.stop();
                this.paying.set(false);
                const text = e.error?.errors?.payment?.[0] || e.error?.message || 'A fizetési oldal most nem nyitható meg.';
                this.toast.error(text);
                this.error.set(text + ' A lenti „Fizetés” gombbal később újra megpróbálhatod, vagy fizethetsz átutalással is.');
                setTimeout(() => document.getElementById('fizetes')?.scrollIntoView({ behavior: 'smooth' }), 200);
            }
        });
    }
    payDeposit(): void { this.redirect(this.api.depositCheckout(this.token)); }
    payFinal(): void { this.redirect(this.api.finalCheckout(this.token)); }
    startMaintenance(): void { this.redirect(this.api.maintenanceCheckout(this.token)); }
    manageBilling(): void { this.redirect(this.api.billingPortal(this.token), true); }
    subscriptionLabel(status: string): string {
        const labels: Record<string, string> = { active: 'Aktív', trialing: 'Próbaidőszak', past_due: 'Sikertelen terhelés – frissítsd a kártyádat', canceled: 'Lemondva', unpaid: 'Kifizetetlen', paused: 'Szüneteltetve', incomplete: 'Függőben' };
        return status.endsWith('_cancel_scheduled') ? 'Aktív – az időszak végén megszűnik' : (labels[status] ?? status);
    }
}
