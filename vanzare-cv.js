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
function cumpRaport(){alert('✅ Raport Verificare SH — 10 RON\n\nRedirecționare spre plată securizată...\nRaportul PDF complet este trimis instant pe email!\n\n🔧 AutoAssist — Mecanicul tău din buzunar!');}

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
  selCarId = id;
  const c = cars.find(x=>x.id===id);
  if(!c) return;
  loadVanzCars();
  document.getElementById('vanz-step1').style.display='none';
  document.getElementById('vanz-step2').style.display='block';
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
  selCarId=id;
  const c=cars.find(x=>x.id===id);
  if(!c)return;
  goTo('vanzare');
  setTimeout(function(){
    document.getElementById('vanz-step1').style.display='none';
    document.getElementById('vanz-step2').style.display='block';
    document.getElementById('vanz-step3').style.display='none';
    loadVanzCars();
    vanzPrefillBrandModel(c);
  },150);
}

function vanzBack(){
  document.getElementById('vanz-step1').style.display='block';
  document.getElementById('vanz-step2').style.display='none';
  document.getElementById('vanz-step3').style.display='none';
}

function vanzEstimPret(){
  const c=cars.find(x=>x.id===selCarId);
  if(!c||!c.year)return;
  const age=new Date().getFullYear()-c.year;
  const km=c.km||80000;
  let base=12000;
  if(age>10)base=4000+Math.random()*2000;
  else if(age>7)base=6000+Math.random()*3000;
  else if(age>4)base=9000+Math.random()*4000;
  else base=13000+Math.random()*8000;
  if(km>150000)base*=0.75;
  else if(km>100000)base*=0.85;
  base=Math.round(base/100)*100;
  document.getElementById('vanz-pret-hint').textContent=`💡 Estimare AI: ${base.toLocaleString()} - ${(base*1.2).toLocaleString()} EUR pentru acest model`;
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
    const resp=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        model:'claude-sonnet-4-20250514',
        max_tokens:600,
        messages:[{role:'user',content:`Generează un anunț de vânzare profesional și atractiv în română pentru:
Mașină: ${c.brand||'Auto'} ${c.model||''} ${c.year||''}
Kilometraj: ${c.km?c.km.toLocaleString()+' km':'necunoscut'}
Combustibil: ${c.fuel||'Benzină'}
Dotări: ${dotari||'standard'}
Preț: ${pret?pret+' EUR':'negociabil'}
Număr înmatriculare: ${c.plate}

Anunțul să fie de 150-200 cuvinte, să evidențieze punctele forte, să sune natural și să inspire încredere. Nu include date de contact.`}]
      })
    });
    const data=await resp.json();
    ta.value=data.content?.[0]?.text||'Nu s-a putut genera descrierea. Scrie manual.';
  }catch(e){
    ta.value=`${c.brand||'Autoturism'} ${c.model||''} ${c.year||''} spre vânzare, ${c.km?c.km.toLocaleString()+' km':''}, stare foarte bună. ${dotari?'Dotări: '+dotari+'.':''} Preț ${pret?pret+' EUR':'negociabil'}. Serios, fără vicii ascunse.`;
  }
  ta.disabled=false;
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

  const anunt={
    user_id: currentUser?.id || 'anonim',
    plate:c.plate, brand, model, year:an, km,
    pret: Number(pret), descriere:desc, tel, judet, dotari,
    culoare, combustibil, cutie_viteze, caroserie, motor_cm3, putere_cp, locuri, vin,
    data:new Date().toLocaleDateString('ro-RO'),
    status:'activ',
    foto:window._vanzFotoData||null,
    fotos,
    created_at: new Date().toISOString()
  };

  // Salveaza in Supabase
  if(supabaseClient && currentUser){
    try {
      const {data, error} = await supabaseClient.from('listings').insert([anunt]);
      if(error) {
        console.error('Supabase listings error:', error);
        showNotification('⚠️ Avertisment', 'Anunțul a fost salvat local dar nu în cloud: ' + error.message);
      }
    } catch(e){ console.error('Supabase save error:', e); }
  } else if(!currentUser) {
    showNotification('⚠️ Neautentificat', 'Anunțul e salvat local. Loghează-te pentru a-l publica în cloud.');
  }
  // Salveaza si local ca backup
  const anunturi=JSON.parse(localStorage.getItem('vanz_anunturi')||'[]');
  anunturi.push({...anunt, id:Date.now()});
  localStorage.setItem('vanz_anunturi',JSON.stringify(anunturi));

  document.getElementById('vanz-step2').style.display='none';
  document.getElementById('vanz-step3').style.display='block';
  document.getElementById('vanz-confirm-info').innerHTML=`
    <strong>${titlu}</strong><br>
    📍 ${judet} · 📞 ${tel}<br>
    <span style="color:var(--gold)">Promovare activă 7 zile</span>`;

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

  if(statActiv)statActiv.textContent=anunturi.filter(a=>a.status==='activ').length;
  if(statTotal)statTotal.textContent=anunturi.length;

  if(!anunturi.length){el.innerHTML='<div style="text-align:center;padding:24px;color:var(--t3);font-size:13px">Nu ai anunțuri active momentan.</div>';return;}
  el.innerHTML=anunturi.map(a=>`
    <div style="border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:6px">
        <div style="font-size:13px;font-weight:700">${a.brand||''} ${a.model||''} ${a.year||''}</div>
        <span style="background:rgba(0,232,154,0.15);color:var(--green);font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px">ACTIV</span>
      </div>
      <div style="font-size:12px;color:var(--t2)">${a.plate||''} · ${a.km?Number(a.km).toLocaleString()+' km':''}</div>
      <div style="font-size:13px;font-weight:800;color:var(--gold);margin-top:4px">${a.pret} EUR</div>
      <div style="font-size:11px;color:var(--t3);margin-top:2px">📍 ${a.judet||'România'} · ${a.data||''}</div>
      <div style="display:flex;gap:6px;margin-top:8px">
        <button onclick="vanzSterge('${a.id}')" style="flex:1;font-size:11px;font-weight:700;padding:5px;background:rgba(255,59,59,0.1);color:#ff3b3b;border:none;border-radius:6px;cursor:pointer">🗑️ Șterge</button>
      </div>
    </div>`).join('');
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
      else query = query.order('created_at', { ascending: false });

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

