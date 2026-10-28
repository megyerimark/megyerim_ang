import { Component, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/api.service';
import { Turnstile } from '../../components/turnstile/turnstile';
import { SubmitLoaderService } from '../../core/submit-loader.service';
@Component({
  selector: 'app-password-recovery', standalone: true,
  imports: [FormsModule, RouterLink, Turnstile],
  templateUrl: './password-recovery.html', styleUrl: './password-recovery.scss'
})
export class PasswordRecoveryPage {
  private api = inject(ApiService);
  private loader = inject(SubmitLoaderService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly isReset = signal(this.router.url.startsWith('/admin/jelszo-visszaallitas'));
  email = this.route.snapshot.queryParamMap.get('email') ?? '';
  // The secret lives in the URL fragment, never in a webserver-logged query string.
  token = new URLSearchParams(this.route.snapshot.fragment ?? '').get('token') ?? '';
  password = '';
  confirmation = '';
  captchaToken = '';
  private readonly captcha = viewChild(Turnstile);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  submit(): void {
    if (this.busy()) return;
    this.error.set(''); this.success.set('');
    if (this.isReset() && (!this.token || this.password.length < 12 || this.password !== this.confirmation)) {
      this.error.set('Legalább 12 karakteres, egyező jelszavakat adj meg. Ha nincs token, kérj új linket.');
      return;
    }
    if (!this.isReset() && this.captcha() && !this.captcha()!.ready()) {
      this.error.set('Várd meg, amíg a robotszűrő ellenőrzése befejeződik.');
      return;
    }
    this.busy.set(true);
    this.loader.start(this.isReset() ? ['Új jelszó mentése…', 'Munkamenetek frissítése…'] : ['Kérés feldolgozása…', 'Visszaállító e-mail előkészítése…']);
    const action = this.isReset()
      ? this.api.resetAdminPassword(this.email, this.token, this.password, this.confirmation)
      : this.api.forgotAdminPassword(this.email, this.captchaToken);
    action.subscribe({
      next: r => { this.loader.succeed(this.isReset() ? 'Jelszó módosítva!' : 'Kérés elküldve!'); this.busy.set(false); this.captcha()?.reset(); this.success.set(r.message); this.password = ''; this.confirmation = ''; },
      error: (e: HttpErrorResponse) => {
        this.loader.stop();
        this.busy.set(false);
        this.captcha()?.reset();
        this.error.set(e.status === 429 ? 'Túl sok próbálkozás. Kérlek, próbáld később.'
          : e.status === 422 ? (e.error?.message || 'Az adatok nem megfelelőek, vagy a link lejárt.')
          : 'A művelet nem sikerült. Ellenőrizd a Laravel-kapcsolatot, és próbáld újra.');
      }
    });
  }
}
