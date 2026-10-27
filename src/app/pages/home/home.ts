import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { PromoSpotlight } from '../../components/promo-spotlight/promo-spotlight';
import { NewsletterSignup } from '../../components/newsletter-signup/newsletter-signup';
import { Hero } from '../../components/hero/hero';
import { CinematicStory } from '../../components/cinematic-story/cinematic-story';
import { PremiumReveal } from '../../directives/premium-reveal';
import { ApiService } from '../../core/api.service';
import { ConsentService } from '../../core/consent.service';
import { ExternalReviews } from '../../components/external-reviews/external-reviews';
import { Project, Service, SiteSettings, Testimonial, SITE_DEFAULTS } from '../../core/models';
import { TPipe } from '../../i18n/t.pipe';
import { I18nService } from '../../i18n/i18n.service';
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
    imports: [Hero, CinematicStory, RouterLink, DecimalPipe, PremiumReveal, ExternalReviews, TPipe, PromoSpotlight, NewsletterSignup],
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
            ? 'Ne csak jelen legyél online. Emelkedj ki.' : value;
    });
    readonly heroDescription = computed(() => {
        const value = this.settings().hero_description?.trim();
        return !value || ['Egyedi, modern weboldalak vállalkozásoknak.', 'Egyedi, modern weboldalakat készítek vállalkozásoknak – átgondolt dizájnnal és üzleti szemlélettel.'].includes(value)
            ? 'Prémium weboldalakat és egyedi webes rendszereket készítek vállalkozásoknak. Átgondolt megjelenés, könnyű kapcsolatfelvétel, személyes együttműködés.' : value;
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
    readonly demoSites = [
        { slug: 'vagat-barber', preview: 'vagat', title: 'VÁGAT Barber Studio', kind: 'BARBER SHOP / DEMÓ', text: 'Fiktív barber shop weboldal prémium megjelenéssel.' },
        { slug: 'axis-detailing', preview: 'axis', title: 'AXIS Auto Detailing', kind: 'AUTÓKOZMETIKA / DEMÓ', text: 'Prémium autókozmetikai oldal interaktív csomagokkal.' },
        { slug: 'pulse-fitness', preview: 'pulse', title: 'PULSE Training', kind: 'SZEMÉLYI EDZŐ / DEMÓ', text: 'Modern bemutatóoldal programválasztóval.' }
    ];
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

    readonly processSteps = [
        {
            number: '01',
            title: 'Megismerem a céljaidat',
            description: 'Rövid egyeztetés: kinek szól az oldal, milyen problémát oldjon meg, és mi számít sikernek.'
        },
        {
            number: '02',
            title: 'Kialakítjuk a koncepciót',
            description: 'Vizuális irány, oldaltérkép, felhasználói út és az elvárt funkciók pontosítása.'
        },
        {
            number: '03',
            title: 'Megépítem és finomítjuk',
            description: 'Fejlesztés, reszponzív kialakítás, közös visszajelzések és tesztelés.'
        },
        {
            number: '04',
            title: 'Élesítünk és támogatlak',
            description: 'Átadás, beállítások, betanítás és igény esetén későbbi karbantartás.'
        }
    ];
    readonly faqs = [
        {
            question: 'Mennyibe kerül egy egyedi weboldal?',
            answer: 'Az ár a funkcióktól, a tartalom mennyiségétől és a tervezési igénytől függ. Az ajánlatkérőben megadhatod a költségkeretedet, és ahhoz igazítva egyeztetünk.'
        },
        {
            question: 'Mennyi idő alatt készül el?',
            answer: 'Az ütemezést az igények, a jóváhagyások és a szükséges tartalmak alapján határozzuk meg. A részleteket még a fejlesztés előtt tisztázzuk.'
        },
        {
            question: 'Később is módosítható a weboldal?',
            answer: 'Igen. A későbbi módosítások és az igény szerinti rendszeres karbantartás is egyeztethető.'
        },
        {
            question: 'Csak egyszerű bemutatkozó oldalt készítesz?',
            answer: 'Nem. Egyedi funkciók, adminfelületek és adatbázishoz kapcsolódó webes rendszerek tervezésére is kérhetsz ajánlatot.'
        },
        {
            question: 'Mi történik, miután elküldtem az ajánlatkérést?',
            answer: 'Átnézem, amit leírtál, és e-mailben vagy a megadott módon felveszem veled a kapcsolatot. Ha kell, rövid egyeztetéssel pontosítjuk az igényeket, majd írásos ajánlatot kapsz – ez nem kötelez semmire.'
        },
        {
            question: 'Nem tudom pontosan, mire van szükségem. Kérhetek így ajánlatot?',
            answer: 'Igen. A kvíz és az ajánlatkérő is segít rendszerezni az elképzeléseidet, a hiányzó részleteket pedig közösen tisztázzuk.'
        }
    ];
    ngOnInit(): void {
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
