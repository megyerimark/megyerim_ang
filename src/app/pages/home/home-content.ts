/**
 * A főoldal statikus szövegei, amelyeket a build utáni prerender (scripts/prerender.mjs) is felhasznál a keresőknek
 * szánt HTML-hez. Futásidejű importot nem tartalmazhat. Kulcs = magyar szöveg; az angolt az i18n/en.ts adja.
 */
export const DEFAULT_HERO_HEADLINE = 'Ne csak jelen legyél online. Emelkedj ki.';
export const DEFAULT_HERO_DESCRIPTION = 'Prémium weboldalakat és egyedi webes rendszereket készítek vállalkozásoknak. Átgondolt megjelenés, könnyű kapcsolatfelvétel, személyes együttműködés.';

export const PROCESS_STEPS = [
    {
        number: '01',
        title: 'Megismerem a céljaidat',
        description: 'Rövid egyeztetés: kinek szól az oldal, milyen problémát oldjon meg, és mi számít sikernek.'
    },
    {
        number: '02',
        title: 'Kialakítjuk a koncepciót',
        description: 'Vizuális irány, oldaltérkép, felhasználói út és az elvárt funkciók pontosítása.'
    },
    {
        number: '03',
        title: 'Megépítem és finomítjuk',
        description: 'Fejlesztés, reszponzív kialakítás, közös visszajelzések és tesztelés.'
    },
    {
        number: '04',
        title: 'Élesítünk és támogatlak',
        description: 'Átadás, beállítások, betanítás és igény esetén későbbi karbantartás.'
    }
];

export const FAQS = [
    {
        question: 'Mennyibe kerül egy egyedi weboldal?',
        answer: 'Az ár a funkcióktól, a tartalom mennyiségétől és a tervezési igénytől függ. Az ajánlatkérőben megadhatod a költségkeretedet, és ahhoz igazítva egyeztetünk.'
    },
    {
        question: 'Mennyi idő alatt készül el?',
        answer: 'Az ütemezést az igények, a jóváhagyások és a szükséges tartalmak alapján határozzuk meg. A részleteket még a fejlesztés előtt tisztázzuk.'
    },
    {
        question: 'Később is módosítható a weboldal?',
        answer: 'Igen. A későbbi módosítások és az igény szerinti rendszeres karbantartás is egyeztethető.'
    },
    {
        question: 'Csak egyszerű bemutatkozó oldalt készítesz?',
        answer: 'Nem. Egyedi funkciók, adminfelületek és adatbázishoz kapcsolódó webes rendszerek tervezésére is kérhetsz ajánlatot.'
    },
    {
        question: 'Mi történik, miután elküldtem az ajánlatkérést?',
        answer: 'Átnézem, amit leírtál, és e-mailben vagy a megadott módon felveszem veled a kapcsolatot. Ha kell, rövid egyeztetéssel pontosítjuk az igényeket, majd írásos ajánlatot kapsz – ez nem kötelez semmire.'
    },
    {
        question: 'Nem tudom pontosan, mire van szükségem. Kérhetek így ajánlatot?',
        answer: 'Igen. A kvíz és az ajánlatkérő is segít rendszerezni az elképzeléseidet, a hiányzó részleteket pedig közösen tisztázzuk.'
    }
];
