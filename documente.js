// ═══ CALCULATOR COSTURI ═══
function prefillCostCar() {
  const sel = document.getElementById('cost-car');
  const car = cars.find(c => c.id == sel.value);
  if(!car) return;
}

// ═══ DOCUMENTE PERSONALE ═══
function docTab(tab) {
  ['buletin','permis','talon','altele'].forEach(t => {
    const panel = document.getElementById('docpanel-'+t);
    const btn = document.getElementById('doctab-'+t);
    if(panel) panel.style.display = t === tab ? 'block' : 'none';
    if(btn) {
      btn.style.background = t === tab ? 'var(--accent)' : 'var(--s2)';
      btn.style.color = t === tab ? '#fff' : 'var(--t1)';
    }
  });
}

function processDoc(type, input) {
  const file = input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    const dataUrl = e.target.result;
    // Arată preview
    const img = document.getElementById(type+'-img');
    const prev = document.getElementById(type+'-preview');
    if(img && prev) { img.src = dataUrl; prev.style.display = 'block'; }
    // Salvează poza în localStorage
    try { localStorage.setItem('doc_img_'+type, await _docResize(dataUrl,1800)); } catch(e) {}
    // Încearcă extragere date cu Claude Vision
    showNotification('🔍 Procesare...', 'Se extrag datele din document cu AI...');
    await extractDocData(type, dataUrl);
    try{ loadDocData(type); renderDocCards(); }catch(e){}
  };
  reader.readAsDataURL(file);
}

