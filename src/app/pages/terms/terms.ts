import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../i18n/i18n.service';
import { LEGAL_INFO, missingLegalFields } from '../../core/legal-info';
import { LpPipe } from '../../i18n/lp.pipe';

/**
 * Általános Szerződési Feltételek (webfejlesztési vállalkozási szerződés).
 * A verziószám egyezzen a backend PORTFOLIO_TERMS_VERSION értékével – az elfogadáskor ezt rögzítjük.
 */
@Component({
    selector: 'app-terms',
    standalone: true,
    imports: [LpPipe, RouterLink],
    templateUrl: './terms.html',
    styleUrl: '../privacy/privacy.scss'
})
export class TermsPage {
    readonly i18n = inject(I18nService);
    readonly legal = LEGAL_INFO;
    readonly missing = missingLegalFields();
    readonly todo = '[kitöltendő]';
    readonly todoEn = '[to be completed]';
    readonly version = '2026-11';
}
