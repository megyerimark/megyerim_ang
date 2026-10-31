import { Route, Routes } from '@angular/router';
import { adminGuard } from './core/admin.guard';
import { Home } from './pages/home/home';
import { GUIDE_KEYS, GUIDE_SLUGS, PUBLIC_PAGES, SERVICE_KEYS } from './core/site-routes';

/**
 * A nyilvános oldalak magyarul a gyökérben, angolul az /en/ alatt érhetők el (a címpárok: core/site-routes.ts).
 * Új nyilvános oldalnál a site-routes.ts-t, a .htaccess útvonallistáját és a backend oldaltérképét is bővítsd.
 */
const loadStudio = () => import('./pages/studio/studio').then(module => module.StudioPage);
const loadQuote = () => import('./pages/quote/quote').then(module => module.QuotePage);
const loadQuiz = () => import('./pages/quiz/quiz').then(module => module.QuizPage);
const loadCaseStudy = () => import('./pages/case-study/case-study').then(module => module.CaseStudyPage);
const loadConsultation = () => import('./pages/consultation/consultation').then(module => module.ConsultationPage);
const loadPrivacy = () => import('./pages/privacy/privacy').then(module => module.PrivacyPage);
const loadImprint = () => import('./pages/imprint/imprint').then(module => module.ImprintPage);
const loadTerms = () => import('./pages/terms/terms').then(module => module.TermsPage);
const loadService = () => import('./pages/service/service-page').then(module => module.ServicePage);
const loadGuide = () => import('./pages/guide/guide-page').then(module => module.GuidePage);

/** Útmutatók (csak magyarul): gyűjtőoldal + cikkek. */
const guideRoutes: Route[] = [
    { path: 'utmutatok', loadComponent: loadGuide, data: { guide: null } },
    ...GUIDE_KEYS.map(key => ({ path: 'utmutatok/' + GUIDE_SLUGS[key], loadComponent: loadGuide, data: { guide: key } })),
];

/** A szolgáltatási céloldalak útvonalai a site-routes.ts címpárjaiból (egy helyen kell őket karbantartani). */
const serviceRoutes = (lang: 'hu' | 'en'): Route[] => SERVICE_KEYS.map(key => {
    const page = PUBLIC_PAGES.find(p => p.key === 'service:' + key)!;
    return { path: (lang === 'hu' ? page.hu : page.en!).replace(/^\/(en\/)?/, ''), loadComponent: loadService, data: { service: key } };
});

/** Az angol nyilvános oldalak (az /en előtag alatt). */
const englishRoutes: Routes = [
    { path: '', component: Home, title: 'Ne csak jelen legyél online. Emelkedj ki. | Megyeri Márk Máté' },
    ...serviceRoutes('en'),
    { path: 'website-planner', loadComponent: loadStudio, title: 'Interaktív weboldaltervező | Megyeri Márk Máté' },
    { path: 'request-a-quote', loadComponent: loadQuote, title: 'Ajánlatkérés | Megyeri Márk Máté' },
    { path: 'project-quiz', loadComponent: loadQuiz, title: '2 perces weboldal igényfelmérő | Megyeri Márk Máté' },
    { path: 'work/:slug', loadComponent: loadCaseStudy, title: 'Referenciák | Megyeri Márk Máté' },
    { path: 'consultation', loadComponent: loadConsultation, title: 'Konzultációfoglalás | Megyeri Márk Máté' },
    { path: 'privacy-policy', loadComponent: loadPrivacy, title: 'Adatkezelés | Megyeri Márk Máté' },
    { path: 'legal-notice', loadComponent: loadImprint, title: 'Impresszum | Megyeri Márk Máté' },
    { path: 'terms', loadComponent: loadTerms, title: 'Általános Szerződési Feltételek | Megyeri Márk Máté' },
];

export const routes: Routes = [
    {
        path: '',
        // a főoldal a fő csomagban van: egy hálózati körrel hamarabb jelenik meg az első képernyő (LCP)
        component: Home,
        title: 'Ne csak jelen legyél online. Emelkedj ki. | Megyeri Márk Máté'
    },
    { path: 'en', children: englishRoutes },
    ...serviceRoutes('hu'),
    ...guideRoutes,
    { path: 'tervezo', loadComponent: loadStudio, title: 'Interaktív weboldaltervező | Megyeri Márk Máté' },
    { path: 'ajanlatkeres', loadComponent: loadQuote, title: 'Ajánlatkérés | Megyeri Márk Máté' },
    { path: 'projekt-kviz', loadComponent: loadQuiz, title: '2 perces weboldal igényfelmérő | Megyeri Márk Máté' },
    { path: 'munkak/:slug', loadComponent: loadCaseStudy, title: 'Referenciák | Megyeri Márk Máté' },
    { path: 'konzultacio', loadComponent: loadConsultation, title: 'Konzultációfoglalás | Megyeri Márk Máté' },
    {
        path: 'adatkezeles',
        loadComponent: loadPrivacy,
        title: 'Adatkezelés | Megyeri Márk Máté'
    },
    {
        path: 'impresszum',
        loadComponent: loadImprint,
        title: 'Impresszum | Megyeri Márk Máté'
    },
    {
        path: 'aszf',
        loadComponent: loadTerms,
        title: 'Általános Szerződési Feltételek | Megyeri Márk Máté'
    },
    {
        path: 'ugyfel/projekt',
        loadComponent: () => import('./pages/client-project/client-project').then(module => module.ClientProjectPage),
        title: 'Privát ajánlatkövetés | Megyeri Márk Máté'
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
        path: 'hirlevel/megerosites',
        loadComponent: () => import('./pages/newsletter/newsletter-page').then(module => module.NewsletterPage),
        data: { mode: 'confirm' },
        title: 'Hírlevél | Megyeri Márk Máté'
    },
    {
        path: 'hirlevel/leiratkozas',
        loadComponent: () => import('./pages/newsletter/newsletter-page').then(module => module.NewsletterPage),
        data: { mode: 'unsubscribe' },
        title: 'Hírlevél | Megyeri Márk Máté'
    },
    {
        path: '**',
        loadComponent: () => import('./pages/not-found/not-found').then(module => module.NotFoundPage),
        title: 'Az oldal nem található | Megyeri Márk Máté'
    }
];
