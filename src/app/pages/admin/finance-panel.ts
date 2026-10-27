import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { apiErrorMessage } from '../../core/http-error';
import { FinanceEntry, FinanceEntryInput, FinanceSettings, FinanceSummary } from '../../core/models';

const MONTHS = ['jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.', 'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.'];
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/** Pénzügyek fül: bevétel/kiadás tételek, havi összesítő, becsült átalányadó és ÁFA. */
@Component({
    selector: 'app-finance-panel',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './finance-panel.html',
    styleUrl: './finance-panel.scss'
})
export class FinancePanel implements OnInit {
    private readonly api = inject(ApiService);
    private readonly toast = inject(ToastService);

    readonly monthNames = MONTHS;
    readonly year = signal(new Date().getFullYear());
    readonly summary = signal<FinanceSummary | null>(null);
    readonly entries = signal<FinanceEntry[]>([]);
    readonly monthFilter = signal<number | null>(null);
    readonly busy = signal(false);
    readonly showSettings = signal(false);
    readonly vatRates = [0, 5, 18, 27];
    readonly incomeCategories = ['Weboldal-fejlesztés', 'Előleg', 'Karbantartás', 'Módosítás / többletmunka', 'Tanácsadás'];
    readonly expenseCategories = ['Szoftver / előfizetés', 'Tárhely / domain', 'Hardver', 'Könyvelés', 'Marketing / hirdetés', 'Képzés', 'Iroda / internet', 'Bankköltség / Stripe-díj', 'Egyéb'];

    editingId: number | null = null;
    form: FinanceEntryInput = this.blank('income');
    settings: FinanceSettings | null = null;

    readonly filteredEntries = computed(() => {
        const m = this.monthFilter();
        return m ? this.entries().filter(e => Number(e.occurred_on.slice(5, 7)) === m) : this.entries();
    });
    readonly maxBar = computed(() => Math.max(1, ...(this.summary()?.months ?? []).map(m => Math.max(m.income_gross, m.expense_gross))));

    ngOnInit(): void { this.load(); }

    load(): void {
        const y = this.year();
        this.api.financeSummary(y).subscribe({ next: r => { this.summary.set(r.data); this.settings = { ...r.data.settings }; }, error: e => this.fail(e) });
        this.api.financeEntries(y).subscribe({ next: r => this.entries.set(r.data), error: e => this.fail(e) });
    }
    changeYear(delta: number): void { this.year.update(y => y + delta); this.monthFilter.set(null); this.load(); }

    blank(type: 'income' | 'expense'): FinanceEntryInput {
        const vat = this.settings?.vat_registered ? 27 : 0;
        return { type, occurred_on: today(), amount_huf: 0, vat_rate: type === 'expense' ? 27 : vat, category: type === 'income' ? 'Weboldal-fejlesztés' : 'Szoftver / előfizetés', description: '' };
    }
    newEntry(type: 'income' | 'expense'): void { this.editingId = null; this.form = this.blank(type); }
    edit(e: FinanceEntry): void {
        this.editingId = e.id;
        this.form = { type: e.type, occurred_on: e.occurred_on.slice(0, 10), amount_huf: e.amount_huf, vat_rate: e.vat_rate, category: e.category, description: e.description ?? '' };
    }
    isStripe(id: number | null): boolean { return !!id && this.entries().find(e => e.id === id)?.source === 'stripe'; }

    save(): void {
        const f = this.form;
        const amount = Math.round(Number(String(f.amount_huf).replace(/\s/g, '')));
        if (!Number.isFinite(amount) || amount < 1) { this.toast.error('Adj meg pozitív összeget (bruttó, forintban).'); return; }
        if (!f.category || f.category.trim().length < 2) { this.toast.error('Válassz vagy írj be kategóriát.'); return; }
        const payload: FinanceEntryInput = { ...f, amount_huf: amount, vat_rate: Number(f.vat_rate), description: f.description?.trim() || null };
        const body = this.isStripe(this.editingId)
            ? ({ category: payload.category, description: payload.description, vat_rate: payload.vat_rate } as FinanceEntryInput)
            : payload;
        this.busy.set(true);
        this.api.saveFinanceEntry(this.editingId, body).subscribe({
            next: () => { this.busy.set(false); this.toast.success(this.editingId ? 'Tétel módosítva.' : 'Tétel rögzítve.'); this.editingId = null; this.form = this.blank(f.type); this.load(); },
            error: e => this.fail(e)
        });
    }
    remove(e: FinanceEntry): void {
        if (!confirm(`Törlöd ezt a tételt? (${this.money(e.amount_huf)} – ${e.category})`)) return;
        this.api.deleteFinanceEntry(e.id).subscribe({ next: r => { this.toast.success(r.message); this.load(); }, error: err => this.fail(err) });
    }

    saveSettings(): void {
        if (!this.settings) return;
        this.busy.set(true);
        const s = this.settings;
        this.api.saveFinanceSettings({
            vat_registered: s.vat_registered, vat_exempt_limit_huf: Number(s.vat_exempt_limit_huf), cost_ratio_percent: Number(s.cost_ratio_percent),
            tax_free_income_huf: Number(s.tax_free_income_huf), szja_percent: Number(s.szja_percent), tb_percent: Number(s.tb_percent),
            szocho_percent: Number(s.szocho_percent), full_time: s.full_time, min_base_monthly_huf: Number(s.min_base_monthly_huf),
            atalany_income_limit_huf: Number(s.atalany_income_limit_huf),
        }).subscribe({ next: () => { this.busy.set(false); this.toast.success('Pénzügyi beállítások mentve.'); this.showSettings.set(false); this.load(); }, error: e => this.fail(e) });
    }

    /** Az ÁFA-kulcs alapján a bruttóból számolt nettó, a bevitel közbeni előnézethez. */
    preview(): string {
        const gross = Math.round(Number(String(this.form.amount_huf).replace(/\s/g, ''))) || 0;
        const net = Math.round(gross / (1 + Number(this.form.vat_rate) / 100));
        return Number(this.form.vat_rate) ? `Nettó ${this.money(net)} + ÁFA ${this.money(gross - net)}` : 'ÁFA nélkül (alanyi mentes / nem tartalmaz ÁFA-t)';
    }

    money(v: number | null | undefined): string { return new Intl.NumberFormat('hu-HU').format(Math.round(v ?? 0)) + ' Ft'; }
    pct(v: number, max: number): number { return Math.max(0, Math.min(100, (v / max) * 100)); }
    date(v: string): string { return new Date(v.slice(0, 10) + 'T00:00:00').toLocaleDateString('hu-HU'); }

    private fail(e: unknown): void {
        this.busy.set(false);
        this.toast.error(apiErrorMessage(e));
    }
}
