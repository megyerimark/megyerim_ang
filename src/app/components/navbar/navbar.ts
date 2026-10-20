import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './navbar.html',
    styleUrl: './navbar.scss'
})
export class Navbar implements OnInit {
    private readonly router = inject(Router);
    isDark = signal(true);
    menuOpen = signal(false);
    get isAdmin(): boolean {
        return this.router.url.startsWith('/admin');
    }
    ngOnInit(): void {
        const savedTheme = localStorage.getItem('mm-theme');
        this.isDark.set(savedTheme
            ? savedTheme === 'dark'
            : window.matchMedia('(prefers-color-scheme: dark)').matches);
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
