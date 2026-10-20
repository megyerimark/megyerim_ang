import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Hero } from '../../components/hero/hero';
import { ApiService } from '../../core/api.service';
import { Project, Service, SiteSettings, SITE_DEFAULTS } from '../../core/models';
@Component({selector:'app-home',standalone:true,imports:[Hero,RouterLink],templateUrl:'./home.html',styleUrl:'./home.scss'})
export class Home implements OnInit {
 private api=inject(ApiService);
 settings=signal<SiteSettings>(SITE_DEFAULTS);
 services=signal<Service[]>([]); projects=signal<Project[]>([]);
 servicesUnavailable=signal(false);projectsUnavailable=signal(false);settingsUnavailable=signal(false);
 year=new Date().getFullYear();
 faqs=[{q:'Mennyi idő alatt készül el egy weboldal?',a:'A pontos időtartam a funkcióktól és a rendelkezésre álló tartalmaktól függ. Az ajánlatkérés után egyeztetjük az ütemezést.'},{q:'Lehet később módosítani az oldalt?',a:'Igen. Kérhetsz utólagos módosításokat, vagy külön karbantartási megállapodást is köthetünk.'},{q:'Van lehetőség egyedi webes rendszerre?',a:'Igen, az egyszerű bemutatkozó oldalaktól az adminfelülettel rendelkező webes rendszerekig lehet ajánlatot kérni.'}];
 openFaq=signal<number|null>(0);
 ngOnInit(){this.api.publicSettings().subscribe({next:r=>this.settings.set({...SITE_DEFAULTS,...r.data}),error:()=>this.settingsUnavailable.set(true)});this.api.publicServices().subscribe({next:r=>this.services.set(r.data),error:()=>this.servicesUnavailable.set(true)});this.api.publicProjects().subscribe({next:r=>this.projects.set(r.data),error:()=>this.projectsUnavailable.set(true)});}
 money(n:number|null){return n===null?'Egyedi ajánlat':new Intl.NumberFormat('hu-HU').format(n)+' Ft-tól';}
}
