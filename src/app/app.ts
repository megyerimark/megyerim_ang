import { Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Meta, Title } from '@angular/platform-browser';
import { ApiService } from './core/api.service';
import { AttributionService } from './core/attribution.service';
import { SiteSettings } from './core/models';
import { Navbar } from './components/navbar/navbar';
import { PromoBar } from './components/promo-bar/promo-bar';
import { ToastHost } from './components/toast/toast-host';
import { DomTranslator } from './i18n/dom-translator';
import { CookieBanner } from './components/cookie-banner/cookie-banner';
import { ConsentService } from './core/consent.service';
import { TPipe } from './i18n/t.pipe';
import { I18nService } from './i18n/i18n.service';
import { SubmitLoader } from './components/submit-loader/submit-loader';
import { PaletteService } from './core/palette.service';
import { SeasonalDecor } from './components/seasonal-decor/seasonal-decor';
import { PAGE_SEO, pageUrl } from './core/seo';
@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, RouterLink, Navbar, PromoBar, ToastHost, CookieBanner, TPipe, SubmitLoader, SeasonalDecor],
    templateUrl: './app.html',
    styleUrl: './app.scss'
})
export class App {
    readonly i18n = inject(I18nService);
    private readonly router = inject(Router);
    private readonly meta = inject(Meta);
    private readonly title = inject(Title);
    private readonly api = inject(ApiService);
    private readonly attribution = inject(AttributionService);
    private readonly consent = inject(ConsentService);
    readonly consentPanelOpen = this.consent.panelOpen;
    private readonly palette = inject(PaletteService);
    private seoSettings: SiteSettings | null = null;
    readonly showNavbar = signal(!this.router.url.startsWith('/admin'));
    /** Külső (hozzájárulásköteles) tartalom csak a főoldalon van – a süti-sáv is csak ott jelenik meg. */
    readonly onHome = signal(this.router.url.split(/[?#]/)[0] === '/');
    private readonly domTranslator = inject(DomTranslator);
    readonly currentPath = signal(typeof location !== 'undefined' ? location.pathname : '/');
    readonly showTop = signal(false);
    /** Akciós sáv: a nyilvános oldalakon igen; az ajánlatkérő/kvíz saját akciós dobozt mutat, a privát oldalakon nem releváns. */
    readonly showPromoBar = computed(() => !/^\/(ajanlatkeres|projekt-kviz|ugyfel|fizetes|hirlevel|admin)/.test(this.currentPath()));
    readonly phone = signal('');
    readonly showMobileCta = signal(false);
    private lastTracked = '';
    @HostListener('window:scroll')
    onScroll(): void {
        const visible = window.scrollY > 900; if (visible !== this.showTop()) this.showTop.set(visible);
        const cta = window.scrollY > 700 && this.ctaRoute; if (cta !== this.showMobileCta()) this.showMobileCta.set(cta);
    }
    private ctaRoute = false;
    /** Ajánlatkérésre mutató linkek kattintásainak anonim számlálása (főleg a hero, a navigáció és a lábléc). */
    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const link = (event.target as Element | null)?.closest?.('a[href]');
        if (!link) return;
        const href = link.getAttribute('href') ?? '';
        if (href.startsWith('/ajanlatkeres') || href.startsWith('/projekt-kviz') || href.startsWith('/konzultacio')) this.api.trackEvent('cta_click', this.router.url);
    }
    private track(url: string): void {
        const path = url.split(/[?#]/)[0];
        if (path === this.lastTracked || path.startsWith('/admin') || path.startsWith('/ugyfel')) return;
        this.lastTracked = path;
        this.api.trackEvent('page_view', path);
        if (path === '/ajanlatkeres') this.api.trackEvent('quote_start', path);
        if (path === '/projekt-kviz') this.api.trackEvent('quiz_start', path);
        if (path === '/konzultacio') this.api.trackEvent('consultation_start', path);
    }
    scrollTop(): void { window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }
    /** Billentyűzetes / felolvasós látogatóknak: a menü átugrása a fő tartalomra. */
    skipToMain(event: Event): void {
        event.preventDefault();
        const main = document.querySelector<HTMLElement>('main');
        if (!main) return;
        main.setAttribute('tabindex', '-1');
        main.focus();
    }

    constructor() {
        // AURORA V4: switch existing installations to the approved dark presentation once.
        // A tárolás privát böngészési módban vagy tiltott sütiknél kivételt dobhat – ez nem törheti el az oldalt.
        let storedTheme: string | null = null;
        try {
            if (localStorage.getItem('mm-aurora-v4') !== '1') {
                localStorage.setItem('mm-theme', 'dark');
                localStorage.setItem('mm-aurora-v4', '1');
            }
            storedTheme = localStorage.getItem('mm-theme');
        }
        catch { /* alapértelmezett sötét téma */ }
        const theme = storedTheme === 'light' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        this.attribution.capture();
        this.updateRouteMeta(this.router.url);
        // Nyelvváltáskor a címet és a leírást is frissítjük.
        effect(() => { this.i18n.lang(); this.updateRouteMeta(this.router.url); });
        // Admin angol nézete: a magyar sablonokat szótár alapján, megjelenítéskor fordítjuk (lásd DomTranslator).
        effect(() => {
            const adminEn = this.i18n.lang() === 'en' && this.currentPath().startsWith('/admin');
            if (adminEn) void this.domTranslator.enable(); else this.domTranslator.disable();
        });
        this.api.publicSettings().subscribe({
            next: response => { this.palette.applySettings(response.data); this.seoSettings = response.data; this.consent.needed.set(!!response.data.reviews_widget_id); this.phone.set((response.data.contact_phone || '').replace(/[^0-9+]/g, '')); this.updateRouteMeta(this.router.url); },
            // Static metadata is a safe fallback when the API is unavailable; the seasonal theme still applies.
            error: () => this.palette.render()
        });
        this.router.events
            .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
            .subscribe(event => {
            this.showNavbar.set(!event.urlAfterRedirects.startsWith('/admin'));
            this.onHome.set(event.urlAfterRedirects.split(/[?#]/)[0] === '/');
            this.currentPath.set(event.urlAfterRedirects.split(/[?#]/)[0]);
            const p = event.urlAfterRedirects.split(/[?#]/)[0];
            this.ctaRoute = p === '/' || p.startsWith('/munkak/') || p === '/tervezo';
            this.showMobileCta.set(this.ctaRoute && window.scrollY > 700);
            this.track(event.urlAfterRedirects);
            this.updateRouteMeta(event.urlAfterRedirects);
        });
    }
    private updateRouteMeta(url: string): void {
        const path = url.split(/[?#]/)[0];
        let leaf = this.router.routerState.snapshot.root;
        while (leaf.firstChild) leaf = leaf.firstChild;
        const notFound = leaf.routeConfig?.path === '**';
        const isPrivate = notFound || /^\/(admin|ugyfel|hirlevel|fizetes)/.test(path);
        this.meta.updateTag({ name: 'robots', content: isPrivate ? 'noindex, nofollow, noarchive' : 'index, follow' });
        const lang = this.i18n.lang();
        // A referenciaoldal (munkak/:slug) a címét és a leírását a betöltött projektből maga állítja be.
        const caseStudy = path.startsWith('/munkak/');
        if (!caseStudy) {
            const seo = PAGE_SEO[lang][path];
            const custom = lang === 'hu' && path === '/' ? this.seoSettings : null;
            const routeTitle = typeof leaf.title === 'string' ? this.i18n.t(leaf.title) : '';
            const title = custom?.meta_title || seo?.title || routeTitle || this.i18n.t('Megyeri Márk Máté | Webfejlesztés');
            const description = custom?.meta_description || seo?.description || PAGE_SEO[lang]['/'].description;
            this.title.setTitle(title);
            this.meta.updateTag({ name: 'description', content: description });
            this.meta.updateTag({ property: 'og:title', content: title });
            this.meta.updateTag({ property: 'og:description', content: description });
        }
        this.meta.updateTag({ property: 'og:locale', content: lang === 'en' ? 'en_US' : 'hu_HU' });
        if (this.seoSettings?.og_image_url) this.meta.updateTag({ property: 'og:image', content: this.seoSettings.og_image_url });
        // Minden oldal saját magára mutat (az angol változat a ?lang=en címre) – így a Google a referenciákat és
        // az angol oldalakat is külön oldalként indexeli, nem a főoldal másolataként.
        const self = pageUrl(isPrivate ? '/' : path, lang);
        const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
        if (canonical) canonical.href = self;
        this.meta.updateTag({ property: 'og:url', content: self });
        // hreflang: ugyanaz az oldal magyarul és angolul – a Google a keresés nyelve szerint a megfelelőt mutatja.
        for (const hreflang of ['hu', 'en', 'x-default'] as const) {
            let link = document.head.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${hreflang}"]`);
            if (isPrivate) { link?.remove(); continue; }
            if (!link) { link = document.createElement('link'); link.rel = 'alternate'; link.hreflang = hreflang; document.head.appendChild(link); }
            link.href = pageUrl(path, hreflang === 'en' ? 'en' : 'hu');
        }
    }
}
