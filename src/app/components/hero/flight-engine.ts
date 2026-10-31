import { ScrollScrubber, clamp, range } from '../../core/scroll-scrubber';

/**
 * A főoldali filmszerű repülés motorja (Canvas 2D + CSS 3D, könyvtár nélkül).
 *  1. nyitókép: izzó részecskegyűrű a kristályszikla körül (folyamatosan él)
 *  2. görgetésre a gyűrű szétrobban, a kamera előrerepül a fényoszlopok között
 *  3. a lépések paneljei elhaladáskor kék fényporrá esnek szét (szilánkok a vásznon)
 *  4. megérkezés a záró táblához
 * A haladást a ScrollScrubber adja (rögzített szakasz), a képkockákat csak akkor rajzolja, amikor a szekció látszik.
 */
export interface FlightRefs {
    section: HTMLElement;
    pin: HTMLElement;
    canvas: HTMLCanvasElement;
    panels: HTMLElement[];
    finale: HTMLElement;
    pillars: HTMLElement[];
    /** Fejezetváltáskor (0 = nyitókép, 1..n = panelek, n+1 = záró tábla). */
    onChapter: (index: number, progress: number) => void;
}

interface Shard { x: number; y: number; vx: number; vy: number; s: number; rot: number; vr: number; life: number; decay: number; c: string; }

const DARK = { add: true, parts: ['#3a5bff', '#5f7dff', '#00d9ff', '#a9c4ff', '#ffffff'], streak: '170,200,255', glow: '58,91,255',
    shards: ['#ffffff', '#bcd2ff', '#4263ff', '#00d9ff', '#7d93ff'] };
const LIGHT = { add: false, parts: ['#2442e6', '#4263ff', '#00a8e8', '#6d84ff'], streak: '66,99,255', glow: '66,99,255',
    shards: ['#4263ff', '#2442e6', '#00a8e8', '#9fb0ff'] };

export class FlightEngine {
    private readonly ctx: CanvasRenderingContext2D;
    private W = 0; private H = 0; private dpr = 1;
    private cx = 0; private cy = 0; private R = 0; private mobile = false;
    private p = 0; private cam = 0; private lastCam = 0;
    private visible = true; private raf = 0; private readonly t0 = performance.now();
    private chapter = -1;
    private scrubber?: ScrollScrubber;
    private io?: IntersectionObserver;
    private readonly gap = 1300;
    private readonly gone: boolean[];
    private shards: Shard[] = [];
    // gyűrű-részecskék
    private N = 0;
    private ang = new Float32Array(0); private rad = new Float32Array(0); private spd = new Float32Array(0);
    private siz = new Float32Array(0); private tw = new Float32Array(0); private out = new Float32Array(0); private col = new Uint8Array(0);
    // fénycsíkok (repülés közben)
    private readonly stars = Array.from({ length: 220 }, () => ({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random() }));

    constructor(private readonly refs: FlightRefs) {
        this.ctx = refs.canvas.getContext('2d')!;
        this.gone = refs.panels.map(() => false);
    }

