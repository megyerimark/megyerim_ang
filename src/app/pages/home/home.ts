import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { PromoSpotlight } from '../../components/promo-spotlight/promo-spotlight';
import { NewsletterSignup } from '../../components/newsletter-signup/newsletter-signup';
import { Hero } from '../../components/hero/hero';
import { PremiumReveal } from '../../directives/premium-reveal';
import { MmFx } from '../../core/scroll-fx';
import { ApiService } from '../../core/api.service';
import { ConsentService } from '../../core/consent.service';
import { ExternalReviews } from '../../components/external-reviews/external-reviews';
import { Project, Service, SiteSettings, Testimonial, SITE_DEFAULTS } from '../../core/models';
import { TPipe } from '../../i18n/t.pipe';
import { BrandMark } from '../../components/brand-mark/brand-mark';
import { I18nService } from '../../i18n/i18n.service';
import { LpPipe } from '../../i18n/lp.pipe';
import { DEFAULT_HERO_DESCRIPTION, DEFAULT_HERO_HEADLINE, FAQS, PROCESS_STEPS } from './home-content';
type PreviewPurpose = 'business' | 'booking' | 'system';
type PreviewStyle = 'graphite' | 'ivory' | 'ocean';

interface PreviewMode {
    value: PreviewPurpose;
    label: string;
    eyebrow: string;
    headline: string;
    description: string;
    cta: string;
}

