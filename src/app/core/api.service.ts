import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { AdminUser, Activity, Client, Dashboard, Envelope, Paged, Project, Quote, QuotePayload, Service, SiteSettings } from './models';
@Injectable({providedIn:'root'})
export class ApiService {
 private http = inject(HttpClient);
 private opts = {withCredentials: true};
 private params(data: Record<string,string|number|undefined>): HttpParams {
  let p = new HttpParams(); for(const [k,v] of Object.entries(data)) if(v !== undefined && v !== '') p=p.set(k,String(v)); return p;
 }
 // This same-origin proxy and Angular's XSRF interceptor are required for Sanctum session requests.
 csrf(): Observable<unknown> { return this.http.get('/sanctum/csrf-cookie',this.opts); }
 publicSettings() { return this.http.get<Envelope<SiteSettings>>('/api/site-settings',this.opts); }
 publicServices() { return this.http.get<Envelope<Service[]>>('/api/services',this.opts); }
 publicProjects() { return this.http.get<Envelope<Project[]>>('/api/projects',this.opts); }
 sendQuote(data: QuotePayload) { return this.csrf().pipe(switchMap(()=>this.http.post<{message:string;reference:number}>('/api/quote-requests',data,this.opts))); }
 login(email:string,password:string) { return this.csrf().pipe(switchMap(()=>this.http.post<{message:string;user:AdminUser}>('/admin/login',{email,password},this.opts))); }
 logout() { return this.http.post<{message:string}>('/admin/logout',{},this.opts); }
 me() { return this.http.get<Envelope<AdminUser>>('/api/admin/me',this.opts); }
 dashboard() { return this.http.get<Envelope<Dashboard>>('/api/admin/dashboard',this.opts); }
 quotes(q='',status='',page=1) { return this.http.get<Paged<Quote>>('/api/admin/quote-requests',{...this.opts,params:this.params({q,status,page,per_page:15})}); }
 quote(id:number) { return this.http.get<Envelope<Quote>>('/api/admin/quote-requests/'+id,this.opts); }
 saveQuote(id:number, data: Partial<Pick<Quote,'status'|'admin_notes'|'quoted_price_huf'>>) {return this.http.patch<Envelope<Quote>>('/api/admin/quote-requests/'+id,data,this.opts);}
 deleteQuote(id:number) {return this.http.delete('/api/admin/quote-requests/'+id,this.opts);}
 clients(q='',page=1) {return this.http.get<Paged<Client>>('/api/admin/clients',{...this.opts,params:this.params({q,page})});}
 clientQuotes(email:string) {return this.http.get<Paged<Quote>>('/api/admin/clients/quotes',{...this.opts,params:this.params({email})});}
 activities() {return this.http.get<Paged<Activity>>('/api/admin/activities',this.opts);}
 adminServices() {return this.http.get<Envelope<Service[]>>('/api/admin/services',this.opts);}
 saveService(id:number|null, data:Record<string,unknown>) {return id?this.http.patch<Envelope<Service>>('/api/admin/services/'+id,data,this.opts):this.http.post<Envelope<Service>>('/api/admin/services',data,this.opts);}
 deleteService(id:number) {return this.http.delete('/api/admin/services/'+id,this.opts);}
 adminProjects() {return this.http.get<Envelope<Project[]>>('/api/admin/projects',this.opts);}
 saveProject(id:number|null, form:FormData) {
  if(id) form.append('_method','PATCH');
  return this.http.post<Envelope<Project>>('/api/admin/projects'+(id?'/'+id:''),form,this.opts);
 }
 saveProjectJson(id:number|null,data:Record<string,unknown>) {return id?this.http.patch<Envelope<Project>>('/api/admin/projects/'+id,data,this.opts):this.http.post<Envelope<Project>>('/api/admin/projects',data,this.opts);}
 deleteProject(id:number) {return this.http.delete('/api/admin/projects/'+id,this.opts);}
 adminSettings() {return this.http.get<Envelope<SiteSettings>>('/api/admin/site-settings',this.opts);}
 saveSettings(data:SiteSettings) {return this.http.patch<Envelope<SiteSettings>>('/api/admin/site-settings',data,this.opts);}
 changePassword(current_password:string,password:string,password_confirmation:string) {return this.http.put('/api/admin/password',{current_password,password,password_confirmation},this.opts);}
}
