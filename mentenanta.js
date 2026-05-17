// ═══ MENTENANȚĂ ═══
const CHECKLIST_ITEMS = [
  { id: 'cl1', text: 'Presiune anvelope verificată', icon: '🔵' },
  { id: 'cl2', text: 'Ulei motor — nivel OK', icon: '🟡' },
  { id: 'cl3', text: 'Lichid răcire — nivel OK', icon: '🔵' },
  { id: 'cl4', text: 'Lichid frâne — nivel OK', icon: '🔴' },
  { id: 'cl5', text: 'Lichid parbriz — plin', icon: '🔵' },
  { id: 'cl6', text: 'Lumini față/spate — funcționale', icon: '💡' },
  { id: 'cl7', text: 'Documente auto — la bord (RCA, ITP)', icon: '📋' },
  { id: 'cl8', text: 'Extinctor — prezent și valabil', icon: '🔥' },
  { id: 'cl9', text: 'Trusă medicală — prezentă și valabilă', icon: '🏥' },
  { id: 'cl10', text: 'Telefon încărcat / încărcător la bord', icon: '📱' },
  { id: 'cl11', text: 'GPS / rută planificată', icon: '🗺️' },
  { id: 'cl12', text: 'Bagaje asigurate corect', icon: '🧳' },
];

function mntTab(tab) {
  ['istoric','reminder','combustibil','checklist'].forEach(t => {
    const panel = document.getElementById('mnt-panel-'+t);
    const btn = document.getElementById('mnt-tab-'+t);
    if(panel) panel.style.display = t === tab ? 'block' : 'none';
    if(btn) {
      btn.style.background = t === tab ? 'var(--accent)' : 'var(--s2)';
      btn.style.color = t === tab ? '#fff' : 'var(--t1)';
    }
  });
  if(tab === 'checklist') renderChecklist();
  if(tab === 'istoric') renderMntList();
  if(tab === 'combustibil') renderFuelList();
  if(tab === 'reminder') renderReminderList();
  populateMntSelects();
}

function populateMntSelects() {
  ['mnt-car-sel','rem-car-sel','fuel-car-sel','anv-car'].forEach(id => {
    const sel = document.getElementById(id);
    if(!sel) return;
    const cur = sel.value;
    sel.innerHTML = '<option value="">-- Selectează --</option>';
    cars.forEach(c => sel.innerHTML += `<option value="${c.id}">${c.plate} — ${c.brand} ${c.model}</option>`);
    if(cur) sel.value = cur;
  });
}

function addMnt() {
  const car = document.getElementById('mnt-car-sel').value;
  const tip = document.getElementById('mnt-tip').value;
  const data = document.getElementById('mnt-data').value;
  const km = document.getElementById('mnt-km').value;
  const cost = document.getElementById('mnt-cost').value;
  const obs = document.getElementById('mnt-obs').value;
  if(!car || !tip || !data) { showNotification('Completează','Selectează mașina, tipul și data.'); return; }
  const mntList = JSON.parse(localStorage.getItem('mnt_'+car)||'[]');
  mntList.unshift({ id: Date.now(), tip, data, km: km||null, cost: cost||null, obs: obs||'' });
  localStorage.setItem('mnt_'+car, JSON.stringify(mntList));
  document.getElementById('mnt-data').value = '';
  document.getElementById('mnt-km').value = '';
  document.getElementById('mnt-cost').value = '';
  document.getElementById('mnt-obs').value = '';
  renderMntList();
  showNotification('✅ Salvat!', tip + ' înregistrat cu succes.');
}