interface PreviewPalette {
    value: PreviewStyle;
    label: string;
}

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [LpPipe, Hero, RouterLink, DecimalPipe, PremiumReveal, MmFx, ExternalReviews, TPipe, PromoSpotlight, NewsletterSignup, BrandMark],
    templateUrl: './home.html',
    styleUrl: './home.scss'
})
export class Home implements OnInit {
    readonly i18n = inject(I18nService);
    loc(obj: object | null | undefined, field: string): string { return this.i18n.loc(obj, field); }
    private readonly api = inject(ApiService);
    settings = signal<SiteSettings>(SITE_DEFAULTS);
    readonly consent = inject(ConsentService);
    services = signal<Service[]>([]);
    projects = signal<Project[]>([]);
    testimonials = signal<Testimonial[]>([]);
    servicesUnavailable = signal(false);
    projectsUnavailable = signal(false);
    settingsUnavailable = signal(false);
    openFaq = signal<number | null>(0);
    /** Az adminban beállított akció (a szerver dönti el, aktív-e). */
    readonly promo = computed(() => { const p = this.settings().promo; return p?.active && p.percent > 0 ? p : null; });
    readonly promoTitle = computed(() => this.i18n.loc(this.settings(), 'promo_title'));
    readonly promoText = computed(() => this.i18n.loc(this.settings(), 'promo_text'));
    discounted(amount: number | null): string | null {
        const p = this.promo();
        if (!p || amount === null) return null;
        return this.money(Math.round(amount * (100 - p.percent) / 100 / 1000) * 1000);
    }
    readonly year = new Date().getFullYear();
    readonly heroHeadline = computed(() => {
        const value = this.settings().hero_headline?.trim();
        return !value || value === 'Prémium weboldalak, amelyek nemcsak szépek.'
            ? DEFAULT_HERO_HEADLINE : value;
    });
    readonly heroDescription = computed(() => {
        const value = this.settings().hero_description?.trim();
        return !value || ['Egyedi, modern weboldalak vállalkozásoknak.', 'Egyedi, modern weboldalakat készítek vállalkozásoknak – átgondolt dizájnnal és üzleti szemlélettel.'].includes(value)
            ? DEFAULT_HERO_DESCRIPTION : value;
    });
    readonly comparisonView = signal<'before' | 'after'>('after');
    readonly comparisonPosition = signal(42);
    readonly beforePoints = ['Általános, felejthető megjelenés', 'Nehézkes navigáció', 'Bizonytalan következő lépés'];
    readonly afterPoints = ['Karakteres, hiteles arculat', 'Átlátható ügyfélút', 'Egyértelmű ajánlatkérés'];
    readonly briefType = signal<'business' | 'landing' | 'webshop' | 'custom'>('business');
    readonly briefOptions = [
        { value: 'business', title: 'Céges weboldal', detail: 'Professzionális bemutatkozás és ügyfélszerzés' },
        { value: 'landing', title: 'Landing oldal', detail: 'Egy ajánlatra vagy kampányra fókuszálva' },
        { value: 'webshop', title: 'Webáruház', detail: 'Termékek és egyszerűbb vásárlói élmény' },
        { value: 'custom', title: 'Egyedi webes rendszer', detail: 'Saját munkafolyamatok és speciális funkciók' }
    ] as const;
    readonly inquiryCount = signal(40);
    readonly inquiryMinutes = signal(15);
    readonly savedHours = computed(() => this.inquiryCount() * this.inquiryMinutes() * 0.4 / 60);
    setInquiryCount(event: Event): void { this.inquiryCount.set(Number((event.target as HTMLInputElement).value)); }
    setInquiryMinutes(event: Event): void { this.inquiryMinutes.set(Number((event.target as HTMLInputElement).value)); }
    readonly selectedPurpose = signal<PreviewPurpose>('business');
    readonly selectedStyle = signal<PreviewStyle>('graphite');
    readonly selectedDevice = signal<'desktop' | 'mobile'>('desktop');
    /** A cél-horgony (pl. /#szolgaltatasok – másik oldalról érkezve is): ilyenkor a nyitójelenet alatti tartalom azonnal kell. */
    private readonly anchor = inject(ActivatedRoute, { optional: true })?.snapshot.fragment ?? null;
    readonly hasAnchor = !!this.anchor;
    readonly demoSites = [
        { slug: 'nobile-autoszalon', preview: 'nobile', title: 'NOBILE Autószalon', kind: 'PRÉMIUM AUTÓSZALON / DEMÓ', text: 'Görgetéses 3D kollekció aranyporrá bomló panelekkel, konfigurátor, finanszírozási kalkulátor és tesztvezetés-foglalás.', tags: ['3D kollekció', 'Konfigurátor', 'Tesztvezetés-foglalás'] },
        { slug: 'vagat-barber', preview: 'vagat', title: 'VÁGAT Barber Studio', kind: 'BARBER SHOP / DEMÓ', text: 'Fiktív barber shop weboldal prémium megjelenéssel.', tags: ['Szolgáltatások', 'Árlista', 'Időpontfoglalás'] },
        { slug: 'axis-detailing', preview: 'axis', title: 'AXIS Auto Detailing', kind: 'AUTÓKOZMETIKA / DEMÓ', text: 'Prémium autókozmetikai oldal interaktív csomagokkal.', tags: ['Csomagok', 'Átalakulás', 'Ajánlatkérés'] },
        { slug: 'pulse-fitness', preview: 'pulse', title: 'PULSE Training', kind: 'SZEMÉLYI EDZŐ / DEMÓ', text: 'Modern bemutatóoldal programválasztóval.', tags: ['Programválasztó', 'Módszer', 'GYIK'] }
    ];
    /** Szolgáltatás-kártyák: az adminban felvett szolgáltatások (vagy alapértelmezettek), mindegyik más vizuális kompozícióval. */
    readonly serviceCards = computed(() => {
        const kinds = ['site', 'landing', 'system', 'brand'] as const;
        const types = ['business', 'landing', 'custom', null] as const;
        const list = this.services();
        if (list.length) return list.map((service, i) => ({ key: 'api-' + service.id, kind: kinds[i % 4], type: types[i % 4], service, title: '', summary: '' }));
        return [
            { key: 'd1', kind: kinds[0], type: types[0], service: null, title: 'Céges weboldalak', summary: 'Karakteres online megjelenés, világos üzenetekkel és könnyű navigációval.' },
            { key: 'd2', kind: kinds[1], type: types[1], service: null, title: 'Landing oldalak', summary: 'Egy jól meghatározott cél köré épített, látványos és fókuszált felületek.' },
            { key: 'd3', kind: kinds[2], type: types[2], service: null, title: 'Egyedi webes rendszerek', summary: 'Adminfelületek és funkciók, amelyek valódi munkafolyamatokat könnyítenek meg.' },
        ];
    });
    /** A szolgáltatási céloldalak (belső linkelés a főoldalról; a cím magyarul, az lp pipe fordítja). */
    readonly servicePages = [
        { path: '/weboldal-keszites', label: 'Weboldal készítés' },
        { path: '/landing-oldal-keszites', label: 'Landing oldal készítés' },
        { path: '/webshop-keszites', label: 'Webshop készítés' },
        { path: '/egyedi-webfejlesztes', label: 'Egyedi webfejlesztés' },
        { path: '/weboldal-karbantartas', label: 'Weboldal karbantartás' },
    ];
    readonly sxLabel: Record<string, string> = { site: 'WEBOLDAL', landing: 'KONVERZIÓ', system: 'RENDSZER', brand: 'ARCULAT' };
    readonly chartBars = [.38, .52, .44, .7, .58, .82, .66, .94];
    readonly realProjects = computed(() => this.projects().filter(project => !project.is_demo));

