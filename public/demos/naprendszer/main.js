// ORBIS – interaktív 3D Naprendszer-lexikon.
// Egyetlen WebGL-jelenet a teljes képernyőn; a görgetés vezeti a kamerát égitestről égitestre ([data-focus] szakaszok),
// a térkép-szakaszban kattintható áttekintő nézet. A felszínek GPU-n, procedurálisan készülnek (nincs textúrafájl).
// Csökkentett mozgásnál nincs simítás, meteor és automatikus forgás; WebGL nélkül a lexikon szövege ugyanúgy olvasható.
import * as THREE from './vendor/three.module.min.js';
import { ENTRIES, UI } from './data.js';

const LANG = window.demoLang === 'en' ? 'en' : 'hu';
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const LOW = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
document.documentElement.classList.add('js');
const clamp01 = v => Math.min(1, Math.max(0, v));
const easeOut = t => 1 - Math.pow(1 - t, 3);

setupReveal();
setupEntryFx();
setupOrbitNav();
setupSearch();
setupSort();
const mapCard = $('.map-card');
renderCard(null);

// ── oldal-UI ──────────────────────────────────────────────────────────────────
function setupReveal() {
    const items = $$('.reveal');
    if (REDUCED || !('IntersectionObserver' in window)) { items.forEach(el => el.classList.add('visible')); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } }), { threshold: .15 });
    items.forEach(el => io.observe(el));
}

/** Szövegből betű- vagy szó-spanok (a képernyőolvasó a teljes szöveget kapja). */
function splitText(el, mode) {
    const text = el.textContent.replace(/\s+/g, ' ').trim();
    el.setAttribute('aria-label', text);
    el.setAttribute('translate', 'no');
    const parts = mode === 'words' ? text.split(' ').map((w, k, a) => w + (k < a.length - 1 ? ' ' : '')) : [...text];
    el.innerHTML = parts.map((c, j) => `<span class="${mode === 'words' ? 'w' : 'ch'}" aria-hidden="true" style="--j:${j}">${c}</span>`).join('');
}

// Szócikkek: görgetéshez kötött be-/kilépés (--in, --out), a megállás alatt fejezetváltás (Bemutatás → … → Felfedezés).
// Az i18n.js már lefutott (előbb töltődik), így a betűkre bontás a végleges nyelvű szövegen történik.
function setupEntryFx() {
    if (!REDUCED) {
        $$('.hero h1 > span').forEach((span, n) => {
            const text = span.textContent;
            span.innerHTML = [...text].map((c, j) => `<span class="ch" style="--j:${j + n * 8}">${c}</span>`).join('');
        });
        $('.hero h1').setAttribute('translate', 'no');
        $$('.entry h2.split').forEach(h => splitText(h, 'chars'));
        $$('.words').forEach(h => splitText(h, 'words'));
    }
    // szavanként élesedő címek: oda-vissza görgetésre is
    const words = $$('.words');
    if (REDUCED || !('IntersectionObserver' in window)) words.forEach(w => w.classList.add('in'));
    else {
        const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('in', e.isIntersecting)), { rootMargin: '-12% 0px -12% 0px' });
        words.forEach(w => io.observe(w));
    }

    const entries = $$('.entry').map(section => ({
        section, card: $('.entry-card', section), chapters: $$('.chapter', section), steps: $$('.steps li', section), cur: -1,
    }));
    const setChapter = (e, idx) => {
        if (idx === e.cur) return;
        e.cur = idx;
        e.chapters.forEach((ch, i) => { ch.classList.toggle('on', i === idx); ch.classList.toggle('past', i < idx); });
    };
    if (REDUCED) { entries.forEach(e => setChapter(e, 0)); }
    function placeTop() {
        const narrow = innerWidth <= 760;
        for (const e of entries) {
            const h = e.card.offsetHeight;
            // asztalon függőlegesen középen, mobilon a képernyő alján (a mini-navigáció fölött) marad
            const top = narrow ? innerHeight - h - 78 : (innerHeight - h) / 2;
            e.card.style.setProperty('--top', Math.max(narrow ? 60 : 84, Math.round(top)) + 'px');
        }
    }
    let queued = false;
    function update() {
        queued = false;
        const H = innerHeight, c = H / 2;
        for (const e of entries) {
            const r = e.section.getBoundingClientRect();
            if (r.bottom < -H || r.top > 2 * H) continue;
            const d = c - r.top; // a képernyő közepe ennyi px-re van a szakasz tetejétől
            const n = e.chapters.length;
            const cp = clamp01((d - .5 * H) / Math.max(1, r.height - 1.35 * H));
            const idx = Math.min(n - 1, Math.floor(cp * n));
            if (!REDUCED) {
                e.card.style.setProperty('--in', easeOut(clamp01((d - .08 * H) / (.45 * H))).toFixed(4));
                e.card.style.setProperty('--out', clamp01((d - (r.height - .78 * H)) / (.34 * H)).toFixed(4));
                setChapter(e, d < .3 * H ? 0 : idx);
            }
            e.steps.forEach((st, i) => { st.style.setProperty('--f', clamp01(cp * n - i).toFixed(3)); st.classList.toggle('on', i === e.cur); });
        }
    }
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', () => { placeTop(); queue(); });
    placeTop(); update();
    if (document.fonts) document.fonts.ready.then(() => { placeTop(); update(); });
    if (REDUCED) entries.forEach(e => setChapter(e, 0));
}

// Pálya-navigáció (asztal) és mini-navigáció (mobil/tablet): aktív szakasz, haladás, ugrás
function setupOrbitNav() {
    const nav = $('.orbit-nav'), mini = $('.orbit-mini');
    if (!nav || !mini) return;
    const stops = $$('a[data-stop]', nav).map(a => ({ key: a.dataset.stop, a }));
    const order = ['kezdet', ...stops.map(st => st.key), 'osszehasonlitas', 'vege'];
    const els = order.map(id => document.getElementById(id));
    const names = { kezdet: UI.start[LANG], terkep: UI.map[LANG], osszehasonlitas: UI.compare[LANG], vege: UI.end[LANG] };
    ENTRIES.forEach(e => { names[e.key] = e.name[LANG]; });
    const firstEl = document.getElementById(stops[0].key), lastEl = document.getElementById(stops[stops.length - 1].key);
    const miniName = $('.om-name', mini), prev = $('.om-prev', mini), next = $('.om-next', mini);
    let queued = false, lastIdx = -1;
    function update() {
        queued = false;
        const H = innerHeight, c = H / 2;
        let idx = 0;
        els.forEach((el, i) => { if (el && el.getBoundingClientRect().top <= c) idx = i; });
        const f = firstEl.getBoundingClientRect(), l = lastEl.getBoundingClientRect();
        const y0 = f.top + f.height / 2, y1 = l.top + l.height / 2;
        const p = clamp01((c - y0) / Math.max(1, y1 - y0));
        // az ív teljes hossza 180°, a megállók −48° … +48° között vannak
        nav.style.setProperty('--dash', (1 - (.2333 + .5333 * p)).toFixed(4));
        const total = document.documentElement.scrollHeight - H;
        mini.style.setProperty('--dash', (1 - clamp01(scrollY / Math.max(1, total))).toFixed(4));
        nav.classList.toggle('on', scrollY > H * .6 && order[idx] !== 'vege');
        mini.classList.toggle('on', scrollY > H * .5);
        if (idx !== lastIdx) {
            lastIdx = idx;
            const cur = order.indexOf(order[idx]);
            stops.forEach(st => {
                const si = order.indexOf(st.key);
                st.a.classList.toggle('active', si === cur);
                st.a.classList.toggle('past', si < cur);
                if (si === cur) st.a.setAttribute('aria-current', 'true'); else st.a.removeAttribute('aria-current');
            });
            miniName.textContent = names[order[idx]] || '';
            prev.href = '#' + order[Math.max(0, idx - 1)];
            next.href = '#' + order[Math.min(order.length - 1, idx + 1)];
            prev.setAttribute('aria-disabled', String(idx === 0));
            next.setAttribute('aria-disabled', String(idx === order.length - 1));
        }
    }
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', queue);
    update();
}

