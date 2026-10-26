import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LEGAL_INFO, missingLegalFields } from '../../core/legal-info';

/** Impresszum – az elektronikus kereskedelemről szóló 2001. évi CVIII. törvény (Ekertv.) 4. §-a szerinti adatok. */
@Component({
    selector: 'app-imprint',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './imprint.html',
    styleUrl: '../privacy/privacy.scss'
})
export class ImprintPage {
    readonly legal = LEGAL_INFO;
    readonly missing = missingLegalFields();
    readonly todo = '[kitöltendő]';
}
