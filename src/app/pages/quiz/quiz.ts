import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { QuotePayload } from '../../core/models';
import { TPipe } from '../../i18n/t.pipe';
import { I18nService } from '../../i18n/i18n.service';
import { Turnstile } from '../../components/turnstile/turnstile';
import { SubmitLoaderService } from '../../core/submit-loader.service';
import { PromoNote } from '../../components/promo-note/promo-note';

type QuizKey = 'industry' | 'goal' | 'website' | 'solution' | 'timeline';
interface QuizOption { value:string; label:string; detail:string; icon:string; }
interface QuizQuestion { key:QuizKey; eyebrow:string; title:string; hint:string; options:QuizOption[]; }
const option=(value:string,label:string,detail:string,icon='✦'):QuizOption=>({value,label,detail,icon});

@Component({selector:'app-quiz',standalone:true,imports:[FormsModule,RouterLink, TPipe, Turnstile, PromoNote],templateUrl:'./quiz.html',styleUrl:'./quiz.scss'})
export class QuizPage {
    readonly i18n = inject(I18nService);
    private readonly api=inject(ApiService);
    private readonly captcha=viewChild(Turnstile);
    private readonly loader=inject(SubmitLoaderService);
    captchaToken='';
    readonly questions:QuizQuestion[]=[
        {key:'industry',eyebrow:'A VÁLLALKOZÁSOD',title:'Mivel foglalkozol leginkább?',hint:'Így a neked releváns megoldásokra fókuszálhatunk.',options:[
            option('Szolgáltatás','Szolgáltató','Tanácsadás, oktatás, szakmai szolgáltatás'),option('Egészség és szépség','Egészség és szépség','Kozmetika, egészségügy, wellness','✳︎'),
            option('Kereskedelem','Kereskedelem','Üzlet, termékek, értékesítés','◇'),option('Vendéglátás','Vendéglátás','Étterem, szállás, rendezvények','◈'),
            option('Technológia','Technológia','Digitális szolgáltatások','⌘'),option('Más terület','Egyéb terület','Másféle vállalkozás vagy új ötlet','↗︎')]},
        {key:'goal',eyebrow:'AZ ÜZLETI CÉLOD',title:'Mit szeretnél elsősorban elérni?',hint:'Egy jó weboldalnak mindig legyen konkrét feladata.',options:[
            option('Professzionális megjelenés','Professzionális megjelenés','Erősebb márka és első benyomás'),option('Több érdeklődő','Több érdeklődő','Egyszerűbb ajánlatkérés, kapcsolatfelvétel','↗︎'),
            option('Online értékesítés','Online értékesítés','Termékek és szolgáltatások eladása','◇'),option('Hatékonyabb működés','Hatékonyabb működés','Foglalások és adminisztráció','◎')]},
        {key:'website',eyebrow:'A KIINDULÓ HELYZET',title:'Van már weboldalad?',hint:'A kiindulópont segít felmérni a szükséges munkát.',options:[
            option('Még nincs','Még nincs weboldalam','Most kezdeném az online jelenlétet','+'),option('Megújítás','Igen, de megújítanám','Modernebb és átláthatóbb lehetne','↻'),
            option('Csak közösségi oldal','Csak Facebook / Instagram','Saját weboldallal egészíteném ki','◉'),option('Bővítés','Van, de továbbfejleszteném','Új funkciókat szeretnék hozzá','✳︎')]},
        {key:'solution',eyebrow:'A MEGOLDÁS',title:'Milyen weboldalra gondoltál?',hint:'Ha még bizonytalan vagy, a választásban is segítek.',options:[
            option('business','Céges weboldal','Bemutatkozás, szolgáltatások, kapcsolat','▣'),option('landing','Landing oldal','Egy ajánlat vagy kampány köré épül','↗︎'),
            option('webshop','Webáruház','Termékek, kosár és online értékesítés','◇'),option('custom','Egyedi webes rendszer','Adminfelület, speciális funkciók','⌘'),
            option('undecided','Még nem tudom','A céljaimhoz keresek megoldást','?')]},
        {key:'timeline',eyebrow:'AZ IDŐZÍTÉS',title:'Mikor szeretnéd elindítani?',hint:'A vállalható határidőt később egyeztetjük.',options:[
            option('Minél hamarabb','Minél hamarabb','Már most aktuális a projekt','↗︎'),option('1–3 hónapon belül','1–3 hónapon belül','Van idő átgondolni a részleteket','◷'),
            option('3–6 hónapon belül','3–6 hónapon belül','Előre tervezek','◇'),option('Még tervezem','Még csak tervezem','Előbb látnám a lehetőségeket','◎')]}
    ];
    readonly step=signal(0);
    readonly answers=signal<Partial<Record<QuizKey,string>>>({});
    readonly sending=signal(false);
    readonly sent=signal<number|null>(null);
    readonly sentPromo=signal<number|null>(null);
    readonly error=signal('');
    readonly validationErrors=signal<Record<string,string[]>>({});
    readonly current=computed(()=>this.questions[this.step()]??null);
    readonly recommendation=computed(()=>{
        const choice=this.answers().solution;
        if(choice && choice!=='undecided') return this.questions[3].options.find(o=>o.value===choice)?.label??'Egyedi weboldal';
        switch(this.answers().goal){case 'Online értékesítés':return 'Webáruház';case 'Hatékonyabb működés':return 'Egyedi webes rendszer';case 'Több érdeklődő':return 'Landing oldal';default:return 'Céges weboldal';}
    });
    readonly contact={customer_name:'',email:'',phone:'',company_name:'',note:'',privacy_notice_acknowledged:false,website:''};
    choose(key:QuizKey,value:string){this.answers.update(a=>({...a,[key]:value}));this.error.set('');}
    answerLabel(key:QuizKey){const val=this.answers()[key];return this.questions.find(q=>q.key===key)?.options.find(o=>o.value===val)?.label??'';}
    next(){const q=this.current();if(q&&!this.answers()[q.key]){this.error.set('Válassz egy lehetőséget.');return;}this.error.set('');this.step.update(s=>Math.min(this.questions.length,s+1));window.scrollTo({top:0,behavior:'smooth'});}
    back(){this.error.set('');this.step.update(s=>Math.max(0,s-1));window.scrollTo({top:0,behavior:'smooth'});}
    private websiteType(){const selected=this.answers().solution;if(selected&&['landing','business','webshop','custom'].includes(selected))return selected;return this.answers().goal==='Online értékesítés'?'webshop':this.answers().goal==='Hatékonyabb működés'?'custom':this.answers().goal==='Több érdeklődő'?'landing':'business';}
    private description(){const lines=['AURORA KVÍZ – IGÉNYFELMÉRÉS',`Vállalkozás területe: ${this.answerLabel('industry')}`,`Legfontosabb cél: ${this.answerLabel('goal')}`,`Jelenlegi weboldal: ${this.answerLabel('website')}`,`Kért megoldás: ${this.answerLabel('solution')}`,`Tervezett indulás: ${this.answerLabel('timeline')}`,`Javasolt kiindulópont: ${this.recommendation()}`];if(this.contact.note.trim())lines.push(`További részletek: ${this.contact.note.trim().slice(0,1500)}`);return lines.join('\n').slice(0,5000);}
    submit(){
        if(this.sending()||this.sent()!==null)return;
        this.error.set('');this.validationErrors.set({});
        if(this.questions.some(q=>!this.answers()[q.key])){this.error.set('Előbb válaszold meg a kvíz kérdéseit.');return;}
        if(!this.contact.customer_name.trim()||!/^\S+@\S+\.\S+$/.test(this.contact.email.trim())){this.error.set('Add meg a neved és egy érvényes e-mail-címet.');return;}
        if(!this.contact.privacy_notice_acknowledged){this.error.set('Az adatkezelési tájékoztató elfogadása szükséges.');return;}
        if(this.captcha()&&!this.captcha()!.ready()){this.error.set('Várd meg, amíg a robotszűrő ellenőrzése befejeződik.');return;}
        const payload:QuotePayload={customer_name:this.contact.customer_name.trim(),email:this.contact.email.trim(),phone:this.contact.phone.trim(),company_name:this.contact.company_name.trim(),website_type:this.websiteType(),design_style:'undecided',industry:this.answers().industry||null,layout_style:null,font_style:null,colors:[],features:[],inspiration_urls:[],budget_range:'',desired_deadline:null,project_description:this.description(),wants_maintenance:false,consultation_preference:'email',privacy_notice_acknowledged:true,website:this.contact.website,turnstile_token:this.captchaToken};
        this.sending.set(true);this.loader.start(['Válaszok feldolgozása…','Ajánlatkérés rögzítése…','Visszaigazolás előkészítése…']);
        this.api.sendQuote(payload).subscribe({next:r=>{this.sentPromo.set(r.promo_percent??null);this.sent.set(r.reference);this.sending.set(false);this.loader.succeed('Ajánlatkérés elküldve!');window.scrollTo({top:0,behavior:'smooth'});},error:(e:HttpErrorResponse)=>{
            this.sending.set(false);this.loader.stop();this.captcha()?.reset();
            if(e.error?.error_code==='TURNSTILE_FAILED')this.error.set(e.error.message);
            else if(e.status===422){this.validationErrors.set(e.error?.errors||{});this.error.set('Kérlek, ellenőrizd a megadott adatokat.');}
            else if(e.status===429)this.error.set('Túl sok kérés érkezett. Próbáld újra később.');
            else if(e.status===419)this.error.set('Lejárt a munkamenet. Frissítsd az oldalt, majd próbáld újra.');
            else this.error.set('Az ajánlatkérést most nem sikerült elküldeni. Ellenőrizd a szerverkapcsolatot.');
        }});
    }
}