    start(): void {
        this.resize();
        this.scrubber = new ScrollScrubber(this.refs.section, p => { this.p = p; this.kick(); }, { pinBreakpoint: 0, ease: .09 });
        this.scrubber.start();
        this.io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; this.kick(); });
        this.io.observe(this.refs.section);
        window.addEventListener('resize', this.onResize, { passive: true });
        this.kick();
    }

    destroy(): void {
        this.scrubber?.destroy();
        this.io?.disconnect();
        window.removeEventListener('resize', this.onResize);
        if (this.raf) cancelAnimationFrame(this.raf);
        this.raf = 0;
    }

    /** A görgetési pozíció, ahol a jelenet az adott fejezetnél jár (a HUD-ugráshoz). */
    scrollYFor(progress: number): number { return this.scrubber ? this.scrubber.scrollYFor(progress) : 0; }

    private readonly onResize = (): void => { this.resize(); this.kick(); };

    private kick(): void {
        if (this.visible && !this.raf) this.raf = requestAnimationFrame(this.frame);
    }

    private readonly frame = (now: number): void => {
        this.raf = 0;
        this.render((now - this.t0) / 1000);
        if (this.visible) this.raf = requestAnimationFrame(this.frame);
    };

    private resize(): void {
        const r = this.refs.pin.getBoundingClientRect();
        this.W = r.width; this.H = r.height; this.mobile = this.W < 760;
        this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        this.refs.canvas.width = Math.round(this.W * this.dpr); this.refs.canvas.height = Math.round(this.H * this.dpr);
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        if (this.mobile) { this.cx = this.W * .5; this.cy = this.H * .77; this.R = Math.min(this.W * .32, this.H * .16); }
        else { this.cx = this.W * .69; this.cy = this.H * .5; this.R = Math.min(this.W * .2, this.H * .32); }
        const st = this.refs.pin.style;
        st.setProperty('--cx', this.cx.toFixed(0) + 'px'); st.setProperty('--cy', this.cy.toFixed(0) + 'px'); st.setProperty('--R', this.R.toFixed(0) + 'px');
        this.buildRing(this.mobile ? 1300 : 2600);
    }

    private buildRing(n: number): void {
        if (n === this.N) return;
        this.N = n;
        this.ang = new Float32Array(n); this.rad = new Float32Array(n); this.spd = new Float32Array(n);
        this.siz = new Float32Array(n); this.tw = new Float32Array(n); this.out = new Float32Array(n); this.col = new Uint8Array(n);
        const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
        for (let i = 0; i < n; i++) {
            const ember = Math.random() < .22;
            this.ang[i] = Math.random() * Math.PI * 2;
            this.rad[i] = ember ? 1.04 + Math.random() * .34 : 1 + gauss() * .045;
            this.spd[i] = (.05 + Math.random() * .12) * (Math.random() < .5 ? 1 : .6);
            this.siz[i] = ember ? 1 + Math.random() * 1.4 : 1.3 + Math.random() * 2.1;
            this.tw[i] = Math.random();
            this.out[i] = 2 + Math.random() * 7;
            this.col[i] = ember ? (Math.random() < .5 ? 2 : 3) : Math.floor(Math.random() * 5);
        }
    }

    private render(t: number): void {
        const { ctx, W, H, p } = this;
        const light = document.documentElement.dataset['theme'] === 'light';
        const pal = light ? LIGHT : DARK;
        const n = this.refs.panels.length;
        const burst = range(p, .05, .17);
        const fly = range(p, .09, .2);
        const s = clamp((p - .12) / .8);
        this.cam = s * ((n + 1) * this.gap - 180);
        const dCam = this.cam - this.lastCam; this.lastCam = this.cam;

        const st = this.refs.pin.style;
        st.setProperty('--p', p.toFixed(4)); st.setProperty('--copy', range(p, .02, .11).toFixed(4));
        st.setProperty('--burst', burst.toFixed(4)); st.setProperty('--fly', fly.toFixed(4));
        this.refs.pin.classList.toggle('copy-gone', range(p, .02, .11) > .98);

        // ---------- 3D tér: panelek, záró tábla, fényoszlopok ----------
        const spread = this.mobile ? W * .08 : Math.min(W * .21, 360);
        this.refs.panels.forEach((el, i) => {
            const side = i % 2 ? 1 : -1;
            const z = -(i + 1) * this.gap + this.cam;
            if (z > 120 && !this.gone[i]) { this.gone[i] = true; this.shatter(el, pal.shards); }
            if (z <= 120 && this.gone[i]) this.gone[i] = false;
            const op = this.gone[i] ? 0 : clamp((z + 4200) / 2200) * (z > 40 ? clamp(1 - (z - 40) / 80) : 1) * fly;
            el.style.opacity = op.toFixed(3);
            el.style.visibility = op < .01 ? 'hidden' : 'visible';
            el.style.zIndex = String(Math.round(z + 20000));
            if (op >= .01) el.style.transform = `translate(-50%,-50%) translate3d(${side * spread}px,${Math.sin(t * .7 + i) * 6}px,${z}px) rotateY(${-side * 12}deg)`;
        });
        const zf = -(n + 1) * this.gap + this.cam;
        const opF = clamp((zf + 1300) / 800) * fly;
        this.refs.finale.style.opacity = opF.toFixed(3);
        this.refs.finale.style.visibility = opF < .01 ? 'hidden' : 'visible';
        this.refs.finale.style.transform = `translate(-50%,-50%) translate3d(0,0,${zf}px)`;
        this.refs.finale.classList.toggle('is-live', opF > .6);

        const floor = this.mobile ? H * .42 : H * .48, pgap = this.gap * .55, per = this.refs.pillars.length / 2;
        this.refs.pillars.forEach((el, i) => {
            const side = i % 2 ? 1 : -1, k = i >> 1;
            const z = -(k * pgap) - 300 + this.cam;
            const x = side * ((this.mobile ? W * .38 : Math.min(W * .42, 760)) + ((i * 53) % 220));
            const op = z > 260 ? 0 : clamp((z + per * pgap) / 2600) * clamp((260 - z) / 360) * fly;
            el.style.opacity = op.toFixed(3);
            el.style.visibility = op < .01 ? 'hidden' : 'visible';
            if (op >= .01) el.style.transform = `translate(-50%,-100%) translate3d(${x}px,${floor}px,${z}px)`;
        });

        // ---------- fejezet (HUD) ----------
        // az aktuális fejezet az a panel, amely a kamera előtt van (amíg el nem halad mellette)
        const ch = s < .015 ? 0 : Math.min(n + 1, 1 + Math.max(0, Math.floor((this.cam - 120) / this.gap)));
        if (ch !== this.chapter) { this.chapter = ch; this.refs.onChapter(ch, p); }

        // ---------- vászon ----------
        ctx.clearRect(0, 0, W, H);
        ctx.globalCompositeOperation = pal.add ? 'lighter' : 'source-over';

        // izzó mag a gyűrű közepén
        if (burst < 1) {
            const gr = ctx.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, this.R * (1.5 + burst * 2));
            const a = (light ? .16 : .38) * (1 - burst) + burst * (light ? .1 : .3) * (1 - burst) * 2;
            gr.addColorStop(0, `rgba(${pal.glow},${a})`); gr.addColorStop(1, `rgba(${pal.glow},0)`);
            ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
        }

        // részecskegyűrű (enyhén megdöntött ellipszis), görgetésre kifelé szétrobban
        const ringA = 1 - burst;
        if (ringA > .01) {
            const tilt = -.38 + Math.sin(t * .15) * .05, ct = Math.cos(tilt), sn = Math.sin(tilt), R = this.R;
            const K = pal.parts.length;
            for (let c = 0; c < K; c++) {
                ctx.fillStyle = pal.parts[c];
                for (let i = 0; i < this.N; i++) {
                    if (this.col[i] % K !== c) continue;
                    const a = this.ang[i] + t * this.spd[i];
                    const rr = R * (this.rad[i] + .03 * Math.sin(t * 1.7 + this.tw[i] * 6.28)) * (1 + burst * burst * this.out[i]);
                    const dx = Math.cos(a) * rr, dy = Math.sin(a) * rr * .9;
                    const x = this.cx + dx * ct - dy * sn, y = this.cy + dx * sn + dy * ct;
                    const flick = .55 + .45 * Math.sin(t * 3.1 + this.tw[i] * 31);
                    const sz = this.siz[i] * (1 + burst * 2.6);
                    ctx.globalAlpha = ringA * flick * (light ? .75 : .9) * (this.rad[i] > 1.03 ? .55 : 1);
                    ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
                }
            }
        }

        // fénycsíkok a repülés közben, a görgetés sebességével
        if (fly > .01) {
            const speed = .0012 + Math.min(.045, Math.abs(dCam) * .00004), dir = dCam < 0 ? -1 : 1, k = Math.min(W, H) * .6;
            ctx.lineCap = 'round';
            for (const s2 of this.stars) {
                const pz = s2.z;
                s2.z -= speed * dir;
                if (s2.z <= .02) { s2.z = 1; s2.x = Math.random() * 2 - 1; s2.y = Math.random() * 2 - 1; }
                if (s2.z > 1) s2.z = .02;
                const x = W / 2 + s2.x / s2.z * k * .5, y = H / 2 + s2.y / s2.z * k * .5;
                const px = W / 2 + s2.x / pz * k * .5, py = H / 2 + s2.y / pz * k * .5;
                const a = clamp((1 - s2.z) * 1.1) * fly;
                ctx.globalAlpha = 1;
                ctx.strokeStyle = `rgba(${pal.streak},${a * (light ? .45 : .75)})`;
                ctx.lineWidth = Math.max(.6, (1 - s2.z) * 2.2);
                ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
            }
        }

        // szilánkok (a szétesett panelekből)
        for (let i = this.shards.length - 1; i >= 0; i--) {
            const sh = this.shards[i];
            sh.x += sh.vx; sh.y += sh.vy; sh.vx *= 1.015; sh.vy *= 1.015; sh.rot += sh.vr; sh.life -= sh.decay; sh.s *= 1.012;
            if (sh.life <= 0) { this.shards.splice(i, 1); continue; }
            ctx.save(); ctx.translate(sh.x, sh.y); ctx.rotate(sh.rot);
            ctx.globalAlpha = sh.life; ctx.fillStyle = sh.c; ctx.fillRect(-sh.s / 2, -sh.s / 4, sh.s, sh.s / 2);
            ctx.restore();
        }
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }

    /** A panel képernyő-téglalapjából fényszilánkok repülnek szét a kamera felé. */
    private shatter(el: HTMLElement, colors: string[]): void {
        const r = el.getBoundingClientRect(), o = this.refs.pin.getBoundingClientRect();
        const cx = this.W / 2, cy = this.H / 2, count = this.mobile ? 150 : 280;
        const left = Math.max(-50, r.left - o.left), top = Math.max(-50, r.top - o.top);
        const w = Math.min(this.W + 100, r.width), h = Math.min(this.H + 100, r.height);
        for (let k = 0; k < count && this.shards.length < 1600; k++) {
            const x = left + Math.random() * w, y = top + Math.random() * h;
            const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) || 1, sp = 2 + Math.random() * 9;
            this.shards.push({ x, y, vx: dx / d * sp + (Math.random() - .5) * 2, vy: dy / d * sp + (Math.random() - .5) * 2 - 1,
                s: 1.5 + Math.random() * 4, rot: Math.random() * 6, vr: (Math.random() - .5) * .3, life: 1,
                decay: .008 + Math.random() * .014, c: colors[k % colors.length] });
        }
    }
}
