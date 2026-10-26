import { Component, HostListener, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Meta, Title } from '@angular/platform-browser';
import { ApiService } from './core/api.service';
import { AttributionService } from './core/attribution.service';
import { SiteSettings } from './core/models';
import { Navbar } from './components/navbar/navbar';
import { ToastHost } from './components/toast/toast-host';
import { CookieBanner } from './components/cookie-banner/cookie-banner';
import { ConsentService } from './core/consent.service';
import { TPipe } from './i18n/t.pipe';
import { I18nService } from './i18n/i18n.service';
@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, RouterLink, Navbar, ToastHost, CookieBanner, TPipe],
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
    private seoSettings: SiteSettings | null = null;
    readonly showNavbar = signal(!this.router.url.startsWith('/admin'));
    readonly showTop = signal(false);
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
        this.api.publicSettings().subscribe({
            next: response => { this.seoSettings = response.data; this.consent.needed.set(!!response.data.reviews_widget_id); this.phone.set((response.data.contact_phone || '').replace(/[^0-9+]/g, '')); this.updateRouteMeta(this.router.url); },
            error: () => { /* Static metadata is a safe fallback when the API is unavailable. */ }
        });
        this.router.events
            .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
            .subscribe(event => {
            this.showNavbar.set(!event.urlAfterRedirects.startsWith('/admin'));
            const p = event.urlAfterRedirects.split(/[?#]/)[0];
            this.ctaRoute = p === '/' || p.startsWith('/munkak/') || p === '/tervezo';
            this.showMobileCta.set(this.ctaRoute && window.scrollY > 700);
            this.track(event.urlAfterRedirects);
            this.updateRouteMeta(event.urlAfterRedirects);
        });
    }
    private updateRouteMeta(url: string): void {
        const path = url.split(/[?#]/)[0];
        const isPrivate = path.startsWith('/admin') || path.startsWith('/ugyfel') || path === '/adatkezeles';
        this.meta.updateTag({ name: 'robots', content: isPrivate ? 'noindex, nofollow, noarchive' : 'index, follow' });
        const descriptions: Record<string, string> = {
            '/': 'Ne csak jelen legyél online. Emelkedj ki. Egyedi weboldalak és prémium digitális megoldások vállalkozásoknak Megyeri Márk Mátétól.',
            '/tervezo': 'Próbáld ki az interaktív weboldaltervezőt, és alakítsd ki a vállalkozásodhoz illő arculatot és funkciókat.',
            '/ajanlatkeres': 'Állítsd össze weboldalad elképzelését, és kérj személyre szabott ajánlatot Megyeri Márk Mátétól.',
            '/projekt-kviz': 'Pár kérdéssel megtudhatod, milyen weboldal illik a vállalkozásodhoz – és kérhetsz hozzá ajánlatot.',
            '/konzultacio': 'Foglalj időpontot online konzultációra a weboldalad megtervezéséhez.'
        };
        const en = this.i18n.lang() === 'en';
        const descriptionsEn: Record<string, string> = {
            '/': "Don't just be online. Stand out. Custom websites and premium digital solutions for businesses by Márk Máté Megyeri.",
            '/tervezo': 'Try the interactive website designer and shape a look and features that fit your business.',
            '/ajanlatkeres': 'Describe your website idea and request a tailored quote from Márk Máté Megyeri.',
            '/projekt-kviz': 'Answer a few questions to find out which website fits your business – and request a quote.',
            '/konzultacio': 'Book an online consultation to plan your website.'
        };
        // A route-ban megadott cím (app.routes.ts) – eddig a tényleges oldalcímet felülírta egy általános cím.
        let snapshot = this.router.routerState.snapshot.root;
        while (snapshot.firstChild) snapshot = snapshot.firstChild;
        const routeTitle = typeof snapshot.title === 'string' ? snapshot.title : '';
        const homeTitle = en ? "Márk Máté Megyeri | Premium web development for businesses" : (this.seoSettings?.meta_title || 'Megyeri Márk | Prémium webfejlesztés vállalkozásoknak');
        const description = en
            ? (descriptionsEn[path] || 'Márk Máté Megyeri | Web Development')
            : path === '/' ? (this.seoSettings?.meta_description || descriptions['/']) : (descriptions[path] || 'Megyeri Márk Máté | Webfejlesztés');
        this.meta.updateTag({ name: 'description', content: description });
        // hreflang: ugyanaz az oldal magyarul és angolul (?lang=en) – a Google így mindkét nyelvet ismeri.
        if (!isPrivate) {
            const base = 'https://megyerimarkmate.hu' + path;
            for (const [lang, href] of [['hu', base], ['en', base + '?lang=en'], ['x-default', base]] as const) {
                let link = document.head.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${lang}"]`);
                if (!link) { link = document.createElement('link'); link.rel = 'alternate'; link.hreflang = lang; document.head.appendChild(link); }
                link.href = href;
            }
        }
        this.title.setTitle(path === '/' ? homeTitle : (routeTitle ? this.i18n.t(routeTitle) : 'Megyeri Márk | Webfejlesztés'));
        this.meta.updateTag({ property: 'og:title', content: homeTitle });
        this.meta.updateTag({ property: 'og:description', content: description });
        if (this.seoSettings?.og_image_url) this.meta.updateTag({ property: 'og:image', content: this.seoSettings.og_image_url });
        const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
        const publicPath = ['/tervezo', '/ajanlatkeres', '/konzultacio', '/projekt-kviz'].includes(path) ? path : '/';
        if (canonical) canonical.href = 'https://megyerimarkmate.hu' + publicPath;
        this.meta.updateTag({ property: 'og:url', content: 'https://megyerimarkmate.hu' + publicPath });
    }
}
