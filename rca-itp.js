// ═══ RCA ═══
// ═══ SAFETY BROKER IFRAME ═══
function checkRcaScroll(el) {
  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
  if (atBottom) {
    const btn = document.getElementById('rca-gdpr-btn');
    const hint = document.getElementById('rca-scroll-hint');
    if (btn) {
      btn.disabled = false;
      btn.style.background = 'var(--accent)';
      btn.style.color = '#fff';
      btn.style.cursor = 'pointer';
    }
    if (hint) hint.style.display = 'none';
  }
}

function acceptRcaGdpr() {
  const modal = document.getElementById('rca-gdpr-modal');
  if (modal) modal.style.display = 'none';
  const container = document.getElementById('rca-iframe-container');
  if (container) container.style.display = 'block';
  window.scrollTo(0,0);

  // Încarcă scripturile Safety Broker doar acum (lazy load)
  if (!document.getElementById('sb-modal-css')) {
    const css = document.createElement('link');
    css.id = 'sb-modal-css';
    css.rel = 'stylesheet';
    css.href = 'https://insureframe.insuretech.ro/css/iframe-modal-core.css';
    document.head.appendChild(css);

    const s1 = document.createElement('script');
    s1.src = 'https://insureframe.insuretech.ro/js/iframe-modal-core.js';
    document.body.appendChild(s1);

    const s2 = document.createElement('script');
    s2.src = 'https://insureframe.insuretech.ro/js/iframe-communication.js';
    document.body.appendChild(s2);
  }

  const iframe = document.getElementById('insureframe');
  if (iframe) {
    const params = new URLSearchParams({
      initialize: 'true',
      primaryColor: '#4f7dff',
      mainBgColor: '#0d0d0d',
      logoSrc: 'https://www.autoassist.ro/logo.png',
      withHeader: 'false',
      parentLocation: '/asigurari',
      withAutoResize: 'true',
      gdprLink: 'https://www.autoassist.ro/gdpr',
      preContractualLink: 'https://www.autoassist.ro/informare',
      pidDocumentsLink: 'https://www.autoassist.ro/pid',
      containerFull: 'false',
      withModalInParent: 'true',
      parentNavigation: 'false',
      parentNotifications: 'false',
      websiteName: 'AutoAssist SRL',
      withMailValidation: 'true',
      withVendorSelection: 'true',
      theme: 'dark',
      stepperStyle: 'linear'
    });
    iframe.src = 'https://insureframe.insuretech.ro?' + params.toString();
  }
}

function resetRcaModal() {
  const modal = document.getElementById('rca-gdpr-modal');
  const container = document.getElementById('rca-iframe-container');
  if (modal) modal.style.display = 'block';
  if (container) container.style.display = 'none';
  // Reset iframe src
  const iframe = document.getElementById('insureframe');
  if (iframe) iframe.src = '';
}

