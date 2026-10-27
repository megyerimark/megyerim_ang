import { Component, OnInit, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { TPipe } from '../../i18n/t.pipe';

/** Valódi 404-es oldal: a rossz linkek nem a főoldalra dobnak, és a keresők nem indexelik. */
@Component({
    selector: 'app-not-found',
    standalone: true,
    imports: [RouterLink, TPipe],
    template: `
<main class="container legal not-found">
  <span class="overline">404</span>
  <h1>{{ 'Ez az oldal nem található' | t }}</h1>
  <p>{{ 'Lehet, hogy elírás van a címben, vagy az oldal időközben megszűnt.' | t }}</p>
  <p class="actions">
    <a routerLink="/" class="button">{{ 'Vissza a főoldalra' | t }}</a>
    <a routerLink="/ajanlatkeres" class="back">{{ 'Ajánlatot kérek' | t }}</a>
  </p>
</main>`,
    styleUrl: '../privacy/privacy.scss'
})
export class NotFoundPage implements OnInit {
    private readonly meta = inject(Meta);
    ngOnInit(): void { this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' }); }
}
