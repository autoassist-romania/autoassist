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
    try { localStorage.setItem('doc_img_'+type, dataUrl); } catch(e) {}
    // Încearcă extragere date cu Claude Vision
    showNotification('🔍 Procesare...', 'Se extrag datele din document cu AI...');
    await extractDocData(type, dataUrl);
  };
  reader.readAsDataURL(file);
}

async function extractDocData(type, imageDataUrl) {
  const apiKey = localStorage.getItem('autoassist-api-key');
  const base64 = imageDataUrl.split(',')[1];
  const mimeType = imageDataUrl.split(';')[0].split(':')[1];

  const prompts = {
    buletin: 'Extrage din această imagine de buletin/carte de identitate românesc următoarele date în format JSON: { "nume": "", "cnp": "", "dob": "YYYY-MM-DD", "serie": "", "adresa": "", "judet": "", "exp": "YYYY-MM-DD" }. Răspunde DOAR cu JSON valid, fără alte cuvinte.',
    permis: 'Extrage din această imagine de permis auto românesc: { "nr": "", "data": "YYYY-MM-DD", "exp": "YYYY-MM-DD", "categorii": "", "elib": "" }. Răspunde DOAR cu JSON valid.',
    talon: 'Extrage din această imagine de talon/certificat de înmatriculare românesc: { "nr": "", "vin": "", "marca": "", "model": "", "an": "", "cmc": "", "kw": "", "combustibil": "", "culoare": "" }. Răspunde DOAR cu JSON valid.',
  };

  if(!apiKey || !prompts[type]) {
    showNotification('💡 Completare manuală', 'Introdu datele manual sau adaugă Claude API Key în Setări pentru extragere automată.');
    return;
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'x-api-key':apiKey, 'anthropic-version':'2023-06-01', 'anthropic-dangerous-direct-browser-access':'true' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
            { type: 'text', text: prompts[type] }
          ]
        }]
      })
    });
    const data = await res.json();
    if(data.content?.[0]?.text) {
      const json = JSON.parse(data.content[0].text.replace(/```json|```/g,'').trim());
      fillDocFields(type, json);
      showNotification('✅ Date extrase!', 'Verifică și corectează dacă e necesar.');
    }
  } catch(e) {
    showNotification('💡 Completare manuală', 'Introdu datele manual în câmpurile de mai jos.');
  }
}

function fillDocFields(type, data) {
  const map = {
    buletin: { 'bul-nume': data.nume, 'bul-cnp': data.cnp, 'bul-dob': data.dob, 'bul-serie': data.serie, 'bul-adresa': data.adresa, 'bul-judet': data.judet, 'bul-exp': data.exp },
    permis:  { 'perm-nr': data.nr, 'perm-data': data.data, 'perm-exp': data.exp, 'perm-cat': data.categorii, 'perm-elib': data.elib },
    talon:   { 'tal-nr': data.nr, 'tal-vin': data.vin, 'tal-marca': data.marca, 'tal-model': data.model, 'tal-an': data.an, 'tal-cmc': data.cmc, 'tal-kw': data.kw, 'tal-culoare': data.culoare },
  };
  const fields = map[type] || {};
  Object.entries(fields).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if(el && val) el.value = val;
  });
  // Setează combustibil separat pentru select
  if(type === 'talon' && data.combustibil) {
    const el = document.getElementById('tal-comb');
    if(el) { for(let o of el.options) { if(o.value.toLowerCase().includes(data.combustibil.toLowerCase())) { el.value = o.value; break; } } }
  }
  // Setează județ pentru buletin
  if(type === 'buletin' && data.judet) {
    const el = document.getElementById('bul-judet');
    if(el) { for(let o of el.options) { if(o.value.toLowerCase().includes(data.judet.toLowerCase())) { el.value = o.value; break; } } }
  }
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
    if(imgEl && prev) { imgEl.src = img; prev.style.display = 'block'; }
  }
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
  const file = input.files[0];
  if(!file) return;
  const tip = document.getElementById('altdoc-tip')?.value;
  const exp = document.getElementById('altdoc-exp')?.value;
  const desc = document.getElementById('altdoc-desc')?.value;
  const list = JSON.parse(localStorage.getItem('altdocs')||'[]');
  list.unshift({ id: Date.now(), tip, exp, desc, name: file.name });
  localStorage.setItem('altdocs', JSON.stringify(list));
  renderAltDocs();
  showNotification('📁 Document adăugat!', tip);
}

function renderAltDocs() {
  const el = document.getElementById('altdoc-list');
  if(!el) return;
  const list = JSON.parse(localStorage.getItem('altdocs')||'[]');
  if(!list.length) { el.innerHTML = '<div class="empty"><div class="ei">📁</div><p>Niciun document adăugat.</p></div>'; return; }
  el.innerHTML = list.map(d => `
    <div style="padding:12px;background:var(--s2);border-radius:var(--rs);margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-weight:700;font-size:13px">📄 ${d.tip}</div>
        <div style="font-size:11px;color:var(--t2)">${d.name}${d.exp?' · Valabil până: '+d.exp:''}${d.desc?' · '+d.desc:''}</div>
      </div>
      <button onclick="delAltDoc(${d.id})" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:18px">🗑</button>
    </div>`).join('');
}

function delAltDoc(id) {
  let list = JSON.parse(localStorage.getItem('altdocs')||'[]');
  list = list.filter(d => d.id !== id);
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

