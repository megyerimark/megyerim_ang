import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../i18n/i18n.service';
import { LEGAL_INFO, missingLegalFields } from '../../core/legal-info';

@Component({
    selector: 'app-privacy',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './privacy.html',
    styleUrl: './privacy.scss'
})
export class PrivacyPage {
    readonly i18n = inject(I18nService);
    readonly legal = LEGAL_INFO;
    readonly missing = missingLegalFields();
    readonly todo = '[kitöltendő]';
    readonly todoEn = '[to be completed]';
}
