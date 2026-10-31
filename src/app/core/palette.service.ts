import { Injectable, computed, signal } from '@angular/core';

/** Alaptémák (az adminban választható) és ünnepi témák (automatikusan kapcsolnak). */
export type BasePalette = 'cobalt' | 'nightblue' | 'graphite' | 'aurora';
export type Season = 'christmas' | 'easter' | 'valentine' | 'national';
export type Palette = BasePalette | Season;

export const BASE_PALETTES: { id: BasePalette; name: string; description: string; swatches: string[] }[] = [
    { id: 'cobalt', name: 'Kobalt', description: 'Mély éjkék alap, kobaltkék és cián – modern, technológiai.', swatches: ['#080d19', '#0f1627', '#4263ff', '#00d9ff'] },
    { id: 'nightblue', name: 'Éjkék', description: 'Professzionális, technológiai, megbízható.', swatches: ['#060b1c', '#1d2f57', '#8ab4f0', '#f3f6fc'] },
    { id: 'graphite', name: 'Grafit + pezsgőarany', description: 'Elegáns, visszafogott, prémium.', swatches: ['#0d0c0b', '#2a2724', '#cdb78d', '#f6f3ec'] },
    { id: 'aurora', name: 'Aurora (lila)', description: 'Az eredeti, lila–kék színvilág.', swatches: ['#050818', '#2b2566', '#b79cff', '#f4f6ff'] },
];
export const SEASONS: { id: Season; name: string; when: string; swatches: string[] }[] = [
    { id: 'christmas', name: 'Karácsony + Újév', when: 'december 1. – január 6.', swatches: ['#03100d', '#0f3a2c', '#d8b25e', '#f8f2e4'] },
    { id: 'easter', name: 'Húsvét', when: 'virágvasárnaptól húsvéthétfőig', swatches: ['#041219', '#14403c', '#a9d68a', '#fbf6dc'] },
    { id: 'valentine', name: 'Valentin-nap', when: 'február 7–14.', swatches: ['#14040b', '#4a1428', '#f19ab0', '#fff1f3'] },
    { id: 'national', name: 'Nemzeti ünnepek', when: 'márc. 15., aug. 20., okt. 23. (és az előtte lévő 2 nap)', swatches: ['#070a17', '#ce2939', '#ffffff', '#477050'] },
];
const ALL: Palette[] = ['cobalt', 'nightblue', 'graphite', 'aurora', 'christmas', 'easter', 'valentine', 'national'];
/** Ez a téma van a fő stíluslapban (src/palettes.generated.scss); a többi a /palettes/<név>.css-ből töltődik. */
const DEFAULT: BasePalette = 'cobalt';
const LAST_KEY = 'mm-palette-last';
const BASE_KEY = 'mm-palette-base';
const PREVIEW_KEY = 'mm-palette-preview';

export interface ThemeSettings {
    site_palette?: string; seasonal_enabled?: string | boolean;
    seasonal_christmas?: string | boolean; seasonal_easter?: string | boolean; seasonal_valentine?: string | boolean; seasonal_national?: string | boolean;
}
const on = (v: string | boolean | undefined) => v === true || v === '1';

/** Húsvétvasárnap (Gergely-naptár, „anonim” algoritmus). */
export function easterSunday(year: number): Date {
    const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4;
    const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(Date.UTC(year, month - 1, day));
}

/** Melyik ünnepi időszakban vagyunk (budapesti naptári nap szerint)? Átfedésnél a nemzeti ünnep az erősebb. */
export function seasonOn(date: Date): Season | null {
    const [y, mo, d] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Budapest', year: 'numeric', month: '2-digit', day: '2-digit' })
        .format(date).split('-').map(Number);
    const day = Date.UTC(y, mo - 1, d), DAY = 86_400_000;
    const md = (m: number, dd: number) => Date.UTC(y, m - 1, dd);
    if ([[3, 15], [8, 20], [10, 23]].some(([m, dd]) => day >= md(m, dd) - 2 * DAY && day <= md(m, dd))) return 'national';
    if (day >= md(12, 1) || day <= md(1, 6)) return 'christmas';
    const easter = easterSunday(y).getTime();
    if (day >= easter - 7 * DAY && day <= easter + DAY) return 'easter';
    if (day >= md(2, 7) && day <= md(2, 14)) return 'valentine';
    return null;
}

