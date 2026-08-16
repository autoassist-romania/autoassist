// ═══ EMAG.RO (afiliat Profitshare) ═══
// Link static generat din Profitshare — spre deosebire de 2Performant, nu am confirmat un tipar
// de "wrapper" pentru link-uri personalizate pe categorie/căutare, deci folosim link-ul fix peste tot.
const EMAG_LINK = 'https://l.profitshare.ro/l/16322119';

// ═══ PIESE AUTO ═══
const AUTODOC_AFILIAT = 'AFILIAT_ID';
const AUTODOC_BASE = 'https://www.autodoc24.ro';

// ═══ AUTOMOBILUS.RO (afiliat 2Performant) ═══
const AUTOMOBILUS_AFF_CODE = 'da6b1b8eb';
const AUTOMOBILUS_UNIQUE   = 'ef2621c0a';
function buildAutomobilusLink(path) {
  // path trebuie să înceapă cu '/' (ex: '/piese-auto/bmw'). Fără path = homepage.
  return `https://event.2performant.com/events/click?ad_type=quicklink&aff_code=${AUTOMOBILUS_AFF_CODE}&unique=${AUTOMOBILUS_UNIQUE}&redirect_to=https%253A//automobilus.ro${path||''}`;
}

const AUTOMOBILUS_BRAND_SLUG = {
  'Audi':'audi','BMW':'bmw','Mercedes':'mercedes-benz','Mercedes-Benz':'mercedes-benz',
  'Volkswagen':'vw','VW':'vw','Dacia':'dacia','Renault':'renault',
  'Ford':'ford','Opel':'opel','Peugeot':'peugeot','Citroën':'citroen','Citroen':'citroen',
  'Toyota':'toyota','Honda':'honda','Hyundai':'hyundai','Kia':'kia','KIA':'kia',
  'Skoda':'skoda','Škoda':'skoda','Seat':'seat','SEAT':'seat','Fiat':'fiat',
  'Volvo':'volvo','Mazda':'mazda','Nissan':'nissan','Mitsubishi':'mitsubishi',
  'Suzuki':'suzuki','Subaru':'subaru','Jeep':'jeep','Alfa Romeo':'alfa-romeo',
  'Lancia':'lancia','Chrysler':'chrysler','Dodge':'dodge','Lexus':'lexus',
  'Infiniti':'infiniti','Jaguar':'jaguar','Land Rover':'land-rover','Mini':'mini',
  'Porsche':'porsche','Chevrolet':'chevrolet','Saab':'saab','Lada':'lada',
};
function getAutomobilusBrandSlug(brand) {
  if(!brand) return '';
  if(AUTOMOBILUS_BRAND_SLUG[brand]) return AUTOMOBILUS_BRAND_SLUG[brand];
  return brand.toLowerCase()
    .replace(/ă/g,'a').replace(/â/g,'a').replace(/î/g,'i').replace(/ș/g,'s').replace(/ț/g,'t')
    .replace(/ë|é|è|ê/g,'e').replace(/ö/g,'o').replace(/ü/g,'u')
    .replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
}
// Categorii cu pagină generală dedicată pe automobilus.ro (nu necesită brand/model)
const AUTOMOBILUS_CAT_MAP = {
  'ulei-motor': 'uleiuri-si-lichide-auto',
  'baterie': 'acumulatori-si-baterii',
  'accesorii': 'produse-universale',
};
function buildAutomobilusUrl(brand, catId) {
  const catPath = catId ? AUTOMOBILUS_CAT_MAP[catId] : null;
  if(catPath) return buildAutomobilusLink('/'+catPath);
  const slug = getAutomobilusBrandSlug(brand);
  return buildAutomobilusLink(slug ? '/piese-auto/'+slug : '/piese-auto');
}

// ═══ AUTOECO.RO (afiliat 2Performant) ═══
const AUTOECO_AFF_CODE = 'da6b1b8eb';
const AUTOECO_UNIQUE   = '7cf7c22ce';
function buildAutoEcoLink(path) {
  return `https://event.2performant.com/events/click?ad_type=quicklink&aff_code=${AUTOECO_AFF_CODE}&unique=${AUTOECO_UNIQUE}&redirect_to=https%253A//www.autoeco.ro${path||''}`;
}
const AUTOECO_BRAND_SLUG = {
  'Audi':'audi','BMW':'bmw','Volkswagen':'vw','VW':'vw','Dacia':'dacia','Renault':'renault',
  'Ford':'ford','Opel':'opel','Skoda':'skoda','Škoda':'skoda','Fiat':'fiat',
  'Mercedes-Benz':'mercedes_benz','Mercedes':'mercedes_benz','Toyota':'toyota','Hyundai':'hyundai',
  'Kia':'kia','KIA':'kia','Peugeot':'peugeot','Citroen':'citroen','Citroën':'citroen',
  'Mazda':'mazda','Nissan':'nissan','Suzuki':'suzuki','Honda':'honda','Mitsubishi':'mitsubishi',
  'Alfa Romeo':'alfa+romeo','Volvo':'volvo','Chevrolet':'chevrolet','Seat':'seat','SEAT':'seat',
};
function getAutoEcoBrandSlug(brand) {
  if(!brand) return '';
  if(AUTOECO_BRAND_SLUG[brand]) return AUTOECO_BRAND_SLUG[brand];
  return brand.toLowerCase()
    .replace(/ă/g,'a').replace(/â/g,'a').replace(/î/g,'i').replace(/ș/g,'s').replace(/ț/g,'t')
    .replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'');
}
// AutoEco are pagini generale reale pe categorie (spre deosebire de Automobilus) — folosim direct.
const AUTOECO_CAT_MAP = {
  'ulei-motor':'ulei-de-motor','filtre-ulei':'filtru-ulei','filtru-habitaclu':'filtru-aer-habitaclu',
  'filtre-aer':'filtru-aer','filtru-combustibil':'filtru-combustibil','placute-frana':'placute-frana',
  'bujii':'bujii','baterie':'baterii-auto','discuri-frana':'discuri-frana',
  'curea-distributie':'kit-distributie','amortizoare':'amortizoare','accesorii':'universale/accesorii-auto',
  'pompa-apa':'pompa-apa','termostat':'termostat','radiator-apa':'radiator-apa-piese',
  'alternator':'alternator','electromotor':'electromotor','bobina-inductie':'bobina-inductie',
  'injector':'injector','rulment-roata':'rulment-roata','etrier-frana':'etrier-frana',
  'sonda-lambda':'sonda-lambda','catalizator':'catalizator','compresor-ac':'compresor-aer-conditionat',
  'pompa-servodirectie':'pompa-servodirectie','cap-bara':'cap-bara','bieleta-directie':'bielete-directie',
  'brat-suspensie':'brat-suspensie','kit-ambreiaj':'kit-ambreiaj','burduf-planetara':'burduf-planetara',
  'toba-esapament':'toba-finala','far-auto':'far','stergatoare':'stergatoare',
  'senzori-parcare':'senzori-parcare',
};
function buildAutoEcoUrl(brand, catId) {
  const catSlug = catId ? AUTOECO_CAT_MAP[catId] : null;
  if(catSlug) return buildAutoEcoLink('/'+catSlug+'/');
  const slug = getAutoEcoBrandSlug(brand);
  return buildAutoEcoLink(slug ? '/piese-auto-'+slug+'/' : '/piese-auto-marci/');
}
// AutoEco are anvelope pe dimensiune exactă — un singur URL, fără sezon separat
function buildAutoEcoTireUrl(lat, prof, diam) {
  return buildAutoEcoLink(`/anvelope-${lat}-${prof}-r${diam}/`);
}

