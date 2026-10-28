import { Component, ElementRef, HostListener, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { TPipe } from '../../i18n/t.pipe';
import { I18nService } from '../../i18n/i18n.service';

interface NavItem { label: string; link: string; fragment?: string; spy?: string; mobileOnly?: boolean; }

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [RouterLink, TPipe],
    templateUrl: './navbar.html',
    styleUrl: './navbar.scss',
    host: { '[class.overlay]': 'onHome' }
})
export class Navbar implements OnInit, OnDestroy {
    readonly i18n = inject(I18nService);
    private readonly router = inject(Router);
    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
    isDark = signal(true);
    menuOpen = signal(false);
    /** Az éppen látható főoldali szekció azonosítója (scroll-spy). */
    activeSection = signal<string>('fooldal');
    /** A főoldal görgetési folyamata 0–1 között (felső vékony sáv). */
    scrollProgress = signal(0);
    compact = signal(false);
    readonly items: NavItem[] = [
        { label: 'Szolgáltatások', link: '/', fragment: 'szolgaltatasok', spy: 'szolgaltatasok' },
        { label: 'Folyamat', link: '/', fragment: 'folyamat', spy: 'folyamat' },
        { label: 'Munkáim', link: '/', fragment: 'munkak', spy: 'munkak', mobileOnly: true },
        { label: 'Weboldaltervező', link: '/tervezo', mobileOnly: true },
        { label: 'Rólam', link: '/', fragment: 'rolam', spy: 'rolam' },
        { label: 'Kapcsolat', link: '/konzultacio' }
    ];
    private observer?: IntersectionObserver;
    private frame = 0;

    constructor() {
        this.router.events.pipe(filter(event => event instanceof NavigationEnd), takeUntilDestroyed())
            .subscribe(() => {
                this.close();
                this.activeSection.set('fooldal');
                // A főoldal szekciói az útvonalváltás után renderelődnek, ezért késleltetve figyeljük őket.
                setTimeout(() => this.observeSections(), 350);
            });
    }

    @HostListener('document:keydown.escape')
    onEscape(): void { this.close(); }

    @HostListener('window:scroll')
    onScroll(): void {
        if (this.frame) return;
        this.frame = window.requestAnimationFrame(() => {
            this.frame = 0;
            const max = document.documentElement.scrollHeight - window.innerHeight;
            this.scrollProgress.set(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
            this.compact.set(window.scrollY > 24);
        });
    }

    get isAdmin(): boolean {
        return this.router.url.startsWith('/admin');
    }

    get onHome(): boolean {
        return this.router.url.split(/[?#]/)[0] === '/';
    }

    ngOnInit(): void {
        const savedTheme = this.readTheme();
        this.isDark.set(savedTheme ? savedTheme === 'dark' : true);
        this.applyTheme();
        this.onScroll();
        setTimeout(() => this.observeSections(), 500);
    }

    ngOnDestroy(): void {
        this.observer?.disconnect();
        if (this.frame) window.cancelAnimationFrame(this.frame);
        document.body.style.removeProperty('overflow');
    }

    isActive(item: NavItem): boolean {
        if (!item.spy) return this.router.url.split(/[?#]/)[0] === item.link;
        return this.onHome && this.activeSection() === item.spy;
    }

    toggleTheme(): void {
        this.isDark.update(value => !value);
        try { localStorage.setItem('mm-theme', this.isDark() ? 'dark' : 'light'); } catch { /* privát módban a tárolás tiltott lehet */ }
        this.applyTheme();
    }

    toggleMenu(): void {
        this.menuOpen.update(value => !value);
        // A menü a menüsor tényleges alja alatt nyíljon (fölötte lehet pl. az akciós sáv).
        if (this.menuOpen()) this.host.nativeElement.style.setProperty('--menu-top', Math.max(0, Math.round(this.host.nativeElement.getBoundingClientRect().bottom)) + 'px');
        // Mobilmenü nyitva: ne görögjön a háttér.
        document.body.style.overflow = this.menuOpen() ? 'hidden' : '';
    }

    close(): void {
        this.menuOpen.set(false);
        document.body.style.removeProperty('overflow');
    }

    private observeSections(): void {
        this.observer?.disconnect();
        if (!this.onHome || !('IntersectionObserver' in window)) return;
        const ids = this.items.map(item => item.spy).filter((id): id is string => !!id);
        const targets = ids.map(id => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
        if (!targets.length) return;
        this.observer = new IntersectionObserver(entries => {
            const visible = entries.filter(entry => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
            if (visible) this.activeSection.set(visible.target.id);
        }, { rootMargin: '-35% 0px -55% 0px', threshold: [0, .1, .4] });
        targets.forEach(target => this.observer!.observe(target));
    }

    private readTheme(): string | null {
        try { return localStorage.getItem('mm-theme'); } catch { return null; }
    }

    private applyTheme(): void {
        document.documentElement.setAttribute('data-theme', this.isDark() ? 'dark' : 'light');
    }
}
