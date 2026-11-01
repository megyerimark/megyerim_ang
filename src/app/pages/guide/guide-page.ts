import { Component, computed, effect, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { GUIDE_KEYS, GuideKey, PUBLIC_PAGES } from '../../core/site-routes';
import { SITE_URL } from '../../core/seo';
import { I18nService } from '../../i18n/i18n.service';
import { LpPipe } from '../../i18n/lp.pipe';
import { TPipe } from '../../i18n/t.pipe';
import { SERVICES } from '../service/service-content';
import { GUIDES } from './guide-content';
import { GUIDES_EN } from './guide-content-en';
import { GUIDES_INDEX_SEO, GUIDES_INDEX_SEO_EN } from './guide-seo';



/**
 * Útmutatók: gyűjtőoldal (/utmutatok, /en/guides) és cikkoldal (/utmutatok/<slug>, /en/guides/<slug>).
 * A szöveg a guide-content.ts-ben (magyar) és a guide-content-en.ts-ben (angol) van;
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
    /** Az oldal nyelve (az URL határozza meg: /en/guides/… → angol). */
    readonly lang = computed(() => this.i18n.lang());
    private readonly content = computed(() => (this.lang() === 'en' ? GUIDES_EN : GUIDES));
    readonly guide = computed(() => { const key = this.key(); return key ? this.content()[key] : null; });
    /** Magyar útvonalak – a sablonban az lp pipe alakítja az aktuális nyelvűre. */
    readonly all = computed(() => GUIDE_KEYS.map(key => ({ key, path: PUBLIC_PAGES.find(page => page.key === 'guide:' + key)!.hu, ...this.content()[key] })));
    readonly others = computed(() => this.all().filter(item => item.key !== this.key()).slice(0, 3));
    readonly related = computed(() => {
        const g = this.guide(); if (!g) return null;
        return { path: PUBLIC_PAGES.find(page => page.key === 'service:' + g.related)!.hu, label: SERVICES[g.related].copy[this.lang()].label };
    });
    readonly openFaq = signal<number | null>(0);

    constructor() {
        effect(() => {
            const g = this.guide();
            const key = this.key();
            const lang = this.lang();
            const seo = g ? { title: g.seoTitle, description: g.seoDescription } : lang === 'en' ? GUIDES_INDEX_SEO_EN : GUIDES_INDEX_SEO;
            this.title.setTitle(seo.title);
            this.meta.updateTag({ name: 'description', content: seo.description });
            this.meta.updateTag({ property: 'og:title', content: seo.title });
            this.meta.updateTag({ property: 'og:description', content: seo.description });
            this.meta.updateTag({ property: 'og:type', content: g ? 'article' : 'website' });
            this.meta.updateTag({ property: 'og:image', content: `${SITE_URL}/og/${key ? 'guide-' + key : 'guides'}-${lang}.jpg` });
        });
    }

    date(iso: string): string {
        return new Date(iso + 'T12:00:00Z').toLocaleDateString(this.i18n.lang() === 'en' ? 'en-GB' : 'hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    /** Tartalomjegyzék: görgetés a fejezethez (a horgony a router miatt nem a böngészőre van bízva). */
    scrollTo(id: string): void { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    toggleFaq(index: number): void { this.openFaq.set(this.openFaq() === index ? null : index); }
}