function setupSearch() {
    const form = $('.search'), input = $('input', form);
    const plain = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
    form.addEventListener('submit', e => {
        e.preventDefault();
        const q = plain(input.value);
        if (!q) return;
        const hit = ENTRIES.find(x => plain(x.name.hu) === q || plain(x.name.en) === q)
            || ENTRIES.find(x => plain(x.name.hu).startsWith(q) || plain(x.name.en).startsWith(q))
            || ENTRIES.find(x => plain(x.name.hu).includes(q) || plain(x.name.en).includes(q));
        if (!hit) { input.setCustomValidity(LANG === 'en' ? 'No match' : 'Nincs találat'); input.reportValidity(); setTimeout(() => input.setCustomValidity(''), 1500); return; }
        document.getElementById(hit.key)?.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' });
        input.blur();
    });
}

function setupSort() {
    const table = $('.sortable');
    if (!table) return;
    const body = $('tbody', table);
    $$('thead button', table).forEach(btn => btn.addEventListener('click', () => {
        const col = Number(btn.dataset.col), th = btn.parentElement;
        const asc = th.getAttribute('aria-sort') !== 'ascending';
        $$('thead th', table).forEach(h => h.removeAttribute('aria-sort'));
        th.setAttribute('aria-sort', asc ? 'ascending' : 'descending');
        const rows = $$('tr', body);
        const val = r => col === 0 ? r.children[0].textContent.trim() : Number(r.children[col].dataset.v);
        rows.sort((a, b) => { const x = val(a), y = val(b); const c = typeof x === 'number' ? x - y : x.localeCompare(y, LANG); return asc ? c : -c; });
        rows.forEach(r => body.appendChild(r));
    }));
}

function renderCard(key) {
    if (!mapCard) return;
    const e = ENTRIES.find(x => x.key === key);
    if (!e) { mapCard.innerHTML = `<p class="pick">${UI.pick[LANG]}</p>`; return; }
    const rows = e.rows.slice(0, 5).map(r => `<dt>${r.label[LANG]}</dt><dd>${r.value[LANG]}</dd>`).join('');
    mapCard.innerHTML = `<p class="kind">${e.kind[LANG]}</p><h3>${e.name[LANG]}</h3><dl>${rows}</dl><p>${e.fact[LANG]}</p><a href="#${e.key}">${UI.more[LANG]}</a>`;
}

// ── shaderek ──────────────────────────────────────────────────────────────────
const NOISE = /* glsl */`
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float fbm(vec3 p){ float a=0.5, s=0.0; for(int i=0;i<OCT;i++){ s+=a*snoise(p); p=p*2.03+vec3(1.7,9.2,3.1); a*=0.5; } return s; }
vec3 hash33(vec3 p){ p=fract(p*vec3(0.1031,0.1030,0.0973)); p+=dot(p,p.yxz+33.33); return fract((p.xxy+p.yxx)*p.zyx); }
float craters(vec3 p, float density){
  vec3 i=floor(p), f=fract(p); float s=0.0;
  for(int z=-1;z<=1;z++) for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){
    vec3 b=vec3(float(x),float(y),float(z)); vec3 h=hash33(i+b);
    if(h.z>density) continue;
    float d=length(b+h-f); float t=d/(0.16+0.3*h.x);
    s += -0.8*(1.0-smoothstep(0.0,0.82,t)) + 0.55*smoothstep(0.7,0.92,t)*(1.0-smoothstep(0.92,1.2,t));
  }
  return clamp(s,-1.0,1.0);
}
`;

const PLANET_VS = /* glsl */`
varying vec3 vObj; varying vec3 vWorld; varying vec3 vN;
void main(){
  vObj=normalize(position);
  vec4 w=modelMatrix*vec4(position,1.0); vWorld=w.xyz;
  vN=normalize(mat3(modelMatrix)*normal);
  gl_Position=projectionMatrix*viewMatrix*w;
}`;

const PLANET_FS = /* glsl */`
uniform int uType; uniform float uTime; uniform vec3 uSunPos;
uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3; uniform vec3 uAtmo; uniform float uAtmoK; uniform float uSeed;
varying vec3 vObj; varying vec3 vWorld; varying vec3 vN;
${NOISE}
vec3 spinY(vec3 p, float a){ float c=cos(a), s=sin(a); return vec3(c*p.x-s*p.z, p.y, s*p.x+c*p.z); }
void main(){
  vec3 p=vObj; vec3 q=p+uSeed;
  vec3 N=normalize(vN); vec3 L=normalize(uSunPos-vWorld); vec3 V=normalize(cameraPosition-vWorld);
  float ndl=dot(N,L); float lat=p.y;
  vec3 col=uC1; float spec=0.0; float lights=0.0;
  if(uType==0){ // kőzet: Merkúr, Hold (uC3 = „tengerek”)
    float n=fbm(q*2.6);
    float maria=smoothstep(0.08,0.38,fbm(q*0.85+4.0));
    col=mix(uC1,uC2,n*0.5+0.5);
    col=mix(col,uC3,maria*uAtmoK);
    float cr=craters(q*4.0,0.5)*0.55+craters(q*9.0,0.45)*0.3+craters(q*19.0,0.4)*0.18;
    col*=1.0+cr*0.42;
  } else if(uType==1){ // Vénusz: kavargó kénsavfelhők
    vec3 w=vec3(fbm(q*1.3+uTime*0.01),fbm(q*1.3+5.2),fbm(q*1.3+9.1));
    float n=fbm(q*1.6+w*1.9+vec3(0.0,0.0,uTime*0.005));
    col=mix(uC1,uC2,smoothstep(-0.55,0.55,n));
    col=mix(col,uC3,(sin(lat*7.0+n*3.0)*0.5+0.5)*0.25);
  } else if(uType==2){ // Föld
    float h=fbm(q*1.55);
    float land=smoothstep(0.035,0.07,h);
    vec3 ocean=mix(vec3(0.015,0.05,0.16),vec3(0.03,0.2,0.36),smoothstep(-0.3,0.05,h));
    float v=fbm(q*4.2+2.0);
    float desert=smoothstep(0.0,0.4,v*0.7+0.25)*(1.0-smoothstep(0.12,0.42,abs(abs(lat)-0.3)));
    vec3 landCol=mix(vec3(0.09,0.2,0.07),vec3(0.55,0.43,0.26),desert);
    landCol=mix(landCol,vec3(0.32,0.28,0.24),smoothstep(0.25,0.5,h));
    float ice=smoothstep(0.8,0.88,abs(lat)+fbm(q*3.0)*0.07);
    col=mix(ocean,landCol,land); col=mix(col,vec3(0.93,0.95,0.98),ice);
    spec=(1.0-land)*(1.0-ice);
    float city=smoothstep(0.8,0.9,snoise(q*120.0)*0.5+0.5)*smoothstep(0.5,0.72,snoise(q*6.0)*0.5+0.5);
    lights=land*(1.0-ice)*city*(1.0-smoothstep(0.5,0.7,abs(lat)))*0.9;
  } else if(uType==3){ // Mars
    float n=fbm(q*2.2); float d=fbm(q*1.15+7.0);
    col=mix(uC1,uC2,n*0.5+0.5);
    col=mix(col,uC3,smoothstep(0.02,0.35,d));
    col*=1.0+craters(q*6.0,0.35)*0.16;
    col=mix(col,vec3(0.92,0.9,0.88),smoothstep(0.87,0.93,abs(lat)+n*0.05));
  } else { // gáz- és jégóriások: sávok, szélességfüggő áramlással
    float flow=uTime*(uType==4?0.035:0.022)*sin(lat*11.0);
    vec3 r=spinY(p,flow);
    float strength=uType==4?1.0:(uType==5?0.55:(uType==7?0.45:0.12));
    float warp=fbm(vec3(r.x*2.2,r.y*7.0,r.z*2.2)+uSeed)*0.3*strength;
    float b=lat*(uType==4?9.5:7.5)+warp*2.4;
    float bands=sin(b*3.0)*0.5+0.5; float belts=sin(b*1.7+1.3)*0.5+0.5;
    col=mix(uC1,uC2,bands*strength+(1.0-strength)*0.35);
    col=mix(col,uC3,belts*0.55*strength);
    col*=0.92+0.16*snoise(vec3(r.x*9.0,r.y*40.0,r.z*9.0))*strength;
    if(uType==4){ // Nagy Vörös Folt
      vec3 d=(p-normalize(vec3(0.82,-0.36,0.44)))*vec3(1.0,2.3,1.0);
      float spot=1.0-smoothstep(0.1,0.22,length(d));
      col=mix(col,vec3(0.72,0.33,0.2),spot*0.9);
      col=mix(col,vec3(0.95,0.85,0.75),(1.0-smoothstep(0.2,0.26,length(d)))*(smoothstep(0.17,0.21,length(d)))*0.5);
    }
    if(uType==6) col=mix(col,uC3,smoothstep(0.2,1.0,lat)*0.35); // Uránusz: világosabb pólus
    if(uType==7){ // Neptunusz: sötét folt és fehér felhőcsíkok
      vec3 d=(p-normalize(vec3(-0.6,-0.32,0.73)))*vec3(1.0,2.0,1.0);
      col=mix(col,vec3(0.03,0.07,0.25),(1.0-smoothstep(0.08,0.17,length(d)))*0.8);
      float streak=smoothstep(0.62,0.9,snoise(vec3(r.x*1.2,r.y*26.0,r.z*1.2)))*smoothstep(0.12,0.3,abs(lat))*0.45;
      col=mix(col,vec3(0.85,0.92,1.0),streak);
    }
    float mu=max(dot(N,V),0.0); col*=0.7+0.3*mu; // pereme sötétebb
  }
  float wrap=clamp((ndl+0.12)/1.12,0.0,1.0);
  vec3 lit=col*(0.018+1.08*wrap);
  vec3 H=normalize(L+V);
  lit+=spec*pow(max(dot(N,H),0.0),70.0)*0.55*step(0.0,ndl)*vec3(1.0,0.95,0.85);
  lit+=vec3(1.0,0.7,0.32)*lights*smoothstep(0.02,-0.25,ndl);
  float fres=pow(1.0-max(dot(N,V),0.0),2.6);
  if(uType!=0) lit+=uAtmo*fres*uAtmoK*smoothstep(-0.3,0.45,ndl);
  gl_FragColor=vec4(lit,1.0);
}`;