function renderMntList() {
  const sel = document.getElementById('mnt-car-sel');
  const carId = sel?.value;
  const el = document.getElementById('mnt-list');
  if(!el) return;
  if(!carId) { el.innerHTML = '<div class="empty"><div class="ei">🔧</div><p>Selectează o mașină pentru a vedea istoricul.</p></div>'; return; }
  const list = JSON.parse(localStorage.getItem('mnt_'+carId)||'[]');
  if(!list.length) { el.innerHTML = '<div class="empty"><div class="ei">🔧</div><p>Nicio intervenție înregistrată încă.</p></div>'; return; }
  let totalCost = 0;
  el.innerHTML = list.map(m => {
    totalCost += parseFloat(m.cost||0);
    return `<div style="padding:12px;background:var(--s2);border-radius:var(--rs);margin-bottom:8px;display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <div style="font-weight:700;font-size:13px">🔧 ${m.tip}</div>
        <div style="font-size:12px;color:var(--t2);margin-top:3px">📅 ${m.data}${m.km?' · 📍 '+Number(m.km).toLocaleString()+' km':''}</div>
        ${m.obs?`<div style="font-size:11px;color:var(--t3);margin-top:2px">${m.obs}</div>`:''}
      </div>
      <div style="text-align:right;flex-shrink:0;margin-left:12px">
        ${m.cost?`<div style="font-weight:700;color:var(--amber)">${Number(m.cost).toLocaleString()} RON</div>`:''}
        <button onclick="delMnt('${carId}',${m.id})" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:18px;margin-top:4px">🗑</button>
      </div>
    </div>`;
  }).join('');
  if(totalCost > 0) el.innerHTML += `<div style="padding:12px;background:linear-gradient(135deg,rgba(79,125,255,0.1),rgba(124,92,252,0.07));border-radius:var(--rs);text-align:center;font-weight:700">💰 Total cheltuieli service: ${totalCost.toLocaleString()} RON</div>`;
}

function delMnt(carId, id) {
  let list = JSON.parse(localStorage.getItem('mnt_'+carId)||'[]');
  list = list.filter(m => m.id !== id);
  localStorage.setItem('mnt_'+carId, JSON.stringify(list));
  renderMntList();
}

function addReminder() {
  const car = document.getElementById('rem-car-sel').value;
  const tip = document.getElementById('rem-tip').value;
  const km = document.getElementById('rem-km').value;
  const data = document.getElementById('rem-data').value;
  if(!car || !tip || (!km && !data)) { showNotification('Completează','Selectează mașina, tipul și km sau data.'); return; }
  const list = JSON.parse(localStorage.getItem('reminders_'+car)||'[]');
  list.push({ id: Date.now(), tip, km: km||null, data: data||null, activ: true });
  localStorage.setItem('reminders_'+car, JSON.stringify(list));
  document.getElementById('rem-km').value = '';
  document.getElementById('rem-data').value = '';
  renderReminderList();
  showNotification('🔔 Reminder setat!', tip);
}

function renderReminderList() {
  const sel = document.getElementById('rem-car-sel');
  const carId = sel?.value;
  const el = document.getElementById('rem-list');
  if(!el) return;
  if(!carId) { el.innerHTML = '<div class="empty"><div class="ei">⏰</div><p>Selectează o mașină.</p></div>'; return; }
  const list = JSON.parse(localStorage.getItem('reminders_'+carId)||'[]');
  if(!list.length) { el.innerHTML = '<div class="empty"><div class="ei">⏰</div><p>Niciun reminder activ.</p></div>'; return; }
  el.innerHTML = list.map(r => `
    <div style="padding:12px;background:var(--s2);border-radius:var(--rs);margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-weight:700;font-size:13px">🔔 ${r.tip}</div>
        <div style="font-size:12px;color:var(--t2);margin-top:3px">${r.km?'📍 La '+Number(r.km).toLocaleString()+' km':''}${r.data?' · 📅 '+r.data:''}</div>
      </div>
      <button onclick="delReminder('${carId}',${r.id})" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:18px">🗑</button>
    </div>`).join('');
}

function delReminder(carId, id) {
  let list = JSON.parse(localStorage.getItem('reminders_'+carId)||'[]');
  list = list.filter(r => r.id !== id);
  localStorage.setItem('reminders_'+carId, JSON.stringify(list));
  renderReminderList();
}