    readonly previewModes: PreviewMode[] = [
        {
            value: 'business',
            label: 'Céges weboldal',
            eyebrow: 'EGYEDI WEBOLDAL / MÁRKAÉPÍTÉS',
            headline: 'Az első benyomás számít.',
            description: 'Letisztult bemutatkozás, jól felépített szolgáltatások és világos következő lépés az ügyfeleidnek.',
            cta: 'Ismerj meg minket'
        },
        {
            value: 'booking',
            label: 'Időpontfoglalás',
            eyebrow: 'SZOLGÁLTATÁS / ONLINE FOGLALÁS',
            headline: 'Kevesebb egyeztetés. Több idő.',
            description: 'A szolgáltatások és a foglalási lehetőségek egy átlátható, könnyen használható felületen.',
            cta: 'Időpontot választok'
        },
        {
            value: 'system',
            label: 'Egyedi webes rendszer',
            eyebrow: 'WEBALKALMAZÁS / EGYEDI MŰKÖDÉS',
            headline: 'Digitális eszköz. A te folyamataidra.',
            description: 'Ügyféladatok, feladatok vagy szolgáltatások kezelése egy célra szabott webes felületen.',
            cta: 'Megnézem a lehetőségeket'
        }
    ];

    readonly previewPalettes: PreviewPalette[] = [
        { value: 'graphite', label: 'Grafit' },
        { value: 'ivory', label: 'Világos' },
        { value: 'ocean', label: 'Éjkék' }
    ];

    readonly activePreview = computed(() =>
        this.previewModes.find(mode => mode.value === this.selectedPurpose()) ?? this.previewModes[0]
    );

    readonly processSteps = PROCESS_STEPS;
    readonly faqs = FAQS;
    /** A késleltetett tartalom betöltése után a horgonyhoz görget (a router saját görgetése ekkor még nem találja az elemet). */
    private scrollToAnchorWhenReady(): void {
        const id = this.anchor;
        if (!id || typeof window === 'undefined') return;
        // A tartalom (képek, API-adatok) betöltés közben még tolhatja a célt: rövid ideig a helyén tartjuk,
        // amíg a látogató maga nem görget.
        let tries = 0, settled = 0, userMoved = false;
        const stop = () => { userMoved = true; };
        for (const ev of ['wheel', 'touchstart', 'keydown'] as const) window.addEventListener(ev, stop, { once: true, passive: true });
        const tick = () => {
            if (userMoved) return;
            const el = document.getElementById(id);
            if (el) {
                const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
                if (Math.abs(el.getBoundingClientRect().top - pad) > 40) el.scrollIntoView();
                if (settled++ < 14) setTimeout(tick, 150);
                return;
            }
            if (tries++ < 50) setTimeout(tick, 80);
        };
        setTimeout(tick, 60);
    }

    ngOnInit(): void {
        this.scrollToAnchorWhenReady();
        this.api.publicSettings().subscribe({
            next: response => {
                this.settings.set({ ...SITE_DEFAULTS, ...response.data });
            },
            error: () => this.settingsUnavailable.set(true)
        });
        this.api.publicServices().subscribe({
            next: response => this.services.set(response.data),
            error: () => this.servicesUnavailable.set(true)
        });
        // Vélemények: hiba vagy üres lista esetén a szakasz egyszerűen nem jelenik meg.
        this.api.publicTestimonials().subscribe({ next: response => this.testimonials.set(response.data), error: () => this.testimonials.set([]) });
        this.api.publicProjects().subscribe({
            next: response => this.projects.set(response.data),
            error: () => this.projectsUnavailable.set(true)
        });
    }
    money(amount: number | null): string {
        if (amount === null) {
            return this.i18n.t('Egyedi ajánlat');
        }
        const value = new Intl.NumberFormat('hu-HU').format(amount);
        return this.i18n.lang() === 'en' ? `From HUF ${value}` : `${value} Ft-tól`;
    }
    stars(n: number): string { return '★'.repeat(Math.max(0, Math.min(5, n))) + '☆'.repeat(5 - Math.max(0, Math.min(5, n))); }
    toggleFaq(index: number): void {
        this.openFaq.update(current => current === index ? null : index);
    }
    selectComparison(view: 'before' | 'after'): void {
        this.comparisonView.set(view);
        this.comparisonPosition.set(view === 'before' ? 100 : 0);
    }
    moveComparison(event: Event): void {
        const position = Number((event.target as HTMLInputElement).value);
        this.comparisonPosition.set(position);
        this.comparisonView.set(position > 50 ? 'before' : 'after');
    }
}
