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
        path: 'projekt-kviz',
        loadComponent: () => import('./pages/quiz/quiz').then(module => module.QuizPage),
        title: '2 perces weboldal igényfelmérő | Megyeri Márk Máté'
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
        path: 'impresszum',
        loadComponent: () => import('./pages/imprint/imprint').then(module => module.ImprintPage),
        title: 'Impresszum | Megyeri Márk Máté'
    },
    {
        path: 'aszf',
        loadComponent: () => import('./pages/terms/terms').then(module => module.TermsPage),
        title: 'Általános Szerződési Feltételek | Megyeri Márk Máté'
    },
    {
        path: 'fizetes/sikeres',
        data: { success: true },
        loadComponent: () => import('./pages/payment-result/payment-result').then(module => module.PaymentResultPage),
        title: 'Sikeres fizetés | Megyeri Márk Máté'
    },
    {
        path: 'fizetes/megszakitva',
        data: { success: false },
        loadComponent: () => import('./pages/payment-result/payment-result').then(module => module.PaymentResultPage),
        title: 'Megszakított fizetés | Megyeri Márk Máté'
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
        loadComponent: () => import('./pages/not-found/not-found').then(module => module.NotFoundPage),
        title: 'Az oldal nem található | Megyeri Márk Máté'
    }
];