function addFuel() {
  const car = document.getElementById('fuel-car-sel').value;
  const data = document.getElementById('fuel-data').value;
  const km = document.getElementById('fuel-km').value;
  const litri = document.getElementById('fuel-litri').value;
  const pret = document.getElementById('fuel-pret').value;
  const statie = document.getElementById('fuel-statie').value;
  if(!car || !data || !km || !litri) { showNotification('Completează','Selectează mașina, data, km și litri.'); return; }
  const list = JSON.parse(localStorage.getItem('fuel_'+car)||'[]');
  list.unshift({ id: Date.now(), data, km: parseFloat(km), litri: parseFloat(litri), pret: parseFloat(pret||0), statie: statie||'', total: parseFloat(litri)*parseFloat(pret||0) });
  localStorage.setItem('fuel_'+car, JSON.stringify(list));
  document.getElementById('fuel-data').value = '';
  document.getElementById('fuel-km').value = '';
  document.getElementById('fuel-litri').value = '';
  document.getElementById('fuel-pret').value = '';
  document.getElementById('fuel-statie').value = '';
  renderFuelList();
  showNotification('⛽ Alimentare salvată!', litri + 'L la ' + pret + ' RON/L');
}

function renderFuelList() {
  const sel = document.getElementById('fuel-car-sel');
  const carId = sel?.value;
  const statsEl = document.getElementById('fuel-stats');
  const listEl = document.getElementById('fuel-list');
  if(!listEl) return;
  if(!carId) { listEl.innerHTML = '<div class="empty"><div class="ei">⛽</div><p>Selectează o mașină.</p></div>'; return; }
  const list = JSON.parse(localStorage.getItem('fuel_'+carId)||'[]');
  if(!list.length) { listEl.innerHTML = '<div class="empty"><div class="ei">⛽</div><p>Nicio alimentare înregistrată.</p></div>'; if(statsEl) statsEl.innerHTML = '<div class="empty"><div class="ei">📊</div><p>Adaugă cel puțin 2 alimentări.</p></div>'; return; }

  // Calculează consum mediu
  if(statsEl && list.length >= 2) {
    const sorted = [...list].sort((a,b) => a.km - b.km);
    const kmTotal = sorted[sorted.length-1].km - sorted[0].km;
    const litriTotal = list.reduce((s,f) => s+f.litri, 0);
    const costTotal = list.reduce((s,f) => s+f.total, 0);
    const consum = kmTotal > 0 ? (litriTotal / kmTotal * 100).toFixed(1) : '—';
    statsEl.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;text-align:center">
      <div style="padding:12px;background:var(--s2);border-radius:var(--rs)"><div style="font-size:22px;font-weight:700;color:var(--accent)">${consum}L</div><div style="font-size:11px;color:var(--t2)">Consum mediu/100km</div></div>
      <div style="padding:12px;background:var(--s2);border-radius:var(--rs)"><div style="font-size:22px;font-weight:700;color:var(--green)">${litriTotal.toFixed(0)}L</div><div style="font-size:11px;color:var(--t2)">Total alimentat</div></div>
      <div style="padding:12px;background:var(--s2);border-radius:var(--rs)"><div style="font-size:22px;font-weight:700;color:var(--amber)">${costTotal.toFixed(0)} RON</div><div style="font-size:11px;color:var(--t2)">Total cheltuit</div></div>
    </div>`;
  }

  listEl.innerHTML = list.map(f => `
    <div style="padding:12px;background:var(--s2);border-radius:var(--rs);margin-bottom:8px;display:flex;justify-content:space-between">
      <div>
        <div style="font-weight:700;font-size:13px">⛽ ${f.litri}L${f.statie?' — '+f.statie:''}</div>
        <div style="font-size:12px;color:var(--t2)">📅 ${f.data} · 📍 ${Number(f.km).toLocaleString()} km${f.pret?' · '+f.pret+' RON/L':''}</div>
      </div>
      <div style="text-align:right">
        ${f.total?`<div style="font-weight:700;color:var(--amber)">${f.total.toFixed(2)} RON</div>`:''}
        <button onclick="delFuel('${carId}',${f.id})" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:18px">🗑</button>
      </div>
    </div>`).join('');
}

function delFuel(carId, id) {
  let list = JSON.parse(localStorage.getItem('fuel_'+carId)||'[]');
  list = list.filter(f => f.id !== id);
  localStorage.setItem('fuel_'+carId, JSON.stringify(list));
  renderFuelList();
}

function renderChecklist() {
  const el = document.getElementById('checklist-items');
  const saved = JSON.parse(localStorage.getItem('checklist')||'{}');
  if(!el) return;
  el.innerHTML = CHECKLIST_ITEMS.map(item => `
    <label style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--s2);border-radius:var(--rs);cursor:pointer;${saved[item.id]?'opacity:0.6;text-decoration:line-through':''}">
      <input type="checkbox" ${saved[item.id]?'checked':''} onchange="toggleChecklist('${item.id}',this.checked)" style="width:20px;height:20px;accent-color:var(--green);flex-shrink:0">
      <span style="font-size:18px">${item.icon}</span>
      <span style="font-size:14px">${item.text}</span>
    </label>`).join('');
  updateChecklistStatus();
}

function toggleChecklist(id, checked) {
  const saved = JSON.parse(localStorage.getItem('checklist')||'{}');
  saved[id] = checked;
  localStorage.setItem('checklist', JSON.stringify(saved));
  renderChecklist();
}

function updateChecklistStatus() {
  const saved = JSON.parse(localStorage.getItem('checklist')||'{}');
  const done = Object.values(saved).filter(Boolean).length;
  const total = CHECKLIST_ITEMS.length;
  const el = document.getElementById('checklist-status');
  if(!el) return;
  if(done === total) el.innerHTML = '<span style="color:var(--green)">✅ Totul verificat — drum bun!</span>';
  else el.innerHTML = `<span style="color:var(--t2)">${done}/${total} verificate</span>`;
}

function resetChecklist() {
  localStorage.removeItem('checklist');
  renderChecklist();
  showNotification('🔄 Resetat!', 'Checklist-ul a fost resetat.');
}

function shareChecklist() {
  const saved = JSON.parse(localStorage.getItem('checklist')||'{}');
  const done = CHECKLIST_ITEMS.filter(i => saved[i.id]);
  const text = '✅ Checklist AutoAssist:\n' + CHECKLIST_ITEMS.map(i => (saved[i.id]?'✅':'❌') + ' ' + i.text).join('\n');
  if(navigator.share) navigator.share({ title: 'Checklist AutoAssist', text });
  else navigator.clipboard?.writeText(text).then(() => showNotification('📋 Copiat!', 'Checklist-ul a fost copiat.'));
}

// ═══ ANVELOPE ═══
function prefillAnvelope() {
  const carId = document.getElementById('anv-car')?.value;
  if(!carId) return;
  const car = cars.find(c => c.id == carId);
  if(car?.anv) {
    const parts = car.anv.split('/');
    if(parts[0]) document.getElementById('anv-lat').value = parts[0];
    if(parts[1]) document.getElementById('anv-prof').value = parts[1];
    if(parts[2]) document.getElementById('anv-diam').value = parts[2]?.replace('R','');
  }
  updateAnvLink();
}

function updateAnvLink() {
  const lat = document.getElementById('anv-lat')?.value;
  const prof = document.getElementById('anv-prof')?.value;
  const diam = document.getElementById('anv-diam')?.value;
  const sezon = document.getElementById('anv-sezon')?.value;
  const prev = document.getElementById('anv-preview');

  if(lat && prof && diam) {
    const dim = `${lat}/${prof} R${diam}`;
    if(prev) { prev.style.display='block'; prev.textContent = dim + (sezon==='vara'?' ☀️':sezon==='iarna'?' ❄️':' 🌤️'); }

    const sezonMap = { vara: 'summer', iarna: 'winter', all: 'allseason' };
    const anvLink = document.getElementById('anv-link-anvelope');
    const autodocLink = document.getElementById('anv-link-autodoc');
    const emagLink = document.getElementById('anv-link-emag');

    if(anvLink) anvLink.href = `https://www.anvelope.ro/anvelope-${sezon === 'iarna' ? 'iarna' : sezon === 'all' ? 'all-season' : 'vara'}/${lat}-${prof}-r${diam}/`;
    if(autodocLink) autodocLink.href = `https://ro.autodoc.ro/anvelope?width=${lat}&profile=${prof}&diameter=${diam}&season=${sezonMap[sezon]||'summer'}`;
    if(emagLink) emagLink.href = `https://www.emag.ro/anvelope/filter/latime-${lat},profil-${prof},diametru-janta-${diam}/c`;
  } else {
    if(prev) prev.style.display='none';
  }
}

