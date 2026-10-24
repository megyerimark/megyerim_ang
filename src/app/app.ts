import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Meta } from '@angular/platform-browser';
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
    readonly showNavbar = signal(!this.router.url.startsWith('/admin'));
    constructor() {
        // AURORA V4: switch existing installations to the approved dark presentation once.
        if (localStorage.getItem('mm-aurora-v4') !== '1') {
            localStorage.setItem('mm-theme', 'dark');
            localStorage.setItem('mm-aurora-v4', '1');
        }
        const theme = localStorage.getItem('mm-theme') === 'light' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        this.updateRouteMeta(this.router.url);
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
        this.meta.updateTag({ name: 'description', content: descriptions[path] || 'Megyeri Márk Máté | Webfejlesztés' });
        const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
        const publicPath = ['/tervezo', '/ajanlatkeres', '/konzultacio'].includes(path) ? path : '/';
        if (canonical) canonical.href = 'https://megyerimarkmate.hu' + publicPath;
        this.meta.updateTag({ property: 'og:url', content: 'https://megyerimarkmate.hu' + publicPath });
    }
}