function _docNorm(t){ return String(t||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim(); }
function _docDate(v,last){
  if(!v) return '';
  v=String(v).trim();
  if(/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  var m=v.match(/(\d{1,2})\s*[.\/-]\s*(\d{1,2})\s*[.\/-]\s*(\d{4}|\d{2})/g);
  if(!m) return '';
  var p=(last?m[m.length-1]:m[0]).match(/(\d{1,2})\s*[.\/-]\s*(\d{1,2})\s*[.\/-]\s*(\d{4}|\d{2})/);
  var y=p[3].length===2?'20'+p[3]:p[3];
  return y+'-'+('0'+p[2]).slice(-2)+'-'+('0'+p[1]).slice(-2);
}
var _DOC_JUDETE={AB:'Alba',AR:'Arad',AG:'Argeș',BC:'Bacău',BH:'Bihor',BN:'Bistrița-Năsăud',BT:'Botoșani',BV:'Brașov',BR:'Brăila',B:'București',BZ:'Buzău',CS:'Caraș-Severin',CL:'Călărași',CJ:'Cluj',CT:'Constanța',CV:'Covasna',DB:'Dâmbovița',DJ:'Dolj',GL:'Galați',GR:'Giurgiu',GJ:'Gorj',HR:'Harghita',HD:'Hunedoara',IL:'Ialomița',IS:'Iași',IF:'Ilfov',MM:'Maramureș',MH:'Mehedinți',MS:'Mureș',NT:'Neamț',OT:'Olt',PH:'Prahova',SM:'Satu Mare',SJ:'Sălaj',SB:'Sibiu',SV:'Suceava',TR:'Teleorman',TM:'Timiș',TL:'Tulcea',VS:'Vaslui',VL:'Vâlcea',VN:'Vrancea'};
function _docSelect(el,val){
  if(!el||!val) return false;
  var raw=String(val).trim(), up=raw.toUpperCase().replace(/[^A-Z]/g,'');
  var want=_DOC_JUDETE[up]?_DOC_JUDETE[up]:raw, n=_docNorm(want);
  if(!n) return false;
  for(var i=0;i<el.options.length;i++){ var o=el.options[i], on=_docNorm(o.value||o.text); if(on===n){ el.value=o.value||o.text; return true; } }
  for(var j=0;j<el.options.length;j++){ var o2=el.options[j], on2=_docNorm(o2.value||o2.text); if(on2 && (on2.indexOf(n)===0||n.indexOf(on2)===0)){ el.value=o2.value||o2.text; return true; } }
  return false;
}
// Micșorează poza (max 1600px, JPEG) ca să nu depășească limita AI și să încapă în browser; PDF-urile trec neschimbate
function _docResize(dataUrl,maxPx){
  return new Promise(function(res){
    if(!/^data:image\//.test(dataUrl)) return res(dataUrl);
    var im=new Image();
    im.onload=function(){
      try{
        var w=im.naturalWidth,h=im.naturalHeight,k=Math.min(1,maxPx/Math.max(w,h));
        var c=document.createElement('canvas'); c.width=Math.round(w*k); c.height=Math.round(h*k);
        c.getContext('2d').drawImage(im,0,0,c.width,c.height);
        res(c.toDataURL('image/jpeg',0.85));
      }catch(e){ res(dataUrl); }
    };
    im.onerror=function(){ res(dataUrl); };
    im.src=dataUrl;
  });
}

async function extractDocData(type, imageDataUrl) {
  const small = await _docResize(imageDataUrl,1600);
  const base64 = small.split(',')[1];
  const mimeType = small.split(';')[0].split(':')[1];
  const ctx = 'Utilizatorul își încarcă propriul document în aplicația AutoAssist, ca formularele lui să fie completate automat. Transcrie exact textul tipărit pe document. Dacă un câmp nu se vede clar, pune "" pentru el. ';
  const prompts = {
    buletin: ctx+'Document: carte de identitate românească. Returnează JSON: { "nume": "NUME Prenume (ex: Popescu Ion)", "cnp": "13 cifre", "dob": "YYYY-MM-DD (din CNP sau din document)", "serie": "seria și numărul, ex: DD 939887", "adresa": "domiciliul complet", "judet": "județul domiciliului (cod sau nume)", "exp": "data de expirare YYYY-MM-DD (ultima dată din câmpul Valabilitate)" }. Răspunde DOAR cu JSON valid.',
    permis: ctx+'Document: permis de conducere românesc. Returnează JSON: { "nr": "numărul permisului (câmpul 5)", "data": "data eliberării YYYY-MM-DD (câmpul 4a)", "exp": "data expirării YYYY-MM-DD (câmpul 4b)", "categorii": "categoriile, ex: B", "elib": "autoritatea emitentă (câmpul 4c)" }. Răspunde DOAR cu JSON valid.',
    talon: ctx+'Document: certificat de înmatriculare (talon) românesc. Returnează JSON: { "nr": "număr de înmatriculare (A)", "vin": "serie șasiu (E)", "marca": "(D.1)", "model": "(D.3)", "an": "anul fabricației", "cmc": "capacitate cilindrică (P.1)", "kw": "putere kW (P.2)", "combustibil": "Benzină / Motorină / Hibrid / Electric / GPL", "culoare": "(R)" }. Răspunde DOAR cu JSON valid.'
  };
  if(!prompts[type]) return;
  const token = await aaAuthHeader();
  async function ask(text){
    const res = await fetch('https://zspcknjuqdjfxtqrqhhm.supabase.co/functions/v1/asistent', {
      method:'POST', headers:{'Content-Type':'application/json','Authorization':token},
      body: JSON.stringify({ model:'claude-sonnet-4-5', max_tokens:700,
        system:'Ești un sistem OCR pentru documente românești. Returnezi DOAR JSON valid, fără explicații.',
        messages:[{role:'user',content:[{type:'image',source:{type:'base64',media_type:mimeType,data:base64}},{type:'text',text:text}]}] })
    });
    const data = await res.json();
    if(data.error) throw new Error(typeof data.error==='string'?data.error:(data.error.message||'eroare server'));
    let reply = data.reply || '';
    if(!reply && Array.isArray(data.content)) reply = data.content.map(b=>b.type==='text'?b.text:'').join('');
    return reply;
  }
  let lastReply='', lastErr='';
  for(let attempt=0; attempt<2; attempt++){
    try{
      lastReply = await ask(attempt===0 ? prompts[type] : prompts[type]+' Este o transcriere de text pentru completarea unui formular, nu identificarea persoanei. Completează tot ce poți citi.');
      const jm = lastReply.replace(/```json|```/g,'').match(/\{[\s\S]*\}/);
      if(!jm){ lastErr='răspuns fără date'; continue; }
      const n = fillDocFields(type, JSON.parse(jm[0]));
      if(n>0){
        try{ _docSaveSilent(type); }catch(e){}
        showNotification('✅ Date extrase!', 'Am completat '+n+' câmpuri. Verifică și corectează dacă e necesar.');
        try{ renderDocCards(); }catch(e){}
        return;
      }
      lastErr='nu am găsit date citibile';
    }catch(e){ lastErr=String(e.message||e); if(/autentific|limit/i.test(lastErr)) break; }
  }
  console.warn('OCR doc eșuat:', lastErr, lastReply.slice(0,200));
  showNotification('💡 Completare manuală', 'Nu am putut citi documentul ('+lastErr+'). Încearcă o poză mai clară, cu lumină bună, sau completează manual.');
}

function fillDocFields(type, data) {
  const ids = {
    buletin: { 'bul-nume':'nume','bul-cnp':'cnp','bul-serie':'serie','bul-adresa':'adresa' },
    permis:  { 'perm-nr':'nr','perm-cat':'categorii','perm-elib':'elib' },
    talon:   { 'tal-nr':'nr','tal-vin':'vin','tal-marca':'marca','tal-model':'model','tal-an':'an','tal-cmc':'cmc','tal-kw':'kw','tal-culoare':'culoare' }
  }[type] || {};
  const dates = {
    buletin: { 'bul-dob':['dob',false], 'bul-exp':['exp',true] },
    permis:  { 'perm-data':['data',false], 'perm-exp':['exp',true] },
    talon:   {}
  }[type] || {};
  let n=0;
  Object.entries(ids).forEach(([id,k])=>{ const el=document.getElementById(id); let v=data[k]; if(el && v!==undefined && v!==null && String(v).trim()){ el.value=String(v).trim(); n++; } });
  Object.entries(dates).forEach(([id,[k,last]])=>{ const el=document.getElementById(id); const v=_docDate(data[k],last); if(el && v){ el.value=v; n++; } });
  if(type==='buletin' && data.judet){ if(_docSelect(document.getElementById('bul-judet'),data.judet)) n++; }
  if(type==='talon' && data.combustibil){
    const el=document.getElementById('tal-comb'), c=_docNorm(data.combustibil);
    if(el){ const map=c.indexOf('motorin')>=0||c.indexOf('diesel')>=0?'motorin':c.indexOf('benzin')>=0||c.indexOf('petrol')>=0?'benzin':c.indexOf('hibrid')>=0||c.indexOf('hybrid')>=0?'hibrid':c.indexOf('electric')>=0?'electric':c.indexOf('gpl')>=0||c.indexOf('lpg')>=0?'gpl':c;
      for(let o of el.options){ if(_docNorm(o.value||o.text).indexOf(map)===0){ el.value=o.value||o.text; n++; break; } } }
  }
  return n;
}

function saveDocDate(type) {
  const fields = {
    buletin: ['bul-nume','bul-cnp','bul-dob','bul-serie','bul-adresa','bul-judet','bul-exp'],
    permis:  ['perm-nr','perm-data','perm-exp','perm-cat','perm-elib'],
    talon:   ['tal-nr','tal-vin','tal-marca','tal-model','tal-an','tal-cmc','tal-kw','tal-comb','tal-culoare'],
  };
  const data = {};
  (fields[type]||[]).forEach(id => {
    const el = document.getElementById(id);
    if(el) data[id] = el.value;
  });
  localStorage.setItem('docdate_'+type, JSON.stringify(data));
  const status = document.getElementById(type.substring(0,3)+'-status') || document.getElementById('tal-status') || document.getElementById('perm-status') || document.getElementById('bul-status');
  if(status) {
    status.style.display = 'block';
    status.style.background = 'rgba(0,232,154,0.1)';
    status.style.color = 'var(--green)';
    status.textContent = '✅ Date salvate cu succes!';
    setTimeout(() => status.style.display='none', 3000);
  }
  showNotification('✅ Salvat!', 'Datele din '+type+' sunt stocate și vor fi folosite la completarea automată.');
}

function loadDocData(type) {
  const saved = JSON.parse(localStorage.getItem('docdate_'+type)||'{}');
  Object.entries(saved).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if(el && val) el.value = val;
  });
  const img = localStorage.getItem('doc_img_'+type);
  if(img) {
    const imgEl = document.getElementById(type+'-img');
    const prev = document.getElementById(type+'-preview');
    if(imgEl && prev) {
      imgEl.src = img;
      prev.style.display = 'block';
      // Adaug butoane Vezi + Descarcă dacă nu există deja
      if(!document.getElementById('doc-actions-'+type)) {
        const actEl = document.createElement('div');
        actEl.id = 'doc-actions-'+type;
        actEl.style.cssText = 'display:flex;gap:8px;margin-top:8px;justify-content:center;flex-wrap:wrap';
        actEl.innerHTML = `
          <button onclick="viewDocImg('${type}')" style="background:rgba(79,125,255,0.1);border:1px solid rgba(79,125,255,0.3);color:var(--accent);border-radius:8px;padding:7px 16px;cursor:pointer;font-size:12px;font-weight:700">👁️ Vizualizează</button>
          <button onclick="downloadDocImg('${type}')" style="background:rgba(0,232,154,0.1);border:1px solid rgba(0,232,154,0.3);color:var(--green);border-radius:8px;padding:7px 16px;cursor:pointer;font-size:12px;font-weight:700">⬇️ Descarcă</button>
          <button onclick="document.getElementById('${type}-file').click()" style="background:rgba(240,180,41,0.1);border:1px solid rgba(240,180,41,0.35);color:var(--gold);border-radius:8px;padding:7px 16px;cursor:pointer;font-size:12px;font-weight:700">🔄 Înlocuiește</button>
          <button onclick="docPhotoDelete('${type}')" style="background:rgba(255,59,59,0.1);border:1px solid rgba(255,59,59,0.3);color:var(--red);border-radius:8px;padding:7px 16px;cursor:pointer;font-size:12px;font-weight:700">🗑️ Șterge</button>`;
        prev.appendChild(actEl);
      }
    }
  }
}

function viewDocImg(type) {
  const img = localStorage.getItem('doc_img_'+type);
  if(!img) return;
  const names = {buletin:'Buletin/CI', permis:'Permis Auto', talon:'Talon Mașină'};
  document.getElementById('doc-viewer-modal')?.remove();
  const isPdf = img.startsWith('data:application/pdf');
  document.body.insertAdjacentHTML('beforeend', `
    <div id="doc-viewer-modal" style="position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px" onclick="if(event.target===this)this.remove()">
      <div style="background:var(--s1);border:1px solid var(--b2);border-radius:16px;max-width:700px;width:100%;max-height:90vh;display:flex;flex-direction:column;overflow:hidden">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:16px;border-bottom:1px solid var(--b2)">
          <div style="font-weight:700">📄 ${names[type]||type}</div>
          <div style="display:flex;gap:8px">
            <button onclick="downloadDocImg('${type}')" style="background:rgba(0,232,154,0.1);border:1px solid rgba(0,232,154,0.3);color:var(--green);border-radius:8px;padding:6px 14px;cursor:pointer;font-size:12px;font-weight:700">⬇️ Descarcă</button>
            <button onclick="document.getElementById('doc-viewer-modal').remove()" style="background:none;border:none;color:var(--t3);cursor:pointer;font-size:22px">×</button>
          </div>
        </div>
        <div style="flex:1;overflow:auto;padding:16px;display:flex;align-items:center;justify-content:center;background:#111">
          ${isPdf
            ? `<iframe src="${img}" style="width:100%;height:70vh;border:none;border-radius:8px"></iframe>`
            : `<img src="${img}" style="max-width:100%;max-height:70vh;object-fit:contain;border-radius:8px">`}
        </div>
      </div>
    </div>`);
}

function downloadDocImg(type) {
  const img = localStorage.getItem('doc_img_'+type);
  if(!img) return;
  const names = {buletin:'buletin', permis:'permis', talon:'talon'};
  const ext = img.startsWith('data:application/pdf') ? '.pdf' : '.jpg';
  const a = document.createElement('a');
  a.href = img;
  a.download = (names[type]||type) + ext;
  a.click();
}

function deleteDocImg(type) {
  if(!confirm('Ștergi documentul scanat?')) return;
  localStorage.removeItem('doc_img_'+type);
  const imgEl = document.getElementById(type+'-img');
  const prev = document.getElementById(type+'-preview');
  if(imgEl) imgEl.src = '';
  if(prev) prev.style.display = 'none';
  document.getElementById('doc-actions-'+type)?.remove();
}

function addCarFromTalon() {
  const nr = document.getElementById('tal-nr')?.value?.trim().toUpperCase().replace(/\s/g,'');
  const vin = document.getElementById('tal-vin')?.value?.trim();
  const marca = document.getElementById('tal-marca')?.value?.trim();
  const model = document.getElementById('tal-model')?.value?.trim();
  const an = document.getElementById('tal-an')?.value?.trim();
  if(!nr) { showNotification('⚠️','Completează numărul de înmatriculare.'); return; }
  // Pre-completează formularul de adăugare mașină
  openM('add-car');
  setTimeout(() => {
    const plEl = document.getElementById('m-pl');
    const brEl = document.getElementById('m-br');
    const moEl = document.getElementById('m-mo');
    const yrEl = document.getElementById('m-yr');
    if(plEl) { plEl.value = nr; autoFill('m-pl','m-inf'); }
    if(brEl && marca) brEl.value = marca;
    if(moEl && model) moEl.value = model;
    if(yrEl && an) yrEl.value = an;
  }, 300);
  showNotification('🚗 Date completate!', 'Verifică și adaugă mașina în garaj.');
}

// Funcție globală pentru auto-completare din documente personale
// Returnează DOAR datele permise pentru contextul specificat
function getDatePersonale(context) {
  const buletin = JSON.parse(localStorage.getItem('docdate_buletin')||'{}');
  const permis = JSON.parse(localStorage.getItem('docdate_permis')||'{}');
  const talon = JSON.parse(localStorage.getItem('docdate_talon')||'{}');

  // RCA — date proprietar cerute legal de asigurător
  if(context === 'rca') return {
    nume: buletin['bul-nume'] || '',
    adresa: buletin['bul-adresa'] || '',
    judet: buletin['bul-judet'] || '',
    cnp: buletin['bul-cnp'] || '',
    permisNr: permis['perm-nr'] || '',
  };

  // ITP — doar nume și contact pentru programare
  if(context === 'itp') return {
    nume: buletin['bul-nume'] || '',
    judet: buletin['bul-judet'] || '',
  };

  // Profil — nume și județ
  if(context === 'profil') return {
    nume: buletin['bul-nume'] || '',
    judet: buletin['bul-judet'] || '',
  };

  // Talon — date vehicul (nu date personale)
  if(context === 'talon') return {
    nr: talon['tal-nr'] || '',
    vin: talon['tal-vin'] || '',
    marca: talon['tal-marca'] || '',
    model: talon['tal-model'] || '',
    an: talon['tal-an'] || '',
  };

  // Default — nimic (protecție implicită)
  return {};
}

function addAltDoc(input) {
  const files = Array.from(input.files);
  if(!files.length) return;
  const tip = document.getElementById('altdoc-tip')?.value || 'Document';
  const exp = document.getElementById('altdoc-exp')?.value || '';
  const desc = document.getElementById('altdoc-desc')?.value || '';

  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      const list = JSON.parse(localStorage.getItem('altdocs')||'[]');
      list.unshift({
        id: Date.now() + Math.random(),
        tip, exp, desc,
        name: file.name,
        type: file.type,
        data: e.target.result  // base64 complet
      });
      localStorage.setItem('altdocs', JSON.stringify(list));
      renderAltDocs();
      showNotification('📁 Document adăugat!', file.name);
    };
    reader.readAsDataURL(file);
  });
  input.value = '';
}

