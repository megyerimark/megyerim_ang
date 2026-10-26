import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { ApiService } from '../../core/api.service';
import { Project } from '../../core/models';
import { TPipe } from '../../i18n/t.pipe';
import { I18nService } from '../../i18n/i18n.service';

@Component({selector:'app-case-study',standalone:true,imports:[RouterLink, TPipe],templateUrl:'./case-study.html',styleUrl:'./case-study.scss'})
export class CaseStudyPage implements OnInit, OnDestroy {
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
                    this.title.setTitle(`${result.data.title} – Referencia | Megyeri Márk Máté`);
                    this.meta.updateTag({name:'description',content:result.data.summary.slice(0,160)});
                }
                this.loading.set(false);
            },
            error:()=>{this.loading.set(false);this.error.set('A referencia nem található vagy átmenetileg nem érhető el.');}
        });
    }
    ngOnDestroy(): void {this.title.setTitle('Megyeri Márk Máté | Webfejlesztés');}
}