// ═══ DASHBOARD CONFIGURABIL ═══
const DASH_ITEMS = [
  { id: 'asistent', icon: '🎙️', label: 'Asistent Vocal AI', desc: 'Acces rapid la asistentul vocal', gradient: 'linear-gradient(135deg,#4f7dff,#a259ff)', defaultOn: true },
  { id: 'mentenanta', icon: '🔧', label: 'Mentenanță & Service', desc: 'Istoric service și jurnal combustibil', gradient: 'linear-gradient(135deg,#00c864,#00a352)', defaultOn: true },
  { id: 'anvelope', icon: '🏎️', label: 'Anvelope', desc: 'Dimensiuni, calendar sezonier și comenzi', gradient: 'linear-gradient(135deg,#ff6b35,#f7931e)', defaultOn: true },
  { id: 'costuri', icon: '💸', label: 'Calculator Costuri', desc: 'Cât cheltuiești lunar cu mașina ta', gradient: 'linear-gradient(135deg,#ffb300,#ff8f00)', defaultOn: false },
  { id: 'electric', icon: '⚡', label: 'Mașini Electrice', desc: 'Stații EV și info hibrid', gradient: 'linear-gradient(135deg,#4fc3f7,#0288d1)', defaultOn: false },
  { id: 'verificare', icon: '🔍', label: 'Verificare Documente', desc: 'Verifică RCA, ITP, rovinietă orice mașină', gradient: 'linear-gradient(135deg,#7c5cfc,#a259ff)', defaultOn: false },
  { id: 'vanzare', icon: '💰', label: 'Vânzare Mașini', desc: 'Publică anunț și găsești cumpărători', gradient: 'linear-gradient(135deg,#ff4757,#ff6b81)', defaultOn: false },
  { id: 'agenti', icon: '🧠', label: 'Agenți AI', desc: 'Echipa ta de asistenți inteligenți', gradient: 'linear-gradient(135deg,#4f7dff,#7c5cfc)', defaultOn: false },
];

