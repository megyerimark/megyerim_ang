import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { I18nService } from './i18n.service';
import { PAGE_SEO } from '../core/seo';

/**
 * Az app.routes.ts magyar oldalcímeit az aktuális nyelvre fordítja. A nyilvános oldalak keresőbarát címét
 * (core/seo.ts) és a referenciaoldalak címét az App, illetve a referenciaoldal állítja be – azokat itt nem írjuk felül.
 */
@Injectable({ providedIn: 'root' })
export class I18nTitleStrategy extends TitleStrategy {
    private readonly title = inject(Title);
    private readonly i18n = inject(I18nService);
    override updateTitle(snapshot: RouterStateSnapshot): void {
        const path = snapshot.url.split(/[?#]/)[0];
        if (path in PAGE_SEO[this.i18n.lang()] || path.startsWith('/munkak/')) return;
        const title = this.buildTitle(snapshot);
        if (title) this.title.setTitle(this.i18n.t(title));
    }
}
