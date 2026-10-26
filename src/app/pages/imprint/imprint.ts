import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TPipe } from '../../i18n/t.pipe';
import { I18nService } from '../../i18n/i18n.service';
import { LEGAL_INFO, missingLegalFields } from '../../core/legal-info';

/** Impresszum – az elektronikus kereskedelemről szóló 2001. évi CVIII. törvény (Ekertv.) 4. §-a szerinti adatok. */
@Component({
    selector: 'app-imprint',
    standalone: true,
    imports: [RouterLink, TPipe],
    templateUrl: './imprint.html',
    styleUrl: '../privacy/privacy.scss'
})
export class ImprintPage {
    readonly i18n = inject(I18nService);
    readonly legal = LEGAL_INFO;
    readonly missing = missingLegalFields();
    readonly todo = '[kitöltendő]';
}
