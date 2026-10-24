# Angular frontend – 2026. október 24-i frissítés

Ez a ZIP a **teljes Angular forrásprojekt**, nem pusztán egy javítófolt.

## Újdonságok

- E-mailes kétlépcsős adminbelépés támogatása, hatjegyű kód és újraküldés.
- Admin biztonsági központ: védelem kapcsolása, aktív munkamenetek és más eszközök kijelentkeztetése.
- Az ügyfélportál feltünteti a privát hozzáférési link lejáratát.
- Javított navigációs akadálymentesség és keskeny mobilnézetek kezelése.
- Az SPA Apache szabályai már a jelszó-visszaállítás és kétlépcsős belépés API-útvonalait is kivételezik.
- Alapvető biztonsági HTTP-válaszfejlécek.

## Frissítés

1. Készíts mentést a jelenlegi Angular-projektről.
2. Másold rá a ZIP tartalmát a meglévő Angular mappára, a saját módosításaidat előtte összehasonlítva.
3. Futtasd: `npm ci`, majd `npm run build` és `npm test -- --watch=false`.
4. Élesítéskor a `dist/megyeri-webfejlesztes/browser` könyvtár tartalma kerüljön a frontend webgyökérbe (ha a build ezt a kimenetet hozza létre).
5. Ellenőrizd mobilon a 320, 375, 430, 768 és 1280 pixeles nézeteket; valamint az admin bejelentkezést, az ügyféllinket és az ajánlatkérést.

## Fontos

- Az Angular `proxy.conf.json` csak helyi fejlesztéshez készült. Éles Apache/Rackhost rendszerben a Laravel PHP routingot külön kell beállítani.
- A kétlépcsős belépés kapcsolója alapból kikapcsolt; valós SMTP szükséges.
- Az `/adatkezeles` oldal jogi **tervezet** maradt, mert a tényleges adatkezelői adatok és megőrzési idők nem szerepelnek a feltöltött projektben. Élesítés előtt véglegesítendő.
- A Laravel ZIP melléklete tartalmazza a teljes szerveroldali frissítési és adatbázis-útmutatót.
