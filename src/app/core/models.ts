export interface Envelope<T> {
    data: T;
    message?: string;
}
export interface Paged<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
}
export interface SiteSettings {
    site_title: string;
    hero_headline: string;
    hero_description: string;
    meta_title: string;
    meta_description: string;
    og_image_url: string;
    contact_email: string;
    contact_phone: string;
    instagram_url: string;
    linkedin_url: string;
    github_url: string;
    reviews_widget_id?: string;
    google_review_url?: string;
}
export interface Service {
    id: number;
    slug: string;
    title: string;
    summary: string;
    description: string | null;
    features: string[] | null;
    starting_price_huf: number | null;
    is_active: boolean;
    sort_order: number;
    title_en?: string | null;
    summary_en?: string | null;
    description_en?: string | null;
    features_en?: string[] | null;
}
export interface Project {
    id: number;
    slug: string;
    title: string;
    category: string | null;
    summary: string;
    description: string | null;
    technologies: string[] | null;
    project_url: string | null;
    cover_image_url: string | null;
    is_demo: boolean;
    is_published: boolean;
    is_featured: boolean;
    results?: ProjectResult[] | null;
    sort_order: number;
    title_en?: string | null;
    category_en?: string | null;
    summary_en?: string | null;
    description_en?: string | null;
}
export interface ProjectResult {
    value: string;
    label: string;
}
export type QuoteStatus = 'new' | 'reviewing' | 'quoted' | 'accepted' | 'rejected' | 'completed';
export interface Quote {
    id: number;
    customer_name: string;
    email: string;
    phone: string | null;
    company_name: string | null;
    website_type: string;
    design_style: string | null;
    industry?: string | null;
    layout_style?: string | null;
    font_style?: string | null;
    colors: string[] | null;
    features: string[] | null;
    inspiration_urls: string[] | null;
    budget_range: string | null;
    desired_deadline: string | null;
    project_description: string;
    wants_maintenance: boolean;
    consultation_preference: string | null;
    proposal_summary: string | null;
    proposal_schedule: string | null;
    proposal_terms: string | null;
    proposal_valid_until: string | null;
    proposal_accepted_at: string | null;
    quoted_at: string | null;
    status: QuoteStatus;
    admin_notes: string | null;
    quoted_price_huf: number | null;
    source?: string | null;
    utm_source?: string | null;
    utm_medium?: string | null;
    utm_campaign?: string | null;
    referrer_host?: string | null;
    landing_path?: string | null;
    first_response_at?: string | null;
    follow_up_at?: string | null;
    created_at: string;
    updated_at: string;
    unread_messages_count?: number;
    deposit_percent?: number | null;
    deposit_paid_at?: string | null;
    deposit_paid_via?: 'stripe' | 'transfer' | null;
    terms_version?: string | null;
}
export interface QuotePayload {
    customer_name: string;
    email: string;
    phone: string;
    company_name: string;
    website_type: string;
    design_style: string;
    industry?: string | null;
    layout_style?: string | null;
    font_style?: string | null;
    colors: string[];
    features: string[];
    inspiration_urls: string[];
    budget_range: string;
    desired_deadline: string | null;
    project_description: string;
    wants_maintenance: boolean;
    consultation_preference: string;
    privacy_notice_acknowledged: boolean;
    website: string;
    source?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    referrer_host?: string;
    landing_path?: string;
}
export interface AdminUser {
    id: number;
    name: string;
    email: string;
}
export interface Dashboard {
    quotes_monthly?: { label: string; count: number }[];
    accepted_value_monthly?: {label:string;value:number}[];
    quotes_by_status?: {status:QuoteStatus;count:number}[];
    quotes_by_type?: {label:string;count:number}[];
    lead_sources?: {quiz:number;form:number};
    maintenance_leads?: number;
    maintenance_active?: number;
    maintenance_contract_value_huf?: number;
    maintenance_reviews_due?: number;
    quotes_total: number;
    quotes_new: number;
    quotes_reviewing: number;
    quotes_accepted: number;
    quotes_last_30_days: number;
    clients_total: number;
    portfolio_total: number;
    services_total: number;
    recent_quotes: Quote[];
    tasks_open: number;
    tasks_overdue: number;
    quotes_quoted: number;
    quotes_completed: number;
    accepted_proposals_value_huf: number;
    upcoming_tasks: StudioTask[];
    messages_unread?: number;
    sites_expiring?: { id: number; name: string; domain: string | null; domain_expires_on: string | null; hosting_expires_on: string | null; ssl_expires_on: string | null }[];
    unread_threads?: { quote_request_id: number; customer_name: string | null; unread: number; last_at: string }[];
}
export type MaintenanceStatus = 'draft' | 'active' | 'paused' | 'canceled';
export interface MaintenanceAgreement {
    id: number;
    quote_request_id: number;
    quote_request: Pick<Quote, 'id'|'customer_name'|'email'|'company_name'|'status'|'wants_maintenance'>;
    plan_name: string;
    monthly_fee_huf: number;
    status: MaintenanceStatus;
    starts_on: string | null;
    next_review_on: string | null;
    included_services: string | null;
    internal_notes: string | null;
    billing_enabled?: boolean;
    stripe_subscription_id?: string | null;
    stripe_status?: string | null;
    current_period_end?: string | null;
    last_payment_at?: string | null;
}
export interface MaintenanceEditor {
    quote_request_id: number;
    plan_name: string;
    monthly_fee_huf: number;
    status: MaintenanceStatus;
    starts_on: string;
    next_review_on: string;
    included_services: string;
    internal_notes: string;
    billing_enabled: boolean;
}
export interface MaintenanceData {
    agreements: MaintenanceAgreement[];
    candidates: Pick<Quote,'id'|'customer_name'|'email'|'company_name'|'status'|'wants_maintenance'>[];
}
export interface StudioTask {
    id: number;
    title: string;
    description: string | null;
    due_date: string | null;
    is_done: boolean;
    quote_request_id: number | null;
    created_at: string;
}
export interface StudioClientNote {
    id: number;
    client_email: string;
    body: string;
    created_at: string;
}
export interface QuoteBoard {
    columns: Record<QuoteStatus, Quote[]>;
    totals: Record<QuoteStatus, number>;
    limit_per_column: number;
}
export interface WorkspaceProject {
    id: number;
    customer_name: string;
    company_name: string | null;
    email: string;
    website_type: string;
    quoted_price_huf: number | null;
    status: QuoteStatus;
    proposal_accepted_at: string | null;
    created_at: string;
    milestones_count: number;
    milestones_done_count: number;
}
export interface CommunicationCenter {
    proposals: Pick<Quote, 'id' | 'customer_name' | 'email' | 'status' | 'quoted_at' | 'proposal_valid_until'>[];
    events: {id:number;action:string;entity_id:number|null;created_at:string}[];
}
export interface Client {
    email: string;
    customer_name: string;
    company_name: string | null;
    quote_count: number;
    last_contact_at: string;
}
export interface Activity {
    id: number;
    action?: string;
    event?: string;
    subject_type?: string;
    subject_id?: number;
    entity_type?: string;
    entity_id?: number;
    created_at: string;
}
export const STATUS_OPTIONS: {
    value: QuoteStatus;
    label: string;
}[] = [
    { value: 'new', label: 'Új' }, { value: 'reviewing', label: 'Folyamatban' }, { value: 'quoted', label: 'Ajánlat elküldve' }, { value: 'accepted', label: 'Elfogadva' }, { value: 'rejected', label: 'Elutasítva' }, { value: 'completed', label: 'Lezárva' }
];
export const SITE_DEFAULTS: SiteSettings = { site_title: 'Megyeri Márk Máté | Webfejlesztés', hero_headline: 'Ne csak jelen legyél online. Emelkedj ki.', hero_description: 'Egyedi weboldalakat és prémium digitális megoldásokat készítek vállalkozásoknak – hogy a megjelenésed bizalmat építsen, és támogassa az ügyfélszerzést.', meta_title: 'Megyeri Márk | Prémium webfejlesztés vállalkozásoknak', meta_description: 'Prémium, egyedi weboldalak vállalkozásoknak. Megyeri Márk webfejlesztés: modern megjelenés, reszponzív kivitelezés és ügyfélszerzést támogató megoldások.', og_image_url: '', contact_email: '', contact_phone: '', instagram_url: '', linkedin_url: '', github_url: '', reviews_widget_id: '', google_review_url: '' };

