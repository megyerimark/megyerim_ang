import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';
@Component({ selector: 'app-login', standalone: true, imports: [FormsModule, RouterLink], templateUrl: './login.html', styleUrl: './login.scss' })
export class LoginPage implements OnInit {
    private auth = inject(AuthService);
    private router = inject(Router);
    private api = inject(ApiService);
    email = '';
    password = '';
    code = '';
    needsCode = signal(false);
    loading = signal(false);
    error = signal('');
    apiState = signal<'checking' | 'online' | 'offline'>('checking');
    ngOnInit() { this.api.publicSettings().subscribe({ next: r => this.apiState.set(r?.data?.site_title ? 'online' : 'offline'), error: () => this.apiState.set('offline') }); }
    submit() {
        this.error.set('');
        if (this.needsCode()) {
            if (!/^[0-9]{6}$/.test(this.code)) { this.error.set('Írd be a hatjegyű ellenőrzőkódot.'); return; }
            this.loading.set(true);
            this.auth.verifyTwoFactor(this.code).subscribe({
                next: () => { this.loading.set(false); this.code = ''; this.router.navigateByUrl('/admin'); },
                error: (e: HttpErrorResponse) => { this.loading.set(false); this.error.set(e.status === 422 ? 'Hibás vagy lejárt ellenőrzőkód.' : 'Nem sikerült az ellenőrzés.'); }
            });
            return;
        }
        if (!this.email || !this.password) {
            this.error.set('Add meg az e-mail-címed és a jelszavad.');
            return;
        }
        this.loading.set(true);
        this.auth.login(this.email, this.password).subscribe({ next: requiresCode => { this.loading.set(false); this.password = ''; if (requiresCode) this.needsCode.set(true); else this.router.navigateByUrl('/admin'); }, error: (e: HttpErrorResponse) => { this.loading.set(false); this.error.set(e.status === 401 || e.status === 422 ? 'Hibás bejelentkezési adatok.' : e.status === 429 ? 'Túl sok próbálkozás. Próbáld később.' : 'Nem sikerült csatlakozni a backendhez. Ellenőrizd az SMTP- és Laravel-kapcsolatot.'); } });
    }
    resendCode() { this.api.resendAdminLoginCode().subscribe({ next: r => this.error.set(r.message), error: () => this.error.set('Nem sikerült új kódot küldeni.') }); }
}
