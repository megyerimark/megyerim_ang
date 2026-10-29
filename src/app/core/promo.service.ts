import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { SiteSettings } from './models';
import { I18nService } from '../i18n/i18n.service';

/**
 * Az aktuális akció egy helyen: a felső sáv, az ajánlatkérő és a kvíz is innen olvassa.
 * A beállításokat egyszer kéri le; hiba esetén a következő load() újrapróbálja.
 */
@Injectable({ providedIn: 'root' })
export class PromoService {
    private readonly api = inject(ApiService);
    private readonly i18n = inject(I18nService);
    private readonly settings = signal<SiteSettings | null>(null);
    private loading = false;
    readonly now = signal(Date.now());

    readonly promo = computed(() => {
        const p = this.settings()?.promo;
        if (!p?.active || p.percent <= 0) return null;
        // Ha az oldal nyitva marad, a lejárt akció ne látsszon tovább.
        if (p.ends_at && new Date(p.ends_at + 'T23:59:59').getTime() <= this.now()) return null;
        return p;
    });
    readonly title = computed(() => this.i18n.loc(this.settings(), 'promo_title'));
    /** Hátralévő idő a lejáratig (nap, óra), vagy null, ha nincs lejárat. */
    readonly remaining = computed(() => {
        const end = this.promo()?.ends_at;
        if (!end) return null;
        const ms = new Date(end + 'T23:59:59').getTime() - this.now();
        return ms > 0 ? { days: Math.floor(ms / 86_400_000), hours: Math.floor(ms / 3_600_000) % 24 } : null;
    });

    constructor() {
        if (typeof window !== 'undefined') setInterval(() => this.now.set(Date.now()), 60_000);
    }

    load(): void {
        if (this.settings() || this.loading) return;
        this.loading = true;
        this.api.publicSettings().subscribe({
            next: r => { this.settings.set(r.data); this.loading = false; },
            error: () => { this.loading = false; }
        });
    }
}
