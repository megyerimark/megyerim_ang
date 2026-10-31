import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { ApiService } from '../../core/api.service';
import { apiErrorMessage } from '../../core/http-error';
import { I18nService } from '../../i18n/i18n.service';
import { TPipe } from '../../i18n/t.pipe';
import { LpPipe } from '../../i18n/lp.pipe';

/** /hirlevel/megerosites#kulcs és /hirlevel/leiratkozas#kulcs – a kulcs a # után van, így nem kerül szervernaplóba. */
@Component({
    selector: 'app-newsletter-page',
    standalone: true,
    imports: [LpPipe, RouterLink, TPipe],
    template: `
<main class="container legal newsletter-page">
  <span class="overline">{{ 'HÍRLEVÉL' | t }}</span>
  @switch (state()) {
    @case ('working') { <h1>{{ mode === 'confirm' ? ('Feliratkozás megerősítése…' | t) : ('Leiratkozás…' | t) }}</h1> }
    @case ('ok') {
      <h1>{{ mode === 'confirm' ? ('Köszönöm, sikeresen feliratkoztál!' | t) : ('Sikeresen leiratkoztál.' | t) }}</h1>
      <p>{{ message() }}</p>
      @if (mode === 'confirm' && unsubscribeToken()) {
        <p class="muted">{{ 'Ha meggondolod magad, itt bármikor leiratkozhatsz:' | t }} <a [routerLink]="['/hirlevel/leiratkozas']" [fragment]="unsubscribeToken()!">{{ 'Leiratkozás' | t }}</a></p>
      }
    }
    @case ('error') { <h1>{{ 'Ez a link nem használható' | t }}</h1><p>{{ message() }}</p> }
  }
  <p><a [routerLink]="'/' | lp" class="button">{{ 'Vissza a főoldalra' | t }}</a></p>
</main>`,
    styleUrl: '../privacy/privacy.scss'
})
export class NewsletterPage implements OnInit {
    private readonly api = inject(ApiService);
    private readonly route = inject(ActivatedRoute);
    private readonly meta = inject(Meta);
    private readonly i18n = inject(I18nService);
    readonly mode: 'confirm' | 'unsubscribe' = this.route.snapshot.data['mode'];
    readonly state = signal<'working' | 'ok' | 'error'>('working');
    readonly message = signal('');
    readonly unsubscribeToken = signal<string | null>(null);

    ngOnInit(): void {
        this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
        const token = (typeof location !== 'undefined' ? location.hash : '').replace(/^#/, '');
        if (!/^[a-f0-9]{64}$/.test(token)) { this.fail(this.i18n.t('A link hiányos. Nyisd meg újra az e-mailben kapott linket.')); return; }
        if (typeof history !== 'undefined') history.replaceState(null, '', location.pathname); // a kulcs ne maradjon a címsorban
        const call = this.mode === 'confirm' ? this.api.newsletterConfirm(token) : this.api.newsletterUnsubscribe(token);
        call.subscribe({
            next: (r: { message: string; unsubscribe_token?: string }) => { this.message.set(this.i18n.t(r.message)); this.unsubscribeToken.set(r.unsubscribe_token ?? null); this.state.set('ok'); },
            error: e => this.fail(this.i18n.t(apiErrorMessage(e)))
        });
    }
    private fail(msg: string): void { this.message.set(msg); this.state.set('error'); }
}
