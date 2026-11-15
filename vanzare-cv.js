// ═══ CV ═══
// VIN valid: 17 caractere alfanumerice, fără literele I, O, Q (conform standardului internațional)
function looksLikeVin(v) {
  const clean = (v||'').replace(/\s/g,'').toUpperCase();
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(clean);
}

// Avertisment live sub câmp, dacă ce s-a scris nu arată a VIN
function cvCheckVinWarn(){
  const v = (document.getElementById('cv-in')||{}).value||'';
  const warn = document.getElementById('cv-vin-warn');
  if(!warn) return;
  warn.style.display = (v.trim() && !looksLikeVin(v)) ? 'block' : 'none';
}

// Arată selectorul "Alege din garaj" doar dacă userul chiar are mașini salvate
function cvToggleCarSelect(){
  const wrap = document.getElementById('cv-car-wrap');
  if(!wrap) return;
  wrap.style.display = (typeof cars !== 'undefined' && cars.length > 0) ? 'block' : 'none';
}

// Completează automat VIN-ul mașinii alese din garaj, dacă îl avem salvat (din scanarea talonului)
function cvAutoFillVin(){
  const carId = (document.getElementById('cv-car')||{}).value;
  const input = document.getElementById('cv-in');
  if(!carId || !input) return;
  const car = (typeof cars !== 'undefined' ? cars : []).find(c => c.id == carId);
  if(car && car.vin){
    input.value = car.vin;
  } else if(car){
    input.value = '';
    showNotification('ℹ️ Nu avem VIN salvat', 'Mașina asta nu are VIN completat în Documente Mașină. Adaugă-l acolo, sau scrie-l manual mai jos.');
  }
  cvCheckVinWarn();
}

function deschideCV(){
  const v=(document.getElementById('cv-in')||{}).value||'';
  const esteVin = looksLikeVin(v);
  // Link real de afiliat Everflow (aprobat de carVertical) — cu VIN dacă îl avem, altfel link general
  const base = v
    ? 'https://www.carvertical.deal/2SK31XT/BQK1ZL/?uid=256&source_id=AFF&sub1=autoassist&sub3='+encodeURIComponent(v)
    : 'https://www.carvertical.deal/2SK31XT/BQK1ZL/?source_id=AFF&sub1=autoassist';
  window.open(base,'_blank');
  if(v.trim() && !esteVin) {
    showNotification('⚠️ Ai nevoie de VIN', 'carVertical caută doar după seria de șasiu (VIN), nu după numărul de înmatriculare. Introdu VIN-ul direct pe pagina care s-a deschis.');
  } else {
    showNotification('🔗 carVertical -20%!','Cod AUTOASSIST aplicat automat prin AutoAssist!');
  }
}
// Deschide carVertical cu numărul deja introdus în secțiunea "Verificare Nr. Înmatr." — atenție: carVertical
// caută doar după VIN, deci un număr de înmatriculare nu se va căuta automat, doar trece ca parametru de tracking
function deschideCVdinNr(){
  const plate = (document.getElementById('verif-plate-input')||{}).value||'';
  if(plate.trim()) {
    showNotification('⚠️ Ai nevoie de VIN', 'carVertical caută doar după seria de șasiu (VIN). Pe pagina care se deschide, introdu VIN-ul mașinii, nu numărul de înmatriculare.');
  }
  const url = plate
    ? 'https://www.carvertical.deal/2SK31XT/BQK1ZL/?uid=256&source_id=AFF&sub1=autoassist&sub3='+encodeURIComponent(plate.replace(/\s/g,'').toUpperCase())
    : 'https://www.carvertical.deal/2SK31XT/BQK1ZL/?source_id=AFF&sub1=autoassist';
  window.open(url,'_blank');
}
// cumpRaport() este definit în core.js

// ═══ VANZARE ═══
function vanzFotoPreview(input){
  const file=input.files[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    document.getElementById('vanz-foto-img').src=e.target.result;
    document.getElementById('vanz-foto-preview').style.display='block';
    // Save as data URL temporarily
    window._vanzFotoData=e.target.result;
  };
  reader.readAsDataURL(file);
}

function loadVanzCars(){
  const el = document.getElementById('vanz-c');
  if(!el) return;
  if(!cars || !cars.length){
    el.innerHTML = '<div style="text-align:center;padding:24px;color:var(--t3)">Nu ai mașini în garaj. Adaugă o mașină mai întâi.</div>';
    return;
  }
  el.innerHTML = cars.map(c => `
    <div onclick="selectVanzCar(${c.id})" style="display:flex;align-items:center;gap:12px;padding:14px;border:2px solid ${selCarId===c.id?'var(--accent)':'var(--b2)'};border-radius:12px;margin-bottom:10px;cursor:pointer;transition:all 0.2s;background:${selCarId===c.id?'rgba(79,125,255,0.08)':'var(--s2)'}">
      <div style="font-size:28px">🚗</div>
      <div style="flex:1">
        <div style="font-weight:700;font-size:15px">${c.brand||''} ${c.model||''} ${c.year||''}</div>
        <div style="font-size:12px;color:var(--t3)">${c.plate} · ${c.km?c.km.toLocaleString()+' km':'- km'}</div>
      </div>
      <div style="font-size:20px">${selCarId===c.id?'✅':''}</div>
    </div>`).join('');
}

function selectVanzCar(id){
  selCarId = id; window._vanzEditId=null; window._vanzLoc=null;
  const c = cars.find(x=>x.id===id);
  if(!c) return;
  loadVanzCars();
  document.getElementById('vanz-step1').style.display='none';
  document.getElementById('vanz-step2').style.display='block';
  vanzStep2Init();
  vanzPrefillBrandModel(c);
  const info = document.getElementById('vanz-car-info');
  if(info) info.innerHTML = `<div style="font-weight:700">${c.brand} ${c.model} ${c.year}</div><div style="font-size:12px;color:var(--t3)">${c.plate} · ${c.km?c.km.toLocaleString()+' km':''}${c.fuel?' · '+c.fuel:''}</div>`;
  const titlu = document.getElementById('vanz-titlu');
  if(titlu && !titlu.value) titlu.value = `${c.brand} ${c.model} ${c.year}`;
  // Preia automat pozele din garaj
  if(c.fotos && c.fotos.length > 0) {
    window._vanzFotoData = c.fotos[0];
    const img = document.getElementById('vanz-foto-img');
    const preview = document.getElementById('vanz-foto-preview');
    if(img) { img.src = c.fotos[0]; }
    if(preview) preview.style.display = 'block';
    // Afișez galerie poze din garaj
    const galerieEl = document.getElementById('vanz-galerie-garaj');
    if(galerieEl) {
      galerieEl.innerHTML = c.fotos.map((f,i) => `<img src="${f}" onclick="selectVanzFoto('${f}')" style="width:60px;height:60px;object-fit:cover;border-radius:6px;cursor:pointer;border:2px solid ${i===0?'var(--accent)':'var(--b2)'};">`).join('');
    }
  }
  vanzEstimPret();
}