const CLOUD_FS = /* glsl */`
uniform float uTime; uniform vec3 uSunPos;
varying vec3 vObj; varying vec3 vWorld; varying vec3 vN;
${NOISE}
void main(){
  vec3 p=vObj;
  float c=fbm(p*2.3+vec3(uTime*0.006,0.0,uTime*0.003)+vec3(0.0,0.0,fbm(p*1.1)*0.6));
  float a=smoothstep(0.08,0.5,c)*0.9;
  vec3 N=normalize(vN); vec3 L=normalize(uSunPos-vWorld);
  float wrap=clamp((dot(N,L)+0.1)/1.1,0.0,1.0);
  gl_FragColor=vec4(vec3(1.0)*(0.02+wrap),a*(0.15+0.85*wrap));
}`;

const HALO_VS = /* glsl */`
varying vec3 vWorld; varying vec3 vN;
void main(){ vec4 w=modelMatrix*vec4(position,1.0); vWorld=w.xyz; vN=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*viewMatrix*w; }`;
const HALO_FS = /* glsl */`
uniform vec3 uColor; uniform vec3 uSunPos; uniform vec3 uCenter; uniform float uK;
varying vec3 vWorld; varying vec3 vN;
void main(){
  vec3 V=normalize(cameraPosition-vWorld);
  float f=dot(normalize(vN),V);            // hátlap: a szélén ~0, a bolygó pereménél negatív
  float k=pow(clamp(-f*3.2,0.0,1.0),1.6);
  float day=smoothstep(-0.25,0.5,dot(normalize(vWorld-uCenter),normalize(uSunPos-uCenter)));
  gl_FragColor=vec4(uColor*k*day*uK,1.0);
}`;

const SUN_FS = /* glsl */`
uniform float uTime;
varying vec3 vObj; varying vec3 vWorld; varying vec3 vN;
${NOISE}
void main(){
  vec3 p=vObj;
  float n=fbm(p*2.4+vec3(0.0,uTime*0.02,0.0));
  float g=snoise(p*38.0+uTime*0.1)*0.5+snoise(p*80.0-uTime*0.07)*0.3;
  vec3 col=mix(vec3(1.0,0.42,0.06),vec3(1.0,0.9,0.62),smoothstep(-0.6,0.7,n*0.7+g*0.45+0.15));
  vec3 V=normalize(cameraPosition-vWorld);
  float mu=max(dot(normalize(vN),V),0.0);
  col*=0.55+0.62*pow(mu,0.45);
  col+=vec3(1.0,0.92,0.75)*pow(mu,3.0)*0.32;
  gl_FragColor=vec4(col,1.0);
}`;

const RING_VS = /* glsl */`
varying vec3 vWorld; varying vec2 vLocal;
void main(){ vLocal=position.xy; vec4 w=modelMatrix*vec4(position,1.0); vWorld=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`;
const RING_FS = /* glsl */`
uniform vec3 uSunPos; uniform vec3 uCenter; uniform float uR; uniform float uInner; uniform float uOuter; uniform int uKind;
uniform vec3 uC1; uniform vec3 uC2;
varying vec3 vWorld; varying vec2 vLocal;
${NOISE}
void main(){
  float rr=(length(vLocal)-uInner)/(uOuter-uInner);
  float a; vec3 col;
  if(uKind==0){ // Szaturnusz
    float b=0.55+0.45*snoise(vec3(rr*36.0,0.0,1.3)); b*=0.72+0.28*snoise(vec3(rr*130.0,2.0,0.0));
    a=b*smoothstep(0.0,0.03,rr)*(1.0-smoothstep(0.93,1.0,rr));
    a*=1.0-0.9*smoothstep(0.585,0.6,rr)*(1.0-smoothstep(0.64,0.655,rr)); // Cassini-rés
    a*=mix(0.35,1.0,smoothstep(0.08,0.32,rr));                           // halvány belső C-gyűrű
    col=mix(uC1,uC2,snoise(vec3(rr*18.0,4.0,4.0))*0.5+0.5);
  } else { // Uránusz: néhány keskeny, sötét gyűrű
    a=0.0;
    for(int i=0;i<5;i++){ float c=0.12+float(i)*0.2; a+=exp(-pow((rr-c)*90.0,2.0)); }
    a*=0.45; col=uC1;
  }
  vec3 L=normalize(uSunPos-vWorld); vec3 oc=uCenter-vWorld; float t=dot(oc,L);
  float sh=t>0.0?smoothstep(uR*0.95,uR*1.04,length(oc-L*t)):1.0;   // a bolygó árnyéka a gyűrűn
  gl_FragColor=vec4(col*(0.08+0.95*sh),clamp(a,0.0,1.0)*0.92);
}`;

