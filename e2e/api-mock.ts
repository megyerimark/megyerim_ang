import { Page, Request } from '@playwright/test';

/** Az e2e tesztek szimulált API-ja: az oldal működéséhez szükséges válaszok + a beküldött kérések naplója. */
export interface ApiLog { quotes: Record<string, unknown>[]; bookings: Record<string, unknown>[]; events: Record<string, unknown>[]; }

export const SLOT_START = '2030-03-14T09:30:00Z';

export async function mockApi(page: Page, options: { phone?: string } = {}): Promise<ApiLog> {
    const log: ApiLog = { quotes: [], bookings: [], events: [] };
    const json = (status: number, body: unknown) => ({ status, contentType: 'application/json', body: JSON.stringify(body) });
    const body = (req: Request) => (req.postDataJSON() ?? {}) as Record<string, unknown>;

    // a süti-sáv ne takarja el a gombokat; a robotszűrő (Turnstile) a teszt-beállításokban nincs bekapcsolva
    await page.addInitScript(() => { try { localStorage.setItem('mm-consent-v1', 'acknowledged'); } catch { /* */ } });

    await page.route(/\/(api|sanctum)\//, route => {
        const req = route.request();
        const path = new URL(req.url()).pathname;
        if (path === '/sanctum/csrf-cookie') return route.fulfill({ status: 204 });
        if (path === '/api/site-settings') return route.fulfill(json(200, { data: { site_palette: 'cobalt', promo: { active: false, percent: 0 }, contact_phone: options.phone ?? null, phone: options.phone ?? null } }));
        if (path === '/api/consultations/available') return route.fulfill(json(200, { data: [{ id: 7, starts_at: SLOT_START, duration_minutes: 30 }] }));
        if (path === '/api/consultations/book' && req.method() === 'POST') {
            log.bookings.push(body(req));
            return route.fulfill(json(201, { message: 'ok', reference: 31, starts_at: SLOT_START, duration_minutes: 30 }));
        }
        if (path === '/api/quote-requests' && req.method() === 'POST') {
            log.quotes.push(body(req));
            return route.fulfill(json(201, { message: 'ok', reference: 42, promo_percent: null, promo_title: null }));
        }
        if (path === '/api/events' && req.method() === 'POST') { log.events.push(body(req)); return route.fulfill({ status: 204 }); }
        return route.fulfill(json(200, { data: [] }));
    });
    return log;
}
