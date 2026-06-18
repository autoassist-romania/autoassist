// ═══════════════════════════════════════════════════════
// CĂUTARE GLOBALĂ — indexează ABSOLUT TOATE funcțiile AutoAssist
// ═══════════════════════════════════════════════════════

// ─── Helper: selectează un agent AI din search (are nevoie de elementul <button>) ───
function _aaSelAgent(agent){
  goTo('agenti');
  setTimeout(()=>{
    const btns = document.querySelectorAll('.achip');
    for (const b of btns){
      const oc = b.getAttribute('onclick') || '';
      if (oc.includes("'" + agent + "'")) { b.click(); break; }
    }
  }, 120);
}

// ─── Helper: navighează + derulează la un id după ce secțiunea s-a afișat ───
function _aaGoScroll(sec, id){
  goTo(sec);
  setTimeout(()=>{
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({behavior:'smooth', block:'center'});
  }, 150);
}

// ─── Helper: navighează + apelează o funcție (ex: schimbare tab) ───
function _aaGoThen(sec, fn, delay){
  goTo(sec);
  setTimeout(()=>{ try{ fn(); }catch(e){ console.error('AutoAssist search:', e); } }, delay || 90);
}

// ═══ INDEXUL COMPLET ═══
// pop:true => apare în lista "Acces rapid" când search-ul e gol
const SEARCH_INDEX = [
  // NAVIGARE PRINCIPALĂ
  {title:'Dashboard', desc:'Pagina principală — alerte, mașini, acces rapid', icon:'⊞', cat:'Navigare', kw:'acasa principal home prima pagina', pop:true, go:()=>goTo('dashboard')},
  {title:'Garajul meu', desc:'Toate mașinile tale într-un singur loc', icon:'🚗', cat:'Garaj', kw:'masini vehicule auto garaj lista', pop:true, go:()=>goTo('garaj')},
  {title:'Documente Personale', desc:'Buletin, Permis, Talon, Alte documente', icon:'🪪', cat:'Documente', kw:'buletin ci permis talon acte personale identitate', pop:true, go:()=>goTo('docpersonale')},
  {title:'Documente Mașină', desc:'RCA, ITP, Rovinietă, Extinctor, Trusă medicală — alerte expirare', icon:'📋', cat:'Documente', kw:'rca itp rovinieta extinctor trusa medicala expirare alerte zile ramase', pop:true, go:()=>goTo('documente')},
  {title:'Întreținere & Service', desc:'Jurnal service, remindere, combustibil, checklist drum', icon:'🔧', cat:'Întreținere', kw:'mentenanta service intretinere jurnal', pop:true, go:()=>goTo('mentenanta')},
  {title:'ITP & Service', desc:'Programare ITP la stații din zona ta', icon:'🔬', cat:'Servicii Auto', kw:'itp inspectie tehnica periodica programare service revizie', pop:true, go:()=>goTo('itp')},
  {title:'Asigurări RCA', desc:'Reînnoiește RCA prin Safety Broker, partener autorizat ASF', icon:'🛡️', cat:'Servicii Auto', kw:'rca asigurare auto reinnoire safety broker asf cumpara', pop:true, go:()=>goTo('asigurari')},
  {title:'CarVertical / Verificare SH', desc:'Istoric complet: km real, daune, accidente, proprietari', icon:'🚘', cat:'Servicii Auto', kw:'carvertical verificare second hand sh vin istoric daune accidente furt', go:()=>goTo('verificare')},
  {title:'Vânzare mașini', desc:'Publică un anunț pe marketplace-ul AutoAssist', icon:'💰', cat:'Vânzare', kw:'vanzare anunt marketplace publica vinde masina olx autovit', pop:true, go:()=>goTo('vanzare')},
  {title:'Asistență rutieră', desc:'Ajutor rapid pentru accident, pană sau defecțiune', icon:'🆘', cat:'Servicii Auto', kw:'asistenta rutiera tractare pana accident urgenta defectiune', go:()=>goTo('asistenta')},
  {title:'Servicii de Stat', desc:'ghiseul.ro, DRPCIV, RAR, ANAF, ASF — toate într-un loc', icon:'🏛️', cat:'Servicii de Stat', kw:'stat oficial portal guvern institutii', go:()=>goTo('servicii-stat')},
  {title:'Premium', desc:'Mașini nelimitate, alerte avansate, SMS, AI nelimitat — 49 RON/an', icon:'👑', cat:'Premium', kw:'premium upgrade plata abonament pro pret 49 ron', go:()=>goTo('premium')},
  {title:'Legal & GDPR', desc:'Termeni și condiții, politică de confidențialitate', icon:'⚖️', cat:'Cont & Setări', kw:'legal gdpr termeni conditii confidentialitate', go:()=>goTo('legal')},
  {title:'Piese Auto', desc:'Comandă piese compatibile cu mașina ta', icon:'🛒', cat:'Întreținere', kw:'piese auto comanda autodoc magazin', go:()=>goTo('piese')},
  {title:'Anvelope', desc:'Dimensiuni, calendar sezonier, comandă, sfaturi presiune', icon:'🏎️', cat:'Întreținere', kw:'anvelope cauciucuri pneuri vara iarna roti', go:()=>goTo('anvelope')},
  {title:'Calculator Costuri Auto', desc:'Cât cheltuiești cu adevărat pe mașina ta pe an', icon:'💸', cat:'Servicii Auto', kw:'calculator costuri cheltuieli auto an buget', go:()=>goTo('costuri')},
  {title:'Mașini Electrice', desc:'Calculator autonomie, stații de încărcare, avantaje EV', icon:'⚡', cat:'Servicii Auto', kw:'masini electrice ev incarcare autonomie hibrid', go:()=>goTo('electric')},
  {title:'Prețuri Carburant', desc:'Prețuri România + calculator plin + hartă stații', icon:'⛽', cat:'Servicii Auto', kw:'preturi carburant benzina motorina statii peco combustibil', go:()=>goTo('peco')},
  {title:'Verificare Nr. Înmatriculare', desc:'RCA, Rovinietă și ITP după numărul de înmatriculare', icon:'🔍', cat:'Servicii Auto', kw:'verificare numar inmatriculare rca rovinieta itp placa nr', pop:true, go:()=>_aaGoScroll('verif-nr','verif-plate-input')},
  {title:'Asistent Vocal AI', desc:'Întreabă cu vocea — microfon continuu', icon:'🎙️', cat:'Agenți AI', kw:'asistent vocal microfon vorbire ai voce', go:()=>goTo('asistent')},
  {title:'Agenți AI', desc:'Echipa ta de 6 asistenți AI specializați, conectați la Claude', icon:'🧠', cat:'Agenți AI', kw:'agenti ai chat asistenti claude conversatie', pop:true, go:()=>goTo('agenti')},
  {title:'Setări', desc:'Profil, alerte SMS, notificări, configurare dashboard', icon:'⚙️', cat:'Cont & Setări', kw:'setari profil cont configurare', pop:true, go:()=>goTo('setari')},

  // GARAJ
  {title:'Adaugă mașină nouă', desc:'Scanează talonul cu OCR sau introdu manual datele', icon:'➕', cat:'Garaj', kw:'adauga masina talon ocr scanare vehicul nou garaj', go:()=>_aaGoThen('garaj', ()=>openM('add-car'))},
  {title:'Scanează talonul (OCR)', desc:'Fotografiază talonul și completăm automat datele', icon:'📸', cat:'Garaj', kw:'ocr talon scanare poza carte identitate vehicul civ', go:()=>_aaGoThen('garaj', ()=>openM('add-car'))},

  // DOCUMENTE PERSONALE
  {title:'Buletin / Carte de identitate', desc:'Scanează sau încarcă buletinul tău', icon:'🪪', cat:'Documente', kw:'buletin ci cnp identitate scanare', go:()=>_aaGoThen('docpersonale', ()=>docTab('buletin'))},
  {title:'Permis Auto', desc:'Scanează sau încarcă permisul de conducere', icon:'🚗', cat:'Documente', kw:'permis conducere auto scanare', go:()=>_aaGoThen('docpersonale', ()=>docTab('permis'))},
  {title:'Talon Mașină', desc:'Cartea de identitate a vehiculului, scanată și salvată', icon:'📄', cat:'Documente', kw:'talon civ carte identitate vehicul', go:()=>_aaGoThen('docpersonale', ()=>docTab('talon'))},
  {title:'Alte Documente', desc:'Facturi, contracte și alte fișiere personale', icon:'📁', cat:'Documente', kw:'fisiere facturi contracte altele documente diverse', go:()=>_aaGoThen('docpersonale', ()=>docTab('altele'))},

  // DOCUMENTE MAȘINĂ
  {title:'Export dosar mașină (PDF)', desc:'Generează raport PDF cu toate documentele — Premium', icon:'📄', cat:'Documente', kw:'export pdf dosar raport premium descarca', go:()=>_aaGoThen('documente', ()=>{ if (typeof exportDocarPDF === 'function') exportDocarPDF(); })},

  // ÎNTREȚINERE
  {title:'Istoric Service', desc:'Jurnalul intervențiilor la mașină — cost, furnizor, detalii', icon:'📋', cat:'Întreținere', kw:'service jurnal istoric interventii reparatii furnizor cost', go:()=>_aaGoThen('mentenanta', ()=>mntTab('istoric'))},
  {title:'Adaugă Intervenție Service', desc:'Schimb ulei, filtre, frâne, distribuție, revizie completă', icon:'➕', cat:'Întreținere', kw:'ulei filtre frane fata spate distributie revizie bujii baterie amortizoare interventie', go:()=>_aaGoThen('mentenanta', ()=>mntTab('istoric'))},
  {title:'Remindere Mentenanță', desc:'Notificări automate din kilometraj — 9 tipuri de intervenții', icon:'⏰', cat:'Întreținere', kw:'remindere reminder notificari km kilometraj automat', go:()=>_aaGoThen('mentenanta', ()=>mntTab('reminder'))},
  {title:'Jurnal Combustibil', desc:'Înregistrează alimentări și vezi consumul L/100km', icon:'⛽', cat:'Întreținere', kw:'combustibil benzina motorina consum alimentare jurnal plin', go:()=>_aaGoThen('mentenanta', ()=>mntTab('combustibil'))},
  {title:'Checklist Pre-Drum', desc:'Verifică mașina înainte de o călătorie lungă', icon:'✅', cat:'Întreținere', kw:'checklist drum verificare calatorie pregatire', go:()=>_aaGoThen('mentenanta', ()=>mntTab('checklist'))},
  {title:'Calendar Sezonier Anvelope', desc:'Alertă pentru schimbarea anvelopelor vară/iarnă', icon:'📅', cat:'Întreținere', kw:'calendar sezonier anvelope vara iarna schimbare cauciucuri', go:()=>goTo('anvelope')},
  {title:'Dimensiuni Anvelope', desc:'Află dimensiunile corecte pentru mașina ta', icon:'📐', cat:'Întreținere', kw:'dimensiuni anvelope marime roti', go:()=>goTo('anvelope')},
  {title:'Comandă Anvelope', desc:'Cumpără anvelope noi pentru mașina ta', icon:'🛒', cat:'Întreținere', kw:'comanda anvelope cauciucuri noi', go:()=>goTo('anvelope')},

  // SERVICII AUTO
  {title:'Programare ITP', desc:'Completează formularul și primești oferte de la stații ITP', icon:'📅', cat:'Servicii Auto', kw:'itp programare statii formular', go:()=>goTo('itp')},
  {title:'Ce verifică ITP-ul — Ghid complet', desc:'Defecte majore, minore și sfaturi de pregătire', icon:'✅', cat:'Servicii Auto', kw:'itp ghid defecte verificare pregatire majore minore', go:()=>goTo('itp')},
  {title:'Checklist Mecanic — Cumpărare SH', desc:'10 puncte de verificare de la un mecanic — 10 RON', icon:'📋', cat:'Servicii Auto', kw:'checklist mecanic second hand cumparare verificare masina', go:()=>goTo('verificare')},
  {title:'Stații de Încărcare EV', desc:'Hartă cu stații de încărcare în zona ta', icon:'⚡', cat:'Servicii Auto', kw:'statii incarcare ev electrice harta gps', go:()=>goTo('electric')},
  {title:'Calculator Autonomie EV', desc:'Calculează autonomia mașinii electrice', icon:'🔋', cat:'Servicii Auto', kw:'autonomie ev electric calculator baterie', go:()=>goTo('electric')},
  {title:'Avantaje EV în România', desc:'Beneficii fiscale și de utilizare pentru mașini electrice', icon:'📋', cat:'Servicii Auto', kw:'avantaje ev electric romania beneficii taxe', go:()=>goTo('electric')},
  {title:'Stații peco în zona mea', desc:'Hartă stații cu GPS și traseu Google Maps', icon:'🗺️', cat:'Servicii Auto', kw:'statii peco harta gps traseu benzinarie', go:()=>goTo('peco')},
  {title:'Evoluție prețuri carburant', desc:'Grafic prețuri din ultimele 30 de zile', icon:'📊', cat:'Servicii Auto', kw:'evolutie preturi carburant grafic istoric', go:()=>goTo('peco')},

  // VÂNZARE
  {title:'Publică anunț de vânzare', desc:'Selectează mașina și completează detaliile anunțului', icon:'📋', cat:'Vânzare', kw:'publica anunt vanzare pasul detalii', go:()=>goTo('vanzare')},
  {title:'Anunțurile mele', desc:'Vezi, editează sau șterge anunțurile tale de vânzare', icon:'📋', cat:'Vânzare', kw:'anunturile mele vanzare lista editeaza modifica sterge', go:()=>goTo('vanzare')},
  {title:'Estimare preț cu AI', desc:'Află o estimare realistă a prețului mașinii tale', icon:'🤖', cat:'Vânzare', kw:'estimare pret ai vanzare valoare masina', go:()=>goTo('vanzare')},

  // SERVICII DE STAT (deschid direct linkul oficial)
  {title:'Plată amenzi online', desc:'ghiseul.ro', icon:'💳', cat:'Servicii de Stat', kw:'amenzi plata ghiseul online', go:()=>statDeschide('https://www.ghiseul.ro/ghiseul/public/amenzi')},
  {title:'Impozit auto', desc:'ghiseul.ro', icon:'🏠', cat:'Servicii de Stat', kw:'impozit auto taxa locala', go:()=>statDeschide('https://www.ghiseul.ro/ghiseul/public')},
  {title:'Verificare amenzi', desc:'ghiseul.ro', icon:'👮', cat:'Servicii de Stat', kw:'verificare amenzi dosar puncte', go:()=>statDeschide('https://www.ghiseul.ro/ghiseul/public/dosar')},
  {title:'Tarif de trecere', desc:'erovinieta.ro', icon:'🛣️', cat:'Servicii de Stat', kw:'tarif trecere rovinieta info', go:()=>statDeschide('https://www.erovinieta.ro')},
  {title:'Programare online DRPCIV', desc:'Înmatriculări, permis auto', icon:'📅', cat:'Servicii de Stat', kw:'drpciv programare inmatriculare permis online', go:()=>statDeschide('https://programari.drpciv.ro')},
  {title:'Înmatriculare auto', desc:'drpciv.ro', icon:'🚗', cat:'Servicii de Stat', kw:'inmatriculare auto drpciv vehicul nou', go:()=>statDeschide('https://www.drpciv.ro')},
  {title:'Permis de conducere — preschimbare', desc:'drpciv.ro', icon:'🪪', cat:'Servicii de Stat', kw:'permis conducere preschimbare pierdut drpciv', go:()=>statDeschide('https://www.drpciv.ro')},
  {title:'Cumpără Rovinietă', desc:'erovinieta.ro oficial', icon:'🛣️', cat:'Servicii de Stat', kw:'cumpara rovinieta oficial autostrada', go:()=>statDeschide('https://www.erovinieta.ro')},
  {title:'Verificare Rovinietă', desc:'erovinieta.ro', icon:'✅', cat:'Servicii de Stat', kw:'verificare rovinieta oficial valabilitate', go:()=>statDeschide('https://www.erovinieta.ro')},
  {title:'Verificare ITP oficial', desc:'RAR autorizat', icon:'🔬', cat:'Servicii de Stat', kw:'verificare itp rar oficial', go:()=>statDeschide('https://www.rarom.ro')},
  {title:'Verificare RCA oficial', desc:'AIDA — BAAR oficial', icon:'🔍', cat:'Servicii de Stat', kw:'verificare rca aida baar oficial polita', go:()=>statDeschide('https://www.aida.info.ro/polite-rca')},
  {title:'RAR România', desc:'Registrul Auto Român', icon:'🔧', cat:'Servicii de Stat', kw:'rar registrul auto roman', go:()=>statDeschide('https://www.rarom.ro')},
  {title:'Carte identitate vehicul', desc:'RAR — MRCR', icon:'📋', cat:'Servicii de Stat', kw:'carte identitate vehicul civ rar mrcr', go:()=>statDeschide('https://www.rarom.ro')},
  {title:'Poliția Rutieră — Legislație', desc:'politiaromana.ro', icon:'🚔', cat:'Servicii de Stat', kw:'politia rutiera legislatie cod rutier lege', go:()=>statDeschide('https://www.politiaromana.ro/ro/rutiera/info-utile/legislatie')},
  {title:'Licență ARR', desc:'Transport rutier — arr.ro', icon:'🚛', cat:'Servicii de Stat', kw:'licenta arr transport rutier', go:()=>statDeschide('https://www.arr.ro')},
  {title:'ASF România', desc:'Autoritatea de Supraveghere Financiară', icon:'⚖️', cat:'Servicii de Stat', kw:'asf autoritate supraveghere financiara asigurari', go:()=>statDeschide('https://www.asfromania.ro')},
  {title:'BAAR', desc:'Biroul Asigurătorilor de Autovehicule din România', icon:'🏦', cat:'Servicii de Stat', kw:'baar birou asiguratori auto', go:()=>statDeschide('https://www.baar.ro')},
  {title:'ANAF', desc:'Taxe și impozite', icon:'📊', cat:'Servicii de Stat', kw:'anaf taxe impozite fiscal', go:()=>statDeschide('https://www.anaf.ro')},
  {title:'Ghișeul.ro', desc:'Portal servicii publice', icon:'🖥️', cat:'Servicii de Stat', kw:'ghiseul portal servicii publice', go:()=>statDeschide('https://www.ghiseul.ro')},

  // PREMIUM / LEGAL
  {title:'Informații Firmă', desc:'CUI, Registru, CAEN — AutoAssist SRL', icon:'🏢', cat:'Cont & Setări', kw:'firma cui registru caen date companie', go:()=>goTo('legal')},
  {title:'Termeni și Condiții', desc:'Regulile de utilizare a platformei', icon:'📜', cat:'Cont & Setări', kw:'termeni conditii reguli utilizare', go:()=>goTo('legal')},
  {title:'Politică de Confidențialitate', desc:'Cum sunt prelucrate datele tale — GDPR', icon:'🔒', cat:'Cont & Setări', kw:'confidentialitate gdpr date personale prelucrare', go:()=>goTo('legal')},

  // AGENȚI AI
  {title:'Agent Manager', desc:'Coordonează echipa de agenți AI', icon:'🧠', cat:'Agenți AI', kw:'agent manager coordonator general', go:()=>_aaSelAgent('manager')},
  {title:'Agent Auto & Service', desc:'Întrebări despre mentenanță și service', icon:'🚗', cat:'Agenți AI', kw:'agent auto service mentenanta intretinere reparatii', go:()=>_aaSelAgent('auto')},
  {title:'Agent Documente', desc:'Ajutor cu RCA, ITP, rovinietă și alte documente', icon:'📄', cat:'Agenți AI', kw:'agent documente rca itp rovinieta acte', go:()=>_aaSelAgent('documente')},
  {title:'Agent Juridic', desc:'Întrebări juridice legate de mașina ta', icon:'⚖️', cat:'Agenți AI', kw:'agent juridic legal lege drepturi', go:()=>_aaSelAgent('juridic')},
  {title:'Agent Vânzare', desc:'Ajutor la vânzarea mașinii tale', icon:'💰', cat:'Agenți AI', kw:'agent vanzare anunt masina pret', go:()=>_aaSelAgent('vanzare')},
  {title:'Agent ITP & Service', desc:'Întrebări despre ITP și programări service', icon:'🔬', cat:'Agenți AI', kw:'agent itp service programare', go:()=>_aaSelAgent('itp')},
  {title:'Conversație nouă cu AI', desc:'Începe o conversație nouă (cea curentă se arhivează)', icon:'✏️', cat:'Agenți AI', kw:'conversatie noua chat agent reset', go:()=>_aaGoThen('agenti', ()=>{ if (typeof newConversation === 'function') newConversation(); })},
  {title:'Conversații salvate', desc:'Vezi istoricul conversațiilor cu agenții AI', icon:'📂', cat:'Agenți AI', kw:'conversatii salvate istoric arhivate chat vechi', go:()=>_aaGoThen('agenti', ()=>{ if (typeof showConvHistory === 'function') showConvHistory(); })},
  {title:'Setări Voce (Asistent Vocal)', desc:'Configurează vocea asistentului vocal AI', icon:'🎛️', cat:'Agenți AI', kw:'setari voce asistent vocal tts pronuntie', go:()=>goTo('asistent')},

  // CONT & SETĂRI
  {title:'Profil Utilizator', desc:'Nume, email, telefon, localitate', icon:'👤', cat:'Cont & Setări', kw:'profil nume email telefon localitate date cont', go:()=>goTo('setari')},
  {title:'Alerte SMS', desc:'SMS cu 7 zile înainte de expirare RCA/ITP/Rovinietă — Premium', icon:'📱', cat:'Cont & Setări', kw:'sms alerte premium telefon notificare expirare', go:()=>_aaGoScroll('setari','card-sms')},
  {title:'Notificări & Alerte', desc:'Activează notificările push pentru documente', icon:'🔔', cat:'Cont & Setări', kw:'notificari alerte push email activare', go:()=>_aaGoScroll('setari','card-notif')},
  {title:'Configurare Dashboard', desc:'Alege ce apare pe pagina principală', icon:'🎛️', cat:'Cont & Setări', kw:'configurare dashboard widgets pagina principala personalizare', go:()=>_aaGoScroll('setari','card-dashcfg')},
  {title:'Contul meu', desc:'Detalii cont și autentificare', icon:'👤', cat:'Cont & Setări', kw:'cont autentificare login profil', go:()=>goTo('cont')},
  {title:'Deconectare', desc:'Ieși din contul tău AutoAssist', icon:'🚪', cat:'Cont & Setări', kw:'logout deconectare delogare exit', go:()=>{ if (typeof doLogout === 'function') doLogout(); }},
];

