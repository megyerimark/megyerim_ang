#!/usr/bin/env node
/**
 * Ünnepi illusztrációk – `npm run seasonal-art` → public/seasonal/*.svg|webp (Playwright kell hozzá)
 * Procedurálisan rajzolt, árnyékolt vektorgrafikák (fenyő, díszfa, tulipán, hímes tojás, kokárda, fű, hó).
 * A „véletlen” determinisztikus, így újrafuttatva ugyanaz az eredmény. A fájlokat kézzel ne szerkeszd.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'seasonal');
mkdirSync(OUT, { recursive: true });
const f = n => +n.toFixed(1);
function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
const lerp = (a, b, t) => a + (b - a) * t;
function mix(c1, c2, t) {
    const p = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
    const [a, b] = [p(c1), p(c2)];
    return '#' + a.map((v, i) => Math.round(lerp(v, b[i], t)).toString(16).padStart(2, '0')).join('');
}
const svg = (w, h, body, extra = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"${extra}>${body}</svg>\n`;
const save = (name, content) => { writeFileSync(join(OUT, name), content); console.log(name.padEnd(22), (content.length / 1024).toFixed(1), 'KB'); };

/* ======================= FENYŐ ======================= */
function fir({ seed, tiers = 9, decorated = false }) {
    const r = rng(seed), W = 200, H = 330, top = 18, baseY = 288, out = [];
    const dark = '#0a2a1c', mid = '#15543a', tip = '#3f8a5c', tipLight = '#6fae7f';
    out.push(`<defs>
<linearGradient id="trunk" x1="0" x2="1"><stop offset="0" stop-color="#2a1a10"/><stop offset=".45" stop-color="#5a3b26"/><stop offset="1" stop-color="#22150c"/></linearGradient>
<radialGradient id="core" cx=".42" cy=".55" r=".6"><stop offset="0" stop-color="#0f3a28"/><stop offset="1" stop-color="#06190f"/></radialGradient>
<linearGradient id="snow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#cfe0ec"/></linearGradient>
<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.4"/></filter>
<filter id="glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
${decorated ? `<radialGradient id="ballRed" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#ff8a8a"/><stop offset=".35" stop-color="#d81f2e"/><stop offset="1" stop-color="#5e0710"/></radialGradient>
<radialGradient id="ballGold" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff3c4"/><stop offset=".35" stop-color="#e2b33f"/><stop offset="1" stop-color="#6b4a0c"/></radialGradient>
<radialGradient id="ballSilver" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#ffffff"/><stop offset=".4" stop-color="#b9c6d3"/><stop offset="1" stop-color="#3e4a57"/></radialGradient>
<radialGradient id="starG" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="#fffbe6"/><stop offset=".5" stop-color="#ffd76a"/><stop offset="1" stop-color="#c98d14"/></radialGradient>` : ''}
</defs>`);
    if (decorated) out.push(`<style>.l{animation:tw 2.8s ease-in-out infinite}@keyframes tw{0%,100%{opacity:1}50%{opacity:.35}}.s{animation:sg 3.2s ease-in-out infinite;transform-origin:100px 14px}@keyframes sg{50%{transform:scale(1.08)}}@media (prefers-reduced-motion:reduce){.l,.s{animation:none}}</style>`);
    // törzs
    out.push(`<rect x="91" y="${baseY - 14}" width="18" height="${H - baseY + 10}" rx="3" fill="url(#trunk)"/>`);
    out.push(`<path d="M95 ${baseY}v30M101 ${baseY + 4}v24M105 ${baseY}v28" stroke="#1a0f08" stroke-width=".8" opacity=".6"/>`);
    // sötét mag (a fa belseje, a mélységérzethez)
    out.push(`<path d="M100 ${top}L${f(100 + 86)} ${baseY}Q100 ${baseY + 10} ${f(100 - 86)} ${baseY}Z" fill="url(#core)"/>`);
    const snow = [], lights = [], balls = [];
    for (let k = 0; k < tiers; k++) {
        const t = k / (tiers - 1);
        const y0 = lerp(top + 4, baseY - 40, Math.pow(t, .9));
        const half = lerp(14, 92, Math.pow(t, .85)) * (0.92 + r() * .16);
        const droop = lerp(14, 44, t);
        const nb = Math.round(lerp(8, 24, t));
        // hátsó, majd első ágak (a hátsók sötétebbek)
        for (const layer of [0, 1]) {
            for (let i = 0; i < nb; i++) {
                const side = i % 2 ? 1 : -1;
                const reach = half * (0.55 + r() * 0.45) * (layer ? 1 : 0.85);
                const sx = 100 + side * r() * 6, sy = y0 + r() * 6;
                const ex = 100 + side * reach, ey = sy + droop * (0.6 + r() * 0.5) + (layer ? 0 : -4);
                const cx = lerp(sx, ex, .55), cy = sy - droop * .25;
                const light = layer ? (side < 0 ? .85 : .55) * (0.7 + r() * .3) : .2;
                const col = mix(mid, tip, light), needle = mix(col, tipLight, layer ? .35 * r() : 0);
                let d = `M${f(sx)} ${f(sy)}Q${f(cx)} ${f(cy)} ${f(ex)} ${f(ey)}`;
                out.push(`<path d="${d}" stroke="${mix(dark, col, .6)}" stroke-width="${f(lerp(2.6, 1.2, r()))}" fill="none" stroke-linecap="round"/>`);
                // tűlevelek: a bezier mentén, lefelé-kifelé
                let nd = '';
                const nn = Math.round(reach / 4.2);
                for (let j = 1; j <= nn; j++) {
                    const u = j / (nn + 1), px = (1 - u) ** 2 * sx + 2 * (1 - u) * u * cx + u * u * ex, py = (1 - u) ** 2 * sy + 2 * (1 - u) * u * cy + u * u * ey;
                    const len = lerp(5, 9, u) * (0.7 + r() * .5);
                    // az ág érintője ebben a pontban (a kvadratikus Bézier deriváltja), egységnyi hosszra
                    let tx = 2 * (1 - u) * (cx - sx) + 2 * u * (ex - cx), ty = 2 * (1 - u) * (cy - sy) + 2 * u * (ey - cy);
                    const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
                    // két tűlevél az érintőhöz képest ±40–55°-ban, kicsit lefelé húzva (a tűlevél „lóg”)
                    for (const s of [-1, 1]) {
                        const ang = s * (0.7 + r() * 0.26);
                        const nx = tx * Math.cos(ang) - ty * Math.sin(ang), ny = tx * Math.sin(ang) + ty * Math.cos(ang) + 0.35;
                        nd += `M${f(px)} ${f(py)}l${f(nx * len)} ${f(ny * len)}`;
                    }
                }
                out.push(`<path d="${nd}" stroke="${needle}" stroke-width=".9" opacity="${layer ? .95 : .6}" stroke-linecap="round" fill="none"/>`);
                // hó az első sor ágainak tetején
                if (layer && r() < .55) {
                    const u1 = .35 + r() * .2, u2 = Math.min(.98, u1 + .3 + r() * .25);
                    const P = u => [(1 - u) ** 2 * sx + 2 * (1 - u) * u * cx + u * u * ex, (1 - u) ** 2 * sy + 2 * (1 - u) * u * cy + u * u * ey];
                    const [ax, ay] = P(u1), [bx, by] = P((u1 + u2) / 2), [qx, qy] = P(u2), th = lerp(2.2, 4.2, r());
                    snow.push(`<path d="M${f(ax)} ${f(ay)}Q${f(bx)} ${f(by - th * 1.6)} ${f(qx)} ${f(qy)}Q${f(bx)} ${f(by + th * .2)} ${f(ax)} ${f(ay)}Z" fill="url(#snow)"/>`);
                }
                if (decorated && layer) {
                    if (r() < .3) lights.push([ex - side * r() * 6, ey - 2 - r() * 4, r() * 2.8]);
                    if (r() < .14 && k > 1) balls.push([lerp(sx, ex, .7), lerp(sy, ey, .7) + 5, ['ballRed', 'ballGold', 'ballSilver'][Math.floor(r() * 3)], lerp(5.5, 8.5, t)]);
                }
            }
        }
    }
    out.push(`<g filter="url(#soft)" opacity=".5" transform="translate(0 2.2)">${snow.map(s => s.replace('url(#snow)', '#9db8cc')).join('')}</g>`);
    out.push(snow.join(''));
    const overlay = [];
    if (decorated) {
        // égősor (meleg fény, ragyogással) – külön, animált rétegbe; a gömbök az alapképre
        overlay.push(`<g filter="url(#glow)">${lights.map(([x, y, d], i) => `<circle class="l" style="animation-delay:-${f(d)}s" cx="${f(x)}" cy="${f(y)}" r="2.6" fill="${i % 5 === 0 ? '#ffb4a8' : '#ffd98c'}"/>`).join('')}</g>`);
        for (const [x, y, g, rad] of balls) {
            out.push(`<path d="M${f(x)} ${f(y - rad - 6)}v6" stroke="#c8b06a" stroke-width=".6"/><rect x="${f(x - 1.6)}" y="${f(y - rad - 1.6)}" width="3.2" height="2.4" rx=".6" fill="#d9c07a"/>`);
            out.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(rad)}" fill="url(#${g})"/><ellipse cx="${f(x - rad * .35)}" cy="${f(y - rad * .4)}" rx="${f(rad * .28)}" ry="${f(rad * .18)}" fill="#fff" opacity=".85"/>`);
        }
        // csillag sugarakkal
        const pts = Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 5.4 : 13; return `${f(100 + Math.cos(a) * rr)} ${f(14 + Math.sin(a) * rr)}`; }).join(' ');
        overlay.push(`<g class="s"><g opacity=".55" filter="url(#glow)">${Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<path d="M100 14L${f(100 + Math.cos(a) * 26)} ${f(14 + Math.sin(a) * 26)}" stroke="#ffe7a3" stroke-width="${i % 2 ? .6 : 1.1}"/>`; }).join('')}</g><polygon points="${pts}" fill="url(#starG)" filter="url(#glow)"/><polygon points="${pts}" fill="none" stroke="#fff6cf" stroke-width=".6"/></g>`);
    }
    const defs = out[0];
    return { base: svg(W, H, out.filter(x => !x.startsWith('<style>')).join('')), overlay: decorated ? svg(W, H, defs + out.find(x => x.startsWith('<style>')) + overlay.join('')) : null };
}

/* ======================= TULIPÁN ======================= */
function tulip({ seed, petal, petalDark, petalLight }) {
    const r = rng(seed), W = 80, H = 240, lean = (r() - .5) * 10;
    const hx = 40 + lean, hy = 78;
    const defs = `<defs>
