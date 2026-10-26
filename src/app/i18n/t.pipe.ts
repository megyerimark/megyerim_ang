import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from './i18n.service';

/** {{ 'Magyar szöveg' | t }} – nem tiszta pipe, hogy nyelvváltáskor azonnal frissüljön. */
@Pipe({ name: 't', standalone: true, pure: false })
export class TPipe implements PipeTransform {
    private readonly i18n = inject(I18nService);
    transform(value: string | null | undefined): string { return this.i18n.t(value); }
}