function calcRCA(){
  const p=document.getElementById('rca-pl').value.trim();
  if(!p){alert('Introdu numărul de înmatriculare!');return;}
  autoFill('rca-pl','rca-inf');
  const asig=[{n:'Allianz',s:820},{n:'Euroins',s:780},{n:'Groupama',s:850},{n:'Omniasig',s:900},{n:'Generali',s:870},{n:'GRAWE',s:810},{n:'Uniqa',s:795}];
  const rows=asig.sort((a,b)=>a.s-b.s).map((a,i)=>{
    const disc=0;const fin=a.s;
    return`<tr${i===0?' style="background:rgba(0,232,154,0.04)"':''}><td>${i===0?'🏆 ':''}<strong>${a.n}</strong>${i===0?` <span style="background:rgba(79,125,255,0.18);color:var(--accent);font-size:10px;padding:2px 7px;border-radius:20px;font-weight:800">RECOMANDAT</span>`:''}</td><td style="font-family:'JetBrains Mono'">${a.s} RON</td><td><strong style="color:var(--accent);font-family:'Bebas Neue';font-size:20px;letter-spacing:1px">${fin} RON</strong></td><td><button class="btn btn-${i===0?'primary':'ghost'} btn-sm" onclick="cumpRCA('${a.n}',${fin})">Cumpără</button></td></tr>`;
  }).join('');
  document.getElementById('rca-tbl').innerHTML=`<thead><tr><th>Asigurător</th><th>Preț de referință</th><th>Prețul tău</th><th></th></tr></thead><tbody>${rows}</tbody>`;
  document.getElementById('rca-results').style.display='block';
  document.getElementById('rca-results').scrollIntoView({behavior:'smooth'});
}
function cumpRCA(name,pret){
  const urls={
    'Allianz':'https://www.allianz-tiriac.ro/asigurari/auto/rca',
    'Euroins':'https://www.euroins.ro/rca',
    'Groupama':'https://www.groupama.ro/produse/auto/rca',
    'Omniasig':'https://www.omniasig.ro/rca',
    'Generali':'https://www.generali.ro/asigurari/auto/rca',
    'GRAWE':'https://www.grawe.ro/rca',
    'Uniqa':'https://www.uniqa.ro/rca'
  };
  const url=urls[name]||'https://www.asigurari.ro';
  const ok=confirm('✅ Mergi la '+name+' pentru a finaliza achiziția!\n\nPreț: '+pret+' RON\n\nVei fi redirecționat către site-ul asigurătorului.\nApăsați OK pentru a continua.');
  if(ok) window.open(url,'_blank');
}

// ═══ ITP ═══
async function doSetNewPassword(){
  const p1=document.getElementById('new-pass-1').value;
  const p2=document.getElementById('new-pass-2').value;
  const err=document.getElementById('new-pass-err');
  const ok=document.getElementById('new-pass-ok');
  err.style.display='none'; ok.style.display='none';
  if(p1.length < 8){err.style.display='block';err.textContent='Parola trebuie să aibă cel puțin 8 caractere!';return;}
  if(p1 !== p2){err.style.display='block';err.textContent='Parolele nu coincid!';return;}
  const {error} = await supabaseClient.auth.updateUser({password: p1});
  if(error){err.style.display='block';err.textContent='Eroare: '+error.message;}
  else{
    ok.style.display='block';
    ok.textContent='✅ Parola a fost schimbată cu succes! Te poți loga acum.';
    setTimeout(()=>closeM('reset-new-pass'), 2500);
    showNotification('✅ Parolă schimbată!','Loghează-te cu noua parolă.');
  }
}
function toggleProfileMenu(){
  const menu = document.getElementById('profile-menu');
  const overlay = document.getElementById('profile-menu-overlay');
  if(!menu) return;
  const isOpen = menu.style.display !== 'none';
  if(isOpen){ closeProfileMenu(); }
  else {
    // Update name and email in menu
    if(currentUser){
      const nameEl = document.getElementById('pm-name');
      const emailEl = document.getElementById('pm-email');
      if(nameEl) nameEl.textContent = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Utilizator';
      if(emailEl) emailEl.textContent = currentUser.email || '';
    }
    menu.style.display = 'block';
    overlay.style.display = 'block';
  }
}
function closeProfileMenu(){
  const menu = document.getElementById('profile-menu');
  const overlay = document.getElementById('profile-menu-overlay');
  if(menu) menu.style.display = 'none';
  if(overlay) overlay.style.display = 'none';
}
function doLogout(){
  if(!supabaseClient) return;
  supabaseClient.auth.signOut().then(function(){
    currentUser = null;
    cars = [];
    showNotification('👋 Deconectat','La revedere!');
    setTimeout(function(){ window.location.href = window.location.pathname; }, 800);
  });
}
function userPillClick(){
  if(currentUser){ goTo('cont'); }
  else { openM('login'); }
}
function savePlateApiKey(){
  const key = document.getElementById('plate-api-key-input')?.value?.trim();
  if(key){ localStorage.setItem('plate-api-key', key); showNotification('✅ API Key salvat!','Recunoașterea automată după număr de înmatriculare este activată.'); }
}
// ═══ ITP — pagină informativă (fără parteneri): data de expirare, stații pe Google Maps, acte necesare ═══
function checkITPPremium(){ /* pagina ITP este gratuită */ }

