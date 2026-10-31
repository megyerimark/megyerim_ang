# Megyeri Márk | Webfejlesztés – Angular frontend

**Aurora V6:** az interaktív 3D Hero, mozgó értéksáv, filmes görgetés, húzható összehasonlítás, személyre szabható tervező és nyomtatható brief használatához lásd az [Aurora V6 útmutatót](AURORA_V6_UTMUTATO.md).

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

- **Jogi adatok kitöltése:** `src/app/core/legal-info.ts` – innen épül fel az **Impresszum** (`/impresszum`) és az **Adatkezelési tájékoztató** (`/adatkezeles`). Amíg kötelező mező hiányzik, az oldalakon figyelmeztetés látszik. A szöveget érdemes jogásszal is átnézetni.
- Valós domain, HTTPS, cookie/Sanctum/CORS és reverse-proxy konfiguráció tesztelése.
- Ajánlatbeküldés és adminlogin valódi böngészős end-to-end tesztje, 422/419/401 hibakezelés.
- SMTP-küldés, spamszűrés, biztonság, feltöltések és hozzáférések ellenőrzése.
- SEO, betöltési teljesítmény, mobilteszt, akadálymentességi felülvizsgálat.

**Megjegyzés:** a 3D Hero jelenleg CSS-perspektívával készült. Valós WebGL/Three.js jelenet és mélyebb térbeli interakció külön bővítést igényel.

## Biztonság és teljesítmény

- **Betűtípusok saját tárhelyről:** `public/fonts/` (woff2, magyar ékezetekkel; SIL OFL licenc). Nincs Google Fonts-kapcsolat → GDPR-barát és gyorsabb.
- **Képek:** a demóképek WebP-ben (~3,6 MB → ~0,56 MB). Az eredeti, nagy felbontású forrásképek a `design-sources/` mappában vannak – ez **nem** kerül a buildbe.
- **`.htaccess`:** HTTPS-átirányítás, teljes Content-Security-Policy, HSTS, gyorsítótárazás és tömörítés. Ha új külső szolgáltatást (pl. térkép, analitika, videó) építesz be, a CSP-ben engedélyezni kell a domainjét.
  A HSTS-t csak akkor hagyd bent, ha a HTTPS minden aldomainen működik.
- A kritikus CSS inline-olása ki van kapcsolva (`angular.json`), mert az `onload` attribútumot a szigorú CSP blokkolná.
- **Közösségi megosztás:** `public/og-image.jpg` (1200×630) – Facebook/LinkedIn/Messenger előnézet.
- **Oldaltérkép:** egyetlen forrás, a backend állítja elő: `/sitemap.xml` (a `.htaccess` a Laravelhez irányítja). Új nyilvános oldalnál a backend `config/portfolio.php` → `seo_pages` listáját is bővítsd.
- **CI:** `.github/workflows/ci.yml` – minden push után `npm audit` és éles build.
- **Bot-védelem (Cloudflare Turnstile):** `components/turnstile` – az ajánlatkérő űrlapon és kvízen, az időpontfoglaláson, a hírlevélen, az admin belépésen és az elfelejtett jelszó oldalon. A nyilvános kulcsot a backend adja (`/api/site-settings` → `turnstile_site_key`); ha nincs beállítva, a widget nem jelenik meg, és a szkript sem töltődik be. A CSP-ben a `challenges.cloudflare.com` engedélyezve van (`script-src`, `frame-src`).

## V17 újdonságok

- **Nyelvválasztó (HU/EN):** `src/app/i18n/`. A kulcs maga a magyar szöveg (`{{ 'Szöveg' | t }}`), a fordítás az `en.ts`-ben van; hiányzó fordításnál a magyar szöveg jelenik meg. Az angol szótár csak angol nézetben töltődik le. Az angol oldalak az `/en/` alatt vannak, angol slugokkal (pl. `/en/request-a-quote`); a címpárok egy helyen: `src/app/core/site-routes.ts`. Sablonban a belső linket magyar útvonallal és az `lp` pipe-pal írd: `[routerLink]="'/ajanlatkeres' | lp"`. A régi `?lang=en` linkeket a `.htaccess` 301-gyel átirányítja. Új szöveg felvételekor tedd a `| t` pipe mögé, és vedd fel az angol megfelelőjét az `en.ts`-be. A szolgáltatások és referenciák angol szövegét az adminban, a szerkesztő „Angol változat” részében adhatod meg. 
- **Toast-értesítések:** `ToastService` (`success` / `error` / `info`) – bárhonnan hívható.
- **Admin:** kötelező 2FA kijelzése, munkamenetek; olvasatlan ügyfélüzenet-jelző (✉), percenkénti háttérfrissítés; **Kész projektek** (domainek, lejáratok, böngészőben titkosított hozzáférés-széf); **Pénzügyek** (bevétel, kiadás, ÁFA, becsült átalányadó); előleg és Stripe-előfizetés kezelése.
- **Ügyfélportál:** előleg és havi karbantartás fizetése bankkártyával (Stripe), ÁSZF-elfogadás, fogyasztói hozzájárulás a korai teljesítéshez.
- **Új oldalak:** `/aszf`, `/fizetes/sikeres`, `/fizetes/megszakitva`.
- **Süti-kezelés:** a süti-sáv csak akkor jelenik meg, ha az adminban be van állítva Google-vélemények widget (Trustindex); a widget csak hozzájárulás után töltődik be.
- **Mobil:** a telefonos adminban a navigáció a ☰ menüből nyílik (az ikonsáv nem veszi el a helyet), az ikonok iOS-en sem jelennek meg színes emojiként.

