import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LEGAL_INFO, missingLegalFields } from '../../core/legal-info';

@Component({
    selector: 'app-privacy',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './privacy.html',
    styleUrl: './privacy.scss'
})
export class PrivacyPage {
    readonly legal = LEGAL_INFO;
    readonly missing = missingLegalFields();
    readonly todo = '[kitöltendő]';
}
