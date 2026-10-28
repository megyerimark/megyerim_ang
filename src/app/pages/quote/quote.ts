import { Component, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/api.service';
import { QuotePayload } from '../../core/models';
import { TPipe } from '../../i18n/t.pipe';
import { I18nService } from '../../i18n/i18n.service';
import { Turnstile } from '../../components/turnstile/turnstile';
@Component({ selector: 'app-quote', standalone: true, imports: [FormsModule, RouterLink, TPipe, Turnstile], templateUrl: './quote.html', styleUrl: './quote.scss' })
export class QuotePage {
    readonly i18n = inject(I18nService);
    private api = inject(ApiService);
    private route = inject(ActivatedRoute);
    step = signal(1);
    sending = signal(false);
    sent = signal<number | null>(null);
    generalError = signal('');
    errors = signal<Record<string, string[]>>({});
    websiteTypes = [{ v: 'landing', title: 'Landing oldal', desc: 'Egyoldalas, fókuszált weboldal', icon: '↗︎' }, { v: 'business', title: 'Céges weboldal', desc: 'Teljes üzleti online jelenlét', icon: '▣' }, { v: 'webshop', title: 'Webshop', desc: 'Online termékértékesítés', icon: '◇' }, { v: 'custom', title: 'Egyedi rendszer', desc: 'Speciális funkciók, adminfelület', icon: '⌘' }];
    styles = [{ v: 'dark-premium', title: 'Dark Premium', desc: 'Sötét, karakteres és exkluzív', css: 'dark' }, { v: 'elegant-minimal', title: 'Elegant Minimal', desc: 'Világos, időtálló, letisztult', css: 'minimal' }, { v: 'modern-creative', title: 'Modern Creative', desc: 'Merészebb színek, kreatív ritmus', css: 'creative' }, { v: 'mixed', title: 'Egyedi kombináció', desc: 'A stílusokat együtt alakítjuk ki', css: 'mixed' }, { v: 'undecided', title: 'Még nem tudom', desc: 'Segíts a megfelelő irány megtalálásában', css: 'neutral' }];
    palette = ['#8259ee', '#4fc6e9', '#0a1530', '#F6F4ED', '#F0B08F', '#75C0A5', '#FF6583', '#F4D35E'];
    featureOptions = ['Kapcsolatfelvételi űrlap', 'Időpontfoglalás', 'Adminfelület', 'Blog / hírek', 'Többnyelvűség', 'Online fizetés', 'Keresőoptimalizálás', 'Animációk / 3D', 'Hírlevél', 'Ügyfélfiók'];
    budgets = [{ v: '', l: 'Még nem tudom' }, { v: '50000-150000', l: '50 – 150 ezer Ft' }, { v: '150000-300000', l: '150 – 300 ezer Ft' }, { v: '300000-600000', l: '300 – 600 ezer Ft' }, { v: '600000+', l: '600 ezer Ft felett' }];
    data: QuotePayload = { customer_name: '', email: '', phone: '', company_name: '', website_type: '', design_style: '', industry: null, layout_style: null, font_style: null, colors: [], features: [], inspiration_urls: [], budget_range: '', desired_deadline: null, project_description: '', wants_maintenance: false, consultation_preference: 'email', privacy_notice_acknowledged: false, website: '', turnstile_token: '' };
    private readonly captcha = viewChild(Turnstile);
    inspiration = '';
    constructor() {
        const type = this.route.snapshot.queryParamMap.get('type');
        if (type && ['landing', 'business', 'webshop', 'custom'].includes(type))
            this.data.website_type = type;
        // Only the existing homepage configurator's whitelisted choices are imported.
        if (this.route.snapshot.queryParamMap.get('from') === 'studio') {
            const saved = sessionStorage.getItem('mm-studio-brief');
            if (saved) {
                sessionStorage.removeItem('mm-studio-brief');
                try {
                    const brief = JSON.parse(saved) as { brand?: unknown; headline?: unknown };
                    if (typeof brief.brand === 'string') this.data.company_name = brief.brand.slice(0, 150);
                    if (typeof brief.headline === 'string' && brief.headline.trim()) this.data.project_description = `A tervezőben választott főcím: ${brief.headline.slice(0, 120)}. A részletek: `;
                } catch { /* An invalid session draft must never block quote requests. */ }
            }
            const params = this.route.snapshot.queryParamMap;
            const goalMap: Record<string,string> = { business:'business', booking:'business', shop:'webshop', system:'custom' };
            const toneMap: Record<string,string> = { midnight:'dark-premium', linen:'elegant-minimal', electric:'modern-creative', forest:'dark-premium' };
            const colorMap: Record<string,string[]> = {midnight:['#10111f','#7858eb','#f8f7ff'],linen:['#f7f4ee','#a46a4a','#22201c'],electric:['#0a1831','#2cd6c4','#f5fbff'],forest:['#0d211b','#accb82','#f6f4e9']};
            const goal = params.get('goal') || ''; const tone = params.get('tone') || '';
            if(goalMap[goal]) this.data.website_type = goalMap[goal];
            if(toneMap[tone]) this.data.design_style = toneMap[tone];
            if(colorMap[tone]) this.data.colors = [...colorMap[tone]];
            const rawFeatures = (params.get('features') || '').split('|');
            this.data.features = [...new Set(rawFeatures.filter(item => this.featureOptions.includes(item)))];
            if(goal === 'booking' && !this.data.features.includes('Időpontfoglalás')) this.data.features.push('Időpontfoglalás');
            const industry = params.get('industry') || '';
            const allowedIndustries = ['Szolgáltatás','Egészség és szépség','Vendéglátás','Technológia','Kereskedelem','Más terület'];
            const layout = params.get('layout') || '';
            const font = params.get('font') || '';
            this.data.industry = allowedIndustries.includes(industry) ? industry : null;
            this.data.layout_style = ['editorial','split','centered'].includes(layout) ? layout : null;
            this.data.font_style = ['modern','elegant'].includes(font) ? font : null;
        }
        if (this.route.snapshot.queryParamMap.get('from') === 'tervezo') {
            const purpose = this.route.snapshot.queryParamMap.get('purpose');
            const style = this.route.snapshot.queryParamMap.get('style');
            const typeMap: Record<string, string> = { business: 'business', booking: 'business', system: 'custom' };
            const styleMap: Record<string, string> = { graphite: 'dark-premium', ivory: 'elegant-minimal', ocean: 'modern-creative' };
            if (purpose && typeMap[purpose]) this.data.website_type = typeMap[purpose];
            if (style && styleMap[style]) this.data.design_style = styleMap[style];
            if (purpose === 'booking') this.data.features.push('Időpontfoglalás');
        }
    }
    minDate() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
    toggle(list: 'colors' | 'features', value: string) { const a = this.data[list]; this.data[list] = a.includes(value) ? a.filter(v => v !== value) : [...a, value]; }
    next() {
        this.generalError.set('');
        if (this.step() === 1 && !this.data.website_type) {
            this.generalError.set('Válaszd ki a weboldal típusát.');
            return;
        }
        if (this.step() === 3 && this.data.project_description.trim().length < 10) {
            this.generalError.set('Írj legalább 10 karaktert a projektedről.');
            return;
        }
        if (this.step() < 4) {
            this.step.update(v => v + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
    back() { this.generalError.set(''); this.step.update(v => Math.max(1, v - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    submit() {
        this.generalError.set('');
        this.errors.set({});
        if (!this.data.customer_name.trim() || !/^\S+@\S+\.\S+$/.test(this.data.email)) {
            this.generalError.set('Add meg a nevedet és egy érvényes e-mail-címet.');
            return;
        }
        if (!this.data.privacy_notice_acknowledged) {
            this.generalError.set('Az adatkezelési tájékoztató tudomásul vétele szükséges.');
            return;
        }
        const urls = this.inspiration.split(/[\n,]+/).map(x => x.trim()).filter(Boolean);
        if (urls.length > 5 || urls.some(u => !/^https?:\/\//i.test(u))) {
            this.generalError.set('Legfeljebb öt teljes http(s) inspirációs linket adj meg.');
            return;
        }
        if (this.captcha() && !this.captcha()!.ready()) {
            this.generalError.set('Várd meg, amíg a robotszűrő ellenőrzése befejeződik.');
            return;
        }
        this.sending.set(true);
        this.api.sendQuote({ ...this.data, inspiration_urls: urls, desired_deadline: this.data.desired_deadline || null }).subscribe({ next: r => { this.sent.set(r.reference); this.sending.set(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }, error: (e: HttpErrorResponse) => {
                this.sending.set(false);
                this.captcha()?.reset();
                if (e.error?.error_code === 'TURNSTILE_FAILED') {
                    this.generalError.set(e.error.message);
                }
                else if (e.status === 422) {
                    this.errors.set(e.error?.errors || {});
                    this.generalError.set('Ellenőrizd a megadott adatokat.');
                }
                else if (e.status === 429) {
                    this.generalError.set('Túl sok ajánlatkérés érkezett. Kérlek, próbáld később.');
                }
                else if (e.status === 419) {
                    this.generalError.set('A munkamenet lejárt. Frissítsd az oldalt, majd próbáld újra.');
                }
                else {
                    this.generalError.set('Most nem sikerült elküldeni az ajánlatkérést. Ellenőrizd a szerverkapcsolatot és próbáld újra.');
                }
            } });
    }
}
