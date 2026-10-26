import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { I18nService } from './i18n.service';

/** Az app.routes.ts magyar oldalcímeit az aktuális nyelvre fordítja. */
@Injectable({ providedIn: 'root' })
export class I18nTitleStrategy extends TitleStrategy {
    private readonly title = inject(Title);
    private readonly i18n = inject(I18nService);
    override updateTitle(snapshot: RouterStateSnapshot): void {
        const title = this.buildTitle(snapshot);
        if (title) this.title.setTitle(this.i18n.t(title));
    }
}