const POINTS_VS = /* glsl */`
attribute float aSize; attribute vec3 aColor; attribute float aPhase;
uniform float uTime; uniform float uPx; uniform float uAtten; uniform float uTwinkle;
varying vec3 vC; varying float vA;
void main(){
  vec4 mv=modelViewMatrix*vec4(position,1.0);
  gl_Position=projectionMatrix*mv;
  float att=mix(1.0,clamp(90.0/max(-mv.z,1.0),0.25,3.0),uAtten);
  gl_PointSize=aSize*uPx*att;
  vC=aColor; vA=1.0-uTwinkle*0.35*(0.5+0.5*sin(uTime*(0.6+aPhase*1.7)+aPhase*40.0));
}`;
const POINTS_FS = /* glsl */`
varying vec3 vC; varying float vA;
void main(){ float d=length(gl_PointCoord-0.5); float a=smoothstep(0.5,0.0,d); gl_FragColor=vec4(vC*a*a*vA,1.0); }`;

// Por és előtér-„bokeh”: a pontok a kamera körüli dobozban ismétlődnek, így repülés közben elsuhannak mellettünk.
const DUST_VS = /* glsl */`
attribute float aSize; uniform vec3 uCam; uniform float uBox; uniform float uPx; uniform float uAlpha;
varying float vA;
void main(){
  vec3 rel=mod(position-uCam,uBox)-uBox*0.5;
  vec4 mv=viewMatrix*vec4(uCam+rel,1.0);
  gl_Position=projectionMatrix*mv;
  float dist=-mv.z;
  gl_PointSize=aSize*uPx*clamp(10.0/max(dist,0.3),0.4,46.0);
  vA=uAlpha*(1.0-smoothstep(uBox*0.28,uBox*0.5,length(rel)))*smoothstep(0.25,1.6,dist)/(1.0+aSize*0.35);
}`;
const DUST_FS = /* glsl */`
varying float vA;
void main(){ float d=length(gl_PointCoord-0.5); float a=smoothstep(0.5,0.0,d); gl_FragColor=vec4(vec3(1.0,0.93,0.82)*a*vA,1.0); }`;

const METEOR_FS = /* glsl */`
uniform float uAlpha; varying vec2 vUv;
void main(){ float head=pow(vUv.x,3.5); float core=1.0-abs(vUv.y-0.5)*2.0; float a=head*smoothstep(0.0,0.7,core)*uAlpha;
  gl_FragColor=vec4(vec3(0.85,0.92,1.0)*a+vec3(1.0)*pow(vUv.x,30.0)*core*uAlpha,1.0); }`;