<linearGradient id="stem" x1="0" x2="1"><stop offset="0" stop-color="#2d6b2f"/><stop offset=".5" stop-color="#5fa752"/><stop offset="1" stop-color="#22561f"/></linearGradient>
<linearGradient id="leaf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7cbf69"/><stop offset=".6" stop-color="#3f8a3e"/><stop offset="1" stop-color="#1f5122"/></linearGradient>
<linearGradient id="pb" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${petalDark}"/><stop offset=".7" stop-color="${petal}"/><stop offset="1" stop-color="${petalLight}"/></linearGradient>
<linearGradient id="pf" x1="0" y1="1" x2=".3" y2="0"><stop offset="0" stop-color="${mix(petalDark, '#000000', .15)}"/><stop offset=".55" stop-color="${petal}"/><stop offset="1" stop-color="${petalLight}"/></linearGradient>
<radialGradient id="cupShade" cx=".5" cy=".95" r=".7"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
</defs>`;
    const stem = `<path d="M40 ${H}C40 ${H - 60} ${f(41 + lean * .3)} 140 ${f(hx)} ${hy + 30}" stroke="url(#stem)" stroke-width="4.2" fill="none" stroke-linecap="round"/>`;
    const leaf = (dir, y, len) => {
        const bx = 40, by = H - 6, tx = 40 + dir * (14 + r() * 10), ty = by - len;
        return `<path d="M${bx} ${by}C${f(bx + dir * 18)} ${f(by - len * .35)} ${f(tx + dir * 8)} ${f(ty + len * .3)} ${f(tx)} ${f(ty)}C${f(tx - dir * 2)} ${f(ty + len * .35)} ${f(bx + dir * 4)} ${f(by - len * .4)} ${bx + dir * 1} ${by}Z" fill="url(#leaf)"/>