function selectVanzFoto(src) {
  window._vanzFotoData = src;
  const img = document.getElementById('vanz-foto-img');
  if(img) img.src = src;
  // Update border pe galerie
  document.querySelectorAll('#vanz-galerie-garaj img').forEach(el => {
    el.style.borderColor = el.src === src ? 'var(--accent)' : 'var(--b2)';
  });
}

// Precompletează Marcă/Model/An/Km (și pregătește sugestiile de model) când se alege mașina de vândut
function vanzPrefillBrandModel(c){
  if(typeof populateBrandDatalist==='function') populateBrandDatalist('dl-brands-vanz');
  const brandEl = document.getElementById('vanz-brand');
  const modelEl = document.getElementById('vanz-model');
  const anEl = document.getElementById('vanz-an');
  const kmEl = document.getElementById('vanz-km');
  if(brandEl) brandEl.value = c.brand || '';
  if(modelEl) modelEl.value = c.model || '';
  if(anEl) anEl.value = c.year || '';
  if(kmEl) kmEl.value = c.km || '';
  if(typeof updateModelDatalist==='function') updateModelDatalist(c.brand || '', 'dl-models-vanz');
}

function openVanz(id){
  selCarId=id; window._vanzEditId=null; window._vanzLoc=null;
  const c=cars.find(x=>x.id===id);
  if(!c)return;
  goTo('vanzare');
  setTimeout(function(){
    document.getElementById('vanz-step1').style.display='none';
    document.getElementById('vanz-step2').style.display='block';
    vanzStep2Init();
    document.getElementById('vanz-step3').style.display='none';
    loadVanzCars();
    vanzPrefillBrandModel(c);
  },150);
}

function vanzBack(){
  window._vanzEditId=null;
  document.getElementById('vanz-step1').style.display='block';
  document.getElementById('vanz-step2').style.display='none';
  document.getElementById('vanz-step3').style.display='none';
}

// Apel AI prin functia Edge "asistent" (cheia Anthropic/Gemini ramane pe server)
async function vanzAI(prompt, system, maxTokens){
  const res = await fetch('https://zspcknjuqdjfxtqrqhhm.supabase.co/functions/v1/asistent', {
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':await aaAuthHeader()},
    body: JSON.stringify({ messages:[{role:'user',content:prompt}], system: system, max_tokens: maxTokens||600 })
  });
  const data = await res.json();
  if(data.error) throw new Error(data.error);
  return (data.reply||'').trim();
}

// Cache + debounce: estimarea nu depinde de pretul scris, deci apelam AI-ul o singura data per masina
window._vanzEstCache = window._vanzEstCache || {};
let _vanzEstTimer = null;
function vanzEstimPret(){
  clearTimeout(_vanzEstTimer);
  _vanzEstTimer = setTimeout(_vanzEstimPretRun, 600);
}
async function _vanzEstimPretRun(){
  const c=cars.find(x=>x.id===selCarId);
  if(!c||!c.year)return;
  const hint=document.getElementById('vanz-pret-hint');
  const cacheKey=[c.brand,c.model,c.year,c.km,c.fuel].join('|');
  if(window._vanzEstCache[cacheKey]){ if(hint) hint.textContent=window._vanzEstCache[cacheKey]; return; }
  const age=new Date().getFullYear()-parseInt(c.year);
  const km=c.km||80000;
  // Estimare de rezerva, FARA numere aleatoare (deterministica)
  let base;
  if(age>10)base=5000; else if(age>7)base=7500; else if(age>4)base=11000; else base=17000;
  if(km>150000)base*=0.75; else if(km>100000)base*=0.85;
  base=Math.round(base/100)*100;
  const fallback=()=>{ if(hint) hint.textContent='💡 Estimare orientativă: '+base.toLocaleString()+' - '+Math.round(base*1.2/100)*100+' EUR (calcul simplu după vârstă și km)'; };
  if(hint) hint.textContent='⏳ Se estimează prețul de piață...';
  try{
    const reply = await vanzAI(
      'Estimează prețul de piață actual în România (anunțuri second-hand, EUR) pentru: '+(c.brand||'')+' '+(c.model||'')+', an '+c.year+', '+km+' km, combustibil '+(c.fuel||'necunoscut')+'. Răspunde DOAR cu JSON valid de forma {"min":0,"max":0} cu numere întregi în EUR, fără alt text.',
      'Ești un evaluator auto pentru piața second-hand din România. Răspunzi doar cu JSON valid.',
      120
    );
    const m=reply.match(/\{[\s\S]*?\}/);
    const j=m?JSON.parse(m[0]):null;
    if(j && j.min>500 && j.max>=j.min && j.max<500000){
      const txtAI='💡 Estimare AI: '+Math.round(j.min).toLocaleString()+' - '+Math.round(j.max).toLocaleString()+' EUR (orientativ, verifică și anunțuri similare)';
      window._vanzEstCache[cacheKey]=txtAI;
      if(hint) hint.textContent=txtAI;
    } else fallback();
  }catch(e){ fallback(); }
}

async function vanzGenDesc(){
  const c=cars.find(x=>x.id===selCarId);
  if(!c)return;
  const ta=document.getElementById('vanz-desc');
  const dotari=[...document.querySelectorAll('#vanz-dotari input:checked')].map(x=>x.value).join(', ');
  const pret=document.getElementById('vanz-pret').value;
  ta.value='✨ Se generează descrierea cu AI...';
  ta.disabled=true;
  try{
    const prompt=`Generează un anunț de vânzare profesional și atractiv în română pentru:
Mașină: ${c.brand||'Auto'} ${c.model||''} ${c.year||''}
Kilometraj: ${c.km?c.km.toLocaleString()+' km':'necunoscut'}
Combustibil: ${c.fuel||'Benzină'}
Dotări: ${dotari||'standard'}
Preț: ${pret?pret+' EUR':'negociabil'}
Număr înmatriculare: ${c.plate}

Anunțul să fie de 150-200 cuvinte, să evidențieze punctele forte, să sune natural și să inspire încredere. Nu include date de contact. Nu inventa dotări sau istoric care nu sunt menționate.`;
    const txt=await vanzAI(prompt,'Ești un copywriter pentru anunțuri auto din România. Scrii corect gramatical, natural, fără exagerări.',700);
    if(!txt) throw new Error('empty');
    ta.value=txt;
  }catch(e){
    ta.value=`${c.brand||'Autoturism'} ${c.model||''} ${c.year||''} spre vânzare, ${c.km?c.km.toLocaleString()+' km':''}, stare foarte bună. ${dotari?'Dotări: '+dotari+'.':''} Preț ${pret?pret+' EUR':'negociabil'}. Serios, fără vicii ascunse.`;
  }
  ta.disabled=false;
}