/**
 * Az egész oldal színvilága: <html data-palette="…">. Az alaptémát és az ünnepi kapcsolókat az admin állítja
 * (site_settings), az ünnepi időszakot a böngésző számolja. Előnézet: ?palette=<név> (a munkamenet végéig),
 * ?palette=auto visszaállít.
 */
@Injectable({ providedIn: 'root' })
export class PaletteService {
    readonly base = signal<BasePalette>(DEFAULT);
    readonly seasonalEnabled = signal(true);
    readonly enabledSeasons = signal<Season[]>(['christmas', 'easter', 'valentine', 'national']);
    /** Admin-előnézet (nem mentett választás) – felülír mindent. */
    readonly preview = signal<Palette | null>(PaletteService.readPreview());
    readonly season = computed<Season | null>(() => {
        const s = seasonOn(new Date());
        return this.seasonalEnabled() && s && this.enabledSeasons().includes(s) ? s : null;
    });
    readonly active = computed<Palette>(() => this.preview() ?? this.season() ?? this.base());
    /** Az aktív ünnep díszítéséhez (hóesés stb.) – előnézetben is. */
    readonly decoration = computed<Season | null>(() => { const p = this.active(); return (SEASONS.some(s => s.id === p) ? p : null) as Season | null; });

    /** Indulás előtt (main.ts): a legutóbbi témát azonnal felvesszük, hogy ne villanjon az alaptéma. */
    static applyEarly(): void {
        try {
            let last = (localStorage.getItem(LAST_KEY) ?? DEFAULT) as Palette;
            // az ünnep közben véget érhetett: akkor a mentett alaptéma jöjjön, ne a régi ünnepi
            if (SEASONS.some(s => s.id === last) && seasonOn(new Date()) !== last) last = (localStorage.getItem(BASE_KEY) ?? DEFAULT) as Palette;
            PaletteService.set(PaletteService.readPreview() ?? last, false);
        } catch { /* privát mód */ }
    }

    applySettings(s: ThemeSettings | null | undefined): void {
        if (!s) return;
        if (BASE_PALETTES.some(p => p.id === s.site_palette)) {
            this.base.set(s.site_palette as BasePalette);
            try { localStorage.setItem(BASE_KEY, s.site_palette as string); } catch { /* privát mód */ }
        }
        this.seasonalEnabled.set(s.seasonal_enabled === undefined ? true : on(s.seasonal_enabled));
        this.enabledSeasons.set(SEASONS.map(x => x.id).filter(id => {
            const v = s[`seasonal_${id}` as keyof ThemeSettings];
            return v === undefined ? true : on(v);
        }));
        this.render();
    }

    /** Admin: ideiglenes előnézet (null = vissza a mentett beállításhoz). */
    setPreview(p: Palette | null): void {
        this.preview.set(p);
        try { if (p) sessionStorage.setItem(PREVIEW_KEY, p); else sessionStorage.removeItem(PREVIEW_KEY); } catch { /* privát mód */ }
        this.render();
    }

    render(): void { PaletteService.set(this.active(), true); }

    private static readPreview(): Palette | null {
        try {
            const param = new URLSearchParams(location.search).get('palette');
            if (param === 'auto') { sessionStorage.removeItem(PREVIEW_KEY); return null; }
            if (param && ALL.includes(param as Palette)) { sessionStorage.setItem(PREVIEW_KEY, param); return param as Palette; }
            const stored = sessionStorage.getItem(PREVIEW_KEY);
            return stored && ALL.includes(stored as Palette) ? stored as Palette : null;
        } catch { return null; }
    }

    private static set(palette: Palette, remember: boolean): void {
        if (!ALL.includes(palette)) palette = DEFAULT;
        const root = document.documentElement;
        if (palette !== DEFAULT) {
            const id = `mm-palette-${palette}`;
            if (!document.getElementById(id)) {
                const link = document.createElement('link');
                link.id = id; link.rel = 'stylesheet'; link.href = `/palettes/${palette}.css`;
                document.head.appendChild(link);
            }
        }
        root.dataset['palette'] = palette;
        if (remember) { try { localStorage.setItem(LAST_KEY, palette); } catch { /* privát mód */ } }
    }
}