<path d="M${bx} ${by}C${f(bx + dir * 12)} ${f(by - len * .4)} ${f(tx + dir * 3)} ${f(ty + len * .35)} ${f(tx)} ${f(ty)}" stroke="#1d4d20" stroke-width=".7" fill="none" opacity=".7"/>`;
    };
    // szirmok: hátsó kettő, első kettő, középső
    const P = (dx, w, h, tipX, grad) => `<path d="M${f(hx + dx - w)} ${f(hy + 8)}C${f(hx + dx - w * 1.1)} ${f(hy - h * .45)} ${f(hx + tipX - 3)} ${f(hy - h)} ${f(hx + tipX)} ${f(hy - h - 2)}C${f(hx + tipX + 3)} ${f(hy - h)} ${f(hx + dx + w * 1.1)} ${f(hy - h * .45)} ${f(hx + dx + w)} ${f(hy + 8)}C${f(hx + dx + w * .6)} ${f(hy + 28)} ${f(hx + dx - w * .6)} ${f(hy + 28)} ${f(hx + dx - w)} ${f(hy + 8)}Z" fill="url(#${grad})"/>`;
    const veins = Array.from({ length: 5 }, (_, i) => { const x = hx - 10 + i * 5; return `<path d="M${f(x)} ${hy + 22}Q${f(x + (i - 2) * 1.5)} ${hy} ${f(x + (i - 2) * 2.2)} ${hy - 20}" stroke="${petalDark}" stroke-width=".5" opacity=".35" fill="none"/>`; }).join('');
    const head = P(-7, 11, 34, -10, 'pb') + P(7, 11, 34, 10, 'pb') + P(0, 13, 38, 0, 'pb') + P(-6, 12, 30, -6, 'pf') + P(6, 12, 30, 6, 'pf')
        + `<ellipse cx="${f(hx)}" cy="${hy + 18}" rx="15" ry="9" fill="url(#cupShade)"/>` + veins
        + `<path d="M${f(hx - 9)} ${hy + 14}C${f(hx - 12)} ${hy} ${f(hx - 8)} ${hy - 16} ${f(hx - 4)} ${hy - 22}" stroke="#fff" stroke-width="1.6" opacity=".35" fill="none" stroke-linecap="round"/>`;
    // a fej a szár végén, valósághűbb arányban (kb. 1,5×)
    return svg(W, H, defs + leaf(-1, 0, 95 + r() * 30) + stem + leaf(1, 0, 80 + r() * 30) + `<g transform="translate(${f(hx)} ${hy + 22}) scale(1.5) translate(${f(-hx)} ${-(hy + 22)})">${head}</g>`);
}

/* ======================= HÍMES TOJÁS ======================= */
function egg({ base, baseDark, ink, motif }) {
    const W = 120, H = 156, path = 'M60 4C88 4 112 50 112 88 112 126 89 148 60 148 31 148 8 126 8 88 8 50 32 4 60 4Z';
    let art = '';
    const band = (y, h) => `<rect x="0" y="${y}" width="${W}" height="${h}" fill="${ink}"/>`;
    const zig = (y, amp, step) => { let d = `M0 ${y}`; for (let x = 0; x <= W; x += step) d += `L${x + step / 2} ${y - amp}L${x + step} ${y}`; return `<path d="${d}" stroke="${ink}" stroke-width="3.2" fill="none" stroke-linejoin="round"/>`; };
    const dots = (y, n, rad) => Array.from({ length: n }, (_, i) => `<circle cx="${f((i + .5) * W / n)}" cy="${y}" r="${rad}" fill="${ink}"/>`).join('');
    const tulipMotif = (cx, cy, s) => `<g transform="translate(${cx} ${cy}) scale(${s})" fill="${ink}"><path d="M0 -14C-4 -10-8-12-9-16-7-6-4-2 0 0 4-2 7-6 9-16 8-12 4-10 0-14Z"/><path d="M0 0V16" stroke="${ink}" stroke-width="2"/><path d="M0 10C-6 6-10 8-12 4-8 12-4 13 0 12ZM0 10C6 6 10 8 12 4 8 12 4 13 0 12Z"/></g>`;
    const star = (cx, cy, s) => `<g transform="translate(${cx} ${cy}) scale(${s})" fill="${ink}">${Array.from({ length: 8 }, (_, i) => `<path transform="rotate(${i * 45})" d="M0 0L-3 -6 0 -14 3 -6Z"/>`).join('')}<circle r="2.4" fill="${base}"/></g>`;
    if (motif === 'tulip') art = band(40, 3) + band(118, 3) + zig(30, 5, 10) + zig(132, 5, 10) + tulipMotif(60, 80, 1.6) + tulipMotif(24, 82, 1.1) + tulipMotif(96, 82, 1.1) + dots(16, 7, 2.2);
    if (motif === 'star') art = band(52, 2.5) + band(110, 2.5) + star(60, 81, 1.7) + star(22, 80, 1) + star(98, 80, 1) + dots(40, 9, 1.8) + dots(122, 9, 1.8) + zig(24, 4, 8);
    if (motif === 'waves') { for (const y of [34, 58, 104, 128]) { let d = `M0 ${y}`; for (let x = 0; x < W; x += 16) d += `Q${x + 4} ${y - 7} ${x + 8} ${y}T${x + 16} ${y}`; art += `<path d="${d}" stroke="${ink}" stroke-width="3" fill="none"/>`; } art += band(78, 6) + dots(78, 10, 1.6).replace(new RegExp(ink, 'g'), base) + dots(46, 6, 2.4) + dots(116, 6, 2.4); }
    if (motif === 'diamond') { art = band(30, 3) + band(126, 3); for (let i = 0; i < 6; i++) { const x = 10 + i * 20; art += `<path d="M${x} 78 ${x + 10} 62 ${x + 20} 78 ${x + 10} 94Z" fill="${ink}"/><path d="M${x + 6} 78 ${x + 10} 71 ${x + 14} 78 ${x + 10} 85Z" fill="${base}"/>`; } art += zig(48, 6, 12) + zig(112, 6, 12) + dots(18, 6, 2.2); }
    return svg(W, H, `<defs>
