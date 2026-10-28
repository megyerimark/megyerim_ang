import { Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { I18nService } from '../../i18n/i18n.service';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';
import { Turnstile } from '../../components/turnstile/turnstile';
import { SubmitLoaderService } from '../../core/submit-loader.service';
@Component({ selector: 'app-login', standalone: true, imports: [FormsModule, RouterLink, Turnstile], templateUrl: './login.html', styleUrl: './login.scss' })
export class LoginPage implements OnInit {
    readonly i18n = inject(I18nService);
    private auth = inject(AuthService);
    private router = inject(Router);
    private api = inject(ApiService);
    private loader = inject(SubmitLoaderService);
    email = '';
    password = '';
    code = '';
    captchaToken = '';
    private readonly captcha = viewChild(Turnstile);
    needsCode = signal(false);
    /** A második faktor módja: e-mailben kapott kód, vagy hitelesítő alkalmazás (TOTP) / helyreállítási kód. */
    codeMethod = signal<'email' | 'totp'>('email');
    loading = signal(false);
    error = signal('');
    apiState = signal<'checking' | 'online' | 'offline'>('checking');
    ngOnInit() { this.api.publicSettings().subscribe({ next: r => this.apiState.set(r?.data?.site_title ? 'online' : 'offline'), error: () => this.apiState.set('offline') }); }
    submit() {
        this.error.set('');
        if (this.needsCode()) {
            const code = this.code.trim();
            const valid = /^[0-9]{6}$/.test(code) || (this.codeMethod() === 'totp' && /^[A-Za-z0-9]{5}-?[A-Za-z0-9]{5}$/.test(code));
            if (!valid) { this.error.set(this.codeMethod() === 'totp' ? 'Írd be az alkalmazás 6 jegyű kódját vagy egy helyreállítási kódot.' : 'Írd be a hatjegyű ellenőrzőkódot.'); return; }
            this.code = code;
            this.loading.set(true);
            this.loader.start(['Kód ellenőrzése…', 'Biztonságos munkamenet indítása…']);
            this.auth.verifyTwoFactor(this.code).subscribe({
                next: () => { this.loader.succeed('Sikeres belépés!'); this.loading.set(false); this.code = ''; this.router.navigateByUrl('/admin'); },
                error: (e: HttpErrorResponse) => { this.loader.stop(); this.loading.set(false); this.error.set(e.status === 422 ? 'Hibás vagy lejárt ellenőrzőkód.' : 'Nem sikerült az ellenőrzés.'); }
            });
            return;
        }
        if (!this.email || !this.password) {
            this.error.set('Add meg az e-mail-címed és a jelszavad.');
            return;
        }
        if (this.captcha() && !this.captcha()!.ready()) { this.error.set('Várd meg, amíg a robotszűrő ellenőrzése befejeződik.'); return; }
        this.loading.set(true);
        this.loader.start(['Belépési adatok ellenőrzése…', 'Biztonságos munkamenet indítása…']);
        // kétlépcsős belépésnél nincs „siker” – a kódmező jön; különben siker-animáció az admin betöltése fölött
        this.auth.login(this.email, this.password, this.captchaToken).subscribe({ next: method => { this.loading.set(false); this.password = ''; if (method) { this.loader.stop(); this.codeMethod.set(method); this.needsCode.set(true); } else { this.loader.succeed('Sikeres belépés!'); this.router.navigateByUrl('/admin'); } }, error: (e: HttpErrorResponse) => { this.loader.stop(); this.loading.set(false); this.captcha()?.reset(); this.error.set(e.error?.error_code === 'TURNSTILE_FAILED' ? e.error.message : e.status === 401 || e.status === 422 ? 'Hibás bejelentkezési adatok.' : e.status === 429 ? 'Túl sok próbálkozás. Próbáld később.' : 'Nem sikerült csatlakozni a backendhez. Ellenőrizd az SMTP- és Laravel-kapcsolatot.'); } });
    }
    resendCode() { this.api.resendAdminLoginCode().subscribe({ next: r => this.error.set(r.message), error: () => this.error.set('Nem sikerült új kódot küldeni.') }); }
}
