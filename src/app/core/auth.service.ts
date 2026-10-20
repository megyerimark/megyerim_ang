import { Injectable, inject, signal } from '@angular/core';
import { catchError, map, of, tap, switchMap } from 'rxjs';
import { ApiService } from './api.service';
import { AdminUser } from './models';
@Injectable({providedIn:'root'})
export class AuthService {
 private api = inject(ApiService);
 readonly user = signal<AdminUser|null>(null);
 check() { return this.api.me().pipe(map(r=>{this.user.set(r.data);return true;}),catchError(()=>{this.user.set(null);return of(false);})); }
 login(email:string,password:string) { return this.api.login(email,password).pipe(switchMap(()=>this.api.me()),tap(r=>this.user.set(r.data))); }
 logout() { return this.api.logout().pipe(tap(()=>this.user.set(null))); }
}
