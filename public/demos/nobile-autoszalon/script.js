/* NOBILE. Prémium Autószalon — autórajzoló, fénysöprés, 3D kollekció aranypor-szétbomlással, konfigurátor, foglalás. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ft = n => new Intl.NumberFormat('hu-HU').format(Math.round(n)) + ' Ft';

  /* ---------- Színsegéd: hex világosítása/sötétítése ---------- */
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255];
    return '#' + c.map(v => Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k)).toString(16).padStart(2, '0')).join('');
  }

  /* ---------- Stilizált GT-kupé oldalnézetből (SVG) ---------- */
  const RIMS = { silver: ['#c4c7cc', '#24262a'], black: ['#3a3a3e', '#0b0b0d'], gold: ['#d2b07a', '#3a2c16'] };
  let uid = 0;
  function carSVG(color, rim = 'silver') {
    const id = 'c' + (++uid), [r1, r2] = RIMS[rim];
    const body = 'M38,214C36,196 48,184 78,180L214,160C262,152 300,136 352,108C392,86 440,78 500,80C560,82 610,98 656,126C700,142 742,152 760,166C774,178 774,206 766,222L748,232L670,232A62,62 0 0 0 546,232L254,232A62,62 0 0 0 130,232L58,232C44,230 38,224 38,214Z';
    const roof = 'M78,180L214,160C262,152 300,136 352,108C392,86 440,78 500,80C560,82 610,98 656,126C700,142 742,152 760,166';
    const wheel = (cx) => `<g class="wheel" data-cx="${cx}" transform="translate(${cx} 232)">
        <circle r="52" fill="#060606"/><circle r="50" fill="none" stroke="#1d1d1d" stroke-width="3"/>
        <circle r="38" fill="url(#${id}r)"/>
        <g class="spokes">${[0, 1, 2, 3, 4].map(k => `<path transform="rotate(${k * 72})" d="M-3,-10L-8,-37L-2,-37L0,-14L2,-37L8,-37L3,-10Z" fill="${r1}"/>`).join('')}</g>
        <path d="M-22,-26A34,34 0 0 1 8,-33" stroke="#c9a96a" stroke-width="7" fill="none" stroke-linecap="round" opacity=".9"/>
        <circle r="11" fill="#0c0c0c" stroke="${r1}" stroke-width="2"/><circle r="3" fill="#c9a96a"/>
      </g>`;
    return `<svg class="car" viewBox="0 0 800 300" aria-hidden="true">
      <defs>
        <linearGradient id="${id}b" x1="0" y1="80" x2="0" y2="235" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="${shade(color, .5)}"/><stop offset=".32" stop-color="${shade(color, .14)}"/>
          <stop offset=".6" stop-color="${color}"/><stop offset="1" stop-color="${shade(color, -.75)}"/>
        </linearGradient>
        <linearGradient id="${id}s" x1="0" x2="220" gradientUnits="userSpaceOnUse" gradientTransform="translate(-300 0)">
          <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff6e0" stop-opacity=".42"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="${id}l" x1="78" x2="760" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#8a6d3b"/><stop offset=".45" stop-color="#fbeac0"/><stop offset="1" stop-color="#c9a96a"/>
        </linearGradient>
        <radialGradient id="${id}r"><stop offset=".55" stop-color="${r2}"/><stop offset="1" stop-color="${r1}"/></radialGradient>
        <radialGradient id="${id}g"><stop offset="0" stop-color="#000" stop-opacity=".85"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
        <radialGradient id="${id}h"><stop offset="0" stop-color="#fff8e6"/><stop offset="1" stop-color="#fff8e6" stop-opacity="0"/></radialGradient>
      </defs>
      <ellipse cx="400" cy="284" rx="390" ry="16" fill="url(#${id}g)"/>
      <path d="${body}" fill="url(#${id}b)"/>
      <path d="M366,112C402,92 444,86 498,87C548,88 590,100 628,124C600,128 420,130 366,128Z" fill="#07080a" stroke="#ffffff22"/>
      <path d="M520,88L524,128" stroke="${shade(color, -.4)}" stroke-width="5"/>
      <path d="M366,112C402,92 444,86 498,87" fill="none" stroke="#ffffff38" stroke-width="1.5"/>
      <path d="M70,198C260,184 520,178 764,186" fill="none" stroke="#ffffff26" stroke-width="1.2"/>
      <path d="M332,140C328,170 332,204 342,228M540,132C548,170 548,204 540,228" fill="none" stroke="#00000066" stroke-width="1.2"/>
      <path d="M356,124l-16,-6l-6,10l18,4z" fill="${shade(color, -.3)}"/>
      <path d="M466,150h26" stroke="#ffffff40" stroke-width="3" stroke-linecap="round"/>
      <path d="M44,200C60,192 90,188 120,186L116,194C92,196 66,200 46,206Z" fill="#fff8e6"/>
      <ellipse cx="70" cy="196" rx="70" ry="18" fill="url(#${id}h)" opacity=".35"/>
      <path d="M744,170C758,174 768,182 770,190L762,190C758,184 752,180 742,177Z" fill="#c2202e"/>
      <path class="sheen" d="${body}" fill="url(#${id}s)"/>
      <path class="rim-light" d="${roof}" fill="none" stroke="url(#${id}l)" stroke-width="1.8" stroke-linecap="round" pathLength="100" stroke-dasharray="100 100"/>
      ${wheel(192)}${wheel(608)}
    </svg>`;
  }
  // a fénysöprés, a „rajzoló” peremfény és a kerekek forgása egy 0–1 értékből
  function lightCar(root, t, spin = t) {
    const sheen = root.querySelector('linearGradient[id$="s"]');
    if (sheen) sheen.setAttribute('gradientTransform', `translate(${-300 + t * 1200} 0)`);
    const rl = root.querySelector('.rim-light');
    if (rl) rl.style.strokeDashoffset = String(100 - clamp(t * 1.4) * 100);
    root.querySelectorAll('.spokes').forEach(g => g.setAttribute('transform', `rotate(${-spin * 900})`));
  }

  /* ---------- Óra ---------- */
  const clock = $('#clock');
  const tick = () => { clock.textContent = new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' }); };
  tick(); setInterval(tick, 15000);

  /* ---------- HERO ---------- */
  const heroCar = $('#heroCar'), sprint = $('#sprint');
  heroCar.innerHTML = carSVG('#121214', 'silver');
  lightCar(heroCar, reduced ? 1 : .05);
  $('.hero').addEventListener('scene:frame', e => {
    const p = e.detail.p;
    lightCar(heroCar, .05 + p * .95);
    sprint.textContent = (9.9 - clamp((p - .15) / .7) * 6.5).toFixed(1);
  });

  /* ---------- KOLLEKCIÓ: 3D repülés + aranypor ---------- */
  const corridor = $('#kollekcio'), world = $('#world'), pin = corridor.querySelector('.scene-pin');
  const panels = [...world.children].map((el, i) => ({ el, i, x: Number(el.dataset.x || 0), y: Number(el.dataset.y || 0), gone: false, color: el.dataset.color || '#c9a96a' }));
  panels.forEach(pn => { const slot = pn.el.querySelector('.pc-car'); if (slot) slot.innerHTML = carSVG(pn.color, 'silver'); if (slot) lightCar(slot, .7, 0); });

  if (reduced) {
    corridor.classList.add('flat');
  } else {
    const cv = $('#dust'), ctx = cv.getContext('2d');
    let W = 0, H = 0, dpr = 1, p = 0, cam = 0, lastCam = 0, visible = false, raf = 0;
    const spacing = () => (W < 860 ? 950 : 1250);
    const stars = Array.from({ length: 240 }, () => ({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random() }));
    const shards = [];
    const golds = ['#ecd9a8', '#c9a96a', '#f6e8c3', '#8a6d3b', '#fff3d6'];

    function resize() {
      dpr = Math.min(devicePixelRatio || 1, 1.5);
      W = pin.clientWidth; H = pin.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    // a panel képernyő-téglalapjából aranyszilánkok repülnek szét a kamera felé
    function shatter(pn) {
      const r = pn.el.getBoundingClientRect(), o = pin.getBoundingClientRect();
      const cx = W / 2, cy = H / 2, count = W < 860 ? 140 : 260;
      const left = Math.max(-50, r.left - o.left), top = Math.max(-50, r.top - o.top);
      const w = Math.min(W + 100, r.width), h = Math.min(H + 100, r.height);
      for (let k = 0; k < count && shards.length < 1600; k++) {
        const x = left + Math.random() * w, y = top + Math.random() * h;
        const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) || 1, sp = 2 + Math.random() * 9;
        shards.push({ x, y, vx: dx / d * sp + (Math.random() - .5) * 2, vy: dy / d * sp + (Math.random() - .5) * 2 - 1,
          s: 1.5 + Math.random() * 4, rot: Math.random() * 6, vr: (Math.random() - .5) * .3, life: 1,
          decay: .008 + Math.random() * .014, c: Math.random() < .25 ? shade(pn.color, .25) : golds[k % golds.length] });
      }
    }

    function frame(time) {
      const n = panels.length, gap = spacing();
      cam = p * ((n - 1) * gap);
      const dCam = cam - lastCam; lastCam = cam;
      $('#depth').textContent = String(Math.round(cam / 10)).padStart(3, '0');

      for (const pn of panels) {
        const z = -pn.i * gap + cam;
        const xs = pn.x * (W < 860 ? W * .1 : Math.min(W * .31, 500)), ys = pn.y * H + Math.sin(time / 1400 + pn.i) * 6;
        const ry = -pn.x * 16;
        if (z > 120 && !pn.gone) { pn.gone = true; shatter(pn); }
        if (z <= 120 && pn.gone) pn.gone = false;
        const op = pn.gone ? 0 : clamp((z + 2600) / 1800) * (z > 40 ? clamp(1 - (z - 40) / 80) : 1);
        pn.el.style.opacity = op.toFixed(3);
        pn.el.style.visibility = op < .01 ? 'hidden' : 'visible';
        if (op >= .01) pn.el.style.transform = `translate(-50%,-50%) translate3d(${xs}px,${ys}px,${z}px) rotateY(${ry}deg)`;
      }

      // csillagpor: a görgetés sebességével „warp” csíkok
      ctx.clearRect(0, 0, W, H);
      const speed = .0012 + Math.min(.05, Math.abs(dCam) * .00004);
      const dir = dCam < 0 ? -1 : 1;
      for (const s of stars) {
        const pz = s.z;
        s.z -= speed * dir;
        if (s.z <= .02) { s.z = 1; s.x = Math.random() * 2 - 1; s.y = Math.random() * 2 - 1; }
        if (s.z > 1) { s.z = .02; }
        const k = .5 * Math.min(W, H) * 1.2;
        const x = W / 2 + s.x / s.z * k * .5, y = H / 2 + s.y / s.z * k * .5;
        const px = W / 2 + s.x / pz * k * .5, py = H / 2 + s.y / pz * k * .5;
        const a = clamp((1 - s.z) * 1.1);
        ctx.strokeStyle = `rgba(236,217,168,${a * .75})`; ctx.lineWidth = Math.max(.6, (1 - s.z) * 2.2);
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
      }
      // szilánkok
      for (let k = shards.length - 1; k >= 0; k--) {
        const s = shards[k];
        s.x += s.vx; s.y += s.vy; s.vx *= 1.015; s.vy *= 1.015; s.rot += s.vr; s.life -= s.decay; s.s *= 1.012;
        if (s.life <= 0) { shards.splice(k, 1); continue; }
        ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot);
        ctx.globalAlpha = s.life; ctx.fillStyle = s.c; ctx.fillRect(-s.s / 2, -s.s / 4, s.s, s.s / 2);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      raf = visible ? requestAnimationFrame(frame) : 0;
    }

    resize();
    addEventListener('resize', resize);
    corridor.addEventListener('scene:frame', e => { p = e.detail.p; });
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); }).observe(pin);
    // első rajz, hogy a panelek ne a sarokban várjanak
    requestAnimationFrame(frame);
  }

  /* ---------- RÉSZLETEK: óralap-osztások ---------- */
  $('#dialTicks').innerHTML = Array.from({ length: 60 }, (_, i) => {
    const a = i / 60 * Math.PI * 2, r1 = i % 5 ? 136 : 132, r2 = 142;
    return `<line x1="${150 + Math.cos(a) * r1}" y1="${150 + Math.sin(a) * r1}" x2="${150 + Math.cos(a) * r2}" y2="${150 + Math.sin(a) * r2}"/>`;
  }).join('');

  /* ---------- KONFIGURÁTOR + FINANSZÍROZÁS ---------- */
  const paints = { obsidian: ['#121214', 'Obszidián', 0], champagne: ['#b89b68', 'Pezsgő', 1200000], bordeaux: ['#5b1720', 'Bordó', 950000], racing: ['#1d3a2c', 'Brit zöld', 950000], pearl: ['#e9e4da', 'Gyöngyház', 1450000] };
  const rims = { silver: ['20″ ezüst', 0], black: ['21″ fekete', 680000], gold: ['22″ bronz', 1150000] };
  const BASE = 68900000;
  const form = $('#cfgForm'), cfgCar = $('#cfgCar'), down = $('#down'), term = $('#term');
  let price = BASE, cfg = {};
  function paintCar() {
    const f = new FormData(form);
    cfg = { paint: f.get('paint'), rim: f.get('rim') };
    cfgCar.innerHTML = carSVG(paints[cfg.paint][0], cfg.rim);
    lightCar(cfgCar, .62, 0);
    if (!reduced) cfgCar.animate([{ opacity: 0, transform: 'translateX(24px)' }, { opacity: 1, transform: 'none' }], { duration: 500, easing: 'cubic-bezier(.2,.8,.2,1)' });
    $('#cfgName').textContent = `GT COUPÉ V8 · ${paints[cfg.paint][1].toUpperCase()}`;
    price = BASE + paints[cfg.paint][2] + rims[cfg.rim][1];
    calc();
  }
  function calc() {
    const d = Number(down.value) / 100, months = Number(term.value), r = .099 / 12;
    const principal = price * (1 - d);
    const monthly = principal * r / (1 - Math.pow(1 + r, -months));
    $('#downOut').textContent = `${down.value}% · ${ft(price * d)}`;
    $('#termOut').textContent = `${months} hónap`;
    $('#priceOut').textContent = ft(price);
    $('#monthly').textContent = ft(monthly);
    for (const el of [down, term]) el.style.setProperty('--fill', ((el.value - el.min) / (el.max - el.min) * 100) + '%');
  }
  form.addEventListener('change', e => { if (e.target.type === 'radio') paintCar(); });
  down.addEventListener('input', calc); term.addEventListener('input', calc);
  form.addEventListener('submit', e => e.preventDefault());
  paintCar();

  const note = $('#cfgNote');
  $('#takeCfg').addEventListener('click', () => {
    note.hidden = false;
    note.textContent = `Csatolt konfiguráció: GT Coupé V8, ${paints[cfg.paint][1].toLowerCase()} fényezés, ${rims[cfg.rim][0]} felni – ${ft(price)}, havi ${$('#monthly').textContent}.`;
  });

  /* ---------- Időpontfoglalás (demó, nem küld adatot) ---------- */
  const daysEl = $('#days'), slotsEl = $('#slots'), msg = $('#formMsg'), bookForm = $('#bookForm');
  const dayNames = ['V', 'H', 'K', 'SZE', 'CS', 'P', 'SZO'];
  const days = [];
  for (let d = new Date(), guard = 0; days.length < 5 && guard < 14; guard++) {
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    if (d.getDay() !== 0) days.push(d);
  }
  daysEl.innerHTML = days.map((d, i) => `<label><input type="radio" name="day" value="${i}" ${i ? '' : 'checked'}><span><small>${dayNames[d.getDay()]}</small><strong>${d.getDate()}</strong></span></label>`).join('');
  function renderSlots() {
    const d = days[Number(new FormData(bookForm).get('day') || 0)];
    const times = d.getDay() === 6 ? ['10:00', '11:00', '12:00', '13:00'] : ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    slotsEl.innerHTML = times.map((t, i) => {
      const taken = (d.getDate() * 5 + i * 3) % 4 === 0;
      return `<label><input type="radio" name="slot" value="${t}" ${taken ? 'disabled' : ''}><span>${t}</span></label>`;
    }).join('');
  }
  daysEl.addEventListener('change', renderSlots);
  renderSlots();

  bookForm.addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(bookForm), name = bookForm.elements.name, contact = bookForm.elements.contact;
    name.setAttribute('aria-invalid', String(!name.value.trim()));
    contact.setAttribute('aria-invalid', String(contact.value.trim().length < 6));
    msg.classList.add('err');
    if (!f.get('slot')) { msg.textContent = 'Kérjük, válasszon egy szabad időpontot.'; return; }
    if (!name.value.trim() || contact.value.trim().length < 6) { msg.textContent = 'Kérjük, adja meg nevét és elérhetőségét.'; return; }
    const d = days[Number(f.get('day'))];
    msg.classList.remove('err');
    msg.textContent = `✓ Demó-foglalás: ${f.get('kind')}, ${d.toLocaleDateString('hu-HU', { month: 'long', day: 'numeric', weekday: 'long' })} ${f.get('slot')}. Éles oldalon itt menne ki a visszaigazolás.`;
  });
})();
