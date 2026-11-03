import { expect, test } from '@playwright/test';
import { mockApi } from './api-mock';

/**
 * A legfontosabb látogatói folyamatok füsttesztje. Ha valamelyik elbukik, egy módosítás eltörte
 * az ajánlatkérést, a foglalást, a nyelvváltást vagy a mérést – élesítés előtt javítandó.
 */

async function fillQuote(page: import('@playwright/test').Page, continueLabel: RegExp, submitLabel: RegExp): Promise<void> {
    // 1. lépés: weboldal típusa
    await page.locator('.type-card').first().click();
    await page.getByRole('button', { name: continueLabel }).click();
    // 2. lépés: stílus
    await page.locator('.style-card').first().click();
    await page.getByRole('button', { name: continueLabel }).click();
    // 3. lépés: leírás
    await page.locator('#project-description').fill('Céges weboldalt szeretnék online időpontfoglalással.');
    await page.getByRole('button', { name: continueLabel }).click();
    // 4. lépés: kapcsolattartás
    await page.locator('#name').fill('Teszt Elek');
    await page.locator('#email').fill('teszt.elek@example.com');
    await page.locator('.quote-page input[type="checkbox"]').last().check();
    await page.getByRole('button', { name: submitLabel }).click();
}

test('ajánlatkérés magyarul: végigmegy és magyar nyelvet küld', async ({ page }) => {
    const api = await mockApi(page);
    await page.goto('/ajanlatkeres');
    await fillQuote(page, /Folytatás/, /Ajánlatkérés elküldése/);

    await expect(page.locator('.sent-card')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Köszönöm a bizalmad!' })).toBeVisible();
    expect(api.quotes).toHaveLength(1);
    expect(api.quotes[0]).toMatchObject({ customer_name: 'Teszt Elek', email: 'teszt.elek@example.com', lang: 'hu', privacy_notice_acknowledged: true });
});

test('ajánlatkérés angolul: angol nyelvet küld (angol levelek)', async ({ page }) => {
    const api = await mockApi(page);
    await page.goto('/en/request-a-quote');
    await fillQuote(page, /Continue/, /Send quote request/);

    await expect(page.locator('.sent-card')).toBeVisible();
    expect(api.quotes[0]).toMatchObject({ lang: 'en' });
});

test('konzultációfoglalás: időpont kiválasztása és foglalás', async ({ page }) => {
    const api = await mockApi(page);
    await page.goto('/konzultacio');
    await page.locator('.slot').first().click();
    await page.locator('#booking-name').fill('Teszt Elek');
    await page.locator('#booking-email').fill('teszt.elek@example.com');
    await page.locator('.booking-consent input[type="checkbox"]').check();
    await page.locator('.book-btn').click();

    await expect(page.locator('.booking-success')).toBeVisible();
    await expect(page.locator('.booking-success')).toContainText('#31');
    expect(api.bookings).toHaveLength(1);
    expect(api.bookings[0]).toMatchObject({ consultation_slot_id: 7, customer_name: 'Teszt Elek', lang: 'hu' });
});

test('útmutató: a nyelvváltó az angol cikkre visz, és vissza', async ({ page }) => {
    await mockApi(page);
    await page.goto('/utmutatok/weboldal-keszites-lepesei');
    await expect(page.locator('h1')).toContainText('Weboldal készítés lépésről lépésre');

    await page.locator('.lang-btn').click();
    await expect(page).toHaveURL(/\/en\/guides\/website-development-steps$/);
    await expect(page.locator('h1')).toContainText('Building a website step by step');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    await page.locator('.lang-btn').click();
    await expect(page).toHaveURL(/\/utmutatok\/weboldal-keszites-lepesei$/);
});

test('angol útmutató-gyűjtőoldal: minden cikk angol címre mutat', async ({ page }) => {
    await mockApi(page);
    await page.goto('/en/guides');
    const links = page.locator('.guide-card');
    await expect(links).toHaveCount(4);
    for (const href of await links.evaluateAll(els => els.map(e => e.getAttribute('href')))) expect(href).toMatch(/^\/en\/guides\/[a-z-]+$/);
});

test('telefon- és e-mail-kattintás mérése', async ({ page }) => {
    const api = await mockApi(page);
    await page.goto('/');
    // a tel:/mailto: linkre kattintás ne nyisson tárcsázót / levelezőt a tesztben
    await page.evaluate(() => {
        for (const href of ['tel:+3630000000', 'mailto:hello@example.com']) {
            const a = document.createElement('a'); a.href = href; a.textContent = href; a.className = 'e2e-link';
            a.addEventListener('click', e => e.preventDefault());
            document.body.appendChild(a);
        }
    });
    await page.locator('.e2e-link').nth(0).click();
    await page.locator('.e2e-link').nth(1).click();
    await expect.poll(() => api.events.map(e => e['event'])).toEqual(expect.arrayContaining(['phone_click', 'email_click']));
});

test('ismeretlen cím: „nem található” oldal', async ({ page }) => {
    await mockApi(page);
    await page.goto('/ez-az-oldal-nem-letezik');
    await expect(page.locator('body')).toContainText(/nem található|404/i);
});

test('mobil: a görgetés után megjelenő gyors ajánlatkérés sáv a hívás gombbal @mobile', async ({ page }) => {
    await mockApi(page, { phone: '+36 30 000 0000' });
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, 2000));
    const bar = page.locator('.mobile-cta');
    await expect(bar).toBeVisible();
    await expect(bar.locator('.mobile-cta__main')).toBeVisible();
    const call = bar.locator('.mobile-cta__call');
    await expect(call).toHaveAttribute('href', /^tel:/);
    // a felirat színe ne egyezzen a háttérrel (világos módban korábban fehér volt fehéren)
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    const colors = await call.evaluate(el => { const s = getComputedStyle(el); return [s.color, s.backgroundColor]; });
    expect(colors[0]).not.toBe(colors[1]);
});

