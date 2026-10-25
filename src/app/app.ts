import { Component, HostListener, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Meta, Title } from '@angular/platform-browser';
import { ApiService } from './core/api.service';
import { SiteSettings } from './core/models';
import { Navbar } from './components/navbar/navbar';
@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, Navbar],
    templateUrl: './app.html',
    styleUrl: './app.scss'
})
export class App {
    private readonly router = inject(Router);
    private readonly meta = inject(Meta);
    private readonly title = inject(Title);
    private readonly api = inject(ApiService);
    private seoSettings: SiteSettings | null = null;
    readonly showNavbar = signal(!this.router.url.startsWith('/admin'));
    readonly showTop = signal(false);
    @HostListener('window:scroll')
    onScroll(): void { const visible = window.scrollY > 900; if (visible !== this.showTop()) this.showTop.set(visible); }
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
        this.updateRouteMeta(this.router.url);
        this.api.publicSettings().subscribe({
            next: response => { this.seoSettings = response.data; this.updateRouteMeta(this.router.url); },
            error: () => { /* Static metadata is a safe fallback when the API is unavailable. */ }
        });
        this.router.events
            .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
            .subscribe(event => {
            this.showNavbar.set(!event.urlAfterRedirects.startsWith('/admin'));
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
            '/konzultacio': 'Foglalj időpontot online konzultációra a weboldalad megtervezéséhez.'
        };
        const homeTitle = this.seoSettings?.meta_title || 'Megyeri Márk | Prémium webfejlesztés vállalkozásoknak';
        const description = path === '/' ? (this.seoSettings?.meta_description || descriptions['/']) : (descriptions[path] || 'Megyeri Márk Máté | Webfejlesztés');
        this.meta.updateTag({ name: 'description', content: description });
        this.title.setTitle(path === '/' ? homeTitle : 'Megyeri Márk | Webfejlesztés');
        this.meta.updateTag({ property: 'og:title', content: homeTitle });
        this.meta.updateTag({ property: 'og:description', content: description });
        if (this.seoSettings?.og_image_url) this.meta.updateTag({ property: 'og:image', content: this.seoSettings.og_image_url });
        const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
        const publicPath = ['/tervezo', '/ajanlatkeres', '/konzultacio'].includes(path) ? path : '/';
        if (canonical) canonical.href = 'https://megyerimarkmate.hu' + publicPath;
        this.meta.updateTag({ property: 'og:url', content: 'https://megyerimarkmate.hu' + publicPath });
    }
}