function getDashConfig() {
  const saved = JSON.parse(localStorage.getItem('dashConfig') || '{}');
  return DASH_ITEMS.map(item => ({
    ...item,
    enabled: saved.hasOwnProperty(item.id) ? saved[item.id] : item.defaultOn
  }));
}

function saveDashConfig() {
  const config = {};
  DASH_ITEMS.forEach(item => {
    const cb = document.getElementById('dashcb-' + item.id);
    if(cb) config[item.id] = cb.checked;
  });
  localStorage.setItem('dashConfig', JSON.stringify(config));
  renderDashCustomCards();
  showNotification('✅ Dashboard salvat!', 'Configurarea ta a fost aplicată.');
}

function resetDashConfig() {
  localStorage.removeItem('dashConfig');
  renderDashConfigList();
  renderDashCustomCards();
  showNotification('🔄 Resetat!', 'Dashboard-ul a revenit la configurarea implicită.');
}

function renderDashConfigList() {
  const el = document.getElementById('dash-config-list');
  if(!el) return;
  const config = getDashConfig();
  el.innerHTML = config.map(item => `
    <label style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--s2);border-radius:var(--rs);cursor:pointer">
      <input type="checkbox" id="dashcb-${item.id}" ${item.enabled?'checked':''} style="width:18px;height:18px;accent-color:var(--accent);flex-shrink:0">
      <div style="width:36px;height:36px;border-radius:10px;background:${item.gradient};display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${item.icon}</div>
      <div style="flex:1">
        <div style="font-weight:700;font-size:13px">${item.label}</div>
        <div style="font-size:11px;color:var(--t2)">${item.desc}</div>
      </div>
    </label>`).join('');
}

function renderDashCustomCards() {
  const el = document.getElementById('dash-custom-cards');
  if(!el) return;
  const config = getDashConfig().filter(i => i.enabled);
  if(!config.length) { el.innerHTML = ''; return; }
  el.innerHTML = config.map(item => `
    <div class="card" style="margin-bottom:10px;cursor:pointer;background:linear-gradient(135deg,rgba(79,125,255,0.05),rgba(124,92,252,0.05));border-color:rgba(124,92,252,0.15)" onclick="goTo('${item.id}')">
      <div style="display:flex;align-items:center;gap:14px;padding:2px 0">
        <div style="width:48px;height:48px;background:${item.gradient};border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;box-shadow:0 4px 14px rgba(0,0,0,0.25)">${item.icon}</div>
        <div style="flex:1;min-width:0">
          <div style="font-family:'Bebas Neue';font-size:16px;letter-spacing:1.5px;color:var(--t1)">${item.label}</div>
          <div style="font-size:12px;color:var(--t2);margin-top:2px">${item.desc}</div>
        </div>
        <span class="btn btn-sm" style="background:${item.gradient};color:#fff;font-weight:700;flex-shrink:0">→</span>
      </div>
    </div>`).join('');
}

