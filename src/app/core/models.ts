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
export const SITE_DEFAULTS: SiteSettings = { site_title: 'Megyeri Márk Máté | Webfejlesztés', hero_headline: 'Ne csak jelen legyél online. Emelkedj ki.', hero_description: 'Egyedi weboldalakat és prémium digitális megoldásokat készítek vállalkozásoknak – hogy a megjelenésed bizalmat építsen, és támogassa az ügyfélszerzést.', meta_title: 'Megyeri Márk | Prémium webfejlesztés vállalkozásoknak', meta_description: 'Prémium, egyedi weboldalak vállalkozásoknak. Megyeri Márk webfejlesztés: modern megjelenés, reszponzív kivitelezés és ügyfélszerzést támogató megoldások.', og_image_url: '', contact_email: '', contact_phone: '', instagram_url: '', linkedin_url: '', github_url: '' };

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
