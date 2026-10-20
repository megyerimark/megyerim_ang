# Megyeri Márk | Webfejlesztés – Angular frontend

Ez a **felhasználó által küldött Angular 20 projekt továbbfejlesztett változata**, a korábban közösen elkészített Laravel backend API-jához igazítva.

## Funkciók

- Prémium reszponzív főoldal, váltható sötét/világos témával, interaktív CSS-3D Hero látványelemmel.
- Publikus szolgáltatások, projektek és főoldalszövegek betöltése a Laravel adatbázisából.
- 4 lépéses ajánlatkérő: típus, dizájn/színek, funkciók/részletek, kapcsolattartás.
- Valódi ajánlatküldés és Laravel validációk kezelése, XSRF/CSRF inicializálás.
- Védett admin: bejelentkezés, dashboard, ajánlatok és státuszok, ügyfelek, projektek képfeltöltéssel, szolgáltatások, oldalbeállítások, tevékenységnapló, jelszócsere.
- Nincs nyilvános regisztráció és nincs frontenden tárolt API-token.

## Telepítés és futtatás

1. Node.js megfelelő verzióját ellenőrizd (`node -v`).
2. Angular mappában `npm ci`.
3. Backend indítása másik terminálban: `php artisan serve --host=localhost --port=8000`.
4. Frontend indítása: `npm start`. Nyisd meg: http://localhost:4200
5. A `proxy.conf.json` biztosítja, hogy az `/api`, `/admin`, `/sanctum` és `/storage` kérések a Laravel felé menjenek.

**Fontos:** Angular-t és Laravel-t is `localhost`-on nyisd meg; ne keverd a 127.0.0.1 címmel. A Laravel `.env` fájlban: `APP_URL=http://localhost:8000`, `SANCTUM_STATEFUL_DOMAINS=localhost:4200,localhost:8000`, `SESSION_DRIVER=database`; a cookie és CSRF beállítások a backend útmutató szerint.

## Frontend oldalak

- `/` – Főoldal (Hero, szolgáltatások, referenciák, bemutatkozás, folyamatszekció, GYIK).
- `/ajanlatkeres` – Ajánlatkérő konfigurátor.
- `/adatkezeles` – **Csak tervezet!** Élesítés előtt jogilag és tartalmilag ki kell egészíteni.
- `/admin/bejelentkezes` – Admin belépés (külön, publikus menü nélküli nézet).
- `/admin` – Védett admin dashboard és modulok.

## Backend kompatibilitás

A backend `API.md` dokumentációjával összehangolt végpontok: `/api/services`, `/api/projects`, `/api/site-settings`, `/api/quote-requests`, `/sanctum/csrf-cookie`, `/admin/login`, `/admin/logout` és a védett `/api/admin/*` műveletek.

Adminban felvett szolgáltatás csak `is_active=true`, referencia csak `is_published=true` esetén jelenik meg a publikus oldalon. Projektképekhez backend oldalon `php artisan storage:link` szükséges.

## Élesítés előtt kötelező ellenőrzések

- Adatkezelési tájékoztató véglegesítése, valós adatkezelői és kapcsolati adatokkal. Ne induljon publikus ajánlatgyűjtés a tervezettel.
- Valós domain, HTTPS, cookie/Sanctum/CORS és reverse-proxy konfiguráció tesztelése.
- Ajánlatbeküldés és adminlogin valódi böngészős end-to-end tesztje, 422/419/401 hibakezelés.
- SMTP-küldés, spamszűrés, biztonság, feltöltések és hozzáférések ellenőrzése.
- SEO, betöltési teljesítmény, mobilteszt, akadálymentességi felülvizsgálat.

**Megjegyzés:** a 3D Hero jelenleg CSS-perspektívával készült. Valós WebGL/Three.js jelenet és mélyebb térbeli interakció külön bővítést igényel.

## Valós API-kapcsolat ellenőrzése

Futtasd: `npm run check:api`. A részletes hibaelhárítás: `LARAVEL_KAPCSOLAT_ELLENORZES.md`. Fejlesztéskor a proxy már `ng serve`-vel is aktív.
