import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { AdminUser, Activity, Client, ClientProject, ConsultationConfirmation, ConsultationSlot, Dashboard, Envelope, Paged, Project, ProjectMilestone, ProjectMessage, ProjectDocument, ProjectCollaboration, Quote, QuotePayload, QuoteBoard, Service, SiteSettings, StudioTask, StudioClientNote, WorkspaceProject, CommunicationCenter } from './models';
@Injectable({ providedIn: 'root' })
export class ApiService {
    private http = inject(HttpClient);
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
        return this.csrf().pipe(switchMap(() => this.http.post<{
            message: string;
            reference: number;
        }>('/api/quote-requests', data, this.opts)));
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
    acceptProposal(token: string) {
        return this.csrf().pipe(switchMap(() => this.http.post<Envelope<ClientProject>>('/api/client/project/accept', { token, accept_terms: true }, this.opts)));
    }
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
    adminSecurity() { return this.http.get<Envelope<{two_factor_email_enabled: boolean; session_driver: string}>>('/api/admin/security', this.opts); }
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
    saveQuote(id: number, data: Partial<Pick<Quote, 'status' | 'admin_notes' | 'quoted_price_huf' | 'proposal_summary' | 'proposal_schedule' | 'proposal_terms' | 'proposal_valid_until'>>) { return this.http.patch<Envelope<Quote>>('/api/admin/quote-requests/' + id, data, this.opts); }
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
}
