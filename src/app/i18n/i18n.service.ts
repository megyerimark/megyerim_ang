import { Injectable, signal } from '@angular/core';

export type Lang = 'hu' | 'en';
const KEY = 'mm-lang';

/** Normalizált kulcs: a sablon tördelése (sortörések, szóközök) ne számítson. */
export const normalizeKey = (text: string) => text.replace(/\s+/g, ' ').trim();

/**
 * Futásidejű kétnyelvűség (HU/EN). A kulcs maga a magyar szöveg – így a sablonok olvashatók maradnak,
 * hiányzó fordításnál pedig a magyar szöveg jelenik meg (sosem üres hely vagy kulcsnév).
 * Nyelvválasztás: navigációs kapcsoló, vagy ?lang=en / ?lang=hu a linkben. Alapértelmezés: magyar
 * (a Google is magyarul indexeli az oldalt).
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
    readonly lang = signal<Lang>(this.initial());
    /** Az angol szótár csak angol nézetben töltődik le (külön, ~15 KB-os tömörített csomag). */
    private readonly dict = signal<Record<string, string> | null>(null);

    constructor() { this.apply(this.lang()); }

    private loadDictionary(): void {
        if (this.dict()) return;
        import('./en').then(m => this.dict.set(m.EN)).catch(() => { /* hálózati hiba: marad a magyar szöveg */ });
    }

    private initial(): Lang {
        try {
            const param = new URLSearchParams(location.search).get('lang');
            if (param === 'en' || param === 'hu') return param;
            const stored = localStorage.getItem(KEY);
            if (stored === 'en' || stored === 'hu') return stored;
        } catch { /* privát mód */ }
        return 'hu';
    }

    set(lang: Lang): void {
        this.lang.set(lang);
        this.apply(lang);
        try { localStorage.setItem(KEY, lang); } catch { /* privát mód */ }
    }
    toggle(): void { this.set(this.lang() === 'hu' ? 'en' : 'hu'); }

    private apply(lang: Lang): void {
        if (typeof document !== 'undefined') document.documentElement.lang = lang;
        if (lang === 'en') this.loadDictionary();
    }

    /** Adatbázis-tartalom: angol nézetben a `<mező>_en` értéke, ha ki van töltve; különben a magyar. */
    loc<T extends object>(obj: T | null | undefined, field: string): string {
        if (!obj) return '';
        const record = obj as Record<string, unknown>;
        const hu = record[field];
        if (this.lang() === 'en') {
            const en = record[field + '_en'];
            if (typeof en === 'string' && en.trim()) return en;
        }
        return typeof hu === 'string' ? hu : '';
    }
    locList<T extends object>(obj: T | null | undefined, field: string): string[] {
        if (!obj) return [];
        const record = obj as Record<string, unknown>;
        const en = record[field + '_en'];
        if (this.lang() === 'en' && Array.isArray(en) && en.length) return en as string[];
        return (record[field] as string[] | null) ?? [];
    }

    /** Magyar szöveg → aktuális nyelv. */
    t(text: string | null | undefined): string {
        if (text == null) return '';
        if (this.lang() === 'hu') return text;
        return this.dict()?.[normalizeKey(text)] ?? text;
    }
}
