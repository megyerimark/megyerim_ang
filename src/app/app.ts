import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
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
    readonly showNavbar = signal(!this.router.url.startsWith('/admin'));
    constructor() {
        const savedTheme = localStorage.getItem('mm-theme');
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme
            ? (savedTheme === 'dark' ? 'dark' : 'light')
            : (systemTheme ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', theme);
        this.router.events
            .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
            .subscribe(event => {
            this.showNavbar.set(!event.urlAfterRedirects.startsWith('/admin'));
        });
    }
}
