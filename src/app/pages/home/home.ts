import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Hero } from '../../components/hero/hero';
import { ApiService } from '../../core/api.service';
import { Project, Service, SiteSettings, SITE_DEFAULTS } from '../../core/models';
type PreviewPurpose = 'business' | 'booking' | 'system';
type PreviewStyle = 'graphite' | 'ivory' | 'ocean';

interface PreviewMode {
    value: PreviewPurpose;
    label: string;
    eyebrow: string;
    headline: string;
    description: string;
    cta: string;
}

interface PreviewPalette {
    value: PreviewStyle;
    label: string;
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
    readonly selectedPurpose = signal<PreviewPurpose>('business');
    readonly selectedStyle = signal<PreviewStyle>('graphite');
    readonly realProjects = computed(() => this.projects().filter(project => !project.is_demo));

    readonly previewModes: PreviewMode[] = [
        {
            value: 'business',
            label: 'Céges weboldal',
            eyebrow: 'EGYEDI WEBOLDAL / MÁRKAÉPÍTÉS',
            headline: 'Az első benyomás számít.',
            description: 'Letisztult bemutatkozás, jól felépített szolgáltatások és világos következő lépés az ügyfeleidnek.',
            cta: 'Ismerj meg minket'
        },
        {
            value: 'booking',
            label: 'Időpontfoglalás',
            eyebrow: 'SZOLGÁLTATÁS / ONLINE FOGLALÁS',
            headline: 'Kevesebb egyeztetés. Több idő.',
            description: 'A szolgáltatások és a foglalási lehetőségek egy átlátható, könnyen használható felületen.',
            cta: 'Időpontot választok'
        },
        {
            value: 'system',
            label: 'Egyedi webes rendszer',
            eyebrow: 'WEBALKALMAZÁS / EGYEDI MŰKÖDÉS',
            headline: 'Digitális eszköz. A te folyamataidra.',
            description: 'Ügyféladatok, feladatok vagy szolgáltatások kezelése egy célra szabott webes felületen.',
            cta: 'Megnézem a lehetőségeket'
        }
    ];

    readonly previewPalettes: PreviewPalette[] = [
        { value: 'graphite', label: 'Grafit' },
        { value: 'ivory', label: 'Világos' },
        { value: 'ocean', label: 'Éjkék' }
    ];

    readonly activePreview = computed(() =>
        this.previewModes.find(mode => mode.value === this.selectedPurpose()) ?? this.previewModes[0]
    );

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
