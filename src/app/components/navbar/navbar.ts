import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
@Component({selector:'app-navbar',standalone:true,imports:[RouterLink],templateUrl:'./navbar.html',styleUrl:'./navbar.scss'})
export class Navbar implements OnInit {
 private router=inject(Router);
 isDark=signal(true); menuOpen=signal(false);
 get isAdmin(){return this.router.url.startsWith('/admin');}
 ngOnInit(){const saved=localStorage.getItem('mm-theme');this.isDark.set(saved?saved==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches);this.apply();}
 toggleTheme(){this.isDark.update(v=>!v);localStorage.setItem('mm-theme',this.isDark()?'dark':'light');this.apply();}
 private apply(){document.documentElement.setAttribute('data-theme',this.isDark()?'dark':'light');}
 close(){this.menuOpen.set(false);}
}