const BRAND_SLUG = {
  'Audi':'audi','BMW':'bmw','Mercedes':'mercedes-benz','Mercedes-Benz':'mercedes-benz',
  'Volkswagen':'volkswagen','VW':'volkswagen','Dacia':'dacia','Renault':'renault',
  'Ford':'ford','Opel':'opel','Peugeot':'peugeot','Citroën':'citroen','Citroen':'citroen',
  'Toyota':'toyota','Honda':'honda','Hyundai':'hyundai','Kia':'kia','KIA':'kia',
  'Skoda':'skoda','Škoda':'skoda','Seat':'seat','SEAT':'seat','Fiat':'fiat',
  'Volvo':'volvo','Mazda':'mazda','Nissan':'nissan','Mitsubishi':'mitsubishi',
  'Suzuki':'suzuki','Subaru':'subaru','Jeep':'jeep','Alfa Romeo':'alfa-romeo',
  'Lancia':'lancia','Chrysler':'chrysler','Dodge':'dodge','Lexus':'lexus',
  'Infiniti':'infiniti','Jaguar':'jaguar','Land Rover':'land-rover','Mini':'mini',
  'Porsche':'porsche','Chevrolet':'chevrolet','Saab':'saab','Lada':'lada',
};

function getModelSlug(model) {
  if(!model) return '';
  return model.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'').replace(/-+/g,'-');
}

// Intervale implicite per categorie (km)
const CATEGORII_PIESE = [
  { id:'ulei-motor',        label:'Ulei motor',         icon:'🛢️', slug:'ulei-motor',         color:'#f0b429', kmDefault:10000, priority:1 },
  { id:'filtre-ulei',       label:'Filtru ulei',         icon:'🔧', slug:'filtre-ulei',         color:'#ffa502', kmDefault:10000, priority:1 },
  { id:'filtru-habitaclu',  label:'Filtru habitaclu',    icon:'🌬️', slug:'filtru-habitaclu',    color:'#00b4d8', kmDefault:15000, priority:2 },
  { id:'filtre-aer',        label:'Filtru aer',          icon:'💨', slug:'filtre-aer',          color:'#4f7dff', kmDefault:20000, priority:2 },
  { id:'filtru-combustibil',label:'Filtru combustibil',  icon:'⛽', slug:'filtru-combustibil',  color:'#a259ff', kmDefault:30000, priority:3 },
  { id:'placute-frana',     label:'Plăcuțe frână',       icon:'🔴', slug:'placute-frana',       color:'#ff4757', kmDefault:30000, priority:3 },
  { id:'bujii',             label:'Bujii',               icon:'⚡', slug:'bujii',               color:'#ffb300', kmDefault:40000, priority:4 },
  { id:'baterie',           label:'Baterie auto',        icon:'🔋', slug:'baterie-auto',        color:'#00c864', kmDefault:50000, priority:5 },
  { id:'discuri-frana',     label:'Discuri frână',       icon:'⭕', slug:'discuri-frana',       color:'#ff6b35', kmDefault:60000, priority:5 },
  { id:'curea-distributie', label:'Distribuție',         icon:'⚙️', slug:'kit-distributie',     color:'#7c5cfc', kmDefault:60000, priority:6 },
  { id:'amortizoare',       label:'Amortizoare',         icon:'🔩', slug:'amortizoare',         color:'#9e9e9e', kmDefault:80000, priority:7 },
  { id:'accesorii',         label:'Accesorii',           icon:'🛒', slug:'accesorii-auto',      color:'#2ed573', kmDefault:0,     priority:9 },
];

// Opțiuni interval disponibile (km)
const KM_OPTIONS = [5000,7500,10000,12500,15000,20000,25000,30000,40000,50000,60000,80000,100000];

// Categorii "din afara mentenanței" — nu au interval fix de schimbare, deci nu apar în grid-ul cu badge-uri.
// Sunt folosite doar la căutarea cu preț real (chips + dropdown), ca să nu aglomerăm dashboard-ul.
const CATEGORII_CAUTARE_EXTRA = [
  { id:'pompa-apa',                 label:'Pompă apă',           icon:'💧' },
  { id:'termostat',                 label:'Termostat',           icon:'🌡️' },
  { id:'radiator-apa',              label:'Radiator',            icon:'❄️' },
  { id:'alternator',                label:'Alternator',          icon:'🔋' },
  { id:'electromotor',              label:'Electromotor',        icon:'⚙️' },
  { id:'bobina-inductie',           label:'Bobină inducție',     icon:'⚡' },
  { id:'injector',                  label:'Injector',            icon:'💉' },
  { id:'rulment-roata',             label:'Rulment roată',       icon:'🛞' },
  { id:'etrier-frana',              label:'Etrier frână',        icon:'🔧' },
  { id:'senzor-abs',                label:'Senzor ABS',          icon:'📡' },
  { id:'sonda-lambda',              label:'Sondă lambda',        icon:'🔬' },
  { id:'catalizator',               label:'Catalizator',         icon:'🌫️' },
  { id:'compresor-ac',              label:'Compresor AC',        icon:'❄️' },
  { id:'pompa-servodirectie',       label:'Pompă servodirecție', icon:'🎛️' },
  { id:'cap-bara',                  label:'Cap de bară',         icon:'🔩' },
  { id:'bieleta-directie',          label:'Bieletă direcție',    icon:'🔩' },
  { id:'brat-suspensie',            label:'Braț suspensie',      icon:'🦾' },
  { id:'kit-ambreiaj',              label:'Kit ambreiaj',        icon:'⚙️' },
  { id:'rulment-presiune-ambreiaj', label:'Rulment presiune',    icon:'🛞' },
  { id:'burduf-planetara',          label:'Burduf planetară',    icon:'🛞' },
  { id:'toba-esapament',            label:'Toba eșapament',      icon:'💨' },
  { id:'far-auto',                  label:'Far auto',            icon:'💡' },
  { id:'stergatoare',                label:'Ștergătoare',         icon:'🌧️' },
  { id:'senzori-parcare',           label:'Senzori parcare',     icon:'📶' },
];

// ── Citire/scriere config per mașină per piesă ──
function getPieseConfig(carId) {
  return JSON.parse(localStorage.getItem('piese_cfg_'+carId)||'{}');
}
function savePieseConfig(carId, cfg) {
  localStorage.setItem('piese_cfg_'+carId, JSON.stringify(cfg));
}
function getCatConfig(carId, catId) {
  const cfg = getPieseConfig(carId);
  return cfg[catId] || {};
}
function saveCatConfig(carId, catId, data) {
  const cfg = getPieseConfig(carId);
  cfg[catId] = { ...cfg[catId], ...data };
  savePieseConfig(carId, cfg);
}

function buildAutodocUrl(brand, model, categorie) {
  const brandSlug = BRAND_SLUG[brand] || brand?.toLowerCase().replace(/\s+/g,'-') || '';
  const modelSlug = getModelSlug(model);
  let url = AUTODOC_BASE;
  if(brandSlug && modelSlug && categorie) url += `/${brandSlug}/${modelSlug}/${categorie}/`;
  else if(brandSlug && modelSlug) url += `/${brandSlug}/${modelSlug}/`;
  else if(brandSlug) url += `/${brandSlug}/`;
  if(AUTODOC_AFILIAT !== 'AFILIAT_ID') url += `?aff=${AUTODOC_AFILIAT}`;
  return url;
}

function initPiese() {
  renderPieseCarTabs();
  populateFeedCatFilter();
  populateFeedBrandFilter();
  renderFeedCategoryChips();
  pieseFeedSearch();
}

