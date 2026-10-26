import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { Credential, VaultMeta, VaultService } from '../../core/vault.service';
import { ClientSite, ClientSiteInput } from '../../core/models';

type Editor = ClientSiteInput & { id: number | null };

const EMPTY: Editor = {
    id: null, name: '', domain: '', quote_request_id: null, client_name: '', client_email: '', launched_on: '',
    hosting_provider: '', domain_registrar: '', domain_expires_on: '', hosting_expires_on: '', ssl_expires_on: '',
    tech_stack: '', notes: '',
};
const emptyCredential = (): Credential => ({ label: '', url: '', username: '', password: '', note: '' });

/**
 * „Kész projektek” fül: élesített oldalak nyilvántartása és titkosított hozzáférés-széf.
 * A hozzáférési adatokat a VaultService a böngészőben titkosítja; a szerver csak titkosított blobot kap.
 */
@Component({
    selector: 'app-sites-panel',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './sites-panel.html',
    styleUrl: './sites-panel.scss'
})
export class SitesPanel implements OnInit {
    private readonly api = inject(ApiService);
    private readonly toast = inject(ToastService);
    readonly vault = inject(VaultService);

    readonly sites = signal<ClientSite[]>([]);
    readonly meta = signal<VaultMeta | null | undefined>(undefined);
    readonly editor = signal<Editor | null>(null);
    readonly credentials = signal<Credential[]>([]);
    readonly revealed = signal<Set<number>>(new Set());
    readonly busy = signal(false);
    readonly showRotate = signal(false);
    vaultPassword = '';
    vaultPassword2 = '';
    filter = '';

    ngOnInit(): void { this.load(); }

    load(): void {
        this.api.sites().subscribe({ next: r => this.sites.set(r.data), error: e => this.fail(e) });
        this.api.vault().subscribe({ next: r => this.meta.set(r.data), error: e => this.fail(e) });
    }

    filtered(): ClientSite[] {
        const q = this.filter.trim().toLowerCase();
        return q ? this.sites().filter(s => [s.name, s.domain, s.client_name, s.client_email].some(v => v?.toLowerCase().includes(q))) : this.sites();
    }

    // ---- Széf ----
    async createVault(): Promise<void> {
        if (this.vaultPassword.length < 12 || this.vaultPassword !== this.vaultPassword2) {
            this.toast.error('A széfjelszó legalább 12 karakter legyen, és a két mező egyezzen.'); return;
        }
        if (!confirm('Fontos: a széfjelszót a szerver nem ismeri. Ha elfelejted, a hozzáférések NEM állíthatók vissza. Felírtad biztonságos helyre?')) return;
        this.busy.set(true);
        const meta = await this.vault.create(this.vaultPassword);
        this.api.saveVault(meta).subscribe({
            next: r => { this.busy.set(false); this.meta.set(meta); this.clearPasswords(); this.toast.success(r.message); },
            error: e => { this.vault.lock(); this.fail(e); }
        });
    }

    async unlock(): Promise<void> {
        const meta = this.meta();
        if (!meta || !this.vaultPassword) return;
        this.busy.set(true);
        const ok = await this.vault.unlock(this.vaultPassword, meta);
        this.busy.set(false);
        this.clearPasswords();
        if (!ok) { this.toast.error('Hibás széfjelszó.'); return; }
        this.toast.success('Széf feloldva – 10 perc tétlenség után automatikusan zárol.');
        const current = this.editor();
        if (current?.id) await this.loadCredentials(current.id);
    }

    lock(): void { this.vault.lock(); this.credentials.set([]); this.revealed.set(new Set()); }

    async rotate(): Promise<void> {
        if (this.vaultPassword.length < 12 || this.vaultPassword !== this.vaultPassword2) {
            this.toast.error('Az új széfjelszó legalább 12 karakter legyen, és a két mező egyezzen.'); return;
        }
        this.busy.set(true);
        try {
            const blobs = this.sites().filter(s => s.vault_blob).map(s => ({ id: s.id, vault_blob: s.vault_blob as string }));
            const payload = await this.vault.rotate(this.vaultPassword, blobs);
            this.api.saveVault(payload).subscribe({
                next: r => { this.busy.set(false); this.clearPasswords(); this.showRotate.set(false); this.toast.success(r.message); this.load(); },
                error: e => { this.lock(); this.fail(e); this.toast.error('A jelszócsere nem sikerült, a régi jelszó érvényes. Nyisd meg újra a széfet.'); }
            });
        } catch {
            this.busy.set(false);
            this.toast.error('Nem sikerült minden bejegyzést visszafejteni – a jelszócsere megszakadt.');
        }
    }