const UV_VS = /* glsl */`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;

// ── a jelenet ─────────────────────────────────────────────────────────────────
function initSpace() {
    const canvas = $('.space');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: !LOW, powerPreference: 'high-performance' });
    if (!renderer.capabilities.isWebGL2) throw new Error('WebGL2 szükséges');
    renderer.setClearColor(0x030305, 1);
    const DPR = Math.min(devicePixelRatio || 1, LOW ? 1.5 : 1.75);
    renderer.setPixelRatio(DPR);
    const OCT = LOW ? 4 : 5;
    const SEG = LOW ? [72, 48] : [112, 76];

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.05, 4000);
    scene.add(camera);
    const sunPos = new THREE.Vector3(0, 0, 0);
    const shared = { uTime: { value: 0 }, uSunPos: { value: sunPos } };
    const defines = { OCT };

    // égitestek – sűrített méretek és távolságok (nem méretarányos)
    const C = c => new THREE.Color(c);
    const DEF = {
        merkur: { r: .48, dist: 12.5, years: .24, spin: .03, tilt: .03, type: 0, c: ['#5d5a57', '#a8a29b', '#4a4744'], atmo: ['#000', 0], seed: 1.3 },
        venusz: { r: .92, dist: 17, years: .62, spin: -.012, tilt: 3.1, type: 1, c: ['#b98d4f', '#f1dcae', '#d9b27a'], atmo: ['#ffd9a0', .55], seed: 2.1 },
        fold: { r: 1, dist: 23, years: 1, spin: .09, tilt: .41, type: 2, c: ['#fff', '#fff', '#fff'], atmo: ['#5aa8ff', .9], seed: 3.7 },
        mars: { r: .6, dist: 29.5, years: 1.88, spin: .088, tilt: .44, type: 3, c: ['#8a3c1c', '#c96a3a', '#4b2216'], atmo: ['#ff9f78', .35], seed: 4.4 },
        jupiter: { r: 3.1, dist: 43, years: 11.86, spin: .2, tilt: .05, type: 4, c: ['#e6d3b3', '#b07b4f', '#8a5a3b'], atmo: ['#f3dcb8', .25], seed: 5.2 },
        szaturnusz: { r: 2.6, dist: 58, years: 29.4, spin: .19, tilt: .47, type: 5, c: ['#efe0bc', '#c9a873', '#a8875a'], atmo: ['#f6e6c4', .22], seed: 6.6 },
        uranusz: { r: 1.75, dist: 72, years: 84, spin: -.12, tilt: 1.71, type: 6, c: ['#9ad8e0', '#bfeef0', '#d8fbfb'], atmo: ['#a8f0ff', .45], seed: 7.1 },
        neptunusz: { r: 1.7, dist: 84, years: 164.8, spin: .13, tilt: .49, type: 7, c: ['#2f5fd8', '#4f86f0', '#1d3a9a'], atmo: ['#6fa2ff', .6], seed: 8.9 },
    };
    const ORBIT_SEC = 70; // a Föld egy keringése a demóban (mp); a többi a valós arányok gyökével lassul
    const bodies = new Map();
    const pickables = [];

    function planetMaterial(d) {
        return new THREE.ShaderMaterial({
            defines, vertexShader: PLANET_VS, fragmentShader: PLANET_FS,
            uniforms: {
                uType: { value: d.type }, uTime: shared.uTime, uSunPos: shared.uSunPos, uSeed: { value: d.seed },
                uC1: { value: C(d.c[0]) }, uC2: { value: C(d.c[1]) }, uC3: { value: C(d.c[2]) },
                uAtmo: { value: C(d.atmo[0]) }, uAtmoK: { value: d.atmo[1] },
            },
        });
    }
    function halo(r, color, k) {
        const m = new THREE.Mesh(new THREE.SphereGeometry(r * 1.07, 64, 40), new THREE.ShaderMaterial({
            vertexShader: HALO_VS, fragmentShader: HALO_FS, side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
            uniforms: { uColor: { value: C(color) }, uSunPos: shared.uSunPos, uCenter: { value: new THREE.Vector3() }, uK: { value: k } },
        }));
        return m;
    }
    function ring(kind, r, inner, outer, c1, c2) {
        const m = new THREE.Mesh(new THREE.RingGeometry(r * inner, r * outer, 180, 1), new THREE.ShaderMaterial({
            defines, vertexShader: RING_VS, fragmentShader: RING_FS, side: THREE.DoubleSide, transparent: true, depthWrite: false,
            uniforms: { uSunPos: shared.uSunPos, uCenter: { value: new THREE.Vector3() }, uR: { value: r }, uInner: { value: r * inner }, uOuter: { value: r * outer }, uKind: { value: kind }, uC1: { value: C(c1) }, uC2: { value: C(c2) } },
        }));
        m.rotation.x = -Math.PI / 2;
        return m;
    }

    let seedAngle = 0.9;
    for (const [key, d] of Object.entries(DEF)) {
        const orbit = new THREE.Group();          // a Nap körüli pálya
        const tilt = new THREE.Group();           // a tengelyferdeség
        const spin = new THREE.Group();           // a tengely körüli forgás
        tilt.rotation.z = d.tilt;
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(d.r, SEG[0], SEG[1]), planetMaterial(d));
        spin.add(mesh); tilt.add(spin); orbit.add(tilt); scene.add(orbit);
        const b = { key, d, orbit, tilt, spin, mesh, angle: (seedAngle += 2.15), extra: 0, halo: null, rings: [], world: new THREE.Vector3() };
        if (d.atmo[1] > 0 && key !== 'merkur') { b.halo = halo(d.r, d.atmo[0], key === 'fold' ? 1.25 : .8); tilt.add(b.halo); }
        if (key === 'szaturnusz') { const r = ring(0, d.r, 1.24, 2.3, '#d8c49a', '#9c8664'); tilt.add(r); b.rings.push(r); }
        if (key === 'uranusz') { const r = ring(1, d.r, 1.55, 2.05, '#7f8a90', '#7f8a90'); tilt.add(r); b.rings.push(r); }
        if (key === 'fold') {
            const clouds = new THREE.Mesh(new THREE.SphereGeometry(d.r * 1.012, SEG[0], SEG[1]), new THREE.ShaderMaterial({
                defines, vertexShader: PLANET_VS, fragmentShader: CLOUD_FS, transparent: true, depthWrite: false, uniforms: { uTime: shared.uTime, uSunPos: shared.uSunPos },
            }));
            tilt.add(clouds); b.clouds = clouds;
        }
        const hit = new THREE.Mesh(new THREE.SphereGeometry(Math.max(d.r * 1.6, 2.4), 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
        hit.userData.key = key; orbit.add(hit); b.hit = hit; pickables.push(hit);
        bodies.set(key, b);
    }

    // Hold a Föld körül (kötött tengelyforgás: mindig ugyanazt az oldalát mutatja)
    const moonDef = { r: .27, type: 0, c: ['#6f6c69', '#b9b4ad', '#3f3d3c'], atmo: ['#000', 1], seed: 9.4 };
    const moon = new THREE.Mesh(new THREE.SphereGeometry(moonDef.r, SEG[0], SEG[1]), planetMaterial(moonDef));
    scene.add(moon);
    const moonState = { angle: 0, drift: 0, extra: 0, world: new THREE.Vector3(), r: moonDef.r };

    // Nap: animált felszín + kétrétegű fény
    const SUN_R = 6;
    const sun = new THREE.Mesh(new THREE.SphereGeometry(SUN_R, SEG[0], SEG[1]), new THREE.ShaderMaterial({ defines, vertexShader: PLANET_VS, fragmentShader: SUN_FS, uniforms: { uTime: shared.uTime } }));
    scene.add(sun);
    const glowTex = (stops) => {
        const c = document.createElement('canvas'); c.width = c.height = 256;
        const g = c.getContext('2d'), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
        stops.forEach(([o, col]) => gr.addColorStop(o, col)); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
    };
    const glow1 = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex([[0, 'rgba(255,214,150,1)'], [.22, 'rgba(255,170,70,.55)'], [.5, 'rgba(255,110,30,.12)'], [1, 'rgba(0,0,0,0)']]), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    glow1.scale.setScalar(SUN_R * 4.4); scene.add(glow1);
    const glow2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex([[0, 'rgba(255,190,110,.35)'], [.4, 'rgba(255,120,40,.08)'], [1, 'rgba(0,0,0,0)']]), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    glow2.scale.setScalar(SUN_R * 9); scene.add(glow2);
    const sunHit = new THREE.Mesh(new THREE.SphereGeometry(SUN_R * 1.1, 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
    sunHit.userData.key = 'nap'; scene.add(sunHit); pickables.push(sunHit);

    // pályák
    const orbitLines = [];
    for (const b of bodies.values()) {
        const pts = [];
        for (let i = 0; i < 256; i++) { const a = i / 256 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * b.d.dist, 0, Math.sin(a) * b.d.dist)); }
        const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .1, depthWrite: false }));
        scene.add(line); orbitLines.push(line);
    }

    // csillagok, Tejút-sáv, kisbolygóöv
    function pointCloud(n, place, atten) {
        const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), size = new Float32Array(n), ph = new Float32Array(n);
        const v = new THREE.Vector3(), c = new THREE.Color();
        for (let i = 0; i < n; i++) { const s = place(v, c, i); pos.set([v.x, v.y, v.z], i * 3); col.set([c.r, c.g, c.b], i * 3); size[i] = s; ph[i] = Math.random(); }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
        g.setAttribute('aSize', new THREE.BufferAttribute(size, 1)); g.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
        return new THREE.Points(g, new THREE.ShaderMaterial({
            vertexShader: POINTS_VS, fragmentShader: POINTS_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
            uniforms: { uTime: shared.uTime, uPx: { value: DPR }, uAtten: { value: atten ? 1 : 0 }, uTwinkle: { value: REDUCED || atten ? 0 : 1 } },
        }));
    }
    const randDir = v => v.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
    const sky = new THREE.Group(); scene.add(sky);
    sky.add(pointCloud(LOW ? 2200 : 3600, (v, c) => {
        randDir(v).multiplyScalar(1500);
        const k = Math.random(); c.setRGB(k < .15 ? .75 : 1, k < .15 ? .85 : .96, k > .85 ? .78 : 1);
        const s = Math.pow(Math.random(), 6) * 4.5 + .9; c.multiplyScalar(.45 + Math.random() * .55); return s;
    }));
    const band = new THREE.Vector3(.3, 1, .2).normalize(), bx = new THREE.Vector3(1, -.3, 0).normalize(), by = new THREE.Vector3().crossVectors(band, bx);
    sky.add(pointCloud(LOW ? 2600 : 5200, (v, c) => {
        const a = Math.random() * Math.PI * 2, spread = (Math.random() + Math.random() + Math.random() - 1.5) * .22;
        v.copy(bx).multiplyScalar(Math.cos(a)).addScaledVector(by, Math.sin(a)).addScaledVector(band, spread).normalize().multiplyScalar(1500);
        c.setRGB(.8 + Math.random() * .2, .78 + Math.random() * .15, .95).multiplyScalar(.18 + Math.random() * .3); return .7 + Math.random() * 1.4;
    }));
    const belt = pointCloud(LOW ? 900 : 1800, (v, c) => {
        const a = Math.random() * Math.PI * 2, r = 34 + Math.random() * 5;
        v.set(Math.cos(a) * r, (Math.random() - .5) * 1.4, Math.sin(a) * r); c.setRGB(.55, .52, .5).multiplyScalar(.6 + Math.random() * .5); return .6 + Math.random() * 1.6;
    }, true);
    scene.add(belt);

    // közeli csillagok: valódi térbeli pontok, repülés közben láthatóan elmozdulnak a távoli háttérhez képest
    const nearStars = pointCloud(LOW ? 700 : 1600, (v, c) => {
        randDir(v).multiplyScalar(140 + Math.random() * 520);
        const k = Math.random(); c.setRGB(k < .2 ? .78 : 1, k < .2 ? .86 : .97, k > .8 ? .8 : 1).multiplyScalar(.5 + Math.random() * .5);
        return .8 + Math.random() * 1.8;
    }, true);
    scene.add(nearStars);

    // ködök: halvány, nagy színfoltok a háttérben; a görgetéssel a csillagoknál gyorsabban fordulnak (mélység)
    const nebula = new THREE.Group(); scene.add(nebula);
    const nebulaTex = (rgb, seed) => {
        const c = document.createElement('canvas'); c.width = c.height = 256;
        const g = c.getContext('2d');
        let r = seed; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
        for (let i = 0; i < 26; i++) {
            const x = 128 + (rnd() - .5) * 120, y = 128 + (rnd() - .5) * 90, rad = 30 + rnd() * 80;
            const gr = g.createRadialGradient(x, y, 0, x, y, rad);
            gr.addColorStop(0, `rgba(${rgb},${(.05 + rnd() * .09).toFixed(3)})`); gr.addColorStop(1, `rgba(${rgb},0)`);
            g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
        }
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
    };
    [['70,90,190', 11, [-.6, .35, -.7], 900], ['120,70,170', 23, [.75, -.2, -.5], 760], ['40,130,150', 37, [.2, .55, .8], 820], ['150,80,55', 41, [-.8, -.4, .45], 640], ['60,80,160', 53, [.5, .1, .85], 700]]
        .slice(0, LOW ? 3 : 5).forEach(([rgb, seed, dir, size]) => {
            const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: nebulaTex(rgb, seed), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .85 }));
            sp.position.set(...dir).normalize().multiplyScalar(1250); sp.scale.setScalar(size); nebula.add(sp);
        });

    // légköri por és előtér-részecskék (néhány nagy, életlen „bokeh” folt)
    const DUST_N = LOW ? 110 : 240, DUST_BOX = 34;
    const dustPos = new Float32Array(DUST_N * 3), dustSize = new Float32Array(DUST_N);
    for (let i = 0; i < DUST_N; i++) {
        dustPos.set([Math.random() * DUST_BOX, Math.random() * DUST_BOX, Math.random() * DUST_BOX], i * 3);
        dustSize[i] = Math.random() < .06 ? 7 + Math.random() * 8 : .7 + Math.random() * 1.6;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    dustGeo.setAttribute('aSize', new THREE.BufferAttribute(dustSize, 1));
    const dust = new THREE.Points(dustGeo, new THREE.ShaderMaterial({
        vertexShader: DUST_VS, fragmentShader: DUST_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uCam: { value: new THREE.Vector3() }, uBox: { value: DUST_BOX }, uPx: { value: DPR }, uAlpha: { value: .5 } },
    }));
    dust.frustumCulled = false; scene.add(dust);

    // meteorok (a kamerához rögzítve, mint egy hullócsillag a háttérben)
    const meteors = [];
    for (let i = 0; i < 3; i++) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({ vertexShader: UV_VS, fragmentShader: METEOR_FS, uniforms: { uAlpha: { value: 0 } }, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending }));
        m.visible = false; m.renderOrder = -1; camera.add(m);
        meteors.push({ m, life: 1, speed: 0, dir: new THREE.Vector2() });
    }
    let meteorTimer = 1.2;
    function spawnMeteor() {
        const s = meteors.find(x => x.life >= 1); if (!s) return;
        const h = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 10, w = h * camera.aspect;
        s.m.position.set(THREE.MathUtils.randFloat(-w * .2, w * 1.1), THREE.MathUtils.randFloat(h * .1, h * 1.1), -10);
        const ang = Math.PI + THREE.MathUtils.randFloat(.35, .65);
        s.dir.set(Math.cos(ang), Math.sin(ang));
        s.m.rotation.z = ang + Math.PI; s.m.scale.set(THREE.MathUtils.randFloat(1.6, 3.2), .016, 1);
        s.speed = THREE.MathUtils.randFloat(7, 12); s.life = 0; s.m.visible = true;
    }

    // „hipertér”: repülés közben a csillagok fénycsíkokká nyúlnak (a kamerához rögzített vonalak)
    const WARP_N = LOW ? 70 : 140;
    const warpPos = new Float32Array(WARP_N * 6), warpCol = new Float32Array(WARP_N * 6), warpSeed = [];
    for (let i = 0; i < WARP_N; i++) {
        const a = Math.random() * Math.PI * 2, r = 1.2 + Math.pow(Math.random(), .6) * 9;
        warpSeed.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, z: -Math.random() * 90, len: 3 + Math.random() * 7 });
        const c = .55 + Math.random() * .45;
        warpCol.set([0, 0, 0, c * .8, c * .9, c], i * 6); // farka sötét, feje világos (additív keverés)
    }
    const warpGeo = new THREE.BufferGeometry();
    warpGeo.setAttribute('position', new THREE.BufferAttribute(warpPos, 3));
    warpGeo.setAttribute('color', new THREE.BufferAttribute(warpCol, 3));
    const warpLines = new THREE.LineSegments(warpGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false }));
    warpLines.frustumCulled = false; warpLines.renderOrder = -2; camera.add(warpLines);
    let warp = 0, baseFov = 40, warpInit = true;
    const prevCam = new THREE.Vector3();

    // kijelölő gyűrű a térképen
    const selRing = new THREE.Mesh(new THREE.RingGeometry(1, 1.08, 64), new THREE.MeshBasicMaterial({ color: 0xffbf6b, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    scene.add(selRing);

    // ── kamera-állapotok ──
    const UP = new THREE.Vector3(0, 1, 0);
    const tmp = { a: mkState(), b: mkState() };
    function mkState() { return { pos: new THREE.Vector3(), target: new THREE.Vector3(), sx: 0, sy: 0 }; }
    let yaw = .5, yawTarget = .5;
    const portrait = () => innerWidth < 760 || innerWidth / innerHeight < .9;

    let introT = REDUCED ? 1 : 0; // nyitány: a kamera a betöltéskor messziről érkezik a Holdhoz
    function bodyState(key, out, p = .5) {
        const narrow = portrait();
        if (key === 'outro') { // zárás: a kamera kihátrál, a Naprendszer egyetlen fénypont lesz a csillagok között
            out.target.set(0, 0, 0);
            const dist = (narrow ? 820 : 620) * (1 + p * .5);
            out.pos.set(Math.sin(yaw + .6) * dist * .6, dist * .62, Math.cos(yaw + .6) * dist * .6);
            out.sx = 0; out.sy = narrow ? .1 : 0; return out;
        }
        if (key === 'overview' || key === 'overview-quiet') {
            out.target.set(0, 0, 0);
            const dist = narrow ? 230 : 150;
            out.pos.set(Math.sin(yaw) * dist * .8, dist * .55, Math.cos(yaw) * dist * .8);
            out.sx = narrow ? 0 : .14; out.sy = narrow ? .14 : 0; return out;
        }
        let P, r, k;
        if (key === 'nap') { P = sunPos; r = SUN_R; k = 4.4; }
        else if (key === 'hold') { P = moonState.world; r = moonState.r; k = 6.2; }
        else { const b = bodies.get(key); P = b.world; r = b.d.r; k = key === 'szaturnusz' ? 7.6 : key === 'uranusz' ? 6.6 : 5.6; }
        if (narrow) k *= 1.35;
        // a megállás alatt a kamera lassan közelít és kissé körbejárja az égitestet
        k *= THREE.MathUtils.lerp(1.12, .93, p);
        if (key === 'hold') k *= 1 + 2.8 * (1 - easeOut(introT));
        const toSun = key === 'nap' ? new THREE.Vector3(.55, .2, 1).normalize() : sunPos.clone().sub(P).normalize();
        const side = new THREE.Vector3().crossVectors(UP, toSun).normalize();
        let dir;
        if (key === 'hold') {
            // a kamera a Nap felőli oldalon, a Földtől elfelé eltolva: a Hold szépen megvilágított, a Föld a képen kívül marad
            const away = moonState.world.clone().sub(bodies.get('fold').world).normalize();
            dir = toSun.clone().multiplyScalar(.85).addScaledVector(away, .35).addScaledVector(UP, .18).normalize();
        } else {
            dir = toSun.clone().multiplyScalar(Math.cos(.62)).addScaledVector(side, Math.sin(.62)).addScaledVector(UP, key === 'szaturnusz' ? .32 : .2).normalize();
        }
        dir.applyAxisAngle(UP, (p - .5) * .55 + (key === 'hold' ? (1 - easeOut(introT)) * .7 : 0));
        out.target.copy(P);
        out.pos.copy(P).addScaledVector(dir, r * k);
        out.sx = narrow ? 0 : .2; out.sy = narrow ? (key === 'hold' ? .3 : .2) : 0;
        return out;
    }

    // görgetés → szakasz-index
    let anchors = [];
    function measure() {
        anchors = $$('[data-focus]').map(el => { const r = el.getBoundingClientRect(); return { key: el.dataset.focus, y: r.top + scrollY + r.height / 2, top: r.top + scrollY, h: r.height }; });
    }
    const ease = t => t * t * (3 - 2 * t);
    const camPos = new THREE.Vector3(), camTarget = new THREE.Vector3(), desiredPos = new THREE.Vector3(), desiredTarget = new THREE.Vector3();
    let shiftX = 0, shiftY = 0, overview = 0, mapOnly = 0, outroMix = 0, veilO = 0, veilColor = '#5aa8ff', focusKey = 'hold', first = true;
    // átrepülés: ezekről az égitestekről a kamera a légkörbe merülve, színes fátylon át érkezik a következőhöz
    const ZOOM = { fold: '#6fb4ff', jupiter: '#e3c08e' };
    const veil = $('.veil');
    const radiusOfKey = key => key === 'nap' ? SUN_R : key === 'hold' ? moonState.r : bodies.has(key) ? bodies.get(key).d.r : 1;
    const progressIn = (A, y) => THREE.MathUtils.clamp((y - A.top) / Math.max(1, A.h), 0, 1);
    const vA = new THREE.Vector3(), vB = new THREE.Vector3();

    let yS = null, sunScrollP = 0;
    function desired(k) {
        const yRaw = scrollY + innerHeight / 2;
        yS = yS === null ? yRaw : yS + (yRaw - yS) * k;
        const y = yS;
        // A: az aktuális szakasz, B: a következő; a repülés a kettő határa körüli ablakban történik,
        // a szakasz többi részén a kamera az égitestnél marad (lassan közelít, körbejár)
        let i = 0;
        while (i < anchors.length - 1 && anchors[i + 1].top <= y) i++;
        const A = anchors[i], B = anchors[Math.min(i + 1, anchors.length - 1)];
        const zoom = ZOOM[A.key] && B !== A && !REDUCED;
        const H = innerHeight, win = (zoom ? 1.25 : .9) * H;
        const raw = B === A ? 0 : THREE.MathUtils.clamp((y - (B.top - win / 2)) / win, 0, 1);
        const pA = progressIn(A, y), pB = progressIn(B, y);
        const a = bodyState(A.key, tmp.a, pA), b = bodyState(B.key, tmp.b, pB);
        let sx, sy, f;
        if (zoom) {
            // 1. fele: a kamera ráközelít, a bolygó betölti a képet; 2. fele: messziről érkezik a következőhöz
            f = raw;
            if (f < .5) {
                const g = Math.pow(f / .5, 2.2);
                vA.copy(a.pos).sub(a.target).normalize().multiplyScalar(radiusOfKey(A.key) * 1.04).add(a.target);
                desiredPos.lerpVectors(a.pos, vA, g); desiredTarget.copy(a.target);
                sx = a.sx * (1 - g); sy = a.sy * (1 - g);
            } else {
                const g = easeOut((f - .5) / .5);
                vB.copy(b.pos).sub(b.target).multiplyScalar(3.4).add(b.target);
                desiredPos.lerpVectors(vB, b.pos, g); desiredTarget.copy(b.target);
                sx = b.sx * g; sy = b.sy * g;
            }
            veilO = THREE.MathUtils.smoothstep(f, .34, .5) * (1 - THREE.MathUtils.smoothstep(f, .5, .68));
            veilColor = ZOOM[A.key];
        } else {
            f = ease(raw);
            desiredPos.lerpVectors(a.pos, b.pos, f);
            const hop = Math.min(a.pos.distanceTo(b.pos) * .18, 26);
            desiredPos.addScaledVector(UP, Math.sin(f * Math.PI) * hop);
            desiredTarget.lerpVectors(a.target, b.target, f);
            sx = THREE.MathUtils.lerp(a.sx, b.sx, f); sy = THREE.MathUtils.lerp(a.sy, b.sy, f);
            veilO = 0;
        }
        const ov = k => k.startsWith('overview');
        overview = (ov(A.key) ? 1 - f : 0) + (ov(B.key) ? f : 0);
        mapOnly = (A.key === 'overview' ? 1 - f : 0) + (B.key === 'overview' ? f : 0);
        outroMix = (A.key === 'outro' ? 1 - f : 0) + (B.key === 'outro' ? f : 0);
        focusKey = f < .5 ? A.key : B.key;
        // görgetéssel vezérelt forgás: égitestenként a saját szakaszán belüli haladás (a simított görgetésből → tehetetlenség)
        for (const an of anchors) {
            const sp = THREE.MathUtils.clamp((y - an.top + H * .5) / (an.h + H), 0, 1);
            if (bodies.has(an.key)) bodies.get(an.key).scrollP = sp;
            else if (an.key === 'nap') sunScrollP = sp;
            else if (an.key === 'hold') moonState.scrollP = sp;
        }
        return { sx, sy };
    }

    // ── interakció: húzás (forgatás) és kattintás (kijelölés) ──
    let selected = null, drag = null;
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, lx: e.clientX, moved: 0, id: e.pointerId }; });
    addEventListener('pointermove', e => {
        if (!drag || e.pointerId !== drag.id) return;
        const dx = e.clientX - drag.lx; drag.lx = e.clientX; drag.moved += Math.abs(dx);
        if (overview > .5) yawTarget -= dx * .006;
        else spinBoost += dx * .0035;
    });
    addEventListener('pointerup', e => {
        if (!drag || e.pointerId !== drag.id) return;
        const click = drag.moved < 6 && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 8;
        drag = null;
        if (!click || overview < .5) return;
        ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
        ray.setFromCamera(ndc, camera);
        const hit = ray.intersectObjects(pickables, false)[0];
        if (hit) select(hit.object.userData.key);
    });
    addEventListener('pointercancel', () => { drag = null; });
    let spinBoost = 0;

    // bolygónév-gombok a térképen
    const labelBox = $('.labels'); labelBox.setAttribute('translate', 'no');
    const labels = ENTRIES.map(e => {
        const btn = document.createElement('button'); btn.type = 'button'; btn.textContent = e.name[LANG]; btn.tabIndex = -1;
        btn.addEventListener('click', () => select(e.key)); labelBox.appendChild(btn);
        return { key: e.key, btn };
    });
    function select(key) {
        selected = key; renderCard(key);
        labels.forEach(l => l.btn.classList.toggle('sel', l.key === key));
    }
    const worldOf = key => key === 'nap' ? sunPos : bodies.get(key).world;
    const radiusOf = key => key === 'nap' ? SUN_R : bodies.get(key).d.r;

    // ── méretezés, futás ──
    function resize() {
        const w = innerWidth, h = innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h; baseFov = portrait() ? 52 : 40; camera.fov = baseFov; camera.updateProjectionMatrix();
        measure();
    }
    addEventListener('resize', resize);
    resize();
    setTimeout(measure, 600); addEventListener('load', measure);
    if ('ResizeObserver' in window) new ResizeObserver(() => measure()).observe(document.body);

    const clock = new THREE.Clock();
    const v3 = new THREE.Vector3();
    let t = 0, sunAuto = 0;
    const navy = new THREE.Color(0x02040b), warm = new THREE.Color(0x0b0705), clear = new THREE.Color();
    function frame() {
        requestAnimationFrame(frame);
        if (document.hidden) { clock.getDelta(); return; }
        const realDt = clock.getDelta();
        const dt = Math.min(realDt, .05);
        const speed = REDUCED ? .25 : 1;
        t += dt * speed; shared.uTime.value = t;

        // pályák és forgás
        for (const b of bodies.values()) {
            b.angle += dt * speed * (Math.PI * 2) / (ORBIT_SEC * Math.sqrt(b.d.years));
            b.orbit.position.set(Math.cos(b.angle) * b.d.dist, 0, Math.sin(b.angle) * b.d.dist);
            if (focusKey === b.key) b.extra += spinBoost;
            b.auto = (b.auto || 0) + dt * speed * b.d.spin;
            const scrollRot = (b.scrollP || 0) * Math.PI * 1.6 * Math.sign(b.d.spin);
            b.spin.rotation.y = b.auto + scrollRot + b.extra;
            if (b.clouds) b.clouds.rotation.y = b.auto * 1.25 + scrollRot * 1.08 + b.extra;
            b.orbit.updateMatrixWorld();
            b.world.setFromMatrixPosition(b.mesh.matrixWorld);
            if (b.halo) b.halo.material.uniforms.uCenter.value.copy(b.world);
            b.rings.forEach(r => r.material.uniforms.uCenter.value.copy(b.world));
        }
        const earth = bodies.get('fold').world;
        moonState.drift += dt * speed * (Math.PI * 2) / 1200;
        moonState.angle = bodies.get('fold').angle - Math.PI / 2 + moonState.drift;
        moon.position.set(earth.x + Math.cos(moonState.angle) * 2.6, earth.y + Math.sin(moonState.angle) * .25, earth.z + Math.sin(moonState.angle) * 2.6);
        moon.rotation.y = -moonState.angle + Math.PI / 2 + moonState.extra + (moonState.scrollP || 0) * Math.PI * .9;
        if (focusKey === 'hold') moonState.extra += spinBoost;
        moonState.world.copy(moon.position);
        sunAuto += dt * speed * .02 + (focusKey === 'nap' ? spinBoost : 0);
        sun.rotation.y = sunAuto + sunScrollP * Math.PI * .8;
        spinBoost *= REDUCED ? 0 : Math.exp(-dt * 3.5);
        belt.rotation.y += dt * speed * .004;

        if (introT < 1) introT = Math.min(1, introT + realDt / 3.4);
        // kamera
        yaw += (yawTarget - yaw) * (REDUCED ? 1 : 1 - Math.exp(-Math.min(realDt, .5) * 5));
        const k = first || REDUCED ? 1 : 1 - Math.exp(-Math.min(realDt, .5) * 3.2);
        const s = desired(k);
        camPos.copy(desiredPos); camTarget.copy(desiredTarget);
        shiftX = s.sx; shiftY = s.sy; first = false;
        // repülési sebesség -> hipertér-hatás és enyhe látószög-tágulás
        if (warpInit) { prevCam.copy(camPos); warpInit = false; }
        const vel = camPos.distanceTo(prevCam) / Math.max(dt, 1e-3);
        prevCam.copy(camPos);
        const wantWarp = REDUCED || introT < 1 ? 0 : THREE.MathUtils.smoothstep(vel, 6, 34) * (1 - overview) * (1 - outroMix);
        warp += (wantWarp - warp) * (1 - Math.exp(-dt * 6));
        camera.fov = baseFov + warp * 9;
        warpLines.material.opacity = warp * .9;
        if (warp > .01) {
            for (let i = 0; i < WARP_N; i++) {
                const w = warpSeed[i];
                w.z += dt * (40 + 140 * warp);
                if (w.z > -1) w.z -= 90;
                const L = w.len * (.4 + 2.2 * warp);
                warpPos.set([w.x, w.y, w.z - L, w.x, w.y, w.z], i * 6);
            }
            warpGeo.attributes.position.needsUpdate = true;
        }
        camera.position.copy(camPos); camera.lookAt(camTarget);
        const W = innerWidth, H = innerHeight;
        camera.setViewOffset(W, H, -shiftX * W, shiftY * H, W, H);
        sky.position.copy(camera.position);
        // mélység: a távoli csillagok alig, a ködök gyorsabban fordulnak a görgetéssel; a por a kamera körül ismétlődik
        const yy = yS || 0;
        sky.rotation.y = yy * .000012;
        nebula.position.copy(camera.position); nebula.rotation.y = yy * .000045; nebula.rotation.x = yy * .000012;
        dust.material.uniforms.uCam.value.copy(camera.position);
        dust.material.uniforms.uAlpha.value = (.42 + warp * .9) * (1 - overview * .7) * (1 - outroMix);
        // hangulatfény: a Nap közelében meleg, kint hideg, sötétkék háttér
        const warmK = 1 - THREE.MathUtils.smoothstep(camera.position.length(), 22, 75);
        clear.copy(navy).lerp(warm, warmK); renderer.setClearColor(clear, 1);
        glow2.material.opacity = 1 - outroMix * .4;
        // átrepülési fátyol
        if (veil) { veil.style.setProperty('--o', veilO.toFixed(3)); veil.style.setProperty('--c', veilColor); }

        // térkép-réteg
        orbitLines.forEach(l => { l.material.opacity = .05 + .3 * overview + .22 * outroMix; });
        belt.material.uniforms.uPx.value = DPR * (.5 + .5 * overview);
        labelBox.classList.toggle('on', mapOnly > .65);
        if (overview > .02) {
            for (const l of labels) {
                v3.copy(worldOf(l.key)); v3.project(camera);
                const off = v3.z > 1 || Math.abs(v3.x) > 1.1 || Math.abs(v3.y) > 1.1;
                l.btn.classList.toggle('hide', off);
                if (!off) {
                    const px = (v3.x * .5 + .5) * W, py = (-v3.y * .5 + .5) * H;
                    const rpx = radiusOf(l.key) / camera.position.distanceTo(worldOf(l.key)) * H / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
                    l.btn.style.transform = `translate(${(px + Math.max(rpx, 4) + 6).toFixed(1)}px, ${py.toFixed(1)}px) translateY(-50%)`;
                }
            }
        }
        if (selected && overview > .02) {
            const P = worldOf(selected), r = radiusOf(selected);
            const minR = camera.position.distanceTo(P) * .012;
            selRing.position.copy(P); selRing.scale.setScalar(Math.max(r * 1.45, minR)); selRing.lookAt(camera.position);
            selRing.material.opacity = .9 * overview;
        } else selRing.material.opacity = 0;

        // meteorok
        if (!REDUCED) {
            meteorTimer -= dt * (overview > .5 ? .35 : 1);
            if (meteorTimer <= 0) { spawnMeteor(); meteorTimer = THREE.MathUtils.randFloat(1.6, 4.8); }
            for (const m of meteors) {
                if (m.life >= 1) continue;
                m.life = Math.min(1, m.life + dt / 1.1);
                m.m.position.x += m.dir.x * m.speed * dt; m.m.position.y += m.dir.y * m.speed * dt;
                m.m.material.uniforms.uAlpha.value = Math.sin(m.life * Math.PI) * .9;
                if (m.life >= 1) m.m.visible = false;
            }
        }
        renderer.render(scene, camera);
    }
    measure();
    frame();
    document.documentElement.classList.add('webgl-ready');
}

// a shaderek (const) fent vannak definiálva, ezért a jelenet a fájl végén indul
try { initSpace(); } catch (e) { console.warn('WebGL nem elérhető:', e); document.body.classList.add('no-webgl'); }
