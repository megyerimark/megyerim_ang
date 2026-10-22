import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Activity, Client, ConsultationSlot, Dashboard, Project, ProjectMilestone, ProjectCollaboration, ProjectDocument, Quote, QuoteStatus, Service, SiteSettings, SITE_DEFAULTS, STATUS_OPTIONS } from '../../core/models';
type Tab = 'dashboard' | 'consultations' | 'quotes' | 'clients' | 'projects' | 'services' | 'settings' | 'activity' | 'account';
interface ServiceEditor {
    id: number | null;
    title: string;
    summary: string;
    description: string;
    featuresText: string;
    starting_price_huf: string;
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
    is_demo: boolean;
    is_published: boolean;
    is_featured: boolean;
    sort_order: number;
    cover_image_url: string | null;
}
@Component({ selector: 'app-admin', standalone: true, imports: [FormsModule, RouterLink], templateUrl: './admin.html', styleUrl: './admin.scss' })
export class AdminPage implements OnInit {
    private api = inject(ApiService);
    private auth = inject(AuthService);
    private router = inject(Router);
    user = this.auth.user;
    todayLabel = new Intl.DateTimeFormat('hu-HU', { dateStyle: 'long' }).format(new Date());
    tab = signal<Tab>('dashboard');
    busy = signal(false);
    message = signal('');
    isError = signal(false);
    menuOpen = signal(false);
    dashboard = signal<Dashboard | null>(null);
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
    selectedProposal = '';
    selectedSchedule = '';
    selectedTerms = '';
    selectedValidUntil = '';
    milestones = signal<ProjectMilestone[]>([]);
    collaboration = signal<ProjectCollaboration>({ messages: [], documents: [] });
    adminMessage = '';
    documentTitle = '';
    documentFile: File | null = null;
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
    tabs: {
        value: Tab;
        title: string;
        icon: string;
    }[] = [{ value: 'dashboard', title: 'Áttekintés', icon: '◫' }, { value: 'quotes', title: 'Ajánlatkérések', icon: '▤' }, { value: 'consultations', title: 'Konzultációk', icon: '◷' }, { value: 'clients', title: 'Ügyfelek', icon: '♙' }, { value: 'projects', title: 'Referenciák', icon: '▧' }, { value: 'services', title: 'Szolgáltatások', icon: '◇' }, { value: 'settings', title: 'Weboldal beállításai', icon: '⚙' }, { value: 'activity', title: 'Tevékenységnapló', icon: '◷' }, { value: 'account', title: 'Fiók és jelszó', icon: '⌘' }];
    ngOnInit() { this.loadDashboard(); }
    notify(message: string, error = false) { this.message.set(message); this.isError.set(error); }
    fail(e: unknown) { const err = e as HttpErrorResponse; const fields = err.error?.errors as Record<string, string[]> | undefined; this.notify(fields ? Object.values(fields).flat().join(' · ') : err.status === 419 ? 'Lejárt a munkamenet. Frissítsd az oldalt.' : err.status === 401 ? 'A munkamenet lejárt. Jelentkezz be újra.' : err.error?.message || 'Szerverhiba. Próbáld újra.', true); this.busy.set(false); }
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
    loadQuotes(page = 1) { this.busy.set(true); this.api.quotes(this.searchQuote, this.filterStatus, page).subscribe({ next: r => { this.quotes.set(r.data); this.quotePage.set(r.current_page); this.quotePages.set(r.last_page); this.quoteTotal.set(r.total); this.busy.set(false); }, error: e => this.fail(e) }); }
    showQuote(q: Quote) { this.selectedQuote.set(q); this.selectedStatus = q.status; this.selectedNotes = q.admin_notes || ''; this.selectedPrice = q.quoted_price_huf === null ? '' : String(q.quoted_price_huf); this.selectedProposal = q.proposal_summary || ''; this.selectedSchedule = q.proposal_schedule || ''; this.selectedTerms = q.proposal_terms || ''; this.selectedValidUntil = q.proposal_valid_until ? q.proposal_valid_until.slice(0, 10) : ''; this.loadMilestones(q.id); this.loadCollaboration(q.id); }
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
        this.api.saveQuote(q.id, { status: this.selectedStatus, admin_notes: this.selectedNotes, ...(q.quoted_at ? {} : { quoted_price_huf: amount, proposal_summary: this.selectedProposal, proposal_schedule: this.selectedSchedule || null, proposal_terms: this.selectedTerms || null, proposal_valid_until: this.selectedValidUntil || null }) }).subscribe({ next: r => { this.showQuote(r.data); this.notify('Ajánlatkérés módosítva.'); this.loadQuotes(this.quotePage()); }, error: e => this.fail(e) });
    }
    loadCollaboration(id: number) {
        this.api.adminCollaboration(id).subscribe({ next: r => { if(this.selectedQuote()?.id === id) this.collaboration.set(r.data); }, error: e => this.fail(e) });
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
        if(file && (!['application/pdf','image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024)) {
            this.notify('Csak PDF, JPG, PNG vagy WebP fájl tölthető fel, legfeljebb 10 MB méretben.', true);
            this.documentFile = null; return;
        }
        this.documentFile = file;
    }
    uploadDocument() {
        const q = this.selectedQuote(); if(!q || !this.documentFile || !this.documentTitle.trim()) return;
        this.busy.set(true);
        this.api.uploadProjectDocument(q.id, this.documentFile, this.documentTitle.trim()).subscribe({
            next: () => { this.documentTitle=''; this.documentFile=null; this.busy.set(false); this.loadCollaboration(q.id); this.notify('A privát dokumentum feltöltve.'); }, error: e => this.fail(e)
        });
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
    sendProposal() {
        const q = this.selectedQuote();
        if (!q || !q.quoted_price_huf || !q.proposal_summary || !q.proposal_valid_until || q.quoted_at) {
            this.notify('Előbb mentsd az ajánlati összeget, a pontos tartalmat és az érvényességet.', true);
            return;
        }
        if (!confirm('Biztosan elküldöd a mentett, személyre szabott ajánlatot az ügyfél e-mail-címére?')) return;
        this.busy.set(true);
        this.api.sendProposal(q.id).subscribe({ next: r => { this.showQuote(r.data); this.notify('Az ajánlatot valóban elküldtem e-mailben.'); this.loadQuotes(this.quotePage()); }, error: e => this.fail(e) });
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
    editService(s?: Service) { this.serviceEditor.set(s ? { id: s.id, title: s.title, summary: s.summary, description: s.description || '', featuresText: (s.features || []).join('\n'), starting_price_huf: s.starting_price_huf === null ? '' : String(s.starting_price_huf), is_active: s.is_active, sort_order: s.sort_order } : { id: null, title: '', summary: '', description: '', featuresText: '', starting_price_huf: '', is_active: false, sort_order: 0 }); }
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
        this.api.saveService(s.id, { title: s.title, summary: s.summary, description: s.description || null, features: s.featuresText.split(/[\n,]+/).map(x => x.trim()).filter(Boolean), starting_price_huf: amount, is_active: s.is_active, sort_order: s.sort_order }).subscribe({ next: () => { this.notify('Szolgáltatás mentve.'); this.serviceEditor.set(null); this.loadServices(); }, error: e => this.fail(e) });
    }
    deleteService(id: number) {
        if (!confirm('Biztosan törlöd a szolgáltatást?'))
            return;
        this.busy.set(true);
        this.api.deleteService(id).subscribe({ next: () => { this.notify('Szolgáltatás törölve.'); this.loadServices(); }, error: e => this.fail(e) });
    }
    loadProjects() { this.busy.set(true); this.api.adminProjects().subscribe({ next: r => { this.projects.set(r.data); this.busy.set(false); }, error: e => this.fail(e) }); }
    editProject(p?: Project) { this.projectImage = null; this.removeProjectCover = false; this.projectEditor.set(p ? { id: p.id, title: p.title, summary: p.summary, description: p.description || '', category: p.category || '', technologiesText: (p.technologies || []).join(', '), project_url: p.project_url || '', is_demo: p.is_demo, is_published: p.is_published, is_featured: p.is_featured, sort_order: p.sort_order, cover_image_url: p.cover_image_url } : { id: null, title: '', summary: '', description: '', category: '', technologiesText: '', project_url: '', is_demo: true, is_published: false, is_featured: false, sort_order: 0, cover_image_url: null }); }
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
    saveProject() {
        const p = this.projectEditor();
        if (!p)
            return;
        if (!p.title.trim() || !p.summary.trim()) {
            this.notify('A cím és a rövid leírás kötelező.', true);
            return;
        }
        const fd = new FormData();
        for (const [k, v] of Object.entries({ title: p.title, summary: p.summary, category: p.category, description: p.description, project_url: p.project_url, sort_order: String(p.sort_order), is_demo: p.is_demo ? '1' : '0', is_published: p.is_published ? '1' : '0', is_featured: p.is_featured ? '1' : '0' }))
            fd.append(k, v);
        for (const [i, t] of p.technologiesText.split(/[,\n]+/).map(x => x.trim()).filter(Boolean).entries())
            fd.append(`technologies[${i}]`, t);
        if (this.projectImage)
            fd.append('cover_image', this.projectImage, this.projectImage.name);
        if (this.removeProjectCover)
            fd.append('remove_cover_image', '1');
        const tech = p.technologiesText.split(/[,\n]+/).map(x => x.trim()).filter(Boolean);
        const data = { title: p.title, summary: p.summary, category: p.category || null, description: p.description || null, project_url: p.project_url || null, sort_order: p.sort_order, is_demo: p.is_demo, is_published: p.is_published, is_featured: p.is_featured, technologies: tech };
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
    logout() { this.api.logout().subscribe({ next: () => { this.auth.user.set(null); this.router.navigateByUrl('/admin/bejelentkezes'); }, error: e => this.fail(e) }); }
    money(n: number | null | undefined) { return n === null || n === undefined ? '—' : new Intl.NumberFormat('hu-HU').format(n) + ' Ft'; }
    date(s: string | null | undefined) { return s ? new Date(s).toLocaleDateString('hu-HU') : '—'; }
    statusLabel(s: QuoteStatus) { return this.statuses.find(x => x.value === s)?.label || s; }
}