## Valós API-kapcsolat ellenőrzése

Futtasd: `npm run check:api`. A részletes hibaelhárítás: `LARAVEL_KAPCSOLAT_ELLENORZES.md`. Fejlesztéskor a proxy már `ng serve`-vel is aktív.

## v20 – biztonsági frissítés (2026-10-28)

- **CSP élesítve** (`.htaccess`): a `Content-Security-Policy-Report-Only` helyett kényszerített `Content-Security-Policy`. Inline szkript és `eval` tiltva. Ha egy új külső szolgáltatás (pl. widget) nem töltődik be, a böngésző konzolja (F12) kiírja, melyik címet kell felvenni a szabályba.
- **Hitelesítő alkalmazásos belépés (TOTP)**: Admin → Fiók és biztonság → *Hitelesítő alkalmazás*. A belépési oldal a 6 jegyű app-kódot és a helyreállítási kódot is elfogadja.
- **Kisebb build**: a `public/demos` alól törölve a ~12 MB-nyi, sehol nem hivatkozott eredeti JPG/PNG (az eredetik a `design-sources` mappában megvannak). A buildbe csak a használt WebP képek kerülnek.
- A backend v20 kell hozzá (migráció: `bash deploy.sh`).

## SEO: többnyelvű címek és statikus prerender (2026-10)

**Címek.** Magyar oldalak a gyökérben, angolok az `/en/` alatt (`/weboldal-keszites` ↔ `/en/website-development`). A címpárok egyetlen forrása a `src/app/core/site-routes.ts`. A nyelvet a nyilvános oldalakon az URL határozza meg; a nyelvváltó gomb az oldal másik nyelvű párjára navigál. Nincs automatikus böngészőnyelv szerinti átirányítás.

**Szolgáltatási céloldalak.** `/weboldal-keszites`, `/landing-oldal-keszites`, `/webshop-keszites`, `/egyedi-webfejlesztes`, `/weboldal-karbantartas` (és angol párjaik). A szövegük nyelvenként a `src/app/pages/service/service-content.ts` fájlban van. Csak valós, vállalható állítást írj bele.

**Prerender.** Az `npm run build` az Angular build után lefuttatja a `scripts/prerender.mjs` szkriptet. Ez minden nyilvános oldalhoz és nyelvhez külön HTML-t készít a `dist/…/browser/_p/` mappába, saját címmel, leírással, canonicallal, hreflanggal, strukturált adattal és az oldal fő szövegével. Így a keresők és a JavaScriptet nem futtató robotok is a helyes tartalmat kapják. A `.htaccess` a `/ajanlatkeres` kérést a `_p/ajanlatkeres.html` fájlból szolgálja ki. Node.js a tárhelyen nem kell.
- A referenciákat (`/munkak/…`) a szkript az éles API-ból kéri le (`PRERENDER_API_URL`, alapértelmezés: `https://megyerimarkmate.hu/api`). Ha az API nem érhető el, a referenciák kimaradnak a prerenderből, de az oldalon továbbra is működnek. **Új referencia publikálása után érdemes újra buildelni és feltölteni**, hogy annak is legyen saját statikus HTML-je.
- **Feltöltéskor a `_p` mappát is másold fel** (a `dist/megyeri-webfejlesztes/browser` teljes tartalmát), és a régi `sitemap.xml` fájlt töröld a tárhelyről, ha ott maradt (a `/sitemap.xml`-t a backend adja).
- Ellenőrzés élesítés után: `curl -s https://megyerimarkmate.hu/en/website-development | grep -i "<title>\|canonical\|hreflang"`

**Élesítés utáni teendők (Search Console).** Domain-tulajdon igazolása (DNS TXT) a Google Search Console-ban és a Bing Webmaster Toolsban, majd a `https://megyerimarkmate.hu/sitemap.xml` beküldése. Az URL-ellenőrzővel nézz meg néhány új oldalt (pl. `/en`, `/weboldal-keszites`), és kérj indexelést.
