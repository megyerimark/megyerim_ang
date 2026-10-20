# Angular ↔ Laravel kapcsolatellenőrzés

## Indítás (két terminál)

**Laravel mappájában:**

```bash
php artisan optimize:clear
php artisan migrate:status
php artisan serve --host=localhost --port=8000
```

**Angular mappájában:**

```bash
npm ci
npm start
```

Ez a módosított változat a `proxy.conf.json` fájlt **az angular.json fájlban is** beállítja, tehát a `ng serve` parancs is használja. A proxy fejlesztési eszköz, nem része a lefordított produkciós fájloknak.

## Ellenőrzés

```bash
npm run check:api
```

Az ellenőrző nem jelentkezik be és nem küld próbamegrendelést. Két címet kérdez le:

- `http://localhost:8000/api/site-settings` – közvetlen Laravel API
- `http://localhost:4200/api/site-settings` – ugyanaz az Angular proxy mögött

Mindkettőnek `application/json` választ és `data.site_title` mezőt kell adnia.

A böngészőben az `http://localhost:4200/admin/bejelentkezes` oldal külön kiírja, ha a Laravel nem érhető el. A főoldal most már jelzi a tartalomlekérési hibát, nem csak helyettesítő kártyákat mutat.

## Ha nincs kapcsolat

- **ECONNREFUSED**: Laravel nem fut vagy eltérő porton fut.
- **HTTP 404 / HTML az Angular 4200-as `/api` útvonalán**: nem aktív proxy vagy rossz Angular projektet indítottál. Állítsd le (`Ctrl+C`) és indítsd újra a szervert `npm start`-tal.
- **HTTP 500**: Laravel fut, de backendoldali hiba van (például hiányzó migráció vagy `.env`). Nézd meg a Laravel terminált és `storage/logs/laravel.log` fájlt.
- **HTTP 419**: CSRF-kérdés; az oldal a `/sanctum/csrf-cookie` kérést és a `X-XSRF-TOKEN` fejlécet használja. Mindkét szervert `localhost` címen indítsd, és ellenőrizd a sütiket.
- **HTTP 401** a `GET /api/admin/me` kérésnél bejelentkezés nélkül: helyes viselkedés.
- **Üres szolgáltatások/referenciák** JSON válasszal: nem feltétlenül hiba. Csak az adminban aktivált/publikált rekordok jelennek meg.

### Laravel `.env` fejlesztői mintabeállításai

```dotenv
APP_URL=http://localhost:8000
SANCTUM_STATEFUL_DOMAINS=localhost:4200,localhost:8000
SESSION_DRIVER=database
CORS_ALLOWED_ORIGINS=http://localhost:4200
```

## Élesítés

**Ne** a `proxy.conf.json`-t másold egy statikus tárhelyre: csak fejlesztéskor érvényes. Élesben a webszervernek vagy a hosting rendszernek az `/api`, `/admin/login`, `/admin/logout`, `/sanctum/csrf-cookie` és `/storage` útvonalakat a Laravelhez kell irányítania (vagy külön API-originhez kell igazítani a frontendet és a CORS/session-cookie beállításokat). Ez a csomag még nem tartalmaz éles reverse-proxy konfigurációt.