test('kikapcsolt animációknál (Windows „animációs effektusok: ki”) a főcím van elöl, a kártyák utána', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    await mockApi(page);
    await page.goto('/');
    const title = await page.locator('#hero-title').boundingBox();
    const firstCard = await page.locator('.fpanel').first().boundingBox();
    const rock = await page.locator('.flight-core').boundingBox();
    expect(title && firstCard && rock).toBeTruthy();
    expect(title!.y).toBeLessThan(firstCard!.y);
    // a kristályszikla a nyitóképen marad, nem lóg rá a kártyákra
    expect(rock!.y + rock!.height).toBeLessThan(firstCard!.y);
    await context.close();
});

test('akciós sáv: világos módban is jól olvasható', async ({ page }) => {
    await mockApi(page, { promo: { percent: 15, title: 'Őszi akció' } });
    await page.addInitScript(() => { try { localStorage.setItem('mm-theme', 'light'); } catch { /* */ } });
    await page.goto('/');
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    const bar = page.locator('.promo-bar');
    await expect(bar).toBeVisible();
    await expect(bar).toContainText('−15%');
    // sötét háttér, világos szöveg – a palettától függetlenül (korábban világos módban kifehéredett)
    const [text, bg] = await bar.evaluate(el => { const s = getComputedStyle(el); return [s.color, s.backgroundImage]; });
    expect(bg).toContain('rgb(25, 39, 96)');
    expect(text).toBe('rgb(238, 241, 247)');
});

test('angol ajánlatkérő: a funkciók, a költségkeret és a mezőszövegek is angolul', async ({ page }) => {
    await mockApi(page);
    await page.goto('/en/request-a-quote');
    await page.locator('.type-card').first().click();
    await page.getByRole('button', { name: /Continue/ }).click();
    await page.locator('.style-card').first().click();
    await page.getByRole('button', { name: /Continue/ }).click();
    await expect(page.locator('.feature-grid')).toContainText('Contact form');
    await expect(page.locator('.feature-grid')).not.toContainText('Kapcsolatfelvételi');
    await expect(page.locator('#inspirations')).toHaveAttribute('placeholder', /example\.com/);
    await page.locator('#project-description').fill('A company website with booking.');
    await page.getByRole('button', { name: /Continue/ }).click();
    await expect(page.locator('#budget option').first()).toHaveText(/Not sure yet/);
    await expect(page.locator('#budget')).not.toContainText('ezer Ft');
});

test('Google-vélemények: értékelés, kártyák és forrásmegjelölés a főoldalon', async ({ page }) => {
    await mockApi(page);
    await page.route('**/api/google-reviews', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: {
        name: 'Teszt', rating: 4.9, count: 12, url: 'https://maps.google.com/?cid=1',
        reviews: [{ author: 'Kiss Anna', author_url: 'https://www.google.com/maps/contrib/1', rating: 5, text: 'Nagyon gyors és pontos munka!', published_at: '2026-10-28' }],
    } }) }));
    await page.goto('/');
    const section = page.locator('#velemenyek');
    await section.scrollIntoViewIfNeeded();
    await expect(section.locator('.g-rating')).toHaveText('4,9');
    await expect(section).toContainText('12 Google-értékelés alapján');
    await expect(section.locator('.g-card')).toContainText('Nagyon gyors és pontos munka!');
    await expect(section.locator('.g-card a[href="https://www.google.com/maps/contrib/1"]')).toContainText('Kiss Anna');
    await expect(section.locator('.g-all')).toHaveAttribute('href', 'https://maps.google.com/?cid=1');
});
