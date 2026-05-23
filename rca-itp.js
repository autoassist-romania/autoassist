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

  // Scripturile Safety Broker sunt deja preincarcate in resetRcaModal

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
  const iframe = document.getElementById('insureframe');
  if (iframe) iframe.src = '';
  // Preincarca scripturile Safety Broker in background (elimina delay la GDPR)
  if (!document.getElementById('sb-modal-css')) {
    const css = document.createElement('link');
    css.id = 'sb-modal-css'; css.rel = 'stylesheet';
    css.href = 'https://insureframe.insuretech.ro/css/iframe-modal-core.css';
    document.head.appendChild(css);
    const s1 = document.createElement('script');
    s1.src = 'https://insureframe.insuretech.ro/js/iframe-modal-core.js';
    document.body.appendChild(s1);
    const s2 = document.createElement('script');
    s2.src = 'https://insureframe.insuretech.ro/js/iframe-communication.js';
    document.body.appendChild(s2);
  }
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
function checkITPPremium(){
  var lock=document.getElementById('itp-premium-lock');
  if(!lock) return;
  var isPremium = (typeof currentUser !== 'undefined' && currentUser && currentUser.premium) || false;
  lock.style.display = isPremium ? 'none' : 'flex';
}
function itpGeoLoc(){
  const status=document.getElementById('itp-loc-status');
  if(!navigator.geolocation){status.innerHTML='<span style="color:var(--red)">GPS indisponibil pe acest dispozitiv.</span>';return;}
  status.innerHTML='<span style="color:var(--amber)">⏳ Detectăm locația...</span>';
  navigator.geolocation.getCurrentPosition(
    pos=>{
      const lat=pos.coords.latitude, lon=pos.coords.longitude;
      fetch('https://nominatim.openstreetmap.org/reverse?lat='+lat+'&lon='+lon+'&format=json&accept-language=ro')
        .then(r=>r.json()).then(d=>{
          const city=d.address.city||d.address.town||d.address.village||d.address.county||'';
          const road=d.address.road||'';
          const loc=(road?road+', ':'')+city;
          document.getElementById('itp-loc').value=loc;
          status.innerHTML='<span style="color:var(--green)">📍 Locație detectată: '+city+'</span>';
          itpLoadStations(city);
        }).catch(()=>{status.innerHTML='<span style="color:var(--red)">Nu am putut determina orașul. Introdu manual.</span>';});
    },
    ()=>{status.innerHTML='<span style="color:var(--red)">Accesul la GPS refuzat. Introdu locația manual.</span>';}
  );
}
function itpSelectCar(sel){
  const val=sel.value;
  const info=document.getElementById('itp-car-info');
  if(!val){info.style.display='none';return;}
  const c=cars.find(x=>String(x.id)===String(val));
  if(!c){info.style.display='none';return;}
  info.style.display='block';
  info.innerHTML='🚗 '+c.brand+' '+c.model+(c.year?' ('+c.year+')':'')+' · '+c.plate+(c.km?' · '+c.km.toLocaleString()+' km':'');
  document.getElementById('itp-plate-manual').value=c.plate;
}
function itpLoadStations(city){
  var list=document.getElementById('itp-stations-list');
  var label=document.getElementById('itp-zone-label');
  if(city) label.innerHTML='<span style="color:var(--green)">📍 '+city+'</span>';
  list.innerHTML='<div style="text-align:center;padding:16px;color:var(--t3)">⏳ Căutăm stații în '+city+'...</div>';
  setTimeout(function(){
    var q=encodeURIComponent('statie ITP autorizata RAR '+city);
    var c=city;
    function makeCard(ico,name,pret,rating){
      var d=document.createElement('div');
      d.className='serv-card';
      d.innerHTML='<div class="serv-ico">'+ico+'</div>'
        +'<div style="flex:1"><div style="font-size:13px;font-weight:700">'+name+'</div>'
        +'<div style="font-size:11px;color:var(--t2);margin-top:2px">📍 '+c+' · ⭐ '+rating+'</div>'
        +'<div style="font-size:12px;color:var(--green);font-weight:700;margin-top:3px">'+pret+' · Te contactează ei</div></div>'
        +'<button class="btn btn-green btn-sm">Selectează</button>';
      function doSelect(){selectITP(d,name,c,pret,rating);}
      d.addEventListener('click',doSelect);
      d.querySelector('button').addEventListener('click',function(e){e.stopPropagation();doSelect();});
      return d;
    }
    list.innerHTML='';
    list.appendChild(makeCard('🏛️','RAR '+c+' — Stație autorizată','~50-80 RON','4.8'));
    list.appendChild(makeCard('🔧','Service ITP '+c,'~40-70 RON','4.5'));
    var a=document.createElement('a');
    a.href='https://www.google.com/maps/search/'+q;
    a.target='_blank';
    a.className='btn btn-ghost btn-sm';
    a.style.cssText='display:block;margin-top:8px;text-decoration:none;text-align:center';
    a.textContent='🗺️ Vezi toate pe Google Maps →';
    list.appendChild(a);
  }, 800);
}
function progITP(){
  const loc=document.getElementById('itp-loc').value.trim();
  const tel=document.getElementById('itp-tel').value.trim();
  const date=document.getElementById('itp-date').value;
  const time=document.getElementById('itp-time').value;
  const plate=document.getElementById('itp-plate-manual').value.trim()||document.getElementById('itp-car').options[document.getElementById('itp-car').selectedIndex]?.text||'';
  if(!loc){showNotification('⚠️ Locație lipsă','Introdu orașul tău sau apasă 📍 Locația mea!');return;}
  if(!tel){showNotification('⚠️ Telefon lipsă','Introdu numărul de telefon — service-ul te va contacta!');return;}
  itpLoadStations(loc);
  const result=document.getElementById('itp-result');
  result.innerHTML='<div style="padding:14px;background:rgba(0,232,154,0.1);border:1px solid rgba(0,232,154,0.25);border-radius:var(--rs)">'
    +'<div style="font-weight:800;color:var(--green);margin-bottom:8px">✅ Cerere trimisă stațiilor ITP din '+loc+'!</div>'
    +'<div style="font-size:12px;color:var(--t2);line-height:1.7">'
    +(plate?'🚗 Mașina: <strong>'+plate+'</strong><br>':'')
    +'📞 Telefon: <strong>'+tel+'</strong><br>'
    +(date?'📅 Data: <strong>'+date+' · '+time+'</strong><br>':'')
    +'⏱️ <strong>Stațiile ITP din zonă te vor contacta</strong> pentru confirmare și preț final.<br>'
    +'🏷️ Menționează că vii prin <strong style="font-family:\'JetBrains Mono\'">AutoAssist</strong>!'
    +'</div></div>';
  showNotification('📞 Cerere ITP trimisă!','Stațiile din '+loc+' te contactează în curând!');
}
function selectITP(el,name,addr,pret,rating){
  document.querySelectorAll('.serv-card').forEach(s=>s.style.borderColor='var(--b1)');
  if(el) el.style.borderColor='var(--accent)';
  const tel=document.getElementById('itp-tel').value.trim();
  const plate=document.getElementById('itp-plate-manual').value.trim();
  const loc=document.getElementById('itp-loc').value.trim();
  const ok=confirm('🔬 Programare ITP la '+name+'!\n📍 '+addr+'\n💰 Preț estimat: '+pret+'\n⭐ Rating: '+rating+(tel?'\n📞 Tel tău: '+tel:'')+(plate?'\n🚗 Mașina: '+plate:'')+'\n\nService-ul te va suna pentru confirmare.\nOK = deschide pe Google Maps');
  if(ok){
    const q=encodeURIComponent(name+' '+loc);
    window.open('https://www.google.com/maps/search/'+q,'_blank');
    showNotification('✅ Programare ITP!',name+' te contactează în curând. Cod: PREMIUM');
  }
}

