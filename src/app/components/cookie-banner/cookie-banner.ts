import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConsentService } from '../../core/consent.service';
import { TPipe } from '../../i18n/t.pipe';

/** Első látogatáskor megjelenik (és a láblécből bármikor újranyitható). A két gomb egyenrangú (GDPR). */
@Component({
    selector: 'app-cookie-banner',
    standalone: true,
    imports: [RouterLink, TPipe],
    template: `
      @if (visible()) {
        <section class="cookie" role="dialog" aria-labelledby="cookie-title" aria-describedby="cookie-text">
          <strong id="cookie-title">{{ 'Sütik és külső tartalom' | t }}</strong>
          @if (consent.needed()) {
          <p id="cookie-text">{{ 'Az oldal csak a működéshez szükséges sütiket használja. A Google-vélemények megjelenítéséhez egy külső szolgáltató (Trustindex) tartalmát töltenénk be, amely sütit helyezhet el és látja az IP-címedet. Ezt csak a hozzájárulásoddal tesszük.' | t }}
            <a routerLink="/adatkezeles">{{ 'Részletek' | t }}</a></p>
          } @else {
          <p id="cookie-text">{{ 'Az oldal csak a működéshez szükséges sütiket és helyi tárolást használja (nyelv, beállítások, belépés). Követő vagy hirdetési süti nincs.' | t }}
            <a routerLink="/adatkezeles">{{ 'Részletek' | t }}</a></p>
          }
          <div class="cookie-actions">
            <button type="button" class="btn btn-outline" (click)="consent.set('denied')">{{ 'Csak a szükségesek' | t }}</button>
            <button type="button" class="btn btn-primary" (click)="consent.accept()">{{ 'Elfogadom' | t }}</button>
          </div>
        </section>
      }
    `,
    styles: [`
      .cookie{position:fixed;z-index:950;left:16px;right:16px;bottom:16px;max-width:560px;margin-left:auto;padding:18px 20px;border-radius:18px;border:1px solid #ffffff24;background:linear-gradient(150deg,#141c3ef7,#0b1330f7);color:#e9ecff;box-shadow:0 22px 60px #000a;backdrop-filter:blur(18px)}
      .cookie strong{font-size:15px}
      .cookie p{margin:8px 0 14px;font-size:12.5px;line-height:1.6;color:#c7cfea}
      .cookie a{color:#c4b5fd}
      .cookie-actions{display:flex;flex-wrap:wrap;gap:10px}
      .cookie-actions .btn{flex:1 1 180px}
      @media (max-width:600px){.cookie{left:10px;right:10px;bottom:10px;padding:13px 14px;border-radius:14px}.cookie strong{font-size:13.5px}.cookie p{font-size:11.5px;line-height:1.5;margin:5px 0 10px}.cookie-actions{gap:8px;flex-wrap:nowrap}.cookie-actions .btn{flex:1 1 0;min-height:40px;padding:8px 10px;font-size:12px}}
      :host-context([data-theme='light']) .cookie{background:#fffffff5;color:#191e28;border-color:#1d23401f}
      :host-context([data-theme='light']) .cookie p{color:#4a5572}
    `]
})
export class CookieBanner {
    readonly consent = inject(ConsentService);
    readonly visible = computed(() => {
        const state = this.consent.external();
        // Ha később külső tartalom kerül az oldalra, a korábbi tudomásulvétel nem hozzájárulás → újra kérdezünk.
        return state === 'unknown' || (state === 'acknowledged' && this.consent.needed()) || this.consent.panelOpen();
    });
}
