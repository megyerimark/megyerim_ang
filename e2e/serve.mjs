// Statikus kiszolgáló az e2e tesztekhez: a dist/ buildet adja, ismeretlen útvonalra az index.html-t (SPA).
// Az /api/ hívásokat a tesztek a böngészőben szimulálják (page.route), ide nem érkeznek.
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const root = join(process.cwd(), 'dist/megyeri-webfejlesztes/browser');
if (!existsSync(join(root, 'index.html'))) {
    console.error('Nincs build: előbb futtasd az „npm run build” parancsot.');
    process.exit(1);
}
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
    '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.txt': 'text/plain', '.xml': 'application/xml', '.webmanifest': 'application/manifest+json' };
const port = Number(process.argv[2] || 4310);

createServer((req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
    if (path.startsWith('/api') || path.startsWith('/sanctum')) { res.writeHead(404); res.end(); return; }
    let file = join(root, path);
    if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) file = join(root, 'index.html');
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
}).listen(port, () => console.log(`e2e szerver: http://localhost:${port}`));