// ═══ PACHETE ANUNȚ: Start / Plus / Pro ═══
const VANZ_PACHETE = {
  start:{nume:'Start', pret:25, premium:15, desc:'Anunț activ 30 de zile'},
  plus:{nume:'Plus', pret:39, premium:25, desc:'30 de zile + reactualizare automată la 3 zile (urcă în listă)'},
  pro:{nume:'Pro', pret:59, premium:39, desc:'⭐ Promovat: badge + loc fix în capul listei + reactualizare zilnică'}
};
let _vanzPachet = 'start';
function vanzEstePrem(){ return (typeof isPremium==='function') && isPremium(); }
function vanzPretPachet(k){
  const p = VANZ_PACHETE[k]||VANZ_PACHETE.start;
  return vanzEstePrem() ? p.premium : p.pret;
}
function vanzPachetCards(sel, fn, gratisStart){
  const prem = vanzEstePrem();
  return Object.keys(VANZ_PACHETE).map(k=>{
    const p=VANZ_PACHETE[k], on=sel===k;
    const gratis = gratisStart && prem && k==='start';
    return `<div onclick="${fn}('${k}')" style="cursor:pointer;border:2px solid ${on?'var(--gold)':'rgba(255,255,255,0.1)'};background:${on?'rgba(255,200,60,0.08)':'rgba(255,255,255,0.03)'};border-radius:12px;padding:11px 13px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;gap:10px">
      <div><div style="font-size:14px;font-weight:800">${k==='pro'?'⭐ ':''}${p.nume}</div><div style="font-size:11px;color:var(--t3);margin-top:2px">${p.desc}</div></div>
      <div style="text-align:right;white-space:nowrap"><div style="font-size:16px;font-weight:800;color:var(--gold)">${prem?p.premium:p.pret} RON</div>
      ${gratis?'<div style="font-size:10px;color:var(--green);font-weight:700">primul din an GRATUIT</div>':(!prem?`<div style="font-size:10px;color:var(--t3)">Premium: ${p.premium} RON</div>`:'')}</div>
    </div>`;
  }).join('');
}
function vanzSetPachet(k){ if(VANZ_PACHETE[k]){ _vanzPachet=k; vanzRenderPachete(); } }
function vanzRenderPachete(){
  const el=document.getElementById('vanz-tarif-block'); if(!el) return;
  el.style.cssText='border-radius:12px;padding:0;margin-top:8px';
  const btn=document.getElementById('vanz-publica-btn');
  if(window._vanzEditId){
    const pk=window._vanzEditPachet||'start';
    el.innerHTML=`<div style="font-size:12px;color:var(--t2);padding:12px;background:rgba(79,125,255,0.08);border:1px solid rgba(79,125,255,0.2);border-radius:12px">✏️ Modifici un anunț existent — pachetul rămâne <strong>${(VANZ_PACHETE[pk]||VANZ_PACHETE.start).nume}</strong>, iar modificările nu costă nimic.</div>`;
    if(btn) btn.textContent='💾 Salvează modificările';
    return;
  }
  if(btn) btn.textContent='🚀 Publică Anunțul Acum';
  el.innerHTML = `<div style="font-size:12px;font-weight:700;color:var(--t2);margin-bottom:8px">📦 Alege pachetul anunțului</div>` + vanzPachetCards(_vanzPachet,'vanzSetPachet',true);
}

// ═══ HARTĂ LOCAȚIE (Leaflet + OpenStreetMap, fără cheie API) ═══
function aaLoadLeaflet(){
  if(window.L && window.L.map) return Promise.resolve(window.L);
  if(window._aaLeafletP) return window._aaLeafletP;
  window._aaLeafletP = new Promise((res,rej)=>{
    const css=document.createElement('link'); css.rel='stylesheet'; css.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    css.integrity='sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='; css.crossOrigin=''; document.head.appendChild(css);
    const sc=document.createElement('script'); sc.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    sc.integrity='sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='; sc.crossOrigin='';
    sc.onload=()=>res(window.L); sc.onerror=()=>{ window._aaLeafletP=null; rej(new Error('leaflet')); };
    document.head.appendChild(sc);
  });
  return window._aaLeafletP;
}
async function vanzGeocode(q){
  try{
    const r=await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ro&q='+encodeURIComponent(q));
    const j=await r.json();
    return j&&j[0] ? {lat:parseFloat(j[0].lat), lng:parseFloat(j[0].lon)} : null;
  }catch(e){ return null; }
}
let _vanzMap=null, _vanzMarker=null;
function vanzPunePin(lat,lng,zoom){
  window._vanzLoc={lat,lng};
  if(!_vanzMap||!window.L) return;
  if(!_vanzMarker){
    _vanzMarker=L.marker([lat,lng],{draggable:true}).addTo(_vanzMap);
    _vanzMarker.on('dragend',()=>{ const p=_vanzMarker.getLatLng(); window._vanzLoc={lat:p.lat,lng:p.lng}; });
  } else _vanzMarker.setLatLng([lat,lng]);
  if(zoom) _vanzMap.setView([lat,lng],zoom);
}
async function vanzInitMap(){
  const el=document.getElementById('vanz-map'); if(!el) return;
  try{
    const L=await aaLoadLeaflet();
    if(_vanzMap){ _vanzMap.remove(); _vanzMap=null; _vanzMarker=null; }
    const loc=window._vanzLoc;
    _vanzMap=L.map(el).setView(loc?[loc.lat,loc.lng]:[45.9432,24.9668], loc?14:6);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap'}).addTo(_vanzMap);
    _vanzMap.on('click',e=>vanzPunePin(e.latlng.lat,e.latlng.lng));
    if(loc) vanzPunePin(loc.lat,loc.lng);
    setTimeout(()=>_vanzMap&&_vanzMap.invalidateSize(),200);
  }catch(e){
    el.innerHTML='<div style="padding:16px;font-size:12px;color:var(--t3)">Harta nu s-a putut încărca. Completează județul și localitatea — anunțul se publică și fără hartă.</div>';
  }
}
async function vanzGeocodeLoc(){
  const loc=(document.getElementById('vanz-localitate')?.value||'').trim();
  const j=document.getElementById('vanz-judet')?.value||'';
  if(!loc) return;
  const g=await vanzGeocode(`${loc}, ${j?j+', ':''}România`);
  if(g) vanzPunePin(g.lat,g.lng,14);
}
async function vanzUpdateLocalitati(){
  const j=document.getElementById('vanz-judet')?.value||'';
  if(!j||!_vanzMap) return;
  const g=await vanzGeocode(`județul ${j}, România`);
  if(g && !window._vanzLoc) _vanzMap.setView([g.lat,g.lng],9);
}
function vanzStep2Init(){ vanzRenderPachete(); vanzInitMap(); }

