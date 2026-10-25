import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './navbar.html',
    styleUrls: ['./navbar.scss', './navbar-v11.scss']
})
export class Navbar implements OnInit {
    private readonly router = inject(Router);
    isDark = signal(true);
    menuOpen = signal(false);
    constructor() {
        this.router.events.pipe(filter(event => event instanceof NavigationEnd), takeUntilDestroyed())
            .subscribe(() => this.close());
    }
    @HostListener('document:keydown.escape')
    onEscape(): void { this.close(); }
    get isAdmin(): boolean {
        return this.router.url.startsWith('/admin');
    }
    ngOnInit(): void {
        const savedTheme = localStorage.getItem('mm-theme');
        this.isDark.set(savedTheme
            ? savedTheme === 'dark'
            : true);
        this.applyTheme();
    }
    toggleTheme(): void {
        this.isDark.update(value => !value);
        localStorage.setItem('mm-theme', this.isDark() ? 'dark' : 'light');
        this.applyTheme();
    }
    close(): void {
        this.menuOpen.set(false);
    }
    private applyTheme(): void {
        document.documentElement.setAttribute('data-theme', this.isDark() ? 'dark' : 'light');
    }
}
