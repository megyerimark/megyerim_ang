import { Component, HostListener, inject, OnDestroy, OnInit, signal, computed } from '@angular/core';
import { I18nService } from '../../i18n/i18n.service';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '../../core/toast.service';
import { apiErrorMessage, FRONTEND_VERSION } from '../../core/http-error';
import { SitesPanel } from './sites-panel';
import { FinancePanel } from './finance-panel';
import { NewsletterPanel } from './newsletter-panel';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { AdminSecurityStatus, SystemStatus, Activity, Client, ConsultationSlot, Dashboard, Project, ProjectMilestone, ProjectCollaboration, ProjectDocument, Quote, QuoteStatus, Service, SiteSettings, SITE_DEFAULTS, STATUS_OPTIONS, MaintenanceAgreement, MaintenanceEditor, MaintenanceData, QuoteBoard, StudioTask, GrowthData, Testimonial } from '../../core/models';
type Tab = 'dashboard' | 'growth' | 'newsletter' | 'testimonials' | 'workspace' | 'maintenance' | 'sites' | 'finance' | 'consultations' | 'quotes' | 'clients' | 'projects' | 'services' | 'settings' | 'activity' | 'account';
/** Fejléc-cím és alcím fülenként. */
const HEADINGS: Record<Tab, [string, string]> = {
    dashboard: ['Üdv újra!', 'Valós üzleti adatok és következő lépések.'],
    growth: ['Növekedés', 'Honnan jönnek az ügyfelek, és kire kell ma rászólni.'],
    testimonials: ['Vélemények', 'Ügyfélvélemények a nyilvános oldalra – csak valódiak.'],
    workspace: ['MM Munkatér', 'Ajánlatfolyamat és napi teendők egy helyen.'],
    maintenance: ['Aurora Care', 'Havi karbantartás, előfizetések és esedékességek.'],
    sites: ['Kész projektek', 'Élesített oldalak, domainek, lejáratok és titkosított hozzáférések.'],
    newsletter: ['Hírlevél', 'Az akciókra feliratkozott, megerősített e-mail-címek és a CSV-export.'],
    finance: ['Pénzügyek', 'Bevételek, kiadások, ÁFA és becsült átalányadó havonta.'],
    quotes: ['Ajánlatkérések', 'Beérkező megkeresések és ajánlatok kezelése.'],
    consultations: ['Konzultációk', 'Szabad és lefoglalt konzultációk kezelése.'],
    clients: ['Ügyfelek', 'Korábbi érdeklődők és projektelőzmények.'],
    projects: ['Referenciák', 'A portfólió tartalmainak szerkesztése.'],
    services: ['Szolgáltatások', 'Szolgáltatások és csomagok beállítása.'],
    settings: ['Weboldal beállításai', 'A nyilvános weboldal szövegei és elérhetőségei.'],
    activity: ['Tevékenységnapló', 'Legutóbbi adminműveletek.'],
    account: ['Fiók és biztonság', 'Jelszó, kétlépcsős belépés és munkamenetek.'],
};
interface ServiceEditor {
    id: number | null;
    title: string;
    summary: string;
    description: string;
    featuresText: string;
    starting_price_huf: string;
    title_en: string;
    summary_en: string;
    description_en: string;
    featuresEnText: string;
    is_active: boolean;
    sort_order: number;
}
interface ProjectEditor {
    id: number | null;
    title: string;
    summary: string;
    category: string;
    description: string;
    technologiesText: string;
    project_url: string;
    title_en: string;
    category_en: string;
    summary_en: string;
    description_en: string;
    is_demo: boolean;
    is_published: boolean;
    is_featured: boolean;
    sort_order: number;
    cover_image_url: string | null;
    resultsText: string;
}
interface TestimonialEditor {
    id: number | null;
    author_name: string;
    author_role: string;
    company: string;
    quote: string;
    rating: number;
    portfolio_project_id: number | null;
    is_published: boolean;
    sort_order: number;
}
@Component({ selector: 'app-admin', standalone: true, imports: [FormsModule, RouterLink, SitesPanel, FinancePanel, NewsletterPanel], templateUrl: './admin.html', styleUrl: './admin.scss' })
export class AdminPage implements OnInit, OnDestroy {
    readonly i18n = inject(I18nService);
    private api = inject(ApiService);
    private auth = inject(AuthService);
    private router = inject(Router);
    user = this.auth.user;
    get todayLabel(): string { return new Intl.DateTimeFormat(this.i18n.lang() === 'en' ? 'en-GB' : 'hu-HU', { dateStyle: 'long' }).format(new Date()); }
    tab = signal<Tab>('dashboard');
    busy = signal(false);
    message = signal('');
    isError = signal(false);
    menuOpen = signal(false);
    dashboard = signal<Dashboard | null>(null);
    maintenanceData = signal<MaintenanceData>({agreements: [], candidates: []});
    maintenanceEditor = signal<MaintenanceEditor | null>(null);
    editingMaintenanceId = signal<number | null>(null);
    workspaceBoard = signal<QuoteBoard | null>(null);
    studioTasks = signal<StudioTask[]>([]);
    newTaskTitle = '';
    newTaskDue = '';
    // type="number" mezőnél az Angular számot (vagy null-t) ír ide, ezért nem csak string lehet.
    newTaskQuoteId: string | number | null = '';
    quotes = signal<Quote[]>([]);
    quotePage = signal(1);
    quotePages = signal(1);
    quoteTotal = signal(0);
    searchQuote = '';
    filterStatus = '';
    selectedQuote = signal<Quote | null>(null);
    selectedStatus: QuoteStatus = 'new';
    selectedNotes = '';
    selectedPrice = '';
    selectedDeposit: number | string | null = '';
    selectedProposal = '';
    selectedSchedule = '';
    selectedTerms = '';
    selectedValidUntil = '';
    selectedFollowUp = '';
    growth = signal<GrowthData | null>(null);
    testimonials = signal<Testimonial[]>([]);
    testimonialEditor = signal<TestimonialEditor | null>(null);
    milestones = signal<ProjectMilestone[]>([]);
    collaboration = signal<ProjectCollaboration>({ messages: [], documents: [] });
    adminMessage = '';
    documentTitle = '';
    documentFile: File | null = null;
    documentDeliverable = false;
    handoverNote = '';
    milestoneTitle = '';
    milestoneDescription = '';
    milestoneDate = '';
    consultations = signal<ConsultationSlot[]>([]);
    slotStart = '';
    slotDuration = 30;
    clients = signal<Client[]>([]);
    clientsPage = signal(1);
    clientsPages = signal(1);
    searchClient = '';
    clientHistory = signal<Quote[]>([]);
    selectedClient = signal<Client | null>(null);
    services = signal<Service[]>([]);
    projects = signal<Project[]>([]);
    settings: SiteSettings = { ...SITE_DEFAULTS };
    activities = signal<Activity[]>([]);
    serviceEditor = signal<ServiceEditor | null>(null);
    projectEditor = signal<ProjectEditor | null>(null);
    projectImage: File | null = null;
    removeProjectCover = false;
    oldPassword = '';
    newPassword = '';
    confirmPassword = '';
    statuses = STATUS_OPTIONS;
    readonly headings = HEADINGS;
    tabs: {
        value: Tab;
        title: string;
        icon: string;
    }[] = [{ value: 'dashboard', title: 'Áttekintés', icon: '◫' }, { value: 'growth', title: 'Növekedés', icon: '↗︎' }, {value:'workspace',title:'MM Munkatér',icon:'▦'}, { value: 'quotes', title: 'Ajánlatkérések', icon: '▤' }, {value:'maintenance',title:'Karbantartás',icon:'✧'}, { value: 'sites', title: 'Kész projektek', icon: '◈' }, { value: 'finance', title: 'Pénzügyek', icon: '¤' }, { value: 'consultations', title: 'Konzultációk', icon: '◷' }, { value: 'clients', title: 'Ügyfelek', icon: '♙' }, { value: 'projects', title: 'Referenciák', icon: '▧' }, { value: 'testimonials', title: 'Vélemények', icon: '❝' }, { value: 'newsletter', title: 'Hírlevél', icon: '✉︎' }, { value: 'services', title: 'Szolgáltatások', icon: '◇' }, { value: 'settings', title: 'Weboldal beállításai', icon: '⚙︎' }, { value: 'activity', title: 'Tevékenységnapló', icon: '◷' }, { value: 'account', title: 'Fiók és jelszó', icon: '⌘' }];
    readonly boardStatuses = STATUS_OPTIONS;
    readonly pipelinePalette: Record<QuoteStatus,string> = {
        new:'#9681fd', reviewing:'#579bea', quoted:'#36c8c2',
        accepted:'#54d8a1', rejected:'#f18a95', completed:'#d5b5ff'
    };
    readonly pipelineDonut = computed(() => {
        const entries = this.dashboard()?.quotes_by_status ?? [];
        const total = entries.reduce((sum, x) => sum + x.count, 0);
        if (!total) return 'conic-gradient(#64688740 0 100%)';
        let position = 0;
        const stops = entries.map(row => {
            const start = position;
            position += (row.count / total) * 100;
            return `${this.pipelinePalette[row.status]} ${start}% ${position}%`;
        });
        return `conic-gradient(${stops.join(',')})`;
    });
    readonly leadDonut = computed(() => {
        const breakdown = this.dashboard()?.lead_sources;
        if (!breakdown || breakdown.quiz + breakdown.form === 0) return 'conic-gradient(#64688740 0 100%)';
        const percent = (breakdown.quiz / (breakdown.quiz + breakdown.form)) * 100;
        return `conic-gradient(#8f78ff 0 ${percent}%,#48bed9 ${percent}% 100%)`;
    });
    readonly conversionPercent = computed(() => {
        const d = this.dashboard(); return d?.quotes_total ? Math.round(((d.quotes_accepted + d.quotes_completed) / d.quotes_total) * 100) : 0;
    });
    moneyBar(value: number): number {
        const values = this.dashboard()?.accepted_value_monthly ?? [];
        const max = Math.max(1, ...values.map(x => x.value));
        return value ? Math.max(5, (value / max) * 100) : 2;
    }
    typeBar(value:number):number {
        const max = Math.max(1,...(this.dashboard()?.quotes_by_type ?? []).map(x=>x.count));
        return (value / max) * 100;
    }
    readonly chartHeight = (count: number): number => {
        const values = this.dashboard()?.quotes_monthly ?? [];
        const highest = Math.max(1, ...values.map(item => item.count));
        return count === 0 ? 3 : Math.max(12, Math.round((count / highest) * 100));
    };
    readonly activityChart = computed(() => {
        const months = this.dashboard()?.quotes_monthly ?? [];
        if (!months.length) return {line:'', area:'', points: [] as {x:number;y:number;count:number;label:string}[]};
        const top = Math.max(1, ...months.map(m => m.count));
        const pts = months.map((m, i) => ({
            x: 20 + (i * 560) / Math.max(1, months.length - 1),
            y: 150 - (m.count / top) * 120,
            count: m.count,
            label: m.label
        }));
        const line = pts.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ');
        return {line, area: line + ` L ${pts.at(-1)!.x.toFixed(1)} 162 L ${pts[0].x.toFixed(1)} 162 Z`, points: pts};
    });
    private poll: ReturnType<typeof setInterval> | null = null;
    ngOnInit() {
        this.loadDashboard();
        this.loadSystemStatus();
        // Az e-mailben kapott „Megnyitás az adminban” link: /admin?ajanlat=12
        const quoteParam = Number(new URLSearchParams(location.search).get('ajanlat'));
        if (Number.isInteger(quoteParam) && quoteParam > 0) this.openBoardQuote(quoteParam);
        // Percenként csendben frissítjük a számlálókat; új ügyfélüzenetnél toast jelez.
        this.poll = setInterval(() => this.refreshCounters(), 60_000);
    }
    ngOnDestroy() { if (this.poll) clearInterval(this.poll); }
    private refreshCounters() {
        if (document.hidden) return;
        const before = this.dashboard()?.messages_unread ?? 0;
        const newBefore = this.dashboard()?.quotes_new ?? 0;
        this.api.dashboard().subscribe({ next: r => {
            this.dashboard.set(r.data);
            const unread = r.data.messages_unread ?? 0;
            if (unread > before) this.toast.info(`Új ügyfélüzenet érkezett (${unread} olvasatlan).`);
            if (r.data.quotes_new > newBefore) this.toast.info('Új ajánlatkérés érkezett.');
        }, error: () => { /* csendes háttérfrissítés */ } });
    }
    isQuizQuote(description: string): boolean { return description?.startsWith('AURORA KVÍZ – IGÉNYFELMÉRÉS') || false; }
    quizSummary(description: string): {label:string;value:string}[] {
        if(!this.isQuizQuote(description)) return [];
        return description.split('\n').slice(1).map(line=>{
            const index=line.indexOf(': ');
            return index>=0?{label:line.slice(0,index),value:line.slice(index+2)}:null;
        }).filter((row):row is {label:string;value:string}=>row!==null);
    }
    @HostListener('document:keydown.escape')
    closeMobileNavigation() { this.menuOpen.set(false); }
    private readonly toast = inject(ToastService);
    /** Visszajelzés: toastként jelenik meg (mobilon is látszik, görgetéstől függetlenül). */
    notify(message: string, error = false) {
        this.message.set(''); this.isError.set(error);
        if (message) error ? this.toast.error(message) : this.toast.success(message);
    }
    fail(e: unknown) { this.notify(apiErrorMessage(e), true); this.busy.set(false); }
    use(tab: Tab) {
        this.tab.set(tab);
        this.menuOpen.set(false);
        this.notify('');
        this.selectedQuote.set(null);
        this.selectedClient.set(null);
        this.serviceEditor.set(null);
        this.projectEditor.set(null);
        if (tab === 'dashboard')
            this.loadDashboard();
        this.testimonialEditor.set(null);
        if (tab === 'growth') this.loadGrowth();
        if (tab === 'testimonials') { this.loadTestimonials(); if (!this.projects().length) this.loadProjects(); }
        if (tab === 'workspace') this.loadWorkspace();
        if (tab === 'maintenance') this.loadMaintenance();
        if (tab === 'quotes')
            this.loadQuotes();
        if (tab === 'consultations') this.loadConsultations();
        if (tab === 'clients')
            this.loadClients();
        if (tab === 'projects')
            this.loadProjects();
        if (tab === 'services')
            this.loadServices();
        if (tab === 'settings')
            this.loadSettings();
        if (tab === 'activity')
            this.loadActivities();
        if (tab === 'account') {
            this.loadSecurity();
            this.loadSystemStatus();
        }
    }
    consultationDate(value: string): string { return new Date(value).toLocaleString('hu-HU', {dateStyle:'medium', timeStyle:'short', timeZone:'Europe/Budapest'}); }
    loadConsultations() { this.busy.set(true); this.api.adminConsultations().subscribe({next:r=>{this.consultations.set(r.data); this.busy.set(false);}, error:e=>this.fail(e)}); }
    createSlot() {
        if (!this.slotStart) {this.notify('Válassz kezdési időpontot.', true); return;}
        const date = new Date(this.slotStart);
        if (Number.isNaN(date.valueOf())) {this.notify('Érvénytelen időpont.', true); return;}
        this.busy.set(true);
        this.api.createConsultation({starts_at:date.toISOString(), duration_minutes:this.slotDuration}).subscribe({
            next:()=>{this.slotStart=''; this.loadConsultations(); this.notify('Konzultációs időpont közzétéve.');}, error:e=>this.fail(e)
        });
    }
    removeSlot(slot: ConsultationSlot) {
        if (slot.booking || !confirm('Törlöd a közzétett szabad időpontot?')) return;
        this.busy.set(true);
        this.api.deleteConsultation(slot.id).subscribe({next:()=>{this.loadConsultations(); this.notify('Időpont törölve.');}, error:e=>this.fail(e)});
    }
    loadDashboard() { this.busy.set(true); this.api.dashboard().subscribe({ next: r => { this.dashboard.set(r.data); this.busy.set(false); }, error: e => this.fail(e) }); }
    loadWorkspace() {
        this.api.quoteBoard().subscribe({next:r=>this.workspaceBoard.set(r.data),error:e=>this.fail(e)});
        this.api.studioTasks().subscribe({next:r=>this.studioTasks.set(r.data),error:e=>this.fail(e)});
    }
    createStudioTask() {
        if(this.newTaskTitle.trim().length < 2) {this.notify('Legalább két karakteres feladatnevet adj meg.',true);return;}
        const rawQuoteId = String(this.newTaskQuoteId ?? '').trim();
        const quoteId = rawQuoteId ? Number(rawQuoteId) : null;
        if (quoteId !== null && (!Number.isInteger(quoteId) || quoteId <= 0)) {this.notify('Érvénytelen ajánlat-azonosító.',true);return;}
        this.busy.set(true);
        this.api.createStudioTask({title:this.newTaskTitle.trim(),due_date:this.newTaskDue || null,quote_request_id:quoteId}).subscribe({
            next:()=>{this.newTaskTitle='';this.newTaskDue='';this.newTaskQuoteId='';this.busy.set(false);this.loadWorkspace();this.loadDashboard();this.notify('Feladat létrehozva.');},
            error:e=>this.fail(e)
        });
    }
    toggleStudioTask(task: StudioTask) {
        this.api.updateStudioTask(task.id,{is_done:!task.is_done}).subscribe({
            next:()=>{this.loadWorkspace();this.loadDashboard();},
            error:e=>this.fail(e)
        });
    }
    removeStudioTask(task: StudioTask) {
        if(!confirm('Törlöd ezt a belső feladatot?'))return;
        this.api.deleteStudioTask(task.id).subscribe({next:()=>{this.loadWorkspace();this.loadDashboard();},error:e=>this.fail(e)});
    }
    /** A legfrissebb olvasatlan beszélgetés megnyitása (vagy az ajánlatlista, ha nincs). */
    openUnreadMessages() {
        const first = this.dashboard()?.unread_threads?.[0];
        if (first) this.openBoardQuote(first.quote_request_id); else this.use('quotes');
    }
    openBoardQuote(id:number) {
        this.use('quotes');
        this.api.quote(id).subscribe({next:r=>{
            this.showQuote(r.data);
            // Mobilon az adatlap a lista alatt van: odagörgetünk.
            if (matchMedia('(max-width: 1050px)').matches) setTimeout(() => document.querySelector('.admin-panel.detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
        },error:e=>this.fail(e)});
    }
    loadMaintenance() {
        this.busy.set(true);
        this.api.maintenance().subscribe({next:r=>{this.maintenanceData.set(r.data);this.busy.set(false);},error:e=>this.fail(e)});
    }
    newMaintenance(quoteId?:number) {
        this.editingMaintenanceId.set(null);
        this.maintenanceEditor.set({
            quote_request_id:quoteId ?? this.maintenanceData().candidates[0]?.id ?? 0,
            plan_name:'Aurora Care – Mini',monthly_fee_huf:2000,status:'draft',
            starts_on:'',next_review_on:'',included_services:'Alapvető állapotfigyelés és havi ellenőrzés.',
            internal_notes:'',billing_enabled:false
        });
    }
    editMaintenance(row:MaintenanceAgreement) {
        this.editingMaintenanceId.set(row.id);
        this.maintenanceEditor.set({
            quote_request_id:row.quote_request_id,plan_name:row.plan_name,
            monthly_fee_huf:row.monthly_fee_huf,status:row.status,
            starts_on:row.starts_on?.slice(0,10)??'',
            next_review_on:row.next_review_on?.slice(0,10)??'',
            included_services:row.included_services??'',internal_notes:row.internal_notes??'',
            billing_enabled:!!row.billing_enabled
        });
    }
    cancelSubscription(row: MaintenanceAgreement) {
        if (!confirm('Lemondod az online előfizetést? A már kifizetett hónap végén szűnik meg.')) return;
        this.busy.set(true);
        this.api.cancelSubscription(row.id).subscribe({ next: r => { this.busy.set(false); this.notify(r.message); this.loadMaintenance(); }, error: e => this.fail(e) });
    }
    subscriptionLabel(status?: string | null): string {
        if (!status) return 'Nincs online előfizetés';
        if (status.endsWith('_cancel_scheduled')) return 'Lemondva – időszak végéig aktív';
        return ({ active: 'Kártyás előfizetés aktív', trialing: 'Próbaidőszak', past_due: 'Sikertelen terhelés!', canceled: 'Előfizetés megszűnt', unpaid: 'Kifizetetlen', paused: 'Szüneteltetve', incomplete: 'Függőben' } as Record<string, string>)[status] ?? status;
    }
    saveMaintenance() {
        const editor = this.maintenanceEditor();
        if(!editor || !editor.quote_request_id || !editor.plan_name.trim() || !Number.isInteger(editor.monthly_fee_huf) || editor.monthly_fee_huf < 0) {
            this.notify('Válassz ügyfelet, csomagnevet és érvényes havi díjat.',true);return;
        }
        this.busy.set(true);
        this.api.saveMaintenance(this.editingMaintenanceId(),editor).subscribe({
            next:()=>{this.maintenanceEditor.set(null);this.busy.set(false);this.loadMaintenance();this.loadDashboard();this.notify(editor.billing_enabled ? 'Mentve. Az ügyfél a projektoldalán elindíthatja a kártyás előfizetést.' : 'Karbantartási megállapodás mentve.');},
            error:e=>this.fail(e)
        });
    }
    loadQuotes(page = 1) { this.busy.set(true); this.api.quotes(this.searchQuote, this.filterStatus, page).subscribe({ next: r => { this.quotes.set(r.data); this.quotePage.set(r.current_page); this.quotePages.set(r.last_page); this.quoteTotal.set(r.total); this.busy.set(false); }, error: e => this.fail(e) }); }
    showQuote(q: Quote) { this.selectedQuote.set(q); this.selectedStatus = q.status; this.selectedNotes = q.admin_notes || ''; this.selectedPrice = q.quoted_price_huf === null ? '' : String(q.quoted_price_huf); this.selectedDeposit = q.deposit_percent ?? (q.quoted_at ? '' : (this.depositMin() || '')); this.selectedProposal = q.proposal_summary || ''; this.selectedSchedule = q.proposal_schedule || ''; this.selectedTerms = q.proposal_terms || ''; this.selectedValidUntil = q.proposal_valid_until ? q.proposal_valid_until.slice(0, 10) : ''; this.selectedFollowUp = q.follow_up_at ? q.follow_up_at.slice(0, 10) : ''; this.loadMilestones(q.id); this.loadCollaboration(q.id); }
    saveQuote() {
        const q = this.selectedQuote();
        if (!q)
            return;
        let amount: number | null = null;
        if (this.selectedPrice.trim()) {
            amount = Number(this.selectedPrice);
            if (!Number.isInteger(amount) || amount < 0) {
                this.notify('Az összeg nemnegatív egész szám legyen.', true);
                return;
            }
        }
        this.busy.set(true);
        this.api.saveQuote(q.id, { status: this.selectedStatus, admin_notes: this.selectedNotes, follow_up_at: this.selectedFollowUp || null, ...(q.quoted_at ? {} : { quoted_price_huf: amount, deposit_percent: this.depositPercent(), proposal_summary: this.selectedProposal, proposal_schedule: this.selectedSchedule || null, proposal_terms: this.selectedTerms || null, proposal_valid_until: this.selectedValidUntil || null }) }).subscribe({ next: r => { this.showQuote(r.data); this.notify('Ajánlatkérés módosítva.'); this.loadQuotes(this.quotePage()); }, error: e => this.fail(e) });
    }
    /** Az előleg %-a (0–100), üres mező = nincs előleg. type="number" mezőből szám vagy null is jöhet. */
    depositPercent(): number | null {
        const raw = String(this.selectedDeposit ?? '').trim();
        if (!raw) return null;
        const n = Math.round(Number(raw));
        return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : null;
    }
    depositPreview(q: Quote): number | null {
        const pct = q.quoted_at ? q.deposit_percent ?? null : this.depositPercent();
        const price = q.quoted_at ? q.quoted_price_huf : Number(String(this.selectedPrice).replace(/\s/g, ''));
        return pct && price ? Math.round(price * pct / 100) : null;
    }
    markDepositPaid() {
        const q = this.selectedQuote();
        if (!q || !confirm('Jóváírod az előleget (átutalás beérkezett)? Bevételként is rögzül.')) return;
        this.busy.set(true);
        this.api.markDepositPaid(q.id).subscribe({ next: r => { this.busy.set(false); this.showQuote(r.data); this.notify(r.message); }, error: e => this.fail(e) });
    }
    loadCollaboration(id: number) {
        this.api.adminCollaboration(id).subscribe({ next: r => {
            if(this.selectedQuote()?.id === id) this.collaboration.set(r.data);
            // A szerver olvasottnak jelölte az üzeneteket: a jelvényeket is frissítjük.
            if (this.quotes().some(q => q.id === id && q.unread_messages_count)) this.quotes.update(list => list.map(q => q.id === id ? { ...q, unread_messages_count: 0 } : q));
            if (this.dashboard()?.unread_threads?.some(t => t.quote_request_id === id)) this.api.dashboard().subscribe({ next: d => this.dashboard.set(d.data), error: () => {} });
        }, error: e => this.fail(e) });
    }
    sendProjectMessage() {
        const q = this.selectedQuote(); if(!q || this.adminMessage.trim().length < 2) return;
        this.busy.set(true);
        this.api.sendAdminMessage(q.id, this.adminMessage.trim()).subscribe({
            next: () => { this.adminMessage=''; this.busy.set(false); this.loadCollaboration(q.id); this.notify('Üzenet rögzítve az ügyfélportálon.'); }, error: e => this.fail(e)
        });
    }
    pickDocument(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0] || null;
        if(file && this.documentDeliverable) {
            // Átadandó kód / csomag: ZIP vagy PDF, a szerver alapbeállítása szerint legfeljebb 100 MB.
            const zip = /\.zip$/i.test(file.name) || ['application/zip', 'application/x-zip-compressed'].includes(file.type);
            if(!(zip || file.type === 'application/pdf') || file.size > 100 * 1024 * 1024) {
                this.notify('Átadási csomagként ZIP vagy PDF tölthető fel, legfeljebb 100 MB méretben.', true);
                this.documentFile = null; return;
            }
        } else if(file && (!['application/pdf','image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024)) {
            this.notify('Csak PDF, JPG, PNG vagy WebP fájl tölthető fel, legfeljebb 10 MB méretben.', true);
            this.documentFile = null; return;
        }
        this.documentFile = file;
    }
    uploadDocument() {
        const q = this.selectedQuote(); if(!q || !this.documentFile || !this.documentTitle.trim()) return;
        this.busy.set(true);
        const deliverable = this.documentDeliverable;
        this.api.uploadProjectDocument(q.id, this.documentFile, this.documentTitle.trim(), deliverable).subscribe({
            next: () => { this.documentTitle=''; this.documentFile=null; this.documentDeliverable=false; this.busy.set(false); this.loadCollaboration(q.id);
                this.notify(deliverable ? 'Átadási csomag feltöltve – az ügyfél a kódátadás után töltheti le.' : 'A privát dokumentum feltöltve.'); }, error: e => this.fail(e)
        });
    }
    /** A lezáráskor fizetendő összeg: ajánlati ár − befizetett előleg (lezárás után a rögzített érték). */
    remainingAmount(q: Quote): number {
        if (q.final_amount_huf !== null && q.final_amount_huf !== undefined) return q.final_amount_huf;
        const deposit = q.deposit_paid_at && q.deposit_percent && q.quoted_price_huf ? Math.round(q.quoted_price_huf * q.deposit_percent / 100) : 0;
        return Math.max(0, (q.quoted_price_huf ?? 0) - deposit);
    }
    handoverUnlocked(q: Quote): boolean { return q.status === 'completed' && !!q.completed_at && (this.remainingAmount(q) === 0 || !!q.final_paid_at); }
    hasDeliverable(): boolean { return this.collaboration().documents.some(d => d.is_deliverable); }
    completeProject() {
        const q = this.selectedQuote(); if (!q) return;
        const rest = this.remainingAmount(q);
        if (!confirm(`Késznek jelölöd a projektet?\n\nAz ügyfél végleges e-mailt kap${rest > 0 ? `, benne a fennmaradó ${this.money(rest)} összeggel és a fizetési lehetőséggel.\nA kódot csak a kifizetés után adhatod át.` : '. Nincs fennmaradó összeg, a kód utána rögtön átadható.'}`)) return;
        this.busy.set(true);
        this.api.completeProject(q.id).subscribe({ next: r => { this.busy.set(false); this.showQuote(r.data); this.notify(r.message); this.loadQuotes(this.quotePage()); }, error: e => this.fail(e) });
    }
    markFinalPaid() {
        const q = this.selectedQuote();
        if (!q || !confirm(`Jóváírod a fennmaradó ${this.money(this.remainingAmount(q))} összeget (átutalás beérkezett)? Bevételként is rögzül, és utána átadható a kód.`)) return;
        this.busy.set(true);
        this.api.markFinalPaid(q.id).subscribe({ next: r => { this.busy.set(false); this.showQuote(r.data); this.notify(r.message); }, error: e => this.fail(e) });
    }
    handoverProject() {
        const q = this.selectedQuote(); if (!q || !this.handoverUnlocked(q)) return;
        if (!confirm('Átadod a kódot? Az ügyfél e-mailt kap, és ettől kezdve letöltheti az átadási csomagot.')) return;
        this.busy.set(true);
        this.api.handoverProject(q.id, this.handoverNote.trim()).subscribe({ next: r => { this.busy.set(false); this.handoverNote = ''; this.showQuote(r.data); this.loadCollaboration(q.id); this.notify(r.message); }, error: e => this.fail(e) });
    }
    private saveDownloaded(blob: Blob, filename: string) {
        const url = URL.createObjectURL(blob); const a = document.createElement('a');
        a.href=url; a.download=filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    downloadDocument(doc: ProjectDocument) {
        const q = this.selectedQuote(); if(!q) return;
        this.api.downloadAdminDocument(q.id, doc.id).subscribe({next: blob=>this.saveDownloaded(blob,doc.filename),error:e=>this.fail(e)});
    }
    removeDocument(doc: ProjectDocument) {
        const q = this.selectedQuote(); if(!q || !confirm('Biztosan törlöd a privát dokumentumot?')) return;
        this.busy.set(true);
        this.api.deleteProjectDocument(q.id, doc.id).subscribe({next:()=>{this.busy.set(false);this.loadCollaboration(q.id);this.notify('Dokumentum törölve.');},error:e=>this.fail(e)});
    }
    loadMilestones(quoteId: number) { this.api.milestones(quoteId).subscribe({ next: r => { if(this.selectedQuote()?.id === quoteId) this.milestones.set(r.data); }, error: e => this.fail(e) }); }
    addMilestone() {
        const q = this.selectedQuote();
        if (!q || !this.milestoneTitle.trim()) { this.notify('Adj címet a mérföldkőnek.', true); return; }
        this.busy.set(true);
        this.api.addMilestone(q.id, {title: this.milestoneTitle.trim(), description: this.milestoneDescription.trim(), due_date: this.milestoneDate || null}).subscribe({
            next: () => { this.milestoneTitle=''; this.milestoneDescription=''; this.milestoneDate=''; this.busy.set(false); this.loadMilestones(q.id); this.notify('Mérföldkő hozzáadva.'); }, error: e => this.fail(e)
        });
    }
    changeMilestone(m: ProjectMilestone, status: ProjectMilestone['status']) {
        const q = this.selectedQuote(); if (!q) return;
        this.busy.set(true);
        this.api.updateMilestone(q.id, m.id, {status}).subscribe({next: () => { this.busy.set(false); this.loadMilestones(q.id); this.notify('Mérföldkő frissítve.'); }, error: e => this.fail(e)});
    }
    removeMilestone(m: ProjectMilestone) {
        const q = this.selectedQuote(); if (!q || !confirm('Törlöd a mérföldkövet?')) return;
        this.busy.set(true);
        this.api.deleteMilestone(q.id, m.id).subscribe({next: () => { this.busy.set(false); this.loadMilestones(q.id); this.notify('Mérföldkő törölve.'); }, error: e => this.fail(e)});
    }
    /** Kötelező minimum előleg (%) a szerver beállításából (PORTFOLIO_MIN_DEPOSIT_PERCENT). */
    depositMin(): number { return this.dashboard()?.deposit_min_percent ?? 0; }
    sendProposal() {
        const q = this.selectedQuote();
        if (!q || !q.quoted_price_huf || !q.proposal_summary || !q.proposal_valid_until || q.quoted_at) {
            this.notify('Előbb mentsd az ajánlati összeget, a pontos tartalmat és az érvényességet.', true);
            return;
        }
        const deposit = this.depositPercent() ?? 0;
        if (deposit < this.depositMin()) {
            this.notify(`Az ajánlathoz legalább ${this.depositMin()}% előleget kell megadni.`, true);
            return;
        }
        const amount = Math.round((q.quoted_price_huf * deposit) / 100);
        if (!confirm(`Elküldöd az ajánlatot az ügyfélnek?\n\nÁr: ${this.money(q.quoted_price_huf)}\nKötelező előleg: ${deposit}% = ${this.money(amount)}\n\nElfogadás után az ügyfél azonnal a fizetési oldalra kerül.`)) return;
        this.busy.set(true);
        // Az előleg %-át az elküldés előtt mentjük, hogy az e-mail és a szerver ugyanazt lássa.
        const send = () => this.api.sendProposal(q.id).subscribe({ next: r => { this.showQuote(r.data); this.notify('Az ajánlatot elküldtem e-mailben, az előleggel együtt.'); this.loadQuotes(this.quotePage()); }, error: e => this.fail(e) });
        if (q.deposit_percent === deposit) send();
        else this.api.saveQuote(q.id, { deposit_percent: deposit }).subscribe({ next: () => send(), error: e => this.fail(e) });
    }
    rotateClientAccess() {
        const q = this.selectedQuote();
        if (!q || !confirm('Biztosan új privát linket küldesz az ügyfélnek? A korábbi projektlink érvénytelenné válik.')) return;
        this.busy.set(true);
        this.api.rotateClientAccess(q.id).subscribe({next:()=>{this.busy.set(false);this.notify('Új hozzáférési link elküldve. A régi érvénytelen.');},error:e=>this.fail(e)});
    }
    deleteQuote() {
        const q = this.selectedQuote();
        if (!q || !confirm('Biztosan véglegesen törlöd ezt az ajánlatkérést? A művelet nem vonható vissza.'))
            return;
        this.busy.set(true);
        this.api.deleteQuote(q.id).subscribe({ next: () => { this.selectedQuote.set(null); this.notify('Ajánlatkérés törölve.'); this.loadQuotes(); }, error: e => this.fail(e) });
    }
    loadClients(page = 1) { this.busy.set(true); this.api.clients(this.searchClient, page).subscribe({ next: r => { this.clients.set(r.data); this.clientsPage.set(r.current_page); this.clientsPages.set(r.last_page); this.busy.set(false); }, error: e => this.fail(e) }); }
    showClient(c: Client) { this.selectedClient.set(c); this.busy.set(true); this.api.clientQuotes(c.email).subscribe({ next: r => { this.clientHistory.set(r.data); this.busy.set(false); }, error: e => this.fail(e) }); }
    loadServices() { this.busy.set(true); this.api.adminServices().subscribe({ next: r => { this.services.set(r.data); this.busy.set(false); }, error: e => this.fail(e) }); }
    editService(s?: Service) { this.serviceEditor.set(s ? { id: s.id, title: s.title, summary: s.summary, description: s.description || '', featuresText: (s.features || []).join('\n'), starting_price_huf: s.starting_price_huf === null ? '' : String(s.starting_price_huf), is_active: s.is_active, sort_order: s.sort_order, title_en: s.title_en || '', summary_en: s.summary_en || '', description_en: s.description_en || '', featuresEnText: (s.features_en || []).join('\n') } : { id: null, title: '', summary: '', description: '', featuresText: '', starting_price_huf: '', is_active: false, sort_order: 0, title_en: '', summary_en: '', description_en: '', featuresEnText: '' }); }
    saveService() {
        const s = this.serviceEditor();
        if (!s)
            return;
        if (!s.title.trim() || !s.summary.trim()) {
            this.notify('A cím és a rövid leírás kötelező.', true);
            return;
        }
        const amount = s.starting_price_huf.trim() ? Number(s.starting_price_huf) : null;
        if (amount !== null && (!Number.isInteger(amount) || amount < 0)) {
            this.notify('Érvénytelen ár.', true);
            return;
        }
        this.busy.set(true);
        this.api.saveService(s.id, { title: s.title, summary: s.summary, description: s.description || null, features: s.featuresText.split(/[\n,]+/).map(x => x.trim()).filter(Boolean), title_en: s.title_en.trim() || null, summary_en: s.summary_en.trim() || null, description_en: s.description_en.trim() || null, features_en: s.featuresEnText.split(/\n+/).map(x => x.trim()).filter(Boolean), starting_price_huf: amount, is_active: s.is_active, sort_order: s.sort_order }).subscribe({ next: () => { this.notify('Szolgáltatás mentve.'); this.serviceEditor.set(null); this.loadServices(); }, error: e => this.fail(e) });
    }
    deleteService(id: number) {
        if (!confirm('Biztosan törlöd a szolgáltatást?'))
            return;
        this.busy.set(true);
        this.api.deleteService(id).subscribe({ next: () => { this.notify('Szolgáltatás törölve.'); this.loadServices(); }, error: e => this.fail(e) });
    }
    loadProjects() { this.busy.set(true); this.api.adminProjects().subscribe({ next: r => { this.projects.set(r.data); this.busy.set(false); }, error: e => this.fail(e) }); }
    editProject(p?: Project) { this.projectImage = null; this.removeProjectCover = false; this.projectEditor.set(p ? { id: p.id, title: p.title, summary: p.summary, description: p.description || '', category: p.category || '', technologiesText: (p.technologies || []).join(', '), project_url: p.project_url || '', is_demo: p.is_demo, is_published: p.is_published, is_featured: p.is_featured, sort_order: p.sort_order, cover_image_url: p.cover_image_url, resultsText: (p.results || []).map(r => `${r.value} | ${r.label}`).join('\n'), title_en: p.title_en || '', category_en: p.category_en || '', summary_en: p.summary_en || '', description_en: p.description_en || '' } : { id: null, title: '', summary: '', description: '', category: '', technologiesText: '', project_url: '', is_demo: true, is_published: false, is_featured: false, sort_order: 0, cover_image_url: null, resultsText: '', title_en: '', category_en: '', summary_en: '', description_en: '' }); }
    pickImage(event: Event) {
        const input = event.target as HTMLInputElement;
        const f = input.files?.[0];
        if (!f) {
            this.projectImage = null;
            return;
        }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type) || f.size > 5 * 1024 * 1024) {
            this.notify('JPG, PNG vagy WebP kép választható, legfeljebb 5 MB-ig.', true);
            input.value = '';
            return;
        }
        this.projectImage = f;
    }
    /** Soronként „érték | felirat” (pl. „+48% | több ajánlatkérés”), legfeljebb 4 sor. */
    private parseResults(text: string): { value: string; label: string }[] {
        return text.split('\n').map(line => line.split('|').map(x => x.trim())).filter(x => x[0] && x[1]).slice(0, 4).map(x => ({ value: x[0].slice(0, 30), label: x[1].slice(0, 80) }));
    }
    saveProject() {
        const p = this.projectEditor();
        if (!p)
            return;
        if (!p.title.trim() || !p.summary.trim()) {
            this.notify('A cím és a rövid leírás kötelező.', true);
            return;
        }
        const fd = new FormData();
        for (const [k, v] of Object.entries({ title: p.title, summary: p.summary, category: p.category, title_en: p.title_en, category_en: p.category_en, summary_en: p.summary_en, description_en: p.description_en, description: p.description, project_url: p.project_url, sort_order: String(p.sort_order), is_demo: p.is_demo ? '1' : '0', is_published: p.is_published ? '1' : '0', is_featured: p.is_featured ? '1' : '0' }))
            fd.append(k, v);
        for (const [i, t] of p.technologiesText.split(/[,\n]+/).map(x => x.trim()).filter(Boolean).entries())
            fd.append(`technologies[${i}]`, t);
        const results = this.parseResults(p.resultsText);
        if (!results.length) fd.append('results', '');
        results.forEach((r, i) => { fd.append(`results[${i}][value]`, r.value); fd.append(`results[${i}][label]`, r.label); });
        if (this.projectImage)
            fd.append('cover_image', this.projectImage, this.projectImage.name);
        if (this.removeProjectCover)
            fd.append('remove_cover_image', '1');
        const tech = p.technologiesText.split(/[,\n]+/).map(x => x.trim()).filter(Boolean);
        const data = { title: p.title, summary: p.summary, category: p.category || null, description: p.description || null, project_url: p.project_url || null, sort_order: p.sort_order, is_demo: p.is_demo, is_published: p.is_published, is_featured: p.is_featured, technologies: tech, results };
        this.busy.set(true);
        (this.projectImage || this.removeProjectCover ? this.api.saveProject(p.id, fd) : this.api.saveProjectJson(p.id, data)).subscribe({ next: () => { this.notify('Referencia mentve.'); this.projectEditor.set(null); this.loadProjects(); }, error: e => this.fail(e) });
    }
    deleteProject(id: number) {
        if (!confirm('Biztosan törlöd a referenciát és a hozzá tartozó képet?'))
            return;
        this.busy.set(true);
        this.api.deleteProject(id).subscribe({ next: () => { this.notify('Referencia törölve.'); this.loadProjects(); }, error: e => this.fail(e) });
    }
    loadSettings() { this.busy.set(true); this.api.adminSettings().subscribe({ next: r => { this.settings = { ...SITE_DEFAULTS, ...r.data }; this.busy.set(false); }, error: e => this.fail(e) }); }
    saveSettings() { this.busy.set(true); this.api.saveSettings(this.settings).subscribe({ next: r => { this.settings = { ...SITE_DEFAULTS, ...r.data }; this.busy.set(false); this.notify('A weboldal tartalma frissítve.'); }, error: e => this.fail(e) }); }
    loadActivities() { this.busy.set(true); this.api.activities().subscribe({ next: r => { this.activities.set(r.data); this.busy.set(false); }, error: e => this.fail(e) }); }
    changePassword() {
        if (this.newPassword.length < 12 || this.newPassword !== this.confirmPassword) {
            this.notify('A jelszó legalább 12 karakter legyen, és a megerősítése egyezzen.', true);
            return;
        }
        this.busy.set(true);
        this.api.changePassword(this.oldPassword, this.newPassword, this.confirmPassword).subscribe({ next: () => { this.busy.set(false); this.oldPassword = ''; this.newPassword = ''; this.confirmPassword = ''; this.notify('Jelszó módosítva.'); }, error: e => this.fail(e) });
    }
    // --- Rendszerállapot (élesítés utáni önellenőrzés) ---
    readonly frontendVersion = FRONTEND_VERSION;
    systemStatus = signal<SystemStatus | null>(null);
    /** null = még nem töltött; 'outdated' = a backend nem ismeri a végpontot (régi verzió / route-cache). */
    systemStatusError = signal<'outdated' | 'error' | null>(null);
    loadSystemStatus() {
        this.api.systemStatus().subscribe({
            next: r => { this.systemStatus.set(r.data); this.systemStatusError.set(null); },
            error: (e: HttpErrorResponse) => { this.systemStatus.set(null); this.systemStatusError.set(e.status === 404 ? 'outdated' : 'error'); }
        });
    }
    // --- Biztonság: kétlépcsős belépés és aktív munkamenetek ---
    security = signal<AdminSecurityStatus | null>(null);
    sessions = signal<{ id: string; ip_address: string | null; user_agent: string; last_activity: number; current: boolean }[]>([]);
    twoFactorPassword = '';
    loadSecurity() {
        this.api.adminSecurity().subscribe({ next: r => this.security.set(r.data), error: () => this.security.set(null) });
        this.api.adminSessions().subscribe({ next: r => this.sessions.set(r.data), error: () => this.sessions.set([]) });
    }
    toggleTwoFactor(enabled: boolean) {
        if (!this.twoFactorPassword) { this.notify('Add meg a jelenlegi jelszavadat a módosításhoz.', true); return; }
        this.busy.set(true);
        this.api.setAdminTwoFactor(enabled, this.twoFactorPassword).subscribe({
            next: () => { this.busy.set(false); this.twoFactorPassword = ''; this.notify(enabled ? 'Kétlépcsős belépés bekapcsolva.' : 'Kétlépcsős belépés kikapcsolva.'); this.loadSecurity(); },
            error: e => this.fail(e)
        });
    }
    // --- Hitelesítő alkalmazás (TOTP) ---
    totpPassword = '';
    totpCode = '';
    totpSetupData = signal<{ secret: string; otpauth_uri: string } | null>(null);
    private sanitizer = inject(DomSanitizer);
    /** Az otpauth:// sémát az Angular alapból „unsafe:”-re cseréli; csak a saját, ellenőrzött TOTP-linket engedjük. */
    readonly totpLink = computed<SafeUrl | null>(() => {
        const uri = this.totpSetupData()?.otpauth_uri;
        return uri && uri.startsWith('otpauth://totp/') ? this.sanitizer.bypassSecurityTrustUrl(uri) : null;
    });
    recoveryCodes = signal<string[]>([]);
    startTotpSetup() {
        if (!this.totpPassword) { this.notify('Add meg a jelenlegi jelszavadat.', true); return; }
        this.busy.set(true);
        this.api.totpSetup(this.totpPassword).subscribe({
            next: r => { this.busy.set(false); this.totpPassword = ''; this.totpCode = ''; this.recoveryCodes.set([]); this.totpSetupData.set(r.data); },
            error: e => this.fail(e)
        });
    }
    confirmTotp() {
        if (!/^[0-9]{6}$/.test(this.totpCode.trim())) { this.notify('Írd be az alkalmazás 6 jegyű kódját.', true); return; }
        this.busy.set(true);
        this.api.totpConfirm(this.totpCode.trim()).subscribe({
            next: r => { this.busy.set(false); this.totpCode = ''; this.totpSetupData.set(null); this.recoveryCodes.set(r.data.recovery_codes); this.notify(r.message); this.loadSecurity(); },
            error: e => this.fail(e)
        });
    }
    cancelTotpSetup() { this.totpSetupData.set(null); this.totpCode = ''; }
    disableTotp() {
        if (!this.totpPassword || !this.totpCode.trim()) { this.notify('A kikapcsoláshoz add meg a jelszavadat és egy aktuális kódot.', true); return; }
        if (!confirm('Biztosan kikapcsolod a hitelesítő alkalmazásos belépést?')) return;
        this.busy.set(true);
        this.api.totpDisable(this.totpPassword, this.totpCode.trim()).subscribe({
            next: r => { this.busy.set(false); this.totpPassword = ''; this.totpCode = ''; this.recoveryCodes.set([]); this.notify(r.message); this.loadSecurity(); },
            error: e => this.fail(e)
        });
    }
    regenerateRecoveryCodes() {
        if (!this.totpPassword) { this.notify('Add meg a jelenlegi jelszavadat.', true); return; }
        if (!confirm('Új helyreállítási kódok készülnek, a régiek érvénytelenné válnak. Folytatod?')) return;
        this.busy.set(true);
        this.api.totpRecoveryCodes(this.totpPassword).subscribe({
            next: r => { this.busy.set(false); this.totpPassword = ''; this.recoveryCodes.set(r.data.recovery_codes); this.notify(r.message); this.loadSecurity(); },
            error: e => this.fail(e)
        });
    }
    copyText(text: string) {
        navigator.clipboard?.writeText(text).then(() => this.notify('Vágólapra másolva.'), () => this.notify('Nem sikerült másolni – jelöld ki kézzel.', true));
    }
    revokeOtherSessions() {
        if (!confirm('Minden más eszközön kijelentkeztetünk. Folytatod?')) return;
        this.busy.set(true);
        this.api.revokeOtherAdminSessions().subscribe({ next: r => { this.busy.set(false); this.notify(r.message); this.loadSecurity(); }, error: e => this.fail(e) });
    }
    sessionTime(ts: number): string { return new Date(ts * 1000).toLocaleString('hu-HU', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Budapest' }); }
    logout() { this.api.logout().subscribe({ next: () => { this.auth.user.set(null); this.router.navigateByUrl('/admin/bejelentkezes'); }, error: e => this.fail(e) }); }
    loadGrowth() { this.busy.set(true); this.api.growth().subscribe({ next: r => { this.growth.set(r.data); this.busy.set(false); }, error: e => this.fail(e) }); }
    readonly maxDaily = computed(() => Math.max(1, ...(this.growth()?.daily_leads ?? []).map(x => x.count)));
    readonly maxChannel = computed(() => Math.max(1, ...(this.growth()?.channels ?? []).map(x => x.leads)));
    readonly growthLeads30 = computed(() => (this.growth()?.daily_leads ?? []).reduce((sum, x) => sum + x.count, 0));
    pct(value: number, max: number): number { return value ? Math.max(4, Math.round(value / max * 100)) : 2; }
    hours(h: number | null | undefined): string { return h === null || h === undefined ? 'még nincs adat' : h < 1 ? 'egy órán belül' : h < 48 ? Math.round(h) + ' óra' : Math.round(h / 24) + ' nap'; }
    openLead(id: number) {
        this.use('quotes');
        this.api.adminQuote(id).subscribe({ next: r => this.showQuote(r.data), error: e => this.fail(e) });
    }
    markContacted() {
        const q = this.selectedQuote(); if (!q) return;
        this.busy.set(true);
        this.api.markContacted(q.id).subscribe({ next: r => { this.busy.set(false); this.selectedQuote.set({ ...q, first_response_at: r.data.first_response_at }); this.notify('Rögzítve: felvetted a kapcsolatot az érdeklődővel.'); }, error: e => this.fail(e) });
    }
    /** Előre kitöltött e-mail az érdeklődőnek – a küldés a saját levelezőből történik. */
    replyMailto(q: Quote): string {
        const subject = 'Weboldal ajánlatkérés – Megyeri Márk';
        const body = `Szia ${q.customer_name.split(' ').pop()}!\n\nKöszönöm az érdeklődést. Átnéztem, amit a weboldalad kapcsán megírtál, és szívesen egyeztetnék egy rövid beszélgetés keretében a részletekről.\n\nMikor lenne alkalmas számodra egy 15–20 perces hívás?\n\nÜdvözlettel,\nMegyeri Márk Máté`;
        return `mailto:${q.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
    exportCsv() {
        this.busy.set(true);
        this.api.exportQuotes(this.filterStatus || undefined).subscribe({ next: blob => { this.busy.set(false); this.saveDownloaded(blob, 'ajanlatkeresek-' + new Date().toISOString().slice(0, 10) + '.csv'); this.notify('CSV exportálva (Excelben megnyitható).'); }, error: e => this.fail(e) });
    }
    loadTestimonials() { this.busy.set(true); this.api.adminTestimonials().subscribe({ next: r => { this.testimonials.set(r.data); this.busy.set(false); }, error: e => this.fail(e) }); }
    editTestimonial(t?: Testimonial) {
        this.testimonialEditor.set(t
            ? { id: t.id, author_name: t.author_name, author_role: t.author_role || '', company: t.company || '', quote: t.quote, rating: t.rating, portfolio_project_id: t.portfolio_project_id, is_published: t.is_published, sort_order: t.sort_order }
            : { id: null, author_name: '', author_role: '', company: '', quote: '', rating: 5, portfolio_project_id: null, is_published: false, sort_order: 0 });
    }
    saveTestimonial() {
        const t = this.testimonialEditor(); if (!t) return;
        if (!t.author_name.trim() || t.quote.trim().length < 20) { this.notify('A név és legalább 20 karakteres vélemény kötelező.', true); return; }
        const data = { author_name: t.author_name.trim(), author_role: t.author_role.trim() || null, company: t.company.trim() || null, quote: t.quote.trim(), rating: Number(t.rating), portfolio_project_id: t.portfolio_project_id ? Number(t.portfolio_project_id) : null, is_published: t.is_published, sort_order: Number(t.sort_order) || 0 };
        this.busy.set(true);
        (t.id ? this.api.updateTestimonial(t.id, data) : this.api.createTestimonial(data)).subscribe({ next: () => { this.notify('Vélemény mentve.'); this.testimonialEditor.set(null); this.loadTestimonials(); }, error: e => this.fail(e) });
    }
    togglePublished(t: Testimonial) {
        this.api.updateTestimonial(t.id, { is_published: !t.is_published }).subscribe({ next: () => this.loadTestimonials(), error: e => this.fail(e) });
    }
    deleteTestimonial(t: Testimonial) {
        if (!confirm('Biztosan törlöd ezt a véleményt?')) return;
        this.busy.set(true);
        this.api.deleteTestimonial(t.id).subscribe({ next: () => { this.notify('Vélemény törölve.'); this.loadTestimonials(); }, error: e => this.fail(e) });
    }
    money(n: number | null | undefined) { return n === null || n === undefined ? '—' : new Intl.NumberFormat('hu-HU').format(n) + ' Ft'; }
    date(s: string | null | undefined) { return s ? new Date(s).toLocaleDateString('hu-HU') : '—'; }
    statusLabel(s: QuoteStatus) { return this.statuses.find(x => x.value === s)?.label || s; }
}