// ═══ MODIFICĂ ANUNȚ ═══
function vanzEditeaza(id){
  const a=(window._vanzLista||[]).find(x=>String(x.id)===String(id)); if(!a) return;
  const c=cars.find(x=>x.plate===a.plate) || cars.find(x=>x.id===selCarId) || cars[0];
  if(c) selCarId=c.id;
  window._vanzEditId=a.id; window._vanzEditPachet=a.pachet||'start';
  document.getElementById('vanz-step1').style.display='none';
  document.getElementById('vanz-step3').style.display='none';
  document.getElementById('vanz-step2').style.display='block';
  const setv=(i,v)=>{const e=document.getElementById(i); if(e) e.value=(v==null?'':v);};
  if(c){ vanzPrefillBrandModel(c); const info=document.getElementById('vanz-car-info'); if(info) info.innerHTML=`<div style="font-weight:700">${a.brand||''} ${a.model||''} ${a.year||''}</div><div style="font-size:12px;color:var(--t3)">${a.plate||''}</div>`; }
  setv('vanz-brand',a.brand); setv('vanz-model',a.model); setv('vanz-an',a.year); setv('vanz-km',a.km);
  setv('vanz-culoare',a.culoare); setv('vanz-combustibil',a.combustibil); setv('vanz-cutie',a.cutie_viteze); setv('vanz-caroserie',a.caroserie);
  setv('vanz-motor',a.motor_cm3); setv('vanz-putere',a.putere_cp); setv('vanz-locuri',a.locuri); setv('vanz-vin',a.vin);
  setv('vanz-pret',a.pret); setv('vanz-desc',a.descriere); setv('vanz-tel',a.tel); setv('vanz-judet',a.judet);
  setv('vanz-localitate',a.localitate); setv('vanz-indicatii',a.indicatii);
  const dot=String(a.dotari||'').split(',').map(x=>x.trim());
  document.querySelectorAll('#vanz-dotari input').forEach(i=>{ i.checked=dot.includes(i.value); });
  const foto=a.foto||(a.fotos&&a.fotos[0])||null;
  window._vanzFotoData=foto;
  const img=document.getElementById('vanz-foto-img'), pv=document.getElementById('vanz-foto-preview');
  if(img&&foto) img.src=foto; if(pv) pv.style.display=foto?'block':'none';
  window._vanzLoc=(a.lat&&a.lng)?{lat:a.lat,lng:a.lng}:null;
  vanzStep2Init();
  window.scrollTo({top:0,behavior:'smooth'});
}

// ═══ REÎNNOIRE (fereastră) ═══
let _renewId=null, _renewPk='start';
function vanzReinnoieste(id){
  const a=(window._vanzLista||[]).find(x=>String(x.id)===String(id));
  _renewId=id; _renewPk=(a&&a.pachet)||'start';
  vanzRenewRender(a);
}
function vanzRenewPick(k){ _renewPk=k; vanzRenewRender((window._vanzLista||[]).find(x=>String(x.id)===String(_renewId))); }
function vanzRenewRender(a){
  document.getElementById('mo-renew')?.remove();
  const titlu=a?`${a.brand||''} ${a.model||''} ${a.year||''}`:'anunțul tău';
  document.body.insertAdjacentHTML('beforeend',`
  <div id="mo-renew" style="position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px" onclick="if(event.target===this)vanzRenewClose()">
    <div style="background:var(--s1);border:1px solid var(--b2);border-radius:18px;max-width:440px;width:100%;padding:20px;max-height:92vh;overflow-y:auto">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <div style="font-size:17px;font-weight:800">🔄 Reînnoiește anunțul</div>
        <button onclick="vanzRenewClose()" style="background:none;border:none;color:var(--t3);font-size:22px;cursor:pointer">×</button>
      </div>
      <div style="font-size:12px;color:var(--t3);margin-bottom:14px">${titlu} — alege pachetul pentru încă 30 de zile.</div>
      ${vanzPachetCards(_renewPk,'vanzRenewPick',false)}
      <button class="btn btn-primary btn-full" onclick="vanzRenewGo()" style="margin-top:6px;padding:13px;font-size:14px">💳 Plătește ${vanzPretPachet(_renewPk)} RON și reactivează</button>
      <button class="btn btn-ghost btn-full" onclick="vanzRenewClose()" style="margin-top:8px">Renunț</button>
    </div>
  </div>`);
}
function vanzRenewClose(){ document.getElementById('mo-renew')?.remove(); }
async function vanzRenewGo(){
  const id=_renewId, pachet=_renewPk;
  if(!(supabaseClient && currentUser)) return;
  const {error} = await supabaseClient.from('listings').update({status:'in_asteptare', pachet}).eq('id',id).eq('user_id',currentUser.id);
  if(error){ showNotification('⚠️ Eroare', 'Nu am putut reînnoi anunțul: '+error.message); return; }
  vanzRenewClose();
  await vanzLoadLista();
  vanzPlateste(id);
}

