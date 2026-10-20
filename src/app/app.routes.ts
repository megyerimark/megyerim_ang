import { Routes } from '@angular/router';
import { adminGuard } from './core/admin.guard';
export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/home/home').then(module => module.Home),
        title: 'Megyeri Márk Máté | Webfejlesztés'
    },
    {
        path: 'ajanlatkeres',
        loadComponent: () => import('./pages/quote/quote').then(module => module.QuotePage),
        title: 'Ajánlatkérés | Megyeri Márk Máté'
    },
    {
        path: 'adatkezeles',
        loadComponent: () => import('./pages/privacy/privacy').then(module => module.PrivacyPage),
        title: 'Adatkezelés | Megyeri Márk Máté'
    },
    {
        path: 'admin/bejelentkezes',
        loadComponent: () => import('./pages/login/login').then(module => module.LoginPage),
        title: 'Admin bejelentkezés | Megyeri Márk Máté'
    },
    {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/admin/admin').then(module => module.AdminPage),
        title: 'Admin | Megyeri Márk Máté'
    },
    {
        path: '**',
        redirectTo: ''
    }
];
