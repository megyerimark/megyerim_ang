import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { Navbar } from './components/navbar/navbar';
@Component({selector:'app-root',standalone:true,imports:[RouterOutlet,Navbar],template:`@if(showNavbar()){<app-navbar/>}<router-outlet/>`})
export class App {
  private router=inject(Router);
  showNavbar=signal(!this.router.url.startsWith('/admin'));
  constructor(){const saved=localStorage.getItem('mm-theme');document.documentElement.setAttribute('data-theme',saved?(saved==='dark'?'dark':'light'):(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'));this.router.events.pipe(filter((e):e is NavigationEnd=>e instanceof NavigationEnd)).subscribe(e=>this.showNavbar.set(!e.urlAfterRedirects.startsWith('/admin')));}
}
