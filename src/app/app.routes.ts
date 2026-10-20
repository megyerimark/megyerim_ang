import { Routes } from '@angular/router';
import { adminGuard } from './core/admin.guard';
export const routes: Routes = [
 {path:'',loadComponent:()=>import('./pages/home/home').then(m=>m.Home),title:'Megyeri Márk Máté | Webfejlesztés'},
 {path:'ajanlatkeres',loadComponent:()=>import('./pages/quote/quote').then(m=>m.QuotePage),title:'Ajánlatkérés | Megyeri Márk Máté '},
 {path:'adatkezeles',loadComponent:()=>import('./pages/privacy/privacy').then(m=>m.PrivacyPage),title:'Adatkezelés | Megyeri Márk Máté '},
 {path:'admin/bejelentkezes',loadComponent:()=>import('./pages/login/login').then(m=>m.LoginPage),title:'Admin bejelentkezés'},
 {path:'admin',canActivate:[adminGuard],loadComponent:()=>import('./pages/admin/admin').then(m=>m.AdminPage),title:'Admin | Megyeri Márk Máté '},
 {path:'**',redirectTo:''}
];
