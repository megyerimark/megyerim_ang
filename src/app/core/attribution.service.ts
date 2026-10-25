import { Injectable } from '@angular/core';

export interface Attribution {
    source?: 'direct' | 'search' | 'social' | 'referral' | 'email' | 'campaign';
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    referrer_host?: string;
    landing_path?: string;
}

const KEY = 'mm-attribution';
const SEARCH = /(^|\.)(google|bing|duckduckgo|yahoo|ecosia|seznam)\./i;
const SOCIAL = /(^|\.)(facebook|instagram|linkedin|t\.co|twitter|x|tiktok|youtube|pinterest|messenger)\./i;

/**
 * Az érkezési forrás rögzítése az első oldalbetöltéskor (UTM, hivatkozó oldal, belépő oldal).
 * Csak a böngésző munkamenetében él (sessionStorage), sütit nem állít be, a Do Not Track jelzést tiszteletben tartja.
 * A tárolás tiltott lehet (privát mód), ezért minden hozzáférés védett.
 */
@Injectable({ providedIn: 'root' })
export class AttributionService {
    private cached: Attribution | null = null;

    get tracking(): boolean {
        return typeof navigator !== 'undefined' && navigator.doNotTrack !== '1';
    }

    capture(): void {
        if (!this.tracking) return;
        try {
            if (sessionStorage.getItem(KEY)) return;
        } catch { /* a memóriában tartott példány marad */ }
        if (this.cached) return;
        const value = this.read();
        this.cached = value;
        try { sessionStorage.setItem(KEY, JSON.stringify(value)); } catch { /* nem kritikus */ }
    }

    get(): Attribution {
        if (!this.tracking) return {};
        if (this.cached) return this.cached;
        try {
            const raw = sessionStorage.getItem(KEY);
            if (raw) { this.cached = JSON.parse(raw) as Attribution; return this.cached; }
        } catch { /* ignore */ }
        this.capture();
        return this.cached ?? {};
    }

    private clean(value: string | null, max: number): string | undefined {
        const v = (value ?? '').replace(/[^\p{L}\p{N} _.+\-]/gu, '').trim().slice(0, max);
        return v || undefined;
    }

    private read(): Attribution {
        const out: Attribution = {};
        const q = new URLSearchParams(location.search);
        out.utm_source = this.clean(q.get('utm_source'), 80);
        out.utm_medium = this.clean(q.get('utm_medium'), 80);
        out.utm_campaign = this.clean(q.get('utm_campaign'), 80);
        out.landing_path = /^\/[A-Za-z0-9\-._~\/]*$/.test(location.pathname) ? location.pathname.slice(0, 160) : '/';
        let host = '';
        try {
            if (document.referrer) {
                const h = new URL(document.referrer).hostname.toLowerCase();
                if (h && h !== location.hostname && /^[a-z0-9.\-]+$/.test(h)) host = h.slice(0, 120);
            }
        } catch { /* hibás hivatkozó */ }
        if (host) out.referrer_host = host;
        const medium = (out.utm_medium ?? '').toLowerCase();
        if (out.utm_source || out.utm_medium) {
            out.source = medium === 'email' ? 'email' : 'campaign';
        } else if (host) {
            out.source = SEARCH.test(host) ? 'search' : SOCIAL.test(host) ? 'social' : 'referral';
        } else {
            out.source = 'direct';
        }
        for (const k of Object.keys(out) as (keyof Attribution)[]) if (out[k] === undefined) delete out[k];
        return out;
    }
}