<clipPath id="c"><path d="${path}"/></clipPath>
<radialGradient id="shade" cx=".36" cy=".3" r=".85"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset=".8" stop-color="#000" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
<radialGradient id="ground" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".5"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${base}"/><stop offset="1" stop-color="${baseDark}"/></linearGradient>
</defs>
<ellipse cx="62" cy="148" rx="46" ry="7" fill="url(#ground)"/>
<g clip-path="url(#c)"><rect width="${W}" height="${H}" fill="url(#bg)"/><g opacity=".93">${art}</g><rect width="${W}" height="${H}" fill="url(#shade)"/></g>
<ellipse cx="40" cy="38" rx="11" ry="17" transform="rotate(-24 40 38)" fill="#fff" opacity=".28"/><ellipse cx="37" cy="33" rx="3.5" ry="6" transform="rotate(-24 37 33)" fill="#fff" opacity=".55"/>`);
}

/* ======================= KOKÁRDA ======================= */
function cockade() {
    const W = 240, H = 330, cx = 120, cy = 112;
    const ring = (r1, r2, light, dark, n) => Array.from({ length: n }, (_, i) => {
        const a1 = i / n * Math.PI * 2, a2 = (i + 1) / n * Math.PI * 2, am = (a1 + a2) / 2;
        const p = (rr, a) => `${f(cx + Math.cos(a) * rr)} ${f(cy + Math.sin(a) * rr)}`;
        // redő: fényoldal és árnyékoldal; a fény bal felülről jön
        const lit = .5 + .5 * Math.cos(am - Math.PI * 1.25);
        return `<path d="M${p(r1, a1)}L${p(r2, a1)}L${p(r2 + 1.2, am)}L${p(r2, a2)}L${p(r1, a2)}Z" fill="${mix(dark, light, i % 2 ? lit * .55 : .35 + lit * .65)}"/>`;
    }).join('');
    // szalagvég: három csík (piros–fehér–zöld) helyi koordinátákban, V-bevágással és hosszanti redőárnyékkal
    const tail = (dir) => `<g transform="translate(${cx + dir * 16} ${cy + 36}) rotate(${dir * -17})" clip-path="url(#tailClip)">
