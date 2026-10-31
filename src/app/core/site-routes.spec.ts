import { hasEnglish, isPublicPath, langOfPath, localizePath, toHuPath } from './site-routes';

describe('site-routes (HU ↔ EN címek)', () => {
    it('a magyar címből angolt és vissza képez, megőrizve a lekérdezést és a horgonyt', () => {
        expect(localizePath('/', 'en')).toBe('/en');
        expect(localizePath('/ajanlatkeres?type=webshop', 'en')).toBe('/en/request-a-quote?type=webshop');
        expect(localizePath('/#szolgaltatasok', 'en')).toBe('/en#szolgaltatasok');
        expect(localizePath('/munkak/abc', 'en')).toBe('/en/work/abc');
        expect(localizePath('/en/website-development', 'hu')).toBe('/weboldal-keszites');
        expect(localizePath('/en#munkak', 'hu')).toBe('/#munkak');
        expect(localizePath('/en/request-a-quote', 'en')).toBe('/en/request-a-quote');
    });

    it('a privát oldalak címe nem változik', () => {
        expect(localizePath('/admin', 'en')).toBe('/admin');
        expect(localizePath('/ugyfel/projekt?token=x', 'en')).toBe('/ugyfel/projekt?token=x');
    });

    it('a nyelvet csak a nyilvános oldalaknál veszi az URL-ből', () => {
        expect(langOfPath('/en')).toBe('en');
        expect(langOfPath('/en/work/abc')).toBe('en');
        expect(langOfPath('/')).toBe('hu');
        expect(langOfPath('/munkak/abc')).toBe('hu');
        expect(langOfPath('/weboldal-keszites/')).toBe('hu');
        expect(langOfPath('/admin')).toBeNull();
        expect(langOfPath('/ugyfel/projekt')).toBeNull();
    });

    it('nyilvános oldalak és angol változatok', () => {
        expect(toHuPath('/en/privacy-policy')).toBe('/adatkezeles');
        expect(isPublicPath('/en/webshop-development')).toBeTrue();
        expect(isPublicPath('/admin')).toBeFalse();
        expect(hasEnglish('/aszf')).toBeTrue();
        expect(hasEnglish('/fizetes/sikeres')).toBeFalse();
    });
});
