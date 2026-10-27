import { HttpErrorResponse } from '@angular/common/http';

/** A frontend verziója – a Rendszerállapot panel összeveti a backend verziójával. */
export const FRONTEND_VERSION = 'v19';

/**
 * Egységes, emberi nyelvű hibaüzenet az admin számára.
 * Külön kezeli az élesítési hibákat: régi backend / elavult route-cache (404) és elmaradt migráció (503).
 */
export function apiErrorMessage(e: unknown): string {
    const err = e as HttpErrorResponse;
    const fields = err?.error?.errors as Record<string, string[]> | undefined;
    if (fields) return Object.values(fields).flat().join(' · ');
    if (err?.error?.error_code === 'MIGRATION_REQUIRED') return err.error.message;
    if (err?.status === 404 && /\/api\/admin\//.test(err.url ?? '')) {
        return 'Ez a funkció még nem érhető el a szerveren: a backend régebbi verziójú, vagy elavult a gyorsítótár. A szerveren futtasd: bash deploy.sh (vagy php artisan migrate --force && php artisan optimize:clear).';
    }
    if (err?.status === 419) return 'Lejárt a munkamenet. Frissítsd az oldalt.';
    if (err?.status === 401) return 'A munkamenet lejárt. Jelentkezz be újra.';
    if (err?.status === 429) return 'Túl sok kérés rövid idő alatt. Várj egy percet, és próbáld újra.';
    if (err?.status === 0) return 'Nincs kapcsolat a szerverrel. Ellenőrizd az internetkapcsolatot.';
    return err?.error?.message || 'Szerverhiba. Próbáld újra.';
}