export interface ProjectMilestone {
    id: number;
    title: string;
    description: string | null;
    status: 'pending' | 'in_progress' | 'done';
    due_date: string | null;
    sort_order: number;
}
export interface ClientProject {
    reference: number;
    customer_name: string;
    website_type: string;
    design_style: string | null;
    industry?: string | null;
    layout_style?: string | null;
    font_style?: string | null;
    status: QuoteStatus;
    created_at: string;
    updated_at: string;
    quoted_at: string | null;
    quoted_price_huf: number | null;
    proposal_summary: string | null;
    proposal_schedule: string | null;
    proposal_terms: string | null;
    proposal_valid_until: string | null;
    proposal_accepted_at: string | null;
    access_expires_at?: string | null;
    milestones: ProjectMilestone[];
    deposit_percent?: number | null;
    deposit_amount_huf?: number | null;
    deposit_paid_at?: string | null;
    terms_version?: string | null;
    online_payment?: boolean;
    maintenance?: {
        plan_name: string; monthly_fee_huf: number; included_services: string | null;
        subscription_status: string | null; current_period_end: string | null; can_start: boolean; can_manage: boolean;
    } | null;
}

export interface ConsultationBooking {
    id: number;
    customer_name: string;
    email: string;
    phone: string | null;
    notes: string | null;
}
export interface ConsultationSlot {
    id: number;
    starts_at: string;
    duration_minutes: number;
    booking?: ConsultationBooking | null;
}
export interface ConsultationConfirmation {
    message: string;
    reference: number;
    starts_at: string;
    duration_minutes: number;
}

