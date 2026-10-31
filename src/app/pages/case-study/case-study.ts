import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { ApiService } from '../../core/api.service';
import { Project } from '../../core/models';
import { TPipe } from '../../i18n/t.pipe';
import { I18nService } from '../../i18n/i18n.service';
import { CASE_PREFIX } from '../../core/site-routes';
import { SITE_URL } from '../../core/seo';

/** Van-e a projektnek kitöltött angol címe és összefoglalója (csak ekkor van önálló angol oldala). */
export const hasEnglishContent = (p: Project) => !!(p.title_en?.trim() && p.summary_en?.trim());
import { LpPipe } from '../../i18n/lp.pipe';

@Component({selector:'app-case-study',standalone:true,imports:[LpPipe, RouterLink, TPipe],templateUrl:'./case-study.html',styleUrl:'./case-study.scss'})
export class CaseStudyPage implements OnInit {
    readonly i18n = inject(I18nService);
    loc(obj: object | null | undefined, field: string): string { return this.i18n.loc(obj, field); }
    private readonly api = inject(ApiService);
    private readonly route = inject(ActivatedRoute);
    private readonly title = inject(Title);
    private readonly meta = inject(Meta);
    project = signal<Project | null>(null);
    loading = signal(true);
    error = signal('');
    device = signal<'desktop'|'mobile'>('desktop');
    ngOnInit(): void {
        const slug = this.route.snapshot.paramMap.get('slug');
        if(!slug || !/^[a-z0-9-]{1,160}$/.test(slug)) {this.loading.set(false);this.error.set('A referencia nem található.');return;}
        this.api.publicProject(slug).subscribe({
            next: result => {
                if(result.data.is_demo || !result.data.is_published){this.error.set('A referencia nem található.');}
                else {
                    this.project.set(result.data);
                }
                this.loading.set(false);
            },
            error:()=>{this.loading.set(false);this.error.set('A referencia nem található vagy átmenetileg nem érhető el.');}
        });
    }
    constructor() {
        // Cím és leírás a Google-nek a projektből, az aktuális nyelven (nyelvváltáskor is frissül).
        effect(() => {
            const p = this.project();
            if (!p) return;
            const title = `${this.loc(p, 'title')} – ${this.i18n.t('Weboldal referencia')} | ${this.i18n.t('Megyeri Márk Máté')}`;
            const summary = this.loc(p, 'summary');
            const description = summary.length > 158 ? summary.slice(0, 157).replace(/\s+\S*$/, '') + '…' : summary;
            this.title.setTitle(title);
            this.meta.updateTag({name:'description',content:description});
            this.meta.updateTag({property:'og:title',content:title});
            this.meta.updateTag({property:'og:description',content:description});
            // Angol szöveg nélküli projekt: nincs önálló angol változata (különben a magyar szöveg duplikátuma lenne),
            // ezért a hreflang-párok helyett a magyar oldal a kanonikus.
            if (!hasEnglishContent(p)) {
                document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach(link => link.remove());
                const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
                if (canonical) canonical.href = SITE_URL + CASE_PREFIX.hu + '/' + p.slug;
            }
        });
    }
}
