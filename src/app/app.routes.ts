import { Routes } from '@angular/router';
import { adminGuard } from './core/admin.guard';
export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/home/home').then(module => module.Home),
        title: 'Ne csak jelen legyél online. Emelkedj ki. | Megyeri Márk Máté'
    },
    {
        path: 'tervezo',
        loadComponent: () => import('./pages/studio/studio').then(module => module.StudioPage),
        title: 'Interaktív weboldaltervező | Megyeri Márk Máté'
    },
    {
        path: 'ajanlatkeres',
        loadComponent: () => import('./pages/quote/quote').then(module => module.QuotePage),
        title: 'Ajánlatkérés | Megyeri Márk Máté'
    },
    {
        path: 'munkak/:slug',
        loadComponent: () => import('./pages/case-study/case-study').then(module => module.CaseStudyPage),
        title: 'Referenciák | Megyeri Márk Máté'
    },
    {
        path: 'konzultacio',
        loadComponent: () => import('./pages/consultation/consultation').then(module => module.ConsultationPage),
        title: 'Konzultációfoglalás | Megyeri Márk Máté'
    },
    {
        path: 'ugyfel/projekt',
        loadComponent: () => import('./pages/client-project/client-project').then(module => module.ClientProjectPage),
        title: 'Privát ajánlatkövetés | Megyeri Márk Máté'
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
        path: 'admin/elfelejtett-jelszo',
        loadComponent: () => import('./pages/password-recovery/password-recovery').then(m => m.PasswordRecoveryPage),
        title: 'Elfelejtett adminjelszó | Megyeri Márk Máté'
    },
    {
        path: 'admin/jelszo-visszaallitas',
        loadComponent: () => import('./pages/password-recovery/password-recovery').then(m => m.PasswordRecoveryPage),
        title: 'Admin jelszó-visszaállítás | Megyeri Márk Máté'
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