export interface ProjectMessage { id: number; author: 'client' | 'admin'; body: string; created_at: string; }
export interface ProjectDocument { id: number; title: string; filename: string; mime_type: string; size_bytes: number; created_at: string; }
export interface ProjectCollaboration { messages: ProjectMessage[]; documents: ProjectDocument[]; }

export interface Testimonial {
    id: number;
    author_name: string;
    author_role: string | null;
    company: string | null;
    quote: string;
    rating: number;
    portfolio_project_id: number | null;
    is_published: boolean;
    sort_order: number;
    project?: { title: string; slug: string } | null;
}
export type TestimonialInput = Pick<Testimonial, 'author_name' | 'author_role' | 'company' | 'quote' | 'rating' | 'portfolio_project_id' | 'is_published' | 'sort_order'>;
export interface GrowthLead { id: number; customer_name: string; company_name: string | null; }
export interface GrowthData {
    funnel: { visits: number; page_views: number; cta_clicks: number; quote_starts: number; submissions: number; visit_to_lead_percent: number | null };
    channels: { channel: string; leads: number; won: number; won_value_huf: number }[];
    budgets: { label: string; count: number }[];
    daily_leads: { date: string; count: number }[];
    response: { average_hours: number | null; responded_count: number; waiting_over_24h: (GrowthLead & { created_at: string; hours_waiting: number })[] };
    attention: {
        follow_ups_due: (GrowthLead & { status: QuoteStatus; follow_up_at: string })[];
        stale_proposals: (GrowthLead & { quoted_price_huf: number | null; quoted_at: string; proposal_valid_until: string | null })[];
        expiring_proposals: (GrowthLead & { quoted_price_huf: number | null; proposal_valid_until: string })[];
    };
    revenue: { pipeline_value_huf: number; average_deal_huf: number | null; win_rate_percent: number | null };
    trust: { testimonials_published: number; projects_published: number };
}

/** Kész (élesített) projekt; a vault_blob böngészőben titkosított hozzáféréseket tartalmaz. */
export interface ClientSite {
    id: number;
    name: string;
    domain: string | null;
    quote_request_id: number | null;
    client_name: string | null;
    client_email: string | null;
    launched_on: string | null;
    hosting_provider: string | null;
    domain_registrar: string | null;
    domain_expires_on: string | null;
    hosting_expires_on: string | null;
    ssl_expires_on: string | null;
    tech_stack: string | null;
    notes: string | null;
    vault_blob: string | null;
}
export type ClientSiteInput = Omit<ClientSite, 'id' | 'vault_blob'> & { vault_blob?: string | null };

export interface FinanceEntry {
    id: number;
    type: 'income' | 'expense';
    occurred_on: string;
    amount_huf: number;
    vat_rate: number;
    category: string;
    description: string | null;
    quote_request_id: number | null;
    source: 'manual' | 'stripe';
}
export type FinanceEntryInput = Pick<FinanceEntry, 'type' | 'occurred_on' | 'amount_huf' | 'vat_rate' | 'category' | 'description'> & { quote_request_id?: number | null };
export interface FinanceSettings {
    tax_regime: 'atalanyado';
    vat_registered: boolean;
    vat_exempt_limit_huf: number;
    cost_ratio_percent: number;
    tax_free_income_huf: number;
    szja_percent: number;
    tb_percent: number;
    szocho_percent: number;
    full_time: boolean;
    min_base_monthly_huf: number;
    atalany_income_limit_huf: number;
}
export interface FinanceMonth {
    month: number;
    income_gross: number;
    income_net: number;
    output_vat: number;
    expense_gross: number;
    expense_net: number;
    input_vat: number;
    vat_payable: number;
    atalany_income: number;
    taxable_income: number;
    szja: number;
    tb: number;
    szocho: number;
    taxes_total: number;
    net_after_tax: number;
    net_after_tax_and_expenses: number;
}
export interface FinanceSummary {
    year: number;
    settings: FinanceSettings;
    months: FinanceMonth[];
    totals: Omit<FinanceMonth, 'month'>;
    warnings: string[];
    categories: { expense: { category: string; total: number }[]; income: { category: string; total: number }[] };
}