<rect x="-21" y="0" width="14" height="200" fill="#c8102e"/><rect x="-7" y="0" width="14" height="200" fill="#f6f6f2"/><rect x="7" y="0" width="14" height="200" fill="#3b7a4a"/>
<rect x="-21" y="0" width="42" height="200" fill="url(#fold)"/><rect x="-21" y="0" width="42" height="200" fill="url(#foldX)"/></g>`;
    return svg(W, H, `<defs>
<radialGradient id="sheen" cx=".35" cy=".3" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></radialGradient>
<radialGradient id="btn" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#6fae7f"/><stop offset=".6" stop-color="#2f6b3d"/><stop offset="1" stop-color="#173a20"/></radialGradient>
<linearGradient id="fold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset=".2" stop-color="#000" stop-opacity="0"/><stop offset=".55" stop-color="#fff" stop-opacity=".14"/><stop offset=".75" stop-color="#000" stop-opacity=".2"/><stop offset="1" stop-color="#000" stop-opacity=".05"/></linearGradient>
<linearGradient id="foldX" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".25"/><stop offset=".35" stop-color="#fff" stop-opacity=".12"/><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>
<clipPath id="tailClip"><path d="M-21 0H21V178L0 160-21 178Z"/></clipPath>
<filter id="drop" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity=".45"/></filter>
</defs>
<g filter="url(#drop)">${tail(-1)}${tail(1)}</g>
<g filter="url(#drop)">
${ring(62, 96, '#ff5a64', '#7a0716', 84)}
${ring(38, 62, '#ffffff', '#b8b8b2', 64)}
${ring(20, 38, '#5fae6e', '#173f22', 48)}
<circle cx="${cx}" cy="${cy}" r="96" fill="url(#sheen)"/>
<circle cx="${cx}" cy="${cy}" r="62" fill="none" stroke="#00000033" stroke-width="1.2"/><circle cx="${cx}" cy="${cy}" r="38" fill="none" stroke="#00000033" stroke-width="1.2"/>
<circle cx="${cx}" cy="${cy}" r="20" fill="url(#btn)"/><circle cx="${cx}" cy="${cy}" r="20" fill="none" stroke="#0e2a14" stroke-width="1.4"/>
<ellipse cx="${cx - 6}" cy="${cy - 7}" rx="7" ry="4.5" fill="#fff" opacity=".35"/>
</g>`);
}

/* ======================= FŰ ÉS HÓ (vízszintesen ismételhető sávok) ======================= */
function grass() {
    const r = rng(5), W = 400, H = 70; let blades = '';
    for (let i = 0; i < 230; i++) {
        const x = r() * W, h = 18 + r() * 44, bend = (r() - .5) * 18, w = 1.6 + r() * 2.2;
        const col = mix('#245c25', '#7fc06a', r());
        blades += `<path d="M${f(x - w)} ${H}Q${f(x + bend * .4)} ${f(H - h * .6)} ${f(x + bend)} ${f(H - h)}Q${f(x + bend * .3 + w * .3)} ${f(H - h * .55)} ${f(x + w)} ${H}Z" fill="${col}"/>`;
    }
    return svg(W, H, `<defs><linearGradient id="soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f6f2c"/><stop offset="1" stop-color="#173d18"/></linearGradient></defs><rect y="${H - 14}" width="${W}" height="14" fill="url(#soil)"/>${blades}`, ' preserveAspectRatio="none"');
}
function snowbank() {
    const r = rng(9), W = 400, H = 60; let sparkle = '';
    for (let i = 0; i < 60; i++) sparkle += `<circle cx="${f(r() * W)}" cy="${f(30 + r() * 28)}" r="${f(.4 + r() * .9)}" fill="#fff" opacity="${f(.4 + r() * .6)}"/>`;
    return svg(W, H, `<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#e3eef6"/><stop offset="1" stop-color="#b9cfe0"/></linearGradient>
