import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TPipe } from '../../i18n/t.pipe';

/** A Stripe fizetési oldaláról visszatérve. A tényleges jóváírás a webhookból történik, nem innen. */
@Component({
    selector: 'app-payment-result',
    standalone: true,
    imports: [RouterLink, TPipe],
    template: `
      <main class="container legal payment-result">
        <span class="overline">{{ 'FIZETÉS' | t }}</span>
        @if (success) {
          <h1>{{ 'Köszönöm, a fizetés sikeres!' | t }}</h1>
          <p>{{ 'A befizetés néhány percen belül megjelenik a projektoldaladon, és e-mailben is visszaigazolást kapsz a Stripe-tól. A számlát külön, e-mailben küldöm.' | t }}</p>
        } @else {
          <h1>{{ 'A fizetés megszakadt' | t }}</h1>
          <p>{{ 'Nem történt terhelés. A projektoldaladon bármikor újrakezdheted, vagy válaszd az átutalást – írj, és elküldöm a díjbekérőt.' | t }}</p>
        }
        <p>{{ 'A projektoldaladat az e-mailben kapott személyes linkkel nyithatod meg újra.' | t }}</p>
        <a class="btn btn-outline" routerLink="/">{{ 'Vissza a főoldalra' | t }}</a>
      </main>
    `,
    styleUrl: '../privacy/privacy.scss'
})
export class PaymentResultPage {
    readonly success = inject(ActivatedRoute).snapshot.data['success'] === true;
}
