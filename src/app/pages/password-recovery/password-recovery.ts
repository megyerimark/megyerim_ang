import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/api.service';
@Component({
  selector: 'app-password-recovery', standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './password-recovery.html', styleUrl: './password-recovery.scss'
})
export class PasswordRecoveryPage {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly isReset = signal(this.router.url.startsWith('/admin/jelszo-visszaallitas'));
  email = this.route.snapshot.queryParamMap.get('email') ?? '';
  // The secret lives in the URL fragment, never in a webserver-logged query string.
  token = new URLSearchParams(this.route.snapshot.fragment ?? '').get('token') ?? '';
  password = '';
  confirmation = '';
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
    this.busy.set(true);
    const action = this.isReset()
      ? this.api.resetAdminPassword(this.email, this.token, this.password, this.confirmation)
      : this.api.forgotAdminPassword(this.email);
    action.subscribe({
      next: r => { this.busy.set(false); this.success.set(r.message); this.password = ''; this.confirmation = ''; },
      error: (e: HttpErrorResponse) => {
        this.busy.set(false);
        this.error.set(e.status === 429 ? 'Túl sok próbálkozás. Kérlek, próbáld később.'
          : e.status === 422 ? (e.error?.message || 'Az adatok nem megfelelőek, vagy a link lejárt.')
          : 'A művelet nem sikerült. Ellenőrizd a Laravel-kapcsolatot, és próbáld újra.');
      }
    });
  }
}
