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
    sort_order: number;
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
}
export interface AdminUser {
    id: number;
    name: string;
    email: string;
}
export interface Dashboard {
    quotes_monthly?: { label: string; count: number }[];
    quotes_total: number;
    quotes_new: number;
    quotes_reviewing: number;
    quotes_accepted: number;
    quotes_last_30_days: number;
    clients_total: number;
    portfolio_total: number;
    services_total: number;
    recent_quotes: Quote[];
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
    created_at: string;
}
export const STATUS_OPTIONS: {
    value: QuoteStatus;
    label: string;
}[] = [
    { value: 'new', label: 'Új' }, { value: 'reviewing', label: 'Folyamatban' }, { value: 'quoted', label: 'Ajánlat elküldve' }, { value: 'accepted', label: 'Elfogadva' }, { value: 'rejected', label: 'Elutasítva' }, { value: 'completed', label: 'Lezárva' }
];
export const SITE_DEFAULTS: SiteSettings = { site_title: 'Megyeri Márk Máté | Webfejlesztés', hero_headline: 'Ne csak jelen legyél online. Emelkedj ki.', hero_description: 'Egyedi weboldalakat és prémium digitális megoldásokat készítek vállalkozásoknak – hogy a megjelenésed bizalmat építsen, és támogassa az ügyfélszerzést.', contact_email: '', contact_phone: '', instagram_url: '', linkedin_url: '', github_url: '' };

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
