# Telepítés és ellenőrzés – Megyeri Márk | Webfejlesztés

## 1. Projekt elhelyezése

A ZIP **csak az Angular frontend** teljes forrását tartalmazza. A már működő Laravel backendet **nem írja felül**.

A kibontott `megyerimarkmate-main/` mappát használhatod külön frontend projektként, vagy a meglévő Angular mappádat frissítheted a kibontott projekt tartalmával. Előbb készíts másolatot a meglévő mappádról. Ne másold át a `node_modules` mappát; a csomag nem tartalmazza.

## 2. Két terminál

**Backend (a működő Laravel projektedben):**

```bash
php artisan migrate
php artisan storage:link
php artisan serve --host=localhost --port=8000
```

**Frontend (a kibontott Angular projektben):**

```bash
npm ci
npm start
```

Megnyitás: **http://localhost:4200**. A `npm start` a mellékelt `proxy.conf.json` fájllal indítja az Angular szervert; ezt ne hagyd el, különben a Sanctum belépés és ajánlatküldés hibás lehet.

## 3. Laravel környezet

A `.env` fájlodat **ne oszd meg**, és ne másold a frontendbe. A teszteléshez jellemzően az alábbi beállításokra van szükség (saját adatbázis és SMTP beállítások mellett):

```dotenv
APP_URL=http://localhost:8000
SANCTUM_STATEFUL_DOMAINS=localhost:4200,localhost:8000
SESSION_DRIVER=database
```

Mindkét szervert `localhost` névvel használd, ne keverd a `127.0.0.1` címmel. Szükség esetén `php artisan optimize:clear`. Az API útvonalakat: `php artisan route:list --path=api`.

## 4. Tesztelési forgatókönyv

1. Nyisd meg a főoldalt. Kapcsolgasd a világos/sötét témát, frissítsd a böngészőt. Maradjon meg a választás.
2. Nyisd meg a 4 lépéses ajánlatkérőt, próbáld ki az üres mezőket és a kötelező adatokat.
3. Küldj be tesztadatokat; egy **201-es** sikeres válasz és egy hivatkozási azonosító szükséges. A Laravel adatbázisban meg kell jelenjen.
4. `/admin/bejelentkezes`: próbálj hibás és helyes jelszóval belépni.
5. Dashboard: az új megkeresés megjelenik. Ajánlat listában változtass státuszt, írj megjegyzést, állíts be HUF összeget.
6. Admin > Szolgáltatások: hozz létre szolgáltatást, állítsd aktívra, főoldalon jelenjen meg.
7. Admin > Referenciák: hozz létre „demó” referenciát, adj hozzá JPEG/PNG/WebP képet, publikáld, majd ellenőrizd a nyilvános portfólióban.
8. Admin > Beállítások: módosítsd a Hero szövegét, majd frissítsd a publikus főoldalt.
9. Jelentkezz ki: `/api/admin/me` kérés többé ne adjon vissza adminadatokat, a védett `/admin` útvonal irányítson át a bejelentkezésre.
10. Próbáld a teljes folyamatot telefonméretben is; teszteld a validációs hibákat és a képernyőn megjelenő hibaüzeneteket.

## 5. Build és tesztek

```bash
npm run build
npm test
```

A csomag összeállítási környezetében npm-regiszter hálózati hiba miatt nem voltak letölthetők az Angular csomagok, így **a teljes Angular build és a Karma-böngészőtesztek itt nem futottak le**. A TypeScript-források szintaktikai ellenőrzése és a HTML-tagstruktúra ellenőrzése sikeres. Ha a saját gépeden hibát kapsz, a pontos terminálkimenet alapján érdemes javítani.

## 6. Élesítés előtti blokkolók

- A `/adatkezeles` oldal **csak tervezet**, nem végleges adatkezelési tájékoztató. A dokumentumot és az adatkezelés jogalapjait, megőrzési idejét, kontaktokat élesítés előtt véglegesíteni kell.
- Teszteld az SMTP értesítéseket és a rate-limit/spamvédelmet.
- Production-domainen HTTPS, cookie-, reverse proxy-, XSRF/CSRF-, CORS- és session-beállítások ellenőrzése szükséges.
- A jelenlegi Hero CSS-perspektívás animációt használ; a külön Three.js/WebGL jelenet **nem része ennek a csomagnak**.
- Mobil-, teljesítmény-, hozzáférhetőségi és biztonsági tesztek élesítés előtt kötelezők.
