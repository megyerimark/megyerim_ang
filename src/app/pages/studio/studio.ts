import { Component, computed, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TPipe } from '../../i18n/t.pipe';
import { I18nService } from '../../i18n/i18n.service';
import { LpPipe } from '../../i18n/lp.pipe';

type SiteGoal = 'business' | 'booking' | 'shop' | 'system';
type Tone = 'midnight' | 'linen' | 'electric' | 'forest';
type Layout = 'editorial' | 'split' | 'centered';
type Font = 'elegant' | 'modern';
type Device = 'desktop' | 'mobile';

@Component({ selector: 'app-studio', standalone: true, imports: [LpPipe, RouterLink, TPipe], templateUrl: './studio.html', styleUrl: './studio.scss' })
export class StudioPage {
    readonly i18n = inject(I18nService);
    readonly goals: {value: SiteGoal; title: string; description: string}[] = [
        {value:'business',title:'Céges weboldal',description:'Megbízható digitális jelenlét'},
        {value:'booking',title:'Foglalási rendszer',description:'Időpontok és ügyfelek'},
        {value:'shop',title:'Webáruház',description:'Termékek és vásárlások'},
        {value:'system',title:'Egyedi rendszer',description:'Saját folyamatok és admin'}
    ];
    readonly palettes: {value: Tone; title: string; colors: string[]}[] = [
        {value:'midnight',title:'Midnight',colors:['#10111f','#7858eb','#f8f7ff']},
        {value:'linen',title:'Linen',colors:['#f7f4ee','#a46a4a','#22201c']},
        {value:'electric',title:'Electric',colors:['#0a1831','#2cd6c4','#f5fbff']},
        {value:'forest',title:'Forest',colors:['#0d211b','#accb82','#f6f4e9']}
    ];
    readonly industries = ['Szolgáltatás', 'Egészség és szépség', 'Vendéglátás', 'Technológia', 'Kereskedelem', 'Más terület'];
    readonly features = ['Kapcsolatfelvételi űrlap', 'Időpontfoglalás', 'Adminfelület', 'Blog / hírek', 'Többnyelvűség', 'Online fizetés', 'Keresőoptimalizálás', 'Animációk / 3D', 'Ügyfélfiók'];
    readonly layouts: {value:Layout;title:string;description:string}[] = [
        {value:'editorial',title:'Editorial',description:'Nagy tipográfia'},
        {value:'split',title:'Split',description:'Szöveg és vizuális tér'},
        {value:'centered',title:'Centered',description:'Középre komponált'}
    ];
    readonly goal = signal<SiteGoal>('business');
    readonly tone = signal<Tone>('midnight');
    readonly layout = signal<Layout>('split');
    readonly font = signal<Font>('modern');
    readonly device = signal<Device>('desktop');
    readonly industry = signal('Szolgáltatás');
    readonly brandName = signal('');
    readonly customHeadline = signal('');
    readonly visibleBrand = computed(() => this.brandName().trim() || 'MÁRKANEVED');
    readonly monogram = computed(() => this.visibleBrand().slice(0, 1).toLocaleUpperCase('hu-HU'));
    readonly selectedFeatures = signal<string[]>(['Kapcsolatfelvételi űrlap', 'Keresőoptimalizálás']);
    translatedFeatures(): string { return this.selectedFeatures().map(f => this.i18n.t(f)).join(', '); }
    readonly theme = computed(() => this.palettes.find(p => p.value === this.tone())!);
    readonly headline = computed(() => {
        const headlines: Record<SiteGoal,string> = {business:'Az első benyomásból új kapcsolat.',booking:'Neked több idő. Nekik egyszerű foglalás.',shop:'A következő kedvenc egy kattintásra.',system:'Minden, ami fontos, egy helyen.'};
        return headlines[this.goal()];
    });
    readonly description = computed(() => {
        const labels: Record<SiteGoal,string> = {business:'Egyedi online jelenlét, amely tisztán mutatja az értékeidet.',booking:'Átlátható szolgáltatások és gyors időpontválasztás.',shop:'Átgondolt vásárlói élmény a felfedezéstől a fizetésig.',system:'Egy felület, amely pontosan a vállalkozásodhoz igazodik.'};
        return labels[this.goal()];
    });
    readonly visibleHeadline = computed(() => this.customHeadline().trim() || this.headline());
    readonly cta = computed(() => ({business:'Beszéljünk',booking:'Időpontot foglalok',shop:'Felfedezem',system:'Belépés'})[this.goal()]);
    readonly quoteParams = computed(() => ({
        from:'studio', goal:this.goal(), tone:this.tone(), layout:this.layout(), font:this.font(),
        industry:this.industry(), features:this.selectedFeatures().join('|')
    }));
    toggleFeature(name: string): void {
        this.selectedFeatures.update(old => old.includes(name) ? old.filter(x=>x!==name) : [...old,name]);
    }
    chooseGoal(value: SiteGoal): void {
        this.goal.set(value);
        if(value === 'booking' && !this.selectedFeatures().includes('Időpontfoglalás')) this.toggleFeature('Időpontfoglalás');
        if(value === 'shop' && !this.selectedFeatures().includes('Online fizetés')) this.toggleFeature('Online fizetés');
    }
    updateBrand(event: Event): void { this.brandName.set((event.target as HTMLInputElement).value.slice(0, 80)); }
    updateHeadline(event: Event): void { this.customHeadline.set((event.target as HTMLInputElement).value.slice(0, 120)); }
    prepareQuote(): void {
        // Session-only bridge: private custom text is not added to a shareable URL.
        sessionStorage.setItem('mm-studio-brief', JSON.stringify({brand: this.brandName().trim(), headline: this.customHeadline().trim()}));
    }
    printBrief(): void { window.print(); }
}