// ═══ CĂUTARE PRODUSE REALE (feed Automobilus — preț, poză, link direct) ═══
async function pieseFeedSearch() {
  const resultsEl = document.getElementById('feed-results');
  if(!resultsEl || typeof supabaseClient === 'undefined') return;

  const q = document.getElementById('feed-search-input')?.value?.trim() || '';
  const cat = document.getElementById('feed-filter-cat')?.value || '';
  const brand = document.getElementById('feed-filter-brand')?.value || '';
  const pretMin = document.getElementById('feed-filter-pret-min')?.value;
  const pretMax = document.getElementById('feed-filter-pret-max')?.value;

  resultsEl.innerHTML = `<div style="text-align:center;padding:24px;color:var(--t3)">Se caută...</div>`;

  let query = supabaseClient.from('piese_automobilus').select('*').limit(60);
  if(q) query = query.ilike('titlu', `%${q}%`);
  if(cat) query = query.eq('categorie_app', cat);
  if(brand) query = query.eq('brand', brand);
  if(pretMin) query = query.gte('pret', parseFloat(pretMin));
  if(pretMax) query = query.lte('pret', parseFloat(pretMax));
  query = query.order('pret', { ascending: true });

  const { data, error } = await query;
  if(error) { resultsEl.innerHTML = `<div style="text-align:center;padding:24px;color:var(--red)">Eroare la căutare. Verifică dacă tabelul piese_automobilus există și are date.</div>`; return; }
  if(!data || !data.length) { resultsEl.innerHTML = `<div style="text-align:center;padding:24px;color:var(--t3)">Niciun rezultat. Încearcă alt termen sau filtru.</div>`; return; }

  resultsEl.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px">
    ${data.map(p => `
      <a href="${p.link_cumparare}" target="_blank" onclick="event.preventDefault();showCompatNotice(this.href)" style="text-decoration:none;background:var(--s2);border:1.5px solid var(--b2);border-radius:14px;overflow:hidden;display:flex;flex-direction:column;transition:all 0.15s" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--b2)'">
        <div style="width:100%;aspect-ratio:1;background:var(--s3);display:flex;align-items:center;justify-content:center;overflow:hidden">
          ${p.imagine ? `<img src="${p.imagine}" style="width:100%;height:100%;object-fit:contain" loading="lazy" onerror="this.style.display='none'">` : `<span style="font-size:32px">🔧</span>`}
        </div>
        <div style="padding:10px;flex:1;display:flex;flex-direction:column">
          ${p.brand ? `<div style="font-size:9px;color:var(--accent);font-weight:800;text-transform:uppercase;margin-bottom:2px">${p.brand}</div>` : ''}
          <div style="font-size:11px;color:var(--t1);font-weight:600;line-height:1.3;flex:1;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${p.titlu}</div>
          <div style="margin-top:6px;display:flex;align-items:baseline;gap:6px">
            <span style="font-family:'Bebas Neue';font-size:18px;color:var(--green)">${Number(p.pret).toFixed(2)} lei</span>
            ${p.pret_vechi && p.pret_vechi > p.pret ? `<span style="font-size:10px;color:var(--t3);text-decoration:line-through">${Number(p.pret_vechi).toFixed(2)} lei</span>` : ''}
          </div>
        </div>
      </a>`).join('')}
  </div>`;
}

function populateFeedCatFilter() {
  const sel = document.getElementById('feed-filter-cat');
  if(!sel) return;
  const mentenanta = CATEGORII_PIESE.filter(c=>c.id!=='accesorii').map(c => `<option value="${c.id}">${c.icon} ${c.label}</option>`).join('');
  const extra = CATEGORII_CAUTARE_EXTRA.map(c => `<option value="${c.id}">${c.icon} ${c.label}</option>`).join('');
  sel.innerHTML = `<option value="">Toate categoriile</option><optgroup label="Mentenanță">${mentenanta}</optgroup><optgroup label="Alte piese">${extra}</optgroup>`;
}

function renderFeedCategoryChips() {
  const el = document.getElementById('feed-category-chips');
  if(!el) return;
  el.innerHTML = CATEGORII_CAUTARE_EXTRA.map(c => `
    <button onclick="document.getElementById('feed-filter-cat').value='${c.id}';pieseFeedSearch()" style="
      padding:6px 12px;background:var(--s2);border:1px solid var(--b2);border-radius:20px;
      color:var(--t2);font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0">
      ${c.icon} ${c.label}
    </button>`).join('');
}

async function populateFeedBrandFilter() {
  const sel = document.getElementById('feed-filter-brand');
  if(!sel || typeof supabaseClient === 'undefined') return;
  const { data } = await supabaseClient.from('piese_automobilus').select('brand').not('brand','is',null).limit(2000);
  const brands = [...new Set((data||[]).map(r=>r.brand))].filter(Boolean).sort();
  sel.innerHTML = '<option value="">Toate mărcile</option>' + brands.map(b=>`<option value="${b}">${b}</option>`).join('');
}

// Returnează mașina activă — fie una din garaj, fie una temporară introdusă manual
function pieseGetActiveCar() {
  if(window._pieseCarId === 'custom' && window._pieseCustomCar) return window._pieseCustomCar;
  return cars.find(c=>c.id==window._pieseCarId);
}

function renderPieseCarTabs() {
  const tabsEl = document.getElementById('piese-car-tabs');
  if(!tabsEl) return;

  const garajTabs = (cars||[]).map(c => {
    const isActive = String(window._pieseCarId) === String(c.id);
    return `<button onclick="pieseSelectCar(${c.id})" style="
      display:flex;align-items:center;gap:10px;padding:10px 16px;
      border-radius:12px;border:2px solid ${isActive?'var(--accent)':'var(--b2)'};
      background:${isActive?'rgba(79,125,255,0.12)':'var(--s2)'};
      cursor:pointer;flex-shrink:0;transition:all 0.15s;white-space:nowrap;min-width:140px">
      <span style="font-size:26px;line-height:1">🚗</span>
      <div style="text-align:left;flex:1">
        <div style="font-weight:700;font-size:13px;color:${isActive?'var(--accent)':'var(--t1)'}">${c.plate}</div>
        <div style="font-size:10px;color:var(--t3);margin-top:1px">${c.brand} ${c.model} ${c.year||''}</div>
      </div>
    </button>`;
  }).join('');

  const customIsActive = window._pieseCarId === 'custom';
  const customTab = window._pieseCustomCar
    ? `<button onclick="pieseSelectCar('custom')" style="
        display:flex;align-items:center;gap:10px;padding:10px 16px;
        border-radius:12px;border:2px dashed ${customIsActive?'var(--accent)':'var(--b2)'};
        background:${customIsActive?'rgba(79,125,255,0.12)':'var(--s2)'};
        cursor:pointer;flex-shrink:0;transition:all 0.15s;white-space:nowrap;min-width:140px">
        <span style="font-size:26px;line-height:1">🔍</span>
        <div style="text-align:left;flex:1">
          <div style="font-weight:700;font-size:13px;color:${customIsActive?'var(--accent)':'var(--t1)'}">${window._pieseCustomCar.brand}</div>
          <div style="font-size:10px;color:var(--t3);margin-top:1px">${window._pieseCustomCar.model} ${window._pieseCustomCar.year||''} (căutare)</div>
        </div>
      </button>`
    : '';

  const addTab = `<button onclick="pieseOpenCustomForm()" style="
      display:flex;align-items:center;gap:8px;padding:10px 16px;
      border-radius:12px;border:2px dashed var(--b2);background:transparent;
      cursor:pointer;flex-shrink:0;white-space:nowrap;color:var(--t3);font-size:12px;font-weight:700">
      ➕ Altă mașină
    </button>`;

  tabsEl.innerHTML = garajTabs + customTab + addTab;

  if(!cars?.length && !window._pieseCustomCar) {
    document.getElementById('piese-grid').innerHTML = `<div style="text-align:center;padding:24px;color:var(--t3)"><div style="font-size:32px;margin-bottom:8px">🚗</div><div>Nu ai mașini în garaj — apasă "➕ Altă mașină" pentru a căuta piese fără s-o adaugi permanent, sau <button class="btn btn-ghost btn-sm" onclick="goTo('garaj')">adaugă-o în garaj</button></div></div>`;
    return;
  }

  if((!window._pieseCarId || (window._pieseCarId!=='custom' && !cars.find(c=>c.id==window._pieseCarId))) ) {
    window._pieseCarId = cars?.length ? cars[0].id : 'custom';
  }

  renderPieseGrid();
}

function pieseOpenCustomForm() {
  const html = `
    <div class="md">
      <div class="md-handle"></div>
      <div class="md-h"><div class="md-t">🔍 Caută pentru altă mașină</div><div class="md-x" onclick="closeM('piese-custom')">✕</div></div>
      <div class="md-sub">Nu se salvează în garaj — doar pentru căutarea curentă de piese</div>
      <div style="display:flex;flex-direction:column;gap:10px;padding:4px 0">
        <input type="text" id="piese-custom-brand" placeholder="Marcă (ex: Volkswagen)" class="inp">
        <input type="text" id="piese-custom-model" placeholder="Model (ex: Golf 6)" class="inp">
        <input type="text" id="piese-custom-year" placeholder="An fabricație (opțional)" class="inp">
        <input type="text" id="piese-custom-vin" placeholder="VIN / serie șasiu (opțional, recomandat)" class="inp">
        <button class="btn btn-primary" onclick="pieseSaveCustomCar()">Caută piese</button>
      </div>
    </div>`;
  let mo = document.getElementById('mo-piese-custom');
  if(!mo) {
    mo = document.createElement('div');
    mo.className = 'mo';
    mo.id = 'mo-piese-custom';
    document.body.appendChild(mo);
  }
  mo.innerHTML = html;
  openM('piese-custom');
}

function pieseSaveCustomCar() {
  const brand = document.getElementById('piese-custom-brand')?.value?.trim();
  const model = document.getElementById('piese-custom-model')?.value?.trim();
  const year = document.getElementById('piese-custom-year')?.value?.trim();
  const vin = document.getElementById('piese-custom-vin')?.value?.trim();
  if(!brand || !model) { showNotification('⚠️ Lipsesc date', 'Completează cel puțin marca și modelul.'); return; }
  window._pieseCustomCar = { id:'custom', brand, model, year, vin, plate:'Căutare', km:0 };
  window._pieseCarId = 'custom';
  closeM('piese-custom');
  renderPieseCarTabs();
}

function pieseSelectCar(carId) {
  window._pieseCarId = carId;
  renderPieseCarTabs();
}

function renderPieseGrid() {
  const el = document.getElementById('piese-grid');
  const headerEl = document.getElementById('piese-car-header');
  if(!el) return;
  const car = pieseGetActiveCar();
  if(!car) return;
  const isCustom = car.id === 'custom';

  if(headerEl) {
    headerEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:14px;padding:16px;background:linear-gradient(135deg,rgba(79,125,255,0.1),rgba(124,92,252,0.06));border:1px solid rgba(79,125,255,0.2);border-radius:14px;margin-bottom:16px">
        <div style="font-size:36px">${isCustom?'🔍':'🚗'}</div>
        <div style="flex:1">
          <div style="font-weight:800;font-size:16px;color:var(--t1)">${car.brand} ${car.model} ${car.year||''}</div>
          <div style="font-size:12px;color:var(--t3);margin-top:2px">${isCustom?'Căutare temporară — nu e salvată în garaj':car.plate}${car.vin?' · VIN: '+car.vin:''}${car.fuel?' · '+car.fuel:''}</div>
          ${!isCustom?`<div style="font-size:12px;color:var(--accent);margin-top:4px;font-weight:600">📍 ${car.km?Number(car.km).toLocaleString()+' km actuali':'Km nespecificați'}</div>`:''}
          ${car.vin?`<button onclick="pieseCopiazaVin('${car.vin}')" style="margin-top:6px;font-size:11px;background:rgba(79,125,255,0.1);border:1px solid rgba(79,125,255,0.25);color:var(--accent);padding:4px 10px;border-radius:8px;cursor:pointer;font-weight:700">📋 Copiază VIN pentru căutare pe magazin</button>`:''}
        </div>
        <div style="text-align:right;display:flex;flex-direction:column;gap:6px;align-items:flex-end">
          <div style="background:${isCustom?'rgba(79,125,255,0.12)':'rgba(0,200,100,0.12)'};border:1px solid ${isCustom?'rgba(79,125,255,0.25)':'rgba(0,200,100,0.25)'};color:${isCustom?'var(--accent)':'var(--green)'};font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px">${isCustom?'🔍 Căutare':'✓ Mașina ta'}</div>
          ${isCustom?`<button onclick="pieseAddCustomToGaraj()" style="background:none;border:none;color:var(--t3);font-size:10px;cursor:pointer;text-decoration:underline">Adaugă în garaj</button>`:`<button onclick="pieseResetConfig('${car.id}')" style="background:none;border:none;color:var(--t3);font-size:10px;cursor:pointer;text-decoration:underline">Resetează intervale</button>`}
        </div>
      </div>`;
  }

  const km = isCustom ? 0 : parseInt(car.km || 0);
  const cfg = isCustom ? {} : getPieseConfig(car.id);

  const categoriiCalc = CATEGORII_PIESE.map(cat => {
    const catCfg = cfg[cat.id] || {};
    const interval = catCfg.interval || cat.kmDefault;
    const ultimaKm = catCfg.ultimaKm ? parseInt(catCfg.ultimaKm) : null;
    const ultimaData = catCfg.ultimaData || null;

    let urgenta = 0, kmRamasi = null, pct = 0;
    if(interval > 0 && km > 0) {
      const bazaKm = ultimaKm !== null ? ultimaKm : 0;
      const parcursi = km - bazaKm;
      kmRamasi = interval - parcursi;
      pct = Math.min(100, Math.round(parcursi / interval * 100));
      if(kmRamasi <= 0) urgenta = 2;
      else if(kmRamasi <= interval * 0.2) urgenta = 1;
    }
    return { ...cat, interval, ultimaKm, ultimaData, urgenta, kmRamasi, pct };
  }).sort((a,b) => b.urgenta - a.urgenta || a.priority - b.priority);

  const scadente = categoriiCalc.filter(c=>c.urgenta===2).length;
  const curand = categoriiCalc.filter(c=>c.urgenta===1).length;

  el.innerHTML = `
    ${isCustom ? `
    <div style="background:rgba(79,125,255,0.08);border:1px solid rgba(79,125,255,0.2);border-radius:12px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;gap:10px">
      <span style="font-size:20px">🔍</span>
      <div style="font-size:13px;color:var(--t2)">Ai ales o mașină din afara garajului — vezi catalogul de piese, dar fără alerte de scadență (nu avem kilometrajul ei).</div>
    </div>` : ''}
    ${(scadente||curand) ? `
    <div style="background:rgba(240,180,41,0.08);border:1px solid rgba(240,180,41,0.2);border-radius:12px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;gap:10px">
      <span style="font-size:20px">💡</span>
      <div style="font-size:13px;color:var(--t2)">
        ${scadente?`<strong style="color:var(--red)">${scadente} scadent${scadente===1?'':'e'}</strong> `:''}
        ${curand?`<strong style="color:var(--amber)">${curand} în curând</strong> `:''}
        pentru ${car.brand} ${car.model} la ${km.toLocaleString()} km
        ${!km?'<span style="color:var(--t3)"> — adaugă km mașinii pentru calcule precise</span>':''}
      </div>
    </div>` : km?`
    <div style="background:rgba(0,200,100,0.06);border:1px solid rgba(0,200,100,0.15);border-radius:12px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;gap:10px">
      <span style="font-size:20px">✅</span>
      <div style="font-size:13px;color:var(--t2)">Totul în regulă pentru ${car.brand} ${car.model} la ${km.toLocaleString()} km</div>
    </div>`:''}

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:10px">
      ${categoriiCalc.map(cat => {
        if(cat.id==='accesorii') {
          const url = buildAutoEcoUrl(car.brand, cat.id);
          const urlAuto = buildAutomobilusUrl(car.brand, cat.id);
          return `<div style="
            position:relative;background:var(--s2);border-radius:14px;padding:16px;
            border:1.5px solid var(--b2);transition:all 0.15s;text-align:center"
            onmouseover="this.style.borderColor='${cat.color}'" onmouseout="this.style.borderColor='var(--b2)'">
            <div onclick="deschidePiesa('${url}','${cat.label}','${car.brand} ${car.model}')" style="cursor:pointer">
              <div style="font-size:28px;margin-bottom:6px">${cat.icon}</div>
              <div style="font-weight:700;font-size:12px;color:var(--t1);margin-bottom:3px">${cat.label}</div>
              <div style="font-size:10px;color:var(--t3)">Vezi pe AutoEco →</div>
            </div>
            <div onclick="deschidePiesa('${urlAuto}','${cat.label}','${car.brand} ${car.model}')" style="cursor:pointer;margin-top:6px;padding-top:6px;border-top:1px dashed var(--b2);font-size:10px;color:var(--accent);font-weight:700">🅰️ Automobilus →</div>
          </div>`;
        }

        const badgeHtml = cat.urgenta===2
          ? `<div style="position:absolute;top:8px;left:8px;background:var(--red);color:#fff;font-size:9px;font-weight:800;padding:2px 7px;border-radius:6px">SCADENT</div>`
          : cat.urgenta===1
          ? `<div style="position:absolute;top:8px;left:8px;background:var(--amber);color:#000;font-size:9px;font-weight:800;padding:2px 7px;border-radius:6px">CURÂND</div>`
          : cat.ultimaKm
          ? `<div style="position:absolute;top:8px;left:8px;background:var(--green);color:#fff;font-size:9px;font-weight:800;padding:2px 7px;border-radius:6px">OK</div>`
          : '';

        const barColor = cat.urgenta===2?'var(--red)':cat.urgenta===1?'var(--amber)':'var(--green)';
        const barHtml = cat.interval>0 ? `
          <div style="background:var(--s3);border-radius:3px;height:4px;overflow:hidden;margin:6px 0 4px">
            <div style="width:${cat.pct}%;height:100%;background:${barColor};border-radius:3px;transition:width 0.4s"></div>
          </div>
          <div style="font-size:9px;color:${cat.urgenta>0?barColor:'var(--t3)'};font-weight:600">
            ${cat.kmRamasi!==null?(cat.kmRamasi<=0?`⛔ Depășit cu ${Math.abs(cat.kmRamasi).toLocaleString()} km`:`${cat.kmRamasi.toLocaleString()} km rămași`):'Interval: '+cat.interval.toLocaleString()+' km'}
          </div>` : '';

        const ultimaInfo = cat.ultimaKm||cat.ultimaData ? `
          <div style="font-size:9px;color:var(--t3);margin-top:3px">
            ${cat.ultimaKm?'La: '+Number(cat.ultimaKm).toLocaleString()+' km':''}
            ${cat.ultimaData?' · '+cat.ultimaData:''}
          </div>` : `<div style="font-size:9px;color:var(--t3);margin-top:3px">Neinregistrat</div>`;

        const url = buildAutoEcoUrl(car.brand, cat.id);
        const urlAuto = buildAutomobilusUrl(car.brand, cat.id);
        return `
          <div style="position:relative;background:var(--s2);border-radius:14px;padding:14px;
            border:1.5px solid ${cat.urgenta===2?'rgba(255,71,87,0.3)':cat.urgenta===1?'rgba(240,180,41,0.3)':'var(--b2)'};transition:all 0.15s">
            ${badgeHtml}
            <!-- Buton configurare -->
            <button onclick="event.stopPropagation();deschideConfigPiesa('${car.id}','${cat.id}')" style="
              position:absolute;top:8px;right:8px;background:var(--s3);border:none;
              color:var(--t3);font-size:12px;width:22px;height:22px;border-radius:6px;
              cursor:pointer;display:flex;align-items:center;justify-content:center" title="Configurează intervalul">⚙️</button>
            <div style="text-align:center;margin-bottom:8px;margin-top:4px">
              <div style="font-size:26px;margin-bottom:4px">${cat.icon}</div>
              <div style="font-weight:700;font-size:12px;color:var(--t1)">${cat.label}</div>
            </div>
            ${barHtml}
            ${ultimaInfo}
            <button onclick="deschidePiesa('${url}','${cat.label}','${car.brand} ${car.model}')" style="
              width:100%;margin-top:8px;padding:6px;background:rgba(168,85,247,0.1);
              border:1px solid rgba(168,85,247,0.2);border-radius:8px;color:#a855f7;
              font-size:10px;font-weight:700;cursor:pointer">
              🟣 AutoEco →
            </button>
            <button onclick="deschidePiesa('${urlAuto}','${cat.label}','${car.brand} ${car.model}')" style="
              width:100%;margin-top:5px;padding:6px;background:rgba(0,200,100,0.1);
              border:1px solid rgba(0,200,100,0.2);border-radius:8px;color:var(--green);
              font-size:10px;font-weight:700;cursor:pointer">
              🅰️ Automobilus →
            </button>
          </div>`;
      }).join('')}
    </div>

    <div style="margin-top:16px;padding:12px 16px;background:var(--s2);border-radius:12px;display:flex;gap:10px;align-items:flex-start">
      <span style="font-size:18px;flex-shrink:0">🔍</span>
      <div style="font-size:11px;color:var(--t3);line-height:1.5">
        AutoEco și Automobilus verifică amândouă compatibilitatea pieselor cu <strong>${car.brand} ${car.model} ${car.year||''}</strong>.
        ${car.vin?`VIN: <strong>${car.vin}</strong> — folosește-l pe magazine pentru precizie maximă.`:'Adaugă VIN-ul în Garaj pentru filtrare precisă.'}
        <br>Apasă ⚙️ pe orice piesă pentru a seta intervalul și data ultimei schimbări.
      </div>
    </div>`;
}