function itpRenderStatus(){
  var box=document.getElementById('itp-status'), sel=document.getElementById('itp-car');
  if(!box||!sel) return;
  var c=(typeof cars!=='undefined')?cars.find(function(x){return String(x.id)===String(sel.value);}):null;
  if(!c){ box.innerHTML='Alege mașina ca să vezi când îți expiră ITP-ul.'; return; }
  var head='<div style="font-weight:700;color:var(--t1);margin-bottom:6px">'+c.brand+' '+c.model+(c.year?' ('+c.year+')':'')+' · '+c.plate+'</div>';
  var d=c.docs&&c.docs.itp;
  if(!d){
    box.innerHTML=head+'Nu ai completat data ITP pentru această mașină.<div style="margin-top:10px"><button class="btn btn-ghost btn-sm" onclick="openEditDocs('+c.id+')">✏️ Completează data</button></div>';
    return;
  }
  var days=Math.ceil((new Date(d)-new Date())/864e5);
  var col=days<=7?'var(--red)':days<=30?'var(--amber)':'var(--green)';
  var txt=days<0?'⛔ ITP expirat de '+Math.abs(days)+' zile':days===0?'⚠️ ITP expiră azi':'ITP valabil încă '+days+' zile';
  box.innerHTML=head+'<div style="font-size:15px;font-weight:700;color:'+col+'">'+txt+'</div>'
    +'<div style="font-size:12px;color:var(--t3);margin:3px 0 10px">Data expirării: '+d+'</div>'
    +(typeof renewBtn==='function'?renewBtn(c.id,'itp'):'');
}
function itpSelectCar(sel){ itpRenderStatus(); }

function itpGeoLoc(){
  var status=document.getElementById('itp-loc-status');
  if(!navigator.geolocation){status.innerHTML='<span style="color:var(--red)">GPS indisponibil pe acest dispozitiv. Scrie orașul manual.</span>';return;}
  status.innerHTML='<span style="color:var(--amber)">⏳ Detectăm locația...</span>';
  navigator.geolocation.getCurrentPosition(
    function(pos){
      var lat=pos.coords.latitude, lon=pos.coords.longitude;
      window._itpCoords={lat:lat,lon:lon};
      fetch('https://nominatim.openstreetmap.org/reverse?lat='+lat+'&lon='+lon+'&format=json&accept-language=ro')
        .then(function(r){return r.json();}).then(function(d){
          var a=d.address||{}; var city=a.city||a.town||a.village||a.county||'';
          document.getElementById('itp-loc').value=city;
          window._itpCoords={lat:lat,lon:lon};   // inputul și-a resetat coordonatele la modificare; le refac
          status.innerHTML='<span style="color:var(--green)">📍 Locație detectată'+(city?': '+city:'')+'</span>';
        }).catch(function(){ status.innerHTML='<span style="color:var(--green)">📍 Locație detectată</span>'; });
    },
    function(){status.innerHTML='<span style="color:var(--red)">Accesul la locație a fost refuzat. Scrie orașul manual.</span>';}
  );
}

function itpOpenMaps(){
  var loc=(document.getElementById('itp-loc').value||'').trim();
  var co=window._itpCoords;
  if(!loc && !co){ if(typeof showNotification==='function') showNotification('⚠️ Locație lipsă','Scrie orașul tău sau apasă „Locația mea".'); return; }
  var q=encodeURIComponent('stație ITP autorizată RAR'+(loc?' '+loc:''));
  var url='https://www.google.com/maps/search/'+q+(co?'/@'+co.lat+','+co.lon+',13z':'');
  window.open(url,'_blank','noopener');
}