<linearGradient id="sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7d9ab3" stop-opacity=".55"/><stop offset="1" stop-color="#7d9ab3" stop-opacity="0"/></linearGradient></defs>
<path d="M0 26C40 14 70 22 100 18S160 8 200 16 270 26 300 16 370 12 400 26V60H0Z" fill="url(#s)"/>
<path d="M0 26C40 14 70 22 100 18S160 8 200 16 270 26 300 16 370 12 400 26V34C370 22 330 26 300 26S240 22 200 26 140 18 100 28 40 22 0 34Z" fill="url(#sh)"/>${sparkle}`, ' preserveAspectRatio="none"');
}

/* ======================= mentés ======================= */
// A fenyők több ezer tűlevélből állnak (~200 KB SVG) – ezeket WebP-képpé rajzoljuk (Playwright/Chromium).
// A díszfa égői és csillaga külön, kis animált SVG-réteg marad (pislákolás).
const firs = { 'fir-a': fir({ seed: 3, tiers: 9 }), 'fir-b': fir({ seed: 17, tiers: 8 }), 'fir-c': fir({ seed: 29, tiers: 10 }), 'fir-decorated': fir({ seed: 41, tiers: 10, decorated: true }) };
save('fir-decorated-lights.svg', firs['fir-decorated'].overlay);
{
    const { chromium } = createRequire(import.meta.url)('playwright');
    const browser = await chromium.launch(), page = await browser.newPage();
    for (const [name, { base }] of Object.entries(firs)) {
        const data = await page.evaluate(async src => {
            const img = new Image(); img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(src))); await img.decode();
            const c = document.createElement('canvas'); c.width = 400; c.height = 660;
            c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
            return c.toDataURL('image/webp', 0.86).split(',')[1];
        }, base);
        const buf = Buffer.from(data, 'base64'); writeFileSync(join(OUT, `${name}.webp`), buf);
        console.log(`${name}.webp`.padEnd(22), (buf.length / 1024).toFixed(1), 'KB');
    }
    await browser.close();
}
const TULIPS = {
    red: ['#d8263b', '#7e0a1c', '#ff7b86'], yellow: ['#f2b929', '#a86a06', '#fff0a6'], pink: ['#ee6f9c', '#9a2752', '#ffc2d8'],
    purple: ['#8d5bd1', '#4a2683', '#d0b6ff'], orange: ['#f0642f', '#972d0c', '#ffb48a'], white: ['#f3eee6', '#b9ab98', '#ffffff'],
};
let s = 50; for (const [name, [petal, petalDark, petalLight]] of Object.entries(TULIPS)) save(`tulip-${name}.svg`, tulip({ seed: s += 7, petal, petalDark, petalLight }));
save('egg-red.svg', egg({ base: '#c8102e', baseDark: '#6e0714', ink: '#fff4e0', motif: 'tulip' }));
save('egg-blue.svg', egg({ base: '#2e5bb8', baseDark: '#14295a', ink: '#ffe08a', motif: 'star' }));
save('egg-yellow.svg', egg({ base: '#f3c443', baseDark: '#a77708', ink: '#b8102a', motif: 'waves' }));
save('egg-green.svg', egg({ base: '#2f8a4e', baseDark: '#123d21', ink: '#fff4e0', motif: 'diamond' }));
save('cockade.svg', cockade());
save('grass.svg', grass());
save('snowbank.svg', snowbank());
