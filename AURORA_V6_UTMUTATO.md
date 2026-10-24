# Aurora V6 – új interaktív megjelenés

Ez a csomag a korábbi Angular 20 projekted kibővítése. A Laravel API, az adminfelület, az ajánlatkérő, az ügyfélportál és az eredeti útvonalak megmaradnak. A backend ZIP-et nem kell lecserélned kizárólag ezekhez a vizuális változtatásokhoz.

## Újdonságok

1. **Végtelen Aurora Marquee:** A Hero alatt a négy értékajánlat folyamatosan, balra halad. A tartalom kétszer szerepel a DOM-ban a hézagmentes mozgásért; a második másolat rejtve van a képernyőolvasók elől. Egérrel fölé állva megáll.
2. **Interaktív WebGL Hero:** A korábbi, túl nagy 3D-csomót egy visszafogott, shader-alapú holografikus gyűrű váltotta fel. A dekoráció a laptop mögött marad, az egérmozgás finoman változtatja a forgatását. Nem kell hozzá Three.js vagy új NPM-csomag.
3. **Cinematic Scroll:** A kártyák és szekcióelemek finoman, váltakozó irányból jelennek meg. A folyamatbemutató asztali nézetben tapadó (sticky) bevezetőt kapott, néhány fényhatás pedig böngészőtámogatás esetén a görgetéshez igazodik.
4. **Húzható előtte–utána:** A két dizájn egymásra rétegzett, billentyűzettel is vezérelhető csúszkával. Az „Előtte” és „Utána” gombok továbbra is működnek.
5. **Aurora Live Studio:** A látogató megadhatja vállalkozása nevét és a főcímet. A meglévő iparág-, elrendezés-, szín-, betűhangulat- és funkcióválasztások továbbra is működnek, az előnézet pedig azonnal reagál.
6. **Projektösszefoglaló:** A tervezőből a böngésző nyomtatási menüjével PDF-be menthető a választásokat tartalmazó összefoglaló. A koncepció adatai továbbvihetők az ajánlatkérőbe; a vállalkozásnév és az egyedi főcím nem kerül az URL-be.
7. **Mobilnavigáció és témaváltás:** A menü korábban, 1220 px-nél mobilnézetre vált; a kisebb szélességeken a márkafelirat is alkalmazkodik. A navbar és a Hero világos módja javult.
8. **Nyilvános footer:** Az admin belépési hivatkozás nem jelenik meg a publikus láblécben; a `/admin/bejelentkezes` URL változatlanul használható.

## Kipróbálás

```bash
npm ci
npm start
```

Nyisd meg a `http://localhost:4200` címet, majd ellenőrizd:

- Főoldal: animált értéksáv, 3D Hero, előtte–utána csúszka, szekciók megjelenése.
- `/tervezo`: válassz célt, stílust és iparágat; adj meg vállalkozásnevet és főcímet; nézd meg mobilon is.
- `/tervezo`: kattints a projektösszefoglaló mentésére, és válaszd a böngésző „Mentés PDF-ként” lehetőségét.
- `/ajanlatkeres`: a tervezőből kattintva ellenőrizd az előtöltött adatokat.
- Főoldal mobilon és tableten: különösen 320, 375, 768 és 1024 px szélességeken.
- Kapcsold be az operációs rendszerben a csökkentett mozgást, majd frissítsd az oldalt.

## Fontos élesítési teendők

- A Laravel adatkapcsolatot és a valós e-mail-kézbesítést külön end-to-end módon ellenőrizd.
- Az adatkezelési tájékoztató a korábbi projektben továbbra is **TERVEZET**: éles ajánlatkérés előtt véglegesítendő.
- Még nem került be Google Analytics/konverziókövetés, új ügyfélszerző SEO-aloldal vagy automatikus ügyfél-utánkövetési backend. Ezek külön, adatvédelmi és üzleti döntéseket igénylő fejlesztési ütemek.
- A Sass `@import` elavulási figyelmeztetései és a régi, nagy főoldali SCSS-fájl méretfigyelmeztetése nem akadályozzák a production fordítást, de későbbi CSS-rendezés javasolt.

## Módosított fájlok

- `src/app/pages/home/home.html`, `home.scss`, `home.ts`
- `src/app/components/hero/hero.html`, `hero.scss`, `hero.ts`
- `src/app/components/hero-sculpture/hero-sculpture.ts`
- `src/app/directives/premium-reveal.ts`
- `src/app/pages/studio/studio.html`, `studio.scss`, `studio.ts`
- `src/app/pages/quote/quote.ts`
- `src/app/components/navbar/navbar.scss`
- `src/aurora-v5.scss`, `src/styles.scss`