    private clearPasswords(): void { this.vaultPassword = ''; this.vaultPassword2 = ''; }

    // ---- Projektek ----
    edit(site?: ClientSite): void {
        this.revealed.set(new Set());
        if (!site) { this.editor.set({ ...EMPTY }); this.credentials.set([emptyCredential()]); return; }
        const { vault_blob: _blob, ...rest } = site;
        this.editor.set({ ...EMPTY, ...rest });
        this.credentials.set([]);
        if (this.vault.unlocked()) void this.loadCredentials(site.id);
    }

    private async loadCredentials(id: number): Promise<void> {
        const blob = this.sites().find(s => s.id === id)?.vault_blob;
        if (!blob) { this.credentials.set([emptyCredential()]); return; }
        try { this.credentials.set(await this.vault.decrypt(blob)); }
        catch { this.toast.error('A hozzáférések nem fejthetők vissza ezzel a széfjelszóval.'); }
    }

    addCredential(): void { this.credentials.update(list => [...list, emptyCredential()]); }
    removeCredential(index: number): void { this.credentials.update(list => list.filter((_, i) => i !== index)); }
    toggleReveal(index: number): void {
        this.revealed.update(set => { const next = new Set(set); next.has(index) ? next.delete(index) : next.add(index); return next; });
    }
    async copy(text: string, what: string): Promise<void> {
        try { await navigator.clipboard.writeText(text); this.toast.success(`${what} a vágólapra másolva.`); }
        catch { this.toast.error('A másolás nem sikerült.'); }
    }
    generatePassword(index: number): void {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#%^*-_=+';
        const bytes = crypto.getRandomValues(new Uint32Array(20));
        const password = Array.from(bytes, b => chars[b % chars.length]).join('');
        this.credentials.update(list => list.map((c, i) => i === index ? { ...c, password } : c));
        this.revealed.update(set => new Set(set).add(index));
    }

    async save(): Promise<void> {
        const e = this.editor();
        if (!e || e.name.trim().length < 2) { this.toast.error('Adj meg egy projektnevet.'); return; }
        const { id, ...fields } = e;
        const data: Partial<ClientSiteInput> = Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v === '' ? null : v]));
        data.domain = data.domain?.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '') || null;
        if (this.vault.unlocked()) {
            const filled = this.credentials().filter(c => c.label || c.username || c.password || c.url);
            data.vault_blob = filled.length ? await this.vault.encrypt(filled) : null;
        }
        this.busy.set(true);
        this.api.saveSite(id, data).subscribe({
            next: () => { this.busy.set(false); this.editor.set(null); this.credentials.set([]); this.toast.success('Projekt mentve.'); this.load(); },
            error: err => this.fail(err)
        });
    }

    remove(site: ClientSite): void {
        if (!confirm(`Törlöd: ${site.name}? A titkosított hozzáférései is törlődnek.`)) return;
        this.api.deleteSite(site.id).subscribe({ next: r => { this.toast.success(r.message); this.editor.set(null); this.load(); }, error: e => this.fail(e) });
    }

    // ---- Megjelenítés ----
    daysLeft(date: string | null): number | null {
        if (!date) return null;
        return Math.round((new Date(date.slice(0, 10) + 'T00:00:00').getTime() - new Date(new Date().toDateString()).getTime()) / 86_400_000);
    }
    expiryClass(date: string | null): string {
        const d = this.daysLeft(date);
        return d === null ? '' : d < 0 ? 'expired' : d <= 7 ? 'soon' : d <= 30 ? 'near' : 'ok';
    }
    fmt(date: string | null): string { return date ? new Date(date.slice(0, 10) + 'T00:00:00').toLocaleDateString('hu-HU') : '—'; }
    hasVault(site: ClientSite): boolean { return !!site.vault_blob; }

    private fail(e: unknown): void {
        this.busy.set(false);
        const err = e as HttpErrorResponse;
        const fields = err.error?.errors as Record<string, string[]> | undefined;
        this.toast.error(fields ? Object.values(fields).flat().join(' · ') : err.error?.message || 'Szerverhiba. Próbáld újra.');
    }
}