// ── Modal configurare piesă ──
function deschideConfigPiesa(carId, catId) {
  const cat = CATEGORII_PIESE.find(c=>c.id===catId);
  const car = cars.find(c=>c.id==carId);
  if(!cat||!car) return;
  const catCfg = getCatConfig(carId, catId);
  const intervalCurent = catCfg.interval || cat.kmDefault;
  const ultimaKm = catCfg.ultimaKm || '';
  const ultimaData = catCfg.ultimaData || '';

  const optionsHtml = KM_OPTIONS.map(k =>
    `<option value="${k}" ${k===intervalCurent?'selected':''}>${k.toLocaleString()} km</option>`
  ).join('');

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:flex-end;justify-content:center;padding:0';
  overlay.innerHTML = `
    <div style="background:var(--s1);border-radius:20px 20px 0 0;padding:24px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <div>
          <div style="font-size:22px;margin-bottom:2px">${cat.icon} ${cat.label}</div>
          <div style="font-size:12px;color:var(--t3)">${car.brand} ${car.model} ${car.year||''} · ${car.plate}</div>
        </div>
        <button onclick="this.closest('div[style*=fixed]').remove()" style="background:var(--s2);border:none;color:var(--t2);font-size:20px;width:32px;height:32px;border-radius:50%;cursor:pointer">×</button>
      </div>

      <!-- Interval -->
      <div class="fg">
        <label class="fl">⏱️ Interval schimbare</label>
        <select class="fi" id="cfg-interval-sel">
          ${optionsHtml}
          <option value="custom" ${!KM_OPTIONS.includes(intervalCurent)?'selected':''}>Altul (personalizat)</option>
        </select>
        <div id="cfg-interval-custom-wrap" style="display:${!KM_OPTIONS.includes(intervalCurent)?'block':'none'};margin-top:8px">
          <input class="fi" id="cfg-interval-custom" type="number" placeholder="ex: 15000"
            value="${!KM_OPTIONS.includes(intervalCurent)?intervalCurent:''}" style="margin:0">
        </div>
      </div>

      <!-- Ultima schimbare - km -->
      <div class="fr" style="margin-top:4px">
        <div class="fg" style="margin:0">
          <label class="fl">📍 Ultima schimbare (km)</label>
          <input class="fi" id="cfg-ultima-km" type="number" placeholder="ex: 245000" value="${ultimaKm}"
            oninput="cfgValidateKm(this,'${car.km||0}')">
          <div id="cfg-km-hint" style="font-size:11px;margin-top:3px"></div>
        </div>
        <div class="fg" style="margin:0">
          <label class="fl">📅 Data ultimei schimbări</label>
          <input class="fi" id="cfg-ultima-data" type="date" value="${ultimaData}">
        </div>
      </div>

      <!-- Preview calcul -->
      <div id="cfg-preview" style="margin-top:12px;padding:12px;background:var(--s2);border-radius:10px;font-size:12px;color:var(--t2)">
        Completează datele pentru a vedea calculul.
      </div>

      <div style="display:flex;gap:8px;margin-top:16px">
        <button onclick="cfgSterge('${carId}','${catId}',this)" class="btn btn-ghost btn-sm" style="flex:1;color:var(--t3)">🗑 Șterge date</button>
        <button onclick="cfgSalveaza('${carId}','${catId}',this.closest('div[style*=fixed]'))" class="btn btn-primary btn-sm" style="flex:2">💾 Salvează</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if(e.target===overlay) overlay.remove(); });

  // Listener select interval
  const sel = overlay.querySelector('#cfg-interval-sel');
  const customWrap = overlay.querySelector('#cfg-interval-custom-wrap');
  sel.addEventListener('change', () => {
    customWrap.style.display = sel.value==='custom' ? 'block' : 'none';
    cfgUpdatePreview(car.km, cat.kmDefault);
  });

  // Listeners pentru preview live
  ['cfg-ultima-km','cfg-ultima-data','cfg-interval-custom'].forEach(id => {
    overlay.querySelector('#'+id)?.addEventListener('input', () => cfgUpdatePreview(car.km, cat.kmDefault));
  });

  // Preview inițial
  cfgUpdatePreview(car.km, cat.kmDefault);
}

function cfgValidateKm(input, carKm) {
  const km = parseInt(input.value);
  const hint = document.getElementById('cfg-km-hint');
  if(!hint||!km) { if(hint) hint.innerHTML=''; return; }
  if(carKm && km > parseInt(carKm)) {
    hint.innerHTML = `<span style="color:var(--amber)">⚠️ Mai mare decât km actuali ai mașinii (${Number(carKm).toLocaleString()} km)</span>`;
  } else {
    hint.innerHTML = `<span style="color:var(--green)">✓ OK</span>`;
  }
  cfgUpdatePreview(carKm, 0);
}

function cfgUpdatePreview(carKm, defaultKm) {
  const prev = document.getElementById('cfg-preview');
  if(!prev) return;
  const selEl = document.getElementById('cfg-interval-sel');
  const customEl = document.getElementById('cfg-interval-custom');
  const ultimaKmEl = document.getElementById('cfg-ultima-km');
  if(!selEl) return;

  let interval = selEl.value==='custom'
    ? parseInt(customEl?.value||defaultKm)
    : parseInt(selEl.value||defaultKm);
  const ultimaKm = parseInt(ultimaKmEl?.value||0);
  const km = parseInt(carKm||0);

  if(!interval||interval<=0) { prev.innerHTML='Setează intervalul.'; return; }
  if(!km) { prev.innerHTML=`Interval: <strong>${interval.toLocaleString()} km</strong>. Adaugă km mașinii pentru calcul complet.`; return; }

  const parcursi = ultimaKm ? km - ultimaKm : km;
  const ramasi = interval - parcursi;
  const pct = Math.min(100,Math.round(parcursi/interval*100));
  const color = ramasi<=0?'var(--red)':ramasi<=interval*0.2?'var(--amber)':'var(--green)';

  prev.innerHTML = `
    <div style="margin-bottom:8px;font-weight:600">
      ${ramasi<=0
        ? `<span style="color:var(--red)">⛔ Scadent — depășit cu ${Math.abs(ramasi).toLocaleString()} km</span>`
        : `<span style="color:${color}">${ramasi<=interval*0.2?'⚠️':'✅'} Mai sunt ${ramasi.toLocaleString()} km până la schimbare</span>`}
    </div>
    <div style="background:var(--s3);border-radius:4px;height:6px;overflow:hidden;margin-bottom:6px">
      <div style="width:${pct}%;height:100%;background:${color};border-radius:4px;transition:width 0.3s"></div>
    </div>
    <div style="font-size:11px;color:var(--t3)">
      ${ultimaKm?`Ultima schimbare: ${ultimaKm.toLocaleString()} km · `:''}
      Km actuali: ${km.toLocaleString()} km ·
      Interval: ${interval.toLocaleString()} km ·
      Utilizat: ${pct}%
    </div>`;
}

function cfgSalveaza(carId, catId, overlayEl) {
  const selEl = document.getElementById('cfg-interval-sel');
  const customEl = document.getElementById('cfg-interval-custom');
  const ultimaKmEl = document.getElementById('cfg-ultima-km');
  const ultimaDataEl = document.getElementById('cfg-ultima-data');

  const cat = CATEGORII_PIESE.find(c=>c.id===catId);
  let interval = selEl?.value==='custom'
    ? parseInt(customEl?.value||cat?.kmDefault||10000)
    : parseInt(selEl?.value||cat?.kmDefault||10000);

  if(!interval||interval<1000) { showNotification('❌','Intervalul trebuie să fie cel puțin 1.000 km.'); return; }

  saveCatConfig(carId, catId, {
    interval,
    ultimaKm: ultimaKmEl?.value ? parseInt(ultimaKmEl.value) : null,
    ultimaData: ultimaDataEl?.value || null,
  });

  if(overlayEl) overlayEl.remove();
  renderPieseGrid();
  showNotification('✅ Salvat!', `Interval ${interval.toLocaleString()} km setat pentru ${CATEGORII_PIESE.find(c=>c.id===catId)?.label}`);
}

function cfgSterge(carId, catId, btn) {
  btn.textContent='Sigur?';
  btn.onclick = () => {
    saveCatConfig(carId, catId, { interval:null, ultimaKm:null, ultimaData:null });
    btn.closest('div[style*=fixed]')?.remove();
    renderPieseGrid();
    showNotification('🗑 Resetat', 'S-au șters datele pentru această piesă.');
  };
}

function pieseResetConfig(carId) {
  if(!confirm('Ștergi toate intervalele personalizate pentru această mașină?')) return;
  localStorage.removeItem('piese_cfg_'+carId);
  renderPieseGrid();
  showNotification('🔄 Resetat', 'Toate intervalele au revenit la valorile implicite.');
}

function pieseCopiazaVin(vin) {
  navigator.clipboard.writeText(vin).then(() => {
    showNotification('📋 VIN copiat!', `Lipește-l în căsuța de căutare VIN de pe site-ul magazinului (AutoEco/Automobilus) — nu îl putem completa noi automat, e un widget al lor.`);
  }).catch(() => {
    showNotification('⚠️ Eroare', 'Nu am putut copia — copiază manual: ' + vin);
  });
}

// ═══ DETAILING (Automobilus.ro) ═══
function populateDetailingCar() {
  const sel = document.getElementById('detailing-car');
  if(!sel) return;
  sel.innerHTML = '<option value="">-- Din garaj (opțional) --</option>' +
    (cars||[]).map(c => `<option value="${c.id}">${c.brand} ${c.model} (${c.plate})</option>`).join('');
  updateDetailingLink();
}
function updateDetailingLink() {
  const sel = document.getElementById('detailing-car');
  const link = document.getElementById('detailing-car-link');
  if(!link) return;
  const car = (cars||[]).find(c => c.id == sel?.value);
  link.href = buildAutomobilusUrl(car?.brand, null);
  link.textContent = car ? `🅰️ Vezi piese pentru ${car.brand} ${car.model} →` : '🅰️ Vezi toate piesele pe Automobilus.ro →';
}

function deschidePiesa(url, categorie, masina) {
  const stats = JSON.parse(localStorage.getItem('piese_clicks')||'[]');
  stats.unshift({ url, categorie, masina, data: new Date().toISOString() });
  localStorage.setItem('piese_clicks', JSON.stringify(stats.slice(0,50)));
  showCompatNotice(url);
}

// ═══ NOTIFICARE COMPATIBILITATE — apare ÎNTÂI, pagina se deschide doar după confirmare ═══
function showCompatNotice(url) {
  document.getElementById('compat-notice')?.remove();
  document.getElementById('compat-notice-overlay')?.remove();

  if(!document.getElementById('compat-notice-style')) {
    const style = document.createElement('style');
    style.id = 'compat-notice-style';
    style.textContent = `@keyframes compatFadeIn { from{opacity:0;transform:translate(-50%,-50%) scale(0.92)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }`;
    document.head.appendChild(style);
  }

  const overlay = document.createElement('div');
  overlay.id = 'compat-notice-overlay';
  overlay.style.cssText = `position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,0.55)`;

  const el = document.createElement('div');
  el.id = 'compat-notice';
  el.style.cssText = `
    position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
    z-index:9999;background:var(--s1);border:1.5px solid var(--accent);
    border-radius:16px;padding:22px 24px;max-width:340px;width:calc(100% - 40px);
    box-shadow:0 20px 60px rgba(0,0,0,0.45);text-align:center;
    animation:compatFadeIn 0.22s ease;
  `;
  el.innerHTML = `
    <div style="font-size:32px;margin-bottom:8px">⚠️</div>
    <div style="font-weight:800;font-size:15px;color:#fff;margin-bottom:6px">Verifică compatibilitatea!</div>
    <div style="font-size:12px;color:#fff;opacity:0.85;line-height:1.5">
      Pe site-ul partenerului, confirmă piesa exactă cu <strong>seria de șasiu (VIN)</strong> sau marca/modelul mașinii tale înainte să comanzi.
      Dacă nu găsește piesa automat, selectează manual caracteristicile mașinii și piesa dorită, direct pe site.
    </div>
    <div style="display:flex;gap:8px;margin-top:16px">
      <button id="compat-cancel-btn" style="flex:1;padding:10px;background:var(--s2);border:1px solid var(--b2);border-radius:10px;color:#fff;font-weight:700;font-size:12px;cursor:pointer">Anulează</button>
      <button id="compat-confirm-btn" style="flex:1;padding:10px;background:var(--accent);border:none;border-radius:10px;color:#fff;font-weight:700;font-size:12px;cursor:pointer">Am înțeles →</button>
    </div>
    <div style="margin-top:12px;padding-top:12px;border-top:1px dashed var(--b2)">
      <div style="font-size:10px;color:#fff;opacity:0.85;line-height:1.4;margin-bottom:8px">
        Nu s-a deschis nimic? Ai probabil un <strong>blocator de reclame (AdBlock)</strong> activ.
      </div>
      <div style="display:flex;gap:6px;justify-content:center">
        <button id="compat-copy-link" style="padding:6px 12px;background:transparent;border:1px solid var(--b2);border-radius:8px;color:#fff;font-size:10px;cursor:pointer">📋 Copiază linkul</button>
        <button id="compat-edge-link" style="padding:6px 12px;background:transparent;border:1px solid var(--b2);border-radius:8px;color:#fff;font-size:10px;cursor:pointer">🌐 Deschide în Edge</button>
      </div>
    </div>
  `;

  function closeNotice() { el.remove(); overlay.remove(); }
  overlay.onclick = closeNotice;
  document.body.appendChild(overlay);
  document.body.appendChild(el);

  document.getElementById('compat-cancel-btn').onclick = closeNotice;
  document.getElementById('compat-confirm-btn').onclick = () => {
    window.open(url, '_blank');
    closeNotice();
  };
  document.getElementById('compat-copy-link').onclick = () => {
    navigator.clipboard.writeText(url).then(() => {
      const btn = document.getElementById('compat-copy-link');
      if(btn) btn.textContent = '✅ Copiat!';
    });
  };
  document.getElementById('compat-edge-link').onclick = () => {
    // "microsoft-edge:" e un protocol special Windows care forțează deschiderea în Edge,
    // indiferent ce browser rulează acum. Funcționează doar pe Windows cu Edge instalat —
    // prima dată Windows poate cere confirmare ("Deschideți Microsoft Edge?").
    window.location.href = 'microsoft-edge:' + url;
  };
}

function pieseAddCustomToGaraj() {
  if(!window._pieseCustomCar) return;
  if(typeof addCar !== 'function') { showNotification('⚠️', 'Adaugă manual din Garajul Meu.'); return; }
  const c = window._pieseCustomCar;
  addCar({ brand:c.brand, model:c.model, year:c.year||'', vin:c.vin||'', plate:'', km:0 });
  showNotification('✅ Adăugată', `${c.brand} ${c.model} a fost adăugată în garaj.`);
}

// Detectează un format de dimensiune anvelopă în textul căutat (ex: "205/55 R16", "205 55 16")
function parseTireDimension(text) {
  const m = text.match(/(\d{3})\s*[\/\-\s]\s*(\d{2})\s*[rR]?\s*(\d{2})/);
  if(!m) return null;
  return { lat: m[1], prof: m[2], diam: m[3] };
}

// Aceleași cuvinte cheie ca în Edge Function-ul de sincronizare — detectează categoria din textul căutat
const CAUTARE_KEYWORDS = {
  'ulei-motor': ['ulei motor', 'ulei de motor'], 'filtre-ulei': ['filtru ulei', 'filtru de ulei'],
  'filtru-habitaclu': ['filtru habitaclu', 'filtru polen'], 'filtre-aer': ['filtru aer', 'filtru de aer'],
  'filtru-combustibil': ['filtru combustibil', 'filtru motorina', 'filtru benzina'],
  'placute-frana': ['placute frana', 'placute de frana'], 'bujii': ['bujie', 'bujii'],
  'baterie': ['baterie auto', 'acumulator'], 'discuri-frana': ['disc frana', 'discuri frana'],
  'curea-distributie': ['kit distributie', 'curea distributie'], 'amortizoare': ['amortizor'],
  'pompa-apa': ['pompa apa'], 'termostat': ['termostat'], 'radiator-apa': ['radiator apa', 'radiator racire'],
  'alternator': ['alternator'], 'electromotor': ['electromotor', 'demaror'],
  'bobina-inductie': ['bobina inductie'], 'injector': ['injector'], 'rulment-roata': ['rulment roata'],
  'etrier-frana': ['etrier frana'], 'senzor-abs': ['senzor abs'], 'sonda-lambda': ['sonda lambda'],
  'catalizator': ['catalizator'], 'compresor-ac': ['compresor aer conditionat', 'compresor ac'],
  'pompa-servodirectie': ['pompa servodirectie'], 'cap-bara': ['cap bara'],
  'bieleta-directie': ['bieleta directie'], 'brat-suspensie': ['brat suspensie'],
  'kit-ambreiaj': ['kit ambreiaj', 'set ambreiaj'], 'burduf-planetara': ['burduf planetara'],
  'toba-esapament': ['toba esapament', 'toba finala'], 'far-auto': ['far auto'],
  'stergatoare': ['stergator parbriz', 'stergatoare'], 'senzori-parcare': ['senzor parcare', 'senzori parcare'],
};
function detectCategoryFromText(text) {
  const t = text.toLowerCase()
    .replace(/ă/g,'a').replace(/â/g,'a').replace(/î/g,'i').replace(/ș/g,'s').replace(/ț/g,'t');
  for (const [catId, keywords] of Object.entries(CAUTARE_KEYWORDS)) {
    for (const kw of keywords) if (t.includes(kw)) return catId;
  }
  return null;
}

async function pieseCautaLiber() {
  const q = document.getElementById('piese-search-input')?.value?.trim();
  if(!q) return;
  const car = pieseGetActiveCar();

  // Dacă textul arată ca o dimensiune de anvelopă, arătăm direct magazine de anvelope cu filtrul pus
  const dim = parseTireDimension(q);
  if(dim) {
    const { lat, prof, diam } = dim;
    showStoreChooser(q, null, [
      { nume: 'Anvelope.ro — Vară',  icon: '☀️', url: `https://www.anvelope.ro/anvelope-vara/${lat}-${prof}-r${diam}/` },
      { nume: 'Anvelope.ro — Iarnă', icon: '❄️', url: `https://www.anvelope.ro/anvelope-iarna/${lat}-${prof}-r${diam}/` },
      { nume: 'AutoEco — Anvelope',  icon: '🟣', url: buildAutoEcoTireUrl(lat, prof, diam) },
      { nume: 'eMAG — Anvelope',     icon: '🟠', url: EMAG_LINK, sub: 'Sau orice alt produs de pe eMAG' },
    ]);
    return;
  }

  // Detectez categoria din textul căutat, ca link-urile să ducă direct la categoria corectă (nu la pagina generală)
  const catId = detectCategoryFromText(q);

  // Automobilus & AutoEco — folosesc categoria detectată dacă există pagină dedicată pentru ea
  const automobilusUrl = buildAutomobilusUrl(car?.brand, catId);
  const autoEcoUrl = buildAutoEcoUrl(car?.brand, catId);

  // eMAG — căutare directă (fără tracking afiliat momentan, actualizăm când ai link-ul din Profitshare)
  const emagUrl = EMAG_LINK;

  // Preț orientativ — încerc întâi pe categoria detectată (mai multe șanse de match), apoi pe textul brut
  let produsGasit = null;
  if(typeof supabaseClient !== 'undefined') {
    try {
      if(catId) {
        const { data } = await supabaseClient.from('piese_automobilus').select('titlu,pret,brand')
          .eq('categorie_app', catId).order('pret', { ascending: true }).limit(1);
        if(data && data.length) produsGasit = data[0];
      }
      if(!produsGasit) {
        const { data } = await supabaseClient.from('piese_automobilus').select('titlu,pret,brand')
          .ilike('titlu', `%${q}%`).order('pret', { ascending: true }).limit(1);
        if(data && data.length) produsGasit = data[0];
      }
    } catch(e) { /* tabelul poate să nu existe încă / sincronizarea încă rulează — nu blocăm căutarea din cauza asta */ }
  }

  // AutoDoc scos temporar — nu avem confirmare că a fost aprobat pe Awin, nici structura reală de URL verificată
  showStoreChooser(q, produsGasit, [
    { nume: 'Automobilus.ro', icon: '🟢', url: automobilusUrl },
    { nume: 'AutoEco',        icon: '🟣', url: autoEcoUrl },
    { nume: 'eMAG',           icon: '🟠', url: emagUrl, sub: 'Nu doar piese — comanzi orice de pe eMAG' },
  ]);
}