// ═══════════════════════════════════════════════════════
// LOGICA DE CĂUTARE
// ═══════════════════════════════════════════════════════

function _aaNorm(s){
  return (s || '').toLowerCase()
    .replace(/[ăâ]/g, 'a').replace(/î/g, 'i').replace(/[șş]/g, 's').replace(/[țţ]/g, 't')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function _aaEsc(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// Precalculăm textul normalizat pentru fiecare item (o singură dată)
(function _aaPrep(){
  SEARCH_INDEX.forEach(it => {
    it._t = _aaNorm(it.title);
    it._s = _aaNorm(it.title + ' ' + (it.desc || '') + ' ' + it.cat + ' ' + (it.kw || ''));
  });
})();

function _aaScore(item, tokens, normQuery){
  let score = 0;
  if (item._t === normQuery) score += 200;
  else if (item._t.startsWith(normQuery)) score += 120;
  else if (item._t.includes(normQuery)) score += 60;

  let allMatch = true;
  for (const t of tokens){
    if (item._t.includes(t)) score += 15;
    else if (item._s.includes(t)) score += 5;
    else allMatch = false;
  }
  if (!allMatch) return -1;
  score -= item.title.length * 0.04;
  return score;
}

function _aaFilter(query){
  const q = _aaNorm(query.trim());
  if (!q) return null;
  const tokens = q.split(/\s+/).filter(Boolean);
  const scored = [];
  for (const item of SEARCH_INDEX){
    const sc = _aaScore(item, tokens, q);
    if (sc >= 0) scored.push({item, sc});
  }
  scored.sort((a, b) => b.sc - a.sc);
  return scored.slice(0, 30).map(x => x.item);
}

// ─── Recente ───
function _aaGetRecent(){
  try { return JSON.parse(localStorage.getItem('aa_search_recent') || '[]'); }
  catch(e){ return []; }
}
function _aaAddRecent(title){
  let r = _aaGetRecent().filter(t => t !== title);
  r.unshift(title);
  r = r.slice(0, 5);
  try { localStorage.setItem('aa_search_recent', JSON.stringify(r)); } catch(e){}
}
function _aaDefaultList(){
  const recentTitles = _aaGetRecent();
  const byTitle = {};
  SEARCH_INDEX.forEach(it => byTitle[it.title] = it);
  const recentItems = recentTitles.map(t => byTitle[t]).filter(Boolean);
  const pop = SEARCH_INDEX.filter(it => it.pop && !recentTitles.includes(it.title));
  return recentItems.concat(pop).slice(0, 8);
}

// ─── State ───
let _searchResults = [];
let _searchSelIdx = 0;

function openSearch(){
  const ov = document.getElementById('search-overlay');
  if (!ov) return;
  ov.classList.add('open');
  document.body.style.overflow = 'hidden';
  const inp = document.getElementById('search-input');
  if (inp){ inp.value = ''; setTimeout(() => inp.focus(), 60); }
  renderSearch('');
}
function closeSearch(){
  const ov = document.getElementById('search-overlay');
  if (ov) ov.classList.remove('open');
  document.body.style.overflow = '';
}
function onSearchInput(val){ renderSearch(val); }

function renderSearch(query){
  const box = document.getElementById('search-results');
  if (!box) return;
  const trimmed = (query || '').trim();
  let list, label = null;

  if (!trimmed){
    list = _aaDefaultList();
    label = _aaGetRecent().length ? 'Recente & rapide' : 'Acces rapid';
  } else {
    list = _aaFilter(trimmed);
  }

  _searchResults = list;
  _searchSelIdx = 0;

  if (!list.length){
    box.innerHTML = '<div class="search-empty">🔍 Niciun rezultat pentru „' + _aaEsc(trimmed) + '"<br><span style="font-size:11px">Încearcă alți termeni — ex: „ulei", „rca", „vânzare", „rovinietă"</span></div>';
    return;
  }

  let html = '';
  if (label) html += '<div class="search-cat-label">' + label + '</div>';
  html += list.map((it, i) => `
    <div class="sr-item${i === 0 ? ' sel' : ''}" data-i="${i}" onclick="execSearchResult(${i})" onmouseenter="_aaSetSel(${i})">
      <div class="sr-icon">${it.icon}</div>
      <div class="sr-text">
        <div class="sr-title">${_aaEsc(it.title)}</div>
        <div class="sr-desc">${_aaEsc(it.desc || '')}</div>
      </div>
      <div class="sr-cat">${_aaEsc(it.cat)}</div>
    </div>`).join('');
  box.innerHTML = html;
}

function _aaSetSel(i){
  _searchSelIdx = i;
  document.querySelectorAll('.sr-item').forEach(el => el.classList.remove('sel'));
  const el = document.querySelector('.sr-item[data-i="' + i + '"]');
  if (el) el.classList.add('sel');
}
function _aaScrollSelIntoView(){
  const el = document.querySelector('.sr-item.sel');
  if (el) el.scrollIntoView({block: 'nearest'});
}

function execSearchResult(i){
  const it = _searchResults[i];
  if (!it) return;
  _aaAddRecent(it.title);
  closeSearch();
  try { it.go(); } catch(e){ console.error('AutoAssist search error:', e); }
}

function searchKeyNav(e){
  if (e.key === 'Escape'){ e.preventDefault(); closeSearch(); return; }
  if (e.key === 'ArrowDown'){
    e.preventDefault();
    if (_searchSelIdx < _searchResults.length - 1) _aaSetSel(_searchSelIdx + 1);
    _aaScrollSelIntoView();
    return;
  }
  if (e.key === 'ArrowUp'){
    e.preventDefault();
    if (_searchSelIdx > 0) _aaSetSel(_searchSelIdx - 1);
    _aaScrollSelIntoView();
    return;
  }
  if (e.key === 'Enter'){ e.preventDefault(); execSearchResult(_searchSelIdx); return; }
}

// ─── Shortcut-uri globale: Ctrl/Cmd+K oriunde, "/" când nu se scrie într-un câmp ───
document.addEventListener('keydown', function(e){
  const ov = document.getElementById('search-overlay');
  const isOpen = ov && ov.classList.contains('open');

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'){
    e.preventDefault();
    if (isOpen) closeSearch(); else openSearch();
    return;
  }
  if (e.key === '/' && !isOpen){
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    const typing = tag === 'INPUT' || tag === 'TEXTAREA' || (document.activeElement && document.activeElement.isContentEditable);
    if (!typing){ e.preventDefault(); openSearch(); }
  }
});