async function vanzPublica(){
  const c=cars.find(x=>x.id===selCarId);
  if(!c)return;
  const pret=document.getElementById('vanz-pret').value;
  const desc=document.getElementById('vanz-desc').value;
  const tel=document.getElementById('vanz-tel').value;
  const judet=document.getElementById('vanz-judet').value;
  if(!pret){alert('Te rugăm să introduci prețul!');return;}
  if(!desc||desc.length<20){alert('Te rugăm să generezi sau să scrii o descriere!');return;}
  if(!tel){alert('Te rugăm să introduci numărul de telefon!');return;}

  const dotari=[...document.querySelectorAll('#vanz-dotari input:checked')].map(x=>x.value).join(', ');
  const brand = document.getElementById('vanz-brand')?.value || c.brand;
  const model = document.getElementById('vanz-model')?.value || c.model;
  const an = document.getElementById('vanz-an')?.value ? Number(document.getElementById('vanz-an').value) : c.year;
  const km = document.getElementById('vanz-km')?.value ? Number(document.getElementById('vanz-km').value) : c.km;
  const titlu=`${brand||'Auto'} ${model||''} ${an||''} - ${km?km.toLocaleString()+' km':''} - ${pret} EUR`;

  // Detalii mașină — culese din formular, ca să funcționeze filtrele din Piața Auto
  const culoare = document.getElementById('vanz-culoare')?.value || null;
  const combustibil = document.getElementById('vanz-combustibil')?.value || null;
  const cutie_viteze = document.getElementById('vanz-cutie')?.value || null;
  const caroserie = document.getElementById('vanz-caroserie')?.value || null;
  const motor_cm3 = document.getElementById('vanz-motor')?.value ? Number(document.getElementById('vanz-motor').value) : null;
  const putere_cp = document.getElementById('vanz-putere')?.value ? Number(document.getElementById('vanz-putere').value) : null;
  const locuri = document.getElementById('vanz-locuri')?.value ? Number(document.getElementById('vanz-locuri').value) : null;
  const vin = document.getElementById('vanz-vin')?.value || null;
  const fotos = window._vanzFotoData ? [window._vanzFotoData] : null;
  const localitate = (document.getElementById('vanz-localitate')?.value||'').trim() || null;
  const indicatii = (document.getElementById('vanz-indicatii')?.value||'').trim() || null;
  if(!window._vanzLoc && (localitate||judet)){
    const g = await vanzGeocode(`${localitate?localitate+', ':''}${judet}, România`);
    if(g) window._vanzLoc = g;
  }
  // coordonate rotunjite (~100 m): se afișează doar o zonă aproximativă, nu adresa exactă
  const lat = window._vanzLoc ? Math.round(window._vanzLoc.lat*1000)/1000 : null;
  const lng = window._vanzLoc ? Math.round(window._vanzLoc.lng*1000)/1000 : null;

  const anunt={
    user_id: currentUser?.id || 'anonim',
    plate:c.plate, brand, model, year:an, km,
    pret: Number(pret), descriere:desc, tel, judet, localitate, indicatii, lat, lng, dotari,
    culoare, combustibil, cutie_viteze, caroserie, motor_cm3, putere_cp, locuri, vin,
    data:new Date().toLocaleDateString('ro-RO'),
    status:'activ',
    pachet:_vanzPachet,
    foto:window._vanzFotoData||null,
    fotos,
    created_at: new Date().toISOString()
  };

  // Modificare anunț existent: se actualizează, fără plată nouă și fără a atinge pachetul/starea
  if(window._vanzEditId){
    const upd={...anunt}; ['user_id','status','pachet','created_at','data'].forEach(k=>delete upd[k]);
    let err=null;
    if(supabaseClient && currentUser){
      const r=await supabaseClient.from('listings').update(upd).eq('id',window._vanzEditId).eq('user_id',currentUser.id);
      err=r.error;
    }
    if(err){ showNotification('⚠️ Eroare','Nu am putut salva modificările: '+err.message); return; }
    window._vanzEditId=null;
    document.getElementById('vanz-step2').style.display='none';
    document.getElementById('vanz-step3').style.display='block';
    document.getElementById('vanz-confirm-info').innerHTML=`<strong>${titlu}</strong><br><span style="color:var(--green)">✅ Modificările au fost salvate</span>`;
    document.getElementById('vanz-links').innerHTML=`<button class="btn btn-primary btn-sm btn-full" onclick="vanzBack();vanzLoadLista()">📋 Înapoi la anunțurile mele</button>`;
    vanzLoadLista();
    return;
  }
  // Salveaza in Supabase (serverul decide: gratuit pentru Premium / in_asteptare pana la plata)
  let saved = null;
  if(supabaseClient && currentUser){
    try {
      const {data, error} = await supabaseClient.from('listings').insert([anunt]).select().single();
      if(error) {
        console.error('Supabase listings error:', error);
        showNotification('⚠️ Avertisment', 'Anunțul a fost salvat local dar nu în cloud: ' + error.message);
      } else { saved = data; }
    } catch(e){ console.error('Supabase save error:', e); }
  } else if(!currentUser) {
    showNotification('⚠️ Neautentificat', 'Anunțul e salvat local. Loghează-te pentru a-l publica în cloud.');
  }
  // Salveaza si local ca backup
  const anunturi=JSON.parse(localStorage.getItem('vanz_anunturi')||'[]');
  anunturi.push({...anunt, id: saved ? saved.id : Date.now(), status: saved ? saved.status : anunt.status});
  localStorage.setItem('vanz_anunturi',JSON.stringify(anunturi));

  document.getElementById('vanz-step2').style.display='none';
  document.getElementById('vanz-step3').style.display='block';

  // Anunț care cere plată: se publică automat după confirmarea plății
  if(saved && saved.status==='in_asteptare'){
    const prem = (typeof isPremium==='function') && isPremium();
    document.getElementById('vanz-confirm-info').innerHTML=`
      <strong>${titlu}</strong><br>
      📍 ${judet} · 📞 ${tel}<br>
      <span style="color:var(--gold)">Salvat — se publică după plată</span>`;
    document.getElementById('vanz-links').innerHTML=`
      <div style="background:linear-gradient(135deg,rgba(255,200,60,0.12),rgba(255,200,60,0.04));border:1px solid rgba(255,200,60,0.35);border-radius:14px;padding:18px">
        <div style="font-size:15px;font-weight:800;color:var(--gold);margin-bottom:6px">💳 Ultimul pas: plata anunțului</div>
        <div style="font-size:12px;color:var(--t2);margin-bottom:12px">Pachet <strong>${(VANZ_PACHETE[saved.pachet]||VANZ_PACHETE.start).nume}</strong>${saved.pachet==='start'&&prem?' — ai folosit anunțul gratuit din acest an':''}.
          Anunțul tău devine vizibil imediat după plată și rămâne activ 30 de zile.</div>
        <button class="btn btn-primary btn-sm btn-full" onclick="vanzPlateste('${saved.id}')">💳 Plătește ${vanzPretPachet(saved.pachet)} RON și publică</button>
      </div>`;
    vanzLoadLista();
    loadDashVanzari();
    return;
  }
  document.getElementById('vanz-confirm-info').innerHTML=`
    <strong>${titlu}</strong><br>
    📍 ${judet} · 📞 ${tel}<br>
    <span style="color:var(--gold)">${saved && saved.pay_kind==='gratis_premium' ? 'Anunț gratuit — beneficiu Premium (30 de zile)' : 'Anunț activ'}</span>`;

  // Badge documente verificate
  const hasRCA = c.docs?.rca && new Date(c.docs.rca) > new Date();
  const hasITP = c.docs?.itp && new Date(c.docs.itp) > new Date();
  const hasVIN = c.vin;
  const badges = [
    hasRCA ? '🛡️ RCA Valid' : null,
    hasITP ? '🔬 ITP Valid' : null,
    hasVIN ? '🔍 VIN Verificabil' : null,
  ].filter(Boolean);

  document.getElementById('vanz-links').innerHTML=`
    <div style="display:flex;flex-direction:column;gap:12px">
      <div style="background:linear-gradient(135deg,rgba(0,232,154,0.12),rgba(0,232,154,0.04));border:1px solid rgba(0,232,154,0.3);border-radius:14px;padding:18px">
        <div style="font-size:15px;font-weight:800;color:var(--green);margin-bottom:6px">✅ Anunț publicat pe AutoAssist!</div>
        <div style="font-size:12px;color:var(--t2);margin-bottom:12px">Anunțul tău este activ și vizibil pentru toți utilizatorii AutoAssist România.</div>
        ${badges.length ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">${badges.map(b=>`<span style="background:rgba(0,232,154,0.15);color:var(--green);font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;border:1px solid rgba(0,232,154,0.3)">${b}</span>`).join('')}</div>` : ''}
        <div style="font-size:11px;color:var(--t3)">💡 Anunțurile cu documente verificate primesc de 3x mai multe contacte</div>
      </div>

      <div style="background:var(--s2);border:1px solid var(--b2);border-radius:14px;padding:16px">
        <div style="font-size:13px;font-weight:700;margin-bottom:8px">📋 Copiază anunțul</div>
        <div style="font-size:12px;color:var(--t2);margin-bottom:10px">Poți distribui anunțul oriunde vrei — WhatsApp, Facebook, prieteni.</div>
        <button class="btn btn-ghost btn-sm btn-full" onclick="copyVanzText()">📋 Copiază textul anunțului</button>
      </div>

      <div style="background:var(--s2);border:1px solid var(--b2);border-radius:14px;padding:16px">
        <div style="font-size:13px;font-weight:700;margin-bottom:4px">👁️ Vizualizează anunțul</div>
        <div style="font-size:12px;color:var(--t2);margin-bottom:10px">Vezi cum arată anunțul tău în marketplace-ul AutoAssist.</div>
        <button class="btn btn-primary btn-sm btn-full" onclick="goTo('vanzare');setTimeout(()=>{document.getElementById('vanz-step1').style.display='block';document.getElementById('vanz-step2').style.display='none';document.getElementById('vanz-step3').style.display='none';vanzLoadLista();},100)">🚗 Vezi marketplace AutoAssist</button>
      </div>
    </div>`;

  window._vanzTextAnunt = titlu+'\n\n'+desc+'\n\nDotări: '+dotari+'\nPreț: '+pret+' EUR\nTelefon: '+tel+'\nJudețul: '+judet+'\n\nVăzut pe AutoAssist.ro — platforma de management auto';
  if(navigator.clipboard) navigator.clipboard.writeText(window._vanzTextAnunt).catch(()=>{});

  vanzLoadLista();
  loadDashVanzari();
}

function copyVanzText() {
  const text = window._vanzTextAnunt || '';
  if(navigator.clipboard) {
    navigator.clipboard.writeText(text).then(()=>showNotification('✅ Copiat!','Textul anunțului a fost copiat în clipboard.')).catch(()=>{});
  }
}

function vanzNouAnunt(){
  window._vanzFotoData=null;
  document.getElementById('vanz-foto-preview').style.display='none';
  const fi=document.getElementById('vanz-foto-input');if(fi)fi.value='';
  document.getElementById('vanz-step1').style.display='block';
  document.getElementById('vanz-step2').style.display='none';
  document.getElementById('vanz-step3').style.display='none';
  loadVanzCars();
}

async function vanzLoadLista(){
  const el=document.getElementById('vanz-lista');
  const statActiv=document.getElementById('vanz-stat-activ');
  const statTotal=document.getElementById('vanz-stat-total');

  let anunturi=[];
  if(supabaseClient && currentUser){
    try {
      const {data}=await supabaseClient
        .from('listings')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at',{ascending:false});
      if(data) anunturi=data;
    } catch(e){}
  }
  // Fallback localStorage
  if(!anunturi.length){
    anunturi=JSON.parse(localStorage.getItem('vanz_anunturi')||'[]');
  }

  window._vanzLista=anunturi;
  if(statActiv)statActiv.textContent=anunturi.filter(a=>a.status==='activ').length;
  if(statTotal)statTotal.textContent=anunturi.length;

  if(!anunturi.length){el.innerHTML='<div style="text-align:center;padding:24px;color:var(--t3);font-size:13px">Nu ai anunțuri active momentan.</div>';return;}
  el.innerHTML=anunturi.map(a=>`
    <div style="border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:6px">
        <div style="font-size:13px;font-weight:700">${a.brand||''} ${a.model||''} ${a.year||''}</div>
        ${a.status==='in_asteptare'
          ? '<span style="background:rgba(255,200,60,0.15);color:var(--gold);font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px">ÎN AȘTEPTARE PLATĂ</span>'
          : a.status==='expirat'
          ? '<span style="background:rgba(255,59,59,0.12);color:#ff3b3b;font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px">EXPIRAT</span>'
          : `<span style="background:rgba(0,232,154,0.15);color:var(--green);font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px">${a.promo_active?'⭐ PROMOVAT':'ACTIV'}</span>`}
      </div>
      <div style="font-size:12px;color:var(--t2)">${a.plate||''} · ${a.km?Number(a.km).toLocaleString()+' km':''}</div>
      <div style="font-size:13px;font-weight:800;color:var(--gold);margin-top:4px">${a.pret} EUR</div>
      <div style="font-size:11px;color:var(--t3);margin-top:2px">📍 ${a.judet||'România'} · ${a.data||''}${a.status==='activ'&&a.expires_at?` · expiră ${new Date(a.expires_at).toLocaleDateString('ro-RO')}`:''}${a.status==='activ'&&(a.pachet==='plus'||a.pachet==='pro')?` · 🔄 reactualizat de ${a.bump_count||0}×`:''}</div>
      <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
        ${a.status==='expirat' ? `<button onclick="vanzReinnoieste('${a.id}')" style="flex:1 1 100%;font-size:12px;font-weight:800;padding:8px;background:rgba(0,232,154,0.15);color:var(--green);border:none;border-radius:8px;cursor:pointer">🔄 Reînnoiește anunțul</button>` : ''}
        ${a.status==='in_asteptare' ? `<button onclick="vanzPlateste('${a.id}')" style="flex:1 1 100%;font-size:12px;font-weight:800;padding:8px;background:rgba(255,200,60,0.15);color:var(--gold);border:none;border-radius:8px;cursor:pointer">💳 Plătește și publică</button>` : ''}
        <button onclick="showAnuntModal((window._vanzLista||[]).find(x=>String(x.id)==='${a.id}'))" style="flex:1;font-size:11px;font-weight:700;padding:6px;background:rgba(255,255,255,0.06);color:var(--t2);border:none;border-radius:6px;cursor:pointer">👁️ Vezi</button>
        <button onclick="vanzEditeaza('${a.id}')" style="flex:1;font-size:11px;font-weight:700;padding:6px;background:rgba(79,125,255,0.12);color:var(--accent);border:none;border-radius:6px;cursor:pointer">✏️ Modifică</button>
        <button onclick="vanzSterge('${a.id}')" style="flex:1;font-size:11px;font-weight:700;padding:6px;background:rgba(255,59,59,0.1);color:#ff3b3b;border:none;border-radius:6px;cursor:pointer">🗑️ Șterge</button>
      </div>
    </div>`).join('');
}

function vanzPlateste(id){
  if(typeof BILLING_LIVE!=='undefined' && !BILLING_LIVE){
    if(typeof showSoon==='function') showSoon('Plata anunțului','Plata online se activează în curând. Anunțul tău e salvat și se publică imediat după plată.');
    return;
  }
  if(typeof billingListingCheckout==='function') billingListingCheckout(id);
}

async function vanzSterge(id){
  if(!confirm('Ștergi anunțul?'))return;
  if(supabaseClient && currentUser){
    try { await supabaseClient.from('listings').delete().eq('id',id).eq('user_id',currentUser.id); } catch(e){}
  }
  let anunturi=JSON.parse(localStorage.getItem('vanz_anunturi')||'[]');
  anunturi=anunturi.filter(a=>String(a.id)!==String(id));
  localStorage.setItem('vanz_anunturi',JSON.stringify(anunturi));
  vanzLoadLista();
  loadDashVanzari();
}

// ═══ PIAȚA AUTO — pagină separată, cu căutare, filtre și toate anunțurile active ═══
let _piataOffset = 0;
let _piataSearchTimer = null;
const PIATA_PAGE_SIZE = 24;

function piataToggleFiltre(){
  const panel = document.getElementById('piata-filtre-panel');
  if(!panel) return;
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function piataResetFiltre(){
  ['piata-f-brand','piata-f-model','piata-f-caroserie','piata-f-combustibil','piata-f-cutie','piata-f-pretmin','piata-f-pretmax','piata-f-anmin','piata-f-anmax','piata-f-kmmin','piata-f-kmmax','piata-f-motormin','piata-f-motormax','piata-f-puteremin','piata-f-puteremax','piata-f-culoare','piata-f-judet'].forEach(id=>{
    const el = document.getElementById(id); if(el) el.value = '';
  });
  const sort = document.getElementById('piata-f-sort'); if(sort) sort.value = 'recent';
  const search = document.getElementById('piata-search'); if(search) search.value = '';
  piataLoad(true);
}

function piataSearchDebounce(){
  clearTimeout(_piataSearchTimer);
  _piataSearchTimer = setTimeout(()=>piataLoad(true), 400);
}

// Marca și modelul din filtre — lista completă (aceeași ca la Garaj/Vânzare), nu doar ce e deja postat
function piataPopulateBrands(){
  const sel = document.getElementById('piata-f-brand');
  if(!sel || sel.options.length > 1) return; // deja populat
  Object.keys(CAR_BRANDS_MODELS).sort().forEach(b => sel.innerHTML += `<option value="${b}">${b}</option>`);
}

// Modelele disponibile depind de marca aleasă (ca la OLX) — se reactualizează la schimbarea mărcii
function piataPopulateModels(){
  const brandSel = document.getElementById('piata-f-brand');
  const modelSel = document.getElementById('piata-f-model');
  if(!modelSel) return;
  modelSel.innerHTML = '<option value="">Toate</option>';
  const brand = brandSel?.value || '';
  const modele = brand ? (CAR_BRANDS_MODELS[brand] || []) : Object.values(CAR_BRANDS_MODELS).flat().sort();
  [...new Set(modele)].forEach(m => modelSel.innerHTML += `<option value="${m}">${m}</option>`);
}

async function piataLoad(reset){
  const grid = document.getElementById('piata-lista');
  const moreBtn = document.getElementById('piata-mai-multe');
  const countEl = document.getElementById('piata-count');
  if(!grid) return;

  if(reset){
    _piataOffset = 0;
    window._piataRezultate = [];
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:30px;color:var(--t3)">Se încarcă...</div>`;
  }

  const q = (document.getElementById('piata-search')?.value||'').trim();
  const brand = document.getElementById('piata-f-brand')?.value||'';
  const model = document.getElementById('piata-f-model')?.value||'';
  const caroserie = document.getElementById('piata-f-caroserie')?.value||'';
  const combustibil = document.getElementById('piata-f-combustibil')?.value||'';
  const cutie = document.getElementById('piata-f-cutie')?.value||'';
  const pretMin = document.getElementById('piata-f-pretmin')?.value;
  const pretMax = document.getElementById('piata-f-pretmax')?.value;
  const anMin = document.getElementById('piata-f-anmin')?.value;
  const anMax = document.getElementById('piata-f-anmax')?.value;
  const kmMin = document.getElementById('piata-f-kmmin')?.value;
  const kmMax = document.getElementById('piata-f-kmmax')?.value;
  const motorMin = document.getElementById('piata-f-motormin')?.value;
  const motorMax = document.getElementById('piata-f-motormax')?.value;
  const putereMin = document.getElementById('piata-f-puteremin')?.value;
  const putereMax = document.getElementById('piata-f-puteremax')?.value;
  const culoare = (document.getElementById('piata-f-culoare')?.value||'').trim();
  const judet = document.getElementById('piata-f-judet')?.value||'';
  const sort = document.getElementById('piata-f-sort')?.value||'recent';

  let rezultate = [];
  let totalCount = null;

  if(typeof supabaseClient !== 'undefined'){
    try {
      let query = supabaseClient.from('listings').select('*', { count: 'exact' }).eq('status','activ');
      if(q) query = query.or(`brand.ilike.%${q}%,model.ilike.%${q}%`);
      if(brand) query = query.eq('brand', brand);
      if(model) query = query.eq('model', model);
      if(caroserie) query = query.eq('caroserie', caroserie);
      if(combustibil) query = query.eq('combustibil', combustibil);
      if(cutie) query = query.eq('cutie_viteze', cutie);
      if(pretMin) query = query.gte('pret', Number(pretMin));
      if(pretMax) query = query.lte('pret', Number(pretMax));
      if(anMin) query = query.gte('year', Number(anMin));
      if(anMax) query = query.lte('year', Number(anMax));
      if(kmMin) query = query.gte('km', Number(kmMin));
      if(kmMax) query = query.lte('km', Number(kmMax));
      if(motorMin) query = query.gte('motor_cm3', Number(motorMin));
      if(motorMax) query = query.lte('motor_cm3', Number(motorMax));
      if(putereMin) query = query.gte('putere_cp', Number(putereMin));
      if(putereMax) query = query.lte('putere_cp', Number(putereMax));
      if(culoare) query = query.ilike('culoare', `%${culoare}%`);
      if(judet) query = query.eq('judet', judet);

      if(sort==='pret_asc') query = query.order('pret', { ascending: true });
      else if(sort==='pret_desc') query = query.order('pret', { ascending: false });
      else if(sort==='km_asc') query = query.order('km', { ascending: true });
      else if(sort==='an_desc') query = query.order('year', { ascending: false });
      else query = query.order('promo_active', { ascending: false }).order('bumped_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });

      query = query.range(_piataOffset, _piataOffset + PIATA_PAGE_SIZE - 1);

      const { data, count, error } = await query;
      if(!error && data) { rezultate = data; totalCount = count; }
    } catch(e) { console.error('Eroare piata:', e); }
  }

  // Fallback local — doar la prima încărcare, dacă Supabase e indisponibil (fără filtrare avansată)
  if(!rezultate.length && _piataOffset === 0 && typeof supabaseClient === 'undefined'){
    rezultate = JSON.parse(localStorage.getItem('vanz_anunturi')||'[]').filter(a=>a.status==='activ');
  }

  if(reset) grid.innerHTML = '';

  if(!rezultate.length && _piataOffset === 0 && !window._piataRezultate.length){
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--t3)">
      <div style="font-size:40px;margin-bottom:10px">🔍</div>
      <div style="font-size:14px;font-weight:600">Niciun anunț găsit</div>
      <div style="font-size:12px;margin-top:4px">Încearcă alte filtre sau caută altceva</div>
    </div>`;
    if(moreBtn) moreBtn.style.display = 'none';
    if(countEl) countEl.textContent = '';
    return;
  }

  const startIdx = window._piataRezultate.length;
  window._piataRezultate = window._piataRezultate.concat(rezultate);

  const carEmojis={'Dacia':'🚗','Renault':'🚙','BMW':'🏎️','Mercedes':'🏎️','Volkswagen':'🚗','Audi':'🏎️','Toyota':'🚙','Ford':'🚗','Opel':'🚗','Peugeot':'🚗','Skoda':'🚗','Hyundai':'🚙','Kia':'🚙','Seat':'🚗','Fiat':'🚗'};

  grid.innerHTML += rezultate.map((a, i) => {
    const idx = startIdx + i;
    const emoji = carEmojis[a.brand] || '🚗';
    const esteAlMeu = a.user_id === currentUser?.id;
    return `<div onclick="showAnuntModal(window._piataRezultate[${idx}])" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;overflow:hidden;cursor:pointer;transition:transform 0.2s" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
      <div style="height:130px;background:linear-gradient(135deg,rgba(79,125,255,0.12),rgba(200,150,12,0.08));display:flex;align-items:center;justify-content:center;position:relative;border-bottom:1px solid rgba(255,255,255,0.06);overflow:hidden">
        ${(a.fotos&&a.fotos[0])||a.foto?`<img src="${(a.fotos&&a.fotos[0])||a.foto}" style="width:100%;height:100%;object-fit:cover">`:`<div style="font-size:56px">${emoji}</div>`}
        ${a.promo_active?`<div style="position:absolute;top:8px;right:8px;background:linear-gradient(135deg,#f5c542,#e0a100);color:#1a1200;font-size:9px;font-weight:800;padding:2px 7px;border-radius:10px">⭐ PROMOVAT</div>`:''}
        ${esteAlMeu?`<div style="position:absolute;top:8px;left:8px;background:rgba(79,125,255,0.9);color:#fff;font-size:9px;font-weight:800;padding:2px 6px;border-radius:10px">AL MEU</div>`:''}
        <div style="position:absolute;bottom:8px;left:8px;background:rgba(0,0,0,0.65);color:var(--gold);font-size:14px;font-weight:800;padding:3px 10px;border-radius:8px">${a.pret} EUR</div>
      </div>
      <div style="padding:11px 13px">
        <div style="font-size:14px;font-weight:800;margin-bottom:2px">${a.brand||''} ${a.model||''}</div>
        <div style="font-size:12px;color:var(--t2)">${a.year||''} · ${a.km?Number(a.km).toLocaleString()+' km':''}</div>
        <div style="font-size:11px;color:var(--t3);margin-top:3px">${[a.combustibil,a.cutie_viteze,a.caroserie].filter(Boolean).join(' · ')}</div>
        <div style="font-size:11px;color:var(--t3);margin-top:4px">📍 ${a.judet||'România'}</div>
      </div>
    </div>`;
  }).join('');

  _piataOffset += rezultate.length;
  if(countEl && totalCount !== null) countEl.textContent = `${window._piataRezultate.length} din ${totalCount} anunțuri`;
  if(moreBtn) moreBtn.style.display = (totalCount !== null && window._piataRezultate.length < totalCount) ? 'inline-block' : 'none';

  piataPopulateBrands();
  if(document.getElementById('piata-f-model')?.options.length <= 1) piataPopulateModels();
}

