import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';
export const adminGuard: CanActivateFn = () => {
 const auth=inject(AuthService), router=inject(Router);
 return auth.check().pipe(map(ok=>ok?true:router.createUrlTree(['/admin/bejelentkezes'])));
};
