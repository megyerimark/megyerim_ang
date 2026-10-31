import { Component, computed, effect, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { GUIDE_KEYS, GUIDE_SLUGS, GuideKey, PUBLIC_PAGES } from '../../core/site-routes';
import { SITE_URL } from '../../core/seo';
import { I18nService } from '../../i18n/i18n.service';
import { LpPipe } from '../../i18n/lp.pipe';
import { TPipe } from '../../i18n/t.pipe';
import { SERVICES } from '../service/service-content';
import { GUIDES } from './guide-content';
import { GUIDES_INDEX_SEO } from './guide-seo';



/**
 * Útmutatók: gyűjtőoldal (/utmutatok) és cikkoldal (/utmutatok/<slug>). A szöveg a guide-content.ts-ben van;
 * a build utáni prerender ugyanebből készíti a statikus HTML-t (Article strukturált adattal).
 */
@Component({
    selector: 'app-guide-page',
    standalone: true,
    imports: [RouterLink, TPipe, LpPipe],
    templateUrl: './guide-page.html',
    styleUrls: ['../service/service-page.scss', './guide-page.scss']
})
export class GuidePage {
    readonly i18n = inject(I18nService);
    private readonly route = inject(ActivatedRoute);
    private readonly title = inject(Title);
    private readonly meta = inject(Meta);

    readonly key = toSignal(this.route.data.pipe(map(data => (data['guide'] ?? null) as GuideKey | null)), { initialValue: (this.route.snapshot.data['guide'] ?? null) as GuideKey | null });
    readonly guide = computed(() => { const key = this.key(); return key ? GUIDES[key] : null; });
    readonly all = GUIDE_KEYS.map(key => ({ key, path: '/utmutatok/' + GUIDE_SLUGS[key], ...GUIDES[key] }));
    readonly others = computed(() => this.all.filter(item => item.key !== this.key()).slice(0, 3));
    readonly related = computed(() => {
        const g = this.guide(); if (!g) return null;
        return { path: PUBLIC_PAGES.find(page => page.key === 'service:' + g.related)!.hu, label: SERVICES[g.related].copy.hu.label };
    });
    readonly openFaq = signal<number | null>(0);

    constructor() {
        effect(() => {
            const g = this.guide();
            const key = this.key();
            const seo = g ? { title: g.seoTitle, description: g.seoDescription } : GUIDES_INDEX_SEO;
            this.title.setTitle(seo.title);
            this.meta.updateTag({ name: 'description', content: seo.description });
            this.meta.updateTag({ property: 'og:title', content: seo.title });
            this.meta.updateTag({ property: 'og:description', content: seo.description });
            this.meta.updateTag({ property: 'og:type', content: g ? 'article' : 'website' });
            this.meta.updateTag({ property: 'og:image', content: `${SITE_URL}/og/${key ? 'guide-' + key : 'guides'}-hu.jpg` });
        });
    }

    date(iso: string): string {
        return new Date(iso + 'T12:00:00Z').toLocaleDateString(this.i18n.lang() === 'en' ? 'en-GB' : 'hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    /** Tartalomjegyzék: görgetés a fejezethez (a horgony a router miatt nem a böngészőre van bízva). */
    scrollTo(id: string): void { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    toggleFaq(index: number): void { this.openFaq.set(this.openFaq() === index ? null : index); }
}
