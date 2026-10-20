import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Hero } from '../../components/hero/hero';
import { ApiService } from '../../core/api.service';
import { Project, Service, SiteSettings, SITE_DEFAULTS } from '../../core/models';
interface DemoProject {
    number: string;
    name: string;
    type: string;
    summary: string;
    image: string;
    url: string;
    tools: string[];
}
@Component({
    selector: 'app-home',
    standalone: true,
    imports: [Hero, RouterLink],
    templateUrl: './home.html',
    styleUrl: './home.scss'
})
export class Home implements OnInit {
    private readonly api = inject(ApiService);
    settings = signal<SiteSettings>(SITE_DEFAULTS);
    services = signal<Service[]>([]);
    projects = signal<Project[]>([]);
    servicesUnavailable = signal(false);
    projectsUnavailable = signal(false);
    settingsUnavailable = signal(false);
    openFaq = signal<number | null>(0);
    readonly year = new Date().getFullYear();
    readonly demoProjects: DemoProject[] = [
        {
            number: '01',
            name: 'VÁGAT',
            type: 'Barber Studio / Demo',
            summary: 'Karakteres tipográfia és elegáns, sötét webes megjelenés.',
            
image: '/demos/photos/vagat.jpg',
            url: '/demos/vagat-barber/index.html',
            tools: ['HTML', 'CSS', 'JavaScript']
        },
        {
            number: '02',
            name: 'AXIS',
            type: 'Auto Detailing / Demo',
            summary: 'Kontrasztos, dinamikus felület prémium szolgáltatásokhoz.',
            
image: '/demos/photos/axis.jpg',

            url: '/demos/axis-detailing/index.html',
            tools: ['HTML', 'CSS', 'JavaScript']
        },
        {
            number: '03',
            name: 'PULSE',
            type: 'Personal Training / Demo',
            summary: 'Energikus arculat, programválasztás és reszponzív kialakítás.',

image: '/demos/photos/pulse.jpg',

            url: '/demos/pulse-fitness/index.html',
            tools: ['HTML', 'CSS', 'JavaScript']
        }
    ];
    readonly processSteps = [
        {
            number: '01',
            title: 'Megismerem a céljaidat',
            description: 'Rövid egyeztetés: kinek szól az oldal, milyen problémát oldjon meg, és mi számít sikernek.'
        },
        {
            number: '02',
            title: 'Kialakítjuk a koncepciót',
            description: 'Vizuális irány, oldaltérkép, felhasználói út és az elvárt funkciók pontosítása.'
        },
        {
            number: '03',
            title: 'Megépítem és finomítjuk',
            description: 'Fejlesztés, reszponzív kialakítás, közös visszajelzések és tesztelés.'
        },
        {
            number: '04',
            title: 'Élesítünk és támogatlak',
            description: 'Átadás, beállítások, betanítás és igény esetén későbbi karbantartás.'
        }
    ];
    readonly faqs = [
        {
            question: 'Mennyibe kerül egy egyedi weboldal?',
            answer: 'Az ár a funkcióktól, a tartalom mennyiségétől és a tervezési igénytől függ. Az ajánlatkérőben megadhatod a költségkeretedet, és ahhoz igazítva egyeztetünk.'
        },
        {
            question: 'Mennyi idő alatt készül el?',
            answer: 'Az ütemezést az igények, a jóváhagyások és a szükséges tartalmak alapján határozzuk meg. A részleteket még a fejlesztés előtt tisztázzuk.'
        },
        {
            question: 'Később is módosítható a weboldal?',
            answer: 'Igen. A későbbi módosítások és az igény szerinti rendszeres karbantartás is egyeztethető.'
        },
        {
            question: 'Csak egyszerű bemutatkozó oldalt készítesz?',
            answer: 'Nem. Egyedi funkciók, adminfelületek és adatbázishoz kapcsolódó webes rendszerek tervezésére is kérhetsz ajánlatot.'
        }
    ];
    ngOnInit(): void {
        this.api.publicSettings().subscribe({
            next: response => {
                this.settings.set({ ...SITE_DEFAULTS, ...response.data });
            },
            error: () => this.settingsUnavailable.set(true)
        });
        this.api.publicServices().subscribe({
            next: response => this.services.set(response.data),
            error: () => this.servicesUnavailable.set(true)
        });
        this.api.publicProjects().subscribe({
            next: response => this.projects.set(response.data),
            error: () => this.projectsUnavailable.set(true)
        });
    }
    money(amount: number | null): string {
        if (amount === null) {
            return 'Egyedi ajánlat';
        }
        return new Intl.NumberFormat('hu-HU').format(amount) + ' Ft-tól';
    }
    toggleFaq(index: number): void {
        this.openFaq.update(current => current === index ? null : index);
    }
}