function calcCosturi() {
  const km = parseFloat(document.getElementById('cost-km')?.value) || 0;
  const consum = parseFloat(document.getElementById('cost-consum')?.value) || 0;
  const pretComb = parseFloat(document.getElementById('cost-pret-comb')?.value) || 0;
  const rca = parseFloat(document.getElementById('cost-rca')?.value) || 0;
  const casco = parseFloat(document.getElementById('cost-casco')?.value) || 0;
  const itp = parseFloat(document.getElementById('cost-itp')?.value) || 0;
  const rov = parseFloat(document.getElementById('cost-rov')?.value) || 0;
  const serv = parseFloat(document.getElementById('cost-serv')?.value) || 0;
  const anv = parseFloat(document.getElementById('cost-anv')?.value) || 0;
  const parc = parseFloat(document.getElementById('cost-parc')?.value) || 0;
  const spal = parseFloat(document.getElementById('cost-spal')?.value) || 0;

  const combustibil = (km * consum / 100) * pretComb;
  const parcare = parc * 12;
  const spalatorie = spal * 12;
  const total = combustibil + rca + casco + itp + rov + serv + anv + parcare + spalatorie;
  const totalLuna = total / 12;
  const perKm = km > 0 ? total / km : 0;

  const el = document.getElementById('cost-output');
  if(!el || total === 0) return;

  const items = [
    {label:'⛽ Combustibil', val:combustibil, pct:total>0?combustibil/total*100:0},
    {label:'🛡️ RCA + CASCO', val:rca+casco, pct:total>0?(rca+casco)/total*100:0},
    {label:'📋 ITP + Rovinietă', val:itp+rov, pct:total>0?(itp+rov)/total*100:0},
    {label:'🔧 Service + Anvelope', val:serv+anv, pct:total>0?(serv+anv)/total*100:0},
    {label:'🅿️ Parcare + Spălătorie', val:parcare+spalatorie, pct:total>0?(parcare+spalatorie)/total*100:0},
  ];

  el.innerHTML = `
    <div style="text-align:center;margin-bottom:20px">
      <div style="font-size:11px;color:var(--t3);font-weight:700;text-transform:uppercase;letter-spacing:1px">Total anual</div>
      <div style="font-family:'Bebas Neue';font-size:48px;letter-spacing:2px;color:var(--gold)">${Math.round(total).toLocaleString()} RON</div>
      <div style="display:flex;justify-content:center;gap:24px;margin-top:8px">
        <div style="text-align:center"><div style="font-size:11px;color:var(--t3)">Pe lună</div><div style="font-size:18px;font-weight:800;color:var(--accent)">${Math.round(totalLuna).toLocaleString()} RON</div></div>
        <div style="text-align:center"><div style="font-size:11px;color:var(--t3)">Per km</div><div style="font-size:18px;font-weight:800;color:var(--accent)">${perKm.toFixed(2)} RON</div></div>
      </div>
    </div>
    ${items.filter(i=>i.val>0).map(i=>`
      <div style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
          <span style="font-weight:600">${i.label}</span>
          <span style="font-weight:700">${Math.round(i.val).toLocaleString()} RON (${Math.round(i.pct)}%)</span>
        </div>
        <div style="background:var(--s3);border-radius:4px;height:6px;overflow:hidden">
          <div style="width:${i.pct}%;height:100%;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:4px;transition:width 0.5s"></div>
        </div>
      </div>
    `).join('')}
  `;
}

function populateCostCars() {
  const sel = document.getElementById('cost-car');
  if(!sel) return;
  sel.innerHTML = '<option value="">-- Selectează din garaj --</option>';
  cars.forEach(c => sel.innerHTML += `<option value="${c.id}">${c.plate} — ${c.brand} ${c.model}</option>`);
}

