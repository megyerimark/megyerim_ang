import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from './i18n.service';
import { localizePath } from '../core/site-routes';

/**
 * Belső link az aktuális nyelven: [routerLink]="'/ajanlatkeres' | lp" → angolul /en/request-a-quote.
 * A sablonokban mindig a magyar útvonalat írjuk; a jogi és a privát oldalak útvonala nem változik.
 * Nem tiszta pipe, hogy nyelvváltáskor azonnal frissüljön.
 */
@Pipe({ name: 'lp', standalone: true, pure: false })
export class LpPipe implements PipeTransform {
    private readonly i18n = inject(I18nService);
    transform(path: string): string { return localizePath(path, this.i18n.lang()); }
}
