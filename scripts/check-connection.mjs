#!/usr/bin/env node
// Verifies the public Laravel API directly and through Angular's dev-server proxy.
// Does not change data or require login. Node 20+ recommended.
const backend = process.env.BACKEND_URL || 'http://localhost:8000';
const frontend = process.env.FRONTEND_URL || 'http://localhost:4200';
let failed = false;
async function probe(label, url, validate) {
  try {
    const res = await fetch(url, {headers: {Accept: 'application/json'}, signal: AbortSignal.timeout(6000)});
    const ct = res.headers.get('content-type') || '';
    const raw = await res.text();
    let data;
    try {data = JSON.parse(raw);} catch {}
    const valid = res.ok && ct.includes('json') && validate(data);
    console.log(`${valid?'OK':'HIBA'} ${label} – HTTP ${res.status}, ${ct || 'ismeretlen tartalomtípus'}`);
    if(!valid) {failed=true; console.log('  Várt Laravel JSON nem érkezett. Részlet:',raw.slice(0,160).replace(/\s+/g,' '));}
    return valid && data;
  } catch(e) {
    failed = true;
    console.log(`HIBA ${label} – ${e.message}`);
    return false;
  }
}
const isSettings = d => !!d && !!d.data && typeof d.data.site_title === 'string';
const direct = await probe('Laravel közvetlen',`${backend}/api/site-settings`,isSettings);
const proxied = await probe('Angular proxy',`${frontend}/api/site-settings`,isSettings);
if(direct && proxied && JSON.stringify(direct)!==JSON.stringify(proxied)) {
  console.log('FIGYELEM: Az Angular proxy más tartalmat kap, mint a közvetlen Laravel API.');
  failed = true;
}
if(!failed) console.log('\nA nyilvános Angular → Laravel kapcsolat ellenőrzése sikeres. Az adminbejelentkezést és ajánlatbeküldést külön teszteld.');
else console.log('\nEllenőrizd: php artisan serve --host=localhost --port=8000; npm start; ugyanaz a localhost host; proxy.conf.json; Laravel .env.');
process.exitCode = failed ? 1 : 0;
