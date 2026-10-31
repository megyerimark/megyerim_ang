import { Component, computed, effect, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { Project } from '../../core/models';
import { PUBLIC_PAGES, SERVICE_KEYS, ServiceKey } from '../../core/site-routes';
import { I18nService } from '../../i18n/i18n.service';
import { LpPipe } from '../../i18n/lp.pipe';
import { TPipe } from '../../i18n/t.pipe';
import { SERVICES } from './service-content';

/**
 * Szolgáltatási céloldal (pl. /weboldal-keszites, /en/website-development). A szöveg a service-content.ts-ben van,
 * nyelvenként; a build utáni prerender ugyanebből készíti a statikus HTML-t a keresőknek.
 */
@Component({
    selector: 'app-service-page',
    standalone: true,
    imports: [RouterLink, TPipe, LpPipe],
    templateUrl: './service-page.html',
    styleUrl: './service-page.scss'
})
export class ServicePage {
    readonly i18n = inject(I18nService);
    private readonly api = inject(ApiService);
    private readonly route = inject(ActivatedRoute);

    readonly key = toSignal(this.route.data.pipe(map(data => data['service'] as ServiceKey)), { initialValue: this.route.snapshot.data['service'] as ServiceKey });
    readonly def = computed(() => SERVICES[this.key()]);
    readonly copy = computed(() => this.def().copy[this.i18n.lang()]);
    /** A többi szolgáltatás (belső linkelés). Az útvonal magyarul, az lp pipe fordítja. */
    readonly others = computed(() => SERVICE_KEYS.filter(key => key !== this.key()).map(key => ({
        key, path: PUBLIC_PAGES.find(page => page.key === 'service:' + key)!.hu, label: SERVICES[key].copy[this.i18n.lang()].label
    })));
    readonly quoteParams = computed(() => this.def().quoteType ? { type: this.def().quoteType } : null);
    readonly openFaq = signal<number | null>(0);
    /** Valós, publikált (nem demó) referenciák – legfeljebb három. */
    readonly projects = signal<Project[]>([]);

    private readonly title = inject(Title);
    private readonly meta = inject(Meta);

    constructor() {
        // Cím és leírás az aktuális nyelven (nyelvváltáskor és szolgáltatásváltáskor is frissül).
        effect(() => {
            const c = this.copy();
            this.title.setTitle(c.seoTitle);
            this.meta.updateTag({ name: 'description', content: c.seoDescription });
            this.meta.updateTag({ property: 'og:title', content: c.seoTitle });
            this.meta.updateTag({ property: 'og:description', content: c.seoDescription });
        });
        this.api.publicProjects().subscribe({
            next: response => this.projects.set((response.data ?? []).filter(p => p.is_published && !p.is_demo).slice(0, 3)),
            error: () => this.projects.set([])
        });
    }

    loc(obj: object, field: string): string { return this.i18n.loc(obj, field); }
    toggleFaq(index: number): void { this.openFaq.set(this.openFaq() === index ? null : index); }
}
