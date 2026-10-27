import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { apiErrorMessage } from '../../core/http-error';
import { I18nService } from '../../i18n/i18n.service';
import { TPipe } from '../../i18n/t.pipe';

/** Hírlevél-feliratkozás: e-mail + kifejezett hozzájárulás; a szerver megerősítő e-mailt küld (double opt-in). */
@Component({
    selector: 'app-newsletter-signup',
    standalone: true,
    imports: [FormsModule, RouterLink, TPipe],
    templateUrl: './newsletter-signup.html',
    styleUrl: './newsletter-signup.scss'
})
export class NewsletterSignup {
    readonly source = input('home');
    readonly highlight = input<number>(0);
    private readonly api = inject(ApiService);
    readonly i18n = inject(I18nService);

    email = '';
    consent = false;
    website = ''; // honeypot
    readonly busy = signal(false);
    readonly done = signal<string | null>(null);
    readonly error = signal<string | null>(null);

    submit(): void {
        this.error.set(null);
        const email = this.email.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { this.error.set(this.i18n.t('Adj meg érvényes e-mail-címet.')); return; }
        if (!this.consent) { this.error.set(this.i18n.t('A feliratkozáshoz pipáld be a hozzájárulást.')); return; }
        this.busy.set(true);
        this.api.newsletterSubscribe(email, this.i18n.lang(), this.source(), this.website).subscribe({
            next: r => { this.busy.set(false); this.done.set(this.i18n.t(r.message)); this.email = ''; this.consent = false; },
            error: e => { this.busy.set(false); this.error.set(this.i18n.t(apiErrorMessage(e))); }
        });
    }
}