// ═══ ALEGE MAGAZINUL (popup centrat, cu preț orientativ dacă îl avem) ═══
function showStoreChooser(query, produsGasit, magazine) {
  document.getElementById('compat-notice')?.remove();
  if(!document.getElementById('compat-notice-style')) {
    const style = document.createElement('style');
    style.id = 'compat-notice-style';
    style.textContent = `@keyframes compatFadeIn { from{opacity:0;transform:translate(-50%,-50%) scale(0.92)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }`;
    document.head.appendChild(style);
  }

  const el = document.createElement('div');
  el.id = 'compat-notice';
  el.style.cssText = `
    position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
    z-index:9999;background:var(--s1);border:1.5px solid var(--accent);
    border-radius:16px;padding:22px 24px;max-width:360px;width:calc(100% - 40px);
    box-shadow:0 20px 60px rgba(0,0,0,0.45);text-align:center;
    animation:compatFadeIn 0.22s ease;
  `;
  el.innerHTML = `
    <div style="font-size:28px;margin-bottom:6px">🔍</div>
    <div style="font-weight:800;font-size:14px;color:#fff;margin-bottom:4px">${query}</div>
    ${produsGasit
      ? `<div style="font-size:12px;color:var(--green);margin-bottom:10px">Preț orientativ: <strong>${Number(produsGasit.pret).toFixed(2)} lei</strong>${produsGasit.brand?` · ${produsGasit.brand}`:''}</div>`
      : `<div style="font-size:11px;color:#fff;opacity:0.85;margin-bottom:10px">Alege magazinul unde vrei să cauți</div>`
    }
    <div style="display:flex;flex-direction:column;gap:8px;margin:12px 0">
      ${magazine.map(m => `
        <a href="${m.url}" target="_blank" onclick="document.getElementById('compat-notice')?.remove()" style="text-decoration:none;display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--s2);border:1px solid var(--b2);border-radius:10px;color:#fff;font-weight:700;font-size:13px">
          <span style="font-size:16px">${m.icon}</span>
          <div style="flex:1">
            <div>${m.nume}</div>
            ${m.sub ? `<div style="font-size:9px;font-weight:400;opacity:0.75;margin-top:1px">${m.sub}</div>` : ''}
          </div>
        </a>`).join('')}
    </div>
    <div style="font-size:10px;color:#fff;opacity:0.85;line-height:1.5;margin-top:4px">
      ⚠️ Verifică pe site-ul ales compatibilitatea exactă (VIN/marcă/model) înainte să comanzi.<br>
      Dacă nu găsește piesa automat, selectează manual caracteristicile mașinii și piesa dorită, direct pe site-ul care se deschide.
    </div>
    <button onclick="document.getElementById('compat-notice')?.remove()" style="
      margin-top:12px;padding:6px 18px;background:transparent;border:1px solid var(--b2);
      border-radius:10px;color:var(--t3);font-weight:600;font-size:11px;cursor:pointer">
      Închide
    </button>
  `;
  document.body.appendChild(el);
}
