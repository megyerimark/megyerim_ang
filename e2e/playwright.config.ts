import { defineConfig, devices } from '@playwright/test';

/**
 * Böngészős „füstteszt” a legfontosabb folyamatokra (ajánlatkérés, konzultációfoglalás, nyelvváltás, kattintásmérés).
 * A kész buildet (npm run build) szolgálja ki egy kis statikus szerver; az API-t a tesztek maguk szimulálják,
 * így se backend, se adatbázis nem kell hozzá, és élő adat sem keletkezik.
 *
 * Futtatás:  npm run build  →  npx playwright install chromium (egyszer)  →  npm run e2e
 */
const PORT = Number(process.env['E2E_PORT'] || 4310);

export default defineConfig({
    testDir: '.',
    timeout: 30_000,
    expect: { timeout: 7_000 },
    fullyParallel: true,
    retries: process.env['CI'] ? 1 : 0,
    reporter: [['list']],
    use: {
        baseURL: `http://localhost:${PORT}`,
        trace: 'retain-on-failure',
        locale: 'hu-HU',
        timezoneId: 'Europe/Budapest',
        // a görgetési animációk ne lassítsák / zavarják a teszteket
        reducedMotion: 'reduce',
        ...(process.env['PW_CHROMIUM_PATH'] ? { launchOptions: { executablePath: process.env['PW_CHROMIUM_PATH'] } } : {}),
    },
    projects: [
        { name: 'desktop', use: { ...devices['Desktop Chrome'] }, grepInvert: /@mobile/ },
        { name: 'mobile', use: { ...devices['Pixel 7'] }, grep: /@mobile/ },
    ],
    webServer: {
        command: `node e2e/serve.mjs ${PORT}`,
        cwd: '..',
        url: `http://localhost:${PORT}/`,
        reuseExistingServer: !process.env['CI'],
        timeout: 20_000,
    },
});
