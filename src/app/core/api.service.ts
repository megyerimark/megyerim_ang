import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { SystemStatus, ClientSite, ClientSiteInput, FinanceEntry, FinanceEntryInput, FinanceSettings, FinanceSummary, AdminUser, Activity, Client, ClientProject, ConsultationConfirmation, ConsultationSlot, Dashboard, Envelope, Paged, Project, ProjectMilestone, ProjectMessage, ProjectDocument, ProjectCollaboration, Quote, QuotePayload, QuoteBoard, Service, SiteSettings, StudioTask, StudioClientNote, WorkspaceProject, CommunicationCenter, MaintenanceData, MaintenanceAgreement, MaintenanceEditor, Testimonial, TestimonialInput, GrowthData, NewsletterSubscriber, NewsletterCounts } from './models';
import { AttributionService } from './attribution.service';
@Injectable({ providedIn: 'root' })
export class ApiService {
    private http = inject(HttpClient);
    private attribution = inject(AttributionService);
    private opts = { withCredentials: true };
    private params(data: Record<string, string | number | undefined>): HttpParams {
        let p = new HttpParams();
        for (const [k, v] of Object.entries(data))
            if (v !== undefined && v !== '')
                p = p.set(k, String(v));
        return p;
    }
    // This same-origin proxy and Angular's XSRF interceptor are required for Sanctum session requests.
    csrf(): Observable<unknown> { return this.http.get('/sanctum/csrf-cookie', this.opts); }
    publicSettings() { return this.http.get<Envelope<SiteSettings>>('/api/site-settings', this.opts); }
    publicServices() { return this.http.get<Envelope<Service[]>>('/api/services', this.opts); }
    publicProjects() { return this.http.get<Envelope<Project[]>>('/api/projects', this.opts); }
    sendQuote(data: QuotePayload) {
        const payload: QuotePayload = { ...this.attribution.get(), ...data };
        return this.csrf().pipe(switchMap(() => this.http.post<{
            message: string;
            reference: number;
        }>('/api/quote-requests', payload, this.opts)));
    }
    publicTestimonials() { return this.http.get<Envelope<Testimonial[]>>('/api/testimonials', this.opts); }
    /** Anonim eseményszámlálás: IP-t, sütit nem tárol; hiba esetén csendben elbukik. */
    trackEvent(event: 'page_view' | 'cta_click' | 'quote_start' | 'quiz_start' | 'consultation_start', path: string): void {
        if (!this.attribution.tracking) return;
        const source = this.attribution.get().source;
        this.http.post('/api/events', { event, path: path.split(/[?#]/)[0].slice(0, 160), ...(source ? { source } : {}) }, this.opts).subscribe({ error: () => { /* nem kritikus */ } });
    }
    availableConsultations() { return this.http.get<Envelope<ConsultationSlot[]>>('/api/consultations/available', this.opts); }
    bookConsultation(data: {consultation_slot_id: number; customer_name: string; email: string; phone: string; notes: string; privacy_notice_acknowledged: boolean; website: string}) {
        return this.csrf().pipe(switchMap(() => this.http.post<ConsultationConfirmation>('/api/consultations/book', data, this.opts)));
    }
    adminConsultations() { return this.http.get<Envelope<ConsultationSlot[]>>('/api/admin/consultations', this.opts); }
    createConsultation(data: {starts_at: string; duration_minutes: number}) { return this.http.post<Envelope<ConsultationSlot>>('/api/admin/consultations', data, this.opts); }
    deleteConsultation(id: number) { return this.http.delete(`/api/admin/consultations/${id}`, this.opts); }
    publicProject(slug: string) { return this.http.get<Envelope<Project>>('/api/projects/' + encodeURIComponent(slug), this.opts); }
    clientCollaboration(token: string) { return this.http.post<Envelope<ProjectCollaboration>>('/api/client/project/collaboration', { token }, this.opts); }
    sendClientMessage(token: string, body: string) { return this.http.post<Envelope<ProjectMessage>>('/api/client/project/messages', { token, body }, this.opts); }
    downloadClientDocument(token: string, id: number) { return this.http.post('/api/client/project/documents/' + id + '/download', { token }, { ...this.opts, responseType: 'blob' }); }
    adminCollaboration(id: number) { return this.http.get<Envelope<ProjectCollaboration>>(`/api/admin/quote-requests/${id}/collaboration`, this.opts); }
    sendAdminMessage(id: number, body: string) { return this.http.post<Envelope<ProjectMessage>>(`/api/admin/quote-requests/${id}/messages`, { body }, this.opts); }
    uploadProjectDocument(id: number, file: File, title: string) { const form = new FormData(); form.set('file', file, file.name); form.set('title', title); return this.http.post<Envelope<ProjectDocument>>(`/api/admin/quote-requests/${id}/documents`, form, this.opts); }
    downloadAdminDocument(id: number, docId: number) { return this.http.get(`/api/admin/quote-requests/${id}/documents/${docId}/download`, { ...this.opts, responseType: 'blob' }); }
    deleteProjectDocument(id: number, docId: number) { return this.http.delete(`/api/admin/quote-requests/${id}/documents/${docId}`, this.opts); }
    // Portal access secrets are sent in POST bodies, never server-logged URL paths.
    clientProject(token: string) {
        return this.csrf().pipe(switchMap(() => this.http.post<Envelope<ClientProject>>('/api/client/project', { token }, this.opts)));
    }
    acceptProposal(token: string, early_start_consent = false) {
        return this.csrf().pipe(switchMap(() => this.http.post<Envelope<ClientProject> & { payment_url?: string | null }>('/api/client/project/accept', { token, accept_terms: true, early_start_consent }, this.opts)));
    }
    // Online fizetés (Stripe Checkout) – a privát kulcs a kérés törzsében utazik.
    depositCheckout(token: string) { return this.csrf().pipe(switchMap(() => this.http.post<{ url: string }>('/api/client/project/deposit/checkout', { token }, this.opts))); }
    maintenanceCheckout(token: string) { return this.csrf().pipe(switchMap(() => this.http.post<{ url: string }>('/api/client/project/maintenance/checkout', { token }, this.opts))); }
    billingPortal(token: string) { return this.csrf().pipe(switchMap(() => this.http.post<{ url: string }>('/api/client/project/maintenance/portal', { token }, this.opts))); }
    markDepositPaid(id: number, paid_on?: string) { return this.http.post<{ message: string; data: Quote }>(`/api/admin/quote-requests/${id}/deposit-paid`, paid_on ? { paid_on } : {}, this.opts); }
    cancelSubscription(id: number) { return this.http.post<{ message: string; data: MaintenanceAgreement }>(`/api/admin/maintenance-agreements/${id}/cancel-subscription`, {}, this.opts); }
    systemStatus() { return this.http.get<Envelope<SystemStatus>>('/api/admin/system-status', this.opts); }
    // Kész projektek + zero-knowledge széf
    sites() { return this.http.get<Envelope<ClientSite[]>>('/api/admin/sites', this.opts); }
    saveSite(id: number | null, data: Partial<ClientSiteInput>) { return id ? this.http.patch<Envelope<ClientSite>>('/api/admin/sites/' + id, data, this.opts) : this.http.post<Envelope<ClientSite>>('/api/admin/sites', data, this.opts); }
    deleteSite(id: number) { return this.http.delete<{ message: string }>('/api/admin/sites/' + id, this.opts); }
    vault() { return this.http.get<Envelope<{ salt: string; iterations: number; verifier: string } | null>>('/api/admin/vault', this.opts); }
    saveVault(data: { salt: string; iterations: number; verifier: string; blobs?: { id: number; vault_blob: string }[] }) { return this.http.put<{ message: string }>('/api/admin/vault', data, this.opts); }
    // Pénzügyek
    financeSummary(year: number) { return this.http.get<Envelope<FinanceSummary>>('/api/admin/finance/summary', { ...this.opts, params: this.params({ year }) }); }
    financeEntries(year: number, month?: number) { return this.http.get<Envelope<FinanceEntry[]>>('/api/admin/finance/entries', { ...this.opts, params: this.params({ year, month }) }); }
    saveFinanceEntry(id: number | null, data: FinanceEntryInput) { return id ? this.http.patch<Envelope<FinanceEntry>>('/api/admin/finance/entries/' + id, data, this.opts) : this.http.post<Envelope<FinanceEntry>>('/api/admin/finance/entries', data, this.opts); }
    deleteFinanceEntry(id: number) { return this.http.delete<{ message: string }>('/api/admin/finance/entries/' + id, this.opts); }
    saveFinanceSettings(data: Partial<FinanceSettings>) { return this.http.put<Envelope<FinanceSettings>>('/api/admin/finance/settings', data, this.opts); }
    rotateClientAccess(id: number) { return this.http.post(`/api/admin/quote-requests/${id}/rotate-client-access`, {}, this.opts); }
    sendProposal(id: number) { return this.http.post<Envelope<Quote>>(`/api/admin/quote-requests/${id}/send-proposal`, {}, this.opts); }
    login(email: string, password: string) {
        return this.csrf().pipe(switchMap(() => this.http.post<{
            message: string;
            user?: AdminUser;
            requires_two_factor?: boolean;
        }>('/admin/login', { email, password }, this.opts)));
    }
    verifyAdminLogin(code: string) { return this.http.post<{message: string; user: AdminUser}>('/admin/verify-login', {code}, this.opts); }
    resendAdminLoginCode() { return this.http.post<{message: string}>('/admin/resend-login-code', {}, this.opts); }
    adminSecurity() { return this.http.get<Envelope<{two_factor_email_enabled: boolean; two_factor_required?: boolean; session_driver: string}>>('/api/admin/security', this.opts); }
    setAdminTwoFactor(enabled: boolean, current_password: string) { return this.http.put<Envelope<{two_factor_email_enabled: boolean}>>('/api/admin/security/two-factor', {enabled, current_password}, this.opts); }
    adminSessions() { return this.http.get<Envelope<{id:string;ip_address:string|null;user_agent:string;last_activity:number;current:boolean}[]>>('/api/admin/security/sessions', this.opts); }
    revokeOtherAdminSessions() { return this.http.delete<{message:string;removed:number}>('/api/admin/security/sessions/others', this.opts); }
    forgotAdminPassword(email: string) {
        return this.csrf().pipe(switchMap(() => this.http.post<{message: string}>('/admin/forgot-password', {email}, this.opts)));
    }
    resetAdminPassword(email: string, token: string, password: string, password_confirmation: string) {
        return this.csrf().pipe(switchMap(() => this.http.post<{message: string}>('/admin/reset-password', {email, token, password, password_confirmation}, this.opts)));
    }
    logout() {
        return this.http.post<{
            message: string;
        }>('/admin/logout', {}, this.opts);
    }
    me() { return this.http.get<Envelope<AdminUser>>('/api/admin/me', this.opts); }
    dashboard() { return this.http.get<Envelope<Dashboard>>('/api/admin/dashboard', this.opts); }
    maintenance() { return this.http.get<Envelope<MaintenanceData>>('/api/admin/maintenance-agreements', this.opts); }
    saveMaintenance(id:number|null, data:MaintenanceEditor) {
        return id
            ? this.http.patch<Envelope<MaintenanceAgreement>>('/api/admin/maintenance-agreements/' + id, (({quote_request_id,...changes})=>changes)(data), this.opts)
            : this.http.post<Envelope<MaintenanceAgreement>>('/api/admin/maintenance-agreements', data, this.opts);
    }
    quoteBoard() { return this.http.get<Envelope<QuoteBoard>>('/api/admin/quote-board', this.opts); }
    workspaceProjects() { return this.http.get<Envelope<WorkspaceProject[]>>('/api/admin/workspace/projects', this.opts); }
    communications() { return this.http.get<Envelope<CommunicationCenter>>('/api/admin/workspace/communications', this.opts); }
    studioTasks(state: 'open' | 'done' | 'all' = 'all') { return this.http.get<Envelope<StudioTask[]>>('/api/admin/workspace/tasks', { ...this.opts, params: this.params({state}) }); }
    createStudioTask(data: {title:string; description?:string|null; due_date?:string|null; quote_request_id?:number|null}) { return this.http.post<Envelope<StudioTask>>('/api/admin/workspace/tasks', data, this.opts); }
    updateStudioTask(id:number, data:Partial<Pick<StudioTask,'title'|'description'|'due_date'|'is_done'>>) { return this.http.patch<Envelope<StudioTask>>(`/api/admin/workspace/tasks/${id}`, data, this.opts); }
    deleteStudioTask(id:number) { return this.http.delete(`/api/admin/workspace/tasks/${id}`, this.opts); }
    studioClientNotes(email:string) { return this.http.get<Envelope<StudioClientNote[]>>('/api/admin/workspace/client-notes', { ...this.opts, params: this.params({email}) }); }
    createStudioClientNote(email:string, body:string) { return this.http.post<Envelope<StudioClientNote>>('/api/admin/workspace/client-notes', {email,body}, this.opts); }
    deleteStudioClientNote(id:number) { return this.http.delete(`/api/admin/workspace/client-notes/${id}`, this.opts); }
    quotes(q = '', status = '', page = 1) { return this.http.get<Paged<Quote>>('/api/admin/quote-requests', { ...this.opts, params: this.params({ q, status, page, per_page: 15 }) }); }
    quote(id: number) { return this.http.get<Envelope<Quote>>('/api/admin/quote-requests/' + id, this.opts); }
    saveQuote(id: number, data: Partial<Pick<Quote, 'status' | 'admin_notes' | 'quoted_price_huf' | 'deposit_percent' | 'proposal_summary' | 'proposal_schedule' | 'proposal_terms' | 'proposal_valid_until' | 'follow_up_at'>>) { return this.http.patch<Envelope<Quote>>('/api/admin/quote-requests/' + id, data, this.opts); }
    milestones(id: number) { return this.http.get<Envelope<ProjectMilestone[]>>(`/api/admin/quote-requests/${id}/milestones`, this.opts); }
    addMilestone(id: number, data: {title: string; description?: string; due_date?: string | null; status?: string}) { return this.http.post<Envelope<ProjectMilestone>>(`/api/admin/quote-requests/${id}/milestones`, data, this.opts); }
    updateMilestone(id: number, milestoneId: number, data: {status: ProjectMilestone['status']}) { return this.http.patch<Envelope<ProjectMilestone>>(`/api/admin/quote-requests/${id}/milestones/${milestoneId}`, data, this.opts); }
    deleteMilestone(id: number, milestoneId: number) { return this.http.delete(`/api/admin/quote-requests/${id}/milestones/${milestoneId}`, this.opts); }
    deleteQuote(id: number) { return this.http.delete('/api/admin/quote-requests/' + id, this.opts); }
    clients(q = '', page = 1) { return this.http.get<Paged<Client>>('/api/admin/clients', { ...this.opts, params: this.params({ q, page }) }); }
    clientQuotes(email: string) { return this.http.get<Paged<Quote>>('/api/admin/clients/quotes', { ...this.opts, params: this.params({ email }) }); }
    activities() { return this.http.get<Paged<Activity>>('/api/admin/activities', this.opts); }
    adminServices() { return this.http.get<Envelope<Service[]>>('/api/admin/services', this.opts); }
    saveService(id: number | null, data: Record<string, unknown>) { return id ? this.http.patch<Envelope<Service>>('/api/admin/services/' + id, data, this.opts) : this.http.post<Envelope<Service>>('/api/admin/services', data, this.opts); }
    deleteService(id: number) { return this.http.delete('/api/admin/services/' + id, this.opts); }
    adminProjects() { return this.http.get<Envelope<Project[]>>('/api/admin/projects', this.opts); }
    saveProject(id: number | null, form: FormData) {
        if (id)
            form.append('_method', 'PATCH');
        return this.http.post<Envelope<Project>>('/api/admin/projects' + (id ? '/' + id : ''), form, this.opts);
    }
    saveProjectJson(id: number | null, data: Record<string, unknown>) { return id ? this.http.patch<Envelope<Project>>('/api/admin/projects/' + id, data, this.opts) : this.http.post<Envelope<Project>>('/api/admin/projects', data, this.opts); }
    deleteProject(id: number) { return this.http.delete('/api/admin/projects/' + id, this.opts); }
    adminSettings() { return this.http.get<Envelope<SiteSettings>>('/api/admin/site-settings', this.opts); }
    saveSettings(data: SiteSettings) { return this.http.patch<Envelope<SiteSettings>>('/api/admin/site-settings', data, this.opts); }
    changePassword(current_password: string, password: string, password_confirmation: string) { return this.http.put('/api/admin/password', { current_password, password, password_confirmation }, this.opts); }
    growth() { return this.http.get<Envelope<GrowthData>>('/api/admin/growth', this.opts); }
    adminTestimonials() { return this.http.get<Envelope<Testimonial[]>>('/api/admin/testimonials', this.opts); }
    createTestimonial(data: TestimonialInput) { return this.http.post<Envelope<Testimonial>>('/api/admin/testimonials', data, this.opts); }
    updateTestimonial(id: number, data: Partial<TestimonialInput>) { return this.http.put<Envelope<Testimonial>>('/api/admin/testimonials/' + id, data, this.opts); }
    deleteTestimonial(id: number) { return this.http.delete<{message?: string}>('/api/admin/testimonials/' + id, this.opts); }
    adminQuote(id: number) { return this.http.get<Envelope<Quote>>('/api/admin/quote-requests/' + id, this.opts); }
    markContacted(id: number) { return this.http.post<Envelope<Quote>>('/api/admin/quote-requests/' + id + '/contacted', {}, this.opts); }
    // Hírlevél (nyilvános: CSRF-süti után; a kulcsok a törzsben)
    newsletterSubscribe(email: string, lang: string, source: string, website: string) {
        return this.csrf().pipe(switchMap(() => this.http.post<{ message: string }>('/api/newsletter/subscribe', { email, consent: true, lang, source, website }, this.opts)));
    }
    newsletterConfirm(token: string) { return this.csrf().pipe(switchMap(() => this.http.post<{ message: string; unsubscribe_token: string }>('/api/newsletter/confirm', { token }, this.opts))); }
    newsletterUnsubscribe(token: string) { return this.csrf().pipe(switchMap(() => this.http.post<{ message: string }>('/api/newsletter/unsubscribe', { token }, this.opts))); }
    adminNewsletter(q = '', status = '') { return this.http.get<{ data: NewsletterSubscriber[]; counts: NewsletterCounts }>('/api/admin/newsletter', { ...this.opts, params: this.params({ q, status }) }); }
    deleteNewsletterSubscriber(id: number) { return this.http.delete<{ message: string }>('/api/admin/newsletter/' + id, this.opts); }
    exportNewsletter() { return this.http.get('/api/admin/exports/newsletter', { ...this.opts, responseType: 'blob' }); }
    exportQuotes(status?: string) { return this.http.get('/api/admin/exports/quote-requests', { ...this.opts, params: this.params({ status }), responseType: 'blob' }); }
}