function renderAltDocs() {
  const el = document.getElementById('altdoc-list');
  if(!el) return;
  const list = JSON.parse(localStorage.getItem('altdocs')||'[]');
  if(!list.length) { el.innerHTML = '<div class="empty"><div class="ei">📁</div><p>Niciun document adăugat.</p></div>'; return; }
  el.innerHTML = list.map(d => {
    const isPdf = d.type==='application/pdf' || d.name?.endsWith('.pdf');
    const isImg = d.type?.startsWith('image/');
    const icon = isPdf ? '📋' : isImg ? '🖼️' : '📄';
    const expColor = d.exp ? (new Date(d.exp) < new Date() ? 'var(--red)' : new Date(d.exp) < new Date(Date.now()+30*864e5) ? 'var(--amber)' : 'var(--green)') : 'var(--t3)';
    return `<div style="background:var(--s2);border:1px solid var(--b2);border-radius:12px;padding:14px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:start;gap:10px">
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px">${icon} ${d.tip}</div>
          <div style="font-size:11px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${d.name}</div>
          ${d.exp?`<div style="font-size:11px;color:${expColor};margin-top:3px">📅 Valabil până: ${d.exp}</div>`:''}
          ${d.desc?`<div style="font-size:11px;color:var(--t3);margin-top:2px">${d.desc}</div>`:''}
        </div>
        <div style="display:flex;gap:6px;flex-shrink:0">
          ${d.data?`<button onclick="viewAltDoc(${JSON.stringify(d.id)})" style="background:rgba(79,125,255,0.1);border:1px solid rgba(79,125,255,0.3);color:var(--accent);border-radius:8px;padding:6px 10px;cursor:pointer;font-size:12px;font-weight:700">👁️ Vezi</button>
          <button onclick="downloadAltDoc(${JSON.stringify(d.id)})" style="background:rgba(0,232,154,0.1);border:1px solid rgba(0,232,154,0.3);color:var(--green);border-radius:8px;padding:6px 10px;cursor:pointer;font-size:12px;font-weight:700">⬇️</button>`:''}
          <button onclick="delAltDoc(${JSON.stringify(d.id)})" style="background:rgba(255,59,59,0.1);border:1px solid rgba(255,59,59,0.3);color:var(--red);border-radius:8px;padding:6px 10px;cursor:pointer;font-size:12px;font-weight:700">🗑</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function viewAltDoc(id) {
  const list = JSON.parse(localStorage.getItem('altdocs')||'[]');
  const d = list.find(x=>x.id==id);
  if(!d||!d.data) return;
  const isPdf = d.type==='application/pdf'||d.name?.endsWith('.pdf');
  const isImg = d.type?.startsWith('image/');
  document.getElementById('doc-viewer-modal')?.remove();
  const html = `<div id="doc-viewer-modal" style="position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px" onclick="if(event.target===this)this.remove()">
    <div style="background:var(--s1);border:1px solid var(--b2);border-radius:16px;max-width:700px;width:100%;max-height:90vh;display:flex;flex-direction:column;overflow:hidden">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:16px;border-bottom:1px solid var(--b2)">
        <div style="font-weight:700;font-size:15px">📄 ${d.tip} — ${d.name}</div>
        <div style="display:flex;gap:8px">
          <button onclick="downloadAltDoc('${d.id}')" style="background:rgba(0,232,154,0.1);border:1px solid rgba(0,232,154,0.3);color:var(--green);border-radius:8px;padding:6px 14px;cursor:pointer;font-size:12px;font-weight:700">⬇️ Descarcă</button>
          <button onclick="document.getElementById('doc-viewer-modal').remove()" style="background:none;border:none;color:var(--t3);cursor:pointer;font-size:22px">×</button>
        </div>
      </div>
      <div style="flex:1;overflow:auto;padding:16px;display:flex;align-items:center;justify-content:center">
        ${isPdf
          ? `<iframe src="${d.data}" style="width:100%;height:70vh;border:none;border-radius:8px"></iframe>`
          : isImg
            ? `<img src="${d.data}" style="max-width:100%;max-height:70vh;object-fit:contain;border-radius:8px">`
            : `<div style="text-align:center;color:var(--t3)"><div style="font-size:48px;margin-bottom:12px">📄</div><div>Previzualizare indisponibilă pentru acest tip de fișier.</div><button onclick="downloadAltDoc('${d.id}')" class="btn btn-primary btn-sm" style="margin-top:12px">⬇️ Descarcă fișierul</button></div>`
        }
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

function downloadAltDoc(id) {
  const list = JSON.parse(localStorage.getItem('altdocs')||'[]');
  const d = list.find(x=>x.id==id);
  if(!d||!d.data) return;
  const a = document.createElement('a');
  a.href = d.data;
  a.download = d.name || 'document';
  a.click();
}

function delAltDoc(id) {
  if(!confirm('Ștergi documentul?')) return;
  let list = JSON.parse(localStorage.getItem('altdocs')||'[]');
  list = list.filter(d => d.id != id);
  localStorage.setItem('altdocs', JSON.stringify(list));
  renderAltDocs();
}

// ═══ GOOGLE TTS — Voce română naturală ═══
let _ttsAudio = null;

function stopVoice() {
  if(_ttsAudio) { _ttsAudio.pause(); _ttsAudio.currentTime = 0; _ttsAudio = null; }
  window.speechSynthesis && window.speechSynthesis.cancel();
}

async function speakRomanian(text, gender = 'female', rate = 1.0, pitch = 0) {
  stopVoice();

  try {
    const res = await fetch('https://zspcknjuqdjfxtqrqhhm.supabase.co/functions/v1/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice: gender, rate, pitch })
    });

    if(res.ok) {
      const data = await res.json();
      console.log('TTS response:', data.error || 'OK', 'has audio:', !!data.audio);
      if(data.audio) {
        const audioSrc = 'data:audio/mp3;base64,' + data.audio;
        _ttsAudio = new Audio(audioSrc);
        _ttsAudio.play();
        return;
      }
      if(data.error) console.log('TTS error:', data.error);
    }
  } catch(e) {
    console.log('TTS fetch error:', e.message);
  }

  // Fallback browser TTS
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'ro-RO';
  utt.rate = rate;
  const voices = window.speechSynthesis.getVoices();
  const roVoice = voices.find(v => v.lang === 'ro-RO' || v.lang.startsWith('ro'));
  if(roVoice) utt.voice = roVoice;
  window.speechSynthesis.speak(utt);
}

// ═══ SETĂRI VOCE ═══
function loadVoices() {
  // Restaurează setările salvate
  const rate = localStorage.getItem('voice-rate') || '1.0';
  const pitch = localStorage.getItem('voice-pitch') || '1.0';
  const gender = localStorage.getItem('voice-gender') || 'female';
  const rateEl = document.getElementById('voice-rate');
  const pitchEl = document.getElementById('voice-pitch');
  if(rateEl) { rateEl.value = rate; const rv = document.getElementById('rate-val'); if(rv) rv.textContent = parseFloat(rate).toFixed(1); }
  if(pitchEl) { pitchEl.value = pitch; const pv = document.getElementById('pitch-val'); if(pv) pv.textContent = parseFloat(pitch).toFixed(1); }
  setVoiceGender(gender, false);
}

function setVoiceGender(gender, save = true) {
  if(save) localStorage.setItem('voice-gender', gender);
  const fb = document.getElementById('voice-btn-female');
  const mb = document.getElementById('voice-btn-male');
  if(fb && mb) {
    if(gender === 'female') {
      fb.style.background = 'var(--accent)'; fb.style.color = '#fff';
      mb.style.background = 'var(--s2)'; mb.style.color = 'var(--t1)';
    } else {
      mb.style.background = 'var(--accent)'; mb.style.color = '#fff';
      fb.style.background = 'var(--s2)'; fb.style.color = 'var(--t1)';
    }
  }
}

function setVoice() {}

function testVoice() {
  const rate = parseFloat(document.getElementById("voice-rate")?.value || "1.0");
  const pitch = parseFloat(document.getElementById("voice-pitch")?.value || "0");
  const gender = localStorage.getItem("voice-gender") || "female";
  localStorage.setItem("voice-rate", rate);
  localStorage.setItem("voice-pitch", pitch);
  const textF = "Bună ziua! Sunt Alina, asistenta ta vocală AutoAssist. Cum te pot ajuta cu mașina ta?";
  const textM = "Bună ziua! Sunt Emil, asistentul tău vocal AutoAssist. Cum te pot ajuta cu mașina ta?";
  speakRomanian(gender === "female" ? textF : textM, gender, rate, pitch);
}

function resetVoiceSettings() {
  localStorage.removeItem('voice-gender');
  localStorage.removeItem('voice-rate');
  localStorage.removeItem('voice-pitch');
  localStorage.removeItem('voice-name');
  loadVoices();
  showNotification('🔄 Resetat!', 'Setările vocii au revenit la implicit.');
}

if(window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = loadVoices;
  setTimeout(loadVoices, 500);
}


// ═══ EXPORT PDF PREMIUM ═══
function exportDocarPDF() {
  if(!isPremium()) {
    showUpgradeModal('export_pdf');
    return;
  }
  if(!cars || cars.length === 0) {
    alert('Nu ai mașini în garaj pentru export!');
    return;
  }

  let content = `DOSAR AUTO — AutoAssist\nGenerat: ${new Date().toLocaleDateString('ro-RO')}\n\n`;
  content += `Utilizator: ${currentUser?.email || 'necunoscut'}\n`;
  content += '='.repeat(50) + '\n\n';

  cars.forEach((c, i) => {
    content += `MAȘINA ${i+1}: ${c.brand} ${c.model} ${c.year}\n`;
    content += `-`.repeat(40) + '\n';
    content += `Nr. înmatriculare: ${c.plate}\n`;
    content += `Kilometraj: ${c.km || '-'} km\n`;
    content += `Combustibil: ${c.fuel || '-'}\n`;
    content += `Motor: ${c.engine || '-'}\n`;
    content += `VIN: ${c.vin || '-'}\n\n`;
    content += `DOCUMENTE:\n`;
    content += `  RCA: ${c.docs?.rca || 'Necompletat'}\n`;
    content += `  ITP: ${c.docs?.itp || 'Necompletat'}\n`;
    content += `  Rovinietă: ${c.docs?.rov || 'Necompletat'}\n`;
    content += `  Extinctor: ${c.docs?.ext || 'Necompletat'}\n`;
    content += `  Trusă: ${c.docs?.trz || 'Necompletat'}\n\n`;
    if(c.mnt?.oilLast) {
      content += `MENTENANȚĂ:\n`;
      content += `  Ulei schimbat la: ${c.mnt.oilLast} km\n`;
      content += `  Interval schimb: ${c.mnt.oilInt || 10000} km\n\n`;
    }
    content += '\n';
  });

  content += '='.repeat(50) + '\n';
  content += 'AutoAssist — Asistentul & Managerul tău auto\n';
  content += 'www.autoassist.ro\n';

  // Crează fișier text descărcabil (PDF real necesită librărie)
  const blob = new Blob([content], {type: 'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `AutoAssist_Dosar_${new Date().toISOString().split('T')[0]}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  showNotification('✅ Dosar exportat!', 'Fișierul a fost descărcat pe dispozitivul tău.');
}

// ═══ SMS SETTINGS ═══
function initSMSSettings() {
  const lock = document.getElementById('sms-premium-lock');
  const body = document.getElementById('sms-settings-body');
  if(!lock || !body) return;
  if(!isPremium()) {
    lock.style.display = 'block';
    body.style.display = 'none';
  } else {
    lock.style.display = 'none';
    body.style.display = 'block';
    // Încarcă setările salvate
    const saved = JSON.parse(localStorage.getItem('aa_sms_settings') || '{}');
    if(saved.phone) document.getElementById('sms-phone').value = saved.phone;
    if(document.getElementById('sms-rca')) document.getElementById('sms-rca').checked = saved.rca !== false;
    if(document.getElementById('sms-itp')) document.getElementById('sms-itp').checked = saved.itp !== false;
    if(document.getElementById('sms-rov')) document.getElementById('sms-rov').checked = saved.rov !== false;
  }
}

function saveSMSSettings() {
  if(!isPremium()) { showUpgradeModal('sms'); return; }
  const phone = document.getElementById('sms-phone')?.value?.trim();
  if(!phone) { 
    document.getElementById('sms-save-status').innerHTML = '<span style="color:var(--red)">⚠️ Introdu numărul de telefon!</span>';
    return; 
  }
  const settings = {
    phone,
    rca: document.getElementById('sms-rca')?.checked,
    itp: document.getElementById('sms-itp')?.checked,
    rov: document.getElementById('sms-rov')?.checked,
    saved: new Date().toISOString()
  };
  localStorage.setItem('aa_sms_settings', JSON.stringify(settings));
  // Salvează și în Supabase dacă e logat
  if(supabaseClient && currentUser) {
    supabaseClient.from('user_settings').upsert({
      user_id: currentUser.id,
      sms_phone: phone,
      sms_rca: settings.rca,
      sms_itp: settings.itp,
      sms_rov: settings.rov
    }).then(() => {});
  }
  const status = document.getElementById('sms-save-status');
  if(status) status.innerHTML = '<span style="color:var(--green)">✅ Setările SMS au fost salvate! Vei primi SMS-uri la numerele de expirare configurate.</span>';
  showNotification('✅ SMS activat!', `Vei primi alerte pe ${phone}`);
}

// ═══ RAPORT AI STARE MAȘINĂ ═══
async function generateCarReport(carId) {
  if(!isPremium()) { showUpgradeModal('raport_ai'); return; }
  
  const car = cars.find(c => c.id == carId);
  if(!car) return;

  const btn = document.getElementById('raport-btn-' + carId);
  if(btn) { btn.disabled = true; btn.textContent = '⏳ Generez raport...'; }

  const today = new Date();
  const daysUntil = v => v ? Math.ceil((new Date(v) - today) / 864e5) : null;
  
  const prompt = `Ești un expert auto român. Analizează această mașină și generează un raport complet de stare în română:

Mașină: ${car.brand} ${car.model} ${car.year}
Nr. înmatriculare: ${car.plate}
Kilometraj: ${car.km || 'necunoscut'} km
Combustibil: ${car.fuel || 'necunoscut'}
Motor: ${car.engine || 'necunoscut'}

DOCUMENTE:
- RCA: ${car.docs?.rca ? `expiră ${car.docs.rca} (${daysUntil(car.docs.rca)} zile)` : 'necunoscut'}
- ITP: ${car.docs?.itp ? `expiră ${car.docs.itp} (${daysUntil(car.docs.itp)} zile)` : 'necunoscut'}
- Rovinietă: ${car.docs?.rov ? `expiră ${car.docs.rov} (${daysUntil(car.docs.rov)} zile)` : 'necunoscut'}

MENTENANȚĂ:
- Ulei schimbat la: ${car.mnt?.oilLast || 'necunoscut'} km
- Interval schimb ulei: ${car.mnt?.oilInt || 10000} km
- Km actuali: ${car.km || 0}

Generează un raport structurat cu:
1. STARE GENERALĂ (Excelentă/Bună/Atenție/Critică) cu explicație
2. DOCUMENTE — ce expiră curând și urgența
3. MENTENANȚĂ — ce verificări sunt recomandate la acest kilometraj pentru ${car.brand} ${car.model}
4. PROBLEME COMUNE — cele mai frecvente probleme la ${car.brand} ${car.model} ${car.year} la ${car.km || '?'} km
5. RECOMANDĂRI — top 3 acțiuni prioritare
6. COST ESTIMAT mentenanță preventivă în Romania

Fii specific, practic și în română.`;

  try {
    const res = await fetch('https://zspcknjuqdjfxtqrqhhm.supabase.co/functions/v1/asistent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': await aaAuthHeader()
      },
      body: JSON.stringify({
        messages: [{role:'user', content: prompt}],
        system: 'Ești un expert auto român care generează rapoarte clare și utile.',
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500
      })
    });
    const data = await res.json();
    const reply = data.reply || 'Nu s-a putut genera raportul.';
    
    // Afișez raportul într-un modal
    openReportModal(car, reply);
  } catch(e) {
    showNotification('❌ Eroare', 'Nu s-a putut genera raportul. Încearcă din nou.');
  } finally {
    if(btn) { btn.disabled = false; btn.textContent = '🤖 Raport AI'; }
  }
}

function openReportModal(car, report) {
  const existing = document.getElementById('mo-car-report');
  if(existing) existing.remove();

  const modal = document.createElement('div');
  modal.className = 'mo';
  modal.id = 'mo-car-report';
  modal.innerHTML = `
    <div class="md" style="max-width:600px">
      <div class="md-handle"></div>
      <div class="md-h">
        <div class="md-t">🤖 Raport AI — ${car.brand} ${car.model} ${car.year}</div>
        <div class="md-x" onclick="closeM('car-report')">✕</div>
      </div>
      <div style="padding-bottom:20px">
        <div style="background:var(--s2);border-radius:10px;padding:16px;margin-bottom:12px;font-size:13px;color:var(--t2);line-height:1.7;white-space:pre-wrap">${report.replace(/</g,'&lt;')}</div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary" style="flex:1" onclick="exportReportTXT('${car.plate}', \`${report.replace(/`/g,"'")}\`)">📄 Descarcă raport</button>
          <button class="btn btn-ghost" onclick="closeM('car-report')">Închide</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('open'), 10);
}

function exportReportTXT(plate, report) {
  const blob = new Blob([`RAPORT AI AutoAssist\nMașină: ${plate}\nData: ${new Date().toLocaleDateString('ro-RO')}\n\n${report}`], {type:'text/plain;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `Raport_${plate}_${new Date().toISOString().split('T')[0]}.txt`;
  a.click();
}


// ═══ CARDURI DOCUMENTE PERSONALE (rezumat vizibil + Editează / Vezi / Descarcă) ═══
function _docZile(iso){
  if(!iso) return null;
  var t=Date.parse(iso); if(isNaN(t)) return null;
  return Math.ceil((t-Date.now())/86400000);
}
function renderDocCards(){
  var box=document.getElementById('docpers-cards'); if(!box) return;
  function rd(k){ try{ return JSON.parse(localStorage.getItem('docdate_'+k)||'{}'); }catch(e){ return {}; } }
  var b=rd('buletin'), p=rd('permis'), t=rd('talon');
  var alt=[]; try{ alt=JSON.parse(localStorage.getItem('altdocs')||'[]'); }catch(e){}
  var defs=[
    {k:'buletin',vezi:'buletinul',ic:'🪪',nm:'Buletin / CI',has:!!(b['bul-nume']||b['bul-serie']),line:(b['bul-nume']||'')+(b['bul-serie']?' · '+b['bul-serie']:''),exp:b['bul-exp'],expLabel:'Valabil până la'},
    {k:'permis',vezi:'permisul',ic:'🚘',nm:'Permis auto',has:!!(p['perm-nr']||p['perm-exp']),line:(p['perm-nr']||'')+(p['perm-cat']?' · cat. '+p['perm-cat']:''),exp:p['perm-exp'],expLabel:'Valabil până la'},
    {k:'talon',vezi:'talonul',ic:'📄',nm:'Talon mașină',has:!!(t['tal-nr']||t['tal-marca']),line:((t['tal-marca']||'')+' '+(t['tal-model']||'')).trim()+(t['tal-nr']?' · '+t['tal-nr']:''),exp:null}
  ];
  defs=defs.filter(function(d){ return d.k!=='talon' || d.has || !!localStorage.getItem('doc_img_talon'); });
  var h=defs.map(function(d){
    var img=!!localStorage.getItem('doc_img_'+d.k), z=_docZile(d.exp), badge='';
    if(z!==null){ var col=z<0?'var(--red)':z<=60?'var(--amber)':'var(--green)'; badge='<div style="font-size:12px;font-weight:700;color:'+col+';margin-top:4px">'+(z<0?'Expirat de '+(-z)+' zile':d.expLabel+': '+new Date(d.exp).toLocaleDateString('ro-RO')+' ('+z+' zile)')+'</div>'; }
    var status=d.has||img?'<span style="font-size:11px;font-weight:700;color:var(--green)">✅ Salvat'+(img?' · cu poză':'')+'</span>':'<span style="font-size:11px;font-weight:700;color:var(--t3)">Neadăugat încă</span>';
    return '<div class="card" style="margin:0;padding:14px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><div style="font-size:26px">'+d.ic+'</div><div><div style="font-weight:800;font-size:14px">'+d.nm+'</div>'+status+'</div></div>'
      +'<div style="font-size:12px;color:var(--t2);min-height:16px;word-break:break-word">'+(d.line||'Adaugă documentul ca să-l ai la îndemână')+'</div>'+badge
      +'<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">'
      +((d.has||img)
        ? '<button class="btn btn-primary btn-sm" onclick="docCardView(\''+d.k+'\')">👁️ Vezi '+d.vezi+'</button><button class="btn btn-ghost btn-sm" onclick="docCardEdit(\''+d.k+'\')">✏️ Editează</button><button class="btn btn-sm" style="background:rgba(255,80,80,0.1);color:var(--red);border:1px solid rgba(255,80,80,0.3)" onclick="docCardDelete(\''+d.k+'\')">🗑️ Șterge</button>'+(img?'<button class="btn btn-ghost btn-sm" onclick="downloadDocImg(\''+d.k+'\')">⬇️</button>':'')
        : '<button class="btn btn-primary btn-sm" onclick="docCardEdit(\''+d.k+'\')">➕ Adaugă</button>')
      +'</div></div>';
  }).join('');
  h+='<div class="card" style="margin:0;padding:14px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><div style="font-size:26px">📁</div><div><div style="font-weight:800;font-size:14px">Alte documente</div><span style="font-size:11px;font-weight:700;color:'+(alt.length?'var(--green)':'var(--t3)')+'">'+(alt.length?'✅ '+alt.length+' salvate':'Neadăugat încă')+'</span></div></div>'
    +'<div style="font-size:12px;color:var(--t2);min-height:16px">Polițe, contracte, facturi, alte fișiere</div>'
    +'<div style="display:flex;gap:6px;margin-top:10px"><button class="btn btn-primary btn-sm" onclick="docCardEdit(\'altele\')">'+(alt.length?'✏️ Gestionează':'➕ Adaugă')+'</button></div></div>';
  if(box._h!==h){ box.innerHTML=h; box._h=h; }
}
function docCardEdit(k){
  docTab(k);
  var panel=document.getElementById('docpanel-'+k);
  if(panel) panel.scrollIntoView({behavior:'smooth',block:'start'});
  var first={buletin:'bul-nume',permis:'perm-nr',talon:'tal-nr'}[k], el=first&&document.getElementById(first);
  if(el) setTimeout(function(){ try{ el.focus({preventScroll:true}); }catch(e){} },350);
}
(function(){
  var _t=window.docTab; if(typeof _t==='function'){ window.docTab=function(){ var r=_t.apply(this,arguments); try{renderDocCards();}catch(e){} return r; }; }
  setInterval(function(){ var s=document.getElementById('sec-docpersonale'); if(s && s.classList.contains('active')) { try{renderDocCards();}catch(e){} } },500);
  document.addEventListener('DOMContentLoaded',function(){ try{renderDocCards();}catch(e){} });
})();

var _DOC_FIELDS={buletin:['bul-nume','bul-cnp','bul-dob','bul-serie','bul-adresa','bul-judet','bul-exp'],permis:['perm-nr','perm-data','perm-exp','perm-cat','perm-elib'],talon:['tal-nr','tal-vin','tal-marca','tal-model','tal-an','tal-cmc','tal-kw','tal-comb','tal-culoare']};
var _DOC_NM={buletin:'buletinul',permis:'permisul',talon:'talonul'};
function docCardView(k){
  if(localStorage.getItem('doc_img_'+k)){ viewDocImg(k); return; }
  var data={}; try{ data=JSON.parse(localStorage.getItem('docdate_'+k)||'{}'); }catch(e){}
  var labels={'bul-nume':'Nume','bul-cnp':'CNP','bul-dob':'Data nașterii','bul-serie':'Seria și nr.','bul-adresa':'Adresa','bul-judet':'Județ','bul-exp':'Valabil până la','perm-nr':'Număr permis','perm-data':'Data eliberării','perm-exp':'Valabil până la','perm-cat':'Categorii','perm-elib':'Eliberat de','tal-nr':'Nr. înmatriculare','tal-vin':'VIN','tal-marca':'Marca','tal-model':'Model','tal-an':'An','tal-cmc':'Capacitate (cmc)','tal-kw':'Putere (kW)','tal-comb':'Combustibil','tal-culoare':'Culoare'};
  var rows=Object.keys(data).filter(function(x){return data[x];}).map(function(x){return '<div style="display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid var(--b2);font-size:13px"><span style="color:var(--t3)">'+(labels[x]||x)+'</span><b style="text-align:right;word-break:break-word">'+String(data[x]).replace(/</g,'&lt;')+'</b></div>';}).join('')||'<div style="color:var(--t3);font-size:13px">Nu sunt date salvate.</div>';
  _docModal('📄 Datele din '+_DOC_NM[k],rows+'<div style="font-size:11px;color:var(--t3);margin-top:10px">Nu ai încărcat o poză a documentului. Poți adăuga una din „Editează”.</div>',[['Închide','btn-ghost','_docModalClose()'],['✏️ Editează','btn-primary',"_docModalClose();docCardEdit('"+k+"')"]]);
}
function _docModalClose(){ var m=document.getElementById('doc-card-modal'); if(m) m.remove(); }
function _docModal(title,body,btns){
  _docModalClose();
  document.body.insertAdjacentHTML('beforeend','<div id="doc-card-modal" onclick="if(event.target===this)_docModalClose()" style="position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:99990;display:flex;align-items:center;justify-content:center;padding:16px"><div style="background:var(--s1);border:1px solid var(--b2);border-radius:16px;max-width:440px;width:100%;padding:20px;max-height:88vh;overflow:auto"><div style="font-weight:800;font-size:16px;margin-bottom:12px">'+title+'</div><div>'+body+'</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px;justify-content:flex-end">'+btns.map(function(b){return '<button class="btn btn-sm '+b[1]+'" '+(b[3]?'style="'+b[3]+'" ':'')+'onclick="'+b[2]+'">'+b[0]+'</button>';}).join('')+'</div></div></div>');
}
function docCardDelete(k){
  var nm=_DOC_NM[k]||'documentul';
  _docModal('🗑️ Ștergi '+nm+'?',
    '<div style="font-size:13px;color:var(--t2);line-height:1.6">Se șterg datele salvate și poza scanată pentru <b>'+nm+'</b>. <br><br>Nu e o problemă dacă te răzgândești: poți adăuga '+nm+' din nou oricând, sau îl poți înlocui acum cu unul nou.</div>',
    [['Anulează','btn-ghost','_docModalClose()'],['🔄 Înlocuiește cu unul nou','btn-primary',"_docModalClose();docCardEdit('"+k+"')"],['🗑️ Da, șterge','btn',"docCardDeleteDo('"+k+"')",'background:rgba(255,80,80,0.15);color:var(--red);border:1px solid rgba(255,80,80,0.4)']]);
}
function docCardDeleteDo(k){
  localStorage.removeItem('docdate_'+k); localStorage.removeItem('doc_img_'+k);
  (_DOC_FIELDS[k]||[]).forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
  var img=document.getElementById(k+'-img'), prev=document.getElementById(k+'-preview'); if(img) img.src=''; if(prev) prev.style.display='none';
  var a=document.getElementById('doc-actions-'+k); if(a) a.remove();
  _docModalClose();
  try{ showNotification('🗑️ Șters','Ai șters '+(_DOC_NM[k]||'documentul')+'. Îl poți adăuga din nou oricând.'); }catch(e){}
  renderDocCards();
}

function docPhotoDelete(k){
  var nm=_DOC_NM[k]||'documentul';
  _docModal('🗑️ Ștergi poza pentru '+nm+'?',
    '<div style="font-size:13px;color:var(--t2);line-height:1.6">Se șterge doar poza scanată. Datele completate rămân salvate. <br><br>Poți adăuga oricând o poză nouă sau o poți înlocui acum.</div>',
    [['Anulează','btn-ghost','_docModalClose()'],['🔄 Înlocuiește cu una nouă','btn-primary',"_docModalClose();document.getElementById('"+k+"-file').click()"],['🗑️ Da, șterge poza','btn',"docPhotoDeleteDo('"+k+"')",'background:rgba(255,80,80,0.15);color:var(--red);border:1px solid rgba(255,80,80,0.4)']]);
}
function docPhotoDeleteDo(k){
  localStorage.removeItem('doc_img_'+k);
  var img=document.getElementById(k+'-img'), prev=document.getElementById(k+'-preview'); if(img) img.src=''; if(prev) prev.style.display='none';
  var a=document.getElementById('doc-actions-'+k); if(a) a.remove();
  _docModalClose();
  try{ showNotification('🗑️ Poză ștearsă','Poți adăuga o poză nouă oricând.'); }catch(e){}
  renderDocCards();
}

function _docSaveSilent(type){
  var f=_DOC_FIELDS[type]||[], data={};
  f.forEach(function(id){ var el=document.getElementById(id); if(el) data[id]=el.value; });
  localStorage.setItem('docdate_'+type, JSON.stringify(data));
}

/* ═══════════ ACTE MULTIPLE (Supabase) — taloane per mașină, acte șoferi pentru admin flotă ═══════════ */
var _udRows=[], _udMembers={}, _udLoadedAt=0, _udUidSeen=null, _udBusy=false, _udDraft=null;
var _UD_TAL=['tal-nr','tal-vin','tal-marca','tal-model','tal-an','tal-cmc','tal-kw','tal-comb','tal-culoare'];
var _UD_LBL={'tal-nr':'Nr. înmatriculare','tal-vin':'VIN','tal-marca':'Marca','tal-model':'Model','tal-an':'An','tal-cmc':'Capacitate (cmc)','tal-kw':'Putere (kW)','tal-comb':'Combustibil','tal-culoare':'Culoare','bul-nume':'Nume','bul-cnp':'CNP','bul-dob':'Data nașterii','bul-serie':'Seria și nr.','bul-adresa':'Adresa','bul-judet':'Județ','bul-exp':'Valabil până la','perm-nr':'Număr permis','perm-data':'Data eliberării','perm-exp':'Valabil până la','perm-cat':'Categorii','perm-elib':'Eliberat de'};
function _udEsc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); }
function _udUid(){ try{ return currentUser&&currentUser.id||null; }catch(e){ return null; } }
function _udIsAdmin(){ var f=window.myFleet; return !!(f && f.role==='admin' && f.active); }
function _udCars(){ try{ return (typeof cars!=='undefined'&&Array.isArray(cars))?cars:[]; }catch(e){ return []; } }
function _udCarName(id){ var c=_udCars().find(function(x){return String(x.id)===String(id);}); return c?((c.plate||'')+' '+(c.brand||'')+' '+(c.model||'')).trim():('Mașina #'+id); }
async function udLoad(force){
  var uid=_udUid(); if(!uid||typeof supabaseClient==='undefined'){ _udRows=[]; return; }
  if(_udBusy) return; if(!force && Date.now()-_udLoadedAt<45000 && _udUidSeen===uid) return;
  _udBusy=true;
  try{
    var r=await supabaseClient.from('user_documents').select('*').order('created_at',{ascending:true});
    if(!r.error){ _udRows=r.data||[]; }
    _udMembers={};
    if(window.myFleet && window.myFleet.id){
      var m=await supabaseClient.from('fleet_members').select('email,user_id').eq('fleet_id',window.myFleet.id);
      (m.data||[]).forEach(function(x){ if(x.user_id) _udMembers[x.user_id]=x.email; });
    }
    _udLoadedAt=Date.now(); _udUidSeen=uid;
  }catch(e){ console.warn('udLoad',e); }
  _udBusy=false; udRender();
  try{ await udPullPersonal(); }catch(e){ console.warn('udPull',e); }
}
function _udRowCardBtns(r,mine){
  var h='<button class="btn btn-primary btn-sm" onclick="udView(\''+r.id+'\')">👁️ Vezi</button>';
  if(r.kind==='talon' && r.car_id) h+='<button class="btn btn-ghost btn-sm" onclick="udGoCar('+r.car_id+')">🚗 Vezi mașina</button>';
  if(!mine && r.kind!=='talon') h+='<button class="btn btn-ghost btn-sm" onclick="udGoDriver()">👤 Vezi șoferul</button>';
  if(mine && r.kind==='talon') h+='<button class="btn btn-ghost btn-sm" onclick="udEditTalon('+r.car_id+')">✏️ Editează</button>';
  h+='<button class="btn btn-sm" style="background:rgba(255,80,80,0.1);color:var(--red);border:1px solid rgba(255,80,80,0.3)" onclick="udDelete(\''+r.id+'\')">🗑️ Șterge</button>';
  return h;
}
function udRender(){
  var anchor=document.getElementById('docpers-cards'); if(!anchor) return;
  var box=document.getElementById('docpers-multi');
  if(!box){ box=document.createElement('div'); box.id='docpers-multi'; anchor.parentNode.insertBefore(box,anchor); }
  var uid=_udUid(), carsL=_udCars(), mine=_udRows.filter(function(r){return r.owner_id===uid;}), h='';
  if(!uid){ box.innerHTML=''; box._h=''; return; }
  var admin=_udIsAdmin();
  h+='<div style="font-weight:800;font-size:15px;margin:4px 0 8px">📄 Taloane pe mașini</div>';
  if(!carsL.length){
    h+='<div class="card" style="margin:0 0 14px;padding:14px;font-size:13px;color:var(--t2)">Nu ai nicio mașină în garaj. Adaugă o mașină și apoi îi poți atașa talonul aici.</div>';
  } else {
    h+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px;margin-bottom:18px">';
    carsL.forEach(function(c){
      var t=mine.find(function(r){return r.kind==='talon' && String(r.car_id)===String(c.id);});
      var line=t?(((t.data['tal-marca']||'')+' '+(t.data['tal-model']||'')).trim()+(t.data['tal-vin']?' · VIN '+t.data['tal-vin']:'')):'Talonul nu e adăugat încă';
      h+='<div class="card" style="margin:0;padding:14px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><div style="font-size:26px">📄</div><div><div style="font-weight:800;font-size:14px">'+_udEsc(((c.plate||'')+' '+(c.brand||'')+' '+(c.model||'')).trim()||'Mașină')+'</div>'
        +(t?'<span style="font-size:11px;font-weight:700;color:var(--green)">✅ Talon salvat'+(t.file_path?' · cu poză':'')+'</span>':'<span style="font-size:11px;font-weight:700;color:var(--t3)">Neadăugat încă</span>')+'</div></div>'
        +'<div style="font-size:12px;color:var(--t2);min-height:16px;word-break:break-word">'+_udEsc(line)+'</div>'
        +'<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">'
        +(t?_udRowCardBtns(t,true):'<button class="btn btn-primary btn-sm" onclick="udEditTalon('+c.id+')">➕ Adaugă talon</button><button class="btn btn-ghost btn-sm" onclick="udGoCar('+c.id+')">🚗 Vezi mașina</button>')
        +'</div></div>';
    });
    h+='</div>';
  }
  if(window.myFleet){
    var others=_udRows.filter(function(r){return r.owner_id!==uid;});
    h+='<div style="font-weight:800;font-size:15px;margin:4px 0 4px">👥 Actele flotei '+_udEsc(window.myFleet.name||'')+'</div>';
    h+='<div style="font-size:12px;color:var(--t3);margin-bottom:10px">'+(admin?'Ești administrator: vezi actele tuturor șoferilor din flotă. Fiecare șofer vede doar actele lui.':'Fiecare șofer vede doar actele lui. Administratorul flotei le poate vedea pe toate.')+'</div>';
    if(admin){
      if(!others.length) h+='<div class="card" style="margin:0 0 14px;padding:14px;font-size:13px;color:var(--t2)">Încă niciun șofer nu a adăugat acte.</div>';
      else{
        var by={}; others.forEach(function(r){ (by[r.owner_id]=by[r.owner_id]||[]).push(r); });
        Object.keys(by).forEach(function(o){
          h+='<div style="font-weight:700;font-size:13px;margin:10px 0 6px">👤 '+_udEsc(_udMembers[o]||'Șofer')+'</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px;margin-bottom:12px">';
          by[o].forEach(function(r){
            var ic={buletin:'🪪',permis:'🚘',talon:'📄',altele:'📁'}[r.kind]||'📁', nm={buletin:'Buletin',permis:'Permis',talon:'Talon',altele:'Document'}[r.kind];
            var exp=r.data&&(r.data['bul-exp']||r.data['perm-exp']), z=_docZile(exp), badge='';
            if(z!==null){ var col=z<0?'var(--red)':z<=60?'var(--amber)':'var(--green)'; badge='<div style="font-size:12px;font-weight:700;color:'+col+';margin-top:4px">'+(z<0?'Expirat de '+(-z)+' zile':'Valabil până la '+new Date(exp).toLocaleDateString('ro-RO')+' ('+z+' zile)')+'</div>'; }
            h+='<div class="card" style="margin:0;padding:14px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><div style="font-size:26px">'+ic+'</div><div><div style="font-weight:800;font-size:14px">'+nm+(r.kind==='talon'?' · '+_udEsc(_udCarName(r.car_id)):'')+'</div></div></div>'+badge
              +'<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">'+_udRowCardBtns(r,false)+'</div></div>';
          });
          h+='</div>';
        });
      }
    }
  }
  if(box._h!==h){ box.innerHTML=h; box._h=h; }
}
function udGoCar(id){ if(typeof openCar==='function') openCar(id); }
function udGoDriver(){ if(typeof goTo==='function') goTo('flota'); setTimeout(function(){ try{ fleetTab('membri'); }catch(e){} },400); }
async function udView(id){
  var r=_udRows.find(function(x){return x.id===id;}); if(!r) return;
  var rows=Object.keys(r.data||{}).filter(function(k){return r.data[k];}).map(function(k){return '<div style="display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-bottom:1px solid var(--b2);font-size:13px"><span style="color:var(--t3)">'+(_UD_LBL[k]||k)+'</span><b style="text-align:right;word-break:break-word">'+_udEsc(r.data[k])+'</b></div>';}).join('')||'<div style="color:var(--t3);font-size:13px">Nu sunt date completate.</div>';
  var imgHtml='';
  if(r.file_path){
    var s=await supabaseClient.storage.from('user-docs').createSignedUrl(r.file_path,300);
    if(s.data&&s.data.signedUrl) imgHtml='<img src="'+s.data.signedUrl+'" style="width:100%;border-radius:10px;margin-bottom:12px">';
  }
  var btns=[['Închide','btn-ghost','_docModalClose()']];
  if(r.kind==='talon'&&r.car_id) btns.push(['🚗 Vezi mașina','btn-primary',"_docModalClose();udGoCar("+r.car_id+")"]);
  _docModal('📄 '+_udEsc(r.kind==='talon'?_udCarName(r.car_id):(r.kind==='buletin'?'Buletin':'Permis')),imgHtml+rows,btns);
}
function udEditTalon(carId){
  var uid=_udUid(), t=_udRows.find(function(r){return r.owner_id===uid&&r.kind==='talon'&&String(r.car_id)===String(carId);});
  var c=_udCars().find(function(x){return String(x.id)===String(carId);})||{};
  var d=(t&&t.data)||{};
  if(!t){ d={'tal-nr':c.plate||'','tal-marca':c.brand||'','tal-model':c.model||'','tal-an':c.year||''}; }
  _udDraft={carId:carId,id:t?t.id:null,path:t?t.file_path:null,img:null};
  var body='<div style="font-size:12px;color:var(--t3);margin-bottom:10px">Talon pentru <b>'+_udEsc(_udCarName(carId))+'</b></div>'
    +'<label class="btn btn-ghost btn-sm" style="display:inline-block;margin-bottom:10px;cursor:pointer">📸 Scanează talonul<input type="file" accept="image/*" style="display:none" onchange="udPickImg(this)"></label><div id="ud-scan-st" style="font-size:12px;color:var(--t3);margin-bottom:8px">'+(t&&t.file_path?'Are deja o poză salvată (alege alta ca s-o înlocuiești).':'')+'</div>'
    +_UD_TAL.map(function(k){ return '<div style="margin-bottom:8px"><div style="font-size:11px;color:var(--t3);margin-bottom:2px">'+_UD_LBL[k]+'</div><input id="ud-f-'+k+'" class="fi" style="width:100%" value="'+_udEsc(d[k]||'')+'"></div>'; }).join('');
  _docModal('📄 '+(t?'Editează talonul':'Adaugă talonul'),body,[['Anulează','btn-ghost','_docModalClose()'],['💾 Salvează','btn-primary','udSaveTalon()']]);
}
async function udPickImg(inp){
  var f=inp.files&&inp.files[0]; if(!f) return;
  var st=document.getElementById('ud-scan-st'); if(st) st.textContent='🔍 Se citește talonul...';
  var du=await new Promise(function(res){ var fr=new FileReader(); fr.onload=function(e){res(e.target.result);}; fr.readAsDataURL(f); });
  var small=await _docResize(du,1800); _udDraft.img=small;
  try{
    var token=await aaAuthHeader(), b64=small.split(',')[1], mt=small.split(';')[0].split(':')[1];
    var res=await fetch('https://zspcknjuqdjfxtqrqhhm.supabase.co/functions/v1/asistent',{method:'POST',headers:{'Content-Type':'application/json','Authorization':token},body:JSON.stringify({model:'claude-sonnet-4-5',max_tokens:700,system:'Ești un sistem OCR pentru documente românești. Returnezi DOAR JSON valid, fără explicații.',messages:[{role:'user',content:[{type:'image',source:{type:'base64',media_type:mt,data:b64}},{type:'text',text:'Utilizatorul își încarcă propriul document în AutoAssist ca să completeze formularul. Transcrie exact textul tipărit pe certificatul de înmatriculare (talon) românesc. Returnează JSON: {"nr":"număr înmatriculare (A)","vin":"serie șasiu (E)","marca":"(D.1)","model":"(D.3)","an":"anul fabricației","cmc":"capacitate cilindrică (P.1)","kw":"putere kW (P.2)","combustibil":"(P.3)","culoare":"(R)"}. Dacă un câmp nu se vede, pune "".'}]}]})});
    var j=await res.json(); var reply=j.reply||''; var m=reply.replace(/```json|```/g,'').match(/\{[\s\S]*\}/);
    if(!m) throw new Error('fără date'); var o=JSON.parse(m[0]), map={'tal-nr':'nr','tal-vin':'vin','tal-marca':'marca','tal-model':'model','tal-an':'an','tal-cmc':'cmc','tal-kw':'kw','tal-comb':'combustibil','tal-culoare':'culoare'}, n=0;
    Object.keys(map).forEach(function(id){ var v=o[map[id]], el=document.getElementById('ud-f-'+id); if(el&&v&&String(v).trim()){ el.value=String(v).trim(); n++; } });
    if(st) st.textContent=n?('✅ Am completat '+n+' câmpuri. Verifică-le înainte de salvare.'):'⚠️ Nu am putut citi datele; completează manual (poza se salvează oricum).';
  }catch(e){ if(st) st.textContent='⚠️ Nu am putut citi datele ('+(e.message||e)+'). Completează manual; poza se salvează oricum.'; }
}
async function _udUpload(path,dataUrl){
  var blob=await (await fetch(dataUrl)).blob();
  return supabaseClient.storage.from('user-docs').upload(path,blob,{upsert:true,contentType:'image/jpeg'});
}
async function udSaveTalon(){
  var d=_udDraft; if(!d) return; var uid=_udUid(); if(!uid) return;
  var data={}; _UD_TAL.forEach(function(k){ var el=document.getElementById('ud-f-'+k); if(el&&el.value.trim()) data[k]=el.value.trim(); });
  if(!Object.keys(data).length && !d.img){ showNotification('⚠️','Completează cel puțin un câmp sau scanează talonul.'); return; }
  var id=d.id||(window.crypto&&crypto.randomUUID?crypto.randomUUID():'ud'+Date.now()), path=d.path||null;
  if(d.img){ path=uid+'/'+id+'.jpg'; var up=await _udUpload(path,d.img); if(up.error){ showNotification('⚠️','Poza nu s-a încărcat: '+up.error.message); return; } }
  var r=await supabaseClient.from('user_documents').upsert({id:id,owner_id:uid,kind:'talon',car_id:d.carId,label:_udCarName(d.carId),data:data,file_path:path});
  if(r.error){ showNotification('⚠️','Nu am putut salva: '+r.error.message); return; }
  _docModalClose(); showNotification('✅ Salvat','Talonul a fost atașat mașinii.'); udLoad(true);
}
function udDelete(id){
  _docModal('🗑️ Ștergi documentul?','<div style="font-size:13px;color:var(--t2);line-height:1.6">Se șterg definitiv datele și poza. Poți adăuga documentul din nou oricând.</div>',
    [['Anulează','btn-ghost','_docModalClose()'],['🗑️ Da, șterge','btn',"udDeleteDo('"+id+"')",'background:rgba(255,80,80,0.15);color:var(--red);border:1px solid rgba(255,80,80,0.4)']]);
}
async function udDeleteDo(id){
  var r=_udRows.find(function(x){return x.id===id;});
  if(r&&r.file_path){ try{ await supabaseClient.storage.from('user-docs').remove([r.file_path]); }catch(e){} }
  var q=await supabaseClient.from('user_documents').delete().eq('id',id);
  _docModalClose();
  if(q.error){ showNotification('⚠️','Nu am putut șterge: '+q.error.message); return; }
  showNotification('🗑️ Șters','Documentul a fost șters.'); udLoad(true);
}
/* buletin / permis personale → Supabase doar pentru membrii unei flote (ca administratorul să le vadă) */
async function udSyncPersonal(kind){
  try{
    var uid=_udUid(); if(!uid||typeof supabaseClient==='undefined') return;
    if(kind!=='buletin'&&kind!=='permis') return;
    var data={}; try{ data=JSON.parse(localStorage.getItem('docdate_'+kind)||'{}'); }catch(e){}
    var img=localStorage.getItem('doc_img_'+kind), ex=_udRows.find(function(r){return r.owner_id===uid&&r.kind===kind;});
    var id=ex?ex.id:(window.crypto&&crypto.randomUUID?crypto.randomUUID():'ud'+Date.now()), path=ex?ex.file_path:null;
    if(img){ path=uid+'/'+id+'.jpg'; var up=await _udUpload(path,img); if(up.error) path=ex?ex.file_path:null; }
    else if(ex&&ex.file_path&&!img){ try{ await supabaseClient.storage.from('user-docs').remove([ex.file_path]); }catch(e){} path=null; }
    if(!Object.keys(data).some(function(k){return data[k];}) && !path){ if(ex) await supabaseClient.from('user_documents').delete().eq('id',ex.id); }
    else await supabaseClient.from('user_documents').upsert({id:id,owner_id:uid,kind:kind,label:kind,data:data,file_path:path});
    try{ localStorage.setItem('docts_'+kind,new Date().toISOString()); }catch(e){}
    udLoad(true);
  }catch(e){ console.warn('udSyncPersonal',e); }
}
(function(){
  var s=window.saveDocDate; if(typeof s==='function') window.saveDocDate=function(t){ var r=s.apply(this,arguments); setTimeout(function(){udSyncPersonal(t);},50); return r; };
  var p=window.processDoc; if(typeof p==='function') window.processDoc=function(t,i){ var r=p.apply(this,arguments); setTimeout(function(){udSyncPersonal(t);},9000); setTimeout(function(){udSyncPersonal(t);},20000); return r; };
  var d=window.docCardDeleteDo; if(typeof d==='function') window.docCardDeleteDo=function(k){ var r=d.apply(this,arguments); setTimeout(function(){udSyncPersonal(k);},50); return r; };
  var pd=window.docPhotoDeleteDo; if(typeof pd==='function') window.docPhotoDeleteDo=function(k){ var r=pd.apply(this,arguments); setTimeout(function(){udSyncPersonal(k);},50); return r; };
  setInterval(function(){
    if(!_udUid()) return;
    var sec=document.getElementById('sec-docpersonale'), act=!!(sec&&sec.classList.contains('active'));
    if(!act && _udUidSeen===_udUid()) return;
    if(_udUidSeen!==_udUid()){ _udRows=[]; _udLoadedAt=0; }
    udLoad(false); udRender();
  },700);
})();

/* Descarcă din cloud buletinul/permisul pe dispozitivul curent (sincronizare între telefon și laptop) */
async function udPullPersonal(){
  var uid=_udUid(); if(!uid) return; var changed=false;
  for(const kind of ['buletin','permis']){
    var r=_udRows.find(function(x){return x.owner_id===uid&&x.kind===kind;}); if(!r) continue;
    var ts=localStorage.getItem('docts_'+kind), hasLocal=!!(localStorage.getItem('docdate_'+kind)&&Object.keys(JSON.parse(localStorage.getItem('docdate_'+kind)||'{}')).some(function(k){return JSON.parse(localStorage.getItem('docdate_'+kind))[k];}))||!!localStorage.getItem('doc_img_'+kind);
    if(hasLocal && ts && Date.parse(r.updated_at)<=Date.parse(ts)) continue;
    if(hasLocal && !ts){ udSyncPersonal(kind); continue; } // local existent, necunoscut în cloud → urcă
    localStorage.setItem('docdate_'+kind,JSON.stringify(r.data||{}));
    if(r.file_path){
      try{
        var sg=await supabaseClient.storage.from('user-docs').createSignedUrl(r.file_path,120);
        if(sg.data&&sg.data.signedUrl){ var b=await (await fetch(sg.data.signedUrl)).blob(); var du=await new Promise(function(res){var fr=new FileReader();fr.onload=function(e){res(e.target.result);};fr.readAsDataURL(b);}); localStorage.setItem('doc_img_'+kind,du); }
      }catch(e){}
    } else localStorage.removeItem('doc_img_'+kind);
    localStorage.setItem('docts_'+kind,new Date().toISOString()); changed=true;
  }
  if(changed){ try{ loadDocData('buletin'); loadDocData('permis'); }catch(e){} try{ renderDocCards(); }catch(e){} }
}
